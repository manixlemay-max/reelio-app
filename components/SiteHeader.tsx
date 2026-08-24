import Link from "next/link";
import Logo from "./Logo";

// No "Dashboard login" link here on purpose: this header shows on public
// pages that clients also see (landing, pricing), and clients never use the
// dashboard — it only led to confused "what's this?" questions. Manix reaches
// his dashboard directly at /login (bookmark it) instead of via public nav.
export default function SiteHeader() {
  return (
    <header className="border-b border-neutral-800">
      <div className="mx-auto max-w-5xl px-6 h-16 flex items-center justify-between">
        <Logo />
        <nav className="flex items-center gap-6 text-sm">
          <Link href="/#how-it-works" className="text-neutral-400 hover:text-neutral-100 transition">
            How it works
          </Link>
          <Link href="/#pricing" className="text-neutral-400 hover:text-neutral-100 transition">
            Pricing
          </Link>
        </nav>
      </div>
    </header>
  );
}
