# Priority 2 Session 1 — Implementation Log

**Date:** 2026-04-30
**Branch:** `feat/priority-2-session-1`
**Plan:** `docs/superpowers/plans/2026-04-30-priority-2-problem-sets-ai-feedback.md`
**Spec:** `docs/superpowers/specs/2026-04-30-priority-2-problem-sets-ai-feedback-design.md`
**Session focus:** Conversion funnel — typed problem registry, deterministic step verifier, LLM diagnoser, equation index pages, Claude-vision OCR — end-to-end on `kinematics-newton` + `oscillations` (8 topics, 40 problems). Documents the wave-based subagent playbook for future-session fanout.

## Final state

- **40 problems live** across 8 topics in `classical-mechanics`
- **40 equation index pages** (en strings shipped)
- **2119 vitest cases passing** (up from 1839 at branch cut → +280 new cases)
- **`pnpm tsc --noEmit` clean**
- **All 8 supabase tables populated:** problems (40), problem_topic_links (49), problem_strings (40 en), equations (40), equation_strings (40 en)
- 21 git commits ahead of `main`

## Wave-by-wave summary

### Wave 0 — Scaffold (~10 min, 1 commit)
- Added `Problem`, `ProblemStep`, `Equation`, `ProblemDifficulty` types to `lib/content/types.ts`
- Scaffolded empty `lib/content/problems.ts` and `lib/content/equations.ts` registries with helper getters (`getProblem`, `getProblemsForTopic`, `getProblemsByEquation`, `getEquation`, `getEquationsForTopic`)
- Applied `0010_problems_and_equations.sql` via Supabase MCP — 8 new tables (problems, problem_topic_links, problem_strings, equations, equation_strings, problem_attempts, diagnosis_cache, problem_diagnoses) + 2 user_billing columns + 3 RPCs (match_problem_from_ocr, increment_problem_diagnoses_used_today, increment_problem_ocr_used_today). All RLS-protected.
- Single commit `5a3bd3b`. Migration was idempotent (all `if not exists`, `or replace`, `drop policy if exists`).

### Wave 1 — Runtime (~25 min, 11 commits, 4 phases of subagent dispatch)

Subagent-driven execution with token-saving variant: per-task implementer with self-verification (vitest + tsc) in final report; no per-task spec/quality reviewer loops.

**Phase 1a (1 agent, sequential):**
- `lib/problems/normalize.ts` + `tests/problems/normalize.test.ts` — pre-parse normalizer (insert implicit *, lowercase trig, π → PI, unit/equals-tail strip). 10 tests.
- `lib/problems/verify.ts` + `tests/problems/verify.test.ts` — deterministic step verifier with mathjs numeric probing. Mulberry32 seeded RNG keyed by sha256(step.id) for reproducible sampling. 17 tests.

**Phase 1b (3 parallel agents):**
- `lib/problems/diagnoser.ts` + `tests/problems/diagnoser.test.ts` — Anthropic Sonnet 4.6 LLM diagnoser with global cross-user cache (sha256(stepId + ":" + normalized_expr) keyed). Cache hits don't decrement quota. 7 tests.
- `lib/problems/ocr.ts` + `tests/problems/ocr.test.ts` — Claude Sonnet 4.6 vision wrapper with catalog matcher (Supabase RPC `match_problem_from_ocr` with pg_trgm). Match threshold 0.7. 10 tests.
- `components/content/term.tsx` extended to fall back from GLOSSARY to EQUATIONS lookup, throws on unknown slug (preserves fail-loud invariant).

**Phase 1c (3 parallel agents):**
- `app/api/problems/[id]/check/route.ts` + tests — auth → quota → verify → maybe-diagnose → log. Returns `{ verify, diagnosis?, quotaExhausted? }`. 10 tests.
- `app/api/problems/ocr/route.ts` + tests — multipart upload, 5MB cap, plan-tiered quota (free 1/day, starter 10/day, pro unlimited). 10 tests.
- 5 React components in `components/problems/`: step-pad (the only stateful client component), step-row (presentational), equation-rail (server), problems-section (server, embedded on topic pages), photo-upload (client, mounts on /ask).

**Phase 1d (3 parallel agents):**
- `app/[locale]/(topics)/classical-mechanics/[topic]/problems/[problemId]/page.tsx` — SSG problem page route (renders 0 pages until Wave 2 populates registry).
- `app/[locale]/equations/[slug]/page.tsx` + `app/[locale]/equations/page.tsx` + `lib/problems/equation-strings.ts` — equation index landing + per-equation pages.
- `components/problems/photo-upload.tsx` mounted on `/ask` chat-screen toolbar.

