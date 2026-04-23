import type { PlanId } from "./plans";

export interface BillingRow {
  plan: PlanId;
  status: "active" | "past_due" | "canceled";
  tokens_allowance: number;
  tokens_used: number;
  free_questions_used: number;
  cycle_end: string;
}

export type QuotaReason = "free_quota_exhausted" | "tokens_exhausted" | "past_due";

export function checkQuota(row: BillingRow): { ok: true } | { ok: false; reason: QuotaReason } {
  if (row.status === "past_due") return { ok: false, reason: "past_due" };

  if (row.plan === "free") {
    if (row.free_questions_used >= 3) return { ok: false, reason: "free_quota_exhausted" };
    return { ok: true };
  }

  if (row.tokens_used >= row.tokens_allowance) return { ok: false, reason: "tokens_exhausted" };
  return { ok: true };
}
