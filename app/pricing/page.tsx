"use client";

import { useState } from "react";
import { TIERS } from "@/lib/pricing";
import SiteHeader from "@/components/SiteHeader";

export default function PricingPage() {
  const [loadingTier, setLoadingTier] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function subscribe(tierId: string) {
    setLoadingTier(tierId);
    setError(null);
    try {
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tierId }),
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        setError(data.error ?? "Unknown error");
      }
    } catch {
      setError("Could not reach the payment server.");
    } finally {
      setLoadingTier(null);
    }
  }

  return (
    <>
    <SiteHeader />
    <main className="flex-1 mx-auto max-w-5xl px-6 py-20 w-full">
      <h1 className="text-3xl font-semibold text-center mb-2">Choose your plan</h1>
      <p className="text-neutral-500 text-center mb-12">
        7-day free trial on every plan. Cancel anytime. The number of connected social
        networks depends on your plan.
      </p>

      {error && (
        <p className="text-center text-sm text-red-400 mb-6">{error}</p>
      )}

      <div className="grid sm:grid-cols-3 gap-6">
        {TIERS.map((tier) => (
          <div key={tier.id} className="rounded-2xl border border-neutral-800 p-6 flex flex-col">
            <h3 className="font-medium mb-1">{tier.name}</h3>
            <p className="text-3xl font-semibold mb-4">
              ${tier.priceUsd}<span className="text-sm text-neutral-500 font-normal">/mo</span>
            </p>
            <ul className="text-sm text-neutral-500 space-y-2 flex-1 mb-6">
              <li>{tier.networksAllowed} connected network(s)</li>
              <li>{tier.videosPerMonth} videos / month</li>
              <li>Performance analytics + shareable client report</li>
            </ul>
            <button
              onClick={() => subscribe(tier.id)}
              disabled={loadingTier === tier.id}
              className="rounded-full bg-indigo-600 text-white px-4 py-2 text-sm font-medium hover:bg-indigo-500 transition disabled:opacity-50"
            >
              {loadingTier === tier.id ? "Redirecting..." : `Subscribe to ${tier.name}`}
            </button>
          </div>
        ))}
      </div>
    </main>
    </>
  );
}
