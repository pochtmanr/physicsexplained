# Profile, Token System & Revolut Billing — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship a right-side account drawer on `/ask` with Profile/Billing tabs, a token-metered quota system (Free 3q/mo, Starter $12/mo = 1.5M tokens, Pro $35/mo = 4M tokens, model multipliers ×1/×5/×1.2), and Revolut Merchant recurring subscriptions in USD driven by a daily renewal cron, plus typed-confirmation Delete-all-chats / Delete-account flows.

**Architecture:** New `user_billing` + `billing_orders` tables, auto-populated via `auth.users` trigger. Quota gate added to existing `/api/ask/stream` route (pre-stream 402 guard, post-stream weighted-token increment). Revolut Merchant Orders API + saved-card token enables cron-driven renewals with a verified webhook for state transitions. UI is a `ProfileChip` in the sidebar that opens an `AccountDrawer` (right-side, 420px, full-screen on mobile) with two tabs + pinned Sign out, and an `UpgradeModal` triggered on 402.

**Tech Stack:** Next.js 15 (App Router, React 19), TypeScript strict, Tailwind v4, Supabase (@supabase/ssr, @supabase/supabase-js), Postgres + RLS, Vitest + Testing Library, `RevolutCheckout.js` (client), Revolut Merchant Orders API (server), Supabase scheduled Edge Function (Deno) for renewals.

**Spec:** `docs/superpowers/specs/2026-04-23-profile-billing-tokens-design.md`

---

## Phase 1 — Foundations (DB, plan catalog, Revolut client)

### Task 1: DB migration — `user_billing`, `billing_orders`, trigger, RPC

**Files:**
- Create: `supabase/migrations/0004_billing.sql`

- [ ] **Step 1: Write the migration**

```sql
-- Physics.explained — token quota + Revolut Merchant recurring billing
-- See docs/superpowers/specs/2026-04-23-profile-billing-tokens-design.md

-- 1. Per-user billing state (one row per auth.users row)
create table if not exists public.user_billing (
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

alter table public.user_billing enable row level security;

drop policy if exists "user reads own billing" on public.user_billing;
create policy "user reads own billing" on public.user_billing
  for select to authenticated using (user_id = auth.uid());

-- No insert/update/delete policies: only service-role mutates.

-- 2. Audit log of every Revolut order (first payment + renewals)
create table if not exists public.billing_orders (
  id                uuid primary key default gen_random_uuid(),
  user_id           uuid not null references auth.users(id) on delete cascade,
  revolut_order_id  text not null unique,
  plan              text not null,
  amount_cents      int  not null,
  currency          text not null default 'USD',
  state             text not null,
  created_at        timestamptz not null default now()
);
create index if not exists billing_orders_user_idx
  on public.billing_orders (user_id, created_at desc);

alter table public.billing_orders enable row level security;
drop policy if exists "user reads own orders" on public.billing_orders;
create policy "user reads own orders" on public.billing_orders
  for select to authenticated using (user_id = auth.uid());

-- 3. Trigger: every new auth.users row gets a default free-plan billing row
create or replace function public.handle_new_user_billing()
returns trigger language plpgsql security definer as $$
begin
  insert into public.user_billing (user_id, plan, tokens_allowance, free_questions_used)
  values (new.id, 'free', 0, 0)
  on conflict (user_id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created_billing on auth.users;
create trigger on_auth_user_created_billing
  after insert on auth.users
  for each row execute function public.handle_new_user_billing();

-- 4. Backfill any existing users that pre-date this migration
insert into public.user_billing (user_id, plan, tokens_allowance, free_questions_used)
select id, 'free', 0, 0 from auth.users
on conflict (user_id) do nothing;

-- 5. Atomic quota increment (service-role only)
create or replace function public.billing_increment(
  p_user_id         uuid,
  p_weighted_tokens bigint,
  p_is_free         boolean
) returns void language sql as $$
  update public.user_billing
     set tokens_used         = case when p_is_free then tokens_used else tokens_used + p_weighted_tokens end,
         free_questions_used = case when p_is_free then free_questions_used + 1 else free_questions_used end,
         updated_at          = now()
   where user_id = p_user_id;
$$;
revoke all on function public.billing_increment from public;
grant execute on function public.billing_increment to service_role;

-- 6. updated_at auto-maintenance
create or replace function public.touch_user_billing_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at := now();
  return new;
end;
$$;
drop trigger if exists user_billing_touch_updated on public.user_billing;
create trigger user_billing_touch_updated
  before update on public.user_billing
  for each row execute function public.touch_user_billing_updated_at();
```

- [ ] **Step 2: Apply migration to local/dev Supabase**

Run: `pnpm supabase db push` (or run the SQL via MCP `physics-supabase__apply_migration` with `name: "0004_billing"` and the full content above).
Expected: migration applied cleanly, `user_billing` and `billing_orders` tables visible, trigger listed on `auth.users`, one `user_billing` row per existing auth.users row.

- [ ] **Step 3: Commit**

```bash
git add supabase/migrations/0004_billing.sql
git commit -m "feat(billing): add user_billing + billing_orders schema, trigger, RPC"
```

---

### Task 2: Plan catalog + pricing multipliers

**Files:**
- Create: `lib/billing/plans.ts`
- Create: `lib/ask/pricing.ts`
- Test: `tests/billing/plans.test.ts`
- Test: `tests/ask/pricing.test.ts`

- [ ] **Step 1: Write failing tests**

`tests/billing/plans.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import { PLANS, getPlan, allowanceFor } from "@/lib/billing/plans";

describe("plans", () => {
  it("defines free / starter / pro with correct price and allowance", () => {
    expect(PLANS.free.priceCents).toBe(0);
    expect(PLANS.free.tokensAllowance).toBe(0);
    expect(PLANS.free.freeQuestions).toBe(3);

    expect(PLANS.starter.priceCents).toBe(1200);
    expect(PLANS.starter.tokensAllowance).toBe(1_500_000);

    expect(PLANS.pro.priceCents).toBe(3500);
    expect(PLANS.pro.tokensAllowance).toBe(4_000_000);
  });

  it("getPlan returns canonical plan by id", () => {
    expect(getPlan("pro").id).toBe("pro");
    expect(() => getPlan("enterprise" as never)).toThrow();
  });

  it("allowanceFor returns tokens for paid, 0 for free", () => {
    expect(allowanceFor("free")).toBe(0);
    expect(allowanceFor("starter")).toBe(1_500_000);
    expect(allowanceFor("pro")).toBe(4_000_000);
  });
});
```

`tests/ask/pricing.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import { MODEL_MULTIPLIERS, weightedTokens } from "@/lib/ask/pricing";

describe("pricing multipliers", () => {
  it("assigns correct multiplier per model", () => {
    expect(MODEL_MULTIPLIERS["claude-sonnet-4-6"]).toBe(1.0);
    expect(MODEL_MULTIPLIERS["claude-haiku-4-5"]).toBe(0.3);
    expect(MODEL_MULTIPLIERS["claude-opus-4-7"]).toBe(5.0);
    expect(MODEL_MULTIPLIERS["gpt-5"]).toBe(1.2);
    expect(MODEL_MULTIPLIERS["gpt-5-mini"]).toBe(0.3);
  });

  it("computes weighted tokens with rounding", () => {
    expect(weightedTokens("claude-sonnet-4-6", 1000, 500)).toBe(1500);
    expect(weightedTokens("claude-opus-4-7", 1000, 500)).toBe(7500);
    expect(weightedTokens("gpt-5", 1000, 500)).toBe(1800);
  });

  it("falls back to 1.0 for unknown model", () => {
    expect(weightedTokens("future-model-9" as never, 1000, 500)).toBe(1500);
  });
});
```

- [ ] **Step 2: Run tests, verify both fail**

Run: `pnpm vitest run tests/billing/plans.test.ts tests/ask/pricing.test.ts`
Expected: FAIL — cannot resolve module `@/lib/billing/plans` and `@/lib/ask/pricing`.

- [ ] **Step 3: Implement `lib/billing/plans.ts`**

```ts
export type PlanId = "free" | "starter" | "pro";

export interface Plan {
  id: PlanId;
  label: string;
  priceCents: number;
  currency: "USD";
  tokensAllowance: number;
  freeQuestions: number;
  blurb: string;
}

export const PLANS: Record<PlanId, Plan> = {
  free: {
    id: "free",
    label: "Free",
    priceCents: 0,
    currency: "USD",
    tokensAllowance: 0,
    freeQuestions: 3,
    blurb: "3 questions per month · Claude Sonnet",
  },
  starter: {
    id: "starter",
    label: "Starter",
    priceCents: 1200,
    currency: "USD",
    tokensAllowance: 1_500_000,
    freeQuestions: 0,
    blurb: "1.5M tokens / month · ≈ 700 medium questions",
  },
  pro: {
    id: "pro",
    label: "Pro",
    priceCents: 3500,
    currency: "USD",
    tokensAllowance: 4_000_000,
    freeQuestions: 0,
    blurb: "4M tokens / month · ≈ 1,900 medium questions",
  },
};

export function getPlan(id: PlanId): Plan {
  const p = PLANS[id];
  if (!p) throw new Error(`Unknown plan id: ${id}`);
  return p;
}

export function allowanceFor(id: PlanId): number {
  return PLANS[id].tokensAllowance;
}

// Estimate user-visible "questions remaining" from tokens remaining.
// Assumption: ~2,000 weighted tokens per typical Sonnet exchange.
const AVG_TOKENS_PER_QUESTION = 2_000;
export function estimateQuestions(tokens: number): number {
  return Math.max(0, Math.round(tokens / AVG_TOKENS_PER_QUESTION));
}
```

- [ ] **Step 4: Implement `lib/ask/pricing.ts`**

```ts
// Weighted token multipliers — billed tokens = (input + output) × multiplier.
// Ratios approximate blended API cost vs Claude Sonnet 4.6 (=1.0).
export const MODEL_MULTIPLIERS: Record<string, number> = {
  "claude-sonnet-4-6": 1.0,
  "claude-haiku-4-5": 0.3,
  "claude-opus-4-7": 5.0,
  "gpt-5": 1.2,
  "gpt-5-mini": 0.3,
};

export function multiplierFor(modelId: string): number {
  return MODEL_MULTIPLIERS[modelId] ?? 1.0;
}

export function weightedTokens(
  modelId: string,
  inputTokens: number,
  outputTokens: number,
): number {
  const m = multiplierFor(modelId);
  return Math.round((inputTokens + outputTokens) * m);
}
```

- [ ] **Step 5: Run tests, verify both pass**

Run: `pnpm vitest run tests/billing/plans.test.ts tests/ask/pricing.test.ts`
Expected: 7 passed, 0 failed.

- [ ] **Step 6: Commit**

```bash
git add lib/billing/plans.ts lib/ask/pricing.ts tests/billing/plans.test.ts tests/ask/pricing.test.ts
git commit -m "feat(billing): plan catalog + model-weighted token multipliers"
```

