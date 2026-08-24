import Link from "next/link";

// Monoline "R" mark with small circuit-style connector nodes — same family
// as the tech/AI logo style Manix pointed to (letterform + accent dots,
// cyan-to-magenta gradient), built as a distinct shape for Reelio. No
// background badge: the mark carries its own color and sits directly on
// the page, closer to a wordmark lockup than an app-icon tile.
function Mark({ size = 26 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="reelioMark" x1="2" y1="2" x2="22" y2="22" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#22d3ee" />
          <stop offset="55%" stopColor="#6366f1" />
          <stop offset="100%" stopColor="#d946ef" />
        </linearGradient>
      </defs>
      <path
        d="M6 20V4h7a4 4 0 0 1 0 8H6M13 12l6 8"
        stroke="url(#reelioMark)"
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="16" cy="4" r="1.3" fill="url(#reelioMark)" />
      <circle cx="19" cy="20" r="1.3" fill="url(#reelioMark)" />
    </svg>
  );
}

export default function Logo({ href = "/" }: { href?: string }) {
  return (
    <Link href={href} className="flex items-center gap-2 shrink-0">
      <Mark />
      <span className="text-lg font-semibold tracking-tight text-neutral-100">Reelio</span>
    </Link>
  );
}
