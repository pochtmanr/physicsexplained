import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import path from "node:path";
import { PHYSICISTS, getPhysicist } from "@/lib/content/physicists";
import { GLOSSARY, getTerm } from "@/lib/content/glossary";
import { getBranch, getTopic, getAllRoutes } from "@/lib/content/branches";
import { validateContentRefs } from "@/lib/content/refs";
import type { GlossaryCategory } from "@/lib/content/types";

const KEBAB_CASE = /^[a-z][a-z0-9-]*$/;
const ALLOWED_CATEGORIES: readonly GlossaryCategory[] = [
  "instrument",
  "concept",
  "unit",
  "phenomenon",
];

const PROJECT_ROOT = path.resolve(__dirname, "../..");

const PENDULUM_MDX_PATH = path.join(
  PROJECT_ROOT,
  "app",
  "(topics)",
  "classical-mechanics",
  "pendulum",
  "page.mdx",
);
const KEPLER_MDX_PATH = path.join(
  PROJECT_ROOT,
  "app",
  "(topics)",
  "classical-mechanics",
  "kepler",
  "page.mdx",
);

describe("physicists", () => {
  it("every entry has all required non-empty structural fields", () => {
    for (const p of PHYSICISTS) {
      expect(p.slug, `slug for ${p.slug}`).toBeTruthy();
      expect(p.born, `born for ${p.slug}`).toBeTruthy();
      expect(p.died, `died for ${p.slug}`).toBeTruthy();
      expect(p.nationality, `nationality for ${p.slug}`).toBeTruthy();
      expect(p.relatedTopics.length, `relatedTopics for ${p.slug}`).toBeGreaterThan(0);
    }
  });

  it("every slug is unique and kebab-case", () => {
    const seen = new Set<string>();
    for (const p of PHYSICISTS) {
      expect(KEBAB_CASE.test(p.slug), `kebab-case for ${p.slug}`).toBe(true);
      expect(seen.has(p.slug), `duplicate slug ${p.slug}`).toBe(false);
      seen.add(p.slug);
    }
  });

  it("every relatedTopics entry resolves", () => {
    for (const p of PHYSICISTS) {
      for (const ref of p.relatedTopics) {
        const branch = getBranch(ref.branchSlug);
        expect(branch, `branch ${ref.branchSlug} for ${p.slug}`).toBeDefined();
        const topic = getTopic(ref.branchSlug, ref.topicSlug);
        expect(
          topic,
          `topic ${ref.branchSlug}/${ref.topicSlug} for ${p.slug}`,
        ).toBeDefined();
      }
    }
  });
});

describe("glossary", () => {
  it("every entry has all required non-empty structural fields", () => {
    for (const t of GLOSSARY) {
      expect(t.slug, `slug for ${t.slug}`).toBeTruthy();
      expect(t.category, `category for ${t.slug}`).toBeTruthy();
    }
  });

  it("every slug is unique and kebab-case", () => {
    const seen = new Set<string>();
    for (const t of GLOSSARY) {
      expect(KEBAB_CASE.test(t.slug), `kebab-case for ${t.slug}`).toBe(true);
      expect(seen.has(t.slug), `duplicate slug ${t.slug}`).toBe(false);
      seen.add(t.slug);
    }
  });

  it("category is one of the four allowed values", () => {
    for (const t of GLOSSARY) {
      expect(
        ALLOWED_CATEGORIES.includes(t.category),
        `category ${t.category} for ${t.slug}`,
      ).toBe(true);
    }
  });

  it("every relatedPhysicists slug resolves", () => {
    for (const t of GLOSSARY) {
      if (!t.relatedPhysicists) continue;
      for (const slug of t.relatedPhysicists) {
        expect(
          getPhysicist(slug),
          `physicist ${slug} from term ${t.slug}`,
        ).toBeDefined();
      }
    }
  });

  it("every relatedTopics entry resolves", () => {
    for (const t of GLOSSARY) {
      if (!t.relatedTopics) continue;
      for (const ref of t.relatedTopics) {
        const branch = getBranch(ref.branchSlug);
        expect(branch, `branch ${ref.branchSlug} for term ${t.slug}`).toBeDefined();
        const topic = getTopic(ref.branchSlug, ref.topicSlug);
        expect(
          topic,
          `topic ${ref.branchSlug}/${ref.topicSlug} for term ${t.slug}`,
        ).toBeDefined();
      }
    }
  });
});

describe("validateContentRefs", () => {
  it("returns ok", () => {
    const result = validateContentRefs();
    if (!result.ok) {
      throw new Error(
        `validateContentRefs failed:\n${result.errors.join("\n")}`,
      );
    }
    expect(result.ok).toBe(true);
  });
});

describe("mdx cross-refs", () => {
  const PHYSICIST_LINK_RE = /<PhysicistLink\s+slug="([^"]+)"/g;
  const TERM_RE = /<Term\s+slug="([^"]+)"/g;

  function extractSlugs(source: string, re: RegExp): string[] {
    const slugs: string[] = [];
    for (const match of source.matchAll(re)) {
      slugs.push(match[1]);
    }
    return slugs;
  }

  const files: ReadonlyArray<{ name: string; path: string }> = [
    { name: "pendulum.mdx", path: PENDULUM_MDX_PATH },
    { name: "kepler.mdx", path: KEPLER_MDX_PATH },
  ];

  for (const file of files) {
    describe(file.name, () => {
      const source = readFileSync(file.path, "utf-8");
      const physicistSlugs = extractSlugs(source, PHYSICIST_LINK_RE);
      const termSlugs = extractSlugs(source, TERM_RE);

      it("contains at least one PhysicistLink", () => {
        expect(physicistSlugs.length).toBeGreaterThanOrEqual(1);
      });

      it("contains at least one Term tag", () => {
        expect(termSlugs.length).toBeGreaterThanOrEqual(1);
      });

      it("every PhysicistLink slug resolves", () => {
        for (const slug of physicistSlugs) {
          expect(
            getPhysicist(slug),
            `PhysicistLink slug ${slug} in ${file.name}`,
          ).toBeDefined();
        }
      });

      it("every Term slug resolves", () => {
        for (const slug of termSlugs) {
          expect(
            getTerm(slug),
            `Term slug ${slug} in ${file.name}`,
          ).toBeDefined();
        }
      });
    });
  }
});

describe("routing", () => {
  const routes = getAllRoutes();

  it("includes /physicists", () => {
    expect(routes).toContain("/physicists");
  });

  it("includes /dictionary", () => {
    expect(routes).toContain("/dictionary");
  });

  it("includes one route per physicist", () => {
    for (const p of PHYSICISTS) {
      expect(routes).toContain(`/physicists/${p.slug}`);
    }
  });

  it("includes one route per glossary term", () => {
    for (const t of GLOSSARY) {
      expect(routes).toContain(`/dictionary/${t.slug}`);
    }
  });
});
