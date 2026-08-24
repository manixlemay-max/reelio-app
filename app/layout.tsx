import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

const siteUrl =
  process.env.NEXT_PUBLIC_APP_URL ||
  (process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : null) ||
  (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null) ||
  "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: "Reelio — AI UGC videos for e-commerce",
  description:
    "The subscription that generates, posts, and analyzes your AI UGC videos on TikTok and Instagram automatically.",
  openGraph: {
    title: "Reelio — AI UGC videos for e-commerce",
    description:
      "The subscription that generates, posts, and analyzes your AI UGC videos on TikTok and Instagram automatically.",
    siteName: "Reelio",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Reelio — AI UGC videos for e-commerce",
    description:
      "The subscription that generates, posts, and analyzes your AI UGC videos on TikTok and Instagram automatically.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col bg-neutral-950 text-neutral-100 font-sans">
        {children}
        <footer className="border-t border-neutral-800 py-6 px-6">
          <div className="mx-auto max-w-5xl flex flex-wrap gap-4 justify-center text-xs text-neutral-500">
            <Link href="/terms" className="hover:text-neutral-300 transition">Terms of Service</Link>
            <Link href="/privacy" className="hover:text-neutral-300 transition">Privacy Policy</Link>
            <Link href="/refund-policy" className="hover:text-neutral-300 transition">Refund Policy</Link>
          </div>
        </footer>
      </body>
    </html>
  );
}
