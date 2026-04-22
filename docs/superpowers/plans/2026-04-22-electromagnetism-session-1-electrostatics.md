# EM Session 1 — §01 Electrostatics Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship all 7 topics in §01 Electrostatics — the first module of the ELECTROMAGNETISM branch — at the existing CLASSICAL MECHANICS Distill.pub-quality bar. Each topic renders at `/en/electromagnetism/<slug>` with bespoke visualizations, vector-calculus prose that follows Calculus Policy A, and a physicist/glossary cross-reference graph that CI catches typos on.

**Architecture:** Three waves. Wave 1 is serial, single data-layer edit. Wave 2 fans out into 7 per-topic subagents, each authoring the full vertical slice (physics lib → simulation components → content.en.mdx → page.tsx → registry edits). Wave 3 is serial publish + build + commit + spec progress update. Every new topic uses the established Supabase-reading page pattern (fetch via `getContentEntry("topic", "electromagnetism/<slug>", locale)`; render via `<ContentBlocks>`).

**Tech Stack:** Next.js 15 (App Router), React 19, TypeScript strict, Tailwind v4, MDX (`@next/mdx`), Canvas 2D + JSXGraph for visualizations, Supabase `content_entries`, Vitest for physics-lib tests, KaTeX via rehype-katex.

**Spec:** `docs/superpowers/specs/2026-04-22-electromagnetism-branch-design.md` — read the §01 section and the "Integration checklist (per topic)" section before starting. The calculus-policy guidance applies to every piece of prose.

**Prerequisite reading for subagents:** `docs/superpowers/plans/2026-04-22-classical-mechanics-gap-closure.md` (executed and landed on main) is the closest completed precedent — same wave-based structure, same file layout, same publish-CLI flow. Existing topics under `app/[locale]/(topics)/classical-mechanics/` show the voice, figure density, and section patterning to match.

---

## File structure

### New files

**Physics libs (one per topic, pure TS + vitest):**
- `lib/physics/coulomb.ts`
- `lib/physics/electric-field.ts`
- `lib/physics/gauss.ts`
- `lib/physics/electric-potential.ts`
- `lib/physics/capacitance.ts`
- `lib/physics/conductors.ts`
- `lib/physics/method-of-images.ts`
- `tests/physics/coulomb.test.ts`
- `tests/physics/electric-field.test.ts`
- `tests/physics/gauss.test.ts`
- `tests/physics/electric-potential.test.ts`
- `tests/physics/capacitance.test.ts`
- `tests/physics/conductors.test.ts`
- `tests/physics/method-of-images.test.ts`

**Simulation components (~26 total across the 7 topics):**
- `components/physics/two-charge-force-scene.tsx`
- `components/physics/dipole-field-scene.tsx`
- `components/physics/charge-superposition-scene.tsx`
- `components/physics/field-lines-point-scene.tsx`
- `components/physics/field-lines-dipole-scene.tsx`
- `components/physics/field-lines-parallel-plates-scene.tsx`
- `components/physics/gaussian-surfaces-scene.tsx` *(money shot)*
- `components/physics/gauss-symmetry-scene.tsx`
- `components/physics/flux-through-surface-scene.tsx`
- `components/physics/potential-surface-scene.tsx`
- `components/physics/equipotential-lines-scene.tsx`
- `components/physics/voltage-ramp-scene.tsx`
- `components/physics/parallel-plate-capacitor-scene.tsx`
- `components/physics/capacitor-charging-scene.tsx`
- `components/physics/energy-density-scene.tsx`
- `components/physics/faraday-cage-scene.tsx`
- `components/physics/conductor-charge-distribution-scene.tsx`
- `components/physics/lightning-shelter-scene.tsx`
- `components/physics/image-charge-plane-scene.tsx`
- `components/physics/image-charge-sphere-scene.tsx`
- `components/physics/induced-charge-scene.tsx`

(Subagents may adjust scene names or add 1–2 extra per topic if the prose demands it. Prefer the list above as the floor.)

**Content pages (one folder per topic):**
- `app/[locale]/(topics)/electromagnetism/coulombs-law/page.tsx`
- `app/[locale]/(topics)/electromagnetism/coulombs-law/content.en.mdx`
- `app/[locale]/(topics)/electromagnetism/the-electric-field/page.tsx`
- `app/[locale]/(topics)/electromagnetism/the-electric-field/content.en.mdx`
- `app/[locale]/(topics)/electromagnetism/gauss-law/page.tsx`
- `app/[locale]/(topics)/electromagnetism/gauss-law/content.en.mdx`
- `app/[locale]/(topics)/electromagnetism/electric-potential/page.tsx`
- `app/[locale]/(topics)/electromagnetism/electric-potential/content.en.mdx`
- `app/[locale]/(topics)/electromagnetism/capacitance-and-field-energy/page.tsx`
- `app/[locale]/(topics)/electromagnetism/capacitance-and-field-energy/content.en.mdx`
- `app/[locale]/(topics)/electromagnetism/conductors-and-shielding/page.tsx`
- `app/[locale]/(topics)/electromagnetism/conductors-and-shielding/content.en.mdx`
- `app/[locale]/(topics)/electromagnetism/method-of-images/page.tsx`
- `app/[locale]/(topics)/electromagnetism/method-of-images/content.en.mdx`

### Modified files

- `lib/content/branches.ts` — replace the `electromagnetism` branch entry: populate `modules` (add §01 Electrostatics), populate `topics` (7 entries for §01), flip `status` from `coming-soon` to `live`. Leave the other 11 modules' topic entries absent until their respective sessions ship.
- `lib/content/physicists.ts` — add missing §01-relevant physicists: `charles-augustin-de-coulomb`, `benjamin-franklin`, `carl-friedrich-gauss`, `michael-faraday` (for Faraday cage), `simeon-denis-poisson` (for method of images context). Check the existing `PHYSICISTS` array first; skip any already present.
- `lib/content/glossary.ts` — add new terms: `electric-charge`, `coulomb-unit`, `electric-field`, `field-line`, `flux`, `gaussian-surface`, `divergence`, `gradient`, `line-integral`, `electric-potential-term`, `volt`, `equipotential`, `capacitance-term`, `farad`, `field-energy-density`, `faraday-cage`, `induced-charge`, `image-charge`. Check existing `GLOSSARY`; skip collisions.
- `lib/content/simulation-registry.ts` — register all new sim components (this is the registry `<ContentBlocks>` uses to render `{type: "simulation", component: "GaussianSurfacesScene", ...}` blocks from Supabase).
- `components/physics/visualization-registry.tsx` — register the same components here too (legacy/parallel registry; grep for `PendulumScene` registration in both files to see the pattern, then mirror).
- `docs/superpowers/specs/2026-04-22-electromagnetism-branch-design.md` — check 7 boxes in the §01 checklist + update the module-status row to `7/7 done` at the end of the session.

