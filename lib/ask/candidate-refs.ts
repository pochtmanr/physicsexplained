import type { SupabaseClient } from "@supabase/supabase-js";

const TOPIC_LIMIT = 5;
const PHYSICIST_LIMIT = 3;
const GLOSSARY_LIMIT = 5;

// Max chars per blurb included in the prompt block. FTS snippets aren't
// returned, so we use subtitle (topics/physicists) and meta.shortDefinition
// (glossary). Capped to keep the system-dynamic block small.
const BLURB_MAX = 120;

export interface CandidateRefs {
  topics: Array<{ slug: string; title: string; subtitle: string | null }>;
  physicists: Array<{ slug: string; title: string; subtitle: string | null }>;
  glossary: Array<{ slug: string; term: string; shortDefinition: string }>;
}

export interface CandidateRefsResult {
  block: string;
  refs: CandidateRefs;
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
  const q = userMsg.trim();
  if (!q) return emptyResult();

  const [topicsRes, physicistsRes, glossaryRes] = await Promise.all([
    db.from("content_entries")
      .select("slug,title,subtitle")
      .eq("kind", "topic").eq("locale", locale)
      .textSearch("search_doc", q, { type: "websearch", config: "simple" })
      .limit(TOPIC_LIMIT),
    db.from("content_entries")
      .select("slug,title,subtitle")
      .eq("kind", "physicist").eq("locale", locale)
      .textSearch("search_doc", q, { type: "websearch", config: "simple" })
      .limit(PHYSICIST_LIMIT),
    db.from("content_entries")
      .select("slug,title,meta")
      .eq("kind", "glossary").eq("locale", locale)
      .textSearch("search_doc", q, { type: "websearch", config: "simple" })
      .limit(GLOSSARY_LIMIT),
  ]);

  const refs: CandidateRefs = {
    topics: (topicsRes.data ?? []).map((r) => ({
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

function emptyResult(): CandidateRefsResult {
  return { block: "", refs: { topics: [], physicists: [], glossary: [] } };
}

function truncate(s: string, max = BLURB_MAX): string {
  if (s.length <= max) return s;
  return s.slice(0, max - 1).trimEnd() + "…";
}

function formatBlock(refs: CandidateRefs): string {
  const total = refs.topics.length + refs.physicists.length + refs.glossary.length;
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
  return lines.join("\n").trimEnd();
}
