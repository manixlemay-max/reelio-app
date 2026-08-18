"use client";

import { useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";

function WelcomeForm() {
  const params = useSearchParams();
  const checkoutSuccess = params.get("checkout") === "success";

  const [form, setForm] = useState({
    name: "",
    email: "",
    businessName: "",
    productDescription: "",
    socialHandles: "",
    notes: "",
  });
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  function update(field: keyof typeof form, value: string) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Something went wrong. Please try again.");
      }
      setSubmitted(true);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  if (submitted) {
    return (
      <div className="max-w-lg mx-auto text-center py-20 px-6">
        <h1 className="text-2xl font-semibold mb-4">Thank you!</h1>
        <p className="text-neutral-500">
          We've got your info. Our team will reach out shortly to get your first videos
          in motion.
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto py-16 px-6">
      {checkoutSuccess && (
        <div className="mb-8 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
          Payment received — welcome to Reelio! Tell us a bit about your business so we
          can get started.
        </div>
      )}
      <h1 className="text-2xl font-semibold mb-2">Tell us about your business</h1>
      <p className="text-neutral-500 mb-8 text-sm">
        We'll use this to create and post your videos. Takes about a minute.
      </p>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label className="block text-sm mb-1 text-neutral-600">Your name</label>
          <input
            required
            value={form.name}
            onChange={(e) => update("name", e.target.value)}
            className="w-full rounded-lg border border-neutral-200 bg-neutral-50 px-3 py-2 text-neutral-900 placeholder-neutral-400"
          />
        </div>
        <div>
          <label className="block text-sm mb-1 text-neutral-600">Email</label>
          <input
            required
            type="email"
            value={form.email}
            onChange={(e) => update("email", e.target.value)}
            className="w-full rounded-lg border border-neutral-200 bg-neutral-50 px-3 py-2 text-neutral-900 placeholder-neutral-400"
          />
        </div>
        <div>
          <label className="block text-sm mb-1 text-neutral-600">Business / brand name</label>
          <input
            required
            value={form.businessName}
            onChange={(e) => update("businessName", e.target.value)}
            className="w-full rounded-lg border border-neutral-200 bg-neutral-50 px-3 py-2 text-neutral-900 placeholder-neutral-400"
          />
        </div>
        <div>
          <label className="block text-sm mb-1 text-neutral-600">
            What product(s) do you want videos for?
          </label>
          <textarea
            required
            rows={4}
            value={form.productDescription}
            onChange={(e) => update("productDescription", e.target.value)}
            placeholder="Describe your product(s), target audience, and links to product pages if you have them."
            className="w-full rounded-lg border border-neutral-200 bg-neutral-50 px-3 py-2 text-neutral-900 placeholder-neutral-400"
          />
        </div>
        <div>
          <label className="block text-sm mb-1 text-neutral-600">
            Social media handles (TikTok, Instagram, YouTube)
          </label>
          <input
            value={form.socialHandles}
            onChange={(e) => update("socialHandles", e.target.value)}
            placeholder="@yourbrand"
            className="w-full rounded-lg border border-neutral-200 bg-neutral-50 px-3 py-2 text-neutral-900 placeholder-neutral-400"
          />
        </div>
        <div>
          <label className="block text-sm mb-1 text-neutral-600">Anything else we should know?</label>
          <textarea
            rows={3}
            value={form.notes}
            onChange={(e) => update("notes", e.target.value)}
            className="w-full rounded-lg border border-neutral-200 bg-neutral-50 px-3 py-2 text-neutral-900 placeholder-neutral-400"
          />
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-lg bg-indigo-600 text-white font-medium py-2.5 hover:bg-indigo-500 transition disabled:opacity-50"
        >
          {loading ? "Sending..." : "Submit"}
        </button>
      </form>
    </div>
  );
}

export default function WelcomePage() {
  return (
    <Suspense>
      <WelcomeForm />
    </Suspense>
  );
}