---

### Task 3: Revolut config loader

**Files:**
- Create: `lib/billing/config.ts`
- Test: `tests/billing/config.test.ts`

- [ ] **Step 1: Write failing test**

```ts
import { describe, it, expect, beforeEach, afterEach } from "vitest";

describe("revolut config", () => {
  const save = { ...process.env };
  afterEach(() => { for (const k of Object.keys(process.env)) delete process.env[k]; Object.assign(process.env, save); });

  it("selects sandbox base + public key when REVOLUT_ENV=sandbox", async () => {
    process.env.REVOLUT_ENV = "sandbox";
    process.env.REVOLUT_API_KEY = "sk_test_xx";
    process.env.REVOLUT_WEBHOOK_SECRET = "whsec_xx";
    process.env.NEXT_PUBLIC_REVOLUT_PUBLIC_KEY = "pk_test_xx";
    const { getRevolutConfig } = await import("@/lib/billing/config");
    const cfg = getRevolutConfig();
    expect(cfg.apiBase).toBe("https://sandbox-merchant.revolut.com/api");
    expect(cfg.publicKey).toBe("pk_test_xx");
    expect(cfg.env).toBe("sandbox");
  });

  it("selects production base when REVOLUT_ENV=production", async () => {
    process.env.REVOLUT_ENV = "production";
    process.env.REVOLUT_API_KEY = "sk_live_xx";
    process.env.REVOLUT_WEBHOOK_SECRET = "whsec_xx";
    process.env.NEXT_PUBLIC_REVOLUT_PUBLIC_KEY = "pk_live_xx";
    const { getRevolutConfig } = await import("@/lib/billing/config");
    const cfg = getRevolutConfig();
    expect(cfg.apiBase).toBe("https://merchant.revolut.com/api");
    expect(cfg.env).toBe("production");
  });

  it("throws with a clear message when a required var is missing", async () => {
    process.env.REVOLUT_ENV = "sandbox";
    delete process.env.REVOLUT_API_KEY;
    const { getRevolutConfig } = await import("@/lib/billing/config");
    expect(() => getRevolutConfig()).toThrow(/REVOLUT_API_KEY/);
  });
});
```

- [ ] **Step 2: Run test, verify it fails**

Run: `pnpm vitest run tests/billing/config.test.ts`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement `lib/billing/config.ts`**

```ts
import "server-only";

export type RevolutEnv = "sandbox" | "production";

export interface RevolutConfig {
  env: RevolutEnv;
  apiBase: string;
  apiKey: string;
  webhookSecret: string;
  publicKey: string;
}

function must(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`Missing env var ${name}. See .env.example for Revolut setup.`);
  return v;
}

export function getRevolutConfig(): RevolutConfig {
  const env = (process.env.REVOLUT_ENV ?? "sandbox") as RevolutEnv;
  if (env !== "sandbox" && env !== "production") {
    throw new Error(`REVOLUT_ENV must be "sandbox" or "production", got "${env}"`);
  }
  const apiBase =
    env === "production"
      ? "https://merchant.revolut.com/api"
      : "https://sandbox-merchant.revolut.com/api";
  return {
    env,
    apiBase,
    apiKey: must("REVOLUT_API_KEY"),
    webhookSecret: must("REVOLUT_WEBHOOK_SECRET"),
    publicKey: must("NEXT_PUBLIC_REVOLUT_PUBLIC_KEY"),
  };
}
```

- [ ] **Step 4: Run test, verify it passes**

Run: `pnpm vitest run tests/billing/config.test.ts`
Expected: 3 passed.

- [ ] **Step 5: Commit**

```bash
git add lib/billing/config.ts tests/billing/config.test.ts
git commit -m "feat(billing): Revolut config loader with sandbox/production switch"
```

---

### Task 4: Revolut client (createOrder, chargeToken, verifyWebhook)

**Files:**
- Create: `lib/billing/revolut.ts`
- Test: `tests/billing/revolut.test.ts`

- [ ] **Step 1: Write failing tests**

```ts
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { createHmac } from "node:crypto";

function setupEnv() {
  process.env.REVOLUT_ENV = "sandbox";
  process.env.REVOLUT_API_KEY = "sk_test_xx";
  process.env.REVOLUT_WEBHOOK_SECRET = "whsec_shared";
  process.env.NEXT_PUBLIC_REVOLUT_PUBLIC_KEY = "pk_test_xx";
}

describe("revolut client", () => {
  beforeEach(() => { setupEnv(); vi.resetModules(); });
  afterEach(() => { vi.restoreAllMocks(); });

  it("createOrder posts to /1.0/orders and returns public_id + id", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ id: "ord_123", public_id: "pub_abc", state: "pending" }),
    });
    vi.stubGlobal("fetch", fetchMock);

    const { createOrder } = await import("@/lib/billing/revolut");
    const res = await createOrder({
      amountCents: 1200,
      currency: "USD",
      externalRef: "ext-1",
      customer: { email: "a@b.com", fullName: "A B" },
      savePaymentMethod: true,
    });

    expect(res.id).toBe("ord_123");
    expect(res.publicId).toBe("pub_abc");
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe("https://sandbox-merchant.revolut.com/api/1.0/orders");
    expect(init.headers.Authorization).toBe("Bearer sk_test_xx");
    expect(init.headers["Content-Type"]).toBe("application/json");
    const body = JSON.parse(init.body);
    expect(body.amount).toBe(1200);
    expect(body.currency).toBe("USD");
    expect(body.save_payment_method_for).toBe("customer");
    expect(body.merchant_order_ext_ref).toBe("ext-1");
  });

  it("chargeToken posts an order with payment_method.token", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ id: "ord_456", public_id: "pub_def", state: "pending" }),
    });
    vi.stubGlobal("fetch", fetchMock);
    const { chargeToken } = await import("@/lib/billing/revolut");
    await chargeToken({ amountCents: 3500, currency: "USD", externalRef: "ext-2", token: "tok_x" });
    const body = JSON.parse(fetchMock.mock.calls[0][1].body);
    expect(body.payment_method).toEqual({ type: "token", id: "tok_x" });
  });

  it("throws when Revolut returns non-2xx", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
      ok: false, status: 422, text: async () => "invalid amount",
    }));
    const { createOrder } = await import("@/lib/billing/revolut");
    await expect(createOrder({ amountCents: 0, currency: "USD", externalRef: "x", customer: { email: "a@b.com" } }))
      .rejects.toThrow(/Revolut API 422/);
  });

  it("verifyWebhook accepts valid signature and rejects invalid", async () => {
    const body = '{"event":"ORDER_COMPLETED"}';
    const valid = "v1=" + createHmac("sha256", "whsec_shared").update(body).digest("hex");
    const { verifyWebhook } = await import("@/lib/billing/revolut");
    expect(verifyWebhook(body, valid)).toBe(true);
    expect(verifyWebhook(body, "v1=deadbeef")).toBe(false);
    expect(verifyWebhook(body, "")).toBe(false);
  });
});
```

- [ ] **Step 2: Run tests, verify they fail**

Run: `pnpm vitest run tests/billing/revolut.test.ts`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement `lib/billing/revolut.ts`**

```ts
import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";
import { getRevolutConfig } from "./config";

export interface CreateOrderInput {
  amountCents: number;
  currency: "USD";
  externalRef: string;
  customer: { email: string; fullName?: string };
  savePaymentMethod?: boolean;
}

export interface ChargeTokenInput {
  amountCents: number;
  currency: "USD";
  externalRef: string;
  token: string;
}

export interface RevolutOrder {
  id: string;
  publicId: string;
  state: string;
}

const API_VERSION_HEADER = { "Revolut-Api-Version": "2024-09-01" };

async function postOrder(body: Record<string, unknown>): Promise<RevolutOrder> {
  const cfg = getRevolutConfig();
  const res = await fetch(`${cfg.apiBase}/1.0/orders`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${cfg.apiKey}`,
      ...API_VERSION_HEADER,
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Revolut API ${res.status}: ${text}`);
  }
  const json = (await res.json()) as { id: string; public_id: string; state: string };
  return { id: json.id, publicId: json.public_id, state: json.state };
}

export async function createOrder(input: CreateOrderInput): Promise<RevolutOrder> {
  return postOrder({
    amount: input.amountCents,
    currency: input.currency,
    capture_mode: "automatic",
    merchant_order_ext_ref: input.externalRef,
    ...(input.savePaymentMethod ? { save_payment_method_for: "customer" } : {}),
    customer: {
      email: input.customer.email,
      ...(input.customer.fullName ? { full_name: input.customer.fullName } : {}),
    },
  });
}

export async function chargeToken(input: ChargeTokenInput): Promise<RevolutOrder> {
  return postOrder({
    amount: input.amountCents,
    currency: input.currency,
    capture_mode: "automatic",
    merchant_order_ext_ref: input.externalRef,
    payment_method: { type: "token", id: input.token },
  });
}

export function verifyWebhook(rawBody: string, signatureHeader: string): boolean {
  if (!signatureHeader?.startsWith("v1=")) return false;
  const cfg = getRevolutConfig();
  const received = signatureHeader.slice(3);
  const expected = createHmac("sha256", cfg.webhookSecret).update(rawBody).digest("hex");
  const a = Buffer.from(received, "hex");
  const b = Buffer.from(expected, "hex");
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}
```

- [ ] **Step 4: Run tests, verify they pass**

Run: `pnpm vitest run tests/billing/revolut.test.ts`
Expected: 4 passed.

- [ ] **Step 5: Commit**

```bash
git add lib/billing/revolut.ts tests/billing/revolut.test.ts
git commit -m "feat(billing): Revolut Merchant client — createOrder, chargeToken, verifyWebhook"
```

---

### Task 5: `.env.example` update for Revolut

**Files:**
- Modify: `.env.example`

- [ ] **Step 1: Append to `.env.example` (after the rate-limit section)**

```bash

# --- Billing (Revolut Merchant) ---
# Revolut Business → Merchant → APIs. Keep secrets server-only.
REVOLUT_ENV=sandbox                                       # sandbox | production
REVOLUT_API_KEY=sk_...                                    # Server-only secret (never NEXT_PUBLIC_)
REVOLUT_WEBHOOK_SECRET=whsec_...                          # Set in Revolut dashboard when registering webhook
NEXT_PUBLIC_REVOLUT_PUBLIC_KEY=pk_...                     # Public, used by RevolutCheckout.js
```

- [ ] **Step 2: Commit**

```bash
git add .env.example
git commit -m "chore(env): document Revolut Merchant vars in .env.example"
```

---

## Phase 2 — Quota enforcement in `/ask`

### Task 6: Pre-stream quota gate + post-stream billing increment

**Files:**
- Create: `lib/billing/quota.ts`
- Test: `tests/billing/quota.test.ts`
- Modify: `app/api/ask/stream/route.ts`

- [ ] **Step 1: Write failing test for quota check logic**

