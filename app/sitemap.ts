import type { MetadataRoute } from "next";
import { BRANCHES } from "@/lib/content/branches";
import { supabase } from "@/lib/supabase";
import { locales, defaultLocale } from "@/i18n/config";
import { SITE } from "@/lib/seo/config";
import { isPublished } from "@/lib/seo/published";
import { EQUATIONS } from "@/lib/content/equations";
import { PLAYGROUND_SLUGS } from "@/app/[locale]/play/_components/playground-meta";

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
  realLocaleSet: Set<string>,
  lastModified: string,
  changeFrequency: ChangeFreq,
  priority: number,
): MetadataRoute.Sitemap[number] {
  const languages: Record<string, string> = {};
  for (const l of locales) {
    if (l === locale) continue;
    if (realLocaleSet.has(l)) {
      languages[l] = SITE.localizedUrl(path, l);
    }
  }
  return {
    url: SITE.localizedUrl(path, locale),
    lastModified,
    changeFrequency,
    priority,
    ...(Object.keys(languages).length > 0 ? { alternates: { languages } } : {}),
  };
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date().toISOString();

  // Static pages — only emit default locale URLs for now.
  const staticPaths: Array<[string, ChangeFreq, number]> = [
    ["/", "weekly", 1.0],
    ["/about", "monthly", 0.6],
    ["/physicists", "monthly", 0.7],
    ["/dictionary", "monthly", 0.7],
    ["/equations", "monthly", 0.7],
    ["/play", "monthly", 0.5],
    ...EQUATIONS.map((e): [string, ChangeFreq, number] => [
      `/equations/${e.slug}`,
      "monthly",
      0.6,
    ]),
    ...PLAYGROUND_SLUGS.map((slug): [string, ChangeFreq, number] => [
      `/play/${slug}`,
      "monthly",
      0.5,
    ]),
    ["/privacy", "yearly", 0.3],
    ["/terms", "yearly", 0.3],
    ["/cookies", "yearly", 0.3],
  ];
  const staticPages: MetadataRoute.Sitemap = staticPaths.map(([p, freq, prio]) => ({
    url: SITE.localizedUrl(p, defaultLocale),
    lastModified: now,
    changeFrequency: freq,
    priority: prio,
  }));

  const branchPages: MetadataRoute.Sitemap = BRANCHES.filter(
    (b) => b.status === "live",
  ).map((b) => ({
    url: SITE.localizedUrl(`/${b.slug}`, defaultLocale),
    lastModified: now,
    changeFrequency: "monthly",
    priority: 0.8,
  }));

  // Pull all real rows for all locales.
  const { data, error } = await supabase
    .from("content_entries")
    .select("kind, slug, locale, updated_at")
    .in("kind", ["topic", "glossary", "physicist"]);
  if (error) throw error;

  // Drop rows whose registry entry isn't live — the DB can hold drafts ahead
  // of launch, and those must not leak into the sitemap.
  const rows: RealEntry[] = ((data ?? []) as RealEntry[]).filter((r) =>
    isPublished(r.kind, r.slug),
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

  return [...staticPages, ...branchPages, ...dynamicPages];
}
