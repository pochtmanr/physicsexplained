# EM Session 2 — §02 Electric Fields in Matter + §03 Magnetostatics Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship 9 topics — §02 Electric Fields in Matter (4 topics, FIG.08–11) and §03 Magnetostatics (5 topics, FIG.12–16). Each topic renders at `/en/electromagnetism/<slug>` with bespoke visualizations, vector-calculus prose under Calculus Policy A, and a physicist/glossary cross-reference graph that resolves at build time. After Session 2, the EM branch progress jumps from 7/66 (11%) to 16/66 (24%).

**Architecture:** Five waves. Wave 1 (serial, 1 agent) edits the data layer (branches.ts, physicists.ts, glossary.ts). Wave 1.5 (inline, orchestrator) extends `lib/physics/constants.ts` with magnetic SI constants. Wave 2 (9 parallel agents) authors the full per-topic vertical slice — physics lib + tests + scene components + page.tsx + content.en.mdx — but does NOT touch registries, does NOT publish, does NOT commit. Wave 2.5 (serial, orchestrator) merges registry entries + publishes + commits per topic (9 commits). Wave 3 (serial, orchestrator) writes `scripts/content/seed-em-02.ts` (the CRITICAL gotcha from §01) and runs it to seed prose for the new physicists + glossary terms into Supabase, then updates the spec progress table and ships the session-end commits.

**Tech Stack:** Next.js 15 (App Router), React 19, TypeScript strict, Tailwind v4, MDX (`@next/mdx`), Canvas 2D + JSXGraph for visualizations, Supabase `content_entries`, Vitest for physics-lib tests, KaTeX via rehype-katex.

**Spec:** `docs/superpowers/specs/2026-04-22-electromagnetism-branch-design.md` — read the §02 + §03 sections, "Voice, audience, and calculus policy", and "Integration checklist (per topic)" before starting.

**Prerequisite reading for subagents:**
1. `docs/superpowers/plans/2026-04-22-electromagnetism-session-1-electrostatics.md` — exact precedent for this plan's structure.
2. MemPalace: `mempalace search "EM Session 1" --wing physics` returns the implementation log `implementation_log_em_session_1_electrostatics.md`. Read it for the parallel-safety tweaks and the seed-script gotcha.
3. Any existing topic under `app/[locale]/(topics)/electromagnetism/` shows the voice, figure density, and section patterning to match.
4. `scripts/content/seed-em-01.ts` is the template for the seed script in Wave 3.

---

## File structure

### New files

**Physics libs (one per topic, pure TS + vitest, except where shared):**
- `lib/physics/electromagnetism/polarization.ts`
- `lib/physics/electromagnetism/dielectrics.ts`
- `lib/physics/electromagnetism/boundary-conditions.ts`
- `lib/physics/electromagnetism/piezo.ts`
- `lib/physics/electromagnetism/lorentz.ts`
- `lib/physics/electromagnetism/biot-savart.ts`
- `lib/physics/electromagnetism/ampere.ts`
- `lib/physics/electromagnetism/vector-potential.ts`
- `lib/physics/electromagnetism/magnetic-dipole.ts`
- `tests/physics/electromagnetism/polarization.test.ts`
- `tests/physics/electromagnetism/dielectrics.test.ts`
- `tests/physics/electromagnetism/boundary-conditions.test.ts`
- `tests/physics/electromagnetism/piezo.test.ts`
- `tests/physics/electromagnetism/lorentz.test.ts`
- `tests/physics/electromagnetism/biot-savart.test.ts`
- `tests/physics/electromagnetism/ampere.test.ts`
- `tests/physics/electromagnetism/vector-potential.test.ts`
- `tests/physics/electromagnetism/magnetic-dipole.test.ts`

> **Path note:** §01 used flat `lib/physics/coulomb.ts`. From §02 onward, nest under `lib/physics/electromagnetism/<topic>.ts` to keep the lib root tidy as the branch grows. CM topics keep their flat layout untouched. If the orchestrator finds this awkward at integration time, downgrade to flat — file count growth is the only argument for nesting.

**Simulation components (~27 total across the 9 topics):**

§02 Polarization and bound charges (FIG.08, money shot):
- `components/physics/dipole-alignment-scene.tsx` *(money shot)*
- `components/physics/bound-charge-density-scene.tsx`
- `components/physics/polarization-vs-field-scene.tsx`

§02 Dielectrics and the D field (FIG.09):
- `components/physics/d-field-free-charge-scene.tsx`
- `components/physics/dielectric-capacitor-scene.tsx`
- `components/physics/d-vs-e-difference-scene.tsx`

§02 Boundary conditions at interfaces (FIG.10):
- `components/physics/boundary-e-field-scene.tsx`
- `components/physics/boundary-d-field-scene.tsx`
- `components/physics/dielectric-refraction-scene.tsx`

§02 Piezo and ferroelectricity (FIG.11):
- `components/physics/piezo-crystal-scene.tsx`
- `components/physics/ferroelectric-hysteresis-scene.tsx`
- `components/physics/domain-switching-scene.tsx`

§03 Lorentz force (FIG.12, money shot):
- `components/physics/lorentz-trajectory-scene.tsx` *(money shot)*
- `components/physics/velocity-selector-scene.tsx`
- `components/physics/cyclotron-scene.tsx`

§03 Biot–Savart law (FIG.13):
- `components/physics/wire-segment-field-scene.tsx`
- `components/physics/loop-field-scene.tsx`
- `components/physics/straight-wire-field-scene.tsx`

§03 Ampère's law (FIG.14):
- `components/physics/ampere-loop-wire-scene.tsx`
- `components/physics/solenoid-field-scene.tsx`
- `components/physics/toroid-field-scene.tsx`

§03 Vector potential (FIG.15):
- `components/physics/vector-potential-scene.tsx`
- `components/physics/gauge-freedom-scene.tsx`
- `components/physics/a-source-current-scene.tsx`

§03 Magnetic dipoles (FIG.16):
- `components/physics/dipole-torque-scene.tsx`
- `components/physics/compass-scene.tsx`
- `components/physics/magnetic-dipole-field-scene.tsx`

(Subagents may adjust scene names or add 1 extra per topic if the prose demands it; prefer the list above as the floor.)

**Content pages (one folder per topic):**
- `app/[locale]/(topics)/electromagnetism/polarization-and-bound-charges/{page.tsx,content.en.mdx}`
- `app/[locale]/(topics)/electromagnetism/dielectrics-and-the-d-field/{page.tsx,content.en.mdx}`
- `app/[locale]/(topics)/electromagnetism/boundary-conditions-at-interfaces/{page.tsx,content.en.mdx}`
- `app/[locale]/(topics)/electromagnetism/piezo-and-ferroelectricity/{page.tsx,content.en.mdx}`
- `app/[locale]/(topics)/electromagnetism/the-lorentz-force/{page.tsx,content.en.mdx}`
- `app/[locale]/(topics)/electromagnetism/biot-savart-law/{page.tsx,content.en.mdx}`
- `app/[locale]/(topics)/electromagnetism/amperes-law/{page.tsx,content.en.mdx}`
- `app/[locale]/(topics)/electromagnetism/the-vector-potential/{page.tsx,content.en.mdx}`
- `app/[locale]/(topics)/electromagnetism/magnetic-dipoles/{page.tsx,content.en.mdx}`

**Seed script (Wave 3, the §01 gotcha):**
- `scripts/content/seed-em-02.ts`

### Modified files

- `lib/content/branches.ts` — append 9 new topic entries to `ELECTROMAGNETISM_TOPICS` (FIG.08–FIG.16). Module list itself is already complete from §01.
- `lib/content/physicists.ts` — add 6 new physicists: `pierre-curie`, `hans-christian-orsted`, `andre-marie-ampere`, `jean-baptiste-biot`, `felix-savart`, `hendrik-antoon-lorentz`. Append §02/§03 `relatedTopics` to existing entries where relevant (Faraday, Coulomb).
- `lib/content/glossary.ts` — add ~25 new terms (full list in Wave 1, Step 4).
- `lib/content/simulation-registry.ts` — register all 27 new sim components (orchestrator merges in Wave 2.5).
- `lib/physics/constants.ts` — add `MU_0`, `SPEED_OF_LIGHT`, `BOHR_MAGNETON` (Wave 1.5).
- `docs/superpowers/specs/2026-04-22-electromagnetism-branch-design.md` — check 9 boxes, update §02 row to 4/4, §03 row to 5/5, total to 16/66 (24%) (Wave 3).

---

## Wave 1 — Data layer (serial, single subagent)

### Task 1: Scaffold §02 + §03 in `branches.ts`, add physicists, add glossary terms

**Files:**
- Modify: `/Users/romanpochtman/Developer/physics/lib/content/branches.ts`
- Modify: `/Users/romanpochtman/Developer/physics/lib/content/physicists.ts`
- Modify: `/Users/romanpochtman/Developer/physics/lib/content/glossary.ts`

- [ ] **Step 1: Append 9 new topic entries to `ELECTROMAGNETISM_TOPICS`**

