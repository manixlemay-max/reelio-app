import Link from "next/link";
import { TIERS } from "@/lib/pricing";
import SiteHeader from "@/components/SiteHeader";

export default function HomePage() {
  return (
    <>
    <SiteHeader />
    <main className="flex-1">
      <section className="mx-auto max-w-5xl px-6 pt-24 pb-16 text-center">
        <p className="text-sm font-medium text-indigo-400 mb-4">
          For e-commerce brands
        </p>
        <h1 className="text-4xl sm:text-5xl font-semibold tracking-tight mb-6">
          AI-generated UGC videos,
          <br /> posted and analyzed for you.
        </h1>
        <p className="text-lg text-neutral-500 max-w-2xl mx-auto mb-10">
          Send us your products. Reelio generates the videos, posts them automatically
          to TikTok and Instagram at the best time, then tracks performance so
          you always know what's working — every week, hands-free.
        </p>
        <div className="flex items-center justify-center gap-4">
          <Link
            href="/dashboard"
            className="rounded-full bg-indigo-600 text-white px-6 py-3 font-medium hover:bg-indigo-500 transition"
          >
            Try the dashboard
          </Link>
          <Link
            href="/pricing"
            className="rounded-full border border-neutral-700 px-6 py-3 font-medium hover:border-neutral-500 transition"
          >
            See pricing
          </Link>
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

      <section className="mx-auto max-w-5xl px-6 py-16">
        <h2 className="text-2xl font-semibold text-center mb-10">Pricing</h2>
        <div className="grid sm:grid-cols-3 gap-6">
          {TIERS.map((tier) => (
            <div key={tier.id} className="rounded-2xl border border-neutral-800 p-6 flex flex-col">
              <h3 className="font-medium mb-1">{tier.name}</h3>
              <p className="text-3xl font-semibold mb-4">
                ${tier.priceUsd}<span className="text-sm text-neutral-500 font-normal">/mo</span>
              </p>
              <ul className="text-sm text-neutral-500 space-y-2 flex-1 mb-6">
                <li>{tier.networksAllowed} connected network(s)</li>
                <li>{tier.videosPerMonth} videos / month</li>
                <li>Performance analytics + shareable client report</li>
              </ul>
              <Link
                href="/pricing"
                className="rounded-full border border-neutral-700 px-4 py-2 text-center text-sm hover:border-indigo-400 transition"
              >
                Choose {tier.name}
              </Link>
            </div>
          ))}
        </div>
      </section>
    </main>
    </>
  );
}
