import Link from "next/link";
import { getProblemsForTopic } from "@/lib/content/problems";
import { deriveProblemTitle } from "@/lib/content/problem-title";

const DIFFICULTY_LABEL: Record<string, string> = {
  easy: "Easy",
  medium: "Medium",
  hard: "Hard",
  challenge: "Challenge",
  exam: "Exam",
};
const DIFFICULTY_ORDER = [
  "easy",
  "medium",
  "hard",
  "challenge",
  "exam",
] as const;

interface Props {
  topicSlug: string;
  branchSlug: string;
  locale: string;
}

export async function ProblemsSection({
  topicSlug,
  branchSlug,
  locale,
}: Props) {
  const problems = [...getProblemsForTopic(topicSlug)].sort(
    (a, b) =>
      DIFFICULTY_ORDER.indexOf(a.difficulty) -
      DIFFICULTY_ORDER.indexOf(b.difficulty),
  );
  if (problems.length === 0) return null;

  return (
    <section className="my-12">
      <div className="font-mono text-xs uppercase tracking-wider text-[var(--color-cyan-dim)]">
        Problems
      </div>
      <h2 className="mt-2 mb-6 text-xl uppercase tracking-tight text-[var(--color-fg-0)] md:text-2xl">
        Practice on this topic
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 [&>*]:-mt-px [&>*]:-ms-px">
        {problems.map((problem) => {
          const isCrossTopic = problem.primaryTopicSlug !== topicSlug;
          const name = deriveProblemTitle(
            problem.id,
            problem.primaryTopicSlug,
            problem.difficulty,
          );
          return (
            <Link
              key={problem.id}
              href={`/${locale}/${branchSlug}/${problem.primaryTopicSlug}/problems/${problem.id}`}
              className="group relative flex h-full flex-col gap-2 border border-[var(--color-fg-4)] p-3 transition-[border-color,box-shadow] duration-[240ms] ease-out hover:z-10 hover:border-[var(--color-cyan)] hover:shadow-[0_0_0_1px_color-mix(in_srgb,var(--color-cyan)_28%,transparent)]"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="inline-block border border-[var(--color-cyan-dim)] px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider text-[var(--color-cyan-dim)]">
                  {DIFFICULTY_LABEL[problem.difficulty]}
                </span>
                <span
                  aria-hidden="true"
                  className="text-base leading-none text-[var(--color-fg-3)] transition-all duration-[240ms] ease-out group-hover:-rotate-45 group-hover:text-[var(--color-cyan)] rtl:-scale-x-100 rtl:group-hover:rotate-45"
                >
                  →
                </span>
              </div>
              <div className="text-sm leading-snug text-[var(--color-fg-0)] transition-colors group-hover:text-[var(--color-cyan)]">
                {name}
              </div>
              {isCrossTopic && (
                <div className="font-mono text-[10px] uppercase tracking-wider text-[var(--color-fg-3)]">
                  Cross-topic
                </div>
              )}
            </Link>
          );
        })}
      </div>
    </section>
  );
}
