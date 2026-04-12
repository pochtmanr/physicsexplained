import { Metadata } from "next";
import Link from "next/link";
import { WIDE_CONTAINER } from "@/lib/layout";

export const metadata: Metadata = {
  title: "Privacy Policy — physics.explained",
  description: "How physics.explained handles your data.",
};

export default function PrivacyPage() {
  return (
    <main className={WIDE_CONTAINER}>
      <article className="mx-auto max-w-[65ch] py-16">
        <header className="mb-12">
          <div className="mb-6 font-mono text-xs uppercase tracking-[0.2em] text-[var(--color-cyan)]">
            Legal
          </div>
          <h1 className="mb-6 font-display text-4xl font-bold uppercase tracking-tight text-[var(--color-fg-0)] md:text-5xl">
            Privacy Policy
          </h1>
          <p className="text-[var(--color-fg-2)]">
            Last updated: 12 April 2026
          </p>
        </header>

        <div className="space-y-8 text-[var(--color-fg-1)] leading-relaxed">
          <section>
            <h2 className="mb-3 font-display text-xl font-semibold uppercase tracking-tight text-[var(--color-fg-0)]">
              Who we are
            </h2>
            <p>
              physics.explained is operated by Simnetiq Ltd, a company
              registered in the United Kingdom. This policy explains what data
              we collect, how we use it, and your rights under the UK GDPR and
              EU GDPR.
            </p>
          </section>

          <section>
            <h2 className="mb-3 font-display text-xl font-semibold uppercase tracking-tight text-[var(--color-fg-0)]">
              What we collect
            </h2>
            <ul className="list-disc space-y-2 pl-6">
              <li>
                <strong className="text-[var(--color-fg-0)]">
                  Theme preference
                </strong>{" "}
                — stored in your browser&apos;s localStorage as{" "}
                <code className="font-mono text-sm text-[var(--color-cyan)]">
                  physics-theme
                </code>
                . Never sent to any server.
              </li>
              <li>
                <strong className="text-[var(--color-fg-0)]">
                  Anonymous page-view analytics
                </strong>{" "}
                — provided by Vercel Analytics. This service collects anonymous,
                aggregated page-view data. It does not use cookies, does not
                track individuals, and is GDPR-compliant by design.
              </li>
              <li>
                <strong className="text-[var(--color-fg-0)]">
                  Contact form submissions
                </strong>{" "}
                — if you use the contact form, your name, email address, and
                message are stored in our Supabase database so we can respond to
                your inquiry.
              </li>
              <li>
                <strong className="text-[var(--color-fg-0)]">
                  Newsletter subscriptions
                </strong>{" "}
                — if you sign up for our newsletter, your email address is
                stored in our Supabase database to send you updates about new
                content.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="mb-3 font-display text-xl font-semibold uppercase tracking-tight text-[var(--color-fg-0)]">
              What we do not collect
            </h2>
            <p>
              We do not use advertising networks, third-party trackers, social
              media widgets, fingerprinting, or any form of cross-site tracking.
              We do not sell, rent, or share your data with third parties.
            </p>
          </section>

          <section>
            <h2 className="mb-3 font-display text-xl font-semibold uppercase tracking-tight text-[var(--color-fg-0)]">
              Data storage
            </h2>
            <p>
              Contact form submissions and newsletter email addresses are stored
              in Supabase (hosted in the EU). Data is retained until you request
              its deletion.
            </p>
          </section>

          <section>
            <h2 className="mb-3 font-display text-xl font-semibold uppercase tracking-tight text-[var(--color-fg-0)]">
              Your rights
            </h2>
            <p>
              Under the UK GDPR and EU GDPR, you have the right to access,
              correct, or delete any personal data we hold about you. You may
              also withdraw consent for newsletter emails at any time.
            </p>
            <p className="mt-2">
              To exercise any of these rights, contact us via the{" "}
              <Link href="/about">About &amp; Contact</Link> page.
            </p>
          </section>

          <section>
            <h2 className="mb-3 font-display text-xl font-semibold uppercase tracking-tight text-[var(--color-fg-0)]">
              Changes to this policy
            </h2>
            <p>
              We may update this policy from time to time. Changes will be
              posted on this page with an updated date.
            </p>
          </section>

          <div className="border-t border-[var(--color-fg-3)]/40 pt-8 font-mono text-xs text-[var(--color-fg-2)]">
            <Link href="/terms">Terms of Service</Link>
            {" · "}
            <Link href="/cookies">Cookie Policy</Link>
          </div>
        </div>
      </article>
    </main>
  );
}
