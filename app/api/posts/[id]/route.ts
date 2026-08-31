import { NextRequest, NextResponse } from "next/server";
import { deletePost, updatePostSchedule } from "@/lib/db";
import { isDashboardAuthed } from "@/lib/auth";

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!(await isDashboardAuthed(req))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  await deletePost(id);
  return NextResponse.json({ ok: true });
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!(await isDashboardAuthed(req))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const body = await req.json();
  if (!body.scheduledAt) {
    return NextResponse.json({ error: "scheduledAt is required" }, { status: 400 });
  }
  await updatePostSchedule(id, body.scheduledAt);
  return NextResponse.json({ ok: true });
}
