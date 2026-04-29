RESUME RT Session 2 — Wave 2 was partially terminated by the org's monthly usage limit on 2026-04-29. **Wave 0 + Wave 1 are committed and stable on main** (5ce3e3c + cd94373); **Wave 2 work is partially landed in the untracked working tree** (preserved). This conversation should: (1) inventory what survived, (2) finish Wave 2's missing pieces, (3) execute Wave 2.5 (registry merge + publish + per-topic commit, FIG order), (4) execute Wave 3 (seed run + curl smoke + spec progress 20/61 → 33% + MemPalace log), (5) only then move to Session 3 (§05+§06) — see the staged Session-3 prompt at the END of this file.

Plan: docs/superpowers/plans/2026-04-29-relativity-session-2-spacetime-geometry-dynamics.md — READ THIS FIRST. The Wave 2 shared instructions (~lines 509–611) and per-topic Tasks 3–12 (~lines 613–1196) are still authoritative. Wave 2.5 + Wave 3 sections also unchanged.

What landed (committed):
— 5ce3e3c — feat(rt/§03-§04): promote 10 topics to live, extend types with interval + four-momentum helpers (Wave 0)
— cd94373 — feat(rt/§03-§04): scaffold seed-rt-02 — Compton, glossary, related-topic links (Wave 1)

What landed (untracked working tree, NOT committed):
— `lib/physics/relativity/`: ALL 10 §03+§04 physics-libs written by their respective Wave 2 agents.
   `spacetime-diagram.ts`, `invariant-interval.ts`, `light-cone.ts`, `four-vectors.ts`, `twin-paradox.ts`,
   `four-momentum.ts`, `mass-energy.ts`, `relativistic-collision.ts`, `compton.ts`, `pair-production.ts`.
   Each ~2–6 KB. **Verify each compiles and matches its plan-spec function signatures before trusting.**
