import Link from "next/link";
import { ClipboardList, Sparkles, CalendarClock, TrendingUp } from "lucide-react";
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
              href="#how-it-works"
              className="rounded-full border border-neutral-700 px-6 py-3 font-medium hover:border-neutral-500 transition"
            >
              See how it works
            </Link>
          </div>
        </div>
      </section>

      <section id="how-it-works" className="mx-auto max-w-5xl px-6 py-20 scroll-mt-20">
        <div className="text-center mb-14">
          <h2 className="text-2xl sm:text-3xl font-semibold mb-3">How Reelio works</h2>
          <p className="text-neutral-500 max-w-xl mx-auto">
            One short form, and Reelio takes it from there — content, posting, and strategy,
            fully automated and backed by real performance data.
          </p>
        </div>
        <div className="grid sm:grid-cols-2 gap-6">
          {[
            {
              icon: ClipboardList,
              title: "Tell us about your product",
              body: "A single 2-minute form is the only thing you'll ever have to do. No filming, no scripts, no editing software — Reelio takes it from there.",
            },
            {
              icon: Sparkles,
              title: "AI creates scroll-stopping UGC videos",
              body: "Your own AI-generated creator delivers an authentic, on-brand video for your product — the kind of native, trust-building content that outperforms polished ads, without hiring a single actor or crew.",
            },
            {
              icon: CalendarClock,
              title: "Posted automatically at the best time",
              body: "Every video is published straight to your TikTok, Instagram, and YouTube — timed using real engagement data from your own audience, not guesswork, so it lands when people are actually watching.",
            },
            {
              icon: TrendingUp,
              title: "Results tracked, strategy refined",
              body: "Views, likes, and comments are tracked automatically. Reelio uses what's working to guide what gets made and posted next, so your results compound month after month — hands-free.",
            },
          ].map((step) => {
            const Icon = step.icon;
            return (
              <div key={step.title} className="rounded-2xl border border-neutral-800 p-6">
                <span className="inline-flex items-center justify-center w-9 h-9 rounded-lg bg-blue-500/10 text-blue-400 mb-4">
                  <Icon size={18} strokeWidth={2} />
                </span>
                <h3 className="font-medium mb-2">{step.title}</h3>
                <p className="text-sm text-neutral-500 leading-relaxed">{step.body}</p>
              </div>
            );
          })}
        </div>
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
