# P10-3 — iOS Account tab: profile parity, normal font, sign-out last

Phase P10, prompt 3 of 4. Executor: Opus 4.8. Prerequisites: P10-2 (paywall +
`PurchasesService` exist), P10-1 (`provider` on the billing row). iOS repo work.
This is the user's core Settings request.

## Read first
- `/Users/roman/Developer/physics/components/account/profile-tab.tsx` — **the web profile this must mirror** (avatar/initial, name, email, usage meter, plan + upgrade/manage, Info rows: User ID / Provider / Joined). Also `/Users/roman/Developer/physics/components/account/usage-meter.tsx` and `app/[locale]/ask/layout.tsx` (the `userPayload` field set: id, email, fullName, avatarUrl, provider, joined).
- `/Users/roman/Developer/physics/ios/App/Auth/AccountSection.swift` (current Account section — being rebuilt)
- `/Users/roman/Developer/physics/ios/App/Settings/SettingsView.swift` (section order; Sign out moves here, last)
- `/Users/roman/Developer/physics/ios/App/Settings/DeleteAccountSection.swift` (stays the second-to-last section)
- `/Users/roman/Developer/physics/ios/PhysicsPackages/Sources/PXAPI/AuthService.swift` (`AuthenticatedUser` — must gain avatar/provider/joined)
- `/Users/roman/Developer/physics/ios/PhysicsPackages/Sources/PXModel/UserBilling.swift` (must gain `status`/`provider` for the meter + manage branch)
- `/Users/roman/Developer/physics/docs/ios/03-design-system.md` §2 (typography — note this screen deliberately uses the **Inter body face**, not the mono `.meta` face)

## Task
1. **Extend `AuthenticatedUser`** (PXAPI) with `avatarURL: URL?`, `provider: String`, `joined: Date`, populated in the `user(from: User)` mapper:
   - `avatarURL` ← `userMetadata["avatar_url"] ?? userMetadata["picture"]` (string → URL).
   - `provider` ← `appMetadata["provider"]?.stringValue ?? "email"`.
   - `joined` ← `user.createdAt`.
   - Keep the existing `id`/`email`/`displayName`. Update the P5 auth tests/fixtures that build `AuthenticatedUser` for the new fields.
2. **Extend `UserBilling`** (PXModel) to decode `status` (`active|past_due|canceled`, default `active`) and `provider` (`revolut|apple`, default `revolut`) from the row (P10-1 added `provider`). Keep the existing informational contract; add a computed `percentUsed: Int` (paid: `tokensUsed/tokensAllowance`; free: `freeQuestionsUsed/3`) reused by the meter. Update the model's doc note — it is no longer purely "no purchase affordance ever"; on iOS the plan line now sits next to an upgrade/manage control (P10).
3. **Rebuild `AccountSection`** to mirror `profile-tab.tsx`, in the **normal Inter font** (`.displayBody` / `.displayBodySmall` / system; **not** `.meta` mono — this is the explicit request):
   - **Identity header:** avatar via `LazyImage` (Nuke) from `user.avatarURL`, else an initial-circle fallback; `displayName ?? email` on the first line; `email` below in **Inter** (`.displayBodySmall`, secondary) — *not* the mono face it uses today.
   - **Usage + plan:** a `PXUsageMeter` (new, small — port `usage-meter.tsx`: a labeled bar of `percentUsed`, tokens/questions remaining, mono digits are fine inside the meter readout) + the plan label. Then a control:
     - `plan == .free` → **"Upgrade plan"** keycap button → presents `PaywallView` (P10-2).
     - paid & `provider == .apple` → **"Manage subscription"** → StoreKit `showManageSubscriptions` (or `AppStore.showManageSubscriptions(in:)`).
     - paid & `provider == .revolut` → read-only line **"Managed on the web"** (no link — R7; the user manages it in the browser where they bought it). No button.
   - **Info block** (Inter rows, label left / value right, mirroring the web `Row`): **User ID** (`user.id`, allow copy), **Provider** (`user.provider`), **Joined** (`user.joined` formatted). These are the rows the website shows; keep the same three.
   - **Remove the "Sign out" button from this section** (it moves — task 4).
4. **Move Sign out to the end.** In `SettingsView`, add a new **terminal** `Section` *after* `DeleteAccountSection` containing the `role: .destructive` "Sign out" button (carry over the sign-out logic/`signOut()` + error handling currently in `AccountSection`, e.g. into a small `SignOutSection` view). New section order becomes: **Account → About → Legal → Delete account → Sign out.** Update the load-bearing section-order comments in `SettingsView` and the `AccountSection`/`DeleteAccountSection` doc-comments that currently explain "signing out lives beside the identity" — the rationale has changed by explicit user request; note the new placement so a future reader doesn't "fix" it back.
5. Keep the screen on the **system grouped background** (Settings stays stock chrome per its existing note); only the identity/meter/info content changes and the font becomes Inter throughout the Account rows.

## Do NOT
- Do **not** use the mono `.meta` style for the email or the info rows — the request is explicitly "normal font" (Inter body).
- Do **not** re-add a Sign out button inside the Account section — it must be the last section, under Delete account.
- Do **not** add prices or a plan-comparison table into the Account section itself — the upgrade CTA opens the `PaywallView`; the section shows the current plan only.
- Do **not** add an external payment/management link for the Revolut branch (R7) — a plain "Managed on the web" statement, no link.
- No new dependencies; no `.xcodeproj` edits.

## Acceptance criteria
- Signed in, the Account section shows: avatar (or initial), name, email **in Inter**, a usage meter, the plan line, the correct plan control (Upgrade for free / Manage for Apple / read-only for Revolut), and the three Info rows (User ID, Provider, Joined) — matching the web profile's field set.
- The Settings screen's **last** section is "Sign out", positioned **below** "Delete account"; there is no sign-out control inside the Account section.
- Free user → Upgrade opens the paywall. Simulated Apple-paid `UserBilling` → Manage opens the system subscriptions sheet. Simulated Revolut-paid → read-only "Managed on the web", no tap target.
- `swift build` + app build pass; P5 auth fixtures updated for the new `AuthenticatedUser` fields.

## Verify
```bash
cd /Users/roman/Developer/physics
swift build --package-path ios/PhysicsPackages
swift test --package-path ios/PhysicsPackages   # auth/user fixtures
xcodebuild -project ios/PhysicsExplained.xcodeproj -scheme PhysicsExplained \
  -destination 'platform=iOS Simulator,name=iPhone 17 Pro' build
xcrun simctl io booted screenshot /tmp/account-tab.png
```
Report: build/test output + a screenshot of the redesigned Account tab (Inter font, usage meter, Info rows) and the Settings list showing "Sign out" as the final section under "Delete account". Live "Manage subscription" (StoreKit sheet) is a device/Sandbox check — hand off to the user per the no-Simulator standing note.
