// scripts/content/translate.ts
// Usage:
//   pnpm content:translate --locale he
//   pnpm content:translate --locale he --only classical-mechanics/turbulence
//   pnpm content:translate --locale he --dry-run
//   pnpm content:translate --locale he --retranslate
//   pnpm content:translate --locale he --limit 5
//   pnpm content:translate --locale he --model claude-sonnet-4-6
//
// Translates English `content_entries` rows into target locales by sending
// (title, subtitle, meta, blocks, aside_blocks) to Claude as JSON and
// upserting the response. Preserves the Block[] structure byte-for-byte on
// every non-text field; validates structural parity before writing.
import "dotenv/config";
import path from "node:path";
import { readFileSync } from "node:fs";
import Anthropic from "@anthropic-ai/sdk";
import { getServiceClient } from "@/lib/supabase-server";

const ROOT = path.resolve(__dirname, "..", "..");
const DEFAULT_MODEL = "claude-sonnet-4-6";

// --- CLI arg parsing -------------------------------------------------------

interface CliArgs {
  locale: string;
  only: string | null;
  dryRun: boolean;
  retranslate: boolean;
  limit: number | null;
  model: string;
}

function parseArgs(argv: string[]): CliArgs {
  const args = argv.slice(2);
  const get = (flag: string): string | null => {
    const i = args.indexOf(flag);
    return i >= 0 && i + 1 < args.length ? args[i + 1] : null;
  };
  const has = (flag: string) => args.includes(flag);

  const locale = get("--locale");
  if (!locale) {
    console.error("usage: pnpm content:translate --locale <code> [--only <slug>] [--dry-run] [--retranslate] [--limit N] [--model <id>]");
    process.exit(1);
  }

  const limitRaw = get("--limit");
  const limit = limitRaw ? parseInt(limitRaw, 10) : null;
  if (limitRaw && (!Number.isFinite(limit!) || limit! <= 0)) {
    console.error(`--limit must be a positive integer, got: ${limitRaw}`);
    process.exit(1);
  }

  return {
    locale,
    only: get("--only"),
    dryRun: has("--dry-run"),
    retranslate: has("--retranslate"),
    limit,
    model: get("--model") ?? DEFAULT_MODEL,
  };
}

// --- Locale + glossary -----------------------------------------------------

const LOCALE_NAMES: Record<string, string> = {
  he: "Hebrew",
  ru: "Russian",
  es: "Spanish",
  ar: "Arabic",
  fr: "French",
  de: "German",
  it: "Italian",
  pt: "Portuguese",
  ja: "Japanese",
  zh: "Chinese",
};

function localeName(code: string): string {
  return LOCALE_NAMES[code] ?? code;
}

/**
 * Build a glossary excerpt from messages/<locale>/{glossary,physicists}.json.
 * Each line is `english-slug → translated-term`, for the model to use as a
 * house-style reference. Returns "" if the files don't exist (non-Hebrew
 * locales that haven't been seeded yet).
 */
function buildGlossaryExcerpt(locale: string): string {
  const lines: string[] = [];
  const tryRead = (rel: string) => {
    try {
      return JSON.parse(readFileSync(path.join(ROOT, rel), "utf8")) as Record<string, unknown>;
    } catch {
      return null;
    }
  };

  const gloss = tryRead(`messages/${locale}/glossary.json`);
  if (gloss) {
    for (const [slug, entry] of Object.entries(gloss)) {
      if (entry && typeof entry === "object" && "term" in entry && typeof (entry as { term: unknown }).term === "string") {
        lines.push(`- ${slug} → ${(entry as { term: string }).term}`);
      }
    }
  }

  const phys = tryRead(`messages/${locale}/physicists.json`);
  if (phys) {
    for (const [slug, entry] of Object.entries(phys)) {
      if (entry && typeof entry === "object" && "name" in entry && typeof (entry as { name: unknown }).name === "string") {
        lines.push(`- ${slug} → ${(entry as { name: string }).name}`);
      }
    }
  }

  return lines.join("\n");
}

