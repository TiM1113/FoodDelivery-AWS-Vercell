export const metadata = {
  title: "Privacy Policy — Tomato",
  description: "How Tomato Food Delivery collects, uses, and protects your personal information.",
};

export default function PrivacyPolicyPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-16">
      <h1 className="mb-8 text-3xl font-bold">Privacy Policy</h1>
      <p className="mb-6 text-sm text-muted-foreground">
        Last updated: {new Date().toLocaleDateString("en-AU", { year: "numeric", month: "long", day: "numeric" })}
      </p>

      <div className="prose prose-sm max-w-none dark:prose-invert">
        <section className="mb-8">
          <h2 className="mb-3 text-xl font-semibold">1. Information We Collect</h2>
          <p className="mb-3 text-muted-foreground">
            When you use Tomato Food Delivery, we collect information you provide directly:
          </p>
          <ul className="mb-3 list-disc space-y-1 pl-6 text-muted-foreground">
            <li>Account information (name, email address, password)</li>
            <li>Delivery addresses and contact details</li>
            <li>Order history and preferences</li>
            <li>Payment information (processed securely through Stripe)</li>
          </ul>
          <p className="text-muted-foreground">
            We also automatically collect usage data such as IP address, browser type,
            device information, and pages visited.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="mb-3 text-xl font-semibold">2. How We Use Your Information</h2>
          <ul className="list-disc space-y-1 pl-6 text-muted-foreground">
            <li>Process and deliver your food orders</li>
            <li>Communicate order updates and delivery status</li>
            <li>Improve our services and user experience</li>
            <li>Prevent fraud and ensure platform security</li>
            <li>Comply with legal obligations</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="mb-3 text-xl font-semibold">3. Payment Security</h2>
          <p className="text-muted-foreground">
            All payment processing is handled by Stripe, a PCI DSS Level 1 certified
            payment processor. We never store your full credit card details on our
            servers. Stripe&apos;s privacy policy governs how they handle your payment
            information.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="mb-3 text-xl font-semibold">4. Data Sharing</h2>
          <p className="mb-3 text-muted-foreground">
            We do not sell your personal information. We share data only with:
          </p>
          <ul className="list-disc space-y-1 pl-6 text-muted-foreground">
            <li>Payment processors (Stripe) to complete transactions</li>
            <li>Cloud service providers (AWS, Vercel) for hosting and storage</li>
            <li>Analytics services to improve our platform</li>
            <li>Law enforcement when required by law</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="mb-3 text-xl font-semibold">5. Data Retention</h2>
          <p className="text-muted-foreground">
            We retain your account information for as long as your account is active.
            Order history is retained for 3 years for legal and business purposes.
            You may request deletion of your account and associated data at any time
            by contacting us.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="mb-3 text-xl font-semibold">6. Your Rights</h2>
          <p className="mb-3 text-muted-foreground">
            Under the Australian Privacy Act 1988, you have the right to:
          </p>
          <ul className="list-disc space-y-1 pl-6 text-muted-foreground">
            <li>Access your personal information</li>
            <li>Request correction of inaccurate data</li>
            <li>Request deletion of your data</li>
            <li>Opt out of marketing communications</li>
            <li>Lodge a complaint with the OAIC</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="mb-3 text-xl font-semibold">7. Cookies</h2>
          <p className="text-muted-foreground">
            We use essential cookies for authentication and session management.
            We do not use tracking cookies for advertising purposes.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="mb-3 text-xl font-semibold">8. Contact Us</h2>
          <p className="text-muted-foreground">
            For privacy-related inquiries, please contact us at{" "}
            <a href="mailto:privacy@tomato.com" className="text-primary underline">
              privacy@tomato.com
            </a>
          </p>
        </section>
      </div>
    </div>
  );
}
