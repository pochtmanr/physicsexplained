import Link from "next/link";
import type { Topic } from "@/lib/content/types";

interface TopicCardProps {
  branchSlug: string;
  topic: Topic;
}

export function TopicCard({ branchSlug, topic }: TopicCardProps) {
  return (
    <Link
      href={`/${branchSlug}/${topic.slug}`}
      className="group relative flex h-full min-h-[260px] flex-col border border-[var(--color-fg-3)] bg-[var(--color-bg-1)] p-8 md:p-10 transition-colors duration-[180ms] hover:z-10 hover:border-[var(--color-cyan)]"
    >
      {/* Top row: eyebrow + arrow */}
      <div className="flex items-start justify-between">
        <div className="font-mono text-xs uppercase tracking-wider text-[var(--color-cyan)]">
          {topic.eyebrow}
        </div>
        <span
          aria-hidden="true"
          className="inline-flex h-6 w-6 items-center justify-center text-xl leading-none text-[var(--color-fg-2)] transition-all duration-[240ms] ease-out group-hover:-rotate-45 group-hover:text-[var(--color-cyan)]"
        >
          →
        </span>
      </div>

      {/* Title + subtitle */}
      <h3 className="mt-6 text-2xl md:text-3xl font-semibold uppercase tracking-tight text-[var(--color-fg-0)] transition-colors group-hover:text-[var(--color-cyan)]">
        {topic.title}
      </h3>
      <p className="mt-3 text-[var(--color-fg-1)]">{topic.subtitle}</p>

      {/* Bottom meta — pinned to bottom */}
      <div className="mt-auto pt-10 font-mono text-xs uppercase tracking-wider text-[var(--color-fg-2)]">
        READING TIME · ~{topic.readingMinutes} MIN
      </div>
    </Link>
  );
}
