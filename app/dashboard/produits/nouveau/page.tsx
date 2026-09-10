"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function NewProductPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    const res = await fetch("/api/products", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, description, imageUrl }),
    });
    setSubmitting(false);
    if (res.ok) {
      router.push("/dashboard/videos");
    } else {
      const data = await res.json();
      setError(data.error ?? "Erreur inconnue");
    }
  }

  return (
    <div>
      <h1 className="text-2xl font-semibold mb-8">Ajouter un produit</h1>
      <form onSubmit={onSubmit} className="space-y-5 max-w-lg">
        <Field label="Nom du produit">
          <input
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full rounded-lg bg-neutral-900 border border-neutral-800 px-3 py-2"
            placeholder="Ex: Gourde isotherme 750ml"
          />
        </Field>
        <Field label="Description">
          <textarea
            required
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full rounded-lg bg-neutral-900 border border-neutral-800 px-3 py-2"
            rows={4}
            placeholder="Ce qui rend ce produit intéressant pour une vidéo UGC"
          />
        </Field>
        <Field label="URL d'une image du produit (optionnel)">
          <input
            value={imageUrl}
            onChange={(e) => setImageUrl(e.target.value)}
            className="w-full rounded-lg bg-neutral-900 border border-neutral-800 px-3 py-2"
            placeholder="https://..."
          />
        </Field>
        {error && <p className="text-sm text-red-400">{error}</p>}
        <button
          type="submit"
          disabled={submitting}
          className="rounded-full bg-emerald-500 text-neutral-950 px-5 py-2 text-sm font-medium hover:bg-emerald-400 transition disabled:opacity-50"
        >
          {submitting ? "Ajout..." : "Ajouter le produit"}
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