---

## Wave 1 — Data layer (serial, single subagent)

### Task 1: Scaffold §01 in `branches.ts`, add physicists, add glossary terms

**Files:**
- Modify: `/Users/romanpochtman/Developer/physics/lib/content/branches.ts`
- Modify: `/Users/romanpochtman/Developer/physics/lib/content/physicists.ts`
- Modify: `/Users/romanpochtman/Developer/physics/lib/content/glossary.ts`

- [ ] **Step 1: Add the `ELECTROMAGNETISM_MODULES` constant and 7 topic entries**

Open `lib/content/branches.ts`. Find the `CLASSICAL_MECHANICS_MODULES` and `CLASSICAL_MECHANICS_TOPICS` declarations for structural reference. Above the `BRANCHES` export, add:

```typescript
const ELECTROMAGNETISM_MODULES: readonly Module[] = [
  { slug: "electrostatics", title: "Electrostatics", index: 1 },
  { slug: "fields-in-matter", title: "Electric Fields in Matter", index: 2 },
  { slug: "magnetostatics", title: "Magnetostatics", index: 3 },
  { slug: "magnetism-in-matter", title: "Magnetic Fields in Matter", index: 4 },
  { slug: "induction", title: "Electrodynamics & Induction", index: 5 },
  { slug: "circuits", title: "Circuits", index: 6 },
  { slug: "maxwell", title: "Maxwell's Equations", index: 7 },
  { slug: "em-waves-vacuum", title: "EM Waves in Vacuum", index: 8 },
  { slug: "waves-in-matter-optics", title: "Waves in Matter & Optics", index: 9 },
  { slug: "radiation", title: "Radiation", index: 10 },
  { slug: "em-relativity", title: "EM & Relativity", index: 11 },
  { slug: "foundations", title: "Foundations", index: 12 },
];

const ELECTROMAGNETISM_TOPICS: readonly Topic[] = [
  {
    slug: "coulombs-law",
    title: "ELECTRIC CHARGE AND COULOMB'S LAW",
    eyebrow: "FIG.01 · ELECTROSTATICS",
    subtitle: "The force between two charges — and why it looks so much like gravity.",
    readingMinutes: 10,
    status: "live",
    module: "electrostatics",
  },
  {
    slug: "the-electric-field",
    title: "THE ELECTRIC FIELD",
    eyebrow: "FIG.02 · ELECTROSTATICS",
    subtitle: "When a force has a place of its own.",
    readingMinutes: 11,
    status: "live",
    module: "electrostatics",
  },
  {
    slug: "gauss-law",
    title: "GAUSS'S LAW",
    eyebrow: "FIG.03 · ELECTROSTATICS",
    subtitle: "The equation that turns symmetry into an answer.",
    readingMinutes: 12,
    status: "live",
    module: "electrostatics",
  },
  {
    slug: "electric-potential",
    title: "ELECTRIC POTENTIAL AND VOLTAGE",
    eyebrow: "FIG.04 · ELECTROSTATICS",
    subtitle: "Energy per charge, and the map every battery reads from.",
    readingMinutes: 11,
    status: "live",
    module: "electrostatics",
  },
  {
    slug: "capacitance-and-field-energy",
    title: "CAPACITANCE AND FIELD ENERGY",
    eyebrow: "FIG.05 · ELECTROSTATICS",
    subtitle: "Where the charge goes when you let go of the switch.",
    readingMinutes: 12,
    status: "live",
    module: "electrostatics",
  },
  {
    slug: "conductors-and-shielding",
    title: "CONDUCTORS AND THE FARADAY CAGE",
    eyebrow: "FIG.06 · ELECTROSTATICS",
    subtitle: "Why a metal box is the safest place in a lightning storm.",
    readingMinutes: 11,
    status: "live",
    module: "electrostatics",
  },
  {
    slug: "method-of-images",
    title: "THE METHOD OF IMAGES",
    eyebrow: "FIG.07 · ELECTROSTATICS",
    subtitle: "A trick that turns a hard problem into a symmetry.",
    readingMinutes: 12,
    status: "live",
    module: "electrostatics",
  },
];
```

- [ ] **Step 2: Update the `electromagnetism` entry in `BRANCHES`**

Replace the current `coming-soon` stub (lines ~351-361) with:

```typescript
  {
    slug: "electromagnetism",
    index: 2,
    title: "ELECTROMAGNETISM",
    eyebrow: "§ 02",
    subtitle: "Light, charge, and the field that holds the world together.",
    description:
      "Maxwell's four equations — the most important four lines in physics — unify electricity, magnetism, and light into a single field theory. Every radio, screen, wire, and star depends on them. The branch ends on the quiet reveal that magnetism was never a second force at all: it is electricity, seen from a moving train.",
    modules: ELECTROMAGNETISM_MODULES,
    topics: ELECTROMAGNETISM_TOPICS,
    status: "live",
  },
```

- [ ] **Step 3: Add missing §01 physicists to `PHYSICISTS`**

Open `lib/content/physicists.ts`. Check whether each of these already exists (search by slug):
- `charles-augustin-de-coulomb`
- `benjamin-franklin`
- `carl-friedrich-gauss`
- `michael-faraday`
- `simeon-denis-poisson`

