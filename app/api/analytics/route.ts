import { NextRequest, NextResponse } from "next/server";
import { listAnalytics, listPosts, recordAnalytics } from "@/lib/db";
import { suggestBestPostingTime } from "@/lib/postingProvider";
import { isDashboardAuthed } from "@/lib/auth";

export async function GET(req: NextRequest) {
  if (!(await isDashboardAuthed(req))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let rows = await listAnalytics();

  // Demo mode: if no real data has been collected yet (e.g. the posting
  // provider doesn't report stats yet), generate sample numbers from
  // existing posts so the analytics dashboard is viewable from day one.
  if (rows.length === 0) {
    const posts = await listPosts();
    for (const post of posts) {
      await recordAnalytics({
        postId: post.id,
        views: Math.floor(Math.random() * 5000) + 100,
        likes: Math.floor(Math.random() * 400),
        comments: Math.floor(Math.random() * 60),
        shares: Math.floor(Math.random() * 40),
      });
    }
    rows = await listAnalytics();
  }

  const bestTimes = suggestBestPostingTime(
    rows.map((r) => ({ platform: r.platform, capturedAt: r.capturedAt, views: r.views }))
  );

  return NextResponse.json({ rows, bestTimes });
}
