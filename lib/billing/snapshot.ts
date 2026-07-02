import { PLANS, type PlanId, estimateQuestions } from "./plans";

export interface BillingSnapshot {
  plan: typeof PLANS[PlanId];
  status: "active" | "past_due" | "canceled";
  tokensUsed: number;
  tokensAllowance: number;
  tokensRemaining: number;
  freeQuestionsUsed: number;
  questionsRemaining: number;
  percentUsed: number;
  cycleEnd: string;
  nextChargeAt: string | null;
  canceledAt: string | null;
}

export interface RawBilling {
  plan: PlanId;
  status: "active" | "past_due" | "canceled";
  tokens_allowance: number;
  tokens_used: number;
  free_questions_used: number;
  cycle_end: string;
  next_charge_at: string | null;
  canceled_at: string | null;
}

export function composeSnapshot(raw: RawBilling, now: Date = new Date()): BillingSnapshot {
  const plan = PLANS[raw.plan];
  if (raw.plan === "free") {
    // Lapsed cycle → the counter is stale (reset happens lazily / via cron).
    // Show the renewed allowance instead of last month's usage.
    const lapsed = new Date(raw.cycle_end).getTime() <= now.getTime();
    const used = lapsed ? 0 : raw.free_questions_used;
    const total = plan.freeQuestions;
    return {
      plan, status: raw.status,
      tokensUsed: 0, tokensAllowance: 0, tokensRemaining: 0,
      freeQuestionsUsed: used,
      questionsRemaining: Math.max(0, total - used),
      percentUsed: Math.round((used / total) * 100),
      cycleEnd: raw.cycle_end,
      nextChargeAt: raw.next_charge_at,
      canceledAt: raw.canceled_at,
    };
  }
  const remaining = Math.max(0, raw.tokens_allowance - raw.tokens_used);
  return {
    plan, status: raw.status,
    tokensUsed: raw.tokens_used,
    tokensAllowance: raw.tokens_allowance,
    tokensRemaining: remaining,
    freeQuestionsUsed: 0,
    questionsRemaining: estimateQuestions(remaining),
    percentUsed: Math.round((raw.tokens_used / raw.tokens_allowance) * 100),
    cycleEnd: raw.cycle_end,
    nextChargeAt: raw.next_charge_at,
    canceledAt: raw.canceled_at,
  };
}
