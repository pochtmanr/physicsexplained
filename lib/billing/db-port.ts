import type { SupabaseClient } from "@supabase/supabase-js";
import { allowanceFor, type PlanId } from "./plans";
import type { DbPort } from "./webhook-handler";
import { reconcileFromEvent, type RCEvent } from "./revenuecat";
import type { RawBilling } from "./snapshot";

export function makeDbPort(db: SupabaseClient): DbPort {
  return {
    async getOrder(orderId) {
      const { data } = await db.from("billing_orders")
        .select("user_id,plan,state").eq("revolut_order_id", orderId).maybeSingle();
      return (data as { user_id: string; plan: PlanId; state: string } | null) ?? null;
    },
    async updateOrderState(orderId, state) {
      await db.from("billing_orders").update({ state }).eq("revolut_order_id", orderId);
    },
    async activatePlan({ userId, plan, revolutCustomerId, revolutToken }) {
      const now = new Date();
      const cycleEnd = new Date(now);
      cycleEnd.setMonth(cycleEnd.getMonth() + 1);
      await db.from("user_billing").update({
        plan,
        status: "active",
        tokens_allowance: allowanceFor(plan),
        tokens_used: 0,
        free_questions_used: 0,
        cycle_start: now.toISOString(),
        cycle_end: cycleEnd.toISOString(),
        next_charge_at: cycleEnd.toISOString(),
        canceled_at: null,
        ...(revolutCustomerId ? { revolut_customer_id: revolutCustomerId } : {}),
        ...(revolutToken ? { revolut_token: revolutToken } : {}),
      }).eq("user_id", userId);
    },
    async markPastDue(userId) {
      await db.from("user_billing").update({ status: "past_due" }).eq("user_id", userId);
    },
  };
}

/**
 * Apply a parsed RevenueCat (Apple) event to the subscriber's user_billing row.
 * The reconcile logic itself is pure (`reconcileFromEvent`); this wrapper owns
 * the I/O — load, dedupe, write — so the webhook route stays thin and the SQL
 * lives in one place (mirrors makeDbPort's ownership of the Revolut update SQL).
 *
 * Returns:
 *  - "unknown"   — no user_billing row for this app_user_id (route → 200, no-op)
 *  - "duplicate" — a redelivered event we already processed (route → 200, no-op)
 *  - "applied"   — mutations written
 *
 * A genuine DB write failure releases the idempotency claim and throws, so the
 * route surfaces a 5xx and RevenueCat's retry re-processes the event.
 */
export async function applyRevenueCatEvent(
  db: SupabaseClient,
  args: { appUserId: string; event: RCEvent; now: Date },
): Promise<"applied" | "duplicate" | "unknown"> {
  const { appUserId, event, now } = args;

  const { data: row } = await db
    .from("user_billing")
    .select(
      "plan,status,tokens_allowance,tokens_used,free_questions_used,cycle_end,next_charge_at,canceled_at,provider",
    )
    .eq("user_id", appUserId)
    .maybeSingle();
  if (!row) return "unknown";

  // Idempotency: on-conflict-do-nothing on the event id. `ignoreDuplicates`
  // issues ON CONFLICT DO NOTHING; the .select() then returns only rows we
  // actually inserted, so an empty result means this event was already applied.
  const { data: claimed } = await db
    .from("billing_rc_events")
    .upsert(
      { event_id: event.id, app_user_id: appUserId, event_type: event.type },
      { onConflict: "event_id", ignoreDuplicates: true },
    )
    .select("event_id");
  if (!claimed || claimed.length === 0) return "duplicate";

  const mutations = reconcileFromEvent(row as RawBilling & { provider: string }, event, now);
  const { error: updErr } = await db.from("user_billing").update(mutations).eq("user_id", appUserId);
  if (updErr) {
    // Release the idempotency claim so RevenueCat's retry re-processes.
    await db.from("billing_rc_events").delete().eq("event_id", event.id);
    throw new Error(`user_billing update failed: ${updErr.message}`);
  }
  return "applied";
}
