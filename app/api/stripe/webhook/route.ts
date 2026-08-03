import { NextRequest, NextResponse } from "next/server";
import { getStripeClient } from "@/lib/stripe";

// Configure cette URL comme endpoint de webhook dans ton dashboard Stripe :
// https://dashboard.stripe.com/webhooks — événements à écouter :
// checkout.session.completed, customer.subscription.updated, customer.subscription.deleted
export async function POST(req: NextRequest) {
  const stripe = getStripeClient();
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!stripe || !webhookSecret) {
    return NextResponse.json({ error: "Stripe non configuré" }, { status: 500 });
  }

  const signature = req.headers.get("stripe-signature");
  const rawBody = await req.text();

  let event;
  try {
    event = stripe.webhooks.constructEvent(rawBody, signature!, webhookSecret);
  } catch {
    return NextResponse.json({ error: "Signature invalide" }, { status: 400 });
  }

  switch (event.type) {
    case "checkout.session.completed":
      // TODO: active l'abonnement du client dans ta table `subscriptions`
      break;
    case "customer.subscription.deleted":
      // TODO: désactive l'accès du client
      break;
    default:
      break;
  }

  return NextResponse.json({ received: true });
}
