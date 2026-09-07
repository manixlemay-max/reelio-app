import { NextRequest, NextResponse } from "next/server";
import { listIntegrations } from "@/lib/postingProvider";
import type { Platform } from "@/lib/types";

// Called right before a client opens the Postiz OAuth tab for a platform.
// Snapshots which integration ids already exist for that platform so that,
// once they say "I'm done", we can diff against a fresh list and figure out
// which one they just created — no manual assignment needed from Manix.
export async function GET(req: NextRequest) {
  const platform = req.nextUrl.searchParams.get("platform") as Platform | null;
  if (!platform || !["tiktok", "instagram", "youtube"].includes(platform)) {
    return NextResponse.json({ error: "Invalid platform" }, { status: 400 });
  }

  const integrations = await listIntegrations();
  const ids = (integrations ?? []).filter((i) => i.identifier === platform).map((i) => i.id);
  return NextResponse.json({ ids });
}
