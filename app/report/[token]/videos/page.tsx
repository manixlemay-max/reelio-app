import { getLeadByToken, getClientReport } from "@/lib/db";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function ClientVideosPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const lead = await getLeadByToken(token);
  if (!lead) return notFound();

  const { videos } = await getClientReport(lead.id);

  return (
    <div>
      <h1 className="text-2xl font-semibold mb-8">Videos</h1>

      {videos.length === 0 ? (
        <p className="text-sm text-neutral-500">No videos yet — your first one is coming soon.</p>
      ) : (
        <ul className="space-y-3">
          {videos.map((v) => (
            <li key={v.id} className="rounded-xl border border-neutral-800 p-4 flex items-center justify-between">
              <div>
                <p className="font-medium text-sm">{v.productName}</p>
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
    </div>
  );
}
