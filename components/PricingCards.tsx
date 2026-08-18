"use client";

import { useState } from "react";
import { TIERS } from "@/lib/pricing";

export default function PricingCards({ highlightTierId = "starter" }: { highlightTierId?: string }) {
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
    <div>
      {error && <p className="text-center text-sm text-red-400 mb-6">{error}</p>}
      <div className="grid sm:grid-cols-3 gap-6">
        {TIERS.map((tier) => {
          const highlighted = tier.id === highlightTierId;
          return (
            <div
              key={tier.id}
              className={`relative rounded-2xl border p-6 flex flex-col transition ${
                highlighted ? "border-indigo-500 bg-indigo-500/5" : "border-neutral-800"
              }`}
            >
              {highlighted && (
                <span className="absolute -top-3 left-6 rounded-full bg-indigo-600 text-white text-xs font-medium px-3 py-1">
                  7-day free trial
                </span>
              )}
              <h3 className="font-medium mb-1">{tier.name}</h3>
              <p className="text-3xl font-semibold mb-1">
                ${tier.priceUsd}
                <span className="text-sm text-neutral-500 font-normal">/mo</span>
              </p>
              <p className="text-xs text-neutral-500 mb-4">7-day free trial included</p>
              <ul className="text-sm text-neutral-500 space-y-2 flex-1 mb-6">
                <li>{tier.networksAllowed} connected network(s)</li>
                <li>{tier.videosPerMonth} videos / month</li>
                <li>Performance analytics + shareable client report</li>
              </ul>
              <button
                onClick={() => subscribe(tier.id)}
                disabled={loadingTier === tier.id}
                className={`rounded-full px-4 py-2 text-sm font-medium transition disabled:opacity-50 ${
                  highlighted
                    ? "bg-indigo-600 text-white hover:bg-indigo-500"
                    : "border border-neutral-700 hover:border-indigo-400"
                }`}
              >
                {loadingTier === tier.id ? "Redirecting..." : `Subscribe to ${tier.name}`}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
