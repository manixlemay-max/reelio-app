import { NextResponse } from "next/server";
import { listAvatars } from "@/lib/videoProvider";

export async function GET() {
  const avatars = await listAvatars();
  if (avatars === null) {
    return NextResponse.json({ avatars: [], demoMode: true });
  }
  return NextResponse.json({ avatars, demoMode: false });
}
