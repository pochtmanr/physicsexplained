// Render structured content blocks as plain Markdown.
//
// Powers the LLM-facing surfaces (/llms-full.txt and the /md/* page mirrors):
// AI crawlers ingest clean Markdown far more reliably than hydrated HTML.
// Pure functions — no server-only imports, so unit tests stay trivial.

import type { Block, Inline } from "@/lib/content/blocks";

export interface MarkdownOptions {
  baseUrl: string;
}

export interface EntryLike {
  title: string;
  subtitle: string | null;
  blocks: Block[];
}

function slugToWords(slug: string): string {
  return slug.replace(/-/g, " ");
}

function absolutize(href: string, baseUrl: string): string {
  return href.startsWith("/") ? `${baseUrl}${href}` : href;
}

export function inlinesToMarkdown(inlines: Inline[], opts: MarkdownOptions): string {
  return inlines.map((inline) => inlineToMarkdown(inline, opts)).join("");
}

function inlineToMarkdown(inline: Inline, opts: MarkdownOptions): string {
  if (typeof inline === "string") return inline;
  switch (inline.kind) {
    case "em":
      return `*${inlinesToMarkdown(inline.inlines, opts)}*`;
    case "strong":
      return `**${inlinesToMarkdown(inline.inlines, opts)}**`;
    case "code":
      return `\`${inline.text}\``;
    case "formula":
      return `$${inline.tex}$`;
    case "link":
      return `[${inline.text}](${absolutize(inline.href, opts.baseUrl)})`;
    case "term":
      return `[${inline.text ?? slugToWords(inline.slug)}](${opts.baseUrl}/dictionary/${inline.slug})`;
    case "physicist":
      return `[${inline.text ?? slugToWords(inline.slug)}](${opts.baseUrl}/physicists/${inline.slug})`;
  }
}

function tableRow(cells: Inline[][], opts: MarkdownOptions): string {
  return `| ${cells.map((c) => inlinesToMarkdown(c, opts).replace(/\|/g, "\\|")).join(" | ")} |`;
}

function blockToMarkdown(block: Block, opts: MarkdownOptions): string {
  switch (block.type) {
    case "section":
      return [`## ${block.index}. ${block.title}`, blocksToMarkdown(block.children, opts)]
        .filter(Boolean)
        .join("\n\n");
    case "heading":
      return `${block.level === 3 ? "###" : "####"} ${block.text}`;
    case "paragraph":
      return inlinesToMarkdown(block.inlines, opts);
    case "equation": {
      const math = `$$\n${block.tex}\n$$`;
      return block.prose ? `${math}\n\n${block.prose}` : math;
    }
    case "figure": {
      const caption = block.caption ? `*${block.caption}*` : "";
      if (block.content.kind === "image") {
        const img = `![${block.content.alt}](${absolutize(block.content.src, opts.baseUrl)})`;
        return caption ? `${img}\n\n${caption}` : img;
      }
      const sim = `*[Interactive simulation: ${block.content.component} — view on the web page.]*`;
      return caption ? `${sim}\n\n${caption}` : sim;
    }
    case "callout": {
      const label = block.variant.charAt(0).toUpperCase() + block.variant.slice(1);
      const body = blocksToMarkdown(block.children, opts);
      const quoted = body
        .split("\n")
        .map((line) => (line ? `> ${line}` : ">"))
        .join("\n");
      return `> **${label}:**\n>\n${quoted}`;
    }
    case "list":
      return block.items
        .map((item, i) => {
          const marker = block.ordered ? `${i + 1}.` : "-";
          return `${marker} ${inlinesToMarkdown(item, opts)}`;
        })
        .join("\n");
    case "table": {
      const width = block.header?.length ?? block.rows[0]?.length ?? 0;
      const header = block.header
        ? tableRow(block.header, opts)
        : `| ${Array.from({ length: width }, () => " ").join(" | ")} |`;
      const separator = `| ${Array.from({ length: width }, () => "---").join(" | ")} |`;
      const rows = block.rows.map((r) => tableRow(r, opts));
      return [header, separator, ...rows].join("\n");
    }
  }
}

export function blocksToMarkdown(blocks: Block[], opts: MarkdownOptions): string {
  return blocks.map((b) => blockToMarkdown(b, opts)).join("\n\n");
}

/** Full Markdown document for a content entry, with a canonical-source footer. */
export function entryToMarkdown(
  entry: EntryLike,
  opts: MarkdownOptions & { url: string },
): string {
  const parts = [`# ${entry.title}`];
  if (entry.subtitle) parts.push(entry.subtitle);
  const body = blocksToMarkdown(entry.blocks, opts);
  if (body) parts.push(body);
  parts.push(`---\n\nSource: ${opts.url}`);
  return parts.join("\n\n") + "\n";
}
