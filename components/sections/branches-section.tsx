import { BranchCard } from "@/components/layout/branch-card";
import { BRANCHES } from "@/lib/content/branches";
import { WIDE_CONTAINER } from "@/lib/layout";

export function BranchesSection() {
  return (
    <section id="branches" className={`${WIDE_CONTAINER} mt-32 md:mt-48`}>
      <div className="font-mono text-xs uppercase tracking-wider text-[var(--color-cyan)]">
        § BRANCHES
      </div>
      <h2 className="mt-4 text-4xl md:text-5xl font-bold uppercase tracking-tight text-[var(--color-fg-0)]">
        Six branches of physics.
      </h2>
      <p className="mt-6 max-w-[50ch] text-[var(--color-fg-1)]">
        Start with what exists. The rest is on the way.
      </p>
      <div className="mt-12 grid grid-cols-1 gap-0 md:grid-cols-2 [&>*]:-mt-px [&>*]:-ml-px">
        {BRANCHES.map((b) => (
          <BranchCard key={b.slug} branch={b} />
        ))}
      </div>
    </section>
  );
}
