import { Tier } from "./types";

// Paliers d'abonnement — ajuste les prix et limites selon tes coûts réels
// (coût par vidéo du fournisseur IA + coût par profil connecté chez le fournisseur de publication).
export const TIERS: Tier[] = [
  {
    id: "starter",
    name: "Starter",
    priceEur: 29,
    networksAllowed: 1,
    videosPerMonth: 10,
    competitorAnalysis: false,
    stripePriceEnvVar: "STRIPE_PRICE_STARTER",
  },
  {
    id: "growth",
    name: "Growth",
    priceEur: 79,
    networksAllowed: 2,
    videosPerMonth: 30,
    competitorAnalysis: false,
    stripePriceEnvVar: "STRIPE_PRICE_GROWTH",
  },
  {
    id: "pro",
    name: "Pro",
    priceEur: 199,
    networksAllowed: 2,
    videosPerMonth: 100,
    competitorAnalysis: true,
    stripePriceEnvVar: "STRIPE_PRICE_PRO",
  },
];
