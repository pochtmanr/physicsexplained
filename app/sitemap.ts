import type { MetadataRoute } from "next";
import { BRANCHES } from "@/lib/content/branches";
import { supabase } from "@/lib/supabase";
import { locales, defaultLocale } from "@/i18n/config";
import { SITE } from "@/lib/seo/config";
import { isPublished } from "@/lib/seo/published";
import { EQUATIONS } from "@/lib/content/equations";
import { PLAYGROUND_SLUGS } from "@/app/[locale]/play/_components/playground-meta";
import { PROBLEMS } from "@/lib/content/problems";
import { buildAlternates } from "@/lib/seo/alternates";

type ChangeFreq = NonNullable<MetadataRoute.Sitemap[number]["changeFrequency"]>;

interface RealEntry {
  kind: "topic" | "glossary" | "physicist";
  slug: string;
  locale: string;
  updated_at: string | null;
}

function pathFor(kind: RealEntry["kind"], slug: string): string {
  if (kind === "topic") return `/${slug}`;
  if (kind === "glossary") return `/dictionary/${slug}`;
  return `/physicists/${slug}`;
}

function entry(
  path: string,
  locale: string,
  realLocaleSet: Iterable<string>,
  lastModified: string,
  changeFrequency: ChangeFreq,
  priority: number,
): MetadataRoute.Sitemap[number] {
  // Same self-referencing hreflang set (plus x-default) the page itself emits.
  const { canonical, languages } = buildAlternates(path, locale, realLocaleSet);
  return {
    url: canonical,
    lastModified,
    changeFrequency,
    priority,
    alternates: { languages },
  };
}

// The DB is the source of truth for content dates; static pages only change
// with a release, so they carry the date of the last one rather than "now"
// (a lastmod that moves on every build teaches crawlers to ignore it).
const STATIC_LAST_MODIFIED = "2026-11-22T00:00:00.000Z";
const EN_ONLY: readonly string[] = [defaultLocale];

// Re-read the database hourly so newly published content shows up without a
// rebuild.
export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date().toISOString();

  // [path, changefreq, priority, locales the page is really translated into]
  type StaticPath = [string, ChangeFreq, number, readonly string[]];
  const staticPaths: StaticPath[] = [
    ["/", "weekly", 1.0, locales],
    ["/about", "monthly", 0.6, EN_ONLY],
    ["/physicists", "monthly", 0.7, locales],
    ["/dictionary", "monthly", 0.7, locales],
    ["/equations", "monthly", 0.7, EN_ONLY],
    ["/play", "monthly", 0.5, locales],
    ...EQUATIONS.map((e): StaticPath => [
      `/equations/${e.slug}`,
      "monthly",
      0.6,
      EN_ONLY,
    ]),
    ...PLAYGROUND_SLUGS.map((slug): StaticPath => [
      `/play/${slug}`,
      "monthly",
      0.5,
      locales,
    ]),
    ...PROBLEMS.filter(
      (p) => p.primaryTopicSlug && p.solverPath.includes("/classical-mechanics/"),
    ).map((p): StaticPath => [
      `/classical-mechanics/${p.primaryTopicSlug}/problems/${p.id}`,
      "monthly",
      0.4,
      EN_ONLY,
    ]),
    ["/privacy", "yearly", 0.3, locales],
    ["/terms", "yearly", 0.3, locales],
    ["/cookies", "yearly", 0.3, locales],
    ...BRANCHES.filter((b) => b.status === "live").map((b): StaticPath => [
      `/${b.slug}`,
      "monthly",
      0.8,
      locales,
    ]),
  ];
  const staticPages: MetadataRoute.Sitemap = staticPaths.flatMap(
    ([p, freq, prio, real]) =>
      real.map((l) => entry(p, l, real, STATIC_LAST_MODIFIED, freq, prio)),
  );

  // Pull all real rows for all locales.
  const { data, error } = await supabase
    .from("content_entries")
    .select("kind, slug, locale, updated_at")
    .in("kind", ["topic", "glossary", "physicist"]);
  if (error) throw error;

  // Drop rows whose registry entry isn't live — the DB can hold drafts ahead
  // of launch — and rows in locales the site does not route (they would 404).
  const routed = new Set<string>(locales);
  const rows: RealEntry[] = ((data ?? []) as RealEntry[]).filter(
    (r) => routed.has(r.locale) && isPublished(r.kind, r.slug),
  );

  // Group locales per (kind, slug) so we can emit hreflang alternates correctly.
  const realLocalesBySlug = new Map<string, Set<string>>();
  for (const r of rows) {
    const key = `${r.kind}::${r.slug}`;
    if (!realLocalesBySlug.has(key)) realLocalesBySlug.set(key, new Set());
    realLocalesBySlug.get(key)!.add(r.locale);
  }

  const dynamicPages: MetadataRoute.Sitemap = rows.map((r) => {
    const key = `${r.kind}::${r.slug}`;
    const realSet = realLocalesBySlug.get(key) ?? new Set([r.locale]);
    const path = pathFor(r.kind, r.slug);
    const priority = r.kind === "topic" ? 0.9 : r.kind === "physicist" ? 0.6 : 0.5;
    return entry(path, r.locale, realSet, r.updated_at ?? now, "monthly", priority);
  });

  return [...staticPages, ...dynamicPages];
}
