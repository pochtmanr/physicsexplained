# RT Session 1 — §01 SR Foundations + §02 SR Kinematics Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (token-saving variant per `feedback_execution_style.md`) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Open the third fully-authored branch on `physics.explained` — RELATIVITY — and ship all 10 topics in §01 SR Foundations + §02 SR Kinematics at the existing CM/EM Distill.pub bar. Branch flips from `coming-soon` to `live`. Spec progress moves 0/61 → 10/61 (16%).

**Architecture:** Six waves. Wave 0 = serial branch-flip + 13-module + 61-topic-stub registry + types module. Wave 1 = serial seed scaffold (Michelson + ~10 glossary terms). Wave 1.5 = serial `SpacetimeDiagramCanvas` primitive build (RECOMMENDED — amortizes across §01.5 + §02.1 + §02.3 this session and §03.5 twin-paradox + §03.1 spacetime-diagrams next session). Wave 2 = 10 parallel per-topic subagents authoring physics-lib + tests + scenes + page.tsx + content.en.mdx. Wave 2.5 = orchestrator-serial registry-merge + publish + per-topic commit. Wave 3 = seed run + curl smoke + spec progress update + MemPalace log. Pattern matches EM Sessions 1, 4, 7, 8 with branch-flip semantics from EM-Session-1.

**Tech Stack:** Next.js 15 (App Router), React 19, TypeScript strict, Tailwind v4, MDX (`@next/mdx`), Canvas 2D for visualizations, Supabase `content_entries` (project `cpcgkkedcfbnlfpzutrc`), Vitest, KaTeX via rehype-katex.

**Spec:** `docs/superpowers/specs/2026-04-29-relativity-branch-design.md` — read §01 + §02 + Voice + Calculus policy + Integration checklist + Risk notes + Slug-collision watch before starting.

**Prerequisite reading for subagents:**
- `docs/superpowers/plans/2026-04-22-electromagnetism-session-1-electrostatics.md` — canonical "scaffold a new branch + ship first module" plan to mirror.
- `docs/superpowers/plans/2026-04-25-electromagnetism-session-7-em-relativity.md` — the most recent SR-prerequisite plan (§11.4 magnetism-as-relativistic-electrostatics taught length contraction + Lorentz boost inline; RT §02 is the canonical treatment those inlines pointed at).
- MemPalace `wing=physics, room=decisions`: `implementation_log_em_session_1_electrostatics.md` (canonical session-1 patterns), `implementation_log_em_session_7_em_relativity.md` (most recent SR-relevant log; documents the `relativity.ts` types module and the four-vector home), `implementation_log_em_session_8_foundations.md` (most recent shipped session — parallel-dispatch contract, publish-CLI status, MDX-authoring rule set).

---

## ⚠️ BLOCKER QUESTION (resolve before Wave 0 commit)

The spec body specifies:

```ts
{ slug: "relativity", index: 3, eyebrow: "§ 03", subtitle: "The geometry of moving and falling.", ... }
```

Current `lib/content/branches.ts:987-998` has relativity at `index: 4`, `eyebrow: "§ 04"`, with thermodynamics occupying index 3. Two options:

**Option A (recommended — matches spec):** Reorder `BRANCHES` array so RELATIVITY slots between ELECTROMAGNETISM and THERMODYNAMICS. Update `relativity` to `index: 3`, `eyebrow: "§ 03"`. Bump `thermodynamics` to `index: 4`, `eyebrow: "§ 04"`; `quantum` to `5` / "§ 05"; `modern-physics` to `6` / "§ 06". Pedagogical order CM → EM → RT → Thermo → Quantum → Modern is natural.

**Option B:** Keep current array order. Override spec — flip status and update modules/topics, but leave `index: 4` / `eyebrow: "§ 04"` on RT. No other branch entries change.

**Default if Roman doesn't override:** Option A. Eyebrow "§ 03" matches spec, every reference in this plan + the seed script + the subtitle in `branches-section.tsx` etc. assumes "§ 03". If Option B is chosen, do a global s/§ 03/§ 04/ on the plan and seed before starting Wave 0.

---

## File structure

### New files (Wave 0)
- `lib/physics/relativity/types.ts` — `Vec4`, `MinkowskiPoint`, `Worldline`, `LorentzMatrix`, `boostX`/`boostY`/`boostZ`/`rotation` builders.
- `tests/physics/relativity/types.test.ts` — vitest suite for the type builders.

### New files (Wave 1)
- `scripts/content/seed-rt-01.ts` — mirrors `seed-em-07.ts` exactly. 1–2 physicists (Michelson + optional Morley) + ~10 glossary terms + forward-ref placeholders.

### New files (Wave 1.5 — RECOMMENDED, build it)
- `components/physics/_shared/SpacetimeDiagramCanvas.tsx` — Minkowski diagram primitive: lab/boosted axes, worldlines, light cones, simultaneity slices, β slider.
- `components/physics/_shared/SpacetimeDiagramCanvas.test.tsx` — render-smoke test + worldline-transform unit tests.
- `components/physics/_shared/README.md` — usage docstring + API table.
- `components/physics/_shared/index.ts` — re-export.

### New files (Wave 2 — 10 topics × 5 files = ~50 new files + ~30 simulation scenes)

Per-topic shape (substitute `<slug>` per topic):
- `lib/physics/relativity/<topic>.ts`
- `tests/physics/relativity/<topic>.test.ts`
- `components/physics/<topic>/<Scene1>.tsx` × 3 scenes per topic
- `app/[locale]/(topics)/relativity/<slug>/page.tsx`
- `content/relativity/<slug>.en.mdx`

Topic slugs (FIG.01–10):

§01 SR Foundations:
- FIG.01 `galilean-relativity`
- FIG.02 `maxwell-and-the-speed-of-light`
- FIG.03 `michelson-morley` (§01 money shot)
- FIG.04 `einsteins-two-postulates`
- FIG.05 `relative-simultaneity` (§01 honest-moment apex; uses `SpacetimeDiagramCanvas`)

§02 SR Kinematics:
- FIG.06 `time-dilation` (§02 money shot; uses `SpacetimeDiagramCanvas`)
- FIG.07 `length-contraction`
- FIG.08 `the-lorentz-transformation` (uses `SpacetimeDiagramCanvas`; densest LaTeX of session)
- FIG.09 `velocity-addition`
- FIG.10 `relativistic-doppler`

### Modified files (Wave 0 + Wave 1)
- `lib/content/branches.ts` — add `RELATIVITY_MODULES` (13 entries) + `RELATIVITY_TOPICS` (61 entries: 10 `live`, 51 `coming-soon`); flip relativity branch to `live`; update eyebrow + subtitle + description per spec; reorder per Option A unless Roman picks Option B.
- `lib/content/physicists.ts` — add Albert Michelson (combined-with-Morley default); append `relatedTopics` to existing Einstein, Lorentz, Poincaré, Minkowski, Fizeau, Foucault, Doppler, Maxwell.
- `lib/content/glossary.ts` — add up to 10 net new terms (after dedup against EM §11 contributions); cross-link existing entries.
- `components/sections/branches-section.tsx` — only if it currently hardcodes "two branches live"; update to "three" / drop the count. (Confirm at Wave 0 grep time.)

### Modified files (Wave 2.5)
- `lib/content/simulation-registry.ts` — append ~30 new scene entries (10 topics × 3 scenes), one section per topic.

### Modified files (Wave 3)
- `docs/superpowers/specs/2026-04-29-relativity-branch-design.md` — flip 10 checkboxes; update Module status table; update header status line; update Total to 10/61 (16%).

---

## Wave 0 — Branch flip + types scaffold (1 subagent, serial)

**Single agent. ~10 min runtime.**

### Task 1: Flip RT branch to live + add modules/topics + types

**Files:**
- Modify: `/Users/romanpochtman/Developer/physics/lib/content/branches.ts`
- Create: `/Users/romanpochtman/Developer/physics/lib/physics/relativity/types.ts`
- Create: `/Users/romanpochtman/Developer/physics/tests/physics/relativity/types.test.ts`

- [ ] **Step 1: Confirm BLOCKER QUESTION resolution.**

If executing this plan: confirm Option A vs Option B with Roman before any commits. Default Option A unless Roman says otherwise. If Option A, the BRANCHES array reorders; if Option B, only the `relativity` entry changes.

- [ ] **Step 2: Add `RELATIVITY_MODULES` and `RELATIVITY_TOPICS` constants**

Open `lib/content/branches.ts`. Find the `ELECTROMAGNETISM_MODULES` declaration for structural reference. Above the `BRANCHES` export, immediately after `ELECTROMAGNETISM_TOPICS`, add:

