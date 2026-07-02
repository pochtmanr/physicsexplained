import { describe, expect, it } from "vitest";
import { cleanFtsQuery, formatBlock, orFallbackQuery, type CandidateRefs } from "@/lib/ask/candidate-refs";

const empty: CandidateRefs = { topics: [], physicists: [], glossary: [], scenes: [] };

describe("candidate-refs scene block", () => {
  it("renders a scene section with fig label and id", () => {
    const block = formatBlock({
      ...empty,
      scenes: [
        {
          id: "StraightWireFieldScene",
          figLabel: "FIG.13b",
          label: "concentric B-field rings around a vertical current",
          description: "concentric B-field rings around a vertical current",
        },
      ],
    });
    expect(block).toContain("## Scenes you may embed");
    expect(block).toContain(':::scene{id="..."}');
    expect(block).toContain("- StraightWireFieldScene — FIG.13b — concentric B-field rings around a vertical current");
  });

  it("omits the fig label separator when a scene has none", () => {
    const block = formatBlock({
      ...empty,
      scenes: [{ id: "PhasePortrait", figLabel: null, label: "Phase portrait", description: "Phase portrait" }],
    });
    expect(block).toContain("- PhasePortrait — Phase portrait");
    expect(block).not.toContain("null");
  });

  it("truncates long scene descriptions to keep the prompt block small", () => {
    const block = formatBlock({
      ...empty,
      scenes: [{ id: "X", figLabel: null, label: "x", description: "a".repeat(300) }],
    });
    const line = block.split("\n").find((l) => l.startsWith("- X"));
    expect(line).toBeDefined();
    expect(line!.length).toBeLessThan(120);
    expect(line).toContain("…");
  });

  it("renders scenes even when no topic/physicist/glossary refs matched", () => {
    const block = formatBlock({
      ...empty,
      scenes: [{ id: "X", figLabel: null, label: "x", description: "x" }],
    });
    expect(block).toContain("# Available site references");
    expect(block).toContain("## Scenes you may embed");
  });

  it("omits the scene section when there are no scenes", () => {
    const block = formatBlock({
      ...empty,
      topics: [{ slug: "a/b", title: "B", subtitle: null }],
    });
    expect(block).not.toContain("Scenes you may embed");
  });

  it("returns an empty block when nothing matched", () => {
    expect(formatBlock(empty)).toBe("");
  });
});

describe("cleanFtsQuery", () => {
  it("strips conversational filler and normalizes dashes", () => {
    expect(cleanFtsQuery("Explain the Biot-Savart law for a long straight wire")).toBe(
      "biot savart law long straight wire",
    );
  });

  it("handles en dashes the way essays write them", () => {
    expect(cleanFtsQuery("what is the Biot–Savart law?")).toBe("biot savart law");
  });

  it("keeps physics-meaningful words that look like filler", () => {
    expect(cleanFtsQuery("how does work relate to force?")).toBe("work relate force");
  });

  it("returns empty for pure-filler input", () => {
    expect(cleanFtsQuery("can you tell me about it?")).toBe("");
  });
});

describe("orFallbackQuery", () => {
  it("ORs the longest informative terms", () => {
    expect(orFallbackQuery("biot savart law long straight wire")).toBe(
      "straight or savart or biot or long",
    );
  });

  it("dedupes terms", () => {
    expect(orFallbackQuery("wire wire field")).toBe("field or wire");
  });
});
