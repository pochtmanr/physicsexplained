import { describe, it, expect, vi } from "vitest";

const rows = vi.hoisted(() => ({
  value: [] as {
    kind: string;
    slug: string;
    locale: string;
    updated_at: string | null;
  }[],
}));

vi.mock("server-only", () => ({}));
vi.mock("@/lib/supabase", () => ({
  storageUrl: (path: string) => `https://storage.test/${path}`,
  supabase: {
    from: () => ({
      select: () => ({
        in: async () => ({ data: rows.value, error: null }),
      }),
    }),
  },
}));

import sitemap from "@/app/sitemap";
import { GLOSSARY } from "@/lib/content/glossary";
import { PHYSICISTS } from "@/lib/content/physicists";
import { EQUATIONS } from "@/lib/content/equations";

describe("sitemap", () => {
  it("excludes DB rows whose registry entry is not live, keeps published ones", async () => {
    const realTerm = GLOSSARY[0].slug;
    const realPhysicist = PHYSICISTS[0].slug;
    rows.value = [
      { kind: "topic", slug: "classical-mechanics/kepler", locale: "en", updated_at: null },
      { kind: "topic", slug: "classical-mechanics/not-a-real-topic", locale: "en", updated_at: null },
      // Branch not live → excluded even if a row exists.
      { kind: "topic", slug: "quantum/superposition", locale: "en", updated_at: null },
      { kind: "glossary", slug: realTerm, locale: "en", updated_at: null },
      { kind: "glossary", slug: "not-a-real-term", locale: "en", updated_at: null },
      { kind: "physicist", slug: realPhysicist, locale: "en", updated_at: null },
    ];

    const urls = (await sitemap()).map((e) => e.url);

    expect(urls).toContain("https://physics.it.com/classical-mechanics/kepler");
    expect(urls).toContain(`https://physics.it.com/dictionary/${realTerm}`);
    expect(urls).toContain(`https://physics.it.com/physicists/${realPhysicist}`);
    expect(urls).not.toContain("https://physics.it.com/classical-mechanics/not-a-real-topic");
    expect(urls).not.toContain("https://physics.it.com/quantum/superposition");
    expect(urls).not.toContain("https://physics.it.com/dictionary/not-a-real-term");
  });

  it("includes the equations and play sections", async () => {
    rows.value = [];
    const urls = (await sitemap()).map((e) => e.url);

    expect(urls).toContain("https://physics.it.com/equations");
    expect(urls).toContain(`https://physics.it.com/equations/${EQUATIONS[0].slug}`);
    expect(urls).toContain("https://physics.it.com/play");
  });

  it("lists translated hub pages in every locale with a self-referencing hreflang set", async () => {
    rows.value = [];
    const entries = await sitemap();
    const urls = entries.map((e) => e.url);

    for (const path of ["", "/dictionary", "/physicists", "/play", "/privacy", "/classical-mechanics"]) {
      expect(urls).toContain(`https://physics.it.com/he${path}`);
    }
    const heHome = entries.find((e) => e.url === "https://physics.it.com/he")!;
    expect(heHome.alternates?.languages).toEqual({
      en: "https://physics.it.com/",
      he: "https://physics.it.com/he",
      "x-default": "https://physics.it.com/",
    });
  });

  it("keeps English-only sections out of other locales", async () => {
    rows.value = [];
    const entries = await sitemap();
    const urls = entries.map((e) => e.url);

    expect(urls).not.toContain("https://physics.it.com/he/about");
    expect(urls).not.toContain("https://physics.it.com/he/equations");
    const about = entries.find((e) => e.url === "https://physics.it.com/about")!;
    expect(about.alternates?.languages).toEqual({
      en: "https://physics.it.com/about",
      "x-default": "https://physics.it.com/about",
    });
  });

  it("includes problem pages", async () => {
    rows.value = [];
    const urls = (await sitemap()).map((e) => e.url);
    expect(urls.some((u) => /\/classical-mechanics\/[^/]+\/problems\//.test(u))).toBe(true);
  });

  it("drops rows in locales the site does not route", async () => {
    rows.value = [
      { kind: "topic", slug: "classical-mechanics/kepler", locale: "en", updated_at: null },
      { kind: "topic", slug: "classical-mechanics/kepler", locale: "ru", updated_at: null },
    ];
    const entries = await sitemap();
    expect(entries.some((e) => e.url.includes("/ru/"))).toBe(false);
    const kepler = entries.find((e) => e.url.endsWith("/classical-mechanics/kepler"))!;
    expect(Object.keys(kepler.alternates?.languages ?? {}).sort()).toEqual(["en", "x-default"]);
  });

  it("does not stamp static pages with the build time", async () => {
    rows.value = [];
    const entries = await sitemap();
    const home = entries.find((e) => e.url === "https://physics.it.com/")!;
    expect(home.lastModified).toBe("2026-11-22T00:00:00.000Z");
  });
});
