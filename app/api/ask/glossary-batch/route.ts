import { NextResponse } from "next/server";
import { z } from "zod";
import { getServiceClient } from "@/lib/supabase-server";
import type {
  GlossaryCard,
  PhysicistCard,
  SourcesPayload,
  TopicCard,
} from "@/lib/ask/glossary-card";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Backwards-compatible body: `slugs` alone is treated as glossary-only (the
// pre-Sources contract). New callers pass `topics` / `physicists` / `glossary`
// arrays alongside `locale`.
const BodySchema = z
  .object({
    slugs: z.array(z.string().min(1)).max(20).optional(),
    topics: z.array(z.string().min(1)).max(20).optional(),
    physicists: z.array(z.string().min(1)).max(20).optional(),
    glossary: z.array(z.string().min(1)).max(20).optional(),
    locale: z.string().default("en"),
  })
  .refine(
    (b) =>
      (b.slugs?.length ?? 0) + (b.topics?.length ?? 0) + (b.physicists?.length ?? 0) + (b.glossary?.length ?? 0) > 0,
    { message: "at least one slug array must be non-empty" },
  );

export async function POST(req: Request) {
  let body: z.infer<typeof BodySchema>;
  try { body = BodySchema.parse(await req.json()); }
  catch { return NextResponse.json({ error: "BAD_REQUEST" }, { status: 400 }); }

  const db = getServiceClient();
  const topicSlugsReq = uniq(body.topics);
  const physicistSlugsReq = uniq(body.physicists);
  // Legacy `slugs` means glossary-only.
  const glossarySlugsReq = uniq([...(body.glossary ?? []), ...(body.slugs ?? [])]);

  const [topicsPayload, physicistsPayload, glossaryPayload] = await Promise.all([
    fetchTopicCards(db, topicSlugsReq, body.locale),
    fetchPhysicistCards(db, physicistSlugsReq, body.locale),
    fetchGlossaryCards(db, glossarySlugsReq, body.locale),
  ]);

  const payload: SourcesPayload = {
    topics: topicsPayload,
    physicists: physicistsPayload,
    glossary: glossaryPayload,
  };

  // Preserve legacy `cards` field for any client still pointed at the old
  // shape (currently none — FurtherReading reads `sources` — but a safety
  // net keeps old deployments from 500-ing during rollout).
  return NextResponse.json({ sources: payload, cards: glossaryPayload });
}

function uniq(arr?: string[]): string[] {
  return Array.from(new Set(arr ?? []));
}

async function fetchWithLocaleFallback<T extends { slug: string }>(
  db: ReturnType<typeof getServiceClient>,
  kind: "topic" | "physicist" | "glossary",
  slugs: string[],
  locale: string,
  columns: string,
): Promise<T[]> {
  if (slugs.length === 0) return [];
  const primary = await db
    .from("content_entries")
    .select(columns)
    .eq("kind", kind).eq("locale", locale)
    .in("slug", slugs);
  const primaryRows = (primary.data ?? []) as unknown as T[];

  const found = new Set(primaryRows.map((r) => r.slug));
  const missing = slugs.filter((s) => !found.has(s));
  if (!missing.length || locale === "en") return primaryRows;

  const fallback = await db
    .from("content_entries")
    .select(columns)
    .eq("kind", kind).eq("locale", "en")
    .in("slug", missing);
  return [...primaryRows, ...((fallback.data ?? []) as unknown as T[])];
}

async function fetchTopicCards(
  db: ReturnType<typeof getServiceClient>,
  slugs: string[],
  locale: string,
): Promise<TopicCard[]> {
  const rows = await fetchWithLocaleFallback<{ slug: string; title: string; subtitle: string | null }>(
    db, "topic", slugs, locale, "slug,title,subtitle",
  );
  const order = new Map(slugs.map((s, i) => [s, i]));
  return rows
    .map((r) => ({ slug: r.slug, title: r.title, subtitle: r.subtitle ?? null }))
    .sort((a, b) => (order.get(a.slug) ?? 0) - (order.get(b.slug) ?? 0));
}

async function fetchPhysicistCards(
  db: ReturnType<typeof getServiceClient>,
  slugs: string[],
  locale: string,
): Promise<PhysicistCard[]> {
  const rows = await fetchWithLocaleFallback<{ slug: string; title: string; subtitle: string | null }>(
    db, "physicist", slugs, locale, "slug,title,subtitle",
  );
  const order = new Map(slugs.map((s, i) => [s, i]));
  return rows
    .map((r) => ({ slug: r.slug, title: r.title, subtitle: r.subtitle ?? null }))
    .sort((a, b) => (order.get(a.slug) ?? 0) - (order.get(b.slug) ?? 0));
}

async function fetchGlossaryCards(
  db: ReturnType<typeof getServiceClient>,
  slugs: string[],
  locale: string,
): Promise<GlossaryCard[]> {
  type GlossaryRow = { slug: string; title: string; subtitle: string | null; meta: unknown };
  const rows = await fetchWithLocaleFallback<GlossaryRow>(
    db, "glossary", slugs, locale, "slug,title,subtitle,meta",
  );

  // Collect related-topic + related-physicist slugs so we can enrich with
  // their titles in two small batched fetches.
  const topicSlugs = new Set<string>();
  const physicistSlugs = new Set<string>();
  rows.forEach((r) => {
    const meta = (r.meta ?? {}) as {
      relatedTopics?: Array<{ topicSlug?: string }>;
      relatedPhysicists?: string[];
    };
    (meta.relatedTopics ?? []).forEach((rt) => { if (rt?.topicSlug) topicSlugs.add(rt.topicSlug); });
    (meta.relatedPhysicists ?? []).forEach((ps) => { if (ps) physicistSlugs.add(ps); });
  });

  const [topicsRes, physicistsRes] = await Promise.all([
    topicSlugs.size
      ? db.from("content_entries").select("slug,title").eq("kind", "topic").eq("locale", locale).in("slug", [...topicSlugs])
      : Promise.resolve({ data: [] as Array<{ slug: string; title: string }> }),
    physicistSlugs.size
      ? db.from("content_entries").select("slug,title").eq("kind", "physicist").eq("locale", locale).in("slug", [...physicistSlugs])
      : Promise.resolve({ data: [] as Array<{ slug: string; title: string }> }),
  ]);
  const topicTitleBySlug = new Map((topicsRes.data ?? []).map((t) => [t.slug, t.title]));
  const physicistTitleBySlug = new Map((physicistsRes.data ?? []).map((p) => [p.slug, p.title]));

  const cards = rows.map((r): GlossaryCard => {
    const meta = (r.meta ?? {}) as {
      shortDefinition?: string;
      category?: string;
      relatedTopics?: Array<{ branchSlug: string; topicSlug: string }>;
      relatedPhysicists?: string[];
    };
    return {
      slug: r.slug,
      term: r.title,
      shortDefinition: meta.shortDefinition ?? r.subtitle ?? "",
      category: meta.category ?? "concept",
      relatedTopics: (meta.relatedTopics ?? []).slice(0, 4).map((rt) => ({
        branchSlug: rt.branchSlug,
        topicSlug: rt.topicSlug,
        title: topicTitleBySlug.get(rt.topicSlug) ?? null,
      })),
      relatedPhysicists: (meta.relatedPhysicists ?? []).slice(0, 3).map((ps) => ({
        slug: ps,
        title: physicistTitleBySlug.get(ps) ?? null,
      })),
    };
  });

  const order = new Map(slugs.map((s, i) => [s, i]));
  cards.sort((a, b) => (order.get(a.slug) ?? 0) - (order.get(b.slug) ?? 0));
  return cards;
}
