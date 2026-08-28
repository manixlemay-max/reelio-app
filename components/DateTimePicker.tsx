"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, Clock } from "lucide-react";

// value/onChange use the same "YYYY-MM-DDTHH:mm" shape as a native
// datetime-local input, so this drops in as a replacement everywhere.
type Props = {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
};

function pad(n: number) {
  return String(n).padStart(2, "0");
}
function toValue(d: Date) {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}
function parseValue(v: string): Date {
  const d = v ? new Date(v) : new Date();
  return isNaN(d.getTime()) ? new Date() : d;
}
function startOfMonth(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}

export default function DateTimePicker({ value, onChange, placeholder }: Props) {
  const [open, setOpen] = useState(false);
  const selected = value ? parseValue(value) : null;
  const [viewMonth, setViewMonth] = useState(() => startOfMonth(selected ?? new Date()));
  const [time, setTime] = useState(() => (selected ? `${pad(selected.getHours())}:${pad(selected.getMinutes())}` : "12:00"));
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  const days = (() => {
    const first = startOfMonth(viewMonth);
    const gridStart = new Date(first);
    gridStart.setDate(first.getDate() - first.getDay());
    return Array.from({ length: 42 }, (_, i) => {
      const d = new Date(gridStart);
      d.setDate(gridStart.getDate() + i);
      return d;
    });
  })();

  function pickDay(d: Date) {
    const [h, m] = time.split(":").map(Number);
    const combined = new Date(d.getFullYear(), d.getMonth(), d.getDate(), h || 0, m || 0);
    onChange(toValue(combined));
  }

  function applyTime(newTime: string) {
    setTime(newTime);
    const base = selected ?? new Date();
    const [h, m] = newTime.split(":").map(Number);
    const combined = new Date(base.getFullYear(), base.getMonth(), base.getDate(), h || 0, m || 0);
    onChange(toValue(combined));
  }

  const today = new Date();

  return (
    <div className="relative" ref={rootRef}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between rounded-lg bg-neutral-900 border border-neutral-800 text-left px-3 py-2 text-sm text-neutral-100 hover:border-neutral-700 transition"
      >
        <span className={selected ? "text-neutral-100" : "text-neutral-500"}>
          {selected
            ? `${selected.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })} · ${selected.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}`
            : placeholder ?? "Pick a date"}
        </span>
        <Clock size={14} className="text-neutral-600" />
      </button>

      {open && (
        <div className="absolute z-20 mt-2 w-72 rounded-xl border border-neutral-800 bg-neutral-950 shadow-xl p-3">
          <div className="flex items-center justify-between mb-2">
            <button
              type="button"
              onClick={() => setViewMonth((m) => new Date(m.getFullYear(), m.getMonth() - 1, 1))}
              className="rounded-md p-1 hover:bg-neutral-900 transition"
            >
              <ChevronLeft size={14} />
            </button>
            <p className="text-sm font-medium text-neutral-200">
              {viewMonth.toLocaleDateString("en-US", { month: "long", year: "numeric" })}
            </p>
            <button
              type="button"
              onClick={() => setViewMonth((m) => new Date(m.getFullYear(), m.getMonth() + 1, 1))}
              className="rounded-md p-1 hover:bg-neutral-900 transition"
            >
              <ChevronRight size={14} />
            </button>
          </div>

          <div className="grid grid-cols-7 text-center text-[10px] text-neutral-600 mb-1">
            {["S", "M", "T", "W", "T", "F", "S"].map((d, i) => (
              <div key={i}>{d}</div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-0.5 mb-3">
            {days.map((d) => {
              const inMonth = d.getMonth() === viewMonth.getMonth();
              const isSelected = selected && d.toDateString() === selected.toDateString();
              const isToday = d.toDateString() === today.toDateString();
              return (
                <button
                  type="button"
                  key={d.toISOString()}
                  onClick={() => pickDay(d)}
                  className={`aspect-square rounded-md text-xs transition ${
                    isSelected
                      ? "bg-blue-600 text-white font-medium"
                      : isToday
                      ? "text-fuchsia-400 hover:bg-neutral-900"
                      : inMonth
                      ? "text-neutral-300 hover:bg-neutral-900"
                      : "text-neutral-700 hover:bg-neutral-900"
                  }`}
                >
                  {d.getDate()}
                </button>
              );
            })}
          </div>

          <div className="flex items-center gap-2 pt-2 border-t border-neutral-900">
            <Clock size={13} className="text-neutral-600 shrink-0" />
            <input
              type="time"
              value={time}
              onChange={(e) => applyTime(e.target.value)}
              className="flex-1 rounded-lg bg-neutral-900 border border-neutral-800 text-neutral-100 px-2 py-1.5 text-sm"
            />
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="rounded-full bg-blue-600 text-white px-3 py-1.5 text-xs font-medium hover:bg-blue-500 transition"
            >
              Done
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
