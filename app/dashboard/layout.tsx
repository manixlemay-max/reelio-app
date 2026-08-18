import Link from "next/link";
import { LayoutDashboard, Users, Package, Video, CalendarClock, BarChart3 } from "lucide-react";
import LogoutButton from "@/components/LogoutButton";
import Logo from "@/components/Logo";

const links = [
  { href: "/dashboard", label: "Overview", icon: LayoutDashboard },
  { href: "/dashboard/clients", label: "Clients", icon: Users },
  { href: "/dashboard/products", label: "Products", icon: Package },
  { href: "/dashboard/videos", label: "Videos", icon: Video },
  { href: "/dashboard/schedule", label: "Schedule", icon: CalendarClock },
  { href: "/dashboard/analytics", label: "Analytics", icon: BarChart3 },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex-1 flex">
      <aside className="w-56 border-r border-neutral-800 p-4 hidden sm:flex sm:flex-col sm:justify-between">
        <div>
          <div className="mb-6 px-2">
            <Logo href="/dashboard" />
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
        </div>
        <LogoutButton />
      </aside>
      <div className="flex-1 p-6 sm:p-10 max-w-4xl">{children}</div>
    </div>
  );
}
