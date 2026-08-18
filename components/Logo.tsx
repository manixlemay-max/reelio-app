import Link from "next/link";

// A single abstract paisley/loop shape — no literal camera, play button, or
// clapperboard — in the spirit of minimal one-shape marks like Airbnb's Bélo.
// Reads as a continuous "reel" loop with a soft point, unique at a glance.
function Mark() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M12 2C7.6 2 4 5.6 4 10c0 5.2 5.2 9.6 7.3 11.2.4.3 1 .3 1.4 0C14.8 19.6 20 15.2 20 10c0-4.4-3.6-8-8-8Zm0 11.2A5.2 5.2 0 1 1 12 3.8a5.2 5.2 0 0 1 0 9.4Z"
        fill="white"
        fillRule="evenodd"
        clipRule="evenodd"
      />
    </svg>
  );
}

export default function Logo({ href = "/" }: { href?: string }) {
  return (
    <Link href={href} className="flex items-center gap-2 shrink-0">
      <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-gradient-to-br from-sky-400 via-blue-500 to-blue-600 shadow-[0_0_20px_-4px_rgba(59,130,246,0.7)]">
        <Mark />
      </span>
      <span className="text-lg font-semibold tracking-tight text-neutral-100">Reelio</span>
    </Link>
  );
}
