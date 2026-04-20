// scripts/content/publish.ts
// Usage:
//   pnpm content:publish            # upserts all English rows
//   pnpm content:publish --dry-run  # parses + hashes, reports diff, no DB writes
//   pnpm content:publish --only classical-mechanics/the-simple-pendulum
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
  file: string;
}

function collectJobs(): Job[] {
  // Bracket characters are escaped so fast-glob treats them literally
  // (rather than as character classes). `app/[locale]/(topics)/...` is the
  // real directory layout on disk.
  const topicFiles = fg.sync("app/\\[locale\\]/\\(topics\\)/*/*/content.en.mdx", { cwd: ROOT });
  const physFiles  = fg.sync("content/physicists/*.en.mdx", { cwd: ROOT });
  const glossFiles = fg.sync("content/glossary/*.en.mdx", { cwd: ROOT });
  return [
    ...topicFiles.map((file) => {
      // app/[locale]/(topics)/<branch>/<topic>/content.en.mdx
      const parts = file.split("/");
      const branch = parts[3];
      const topic  = parts[4];
      return { kind: "topic" as const, slug: `${branch}/${topic}`, file };
    }),
    ...physFiles.map((file) => ({
      kind: "physicist" as const,
      slug: path.basename(file).replace(/\.en\.mdx$/, ""),
      file,
    })),
    ...glossFiles.map((file) => ({
      kind: "glossary" as const,
      slug: path.basename(file).replace(/\.en\.mdx$/, ""),
      file,
    })),
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

  const jobs = collectJobs().filter((j) => !only || j.slug === only);
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
      console.log(`[dry] ${job.kind} ${job.slug} hash=${hash.slice(0, 8)} blocks=${parsed.blocks.length}`);
      continue;
    }

    const { data: existing, error: selectErr } = await client!
      .from("content_entries")
      .select("source_hash")
      .eq("kind", job.kind).eq("slug", job.slug).eq("locale", "en")
      .maybeSingle();
    if (selectErr) throw selectErr;

    if (existing?.source_hash === hash) {
      stats.unchanged++;
      console.log(`  unchanged ${job.kind} ${job.slug}`);
      continue;
    }

    const { error: upsertErr } = await client!
      .from("content_entries")
      .upsert({
        kind: job.kind,
        slug: job.slug,
        locale: "en",
        title: parsed.title,
        subtitle: parsed.subtitle || null,
        blocks: parsed.blocks,
        aside_blocks: parsed.asideBlocks,
        meta: parsed.eyebrow ? { eyebrow: parsed.eyebrow } : {},
        source_hash: hash,
        updated_at: new Date().toISOString(),
      });
    if (upsertErr) throw upsertErr;

    if (existing) { stats.updated++; console.log(`  updated   ${job.kind} ${job.slug}`); }
    else          { stats.added++;   console.log(`  added     ${job.kind} ${job.slug}`); }
  }

  console.log(`\ndone: ${stats.added} added, ${stats.updated} updated, ${stats.unchanged} unchanged`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
