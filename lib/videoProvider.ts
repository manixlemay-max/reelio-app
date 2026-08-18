// Integration with HeyGen (heygen.com) — AI video generation.
// Docs used to build this: https://developers.heygen.com/docs/quick-start
//
// Two ways to generate a video:
// 1. Video Agent (default, no avatar chosen): prompt -> HeyGen picks everything
//    (avatar, voice, scene) -> video. Async: POST /v3/video-agents returns a
//    session_id, which we poll for a video_id, which we then poll for status.
// 2. Explicit avatar (when the dashboard user picks one from the avatar
//    picker): POST /v3/videos with type "avatar", a specific avatar_id, a
//    script we write, and that avatar's default voice_id. This returns a
//    video_id directly (no session step).
//
// Both flows converge on the same GET /v3/videos/{video_id} status endpoint,
// so checkVideoProgress() just needs to know which flow started the job. We
// tag externalJobId with a small prefix ("avatar:" or "agent:") to remember.

const HEYGEN_BASE = process.env.VIDEO_PROVIDER_API_URL || "https://api.heygen.com";

type GenerateVideoInput = {
  productName: string;
  productDescription: string;
  imageUrl?: string | null;
  // If set (from the avatar picker in the dashboard), use the explicit
  // avatar flow instead of letting HeyGen's Video Agent auto-pick one.
  avatarId?: string | null;
  voiceId?: string | null;
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

  // --- Explicit avatar chosen in the dashboard ---
  if (input.avatarId) {
    const script = `Hey! I have to tell you about ${input.productName}. ${input.productDescription} Honestly, it's been such a game changer for me — you have to try it for yourself. Grab yours today!`;

    const res = await fetch(`${HEYGEN_BASE}/v3/videos`, {
      method: "POST",
      headers: heygenHeaders(apiKey, { "Content-Type": "application/json" }),
      body: JSON.stringify({
        type: "avatar",
        avatar_id: input.avatarId,
        script,
        voice_id: input.voiceId || undefined,
        resolution: "1080p",
        aspect_ratio: "9:16",
        title: `${input.productName} — Reelio UGC video`,
      }),
    });

    if (!res.ok) {
      return { status: "failed", videoUrl: null, provider: "heygen" };
    }

    const data = await res.json();
    const videoId = data?.data?.video_id ?? null;
    if (!videoId) {
      return { status: "failed", videoUrl: null, provider: "heygen" };
    }

    return { status: "pending", videoUrl: null, provider: "heygen", externalJobId: `avatar:${videoId}` };
  }

  // --- Default: Video Agent picks the avatar/voice/scene automatically ---
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

  return { status: "pending", videoUrl: null, provider: "heygen", externalJobId: `agent:${sessionId}` };
}

type ProgressResult = { status: "ready" | "pending" | "failed"; videoUrl: string | null };

async function pollVideoStatus(apiKey: string, videoId: string): Promise<ProgressResult> {
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

// Called by /api/videos/[id]/refresh to check on a job started by generateVideo().
export async function checkVideoProgress(jobId: string): Promise<ProgressResult> {
  const apiKey = process.env.VIDEO_PROVIDER_API_KEY;
  if (!apiKey) return { status: "failed", videoUrl: null };

  // Explicit avatar flow: jobId is already a video_id, just poll it.
  if (jobId.startsWith("avatar:")) {
    return pollVideoStatus(apiKey, jobId.slice("avatar:".length));
  }

  // Video Agent flow (also handles jobIds saved before this prefix existed,
  // which are all Video Agent sessions): session -> video_id -> status.
  const sessionId = jobId.startsWith("agent:") ? jobId.slice("agent:".length) : jobId;

  const sessionRes = await fetch(`${HEYGEN_BASE}/v3/video-agents/${sessionId}`, {
    headers: heygenHeaders(apiKey),
  });
  if (!sessionRes.ok) return { status: "pending", videoUrl: null };

  const sessionData = await sessionRes.json();
  const videoId = sessionData?.data?.video_id ?? null;
  if (!videoId) return { status: "pending", videoUrl: null };

  return pollVideoStatus(apiKey, videoId);
}

// --- Avatar picker: lets the dashboard list choosable avatars for videos ---
export type AvatarOption = {
  id: string;
  name: string;
  previewImageUrl: string | null;
  previewVideoUrl: string | null;
  defaultVoiceId: string | null;
  gender: string | null;
};

export async function listAvatars(): Promise<AvatarOption[] | null> {
  const apiKey = process.env.VIDEO_PROVIDER_API_KEY;
  if (!apiKey) return null;

  // The API returns 50 per page in whatever order HeyGen ranks them, which
  // can end up skewed toward one gender in just the first page. Pull a few
  // pages so the picker has real variety, then interleave by gender so both
  // show up right away instead of one gender dominating the start of the list.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const all: any[] = [];
  let token: string | undefined;
  for (let page = 0; page < 3; page++) {
    const url = new URL(`${HEYGEN_BASE}/v3/avatars/looks`);
    url.searchParams.set("ownership", "public");
    url.searchParams.set("limit", "50");
    if (token) url.searchParams.set("token", token);

    const res = await fetch(url.toString(), { headers: heygenHeaders(apiKey) });
    if (!res.ok) break;
    const data = await res.json();
    all.push(...(data?.data ?? []));
    if (!data?.has_more || !data?.next_token) break;
    token = data.next_token;
  }

  if (all.length === 0) return null;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const options: AvatarOption[] = all.map((item: any) => ({
    id: item.id,
    name: item.name,
    previewImageUrl: item.preview_image_url ?? null,
    previewVideoUrl: item.preview_video_url ?? null,
    defaultVoiceId: item.default_voice_id ?? null,
    gender: item.gender ?? null,
  }));

  // Interleave by gender (male, female, other/unknown) round-robin so the
  // picker shows a mix instead of 50 of one gender before the next.
  const groups = new Map<string, AvatarOption[]>();
  for (const opt of options) {
    const key = opt.gender ?? "unknown";
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(opt);
  }
  const buckets = Array.from(groups.values());
  const interleaved: AvatarOption[] = [];
  let added = true;
  while (added) {
    added = false;
    for (const bucket of buckets) {
      const next = bucket.shift();
      if (next) {
        interleaved.push(next);
        added = true;
      }
    }
  }

  return interleaved;
}
