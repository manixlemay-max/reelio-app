"use client";

import { useEffect, useRef, useState } from "react";
import { Loader2, CheckCircle2, XCircle, Play, Search } from "lucide-react";

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
  gender: string | null;
};

export default function VideosPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [videos, setVideos] = useState<Video[]>([]);
  const [selectedProduct, setSelectedProduct] = useState("");
  const [avatars, setAvatars] = useState<Avatar[]>([]);
  const [avatarsDemoMode, setAvatarsDemoMode] = useState(false);
  const [selectedAvatarId, setSelectedAvatarId] = useState<string>("");
  const [avatarSearch, setAvatarSearch] = useState("");
  const [genderFilter, setGenderFilter] = useState<"all" | "male" | "female">("all");
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

  const filteredAvatars = avatars.filter((a) => {
    if (genderFilter !== "all" && a.gender !== genderFilter) return false;
    const name = a.name ?? "";
    if (avatarSearch && !name.toLowerCase().includes(avatarSearch.toLowerCase())) return false;
    return true;
  });

  const selectedAvatar = avatars.find((a) => a.id === selectedAvatarId);

  return (
    <div>
      <h1 className="text-2xl font-semibold mb-8">Videos</h1>

      {products.length > 0 && (
        <div className="mb-8 space-y-5">
          <div className="flex items-center gap-3">
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
              className="rounded-full bg-blue-600 text-white px-4 py-2 text-sm font-medium hover:bg-blue-500 transition disabled:opacity-50"
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
            <div className="rounded-xl border border-neutral-800 p-3">
              <div className="flex items-center justify-between mb-3 gap-3 flex-wrap">
                <p className="text-sm text-neutral-300">
                  Avatar: <span className="text-neutral-100 font-medium">{selectedAvatar ? selectedAvatar.name : "Auto (let AI pick)"}</span>
                </p>
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1 rounded-lg bg-neutral-900 border border-neutral-800 px-2 py-1">
                    <Search size={13} className="text-neutral-600" />
                    <input
                      value={avatarSearch}
                      onChange={(e) => setAvatarSearch(e.target.value)}
                      placeholder="Search avatars..."
                      className="bg-transparent text-xs text-neutral-100 placeholder-neutral-600 outline-none w-32"
                    />
                  </div>
                  <div className="flex rounded-lg border border-neutral-800 overflow-hidden text-xs">
                    {(["all", "female", "male"] as const).map((g) => (
                      <button
                        key={g}
                        onClick={() => setGenderFilter(g)}
                        className={`px-2.5 py-1.5 capitalize transition ${
                          genderFilter === g ? "bg-blue-600 text-white" : "text-neutral-500 hover:bg-neutral-900"
                        }`}
                      >
                        {g}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap gap-2.5 max-h-64 overflow-y-auto pr-1">
                <button
                  onClick={() => setSelectedAvatarId("")}
                  className={`flex flex-col items-center justify-center gap-1 w-20 h-24 rounded-lg border p-2 transition shrink-0 ${
                    selectedAvatarId === "" ? "border-blue-400 bg-blue-600/10" : "border-neutral-800 hover:border-neutral-700"
                  }`}
                >
                  <span className="w-12 h-12 rounded-full bg-neutral-800 flex items-center justify-center text-lg">✨</span>
                  <span className="text-[10px] text-neutral-500 text-center leading-tight">Auto</span>
                </button>
                {filteredAvatars.map((a) => (
                  <button
                    key={a.id}
                    onClick={() => setSelectedAvatarId(a.id)}
                    title={a.name}
                    className={`flex flex-col items-center gap-1 w-20 rounded-lg border p-2 transition shrink-0 ${
                      selectedAvatarId === a.id ? "border-blue-400 bg-blue-600/10" : "border-neutral-800 hover:border-neutral-700"
                    }`}
                  >
                    {a.previewImageUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={a.previewImageUrl} alt={a.name} className="w-14 h-14 object-cover rounded-full" />
                    ) : (
                      <div className="w-14 h-14 rounded-full bg-neutral-800" />
                    )}
                    <span className="text-[10px] text-neutral-500 max-w-[4.5rem] truncate">{a.name}</span>
                  </button>
                ))}
                {filteredAvatars.length === 0 && (
                  <p className="text-xs text-neutral-600 py-4">No avatars match your search.</p>
                )}
              </div>
            </div>
          ) : null}
        </div>
      )}

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {videos.map((v) => (
          <div key={v.id} className="rounded-xl border border-neutral-800 overflow-hidden flex flex-col">
            <div className="aspect-[9/16] bg-neutral-900 flex items-center justify-center">
              {v.status === "ready" && v.videoUrl ? (
                <video src={v.videoUrl} controls className="w-full h-full object-cover" />
              ) : v.status === "pending" ? (
                <Loader2 size={24} className="animate-spin text-neutral-600" />
              ) : (
                <Play size={24} className="text-neutral-700" />
              )}
            </div>
            <div className="p-3">
              <p className="font-medium text-sm mb-1">{v.productName}</p>
              <div className="flex items-center gap-1.5 text-xs text-neutral-500">
                {v.status === "pending" && (
                  <>
                    <Loader2 size={12} className="animate-spin" />
                    <span>Generating (usually 1-3 min)</span>
                  </>
                )}
                {v.status === "ready" && (
                  <>
                    <CheckCircle2 size={12} className="text-green-400" />
                    <span>Ready</span>
                  </>
                )}
                {v.status === "failed" && (
                  <>
                    <XCircle size={12} className="text-red-400" />
                    <span>Failed</span>
                  </>
                )}
                <span className="text-neutral-700">· {v.provider}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
