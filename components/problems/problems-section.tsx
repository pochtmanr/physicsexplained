import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { Reveal } from "@/components/layout/reveal";
import { DifficultyChip } from "@/components/problems/difficulty-chip";
import { compareByDifficulty } from "@/lib/content/difficulty";
import { getProblemsForTopic } from "@/lib/content/problems";
import { deriveProblemTitle } from "@/lib/content/problem-title";

interface Props {
  topicSlug: string;
  branchSlug: string;
  locale: string;
}

/** Practice problems for a topic, easiest first, as a row of linked cards. */
export async function ProblemsSection({ topicSlug, branchSlug, locale }: Props) {
  const problems = [...getProblemsForTopic(topicSlug)].sort(compareByDifficulty);
  if (problems.length === 0) return null;
  const t = await getTranslations({ locale, namespace: "common.problems" });

  return (
    <section className="my-12">
      <div className="font-mono text-xs uppercase tracking-wider text-[var(--color-cyan-dim)]">
        {t("eyebrow")}
      </div>
      <h2 className="mt-2 mb-6 text-xl uppercase tracking-tight text-[var(--color-fg-0)] md:text-2xl">
        {t("heading")}
      </h2>
      {/* Cards share their borders: each one overlaps its neighbours by 1px. */}
      <div className="grid grid-cols-1 ps-px pt-px md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 [&>*]:-ms-px [&>*]:-mt-px">
        {problems.map((problem, i) => {
          const isCrossTopic = problem.primaryTopicSlug !== topicSlug;
          const name = deriveProblemTitle(
            problem.id,
            problem.primaryTopicSlug,
            problem.difficulty,
          );
          return (
            <Reveal key={problem.id} index={i}>
              <Link
                href={`/${locale}/${branchSlug}/${problem.primaryTopicSlug}/problems/${problem.id}`}
                className="group relative flex h-full flex-col md:min-h-24 gap-3 border border-[var(--color-fg-4)] p-3 outline-none transition-[border-color,box-shadow,background-color,transform] duration-[var(--duration-fast)] ease-[var(--ease-standard)] hover:z-10 hover:border-[var(--color-cyan)] hover:bg-[color-mix(in_srgb,var(--color-cyan)_5%,transparent)] hover:shadow-[0_0_0_1px_color-mix(in_srgb,var(--color-cyan)_28%,transparent)] focus-visible:z-10 focus-visible:border-[var(--color-cyan)] focus-visible:ring-2 focus-visible:ring-[var(--color-cyan)]/50 active:translate-y-px motion-reduce:transition-none"
              >
                <div className="flex items-center justify-between gap-2">
                  <DifficultyChip
                    difficulty={problem.difficulty}
                    label={t(`difficulty.${problem.difficulty}`)}
                  />
                  <ArrowRight
                    aria-hidden="true"
                    size={14}
                    strokeWidth={1.6}
                    className="shrink-0 text-[var(--color-fg-3)] transition-[transform,color] duration-[var(--duration-fast)] ease-[var(--ease-standard)] group-hover:-rotate-45 group-hover:text-[var(--color-cyan)] group-focus-visible:-rotate-45 group-focus-visible:text-[var(--color-cyan)] motion-reduce:transition-none rtl:-scale-x-100 rtl:group-hover:rotate-45 rtl:group-focus-visible:rotate-45"
                  />
                </div>
                <div className="text-sm leading-snug text-[var(--color-fg-0)]">{name}</div>
                {isCrossTopic && (
                  <div className="mt-auto font-mono text-[10px] uppercase tracking-wider text-[var(--color-fg-2)]">
                    {t("crossTopic")}
                  </div>
                )}
              </Link>
            </Reveal>
          );
        })}
      </div>
    </section>
  );
}
