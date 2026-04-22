import Link from "next/link";
import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { locales } from "@/i18n/config";
import { getContentEntriesByKind, type ContentEntry } from "@/lib/content/fetch";
import type { GlossaryCategory } from "@/lib/content/types";
import { WIDE_CONTAINER } from "@/lib/layout";

export const metadata: Metadata = {
  title: "Dictionary — physics",
  description:
    "Instruments, concepts, and phenomena referenced across the site.",
};

interface CategoryBlock {
  category: GlossaryCategory;
  id: string;
  label: string;
  entries: ContentEntry[];
}

const CATEGORY_ORDER: readonly { category: GlossaryCategory; id: string }[] = [
  { category: "instrument", id: "cat-instruments" },
  { category: "concept", id: "cat-concepts" },
  { category: "phenomenon", id: "cat-phenomena" },
  { category: "unit", id: "cat-units" },
];

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

function readCategory(value: unknown): GlossaryCategory | null {
  if (
    value === "instrument" ||
    value === "concept" ||
    value === "phenomenon" ||
    value === "unit"
  ) {
    return value;
  }
  return null;
}

export default async function DictionaryIndexPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("common.pages.dictionary");

  const entries = await getContentEntriesByKind("glossary", locale);

  const byCategory = new Map<GlossaryCategory, ContentEntry[]>();
  for (const entry of entries) {
    const category = readCategory(entry.meta.category);
    if (!category) continue;
    const list = byCategory.get(category) ?? [];
    list.push(entry);
    byCategory.set(category, list);
  }

  const blocks: CategoryBlock[] = CATEGORY_ORDER.map(({ category, id }) => ({
    category,
    id,
    label: t(`categoryLabels.${category}`),
    entries: byCategory.get(category) ?? [],
  })).filter((b) => b.entries.length > 0);

  const total = blocks.reduce((s, b) => s + b.entries.length, 0);

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
          {t("stats", { total, categories: blocks.length })}
        </div>
      </div>

      <div className="mt-16 space-y-20">
        {blocks.map((block, blockIdx) => (
          <section key={block.category}>
            <div className="mb-8 flex flex-wrap items-baseline gap-x-3 gap-y-1">
              <span className="text-2xl font-semibold tracking-tight text-[var(--color-cyan)] tabular-nums md:text-3xl">
                §&#8239;{String(blockIdx + 1).padStart(2, "0")}
              </span>
              <h2 className="text-2xl text-[var(--color-fg-0)] md:text-3xl">
                {block.label}
              </h2>
              <span className="font-mono text-xs uppercase tracking-wider text-[var(--color-fg-3)]">
                · {block.entries.length}
              </span>
            </div>
            <div className="grid grid-cols-1 gap-0 md:grid-cols-2 lg:grid-cols-3 [&>*]:-mt-px [&>*]:-ms-px">
              {block.entries.map((entry) => {
                const displayTerm = entry.title;
                const displayShort = entry.subtitle ?? "";
                return (
                  <Link
                    key={entry.slug}
                    href={`/dictionary/${entry.slug}`}
                    className="group relative flex h-full min-h-[200px] flex-col border border-[var(--color-fg-4)] bg-[var(--color-bg-1)] p-8 transition-colors duration-[180ms] hover:z-10 hover:border-[var(--color-cyan)]"
                  >
                    <div className="flex items-start justify-between">
                      <div className="font-mono text-xs uppercase tracking-wider text-[var(--color-cyan-dim)]">
                        {t(`categorySingular.${block.category}`)}
                      </div>
                      <span
                        aria-hidden="true"
                        className="inline-flex h-6 w-6 shrink-0 items-center justify-center text-xl leading-none text-[var(--color-fg-3)] transition-all duration-[240ms] ease-out group-hover:-rotate-45 group-hover:text-[var(--color-cyan)] rtl:-scale-x-100 rtl:group-hover:rotate-45"
                      >
                        →
                      </span>
                    </div>
                    <h3 className="mt-4 text-xl md:text-2xl uppercase tracking-tight text-[var(--color-fg-0)] transition-colors group-hover:text-[var(--color-cyan)]">
                      {displayTerm}
                    </h3>
                    <p className="mt-3 text-sm text-[var(--color-fg-1)]">
                      {displayShort}
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
