// app/[locale]/(topics)/classical-mechanics/[topic]/problems/[problemId]/page.tsx
import { notFound } from "next/navigation";
import Link from "next/link";
import { getProblem, PROBLEMS } from "@/lib/content/problems";
import { getProblemStringsForLocale } from "@/lib/problems/strings";
import { TopicPageLayout } from "@/components/layout/topic-page-layout";
import { TopicHeader } from "@/components/layout/topic-header";
import { Section } from "@/components/layout/section";
import { StepPad } from "@/components/problems/step-pad";
import { EquationRail } from "@/components/problems/equation-rail";

export const dynamic = "force-static";
export const dynamicParams = false;

export async function generateStaticParams() {
  return PROBLEMS
    .filter((p) => p.primaryTopicSlug && p.solverPath.includes("/classical-mechanics/"))
    .map((p) => ({ topic: p.primaryTopicSlug, problemId: p.id }));
}

interface PageProps {
  params: Promise<{ locale: string; topic: string; problemId: string }>;
}

export async function generateMetadata({ params }: PageProps) {
  const { locale, problemId } = await params;
  const problem = getProblem(problemId);
  if (!problem) return {};
  const strings = await getProblemStringsForLocale(problemId, locale);
  return {
    title: `${strings?.statement?.slice(0, 60) ?? problemId} — Physics.explained`,
    description: strings?.statement?.slice(0, 155) ?? "",
  };
}

export default async function ProblemPage({ params }: PageProps) {
  const { locale, topic, problemId } = await params;
  const problem = getProblem(problemId);
  if (!problem || problem.primaryTopicSlug !== topic) notFound();

  const strings = await getProblemStringsForLocale(problemId, locale);
  if (!strings) notFound();

  return (
    <TopicPageLayout aside={[]}>
      <TopicHeader
        eyebrow={`${problem.difficulty.toUpperCase()} · PROBLEM`}
        title={strings.statement.slice(0, 80) + (strings.statement.length > 80 ? "…" : "")}
        subtitle={`From ${problem.primaryTopicSlug.replace(/-/g, " ")}`}
      />

      <Section index={1} title="The problem">
        <p className="whitespace-pre-line">{strings.statement}</p>
        <EquationRail locale={locale} equationSlugs={problem.equationSlugs} />
      </Section>

      <Section index={2} title="Step-by-step">
        <StepPad problem={problem} strings={strings} />
      </Section>

      <Section index={3} title="Try it with AI">
        <p className="text-sm text-neutral-400 mb-3">Continue the conversation with the Physics tutor — the problem context is pre-loaded.</p>
        <Link href={`/${locale}/ask?seed=${encodeURIComponent(strings.statement)}&topic=${problem.primaryTopicSlug}`}
              className="inline-block px-4 py-2 bg-cyan-600 hover:bg-cyan-500 rounded text-sm">
          Open in Physics.Ask
        </Link>
      </Section>
    </TopicPageLayout>
  );
}
