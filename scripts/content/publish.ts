// scripts/content/publish.ts
// Usage:
//   pnpm content:publish                      # upserts all rows (any locale)
//   pnpm content:publish --dry-run            # parses + hashes, reports diff, no DB writes
//   pnpm content:publish --only classical-mechanics/the-simple-pendulum
//   pnpm content:publish --locale he          # filter to a specific locale
import "dotenv/config";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import path from "node:path";
import fg from "fast-glob";
import { parseMdx } from "./parse-mdx";
import { getServiceClient } from "@/lib/supabase-server";

const ROOT = path.resolve(__dirname, "..", "..");

interface Job {
  kind: "topic" | "physicist" | "glossary";
  slug: string;
  locale: string;
  file: string;
}

function extractLocale(filename: string): string {
  const match = filename.match(/^.*\.([a-z]{2})\.mdx$/);
  return match ? match[1] : "en";
}

function collectJobs(): Job[] {
  // Bracket characters are escaped so fast-glob treats them literally
  // (rather than as character classes). `app/[locale]/(topics)/...` is the
  // real directory layout on disk.
  const topicFiles = fg.sync("app/\\[locale\\]/\\(topics\\)/*/*/content.*.mdx", { cwd: ROOT });
  const physFiles  = fg.sync("content/physicists/*.mdx", { cwd: ROOT });
  const glossFiles = fg.sync("content/glossary/*.mdx", { cwd: ROOT });
  return [
    ...topicFiles.map((file) => {
      // app/[locale]/(topics)/<branch>/<topic>/content.<locale>.mdx
      const parts = file.split("/");
      const branch = parts[3];
      const topic  = parts[4];
      const filename = path.basename(file);
      const locale = extractLocale(filename);
      return { kind: "topic" as const, slug: `${branch}/${topic}`, locale, file };
    }),
    ...physFiles.map((file) => {
      const filename = path.basename(file);
      const locale = extractLocale(filename);
      const slug = filename.replace(/\.[a-z]{2}\.mdx$/, "");
      return { kind: "physicist" as const, slug, locale, file };
    }),
    ...glossFiles.map((file) => {
      const filename = path.basename(file);
      const locale = extractLocale(filename);
      const slug = filename.replace(/\.[a-z]{2}\.mdx$/, "");
      return { kind: "glossary" as const, slug, locale, file };
    }),
  ];
}

function sha256(buf: string): string {
  return createHash("sha256").update(buf).digest("hex");
}

async function main() {
  const args = new Set(process.argv.slice(2));
  const dryRun = args.has("--dry-run");
  const onlyIdx = process.argv.indexOf("--only");
  const only = onlyIdx >= 0 ? process.argv[onlyIdx + 1] : null;
  const localeIdx = process.argv.indexOf("--locale");
  const localeFilter = localeIdx >= 0 ? process.argv[localeIdx + 1] : null;

  const jobs = collectJobs()
    .filter((j) => !only || j.slug === only)
    .filter((j) => !localeFilter || j.locale === localeFilter);
  if (jobs.length === 0) {
    console.error("no matching MDX sources found");
    process.exit(1);
  }

  const client = dryRun ? null : getServiceClient();
  const stats = { added: 0, updated: 0, unchanged: 0 };

  for (const job of jobs) {
    const source = readFileSync(path.join(ROOT, job.file), "utf8");
    const hash = sha256(source);
    const parsed = parseMdx(source);

    if (dryRun) {
      console.log(`[dry] ${job.kind} ${job.slug} (${job.locale}) hash=${hash.slice(0, 8)} blocks=${parsed.blocks.length}`);
      continue;
    }

    const { data: existing, error: selectErr } = await client!
      .from("content_entries")
      .select("source_hash")
      .eq("kind", job.kind).eq("slug", job.slug).eq("locale", job.locale)
      .maybeSingle();
    if (selectErr) throw selectErr;

    if (existing?.source_hash === hash) {
      stats.unchanged++;
      console.log(`  unchanged ${job.kind} ${job.slug} (${job.locale})`);
      continue;
    }

    const meta: Record<string, unknown> = {};
    if (parsed.eyebrow) meta.eyebrow = parsed.eyebrow;
    if (parsed.aside)   meta.aside   = parsed.aside;

    const { error: upsertErr } = await client!
      .from("content_entries")
      .upsert({
        kind: job.kind,
        slug: job.slug,
        locale: job.locale,
        title: parsed.title,
        subtitle: parsed.subtitle || null,
        blocks: parsed.blocks,
        aside_blocks: parsed.asideBlocks,
        meta,
        source_hash: hash,
        updated_at: new Date().toISOString(),
      });
    if (upsertErr) throw upsertErr;

    if (existing) { stats.updated++; console.log(`  updated   ${job.kind} ${job.slug} (${job.locale})`); }
    else          { stats.added++;   console.log(`  added     ${job.kind} ${job.slug} (${job.locale})`); }
  }

  console.log(`\ndone: ${stats.added} added, ${stats.updated} updated, ${stats.unchanged} unchanged`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
