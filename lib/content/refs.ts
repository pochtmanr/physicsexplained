import { BRANCHES } from "./branches";
import { GLOSSARY } from "./glossary";
import { PHYSICISTS } from "./physicists";
import type { TopicRef } from "./types";

const KEBAB_CASE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

function topicRefExists(ref: TopicRef): boolean {
  const branch = BRANCHES.find((b) => b.slug === ref.branchSlug);
  if (!branch) return false;
  return branch.topics.some((t) => t.slug === ref.topicSlug);
}

export function validateContentRefs():
  | { ok: true }
  | { ok: false; errors: string[] } {
  const errors: string[] = [];

  const physicistSlugs = new Set<string>();
  for (const p of PHYSICISTS) {
    if (!KEBAB_CASE.test(p.slug)) {
      errors.push(`physicist slug is not kebab-case: "${p.slug}"`);
    }
    if (physicistSlugs.has(p.slug)) {
      errors.push(`duplicate physicist slug: "${p.slug}"`);
    }
    physicistSlugs.add(p.slug);

    for (const ref of p.relatedTopics) {
      if (!topicRefExists(ref)) {
        errors.push(
          `physicist "${p.slug}" references missing topic ${ref.branchSlug}/${ref.topicSlug}`,
        );
      }
    }
  }

  const termSlugs = new Set<string>();
  for (const t of GLOSSARY) {
    if (!KEBAB_CASE.test(t.slug)) {
      errors.push(`glossary slug is not kebab-case: "${t.slug}"`);
    }
    if (termSlugs.has(t.slug)) {
      errors.push(`duplicate glossary slug: "${t.slug}"`);
    }
    termSlugs.add(t.slug);

    if (t.relatedPhysicists) {
      for (const slug of t.relatedPhysicists) {
        if (!physicistSlugs.has(slug)) {
          errors.push(
            `glossary "${t.slug}" references missing physicist "${slug}"`,
          );
        }
      }
    }

    if (t.relatedTopics) {
      for (const ref of t.relatedTopics) {
        if (!topicRefExists(ref)) {
          errors.push(
            `glossary "${t.slug}" references missing topic ${ref.branchSlug}/${ref.topicSlug}`,
          );
        }
      }
    }
  }

  if (errors.length > 0) {
    return { ok: false, errors };
  }
  return { ok: true };
}
