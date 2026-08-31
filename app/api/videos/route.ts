import { NextRequest, NextResponse } from "next/server";
import { listVideos } from "@/lib/db";
import { isDashboardAuthed } from "@/lib/auth";

export async function GET(req: NextRequest) {
  if (!(await isDashboardAuthed(req))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  return NextResponse.json({ videos: await listVideos() });
}
