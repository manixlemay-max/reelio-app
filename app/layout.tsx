import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Reelio — Vidéos UGC IA pour e-commerce",
  description:
    "Abonnement qui génère, publie et analyse automatiquement vos vidéos UGC par IA sur TikTok et Instagram.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" className="h-full antialiased">
      <body className="min-h-full flex flex-col bg-neutral-950 text-neutral-100 font-sans">
        {children}
      </body>
    </html>
  );
}
