import { getLeadByToken, getProductsByLead, getSubscriptionByEmail } from "@/lib/db";
import { notFound } from "next/navigation";
import { TIERS } from "@/lib/pricing";

export const dynamic = "force-dynamic";

export default async function ClientProductsPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const lead = await getLeadByToken(token);
  if (!lead) return notFound();

  const products = await getProductsByLead(lead.id);
  const sub = await getSubscriptionByEmail(lead.email);
  const tier = TIERS.find((t) => t.id === sub?.tierId) ?? TIERS[TIERS.length - 1];

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-semibold">Products</h1>
        <span className="text-xs text-neutral-500">
          {products.length} of {tier.productsAllowed ?? "unlimited"}
        </span>
      </div>

      {products.length === 0 ? (
        <p className="text-sm text-neutral-500">No products yet — reach out and we&apos;ll add your first one.</p>
      ) : (
        <ul className="space-y-3">
          {products.map((p) => (
            <li key={p.id} className="rounded-xl border border-neutral-800 p-4">
              <p className="font-medium text-sm">{p.name}</p>
              <p className="text-sm text-neutral-500">{p.description}</p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
