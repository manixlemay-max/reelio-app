import { NextRequest, NextResponse } from "next/server";
import { generateVideo } from "@/lib/videoProvider";
import { createVideo, getProduct } from "@/lib/db";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const product = getProduct(body.productId);
  if (!product) {
    return NextResponse.json({ error: "Produit introuvable" }, { status: 404 });
  }

  const result = await generateVideo({
    productName: product.name,
    productDescription: product.description,
    imageUrl: product.imageUrl,
  });

  const video = createVideo({
    productId: product.id,
    provider: result.provider,
    status: result.status,
    videoUrl: result.videoUrl,
  });

  return NextResponse.json({ video }, { status: 201 });
}
