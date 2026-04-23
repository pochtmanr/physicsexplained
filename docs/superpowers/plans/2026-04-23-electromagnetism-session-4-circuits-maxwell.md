# EM Session 4 — §06 Circuits + §07 Maxwell's Equations Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship 12 topics — §06 Circuits (7 topics, FIG.26–32) and §07 Maxwell's equations (5 topics, FIG.33–37). After Session 4, the EM branch progress jumps from 25/66 (38%) to 37/66 (56%) — **past the halfway mark of the branch.** §06 is the practical module (engineers use this daily); §07 is the unification (the most important four lines in physics).

**Architecture:** Seven waves — Session 3's 5-wave precedent plus TWO new serial pre-Wave-2 stages, because §06 requires a reusable visualization primitive and §07 requires the parse-mdx parser to be solid before displacement-current MDX lands:

1. **Wave 1** (serial, 1 subagent) — data layer: `branches.ts` + `physicists.ts` + `glossary.ts`. One commit.
2. **Wave 1.5** (serial, 1 subagent) — **build `CircuitCanvas` primitive.** `components/physics/circuit-canvas/` with declarative scene-graph component, canonical types, MNA solver (DC + RC/RL transients + complex-impedance AC), vitest suite. One commit.
3. **Wave 1.75** (serial, 1 subagent) — **triage the 3 pre-existing test failures** (`turbulence.test.ts`, `parse-mdx.test.ts`, `references.test.ts`) before §07 Maxwell's displacement-current MDX lands. One commit (or explicit defer with reasoning).
4. **Wave 2** (12 parallel subagents) — per-topic authoring (physics lib + vitest + scenes + page.tsx + content.en.mdx). §06 agents import from CircuitCanvas; §07 agents use standard Canvas 2D. No registry touch, no publish, no commit. Return structured handoff.
5. **Wave 2.5** (serial orchestrator) — 12 registry merges + publishes + per-topic commits. Order: §06 (FIG.26→32), then §07 (FIG.33→37). 12 commits.
6. **Wave 3** (serial, 1 subagent) — `scripts/content/seed-em-04.ts` (5 physicist bios + ~30 glossary terms), forward-ref scan, curl sweep, spec update to 37/66 (56%), MemPalace log. 2 commits (seed + spec; 3 if a forward-ref follow-up is needed).

**Expected commit total:** 17 (1 Wave 1 + 1 Wave 1.5 + 1 Wave 1.75 + 12 Wave 2.5 + 2 Wave 3). 18–19 if forward-refs force a follow-up commit or a CircuitCanvas extension is needed mid-Wave-2.

**Tech Stack:** Next.js 15 (App Router), React 19, TypeScript strict, Tailwind v4, MDX (`@next/mdx`), Canvas 2D, Supabase `content_entries`, Vitest, KaTeX via rehype-katex.

**Spec:** `docs/superpowers/specs/2026-04-22-electromagnetism-branch-design.md` — read the §06 + §07 sections (lines 158–189), the "Voice, audience, and calculus policy" block (lines 36–52), "Integration checklist (per topic)" (lines 422–455), and Open Questions #4 (CircuitCanvas) and #5 (RayTraceCanvas — §09, future).

**Prerequisite reading for subagents:**
1. `docs/superpowers/plans/2026-04-22-electromagnetism-session-3-magnetism-in-matter-induction.md` — the direct precedent for the wave structure (minus the two new pre-wave-2 stages).
2. MemPalace: `mempalace_search "EM Session 3" --wing physics` — confirms 9 parallel agents in Wave 2 worked without conflict, zero forward-refs needed, soft-hysteresis Pr ≈ 0.38·Psat precedent, **and flags the parse-mdx pendulum-golden failure as overdue before §07**.
3. MemPalace: `mempalace_search "EM Session 2" --wing physics` — for the Vec3 race-condition mitigation and the fresnel-equations forward-ref placeholder precedent.
4. An existing Session 3 topic under `app/[locale]/(topics)/electromagnetism/` — `eddy-currents/` and `faradays-law/` are the closest precedents for §06/§07 voice density and scene count.
5. `scripts/content/seed-em-03.ts` — template for the Wave 3 seed script.

---

## File structure

### New files

**Primitive (Wave 1.5, shared across all §06 topics):**
- `components/physics/circuit-canvas/CircuitCanvas.tsx` — declarative scene-graph component (nodes, wires, components, right-hand-rule overlay hook).
- `components/physics/circuit-canvas/types.ts` — canonical interfaces for every node/wire/component. §06 agents import from here. NO local fallbacks.
- `components/physics/circuit-canvas/solver.ts` — pure-TS modified nodal analysis (MNA), RC/RL Euler transients, AC phasor analysis via complex impedance.
- `components/physics/circuit-canvas/solver.test.ts` — vitest. Kirchhoff ladder, Thevenin equivalent, RC/RL transients, RLC resonance.
- `components/physics/circuit-canvas/index.ts` — barrel re-export.

**Physics libs (one per topic, nested `lib/physics/electromagnetism/<topic>.ts`):**

§06 (imports from `@/components/physics/circuit-canvas/solver` where the math is circuit-specific):
- `lib/physics/electromagnetism/dc-circuits.ts`
- `lib/physics/electromagnetism/rc-circuits.ts`
- `lib/physics/electromagnetism/rl-circuits.ts`
- `lib/physics/electromagnetism/rlc-resonance.ts`
- `lib/physics/electromagnetism/ac-phasors.ts`
- `lib/physics/electromagnetism/transformers.ts`
- `lib/physics/electromagnetism/transmission-lines.ts`

§07:
- `lib/physics/electromagnetism/displacement-current.ts`
- `lib/physics/electromagnetism/four-equations.ts`
- `lib/physics/electromagnetism/gauge.ts`
- `lib/physics/electromagnetism/poynting.ts`
- `lib/physics/electromagnetism/maxwell-stress.ts`

**Physics tests (one per physics lib):** 12 files under `tests/physics/electromagnetism/<topic>.test.ts`.

**Simulation components (36 total — 3 per topic floor; agents may ship a 4th where the money shot earns it, counted as a bonus):**

§06.1 `dc-circuits-and-kirchhoff` (FIG.26): `resistor-ladder-scene.tsx`, `node-loop-law-scene.tsx`, `voltage-divider-scene.tsx`
§06.2 `rc-circuits` (FIG.27): `rc-charging-scene.tsx`, `rc-discharging-scene.tsx`, `rc-time-constant-scene.tsx`
§06.3 `rl-circuits` (FIG.28): `rl-ramp-scene.tsx`, `rl-decay-scene.tsx`, `rl-flyback-scene.tsx`
§06.4 `rlc-circuits-and-resonance` (FIG.29): `rlc-resonance-scene.tsx`, `q-factor-scene.tsx`, `rlc-bandpass-scene.tsx`
§06.5 `ac-circuits-and-phasors` (FIG.30, **money shot**): `phasor-diagram-scene.tsx` *(money shot — phasors + scope synchronized)*, `impedance-triangle-scene.tsx`, `power-factor-scene.tsx`
§06.6 `transformers` (FIG.31): `transformer-coupling-scene.tsx`, `turns-ratio-scene.tsx`, `power-transmission-scene.tsx`
§06.7 `transmission-lines` (FIG.32): `tl-distributed-scene.tsx`, `reflection-coefficient-scene.tsx`, `standing-wave-ratio-scene.tsx`

§07.1 `displacement-current` (FIG.33, **money shot**): `ampere-surface-morph-scene.tsx` *(money shot — two surfaces through a charging capacitor)*, `displacement-field-buildup-scene.tsx`, `capacitor-current-continuity-scene.tsx`
§07.2 `the-four-equations` (FIG.34): `maxwell-table-scene.tsx`, `integral-vs-differential-scene.tsx`, `source-sink-field-scene.tsx`
§07.3 `gauge-freedom-and-potentials` (FIG.35): `gauge-transform-scene.tsx`, `lorenz-vs-coulomb-gauge-scene.tsx`, `potential-freedom-scene.tsx`
§07.4 `the-poynting-vector` (FIG.36): `poynting-flow-scene.tsx`, `coax-energy-flow-scene.tsx`, `antenna-radiation-pattern-scene.tsx`
§07.5 `maxwell-stress-tensor` (FIG.37): `stress-tensor-faces-scene.tsx`, `field-pressure-scene.tsx`, `field-momentum-scene.tsx`

**Content pages (one folder per topic):** 12 folders under `app/[locale]/(topics)/electromagnetism/<slug>/` each with `page.tsx` + `content.en.mdx`.

**Seed script (Wave 3):** `scripts/content/seed-em-04.ts`.

### Modified files

- `lib/content/branches.ts` — append 12 new topic entries to `ELECTROMAGNETISM_TOPICS` (FIG.26–FIG.37). Modules `circuits` (index 6) and `maxwell` (index 7) already present.
- `lib/content/physicists.ts` — add 5 new: `gustav-kirchhoff`, `georg-ohm`, `oliver-heaviside`, `james-clerk-maxwell`, `john-henry-poynting`. Append §06/§07 `relatedTopics` to existing `nikola-tesla` (transformers, ac-circuits) and `james-prescott-joule` (rc-circuits, rlc).
- `lib/content/glossary.ts` — add ~30 new terms (see Wave 1 Step 4 for exact list).
- `lib/content/simulation-registry.ts` — register all 36 new sim components (orchestrator merges in Wave 2.5).
- `docs/superpowers/specs/2026-04-22-electromagnetism-branch-design.md` — check 12 boxes, §06 row to 7/7, §07 row to 5/5, total to 37/66 (56%), update status line (Wave 3).
- `tests/physics/turbulence.test.ts` — fix or tolerance-adjust (Wave 1.75).
- `tests/content/blocks/parse-mdx.test.ts` or its golden — fix pendulum golden (Wave 1.75).
- `tests/content/references.test.ts` or vitest setup — lazy Supabase init OR dotenv setup file (Wave 1.75).

### NOT modified
- `lib/physics/constants.ts` — no new constants. §06 uses only `MU_0` / `EPSILON_0` / `SPEED_OF_LIGHT` already in place. §07 derivations use these plus dimensionless reduced units.
- `components/physics/visualization-registry.tsx` — same policy as §01–§05: glossary-tile preview only, no Session 4 term uses it.

---

## Wave 1 — Data layer (serial, single subagent)

### Task 1: Scaffold §06 + §07 in `branches.ts`, add physicists, add glossary terms

**Files:**
- Modify: `/Users/romanpochtman/Developer/physics/lib/content/branches.ts`
- Modify: `/Users/romanpochtman/Developer/physics/lib/content/physicists.ts`
- Modify: `/Users/romanpochtman/Developer/physics/lib/content/glossary.ts`

- [ ] **Step 1: Append 12 new topic entries to `ELECTROMAGNETISM_TOPICS`**

Open `lib/content/branches.ts`. The array currently has 25 entries ending at the `eddy-currents` entry. Append these 12 immediately after, preserving trailing-comma style:

```typescript
  {
    slug: "dc-circuits-and-kirchhoff",
    title: "DC CIRCUITS AND KIRCHHOFF'S LAWS",
    eyebrow: "FIG.26 · CIRCUITS",
    subtitle: "The two sentences that solve almost every schematic.",
    readingMinutes: 12,
    status: "live",
    module: "circuits",
  },
  {
    slug: "rc-circuits",
    title: "RC CIRCUITS AND THE CHARGING CURVE",
    eyebrow: "FIG.27 · CIRCUITS",
    subtitle: "Why the capacitor never quite gets there, and always almost does.",
    readingMinutes: 11,
    status: "live",
    module: "circuits",
  },
  {
    slug: "rl-circuits",
    title: "RL CIRCUITS",
    eyebrow: "FIG.28 · CIRCUITS",
    subtitle: "The coil's version of hesitation.",
    readingMinutes: 10,
    status: "live",
    module: "circuits",
  },
  {
    slug: "rlc-circuits-and-resonance",
    title: "RLC CIRCUITS AND RESONANCE",
    eyebrow: "FIG.29 · CIRCUITS",
    subtitle: "Two stores of energy, one frequency that loves them both.",
    readingMinutes: 12,
    status: "live",
    module: "circuits",
  },
  {
    slug: "ac-circuits-and-phasors",
    title: "AC CIRCUITS, PHASORS, AND IMPEDANCE",
    eyebrow: "FIG.30 · CIRCUITS",
    subtitle: "Rotation as the secret of every wall socket.",
    readingMinutes: 13,
    status: "live",
    module: "circuits",
  },
  {
    slug: "transformers",
    title: "TRANSFORMERS AND POWER TRANSMISSION",
    eyebrow: "FIG.31 · CIRCUITS",
    subtitle: "How one coil teaches another what voltage to be.",
    readingMinutes: 11,
    status: "live",
    module: "circuits",
  },
  {
    slug: "transmission-lines",
    title: "TRANSMISSION LINES AND IMPEDANCE MATCHING",
    eyebrow: "FIG.32 · CIRCUITS",
    subtitle: "When the wire becomes long enough to matter.",
    readingMinutes: 13,
    status: "live",
    module: "circuits",
  },
  {
    slug: "displacement-current",
    title: "DISPLACEMENT CURRENT",
    eyebrow: "FIG.33 · MAXWELL'S EQUATIONS",
    subtitle: "The missing term Maxwell put in, and the universe it unlocked.",
    readingMinutes: 12,
    status: "live",
    module: "maxwell",
  },
  {
    slug: "the-four-equations",
    title: "THE FOUR EQUATIONS, TOGETHER",
    eyebrow: "FIG.34 · MAXWELL'S EQUATIONS",
    subtitle: "The most important four lines in physics.",
    readingMinutes: 13,
    status: "live",
    module: "maxwell",
  },
  {
    slug: "gauge-freedom-and-potentials",
    title: "GAUGE FREEDOM AND THE POTENTIALS",
    eyebrow: "FIG.35 · MAXWELL'S EQUATIONS",
    subtitle: "The parts of the potential the field can't see.",
    readingMinutes: 13,
    status: "live",
    module: "maxwell",
  },
  {
    slug: "the-poynting-vector",
    title: "THE POYNTING VECTOR",
    eyebrow: "FIG.36 · MAXWELL'S EQUATIONS",
    subtitle: "Where the energy in a field is flowing, right now.",
    readingMinutes: 11,
    status: "live",
    module: "maxwell",
  },
  {
    slug: "maxwell-stress-tensor",
    title: "MOMENTUM AND THE MAXWELL STRESS TENSOR",
    eyebrow: "FIG.37 · MAXWELL'S EQUATIONS",
    subtitle: "Fields carry momentum — and push on what they touch.",
    readingMinutes: 13,
    status: "live",
    module: "maxwell",
  },
```

- [ ] **Step 2: Add 5 new physicists to `PHYSICISTS`**

First confirm none exist:

```bash
grep -nE 'slug: "(gustav-kirchhoff|georg-ohm|oliver-heaviside|james-clerk-maxwell|john-henry-poynting)"' lib/content/physicists.ts
```

Expected: no matches. Also confirm `nikola-tesla` (line 136) and `james-prescott-joule` (line 257) exist — we append to their `relatedTopics`, not create new.

Append at the end of the array, just before the closing `];`:

```typescript
  {
    slug: "gustav-kirchhoff",
    born: "1824",
    died: "1887",
    nationality: "German",
    image: storageUrl("physicists/gustav-kirchhoff.avif"),
    relatedTopics: [
      { branchSlug: "electromagnetism", topicSlug: "dc-circuits-and-kirchhoff" },
      { branchSlug: "electromagnetism", topicSlug: "rc-circuits" },
      { branchSlug: "electromagnetism", topicSlug: "rlc-circuits-and-resonance" },
    ],
  },
  {
    slug: "georg-ohm",
    born: "1789",
    died: "1854",
    nationality: "German",
    image: storageUrl("physicists/georg-ohm.avif"),
    relatedTopics: [
      { branchSlug: "electromagnetism", topicSlug: "dc-circuits-and-kirchhoff" },
      { branchSlug: "electromagnetism", topicSlug: "rc-circuits" },
    ],
  },
  {
    slug: "oliver-heaviside",
    born: "1850",
    died: "1925",
    nationality: "British",
    image: storageUrl("physicists/oliver-heaviside.avif"),
    relatedTopics: [
      { branchSlug: "electromagnetism", topicSlug: "transmission-lines" },
      { branchSlug: "electromagnetism", topicSlug: "the-four-equations" },
    ],
  },
  {
    slug: "james-clerk-maxwell",
    born: "1831",
    died: "1879",
    nationality: "Scottish",
    image: storageUrl("physicists/james-clerk-maxwell.avif"),
    relatedTopics: [
      { branchSlug: "electromagnetism", topicSlug: "displacement-current" },
      { branchSlug: "electromagnetism", topicSlug: "the-four-equations" },
      { branchSlug: "electromagnetism", topicSlug: "gauge-freedom-and-potentials" },
      { branchSlug: "electromagnetism", topicSlug: "maxwell-stress-tensor" },
    ],
  },
  {
    slug: "john-henry-poynting",
    born: "1852",
    died: "1914",
    nationality: "British",
    image: storageUrl("physicists/john-henry-poynting.avif"),
    relatedTopics: [
      { branchSlug: "electromagnetism", topicSlug: "the-poynting-vector" },
    ],
  },
```

Then append `relatedTopics` to the existing `nikola-tesla` entry (around line 136). Locate the entry, append to its `relatedTopics` array:

```typescript
{ branchSlug: "electromagnetism", topicSlug: "transformers" },
{ branchSlug: "electromagnetism", topicSlug: "ac-circuits-and-phasors" },
```

And to `james-prescott-joule` (around line 257):

```typescript
{ branchSlug: "electromagnetism", topicSlug: "rc-circuits" },
{ branchSlug: "electromagnetism", topicSlug: "rlc-circuits-and-resonance" },
```

- [ ] **Step 3: Verify image files exist in Supabase storage**

The image paths reference `physicists/<slug>.avif`. For Session 4, assume these don't exist yet and will be uploaded separately (not this session's work). The `storageUrl` helper returns a URL that resolves to a 404 if the object is missing — the physicist page renders a placeholder. Session 2 used this pattern; no change needed here. If Roman later uploads images, they will resolve automatically.

