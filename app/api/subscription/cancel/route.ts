import { NextRequest, NextResponse } from "next/server";
import { getStripeClient } from "@/lib/stripe";
import { getLeadByToken, getSubscriptionByEmail, recordCancellationFeedback } from "@/lib/db";

// Maps our plain-language reasons to Stripe's own cancellation_details.feedback
// enum, so the reason is visible both on Manix's dashboard AND in his Stripe
// dashboard/reports without any extra work.
const REASON_TO_STRIPE: Record<string, string> = {
  too_expensive: "too_expensive",
  not_using_it: "unused",
  missing_features: "missing_features",
  bad_quality: "customer_service",
  switched_provider: "switched_service",
  other: "other",
};

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { token, reason, feedback } = body as { token?: string; reason?: string; feedback?: string };

  if (!token || !reason) {
    return NextResponse.json({ error: "Missing token or reason" }, { status: 400 });
  }

  const lead = await getLeadByToken(token);
  if (!lead) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const subscription = await getSubscriptionByEmail(lead.email);
  if (!subscription) {
    return NextResponse.json({ error: "No active subscription found for this account." }, { status: 404 });
  }

  const stripe = getStripeClient();
  if (!stripe) {
    return NextResponse.json({ error: "Stripe not configured" }, { status: 500 });
  }

  try {
    await stripe.subscriptions.update(subscription.id, {
      cancel_at_period_end: true,
      cancellation_details: {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        feedback: (REASON_TO_STRIPE[reason] ?? "other") as any,
        comment: feedback?.slice(0, 500) || undefined,
      },
    });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 502 });
  }

  await recordCancellationFeedback(subscription.id, reason, feedback?.trim() || null);

  return NextResponse.json({ ok: true });
}
