import { NextRequest, NextResponse } from "next/server";
import { schedulePost } from "@/lib/postingProvider";
import { createPost, getVideo } from "@/lib/db";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const video = await getVideo(body.videoId);
  if (!video || !video.videoUrl) {
    return NextResponse.json({ error: "Video not found or not ready yet" }, { status: 404 });
  }

  const result = await schedulePost({
    videoUrl: video.videoUrl,
    platform: body.platform,
    hashtags: body.hashtags ?? "",
    scheduledAt: body.scheduledAt,
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
