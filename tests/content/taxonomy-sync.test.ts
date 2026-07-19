// Invariants that scripts/content/publish-taxonomy.ts depends on when it
// projects lib/content/branches.ts into the taxonomy_* tables. These assert the
// REGISTRY only — never the live database — so the suite stays hermetic.
import { describe, it, expect } from "vitest";
import { BRANCHES } from "@/lib/content/branches";
import type { BranchStatus, TopicStatus } from "@/lib/content/types";

const BRANCH_STATUSES: readonly BranchStatus[] = ["live", "coming-soon"];
const TOPIC_STATUSES: readonly TopicStatus[] = ["live", "draft", "coming-soon"];
const KEBAB_CASE = /^[a-z][a-z0-9-]*$/;

describe("taxonomy projection invariants", () => {
  it("branch slugs are unique and kebab-case", () => {
    const slugs = BRANCHES.map((b) => b.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
    for (const slug of slugs) expect(slug).toMatch(KEBAB_CASE);
  });

  it("branch statuses are within the migration's CHECK constraint", () => {
    for (const branch of BRANCHES) {
      expect(BRANCH_STATUSES).toContain(branch.status);
    }
  });

  it("module slugs are unique within their branch", () => {
    for (const branch of BRANCHES) {
      const slugs = branch.modules.map((m) => m.slug);
      expect(new Set(slugs).size, `duplicate module slug in ${branch.slug}`).toBe(slugs.length);
    }
  });

  it("topic slugs are unique within their branch (the composite primary key)", () => {
    for (const branch of BRANCHES) {
      const slugs = branch.topics.map((t) => t.slug);
      expect(new Set(slugs).size, `duplicate topic slug in ${branch.slug}`).toBe(slugs.length);
    }
  });

  it("every topic references a module that exists in the same branch", () => {
    for (const branch of BRANCHES) {
      const moduleSlugs = new Set(branch.modules.map((m) => m.slug));
      for (const topic of branch.topics) {
        expect(
          moduleSlugs.has(topic.module),
          `${branch.slug}/${topic.slug} references unknown module "${topic.module}"`,
        ).toBe(true);
      }
    }
  });

  it("topic statuses are within the migration's CHECK constraint", () => {
    for (const branch of BRANCHES) {
      for (const topic of branch.topics) {
        expect(TOPIC_STATUSES, `${branch.slug}/${topic.slug}`).toContain(topic.status);
      }
    }
  });

  it("every topic carries the non-null columns the projection requires", () => {
    for (const branch of BRANCHES) {
      for (const topic of branch.topics) {
        const where = `${branch.slug}/${topic.slug}`;
        expect(topic.title, where).toBeTruthy();
        expect(topic.eyebrow, where).toBeTruthy();
        expect(topic.subtitle, where).toBeTruthy();
        expect(Number.isInteger(topic.readingMinutes), where).toBe(true);
        expect(topic.readingMinutes, where).toBeGreaterThan(0);
      }
    }
  });

  it("every topic eyebrow yields a FIG index, since ordering is derived from it", () => {
    // publish-taxonomy.ts falls back to array position, but a topic silently
    // taking that path would order unpredictably against its FIG-numbered
    // siblings — so the registry is expected to keep the convention.
    for (const branch of BRANCHES) {
      for (const topic of branch.topics) {
        expect(topic.eyebrow, `${branch.slug}/${topic.slug} eyebrow`).toMatch(/^FIG\.\d+/);
      }
    }
  });

  it("live branches expose only live topics to clients without hiding content", () => {
    // Guards Risk R2: the iOS client lists only what RLS returns, so a topic
    // that is live under a coming-soon branch would be unreachable by design.
    const liveBranches = BRANCHES.filter((b) => b.status === "live");
    for (const branch of BRANCHES) {
      if (branch.status === "live") continue;
      expect(branch.topics.filter((t) => t.status === "live"), branch.slug).toHaveLength(0);
    }
    expect(liveBranches.length).toBeGreaterThan(0);
  });
});
