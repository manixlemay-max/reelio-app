"use client";

import { useEffect, useState } from "react";

type Integration = { id: string; identifier: string; name: string; disabled: boolean };

type Lead = {
  id: string;
  tiktokIntegrationId: string | null;
  instagramIntegrationId: string | null;
  youtubeIntegrationId: string | null;
};

const PLATFORMS: { key: "tiktok" | "instagram" | "youtube"; label: string }[] = [
  { key: "tiktok", label: "TikTok" },
  { key: "instagram", label: "Instagram" },
  { key: "youtube", label: "YouTube" },
];

export default function LeadIntegrations({ lead }: { lead: Lead }) {
  const [integrations, setIntegrations] = useState<Integration[]>([]);
  const [demoMode, setDemoMode] = useState(false);
  const [values, setValues] = useState({
    tiktokIntegrationId: lead.tiktokIntegrationId ?? "",
    instagramIntegrationId: lead.instagramIntegrationId ?? "",
    youtubeIntegrationId: lead.youtubeIntegrationId ?? "",
  });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    fetch("/api/postiz/integrations")
      .then((res) => res.json())
      .then((data) => {
        setIntegrations(data.integrations ?? []);
        setDemoMode(!!data.demoMode);
      })
      .catch(() => setIntegrations([]));
  }, []);

  async function save() {
    setSaving(true);
    setSaved(false);
    await fetch(`/api/leads/${lead.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        tiktokIntegrationId: values.tiktokIntegrationId || null,
        instagramIntegrationId: values.instagramIntegrationId || null,
        youtubeIntegrationId: values.youtubeIntegrationId || null,
      }),
    });
    setSaving(false);
    setSaved(true);
  }

  if (demoMode) {
    return (
      <p className="text-xs text-neutral-500 mt-2">
        Connect Postiz (add POSTING_PROVIDER_API_KEY) to link this client's social accounts.
      </p>
    );
  }

  return (
    <div className="mt-3 border-t border-neutral-800 pt-3">
      <p className="text-xs text-neutral-500 mb-2">Connected accounts for this client:</p>
      <div className="grid sm:grid-cols-3 gap-2">
        {PLATFORMS.map(({ key, label }) => {
          const fieldKey = `${key}IntegrationId` as keyof typeof values;
          const options = integrations.filter((i) => i.identifier === key && !i.disabled);
          return (
            <label key={key} className="block">
              <span className="block text-xs text-neutral-500 mb-1">{label}</span>
              <select
                value={values[fieldKey]}
                onChange={(e) => setValues((v) => ({ ...v, [fieldKey]: e.target.value }))}
                className="w-full rounded-md bg-neutral-900 border border-neutral-800 text-neutral-100 text-xs px-2 py-1.5"
              >
                <option value="">Not connected</option>
                {options.map((opt) => (
                  <option key={opt.id} value={opt.id}>
                    {opt.name}
                  </option>
                ))}
              </select>
            </label>
          );
        })}
      </div>
      <button
        onClick={save}
        disabled={saving}
        className="mt-2 text-xs rounded-full bg-neutral-800 hover:bg-neutral-700 px-3 py-1.5 transition disabled:opacity-50"
      >
        {saving ? "Saving..." : saved ? "Saved ✓" : "Save"}
      </button>
    </div>
  );
}
