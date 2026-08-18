import { NextRequest, NextResponse } from "next/server";
import { generateVideo } from "@/lib/videoProvider";
import {
  listLeads,
  listSubscriptions,
  getProductsByLead,
  getLatestVideoForLead,
  createProduct,
  createVideo,
} from "@/lib/db";
import { TIERS } from "@/lib/pricing";

// Runs once a day (see vercel.json). For every paying client, figures out
// whether they're "due" for their next video based on how many videos their
// plan includes per month, and generates it automatically. Paced so a
// Starter client (10/month) gets roughly one every 3 days, a Pro client
// (100/month) gets several per run to keep up — fully hands-off.
export const maxDuration = 60;

const ACTIVE_STATUSES = new Set(["active", "trialing"]);
const MAX_VIDEOS_PER_RUN_PER_LEAD = 4; // cost/rate-limit safety cap

function authorized(req: NextRequest): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return true;
  return req.headers.get("authorization") === `Bearer ${secret}`;
}

export async function GET(req: NextRequest) {
  if (!authorized(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const [leads, subscriptions] = await Promise.all([listLeads(), listSubscriptions()]);
  const subByEmail = new Map(subscriptions.map((s) => [s.email?.toLowerCase() ?? "", s]));

  const log: string[] = [];

  for (const lead of leads) {
    const sub = subByEmail.get(lead.email.toLowerCase());
    if (!sub || !ACTIVE_STATUSES.has(sub.status)) continue;

    // No point generating videos for a client who hasn't connected any
    // account yet — nothing to post them to.
    const hasConnectedAccount = lead.tiktokIntegrationId || lead.instagramIntegrationId || lead.youtubeIntegrationId;
    if (!hasConnectedAccount) continue;

    const tier = TIERS.find((t) => t.id === sub.tierId) ?? TIERS[0];
    const intervalHours = (30 * 24) / tier.videosPerMonth;

    const latestVideo = await getLatestVideoForLead(lead.id);
    let dueCount = 1;
    if (latestVideo) {
      const hoursSince = (Date.now() - new Date(latestVideo.createdAt).getTime()) / 3_600_000;
      dueCount = Math.floor(hoursSince / intervalHours);
      if (dueCount < 1) continue; // not due yet
    }
    dueCount = Math.min(dueCount, MAX_VIDEOS_PER_RUN_PER_LEAD);

    let products = await getProductsByLead(lead.id);
    let product = products[0];
    if (!product) {
      product = await createProduct({
        name: lead.businessName,
        description: lead.productDescription,
        leadId: lead.id,
      });
    }

    for (let i = 0; i < dueCount; i++) {
      const result = await generateVideo({
        productName: product.name,
        productDescription: product.description,
        imageUrl: product.imageUrl,
      });
      await createVideo({
        productId: product.id,
        provider: result.provider,
        status: result.status,
        videoUrl: result.videoUrl,
        externalJobId: result.externalJobId ?? null,
      });
      log.push(`${lead.id} (${tier.name}): generated video ${i + 1}/${dueCount} (${result.status})`);
    }
  }

  return NextResponse.json({ ok: true, log });
}
