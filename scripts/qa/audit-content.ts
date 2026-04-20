// scripts/qa/audit-content.ts
// Temporary: post-migration content audit.
// Compares representation A (raw MDX surface scan) against
// representation B (parser output, i.e. what the publish CLI writes to Supabase).
// Skips representation C (rendered HTML) — an earlier SQL pass already confirmed
// the dominant failure mode (all equation blocks have empty tex), so the HTML
// fetch is redundant for the current audit.
// Delete once the audit work is finished.
import "dotenv/config";
import { readFileSync } from "node:fs";
import path from "node:path";
import fg from "fast-glob";
import { parseMdx } from "../content/parse-mdx";
import type { Block, Inline } from "@/lib/content/blocks";

const ROOT = path.resolve(__dirname, "..", "..");

interface SourceCounts {
  sections: number;
  equationBlocks: number;
  equationBlocksWithDollarMath: number;
  equationBlocksWithSpanOnly: number;
  sceneCards: number;
  callouts: number;
  tables: number;
  dollarDisplayMath: number;
  inlineDollarMath: number;
  physicistLinks: number;
  terms: number;
  unknownCapitalJsx: string[];
  exprCaptions: string[];
  exprProps: string[];
}

interface BlockCounts {
  sections: number;
  equations: number;
  equationsEmpty: number;
  figures: number;
  figuresImage: number;
  figuresSimulation: number;
  callouts: number;
  tables: number;
  paragraphs: number;
  inlinePhysicist: number;
  inlineTerm: number;
  inlineFormula: number;
  unresolvedExprProps: Array<{ component: string; prop: string; raw: unknown }>;
  equationIds: string[];
  figureCaptions: string[];
}

function scanSource(src: string): SourceCounts {
  const c: SourceCounts = {
    sections: (src.match(/<Section\b/g) ?? []).length,
    equationBlocks: (src.match(/<EquationBlock\b/g) ?? []).length,
    equationBlocksWithDollarMath: 0,
    equationBlocksWithSpanOnly: 0,
    sceneCards: (src.match(/<SceneCard\b/g) ?? []).length,
    callouts: (src.match(/<Callout\b/g) ?? []).length,
    tables: (src.match(/<table\b/g) ?? []).length,
    // Count opening `$$` separately from closing — we want the count of
    // display math blocks, i.e. full `$$...$$` pairs.
    dollarDisplayMath: (src.match(/\$\$[\s\S]+?\$\$/g) ?? []).length,
    // Inline `$…$` outside of `$$…$$`. Rough count.
    inlineDollarMath: 0,
    physicistLinks: (src.match(/<PhysicistLink\b/g) ?? []).length,
    terms: (src.match(/<Term\b/g) ?? []).length,
    unknownCapitalJsx: [],
    exprCaptions: [],
    exprProps: [],
  };

  // EquationBlock shape scan
  const eqRe = /<EquationBlock\b[^>]*>([\s\S]*?)<\/EquationBlock>/g;
  for (const m of src.matchAll(eqRe)) {
    const inner = m[1];
    if (/\$\$[\s\S]+?\$\$/.test(inner)) c.equationBlocksWithDollarMath++;
    else if (/<span\b/.test(inner)) c.equationBlocksWithSpanOnly++;
  }

  // Inline $..$ — stripped of $$ pairs first
  const stripped = src.replace(/\$\$[\s\S]+?\$\$/g, "");
  c.inlineDollarMath = (stripped.match(/(?<!\$)\$[^\s$][^$\n]*?[^\s$]\$(?!\$)/g) ?? []).length;

  // Unknown capital JSX at top-level lines (heuristic)
  const known = new Set([
    "Section", "EquationBlock", "SceneCard", "Callout", "PhysicistLink", "Term",
    "TopicPageLayout", "TopicHeader", "img",
  ]);
  const topJsx = src.match(/^<([A-Z][A-Za-z0-9]*)/gm) ?? [];
  for (const t of topJsx) {
    const name = t.slice(1);
    if (!known.has(name)) c.unknownCapitalJsx.push(name);
  }

  // Expression captions on SceneCard (e.g. caption={`…${x}…`})
  for (const m of src.matchAll(/<SceneCard\b[^>]*caption=\{([\s\S]*?)\}/g)) {
    c.exprCaptions.push(m[1].slice(0, 100));
  }

  // Expression props on nested components (e.g. theta0={(10 * Math.PI) / 180})
  const propRe = /([A-Za-z][A-Za-z0-9]*)=\{(\s*(?:[^{}]|\{[^}]*\})*?)\}/g;
  for (const m of src.matchAll(propRe)) {
    const name = m[1];
    const raw = m[2].trim();
    // Skip simple numeric / bool / known-static attrs
    if (name === "aside") continue;
    if (name === "title" || name === "index" || name === "id") continue;
    if (/^-?\d+(\.\d+)?$/.test(raw) || raw === "true" || raw === "false") continue;
    // Skip JSX-tag expression attribute values (rare)
    if (/^</.test(raw)) continue;
    c.exprProps.push(`${name}={${raw.slice(0, 60)}}`);
  }

  return c;
}

