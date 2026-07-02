"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { usePathname } from "@/i18n/navigation";
import { getAdjacentTopics } from "@/lib/content/branches";
import { buttonVariants } from "@/components/ui/button";

export function TopicNav() {
  const pathname = usePathname();
  const tMeta = useTranslations("home.topics.meta");

  if (!pathname) return null;

  const segments = pathname.split("/").filter(Boolean);
  if (segments.length < 2) return null;

  const [branchSlug, topicSlug] = segments;
  const { prev, next } = getAdjacentTopics(branchSlug, topicSlug);

  if (!prev && !next) return null;

  const linkClass = buttonVariants({
    variant: "ghost",
    size: "cta-row",
    className: "nav-link",
  });

  return (
    <nav
      aria-label="Topic navigation"
      className="mt-20 flex items-center justify-between gap-3 border-t border-[var(--color-fg-4)]/40 pt-10"
    >
      {prev ? (
        <Link
          href={`/${prev.branch.slug}/${prev.topic.slug}`}
          className={linkClass}
        >
          <span aria-hidden="true" className="rtl:-scale-x-100">
            ←
          </span>
          <span>{tMeta("previous")}</span>
        </Link>
      ) : (
        <div />
      )}
      {next ? (
        <Link
          href={`/${next.branch.slug}/${next.topic.slug}`}
          className={linkClass}
        >
          <span>{tMeta("next")}</span>
          <span aria-hidden="true" className="rtl:-scale-x-100">
            →
          </span>
        </Link>
      ) : (
        <div />
      )}
    </nav>
  );
}