**Phase 1e (orchestrator inline):**
- `package.json` `content:publish-problems` script entry added.

### Wave 2 — 8 parallel topic-authoring agents (~15 min wall clock, no commits)

Single-message parallel dispatch of 8 background subagents, one per topic in scope. Each agent: read existing `lib/physics/*` solver to inventory functions → designed 5 problems spanning easy/medium/hard/challenge/exam → wrote 5 solver files (importing & wrapping existing physics) + 5 vitest files (asserting every named intermediate against canonical) + 5 en-strings JSON → returned a `REGISTRY_BLOCK` of Problem entries + `EQUATION_SLUGS` list.

| Topic | Tests | Notes |
|---|---|---|
| motion-in-a-straight-line | 28 | clean schema, kinematic equations + relative-velocity-1d + quadratic-formula slugs |
| vectors-and-projectile-motion | 47 | clean schema, complementary-angles slug introduced |
| newtons-three-laws | 19 | clean schema, exam problem cross-tags `friction-and-drag` |
| friction-and-drag | 27 | clean schema, drag-force-linear/quadratic + terminal-velocity |
| the-simple-pendulum | 34 | report abbreviated steps to IDs only — orchestrator reconstructed full step objects from solver files at merge time |
| beyond-small-angles | 37 | clean schema, all canonical exprs in fundamental vars (mathjs has no elliptic_K — agent used Taylor series with toleranceRel up to 5e-3) |
| oscillators-everywhere | 43 | several `inputDomain: {}` cases on derived-symbol steps — fixed at merge by expanding canonical to fundamentals |
| damped-and-driven-oscillations | 45 | t_star step was numerical bisection (no closed-form) — dropped at merge; final answer reassigned |

**Total: 280 new vitest cases, all green.** Solidly past spec target of ≥270.

### Wave 2.5 — Merge + publish + per-topic commits (~10 min, 9 commits)

- Orchestrator merged all 8 REGISTRY_BLOCKs into `lib/content/problems.ts` with inline schema fixes (~6 steps had empty inputDomain or referenced derived symbols not in scope; expanded canonicalExpr to fundamental variables to give the verifier samplable scope).
- `pnpm content:publish-problems --kind problems` → 40 problems + 49 topic links (40 primary + 9 cross-tagged) + 40 problem_strings rows in Supabase.
- ProblemsSection embedded on all 8 topic pages via subagent edit pass (mechanical, ~1 min wall clock).
- 8 per-topic commits (`af4e292` through `e860d5b`) + 1 closeout commit (`3adc54b`) for the registry + publisher.

### Wave 3 — Equations + log (~10 min, 2 commits — i18n deferred)

- Single subagent authored 40 equation registry entries + 40 en strings JSON files. Equations grouped: 11 kinematics, 9 forces, 20 oscillations.
- `pnpm content:publish-problems --kind equations` → 40 equations + 40 equation_strings rows.
- This implementation log + roadmap update.

**Hebrew translation pass deferred to follow-up session** (see "Outstanding" below). The existing `scripts/content/translate.ts` operates on Supabase `content_entries` rows, not on JSON files in `messages/<locale>/**`. Adding a sibling `translate-strings.ts` is a small but separate piece of work; better to ship the en-only MVP and translate as a routine batch later.

## Architecture decisions made during execution

