import { getTranslations } from "next-intl/server";
import type { Branch } from "@/lib/content/types";

interface BranchHeroProps {
  branch: Branch;
}

export async function BranchHero({ branch }: BranchHeroProps) {
  const tBranches = await getTranslations("home.branches");
  const tMeta = await getTranslations("home.topics.meta");
  const totalMinutes = branch.topics.reduce(
    (s, t) => s + t.readingMinutes,
    0,
  );

  const items = tBranches.raw("items") as Record<
    string,
    | { title: string; subtitle: string; description?: string }
    | undefined
  >;
  const item = items[branch.slug];
  const title = item?.title ?? branch.title;
  const subtitle = item?.subtitle ?? branch.subtitle;
  const description = item?.description ?? branch.description;

  return (
    <div>
      <div className="font-mono text-xs uppercase tracking-[0.2em] text-[var(--color-cyan-dim)]">
        {branch.eyebrow} · {title}
      </div>
      <h1 className="mt-6 text-4xl md:text-6xl uppercase tracking-tight font-display text-[var(--color-fg-0)] max-w-[20ch]">
        {subtitle}
      </h1>
      <p className="mt-8 text-lg text-[var(--color-fg-1)] max-w-[60ch]">
        {description}
      </p>
      {branch.status === "live" ? (
        <div className="mt-8 font-mono text-xs uppercase tracking-wider text-[var(--color-fg-3)]">
          {tMeta("topicsTotal", {
            count: branch.topics.length,
            minutes: totalMinutes,
          })}
        </div>
      ) : (
        <div className="mt-8 font-mono text-xs uppercase tracking-wider text-[var(--color-magenta)]">
          {tMeta("statusInDevelopment")}
        </div>
      )}
    </div>
  );
}
