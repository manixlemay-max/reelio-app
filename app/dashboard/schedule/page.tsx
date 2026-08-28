"use client";

import { useEffect, useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, Plus, X, Trash2, Pencil, Sparkles, Video as VideoIcon } from "lucide-react";
import DateTimePicker from "@/components/DateTimePicker";

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
function startOfWeek(d: Date) {
  const s = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  s.setDate(s.getDate() - s.getDay());
  return s;
}
function sameDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}
const HOURS = Array.from({ length: 24 }, (_, i) => i);
function formatHour(h: number) {
  if (h === 0) return "12am";
  if (h === 12) return "12pm";
  return h < 12 ? `${h}am` : `${h - 12}pm`;
}

// Subtle diagonal texture on empty calendar cells — a bit of the same
// "premium, not flat" feel as Postiz's grid, in our own neutral tone.
const CELL_TEXTURE: React.CSSProperties = {
  backgroundImage: "repeating-linear-gradient(-45deg, rgba(255,255,255,0.02) 0px, rgba(255,255,255,0.02) 1px, transparent 1px, transparent 8px)",
};

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
  const [view, setView] = useState<"day" | "week" | "month">("week");
  const [month, setMonth] = useState(() => startOfMonth(new Date()));
  const [week, setWeek] = useState(() => startOfWeek(new Date()));
  const [day, setDay] = useState(() => new Date());
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

  function openFormAt(d: Date, hour: number) {
    const pad = (n: number) => String(n).padStart(2, "0");
    setScheduledAt(`${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(hour)}:00`);
    setShowForm(true);
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

  const monthDays = useMemo(() => {
    const first = startOfMonth(month);
    const gridStart = new Date(first);
    gridStart.setDate(first.getDate() - first.getDay());
    return Array.from({ length: 42 }, (_, i) => {
      const d = new Date(gridStart);
      d.setDate(gridStart.getDate() + i);
      return d;
    });
  }, [month]);

  const weekDays = useMemo(() => Array.from({ length: 7 }, (_, i) => {
    const d = new Date(week);
    d.setDate(week.getDate() + i);
    return d;
  }), [week]);

  const postsByDay = useMemo(() => {
    const map = new Map<string, Post[]>();
    for (const p of posts) {
      const key = new Date(p.scheduledAt).toDateString();
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(p);
    }
    return map;
  }, [posts]);

  const postsByDayHour = useMemo(() => {
    const map = new Map<string, Post[]>();
    for (const p of posts) {
      const d = new Date(p.scheduledAt);
      const key = `${d.toDateString()}-${d.getHours()}`;
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(p);
    }
    return map;
  }, [posts]);

  const monthLabel = month.toLocaleDateString("en-US", { month: "long", year: "numeric" });
  const today = new Date();

  function goPrev() {
    if (view === "month") setMonth((m) => new Date(m.getFullYear(), m.getMonth() - 1, 1));
    else if (view === "week") setWeek((w) => { const n = new Date(w); n.setDate(n.getDate() - 7); return n; });
    else setDay((d) => { const n = new Date(d); n.setDate(n.getDate() - 1); return n; });
  }
  function goNext() {
    if (view === "month") setMonth((m) => new Date(m.getFullYear(), m.getMonth() + 1, 1));
    else if (view === "week") setWeek((w) => { const n = new Date(w); n.setDate(n.getDate() + 7); return n; });
    else setDay((d) => { const n = new Date(d); n.setDate(n.getDate() + 1); return n; });
  }
  function goToday() {
    setMonth(startOfMonth(new Date()));
    setWeek(startOfWeek(new Date()));
    setDay(new Date());
  }

  const rangeLabel =
    view === "month"
      ? monthLabel
      : view === "week"
      ? `${weekDays[0].toLocaleDateString("en-US", { month: "short", day: "numeric" })} – ${weekDays[6].toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}`
      : day.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" });

  const hourGridDays = view === "day" ? [day] : weekDays;

  return (
    <div className="flex gap-8 items-start">
      {/* Left rail — mirrors the "channels + create" panel pattern, adapted to our data (ready videos) */}
      <aside className="w-64 shrink-0 space-y-5 sticky top-6">
        <div>
          <h1 className="text-xl font-semibold mb-1">Schedule</h1>
          <p className="text-xs text-neutral-500">Plan and review what goes out, on your own calendar.</p>
        </div>

        <button
          onClick={() => setShowForm((s) => !s)}
          disabled={videos.length === 0}
          className="w-full flex items-center justify-center gap-1.5 rounded-full bg-blue-600 text-white px-4 py-2.5 text-sm font-medium hover:bg-blue-500 transition disabled:opacity-50 shadow-[0_0_24px_-8px_rgba(59,130,246,0.6)]"
        >
          {showForm ? <X size={16} /> : <Plus size={16} />}
          {showForm ? "Close" : "New post"}
        </button>

        {showForm && videos.length > 0 && (
          <form onSubmit={onSubmit} className="space-y-3 rounded-xl border border-neutral-800 p-4 bg-neutral-950">
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
                className="flex items-center gap-1 text-xs text-blue-400 hover:underline disabled:opacity-50"
              >
                <Sparkles size={12} />
                {suggesting ? "Thinking..." : "Suggest a caption + hashtags"}
              </button>
            </div>

            <DateTimePicker value={scheduledAt} onChange={setScheduledAt} placeholder="Pick a date" />

            {error && <p className="text-sm text-red-400 whitespace-pre-wrap">{error}</p>}

            <button
              type="submit"
              disabled={submitting}
              className="w-full rounded-full bg-blue-600 text-white px-5 py-2 text-sm font-medium hover:bg-blue-500 transition disabled:opacity-50"
            >
              {submitting ? "Scheduling..." : "Schedule post"}
            </button>
          </form>
        )}

        <div>
          <p className="text-xs uppercase tracking-wide text-neutral-600 mb-2">Ready to post ({videos.length})</p>
          {videos.length === 0 ? (
            <p className="text-xs text-neutral-600">Generate a video first before scheduling it.</p>
          ) : (
            <ul className="space-y-1.5">
              {videos.slice(0, 6).map((v) => (
                <li key={v.id} className="flex items-center gap-2 rounded-lg border border-neutral-900 px-2.5 py-2 text-xs text-neutral-400">
                  <VideoIcon size={13} className="text-neutral-600 shrink-0" />
                  <span className="truncate">{v.productName}</span>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div>
          <p className="text-xs uppercase tracking-wide text-neutral-600 mb-2">Platforms</p>
          <div className="space-y-1.5">
            {(["tiktok", "instagram", "youtube"] as const).map((p) => (
              <span key={p} className="flex items-center gap-2 text-xs text-neutral-400 capitalize">
                <span className={`w-2 h-2 rounded-full ${PLATFORM_COLOR[p]}`} />
                {p}
              </span>
            ))}
          </div>
        </div>
      </aside>

      {/* Main calendar */}
      <main className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1 rounded-lg border border-neutral-800 px-1 py-1">
              <button onClick={goPrev} className="rounded-md p-1.5 hover:bg-neutral-900 transition">
                <ChevronLeft size={16} />
              </button>
              <button onClick={goToday} className="text-xs text-neutral-400 hover:text-neutral-200 px-2">
                Today
              </button>
              <button onClick={goNext} className="rounded-md p-1.5 hover:bg-neutral-900 transition">
                <ChevronRight size={16} />
              </button>
            </div>
            <p className="text-sm font-medium text-neutral-200">{rangeLabel}</p>
          </div>

          <div className="flex rounded-lg bg-neutral-900 border border-neutral-800 p-1 text-xs">
            {(["day", "week", "month"] as const).map((v) => (
              <button
                key={v}
                onClick={() => setView(v)}
                className={`px-3.5 py-1.5 rounded-md capitalize transition ${
                  view === v ? "bg-white text-neutral-950 font-medium" : "text-neutral-500 hover:text-neutral-300"
                }`}
              >
                {v}
              </button>
            ))}
          </div>
        </div>

        {view === "month" ? (
          <div className="rounded-xl border border-neutral-800 overflow-hidden mb-10">
            <div className="grid grid-cols-7 text-center text-xs text-neutral-500 border-b border-neutral-800">
              {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
                <div key={d} className="py-2">
                  {d}
                </div>
              ))}
            </div>
            <div className="grid grid-cols-7">
              {monthDays.map((d) => {
                const dayPosts = postsByDay.get(d.toDateString()) ?? [];
                const inMonth = d.getMonth() === month.getMonth();
                const isToday = sameDay(d, today);
                return (
                  <div
                    key={d.toISOString()}
                    onClick={() => openFormAt(d, 12)}
                    style={inMonth ? CELL_TEXTURE : undefined}
                    className={`min-h-[6rem] border-b border-r border-neutral-900 p-1.5 cursor-pointer transition hover:bg-neutral-900/40 ${
                      !inMonth ? "opacity-40" : ""
                    }`}
                  >
                    <p className={`text-xs mb-1 inline-flex items-center gap-1 ${isToday ? "text-fuchsia-400 font-medium" : "text-neutral-500"}`}>
                      {isToday && <span className="w-1.5 h-1.5 rounded-full bg-fuchsia-500" />}
                      {d.getDate()}
                    </p>
                    <div className="space-y-1">
                      {dayPosts.slice(0, 3).map((p) => (
                        <div
                          key={p.id}
                          className={`flex items-center gap-1 rounded px-1 py-0.5 text-[10px] text-white truncate ${
                            PLATFORM_COLOR[p.platform] ?? "bg-neutral-600"
                          }`}
                        >
                          <span className="truncate">{p.productName}</span>
                        </div>
                      ))}
                      {dayPosts.length > 3 && <p className="text-[10px] text-neutral-600">+{dayPosts.length - 3} more</p>}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="rounded-xl border border-neutral-800 overflow-hidden mb-10">
            <div
              className="grid border-b border-neutral-800"
              style={{ gridTemplateColumns: `3.5rem repeat(${hourGridDays.length}, 1fr)` }}
            >
              <div />
              {hourGridDays.map((d) => (
                <div
                  key={d.toISOString()}
                  className={`text-center py-2.5 border-l border-neutral-800 ${sameDay(d, today) ? "bg-fuchsia-500/10" : ""}`}
                >
                  <p className="text-[10px] text-neutral-500">{d.toLocaleDateString("en-US", { weekday: "short" })}</p>
                  <p className={`text-sm inline-flex items-center gap-1 ${sameDay(d, today) ? "text-fuchsia-400 font-medium" : "text-neutral-300"}`}>
                    {sameDay(d, today) && <span className="w-1.5 h-1.5 rounded-full bg-fuchsia-500" />}
                    {d.getDate()}
                  </p>
                </div>
              ))}
            </div>
            <div className="max-h-[34rem] overflow-y-auto">
              {HOURS.map((h) => (
                <div
                  key={h}
                  className="grid border-b border-neutral-900"
                  style={{ gridTemplateColumns: `3.5rem repeat(${hourGridDays.length}, 1fr)` }}
                >
                  <div className="text-[10px] text-neutral-600 text-right pr-2 py-2">{formatHour(h)}</div>
                  {hourGridDays.map((d) => {
                    const cellPosts = postsByDayHour.get(`${d.toDateString()}-${h}`) ?? [];
                    return (
                      <div
                        key={d.toISOString()}
                        onClick={() => openFormAt(d, h)}
                        style={CELL_TEXTURE}
                        className="border-l border-neutral-900 min-h-[2.25rem] p-0.5 cursor-pointer hover:bg-neutral-900/60 transition"
                      >
                        {cellPosts.map((p) => (
                          <div
                            key={p.id}
                            className={`flex items-center gap-1 rounded px-1 py-0.5 mb-0.5 text-[10px] text-white truncate ${
                              PLATFORM_COLOR[p.platform] ?? "bg-neutral-600"
                            }`}
                          >
                            <span className="truncate">{p.productName}</span>
                          </div>
                        ))}
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        )}

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
                    <div className="w-56">
                      <DateTimePicker value={editValue} onChange={setEditValue} />
                    </div>
                    <button
                      onClick={() => saveEdit(p.id)}
                      disabled={busyId === p.id}
                      className="text-xs rounded-full bg-blue-600 text-white px-3 py-1 hover:bg-blue-500 transition disabled:opacity-50"
                    >
                      Save
                    </button>
                    <button onClick={() => setEditingId(null)} className="text-xs text-neutral-500 hover:text-neutral-300 transition">
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
      </main>
    </div>
  );
}
