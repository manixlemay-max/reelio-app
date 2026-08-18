import { listLeads, listSubscriptions, ensureLeadReportToken } from "@/lib/db";
import LeadIntegrations from "@/components/LeadIntegrations";
import { headers } from "next/headers";

export const dynamic = "force-dynamic";

function statusBadge(status: string | undefined) {
  if (!status) return { text: "No subscription found", color: "text-neutral-500" };
  if (status === "active" || status === "trialing") return { text: `Active (${status})`, color: "text-green-600" };
  if (status === "canceled") return { text: "Canceled", color: "text-red-600" };
  return { text: status, color: "text-amber-600" };
}

export default async function ClientsPage() {
  const [leads, subscriptions] = await Promise.all([listLeads(), listSubscriptions()]);
  const subsByEmail = new Map(subscriptions.map((s) => [s.email?.toLowerCase(), s]));

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
            const badge = statusBadge(sub?.status);
            return (
              <div key={lead.id} className="rounded-lg border border-neutral-200 p-4">
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
                <p className="text-sm text-neutral-600 mb-2 whitespace-pre-wrap">
                  {lead.productDescription}
                </p>
                {lead.socialHandles && (
                  <p className="text-xs text-neutral-500">Socials: {lead.socialHandles}</p>
                )}
                {lead.notes && (
                  <p className="text-xs text-neutral-500 mt-1">Notes: {lead.notes}</p>
                )}
                <LeadIntegrations lead={lead} />
                <p className="text-xs text-neutral-500 mt-2 break-all">
                  Client report link:{" "}
                  <a
                    href={`${baseUrl}/report/${tokenByLeadId.get(lead.id)}`}
                    target="_blank"
                    className="text-indigo-600 hover:underline"
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
