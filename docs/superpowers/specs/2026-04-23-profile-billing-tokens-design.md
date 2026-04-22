# Profile, Token System & Revolut Billing — Design

**Status:** design approved, ready for implementation planning
**Author:** Roman Pochtman
**Date:** 2026-04-23

---

## 1. Goal

Give signed-in users on `/ask`:

1. A profile chip at the bottom of the conversation sidebar (avatar + name + plan badge) that opens a right-side drawer with **Profile** and **Billing** tabs and a pinned **Sign out** footer.
2. A token-metered quota system with a free tier (3 questions/month) and two paid tiers (Starter $12/mo = 1.5M tokens, Pro $35/mo = 4M tokens).
3. Recurring subscription billing via Revolut Merchant (USD, saved-card renewal driven by a daily cron).
4. Destructive actions (Delete all chats, Delete account) with typed confirmation.

Target margin: 30% floor even when a paid user saturates their monthly allowance.

## 2. Non-Goals

- Annual plans, team/workspace billing, refunds, invoicing, proration, promo codes — all out of scope for v1.
- Usage analytics beyond the existing `ask_usage_daily` table.
- Alternate payment processors. Stripe was considered and explicitly rejected in favour of Revolut Merchant.
- Migrating existing `/account` page styling — v1 keeps the route as a server-rendered fallback that links to the drawer experience.

## 3. Pricing Model (locked)

| Plan    | Price       | Monthly allowance   | UI display          |
| ------- | ----------- | ------------------- | ------------------- |
| Free    | $0          | 3 questions (hard cap) | "3 / 3 questions used" |
| Starter | $12 / month | 1,500,000 tokens    | "X / 1.5M tokens · ≈ N questions · resets in Zd" |
| Pro     | $35 / month | 4,000,000 tokens    | "X / 4M tokens · ≈ N questions · resets in Zd"   |

**Model multipliers** applied to billed tokens (`(input + output) × multiplier`):

| Model            | Multiplier | Reasoning                      |
| ---------------- | ---------- | ------------------------------ |
| Claude Sonnet 4.6 | ×1.0       | Base meter unit                |
| Claude Opus 4.7   | ×5.0       | ≈5× blended API cost           |
| GPT-5             | ×1.2       | ≈20% more expensive than Sonnet |

Multipliers live in `lib/ask/pricing.ts` alongside the model registry so pricing and the model picker never drift.

Margin floor (COGS at API list prices, blended 80/20 input/output ratio assumed):

- Starter $12 → COGS ≈ $8.40 at full use → 30% margin
- Pro $35 → COGS ≈ $24 at full use → 31% margin

## 4. Data Model

New migration: `supabase/migrations/0004_billing.sql`.

### 4.1 `user_billing`

```sql
create table public.user_billing (
  user_id              uuid primary key references auth.users(id) on delete cascade,
  plan                 text not null default 'free'
                         check (plan in ('free','starter','pro')),
  status               text not null default 'active'
                         check (status in ('active','past_due','canceled')),
  tokens_allowance     bigint not null default 0,
  tokens_used          bigint not null default 0,
  free_questions_used  int    not null default 0,
  cycle_start          timestamptz not null default now(),
  cycle_end            timestamptz not null default (now() + interval '1 month'),
  revolut_customer_id  text,
  revolut_token        text,
  next_charge_at       timestamptz,
  canceled_at          timestamptz,
  updated_at           timestamptz not null default now()
);
```

- **RLS:** user reads own row only. No direct writes from client — all mutations go through server routes using the service-role client.
- **Trigger:** on `auth.users` insert, create a `user_billing` row with defaults (`plan='free'`, `tokens_allowance=0`, `free_questions_used=0`). The 3-question free cap uses `free_questions_used`; tokens_allowance stays 0 for free users.
- **Updated_at trigger:** standard `moddatetime` pattern already used elsewhere in the schema.

### 4.2 `billing_orders`

```sql
create table public.billing_orders (
  id                uuid primary key default gen_random_uuid(),
  user_id           uuid not null references auth.users(id) on delete cascade,
  revolut_order_id  text not null unique,
  plan              text not null,
  amount_cents      int  not null,
  currency          text not null default 'USD',
  state             text not null,
  created_at        timestamptz not null default now()
);
create index billing_orders_user_idx
  on public.billing_orders (user_id, created_at desc);
```

- **State values:** `pending`, `completed`, `failed`, `refunded`.
- **RLS:** user reads own rows only.
- Populated by the webhook handler on every order state change.

