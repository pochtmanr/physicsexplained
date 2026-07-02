// Full-arsenal scene catalog generator.
//
// Walks every topic essay's MDX, collects each <SceneCard> simulation figure
// (id, FIG caption, source essay, default props), merges the hand-curated
// SCENE_CATALOG on top, then:
//   1. upserts the union into the `scene_catalog` Supabase table (drives
//      searchScenes FTS + candidate-refs pre-retrieval), and
//   2. writes lib/ask/scene-meta.generated.ts (drives showScene validation
//      server-side and InlineScene captions client-side).
//
// Usage:
//   pnpm ask:sync-scenes            # regenerate module + sync DB
//   pnpm ask:sync-scenes --check    # exit 1 if the committed module is stale (no writes)
//   pnpm ask:sync-scenes --dry-run  # report counts, no writes
import "dotenv/config";
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import path from "node:path";
import fg from "fast-glob";
import { z } from "zod";
import { parseMdx } from "../content/parse-mdx";
import { getServiceClient } from "@/lib/supabase-server";
import { SCENE_CATALOG } from "@/lib/ask/scene-catalog";
import {
  collectSimulationFigures,
  humanizeSceneId,
  splitFigCaption,
  truncate,
  type MdxFigure,
} from "./scene-catalog-lib";

const ROOT = path.resolve(__dirname, "..", "..");
const GENERATED_MODULE = path.join(ROOT, "lib", "ask", "scene-meta.generated.ts");
const REGISTRY_FILE = path.join(ROOT, "lib", "content", "simulation-registry.ts");

const LABEL_MAX = 80;
const DESCRIPTION_MAX = 300;
const MODULE_CAPTION_MAX = 140;

interface CatalogRow {
  id: string;
  label: string;
  description: string;
  topic_slugs: string[];
  tags: string[];
  params_schema: unknown;
  default_props: Record<string, unknown>;
  fig_label: string | null;
  source_title: string | null;
  curated: boolean;
  updated_at: string;
}

