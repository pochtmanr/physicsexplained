import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import fg from "fast-glob";

const ROOT = process.cwd();
// fast-glob requires brackets and parens to be escaped with backslash
const TOPICS_GLOB = "app/\\[locale\\]/\\(topics\\)/*/*/page.tsx";

interface PageInfo {
  pagePath: string;       // absolute
  dir: string;            // absolute dir of the page.tsx
  slug: string;           // e.g. "classical-mechanics/the-simple-pendulum"
  ogPath: string;         // sibling opengraph-image.tsx path
}

const SLUG_REGEX = /const SLUG\s*=\s*"([^"]+)"/;

function discover(): PageInfo[] {
  const files = fg.sync(TOPICS_GLOB, { cwd: ROOT, absolute: true });
  const out: PageInfo[] = [];
  for (const file of files) {
    const content = readFileSync(file, "utf-8");
    const m = content.match(SLUG_REGEX);
    if (!m) {
      console.warn(`SKIP — no SLUG constant: ${file}`);
      continue;
    }
    const dir = file.replace(/\/page\.tsx$/, "");
    out.push({
      pagePath: file,
      dir,
      slug: m[1],
      ogPath: join(dir, "opengraph-image.tsx"),
    });
  }
  return out;
}

const HELPER_IMPORT = `import { makeTopicMetadata } from "@/lib/seo/topic-metadata";\nimport { TopicPageSeo } from "@/components/seo/topic-page-seo";`;

export function patchPage(content: string, slug: string): string {
  if (content.includes("makeTopicMetadata")) return content; // idempotent

  // Insert imports after the last existing top-level import.
  const importMatches = [...content.matchAll(/^import .+ from .+;$/gm)];
  const lastImport = importMatches[importMatches.length - 1];
  if (!lastImport) throw new Error("no imports found");
  const insertAt = lastImport.index! + lastImport[0].length;
  let next =
    content.slice(0, insertAt) +
    `\n${HELPER_IMPORT}` +
    content.slice(insertAt);

  // Add export const generateMetadata after the SLUG line.
  next = next.replace(
    /(const SLUG\s*=\s*"[^"]+";)/,
    `$1\n\nexport const generateMetadata = makeTopicMetadata("topic", SLUG);`,
  );

  // Insert <TopicPageSeo /> as the first child of TopicPageLayout.
  next = next.replace(
    /<TopicPageLayout([^>]*)>/,
    `<TopicPageLayout$1>\n      <TopicPageSeo kind="topic" slug={SLUG} />`,
  );

  return next;
}

const OG_DELEGATE = (slug: string) => `import { topicOgImage } from "@/lib/seo/og-templates/topic-card";

export const runtime = "edge";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  return topicOgImage({ slug: "${slug}", locale });
}
`;

function main() {
  const pages = discover();
  console.log(`Discovered ${pages.length} topic pages`);

  let modified = 0;
  let ogCreated = 0;

  for (const p of pages) {
    const original = readFileSync(p.pagePath, "utf-8");
    const patched = patchPage(original, p.slug);
    if (patched !== original) {
      writeFileSync(p.pagePath, patched);
      modified++;
    }
    if (!existsSync(p.ogPath)) {
      writeFileSync(p.ogPath, OG_DELEGATE(p.slug));
      ogCreated++;
    }
  }

  console.log(`Modified ${modified} page.tsx files`);
  console.log(`Created ${ogCreated} opengraph-image.tsx delegates`);
}

// Only run main when executed directly, not when imported (e.g. by tests).
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}
