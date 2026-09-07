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
  // Optional client-provided notes on what to mention/emphasize (a promo
  // code, a specific feature, a call to action) — folded into the script.
  styleNotes?: string | null;
  // Whether to burn in bold on-screen captions. Defaults to true (matches
  // the original always-on behavior) when not specified.
  captionsEnabled?: boolean;
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

  // --- Explicit avatar, chosen by the client or picked as a safe default below ---
  // NOTE: HeyGen's "Video Agent" auto-pick flow (POST /v3/video-agents) was
  // tried here originally but proved unreliable in testing — jobs would sit
  // at progress 0 and flip straight to "failed" with no error detail from the
  // API, even on a fully-funded account. The explicit-avatar flow below is
  // the same one HeyGen uses under the hood and has been reliable, so every
  // video now goes through it — falling back to a randomly-picked public
  // avatar when the client hasn't chosen one yet (getDefaultAvatar()).
  let avatarId = input.avatarId ?? null;
  let voiceId = input.voiceId ?? null;

  if (!avatarId) {
    const fallback = await getDefaultAvatar(apiKey);
    if (!fallback) {
      return { status: "failed", videoUrl: null, provider: "heygen" };
    }
    avatarId = fallback.id;
    voiceId = fallback.defaultVoiceId;
  }

  const notesLine = input.styleNotes?.trim() ? ` ${input.styleNotes.trim()}` : "";
  const script = `Hey! I have to tell you about ${input.productName}. ${input.productDescription}${notesLine} Honestly, it's been such a game changer for me — you have to try it for yourself. Grab yours today!`;

  const res = await fetch(`${HEYGEN_BASE}/v3/videos`, {
    method: "POST",
    headers: heygenHeaders(apiKey, { "Content-Type": "application/json" }),
    body: JSON.stringify({
      type: "avatar",
      avatar_id: avatarId,
      script,
      voice_id: voiceId || undefined,
      resolution: "1080p",
      aspect_ratio: "9:16",
      // Ensures the avatar fills the whole vertical frame (no letterboxing)
      // regardless of the source look's own native orientation — otherwise
      // HeyGen picks "the best option based on source and canvas
      // orientations", which can vary avatar to avatar.
      fit: "cover",
      title: `${input.productName} — Reelio UGC video`,
      // Bold on-screen captions burned into the video, like typical viral
      // UGC content — client-controlled (report page toggle). NOTE: verify
      // this renders as expected once live — HeyGen's docs are inconsistent
      // about whether v3/videos burns captions in or only returns a sidecar
      // subtitle file.
      ...(input.captionsEnabled !== false ? { caption: { file_format: "srt", style: "default" } } : {}),
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

// Picks one random public avatar to present a video when the client hasn't
// chosen their own yet (e.g. their very first video, generated at signup
// before they've seen the avatar picker). A single, cheap page fetch — no
// need for the full multi-page interleaved list listAvatars() builds for the
// picker UI.
async function getDefaultAvatar(apiKey: string): Promise<{ id: string; defaultVoiceId: string | null } | null> {
  const url = new URL(`${HEYGEN_BASE}/v3/avatars/looks`);
  url.searchParams.set("ownership", "public");
  url.searchParams.set("limit", "50");

  const res = await fetch(url.toString(), { headers: heygenHeaders(apiKey) });
  if (!res.ok) return null;

  const data = await res.json();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const items: any[] = data?.data ?? [];
  if (items.length === 0) return null;

  const pick = items[Math.floor(Math.random() * items.length)];
  return { id: pick.id, defaultVoiceId: pick.default_voice_id ?? null };
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
  tags: string[];
};

export async function listAvatars(): Promise<AvatarOption[] | null> {
  const apiKey = process.env.VIDEO_PROVIDER_API_KEY;
  if (!apiKey) return null;

  // HeyGen's catalog has several "looks" (different outfits/settings) per
  // named person — e.g. "Dante Living Room 6" and "Dante Office 2" are the
  // same face. Dedupe down to one look per person so the picker doesn't show
  // the same face repeated. Since dedup can shrink hundreds of raw entries
  // down to a much smaller set of unique people, keep pulling pages (up to a
  // cap, so a slow/huge catalog can't hang the picker) until either we have
  // a healthy number of unique people or the catalog runs out.
  const seenPersons = new Set<string>();
  const deduped: AvatarOption[] = [];
  let token: string | undefined;
  const TARGET_UNIQUE = 40;
  const MAX_PAGES = 10;
  for (let page = 0; page < MAX_PAGES; page++) {
    const url = new URL(`${HEYGEN_BASE}/v3/avatars/looks`);
    url.searchParams.set("ownership", "public");
    url.searchParams.set("limit", "50");
    if (token) url.searchParams.set("token", token);

    const res = await fetch(url.toString(), { headers: heygenHeaders(apiKey) });
    if (!res.ok) break;
    const data = await res.json();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const items: any[] = data?.data ?? [];
    for (const item of items) {
      const name: string = item.name ?? "";
      // Name format is "<Person> <Scene words...> <Number>" — the scene part
      // can be one word ("Office") or two ("Living Room"), so just check
      // that the last token is a number and use the first token as the key.
      const parts = name.trim().split(/\s+/);
      const lastPart = parts[parts.length - 1];
      const personKey = (parts.length >= 2 && /^\d+$/.test(lastPart) ? parts[0] : name).toLowerCase();
      if (seenPersons.has(personKey)) continue;
      seenPersons.add(personKey);
      deduped.push({
        id: item.id,
        name,
        previewImageUrl: item.preview_image_url ?? null,
        previewVideoUrl: item.preview_video_url ?? null,
        defaultVoiceId: item.default_voice_id ?? null,
        gender: item.gender ?? null,
        tags: item.tags ?? [],
      });
    }
    if (!data?.has_more || !data?.next_token) break;
    token = data.next_token;
    if (deduped.length >= TARGET_UNIQUE) break;
  }

  if (deduped.length === 0) return null;

  // Interleave by gender (male, female, other/unknown) round-robin so the
  // picker shows a mix instead of 50 of one gender before the next.
  const groups = new Map<string, AvatarOption[]>();
  for (const opt of deduped) {
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
