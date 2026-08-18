import { NextRequest, NextResponse } from "next/server";
import { generateVideo } from "@/lib/videoProvider";
import { createVideo, getProduct } from "@/lib/db";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const product = await getProduct(body.productId);
  if (!product) {
    return NextResponse.json({ error: "Product not found" }, { status: 404 });
  }

  const result = await generateVideo({
    productName: product.name,
    productDescription: product.description,
    imageUrl: product.imageUrl,
    avatarId: body.avatarId || null,
    voiceId: body.voiceId || null,
  });

  const video = await createVideo({
    productId: product.id,
    provider: result.provider,
    status: result.status,
    videoUrl: result.videoUrl,
    externalJobId: result.externalJobId ?? null,
  });

  return NextResponse.json({ video }, { status: 201 });
}
