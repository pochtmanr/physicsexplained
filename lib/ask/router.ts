import type { ClassifierLabel } from "./types";

const VIZ_RE =
  /\b(plot|graph|graphs|visuali[sz]e|visualis(?:e|ing)|draw|sketch|animate|simulate|chart|render)\b/i;

const DEFINE_RE =
  /^\s*(what\s+is|what\s+are|what'?s|define|definition\s+of|meaning\s+of|who\s+is|who\s+was|who\s+were)\b/i;

// Comparisons and multi-part conceptual questions are NOT glossary lookups even
// if they happen to start with "what is/what's". They need the broader
// conceptual-explain path (or classifier fallback) so the model can actually
// reason through the comparison.
const COMPARE_RE =
  /\b(difference|differences|compare|compared|comparison|versus|vs\.?|vs)\b/i;

const POINTER_RE =
  /\b(where\s+can\s+i\s+(?:read|learn|find)|point\s+me\s+to|which\s+topic|which\s+article|article\s+(?:on|about)|read\s+more\s+about)\b/i;

const CALC_RE =
  /\b(compute|calculate|evaluate|solve|work\s+out|how\s+many|how\s+much|what\s+is\s+the\s+(?:value|speed|mass|energy|force|momentum|period|frequency)\s+of)\b/i;

const WEB_RE =
  /\b(latest|current|today|this\s+year|recent|news|2025|2026|citation|arxiv|doi|source)\b/i;

/**
 * Heuristic router — returns a classifier label when the user's intent is
 * strongly signaled by keywords, letting us skip the classifier RTT (~200–400ms).
 *
 * Returns `null` when the signal is ambiguous; callers should fall back to the
 * LLM classifier. Off-topic detection is never attempted here (too risky); that
 * path always goes through the classifier.
 */
export function selectInitialTools(userMsg: string): ClassifierLabel | null {
  const m = userMsg.trim();
  if (!m || m.length > 400) return null;

  // Order matters: specific intents (viz, calculation, web-freshness, pointer)
  // win over the generic "what is …" definition pattern. "What is the latest
  // value of c?" is a WEB query, not a glossary lookup, even though both match.
  if (VIZ_RE.test(m)) return "viz-request";
  if (CALC_RE.test(m)) return "calculation";
  if (WEB_RE.test(m)) return "conceptual-explain";
  if (POINTER_RE.test(m)) return "article-pointer";
  // Compare-style questions ("what's the difference between X and Y") are
  // conceptual, not definitional — even though they start with "what's".
  if (COMPARE_RE.test(m)) return "conceptual-explain";
  if (DEFINE_RE.test(m) && m.length <= 120) return "glossary-lookup";

  return null;
}
