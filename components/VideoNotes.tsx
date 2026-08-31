"use client";

import { useState } from "react";

type Props = {
  token: string;
  initialNotes: string | null;
  initialCaptionsEnabled: boolean;
};

export default function VideoNotes({ token, initialNotes, initialCaptionsEnabled }: Props) {
  const [notes, setNotes] = useState(initialNotes ?? "");
  const [captionsEnabled, setCaptionsEnabled] = useState(initialCaptionsEnabled);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function save() {
    setSaving(true);
    setError(null);
    setSaved(false);
    try {
      const res = await fetch("/api/leads/video-notes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, notes, captionsEnabled }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Could not save.");
      }
      setSaved(true);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="rounded-lg border border-neutral-800 p-4">
      <p className="text-sm font-medium mb-1">Anything you want us to mention in your videos?</p>
      <p className="text-xs text-neutral-500 mb-3">
        A promo code, a feature to highlight, your website — we'll work it into upcoming videos.
      </p>
      <textarea
        value={notes}
        onChange={(e) => {
          setNotes(e.target.value);
          setSaved(false);
        }}
        placeholder="e.g. Mention our 20% off code SUMMER20, and that it ships free."
        rows={3}
        className="w-full rounded-lg border border-neutral-800 bg-neutral-900 px-3 py-2 text-sm text-neutral-100 placeholder-neutral-500 mb-3"
      />

      <label className="flex items-center gap-2 mb-3 cursor-pointer select-none">
        <input
          type="checkbox"
          checked={captionsEnabled}
          onChange={(e) => {
            setCaptionsEnabled(e.target.checked);
            setSaved(false);
          }}
          className="rounded border-neutral-700 bg-neutral-900"
        />
        <span className="text-xs text-neutral-400">
          Include bold on-screen captions (recommended for TikTok/Reels-style videos)
        </span>
      </label>

      {error && <p className="text-xs text-red-400 mb-3">{error}</p>}
      <div className="flex items-center gap-3">
        <button
          onClick={save}
          disabled={saving}
          className="rounded-full bg-blue-600 text-white px-4 py-2 text-xs font-medium hover:bg-blue-500 transition disabled:opacity-50"
        >
          {saving ? "Saving..." : "Save"}
        </button>
        {saved && <span className="text-xs text-green-500">Saved</span>}
      </div>
    </div>
  );
}
