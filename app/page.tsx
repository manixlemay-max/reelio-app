import Link from "next/link";
import SiteHeader from "@/components/SiteHeader";
import PricingCards from "@/components/PricingCards";

export default function HomePage() {
  return (
    <>
    <SiteHeader />
    <main className="flex-1">
      <section className="relative mx-auto max-w-5xl px-6 pt-24 pb-16 text-center overflow-hidden">
        <div
          aria-hidden
          className="pointer-events-none absolute -top-24 left-1/2 -translate-x-1/2 w-[36rem] h-[36rem] rounded-full bg-blue-600/20 blur-[100px]"
        />
        <div className="relative">
          <p className="inline-flex items-center gap-2 text-sm font-medium text-blue-400 mb-6 rounded-full border border-blue-500/30 bg-blue-500/10 px-4 py-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />
            AI video, done for your e-commerce brand
          </p>
          <h1 className="text-4xl sm:text-6xl font-semibold tracking-tight mb-6">
            AI-generated UGC videos,
            <br />
            <span className="bg-gradient-to-r from-cyan-400 via-indigo-500 to-fuchsia-500 bg-clip-text text-transparent">
              posted and analyzed for you.
            </span>
          </h1>
          <p className="text-lg text-neutral-400 max-w-2xl mx-auto mb-10">
            Send us your products. Reelio generates the videos, posts them automatically
            to TikTok and Instagram at the best time, then tracks performance so
            you always know what's working — every week, hands-free.
          </p>
          <div className="flex items-center justify-center gap-4">
            <Link
              href="#pricing"
              className="rounded-full bg-blue-600 text-white px-6 py-3 font-medium hover:bg-blue-500 transition shadow-[0_0_30px_-8px_rgba(59,130,246,0.7)]"
            >
              Start your 7-day free trial
            </Link>
            <Link
              href="/dashboard"
              className="rounded-full border border-neutral-700 px-6 py-3 font-medium hover:border-neutral-500 transition"
            >
              Try the dashboard
            </Link>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-6 py-16 grid sm:grid-cols-3 gap-6">
        {[
          {
            title: "1. Generate",
            body: "Add a product, Reelio generates a UGC-style video ready to post using an AI provider.",
          },
          {
            title: "2. Post",
            body: "Automatic scheduling on TikTok and Instagram, with the right hashtags and optimal time.",
          },
          {
            title: "3. Analyze",
            body: "Views, engagement, and a shareable report you can send to your client — so everyone knows what's working.",
          },
        ].map((step) => (
          <div key={step.title} className="rounded-2xl border border-neutral-800 p-6">
            <h3 className="font-medium mb-2">{step.title}</h3>
            <p className="text-sm text-neutral-500">{step.body}</p>
          </div>
        ))}
      </section>

      <section id="pricing" className="mx-auto max-w-5xl px-6 py-16 scroll-mt-20">
        <h2 className="text-2xl font-semibold text-center mb-2">Pricing</h2>
        <p className="text-neutral-500 text-center mb-10">
          7-day free trial on every plan. Cancel anytime.
        </p>
        <PricingCards highlightTierId="growth" />
      </section>
    </main>
    </>
  );
}
