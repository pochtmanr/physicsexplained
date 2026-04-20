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
