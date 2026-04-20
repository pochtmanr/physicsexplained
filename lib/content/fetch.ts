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
): Promise<Omit<ContentEntry, "localeFallback">[]> {
  const { data, error } = await supabase
    .from("content_entries")
    .select("*")
    .eq("kind", kind)
    .eq("locale", locale);

  if (error) throw error;
  if (!data) return [];

  return data.map((row) => ({
    kind: row.kind as ContentKind,
    slug: row.slug,
    locale: row.locale,
    title: row.title,
    subtitle: row.subtitle,
    blocks: (row.blocks ?? []) as Block[],
    asideBlocks: (row.aside_blocks ?? []) as Block[],
    meta: (row.meta ?? {}) as Record<string, unknown>,
    sourceHash: row.source_hash,
  }));
}

/**
 * Fetch all entries of a given kind for a given locale, falling back to the
 * English row for any slug that lacks a translation.
 */
export const getContentEntriesByKind = cache(
  async (kind: ContentKind, locale: string): Promise<ContentEntry[]> => {
    const primary = await fetchMany(kind, locale);
    const primaryBySlug = new Map(primary.map((e) => [e.slug, e]));

    if (locale === "en") {
      return primary.map((e) => ({ ...e, localeFallback: false }));
    }

    const english = await fetchMany(kind, "en");
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
