import Link from "next/link";
import { getProblemsForTopic } from "@/lib/content/problems";
import { getProblemStringsForLocale } from "@/lib/problems/strings";

const DIFFICULTY_LABEL: Record<string, string> = {
  easy: "Easy", medium: "Medium", hard: "Hard", challenge: "Challenge", exam: "Exam-style",
};
const DIFFICULTY_ORDER = ["easy", "medium", "hard", "challenge", "exam"] as const;

interface Props {
  topicSlug: string;
  branchSlug: string;
  locale: string;
}

export async function ProblemsSection({ topicSlug, branchSlug, locale }: Props) {
  const problems = [...getProblemsForTopic(topicSlug)].sort(
    (a, b) => DIFFICULTY_ORDER.indexOf(a.difficulty) - DIFFICULTY_ORDER.indexOf(b.difficulty),
  );
  if (problems.length === 0) return null;

  const teasers = await Promise.all(problems.map(async (p) => {
    const s = await getProblemStringsForLocale(p.id, locale);
    return { problem: p, statement: s?.statement ?? p.id };
  }));

  return (
    <section className="my-12">
      <h2 className="text-xl uppercase tracking-wider text-neutral-400 mb-4">Problems</h2>
      <div className="grid gap-3">
        {teasers.map(({ problem, statement }) => (
          <Link
            key={problem.id}
            href={`/${locale}/${branchSlug}/${problem.primaryTopicSlug}/problems/${problem.id}`}
            className="block border border-neutral-800 hover:border-cyan-700 rounded-lg p-4 transition"
          >
            <div className="flex items-baseline gap-3 mb-1">
              <span className="text-xs uppercase text-cyan-500">{DIFFICULTY_LABEL[problem.difficulty]}</span>
              {problem.primaryTopicSlug !== topicSlug && (
                <span className="text-xs text-neutral-500">cross-topic</span>
              )}
            </div>
            <p className="text-sm text-neutral-200 line-clamp-2">{statement}</p>
          </Link>
        ))}
      </div>
    </section>
  );
}
