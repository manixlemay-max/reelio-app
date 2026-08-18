import { Tier } from "./types";

// Subscription tiers — adjust prices and limits based on your real costs
// (AI video generation cost per video + posting provider cost per connected profile).
export const TIERS: Tier[] = [
  {
    id: "starter",
    name: "Starter",
    priceUsd: 29,
    networksAllowed: 1,
    videosPerMonth: 10,
    competitorAnalysis: false,
    stripePriceEnvVar: "STRIPE_PRICE_STARTER",
  },
  {
    id: "growth",
    name: "Growth",
    priceUsd: 79,
    networksAllowed: 2,
    videosPerMonth: 30,
    competitorAnalysis: false,
    stripePriceEnvVar: "STRIPE_PRICE_GROWTH",
  },
  {
    id: "pro",
    name: "Pro",
    priceUsd: 199,
    networksAllowed: 3,
    videosPerMonth: 100,
    competitorAnalysis: true,
    stripePriceEnvVar: "STRIPE_PRICE_PRO",
  },
];