```typescript
const RELATIVITY_MODULES: readonly Module[] = [
  { slug: "sr-foundations", title: "SR Foundations", index: 1 },
  { slug: "sr-kinematics", title: "SR Kinematics", index: 2 },
  { slug: "spacetime-geometry", title: "Spacetime Geometry", index: 3 },
  { slug: "relativistic-dynamics", title: "Relativistic Dynamics", index: 4 },
  { slug: "sr-applications", title: "SR Applications and Paradoxes", index: 5 },
  { slug: "equivalence-principle", title: "The Equivalence Principle", index: 6 },
  { slug: "tensor-calculus", title: "Curved Spacetime and Tensor Calculus", index: 7 },
  { slug: "curvature-and-efe", title: "Riemann Curvature and Einstein's Equations", index: 8 },
  { slug: "schwarzschild-and-tests", title: "Schwarzschild and the Classical Tests", index: 9 },
  { slug: "black-holes", title: "Black Holes", index: 10 },
  { slug: "gravitational-waves", title: "Gravitational Waves", index: 11 },
  { slug: "cosmology", title: "Cosmology", index: 12 },
  { slug: "frontiers", title: "Frontiers", index: 13 },
];

const RELATIVITY_TOPICS: readonly Topic[] = [
  // §01 SR Foundations — FIG.01–05 (live)
  { slug: "galilean-relativity", title: "GALILEAN RELATIVITY AND THE FRAME PROBLEM", eyebrow: "FIG.01 · SR FOUNDATIONS", subtitle: "Why Newton's universe needed an observer who never moved.", readingMinutes: 9, status: "live", module: "sr-foundations" },
  { slug: "maxwell-and-the-speed-of-light", title: "MAXWELL AND THE SPEED OF LIGHT", eyebrow: "FIG.02 · SR FOUNDATIONS", subtitle: "The constant hiding in two SI numbers, and what it didn't depend on.", readingMinutes: 10, status: "live", module: "sr-foundations" },
  { slug: "michelson-morley", title: "THE MICHELSON-MORLEY EXPERIMENT", eyebrow: "FIG.03 · SR FOUNDATIONS", subtitle: "An interferometer asks the wind which way it blows, and gets no answer.", readingMinutes: 11, status: "live", module: "sr-foundations" },
  { slug: "einsteins-two-postulates", title: "EINSTEIN'S TWO POSTULATES", eyebrow: "FIG.04 · SR FOUNDATIONS", subtitle: "Drop one assumption, take one fact at face value, get a new universe.", readingMinutes: 10, status: "live", module: "sr-foundations" },
  { slug: "relative-simultaneity", title: "THE RELATIVITY OF SIMULTANEITY", eyebrow: "FIG.05 · SR FOUNDATIONS", subtitle: "Two lightning bolts strike — and the train passenger disagrees with you about which came first.", readingMinutes: 11, status: "live", module: "sr-foundations" },
  // §02 SR Kinematics — FIG.06–10 (live)
  { slug: "time-dilation", title: "TIME DILATION", eyebrow: "FIG.06 · SR KINEMATICS", subtitle: "Why a moving clock ticks slower — and why this is not an illusion.", readingMinutes: 12, status: "live", module: "sr-kinematics" },
  { slug: "length-contraction", title: "LENGTH CONTRACTION", eyebrow: "FIG.07 · SR KINEMATICS", subtitle: "Why a moving rod is shorter — and why no one moving with it can tell.", readingMinutes: 11, status: "live", module: "sr-kinematics" },
  { slug: "the-lorentz-transformation", title: "THE LORENTZ TRANSFORMATION", eyebrow: "FIG.08 · SR KINEMATICS", subtitle: "The four lines of algebra that replaced Galileo.", readingMinutes: 13, status: "live", module: "sr-kinematics" },
  { slug: "velocity-addition", title: "RELATIVISTIC VELOCITY ADDITION", eyebrow: "FIG.09 · SR KINEMATICS", subtitle: "Why nothing made of matter ever crosses 299,792,458 m/s.", readingMinutes: 11, status: "live", module: "sr-kinematics" },
  { slug: "relativistic-doppler", title: "THE RELATIVISTIC DOPPLER EFFECT", eyebrow: "FIG.10 · SR KINEMATICS", subtitle: "What the source's color tells you about its motion through spacetime.", readingMinutes: 11, status: "live", module: "sr-kinematics" },
  // §03 Spacetime geometry — FIG.11–15 (coming-soon)
  { slug: "spacetime-diagrams", title: "SPACETIME DIAGRAMS AND WORLDLINES", eyebrow: "FIG.11 · SPACETIME GEOMETRY", subtitle: "Draw a clock's life as a single line on a piece of paper.", readingMinutes: 11, status: "coming-soon", module: "spacetime-geometry" },
  { slug: "the-invariant-interval", title: "THE INVARIANT INTERVAL", eyebrow: "FIG.12 · SPACETIME GEOMETRY", subtitle: "The one quantity every observer must agree on.", readingMinutes: 12, status: "coming-soon", module: "spacetime-geometry" },
  { slug: "light-cones-and-causality", title: "LIGHT CONES AND CAUSALITY", eyebrow: "FIG.13 · SPACETIME GEOMETRY", subtitle: "The shape spacetime gives \"before\" and \"after\" — and \"neither.\"", readingMinutes: 11, status: "coming-soon", module: "spacetime-geometry" },
  { slug: "four-vectors-and-proper-time", title: "FOUR-VECTORS AND PROPER TIME", eyebrow: "FIG.14 · SPACETIME GEOMETRY", subtitle: "The invariant heartbeat of every traveler in spacetime.", readingMinutes: 12, status: "coming-soon", module: "spacetime-geometry" },
  { slug: "the-twin-paradox", title: "THE TWIN PARADOX", eyebrow: "FIG.15 · SPACETIME GEOMETRY", subtitle: "The longest worldline in spacetime is also the shortest in proper time.", readingMinutes: 13, status: "coming-soon", module: "spacetime-geometry" },
  // §04 Relativistic dynamics — FIG.16–20 (coming-soon)
  { slug: "four-momentum", title: "FOUR-MOMENTUM", eyebrow: "FIG.16 · RELATIVISTIC DYNAMICS", subtitle: "Energy and momentum, packaged into one object that transforms as a vector.", readingMinutes: 12, status: "coming-soon", module: "relativistic-dynamics" },
  { slug: "mass-energy-equivalence", title: "MASS-ENERGY EQUIVALENCE", eyebrow: "FIG.17 · RELATIVISTIC DYNAMICS", subtitle: "Why a hot cup of coffee weighs more than a cold one.", readingMinutes: 13, status: "coming-soon", module: "relativistic-dynamics" },
  { slug: "relativistic-collisions", title: "RELATIVISTIC COLLISIONS", eyebrow: "FIG.18 · RELATIVISTIC DYNAMICS", subtitle: "Conservation of four-momentum, and what changes when speeds get high.", readingMinutes: 12, status: "coming-soon", module: "relativistic-dynamics" },
  { slug: "compton-scattering", title: "COMPTON SCATTERING", eyebrow: "FIG.19 · RELATIVISTIC DYNAMICS", subtitle: "The 1923 experiment that finally made photons mechanical.", readingMinutes: 11, status: "coming-soon", module: "relativistic-dynamics" },
  { slug: "threshold-energy-and-pair-production", title: "THRESHOLD ENERGY AND PAIR PRODUCTION", eyebrow: "FIG.20 · RELATIVISTIC DYNAMICS", subtitle: "Why a 1.022 MeV gamma ray can become two electrons but a 511 keV one cannot.", readingMinutes: 12, status: "coming-soon", module: "relativistic-dynamics" },
  // §05 SR applications — FIG.21–24 (coming-soon)
  { slug: "the-barn-pole-paradox", title: "THE BARN-POLE PARADOX", eyebrow: "FIG.21 · SR APPLICATIONS", subtitle: "Two observers, two answers, no contradiction.", readingMinutes: 11, status: "coming-soon", module: "sr-applications" },
  { slug: "bells-spaceship-paradox", title: "BELL'S SPACESHIP PARADOX", eyebrow: "FIG.22 · SR APPLICATIONS", subtitle: "A string between two synchronized rockets, and the geometry that snaps it.", readingMinutes: 11, status: "coming-soon", module: "sr-applications" },
  { slug: "gps-as-relativity", title: "GPS AS A WORKING RELATIVITY EXPERIMENT", eyebrow: "FIG.23 · SR APPLICATIONS", subtitle: "Without two corrections, your position drifts ten kilometers a day.", readingMinutes: 12, status: "coming-soon", module: "sr-applications" },
  { slug: "precision-tests-of-sr", title: "PRECISION TESTS OF LORENTZ INVARIANCE", eyebrow: "FIG.24 · SR APPLICATIONS", subtitle: "What happens when a theory survives a hundred years of being checked.", readingMinutes: 11, status: "coming-soon", module: "sr-applications" },
  // §06 Equivalence principle — FIG.25–28 (coming-soon)
  { slug: "inertial-vs-gravitational-mass", title: "INERTIAL VS GRAVITATIONAL MASS", eyebrow: "FIG.25 · EQUIVALENCE PRINCIPLE", subtitle: "Why two completely different definitions give the same number to thirteen decimal places.", readingMinutes: 12, status: "coming-soon", module: "equivalence-principle" },
  { slug: "einsteins-elevator", title: "EINSTEIN'S ELEVATOR", eyebrow: "FIG.26 · EQUIVALENCE PRINCIPLE", subtitle: "A free-falling lab is a frame where gravity has been canceled.", readingMinutes: 11, status: "coming-soon", module: "equivalence-principle" },
  { slug: "gravitational-redshift", title: "GRAVITATIONAL REDSHIFT", eyebrow: "FIG.27 · EQUIVALENCE PRINCIPLE", subtitle: "Climb out of a gravity well and your photons get tired.", readingMinutes: 12, status: "coming-soon", module: "equivalence-principle" },
  { slug: "gravity-as-geometry", title: "GRAVITY AS GEOMETRY", eyebrow: "FIG.28 · EQUIVALENCE PRINCIPLE", subtitle: "The equivalence principle's geometric implication: there is no force, only curvature.", readingMinutes: 12, status: "coming-soon", module: "equivalence-principle" },
  // §07 Tensor calculus — FIG.29–33 (coming-soon)
  { slug: "manifolds-and-tangent-spaces", title: "MANIFOLDS AND TANGENT SPACES", eyebrow: "FIG.29 · TENSOR CALCULUS", subtitle: "Curved spaces and the flat ones that approximate them point by point.", readingMinutes: 13, status: "coming-soon", module: "tensor-calculus" },
  { slug: "tensors-on-curved-space", title: "TENSORS ON CURVED SPACE", eyebrow: "FIG.30 · TENSOR CALCULUS", subtitle: "Indexed objects that don't lie about which way they point.", readingMinutes: 13, status: "coming-soon", module: "tensor-calculus" },
  { slug: "the-metric-tensor", title: "THE METRIC TENSOR", eyebrow: "FIG.31 · TENSOR CALCULUS", subtitle: "The object that turns coordinate differences into actual distances.", readingMinutes: 13, status: "coming-soon", module: "tensor-calculus" },
  { slug: "christoffels-and-parallel-transport", title: "CHRISTOFFELS AND PARALLEL TRANSPORT", eyebrow: "FIG.32 · TENSOR CALCULUS", subtitle: "The connection that says what \"stays parallel\" means on a curved surface.", readingMinutes: 13, status: "coming-soon", module: "tensor-calculus" },
  { slug: "geodesics", title: "GEODESICS", eyebrow: "FIG.33 · TENSOR CALCULUS", subtitle: "The straightest possible lines, and why falling apples follow them.", readingMinutes: 13, status: "coming-soon", module: "tensor-calculus" },
  // §08 Curvature & EFE — FIG.34–38 (coming-soon)
  { slug: "the-riemann-tensor", title: "THE RIEMANN CURVATURE TENSOR", eyebrow: "FIG.34 · CURVATURE & EFE", subtitle: "Twenty independent numbers per point that say exactly how a space is bent.", readingMinutes: 13, status: "coming-soon", module: "curvature-and-efe" },
  { slug: "ricci-and-the-einstein-tensor", title: "RICCI, SCALAR CURVATURE, AND THE EINSTEIN TENSOR", eyebrow: "FIG.35 · CURVATURE & EFE", subtitle: "The contractions that make a divergence-free curvature object.", readingMinutes: 12, status: "coming-soon", module: "curvature-and-efe" },
  { slug: "the-stress-energy-tensor", title: "THE STRESS-ENERGY TENSOR", eyebrow: "FIG.36 · CURVATURE & EFE", subtitle: "Energy, momentum, pressure, and stress, all in one object.", readingMinutes: 12, status: "coming-soon", module: "curvature-and-efe" },
  { slug: "einsteins-field-equations", title: "EINSTEIN'S FIELD EQUATIONS", eyebrow: "FIG.37 · CURVATURE & EFE", subtitle: "Spacetime tells matter how to move; matter tells spacetime how to curve.", readingMinutes: 14, status: "coming-soon", module: "curvature-and-efe" },
  { slug: "the-newtonian-limit", title: "THE NEWTONIAN LIMIT", eyebrow: "FIG.38 · CURVATURE & EFE", subtitle: "Where GR gives back Newton, and where it refuses.", readingMinutes: 11, status: "coming-soon", module: "curvature-and-efe" },
  // §09 Schwarzschild + tests — FIG.39–43 (coming-soon)
  { slug: "the-schwarzschild-metric", title: "THE SCHWARZSCHILD METRIC", eyebrow: "FIG.39 · SCHWARZSCHILD + TESTS", subtitle: "The first exact solution to Einstein's equations, solved in a trench in 1915.", readingMinutes: 13, status: "coming-soon", module: "schwarzschild-and-tests" },
  { slug: "mercurys-perihelion", title: "MERCURY'S PERIHELION", eyebrow: "FIG.40 · SCHWARZSCHILD + TESTS", subtitle: "A 43-arcsecond-per-century mismatch that closed seventy years of guesswork.", readingMinutes: 12, status: "coming-soon", module: "schwarzschild-and-tests" },
  { slug: "light-deflection-and-lensing", title: "LIGHT DEFLECTION AND GRAVITATIONAL LENSING", eyebrow: "FIG.41 · SCHWARZSCHILD + TESTS", subtitle: "A May 1919 eclipse photograph, Einstein on the front page of every newspaper.", readingMinutes: 12, status: "coming-soon", module: "schwarzschild-and-tests" },
  { slug: "shapiro-delay", title: "THE SHAPIRO TIME DELAY", eyebrow: "FIG.42 · SCHWARZSCHILD + TESTS", subtitle: "Light slowed not by mass but by the geometry the mass produces.", readingMinutes: 11, status: "coming-soon", module: "schwarzschild-and-tests" },
  { slug: "the-classical-tests-summary", title: "THE CLASSICAL TESTS — A WHOLE THEORY ON TRIAL", eyebrow: "FIG.43 · SCHWARZSCHILD + TESTS", subtitle: "Four independent predictions, four confirmed observations, one theory standing.", readingMinutes: 10, status: "coming-soon", module: "schwarzschild-and-tests" },
  // §10 Black holes — FIG.44–49 (coming-soon)
  { slug: "the-event-horizon", title: "THE EVENT HORIZON", eyebrow: "FIG.44 · BLACK HOLES", subtitle: "The one-way membrane, what it looks like to the infaller, and what it doesn't.", readingMinutes: 13, status: "coming-soon", module: "black-holes" },
  { slug: "kerr-and-the-ergosphere", title: "KERR BLACK HOLES AND THE ERGOSPHERE", eyebrow: "FIG.45 · BLACK HOLES", subtitle: "Spinning spacetime drags everything inside it along for the ride.", readingMinutes: 12, status: "coming-soon", module: "black-holes" },
  { slug: "penrose-diagrams", title: "PENROSE DIAGRAMS AND CAUSAL STRUCTURE", eyebrow: "FIG.46 · BLACK HOLES", subtitle: "Compactify infinity; learn what a black hole's interior actually looks like.", readingMinutes: 13, status: "coming-soon", module: "black-holes" },
  { slug: "no-hair-theorem", title: "THE NO-HAIR THEOREM", eyebrow: "FIG.47 · BLACK HOLES", subtitle: "Three numbers describe every black hole: mass, charge, spin.", readingMinutes: 11, status: "coming-soon", module: "black-holes" },
  { slug: "black-hole-thermodynamics", title: "BLACK-HOLE THERMODYNAMICS", eyebrow: "FIG.48 · BLACK HOLES", subtitle: "The area theorem, Bekenstein entropy, and why a black hole is a thermal object.", readingMinutes: 12, status: "coming-soon", module: "black-holes" },
  { slug: "hawking-radiation", title: "HAWKING RADIATION", eyebrow: "FIG.49 · BLACK HOLES", subtitle: "A semiclassical preview: even the blackest hole evaporates.", readingMinutes: 12, status: "coming-soon", module: "black-holes" },
  // §11 Gravitational waves — FIG.50–53 (coming-soon)
  { slug: "linearized-gravity", title: "LINEARIZED GRAVITY", eyebrow: "FIG.50 · GRAVITATIONAL WAVES", subtitle: "Small ripples in a flat background, governed by a wave equation.", readingMinutes: 12, status: "coming-soon", module: "gravitational-waves" },
  { slug: "polarization-modes", title: "THE TWO POLARIZATIONS — PLUS AND CROSS", eyebrow: "FIG.51 · GRAVITATIONAL WAVES", subtitle: "What a gravitational wave does to a ring of free-floating test masses.", readingMinutes: 11, status: "coming-soon", module: "gravitational-waves" },
  { slug: "binary-inspiral-and-the-chirp", title: "BINARY INSPIRAL AND THE CHIRP", eyebrow: "FIG.52 · GRAVITATIONAL WAVES", subtitle: "Two black holes spiraling in; the waveform's frequency rises like a chirp.", readingMinutes: 12, status: "coming-soon", module: "gravitational-waves" },
  { slug: "ligo-and-multi-messenger", title: "LIGO AND MULTI-MESSENGER ASTRONOMY", eyebrow: "FIG.53 · GRAVITATIONAL WAVES", subtitle: "GW150914, GW170817, and what it means to hear the universe instead of seeing it.", readingMinutes: 12, status: "coming-soon", module: "gravitational-waves" },
  // §12 Cosmology — FIG.54–58 (coming-soon)
  { slug: "the-flrw-metric", title: "THE FLRW METRIC", eyebrow: "FIG.54 · COSMOLOGY", subtitle: "The geometry the universe picked out for itself.", readingMinutes: 12, status: "coming-soon", module: "cosmology" },
  { slug: "friedmann-equations", title: "FRIEDMANN'S EQUATIONS", eyebrow: "FIG.55 · COSMOLOGY", subtitle: "Two ODEs that govern the expansion of everything.", readingMinutes: 13, status: "coming-soon", module: "cosmology" },
  { slug: "hubble-and-cosmological-redshift", title: "HUBBLE AND COSMOLOGICAL REDSHIFT", eyebrow: "FIG.56 · COSMOLOGY", subtitle: "Why distant galaxies' light is stretched, and what is doing the stretching.", readingMinutes: 12, status: "coming-soon", module: "cosmology" },
  { slug: "the-cmb-and-nucleosynthesis", title: "THE CMB AND BIG BANG NUCLEOSYNTHESIS", eyebrow: "FIG.57 · COSMOLOGY", subtitle: "The leftover heat and the first three minutes' worth of helium.", readingMinutes: 13, status: "coming-soon", module: "cosmology" },
  { slug: "dark-matter-and-dark-energy", title: "DARK MATTER AND DARK ENERGY", eyebrow: "FIG.58 · COSMOLOGY", subtitle: "What 95% of the universe's mass-energy budget is — and what we still don't know about it.", readingMinutes: 13, status: "coming-soon", module: "cosmology" },
  // §13 Frontiers — FIG.59–61 (coming-soon)
  { slug: "singularity-theorems", title: "THE PENROSE-HAWKING SINGULARITY THEOREMS", eyebrow: "FIG.59 · FRONTIERS", subtitle: "When does GR predict its own breakdown?", readingMinutes: 12, status: "coming-soon", module: "frontiers" },
  { slug: "the-information-paradox", title: "THE INFORMATION PARADOX", eyebrow: "FIG.60 · FRONTIERS", subtitle: "Hawking radiation says yes, unitarity says no, and the answer is still being argued.", readingMinutes: 13, status: "coming-soon", module: "frontiers" },
  { slug: "what-relativity-doesnt-say", title: "WHAT RELATIVITY DOESN'T SAY", eyebrow: "FIG.61 · FRONTIERS", subtitle: "A century of winning streak, and the wall it has not yet broken through.", readingMinutes: 11, status: "coming-soon", module: "frontiers" },
];
```

- [ ] **Step 3: Update the `relativity` entry in `BRANCHES`**

If **Option A**: physically reorder the array so RELATIVITY follows ELECTROMAGNETISM and precedes THERMODYNAMICS. Update Thermo/Quantum/Modern indices and eyebrows accordingly. Replace the relativity stub (currently at lines 987–998) with:

```typescript
  {
    slug: "relativity",
    index: 3,
    title: "RELATIVITY",
    eyebrow: "§ 03",
    subtitle: "The geometry of moving and falling.",
    description:
      "Special relativity erased the line between space and time and made E=mc² a fact about geometry. General relativity erased the line between gravity and curvature and made the universe expand. Together they give the rules light obeys, the rules clocks obey, and the rules black holes do not let escape — the longest-running winning streak in 20th-century physics.",
    modules: RELATIVITY_MODULES,
    topics: RELATIVITY_TOPICS,
    status: "live",
  },
```

