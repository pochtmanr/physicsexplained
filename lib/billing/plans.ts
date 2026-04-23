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

// =============================================================================
// IMPORTANT — MIRROR THE PRICE FIELDS IN THE DATABASE.
//
// The authoritative price source is the `public.billing_plans` table
// (seeded in supabase/migrations/0008_billing_plans.sql). The Deno edge
// function supabase/functions/billing-renew/index.ts reads the price from
// that table at runtime (it can't import this file). If you change a
// priceCents value here, you MUST also update the billing_plans row,
// preferably by editing migration 0008 and re-applying it in dev, and
// adding a new follow-up migration for prod.
//
// The test in tests/billing/plans.test.ts guards against drift between
// priceCents below and the seed rows in migration 0008.
// =============================================================================
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
    priceCents: 600,
    currency: "USD",
    tokensAllowance: 750_000,
    freeQuestions: 0,
    blurb: "750k tokens / month · ≈ 375 medium questions",
  },
  pro: {
    id: "pro",
    label: "Pro",
    priceCents: 2000,
    currency: "USD",
    tokensAllowance: 2_300_000,
    freeQuestions: 0,
    blurb: "2.3M tokens / month · ≈ 1,150 medium questions",
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
