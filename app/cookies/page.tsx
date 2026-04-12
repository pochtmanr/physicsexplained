import { Metadata } from "next";
import Link from "next/link";
import { WIDE_CONTAINER } from "@/lib/layout";

export const metadata: Metadata = {
  title: "Cookie Policy — physics.explained",
  description: "How physics.explained uses cookies and localStorage.",
};

export default function CookiesPage() {
  return (
    <main className={WIDE_CONTAINER}>
      <article className="mx-auto max-w-[65ch] py-16">
        <header className="mb-12">
          <div className="mb-6 font-mono text-xs uppercase tracking-[0.2em] text-[var(--color-cyan)]">
            Legal
          </div>
          <h1 className="mb-6 font-display text-4xl font-bold uppercase tracking-tight text-[var(--color-fg-0)] md:text-5xl">
            Cookie Policy
          </h1>
          <p className="text-[var(--color-fg-2)]">
            Last updated: 12 April 2026
          </p>
        </header>

        <div className="space-y-8 text-[var(--color-fg-1)] leading-relaxed">
          <section>
            <h2 className="mb-3 font-display text-xl font-semibold uppercase tracking-tight text-[var(--color-fg-0)]">
              The short version
            </h2>
            <p>
              physics.explained does not set any cookies. We use
              browser localStorage for two things: remembering your theme
              preference and whether you have seen this consent notice. That is
              it.
            </p>
          </section>

          <section>
            <h2 className="mb-3 font-display text-xl font-semibold uppercase tracking-tight text-[var(--color-fg-0)]">
              localStorage items
            </h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[var(--color-fg-3)]/40 text-left">
                    <th className="pb-2 pr-6 font-mono text-xs uppercase tracking-[0.15em] text-[var(--color-fg-2)]">
                      Key
                    </th>
                    <th className="pb-2 pr-6 font-mono text-xs uppercase tracking-[0.15em] text-[var(--color-fg-2)]">
                      Purpose
                    </th>
                    <th className="pb-2 font-mono text-xs uppercase tracking-[0.15em] text-[var(--color-fg-2)]">
                      Values
                    </th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b border-[var(--color-fg-3)]/20">
                    <td className="py-3 pr-6">
                      <code className="font-mono text-sm text-[var(--color-cyan)]">
                        physics-theme
                      </code>
                    </td>
                    <td className="py-3 pr-6">
                      Remembers your dark/light theme choice
                    </td>
                    <td className="py-3">
                      <code className="font-mono text-sm">&quot;dark&quot;</code>{" "}
                      or{" "}
                      <code className="font-mono text-sm">&quot;light&quot;</code>
                    </td>
                  </tr>
                  <tr>
                    <td className="py-3 pr-6">
                      <code className="font-mono text-sm text-[var(--color-cyan)]">
                        physics-cookie-consent
                      </code>
                    </td>
                    <td className="py-3 pr-6">
                      Records that you have acknowledged this notice
                    </td>
                    <td className="py-3">
                      <code className="font-mono text-sm">&quot;accepted&quot;</code>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
            <p className="mt-4">
              These values never leave your browser. They are not sent to any
              server or third party.
            </p>
          </section>

          <section>
            <h2 className="mb-3 font-display text-xl font-semibold uppercase tracking-tight text-[var(--color-fg-0)]">
              Analytics
            </h2>
            <p>
              We use{" "}
              <strong className="text-[var(--color-fg-0)]">
                Vercel Analytics
              </strong>
              , which collects anonymous, aggregated page-view data. Vercel
              Analytics does <em>not</em> use cookies, does not store personal
              identifiers, and is privacy-friendly by design. No consent is
              required for this type of analytics under GDPR/PECR because no
              personal data is processed.
            </p>
          </section>

          <section>
            <h2 className="mb-3 font-display text-xl font-semibold uppercase tracking-tight text-[var(--color-fg-0)]">
              Third-party cookies
            </h2>
            <p>
              None. We do not embed advertising, social media widgets, or any
              third-party services that set cookies.
            </p>
          </section>

          <section>
            <h2 className="mb-3 font-display text-xl font-semibold uppercase tracking-tight text-[var(--color-fg-0)]">
              How to clear localStorage
            </h2>
            <p>
              You can remove these items at any time through your browser
              settings:
            </p>
            <ul className="mt-3 list-disc space-y-2 pl-6">
              <li>
                <strong className="text-[var(--color-fg-0)]">Chrome:</strong>{" "}
                Settings &rarr; Privacy and Security &rarr; Site Settings &rarr;
                View permissions and data stored across sites &rarr; find this
                site &rarr; Clear data
              </li>
              <li>
                <strong className="text-[var(--color-fg-0)]">Firefox:</strong>{" "}
                Settings &rarr; Privacy &amp; Security &rarr; Cookies and Site
                Data &rarr; Manage Data &rarr; find this site &rarr; Remove
              </li>
              <li>
                <strong className="text-[var(--color-fg-0)]">Safari:</strong>{" "}
                Settings &rarr; Privacy &rarr; Manage Website Data &rarr; find
                this site &rarr; Remove
              </li>
              <li>
                <strong className="text-[var(--color-fg-0)]">
                  Developer console:
                </strong>{" "}
                Open DevTools (F12), go to the Console tab, and run{" "}
                <code className="font-mono text-sm text-[var(--color-cyan)]">
                  localStorage.clear()
                </code>
              </li>
            </ul>
          </section>

          <div className="border-t border-[var(--color-fg-3)]/40 pt-8 font-mono text-xs text-[var(--color-fg-2)]">
            <Link href="/privacy">Privacy Policy</Link>
            {" · "}
            <Link href="/terms">Terms of Service</Link>
          </div>
        </div>
      </article>
    </main>
  );
}
