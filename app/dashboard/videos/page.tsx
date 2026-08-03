"use client";

import { useEffect, useState } from "react";

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
  }

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
            className="rounded-lg bg-neutral-900 border border-neutral-800 px-3 py-2 text-sm"
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
            {generating ? "Generating..." : "Generate a video"}
          </button>
        </div>
      )}

      <ul className="space-y-3">
        {videos.map((v) => (
          <li key={v.id} className="rounded-xl border border-neutral-800 p-4 flex items-center justify-between">
            <div>
              <p className="font-medium">{v.productName}</p>
              <p className="text-sm text-neutral-400">
                {v.status} · provider: {v.provider}
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
