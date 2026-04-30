import Link from "next/link";
import { setRequestLocale, getTranslations } from "next-intl/server";
import { ArrowRight } from "lucide-react";
import { PLAYGROUND_SLUGS, getPlayground } from "./_components/playground-meta";
import { locales } from "@/i18n/config";

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale });
  return { title: t("play.indexTitle") };
}

export default async function PlayIndex({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale });

  return (
    <div className="absolute inset-0 overflow-y-auto bg-[var(--color-bg-0)] p-6 md:p-12">
      <div className="mx-auto max-w-3xl">
        <h1 className="font-display text-3xl tracking-tight text-[var(--color-fg-0)] md:text-5xl">
          {t("play.indexTitle")}
        </h1>
        <p className="mt-2 text-[var(--color-fg-1)]">{t("play.indexSubtitle")}</p>
        <ul className="mt-8 grid gap-3">
          {PLAYGROUND_SLUGS.map((slug) => {
            const meta = getPlayground(slug)!;
            return (
              <li key={slug}>
                <Link
                  href={`/${locale}/play/${slug}`}
                  className="group flex items-center justify-between border border-[var(--color-fg-4)]/40 px-5 py-4 transition-colors hover:border-[var(--color-cyan)] hover:bg-[var(--color-fg-4)]/10"
                >
                  <div>
                    <div className="font-mono text-xs uppercase tracking-wider text-[var(--color-cyan)]">
                      {slug}
                    </div>
                    <div className="mt-1 font-display text-xl text-[var(--color-fg-0)]">
                      {t(meta.titleKey)}
                    </div>
                    <div className="mt-1 text-sm text-[var(--color-fg-1)]">
                      {t(`play.${slug}.indexCardDescription`)}
                    </div>
                  </div>
                  <ArrowRight size={16} className="text-[var(--color-fg-1)] transition-transform group-hover:translate-x-1" />
                </Link>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
