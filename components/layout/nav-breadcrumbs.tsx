"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { getBranch, getTopic } from "@/lib/content/branches";

function uppercaseSlug(slug: string): string {
  return slug.replace(/-/g, " ").toUpperCase();
}

export function NavBreadcrumbs() {
  const pathname = usePathname();

  if (!pathname || pathname === "/") return null;

  const segments = pathname.split("/").filter(Boolean);
  if (segments.length === 0) return null;

  const [branchSlug, topicSlug] = segments;

  const branch = getBranch(branchSlug);
  const branchLabel = branch ? branch.title : uppercaseSlug(branchSlug);
  const branchHref = `/${branchSlug}`;

  const topic = topicSlug ? getTopic(branchSlug, topicSlug) : undefined;
  const topicLabel = topicSlug
    ? topic
      ? topic.title
      : uppercaseSlug(topicSlug)
    : null;

  const isBranchFinal = !topicSlug;

  return (
    <div className="flex items-center">
      <span className="mx-2 font-mono text-xs text-[var(--color-fg-4)]">
        {"\u00B7"}
      </span>
      {isBranchFinal ? (
        <span className="font-mono text-xs uppercase tracking-wider text-[var(--color-fg-0)]">
          {branchLabel}
        </span>
      ) : (
        <Link
          href={branchHref}
          className="font-mono text-xs uppercase tracking-wider text-[var(--color-fg-3)] hover:text-[var(--color-cyan)] transition-colors duration-[180ms] ease-out"
        >
          {branchLabel}
        </Link>
      )}
      {topicLabel && (
        <>
          <span className="mx-2 font-mono text-xs text-[var(--color-fg-4)]">
            {"\u00B7"}
          </span>
          <span className="font-mono text-xs uppercase tracking-wider text-[var(--color-fg-0)]">
            {topicLabel}
          </span>
        </>
      )}
    </div>
  );
}
