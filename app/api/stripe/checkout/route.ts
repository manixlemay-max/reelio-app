import { NextRequest, NextResponse } from "next/server";
import { getStripeClient } from "@/lib/stripe";
import { TIERS } from "@/lib/pricing";

export async function POST(req: NextRequest) {
  const stripe = getStripeClient();
  if (!stripe) {
    return NextResponse.json(
      { error: "STRIPE_SECRET_KEY manquante — configure ton compte Stripe dans .env.local" },
      { status: 500 }
    );
  }

  const body = await req.json();
  const tier = TIERS.find((t) => t.id === body.tierId);
  if (!tier) {
    return NextResponse.json({ error: "Palier inconnu" }, { status: 400 });
  }

  const yearly = body.billingPeriod === "yearly";
  const priceEnvVar = yearly ? tier.stripePriceEnvVarYearly : tier.stripePriceEnvVar;
  const priceId = process.env[priceEnvVar];
  if (!priceId) {
    return NextResponse.json(
      { error: `${priceEnvVar} manquant — crée ce prix dans ton dashboard Stripe et colle son ID dans .env.local` },
      { status: 500 }
    );
  }

  const origin = req.headers.get("origin") ?? "http://localhost:3000";

  try {
    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${origin}/welcome?checkout=success`,
      cancel_url: `${origin}/pricing?checkout=cancel`,
      metadata: { tierId: tier.id },
      subscription_data: { metadata: { tierId: tier.id }, trial_period_days: 7 },
      // Without this, Stripe hides the promo code field entirely — needed for
      // testing with 100%-off codes and for any future real discounts.
      allow_promotion_codes: true,
    });

    return NextResponse.json({ url: session.url });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown Stripe error";
    console.error("Stripe checkout error:", message);
    return NextResponse.json(
      { error: `Stripe: ${message} (priceId used: ${priceId})` },
      { status: 500 }
    );
  }
}