1. **Token-saving subagent variant** (matches Roman's documented preference from MemPalace `feedback_execution_style.md` — same pattern that shipped 28 RT topics in 3 sessions). Implementer subagents self-verify; no per-task spec/quality reviewer loops. Saved an estimated 60+ subagent invocations vs. strict subagent-driven-development.

2. **Phase 1 was 4 sequential phases of parallel dispatch**, not strict task-by-task. The 15 plan tasks were grouped by dependency:
   - Phase 1a: normalizer + verifier (foundation)
   - Phase 1b: diagnoser + OCR + Term fallback (parallel, all depend only on normalizer/registries)
   - Phase 1c: check route + ocr route + components (parallel, depend on Phase 1b)
   - Phase 1d: problem page + equation pages + PhotoUpload mount (parallel, depend on Phase 1c)

3. **Schema fixes during Wave 2.5 merge.** Several Wave 2 agents wrote canonical expressions referencing derived symbolic intermediates (e.g., `2*PI/omega_d`) without including those symbols in `inputDomain`. The verifier samples random values for variables in `inputDomain` and evaluates the canonical at those samples — references to undefined symbols produce parseError. Orchestrator fix: expand canonical to fundamental variables (e.g., `2*PI/sqrt(omega_0^2 - gamma^2/4)`). Affects ~6 steps across oscillators-everywhere and damped-and-driven-oscillations. Documented in commit `3adc54b`.

4. **Migration applied via MCP, not via Supabase CLI.** Used `mcp__physics-supabase__apply_migration` for the 215-line migration. Idempotent and verified via follow-up `execute_sql` queries. No data loss; purely additive.

5. **Per-topic commits + 1 closeout commit for shared files.** Plan called for 8 topic commits. Implemented as 8 commits for per-topic files (solvers + tests + strings + page edit) + 1 commit for the shared registry merge + publisher script. Cleaner blast radius for future rollback.

## Notable surprises

1. **Parallel git collisions during Phase 1b/1c.** Multiple agents staging via `git add <dir>` swept up files from sibling parallel agents, producing commits with mixed-scope subjects (e.g., `b7129da feat(problems): claude-vision OCR + catalog matcher` actually contains both OCR and diagnoser files). Cosmetic, not functional. Future: dispatch agents with explicit per-file `git add` lists rather than directory adds.

2. **Pendulum agent abbreviated REGISTRY_BLOCK** — listed step IDs as bare strings instead of full step objects. Orchestrator reconstructed from the solver source files (which had clear inline comments documenting each named intermediate). Lesson: per-agent prompt should EXPLICITLY require `steps[]` to be expanded to full ProblemStep objects in the report, not just IDs.

3. **mathjs has no `elliptic_K`** — beyond-small-angles agent correctly recognized this and used the Taylor series expansion (T_0·(1 + θ_0²/16 + 11θ_0⁴/3072)) for canonical expressions, with toleranceRel bumped to 1e-3 / 5e-3 / 5e-4 depending on amplitude. Solvers themselves use the exact `completeEllipticK` from `lib/physics/elliptic.ts`. Series-vs-exact divergence is well within tolerance for all sampled inputs.

4. **Damped-and-driven challenge `t_star` step was numerical bisection.** No closed-form, so canonical expression doesn't exist. Orchestrator dropped that step from the registry; finalAnswerStepId reassigned to `x_crit_2` (closed-form solution at the canonical input time).

## Decisions to carry forward to next sessions

1. **Per-agent prompt must require expanded REGISTRY_BLOCK** — `steps[]` as full ProblemStep objects, not bare ID strings.
2. **Per-agent prompt must require canonicalExpr in fundamental variables** — never reference derived intermediates from earlier steps unless they're also in inputDomain. This avoids the Wave 2.5 expansion fixup pass.
3. **Fanout playbook** — for each subsequent session (CM remaining 30 topics, then EM, RT, etc.), dispatch this exact recipe per module. Wave 0/1 are already shipped; sessions only need Wave 2 + 2.5 + 3.
4. **Hebrew translation pass** — first follow-up. Build `scripts/content/translate-strings.ts` (sibling to `translate.ts`) that walks `messages/en/{problems,equations}/**/*.json` and writes `messages/he/...` via Anthropic Sonnet. Then re-run `pnpm content:publish-problems --locale he`. ~30 min one-time work; runs as a routine after every future session.
5. **Token-saving variant continues to work cleanly** — 11+ subagents dispatched across Wave 1 + Wave 2 + Wave 3, zero rollbacks needed.

## Outstanding / known issues

- **Hebrew translation deferred** (see Wave 3 notes). Affects 80 problem-string files and 40 equation-string files. Bulk machine pass via Sonnet once a `translate-strings.ts` sibling exists.
- **Build smoke (curl 200s on the 40 problem URLs + 40 equation URLs)** — not run in this session; relying on `pnpm build` SSG validation. Worth a quick `pnpm dev` + curl pass before merging to main.
- **Photo OCR end-to-end test on a real homework image** — only mocked-vision tests exist. First real-world test is best done by Roman pointing the live `/ask` page at a real photo.
- **`Q_factor_ratio` step** in the damped-and-driven exam was renamed from the agent's `A_res / A_static` (algebraically `Q`) to the trivially equivalent `omega_0 / gamma` — same value, simpler verifier path. Documented in registry comment.

## Cross-refs

- Spec drawer in MemPalace: `physics/specs` (search "Priority 2 problem sets")
- Plan: `docs/superpowers/plans/2026-04-30-priority-2-problem-sets-ai-feedback.md`
- Verification log (Phase 1a/b/c/d → Wave 2.5 → Wave 3): commits `5a3bd3b` … `3adc54b` on `feat/priority-2-session-1`
