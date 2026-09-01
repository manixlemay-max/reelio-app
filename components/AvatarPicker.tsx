"use client";

import { useEffect, useState } from "react";
import { Search, Check } from "lucide-react";

type Avatar = {
  id: string;
  name: string;
  previewImageUrl: string | null;
  previewVideoUrl: string | null;
  defaultVoiceId: string | null;
  gender: string | null;
};

type Props = {
  token: string;
  currentAvatarId?: string | null;
  currentAvatarName?: string | null;
  changesUsed: number;
  changesAllowed: number;
};

// Avatar look names follow a "<Person> <Scene> <Number>" pattern (e.g.
// "Saoirse Livingroom 1", "Kenji Office 10"). We split that into a readable
// "setting" (Office, Kitchen, Living room...) shown as the main label, and
// the person + look number shown small underneath — much easier to scan
// than the raw HeyGen name.
function parseAvatarName(name: string): { scene: string | null; person: string | null; number: string | null } {
  const match = name.match(/^(\S+)\s+([A-Za-z]+)\s+(\d+)$/);
  if (!match) return { scene: null, person: null, number: null };
  const [, person, scene, number] = match;
  return { scene: scene.replace(/([a-z])([A-Z])/g, "$1 $2"), person, number };
}

export default function AvatarPicker({ token, currentAvatarId, currentAvatarName, changesUsed, changesAllowed }: Props) {
  const [avatars, setAvatars] = useState<Avatar[]>([]);
  const [demoMode, setDemoMode] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [search, setSearch] = useState("");
  const [genderFilter, setGenderFilter] = useState<"all" | "male" | "female">("all");
  const [sceneFilter, setSceneFilter] = useState<string>("all");
  const [selectedId, setSelectedId] = useState(currentAvatarId ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savedAvatarId, setSavedAvatarId] = useState(currentAvatarId ?? null);
  const [savedAvatarName, setSavedAvatarName] = useState(currentAvatarName ?? null);
  const [usedCount, setUsedCount] = useState(changesUsed);
  const [expanded, setExpanded] = useState(!currentAvatarId);

  useEffect(() => {
    fetch("/api/heygen/avatars")
      .then((res) => res.json())
      .then((data) => {
        setAvatars(data.avatars ?? []);
        setDemoMode(!!data.demoMode);
        setLoaded(true);
      })
      .catch(() => setLoaded(true));
  }, []);

  const isFirstPick = !savedAvatarId;
  const remaining = isFirstPick ? null : Math.max(0, changesAllowed - usedCount);
  const canChange = isFirstPick || remaining! > 0;

  async function save() {
    if (!selectedId) {
      setError("Pick an avatar first.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const chosen = avatars.find((a) => a.id === selectedId);
      const res = await fetch("/api/leads/avatar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, avatarId: selectedId, voiceId: chosen?.defaultVoiceId ?? null }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not save your avatar.");
      setSavedAvatarId(selectedId);
      setSavedAvatarName(chosen?.name ?? null);
      setUsedCount(data.changesUsed);
      setExpanded(false);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSaving(false);
    }
  }

  const scenes = Array.from(
    new Set(avatars.map((a) => parseAvatarName(a.name ?? "").scene).filter((s): s is string => !!s))
  ).sort();

  const filtered = avatars.filter((a) => {
    if (genderFilter !== "all" && a.gender !== genderFilter) return false;
    if (sceneFilter !== "all" && parseAvatarName(a.name ?? "").scene !== sceneFilter) return false;
    const name = a.name ?? "";
    if (search && !name.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  if (demoMode) return null;

  if (!expanded && savedAvatarId) {
    return (
      <div className="rounded-lg border border-neutral-800 p-4 flex items-center justify-between gap-3 flex-wrap">
        <p className="text-sm text-neutral-300">
          Your video presenter: <span className="font-medium text-neutral-100">{savedAvatarName ?? "Chosen"}</span>
        </p>
        <button
          onClick={() => setExpanded(true)}
          disabled={!canChange}
          className="text-xs text-blue-400 hover:underline disabled:text-neutral-600 disabled:no-underline disabled:cursor-not-allowed"
        >
          {canChange ? `Change avatar (${remaining} left)` : "No changes left on your plan"}
        </button>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-neutral-800 p-4">
      <p className="text-sm font-medium mb-1">
        {isFirstPick ? "Choose your video presenter" : "Change your video presenter"}
      </p>
      <p className="text-xs text-neutral-500 mb-4">
        {isFirstPick
          ? "This AI presenter will appear in all your videos, for consistent branding. Pick a setting below, then a person."
          : `You have ${remaining} avatar change(s) left on your plan.`}
      </p>

      {!loaded ? (
        <p className="text-xs text-neutral-600">Loading avatars...</p>
      ) : avatars.length === 0 ? (
        <p className="text-xs text-neutral-600">No avatars available right now.</p>
      ) : (
        <>
          {/* Step 1: pick a setting */}
          {scenes.length > 0 && (
            <div className="mb-4">
              <p className="text-[11px] uppercase tracking-wide text-neutral-600 mb-2">1. Pick a setting</p>
              <div className="flex flex-wrap gap-1.5">
                <button
                  onClick={() => setSceneFilter("all")}
                  className={`rounded-full px-3 py-1.5 text-xs font-medium transition ${
                    sceneFilter === "all" ? "bg-blue-600 text-white" : "bg-neutral-900 border border-neutral-800 text-neutral-400 hover:border-neutral-700"
                  }`}
                >
                  Any setting
                </button>
                {scenes.map((s) => (
                  <button
                    key={s}
                    onClick={() => setSceneFilter(s)}
                    className={`rounded-full px-3 py-1.5 text-xs font-medium transition ${
                      sceneFilter === s ? "bg-blue-600 text-white" : "bg-neutral-900 border border-neutral-800 text-neutral-400 hover:border-neutral-700"
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Step 2: pick a person */}
          <p className="text-[11px] uppercase tracking-wide text-neutral-600 mb-2">
            2. Pick a person{sceneFilter !== "all" ? ` for "${sceneFilter}"` : ""}
          </p>
          <div className="flex items-center gap-2 mb-3 flex-wrap">
            <div className="flex items-center gap-1 rounded-lg bg-neutral-900 border border-neutral-800 px-2 py-1.5">
              <Search size={13} className="text-neutral-600" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by name..."
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

          <div className="grid grid-cols-3 sm:grid-cols-4 gap-3 max-h-80 overflow-y-auto pr-1 mb-4">
            {filtered.map((a) => {
              const { scene, person, number } = parseAvatarName(a.name ?? "");
              const selected = selectedId === a.id;
              return (
                <button
                  key={a.id}
                  onClick={() => setSelectedId(a.id)}
                  title={a.name}
                  className={`relative flex flex-col rounded-xl border overflow-hidden transition text-left ${
                    selected ? "border-blue-400 ring-1 ring-blue-400" : "border-neutral-800 hover:border-neutral-700"
                  }`}
                >
                  {selected && (
                    <span className="absolute top-1.5 right-1.5 z-10 w-5 h-5 rounded-full bg-blue-600 flex items-center justify-center">
                      <Check size={12} className="text-white" />
                    </span>
                  )}
                  <div className="aspect-[3/4] bg-neutral-900">
                    {a.previewImageUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={a.previewImageUrl} alt={a.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full bg-neutral-800" />
                    )}
                  </div>
                  <div className="px-2 py-1.5">
                    <p className="text-xs font-medium text-neutral-100 truncate">{scene ?? a.name}</p>
                    {person && (
                      <p className="text-[10px] text-neutral-500 truncate">
                        {person}
                        {number ? ` · #${number}` : ""}
                      </p>
                    )}
                  </div>
                </button>
              );
            })}
            {filtered.length === 0 && (
              <p className="text-xs text-neutral-600 py-4 col-span-full">No avatars match your filters.</p>
            )}
          </div>

          {error && <p className="text-xs text-red-400 mb-3">{error}</p>}
          <div className="flex items-center gap-3">
            <button
              onClick={save}
              disabled={saving || !selectedId}
              className="rounded-full bg-blue-600 text-white px-4 py-2 text-xs font-medium hover:bg-blue-500 transition disabled:opacity-50"
            >
              {saving ? "Saving..." : "Confirm this avatar"}
            </button>
            {!isFirstPick && (
              <button onClick={() => setExpanded(false)} className="text-xs text-neutral-500 hover:text-neutral-300 transition">
                Cancel
              </button>
            )}
          </div>
        </>
      )}
    </div>
  );
}
