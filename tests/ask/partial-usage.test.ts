import { describe, it, expect } from "vitest";
import { usageForInterruptedStream } from "@/lib/ask/partial-usage";
import { MODEL_PRICING } from "@/lib/ask/cost";

const MODEL = Object.keys(MODEL_PRICING)[0];

describe("usageForInterruptedStream", () => {
  it("charges nothing when nothing was generated or reported", () => {
    expect(usageForInterruptedStream({ model: MODEL, reported: null, assistantText: "", promptChars: 400 })).toBeNull();
  });

  it("prices streamed text when the provider reported no usage yet", () => {
    const u = usageForInterruptedStream({ model: MODEL, reported: null, assistantText: "x".repeat(400), promptChars: 800 });
    expect(u).toMatchObject({ model: MODEL, inputTokens: 200, outputTokens: 100, cachedTokens: 0 });
    expect(u!.costMicros).toBeGreaterThan(0);
  });

  it("keeps reported input and takes the larger output figure", () => {
    const reported = { model: MODEL, inputTokens: 5000, outputTokens: 3, cachedTokens: 1000, costMicros: 0 };
    const u = usageForInterruptedStream({ model: MODEL, reported, assistantText: "x".repeat(400), promptChars: 10 });
    expect(u).toMatchObject({ inputTokens: 5000, outputTokens: 100, cachedTokens: 1000 });
  });
});
