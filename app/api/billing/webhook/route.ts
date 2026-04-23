import { NextResponse } from "next/server";
import { getServiceClient } from "@/lib/supabase-server";
import { verifyWebhook } from "@/lib/billing/revolut";
import { applyWebhookEvent, parseRevolutEvent, type DbPort } from "@/lib/billing/webhook-handler";
import { allowanceFor, type PlanId } from "@/lib/billing/plans";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const raw = await req.text();
  const sig = req.headers.get("revolut-signature") ?? "";
  if (!verifyWebhook(raw, sig)) {
    return NextResponse.json({ error: "INVALID_SIGNATURE" }, { status: 401 });
  }

  let parsed: unknown;
  try { parsed = JSON.parse(raw); } catch { return NextResponse.json({ error: "BAD_JSON" }, { status: 400 }); }
  const event = parseRevolutEvent(parsed);
  if (!event || event.type === "UNKNOWN") return NextResponse.json({ ok: true, skipped: true });

  const db = getServiceClient();
  const port: DbPort = {
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

  await applyWebhookEvent(event, port);
  return NextResponse.json({ ok: true });
}
