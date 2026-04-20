import { getTranslations, setRequestLocale } from "next-intl/server";
import { locales } from "@/i18n/config";
import Link from "next/link";
import { WIDE_CONTAINER } from "@/lib/layout";

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "legal.terms.meta" });
  return { title: t("title"), description: t("description") };
}

export default async function TermsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("legal");
  const tTerms = await getTranslations("legal.terms");
  const tFooter = await getTranslations("common.footer");

  return (
    <main className={WIDE_CONTAINER}>
      <article className="mx-auto max-w-[65ch] py-16">
        <header className="mb-12">
          <div className="mb-6 font-mono text-xs uppercase tracking-[0.2em] text-[var(--color-cyan-dim)]">
            {t("tag")}
          </div>
          <h1 className="mb-6 font-display text-4xl uppercase tracking-tight text-[var(--color-fg-0)] md:text-5xl">
            {tTerms("title")}
          </h1>
          <p className="text-[var(--color-fg-3)]">{t("lastUpdated")}</p>
        </header>

        <div className="space-y-8 text-[var(--color-fg-1)] leading-relaxed">
          <section>
            <h2 className="mb-3 font-display text-xl uppercase tracking-tight text-[var(--color-fg-0)]">
              {tTerms("aboutTheSite.title")}
            </h2>
            <p>{tTerms("aboutTheSite.body")}</p>
          </section>

          <section>
            <h2 className="mb-3 font-display text-xl uppercase tracking-tight text-[var(--color-fg-0)]">
              {tTerms("educationalPurpose.title")}
            </h2>
            <p>{tTerms("educationalPurpose.body")}</p>
          </section>

          <section>
            <h2 className="mb-3 font-display text-xl uppercase tracking-tight text-[var(--color-fg-0)]">
              {tTerms("contentAccuracy.title")}
            </h2>
            <p>{tTerms("contentAccuracy.body")}</p>
          </section>

          <section>
            <h2 className="mb-3 font-display text-xl uppercase tracking-tight text-[var(--color-fg-0)]">
              {tTerms("openSourceLicence.title")}
            </h2>
            <p>{tTerms("openSourceLicence.body")}</p>
          </section>

          <section>
            <h2 className="mb-3 font-display text-xl uppercase tracking-tight text-[var(--color-fg-0)]">
              {tTerms("acceptableUse.title")}
            </h2>
            <p>{tTerms("acceptableUse.body")}</p>
          </section>

          <section>
            <h2 className="mb-3 font-display text-xl uppercase tracking-tight text-[var(--color-fg-0)]">
              {tTerms("limitationOfLiability.title")}
            </h2>
            <p>{tTerms("limitationOfLiability.body")}</p>
          </section>

          <section>
            <h2 className="mb-3 font-display text-xl uppercase tracking-tight text-[var(--color-fg-0)]">
              {tTerms("governingLaw.title")}
            </h2>
            <p>{tTerms("governingLaw.body")}</p>
          </section>

          <section>
            <h2 className="mb-3 font-display text-xl uppercase tracking-tight text-[var(--color-fg-0)]">
              {tTerms("changes.title")}
            </h2>
            <p>{tTerms("changes.body")}</p>
          </section>

          <div className="border-t border-[var(--color-fg-4)]/40 pt-8 font-mono text-xs text-[var(--color-fg-3)]">
            <Link href="/privacy">{tFooter("privacyPolicy")}</Link>
            {" · "}
            <Link href="/cookies">{tFooter("cookiePolicy")}</Link>
          </div>
        </div>
      </article>
    </main>
  );
}
