export const metadata = { title: "Terms of Service — Reelio" };

export default function TermsPage() {
  return (
    <main className="flex-1 mx-auto max-w-2xl px-6 py-16 text-sm text-neutral-400 leading-relaxed">
      <h1 className="text-2xl font-semibold text-neutral-100 mb-2">Terms of Service</h1>
      <p className="text-neutral-500 mb-8">Last updated: {new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}</p>

      <p className="mb-4">
        These Terms of Service ("Terms") govern your use of Reelio (the "Service"), operated
        by Reelio ("we", "us", "our"). By subscribing to or using the
        Service, you agree to these Terms.
      </p>

      <h2 className="text-lg font-medium text-neutral-100 mt-8 mb-2">1. The Service</h2>
      <p className="mb-4">
        Reelio is a done-for-you subscription service: we create AI-generated UGC-style
        product videos and publish them to your connected social media accounts (TikTok,
        Instagram, and/or YouTube, depending on your plan) on your behalf. You do not need
        to operate the software yourself — our team manages video creation, scheduling, and
        posting for you based on the product and account information you provide.
      </p>

      <h2 className="text-lg font-medium text-neutral-100 mt-8 mb-2">2. Subscriptions and billing</h2>
      <p className="mb-4">
        Plans are billed on a recurring monthly basis through our payment processor, Stripe.
        You may cancel your subscription at any time; access continues until the end of the
        current billing period. Prices and plan features are listed on our Pricing page and
        may change with notice.
      </p>

      <h2 className="text-lg font-medium text-neutral-100 mt-8 mb-2">3. Your responsibilities</h2>
      <p className="mb-4">
        You are responsible for providing accurate product information and for granting us
        access to the social media accounts you want us to post to. You confirm that you have
        the right to use any product images, descriptions, or brand assets you provide to us,
        and that your product and content comply with the terms of service of each platform
        we post to (TikTok, Instagram, YouTube).
      </p>

      <h2 className="text-lg font-medium text-neutral-100 mt-8 mb-2">4. Content and platform compliance</h2>
      <p className="mb-4">
        AI-generated videos are created using third-party video generation providers and
        published using third-party social media management tools. We label AI-made content
        where required by the platform. We are not responsible for actions taken by TikTok,
        Instagram, YouTube, or any other platform against your account (such as removals,
        restrictions, or bans), though we will make reasonable efforts to follow each
        platform's content policies.
      </p>

      <h2 className="text-lg font-medium text-neutral-100 mt-8 mb-2">5. No guarantee of results</h2>
      <p className="mb-4">
        While we aim to produce high-quality, engaging content and to post at optimal times,
        we do not guarantee any specific number of views, followers, sales, or other results.
      </p>

      <h2 className="text-lg font-medium text-neutral-100 mt-8 mb-2">6. Limitation of liability</h2>
      <p className="mb-4">
        To the maximum extent permitted by law, we are not liable for indirect, incidental,
        or consequential damages arising from your use of the Service. Our total liability
        for any claim is limited to the amount you paid us in the three months preceding the
        claim.
      </p>

      <h2 className="text-lg font-medium text-neutral-100 mt-8 mb-2">7. Changes to these Terms</h2>
      <p className="mb-4">
        We may update these Terms from time to time. Continued use of the Service after
        changes take effect means you accept the updated Terms.
      </p>

      <h2 className="text-lg font-medium text-neutral-100 mt-8 mb-2">8. Contact</h2>
      <p className="mb-4">
        Questions about these Terms? Contact us at firecandyyy@gmail.com.
      </p>
    </main>
  );
}
