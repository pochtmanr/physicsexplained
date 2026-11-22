import type { Metadata } from "next";
import { setRequestLocale } from "next-intl/server";
import { locales, defaultLocale } from "@/i18n/config";
import { SITE } from "@/lib/seo/config";
import { buildPageMetadata } from "@/lib/seo/page-metadata";
import { buildAboutPageJsonLd } from "@/lib/seo/jsonld";
import { JsonLd } from "@/components/seo/jsonld";
import { ContactForm } from "@/components/forms/contact-form";

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

// The About page is written in English only, so other locales canonicalise here.
export const metadata: Metadata = buildPageMetadata({
  path: "/about",
  locale: defaultLocale,
  title: "About",
  description:
    "Physics.explained is a visual-first reader's guide to physics with live, accurate simulations, made by Simnetiq Ltd, an independent software studio.",
  realLocales: [defaultLocale],
});

export default async function AboutPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <main className="mx-auto max-w-[720px] px-6 pb-32">
      <JsonLd data={buildAboutPageJsonLd(SITE.buildUrl("/about"))} />
      <header className="mt-16 mb-24">
        <div className="mb-6 font-mono text-xs uppercase tracking-[0.2em] text-[var(--color-cyan-dim)]">
          § 00 · ABOUT
        </div>
        <h1 className="mb-6 text-4xl uppercase tracking-tight text-[var(--color-fg-0)] break-words md:text-6xl">
          WHO WE ARE
        </h1>
        <p className="max-w-[44ch] text-xl italic text-[var(--color-fg-1)]">
          A small studio building a visual, honest reader's guide to physics.
        </p>
      </header>

      <section className="mb-24">
        <div className="mb-4 flex flex-wrap items-baseline gap-x-3 gap-y-1">
          <span className="text-2xl tracking-tight text-[var(--color-cyan)] tabular-nums md:text-3xl">
            §&#8239;01
          </span>
          <h2 className="text-2xl text-[var(--color-fg-0)] md:text-3xl">
            The idea
          </h2>
        </div>
        <div className="prose prose-invert max-w-none text-[var(--color-fg-0)]">
          <p>
            Most physics writing either drowns you in equations or waves its
            hands until the math disappears. Neither works. We wanted a third
            option — explanations where the pictures do the heavy lifting, the
            equations show up only where they earn their keep, and every
            animation is physically accurate.
          </p>
          <p>
            Every scene on this site is a real simulation. Not a video, not a
            loop — the pendulums actually swing under{" "}
            <span className="font-mono">θ″ = −(g/L)·sin θ</span>, the orbits
            actually obey Kepler's laws. If you can see it, you can trust it.
          </p>
        </div>
      </section>

      <section className="mb-24">
        <div className="mb-4 flex flex-wrap items-baseline gap-x-3 gap-y-1">
          <span className="text-2xl font-semibold tracking-tight text-[var(--color-cyan)] tabular-nums md:text-3xl">
            §&#8239;02
          </span>
          <h2 className="text-2xl text-[var(--color-fg-0)] md:text-3xl">
            The studio
          </h2>
        </div>
        <div className="prose prose-invert max-w-none text-[var(--color-fg-0)]">
          <p>
            Physics.explained is made by{" "}
            <a
              href={`${SITE.company.url}/`}
              target="_blank"
              rel="noopener"
            >
              {SITE.company.name}
            </a>
            , a small independent studio working on tools and writing at the
            edge of science, design, and code.
          </p>
          <p>
            The project is open source under MIT. No tracking, no ads, no
            paywall. If you want to fund more branches, corrections, or
            translations — say hi below.
          </p>
        </div>
      </section>

      <section className="mb-24">
        <div className="mb-4 flex flex-wrap items-baseline gap-x-3 gap-y-1">
          <span className="text-2xl font-semibold tracking-tight text-[var(--color-cyan)] tabular-nums md:text-3xl">
            §&#8239;03
          </span>
          <h2 className="text-2xl text-[var(--color-fg-0)] md:text-3xl">
            Contact
          </h2>
        </div>
        <p className="mb-8 text-[var(--color-fg-1)]">
          Spotted an error? Have a branch you'd like to see next? Want to
          collaborate? Drop us a line.
        </p>
        <ContactForm />
        <div className="mt-10 grid gap-6 sm:grid-cols-2">
          <div>
            <div className="font-mono text-xs uppercase tracking-[0.2em] text-[var(--color-fg-3)]">
              DIRECT
            </div>
            <a
              href={`mailto:${SITE.company.email}`}
              className="mt-2 block font-mono text-sm text-[var(--color-fg-1)] hover:text-[var(--color-cyan)]"
            >
              {SITE.company.email}
            </a>
          </div>
          <div>
            <div className="font-mono text-xs uppercase tracking-[0.2em] text-[var(--color-fg-3)]">
              ELSEWHERE
            </div>
            <a
              href="https://x.com/simnetiq"
              target="_blank"
              rel="noopener"
              className="mt-2 block font-mono text-sm text-[var(--color-fg-1)] hover:text-[var(--color-cyan)]"
            >
              @simnetiq on X
            </a>
          </div>
        </div>
      </section>
    </main>
  );
}
