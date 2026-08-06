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

export default function VideosPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [videos, setVideos] = useState<Video[]>([]);
  const [selectedProduct, setSelectedProduct] = useState("");
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
    await fetch("/api/generate-video", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ productId: selectedProduct }),
    });
    setGenerating(false);
    refresh();
  }

  return (
    <div>
      <h1 className="text-2xl font-semibold mb-8">Videos</h1>

      {products.length > 0 && (
        <div className="flex items-center gap-3 mb-8">
          <select
            value={selectedProduct}
            onChange={(e) => setSelectedProduct(e.target.value)}
            className="rounded-lg bg-neutral-900 border border-neutral-800 text-neutral-100 px-3 py-2 text-sm"
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
            className="rounded-full bg-emerald-500 text-neutral-950 px-4 py-2 text-sm font-medium hover:bg-emerald-400 transition disabled:opacity-50"
          >
            {generating ? "Starting..." : "Generate a video"}
          </button>
        </div>
      )}

      <ul className="space-y-3">
        {videos.map((v) => (
          <li key={v.id} className="rounded-xl border border-neutral-800 p-4 flex items-center justify-between">
            <div>
              <p className="font-medium">{v.productName}</p>
              <p className="text-sm text-neutral-400">
                {v.status === "pending" ? "generating... (usually 1-3 min)" : v.status} · provider: {v.provider}
              </p>
            </div>
            {v.videoUrl && (
              <a
                href={v.videoUrl}
                target="_blank"
                className="text-sm text-emerald-400 hover:underline"
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
