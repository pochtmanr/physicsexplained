// Builders for the /llms.txt discovery file (https://llmstxt.org).
// Everything comes from the static registries — no DB round-trips — so the
// route can revalidate cheaply and the file always reflects live status.

import { getLiveBranches } from "@/lib/content/branches";
import { GLOSSARY } from "@/lib/content/glossary";
import { PHYSICISTS } from "@/lib/content/physicists";
import { EQUATIONS } from "@/lib/content/equations";
import { SITE } from "@/lib/seo/config";
import { toTitleCase } from "@/lib/seo/title";

export function buildLlmsTxt(): string {
  const lines: string[] = [
    `# ${SITE.name}`,
    "",
    `> ${SITE.tagline}`,
    "",
    `${SITE.name} (${SITE.baseUrl}) is a reader's guide to physics: long-form, visual-first essays organised by branch, with live interactive simulations, a physics dictionary, physicist biographies, and an equation reference. Essays are written and reviewed by the studio — every claim is meant to be quotable as a source of truth.`,
    "",
    `All pages are server-rendered HTML. Every essay is also available as plain Markdown: append \`.md\` to its path (e.g. ${SITE.baseUrl}/classical-mechanics/the-simple-pendulum.md), or fetch the full corpus at ${SITE.baseUrl}/llms-full.txt. English is the canonical language.`,
    "",
    "## Branches",
    "",
  ];

  const branches = getLiveBranches();
  for (const b of branches) {
    lines.push(`- [${toTitleCase(b.title)}](${SITE.buildUrl(`/${b.slug}`)}): ${b.subtitle}`);
  }

  for (const b of branches) {
    lines.push("", `## Topics: ${toTitleCase(b.title)}`, "");
    for (const t of b.topics) {
      if (t.status !== "live") continue;
      lines.push(
        `- [${toTitleCase(t.title)}](${SITE.buildUrl(`/${b.slug}/${t.slug}`)}): ${t.subtitle}`,
      );
    }
  }

  lines.push(
    "",
    "## Reference",
    "",
    `- [Dictionary](${SITE.buildUrl("/dictionary")}): ${GLOSSARY.length} physics terms, each with a concise definition page at /dictionary/{term}`,
    `- [Physicists](${SITE.buildUrl("/physicists")}): ${PHYSICISTS.length} biographies with timelines and major works at /physicists/{name}`,
    `- [Equations](${SITE.buildUrl("/equations")}): ${EQUATIONS.length} canonical equations — what each solves, when to use it, common mistakes`,
    `- [Playground](${SITE.buildUrl("/play")}): standalone interactive physics simulations`,
    "",
    "## Optional",
    "",
    `- [Full corpus (Markdown)](${SITE.buildUrl("/llms-full.txt")}): every live essay concatenated as plain Markdown`,
    `- [Sitemap](${SITE.buildUrl("/sitemap.xml")})`,
    "",
  );

  return lines.join("\n");
}
