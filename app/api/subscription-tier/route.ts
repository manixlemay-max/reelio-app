import { NextRequest, NextResponse } from "next/server";
import { getSubscriptionByEmail } from "@/lib/db";
import { TIERS } from "@/lib/pricing";

export async function GET(req: NextRequest) {
  const email = req.nextUrl.searchParams.get("email");
  if (!email) {
    return NextResponse.json({ error: "email is required" }, { status: 400 });
  }

  const sub = await getSubscriptionByEmail(email);
  const tier = sub?.tierId ? TIERS.find((t) => t.id === sub.tierId) : undefined;

  if (!tier) {
    // No matching subscription found yet (e.g. the Stripe webhook hasn't
    // landed right after checkout, or testing without Stripe configured) —
    // fall back to the LOWEST tier's limits, not the most generous. Doing
    // the opposite let a client pick more avatars/networks than their real
    // plan allows in this brief window, only to be rejected once the real
    // subscription resolves a few seconds later.
    const lowest = TIERS[0];
    return NextResponse.json({
      networksAllowed: lowest.networksAllowed,
      avatarChangesAllowed: lowest.avatarChangesAllowed,
      tierName: null,
      found: false,
    });
  }

  return NextResponse.json({
    networksAllowed: tier.networksAllowed,
    avatarChangesAllowed: tier.avatarChangesAllowed,
    tierName: tier.name,
    found: true,
  });
}