Then update Thermo to `index: 4` / `eyebrow: "§ 04"`, Quantum to `index: 5` / `eyebrow: "§ 05"`, Modern to `index: 6` / `eyebrow: "§ 06"`. Subtitles and descriptions of those three remain unchanged.

If **Option B**: leave array order alone. Only change the relativity entry. Use `index: 4`, `eyebrow: "§ 04"`, but otherwise the same fields above (description + subtitle from spec).

- [ ] **Step 4: Verify `getAdjacentTopics()` threads correctly**

Read `lib/content/branches.ts:1042-1064`. The function iterates `BRANCHES` in array order and skips `coming-soon` branches and topics. After Wave 0:
- CM topics → EM topics → RT topics (Option A) or CM → EM → Thermo (skipped, still coming-soon) → RT (Option B).
- Last EM topic = `four-potential-and-em-lagrangian`. Its `next` should be RT FIG.01 `galilean-relativity`.
- RT FIG.10 `relativistic-doppler` should have `next: null` (no live branch follows).

No code changes expected. Just verify by mental walk-through. If it threads wrong, debug — but it should not.

- [ ] **Step 5: Update `branches-section.tsx` if it hardcodes branch counts**

```bash
grep -n "two\|2 branches\|live" components/sections/branches-section.tsx | head -20
```

If a literal "two branches live" or similar hard count exists, update it to "three" or remove. If it iterates `getLiveBranches()` dynamically, no edit needed. If unsure, leave as-is and check during Wave 3 curl smoke.

- [ ] **Step 6: Create `lib/physics/relativity/types.ts`**

```typescript
/**
 * Special-relativistic types and helpers for the RELATIVITY branch.
 *
 * Conventions:
 *   • Mostly-minus metric signature (+,−,−,−), Griffiths convention (matches lib/physics/electromagnetism/relativity.ts).
 *   • Greek indices (0..3) on Vec4 correspond to (ct, x, y, z).
 *   • Boost velocity is given as β = v/c (dimensionless), not v.
 *   • Worldlines are parametric event sequences indexed by lab time or proper time, depending on context.
 */

export type Vec4 = readonly [number, number, number, number];

export interface MinkowskiPoint {
  /** Lab-frame time coordinate (seconds). */
  t: number;
  /** Spatial coordinates (meters). */
  x: number;
  y: number;
  z: number;
}

export interface Worldline {
  events: readonly MinkowskiPoint[];
  /** CSS color string for rendering. */
  color: string;
  label?: string;
  /** Optional: marks an accelerated worldline (changes color convention to orange). */
  accelerated?: boolean;
}

export type LorentzMatrix = readonly [Vec4, Vec4, Vec4, Vec4];

/** Lorentz factor γ = 1/√(1 − β²). */
export function gamma(beta: number): number {
  if (Math.abs(beta) >= 1) {
    throw new RangeError(`Lorentz factor undefined for |β| >= 1 (got ${beta})`);
  }
  return 1 / Math.sqrt(1 - beta * beta);
}

/** Lorentz boost matrix Λ along +x by velocity βc, mostly-minus signature. */
export function boostX(beta: number): LorentzMatrix {
  const g = gamma(beta);
  return [
    [g, -g * beta, 0, 0],
    [-g * beta, g, 0, 0],
    [0, 0, 1, 0],
    [0, 0, 0, 1],
  ] as const;
}

/** Lorentz boost matrix Λ along +y by velocity βc. */
export function boostY(beta: number): LorentzMatrix {
  const g = gamma(beta);
  return [
    [g, 0, -g * beta, 0],
    [0, 1, 0, 0],
    [-g * beta, 0, g, 0],
    [0, 0, 0, 1],
  ] as const;
}

/** Lorentz boost matrix Λ along +z by velocity βc. */
export function boostZ(beta: number): LorentzMatrix {
  const g = gamma(beta);
  return [
    [g, 0, 0, -g * beta],
    [0, 1, 0, 0],
    [0, 0, 1, 0],
    [-g * beta, 0, 0, g],
  ] as const;
}

/** Spatial rotation matrix in the (i, j) plane by angle θ (radians).
 *  axis = "x" rotates in the y-z plane; "y" in z-x; "z" in x-y. */
export function rotation(theta: number, axis: "x" | "y" | "z"): LorentzMatrix {
  const c = Math.cos(theta);
  const s = Math.sin(theta);
  if (axis === "x") {
    return [
      [1, 0, 0, 0],
      [0, 1, 0, 0],
      [0, 0, c, -s],
      [0, 0, s, c],
    ] as const;
  }
  if (axis === "y") {
    return [
      [1, 0, 0, 0],
      [0, c, 0, s],
      [0, 0, 1, 0],
      [0, -s, 0, c],
    ] as const;
  }
  return [
    [1, 0, 0, 0],
    [0, c, -s, 0],
    [0, s, c, 0],
    [0, 0, 0, 1],
  ] as const;
}

/** Apply a 4×4 Lorentz matrix to a 4-vector. Returns a new Vec4. */
export function applyMatrix(M: LorentzMatrix, v: Vec4): Vec4 {
  return [
    M[0][0] * v[0] + M[0][1] * v[1] + M[0][2] * v[2] + M[0][3] * v[3],
    M[1][0] * v[0] + M[1][1] * v[1] + M[1][2] * v[2] + M[1][3] * v[3],
    M[2][0] * v[0] + M[2][1] * v[1] + M[2][2] * v[2] + M[2][3] * v[3],
    M[3][0] * v[0] + M[3][1] * v[1] + M[3][2] * v[2] + M[3][3] * v[3],
  ] as const;
}

/** Convert a MinkowskiPoint to a Vec4 with components (ct, x, y, z). */
export function pointToVec4(p: MinkowskiPoint, c: number): Vec4 {
  return [c * p.t, p.x, p.y, p.z] as const;
}

/** Convert a Vec4 (ct, x, y, z) back to a MinkowskiPoint. */
export function vec4ToPoint(v: Vec4, c: number): MinkowskiPoint {
  return { t: v[0] / c, x: v[1], y: v[2], z: v[3] };
}
```

- [ ] **Step 7: Create `tests/physics/relativity/types.test.ts`**

```typescript
import { describe, expect, it } from "vitest";
import { gamma, boostX, boostY, boostZ, rotation, applyMatrix, pointToVec4, vec4ToPoint } from "@/lib/physics/relativity/types";
import type { Vec4 } from "@/lib/physics/relativity/types";

describe("gamma", () => {
  it("equals 1 at rest", () => {
    expect(gamma(0)).toBeCloseTo(1, 12);
  });

  it("≈ 1.005 at β = 0.1", () => {
    expect(gamma(0.1)).toBeCloseTo(1.0050378152592121, 10);
  });

  it("≈ 10 at β = 0.99499", () => {
    expect(gamma(0.99499)).toBeCloseTo(10.012559, 4);
  });

  it("throws at |β| ≥ 1", () => {
    expect(() => gamma(1)).toThrow(RangeError);
    expect(() => gamma(-1.0001)).toThrow(RangeError);
  });
});

describe("boostX", () => {
  it("is identity at β = 0", () => {
    const M = boostX(0);
    expect(M[0][0]).toBeCloseTo(1, 12);
    expect(M[0][1]).toBeCloseTo(0, 12);
    expect(M[1][0]).toBeCloseTo(0, 12);
    expect(M[1][1]).toBeCloseTo(1, 12);
  });

  it("transforms (ct, 0, 0, 0) to γ(ct, -βct, 0, 0) — moving lab event", () => {
    const M = boostX(0.6);
    const v: Vec4 = [1, 0, 0, 0];
    const out = applyMatrix(M, v);
    expect(out[0]).toBeCloseTo(1.25, 8);
    expect(out[1]).toBeCloseTo(-0.75, 8);
    expect(out[2]).toBeCloseTo(0, 12);
    expect(out[3]).toBeCloseTo(0, 12);
  });

  it("preserves invariant interval (ct)² − x² − y² − z²", () => {
    const v: Vec4 = [2, 1, 0, 0];
    const M = boostX(0.5);
    const out = applyMatrix(M, v);
    const sIn = v[0] * v[0] - v[1] * v[1] - v[2] * v[2] - v[3] * v[3];
    const sOut = out[0] * out[0] - out[1] * out[1] - out[2] * out[2] - out[3] * out[3];
    expect(sOut).toBeCloseTo(sIn, 8);
  });
});

describe("boostY / boostZ", () => {
  it("boostY mixes (ct, y) and leaves x, z alone", () => {
    const M = boostY(0.5);
    const v: Vec4 = [1, 7, 0, 11];
    const out = applyMatrix(M, v);
    expect(out[1]).toBeCloseTo(7, 8);
    expect(out[3]).toBeCloseTo(11, 8);
  });

  it("boostZ mixes (ct, z) and leaves x, y alone", () => {
    const M = boostZ(0.5);
    const v: Vec4 = [1, 7, 11, 0];
    const out = applyMatrix(M, v);
    expect(out[1]).toBeCloseTo(7, 8);
    expect(out[2]).toBeCloseTo(11, 8);
  });
});

describe("rotation", () => {
  it("rotation(π/2, 'z') sends (1, 0) to (0, 1) in the x-y plane", () => {
    const M = rotation(Math.PI / 2, "z");
    const v: Vec4 = [0, 1, 0, 0];
    const out = applyMatrix(M, v);
    expect(out[1]).toBeCloseTo(0, 8);
    expect(out[2]).toBeCloseTo(1, 8);
  });

  it("preserves time component", () => {
    const M = rotation(0.7, "x");
    const v: Vec4 = [3, 1, 1, 1];
    const out = applyMatrix(M, v);
    expect(out[0]).toBeCloseTo(3, 12);
  });
});

describe("pointToVec4 / vec4ToPoint round trip", () => {
  it("roundtrips at c = 299792458", () => {
    const c = 299792458;
    const p = { t: 1.5e-9, x: 0.1, y: 0.2, z: -0.3 };
    const v = pointToVec4(p, c);
    const back = vec4ToPoint(v, c);
    expect(back.t).toBeCloseTo(p.t, 18);
    expect(back.x).toBeCloseTo(p.x, 12);
    expect(back.y).toBeCloseTo(p.y, 12);
    expect(back.z).toBeCloseTo(p.z, 12);
  });
});
```

- [ ] **Step 8: Run typecheck + tests**

```bash
pnpm tsc --noEmit
pnpm vitest run tests/physics/relativity/types.test.ts
```

Expected: clean tsc; all 11 tests pass. If `tsc` complains about RELATIVITY_TOPICS containing 61 entries with the `Topic` shape, verify the `Module` and `Topic` types match — should be defined near the top of `branches.ts`.

- [ ] **Step 9: Commit**

```bash
git add lib/content/branches.ts lib/physics/relativity/types.ts tests/physics/relativity/types.test.ts
# If Option A also touched components/sections/branches-section.tsx, add it.
git commit -m "$(cat <<'EOF'
feat(rt/§01-§02): scaffold relativity branch — modules, topics, types

Adds RELATIVITY_MODULES (13 entries) + RELATIVITY_TOPICS (61 entries:
10 §01-§02 live, 51 §03-§13 coming-soon). Flips relativity branch to live
at index 3 / eyebrow "§ 03" per spec; bumps thermodynamics, quantum,
modern-physics indices and eyebrows accordingly.

Adds lib/physics/relativity/types.ts: Vec4, MinkowskiPoint, Worldline,
LorentzMatrix, gamma, boostX/Y/Z, rotation, applyMatrix, point↔vec4
helpers — the canonical type module Wave 1.5 (canvas) and Wave 2 (10
topic agents) all import from.

Spec: docs/superpowers/specs/2026-04-29-relativity-branch-design.md

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Wave 1 — Seed scaffold for Michelson + glossary (1 subagent, serial)

**Single agent. Builds the seed script ONLY — does not run it (Wave 3 runs it).**

### Task 2: Scaffold seed-rt-01.ts

**Files:**
- Create: `/Users/romanpochtman/Developer/physics/scripts/content/seed-rt-01.ts`
- Modify: `/Users/romanpochtman/Developer/physics/lib/content/physicists.ts`
- Modify: `/Users/romanpochtman/Developer/physics/lib/content/glossary.ts`

- [ ] **Step 1: Read the precedent seed script verbatim**

Read `scripts/content/seed-em-07.ts` end to end. Note the `PhysicistSeed` and `GlossarySeed` interfaces, the `parseMajorWork` and `paragraphsToBlocks` helpers, and the upsert-with-source_hash-idempotency pattern. **Copy these helpers verbatim into `seed-rt-01.ts` — do not paraphrase.** EM Session 7 documented the lesson: paraphrasing the `paragraphsToBlocks` helper introduced a renderer-incompatible shape that 500'd Minkowski's page until corrected.

- [ ] **Step 2: Append Albert Michelson to PHYSICISTS**

Open `lib/content/physicists.ts`. Add after the existing entries (likely after `hermann-minkowski` from EM Session 7):

```typescript
{
  slug: "albert-michelson",
  born: "1852",
  died: "1931",
  nationality: "American (German-born)",
  relatedTopics: [
    { branchSlug: "relativity", topicSlug: "michelson-morley" },
    { branchSlug: "relativity", topicSlug: "einsteins-two-postulates" },
  ],
},
```

**Decision: combined entry under `albert-michelson`** — Morley credited in the bio's middle paragraph rather than as a separate `edward-morley` entry. (Default per prompt.md; the M-M experiment is conventionally cited as a single act.) If §01.3 author flags during Wave 2 that prose calls for a distinct human story for Morley, flag for Roman to add Morley as a follow-up; do not split this session.

- [ ] **Step 3: Append `relatedTopics` to existing physicists**

For each of the following existing PHYSICISTS entries, append the listed `relatedTopics`. Search `lib/content/physicists.ts` for each slug and add to the array.

- `albert-einstein`: `{ branchSlug: "relativity", topicSlug: "einsteins-two-postulates" }`, `{ branchSlug: "relativity", topicSlug: "relative-simultaneity" }`, `{ branchSlug: "relativity", topicSlug: "time-dilation" }`, `{ branchSlug: "relativity", topicSlug: "the-lorentz-transformation" }`, `{ branchSlug: "relativity", topicSlug: "relativistic-doppler" }`.
- `hendrik-antoon-lorentz`: `{ branchSlug: "relativity", topicSlug: "the-lorentz-transformation" }`.
- `henri-poincare`: `{ branchSlug: "relativity", topicSlug: "the-lorentz-transformation" }`.
- `hermann-minkowski`: `{ branchSlug: "relativity", topicSlug: "relative-simultaneity" }`.
- `hippolyte-fizeau`: `{ branchSlug: "relativity", topicSlug: "velocity-addition" }`.
- `leon-foucault`: `{ branchSlug: "relativity", topicSlug: "maxwell-and-the-speed-of-light" }`.
- `christian-doppler`: `{ branchSlug: "relativity", topicSlug: "relativistic-doppler" }`.
- `james-clerk-maxwell`: `{ branchSlug: "relativity", topicSlug: "maxwell-and-the-speed-of-light" }`.

If any of these slugs is missing from PHYSICISTS, drop that line and flag in the Wave 1 handoff. (At time of writing, all 8 are confirmed present per the EM Session 7 implementation log.)

- [ ] **Step 4: Append glossary terms to GLOSSARY**

Open `lib/content/glossary.ts`. Verify-then-append:

For §01:
- `galilean-invariance` (concept)
- `aether-luminiferous` (concept)
- `two-postulates` (concept)
- `simultaneity-relative` (concept)

For §02:
- `time-dilation` (concept)
- `length-contraction` (concept)
- `lorentz-transformation` (concept)
- `velocity-addition-relativistic` (concept)
- `relativistic-doppler` (phenomenon)
- `transverse-doppler` (phenomenon)

**Skip `lorentz-factor`** — already exists from EM §11 (Session 7's Wave 1). Cross-link rather than duplicate. **Skip `four-vector`** — same reason.

Each entry needs structural fields only at this stage (slug, term, category, relatedPhysicists, relatedTopics). Prose ships in the seed script (Step 5). Match the existing entry shape — grep for any §11 term like `lorentz-factor` in `glossary.ts` and mirror.

**SLUG-COLLISION DEFENCE:** triple-check the spelling difference between `lorenz-gauge` (Ludvig Lorenz, EM §11.5 — no T) and `lorentz-transformation` (Hendrik Lorentz, RT §02.3 — with T). They are TWO DIFFERENT PEOPLE. Verify by grep:

```bash
grep -n "lorentz\|lorenz" lib/content/glossary.ts | head -20
```

The right state after this step: `lorenz-gauge` (existing, untouched) + `lorentz-transformation` (new).

- [ ] **Step 5: Author `seed-rt-01.ts`**

Mirror `seed-em-07.ts` structure exactly. Skeleton:

```typescript
// Seed RT §01 SR Foundations + §02 SR Kinematics
// 1 physicist (Albert Michelson, combined-with-Morley) + 10 new structural glossary terms
// Run: pnpm exec tsx --conditions=react-server scripts/content/seed-rt-01.ts
import "dotenv/config";
import { createHash } from "node:crypto";
import { getServiceClient } from "@/lib/supabase-server";

