import { NextRequest, NextResponse } from "next/server";
import { createProduct, listProducts } from "@/lib/db";

export async function GET() {
  return NextResponse.json({ products: listProducts() });
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  if (!body.name || !body.description) {
    return NextResponse.json({ error: "name et description sont requis" }, { status: 400 });
  }
  const product = createProduct({
    name: body.name,
    description: body.description,
    imageUrl: body.imageUrl,
  });
  return NextResponse.json({ product }, { status: 201 });
}
