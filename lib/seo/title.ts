export const MAX_TITLE_LENGTH = 60;
const SUFFIX = "physics";

interface TitleEntry {
  title: string;
  meta?: { seoTitle?: unknown };
}

interface BranchLike {
  title: string;
}

function toTitleCase(s: string): string {
  // Source titles like "THE SIMPLE PENDULUM" → "The Simple Pendulum"
  if (s !== s.toUpperCase()) return s;
  return s
    .toLowerCase()
    .replace(/\b\w/g, (c) => c.toUpperCase())
    .replace(/\b(A|An|The|Of|And|To|In|On|For|At|By|With)\b/g, (m, _, idx) =>
      idx === 0 ? m : m.toLowerCase(),
    );
}

export function buildTitle(entry: TitleEntry, branch: BranchLike | null): string {
  const override = entry.meta?.seoTitle;
  if (typeof override === "string" && override.trim().length > 0) {
    return override;
  }
  const topic = toTitleCase(entry.title);
  const branchTitle = branch ? toTitleCase(branch.title) : null;

  if (branchTitle) {
    const full = `${topic} — ${branchTitle} — ${SUFFIX}`;
    if (full.length <= MAX_TITLE_LENGTH) return full;
  }

  const noBranch = `${topic} — ${SUFFIX}`;
  if (noBranch.length <= MAX_TITLE_LENGTH) return noBranch;

  return topic;
}