interface PhysicistSeed { /* … copy from seed-em-07 verbatim … */ }
interface GlossarySeed { /* … copy from seed-em-07 verbatim … */ }
function parseMajorWork(s: string) { /* … copy verbatim … */ }
function paragraphsToBlocks(text: string) { /* … copy VERBATIM — flat string[] inlines, NOT object-wrapped … */ }

const PHYSICISTS: PhysicistSeed[] = [
  {
    slug: "albert-michelson",
    name: "Albert Abraham Michelson",
    shortName: "Michelson",
    born: "1852",
    died: "1931",
    nationality: "American",
    oneLiner: "German-born American physicist, first US Nobel laureate in science (1907). With Edward Morley, used a precision interferometer in 1887 to measure Earth's motion through the luminiferous aether — and got a null result every time. The negative result they could not explain became Einstein's positive postulate twenty-four years later.",
    bio: `Albert Abraham Michelson was born in Strelno, Prussia (now Strzelno, Poland), in 1852, the son of a Jewish merchant family who emigrated to Murphys Camp in California's Gold Country in 1855 and later San Francisco. He won an at-large appointment to the US Naval Academy from President Ulysses S. Grant in 1869, graduated in 1873, and was retained as an instructor in physics and chemistry. Stationed at Annapolis, he built his first ether-drift apparatus in 1881 — a single-arm interferometer that yielded an inconclusive null. To pursue the experiment with greater precision, he resigned his commission, studied in Berlin under Helmholtz, and accepted a chair of physics at the Case School of Applied Science in Cleveland.

In Cleveland from 1885, Michelson partnered with Edward Williams Morley, a chemist and experimentalist of remarkable mechanical patience at neighbouring Western Reserve University. Together they built the Michelson-Morley apparatus: an interferometer floating on a stone slab on a pool of mercury, isolating it from vibration; two perpendicular optical arms 11 metres long folded by mirrors; and a sodium-flame source whose monochromatic light produced an interference fringe pattern visible through a telescope. They turned the apparatus 90° in steady increments and watched for fringe shifts. None came. They published the result in 1887 in the American Journal of Science. The aether — the luminiferous medium that all of nineteenth-century optics had assumed — refused to make itself measurable. Lorentz and FitzGerald independently proposed that real material contraction in the aether might explain the null; Einstein's 1905 paper would discard the aether entirely and elevate the constancy of c to a postulate.

Michelson went on to a Nobel Prize in 1907 — the first awarded to an American in science — for his measurements of the speed of light, which he progressively pinned down to a precision of one part in ten thousand using rotating-mirror techniques. He also pioneered the Michelson stellar interferometer, which in 1920 enabled the first direct measurement of a stellar diameter (Betelgeuse, 0.05″). The Michelson interferometer principle would reappear a century later in LIGO, the gravitational-wave observatory whose 4-kilometre arms sense displacements smaller than 10⁻¹⁸ m. Michelson died in Pasadena in 1931, working until the end on his final speed-of-light measurement, conducted in a kilometre-long evacuated tube at the Irvine Ranch.`,
    contributions: [
      "1887 Michelson-Morley experiment with Edward Morley — null result for aether-wind effect; the empirical foundation for special relativity.",
      "First American Nobel laureate in science (1907), for optical precision instruments and the metrological measurements of c.",
      "Speed-of-light measurements progressively refined from 299,853 km/s (1879) to 299,796±4 km/s (1926, Mt Wilson–San Antonio Peak).",
      "Michelson stellar interferometer — first direct measurement of stellar angular diameters (Betelgeuse, 1920).",
      "Interferometric metrology defining the metre in terms of optical wavelengths — pre-laser standard later realized in 1960.",
    ],
    majorWorks: [
      "On the Relative Motion of the Earth and the Luminiferous Ether (1887) — joint paper with Edward Morley reporting the null result that became special relativity's empirical foundation.",
      "Light Waves and Their Uses (1903) — popular Lowell Lectures volume; the Michelson interferometer principle for a non-specialist audience.",
      "Studies in Optics (1927) — late synthesis of his interferometric methods, written in his last years at Caltech.",
    ],
    relatedTopics: [
      { branchSlug: "relativity", topicSlug: "michelson-morley" },
      { branchSlug: "relativity", topicSlug: "einsteins-two-postulates" },
    ],
  },
];

const GLOSSARY: GlossarySeed[] = [
  // 10 entries — for each, ~150–250 words of description prose, 1–2 paragraphs.
  // Mirror seed-em-07 GLOSSARY entry shape exactly.
  // Slugs: galilean-invariance, aether-luminiferous, two-postulates, simultaneity-relative,
  //        time-dilation, length-contraction, lorentz-transformation,
  //        velocity-addition-relativistic, relativistic-doppler, transverse-doppler.
  // … fill in each with shortDefinition, description, optional history, relatedPhysicists, relatedTopics …
];

async function main() {
  // Mirror seed-em-07 main(): for each physicist + glossary entry, compute source_hash
  // from JSON.stringify of the prose-relevant fields, upsert into content_entries via
  // service-role client. Skip if source_hash unchanged.
  // Log: "physicists: N inserted / M updated", "glossary: N inserted / M updated".
}

main().catch((e) => { console.error(e); process.exit(1); });
```

**The full GLOSSARY array:** ~150–250 words of `description` per entry. Lean factual, no padding. Mirror voice from `seed-em-07.ts` (Minkowski-era SR-relevant terms — `lorentz-factor`, `gauge-transformation`, etc.). For each:
- `shortDefinition` ≤ 1 sentence.
- `description` 150–250 words, 1–2 paragraphs.
- `relatedPhysicists` — slugs of relevant existing entries.
- `relatedTopics` — branch + topic slug pairs.
- `category` per the per-slug list above.

For `lorentz-transformation` specifically: explicitly call out the Lorenz-vs-Lorentz disambiguation in the description. "Hendrik Antoon Lorentz, Dutch, 1853–1928 — distinct from Ludvig Lorenz (no T), Danish, 1829–1891, the radiation-gauge physicist of EM §11.5."

- [ ] **Step 6: Run a dry-test — make sure the file parses + tsc clean**

```bash
pnpm tsc --noEmit
```

Do NOT run the seed yet. Wave 3 runs it.

- [ ] **Step 7: Commit**

```bash
git add lib/content/physicists.ts lib/content/glossary.ts scripts/content/seed-rt-01.ts
git commit -m "$(cat <<'EOF'
feat(rt/§01-§02): scaffold seed-rt-01 — Michelson, glossary, related-topic links

Adds Albert Michelson (combined-with-Morley) to PHYSICISTS. Appends RT
relatedTopics to existing Einstein, Lorentz, Poincaré, Minkowski,
Fizeau, Foucault, Doppler, Maxwell. Adds 10 net new glossary structural
entries (galilean-invariance, aether-luminiferous, two-postulates,
simultaneity-relative, time-dilation, length-contraction,
lorentz-transformation, velocity-addition-relativistic,
relativistic-doppler, transverse-doppler). Cross-links existing
lorentz-factor + four-vector from EM §11 rather than duplicating.

Authors scripts/content/seed-rt-01.ts mirroring seed-em-07.ts verbatim
(paragraphsToBlocks helper copied as-is per the EM Session 7 lesson).
NOT executed yet — Wave 3 runs the seed.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Wave 1.5 — SpacetimeDiagramCanvas primitive (1 subagent, serial)

**RECOMMENDED: build it.** §01.5 + §02.1 + §02.3 use it directly this session; §03.1 + §03.5 use it in Session 2; §05–§06 lean on it. 5+ topics across Sessions 1–2 amortize, well above the EM CircuitCanvas (7) threshold for branch-spanning use.

If decision is to defer, skip this wave and let Wave 2 agents author one-off Minkowski-diagram canvases per topic. Document the deferral in the Wave 3 implementation log.

### Task 3: Build SpacetimeDiagramCanvas primitive

**Files:**
- Create: `/Users/romanpochtman/Developer/physics/components/physics/_shared/SpacetimeDiagramCanvas.tsx`
- Create: `/Users/romanpochtman/Developer/physics/components/physics/_shared/index.ts`
- Create: `/Users/romanpochtman/Developer/physics/components/physics/_shared/README.md`
- Create: `/Users/romanpochtman/Developer/physics/components/physics/_shared/SpacetimeDiagramCanvas.test.tsx`

- [ ] **Step 1: Read the CircuitCanvas precedent**

Read `components/physics/circuit-canvas/CircuitCanvas.tsx`, `solver.ts`, `types.ts`, `index.ts`, and the SceneCard wiring in any of the §06 topic files (e.g., `app/[locale]/(topics)/electromagnetism/dc-circuits-and-kirchhoff/content.en.mdx`). Note: `"use client"`, `useRef<HTMLCanvasElement>`, `requestAnimationFrame` loop, HUD overlay with `font-mono text-xs`, named-export component shape.

- [ ] **Step 2: Specify the API in `index.ts` and the README**

`index.ts`:

```typescript
export { SpacetimeDiagramCanvas } from "./SpacetimeDiagramCanvas";
export type { SpacetimeDiagramProps } from "./SpacetimeDiagramCanvas";
```

