import Link from "next/link";
import { getTranslations } from "next-intl/server";
import type { Topic } from "@/lib/content/types";

interface TopicCardProps {
  branchSlug: string;
  topic: Topic;
}

export async function TopicCard({ branchSlug, topic }: TopicCardProps) {
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

  return (
    <Link
      href={`/${branchSlug}/${topic.slug}`}
      className="group relative flex h-full min-h-[260px] flex-col border border-[var(--color-fg-3)] bg-[var(--color-bg-1)] p-8 md:p-10 transition-colors duration-[180ms] hover:z-10 hover:border-[var(--color-cyan)]"
    >
      {/* Top row: eyebrow + arrow */}
      <div className="flex items-start justify-between">
        <div className="font-mono text-xs uppercase tracking-wider text-[var(--color-cyan)]">
          {eyebrow}
        </div>
        <span
          aria-hidden="true"
          className="inline-flex h-6 w-6 items-center justify-center text-xl leading-none text-[var(--color-fg-2)] transition-all duration-[240ms] ease-out group-hover:-rotate-45 group-hover:text-[var(--color-cyan)] rtl:-scale-x-100 rtl:group-hover:rotate-45"
        >
          →
        </span>
      </div>

      {/* Title + subtitle */}
      <h3 className="mt-6 text-2xl md:text-3xl font-semibold uppercase tracking-tight text-[var(--color-fg-0)] transition-colors group-hover:text-[var(--color-cyan)]">
        {title}
      </h3>
      <p className="mt-3 text-[var(--color-fg-1)]">{subtitle}</p>

      {/* Bottom meta — pinned to bottom */}
      {topic.readingMinutes > 0 && (
        <div className="mt-auto pt-10 font-mono text-xs uppercase tracking-wider text-[var(--color-fg-2)]">
          {tMeta("readingTime", { minutes: topic.readingMinutes })}
        </div>
      )}
    </Link>
  );
}