// --- System prompt ---------------------------------------------------------

function buildSystemPrompt(locale: string): string {
  const name = localeName(locale);
  const glossary = buildGlossaryExcerpt(locale);
  const glossarySection = glossary
    ? `HOUSE GLOSSARY (English → ${name}):\n${glossary}\n`
    : `HOUSE GLOSSARY: none provided. Use the most natural target-language equivalent used in physics textbooks.\n`;

  return `You are a physics-education translator. Translate English content to ${name}, preserving the exact JSON block structure given.

CRITICAL RULES:
1. Output MUST be valid JSON matching the schema of the input. Return ONLY a valid JSON object matching the input shape — no preamble, no trailing commentary, no markdown code fences.
2. Preserve every non-text field byte-for-byte: "type", "kind", "slug", "href", "src", "tex" (math is universal), "id", "component", "props", numeric values, "locale", "level", "index", "ordered", "variant".
3. Translate ONLY these fields:
   - Top level: "title", "subtitle", "meta.eyebrow" (if present). In "meta.aside" (if present), translate each entry's "label" (keep "type" and "href" as-is).
   - In "blocks[]":
     - section.title (and recurse into section.children)
     - heading.text
     - paragraph.inlines[] — translate bare strings; recurse into em.inlines and strong.inlines; translate link.text, term.text, physicist.text. NEVER touch term.slug, physicist.slug, link.href, formula.tex, or code.text.
     - equation.tex STAYS. equation.id STAYS.
     - figure.caption (translate). figure.content.image.alt (translate — it is accessibility prose). figure.content.image.src STAYS. figure.content.simulation.component and figure.content.simulation.props STAY.
     - callout.children[] — recurse.
     - list.items[][] — recurse inline arrays.
     - table.header[][] and table.rows[][][] — translate each cell's inline array.
4. Preserve "slug" on all term/physicist inline references — they are identifiers, not text.
5. For Hebrew and Arabic (RTL languages), write natural RTL text. Do NOT add any markup for RTL — the renderer handles layout and directionality.
6. Use the house-style glossary below for consistent terminology. If a term isn't in the glossary, use the most natural target-language equivalent used in physics textbooks.

${glossarySection}
STYLE:
- Educational but vivid — match the original's tone.
- Use standard physics terminology of the target language (not literal English transliteration).
- Proper nouns (Galileo, Newton) are translated only if there's a standard local form; otherwise keep as-is.
- Preserve inline array lengths where practical. Minor text-splitting differences (coalescing adjacent plain strings) are acceptable, but do not drop or invent structured inlines (em/strong/code/formula/link/term/physicist).

Output a single JSON object with exactly these top-level keys: "title", "subtitle", "meta", "blocks", "aside_blocks". If the input's "subtitle" is null, return null. If "meta" or "aside_blocks" are empty ({} or []), return them empty.`;
}

// --- JSON extraction + structural validation -------------------------------

function stripFences(s: string): string {
  // Strip ```json … ``` or ``` … ``` wrappers if the model added them.
  const trimmed = s.trim();
  const fenced = trimmed.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/i);
  if (fenced) return fenced[1].trim();
  return trimmed;
}

function extractJson(s: string): string {
  const stripped = stripFences(s);
  // If the model emitted some preamble, grab the first {...} block.
  if (stripped.startsWith("{")) return stripped;
  const first = stripped.indexOf("{");
  const last = stripped.lastIndexOf("}");
  if (first >= 0 && last > first) return stripped.slice(first, last + 1);
  return stripped;
}

const INLINE_KINDS_WITH_IDENTIFIERS = new Set(["link", "formula", "code"]);

interface ValidationResult {
  ok: boolean;
  errors: string[];
}

/**
 * Walks source + translation in parallel and reports any structural drift.
 * Used to gate the upsert — we never want to write a translation that
 * changed slugs, swapped block types, or dropped an equation.
 */
