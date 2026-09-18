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

type AvatarRef = { id: string; voiceId: string | null };

type Props = {
  token: string;
  initialAvatarIds: AvatarRef[];
  // Max number of avatars the client can have in their rotation. null = unlimited.
  maxAvatars: number | null;
};

export default function AvatarPicker({ token, initialAvatarIds, maxAvatars }: Props) {
  const [avatars, setAvatars] = useState<Avatar[]>([]);
  const [demoMode, setDemoMode] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [search, setSearch] = useState("");
  const [genderFilter, setGenderFilter] = useState<"all" | "male" | "female">("all");
  const [selected, setSelected] = useState<AvatarRef[]>(initialAvatarIds);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState<AvatarRef[]>(initialAvatarIds);
  const [expanded, setExpanded] = useState(initialAvatarIds.length === 0);

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

  const unlimited = maxAvatars === null;
  const atLimit = !unlimited && selected.length >= maxAvatars;

  function toggle(avatar: Avatar) {
    setSelected((prev) => {
      const isSelected = prev.some((a) => a.id === avatar.id);
      if (isSelected) return prev.filter((a) => a.id !== avatar.id);
      if (!unlimited && prev.length >= maxAvatars) return prev; // at cap, ignore
      return [...prev, { id: avatar.id, voiceId: avatar.defaultVoiceId }];
    });
  }

  async function save() {
    if (selected.length === 0) {
      setError("Pick at least one avatar.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/leads/avatar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, avatarIds: selected }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not save your avatars.");
      setSaved(selected);
      setExpanded(false);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSaving(false);
    }
  }

  const filtered = avatars.filter((a) => {
    if (genderFilter !== "all" && a.gender !== genderFilter) return false;
    const name = a.name ?? "";
    if (search && !name.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  if (demoMode) return null;

  const savedNames = saved
    .map((s) => avatars.find((a) => a.id === s.id)?.name)
    .filter((n): n is string => !!n);

  if (!expanded && saved.length > 0) {
    return (
      <div className="rounded-lg border border-neutral-800 p-4 flex items-center justify-between gap-3 flex-wrap">
        <p className="text-sm text-neutral-300">
          Your video presenter{saved.length > 1 ? "s" : ""}:{" "}
          <span className="font-medium text-neutral-100">
            {savedNames.length > 0 ? savedNames.join(", ") : `${saved.length} chosen`}
          </span>
        </p>
        <button
          onClick={() => setExpanded(true)}
          className="text-xs text-blue-400 hover:underline"
        >
          Manage avatars
        </button>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-neutral-800 p-4">
      <p className="text-sm font-medium mb-1">
        {saved.length === 0 ? "Choose your video presenter(s)" : "Manage your video presenters"}
      </p>
      <p className="text-xs text-neutral-500 mb-4">
        {unlimited
          ? "Pick as many as you'd like — each video picks one of them at random for variety."
          : `Pick up to ${maxAvatars} — each video picks one of them at random for variety. (${selected.length}/${maxAvatars} selected)`}
      </p>

      {!loaded ? (
        <p className="text-xs text-neutral-600">Loading avatars...</p>
      ) : avatars.length === 0 ? (
        <p className="text-xs text-neutral-600">No avatars available right now.</p>
      ) : (
        <>
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
              const isSelected = selected.some((s) => s.id === a.id);
              const disabled = !isSelected && atLimit;
              return (
                <button
                  key={a.id}
                  onClick={() => toggle(a)}
                  disabled={disabled}
                  title={a.name}
                  className={`relative flex flex-col rounded-xl border overflow-hidden transition text-left ${
                    isSelected
                      ? "border-blue-400 ring-1 ring-blue-400"
                      : disabled
                        ? "border-neutral-900 opacity-40 cursor-not-allowed"
                        : "border-neutral-800 hover:border-neutral-700"
                  }`}
                >
                  {isSelected && (
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
                </button>
              );
            })}
            {filtered.length === 0 && (
              <p className="text-xs text-neutral-600 py-4 col-span-full">No avatars match your search.</p>
            )}
          </div>

          {error && <p className="text-xs text-red-400 mb-3">{error}</p>}
          <div className="flex items-center gap-3">
            <button
              onClick={save}
              disabled={saving || selected.length === 0}
              className="rounded-full bg-blue-600 text-white px-4 py-2 text-xs font-medium hover:bg-blue-500 transition disabled:opacity-50"
            >
              {saving ? "Saving..." : `Save avatar${selected.length > 1 ? "s" : ""}`}
            </button>
            {saved.length > 0 && (
              <button
                onClick={() => {
                  setSelected(saved);
                  setExpanded(false);
                  setError(null);
                }}
                className="text-xs text-neutral-500 hover:text-neutral-300 transition"
              >
                Cancel
              </button>
            )}
          </div>
        </>
      )}
    </div>
  );
}
