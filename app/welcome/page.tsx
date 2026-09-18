"use client";

import { useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import AvatarPicker from "@/components/AvatarPicker";
import ConnectAccounts from "@/components/ConnectAccounts";
import Logo from "@/components/Logo";

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
  const [productImage, setProductImage] = useState<{ url: string; assetId: string } | null>(null);
  const [imageUploading, setImageUploading] = useState(false);
  const [imageError, setImageError] = useState<string | null>(null);
  const [networksAllowed, setNetworksAllowed] = useState(3);
  const [avatarChangesAllowed, setAvatarChangesAllowed] = useState<number | null>(3);
  const [tierName, setTierName] = useState<string | null>(null);
  const [reportToken, setReportToken] = useState<string | null>(null);

  function update(field: keyof typeof form, value: string) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function handleImageSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageError(null);
    setImageUploading(true);
    try {
      const body = new FormData();
      body.append("file", file);
      const res = await fetch("/api/products/upload-image", { method: "POST", body });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not upload the image.");
      setProductImage({ url: data.url, assetId: data.assetId });
    } catch (err) {
      setImageError((err as Error).message);
    } finally {
      setImageUploading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          productImageUrl: productImage?.url,
          productImageAssetId: productImage?.assetId,
        }),
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
          // The API always includes this field (null legitimately means
          // "unlimited" for a found tier) — don't `?? 3` over a real null.
          setAvatarChangesAllowed(
            "avatarChangesAllowed" in tierData ? tierData.avatarChangesAllowed : 3
          );
          setTierName(tierData.tierName ?? null);
        })
        .catch(() => {});
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  if (submitted) {
    return (
      <div className="max-w-lg mx-auto py-20 px-6">
        <div className="mb-10 flex justify-center">
          <Logo href="/" />
        </div>
        <div className="text-center mb-10">
          <h1 className="text-2xl font-semibold mb-3">Thank you — you're all set!</h1>
          <p className="text-neutral-500">
            We've got your info and we're excited to work with you. Here's exactly what
            happens from here.
          </p>
        </div>

        {reportToken && (
          <div className="mb-10 rounded-lg border border-blue-800 bg-blue-950/40 px-4 py-3 text-sm text-blue-200">
            <p className="mb-2">
              Bookmark your private report link now — you&apos;ll use it to see your videos and
              manage your account any time:
            </p>
            <a
              href={`/report/${reportToken}`}
              className="font-medium underline break-all hover:text-blue-100"
            >
              {typeof window !== "undefined" ? window.location.origin : ""}/report/{reportToken}
            </a>
          </div>
        )}

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
              body: "Your link is above this list — bookmark it to see your videos and their performance (views, likes, comments) any time, no login required.",
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
            <AvatarPicker token={reportToken} initialAvatarIds={[]} maxAvatars={avatarChangesAllowed} />
          </div>
        )}

        {reportToken && (
          <div className="mt-10 pt-8 border-t border-neutral-800">
            <p className="text-xs text-neutral-500 mb-4">
              {tierName ? `Your ${tierName} plan includes` : "You get"} up to {networksAllowed}{" "}
              connected network{networksAllowed > 1 ? "s" : ""}. Connect one now and do the rest
              later from your report link if you want — there's no rush.
            </p>
            <ConnectAccounts
              token={reportToken}
              networksAllowed={networksAllowed}
              initialConnected={{ tiktok: false, instagram: false, youtube: false }}
            />

            <div className="mt-5 rounded-lg border border-green-800 bg-green-950/40 px-4 py-3 text-sm text-green-300">
              <p className="mb-3">
                That&apos;s everything on our end. Head to your dashboard to connect more
                accounts, watch your videos come in, or change your presenter any time.
              </p>
              <a
                href={`/report/${reportToken}`}
                className="inline-block rounded-full bg-green-500 text-neutral-950 px-4 py-2 text-sm font-medium hover:bg-green-400 transition"
              >
                Go to your dashboard →
              </a>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto py-16 px-6">
      <div className="mb-8 flex justify-center">
        <Logo href="/" />
      </div>
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
          <label className="block text-sm mb-1 text-neutral-400">
            Product photo <span className="text-neutral-600">(optional, but your video looks much better with one)</span>
          </label>
          {productImage ? (
            <div className="flex items-center gap-3">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={productImage.url} alt="Product" className="w-16 h-16 rounded-lg object-cover border border-neutral-800" />
              <button
                type="button"
                onClick={() => setProductImage(null)}
                className="text-xs text-neutral-500 hover:text-neutral-300 transition"
              >
                Remove
              </button>
            </div>
          ) : (
            <input
              type="file"
              accept="image/png,image/jpeg,image/webp"
              onChange={handleImageSelect}
              disabled={imageUploading}
              className="w-full text-sm text-neutral-400 file:mr-3 file:rounded-lg file:border-0 file:bg-neutral-800 file:px-3 file:py-2 file:text-neutral-200 file:text-sm hover:file:bg-neutral-700 file:cursor-pointer disabled:opacity-50"
            />
          )}
          {imageUploading && <p className="text-xs text-neutral-500 mt-1">Uploading...</p>}
          {imageError && <p className="text-xs text-red-400 mt-1">{imageError}</p>}
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
