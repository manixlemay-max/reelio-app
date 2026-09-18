import { NextRequest, NextResponse } from "next/server";

const HEYGEN_BASE = process.env.VIDEO_PROVIDER_API_URL || "https://api.heygen.com";

// Forwards a client-uploaded product photo to HeyGen's asset store, so it can
// later be composed into a studio video scene alongside the talking avatar.
// Public (no dashboard auth) — used from the public /welcome signup form,
// before a lead/token even exists yet, the same way /api/postiz/connect is.
export async function POST(req: NextRequest) {
  const apiKey = process.env.VIDEO_PROVIDER_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "Video provider not configured (demo mode)." }, { status: 500 });
  }

  const form = await req.formData();
  const file = form.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "No file provided." }, { status: 400 });
  }
  if (!["image/png", "image/jpeg", "image/webp"].includes(file.type)) {
    return NextResponse.json({ error: "Please upload a PNG, JPEG, or WEBP image." }, { status: 400 });
  }
  if (file.size > 32 * 1024 * 1024) {
    return NextResponse.json({ error: "Image is too large (32MB max)." }, { status: 400 });
  }

  const forward = new FormData();
  forward.append("file", file, file.name);

  const res = await fetch(`${HEYGEN_BASE}/v3/assets`, {
    method: "POST",
    headers: { "x-api-key": apiKey },
    body: forward,
  });

  if (!res.ok) {
    return NextResponse.json({ error: "Could not upload the image. Try again shortly." }, { status: 502 });
  }

  const data = await res.json();
  const assetId = data?.data?.asset_id ?? null;
  const url = data?.data?.url ?? null;
  if (!assetId || !url) {
    return NextResponse.json({ error: "Upload succeeded but the response was unexpected." }, { status: 502 });
  }

  return NextResponse.json({ assetId, url });
}
