import { NextRequest, NextResponse } from "next/server";
import { getProduct } from "@/lib/db";
import { buildSmartCaption } from "@/lib/caption";
import { isDashboardAuthed } from "@/lib/auth";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!(await isDashboardAuthed(req))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const product = await getProduct(id);
  if (!product) {
    return NextResponse.json({ error: "Product not found" }, { status: 404 });
  }
  const caption = buildSmartCaption(product.name, product.description);
  return NextResponse.json({ caption });
}
