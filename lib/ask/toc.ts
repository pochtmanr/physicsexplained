// Cacheable table-of-contents the model sees. Keep the rendered output
// byte-deterministic so prompt-caching works.
import { supabase } from "@/lib/supabase";

export interface TocData {
  topics: Array<{ slug: string; title: string; subtitle: string | null }>;
  physicists: Array<{ slug: string; title: string; oneLiner: string | null }>;
  glossaryCategoryCounts: Array<{ category: string; count: number }>;
  scenes: Array<{ id: string; label: string; description: string }>;
}

export async function buildToc(locale = "en"): Promise<TocData> {
  const [topics, physicists, glossaryRows, scenes] = await Promise.all([
    supabase.from("content_entries").select("slug,title,subtitle")
      .eq("kind", "topic").eq("locale", locale).order("slug"),
    supabase.from("content_entries").select("slug,title,meta")
      .eq("kind", "physicist").eq("locale", locale).order("slug"),
    supabase.from("content_entries").select("meta")
      .eq("kind", "glossary").eq("locale", locale),
    supabase.from("scene_catalog").select("id,label,description").order("id"),
  ]);

  const glossaryCats = new Map<string, number>();
  (glossaryRows.data ?? []).forEach((r) => {
    const cat = (r.meta as { category?: string } | null)?.category ?? "concept";
    glossaryCats.set(cat, (glossaryCats.get(cat) ?? 0) + 1);
  });

  return {
    topics: (topics.data ?? []).map((t) => ({ slug: t.slug, title: t.title, subtitle: t.subtitle })),
    physicists: (physicists.data ?? []).map((p) => ({
      slug: p.slug,
      title: p.title,
      oneLiner: (p.meta as { oneLiner?: string } | null)?.oneLiner ?? null,
    })),
    glossaryCategoryCounts: [...glossaryCats.entries()].sort().map(([category, count]) => ({ category, count })),
    scenes: (scenes.data ?? []).map((s) => ({ id: s.id, label: s.label, description: s.description })),
  };
}

export function renderToc(toc: TocData): string {
  const lines: string[] = ["# Site content (for your reference)", ""];
  lines.push("## Topics");
  toc.topics.forEach((t) =>
    lines.push(`- ${t.slug} — ${t.title}${t.subtitle ? ` — ${t.subtitle}` : ""}`),
  );
  lines.push("", "## Physicists");
  toc.physicists.forEach((p) =>
    lines.push(`- ${p.slug} — ${p.title}${p.oneLiner ? ` — ${p.oneLiner}` : ""}`),
  );
  lines.push("", "## Glossary categories (use searchGlossary / listGlossaryByCategory)");
  toc.glossaryCategoryCounts.forEach((c) => lines.push(`- ${c.category} — ${c.count} entries`));
  lines.push("", "## Scenes available to showScene");
  toc.scenes.forEach((s) => lines.push(`- ${s.id} — ${s.label} — ${s.description}`));
  return lines.join("\n");
}