function validateStructuralParity(src: unknown, tr: unknown): ValidationResult {
  const errors: string[] = [];

  const isObj = (v: unknown): v is Record<string, unknown> =>
    typeof v === "object" && v !== null && !Array.isArray(v);

  if (!isObj(src) || !isObj(tr)) {
    return { ok: false, errors: ["top-level value is not an object on one side"] };
  }

  const TOP_KEYS = ["title", "subtitle", "meta", "blocks", "aside_blocks"];
  for (const k of TOP_KEYS) {
    if (!(k in tr)) errors.push(`missing top-level key: ${k}`);
  }

  const walkBlocks = (a: unknown, b: unknown, path: string) => {
    if (!Array.isArray(a) || !Array.isArray(b)) {
      errors.push(`${path}: expected array on both sides`);
      return;
    }
    if (a.length !== b.length) {
      errors.push(`${path}: length mismatch (src=${a.length}, tr=${b.length})`);
      return;
    }
    for (let i = 0; i < a.length; i++) {
      walkBlock(a[i], b[i], `${path}[${i}]`);
    }
  };

  const walkInlines = (a: unknown, b: unknown, path: string) => {
    if (!Array.isArray(a) || !Array.isArray(b)) {
      errors.push(`${path}: expected inlines array on both sides`);
      return;
    }
    // Inline arrays: coalesce adjacent plain strings so minor text splitting
    // doesn't trip the check. Structured inlines must match 1:1.
    const coalesce = (arr: unknown[]): unknown[] => {
      const out: unknown[] = [];
      for (const item of arr) {
        if (typeof item === "string" && typeof out[out.length - 1] === "string") {
          out[out.length - 1] = (out[out.length - 1] as string) + item;
        } else {
          out.push(item);
        }
      }
      return out;
    };
    const ac = coalesce(a);
    const bc = coalesce(b);
    // Compare structural inlines in order; allow string count to differ at
    // the extremes (leading/trailing splits) but require structured inlines
    // to align.
    const structuralA = ac.filter((x) => typeof x !== "string");
    const structuralB = bc.filter((x) => typeof x !== "string");
    if (structuralA.length !== structuralB.length) {
      errors.push(`${path}: structured inline count mismatch (src=${structuralA.length}, tr=${structuralB.length})`);
      return;
    }
    for (let i = 0; i < structuralA.length; i++) {
      const sa = structuralA[i] as Record<string, unknown>;
      const sb = structuralB[i] as Record<string, unknown>;
      if (sa?.kind !== sb?.kind) {
        errors.push(`${path}: inline #${i} kind mismatch (src=${String(sa?.kind)}, tr=${String(sb?.kind)})`);
        continue;
      }
      // Identifier preservation: slug, href, tex, code.text must match exactly.
      if (sa.kind === "term" || sa.kind === "physicist") {
        if (sa.slug !== sb.slug) errors.push(`${path}: inline #${i} ${String(sa.kind)}.slug changed (src=${String(sa.slug)}, tr=${String(sb.slug)})`);
      } else if (sa.kind === "link") {
        if (sa.href !== sb.href) errors.push(`${path}: inline #${i} link.href changed`);
      } else if (sa.kind === "formula") {
        if (sa.tex !== sb.tex) errors.push(`${path}: inline #${i} formula.tex changed`);
      } else if (sa.kind === "code") {
        if (sa.text !== sb.text) errors.push(`${path}: inline #${i} code.text changed`);
      } else if (sa.kind === "em" || sa.kind === "strong") {
        walkInlines(sa.inlines, sb.inlines, `${path}.inlines#${i}`);
      }
      // keep the 'kind' identifier check generic
      if (INLINE_KINDS_WITH_IDENTIFIERS.has(String(sa.kind)) && sa.kind !== sb.kind) {
        errors.push(`${path}: inline #${i} kind mutated`);
      }
    }
  };

  const walkBlock = (a: unknown, b: unknown, path: string) => {
    if (!isObj(a) || !isObj(b)) {
      errors.push(`${path}: block not an object`);
      return;
    }
    if (a.type !== b.type) {
      errors.push(`${path}: type mismatch (src=${String(a.type)}, tr=${String(b.type)})`);
      return;
    }
    switch (a.type) {
      case "section":
        if (a.index !== b.index) errors.push(`${path}: section.index changed`);
        walkBlocks(a.children, b.children, `${path}.children`);
        break;
      case "heading":
        if (a.level !== b.level) errors.push(`${path}: heading.level changed`);
        break;
      case "paragraph":
        walkInlines(a.inlines, b.inlines, `${path}.inlines`);
        break;
      case "equation":
        if (a.id !== b.id) errors.push(`${path}: equation.id changed (src=${String(a.id)}, tr=${String(b.id)})`);
        if (a.tex !== b.tex) errors.push(`${path}: equation.tex changed`);
        break;
      case "figure": {
        const ac = a.content as Record<string, unknown> | undefined;
        const bc = b.content as Record<string, unknown> | undefined;
        if (!ac || !bc || ac.kind !== bc.kind) {
          errors.push(`${path}: figure.content.kind changed`);
        } else if (ac.kind === "image") {
          if (ac.src !== bc.src) errors.push(`${path}: figure.image.src changed`);
        } else if (ac.kind === "simulation") {
          if (ac.component !== bc.component) errors.push(`${path}: figure.simulation.component changed`);
          if (JSON.stringify(ac.props ?? null) !== JSON.stringify(bc.props ?? null)) {
            errors.push(`${path}: figure.simulation.props changed`);
          }
        }
        break;
      }
      case "callout":
        if (a.variant !== b.variant) errors.push(`${path}: callout.variant changed`);
        walkBlocks(a.children, b.children, `${path}.children`);
        break;
      case "list":
        if (a.ordered !== b.ordered) errors.push(`${path}: list.ordered changed`);
        if (!Array.isArray(a.items) || !Array.isArray(b.items) || a.items.length !== b.items.length) {
          errors.push(`${path}: list.items length mismatch`);
        } else {
          for (let i = 0; i < a.items.length; i++) {
            walkInlines(a.items[i], b.items[i], `${path}.items[${i}]`);
          }
        }
        break;
      case "table": {
        const walk2d = (aa: unknown, bb: unknown, label: string) => {
          if (aa === undefined && bb === undefined) return;
          if (!Array.isArray(aa) || !Array.isArray(bb) || aa.length !== bb.length) {
            errors.push(`${path}: ${label} length mismatch`);
            return;
          }
          for (let i = 0; i < aa.length; i++) {
            walkInlines(aa[i], bb[i], `${path}.${label}[${i}]`);
          }
        };
        walk2d(a.header, b.header, "header");
        if (!Array.isArray(a.rows) || !Array.isArray(b.rows) || a.rows.length !== b.rows.length) {
          errors.push(`${path}: table.rows length mismatch`);
        } else {
          for (let i = 0; i < a.rows.length; i++) {
            walk2d(a.rows[i], b.rows[i], `rows[${i}]`);
          }
        }
        break;
      }
    }
  };

  walkBlocks(src.blocks, tr.blocks, "blocks");
  if (Array.isArray(src.aside_blocks) && src.aside_blocks.length > 0) {
    walkBlocks(src.aside_blocks, tr.aside_blocks, "aside_blocks");
  }

  // Ensure every term/physicist slug from the source survived into the translation.
  const collectSlugs = (blocks: unknown): Set<string> => {
    const slugs = new Set<string>();
    const visitInline = (inl: unknown) => {
      if (!isObj(inl)) return;
      if ((inl.kind === "term" || inl.kind === "physicist") && typeof inl.slug === "string") {
        slugs.add(`${inl.kind}:${inl.slug}`);
      }
      if (Array.isArray(inl.inlines)) inl.inlines.forEach(visitInline);
    };
    const visitBlock = (blk: unknown) => {
      if (!isObj(blk)) return;
      if (Array.isArray(blk.inlines)) blk.inlines.forEach(visitInline);
      if (Array.isArray(blk.children)) blk.children.forEach(visitBlock);
      if (Array.isArray(blk.items)) {
        for (const row of blk.items) if (Array.isArray(row)) row.forEach(visitInline);
      }
      if (Array.isArray(blk.header)) {
        for (const row of blk.header) if (Array.isArray(row)) row.forEach(visitInline);
      }
      if (Array.isArray(blk.rows)) {
        for (const row of blk.rows) if (Array.isArray(row)) for (const cell of row) if (Array.isArray(cell)) cell.forEach(visitInline);
      }
    };
    if (Array.isArray(blocks)) blocks.forEach(visitBlock);
    return slugs;
  };
  const srcSlugs = collectSlugs(src.blocks);
  const trSlugs = collectSlugs(tr.blocks);
  for (const s of srcSlugs) {
    if (!trSlugs.has(s)) errors.push(`inline slug dropped: ${s}`);
  }

  return { ok: errors.length === 0, errors };
}

