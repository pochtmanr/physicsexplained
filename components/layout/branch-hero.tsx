import type { Branch } from "@/lib/content/types";

interface BranchHeroProps {
  branch: Branch;
}

export function BranchHero({ branch }: BranchHeroProps) {
  const totalMinutes = branch.topics.reduce(
    (s, t) => s + t.readingMinutes,
    0,
  );

  return (
    <div>
      <div className="font-mono text-xs uppercase tracking-[0.2em] text-[var(--color-cyan)]">
        {branch.eyebrow} · {branch.title}
      </div>
      <h1 className="mt-6 text-4xl md:text-6xl font-bold tracking-tight text-[var(--color-fg-0)] max-w-[20ch]">
        {branch.subtitle}
      </h1>
      <p className="mt-8 text-lg text-[var(--color-fg-1)] max-w-[60ch]">
        {branch.description}
      </p>
      {branch.status === "live" ? (
        <div className="mt-8 font-mono text-xs uppercase tracking-wider text-[var(--color-fg-2)]">
          {branch.topics.length} TOPICS · ~{totalMinutes} MIN TOTAL READING
        </div>
      ) : (
        <div className="mt-8 font-mono text-xs uppercase tracking-wider text-[var(--color-magenta)]">
          STATUS · IN DEVELOPMENT
        </div>
      )}
    </div>
  );
}
