import { getTranslations, setRequestLocale } from "next-intl/server";
import { locales } from "@/i18n/config";
import { getBranch } from "@/lib/content/branches";
import { BranchHero } from "@/components/layout/branch-hero";
import { ModuleChips } from "@/components/layout/module-chips";
import { TopicCard } from "@/components/layout/topic-card";
import { WIDE_CONTAINER } from "@/lib/layout";
import { makeBranchMetadata } from "@/lib/seo/topic-metadata";

export const generateMetadata = makeBranchMetadata("classical-mechanics");

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
  const tMeta = await getTranslations("home.topics.meta");
  const tTopics = await getTranslations("home.topics");
  const moduleItems = tTopics.raw("modules") as Record<string, string>;

  const populatedModules = branch.modules
    .map((mod) => ({
      mod,
      topics: branch.topics.filter(
        (t) => t.module === mod.slug && t.status !== "coming-soon",
      ),
    }))
    .filter(({ topics }) => topics.length > 0);

  const chipModules = populatedModules.map(({ mod }) => ({
    slug: mod.slug,
    index: mod.index,
    title: moduleItems[mod.slug] ?? mod.title.toUpperCase(),
  }));

  return (
    <main className={`${WIDE_CONTAINER} py-20`}>
      <BranchHero branch={branch} />
      <ModuleChips modules={chipModules} />
      {populatedModules.map(({ mod, topics: moduleTops }) => {
        const moduleTitle = moduleItems[mod.slug] ?? mod.title.toUpperCase();
        return (
          <section
            key={mod.slug}
            id={`module-${mod.slug}`}
            className="mt-16 scroll-mt-28"
          >
            <h2 className="mb-6 font-mono text-xs uppercase tracking-[0.2em] text-[var(--color-fg-3)]">
              {tMeta("moduleHeading", {
                index: mod.index,
                title: moduleTitle,
              })}
            </h2>
            <div className="grid grid-cols-1 gap-0 md:grid-cols-2 lg:grid-cols-3 [&>*]:-mt-px [&>*]:-ms-px">
              {moduleTops.map((t) => (
                <TopicCard
                  key={t.slug}
                  branchSlug={branch.slug}
                  topic={t}
                />
              ))}
            </div>
          </section>
        );
      })}
    </main>
  );
}
