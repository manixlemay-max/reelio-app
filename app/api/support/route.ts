import { NextRequest, NextResponse } from "next/server";
import { getLeadByToken, createSupportRequest } from "@/lib/db";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { token, message } = body as { token?: string; message?: string };

  if (!token || !message || !message.trim()) {
    return NextResponse.json({ error: "Missing token or message" }, { status: 400 });
  }

  const lead = await getLeadByToken(token);
  if (!lead) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const request = await createSupportRequest(lead.id, message.trim().slice(0, 2000));
  return NextResponse.json({ request }, { status: 201 });
}