Open `lib/content/branches.ts`. Find the `ELECTROMAGNETISM_TOPICS` array (currently 7 entries from §01). Append 9 entries in this exact order, preserving the existing trailing-comma style:

```typescript
  {
    slug: "polarization-and-bound-charges",
    title: "POLARIZATION AND BOUND CHARGES",
    eyebrow: "FIG.08 · ELECTRIC FIELDS IN MATTER",
    subtitle: "What happens when the charges can't leave, but can lean.",
    readingMinutes: 12,
    status: "live",
    module: "fields-in-matter",
  },
  {
    slug: "dielectrics-and-the-d-field",
    title: "DIELECTRICS AND THE D FIELD",
    eyebrow: "FIG.09 · ELECTRIC FIELDS IN MATTER",
    subtitle: "The extra field that only notices what's free.",
    readingMinutes: 12,
    status: "live",
    module: "fields-in-matter",
  },
  {
    slug: "boundary-conditions-at-interfaces",
    title: "BOUNDARY CONDITIONS AT INTERFACES",
    eyebrow: "FIG.10 · ELECTRIC FIELDS IN MATTER",
    subtitle: "What the field must do when the material changes.",
    readingMinutes: 10,
    status: "live",
    module: "fields-in-matter",
  },
  {
    slug: "piezo-and-ferroelectricity",
    title: "PIEZOELECTRICITY AND FERROELECTRICITY",
    eyebrow: "FIG.11 · ELECTRIC FIELDS IN MATTER",
    subtitle: "The crystals that remember which way they've been pushed.",
    readingMinutes: 11,
    status: "live",
    module: "fields-in-matter",
  },
  {
    slug: "the-lorentz-force",
    title: "CURRENTS AND THE LORENTZ FORCE",
    eyebrow: "FIG.12 · MAGNETOSTATICS",
    subtitle: "Why a moving charge feels what a still one doesn't.",
    readingMinutes: 12,
    status: "live",
    module: "magnetostatics",
  },
  {
    slug: "biot-savart-law",
    title: "THE BIOT–SAVART LAW",
    eyebrow: "FIG.13 · MAGNETOSTATICS",
    subtitle: "The magnetic analogue of Coulomb, one current element at a time.",
    readingMinutes: 12,
    status: "live",
    module: "magnetostatics",
  },
  {
    slug: "amperes-law",
    title: "AMPÈRE'S LAW",
    eyebrow: "FIG.14 · MAGNETOSTATICS",
    subtitle: "The shortcut when the current walks a straight line.",
    readingMinutes: 12,
    status: "live",
    module: "magnetostatics",
  },
  {
    slug: "the-vector-potential",
    title: "THE VECTOR POTENTIAL",
    eyebrow: "FIG.15 · MAGNETOSTATICS",
    subtitle: "The field behind the field.",
    readingMinutes: 13,
    status: "live",
    module: "magnetostatics",
  },
  {
    slug: "magnetic-dipoles",
    title: "MAGNETIC DIPOLES AND TORQUE ON LOOPS",
    eyebrow: "FIG.16 · MAGNETOSTATICS",
    subtitle: "Why a compass turns, in the language of fields.",
    readingMinutes: 11,
    status: "live",
    module: "magnetostatics",
  },
```

- [ ] **Step 2: Add 6 new physicists to `PHYSICISTS`**

Open `lib/content/physicists.ts`. Confirm none of the 6 slugs below already exist (`grep -nE 'pierre-curie|hans-christian-orsted|andre-marie-ampere|jean-baptiste-biot|felix-savart|hendrik-antoon-lorentz' lib/content/physicists.ts` should return nothing). Then append entries matching the existing structural-only shape (slug + born + died + nationality + relatedTopics):

```typescript
  {
    slug: "pierre-curie",
    born: "1859",
    died: "1906",
    nationality: "French",
    image: storageUrl("physicists/pierre-curie.avif"),
    relatedTopics: [
      { branchSlug: "electromagnetism", topicSlug: "piezo-and-ferroelectricity" },
    ],
  },
  {
    slug: "hans-christian-orsted",
    born: "1777",
    died: "1851",
    nationality: "Danish",
    image: storageUrl("physicists/hans-christian-orsted.avif"),
    relatedTopics: [
      { branchSlug: "electromagnetism", topicSlug: "the-lorentz-force" },
      { branchSlug: "electromagnetism", topicSlug: "biot-savart-law" },
    ],
  },
  {
    slug: "andre-marie-ampere",
    born: "1775",
    died: "1836",
    nationality: "French",
    image: storageUrl("physicists/andre-marie-ampere.avif"),
    relatedTopics: [
      { branchSlug: "electromagnetism", topicSlug: "amperes-law" },
      { branchSlug: "electromagnetism", topicSlug: "biot-savart-law" },
    ],
  },
  {
    slug: "jean-baptiste-biot",
    born: "1774",
    died: "1862",
    nationality: "French",
    image: storageUrl("physicists/jean-baptiste-biot.avif"),
    relatedTopics: [
      { branchSlug: "electromagnetism", topicSlug: "biot-savart-law" },
    ],
  },
  {
    slug: "felix-savart",
    born: "1791",
    died: "1841",
    nationality: "French",
    image: storageUrl("physicists/felix-savart.avif"),
    relatedTopics: [
      { branchSlug: "electromagnetism", topicSlug: "biot-savart-law" },
    ],
  },
  {
    slug: "hendrik-antoon-lorentz",
    born: "1853",
    died: "1928",
    nationality: "Dutch",
    image: storageUrl("physicists/hendrik-antoon-lorentz.avif"),
    relatedTopics: [
      { branchSlug: "electromagnetism", topicSlug: "the-lorentz-force" },
    ],
  },
```

> **Image fallback:** if the storage bucket doesn't yet have the AVIF for one of these physicists, the `<PhysicistLink>` component falls back to a placeholder. Don't pre-upload — the orchestrator can sync images in a follow-up. Structural entry is enough for cross-ref resolution.

- [ ] **Step 3: Append §02/§03 `relatedTopics` to existing physicists**

