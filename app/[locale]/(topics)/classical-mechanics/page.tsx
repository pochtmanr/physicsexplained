import { getTranslations, setRequestLocale } from "next-intl/server";
import { locales } from "@/i18n/config";
import { getBranch } from "@/lib/content/branches";
import { BranchHero } from "@/components/layout/branch-hero";
import { TopicCard } from "@/components/layout/topic-card";
import { WIDE_CONTAINER } from "@/lib/layout";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const branch = getBranch("classical-mechanics");
  if (!branch) return {};
  const t = await getTranslations({ locale, namespace: "home.branches" });
  const items = t.raw("items") as Record<
    string,
    { title?: string; subtitle?: string } | undefined
  >;
  const item = items["classical-mechanics"];
  const title = item?.title ?? branch.title;
  const description = item?.subtitle ?? branch.subtitle;
  return {
    title: `${title} — physics`,
    description,
  };
}

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

  return (
    <main className={`${WIDE_CONTAINER} py-20`}>
      <BranchHero branch={branch} />
      {branch.modules.map((mod) => {
        const moduleTops = branch.topics.filter(
          (t) => t.module === mod.slug && t.status !== "coming-soon",
        );
        if (moduleTops.length === 0) return null;
        const moduleTitle = moduleItems[mod.slug] ?? mod.title.toUpperCase();
        return (
          <section key={mod.slug} className="mt-16">
            <h2 className="mb-6 font-mono text-xs uppercase tracking-[0.2em] text-[var(--color-fg-2)]">
              {tMeta("moduleHeading", {
                index: mod.index,
                title: moduleTitle,
              })}
            </h2>
            <div className="grid grid-cols-1 gap-0 md:grid-cols-2 lg:grid-cols-3 [&>*]:-mt-px [&>*]:-ms-px">
              {moduleTops.map((t, i) => (
                <TopicCard
                  key={t.slug}
                  branchSlug={branch.slug}
                  topic={t}
                  tintIndex={i}
                  tintTotal={moduleTops.length}
                />
              ))}
            </div>
          </section>
        );
      })}
    </main>
  );
}
