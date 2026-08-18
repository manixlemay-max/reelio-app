import Link from "next/link";

// Bold geometric monogram mark — a stylized "R" cut by a diagonal play/motion
// slash, read as a modern tech-startup wordmark rather than a literal icon.
function Mark() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M5 20V4h7.2c3 0 5.3 2 5.3 4.8 0 2.1-1.3 3.8-3.3 4.5L18.5 20h-3.6l-3.8-6.2H8.2V20H5Zm3.2-8.7h3.7c1.5 0 2.5-.9 2.5-2.2 0-1.3-1-2.1-2.5-2.1H8.2v4.3Z"
        fill="white"
      />
    </svg>
  );
}

export default function Logo({ href = "/" }: { href?: string }) {
  return (
    <Link href={href} className="flex items-center gap-2 shrink-0">
      <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 via-violet-600 to-fuchsia-600 shadow-[0_0_20px_-4px_rgba(129,90,246,0.6)]">
        <Mark />
      </span>
      <span className="text-lg font-semibold tracking-tight text-neutral-100">Reelio</span>
    </Link>
  );
}
