import { NextRequest, NextResponse } from "next/server";
import { deleteVideo } from "@/lib/db";
import { isDashboardAuthed } from "@/lib/auth";

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!(await isDashboardAuthed(req))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  await deleteVideo(id);
  return NextResponse.json({ ok: true });
}
