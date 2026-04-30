// Load env vars BEFORE any lib imports that read process.env at module level.
// dotenv/config is a side-effect import that runs synchronously in CJS order.
import "dotenv/config";

import { createClient } from "@supabase/supabase-js";
import { getBranch } from "../../lib/content/branches";
import { buildTitle } from "../../lib/seo/title";
import { extractDescription } from "../../lib/seo/description";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
if (!url || !key) {
  console.error("missing supabase env vars");
  process.exit(1);
}
const supabase = createClient(url, key);

async function main() {
  const { data, error } = await supabase
    .from("content_entries")
    .select("kind, slug, title, subtitle, blocks, meta")
    .eq("locale", "en");
  if (error) throw error;

  const titleMap = new Map<string, string[]>();
  const descMap = new Map<string, string[]>();

  for (const row of data ?? []) {
    const branchTitle =
      row.kind === "topic" ? getBranch(row.slug.split("/")[0])?.title ?? null : null;
    const title = buildTitle(
      { title: row.title, meta: row.meta as Record<string, unknown> },
      branchTitle ? { title: branchTitle } : null,
    );
    const desc = extractDescription({
      subtitle: row.subtitle,
      blocks: (row.blocks ?? []) as never,
      meta: row.meta as Record<string, unknown>,
    });

    const tBucket = titleMap.get(title) ?? [];
    tBucket.push(`${row.kind}::${row.slug}`);
    titleMap.set(title, tBucket);

    const dBucket = descMap.get(desc) ?? [];
    dBucket.push(`${row.kind}::${row.slug}`);
    descMap.set(desc, dBucket);
  }

  let issues = 0;
  for (const [title, slugs] of titleMap) {
    if (slugs.length > 1) {
      console.error(`DUPLICATE TITLE — "${title}" used by:`);
      for (const s of slugs) console.error(`  - ${s}`);
      issues++;
    }
  }
  for (const [desc, slugs] of descMap) {
    if (slugs.length > 1 && desc.length > 0) {
      console.error(`DUPLICATE DESCRIPTION — "${desc.slice(0, 60)}…" used by:`);
      for (const s of slugs) console.error(`  - ${s}`);
      issues++;
    }
  }

  if (issues > 0) {
    console.error(`\n${issues} uniqueness issue(s) found.`);
    process.exit(1);
  }
  console.log(`OK — ${data?.length ?? 0} rows checked, all titles + descriptions unique.`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
