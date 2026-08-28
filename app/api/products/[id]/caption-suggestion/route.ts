import { NextResponse } from "next/server";
import { getProduct } from "@/lib/db";
import { buildSmartCaption } from "@/lib/caption";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const product = await getProduct(id);
  if (!product) {
    return NextResponse.json({ error: "Product not found" }, { status: 404 });
  }
  const caption = buildSmartCaption(product.name, product.description);
  return NextResponse.json({ caption });
}
