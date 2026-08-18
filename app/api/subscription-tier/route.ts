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
    // No matching subscription found yet (e.g. webhook hasn't landed, or
    // testing without Stripe configured) — fall back to the most generous
    // limit so we never block a real paying customer.
    return NextResponse.json({ networksAllowed: 3, tierName: null, found: false });
  }

  return NextResponse.json({ networksAllowed: tier.networksAllowed, tierName: tier.name, found: true });
}
