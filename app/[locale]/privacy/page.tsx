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
  const t = await getTranslations({ locale, namespace: "legal.privacy.meta" });
  return { title: t("title"), description: t("description") };
}

export default async function PrivacyPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("legal");
  const tPrivacy = await getTranslations("legal.privacy");
  const tFooter = await getTranslations("common.footer");

  return (
    <main className={WIDE_CONTAINER}>
      <article className="mx-auto max-w-[65ch] py-16">
        <header className="mb-12">
          <div className="mb-6 font-mono text-xs uppercase tracking-[0.2em] text-[var(--color-cyan-dim)]">
            {t("tag")}
          </div>
          <h1 className="mb-6 font-display text-4xl uppercase tracking-tight text-[var(--color-fg-0)] md:text-5xl">
            {tPrivacy("title")}
          </h1>
          <p className="text-[var(--color-fg-3)]">{t("lastUpdated")}</p>
        </header>

        <div className="space-y-8 text-[var(--color-fg-1)] leading-relaxed">
          <section>
            <h2 className="mb-3 font-display text-xl uppercase tracking-tight text-[var(--color-fg-0)]">
              {tPrivacy("whoWeAre.title")}
            </h2>
            <p>{tPrivacy("whoWeAre.body")}</p>
          </section>

          <section>
            <h2 className="mb-3 font-display text-xl uppercase tracking-tight text-[var(--color-fg-0)]">
              {tPrivacy("whatWeCollect.title")}
            </h2>
            <ul className="list-disc space-y-2 ps-6">
              <li>{tPrivacy("whatWeCollect.themePreference")}</li>
              <li>{tPrivacy("whatWeCollect.analytics")}</li>
              <li>{tPrivacy("whatWeCollect.contactForm")}</li>
              <li>{tPrivacy("whatWeCollect.newsletter")}</li>
            </ul>
          </section>

          <section>
            <h2 className="mb-3 font-display text-xl uppercase tracking-tight text-[var(--color-fg-0)]">
              {tPrivacy("whatWeDoNotCollect.title")}
            </h2>
            <p>{tPrivacy("whatWeDoNotCollect.body")}</p>
          </section>

          <section>
            <h2 className="mb-3 font-display text-xl uppercase tracking-tight text-[var(--color-fg-0)]">
              {tPrivacy("dataStorage.title")}
            </h2>
            <p>{tPrivacy("dataStorage.body")}</p>
          </section>

          <section>
            <h2 className="mb-3 font-display text-xl uppercase tracking-tight text-[var(--color-fg-0)]">
              {tPrivacy("yourRights.title")}
            </h2>
            <p>{tPrivacy("yourRights.body")}</p>
            <p className="mt-2">{tPrivacy("yourRights.contact")}</p>
          </section>

          <section>
            <h2 className="mb-3 font-display text-xl uppercase tracking-tight text-[var(--color-fg-0)]">
              {tPrivacy("changes.title")}
            </h2>
            <p>{tPrivacy("changes.body")}</p>
          </section>

          <div className="border-t border-[var(--color-fg-4)]/40 pt-8 font-mono text-xs text-[var(--color-fg-3)]">
            <Link href="/terms">{tFooter("termsOfService")}</Link>
            {" · "}
            <Link href="/cookies">{tFooter("cookiePolicy")}</Link>
          </div>
        </div>
      </article>
    </main>
  );
}
