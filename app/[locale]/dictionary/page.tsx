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

type CategoryFilter = GlossaryCategory | "all";

const CATEGORIES: readonly GlossaryCategory[] = [
  "concept",
  "phenomenon",
  "instrument",
  "unit",
] as const;

const PER_PAGE = 30;

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

function parseFilter(raw: string | string[] | undefined): CategoryFilter {
  const v = Array.isArray(raw) ? raw[0] : raw;
  if (v && CATEGORIES.includes(v as GlossaryCategory)) {
    return v as GlossaryCategory;
  }
  return "all";
}

function parsePage(raw: string | string[] | undefined): number {
  const v = Array.isArray(raw) ? raw[0] : raw;
  const n = parseInt(v ?? "1", 10);
  return Number.isFinite(n) && n >= 1 ? n : 1;
}

function buildHref(filter: CategoryFilter, page: number): string {
  const params = new URLSearchParams();
  if (filter !== "all") params.set("category", filter);
  if (page > 1) params.set("page", String(page));
  const qs = params.toString();
  return `/dictionary${qs ? `?${qs}` : ""}`;
}

export default async function DictionaryIndexPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ category?: string | string[]; page?: string | string[] }>;
}) {
  const { locale } = await params;
  const sp = await searchParams;
  setRequestLocale(locale);

  const selected: CategoryFilter = parseFilter(sp.category);
  const requestedPage = parsePage(sp.page);

  const [t, all] = await Promise.all([
    getTranslations("common.pages.dictionary"),
    getContentEntriesByKind("glossary", locale),
  ]);

  const sorted: ContentEntry[] = [...all].sort((a, b) =>
    a.title.localeCompare(b.title, locale),
  );

  const counts: Record<GlossaryCategory, number> = {
    concept: 0,
    phenomenon: 0,
    instrument: 0,
    unit: 0,
  };
  for (const e of sorted) {
    const cat = readCategory(e.meta.category);
    if (cat) counts[cat]++;
  }

  const filtered =
    selected === "all"
      ? sorted
      : sorted.filter((e) => readCategory(e.meta.category) === selected);

  const total = sorted.length;
  const filteredTotal = filtered.length;
  const totalPages = Math.max(1, Math.ceil(filteredTotal / PER_PAGE));
  const currentPage = Math.min(Math.max(1, requestedPage), totalPages);
  const start = (currentPage - 1) * PER_PAGE;
  const pageEntries = filtered.slice(start, start + PER_PAGE);

  const tabs: { value: CategoryFilter; label: string; count: number }[] = [
    { value: "all", label: t("filterAll"), count: total },
    ...CATEGORIES.map((c) => ({
      value: c as CategoryFilter,
      label: t(`categoryLabels.${c}`),
      count: counts[c],
    })),
  ];

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
          {t("statsFiltered", {
            shown: filteredTotal,
            total,
            page: currentPage,
            pages: totalPages,
          })}
        </div>
      </div>

      <nav
        aria-label="Filter by category"
        className="mt-10 -mx-6 md:-mx-8 sticky top-12 md:top-14 z-40 border-y border-[var(--color-fg-4)]/60 bg-[var(--color-bg-0)]/95 backdrop-blur supports-[backdrop-filter]:bg-[var(--color-bg-0)]/85"
      >
        <div className="no-scrollbar flex items-center gap-2 overflow-x-auto px-6 py-2.5 md:px-8">
          {tabs.map((tab) => {
            const isActive = tab.value === selected;
            return (
              <Link
                key={tab.value}
                href={buildHref(tab.value, 1)}
                aria-current={isActive ? "true" : undefined}
                className={`nav-link inline-flex shrink-0 items-center gap-2 border px-3 py-1.5 font-mono text-[11px] uppercase tracking-wider transition-colors ${
                  isActive
                    ? "border-[var(--color-cyan)] bg-[var(--color-cyan)] text-[var(--color-bg-0)] shadow-[0_0_0_1px_var(--color-cyan),0_8px_24px_-12px_var(--color-glow)]"
                    : "border-[var(--color-fg-4)] text-[var(--color-fg-2)] hover:border-[var(--color-cyan-dim)] hover:text-[var(--color-cyan-dim)]"
                }`}
              >
                <span>{tab.label}</span>
                <span
                  className={`font-semibold tabular-nums ${
                    isActive
                      ? "text-[var(--color-bg-0)] opacity-70"
                      : "text-[var(--color-fg-3)]"
                  }`}
                >
                  {tab.count}
                </span>
              </Link>
            );
          })}
        </div>
      </nav>

      <div className="mt-16">
        {pageEntries.length === 0 ? (
          <p className="text-[var(--color-fg-2)]">{t("emptyCategory")}</p>
        ) : (
          <div className="grid grid-cols-1 gap-0 md:grid-cols-2 lg:grid-cols-3 [&>*]:-mt-px [&>*]:-ms-px">
            {pageEntries.map((entry) => {
              const category = readCategory(entry.meta.category);
              return (
                <Link
                  key={entry.slug}
                  href={`/dictionary/${entry.slug}`}
                  className="group relative flex h-full min-h-[200px] flex-col border border-[var(--color-fg-4)] bg-[var(--color-bg-1)] p-8 transition-colors duration-[180ms] hover:z-10 hover:border-[var(--color-cyan)]"
                >
                  <div className="flex items-start justify-between">
                    <div className="font-mono text-xs uppercase tracking-wider text-[var(--color-cyan-dim)]">
                      {category ? t(`categorySingular.${category}`) : ""}
                    </div>
                    <span
                      aria-hidden="true"
                      className="inline-flex h-6 w-6 shrink-0 items-center justify-center text-xl leading-none text-[var(--color-fg-3)] transition-all duration-[240ms] ease-out group-hover:-rotate-45 group-hover:text-[var(--color-cyan)] rtl:-scale-x-100 rtl:group-hover:rotate-45"
                    >
                      →
                    </span>
                  </div>
                  <h3 className="mt-4 text-xl md:text-2xl uppercase tracking-tight text-[var(--color-fg-0)] transition-colors group-hover:text-[var(--color-cyan)]">
                    {entry.title}
                  </h3>
                  <p className="mt-3 text-sm text-[var(--color-fg-1)]">
                    {entry.subtitle ?? ""}
                  </p>
                </Link>
              );
            })}
          </div>
        )}
      </div>

      {totalPages > 1 ? (
        <nav
          aria-label="Pagination"
          className="mt-12 flex items-center justify-between gap-3"
        >
          {currentPage > 1 ? (
            <Link
              href={buildHref(selected, currentPage - 1)}
              className="nav-link inline-flex items-center gap-2 border border-[var(--color-fg-4)] px-4 py-2 font-mono text-xs uppercase tracking-wider text-[var(--color-fg-1)] transition-colors hover:border-[var(--color-cyan-dim)] hover:text-[var(--color-cyan-dim)]"
            >
              <span aria-hidden="true" className="rtl:-scale-x-100">
                ←
              </span>
              <span>{t("pagePrevious")}</span>
            </Link>
          ) : (
            <div />
          )}
          <div className="font-mono text-xs uppercase tracking-wider text-[var(--color-fg-3)]">
            {t("pageLabel", { page: currentPage, pages: totalPages })}
          </div>
          {currentPage < totalPages ? (
            <Link
              href={buildHref(selected, currentPage + 1)}
              className="nav-link inline-flex items-center gap-2 border border-[var(--color-fg-4)] px-4 py-2 font-mono text-xs uppercase tracking-wider text-[var(--color-fg-1)] transition-colors hover:border-[var(--color-cyan-dim)] hover:text-[var(--color-cyan-dim)]"
            >
              <span>{t("pageNext")}</span>
              <span aria-hidden="true" className="rtl:-scale-x-100">
                →
              </span>
            </Link>
          ) : (
            <div />
          )}
        </nav>
      ) : null}
    </main>
  );
}
