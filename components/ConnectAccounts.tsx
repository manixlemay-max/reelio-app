"use client";

import { useState } from "react";

type Platform = "tiktok" | "instagram" | "youtube";

type Props = {
  token: string;
  networksAllowed: number;
  initialConnected: Record<Platform, boolean>;
};

type PlatformState = "idle" | "connecting" | "connected";

const PLATFORMS: Platform[] = ["tiktok", "instagram", "youtube"];

export default function ConnectAccounts({ token, networksAllowed, initialConnected }: Props) {
  const [states, setStates] = useState<Record<Platform, PlatformState>>({
    tiktok: initialConnected.tiktok ? "connected" : "idle",
    instagram: initialConnected.instagram ? "connected" : "idle",
    youtube: initialConnected.youtube ? "connected" : "idle",
  });
  const [beforeIds, setBeforeIds] = useState<Record<Platform, string[]>>({
    tiktok: [],
    instagram: [],
    youtube: [],
  });
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState<Platform | null>(null);

  const connectedCount = PLATFORMS.filter((p) => states[p] === "connected").length;

  async function connect(platform: Platform) {
    setError(null);
    setBusy(platform);
    try {
      const snapshotRes = await fetch(`/api/leads/connect-snapshot?platform=${platform}`);
      const snapshot = await snapshotRes.json();
      setBeforeIds((prev) => ({ ...prev, [platform]: snapshot.ids ?? [] }));

      const connectRes = await fetch(`/api/postiz/connect?platform=${platform}`);
      const connectData = await connectRes.json();
      if (!connectRes.ok || !connectData.url) {
        throw new Error(connectData.error || "Could not start connection. Try again shortly.");
      }

      // Open in a separate tab instead of navigating away — the client stays
      // on this page and just confirms once they're done.
      window.open(connectData.url, "_blank", "noopener,noreferrer");
      setStates((prev) => ({ ...prev, [platform]: "connecting" }));
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(null);
    }
  }

  async function confirmDone(platform: Platform) {
    setError(null);
    setBusy(platform);
    try {
      const res = await fetch("/api/leads/connect-confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, platform, beforeIds: beforeIds[platform] }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not confirm the connection.");
      setStates((prev) => ({ ...prev, [platform]: "connected" }));
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="rounded-lg border border-neutral-800 p-4">
      <p className="text-sm font-medium mb-1">Connect your accounts</p>
      <p className="text-xs text-neutral-500 mb-4">
        You get up to {networksAllowed} connected network{networksAllowed > 1 ? "s" : ""}. Connecting opens a
        new tab where you authorize directly on the platform&apos;s own screen; we never see or store your
        password.
      </p>

      <div className="space-y-2">
        {PLATFORMS.map((platform) => {
          const state = states[platform];
          const isBusy = busy === platform;
          const atLimit = state === "idle" && connectedCount >= networksAllowed;

          if (state === "connected") {
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
              {state === "idle" ? (
                <button
                  onClick={() => connect(platform)}
                  disabled={isBusy || atLimit}
                  className="rounded-full border border-neutral-800 px-4 py-2 text-sm font-medium capitalize hover:border-neutral-600 transition disabled:opacity-40"
                >
                  {isBusy ? "Opening..." : `Connect ${platform}`}
                </button>
              ) : (
                <>
                  <span className="text-xs text-neutral-500">Waiting on {platform}...</span>
                  <button
                    onClick={() => confirmDone(platform)}
                    disabled={isBusy}
                    className="rounded-full bg-blue-600 text-white px-4 py-2 text-xs font-medium hover:bg-blue-500 transition disabled:opacity-50"
                  >
                    {isBusy ? "Checking..." : "I'm done — mark as connected"}
                  </button>
                </>
              )}
              {atLimit && <span className="text-xs text-neutral-600">Plan limit reached ({networksAllowed})</span>}
            </div>
          );
        })}
      </div>

      {error && <p className="text-xs text-red-400 mt-3">{error}</p>}
    </div>
  );
}
