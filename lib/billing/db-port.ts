import type { SupabaseClient } from "@supabase/supabase-js";
import { allowanceFor, type PlanId } from "./plans";
import type { DbPort } from "./webhook-handler";

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
