"use client";

import { useState } from "react";

export default function NeedHelp({ token }: { token: string }) {
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  async function send() {
    if (!message.trim()) {
      setError("Write your message first.");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/support", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, message }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Something went wrong. Please try again.");
      }
      setDone(true);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSubmitting(false);
    }
  }

  if (done) {
    return (
      <div className="rounded-lg border border-neutral-800 bg-neutral-900/50 px-4 py-3 text-sm text-neutral-400">
        Got it — we'll get back to you shortly.
      </div>
    );
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="text-xs text-neutral-500 hover:text-neutral-300 underline transition"
      >
        Need help?
      </button>
    );
  }

  return (
    <div className="rounded-lg border border-neutral-800 p-4">
      <p className="text-sm font-medium mb-1">How can we help?</p>
      <p className="text-xs text-neutral-500 mb-3">
        Send us a message and we'll get back to you.
      </p>
      <textarea
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        placeholder="What's going on?"
        rows={3}
        autoFocus
        className="w-full rounded-lg border border-neutral-800 bg-neutral-900 px-3 py-2 text-sm text-neutral-100 placeholder-neutral-500 mb-3"
      />
      {error && <p className="text-xs text-red-400 mb-3">{error}</p>}
      <div className="flex items-center gap-3">
        <button
          onClick={send}
          disabled={submitting}
          className="rounded-full bg-blue-600 text-white px-4 py-2 text-xs font-medium hover:bg-blue-500 transition disabled:opacity-50"
        >
          {submitting ? "Sending..." : "Send message"}
        </button>
        <button onClick={() => setOpen(false)} className="text-xs text-neutral-500 hover:text-neutral-300 transition">
          Cancel
        </button>
      </div>
    </div>
  );
}