Find these existing entries in `PHYSICISTS` and append the new related topic refs to their `relatedTopics` arrays (don't replace — append):

- `michael-faraday` (line ~743): add `{ branchSlug: "electromagnetism", topicSlug: "the-vector-potential" }` (Faraday introduced the field language A makes precise).
- `simeon-denis-poisson` (line ~528): add `{ branchSlug: "electromagnetism", topicSlug: "the-vector-potential" }` (Poisson's equation also governs A).

- [ ] **Step 4: Add ~25 new glossary terms to `GLOSSARY`**

Open `lib/content/glossary.ts`. For each of the following slugs, confirm absence (`grep -nE 'polarization|dielectric-term|permittivity|displacement-field|...' lib/content/glossary.ts`) then append entries matching the existing structural-only shape (slug + category + relatedPhysicists + relatedTopics):

§02 terms:
- `polarization` (concept) — relatedTopics: polarization-and-bound-charges
- `polarization-density` (concept) — relatedTopics: polarization-and-bound-charges
- `bound-charge` (concept) — relatedTopics: polarization-and-bound-charges
- `electric-susceptibility` (concept) — relatedTopics: dielectrics-and-the-d-field
- `dielectric-term` (concept) — relatedTopics: dielectrics-and-the-d-field. Note `-term` suffix to avoid collision with any future module slug.
- `permittivity` (concept) — relatedTopics: dielectrics-and-the-d-field
- `dielectric-constant` (concept) — relatedTopics: dielectrics-and-the-d-field
- `displacement-field` (concept) — relatedTopics: dielectrics-and-the-d-field
- `boundary-conditions-em` (concept) — relatedTopics: boundary-conditions-at-interfaces. Note `-em` suffix to leave room for general-purpose `boundary-conditions` later.
- `piezoelectricity` (phenomenon) — relatedTopics: piezo-and-ferroelectricity, relatedPhysicists: pierre-curie
- `ferroelectricity` (phenomenon) — relatedTopics: piezo-and-ferroelectricity

§03 terms:
- `lorentz-force` (concept) — relatedTopics: the-lorentz-force, relatedPhysicists: hendrik-antoon-lorentz
- `magnetic-field` (concept) — relatedTopics: the-lorentz-force, biot-savart-law
- `tesla-unit` (unit) — relatedTopics: the-lorentz-force
- `current-density` (concept) — relatedTopics: biot-savart-law, amperes-law
- `biot-savart-law-term` (concept) — relatedTopics: biot-savart-law, relatedPhysicists: jean-baptiste-biot, felix-savart
- `ampere-unit` (unit) — relatedTopics: amperes-law, relatedPhysicists: andre-marie-ampere
- `amperes-law-term` (concept) — relatedTopics: amperes-law, relatedPhysicists: andre-marie-ampere
- `solenoid` (instrument) — relatedTopics: amperes-law
- `toroid` (instrument) — relatedTopics: amperes-law
- `vector-potential` (concept) — relatedTopics: the-vector-potential
- `gauge-transformation` (concept) — relatedTopics: the-vector-potential
- `magnetic-dipole-term` (concept) — relatedTopics: magnetic-dipoles. Note `-term` suffix.
- `magnetic-moment` (concept) — relatedTopics: magnetic-dipoles
- `weber-unit` (unit) — relatedTopics: magnetic-dipoles
- `curl` (concept) — relatedTopics: amperes-law, the-vector-potential

> **Slug-collision policy carried over from §01:** any glossary term whose name would collide with a topic slug gets a `-term` suffix (e.g. `dielectric-term`, `magnetic-dipole-term`). Same as `electric-potential-term` and `capacitance-term` from Session 1.

- [ ] **Step 5: Verify with tsc and tests**

```bash
pnpm tsc --noEmit
pnpm vitest run tests/content/
```

Expected: clean. The 3 pre-existing test failures noted in the §01 implementation log (turbulence, parse-mdx golden, references env-var) are NOT new — verify by stashing your changes and re-running once if anything looks suspicious.

- [ ] **Step 6: Commit**

```bash
git add lib/content/branches.ts lib/content/physicists.ts lib/content/glossary.ts
git commit -m "$(cat <<'EOF'
feat(em/§02-§03): scaffold fields-in-matter + magnetostatics, physicists, glossary

Adds 9 new topic entries to ELECTROMAGNETISM_TOPICS (FIG.08–FIG.16).
Adds Pierre Curie, Ørsted, Ampère, Biot, Savart, Lorentz to PHYSICISTS
(structural only — prose seeded via scripts/content/seed-em-02.ts in Wave 3).
Adds 25 §02/§03 glossary terms (structural only). Appends EM relatedTopics
to existing Faraday and Poisson entries.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Wave 1.5 — EM SI constants (inline, orchestrator)

The §01 implementation log shows that EM SI constants were added separately from Wave 1 so all parallel Wave 2 agents could import them safely. Repeat the pattern for magnetic constants.

### Task 1.5: Extend `lib/physics/constants.ts` with magnetic SI constants

**Files:**
- Modify: `/Users/romanpochtman/Developer/physics/lib/physics/constants.ts`

- [ ] **Step 1: Append constants**

Append to the end of `lib/physics/constants.ts`:

```typescript
/** Vacuum permeability, H/m (CODATA 2018) */
export const MU_0 = 1.25663706212e-6;

/** Speed of light in vacuum, m/s (exact, SI 2019 redefinition) */
export const SPEED_OF_LIGHT = 2.99792458e8;

/** Bohr magneton, J/T (CODATA 2018) — used by magnetic-dipole topic */
export const BOHR_MAGNETON = 9.2740100783e-24;
```

- [ ] **Step 2: Verify**

```bash
pnpm tsc --noEmit
```

Expected: clean.

- [ ] **Step 3: Commit**

```bash
git add lib/physics/constants.ts
git commit -m "feat(physics): add magnetic SI constants (μ₀, c, Bohr magneton)

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

## Wave 2 — Per-topic authoring (9 parallel subagents)

Each task below is a complete vertical slice. A subagent can complete any one task independently once Wave 1 + Wave 1.5 have landed.

### Shared instructions for every Wave 2 task — READ FIRST

This is the parallel-safety contract from the §01 implementation log:

1. **DO NOT touch `lib/content/simulation-registry.ts`.** The orchestrator merges all registry entries serially in Wave 2.5.
2. **DO NOT touch `components/physics/visualization-registry.tsx`.** The §01 log confirmed it's only used for glossary tile previews; Session 2 doesn't need entries there either.
3. **DO NOT run `pnpm content:publish`.** Orchestrator publishes serially in Wave 2.5.
4. **DO NOT commit.** Orchestrator commits per-topic in Wave 2.5.
5. **Return** (in the agent's final message) a structured block listing:
   - The exact import + registry-entry block to insert into `lib/content/simulation-registry.ts` (mirror the §01 pattern at lines 322–398).
   - The full content slug (e.g. `electromagnetism/the-lorentz-force`) for `pnpm content:publish --only`.
   - A 1-line commit subject (e.g. `feat(em/§03): the-lorentz-force — Lorentz force, cyclotron, velocity selector`).

Substructure for every per-topic task:

1. **Physics lib** (`lib/physics/electromagnetism/<topic>.ts`) — pure TS, no React. Imports from `@/lib/physics/constants`. May reuse `Charge` and `Vec2` from `@/lib/physics/coulomb` (the §01 log confirmed they're shared types now).
2. **Physics tests** (`tests/physics/electromagnetism/<topic>.test.ts`) — vitest. Aim for 3–6 test cases per topic with at least one known-value case per exported function.
3. **Simulation components** (`components/physics/<name>-scene.tsx`) — `"use client"` named exports, Canvas 2D animation loop via `requestAnimationFrame`, dark canvas, font-mono HUD. Color palette: magenta `#FF6ADE` for + charges, cyan for − / accents, amber `#FFD66B` for resultant vectors, blue-cyan `rgba(120,220,255,…)` for B-field arrows. Match `pendulum-scene.tsx` for the canonical pattern.
4. **Content page** (`app/[locale]/(topics)/electromagnetism/<slug>/page.tsx`) — copy verbatim from `app/[locale]/(topics)/electromagnetism/coulombs-law/page.tsx` (a §01 sibling, already on the Supabase-reading pattern), changing only the `SLUG` constant to `electromagnetism/<topic-slug>`.
5. **MDX content** (`content.en.mdx`) — compose from `<TopicPageLayout aside={[...]}>`, `<TopicHeader>`, numbered `<Section number="N" title="…">`s, `<SceneCard component="…" props={{…}}>` wrappers, `<EquationBlock id="EQ.0X" tex="…">`s, `<Callout variant="intuition|math|warning">`s, inline `<PhysicistLink slug="…" />` and `<Term slug="…" />` cross-refs. Target word count: 1100–1400 per topic (the §01 median was 1265). Use at least one `<PhysicistLink>` and one `<Term>` per topic. Aside arrays should hold 3–5 entries.

**Voice reminder (Calculus Policy A):** every topic that uses ∮ / ∇× / ∇· / ∇ / ∫dℓ / ∫dA must explain the symbol **in plain words first, in-context, before the equation form**. The aside link to `/dictionary/<slug>` is a "go deeper" anchor, not the explanation. The reader who lands here from search must finish the topic without depending on any other topic.

**Cross-ref discipline:** only use `<PhysicistLink slug="…">` for slugs that are present in `PHYSICISTS` after Wave 1. For Session 2 that means: any §01 physicist (Coulomb, Franklin, Gauss, Faraday, Poisson) plus the 6 new ones (Curie, Ørsted, Ampère, Biot, Savart, Lorentz). Anyone else gets a plain-text mention. Same rule as §01.

---

### Task 2: Topic `polarization-and-bound-charges` (FIG.08, §02 money shot)

**Goal:** the dielectric idea — atoms can stretch but not migrate. Bound surface and volume charges as the visible signature of a polarized medium. Where the bound-charge formulas σ_b = P·n̂ and ρ_b = −∇·P come from.

**Files:**
- Create: `lib/physics/electromagnetism/polarization.ts`
- Create: `tests/physics/electromagnetism/polarization.test.ts`
- Create: `components/physics/dipole-alignment-scene.tsx` *(money shot)*
- Create: `components/physics/bound-charge-density-scene.tsx`
- Create: `components/physics/polarization-vs-field-scene.tsx`
- Create: `app/[locale]/(topics)/electromagnetism/polarization-and-bound-charges/page.tsx`
- Create: `app/[locale]/(topics)/electromagnetism/polarization-and-bound-charges/content.en.mdx`

- [ ] **Step 1: Write `lib/physics/electromagnetism/polarization.ts`**

```typescript
import { EPSILON_0 } from "@/lib/physics/constants";

/** Polarization density for a linear dielectric: P = ε₀ χ E. */
export function linearPolarization(E: number, susceptibility: number): number {
  return EPSILON_0 * susceptibility * E;
}

/** Surface bound charge density on a face whose outward normal makes angle θ with P (radians). */
export function surfaceBoundCharge(P: number, theta: number): number {
  return P * Math.cos(theta);
}

/**
 * Saturation model: P approaches P_sat as E grows.
 * P(E) = P_sat * tanh(ε₀ χ E / P_sat). Matches linear regime for small E.
 */
export function saturatingPolarization(E: number, susceptibility: number, pSat: number): number {
  const linear = EPSILON_0 * susceptibility * E;
  return pSat * Math.tanh(linear / pSat);
}
```

- [ ] **Step 2: Write `tests/physics/electromagnetism/polarization.test.ts`**

```typescript
import { describe, expect, it } from "vitest";
import {
  linearPolarization,
  surfaceBoundCharge,
  saturatingPolarization,
} from "@/lib/physics/electromagnetism/polarization";
import { EPSILON_0 } from "@/lib/physics/constants";

describe("linearPolarization", () => {
  it("scales with susceptibility and E", () => {
    expect(linearPolarization(1e6, 0.5)).toBeCloseTo(EPSILON_0 * 0.5 * 1e6, 18);
  });
  it("returns zero for zero field", () => {
    expect(linearPolarization(0, 5)).toBe(0);
  });
});

describe("surfaceBoundCharge", () => {
  it("equals P on a face whose normal is parallel to P", () => {
    expect(surfaceBoundCharge(2.5, 0)).toBeCloseTo(2.5, 10);
  });
  it("equals -P on a face whose normal is antiparallel to P", () => {
    expect(surfaceBoundCharge(2.5, Math.PI)).toBeCloseTo(-2.5, 10);
  });
  it("equals zero on a side face (perpendicular to P)", () => {
    expect(surfaceBoundCharge(2.5, Math.PI / 2)).toBeCloseTo(0, 10);
  });
});

describe("saturatingPolarization", () => {
  it("approaches P_sat for very large E", () => {
    expect(saturatingPolarization(1e30, 1, 1e-3)).toBeCloseTo(1e-3, 10);
  });
  it("matches linear regime for tiny E", () => {
    const E = 1e-5;
    const chi = 2;
    const pSat = 1;
    expect(saturatingPolarization(E, chi, pSat)).toBeCloseTo(EPSILON_0 * chi * E, 18);
  });
});
```

- [ ] **Step 3: Write the 3 simulation components**

`dipole-alignment-scene.tsx` *(money shot)* — a slab of dielectric drawn between two capacitor plates. A 6×3 lattice of small dipole arrows. Slider for applied E (or auto-ramp). At E=0, dipoles point random; as E ramps, dipoles rotate to align. Bound surface charge appears on the slab faces (red on the side facing the negative plate, blue on the side facing the positive plate) — proportional to the projection of P on each face normal. HUD: applied field, polarization magnitude, surface bound charge density.

`bound-charge-density-scene.tsx` — a 2D dielectric block with a non-uniform polarization P(x,y) drawn as little arrows of varying length. Color overlay shows ρ_b = −∇·P pixel-by-pixel: red where divergent, blue where convergent. Useful for "bound charge appears where the polarization changes."

`polarization-vs-field-scene.tsx` — P(E) curve. Two modes: linear (straight line through origin) and saturating (tanh approaching P_sat). Slider for susceptibility. Reader sees that linear behavior is the small-field approximation.

- [ ] **Step 4: Write `page.tsx`**

Copy `app/[locale]/(topics)/electromagnetism/coulombs-law/page.tsx` and change only the `SLUG` constant:

```typescript
const SLUG = "electromagnetism/polarization-and-bound-charges";
```

- [ ] **Step 5: Write `content.en.mdx`**

Outline:
1. **§1 The dielectric idea** — atoms have positive nuclei and negative electron clouds; they can shift, but not separate. Distinct from conductors. ~180 words.
2. **§2 Polarization, in plain words** — P is a vector field measuring how much "electric leaning" is in the material per unit volume. Units: C/m². EQ.01: P = (dipole moment) / (volume). ~200 words.
3. **§3 Bound surface charge — the money shot** — SceneCard `DipoleAlignmentScene`. Explain why the alignment leaves a thin strip of uncancelled charge at each face. EQ.02: σ_b = P·n̂. ~250 words.
4. **§4 Bound volume charge** — when P is non-uniform, dipoles in adjacent slices don't fully cancel. SceneCard `BoundChargeDensityScene`. EQ.03: ρ_b = −∇·P. Plain-words gloss for divergence — link to /dictionary/divergence as aside, not as substitute. ~200 words.
5. **§5 Linear dielectrics** — most everyday materials: P linear in E. EQ.04: P = ε₀χE. SceneCard `PolarizationVsFieldScene`. χ values: water ≈ 79, glass ≈ 4. ~180 words.
6. **§6 Where it shows up** — capacitors filled with mica/ceramic/water; biological membranes; dielectric measurements as a probe of molecular structure. ~150 words.

Aside:
- physicist: Faraday (introduced "specific inductive capacity" — the modern κ)
- term: polarization, polarization-density, bound-charge, divergence (existing §01 term)

Commit subject (return to orchestrator): `feat(em/§02): polarization-and-bound-charges — bound charges, P field, dielectric leaning`

---

### Task 3: Topic `dielectrics-and-the-d-field` (FIG.09)

**Goal:** the D field as the bookkeeper that only sees free charges. Why ∇·D = ρ_free is cleaner than ∇·E = ρ_total. Capacitance gain by a factor of κ when a dielectric fills the gap.

**Files:**
- Create: `lib/physics/electromagnetism/dielectrics.ts`, `tests/physics/electromagnetism/dielectrics.test.ts`
- Create: `components/physics/d-field-free-charge-scene.tsx`
- Create: `components/physics/dielectric-capacitor-scene.tsx`
- Create: `components/physics/d-vs-e-difference-scene.tsx`
- Create: topic folder + page.tsx + content.en.mdx

- [ ] **Step 1–5 per shared structure.**

Physics lib: export `displacementField(E: number, P: number): number` returning `ε₀E + P`. Export `capacitanceWithDielectric(C0: number, kappa: number)` returning `kappa * C0`. Export `dielectricBreakdownField(material: 'air' | 'glass' | 'mica' | 'water'): number` returning typical breakdown E in V/m (air 3e6, glass 1e7, mica 1.2e8, water 7e7 — pedagogical typical values, document as approximate).

Tests: D = ε₀E in vacuum (P=0); inserting κ=4 dielectric quadruples C; breakdown values monotonic.

Sim components:
- `d-field-free-charge-scene.tsx` — point free charge inside a sphere of dielectric. D-field lines (drawn in amber) ignore the dielectric boundary; E-field lines (cyan) bend at the boundary. Reader toggles between displays.
- `dielectric-capacitor-scene.tsx` — parallel-plate capacitor with a slab of dielectric being slid in/out. Slider for κ (1 = vacuum, up to 80 for water). Live readout of C and stored energy at fixed Q (energy drops as κ rises — the dielectric is pulled into the capacitor) vs at fixed V (energy rises). Reader sees the difference.
- `d-vs-e-difference-scene.tsx` — two horizontal panels showing the same parallel-plate setup. Top: E vector grid, with E inside dielectric reduced by 1/κ relative to vacuum sides. Bottom: D vector grid, identical inside and outside. The visual punchline.

Prose outline:
1. **§1 The accounting problem** — Gauss's law in a dielectric mixes free and bound charge. Ugly. ~150 words.
2. **§2 The D field** — define D = ε₀E + P. EQ.01. The "free-charge field" — only free charges source it. EQ.02: ∇·D = ρ_free. Plain-words gloss. ~250 words.
3. **§3 The point-charge example** — SceneCard `DFieldFreeChargeScene`. Same point charge, two fields. ~200 words.
4. **§4 Capacitor with a dielectric** — SceneCard `DielectricCapacitorScene`. κ as a multiplier. EQ.03: C = κC₀. ~250 words.
5. **§5 E vs D — what they tell you** — SceneCard `DVsEDifferenceScene`. E = force per unit charge (the physical thing); D = source-tracker (the bookkeeping convenience). ~200 words.
6. **§6 Where it shows up** — capacitors with high-κ ceramic dielectrics (Y5V, X7R nomenclature in electronics); dielectric mirrors; microwave engineering. ~150 words.

Aside: Faraday, dielectric-term, permittivity, displacement-field, electric-susceptibility.

Commit subject: `feat(em/§02): dielectrics-and-the-d-field — D field, κ, free vs bound`

---

### Task 4: Topic `boundary-conditions-at-interfaces` (FIG.10)

**Goal:** what happens to E and D at a material boundary. Tangential E continuous; normal E jumps by free σ/ε₀. Tangential D jumps by free σ; normal D continuous (when no free surface charge). Optical refraction is the wave version of these statics rules — link forward to optics module.

**Files:**
- Create: `lib/physics/electromagnetism/boundary-conditions.ts`, `tests/physics/electromagnetism/boundary-conditions.test.ts`
- Create: `components/physics/boundary-e-field-scene.tsx`
- Create: `components/physics/boundary-d-field-scene.tsx`
- Create: `components/physics/dielectric-refraction-scene.tsx`
- Create: topic folder

- [ ] **Step 1–5 per shared structure.**

Physics lib: `tangentialEContinuity(E1_tan: number)` returning `E1_tan` (identity — pedagogical). `normalEJump(E1_normal: number, sigmaFree: number, kappa1: number, kappa2: number)` returning E_2 normal value satisfying κ₁ε₀E₁_n − κ₂ε₀E₂_n = σ_free. `dielectricRefraction(theta1: number, kappa1: number, kappa2: number)` returning the bending angle of a field line crossing the interface (analogue of Snell's law for static fields: tan θ₂ / tan θ₁ = κ₂ / κ₁).

Tests: continuity identities; symmetric refraction at equal κ; correct sign of normal-E jump for given σ.

Sim components:
- `boundary-e-field-scene.tsx` — horizontal interface between two dielectrics (κ₁ above, κ₂ below). E-field arrows on each side. Slider for σ_free at the interface. Tangential components match across; normal components jump.
- `boundary-d-field-scene.tsx` — same setup but D-field arrows. Normal D matches across (when σ_free = 0); tangential D differs by the κ ratio.
- `dielectric-refraction-scene.tsx` — single field line crossing an interface; bending angle obeys the static analogue of Snell. Slider for κ₁/κ₂ ratio. The "field lines refract" reveal.

Prose outline:
1. **§1 Why interfaces are special** — bulk equations don't tell you what happens at a surface. ~150 words.
2. **§2 The pillbox argument** — SceneCard `BoundaryEFieldScene`. Apply Gauss's law to a flat box straddling the interface, take height to zero. Get the normal-E jump. ~250 words.
3. **§3 The loop argument** — apply ∮E·dℓ = 0 to a thin rectangle straddling the interface. Get the tangential-E continuity. ~200 words.
4. **§4 D's version** — SceneCard `BoundaryDFieldScene`. Same arguments using D and ρ_free; cleaner because bound charges drop out. ~200 words.
5. **§5 Field-line refraction** — SceneCard `DielectricRefractionScene`. Lines bend toward the normal in the higher-κ material. Forward-link to `/electromagnetism/fresnel-equations` (future §09 topic). ~200 words.
6. **§6 Where it matters** — designing capacitors with multi-layer dielectrics; antenna design; understanding why optical fibers work (§09 preview). ~150 words.

Aside: boundary-conditions-em, displacement-field, permittivity.

Commit subject: `feat(em/§02): boundary-conditions-at-interfaces — what fields do at a material boundary`

---

### Task 5: Topic `piezo-and-ferroelectricity` (FIG.11)

**Goal:** materials whose response to fields involves memory. Piezo: deformation ↔ polarization. Ferroelectricity: hysteresis loop in P vs E. Real-world hooks: quartz watches, ultrasound transducers, capacitor RAM.

**Files:**
- Create: `lib/physics/electromagnetism/piezo.ts`, `tests/physics/electromagnetism/piezo.test.ts`
- Create: `components/physics/piezo-crystal-scene.tsx`
- Create: `components/physics/ferroelectric-hysteresis-scene.tsx`
- Create: `components/physics/domain-switching-scene.tsx`
- Create: topic folder

- [ ] **Step 1–5 per shared structure.**

Physics lib: `directPiezoEffect(stress: number, d33: number)` returning charge per area `Q/A = d33 * stress` (d33 ≈ 2.3e-12 C/N for quartz). `inversePiezoEffect(voltage: number, d33: number, thickness: number)` returning strain δ/L. `ferroelectricHysteresis(E: number, history: { previousE: number; previousP: number }, params: { Esat: number; Psat: number; Ecoercive: number })` — simple branched model returning current P given input field and previous state. Use a smooth tanh-based switching curve.

Tests: direct effect linear in stress; inverse effect symmetric to direct; hysteresis: starting at +saturation, going to E=0 keeps P near +Psat (remanent); going to -Ecoercive crosses zero; loop closes after a full cycle.

Sim components:
- `piezo-crystal-scene.tsx` — quartz lattice (simplified hexagonal cell). Slider for applied compression. Lattice deforms; surface charge appears on top/bottom. Toggle inverse: apply voltage, lattice elongates.
- `ferroelectric-hysteresis-scene.tsx` — P vs E curve with a swept E (auto-ramping back and forth). Trace draws the hysteresis loop. Coercive field marker; remanent polarization marker.
- `domain-switching-scene.tsx` — 2D mosaic of ferroelectric domains (each cell a + or − arrow). As applied E sweeps, individual cells flip (one by one for high noise threshold; en masse for low threshold). Reader watches the macroscopic P emerge from microscopic flips.

Prose outline:
1. **§1 Crystals with a memory** — most dielectrics forget the field once it's gone. Some don't. ~150 words.
2. **§2 The direct piezoelectric effect** — squeeze a crystal, get a voltage. SceneCard `PiezoCrystalScene`. EQ.01: D = d·σ_stress + ε·E. ~250 words.
3. **§3 The inverse effect** — apply a voltage, get a strain. Same equation, different terms dominating. Quartz watches: drive a quartz crystal at 32768 Hz; it vibrates exactly that fast forever. ~200 words.
4. **§4 Ferroelectricity** — domains and hysteresis. SceneCard `FerroelectricHysteresisScene`. Coercive field, remanent polarization. ~250 words.
5. **§5 Domains in a ferroelectric** — SceneCard `DomainSwitchingScene`. Microscopic flips averaging to a macroscopic loop. ~200 words.
6. **§6 Where it shows up** — quartz oscillators in every clock and computer; piezoelectric ultrasound (medical imaging, sonar); FRAM (ferroelectric RAM); MEMS accelerometers. ~150 words.

Aside: Pierre Curie (discovered piezoelectricity with brother Jacques in 1880), piezoelectricity, ferroelectricity, polarization.

Commit subject: `feat(em/§02): piezo-and-ferroelectricity — crystals with memory, hysteresis, domains`

---

### Task 6: Topic `the-lorentz-force` (FIG.12, §03 money shot)

**Goal:** the magnetic force is velocity-dependent. F = qv × B. Three signature trajectories: pure circle (v ⊥ B), helix (v has a parallel component), cycloid (E + B perpendicular). Charged particle motion in E+B is the thing every cyclotron, mass spectrometer, and aurora exploits.

**Files:**
- Create: `lib/physics/electromagnetism/lorentz.ts`, `tests/physics/electromagnetism/lorentz.test.ts`
- Create: `components/physics/lorentz-trajectory-scene.tsx` *(money shot)*
- Create: `components/physics/velocity-selector-scene.tsx`
- Create: `components/physics/cyclotron-scene.tsx`
- Create: topic folder

- [ ] **Step 1–5 per shared structure.**

Physics lib: define `Vec3 = { x: number; y: number; z: number }`. Export `cross(a: Vec3, b: Vec3): Vec3`. Export `lorentzForce(q: number, v: Vec3, E: Vec3, B: Vec3): Vec3` returning `q(E + v×B)`. Export `cyclotronRadius(m: number, v_perp: number, q: number, B: number): number` returning `m·v_perp / (|q|·B)`. Export `cyclotronFrequency(q: number, B: number, m: number): number` returning `|q|·B / m` (in rad/s; period T = 2π/ω is independent of v).

Tests: cross-product identity for unit vectors; force perpendicular to v in pure-B field; cyclotron radius scales correctly; frequency independent of v.

Sim components:
- `lorentz-trajectory-scene.tsx` *(money shot)* — three trajectories on the same canvas, color-coded:
  - Cyan: pure circle (v ⊥ B, no E)
  - Magenta: helix (v has a B-parallel component)
  - Amber: cycloid (B + perpendicular E)
  Drawn live, leaving traces. Sliders for v, B, E magnitudes. The "F = qv×B does all this" reveal.
- `velocity-selector-scene.tsx` — perpendicular E and B (E down, B into page). Particles enter from the left at various speeds. Particles with v = E/B go straight; others curve. Used in mass spectrometers.
- `cyclotron-scene.tsx` — particle in uniform B circling at fixed period. Twin "dees" with alternating voltage accelerate the particle each half-orbit. Reader watches the spiral grow as energy increases — but the period stays the same. The "isochrony" punchline.

Prose outline:
1. **§1 A magnetic field that does nothing** — a stationary charge feels no force from a B field. ~150 words.
2. **§2 Set it moving** — F = qv × B. Plain-words gloss for the cross product before EQ.01. SceneCard `LorentzTrajectoryScene`. ~300 words.
3. **§3 Three trajectories** — pure circle, helix, cycloid. The same equation, three behaviors depending on initial velocity and ambient E. ~250 words.
4. **§4 Cyclotron motion** — EQ.02: r = mv/(qB), EQ.03: T = 2πm/(qB). Period independent of v! SceneCard `CyclotronScene`. ~250 words.
5. **§5 Velocity selectors and mass spectrometers** — SceneCard `VelocitySelectorScene`. Practical use of crossed E + B. ~200 words.
6. **§6 Where it shows up** — auroras (charged particles in Earth's B field), particle accelerators (cyclotrons, synchrotrons), mass spectrometry, MRI machines (Larmor frequency). ~200 words.

Aside: Lorentz, Ørsted (the original "current makes magnetism" discovery), lorentz-force, magnetic-field, tesla-unit.

Commit subject: `feat(em/§03): the-lorentz-force — F=qv×B, cyclotron, velocity selector`

---

### Task 7: Topic `biot-savart-law` (FIG.13)

**Goal:** the magnetic analogue of Coulomb's law. Each tiny current element contributes a magnetic field at every point in space, and we sum (or integrate) over all elements. Worked examples: long straight wire (B = μ₀I/(2πr)), circular loop on axis, finite segment.

**Files:**
- Create: `lib/physics/electromagnetism/biot-savart.ts`, `tests/physics/electromagnetism/biot-savart.test.ts`
- Create: `components/physics/wire-segment-field-scene.tsx`
- Create: `components/physics/loop-field-scene.tsx`
- Create: `components/physics/straight-wire-field-scene.tsx`
- Create: topic folder

- [ ] **Step 1–5 per shared structure.**

Physics lib: import `Vec3` from `@/lib/physics/electromagnetism/lorentz`. Export `biotSavartElement(I: number, dl: Vec3, r: Vec3): Vec3` returning `μ₀I/(4π) · dl × r̂ / r²`. Export `straightWireField(I: number, distance: number): number` returning `μ₀I/(2π·d)`. Export `loopAxisField(I: number, R: number, z: number): number` returning `μ₀I·R²/(2(R² + z²)^(3/2))`. Export `finiteSegmentField(I: number, d: number, theta1: number, theta2: number): number` returning `μ₀I(sin θ₂ − sin θ₁)/(4π·d)`.

Tests: long wire formula matches finite-segment formula in the limit θ₁ → −π/2, θ₂ → π/2; loop-axis formula peaks at z=0 and falls as 1/z³ at large z; field magnitudes match known SI values.

Sim components:
- `wire-segment-field-scene.tsx` — single straight current segment. Hover the cursor anywhere; live readout of dB direction (right-hand rule). Each contribution shown as a small arrow. The integration intuition.
- `loop-field-scene.tsx` — circular current loop drawn in 3D-ish projection. B field on axis (above and below), curling around. Slider for loop radius and current; live readout of axial B at a chosen z.
- `straight-wire-field-scene.tsx` — vertical current-carrying wire. B-field rings drawn perpendicular to the wire. Slider for current. Right-hand-rule visual cue.

Prose outline:
1. **§1 The magnetic Coulomb's law** — set up the parallel: each charge sources E; each current element sources B. ~200 words.
2. **§2 Biot–Savart** — EQ.01: dB = μ₀I/(4π) · (dl × r̂)/r². Plain-words gloss for the cross product (already introduced in Lorentz topic — repeat here for standalone-ness). SceneCard `WireSegmentFieldScene`. ~300 words.
3. **§3 The long straight wire** — derive EQ.02: B = μ₀I/(2π·d). SceneCard `StraightWireFieldScene`. ~250 words.
4. **§4 The circular loop** — EQ.03: B(z) = μ₀IR²/(2(R²+z²)^(3/2)). SceneCard `LoopFieldScene`. ~250 words.
5. **§5 Where it falls short** — non-trivial geometries need numerics. Hint that Ampère's law (next topic) can be a shortcut when symmetry is present. ~150 words.
6. **§6 Where it shows up** — Helmholtz coils, MRI gradient coils, transformer windings, electromagnets. ~150 words.

Aside: Biot, Savart, Ampère, biot-savart-law-term, current-density.

Commit subject: `feat(em/§03): biot-savart-law — magnetic field from current elements`

---

### Task 8: Topic `amperes-law` (FIG.14)

**Goal:** the magnetic Gauss's law: ∮B·dℓ = μ₀I_enc. Solves the high-symmetry cases instantly: long wire, solenoid, toroid. The first time the reader meets ∇× outside a glossary aside.

**Files:**
- Create: `lib/physics/electromagnetism/ampere.ts`, `tests/physics/electromagnetism/ampere.test.ts`
- Create: `components/physics/ampere-loop-wire-scene.tsx`
- Create: `components/physics/solenoid-field-scene.tsx`
- Create: `components/physics/toroid-field-scene.tsx`
- Create: topic folder

- [ ] **Step 1–5 per shared structure.**

Physics lib: export `solenoidField(n: number, I: number): number` returning `μ₀·n·I` (n = turns per metre). Export `toroidField(N: number, I: number, r: number): number` returning `μ₀·N·I/(2π·r)` (N = total turns). Export `wireFieldByAmpere(I: number, r: number): number` returning `μ₀I/(2π·r)` (the same answer Biot–Savart gave; pedagogical confirmation).

Tests: solenoid + 1000 turns/m + 1A → 1.257 mT (roughly μ₀·1000); toroid concentric circles give 1/r dependence; wire by Ampère = wire by Biot–Savart for any (I, r).

Sim components:
- `ampere-loop-wire-scene.tsx` — straight wire, draggable Amperian loop (initially circle; can morph to square, irregular). Live readout of ∮B·dℓ = μ₀I_enc, showing it doesn't depend on the loop's shape so long as the wire is enclosed.
- `solenoid-field-scene.tsx` — solenoid cross-section. Field lines uniform inside, near-zero outside. Slider for n and I. Highlight the Amperian rectangle straddling the wall.
- `toroid-field-scene.tsx` — toroid in 3D-ish view; circular Amperian loops at varying r show 1/r decay. Field zero outside the toroid.

Prose outline:
1. **§1 The shortcut Coulomb couldn't give** — Biot–Savart works always, but is painful when the geometry is symmetric. ~200 words.
2. **§2 Ampère's law** — EQ.01: ∮B·dℓ = μ₀I_enc. Plain-words gloss for the line integral (link to /dictionary/line-integral as aside) and for "current enclosed." ~300 words.
3. **§3 The long wire revisited** — SceneCard `AmpereLoopWireScene`. Two lines of derivation give B = μ₀I/(2π·r). Confirms Biot–Savart's answer. ~200 words.
4. **§4 The solenoid** — SceneCard `SolenoidFieldScene`. EQ.02: B = μ₀·n·I inside; ≈ 0 outside. ~250 words.
5. **§5 The toroid** — SceneCard `ToroidFieldScene`. EQ.03: B = μ₀·N·I/(2π·r). ~200 words.
6. **§6 Differential form preview** — ∇×B = μ₀J. Plain-words gloss for the curl operator (link to /dictionary/curl). Promise that displacement current will fix this in §07. ~200 words.
7. **§7 Where it shows up** — electromagnets, transformers, MRI main coils, plasma confinement (toroidal tokamaks). ~150 words.

Aside: Ampère, amperes-law-term, ampere-unit, solenoid, toroid, curl.

Commit subject: `feat(em/§03): amperes-law — ∮B·dℓ = μ₀I_enc, solenoid, toroid`

---

### Task 9: Topic `the-vector-potential` (FIG.15)

**Goal:** A is to B as V is to E. Definition B = ∇×A, gauge freedom, Coulomb gauge ∇·A = 0. The Aharonov–Bohm preview: A may be physically real where B = 0. Ground for §07 Maxwell + §11 Lagrangian formulation.

**Files:**
- Create: `lib/physics/electromagnetism/vector-potential.ts`, `tests/physics/electromagnetism/vector-potential.test.ts`
- Create: `components/physics/vector-potential-scene.tsx`
- Create: `components/physics/gauge-freedom-scene.tsx`
- Create: `components/physics/a-source-current-scene.tsx`
- Create: topic folder

- [ ] **Step 1–5 per shared structure.**

Physics lib: export `aFromInfiniteWire(I: number, distance: number): number` returning `−(μ₀I)/(2π) · ln(d/d_ref)` (d_ref is a reference distance; in 2D the integral diverges so a reference is mandatory — document this). Export `aFromSolenoid(B_inside: number, R: number, r: number): number` — inside the solenoid (r < R), A_φ = B·r/2; outside (r > R), A_φ = B·R²/(2r). Export `gaugeShift(A: { x: number; y: number; z: number }, gradF: { x: number; y: number; z: number }): { x: number; y: number; z: number }` returning the new A after `A → A + ∇f`.

Tests: B from a circulating A_φ around a solenoid recovers B = uniform inside, zero outside; gauge shift changes A but ∇×A is invariant.

Sim components:
- `vector-potential-scene.tsx` — circular A-field around a solenoid. Reader sees A non-zero outside the solenoid (where B = 0). The Aharonov–Bohm setup, foreshadowing §12.
- `gauge-freedom-scene.tsx` — toggle button shifts A by ∇f for several choices of f (constant, linear gradient, quadratic). The drawn A field looks completely different. Live overlay of B = ∇×A — unchanged.
- `a-source-current-scene.tsx` — straight wire current J in the centre. A field drawn parallel to J (axial). Falls off logarithmically. Compare side-by-side to V from a straight line of charge — same Poisson equation, different source.

Prose outline:
1. **§1 Why bother** — every B field can be written as the curl of something. That something is the vector potential A. ~200 words.
2. **§2 B = ∇×A** — EQ.01. Plain-words gloss for curl (already introduced in Ampère; restated). ~250 words.
3. **§3 Gauge freedom** — A → A + ∇f leaves B unchanged. SceneCard `GaugeFreedomScene`. EQ.02. ~250 words.
4. **§4 The Coulomb gauge** — pick ∇·A = 0. Now A satisfies Poisson's equation: ∇²A = −μ₀J, exactly like V satisfies ∇²V = −ρ/ε₀. SceneCard `ASourceCurrentScene`. ~250 words.
5. **§5 A around a solenoid** — SceneCard `VectorPotentialScene`. The "A is non-zero where B is zero" reveal. Tease Aharonov–Bohm (§12). ~250 words.
6. **§6 Why this matters** — A is the natural object in the Lagrangian (§11), in QED, and in superconductivity. The Aharonov–Bohm effect (§12) shows A can be physically real even where B vanishes. ~200 words.

Aside: Faraday, Poisson, vector-potential, gauge-transformation, curl.

Commit subject: `feat(em/§03): the-vector-potential — A as the field behind B, gauge freedom`

---

### Task 10: Topic `magnetic-dipoles` (FIG.16)

**Goal:** a current loop is the magnetic analogue of an electric dipole. Magnetic moment m = IA·n̂. Torque τ = m × B aligns the loop. Far-field B looks like the electric dipole picture, with B ∝ 1/r³. This is what makes a compass turn.

**Files:**
- Create: `lib/physics/electromagnetism/magnetic-dipole.ts`, `tests/physics/electromagnetism/magnetic-dipole.test.ts`
- Create: `components/physics/dipole-torque-scene.tsx`
- Create: `components/physics/compass-scene.tsx`
- Create: `components/physics/magnetic-dipole-field-scene.tsx`
- Create: topic folder

- [ ] **Step 1–5 per shared structure.**

Physics lib: export `magneticMoment(I: number, A: number): number` returning `I·A`. Export `dipoleTorque(m: number, B: number, theta: number): number` returning `m·B·sin θ`. Export `dipoleEnergy(m: number, B: number, theta: number): number` returning `−m·B·cos θ`. Export `dipoleFieldOnAxis(m: number, z: number): number` returning `(μ₀/4π) · 2m/z³`. Export `dipoleFieldEquatorial(m: number, r: number): number` returning `(μ₀/4π) · m/r³`.

Tests: torque zero when m parallel to B; torque maximum when perpendicular; on-axis vs equatorial differ by factor of 2; energy minimum when aligned.

Sim components:
- `dipole-torque-scene.tsx` — square current loop in uniform B. Slider for orientation θ. Torque arrow grows with sin θ; loop wants to rotate to θ=0. Energy bowl plotted alongside.
- `compass-scene.tsx` — compass needle (a permanent magnet idealised as a dipole) above a current-carrying wire. As the wire's current toggles, the needle deflects. Reproduces Ørsted's 1820 experiment.
- `magnetic-dipole-field-scene.tsx` — far-field B pattern of a current loop. Field lines look like Earth's. Slider for view distance. Reader sees the 1/r³ falloff.

Prose outline:
1. **§1 A loop is a magnet** — carry a current around a loop; the loop has a north and a south. ~200 words.
2. **§2 Magnetic moment** — EQ.01: m = I·A·n̂. Plain words first, then the equation. Units: A·m². ~250 words.
3. **§3 Torque on a loop in a field** — EQ.02: τ = m × B. SceneCard `DipoleTorqueScene`. The loop swings to align m with B. ~250 words.
4. **§4 Energy of a dipole** — EQ.03: U = −m·B. Aligned = minimum energy. ~200 words.
5. **§5 The compass** — SceneCard `CompassScene`. Ørsted's discovery in one animation. ~200 words.
6. **§6 The far-field pattern** — SceneCard `MagneticDipoleFieldScene`. Looks like an electric dipole's pattern with E → B. EQ.04, EQ.05. ~200 words.
7. **§7 Where it shows up** — compasses, MRI (proton magnetic moment), electric motors (continuous torque), Earth's geodynamo, magnetic storage. ~150 words.

Aside: Ørsted, Ampère, magnetic-dipole-term, magnetic-moment, weber-unit.

Commit subject: `feat(em/§03): magnetic-dipoles — m = IA, torque, far-field pattern`

---

## Wave 2.5 — Registry merge + publish + per-topic commit (serial, orchestrator)

The orchestrator runs this wave inline (no subagent) once all 9 Wave 2 agents have returned. For each of the 9 topics, in any order:

### Task 11: For each topic, do the 3-step merge

- [ ] **Step 1: Append the agent's registry block to `lib/content/simulation-registry.ts`**

Insert the agent's returned import + entry block at the end of the SIMULATION_REGISTRY map, mirroring the §01 sectioning (e.g. `// EM §02 — polarization-and-bound-charges`, `// EM §03 — the-lorentz-force`).

- [ ] **Step 2: Publish the topic**

```bash
pnpm content:publish --only electromagnetism/<slug>
```

Confirm exactly one row was inserted/updated.

- [ ] **Step 3: Commit**

```bash
git add lib/physics/electromagnetism/<topic>.ts \
  tests/physics/electromagnetism/<topic>.test.ts \
  components/physics/<scene-1>.tsx \
  components/physics/<scene-2>.tsx \
  components/physics/<scene-3>.tsx \
  lib/content/simulation-registry.ts \
  app/\[locale\]/\(topics\)/electromagnetism/<slug>
git commit -m "<commit-subject-from-agent>

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

After all 9 topics: 9 new commits on main.

---

## Wave 3 — Seed prose + finalize (serial, single subagent)

This wave covers the **CRITICAL gotcha from §01** (cc3fcbc): `<PhysicistLink>` and `<Term>` resolve at render-time against Supabase `content_entries` (kind='physicist'|'glossary'). Adding slugs to the TS arrays gives structural metadata only — the cross-ref will throw "unknown slug" at render time until the prose row is in Supabase.

### Task 12: Author and run `scripts/content/seed-em-02.ts`

**Files:**
- Create: `/Users/romanpochtman/Developer/physics/scripts/content/seed-em-02.ts`

- [ ] **Step 1: Mirror `seed-em-01.ts` structure**

Copy the pattern from `scripts/content/seed-em-01.ts`:
- Same imports (`dotenv/config`, `createHash`, `getServiceClient`).
- Same `PhysicistSeed` and `GlossarySeed` interfaces.
- Same `parseMajorWork` helper.
- Same `paragraphsToBlocks` helper.
- Same `main()` upserting to `content_entries` with `source_hash` deduplication.

- [ ] **Step 2: Author 6 physicist seeds**

For each of: `pierre-curie`, `hans-christian-orsted`, `andre-marie-ampere`, `jean-baptiste-biot`, `felix-savart`, `hendrik-antoon-lorentz`. Required fields per `PhysicistSeed`:

- `slug`, `name`, `shortName`
- `born`, `died`, `nationality`
- `oneLiner` (≤ 200 chars, headline-grade)
- `bio` (3 paragraphs, ~400–500 words, voice = Kurzgesagt meets Stripe docs; historical hooks, no filler)
- `contributions` (5 bullet items)
- `majorWorks` (3 items in `Title (Year) — description` format)
- `relatedTopics` (matching what was added to `lib/content/physicists.ts` in Wave 1, Step 2)

Voice/depth reference: read the Coulomb / Franklin / Gauss / Faraday entries in `seed-em-01.ts` lines 38–159 — match that bar exactly. Each bio should be (a) accurate, (b) interesting, (c) standalone (a reader meeting Lorentz for the first time should leave understanding why he matters).

Key historical hooks to include (these are guides, not scripts — embellish with accurate detail):
- **Pierre Curie**: piezo discovery with brother Jacques (1880), Curie temperature for ferromagnetism, marriage to Marie, radium and polonium, killed by a horse-drawn cart in 1906.
- **Ørsted**: 1820 lecture demonstration where a current-carrying wire deflected a compass — the first time anyone connected electricity and magnetism. Founded the unified field of electromagnetism in a single afternoon.
- **Ampère**: heard about Ørsted's experiment in September 1820; produced the Biot–Savart-comparable mathematical theory by November 1820. The two-month sprint that founded electrodynamics.
- **Biot & Savart**: collaborated immediately after Ørsted's announcement; Biot was the senior figure (already famous for atmospheric polarisation). Their "law" was actually proposed at the Académie a few weeks before Ampère's full theory.
- **Lorentz**: dominant theoretical physicist of the late 19th century. Unified Maxwell's macroscopic equations with discrete electrons. Lorentz transformations (1895) that Einstein later promoted to a principle. Nobel Prize 1902 (with Zeeman) for the Zeeman effect. Calmly handed his life's work over to Einstein's relativity.

- [ ] **Step 3: Author ~25 glossary seeds**

For each glossary slug added in Wave 1 Step 4. Required fields per `GlossarySeed`:

- `slug`, `term`, `category`
- `shortDefinition` (1–2 sentences, ≤ 250 chars)
- `description` (2–3 paragraphs, ~250–400 words)
- `history` (optional, 1 paragraph, where there's a story to tell)
- `relatedPhysicists`, `relatedTopics`

Voice/depth reference: lines 161–428 of `seed-em-01.ts` — match exactly.

> **Boring vs interesting:** the goal is not encyclopedic completeness. It is the depth of a one-page explainer that someone could screenshot. Pick one sharp idea per term, develop it fully. If a term doesn't have a sharp idea, give it a 1-paragraph definition and move on — but most of these (Lorentz force, vector potential, gauge transformation, ferroelectricity) genuinely have a story.

- [ ] **Step 4: Run the seed script**

```bash
pnpm exec tsx --conditions=react-server scripts/content/seed-em-02.ts
```

Expected output: `✓ physicist <slug>` for 6 entries, `✓ glossary <slug>` for ~25 entries, `done`.

If any insert fails: read the error, fix the seed entry, re-run (the upsert + source_hash makes it idempotent — no duplicate rows).

- [ ] **Step 5: Verify cross-refs resolve**

Quickest check: `pnpm dev`, hit each topic URL, confirm no "unknown physicist slug" or "unknown term slug" errors in the browser console or server logs:

```bash
pnpm dev &
sleep 5
for slug in polarization-and-bound-charges dielectrics-and-the-d-field boundary-conditions-at-interfaces piezo-and-ferroelectricity the-lorentz-force biot-savart-law amperes-law the-vector-potential magnetic-dipoles; do
  echo "=== $slug ==="
  curl -s -o /dev/null -w "%{http_code}\n" http://localhost:3000/en/electromagnetism/$slug
done
kill %1 2>/dev/null
```

Expected: `200` on all 9. If any returns 500, check server logs for the offending slug and add the seed.

- [ ] **Step 6: Commit the seed script**

```bash
git add scripts/content/seed-em-02.ts
git commit -m "$(cat <<'EOF'
fix(em/§02-§03): seed physicists + glossary prose into Supabase

PhysicistLink / Term components fetch from content_entries (kind='physicist'|
'glossary') at render time. The TS arrays in lib/content/{physicists,glossary}.ts
provide structural metadata only — without prose rows in Supabase, the cross-refs
throw "unknown slug" at render. Same gotcha as cc3fcbc (em/§01).

Adds 6 new physicist bios (Curie, Ørsted, Ampère, Biot, Savart, Lorentz) and
~25 glossary terms covering polarization/dielectrics/boundary-conditions plus
all magnetostatics terminology.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

### Task 13: Full build, spec update, session-end commit

**Files:**
- Modify: `docs/superpowers/specs/2026-04-22-electromagnetism-branch-design.md`

- [ ] **Step 1: Full build + test sweep**

```bash
pnpm tsc --noEmit
pnpm vitest run
pnpm build 2>&1 | tail -50
```

Expected: clean tsc; vitest passes for all new tests (the 3 pre-existing failures from §01 may still be present and are NOT this session's responsibility); build lists 9 new `/en/electromagnetism/<slug>` routes.

- [ ] **Step 2: Spot-check each topic URL (re-run if Wave 3 Step 5 was skipped)**

```bash
pnpm dev &
sleep 5
for slug in polarization-and-bound-charges dielectrics-and-the-d-field boundary-conditions-at-interfaces piezo-and-ferroelectricity the-lorentz-force biot-savart-law amperes-law the-vector-potential magnetic-dipoles; do
  echo "=== $slug ==="
  curl -s -o /dev/null -w "%{http_code}\n" http://localhost:3000/en/electromagnetism/$slug
done
kill %1 2>/dev/null
```

Expected: `200` on all 9.

- [ ] **Step 3: Check the branch hub**

```bash
curl -s http://localhost:3000/en/electromagnetism | grep -c "FIG.0\|FIG.1"
```

Expected: ≥ 16 (FIG.01–FIG.16 should now all appear).

- [ ] **Step 4: Update the spec progress table**

Open `docs/superpowers/specs/2026-04-22-electromagnetism-branch-design.md`. Update the **Module status** table:

| §02 Electric fields in matter | 4 | 4 | ☑ complete |
| §03 Magnetostatics | 5 | 5 | ☑ complete |

Recompute the total row:

| **Total** | **66** | **16** | **24% complete** |

In the **Per-topic checklist** under §02 and §03, replace all 9 `- [ ]` with `- [x]`.

Update the document header status line:

`**Status:** in progress — §01 shipped 2026-04-22; §02 + §03 shipped 2026-04-22`

- [ ] **Step 5: Commit**

```bash
git add docs/superpowers/specs/2026-04-22-electromagnetism-branch-design.md
git commit -m "$(cat <<'EOF'
docs(em/§02-§03): mark fields-in-matter + magnetostatics modules complete

All 9 topics in §02 + §03 shipped and reading from Supabase. Branch is now
16/66 topics (24% complete). Next session: §04 + §05 (9 topics).

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

- [ ] **Step 6: MemPalace log**

Write an implementation log to MemPalace documenting what shipped, any deviations from this plan, and anything future sessions should know (especially anything that emerged about the `lib/physics/electromagnetism/` nested-vs-flat layout choice; the magnetic-constants pattern; whether the seed-script approach scales). Use `mempalace_kg_add` or write directly under `wing=physics, room=decisions`. Pattern match `implementation_log_em_session_1_electrostatics.md`.

- [ ] **Step 7: Report back**

Report to the user:
- All 9 topics live at `/en/electromagnetism/<slug>`.
- Build clean, tests green (or list any pre-existing failures unchanged from §01).
- Spec progress: 16/66 (24%).
- Next session: §04 Magnetic fields in matter (4 topics) + §05 Electrodynamics & induction (5 topics) = 9 topics.
- Any surprises or deviations from this plan.

---

## Definition of done

- All 9 §02 + §03 topic pages render `200` at `/en/electromagnetism/<slug>`.
- `pnpm build` clean. `pnpm vitest run` green for all new tests.
- New physicists + glossary terms have prose rows in `content_entries` (verified via Wave 3 Step 5 cross-ref check).
- Spec progress table updated: §02 = 4/4, §03 = 5/5, total = 16/66 (24%).
- Per-module commits land cleanly on main:
  - Wave 1 scaffolding (1 commit)
  - Wave 1.5 magnetic constants (1 commit)
  - Wave 2.5 per-topic (9 commits)
  - Wave 3 seed (1 commit)
  - Wave 3 spec update (1 commit)
  - Total: 13 commits this session.
- MemPalace implementation log written.

---

## Risk notes

- **CRITICAL — physicist/glossary cross-refs blow up at render.** This is the §01 gotcha (cc3fcbc) that triggered scripts/content/seed-em-01.ts as a follow-up. Wave 3 Task 12 prevents the recurrence. Don't skip it. Don't run Wave 2.5 commits and call the session done — the build will pass (TS doesn't know about Supabase row presence) but `/en/electromagnetism/the-lorentz-force` will server-error on `<PhysicistLink slug="hendrik-antoon-lorentz">` until the seed runs.
- **Registry conflicts under parallel agents.** Mitigated by the parallel-safety contract (agents return registry blocks; orchestrator merges serially in Wave 2.5). Same approach worked in §01 with 7 parallel agents — 9 should also work.
- **`lib/physics/electromagnetism/` nested layout.** New convention introduced this session. Risk: import paths in tests and scenes need to use the nested path. Watch for any agent confusion (might silently default to flat path). If any test fails with module resolution, the answer is path adjustment, not directory restructuring.
- **§02 voice — bound vs free charge is the trickiest distinction in classical EM.** Resist the temptation to be technically complete. The reader leaves with: bound = stuck in atoms; free = on the loose. Everything else is decoration.
- **§03 right-hand rule.** Every Lorentz / Biot–Savart scene needs a clear visual right-hand-rule cue (curled fingers → current direction; thumb → B direction or vice versa). This is the #1 thing readers struggle with in magnetism. Make it impossible to miss.
- **Calculus Policy A discipline.** Topics 8 (Ampère ∮ + ∇×) and 9 (vector potential ∇×) are the densest vector-calc topics in the branch so far. Re-read each draft asking: "if I'd never seen ∇× before, would I survive this paragraph?". If no, expand the plain-words gloss before the equation.
- **Pre-existing test failures from §01.** The implementation log lists three: turbulence numeric, parse-mdx golden, references env-var. None this session's responsibility. Don't fix them in this plan; flag them in the MemPalace log if they're still present after Wave 3.
- **Seed script idempotency.** `scripts/content/seed-em-01.ts` uses `upsert` + source_hash deduplication. The new script must do the same — re-running on the same data should be a no-op, not a duplicate insert.

## Spec self-review — done

**Coverage:** Each of the 9 §02/§03 topics in the spec has a Wave 2 task (Tasks 2–10). Every spec section ("Voice", "Calculus policy", "Money shot principle", "Integration checklist") is referenced in shared instructions or per-topic templates. The CRITICAL gotcha from prompt.md is addressed in Wave 3 Task 12.

**Placeholder scan:** No "TBD", no "TODO", no "implement later", no naked "Add error handling." All physics-lib functions have specified signatures and minimal test coverage. All sim components have specific behavior descriptions.

**Type consistency:** `Vec3` is defined in `lib/physics/electromagnetism/lorentz.ts` (Task 6) and re-imported by `biot-savart.ts` (Task 7). `Charge` and `Vec2` from `lib/physics/coulomb.ts` (§01) are reused by polarization.ts where 2D pedagogically sufficient. Cross-references between waves (Wave 1 adds physicist slugs that Wave 2 prose then `<PhysicistLink>`s; Wave 3 fills in their bios) are explicit and tested in Wave 3 Step 5.

**File-path absolutes:** every Create/Modify path is absolute or repo-relative without ambiguity.

No issues found. Plan is ready to execute.
