import Link from "next/link";
import type { Metadata } from "next";
import { getMessages, getTranslations, setRequestLocale } from "next-intl/server";
import { locales } from "@/i18n/config";
import { getContentEntriesByKind } from "@/lib/content/fetch";
import type { ContentEntry } from "@/lib/content/fetch";
import { WIDE_CONTAINER } from "@/lib/layout";

export const metadata: Metadata = {
  title: "Physicists — physics",
  description:
    "The people behind the laws — brief profiles of the physicists referenced across the site.",
};

function getCentury(born: string): number {
  const match = born.match(/\d+/);
  if (!match) return 0;
  const year = parseInt(match[0], 10);
  return Math.ceil(year / 100);
}

function buildCenturyLabel(
  century: number,
  t: (key: string, values?: Record<string, string | number>) => string,
): string {
  if (century <= 0) return t("centuryAncient");
  const lastTwo = century % 100;
  const lastOne = century % 10;
  let suffix: string;
  if (lastTwo >= 11 && lastTwo <= 13) suffix = t("suffixTh");
  else if (lastOne === 1) suffix = t("suffixSt");
  else if (lastOne === 2) suffix = t("suffixNd");
  else if (lastOne === 3) suffix = t("suffixRd");
  else suffix = t("suffixTh");
  return t("centuryFormat", { n: century, suffix });
}

interface CenturyBlock {
  century: number;
  label: string;
  entries: ContentEntry[];
}

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export default async function PhysicistsIndexPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("common.pages.physicists");
  const all = await getContentEntriesByKind("physicist", locale);
  const messages = (await getMessages()) as {
    common?: { pages?: { physicists?: { nationalities?: Record<string, string> } } };
  };
  const nationalityMap =
    messages.common?.pages?.physicists?.nationalities ?? {};

  const blockMap = new Map<number, ContentEntry[]>();
  for (const e of all) {
    const born = typeof e.meta.born === "string" ? e.meta.born : "";
    const c = getCentury(born);
    const list = blockMap.get(c) ?? [];
    list.push(e);
    blockMap.set(c, list);
  }

  const blocks: CenturyBlock[] = Array.from(blockMap.entries())
    .sort(([a], [b]) => a - b)
    .map(([century, entries]) => ({
      century,
      label: buildCenturyLabel(century, t),
      entries,
    }));

  return (
    <main className={`${WIDE_CONTAINER} py-20`}>
      <div>
        <div className="font-mono text-xs uppercase tracking-[0.2em] text-[var(--color-cyan-dim)]">
          {t("eyebrow")}
        </div>
        <h1 className="mt-6 text-3xl md:text-5xl lg:text-6xl uppercase tracking-tight font-display text-[var(--color-fg-0)] max-w-[20ch]">
          {t("title")}
        </h1>
        <p className="mt-6 text-sm md:mt-8 md:text-lg text-[var(--color-fg-1)] max-w-[60ch]">
          {t("subtitle")}
        </p>
        <div className="mt-8 font-mono text-xs uppercase tracking-wider text-[var(--color-fg-3)]">
          {t("stats", { count: all.length, centuries: blocks.length })}
        </div>
      </div>

      <div className="mt-16 space-y-16">
        {blocks.map((block) => (
          <section key={block.century}>
            <h2 className="mb-8 font-mono text-sm uppercase tracking-[0.2em] text-[var(--color-cyan-dim)]">
              {t("centuryHeader", {
                label: block.label,
                count: block.entries.length,
              })}
            </h2>
            <div className="grid grid-cols-1 gap-0 md:grid-cols-2 lg:grid-cols-3 [&>*]:-mt-px [&>*]:-ms-px">
              {block.entries.map((e) => {
                const born = typeof e.meta.born === "string" ? e.meta.born : "";
                const died = typeof e.meta.died === "string" ? e.meta.died : "";
                const nationality =
                  typeof e.meta.nationality === "string" ? e.meta.nationality : "";
                return (
                  <Link
                    key={e.slug}
                    href={`/physicists/${e.slug}`}
                    className="group relative flex h-full min-h-[200px] flex-col border border-[var(--color-fg-4)] bg-[var(--color-bg-1)] p-8 transition-colors duration-[180ms] hover:z-10 hover:border-[var(--color-cyan)]"
                  >
                    <div className="flex items-start justify-between">
                      <div className="font-mono text-xs uppercase tracking-wider text-[var(--color-cyan-dim)]">
                        {born}–{died} · {nationalityMap[nationality] ?? nationality}
                      </div>
                      <span
                        aria-hidden="true"
                        className="inline-flex h-6 w-6 shrink-0 items-center justify-center text-xl leading-none text-[var(--color-fg-3)] transition-all duration-[240ms] ease-out group-hover:-rotate-45 group-hover:text-[var(--color-cyan)] rtl:-scale-x-100 rtl:group-hover:rotate-45"
                      >
                        →
                      </span>
                    </div>

                    <h3 className="mt-4 text-xl md:text-2xl uppercase tracking-tight text-[var(--color-fg-0)] transition-colors group-hover:text-[var(--color-cyan)]">
                      {e.title}
                    </h3>
                    <p className="mt-3 text-sm text-[var(--color-fg-1)]">
                      {e.subtitle ?? ""}
                    </p>
                  </Link>
                );
              })}
            </div>
          </section>
        ))}
      </div>
    </main>
  );
}
