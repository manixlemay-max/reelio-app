import { NextRequest, NextResponse } from "next/server";
import { createProduct, listProducts } from "@/lib/db";

export async function GET() {
  return NextResponse.json({ products: await listProducts() });
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  if (!body.name || !body.description) {
    return NextResponse.json({ error: "name and description are required" }, { status: 400 });
  }
  const product = await createProduct({
    name: body.name,
    description: body.description,
    imageUrl: body.imageUrl,
  });
  return NextResponse.json({ product }, { status: 201 });
}
