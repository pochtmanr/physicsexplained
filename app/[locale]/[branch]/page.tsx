import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { locales } from "@/i18n/config";
import { BRANCHES, getBranch } from "@/lib/content/branches";
import { BranchHero } from "@/components/layout/branch-hero";
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
  const { locale, branch: slug } = await params;
  const branch = getBranch(slug);
  if (!branch) return {};
  const t = await getTranslations({ locale, namespace: "home.branches" });
  const items = t.raw("items") as Record<
    string,
    { title?: string; subtitle?: string; description?: string } | undefined
  >;
  const item = items[slug];
  const title = item?.title ?? branch.title;
  const description = item?.subtitle ?? branch.subtitle;
  return {
    title: `${title} — physics`,
    description,
  };
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

  return (
    <main className={`${WIDE_CONTAINER} py-20`}>
      <BranchHero branch={branch} />
      {branch.status === "live" ? (
        <div className="mt-16 grid grid-cols-1 gap-0 md:grid-cols-2 [&>*]:-mt-px [&>*]:-ms-px">
          {branch.topics.map((t) => (
            <TopicCard key={t.slug} branchSlug={branch.slug} topic={t} />
          ))}
        </div>
      ) : (
        <div className="mt-16">
          <EmailSignup branchSlug={branch.slug} />
        </div>
      )}
    </main>
  );
}