function walkBlocks(blocks: Block[], c: BlockCounts, componentContext: string | null = null) {
  for (const b of blocks) {
    switch (b.type) {
      case "section":
        c.sections++;
        walkBlocks(b.children, c);
        break;
      case "equation":
        c.equations++;
        if (!b.tex || b.tex.trim() === "") c.equationsEmpty++;
        if (b.id) c.equationIds.push(b.id);
        break;
      case "figure":
        c.figures++;
        if (b.caption) c.figureCaptions.push(b.caption);
        if (b.content.kind === "image") c.figuresImage++;
        else {
          c.figuresSimulation++;
          const props = b.content.props ?? {};
          for (const [k, v] of Object.entries(props)) {
            if (typeof v === "string" && /[\(\)\*\+\/]|Math\./.test(v)) {
              c.unresolvedExprProps.push({ component: b.content.component, prop: k, raw: v });
            }
          }
        }
        break;
      case "callout":
        c.callouts++;
        walkBlocks(b.children, c);
        break;
      case "table":
        c.tables++;
        break;
      case "paragraph":
        c.paragraphs++;
        walkInlines(b.inlines, c);
        break;
      case "list":
        for (const item of b.items) walkInlines(item, c);
        break;
      default:
        break;
    }
  }
}

function walkInlines(ins: Inline[], c: BlockCounts) {
  for (const n of ins) {
    if (typeof n === "string") continue;
    switch (n.kind) {
      case "physicist": c.inlinePhysicist++; break;
      case "term":      c.inlineTerm++;      break;
      case "formula":   c.inlineFormula++;   break;
      case "em":
      case "strong":
        walkInlines(n.inlines, c);
        break;
      default:
        break;
    }
  }
}

function emptyBlockCounts(): BlockCounts {
  return {
    sections: 0, equations: 0, equationsEmpty: 0,
    figures: 0, figuresImage: 0, figuresSimulation: 0,
    callouts: 0, tables: 0, paragraphs: 0,
    inlinePhysicist: 0, inlineTerm: 0, inlineFormula: 0,
    unresolvedExprProps: [], equationIds: [], figureCaptions: [],
  };
}

interface Row {
  slug: string;
  locale: string;
  source: SourceCounts;
  parsed: BlockCounts;
  gaps: string[];
  parseError?: string;
}

function findGaps(src: SourceCounts, b: BlockCounts): string[] {
  const gaps: string[] = [];
  if (src.sections !== b.sections) {
    gaps.push(`sections ${src.sections}→${b.sections}`);
  }
  if (src.equationBlocks !== b.equations) {
    gaps.push(`eq-blocks ${src.equationBlocks}→${b.equations}`);
  }
  if (b.equationsEmpty > 0) {
    gaps.push(`eq-empty-tex ${b.equationsEmpty}/${b.equations}`);
  }
  if (src.sceneCards !== b.figures) {
    gaps.push(`figures ${src.sceneCards}→${b.figures}`);
  }
  if (src.callouts !== b.callouts) {
    gaps.push(`callouts ${src.callouts}→${b.callouts}`);
  }
  if (src.tables !== b.tables) {
    gaps.push(`tables ${src.tables}→${b.tables}`);
  }
  if (src.physicistLinks > 0 && b.inlinePhysicist === 0) {
    gaps.push(`physicist-inlines ${src.physicistLinks}→0`);
  }
  if (src.terms > 0 && b.inlineTerm === 0) {
    gaps.push(`term-inlines ${src.terms}→0`);
  }
  if (b.unresolvedExprProps.length > 0) {
    gaps.push(`expr-props ${b.unresolvedExprProps.length}`);
  }
  if (src.dollarDisplayMath > 0 && b.equations < src.equationBlocks + src.dollarDisplayMath) {
    gaps.push(`loose-$$-missed`);
  }
  if (src.unknownCapitalJsx.length > 0) {
    gaps.push(`unknown-jsx [${[...new Set(src.unknownCapitalJsx)].join(",")}]`);
  }
  return gaps;
}

