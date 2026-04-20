import type { CSSProperties } from "react";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import type { Topic } from "@/lib/content/types";

interface TopicCardProps {
  branchSlug: string;
  topic: Topic;
  tintIndex?: number;
  tintTotal?: number;
}

function extractFigNumber(eyebrow: string): string {
  const match = eyebrow.match(/\d+/);
  return match ? match[0] : "";
}

export async function TopicCard({
  branchSlug,
  topic,
  tintIndex,
  tintTotal,
}: TopicCardProps) {
  const tTopics = await getTranslations("home.topics");
  const tMeta = await getTranslations("home.topics.meta");

  const items = tTopics.raw("items") as Record<
    string,
    { title?: string; subtitle?: string; eyebrow?: string } | undefined
  >;
  const item = items[topic.slug];
  const title = item?.title ?? topic.title;
  const subtitle = item?.subtitle ?? topic.subtitle;
  const eyebrow = item?.eyebrow ?? topic.eyebrow;

  // Graded depth — each card sinks a little deeper than the one before it.
  const position = tintIndex ?? 0;
  const total = Math.max(1, (tintTotal ?? 3) - 1);
  const progress = Math.min(1, position / total);
  const darkPct = Math.round(progress * 65);
  const cyanPct = 2 + progress * 5;
  const gridOpacity = 0.45 + progress * 0.5;

  const background = `color-mix(in srgb, var(--color-cyan) ${cyanPct}%, color-mix(in srgb, var(--color-bg-0) ${darkPct}%, var(--color-bg-1)))`;

  const style = {
    background,
    "--card-grid-opacity": String(gridOpacity),
  } as CSSProperties;

  const number = extractFigNumber(eyebrow);

  return (
    <Link
      href={`/${branchSlug}/${topic.slug}`}
      className="group relative flex h-full min-h-[220px] md:min-h-[260px] flex-col overflow-hidden border border-[var(--color-fg-4)] p-6 md:p-8 transition-[border-color,box-shadow] duration-[280ms] ease-out hover:z-10 hover:border-[var(--color-cyan)] hover:shadow-[0_0_0_1px_color-mix(in_srgb,var(--color-cyan)_32%,transparent),0_24px_56px_-20px_color-mix(in_srgb,var(--color-cyan)_45%,transparent)]"
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
      {number ? (
        <span
          aria-hidden="true"
          className="pointer-events-none absolute -top-6 -end-2 select-none font-display text-[128px] md:text-[168px] leading-none font-semibold text-[var(--color-cyan)] opacity-[0.05] transition-all duration-[400ms] ease-out group-hover:opacity-[0.12] group-hover:-translate-y-1 rtl:-end-auto rtl:-start-2"
        >
          {number}
        </span>
      ) : null}

      {/* Top row: eyebrow + arrow */}
      <div className="relative flex items-start justify-between">
        <div className="font-mono text-xs uppercase tracking-wider text-[var(--color-cyan-dim)]">
          {eyebrow}
        </div>
        <span
          aria-hidden="true"
          className="inline-flex h-6 w-6 items-center justify-center text-xl leading-none text-[var(--color-fg-3)] transition-all duration-[240ms] ease-out group-hover:-rotate-45 group-hover:text-[var(--color-cyan)] rtl:-scale-x-100 rtl:group-hover:rotate-45"
        >
          →
        </span>
      </div>

      {/* Title + subtitle */}
      <h3 className="relative mt-4 text-xl md:text-2xl uppercase tracking-tight text-[var(--color-fg-0)] transition-colors group-hover:text-[var(--color-cyan)]">
        {title}
      </h3>
      <p className="relative mt-3 text-sm md:text-base text-[var(--color-fg-1)]">
        {subtitle}
      </p>

      {/* Bottom meta — pinned to bottom */}
      {topic.readingMinutes > 0 && (
        <div className="relative mt-auto pt-8 font-mono text-xs uppercase tracking-wider text-[var(--color-fg-3)]">
          {tMeta("readingTime", { minutes: topic.readingMinutes })}
        </div>
      )}
    </Link>
  );
}
