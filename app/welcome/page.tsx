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
  const [connecting, setConnecting] = useState<string | null>(null);
  const [connectError, setConnectError] = useState<string | null>(null);
  const [networksAllowed, setNetworksAllowed] = useState(3);
  const [tierName, setTierName] = useState<string | null>(null);
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>([]);

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
      fetch(`/api/subscription-tier?email=${encodeURIComponent(form.email)}`)
        .then((r) => r.json())
        .then((data) => {
          setNetworksAllowed(data.networksAllowed ?? 3);
          setTierName(data.tierName ?? null);
        })
        .catch(() => {});
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  function toggleSelect(platform: string) {
    setSelectedPlatforms((prev) => {
      if (prev.includes(platform)) return prev.filter((p) => p !== platform);
      if (prev.length >= networksAllowed) return prev;
      return [...prev, platform];
    });
  }

  async function connect(platform: "tiktok" | "instagram" | "youtube") {
    setConnecting(platform);
    setConnectError(null);
    try {
      const res = await fetch(`/api/postiz/connect?platform=${platform}`);
      const data = await res.json();
      if (!res.ok || !data.url) {
        throw new Error(data.error || "Could not start connection. Try again shortly.");
      }
      window.location.href = data.url;
    } catch (err) {
      setConnectError((err as Error).message);
      setConnecting(null);
    }
  }

  if (submitted) {
    return (
      <div className="max-w-lg mx-auto py-20 px-6">
        <div className="text-center mb-10">
          <h1 className="text-2xl font-semibold mb-3">Thank you — you're all set!</h1>
          <p className="text-neutral-500">
            We've got your info and we're excited to work with you. Here's exactly what
            happens from here.
          </p>
        </div>

        <ol className="space-y-5">
          {[
            {
              title: "We create your first video",
              body: "Our team generates an AI UGC-style video for your product. This usually takes a few days.",
            },
            {
              title: "We post it for you",
              body: "Once it's ready, we schedule and publish it to your connected social accounts at the best time — no action needed from you.",
            },
            {
              title: "You get a private report link",
              body: "We'll send you a personal link where you can see your videos and their performance (views, likes, comments) any time — no login required.",
            },
            {
              title: "We keep going",
              body: "New videos go out automatically every month based on your plan. Questions any time? Just reply to our email.",
            },
          ].map((step, i) => (
            <li key={i} className="flex gap-4">
              <span className="shrink-0 w-7 h-7 rounded-full bg-indigo-600 text-white text-sm font-medium flex items-center justify-center">
                {i + 1}
              </span>
              <div>
                <p className="font-medium text-sm mb-0.5">{step.title}</p>
                <p className="text-sm text-neutral-500">{step.body}</p>
              </div>
            </li>
          ))}
        </ol>

        <div className="mt-10 pt-8 border-t border-neutral-800">
          <h2 className="font-medium text-sm mb-1">Connect your accounts</h2>
          <p className="text-xs text-neutral-500 mb-4">
            {tierName ? `Your ${tierName} plan includes` : "Select"} up to {networksAllowed}{" "}
            connected network{networksAllowed > 1 ? "s" : ""} — pick which one{networksAllowed > 1 ? "s" : ""} you
            want below. You'll authorize directly on each platform's own screen — we never see or
            store your password. You can also do this later; just reply to our email whenever
            you're ready.
          </p>
          <div className="flex flex-wrap gap-2 mb-4">
            {(["tiktok", "instagram", "youtube"] as const).map((platform) => {
              const selected = selectedPlatforms.includes(platform);
              const disabled = !selected && selectedPlatforms.length >= networksAllowed;
              return (
                <button
                  key={platform}
                  onClick={() => toggleSelect(platform)}
                  disabled={disabled}
                  className={`rounded-full border px-4 py-2 text-sm capitalize transition disabled:opacity-40 ${
                    selected ? "border-indigo-400 bg-indigo-600/10" : "border-neutral-800 hover:border-neutral-700"
                  }`}
                >
                  {platform}
                </button>
              );
            })}
          </div>
          {selectedPlatforms.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {selectedPlatforms.map((platform) => (
                <button
                  key={platform}
                  onClick={() => connect(platform as "tiktok" | "instagram" | "youtube")}
                  disabled={connecting !== null}
                  className="rounded-full bg-indigo-600 text-white px-4 py-2 text-sm font-medium capitalize hover:bg-indigo-500 transition disabled:opacity-50"
                >
                  {connecting === platform ? "Redirecting..." : `Connect ${platform}`}
                </button>
              ))}
            </div>
          )}
          {connectError && <p className="text-xs text-red-400 mt-3">{connectError}</p>}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto py-16 px-6">
      {checkoutSuccess && (
        <div className="mb-8 rounded-lg border border-green-800 bg-green-950/40 px-4 py-3 text-sm text-green-300">
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
          <label className="block text-sm mb-1 text-neutral-400">Your name</label>
          <input
            required
            value={form.name}
            onChange={(e) => update("name", e.target.value)}
            className="w-full rounded-lg border border-neutral-800 bg-neutral-900 px-3 py-2 text-neutral-100 placeholder-neutral-500"
          />
        </div>
        <div>
          <label className="block text-sm mb-1 text-neutral-400">Email</label>
          <input
            required
            type="email"
            value={form.email}
            onChange={(e) => update("email", e.target.value)}
            className="w-full rounded-lg border border-neutral-800 bg-neutral-900 px-3 py-2 text-neutral-100 placeholder-neutral-500"
          />
        </div>
        <div>
          <label className="block text-sm mb-1 text-neutral-400">Business / brand name</label>
          <input
            required
            value={form.businessName}
            onChange={(e) => update("businessName", e.target.value)}
            className="w-full rounded-lg border border-neutral-800 bg-neutral-900 px-3 py-2 text-neutral-100 placeholder-neutral-500"
          />
        </div>
        <div>
          <label className="block text-sm mb-1 text-neutral-400">
            What product(s) do you want videos for?
          </label>
          <textarea
            required
            rows={4}
            value={form.productDescription}
            onChange={(e) => update("productDescription", e.target.value)}
            placeholder="Describe your product(s), target audience, and links to product pages if you have them."
            className="w-full rounded-lg border border-neutral-800 bg-neutral-900 px-3 py-2 text-neutral-100 placeholder-neutral-500"
          />
        </div>
        <div>
          <label className="block text-sm mb-1 text-neutral-400">
            Social media handles (TikTok, Instagram, YouTube)
          </label>
          <input
            value={form.socialHandles}
            onChange={(e) => update("socialHandles", e.target.value)}
            placeholder="@yourbrand"
            className="w-full rounded-lg border border-neutral-800 bg-neutral-900 px-3 py-2 text-neutral-100 placeholder-neutral-500"
          />
        </div>
        <div>
          <label className="block text-sm mb-1 text-neutral-400">Anything else we should know?</label>
          <textarea
            rows={3}
            value={form.notes}
            onChange={(e) => update("notes", e.target.value)}
            className="w-full rounded-lg border border-neutral-800 bg-neutral-900 px-3 py-2 text-neutral-100 placeholder-neutral-500"
          />
        </div>

        {error && <p className="text-sm text-red-400">{error}</p>}

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
