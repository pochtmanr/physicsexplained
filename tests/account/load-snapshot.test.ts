import { describe, it, expect } from "vitest";
import { composeSnapshot } from "@/lib/billing/snapshot";

describe("composeSnapshot", () => {
  it("composes a free-plan snapshot", () => {
    const out = composeSnapshot({
      plan: "free", status: "active",
      tokens_allowance: 0, tokens_used: 0,
      free_questions_used: 2,
      cycle_end: "2026-05-23T00:00:00Z",
      next_charge_at: null, canceled_at: null,
    });
    expect(out.plan.id).toBe("free");
    expect(out.tokensRemaining).toBe(0);
    expect(out.questionsRemaining).toBe(1);
    expect(out.percentUsed).toBe(Math.round((2/3) * 100));
  });

  it("composes a starter snapshot with percent used", () => {
    const out = composeSnapshot({
      plan: "starter", status: "active",
      tokens_allowance: 1_500_000, tokens_used: 750_000,
      free_questions_used: 0,
      cycle_end: "2026-05-23T00:00:00Z",
      next_charge_at: "2026-05-23T00:00:00Z", canceled_at: null,
    });
    expect(out.tokensRemaining).toBe(750_000);
    expect(out.percentUsed).toBe(50);
    expect(out.questionsRemaining).toBe(Math.round(750_000 / 2000));
  });
});