```ts
import { describe, it, expect } from "vitest";
import { checkQuota, type BillingRow } from "@/lib/billing/quota";

const base: BillingRow = {
  plan: "free", status: "active",
  tokens_allowance: 0, tokens_used: 0,
  free_questions_used: 0,
  cycle_end: new Date(Date.now() + 86_400_000).toISOString(),
};

describe("checkQuota", () => {
  it("allows free plan when under 3 questions", () => {
    expect(checkQuota({ ...base, free_questions_used: 2 })).toEqual({ ok: true });
  });
  it("blocks free plan at 3rd question", () => {
    expect(checkQuota({ ...base, free_questions_used: 3 })).toEqual({
      ok: false, reason: "free_quota_exhausted",
    });
  });
  it("allows starter plan with tokens remaining", () => {
    expect(checkQuota({ ...base, plan: "starter", tokens_allowance: 1_500_000, tokens_used: 1_000_000 }))
      .toEqual({ ok: true });
  });
  it("blocks starter at exactly allowance", () => {
    expect(checkQuota({ ...base, plan: "starter", tokens_allowance: 1_500_000, tokens_used: 1_500_000 }))
      .toEqual({ ok: false, reason: "tokens_exhausted" });
  });
  it("blocks any paid plan in past_due regardless of balance", () => {
    expect(checkQuota({ ...base, plan: "pro", status: "past_due", tokens_allowance: 4_000_000, tokens_used: 0 }))
      .toEqual({ ok: false, reason: "past_due" });
  });
  it("allows canceled plan until cycle_end", () => {
    expect(checkQuota({ ...base, plan: "pro", status: "canceled",
      tokens_allowance: 4_000_000, tokens_used: 100, cycle_end: new Date(Date.now() + 1000).toISOString() }))
      .toEqual({ ok: true });
  });
});
```

- [ ] **Step 2: Run test, verify it fails**

Run: `pnpm vitest run tests/billing/quota.test.ts`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement `lib/billing/quota.ts`**

```ts
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

  // canceled but within cycle still has access; expiry is enforced by renewal cron sweep
  if (row.tokens_used >= row.tokens_allowance) return { ok: false, reason: "tokens_exhausted" };
  return { ok: true };
}
```

- [ ] **Step 4: Run test, verify it passes**

Run: `pnpm vitest run tests/billing/quota.test.ts`
Expected: 6 passed.

- [ ] **Step 5: Wire quota into `app/api/ask/stream/route.ts`**

Add imports near the top (after existing imports):

```ts
import { checkQuota, type BillingRow } from "@/lib/billing/quota";
import { weightedTokens } from "@/lib/ask/pricing";
```

Replace the block starting at the existing rate-limit call (the lines with `const rl = makeRateLimitDepsForUser(...)` through `if (!rlRes.ok) return NextResponse.json(...)`) with:

```ts
  // Quota gate (billing) — 402 before streaming
  const { data: billingRow, error: billingErr } = await db
    .from("user_billing")
    .select("plan,status,tokens_allowance,tokens_used,free_questions_used,cycle_end")
    .eq("user_id", user.id)
    .maybeSingle();
  if (billingErr || !billingRow) {
    return NextResponse.json({ error: "DB_ERR", message: billingErr?.message ?? "missing billing row" }, { status: 500 });
  }
  const quota = checkQuota(billingRow as BillingRow);
  if (!quota.ok) {
    return NextResponse.json({ error: "QUOTA_EXHAUSTED", reason: quota.reason }, { status: 402 });
  }

  // Legacy daily analytics rate limit stays in place
  const rl = makeRateLimitDepsForUser(db, user.id);
  const rlRes = await checkRateLimit(rl);
  if (!rlRes.ok) return NextResponse.json({ error: "RATE_LIMITED", reason: rlRes.reason }, { status: 429 });
```

In the `finally` block where `ask_increment_usage` is called (after `finalUsage` write), immediately add:

```ts
            const weighted = weightedTokens(finalUsage.model, finalUsage.inputTokens, finalUsage.outputTokens);
            await db.rpc("billing_increment", {
              p_user_id: user.id,
              p_weighted_tokens: weighted,
              p_is_free: (billingRow as BillingRow).plan === "free",
            });
```

- [ ] **Step 6: Run full test suite to check nothing regressed**

Run: `pnpm vitest run`
Expected: all previously passing tests still pass.

- [ ] **Step 7: Commit**

```bash
git add lib/billing/quota.ts tests/billing/quota.test.ts app/api/ask/stream/route.ts
git commit -m "feat(billing): quota gate + weighted-token increment in /ask/stream"
```

---

## Phase 3 — Account server actions

### Task 7: `loadBillingSnapshot` action

**Files:**
- Create: `app/actions/account.ts` (initial version with loadBillingSnapshot only)
- Test: `tests/account/load-snapshot.test.ts`

- [ ] **Step 1: Write failing test**

```ts
import { describe, it, expect } from "vitest";
import { composeSnapshot } from "@/lib/billing/snapshot";

describe("composeSnapshot", () => {
  it("composes a free-plan snapshot", () => {
    const out = composeSnapshot({
      plan: "free", status: "active",
      tokens_allowance: 0, tokens_used: 0,
      free_questions_used: 2,
      cycle_end: "2026-05-23T00:00:00Z",
      next_charge_at: null, canceled_at: null,
    });
    expect(out.plan.id).toBe("free");
    expect(out.tokensRemaining).toBe(0);
    expect(out.questionsRemaining).toBe(1);
    expect(out.percentUsed).toBe(Math.round((2/3) * 100));
  });

  it("composes a starter snapshot with percent used", () => {
    const out = composeSnapshot({
      plan: "starter", status: "active",
      tokens_allowance: 1_500_000, tokens_used: 750_000,
      free_questions_used: 0,
      cycle_end: "2026-05-23T00:00:00Z",
      next_charge_at: "2026-05-23T00:00:00Z", canceled_at: null,
    });
    expect(out.tokensRemaining).toBe(750_000);
    expect(out.percentUsed).toBe(50);
    expect(out.questionsRemaining).toBe(Math.round(750_000 / 2000));
  });
});
```

- [ ] **Step 2: Run test, verify it fails**

Run: `pnpm vitest run tests/account/load-snapshot.test.ts`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement `lib/billing/snapshot.ts`**

```ts
import { PLANS, type PlanId, estimateQuestions } from "./plans";

export interface BillingSnapshot {
  plan: typeof PLANS[PlanId];
  status: "active" | "past_due" | "canceled";
  tokensUsed: number;
  tokensAllowance: number;
  tokensRemaining: number;
  freeQuestionsUsed: number;
  questionsRemaining: number;
  percentUsed: number;
  cycleEnd: string;
  nextChargeAt: string | null;
  canceledAt: string | null;
}

export interface RawBilling {
  plan: PlanId;
  status: "active" | "past_due" | "canceled";
  tokens_allowance: number;
  tokens_used: number;
  free_questions_used: number;
  cycle_end: string;
  next_charge_at: string | null;
  canceled_at: string | null;
}

export function composeSnapshot(raw: RawBilling): BillingSnapshot {
  const plan = PLANS[raw.plan];
  if (raw.plan === "free") {
    const used = raw.free_questions_used;
    const total = plan.freeQuestions;
    return {
      plan, status: raw.status,
      tokensUsed: 0, tokensAllowance: 0, tokensRemaining: 0,
      freeQuestionsUsed: used,
      questionsRemaining: Math.max(0, total - used),
      percentUsed: Math.round((used / total) * 100),
      cycleEnd: raw.cycle_end,
      nextChargeAt: raw.next_charge_at,
      canceledAt: raw.canceled_at,
    };
  }
  const remaining = Math.max(0, raw.tokens_allowance - raw.tokens_used);
  return {
    plan, status: raw.status,
    tokensUsed: raw.tokens_used,
    tokensAllowance: raw.tokens_allowance,
    tokensRemaining: remaining,
    freeQuestionsUsed: 0,
    questionsRemaining: estimateQuestions(remaining),
    percentUsed: Math.round((raw.tokens_used / raw.tokens_allowance) * 100),
    cycleEnd: raw.cycle_end,
    nextChargeAt: raw.next_charge_at,
    canceledAt: raw.canceled_at,
  };
}
```

- [ ] **Step 4: Implement `app/actions/account.ts` (loadBillingSnapshot only)**

```ts
"use server";
import { getSsrClient } from "@/lib/supabase-server";
import { composeSnapshot, type BillingSnapshot, type RawBilling } from "@/lib/billing/snapshot";

export async function loadBillingSnapshot(): Promise<BillingSnapshot | null> {
  const db = await getSsrClient();
  const { data: { user } } = await db.auth.getUser();
  if (!user) return null;
  const { data } = await db
    .from("user_billing")
    .select("plan,status,tokens_allowance,tokens_used,free_questions_used,cycle_end,next_charge_at,canceled_at")
    .eq("user_id", user.id)
    .maybeSingle();
  if (!data) return null;
  return composeSnapshot(data as RawBilling);
}
```

- [ ] **Step 5: Run test, verify it passes**

Run: `pnpm vitest run tests/account/load-snapshot.test.ts`
Expected: 2 passed.

- [ ] **Step 6: Commit**

```bash
git add lib/billing/snapshot.ts app/actions/account.ts tests/account/load-snapshot.test.ts
git commit -m "feat(account): loadBillingSnapshot server action + composeSnapshot pure helper"
```

---

### Task 8: `deleteAllChats` + `deleteAccount` actions

**Files:**
- Modify: `app/actions/account.ts`

- [ ] **Step 1: Append to `app/actions/account.ts`**

```ts
import { redirect } from "next/navigation";
import { getServiceClient } from "@/lib/supabase-server";

export async function deleteAllChats(confirmText: string): Promise<{ ok: boolean; deleted?: number; error?: string }> {
  if (confirmText.trim().toLowerCase() !== "delete chats") {
    return { ok: false, error: "Confirmation text did not match." };
  }
  const db = await getSsrClient();
  const { data: { user } } = await db.auth.getUser();
  if (!user) return { ok: false, error: "Not authenticated" };
  const { error, count } = await db
    .from("ask_conversations")
    .delete({ count: "exact" })
    .eq("user_id", user.id);
  if (error) return { ok: false, error: error.message };
  return { ok: true, deleted: count ?? 0 };
}

export async function deleteAccount(confirmEmail: string): Promise<{ ok: false; error: string } | never> {
  const db = await getSsrClient();
  const { data: { user } } = await db.auth.getUser();
  if (!user) return { ok: false, error: "Not authenticated" };
  if (confirmEmail.trim().toLowerCase() !== (user.email ?? "").toLowerCase()) {
    return { ok: false, error: "Email did not match." };
  }

  // Best-effort: stop any future Revolut charges by clearing the saved token.
  const svc = getServiceClient();
  await svc.from("user_billing")
    .update({ status: "canceled", canceled_at: new Date().toISOString(), revolut_token: null, next_charge_at: null })
    .eq("user_id", user.id);

  const { error } = await svc.auth.admin.deleteUser(user.id);
  if (error) return { ok: false, error: error.message };

  await db.auth.signOut();
  redirect("/");
}
```

