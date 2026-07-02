# P8-3 — Account deletion + privacy compliance

Phase P8, prompt 3 of 4. Executor: Opus 4.8. Prerequisites: P5 (auth). **This prompt modifies the web repo** (explicitly allowed here, overriding hard rule 10 for the named files only).

## Read first
- `/Users/roman/Developer/physics/docs/ios/08-risk-register.md` (account-deletion + AI-content review rows)
- `/Users/roman/Developer/physics/docs/ios/06-backend-changes.md` §3 (bearer-auth helper — the deletion route reuses `getRequestClient`/the bearer path)
- `/Users/roman/Developer/physics/lib/supabase-server.ts` (service client), `/Users/roman/Developer/physics/middleware.ts`
- Supabase tables with user data (02-api-contracts.md §2.4): `ask_conversations`, `ask_messages`, `ask_usage_daily`, `user_billing`, `billing_orders`, `problem_attempts`, `problem_diagnoses`

## Task
1. **Web repo — deletion endpoint** `app/api/account/delete/route.ts`: `POST`, authenticated (bearer OR cookie via the 06 §3 helper). Service-role client: delete the user's rows from all user tables above (respect FK order; `ask_messages` cascades from conversations — check migration 0003), then `auth.admin.deleteUser(userId)`. Add `/api/account` to the middleware PROTECTED matcher. Return `{ok:true}`; second call → 401 (user gone). Log to `os`-equivalent (server console) WITHOUT PII.
   - If an active paid plan exists (`user_billing.status='active'` and plan ≠ free): still delete (App Review requires real deletion), but note in the response `{ok:true, hadActivePlan:true}` so the client can warn beforehand (fetch `user_billing` first, warn "your subscription won't auto-cancel with the payment provider — manage it on the web first"; wording must not link out).
2. **iOS — Settings**: "Delete account" row → destructive confirm sheet (explains what's deleted; shows the paid-plan warning when applicable) → call endpoint with bearer → on `ok`, sign out locally, purge GRDB cache + Nuke caches + UserDefaults (model choice), return to signed-out state.
3. **Privacy manifest** (`PrivacyInfo.xcprivacy` in the App target — this file lives in `App/`, not the pbxproj): declare collected data (email/user id for app functionality, chat content as user content linked to identity; no tracking, no ads), required-reason APIs used by dependencies (UserDefaults etc.) — audit supabase-swift/GRDB/Nuke/SwiftMath manifests and fill gaps.
4. **App Privacy nutrition labels**: write `docs/ios/store/privacy-labels.md` enumerating the App Store Connect answers (data types, linked-to-identity, no tracking) consistent with the manifest.
5. **Report message** (risk R15): long-press/⋯ menu on an assistant message → "Report this answer" → POSTs into the existing `contact_messages` table via anon insert (`lib/supabase.ts` pattern; include conversation id + message index, NOT full user chat history) → confirmation toast. No moderation UI beyond this.

## Do NOT
- Do not soft-delete or merely flag the auth user — `auth.admin.deleteUser` must run.
- Do not link to web billing management from the deletion flow or anywhere (402 wall rules).
- Web-repo changes limited to: the new route file, the middleware matcher line, and (if needed) a small lib helper.

## Acceptance criteria
- Round-trip on a throwaway account: create → chat once → delete → auth login fails, `ask_conversations`/`ask_messages`/`user_billing` rows for that user id are gone (verify via service-role SQL), app lands signed-out with empty caches.
- Cookie-based web session for a DIFFERENT user unaffected (regression).
- Privacy manifest passes `xcodebuild` archive validation (no missing-manifest warnings).
- Report action inserts a row into `contact_messages` (verify via table read).

## Verify
```bash
# web
pnpm tsc --noEmit    # in /Users/roman/Developer/physics (repo has no lint config — use tsc)
# iOS
swift build --package-path ios/PhysicsPackages
xcodebuild -project ios/PhysicsExplained.xcodeproj -scheme PhysicsExplained \
  -destination 'platform=iOS Simulator,name=iPhone 17 Pro' build
```
Report: deletion round-trip evidence (row counts before/after) + manifest validation output.
