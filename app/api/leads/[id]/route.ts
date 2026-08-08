import { NextRequest, NextResponse } from "next/server";
import { updateLeadIntegrations } from "@/lib/db";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json();

  const lead = await updateLeadIntegrations(id, {
    tiktokIntegrationId: body.tiktokIntegrationId,
    instagramIntegrationId: body.instagramIntegrationId,
    youtubeIntegrationId: body.youtubeIntegrationId,
  });

  if (!lead) {
    return NextResponse.json({ error: "Client not found" }, { status: 404 });
  }

  return NextResponse.json({ lead });
}
