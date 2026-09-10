import { NextRequest, NextResponse } from "next/server";
import { listIntegrations } from "@/lib/postingProvider";
import { getLeadByToken, updateLeadIntegrations } from "@/lib/db";
import type { Platform } from "@/lib/types";

const FIELD_BY_PLATFORM: Record<Platform, "tiktokIntegrationId" | "instagramIntegrationId" | "youtubeIntegrationId"> = {
  tiktok: "tiktokIntegrationId",
  instagram: "instagramIntegrationId",
  youtube: "youtubeIntegrationId",
};

// Called after a client says "I'm done" connecting a platform. Diffs the
// current Postiz integrations for that platform against the ids captured by
// connect-snapshot before they opened the OAuth tab, and saves whichever new
// id appeared onto their lead — no manual assignment needed from Manix.
export async function POST(req: NextRequest) {
  const body = await req.json();
  const { token, platform, beforeIds } = body as { token?: string; platform?: Platform; beforeIds?: string[] };

  if (!token || !platform || !FIELD_BY_PLATFORM[platform] || !Array.isArray(beforeIds)) {
    return NextResponse.json({ error: "Missing token, platform, or beforeIds" }, { status: 400 });
  }

  const lead = await getLeadByToken(token);
  if (!lead) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const integrations = await listIntegrations();
  if (integrations === null) {
    return NextResponse.json({ error: "Could not reach the posting provider." }, { status: 502 });
  }

  const afterIds = integrations.filter((i) => i.identifier === platform).map((i) => i.id);
  const newIds = afterIds.filter((id) => !beforeIds.includes(id));

  if (newIds.length === 0) {
    return NextResponse.json(
      { error: "We didn't detect a new connection yet. Make sure you finished authorizing, then try again." },
      { status: 409 }
    );
  }

  // If more than one new integration appeared (e.g. two clients connecting
  // the same platform at once), take the most recently created one.
  const newIntegrationId = newIds[newIds.length - 1];

  await updateLeadIntegrations(lead.id, { [FIELD_BY_PLATFORM[platform]]: newIntegrationId });

  return NextResponse.json({ ok: true, integrationId: newIntegrationId });
}
