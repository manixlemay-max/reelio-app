import { NextRequest, NextResponse } from "next/server";

const HEYGEN_BASE = process.env.VIDEO_PROVIDER_API_URL || "https://api.heygen.com";

// Temporary diagnostic route — not linked from anywhere in the UI. Lets us see
// the raw HeyGen response for a job that failed, since the app only stores a
// simplified status. Safe to delete once we've debugged the current issue.
export async function GET(req: NextRequest) {
  const apiKey = process.env.VIDEO_PROVIDER_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "VIDEO_PROVIDER_API_KEY not set" }, { status: 500 });
  }

  const jobId = req.nextUrl.searchParams.get("jobId");
  if (!jobId) {
    return NextResponse.json({ error: "jobId query param required" }, { status: 400 });
  }

  const headers = { "X-Api-Key": apiKey };
  const out: Record<string, unknown> = { jobId };

  if (jobId.startsWith("agent:")) {
    const sessionId = jobId.slice("agent:".length);
    const sessionRes = await fetch(`${HEYGEN_BASE}/v3/video-agents/${sessionId}`, { headers });
    const sessionData = await sessionRes.json().catch(() => null);
    out.sessionStatus = sessionRes.status;
    out.sessionData = sessionData;

    const videoId = sessionData?.data?.video_id ?? null;
    out.videoId = videoId;
    if (videoId) {
      const videoRes = await fetch(`${HEYGEN_BASE}/v3/videos/${videoId}`, { headers });
      const videoData = await videoRes.json().catch(() => null);
      out.videoStatus = videoRes.status;
      out.videoData = videoData;
    }
  } else {
    const videoId = jobId.startsWith("avatar:") ? jobId.slice("avatar:".length) : jobId;
    const videoRes = await fetch(`${HEYGEN_BASE}/v3/videos/${videoId}`, { headers });
    const videoData = await videoRes.json().catch(() => null);
    out.videoStatus = videoRes.status;
    out.videoData = videoData;
  }

  return NextResponse.json(out);
}
