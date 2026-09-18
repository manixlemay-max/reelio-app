"use client";

import { useState } from "react";
import { TIERS } from "@/lib/pricing";

type Props = {
  token: string;
  currentTierId: string;
};

export default function SubscriptionPlans({ token, currentTierId }: Props) {
  const [switchingTo, setSwitchingTo] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [activeTierId, setActiveTierId] = useState(currentTierId);
  const [done, setDone] = useState<string | null>(null);

  async function switchPlan(tierId: string) {
    setSwitchingTo(tierId);
    setError(null);
    setDone(null);
    try {
      const res = await fetch("/api/subscription/change-plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, tierId, billingPeriod: "monthly" }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not change your plan.");
      setActiveTierId(tierId);
      setDone(tierId);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSwitchingTo(null);
    }
  }

  const currentIndex = TIERS.findIndex((t) => t.id === activeTierId);

  return (
    <div>
      {error && <p className="text-sm text-red-400 mb-4">{error}</p>}
      {done && (
        <p className="text-sm text-green-400 mb-4">
          Plan updated to {TIERS.find((t) => t.id === done)?.name} — the price change is prorated on your next
          invoice.
        </p>
      )}
      <div className="grid sm:grid-cols-3 gap-4">
        {TIERS.map((tier, i) => {
          const isCurrent = tier.id === activeTierId;
          const isUpgrade = i > currentIndex;
          return (
            <div
              key={tier.id}
              className={`rounded-xl border p-5 flex flex-col ${
                isCurrent ? "border-blue-500 bg-blue-500/5" : "border-neutral-800"
              }`}
            >
              <h3 className="font-medium mb-1">{tier.name}</h3>
              <p className="text-2xl font-semibold mb-3">
                ${tier.priceUsd}
                <span className="text-sm text-neutral-500 font-normal">/mo</span>
              </p>
              <ul className="text-xs text-neutral-500 space-y-1.5 flex-1 mb-4">
                <li>{tier.networksAllowed} connected network(s)</li>
                <li>{tier.videosPerMonth} videos / month</li>
                <li>
                  {tier.productsAllowed === null ? "Unlimited products" : `${tier.productsAllowed} product(s)`}
                </li>
                <li>
                  {tier.avatarChangesAllowed === null ? "Unlimited avatars" : `${tier.avatarChangesAllowed} avatar(s)`}
                </li>
              </ul>
              {isCurrent ? (
                <span className="rounded-full border border-blue-500 text-blue-400 text-center px-4 py-2 text-xs font-medium">
                  Current plan
                </span>
              ) : (
                <button
                  onClick={() => switchPlan(tier.id)}
                  disabled={switchingTo !== null}
                  className="rounded-full bg-blue-600 text-white px-4 py-2 text-xs font-medium hover:bg-blue-500 transition disabled:opacity-50"
                >
                  {switchingTo === tier.id ? "Switching..." : isUpgrade ? "Upgrade" : "Downgrade"}
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
