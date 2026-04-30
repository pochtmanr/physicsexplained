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

const SMALL_WORDS = new Set(["a", "an", "and", "as", "at", "but", "by", "for", "from", "in", "of", "on", "or", "the", "to", "vs", "with"]);

/**
 * Convert the unique tail of a problem id into a human-readable title.
 * `motion-in-a-straight-line-easy-distance-from-velocity-time`
 *   → topic = "motion-in-a-straight-line", difficulty = "easy"
 *   → tail  = "distance-from-velocity-time"
 *   → title = "Distance from Velocity-Time"
 */
function deriveProblemTitle(problemId: string, topicSlug: string, difficulty: string): string {
  const prefix = `${topicSlug}-${difficulty}-`;
  const tail = problemId.startsWith(prefix) ? problemId.slice(prefix.length) : problemId;
  return tail
    .split("-")
    .map((word, i) => {
      if (i > 0 && SMALL_WORDS.has(word)) return word;
      return word.charAt(0).toUpperCase() + word.slice(1);
    })
    .join(" ")
    .replace(/\bVs\b/g, "vs");
}

function deriveTopicTitle(topicSlug: string): string {
  return topicSlug
    .split("-")
    .map((w, i) => (i > 0 && SMALL_WORDS.has(w) ? w : w.charAt(0).toUpperCase() + w.slice(1)))
    .join(" ");
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

  return (
    <TopicPageLayout aside={[]}>
      <TopicHeader eyebrow={eyebrow} title={title.toUpperCase()} subtitle="" />

      {/* Problem statement renders as the page lead, not as a numbered section,
          so we don't duplicate the title content under a "The problem" header. */}
      <p className="mt-6 mb-2 text-base leading-relaxed text-neutral-100 whitespace-pre-line">
        {strings.statement}
      </p>

      <EquationRail locale={locale} equationSlugs={problem.equationSlugs} />

      <Section index={1} title="Step-by-step solution">
        <p className="text-sm text-neutral-400 mb-4">
          Work through one named subgoal at a time. Each step is checked deterministically against the canonical solver — no AI required to verify correctness. Get an AI explanation when you&apos;re stuck.
        </p>
        <StepPad problem={problem} strings={strings} />
      </Section>

      <Section index={2} title="Try it with AI">
        <p className="text-sm text-neutral-400 mb-3">
          Continue the conversation with the Physics tutor — the problem context is pre-loaded.
        </p>
        <Link
          href={`/${locale}/ask?seed=${encodeURIComponent(strings.statement)}&topic=${problem.primaryTopicSlug}`}
          className="inline-block px-4 py-2 bg-cyan-600 hover:bg-cyan-500 rounded text-sm font-mono uppercase tracking-wider text-neutral-50"
        >
          Open in Physics.Ask
        </Link>
      </Section>

      <div className="mt-12 text-sm text-neutral-500">
        <Link
          href={`/${locale}/classical-mechanics/${topic}`}
          className="hover:text-cyan-400 underline-offset-2 hover:underline"
        >
          ← Back to {topicTitle}
        </Link>
      </div>
    </TopicPageLayout>
  );
}
