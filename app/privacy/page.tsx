export const metadata = { title: "Privacy Policy — Reelio" };

export default function PrivacyPage() {
  return (
    <main className="flex-1 mx-auto max-w-2xl px-6 py-16 text-sm text-neutral-300 leading-relaxed">
      <h1 className="text-2xl font-semibold text-neutral-100 mb-2">Privacy Policy</h1>
      <p className="text-neutral-500 mb-8">Last updated: {new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}</p>

      <p className="mb-4">
        This Privacy Policy explains what information Reelio ("we", "us") collects when you
        subscribe to and use our service, and how we use it.
      </p>

      <h2 className="text-lg font-medium text-neutral-100 mt-8 mb-2">1. Information we collect</h2>
      <p className="mb-4">
        When you subscribe, we collect payment information (processed securely by Stripe — we
        never see or store your full card details) and, after checkout, the information you
        submit in our welcome form: your name, email, business name, product details, and
        social media handles.
      </p>

      <h2 className="text-lg font-medium text-neutral-100 mt-8 mb-2">2. How we use your information</h2>
      <p className="mb-4">
        We use this information to create your product videos, publish them to the social
        media accounts you connect or authorize, communicate with you about your account, and
        provide performance analytics.
      </p>

      <h2 className="text-lg font-medium text-neutral-100 mt-8 mb-2">3. Third-party services</h2>
      <p className="mb-4">
        We rely on trusted third-party providers to operate the Service: Stripe (payments),
        an AI video generation provider, and a social media publishing provider. These
        providers process data on our behalf and are bound by their own privacy and security
        practices.
      </p>

      <h2 className="text-lg font-medium text-neutral-100 mt-8 mb-2">4. Data retention</h2>
      <p className="mb-4">
        We retain your account and content information for as long as you're subscribed, and
        for a reasonable period afterward for record-keeping, unless you ask us to delete it
        sooner.
      </p>

      <h2 className="text-lg font-medium text-neutral-100 mt-8 mb-2">5. Your rights</h2>
      <p className="mb-4">
        You can request access to, correction of, or deletion of your personal information at
        any time by contacting us.
      </p>

      <h2 className="text-lg font-medium text-neutral-100 mt-8 mb-2">6. Contact</h2>
      <p className="mb-4">
        Questions about this policy? Contact us at [your contact email].
      </p>
    </main>
  );
}
