// scripts/content/parse-mdx.ts
import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkMdx from "remark-mdx";
import remarkMath from "remark-math";
import { visit } from "unist-util-visit";
import JSON5 from "json5";
import { create, all } from "mathjs";
import type { Block, Inline, FigureContent, CalloutVariant } from "@/lib/content/blocks";

// Evaluator for simple arithmetic expressions used in JSX props
// (e.g. `theta0={(10 * Math.PI) / 180}`). mathjs has no access to the host
// environment's globals — safe for trusted content sources.
const mathEval = create(all, {});

function tryEvalNumber(raw: unknown): number | null {
  if (typeof raw !== "string") return null;
  // Translate `Math.PI` / `Math.E` into mathjs-native constants.
  const src = raw.replace(/\bMath\.PI\b/g, "pi").replace(/\bMath\.E\b/g, "e");
  try {
    const v = mathEval.evaluate(src);
    return typeof v === "number" && Number.isFinite(v) ? v : null;
  } catch {
    return null;
  }
}

export interface ParsedDoc {
  title: string;
  subtitle: string;
  eyebrow?: string;
  blocks: Block[];
  asideBlocks: Block[];
  aside?: unknown[];
}

export function parseMdx(source: string): ParsedDoc {
  const tree = unified()
    .use(remarkParse)
    .use(remarkMdx)
    .use(remarkMath)
    .parse(source);

  let title = "";
  let subtitle = "";
  let eyebrow: string | undefined;
  let aside: unknown[] | undefined;
  const asideBlocks: Block[] = [];

  // First pass: pull TopicHeader + TopicPageLayout props out as metadata.
  visit(tree, (node: any) => {
    if (node.type === "mdxJsxFlowElement" && node.name === "TopicHeader") {
      for (const attr of node.attributes ?? []) {
        const val = typeof attr.value === "string"
          ? attr.value
          : attr.value?.value;
        if (attr.name === "title")    title = String(val ?? "");
        if (attr.name === "subtitle") subtitle = String(val ?? "");
        if (attr.name === "eyebrow")  eyebrow  = String(val ?? "");
      }
    }
    if (node.type === "mdxJsxFlowElement" && node.name === "TopicPageLayout") {
      const extracted = extractAside(node);
      if (extracted) aside = extracted;
    }
  });

  // Second pass: convert top-level flow children into Blocks, skipping chrome.
  const blocks: Block[] = [];
  mapFlowChildren(tree.children as any[], blocks);

  const doc: ParsedDoc = { title, subtitle, eyebrow, blocks, asideBlocks };
  if (aside) doc.aside = aside;
  return doc;
}

function extractAside(node: any): unknown[] | undefined {
  for (const attr of node.attributes ?? []) {
    if (attr.name !== "aside") continue;
    const raw = typeof attr.value === "string" ? attr.value : attr.value?.value;
    if (typeof raw !== "string") return undefined;
    try {
      const parsed = JSON5.parse(raw);
      return Array.isArray(parsed) ? parsed : undefined;
    } catch {
      return undefined;
    }
  }
  return undefined;
}

// Descend into a list of flow children, flattening transparent wrappers
// (TopicPageLayout, bare <div>) into the caller's block list.
function mapFlowChildren(children: any[] | undefined, out: Block[]): void {
  for (const child of children ?? []) {
    const mapped = mapFlowNode(child);
    if (Array.isArray(mapped)) {
      out.push(...mapped);
    } else if (mapped) {
      out.push(mapped);
    }
  }
}

