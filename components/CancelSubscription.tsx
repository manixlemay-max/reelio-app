"use client";

import { useState } from "react";

const REASONS = [
  { value: "too_expensive", label: "It's too expensive" },
  { value: "not_using_it", label: "I'm not using it enough" },
  { value: "missing_features", label: "It's missing something I need" },
  { value: "bad_quality", label: "The video quality wasn't right for me" },
  { value: "switched_provider", label: "I switched to something else" },
  { value: "other", label: "Other" },
];

export default function CancelSubscription({ token }: { token: string }) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [feedback, setFeedback] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  async function confirmCancel() {
    if (!reason) {
      setError("Please pick a reason first.");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/subscription/cancel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, reason, feedback }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Something went wrong. Please try again or email us.");
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
        Your subscription is set to cancel at the end of your current billing period — you'll keep access
        until then, and won't be charged again. Thanks for the feedback, and for giving Reelio a try.
      </div>
    );
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="text-xs text-neutral-500 hover:text-neutral-300 underline transition"
      >
        Cancel my subscription
      </button>
    );
  }

  return (
    <div className="rounded-lg border border-neutral-800 p-4">
      <p className="text-sm font-medium mb-1">Sorry to see you go — mind telling us why?</p>
      <p className="text-xs text-neutral-500 mb-3">
        This helps us improve. Your access continues until the end of your current billing period either way.
      </p>
      <div className="space-y-2 mb-3">
        {REASONS.map((r) => (
          <label key={r.value} className="flex items-center gap-2 text-sm text-neutral-300 cursor-pointer">
            <input
              type="radio"
              name="cancel-reason"
              value={r.value}
              checked={reason === r.value}
              onChange={() => setReason(r.value)}
            />
            {r.label}
          </label>
        ))}
      </div>
      <textarea
        value={feedback}
        onChange={(e) => setFeedback(e.target.value)}
        placeholder="Anything else you'd like to add? (optional)"
        rows={2}
        className="w-full rounded-lg border border-neutral-800 bg-neutral-900 px-3 py-2 text-sm text-neutral-100 placeholder-neutral-500 mb-3"
      />
      {error && <p className="text-xs text-red-400 mb-3">{error}</p>}
      <div className="flex items-center gap-3">
        <button
          onClick={confirmCancel}
          disabled={submitting}
          className="rounded-full bg-red-600/90 text-white px-4 py-2 text-xs font-medium hover:bg-red-600 transition disabled:opacity-50"
        >
          {submitting ? "Canceling..." : "Confirm cancellation"}
        </button>
        <button
          onClick={() => setOpen(false)}
          className="text-xs text-neutral-500 hover:text-neutral-300 transition"
        >
          Never mind
        </button>
      </div>
    </div>
  );
}
