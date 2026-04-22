import { describe, it, expect } from "vitest";
import { MODEL_MULTIPLIERS, weightedTokens } from "@/lib/ask/pricing";

describe("pricing multipliers", () => {
  it("assigns correct multiplier per model", () => {
    expect(MODEL_MULTIPLIERS["claude-sonnet-4-6"]).toBe(1.0);
    expect(MODEL_MULTIPLIERS["claude-haiku-4-5"]).toBe(0.3);
    expect(MODEL_MULTIPLIERS["claude-opus-4-7"]).toBe(5.0);
    expect(MODEL_MULTIPLIERS["gpt-5"]).toBe(1.2);
    expect(MODEL_MULTIPLIERS["gpt-5-mini"]).toBe(0.3);
  });

  it("computes weighted tokens with rounding", () => {
    expect(weightedTokens("claude-sonnet-4-6", 1000, 500)).toBe(1500);
    expect(weightedTokens("claude-opus-4-7", 1000, 500)).toBe(7500);
    expect(weightedTokens("gpt-5", 1000, 500)).toBe(1800);
  });

  it("falls back to 1.0 for unknown model", () => {
    expect(weightedTokens("future-model-9" as never, 1000, 500)).toBe(1500);
  });
});
