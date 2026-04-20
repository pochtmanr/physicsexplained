// Block + Inline types for structured content.
// See docs/superpowers/specs/2026-04-20-content-to-supabase-hybrid-design.md

export type CalloutVariant = "intuition" | "math" | "warning";

export type Inline =
  | string
  | { kind: "em"; inlines: Inline[] }
  | { kind: "strong"; inlines: Inline[] }
  | { kind: "code"; text: string }
  | { kind: "formula"; tex: string }
  | { kind: "link"; href: string; text: string }
  | { kind: "term"; slug: string; text?: string }
  | { kind: "physicist"; slug: string; text?: string };

export type FigureContent =
  | { kind: "image"; src: string; alt: string }
  | { kind: "simulation"; component: string; props?: Record<string, unknown> };

export type Block =
  | { type: "section"; index: number; title: string; children: Block[] }
  | { type: "heading"; level: 3 | 4; text: string }
  | { type: "paragraph"; inlines: Inline[] }
  | { type: "equation"; id?: string; tex: string }
  | { type: "figure"; caption?: string; content: FigureContent }
  | { type: "callout"; variant: CalloutVariant; children: Block[] }
  | { type: "list"; ordered: boolean; items: Inline[][] }
  | { type: "table"; header?: Inline[][]; rows: Inline[][][] };

const BLOCK_TYPES = new Set<Block["type"]>([
  "section", "heading", "paragraph", "equation", "figure", "callout", "list", "table",
]);

const INLINE_KINDS = new Set([
  "em", "strong", "code", "formula", "link", "term", "physicist",
]);

export function isBlock(value: unknown): value is Block {
  if (typeof value !== "object" || value === null) return false;
  const t = (value as { type?: unknown }).type;
  return typeof t === "string" && BLOCK_TYPES.has(t as Block["type"]);
}

export function isInline(value: unknown): value is Inline {
  if (typeof value === "string") return true;
  if (typeof value !== "object" || value === null) return false;
  const k = (value as { kind?: unknown }).kind;
  return typeof k === "string" && INLINE_KINDS.has(k);
}
