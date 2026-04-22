export type PlanId = "free" | "starter" | "pro";

export interface Plan {
  id: PlanId;
  label: string;
  priceCents: number;
  currency: "USD";
  tokensAllowance: number;
  freeQuestions: number;
  blurb: string;
}

export const PLANS: Record<PlanId, Plan> = {
  free: {
    id: "free",
    label: "Free",
    priceCents: 0,
    currency: "USD",
    tokensAllowance: 0,
    freeQuestions: 3,
    blurb: "3 questions per month · Claude Sonnet",
  },
  starter: {
    id: "starter",
    label: "Starter",
    priceCents: 1200,
    currency: "USD",
    tokensAllowance: 1_500_000,
    freeQuestions: 0,
    blurb: "1.5M tokens / month · ≈ 700 medium questions",
  },
  pro: {
    id: "pro",
    label: "Pro",
    priceCents: 3500,
    currency: "USD",
    tokensAllowance: 4_000_000,
    freeQuestions: 0,
    blurb: "4M tokens / month · ≈ 1,900 medium questions",
  },
};

export function getPlan(id: PlanId): Plan {
  const p = PLANS[id];
  if (!p) throw new Error(`Unknown plan id: ${id}`);
  return p;
}

export function allowanceFor(id: PlanId): number {
  return PLANS[id].tokensAllowance;
}

const AVG_TOKENS_PER_QUESTION = 2_000;
export function estimateQuestions(tokens: number): number {
  return Math.max(0, Math.round(tokens / AVG_TOKENS_PER_QUESTION));
}
