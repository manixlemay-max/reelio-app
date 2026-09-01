"use client";

import { useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import AvatarPicker from "@/components/AvatarPicker";

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
  const [avatarChangesAllowed, setAvatarChangesAllowed] = useState(3);
  const [tierName, setTierName] = useState<string | null>(null);
  const [reportToken, setReportToken] = useState<string | null>(null);
  const [connectedPlatforms, setConnectedPlatforms] = useState<string[]>([]);

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
      const data = await res.json();
      setReportToken(data.reportToken ?? null);
      setSubmitted(true);
      fetch(`/api/subscription-tier?email=${encodeURIComponent(form.email)}`)
        .then((r) => r.json())
        .then((tierData) => {
          setNetworksAllowed(tierData.networksAllowed ?? 3);
          setAvatarChangesAllowed(tierData.avatarChangesAllowed ?? 3);
          setTierName(tierData.tierName ?? null);
        })
        .catch(() => {});
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
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
      // Open in a separate tab instead of navigating away — the client stays
      // on our page the whole time and just confirms once they're done, so
      // they never feel like they "left" Reelio.
      window.open(data.url, "_blank", "noopener,noreferrer");
    } catch (err) {
      setConnectError((err as Error).message);
      setConnecting(null);
    }
  }

  function confirmConnected(platform: string) {
    setConnecting(null);
    setConnectedPlatforms((prev) => (prev.includes(platform) ? prev : [...prev, platform]));
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
              <span className="shrink-0 w-7 h-7 rounded-full bg-blue-600 text-white text-sm font-medium flex items-center justify-center">
                {i + 1}
              </span>
              <div>
                <p className="font-medium text-sm mb-0.5">{step.title}</p>
                <p className="text-sm text-neutral-500">{step.body}</p>
              </div>
            </li>
          ))}
        </ol>

        {reportToken && (
          <div className="mt-10 pt-8 border-t border-neutral-800">
            <h2 className="font-medium text-sm mb-1">Choose your video presenter</h2>
            <p className="text-xs text-neutral-500 mb-4">
              Pick the AI avatar that will present your products — it'll stay consistent across
              your videos. You can also do this later from your report link.
            </p>
            <AvatarPicker token={reportToken} changesUsed={0} changesAllowed={avatarChangesAllowed} />
          </div>
        )}

        <div className="mt-10 pt-8 border-t border-neutral-800">
          <h2 className="font-medium text-sm mb-1">Connect your accounts</h2>
          <p className="text-xs text-neutral-500 mb-4">
            {tierName ? `Your ${tierName} plan includes` : "You get"} up to {networksAllowed}{" "}
            connected network{networksAllowed > 1 ? "s" : ""}. Connect one now and do the rest
            later if you want — there's no rush. Connecting opens a new tab where you authorize
            directly on the platform's own screen; we never see or store your password.
          </p>
          <div className="space-y-2">
            {(["tiktok", "instagram", "youtube"] as const).map((platform) => {
              const isConnected = connectedPlatforms.includes(platform);
              const isConnecting = connecting === platform;
              const atLimit = !isConnected && connectedPlatforms.length >= networksAllowed;

              if (isConnected) {
                return (
                  <div
                    key={platform}
                    className="flex items-center gap-2 rounded-full border border-green-800 bg-green-950/40 px-4 py-2 text-sm text-green-300 capitalize w-fit"
                  >
                    ✓ {platform} connected
                  </div>
                );
              }

              return (
                <div key={platform} className="flex items-center gap-2 flex-wrap">
                  <button
                    onClick={() => connect(platform)}
                    disabled={connecting !== null || atLimit}
                    className="rounded-full border border-neutral-800 px-4 py-2 text-sm font-medium capitalize hover:border-neutral-600 transition disabled:opacity-40"
                  >
                    {isConnecting ? "Opening..." : `Connect ${platform}`}
                  </button>
                  {isConnecting && (
                    <button
                      onClick={() => confirmConnected(platform)}
                      className="rounded-full bg-blue-600 text-white px-4 py-2 text-xs font-medium hover:bg-blue-500 transition"
                    >
                      I&apos;m done — mark as connected
                    </button>
                  )}
                  {atLimit && (
                    <span className="text-xs text-neutral-600">
                      Plan limit reached ({networksAllowed})
                    </span>
                  )}
                </div>
              );
            })}
          </div>
          {connecting && (
            <p className="text-xs text-neutral-500 mt-3">
              A new tab opened for {connecting} — authorize there, then come back here and click
              &quot;I&apos;m done&quot;.
            </p>
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
          className="w-full rounded-lg bg-blue-600 text-white font-medium py-2.5 hover:bg-blue-500 transition disabled:opacity-50"
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
