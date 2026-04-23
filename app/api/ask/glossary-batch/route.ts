import { NextResponse } from "next/server";
import { z } from "zod";
import { getServiceClient } from "@/lib/supabase-server";
import type { GlossaryCard } from "@/lib/ask/glossary-card";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const BodySchema = z.object({
  slugs: z.array(z.string().min(1)).min(1).max(20),
  locale: z.string().default("en"),
});

export async function POST(req: Request) {
  let body: z.infer<typeof BodySchema>;
  try { body = BodySchema.parse(await req.json()); }
  catch { return NextResponse.json({ error: "BAD_REQUEST" }, { status: 400 }); }

  const db = getServiceClient();
  const unique = Array.from(new Set(body.slugs));

  // Fetch glossary entries — fall back to English if locale missing.
  const localeRes = await db
    .from("content_entries")
    .select("slug, title, subtitle, meta")
    .eq("kind", "glossary")
    .eq("locale", body.locale)
    .in("slug", unique);

  const foundSlugs = new Set((localeRes.data ?? []).map((r) => r.slug));
  const missing = unique.filter((s) => !foundSlugs.has(s));
  const fallbackRes = missing.length && body.locale !== "en"
    ? await db
        .from("content_entries")
        .select("slug, title, subtitle, meta")
        .eq("kind", "glossary")
        .eq("locale", "en")
        .in("slug", missing)
    : { data: [] as NonNullable<typeof localeRes.data> };

  const rows = [...(localeRes.data ?? []), ...(fallbackRes.data ?? [])];

  // Collect related-topic + related-physicist slugs across all cards so we can
  // enrich with their titles in a single batched fetch each.
  const topicSlugs = new Set<string>();
  const physicistSlugs = new Set<string>();
  rows.forEach((r) => {
    const meta = (r.meta ?? {}) as { relatedTopics?: Array<{ topicSlug?: string }>; relatedPhysicists?: string[] };
    (meta.relatedTopics ?? []).forEach((rt) => { if (rt?.topicSlug) topicSlugs.add(rt.topicSlug); });
    (meta.relatedPhysicists ?? []).forEach((ps) => { if (ps) physicistSlugs.add(ps); });
  });

  const [topicsRes, physicistsRes] = await Promise.all([
    topicSlugs.size
      ? db.from("content_entries").select("slug,title").eq("kind", "topic").eq("locale", body.locale).in("slug", [...topicSlugs])
      : Promise.resolve({ data: [] as Array<{ slug: string; title: string }> }),
    physicistSlugs.size
      ? db.from("content_entries").select("slug,title").eq("kind", "physicist").eq("locale", body.locale).in("slug", [...physicistSlugs])
      : Promise.resolve({ data: [] as Array<{ slug: string; title: string }> }),
  ]);

  const topicTitleBySlug = new Map((topicsRes.data ?? []).map((t) => [t.slug, t.title]));
  const physicistTitleBySlug = new Map((physicistsRes.data ?? []).map((p) => [p.slug, p.title]));

  const cards: GlossaryCard[] = rows.map((r) => {
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

  // Preserve original request order
  const order = new Map(unique.map((s, i) => [s, i]));
  cards.sort((a, b) => (order.get(a.slug) ?? 0) - (order.get(b.slug) ?? 0));

  return NextResponse.json({ cards });
}
