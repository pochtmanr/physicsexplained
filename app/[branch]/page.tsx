import { notFound } from "next/navigation";
import { BRANCHES, getBranch } from "@/lib/content/branches";
import { BranchHero } from "@/components/layout/branch-hero";
import { TopicCard } from "@/components/layout/topic-card";
import { EmailSignup } from "@/components/forms/email-signup";
import { WIDE_CONTAINER } from "@/lib/layout";

export function generateStaticParams() {
  return BRANCHES.map((b) => ({ branch: b.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ branch: string }>;
}) {
  const { branch: slug } = await params;
  const branch = getBranch(slug);
  if (!branch) return {};
  return {
    title: `${branch.title} — physics`,
    description: branch.subtitle,
  };
}

export default async function BranchPage({
  params,
}: {
  params: Promise<{ branch: string }>;
}) {
  const { branch: slug } = await params;
  const branch = getBranch(slug);
  if (!branch) notFound();

  return (
    <main className={`${WIDE_CONTAINER} py-20`}>
      <BranchHero branch={branch} />
      {branch.status === "live" ? (
        <div className="mt-16 grid grid-cols-1 gap-0 md:grid-cols-2 [&>*]:-mt-px [&>*]:-ml-px">
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
