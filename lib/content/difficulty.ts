import type { ProblemDifficulty } from "./types";

/** Problem difficulty levels, easiest first. The one place this order is defined. */
export const DIFFICULTY_ORDER: readonly ProblemDifficulty[] = [
  "easy",
  "medium",
  "hard",
  "challenge",
  "exam",
];

/**
 * Colour for each level, as a CSS custom property name (defined per theme
 * in `app/globals.css`). The scale warms as it gets harder (green → amber →
 * orange → red); `exam` stands apart in purple because it marks a kind of
 * problem, not one step harder.
 */
export const DIFFICULTY_COLOR: Readonly<Record<ProblemDifficulty, string>> = {
  easy: "--difficulty-easy",
  medium: "--difficulty-medium",
  hard: "--difficulty-hard",
  challenge: "--difficulty-challenge",
  exam: "--difficulty-exam",
};

export function isProblemDifficulty(value: string): value is ProblemDifficulty {
  return (DIFFICULTY_ORDER as readonly string[]).includes(value);
}

/** Sort comparator: easiest first. */
export function compareByDifficulty(
  a: { difficulty: ProblemDifficulty },
  b: { difficulty: ProblemDifficulty },
): number {
  return DIFFICULTY_ORDER.indexOf(a.difficulty) - DIFFICULTY_ORDER.indexOf(b.difficulty);
}
