# Paywall copy + App Store Connect subscription metadata

Single source of truth for the strings shown on the iOS paywall **and** the
localized metadata you paste into App Store Connect. Keep the two in sync — App
Review compares the binary's paywall against the product metadata.

Prices shown here are the local StoreKit-fixture defaults ($5.99 / $19.99). The
**live** paywall reads price + period from the `StoreProduct` (RevenueCat), so if
you set a different price in App Store Connect the paywall updates itself — do not
hardcode prices in the app.

---

## 1. App Store Connect — per product (copy verbatim)

**Subscription group:** `Physics Explained` · **Group reference name:** `Physics Explained`

### Starter
- **Product ID:** `com.physicsexplained.app.starter.monthly`
- **Reference name:** `Starter Monthly`
- **Duration:** 1 Month · **Price:** $5.99 (nearest tier to the web $6)
- **Display name (localization en-US):** `Starter`
- **Description (en-US):** `750k tokens a month — about 375 questions with the AI physics tutor. Auto-renews monthly.`

### Pro
- **Product ID:** `com.physicsexplained.app.pro.monthly`
- **Reference name:** `Pro Monthly`
- **Duration:** 1 Month · **Price:** $19.99 (nearest tier to the web $20)
- **Display name (localization en-US):** `Pro`
- **Description (en-US):** `2.3M tokens a month — about 1,150 questions with the AI physics tutor. Auto-renews monthly.`

> Optional intro offer: a **7-day free trial** on either product is a strong
> conversion lever. If you add one in ASC, uncomment the trial line in the paywall
> footer (§2) and mirror it into `Subscriptions.storekit` (`introductoryOffer`).

---

## 2. Paywall screen strings (P10-2 `PaywallView`)

| Slot | Copy |
|---|---|
| Eyebrow | `UPGRADE` |
| Title | `Keep asking.` |
| Subtitle | `Your free questions renew monthly. Upgrade for room to actually work through a topic.` |
| Starter card — name | `Starter` |
| Starter card — value | `750k tokens / month · ≈ 375 questions` |
| Pro card — name | `Pro` |
| Pro card — value | `2.3M tokens / month · ≈ 1,150 questions` |
| Price line (per card) | *(from `StoreProduct.localizedPriceString` + period — never hardcode)* e.g. `$5.99 / month` |
| Primary button | `Subscribe` |
| Restore button | `Restore Purchases` |
| Auto-renew disclosure (required) | `Auto-renews monthly until canceled. Cancel anytime in Settings → your name → Subscriptions.` |
| Trial disclosure (only if a trial offer exists) | `7 days free, then {price}/month. Cancel anytime.` |
| Legal line (required near CTA) | `Terms` · `Privacy` — links open in the browser (see `SettingsView.LegalSection`): `https://physics.it.com/terms`, `https://physics.it.com/privacy` |

### States / errors
| Case | Copy |
|---|---|
| Purchase in flight | button → `Subscribing…` + spinner, controls disabled |
| User cancelled (StoreKit `userCancelled`) | *(silent — no error shown)* |
| Purchase failed | `Couldn't complete the purchase. You were not charged — please try again.` (system red) |
| Restore, nothing found | `No previous purchase found on this Apple ID.` |
| Restore, success | dismiss + the Account/usage view refreshes; no modal |
| Offerings failed to load | `Plans are unavailable right now. Check your connection and try again.` |

### Post-purchase (Account tab, from P10-3)
- Apple subscriber, "Manage subscription" → system `showManageSubscriptions` sheet (allowed).
- Revolut subscriber seen on iOS → read-only line: `Managed on the web.` (no link — R7).

---

## 3. Value/entitlement mapping (must match `lib/billing/plans.ts` + runbook §4)

| Paywall plan | Apple product ID | RevenueCat entitlement | `user_billing.plan` | Tokens |
|---|---|---|---|---|
| Starter | `com.physicsexplained.app.starter.monthly` | `starter` | `starter` | 750,000 |
| Pro | `com.physicsexplained.app.pro.monthly` | `pro` | `pro` | 2,300,000 |

Token counts mirror the web plans (`starter` 750k, `pro` 2.3M) so an Apple
subscriber gets the same monthly allowance as a Revolut subscriber on the same
tier — the reconcile in P10-1 sets `tokens_allowance` from `allowanceFor(plan)`.
