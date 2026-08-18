import Link from "next/link";
import Logo from "./Logo";

export default function SiteHeader() {
  return (
    <header className="border-b border-neutral-200">
      <div className="mx-auto max-w-5xl px-6 h-16 flex items-center justify-between">
        <Logo />
        <nav className="flex items-center gap-6 text-sm">
          <Link href="/pricing" className="text-neutral-600 hover:text-neutral-900 transition">
            Pricing
          </Link>
          <Link
            href="/login"
            className="rounded-full bg-indigo-600 text-white px-4 py-2 font-medium hover:bg-indigo-500 transition"
          >
            Dashboard login
          </Link>
        </nav>
      </div>
    </header>
  );
}
