"use client";

import { useEffect, useState } from "react";
import { Eye, Heart, MessageCircle, Share2, Clock } from "lucide-react";

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

const PLATFORM_COLOR: Record<string, string> = {
  tiktok: "bg-fuchsia-500",
  instagram: "bg-pink-500",
  youtube: "bg-red-500",
};

function Bar({ value, max, colorClass }: { value: number; max: number; colorClass?: string }) {
  const pct = max > 0 ? Math.max((value / max) * 100, 3) : 0;
  return (
    <div className="h-1.5 w-full rounded-full bg-neutral-900 overflow-hidden">
      <div
        className={`h-full rounded-full ${colorClass ?? "bg-blue-500"}`}
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}

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
  const totalComments = rows.reduce((sum, r) => sum + r.comments, 0);
  const totalShares = rows.reduce((sum, r) => sum + r.shares, 0);

  const byPlatform = new Map<string, number>();
  for (const r of rows) byPlatform.set(r.platform, (byPlatform.get(r.platform) ?? 0) + r.views);
  const platformRows = Array.from(byPlatform.entries()).sort((a, b) => b[1] - a[1]);
  const maxPlatformViews = Math.max(1, ...platformRows.map(([, v]) => v));

  const maxBestTime = Math.max(1, ...bestTimes.map((t) => t.avgViews));
  const maxPostViews = Math.max(1, ...rows.map((r) => r.views));

  return (
    <div>
      <h1 className="text-2xl font-semibold mb-2">Analytics</h1>
      <p className="text-sm text-neutral-500 mb-8">
        Simulated data until a real posting provider is connected (POSTING_PROVIDER_API_KEY).
      </p>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-10">
        <StatCard icon={Eye} label="Views" value={totalViews} />
        <StatCard icon={Heart} label="Likes" value={totalLikes} />
        <StatCard icon={MessageCircle} label="Comments" value={totalComments} />
        <StatCard icon={Share2} label="Shares" value={totalShares} />
      </div>

      {platformRows.length > 0 && (
        <div className="mb-10">
          <h2 className="text-sm font-medium text-neutral-500 mb-3">Views by platform</h2>
          <div className="rounded-xl border border-neutral-800 p-4 space-y-3">
            {platformRows.map(([platform, views]) => (
              <div key={platform}>
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="capitalize text-neutral-300">{platform}</span>
                  <span className="text-neutral-500">{views.toLocaleString("en-US")} views</span>
                </div>
                <Bar value={views} max={maxPlatformViews} colorClass={PLATFORM_COLOR[platform]} />
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="mb-10">
        <h2 className="text-sm font-medium text-neutral-500 mb-3 flex items-center gap-1.5">
          <Clock size={14} /> Best time to post
        </h2>
        {bestTimes.length === 0 ? (
          <p className="text-neutral-500 text-sm">Not enough data yet.</p>
        ) : (
          <div className="rounded-xl border border-neutral-800 p-4 space-y-3">
            {bestTimes.slice(0, 5).map((t, i) => (
              <div key={i}>
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="capitalize text-neutral-300">
                    {t.platform} · {t.hour}:00
                  </span>
                  <span className="text-neutral-500">{t.avgViews.toLocaleString("en-US")} avg views</span>
                </div>
                <Bar value={t.avgViews} max={maxBestTime} colorClass={PLATFORM_COLOR[t.platform]} />
              </div>
            ))}
          </div>
        )}
      </div>

      <h2 className="text-sm font-medium text-neutral-500 mb-3">Per-post breakdown</h2>
      <ul className="space-y-2">
        {rows.map((r) => (
          <li key={r.id} className="rounded-xl border border-neutral-800 p-4">
            <div className="flex items-center justify-between mb-2">
              <p className="font-medium text-sm">
                {r.productName} · <span className="capitalize">{r.platform}</span>
              </p>
              <span className="text-xs text-neutral-500">{r.views.toLocaleString("en-US")} views</span>
            </div>
            <Bar value={r.views} max={maxPostViews} colorClass={PLATFORM_COLOR[r.platform]} />
            <div className="flex items-center gap-4 mt-2 text-xs text-neutral-500">
              <span className="flex items-center gap-1"><Heart size={12} /> {r.likes}</span>
              <span className="flex items-center gap-1"><MessageCircle size={12} /> {r.comments}</span>
              <span className="flex items-center gap-1"><Share2 size={12} /> {r.shares}</span>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ size?: number; className?: string }>;
  label: string;
  value: number;
}) {
  return (
    <div className="rounded-2xl border border-neutral-800 p-4">
      <Icon size={16} className="text-blue-400 mb-2" />
      <p className="text-2xl font-semibold">{value.toLocaleString("en-US")}</p>
      <p className="text-xs text-neutral-500 mt-0.5">{label}</p>
    </div>
  );
}
