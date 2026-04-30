import Link from "next/link";
import { EQUATIONS } from "@/lib/content/equations";
import { getEquationStringsForLocale } from "@/lib/problems/equation-strings";
import { TopicPageLayout } from "@/components/layout/topic-page-layout";
import { TopicHeader } from "@/components/layout/topic-header";

export const dynamic = "force-static";

interface PageProps { params: Promise<{ locale: string }>; }

export default async function EquationsIndex({ params }: PageProps) {
  const { locale } = await params;
  const items = await Promise.all(EQUATIONS.map(async (e) => {
    const s = await getEquationStringsForLocale(e.slug, locale);
    return { ...e, name: s?.name ?? e.slug, blurb: s?.whatItSolves.slice(0, 100) ?? "" };
  }));

  return (
    <TopicPageLayout aside={[]}>
      <TopicHeader eyebrow="REFERENCE" title="EQUATIONS" subtitle="Every equation, what it solves, when to use it." />
      <div className="grid gap-3 mt-6">
        {items.map((e) => (
          <Link key={e.slug} href={`/${locale}/equations/${e.slug}`}
                className="block border border-neutral-800 hover:border-cyan-700 rounded-lg p-4">
            <div className="font-mono text-sm text-cyan-400 mb-1">{e.latex}</div>
            <div className="text-base text-neutral-100">{e.name}</div>
            <div className="text-sm text-neutral-400 line-clamp-1">{e.blurb}</div>
          </Link>
        ))}
      </div>
    </TopicPageLayout>
  );
}
