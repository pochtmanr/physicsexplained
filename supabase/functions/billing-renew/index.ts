// Deploy:
//   supabase functions deploy billing-renew --no-verify-jwt
//   supabase secrets set REVOLUT_ENV=sandbox REVOLUT_API_KEY=sk_test_...
//   supabase functions schedule create billing-renew --cron "0 3 * * *"
//
// Env (set via `supabase secrets set`):
//   REVOLUT_ENV, REVOLUT_API_KEY, SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.103.0";

const REVOLUT_API_BASE =
  (Deno.env.get("REVOLUT_ENV") ?? "sandbox") === "production"
    ? "https://merchant.revolut.com/api"
    : "https://sandbox-merchant.revolut.com/api";
const REVOLUT_API_KEY = Deno.env.get("REVOLUT_API_KEY")!;

const PLAN_PRICE: Record<string, number> = { starter: 1200, pro: 3500 };

async function createRenewalOrder(amountCents: number, externalRef: string, token: string) {
  const res = await fetch(`${REVOLUT_API_BASE}/1.0/orders`, {
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
      merchant_order_ext_ref: externalRef,
      payment_method: { type: "token", id: token },
    }),
  });
  if (!res.ok) throw new Error(`Revolut ${res.status}: ${await res.text()}`);
  return (await res.json()) as { id: string; public_id: string; state: string };
}

Deno.serve(async () => {
  const db = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  // A: Sweep canceled subscriptions past their cycle_end → downgrade to free.
  const nowIso = new Date().toISOString();
  await db.from("user_billing").update({
    plan: "free", tokens_allowance: 0, tokens_used: 0, free_questions_used: 0,
    status: "active", revolut_token: null, next_charge_at: null,
  }).eq("status", "canceled").lte("cycle_end", nowIso);

  // B: Renew active paid subs whose next_charge_at has passed.
  const { data: due } = await db
    .from("user_billing")
    .select("user_id,plan,revolut_token")
    .eq("status", "active")
    .neq("plan", "free")
    .lte("next_charge_at", nowIso);

  const results: Array<{ userId: string; ok: boolean; error?: string }> = [];
  for (const row of due ?? []) {
    if (!row.revolut_token) { results.push({ userId: row.user_id, ok: false, error: "missing_token" }); continue; }
    const externalRef = `renew:${row.user_id}:${crypto.randomUUID()}`;
    try {
      const order = await createRenewalOrder(PLAN_PRICE[row.plan]!, externalRef, row.revolut_token);
      await db.from("billing_orders").insert({
        user_id: row.user_id,
        revolut_order_id: order.id,
        plan: row.plan,
        amount_cents: PLAN_PRICE[row.plan]!,
        currency: "USD",
        state: "pending",
      });
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
