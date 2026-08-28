"use client";

import { useState } from "react";
import { ShieldCheck } from "lucide-react";
import { TIERS } from "@/lib/pricing";

export default function PricingCards({ highlightTierId = "starter" }: { highlightTierId?: string }) {
  const [loadingTier, setLoadingTier] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [billing, setBilling] = useState<"monthly" | "yearly">("monthly");

  async function subscribe(tierId: string) {
    setLoadingTier(tierId);
    setError(null);
    try {
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tierId, billingPeriod: billing }),
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
      <div className="flex justify-center mb-10">
        <div className="inline-flex items-center gap-1 rounded-full bg-neutral-900 border border-neutral-800 p-1">
          <button
            onClick={() => setBilling("monthly")}
            className={`rounded-full px-4 py-1.5 text-sm font-medium transition ${
              billing === "monthly" ? "bg-white text-neutral-950" : "text-neutral-400 hover:text-neutral-200"
            }`}
          >
            Monthly
          </button>
          <button
            onClick={() => setBilling("yearly")}
            className={`flex items-center rounded-full text-sm font-medium transition ${
              billing === "yearly" ? "bg-white text-neutral-950" : "text-neutral-400 hover:text-neutral-200"
            }`}
          >
            <span className="pl-4 pr-2 py-1.5">Yearly</span>
            <span className="bg-fuchsia-600 text-white text-xs font-semibold px-2.5 py-1 rounded-full mr-1">
              20% off
            </span>
          </button>
        </div>
      </div>

      {error && <p className="text-center text-sm text-red-400 mb-6">{error}</p>}
      <div className="grid sm:grid-cols-3 gap-6">
        {TIERS.map((tier) => {
          const highlighted = tier.id === highlightTierId;
          const price = billing === "yearly" ? tier.yearlyPriceUsd : tier.priceUsd;
          return (
            <div
              key={tier.id}
              className={`relative rounded-2xl border p-6 pt-14 flex flex-col transition ${
                highlighted
                  ? "border-blue-500 bg-gradient-to-b from-blue-500/10 to-transparent shadow-[0_0_40px_-12px_rgba(59,130,246,0.5)]"
                  : "border-neutral-800"
              }`}
            >
              <span className="absolute top-4 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-blue-600 text-white text-xs font-semibold px-3 py-1.5 flex items-center gap-1">
                ✨ 7-day free trial
              </span>
              {highlighted && (
                <span className="absolute -top-3 right-4 rounded-full bg-white text-neutral-950 text-[10px] font-bold uppercase tracking-wide px-2.5 py-1">
                  Most popular
                </span>
              )}
              <h3 className="font-medium mb-1">{tier.name}</h3>
              <p className="text-3xl font-semibold mb-1">
                ${price}
                <span className="text-sm text-neutral-500 font-normal">/mo</span>
              </p>
              <p className="text-xs text-neutral-500 mb-4 h-4">
                {billing === "yearly" ? `Billed annually ($${tier.yearlyTotalUsd}/yr)` : " "}
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
                    ? "bg-blue-600 text-white hover:bg-blue-500"
                    : "border border-neutral-700 hover:border-blue-400"
                }`}
              >
                {loadingTier === tier.id ? "Redirecting..." : `Start free trial`}
              </button>
            </div>
          );
        })}
      </div>
      <p className="flex items-center justify-center gap-1.5 text-xs text-neutral-500 mt-6">
        <ShieldCheck size={14} className="text-neutral-600" />
        Secure payment via Stripe &middot; Cancel anytime, no long-term commitment
      </p>
    </div>
  );
}
