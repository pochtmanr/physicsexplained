import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("server-only", () => ({}));
vi.mock("@/lib/supabase-server", () => ({
  getServiceClient: vi.fn(),
}));

import { diagnoseStep, _resetDiagnoserDeps } from "@/lib/problems/diagnoser";
import type { ProblemStep } from "@/lib/content/types";

const STEP: ProblemStep = {
  id: "vx",
  varName: "v_x",
  canonicalExpr: "v_0 * cos(theta)",
  units: "m/s",
  inputDomain: { v_0: [10, 50], theta: [0.1, 1.4] },
  toleranceRel: 1e-6,
};

const COMMON = {
  problemStatement: "A ball is launched at v_0 = 30 m/s, theta = 45°.",
  step: STEP,
  stepPrompt: "Find the x-component of the initial velocity.",
  commonMistakes: ["Using sin instead of cos.", "Forgetting to convert degrees."],
  studentExpr: "v_0 * sin(theta)",
  canonicalValue: 21.21,
  studentValue: 21.21,
  locale: "en",
};

describe("diagnoseStep — LLM call", () => {
  let mockCreate: ReturnType<typeof vi.fn>;
  let mockCacheGet: ReturnType<typeof vi.fn>;
  let mockCachePut: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    mockCreate = vi.fn(async () => ({
      content: [{ type: "text", text: "You used sine instead of cosine — the x-component projects with cosine." }],
      usage: { input_tokens: 320, output_tokens: 28 },
    }));
    mockCacheGet = vi.fn(async () => null);
    mockCachePut = vi.fn(async () => undefined);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    _resetDiagnoserDeps({ anthropicCreate: mockCreate as any, cacheGet: mockCacheGet as any, cachePut: mockCachePut as any });
  });

  it("calls Anthropic on cache miss", async () => {
    const r = await diagnoseStep(COMMON);
    expect(r.cacheHit).toBe(false);
    expect(mockCreate).toHaveBeenCalledTimes(1);
    expect(r.text).toContain("cosine");
  });

  it("does NOT call Anthropic on cache hit", async () => {
    mockCacheGet.mockResolvedValue({
      diagnosisText: "cached prose",
      promptTokens: 100,
      completionTokens: 30,
    });
    const r = await diagnoseStep(COMMON);
    expect(r.cacheHit).toBe(true);
    expect(mockCreate).not.toHaveBeenCalled();
    expect(r.text).toBe("cached prose");
  });

  it("computes a stable cache key from (stepId, normalized studentExpr)", async () => {
    await diagnoseStep(COMMON);
    expect(mockCacheGet).toHaveBeenCalledTimes(1);
    const key = mockCacheGet.mock.calls[0][0] as string;
    expect(key).toMatch(/^[0-9a-f]{64}$/);
    // Same inputs → same key.
    mockCacheGet.mockClear();
    await diagnoseStep(COMMON);
    expect(mockCacheGet.mock.calls[0][0]).toBe(key);
  });

  it("writes to cache on miss", async () => {
    await diagnoseStep(COMMON);
    expect(mockCachePut).toHaveBeenCalledTimes(1);
    const [, payload] = mockCachePut.mock.calls[0];
    expect(payload.diagnosisText).toContain("cosine");
    expect(payload.promptTokens).toBe(320);
    expect(payload.completionTokens).toBe(28);
  });

  it("includes locale, common mistakes, and numeric values in prompt", async () => {
    await diagnoseStep({ ...COMMON, locale: "he" });
    const args = mockCreate.mock.calls[0][0];
    const userMessage = args.messages.find((m: { role: string }) => m.role === "user").content;
    expect(userMessage).toContain("v_0 * sin(theta)");
    expect(userMessage).toContain("v_0 * cos(theta)");
    expect(userMessage).toContain("Using sin instead of cos.");
    expect(userMessage).toMatch(/locale\s*:?\s*he/i);
  });

  it("uses temperature 0.2", async () => {
    await diagnoseStep(COMMON);
    const args = mockCreate.mock.calls[0][0];
    expect(args.temperature).toBe(0.2);
  });

  it("caps max output tokens at 200", async () => {
    await diagnoseStep(COMMON);
    const args = mockCreate.mock.calls[0][0];
    expect(args.max_tokens).toBeLessThanOrEqual(200);
  });
});
