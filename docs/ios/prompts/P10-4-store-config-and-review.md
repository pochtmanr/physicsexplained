# P10-4 — Store config, App Review prep, and the R7 doc reversal

Phase P10, prompt 4 of 4. Executor: Opus 4.8 **+ `[USER]`** for every App Store
Connect / RevenueCat console action. Prerequisites: P10-1..P10-3 shipped and
green. This closes the monetization phase and flips the docs from "no commerce"
to "IAP present, payment-links-out still banned".

## Read first
- `/Users/roman/Developer/physics/docs/ios/10-revenuecat-setup.md` (§1–§2 console steps; §7 what review checks)
- `/Users/roman/Developer/physics/docs/ios/00-prd.md` §3.6, §3.7 (the "no commerce" clauses to reframe)
- `/Users/roman/Developer/physics/docs/ios/07-implementation-phases.md` (R7 backlog line; add the P10 phase row)
- `/Users/roman/Developer/physics/docs/ios/08-risk-register.md` (R7 row)
- `/Users/roman/Developer/physics/docs/ios/09-go-live.md` (§6.2 + the rejection table)
- `/Users/roman/Developer/physics/docs/ios/prompts/P8-4-store-prep.md` and any `docs/ios/store/{review-notes,privacy-labels,checklist}.md` produced by P8-3/P8-4
- `/Users/roman/Developer/physics/docs/ios/prompts/README.md` (phase table) and this pack's format

## Task
1. **`[USER]` console cross-check** — walk the runbook §1–§2 to completion: Paid
   Apps agreement active, banking/tax done, both products in one subscription
   group with prices + localized metadata + a **subscription review screenshot**
   (of the P10-2 paywall), RevenueCat app/entitlements/offering/webhook
   configured, and the three non-secret hand-off values delivered to the code
   side (public SDK key, product IDs, entitlement IDs). Secrets placed in env by
   the user only. Record completion in `docs/ios/store/checklist.md`.
2. **Reverse Risk R7 in the docs (this is the phase where commerce actually
   exists).** Surgical edits, keeping the *payment-links-out* ban intact:
   - `08-risk-register.md` R7 — reframe from "no IAP; quota wall sells nothing" to: *"IAP is present on iOS via RevenueCat/StoreKit (phase P10). The live risk is IAP-compliance: Restore Purchases must work, required subscription metadata + EULA/Privacy links must sit by the paywall, and no external/web payment link may appear inside the app."* Keep the row; do not delete the history.
   - `00-prd.md` §3.6/§3.7 — the plan display is now purchasable on iOS via IAP; the quota wall may present an upgrade CTA that opens the in-app paywall. Preserve: no external payment links; Sign in with Apple + account deletion remain required.
   - `07-implementation-phases.md` — move "StoreKit IAP + plan reconciliation" out of the post-MVP backlog into an **active P10 phase** section (mirror the existing phase formatting) listing `P10-1..P10-4` + the runbook.
   - `09-go-live.md` §6.2 + rejection table — replace "do not configure IAP / never link out from the quota wall" with the new posture: IAP is configured and required to function; the ban is now specifically on *payment/management links out of the app* (Apple manage-subscriptions sheet is fine; a browser link to web checkout is not).
   - Leave every "external payment link" / "link out" prohibition **in force** — only the blanket "no commerce at all" stance is what changes.
3. **Store metadata** — update `docs/ios/store/review-notes.md`: declare the two
   auto-renewable subscriptions (names, durations, prices), that Restore
   Purchases is implemented, that entitlements are brokered by RevenueCat, and
   that web (Revolut) and iOS (Apple) plans reconcile server-side into one
   account. Note the demo/sandbox account for the reviewer.
4. **Privacy** — update `docs/ios/store/privacy-labels.md` + `PrivacyInfo.xcprivacy`
   if RevenueCat's SDK adds any collected-data / required-reason API declarations
   (audit the RevenueCat privacy manifest and merge gaps, same method as P8-3 §3).
   Purchase history tied to the account is "Purchases" data linked to identity.
5. **Regression + submission checklist** — extend `docs/ios/store/checklist.md`:
   Sign in with Apple present (4.8), account deletion present (5.1.1(v)), IAP
   functional + Restore working (2.1 / 3.1.1), subscription metadata in binary,
   EULA/Privacy by the paywall, export compliance. Then the Sandbox → TestFlight
   purchase + restore + cross-platform (buy on iOS, see it on web) pass from
   runbook §6.

## Do NOT
- Do **not** remove the payment-links-out prohibition anywhere — reframing R7 narrows it to that, it does not lift it. The Apple *system* manage-subscriptions sheet is allowed; a link to web checkout/management is not.
- Do **not** invent prices in the docs — cite whatever the user set in App Store Connect (runbook §1.2).
- Do **not** edit `PhysicsExplained.xcodeproj` by hand; version bumps go through `project.yml` (per `SettingsView.AppInfo`).
- Do **not** submit or change ASC state on the user's behalf — all ASC/RevenueCat actions are `[USER]`.

## Acceptance criteria
- The four docs (`00-prd`, `07`, `08`, `09`) consistently describe iOS IAP as present while still banning external payment links; a reader cannot find a surviving "no commerce at all" claim, nor a newly-permitted "link to web checkout".
- `07-implementation-phases.md` and `prompts/README.md` both list the P10 phase with `P10-1..P10-4`.
- `docs/ios/store/{review-notes,privacy-labels,checklist}.md` reflect the two subscriptions, Restore, and the dual-provider reconcile.
- Archive validation passes with no missing-privacy-manifest warnings after the RevenueCat SDK addition.

## Verify
```bash
cd /Users/roman/Developer/physics
# Doc consistency — should return no stale absolute prohibitions:
grep -rniE "no (in-app )?purchase|sells nothing|do not configure IAP|no commerce" docs/ios | \
  grep -viE "payment link|link out|external"   # remaining hits must all be about links-out, not commerce
xcodebuild -project ios/PhysicsExplained.xcodeproj -scheme PhysicsExplained archive \
  -destination 'generic/platform=iOS' -archivePath /tmp/pe.xcarchive
```
Report: the grep result (proving no stale "no commerce" claim survives), the archive/validation output, and the completed `checklist.md`. All ASC/RevenueCat console evidence (products live, webhook firing, sandbox purchase) is provided by the user.
