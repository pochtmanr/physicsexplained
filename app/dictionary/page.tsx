import Link from "next/link";
import type { Metadata } from "next";
import { getTermsByCategory } from "@/lib/content/glossary";
import type { GlossaryCategory, GlossaryTerm } from "@/lib/content/types";
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
  terms: readonly GlossaryTerm[];
}

const CATEGORY_ORDER: readonly { category: GlossaryCategory; id: string; label: string }[] = [
  { category: "instrument", id: "cat-instruments", label: "§ INSTRUMENTS" },
  { category: "concept", id: "cat-concepts", label: "§ CONCEPTS" },
  { category: "phenomenon", id: "cat-phenomena", label: "§ PHENOMENA" },
  { category: "unit", id: "cat-units", label: "§ UNITS" },
];

export default function DictionaryIndexPage() {
  const blocks: CategoryBlock[] = CATEGORY_ORDER.map(
    ({ category, id, label }) => ({
      category,
      id,
      label,
      terms: getTermsByCategory(category),
    }),
  ).filter((b) => b.terms.length > 0);

  const total = blocks.reduce((s, b) => s + b.terms.length, 0);

  return (
    <main className={`${WIDE_CONTAINER} py-20`}>
      <div>
        <div className="font-mono text-xs uppercase tracking-[0.2em] text-[var(--color-cyan)]">
          § DICTIONARY
        </div>
        <h1 className="mt-6 text-4xl md:text-6xl font-bold uppercase tracking-tight font-display text-[var(--color-fg-0)] max-w-[20ch]">
          THE DICTIONARY
        </h1>
        <p className="mt-8 text-lg text-[var(--color-fg-1)] max-w-[60ch]">
          Instruments, concepts, and phenomena — the shared vocabulary of the
          site.
        </p>
        <div className="mt-8 font-mono text-xs uppercase tracking-wider text-[var(--color-fg-2)]">
          {total} TERMS · {blocks.length} CATEGORIES
        </div>
      </div>

      <div className="mt-16 space-y-16">
        {blocks.map((block) => (
          <section key={block.category}>
            <h2
              id={block.id}
              className="mb-8 font-mono text-sm uppercase tracking-[0.2em] text-[var(--color-cyan)]"
            >
              {block.label} · {block.terms.length}
            </h2>
            <div className="grid grid-cols-1 gap-0 md:grid-cols-2 lg:grid-cols-3 [&>*]:-mt-px [&>*]:-ml-px">
              {block.terms.map((term) => (
                <Link
                  key={term.slug}
                  href={`/dictionary/${term.slug}`}
                  className="group relative flex h-full min-h-[200px] flex-col border border-[var(--color-fg-3)] bg-[var(--color-bg-1)] p-8 transition-colors duration-[180ms] hover:z-10 hover:border-[var(--color-cyan)]"
                >
                  <div className="flex items-start justify-between">
                    <h3 className="text-xl md:text-2xl font-semibold uppercase tracking-tight text-[var(--color-fg-0)] transition-colors group-hover:text-[var(--color-cyan)]">
                      {term.term}
                    </h3>
                    <span
                      aria-hidden="true"
                      className="inline-flex h-6 w-6 shrink-0 items-center justify-center text-xl leading-none text-[var(--color-fg-2)] transition-all duration-[240ms] ease-out group-hover:-rotate-45 group-hover:text-[var(--color-cyan)]"
                    >
                      →
                    </span>
                  </div>
                  <p className="mt-4 text-sm text-[var(--color-fg-1)]">
                    {term.shortDefinition}
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
