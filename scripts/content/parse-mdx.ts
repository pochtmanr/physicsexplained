// scripts/content/parse-mdx.ts
import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkMdx from "remark-mdx";
import remarkMath from "remark-math";
import { visit } from "unist-util-visit";
import type { Block, Inline, FigureContent, CalloutVariant } from "@/lib/content/blocks";

export interface ParsedDoc {
  title: string;
  subtitle: string;
  eyebrow?: string;
  blocks: Block[];
  asideBlocks: Block[];
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
      // aside={[...]} — optional. Leave asideBlocks empty for this fixture.
      // Later tasks (§Task 10) will cover aside parsing.
    }
  });

  // Second pass: convert top-level flow children into Blocks, skipping chrome.
  const blocks: Block[] = [];
  for (const child of (tree.children as any[]) ?? []) {
    const block = mapFlowNode(child);
    if (block) blocks.push(block);
  }

  return { title, subtitle, eyebrow, blocks, asideBlocks };
}

function mapFlowNode(node: any): Block | null {
  // MDX comment / expression at top level — skip.
  if (node.type === "mdxFlowExpression") return null;
  // Chrome tags — drop.
  if (node.type === "mdxJsxFlowElement") {
    if (node.name === "TopicHeader" || node.name === "TopicPageLayout") return null;
    if (node.name === "Section") return mapSection(node);
    if (node.name === "EquationBlock") return mapEquationBlock(node);
    if (node.name === "SceneCard") return mapSceneCard(node);
    if (node.name === "Callout") return mapCallout(node);
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
  for (const child of node.children ?? []) {
    const b = mapFlowNode(child);
    if (b) children.push(b);
  }
  return { type: "section", index, title, children };
}

function mapEquationBlock(node: any): Block {
  const id = getAttr(node, "id") as string | undefined;
  let tex = "";
  for (const child of node.children ?? []) {
    if (child.type === "math") tex = String(child.value ?? "");
  }
  return { type: "equation", id, tex };
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

function mapCallout(node: any): Block {
  const variant = (getAttr(node, "variant") ?? "aside") as CalloutVariant;
  const children: Block[] = [];
  for (const child of node.children ?? []) {
    const b = mapFlowNode(child);
    if (b) children.push(b);
  }
  return { type: "callout", variant, children };
}

function mapInlines(nodes: any[]): Inline[] {
  const out: Inline[] = [];
  for (const n of nodes ?? []) {
    if (n.type === "text")      out.push(String(n.value));
    else if (n.type === "emphasis")     out.push({ kind: "em",     text: collectText(n) });
    else if (n.type === "strong")       out.push({ kind: "strong", text: collectText(n) });
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
    // Simple numeric / boolean literals from expressions.
    const raw = a.value?.value;
    const num = Number(raw);
    out[a.name] = raw === undefined ? true : Number.isFinite(num) ? num : raw;
  }
  return out;
}
