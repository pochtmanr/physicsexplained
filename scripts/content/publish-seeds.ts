// scripts/content/publish-seeds.ts
// Publishes dictionary-term and physicist seed JSON into `content_entries`.
//
// Why this exists: topic pages are published from MDX via `content:publish`,
// but glossary/physicist entries were originally authored straight into the
// database — their MDX sources never lived in this repo. New entries are now
// declared as JSON seeds in `content/seeds/*.json` so that content sessions
// can stay database-free and a single integration step performs the upserts.
//
// Usage:
//   DOTENV_CONFIG_PATH=.env.local pnpm content:publish-seeds            # upsert all seeds
//   DOTENV_CONFIG_PATH=.env.local pnpm content:publish-seeds --dry-run  # parse + report only
//
// Seed file shape (content/seeds/<name>.json):
// {
//   "glossary": [{
//     "slug": "event-horizon", "title": "Event horizon",
//     "subtitle": "one-sentence definition shown under the term",
//     "definition": ["paragraph 1", "paragraph 2"],
//     "history": "optional — paragraphs separated by \n\n",
//     "category": "concept" | "instrument" | "unit" | "phenomenon",
//     "relatedPhysicists": ["stephen-hawking"],
//     "relatedTopics": [{ "branchSlug": "relativity", "topicSlug": "the-event-horizon" }],
//     "visualization": "optional-scene-key"
//   }],
//   "physicists": [{
//     "slug": "karl-schwarzschild", "name": "Karl Schwarzschild",
//     "subtitle": "epithet line", "born": "1873", "died": "1916",
//     "nationality": "German",
//     "bio": ["paragraph 1", "paragraph 2"],
//     "contributions": ["…"], "majorWorks": ["…"],
//     "relatedTopics": [{ "branchSlug": "relativity", "topicSlug": "the-schwarzschild-metric" }]
//   }]
// }
import "dotenv/config";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import path from "node:path";
import fg from "fast-glob";
import { getServiceClient } from "@/lib/supabase-server";
import type { Block } from "@/lib/content/blocks";

const ROOT = path.resolve(__dirname, "..", "..");

interface TopicRefSeed { branchSlug: string; topicSlug: string }

interface GlossarySeed {
  slug: string;
  title: string;
  subtitle: string;
  definition: string[];
  history?: string;
  category: "instrument" | "concept" | "unit" | "phenomenon";
  relatedPhysicists?: string[];
  relatedTopics?: TopicRefSeed[];
  visualization?: string;
}

interface PhysicistSeed {
  slug: string;
  name: string;
  subtitle?: string;
  born: string;
  died: string;
  nationality: string;
  bio: string[];
  contributions?: string[];
  majorWorks?: string[];
  relatedTopics?: TopicRefSeed[];
}

interface SeedFile { glossary?: GlossarySeed[]; physicists?: PhysicistSeed[] }

function paragraphs(texts: string[]): Block[] {
  return texts.map((t) => ({ type: "paragraph", inlines: [t] }));
}

function sha256(buf: string): string {
  return createHash("sha256").update(buf).digest("hex");
}

interface Row {
  kind: "glossary" | "physicist";
  slug: string;
  locale: string;
  title: string;
  subtitle: string | null;
  blocks: Block[];
  aside_blocks: Block[];
  meta: Record<string, unknown>;
  source_hash: string;
}

function glossaryRow(seed: GlossarySeed): Row {
  const meta: Record<string, unknown> = { category: seed.category };
  if (seed.relatedPhysicists?.length) meta.relatedPhysicists = seed.relatedPhysicists;
  if (seed.relatedTopics?.length) meta.relatedTopics = seed.relatedTopics;
  if (seed.history) meta.history = seed.history;
  if (seed.visualization) meta.visualization = seed.visualization;
  return {
    kind: "glossary",
    slug: seed.slug,
    locale: "en",
    title: seed.title,
    subtitle: seed.subtitle || null,
    blocks: paragraphs(seed.definition),
    aside_blocks: [],
    meta,
    source_hash: sha256(JSON.stringify(seed)),
  };
}

function physicistRow(seed: PhysicistSeed): Row {
  const meta: Record<string, unknown> = {
    born: seed.born,
    died: seed.died,
    nationality: seed.nationality,
  };
  if (seed.contributions?.length) meta.contributions = seed.contributions;
  if (seed.majorWorks?.length) meta.majorWorks = seed.majorWorks;
  if (seed.relatedTopics?.length) meta.relatedTopics = seed.relatedTopics;
  return {
    kind: "physicist",
    slug: seed.slug,
    locale: "en",
    title: seed.name,
    subtitle: seed.subtitle || null,
    blocks: paragraphs(seed.bio),
    aside_blocks: [],
    meta,
    source_hash: sha256(JSON.stringify(seed)),
  };
}

async function main() {
  const args = new Set(process.argv.slice(2));
  const dryRun = args.has("--dry-run");
  const force = args.has("--force");

  const files = fg.sync("content/seeds/*.json", { cwd: ROOT });
  if (files.length === 0) {
    console.error("no seed files found under content/seeds/");
    process.exit(1);
  }

  const rows: Row[] = [];
  const seen = new Set<string>();
  for (const file of files) {
    const seedFile = JSON.parse(readFileSync(path.join(ROOT, file), "utf8")) as SeedFile;
    for (const g of seedFile.glossary ?? []) rows.push(glossaryRow(g));
    for (const p of seedFile.physicists ?? []) rows.push(physicistRow(p));
  }
  for (const row of rows) {
    const key = `${row.kind}/${row.slug}`;
    if (seen.has(key)) {
      console.error(`duplicate seed across files: ${key}`);
      process.exit(1);
    }
    seen.add(key);
  }

  if (dryRun) {
    for (const row of rows) {
      console.log(`[dry] ${row.kind} ${row.slug} title="${row.title}" blocks=${row.blocks.length}`);
    }
    console.log(`\n${rows.length} seed rows parsed OK`);
    return;
  }

  const client = getServiceClient();
  const stats = { added: 0, updated: 0, unchanged: 0 };

  for (const row of rows) {
    const { data: existing, error: selectErr } = await client
      .from("content_entries")
      .select("source_hash, meta")
      .eq("kind", row.kind).eq("slug", row.slug).eq("locale", row.locale)
      .maybeSingle();
    if (selectErr) throw selectErr;

    if (!force && existing?.source_hash === row.source_hash) {
      stats.unchanged++;
      console.log(`  unchanged ${row.kind} ${row.slug}`);
      continue;
    }

    // Merge into the existing meta so keys owned by other pipelines
    // (sameAs backfill, seoTitle/seoDescription, createdAt, …) survive
    // republish; seed-owned keys win on conflict.
    const meta = {
      ...((existing?.meta as Record<string, unknown> | null) ?? {}),
      ...row.meta,
    };

    const { error: upsertErr } = await client
      .from("content_entries")
      .upsert({ ...row, meta, updated_at: new Date().toISOString() });
    if (upsertErr) throw upsertErr;

    if (existing) { stats.updated++; console.log(`  updated   ${row.kind} ${row.slug}`); }
    else          { stats.added++;   console.log(`  added     ${row.kind} ${row.slug}`); }
  }

  console.log(`\ndone: ${stats.added} added, ${stats.updated} updated, ${stats.unchanged} unchanged`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
