# P0-4 — P0 verification + auth dashboard checklist

**Phase**: P0 · **Sequence**: 4 · **Executor**: Fable · **Prerequisites**: P0-1, P0-2, P0-3.

## Read first

- `/Users/roman/Developer/physics/docs/ios/06-backend-changes.md` §5 (verification checklist) and §6 (auth configuration checklist)
- `/Users/roman/Developer/physics/docs/ios/08-risk-register.md` (R9 CAPTCHA, R1 bearer regression)
- `/Users/roman/Developer/physics/docs/ios/00-prd.md` §6 (assumptions log — A8)

## Task

1. Run the full `06-backend-changes.md` §5 checklist end-to-end and record results.
2. Auth dashboard work (§6) — these need the Supabase dashboard; where you cannot act, produce exact click-path instructions for the user and STOP for their confirmation:
   - Verify Auth CAPTCHA (Turnstile/hCaptcha) is **disabled**; if enabled, flag Risk R9 and decide with the user before P5.
   - Configure **Sign in with Apple** provider (needs the user's Apple Developer team id + Services ID — provide the exact values to create) and **Google** provider (iOS client id) with the app's bundle id (agree a bundle id with the user now, e.g. `com.physicsexplained.app`, and record it).
   - Confirm email OTP settings (OTP code, not magic-link-only) for native OTP entry.
3. Write `docs/ios/P0-COMPLETION.md`: checklist results, CAPTCHA state, chosen bundle id, OAuth provider status, snapshot coverage number, any deviations from `06-backend-changes.md`, and updates the assumptions log status for A8 in `00-prd.md`.
4. Commit all P0 work (migration, scripts, middleware patch, docs) on the current branch with message `feat(ios-backend): taxonomy tables, bearer auth, scene snapshots (P0)`.

## Do NOT

- Do not proceed past a failed checklist item — fix or escalate.
- Do not store any dashboard secrets in the repo.

## Acceptance criteria

- Every §5 checklist line has a PASS with evidence (command + output snippet) in `P0-COMPLETION.md`.
- CAPTCHA state and OAuth provider readiness are documented facts, not assumptions.
- A8 in `00-prd.md` is resolved (edited in place).
- Work committed; `npx tsc --noEmit` and `pnpm test` clean.

## Verify

```bash
npx tsc --noEmit && pnpm test
git log --oneline -1
cat docs/ios/P0-COMPLETION.md
```
