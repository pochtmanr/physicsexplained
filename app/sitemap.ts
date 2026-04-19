import type { MetadataRoute } from "next";
import { BRANCHES } from "@/lib/content/branches";
import { PHYSICISTS } from "@/lib/content/physicists";
import { GLOSSARY } from "@/lib/content/glossary";
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

export default function sitemap(): MetadataRoute.Sitemap {
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

  const topicPages: MetadataRoute.Sitemap = BRANCHES.flatMap((b) =>
    b.topics
      .filter((t) => t.status === "live")
      .map((t) => entry(`/${b.slug}/${t.slug}`, now, "monthly", 0.9)),
  );

  const physicistPages: MetadataRoute.Sitemap = PHYSICISTS.map((p) =>
    entry(`/physicists/${p.slug}`, now, "monthly", 0.6),
  );

  const dictionaryPages: MetadataRoute.Sitemap = GLOSSARY.map((term) =>
    entry(`/dictionary/${term.slug}`, now, "monthly", 0.5),
  );

  return [
    ...staticPages,
    ...branchPages,
    ...topicPages,
    ...physicistPages,
    ...dictionaryPages,
  ];
}
