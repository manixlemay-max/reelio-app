"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    const res = await fetch("/api/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    });
    setSubmitting(false);
    if (res.ok) {
      router.push("/dashboard");
      router.refresh();
    } else {
      const data = await res.json();
      setError(data.error ?? "Something went wrong.");
    }
  }

  return (
    <main className="flex-1 flex items-center justify-center px-6">
      <form onSubmit={onSubmit} className="w-full max-w-sm space-y-4">
        <h1 className="text-2xl font-semibold text-center mb-2">Reelio dashboard</h1>
        <p className="text-sm text-neutral-400 text-center mb-6">Enter the dashboard password to continue.</p>
        <input
          type="password"
          required
          autoFocus
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full rounded-lg bg-neutral-900 border border-neutral-800 px-3 py-2"
          placeholder="Password"
        />
        {error && <p className="text-sm text-red-400">{error}</p>}
        <button
          type="submit"
          disabled={submitting}
          className="w-full rounded-full bg-emerald-500 text-neutral-950 px-5 py-2 text-sm font-medium hover:bg-emerald-400 transition disabled:opacity-50"
        >
          {submitting ? "Checking..." : "Enter"}
        </button>
      </form>
    </main>
  );
}
