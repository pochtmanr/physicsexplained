"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { usePathname } from "@/i18n/navigation";
import { getBranch, getTopic } from "@/lib/content/branches";

function uppercaseSlug(slug: string): string {
  return slug.replace(/-/g, " ").toUpperCase();
}

export function TopicBreadcrumb() {
  const pathname = usePathname();
  const tBranches = useTranslations("home.branches");
  const tTopics = useTranslations("home.topics");

  if (!pathname || pathname === "/") return null;

  const segments = pathname.split("/").filter(Boolean);
  if (segments.length < 2) return null;

  const [branchSlug, topicSlug] = segments;

  const branch = getBranch(branchSlug);
  const branchItems = tBranches.raw("items") as Record<
    string,
    { title?: string; subtitle?: string } | undefined
  >;
  const branchLabel =
    branchItems[branchSlug]?.title ??
    (branch ? branch.title : uppercaseSlug(branchSlug));

  const topic = getTopic(branchSlug, topicSlug);
  const topicItems = tTopics.raw("items") as Record<
    string,
    { title?: string; subtitle?: string; eyebrow?: string } | undefined
  >;
  const topicLabel =
    topicItems[topicSlug]?.title ??
    (topic ? topic.title : uppercaseSlug(topicSlug));

  return (
    <nav
      aria-label="Breadcrumb"
      className="mt-8 flex items-center gap-2 font-mono text-xs uppercase tracking-wider"
    >
      <Link
        href={`/${branchSlug}`}
        className="text-[var(--color-fg-2)] transition-colors hover:text-[var(--color-cyan)]"
      >
        {branchLabel}
      </Link>
      <span className="text-[var(--color-fg-3)]">/</span>
      <span className="text-[var(--color-fg-0)]">{topicLabel}</span>
    </nav>
  );
}
