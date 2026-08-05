// Integration with Postiz (postiz.com) — a unified API for posting to social
// media platforms that already has approved access to TikTok, Instagram,
// YouTube, etc., so we don't need our own developer review with each platform.
//
// Docs used to build this: https://docs.postiz.com/public-api
// Note: Postiz's Authorization header takes the raw API key, no "Bearer " prefix.

import type { Platform } from "./types";

const POSTIZ_BASE = process.env.POSTING_PROVIDER_API_URL || "https://api.postiz.com/public/v1";

type SchedulePostInput = {
  videoUrl: string;
  platform: Platform;
  hashtags: string;
  scheduledAt: string; // ISO string
};

type SchedulePostResult = {
  status: "scheduled" | "failed";
  externalId: string | null;
  error?: string;
};

type Integration = {
  id: string;
  identifier: string;
  name: string;
  disabled: boolean;
};

function postizHeaders(apiKey: string, extra?: Record<string, string>) {
  return { Authorization: apiKey, ...(extra ?? {}) };
}

async function findIntegrationId(apiKey: string, platform: Platform): Promise<string | null> {
  const res = await fetch(`${POSTIZ_BASE}/integrations`, { headers: postizHeaders(apiKey) });
  if (!res.ok) return null;
  const integrations = (await res.json()) as Integration[];
  const match = integrations.find((i) => i.identifier === platform && !i.disabled);
  return match?.id ?? null;
}

type UploadResult = { ok: true; id: string; path: string } | { ok: false; error: string };

async function uploadVideo(apiKey: string, videoUrl: string): Promise<UploadResult> {
  let videoRes: Response;
  try {
    videoRes = await fetch(videoUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; ReelioBot/1.0; +https://reelio.app)",
        Accept: "*/*",
      },
    });
  } catch (e) {
    return { ok: false, error: `Could not fetch source video from ${videoUrl}: ${(e as Error).message}` };
  }
  if (!videoRes.ok) {
    return { ok: false, error: `Source video URL returned ${videoRes.status}` };
  }
  const blob = await videoRes.blob();

  const form = new FormData();
  form.append("file", blob, "video.mp4");

  let res: Response;
  try {
    res = await fetch(`${POSTIZ_BASE}/upload`, {
      method: "POST",
      headers: postizHeaders(apiKey),
      body: form,
    });
  } catch (e) {
    return { ok: false, error: `Postiz upload request failed: ${(e as Error).message}` };
  }
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    return { ok: false, error: `Postiz upload returned ${res.status}: ${text.slice(0, 300)}` };
  }
  const data = await res.json();
  return { ok: true, id: data.id, path: data.path };
}

function buildSettings(platform: Platform, hashtags: string) {
  switch (platform) {
    case "tiktok":
      return {
        __type: "tiktok",
        title: hashtags.slice(0, 90),
        privacy_level: "PUBLIC_TO_EVERYONE",
        duet: true,
        stitch: true,
        comment: true,
        autoAddMusic: "no",
        brand_content_toggle: false,
        brand_organic_toggle: false,
        video_made_with_ai: true,
        content_posting_method: "DIRECT_POST",
      };
    case "instagram":
      return {
        __type: "instagram",
        post_type: "post",
        is_trial_reel: false,
        collaborators: [],
      };
    case "youtube":
      return {
        __type: "youtube",
        title: (hashtags.trim() || "Reelio video").slice(0, 100),
        type: "public",
        selfDeclaredMadeForKids: "no",
        tags: [],
      };
    default:
      return null;
  }
}

export async function schedulePost(input: SchedulePostInput): Promise<SchedulePostResult> {
  const apiKey = process.env.POSTING_PROVIDER_API_KEY;

  if (!apiKey) {
    // Demo mode: no key configured yet.
    return { status: "scheduled", externalId: `mock-${Date.now()}` };
  }

  const integrationId = await findIntegrationId(apiKey, input.platform);
  if (!integrationId) {
    return {
      status: "failed",
      externalId: null,
      error: `No connected ${input.platform} account found in Postiz. Connect it under Postiz > Channels first.`,
    };
  }

  const media = await uploadVideo(apiKey, input.videoUrl);
  if (!media.ok) {
    return { status: "failed", externalId: null, error: media.error };
  }

  const settings = buildSettings(input.platform, input.hashtags);
  if (!settings) {
    return { status: "failed", externalId: null, error: `Unsupported platform: ${input.platform}` };
  }

  const scheduledDate = new Date(input.scheduledAt);
  const isFuture = scheduledDate.getTime() > Date.now() + 60_000;

  const res = await fetch(`${POSTIZ_BASE}/posts`, {
    method: "POST",
    headers: postizHeaders(apiKey, { "Content-Type": "application/json" }),
    body: JSON.stringify({
      type: isFuture ? "schedule" : "now",
      date: scheduledDate.toISOString(),
      shortLink: false,
      tags: [],
      posts: [
        {
          integration: { id: integrationId },
          value: [{ content: input.hashtags, image: [{ id: media.id, path: media.path }] }],
          settings,
        },
      ],
    }),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    return { status: "failed", externalId: null, error: `Postiz error ${res.status}: ${text.slice(0, 200)}` };
  }

  const data = await res.json();
  const externalId = Array.isArray(data) ? data[0]?.id : data?.id;
  return { status: "scheduled", externalId: externalId ?? null };
}

// Heuristic "best time to post" from analytics already collected.
// Replace with a real model once there's enough history per client.
export function suggestBestPostingTime(
  rows: { platform: Platform; capturedAt: string; views: number }[]
): { platform: Platform; hour: number; avgViews: number }[] {
  const buckets = new Map<string, { total: number; count: number }>();

  for (const row of rows) {
    const hour = new Date(row.capturedAt).getHours();
    const key = `${row.platform}-${hour}`;
    const bucket = buckets.get(key) ?? { total: 0, count: 0 };
    bucket.total += row.views;
    bucket.count += 1;
    buckets.set(key, bucket);
  }

  const results: { platform: Platform; hour: number; avgViews: number }[] = [];
  for (const [key, bucket] of buckets) {
    const [platform, hourStr] = key.split("-");
    results.push({
      platform: platform as Platform,
      hour: Number(hourStr),
      avgViews: Math.round(bucket.total / bucket.count),
    });
  }

  return results.sort((a, b) => b.avgViews - a.avgViews);
}
