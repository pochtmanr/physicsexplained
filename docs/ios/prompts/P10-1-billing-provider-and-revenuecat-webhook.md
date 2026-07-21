# P10-1 — Dual-provider billing + RevenueCat webhook

Phase P10, prompt 1 of 4. Executor: Opus 4.8. Prerequisites: P8-3 (account
routes exist), existing Revolut billing stack. **This prompt modifies the web
repo** (explicitly allowed here — same exception P8-3 uses — for the named files
only). No iOS changes.

## Read first
- `/Users/roman/Developer/physics/docs/ios/10-revenuecat-setup.md` (the whole runbook; §4 plan mapping, §2.7 webhook auth)
- `/Users/roman/Developer/physics/docs/ios/08-risk-register.md` (R7 — being reframed, not deleted, in P10-4)
- `/Users/roman/Developer/physics/supabase/migrations/0004_billing.sql` (the `user_billing` schema, trigger, RLS) and `0008_billing_plans.sql`, `0009_billing_orders_plan_check.sql`
- `/Users/roman/Developer/physics/lib/billing/plans.ts` (`PlanId`, `PLANS`, `allowanceFor`) and `/Users/roman/Developer/physics/lib/billing/snapshot.ts` (`RawBilling`, `composeSnapshot`)
- `/Users/roman/Developer/physics/lib/billing/webhook-handler.ts` and `/Users/roman/Developer/physics/lib/billing/db-port.ts` (the existing Revolut reconcile pattern to mirror)
- `/Users/roman/Developer/physics/app/api/billing/webhook/route.ts` (the Revolut webhook route — the structural template for the new one)
- `/Users/roman/Developer/physics/lib/supabase-server.ts` (`getServiceClient()`), `/Users/roman/Developer/physics/middleware.ts` (PROTECTED matcher)
- `/Users/roman/Developer/physics/supabase/functions/billing-renew/index.ts` (the cron that must skip Apple rows)
- `/Users/roman/Developer/physics/components/account/billing-tab.tsx` (web billing UI to guard)

## Task
1. **Migration** `supabase/migrations/0015_billing_provider.sql`:
   - `alter table public.user_billing add column if not exists provider text not null default 'revolut' check (provider in ('revolut','apple'));`
   - `alter table public.user_billing add column if not exists apple_expires_at timestamptz;`
   - Backfill is implicit (default `'revolut'`); existing rows are all Revolut.
   - No RLS change: users already SELECT their own row and see the new columns; only service-role writes.
2. **Plan/event mapping** `lib/billing/revenuecat.ts`:
   - Export `entitlementToPlan(entitlementIds: string[]): PlanId` — `pro` wins over `starter` wins over `free` (highest active entitlement).
   - Export a pure reducer `reconcileFromEvent(current: RawBilling & {provider}, event: RCEvent, now: Date): Partial<user_billing columns>` that, given a parsed RevenueCat event, returns the column mutations. Semantics (mirror the Revolut/`webhook-handler.ts` conventions and the web `billing-tab` status pill meanings):
     - `INITIAL_PURCHASE` / `RENEWAL` / `UNCANCELLATION` / `PRODUCT_CHANGE` / `SUBSCRIPTION_EXTENDED` / `TRIAL_STARTED` → `provider='apple'`, `plan=` entitlement→plan, `status='active'`, `tokens_allowance = allowanceFor(plan)`, `tokens_used = 0` (a new period), `cycle_end` + `apple_expires_at` = event `expiration_at_ms`, `canceled_at = null`, `next_charge_at = null` (Apple auto-renews; not our cron).
     - `CANCELLATION` (auto-renew turned off, still entitled until expiry) → keep `plan`, `status='canceled'`, `canceled_at = now`, keep `cycle_end`/`apple_expires_at` (access continues to expiry — matches web "Access until …").
     - `EXPIRATION` / `REFUND` / `BILLING_ISSUE` (after grace) → `plan='free'`, `status='canceled'` (or `'past_due'` for a live billing issue), `tokens_allowance=0`.
   - Keep the file free of I/O — it is unit-tested (task 6). Define a minimal `RCEvent` type from the fields actually used; do not model every event kind.
3. **Webhook route** `app/api/billing/revenuecat/route.ts` (`POST`):
   - Verify `req.headers.get('authorization') === process.env.REVENUECAT_WEBHOOK_AUTH` (constant-time compare); missing/mismatch → `401 {error:'INVALID_SIGNATURE'}`. Missing env var → `500` (fail loud, like the Revolut route).
   - Parse body; ignore (200 `{skipped:true}`) event types not in the reducer's set, and events whose `app.environment` does not match the deployment (guard: a **sandbox** event must not mutate a production row — gate on `process.env.REVENUECAT_ENV ?? 'production'`).
   - `app_user_id` (a.k.a. `subscriber.original_app_user_id`) **is the Supabase user id** (the iOS app calls `Purchases.logIn(uid)` in P10-2). If it is not a uuid / not found in `user_billing`, log without PII and return 200 (do not 500 on unknown subscribers — RevenueCat retries would storm).
   - Idempotency: dedupe on the RevenueCat event `id`. Reuse the existing idempotency approach if `billing_orders`/webhook has one; otherwise a small `insert … on conflict do nothing` guard table or a check that the incoming `expiration`/`event.id` is newer than what's stored. Do **not** double-apply a redelivered event.
   - Load the row with `getServiceClient()`, run `reconcileFromEvent`, write the mutations. Reuse `db-port.ts` helpers where they fit; add a narrow `applyRevenueCatEvent` there rather than duplicating the update SQL.
   - Return `200 {ok:true}` on success.
