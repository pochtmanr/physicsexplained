// Registry-side publish gate for content that also has rows in Supabase.
// The DB can hold draft/coming-soon rows ahead of launch; anything surfaced
// to crawlers (sitemap, llms.txt, markdown mirrors) must pass this check.

import { getBranch, getTopic } from "@/lib/content/branches";
import { getTerm } from "@/lib/content/glossary";
import { getPhysicist } from "@/lib/content/physicists";
import type { ContentKind } from "@/lib/content/fetch";

export function isPublished(kind: ContentKind, slug: string): boolean {
  if (kind === "glossary") return getTerm(slug) !== undefined;
  if (kind === "physicist") return getPhysicist(slug) !== undefined;

  // Topic slugs are stored as "branch/topic".
  const [branchSlug, ...rest] = slug.split("/");
  const topicSlug = rest.join("/");
  if (!topicSlug) return false;
  const branch = getBranch(branchSlug);
  if (!branch || branch.status !== "live") return false;
  return getTopic(branchSlug, topicSlug)?.status === "live";
}
