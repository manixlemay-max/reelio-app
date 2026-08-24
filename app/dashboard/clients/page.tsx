import { listLeads, listSubscriptions, ensureLeadReportToken, listProducts, listAllSupportRequests } from "@/lib/db";
import LeadIntegrations from "@/components/LeadIntegrations";
import { headers } from "next/headers";
import Link from "next/link";

export const dynamic = "force-dynamic";

function statusBadge(status: string | undefined, cancelAtPeriodEnd: boolean | undefined, periodEnd: string | null | undefined) {
  if (!status) return { text: "No subscription found", color: "text-neutral-500" };
  if (cancelAtPeriodEnd && (status === "active" || status === "trialing")) {
    const when = periodEnd ? new Date(periodEnd).toLocaleDateString() : "end of billing period";
    return { text: `Canceling on ${when}`, color: "text-amber-400" };
  }
  if (status === "active" || status === "trialing") return { text: `Active (${status})`, color: "text-green-400" };
  if (status === "canceled") return { text: "Canceled", color: "text-red-400" };
  return { text: status, color: "text-amber-400" };
}

const CANCEL_REASON_LABELS: Record<string, string> = {
  too_expensive: "It's too expensive",
  not_using_it: "Not using it enough",
  missing_features: "Missing something they needed",
  bad_quality: "Video quality wasn't right for them",
  switched_provider: "Switched to something else",
  other: "Other",
};

export default async function ClientsPage() {
  const [leads, subscriptions, products, supportRequests] = await Promise.all([
    listLeads(),
    listSubscriptions(),
    listProducts(),
    listAllSupportRequests(),
  ]);
  const supportByLead = new Map<string, typeof supportRequests>();
  for (const r of supportRequests) {
    if (!supportByLead.has(r.leadId)) supportByLead.set(r.leadId, []);
    supportByLead.get(r.leadId)!.push(r);
  }
  const subsByEmail = new Map(subscriptions.map((s) => [s.email?.toLowerCase(), s]));
  const productsByLead = new Map<string, typeof products>();
  for (const p of products) {
    if (!p.leadId) continue;
    if (!productsByLead.has(p.leadId)) productsByLead.set(p.leadId, []);
    productsByLead.get(p.leadId)!.push(p);
  }

  const h = await headers();
  const host = h.get("host");
  const proto = host?.startsWith("localhost") ? "http" : "https";
  const baseUrl = host ? `${proto}://${host}` : "";

  const reportTokens = await Promise.all(leads.map((lead) => ensureLeadReportToken(lead.id)));
  const tokenByLeadId = new Map(leads.map((lead, i) => [lead.id, reportTokens[i]]));

  return (
    <div>
      <h1 className="text-xl font-semibold mb-6">Clients</h1>
      {leads.length === 0 ? (
        <p className="text-neutral-500 text-sm">
          No new client sign-ups yet. When someone pays and fills out the welcome form,
          they'll show up here.
        </p>
      ) : (
        <div className="space-y-4">
          {leads.map((lead) => {
            const sub = subsByEmail.get(lead.email.toLowerCase());
            const badge = statusBadge(sub?.status, sub?.cancelAtPeriodEnd, sub?.currentPeriodEnd);
            return (
              <div key={lead.id} className="rounded-lg border border-neutral-800 p-4">
                <div className="flex items-baseline justify-between mb-2">
                  <h2 className="font-medium">{lead.businessName}</h2>
                  <span className="text-xs text-neutral-500">
                    {new Date(lead.createdAt).toLocaleString()}
                  </span>
                </div>
                <p className="text-sm text-neutral-500 mb-1">
                  {lead.name} &middot; {lead.email}
                </p>
                <p className={`text-xs font-medium mb-2 ${badge.color}`}>{badge.text}</p>
                {sub?.cancellationReason && (
                  <p className="text-xs text-neutral-500 mb-2">
                    Cancellation reason: {CANCEL_REASON_LABELS[sub.cancellationReason] ?? sub.cancellationReason}
                    {sub.cancellationFeedback ? ` — "${sub.cancellationFeedback}"` : ""}
                  </p>
                )}
                <p className="text-sm text-neutral-400 mb-2 whitespace-pre-wrap">
                  {lead.productDescription}
                </p>
                {lead.socialHandles && (
                  <p className="text-xs text-neutral-500">Socials: {lead.socialHandles}</p>
                )}
                {lead.notes && (
                  <p className="text-xs text-neutral-500 mt-1">Notes: {lead.notes}</p>
                )}
                <div className="mt-3 pt-3 border-t border-neutral-900">
                  <p className="text-xs text-neutral-500 mb-1.5">
                    Products ({(productsByLead.get(lead.id) ?? []).length})
                  </p>
                  {(productsByLead.get(lead.id) ?? []).length === 0 ? (
                    <p className="text-xs text-neutral-600">
                      None linked yet —{" "}
                      <Link href="/dashboard/products" className="text-blue-400 hover:underline">
                        link one on the Products page
                      </Link>
                      .
                    </p>
                  ) : (
                    <ul className="flex flex-wrap gap-1.5">
                      {(productsByLead.get(lead.id) ?? []).map((p) => (
                        <li key={p.id} className="rounded-full bg-neutral-900 border border-neutral-800 px-2.5 py-1 text-xs text-neutral-300">
                          {p.name}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
                <LeadIntegrations lead={lead} />
                {(supportByLead.get(lead.id) ?? []).length > 0 && (
                  <div className="mt-3 pt-3 border-t border-neutral-900">
                    <p className="text-xs text-neutral-500 mb-1.5">Help requests</p>
                    <ul className="space-y-1.5">
                      {(supportByLead.get(lead.id) ?? []).map((r) => (
                        <li key={r.id} className="text-xs text-neutral-400 rounded-lg bg-neutral-900/60 px-2.5 py-2">
                          <span className="text-neutral-600">{new Date(r.createdAt).toLocaleString()}</span>
                          {r.resolved && <span className="text-green-500 ml-2">Resolved</span>}
                          <p className="mt-0.5">{r.message}</p>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                <p className="text-xs text-neutral-500 mt-2 break-all">
                  Client report link:{" "}
                  <a
                    href={`${baseUrl}/report/${tokenByLeadId.get(lead.id)}`}
                    target="_blank"
                    className="text-blue-400 hover:underline"
                  >
                    {baseUrl}/report/{tokenByLeadId.get(lead.id)}
                  </a>
                </p>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
