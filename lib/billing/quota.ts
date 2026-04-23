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

export function checkQuota(
  row: BillingRow,
  now: Date = new Date(),
): { ok: true } | { ok: false; reason: QuotaReason } {
  if (row.status === "past_due") return { ok: false, reason: "past_due" };

  if (row.plan === "free") {
    if (row.free_questions_used >= 3) return { ok: false, reason: "free_quota_exhausted" };
    return { ok: true };
  }

  // Paid + active: if cycle_end has passed, the renewal hasn't landed yet
  // (cron at 3am UTC → Revolut → webhook). The user has paid for the next cycle;
  // don't block them on stale tokens_used while the reset is in flight.
  if (row.status === "active" && new Date(row.cycle_end).getTime() <= now.getTime()) {
    return { ok: true };
  }

  if (row.tokens_used >= row.tokens_allowance) return { ok: false, reason: "tokens_exhausted" };
  return { ok: true };
}
