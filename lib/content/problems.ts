import type { Problem } from "./types";

/**
 * Structural metadata for every problem on the site.
 *
 * Localised prose (statement, step prompts, hints, common mistakes,
 * walkthrough) lives in messages/<locale>/problems/<branch>/<topic>/<id>.json
 * and is fetched via getProblemStringsForLocale() in lib/problems/strings.ts.
 *
 * Wave 2 topic-authoring agents append their entries here. Each problem
 * entry must be backed by a vitest-validated solver at `solverPath`.
 */
export const PROBLEMS: readonly Problem[] = [
  // Wave 2 agents append their problems here.
];

export function getProblem(id: string): Problem | undefined {
  return PROBLEMS.find((p) => p.id === id);
}

export function getProblemsForTopic(topicSlug: string): readonly Problem[] {
  return PROBLEMS.filter(
    (p) =>
      p.primaryTopicSlug === topicSlug ||
      p.relatedTopicSlugs.includes(topicSlug),
  );
}

export function getProblemsByEquation(equationSlug: string): readonly Problem[] {
  return PROBLEMS.filter((p) => p.equationSlugs.includes(equationSlug));
}