- [ ] **Step 4: Add ~30 new glossary terms to `GLOSSARY`**

Open `lib/content/glossary.ts`. The array is ~1888 lines. Confirm which terms already exist:

```bash
grep -nE 'slug: "(ohms-law-term|resistance|resistor|kirchhoff-voltage-law|kirchhoff-current-law|voltage-divider|rc-time-constant|capacitor-charging|capacitor-discharging|rl-time-constant|resonance-em|quality-factor|damped-oscillation|phasor|impedance|reactance|ac-frequency|transformer|turns-ratio|transmission-line|characteristic-impedance|standing-wave-ratio|displacement-current|maxwell-equations-term|lorenz-gauge|scalar-potential|poynting-vector|maxwell-stress-tensor|field-momentum)"' lib/content/glossary.ts
```

Some of these will already exist from prior sessions (`displacement-field`, `electric-potential-term`, `resonance-em` possibly). The suffix `-term` is used when the topic slug collides (e.g. `ohms-law-term` vs no topic by that name — `ohms-law` is safe; but since Session 3 used `faradays-law-term` defensively, do the same where ambiguity could arise). **If a term already exists with the same slug, SKIP — do not duplicate.** If a term with similar meaning exists under a different slug (e.g. `displacement-field` already present), evaluate: does §07 warrant a separate `displacement-current` entry? **Yes — the current and the field are related but physically distinct ideas (one has dimensions of A/m², one of V/m). Add both.**

Append after the last existing term, matching the existing trailing-comma style. Category values: `"concept"`, `"phenomenon"`, `"instrument"`, or `"unit"`.

```typescript
  {
    slug: "ohms-law-term",
    category: "concept",
    relatedTopics: [
      { branchSlug: "electromagnetism", topicSlug: "dc-circuits-and-kirchhoff" },
      { branchSlug: "electromagnetism", topicSlug: "rc-circuits" },
    ],
  },
  {
    slug: "resistance",
    category: "concept",
    relatedTopics: [
      { branchSlug: "electromagnetism", topicSlug: "dc-circuits-and-kirchhoff" },
    ],
  },
  {
    slug: "resistor",
    category: "instrument",
    relatedTopics: [
      { branchSlug: "electromagnetism", topicSlug: "dc-circuits-and-kirchhoff" },
    ],
  },
  {
    slug: "kirchhoff-voltage-law",
    category: "concept",
    relatedTopics: [
      { branchSlug: "electromagnetism", topicSlug: "dc-circuits-and-kirchhoff" },
    ],
  },
  {
    slug: "kirchhoff-current-law",
    category: "concept",
    relatedTopics: [
      { branchSlug: "electromagnetism", topicSlug: "dc-circuits-and-kirchhoff" },
    ],
  },
  {
    slug: "voltage-divider",
    category: "concept",
    relatedTopics: [
      { branchSlug: "electromagnetism", topicSlug: "dc-circuits-and-kirchhoff" },
    ],
  },
  {
    slug: "rc-time-constant",
    category: "concept",
    relatedTopics: [
      { branchSlug: "electromagnetism", topicSlug: "rc-circuits" },
    ],
  },
  {
    slug: "capacitor-charging",
    category: "phenomenon",
    relatedTopics: [
      { branchSlug: "electromagnetism", topicSlug: "rc-circuits" },
    ],
  },
  {
    slug: "rl-time-constant",
    category: "concept",
    relatedTopics: [
      { branchSlug: "electromagnetism", topicSlug: "rl-circuits" },
    ],
  },
  {
    slug: "quality-factor",
    category: "concept",
    relatedTopics: [
      { branchSlug: "electromagnetism", topicSlug: "rlc-circuits-and-resonance" },
    ],
  },
  {
    slug: "phasor",
    category: "concept",
    relatedTopics: [
      { branchSlug: "electromagnetism", topicSlug: "ac-circuits-and-phasors" },
    ],
  },
  {
    slug: "impedance",
    category: "concept",
    relatedTopics: [
      { branchSlug: "electromagnetism", topicSlug: "ac-circuits-and-phasors" },
      { branchSlug: "electromagnetism", topicSlug: "transmission-lines" },
    ],
  },
  {
    slug: "reactance",
    category: "concept",
    relatedTopics: [
      { branchSlug: "electromagnetism", topicSlug: "ac-circuits-and-phasors" },
    ],
  },
  {
    slug: "ac-frequency",
    category: "concept",
    relatedTopics: [
      { branchSlug: "electromagnetism", topicSlug: "ac-circuits-and-phasors" },
    ],
  },
  {
    slug: "transformer",
    category: "instrument",
    relatedTopics: [
      { branchSlug: "electromagnetism", topicSlug: "transformers" },
    ],
  },
  {
    slug: "turns-ratio",
    category: "concept",
    relatedTopics: [
      { branchSlug: "electromagnetism", topicSlug: "transformers" },
    ],
  },
  {
    slug: "transmission-line-term",
    category: "concept",
    relatedTopics: [
      { branchSlug: "electromagnetism", topicSlug: "transmission-lines" },
    ],
  },
  {
    slug: "characteristic-impedance",
    category: "concept",
    relatedTopics: [
      { branchSlug: "electromagnetism", topicSlug: "transmission-lines" },
    ],
  },
  {
    slug: "standing-wave-ratio",
    category: "concept",
    relatedTopics: [
      { branchSlug: "electromagnetism", topicSlug: "transmission-lines" },
    ],
  },
  {
    slug: "displacement-current",
    category: "concept",
    relatedTopics: [
      { branchSlug: "electromagnetism", topicSlug: "displacement-current" },
      { branchSlug: "electromagnetism", topicSlug: "the-four-equations" },
    ],
  },
  {
    slug: "maxwell-equations-term",
    category: "concept",
    relatedTopics: [
      { branchSlug: "electromagnetism", topicSlug: "the-four-equations" },
    ],
  },
  {
    slug: "lorenz-gauge",
    category: "concept",
    relatedTopics: [
      { branchSlug: "electromagnetism", topicSlug: "gauge-freedom-and-potentials" },
    ],
  },
  {
    slug: "coulomb-gauge",
    category: "concept",
    relatedTopics: [
      { branchSlug: "electromagnetism", topicSlug: "gauge-freedom-and-potentials" },
    ],
  },
  {
    slug: "gauge-transformation",
    category: "concept",
    relatedTopics: [
      { branchSlug: "electromagnetism", topicSlug: "gauge-freedom-and-potentials" },
    ],
  },
  {
    slug: "poynting-vector",
    category: "concept",
    relatedTopics: [
      { branchSlug: "electromagnetism", topicSlug: "the-poynting-vector" },
    ],
  },
  {
    slug: "poynting-theorem",
    category: "concept",
    relatedTopics: [
      { branchSlug: "electromagnetism", topicSlug: "the-poynting-vector" },
    ],
  },
  {
    slug: "maxwell-stress-tensor",
    category: "concept",
    relatedTopics: [
      { branchSlug: "electromagnetism", topicSlug: "maxwell-stress-tensor" },
    ],
  },
  {
    slug: "field-momentum",
    category: "concept",
    relatedTopics: [
      { branchSlug: "electromagnetism", topicSlug: "maxwell-stress-tensor" },
    ],
  },
  {
    slug: "radiation-pressure-term",
    category: "phenomenon",
    relatedTopics: [
      { branchSlug: "electromagnetism", topicSlug: "maxwell-stress-tensor" },
    ],
  },
  {
    slug: "back-reaction",
    category: "concept",
    relatedTopics: [
      { branchSlug: "electromagnetism", topicSlug: "maxwell-stress-tensor" },
    ],
  },
```

> **Slug collisions and omissions:**
> - `ohms-law-term` uses `-term` suffix preemptively (there is no topic slug `ohms-law`, but the topic is `dc-circuits-and-kirchhoff` — safe to match precedent).
> - `transmission-line-term` uses `-term` because topic slug is `transmission-lines` (plural).
> - `rc-time-constant`, `rl-time-constant` deliberately differ (more useful than generic `time-constant`).
> - `damped-oscillation` — check CM for an existing generic entry (`tests/physics/damped-pendulum` etc.). If CM has `damped-oscillation`, SKIP. If not, the §06.4 RLC MDX can link to `/dictionary/damping-ratio` (from CM) or use plain text.
> - `electromagnetic-wave` referenced by §07.4 Poynting is a §08 topic — add as forward-ref placeholder in Wave 3 if any Wave 2 MDX uses `<Term slug="electromagnetic-wave">`.
> - `scalar-potential` is already covered by `electric-potential-term` from §01; do NOT add.
> - `inductor-current-buildup` — already added in Session 3 (`self-inductance` / `back-emf`); skip.
> - `capacitor-discharging` — redundant with `capacitor-charging`; add only `capacitor-charging` and let MDX text handle "discharging" as the inverse. Saves one seed entry.

Total new glossary terms: **30** (20 §06 + 10 §07). **Do NOT duplicate anything already present.**

- [ ] **Step 5: Verify with tsc and tests**

```bash
pnpm tsc --noEmit
pnpm vitest run tests/content/
```

Expected: clean tsc. The 3 pre-existing test failures (turbulence numeric, parse-mdx pendulum golden, references env-var) are NOT new — the Wave 1.75 subagent will fix them. They are not Wave 1's responsibility.

- [ ] **Step 6: Commit**

```bash
git add lib/content/branches.ts lib/content/physicists.ts lib/content/glossary.ts
git commit -m "$(cat <<'EOF'
feat(em/§06-§07): scaffold circuits + maxwell, physicists, glossary

Adds 12 new topic entries to ELECTROMAGNETISM_TOPICS (FIG.26–FIG.37).
Adds Kirchhoff, Ohm, Heaviside, Maxwell, Poynting to PHYSICISTS
(structural only — prose seeded via scripts/content/seed-em-04.ts in Wave 3).
Appends §06 relatedTopics to Tesla (transformers, ac-circuits) and Joule
(rc, rlc). Adds 30 §06/§07 glossary terms (structural only).

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Wave 1.5 — `CircuitCanvas` primitive (serial, single subagent)

### Task 2: Build `components/physics/circuit-canvas/`

**Files:**
- Create: `/Users/romanpochtman/Developer/physics/components/physics/circuit-canvas/types.ts`
- Create: `/Users/romanpochtman/Developer/physics/components/physics/circuit-canvas/solver.ts`
- Create: `/Users/romanpochtman/Developer/physics/components/physics/circuit-canvas/solver.test.ts`
- Create: `/Users/romanpochtman/Developer/physics/components/physics/circuit-canvas/CircuitCanvas.tsx`
- Create: `/Users/romanpochtman/Developer/physics/components/physics/circuit-canvas/index.ts`

**Goal:** Ship a single reusable primitive that handles DC, RC transient, RL transient, RLC resonance, and AC phasor analysis — enough to serve §06.1–§06.5. §06.6 (transformers) and §06.7 (transmission-lines) get their last-mile behaviour added by the Wave 2 topic agents via extension hooks (NOT by this wave — this wave stops at the primitive). Resist overbuilding.

- [ ] **Step 1: Write `types.ts`**

This file is the canonical home for every circuit type. **§06 agents MUST import from here** — no local fallbacks. Ship:

```typescript
/** A node in the circuit graph (electrical junction). Ground is node 0 by convention. */
export interface CircuitNode {
  id: string;
  x: number; // canvas coordinate
  y: number;
  label?: string; // e.g. "V_in", "A", "B"
}

/** A 2-terminal linear passive component. */
export type PassiveKind = "resistor" | "capacitor" | "inductor";

export interface Passive {
  kind: PassiveKind;
  id: string;
  /** Ohms for resistor, Farads for capacitor, Henries for inductor. */
  value: number;
  fromNode: string;
  toNode: string;
}

/** DC voltage/current source or AC source. */
export type SourceKind = "dc-voltage" | "dc-current" | "ac-voltage" | "ac-current";

export interface Source {
  kind: SourceKind;
  id: string;
  /** For DC: the constant value. For AC: the amplitude. */
  value: number;
  /** AC only — angular frequency in rad/s. */
  omega?: number;
  /** AC only — phase offset in radians. */
  phase?: number;
  fromNode: string; // + terminal
  toNode: string;   // − terminal
}

/** Ground reference (always node id "0" by solver convention). */
export interface Ground {
  kind: "ground";
  id: string;
  atNode: string;
}

/** Ideal switch (binary). */
export interface Switch {
  kind: "switch";
  id: string;
  closed: boolean;
  fromNode: string;
  toNode: string;
}

/** Ideal voltmeter / ammeter — affects nothing, reads value. */
export interface Meter {
  kind: "voltmeter" | "ammeter";
  id: string;
  /** For voltmeter: across (fromNode, toNode). For ammeter: through the branch between them. */
  fromNode: string;
  toNode: string;
}

/** Two-winding ideal transformer (extension hook for §06.6). */
export interface IdealTransformer {
  kind: "transformer";
  id: string;
  /** Turns ratio N_s/N_p. */
  turnsRatio: number;
  /** Coupling coefficient 0..1 (1 = ideal). */
  couplingCoefficient: number;
  primaryFrom: string;
  primaryTo: string;
  secondaryFrom: string;
  secondaryTo: string;
}

/** Distributed-parameter transmission line (extension hook for §06.7). Solver handles
 *  only the lumped limit here; full LC-ladder integration lives in the topic agent's lib. */
export interface TransmissionLine {
  kind: "transmission-line";
  id: string;
  /** Per-unit-length inductance (H/m) and capacitance (F/m). */
  lPerMeter: number;
  cPerMeter: number;
  /** Total length in metres. */
  length: number;
  fromNode: string;
  toNode: string;
}

export type CircuitElement =
  | Passive
  | Source
  | Ground
  | Switch
  | Meter
  | IdealTransformer
  | TransmissionLine;

/** A wire/edge for visual layout only — the graph topology is encoded by nodes referenced in elements. */
export interface Wire {
  id: string;
  fromNode: string;
  toNode: string;
  /** Optional polyline overrides for routing; defaults to straight line. */
  via?: Array<{ x: number; y: number }>;
}

export interface CircuitScene {
  nodes: CircuitNode[];
  wires: Wire[];
  elements: CircuitElement[];
}

/** Solver result for a single solved time step (or phasor). */
export interface SolutionSnapshot {
  /** Node voltages keyed by node id (ground node always 0). */
  nodeVoltages: Record<string, number>;
  /** Branch currents keyed by element id (sign convention: from → to). */
  branchCurrents: Record<string, number>;
  /** For AC analysis: phase angle at each node, in radians. */
  nodePhases?: Record<string, number>;
}

/** Analysis mode. */
export type AnalysisMode = "dc" | "transient" | "ac-phasor";

/** Right-hand-rule badge overlay config (every §06 scene may enable this). */
export interface RightHandRuleBadge {
  position?: "top-left" | "top-right" | "bottom-left" | "bottom-right";
  showCurrent?: boolean;
  showVoltage?: boolean;
}
```

- [ ] **Step 2: Write `solver.ts`**

Pure TypeScript, no React. Exports 3 analysis functions:

```typescript
import type {
  CircuitScene,
  SolutionSnapshot,
  Passive,
  Source,
} from "./types";

/** Modified Nodal Analysis for DC steady state. Resistors conduct; capacitors open; inductors short. */
export function solveDC(scene: CircuitScene): SolutionSnapshot {
  // 1. Collect node ids, treat any node with a Ground element as node 0.
  //    All other nodes get consecutive indices 1..N-1.
  // 2. Build Y matrix (node-admittance). Resistor 1/R, DC capacitor 0 (open), DC inductor → treat as
  //    ideal wire between its two nodes (create implicit branch variable, MNA extra row/column).
  // 3. Voltage sources also add extra branch variables with +/-1 in their incidence rows.
  // 4. Solve Yx = b via Gaussian elimination (N ≤ 20 in practice for §06 scenes; no need for a sparse
  //    library — dense LU with partial pivoting is fine).
  // 5. Extract nodeVoltages and branchCurrents.
  //
  // Implementation note: use the @/lib/linalg helper if it exists; otherwise ship a small dense solver
  // inline (Gauss-Jordan with partial pivoting is ~40 lines). Do NOT add a dependency.
  throw new Error("TODO — implement");
}

/**
 * Solve an RC/RL transient by forward-Euler or backward-Euler integration.
 * Builds the Y matrix per step with companion models:
 *   - Capacitor: Norton companion with G = C/h, I_eq = G·v_prev
 *   - Inductor:  Norton companion with G = h/L, I_eq = -G·v_prev + i_prev
 *
 * Returns a SolutionSnapshot PER TIME STEP.
 */
export function solveTransient(
  scene: CircuitScene,
  totalTime: number,
  dt: number,
): SolutionSnapshot[] {
  throw new Error("TODO — implement");
}

/**
 * AC phasor analysis: build Y matrix in complex domain at angular frequency omega.
 *   - Resistor: Y = 1/R (real)
 *   - Capacitor: Y = jωC
 *   - Inductor: Y = 1/(jωL) = -j/(ωL)
 * Returns a single phasor solution (magnitudes + phases).
 */
export function solveACPhasor(
  scene: CircuitScene,
  omega: number,
): SolutionSnapshot {
  throw new Error("TODO — implement");
}

/**
 * Helper: Thevenin equivalent at a pair of output nodes (port).
 * Returns { vOpen, rThevenin }.
 * Used by §06.1 and §06.4 test cases and by topic agents where a subcircuit needs reduction.
 */
