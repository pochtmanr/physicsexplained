import { describe, it, expect } from "vitest";
import { extractDescription, MAX_DESCRIPTION_LENGTH } from "@/lib/seo/description";

describe("extractDescription", () => {
  it("returns meta.seoDescription when set", () => {
    expect(
      extractDescription({
        subtitle: "fallback",
        blocks: [],
        meta: { seoDescription: "hand-tuned" },
      }),
    ).toBe("hand-tuned");
  });

  it("returns subtitle when present and no override", () => {
    expect(
      extractDescription({
        subtitle: "Why every clock that ever ticked ticked the same way.",
        blocks: [],
        meta: {},
      }),
    ).toBe("Why every clock that ever ticked ticked the same way.");
  });

  it("falls back to first paragraph from blocks when no subtitle", () => {
    expect(
      extractDescription({
        subtitle: null,
        blocks: [
          { type: "paragraph", inlines: ["First paragraph text here."] } as never,
          { type: "paragraph", inlines: ["Second paragraph."] } as never,
        ],
        meta: {},
      }),
    ).toBe("First paragraph text here.");
  });

  it("truncates first-paragraph fallback to 155 chars at word boundary", () => {
    const long = "x ".repeat(200).trim();
    const out = extractDescription({
      subtitle: null,
      blocks: [{ type: "paragraph", inlines: [long] } as never],
      meta: {},
    });
    expect(out.length).toBeLessThanOrEqual(MAX_DESCRIPTION_LENGTH);
    expect(out.endsWith("…")).toBe(true);
  });

  it("strips inline markdown from extracted paragraph", () => {
    expect(
      extractDescription({
        subtitle: null,
        blocks: [{ type: "paragraph", inlines: ["Here is **bold** and *italic* text."] } as never],
        meta: {},
      }),
    ).toBe("Here is bold and italic text.");
  });

  it("returns empty string when no source available", () => {
    expect(extractDescription({ subtitle: null, blocks: [], meta: {} })).toBe("");
  });
});
