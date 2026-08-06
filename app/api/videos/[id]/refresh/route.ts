import { NextRequest, NextResponse } from "next/server";
import { checkVideoProgress } from "@/lib/videoProvider";
import { getVideo, updateVideo } from "@/lib/db";

export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const video = await getVideo(id);
  if (!video) {
    return NextResponse.json({ error: "Video not found" }, { status: 404 });
  }

  if (video.status !== "pending" || !video.externalJobId) {
    return NextResponse.json({ video });
  }

  const progress = await checkVideoProgress(video.externalJobId);
  if (progress.status !== "pending") {
    await updateVideo(id, { status: progress.status, videoUrl: progress.videoUrl });
  }

  return NextResponse.json({
    video: { ...video, status: progress.status, videoUrl: progress.videoUrl ?? video.videoUrl },
  });
}
