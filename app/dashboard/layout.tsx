import Link from "next/link";

const links = [
  { href: "/dashboard", label: "Vue d'ensemble" },
  { href: "/dashboard/produits/nouveau", label: "Ajouter un produit" },
  { href: "/dashboard/videos", label: "Vidéos" },
  { href: "/dashboard/planification", label: "Planification" },
  { href: "/dashboard/analytique", label: "Analytique" },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex-1 flex">
      <aside className="w-56 border-r border-neutral-800 p-4 hidden sm:block">
        <p className="text-sm font-medium text-neutral-500 mb-4 px-2">Reelio</p>
        <nav className="space-y-1">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="block rounded-lg px-3 py-2 text-sm text-neutral-300 hover:bg-neutral-900 transition"
            >
              {link.label}
            </Link>
          ))}
        </nav>
      </aside>
      <div className="flex-1 p-6 sm:p-10 max-w-4xl">{children}</div>
    </div>
  );
}
