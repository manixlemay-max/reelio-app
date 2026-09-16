"use client";

import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

type Post = {
  id: string;
  platform: string;
  scheduledAt: string;
  status: string;
  productName: string;
};

type Props = {
  posts: Post[];
};

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

// A read-only, client-facing version of the agency's schedule calendar —
// same visual language, but no click-to-add: clients only ever watch their
// automated posting schedule here, they never create posts themselves.
export default function ClientCalendar({ posts }: Props) {
  const [month, setMonth] = useState(() => startOfMonth(new Date()));
  const today = new Date();

  const monthDays = useMemo(() => {
    const first = startOfMonth(month);
    const gridStart = new Date(first);
    gridStart.setDate(gridStart.getDate() - gridStart.getDay());
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
      const arr = map.get(key) ?? [];
      arr.push(p);
      map.set(key, arr);
    }
    return map;
  }, [posts]);

  if (posts.length === 0) {
    return (
      <p className="text-sm text-neutral-500">No posts scheduled yet — your calendar will fill in automatically.</p>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <p className="text-sm font-medium">
          {month.toLocaleDateString("en-US", { month: "long", year: "numeric" })}
        </p>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setMonth((m) => new Date(m.getFullYear(), m.getMonth() - 1, 1))}
            className="p-1 rounded hover:bg-neutral-900 text-neutral-400 hover:text-neutral-200 transition"
            aria-label="Previous month"
          >
            <ChevronLeft size={16} />
          </button>
          <button
            onClick={() => setMonth(startOfMonth(new Date()))}
            className="px-2 py-1 text-xs rounded hover:bg-neutral-900 text-neutral-400 hover:text-neutral-200 transition"
          >
            Today
          </button>
          <button
            onClick={() => setMonth((m) => new Date(m.getFullYear(), m.getMonth() + 1, 1))}
            className="p-1 rounded hover:bg-neutral-900 text-neutral-400 hover:text-neutral-200 transition"
            aria-label="Next month"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      </div>

      <div className="rounded-xl border border-neutral-800 overflow-hidden">
        <div className="grid grid-cols-7 text-center text-[10px] text-neutral-500 border-b border-neutral-800">
          {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
            <div key={d} className="py-1.5">
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
                className={`min-h-[4rem] border-b border-r border-neutral-900 p-1 ${!inMonth ? "opacity-40" : ""}`}
              >
                <p
                  className={`text-[10px] mb-0.5 inline-flex items-center gap-1 ${
                    isToday ? "text-fuchsia-400 font-medium" : "text-neutral-500"
                  }`}
                >
                  {isToday && <span className="w-1 h-1 rounded-full bg-fuchsia-500" />}
                  {d.getDate()}
                </p>
                <div className="space-y-0.5">
                  {dayPosts.slice(0, 2).map((p) => (
                    <div
                      key={p.id}
                      title={`${p.platform} · ${p.productName} · ${p.status}`}
                      className={`flex items-center gap-1 rounded px-1 py-0.5 text-[9px] text-white truncate ${
                        PLATFORM_COLOR[p.platform] ?? "bg-neutral-600"
                      } ${p.status === "failed" ? "opacity-50" : ""}`}
                    >
                      <span className="truncate">{p.productName}</span>
                    </div>
                  ))}
                  {dayPosts.length > 2 && <p className="text-[9px] text-neutral-600">+{dayPosts.length - 2} more</p>}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="flex items-center gap-3 mt-3">
        {Object.entries(PLATFORM_COLOR).map(([platform, color]) => (
          <div key={platform} className="flex items-center gap-1.5 text-[10px] text-neutral-500 capitalize">
            <span className={`w-2 h-2 rounded-full ${color}`} />
            {platform}
          </div>
        ))}
      </div>
    </div>
  );
}
