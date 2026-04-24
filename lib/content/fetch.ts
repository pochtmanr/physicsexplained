import "server-only";
import { cache } from "react";
import { supabase } from "@/lib/supabase";
import type { Block } from "@/lib/content/blocks";

export type ContentKind = "topic" | "physicist" | "glossary";

export interface ContentEntry {
  kind: ContentKind;
  slug: string;
  locale: string;
  title: string;
  subtitle: string | null;
  blocks: Block[];
  asideBlocks: Block[];
  meta: Record<string, unknown>;
  sourceHash: string | null;
  localeFallback: boolean;
}

async function fetchOne(
  kind: ContentKind,
  slug: string,
  locale: string,
): Promise<Omit<ContentEntry, "localeFallback"> | null> {
  const { data, error } = await supabase
    .from("content_entries")
    .select("*")
    .eq("kind", kind)
    .eq("slug", slug)
    .eq("locale", locale)
    .maybeSingle();

  if (error) throw error;
  if (!data) return null;

  return {
    kind: data.kind as ContentKind,
    slug: data.slug,
    locale: data.locale,
    title: data.title,
    subtitle: data.subtitle,
    blocks: (data.blocks ?? []) as Block[],
    asideBlocks: (data.aside_blocks ?? []) as Block[],
    meta: (data.meta ?? {}) as Record<string, unknown>,
    sourceHash: data.source_hash,
  };
}

export const getContentEntry = cache(
  async (
    kind: ContentKind,
    slug: string,
    locale: string,
  ): Promise<ContentEntry | null> => {
    const primary = await fetchOne(kind, slug, locale);
    if (primary) return { ...primary, localeFallback: false };

    if (locale !== "en") {
      const fallback = await fetchOne(kind, slug, "en");
      if (fallback) return { ...fallback, localeFallback: true };
    }
    return null;
  },
);

async function fetchMany(
  kind: ContentKind,
  locale: string,
  includeBlocks: boolean,
): Promise<Omit<ContentEntry, "localeFallback">[]> {
  const columns = includeBlocks
    ? "*"
    : "kind, slug, locale, title, subtitle, meta, source_hash";
  const { data, error } = await supabase
    .from("content_entries")
    .select(columns)
    .eq("kind", kind)
    .eq("locale", locale);

  if (error) throw error;
  if (!data) return [];

  return (data as unknown as Array<Record<string, unknown>>).map((row) => ({
    kind: row.kind as ContentKind,
    slug: row.slug as string,
    locale: row.locale as string,
    title: row.title as string,
    subtitle: (row.subtitle as string | null) ?? null,
    blocks: (includeBlocks ? (row.blocks ?? []) : []) as Block[],
    asideBlocks: (includeBlocks ? (row.aside_blocks ?? []) : []) as Block[],
    meta: (row.meta ?? {}) as Record<string, unknown>,
    sourceHash: (row.source_hash as string | null) ?? null,
  }));
}

/**
 * Fetch all entries of a given kind for a given locale, falling back to the
 * English row for any slug that lacks a translation. Listing pages (index
 * grids) never read block JSON — pass `includeBlocks: false` (the default) to
 * skip those columns and keep RSC payload small.
 */
export const getContentEntriesByKind = cache(
  async (
    kind: ContentKind,
    locale: string,
    includeBlocks = false,
  ): Promise<ContentEntry[]> => {
    if (locale === "en") {
      const primary = await fetchMany(kind, locale, includeBlocks);
      return primary.map((e) => ({ ...e, localeFallback: false }));
    }

    const [primary, english] = await Promise.all([
      fetchMany(kind, locale, includeBlocks),
      fetchMany(kind, "en", includeBlocks),
    ]);
    const primaryBySlug = new Map(primary.map((e) => [e.slug, e]));

    const merged: ContentEntry[] = [];
    for (const enEntry of english) {
      const localized = primaryBySlug.get(enEntry.slug);
      if (localized) {
        merged.push({ ...localized, localeFallback: false });
      } else {
        merged.push({ ...enEntry, localeFallback: true });
      }
    }
    return merged;
  },
);
