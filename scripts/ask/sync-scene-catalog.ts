// Usage: pnpm ask:sync-scenes
import "dotenv/config";
import { z } from "zod";
import { getServiceClient } from "@/lib/supabase-server";
import { SCENE_CATALOG } from "@/lib/ask/scene-catalog";

async function main() {
  const db = getServiceClient();

  const rows = SCENE_CATALOG.map((e) => ({
    id: e.id,
    label: e.label,
    description: e.description,
    topic_slugs: e.topicSlugs,
    tags: e.tags,
    params_schema: z.toJSONSchema(e.paramsSchema),
    updated_at: new Date().toISOString(),
  }));

  const { error } = await db.from("scene_catalog").upsert(rows, { onConflict: "id" });
  if (error) { console.error("Upsert error:", error); process.exit(1); }

  const ids = rows.map((r) => r.id);
  const { error: delErr } = await db
    .from("scene_catalog")
    .delete()
    .not("id", "in", `(${ids.map((i) => `"${i}"`).join(",")})`);
  if (delErr) { console.error("Delete error:", delErr); process.exit(1); }

  console.log(`synced ${rows.length} scenes`);
}

main().catch((e) => { console.error(e); process.exit(1); });
