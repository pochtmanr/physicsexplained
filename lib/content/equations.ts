import type { Equation } from "./types";

/**
 * Structural metadata for every equation index page on the site.
 *
 * Localised prose (name, whatItSolves, whenToUse, whenNotTo, commonMistakes)
 * lives in messages/<locale>/equations/<slug>.json and is fetched via
 * getEquationStringsForLocale() in lib/problems/equation-strings.ts.
 *
 * Wave 3 orchestrator appends entries here based on the EQUATION_SLUGS
 * lists collected from Wave 2 topic agents.
 */
export const EQUATIONS: readonly Equation[] = [
  // Wave 3 orchestrator appends entries here.
];

export function getEquation(slug: string): Equation | undefined {
  return EQUATIONS.find((e) => e.slug === slug);
}

export function getEquationsForTopic(topicSlug: string): readonly Equation[] {
  return EQUATIONS.filter((e) => e.relatedTopicSlugs.includes(topicSlug));
}