For each missing one, append an entry matching the existing shape. Minimum viable fields: `slug`, `born`, `died`, `nationality`, `relatedTopics`. Bios/contributions arrays will be populated via the content-pipeline (messages/JSON or separate MDX) later — the structural entry here is enough to satisfy `<PhysicistLink>` link resolution.

Example entry shape (match whatever shape the existing entries use in this repo — `lib/content/physicists.ts` will show the truth):

```typescript
{
  slug: "charles-augustin-de-coulomb",
  born: "1736",
  died: "1806",
  nationality: "French",
  relatedTopics: [
    { branchSlug: "electromagnetism", topicSlug: "coulombs-law" },
    { branchSlug: "electromagnetism", topicSlug: "the-electric-field" },
  ],
},
```

Use the `getContentEntriesByKind("physicist", locale)` flow to publish bios later; for now, even a row without a bio in Supabase will render via the English fallback because the page template reads from Supabase.

**Note:** physicists' bios and glossary term descriptions should be authored as separate MDX under `content/physicists/<slug>.en.mdx` and `content/glossary/<slug>.en.mdx` if that's the pattern the repo currently uses (check existing directory). If the repo doesn't have that pattern, follow whatever mechanism was used for existing physicists (messages/JSON or direct Supabase seed). Ask the user if unsure — this may be the first time new physicists are added under the Supabase-native architecture.

- [ ] **Step 4: Add §01 glossary terms to `GLOSSARY`**

Open `lib/content/glossary.ts`. For each of the following slugs, check whether it exists and append if missing, matching the existing entry shape (structural fields like `slug`, `category`, `relatedPhysicists`, `relatedTopics`; prose fields live in Supabase):

- `electric-charge` (category: `concept`)
- `coulomb-unit` (category: `unit`)
- `electric-field` (category: `concept`)
- `field-line` (category: `concept`)
- `flux` (category: `concept`)
- `gaussian-surface` (category: `concept`)
- `divergence` (category: `concept`)
- `gradient` (category: `concept`)
- `line-integral` (category: `concept`)
- `electric-potential-term` (category: `concept`) — note the `-term` suffix to avoid collision with the topic slug `electric-potential`
- `volt` (category: `unit`)
- `equipotential` (category: `concept`)
- `capacitance-term` (category: `concept`) — note the `-term` suffix
- `farad` (category: `unit`)
- `field-energy-density` (category: `concept`)
- `faraday-cage` (category: `instrument`)
- `induced-charge` (category: `concept`)
- `image-charge` (category: `concept`)

- [ ] **Step 5: Verify with tsc and tests**

```bash
pnpm tsc --noEmit
pnpm vitest run tests/content/
```

Expected: clean. If `tests/content/references.test.ts` complains about missing bios for the new physicists (empty content_entries rows), that's a known gap flagged in the spec — the test should still pass structurally because the cross-ref walker only checks slug resolution, not content presence.

- [ ] **Step 6: Commit**

```bash
git add lib/content/branches.ts lib/content/physicists.ts lib/content/glossary.ts
git commit -m "feat(em/§01): scaffold electrostatics module, physicists, glossary

Adds ELECTROMAGNETISM_MODULES (12 entries) + ELECTROMAGNETISM_TOPICS (7 §01
entries). Flips branch status to live. Adds Coulomb, Franklin, Gauss, Faraday,
Poisson to PHYSICISTS. Adds 18 §01 glossary terms. Structural-only — prose
for physicists and glossary will be published via content pipeline next.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

## Wave 2 — Per-topic authoring (7 parallel subagents)

Each task below is a complete vertical slice. A subagent can complete any one task independently once Wave 1 has landed. Dispatch all 7 in parallel where possible; if the sim-registry edits conflict, rebase/merge the offending task's commit (the conflicts are append-only adds at the bottom of the registry files and resolve trivially).

### Shared instructions for every Wave 2 task

Every per-topic task has the same substructure:

1. **Physics lib (`lib/physics/<topic>.ts`)** — pure TS, no React, only `import`s from `lib/physics/constants.ts` (extend if needed — add SI EM constants).
2. **Physics tests (`tests/physics/<topic>.test.ts`)** — vitest. Check at least one known-value case per exported function. Aim for 3–6 test cases total.
3. **Simulation components (`components/physics/<name>-scene.tsx`)** — client components, use `"use client"`, export a named React component, accept typed props. Style must match existing CM scenes (dark canvas, cyan accents, `font-mono text-xs` HUD). Use Canvas 2D for animated physics; SVG for static diagrams; JSXGraph (via the existing wrapper) if a constructed geometry diagram is clearer.
4. **Registry registration** — append entries to BOTH `lib/content/simulation-registry.ts` AND `components/physics/visualization-registry.tsx` mirroring the shape of existing entries (e.g., `PendulumScene`).
5. **Content page (`app/[locale]/(topics)/electromagnetism/<slug>/page.tsx`)** — copy from `app/[locale]/(topics)/classical-mechanics/newtons-three-laws/page.tsx` verbatim, changing only the `SLUG` constant to `electromagnetism/<topic-slug>`.
6. **MDX content (`content.en.mdx`)** — compose from `<TopicPageLayout>`, `<TopicHeader>`, numbered `<Section>`s, `<SceneCard>` wrappers around simulation components, `<EquationBlock>`s with KaTeX `tex` strings, `<Callout variant="intuition|math|warning">`s, inline `<PhysicistLink slug="..." />` and `<Term slug="..." />` cross-refs. Target word count: 900–1400 per topic. Aside links in the `<TopicPageLayout aside={[...]}>` prop — usually 3–5 entries.
7. **Publish the new row**:
   ```bash
   pnpm content:publish --only electromagnetism/<slug>
   ```
   Check that exactly one row was inserted in `content_entries`.
8. **Build smoke test**:
   ```bash
   pnpm build 2>&1 | tail -40
   ```
   Expected: clean. The new route `/en/electromagnetism/<slug>` should appear in the generated routes list.
9. **Run the test suite**:
   ```bash
   pnpm vitest run
   ```
   Expected: all green.
10. **Commit** per the template inside each task.

Voice reminder (from spec, Calculus Policy A): every topic that uses div / curl / flux / gradient must explain the symbol **in words first, in-context, before the equation**. Don't link to `/dictionary/divergence` as a substitute for the explanation — link to it as a "go deeper" aside. A reader who hops in from search must be able to read the topic end-to-end without dependency on any other topic.

---

### Task 2: Topic `coulombs-law` (FIG.01)

**Goal:** introduce electric charge, Coulomb's law, force superposition. The reader should finish knowing why charge-charge force looks like gravity (1/r²), why it has a sign, and how to add forces from many charges.

**Files:**
- Create: `lib/physics/coulomb.ts`
- Create: `tests/physics/coulomb.test.ts`
- Create: `components/physics/two-charge-force-scene.tsx`
- Create: `components/physics/dipole-field-scene.tsx`
- Create: `components/physics/charge-superposition-scene.tsx`
- Create: `app/[locale]/(topics)/electromagnetism/coulombs-law/page.tsx`
- Create: `app/[locale]/(topics)/electromagnetism/coulombs-law/content.en.mdx`
- Modify: `lib/content/simulation-registry.ts` (append 3 entries)
- Modify: `components/physics/visualization-registry.tsx` (append 3 entries)

- [ ] **Step 1: Extend `lib/physics/constants.ts` with EM SI constants**

Add (if not already present): `EPSILON_0 = 8.8541878128e-12` (F/m), `K_COULOMB = 1 / (4 * Math.PI * EPSILON_0)` (≈ 8.9875517873681764e9), `ELEMENTARY_CHARGE = 1.602176634e-19` (C). Commit separately:

```bash
git add lib/physics/constants.ts
git commit -m "feat(physics): add EM SI constants (ε₀, k_e, e)"
```

- [ ] **Step 2: Write `lib/physics/coulomb.ts`**

```typescript
import { K_COULOMB } from "./constants";

