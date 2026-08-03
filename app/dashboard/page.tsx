import Link from "next/link";
import { listProducts, listVideos, listPosts } from "@/lib/db";

export default async function DashboardOverviewPage() {
  const products = listProducts();
  const videos = listVideos();
  const posts = listPosts();

  return (
    <div>
      <h1 className="text-2xl font-semibold mb-8">Vue d&apos;ensemble</h1>

      <div className="grid sm:grid-cols-3 gap-4 mb-10">
        <StatCard label="Produits" value={products.length} />
        <StatCard label="Vidéos générées" value={videos.length} />
        <StatCard label="Publications planifiées" value={posts.length} />
      </div>

      {products.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-neutral-800 p-8 text-center">
          <p className="text-neutral-400 mb-4">Aucun produit pour le moment.</p>
          <Link
            href="/dashboard/produits/nouveau"
            className="rounded-full bg-emerald-500 text-neutral-950 px-4 py-2 text-sm font-medium hover:bg-emerald-400 transition"
          >
            Ajouter votre premier produit
          </Link>
        </div>
      ) : (
        <div>
          <h2 className="text-sm font-medium text-neutral-500 mb-3">Produits récents</h2>
          <ul className="space-y-2">
            {products.slice(0, 5).map((p) => (
              <li key={p.id} className="rounded-xl border border-neutral-800 p-4">
                <p className="font-medium">{p.name}</p>
                <p className="text-sm text-neutral-400">{p.description}</p>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl border border-neutral-800 p-6">
      <p className="text-3xl font-semibold">{value}</p>
      <p className="text-sm text-neutral-400 mt-1">{label}</p>
    </div>
  );
}
