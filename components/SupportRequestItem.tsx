"use client";

import { useState } from "react";

type Props = {
  id: string;
  message: string;
  createdAt: string;
  resolved: boolean;
  response: string | null;
  respondedAt: string | null;
};

export default function SupportRequestItem({ id, message, createdAt, resolved, response, respondedAt }: Props) {
  const [open, setOpen] = useState(false);
  const [reply, setReply] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sentResponse, setSentResponse] = useState(response);
  const [sentAt, setSentAt] = useState(respondedAt);

  async function send() {
    if (!reply.trim()) {
      setError("Write a reply first.");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch(`/api/support/${id}/respond`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ response: reply }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Could not send reply.");
      }
      setSentResponse(reply);
      setSentAt(new Date().toISOString());
      setOpen(false);
      setReply("");
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <li className="text-xs rounded-lg bg-neutral-900/60 px-2.5 py-2">
      <span className="text-neutral-600">{new Date(createdAt).toLocaleString()}</span>
      {(resolved || sentResponse) && <span className="text-green-500 ml-2">Resolved</span>}
      <p className="mt-0.5 text-neutral-400">{message}</p>

      {sentResponse ? (
        <div className="mt-2 pt-2 border-t border-neutral-800">
          <p className="text-neutral-600">
            Your reply {sentAt ? `· ${new Date(sentAt).toLocaleString()}` : ""}
          </p>
          <p className="mt-0.5 text-neutral-300">{sentResponse}</p>
        </div>
      ) : open ? (
        <div className="mt-2 pt-2 border-t border-neutral-800">
          <textarea
            value={reply}
            onChange={(e) => setReply(e.target.value)}
            placeholder="Write your reply..."
            rows={2}
            autoFocus
            className="w-full rounded-lg border border-neutral-800 bg-neutral-950 px-2 py-1.5 text-xs text-neutral-100 placeholder-neutral-600 mb-2"
          />
          {error && <p className="text-red-400 mb-2">{error}</p>}
          <div className="flex items-center gap-2">
            <button
              onClick={send}
              disabled={submitting}
              className="rounded-full bg-blue-600 text-white px-3 py-1 font-medium hover:bg-blue-500 transition disabled:opacity-50"
            >
              {submitting ? "Sending..." : "Send reply"}
            </button>
            <button onClick={() => setOpen(false)} className="text-neutral-500 hover:text-neutral-300 transition">
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <button onClick={() => setOpen(true)} className="mt-1.5 text-blue-400 hover:underline">
          Reply
        </button>
      )}
    </li>
  );
}