function mapFlowNode(node: any): Block | Block[] | null {
  // MDX comment / expression / ESM imports at top level — skip.
  if (node.type === "mdxFlowExpression") return null;
  if (node.type === "mdxjsEsm") return null;
  // Chrome tags — drop.
  if (node.type === "mdxJsxFlowElement") {
    if (node.name === "TopicHeader") return null;
    // Transparent wrappers — flatten their children into the parent flow.
    if (node.name === "TopicPageLayout" || node.name === "div") {
      const inner: Block[] = [];
      mapFlowChildren(node.children, inner);
      return inner;
    }
    if (node.name === "Section") return mapSection(node);
    if (node.name === "EquationBlock") return mapEquationBlock(node);
    if (node.name === "SceneCard") return mapSceneCard(node);
    if (node.name === "Callout") return mapCallout(node);
    if (node.name === "table") return mapTable(node);
    throw new Error(`unknown top-level JSX: <${node.name}>`);
  }
  if (node.type === "paragraph") return { type: "paragraph", inlines: mapInlines(node.children) };
  if (node.type === "math")      return { type: "equation", tex: String(node.value ?? "") };
  return null;
}

function mapSection(node: any): Block {
  const index = Number(getAttr(node, "index") ?? 0);
  const title = String(getAttr(node, "title") ?? "");
  const children: Block[] = [];
  mapFlowChildren(node.children, children);
  return { type: "section", index, title, children };
}

function mapEquationBlock(node: any): Block {
  const id = getAttr(node, "id") as string | undefined;
  // 1) Prefer explicit attribute: `<EquationBlock tex="..." />` or `latex="..."`.
  const attrTex =
    (getAttr(node, "tex") as string | undefined) ??
    (getAttr(node, "latex") as string | undefined);
  let tex = typeof attrTex === "string" ? attrTex : "";
  let prose = "";
  // 2) Walk children. Accept block `math` OR `inlineMath` (the most common
  //    shape in production MDX, where authors write `$$ ... $$` indented
  //    inside the JSX tag and remark-math parses it as inline math wrapped
  //    in a paragraph). Recurse one level into paragraphs to catch it.
  for (const child of node.children ?? []) {
    if (tex) break;
    if (child.type === "math" || child.type === "inlineMath") {
      tex = String(child.value ?? "");
      continue;
    }
    if (child.type === "paragraph") {
      for (const grand of child.children ?? []) {
        if (grand.type === "inlineMath" || grand.type === "math") {
          tex = String(grand.value ?? "");
          break;
        }
      }
      if (tex) continue;
    }
  }
  // 3) Fallback prose (when no math anywhere): collect text from children.
  if (!tex) {
    for (const child of node.children ?? []) {
      const txt = collectText(child);
      if (txt) prose += txt;
    }
  }
  const block: Block = { type: "equation", id, tex };
  if (!tex) {
    const trimmed = prose.trim();
    if (trimmed) block.prose = trimmed;
  }
  return block;
}

function mapSceneCard(node: any): Block {
  const caption = getAttr(node, "caption") as string | undefined;
  let content: FigureContent | null = null;
  for (const child of node.children ?? []) {
    if (child.type === "mdxJsxFlowElement") {
      if (child.name === "img") {
        content = {
          kind: "image",
          src: String(getAttr(child, "src") ?? ""),
          alt: String(getAttr(child, "alt") ?? ""),
        };
      } else {
        content = {
          kind: "simulation",
          component: String(child.name),
          props: collectProps(child),
        };
      }
    }
  }
  if (!content) throw new Error("SceneCard with no child image or simulation");
  return { type: "figure", caption, content };
}

// MDX wraps single-line JSX inside a `paragraph` node when the tag appears on
// a line with prose-like content (e.g. `<tr><th>…</th></tr>` on one line).
// Flatten those wrappers and return only JSX element children, regardless of
// whether they're flow or text variants. Tags like <tr> at block position
// come through as mdxJsxFlowElement; when nested inline they arrive as
// mdxJsxTextElement — we accept both.
function flattenTableChildren(children: any[] | undefined): any[] {
  const out: any[] = [];
  for (const child of children ?? []) {
    if (!child) continue;
    if (child.type === "paragraph") {
      out.push(...flattenTableChildren(child.children));
    } else if (child.type === "mdxJsxFlowElement" || child.type === "mdxJsxTextElement") {
      out.push(child);
    }
  }
  return out;
}

