import { NextResponse } from "next/server";
import { listIntegrations } from "@/lib/postingProvider";

export async function GET() {
  const integrations = await listIntegrations();
  if (integrations === null) {
    return NextResponse.json(
      { integrations: [], demoMode: true },
      { status: 200 }
    );
  }
  return NextResponse.json({ integrations, demoMode: false });
}
