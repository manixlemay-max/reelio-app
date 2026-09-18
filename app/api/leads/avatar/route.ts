import { NextRequest, NextResponse } from "next/server";
import { getLeadByToken, getSubscriptionByEmail, updateLeadAvatars } from "@/lib/db";
import { TIERS } from "@/lib/pricing";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { token, avatarIds } = body as {
    token?: string;
    avatarIds?: { id: string; voiceId: string | null }[];
  };

  if (!token || !Array.isArray(avatarIds) || avatarIds.length === 0) {
    return NextResponse.json({ error: "Missing token or avatarIds" }, { status: 400 });
  }

  const lead = await getLeadByToken(token);
  if (!lead) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const sub = await getSubscriptionByEmail(lead.email);
  const tier = TIERS.find((t) => t.id === sub?.tierId) ?? TIERS[0];

  // null = unlimited pool size on this tier, nothing to enforce.
  if (tier.avatarChangesAllowed !== null && avatarIds.length > tier.avatarChangesAllowed) {
    return NextResponse.json(
      { error: `Your plan allows up to ${tier.avatarChangesAllowed} avatar(s) — pick fewer.` },
      { status: 400 }
    );
  }

  await updateLeadAvatars(lead.id, avatarIds);

  return NextResponse.json({ ok: true, avatarIds });
}