### 4.3 Existing tables left untouched

- `ask_usage_daily` remains as the analytics log (cost, cache, web search counts). The billing cycle counters live in `user_billing` and are the source of truth for quota enforcement.
- `ask_messages.input_tokens / output_tokens` stay as the audit trail per message.

## 5. Token Metering Flow (`/api/ask`)

Augment the existing route handler (`app/api/ask/route.ts`):

1. **Pre-stream gate.** Load `user_billing` for `auth.uid()`. Using a single SQL read.
   - If `plan = 'free'`: return `402 { reason: 'free_quota_exhausted' }` when `free_questions_used >= 3`.
   - Else: return `402 { reason: 'tokens_exhausted' }` when `tokens_used >= tokens_allowance`.
   - If `status = 'past_due'`: return `402 { reason: 'past_due' }` regardless of balance.
2. **Stream as normal.**
3. **Post-stream accounting.** In the existing `finalize` step where `ask_messages` and `ask_usage_daily` are updated, additionally:
   - Compute `weighted = (input + output) * multiplier(model_id)`.
   - Call new RPC `billing_increment(p_user_id, p_weighted, p_is_free)`:
     - If free plan → `free_questions_used = free_questions_used + 1`, ignore weighted.
     - Else → `tokens_used = tokens_used + p_weighted`.
   - Done in the same transaction as `ask_usage_daily` to keep the numbers consistent.

The client (`StreamingMessage` / `Composer`) intercepts `402` and triggers the Upgrade Modal with the right copy per `reason`.

## 6. UI

### 6.1 Profile chip — `components/auth/profile-chip.tsx`

Pinned at the bottom of `ConversationRail` (desktop) and above the Composer (mobile, since the rail is `hidden md:flex`).

```
╭─ Roman Pochtman ─────────╮
│ [avatar]  Pro · 42% used │
╰──────────────────────────╯
```

- Reads `user.user_metadata.avatar_url` / `full_name` / `email` from the server (passed as props from `ask/layout.tsx`).
- Plan badge color: `var(--color-fg-3)` for Free, `var(--color-cyan-dim)` for Starter, `var(--color-cyan)` for Pro.
- Click → dispatches `open-account-drawer` event (or sets state through a small zustand-free `useAccountDrawer` context); no router navigation.

### 6.2 Account drawer — `components/account/account-drawer.tsx`

- Slides from right, 420px wide on desktop, full-screen on mobile (`md:w-[420px]`).
- Backdrop: `backdrop-blur-sm bg-[var(--color-bg-0)]/60`.
- Close: ✕ button, Esc, or backdrop click.
- Tabs at the top: `Profile` / `Billing` (segmented control styled to match existing `font-mono uppercase tracking-wider` aesthetic).
- Footer: `[Sign out]` pinned, reuses `SignOutButton`.

#### Profile tab

- Avatar (Google picture or generated initials fallback).
- Name / email.
- User ID (mono, truncated, copy-on-click).
- Provider (`google` / `email`).
- Joined date.
- **Usage meter** component (`components/account/usage-meter.tsx`):
  - Segmented bar, cyan fill, magenta fill over 90%.
  - Label: `"{used} / {allowance} tokens · ≈ {estQuestions} questions · resets in {Xd}"` for paid; `"{n} / 3 questions · resets in {Xd}"` for free.
- Buttons: `[Delete all chats]` (magenta outline), `[Delete account]` (filled magenta). Each opens a confirm modal.

#### Billing tab

- Current plan card: plan name, price, status pill (`Active` / `Past due` / `Canceled`), next-charge date (or "Access ends {cycle_end}" if canceled).
- Usage meter (same component).
- **Plan cards** — `components/account/plan-cards.tsx`:
  - Three cards side-by-side on desktop, stacked on mobile.
  - Current plan marked "Current" (disabled CTA).
  - Other plans: `[Upgrade]` / `[Downgrade]` CTAs. Downgrade requests just call cancel + keep-until-cycle-end; re-upgrade goes through checkout.
- Payment method row (if paid): `•••• 4242 · Mastercard · [Update]` (update re-runs checkout flow to tokenize a new card).
- `[Cancel subscription]` link (text button, `text-[var(--color-fg-3)]`).
- Order history: list of `billing_orders` most-recent-first (date · plan · amount · state pill).

### 6.3 Upgrade modal — `components/account/upgrade-modal.tsx`