// --- Row shape -------------------------------------------------------------

interface EnglishRow {
  kind: string;
  slug: string;
  locale: string;
  title: string;
  subtitle: string | null;
  blocks: unknown[];
  aside_blocks: unknown[];
  meta: Record<string, unknown>;
  source_hash: string | null;
}

interface TranslationPayload {
  title: string;
  subtitle: string | null;
  meta: Record<string, unknown>;
  blocks: unknown[];
  aside_blocks: unknown[];
}

// --- Claude call -----------------------------------------------------------

async function callClaude(
  client: Anthropic,
  model: string,
  systemPrompt: string,
  userPayload: Record<string, unknown>,
  maxTokens: number,
  extraInstruction?: string,
): Promise<{ text: string; usage: { input: number; output: number; cacheRead: number; cacheCreate: number } }> {
  const userText =
    (extraInstruction ? `${extraInstruction}\n\n` : "") +
    `Translate the following content. Return ONLY a valid JSON object with the same top-level shape (title, subtitle, meta, blocks, aside_blocks). No markdown fences, no prose.\n\n` +
    "```json\n" +
    JSON.stringify(userPayload) +
    "\n```";

  const response = await client.messages.create({
    model,
    max_tokens: maxTokens,
    temperature: 0.2,
    system: [
      {
        type: "text",
        text: systemPrompt,
        cache_control: { type: "ephemeral" },
      },
    ],
    messages: [{ role: "user", content: userText }],
  });

  const textBlocks = response.content.filter(
    (b): b is Extract<typeof response.content[number], { type: "text" }> => b.type === "text",
  );
  const text = textBlocks.map((b) => b.text).join("");
  const usage = {
    input: response.usage.input_tokens ?? 0,
    output: response.usage.output_tokens ?? 0,
    cacheRead: (response.usage as { cache_read_input_tokens?: number }).cache_read_input_tokens ?? 0,
    cacheCreate: (response.usage as { cache_creation_input_tokens?: number }).cache_creation_input_tokens ?? 0,
  };
  return { text, usage };
}