function parseRegistryIds(): Set<string> {
  const src = readFileSync(REGISTRY_FILE, "utf8");
  const ids = new Set<string>();
  const re = /^ {2}([A-Za-z0-9_]+): lazyScene\(/gm;
  let m: RegExpExecArray | null;
  while ((m = re.exec(src)) !== null) ids.add(m[1]);
  if (ids.size === 0) throw new Error(`no registry ids parsed from ${REGISTRY_FILE} — pattern drift?`);
  return ids;
}

function collectMdxFigures(): MdxFigure[] {
  // Escaped brackets so fast-glob treats them literally (same as publish.ts).
  const files = fg.sync("app/\\[locale\\]/\\(topics\\)/*/*/content.en.mdx", { cwd: ROOT });
  if (files.length === 0) throw new Error("no topic MDX files found");
  const figures: MdxFigure[] = [];
  for (const file of files) {
    const parts = file.split("/"); // app/[locale]/(topics)/<module>/<topic>/content.en.mdx
    const topicSlug = `${parts[3]}/${parts[4]}`;
    const parsed = parseMdx(readFileSync(path.join(ROOT, file), "utf8"));
    collectSimulationFigures(parsed.blocks, topicSlug, parsed.title, figures);
  }
  return figures;
}

function buildRows(figures: MdxFigure[], registryIds: Set<string>): { rows: CatalogRow[]; missing: string[] } {
  const now = new Date().toISOString();
  const emptySchema = z.toJSONSchema(z.object({}));
  const missing: string[] = [];
  const byId = new Map<string, CatalogRow>();

  // 1. MDX figures — first caption per component wins (repeats are within-essay).
  for (const fig of figures) {
    if (!registryIds.has(fig.component)) {
      missing.push(`${fig.component} (${fig.topicSlug})`);
      continue;
    }
    if (byId.has(fig.component)) continue;
    const { figLabel, rest } = splitFigCaption(fig.caption);
    const module_ = fig.topicSlug.split("/")[0];
    byId.set(fig.component, {
      id: fig.component,
      label: truncate(rest || humanizeSceneId(fig.component), LABEL_MAX),
      // FIG label lives in fig_label; keep it out of the description so
      // downstream renderers can compose "FIG.13b — <description>" without
      // duplication (and it adds nothing to FTS).
      description: truncate(rest || humanizeSceneId(fig.component), DESCRIPTION_MAX),
      topic_slugs: [fig.topicSlug],
      tags: [module_],
      params_schema: emptySchema,
      default_props: fig.props,
      fig_label: figLabel,
      source_title: fig.sourceTitle || null,
      curated: false,
      updated_at: now,
    });
  }

  // 2. Registry-only scenes (never embedded in MDX) — discoverable, minimal metadata.
  for (const id of registryIds) {
    if (byId.has(id)) continue;
    byId.set(id, {
      id,
      label: humanizeSceneId(id),
      description: humanizeSceneId(id),
      topic_slugs: [],
      tags: [],
      params_schema: emptySchema,
      default_props: {},
      fig_label: null,
      source_title: null,
      curated: false,
      updated_at: now,
    });
  }

  // 3. Curated entries override — richer label/description/tags/topicSlugs and a
  //    real params schema; generated fig_label/source_title/default_props survive.
  for (const entry of SCENE_CATALOG) {
    const generated = byId.get(entry.id);
    byId.set(entry.id, {
      id: entry.id,
      label: entry.label,
      description: entry.description,
      topic_slugs: entry.topicSlugs,
      tags: entry.tags,
      params_schema: z.toJSONSchema(entry.paramsSchema),
      default_props: generated?.default_props ?? {},
      fig_label: generated?.fig_label ?? null,
      source_title: generated?.source_title ?? null,
      curated: true,
      updated_at: now,
    });
  }

  const rows = Array.from(byId.values()).sort((a, b) => a.id.localeCompare(b.id));
  return { rows, missing };
}

function renderGeneratedModule(rows: CatalogRow[]): string {
  const lines: string[] = [
    "// AUTO-GENERATED by scripts/ask/generate-scene-catalog.ts — DO NOT EDIT.",
    "// Regenerate with: pnpm ask:sync-scenes",
    "//",
    "// One entry per scene the /ask model may embed. Used by:",
    "//   - lib/ask/toolset.ts showScene — id validation + default props for the fence",
    "//   - components/ask/inline-scene.tsx — FIG caption + source-essay link",
    "",
    "export interface GeneratedSceneMeta {",
    "  figLabel: string | null;",
    "  caption: string;",
    "  topicSlug: string | null;",
    "  defaultProps?: Record<string, unknown>;",
    "}",
    "",
    "export const GENERATED_SCENE_META: Record<string, GeneratedSceneMeta> = {",
  ];
  for (const r of rows) {
    const caption = truncate(r.description, MODULE_CAPTION_MAX);
    const fields = [
      `figLabel: ${JSON.stringify(r.fig_label)}`,
      `caption: ${JSON.stringify(caption)}`,
      `topicSlug: ${JSON.stringify(r.topic_slugs[0] ?? null)}`,
    ];
    if (Object.keys(r.default_props).length > 0) {
      fields.push(`defaultProps: ${JSON.stringify(r.default_props)}`);
    }
    lines.push(`  ${r.id}: { ${fields.join(", ")} },`);
  }
  lines.push("};", "", "export const GENERATED_SCENE_IDS: string[] = Object.keys(GENERATED_SCENE_META);", "");
  return lines.join("\n");
}

async function syncDb(rows: CatalogRow[]): Promise<void> {
  const db = getServiceClient();
  const CHUNK = 100;
  for (let i = 0; i < rows.length; i += CHUNK) {
    const { error } = await db.from("scene_catalog").upsert(rows.slice(i, i + CHUNK), { onConflict: "id" });
    if (error) throw new Error(`Upsert error (rows ${i}–${i + CHUNK}): ${error.message}`);
  }
  const ids = rows.map((r) => r.id);
  const { error: delErr } = await db
    .from("scene_catalog")
    .delete()
    .not("id", "in", `(${ids.map((i) => `"${i}"`).join(",")})`);
  if (delErr) throw new Error(`Delete error: ${delErr.message}`);
}

async function main() {
  const args = new Set(process.argv.slice(2));
  const check = args.has("--check");
  const dryRun = args.has("--dry-run");

  const registryIds = parseRegistryIds();
  const figures = collectMdxFigures();
  const { rows, missing } = buildRows(figures, registryIds);

  if (missing.length > 0) {
    console.error("MDX simulation components missing from SIMULATION_REGISTRY:");
    for (const m of missing) console.error(`  - ${m}`);
    process.exit(1);
  }

  const mdxCount = rows.filter((r) => r.topic_slugs.length > 0 && !r.curated).length;
  const curatedCount = rows.filter((r) => r.curated).length;
  const registryOnly = rows.length - mdxCount - curatedCount;
  console.log(
    `catalog: ${rows.length} scenes (${mdxCount} from MDX, ${curatedCount} curated, ${registryOnly} registry-only) from ${figures.length} figure usages`,
  );

  const moduleText = renderGeneratedModule(rows);

  if (check) {
    const current = existsSync(GENERATED_MODULE) ? readFileSync(GENERATED_MODULE, "utf8") : "";
    if (current !== moduleText) {
      console.error(`STALE: ${path.relative(ROOT, GENERATED_MODULE)} is out of date. Run: pnpm ask:sync-scenes`);
      process.exit(1);
    }
    console.log("generated module is up to date");
    return;
  }
  if (dryRun) return;

  writeFileSync(GENERATED_MODULE, moduleText);
  console.log(`wrote ${path.relative(ROOT, GENERATED_MODULE)}`);
  await syncDb(rows);
  console.log(`synced ${rows.length} scenes to scene_catalog`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
