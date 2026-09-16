import { NextRequest, NextResponse } from "next/server";
import { listIntegrations } from "@/lib/postingProvider";
import { getLeadByToken, listLeads, updateLeadIntegrations } from "@/lib/db";
import type { Platform } from "@/lib/types";

const FIELD_BY_PLATFORM: Record<Platform, "tiktokIntegrationId" | "instagramIntegrationId" | "youtubeIntegrationId"> = {
  tiktok: "tiktokIntegrationId",
  instagram: "instagramIntegrationId",
  youtube: "youtubeIntegrationId",
};

// Called after a client says "I'm done" connecting a platform. Postiz only
// creates a fresh integration id for an account it has never seen before —
// reconnecting an account already in the workspace (common while testing
// with your own accounts, or a client redoing a connection) just reuses the
// existing id, so a pure before/after diff would wrongly report "nothing new".
// Instead: find the integration for this platform that isn't already claimed
// by a different lead, preferring one that's actually new (per the
// connect-snapshot diff) when there's a choice.
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

  const field = FIELD_BY_PLATFORM[platform];
  const allLeads = await listLeads();
  const claimedIds = new Set(
    allLeads.filter((l) => l.id !== lead.id).map((l) => l[field]).filter((id): id is string => !!id)
  );

  const unclaimedIds = afterIds.filter((id) => !claimedIds.has(id));

  if (unclaimedIds.length === 0) {
    return NextResponse.json(
      { error: "We didn't detect a new connection yet. Make sure you finished authorizing, then try again." },
      { status: 409 }
    );
  }

  // Prefer one that's genuinely new (per the before/after diff) when there's
  // a choice; otherwise fall back to whichever unclaimed one exists — this is
  // what makes reconnecting an already-known account (yours, while testing,
  // or a client's) work instead of only ever-new accounts.
  const freshUnclaimed = unclaimedIds.filter((id) => !beforeIds.includes(id));
  const newIntegrationId = freshUnclaimed[freshUnclaimed.length - 1] ?? unclaimedIds[unclaimedIds.length - 1];

  await updateLeadIntegrations(lead.id, { [field]: newIntegrationId });

  return NextResponse.json({ ok: true, integrationId: newIntegrationId });
}
