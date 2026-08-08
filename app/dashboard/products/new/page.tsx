"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

type Lead = { id: string; businessName: string };

export default function NewProductPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [leadId, setLeadId] = useState("");
  const [leads, setLeads] = useState<Lead[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/leads")
      .then((res) => res.json())
      .then((data) => setLeads(data.leads ?? []))
      .catch(() => setLeads([]));
  }, []);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    const res = await fetch("/api/products", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, description, imageUrl, leadId: leadId || null }),
    });
    setSubmitting(false);
    if (res.ok) {
      router.push("/dashboard/videos");
    } else {
      const data = await res.json();
      setError(data.error ?? "Unknown error");
    }
  }

  return (
    <div>
      <h1 className="text-2xl font-semibold mb-8">Add a product</h1>
      <form onSubmit={onSubmit} className="space-y-5 max-w-lg">
        <Field label="Client (optional — leave blank for your own testing)">
          <select
            value={leadId}
            onChange={(e) => setLeadId(e.target.value)}
            className="w-full rounded-lg bg-neutral-900 border border-neutral-800 text-neutral-100 px-3 py-2"
          >
            <option value="">No client (internal test)</option>
            {leads.map((lead) => (
              <option key={lead.id} value={lead.id}>
                {lead.businessName}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Product name">
          <input
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full rounded-lg bg-neutral-900 border border-neutral-800 text-neutral-100 placeholder-neutral-500 px-3 py-2"
            placeholder="Ex: Insulated water bottle 25oz"
          />
        </Field>
        <Field label="Description">
          <textarea
            required
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full rounded-lg bg-neutral-900 border border-neutral-800 text-neutral-100 placeholder-neutral-500 px-3 py-2"
            rows={4}
            placeholder="What makes this product interesting for a UGC video"
          />
        </Field>
        <Field label="Product image URL (optional)">
          <input
            value={imageUrl}
            onChange={(e) => setImageUrl(e.target.value)}
            className="w-full rounded-lg bg-neutral-900 border border-neutral-800 text-neutral-100 placeholder-neutral-500 px-3 py-2"
            placeholder="https://..."
          />
        </Field>
        {error && <p className="text-sm text-red-400">{error}</p>}
        <button
          type="submit"
          disabled={submitting}
          className="rounded-full bg-emerald-500 text-neutral-950 px-5 py-2 text-sm font-medium hover:bg-emerald-400 transition disabled:opacity-50"
        >
          {submitting ? "Adding..." : "Add product"}
        </button>
      </form>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="block text-sm text-neutral-400 mb-1">{label}</span>
      {children}
    </label>
  );
}