export function thevenin(
  scene: CircuitScene,
  portFrom: string,
  portTo: string,
): { vOpen: number; rThevenin: number } {
  throw new Error("TODO — implement");
}
```

**Implementation constraints:**
- Use `BigInt` nowhere — stay in `number` for values ≤ 1e12.
- For MNA, total unknowns = (N_nodes − 1) + N_voltage_sources + N_inductors (transient) + N_ideal_transformers × 2. Keep below 20 in practice.
- Use `Math.hypot` for complex magnitude. No `mathjs` / no `complex.js` dependency — represent complex numbers as `[re, im]` tuples OR as `{ re: number; im: number }` objects.
- Validate with `if (nodeVoltages["0"] !== 0) throw new Error(...)` — ground must be 0.

**Do NOT** over-engineer: no SPICE `.model` parser, no subcircuit nesting, no temperature-dependent models, no noise analysis. This primitive serves 7 topics; every feature beyond what those 7 need is YAGNI.

- [ ] **Step 3: Write `solver.test.ts`**

```typescript
import { describe, expect, it } from "vitest";
import { solveDC, solveTransient, solveACPhasor, thevenin } from "./solver";
import type { CircuitScene } from "./types";

describe("solveDC", () => {
  it("Ohm's law: V = IR on a single-loop resistor", () => {
    const scene: CircuitScene = {
      nodes: [
        { id: "0", x: 0, y: 0 },
        { id: "A", x: 100, y: 0 },
      ],
      wires: [],
      elements: [
        { kind: "ground", id: "g", atNode: "0" },
        { kind: "dc-voltage", id: "V1", value: 10, fromNode: "A", toNode: "0" },
        { kind: "resistor", id: "R1", value: 1000, fromNode: "A", toNode: "0" },
      ],
    };
    const sol = solveDC(scene);
    expect(sol.nodeVoltages["A"]).toBeCloseTo(10, 6);
    expect(sol.branchCurrents["R1"]).toBeCloseTo(0.01, 6); // 10 / 1000
  });

  it("Kirchhoff's voltage law on a 3-resistor ladder: series R = R1+R2+R3", () => {
    // V = 12, R1=100, R2=200, R3=300. I = 12/600 = 0.02 A. V across R2 = 4 V.
    const scene: CircuitScene = {
      nodes: [
        { id: "0", x: 0, y: 0 },
        { id: "A", x: 100, y: 0 },
        { id: "B", x: 200, y: 0 },
        { id: "C", x: 300, y: 0 },
      ],
      wires: [],
      elements: [
        { kind: "ground", id: "g", atNode: "0" },
        { kind: "dc-voltage", id: "V1", value: 12, fromNode: "A", toNode: "0" },
        { kind: "resistor", id: "R1", value: 100, fromNode: "A", toNode: "B" },
        { kind: "resistor", id: "R2", value: 200, fromNode: "B", toNode: "C" },
        { kind: "resistor", id: "R3", value: 300, fromNode: "C", toNode: "0" },
      ],
    };
    const sol = solveDC(scene);
    expect(sol.branchCurrents["R1"]).toBeCloseTo(0.02, 6);
    expect(sol.nodeVoltages["B"] - sol.nodeVoltages["C"]).toBeCloseTo(4, 6);
  });

  it("Thevenin equivalent of a voltage divider matches V_open = V·R2/(R1+R2)", () => {
    const scene: CircuitScene = {
      nodes: [
        { id: "0", x: 0, y: 0 },
        { id: "A", x: 100, y: 0 },
        { id: "B", x: 200, y: 0 },
      ],
      wires: [],
      elements: [
        { kind: "ground", id: "g", atNode: "0" },
        { kind: "dc-voltage", id: "V1", value: 10, fromNode: "A", toNode: "0" },
        { kind: "resistor", id: "R1", value: 1000, fromNode: "A", toNode: "B" },
        { kind: "resistor", id: "R2", value: 1000, fromNode: "B", toNode: "0" },
      ],
    };
    const { vOpen, rThevenin } = thevenin(scene, "B", "0");
    expect(vOpen).toBeCloseTo(5, 6);
    expect(rThevenin).toBeCloseTo(500, 6); // R1 || R2 = 500
  });
});

describe("solveTransient (RC)", () => {
  it("matches analytical v_c(t) = V(1 − e^(−t/τ)) within 1% at t = τ", () => {
    const R = 1000, C = 1e-6; // τ = 1 ms
    const scene: CircuitScene = {
      nodes: [
        { id: "0", x: 0, y: 0 },
        { id: "A", x: 100, y: 0 },
        { id: "B", x: 200, y: 0 },
      ],
      wires: [],
      elements: [
        { kind: "ground", id: "g", atNode: "0" },
        { kind: "dc-voltage", id: "V1", value: 5, fromNode: "A", toNode: "0" },
        { kind: "resistor", id: "R1", value: R, fromNode: "A", toNode: "B" },
        { kind: "capacitor", id: "C1", value: C, fromNode: "B", toNode: "0" },
      ],
    };
    const steps = solveTransient(scene, 5e-3, 1e-5); // 5τ duration, 0.01τ step
    const tau = R * C;
    const idxAtTau = Math.round(tau / 1e-5);
    const analytical = 5 * (1 - Math.exp(-1));
    expect(steps[idxAtTau].nodeVoltages["B"]).toBeCloseTo(analytical, 1);
  });
});

describe("solveTransient (RL)", () => {
  it("matches analytical i_L(t) = (V/R)(1 − e^(−t/τ)) at t = τ", () => {
    const R = 10, L = 0.1; // τ = 10 ms
    const scene: CircuitScene = {
      nodes: [
        { id: "0", x: 0, y: 0 },
        { id: "A", x: 100, y: 0 },
        { id: "B", x: 200, y: 0 },
      ],
      wires: [],
      elements: [
        { kind: "ground", id: "g", atNode: "0" },
        { kind: "dc-voltage", id: "V1", value: 12, fromNode: "A", toNode: "0" },
        { kind: "resistor", id: "R1", value: R, fromNode: "A", toNode: "B" },
        { kind: "inductor", id: "L1", value: L, fromNode: "B", toNode: "0" },
      ],
    };
    const steps = solveTransient(scene, 50e-3, 1e-4);
    const tau = L / R;
    const idxAtTau = Math.round(tau / 1e-4);
    const analytical = (12 / R) * (1 - Math.exp(-1));
    expect(steps[idxAtTau].branchCurrents["L1"]).toBeCloseTo(analytical, 1);
  });
});

describe("solveACPhasor (RLC resonance)", () => {
  it("finds resonance at ω₀ = 1/√(LC) where current is maximal and in phase with V", () => {
    const R = 10, L = 1e-3, C = 1e-6; // ω₀ = 1/√(1e-9) = ~31623 rad/s
    const scene: CircuitScene = {
      nodes: [
        { id: "0", x: 0, y: 0 },
        { id: "A", x: 100, y: 0 },
        { id: "B", x: 200, y: 0 },
        { id: "C", x: 300, y: 0 },
      ],
      wires: [],
      elements: [
        { kind: "ground", id: "g", atNode: "0" },
        { kind: "ac-voltage", id: "V1", value: 1, omega: 0, phase: 0, fromNode: "A", toNode: "0" },
        { kind: "resistor", id: "R1", value: R, fromNode: "A", toNode: "B" },
        { kind: "inductor", id: "L1", value: L, fromNode: "B", toNode: "C" },
        { kind: "capacitor", id: "C1", value: C, fromNode: "C", toNode: "0" },
      ],
    };
    const omega0 = 1 / Math.sqrt(L * C);
    const off = solveACPhasor({ ...scene, elements: scene.elements }, omega0 * 0.5);
    const res = solveACPhasor({ ...scene, elements: scene.elements }, omega0);
    expect(Math.abs(res.branchCurrents["R1"])).toBeGreaterThan(Math.abs(off.branchCurrents["R1"]));
  });
});
```

- [ ] **Step 4: Write `CircuitCanvas.tsx`**

```typescript
"use client";
import { useEffect, useRef, useState } from "react";
import type {
  CircuitScene,
  SolutionSnapshot,
  AnalysisMode,
  RightHandRuleBadge,
} from "./types";
import { solveDC, solveTransient, solveACPhasor } from "./solver";

export interface CircuitCanvasProps {
  scene: CircuitScene;
  mode: AnalysisMode;
  /** Angular frequency (rad/s) for AC mode; ignored otherwise. */
  omega?: number;
  /** Transient total time (seconds) and step. */
  totalTime?: number;
  dt?: number;
  /** Optional overlay badge. */
  rightHandRule?: RightHandRuleBadge;
  /** Palette override — falls back to the EM branch palette. */
  palette?: {
    bg?: string; // default "#0A0A0A"
    wire?: string; // default "rgba(255,255,255,0.55)"
    voltagePositive?: string; // magenta
    voltageNegative?: string; // cyan
    current?: string; // amber
    inducedCurrent?: string; // green-cyan
  };
  /** HUD: which solution keys to display as live numeric readouts. */
  hudKeys?: Array<{ label: string; kind: "voltage" | "current"; id: string }>;
  className?: string;
}

export function CircuitCanvas({
  scene,
  mode,
  omega = 0,
  totalTime = 1e-2,
  dt = 1e-5,
  rightHandRule,
  palette,
  hudKeys,
  className,
}: CircuitCanvasProps): JSX.Element {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [solution, setSolution] = useState<SolutionSnapshot | null>(null);

  useEffect(() => {
    if (mode === "dc") setSolution(solveDC(scene));
    else if (mode === "ac-phasor") setSolution(solveACPhasor(scene, omega));
    // transient mode renders per-step in the animation loop below
  }, [scene, mode, omega]);

  useEffect(() => {
    if (mode !== "transient") return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    let frame = 0;
    const steps = solveTransient(scene, totalTime, dt);
    let rafId = 0;
    const draw = () => {
      const snap = steps[Math.min(frame, steps.length - 1)];
      setSolution(snap);
      frame++;
      if (frame < steps.length) rafId = requestAnimationFrame(draw);
    };
    rafId = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(rafId);
  }, [scene, mode, totalTime, dt]);

  // Canvas 2D draw loop: grid/background → wires → components (symbol glyphs) →
  // current arrows (colored by conduction vs induced via palette.current vs
  // palette.inducedCurrent) → RH-rule badge → HUD.
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx || !solution) return;
    // ... full draw implementation (nodes, wires, resistor zigzag, capacitor plates,
    // inductor coil, AC source circle with ~, DC source circle with +/-, ground triangle,
    // switch symbol). Agent can mirror the style of lorentz-trajectory-scene.tsx for
    // font/HUD; geometry is new to this primitive.
  }, [solution, palette, rightHandRule, hudKeys]);

  return (
    <div className={className} data-circuit-canvas>
      <canvas ref={canvasRef} width={640} height={420} className="w-full rounded-md bg-[#0A0A0A]" />
    </div>
  );
}
```

**Drawing expectations (not a hard spec — keep it tasteful):**
- Resistor: zigzag (width 8, height 20 square-wave with 3 bumps).
- Capacitor: two parallel plates, gap 8, plate width 20.
- Inductor: 4 tight loops.
- Voltage source (DC): circle with `+`/`−` labels.
- Voltage source (AC): circle with a sine-wave glyph `~`.
- Current source: circle with arrow inside.
- Ground: stacked horizontal lines (3 descending widths).
- Switch: open or closed two-position glyph.
- Wires: straight segments, right-angle routing via polyline if `Wire.via` supplied.
- All glyphs in white (0.85 alpha) on dark canvas.
- Overlay HUD (top-right): monospace numeric readouts from `hudKeys`.
- Right-hand-rule badge: small axes + curl arrow in the corner specified.

- [ ] **Step 5: Write `index.ts` barrel**

```typescript
export * from "./types";
export { CircuitCanvas } from "./CircuitCanvas";
export { solveDC, solveTransient, solveACPhasor, thevenin } from "./solver";
```

- [ ] **Step 6: Run the test suite**

```bash
pnpm vitest run components/physics/circuit-canvas/solver.test.ts
```

Expected: all tests pass. If any fail, fix the solver before proceeding. Do NOT ship Wave 1.5 with a red test — §06 Wave 2 agents depend on this primitive.

- [ ] **Step 7: Typecheck**

```bash
pnpm tsc --noEmit
```

Expected: clean.

- [ ] **Step 8: Commit**

```bash
git add components/physics/circuit-canvas/
git commit -m "$(cat <<'EOF'
feat(physics): CircuitCanvas primitive — MNA solver + declarative scene graph

Shared primitive serving §06 circuits topics (FIG.26–32). Canonical types home
for Resistor/Capacitor/Inductor/Source/Ground/Switch/Meter + IdealTransformer
and TransmissionLine extension hooks.

Solver supports three modes: DC steady state via MNA, transient via companion
models (RC/RL/RLC Euler stepping), AC phasor via complex-impedance MNA.
Vitest covers Kirchhoff ladder, Thevenin voltage-divider, RC/RL analytical
exponentials, and RLC resonance at ω₀ = 1/√(LC).

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Wave 1.75 — Triage the 3 pre-existing test failures (serial, single subagent)

### Task 3: Fix turbulence, parse-mdx, references tests

**Context:** Three sessions have flagged these as pre-existing. Session 3's implementation log specifically said: *"the parse-mdx pendulum-golden mismatch is the canonical example and will need fixing before §07 Maxwell, since the displacement-current equation-block patterns will likely add new MDX shapes that stress the parser further."* This wave happens **before** Wave 2 so that §07 topic drafts don't introduce new parser failures masked by the existing one.

**Files (one or more of):**
- Modify: `/Users/romanpochtman/Developer/physics/tests/physics/turbulence.test.ts` (or `/Users/romanpochtman/Developer/physics/lib/physics/turbulence.ts`)
- Modify: `/Users/romanpochtman/Developer/physics/tests/content/blocks/parse-mdx.test.ts` (or its golden file, or `/Users/romanpochtman/Developer/physics/lib/content/blocks/parse-mdx.ts`)
- Modify: `/Users/romanpochtman/Developer/physics/tests/content/references.test.ts` (or a new vitest setup file)
- Possibly create: `/Users/romanpochtman/Developer/physics/tests/setup/env.ts`
- Possibly modify: `/Users/romanpochtman/Developer/physics/vitest.config.ts`

**Acceptance:** all 3 failures turn green OR an individual failure is explicitly deferred with a code comment + a line in the Wave 3 MemPalace log explaining why the fix turned out to be harder than expected.

- [ ] **Step 1: Run the current vitest and capture the 3 failing test names**

```bash
pnpm vitest run 2>&1 | tail -80
```

Expected: 2–3 failures whose names match these descriptions:
1. `tests/physics/turbulence.test.ts` — `kolmogorov microscale` numeric out of expected range.
2. `tests/content/blocks/parse-mdx.test.ts` — `matches golden` for the simple-pendulum topic.
3. `tests/content/references.test.ts` — `Missing NEXT_PUBLIC_SUPABASE_URL` at import time.

- [ ] **Step 2: Triage turbulence.test.ts**

Read both the test and the lib. The known diagnosis: expected `< 0.001`, actual `~0.00136`. Two possible root causes:

**(a) Units bug in the formula.** The Kolmogorov microscale is η = (ν³/ε)^(1/4). If the test provides ν in m²/s and ε in m²/s³, the result is in metres. If the test is feeding dimensionally inconsistent inputs (e.g. ν in cm²/s), that's a lib bug. Fix in the lib, tighten the test.

**(b) Tolerance too tight for the chosen inputs.** If the inputs are "atmospheric boundary layer, ν ≈ 1.5e-5, ε ≈ 1e-3" then η ≈ (1.5e-5³ / 1e-3)^(1/4) = (3.375e-15 / 1e-3)^(1/4) = (3.375e-12)^(1/4) ≈ 7.6e-4. The test's `< 0.001` boundary is correct; the lib must be correct too; but if the test feeds different inputs and the expected bound is wrong, relax it.

Decision tree:
- If the lib produces a dimensionally wrong value → fix the lib, keep the test bound tight.
- If the lib is correct but the test bound is too tight → widen the bound to `< 0.002` with a short explanatory comment documenting the atmospheric-turbulence input assumption.
- If neither is obviously broken → add a `// TODO: revisit kolmogorov inputs — 2026-04-23` comment and skip. Do NOT plow through; better a documented punt than a wrong fix.

After triaging, `pnpm vitest run tests/physics/turbulence.test.ts` should be green OR deferred with a reason.

- [ ] **Step 3: Triage parse-mdx.test.ts (pendulum golden) — this one MATTERS for §07**

Read `tests/content/blocks/parse-mdx.test.ts` and the golden file (likely at `tests/content/blocks/__golden__/the-simple-pendulum.json` or similar). The known diagnosis: golden stores `"theta0": "(40 * Math.PI) / 180"` as a string; parser now emits the evaluated number `0.6981317007977318`.

Two clean fixes — **pick one based on the parser's design intent:**

**Option A: Update the golden.** If the parser's current behavior (evaluate numeric expressions in MDX props at parse time) is the intentional design — because downstream consumers need numeric values — regenerate the golden to match. Use:

```bash
UPDATE_GOLDENS=1 pnpm vitest run tests/content/blocks/parse-mdx.test.ts
```

(Check `parse-mdx.test.ts` for the exact env-var convention it uses. If none, hand-edit the golden file to replace the string with the evaluated number.)

**Option B: Make the parser preserve expression source.** If the parser *should* preserve the original expression string so the content layer can display it unmodified in `<EquationBlock>`s, adjust the parser. This is the heavier fix and may unblock §07.1 displacement-current where equation-block TeX expressions must NOT be evaluated. **Strong preference for Option A unless reading the parser reveals a deeper design requirement.**

After the fix: `pnpm vitest run tests/content/blocks/parse-mdx.test.ts` green.

**CRITICAL SECONDARY STEP** — spot-check the parser against §07-style MDX:

```bash
mkdir -p /tmp/em-parser-test
cat > /tmp/em-parser-test/displacement-current-sample.mdx <<'EOF'
<EquationBlock id="EQ.01" tex="\\oint \\mathbf{B} \\cdot d\\boldsymbol{\\ell} = \\mu_0 \\left( I_{\\text{enc}} + \\varepsilon_0 \\frac{\\partial}{\\partial t} \\iint \\mathbf{E} \\cdot d\\mathbf{A} \\right)">
  Ampère's law with Maxwell's correction — the <Term slug="displacement-current" /> term is the second one.
</EquationBlock>
EOF
# Then adapt the existing test harness to feed this through the parser and verify it doesn't throw
# and emits a sensible AST. Do not commit this test file — it's a smoke check only.
```

