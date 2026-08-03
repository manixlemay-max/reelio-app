"use client";

import { useEffect, useState } from "react";

type AnalyticsRow = {
  id: string;
  postId: string;
  views: number;
  likes: number;
  comments: number;
  shares: number;
  capturedAt: string;
  platform: string;
  productName: string;
};

type BestTime = { platform: string; hour: number; avgViews: number };

export default function AnalytiquePage() {
  const [rows, setRows] = useState<AnalyticsRow[]>([]);
  const [bestTimes, setBestTimes] = useState<BestTime[]>([]);

  useEffect(() => {
    fetch("/api/analytics")
      .then((r) => r.json())
      .then((data) => {
        setRows(data.rows);
        setBestTimes(data.bestTimes);
      });
  }, []);

  const totalViews = rows.reduce((sum, r) => sum + r.views, 0);
  const totalLikes = rows.reduce((sum, r) => sum + r.likes, 0);

  return (
    <div>
      <h1 className="text-2xl font-semibold mb-2">Analytique</h1>
      <p className="text-sm text-neutral-500 mb-8">
        Les chiffres ci-dessous sont simulés tant qu&apos;aucun fournisseur de publication réel
        n&apos;est connecté (voir POSTING_PROVIDER_API_KEY dans .env.local).
      </p>

      <div className="grid sm:grid-cols-2 gap-4 mb-10">
        <div className="rounded-2xl border border-neutral-800 p-6">
          <p className="text-3xl font-semibold">{totalViews.toLocaleString("fr-FR")}</p>
          <p className="text-sm text-neutral-400 mt-1">Vues totales</p>
        </div>
        <div className="rounded-2xl border border-neutral-800 p-6">
          <p className="text-3xl font-semibold">{totalLikes.toLocaleString("fr-FR")}</p>
          <p className="text-sm text-neutral-400 mt-1">Likes totaux</p>
        </div>
      </div>

      <h2 className="text-sm font-medium text-neutral-500 mb-3">Meilleur moment pour publier</h2>
      <ul className="space-y-2 mb-10">
        {bestTimes.slice(0, 5).map((t, i) => (
          <li key={i} className="rounded-xl border border-neutral-800 p-4 flex justify-between">
            <span className="capitalize">{t.platform} · {t.hour}h</span>
            <span className="text-neutral-400">{t.avgViews.toLocaleString("fr-FR")} vues en moyenne</span>
          </li>
        ))}
        {bestTimes.length === 0 && (
          <p className="text-neutral-500 text-sm">Pas encore assez de données.</p>
        )}
      </ul>

      <h2 className="text-sm font-medium text-neutral-500 mb-3">Détail par publication</h2>
      <ul className="space-y-2">
        {rows.map((r) => (
          <li key={r.id} className="rounded-xl border border-neutral-800 p-4">
            <p className="font-medium">{r.productName} · {r.platform}</p>
            <p className="text-sm text-neutral-400">
              {r.views} vues · {r.likes} likes · {r.comments} commentaires · {r.shares} partages
            </p>
          </li>
        ))}
      </ul>
    </div>
  );
}
