# P0-2 — Bearer-token auth for /api/ask/*

**Phase**: P0 · **Sequence**: 2 · **Executor**: Fable · **Prerequisites**: none (independent of P0-1).

## Read first

- `/Users/roman/Developer/physics/docs/ios/06-backend-changes.md` §3 (the patch spec: middleware, `lib/supabase-server.ts` helper, route updates, curl regression suite)
- `/Users/roman/Developer/physics/docs/ios/02-api-contracts.md` §7 (client-side contract this enables)
- `/Users/roman/Developer/physics/middleware.ts` (46 lines — cookie presence gate)
- `/Users/roman/Developer/physics/lib/supabase-server.ts` (`getSsrClient`, `getServiceClient`)
- `/Users/roman/Developer/physics/app/api/ask/stream/route.ts` + `app/api/ask/conversations/route.ts` + `app/api/ask/conversations/[id]/route.ts` + `app/api/ask/glossary-batch/route.ts` (current user resolution)

## Task

1. Implement the additive bearer path exactly per `06-backend-changes.md` §3: middleware accepts a well-formed `Authorization: Bearer` header as an alternative to the cookie presence check; new `getRequestClient(req)` (or the helper name spec'd in §3.2) that resolves the user from the bearer JWT via `supabase.auth.getUser(jwt)` first, falling back to the existing cookie/SSR path.
2. Update every `/api/ask/*` route to resolve the user through the helper. Mechanical; do not restructure the routes.
3. **The cookie path must remain byte-for-byte behaviorally identical.** The bearer branch is additive only.
4. Add the curl regression suite from §3.4 as a documented script `scripts/ios/verify-bearer-auth.sh` (env-driven: `TOKEN`, `BASE_URL`), so it can be re-run after any auth change.

## Do NOT

- Do not touch Turnstile, rate limiting, quota logic, or the SSE pipeline.
- Do not weaken auth: a garbage/expired bearer with no cookie must yield 401 from the route (middleware may pass it through on header presence — real validation is in-route, same as today's cookie flow).
- Do not add token issuance — tokens come from Supabase Auth directly (supabase-swift on iOS).

## Acceptance criteria

- `curl -N` with a valid Supabase access token streams `meta` → `text` → … → `done` on `/api/ask/stream` with **no cookies**.
- No credentials → 401 before the route body runs. Garbage bearer → 401 JSON `{error:"UNAUTHENTICATED"}`.
- Bearer works on GET/PATCH/DELETE conversations routes.
- Web browser chat (cookie path) still works — manually verified.
- `npx tsc --noEmit` clean.

## Verify

```bash
npx tsc --noEmit
pnpm dev &   # or use the deployed preview
# Get a token: node -e with supabase-js signInWithOtp/password for a test user (see 06 §3.4)
TOKEN=<jwt> BASE_URL=http://localhost:3000 bash scripts/ios/verify-bearer-auth.sh
# Then: open the site in a browser, sign in, send an ask message — cookie regression.
```
