import Link from "next/link";
import { getAllTerms } from "@/lib/content/glossary";
import { WIDE_CONTAINER } from "@/lib/layout";

export function DictionarySection() {
  const terms = getAllTerms();
  const preview = terms.slice(0, 8);

  return (
    <section id="dictionary" className={`${WIDE_CONTAINER} mt-32 md:mt-48`}>
      <div className="font-mono text-xs uppercase tracking-wider text-[var(--color-cyan)]">
        § DICTIONARY
      </div>
      <h2 className="mt-4 text-4xl md:text-5xl font-bold uppercase tracking-tight text-[var(--color-fg-0)]">
        The shared vocabulary.
      </h2>
      <p className="mt-6 max-w-[50ch] text-[var(--color-fg-1)]">
        Instruments, concepts, phenomena, and units — the words that keep
        coming back across every chapter.
      </p>
      <div className="mt-12 grid grid-cols-2 gap-0 sm:grid-cols-3 md:grid-cols-4 [&>*]:-mt-px [&>*]:-ml-px">
        {preview.map((t) => (
          <Link
            key={t.slug}
            href={`/dictionary/${t.slug}`}
            className="group relative flex h-full min-h-[120px] flex-col border border-[var(--color-fg-3)] bg-[var(--color-bg-1)] p-4 transition-colors duration-[180ms] hover:z-10 hover:border-[var(--color-cyan)] md:min-h-[140px]"
          >
            <div className="flex items-start justify-between">
              <span className="font-mono text-[9px] uppercase tracking-wider text-[var(--color-cyan)]">
                {t.category}
              </span>
              <span
                aria-hidden="true"
                className="inline-flex h-4 w-4 items-center justify-center text-xs leading-none text-[var(--color-fg-2)] transition-all duration-[240ms] ease-out group-hover:-rotate-45 group-hover:text-[var(--color-cyan)]"
              >
                →
              </span>
            </div>
            <div className="mt-2 font-mono text-[11px] uppercase tracking-wider text-[var(--color-fg-0)] transition-colors group-hover:text-[var(--color-cyan)] md:text-xs">
              {t.term}
            </div>
            <p className="mt-1.5 text-[10px] leading-snug text-[var(--color-fg-2)] md:text-[11px] line-clamp-2">
              {t.shortDefinition}
            </p>
          </Link>
        ))}
      </div>
      {terms.length > 8 && (
        <div className="mt-10 flex justify-center">
          <Link
            href="/dictionary"
            className="inline-flex items-center gap-2 border border-[var(--color-fg-3)] px-6 py-3 font-mono text-xs uppercase tracking-wider text-[var(--color-fg-1)] transition-colors hover:border-[var(--color-cyan)] hover:text-[var(--color-cyan)]"
          >
            See all {terms.length} terms →
          </Link>
        </div>
      )}
    </section>
  );
}
