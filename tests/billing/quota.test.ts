import { describe, it, expect } from "vitest";
import { checkQuota, type BillingRow } from "@/lib/billing/quota";

const base: BillingRow = {
  plan: "free", status: "active",
  tokens_allowance: 0, tokens_used: 0,
  free_questions_used: 0,
  cycle_end: new Date(Date.now() + 86_400_000).toISOString(),
};

describe("checkQuota", () => {
  it("allows free plan when under 3 questions", () => {
    expect(checkQuota({ ...base, free_questions_used: 2 })).toEqual({ ok: true });
  });
  it("blocks free plan at 3rd question", () => {
    expect(checkQuota({ ...base, free_questions_used: 3 })).toEqual({
      ok: false, reason: "free_quota_exhausted",
    });
  });
  it("allows starter plan with tokens remaining", () => {
    expect(checkQuota({ ...base, plan: "starter", tokens_allowance: 1_500_000, tokens_used: 1_000_000 }))
      .toEqual({ ok: true });
  });
  it("blocks starter at exactly allowance", () => {
    expect(checkQuota({ ...base, plan: "starter", tokens_allowance: 1_500_000, tokens_used: 1_500_000 }))
      .toEqual({ ok: false, reason: "tokens_exhausted" });
  });
  it("blocks any paid plan in past_due regardless of balance", () => {
    expect(checkQuota({ ...base, plan: "pro", status: "past_due", tokens_allowance: 4_000_000, tokens_used: 0 }))
      .toEqual({ ok: false, reason: "past_due" });
  });
  it("allows canceled plan until cycle_end", () => {
    expect(checkQuota({ ...base, plan: "pro", status: "canceled",
      tokens_allowance: 4_000_000, tokens_used: 100, cycle_end: new Date(Date.now() + 1000).toISOString() }))
      .toEqual({ ok: true });
  });
});
