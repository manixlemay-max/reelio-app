import { getLeadByToken, getClientReport, listSupportRequestsByLead, getSubscriptionByEmail } from "@/lib/db";
import { notFound } from "next/navigation";
import CancelSubscription from "@/components/CancelSubscription";
import NeedHelp from "@/components/NeedHelp";
import AvatarPicker from "@/components/AvatarPicker";
import VideoNotes from "@/components/VideoNotes";
import { listAvatars } from "@/lib/videoProvider";
import { TIERS } from "@/lib/pricing";

export const dynamic = "force-dynamic";

export default async function ClientReportPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const lead = await getLeadByToken(token);
  if (!lead) return notFound();

  const { videos, posts, analytics } = await getClientReport(lead.id);
  const messages = await listSupportRequestsByLead(lead.id);

  const sub = await getSubscriptionByEmail(lead.email);
  const tier = TIERS.find((t) => t.id === sub?.tierId) ?? TIERS[TIERS.length - 1];
  let currentAvatarName: string | null = null;
  if (lead.avatarId) {
    const avatars = await listAvatars();
    currentAvatarName = avatars?.find((a) => a.id === lead.avatarId)?.name ?? null;
  }

  const totalViews = analytics.reduce((sum, a) => sum + a.views, 0);
  const totalLikes = analytics.reduce((sum, a) => sum + a.likes, 0);
  const totalComments = analytics.reduce((sum, a) => sum + a.comments, 0);

  return (
    <main className="flex-1 mx-auto max-w-3xl px-6 py-16 w-full">
      <p className="text-sm text-neutral-500 mb-1">Reelio report for</p>
      <h1 className="text-2xl font-semibold mb-4">{lead.businessName}</h1>

      <div className="rounded-lg border border-neutral-800 bg-neutral-900/50 px-4 py-3 mb-10 text-xs text-neutral-500">
        This is your private, always-up-to-date report — bookmark this page, no login needed.
        New videos are created and posted automatically based on your plan; check back here
        any time to see what's live and how it's performing.
      </div>

      <div className="grid grid-cols-3 gap-4 mb-12">
        <Stat label="Total views" value={totalViews} />
        <Stat label="Total likes" value={totalLikes} />
        <Stat label="Total comments" value={totalComments} />
      </div>

      <h2 className="text-lg font-medium mb-4">Videos</h2>
      {videos.length === 0 ? (
        <p className="text-sm text-neutral-500 mb-10">No videos yet — your first one is coming soon.</p>
      ) : (
        <ul className="space-y-3 mb-12">
          {videos.map((v) => (
            <li key={v.id} className="rounded-lg border border-neutral-800 p-3 flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">{v.productName}</p>
                <p className="text-xs text-neutral-500">
                  {v.status === "pending" ? "In progress" : v.status} · {new Date(v.createdAt).toLocaleDateString()}
                </p>
              </div>
              {v.videoUrl && (
                <a href={v.videoUrl} target="_blank" className="text-xs text-blue-400 hover:underline">
                  Watch
                </a>
              )}
            </li>
          ))}
        </ul>
      )}

      <h2 className="text-lg font-medium mb-4">Posts</h2>
      {posts.length === 0 ? (
        <p className="text-sm text-neutral-500">No posts scheduled yet.</p>
      ) : (
        <ul className="space-y-3">
          {posts.map((p) => (
            <li key={p.id} className="rounded-lg border border-neutral-800 p-3">
              <div className="flex items-center justify-between mb-1">
                <p className="text-sm font-medium capitalize">{p.platform}</p>
                <span className="text-xs text-neutral-500">{new Date(p.scheduledAt).toLocaleString()}</span>
              </div>
              <p className="text-xs text-neutral-500">{p.productName} · {p.status}</p>
            </li>
          ))}
        </ul>
      )}

      {messages.length > 0 && (
        <>
          <h2 className="text-lg font-medium mb-4 mt-12">Messages</h2>
          <ul className="space-y-3">
            {messages.map((m) => (
              <li key={m.id} className="rounded-lg border border-neutral-800 p-3">
                <p className="text-xs text-neutral-500 mb-1">
                  You &middot; {new Date(m.createdAt).toLocaleString()}
                </p>
                <p className="text-sm text-neutral-300 mb-2">{m.message}</p>
                {m.response ? (
                  <div className="pt-2 border-t border-neutral-800">
                    <p className="text-xs text-blue-400 mb-1">
                      Reelio &middot; {m.respondedAt ? new Date(m.respondedAt).toLocaleString() : ""}
                    </p>
                    <p className="text-sm text-neutral-300">{m.response}</p>
                  </div>
                ) : (
                  <p className="text-xs text-neutral-600">Waiting on a reply...</p>
                )}
              </li>
            ))}
          </ul>
        </>
      )}

      <div className="mt-12 pt-6 border-t border-neutral-800 space-y-4">
        <AvatarPicker
          token={token}
          currentAvatarId={lead.avatarId}
          currentAvatarName={currentAvatarName}
          changesUsed={lead.avatarChangesUsed}
          changesAllowed={tier.avatarChangesAllowed}
        />
        <VideoNotes token={token} initialNotes={lead.videoNotes} initialCaptionsEnabled={lead.captionsEnabled} />
      </div>

      <div className="mt-6 pt-6 border-t border-neutral-800 flex flex-wrap items-start gap-3">
        <NeedHelp token={token} />
        <span className="text-neutral-700">&middot;</span>
        <CancelSubscription token={token} />
      </div>
    </main>
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