`README.md` — short doc:
- One-paragraph intent: Minkowski diagram primitive for SR topics. ct on vertical axis, x on horizontal. Worldlines drawn as polylines. Light cones as 45° dashed rays from origin. Optional simultaneity slices (constant-t' lines under boost). Optional boost slider that re-renders the boosted axes overlaid on the lab axes.
- API table:
  - `worldlines: Worldline[]` — array of `{ events, color, label?, accelerated? }`.
  - `lightCone?: boolean` (default true).
  - `simultaneitySlice?: { tPrime: number, beta: number } | null` — single slice in boosted frame.
  - `boostBeta?: number` — β for the boosted-frame axes overlay (omit to hide).
  - `boostMin?: number, boostMax?: number, boostStep?: number` — slider bounds; if `onBoostChange` provided, render slider.
  - `onBoostChange?: (beta: number) => void` — controlled-mode handler.
  - `xRange?: [number, number]` — x-axis (lab) bounds in units of `c·t`.
  - `tRange?: [number, number]` — ct-axis bounds.
  - `width?: number, height?: number` — canvas size in CSS px.
  - `palette?: { stationary: string; boosted: string; lightCone: string; accelerated: string; grid: string }` — color overrides; defaults to spec palette (cyan, magenta, amber, orange, dim grey).
- Color convention: cyan `#67E8F9` for stationary worldlines/axes, magenta `#FF6ADE` for boosted axes, amber `#FFD66B` for light cones, orange `#FFB36B` for accelerated worldlines, grey `rgba(255,255,255,0.08)` for grid lines. Match scene-color conventions established in EM Sessions 1–7.

- [ ] **Step 3: Implement `SpacetimeDiagramCanvas.tsx`**

```tsx
"use client";

import { useEffect, useRef, useState } from "react";
import type { Worldline } from "@/lib/physics/relativity/types";

export interface SpacetimeDiagramProps {
  worldlines: readonly Worldline[];
  lightCone?: boolean;
  simultaneitySlice?: { tPrime: number; beta: number } | null;
  boostBeta?: number;
  boostMin?: number;
  boostMax?: number;
  boostStep?: number;
  onBoostChange?: (beta: number) => void;
  xRange?: [number, number];
  tRange?: [number, number];
  width?: number;
  height?: number;
  palette?: Partial<SpacetimePalette>;
}

interface SpacetimePalette {
  stationary: string;
  boosted: string;
  lightCone: string;
  accelerated: string;
  grid: string;
  axes: string;
}

const DEFAULT_PALETTE: SpacetimePalette = {
  stationary: "#67E8F9",
  boosted: "#FF6ADE",
  lightCone: "#FFD66B",
  accelerated: "#FFB36B",
  grid: "rgba(255,255,255,0.08)",
  axes: "rgba(255,255,255,0.6)",
};

export function SpacetimeDiagramCanvas({
  worldlines,
  lightCone = true,
  simultaneitySlice = null,
  boostBeta,
  boostMin = -0.95,
  boostMax = 0.95,
  boostStep = 0.01,
  onBoostChange,
  xRange = [-2, 2],
  tRange = [0, 4],
  width = 480,
  height = 360,
  palette,
}: SpacetimeDiagramProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const colors = { ...DEFAULT_PALETTE, ...palette };
  const [internalBeta, setInternalBeta] = useState(boostBeta ?? 0);
  const beta = onBoostChange !== undefined ? (boostBeta ?? 0) : internalBeta;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = typeof window !== "undefined" ? window.devicePixelRatio || 1 : 1;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, width, height);

    // Map (x, ct) world coords to canvas pixel coords. Origin at lower-left + margin.
    const margin = 36;
    const plotW = width - 2 * margin;
    const plotH = height - 2 * margin;
    const [xMin, xMax] = xRange;
    const [tMin, tMax] = tRange;
    const xToPx = (x: number) => margin + ((x - xMin) / (xMax - xMin)) * plotW;
    const tToPx = (t: number) => height - margin - ((t - tMin) / (tMax - tMin)) * plotH;

    // Grid
    ctx.strokeStyle = colors.grid;
    ctx.lineWidth = 1;
    for (let x = Math.ceil(xMin); x <= Math.floor(xMax); x++) {
      ctx.beginPath();
      ctx.moveTo(xToPx(x), tToPx(tMin));
      ctx.lineTo(xToPx(x), tToPx(tMax));
      ctx.stroke();
    }
    for (let t = Math.ceil(tMin); t <= Math.floor(tMax); t++) {
      ctx.beginPath();
      ctx.moveTo(xToPx(xMin), tToPx(t));
      ctx.lineTo(xToPx(xMax), tToPx(t));
      ctx.stroke();
    }

    // Lab axes
    ctx.strokeStyle = colors.axes;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(xToPx(0), tToPx(tMin));
    ctx.lineTo(xToPx(0), tToPx(tMax));
    ctx.moveTo(xToPx(xMin), tToPx(0));
    ctx.lineTo(xToPx(xMax), tToPx(0));
    ctx.stroke();

    // Light cone (ct = ±x from origin)
    if (lightCone) {
      ctx.strokeStyle = colors.lightCone;
      ctx.setLineDash([4, 4]);
      ctx.lineWidth = 1.25;
      ctx.beginPath();
      ctx.moveTo(xToPx(xMin), tToPx(-xMin));
      ctx.lineTo(xToPx(xMax), tToPx(xMax));
      ctx.moveTo(xToPx(xMin), tToPx(xMin));
      ctx.lineTo(xToPx(xMax), tToPx(-xMax));
      ctx.stroke();
      ctx.setLineDash([]);
    }

    // Boosted axes overlay (ct' axis at slope 1/β; x' axis at slope β)
    if (Math.abs(beta) > 1e-6) {
      ctx.strokeStyle = colors.boosted;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      // ct' axis: x = β·ct, so points (β·t, t) for t ∈ tRange
      ctx.moveTo(xToPx(beta * tMin), tToPx(tMin));
      ctx.lineTo(xToPx(beta * tMax), tToPx(tMax));
      // x' axis: ct = β·x
      ctx.moveTo(xToPx(xMin), tToPx(beta * xMin));
      ctx.lineTo(xToPx(xMax), tToPx(beta * xMax));
      ctx.stroke();
    }

    // Simultaneity slice (line of constant t' = γ(t − βx) = const)
    if (simultaneitySlice) {
      const { tPrime, beta: sliceBeta } = simultaneitySlice;
      const g = 1 / Math.sqrt(1 - sliceBeta * sliceBeta);
      // t = tPrime / γ + β · x
      const t1 = tPrime / g + sliceBeta * xMin;
      const t2 = tPrime / g + sliceBeta * xMax;
      ctx.strokeStyle = colors.boosted;
      ctx.setLineDash([2, 6]);
      ctx.lineWidth = 1.25;
      ctx.beginPath();
      ctx.moveTo(xToPx(xMin), tToPx(t1));
      ctx.lineTo(xToPx(xMax), tToPx(t2));
      ctx.stroke();
      ctx.setLineDash([]);
    }

    // Worldlines
    for (const wl of worldlines) {
      ctx.strokeStyle = wl.accelerated ? colors.accelerated : wl.color;
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      let first = true;
      for (const ev of wl.events) {
        // Use ev.t directly as the ct coordinate (caller is expected to pass ct units).
        const px = xToPx(ev.x);
        const py = tToPx(ev.t);
        if (first) {
          ctx.moveTo(px, py);
          first = false;
        } else {
          ctx.lineTo(px, py);
        }
      }
      ctx.stroke();

      // Label at last event
      if (wl.label && wl.events.length > 0) {
        const last = wl.events[wl.events.length - 1];
        ctx.fillStyle = wl.accelerated ? colors.accelerated : wl.color;
        ctx.font = "12px ui-monospace, monospace";
        ctx.fillText(wl.label, xToPx(last.x) + 6, tToPx(last.t));
      }
    }
  }, [worldlines, lightCone, simultaneitySlice, beta, xRange, tRange, width, height, colors]);

  return (
    <div className="flex flex-col gap-2">
      <canvas ref={canvasRef} className="rounded-md border border-white/10 bg-black/40" />
      {onBoostChange !== undefined ? (
        <label className="flex items-center gap-3 font-mono text-xs text-white/70">
          <span>β = {beta.toFixed(2)}</span>
          <input
            type="range"
            min={boostMin}
            max={boostMax}
            step={boostStep}
            value={beta}
            onChange={(e) => onBoostChange(parseFloat(e.target.value))}
            className="flex-1"
          />
        </label>
      ) : null}
    </div>
  );
}
```

- [ ] **Step 4: Register SpacetimeDiagramCanvas in the simulation registry**

This primitive is consumed by Wave 2 topic agents via SceneCard, but each topic-specific Scene component will wrap it (e.g., `TimeDilationScene` imports `SpacetimeDiagramCanvas` and configures worldlines internally). Because SceneCards reference scene names from the registry, the primitive itself does NOT need a registry entry — only the topic-specific scenes do. Skip registry edit here.

- [ ] **Step 5: Author render-smoke test**

```tsx
import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { SpacetimeDiagramCanvas } from "./SpacetimeDiagramCanvas";
import type { Worldline } from "@/lib/physics/relativity/types";

describe("SpacetimeDiagramCanvas", () => {
  it("renders without crashing on an empty worldline list", () => {
    const { container } = render(<SpacetimeDiagramCanvas worldlines={[]} />);
    expect(container.querySelector("canvas")).not.toBeNull();
  });

  it("renders a single worldline + light cone", () => {
    const wl: Worldline = {
      events: [
        { t: 0, x: 0, y: 0, z: 0 },
        { t: 1, x: 0, y: 0, z: 0 },
        { t: 2, x: 0, y: 0, z: 0 },
      ],
      color: "#67E8F9",
      label: "stationary",
    };
    const { container } = render(<SpacetimeDiagramCanvas worldlines={[wl]} lightCone={true} />);
    expect(container.querySelector("canvas")).not.toBeNull();
  });

  it("renders boost slider when onBoostChange is provided", () => {
    const { container } = render(
      <SpacetimeDiagramCanvas worldlines={[]} boostBeta={0.3} onBoostChange={() => {}} />,
    );
    expect(container.querySelector("input[type=range]")).not.toBeNull();
  });

  it("hides boost slider in uncontrolled (no onBoostChange) mode", () => {
    const { container } = render(<SpacetimeDiagramCanvas worldlines={[]} boostBeta={0.5} />);
    expect(container.querySelector("input[type=range]")).toBeNull();
  });
});
```

- [ ] **Step 6: Run tests + tsc**

```bash
pnpm tsc --noEmit
pnpm vitest run components/physics/_shared/SpacetimeDiagramCanvas.test.tsx
```

Expected: clean tsc; 4/4 tests pass. Canvas is rendered via jsdom which doesn't actually paint pixels but DOES surface render errors — sufficient for smoke.

- [ ] **Step 7: Commit**

```bash
git add components/physics/_shared/
git commit -m "$(cat <<'EOF'
feat(rt/_shared): SpacetimeDiagramCanvas primitive

Minkowski-diagram canvas with worldlines, light cones, simultaneity
slices, and boosted-frame axes overlay with optional β slider.
Used by §01.5 relative-simultaneity, §02.1 time-dilation, §02.3
the-lorentz-transformation in this session; ready for §03.1 + §03.5
in Session 2 (twin-paradox + spacetime-diagrams).

Color convention matches the SR palette: cyan stationary, magenta
boosted, amber light cones, orange accelerated worldlines.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Wave 2 — Per-topic authoring (10 parallel subagents)

**Dispatch ALL 10 in a single message** with multiple Agent tool calls in parallel. Each subagent runs to completion independently.

### Shared instructions for every Wave 2 task

These instructions are identical across all 10 topic tasks. Copy them into each agent's prompt verbatim.

**Parallel-safety contract (DO NOT VIOLATE):**

1. **DO NOT touch `lib/content/simulation-registry.ts`.** Return the 3 entries the orchestrator needs to append, in this exact format inside your final report:

```
REGISTRY_BLOCK:
  // RT §0X — <slug>
  <SceneOneName>: lazyScene(() =>
    import("@/components/physics/<slug>/<scene-one-name>-scene").then((m) => ({ default: m.<SceneOneName> })),
  ),
  <SceneTwoName>: lazyScene(() =>
    import("@/components/physics/<slug>/<scene-two-name>-scene").then((m) => ({ default: m.<SceneTwoName> })),
  ),
  <SceneThreeName>: lazyScene(() =>
    import("@/components/physics/<slug>/<scene-three-name>-scene").then((m) => ({ default: m.<SceneThreeName> })),
  ),
```

2. **DO NOT publish.** Do not run `pnpm content:publish`. The orchestrator publishes per-topic in Wave 2.5.
3. **DO NOT commit.** The orchestrator commits per-topic in Wave 2.5.
4. **`<Term slug="...">` MUST refer to a slug that exists in `lib/content/glossary.ts`** as of Wave 1's commit. Topic slugs are NOT auto-resolved as glossary terms. If you find yourself wanting `<Term slug="time-dilation">` and `time-dilation` is BOTH a topic and a glossary term — use it (the glossary entry exists from Wave 1). If you want `<Term slug="four-vector">`, that exists from EM §11. If a needed term is missing from glossary, either author plain text OR include it in your final report under `MISSING_TERMS:` so the orchestrator can patch the seed before Wave 3.
5. **`<PhysicistLink slug="...">` MUST refer to a slug that exists in `lib/content/physicists.ts`.** Albert Michelson is added in Wave 1; Einstein, Lorentz, Poincaré, Minkowski, Fizeau, Foucault, Doppler, Maxwell are pre-existing. Anyone else: plain text only.

**Vertical slice every agent ships:**

1. `lib/physics/relativity/<topic>.ts` — pure TS, no React. Imports from `@/lib/physics/constants` (mainly `SPEED_OF_LIGHT`) and `@/lib/physics/relativity/types`.
2. `tests/physics/relativity/<topic>.test.ts` — vitest. 6–12 test cases covering known-value spot checks, limit cases, and at least one invariant check.
3. 3 simulation components in `components/physics/<topic>/`:
   - File names: `<scene-one-name>-scene.tsx`, etc. (kebab-case file → PascalCase export).
   - Each is `"use client"`, imports React + `useRef`/`useEffect`/`useState` as needed.
   - Use Canvas 2D for animated physics. SVG for static diagrams. The shared `SpacetimeDiagramCanvas` for any Minkowski-diagram visualization (§01.5, §02.1, §02.3).
   - Style: dark canvas (`bg-black/40` or `bg-[#0A0C12]`), HUD overlay with `font-mono text-xs text-white/70`. Match the scene-color convention: cyan/blue for stationary frame; magenta/red for boosted frame; amber for light; orange for accelerated worldlines.
4. `app/[locale]/(topics)/relativity/<slug>/page.tsx` — copy from `app/[locale]/(topics)/electromagnetism/the-electromagnetic-field-tensor/page.tsx` verbatim and change ONLY the `SLUG` constant to `relativity/<topic-slug>`.
5. `content/relativity/<slug>.en.mdx` — compose from `<TopicPageLayout aside={[...]}>`, `<TopicHeader>`, numbered `<Section>`s, `<SceneCard component="..." props={...}>`, `<EquationBlock id="EQ.0X">$$ … $$</EquationBlock>` (CHILDREN form, single-backslash LaTeX), `<Callout variant="intuition|math|warning">`s, inline `<PhysicistLink>` and `<Term>`. Target word count: 1000–1400 per topic.

**MDX gotchas:**
- (i) NO nested JSX in `title="..."` attributes — keep human/term links to body prose.
- (ii) Multi-line `$$ ... \\\\\\\\<newline> ... $$` LaTeX may choke micromark — collapse to single-line `$$...$$` per equation, or break across multiple `<EquationBlock>`s.
- (iii) Bare `<` in prose can parse as JSX tag opener — escape as `&lt;` or reword.
- (iv) `<EquationBlock>$$...$$</EquationBlock>` uses CHILDREN form — single-backslash LaTeX (`\beta`, `\gamma`). The session-7 plan's "double-backslash gotcha" is **non-issue** for the children form. Only if you switch to the `tex={\`...\`}` template-literal prop form does double-backslash become required.
- (v) For §02.3 the-lorentz-transformation specifically: the 4×4 boost matrix is the densest LaTeX of this session. Test on FIRST publish — if it parses empty, fall back to a row-stacked `\begin{aligned}` form with line breaks per row. If parses fine, `\begin{pmatrix}` is preferred.

**Voice (per spec + prompt.md "Voice reminder"):**
- §01 is the demolition. Galileo's relativity worked for matter but not for light. Maxwell's c lives in two SI numbers. Michelson-Morley 1887 says the aether is gone. Einstein 1905 elevates c to a postulate. §01.5 is the unsettling moment — the train-and-platform thought experiment, two lightning bolts, two observers, no agreement. Newtonian time dies on the page. Don't soften.
- §02 is the rebuild. Time stretches, length contracts, velocities add by a non-Galilean rule, frequencies shift in a way Doppler 1842 couldn't have anticipated.
- The closing sentence of §02.5 `relativistic-doppler` should set up §03 explicitly: "Time, length, velocity, frequency — they don't transform separately. They're four shadows of one 4D rotation. The next module shows you the geometry."

**Cross-refs to EM (must include where natural):**
- RT §02.3 `the-lorentz-transformation` should include `<Term>` linking back to EM §11.2 `e-and-b-under-lorentz` as "the field application of the same algebra." (NOTE: the actual GLOSSARY slug for "the topic about E and B under Lorentz" is the topic slug, not a glossary slug — write it as plain prose with a link via Markdown: `[the EM application](/electromagnetism/e-and-b-under-lorentz)`. Don't use `<Term>` for topic slugs.)
- RT §02.1 `time-dilation` should reference EM §11.4 `magnetism-as-relativistic-electrostatics` as "the kinematic consequence at the heart of the EM-relativity reveal." Same plain-prose-link treatment.

**Forward-references:**
- §01 prose may reference: `spacetime`, `world-line`, `proper-time`, `light-cone`, `invariant-interval`, `four-vector` (already exists from EM §11). All except `four-vector` are §03 topics; for those, write plain text or add the slug to your `MISSING_TERMS:` report so the orchestrator can patch the seed with placeholder glossary entries.
- §02 prose may reference: `mass-energy-equivalence`, `four-momentum`, `e-mc-squared` (§04 topics). Same treatment.

**Final report format every Wave 2 agent returns:**

```
TOPIC: <slug>
WORD_COUNT: <n>
TESTS: <n_passed>/<n_total>
REGISTRY_BLOCK:
  // RT §0X — <slug>
  <SceneOneName>: lazyScene(() => import("@/components/physics/<slug>/<scene-one-name>-scene").then((m) => ({ default: m.<SceneOneName> }))),
  ...
PUBLISH_ARG: relativity/<slug>
COMMIT_SUBJECT: feat(rt/§0X): <slug> — <one-liner>
MISSING_TERMS: [<slug1>, <slug2>, …]   # any glossary slugs the prose references that are missing from glossary.ts
NOTES: <any deviations or surprises the orchestrator should know about>
```

---

### Task 4: Topic `galilean-relativity` (FIG.01)

**Goal:** Galilean relativity worked for projectiles, throwing balls, and Newtonian mechanics — but it doesn't work for light. The reader should leave this topic understanding: (1) what an inertial frame is; (2) what Galilean velocity addition predicts; (3) why Maxwell's equations are NOT Galilean-invariant; (4) why "Galilean works for matter, breaks for light" is the cliff that §01.2–§01.5 tumble down.

**Files:**
- Create: `lib/physics/relativity/galilean.ts`
- Create: `tests/physics/relativity/galilean.test.ts`
- Create: `components/physics/galilean-relativity/galilean-boat-scene.tsx` — boat-on-river thought experiment, sliders for boat speed and current; predicted observed speed displayed.
- Create: `components/physics/galilean-relativity/maxwell-not-galilean-scene.tsx` — animation showing a wave equation under Galilean boost: lab frame has `c`, boosted frame has `c − v` per Galilean rules; predicted-vs-actual mismatch.
- Create: `components/physics/galilean-relativity/inertial-frames-scene.tsx` — three frames in relative motion, identical pendulum experiments running in each. Visual demonstration that Newtonian mechanics looks the same.
- Create: `app/[locale]/(topics)/relativity/galilean-relativity/page.tsx`
- Create: `content/relativity/galilean-relativity.en.mdx`

**Physics lib outline (`galilean.ts`):**

```typescript
import type { Vec4 } from "@/lib/physics/relativity/types";

/** Galilean boost along x by velocity v (m/s). Returns the new (t, x, y, z). */
export function galileanBoost(t: number, x: number, v: number): { t: number; x: number } {
  return { t, x: x - v * t };
}

/** Galilean velocity addition: u_lab = u_frame + v_frame. */
export function galileanVelocityAdd(uFrame: number, vFrame: number): number {
  return uFrame + vFrame;
}

/** Test whether a wave equation form is Galilean-invariant — toy signature
 *  returns the wave speed under boost, illustrating (c − v) ≠ c. */
export function galileanWaveSpeed(c: number, v: number): number {
  return c - v;
}
```

**Test cases:** boat-on-river known case (5 m/s + 3 m/s = 8 m/s); zero-boost identity; Galilean wave speed strict subtraction.

**Prose outline (1000–1200 words):**
1. **§1 The principle that worked for two centuries.** Newton's laws look the same in any inertial frame. Stand on a ship, throw a ball — same parabola whether the ship is docked or sailing. Galileo 1632, *Dialogue*: a man inside a sealed cabin can't tell whether the ship is moving. 200 words.
2. **§2 The boat on a river.** SceneCard: `galilean-boat-scene.tsx`. EQ.01 Galilean velocity addition `u = u' + v`. 200 words.
3. **§3 The math is a coordinate transform.** EQ.02: `t' = t, x' = x − vt, y' = y, z' = z`. The Galilean transformation as a passive coordinate change. 200 words.
4. **§4 The cliff: Maxwell's equations.** SceneCard: `maxwell-not-galilean-scene.tsx`. Maxwell predicts EM waves with speed `c = 1/√(μ₀ε₀)`. Galilean transform should give `c − v` in a moving frame. But Maxwell's equations are NOT Galilean-invariant. Either Galileo is right and Maxwell is wrong; or there is a special frame (the aether) where Maxwell holds; or — Einstein's eventual answer — the frame transform itself is wrong. 250 words.
5. **§5 What the next four sections do.** Forward-link: §01.2 measures c, §01.3 looks for the aether, §01.4 takes Einstein's leap, §01.5 watches Newtonian time die. 100 words.
6. **§6 Why Galileo wasn't wrong, just incomplete.** Galilean transformations are the v ≪ c limit of Lorentz transformations. The everyday boat-on-river works to ~10⁻¹⁶ at car speeds. Galileo: still right, almost everywhere. 100 words.

**Aside:** `galileo-galilei` (existing? grep first; if missing, omit), `isaac-newton`, `james-clerk-maxwell`, `galilean-invariance`, `aether-luminiferous` (forward-link to §01.3).

**Commit:** `feat(rt/§01): galilean-relativity — frames, the principle, the cliff Maxwell put under it`.

---

### Task 5: Topic `maxwell-and-the-speed-of-light` (FIG.02)

**Goal:** Maxwell's equations predict `c = 1/√(μ₀ε₀)` ≈ 3×10⁸ m/s — and crucially, they don't tell you which frame to measure that c in. The reader should leave understanding: (1) the historical chain Weber-Kohlrausch 1856 → Maxwell 1862 → Hertz 1888; (2) that c falls out of two SI numbers (μ₀, ε₀) that have nothing to do with optics; (3) that this is unique among classical equations and demands a special frame OR a postulate.

**Files:**
- Create: `lib/physics/relativity/maxwell-c.ts` — derives c from `MU_0` and `EPSILON_0`; Foucault's 1862 toothed-wheel measurement helper.
- Create: `tests/physics/relativity/maxwell-c.test.ts`
- Create: `components/physics/maxwell-and-the-speed-of-light/c-from-mu-epsilon-scene.tsx` — sliders for μ₀ and ε₀, live readout of `c = 1/√(μ₀ε₀)`. Modern values lock in to 299,792,458 m/s exact.
- Create: `components/physics/maxwell-and-the-speed-of-light/foucault-rotating-mirror-scene.tsx` — Foucault 1862 setup: light bounces from rotating mirror to distant fixed mirror and back. Mirror has rotated by angle θ; from θ deduce c. Sliders for distance and rotation rate.
- Create: `components/physics/maxwell-and-the-speed-of-light/hertz-spark-gap-scene.tsx` — Hertz 1887 dipole transmitter + spark-gap receiver, EM wave traveling between, modulating wavelength.

**Physics lib:** `cFromMuEpsilon(mu0: number, eps0: number): number`; `foucaultRotation(distance, rpm)` returns expected angular shift for a given c.

**Prose outline:** 1000–1200 words. Voice: c was lurking in EM constants six years before Maxwell saw it (Weber-Kohlrausch 1856 cite). The constant is empirical — it doesn't say what frame to be in. Foucault 1862 nailed c to <1% precision; Hertz 1887–1888 produced and detected EM waves at radio wavelengths; the wave equation `∂²E/∂t² = c²∇²E` IS Maxwell's prediction, made concrete. The mystery: Maxwell never asked which frame.

**Aside:** `james-clerk-maxwell`, `leon-foucault`, `aether-luminiferous`, `two-postulates` (forward-link to §01.4).

**Commit:** `feat(rt/§01): maxwell-and-the-speed-of-light — the constant in two SI numbers`.

---

### Task 6: Topic `michelson-morley` (FIG.03) — **MONEY SHOT**

**Goal:** the experiment that killed the aether. The reader should walk away with the visceral image of dashed-line-prediction-vs-solid-line-data NEVER MEETING, and understand: (1) the physical setup of the interferometer; (2) the predicted fringe shift `Δn = (2L/λ)(v²/c²)` for an aether wind v; (3) the observed fringe shift, which is statistically zero across every orientation Michelson and Morley could achieve.

**Files:**
- Create: `lib/physics/relativity/michelson-morley.ts` — `predictedFringeShift(L, lambda, vEarth, c)`, `expectedNullThreshold`.
- Create: `tests/physics/relativity/michelson-morley.test.ts`
- Create: `components/physics/michelson-morley/interferometer-apparatus-scene.tsx` — schematic of the apparatus: monochromatic source, beam splitter, two perpendicular arms with mirrors, recombiner, fringe-pattern viewer. Animated rotation 90° clockwise → counterclockwise.
- Create: `components/physics/michelson-morley/fringe-prediction-vs-data-scene.tsx` — **THE MONEY-SHOT GRAPH.** X-axis: apparatus rotation angle 0–360°. Y-axis: fringe shift in fractions of a fringe. Dashed amber line: classical-aether prediction `(2L/λ)(v²/c²)·cos(2θ)` ≈ ±0.4 fringes. Solid cyan line: observed shift, oscillating around 0 with ±0.01 fringe noise. Both lines overlaid; dashed never reaches solid. The aether dies on screen.
- Create: `components/physics/michelson-morley/aether-wind-attempt-scene.tsx` — Earth orbiting Sun at 30 km/s; if aether is at rest in Sun's frame, Earth feels a 30 km/s wind. Animation showing the apparatus moving through this hypothesized wind, with no measurable fringe shift detected.

**Physics lib:** `predictedFringeShift(L, lambda, v, c) = (2 * L / lambda) * (v * v) / (c * c)`.

**Prose outline:** 1100–1300 words. Voice: rupture mode. The negative result they couldn't explain became Einstein's positive postulate. Lorentz and FitzGerald independently proposed real material contraction in the aether — Lorentz believed it. Einstein's contribution wasn't the algebra; it was the geometry. Don't preview that yet; that's §01.4.

**Aside:** `albert-michelson` (new from Wave 1), `hendrik-antoon-lorentz`, `aether-luminiferous`.

**Commit:** `feat(rt/§01): michelson-morley — the interferometer that asked the aether and got no answer`.

---

### Task 7: Topic `einsteins-two-postulates` (FIG.04)

**Goal:** what Einstein actually did in 1905. Two postulates: (1) the principle of relativity (laws of physics same in all inertial frames); (2) the constancy of c (the speed of light is the same in all inertial frames). EVERYTHING ELSE in special relativity follows from these two. The reader should grasp how unsettling postulate (2) is — it's logically incompatible with Galilean velocity addition.

**Files:**
- Create: `lib/physics/relativity/postulates.ts` — `galileanCAdd(c, v)` returns `c − v`; `einsteinCAdd(c, v)` returns `c` (the postulate itself, encoded as a function); a `compareAtVariousV` helper for the demo scene.
- Create: `tests/physics/relativity/postulates.test.ts`
- Create: `components/physics/einsteins-two-postulates/postulate-comparison-scene.tsx` — side-by-side: lab observer fires a flashlight; Galilean prediction, observer in moving frame sees `c−v`; Einstein prediction, observer sees `c`. Slider for `v` — Galilean line drops to zero at v=c, Einstein line stays flat at c.
- Create: `components/physics/einsteins-two-postulates/light-clock-scene.tsx` — preview light-clock for §02.1 time-dilation. Photon bouncing between two mirrors; in moving frame, the photon traces a longer zig-zag path; postulate (2) demands the same speed → time must dilate. Set up the kinematic-derivation cliff for §02.
- Create: `components/physics/einsteins-two-postulates/einstein-1905-paper-scene.tsx` — an annotated facsimile of the opening of "On the Electrodynamics of Moving Bodies" (Annalen der Physik, 1905). Highlights the two postulates as Einstein wrote them. Static SVG ok.

**Physics lib:** structural — encodes the postulates as functions for use in scenes.

**Prose outline:** 1000–1200 words. Voice: the rupture is the conceptual move. Lorentz had the algebra in 1904. Einstein wrote: "The introduction of a 'luminiferous aether' will prove to be superfluous." He took two postulates SERIOUSLY and let everything else fall out — including the algebra Lorentz had. Time will dilate. Length will contract. Simultaneity will become observer-dependent. Newtonian time dies in §01.5.

**Aside:** `albert-einstein`, `hendrik-antoon-lorentz`, `henri-poincare` (Poincaré's 1905 paper landed parallel; Einstein's was philosophically primary), `two-postulates`.

**Commit:** `feat(rt/§01): einsteins-two-postulates — drop one assumption, take one fact at face value`.

---

### Task 8: Topic `relative-simultaneity` (FIG.05) — **HONEST MOMENT APEX**

**Goal:** train-and-platform thought experiment, two lightning bolts, two observers, NO AGREEMENT on simultaneity. The reader should feel the floor drop out from under Newtonian time. **Don't soften this.** This is the gut-punch topic of §01.

**Files:**
- Create: `lib/physics/relativity/simultaneity.ts` — given two events `E1 = (t1, x1)` and `E2 = (t2, x2)`, compute `t1' − t2'` for an observer moving with β. The classic result: events simultaneous in lab frame are not simultaneous in moving frame unless they coincide in space.
- Create: `tests/physics/relativity/simultaneity.test.ts`
- Create: `components/physics/relative-simultaneity/train-and-platform-scene.tsx` — animated train moving past a platform; two lightning bolts strike both ends of the train simultaneously per platform observer. Train passenger at center: meets the front-end light first. Two timeline strips below show the events as ordered by each observer.
- Create: `components/physics/relative-simultaneity/spacetime-diagram-scene.tsx` — uses `SpacetimeDiagramCanvas` (Wave 1.5 primitive). Two events plotted in lab frame as simultaneous (same t-coordinate). Boost slider — as β increases, the simultaneity slice tilts and the events become non-simultaneous in the boosted frame. The geometry of the result.
- Create: `components/physics/relative-simultaneity/simultaneity-slider-scene.tsx` — single slider, three observers' views: stationary frame agrees A and B simultaneous; observer moving toward A sees A first; observer moving toward B sees B first. The conclusion that flashes across the bottom: "There is no privileged 'now' extending across space."

**Physics lib:**

```typescript
import { SPEED_OF_LIGHT } from "@/lib/physics/constants";
import { gamma } from "./types";

/** Time difference between two events in a frame moving with velocity βc along x. */
export function tPrimeDifference(t1: number, x1: number, t2: number, x2: number, beta: number): number {
  const c = SPEED_OF_LIGHT;
  const g = gamma(beta);
  // t' = γ(t − βx/c) — so t1' − t2' = γ((t1 − t2) − β(x1 − x2)/c)
  return g * ((t1 - t2) - (beta / c) * (x1 - x2));
}
```

**Test cases:** events simultaneous in lab AND coincident in space remain simultaneous in any frame; events simultaneous in lab BUT spatially separated become non-simultaneous in any boosted frame; sign convention check (observer moving toward earlier-x sees that event first).

**Prose outline:** 1100–1300 words. Voice: rupture mode. Don't soften.
- §1 The setup. Two lightning bolts strike both ends of a moving train. 200 w.
- §2 The platform observer's view. Light from both ends reaches her simultaneously. She concludes the bolts struck simultaneously. SceneCard: `train-and-platform-scene.tsx`. 250 w.
- §3 The passenger's view. She is moving toward the front of the train, so she meets the front-end light first. She concludes the front-end bolt struck first. 250 w.
- §4 Both are right. Postulate 2 says light moves at c in both frames. The two observations are mutually consistent under SR. Galilean relativity could not have produced this. 250 w.
- §5 The geometry. SceneCard: `spacetime-diagram-scene.tsx`. The simultaneity slice tilts under boost. 200 w.
- §6 What dies on this page. Newtonian time dies. There is no universal "now." Every assumption you have ever made about "two things happening at the same time" was an assumption that you were not moving relative to those things. 150 w. **Callout (warning variant):** "Every assumption you have ever made about 'two things happening at the same time' was actually an assumption that you are not moving relative to those things. Drop that assumption — and you have to drop simultaneity itself."

**Aside:** `albert-einstein`, `hermann-minkowski` (geometry credit, full treatment §03), `simultaneity-relative`.

**Commit:** `feat(rt/§01): relative-simultaneity — Newtonian time dies on the page`.

---

### Task 9: Topic `time-dilation` (FIG.06) — **§02 MONEY SHOT**

**Goal:** moving clocks run slow. Money shot: atmospheric muon shower. Muons created at ~10 km altitude with rest-frame half-life τ = 2.2 μs. At 99.5%c they classically should travel only ~660 m before half decay. Sea-level detectors observe ~7× the predicted survival rate. γ ≈ 10 explains it exactly.

**Files:**
- Create: `lib/physics/relativity/time-dilation.ts` — `dilatedTime(t0, beta) = gamma(beta) * t0`; `properTime(dt_lab, beta) = dt_lab / gamma(beta)`; `muonSurvivalFraction(distance, beta, halfLife)`.
- Create: `tests/physics/relativity/time-dilation.test.ts`
- Create: `components/physics/time-dilation/light-clock-scene.tsx` — light bouncing between two mirrors. Lab frame: photon traces zig-zag, longer path → longer time. Proper frame: photon goes straight up and down → shorter time. Slider for β; the "tick" rate visibly slows as β increases.
- Create: `components/physics/time-dilation/muon-shower-scene.tsx` — **MONEY SHOT.** 10 km column of atmosphere. Cloud of muons created at top with v = 0.995c. Animation runs 22 μs (lab time) — proper-time clock on each muon ticks 2.2 μs. Visualizer: ~50% of muons survive at sea level, vs the classical prediction of ~7% (a 7× excess). HUD shows: lab clock 22 μs, proper time 2.2 μs, γ ≈ 10, both observers agree on the muon count.
- Create: `components/physics/time-dilation/spacetime-clock-scene.tsx` — uses `SpacetimeDiagramCanvas`. Stationary clock worldline = vertical. Moving clock worldline = tilted. Light pulse (45° dashed line) bouncing between two mirrors on each worldline. The ticks of each clock visibly mark proper time per worldline; the moving clock has visibly fewer ticks per unit lab time.

**Physics lib:**

```typescript
import { gamma } from "./types";

/** Lab-frame elapsed time for a clock that ticks t0 in its rest frame, moving at βc. */
export function dilatedTime(t0: number, beta: number): number {
  return gamma(beta) * t0;
}

/** Proper time for a clock moving at βc in lab where dt_lab elapses. */
export function properTime(dtLab: number, beta: number): number {
  return dtLab / gamma(beta);
}

/** Survival fraction of muons traversing a distance L at βc, given lab-frame half-life τ.
 *  Lab-frame travel time t_lab = L / (β·c). Proper-time elapsed t_proper = t_lab / γ.
 *  Surviving fraction = 2^(-t_proper / τ). Returns the fraction in [0, 1]. */
export function muonSurvivalFraction(L: number, beta: number, halfLifeRest: number, c: number): number {
  const tLab = L / (beta * c);
  const tProper = tLab / gamma(beta);
  return Math.pow(2, -tProper / halfLifeRest);
}
```

**Test cases:** zero-β identity; β=0.5 gives γ ≈ 1.155; muon survival at 10 km / β=0.995 / τ=2.2 μs ≈ 0.49 (matches 7× the classical 0.07).

**Prose outline:** 1100–1300 words. Voice: rebuild mode opens. The light-clock derivation is the cleanest. The muon shower is the experimental fact that turns derivation into reality. Cross-link to EM §11.4 magnetism-as-relativistic-electrostatics as "the kinematic consequence at the heart of the EM-relativity reveal."

**Aside:** `albert-einstein`, `hendrik-antoon-lorentz`, `time-dilation`.

**Commit:** `feat(rt/§02): time-dilation — moving clocks tick slow, and muons prove it`.

---

### Task 10: Topic `length-contraction` (FIG.07)

**Goal:** moving rulers are shorter. The complement of time dilation. The reader should grasp: (1) `L = L₀/γ` along the direction of motion only; (2) it's not optical, not material — it's a geometric statement about the lab-frame measurement; (3) the muon shower picture from the muon's frame: the atmosphere is contracted, the mountain is closer, no time-dilation needed in this frame.

**Files:**
- Create: `lib/physics/relativity/length-contraction.ts`
- Create: `tests/physics/relativity/length-contraction.test.ts`
- Create: `components/physics/length-contraction/rod-contraction-scene.tsx` — rod at rest with marked length L₀; β slider; lab observer sees rod contract along x. Heuristic visualization: the rod's two endpoints' worldlines, simultaneously sampled in the lab frame at smaller lab-frame separation.
- Create: `components/physics/length-contraction/muon-from-its-frame-scene.tsx` — same physics as §02.1 muon shower, but in the muon's rest frame. The atmosphere is 1 km tall (contracted from 10 km), and the muon waits for the contracted atmosphere to whoosh past at 0.995c. Half-life is 2.2 μs and 1 km / 0.995c ≈ 3.35 μs ≈ 1.5 half-lives. Survival fraction ≈ 0.35. Same answer, different frame.
- Create: `components/physics/length-contraction/garage-paradox-preview-scene.tsx` — 5-meter pole, 4-meter garage. From garage's frame, pole contracts to 4m and fits. From pole's frame, garage contracts and is too small. Forward-link to §05.1 the-barn-pole-paradox (full resolution). This scene just sets up the disturbance.

**Physics lib:** `contractedLength(L0, beta) = L0 / gamma(beta)`; `restLength(L_lab, beta) = L_lab * gamma(beta)`.

**Test cases:** zero-β identity; symmetry of rest-vs-lab; perpendicular dimensions unchanged.

**Prose outline:** 1000–1200 words. Voice: complement of §02.1. The muon's frame is the key conceptual move — same physics, different bookkeeping, both right.

**Aside:** `hendrik-antoon-lorentz`, `albert-einstein`, `length-contraction`.

**Commit:** `feat(rt/§02): length-contraction — moving rulers shrink, and you can derive it without owning one`.

---

### Task 11: Topic `the-lorentz-transformation` (FIG.08) — **DENSEST LATEX OF SESSION**

**Goal:** the four lines of algebra that replaced Galileo. `t' = γ(t − vx/c²)`, `x' = γ(x − vt)`, `y' = y`, `z' = z`. The reader should grasp: (1) it reduces to Galileo at v ≪ c; (2) inverse transform looks the same with `v → −v` (the velocity reverses); (3) it preserves the invariant interval `s² = c²t² − x² − y² − z²`; (4) it's a rotation in 4D pseudo-Euclidean spacetime — the geometric statement Minkowski formalized in 1908.

**Files:**
- Create: `lib/physics/relativity/lorentz.ts` — `lorentzTransform(t, x, beta, c)`, `inverseLorentz`, `interval(t, x, y, z, c)`. Uses `boostX` from `@/lib/physics/relativity/types` for the matrix form.
- Create: `tests/physics/relativity/lorentz.test.ts`
- Create: `components/physics/the-lorentz-transformation/galilean-vs-lorentz-scene.tsx` — side-by-side coordinate transforms. β slider 0 → 0.95. Galilean stays linear; Lorentz introduces γ-factor and the cross-term. Visual: a rectangle of events in lab frame; how it maps under each transform.
- Create: `components/physics/the-lorentz-transformation/invariant-interval-scene.tsx` — uses `SpacetimeDiagramCanvas`. Pick an event A at origin; pick event B somewhere. Show `s² = c²Δt² − Δx²` is preserved as β slides. Three event-pair examples: timelike (s² > 0), spacelike (s² < 0), null (s² = 0 = light worldline).
- Create: `components/physics/the-lorentz-transformation/4x4-matrix-scene.tsx` — display the boost matrix Λ as a 4×4 grid; β slider; cells light up showing which component each γ-factor multiplies; click a row to see "what happens to t' under this boost."

**Physics lib:**

```typescript
import { SPEED_OF_LIGHT } from "@/lib/physics/constants";
import { gamma, boostX, applyMatrix } from "./types";
import type { Vec4 } from "./types";

export function lorentzTransform(t: number, x: number, beta: number): { t: number; x: number } {
  const c = SPEED_OF_LIGHT;
  const g = gamma(beta);
  return {
    t: g * (t - (beta / c) * x),
    x: g * (x - beta * c * t),
  };
}

/** Inverse of lorentzTransform — equivalent to a boost by −β. */
export function inverseLorentz(tPrime: number, xPrime: number, beta: number): { t: number; x: number } {
  return lorentzTransform(tPrime, xPrime, -beta);
}

/** Invariant spacetime interval s² = (ct)² − x² − y² − z². */
export function interval(t: number, x: number, y: number, z: number): number {
  const c = SPEED_OF_LIGHT;
  return (c * t) ** 2 - x * x - y * y - z * z;
}

/** Apply the Lorentz boost matrix to a Vec4 (ct, x, y, z) — wraps boostX from types. */
export function applyLorentzBoost(v: Vec4, beta: number): Vec4 {
  return applyMatrix(boostX(beta), v);
}
```

**Test cases:** identity at β=0; round-trip lorentz then inverse-lorentz returns starting coords; interval preservation under boost; v ≪ c limit reduces to Galilean (x' ≈ x − vt, t' ≈ t to leading order).

**Prose outline:** 1200–1400 words. **Densest LaTeX of session.** Voice: Lorentz had the algebra in 1904. Lorentz believed it was real material contraction in the aether. Einstein took the algebra and reinterpreted it as geometry. Poincaré in 1905 completed the group structure (the boosts form a group). Use `\begin{pmatrix}\gamma & -\gamma\beta & 0 & 0 \\ -\gamma\beta & \gamma & 0 & 0 \\ 0 & 0 & 1 & 0 \\ 0 & 0 & 0 & 1\end{pmatrix}` — TEST FIRST in Wave 2.5 before authoring §02.4 + §02.5. If `pmatrix` parses empty, fall back to row-stacked `\begin{aligned} t' &= \gamma(t - vx/c^2) \\\\ x' &= \gamma(x - vt) \\\\ y' &= y \\\\ z' &= z \end{aligned}`.

**Cross-ref EM:** plain prose link to `[the EM application](/electromagnetism/e-and-b-under-lorentz)` — the field-tensor companion treatment.

**Aside:** `hendrik-antoon-lorentz`, `henri-poincare`, `albert-einstein`, `lorentz-transformation`.

**Commit:** `feat(rt/§02): the-lorentz-transformation — four lines of algebra replace Galileo`.

---

### Task 12: Topic `velocity-addition` (FIG.09)

**Goal:** the relativistic addition formula `u = (u' + v) / (1 + u'v/c²)`. The reader should grasp: (1) it reduces to `u = u' + v` for `u', v ≪ c`; (2) `c + c = c` per the formula (light, uniquely, doesn't add); (3) no matter how fast the source moves, you can never observe a particle going faster than c. Money historical hint: Fizeau 1851 measured fringe shifts in moving water and got a result that classical addition couldn't explain — six years before Maxwell, the partial-dragging coefficient turns out to be Lorentz's velocity-addition formula at order v/c.

**Files:**
- Create: `lib/physics/relativity/velocity-addition.ts` — `relativisticVelocityAdd(uPrime, v, c)`; `partialDraggingFizeau(nIndex, vWater, c)`.
- Create: `tests/physics/relativity/velocity-addition.test.ts`
- Create: `components/physics/velocity-addition/two-rockets-scene.tsx` — Earth's frame, Rocket A moving at 0.6c, Rocket B fired from A at 0.6c forward. Galilean prediction: Earth sees B at 1.2c. Relativistic answer: 0.88c. Slider for both speeds; live readout.
- Create: `components/physics/velocity-addition/light-from-moving-source-scene.tsx` — flashlight on a spaceship. Spaceship velocity slider; speed-of-emitted-light readout. Always c. The postulate, made visceral.
- Create: `components/physics/velocity-addition/fizeau-water-tube-scene.tsx` — Fizeau 1851: light passing through moving water. Drag coefficient `1 − 1/n²` falls out of relativistic addition. The Lorentz contraction was already there 50 years before Lorentz wrote it.

**Physics lib:** `relativisticVelocityAdd(uPrime, v, c) = (uPrime + v) / (1 + uPrime * v / (c * c))`.

**Test cases:** Galilean limit at low speed; `c + v = c` for any v; symmetry; Fizeau's `1 − 1/n²` drag coefficient at low water speed.

**Prose outline:** 1000–1200 words. Voice: §02 rebuild continuing. The formula is the velocity-cap. `c + c = c` is the universe's hard ceiling. Fizeau 1851 is the experimental hint that classical velocity addition fails for light in moving media — 54 years before Einstein.

**Aside:** `hippolyte-fizeau`, `albert-einstein`, `velocity-addition-relativistic`.

**Commit:** `feat(rt/§02): velocity-addition — c is the universe's hard ceiling`.

---

### Task 13: Topic `relativistic-doppler` (FIG.10) — **§02 closer**

**Goal:** the relativistic Doppler factor `f_obs = f_emit · √((1−β)/(1+β))` (longitudinal recession). Plus the **transverse** Doppler — purely a time-dilation effect, no classical analog: even when a source moves perpendicular to the line of sight, its frequency is observed shifted. Closes §02 with a sentence that sets up §03 explicitly.

**Files:**
- Create: `lib/physics/relativity/doppler-relativistic.ts` — `longitudinalDoppler(fEmit, beta)`, `transverseDoppler(fEmit, beta)`.
- Create: `tests/physics/relativity/doppler-relativistic.test.ts`
- Create: `components/physics/relativistic-doppler/redshift-blueshift-scene.tsx` — receding source: spectrum shifts red. Approaching: blue. Slider for β; visible spectrum bar slides. Numerical readout of f_obs/f_emit.
- Create: `components/physics/relativistic-doppler/transverse-doppler-scene.tsx` — source orbiting observer at 0.5c; line-of-sight velocity is zero at the perpendicular moment, but the observed frequency is still shifted by 1/γ. The pure-time-dilation effect, no classical analog.
- Create: `components/physics/relativistic-doppler/cosmological-preview-scene.tsx` — a galaxy at z = 1 (forward-link to §12.3 hubble-and-cosmological-redshift). Show: this is NOT relativistic Doppler — it's metric expansion. Set up the §12 distinction, then return to §02's punchline.

**Physics lib:**

```typescript
import { gamma } from "./types";

/** Longitudinal recession: f_obs = f_emit · √((1−β)/(1+β)). β > 0 means receding. */
export function longitudinalDoppler(fEmit: number, beta: number): number {
  return fEmit * Math.sqrt((1 - beta) / (1 + beta));
}

/** Transverse Doppler: pure time-dilation, f_obs = f_emit / γ(β). */
export function transverseDoppler(fEmit: number, beta: number): number {
  return fEmit / gamma(beta);
}
```

**Test cases:** β=0 identity for both; receding β > 0 redshifts; approaching β < 0 blueshifts; transverse always redshifts; longitudinal collapses to classical at low β.

**Prose outline:** 1000–1200 words. Voice: §02 closes here. End with the explicit §03 setup: "Time, length, velocity, frequency — they don't transform separately. They're four shadows of one 4D rotation. The next module shows you the geometry."

**LaTeX risk:** the longitudinal Doppler factor `\sqrt{(1+\beta)/(1-\beta)}` is dense; verify on first publish (Wave 2.5).

**Aside:** `christian-doppler`, `albert-einstein`, `relativistic-doppler`, `transverse-doppler`.

**Commit:** `feat(rt/§02): relativistic-doppler — color tells you motion, and §02 closes on §03's cliff`.

---

## Wave 2.5 — Registry merge + publish + per-topic commit (orchestrator inline, serial)

**Order: §01.1 → §01.2 → §01.3 → §01.4 → §01.5 → §02.1 → §02.2 → §02.3 → §02.4 → §02.5.**

**Why this order:** sequential FIG order is natural; **§02.3 the-lorentz-transformation is the riskiest publish** (densest LaTeX). When you reach it, publish first; if `0 inserted / 0 updated` returns, the `pmatrix` is parsing empty — switch to `\begin{aligned}` row form and republish before authoring §02.4 + §02.5.

For each Wave 2 topic, in order:

- [ ] **Step 1:** Open `lib/content/simulation-registry.ts`. Append the agent's `REGISTRY_BLOCK:` content under the existing entries with a `// RT §0X — <slug>` section comment.

- [ ] **Step 2:** Run typecheck.

```bash
pnpm tsc --noEmit
```

Expected: clean.

- [ ] **Step 3:** Publish the topic.

```bash
pnpm content:publish --only relativity/<slug>
```

Expected: `1 added` (first publish) or `1 updated`. **If `0 added / 0 updated`,** the MDX parsed empty — investigate. Check for: (a) bare `<` in prose, (b) multi-line `$$...$$`, (c) JSX inside `title=""` attribute, (d) the §02.3 `pmatrix` failing.

- [ ] **Step 4:** Commit the topic.

```bash
git add lib/content/simulation-registry.ts \
  lib/physics/relativity/<topic>.ts \
  tests/physics/relativity/<topic>.test.ts \
  components/physics/<slug>/ \
  app/\[locale\]/\(topics\)/relativity/<slug>/ \
  content/relativity/<slug>.en.mdx
git commit -m "$(cat <<'EOF'
<COMMIT_SUBJECT from agent's report>

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

Repeat for all 10 topics.

---

## Wave 3 — Finalize (1 subagent, orchestrator inline)

### Task 14: Run seed, smoke-test, update spec, log

**Files:**
- Modify: `docs/superpowers/specs/2026-04-29-relativity-branch-design.md`

- [ ] **Step 1: Pre-seed forward-ref scan**

```bash
# Scan the 10 new MDX files for any <Term slug="..."> calls.
grep -rohE '<Term slug="[^"]+"' content/relativity/ | sort -u
# Compare against existing GLOSSARY.
grep -E '^\s*slug:\s*"' lib/content/glossary.ts | head -300
```

For each `<Term>` slug not in glossary.ts, **add a forward-ref placeholder to `seed-rt-01.ts`'s GLOSSARY array** before running the seed. Pattern (from EM Sessions 4 + 7): `shortDefinition` says "placeholder, full treatment in §0X.Y," `description` is one paragraph. Likely placeholders this session: `spacetime`, `world-line`, `proper-time`, `light-cone`, `invariant-interval` (all §03), `mass-energy-equivalence`, `four-momentum` (§04). Skip placeholders that turned out unreferenced.

If new placeholders are added, this is the same pattern as EM Session 2's fresnel-equations follow-up — it counts as a separate `fix(rt/§02-§03)` commit before the main seed commit, OR fold into the seed commit if same fix-up.

- [ ] **Step 2: Run the seed**

```bash
pnpm exec tsx --conditions=react-server scripts/content/seed-rt-01.ts
```

Expected: "physicists: 1 inserted (or 0/1 updated), glossary: 10 inserted (or N inserted / M updated)." On a clean first run: "physicists: 1 inserted, glossary: 10 inserted." If forward-ref placeholders were added, count goes higher.

If parse errors surface (esbuild reporting line:column), they're typically embedded backticks or unescaped quotes inside template-literal descriptions — fix in place, re-run. Lesson from EM Session 7.

- [ ] **Step 3: Run full test sweep**

```bash
pnpm tsc --noEmit
pnpm vitest run
```

Expected: clean tsc; all tests green. Record vitest count in the implementation log.

- [ ] **Step 4: Build smoke**

```bash
pnpm build 2>&1 | tail -50
```

Expected: clean. The 10 new `/en/relativity/<slug>` + 10 `/he/relativity/<slug>` routes appear in the SSG output.

- [ ] **Step 5: Curl smoke (10 topic URLs + Michelson + new glossary)**

Start dev server on port 3001 (avoid stale port-3000 cache from earlier sessions per EM Session 7 lesson):

```bash
PORT=3001 pnpm dev &
sleep 5
for slug in galilean-relativity maxwell-and-the-speed-of-light michelson-morley einsteins-two-postulates relative-simultaneity time-dilation length-contraction the-lorentz-transformation velocity-addition relativistic-doppler; do
  echo "=== $slug ==="
  curl -s -o /dev/null -w "%{http_code}\n" http://localhost:3001/en/relativity/$slug
done
echo "=== albert-michelson ==="
curl -s -o /dev/null -w "%{http_code}\n" http://localhost:3001/en/physicists/albert-michelson
for term in galilean-invariance aether-luminiferous two-postulates simultaneity-relative time-dilation length-contraction lorentz-transformation velocity-addition-relativistic relativistic-doppler transverse-doppler; do
  echo "=== /dictionary/$term ==="
  curl -s -o /dev/null -w "%{http_code}\n" http://localhost:3001/en/dictionary/$term
done
echo "=== /en/relativity (branch hub) ==="
curl -s http://localhost:3001/en/relativity | grep -o "FIG.0[0-9]" | sort -u
kill %1 2>/dev/null
```

Expected: all 21 routes return 200; branch hub lists FIG.01 through FIG.10 (with FIG.11 onward also listed as `coming-soon` placeholders).

If any 500: the most common causes (per EM Sessions 1, 2, 7):
- (a) `paragraphsToBlocks` shape mismatch in seed → re-run seed with correct helper.
- (b) `<Term slug="...">` referencing a topic slug instead of glossary slug → fix MDX, re-publish.

- [ ] **Step 6: Update spec progress**

Open `docs/superpowers/specs/2026-04-29-relativity-branch-design.md`. Update:

- Status header (line 4): `**Status:** in progress — 10/61 topics shipped (16%)`.
- Module status table: `§01 SR foundations | 5 | 5 | ☑ complete`. `§02 SR kinematics | 5 | 5 | ☑ complete`. Total row: `**Total** | **61** | **10** | **16% complete**`.
- Per-topic checklist: flip 10 boxes 01–10.

- [ ] **Step 7: MemPalace implementation log**

Write to `wing=physics, room=decisions` via MCP:

```
File name: implementation_log_rt_session_1_sr_foundations_kinematics.md
```

Mirror the structure of `implementation_log_em_session_7_em_relativity.md`. Cover:
- Wave-by-wave summary (commits, file counts, runtime, deviations).
- (a) Did `SpacetimeDiagramCanvas` amortize as expected across §01.5 + §02.1 + §02.3? Is it ready for §03's twin-paradox in Session 2?
- (b) Did the §01.3 Michelson-Morley dashed-line-vs-solid-line money shot land?
- (c) Did the §01.5 simultaneity honest moment land — gut-punch or too soft?
- (d) Did `\begin{pmatrix}` for the §02.3 Lorentz boost matrix round-trip cleanly?
- (e) New forward-ref placeholders added (specific slugs).
- (f) Hebrew translation policy for the new branch.
- (g) Did EM↔RT cross-refs land cleanly (RT §02.3 → EM §11.2; RT §02.1 → EM §11.4)?
- (h) Was the Michelson combined-vs-split decision right? Did §01.3 prose feel like it needed Morley as a separate human story?

- [ ] **Step 8: Two final commits**

```bash
git add scripts/content/seed-rt-01.ts # only if seed was modified post-seed-run, e.g. for forward-ref placeholders
git commit -m "$(cat <<'EOF'
fix(rt/§01-§02): seed Michelson + glossary prose into Supabase

[describe forward-ref placeholders added if any]

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"

git add docs/superpowers/specs/2026-04-29-relativity-branch-design.md docs/superpowers/plans/2026-04-29-relativity-session-1-sr-foundations.md
git commit -m "$(cat <<'EOF'
docs(rt/§01-§02): mark SR foundations + kinematics complete — 10/61 (16%)

10 of 61 topics shipped. Branch RELATIVITY now live at index 3 / "§ 03".
Next session: §03 + §04 (geometry + dynamics).

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

- [ ] **Step 9: Report back**

Report to Roman:
- Branch flipped to `live` (with the index resolution chosen).
- 10 topics live at `/en/relativity/<slug>` (200 OK on all).
- Michelson + 10 glossary terms in Supabase.
- `SpacetimeDiagramCanvas` primitive built and reused across 3 topics this session.
- Spec progress: 10/61 (16%).
- Total commits this session: target 14 (1 Wave 0 + 1 Wave 1 + 1 Wave 1.5 + 10 Wave 2.5 + 1 Wave 3 seed + 1 Wave 3 spec) — give-or-take 1 for forward-ref follow-up.
- MemPalace log filed.
- Surprises / deviations.
- Recommended for Session 2: §03 + §04 (geometry + dynamics, 10 topics).

---

## Definition of done

- [ ] Branch `relativity` flipped from `coming-soon` → `live` in `lib/content/branches.ts`.
- [ ] `RELATIVITY_MODULES` populated with all 13 modules; `RELATIVITY_TOPICS` with all 61 entries (10 `live`, 51 `coming-soon`).
- [ ] All 10 §01–§02 topic pages render `200` at `/en/relativity/<slug>`.
- [ ] Branch hub `/en/relativity` lists FIG.01 through FIG.61.
- [ ] Albert Michelson + ~10 net new glossary entries live in Supabase via seed-rt-01.
- [ ] `SpacetimeDiagramCanvas` primitive at `components/physics/_shared/` with green vitest suite + README (RECOMMENDED — skip with explicit deferral note in log if Roman picks otherwise).
- [ ] `lib/physics/relativity/types.ts` with `Vec4`, `MinkowskiPoint`, `Worldline`, `LorentzMatrix`, `gamma`, `boostX`/`boostY`/`boostZ`, `rotation`, `applyMatrix`.
- [ ] `pnpm build` clean.
- [ ] `pnpm tsc --noEmit` clean.
- [ ] `pnpm vitest run` green.
- [ ] Spec progress table updated to 10/61 (16%).
- [ ] MemPalace implementation log filed at `wing=physics, room=decisions, file=implementation_log_rt_session_1_sr_foundations_kinematics.md`.
- [ ] Total commits this session: 14 ± 1.

## Risk notes

- **Lorenz vs Lorentz slug-collision** — most-misspelled pair of names in physics. `lorenz-gauge` (Ludvig Lorenz, no T, EM §11.5) and `lorentz-transformation` (Hendrik Lorentz, with T, RT §02.3) are TWO DIFFERENT PEOPLE. Triple-check spellings in MDX, glossary, and physicist references. Wave 1 is the place this gets baked in cleanly.
- **§01.5 honest-moment voice** — don't soften. Newtonian time dies on the page. The Callout at the end should produce the gut-punch reaction. If a Wave 2 agent over-academicizes the prose, request a tone revision before commit.
- **§02.3 Lorentz boost matrix LaTeX** — the densest LaTeX of the session. Test `\begin{pmatrix}` first; have `\begin{aligned}` row-stacked form ready as fallback.
- **§02.5 Doppler factor LaTeX** — `\sqrt{(1+\beta)/(1-\beta)}` is dense; verify on first publish.
- **Forward-refs to §03–§04** — likely placeholders this session: `spacetime`, `world-line`, `proper-time`, `light-cone`, `invariant-interval`, `mass-energy-equivalence`, `four-momentum`. Include in seed-rt-01 OR add post-seed and re-run.
- **EM↔RT cross-refs** — RT §02.3 → EM §11.2 e-and-b-under-lorentz; RT §02.1 → EM §11.4 magnetism-as-relativistic-electrostatics. DO NOT duplicate the EM treatments — link via plain Markdown `[…](/electromagnetism/…)`. `<Term>` is glossary-only.
- **`paragraphsToBlocks` helper** — copy seed-em-07 verbatim. Don't paraphrase. EM Session 7 documented the renderer-incompatible-shape lesson.
- **Stale dev server cache on port 3000** — start curl-smoke server on port 3001 per EM Session 7 lesson.
- **Combined-vs-split Michelson/Morley** — default combined under `albert-michelson` with Morley credited mid-bio. If Wave 2 §01.3 author flags during execution that prose calls for two separate humans, flag for follow-up — do not split this session.
- **Index/eyebrow ambiguity** — see BLOCKER QUESTION at top. Resolve before Wave 0 commits.

## Spec self-review — done

**Coverage:** every §01 + §02 topic in spec maps to a Wave 2 task (Tasks 4–13). Branch metadata (status, eyebrow, subtitle, description) handled in Wave 0 Task 1. Types module handled in Wave 0 Task 1 Step 6. Seed scaffold handled in Wave 1 Task 2. Money shots (§01.3 michelson-morley, §02.1 time-dilation) explicitly flagged in Tasks 6 + 9. Honest moment (§01.5 relative-simultaneity) flagged in Task 8. Voice reminder threaded through Wave 2 shared instructions. Cross-refs to EM §11 (the-lorentz-transformation → e-and-b-under-lorentz; time-dilation → magnetism-as-relativistic-electrostatics) explicit in Tasks 11 + 9. Slug-collision watch (Lorenz/Lorentz) called out in Wave 1 Step 4. New physicist (Michelson combined) handled in Wave 1 Step 2. ~10 new glossary terms handled in Wave 1 Step 4. Spec-progress update + MemPalace log handled in Wave 3.

**Type consistency:** `gamma` exported from `lib/physics/relativity/types.ts` — used by Tasks 8, 9, 10, 11, 13. `boostX` exported from same — used by Task 11 (Lorentz transform). `Worldline` type — used by Wave 1.5 SpacetimeDiagramCanvas + by Task 8 (relative-simultaneity scene) + Task 9 (time-dilation spacetime-clock-scene) + Task 11 (invariant-interval scene). All consistent.

**Placeholder scan:** none. Every step has either complete code, a complete prose outline with section word counts, or a concrete shell command with expected output.

**Plan complete.**
