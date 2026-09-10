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

// Temporary: trigger a fresh explicit-avatar generation to compare against
// the Video Agent flow. Not linked from the UI — for debugging only.
export async function POST(req: NextRequest) {
  const apiKey = process.env.VIDEO_PROVIDER_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "VIDEO_PROVIDER_API_KEY not set" }, { status: 500 });
  }
  const body = await req.json();
  const { avatarId, voiceId, productName, productDescription } = body;
  if (!avatarId || !productName || !productDescription) {
    return NextResponse.json({ error: "avatarId, productName, productDescription required" }, { status: 400 });
  }

  const script = `Hey! I have to tell you about ${productName}. ${productDescription} Honestly, it's been such a game changer for me — you have to try it for yourself. Grab yours today!`;

  const res = await fetch(`${HEYGEN_BASE}/v3/videos`, {
    method: "POST",
    headers: { "X-Api-Key": apiKey, "Content-Type": "application/json" },
    body: JSON.stringify({
      type: "avatar",
      avatar_id: avatarId,
      script,
      voice_id: voiceId || undefined,
      resolution: "1080p",
      aspect_ratio: "9:16",
      title: `${productName} — debug test`,
      caption: { file_format: "srt", style: "default" },
    }),
  });

  const data = await res.json().catch(() => null);
  return NextResponse.json({ status: res.status, ok: res.ok, data });
}