— `tests/physics/relativity/`: 9 of 10 test files (missing `pair-production.test.ts` — Task 12 didn't reach it).
   Verify each was actually populated (not stub) and runs green.
— `components/physics/<slug>/`: 17 of ~30 expected scenes. Per-topic counts:
   spacetime-diagrams 3/3, the-twin-paradox 3/3, the-invariant-interval 2/3, light-cones-and-causality 2/3,
   four-vectors-and-proper-time 2/3, four-momentum 2/3, mass-energy-equivalence 1/3, compton-scattering 1/3,
   relativistic-collisions 0/3, threshold-energy-and-pair-production 0/3.
— `app/[locale]/(topics)/relativity/`: ONLY 1 of 10 page.tsx + content.en.mdx pair (spacetime-diagrams).
   The MDX is 1515 words (slightly over plan's 1000–1200 target — review and trim, or accept).

Recovery protocol — run in order:

1. **Inventory** — `git status --short` should still show all 30+ untracked files. Verify spacetime-diagrams is truly complete (lib + test + 3 scenes + page.tsx + MDX) and the other 9 topics' partial state.

2. **Finish Wave 2 — re-dispatch agents for the missing pieces.** The org limit resets monthly; if it has reset, dispatch ONE agent per partial topic (NOT all 10 — there are now far fewer files to write per topic, so a single agent can handle each "finish topic X" task in a few minutes). For each topic, the agent's deliverable is whichever of the 5 vertical-slice files is missing:
   — spacetime-diagrams: review-only (already complete; verify quality, possibly trim MDX). No new files.
   — the-twin-paradox: only page.tsx + MDX missing (3/3 scenes already there). LIGHTEST recovery.
   — the-invariant-interval, light-cones-and-causality, four-vectors-and-proper-time, four-momentum: 1 missing scene + page.tsx + MDX each.
   — mass-energy-equivalence, compton-scattering: 2 missing scenes + page.tsx + MDX each.
   — relativistic-collisions: 3 missing scenes + page.tsx + MDX (no scenes were written).
   — threshold-energy-and-pair-production: missing test + 3 scenes + page.tsx + MDX (only physics-lib was written).
   Each agent's prompt should mirror the original Wave 2 prompt template but include "the physics-lib at lib/physics/relativity/<slug>.ts is already written by a previous run — do NOT regenerate it; complete the missing files only." This is a much smaller per-agent task; the limit budget should easily allow it.

3. **Wave 2.5** — orchestrator-serial registry merge + publish + per-topic commit, FIG.11 → FIG.20 order. Each topic: append REGISTRY_BLOCK (which the Wave-2-finish agents return), `pnpm tsc --noEmit` clean check, `pnpm content:publish --only relativity/<slug>` (expect `1 added`), `git commit` per topic with the agent's COMMIT_SUBJECT. **§04.1 four-momentum should publish first if any LaTeX risk surfaces** (densest LaTeX of session). Sessions 1+2 confirmed `\begin{pmatrix}` clean, but verify for the boost matrix.

4. **Wave 3** — seed run + smoke + spec + MemPalace log per the original plan's Wave 3 (Task 13 lines ~1198 onward).
   (a) `grep -rohE '<Term slug="[^"]+"' app/\[locale\]/\(topics\)/relativity/ | sort -u` to scan for forward-refs not in glossary.ts as of cd94373; patch seed-rt-02.ts if needed.
   (b) `pnpm exec tsx --conditions=react-server scripts/content/seed-rt-02.ts` — expect 1 physicist (Compton) + 17 glossary entries inserted on first run.
   (c) `pnpm tsc --noEmit && pnpm vitest run` — both green.
   (d) `pnpm build 2>&1 | tail -50` — clean; 10 new RT routes for en + he in SSG.
   (e) Curl smoke 28 routes on port 3001 (10 topics + Compton + 17 glossary; see plan's Wave 3 Step 5).
   (f) Update spec progress: `**Status:** in progress — 20/61 topics shipped (33%); §01+§02+§03+§04 shipped 2026-04-29`. Module status table: §03 + §04 marked complete; total 20/61.
   (g) MemPalace implementation log to `wing=physics, room=decisions, file=implementation_log_rt_session_2_spacetime_geometry_dynamics.md` per plan's Wave 3 Step 7 (cover the 10 questions a–j).
   (h) Two final commits: chore(rt/§03-§04) seed + docs(rt/§03-§04) spec.

5. **Only after Session 2 closes cleanly**, move to Session 3. The Session 3 prompt is staged below the divider in this file; use it as the next prompt.md (overwrite this recovery prompt with that content once Session 2's MemPalace log is filed).

CRITICAL gotchas (still active — same as the original plan):
— `paragraphsToBlocks` MUST be flat string[] — copy verbatim from seed-rt-01.ts.
— HTML entities (`&gt;`, `&lt;`, `&amp;`) DON'T decode inside `$...$` math — use literal characters.
— `<Term>` and `<PhysicistLink>` MUST be inline in a paragraph, NEVER block-level.
— `\begin{pmatrix}` is confirmed clean (Session 1 + 2 lessons) — use freely; fall back to `\begin{aligned}` only if needed.
— Pre-existing dirty files (`components/layout/mobile-nav.tsx`, `prompt.md`) — DO NOT touch.
— Branch is main; commit directly per `feedback_execution_style.md`. Token-saving variant of subagent-driven-development.

When Session 2 closes, end-of-session deliverables (unchanged from original plan):
— 10 new topics live at /en/relativity/<slug> for slugs FIG.11–20 (200 OK on all 10)
— Arthur Compton + 17 glossary entries in Supabase
— Spec progress 20/61 (33%)
— MemPalace log filed
— Total commits this session (including Wave 0 + Wave 1 already landed): target 14, give-or-take a mid-flight fix.

═══════════════════════════════════════════════════════════════════════════════
STAGED FOR NEXT SESSION (overwrite this file with the content below once Session 2 closes):
═══════════════════════════════════════════════════════════════════════════════

Start RT Session 3 — ship §05 SR Applications + Paradoxes + §06 The Equivalence Principle (8 topics, FIG.21–28). RELATIVITY branch is already live (Session 1 shipped §01+§02 = FIG.01–10; Session 2 shipped §03+§04 = FIG.11–20). This is the third of six RT sessions; **SR is fully done at end of Session 3 (28/61, 46%); GR begins in Session 4** with §07 tensor calculus. The pair this session — §05 (the SR victory lap: barn-pole "paradox," Bell's spaceship, GPS as a working relativity experiment, precision Lorentz-invariance tests) and §06 (the equivalence principle as the GR bridge: inertial vs gravitational mass, Einstein's elevator, gravitational redshift, gravity-as-geometry) — is the SR-closing module + GR-on-ramp.

Spec: docs/superpowers/specs/2026-04-29-relativity-branch-design.md — READ §05 + §06 + Voice + Calculus policy + Integration checklist + Risk notes + Slug-collision watch first.
Spec progress is 20/61 (33%) entering this session; update to 28/61 (46%) at session end.

Workflow: write Session 3 plan via /superpowers:writing-plans mirroring RT-Session-2 (5-wave structure: Wave 0 promote-to-live + types decision; Wave 1 seed-rt-03.ts with Eötvös + Pound-Rebka + ~8–10 glossary terms; Wave 1.5 SKIP; Wave 2 dispatch 8 parallel per-topic agents; Wave 2.5 orchestrator publish+commit FIG.21→28; Wave 3 seed + smoke + spec + MemPalace log). Then execute via /superpowers:subagent-driven-development token-saving variant, no per-task review.

Topics:
§05: the-barn-pole-paradox, bells-spaceship-paradox, gps-as-relativity (§05 money shot — SR -7 + GR +45 = +38 μs/day), precision-tests-of-sr.
§06: inertial-vs-gravitational-mass, einsteins-elevator, gravitational-redshift (§06 money shot — Pound-Rebka 1960), gravity-as-geometry (§06 honest moment — bridges to §07).

New physicists: Roland Eötvös (1848–1919) for §06.1; Pound + Rebka combined (1960 Harvard tower) for §06.3. ~2 new entries.

New glossary terms (~8–10): barn-pole-paradox, bell-spaceship-paradox, born-rigidity, gps-correction, precision-lorentz-tests, equivalence-principle, weak-equivalence-principle, einstein-equivalence-principle, eotvos-parameter, mossbauer-effect.

Critical voice: §05 is the SR celebration; §06 is the GR on-ramp. The §06.4 closer should land on "gravity is the geometry, not a force" with a `<Callout variant="intuition">` and forward-link to §07 manifolds + metric tensor as plain Markdown.

Money shots:
— §05.3 gps-as-relativity: orbital animation + two clock corrections + "drift if uncorrected ~11 km/day" gauge.
— §06.3 gravitational-redshift: Pound-Rebka tower cross-section + Mössbauer absorber resonance + observed-vs-predicted 2.46 × 10⁻¹⁵ shift readout.

Honest moment: §06.4 gravity-as-geometry — "There is no force called gravity. There is curvature, and free-falling along curvature looks like falling. The next module formalizes that geometry."

Slug-collision watch: `gravitational-redshift` topic vs glossary slug — coexist per Sessions 1+2 precedent (no -term suffix).

End-of-session deliverables: 8 topics live at FIG.21–28; Eötvös + Pound-Rebka in PHYSICISTS; ~8–10 glossary entries; spec 28/61 (46%) — SR fully complete; MemPalace log to implementation_log_rt_session_3_sr_applications_equivalence_principle.md.

Next session after this: §07 Curved Spacetime + Tensor Calculus (5 topics, FIG.29–33). Densest math of the branch. Money shot: christoffels-and-parallel-transport with the spherical-triangle holonomy reveal. Strongly consider Wave 1.5 ManifoldCanvas primitive.
