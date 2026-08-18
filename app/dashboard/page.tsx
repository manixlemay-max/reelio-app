import Link from "next/link";
import { listProducts, listVideos, listPosts } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function DashboardOverviewPage() {
  const products = await listProducts();
  const videos = await listVideos();
  const posts = await listPosts();

  return (
    <div>
      <h1 className="text-2xl font-semibold mb-8">Overview</h1>

      <div className="grid sm:grid-cols-3 gap-4 mb-10">
        <StatCard label="Products" value={products.length} />
        <StatCard label="Videos generated" value={videos.length} />
        <StatCard label="Scheduled posts" value={posts.length} />
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
        <div>
          <h2 className="text-sm font-medium text-neutral-500 mb-3">Recent products</h2>
          <ul className="space-y-2">
            {products.slice(0, 5).map((p) => (
              <li key={p.id} className="rounded-xl border border-neutral-800 p-4">
                <p className="font-medium">{p.name}</p>
                <p className="text-sm text-neutral-500">{p.description}</p>
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
      <p className="text-sm text-neutral-500 mt-1">{label}</p>
    </div>
  );
}