4. **Cron guard** — `supabase/functions/billing-renew/index.ts`:
   - The downgrade sweep and the renewal-charge sweep must add `provider = 'revolut'` (or `provider <> 'apple'`) to every query that reads candidates to charge or downgrade. An Apple row must never be Revolut-charged or Revolut-downgraded — its lifecycle is owned entirely by the RevenueCat webhook. Mirror the guard into the `billing_schedule_next_charge` RPC call sites.
5. **Web billing UI** — `components/account/billing-tab.tsx` (+ the `orders`/snapshot plumbing in `app/[locale]/ask/layout.tsx` and `lib/billing/snapshot.ts` if `provider` needs surfacing): when the row's `provider === 'apple'`, render the current-plan card read-only — **hide** the `PlanCards` checkout, the "Cancel subscription" link, and the Revolut order history — and show one informational line: **"Managed via Apple — manage this subscription on your iPhone (Settings → your name → Subscriptions)."** No external link, no button. Revolut (`provider==='revolut'`) UI is unchanged.
   - Add `provider` (and `apple_expires_at`) to `RawBilling` + `BillingSnapshot` in `lib/billing/snapshot.ts` so the UI and iOS reads can branch on it. Keep `composeSnapshot` backward-compatible (default `'revolut'`).
6. **Env** — add `REVENUECAT_ENV`, `REVENUECAT_WEBHOOK_AUTH`, and (optional) `REVENUECAT_SECRET_KEY` to `.env.example` with the "no secret values" convention already used for Revolut keys.
7. **Middleware** — confirm `/api/billing/revenuecat` is **not** caught by the PROTECTED bearer/cookie matcher (it authenticates by the RevenueCat header, not a Supabase session). If `config.matcher` or the PROTECTED regex would 401 it, exclude it explicitly, same as the existing Revolut webhook path.
8. **Tests** `tests/billing/revenuecat.test.ts` (vitest, under `tests/**`): the `reconcileFromEvent` reducer for each event class (initial → pro active, renewal resets `tokens_used`, cancellation keeps access + sets `canceled_at`, expiration → free); `entitlementToPlan` precedence; and a route-level test that a bad `Authorization` header 401s and a sandbox event against production env is skipped.

## Do NOT
- Do **not** add columns beyond `provider` + `apple_expires_at`, and do not change the `plan`/`status` CHECK sets (reuse `free|starter|pro`, `active|past_due|canceled`).
- Do **not** touch the Revolut checkout/webhook/cancel routes' behavior for `provider='revolut'` rows — this change is purely additive.
- Do **not** let a sandbox event mutate a production row, and do **not** 500 on unknown subscribers or redelivered events (RevenueCat will hammer a 5xx endpoint).
- Do **not** add a link out to any payment/management page from the web billing UI's Apple branch (informational text only).
- No new npm dependencies; no `.xcodeproj`/iOS changes in this prompt.

## Acceptance criteria
- Migration applies cleanly; `select provider from user_billing limit 1` returns `revolut` for pre-existing rows.
- POST a captured **`initial_purchase`** payload (RevenueCat sample shape, `app_user_id` = a real test uuid) with the correct `Authorization` header → that user's row becomes `plan='pro', provider='apple', status='active', tokens_used=0`, `apple_expires_at` set. Bad header → 401. Sandbox-env payload on a production deployment → 200 skipped, row unchanged.
- An **`expiration`** payload for the same user → `plan='free'`. A **`cancellation`** payload → `status='canceled'`, `canceled_at` set, `plan` unchanged.
- `billing-renew` dry-run selects **zero** `provider='apple'` rows for charge or downgrade.
- Web profile drawer for an Apple-provider user shows the read-only "Managed via Apple" card (no checkout/cancel). A Revolut user's drawer is byte-for-byte unchanged (regression).
- `pnpm tsc --noEmit` and `pnpm test` pass.

## Verify
```bash
cd /Users/roman/Developer/physics
pnpm tsc --noEmit        # repo has no lint config — use tsc
pnpm test tests/billing  # vitest; test files live under tests/**
# Manual reconcile round-trip (service-role SQL) against a throwaway user:
#   before/after `select plan,status,provider,tokens_used,apple_expires_at from user_billing where user_id='…'`
```
Report: migration output, the before/after row for the initial_purchase + expiration round-trip, and the `billing-renew` guard evidence (query text showing the `provider` filter).