function main() {
  const files = fg.sync("app/\\[locale\\]/\\(topics\\)/*/*/content.*.mdx", { cwd: ROOT });
  const rows: Row[] = [];

  for (const file of files) {
    const parts = file.split("/");
    const branch = parts[3];
    const topic = parts[4];
    const slug = `${branch}/${topic}`;
    const filename = path.basename(file);
    const m = filename.match(/^content\.([a-z]{2})\.mdx$/);
    const locale = m ? m[1] : "en";

    const src = readFileSync(path.join(ROOT, file), "utf8");
    const sourceCounts = scanSource(src);
    const parsed = emptyBlockCounts();

    let parseError: string | undefined;
    try {
      const doc = parseMdx(src);
      walkBlocks(doc.blocks, parsed);
    } catch (e) {
      parseError = (e as Error).message;
    }

    const gaps = parseError ? [`PARSE-ERROR: ${parseError}`] : findGaps(sourceCounts, parsed);
    rows.push({ slug, locale, source: sourceCounts, parsed, gaps, parseError });
  }

  // Print summary table (sorted by gap count descending)
  const sorted = rows.slice().sort((a, b) => b.gaps.length - a.gaps.length);

  console.log("\n=== AUDIT SUMMARY ===\n");
  console.log("| topic | locale | gaps |");
  console.log("|---|---|---|");
  for (const r of sorted) {
    if (r.gaps.length === 0) continue;
    console.log(`| ${r.slug} | ${r.locale} | ${r.gaps.join("; ")} |`);
  }

  // Aggregate global stats
  let totalEq = 0, emptyEq = 0, totalFig = 0, totalExpr = 0, totalTables = 0;
  const exprExamples = new Set<string>();
  for (const r of rows) {
    totalEq += r.parsed.equations;
    emptyEq += r.parsed.equationsEmpty;
    totalFig += r.parsed.figures;
    totalTables += r.parsed.tables;
    for (const e of r.parsed.unresolvedExprProps) {
      totalExpr++;
      exprExamples.add(`${e.component}.${e.prop}=${JSON.stringify(e.raw)}`);
    }
  }
  console.log(`\n=== GLOBAL ===\n`);
  console.log(`topics scanned: ${rows.length}`);
  console.log(`equation blocks: ${totalEq} total / ${emptyEq} with empty tex (${((emptyEq / totalEq) * 100).toFixed(1)}%)`);
  console.log(`figure blocks:   ${totalFig}`);
  console.log(`table blocks:    ${totalTables}`);
  console.log(`unresolved expression props: ${totalExpr}`);
  if (exprExamples.size > 0) {
    console.log(`  sample:`);
    for (const e of [...exprExamples].slice(0, 15)) console.log(`    - ${e}`);
  }

  // Expression captions across all topics
  const capExamples = new Map<string, number>();
  for (const r of rows) {
    for (const c of r.source.exprCaptions) {
      capExamples.set(c, (capExamples.get(c) ?? 0) + 1);
    }
  }
  if (capExamples.size > 0) {
    console.log(`\nexpression captions on SceneCard (parser's getAttr can't evaluate): ${[...capExamples.values()].reduce((a, b) => a + b, 0)}`);
    for (const [c, n] of [...capExamples.entries()].slice(0, 10)) console.log(`    - (×${n}) ${c}`);
  }

  // Unknown JSX names
  const unk = new Set<string>();
  for (const r of rows) for (const n of r.source.unknownCapitalJsx) unk.add(n);
  if (unk.size > 0) console.log(`\nunknown top-level JSX names across corpus: ${[...unk].join(", ")}`);

  // Emit EquationBlock-with-span-only counts (the main finding)
  let spanOnlyEq = 0, dollarEq = 0, totalEqSrc = 0;
  for (const r of rows) {
    spanOnlyEq += r.source.equationBlocksWithSpanOnly;
    dollarEq += r.source.equationBlocksWithDollarMath;
    totalEqSrc += r.source.equationBlocks;
  }
  console.log(`\n=== EQUATION BLOCK STRUCTURE (source MDX) ===`);
  console.log(`<EquationBlock> total:               ${totalEqSrc}`);
  console.log(`  with inner $$...$$ (parsed as tex): ${dollarEq}`);
  console.log(`  with only <span> / prose:           ${spanOnlyEq}`);
}

main();
