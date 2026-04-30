export const MAX_DESCRIPTION_LENGTH = 155;

interface DescriptionEntry {
  subtitle: string | null;
  blocks: Array<{ type: string; inlines?: unknown[] }>;
  meta?: { seoDescription?: unknown };
}

function stripMarkdown(s: string): string {
  return s
    .replace(/\*\*(.+?)\*\*/g, "$1")
    .replace(/\*(.+?)\*/g, "$1")
    .replace(/_(.+?)_/g, "$1")
    .replace(/`(.+?)`/g, "$1")
    .replace(/\$\$(.+?)\$\$/g, "")
    .replace(/\$(.+?)\$/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function truncate(s: string, max: number): string {
  if (s.length <= max) return s;
  const sliced = s.slice(0, max - 1);
  const lastSpace = sliced.lastIndexOf(" ");
  const cutAt = lastSpace > max * 0.6 ? lastSpace : max - 1;
  return `${sliced.slice(0, cutAt).trimEnd()}…`;
}

export function extractDescription(entry: DescriptionEntry): string {
  const override = entry.meta?.seoDescription;
  if (typeof override === "string" && override.trim().length > 0) {
    return override.trim();
  }
  if (entry.subtitle && entry.subtitle.trim().length > 0) {
    return entry.subtitle.trim();
  }
  for (const block of entry.blocks) {
    if (block.type !== "paragraph") continue;
    const first = block.inlines?.[0];
    if (typeof first !== "string") continue;
    const cleaned = stripMarkdown(first);
    if (cleaned.length === 0) continue;
    return truncate(cleaned, MAX_DESCRIPTION_LENGTH);
  }
  return "";
}
