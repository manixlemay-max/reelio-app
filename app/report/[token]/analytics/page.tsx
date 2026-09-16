import { getLeadByToken, getClientReport } from "@/lib/db";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

const PLATFORM_COLOR: Record<string, string> = {
  tiktok: "bg-fuchsia-500",
  instagram: "bg-pink-500",
  youtube: "bg-red-500",
};

export default async function ClientAnalyticsPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const lead = await getLeadByToken(token);
  if (!lead) return notFound();

  const { analytics } = await getClientReport(lead.id);

  const totalViews = analytics.reduce((sum, a) => sum + a.views, 0);
  const totalLikes = analytics.reduce((sum, a) => sum + a.likes, 0);
  const totalComments = analytics.reduce((sum, a) => sum + a.comments, 0);
  const totalShares = analytics.reduce((sum, a) => sum + a.shares, 0);

  const byPlatform = new Map<string, number>();
  for (const a of analytics) byPlatform.set(a.platform, (byPlatform.get(a.platform) ?? 0) + a.views);
  const platformRows = Array.from(byPlatform.entries()).sort((a, b) => b[1] - a[1]);
  const maxPlatformViews = Math.max(1, ...platformRows.map(([, v]) => v));

  return (
    <div>
      <h1 className="text-2xl font-semibold mb-8">Analytics</h1>

      <div className="grid sm:grid-cols-4 gap-4 mb-10">
        <Stat label="Views" value={totalViews} />
        <Stat label="Likes" value={totalLikes} />
        <Stat label="Comments" value={totalComments} />
        <Stat label="Shares" value={totalShares} />
      </div>

      {platformRows.length === 0 ? (
        <p className="text-sm text-neutral-500">No performance data yet — check back once your videos are live.</p>
      ) : (
        <div>
          <h2 className="text-sm font-medium text-neutral-500 mb-3">Views by platform</h2>
          <div className="space-y-3">
            {platformRows.map(([platform, views]) => (
              <div key={platform}>
                <div className="flex items-center justify-between mb-1 text-xs">
                  <span className="capitalize text-neutral-300">{platform}</span>
                  <span className="text-neutral-500">{views.toLocaleString()}</span>
                </div>
                <div className="h-1.5 w-full rounded-full bg-neutral-900 overflow-hidden">
                  <div
                    className={`h-full rounded-full ${PLATFORM_COLOR[platform] ?? "bg-blue-500"}`}
                    style={{ width: `${Math.max((views / maxPlatformViews) * 100, 3)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl border border-neutral-800 p-4 text-center">
      <p className="text-2xl font-semibold">{value.toLocaleString()}</p>
      <p className="text-xs text-neutral-500 mt-1">{label}</p>
    </div>
  );
}
