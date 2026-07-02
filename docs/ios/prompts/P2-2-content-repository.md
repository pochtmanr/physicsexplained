# P2-2 — PXAPI: SupabaseService + ContentRepository (GRDB)

**Phase**: P2 · **Sequence**: 8 · **Executor**: Opus 4.8 · **Prerequisites**: P2-1.

## Read first

- `/Users/roman/Developer/physics/docs/ios/02-api-contracts.md` §1 (Supabase basics), §2 (queries), §4 (taxonomy_live), §9 (ImageURLResolver rules)
- `/Users/roman/Developer/physics/docs/ios/01-architecture.md` §2 (PXAPI deps), §4 (actor conventions)
- `/Users/roman/Developer/physics/lib/content/fetch.ts` (web's fetch + en-fallback behavior to mirror)

## Task

1. `SupabaseService` (PXAPI): wraps supabase-swift, configured from PXFoundation's `AppEnvironment` (URL/anon key from plist — never literals). Exposes PostgREST reads used at MVP: taxonomy (live view, ordered), `contentEntry(kind:slug:locale:)` with the web's en-fallback semantics (try locale row, fall back to `en`, surface a `localeFallback` flag), scene catalog (all rows, and by id).
2. `ContentRepository` actor: GRDB `DatabaseQueue` at Application Support; tables `taxonomy_cache`, `content_entry_cache`, `scene_catalog_cache`, `sync_meta` (raw JSON columns + key columns + fetched_at). Policy: **cache-then-network** — emit cached value if present, refresh in background, expose `AsyncStream`/async API the view models consume; staleness window 24h for taxonomy/catalog, per-entry refresh on open.
3. `ImageURLResolver` per §9: `/images/...` and other `/`-prefixed → web origin (config value `webBaseURL` in the plist); bare storage paths → `storage/v1/object/public/images/<path>`; already-absolute URLs pass through. Unit-test all cases from §9.
4. Configure the shared Nuke pipeline (disk cache sized for snapshots).
5. Tests (PXAPITests, no network): GRDB round-trip (store/load entry + taxonomy), resolver cases, en-fallback logic against stubbed service responses (protocol-based stub, not a mock framework).

## Do NOT

- No UI. No auth flows (P5). Do not query `content_entries` for listings — listings come ONLY from the taxonomy live view (draft-leak rule, Risk R2).
- Do not cache draft/unpublished anything: what taxonomy doesn't list, the app never fetches.

## Acceptance criteria

- `swift test` green incl. new PXAPITests.
- A tiny debug harness (temporary Gallery row is fine) fetches the live taxonomy and one real topic (`classical-mechanics/the-simple-pendulum`) on simulator — verified by log output.
- Airplane-mode relaunch serves both from GRDB (manual check, log-verified).

## Verify

```bash
swift test --package-path ios/PhysicsPackages --filter 'PXAPITests|PXModelTests'
xcodebuild -project ios/PhysicsExplained.xcodeproj -scheme PhysicsExplained \
  -destination 'platform=iOS Simulator,name=iPhone 17 Pro' build
```
