"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { usePathname } from "@/i18n/navigation";
import { getAdjacentTopics } from "@/lib/content/branches";

export function TopicNav() {
  const pathname = usePathname();
  const tTopics = useTranslations("home.topics");
  const tMeta = useTranslations("home.topics.meta");

  if (!pathname) return null;

  const segments = pathname.split("/").filter(Boolean);
  if (segments.length < 2) return null;

  const [branchSlug, topicSlug] = segments;
  const { prev, next } = getAdjacentTopics(branchSlug, topicSlug);

  if (!prev && !next) return null;

  const items = tTopics.raw("items") as Record<
    string,
    { title?: string; subtitle?: string; eyebrow?: string } | undefined
  >;

  const prevTitle = prev
    ? items[prev.topic.slug]?.title ?? prev.topic.title
    : "";
  const nextTitle = next
    ? items[next.topic.slug]?.title ?? next.topic.title
    : "";

  return (
    <nav
      aria-label="Topic navigation"
      className="mt-20 flex items-stretch gap-3 border-t border-[var(--color-fg-4)]/40 pt-10 md:gap-4"
    >
      {prev ? (
        <Link
          href={`/${prev.branch.slug}/${prev.topic.slug}`}
          className="group flex flex-1 flex-col border border-[var(--color-fg-4)] p-4 transition-colors hover:border-[var(--color-cyan)] md:p-6"
        >
          <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-[var(--color-fg-3)]">
            {tMeta("previous")}
          </span>
          <span className="mt-2 flex items-center gap-2 font-mono text-sm uppercase tracking-wider text-[var(--color-fg-1)] transition-colors group-hover:text-[var(--color-cyan)]">
            <span aria-hidden="true" className="rtl:-scale-x-100">
              ←
            </span>
            <span className="hidden md:inline">{prevTitle}</span>
          </span>
        </Link>
      ) : (
        <div className="flex-1" />
      )}
      {next ? (
        <Link
          href={`/${next.branch.slug}/${next.topic.slug}`}
          className="group flex flex-1 flex-col items-end border border-[var(--color-fg-4)] p-4 text-end transition-colors hover:border-[var(--color-cyan)] md:p-6"
        >
          <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-[var(--color-fg-3)]">
            {tMeta("next")}
          </span>
          <span className="mt-2 flex items-center gap-2 font-mono text-sm uppercase tracking-wider text-[var(--color-fg-1)] transition-colors group-hover:text-[var(--color-cyan)]">
            <span className="hidden md:inline">{nextTitle}</span>
            <span aria-hidden="true" className="rtl:-scale-x-100">
              →
            </span>
          </span>
        </Link>
      ) : (
        <div className="flex-1" />
      )}
    </nav>
  );
}
