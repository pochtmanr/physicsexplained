// Pure helpers for the scene-catalog generator, split from
// generate-scene-catalog.ts so tests can import them without triggering the
// script's main() (glob + DB sync).
import type { Block } from "@/lib/content/blocks";

export interface MdxFigure {
  component: string;
  caption: string;
  props: Record<string, unknown>;
  topicSlug: string;
  sourceTitle: string;
}

/** Recursively collect simulation figures from parsed blocks (figures nest inside sections and callouts). */
export function collectSimulationFigures(
  blocks: Block[],
  topicSlug: string,
  sourceTitle: string,
  out: MdxFigure[] = [],
): MdxFigure[] {
  for (const block of blocks) {
    if (block.type === "figure" && block.content?.kind === "simulation") {
      out.push({
        component: block.content.component,
        caption: (block.caption ?? "").trim(),
        props: block.content.props ?? {},
        topicSlug,
        sourceTitle,
      });
    } else if (block.type === "section" || block.type === "callout") {
      collectSimulationFigures(block.children ?? [], topicSlug, sourceTitle, out);
    }
  }
  return out;
}

/** "FIG.13b — concentric B-field rings…" → { figLabel: "FIG.13b", rest: "concentric B-field rings…" } */
export function splitFigCaption(caption: string): { figLabel: string | null; rest: string } {
  const m = /^\s*(FIG\.\s?[0-9]+[a-z]?)\s*[—–-]+\s*(.*)$/su.exec(caption);
  if (!m) return { figLabel: null, rest: caption.trim() };
  return { figLabel: m[1].replace(/\s/g, ""), rest: m[2].trim() };
}

/** "StraightWireFieldScene" → "Straight wire field" */
export function humanizeSceneId(id: string): string {
  const words = id
    .replace(/Scene$/, "")
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .replace(/([A-Z]+)([A-Z][a-z])/g, "$1 $2")
    .split(" ");
  return words
    .map((w, i) => (i === 0 ? w : /^[A-Z]{2,}$/.test(w) ? w : w.toLowerCase()))
    .join(" ");
}

export function truncate(s: string, max: number): string {
  if (s.length <= max) return s;
  return s.slice(0, max - 1).trimEnd() + "…";
}
