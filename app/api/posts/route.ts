import { NextResponse } from "next/server";
import { listPosts } from "@/lib/db";

export async function GET() {
  return NextResponse.json({ posts: await listPosts() });
}