function mapTableRow(tr: any): Inline[][] {
  return flattenTableChildren(tr.children)
    .filter((c: any) => c.name === "th" || c.name === "td")
    .map((c: any) => mapInlines(c.children ?? []));
}

function mapTable(node: any): Block {
  let header: Inline[][] | undefined;
  const rows: Inline[][][] = [];
  for (const child of flattenTableChildren(node.children)) {
    if (child.name === "thead") {
      for (const hr of flattenTableChildren(child.children)) {
        if (hr.name === "tr") header = mapTableRow(hr);
      }
    } else if (child.name === "tbody") {
      for (const tr of flattenTableChildren(child.children)) {
        if (tr.name === "tr") rows.push(mapTableRow(tr));
      }
    } else if (child.name === "tr") {
      // Tables without tbody — treat as body row.
      rows.push(mapTableRow(child));
    }
  }
  return { type: "table", header, rows };
}

function mapCallout(node: any): Block {
  const variant = (getAttr(node, "variant") ?? "aside") as CalloutVariant;
  const children: Block[] = [];
  mapFlowChildren(node.children, children);
  return { type: "callout", variant, children };
}

function mapInlines(nodes: any[]): Inline[] {
  const out: Inline[] = [];
  for (const n of nodes ?? []) {
    if (n.type === "text")      out.push(String(n.value));
    else if (n.type === "emphasis")     out.push({ kind: "em",     inlines: mapInlines(n.children) });
    else if (n.type === "strong")       out.push({ kind: "strong", inlines: mapInlines(n.children) });
    else if (n.type === "inlineCode")   out.push({ kind: "code",   text: String(n.value) });
    else if (n.type === "inlineMath")   out.push({ kind: "formula", tex: String(n.value) });
    else if (n.type === "link")         out.push({ kind: "link",   href: String(n.url), text: collectText(n) });
    else if (n.type === "mdxJsxTextElement" && n.name === "PhysicistLink") {
      out.push({
        kind: "physicist",
        slug: String(getAttr(n, "slug") ?? ""),
        text: collectText(n),
      });
    } else if (n.type === "mdxJsxTextElement" && n.name === "Term") {
      out.push({
        kind: "term",
        slug: String(getAttr(n, "slug") ?? ""),
        text: collectText(n) || undefined,
      });
    } else if (n.children) {
      // Fallback: flatten unknown inline wrappers.
      out.push(...mapInlines(n.children));
    }
  }
  return out;
}

function collectText(node: any): string {
  if (node.type === "text") return String(node.value);
  if (!node.children) return "";
  return (node.children as any[]).map(collectText).join("");
}

function getAttr(node: any, name: string): unknown {
  for (const a of node.attributes ?? []) {
    if (a.name !== name) continue;
    if (typeof a.value === "string") return a.value;
    // Expression attribute — try its static value.
    return a.value?.value ?? undefined;
  }
  return undefined;
}

function collectProps(node: any): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const a of node.attributes ?? []) {
    if (!a.name) continue;
    if (typeof a.value === "string") { out[a.name] = a.value; continue; }
    // Expression attribute. Short-value forms first.
    const raw = a.value?.value;
    if (raw === undefined) { out[a.name] = true; continue; }
    const num = Number(raw);
    if (Number.isFinite(num)) { out[a.name] = num; continue; }
    if (typeof raw === "string") {
      const trimmed = raw.trim();
      if (trimmed === "true")  { out[a.name] = true;  continue; }
      if (trimmed === "false") { out[a.name] = false; continue; }
      const evaluated = tryEvalNumber(trimmed);
      if (evaluated !== null) { out[a.name] = evaluated; continue; }
    }
    out[a.name] = raw;
  }
  return out;
}
