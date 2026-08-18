import Link from "next/link";

// A play-triangle wrapped in an orbiting ring, reading as "video in motion" —
// a distinct symbol rather than a literal camera/clapperboard icon.
function Mark() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M12 3.5c4.7 0 8.5 3.8 8.5 8.5"
        stroke="white"
        strokeWidth="1.8"
        strokeLinecap="round"
        opacity="0.55"
      />
      <circle cx="20.5" cy="12" r="1.3" fill="white" opacity="0.55" />
      <path d="M9.5 8.2 16 12l-6.5 3.8V8.2Z" fill="white" />
    </svg>
  );
}

export default function Logo({ href = "/" }: { href?: string }) {
  return (
    <Link href={href} className="flex items-center gap-2 shrink-0">
      <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-gradient-to-br from-sky-400 via-blue-500 to-indigo-600 shadow-[0_0_20px_-4px_rgba(59,130,246,0.7)]">
        <Mark />
      </span>
      <span className="text-lg font-semibold tracking-tight text-neutral-100">Reelio</span>
    </Link>
  );
}
