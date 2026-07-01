// scripts/content/backfill-sameas.ts
// One-time backfill of `meta.sameAs` (Wikipedia + Wikidata URLs) for
// physicist entries, via the public Wikidata API. Strengthens the Person
// JSON-LD entity signal — `buildPersonJsonLd` already emits `meta.sameAs`.
//
// Matching: search Wikidata by the entry title, then require the candidate's
// birth year (P569) to equal the registry birth year. Ambiguous or unmatched
// entries are skipped and listed in the final report for manual review.
//
// Usage:
//   DOTENV_CONFIG_PATH=.env.local pnpm content:backfill-sameas            # write
//   DOTENV_CONFIG_PATH=.env.local pnpm content:backfill-sameas --dry-run  # report only
//   ... --only karl-schwarzschild                                         # single slug
import "dotenv/config";
import { getServiceClient } from "@/lib/supabase-server";

const API = "https://www.wikidata.org/w/api.php";
const HEADERS = {
  "User-Agent": "physics.it.com content pipeline (sameAs backfill; contact: site owner)",
};

interface SearchHit {
  id: string;
  label?: string;
  description?: string;
}

interface EntityInfo {
  birthYear: number | null;
  deathYear: number | null;
  wikipediaUrl: string | null;
}

function yearOf(value: string | undefined): number | null {
  // Wikidata time values look like "+1873-10-09T00:00:00Z" (or negative for BCE).
  const m = value?.match(/^([+-]\d+)-/);
  return m ? parseInt(m[1], 10) : null;
}

function registryYear(raw: unknown): number | null {
  if (typeof raw !== "string") return null;
  const bce = /BC|BCE/i.test(raw);
  const m = raw.match(/\d+/);
  if (!m) return null;
  const y = parseInt(m[0], 10);
  return bce ? -y : y;
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function apiGet(params: Record<string, string>): Promise<any> {
  const qs = new URLSearchParams({ format: "json", ...params });
  // Wikidata throttles sustained anonymous traffic — retry with generous
  // backoff and honor Retry-After when present.
  for (let attempt = 1; ; attempt++) {
    const res = await fetch(`${API}?${qs}`, { headers: HEADERS });
    if (res.ok) return res.json();
    if (attempt >= 6) {
      throw new Error(`Wikidata API ${res.status} for ${qs.get("action")}`);
    }
    const retryAfter = parseInt(res.headers.get("retry-after") ?? "", 10);
    const waitMs = Number.isFinite(retryAfter)
      ? retryAfter * 1000
      : Math.min(2000 * 2 ** attempt, 60_000);
    console.log(`    (HTTP ${res.status}, retrying in ${Math.round(waitMs / 1000)}s)`);
    await sleep(waitMs);
  }
}

async function searchEntities(name: string): Promise<SearchHit[]> {
  const json = await apiGet({
    action: "wbsearchentities",
    search: name,
    language: "en",
    type: "item",
    limit: "5",
  });
  return (json.search ?? []).map((s: any) => ({
    id: s.id,
    label: s.label,
    description: s.description,
  }));
}

async function getEntities(ids: string[]): Promise<Map<string, EntityInfo>> {
  const json = await apiGet({
    action: "wbgetentities",
    ids: ids.join("|"),
    props: "claims|sitelinks/urls",
    sitefilter: "enwiki",
  });
  const out = new Map<string, EntityInfo>();
  for (const [id, entity] of Object.entries<any>(json.entities ?? {})) {
    const birth = entity.claims?.P569?.[0]?.mainsnak?.datavalue?.value?.time;
    const death = entity.claims?.P570?.[0]?.mainsnak?.datavalue?.value?.time;
    out.set(id, {
      birthYear: yearOf(birth),
      deathYear: yearOf(death),
      wikipediaUrl: entity.sitelinks?.enwiki?.url ?? null,
    });
  }
  return out;
}

async function main() {
  const args = process.argv.slice(2);
  const dryRun = args.includes("--dry-run");
  const force = args.includes("--force");
  const onlyIdx = args.indexOf("--only");
  const only = onlyIdx >= 0 ? args[onlyIdx + 1] : null;

  const client = getServiceClient();
  const { data, error } = await client
    .from("content_entries")
    .select("slug, title, meta")
    .eq("kind", "physicist")
    .eq("locale", "en")
    .order("slug");
  if (error) throw error;

  const entries = (data ?? []).filter((e) => !only || e.slug === only);
  console.log(`${entries.length} physicist entries to process`);

  const report = { written: 0, skippedExisting: 0, unmatched: [] as string[] };

  for (const entry of entries) {
    const meta = (entry.meta ?? {}) as Record<string, unknown>;
    if (Array.isArray(meta.sameAs) && meta.sameAs.length > 0 && !force) {
      report.skippedExisting++;
      continue;
    }

    const bornYear = registryYear(meta.born);
    let matched: { id: string; info: EntityInfo } | null = null;

    try {
      const hits = await searchEntities(entry.title);
      if (hits.length > 0) {
        const infos = await getEntities(hits.map((h) => h.id));
        const byBirth = hits.filter(
          (h) => bornYear !== null && infos.get(h.id)?.birthYear === bornYear,
        );
        if (byBirth.length === 1) {
          matched = { id: byBirth[0].id, info: infos.get(byBirth[0].id)! };
        } else if (byBirth.length === 0 && hits.length === 1) {
          // Single candidate but no birth-year confirmation: accept only if
          // Wikidata describes them as a scientist of some kind.
          const h = hits[0];
          if (/physicist|astronomer|mathematician|scientist|chemist|engineer|philosopher/i.test(h.description ?? "")) {
            matched = { id: h.id, info: infos.get(h.id)! };
          }
        }
      }
    } catch (err) {
      console.error(`  API error for ${entry.slug}: ${err}`);
    }

    if (!matched) {
      report.unmatched.push(entry.slug);
      console.log(`  unmatched ${entry.slug} ("${entry.title}", born=${meta.born ?? "?"})`);
      await sleep(1000);
      continue;
    }

    const sameAs = [
      ...(matched.info.wikipediaUrl ? [matched.info.wikipediaUrl] : []),
      `https://www.wikidata.org/wiki/${matched.id}`,
    ];
    console.log(`  ${dryRun ? "[dry] " : ""}${entry.slug} → ${sameAs.join(" , ")}`);

    if (!dryRun) {
      const { error: updateErr } = await client
        .from("content_entries")
        .update({ meta: { ...meta, sameAs } })
        .eq("kind", "physicist")
        .eq("slug", entry.slug)
        .eq("locale", "en");
      if (updateErr) throw updateErr;
      report.written++;
    }

    await sleep(1000);
  }

  console.log(
    `\ndone: ${report.written} written, ${report.skippedExisting} already had sameAs, ${report.unmatched.length} unmatched`,
  );
  if (report.unmatched.length > 0) {
    console.log("review manually:");
    for (const slug of report.unmatched) console.log(`  - ${slug}`);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
