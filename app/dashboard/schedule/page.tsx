"use client";

import { useEffect, useState } from "react";

type Video = { id: string; productName: string; status: string; videoUrl: string | null };
type Post = { id: string; platform: string; hashtags: string; scheduledAt: string; status: string; productName: string };

export default function SchedulePage() {
  const [videos, setVideos] = useState<Video[]>([]);
  const [posts, setPosts] = useState<Post[]>([]);
  const [videoId, setVideoId] = useState("");
  const [platform, setPlatform] = useState<"tiktok" | "instagram">("tiktok");
  const [hashtags, setHashtags] = useState("");
  const [scheduledAt, setScheduledAt] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function refresh() {
    const [videosRes, postsRes] = await Promise.all([
      fetch("/api/videos").then((r) => r.json()),
      fetch("/api/posts").then((r) => r.json()),
    ]);
    const ready = videosRes.videos.filter((v: Video) => v.status === "ready");
    setVideos(ready);
    setPosts(postsRes.posts);
    if (!videoId && ready[0]) setVideoId(ready[0].id);
  }

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!videoId || !scheduledAt) return;
    setSubmitting(true);
    await fetch("/api/schedule-post", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ videoId, platform, hashtags, scheduledAt }),
    });
    setSubmitting(false);
    setHashtags("");
    setScheduledAt("");
    refresh();
  }

  return (
    <div>
      <h1 className="text-2xl font-semibold mb-8">Schedule</h1>

      {videos.length === 0 ? (
        <p className="text-neutral-400 mb-8">Generate a video first before scheduling it.</p>
      ) : (
        <form onSubmit={onSubmit} className="space-y-4 max-w-lg mb-12">
          <select
            value={videoId}
            onChange={(e) => setVideoId(e.target.value)}
            className="w-full rounded-lg bg-neutral-900 border border-neutral-800 text-neutral-100 placeholder-neutral-500 px-3 py-2 text-sm"
          >
            {videos.map((v) => (
              <option key={v.id} value={v.id}>
                {v.productName}
              </option>
            ))}
          </select>

          <select
            value={platform}
            onChange={(e) => setPlatform(e.target.value as "tiktok" | "instagram")}
            className="w-full rounded-lg bg-neutral-900 border border-neutral-800 text-neutral-100 placeholder-neutral-500 px-3 py-2 text-sm"
          >
            <option value="tiktok">TikTok</option>
            <option value="instagram">Instagram</option>
          </select>

          <input
            value={hashtags}
            onChange={(e) => setHashtags(e.target.value)}
            placeholder="#ecommerce #ugc #myproduct"
            className="w-full rounded-lg bg-neutral-900 border border-neutral-800 text-neutral-100 placeholder-neutral-500 px-3 py-2 text-sm"
          />

          <input
            type="datetime-local"
            value={scheduledAt}
            onChange={(e) => setScheduledAt(e.target.value)}
            required
            className="w-full rounded-lg bg-neutral-900 border border-neutral-800 text-neutral-100 placeholder-neutral-500 px-3 py-2 text-sm"
          />

          <button
            type="submit"
            disabled={submitting}
            className="rounded-full bg-emerald-500 text-neutral-950 px-5 py-2 text-sm font-medium hover:bg-emerald-400 transition disabled:opacity-50"
          >
            {submitting ? "Scheduling..." : "Schedule post"}
          </button>
        </form>
      )}

      <h2 className="text-sm font-medium text-neutral-500 mb-3">Scheduled posts</h2>
      <ul className="space-y-2">
        {posts.map((p) => (
          <li key={p.id} className="rounded-xl border border-neutral-800 p-4">
            <p className="font-medium">
              {p.productName} · {p.platform}
            </p>
            <p className="text-sm text-neutral-400">
              {new Date(p.scheduledAt).toLocaleString("en-US")} · {p.status}
            </p>
          </li>
        ))}
      </ul>
    </div>
  );
}
