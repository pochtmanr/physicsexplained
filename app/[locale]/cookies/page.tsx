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
  const t = await getTranslations({ locale, namespace: "legal.cookies.meta" });
  return { title: t("title"), description: t("description") };
}

export default async function CookiesPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("legal");
  const tCookies = await getTranslations("legal.cookies");
  const tItems = await getTranslations("legal.cookies.localStorageItems");
  const tFooter = await getTranslations("common.footer");

  return (
    <main className={WIDE_CONTAINER}>
      <article className="mx-auto max-w-[65ch] py-16">
        <header className="mb-12">
          <div className="mb-6 font-mono text-xs uppercase tracking-[0.2em] text-[var(--color-cyan-dim)]">
            {t("tag")}
          </div>
          <h1 className="mb-6 font-display text-4xl uppercase tracking-tight text-[var(--color-fg-0)] md:text-5xl">
            {tCookies("title")}
          </h1>
          <p className="text-[var(--color-fg-3)]">{t("lastUpdated")}</p>
        </header>

        <div className="space-y-8 text-[var(--color-fg-1)] leading-relaxed">
          <section>
            <h2 className="mb-3 font-display text-xl uppercase tracking-tight text-[var(--color-fg-0)]">
              {tCookies("shortVersion.title")}
            </h2>
            <p>{tCookies("shortVersion.body")}</p>
          </section>

          <section>
            <h2 className="mb-3 font-display text-xl uppercase tracking-tight text-[var(--color-fg-0)]">
              {tItems("title")}
            </h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[var(--color-fg-4)]/40 text-start">
                    <th className="pb-2 pe-6 font-mono text-xs uppercase tracking-[0.15em] text-[var(--color-fg-3)]">
                      {tItems("tableHeaders.key")}
                    </th>
                    <th className="pb-2 pe-6 font-mono text-xs uppercase tracking-[0.15em] text-[var(--color-fg-3)]">
                      {tItems("tableHeaders.purpose")}
                    </th>
                    <th className="pb-2 font-mono text-xs uppercase tracking-[0.15em] text-[var(--color-fg-3)]">
                      {tItems("tableHeaders.values")}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b border-[var(--color-fg-4)]/20">
                    <td className="py-3 pe-6">
                      <code className="font-mono text-sm text-[var(--color-cyan)]">
                        {tItems("physicsTheme.key")}
                      </code>
                    </td>
                    <td className="py-3 pe-6">
                      {tItems("physicsTheme.purpose")}
                    </td>
                    <td className="py-3">
                      <code className="font-mono text-sm">
                        {tItems("physicsTheme.values")}
                      </code>
                    </td>
                  </tr>
                  <tr>
                    <td className="py-3 pe-6">
                      <code className="font-mono text-sm text-[var(--color-cyan)]">
                        {tItems("cookieConsent.key")}
                      </code>
                    </td>
                    <td className="py-3 pe-6">
                      {tItems("cookieConsent.purpose")}
                    </td>
                    <td className="py-3">
                      <code className="font-mono text-sm">
                        {tItems("cookieConsent.values")}
                      </code>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
            <p className="mt-4">{tItems("note")}</p>
          </section>

          <section>
            <h2 className="mb-3 font-display text-xl uppercase tracking-tight text-[var(--color-fg-0)]">
              {tCookies("analytics.title")}
            </h2>
            <p>{tCookies("analytics.body")}</p>
          </section>

          <section>
            <h2 className="mb-3 font-display text-xl uppercase tracking-tight text-[var(--color-fg-0)]">
              {tCookies("thirdPartyCookies.title")}
            </h2>
            <p>{tCookies("thirdPartyCookies.body")}</p>
          </section>

          <section>
            <h2 className="mb-3 font-display text-xl uppercase tracking-tight text-[var(--color-fg-0)]">
              {tCookies("howToClear.title")}
            </h2>
            <p>{tCookies("howToClear.intro")}</p>
            <ul className="mt-3 list-disc space-y-2 ps-6">
              <li>{tCookies("howToClear.chrome")}</li>
              <li>{tCookies("howToClear.firefox")}</li>
              <li>{tCookies("howToClear.safari")}</li>
              <li>{tCookies("howToClear.devConsole")}</li>
            </ul>
          </section>

          <div className="border-t border-[var(--color-fg-4)]/40 pt-8 font-mono text-xs text-[var(--color-fg-3)]">
            <Link href="/privacy">{tFooter("privacyPolicy")}</Link>
            {" · "}
            <Link href="/terms">{tFooter("termsOfService")}</Link>
          </div>
        </div>
      </article>
    </main>
  );
}
