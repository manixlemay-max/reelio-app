import { NextRequest, NextResponse } from "next/server";
import { listIntegrations } from "@/lib/postingProvider";
import { isDashboardAuthed } from "@/lib/auth";

export async function GET(req: NextRequest) {
  if (!(await isDashboardAuthed(req))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const integrations = await listIntegrations();
  if (integrations === null) {
    return NextResponse.json(
      { integrations: [], demoMode: true },
      { status: 200 }
    );
  }
  return NextResponse.json({ integrations, demoMode: false });
}
