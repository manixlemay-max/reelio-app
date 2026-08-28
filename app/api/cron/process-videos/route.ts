import { NextRequest, NextResponse } from "next/server";
import { checkVideoProgress } from "@/lib/videoProvider";
import { schedulePost, suggestBestPostingTime } from "@/lib/postingProvider";
import {
  listVideos,
  updateVideo,
  getProduct,
  getLead,
  createPost,
  hasPostForVideoPlatform,
  getAnalyticsForLead,
} from "@/lib/db";
import type { Platform } from "@/lib/types";
import { buildSmartCaption } from "@/lib/caption";

// Used when a client has no posting history yet to learn from — a generally
// solid UGC engagement window. Replaced by their own data once they have some.
const DEFAULT_BEST_HOUR_UTC = 18;

// Next time this UTC hour occurs — today if it hasn't passed yet (with a
// 5-minute buffer so we don't schedule something 30 seconds from now),
// otherwise tomorrow.
function nextOccurrenceOfHour(hour: number): string {
  const now = new Date();
  const candidate = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), hour, 0, 0));
  if (candidate.getTime() <= now.getTime() + 5 * 60_000) {
    candidate.setUTCDate(candidate.getUTCDate() + 1);
  }
  return candidate.toISOString();
}

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

    const hashtags = buildSmartCaption(product.name, product.description);

    // Data-driven timing: use this client's own best-performing hour per
    // platform once we have enough history, otherwise a sensible default —
    // never just "post immediately, whatever time it happens to be".
    const analyticsForLead = await getAnalyticsForLead(lead.id);
    const bestTimes = suggestBestPostingTime(analyticsForLead);

    for (const p of platforms) {
      if (!p.integrationId) continue; // client hasn't connected this platform (yet)
      const already = await hasPostForVideoPlatform(video.id, p.platform);
      if (already) continue;

      const bestForPlatform = bestTimes.find((b) => b.platform === p.platform);
      const targetHour = bestForPlatform ? bestForPlatform.hour : DEFAULT_BEST_HOUR_UTC;
      const scheduledAt = nextOccurrenceOfHour(targetHour);

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
