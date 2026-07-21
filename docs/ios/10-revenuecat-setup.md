# 10 — RevenueCat + App Store subscriptions setup runbook

Start-to-end setup for **Apple In-App Purchase subscriptions on iOS, brokered by
RevenueCat**, reconciled into the same `public.user_billing` table the web
(Revolut) billing already writes. This is the **dual-provider** design: Revolut
stays the web checkout; Apple IAP (via RevenueCat) is the iOS checkout; both land
in one `user_billing` row so a plan bought on either platform is honored on both.

> Audience split. Steps tagged **`[USER]`** are console/account actions only the
> Apple-account owner can do (agreements, banking, 2FA, product creation) — I
> cannot and should not do these for you. Steps tagged **`[CODE]`** are done by
> the executor sessions running the `P10-*` prompts. At the end you hand three
> **non-secret** values to the code side; every real secret you place into env
> yourself.

Related: `06-backend-changes.md` (Supabase/OAuth config), `08-risk-register.md`
R7 (reframed by P10-4), `prompts/P10-1..P10-4`.

---

## 0. Prerequisites

- Apple Developer Program membership, and you are the **Account Holder** (or an
  Admin who can sign agreements).
- The app's bundle id is registered and matches the shipping build
  (`ios/project.yml` → the `PhysicsExplained` target bundle id).
- Sign in with Apple already configured (P5 / `06-backend-changes.md` §6) — Apple
  requires it whenever any third-party sign-in exists, unrelated to IAP but a
  hard co-requirement for App Review.

---

## 1. App Store Connect — `[USER]`

### 1.1 Agreements, banking, tax
1. App Store Connect → **Business** → **Agreements**: sign the **Paid
   Applications** agreement. Until this is *Active*, no product will load in the
   app and every `getOfferings` returns empty.
2. Add **Bank Account** and complete **Tax** forms. (Sandbox purchases work
   before this clears, but products stay in "Missing Metadata" until it does.)

### 1.2 Create the subscription group and products
1. Your app → **Monetization → Subscriptions** → create a group named
   **`Physics Explained`** (the group is the "only one active at a time" set —
   Starter and Pro belong in the same group so a user upgrades/downgrades between
   them, never holds both).
2. Create two **auto-renewable** subscriptions in that group:

   | Reference name | Product ID | Duration | Price |
   |---|---|---|---|
   | Starter Monthly | `com.physicsexplained.app.starter.monthly` | 1 month | **$5.99** |
   | Pro Monthly | `com.physicsexplained.app.pro.monthly` | 1 month | **$19.99** |

   > The web tiers are $6 / $20. Apple's nearest standard prices are $5.99 /
   > $19.99 — use those unless you deliberately want a round-number custom price.
   > The exact price does **not** need to match the web; token allowances do
   > (handled in code, see §4). Confirm the final numbers here — they are the
   > source of truth the paywall displays via RevenueCat.
3. For each product fill: **localized display name** + **description** (App Review
   reads these), and a **subscription review screenshot** (a screenshot of the
   in-app paywall; you can supply it after the paywall is built in P10-2).
4. Optional but recommended: a **7-day free trial** introductory offer on each —
   decide now, it changes the paywall copy.

### 1.3 In-App Purchase Key for RevenueCat
1. App Store Connect → **Users and Access → Integrations → In-App Purchase** →
   generate an **In-App Purchase Key** (`.p8`). Download it (one chance) and note
   the **Key ID** and your **Issuer ID**.
   - This is what RevenueCat uses to validate transactions with the App Store
     Server API. (The legacy "App-Specific Shared Secret" still works but the
     `.p8` key is the current path.)

---

## 2. RevenueCat dashboard — `[USER]`

1. Create a RevenueCat **Project** (e.g. "Physics Explained").
2. Add an **App** → platform **App Store** → enter the **bundle id**; upload the
   **In-App Purchase Key** `.p8` + Key ID + Issuer ID from §1.3.
3. **Products** → import/add both product IDs from §1.2.
4. **Entitlements** → create two:
   - `starter` → attach product `com.physicsexplained.app.starter.monthly`
   - `pro` → attach product `com.physicsexplained.app.pro.monthly`

   > Two entitlements (not one shared "premium") because the two tiers grant
   > *different token allowances*; the webhook maps whichever entitlement is
   > active → the matching `user_billing.plan`. Keep the entitlement identifiers
   > exactly `starter` and `pro` — they are string-matched in code (`PlanId`).
5. **Offerings** → create the **default** offering "`default`" with two
   **packages**: a Monthly package pointing at Starter and one at Pro. The
   paywall renders the current offering's packages in order, so order them
   Starter-then-Pro.
