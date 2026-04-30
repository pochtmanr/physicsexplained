/**
 * Derive a human-readable Title-Case name from a problem id.
 *
 * Problem ids encode `<topic-slug>-<difficulty>-<descriptive-tail>`. The
 * topic + difficulty prefix is redundant when the problem is already shown
 * in the context of its topic page (or alongside a difficulty pill), so we
 * strip the prefix and Title-Case the tail.
 *
 * Example:
 *   id        = "motion-in-a-straight-line-easy-distance-from-velocity-time"
 *   topicSlug = "motion-in-a-straight-line"
 *   difficulty = "easy"
 *   → "Distance from Velocity-Time"
 */
const SMALL_WORDS = new Set([
  "a", "an", "and", "as", "at", "but", "by", "for", "from",
  "in", "of", "on", "or", "the", "to", "vs", "with",
]);

export function deriveProblemTitle(
  problemId: string,
  topicSlug: string,
  difficulty: string,
): string {
  const prefix = `${topicSlug}-${difficulty}-`;
  const tail = problemId.startsWith(prefix)
    ? problemId.slice(prefix.length)
    : problemId;
  return tail
    .split("-")
    .map((word, i) => {
      if (i > 0 && SMALL_WORDS.has(word)) return word;
      return word.charAt(0).toUpperCase() + word.slice(1);
    })
    .join(" ")
    .replace(/\bVs\b/g, "vs");
}

export function deriveTopicTitle(topicSlug: string): string {
  return topicSlug
    .split("-")
    .map((w, i) =>
      i > 0 && SMALL_WORDS.has(w)
        ? w
        : w.charAt(0).toUpperCase() + w.slice(1),
    )
    .join(" ");
}
