import { describe, it, expect } from "vitest";
import { buildLlmsTxt } from "@/lib/seo/llms";
import { BRANCHES } from "@/lib/content/branches";
import { SITE } from "@/lib/seo/config";
import { SUPPORT_PRODUCTS } from "@/components/support/products";

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

  it("only emits absolute URLs on the canonical origin, plus the company's own properties", () => {
    const hrefs = [...txt.matchAll(/\]\(([^)]+)\)/g)].map((m) => m[1]);
    expect(hrefs.length).toBeGreaterThan(50);
    const external = hrefs.filter((href) => !href.startsWith(SITE.baseUrl));
    expect(external.sort()).toEqual(
      [
        `${SITE.company.url}/`,
        SITE.iosApp.url,
        ...SUPPORT_PRODUCTS.map((p) => p.links.web),
      ].sort(),
    );
  });

  it("names the company and its sibling products", () => {
    expect(txt).toContain("Simnetiq Ltd");
    expect(txt).toContain("https://simnetiq.com/");
    expect(txt).toContain("[Doppler VPN](https://www.dopplervpn.org/en)");
    expect(txt).toContain("[SMS Code](https://simnetiq.xyz/)");
    expect(txt).not.toMatch(/simnetiq\.store|SMS-Activate/i);
  });

  it("points at the full-corpus file and sitemap", () => {
    expect(txt).toContain(`${SITE.baseUrl}/llms-full.txt`);
    expect(txt).toContain(`${SITE.baseUrl}/sitemap.xml`);
  });
});