function pickMaxTokens(inputChars: number): number {
  // Rough heuristic: Hebrew/Russian etc. can inflate output a bit vs English.
  // Default to 8192; scale to 16384 for larger topics.
  return inputChars > 10_000 ? 16384 : 8192;
}

// --- Main ------------------------------------------------------------------

async function main() {
  const cli = parseArgs(process.argv);

  if (!cli.dryRun && !process.env.ANTHROPIC_API_KEY) {
    console.error("ANTHROPIC_API_KEY missing from env. Add it to .env and retry.");
    process.exit(1);
  }

  const supabase = getServiceClient();

  // Load English topic rows we might translate.
  let query = supabase
    .from("content_entries")
    .select("kind,slug,locale,title,subtitle,blocks,aside_blocks,meta,source_hash")
    .eq("kind", "topic")
    .eq("locale", "en")
    .order("slug", { ascending: true });
  if (cli.only) query = query.eq("slug", cli.only);

  const { data: english, error: enErr } = await query;
  if (enErr) throw enErr;
  const rows = (english ?? []) as EnglishRow[];
  if (rows.length === 0) {
    console.error(cli.only ? `no English row for slug: ${cli.only}` : "no English topic rows found");
    process.exit(1);
  }

  // Existing target-locale rows, for the skip/retranslate decision.
  const { data: existing, error: exErr } = await supabase
    .from("content_entries")
    .select("slug,source_hash")
    .eq("kind", "topic")
    .eq("locale", cli.locale);
  if (exErr) throw exErr;
  const existingBySlug = new Map<string, string | null>();
  for (const e of existing ?? []) existingBySlug.set((e as { slug: string }).slug, (e as { source_hash: string | null }).source_hash);

  const client = new Anthropic();
  const systemPrompt = buildSystemPrompt(cli.locale);

  let translated = 0;
  let skipped = 0;
  let failed = 0;
  let processed = 0;

  for (const row of rows) {
    if (cli.limit !== null && processed >= cli.limit) break;
    processed++;

    const existingHash = existingBySlug.get(row.slug);
    const hasRow = existingBySlug.has(row.slug);
    if (hasRow && existingHash === row.source_hash && !cli.retranslate) {
      skipped++;
      console.log(`  unchanged topic ${row.slug} (${cli.locale})`);
      continue;
    }

    const payload: TranslationPayload = {
      title: row.title,
      subtitle: row.subtitle,
      meta: row.meta ?? {},
      blocks: row.blocks ?? [],
      aside_blocks: row.aside_blocks ?? [],
    };
    const inputJson = JSON.stringify(payload);
    const inputChars = inputJson.length;

    if (cli.dryRun) {
      console.log(`[dry] would translate topic ${row.slug} → ${cli.locale} (${inputChars} chars)`);
      continue;
    }

    const maxTokens = pickMaxTokens(inputChars);
    const t0 = Date.now();
    let attemptErr: string | null = null;
    let result: TranslationPayload | null = null;
    let outputChars = 0;

    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        const extra = attempt === 0
          ? undefined
          : `The previous response had a structural mismatch: ${attemptErr}. Return the full translation again, preserving structure exactly (same block types, same counts, same slugs/hrefs/tex).`;
        const { text } = await callClaude(client, cli.model, systemPrompt, payload as unknown as Record<string, unknown>, maxTokens, extra);
        outputChars = text.length;
        const parsed = JSON.parse(extractJson(text)) as TranslationPayload;
        const check = validateStructuralParity(payload, parsed);
        if (!check.ok) {
          attemptErr = check.errors.slice(0, 5).join("; ");
          if (attempt === 1) {
            throw new Error(`structural mismatch: ${attemptErr}`);
          }
          continue;
        }
        result = parsed;
        break;
      } catch (err) {
        if (attempt === 1) {
          failed++;
          const msg = err instanceof Error ? err.message : String(err);
          console.error(`  failed    topic ${row.slug} (${cli.locale}): ${msg}`);
          result = null;
          break;
        }
        attemptErr = err instanceof Error ? err.message : String(err);
      }
    }

    if (!result) continue;

    const elapsed = ((Date.now() - t0) / 1000).toFixed(1);

    const { error: upsertErr } = await supabase.from("content_entries").upsert({
      kind: "topic",
      slug: row.slug,
      locale: cli.locale,
      title: result.title,
      subtitle: result.subtitle ?? null,
      blocks: result.blocks,
      aside_blocks: result.aside_blocks ?? [],
      meta: result.meta ?? {},
      source_hash: row.source_hash,
      updated_at: new Date().toISOString(),
    });
    if (upsertErr) {
      failed++;
      console.error(`  upsert failed topic ${row.slug} (${cli.locale}): ${upsertErr.message}`);
      continue;
    }

    translated++;
    console.log(`  translated topic ${row.slug} (${inputChars} → ${outputChars} chars, ${elapsed}s)`);
  }

  console.log(`\ndone: ${translated} translated, ${skipped} skipped, ${failed} failed`);
  if (failed > 0) process.exit(1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
