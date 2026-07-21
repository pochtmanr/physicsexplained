# P10-2 — iOS RevenueCat SDK + paywall + purchase/restore

Phase P10, prompt 2 of 4. Executor: Opus 4.8 (+ `[USER]` for the RevenueCat
dashboard values). Prerequisites: P5 (auth — `AuthService`), P10-1 (webhook +
`provider` column live on the backend). iOS repo work.

## Read first
- `/Users/roman/Developer/physics/docs/ios/10-revenuecat-setup.md` (§5 hand-off values; §6 StoreKit config + sandbox testing)
- `/Users/roman/Developer/physics/docs/ios/01-architecture.md` §2 (target layout), **§3 (pinned dependencies — you must edit this table)**, §8 hard rules
- `/Users/roman/Developer/physics/docs/ios/03-design-system.md` §2 (typography), §5 (buttons/controls) — the paywall is brand UI
- `/Users/roman/Developer/physics/docs/ios/store/paywall-copy.md` — **the exact paywall strings + product/entitlement mapping** (use these verbatim; do not invent copy or hardcode prices)
- `/Users/roman/Developer/physics/ios/Support/Subscriptions.storekit` — **pre-built StoreKit config** (two products `com.physicsexplained.app.{starter,pro}.monthly`); you wire it into the Debug scheme, you do not author it
- `/Users/roman/Developer/physics/ios/PhysicsPackages/Sources/PXAPI/AuthService.swift` (`AuthenticatedUser.id`, `state` stream, `accessToken()`)
- `/Users/roman/Developer/physics/ios/PhysicsPackages/Sources/PXAPI/AccountAPI.swift` and `ios/PhysicsPackages/Sources/PXModel/UserBilling.swift` (billing read; `plan`)
- `/Users/roman/Developer/physics/ios/PhysicsPackages/Sources/PXAsk/AskWallView.swift` (the quota wall — its CTA changes)
- `/Users/roman/Developer/physics/ios/PhysicsConfig.example.plist` and the `AppEnvironment.load()` config type
- `/Users/roman/Developer/physics/ios/project.yml` (SwiftPM deps + scheme)

## Task
1. **Pin the dependency first.** In `01-architecture.md` §3, add a row:
   `` `purchases-ios-spm` (RevenueCat) | latest 5.x | Apple StoreKit 2 wrapper for the iOS paywall; entitlements + purchase/restore. `` and add a one-line note under the table that R7 ("no commerce") is superseded by phase P10 for iOS IAP (external payment links remain banned). Only after this table edit, add the package.
