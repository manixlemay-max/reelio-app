import { NextRequest, NextResponse } from "next/server";
import { getLeadByToken, getSubscriptionByEmail, updateLeadAvatar } from "@/lib/db";
import { TIERS } from "@/lib/pricing";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { token, avatarId, voiceId } = body as { token?: string; avatarId?: string; voiceId?: string | null };

  if (!token || !avatarId) {
    return NextResponse.json({ error: "Missing token or avatarId" }, { status: 400 });
  }

  const lead = await getLeadByToken(token);
  if (!lead) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  // Same avatar re-submitted — nothing to do, don't burn a change.
  if (lead.avatarId === avatarId) {
    return NextResponse.json({ ok: true, avatarId, changesUsed: lead.avatarChangesUsed });
  }

  const isFirstPick = !lead.avatarId;

  if (!isFirstPick) {
    const sub = await getSubscriptionByEmail(lead.email);
    const tier = TIERS.find((t) => t.id === sub?.tierId) ?? TIERS[0];
    if (lead.avatarChangesUsed >= tier.avatarChangesAllowed) {
      return NextResponse.json(
        {
          error: `You've used all ${tier.avatarChangesAllowed} avatar change(s) included in your plan.`,
        },
        { status: 400 }
      );
    }
  }

  await updateLeadAvatar(lead.id, avatarId, voiceId ?? null, !isFirstPick);

  return NextResponse.json({ ok: true, avatarId, changesUsed: isFirstPick ? lead.avatarChangesUsed : lead.avatarChangesUsed + 1 });
}
