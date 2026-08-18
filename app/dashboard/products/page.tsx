"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Plus, Trash2 } from "lucide-react";

type Product = { id: string; name: string; description: string; imageUrl: string | null; leadId: string | null };
type Lead = { id: string; businessName: string };

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [savingId, setSavingId] = useState<string | null>(null);

  async function refresh() {
    const [productsData, leadsData] = await Promise.all([
      fetch("/api/products").then((r) => r.json()),
      fetch("/api/leads").then((r) => r.json()),
    ]);
    setProducts(productsData.products ?? []);
    setLeads(leadsData.leads ?? []);
  }

  useEffect(() => {
    refresh();
  }, []);

  async function remove(id: string) {
    if (!confirm("Delete this product? Its videos and scheduled posts will be deleted too.")) return;
    setDeletingId(id);
    await fetch(`/api/products/${id}`, { method: "DELETE" });
    setDeletingId(null);
    refresh();
  }

  async function changeLead(productId: string, leadId: string) {
    setSavingId(productId);
    await fetch(`/api/products/${productId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ leadId: leadId || null }),
    });
    setSavingId(null);
    refresh();
  }

  const leadName = (id: string | null) => leads.find((l) => l.id === id)?.businessName;

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-semibold">Products</h1>
        <Link
          href="/dashboard/products/new"
          className="flex items-center gap-1.5 rounded-full bg-indigo-600 text-white px-4 py-2 text-sm font-medium hover:bg-indigo-500 transition"
        >
          <Plus size={16} />
          Add product
        </Link>
      </div>

      {products.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-neutral-800 p-8 text-center">
          <p className="text-neutral-500 mb-4">No products yet.</p>
          <Link
            href="/dashboard/products/new"
            className="rounded-full bg-indigo-600 text-white px-4 py-2 text-sm font-medium hover:bg-indigo-500 transition"
          >
            Add your first product
          </Link>
        </div>
      ) : (
        <ul className="space-y-3">
          {products.map((p) => (
            <li key={p.id} className="rounded-xl border border-neutral-800 p-4">
              <div className="flex items-center justify-between gap-4 mb-3">
                <div className="min-w-0">
                  <p className="font-medium">{p.name}</p>
                  <p className="text-sm text-neutral-500 truncate">{p.description}</p>
                </div>
                <button
                  onClick={() => remove(p.id)}
                  disabled={deletingId === p.id}
                  className="shrink-0 flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs text-red-400 hover:bg-red-500/10 transition disabled:opacity-50"
                >
                  <Trash2 size={14} />
                  {deletingId === p.id ? "Deleting..." : "Delete"}
                </button>
              </div>
              <div className="flex items-center gap-2 pt-3 border-t border-neutral-900">
                <span className="text-xs text-neutral-500">Client:</span>
                <select
                  value={p.leadId ?? ""}
                  onChange={(e) => changeLead(p.id, e.target.value)}
                  disabled={savingId === p.id}
                  className="rounded-md bg-neutral-900 border border-neutral-800 text-neutral-100 text-xs px-2 py-1"
                >
                  <option value="">No client (internal test)</option>
                  {leads.map((l) => (
                    <option key={l.id} value={l.id}>
                      {l.businessName}
                    </option>
                  ))}
                </select>
                {p.leadId && !leadName(p.leadId) && (
                  <span className="text-xs text-amber-400">(client not found)</span>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
