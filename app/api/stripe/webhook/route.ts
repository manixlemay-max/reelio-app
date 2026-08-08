import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { getStripeClient } from "@/lib/stripe";
import { upsertSubscription } from "@/lib/db";

// Configure cette URL comme endpoint de webhook dans ton dashboard Stripe :
// https://dashboard.stripe.com/webhooks — événements à écouter :
// checkout.session.completed, customer.subscription.updated, customer.subscription.deleted

async function resolveEmail(stripe: Stripe, customerId: string): Promise<string | null> {
  try {
    const customer = await stripe.customers.retrieve(customerId);
    if (customer.deleted) return null;
    return customer.email ?? null;
  } catch {
    return null;
  }
}

export async function POST(req: NextRequest) {
  const stripe = getStripeClient();
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!stripe || !webhookSecret) {
    return NextResponse.json({ error: "Stripe non configuré" }, { status: 500 });
  }

  const signature = req.headers.get("stripe-signature");
  const rawBody = await req.text();

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(rawBody, signature!, webhookSecret);
  } catch {
    return NextResponse.json({ error: "Signature invalide" }, { status: 400 });
  }

  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session;
      const customerId = typeof session.customer === "string" ? session.customer : session.customer?.id;
      const subscriptionId =
        typeof session.subscription === "string" ? session.subscription : session.subscription?.id;
      if (customerId && subscriptionId) {
        await upsertSubscription({
          id: subscriptionId,
          customerId,
          email: session.customer_details?.email ?? null,
          tierId: session.metadata?.tierId ?? null,
          status: "active",
        });
      }
      break;
    }
    case "customer.subscription.created":
    case "customer.subscription.updated": {
      const subscription = event.data.object as Stripe.Subscription;
      const customerId =
        typeof subscription.customer === "string" ? subscription.customer : subscription.customer.id;
      const email = await resolveEmail(stripe, customerId);
      const periodEndUnix = (subscription as unknown as { current_period_end?: number }).current_period_end;
      await upsertSubscription({
        id: subscription.id,
        customerId,
        email,
        tierId: subscription.metadata?.tierId ?? null,
        status: subscription.status,
        currentPeriodEnd: periodEndUnix ? new Date(periodEndUnix * 1000).toISOString() : null,
      });
      break;
    }
    case "customer.subscription.deleted": {
      const subscription = event.data.object as Stripe.Subscription;
      const customerId =
        typeof subscription.customer === "string" ? subscription.customer : subscription.customer.id;
      await upsertSubscription({
        id: subscription.id,
        customerId,
        tierId: subscription.metadata?.tierId ?? null,
        status: "canceled",
      });
      break;
    }
    default:
      break;
  }

  return NextResponse.json({ received: true });
}
