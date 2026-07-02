import { getContentEntriesByKind } from "@/lib/content/fetch";
import { getLiveBranches } from "@/lib/content/branches";
import { entryToMarkdown } from "@/lib/content/markdown";
import { isPublished } from "@/lib/seo/published";
import { SITE } from "@/lib/seo/config";

export const revalidate = 86400;

export async function GET(): Promise<Response> {
  const entries = await getContentEntriesByKind("topic", "en", true);
  const bySlug = new Map(entries.map((e) => [e.slug, e]));

  // Emit in curriculum order (branch index, then topic order within it),
  // restricted to registry-live topics — DB drafts stay out.
  const documents: string[] = [];
  for (const branch of getLiveBranches()) {
    for (const topic of branch.topics) {
      const slug = `${branch.slug}/${topic.slug}`;
      const entry = bySlug.get(slug);
      if (!entry || !isPublished("topic", slug)) continue;
      documents.push(
        entryToMarkdown(entry, {
          baseUrl: SITE.baseUrl,
          url: SITE.buildUrl(`/${slug}`),
        }),
      );
    }
  }

  const header = `# ${SITE.name} — full corpus\n\n> ${SITE.tagline}\n\nEvery live essay on ${SITE.baseUrl}, as plain Markdown. Canonical HTML pages are linked in each document's Source footer. See ${SITE.baseUrl}/llms.txt for the index.\n`;

  return new Response([header, ...documents].join("\n\n---\n\n"), {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}