If the parser fails on `∂` / `\partial` / nested `\frac` / double-integral `\iint` — fix it NOW. §07.1 MDX will use all of these. Better to catch in Wave 1.75 than in Wave 2.5 when 12 topic commits are mid-flight.

- [ ] **Step 4: Triage references.test.ts**

Read the test. The failure is `Missing NEXT_PUBLIC_SUPABASE_URL` thrown at import time because the supabase client is eagerly initialised at module load.

**Cleanest fix — `setupFiles` pointing at a new env-loader:**

```bash
mkdir -p tests/setup
cat > tests/setup/env.ts <<'EOF'
// Load .env / .env.local BEFORE any module imports run during the vitest worker boot.
// Without this, any module that eagerly constructs a Supabase client will throw
// "Missing NEXT_PUBLIC_SUPABASE_URL" at import-time.
import "dotenv/config";
EOF
```

Then modify `vitest.config.ts` to register it:

```typescript
// In the `test` block of the existing config:
setupFiles: ["./tests/setup/env.ts"],
```

Alternative: make the supabase client lazy (`getServiceClient()` pattern already used in `lib/supabase-server.ts`). Check if the referenced module can be refactored to return a lazy accessor instead of a ready-to-use singleton. If so, that's cleaner long-term; if not, the setup-file fix is fine.

After: `pnpm vitest run tests/content/references.test.ts` green.

- [ ] **Step 5: Full vitest sweep**

```bash
pnpm vitest run
```

Expected:
- All prior-session tests still green.
- The 3 previously-failing tests now green (or explicitly deferred with in-file comments).
- New CircuitCanvas solver tests still green (from Wave 1.5).

If new failures appear — investigate. Do NOT proceed to Wave 2 with red tests.

- [ ] **Step 6: Commit**

```bash
git add tests/ vitest.config.ts lib/physics/turbulence.ts lib/content/blocks/parse-mdx.ts 2>/dev/null || true
# (Only the files actually modified — git will accept only what exists.)
git commit -m "$(cat <<'EOF'
fix(tests): triage 3 pre-existing failures overdue since EM §01

turbulence.test.ts: <explain what you did — lib fix OR tolerance widen>
parse-mdx.test.ts: <golden regen OR parser preserve-source>
references.test.ts: <setup file loading dotenv via vitest setupFiles>

Unblocks §07 Maxwell's equation-block patterns (∂, ∮, \iint, nested \frac)
which would have stressed the parser golden further. Verified with a
/tmp smoke MDX containing the displacement-current equation shape.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

If one of the three could not be fixed cleanly, the commit message should explicitly say so (e.g. "turbulence deferred: kolmogorov inputs need dimensional-analysis review; see TODO comment"). Do not claim a fix that isn't real.

---

## Wave 2 — Per-topic authoring (12 parallel subagents)

Each task below is a complete vertical slice. A subagent can complete any one task independently once Waves 1, 1.5, and 1.75 have landed.

### Shared instructions for every Wave 2 task — READ FIRST

This is the parallel-safety contract from the §01–§05 implementation logs, with Session 4 additions:

1. **DO NOT touch `lib/content/simulation-registry.ts`.** The orchestrator merges all registry entries serially in Wave 2.5.
2. **DO NOT touch `components/physics/visualization-registry.tsx`.** Glossary-tile preview only; no Session 4 term uses it.
3. **DO NOT run `pnpm content:publish`.** Orchestrator publishes serially in Wave 2.5.
4. **DO NOT commit.** Orchestrator commits per-topic in Wave 2.5.
5. **Types contract for §06 agents (NEW — the CircuitCanvas rule):**
   - **Import all circuit types from `@/components/physics/circuit-canvas/types`.** That file is the canonical home. NO local fallbacks. NO private copies. If an agent believes it needs a new type extension (e.g. a coupling-coefficient param the primitive doesn't expose), it STOPS and flags the orchestrator. The orchestrator extends `types.ts` in a follow-up commit between this wave's completion and Wave 2.5 dispatch. Diverging types is forbidden this session — the primitive landed three minutes ago and its author is still fresh.
   - **Import solver from `@/components/physics/circuit-canvas/solver`.** §06 physics libs may wrap `solveDC`/`solveTransient`/`solveACPhasor` but must not re-implement MNA.
6. **Types contract for §07 agents:** §07 topics operate on continuous fields, not lumped circuits. They use their own pure-TS functions in `lib/physics/electromagnetism/<topic>.ts`. Reuse `Vec3` from `@/lib/physics/electromagnetism/lorentz` where 3D is needed. `Vec2` from `@/lib/physics/coulomb` for 2D cases. No new shared types expected.
7. **Return** a **structured handoff block** in the agent's final message:
   - **`registry`:** the exact import + registry-entry block(s) to insert into `lib/content/simulation-registry.ts`. Section comment `// EM §06 — <slug>` or `// EM §07 — <slug>`, then one `NameScene: lazyScene(() => import(...))` entry per scene.
   - **`publishArg`:** the exact content slug for `pnpm content:publish --only`, e.g. `electromagnetism/ac-circuits-and-phasors`.
   - **`commitSubject`:** a single-line commit subject, e.g. `feat(em/§06): ac-circuits-and-phasors — rotating phasors, impedance, power factor`.
   - **`forwardRefs`:** (optional) array of slugs the MDX uses via `<Term>` or `<PhysicistLink>` that are NOT in Wave 1's TS arrays and NOT in any prior-session seed — Wave 3 will add placeholders.
   - **`typeExtensionsNeeded`:** (optional, §06 only) if the primitive's `types.ts` needs a new field or kind, describe the change here instead of writing it — the orchestrator decides.

**Per-topic substructure (every task follows this skeleton):**

1. **Physics lib** (`lib/physics/electromagnetism/<topic>.ts`) — pure TS, no React.
2. **Physics tests** (`tests/physics/electromagnetism/<topic>.test.ts`) — vitest. 3–8 test cases per topic with at least one known-value case per exported function.
3. **Simulation components** (`components/physics/<name>-scene.tsx`) — `"use client"` named exports, Canvas 2D animation loop via `requestAnimationFrame`, dark canvas, font-mono HUD. Color palette (carried from §01–§05):
   - `#FF6ADE` (magenta) for + voltage / + charge
   - cyan for − voltage / field accents
   - `#FFD66B` (amber) for conduction current / motion cues
   - `rgba(120,220,255,…)` for B-field arrows
   - `rgba(120,255,170,…)` for induced EMF / induced current
   - NEW for §06/§07: `rgba(200,160,255,…)` (lilac) for displacement current / field-energy density overlays — visually distinguishable from conduction and induction.
4. **Content page** (`app/[locale]/(topics)/electromagnetism/<slug>/page.tsx`) — copy from `app/[locale]/(topics)/electromagnetism/the-lorentz-force/page.tsx` (1:1), change only the `SLUG` constant.
5. **MDX content** (`content.en.mdx`) — standard block grammar (`<TopicPageLayout>`, `<TopicHeader>`, numbered `<Section>`s, `<SceneCard>`, `<EquationBlock>`, `<Callout>`, `<PhysicistLink>`, `<Term>`). Target word count: **1100–1400 per topic baseline; §07.1 and §07.2 target 1400–1600** (the spec calls these out as the emotional apex of the branch so far).

**Voice — §06 is PRACTICAL.** Engineers use this daily. Kurzgesagt meets Stripe docs with emphasis on "useful." §06.1 promises "two sentences that solve almost every schematic" — deliver. §06.5 is the "rotation as the secret of every wall socket" topic — own the metaphor.

**Voice — §07 is UNIFICATION.** After 36 figures of individual laws, §07 brings them together. §07.1 (displacement current) and §07.2 (the four equations) are the money shots of the branch so far. Write them like you mean it. §07.3 (gauge freedom) is subtle — plain words first, always. §07.4 (Poynting) is satisfying (energy flow has a direction, and you can draw it). §07.5 (Maxwell stress tensor) is where "fields carry momentum" stops being a metaphor.

**Calculus Policy A (locked):** every topic using ∮ / ∇× / ∇· / ∇ / ∂/∂t / ∫dℓ / ∫dA explains the symbol in plain words first, in-context, before the equation. The `aside` link to `/dictionary/<slug>` is a "go deeper" anchor, not the explanation.

**Cross-ref discipline:** `<PhysicistLink slug="…">` is only valid for slugs present in `PHYSICISTS` (including Wave 1 additions). For Session 4 the allowed set is §01–§05 physicists (Coulomb, Franklin, Gauss, Faraday, Poisson, Curie, Ørsted, Ampère, Biot, Savart, Lorentz, Weiss, Meissner, Kamerlingh Onnes, Henry, Lenz, Foucault) plus the 5 new ones (Kirchhoff, Ohm, Heaviside, Maxwell, Poynting) plus any CM physicist that's relevant (Tesla, Joule). Anyone else → plain text. `<Term slug="…">` is only valid for slugs in `GLOSSARY` (including Wave 1) OR earlier seed scripts. Forward-refs → `forwardRefs` in handoff block.

---

### Task 4: Topic `dc-circuits-and-kirchhoff` (FIG.26, §06)

**Goal:** Ohm's law and Kirchhoff's two sentences. Node rule (sum of currents = 0) and loop rule (sum of voltage drops around a closed loop = 0). Voltage divider as the canonical subcircuit. The two sentences "that solve almost every schematic."

**Files:**
- Create: `lib/physics/electromagnetism/dc-circuits.ts`
- Create: `tests/physics/electromagnetism/dc-circuits.test.ts`
- Create: `components/physics/resistor-ladder-scene.tsx`, `node-loop-law-scene.tsx`, `voltage-divider-scene.tsx`
- Create: `app/[locale]/(topics)/electromagnetism/dc-circuits-and-kirchhoff/{page.tsx,content.en.mdx}`

- [ ] **Step 1: Physics lib** — import the solver from the primitive:

```typescript
import { solveDC, thevenin } from "@/components/physics/circuit-canvas/solver";
import type { CircuitScene } from "@/components/physics/circuit-canvas/types";

/** Ohm's law: V = I·R. */
export function ohm(I: number, R: number): number { return I * R; }
export function current(V: number, R: number): number { if (R === 0) throw new Error("R must be nonzero"); return V / R; }

/** Series combination. */
export function seriesResistance(Rs: number[]): number { return Rs.reduce((a, b) => a + b, 0); }
/** Parallel combination. */
export function parallelResistance(Rs: number[]): number {
  if (Rs.some((r) => r <= 0)) throw new Error("parallel R requires positive values");
  return 1 / Rs.reduce((acc, r) => acc + 1 / r, 0);
}
/** Voltage divider: V_out = V_in · R2 / (R1 + R2). */
export function voltageDivider(Vin: number, R1: number, R2: number): number {
  return (Vin * R2) / (R1 + R2);
}
/** Solve an arbitrary DC ladder via the primitive. */
export function solveLadder(scene: CircuitScene) { return solveDC(scene); }
```

- [ ] **Step 2: Tests** — 5–6 vitest cases: Ohm's law, series = sum, parallel of two equal R = R/2, 3-parallel, voltage divider 10V/R=R → 5V, end-to-end test building a 4-node scene and asserting a known answer.

- [ ] **Step 3: Scenes**

- `resistor-ladder-scene.tsx` — Uses `<CircuitCanvas mode="dc">`. Shows a 3-resistor series ladder (100 / 200 / 300 Ω) with 12 V source. HUD: I (20 mA), V across each R. Slider: change R2 → watch V across R2 update live via MNA.
- `node-loop-law-scene.tsx` — Two-loop circuit (one shared resistor). Animates current arrows around each loop in amber; as the shared-resistor value slides, the arrow lengths update and the HUD asserts I₁ − I₂ − I₃ = 0 at the central node (KCL) and ΣV = 0 around each loop (KVL).
- `voltage-divider-scene.tsx` — Two resistors, tapped in the middle. Slider for R1/R2 ratio (0.1 to 10). V_out displayed as a percentage of V_in on a horizontal bar; circuit diagram on the right updates.

- [ ] **Step 4: `page.tsx`** — copy from `the-lorentz-force/page.tsx`, change `SLUG` to `"electromagnetism/dc-circuits-and-kirchhoff"`.

- [ ] **Step 5: MDX outline (target 1200 words)**

1. §1 **From one resistor to a thousand** — Ohm 1827, Georg Ohm's scorned monograph, 1841 Copley restoration. `<PhysicistLink slug="georg-ohm" />`. EQ.01 V=IR. ~180 words.
2. §2 **Kirchhoff's node rule** — charge in = charge out at every junction. EQ.02 Σ I_in = 0. SceneCard `NodeLoopLawScene`. ~200 words.
3. §3 **Kirchhoff's loop rule** — energy conservation around a closed loop. EQ.03 Σ V = 0. `<PhysicistLink slug="gustav-kirchhoff" />`. ~200 words.
4. §4 **Series and parallel** — EQ.04/05. SceneCard `ResistorLadderScene`. ~180 words.
5. §5 **The voltage divider** — the subcircuit inside every schematic. EQ.06. SceneCard `VoltageDividerScene`. ~200 words.
6. §6 **Thevenin's elegance** — any two-terminal linear network → (V_open, R_Thev). Why engineers think in Thevenin equivalents. ~180 words.
7. §7 **Where it shows up** — Wheatstone bridge, every op-amp input stage, every sensor-to-ADC chain. ~120 words.

Aside (3): `{ type: "term", label: "Resistance", href: "/dictionary/resistance" }`, `{ type: "term", label: "Voltage divider", href: "/dictionary/voltage-divider" }`, `{ type: "physicist", label: "Gustav Kirchhoff", href: "/physicists/gustav-kirchhoff" }`.

**Commit subject:** `feat(em/§06): dc-circuits-and-kirchhoff — Ohm + node/loop laws + voltage divider`

---

### Task 5: Topic `rc-circuits` (FIG.27, §06)

**Goal:** Why the capacitor never quite gets there. Exponential charging and discharging. τ = RC. The one-paragraph derivation from Kirchhoff + Q = CV + i = dQ/dt. I²R heating bridging to Joule's law.

**Files:**
- Create: `lib/physics/electromagnetism/rc-circuits.ts`, test
- Create: `components/physics/rc-charging-scene.tsx`, `rc-discharging-scene.tsx`, `rc-time-constant-scene.tsx`
- Create: topic folder + page.tsx + content.en.mdx

- [ ] **Step 1: Physics lib**

```typescript
/** Capacitor voltage while charging toward V0 through R, starting from V(0)=0. */
export function rcCharge(V0: number, R: number, C: number, t: number): number {
  return V0 * (1 - Math.exp(-t / (R * C)));
}
/** Capacitor voltage while discharging from V0 through R. */
export function rcDischarge(V0: number, R: number, C: number, t: number): number {
  return V0 * Math.exp(-t / (R * C));
}
export function rcTimeConstant(R: number, C: number): number { return R * C; }
/** Instantaneous current during charge: I(t) = (V0/R)·e^(-t/τ). */
export function rcChargeCurrent(V0: number, R: number, C: number, t: number): number {
  return (V0 / R) * Math.exp(-t / (R * C));
}
/** Total energy dissipated in R during a charge from 0 to V0 — always ½CV², same as stored. */
export function rcChargeEnergyDissipated(V0: number, C: number): number { return 0.5 * C * V0 * V0; }
```

- [ ] **Step 2: Tests** — 5 cases: V(τ) = V0·(1−1/e), V(5τ) ≈ V0, discharge at τ ≈ V0/e, ½CV² heating, current at t=0 equals V0/R.

- [ ] **Step 3: Scenes**

- `rc-charging-scene.tsx` — `<CircuitCanvas mode="transient">` with V=5V, R and C sliders. Two synchronized plots on the right: V_c(t) rising (lilac, the capacitor is storing field energy) and I(t) decaying (amber). HUD: τ, V_c/V0 %.
- `rc-discharging-scene.tsx` — Switch swaps from source to short at t=0. V_c decays; I reverses sign. Slider for R.
- `rc-time-constant-scene.tsx` — Three superimposed curves: R=100, 1k, 10k at the same C. Shows τ's linear dependence on R. Reference dashed lines at 0.63·V0 marking each τ.

- [ ] **Step 4-5: page.tsx + MDX (target 1100 words)**

MDX outline:
1. §1 **Nothing changes instantly in a capacitor** — V_c cannot jump because Q can't. ~180 words.
2. §2 **Charging** — Kirchhoff + Q=CV + i=dQ/dt → first-order ODE → V(t)=V0(1−e^(−t/τ)). EQ.01–03. `<PhysicistLink slug="georg-ohm" />`. ~250 words.
3. §3 **The asymptote** — SceneCard `RcChargingScene`. At t=τ the cap is 63% charged; at 5τ essentially done. ~200 words.
4. §4 **Discharging** — SceneCard `RcDischargingScene`. Symmetric decay. ~150 words.
5. §5 **Half the energy always goes to heat** — EQ.04. I²R integrated = ½CV². `<PhysicistLink slug="james-prescott-joule" />`. ~180 words.
6. §6 **Time-constant intuition** — SceneCard `RcTimeConstantScene`. Why τ is what engineers actually measure. ~150 words.
7. §7 **Where it shows up** — debouncing, PWM smoothing, camera flash capacitors, every RC low-pass filter. ~120 words.

**Commit subject:** `feat(em/§06): rc-circuits — exponential charge, τ=RC, and why half goes to heat`

---

### Task 6: Topic `rl-circuits` (FIG.28, §06)

**Goal:** The coil's version of hesitation. τ_L = L/R. Rise of current in an RL circuit as the dual of the RC capacitor-voltage rise. Back-EMF fights the change.

**Files:** lib `rl-circuits.ts`, test, 3 scenes, topic folder.

- [ ] **Step 1: Physics lib**

