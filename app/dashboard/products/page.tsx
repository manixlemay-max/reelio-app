"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Plus, Trash2 } from "lucide-react";

type Product = { id: string; name: string; description: string; imageUrl: string | null };

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  async function refresh() {
    const data = await fetch("/api/products").then((r) => r.json());
    setProducts(data.products ?? []);
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
            <li key={p.id} className="rounded-xl border border-neutral-800 p-4 flex items-center justify-between gap-4">
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
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