6. **API keys** (Project settings → API keys):
   - Copy the **Apple public SDK key** (`appl_…`). This ships in the app — it is
     publishable, not a secret. → hand to code side (§5).
   - Copy the **secret API key** (`sk_…`) if you want server-side reconciliation
     fallback. This is a **secret** — env only.
7. **Integrations → Webhooks** → add a webhook:
   - **URL:** `https://<your-site-origin>/api/billing/revenuecat`
   - **Authorization header value:** generate a long random token (e.g.
     `openssl rand -hex 32`) and paste it. RevenueCat sends it verbatim in the
     `Authorization` request header; our route rejects anything else with 401.
     This token is a **secret** — you also put it in web env as
     `REVENUECAT_WEBHOOK_AUTH` (§5).
   - **Environment:** send both **Sandbox** and **Production** events (the route
     branches on `event.app.environment`; sandbox events must never touch a
     production `user_billing` row — see P10-1).

---

## 3. Supabase / project ref

No new Supabase config is required beyond the existing project
(`cpcgkkedcfbnlfpzutrc`). The webhook writes with the **service-role** key that
the web already has (`SUPABASE_SERVICE_ROLE_KEY`). The migration
`0015_billing_provider.sql` (P10-1) is applied the same way as the existing
billing migrations.

---

## 4. Plan / token-allowance mapping — `[CODE]`, for reference

The webhook (P10-1) reconciles like this:

| RevenueCat active entitlement | `user_billing.plan` | `tokens_allowance` (parity w/ `lib/billing/plans.ts`) | `provider` |
|---|---|---|---|
| `pro` | `pro` | 2,300,000 | `apple` |
| `starter` | `starter` | 750,000 | `apple` |
| none active (expired/refunded) | `free` | 0 | `apple` (or leave `provider` as-is once free) |

Apple owns renewal for `provider='apple'` rows, so the Revolut cron
(`billing-renew`) must skip them (P10-1 task).

---

## 5. Hand-off values (you → code side)

After §1–§2, share these **non-secret** values (they get baked into code /
committed config):

- RevenueCat **Apple public SDK key** (`appl_…`)
- The two **product IDs** (`com.physicsexplained.app.starter.monthly`,
  `com.physicsexplained.app.pro.monthly`)
- The two **entitlement IDs** (`starter`, `pro`)

Place these **secrets** yourself (never share them with the assistant):

| Secret | Where |
|---|---|
| `REVENUECAT_WEBHOOK_AUTH` (webhook Authorization token from §2.7) | web env: `.env.local` + Vercel |
| `REVENUECAT_SECRET_KEY` (`sk_…`, only if using server reconcile fallback) | web env: `.env.local` + Vercel |
| RevenueCat Apple public SDK key | also add to `App/PhysicsConfig.plist` as `RevenueCatPublicKey` (gitignored; the example plist documents it) |

---

## 6. Testing path — `[USER]` + `[CODE]`

1. **Local (Simulator/device, no real charges):** the executor adds a
   **StoreKit Configuration file** to the scheme (P10-2) so offerings load
   without App Store Connect round-trips. Verify the paywall lists two plans and
   a purchase flips the entitlement.
2. **Sandbox:** App Store Connect → **Users and Access → Sandbox → Testers** →
   create a sandbox Apple ID. On device, sign that tester into
   **Settings → App Store → Sandbox Account**. A sandbox monthly renews fast
   (every few minutes) — good for exercising RENEWAL/EXPIRATION webhooks.
3. **Webhook round-trip:** buy in sandbox → within seconds the RevenueCat webhook
   hits `/api/billing/revenuecat` → the tester's `user_billing` row shows
   `plan='pro', provider='apple', status='active'`. Confirm via service-role SQL.
4. **Cross-platform:** sign the same account into the **web** profile drawer →
   plan reads `pro` with the "Managed via Apple" note (P10-1 web change).
5. **TestFlight:** sandbox behavior carries into TestFlight builds; do one full
   purchase + **Restore Purchases** pass before submitting for review.

---

## 7. What App Review will check (fed into P10-4 review notes)

- IAP present → the binary must actually offer the subscription and **Restore
  Purchases** must work.
- Auto-renewable subscription **required metadata in the binary**: title, length,
  price, and functional **Terms (EULA)** + **Privacy Policy** links near the
  paywall (legal links are allowed; payment links out are not — R7 still bans
  external payment routes from inside the app).
- Sign in with Apple present (co-requirement) and account deletion present
  (5.1.1(v)) — both already shipped.
