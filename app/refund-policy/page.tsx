export const metadata = { title: "Refund Policy — Reelio" };

export default function RefundPolicyPage() {
  return (
    <main className="flex-1 mx-auto max-w-2xl px-6 py-16 text-sm text-neutral-300 leading-relaxed">
      <h1 className="text-2xl font-semibold text-neutral-100 mb-2">Refund Policy</h1>
      <p className="text-neutral-500 mb-8">Last updated: {new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}</p>

      <p className="mb-4">
        Reelio subscriptions are billed monthly in advance. Because each subscription includes
        work already performed on your behalf (video generation and posting), payments are
        generally non-refundable once a billing cycle has started.
      </p>

      <h2 className="text-lg font-medium text-neutral-100 mt-8 mb-2">Cancellations</h2>
      <p className="mb-4">
        You can cancel your subscription at any time. Your access and included services
        continue until the end of the current billing period, and you will not be charged
        again after cancellation.
      </p>

      <h2 className="text-lg font-medium text-neutral-100 mt-8 mb-2">Exceptions</h2>
      <p className="mb-4">
        If we are unable to deliver the service you paid for (for example, due to a technical
        issue on our end that prevents any videos from being created or posted during your
        billing period), contact us and we will review your case for a partial or full refund
        at our discretion.
      </p>

      <h2 className="text-lg font-medium text-neutral-100 mt-8 mb-2">Contact</h2>
      <p className="mb-4">
        To request a refund review or cancel your subscription, contact us at
        firecandyyy@gmail.com.
      </p>
    </main>
  );
}
