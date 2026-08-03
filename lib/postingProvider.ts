// Abstraction autour du fournisseur de publication unifiée (Postiz, Ayrshare, etc.)
// qui possède déjà l'accès approuvé aux APIs TikTok et Instagram — donc pas besoin
// de soumettre ta propre app à une revue Meta/TikTok pour démarrer.
//
// Comme pour videoProvider.ts : la forme exacte de la requête est générique et doit
// être vérifiée contre la doc officielle du fournisseur choisi avant mise en prod.

import type { Platform } from "./types";

type SchedulePostInput = {
  videoUrl: string;
  platform: Platform;
  hashtags: string;
  scheduledAt: string; // ISO string
};

type SchedulePostResult = {
  status: "scheduled" | "failed";
  externalId: string | null;
};

export async function schedulePost(input: SchedulePostInput): Promise<SchedulePostResult> {
  const apiKey = process.env.POSTING_PROVIDER_API_KEY;
  const apiUrl = process.env.POSTING_PROVIDER_API_URL; // ex: https://api.postiz.com/public/v1/posts

  if (!apiKey || !apiUrl) {
    // Mode démo : simule une planification réussie sans appeler de vraie API.
    return { status: "scheduled", externalId: `mock-${Date.now()}` };
  }

  const response = await fetch(apiUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      platform: input.platform,
      media_url: input.videoUrl,
      caption: input.hashtags,
      scheduled_at: input.scheduledAt,
    }),
  });

  if (!response.ok) {
    return { status: "failed", externalId: null };
  }

  const data = await response.json();
  return { status: "scheduled", externalId: data.id ?? null };
}

// Suggestion heuristique du meilleur créneau de publication à partir des
// analytics déjà collectées. Remplace par un vrai modèle une fois que tu as
// assez d'historique par client (au moins 20-30 posts).
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
