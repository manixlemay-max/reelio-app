"use client";

import { useEffect, useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, Plus, X, Trash2, Pencil } from "lucide-react";

type Video = { id: string; productId: string; productName: string; status: string; videoUrl: string | null };
type Post = { id: string; platform: string; hashtags: string; scheduledAt: string; status: string; productName: string };

const PLATFORM_COLOR: Record<string, string> = {
  tiktok: "bg-fuchsia-500",
  instagram: "bg-pink-500",
  youtube: "bg-red-500",
};

function startOfMonth(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}
function sameDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

export default function SchedulePage() {
  const [videos, setVideos] = useState<Video[]>([]);
  const [posts, setPosts] = useState<Post[]>([]);
  const [videoId, setVideoId] = useState("");
  const [platform, setPlatform] = useState<"tiktok" | "instagram" | "youtube">("tiktok");
  const [hashtags, setHashtags] = useState("");
  const [scheduledAt, setScheduledAt] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [month, setMonth] = useState(() => startOfMonth(new Date()));
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);
  const [suggesting, setSuggesting] = useState(false);

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
    setError(null);
    const res = await fetch("/api/schedule-post", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ videoId, platform, hashtags, scheduledAt }),
    });
    setSubmitting(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Something went wrong while scheduling this post.");
    } else {
      setHashtags("");
      setScheduledAt("");
      setShowForm(false);
    }
    refresh();
  }

  async function suggestCaption() {
    const video = videos.find((v) => v.id === videoId);
    if (!video) return;
    setSuggesting(true);
    try {
      const res = await fetch(`/api/products/${video.productId}/caption-suggestion`);
      const data = await res.json();
      if (data.caption) setHashtags(data.caption);
    } catch {
      // silently ignore — the field is still editable manually
    } finally {
      setSuggesting(false);
    }
  }

  async function removePost(id: string) {
    if (!confirm("Remove this scheduled post?")) return;
    setBusyId(id);
    await fetch(`/api/posts/${id}`, { method: "DELETE" });
    setBusyId(null);
    refresh();
  }

  function startEdit(p: Post) {
    setEditingId(p.id);
    // datetime-local expects "YYYY-MM-DDTHH:mm"
    const d = new Date(p.scheduledAt);
    const pad = (n: number) => String(n).padStart(2, "0");
    setEditValue(`${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`);
  }

  async function saveEdit(id: string) {
    if (!editValue) return;
    setBusyId(id);
    await fetch(`/api/posts/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ scheduledAt: new Date(editValue).toISOString() }),
    });
    setBusyId(null);
    setEditingId(null);
    refresh();
  }

  const days = useMemo(() => {
    const first = startOfMonth(month);
    const gridStart = new Date(first);
    gridStart.setDate(first.getDate() - first.getDay()); // back to Sunday
    return Array.from({ length: 42 }, (_, i) => {
      const d = new Date(gridStart);
      d.setDate(gridStart.getDate() + i);
      return d;
    });
  }, [month]);

  const postsByDay = useMemo(() => {
    const map = new Map<string, Post[]>();
    for (const p of posts) {
      const key = new Date(p.scheduledAt).toDateString();
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(p);
    }
    return map;
  }, [posts]);

  const monthLabel = month.toLocaleDateString("en-US", { month: "long", year: "numeric" });
  const today = new Date();

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold">Schedule</h1>
        <button
          onClick={() => setShowForm((s) => !s)}
          disabled={videos.length === 0}
          className="flex items-center gap-1.5 rounded-full bg-blue-600 text-white px-4 py-2 text-sm font-medium hover:bg-blue-500 transition disabled:opacity-50"
        >
          {showForm ? <X size={16} /> : <Plus size={16} />}
          {showForm ? "Close" : "New post"}
        </button>
      </div>

      {videos.length === 0 && (
        <p className="text-neutral-500 mb-6 text-sm">Generate a video first before scheduling it.</p>
      )}

      {showForm && videos.length > 0 && (
        <form onSubmit={onSubmit} className="space-y-3 max-w-lg mb-10 rounded-xl border border-neutral-800 p-4">
          <select
            value={videoId}
            onChange={(e) => setVideoId(e.target.value)}
            className="w-full rounded-lg bg-neutral-900 border border-neutral-800 text-neutral-100 px-3 py-2 text-sm"
          >
            {videos.map((v) => (
              <option key={v.id} value={v.id}>
                {v.productName}
              </option>
            ))}
          </select>

          <select
            value={platform}
            onChange={(e) => setPlatform(e.target.value as "tiktok" | "instagram" | "youtube")}
            className="w-full rounded-lg bg-neutral-900 border border-neutral-800 text-neutral-100 px-3 py-2 text-sm"
          >
            <option value="tiktok">TikTok</option>
            <option value="instagram">Instagram</option>
            <option value="youtube">YouTube</option>
          </select>

          <div>
            <textarea
              value={hashtags}
              onChange={(e) => setHashtags(e.target.value)}
              placeholder="#ecommerce #ugc #myproduct"
              rows={3}
              className="w-full rounded-lg bg-neutral-900 border border-neutral-800 text-neutral-100 placeholder-neutral-500 px-3 py-2 text-sm mb-1.5"
            />
            <button
              type="button"
              onClick={suggestCaption}
              disabled={suggesting || !videoId}
              className="text-xs text-blue-400 hover:underline disabled:opacity-50"
            >
              {suggesting ? "Thinking..." : "Suggest a caption + hashtags"}
            </button>
          </div>

          <input
            type="datetime-local"
            value={scheduledAt}
            onChange={(e) => setScheduledAt(e.target.value)}
            required
            className="w-full rounded-lg bg-neutral-900 border border-neutral-800 text-neutral-100 px-3 py-2 text-sm"
          />

          {error && <p className="text-sm text-red-400 whitespace-pre-wrap">{error}</p>}

          <button
            type="submit"
            disabled={submitting}
            className="rounded-full bg-blue-600 text-white px-5 py-2 text-sm font-medium hover:bg-blue-500 transition disabled:opacity-50"
          >
            {submitting ? "Scheduling..." : "Schedule post"}
          </button>
        </form>
      )}

      <div className="flex items-center justify-between mb-3">
        <p className="text-sm font-medium text-neutral-300">{monthLabel}</p>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setMonth((m) => new Date(m.getFullYear(), m.getMonth() - 1, 1))}
            className="rounded-md p-1.5 hover:bg-neutral-900 transition"
          >
            <ChevronLeft size={16} />
          </button>
          <button
            onClick={() => setMonth(startOfMonth(new Date()))}
            className="text-xs text-neutral-400 hover:text-neutral-200 px-2"
          >
            Today
          </button>
          <button
            onClick={() => setMonth((m) => new Date(m.getFullYear(), m.getMonth() + 1, 1))}
            className="rounded-md p-1.5 hover:bg-neutral-900 transition"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-7 text-center text-xs text-neutral-500 mb-1">
        {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
          <div key={d} className="py-1">
            {d}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1 mb-10">
        {days.map((d) => {
          const dayPosts = postsByDay.get(d.toDateString()) ?? [];
          const inMonth = d.getMonth() === month.getMonth();
          const isToday = sameDay(d, today);
          return (
            <div
              key={d.toISOString()}
              className={`min-h-[5.5rem] rounded-lg border p-1.5 ${
                inMonth ? "border-neutral-800" : "border-neutral-900"
              } ${isToday ? "bg-blue-500/10 border-blue-500/40" : ""}`}
            >
              <p className={`text-xs mb-1 ${inMonth ? "text-neutral-400" : "text-neutral-700"}`}>{d.getDate()}</p>
              <div className="space-y-1">
                {dayPosts.slice(0, 3).map((p) => (
                  <div key={p.id} className="flex items-center gap-1 text-[10px] text-neutral-300 truncate">
                    <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${PLATFORM_COLOR[p.platform] ?? "bg-neutral-500"}`} />
                    <span className="truncate">{p.productName}</span>
                  </div>
                ))}
                {dayPosts.length > 3 && (
                  <p className="text-[10px] text-neutral-600">+{dayPosts.length - 3} more</p>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <h2 className="text-sm font-medium text-neutral-500 mb-3">All scheduled posts</h2>
      <ul className="space-y-2">
        {posts.map((p) => (
          <li key={p.id} className="rounded-xl border border-neutral-800 p-4 flex items-center gap-3">
            <span className={`w-2 h-2 rounded-full shrink-0 ${PLATFORM_COLOR[p.platform] ?? "bg-neutral-500"}`} />
            <div className="flex-1 min-w-0">
              <p className="font-medium">
                {p.productName} · {p.platform}
              </p>
              {editingId === p.id ? (
                <div className="flex items-center gap-2 mt-1">
                  <input
                    type="datetime-local"
                    value={editValue}
                    onChange={(e) => setEditValue(e.target.value)}
                    className="rounded-lg bg-neutral-900 border border-neutral-800 text-neutral-100 px-2 py-1 text-xs"
                  />
                  <button
                    onClick={() => saveEdit(p.id)}
                    disabled={busyId === p.id}
                    className="text-xs rounded-full bg-blue-600 text-white px-3 py-1 hover:bg-blue-500 transition disabled:opacity-50"
                  >
                    Save
                  </button>
                  <button
                    onClick={() => setEditingId(null)}
                    className="text-xs text-neutral-500 hover:text-neutral-300 transition"
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <p className="text-sm text-neutral-500">
                  {new Date(p.scheduledAt).toLocaleString("en-US")} · {p.status}
                </p>
              )}
            </div>
            {editingId !== p.id && (
              <div className="flex items-center gap-1 shrink-0">
                <button
                  onClick={() => startEdit(p)}
                  disabled={busyId === p.id}
                  title="Change date/time"
                  className="rounded-lg p-1.5 text-neutral-500 hover:bg-neutral-900 hover:text-neutral-300 transition disabled:opacity-50"
                >
                  <Pencil size={14} />
                </button>
                <button
                  onClick={() => removePost(p.id)}
                  disabled={busyId === p.id}
                  title="Remove"
                  className="rounded-lg p-1.5 text-red-400 hover:bg-red-500/10 transition disabled:opacity-50"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
