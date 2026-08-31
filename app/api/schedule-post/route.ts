import { NextRequest, NextResponse } from "next/server";
import { schedulePost } from "@/lib/postingProvider";
import { createPost, getVideo, getProduct, getLead } from "@/lib/db";
import type { Platform } from "@/lib/types";
import { isDashboardAuthed } from "@/lib/auth";

export const maxDuration = 60;

function integrationIdForPlatform(
  lead: { tiktokIntegrationId: string | null; instagramIntegrationId: string | null; youtubeIntegrationId: string | null },
  platform: Platform
): string | null {
  if (platform === "tiktok") return lead.tiktokIntegrationId;
  if (platform === "instagram") return lead.instagramIntegrationId;
  if (platform === "youtube") return lead.youtubeIntegrationId;
  return null;
}

export async function POST(req: NextRequest) {
  if (!(await isDashboardAuthed(req))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const video = await getVideo(body.videoId);
  if (!video || !video.videoUrl) {
    return NextResponse.json({ error: "Video not found or not ready yet" }, { status: 404 });
  }

  // If this product belongs to a specific client, make sure we post to
  // THAT client's own connected account instead of a random one.
  let integrationId: string | null = null;
  const product = await getProduct(video.productId);
  if (product?.leadId) {
    const lead = await getLead(product.leadId);
    if (!lead) {
      return NextResponse.json({ error: "Linked client not found" }, { status: 404 });
    }
    integrationId = integrationIdForPlatform(lead, body.platform);
    if (!integrationId) {
      return NextResponse.json(
        {
          error: `${lead.businessName} doesn't have a ${body.platform} account connected yet. Go to Dashboard > Clients and link it first.`,
        },
        { status: 400 }
      );
    }
  }

  const result = await schedulePost({
    videoUrl: video.videoUrl,
    platform: body.platform,
    hashtags: body.hashtags ?? "",
    scheduledAt: body.scheduledAt,
    integrationId,
  });

  const post = await createPost({
    videoId: video.id,
    platform: body.platform,
    hashtags: body.hashtags ?? "",
    scheduledAt: body.scheduledAt,
    status: result.status === "scheduled" ? "scheduled" : "failed",
  });

  if (result.status === "failed") {
    return NextResponse.json({ post, error: result.error }, { status: 502 });
  }

  return NextResponse.json({ post }, { status: 201 });
}