```typescript
export function rlTimeConstant(L: number, R: number): number { return L / R; }
/** Current in series RL from zero, source V0: I(t) = (V0/R)(1 − e^(−t·R/L)). */
export function rlCurrent(V0: number, R: number, L: number, t: number): number {
  return (V0 / R) * (1 - Math.exp(-(t * R) / L));
}
/** Decay of current after the source is removed and shorted: I(t) = I0·e^(−t·R/L). */
export function rlDecay(I0: number, R: number, L: number, t: number): number {
  return I0 * Math.exp(-(t * R) / L);
}
/** Back-EMF during current ramp: V_L = L·dI/dt. */
export function backEMF(V0: number, R: number, L: number, t: number): number {
  return V0 * Math.exp(-(t * R) / L);
}
/** Total energy stored in the inductor after a long time: ½LI². */
export function inductorEnergy(L: number, Isteady: number): number {
  return 0.5 * L * Isteady * Isteady;
}
```

- [ ] **Step 2: Tests** — 5 cases covering τ, I(τ), V_L(0) = V0, ½LI² at steady state.

- [ ] **Step 3: Scenes**

- `rl-ramp-scene.tsx` — source + R + L in series. I(t) rising, V_L(t) decaying, both animated with a transient solver run. Slider for L.
- `rl-decay-scene.tsx` — source removed at t=0; current continues through a freewheeling path and decays.
- `rl-flyback-scene.tsx` — abruptly open a switch in an RL circuit → huge voltage spike (back-EMF → L·dI/dt when dI is enormous). The "why spark plugs work" reveal.

- [ ] **Step 4-5: page.tsx + MDX (target 1050 words)**

1. §1 **The coil resists its own current change** — Lenz-derived. `<PhysicistLink slug="joseph-henry" />`. ~180 words.
2. §2 **The ODE** — Kirchhoff + V_L = L·dI/dt → first-order ODE → I(t). EQ.01–02. ~200 words.
3. §3 **Rise** — SceneCard `RlRampScene`. At τ_L = L/R, current is 63% of steady. ~180 words.
4. §4 **Decay** — SceneCard `RlDecayScene`. Symmetric. ~150 words.
5. §5 **Stored energy ½LI²** — EQ.03. Preview of §07.4 (Poynting). ~150 words.
6. §6 **Flyback — the spark-plug reveal** — SceneCard `RlFlybackScene`. Opening an inductive circuit abruptly → enormous dI/dt → enormous V = L·dI/dt. Every car engine ignition uses this. ~180 words.
7. §7 **Where it shows up** — relays, SMPS, ignition coils, plasma generators. ~100 words.

**Commit subject:** `feat(em/§06): rl-circuits — τ=L/R, back-EMF, and the flyback spark`

---

### Task 7: Topic `rlc-circuits-and-resonance` (FIG.29, §06)

**Goal:** Two stores of energy (C and L), one frequency that resonates. Undamped ω₀ = 1/√(LC). Damped (R ≠ 0): three regimes (overdamped, critical, underdamped). Q = ω₀L/R. Bandwidth ≈ ω₀/Q.

**Files:** lib `rlc-resonance.ts`, test, 3 scenes, topic folder.

- [ ] **Step 1: Physics lib**

```typescript
export function resonantFrequency(L: number, C: number): number {
  return 1 / Math.sqrt(L * C);
}
export function qualityFactor(L: number, C: number, R: number): number {
  return (1 / R) * Math.sqrt(L / C);
}
export function bandwidth(L: number, C: number, R: number): number {
  return R / L; // Δω ≈ R/L for series RLC
}
/** Damping regimes: returns "over" | "critical" | "under" | "undamped". */
export function dampingRegime(R: number, L: number, C: number): "over" | "critical" | "under" | "undamped" {
  if (R === 0) return "undamped";
  const zeta = (R / 2) * Math.sqrt(C / L);
  if (zeta > 1) return "over";
  if (Math.abs(zeta - 1) < 1e-12) return "critical";
  return "under";
}
/** Underdamped series-RLC step response to V0: I(t). */
export function rlcStepResponse(V0: number, R: number, L: number, C: number, t: number): number {
  const alpha = R / (2 * L);
  const w0 = 1 / Math.sqrt(L * C);
  const wd = Math.sqrt(Math.max(0, w0 * w0 - alpha * alpha));
  return (V0 / (L * wd)) * Math.exp(-alpha * t) * Math.sin(wd * t);
}
```

- [ ] **Step 2: Tests** — 6 cases: ω₀ for known LC, Q for known RLC, damping regime classification (pick R values straddling critical), step response at t=0 is 0, peak at t = arctan(wd/α)/wd.

- [ ] **Step 3: Scenes**

- `rlc-resonance-scene.tsx` — source + R + L + C (series). Sweep the source ω; plot |I(ω)| vs ω; peak at ω₀. HUD: ω₀, Q, bandwidth.
- `q-factor-scene.tsx` — three resonance peaks at same ω₀ but different R (= different Q). Tall-narrow vs wide-short. Slider for R.
- `rlc-bandpass-scene.tsx` — transfer function |V_out/V_in| across the capacitor as ω varies. Shows the bandpass-filter interpretation.

- [ ] **Step 4-5: page.tsx + MDX (target 1250 words)**

1. §1 **Two energy reservoirs** — L stores ½LI² in B; C stores ½CV² in E. Exchange back and forth. ~180 words.
2. §2 **The resonant frequency** — EQ.01 ω₀ = 1/√(LC). Plain-words: "rate at which energy naturally sloshes between L and C." ~200 words.
3. §3 **Damping** — R siphons energy → three regimes. SceneCard `RlcResonanceScene` for underdamped. ~250 words.
4. §4 **The quality factor Q** — EQ.02. "How many cycles before the amplitude drops to 1/e." Plain-words first. `<PhysicistLink slug="gustav-kirchhoff" />`. SceneCard `QFactorScene`. ~200 words.
5. §5 **Resonance curve** — EQ.03 bandwidth Δω ≈ ω₀/Q. SceneCard `RlcBandpassScene`. ~180 words.
6. §6 **Where it shows up** — every radio front-end, every crystal oscillator, MRI coils, wireless charging pads. `<PhysicistLink slug="james-prescott-joule" />`. ~150 words.

**Commit subject:** `feat(em/§06): rlc-circuits-and-resonance — ω₀=1/√(LC), Q, three damping regimes`

---

### Task 8: Topic `ac-circuits-and-phasors` (FIG.30, §06) — **MONEY SHOT**

**Goal:** Rotation as the secret of every wall socket. The complex exponential e^(jωt) as the ultimate notational labour-saver. Impedance Z = R + jX. Voltage and current phasors; the phase angle between them tells you the power factor.

**Files:** lib `ac-phasors.ts`, test, 3 scenes (**phasor-diagram-scene = money shot**), topic folder.

- [ ] **Step 1: Physics lib**

```typescript
export interface Complex { re: number; im: number; }
export function cadd(a: Complex, b: Complex): Complex { return { re: a.re + b.re, im: a.im + b.im }; }
export function cmul(a: Complex, b: Complex): Complex { return { re: a.re * b.re - a.im * b.im, im: a.re * b.im + a.im * b.re }; }
export function cdiv(a: Complex, b: Complex): Complex {
  const d = b.re * b.re + b.im * b.im;
  if (d === 0) throw new Error("division by zero in complex");
  return { re: (a.re * b.re + a.im * b.im) / d, im: (a.im * b.re - a.re * b.im) / d };
}
export function cabs(a: Complex): number { return Math.hypot(a.re, a.im); }
export function cphase(a: Complex): number { return Math.atan2(a.im, a.re); }

/** Impedance of a resistor. */
export function zResistor(R: number): Complex { return { re: R, im: 0 }; }
/** Impedance of a capacitor at angular frequency ω: Z = 1/(jωC) = −j/(ωC). */
export function zCapacitor(omega: number, C: number): Complex { return { re: 0, im: -1 / (omega * C) }; }
/** Impedance of an inductor at ω: Z = jωL. */
export function zInductor(omega: number, L: number): Complex { return { re: 0, im: omega * L }; }

/** Series impedance sum. */
export function zSeries(zs: Complex[]): Complex { return zs.reduce(cadd, { re: 0, im: 0 }); }
/** Power factor cos(φ) = Re(Z)/|Z|. */
export function powerFactor(Z: Complex): number { return Z.re / cabs(Z); }
/** Average real power in a purely AC load: P = V_rms · I_rms · cos(φ). */
export function averagePower(Vrms: number, Irms: number, phi: number): number {
  return Vrms * Irms * Math.cos(phi);
}
```

- [ ] **Step 2: Tests** — 6 cases: complex arithmetic sanity, zCapacitor phase = −π/2, zInductor phase = +π/2, series RLC at resonance has zero imaginary part, power factor of pure R is 1, of pure L is 0.

