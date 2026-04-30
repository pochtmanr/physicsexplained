import Link from "next/link";
import type { ReactNode } from "react";
import { getLocale } from "next-intl/server";
import { getContentEntry } from "@/lib/content/fetch";
import { getEquation } from "@/lib/content/equations";
import { HoverCard } from "./hover-card";

interface TermProps {
  slug: string;
  children?: ReactNode;
}

const LINK_CLASS =
  "underline decoration-dotted decoration-[var(--color-fg-4)] underline-offset-[3px] transition-colors duration-[180ms] ease-out hover:text-[var(--color-cyan)] hover:decoration-[var(--color-cyan)]";

export async function Term({ slug, children }: TermProps) {
  const locale = await getLocale();

  // 1. Try glossary first (existing behavior).
  const entry = await getContentEntry("glossary", slug, locale);
  if (entry) {
    const term = entry.title;
    const shortDefinition = entry.subtitle ?? "";

    const preview = (
      <span className="block">
        <span className="block font-semibold text-[var(--color-fg-0)]">
          {term}
        </span>
        {shortDefinition && (
          <span className="block mt-1 text-[var(--color-fg-1)]">
            {shortDefinition}
          </span>
        )}
      </span>
    );

    return (
      <HoverCard content={preview}>
        <Link href={`/dictionary/${slug}`} className={LINK_CLASS}>
          {children ?? term}
        </Link>
      </HoverCard>
    );
  }

  // 2. Fall back to equations registry.
  const equation = getEquation(slug);
  if (equation) {
    return (
      <Link href={`/${locale}/equations/${slug}`} className={LINK_CLASS}>
        {children ?? slug}
      </Link>
    );
  }

  // 3. Neither registry contains the slug — fail loud at build time.
  throw new Error(
    `Term: unknown slug "${slug}" — not found in GLOSSARY or EQUATIONS`,
  );
}
