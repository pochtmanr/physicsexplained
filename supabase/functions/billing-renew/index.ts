// Deploy:
//   supabase functions deploy billing-renew --no-verify-jwt
//   supabase secrets set REVOLUT_ENV=production REVOLUT_API_KEY=sk_prod_... BILLING_RENEW_SECRET=<long random>
//
// Schedule: once a day at 03:00 UTC. The caller MUST send the secret, or the
// function refuses to run:
//   curl -fsS -X POST -H "x-cron-secret: $BILLING_RENEW_SECRET" <functions-url>/billing-renew
//
// The function URL is public and JWT verification is off (the anon key is a
// valid JWT anyway), so the shared secret is the only thing between the
// internet and a run that charges customers' saved cards.
//
// Env (set via `supabase secrets set`):
//   REVOLUT_ENV, REVOLUT_API_KEY, BILLING_RENEW_SECRET, SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY

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
const BILLING_RENEW_SECRET = mustEnv("BILLING_RENEW_SECRET");

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });

/** Compare via digests so the time taken does not depend on where the strings differ. */
async function secretMatches(given: string | null): Promise<boolean> {
  if (!given) return false;
  const enc = new TextEncoder();
  const [a, b] = await Promise.all([
    crypto.subtle.digest("SHA-256", enc.encode(given)),
    crypto.subtle.digest("SHA-256", enc.encode(BILLING_RENEW_SECRET)),
  ]);
  const x = new Uint8Array(a), y = new Uint8Array(b);
  let diff = 0;
  for (let i = 0; i < x.length; i++) diff |= x[i] ^ y[i];
  return diff === 0;
}

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

Deno.serve(async (req) => {
  if (req.method !== "POST") return json({ error: "method_not_allowed" }, 405);
  if (!(await secretMatches(req.headers.get("x-cron-secret")))) return json({ error: "unauthorized" }, 401);

  const db = createClient(mustEnv("SUPABASE_URL"), mustEnv("SUPABASE_SERVICE_ROLE_KEY"));

  // A: Sweep canceled subscriptions past their cycle_end → downgrade to free.
  // provider='revolut' only: Apple rows are owned by the RevenueCat webhook,
  // which downgrades them on EXPIRATION — the Revolut cron must never touch them.
  const nowIso = new Date().toISOString();
  await db.from("user_billing").update({
    plan: "free", tokens_allowance: 0, tokens_used: 0, free_questions_used: 0,
    status: "active", revolut_token: null, next_charge_at: null,
  }).eq("status", "canceled").eq("provider", "revolut").lte("cycle_end", nowIso);

  // A2: Roll lapsed free-plan cycles — the 3-question allowance renews monthly.
  // (The stream route also does this lazily on the next question; the sweep
  // keeps usage meters fresh for users who don't ask.)
  await db.from("user_billing").update({
    free_questions_used: 0, cycle_start: nowIso, cycle_end: addOneMonthIso(nowIso),
  }).eq("plan", "free").lte("cycle_end", nowIso);

  // H1: Load plan prices from the DB (single source of truth shared with
  // the Next.js app). lib/billing/plans.ts carries a comment that ties
  // priceCents values to this table's seed rows.
  const { data: planRows, error: planErr } = await db
    .from("billing_plans")
    .select("plan,amount_cents");
  if (planErr || !planRows) {
    console.error("[billing-renew] plan price lookup failed", planErr?.message);
    return json({ error: "plan_price_lookup_failed" }, 500);
  }
  const priceByPlan: Record<string, number> = {};
  for (const row of planRows) priceByPlan[row.plan as string] = row.amount_cents as number;

  // B: Renew active paid subs whose next_charge_at has passed.
  // provider='revolut' only: an Apple sub must never be sent to Revolut /orders
  // — Apple auto-renews it and RevenueCat reports the outcome via the webhook.
  const { data: due } = await db
    .from("user_billing")
    .select("user_id,plan,revolut_token,next_charge_at")
    .eq("status", "active")
    .neq("plan", "free")
    .eq("provider", "revolut")
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
    // Claim the row BEFORE charging: move next_charge_at forward in a single
    // conditional UPDATE. If two runs overlap, only one of them matches the
    // old due date, so only one goes on to create a Revolut order.
    const dueAt = row.next_charge_at as string;
    const nextAtIso = addOneMonthIso(nowIso);
    const { data: claimed, error: claimErr } = await db
      .from("user_billing")
      .update({ next_charge_at: nextAtIso })
      .eq("user_id", row.user_id)
      .eq("status", "active")
      .eq("provider", "revolut")
      .eq("next_charge_at", dueAt)
      .select("user_id");
    if (claimErr) {
      results.push({ userId: row.user_id, ok: false, error: `claim_failed: ${claimErr.message}` });
      continue;
    }
    if (!claimed || claimed.length === 0) {
      results.push({ userId: row.user_id, ok: true, error: "already_claimed" });
      continue;
    }

    // One reference per billing period, so a duplicate would be visible as
    // such in the Revolut dashboard.
    const externalRef = `renew:${row.user_id}:${dueAt.slice(0, 10)}`;
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

      results.push({ userId: row.user_id, ok: true });
    } catch (e) {
      // Belt-and-suspenders: query B already filtered to provider='revolut', but
      // keep the guard here so an Apple row can never be flipped to past_due by
      // the Revolut cron.
      // Put the due date back along with past_due, as before the claim.
      await db.from("user_billing").update({ status: "past_due", next_charge_at: dueAt })
        .eq("user_id", row.user_id).eq("provider", "revolut");
      results.push({ userId: row.user_id, ok: false, error: (e as Error).message });
    }
  }

  // Details go to the function log; the response carries counts only.
  const failed = results.filter((r) => !r.ok);
  for (const f of failed) console.error("[billing-renew] renewal failed", f);
  return json({
    processed: results.length,
    charged: results.filter((r) => r.ok && !r.error).length,
    skipped: results.filter((r) => r.ok && r.error).length,
    failed: failed.length,
  });
});
