import { describe, it, expect } from "vitest";
import { buildLlmsTxt } from "@/lib/seo/llms";
import { BRANCHES } from "@/lib/content/branches";
import { SITE } from "@/lib/seo/config";

describe("llms.txt builder", () => {
  const txt = buildLlmsTxt();

  it("starts with the site name and tagline blockquote", () => {
    const lines = txt.split("\n");
    expect(lines[0]).toBe(`# ${SITE.name}`);
    expect(lines[2]).toBe(`> ${SITE.tagline}`);
  });

  it("lists every live branch and no coming-soon branch", () => {
    for (const b of BRANCHES) {
      const url = `${SITE.baseUrl}/${b.slug})`;
      if (b.status === "live") {
        expect(txt).toContain(url);
      } else {
        expect(txt).not.toContain(url);
      }
    }
  });

  it("includes live topics and excludes non-live ones", () => {
    for (const b of BRANCHES.filter((b) => b.status === "live")) {
      for (const t of b.topics) {
        const url = `${SITE.baseUrl}/${b.slug}/${t.slug})`;
        if (t.status === "live") {
          expect(txt).toContain(url);
        } else {
          expect(txt).not.toContain(url);
        }
      }
    }
  });

  it("only emits absolute URLs on the canonical origin", () => {
    const hrefs = [...txt.matchAll(/\]\(([^)]+)\)/g)].map((m) => m[1]);
    expect(hrefs.length).toBeGreaterThan(50);
    for (const href of hrefs) {
      expect(href.startsWith(SITE.baseUrl)).toBe(true);
    }
  });

  it("points at the full-corpus file and sitemap", () => {
    expect(txt).toContain(`${SITE.baseUrl}/llms-full.txt`);
    expect(txt).toContain(`${SITE.baseUrl}/sitemap.xml`);
  });
});