- Triggered when `/api/ask` returns `402`.
- Headline adjusts to `reason`:
  - `free_quota_exhausted` → "You've used your 3 free questions this month"
  - `tokens_exhausted` → "You've used your monthly allowance"
  - `past_due` → "Your last payment didn't go through — update payment to continue"
- Same `PlanCards` component, skipping the free option for `tokens_exhausted`.
- Checkout CTA inline.

## 7. Revolut Merchant Integration

Revolut Merchant has no native subscriptions product. Recurring billing is implemented on top of the Orders API + saved payment methods, with a daily renewal cron.

### 7.1 Environment variables

Added to `.env.example` and required for the server to boot billing routes:

```bash
# Revolut Merchant (Revolut Business → Merchant → APIs)
REVOLUT_ENV=sandbox                                         # sandbox | production
REVOLUT_API_KEY=sk_...                                      # Server secret
REVOLUT_API_BASE=https://sandbox-merchant.revolut.com/api   # prod: https://merchant.revolut.com/api
REVOLUT_WEBHOOK_SECRET=whsec_...                            # Set when registering the webhook
NEXT_PUBLIC_REVOLUT_PUBLIC_KEY=pk_...                       # Public, used by RevolutCheckout.js
```

`REVOLUT_ENV` is the single switch the config layer reads to pick base URL + public key at boot. No hardcoding.

### 7.2 Checkout flow (first payment)

1. Client clicks `[Upgrade to Starter]` → `POST /api/billing/checkout { plan: 'starter' }`.
2. Server action:
   - Verifies `auth.uid()`.
   - Creates Revolut Order: `POST {REVOLUT_API_BASE}/1.0/orders` with body:
     ```json
     {
       "amount": 1200,
       "currency": "USD",
       "capture_mode": "automatic",
       "merchant_order_ext_ref": "<uuid>",
       "save_payment_method_for": "customer",
       "customer": { "email": "<user.email>", "full_name": "<user.full_name>" }
     }
     ```
   - Inserts a `billing_orders` row (`state='pending'`).
   - Returns `{ public_id, order_id }`.
3. Client loads `RevolutCheckout.js` with `NEXT_PUBLIC_REVOLUT_PUBLIC_KEY`, calls `RevolutCheckout(public_id).payWithPopup({ savePaymentMethodFor: 'customer', ... })`.
4. On successful tokenization + capture, Revolut fires `ORDER_COMPLETED` webhook → handler upgrades plan (see §7.4).

### 7.3 Renewal cron

- Supabase scheduled edge function `supabase/functions/billing-renew/index.ts`, runs daily at 03:00 UTC.
- Selects rows where `status = 'active' and plan != 'free' and next_charge_at <= now()`.
- For each row: creates a new Order identical to the first, but adds `"payment_method": { "type": "token", "id": revolut_token }` so Revolut charges the saved card off-session.
- Logs every attempt to `billing_orders` with `state='pending'` — webhook updates state on completion/failure.
- Runs with service-role access to Supabase and `REVOLUT_API_KEY` from Supabase Edge secrets (not from `.env.local`).

### 7.4 Webhook handler — `app/api/billing/webhook/route.ts`

- Verifies `Revolut-Signature` header: HMAC-SHA256(body, `REVOLUT_WEBHOOK_SECRET`), compared constant-time against the `v1=` portion of the header.
- Looks up the order by `merchant_order_ext_ref` → matches `billing_orders.revolut_order_id`.
- On `ORDER_COMPLETED`:
  - `billing_orders.state = 'completed'`.
  - Update `user_billing`:
    - `plan = <plan_from_order>`
    - `status = 'active'`
    - `tokens_allowance = <allowance_for_plan>`
    - `tokens_used = 0`
    - `cycle_start = now()`, `cycle_end = now() + interval '1 month'`
    - `next_charge_at = cycle_end`
    - First payment only: persist `revolut_customer_id`, `revolut_token` from the webhook payload.
- On `ORDER_FAILED` / `ORDER_CANCELLED`:
  - `billing_orders.state = 'failed'`.
  - If this was a renewal (i.e. user already had `plan != 'free'`): `status = 'past_due'`, keep tokens from burning (they can still read, but new sends are blocked with the `past_due` upgrade modal pointing to Update Payment). After 3 days in `past_due`, the next renewal attempt or manual update brings them back.
- Idempotent: webhook re-delivery against an already-`completed` order is a no-op.

### 7.5 Cancel flow