export interface Charge {
  q: number; // coulombs
  x: number; // meters
  y: number;
}

export interface Vec2 {
  x: number;
  y: number;
}

/** Coulomb force on test charge from a source charge. */
export function coulombForce(source: Charge, test: Charge): Vec2 {
  const dx = test.x - source.x;
  const dy = test.y - source.y;
  const r2 = dx * dx + dy * dy;
  if (r2 === 0) return { x: 0, y: 0 };
  const r = Math.sqrt(r2);
  const magnitude = (K_COULOMB * source.q * test.q) / r2;
  return { x: (magnitude * dx) / r, y: (magnitude * dy) / r };
}

/** Superposition: total force on a test charge from many sources. */
export function superpose(sources: readonly Charge[], test: Charge): Vec2 {
  return sources.reduce<Vec2>(
    (acc, s) => {
      const f = coulombForce(s, test);
      return { x: acc.x + f.x, y: acc.y + f.y };
    },
    { x: 0, y: 0 },
  );
}
```

- [ ] **Step 3: Write `tests/physics/coulomb.test.ts`**

```typescript
import { describe, expect, it } from "vitest";
import { coulombForce, superpose } from "@/lib/physics/coulomb";
import { K_COULOMB } from "@/lib/physics/constants";

describe("coulombForce", () => {
  it("returns zero when coincident", () => {
    const f = coulombForce({ q: 1, x: 0, y: 0 }, { q: 1, x: 0, y: 0 });
    expect(f).toEqual({ x: 0, y: 0 });
  });

  it("repels like charges along the axis", () => {
    const f = coulombForce({ q: 1, x: 0, y: 0 }, { q: 1, x: 1, y: 0 });
    expect(f.x).toBeCloseTo(K_COULOMB, 5);
    expect(f.y).toBeCloseTo(0, 10);
  });

  it("attracts opposite charges", () => {
    const f = coulombForce({ q: 1, x: 0, y: 0 }, { q: -1, x: 1, y: 0 });
    expect(f.x).toBeCloseTo(-K_COULOMB, 5);
  });

  it("falls as 1/r² (doubling r → 1/4 the force)", () => {
    const near = coulombForce({ q: 1, x: 0, y: 0 }, { q: 1, x: 1, y: 0 });
    const far = coulombForce({ q: 1, x: 0, y: 0 }, { q: 1, x: 2, y: 0 });
    expect(far.x / near.x).toBeCloseTo(0.25, 5);
  });
});

describe("superpose", () => {
  it("cancels symmetrically", () => {
    const sources = [
      { q: 1, x: -1, y: 0 },
      { q: 1, x: 1, y: 0 },
    ];
    const f = superpose(sources, { q: 1, x: 0, y: 0 });
    expect(f.x).toBeCloseTo(0, 5);
    expect(f.y).toBeCloseTo(0, 5);
  });
});
```

Run: `pnpm vitest run tests/physics/coulomb.test.ts`. Expected: all pass.

- [ ] **Step 4: Write the 3 simulation components**

`two-charge-force-scene.tsx` — two circular charges on a horizontal axis, sliders for q₁, q₂, separation. Force arrows drawn on each, magnitude readout in N. Show arrows flipping sign when one charge is made negative.

`dipole-field-scene.tsx` — a + and − charge at fixed separation, sampling grid of small vectors showing force direction. No sliders; pure educational diagram.

`charge-superposition-scene.tsx` — drag-to-add charges on a 2D canvas. A test charge at origin updates its force arrow in real time as you add/remove source charges. This is the topic's interactive payoff.

Each scene is `"use client"`, uses Canvas 2D (look at `pendulum-scene.tsx` for the canonical pattern: `useRef<HTMLCanvasElement>`, animation loop via `requestAnimationFrame`, HUD overlaid with `<div className="font-mono text-xs">`).

- [ ] **Step 5: Register all 3 in both registries**

In `lib/content/simulation-registry.ts`, append under the existing registrations:

```typescript
import { TwoChargeForceScene } from "@/components/physics/two-charge-force-scene";
import { DipoleFieldScene } from "@/components/physics/dipole-field-scene";
import { ChargeSuperpositionScene } from "@/components/physics/charge-superposition-scene";

