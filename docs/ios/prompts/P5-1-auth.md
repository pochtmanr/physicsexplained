# P5-1 — Auth: Apple + Google + email OTP (supabase-swift)

Phase P5, prompt 1 of 6. Executor: Opus 4.8. Prerequisites: P0 complete (bearer auth live, Supabase dashboard config per `06-backend-changes.md` §6), P2 complete (PXAPI `SupabaseService` exists).

## Read first
- `/Users/roman/Developer/physics/docs/ios/02-api-contracts.md` §1 (Supabase basics), §7 (bearer tokens)
- `/Users/roman/Developer/physics/docs/ios/01-architecture.md` §2 (PXAPI responsibilities), §4–5 (concurrency/error conventions), §8 (hard rules)
- `/Users/roman/Developer/physics/docs/ios/00-prd.md` §3.6 (Auth & account)
- `/Users/roman/Developer/physics/docs/ios/03-design-system.md` (buttons, text styles for the sign-in screen)
- Existing files: `ios/PhysicsPackages/Sources/PXAPI/SupabaseService.swift`, `ios/App/RootView.swift`

## Task
1. In PXAPI, add `AuthService` (actor or `@MainActor @Observable` session holder) wrapping `supabase.auth`: `session` state (signed-out / signed-in(userId, email)), `signInWithApple()`, `signInWithGoogle()`, `sendOTP(email:)` + `verifyOTP(email:code:)`, `signOut()`, and `accessToken() async throws -> String` (auto-refresh via supabase-swift; this is the token provider `AskClient` will consume in P5-2 — expose it behind a small `TokenProviding` protocol in PXModel).
2. Sign in with Apple: native `ASAuthorizationController` flow → `auth.signInWithIdToken(credentials: .init(provider: .apple, idToken: ..., nonce: ...))`. Handle the name/email-only-on-first-auth quirk.
3. Google: `auth.signInWithOAuth(provider: .google)` using `ASWebAuthenticationSession` redirect (URL scheme per `06-backend-changes.md` §6 dashboard config).
4. Email OTP: send code (`shouldCreateUser: true`), 6-digit code entry screen with resend cooldown (60 s).
5. App target `Auth/` screens: a single sign-in sheet (Apple button first per HIG, then Google, then email field) styled per design system; presented contextually when an unauthenticated user opens the Ask tab or taps a gated action — Browse/Reader stay fully public.
6. Persist session (supabase-swift keychain default); restore on launch; `RootView` reflects auth state.
7. 401-from-API convention (for later prompts): document in code — on 401, call `auth.refreshSession()` once, retry once, then surface `signInRequired`.

## Do NOT
- Do not build any chat/network streaming code (P5-2).
- Do not add purchase/upgrade UI anywhere (PRD §3.7).
- No new dependencies; no `.xcodeproj` edits; auth screens live in `App/Auth/`, logic in PXAPI.

## Acceptance criteria
- All three methods produce a signed-in session against the production Supabase project.
- Kill + relaunch app: session restored without re-auth.
- Sign out returns Ask tab to the gated state; Browse unaffected.
- `TokenProviding.accessToken()` returns a decodable JWT (log its `exp`; never log the token itself outside DEBUG).

## Verify
```bash
swift build --package-path ios/PhysicsPackages
xcodebuild -project ios/PhysicsExplained.xcodeproj -scheme PhysicsExplained \
  -destination 'platform=iOS Simulator,name=iPhone 17 Pro' build
# Manual: run in simulator — OTP flow end-to-end with a real email; screenshot the sign-in sheet:
xcrun simctl io booted screenshot /tmp/p5-1-signin.png
```
Apple/Google flows need entitlements + a device or configured simulator; if blocked by signing, verify OTP fully and leave Apple/Google wired with a written manual-test note in your report.
