import { describe, it, expect } from "vitest";
import { selectInitialTools } from "@/lib/ask/router";

describe("selectInitialTools", () => {
  it("routes plot/graph phrasing to viz-request", () => {
    expect(selectInitialTools("Plot sin(x) from 0 to 2π")).toBe("viz-request");
    expect(selectInitialTools("Can you graph a decaying exponential?")).toBe("viz-request");
    expect(selectInitialTools("visualize the magnetic field")).toBe("viz-request");
    expect(selectInitialTools("Draw a free body diagram")).toBe("viz-request");
  });

  it("routes simple definition queries to glossary-lookup", () => {
    expect(selectInitialTools("what is entropy?")).toBe("glossary-lookup");
    expect(selectInitialTools("Define angular momentum")).toBe("glossary-lookup");
    expect(selectInitialTools("Meaning of dark matter")).toBe("glossary-lookup");
    expect(selectInitialTools("Who was Feynman?")).toBe("glossary-lookup");
  });

  it("routes article pointers", () => {
    expect(selectInitialTools("Where can I read about general relativity?")).toBe("article-pointer");
    expect(selectInitialTools("Point me to the article on pendulums")).toBe("article-pointer");
  });

  it("routes calculation requests", () => {
    expect(selectInitialTools("Compute the orbital period")).toBe("calculation");
    expect(selectInitialTools("calculate the energy released")).toBe("calculation");
    expect(selectInitialTools("What is the value of c?")).toBe("calculation");
  });

  it("routes web/latest queries to conceptual-explain (broad toolset)", () => {
    expect(selectInitialTools("What is the latest value of the fine-structure constant?")).toBe("conceptual-explain");
    expect(selectInitialTools("Any recent arxiv on string theory?")).toBe("conceptual-explain");
  });

  it("returns null for ambiguous text so classifier decides", () => {
    expect(selectInitialTools("Is the universe deterministic?")).toBeNull();
    expect(selectInitialTools("I don't understand why this works")).toBeNull();
    expect(selectInitialTools("")).toBeNull();
  });

  it("returns null for definition queries that are actually long follow-ups", () => {
    // Long questions that happen to start with "what is" aren't definitions;
    // they belong in conceptual-explain and should fall through to classifier.
    const long = "what is the physical intuition behind Noether's theorem when applied to time-translation symmetry, and why does it imply energy conservation specifically rather than some other conserved quantity";
    expect(selectInitialTools(long)).toBeNull();
  });

  it("prioritizes viz-request over define when both match", () => {
    // "plot" signal wins — user clearly wants a visualization.
    expect(selectInitialTools("What is a plot of sin(x)?")).toBe("viz-request");
  });

  it("routes compare/difference questions to conceptual-explain, not glossary", () => {
    // These start with "what's" but aren't single-term definitions. Sending
    // them to glossary-lookup narrows tools too aggressively and the model
    // can't actually compare two concepts side-by-side.
    expect(selectInitialTools("What's the difference between a capacitor and a conductor?")).toBe("conceptual-explain");
    expect(selectInitialTools("Compare fermions and bosons")).toBe("conceptual-explain");
    expect(selectInitialTools("Momentum vs. kinetic energy?")).toBe("conceptual-explain");
  });
});
