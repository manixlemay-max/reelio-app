import { getLeadByToken, getSubscriptionByEmail } from "@/lib/db";
import { notFound } from "next/navigation";
import { TIERS } from "@/lib/pricing";
import SubscriptionPlans from "@/components/SubscriptionPlans";
import CancelSubscription from "@/components/CancelSubscription";

export const dynamic = "force-dynamic";

export default async function ClientSubscriptionPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const lead = await getLeadByToken(token);
  if (!lead) return notFound();

  const sub = await getSubscriptionByEmail(lead.email);
  const tier = TIERS.find((t) => t.id === sub?.tierId) ?? TIERS[0];

  return (
    <div>
      <h1 className="text-2xl font-semibold mb-1">Subscription</h1>
      <p className="text-sm text-neutral-500 mb-8">
        You&apos;re on the <span className="text-neutral-300 font-medium">{tier.name}</span> plan
        {sub?.currentPeriodEnd &&
          ` — renews ${new Date(sub.currentPeriodEnd).toLocaleDateString()}`}
        {sub?.cancelAtPeriodEnd && " (canceling at period end)"}
        .
      </p>

      <SubscriptionPlans token={token} currentTierId={tier.id} />

      <div className="mt-8 pt-6 border-t border-neutral-800">
        <CancelSubscription token={token} />
      </div>
    </div>
  );
}
