import { notFound } from "next/navigation";
import Link from "next/link";
import { getEquation, EQUATIONS } from "@/lib/content/equations";
import { getEquationStringsForLocale, getProblemsForEquationFromDb } from "@/lib/problems/equation-strings";
import { TopicPageLayout } from "@/components/layout/topic-page-layout";
import { TopicHeader } from "@/components/layout/topic-header";
import { Section } from "@/components/layout/section";
import { EquationBlock } from "@/components/math/equation-block";

export const dynamic = "force-static";
export const dynamicParams = false;

export async function generateStaticParams() {
  return EQUATIONS.map((e) => ({ slug: e.slug }));
}

interface PageProps {
  params: Promise<{ locale: string; slug: string }>;
}

export async function generateMetadata({ params }: PageProps) {
  const { locale, slug } = await params;
  const eq = getEquation(slug);
  if (!eq) return {};
  const strings = await getEquationStringsForLocale(slug, locale);
  if (!strings) return {};
  return {
    title: `${strings.name} — Physics.explained`,
    description: strings.whatItSolves.slice(0, 155),
  };
}

export default async function EquationPage({ params }: PageProps) {
  const { locale, slug } = await params;
  const eq = getEquation(slug);
  if (!eq) notFound();
  const strings = await getEquationStringsForLocale(slug, locale);
  if (!strings) notFound();

  const problems = await getProblemsForEquationFromDb(slug, locale);

  return (
    <TopicPageLayout aside={[]}>
      <TopicHeader eyebrow="EQUATION" title={strings.name} subtitle={strings.whatItSolves.split(".")[0]} />

      <Section index={1} title="The equation">
        <EquationBlock id={`EQ.${slug.toUpperCase()}`}>
          <span className="font-mono text-2xl">{eq.latex}</span>
        </EquationBlock>
      </Section>

      <Section index={2} title="What it solves">
        <p className="whitespace-pre-line">{strings.whatItSolves}</p>
      </Section>
      <Section index={3} title="When to use it">
        <p className="whitespace-pre-line">{strings.whenToUse}</p>
      </Section>
      <Section index={4} title="When NOT to use it">
        <p className="whitespace-pre-line">{strings.whenNotTo}</p>
      </Section>
      <Section index={5} title="Common mistakes">
        <p className="whitespace-pre-line">{strings.commonMistakes}</p>
      </Section>

      {eq.relatedTopicSlugs.length > 0 && (
        <Section index={6} title="Topics that use this equation">
          <ul className="space-y-1">
            {eq.relatedTopicSlugs.map((t) => (
              <li key={t}>
                <Link href={`/${locale}/classical-mechanics/${t}`} className="text-cyan-400 hover:underline">
                  {t.replace(/-/g, " ")}
                </Link>
              </li>
            ))}
          </ul>
        </Section>
      )}

      {problems.length > 0 && (
        <Section index={7} title="Problems using this equation">
          <ul className="space-y-2">
            {problems.map((p) => {
              const stmt = p.problem_strings[0]?.statement ?? p.id;
              return (
                <li key={p.id}>
                  <Link href={`/${locale}/classical-mechanics/${p.primary_topic_slug}/problems/${p.id}`}
                        className="text-cyan-400 hover:underline">
                    [{p.difficulty}] {stmt.slice(0, 100)}…
                  </Link>
                </li>
              );
            })}
          </ul>
        </Section>
      )}
    </TopicPageLayout>
  );
}
