"use client";

import { useEffect, useRef, useState } from "react";

type Product = { id: string; name: string };
type Video = {
  id: string;
  productId: string;
  productName: string;
  videoUrl: string | null;
  status: string;
  provider: string;
};
type Avatar = {
  id: string;
  name: string;
  previewImageUrl: string | null;
  previewVideoUrl: string | null;
  defaultVoiceId: string | null;
};

export default function VideosPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [videos, setVideos] = useState<Video[]>([]);
  const [selectedProduct, setSelectedProduct] = useState("");
  const [avatars, setAvatars] = useState<Avatar[]>([]);
  const [avatarsDemoMode, setAvatarsDemoMode] = useState(false);
  const [selectedAvatarId, setSelectedAvatarId] = useState<string>("");
  const [generating, setGenerating] = useState(false);
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);

  async function refresh() {
    const [productsRes, videosRes] = await Promise.all([
      fetch("/api/products").then((r) => r.json()),
      fetch("/api/videos").then((r) => r.json()),
    ]);
    setProducts(productsRes.products);
    setVideos(videosRes.videos);
    if (!selectedProduct && productsRes.products[0]) {
      setSelectedProduct(productsRes.products[0].id);
    }
    return videosRes.videos as Video[];
  }

  useEffect(() => {
    refresh();
    fetch("/api/heygen/avatars")
      .then((res) => res.json())
      .then((data) => {
        setAvatars(data.avatars ?? []);
        setAvatarsDemoMode(!!data.demoMode);
      })
      .catch(() => setAvatars([]));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Poll any "pending" video (real AI generation in progress) every 5s until done.
  useEffect(() => {
    const pending = videos.filter((v) => v.status === "pending");
    if (pending.length === 0) {
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
        pollingRef.current = null;
      }
      return;
    }
    if (pollingRef.current) return;

    pollingRef.current = setInterval(async () => {
      await Promise.all(pending.map((v) => fetch(`/api/videos/${v.id}/refresh`, { method: "POST" })));
      const updated = await refresh();
      if (!updated.some((v) => v.status === "pending") && pollingRef.current) {
        clearInterval(pollingRef.current);
        pollingRef.current = null;
      }
    }, 5000);

    return () => {
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
        pollingRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [videos]);

  async function generate() {
    if (!selectedProduct) return;
    setGenerating(true);
    const chosenAvatar = avatars.find((a) => a.id === selectedAvatarId);
    await fetch("/api/generate-video", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        productId: selectedProduct,
        avatarId: selectedAvatarId || null,
        voiceId: chosenAvatar?.defaultVoiceId || null,
      }),
    });
    setGenerating(false);
    refresh();
  }

  return (
    <div>
      <h1 className="text-2xl font-semibold mb-8">Videos</h1>

      {products.length > 0 && (
        <div className="mb-8 space-y-5">
          <div className="flex items-center gap-3">
            <select
              value={selectedProduct}
              onChange={(e) => setSelectedProduct(e.target.value)}
              className="rounded-lg bg-neutral-50 border border-neutral-200 text-neutral-900 px-3 py-2 text-sm"
            >
              {products.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
            <button
              onClick={generate}
              disabled={generating}
              className="rounded-full bg-indigo-600 text-white px-4 py-2 text-sm font-medium hover:bg-indigo-500 transition disabled:opacity-50"
            >
              {generating ? "Starting..." : "Generate a video"}
            </button>
          </div>

          {avatarsDemoMode ? (
            <p className="text-xs text-neutral-500">
              Connect a HeyGen API key to pick a specific avatar for this video. Without it, a demo
              video is used.
            </p>
          ) : avatars.length > 0 ? (
            <div>
              <p className="text-sm text-neutral-500 mb-2">Choose an avatar (optional):</p>
              <div className="flex flex-wrap gap-3">
                <button
                  onClick={() => setSelectedAvatarId("")}
                  className={`rounded-lg border px-3 py-2 text-xs text-neutral-600 transition ${
                    selectedAvatarId === "" ? "border-indigo-500 bg-indigo-600/10" : "border-neutral-200 hover:border-neutral-300"
                  }`}
                >
                  Auto (let AI pick)
                </button>
                {avatars.map((a) => (
                  <button
                    key={a.id}
                    onClick={() => setSelectedAvatarId(a.id)}
                    className={`flex flex-col items-center gap-1 rounded-lg border p-2 transition ${
                      selectedAvatarId === a.id ? "border-indigo-500 bg-indigo-600/10" : "border-neutral-200 hover:border-neutral-300"
                    }`}
                  >
                    {a.previewImageUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={a.previewImageUrl} alt={a.name} className="w-16 h-16 object-cover rounded-md" />
                    ) : (
                      <div className="w-16 h-16 rounded-md bg-neutral-200" />
                    )}
                    <span className="text-xs text-neutral-500 max-w-[4.5rem] truncate">{a.name}</span>
                  </button>
                ))}
              </div>
            </div>
          ) : null}
        </div>
      )}

      <ul className="space-y-3">
        {videos.map((v) => (
          <li key={v.id} className="rounded-xl border border-neutral-200 p-4 flex items-center justify-between">
            <div>
              <p className="font-medium">{v.productName}</p>
              <p className="text-sm text-neutral-500">
                {v.status === "pending" ? "generating... (usually 1-3 min)" : v.status} · provider: {v.provider}
              </p>
            </div>
            {v.videoUrl && (
              <a
                href={v.videoUrl}
                target="_blank"
                className="text-sm text-indigo-600 hover:underline"
              >
                View video
              </a>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
