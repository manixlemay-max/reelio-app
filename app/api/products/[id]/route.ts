import { NextRequest, NextResponse } from "next/server";
import { deleteProduct, updateProductLead } from "@/lib/db";

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await deleteProduct(id);
  return NextResponse.json({ ok: true });
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json();
  await updateProductLead(id, body.leadId ?? null);
  return NextResponse.json({ ok: true });
}
