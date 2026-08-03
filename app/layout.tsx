import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Reelio — AI UGC videos for e-commerce",
  description:
    "The subscription that generates, posts, and analyzes your AI UGC videos on TikTok and Instagram automatically.",
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
      </body>
    </html>
  );
}
