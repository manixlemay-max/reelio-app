import { NextRequest, NextResponse } from "next/server";
import { deletePost, updatePostSchedule } from "@/lib/db";

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await deletePost(id);
  return NextResponse.json({ ok: true });
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json();
  if (!body.scheduledAt) {
    return NextResponse.json({ error: "scheduledAt is required" }, { status: 400 });
  }
  await updatePostSchedule(id, body.scheduledAt);
  return NextResponse.json({ ok: true });
}
