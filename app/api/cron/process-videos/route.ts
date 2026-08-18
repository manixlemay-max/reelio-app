import { NextRequest, NextResponse } from "next/server";
import { checkVideoProgress } from "@/lib/videoProvider";
import { schedulePost } from "@/lib/postingProvider";
import { listVideos, updateVideo, getProduct, getLead, createPost, hasPostForVideoPlatform } from "@/lib/db";
import type { Platform } from "@/lib/types";

// Runs on a schedule (see vercel.json). For every client video: checks if a
// still-rendering video is done yet, and the moment it's ready, posts it
// automatically to every social account that client has connected — no
// click from Manix required. Safe to run repeatedly: it never re-posts a
// video to a platform it already posted it to, and it skips videos that
// aren't tied to a client (e.g. manual test videos from the dashboard).
export const maxDuration = 60;

function authorized(req: NextRequest): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return true; // no secret configured yet -> don't block the feature
  return req.headers.get("authorization") === `Bearer ${secret}`;
}

function buildCaption(productName: string, productDescription: string): string {
  const desc = productDescription.trim().slice(0, 200);
  return `${productName} ✨ ${desc}\n\n#ugc #ai`.slice(0, 500);
}

export async function GET(req: NextRequest) {
  if (!authorized(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const videos = await listVideos();
  const log: string[] = [];

  for (const video of videos) {
    let status = video.status;
    let videoUrl = video.videoUrl;

    // Still rendering? Check HeyGen for an update.
    if (status === "pending" && video.externalJobId) {
      const progress = await checkVideoProgress(video.externalJobId);
      if (progress.status !== "pending") {
        await updateVideo(video.id, { status: progress.status, videoUrl: progress.videoUrl });
        status = progress.status;
        videoUrl = progress.videoUrl;
        log.push(`${video.id}: status -> ${status}`);
      }
    }

    if (status !== "ready" || !videoUrl) continue;

    // Only auto-post videos tied to a real client. Manual test videos made
    // from the dashboard (no linked client) are left alone on purpose.
    const product = await getProduct(video.productId);
    if (!product?.leadId) continue;

    const lead = await getLead(product.leadId);
    if (!lead) continue;

    const platforms: { platform: Platform; integrationId: string | null }[] = [
      { platform: "tiktok", integrationId: lead.tiktokIntegrationId },
      { platform: "instagram", integrationId: lead.instagramIntegrationId },
      { platform: "youtube", integrationId: lead.youtubeIntegrationId },
    ];

    const hashtags = buildCaption(product.name, product.description);
    const scheduledAt = new Date().toISOString();

    for (const p of platforms) {
      if (!p.integrationId) continue; // client hasn't connected this platform (yet)
      const already = await hasPostForVideoPlatform(video.id, p.platform);
      if (already) continue;

      const result = await schedulePost({
        videoUrl,
        platform: p.platform,
        hashtags,
        scheduledAt,
        integrationId: p.integrationId,
      });
      await createPost({
        videoId: video.id,
        platform: p.platform,
        hashtags,
        scheduledAt,
        status: result.status === "scheduled" ? "scheduled" : "failed",
      });
      log.push(`${video.id}: auto-posted to ${p.platform} -> ${result.status}${result.error ? " (" + result.error + ")" : ""}`);
    }
  }

  return NextResponse.json({ ok: true, checked: videos.length, log });
}
