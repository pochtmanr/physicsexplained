# Thermodynamics completion sprint — 2026-06-20

Goal: finish branch §04 THERMODYNAMICS — 30 new topics (modules 1–8, FIG.01–30) —
to the same standard as Classical Mechanics, Electromagnetism, and Relativity.

The full curriculum already exists as narrative source material in
`docs/roadmap/03-thermodynamics.md` (8 modules, 30 topics, each with a hook,
7 sections, 2–3 named scenes, an aside physicist list, and a glossary list).
The syllabus rows are already in `lib/content/branches.ts`
(`THERMODYNAMICS_MODULES` / `THERMODYNAMICS_TOPICS`, all `status: "coming-soon"`).
Each session below turns one module of that roadmap into live content.

> **Note on the roadmap.** `docs/roadmap/03-thermodynamics.md` predates the
> finished relativity branch. Its "Patterns to reuse" section is **pre-migration**
> (hardcoded hex colors, `visualization-registry.tsx`, `useThemeColors` /
> `useAnimationFrame`). **Ignore that section's scene mechanics.** The current
> scene system is theme-token-based (`useSceneTokens` / `useSceneSize` /
> `applyDpr`, no hex) and scenes register in `lib/content/simulation-registry.ts`.
> The roadmap's *physics, hooks, section outlines, scene ideas, physicist bios,
> and glossary lists* are all still the source of truth — only its scene
> plumbing is stale. SHARED.md has the current contract.

## How to run

Run each session in its own fresh Claude Code session (each makes its own git
worktree + branch and works in isolation). Paste:

| # | Paste this |
|---|---|
| 1 | Read docs/prompts/2026-06-20-thermodynamics/session-1-temperature-and-heat.md and execute it fully. |
| 2 | Read docs/prompts/2026-06-20-thermodynamics/session-2-first-law.md and execute it fully. |
| 3 | Read docs/prompts/2026-06-20-thermodynamics/session-3-second-law.md and execute it fully. |
| 4 | Read docs/prompts/2026-06-20-thermodynamics/session-4-entropy-and-time.md and execute it fully. |
| 5 | Read docs/prompts/2026-06-20-thermodynamics/session-5-kinetic-theory.md and execute it fully. |
| 6 | Read docs/prompts/2026-06-20-thermodynamics/session-6-statistical-mechanics.md and execute it fully. |
| 7 | Read docs/prompts/2026-06-20-thermodynamics/session-7-phase-transitions.md and execute it fully. |
| 8 | Read docs/prompts/2026-06-20-thermodynamics/session-8-cold-frontier.md and execute it fully. |
| 9 | Read docs/prompts/2026-06-20-thermodynamics/session-9-cosmos-and-life.md and execute it fully. |

Each session creates its own git worktree + branch (`feat/thermo-s*`), works in
isolation, commits per topic, and never pushes or merges. Module 8
(`applications-and-the-third-law`, FIG.25–30) is split across sessions 8 and 9 for
load balance — they share one module in `branches.ts` but own disjoint topics and
references.

## After all sessions report done

1. Merge the 9 branches into `main`. Shared files (`glossary.ts`,
   `physicists.ts`, `simulation-registry.ts`) are append-only under per-session
   banner comments, so merges are mechanical; `branches.ts` only has per-topic
   `status:` flips. Resolve in favor of keeping every session's appended block.
2. Publish topic rows + reference seeds to Supabase:
   `DOTENV_CONFIG_PATH=.env.local pnpm content:publish` and
   `DOTENV_CONFIG_PATH=.env.local pnpm content:publish-seeds`.
3. Run the gates: `npx tsc --noEmit`, `pnpm test` (validateContentRefs + ref
   tests), `pnpm build`, and dev-server spot checks of a few `/en/thermodynamics/<slug>`
   pages in both themes.
4. Push `main` and deploy to Vercel production.
5. Verify `/en/thermodynamics` shows all 8 modules and 30 live topics, then clean
   up the worktrees (`git worktree remove …`).
6. **Optional polish (integration-time):** enrich the 12 already-existing
   physicists (Einstein, Maxwell, Joule, Helmholtz, Poisson, Bernoulli, Mach,
   Eddington, Kamerlingh Onnes, Bekenstein, Hawking, Galileo) with thermo
   back-links in their `relatedTopics`. Sessions intentionally do **not** touch
   existing entries (to avoid merge conflicts), so this is a single clean pass
   after the merge.

## Conflict-avoidance contract (enforced by SHARED.md)

- Topic / scene / physics files live in per-slug directories
  (`app/[locale]/(topics)/thermodynamics/<slug>/`,
  `components/physics/<slug>/`, `lib/physics/thermodynamics/<topic>.ts`) — no overlap.
- `glossary.ts` / `physicists.ts` / `simulation-registry.ts`: **append-only** at
  the end of the relevant array/object, under a session banner comment. Each new
  entry is owned by exactly one session. **Grep before you create** — never
  recreate a slug that already exists.
- `branches.ts`: each session flips only its own topics' `status:` lines from
  `"coming-soon"` to `"live"`. Touch nothing else.
- DB writes during a session: only `content:publish --only thermodynamics/<slug>`
  for your own slugs. Never publish another session's topics or the seeds.
