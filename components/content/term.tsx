import Link from "next/link";
import type { ReactNode } from "react";
import { getTerm } from "@/lib/content/glossary";
import { HoverCard } from "./hover-card";

interface TermProps {
  slug: string;
  children?: ReactNode;
}

export function Term({ slug, children }: TermProps) {
  const term = getTerm(slug);
  if (!term) {
    throw new Error(`Term: unknown slug "${slug}"`);
  }

  const preview = (
    <span className="block">
      <span className="block font-semibold text-[var(--color-fg-0)]">
        {term.term}
      </span>
      <span className="block mt-1 text-[var(--color-fg-1)]">
        {term.shortDefinition}
      </span>
    </span>
  );

  return (
    <HoverCard content={preview}>
      <Link
        href={`/dictionary/${slug}`}
        className="underline decoration-dotted decoration-[var(--color-fg-4)] underline-offset-[3px] transition-colors duration-[180ms] ease-out hover:text-[var(--color-cyan)] hover:decoration-[var(--color-cyan)]"
      >
        {children ?? term.term}
      </Link>
    </HoverCard>
  );
}
