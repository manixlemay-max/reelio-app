import { NextRequest, NextResponse } from "next/server";
import { getStripeClient } from "@/lib/stripe";
import { getLeadByToken, getSubscriptionByEmail } from "@/lib/db";
import { TIERS } from "@/lib/pricing";

// Upgrades or downgrades a client's existing subscription to a different
// tier, in place — not a new checkout. Stripe prorates automatically:
// upgrading charges the difference now, downgrading credits it toward the
// next invoice.
export async function POST(req: NextRequest) {
  const body = await req.json();
  const { token, tierId, billingPeriod } = body as {
    token?: string;
    tierId?: string;
    billingPeriod?: "monthly" | "yearly";
  };

  if (!token || !tierId) {
    return NextResponse.json({ error: "Missing token or tierId" }, { status: 400 });
  }

  const newTier = TIERS.find((t) => t.id === tierId);
  if (!newTier) {
    return NextResponse.json({ error: "Unknown plan" }, { status: 400 });
  }

  const lead = await getLeadByToken(token);
  if (!lead) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const subscription = await getSubscriptionByEmail(lead.email);
  if (!subscription) {
    return NextResponse.json({ error: "No active subscription found for this account." }, { status: 404 });
  }

  const yearly = billingPeriod === "yearly";
  const priceEnvVar = yearly ? newTier.stripePriceEnvVarYearly : newTier.stripePriceEnvVar;
  const priceId = process.env[priceEnvVar];
  if (!priceId) {
    return NextResponse.json({ error: `${priceEnvVar} is not configured.` }, { status: 500 });
  }

  const stripe = getStripeClient();
  if (!stripe) {
    return NextResponse.json({ error: "Stripe not configured" }, { status: 500 });
  }

  try {
    const current = await stripe.subscriptions.retrieve(subscription.id);
    const itemId = current.items.data[0]?.id;
    if (!itemId) {
      return NextResponse.json({ error: "Could not find the subscription's billing item." }, { status: 502 });
    }

    await stripe.subscriptions.update(subscription.id, {
      items: [{ id: itemId, price: priceId }],
      proration_behavior: "create_prorations",
      metadata: { tierId: newTier.id },
    });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 502 });
  }

  return NextResponse.json({ ok: true, tierId: newTier.id });
}
