import { setRequestLocale } from "next-intl/server";
import { locales } from "@/i18n/config";
import { getBranch } from "@/lib/content/branches";
import { BranchHero } from "@/components/layout/branch-hero";
import { TopicCard } from "@/components/layout/topic-card";
import { WIDE_CONTAINER } from "@/lib/layout";

export const metadata = {
  title: "Classical Mechanics — physics",
  description: "The physics of cannonballs, planets, and pendulums.",
};

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export default async function ClassicalMechanicsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const branch = getBranch("classical-mechanics")!;
  return (
    <main className={`${WIDE_CONTAINER} py-20`}>
      <BranchHero branch={branch} />
      {branch.modules.map((mod) => {
        const moduleTops = branch.topics.filter(
          (t) => t.module === mod.slug && t.status !== "coming-soon",
        );
        if (moduleTops.length === 0) return null;
        return (
          <section key={mod.slug} className="mt-16">
            <h2 className="mb-6 font-mono text-xs uppercase tracking-[0.2em] text-[var(--color-fg-2)]">
              MODULE {mod.index} · {mod.title.toUpperCase()}
            </h2>
            <div className="grid grid-cols-1 gap-0 md:grid-cols-2 lg:grid-cols-3 [&>*]:-mt-px [&>*]:-ml-px">
              {moduleTops.map((t) => (
                <TopicCard key={t.slug} branchSlug={branch.slug} topic={t} />
              ))}
            </div>
          </section>
        );
      })}
    </main>
  );
}
