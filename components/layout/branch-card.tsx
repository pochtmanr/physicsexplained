import type { CSSProperties } from "react";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import type { Branch } from "@/lib/content/types";

interface BranchCardProps {
  branch: Branch;
  className?: string;
  tintIndex?: number;
  tintTotal?: number;
}

export async function BranchCard({
  branch,
  className,
  tintIndex,
  tintTotal,
}: BranchCardProps) {
  const t = await getTranslations("home.branches");
  const isLive = branch.status === "live";

  // Graded depth — the card sinks a little deeper the further down the list
  // it sits, matching the "three rules" cards on the homepage.
  const position = tintIndex ?? Math.max(0, branch.index - 1);
  const total = Math.max(1, (tintTotal ?? 6) - 1);
  const progress = Math.min(1, position / total);
  const darkPct = Math.round(progress * 75);
  const cyanPct = 2 + progress * 6;
  const gridOpacity = 0.45 + progress * 0.55;

  const accent = isLive ? "var(--color-cyan)" : "var(--color-magenta)";
  const background = `color-mix(in srgb, ${accent} ${cyanPct}%, color-mix(in srgb, var(--color-bg-0) ${darkPct}%, var(--color-bg-1)))`;

  const style = {
    background,
    "--card-grid-opacity": String(gridOpacity),
  } as CSSProperties;

  const baseClass =
    "group relative flex h-full min-h-[240px] md:min-h-[280px] flex-col overflow-hidden border border-[var(--color-fg-3)] p-6 md:p-8 transition-[border-color,box-shadow] duration-[280ms] ease-out hover:z-10";
  const hoverBorder = isLive
    ? "hover:border-[var(--color-cyan)] hover:shadow-[0_0_0_1px_color-mix(in_srgb,var(--color-cyan)_32%,transparent),0_24px_56px_-20px_color-mix(in_srgb,var(--color-cyan)_45%,transparent)]"
    : "hover:border-[var(--color-magenta)] hover:shadow-[0_0_0_1px_color-mix(in_srgb,var(--color-magenta)_32%,transparent),0_24px_56px_-20px_color-mix(in_srgb,var(--color-magenta)_45%,transparent)]";

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
    ? t("topicsCount", { count: branch.topics.length })
    : t("comingSoon");

  const items = t.raw("items") as Record<
    string,
    { title: string; subtitle: string } | undefined
  >;
  const item = items[branch.slug];
  const title = item?.title ?? branch.title;
  const subtitle = item?.subtitle ?? branch.subtitle;

  const number = String(branch.index).padStart(2, "0");

  return (
    <Link
      href={`/${branch.slug}`}
      className={[baseClass, hoverBorder, className].filter(Boolean).join(" ")}
      style={style}
    >
      {/* Grid wash — density grows with card depth */}
      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage:
            "linear-gradient(var(--color-grid) 1px, transparent 1px), linear-gradient(90deg, var(--color-grid) 1px, transparent 1px)",
          backgroundSize: "32px 32px",
          opacity: "var(--card-grid-opacity)",
          maskImage:
            "linear-gradient(180deg, rgba(0,0,0,0.55) 0%, transparent 70%)",
          WebkitMaskImage:
            "linear-gradient(180deg, rgba(0,0,0,0.55) 0%, transparent 70%)",
        }}
      />

      {/* Giant watermark numeral */}
      <span
        aria-hidden="true"
        className={`pointer-events-none absolute -top-6 -end-2 select-none font-display text-[128px] md:text-[176px] leading-none font-bold opacity-[0.05] transition-all duration-[400ms] ease-out group-hover:opacity-[0.12] group-hover:-translate-y-1 rtl:-end-auto rtl:-start-2 ${
          isLive ? "text-[var(--color-cyan)]" : "text-[var(--color-magenta)]"
        }`}
      >
        {number}
      </span>

      {/* Top row: eyebrow + arrow */}
      <div className="relative flex items-start justify-between">
        <div className="font-mono text-xs uppercase tracking-wider text-[var(--color-cyan)]">
          {branch.eyebrow}
        </div>
        <span
          aria-hidden="true"
          className={`inline-flex h-6 w-6 items-center justify-center text-xl leading-none text-[var(--color-fg-2)] transition-all duration-[240ms] ease-out group-hover:-rotate-45 rtl:-scale-x-100 rtl:group-hover:rotate-45 ${arrowHover}`}
        >
          →
        </span>
      </div>

      {/* Title + subtitle */}
      <h3
        className={`relative mt-5 text-xl md:text-2xl font-semibold uppercase tracking-tight text-[var(--color-fg-0)] transition-colors ${titleHover}`}
      >
        {title}
      </h3>
      <p className="relative mt-3 text-sm md:text-base text-[var(--color-fg-1)]">
        {subtitle}
      </p>

      {/* Bottom pill — pinned to bottom so cards align regardless of title length */}
      <div className="relative mt-auto pt-8">
        <span className={pillClass}>{pillLabel}</span>
      </div>
    </Link>
  );
}