2. **Add the package** `RevenueCat` (`https://github.com/RevenueCat/purchases-ios-spm`) to `ios/project.yml` and attach the `RevenueCat` product to the **PXAPI** target (the network/auth layer; respects the §2 dependency flow — PXScenes/PXBlocks must not gain it). Regenerate with xcodegen if that is the project's flow; **do not hand-edit `PhysicsExplained.xcodeproj`** (hard rule 1).
3. **Config** — add `RevenueCatPublicKey` (String) to `AppEnvironment` (throw at launch if missing, like the Supabase keys) and document it in `PhysicsConfig.example.plist`. Value comes from the runbook §5 (`appl_…`, publishable).
4. **`PurchasesService`** in PXAPI (an actor or `@MainActor` `@Observable`, matching the codebase's concurrency conventions in §1):
   - `configure()` at launch: `Purchases.logLevel = .info; Purchases.configure(withAPIKey: env.revenueCatPublicKey)`. Configure **without** a user id, then log in reactively (next bullet) — this keeps an anonymous id before sign-in and aliases correctly on sign-in.
   - Subscribe to `AuthService.state`: on `.signedIn(user)` call `Purchases.shared.logIn(user.id.uuidString.lowercased())`; on `.signedOut` call `Purchases.shared.logOut()`. **The app-user-id must equal the Supabase uuid** — that is the join key P10-1's webhook reconciles on. (Match the casing the backend expects; Supabase uuids are lowercased.)
   - Expose `offerings() async throws -> Offering?` (current offering), `purchase(_ package: Package) async throws -> CustomerInfo`, `restore() async throws -> CustomerInfo`, and an `entitlementPlan(from: CustomerInfo) -> UserBilling.Plan` mapping (`pro`/`starter` entitlement active → matching plan, else `.free`).
5. **`PaywallView`** (new, in the App target's Settings/Ask area or a small `PXPaywall` — keep it where the other App screens live; it imports PXAPI/PXDesign):
   - Use the exact strings from `docs/ios/store/paywall-copy.md` §2 (eyebrow/title/subtitle/card copy/buttons/disclosure/error states). Do not paraphrase them.
   - Renders the current offering's packages (Starter, Pro) using the brand design system: keycap buttons (§5), mono price/period meta, Inter body for the value copy. Show price + period from the `StoreProduct.localizedPriceString`/period (never hardcode prices — Apple/RevenueCat is the source of truth; the `$5.99`/`$19.99` in the copy doc are only the StoreKit-fixture defaults).
   - Primary action buys the selected package via `PurchasesService.purchase`. On success: read the entitlement from the returned `CustomerInfo` for **instant unlock**, then call `AskViewModel.loadBilling()` so the row the webhook is updating is re-read shortly after.
   - A **Restore Purchases** button (App Review requires it) → `PurchasesService.restore()` → same refresh.
   - Required legal near the CTA: **Terms (EULA)** and **Privacy** links (open in browser, like `LegalSection` in `SettingsView.swift`) + a one-line auto-renew disclosure ("Auto-renews monthly until canceled. Manage in Settings."). These are legal links — allowed; no payment link out.
   - Handle `userCancelled` silently, surface real errors inline (system red), and disable the buttons while a purchase is in flight.
6. **Gate wiring** — `AskWallView` (PXAsk): the wall may now, on the `.quota` case, show an **"See plans"** / upgrade CTA that presents `PaywallView` (commerce is now allowed on iOS for this phase — update the file's header comment that currently forbids it, citing P10). Keep the cooldown / sign-in cases unchanged. The wall stays informational for the free-question copy; only the quota case gains the CTA.
7. **StoreKit config for local dev** — the file already exists at `ios/Support/Subscriptions.storekit` (two products, prices, group). Wire it into the **Debug** scheme only (`project.yml` → the scheme's `run.config: Debug` StoreKit configuration / `StoreKitConfigurationFileReference`), so offerings load in Simulator without App Store Connect. Do not point Release at it, and do not recreate the file. If the product IDs in App Store Connect end up differing from the fixture, update the fixture to match (the IDs must be identical across ASC, RevenueCat, and this file).

## Do NOT
- Do **not** hand-edit `PhysicsExplained.xcodeproj` (hard rule 1) — all project changes via `project.yml`/xcodegen.
- Do **not** add any dependency other than `purchases-ios-spm`, and only after the §3 table edit (hard rule 3).
- Do **not** hardcode prices or plan names in the paywall — read them from the RevenueCat `Offering`/`StoreProduct`.
- Do **not** add an external link to web checkout or any payment page from inside the app (R7 still bans payment links out; only legal links are allowed).
- Do **not** let PXScenes/PXBlocks import RevenueCat (respect the §2 layering).

## Acceptance criteria
- `swift build --package-path ios/PhysicsPackages` and the app `xcodebuild` build both succeed with the new dependency.
- With the `.storekit` file, the paywall lists **two** plans with live prices/periods; buying one returns a `CustomerInfo` whose active entitlement maps to the expected plan and the UI reflects the unlock immediately.
- **Restore Purchases** returns without error on an account with a prior purchase.
- On sign-in, RevenueCat's current app-user-id equals the Supabase uuid (verify via `Purchases.shared.appUserID` in a debug log); on sign-out it reverts to an anonymous id.
- The quota wall's `.quota` case shows the upgrade CTA that presents the paywall; cooldown/sign-in cases are unchanged.

## Verify
```bash
cd /Users/roman/Developer/physics
swift build --package-path ios/PhysicsPackages
xcodebuild -project ios/PhysicsExplained.xcodeproj -scheme PhysicsExplained \
  -destination 'platform=iOS Simulator,name=iPhone 17 Pro' build
# Purchase/restore + app-user-id are runtime — driven in the StoreKit-config
# Simulator run and Sandbox on device (no Simulator IAP receipts in CI).
xcrun simctl io booted screenshot /tmp/paywall.png
```
Report: build output, the `appUserID == supabase uuid` log line, and a paywall screenshot. Note explicitly that live purchase/restore and the webhook round-trip are exercised in Sandbox by the user (hand off per the no-Simulator-purchases standing note).
