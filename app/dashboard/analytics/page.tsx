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

export default function AnalyticsPage() {
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
      <h1 className="text-2xl font-semibold mb-2">Analytics</h1>
      <p className="text-sm text-neutral-500 mb-8">
        The numbers below are simulated until a real posting provider is connected
        (see POSTING_PROVIDER_API_KEY in .env.local).
      </p>

      <div className="grid sm:grid-cols-2 gap-4 mb-10">
        <div className="rounded-2xl border border-neutral-800 p-6">
          <p className="text-3xl font-semibold">{totalViews.toLocaleString("en-US")}</p>
          <p className="text-sm text-neutral-500 mt-1">Total views</p>
        </div>
        <div className="rounded-2xl border border-neutral-800 p-6">
          <p className="text-3xl font-semibold">{totalLikes.toLocaleString("en-US")}</p>
          <p className="text-sm text-neutral-500 mt-1">Total likes</p>
        </div>
      </div>

      <h2 className="text-sm font-medium text-neutral-500 mb-3">Best time to post</h2>
      <ul className="space-y-2 mb-10">
        {bestTimes.slice(0, 5).map((t, i) => (
          <li key={i} className="rounded-xl border border-neutral-800 p-4 flex justify-between">
            <span className="capitalize">{t.platform} · {t.hour}:00</span>
            <span className="text-neutral-500">{t.avgViews.toLocaleString("en-US")} avg views</span>
          </li>
        ))}
        {bestTimes.length === 0 && (
          <p className="text-neutral-500 text-sm">Not enough data yet.</p>
        )}
      </ul>

      <h2 className="text-sm font-medium text-neutral-500 mb-3">Per-post breakdown</h2>
      <ul className="space-y-2">
        {rows.map((r) => (
          <li key={r.id} className="rounded-xl border border-neutral-800 p-4">
            <p className="font-medium">{r.productName} · {r.platform}</p>
            <p className="text-sm text-neutral-500">
              {r.views} views · {r.likes} likes · {r.comments} comments · {r.shares} shares
            </p>
          </li>
        ))}
      </ul>
    </div>
  );
}
