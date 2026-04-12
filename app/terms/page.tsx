import { Metadata } from "next";
import Link from "next/link";
import { WIDE_CONTAINER } from "@/lib/layout";

export const metadata: Metadata = {
  title: "Terms of Service — physics.explained",
  description: "Terms of use for physics.explained.",
};

export default function TermsPage() {
  return (
    <main className={WIDE_CONTAINER}>
      <article className="mx-auto max-w-[65ch] py-16">
        <header className="mb-12">
          <div className="mb-6 font-mono text-xs uppercase tracking-[0.2em] text-[var(--color-cyan)]">
            Legal
          </div>
          <h1 className="mb-6 font-display text-4xl font-bold uppercase tracking-tight text-[var(--color-fg-0)] md:text-5xl">
            Terms of Service
          </h1>
          <p className="text-[var(--color-fg-2)]">
            Last updated: 12 April 2026
          </p>
        </header>

        <div className="space-y-8 text-[var(--color-fg-1)] leading-relaxed">
          <section>
            <h2 className="mb-3 font-display text-xl font-semibold uppercase tracking-tight text-[var(--color-fg-0)]">
              About the site
            </h2>
            <p>
              physics.explained is an educational website operated by Simnetiq
              Ltd, a company registered in the United Kingdom. The site provides
              visual physics explainers, interactive simulations, and
              educational content.
            </p>
          </section>

          <section>
            <h2 className="mb-3 font-display text-xl font-semibold uppercase tracking-tight text-[var(--color-fg-0)]">
              Educational purpose
            </h2>
            <p>
              All content on this site is provided for educational purposes
              only. The physics simulations, visualisations, and explanations are
              designed to help you understand concepts — they are approximations
              and teaching aids, not professional engineering or scientific
              tools. Do not rely on them for safety-critical calculations or
              professional work.
            </p>
          </section>

          <section>
            <h2 className="mb-3 font-display text-xl font-semibold uppercase tracking-tight text-[var(--color-fg-0)]">
              Content accuracy
            </h2>
            <p>
              We strive for accuracy in all explanations and simulations.
              However, all content is provided &ldquo;as is&rdquo; without
              warranty of any kind, express or implied. Simnetiq Ltd is not
              liable for any errors, omissions, or inaccuracies in the content,
              nor for any decisions made based on the information presented.
            </p>
          </section>

          <section>
            <h2 className="mb-3 font-display text-xl font-semibold uppercase tracking-tight text-[var(--color-fg-0)]">
              Open-source licence
            </h2>
            <p>
              The source code of physics.explained is released under the{" "}
              <strong className="text-[var(--color-fg-0)]">MIT Licence</strong>.
              You are free to use, copy, modify, and distribute the code in
              accordance with the licence terms. The educational content
              (text, diagrams, and explanations) remains the intellectual
              property of Simnetiq Ltd unless otherwise stated.
            </p>
          </section>

          <section>
            <h2 className="mb-3 font-display text-xl font-semibold uppercase tracking-tight text-[var(--color-fg-0)]">
              Acceptable use
            </h2>
            <p>
              You agree not to misuse the site or its services. This includes
              attempting to interfere with the site&apos;s operation, submitting
              abusive content through contact forms, or using automated systems
              to scrape content at scale.
            </p>
          </section>

          <section>
            <h2 className="mb-3 font-display text-xl font-semibold uppercase tracking-tight text-[var(--color-fg-0)]">
              Limitation of liability
            </h2>
            <p>
              To the fullest extent permitted by law, Simnetiq Ltd shall not be
              liable for any indirect, incidental, special, or consequential
              damages arising from your use of this site.
            </p>
          </section>

          <section>
            <h2 className="mb-3 font-display text-xl font-semibold uppercase tracking-tight text-[var(--color-fg-0)]">
              Governing law
            </h2>
            <p>
              These terms are governed by the laws of England and Wales. Any
              disputes shall be subject to the exclusive jurisdiction of the
              courts of England and Wales.
            </p>
          </section>

          <section>
            <h2 className="mb-3 font-display text-xl font-semibold uppercase tracking-tight text-[var(--color-fg-0)]">
              Changes to these terms
            </h2>
            <p>
              We may update these terms from time to time. Changes will be
              posted on this page with an updated date. Continued use of the
              site constitutes acceptance of the revised terms.
            </p>
          </section>

          <div className="border-t border-[var(--color-fg-3)]/40 pt-8 font-mono text-xs text-[var(--color-fg-2)]">
            <Link href="/privacy">Privacy Policy</Link>
            {" · "}
            <Link href="/cookies">Cookie Policy</Link>
          </div>
        </div>
      </article>
    </main>
  );
}
