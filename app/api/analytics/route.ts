import { NextResponse } from "next/server";
import { listAnalytics, listPosts, recordAnalytics } from "@/lib/db";
import { suggestBestPostingTime } from "@/lib/postingProvider";

export async function GET() {
  let rows = listAnalytics();

  // Mode démo : si aucune donnée réelle n'a encore été collectée
  // (ex: le fournisseur de publication ne renvoie pas encore de stats),
  // on génère des chiffres d'exemple à partir des posts existants pour que
  // le dashboard analytics soit visualisable dès le premier jour.
  if (rows.length === 0) {
    const posts = listPosts();
    for (const post of posts) {
      recordAnalytics({
        postId: post.id,
        views: Math.floor(Math.random() * 5000) + 100,
        likes: Math.floor(Math.random() * 400),
        comments: Math.floor(Math.random() * 60),
        shares: Math.floor(Math.random() * 40),
      });
    }
    rows = listAnalytics();
  }

  const bestTimes = suggestBestPostingTime(
    rows.map((r) => ({ platform: r.platform, capturedAt: r.capturedAt, views: r.views }))
  );

  return NextResponse.json({ rows, bestTimes });
}
