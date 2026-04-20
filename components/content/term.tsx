import Link from "next/link";
import type { ReactNode } from "react";
import { getLocale } from "next-intl/server";
import { getContentEntry } from "@/lib/content/fetch";
import { HoverCard } from "./hover-card";

interface TermProps {
  slug: string;
  children?: ReactNode;
}

export async function Term({ slug, children }: TermProps) {
  const locale = await getLocale();
  const entry = await getContentEntry("glossary", slug, locale);
  if (!entry) {
    throw new Error(`Term: unknown slug "${slug}"`);
  }

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
      <Link
        href={`/dictionary/${slug}`}
        className="underline decoration-dotted decoration-[var(--color-fg-4)] underline-offset-[3px] transition-colors duration-[180ms] ease-out hover:text-[var(--color-cyan)] hover:decoration-[var(--color-cyan)]"
      >
        {children ?? term}
      </Link>
    </HoverCard>
  );
}
