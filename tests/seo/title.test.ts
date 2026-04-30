import { describe, it, expect } from "vitest";
import { buildTitle, MAX_TITLE_LENGTH } from "@/lib/seo/title";

describe("buildTitle", () => {
  it("uses meta.seoTitle when set, no transformation", () => {
    const t = buildTitle({
      title: "Whatever",
      meta: { seoTitle: "Hand-tuned title" },
    }, { title: "Branch" });
    expect(t).toBe("Hand-tuned title");
  });

  it("formats title — branch — physics when under 60 chars", () => {
    const t = buildTitle(
      { title: "The Simple Pendulum", meta: {} },
      { title: "Classical Mechanics" },
    );
    expect(t).toBe("The Simple Pendulum — Classical Mechanics — physics");
    expect(t.length).toBeLessThanOrEqual(MAX_TITLE_LENGTH);
  });

  it("drops branch when full pattern exceeds 60 chars", () => {
    const t = buildTitle(
      { title: "Tides and the Three-Body Problem", meta: {} },
      { title: "Classical Mechanics" },
    );
    expect(t).not.toContain("Classical Mechanics");
    expect(t).toContain("Tides and the Three-Body Problem");
    expect(t).toContain("physics");
  });

  it("uses bare title when even title — physics exceeds 60 chars", () => {
    const t = buildTitle(
      { title: "An Extraordinarily Long Topic Title That Exceeds Sixty Chars On Its Own", meta: {} },
      { title: "Branch" },
    );
    expect(t).toBe("An Extraordinarily Long Topic Title That Exceeds Sixty Chars On Its Own");
  });

  it("renders branch as null gracefully (glossary, physicists, etc.)", () => {
    const t = buildTitle({ title: "Angular Momentum", meta: {} }, null);
    expect(t).toBe("Angular Momentum — physics");
  });

  it("normalizes ALL CAPS source titles to title-case-ish", () => {
    const t = buildTitle({ title: "THE SIMPLE PENDULUM", meta: {} }, { title: "CLASSICAL MECHANICS" });
    // Source uses CAPS; output should be human-friendly
    expect(t).toContain("The Simple Pendulum");
  });
});
