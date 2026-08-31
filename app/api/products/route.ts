import { NextRequest, NextResponse } from "next/server";
import { createProduct, listProducts } from "@/lib/db";
import { isDashboardAuthed } from "@/lib/auth";

export async function GET(req: NextRequest) {
  if (!(await isDashboardAuthed(req))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  return NextResponse.json({ products: await listProducts() });
}

export async function POST(req: NextRequest) {
  if (!(await isDashboardAuthed(req))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  if (!body.name || !body.description) {
    return NextResponse.json({ error: "name and description are required" }, { status: 400 });
  }
  const product = await createProduct({
    name: body.name,
    description: body.description,
    imageUrl: body.imageUrl,
    leadId: body.leadId || null,
  });
  return NextResponse.json({ product }, { status: 201 });
}
