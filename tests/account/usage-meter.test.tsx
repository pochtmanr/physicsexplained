import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { UsageMeter } from "@/components/account/usage-meter";

describe("UsageMeter", () => {
  it("renders free plan as questions remaining", () => {
    render(<UsageMeter snapshot={{
      plan: { id: "free", label: "Free", priceCents: 0, currency: "USD", tokensAllowance: 0, freeQuestions: 3, blurb: "" },
      status: "active",
      tokensUsed: 0, tokensAllowance: 0, tokensRemaining: 0,
      freeQuestionsUsed: 2, questionsRemaining: 1,
      percentUsed: 67,
      cycleEnd: "2026-05-23T00:00:00Z", nextChargeAt: null, canceledAt: null,
    } as const} />);
    expect(screen.getByText(/2 \/ 3 questions used/i)).toBeInTheDocument();
  });

  it("renders paid plan with tokens and ≈ questions", () => {
    render(<UsageMeter snapshot={{
      plan: { id: "pro", label: "Pro", priceCents: 3500, currency: "USD", tokensAllowance: 4_000_000, freeQuestions: 0, blurb: "" },
      status: "active",
      tokensUsed: 1_000_000, tokensAllowance: 4_000_000, tokensRemaining: 3_000_000,
      freeQuestionsUsed: 0, questionsRemaining: 1500,
      percentUsed: 25,
      cycleEnd: "2026-05-23T00:00:00Z", nextChargeAt: "2026-05-23T00:00:00Z", canceledAt: null,
    } as const} />);
    expect(screen.getByText(/1.0M \/ 4.0M tokens/i)).toBeInTheDocument();
    expect(screen.getByText(/~ 1,500 questions/i)).toBeInTheDocument();
  });
});
