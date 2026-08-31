import { NextRequest, NextResponse } from "next/server";
import { respondToSupportRequest } from "@/lib/db";
import { isDashboardAuthed } from "@/lib/auth";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!(await isDashboardAuthed(req))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const body = await req.json();
  const response = (body.response as string | undefined)?.trim();

  if (!response) {
    return NextResponse.json({ error: "Reply can't be empty" }, { status: 400 });
  }

  await respondToSupportRequest(id, response.slice(0, 2000));
  return NextResponse.json({ ok: true });
}
