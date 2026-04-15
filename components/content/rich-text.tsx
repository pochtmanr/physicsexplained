import type { ReactNode } from "react";
import { PhysicistLink } from "./physicist-link";
import { PHYSICISTS } from "@/lib/content/physicists";

interface MatchEntry {
  pattern: string;
  slug: string;
}

function buildMatchTable(): MatchEntry[] {
  const entries: MatchEntry[] = [];

  for (const p of PHYSICISTS) {
    entries.push({ pattern: p.name, slug: p.slug });
    if (p.shortName !== p.name) {
      entries.push({ pattern: p.shortName, slug: p.slug });
    }
  }

  // Sort longest first so "Christiaan Huygens" matches before "Huygens"
  entries.sort((a, b) => b.pattern.length - a.pattern.length);
  return entries;
}

const MATCH_TABLE = buildMatchTable();

const WORD_BOUNDARY = /[\s,.;:!?()\[\]{}"'—–\-\/]/;

function renderInlineEmphasis(text: string, keyPrefix: string): ReactNode[] {
  const out: ReactNode[] = [];
  const re = /\*\*(.+?)\*\*|\*(.+?)\*/g;
  let lastIdx = 0;
  let key = 0;
  let match: RegExpExecArray | null;
  while ((match = re.exec(text)) !== null) {
    if (match.index > lastIdx) {
      out.push(text.slice(lastIdx, match.index));
    }
    if (match[1] !== undefined) {
      out.push(
        <strong key={`${keyPrefix}-b-${key++}`} className="font-semibold text-[var(--color-fg-0)]">
          {match[1]}
        </strong>
      );
    } else if (match[2] !== undefined) {
      out.push(
        <em key={`${keyPrefix}-i-${key++}`}>{match[2]}</em>
      );
    }
    lastIdx = match.index + match[0].length;
  }
  if (lastIdx < text.length) out.push(text.slice(lastIdx));
  return out;
}

/**
 * Takes a plain text string and replaces known physicist names with
 * hover-card links (first occurrence of each physicist only).
 * Also renders **bold** and *italic* markdown emphasis.
 */
export function RichText({ text }: { text: string }): ReactNode {
  const nodes: ReactNode[] = [];
  let remaining = text;
  let key = 0;
  const linked = new Set<string>();

  const pushPlain = (segment: string) => {
    for (const node of renderInlineEmphasis(segment, `e${key++}`)) {
      nodes.push(node);
    }
  };

  while (remaining.length > 0) {
    let bestMatch: MatchEntry | null = null;
    let bestIdx = Infinity;

    for (const entry of MATCH_TABLE) {
      const idx = remaining.indexOf(entry.pattern);
      if (idx !== -1 && idx < bestIdx) {
        bestIdx = idx;
        bestMatch = entry;
      }
      if (bestIdx === 0) break;
    }

    if (!bestMatch || bestIdx === Infinity) {
      pushPlain(remaining);
      break;
    }

    if (bestIdx > 0) {
      pushPlain(remaining.slice(0, bestIdx));
    }

    const charBefore = bestIdx > 0 ? remaining[bestIdx - 1] : " ";
    const charAfter = remaining[bestIdx + bestMatch.pattern.length] ?? " ";
    const isWordBound =
      WORD_BOUNDARY.test(charBefore) && WORD_BOUNDARY.test(charAfter);

    if (isWordBound && !linked.has(bestMatch.slug)) {
      linked.add(bestMatch.slug);
      nodes.push(
        <PhysicistLink key={key++} slug={bestMatch.slug}>
          {bestMatch.pattern}
        </PhysicistLink>
      );
    } else {
      nodes.push(bestMatch.pattern);
    }

    remaining = remaining.slice(bestIdx + bestMatch.pattern.length);
  }

  return <>{nodes}</>;
}
