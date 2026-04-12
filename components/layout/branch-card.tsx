import Link from "next/link";
import type { Branch } from "@/lib/content/types";

interface BranchCardProps {
  branch: Branch;
  className?: string;
}

export function BranchCard({ branch, className }: BranchCardProps) {
  const isLive = branch.status === "live";

  const baseClass =
    "group relative flex h-full min-h-[260px] flex-col border border-[var(--color-fg-3)] bg-[var(--color-bg-1)] p-8 md:p-10 transition-colors duration-[180ms] hover:z-10";
  const hoverBorder = isLive
    ? "hover:border-[var(--color-cyan)]"
    : "hover:border-[var(--color-magenta)]";

  const titleHover = isLive
    ? "group-hover:text-[var(--color-cyan)]"
    : "group-hover:text-[var(--color-magenta)]";

  const arrowHover = isLive
    ? "group-hover:text-[var(--color-cyan)]"
    : "group-hover:text-[var(--color-magenta)]";

  const pillClass = isLive
    ? "inline-block border border-[var(--color-cyan)] px-3 py-1 font-mono text-xs uppercase text-[var(--color-cyan)]"
    : "inline-block border border-[var(--color-magenta)] px-3 py-1 font-mono text-xs uppercase text-[var(--color-magenta)]";

  const pillLabel = isLive
    ? `${branch.topics.length} TOPICS`
    : "COMING SOON";

  return (
    <Link
      href={`/${branch.slug}`}
      className={[baseClass, hoverBorder, className].filter(Boolean).join(" ")}
    >
      {/* Top row: eyebrow + arrow */}
      <div className="flex items-start justify-between">
        <div className="font-mono text-xs uppercase tracking-wider text-[var(--color-cyan)]">
          {branch.eyebrow}
        </div>
        <span
          aria-hidden="true"
          className={`inline-flex h-6 w-6 items-center justify-center text-xl leading-none text-[var(--color-fg-2)] transition-all duration-[240ms] ease-out group-hover:-rotate-45 ${arrowHover}`}
        >
          →
        </span>
      </div>

      {/* Title + subtitle */}
      <h3
        className={`mt-6 text-2xl md:text-3xl font-semibold uppercase tracking-tight text-[var(--color-fg-0)] transition-colors ${titleHover}`}
      >
        {branch.title}
      </h3>
      <p className="mt-3 text-[var(--color-fg-1)]">{branch.subtitle}</p>

      {/* Bottom pill — pinned to bottom so cards align regardless of title length */}
      <div className="mt-auto pt-10">
        <span className={pillClass}>{pillLabel}</span>
      </div>
    </Link>
  );
}
