# P10-5 — Paywall redesign + Account polish

Phase P10, prompt 5 (follow-on polish). Executor: Opus 4.8. Prerequisites:
P10-2 (PaywallView shipped), P10-3 (Account section shipped). iOS repo, App
target + PXDesign only. Pure UI — no billing/entitlement logic changes, no
new dependencies.

## Read first
- `/Users/roman/Developer/physics/ios/App/Paywall/PaywallView.swift` (the paywall + `PlanCard` + `PaywallTier` to redesign)
- `/Users/roman/Developer/physics/ios/App/Auth/AccountSection.swift` (`planControl` — the "Upgrade plan" button)
- `/Users/roman/Developer/physics/ios/App/Settings/DeleteAccountSection.swift` (the footer line, ~L39)
- `/Users/roman/Developer/physics/ios/App/Onboarding/OnboardingView.swift` §Backdrop (`backdropView`, `scrim`) — **the hero-image style to echo**
- `/Users/roman/Developer/physics/ios/PhysicsPackages/Sources/PXDesign/Components/Glass.swift` (`pxGlassPanel`, `pxGlassCapsule` — Liquid Glass helpers), `/Users/roman/Developer/physics/ios/PhysicsPackages/Sources/PXDesign/PXLayout.swift` (`PXRadius`, `PXCardSurface`)
- `/Users/roman/Developer/physics/docs/ios/03-design-system.md` §4 (Liquid Glass rules — glass is the chrome layer; a paywall sheet qualifies), §5 (buttons/radius)
- `/Users/roman/Developer/physics/docs/ios/store/paywall-copy.md` (existing paywall strings; extend §2 with the new "what Ask does" copy)

## Task
1. **Paywall hero image (intro-screen style)** — add a hero image to the top of `PaywallView`'s loaded state, presented like `OnboardingView.backdropView` `.photo`: `Image(...).resizable().scaledToFill()` in a fixed-height frame (~200–240pt), `.clipped()`, with a **rounded bottom** (`RoundedRectangle(cornerRadius: PXRadius.tile, style: .continuous)` clip) or a bottom scrim (reuse the `scrim` gradient idea so the "UPGRADE / Keep asking." header reads over it). Add a new asset **`PaywallHero`** to the App target's asset catalog (a placeholder the user swaps) **or** reuse an existing onboarding `.photo` backdrop asset — name whichever you use in a comment. `.accessibilityHidden(true)` on the image.
2. **Liquid Glass** — the paywall is a sheet (chrome), so glass is allowed (Glass.swift rule). Wrap the plan-cards cluster and the CTA/disclosure block in `pxGlassPanel(cornerRadius: PXRadius.card)` (or a `PXCardSurface` over glass) so the cards float on a glass panel rather than sitting flat on `pxScreenBackground()`. Keep body copy legible over glass (fg0/system label per §4) — do not put glass between the reader and long text; use it for the control clusters only.
3. **Rounded plan cards** — in `PlanCard`, replace the `Rectangle().strokeBorder(...)` with a **`RoundedRectangle(cornerRadius: PXRadius.card, style: .continuous)`** stroke (selected = `accentCyan` at `PXStroke.rail`, else `fg4` hairline), and give the card a matching rounded fill/`PXCardSurface`. Result: soft, iOS-style rounded cards, not sharp HUD rectangles. Preserve the selection behavior and the `productIdentifier`-based `PaywallTier` matching exactly.
4. **"What Ask can do" section** — between the header and the plan cards, add a short value section explaining the tutor (this is the "explanation of what Ask can do" ask). Use 3–4 rows, each an SF Symbol + one line (Inter body). Draft copy (add to `paywall-copy.md` §2 as well):
   - `sparkles` — "Ask any physics question, in plain language."
   - `function` — "Step-by-step worked solutions — the intuition and the math."
   - `checklist` — "Work through problems with hints, not just answers."
   - `infinity` — "Room to explore a whole topic, not just a few questions."
   Keep it compact; it sits above the cards to justify the price before the ask.
5. **Account: round the "Upgrade plan" button** — in `AccountSection.planControl`, the `(.free, _)` button (`Text("Upgrade plan")`, currently `.buttonStyle(.pxPrimary)`) should render **rounded**. Apply a rounded/capsule treatment: either a `RoundedRectangle(cornerRadius: PXRadius.control, style: .continuous)` clip/background or `.pxGlassCapsule()`-style rounding, consistent with the redesigned paywall CTA. If a reusable rounded primary button style is the clean route, add it to PXDesign (e.g. `.pxRoundedPrimary`) and use it for both the Account "Upgrade plan" and the paywall "Subscribe" so they match. Give "Manage subscription" the rounded ghost equivalent.
6. **Delete footer — drop the display font** — in `DeleteAccountSection`, the footer `Text("Deleting your account removes it permanently. This cannot be undone.")` currently uses `.pxStyle(.displayBodySmall, color: .secondary)`. Replace with the plain system footnote: `.font(.footnote).foregroundStyle(.secondary)` (no `pxStyle`). This matches the "normal font" direction P10-3 set for the account screens. (Leave the destructive-warning red lines in the delete *sheet* as-is — those are load-bearing.)

## Do NOT
- Do **not** change any purchase / entitlement / webhook logic — this is presentation only. `PaywallTier` product-id matching, `buy`/`restore`, `entitlementPlan`, and the compliance bits (prices from `StoreProduct`, Restore button, auto-renew disclosure, Terms/Privacy links) all stay.
- Do **not** hardcode prices or add any payment link out (R7).
- Do **not** put glass behind long body text or between the reader and content (§4) — glass is for the card/CTA chrome only.
- No new dependencies; no `.xcodeproj` edits (asset catalog + `project.yml` if a new asset needs declaring).

## Acceptance criteria
- Paywall shows: a hero image (intro-screen style) → header → a "what Ask can do" value list → rounded plan cards on a Liquid-Glass panel → Subscribe / Restore / disclosures. Prices are still live from the product; Restore + legal links still present.
- Plan cards are visibly rounded (continuous radius), not sharp rectangles.
- Account "Upgrade plan" button is rounded and matches the paywall's Subscribe styling; "Manage subscription" matches as a rounded ghost.
- The Delete-account footer renders in the plain system footnote (no display face).
- `swift build` + app build pass; the paywall still loads against the `.storekit` fixture in a Debug run.

## Verify
```bash
cd /Users/roman/Developer/physics
swift build --package-path ios/PhysicsPackages
xcodebuild -project ios/PhysicsExplained.xcodeproj -scheme PhysicsExplained \
  -destination 'platform=iOS Simulator,name=iPhone 17 Pro' build
xcrun simctl io booted screenshot /tmp/paywall-v2.png
xcrun simctl io booted screenshot /tmp/account-v2.png
```
Report: build output + screenshots of the redesigned paywall (hero image, glass, rounded cards, Ask value list) and the Account tab (rounded Upgrade button, plain-font delete footer). Visual sign-off is the user's (no Simulator IAP receipts / hand off per the standing note).
