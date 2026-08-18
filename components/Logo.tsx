import Link from "next/link";

// Custom mark (not a stock icon): a play-reel shape with a little "spark" to
// hint at AI-generated content — original to Reelio rather than a generic
// clapperboard/video icon.
function Mark() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="10" cy="12" r="7.5" stroke="white" strokeWidth="1.8" />
      <path d="M8.2 8.8 14.2 12 8.2 15.2V8.8Z" fill="white" />
      <path
        d="M18.5 4.5 19.3 6.7 21.5 7.5 19.3 8.3 18.5 10.5 17.7 8.3 15.5 7.5 17.7 6.7 18.5 4.5Z"
        fill="white"
      />
    </svg>
  );
}

export default function Logo({ href = "/" }: { href?: string }) {
  return (
    <Link href={href} className="flex items-center gap-2 shrink-0">
      <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600">
        <Mark />
      </span>
      <span className="text-lg font-semibold tracking-tight text-neutral-100">Reelio</span>
    </Link>
  );
}