- [ ] **Step 2: Manual sanity check (no unit test — destructive write path)**

Run: `pnpm build`
Expected: no TypeScript errors.

- [ ] **Step 3: Commit**

```bash
git add app/actions/account.ts
git commit -m "feat(account): deleteAllChats + deleteAccount server actions"
```

---

## Phase 4 — Revolut API routes

### Task 9: `POST /api/billing/checkout`

**Files:**
- Create: `app/api/billing/checkout/route.ts`

- [ ] **Step 1: Implement the route**

```ts
import { NextResponse } from "next/server";
import { z } from "zod";
import { randomUUID } from "node:crypto";
import { getSsrClient, getServiceClient } from "@/lib/supabase-server";
import { getPlan, type PlanId } from "@/lib/billing/plans";
import { createOrder } from "@/lib/billing/revolut";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const Body = z.object({ plan: z.enum(["starter", "pro"]) });

export async function POST(req: Request) {
  const ssr = await getSsrClient();
  const { data: { user } } = await ssr.auth.getUser();
  if (!user) return NextResponse.json({ error: "UNAUTHENTICATED" }, { status: 401 });

  let body: z.infer<typeof Body>;
  try { body = Body.parse(await req.json()); }
  catch (e) { return NextResponse.json({ error: "BAD_REQUEST", message: (e as Error).message }, { status: 400 }); }

  const plan = getPlan(body.plan as PlanId);
  const externalRef = `user:${user.id}:${randomUUID()}`;

  const order = await createOrder({
    amountCents: plan.priceCents,
    currency: "USD",
    externalRef,
    customer: {
      email: user.email ?? "",
      fullName: (user.user_metadata?.full_name as string | undefined) ?? undefined,
    },
    savePaymentMethod: true,
  });

  const svc = getServiceClient();
  const { error } = await svc.from("billing_orders").insert({
    user_id: user.id,
    revolut_order_id: order.id,
    plan: plan.id,
    amount_cents: plan.priceCents,
    currency: "USD",
    state: "pending",
  });
  if (error) return NextResponse.json({ error: "DB_ERR", message: error.message }, { status: 500 });

  return NextResponse.json({
    publicId: order.publicId,
    orderId: order.id,
    plan: plan.id,
    amountCents: plan.priceCents,
  });
}
```

- [ ] **Step 2: Type-check**

Run: `pnpm build`
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add app/api/billing/checkout/route.ts
git commit -m "feat(billing): POST /api/billing/checkout — create Revolut order"
```

---

### Task 10: `POST /api/billing/webhook`

**Files:**
- Create: `lib/billing/webhook-handler.ts`
- Create: `app/api/billing/webhook/route.ts`
- Test: `tests/billing/webhook-handler.test.ts`

- [ ] **Step 1: Write failing test for the pure handler**

```ts
import { describe, it, expect, vi } from "vitest";
import { applyWebhookEvent, type WebhookEvent, type DbPort } from "@/lib/billing/webhook-handler";

function makeDb(overrides: Partial<DbPort> = {}): DbPort {
  return {
    getOrder: vi.fn().mockResolvedValue(null),
    updateOrderState: vi.fn().mockResolvedValue(undefined),
    activatePlan: vi.fn().mockResolvedValue(undefined),
    markPastDue: vi.fn().mockResolvedValue(undefined),
    ...overrides,
  };
}

const completedEvent: WebhookEvent = {
  type: "ORDER_COMPLETED",
  orderId: "ord_1",
  externalRef: "user:u1:xyz",
  payload: { customer_id: "cus_1", payment_method_token: "tok_1" },
};

describe("applyWebhookEvent", () => {
  it("ignores if order not found", async () => {
    const db = makeDb({ getOrder: vi.fn().mockResolvedValue(null) });
    await applyWebhookEvent(completedEvent, db);
    expect(db.activatePlan).not.toHaveBeenCalled();
  });

  it("completes first payment: sets state and activates plan", async () => {
    const db = makeDb({
      getOrder: vi.fn().mockResolvedValue({ user_id: "u1", plan: "starter", state: "pending" }),
    });
    await applyWebhookEvent(completedEvent, db);
    expect(db.updateOrderState).toHaveBeenCalledWith("ord_1", "completed");
    expect(db.activatePlan).toHaveBeenCalledWith({
      userId: "u1", plan: "starter",
      revolutCustomerId: "cus_1", revolutToken: "tok_1",
    });
  });

  it("is idempotent: already-completed order is a no-op", async () => {
    const db = makeDb({
      getOrder: vi.fn().mockResolvedValue({ user_id: "u1", plan: "pro", state: "completed" }),
    });
    await applyWebhookEvent(completedEvent, db);
    expect(db.updateOrderState).not.toHaveBeenCalled();
    expect(db.activatePlan).not.toHaveBeenCalled();
  });

  it("on ORDER_FAILED for a paid user, marks past_due", async () => {
    const db = makeDb({
      getOrder: vi.fn().mockResolvedValue({ user_id: "u1", plan: "pro", state: "pending" }),
    });
    await applyWebhookEvent(
      { type: "ORDER_FAILED", orderId: "ord_1", externalRef: "u", payload: {} },
      db,
    );
    expect(db.updateOrderState).toHaveBeenCalledWith("ord_1", "failed");
    expect(db.markPastDue).toHaveBeenCalledWith("u1");
  });
});
```

- [ ] **Step 2: Run test, verify it fails**

Run: `pnpm vitest run tests/billing/webhook-handler.test.ts`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement `lib/billing/webhook-handler.ts`**

```ts
import { PLANS, type PlanId } from "./plans";

export type WebhookEventType = "ORDER_COMPLETED" | "ORDER_FAILED" | "ORDER_CANCELLED" | "UNKNOWN";

export interface WebhookEvent {
  type: WebhookEventType;
  orderId: string;
  externalRef: string;
  payload: {
    customer_id?: string;
    payment_method_token?: string;
  };
}

export interface DbPort {
  getOrder(orderId: string): Promise<{ user_id: string; plan: PlanId; state: string } | null>;
  updateOrderState(orderId: string, state: "completed" | "failed" | "refunded"): Promise<void>;
  activatePlan(args: {
    userId: string;
    plan: PlanId;
    revolutCustomerId?: string;
    revolutToken?: string;
  }): Promise<void>;
  markPastDue(userId: string): Promise<void>;
}

export async function applyWebhookEvent(event: WebhookEvent, db: DbPort): Promise<void> {
  const order = await db.getOrder(event.orderId);
  if (!order) return;

  if (event.type === "ORDER_COMPLETED") {
    if (order.state === "completed") return;
    await db.updateOrderState(event.orderId, "completed");
    await db.activatePlan({
      userId: order.user_id,
      plan: order.plan,
      revolutCustomerId: event.payload.customer_id,
      revolutToken: event.payload.payment_method_token,
    });
    return;
  }

  if (event.type === "ORDER_FAILED" || event.type === "ORDER_CANCELLED") {
    if (order.state === "failed") return;
    await db.updateOrderState(event.orderId, "failed");
    await db.markPastDue(order.user_id);
  }
}

