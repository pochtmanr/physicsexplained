import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { locales } from "@/i18n/config";
import { BRANCHES, getBranch } from "@/lib/content/branches";
import { makeBranchMetadata } from "@/lib/seo/topic-metadata";
import { BranchHero } from "@/components/layout/branch-hero";
import { ModuleChips } from "@/components/layout/module-chips";
import { TopicCard } from "@/components/layout/topic-card";
import { EmailSignup } from "@/components/forms/email-signup";
import { WIDE_CONTAINER } from "@/lib/layout";

export function generateStaticParams() {
  return locales.flatMap((locale) =>
    BRANCHES.map((b) => ({ locale, branch: b.slug }))
  );
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; branch: string }>;
}) {
  const { branch, locale } = await params;
  return makeBranchMetadata(branch)({ params: Promise.resolve({ locale }) });
}

export default async function BranchPage({
  params,
}: {
  params: Promise<{ locale: string; branch: string }>;
}) {
  const { locale, branch: slug } = await params;
  setRequestLocale(locale);
  const branch = getBranch(slug);
  if (!branch) notFound();

  if (branch.status !== "live") {
    return (
      <main className={`${WIDE_CONTAINER} py-20`}>
        <BranchHero branch={branch} />
        <div className="mt-16">
          <EmailSignup branchSlug={branch.slug} />
        </div>
      </main>
    );
  }

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

  // Branches without a module structure (or with empty modules) keep the
  // original flat grid — the graded depth tint is part of that aesthetic.
  if (populatedModules.length === 0) {
    return (
      <main className={`${WIDE_CONTAINER} py-20`}>
        <BranchHero branch={branch} />
        <div className="mt-16 grid grid-cols-1 gap-0 md:grid-cols-2 [&>*]:-mt-px [&>*]:-ms-px">
          {branch.topics.map((t, i) => (
            <TopicCard
              key={t.slug}
              branchSlug={branch.slug}
              topic={t}
              tintIndex={i}
              tintTotal={branch.topics.length}
            />
          ))}
        </div>
      </main>
    );
  }

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
