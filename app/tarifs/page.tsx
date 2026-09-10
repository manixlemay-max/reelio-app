"use client";

import { useState } from "react";
import { TIERS } from "@/lib/pricing";

export default function TarifsPage() {
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
        setError(data.error ?? "Erreur inconnue");
      }
    } catch {
      setError("Impossible de contacter le serveur de paiement.");
    } finally {
      setLoadingTier(null);
    }
  }

  return (
    <main className="flex-1 mx-auto max-w-5xl px-6 py-20 w-full">
      <h1 className="text-3xl font-semibold text-center mb-2">Choisissez votre abonnement</h1>
      <p className="text-neutral-400 text-center mb-12">
        Annulable à tout moment. Le nombre de réseaux sociaux connectés dépend de votre palier.
      </p>

      {error && (
        <p className="text-center text-sm text-red-400 mb-6">{error}</p>
      )}

      <div className="grid sm:grid-cols-3 gap-6">
        {TIERS.map((tier) => (
          <div key={tier.id} className="rounded-2xl border border-neutral-800 p-6 flex flex-col">
            <h3 className="font-medium mb-1">{tier.name}</h3>
            <p className="text-3xl font-semibold mb-4">
              {tier.priceEur}€<span className="text-sm text-neutral-500 font-normal">/mois</span>
            </p>
            <ul className="text-sm text-neutral-400 space-y-2 flex-1 mb-6">
              <li>{tier.networksAllowed} réseau(x) connecté(s)</li>
              <li>{tier.videosPerMonth} vidéos / mois</li>
              <li>{tier.competitorAnalysis ? "Analyse concurrentielle incluse" : "Analyse de performance de base"}</li>
            </ul>
            <button
              onClick={() => subscribe(tier.id)}
              disabled={loadingTier === tier.id}
              className="rounded-full bg-emerald-500 text-neutral-950 px-4 py-2 text-sm font-medium hover:bg-emerald-400 transition disabled:opacity-50"
            >
              {loadingTier === tier.id ? "Redirection..." : `S'abonner à ${tier.name}`}
            </button>
          </div>
        ))}
      </div>
    </main>
  );
}