- [ ] **Step 3: Scenes** (keep the primitive lean — build these with raw Canvas 2D since they're phasor visualizations, not circuit schematics)

- `phasor-diagram-scene.tsx` — **MONEY SHOT.** Two panels side by side, synchronized via ω. Left: rotating phasors (V in magenta, I in amber) at a common angular velocity ω. The angle between them is the phase φ. Right: oscilloscope trace showing v(t) = V·cos(ωt) and i(t) = I·cos(ωt − φ) as the phasors sweep. Slider for φ (−π/2 to +π/2 — capacitive to inductive). As the reader drags φ, the two traces desynchronize visibly and the power-factor readout updates. This is THE moment impedance clicks visually.
- `impedance-triangle-scene.tsx` — Complex plane. R on the real axis, X on the imaginary. The hypotenuse is |Z| at angle φ. Slider for R, L, C (at a fixed ω). The triangle morphs; |Z| and φ update.
- `power-factor-scene.tsx` — Three lightbulbs in series with three different loads: pure R, R+L, R+C. Same rms voltage applied. Readout: real power consumed. The R-only bulb burns brightest; the R+L and R+C ones dim because of phase.

- [ ] **Step 4-5: page.tsx + MDX (target 1350 words — this is the money-shot topic, warrant the length)**

1. §1 **The trick is rotation** — `<PhysicistLink slug="nikola-tesla" />`'s 1888 polyphase motor. The wall socket is a rotating phasor pretending to be a voltage. ~200 words.
2. §2 **Phasors as complex numbers** — Euler's e^(jωt) and why electrical engineers use j instead of i. ~200 words.
3. §3 **Reactance and impedance** — EQ.01 Z_C = −j/(ωC), EQ.02 Z_L = jωL, EQ.03 Z = R + jX. `<PhysicistLink slug="oliver-heaviside" />` coined "impedance" 1886. `<Term slug="impedance" />`. ~200 words.
4. §4 **The rotating phasor** — SceneCard `PhasorDiagramScene` (the money shot). Phase lead/lag made visual. ~250 words.
5. §5 **The impedance triangle** — SceneCard `ImpedanceTriangleScene`. `<Term slug="reactance" />`. ~180 words.
6. §6 **Power and power factor** — EQ.04 P = V·I·cos(φ). SceneCard `PowerFactorScene`. The phase angle is the difference between apparent and real power. ~180 words.
7. §7 **Why the grid runs on this** — 50 Hz / 60 Hz, three-phase distribution, why industrial users get charged for bad power factor. ~180 words.

**Commit subject:** `feat(em/§06): ac-circuits-and-phasors — rotating phasors, impedance, power factor`

---

### Task 9: Topic `transformers` (FIG.31, §06)

**Goal:** How one coil teaches another what voltage to be. Mutual inductance as the mechanism. Turns ratio V_s/V_p = N_s/N_p. Ideal transformer as energy-conserving with coupling coefficient k. Why grids use high voltage (P_loss = I²R, so at fixed power drop V down means I up means quadratic heat loss).

**Files:** lib `transformers.ts`, test, 3 scenes, topic folder.

- [ ] **Step 1: Physics lib**

```typescript
/** Ideal voltage ratio: V_s / V_p = N_s / N_p. */
export function voltageRatio(turnsRatio: number, Vp: number): number { return turnsRatio * Vp; }
/** Ideal current ratio (conservation of power): I_s / I_p = N_p / N_s. */
export function currentRatio(turnsRatio: number, Ip: number): number {
  if (turnsRatio === 0) throw new Error("turns ratio must be nonzero");
  return Ip / turnsRatio;
}
/** Mutual inductance from the coupling coefficient and self-inductances. */
export function mutualInductance(k: number, Lp: number, Ls: number): number {
  return k * Math.sqrt(Lp * Ls);
}
/** Power loss in a transmission line for a given load power and source voltage. */
export function lineLoss(loadPower: number, sourceVoltage: number, lineResistance: number): number {
  const I = loadPower / sourceVoltage;
  return I * I * lineResistance;
}
/** The dual of lineLoss: how much more power you lose if you step down voltage by a factor f. */
export function lineLossScaleFactor(f: number): number { return f * f; } // I² grows as f²
```

- [ ] **Step 2: Tests** — 5 cases: 10:1 transformer on 120V → 12V, current doubles when voltage halves (ideal), k=1 → M = √(LpLs), k=0.5 halves M, line-loss halves when you double V.

- [ ] **Step 3: Scenes**

- `transformer-coupling-scene.tsx` — Two coils on a shared ferromagnetic core (draw the core as a rectangle). Slider for turns ratio (label N_p and N_s). Primary coil shows V_p and I_p; secondary shows V_s = V_p·n and I_s = I_p/n live. Flux lines in cyan loop through the core.
- `turns-ratio-scene.tsx` — A simpler pedagogical view: three transformers side by side with 2:1, 1:1, 1:2 turns ratios. Same V_p input. V_s differs.
- `power-transmission-scene.tsx` — A 100 km transmission line. Source power 1 MW. Slider for transmission voltage (1 kV to 1 MV). I²R loss plotted on a log axis; goes from "most of the power lost as heat" at 1 kV to "negligible loss" at 500 kV. Real-world readout: Europe runs 400 kV.

- [ ] **Step 4-5: page.tsx + MDX (target 1150 words)**

1. §1 **The ironhead puzzle** — Tesla's War of the Currents in one paragraph. Why AC won: transformers. `<PhysicistLink slug="nikola-tesla" />`. ~200 words.
2. §2 **Mutual inductance** — short reprise of `<Term slug="flux-linkage" />` from §05.3. `M = k·√(L_p·L_s)`. ~180 words.
3. §3 **The voltage ratio** — EQ.01 V_s/V_p = N_s/N_p. SceneCard `TransformerCouplingScene`. ~200 words.
4. §4 **The current ratio (power conservation)** — EQ.02. SceneCard `TurnsRatioScene`. ~150 words.
5. §5 **Why the grid runs at hundreds of kV** — EQ.03 P_loss = I²R. SceneCard `PowerTransmissionScene`. `<Term slug="transformer" />`. ~220 words.
6. §6 **Losses in real transformers** — core hysteresis (→ link to §04.3), eddy currents in the core (→ link to §05.5), I²R in the windings. ~150 words.
7. §7 **From the grid to your phone** — the cascade of transformers from 400 kV down to 5 V USB-C. ~100 words.

**Commit subject:** `feat(em/§06): transformers — turns ratio, mutual coupling, and why grids run high-V`

---

### Task 10: Topic `transmission-lines` (FIG.32, §06)

**Goal:** When the wire gets long enough to matter. The distributed-parameter model (L_per_m, C_per_m, R_per_m, G_per_m). Telegrapher's equations. Characteristic impedance Z₀ = √(L/C). Reflection at impedance mismatch. Standing wave ratio. `<PhysicistLink slug="oliver-heaviside" />`'s Kurzgesagt-perfect story: self-taught iconoclast who reduced Maxwell's 20 equations to 4 and invented the telegrapher's equations.

**Files:** lib `transmission-lines.ts`, test, 3 scenes, topic folder.

- [ ] **Step 1: Physics lib**

```typescript
/** Characteristic impedance of a lossless line: Z₀ = √(L/C). */
export function characteristicImpedance(lPerMeter: number, cPerMeter: number): number {
  if (lPerMeter <= 0 || cPerMeter <= 0) throw new Error("L and C per metre must be positive");
  return Math.sqrt(lPerMeter / cPerMeter);
}
/** Propagation velocity on a lossless line: v = 1/√(LC). */
export function propagationVelocity(lPerMeter: number, cPerMeter: number): number {
  return 1 / Math.sqrt(lPerMeter * cPerMeter);
}
/** Reflection coefficient at a termination Z_L: Γ = (Z_L − Z₀)/(Z_L + Z₀). */
export function reflectionCoefficient(zLoad: number, z0: number): number {
  if (zLoad + z0 === 0) throw new Error("sum of impedances cannot be zero");
  return (zLoad - z0) / (zLoad + z0);
}
/** Standing-wave ratio: SWR = (1 + |Γ|)/(1 − |Γ|). */
export function swr(gamma: number): number {
  const mag = Math.abs(gamma);
  if (mag >= 1) return Infinity;
  return (1 + mag) / (1 - mag);
}
```

- [ ] **Step 2: Tests** — 5 cases: Z₀ for 50 Ω coax inputs, matched load (Z_L=Z₀) gives Γ=0 and SWR=1, open-circuit Γ=+1, short-circuit Γ=−1, SWR when Z_L = 2·Z₀.

- [ ] **Step 3: Scenes**

- `tl-distributed-scene.tsx` — A transmission line drawn as a ladder of tiny L_dx and C_dx cells (10–20 cells visible). Propagating pulse (amber) travels left to right at v = 1/√(LC). Slider for L_per_m and C_per_m; v updates.
- `reflection-coefficient-scene.tsx` — Same line, but now with a load Z_L at the right end. Slider for Z_L/Z₀. Incident pulse arrives; reflected pulse departs in proportion to Γ. At Z_L=Z₀: no reflection (matched). At Z_L=∞ (open): full positive reflection. At Z_L=0 (short): full inverted reflection. `<Term slug="characteristic-impedance" />`.
- `standing-wave-ratio-scene.tsx` — Continuous sinusoidal source into a mismatched load. Standing-wave envelope on the line. Slider for Z_L; SWR readout updates.

- [ ] **Step 4-5: page.tsx + MDX (target 1300 words)**

1. §1 **When is a wire no longer a wire?** — the rule of thumb: when line length > λ/10. Above that, the wave nature of the signal matters. ~180 words.
2. §2 **Heaviside's distributed model** — `<PhysicistLink slug="oliver-heaviside" />` the self-taught London telegrapher. 4 parameters per unit length: L, C, R, G. ~250 words.
3. §3 **The telegrapher's equations** — EQ.01. Two coupled PDEs → wave equation. EQ.02 v = 1/√(LC). ~220 words.
4. §4 **Characteristic impedance** — EQ.03 Z₀ = √(L/C). SceneCard `TlDistributedScene`. `<Term slug="characteristic-impedance" />`. ~200 words.
5. §5 **Reflection and matching** — EQ.04 Γ = (Z_L − Z₀)/(Z_L + Z₀). SceneCard `ReflectionCoefficientScene`. ~200 words.
6. §6 **Standing waves** — EQ.05 SWR. SceneCard `StandingWaveRatioScene`. `<Term slug="standing-wave-ratio" />`. ~150 words.
7. §7 **Where it shows up** — 50 Ω coax, 75 Ω cable TV, PCB striplines, antenna feedlines, undersea cables. ~100 words.

**Commit subject:** `feat(em/§06): transmission-lines — telegrapher's equations, Z₀, SWR`

---

### Task 11: Topic `displacement-current` (FIG.33, §07) — **MONEY SHOT**

**Goal:** The missing term Maxwell put in. Ampère's law without it is paradoxical for a charging capacitor: surface A through the wire gives I_enc = I, surface B through the gap gives I_enc = 0. The displacement current ε₀·∂Φ_E/∂t exactly fills the gap — and the paradox collapses. **This is the spec's moment-the-paradox-collapses money shot. Deliver on it.**

**Files:** lib `displacement-current.ts`, test, 3 scenes (**ampere-surface-morph-scene = money shot**), topic folder.

- [ ] **Step 1: Physics lib**

```typescript
import { EPSILON_0, MU_0 } from "@/lib/physics/constants";

/** Displacement current density: J_d = ε₀ · ∂E/∂t. */
export function displacementCurrentDensity(dEdt: number): number {
  return EPSILON_0 * dEdt;
}
/** Total displacement current through an area A assuming uniform E: I_d = ε₀·A·∂E/∂t. */
export function displacementCurrent(area: number, dEdt: number): number {
  return EPSILON_0 * area * dEdt;
}
/** For a parallel-plate capacitor of plate area A charging at rate dQ/dt: I_conduction = dQ/dt; the
 *  displacement current in the gap equals the conduction current exactly. This function asserts that
 *  equality numerically (used by the money-shot scene's consistency readout). */
export function capacitorCurrentContinuity(
  A: number,
  d: number,
  dQdt: number,
): { Iconduction: number; Idisplacement: number } {
  // E = σ/ε₀ = Q/(A·ε₀). dE/dt = (1/(A·ε₀))·dQ/dt.
  // I_d through the gap = ε₀·A·dE/dt = dQ/dt. Exactly equal.
  const Iconduction = dQdt;
  const Idisplacement = EPSILON_0 * A * (dQdt / (A * EPSILON_0));
  return { Iconduction, Idisplacement };
}
/** Speed of light as 1/√(μ₀·ε₀) — the reveal that displacement current underwrites. */
export function speedOfLightFromFundamentals(): number {
  return 1 / Math.sqrt(MU_0 * EPSILON_0);
}
```

- [ ] **Step 2: Tests** — 5 cases: displacement current density with zero dE/dt is zero, continuity holds for a range of dQ/dt, speed-of-light derivation returns ≈ 3e8 within 1 part in 1e6.

- [ ] **Step 3: Scenes**

- `ampere-surface-morph-scene.tsx` — **MONEY SHOT.** Parallel-plate capacitor being charged. Two panels side by side. Left: Ampère's law integration surface is a disc threaded by the wire; I_enc = I_conduction (the HUD shows ∮B·dℓ = μ₀·I). Right: the SAME Ampère loop, but the integration surface bulges like a bag and passes between the plates, where no conduction current crosses it; I_enc = 0 without Maxwell's correction. **Morph the surface live** (the bag inflates from the wire until it slides through the gap). Without the displacement term, the two readouts diverge — text overlay: "Paradox." Toggle Maxwell's correction ON → the right panel adds ε₀·∂Φ_E/∂t and both readouts converge exactly. Text overlay: "Resolved." HUD: both ∮B·dℓ evaluations, plus I_conduction and I_displacement.
- `displacement-field-buildup-scene.tsx` — Between the plates: E field (lilac) growing linearly with time as Q grows. Animated flow lines showing ∂E/∂t as if it were a current. HUD: dE/dt, J_d = ε₀·∂E/∂t.
- `capacitor-current-continuity-scene.tsx` — A single dashed-line loop wrapping around one plate entirely — the surface cuts both the wire (left side) AND the gap (right side). Shows I_conduction flowing in, I_displacement flowing out, balance holds. The "current is continuous across the plate boundary because displacement current picks up where conduction leaves off" reveal.

- [ ] **Step 4-5: page.tsx + MDX (target 1500 words — the spec calls out 1400–1600; deliver)**

1. §1 **Ampère's paradox** — a charging capacitor is a setup that breaks Ampère's law as written in 1826. `<PhysicistLink slug="andre-marie-ampere" />`. ~220 words.
2. §2 **Two surfaces, two answers** — SceneCard `AmpereSurfaceMorphScene` (money shot). Walk through both surface choices. Without the fix: ∮B·dℓ depends on the surface. That's impossible — the line integral is a property of the loop, not of any particular surface bounded by it. ~300 words.
3. §3 **What's between the plates** — an electric field that grows as Q does. SceneCard `DisplacementFieldBuildupScene`. EQ.01 E = σ/ε₀ inside the gap. ~200 words.
4. §4 **Maxwell's correction** — EQ.02 ∮B·dℓ = μ₀(I_enc + ε₀·∂Φ_E/∂t). `<PhysicistLink slug="james-clerk-maxwell" />` published this in 1865 (*A Dynamical Theory of the Electromagnetic Field*). The displacement current is a rate of change of flux, not a flow of charge. ~280 words.
5. §5 **Why the fix is exact** — SceneCard `CapacitorCurrentContinuityScene`. Plain-words: the conduction current stops at the plate, but the electric flux through the gap picks up exactly the right amount to keep the total going. Total current is continuous. ~180 words.
6. §6 **The consequence nobody saw coming** — because displacement current acts as a source for B, a changing E produces a magnetic field; combined with Faraday's law (changing B produces E), the two can self-sustain as a travelling wave. ε₀ + μ₀ → 1/√(μ₀ε₀) = c = 3×10⁸ m/s. `<Term slug="electromagnetic-wave" />` is §08 — add to forwardRefs. ~220 words.
7. §7 **Look at what you just earned** — a preview of the remaining four §07 topics. The unified theory is three topics away. ~100 words.

**Commit subject:** `feat(em/§07): displacement-current — Maxwell's fix, the paradox, and c falling out`

---

### Task 12: Topic `the-four-equations` (FIG.34, §07)

**Goal:** The most important four lines in physics, together for the first time. Integral form AND differential form. Each line's story in one sentence. The `<PhysicistLink slug="oliver-heaviside" />` reduction from 20 equations to 4. Why the order is conventionally "sources of E, no monopoles, Faraday, Maxwell–Ampère."

**Files:** lib `four-equations.ts`, test, 3 scenes, topic folder.

- [ ] **Step 1: Physics lib**

```typescript
import { EPSILON_0, MU_0 } from "@/lib/physics/constants";

/** Right-hand side of Gauss's law in integral form for a given enclosed charge: ∮E·dA = Q_enc/ε₀. */
export function gaussRhs(qEnclosed: number): number { return qEnclosed / EPSILON_0; }
/** Ampère–Maxwell law's RHS for known enclosed I and dΦ_E/dt. */
export function ampereMaxwellRhs(iEnclosed: number, dPhi_E_dt: number): number {
  return MU_0 * (iEnclosed + EPSILON_0 * dPhi_E_dt);
}
/** Faraday's law RHS for a given dΦ_B/dt. */
export function faradayRhs(dPhi_B_dt: number): number { return -dPhi_B_dt; }
/** Speed of light from ε₀ and μ₀ — the unity. */
export function c(): number { return 1 / Math.sqrt(MU_0 * EPSILON_0); }
```

- [ ] **Step 2: Tests** — 4 cases covering each equation's RHS plus the c derivation.

- [ ] **Step 3: Scenes** (these are more "readable diagrams" than animations, which is correct for this topic)

- `maxwell-table-scene.tsx` — A 4-row table. Column 1: integral form. Column 2: differential form. Column 3: one-sentence plain-words summary. Column 4: icon (flux-through-surface, no-monopole symbol, curl arrow, curl + displacement). Hover/tap a row → it highlights and a footer shows the canonical example (Gauss → point charge; no monopoles → compass needle; Faraday → transformer; Ampère–Maxwell → light). This is a diagram primarily; the Canvas animation is the highlighting + footer transition.
- `integral-vs-differential-scene.tsx` — Two panels: a closed surface (sphere) with flux arrows crossing it; a point inside the sphere with divergence readout. Shows that the integral form (flux out) and differential form (divergence at a point) are two views of the same content.
- `source-sink-field-scene.tsx` — 2D E-field visualization. A + charge is a source (field lines out); a − charge is a sink (field lines in); a current loop has no E source but curls B around it. Links the "sources" language to each equation.

- [ ] **Step 4-5: page.tsx + MDX (target 1500 words — emotional apex + integrator topic, warrant the length)**

1. §1 **Four lines** — write them down on one page. EQ.01–04 (integral form). ~200 words.
2. §2 **Line one: sources of E** — Gauss. `<PhysicistLink slug="carl-friedrich-gauss" />`. ~180 words.
3. §3 **Line two: no magnetic monopoles (yet)** — the one equation that's experimentally still open. Dirac showed them allowed; no one's found one. `<Term slug="maxwell-equations-term" />`. ~180 words.
4. §4 **Line three: Faraday's law** — changing B makes E. `<PhysicistLink slug="michael-faraday" />`. ~180 words.
5. §5 **Line four: Ampère–Maxwell** — currents and changing E both make B. `<PhysicistLink slug="james-clerk-maxwell" />`. ~200 words.
6. §6 **The same four lines, differential form** — EQ.05–08. SceneCard `MaxwellTableScene`. ~250 words.
7. §7 **What Heaviside did** — `<PhysicistLink slug="oliver-heaviside" />` reduced Maxwell's 1865 20-component quaternion formulation to four vector equations. The ones you see today are Heaviside's. ~200 words.
8. §8 **Light falls out** — c = 1/√(μ₀ε₀). The reveal §08 will deliver in full. ~110 words.

**Commit subject:** `feat(em/§07): the-four-equations — Gauss, no-monopole, Faraday, Ampère–Maxwell`

---

### Task 13: Topic `gauge-freedom-and-potentials` (FIG.35, §07)

**Goal:** The parts of the potential the field can't see. Gauge freedom: V and A can shift by gradients of a scalar function f without changing E or B. Two common choices: Lorenz gauge (∇·A + ∂V/∂t/c² = 0 — relativistically covariant) and Coulomb gauge (∇·A = 0 — easier for statics). The quiet sophistication of electrodynamics.

**Files:** lib `gauge.ts`, test, 3 scenes, topic folder.

- [ ] **Step 1: Physics lib**

```typescript
import type { Vec3 } from "@/lib/physics/electromagnetism/lorentz";

/** Apply a gauge transformation with scalar function f: A' = A + ∇f, V' = V − ∂f/∂t.
 *  This helper returns the shifted values at a point given the gradient of f and its time derivative. */
export function gaugeTransform(
  A: Vec3,
  V: number,
  gradF: Vec3,
  dFdt: number,
): { A: Vec3; V: number } {
  return {
    A: { x: A.x + gradF.x, y: A.y + gradF.y, z: A.z + gradF.z },
    V: V - dFdt,
  };
}
/** Check that E = −∇V − ∂A/∂t is invariant under the gauge transformation (numerically). */
export function checkGaugeInvariance(
  gradV: Vec3,
  dAdt: Vec3,
  gradVAfter: Vec3,
  dAdtAfter: Vec3,
  tolerance = 1e-10,
): boolean {
  const Ex = -gradV.x - dAdt.x;
  const Ey = -gradV.y - dAdt.y;
  const Ez = -gradV.z - dAdt.z;
  const Ex2 = -gradVAfter.x - dAdtAfter.x;
  const Ey2 = -gradVAfter.y - dAdtAfter.y;
  const Ez2 = -gradVAfter.z - dAdtAfter.z;
  return (
    Math.abs(Ex - Ex2) < tolerance &&
    Math.abs(Ey - Ey2) < tolerance &&
    Math.abs(Ez - Ez2) < tolerance
  );
}
```

- [ ] **Step 2: Tests** — 4 cases: gauge transform is identity when f=0, check invariance for a nontrivial gradF + dFdt, Lorenz condition holds for a specific (V, A) pair, Coulomb condition holds for another.

- [ ] **Step 3: Scenes**

- `gauge-transform-scene.tsx` — Two side-by-side 2D slices of the same E field. Left: (V, A) in Coulomb gauge (say, V does the work, A is small). Right: same E, but (V, A) in Lorenz gauge (both V and A share the load). The field (drawn with the shared arrows) is identical; the potentials under the hood look different.
- `lorenz-vs-coulomb-gauge-scene.tsx` — A small multi-line chart showing ∇·A vs time for both gauges. Coulomb: flat at 0. Lorenz: matches −∂V/∂t/c². Shows how the two constraints differ.
- `potential-freedom-scene.tsx` — A toy 1D setup. Fixed E field. Slider for an arbitrary function f. Watch V and A shift; watch E stay constant. "The field is observable; the potential isn't unique." `<Term slug="gauge-transformation" />`.

- [ ] **Step 4-5: page.tsx + MDX (target 1300 words)**

1. §1 **Where we left the potentials** — in §05.3 vector potential was introduced; now revisit under time dependence. ~180 words.
2. §2 **Redundancy in the potentials** — EQ.01 A → A + ∇f, V → V − ∂f/∂t. E and B don't notice. ~220 words.
3. §3 **Why this is good news** — we can pick an f to simplify our life. `<Term slug="gauge-transformation" />`. SceneCard `PotentialFreedomScene`. ~200 words.
4. §4 **The Lorenz gauge** — EQ.02 ∇·A + μ₀ε₀·∂V/∂t = 0. Makes the wave equations for V and A separate. The relativistically natural choice (named after Ludvig Lorenz — Danish, not H.A. Lorentz). `<Term slug="lorenz-gauge" />`. ~200 words.
5. §5 **The Coulomb gauge** — EQ.03 ∇·A = 0. Makes V obey Poisson instantly (statics-style) but A picks up the rest of the burden. Easier for bound-state problems. `<Term slug="coulomb-gauge" />`. ~180 words.
6. §6 **The choice doesn't matter (locally)** — SceneCard `GaugeTransformScene`. The observable physics — the force on a charge — is identical in every gauge. ~200 words.
7. §7 **Why physicists care anyway** — gauge invariance is the template for every fundamental force in the Standard Model. Preview of §12.1 gauge-theory-origins. ~120 words.

**Commit subject:** `feat(em/§07): gauge-freedom-and-potentials — the field can't see every change to the potential`

---

### Task 14: Topic `the-poynting-vector` (FIG.36, §07)

**Goal:** Where the energy in a field is flowing, right now. **S = (1/μ₀)·E×B.** Poynting's theorem: ∂u/∂t + ∇·S = −J·E. Energy flows perpendicular to both E and B. The surprising bits: a DC circuit's energy flows *through the space around the wire*, not inside it.

**Files:** lib `poynting.ts`, test, 3 scenes, topic folder.

- [ ] **Step 1: Physics lib**

```typescript
import type { Vec3 } from "@/lib/physics/electromagnetism/lorentz";
import { cross } from "@/lib/physics/electromagnetism/lorentz";
import { MU_0 } from "@/lib/physics/constants";

/** Poynting vector S = (1/μ₀)·E×B. */
export function poyntingVector(E: Vec3, B: Vec3): Vec3 {
  const c = cross(E, B);
  return { x: c.x / MU_0, y: c.y / MU_0, z: c.z / MU_0 };
}
/** Magnitude of S (power per area). */
export function poyntingMagnitude(E: Vec3, B: Vec3): number {
  const s = poyntingVector(E, B);
  return Math.hypot(s.x, s.y, s.z);
}
/** Intensity of a plane EM wave with amplitude E0 in vacuum: I = ½·(E0²/μ₀c). */
export function planeWaveIntensity(E0: number): number {
  const c = 1 / Math.sqrt((4 * Math.PI * 1e-7) * 8.854e-12); // or import from lorentz/constants
  return (E0 * E0) / (2 * MU_0 * c);
}
```

- [ ] **Step 2: Tests** — 5 cases: S is zero when E and B parallel, direction of S for E=x̂·E, B=ŷ·B should be +ẑ, magnitude correct for orthogonal E and B, plane-wave intensity sanity.

- [ ] **Step 3: Scenes**

- `poynting-flow-scene.tsx` — A plane EM wave (E in magenta, B in cyan), S (lilac) pointing in the propagation direction. Slider for E0. Shows perpendicularity.
- `coax-energy-flow-scene.tsx` — A DC coaxial cable cross-section. Center conductor + outer shield. E radial between them; B circumferential. S along the axis — meaning: the energy flows *through the insulator*, not inside the copper. The "it's always been outside the wire" reveal. Textbook-perfect EM misconception.
- `antenna-radiation-pattern-scene.tsx` — A dipole antenna with far-field S averaged over a cycle → classic doughnut pattern. `<Term slug="poynting-vector" />`.

- [ ] **Step 4-5: page.tsx + MDX (target 1150 words)**

1. §1 **Energy has to be going somewhere** — intuition from Session 3's §05.4 (energy density in B). If energy is stored in fields, and fields change, the energy must flow. ~180 words.
2. §2 **The derivation sketch** — Poynting's theorem from Maxwell: ∂u/∂t + ∇·S = −J·E. EQ.01. `<PhysicistLink slug="john-henry-poynting" />` 1884 paper. ~250 words.
3. §3 **S = (1/μ₀)·E×B** — EQ.02. SceneCard `PoyntingFlowScene`. Perpendicular to both fields. ~200 words.
4. §4 **The coax reveal** — SceneCard `CoaxEnergyFlowScene`. Energy flows through the *space between* the conductors. The copper is just the boundary condition. `<Term slug="poynting-theorem" />`. ~220 words.
5. §5 **Antenna radiation** — SceneCard `AntennaRadiationPatternScene`. Far-field averaged S gives the familiar lobes. ~150 words.
6. §6 **Where the formula comes in** — every laser intensity, every photodiode's light-to-power conversion, every solar cell. ~120 words.
7. §7 **The handoff to §07.5** — energy has a flow; momentum has a density. Next topic. ~60 words.

**Commit subject:** `feat(em/§07): the-poynting-vector — S=E×B/μ₀, and the energy that never touched the wire`

---

### Task 15: Topic `maxwell-stress-tensor` (FIG.37, §07)

**Goal:** Fields carry momentum — and push on what they touch. The stress tensor T_ij = ε₀(E_i E_j − ½δ_ij E²) + (1/μ₀)(B_i B_j − ½δ_ij B²). Field momentum density g = ε₀·E×B = S/c². Radiation pressure. Solar sails.

**Files:** lib `maxwell-stress.ts`, test, 3 scenes, topic folder.

- [ ] **Step 1: Physics lib**

```typescript
import type { Vec3 } from "@/lib/physics/electromagnetism/lorentz";
import { EPSILON_0, MU_0 } from "@/lib/physics/constants";

/** Maxwell stress tensor component T_ij at a point where E and B are given.
 *  Signature: (E, B, i, j) where i, j ∈ {0, 1, 2} for x, y, z. */
export function stressTensor(E: Vec3, B: Vec3, i: 0 | 1 | 2, j: 0 | 1 | 2): number {
  const e = [E.x, E.y, E.z] as const;
  const b = [B.x, B.y, B.z] as const;
  const E2 = e[0] * e[0] + e[1] * e[1] + e[2] * e[2];
  const B2 = b[0] * b[0] + b[1] * b[1] + b[2] * b[2];
  const delta = i === j ? 1 : 0;
  return EPSILON_0 * (e[i] * e[j] - 0.5 * delta * E2) + (1 / MU_0) * (b[i] * b[j] - 0.5 * delta * B2);
}
/** Field momentum density g = ε₀·(E×B). */
export function fieldMomentumDensity(E: Vec3, B: Vec3): Vec3 {
  const x = EPSILON_0 * (E.y * B.z - E.z * B.y);
  const y = EPSILON_0 * (E.z * B.x - E.x * B.z);
  const z = EPSILON_0 * (E.x * B.y - E.y * B.x);
  return { x, y, z };
}
/** Radiation pressure on a perfect absorber in a plane-wave intensity field. */
export function radiationPressureAbsorber(intensity: number): number {
  const c = 1 / Math.sqrt(MU_0 * EPSILON_0);
  return intensity / c;
}
/** Radiation pressure on a perfect reflector (doubles). */
export function radiationPressureReflector(intensity: number): number {
  return 2 * radiationPressureAbsorber(intensity);
}
```

- [ ] **Step 2: Tests** — 5 cases: diagonal vs off-diagonal components, trace of T (which is zero for pure-E in vacuum), momentum density direction is along S, radiation pressure on absorber vs reflector factor of 2.

- [ ] **Step 3: Scenes**

- `stress-tensor-faces-scene.tsx` — A cube. Field E uniform; the stress tensor rendered as arrows on each face showing the T_ij "force per area" interpretation (diagonal = normal stress, off-diagonal = shear). Slider for E direction.
- `field-pressure-scene.tsx` — A perfect mirror under laser illumination. Slider for intensity. Force on mirror plotted (P = 2I/c for a reflector). Scale readout in "micronewtons per square metre" for realism.
- `field-momentum-scene.tsx` — A plane wave packet travelling. Arrows for E, B, S, g. Shows g = S/c² and its alignment with S. `<Term slug="field-momentum" />`.

- [ ] **Step 4-5: page.tsx + MDX (target 1350 words)**

1. §1 **If fields carry energy, why not momentum?** — ~180 words.
2. §2 **The stress tensor** — EQ.01. Diagonal = pressure along a direction, off-diagonal = shear. `<Term slug="maxwell-stress-tensor" />`. ~250 words.
3. §3 **Field momentum density** — EQ.02 g = ε₀·E×B = S/c². SceneCard `FieldMomentumScene`. ~200 words.
4. §4 **Radiation pressure** — SceneCard `FieldPressureScene`. EQ.03 P = I/c (absorber), EQ.04 P = 2I/c (reflector). `<Term slug="radiation-pressure-term" />`. ~200 words.
5. §5 **Solar sails, IKAROS, and the Lebedev experiment** — JAXA's IKAROS (2010) was the first successful in-space demonstration. Lebedev's 1900 tabletop measurement of radiation pressure (a paddle wheel in a vacuum). ~200 words.
6. §6 **Field momentum in static cases** — the "hidden momentum" of a charge near a magnetic dipole. The stress tensor bookkeeps it exactly. ~170 words.
7. §7 **The unification you just earned** — between §07's five topics, electromagnetism is now a complete self-consistent field theory with energy, momentum, gauge freedom, and source unification. §08 turns the crank and gets light. ~150 words.

**Commit subject:** `feat(em/§07): maxwell-stress-tensor — field momentum, radiation pressure, solar sails`

---

## Wave 2.5 — Registry merge + publish + per-topic commit (serial, orchestrator)

The orchestrator runs this wave inline (no subagent) once all 12 Wave 2 agents have returned. For each of the 12 topics, in **this specific order** so the commit history reads §06 → §07:

1. `dc-circuits-and-kirchhoff`
2. `rc-circuits`
3. `rl-circuits`
4. `rlc-circuits-and-resonance`
5. `ac-circuits-and-phasors`
6. `transformers`
7. `transmission-lines`
8. `displacement-current`
9. `the-four-equations`
10. `gauge-freedom-and-potentials`
11. `the-poynting-vector`
12. `maxwell-stress-tensor`

### Task 16: For each topic, do the 4-step merge

- [ ] **Step 1: Append the agent's `registry` block to `lib/content/simulation-registry.ts`**

Insert the agent's returned import + entry block at the end of the `SIMULATION_REGISTRY` object (immediately before the closing `};`), mirroring the Session 3 sectioning:

```typescript
  // EM §06 — <slug>
  FooScene: lazyScene(() =>
    import("@/components/physics/foo-scene").then((m) => ({ default: m.FooScene })),
  ),
  BarScene: lazyScene(() =>
    import("@/components/physics/bar-scene").then((m) => ({ default: m.BarScene })),
  ),
  BazScene: lazyScene(() =>
    import("@/components/physics/baz-scene").then((m) => ({ default: m.BazScene })),
  ),
```

- [ ] **Step 2: Type-extension reconciliation (if any agent flagged `typeExtensionsNeeded`)**

If a §06 agent flagged a needed extension to `components/physics/circuit-canvas/types.ts`, now is the time to:
(a) Apply the extension to `types.ts`, being careful not to break the existing 7 agents' imports.
(b) Re-run the CircuitCanvas solver tests: `pnpm vitest run components/physics/circuit-canvas/solver.test.ts`.
(c) If the extension lands cleanly, commit it as a separate small `feat(physics): extend CircuitCanvas types for <reason>` commit **before** the topic commit that depended on it. This mirrors Session 2's biot-savart → lorentz reconciliation.
(d) If the extension would break existing tests → roll back, reach out to the agent to rethink.

Session 3 did not need this step. Session 4 is unlikely to need it either — the types.ts shipped in Wave 1.5 covers all §06 expected use cases (resistor/capacitor/inductor/switch/source/ground/meter/transformer-hook/transmission-line-hook). If it's needed, budget 1 extra commit.

- [ ] **Step 3: Publish the topic**

```bash
pnpm content:publish --only electromagnetism/<slug>
```

Confirm exactly one row was inserted/updated. If the CLI reports zero rows, the MDX has a parser-stopping error — open the MDX, check for unmatched JSX tags or unclosed code fences (especially given §07's heavy use of `∂`, `∮`, `\iint`, `\nabla\times`). The Wave 1.75 parser fix should have pre-empted this, but run a manual review if anything looks off.

- [ ] **Step 4: Commit**

```bash
git add lib/physics/electromagnetism/<topic>.ts \
  tests/physics/electromagnetism/<topic>.test.ts \
  components/physics/<scene-1>.tsx \
  components/physics/<scene-2>.tsx \
  components/physics/<scene-3>.tsx \
  lib/content/simulation-registry.ts \
  "app/[locale]/(topics)/electromagnetism/<slug>"
git commit -m "$(cat <<'EOF'
<commit-subject-from-agent>

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

After all 12 topics: 12 new commits on main (13 if a types.ts extension landed mid-wave).

---

## Wave 3 — Seed prose + finalize (serial, single subagent)

The CRITICAL cross-ref gotcha from §01–§05 still applies: `<PhysicistLink>` and `<Term>` resolve at render time against Supabase `content_entries`. Adding slugs to the TS arrays (Wave 1) gives structural metadata only — the cross-ref will throw `"Term: unknown slug"` or `"Physicist: unknown slug"` at render until the prose row is in Supabase.

### Task 17: Author and run `scripts/content/seed-em-04.ts`

**Files:**
- Create: `/Users/romanpochtman/Developer/physics/scripts/content/seed-em-04.ts`

- [ ] **Step 1: Mirror `seed-em-03.ts` structure**

Copy the pattern from `scripts/content/seed-em-03.ts`:
- Same imports (`dotenv/config`, `createHash`, `getServiceClient`).
- Same `PhysicistSeed` and `GlossarySeed` interfaces.
- Same `parseMajorWork` helper.
- Same `paragraphsToBlocks` helper (if present in seed-em-03).
- Same `main()` upserting to `content_entries` with `source_hash` deduplication.

Budget: ~800 lines. This is the longest seed script yet because 5 physicists × 3 paragraphs of bio + 30 glossary entries × 2-paragraph description is substantial.

- [ ] **Step 2: Author 5 physicist seeds**

For each of: `gustav-kirchhoff`, `georg-ohm`, `oliver-heaviside`, `james-clerk-maxwell`, `john-henry-poynting`. Required fields per `PhysicistSeed`:

- `slug`, `name`, `shortName`
- `born`, `died`, `nationality`
- `oneLiner` (≤ 200 chars, headline-grade)
- `bio` (3 paragraphs, ~400–500 words, voice = Kurzgesagt meets Stripe docs; historical hooks, no filler)
- `contributions` (5 bullet items)
- `majorWorks` (3 items in `Title (Year) — description` format)
- `relatedTopics` (matching what was added to `lib/content/physicists.ts` in Wave 1 Step 2)

Voice/depth reference: read `seed-em-03.ts` (Weiss, Kamerlingh Onnes, Lenz entries) — match that bar exactly. Each bio should be (a) accurate, (b) interesting, (c) standalone.

**Historical hooks (use as guides, embellish with accurate detail):**

- **Gustav Kirchhoff** (1824–1887): German physicist born in Königsberg, the son of a law counsellor. Formulated the node and loop laws in 1845 at age 21 as a doctoral student — in a single paper that solved the problem of currents in a network, a problem Ohm's law alone couldn't handle. Later co-invented spectroscopy with Bunsen in Heidelberg, discovered that the spectrum of a hot body depends only on its temperature (Kirchhoff's law of thermal radiation — the first crack in the classical-physics facade that quantum mechanics would later split wide open), and identified sodium, caesium, and rubidium in the sun's spectrum. The bridge from §06 Circuits to the future QUANTUM branch is specifically through Kirchhoff's black-body work, which Planck quantised in 1900. Walked with a limp from a railway accident and delivered his last lectures in a wheelchair; died in Berlin.

- **Georg Ohm** (1789–1854): Bavarian physicist, son of a self-educated locksmith who insisted his sons learn mathematics. Started his career as a schoolteacher in Cologne. In 1825–1827 he ran a series of careful experiments with voltaic piles and wires of precisely known lengths — using a torsion-balance galvanometer he built himself — and established the linear V = IR relation for metallic conductors. Published *Die galvanische Kette, mathematisch bearbeitet* (The Galvanic Circuit, Investigated Mathematically) in 1827. The book was received coldly: German physicists preferred "facts" over "mathematical speculation" at the time, and Ohm was forced to resign his schoolteaching post. He spent the next fifteen years in professional exile, scraping by on tutoring and private teaching. In 1841 the Royal Society of London awarded him the Copley Medal — the highest scientific honour in the world — and Ohm was finally restored to academic standing. He died professor of physics at Munich. The SI unit of resistance, ohm (Ω), is named in his honour. The story is a classic Kurzgesagt shape: obvious-in-hindsight idea, initially rejected, later vindicated. Use it.

- **Oliver Heaviside** (1850–1925): English electrical engineer, self-taught iconoclast, never held an academic post. Born in London to a wood-engraver father and a governess mother. Left school at 16 and worked as a telegrapher for the Great Northern Telegraph Company on cross-Channel cables. Taught himself Maxwell's *Treatise* (1873) in the evenings. By 1885 he had reduced Maxwell's original 20-equation quaternion formulation to the modern 4-equation vector form that every physics student learns today. He invented operational calculus (the precursor to Laplace transforms used in signal processing), the concept of impedance (1886), and the telegrapher's equations for transmission lines (1876–1892, building on William Thomson's cable work). Predicted the Heaviside–Kennelly ionospheric layer in 1902. Refused the Faraday Medal in 1922 because it came with a Royal Society fellowship offer that he considered too condescending at that late stage. Lived most of his life in poverty in Torquay, writing mathematical manuscripts in the margins of newspapers. Died 1925, alone, his landlady discovering the body. His work built the bridge from Maxwell's pre-vector-notation electrodynamics to the modern form used by every engineer. A Kurzgesagt-perfect subject for §06.7.

- **James Clerk Maxwell** (1831–1879): Scottish physicist, born in Edinburgh to a family of Glenlair (Kirkcudbrightshire) landed gentry. Solved Saturn's rings (proved mathematically that they must be a swarm of particles, not a solid disc) for his 1857 Adams Prize. Developed the kinetic theory of gases independently of Boltzmann, giving us the Maxwell–Boltzmann distribution. In 1865 published *A Dynamical Theory of the Electromagnetic Field* — 20 equations unifying electricity and magnetism and introducing the displacement-current term that made the whole system self-consistent. The paper derived the speed of electromagnetic waves from ε₀ and μ₀ and found it equal to the measured speed of light — one of the great deductive reveals in the history of science. In 1873 his *A Treatise on Electricity and Magnetism* compiled the full theory in book form. First professor at the new Cavendish Laboratory in Cambridge (1871). Died of stomach cancer in 1879 at age 48, the same age his mother had died of the same disease. He had already changed physics as thoroughly as Newton.

- **John Henry Poynting** (1852–1914): English physicist, the son of a Unitarian minister. Studied at Owens College in Manchester, then at Trinity College Cambridge, where he was Third Wrangler in 1876. Tutored by Maxwell. In 1884 he published *On the Transfer of Energy in the Electromagnetic Field* — the paper establishing that S = (1/μ₀)·E×B gives the direction and magnitude of energy flow in an electromagnetic field at every point. This closed the bookkeeping Maxwell's equations had opened: not only do fields carry energy, they carry it somewhere specific, and the Poynting vector tells you where. Spent his career at Mason College in Birmingham (later the University of Birmingham), where he also measured Newton's gravitational constant by the common-balance method (1891) and studied solar radiation pressure (the Poynting–Robertson effect on dust particles). The Poynting Medal of the University of Birmingham is named in his honour. Quiet, unflashy, underappreciated in his own time; his result underwrites every antenna, every optical fibre, every solar cell used today.

- [ ] **Step 3: Author ~30 glossary seeds**

For each glossary slug added in Wave 1 Step 4. Required fields per `GlossarySeed`:

- `slug`, `term`, `category`
- `shortDefinition` (1–2 sentences, ≤ 250 chars)
- `description` (2–3 paragraphs, ~250–400 words)
- `history` (optional, 1 paragraph, where there's a story)
- `relatedPhysicists`, `relatedTopics`

Voice/depth reference: `seed-em-03.ts` glossary entries. Same sharp-idea principle: pick one sharp thought per term, develop it fully; short definition if the term is utilitarian.

**Terms that have a sharp idea (full treatment):** ohms-law-term, kirchhoff-voltage-law, kirchhoff-current-law, rc-time-constant, rl-time-constant, quality-factor, phasor, impedance, transformer, characteristic-impedance, standing-wave-ratio, displacement-current, maxwell-equations-term, lorenz-gauge, coulomb-gauge, gauge-transformation, poynting-vector, poynting-theorem, maxwell-stress-tensor, field-momentum, radiation-pressure-term.

**Terms that are utilitarian (shorter treatment):** resistance, resistor, voltage-divider, capacitor-charging, reactance, ac-frequency, turns-ratio, transmission-line-term, back-reaction.

- [ ] **Step 4: Forward-reference placeholders**

Scan the 12 new MDX files for any `<Term slug="…">` or `<PhysicistLink slug="…">` whose slug is NOT in the 30-term list above AND NOT in the 5-physicist list AND NOT in any prior-session seed. Expected Session 4 forward-refs (verify at author time):

- `electromagnetic-wave` — §07.1 and §07.5 reference this; §08 topic. Add as placeholder with `shortDefinition: "A self-sustaining coupled oscillation of electric and magnetic fields propagating at c = 1/√(μ₀ε₀). Full treatment in §08 EM waves in vacuum."` and `description: "This is a placeholder. The topic covering electromagnetic waves in depth is electromagnetism/plane-waves-and-polarization; see §08 of the electromagnetism branch."`
- `larmor-formula` — §07.5 may mention radiation from an accelerating charge. §10.1 topic. Placeholder referring to §10.
- `scalar-potential` — §07.3 may use this as shorthand for V. If so and `electric-potential-term` covers it, can skip; otherwise add a tiny placeholder. Agent should have flagged in `forwardRefs`.
- Anything else flagged by Wave 2 agents in their `forwardRefs` handoff field.

For each forward-ref: add a `GlossarySeed` with a stub and a `// FORWARD-REF: full treatment in §0X` code comment.

Session 2 precedent: `fresnel-equations` was a single placeholder in commit `0e350ca`. If Session 4 adds multiple, they can all land in the same seed commit — no separate per-term commits needed.

- [ ] **Step 5: Run the seed script**

```bash
pnpm exec tsx --conditions=react-server scripts/content/seed-em-04.ts
```

Expected output: `✓ physicist <slug>` for 5 entries, `✓ glossary <slug>` for 30+ entries (30 planned + any forward-ref placeholders), `done`.

If any insert fails: read the error, fix the seed entry, re-run (upsert + source_hash makes it idempotent — no duplicate rows).

- [ ] **Step 6: Verify cross-refs resolve at render time**

```bash
pnpm dev &
DEV_PID=$!
sleep 8
for slug in dc-circuits-and-kirchhoff rc-circuits rl-circuits rlc-circuits-and-resonance ac-circuits-and-phasors transformers transmission-lines displacement-current the-four-equations gauge-freedom-and-potentials the-poynting-vector maxwell-stress-tensor; do
  echo "=== $slug ==="
  curl -s -o /dev/null -w "%{http_code}\n" http://localhost:3000/en/electromagnetism/$slug
done
kill $DEV_PID 2>/dev/null
wait $DEV_PID 2>/dev/null || true
```

Expected: `200` on all 12. Any `500` means a cross-ref is still unresolved — tail `dev`'s log, find the offending slug, add the missing seed, re-run.

- [ ] **Step 7: Commit the seed script**

```bash
git add scripts/content/seed-em-04.ts
git commit -m "$(cat <<'EOF'
fix(em/§06-§07): seed physicists + glossary prose into Supabase

PhysicistLink / Term components fetch from content_entries (kind='physicist'|
'glossary') at render time. The TS arrays in lib/content/{physicists,glossary}.ts
provide structural metadata only — without prose rows in Supabase, the cross-refs
throw "unknown slug" at render. Same gotcha as cc3fcbc (em/§01), 0e2a47d (em/§02-03),
and b9b3d5a (em/§04-05).

Adds 5 new physicist bios (Kirchhoff, Ohm, Heaviside, Maxwell, Poynting) and
~30 glossary terms covering DC/RC/RL/RLC/AC/transformers/transmission-lines
and displacement-current / four-equations / gauge / Poynting / stress-tensor.
Idempotent upsert via source_hash.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

### Task 18: Full build, spec update, session-end commit

**Files:**
- Modify: `docs/superpowers/specs/2026-04-22-electromagnetism-branch-design.md`

- [ ] **Step 1: Full build + test sweep**

```bash
pnpm tsc --noEmit
pnpm vitest run
pnpm build 2>&1 | tail -80
```

Expected: clean tsc; vitest green for all new tests AND the 3 formerly-failing tests (fixed in Wave 1.75). Build lists 12 new `/en/electromagnetism/<slug>` routes.

If the Wave 1.75 fixes landed, the pre-existing 3-failure backlog should be zero at this point. If a fix was deferred, the MemPalace log must call out the remaining failures explicitly.

- [ ] **Step 2: Branch-hub smoke test**

```bash
pnpm dev &
DEV_PID=$!
sleep 8
curl -s http://localhost:3000/en/electromagnetism | grep -cE 'FIG\.0[1-9]|FIG\.1[0-9]|FIG\.2[0-9]|FIG\.3[0-7]'
kill $DEV_PID 2>/dev/null
```

Expected: ≥ 37 (FIG.01 through FIG.37 should all appear).

- [ ] **Step 3: Update the spec progress table**

Open `docs/superpowers/specs/2026-04-22-electromagnetism-branch-design.md`. Update the **Module status** table:

```
| §06 Circuits | 7 | 7 | ☑ complete |
| §07 Maxwell's equations | 5 | 5 | ☑ complete |
```

Recompute the total row:

```
| **Total** | **66** | **37** | **56% complete** |
```

In the **Per-topic checklist** under §06 and §07, replace all 12 `- [ ]` with `- [x]`.

Update the document header status line:

```
**Status:** in progress — §01 shipped 2026-04-22; §02 + §03 shipped 2026-04-22; §04 + §05 shipped 2026-04-23; §06 + §07 shipped 2026-04-23
```

This is the **halfway milestone** — the branch has now crossed 50% complete.

- [ ] **Step 4: Commit the spec update**

```bash
git add docs/superpowers/specs/2026-04-22-electromagnetism-branch-design.md docs/superpowers/plans/2026-04-23-electromagnetism-session-4-circuits-maxwell.md
git commit -m "$(cat <<'EOF'
docs(em/§06-§07): mark circuits + maxwell modules complete — past halfway

All 12 topics in §06 + §07 shipped and reading from Supabase. Branch is now
37/66 topics (56% complete). The practical module and the unification module
both landed. CircuitCanvas primitive at components/physics/circuit-canvas/
is now the shared home for every circuit visualization — solver covers
DC/RC/RL/RLC/AC in one place.

The pre-existing 3-test backlog that had carried since §01 was triaged
in Wave 1.75 and is now zero (or documented if any fix was deferred).

Next session: §08 EM Waves in Vacuum (4 topics, FIG.38–41). Light falls out
of Maxwell, directly built on the §07.1 displacement-current reveal.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

- [ ] **Step 5: MemPalace implementation log**

Write `implementation_log_em_session_4_circuits_maxwell.md` to MemPalace (`wing=physics, room=decisions`) via `mempalace_kg_add`. Pattern match `implementation_log_em_session_3_magnetism_in_matter_induction.md`. Must cover:

- Summary of what shipped (12 topics, FIG.26–37, 37/66 = 56%).
- Wave-by-wave commit log (expected 17 commits; 18–19 with reconciliation).
- Any deviations (expected: forward-ref placeholders in Wave 3 Step 4, possible types.ts extension in Wave 2.5 Step 2).
- **What future sessions should know**, specifically:
  - Did the CircuitCanvas solver hold up across DC / RC / RL / RLC / AC modes? Any numerical-stability issues?
  - What's left for §06.6 transformers and §06.7 transmission-lines that the primitive's extension hooks didn't cover? Did the topic agents need the orchestrator to extend types.ts?
  - Did §07's equation-block density actually stress the parse-mdx parser after the Wave 1.75 fix? Any `∂`, `∮∮`, or `\nabla\times` patterns that still tripped it?
  - Is the pre-existing test-failure backlog now zero? Which of the three were fixed vs deferred?
  - Did any Wave 2 agent ship a 4th bonus scene? Which topic and what does it show?
  - Green-cyan induced-current + lilac displacement-current colour conventions — did they hold across all 12 topics?
  - Forward-ref slugs and which §08–§12 topics they point at.
- Next session's scope: §08 EM Waves in Vacuum (4 topics). Note the short-module advantage (can be tight and focused) and the importance of the derivation in §08.1 (wave equation falling out of Maxwell).
- Session 5 pre-wave work proposal: the `RayTraceCanvas` primitive for §09 (Open Question #5 in spec) is the natural analogue of Session 4's CircuitCanvas. Flag it as a mini-plan candidate before Session 6 (§09 Waves in matter).

- [ ] **Step 6: Report back to the user**

Single-paragraph summary plus a short list:
- All 12 topics live at `/en/electromagnetism/<slug>` (200 OK on all).
- CircuitCanvas primitive shipped at `components/physics/circuit-canvas/`.
- Pre-existing test-failure backlog: <status — zero / deferred with reason>.
- Build clean, tests green.
- Spec progress: 37/66 (56%) — past halfway.
- Commit count this session: **17** (baseline; 18–19 if reconciliation or forward-ref follow-ups).
- Next session: §08 EM Waves in Vacuum (4 topics) — ready to run. Flag the RayTraceCanvas primitive as Session 6 (§09 Optics) pre-wave work candidate.
- Any surprises, deviations, or forward-ref placeholders added.

---

## Definition of done

- All 12 §06 + §07 topic pages render `200` at `/en/electromagnetism/<slug>`.
- `pnpm build` clean. `pnpm vitest run` green for all new tests AND all 3 pre-existing tests that Wave 1.75 was supposed to fix. If any of the 3 were deferred with reasons, the log states which and why.
- CircuitCanvas primitive passes its own vitest suite (`pnpm vitest run components/physics/circuit-canvas/solver.test.ts`).
- New physicists + glossary terms have prose rows in `content_entries` (verified via Wave 3 Step 6 curl sweep).
- Spec progress table updated: §06 = 7/7, §07 = 5/5, total = 37/66 (56%).
- Per-wave commits land cleanly on main:
  - Wave 1 scaffolding (1 commit)
  - Wave 1.5 CircuitCanvas primitive (1 commit)
  - Wave 1.75 test triage (1 commit)
  - Wave 2.5 per-topic (12 commits)
  - Wave 3 seed (1 commit)
  - Wave 3 spec update (1 commit)
  - Optional Wave 2.5 type-reconciliation (0 or 1 extra commit)
  - Optional Wave 3 forward-ref follow-up (0 or 1 extra commit)
  - Total: **17 baseline, 18–19 with reconciliation/follow-ups**.
- MemPalace implementation log written.

---

## Risk notes

- **CRITICAL — physicist/glossary cross-refs blow up at render.** The §01–§05 gotcha, still active. Wave 3 Task 17 prevents recurrence. Don't skip it. Don't run Wave 2.5 commits and call the session done — the build will pass (TS doesn't know about Supabase row presence) but any `<PhysicistLink slug="gustav-kirchhoff">` will server-error until the seed runs.

- **CircuitCanvas primitive must ship with green tests before Wave 2 dispatches.** §06's 7 topic agents all depend on it. A red solver test in Wave 1.5 blocks everything downstream. If the solver turns out harder than expected (MNA edge cases, transient integrator stability), it is better to spend an extra hour tightening the primitive than to ship 7 topic agents against a shaky base.

- **The Wave 1.75 test triage has a critical secondary purpose: validating the parse-mdx parser against §07-style equation-block patterns BEFORE Wave 2 dispatches.** If the parser chokes on `∂`, `∮∮`, `\iint`, or `\nabla\times`, the §07 topic commits will silently produce zero-row Supabase publishes (the MDX parser errors get swallowed). Catch in Wave 1.75 with the /tmp smoke MDX; fix the parser, not the MDX. If a fix is genuinely hard, STOP — flag to user. The other 12 topics can still ship in a §06-only session, preserving the branch's momentum while the parser gets fixed in a separate session.

- **Registry conflicts under parallel agents.** Mitigated by the parallel-safety contract (agents return registry blocks; orchestrator merges serially in Wave 2.5). Same approach worked in §01 (7 agents), §02 (9), §03 (9). Session 4 is 12 — the largest parallel fan-out yet. If a subagent accidentally touches the registry file in its workspace, the orchestrator sees the merge conflict and asks the subagent to remove its edits.

- **The CircuitCanvas types-extension race.** Unlike Session 2's Vec3 pattern (where types were invented DURING Wave 2 by a sibling agent), Session 4's circuit types exist BEFORE Wave 2 starts. So agents MUST import canonical types and NOT ship local fallbacks. If an agent thinks a type needs extension, it STOPS and flags — orchestrator extends in Wave 2.5 Step 2. Diverging types is forbidden.

- **§06.6 transformers and §06.7 transmission-lines use primitive extension hooks, not full primitive features.** The CircuitCanvas solver's DC/transient/AC modes don't natively handle the distributed LC model of a transmission line or the coupled two-winding dynamics of a transformer. The topic agents add the last-mile behaviour in their own physics libs (`transformers.ts`, `transmission-lines.ts`). If a topic agent's scene needs to visualize something the primitive can't render, the agent can either (a) extend the primitive via Wave 2.5 Step 2, or (b) render the scene with raw Canvas 2D in the topic scene file (preferred for things like a standing-wave envelope that isn't really a circuit).

- **§07 voice — the unification is the payoff.** §07.1 (displacement current — the missing term) and §07.2 (the four equations together) are the emotional high point of the branch so far. The spec specifies 1400–1600 word targets for these two topics. Hit them. Don't rush the paradox collapse in §07.1. Don't undersell "light falls out of these four lines" in §07.2.

- **§06 voice — practical, not academic.** Engineers use §06 daily. Kurzgesagt meets Stripe docs with emphasis on "useful." §06.1 promises "two sentences that solve almost every schematic" — don't add a third sentence to sound smart. §06.5 owns the "rotation is the secret of every wall socket" metaphor — commit to it. §06.7 is where Heaviside's story earns full Kurzgesagt treatment — self-taught, iconoclast, never held an academic post.

- **Calculus Policy A discipline.** §07 is the densest vector-calc module of the branch. Plain-words gloss before every ∇×, ∇·, ∇, ∂/∂t, ∮, ∬ symbol. Re-read each draft asking: "if I'd never seen ∂ before, would I survive this paragraph?". If no, expand.

- **Scene colour-convention policy (extended).** Magenta/cyan/amber for voltage/current (carried from §01–§03). Green-cyan for induced EMF (carried from §05). **NEW: lilac `rgba(200,160,255,…)` for displacement current and field-energy density.** This lets readers distinguish conduction (amber), induction (green-cyan), and displacement (lilac) at a glance in §07 scenes. The three colours together form the full current-taxonomy visual vocabulary.

- **Right-hand-rule visuals.** Every §06 and §07 scene with a current or field direction needs a visible cue — axes badge (bottom-left corner), curl-arrow overlay, or both. The CircuitCanvas primitive has a `rightHandRule` prop for this; topic agents should enable it where relevant. Nonnegotiable floor, continued from §03 risk note.

- **Forward-ref placeholders.** Fresnel-equations was the precedent (Session 2). Session 4 likely forward-refs: `electromagnetic-wave` (→ §08), `larmor-formula` (→ §10 if §07.5 mentions it), `aharonov-bohm-effect` (→ §12 if §07.3 mentions it as a curiosity). Wave 3 Step 4 scans proactively; don't skip.

- **Halfway milestone awareness.** Session 4 crosses 50% for the first time (38% → 56%). The commit `docs(em/§06-§07): mark circuits + maxwell modules complete — past halfway` is the moment to celebrate internally and recalibrate scope. The remaining 29 topics are split across 5 modules (§08–§12). Session 4's 12-topic bundle is the high-water mark; remaining sessions can be smaller.

- **Pre-existing test failures after Wave 1.75.** If any of the 3 was deferred, the MemPalace log must explicitly call out which and why. "parse-mdx deferred because the parser needed a deeper rewrite than Wave 1.75's hour-budget allowed" is an acceptable outcome; silently shipping with red tests is not.

- **Seed-script idempotency.** `seed-em-03.ts` uses `upsert` + source_hash deduplication. `seed-em-04.ts` must do the same — re-running on the same data should be a no-op.

---

## Spec self-review — done

**Coverage:** Each of the 12 §06/§07 topics in the spec has a Wave 2 task (Tasks 4–15). Every spec section referenced: "Voice" (per-topic reminders + §06 and §07 voice blocks in shared instructions), "Calculus policy A" (shared instructions + per-topic reminders for §07), "Money-shot principle" (§06.5 phasors + §07.1 displacement-current both explicitly called out), "Integration checklist (per topic)" (per-topic substructure), "Dependency notes" (§06 independent, §07 requires §05 which is in place). Open Question #4 (CircuitCanvas) is resolved by Wave 1.5 Task 2; Open Question #5 (RayTraceCanvas) is flagged as Session 6 pre-wave work.

The CRITICAL cross-ref gotcha is addressed in Wave 3 Task 17. The CircuitCanvas types-race gotcha is addressed in the Wave 2 shared contract (item 5) and Wave 2.5 Step 2. The Session 3 log's flag about the parse-mdx parser before §07 is addressed in Wave 1.75 Step 3's critical-secondary-step MDX spot-check. The §06.5 ac-circuits-and-phasors money shot is specifically called out as synchronized rotating-phasor + oscilloscope-trace with a phase slider. The §07.1 displacement-current money shot is specifically called out as two-surface Ampère paradox with live morph and Maxwell-correction toggle — "the paradox collapses" delivery.

**Placeholder scan:** No "TBD", no "TODO" outside the `throw new Error("TODO — implement")` stubs in Wave 1.5 solver.ts (which the subagent will implement with MNA code — explicit, not placeholder), and the `TODO orchestrator: replace with import` Session-2 fallback comment (explicit convention carried over). All physics-lib functions have specified signatures and minimal test coverage. All sim components have specific behaviour descriptions with HUD callouts. No "implement later", no "Add error handling" without specifics.

**Type consistency:** Canonical types for §06 live in `components/physics/circuit-canvas/types.ts` (invented by Wave 1.5). `Vec3` from `@/lib/physics/electromagnetism/lorentz` (Session 2 precedent) is the canonical 3D-vector home for §07 topics that need it (Poynting, stress tensor). `Complex` invented inline in `ac-phasors.ts` (Task 8) — the only consumer is §06.5; do not promote. All physics-lib function signatures match between the physics-lib stubs and the test-file imports.

**File-path absolutes:** Every Create/Modify path is absolute or repo-relative without ambiguity.

**Module-existence sanity check:** `lib/content/branches.ts:343` defines `circuits` (index 6) and `:344` defines `maxwell` (index 7). Wave 1 Step 1's topic-`module` fields align. No module-list edit needed.

**Commit count consistency:** Wave-by-wave totals (1 + 1 + 1 + 12 + 1 + 1 = 17) match the Definition-of-done stated band (17 baseline, 18–19 with reconciliation/follow-ups).

**Voice consistency:** §06 is practical, §07 is unification. Per-topic prose outlines reinforce this split. §07.1 and §07.2 word targets are 1400–1600 (spec-honoured); §06 defaults are 1100–1400.

No issues found. Plan is ready to execute.
