import { Tier } from "./types";

// Subscription tiers — adjust prices and limits based on your real costs
// (AI video generation cost per video + posting provider cost per connected profile).
// yearlyPriceUsd is the per-month equivalent when billed annually (20% off),
// used for display only — the actual Stripe price is the full annual amount.
export const TIERS: Tier[] = [
  {
    id: "starter",
    name: "Starter",
    priceUsd: 29,
    yearlyPriceUsd: 23,
    networksAllowed: 1,
    videosPerMonth: 10,
    competitorAnalysis: false,
    stripePriceEnvVar: "STRIPE_PRICE_STARTER",
    stripePriceEnvVarYearly: "STRIPE_PRICE_STARTER_YEARLY",
  },
  {
    id: "growth",
    name: "Growth",
    priceUsd: 79,
    yearlyPriceUsd: 63,
    networksAllowed: 2,
    videosPerMonth: 30,
    competitorAnalysis: false,
    stripePriceEnvVar: "STRIPE_PRICE_GROWTH",
    stripePriceEnvVarYearly: "STRIPE_PRICE_GROWTH_YEARLY",
  },
  {
    id: "pro",
    name: "Pro",
    priceUsd: 199,
    yearlyPriceUsd: 159,
    networksAllowed: 3,
    videosPerMonth: 100,
    competitorAnalysis: true,
    stripePriceEnvVar: "STRIPE_PRICE_PRO",
    stripePriceEnvVarYearly: "STRIPE_PRICE_PRO_YEARLY",
  },
];
