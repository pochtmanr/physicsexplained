import { getBranch } from "@/lib/content/branches";
import { BranchHero } from "@/components/layout/branch-hero";
import { TopicCard } from "@/components/layout/topic-card";
import { WIDE_CONTAINER } from "@/lib/layout";

export const metadata = {
  title: "Classical Mechanics — physics",
  description: "The physics of cannonballs, planets, and pendulums.",
};

export default function ClassicalMechanicsPage() {
  const branch = getBranch("classical-mechanics")!;
  return (
    <main className={`${WIDE_CONTAINER} py-20`}>
      <BranchHero branch={branch} />
      <div className="mt-16 grid grid-cols-1 gap-0 md:grid-cols-2 [&>*]:-mt-px [&>*]:-ml-px">
        {branch.topics.map((t) => (
          <TopicCard key={t.slug} branchSlug={branch.slug} topic={t} />
        ))}
      </div>
    </main>
  );
}
