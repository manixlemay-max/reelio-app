"use client";

import { useEffect, useState } from "react";
import { Search } from "lucide-react";

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
// "Saoirse Livingroom 1", "Kenji Office 10") — lets clients pick a setting
// (office, kitchen, living room, etc.) without HeyGen exposing scene as its
// own field.
function extractScene(name: string): string | null {
  const match = name.match(/^\S+\s+([A-Za-z]+)\s+\d+$/);
  return match ? match[1] : null;
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
    new Set(avatars.map((a) => extractScene(a.name ?? "")).filter((s): s is string => !!s))
  ).sort();

  const filtered = avatars.filter((a) => {
    if (genderFilter !== "all" && a.gender !== genderFilter) return false;
    if (sceneFilter !== "all" && extractScene(a.name ?? "") !== sceneFilter) return false;
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
      <p className="text-xs text-neutral-500 mb-3">
        {isFirstPick
          ? "This AI presenter will appear in all your videos, for consistent branding."
          : `You have ${remaining} avatar change(s) left on your plan.`}
      </p>

      {!loaded ? (
        <p className="text-xs text-neutral-600">Loading avatars...</p>
      ) : avatars.length === 0 ? (
        <p className="text-xs text-neutral-600">No avatars available right now.</p>
      ) : (
        <>
          <div className="flex items-center justify-between mb-3 gap-3 flex-wrap">
            <div className="flex items-center gap-1 rounded-lg bg-neutral-900 border border-neutral-800 px-2 py-1">
              <Search size={13} className="text-neutral-600" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search avatars..."
                className="bg-transparent text-xs text-neutral-100 placeholder-neutral-600 outline-none w-32"
              />
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              {scenes.length > 0 && (
                <select
                  value={sceneFilter}
                  onChange={(e) => setSceneFilter(e.target.value)}
                  className="rounded-lg bg-neutral-900 border border-neutral-800 text-neutral-300 text-xs px-2 py-1.5"
                >
                  <option value="all">Any setting</option>
                  {scenes.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              )}
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

          <div className="flex flex-wrap gap-2.5 max-h-64 overflow-y-auto pr-1 mb-3">
            {filtered.map((a) => (
              <button
                key={a.id}
                onClick={() => setSelectedId(a.id)}
                title={a.name}
                className={`flex flex-col items-center gap-1 w-20 rounded-lg border p-2 transition shrink-0 ${
                  selectedId === a.id ? "border-blue-400 bg-blue-600/10" : "border-neutral-800 hover:border-neutral-700"
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
            {filtered.length === 0 && <p className="text-xs text-neutral-600 py-4">No avatars match your search.</p>}
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
