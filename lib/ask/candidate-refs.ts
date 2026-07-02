import type { SupabaseClient } from "@supabase/supabase-js";

const TOPIC_LIMIT = 5;
const PHYSICIST_LIMIT = 3;
const GLOSSARY_LIMIT = 5;
const SCENE_LIMIT = 8;

// Max chars per blurb included in the prompt block. FTS snippets aren't
// returned, so we use subtitle (topics/physicists) and meta.shortDefinition
// (glossary). Capped to keep the system-dynamic block small.
const BLURB_MAX = 120;

export interface CandidateRefs {
  topics: Array<{ slug: string; title: string; subtitle: string | null }>;
  physicists: Array<{ slug: string; title: string; subtitle: string | null }>;
  glossary: Array<{ slug: string; term: string; shortDefinition: string }>;
  scenes: Array<{ id: string; figLabel: string | null; label: string; description: string }>;
}

export interface CandidateRefsResult {
  block: string;
  refs: CandidateRefs;
}

// The websearch FTS parser ANDs every term, so a natural question like
// "Explain the Biot-Savart law for a long straight wire" only matches essays
// containing the literal word "explain" — near-guaranteed zero hits. Strip
// conversational filler before searching. Deliberately does NOT include
// physics-meaningful words (work, force, field, long, mean...).
const QUERY_STOPWORDS = new Set([
  "a", "an", "the", "is", "are", "was", "were", "be", "been", "being",
  "do", "does", "did", "done", "can", "could", "would", "should", "will",
  "shall", "may", "might", "must", "of", "for", "to", "in", "on", "at",
  "by", "with", "from", "into", "onto", "over", "under", "between",
  "around", "along", "through", "across", "about", "and", "or", "but",
  "not", "no", "if", "then", "than", "so", "as", "that", "this", "these",
  "those", "it", "its", "i", "me", "my", "we", "us", "our", "you", "your",
  "he", "him", "his", "she", "her", "they", "them", "their", "there",
  "what", "which", "who", "whom", "whose", "when", "where", "why", "how",
  "explain", "show", "tell", "describe", "derive", "prove", "please",
  "help", "understand", "give", "want", "like", "need", "wondering",
  "curious", "question", "asking", "ask",
]);

/**
 * Normalize a user question into an FTS-friendly term list: dashes become
 * spaces (essays write "Biot–Savart" with an en dash; users type a hyphen —
 * the websearch parser would otherwise demand a compound token that never
 * matches), punctuation is dropped, conversational filler is stripped.
 * Exported for tests.
 */
export function cleanFtsQuery(msg: string): string {
  return msg
    .toLowerCase()
    .replace(/[—–-]/g, " ")
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .split(/\s+/)
    .filter((w) => w.length > 1 && !QUERY_STOPWORDS.has(w))
    .slice(0, 12)
    .join(" ");
}

/**
 * Last-resort recall: OR the few longest (≈ most informative) terms. The
 * websearch parser understands the "or" keyword. Exported for tests.
 */
export function orFallbackQuery(cleaned: string): string {
  const terms = Array.from(new Set(cleaned.split(" ").filter(Boolean)))
    .sort((a, b) => b.length - a.length)
    .slice(0, 4);
  return terms.join(" or ");
}

/**
 * Pre-retrieve a compact list of site references the model may cite, derived
 * from one FTS query per content kind. Returns a markdown block to append to
 * the system-dynamic prompt plus the raw refs (useful for analytics / tests).
 *
 * Intentionally uses the same `search_doc` FTS index that powers the
 * interactive searchSiteContent / searchGlossary tools — consistent recall,
 * zero tool hops. Returns an empty block on FTS parse errors (e.g. punctuation
 * the websearch parser rejects); never throws.
 */
