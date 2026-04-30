import "server-only";
import { cache } from "react";
import { supabase } from "@/lib/supabase";
import type { ContentKind } from "@/lib/content/fetch";

export const getRealLocaleSet = cache(
  async (kind: ContentKind, slug: string): Promise<Set<string>> => {
    const { data, error } = await supabase
      .from("content_entries")
      .select("locale")
      .eq("kind", kind)
      .eq("slug", slug);
    if (error) throw error;
    return new Set((data ?? []).map((row) => row.locale as string));
  },
);
