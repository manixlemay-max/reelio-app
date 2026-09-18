import { getLeadByToken, getClientReport, getSubscriptionByEmail } from "@/lib/db";
import { notFound } from "next/navigation";
import ClientCalendar from "@/components/ClientCalendar";
import ConnectAccounts from "@/components/ConnectAccounts";
import { TIERS } from "@/lib/pricing";

export const dynamic = "force-dynamic";

export default async function ClientSchedulePage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const lead = await getLeadByToken(token);
  if (!lead) return notFound();

  const { posts } = await getClientReport(lead.id);
  const hasConnectedAccount = lead.tiktokIntegrationId || lead.instagramIntegrationId || lead.youtubeIntegrationId;

  return (
    <div>
      <h1 className="text-2xl font-semibold mb-8">Schedule</h1>

      {!hasConnectedAccount && (
        <div className="mb-8">
          <p className="text-sm text-neutral-500 mb-4">
            Connect an account to start seeing your posting schedule here.
          </p>
          <ScheduleConnectPrompt email={lead.email} token={token} />
        </div>
      )}

      <ClientCalendar posts={posts} />
    </div>
  );
}

async function ScheduleConnectPrompt({ email, token }: { email: string; token: string }) {
  const sub = await getSubscriptionByEmail(email);
  const tier = TIERS.find((t) => t.id === sub?.tierId) ?? TIERS[0];
  return (
    <ConnectAccounts
      token={token}
      networksAllowed={tier.networksAllowed}
      initialConnected={{ tiktok: false, instagram: false, youtube: false }}
    />
  );
}
