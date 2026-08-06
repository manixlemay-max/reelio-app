// Integration with HeyGen (heygen.com) — AI video generation.
// Docs used to build this: https://developers.heygen.com/docs/quick-start
//
// Flow: prompt -> Video Agent session -> video_id -> poll video status.
// This is async and can take longer than a single request, so generateVideo()
// only *starts* the job and returns "pending". A separate checkVideoProgress()
// call (used by /api/videos/[id]/refresh) polls until it's done.

const HEYGEN_BASE = process.env.VIDEO_PROVIDER_API_URL || "https://api.heygen.com";

type GenerateVideoInput = {
  productName: string;
  productDescription: string;
  imageUrl?: string | null;
};

type GenerateVideoResult = {
  status: "ready" | "pending" | "failed";
  videoUrl: string | null;
  provider: string;
  externalJobId?: string | null;
};

function heygenHeaders(apiKey: string, extra?: Record<string, string>) {
  return { "X-Api-Key": apiKey, ...(extra ?? {}) };
}

export async function generateVideo(input: GenerateVideoInput): Promise<GenerateVideoResult> {
  const apiKey = process.env.VIDEO_PROVIDER_API_KEY;

  if (!apiKey) {
    // Demo mode: no key configured yet -> return a sample video hosted on this
    // same app (public/demo-video.mp4) so the rest of the product (dashboard,
    // scheduling, analytics, and the real Postiz posting flow) can be tested
    // without a paid provider AND without depending on a third-party host that
    // might block server-to-server fetches (some hosts return 403 to fetches
    // without a browser-like origin).
    // Prefer an explicitly configured public URL, then Vercel's stable
    // production domain, then the per-deployment URL, then localhost.
    // (The per-deployment VERCEL_URL can be behind Vercel's deployment
    // protection even when the main domain isn't, which would block our
    // own server from fetching its own file.)
    const appUrl =
      process.env.NEXT_PUBLIC_APP_URL ||
      (process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : null) ||
      (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null) ||
      "http://localhost:3000";
    return {
      status: "ready",
      videoUrl: `${appUrl}/demo-video.mp4`,
      provider: "mock",
    };
  }

  const prompt = `A short, energetic UGC-style product video (under 30 seconds) for an
e-commerce product called "${input.productName}". Product description: ${input.productDescription}.
The video should feel like an authentic social media video promoting this product, with an
enthusiastic presenter highlighting what makes it worth buying.`;

  const res = await fetch(`${HEYGEN_BASE}/v3/video-agents`, {
    method: "POST",
    headers: heygenHeaders(apiKey, { "Content-Type": "application/json" }),
    body: JSON.stringify({ prompt }),
  });

  if (!res.ok) {
    return { status: "failed", videoUrl: null, provider: "heygen" };
  }

  const data = await res.json();
  const sessionId = data?.data?.session_id ?? null;

  if (!sessionId) {
    return { status: "failed", videoUrl: null, provider: "heygen" };
  }

  return { status: "pending", videoUrl: null, provider: "heygen", externalJobId: sessionId };
}

type ProgressResult = { status: "ready" | "pending" | "failed"; videoUrl: string | null };

// Called by /api/videos/[id]/refresh to check on a job started by generateVideo().
export async function checkVideoProgress(sessionId: string): Promise<ProgressResult> {
  const apiKey = process.env.VIDEO_PROVIDER_API_KEY;
  if (!apiKey) return { status: "failed", videoUrl: null };

  // Step 1: does the session have a video_id yet?
  const sessionRes = await fetch(`${HEYGEN_BASE}/v3/video-agents/${sessionId}`, {
    headers: heygenHeaders(apiKey),
  });
  if (!sessionRes.ok) return { status: "pending", videoUrl: null };

  const sessionData = await sessionRes.json();
  const videoId = sessionData?.data?.video_id ?? null;
  if (!videoId) return { status: "pending", videoUrl: null };

  // Step 2: is the video itself done rendering?
  const videoRes = await fetch(`${HEYGEN_BASE}/v3/videos/${videoId}`, {
    headers: heygenHeaders(apiKey),
  });
  if (!videoRes.ok) return { status: "pending", videoUrl: null };

  const videoData = await videoRes.json();
  const status = videoData?.data?.status;

  if (status === "completed") {
    return { status: "ready", videoUrl: videoData?.data?.video_url ?? null };
  }
  if (status === "failed") {
    return { status: "failed", videoUrl: null };
  }
  return { status: "pending", videoUrl: null };
}
