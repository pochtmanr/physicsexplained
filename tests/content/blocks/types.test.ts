import { describe, it, expect } from "vitest";
import { isBlock, isInline, type Block } from "@/lib/content/blocks";

describe("block type guards", () => {
  it("isBlock accepts a valid paragraph", () => {
    const b: Block = { type: "paragraph", inlines: ["hello"] };
    expect(isBlock(b)).toBe(true);
  });

  it("isBlock rejects an object with unknown type", () => {
    expect(isBlock({ type: "nope" })).toBe(false);
  });

  it("isInline accepts a string", () => {
    expect(isInline("hello")).toBe(true);
  });

  it("isInline accepts a physicist inline", () => {
    expect(isInline({ kind: "physicist", slug: "galileo-galilei" })).toBe(true);
  });

  it("isInline rejects objects with unknown kind", () => {
    expect(isInline({ kind: "nope" })).toBe(false);
  });
});
