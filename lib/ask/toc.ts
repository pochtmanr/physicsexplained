// Compact, cacheable table-of-contents the model sees.
//
// v3: this file used to do `count: "exact"` on content_entries and a full
// SELECT of every glossary row's meta just to compute category counts. On a
// large DB with no covering index those queries can sit on Supabase's
// statement timeout (10s) in parallel and stall the entire /ask route before
// the Anthropic request even starts. We no longer need any of that — the
// model doesn't care about exact counts and searches the glossary on demand.
// The only database hit here is the scene catalog, which is a small bounded
// table used directly by showScene.
import { supabase } from "@/lib/supabase";

const MAX_SCENES_RENDERED = 80;
const TOC_CACHE_TTL_MS = 10 * 60 * 1000;

export interface TocData {
  scenes: Array<{ id: string; label: string; description: string }>;
}

const tocCache = new Map<string, { at: number; data: TocData }>();

export async function buildToc(locale = "en"): Promise<TocData> {
  const cached = tocCache.get(locale);
  if (cached && Date.now() - cached.at < TOC_CACHE_TTL_MS) return cached.data;

  const scenes = await supabase
    .from("scene_catalog")
    .select("id,label,description")
    .order("id")
    .limit(MAX_SCENES_RENDERED);

  const data: TocData = {
    scenes: (scenes.data ?? []).map((s) => ({ id: s.id, label: s.label, description: s.description })),
  };
  tocCache.set(locale, { at: Date.now(), data });
  return data;
}

export function renderToc(toc: TocData): string {
  const lines: string[] = [
    "# Site content (you may cite these)",
    "",
    "The site contains topic articles, physicist pages, a glossary, and a scene catalog.",
    "Candidate topic/physicist/glossary references for this question are listed in the Available site references block below — cite from there. Call searchSiteContent ONLY when the user explicitly asks for a pointer (e.g. \"where can I read about X\").",
    "",
    "## Scenes available to showScene (id — label — description)",
  ];
  toc.scenes.forEach((s) => lines.push(`- ${s.id} — ${s.label} — ${s.description}`));
  return lines.join("\n");
}
