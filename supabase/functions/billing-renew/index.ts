// Deploy:
//   supabase functions deploy billing-renew --no-verify-jwt
//   supabase secrets set REVOLUT_ENV=production REVOLUT_API_KEY=sk_prod_...
//   supabase functions schedule create billing-renew --cron "0 3 * * *"
//
// Env (set via `supabase secrets set`):
//   REVOLUT_ENV, REVOLUT_API_KEY, SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.103.0";

function mustEnv(name: string): string {
  const v = Deno.env.get(name);
  if (!v) throw new Error(`Missing env var ${name}`);
  return v;
}

const REVOLUT_ENV = mustEnv("REVOLUT_ENV");
if (REVOLUT_ENV !== "sandbox" && REVOLUT_ENV !== "production") {
  throw new Error(`REVOLUT_ENV must be "sandbox" or "production", got "${REVOLUT_ENV}"`);
}
const REVOLUT_API_BASE =
  REVOLUT_ENV === "production"
    ? "https://merchant.revolut.com/api"
    : "https://sandbox-merchant.revolut.com/api";
const REVOLUT_API_KEY = mustEnv("REVOLUT_API_KEY");

async function createRenewalOrder(amountCents: number, externalRef: string, token: string) {
  const res = await fetch(`${REVOLUT_API_BASE}/orders`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${REVOLUT_API_KEY}`,
      "Revolut-Api-Version": "2024-09-01",
    },
    body: JSON.stringify({
      amount: amountCents,
      currency: "USD",
      capture_mode: "automatic",
      merchant_order_data: { reference: externalRef },
      payment_method: { type: "token", id: token },
    }),
  });
  if (!res.ok) throw new Error(`Revolut ${res.status}: ${await res.text()}`);
  return (await res.json()) as { id: string; token: string; state: string };
}

// Returns ISO string for fromIso + 1 month.
function addOneMonthIso(fromIso: string): string {
  const d = new Date(fromIso);
  d.setMonth(d.getMonth() + 1);
  return d.toISOString();
}

Deno.serve(async () => {
  const db = createClient(mustEnv("SUPABASE_URL"), mustEnv("SUPABASE_SERVICE_ROLE_KEY"));

  // A: Sweep canceled subscriptions past their cycle_end → downgrade to free.
  const nowIso = new Date().toISOString();
  await db.from("user_billing").update({
    plan: "free", tokens_allowance: 0, tokens_used: 0, free_questions_used: 0,
    status: "active", revolut_token: null, next_charge_at: null,
  }).eq("status", "canceled").lte("cycle_end", nowIso);

  // H1: Load plan prices from the DB (single source of truth shared with
  // the Next.js app). lib/billing/plans.ts carries a comment that ties
  // priceCents values to this table's seed rows.
  const { data: planRows, error: planErr } = await db
    .from("billing_plans")
    .select("plan,amount_cents");
  if (planErr || !planRows) {
    return new Response(
      JSON.stringify({ error: "plan_price_lookup_failed", message: planErr?.message }),
      { status: 500, headers: { "Content-Type": "application/json" } },
    );
  }
  const priceByPlan: Record<string, number> = {};
  for (const row of planRows) priceByPlan[row.plan as string] = row.amount_cents as number;

  // B: Renew active paid subs whose next_charge_at has passed.
  const { data: due } = await db
    .from("user_billing")
    .select("user_id,plan,revolut_token")
    .eq("status", "active")
    .neq("plan", "free")
    .lte("next_charge_at", nowIso);

  const results: Array<{ userId: string; ok: boolean; error?: string }> = [];
  for (const row of due ?? []) {
    if (!row.revolut_token) {
      results.push({ userId: row.user_id, ok: false, error: "missing_token" });
      continue;
    }
    const amountCents = priceByPlan[row.plan as string];
    if (typeof amountCents !== "number") {
      results.push({ userId: row.user_id, ok: false, error: `unknown_plan:${row.plan}` });
      continue;
    }
    const externalRef = `renew:${row.user_id}:${crypto.randomUUID()}`;
    try {
      const order = await createRenewalOrder(amountCents, externalRef, row.revolut_token);

      const { error: insertErr } = await db.from("billing_orders").insert({
        user_id: row.user_id,
        revolut_order_id: order.id,
        revolut_public_id: order.token,
        plan: row.plan,
        amount_cents: amountCents,
        currency: "USD",
        state: "pending",
      });
      if (insertErr) throw new Error(`order_insert_failed: ${insertErr.message}`);

      // C3: advance next_charge_at atomically so the next cron tick does
      // not re-charge the same user. Tradeoff: if Revolut silently fails
      // to deliver the webhook AND the order genuinely fails, we may miss
      // a renewal — but the markPastDue path + manual retry handle that.
      // We prefer "possible missed renewal" over "double charge".
      const nextAtIso = addOneMonthIso(nowIso);
      const { error: schedErr } = await db.rpc("billing_schedule_next_charge", {
        p_user_id: row.user_id,
        p_next_at: nextAtIso,
      });
      if (schedErr) {
        console.error("[billing-renew] schedule next_charge failed", {
          userId: row.user_id,
          orderId: order.id,
          error: schedErr.message,
        });
      }

      results.push({ userId: row.user_id, ok: true });
    } catch (e) {
      await db.from("user_billing").update({ status: "past_due" }).eq("user_id", row.user_id);
      results.push({ userId: row.user_id, ok: false, error: (e as Error).message });
    }
  }

  return new Response(JSON.stringify({ processed: results.length, results }), {
    headers: { "Content-Type": "application/json" },
  });
});
