import type { MetadataRoute } from "next";
import { BRANCHES } from "@/lib/content/branches";
import { supabase } from "@/lib/supabase";
import { locales, defaultLocale } from "@/i18n/config";

const BASE = "https://physics.it.com";

type ChangeFreq = NonNullable<MetadataRoute.Sitemap[number]["changeFrequency"]>;

/**
 * Build a URL for a given locale. Default locale has no prefix
 * (next-intl routing uses `localePrefix: "as-needed"`).
 */
function localized(path: string, locale: string): string {
  const clean = path === "/" ? "" : path;
  return locale === defaultLocale
    ? `${BASE}${clean || "/"}`
    : `${BASE}/${locale}${clean}`;
}

/**
 * Emit a sitemap entry with hreflang alternates for every supported locale.
 * The canonical URL is the default-locale variant; alternates expose the rest
 * to Google via the xhtml:link language hint.
 */
function entry(
  path: string,
  lastModified: string,
  changeFrequency: ChangeFreq,
  priority: number,
): MetadataRoute.Sitemap[number] {
  const languages = Object.fromEntries(
    locales.map((l) => [l, localized(path, l)]),
  );
  return {
    url: localized(path, defaultLocale),
    lastModified,
    changeFrequency,
    priority,
    alternates: { languages },
  };
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date().toISOString();

  const staticPages: MetadataRoute.Sitemap = [
    entry("/", now, "weekly", 1.0),
    entry("/about", now, "monthly", 0.6),
    entry("/physicists", now, "monthly", 0.7),
    entry("/dictionary", now, "monthly", 0.7),
    entry("/privacy", now, "yearly", 0.3),
    entry("/terms", now, "yearly", 0.3),
    entry("/cookies", now, "yearly", 0.3),
  ];

  const branchPages: MetadataRoute.Sitemap = BRANCHES.map((b) =>
    entry(`/${b.slug}`, now, "monthly", 0.8),
  );

  // Pull live content slugs directly from Supabase so the sitemap never drifts
  // from the database that actually renders the pages.
  const [topicRes, physicistRes, glossaryRes] = await Promise.all([
    supabase
      .from("content_entries")
      .select("slug, updated_at")
      .eq("kind", "topic")
      .eq("locale", defaultLocale)
      .order("slug"),
    supabase
      .from("content_entries")
      .select("slug, updated_at")
      .eq("kind", "physicist")
      .eq("locale", defaultLocale)
      .order("slug"),
    supabase
      .from("content_entries")
      .select("slug, updated_at")
      .eq("kind", "glossary")
      .eq("locale", defaultLocale)
      .order("slug"),
  ]);

  const topicPages: MetadataRoute.Sitemap = (topicRes.data ?? []).map((t) =>
    entry(`/${t.slug}`, t.updated_at ?? now, "monthly", 0.9),
  );

  const physicistPages: MetadataRoute.Sitemap = (physicistRes.data ?? []).map((p) =>
    entry(`/physicists/${p.slug}`, p.updated_at ?? now, "monthly", 0.6),
  );

  const dictionaryPages: MetadataRoute.Sitemap = (glossaryRes.data ?? []).map((g) =>
    entry(`/dictionary/${g.slug}`, g.updated_at ?? now, "monthly", 0.5),
  );

  return [
    ...staticPages,
    ...branchPages,
    ...topicPages,
    ...physicistPages,
    ...dictionaryPages,
  ];
}
