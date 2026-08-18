import { NextRequest, NextResponse } from "next/server";
import { getConnectUrl } from "@/lib/postingProvider";
import type { Platform } from "@/lib/types";

export async function GET(req: NextRequest) {
  const platform = req.nextUrl.searchParams.get("platform") as Platform | null;
  if (!platform || !["tiktok", "instagram", "youtube"].includes(platform)) {
    return NextResponse.json({ error: "Invalid platform" }, { status: 400 });
  }
  const url = await getConnectUrl(platform);
  if (!url) {
    return NextResponse.json({ error: "Postiz not configured or request failed" }, { status: 500 });
  }
  return NextResponse.json({ url });
}