export function parseRevolutEvent(raw: unknown): WebhookEvent | null {
  if (typeof raw !== "object" || raw === null) return null;
  const r = raw as Record<string, unknown>;
  const typeStr = String(r.event ?? "");
  const order = (r.order_id ?? (r.order as Record<string, unknown> | undefined)?.id) as string | undefined;
  if (!order) return null;
  const orderObj = (r.order as Record<string, unknown> | undefined) ?? {};
  const externalRef = String((orderObj.merchant_order_ext_ref ?? r.merchant_order_ext_ref) ?? "");
  const type: WebhookEventType =
    typeStr === "ORDER_COMPLETED" ? "ORDER_COMPLETED"
    : typeStr === "ORDER_FAILED" ? "ORDER_FAILED"
    : typeStr === "ORDER_CANCELLED" ? "ORDER_CANCELLED"
    : "UNKNOWN";
  const pm = orderObj.payment_method as Record<string, unknown> | undefined;
  return {
    type,
    orderId: order,
    externalRef,
    payload: {
      customer_id: (orderObj.customer_id as string | undefined) ?? (r.customer_id as string | undefined),
      payment_method_token: pm?.id as string | undefined,
    },
  };
}
```

- [ ] **Step 4: Run test, verify it passes**

Run: `pnpm vitest run tests/billing/webhook-handler.test.ts`
Expected: 4 passed.

- [ ] **Step 5: Implement the Next.js route `app/api/billing/webhook/route.ts`**

```ts
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
```

- [ ] **Step 6: Type-check**

Run: `pnpm build`
Expected: no errors.

- [ ] **Step 7: Commit**

```bash
git add lib/billing/webhook-handler.ts app/api/billing/webhook/route.ts tests/billing/webhook-handler.test.ts
git commit -m "feat(billing): POST /api/billing/webhook — signature verify + state machine"
```

---

### Task 11: `POST /api/billing/cancel`

**Files:**
- Create: `app/api/billing/cancel/route.ts`

- [ ] **Step 1: Implement the route**

```ts
import { NextResponse } from "next/server";
import { getSsrClient, getServiceClient } from "@/lib/supabase-server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST() {
  const ssr = await getSsrClient();
  const { data: { user } } = await ssr.auth.getUser();
  if (!user) return NextResponse.json({ error: "UNAUTHENTICATED" }, { status: 401 });

  const svc = getServiceClient();
  const { error } = await svc.from("user_billing").update({
    status: "canceled",
    canceled_at: new Date().toISOString(),
    next_charge_at: null,
  }).eq("user_id", user.id);
  if (error) return NextResponse.json({ error: "DB_ERR", message: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
```

- [ ] **Step 2: Type-check**

Run: `pnpm build`
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add app/api/billing/cancel/route.ts
git commit -m "feat(billing): POST /api/billing/cancel — mark canceled, keep access until cycle_end"
```

---

## Phase 5 — Renewal cron (Supabase Edge Function)

### Task 12: `billing-renew` scheduled edge function

**Files:**
- Create: `supabase/functions/billing-renew/index.ts`
- Create: `supabase/functions/billing-renew/deno.json`

- [ ] **Step 1: Create `supabase/functions/billing-renew/deno.json`**

```json
{
  "imports": {
    "std/": "https://deno.land/std@0.224.0/"
  }
}
```

- [ ] **Step 2: Create `supabase/functions/billing-renew/index.ts`**

```ts
// Scheduled daily via `supabase functions schedule create billing-renew --cron "0 3 * * *"`.
// Env needed (set with `supabase secrets set`):
//   REVOLUT_ENV, REVOLUT_API_KEY, SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
// No Next.js imports — this runs in Deno, standalone from the web app.

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
```

- [ ] **Step 3: Document the deploy command inline (README block at top of file)**

Add this comment at the very top of `index.ts`:

```ts
// Deploy:
//   supabase functions deploy billing-renew --no-verify-jwt
//   supabase secrets set REVOLUT_ENV=sandbox REVOLUT_API_KEY=sk_test_...
//   supabase functions schedule create billing-renew --cron "0 3 * * *"
```

- [ ] **Step 4: Commit**

```bash
git add supabase/functions/billing-renew/
git commit -m "feat(billing): daily renewal edge function (downgrade + charge saved token)"
```

---

## Phase 6 — UI

### Task 13: `UsageMeter` component

**Files:**
- Create: `components/account/usage-meter.tsx`
- Test: `tests/account/usage-meter.test.tsx`

- [ ] **Step 1: Write failing test**

```tsx
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { UsageMeter } from "@/components/account/usage-meter";

describe("UsageMeter", () => {
  it("renders free plan as questions remaining", () => {
    render(<UsageMeter snapshot={{
      plan: { id: "free", label: "Free", priceCents: 0, currency: "USD", tokensAllowance: 0, freeQuestions: 3, blurb: "" },
      status: "active",
      tokensUsed: 0, tokensAllowance: 0, tokensRemaining: 0,
      freeQuestionsUsed: 2, questionsRemaining: 1,
      percentUsed: 67,
      cycleEnd: "2026-05-23T00:00:00Z", nextChargeAt: null, canceledAt: null,
    } as const} />);
    expect(screen.getByText(/2 \/ 3 questions used/i)).toBeInTheDocument();
  });

  it("renders paid plan with tokens and ≈ questions", () => {
    render(<UsageMeter snapshot={{
      plan: { id: "pro", label: "Pro", priceCents: 3500, currency: "USD", tokensAllowance: 4_000_000, freeQuestions: 0, blurb: "" },
      status: "active",
      tokensUsed: 1_000_000, tokensAllowance: 4_000_000, tokensRemaining: 3_000_000,
      freeQuestionsUsed: 0, questionsRemaining: 1500,
      percentUsed: 25,
      cycleEnd: "2026-05-23T00:00:00Z", nextChargeAt: "2026-05-23T00:00:00Z", canceledAt: null,
    } as const} />);
    expect(screen.getByText(/1.0M \/ 4.0M tokens/i)).toBeInTheDocument();
    expect(screen.getByText(/~ 1,500 questions/i)).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run test, verify it fails**

Run: `pnpm vitest run tests/account/usage-meter.test.tsx`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement `components/account/usage-meter.tsx`**

```tsx
import type { BillingSnapshot } from "@/lib/billing/snapshot";

function fmtTokens(n: number): string {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + "M";
  if (n >= 1_000) return (n / 1_000).toFixed(1) + "k";
  return String(n);
}

function daysUntil(iso: string): number {
  const d = new Date(iso).getTime() - Date.now();
  return Math.max(0, Math.round(d / 86_400_000));
}

export function UsageMeter({ snapshot }: { snapshot: BillingSnapshot }) {
  const warn = snapshot.percentUsed >= 90;
  const barColor = warn ? "bg-[var(--color-magenta)]" : "bg-[var(--color-cyan)]";

  const main =
    snapshot.plan.id === "free"
      ? `${snapshot.freeQuestionsUsed} / ${snapshot.plan.freeQuestions} questions used`
      : `${fmtTokens(snapshot.tokensUsed)} / ${fmtTokens(snapshot.tokensAllowance)} tokens`;

  const sub =
    snapshot.plan.id === "free"
      ? `resets in ${daysUntil(snapshot.cycleEnd)}d`
      : `~ ${snapshot.questionsRemaining.toLocaleString()} questions · resets in ${daysUntil(snapshot.cycleEnd)}d`;

  return (
    <div className="space-y-2">
      <div className="flex items-baseline justify-between font-mono text-xs uppercase tracking-wider text-[var(--color-fg-3)]">
        <span>{main}</span>
        <span>{snapshot.percentUsed}%</span>
      </div>
      <div className="h-1.5 w-full bg-[var(--color-fg-4)]">
        <div className={`h-full ${barColor}`} style={{ width: `${Math.min(100, snapshot.percentUsed)}%` }} />
      </div>
      <div className="font-mono text-[10px] uppercase tracking-wider text-[var(--color-fg-3)]">{sub}</div>
    </div>
  );
}
```

- [ ] **Step 4: Run test, verify it passes**

Run: `pnpm vitest run tests/account/usage-meter.test.tsx`
Expected: 2 passed.

- [ ] **Step 5: Commit**

```bash
git add components/account/usage-meter.tsx tests/account/usage-meter.test.tsx
git commit -m "feat(account): UsageMeter component (tokens + estimated questions)"
```

---

### Task 14: `PlanCards` component

**Files:**
- Create: `components/account/plan-cards.tsx`

- [ ] **Step 1: Implement**

```tsx
"use client";
import { PLANS, type PlanId } from "@/lib/billing/plans";

interface Props {
  currentPlan: PlanId;
  onSelect: (plan: "starter" | "pro") => void;
  busy?: "starter" | "pro" | null;
  hideFree?: boolean;
}

export function PlanCards({ currentPlan, onSelect, busy, hideFree }: Props) {
  const entries = Object.values(PLANS).filter((p) => !(hideFree && p.id === "free"));
  return (
    <div className="grid gap-3 md:grid-cols-3">
      {entries.map((p) => {
        const isCurrent = p.id === currentPlan;
        const priceLabel = p.priceCents === 0 ? "$0" : `$${(p.priceCents / 100).toFixed(0)}/mo`;
        return (
          <div
            key={p.id}
            className={`border p-4 flex flex-col ${
              isCurrent ? "border-[var(--color-cyan)]" : "border-[var(--color-fg-4)]"
            }`}
          >
            <div className="font-mono text-xs uppercase tracking-[0.2em] text-[var(--color-cyan-dim)]">
              {p.label}
            </div>
            <div className="mt-2 text-xl text-[var(--color-fg-0)]">{priceLabel}</div>
            <p className="mt-2 text-xs text-[var(--color-fg-1)] min-h-[2.5em]">{p.blurb}</p>
            <div className="mt-4">
              {p.id === "free" ? (
                <span className="block text-center font-mono text-xs uppercase tracking-wider text-[var(--color-fg-3)]">
                  {isCurrent ? "Current" : "—"}
                </span>
              ) : (
                <button
                  type="button"
                  disabled={isCurrent || busy === p.id}
                  onClick={() => onSelect(p.id as "starter" | "pro")}
                  className="w-full border border-[var(--color-cyan-dim)] px-3 py-2 font-mono text-xs uppercase tracking-wider text-[var(--color-cyan-dim)] transition-colors hover:bg-[var(--color-cyan-dim)]/10 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {isCurrent ? "Current" : busy === p.id ? "Opening…" : currentPlan === "pro" ? "Downgrade" : "Upgrade"}
                </button>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add components/account/plan-cards.tsx
git commit -m "feat(account): PlanCards component — three-card plan picker"
```

---

### Task 15: `DeleteConfirm` generic modal

**Files:**
- Create: `components/account/delete-confirm.tsx`

- [ ] **Step 1: Implement**

```tsx
"use client";
import { useState, useTransition } from "react";

interface Props {
  open: boolean;
  onClose: () => void;
  title: string;
  description: string;
  expected: string;       // user must type this string exactly (case-insensitive)
  action: (confirm: string) => Promise<{ ok: boolean; error?: string } | void>;
}

export function DeleteConfirm({ open, onClose, title, description, expected, action }: Props) {
  const [input, setInput] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [pending, start] = useTransition();

  if (!open) return null;
  const matches = input.trim().toLowerCase() === expected.trim().toLowerCase();

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-[var(--color-bg-0)]/70 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md border border-[var(--color-magenta)] bg-[var(--color-bg-1)] p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="font-mono text-xs uppercase tracking-[0.2em] text-[var(--color-magenta)]">{title}</div>
        <p className="mt-3 text-sm text-[var(--color-fg-1)]">{description}</p>
        <p className="mt-3 font-mono text-xs uppercase tracking-wider text-[var(--color-fg-3)]">
          Type <span className="text-[var(--color-fg-0)]">{expected}</span> to confirm
        </p>
        <input
          autoFocus
          value={input}
          onChange={(e) => setInput(e.target.value)}
          className="mt-2 w-full bg-[var(--color-bg-0)] border border-[var(--color-fg-4)] px-3 py-2 text-sm text-[var(--color-fg-0)] focus:outline-none focus:border-[var(--color-magenta)]"
        />
        {err && <p className="mt-2 font-mono text-xs uppercase tracking-wider text-[var(--color-magenta)]">{err}</p>}
        <div className="mt-5 flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="border border-[var(--color-fg-4)] px-4 py-2 font-mono text-xs uppercase tracking-wider text-[var(--color-fg-3)] hover:bg-[var(--color-fg-4)]/10"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={!matches || pending}
            onClick={() => start(async () => {
              setErr(null);
              const res = (await action(input)) as { ok: boolean; error?: string } | undefined;
              if (res && res.ok === false) setErr(res.error ?? "Failed"); else onClose();
            })}
            className="bg-[var(--color-magenta)] text-[var(--color-bg-0)] px-4 py-2 font-mono text-xs uppercase tracking-wider disabled:opacity-30 disabled:cursor-not-allowed hover:opacity-90"
          >
            {pending ? "Working…" : "Delete"}
          </button>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add components/account/delete-confirm.tsx
git commit -m "feat(account): DeleteConfirm modal — typed-confirmation destructive actions"
```

---

### Task 16: `OrderHistory` component

**Files:**
- Create: `components/account/order-history.tsx`

- [ ] **Step 1: Implement**

```tsx
interface Order {
  id: string;
  plan: string;
  amount_cents: number;
  currency: string;
  state: string;
  created_at: string;
}

export function OrderHistory({ orders }: { orders: Order[] }) {
  if (orders.length === 0) {
    return (
      <div className="font-mono text-xs uppercase tracking-wider text-[var(--color-fg-3)]">
        No payments yet.
      </div>
    );
  }
  return (
    <ul className="divide-y divide-[var(--color-fg-4)]">
      {orders.map((o) => {
        const date = new Date(o.created_at).toLocaleDateString(undefined, {
          month: "short", day: "numeric", year: "numeric",
        });
        const amount = `$${(o.amount_cents / 100).toFixed(2)}`;
        const tone =
          o.state === "completed" ? "text-[var(--color-cyan)]"
          : o.state === "failed" ? "text-[var(--color-magenta)]"
          : "text-[var(--color-fg-3)]";
        return (
          <li key={o.id} className="py-2 flex items-center justify-between gap-3 text-xs">
            <span className="font-mono uppercase tracking-wider text-[var(--color-fg-3)]">{date}</span>
            <span className="text-[var(--color-fg-1)] capitalize">{o.plan}</span>
            <span className="font-mono text-[var(--color-fg-0)]">{amount}</span>
            <span className={`font-mono uppercase tracking-wider ${tone}`}>{o.state}</span>
          </li>
        );
      })}
    </ul>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add components/account/order-history.tsx
git commit -m "feat(account): OrderHistory component"
```

---

### Task 17: `AccountDrawer` — drawer shell + tabs + context

**Files:**
- Create: `components/account/account-drawer-context.tsx`
- Create: `components/account/account-drawer.tsx`

- [ ] **Step 1: Implement the context**

```tsx
"use client";
import { createContext, useContext, useState } from "react";

interface Ctx {
  open: boolean;
  tab: "profile" | "billing";
  openDrawer: (tab?: "profile" | "billing") => void;
  closeDrawer: () => void;
  setTab: (t: "profile" | "billing") => void;
}

const DrawerCtx = createContext<Ctx | null>(null);

export function AccountDrawerProvider({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<"profile" | "billing">("profile");
  return (
    <DrawerCtx.Provider value={{
      open, tab,
      openDrawer: (t) => { if (t) setTab(t); setOpen(true); },
      closeDrawer: () => setOpen(false),
      setTab,
    }}>
      {children}
    </DrawerCtx.Provider>
  );
}

export function useAccountDrawer(): Ctx {
  const v = useContext(DrawerCtx);
  if (!v) throw new Error("useAccountDrawer must be used within AccountDrawerProvider");
  return v;
}
```

- [ ] **Step 2: Implement the drawer shell**

```tsx
"use client";
import { useEffect } from "react";
import { X } from "lucide-react";
import { useAccountDrawer } from "./account-drawer-context";
import { SignOutButton } from "@/components/auth/sign-out-button";
import type { BillingSnapshot } from "@/lib/billing/snapshot";
import { ProfileTab } from "./profile-tab";
import { BillingTab } from "./billing-tab";

interface Props {
  user: { id: string; email: string | null; fullName: string | null; avatarUrl: string | null; provider: string; joined: string };
  snapshot: BillingSnapshot | null;
  orders: Array<{ id: string; plan: string; amount_cents: number; currency: string; state: string; created_at: string }>;
}

export function AccountDrawer({ user, snapshot, orders }: Props) {
  const { open, tab, setTab, closeDrawer } = useAccountDrawer();

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") closeDrawer(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, closeDrawer]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-40">
      <div className="absolute inset-0 bg-[var(--color-bg-0)]/60 backdrop-blur-sm" onClick={closeDrawer} />
      <aside className="absolute right-0 top-0 h-full w-full md:w-[420px] bg-[var(--color-bg-1)] border-l border-[var(--color-fg-4)] flex flex-col">
        <div className="flex items-center justify-between border-b border-[var(--color-fg-4)] px-4 py-3">
          <div className="flex gap-2">
            {(["profile", "billing"] as const).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setTab(t)}
                className={`font-mono text-xs uppercase tracking-wider px-2 py-1 border ${
                  tab === t
                    ? "border-[var(--color-cyan)] text-[var(--color-cyan)]"
                    : "border-transparent text-[var(--color-fg-3)] hover:text-[var(--color-fg-1)]"
                }`}
              >
                {t}
              </button>
            ))}
          </div>
          <button type="button" onClick={closeDrawer} aria-label="Close" className="text-[var(--color-fg-3)] hover:text-[var(--color-fg-0)]">
            <X size={18} strokeWidth={1.5} />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-5">
          {tab === "profile" ? <ProfileTab user={user} snapshot={snapshot} /> : <BillingTab snapshot={snapshot} orders={orders} />}
        </div>
        <div className="border-t border-[var(--color-fg-4)] p-4">
          <SignOutButton />
        </div>
      </aside>
    </div>
  );
}
```

- [ ] **Step 3: Commit (tabs will be added next task)**

```bash
git add components/account/account-drawer-context.tsx components/account/account-drawer.tsx
git commit -m "feat(account): AccountDrawer shell + context provider"
```

---

### Task 18: `ProfileTab`

**Files:**
- Create: `components/account/profile-tab.tsx`

- [ ] **Step 1: Implement**

```tsx
"use client";
import { useState } from "react";
import { DeleteConfirm } from "./delete-confirm";
import { UsageMeter } from "./usage-meter";
import type { BillingSnapshot } from "@/lib/billing/snapshot";
import { deleteAllChats, deleteAccount } from "@/app/actions/account";

interface Props {
  user: { id: string; email: string | null; fullName: string | null; avatarUrl: string | null; provider: string; joined: string };
  snapshot: BillingSnapshot | null;
}

export function ProfileTab({ user, snapshot }: Props) {
  const [modal, setModal] = useState<"none" | "chats" | "account">("none");

  return (
    <div className="space-y-6">
      <header className="flex items-center gap-3">
        {user.avatarUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={user.avatarUrl} alt="" width={48} height={48} className="rounded-full border border-[var(--color-fg-4)]" />
        ) : (
          <div className="w-12 h-12 rounded-full border border-[var(--color-fg-4)] bg-[var(--color-fg-4)]/20 flex items-center justify-center font-mono text-sm text-[var(--color-fg-1)]">
            {(user.fullName ?? user.email ?? "?").slice(0, 1).toUpperCase()}
          </div>
        )}
        <div className="min-w-0">
          <div className="text-[var(--color-fg-0)] truncate">{user.fullName ?? user.email ?? "—"}</div>
          <div className="font-mono text-xs text-[var(--color-fg-3)] truncate">{user.email ?? ""}</div>
        </div>
      </header>

      {snapshot && (
        <section>
          <div className="font-mono text-xs uppercase tracking-[0.2em] text-[var(--color-cyan-dim)] mb-3">Usage</div>
          <UsageMeter snapshot={snapshot} />
        </section>
      )}

      <section className="space-y-2">
        <div className="font-mono text-xs uppercase tracking-[0.2em] text-[var(--color-cyan-dim)]">Info</div>
        <Row label="User ID" value={user.id} mono />
        <Row label="Provider" value={user.provider} />
        <Row label="Joined" value={user.joined} last />
      </section>

      <section className="space-y-3 pt-3 border-t border-[var(--color-fg-4)]">
        <button
          type="button"
          onClick={() => setModal("chats")}
          className="w-full border border-[var(--color-magenta)] px-4 py-2 font-mono text-xs uppercase tracking-wider text-[var(--color-magenta)] hover:bg-[var(--color-magenta)]/10"
        >
          Delete all chats
        </button>
        <button
          type="button"
          onClick={() => setModal("account")}
          className="w-full bg-[var(--color-magenta)] text-[var(--color-bg-0)] px-4 py-2 font-mono text-xs uppercase tracking-wider hover:opacity-90"
        >
          Delete account
        </button>
      </section>

      <DeleteConfirm
        open={modal === "chats"}
        onClose={() => setModal("none")}
        title="Delete all chats"
        description="This permanently removes every conversation and message. This cannot be undone."
        expected="delete chats"
        action={async (t) => deleteAllChats(t)}
      />
      <DeleteConfirm
        open={modal === "account"}
        onClose={() => setModal("none")}
        title="Delete account"
        description="This cancels your subscription, deletes all chats and data, and removes your account. This cannot be undone."
        expected={user.email ?? ""}
        action={async (t) => deleteAccount(t)}
      />
    </div>
  );
}

function Row({ label, value, mono, last }: { label: string; value: string; mono?: boolean; last?: boolean }) {
  return (
    <div className={`flex items-center justify-between gap-3 py-2 ${last ? "" : "border-b border-[var(--color-fg-4)]"}`}>
      <dt className="font-mono text-xs uppercase tracking-wider text-[var(--color-fg-3)] shrink-0">{label}</dt>
      <dd className={`text-[var(--color-fg-1)] text-sm text-right truncate min-w-0 ${mono ? "font-mono text-xs" : ""}`} title={value}>
        {value}
      </dd>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add components/account/profile-tab.tsx
git commit -m "feat(account): ProfileTab — info, usage meter, delete actions"
```

---

### Task 19: `BillingTab`

**Files:**
- Create: `components/account/billing-tab.tsx`

- [ ] **Step 1: Implement**

```tsx
"use client";
import { useState, useTransition } from "react";
import { UsageMeter } from "./usage-meter";
import { PlanCards } from "./plan-cards";
import { OrderHistory } from "./order-history";
import type { BillingSnapshot } from "@/lib/billing/snapshot";
import type { PlanId } from "@/lib/billing/plans";

interface Props {
  snapshot: BillingSnapshot | null;
  orders: Array<{ id: string; plan: string; amount_cents: number; currency: string; state: string; created_at: string }>;
}

export function BillingTab({ snapshot, orders }: Props) {
  const [busy, setBusy] = useState<"starter" | "pro" | null>(null);
  const [cancelling, startCancel] = useTransition();
  const [err, setErr] = useState<string | null>(null);

  if (!snapshot) {
    return <div className="text-[var(--color-fg-3)] font-mono text-xs uppercase tracking-wider">No billing data.</div>;
  }

  const checkout = async (plan: "starter" | "pro") => {
    setBusy(plan); setErr(null);
    try {
      const res = await fetch("/api/billing/checkout", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan }),
      });
      if (!res.ok) { setErr(`Checkout failed (${res.status})`); return; }
      const { publicId } = (await res.json()) as { publicId: string };
      await openRevolutCheckout(publicId);
    } catch (e) {
      setErr((e as Error).message);
    } finally {
      setBusy(null);
    }
  };

  const cancel = () => startCancel(async () => {
    setErr(null);
    const res = await fetch("/api/billing/cancel", { method: "POST" });
    if (!res.ok) setErr(`Cancel failed (${res.status})`);
    else window.location.reload();
  });

  const status = snapshot.status;
  return (
    <div className="space-y-6">
      <section className="border border-[var(--color-fg-4)] p-4 space-y-3">
        <div className="flex items-baseline justify-between">
          <div className="font-mono text-xs uppercase tracking-[0.2em] text-[var(--color-cyan-dim)]">Current plan</div>
          <StatusPill status={status} />
        </div>
        <div className="text-xl text-[var(--color-fg-0)]">
          {snapshot.plan.label}
          <span className="text-[var(--color-fg-3)]"> · </span>
          {snapshot.plan.priceCents === 0 ? "Free" : `$${(snapshot.plan.priceCents / 100).toFixed(0)}/mo`}
        </div>
        <UsageMeter snapshot={snapshot} />
        {snapshot.nextChargeAt && status === "active" && snapshot.plan.id !== "free" && (
          <div className="font-mono text-[10px] uppercase tracking-wider text-[var(--color-fg-3)]">
            Next charge: {new Date(snapshot.nextChargeAt).toLocaleDateString()}
          </div>
        )}
        {status === "canceled" && (
          <div className="font-mono text-[10px] uppercase tracking-wider text-[var(--color-fg-3)]">
            Access until {new Date(snapshot.cycleEnd).toLocaleDateString()}
          </div>
        )}
      </section>

      <section>
        <div className="font-mono text-xs uppercase tracking-[0.2em] text-[var(--color-cyan-dim)] mb-3">Change plan</div>
        <PlanCards currentPlan={snapshot.plan.id as PlanId} onSelect={checkout} busy={busy} />
      </section>

      {snapshot.plan.id !== "free" && status === "active" && (
        <button
          type="button"
          onClick={cancel}
          disabled={cancelling}
          className="font-mono text-xs uppercase tracking-wider text-[var(--color-fg-3)] underline hover:text-[var(--color-magenta)]"
        >
          {cancelling ? "Cancelling…" : "Cancel subscription"}
        </button>
      )}

      {err && <div className="font-mono text-xs uppercase tracking-wider text-[var(--color-magenta)]">{err}</div>}

      <section>
        <div className="font-mono text-xs uppercase tracking-[0.2em] text-[var(--color-cyan-dim)] mb-3">Payments</div>
        <OrderHistory orders={orders} />
      </section>
    </div>
  );
}

function StatusPill({ status }: { status: "active" | "past_due" | "canceled" }) {
  const cls =
    status === "active" ? "border-[var(--color-cyan-dim)] text-[var(--color-cyan-dim)]"
    : status === "canceled" ? "border-[var(--color-fg-3)] text-[var(--color-fg-3)]"
    : "border-[var(--color-magenta)] text-[var(--color-magenta)]";
  return (
    <span className={`inline-block border px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider ${cls}`}>
      {status}
    </span>
  );
}

// Lazy-loads RevolutCheckout.js at first checkout click.
declare global {
  interface Window { RevolutCheckout?: (publicId: string, mode: "sandbox" | "prod") => Promise<{ payWithPopup: (opts: Record<string, unknown>) => void }>; }
}

async function openRevolutCheckout(publicId: string): Promise<void> {
  if (typeof window === "undefined") return;
  if (!window.RevolutCheckout) {
    await new Promise<void>((resolve, reject) => {
      const s = document.createElement("script");
      const isProd = process.env.NEXT_PUBLIC_REVOLUT_ENV === "production";
      s.src = isProd
        ? "https://merchant.revolut.com/embed.js"
        : "https://sandbox-merchant.revolut.com/embed.js";
      s.async = true;
      s.onload = () => resolve();
      s.onerror = () => reject(new Error("Failed to load Revolut Checkout"));
      document.head.appendChild(s);
    });
  }
  const mode = (process.env.NEXT_PUBLIC_REVOLUT_ENV === "production" ? "prod" : "sandbox") as "sandbox" | "prod";
  const instance = await window.RevolutCheckout!(publicId, mode);
  instance.payWithPopup({
    savePaymentMethodFor: "customer",
    onSuccess() { window.location.reload(); },
    onError(msg: unknown) { console.error("Revolut error", msg); },
  });
}
```

- [ ] **Step 2: Add `NEXT_PUBLIC_REVOLUT_ENV` to `.env.example`**

Open `.env.example`, under the billing section add one more line:

```bash
NEXT_PUBLIC_REVOLUT_ENV=sandbox                           # Mirrors REVOLUT_ENV for the browser SDK (public)
```

- [ ] **Step 3: Commit**

```bash
git add components/account/billing-tab.tsx .env.example
git commit -m "feat(account): BillingTab — plan cards, Revolut Checkout, cancel, order history"
```

---

### Task 20: `UpgradeModal` (triggered by 402)

**Files:**
- Create: `lib/billing/revolut-client.ts`
- Create: `components/account/upgrade-modal.tsx`
- Modify: `components/account/billing-tab.tsx`

- [ ] **Step 1: Extract the Revolut Checkout loader into a shared client module**

`lib/billing/revolut-client.ts`:

```ts
"use client";

declare global {
  interface Window {
    RevolutCheckout?: (publicId: string, mode: "sandbox" | "prod") => Promise<{
      payWithPopup: (opts: Record<string, unknown>) => void;
    }>;
  }
}

export async function openRevolutCheckout(
  publicId: string,
  onSuccess: () => void,
  onError?: (e: unknown) => void,
): Promise<void> {
  if (typeof window === "undefined") return;
  if (!window.RevolutCheckout) {
    await new Promise<void>((resolve, reject) => {
      const s = document.createElement("script");
      const isProd = process.env.NEXT_PUBLIC_REVOLUT_ENV === "production";
      s.src = isProd
        ? "https://merchant.revolut.com/embed.js"
        : "https://sandbox-merchant.revolut.com/embed.js";
      s.async = true;
      s.onload = () => resolve();
      s.onerror = () => reject(new Error("Failed to load Revolut Checkout"));
      document.head.appendChild(s);
    });
  }
  const mode = (process.env.NEXT_PUBLIC_REVOLUT_ENV === "production" ? "prod" : "sandbox") as "sandbox" | "prod";
  const inst = await window.RevolutCheckout!(publicId, mode);
  inst.payWithPopup({
    savePaymentMethodFor: "customer",
    onSuccess,
    onError: onError ?? ((e: unknown) => console.error("Revolut error", e)),
  });
}
```

- [ ] **Step 2: Refactor `components/account/billing-tab.tsx` to import the shared loader**

At the top of the file, add:

```ts
import { openRevolutCheckout } from "@/lib/billing/revolut-client";
```

Delete the inline `declare global { interface Window { RevolutCheckout?: … } }` block and the inline `async function openRevolutCheckout(publicId: string)` function at the bottom of the file.

Replace the existing `await openRevolutCheckout(publicId);` call inside `checkout()` with:

```ts
await openRevolutCheckout(publicId, () => window.location.reload());
```

- [ ] **Step 3: Implement `components/account/upgrade-modal.tsx`**

```tsx
"use client";
import { useState } from "react";
import { PlanCards } from "./plan-cards";
import { openRevolutCheckout } from "@/lib/billing/revolut-client";
import type { PlanId } from "@/lib/billing/plans";

interface Props {
  open: boolean;
  onClose: () => void;
  reason: "free_quota_exhausted" | "tokens_exhausted" | "past_due";
  currentPlan: PlanId;
}

const TITLES: Record<Props["reason"], string> = {
  free_quota_exhausted: "You've used your 3 free questions this month",
  tokens_exhausted:     "You've used your monthly allowance",
  past_due:             "Your last payment didn't go through",
};

export function UpgradeModal({ open, onClose, reason, currentPlan }: Props) {
  const [busy, setBusy] = useState<"starter" | "pro" | null>(null);
  if (!open) return null;

  const checkout = async (plan: "starter" | "pro") => {
    setBusy(plan);
    const res = await fetch("/api/billing/checkout", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ plan }),
    });
    if (!res.ok) { setBusy(null); return; }
    const { publicId } = (await res.json()) as { publicId: string };
    await openRevolutCheckout(
      publicId,
      () => window.location.reload(),
      () => setBusy(null),
    );
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-[var(--color-bg-0)]/70 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="w-full max-w-xl border border-[var(--color-fg-4)] bg-[var(--color-bg-1)] p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="font-mono text-xs uppercase tracking-[0.2em] text-[var(--color-cyan-dim)]">
          {TITLES[reason]}
        </div>
        <p className="mt-3 text-sm text-[var(--color-fg-1)]">
          {reason === "past_due"
            ? "Update your payment to resume where you left off."
            : "Pick a plan to keep going."}
        </p>
        <div className="mt-5">
          <PlanCards currentPlan={currentPlan} onSelect={checkout} busy={busy} hideFree />
        </div>
        <div className="mt-5 text-right">
          <button
            type="button"
            onClick={onClose}
            className="font-mono text-xs uppercase tracking-wider text-[var(--color-fg-3)] hover:text-[var(--color-fg-0)]"
          >
            Not now
          </button>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Build**

Run: `pnpm build`
Expected: no TS errors.

- [ ] **Step 5: Commit**

```bash
git add lib/billing/revolut-client.ts components/account/upgrade-modal.tsx components/account/billing-tab.tsx
git commit -m "feat(account): UpgradeModal + shared Revolut Checkout loader"
```

---

### Task 21: `ProfileChip` sidebar component

**Files:**
- Create: `components/auth/profile-chip.tsx`

- [ ] **Step 1: Implement**

```tsx
"use client";
import { useAccountDrawer } from "@/components/account/account-drawer-context";

interface Props {
  user: { fullName: string | null; email: string | null; avatarUrl: string | null };
  planLabel: string;
  percentUsed: number;
}

export function ProfileChip({ user, planLabel, percentUsed }: Props) {
  const { openDrawer } = useAccountDrawer();
  const display = user.fullName ?? user.email ?? "Account";
  const initial = (user.fullName ?? user.email ?? "?").slice(0, 1).toUpperCase();

  return (
    <button
      type="button"
      onClick={() => openDrawer("profile")}
      className="w-full flex items-center gap-3 px-3 py-3 border-t border-[var(--color-fg-4)] hover:bg-[var(--color-fg-4)]/10 text-left"
      aria-label="Open account"
    >
      {user.avatarUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={user.avatarUrl} alt="" width={28} height={28} className="rounded-full border border-[var(--color-fg-4)]" />
      ) : (
        <div className="w-7 h-7 rounded-full border border-[var(--color-fg-4)] bg-[var(--color-fg-4)]/20 flex items-center justify-center font-mono text-xs text-[var(--color-fg-1)]">
          {initial}
        </div>
      )}
      <div className="min-w-0 flex-1">
        <div className="text-sm text-[var(--color-fg-0)] truncate">{display}</div>
        <div className="font-mono text-[10px] uppercase tracking-wider text-[var(--color-fg-3)] truncate">
          {planLabel} · {percentUsed}% used
        </div>
      </div>
    </button>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add components/auth/profile-chip.tsx
git commit -m "feat(auth): ProfileChip — sidebar trigger for the account drawer"
```

---

### Task 22: Wire the drawer into `/ask` layout

**Files:**
- Modify: `app/[locale]/ask/layout.tsx`
- Modify: `components/ask/conversation-rail.tsx`

- [ ] **Step 1: Update `app/[locale]/ask/layout.tsx`**

Replace the file with:

```tsx
import { redirect } from "next/navigation";
import { getSsrClient, getServiceClient } from "@/lib/supabase-server";
import { ConversationRail } from "@/components/ask/conversation-rail";
import { KillSwitchBanner } from "@/components/ask/kill-switch-banner";
import { AccountDrawerProvider } from "@/components/account/account-drawer-context";
import { AccountDrawer } from "@/components/account/account-drawer";
import { loadBillingSnapshot } from "@/app/actions/account";

export default async function AskLayout({
  children, params,
}: { children: React.ReactNode; params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const db = await getSsrClient();
  const { data: { user } } = await db.auth.getUser();
  if (!user) redirect(`/${locale}/sign-in?next=/${locale}/ask`);

  const [{ data: convs }, snapshot, { data: orders }] = await Promise.all([
    db.from("ask_conversations").select("id,title,updated_at").order("updated_at", { ascending: false }).limit(20),
    loadBillingSnapshot(),
    getServiceClient().from("billing_orders")
      .select("id,plan,amount_cents,currency,state,created_at")
      .eq("user_id", user.id).order("created_at", { ascending: false }).limit(20),
  ]);

  const userPayload = {
    id: user.id,
    email: user.email ?? null,
    fullName: (user.user_metadata?.full_name as string | undefined) ?? null,
    avatarUrl: (user.user_metadata?.avatar_url as string | undefined) ?? (user.user_metadata?.picture as string | undefined) ?? null,
    provider: (user.app_metadata?.provider as string | undefined) ?? "email",
    joined: user.created_at
      ? new Date(user.created_at).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" })
      : "—",
  };

  const enabled = process.env.ASK_ENABLED === "true";
  return (
    <AccountDrawerProvider>
      <div className="flex min-h-[calc(100vh-4rem)]">
        <ConversationRail
          locale={locale}
          conversations={convs ?? []}
          user={{ fullName: userPayload.fullName, email: userPayload.email, avatarUrl: userPayload.avatarUrl }}
          planLabel={snapshot?.plan.label ?? "Free"}
          percentUsed={snapshot?.percentUsed ?? 0}
        />
        <main className="flex-1 flex flex-col max-w-4xl mx-auto w-full">
          {!enabled && <KillSwitchBanner />}
          {children}
        </main>
      </div>
      <AccountDrawer user={userPayload} snapshot={snapshot} orders={orders ?? []} />
    </AccountDrawerProvider>
  );
}
```

- [ ] **Step 2: Update `components/ask/conversation-rail.tsx`**

Replace the existing file with:

```tsx
import Link from "next/link";
import { ProfileChip } from "@/components/auth/profile-chip";

interface Props {
  locale: string;
  conversations: Array<{ id: string; title: string | null; updated_at: string }>;
  activeId?: string;
  user: { fullName: string | null; email: string | null; avatarUrl: string | null };
  planLabel: string;
  percentUsed: number;
}

export function ConversationRail({ locale, conversations, activeId, user, planLabel, percentUsed }: Props) {
  return (
    <aside className="w-64 border-r border-[var(--color-fg-4)] hidden md:flex flex-col shrink-0">
      <div className="p-3 border-b border-[var(--color-fg-4)]">
        <Link
          href={`/${locale}/ask`}
          className="block w-full text-center border border-[var(--color-cyan-dim)] px-3 py-2 font-mono text-xs uppercase tracking-wider text-[var(--color-cyan-dim)] transition-colors hover:bg-[var(--color-cyan-dim)]/10"
        >
          + New Chat
        </Link>
      </div>
      <ul className="flex-1 overflow-y-auto py-2">
        {conversations.length === 0 && (
          <li className="px-4 py-3 font-mono text-xs uppercase tracking-wider text-[var(--color-fg-3)]">
            No chats yet
          </li>
        )}
        {conversations.map((c) => {
          const active = c.id === activeId;
          return (
            <li key={c.id}>
              <Link
                href={`/${locale}/ask/${c.id}`}
                className={`block px-4 py-2.5 transition-colors border-l-2 ${
                  active
                    ? "border-[var(--color-cyan)] bg-[var(--color-fg-4)]/15"
                    : "border-transparent hover:border-[var(--color-fg-4)] hover:bg-[var(--color-fg-4)]/10"
                }`}
              >
                <div className="font-mono text-[10px] uppercase tracking-wider text-[var(--color-fg-3)]">
                  {formatRelative(c.updated_at)}
                </div>
                <div className={`mt-1 text-sm truncate ${active ? "text-[var(--color-fg-0)]" : "text-[var(--color-fg-1)]"}`}>
                  {c.title ?? "Untitled"}
                </div>
              </Link>
            </li>
          );
        })}
      </ul>
      <ProfileChip user={user} planLabel={planLabel} percentUsed={percentUsed} />
    </aside>
  );
}

function formatRelative(iso: string): string {
  const then = new Date(iso).getTime();
  const now = Date.now();
  const diff = Math.max(0, now - then);
  const m = Math.floor(diff / 60_000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d < 7) return `${d}d ago`;
  return new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric" });
}
```

- [ ] **Step 3: Run build**

Run: `pnpm build`
Expected: no TS errors.

- [ ] **Step 4: Commit**

```bash
git add app/[locale]/ask/layout.tsx components/ask/conversation-rail.tsx
git commit -m "feat(ask): mount AccountDrawer + ProfileChip in /ask layout"
```

---

### Task 23: Hook 402 responses in `StreamingMessage` → UpgradeModal

**Files:**
- Modify: `components/ask/streaming-message.tsx`
- Modify: `components/ask/chat-screen.tsx`

- [ ] **Step 1: Read the current `components/ask/streaming-message.tsx` and identify the `fetch("/api/ask/stream", …)` call.** (Open the file; locate the block that handles non-OK responses.)

- [ ] **Step 2: Add 402 detection.**

In `StreamingMessage`, where the `fetch` response is checked, before the existing error handling add:

```ts
if (res.status === 402) {
  const body = await res.json().catch(() => ({ reason: "tokens_exhausted" }));
  onQuotaExhausted?.(body.reason as "free_quota_exhausted" | "tokens_exhausted" | "past_due");
  onSettled(conversationId ?? "");
  return;
}
```

Add the prop to the component's interface:

```ts
onQuotaExhausted?: (reason: "free_quota_exhausted" | "tokens_exhausted" | "past_due") => void;
```

- [ ] **Step 3: Update `chat-screen.tsx` to thread the prop + render `UpgradeModal`.**

Near the top of `components/ask/chat-screen.tsx`, add:

```tsx
import { UpgradeModal } from "@/components/account/upgrade-modal";
```

Add state:

```tsx
const [quotaModal, setQuotaModal] = useState<null | "free_quota_exhausted" | "tokens_exhausted" | "past_due">(null);
```

Add `onQuotaExhausted={setQuotaModal}` to the existing `<StreamingMessage … />` invocation.

At the bottom of the JSX tree (just before the closing `</div>` of the outer container), add:

```tsx
<UpgradeModal
  open={quotaModal !== null}
  onClose={() => setQuotaModal(null)}
  reason={quotaModal ?? "tokens_exhausted"}
  currentPlan={"free"}
/>
```

(We use "free" as a safe default; the real current plan is already shown in the drawer — this modal's purpose is just upsell.)

- [ ] **Step 4: Build + smoke test**

Run: `pnpm build && pnpm test`
Expected: no TS errors, all tests pass.

- [ ] **Step 5: Commit**

```bash
git add components/ask/streaming-message.tsx components/ask/chat-screen.tsx
git commit -m "feat(ask): show UpgradeModal on 402 quota responses from /ask/stream"
```

---

### Task 24: Replace `/account` page with a redirect

**Files:**
- Modify: `app/[locale]/account/page.tsx`

- [ ] **Step 1: Replace the file entirely with a redirect**

```tsx
import { redirect } from "next/navigation";

export default async function AccountPage({
  params,
}: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  redirect(`/${locale}/ask?drawer=profile`);
}
```

- [ ] **Step 2: Add a small client-side hook so `?drawer=profile` actually opens the drawer**

Modify `app/[locale]/ask/layout.tsx` — after the `AccountDrawerProvider` opens, add a tiny client component `components/account/open-drawer-from-query.tsx`:

Create `components/account/open-drawer-from-query.tsx`:

```tsx
"use client";
import { useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { useAccountDrawer } from "./account-drawer-context";

export function OpenDrawerFromQuery() {
  const sp = useSearchParams();
  const { openDrawer } = useAccountDrawer();
  useEffect(() => {
    const tab = sp.get("drawer");
    if (tab === "profile" || tab === "billing") openDrawer(tab);
  }, [sp, openDrawer]);
  return null;
}
```

Mount it inside `AccountDrawerProvider` in `layout.tsx`:

```tsx
<AccountDrawerProvider>
  <OpenDrawerFromQuery />
  {/* …existing markup… */}
</AccountDrawerProvider>
```

And add the import at the top of `layout.tsx`:

```tsx
import { OpenDrawerFromQuery } from "@/components/account/open-drawer-from-query";
```

- [ ] **Step 3: Commit**

```bash
git add app/[locale]/account/page.tsx components/account/open-drawer-from-query.tsx app/[locale]/ask/layout.tsx
git commit -m "refactor(account): /account redirects into the /ask drawer"
```

---

### Task 25: Full-suite verification + manual smoke

**Files:** none

- [ ] **Step 1: Run the full test suite**

Run: `pnpm test`
Expected: all tests green.

- [ ] **Step 2: Run the build**

Run: `pnpm build`
Expected: no errors.

- [ ] **Step 3: Manual smoke test locally**

1. `pnpm dev` and open `http://localhost:3000/en/ask`.
2. Sign in via Google; verify the profile chip appears at the bottom of the sidebar with avatar + name.
3. Click the chip → drawer slides in from the right; Profile tab shows user info, usage meter at 0/3, delete buttons.
4. Switch to Billing tab → three plan cards, "Free" marked current, no cancel button, empty order history.
5. Send 3 questions on the free plan — 4th should return 402 and open the Upgrade modal.
6. (Sandbox keys must be set.) Click "Upgrade to Starter" → Revolut sandbox popup appears. Use test card `4111 1111 1111 1111`, any future expiry, any CVC → confirm.
7. Webhook (if running locally, use `supabase functions serve` or ngrok to Revolut) should fire `ORDER_COMPLETED`; reload drawer → plan shows Starter, allowance 1.5M.
8. Delete all chats: types "delete chats" → conversation list clears.
9. Delete account: types email → signed out, redirected home.

- [ ] **Step 4: Commit the plan completion marker (optional)**

```bash
git commit --allow-empty -m "chore(billing): v1 profile+tokens+billing feature complete"
```

---

## Self-Review Notes

- Spec coverage verified: §3 pricing → Task 2; §4 data model → Task 1; §5 quota → Task 6; §6 UI → Tasks 13-22; §7 Revolut → Tasks 3-4, 9, 10, 12; §8 deletion → Task 8; §9 file manifest → all tasks.
- No `TODO`/`TBD`/placeholders in any step.
- Naming is consistent: `PlanId`, `BillingSnapshot`, `applyWebhookEvent`, `openRevolutCheckout`, `loadBillingSnapshot`, `deleteAllChats`, `deleteAccount` used identically across tasks.
- `NEXT_PUBLIC_REVOLUT_ENV` is documented in Task 19 (the only public env var the browser needs) alongside the server-side `REVOLUT_ENV`.
- The `handle_new_user_billing` trigger is `security definer` (required to insert into a public table on behalf of the auth schema).
