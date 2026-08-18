import SiteHeader from "@/components/SiteHeader";
import PricingCards from "@/components/PricingCards";

export default function PricingPage() {
  return (
    <>
    <SiteHeader />
    <main className="flex-1 mx-auto max-w-5xl px-6 py-20 w-full">
      <h1 className="text-3xl font-semibold text-center mb-2">Choose your plan</h1>
      <p className="text-neutral-500 text-center mb-12">
        7-day free trial on every plan. Cancel anytime. The number of connected social
        networks depends on your plan.
      </p>
      <PricingCards highlightTierId="starter" />
    </main>
    </>
  );
}
