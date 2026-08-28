import { NextRequest, NextResponse } from "next/server";
import { getLeadByToken, updateLeadVideoNotes } from "@/lib/db";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { token, notes } = body as { token?: string; notes?: string };

  if (!token) {
    return NextResponse.json({ error: "Missing token" }, { status: 400 });
  }

  const lead = await getLeadByToken(token);
  if (!lead) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  await updateLeadVideoNotes(lead.id, (notes ?? "").trim().slice(0, 500));
  return NextResponse.json({ ok: true });
}
