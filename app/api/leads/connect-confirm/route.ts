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
  const otherLeads = allLeads.filter((l) => l.id !== lead.id);
  const claimedBy = new Map(otherLeads.filter((l) => l[field]).map((l) => [l[field] as string, l]));

  const unclaimedIds = afterIds.filter((id) => !claimedBy.has(id));
  const freshUnclaimed = unclaimedIds.filter((id) => !beforeIds.includes(id));

  let newIntegrationId: string | undefined =
    freshUnclaimed[freshUnclaimed.length - 1] ?? unclaimedIds[unclaimedIds.length - 1];

  if (!newIntegrationId) {
    // Every matching integration is already claimed by someone else. If
    // there's exactly one candidate, it's unambiguous who just authorized it
    // — take it over (this is what unblocks re-authorizing an account whose
    // previous claim is stale, e.g. an old test lead, or a client redoing
    // their connection under a new link). With more than one candidate we
    // can't tell which one this client just did, so we refuse rather than
    // guess and risk stealing the wrong client's account.
    if (afterIds.length === 1) {
      const previousOwner = claimedBy.get(afterIds[0]);
      if (previousOwner) {
        await updateLeadIntegrations(previousOwner.id, { [field]: null });
      }
      newIntegrationId = afterIds[0];
    } else {
      return NextResponse.json(
        { error: "We didn't detect a new connection yet. Make sure you finished authorizing, then try again." },
        { status: 409 }
      );
    }
  }

  await updateLeadIntegrations(lead.id, { [field]: newIntegrationId });

  return NextResponse.json({ ok: true, integrationId: newIntegrationId });
}
