# Relativity completion sprint — 2026-06-06

Goal: finish branch §03 RELATIVITY — 23 new topics (modules §09–§13) + polish
pass on the existing 38 — to the same standard as Classical Mechanics and EM.

## How to run

Open 6 parallel Claude Code sessions in `/Users/roman/Developer/physics` and
paste one line into each:

| # | Paste this |
|---|---|
| 1 | Read docs/prompts/2026-06-06-relativity/session-1-schwarzschild.md and execute it fully. |
| 2 | Read docs/prompts/2026-06-06-relativity/session-2-black-holes.md and execute it fully. |
| 3 | Read docs/prompts/2026-06-06-relativity/session-3-grav-waves.md and execute it fully. |
| 4 | Read docs/prompts/2026-06-06-relativity/session-4-cosmology.md and execute it fully. |
| 5 | Read docs/prompts/2026-06-06-relativity/session-5-frontiers.md and execute it fully. |
| 6 | Read docs/prompts/2026-06-06-relativity/session-6-polish.md and execute it fully. |

Each session creates its own git worktree + branch (`feat/relativity-s*`),
works in isolation, commits per topic, and never pushes or merges.

## After all sessions report done

Return to the main session and say "integrate". It will:
1. Merge the 6 branches into `main` (shared files are append-only by
   convention, so conflicts are mechanical).
2. Publish topic rows (`content:publish`) and reference seeds
   (`content:publish-seeds`) to Supabase.
3. Run gates: `tsc --noEmit`, `pnpm test` (includes `validateContentRefs`),
   `pnpm build`, dev-server spot checks.
4. Push `main` and deploy to Vercel production.
5. Verify `/en/relativity` shows all 13 modules live, then clean up worktrees.

## Conflict-avoidance contract (enforced by SHARED.md)

- Topic/scene/physics files live in per-slug directories — no overlap.
- `glossary.ts` / `physicists.ts`: append-only at array end under a session
  banner comment; each entry owned by exactly one session (ownership tables in
  the session files).
- `branches.ts`: each session flips only its own topics' `status:` lines.
- DB writes during sessions: only `content:publish --only relativity/<slug>`
  (the product's normal authoring flow). Seeds are published at integration.
