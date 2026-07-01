import { getContentEntry, type ContentKind } from "@/lib/content/fetch";
import { entryToMarkdown } from "@/lib/content/markdown";
import { isPublished } from "@/lib/seo/published";
import { SITE } from "@/lib/seo/config";

export const revalidate = 86400;

// Markdown mirrors of content pages, addressable as /{page-path}.md via the
// rewrite in next.config.mjs (advertised in /llms.txt for AI crawlers).
//   /md/{branch}/{topic}     → topic essay
//   /md/dictionary/{slug}    → glossary term
//   /md/physicists/{slug}    → physicist biography
function resolve(path: string[]): { kind: ContentKind; slug: string; pagePath: string } | null {
  if (path.length !== 2) return null;
  const [head, tail] = path;
  if (head === "dictionary") {
    return { kind: "glossary", slug: tail, pagePath: `/dictionary/${tail}` };
  }
  if (head === "physicists") {
    return { kind: "physicist", slug: tail, pagePath: `/physicists/${tail}` };
  }
  return { kind: "topic", slug: `${head}/${tail}`, pagePath: `/${head}/${tail}` };
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ path: string[] }> },
): Promise<Response> {
  const { path } = await params;
  const target = resolve(path);
  if (!target || !isPublished(target.kind, target.slug)) {
    return new Response("Not found", { status: 404 });
  }

  const entry = await getContentEntry(target.kind, target.slug, "en");
  if (!entry) return new Response("Not found", { status: 404 });

  const markdown = entryToMarkdown(entry, {
    baseUrl: SITE.baseUrl,
    url: SITE.buildUrl(target.pagePath),
  });

  return new Response(markdown, {
    headers: { "Content-Type": "text/markdown; charset=utf-8" },
  });
}