// in the main registry map:
TwoChargeForceScene,
DipoleFieldScene,
ChargeSuperpositionScene,
```

In `components/physics/visualization-registry.tsx`, append `dynamic()` entries following the existing pattern (see e.g. `RestoringForceScene` in that file). Commit.

- [ ] **Step 6: Write `page.tsx` for the topic**

Copy `app/[locale]/(topics)/classical-mechanics/newtons-three-laws/page.tsx` verbatim and change only:

```typescript
const SLUG = "electromagnetism/coulombs-law";
```

- [ ] **Step 7: Write `content.en.mdx`**

Target outline (follow the voice of `app/[locale]/(topics)/classical-mechanics/newtons-three-laws/content.en.mdx`):

1. **§1 Two kinds of charge** — Franklin's guess, Benjamin Franklin's kite, the convention that stuck (positive/negative). No math. 200 words.
2. **§2 The law itself** — EQ.01: F = k·q₁q₂/r². Compare to Newton's gravity. SceneCard: `TwoChargeForceScene`. 250 words.
3. **§3 Superposition** — EQ.02: F_total = Σ F_i. SceneCard: `ChargeSuperpositionScene` (the interactive one). Walk through why summing works and what "linear" means here. 250 words.
4. **§4 Dipoles, the simplest interesting case** — SceneCard: `DipoleFieldScene`. Set up the concept of dipole for later. 200 words.
5. **§5 Units and the constant** — SI: coulomb, k_e, ε₀. Why Coulomb's constant looks like it has a 4π in the denominator when written with ε₀. 150 words.
6. **§6 Where it shows up** — static cling, lightning, toner, capacitors (hint at next topic). 100 words.

Aside (`TopicPageLayout aside={[...]}`):
```json
[
  {"type": "physicist", "label": "Charles Coulomb", "href": "/physicists/charles-augustin-de-coulomb"},
  {"type": "physicist", "label": "Benjamin Franklin", "href": "/physicists/benjamin-franklin"},
  {"type": "term", "label": "Electric charge", "href": "/dictionary/electric-charge"},
  {"type": "term", "label": "Coulomb (unit)", "href": "/dictionary/coulomb-unit"}
]
```

Use `<PhysicistLink>` and `<Term>` inline. At least one of each.

- [ ] **Step 8: Publish**

```bash
pnpm content:publish --only electromagnetism/coulombs-law
pnpm build 2>&1 | tail -30
pnpm vitest run
```

All three must succeed. Verify the route `/en/electromagnetism/coulombs-law` appears in the build output.

- [ ] **Step 9: Commit**

```bash
git add lib/physics/coulomb.ts tests/physics/coulomb.test.ts \
  components/physics/two-charge-force-scene.tsx \
  components/physics/dipole-field-scene.tsx \
  components/physics/charge-superposition-scene.tsx \
  lib/content/simulation-registry.ts \
  components/physics/visualization-registry.tsx \
  app/\[locale\]/\(topics\)/electromagnetism/coulombs-law
git commit -m "feat(em/§01): coulombs-law — charge, Coulomb's law, superposition

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

### Task 3: Topic `the-electric-field` (FIG.02)

**Goal:** the field concept — a force per unit charge that exists whether or not a test charge is there to feel it. Field lines, superposition of fields, the density-equals-strength convention. This is where the reader shifts from "charges exert forces on each other" to "charges source fields; fields push charges".

**Files:**
- Create: `lib/physics/electric-field.ts`
- Create: `tests/physics/electric-field.test.ts`
- Create: `components/physics/field-lines-point-scene.tsx`
- Create: `components/physics/field-lines-dipole-scene.tsx`
- Create: `components/physics/field-lines-parallel-plates-scene.tsx`
- Create: `app/[locale]/(topics)/electromagnetism/the-electric-field/page.tsx`
- Create: `app/[locale]/(topics)/electromagnetism/the-electric-field/content.en.mdx`
- Modify: `lib/content/simulation-registry.ts`, `components/physics/visualization-registry.tsx`

- [ ] **Step 1–9: Follow the shared structure above.**

Physics lib (`electric-field.ts`): export `electricFieldAtPoint(sources: Charge[], point: Vec2): Vec2` (E = F / q, equivalently E = k·q_source / r² as a vector sum over sources). Keep it thin — the math is nearly identical to `coulomb.ts` but returns E instead of F.

Tests: check (a) E at the center of a symmetric dipole along the perpendicular bisector points the "right" way, (b) doubling source charge doubles E, (c) moving away by 2× reduces E by 4×.

Sim components:
- `field-lines-point-scene.tsx` — draw field lines radiating from a single charge (positive: outward; negative: inward). Use an ODE-trace algorithm (step along ∇φ direction) or a simple spoke layout for a point charge.
- `field-lines-dipole-scene.tsx` — the classic dipole field-line picture. Lines from + wrap around and terminate on −.
- `field-lines-parallel-plates-scene.tsx` — two plates with near-uniform field in the middle, fringing at the edges. Sketches the "capacitor preview" for the next topic.

Prose outline:
1. **§1 From force to field** — divide Coulomb's law by the test charge. The field is now an object of its own.
2. **§2 Field lines** — SceneCard: `field-lines-point-scene.tsx`. Density = strength. Start on +, end on − or infinity. Never cross.
3. **§3 Superposition of fields** — just vector addition, same as forces.
4. **§4 Dipole field** — SceneCard: `field-lines-dipole-scene.tsx`. 1/r³ falloff at distance (state; derive briefly).
5. **§5 Parallel plates** — SceneCard: `field-lines-parallel-plates-scene.tsx`. Hint at uniform field as the simplest case.
6. **§6 Where it matters** — CRT televisions (historical), ink-jet printers, atomic physics (electrons feeling E-field of the nucleus).

Aside: Faraday (the man who insisted fields were real), Coulomb, `electric-field`, `field-line`.

Commit message: `feat(em/§01): the-electric-field — field concept, field lines, superposition`.

---

### Task 4: Topic `gauss-law` (FIG.03) — **module money shot**

**Goal:** flux, Gaussian surfaces, and the symmetry payoff. This topic's signature animation (morphing Gaussian surfaces over a point charge) is the one the reader will screenshot. Target 1200–1400 words.

