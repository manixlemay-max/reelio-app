import Link from "next/link";
import { Clapperboard } from "lucide-react";

export default function Logo({ href = "/" }: { href?: string }) {
  return (
    <Link href={href} className="flex items-center gap-2 shrink-0">
      <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-indigo-600 text-white">
        <Clapperboard size={18} strokeWidth={2.25} />
      </span>
      <span className="text-lg font-semibold tracking-tight text-neutral-900">Reelio</span>
    </Link>
  );
}