export async function buildCandidateRefs(
  db: SupabaseClient,
  locale: string,
  userMsg: string,
): Promise<CandidateRefsResult> {
  const q = cleanFtsQuery(userMsg);
  if (!q) return emptyResult();

  // Dynamic select strings defeat supabase-js's literal-type parsing (it
  // infers GenericStringError); the row shape is asserted here instead.
  const searchContent = (
    kind: string, select: string, limit: number, query: string,
  ): PromiseLike<{ data: Array<Record<string, unknown>> | null }> =>
    db.from("content_entries")
      .select(select)
      .eq("kind", kind).eq("locale", locale)
      .textSearch("search_doc", query, { type: "websearch", config: "simple" })
      .limit(limit) as unknown as PromiseLike<{ data: Array<Record<string, unknown>> | null }>;
  const searchScenes = (query: string) =>
    db.from("scene_catalog")
      .select("id,fig_label,label,description")
      .textSearch("search_doc", query, { type: "websearch", config: "simple" })
      .limit(SCENE_LIMIT);

  const [topicsRes, physicistsRes, glossaryRes, scenesFtsRes] = await Promise.all([
    searchContent("topic", "slug,title,subtitle", TOPIC_LIMIT, q),
    searchContent("physicist", "slug,title,subtitle", PHYSICIST_LIMIT, q),
    searchContent("glossary", "slug,title,meta", GLOSSARY_LIMIT, q),
    searchScenes(q),
  ]);

  // AND-query recall floor: if neither topics nor scenes matched (common for
  // wordy questions), retry both with an OR of the most informative terms.
  let topicsData = topicsRes.data ?? [];
  let scenesFtsData: Array<Record<string, unknown>> = scenesFtsRes.data ?? [];
  if (topicsData.length === 0 && scenesFtsData.length === 0) {
    const q2 = orFallbackQuery(q);
    if (q2 && q2 !== q) {
      const [t2, s2] = await Promise.all([
        searchContent("topic", "slug,title,subtitle", TOPIC_LIMIT, q2),
        searchScenes(q2),
      ]);
      topicsData = t2.data ?? [];
      scenesFtsData = s2.data ?? [];
    }
  }

  // Scene recall workhorse: figure captions rarely contain the concept name
  // (FIG.13b's caption never says "Biot-Savart"), so direct FTS over the scene
  // catalog often misses. Topic FTS searches full essay text and is far more
  // reliable — join the retrieved topics' scenes and put them FIRST.
  const topicSlugs = topicsData.map((r) => r.slug as string);
  const scenesJoinRes = topicSlugs.length
    ? await db.from("scene_catalog")
        .select("id,fig_label,label,description,topic_slugs")
        .overlaps("topic_slugs", topicSlugs)
        .limit(SCENE_LIMIT * 3)
    : { data: [] };

  // The overlaps query returns rows in arbitrary order; sort by the rank of
  // the scene's topic in the FTS result so the most relevant essay's figures
  // survive the SCENE_LIMIT cap.
  const topicRank = new Map(topicSlugs.map((s, i) => [s, i]));
  const joined = [...(scenesJoinRes.data ?? [])].sort((a, b) => rankOf(a, topicRank) - rankOf(b, topicRank));

  const seenScenes = new Set<string>();
  const scenes: CandidateRefs["scenes"] = [];
  for (const r of [...joined, ...scenesFtsData]) {
    if (scenes.length >= SCENE_LIMIT) break;
    if (seenScenes.has(r.id as string)) continue;
    seenScenes.add(r.id as string);
    scenes.push({
      id: r.id as string,
      figLabel: (r.fig_label as string | null) ?? null,
      label: r.label as string,
      description: r.description as string,
    });
  }

  const refs: CandidateRefs = {
    scenes,
    topics: topicsData.map((r) => ({
      slug: r.slug as string,
      title: r.title as string,
      subtitle: (r.subtitle as string | null) ?? null,
    })),
    physicists: (physicistsRes.data ?? []).map((r) => ({
      slug: r.slug as string,
      title: r.title as string,
      subtitle: (r.subtitle as string | null) ?? null,
    })),
    glossary: (glossaryRes.data ?? []).map((r) => ({
      slug: r.slug as string,
      term: r.title as string,
      shortDefinition:
        ((r.meta as { shortDefinition?: string } | null) ?? {}).shortDefinition ?? "",
    })),
  };

  return { block: formatBlock(refs), refs };
}

function rankOf(row: { topic_slugs?: unknown }, topicRank: Map<string, number>): number {
  const slugs = Array.isArray(row.topic_slugs) ? (row.topic_slugs as string[]) : [];
  return Math.min(...slugs.map((s) => topicRank.get(s) ?? Infinity), Infinity);
}

function emptyResult(): CandidateRefsResult {
  return { block: "", refs: { topics: [], physicists: [], glossary: [], scenes: [] } };
}

function truncate(s: string, max = BLURB_MAX): string {
  if (s.length <= max) return s;
  return s.slice(0, max - 1).trimEnd() + "…";
}

// Exported for tests only.
export function formatBlock(refs: CandidateRefs): string {
  const total =
    refs.topics.length + refs.physicists.length + refs.glossary.length + refs.scenes.length;
  if (total === 0) return "";

  const lines: string[] = [
    "# Available site references",
    "Cite ONLY from this list, using the exact slug. Do not invent slugs. Do not cite anything not listed here.",
    "",
  ];
  if (refs.topics.length) {
    lines.push("## Topics (use `:::cite{kind=\"topic\" slug=\"...\"}`)");
    refs.topics.forEach((t) => {
      const sub = t.subtitle ? ` — ${truncate(t.subtitle)}` : "";
      lines.push(`- ${t.slug} — ${t.title}${sub}`);
    });
    lines.push("");
  }
  if (refs.physicists.length) {
    lines.push("## Physicists (use `:::cite{kind=\"physicist\" slug=\"...\"}`)");
    refs.physicists.forEach((p) => {
      const sub = p.subtitle ? ` — ${truncate(p.subtitle)}` : "";
      lines.push(`- ${p.slug} — ${p.title}${sub}`);
    });
    lines.push("");
  }
  if (refs.glossary.length) {
    lines.push("## Glossary (place `:::cite{kind=\"glossary\" slug=\"...\"}` fences at the very end)");
    refs.glossary.forEach((g) => {
      const sub = g.shortDefinition ? ` — ${truncate(g.shortDefinition)}` : "";
      lines.push(`- ${g.slug} — ${g.term}${sub}`);
    });
    lines.push("");
  }
  if (refs.scenes.length) {
    lines.push(
      "## Scenes you may embed (write the fence directly: `:::scene{id=\"...\"}` + `:::` on the next line)",
      "If one of these directly illustrates your answer, embed it — interactive figures beat prose alone.",
    );
    refs.scenes.forEach((s) => {
      const fig = s.figLabel ? `${s.figLabel} — ` : "";
      lines.push(`- ${s.id} — ${fig}${truncate(s.description, 90)}`);
    });
    lines.push("");
  }
  return lines.join("\n").trimEnd();
}
