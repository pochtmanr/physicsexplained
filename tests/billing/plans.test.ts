import { describe, it, expect } from "vitest";
import { PLANS, getPlan, allowanceFor } from "@/lib/billing/plans";

describe("plans", () => {
  it("defines free / starter / pro with correct price and allowance", () => {
    expect(PLANS.free.priceCents).toBe(0);
    expect(PLANS.free.tokensAllowance).toBe(0);
    expect(PLANS.free.freeQuestions).toBe(3);

    expect(PLANS.starter.priceCents).toBe(1200);
    expect(PLANS.starter.tokensAllowance).toBe(1_500_000);

    expect(PLANS.pro.priceCents).toBe(3500);
    expect(PLANS.pro.tokensAllowance).toBe(4_000_000);
  });

  it("getPlan returns canonical plan by id", () => {
    expect(getPlan("pro").id).toBe("pro");
    expect(() => getPlan("enterprise" as never)).toThrow();
  });

  it("allowanceFor returns tokens for paid, 0 for free", () => {
    expect(allowanceFor("free")).toBe(0);
    expect(allowanceFor("starter")).toBe(1_500_000);
    expect(allowanceFor("pro")).toBe(4_000_000);
  });
});
