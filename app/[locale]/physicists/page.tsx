import Link from "next/link";
import type { Metadata } from "next";
import { getMessages, getTranslations, setRequestLocale } from "next-intl/server";
import { locales } from "@/i18n/config";
import { getAllLocalizedPhysicists } from "@/lib/content/physicists";
import type { Physicist } from "@/lib/content/types";
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
  physicists: Physicist[];
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
  const all = await getAllLocalizedPhysicists();
  const messages = (await getMessages()) as {
    common?: { pages?: { physicists?: { nationalities?: Record<string, string> } } };
  };
  const nationalityMap =
    messages.common?.pages?.physicists?.nationalities ?? {};

  const blockMap = new Map<number, Physicist[]>();
  for (const p of all) {
    const c = getCentury(p.born);
    const list = blockMap.get(c) ?? [];
    list.push(p);
    blockMap.set(c, list);
  }

  const blocks: CenturyBlock[] = Array.from(blockMap.entries())
    .sort(([a], [b]) => a - b)
    .map(([century, physicists]) => ({
      century,
      label: buildCenturyLabel(century, t),
      physicists,
    }));

  return (
    <main className={`${WIDE_CONTAINER} py-20`}>
      <div>
        <div className="font-mono text-xs uppercase tracking-[0.2em] text-[var(--color-cyan)]">
          {t("eyebrow")}
        </div>
        <h1 className="mt-6 text-4xl md:text-6xl font-bold uppercase tracking-tight font-display text-[var(--color-fg-0)] max-w-[20ch]">
          {t("title")}
        </h1>
        <p className="mt-8 text-lg text-[var(--color-fg-1)] max-w-[60ch]">
          {t("subtitle")}
        </p>
        <div className="mt-8 font-mono text-xs uppercase tracking-wider text-[var(--color-fg-2)]">
          {t("stats", { count: all.length, centuries: blocks.length })}
        </div>
      </div>

      <div className="mt-16 space-y-16">
        {blocks.map((block) => (
          <section key={block.century}>
            <h2 className="mb-8 font-mono text-sm uppercase tracking-[0.2em] text-[var(--color-cyan)]">
              {t("centuryHeader", {
                label: block.label,
                count: block.physicists.length,
              })}
            </h2>
            <div className="grid grid-cols-1 gap-0 md:grid-cols-2 lg:grid-cols-3 [&>*]:-mt-px [&>*]:-ms-px">
              {block.physicists.map((p) => (
                <Link
                  key={p.slug}
                  href={`/physicists/${p.slug}`}
                  className="group relative flex h-full min-h-[200px] flex-col border border-[var(--color-fg-3)] bg-[var(--color-bg-1)] p-8 transition-colors duration-[180ms] hover:z-10 hover:border-[var(--color-cyan)]"
                >
                  <div className="flex items-start justify-between">
                    <div className="font-mono text-xs uppercase tracking-wider text-[var(--color-cyan)]">
                      {p.born}–{p.died} · {nationalityMap[p.nationality] ?? p.nationality}
                    </div>
                    <span
                      aria-hidden="true"
                      className="inline-flex h-6 w-6 shrink-0 items-center justify-center text-xl leading-none text-[var(--color-fg-2)] transition-all duration-[240ms] ease-out group-hover:-rotate-45 group-hover:text-[var(--color-cyan)] rtl:-scale-x-100 rtl:group-hover:rotate-45"
                    >
                      →
                    </span>
                  </div>

                  <h3 className="mt-4 text-xl md:text-2xl font-semibold uppercase tracking-tight text-[var(--color-fg-0)] transition-colors group-hover:text-[var(--color-cyan)]">
                    {p.name}
                  </h3>
                  <p className="mt-3 text-sm text-[var(--color-fg-1)]">
                    {p.oneLiner}
                  </p>
                </Link>
              ))}
            </div>
          </section>
        ))}
      </div>
    </main>
  );
}
