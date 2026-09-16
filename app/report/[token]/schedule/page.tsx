import { getLeadByToken, getClientReport } from "@/lib/db";
import { notFound } from "next/navigation";
import ClientCalendar from "@/components/ClientCalendar";

export const dynamic = "force-dynamic";

export default async function ClientSchedulePage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const lead = await getLeadByToken(token);
  if (!lead) return notFound();

  const { posts } = await getClientReport(lead.id);

  return (
    <div>
      <h1 className="text-2xl font-semibold mb-8">Schedule</h1>
      <ClientCalendar posts={posts} />
    </div>
  );
}
