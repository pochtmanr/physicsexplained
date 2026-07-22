# Submission checklist — Physics.explained (iOS)

The gate for TestFlight → App Review. Extended in **P10-4** with the RevenueCat /
App Store Connect console cross-check and the IAP-compliance items. `[USER]` items
are console/device actions only the account owner can do; the executor cannot check
them off — record evidence beside each.

Legend: `[ ]` todo · `[x]` done · `[USER]` account-owner action.

---

## 1. Console cross-check — RevenueCat + App Store Connect `[USER]`

Walk `10-revenuecat-setup.md` §1–§2 to completion.

- [ ] `[USER]` **Paid Applications agreement Active**; banking + tax complete (§1.1).
- [ ] `[USER]` Both products created in **one subscription group** `Physics Explained`, auto-renewable (§1.2):
  - [ ] `com.physicsexplained.app.starter.monthly` — Starter, 1 month, price set.
  - [ ] `com.physicsexplained.app.pro.monthly` — Pro, 1 month, price set.
- [ ] `[USER]` Each product has **localized display name + description** and a **subscription review screenshot** (of the P10-2 paywall) (§1.3).
- [ ] `[USER]` **In-App Purchase Key** (`.p8`) generated; Key ID + Issuer ID noted (§1.4).
- [ ] `[USER]` RevenueCat **project + App** (App Store platform, bundle id, `.p8` uploaded) configured (§2).
- [ ] `[USER]` RevenueCat **entitlements** `starter` and `pro` each attached to the matching product (§2).
- [ ] `[USER]` RevenueCat **offering** `default` with Starter + Pro packages, ordered Starter→Pro (§2).
- [ ] `[USER]` RevenueCat **webhook** → `https://physics.it.com/api/billing/revenuecat`, Authorization token set, **both** Sandbox + Production events (§2).
- [ ] `[USER]` **Secrets placed by the user only**: `REVENUECAT_WEBHOOK_AUTH` (+ optional `REVENUECAT_SECRET_KEY`) in web env; `RevenueCatPublicKey` in `App/PhysicsConfig.plist`.
- [ ] `[USER]` **Three non-secret hand-off values** delivered to the code side (§5): Apple public SDK key (`appl_…`), the two product IDs, the two entitlement IDs (`starter`, `pro`).

**Completion recorded:** _`[USER]` — date / by: __________________________________ (fill on completion)_

## 2. App Review guideline items

- [x] **4.8** Sign in with Apple present alongside Google (+ email OTP) — `AuthService.swift`.
- [x] **5.1.1(v)** In-app account deletion — Settings → Delete Account → `auth.admin.deleteUser` (P8-3).
- [ ] **2.1 / 3.1.1** IAP is **functional** in the binary and **Restore Purchases works** — verify in Sandbox (§4).
- [x] Required auto-renewable **subscription metadata in the binary** — title, duration, price, auto-renew disclosure on `PaywallView` (reads live from StoreKit; copy in `store/paywall-copy.md`).
- [x] **EULA + Privacy links by the paywall** — `PaywallView` legal line → `physics.it.com/terms`, `/privacy` (browser links; no payment link out).
- [x] **No external/web payment link anywhere** — quota wall CTA opens the in-app paywall; Revolut branch is read-only "Managed on the web"; Apple branch uses the system manage-subscriptions sheet (R7 reframed, links-out ban intact).
- [x] **1.2 / 4.7** AI-content disclosure + per-message report action (R15) — P8-3/P8-4.
- [x] Age rating **4+**, education rationale — in `review-notes.md`.
- [x] **Export compliance**: `ITSAppUsesNonExemptEncryption: false` (standard HTTPS, exempt).

## 3. Privacy consistency

- [ ] `ios/App/PrivacyInfo.xcprivacy` present and declares Email, User ID, Other User Content, **Purchase History** (all linked, no tracking) + UserDefaults required-reason `CA92.1`.
- [ ] App Store Connect **App Privacy** nutrition labels match `store/privacy-labels.md` (incl. the P10 **Purchases** row).
- [ ] Website privacy policy (`physics.it.com/en/privacy`) covers accounts, email, user ID, chat content (per go-live §5.3) — no contradiction with the labels.
- [ ] `[USER]` Archive **validates clean** (no missing-privacy-manifest warnings) after the RevenueCat SDK addition (`10-revenuecat-setup.md` §7; go-live §7.3 → Validate).

## 4. Sandbox → TestFlight purchase pass `[USER]` (runbook §6)

- [ ] `[USER]` Sandbox tester created; signed into device (Settings → App Store → Sandbox Account).
- [ ] `[USER]` **Buy** Starter or Pro in Sandbox → paywall completes, entitlement unlocks instantly.
- [ ] `[USER]` **Webhook round-trip**: within seconds `user_billing` row shows `plan`, `provider='apple'`, `status='active'` (service-role SQL).
- [ ] `[USER]` **Restore Purchases** on a reinstall / second device returns the entitlement.
- [ ] `[USER]` **Cross-platform**: same account's **web** profile shows the plan with the "Managed via Apple" read-only card (P10-1).
- [ ] `[USER]` **Revolut cron** never selects `provider='apple'` rows (P10-1 guard).
- [ ] `[USER]` Full purchase + Restore pass repeated in a **TestFlight** build before submission.

## 5. Regression sweep (P2–P7 gates, release candidate)

Run each phase's acceptance list once on the RC (P8-4 task 5). Record pass/waive:

| Phase | Gate (short) | Result |
|---|---|---|
| P2 | Browse taxonomy order, cache-hit relaunch, draft deep-link "not found" | ☐ |
| P3 | 5 reference topics render; TeX audit 0 hard fails; term/physicist sheets | ☐ |
| P4 | Gallery lists native scenes; side-by-side vs web; sliders/fullscreen | ☐ |
| P5 | Live chat: scene+plot+cite; 402/429 walls; mid-stream truncation retry | ☐ |
| P6 | Wave registry counts; per-scene screenshots vs snapshot | ☐ |
| P7 | Playground presets qualitatively match; 60fps; gestures | ☐ |
| P8/P9 | iPad split; nav shell; account deletion round-trip | ☐ |
| P10 | Paywall lists 2 plans (live prices); Account tab parity + Sign out last | ☐ |

## 6. Store listing + upload `[USER]`

- [ ] `[USER]` App Store Connect record created (unique name; bundle id `com.physicsexplained.app`).
- [ ] `[USER]` App Privacy labels entered (§3).
- [ ] `[USER]` Description (incl. AI-generated sentence), keywords, support URL, "What's New".
- [ ] `[USER]` Screenshots — iPhone 6.9" **and** iPad 13" (required; `TARGETED_DEVICE_FAMILY "1,2"`), from a Release build.
- [ ] `[USER]` Apple **Distribution** certificate created; `project.yml` signing pinned (go-live §5.4).
- [ ] `[USER]` **Archive → Validate → Upload** (`MARKETING_VERSION 1.0.1`, build increments each upload).
- [ ] `[USER]` Demo account (verified working) + `review-notes.md` pasted → **Submit**.
