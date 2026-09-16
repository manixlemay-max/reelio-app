import { LayoutDashboard, Package, Video, CalendarClock, BarChart3 } from "lucide-react";
import { getLeadByToken } from "@/lib/db";
import { notFound } from "next/navigation";
import Link from "next/link";
import Logo from "@/components/Logo";

export default async function ClientDashboardLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const lead = await getLeadByToken(token);
  if (!lead) return notFound();

  const base = `/report/${token}`;
  const links = [
    { href: base, label: "Overview", icon: LayoutDashboard },
    { href: `${base}/products`, label: "Products", icon: Package },
    { href: `${base}/videos`, label: "Videos", icon: Video },
    { href: `${base}/schedule`, label: "Schedule", icon: CalendarClock },
    { href: `${base}/analytics`, label: "Analytics", icon: BarChart3 },
  ];

  return (
    <div className="flex-1 flex">
      <aside className="w-56 border-r border-neutral-800 p-4 hidden sm:flex sm:flex-col">
        <div className="mb-6 px-2">
          <Logo href={base} />
        </div>
        <nav className="space-y-1">
          {links.map((link) => {
            const Icon = link.icon;
            return (
              <Link
                key={link.href}
                href={link.href}
                className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-neutral-400 hover:bg-neutral-900 hover:text-neutral-100 transition"
              >
                <Icon size={16} strokeWidth={2} />
                {link.label}
              </Link>
            );
          })}
        </nav>
        <p className="mt-auto px-3 pt-6 text-xs text-neutral-600 truncate">{lead.businessName}</p>
      </aside>
      <div className="flex-1 p-6 sm:p-10 max-w-6xl">{children}</div>
    </div>
  );
}