**Files:**
- Create: `lib/physics/gauss.ts`
- Create: `tests/physics/gauss.test.ts`
- Create: `components/physics/gaussian-surfaces-scene.tsx` *(money shot)*
- Create: `components/physics/gauss-symmetry-scene.tsx`
- Create: `components/physics/flux-through-surface-scene.tsx`
- Create: `app/[locale]/(topics)/electromagnetism/gauss-law/page.tsx`
- Create: `app/[locale]/(topics)/electromagnetism/gauss-law/content.en.mdx`
- Modify: both registries

- [ ] **Steps 1–9 per shared structure.**

Physics lib (`gauss.ts`): export `fluxThroughSphere(q: number, r: number): number` returning `q / EPSILON_0` (independent of r — that's the point). Export `fieldFromSphericalSymmetry(qEnclosed: number, r: number): number` returning `qEnclosed / (4π·ε₀·r²)`. Export `fieldFromLineSymmetry(lambda: number, s: number): number` returning `lambda / (2π·ε₀·s)`. Export `fieldFromPlaneSymmetry(sigma: number): number` returning `sigma / (2·ε₀)`.

Tests: spot-check each formula at unit values, confirm flux-through-sphere is r-independent.

Sim components:
- `gaussian-surfaces-scene.tsx` — **money shot.** A single point charge at origin. Surface morphs continuously: sphere → cylinder → cube → pillbox → back. Live readout of ΦE = ∮E·dA. No matter the surface, flux = q/ε₀. This is the animation that closes the topic.
- `gauss-symmetry-scene.tsx` — three panels side by side: spherical (around a ball), cylindrical (around a line of charge), planar (around an infinite sheet). Each shows the Gaussian surface and the resulting E-field magnitude formula.
- `flux-through-surface-scene.tsx` — educational: E-field vector grid, a translatable flat surface, live-updating flux count. Reader drags the surface to tilt it; flux changes with orientation.

Prose outline:
1. **§1 The problem Coulomb's law leaves behind** — when you have many charges arranged in some pattern, summing is painful. Gauss gives a shortcut when symmetry is there.
2. **§2 Flux** — what it means in plain words: "how many field lines cross this surface." Then the integral definition with plain-English decoding. Link to `/dictionary/flux`.
3. **§3 Gauss's law** — EQ.01: ∮E·dA = Q_enc/ε₀. State it. This is *the* equation. 100+ words of voice-loaded explanation of the symbol salad.
4. **§4 The spherical case** — derive E from a point charge using Gauss. SceneCard: `gauss-symmetry-scene.tsx`. The symmetry-collapses-to-algebra moment.
5. **§5 Line and plane symmetries** — derive both, point out they're different r-dependences (1/r for line, constant for plane).
6. **§6 The money shot: flux is surface-independent** — SceneCard: `gaussian-surfaces-scene.tsx`. The animation. No matter what surface you choose, flux is the same. This is what "field lines start on charges" *means*.
7. **§7 Where it fails without symmetry** — Gauss still holds, you just can't solve for E. Honest about the limits.

Aside: Gauss, Faraday (who first drew field lines), `flux`, `gaussian-surface`, `divergence`.

Commit message: `feat(em/§01): gauss-law — flux, Gaussian surfaces, the symmetry payoff`.

---

### Task 5: Topic `electric-potential` (FIG.04)

**Goal:** energy per charge, why V is a scalar (easier than E), equipotentials, and the connection V = -∫E·dl.

**Files:**
- Create: `lib/physics/electric-potential.ts`, `tests/physics/electric-potential.test.ts`
- Create: `components/physics/potential-surface-scene.tsx`
- Create: `components/physics/equipotential-lines-scene.tsx`
- Create: `components/physics/voltage-ramp-scene.tsx`
- Create: topic folder under `app/[locale]/(topics)/electromagnetism/electric-potential/`
- Modify: both registries

- [ ] **Steps 1–9.**

Physics lib: `potentialAtPoint(sources: Charge[], point: Vec2): number` → V = k·Σ(q_i/r_i). `potentialDifference(sources, a, b)` → V(a) − V(b). Mind the sign convention.

Sim components:
- `potential-surface-scene.tsx` — 3D heightmap (rendered as 2D contour + isometric projection) of V over a dipole. Hills and valleys.
- `equipotential-lines-scene.tsx` — overlay equipotential contours on the field-line picture of a dipole. Shows how E-lines are always perpendicular to equipotentials.
- `voltage-ramp-scene.tsx` — a test charge moving along a path between two points; the energy readout ramps up or down linearly with potential difference, independent of path.

Prose outline:
1. **§1 Energy, not force** — why scalars are easier than vectors.
2. **§2 From force to potential** — V = -∫E·dl. Path independence = conservative field (mention, don't prove). Reference Noether's theorem briefly.
3. **§3 The voltage map** — SceneCard: `potential-surface-scene.tsx`. Reading V like a topo map.
4. **§4 Equipotentials** — SceneCard: `equipotential-lines-scene.tsx`. Always perpendicular to E.
5. **§5 The volt** — unit. 1 V = 1 J/C. How batteries work in one paragraph.
6. **§6 Path independence** — SceneCard: `voltage-ramp-scene.tsx`. The energy you gain depends on endpoints, not route.
7. **§7 Why it matters** — circuits (hint), Millikan oil drop, atomic ionization energies.

Aside: Volta (if in PHYSICISTS; add if not), Franklin, `volt`, `equipotential`, `line-integral`.

Commit: `feat(em/§01): electric-potential — V, equipotentials, path independence`.

---

### Task 6: Topic `capacitance-and-field-energy` (FIG.05)

**Goal:** capacitors as charge reservoirs, the 1/2·C·V² energy, and the surprisingly deep fact that the energy is stored in the *field*.

**Files:**
- Create: `lib/physics/capacitance.ts`, `tests/physics/capacitance.test.ts`
- Create: `components/physics/parallel-plate-capacitor-scene.tsx`
- Create: `components/physics/capacitor-charging-scene.tsx`
- Create: `components/physics/energy-density-scene.tsx`
- Create: topic folder
- Modify: both registries

Physics lib: `parallelPlateCapacitance(A: number, d: number, kappa = 1): number` → `ε₀ κ A / d`. `energyStored(C: number, V: number): number` → `0.5 C V²`. `energyDensity(E: number, kappa = 1): number` → `0.5 ε₀ κ E²`.

Sim components:
- `parallel-plate-capacitor-scene.tsx` — plates with sliders for A, d, κ, V. Live readout of C and stored energy.
- `capacitor-charging-scene.tsx` — a battery connected to an initially-empty capacitor; charge builds on the plates over time (exponential curve, hint at RC next module).
- `energy-density-scene.tsx` — the field between the plates, shaded by energy density. Tweaking V rescales the shading. Voltage ramp mirrors energy ramp.

Prose outline:
1. **§1 Two plates, one insulator** — the basic geometry. Charge migrates under applied V.
2. **§2 Capacitance** — EQ.01: C = Q/V. Linear. Units: farad.
3. **§3 Parallel plates in detail** — EQ.02: C = ε₀A/d. SceneCard. Limits (why d → 0 is dangerous).
4. **§4 Dielectrics as amplifiers** — insert an insulator: C goes up by κ. Brief mention of bound charges (forward-ref §02 §02).
5. **§5 Energy stored** — EQ.03: U = ½ C V². SceneCard: `capacitor-charging-scene.tsx`. Half the work is lost as heat during charging (surprise).
6. **§6 Where the energy lives — in the field** — EQ.04: u = ½ ε₀ E². SceneCard: `energy-density-scene.tsx`. This is the quiet reveal of the topic: the field is *physical*, it stores real energy.
7. **§7 Applications** — camera flashes, defibrillators, DRAM.

Aside: Volta, Leyden jar, `capacitance-term`, `farad`, `field-energy-density`.

Commit: `feat(em/§01): capacitance-and-field-energy — C, U = ½CV², field as energy store`.

---

### Task 7: Topic `conductors-and-shielding` (FIG.06)

**Goal:** why E = 0 inside a conductor in equilibrium, how induced surface charges cancel any applied field inside a hollow conductor (Faraday cage), and why lightning doesn't kill you in a car.

**Files:**
- Create: `lib/physics/conductors.ts`, `tests/physics/conductors.test.ts`
- Create: `components/physics/faraday-cage-scene.tsx`
- Create: `components/physics/conductor-charge-distribution-scene.tsx`
- Create: `components/physics/lightning-shelter-scene.tsx`
- Create: topic folder
- Modify: both registries

Physics lib: keep slim — mostly a couple of helpers. `surfaceFieldFromSigma(sigma: number): number` → `sigma / ε₀` (field just outside a conductor). `induceChargeOnPlane(externalField: number, area: number): number` — pedagogical helper.

Sim components:
- `faraday-cage-scene.tsx` — an external field applied to a hollow metal box. Induced charges migrate to surfaces; field inside cancels. Live arrows show internal field collapsing to zero as induced charges equilibrate.
- `conductor-charge-distribution-scene.tsx` — an arbitrary-shaped conductor (blob) with a point charge brought nearby. Induced surface charge shifts. Useful for building intuition before the next topic's image-charge trick.
- `lightning-shelter-scene.tsx` — simplified car hit by a lightning bolt. Current flows around the exterior; interior stays at zero field. Dramatic and memorable.

Prose outline:
1. **§1 Conductors in equilibrium** — why E = 0 inside. One-paragraph derivation (otherwise free charges would move).
2. **§2 Charge lives on the surface** — corollary. Electric field is perpendicular to the surface just outside.
3. **§3 The Faraday cage** — SceneCard: `faraday-cage-scene.tsx`. External field can't get in.
4. **§4 Induced charge** — SceneCard: `conductor-charge-distribution-scene.tsx`. A nearby point charge deforms the surface charge distribution.
5. **§5 Lightning and cars** — SceneCard: `lightning-shelter-scene.tsx`. The practical payoff.
6. **§6 Why it matters** — cables with braided shields, MRI rooms, sensitive electronics, microwave oven doors.

Aside: Faraday, `faraday-cage`, `induced-charge`.

Commit: `feat(em/§01): conductors-and-shielding — E=0 interior, Faraday cage, lightning`.

---

### Task 8: Topic `method-of-images` (FIG.07)

**Goal:** a single beautiful trick — replace a complicated boundary condition with an imaginary mirror charge — and the two canonical geometries it solves (point charge above a grounded plane; point charge outside a grounded sphere).

**Files:**
- Create: `lib/physics/method-of-images.ts`, `tests/physics/method-of-images.test.ts`
- Create: `components/physics/image-charge-plane-scene.tsx`
- Create: `components/physics/image-charge-sphere-scene.tsx`
- Create: `components/physics/induced-charge-scene.tsx`
- Create: topic folder
- Modify: both registries

Physics lib: `imageChargeForPlane(q: number, d: number)` → returns the image charge (−q at −d). `imageChargeForSphere(q: number, a: number, R: number)` → returns the image charge magnitude and position (`q' = -qR/a`, at distance `R²/a` from sphere center).

Sim components:
- `image-charge-plane-scene.tsx` — a + charge hovering over a grounded plane. Below the plane, a phantom − charge (drawn semi-transparent) whose field lines combine with the real charge's to produce exactly the right pattern above. Toggle between "real-world" view (lines stopping at plane) and "image-world" view (lines passing through).
- `image-charge-sphere-scene.tsx` — the sphere version. Slider for distance a; the phantom charge inside the sphere scales per the Kelvin formula.
- `induced-charge-scene.tsx` — the surface charge density σ(x) on the plane as a function of position. The dip directly under the real charge is the induced negative charge.

Prose outline:
1. **§1 The problem** — charge near a grounded conductor. Gauss won't help (no symmetry); Laplace's equation in general is hard.
2. **§2 The trick** — replace the conductor with an image charge that produces the right boundary. SceneCard: `image-charge-plane-scene.tsx`. Step through "why this works."
3. **§3 The force on the real charge** — derive F = -kq²/(2d)². The ½ in the denominator is subtle and worth explaining.
4. **§4 The induced surface charge** — SceneCard: `induced-charge-scene.tsx`. Integrating σ gives exactly −q total.
5. **§5 The sphere case** — SceneCard: `image-charge-sphere-scene.tsx`. Kelvin's result. The image charge sits at the sphere's inverse point.
6. **§6 Where the trick breaks** — arbitrary geometries need numerics. Method of images is a special gift of simple geometry.
7. **§7 Why it matters** — scanning probe microscopy, atoms near metal surfaces, MEMS.

Aside: Poisson, Kelvin (if present; add `william-thomson-kelvin` if needed), `image-charge`.

Commit: `feat(em/§01): method-of-images — the mirror-charge trick, plane and sphere`.

---

## Wave 3 — Finalize (serial, single subagent)

### Task 9: Full build, spec update, session-end commit

**Files:**
- Modify: `docs/superpowers/specs/2026-04-22-electromagnetism-branch-design.md`

- [ ] **Step 1: Full build + test sweep**

```bash
pnpm tsc --noEmit
pnpm vitest run
pnpm build 2>&1 | tail -50
```

Expected: all three clean. Production build should list 7 new `/en/electromagnetism/<slug>` routes.

- [ ] **Step 2: Spot-check each topic URL**

Start the dev server:

```bash
pnpm dev &
sleep 4
for slug in coulombs-law the-electric-field gauss-law electric-potential capacitance-and-field-energy conductors-and-shielding method-of-images; do
  echo "=== $slug ==="
  curl -s -o /dev/null -w "%{http_code}\n" http://localhost:3000/en/electromagnetism/$slug
done
kill %1 2>/dev/null
```

Expected: `200` on all 7.

- [ ] **Step 3: Check home page, branch hub**

```bash
curl -s http://localhost:3000/en | grep -o "ELECTROMAGNETISM" | head -1
curl -s http://localhost:3000/en/electromagnetism | grep -c "FIG.0"
```

Expected: "ELECTROMAGNETISM" appears on home (branch card now live, not coming-soon), branch hub lists all 7 FIG.01–07 topics.

- [ ] **Step 4: Update the spec progress table**

Open `docs/superpowers/specs/2026-04-22-electromagnetism-branch-design.md`. In the **Module status** table, change the §01 row:

| §01 Electrostatics | 7 | 7 | ☑ complete |

And recompute the total row:

| **Total** | **66** | **7** | **11% complete** |

In the **Per-topic checklist**, under **§01 Electrostatics**, replace all 7 `- [ ]` with `- [x]`.

- [ ] **Step 5: Commit**

```bash
git add docs/superpowers/specs/2026-04-22-electromagnetism-branch-design.md
git commit -m "docs(em/§01): mark electrostatics module complete

All 7 topics in §01 Electrostatics shipped and reading from Supabase.
Branch now 7/66 topics (11% complete). Next session: §02 + §03.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

- [ ] **Step 6: MemPalace log**

Write an implementation log to MemPalace documenting what shipped, any deviations from the plan, and anything future sessions should know about registry/publish gotchas discovered during this session. Use the MemPalace `mempalace_kg_add` or `mempalace_add_drawer` tool targeting `wing=physics, room=decisions`. Pattern match `implementation_log_content_pipeline_foundation.md` for format.

- [ ] **Step 7: Report back**

Report to the user:
- All 7 topics live at `/en/electromagnetism/<slug>`
- Build clean, tests green
- Branch is now `status: "live"`
- Spec progress: 7/66 (11%)
- Next session: §02 Electric fields in matter (4 topics) + §03 Magnetostatics (5 topics) = 9 topics
- Any surprises or deviations from this plan

---

## Definition of done

- All 7 §01 topic pages render `200` at `/en/electromagnetism/<slug>`.
- `pnpm build` clean. `pnpm vitest run` green.
- Branch status `live` in `lib/content/branches.ts`.
- Branch hub `/en/electromagnetism` lists all 7 topics ordered FIG.01 → FIG.07.
- Spec progress table updated: §01 = 7/7, total = 7/66.
- Session-end commit on main.
- MemPalace implementation log written.

## Risk notes

- **Registry file conflicts** under parallel subagents. Both `lib/content/simulation-registry.ts` and `components/physics/visualization-registry.tsx` are append-target files. If 7 subagents run fully in parallel, they'll conflict. Options: (a) dispatch serially (adds latency); (b) dispatch in two batches (4 + 3); (c) let conflicts happen and rebase — append-only conflicts are trivial.
- **Physicist content**. The plan adds physicist *slugs* to `PHYSICISTS` but doesn't author full bios — the spec deferred that to "content-pipeline adds rows to content_entries." If the repo's current physicist architecture still expects prose in the `PHYSICISTS` array (check first), fall back to authoring bios inline as string fields matching the existing shape. Do not ship a broken `<PhysicistLink>` that crashes on missing data.
- **Glossary content**. Same caveat — add slugs + category, author prose via Supabase if the pipeline currently supports it. Check how recent CM glossary additions were handled (`angular-velocity`, `coriolis-force`, etc. from the gap-closure work).
- **Calculus-Policy-A prose discipline**. Resist the temptation to assume vector calc. Every topic here uses at least one of: line integral (electric-potential), surface integral (gauss-law, capacitance), gradient (electric-potential), or divergence (gauss-law conceptually). Every single one must be explained in-topic, in plain English, before the symbol appears. Recommend: after authoring §1 `coulombs-law`, reviewer re-reads as a non-expert to calibrate voice, then the other 6 topics copy the tone.
- **Fresnel-style scope creep in optics primitives**. A generic "charge + field" primitive would save sim-authoring work across §01 but isn't scoped into this plan. If the implementer starts to reach for reuse, keep it task-local — general primitives are §06 and §09 prep-work, not §01's problem.

## Spec self-review — done

Placeholders: none. Type consistency: `coulombForce` return type is `Vec2`, and `superpose` + `electricFieldAtPoint` reuse it — consistent. File paths: all absolute. Spec coverage: §01 section of the design doc has all 7 topics, each with a task here; the calculus policy reference is threaded through the shared instructions and voice reminder. No gaps.
