// app/[locale]/(topics)/classical-mechanics/[topic]/problems/[problemId]/page.tsx
import { notFound } from "next/navigation";
import Link from "next/link";
import {
  getProblem,
  getProblemsForTopic,
  PROBLEMS,
} from "@/lib/content/problems";
import { getProblemStringsForLocale } from "@/lib/problems/strings";
import {
  deriveProblemTitle,
  deriveTopicTitle,
} from "@/lib/content/problem-title";
import { TopicPageLayout } from "@/components/layout/topic-page-layout";
import { TopicHeader } from "@/components/layout/topic-header";
import { Section } from "@/components/layout/section";
import { StepPad } from "@/components/problems/step-pad";
import { EquationRail } from "@/components/problems/equation-rail";

export const dynamic = "force-static";
export const dynamicParams = false;

const DIFFICULTY_ORDER = [
  "easy",
  "medium",
  "hard",
  "challenge",
  "exam",
] as const;

export async function generateStaticParams() {
  return PROBLEMS.filter(
    (p) =>
      p.primaryTopicSlug && p.solverPath.includes("/classical-mechanics/"),
  ).map((p) => ({ topic: p.primaryTopicSlug, problemId: p.id }));
}

interface PageProps {
  params: Promise<{ locale: string; topic: string; problemId: string }>;
}

export async function generateMetadata({ params }: PageProps) {
  const { locale, topic, problemId } = await params;
  const problem = getProblem(problemId);
  if (!problem) return {};
  const strings = await getProblemStringsForLocale(problemId, locale);
  const title = deriveProblemTitle(problemId, topic, problem.difficulty);
  const topicTitle = deriveTopicTitle(topic);
  return {
    title: `${title} — ${topicTitle} Problem — Physics.explained`,
    description: strings?.statement?.slice(0, 155) ?? "",
  };
}

export default async function ProblemPage({ params }: PageProps) {
  const { locale, topic, problemId } = await params;
  const problem = getProblem(problemId);
  if (!problem || problem.primaryTopicSlug !== topic) notFound();

  const strings = await getProblemStringsForLocale(problemId, locale);
  if (!strings) notFound();

  const title = deriveProblemTitle(problemId, topic, problem.difficulty);
  const topicTitle = deriveTopicTitle(topic);
  const eyebrow = `${problem.difficulty.toUpperCase()} · ${topicTitle.toUpperCase()}`;

  // Find the next problem in this topic, sorted by difficulty.
  // If we're on the last problem, fall back to undefined and the link is hidden.
  const ordered = [...getProblemsForTopic(topic)].sort(
    (a, b) =>
      DIFFICULTY_ORDER.indexOf(a.difficulty) -
      DIFFICULTY_ORDER.indexOf(b.difficulty),
  );
  const currentIndex = ordered.findIndex((p) => p.id === problemId);
  const nextProblem =
    currentIndex >= 0 && currentIndex < ordered.length - 1
      ? ordered[currentIndex + 1]
      : undefined;
  const nextName = nextProblem
    ? deriveProblemTitle(
        nextProblem.id,
        nextProblem.primaryTopicSlug,
        nextProblem.difficulty,
      )
    : undefined;

  return (
    <TopicPageLayout aside={[]}>
      <TopicHeader eyebrow={eyebrow} title={title.toUpperCase()} subtitle="" />

      {/* Problem statement renders as the page lead, not as a numbered section,
          so we don't duplicate the title content under a "The problem" header. */}
      <p className="mt-6 mb-8 text-base leading-relaxed text-[var(--color-fg-0)] whitespace-pre-line md:text-lg">
        {strings.statement}
      </p>

      <EquationRail locale={locale} equationSlugs={problem.equationSlugs} />

      <Section index={1} title="Step-by-step solution">
        <p className="mb-6 text-sm text-[var(--color-fg-1)]">
          Work through one named subgoal at a time. Each step is checked
          deterministically against the canonical solver — no AI required to
          verify correctness. Get an AI explanation when you&apos;re stuck.
        </p>
        <StepPad problem={problem} strings={strings} />
      </Section>

      <Section index={2} title="Try it with AI">
        <p className="mb-4 text-sm text-[var(--color-fg-1)]">
          Continue the conversation with the Physics tutor — the problem
          context is pre-loaded.
        </p>
        <Link
          href={`/${locale}/ask?seed=${encodeURIComponent(strings.statement)}&topic=${problem.primaryTopicSlug}`}
          className="btn-tracer inline-flex items-center gap-2 border border-[var(--color-cyan)] px-4 py-2 font-mono text-xs uppercase tracking-wider text-[var(--color-cyan)] transition hover:bg-[var(--color-cyan)]/10 md:px-6 md:py-3 md:text-sm"
        >
          Open in Physics.Ask
          <span aria-hidden="true" className="inline-block rtl:-scale-x-100">
            →
          </span>
        </Link>
      </Section>

      <div className="mt-12 flex flex-col gap-4 border-t border-[var(--color-fg-4)] pt-6 font-mono text-xs uppercase tracking-wider sm:flex-row sm:items-center sm:justify-between">
        <Link
          href={`/${locale}/classical-mechanics/${topic}`}
          className="inline-flex items-center gap-2 text-[var(--color-fg-3)] transition-colors hover:text-[var(--color-cyan)]"
        >
          <span aria-hidden="true" className="inline-block rtl:-scale-x-100">
            ←
          </span>
          Back to {topicTitle}
        </Link>
        {nextProblem && nextName && (
          <Link
            href={`/${locale}/classical-mechanics/${topic}/problems/${nextProblem.id}`}
            className="group inline-flex items-center gap-2 text-[var(--color-cyan-dim)] transition-colors hover:text-[var(--color-cyan)]"
          >
            <span className="text-[var(--color-fg-3)]">Next problem ·</span>
            <span className="border border-[var(--color-cyan-dim)] px-2 py-0.5 text-[10px] tracking-wider text-[var(--color-cyan-dim)]">
              {nextProblem.difficulty}
            </span>
            <span className="normal-case text-[var(--color-fg-0)] group-hover:text-[var(--color-cyan)]">
              {nextName}
            </span>
            <span
              aria-hidden="true"
              className="inline-block transition-transform duration-200 group-hover:translate-x-0.5 rtl:-scale-x-100 rtl:group-hover:-translate-x-0.5"
            >
              →
            </span>
          </Link>
        )}
      </div>
    </TopicPageLayout>
  );
}
