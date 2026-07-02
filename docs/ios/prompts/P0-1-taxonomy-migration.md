# P0-1 — Taxonomy migration + publish script

**Phase**: P0 (backend prep, web repo) · **Sequence**: 1 of ~19 · **Executor**: Fable · **Prerequisites**: none.

## Read first

- `/Users/roman/Developer/physics/docs/ios/06-backend-changes.md` §1 (migration SQL — already drafted there) and §2 (publish script spec)
- `/Users/roman/Developer/physics/docs/ios/02-api-contracts.md` §4 (taxonomy contract the iOS client codes against)
- `/Users/roman/Developer/physics/lib/content/branches.ts` (registry: `BRANCHES` export — source of truth)
- `/Users/roman/Developer/physics/supabase/migrations/0012_scene_catalog_v2.sql` (migration style conventions)
- `/Users/roman/Developer/physics/scripts/content/publish.ts` (script conventions: env loading, service client)

## Task

1. Create `supabase/migrations/0013_ios_taxonomy_and_snapshots.sql` from the SQL in `06-backend-changes.md` §1: `taxonomy_branches`, `taxonomy_modules`, `taxonomy_topics`, the anon-readable live-only exposure (view `taxonomy_live` or RLS as spec'd), and `scene_catalog.snapshot_url` column. Adapt only if the spec conflicts with existing schema (report any adaptation).
2. Apply the migration to the live project (Supabase MCP token is dead — use `supabase db push` or `psql` per whatever workflow `supabase/` dir shows; if no CLI link exists, print the SQL and ask the user to run it in the dashboard SQL editor, then continue).
3. Create `scripts/content/publish-taxonomy.ts` per `06-backend-changes.md` §2: import `BRANCHES` from `lib/content/branches.ts`, upsert all three tables (idempotent, delete-then-insert or upsert with pruning of removed slugs), service-role client, DOTENV loading consistent with `publish.ts`.
4. Add `"content:publish-taxonomy": "tsx scripts/content/publish-taxonomy.ts"` to `package.json` scripts and run it.
5. Add a vitest test under `tests/content/taxonomy-sync.test.ts` that validates registry invariants the script depends on (unique slugs, every topic has a module that exists, statuses in the allowed set). Do NOT test against the live DB.

## Do NOT

- Do not add a `status` column to `content_entries` or modify existing tables beyond `scene_catalog.snapshot_url`.
- Do not change `lib/content/branches.ts` or any web rendering code.
- Do not expose non-live rows to `anon` by any path.

## Acceptance criteria

- Migration file exists, follows 0012's style, and has been applied.
- `pnpm content:publish-taxonomy` exits 0 and is idempotent (second run = no diff).
- Anon REST query of the live-only exposure returns exactly the live branches (currently 4: classical-mechanics, electromagnetism, thermodynamics, relativity) with ordered modules/topics incl. `eyebrow` + `reading_minutes`.
- A known non-live slug (any `status:'coming-soon'` topic from the registry) is absent from the live exposure.

## Verify

```bash
npx tsc --noEmit
pnpm test tests/content/taxonomy-sync.test.ts
pnpm content:publish-taxonomy && pnpm content:publish-taxonomy   # idempotent
# Anon read (key from .env.local NEXT_PUBLIC_SUPABASE_ANON_KEY):
curl -s "https://cpcgkkedcfbnlfpzutrc.supabase.co/rest/v1/taxonomy_live?select=*" \
  -H "apikey: $ANON" -H "Authorization: Bearer $ANON" | head -c 2000
# → live branches only; then probe one coming-soon slug → []
```
