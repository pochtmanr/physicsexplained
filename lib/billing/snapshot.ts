import { PLANS, type PlanId, estimateQuestions } from "./plans";

export type BillingProvider = "revolut" | "apple";

export interface BillingSnapshot {
  plan: typeof PLANS[PlanId];
  status: "active" | "past_due" | "canceled";
  provider: BillingProvider;
  tokensUsed: number;
  tokensAllowance: number;
  tokensRemaining: number;
  freeQuestionsUsed: number;
  questionsRemaining: number;
  percentUsed: number;
  cycleEnd: string;
  nextChargeAt: string | null;
  canceledAt: string | null;
  appleExpiresAt: string | null;
}

export interface RawBilling {
  plan: PlanId;
  status: "active" | "past_due" | "canceled";
  provider?: BillingProvider;
  tokens_allowance: number;
  tokens_used: number;
  free_questions_used: number;
  cycle_end: string;
  next_charge_at: string | null;
  canceled_at: string | null;
  apple_expires_at?: string | null;
}

export function composeSnapshot(raw: RawBilling, now: Date = new Date()): BillingSnapshot {
  const plan = PLANS[raw.plan];
  // Default 'revolut' keeps pre-provider rows (and any caller not selecting the
  // column) backward-compatible.
  const provider: BillingProvider = raw.provider ?? "revolut";
  const appleExpiresAt = raw.apple_expires_at ?? null;
  if (raw.plan === "free") {
    // Lapsed cycle → the counter is stale (reset happens lazily / via cron).
    // Show the renewed allowance instead of last month's usage.
    const lapsed = new Date(raw.cycle_end).getTime() <= now.getTime();
    const used = lapsed ? 0 : raw.free_questions_used;
    const total = plan.freeQuestions;
    return {
      plan, status: raw.status, provider,
      tokensUsed: 0, tokensAllowance: 0, tokensRemaining: 0,
      freeQuestionsUsed: used,
      questionsRemaining: Math.max(0, total - used),
      percentUsed: Math.round((used / total) * 100),
      cycleEnd: raw.cycle_end,
      nextChargeAt: raw.next_charge_at,
      canceledAt: raw.canceled_at,
      appleExpiresAt,
    };
  }
  const remaining = Math.max(0, raw.tokens_allowance - raw.tokens_used);
  return {
    plan, status: raw.status, provider,
    tokensUsed: raw.tokens_used,
    tokensAllowance: raw.tokens_allowance,
    tokensRemaining: remaining,
    freeQuestionsUsed: 0,
    questionsRemaining: estimateQuestions(remaining),
    percentUsed: Math.round((raw.tokens_used / raw.tokens_allowance) * 100),
    cycleEnd: raw.cycle_end,
    nextChargeAt: raw.next_charge_at,
    canceledAt: raw.canceled_at,
    appleExpiresAt,
  };
}
