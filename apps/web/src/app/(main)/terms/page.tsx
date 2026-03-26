export const metadata = {
  title: "Terms of Service — Tomato",
  description: "Terms and conditions for using Tomato Food Delivery.",
};

const LAST_UPDATED = "26 March 2026";

export default function TermsOfServicePage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-16">
      <h1 className="mb-8 text-3xl font-bold">Terms of Service</h1>
      <p className="mb-6 text-sm text-muted-foreground">
        Last updated: {LAST_UPDATED}
      </p>

      <div className="prose prose-sm max-w-none dark:prose-invert">
        <section className="mb-8">
          <h2 className="mb-3 text-xl font-semibold">1. Acceptance of Terms</h2>
          <p className="text-muted-foreground">
            By accessing or using Tomato Food Delivery (&quot;the Service&quot;), you agree
            to be bound by these Terms of Service. If you do not agree to these terms,
            please do not use the Service.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="mb-3 text-xl font-semibold">2. Account Registration</h2>
          <ul className="list-disc space-y-1 pl-6 text-muted-foreground">
            <li>You must provide accurate and complete information when creating an account</li>
            <li>You are responsible for maintaining the security of your account credentials</li>
            <li>You must be at least 18 years old to create an account</li>
            <li>One person may not maintain more than one account</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="mb-3 text-xl font-semibold">3. Orders and Payments</h2>
          <ul className="list-disc space-y-1 pl-6 text-muted-foreground">
            <li>All prices are displayed in Australian Dollars (AUD) and include GST where applicable</li>
            <li>A delivery fee of $2.00 applies to all orders</li>
            <li>Payment is processed securely through Stripe at the time of order</li>
            <li>We reserve the right to refuse or cancel any order at our discretion</li>
            <li>Menu items and prices are subject to change without notice</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="mb-3 text-xl font-semibold">4. Cancellations and Refunds</h2>
          <p className="mb-3 text-muted-foreground">
            Orders can be cancelled under the following conditions:
          </p>
          <ul className="list-disc space-y-1 pl-6 text-muted-foreground">
            <li>Orders with &quot;Payment Pending&quot; status can be cancelled at any time</li>
            <li>Orders with &quot;Food Processing&quot; status can be cancelled with a full refund</li>
            <li>Orders that are &quot;Out for Delivery&quot; or &quot;Delivered&quot; cannot be cancelled</li>
            <li>Refunds are processed to the original payment method within 5-10 business days</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="mb-3 text-xl font-semibold">5. Delivery</h2>
          <ul className="list-disc space-y-1 pl-6 text-muted-foreground">
            <li>Delivery times are estimates and may vary based on demand and conditions</li>
            <li>You must provide a valid delivery address within our service area</li>
            <li>Someone must be available at the delivery address to receive the order</li>
            <li>We are not responsible for delays caused by incorrect address information</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="mb-3 text-xl font-semibold">6. User Conduct</h2>
          <p className="mb-3 text-muted-foreground">You agree not to:</p>
          <ul className="list-disc space-y-1 pl-6 text-muted-foreground">
            <li>Use the Service for any unlawful purpose</li>
            <li>Attempt to gain unauthorized access to our systems</li>
            <li>Interfere with the proper functioning of the Service</li>
            <li>Submit false or misleading information</li>
            <li>Use automated tools to access the Service without permission</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="mb-3 text-xl font-semibold">7. Intellectual Property</h2>
          <p className="text-muted-foreground">
            All content, trademarks, and intellectual property on the Service are owned
            by Tomato Food Delivery or its licensors. You may not reproduce, distribute,
            or create derivative works without our written permission.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="mb-3 text-xl font-semibold">8. Limitation of Liability</h2>
          <p className="text-muted-foreground">
            To the maximum extent permitted by Australian Consumer Law, Tomato Food
            Delivery shall not be liable for any indirect, incidental, special, or
            consequential damages arising from your use of the Service. Our total
            liability shall not exceed the amount paid by you for the order in question.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="mb-3 text-xl font-semibold">9. Governing Law</h2>
          <p className="text-muted-foreground">
            These Terms are governed by the laws of the State of New South Wales,
            Australia. Any disputes shall be subject to the exclusive jurisdiction
            of the courts of New South Wales.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="mb-3 text-xl font-semibold">10. Changes to Terms</h2>
          <p className="text-muted-foreground">
            We reserve the right to modify these Terms at any time. Material changes
            will be communicated via email or a notice on the Service. Continued use
            after changes constitutes acceptance of the updated Terms.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="mb-3 text-xl font-semibold">11. Contact</h2>
          <p className="text-muted-foreground">
            For questions about these Terms, please contact us at{" "}
            <a href="mailto:legal@tomato.com" className="text-primary underline">
              legal@tomato.com
            </a>
          </p>
        </section>
      </div>
    </div>
  );
}