- `POST /api/billing/cancel`:
  - Server-action only, no Revolut call (saved token just stops being used).
  - `user_billing.status = 'canceled'`, `canceled_at = now()`, `next_charge_at = null`.
  - UI shows "Access until {cycle_end}" — quota continues to work until `cycle_end`, at which point a nightly sweep job downgrades to `free` (piggy-backs on the renewal cron: same query but for canceled rows).

### 7.6 Failure handling

- Any Revolut API call that returns non-2xx: log + 500 to client, no partial state update.
- Webhook verification failure: 401, no DB write.
- `past_due` users see the upgrade modal's Update Payment variant on their next send; this just re-runs the checkout flow and the webhook takes over.

## 8. Deletion Flows

Server actions in `app/actions/account.ts`:

### 8.1 `deleteAllChats()`

- Typed confirmation: user must type `delete chats` exactly.
- Action: `delete from ask_conversations where user_id = auth.uid()`. Messages cascade.
- Idempotent; returns count deleted.

### 8.2 `deleteAccount()`

- Typed confirmation: user must type their own email exactly.
- Action:
  1. If `user_billing.status = 'active'` and `plan != 'free'`: clear `revolut_token`, set `status = 'canceled'` (no refund, no Revolut call needed).
  2. Call `admin.deleteUser(user_id)` via service-role client (`createClient(url, SERVICE_ROLE_KEY)`).
  3. `auth.users` cascade wipes `user_billing`, `billing_orders`, `ask_conversations`, `ask_messages`, `ask_usage_daily`.
- After return: client redirects to `/${locale}` (session gone, middleware re-routes).

Both actions live behind destructive-red confirm modals (`components/account/delete-confirm.tsx`, generic component parameterised by expected-text + action + warning-copy). CTA stays disabled until typed input matches exactly (case-insensitive for email, exact for `delete chats`).

## 9. File Manifest

### New files

```
supabase/migrations/0004_billing.sql
supabase/functions/billing-renew/index.ts

lib/billing/plans.ts              -- plan catalog: id, price_cents, tokens, display name
lib/billing/revolut.ts            -- Revolut client: createOrder, chargeToken, verifyWebhook
lib/ask/pricing.ts                -- MODEL_MULTIPLIERS + helpers

app/api/billing/checkout/route.ts -- POST, creates Revolut order, returns public_id
app/api/billing/webhook/route.ts  -- POST, verifies signature, updates state
app/api/billing/cancel/route.ts   -- POST, server-side cancel

app/actions/account.ts            -- deleteAllChats, deleteAccount, loadBillingSnapshot

components/auth/profile-chip.tsx
components/account/account-drawer.tsx
components/account/usage-meter.tsx
components/account/plan-cards.tsx
components/account/upgrade-modal.tsx
components/account/delete-confirm.tsx
components/account/order-history.tsx
```

### Modified files

```
app/[locale]/ask/layout.tsx            -- mount AccountDrawer + AccountDrawerProvider
components/ask/conversation-rail.tsx   -- add ProfileChip at bottom
app/api/ask/route.ts                   -- pre-stream quota gate + post-stream billing_increment
app/[locale]/account/page.tsx          -- keep as fallback, or strip to redirect to /ask?drawer=profile
.env.example                           -- Revolut env vars
```

## 10. Testing

- **DB migration:** vitest + a local Supabase branch run `0004_billing.sql`, assert trigger creates `user_billing` on signup.
- **Quota gate:** unit test `/api/ask` returns 402 at exactly the right threshold for each plan.
- **Webhook:** unit test signature verification with valid/invalid HMAC, idempotency against replayed `ORDER_COMPLETED`.
- **Renewal cron:** local invocation with a synthetic row where `next_charge_at < now()` — assert new `billing_orders` row is created.
- **UI:** component tests for `UsageMeter` (rendering formats), `PlanCards` (CTA state per current plan), `DeleteConfirm` (button disabled until text matches).
- **Manual E2E:** Revolut sandbox — run one full checkout, one forced renewal, one forced failure, one cancel, one account deletion.

## 11. Open Questions

None blocking implementation. A couple of items are deliberately deferred to post-launch:

- Email receipts — Revolut sends its own, but a branded receipt via the existing magic-link SMTP pipeline would be nicer. Out of scope for v1.
- Yearly plans at 20% discount — easy to add once the monthly flow is proven.
- `past_due` grace period tuning (currently 3 days, unverified). Will revisit after first failed-renewal in production.
