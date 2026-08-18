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
              className={`relative rounded-2xl border p-6 pt-14 flex flex-col transition ${
                highlighted
                  ? "border-indigo-500 bg-gradient-to-b from-indigo-500/10 to-transparent shadow-[0_0_40px_-12px_rgba(129,90,246,0.5)]"
                  : "border-neutral-800"
              }`}
            >
              <span className="absolute top-4 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-indigo-600 text-white text-xs font-semibold px-3 py-1.5 flex items-center gap-1">
                ✨ 7-day free trial
              </span>
              {highlighted && (
                <span className="absolute -top-3 right-4 rounded-full bg-white text-neutral-950 text-[10px] font-bold uppercase tracking-wide px-2.5 py-1">
                  Most popular
                </span>
              )}
              <h3 className="font-medium mb-1">{tier.name}</h3>
              <p className="text-3xl font-semibold mb-4">
                ${tier.priceUsd}
                <span className="text-sm text-neutral-500 font-normal">/mo</span>
              </p>
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
                {loadingTier === tier.id ? "Redirecting..." : `Start free trial`}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
