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
});
