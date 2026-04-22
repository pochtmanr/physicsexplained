# Classical Mechanics Gap-Closure Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship four new CLASSICAL MECHANICS topics (Circular Motion, Non-Inertial Frames, Rolling Motion, Damped & Driven Oscillations) at existing Distill.pub-quality bar, bringing the branch from 31 → 35 topics and closing the intro/intermediate-level gaps.

**Architecture:** Five waves. Wave 1 is serial (single data-layer edit). Waves 2–4 fan out into per-topic parallel subagents. Wave 5 is serial publish+verify. Each new topic gets one `lib/physics/*.ts` module, ~4 `components/physics/*-scene.tsx` visualizations, one `page.tsx` + `content.en.mdx` under `app/[locale]/(topics)/classical-mechanics/`, and entries in the visualization registry. Content pushes to Supabase `content_entries` via the existing `pnpm content:publish` pipeline.

**Tech Stack:** Next.js 15 (App Router), React 19, TypeScript strict, Tailwind v4, MDX (`@next/mdx`), Canvas 2D + JSXGraph for visualizations, Supabase (postgres, `content_entries` table), Vitest for tests.

**Spec:** `docs/superpowers/specs/2026-04-22-classical-mechanics-gap-closure.md` — read it first; it contains per-topic section outlines, figure intents, and aside-link plans that the prose-writing tasks refer back to.

---

## File structure

New files:
- `lib/physics/circular-motion.ts`
- `lib/physics/rotating-frame.ts`
- `lib/physics/rolling.ts`
- `tests/physics/circular-motion.test.ts`
- `tests/physics/rotating-frame.test.ts`
- `tests/physics/rolling.test.ts`
- `components/physics/velocity-triangle-scene.tsx`
- `components/physics/centripetal-force-scene.tsx`
- `components/physics/angular-velocity-scene.tsx`
- `components/physics/newtons-cannon-scene.tsx`
- `components/physics/carousel-scene.tsx`
- `components/physics/coriolis-turntable-scene.tsx`
- `components/physics/coriolis-globe-scene.tsx`
- `components/physics/rotating-projectile-scene.tsx`
- `components/physics/wheel-decomposition-scene.tsx`
- `components/physics/rolling-race-scene.tsx`
- `components/physics/rolling-slipping-scene.tsx`
- `components/physics/coin-rolling-scene.tsx`
- `components/physics/damped-regimes-scene.tsx`
- `components/physics/quality-factor-scene.tsx`
- `app/[locale]/(topics)/classical-mechanics/circular-motion/page.tsx`
- `app/[locale]/(topics)/classical-mechanics/circular-motion/content.en.mdx`
- `app/[locale]/(topics)/classical-mechanics/non-inertial-frames/page.tsx`
- `app/[locale]/(topics)/classical-mechanics/non-inertial-frames/content.en.mdx`
- `app/[locale]/(topics)/classical-mechanics/rolling-motion/page.tsx`
- `app/[locale]/(topics)/classical-mechanics/rolling-motion/content.en.mdx`
- `app/[locale]/(topics)/classical-mechanics/damped-and-driven-oscillations/page.tsx`
- `app/[locale]/(topics)/classical-mechanics/damped-and-driven-oscillations/content.en.mdx`
- `scripts/content/seed-wave-6.ts`

Modified files:
- `lib/content/branches.ts` — insert 4 new `Topic` entries, renumber `eyebrow` FIG on shifted topics
- `lib/content/physicists.ts` — add `gaspard-gustave-de-coriolis`
- `lib/content/glossary.ts` — add `angular-velocity`, `centrifugal-force`, `coriolis-force`, `forced-oscillation`, `amplitude-response`, `moment-arm` (skip any that turn out to exist already)
- `components/physics/visualization-registry.tsx` — register 14 new components (plus any needed for MDX references)
- `app/[locale]/(topics)/classical-mechanics/oscillators-everywhere/content.en.mdx` — remove Section §4 Resonance and Section §5 coupled/driven-specific scenes that belong in the new topic

---

## Wave 1 — Data layer (serial, one agent)

### Task 1: Add 4 new topic entries to `branches.ts` and renumber FIG identifiers

**Files:**
- Modify: `/Users/romanpochtman/Developer/physics/lib/content/branches.ts`

- [ ] **Step 1: Add the 4 new `Topic` entries to `CLASSICAL_MECHANICS_TOPICS`**

Insert these into the `CLASSICAL_MECHANICS_TOPICS` array. Order within the array does not affect rendering (sort is module-based), but add them at the end for diff clarity:

```typescript
  {
    slug: "circular-motion",
    title: "CIRCULAR MOTION",
    eyebrow: "FIG.04 · KINEMATICS & NEWTON",
    subtitle: "Why the string always pulls inward — and why the Moon never stops falling.",
    readingMinutes: 11,
    status: "live",
    module: "kinematics-newton",
  },
  {
    slug: "non-inertial-frames",
    title: "NON-INERTIAL REFERENCE FRAMES",
    eyebrow: "FIG.06 · KINEMATICS & NEWTON",
    subtitle: "Why a carousel feels like a force — and why the wind turns right in the northern hemisphere.",
    readingMinutes: 13,
    status: "live",
    module: "kinematics-newton",
  },
  {
    slug: "rolling-motion",
    title: "ROLLING MOTION",
    eyebrow: "FIG.13 · ROTATION & RIGID BODIES",
    subtitle: "What a wheel does that a puck can't — and why a hollow cylinder loses every race.",
    readingMinutes: 12,
    status: "live",
    module: "rotation-rigid-bodies",
  },
  {
    slug: "damped-and-driven-oscillations",
    title: "DAMPED & DRIVEN OSCILLATIONS",
    eyebrow: "FIG.19 · OSCILLATIONS",
    subtitle: "Why every real oscillator dies — and why, if you push it just right, it tries to kill you back.",
    readingMinutes: 13,
    status: "live",
    module: "oscillations",
  },
```

- [ ] **Step 2: Renumber the FIG in every existing topic's `eyebrow` field to match the target table below**

Target FIG numbers (update `eyebrow` strings in place — only the `FIG.NN` prefix changes; module text stays):

| Slug | Old eyebrow | New eyebrow |
|---|---|---|
| friction-and-drag | FIG.04 · KINEMATICS & NEWTON | FIG.05 · KINEMATICS & NEWTON |
| energy-and-work | FIG.05 · CONSERVATION LAWS | FIG.07 · CONSERVATION LAWS |
| momentum-and-collisions | FIG.06 · CONSERVATION LAWS | FIG.08 · CONSERVATION LAWS |
| angular-momentum | FIG.07 · CONSERVATION LAWS | FIG.09 · CONSERVATION LAWS |
| noethers-theorem | FIG.08 · CONSERVATION LAWS | FIG.10 · CONSERVATION LAWS |
| torque-and-rotational-dynamics | FIG.09 · ROTATION & RIGID BODIES | FIG.11 · ROTATION & RIGID BODIES |
| moment-of-inertia | FIG.10 · ROTATION & RIGID BODIES | FIG.12 · ROTATION & RIGID BODIES |
| gyroscopes-and-precession | FIG.11 · ROTATION & RIGID BODIES | FIG.14 · ROTATION & RIGID BODIES |
| the-wobbling-earth | FIG.12 · ROTATION & RIGID BODIES | FIG.15 · ROTATION & RIGID BODIES |
| the-simple-pendulum | FIG.13 · OSCILLATIONS | FIG.16 · OSCILLATIONS |
| beyond-small-angles | FIG.14 · OSCILLATIONS | FIG.17 · OSCILLATIONS |
| oscillators-everywhere | FIG.15 · OSCILLATIONS | FIG.18 · OSCILLATIONS |
| the-wave-equation | FIG.16 · WAVES | FIG.20 · WAVES |
| standing-waves-and-modes | FIG.17 · WAVES | FIG.21 · WAVES |
| doppler-and-shock-waves | FIG.18 · WAVES | FIG.22 · WAVES |
| dispersion-and-group-velocity | FIG.19 · WAVES | FIG.23 · WAVES |
| kepler | FIG.20 · ORBITAL MECHANICS | FIG.24 · ORBITAL MECHANICS |
| universal-gravitation | FIG.21 · ORBITAL MECHANICS | FIG.25 · ORBITAL MECHANICS |
| energy-in-orbit | FIG.22 · ORBITAL MECHANICS | FIG.26 · ORBITAL MECHANICS |
| tides-and-three-body | FIG.23 · ORBITAL MECHANICS | FIG.27 · ORBITAL MECHANICS |
| pressure-and-buoyancy | FIG.24 · FLUIDS | FIG.28 · FLUIDS |
| bernoullis-principle | FIG.25 · FLUIDS | FIG.29 · FLUIDS |
| viscosity-and-reynolds-number | FIG.26 · FLUIDS | FIG.30 · FLUIDS |
| turbulence | FIG.27 · FLUIDS | FIG.31 · FLUIDS |
| the-principle-of-least-action | FIG.28 · LAGRANGIAN & HAMILTONIAN | FIG.32 · LAGRANGIAN & HAMILTONIAN |
| the-lagrangian | FIG.29 · LAGRANGIAN & HAMILTONIAN | FIG.33 · LAGRANGIAN & HAMILTONIAN |
| the-hamiltonian | FIG.30 · LAGRANGIAN & HAMILTONIAN | FIG.34 · LAGRANGIAN & HAMILTONIAN |
| phase-space | FIG.31 · LAGRANGIAN & HAMILTONIAN | FIG.35 · LAGRANGIAN & HAMILTONIAN |

Unchanged: `motion-in-a-straight-line` (FIG.01), `vectors-and-projectile-motion` (FIG.02), `newtons-three-laws` (FIG.03).

- [ ] **Step 3: Verify typecheck + tests**

Run: `cd /Users/romanpochtman/Developer/physics && pnpm tsc --noEmit`
Expected: no errors.

Run: `cd /Users/romanpochtman/Developer/physics && pnpm vitest run tests/content/`
Expected: all existing content tests still pass (they don't hard-code FIG numbers — only slug integrity).

- [ ] **Step 4: Commit**

```bash
cd /Users/romanpochtman/Developer/physics
git add lib/content/branches.ts
git commit -m "$(cat <<'EOF'
feat(branches): add 4 gap-closure classical mechanics topics + renumber FIG

Inserts Circular Motion (FIG.04), Non-Inertial Frames (FIG.06), Rolling
Motion (FIG.13), and Damped & Driven Oscillations (FIG.19). Renumbers
subsequent topics to keep FIG sequence contiguous across the branch.
Status: live (content to follow in Wave 4).

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

### Task 2: Add Coriolis to `physicists.ts`

**Files:**
- Modify: `/Users/romanpochtman/Developer/physics/lib/content/physicists.ts`

- [ ] **Step 1: Add the Coriolis `Physicist` entry**

Insert after an existing French physicist entry (e.g. after `leon-foucault`) for grouping:

```typescript
  {
    slug: "gaspard-gustave-de-coriolis",
    born: "1792",
    died: "1843",
    nationality: "French",
    image: storageUrl("physicists/gaspard-gustave-de-coriolis.avif"),
    relatedTopics: [
      { branchSlug: "classical-mechanics", topicSlug: "non-inertial-frames" },
    ],
  },
```

Note: the `storageUrl("physicists/gaspard-gustave-de-coriolis.avif")` reference is aspirational — the Supabase storage bucket may not yet contain that image file. That's acceptable for this task (the `image` field renders a broken image placeholder gracefully per existing conventions). A future image-upload task will address it.

- [ ] **Step 2: Verify typecheck**

Run: `cd /Users/romanpochtman/Developer/physics && pnpm tsc --noEmit`
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add lib/content/physicists.ts
git commit -m "$(cat <<'EOF'
feat(physicists): add Gaspard-Gustave de Coriolis

Relates to the new non-inertial-frames topic. Prose content seeded in
Wave 5 via scripts/content/seed-wave-6.ts.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

### Task 3: Add new glossary terms to `glossary.ts`

**Files:**
- Modify: `/Users/romanpochtman/Developer/physics/lib/content/glossary.ts`

- [ ] **Step 1: Verify which terms don't yet exist**

Run: `grep -E 'slug: "(angular-velocity|centrifugal-force|coriolis-force|forced-oscillation|amplitude-response|moment-arm)"' lib/content/glossary.ts`
Expected: empty output (none exist yet).

If any of the six DO match, skip that one in Step 2 below.

- [ ] **Step 2: Add missing `GlossaryTerm` entries**

Insert into `GLOSSARY` array (at the end is fine for diff clarity):

```typescript
  {
    slug: "angular-velocity",
    category: "concept",
    relatedTopics: [
      { branchSlug: "classical-mechanics", topicSlug: "circular-motion" },
      { branchSlug: "classical-mechanics", topicSlug: "torque-and-rotational-dynamics" },
    ],
  },
  {
    slug: "centrifugal-force",
    category: "concept",
    relatedPhysicists: ["christiaan-huygens"],
    relatedTopics: [
      { branchSlug: "classical-mechanics", topicSlug: "non-inertial-frames" },
    ],
  },
  {
    slug: "coriolis-force",
    category: "concept",
    relatedPhysicists: ["gaspard-gustave-de-coriolis"],
    relatedTopics: [
      { branchSlug: "classical-mechanics", topicSlug: "non-inertial-frames" },
    ],
  },
  {
    slug: "forced-oscillation",
    category: "concept",
    relatedTopics: [
      { branchSlug: "classical-mechanics", topicSlug: "damped-and-driven-oscillations" },
    ],
  },
  {
    slug: "amplitude-response",
    category: "concept",
    relatedTopics: [
      { branchSlug: "classical-mechanics", topicSlug: "damped-and-driven-oscillations" },
    ],
  },
  {
    slug: "moment-arm",
    category: "concept",
    relatedTopics: [
      { branchSlug: "classical-mechanics", topicSlug: "rolling-motion" },
      { branchSlug: "classical-mechanics", topicSlug: "torque-and-rotational-dynamics" },
    ],
  },
```

- [ ] **Step 3: Verify typecheck + tests**

Run: `pnpm tsc --noEmit && pnpm vitest run tests/content/`
Expected: clean.

- [ ] **Step 4: Commit**

```bash
git add lib/content/glossary.ts
git commit -m "$(cat <<'EOF'
feat(glossary): add 6 terms for gap-closure topics

angular-velocity, centrifugal-force, coriolis-force, forced-oscillation,
amplitude-response, moment-arm. Prose seeded in Wave 5.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Wave 2 — Physics libs (parallel, 4 agents)

All four tasks in this wave are independent and can run concurrently. Each produces one pure-TS module plus a vitest unit-test file.

### Task 4: `lib/physics/circular-motion.ts` + tests

**Files:**
- Create: `/Users/romanpochtman/Developer/physics/lib/physics/circular-motion.ts`
- Create: `/Users/romanpochtman/Developer/physics/tests/physics/circular-motion.test.ts`

- [ ] **Step 1: Write the failing test**

```typescript
// tests/physics/circular-motion.test.ts
import { describe, expect, it } from "vitest";
import {
  centripetalAccel,
  angularFromPeriod,
  orbitalVelocity,
} from "@/lib/physics/circular-motion";

describe("circular-motion", () => {
  it("centripetalAccel = v^2 / r", () => {
    expect(centripetalAccel(10, 2)).toBeCloseTo(50, 6);
  });

  it("angularFromPeriod(T) = 2π/T", () => {
    expect(angularFromPeriod(1)).toBeCloseTo(2 * Math.PI, 6);
  });

  it("orbitalVelocity gives v such that v^2/r = GM/r^2", () => {
    const GM = 3.986e14; // Earth
    const r = 6.771e6;   // LEO radius
    const v = orbitalVelocity(r, GM);
    expect(v).toBeCloseTo(Math.sqrt(GM / r), 0);
    // Sanity: centripetal a == g at LEO
    expect(centripetalAccel(v, r)).toBeCloseTo(GM / (r * r), 3);
  });
});
```

- [ ] **Step 2: Run to see failure**

Run: `pnpm vitest run tests/physics/circular-motion.test.ts`
Expected: FAIL (module does not exist).

- [ ] **Step 3: Implement `circular-motion.ts`**

```typescript
// lib/physics/circular-motion.ts
/**
 * Circular motion primitives. Pure functions — no side effects, no React.
 */

/** Centripetal acceleration a = v² / r. */
export function centripetalAccel(v: number, r: number): number {
  return (v * v) / r;
}

/** Angular velocity from period: ω = 2π / T. */
export function angularFromPeriod(T: number): number {
  return (2 * Math.PI) / T;
}

/** v = ω r. */
export function linearFromAngular(omega: number, r: number): number {
  return omega * r;
}

/**
 * Orbital velocity for a circular orbit of radius r around a mass with
 * gravitational parameter GM. Derived from setting centripetal acceleration
 * equal to Newtonian gravity: v² / r = GM / r² ⇒ v = √(GM / r).
 */
export function orbitalVelocity(r: number, GM: number): number {
  return Math.sqrt(GM / r);
}
```

- [ ] **Step 4: Run to verify pass**

Run: `pnpm vitest run tests/physics/circular-motion.test.ts`
Expected: 3 passed.

- [ ] **Step 5: Commit**

```bash
git add lib/physics/circular-motion.ts tests/physics/circular-motion.test.ts
git commit -m "$(cat <<'EOF'
feat(physics): circular-motion lib + tests

Centripetal acceleration, angular-to-linear conversion, orbital velocity.
Used by the new circular-motion topic.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

### Task 5: `lib/physics/rotating-frame.ts` + tests

**Files:**
- Create: `/Users/romanpochtman/Developer/physics/lib/physics/rotating-frame.ts`
- Create: `/Users/romanpochtman/Developer/physics/tests/physics/rotating-frame.test.ts`

- [ ] **Step 1: Write the failing test**

```typescript
// tests/physics/rotating-frame.test.ts
import { describe, expect, it } from "vitest";
import {
  coriolisAccel2D,
  centrifugalAccel2D,
  foucaultRotationPeriodHours,
  EARTH_OMEGA,
} from "@/lib/physics/rotating-frame";

describe("rotating-frame", () => {
  it("coriolisAccel2D = -2 Ω × v", () => {
    // Ω along +z, v along +x: -2 ẑ × x̂ = -2 ŷ (deflects to the right when Ω>0)
    const a = coriolisAccel2D({ omegaZ: 1 }, { x: 1, y: 0 });
    expect(a.x).toBeCloseTo(0, 6);
    expect(a.y).toBeCloseTo(-2, 6);
  });

  it("centrifugalAccel2D = Ω² r (outward radial)", () => {
    const a = centrifugalAccel2D({ omegaZ: 2 }, { x: 3, y: 0 });
    expect(a.x).toBeCloseTo(12, 6);
    expect(a.y).toBeCloseTo(0, 6);
  });

  it("Foucault pendulum at pole completes 360° in one sidereal day (~23.93h)", () => {
    const T = foucaultRotationPeriodHours(90);
    expect(T).toBeCloseTo(23.93, 1);
  });

  it("Foucault pendulum at Paris (48.85°) completes 360° in ~31.7h", () => {
    const T = foucaultRotationPeriodHours(48.85);
    expect(T).toBeCloseTo(31.8, 0);
  });

  it("Foucault period diverges at equator", () => {
    expect(Number.isFinite(foucaultRotationPeriodHours(0))).toBe(false);
  });

  it("EARTH_OMEGA ≈ 7.292e-5 rad/s", () => {
    expect(EARTH_OMEGA).toBeCloseTo(7.292e-5, 8);
  });
});
```

- [ ] **Step 2: Run to see failure**

Run: `pnpm vitest run tests/physics/rotating-frame.test.ts`
Expected: FAIL.

- [ ] **Step 3: Implement `rotating-frame.ts`**

```typescript
// lib/physics/rotating-frame.ts
/**
 * Rotating-reference-frame fictitious forces and Earth-frame convenience
 * values. All 2D vectors assume the rotation axis is +z.
 */

export const EARTH_OMEGA = (2 * Math.PI) / (23.9344696 * 3600); // rad/s, sidereal

export interface Omega2D {
  /** Signed scalar: magnitude of Ω, positive means counter-clockwise. */
  omegaZ: number;
}

export interface Vec2 {
  x: number;
  y: number;
}

/**
 * Coriolis acceleration in 2D: a_C = -2 Ω × v.
 * With Ω = omegaZ ẑ and v = (vx, vy, 0):
 *   -2 Ω × v = -2 omegaZ (-vy, vx, 0) = (2 omegaZ vy, -2 omegaZ vx, 0).
 */
export function coriolisAccel2D(omega: Omega2D, v: Vec2): Vec2 {
  return {
    x: 2 * omega.omegaZ * v.y,
    y: -2 * omega.omegaZ * v.x,
  };
}

/**
 * Centrifugal acceleration: a_cf = -Ω × (Ω × r) = Ω² r (outward).
 */
export function centrifugalAccel2D(omega: Omega2D, r: Vec2): Vec2 {
  const w2 = omega.omegaZ * omega.omegaZ;
  return { x: w2 * r.x, y: w2 * r.y };
}

/**
 * Period for a Foucault pendulum's plane of oscillation to complete one
 * full rotation, in hours. T = (2π) / (Ω_Earth · sin(latitude)).
 * Diverges at the equator (returns Infinity).
 */
export function foucaultRotationPeriodHours(latitudeDegrees: number): number {
  const sinLat = Math.sin((latitudeDegrees * Math.PI) / 180);
  if (sinLat === 0) return Infinity;
  const periodSeconds = (2 * Math.PI) / (EARTH_OMEGA * sinLat);
  return Math.abs(periodSeconds) / 3600;
}
```

- [ ] **Step 4: Run to verify pass**

Run: `pnpm vitest run tests/physics/rotating-frame.test.ts`
Expected: 6 passed.

- [ ] **Step 5: Commit**

```bash
git add lib/physics/rotating-frame.ts tests/physics/rotating-frame.test.ts
git commit -m "$(cat <<'EOF'
feat(physics): rotating-frame lib + tests

Coriolis, centrifugal, Foucault rotation period, Earth Ω constant.
Used by the new non-inertial-frames topic.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

### Task 6: `lib/physics/rolling.ts` + tests

**Files:**
- Create: `/Users/romanpochtman/Developer/physics/lib/physics/rolling.ts`
- Create: `/Users/romanpochtman/Developer/physics/tests/physics/rolling.test.ts`

- [ ] **Step 1: Write the failing test**

```typescript
// tests/physics/rolling.test.ts
import { describe, expect, it } from "vitest";
import {
  rollingKE,
  inclineAcceleration,
  SHAPE_FACTOR,
  requiredStaticFriction,
} from "@/lib/physics/rolling";

describe("rolling", () => {
  it("rollingKE = ½mv² + ½Iω² with v=ωR", () => {
    // Solid sphere: I = (2/5) m R², shapeFactor k = I/(mR²) = 2/5
    // KE_total / KE_linear = 1 + k
    const m = 1, v = 3, R = 0.5;
    const I = (2 / 5) * m * R * R;
    const omega = v / R;
    const expected = 0.5 * m * v * v + 0.5 * I * omega * omega;
    expect(rollingKE(m, I, v, R)).toBeCloseTo(expected, 10);
  });

  it("solid sphere rolls down incline faster than hollow cylinder (same angle)", () => {
    const theta = Math.PI / 6;
    const aSphere = inclineAcceleration(SHAPE_FACTOR.solidSphere, theta);
    const aHollow = inclineAcceleration(SHAPE_FACTOR.hollowCylinder, theta);
    expect(aSphere).toBeGreaterThan(aHollow);
  });

  it("solid sphere incline a = (5/7) g sin θ", () => {
    const g = 9.81;
    const theta = Math.PI / 4;
    const expected = (5 / 7) * g * Math.sin(theta);
    expect(inclineAcceleration(SHAPE_FACTOR.solidSphere, theta)).toBeCloseTo(expected, 6);
  });

  it("SHAPE_FACTOR values match standard moments of inertia", () => {
    expect(SHAPE_FACTOR.solidSphere).toBeCloseTo(2 / 5, 10);
    expect(SHAPE_FACTOR.hollowSphere).toBeCloseTo(2 / 3, 10);
    expect(SHAPE_FACTOR.solidCylinder).toBeCloseTo(1 / 2, 10);
    expect(SHAPE_FACTOR.hollowCylinder).toBeCloseTo(1, 10);
  });

  it("requiredStaticFriction scales with k/(1+k) · tan θ", () => {
    // For a solid sphere (k=2/5) at θ=30°, mu_req = (2/7) tan(30°)
    const mu = requiredStaticFriction(SHAPE_FACTOR.solidSphere, Math.PI / 6);
    expect(mu).toBeCloseTo((2 / 7) * Math.tan(Math.PI / 6), 6);
  });
});
```

- [ ] **Step 2: Run to see failure**

Run: `pnpm vitest run tests/physics/rolling.test.ts`
Expected: FAIL.

- [ ] **Step 3: Implement `rolling.ts`**

```typescript
// lib/physics/rolling.ts
/**
 * Rolling-without-slipping dynamics for rigid bodies.
 *
 * A body rolling without slipping has v = ω R, so the total kinetic energy
 * is (½ + ½ k) m v² where k = I / (m R²) is the shape factor. Rolling down
 * a frictionless incline, the translational equation of motion becomes
 *   m a = m g sin θ − f
 * and the rotational equation of motion becomes
 *   I α = f R       with α = a / R
 * Eliminating f yields a = g sin θ / (1 + k), our core result.
 */

export const SHAPE_FACTOR = {
  solidSphere: 2 / 5,
  hollowSphere: 2 / 3,
  solidCylinder: 1 / 2,
  hollowCylinder: 1,
} as const;

export type ShapeName = keyof typeof SHAPE_FACTOR;

/** Total kinetic energy of a rolling body, given I explicitly. */
export function rollingKE(m: number, I: number, v: number, R: number): number {
  const omega = v / R;
  return 0.5 * m * v * v + 0.5 * I * omega * omega;
}

/**
 * Linear acceleration down an incline for a rolling body with shape factor
 * k = I / (m R²). a = g sin θ / (1 + k).
 */
export function inclineAcceleration(
  shapeFactor: number,
  thetaRadians: number,
  g: number = 9.81,
): number {
  return (g * Math.sin(thetaRadians)) / (1 + shapeFactor);
}

/**
 * Minimum coefficient of static friction required to roll without slipping
 * down an incline. Derived from f = m a k, with a from inclineAcceleration:
 *   μ_req = k tan(θ) / (1 + k).
 */
export function requiredStaticFriction(
  shapeFactor: number,
  thetaRadians: number,
): number {
  return (shapeFactor * Math.tan(thetaRadians)) / (1 + shapeFactor);
}
```

- [ ] **Step 4: Run to verify pass**

Run: `pnpm vitest run tests/physics/rolling.test.ts`
Expected: 5 passed.

- [ ] **Step 5: Commit**

```bash
git add lib/physics/rolling.ts tests/physics/rolling.test.ts
git commit -m "$(cat <<'EOF'
feat(physics): rolling lib + tests

Rolling KE, incline acceleration by shape factor, required static friction.
Used by the new rolling-motion topic.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

### Task 7: Verify `damped-oscillator.ts` covers the damped-and-driven topic needs

**Files:**
- Read: `/Users/romanpochtman/Developer/physics/lib/physics/damped-oscillator.ts`
- Possibly modify if a helper is missing.

- [ ] **Step 1: Read the existing file**

Verify that `dampedFree`, `drivenAmplitude`, and `qualityFactor` are exported and match this plan's needs:
- Triptych scene: `dampedFree(t, x0, {omega0, gamma})` — exists.
- Quality factor HUD: `qualityFactor({omega0, gamma})` — exists.
- Resonance curve: `drivenAmplitude(omegaD, F0, {omega0, gamma})` — exists.

- [ ] **Step 2: Check if a phase helper is needed**

The plan's FIG.04 (Tacoma-style resonance) wants a phase-vs-drive-frequency sub-panel eventually. If the subagent building the topic decides it's needed, they'll add `drivenPhase(omegaD, params)` here. Otherwise skip — YAGNI.

- [ ] **Step 3: If nothing to add, no-op; otherwise commit the new helper**

If a new helper is added:

```bash
git add lib/physics/damped-oscillator.ts tests/physics/damped-oscillator.test.ts
git commit -m "feat(physics): add drivenPhase helper for damped-and-driven topic"
```

Otherwise move on.

---

## Wave 3 — Visualization components (parallel, 4 agents)

All four tasks in this wave are independent, but they all must complete before the per-topic MDX content in Wave 4 can import them. Each agent creates 3–4 scene components following the conventions in sibling scenes (Canvas 2D + cyan/magenta palette + mono HUD with `backdrop-blur`, inside a `SceneCard`). Each agent also registers its new components in `visualization-registry.tsx`.

Reference siblings to model on: `components/physics/pendulum-scene.tsx`, `components/physics/damped-pendulum-scene.tsx`, `components/physics/shm-oscillator-scene.tsx`.

### Task 8: Circular-motion scene components

**Files:**
- Create: `components/physics/velocity-triangle-scene.tsx`
- Create: `components/physics/centripetal-force-scene.tsx`
- Create: `components/physics/angular-velocity-scene.tsx`
- Create: `components/physics/newtons-cannon-scene.tsx`
- Modify: `components/physics/visualization-registry.tsx`

- [ ] **Step 1: Create `velocity-triangle-scene.tsx`**

Client component, `"use client"` at top. Canvas 2D. Shows a particle on a circle of radius r (use 140px on a 320x320 canvas). At each frame, draw the velocity vector v (tangent) and the vector v + dv after a small rotation dθ. Also draw the dv vector itself in magenta, highlighting that it points toward the center. HUD in bottom-right shows `|v| = constant`, `|dv| = v · dθ`, `a_c = v²/r`. RAF loop at 60fps; dθ should complete 2π over ~4 seconds. Cleanup on unmount.

Export named: `export function VelocityTriangleScene()`. Use inside a `<SceneCard caption="FIG.04a — velocity triangle">`.

- [ ] **Step 2: Create `centripetal-force-scene.tsx`**

Three stacked rows in a single canvas (or three separate `<SceneCard>`-wrapped sub-canvases — pick whichever matches the sibling component style you find). Each row shows a different centripetal-force source:
1. Ball on string (taut line from pivot, labeled "T").
2. Earth orbiting Sun (line labeled "F_g").
3. Car on banked curve (wheel contact with friction arrow labeled "f_s").

All three have the same numerical motion parameters. HUD shows `F = mv²/r` with the row's specific F value.

- [ ] **Step 3: Create `angular-velocity-scene.tsx`**

Canvas with a wheel of radius R = 100px. A red dot on the rim rotates at ω. Below (or to the side) a mono panel shows `ω = 2π/T`, `v = ωR`, updating with a slider that changes T. Slider range T ∈ [0.5s, 5s].

- [ ] **Step 4: Create `newtons-cannon-scene.tsx`**

Canvas, ~400x300. Fixed "Earth" disk (cyan outline, 80px radius) centered. Cannon at top of disk. Slider for muzzle velocity v₀. Numerically integrate gravity toward Earth center (use `lib/physics/ode.ts` RK4 helper if useful — check for it first; otherwise inline Euler is fine given short integration horizon). Below v_orbital (≈ 7.9 km/s but scaled): trajectory hits ground. At v_orbital: closed circle. Above: ellipse. Label the three regimes with cyan/magenta highlights.

- [ ] **Step 5: Register all four in `visualization-registry.tsx`**

For each component:
1. Add a `dynamic()` import block (following the existing pattern for `*-scene.tsx` imports).
2. Add entry in the `VISUALIZATIONS` record with a kebab-case key.

```typescript
const VelocityTriangleScene = dynamic(
  () =>
    import("@/components/physics/velocity-triangle-scene").then((m) => ({
      default: m.VelocityTriangleScene,
    })),
  { ssr: false },
);

const CentripetalForceScene = dynamic(
  () =>
    import("@/components/physics/centripetal-force-scene").then((m) => ({
      default: m.CentripetalForceScene,
    })),
  { ssr: false },
);

const AngularVelocityScene = dynamic(
  () =>
    import("@/components/physics/angular-velocity-scene").then((m) => ({
      default: m.AngularVelocityScene,
    })),
  { ssr: false },
);

const NewtonsCannonScene = dynamic(
  () =>
    import("@/components/physics/newtons-cannon-scene").then((m) => ({
      default: m.NewtonsCannonScene,
    })),
  { ssr: false },
);
```

And inside the `VISUALIZATIONS` record:

```typescript
  "velocity-triangle": VelocityTriangleScene,
  "centripetal-force": CentripetalForceScene,
  "angular-velocity": AngularVelocityScene,
  "newtons-cannon": NewtonsCannonScene,
```

- [ ] **Step 6: Verify build**

Run: `pnpm tsc --noEmit`
Expected: clean.

- [ ] **Step 7: Commit**

```bash
git add components/physics/velocity-triangle-scene.tsx components/physics/centripetal-force-scene.tsx components/physics/angular-velocity-scene.tsx components/physics/newtons-cannon-scene.tsx components/physics/visualization-registry.tsx
git commit -m "feat(physics/viz): circular-motion scenes — velocity triangle, centripetal force, angular velocity, Newton's cannon

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

### Task 9: Non-inertial-frames scene components

**Files:**
- Create: `components/physics/carousel-scene.tsx`
- Create: `components/physics/coriolis-turntable-scene.tsx`
- Create: `components/physics/coriolis-globe-scene.tsx`
- Create: `components/physics/rotating-projectile-scene.tsx`
- Modify: `components/physics/visualization-registry.tsx`

Use `lib/physics/rotating-frame.ts` helpers in all four components.

- [ ] **Step 1: Create `carousel-scene.tsx`**

Top-down turntable rotating at Ω. A rider (dot) sits at radius r. A ball (smaller dot) starts at center, given small velocity outward in inertial frame. Toggle button switches between "rider's view" (rotating with carousel — ball appears to curve) and "outside view" (ball appears to go straight; carousel visibly rotates). HUD shows `Ω`, `r`, and which frame is active.

- [ ] **Step 2: Create `coriolis-turntable-scene.tsx`**

Same physics as carousel but focus on Coriolis: launch a ball from the center outward along +x in inertial frame. Draw both trajectories simultaneously on the same canvas: one in the lab frame (straight line) and one in the rotating frame (the same trajectory, transformed — curved). Use `coriolisAccel2D` in the integration to drive the rotating-frame trace. HUD shows live Coriolis acceleration magnitude.

- [ ] **Step 3: Create `coriolis-globe-scene.tsx`**

2D polar projection of Earth (two circles: Arctic + Antarctic limits). North-hemisphere wind arrows curve right; south curves left. Slider for latitude updates a readout showing `T_Foucault = foucaultRotationPeriodHours(lat)`. At the pole the period is ~23.9h; at the equator it's labeled "∞ — Foucault fails here".

- [ ] **Step 4: Create `rotating-projectile-scene.tsx`**

Two side-by-side mini-canvases: the same projectile (same initial v, same gravity) in an inertial frame (parabola) vs a rotating frame (spiral, with Coriolis deflection). Slider for Ω.

- [ ] **Step 5: Register all four**

```typescript
const CarouselScene = dynamic(() => import("@/components/physics/carousel-scene").then((m) => ({ default: m.CarouselScene })), { ssr: false });
const CoriolisTurntableScene = dynamic(() => import("@/components/physics/coriolis-turntable-scene").then((m) => ({ default: m.CoriolisTurntableScene })), { ssr: false });
const CoriolisGlobeScene = dynamic(() => import("@/components/physics/coriolis-globe-scene").then((m) => ({ default: m.CoriolisGlobeScene })), { ssr: false });
const RotatingProjectileScene = dynamic(() => import("@/components/physics/rotating-projectile-scene").then((m) => ({ default: m.RotatingProjectileScene })), { ssr: false });
```

Record entries:
```typescript
  "carousel": CarouselScene,
  "coriolis-turntable": CoriolisTurntableScene,
  "coriolis-globe": CoriolisGlobeScene,
  "rotating-projectile": RotatingProjectileScene,
```

- [ ] **Step 6: Verify + commit**

```bash
pnpm tsc --noEmit
git add components/physics/carousel-scene.tsx components/physics/coriolis-turntable-scene.tsx components/physics/coriolis-globe-scene.tsx components/physics/rotating-projectile-scene.tsx components/physics/visualization-registry.tsx
git commit -m "feat(physics/viz): non-inertial-frame scenes — carousel, coriolis turntable, coriolis globe, rotating projectile

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

### Task 10: Rolling-motion scene components

**Files:**
- Create: `components/physics/wheel-decomposition-scene.tsx`
- Create: `components/physics/rolling-race-scene.tsx`
- Create: `components/physics/rolling-slipping-scene.tsx`
- Create: `components/physics/coin-rolling-scene.tsx`
- Modify: `components/physics/visualization-registry.tsx`

Use `lib/physics/rolling.ts`.

- [ ] **Step 1: Create `wheel-decomposition-scene.tsx`**

Canvas, wheel radius R = 80px rolling left-to-right. A highlighted rim point traces a cycloid (use existing `lib/physics/cycloid.ts` if already present — check). Velocity vectors drawn at top (length 2v, cyan), center (length v, cyan), bottom (length 0, red dot).

- [ ] **Step 2: Create `rolling-race-scene.tsx`**

Inclined plane. Three rolling bodies of same mass and radius start at the top simultaneously: solid sphere, solid cylinder, hollow cylinder. Use `inclineAcceleration(SHAPE_FACTOR.X, theta)` for each. Include a start-over button. Below the incline, a position-vs-time graph plots all three curves live.

- [ ] **Step 3: Create `rolling-slipping-scene.tsx`**

Single inclined plane with angle slider (0° → 80°). Single rolling body (solid sphere). Also a μ_s slider for the surface. Body renders **cyan** when `requiredStaticFriction(shapeFactor, theta) ≤ μ_s` (rolls cleanly) and **red** when the inequality fails (would slip). HUD shows both μ_req and μ_s.

- [ ] **Step 4: Create `coin-rolling-scene.tsx`**

Canvas showing a coin (tilted disc) rolling in a circle on a flat surface, precessing. Decorative — no interactivity needed beyond visual loop. Foreshadows the gyroscopes topic.

- [ ] **Step 5: Register all four**

```typescript
const WheelDecompositionScene = dynamic(() => import("@/components/physics/wheel-decomposition-scene").then((m) => ({ default: m.WheelDecompositionScene })), { ssr: false });
const RollingRaceScene = dynamic(() => import("@/components/physics/rolling-race-scene").then((m) => ({ default: m.RollingRaceScene })), { ssr: false });
const RollingSlippingScene = dynamic(() => import("@/components/physics/rolling-slipping-scene").then((m) => ({ default: m.RollingSlippingScene })), { ssr: false });
const CoinRollingScene = dynamic(() => import("@/components/physics/coin-rolling-scene").then((m) => ({ default: m.CoinRollingScene })), { ssr: false });
```

Record entries:
```typescript
  "wheel-decomposition": WheelDecompositionScene,
  "rolling-race": RollingRaceScene,
  "rolling-slipping": RollingSlippingScene,
  "coin-rolling": CoinRollingScene,
```

- [ ] **Step 6: Verify + commit**

```bash
pnpm tsc --noEmit
git add components/physics/wheel-decomposition-scene.tsx components/physics/rolling-race-scene.tsx components/physics/rolling-slipping-scene.tsx components/physics/coin-rolling-scene.tsx components/physics/visualization-registry.tsx
git commit -m "feat(physics/viz): rolling-motion scenes — wheel decomposition, ramp race, slipping threshold, coin roll

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

### Task 11: Damped & driven scene components

**Files:**
- Create: `components/physics/damped-regimes-scene.tsx`
- Create: `components/physics/quality-factor-scene.tsx`
- Modify: `components/physics/visualization-registry.tsx`
- (No-op move for `damped-pendulum-scene.tsx` and `resonance-curve-scene.tsx` — they already exist and are already registered.)

Use `lib/physics/damped-oscillator.ts`.

- [ ] **Step 1: Create `damped-regimes-scene.tsx`**

Three side-by-side mini-plots of x(t): underdamped (γ/2 < ω₀), critically damped (γ/2 = ω₀), overdamped (γ/2 > ω₀). Use `dampedFree(t, x0, {omega0, gamma})`. Each plot runs 0 → 10s. Magenta dashed envelope on the underdamped plot showing ±x₀ e^(-γt/2). Stacked label strip showing the γ value used in each.

- [ ] **Step 2: Create `quality-factor-scene.tsx`**

Single oscillator x(t) plot with a log-scale Q slider (Q ∈ [1, 10⁴]). Set ω₀ = 2π rad/s (1 Hz). Compute γ = ω₀ / Q. HUD shows current Q, approximate number of oscillations to amplitude 1/e (≈ Q/π), and four preset comparison rows: pendulum clock (Q~100), tuning fork (Q~1000), quartz crystal (Q~10⁴), LIGO mirror (Q~10⁸).

- [ ] **Step 3: Register new components**

```typescript
const DampedRegimesScene = dynamic(() => import("@/components/physics/damped-regimes-scene").then((m) => ({ default: m.DampedRegimesScene })), { ssr: false });
const QualityFactorScene = dynamic(() => import("@/components/physics/quality-factor-scene").then((m) => ({ default: m.QualityFactorScene })), { ssr: false });
```

Record entries:
```typescript
  "damped-regimes": DampedRegimesScene,
  "quality-factor": QualityFactorScene,
```

- [ ] **Step 4: Verify + commit**

```bash
pnpm tsc --noEmit
git add components/physics/damped-regimes-scene.tsx components/physics/quality-factor-scene.tsx components/physics/visualization-registry.tsx
git commit -m "feat(physics/viz): damped-driven scenes — damped regimes triptych, quality factor explorer

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

## Wave 4 — Topic pages & content (parallel, 4 agents + 1 cleanup)

Each of Tasks 12–15 creates one topic's `page.tsx` and `content.en.mdx`. Task 16 trims `oscillators-everywhere/content.en.mdx` so it no longer uses the damped/resonance scenes that now belong to the new topic. These five tasks are all independent and can run in parallel.

All Wave 4 tasks must:
- Reference the per-section outline in the spec (`docs/superpowers/specs/2026-04-22-classical-mechanics-gap-closure.md`) — the spec describes what each section should cover, what figure(s) it contains, and what physicists/terms to link inline.
- Match the voice of `oscillators-everywhere/content.en.mdx` (Kurzgesagt meets Stripe docs; no calculus assumed but shown; one period-correct historical hook per section; ~150–220 lines MDX per topic).
- Import the scene components directly in the MDX header (see `oscillators-everywhere/content.en.mdx` lines 1–11 for pattern).

### Task 12: Circular-Motion topic (`page.tsx` + `content.en.mdx`)

**Files:**
- Create: `app/[locale]/(topics)/classical-mechanics/circular-motion/page.tsx`
- Create: `app/[locale]/(topics)/classical-mechanics/circular-motion/content.en.mdx`

- [ ] **Step 1: Create `page.tsx`** — copy the shell from `the-simple-pendulum/page.tsx`, change SLUG only:

```typescript
import { notFound } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import { locales } from "@/i18n/config";
import { getContentEntry } from "@/lib/content/fetch";
import { ContentBlocks } from "@/components/content/content-blocks";
import { TopicHeader } from "@/components/layout/topic-header";
import { TopicPageLayout } from "@/components/layout/topic-page-layout";
import type { AsideLink } from "@/components/layout/aside-links";

const SLUG = "classical-mechanics/circular-motion";

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export default async function Page({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const entry = await getContentEntry("topic", SLUG, locale);
  if (!entry) notFound();

  const aside = Array.isArray(entry.meta.aside)
    ? (entry.meta.aside as AsideLink[])
    : [];
  const eyebrow =
    typeof entry.meta.eyebrow === "string" ? entry.meta.eyebrow : "";

  return (
    <TopicPageLayout aside={aside}>
      <TopicHeader
        eyebrow={eyebrow}
        title={entry.title}
        subtitle={entry.subtitle ?? ""}
      />
      {entry.localeFallback ? (
        <p className="mt-2 font-mono text-xs opacity-60">
          Translation pending. Showing English.
        </p>
      ) : null}
      <ContentBlocks blocks={entry.blocks} />
    </TopicPageLayout>
  );
}
```

- [ ] **Step 2: Create `content.en.mdx`** — Follow the 6-section structure in the spec (§ 1 Circular Motion). Header:

```mdx
import { TopicHeader } from "@/components/layout/topic-header";
import { Section } from "@/components/layout/section";
import { SceneCard } from "@/components/layout/scene-card";
import { EquationBlock } from "@/components/math/equation-block";
import { Callout } from "@/components/layout/callout";
import { VelocityTriangleScene } from "@/components/physics/velocity-triangle-scene";
import { CentripetalForceScene } from "@/components/physics/centripetal-force-scene";
import { AngularVelocityScene } from "@/components/physics/angular-velocity-scene";
import { NewtonsCannonScene } from "@/components/physics/newtons-cannon-scene";
import { TopicPageLayout } from "@/components/layout/topic-page-layout";

<TopicPageLayout aside={[
  { type: "physicist", label: "Isaac Newton", href: "/physicists/isaac-newton" },
  { type: "physicist", label: "Christiaan Huygens", href: "/physicists/christiaan-huygens" },
  { type: "physicist", label: "Galileo Galilei", href: "/physicists/galileo-galilei" },
  { type: "term", label: "Centripetal force", href: "/dictionary/centripetal-force" },
  { type: "term", label: "Angular velocity", href: "/dictionary/angular-velocity" },
  { type: "term", label: "Inertial frame", href: "/dictionary/inertial-frame" },
]}>

<TopicHeader
  eyebrow="§ 01 · CLASSICAL MECHANICS"
  title="CIRCULAR MOTION"
  subtitle="Why the string always pulls inward — and why the Moon never stops falling."
/>

<Section index={1} title="The puzzle">
...
```

Full prose sections as described in the spec. Equation count: 4. Figure placements per spec:
- FIG.04a (VelocityTriangleScene) in §2
- FIG.04b (CentripetalForceScene) in §3
- FIG.04c (AngularVelocityScene) in §4
- FIG.04d (NewtonsCannonScene) in §5

Inline link patterns (follow existing MDX conventions): `<PhysicistLink slug="isaac-newton">Newton</PhysicistLink>`, `<Term slug="centripetal-force">centripetal</Term>`. `PhysicistLink` and `Term` are registered globally in `mdx-components.tsx` — no import needed.

Close with `</TopicPageLayout>`.

- [ ] **Step 3: Verify MDX parses and typecheck passes**

Run: `pnpm tsc --noEmit`
Expected: clean.

Run: `pnpm build` — **skip for now; defer to Wave 5**. (Build will fail until content is published to Supabase, because `page.tsx` fetches from DB.)

- [ ] **Step 4: Commit**

```bash
git add "app/[locale]/(topics)/classical-mechanics/circular-motion"
git commit -m "feat(topics): circular motion page + content

FIG.04 · KINEMATICS & NEWTON. Six sections covering centripetal
acceleration, angular velocity, and Newton's cannon thought experiment.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

### Task 13: Non-Inertial Frames topic

**Files:**
- Create: `app/[locale]/(topics)/classical-mechanics/non-inertial-frames/page.tsx`
- Create: `app/[locale]/(topics)/classical-mechanics/non-inertial-frames/content.en.mdx`

- [ ] **Step 1: Create `page.tsx`** — same shell as Task 12 but `const SLUG = "classical-mechanics/non-inertial-frames";`.

- [ ] **Step 2: Create `content.en.mdx`** — follow spec section § 3 Non-Inertial Reference Frames. Seven sections, 4 equations, 4 figures. Imports:

```mdx
import { CarouselScene } from "@/components/physics/carousel-scene";
import { CoriolisTurntableScene } from "@/components/physics/coriolis-turntable-scene";
import { CoriolisGlobeScene } from "@/components/physics/coriolis-globe-scene";
import { RotatingProjectileScene } from "@/components/physics/rotating-projectile-scene";
```

Plus the standard TopicHeader/Section/SceneCard/EquationBlock/Callout/TopicPageLayout imports.

Aside:
```mdx
<TopicPageLayout aside={[
  { type: "physicist", label: "Gaspard-Gustave de Coriolis", href: "/physicists/gaspard-gustave-de-coriolis" },
  { type: "physicist", label: "Léon Foucault", href: "/physicists/leon-foucault" },
  { type: "physicist", label: "Jean d'Alembert", href: "/physicists/jean-d-alembert" },
  { type: "term", label: "Inertial frame", href: "/dictionary/inertial-frame" },
  { type: "term", label: "Centrifugal force", href: "/dictionary/centrifugal-force" },
  { type: "term", label: "Coriolis force", href: "/dictionary/coriolis-force" },
]}>
```

Eyebrow: `§ 01 · CLASSICAL MECHANICS`.

- [ ] **Step 3: Commit**

```bash
git add "app/[locale]/(topics)/classical-mechanics/non-inertial-frames"
git commit -m "feat(topics): non-inertial reference frames page + content

FIG.06 · KINEMATICS & NEWTON. Centrifugal, Coriolis, Foucault, and the
rotating Earth. Seven sections.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

### Task 14: Rolling Motion topic

**Files:**
- Create: `app/[locale]/(topics)/classical-mechanics/rolling-motion/page.tsx`
- Create: `app/[locale]/(topics)/classical-mechanics/rolling-motion/content.en.mdx`

- [ ] **Step 1: Create `page.tsx`** — shell with `const SLUG = "classical-mechanics/rolling-motion";`.

- [ ] **Step 2: Create `content.en.mdx`** — follow spec § 4. Six sections, 4 equations, 4 figures.

Imports:
```mdx
import { WheelDecompositionScene } from "@/components/physics/wheel-decomposition-scene";
import { RollingRaceScene } from "@/components/physics/rolling-race-scene";
import { RollingSlippingScene } from "@/components/physics/rolling-slipping-scene";
import { CoinRollingScene } from "@/components/physics/coin-rolling-scene";
```

Aside:
```mdx
<TopicPageLayout aside={[
  { type: "physicist", label: "Isaac Newton", href: "/physicists/isaac-newton" },
  { type: "physicist", label: "Leonhard Euler", href: "/physicists/leonhard-euler" },
  { type: "physicist", label: "Archimedes", href: "/physicists/archimedes" },
  { type: "term", label: "Rolling without slipping", href: "/dictionary/rolling-without-slipping" },
  { type: "term", label: "Moment of inertia", href: "/classical-mechanics/moment-of-inertia" },
  { type: "term", label: "Moment arm", href: "/dictionary/moment-arm" },
]}>
```

- [ ] **Step 3: Commit**

```bash
git add "app/[locale]/(topics)/classical-mechanics/rolling-motion"
git commit -m "feat(topics): rolling motion page + content

FIG.13 · ROTATION & RIGID BODIES. Six sections covering the no-slip
constraint, rolling KE, the race down the incline, and where the
constraint breaks.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

### Task 15: Damped & Driven Oscillations topic

**Files:**
- Create: `app/[locale]/(topics)/classical-mechanics/damped-and-driven-oscillations/page.tsx`
- Create: `app/[locale]/(topics)/classical-mechanics/damped-and-driven-oscillations/content.en.mdx`

- [ ] **Step 1: Create `page.tsx`** — shell with `const SLUG = "classical-mechanics/damped-and-driven-oscillations";`.

- [ ] **Step 2: Create `content.en.mdx`** — follow spec § 5. Seven sections, 4 equations, 4 figures. The resonance-curve-scene and damped-pendulum-scene are **moved from oscillators-everywhere** to here.

Imports:
```mdx
import { DampedRegimesScene } from "@/components/physics/damped-regimes-scene";
import { QualityFactorScene } from "@/components/physics/quality-factor-scene";
import { ResonanceCurveScene } from "@/components/physics/resonance-curve-scene";
import { DampedPendulumScene } from "@/components/physics/damped-pendulum-scene";
```

Aside:
```mdx
<TopicPageLayout aside={[
  { type: "physicist", label: "John William Strutt (Rayleigh)", href: "/physicists/john-william-strutt-rayleigh" },
  { type: "physicist", label: "Robert Hooke", href: "/physicists/robert-hooke" },
  { type: "physicist", label: "Nikola Tesla", href: "/physicists/nikola-tesla" },
  { type: "term", label: "Damping", href: "/dictionary/damping" },
  { type: "term", label: "Quality factor", href: "/dictionary/q-factor" },
  { type: "term", label: "Resonance", href: "/dictionary/resonance" },
  { type: "term", label: "Forced oscillation", href: "/dictionary/forced-oscillation" },
  { type: "term", label: "Amplitude response", href: "/dictionary/amplitude-response" },
]}>
```

Include the Tacoma Narrows story from the existing `oscillators-everywhere` § 5 Resonance (lines ~115–131 in the current MDX) — it moves here.

- [ ] **Step 3: Commit**

```bash
git add "app/[locale]/(topics)/classical-mechanics/damped-and-driven-oscillations"
git commit -m "feat(topics): damped and driven oscillations page + content

FIG.19 · OSCILLATIONS. Seven sections covering the three damping regimes,
Q factor, forced response, resonance, and the Tacoma Narrows collapse.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

### Task 16: Trim `oscillators-everywhere/content.en.mdx`

**Files:**
- Modify: `app/[locale]/(topics)/classical-mechanics/oscillators-everywhere/content.en.mdx`

- [ ] **Step 1: Read the current file end-to-end**

Run: `cat "app/[locale]/(topics)/classical-mechanics/oscillators-everywhere/content.en.mdx"`

Identify the two sections that now live in the damped-and-driven topic:
- **§4 Driving force** (lines ~100–113 in the current file, using `<DampedPendulumScene />`) — **remove**.
- **§5 Resonance** (lines ~115–131, using `<ResonanceCurveScene />`) — **remove**.

Sections §6 Coupled oscillators (`<CoupledPendulumScene />`, `<Term slug="beats">`, `<Term slug="normal-modes">`, `<PhysicistLink slug="jules-lissajous">`) and §7 From oscillators to waves (`<WaveChainScene />`, `<PhysicistLink slug="leon-foucault">`) **stay** — they still belong in oscillators-everywhere.

After removal, renumber remaining sections so the index prop stays contiguous: §1 The universal pattern, §2 The archetypes, §3 Damping introduces energy loss (if it exists; otherwise §1, §2, §3 Coupled, §4 From oscillators to waves).

- [ ] **Step 2: Remove unused imports**

Delete imports for `DampedPendulumScene` and `ResonanceCurveScene` from the MDX header at the top of the file.

- [ ] **Step 3: Retune the transition prose**

The section that used to precede the removed ones likely had a transition sentence like "…but what if you keep pushing…". Rewrite so it flows into Coupled Oscillators instead, or add a one-sentence pointer: `Once you let the oscillator interact with the outside world — through a damping term, a driving force, or a neighbor — the behavior multiplies. We handle the first two in <a href="/classical-mechanics/damped-and-driven-oscillations">Damped &amp; Driven Oscillations</a>. The rest of this page is about the third: what happens when oscillators touch.`

- [ ] **Step 4: Verify + commit**

Run: `pnpm tsc --noEmit`
Expected: clean.

```bash
git add "app/[locale]/(topics)/classical-mechanics/oscillators-everywhere/content.en.mdx"
git commit -m "refactor(oscillators-everywhere): move damped/driven/resonance to dedicated topic

Sections on driving force and resonance now live in
damped-and-driven-oscillations (FIG.19). This page keeps coupled
oscillators and the hand-off to the wave equation.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

## Wave 5 — Seed, publish, verify (serial, one agent)

### Task 17: Create and run `seed-wave-6.ts` for Coriolis + new glossary prose

**Files:**
- Create: `scripts/content/seed-wave-6.ts`

- [ ] **Step 1: Create `seed-wave-6.ts`**

Copy the shell from `scripts/content/seed-wave-3.ts` (same structural boilerplate — `PhysicistSeed`, `GlossarySeed`, `paragraphsToBlocks`, upsert loop).

Data payload (1 physicist + 6 glossary terms):

```typescript
const PHYSICISTS: PhysicistSeed[] = [
  {
    slug: "gaspard-gustave-de-coriolis",
    name: "Gaspard-Gustave de Coriolis",
    shortName: "Coriolis",
    born: "1792",
    died: "1843",
    nationality: "French",
    oneLiner: "French engineer who, in 1835, named the fictitious force that makes weather rotate and pendulums drift.",
    bio: `Gaspard-Gustave de Coriolis was born in Paris in 1792, the son of a Royalist officer who fled the Revolution to Nancy when the boy was still small. He entered the École Polytechnique in 1808 — second in his class — and the École des Ponts et Chaussées the following year, training as a civil engineer. He taught mechanics at the Polytechnique for the rest of his life, took the chair of machine theory at the École Centrale in 1832, and served as director of studies at the Polytechnique from 1838 until his death five years later.

His public legacy is in the technical meaning he gave to three words. In 1829's Du Calcul de l'Effet des Machines he coined travail ("work") as the integral of force over distance, fixing in place the definition every physicist still uses. He replaced Leibniz's vis viva with the modern kinetic energy ½mv², halving the prefactor and putting energy bookkeeping on a rational footing. And in 1835's Sur les équations du mouvement relatif des systèmes de corps he derived, for the first time, the complete equations of motion in a rotating reference frame — identifying the two non-inertial acceleration terms we now call centrifugal and Coriolis.

Coriolis was explicit that these forces were computational conveniences, not real physical interactions. His interest was industrial: waterwheels, turbines, and the billiard-table kinematics that appear in his last book, Théorie Mathématique des Effets du Jeu de Billard (1835). He never connected his mathematical result to weather or ballistics; that leap came decades later, when meteorologists studying trade winds and artillery officers calculating long-range gunnery rediscovered his equations and realised they explained what they had been observing. The force that now bears his name was invented to balance an accounting equation in rotating machinery and only afterwards found the planet it belonged to.`,
    contributions: [
      "Derived the complete equations of motion in a rotating reference frame (1835)",
      "Identified and named the centrifugal and Coriolis fictitious accelerations",
      "Introduced the modern definitions of mechanical work (travail) and kinetic energy (½mv²)",
      "Published the first mathematical theory of billiards as a problem in rigid-body dynamics",
    ],
    majorWorks: [
      "Du Calcul de l'Effet des Machines (1829) — introduced work and kinetic energy",
      "Sur les équations du mouvement relatif des systèmes de corps (1835) — introduced centrifugal and Coriolis forces",
      "Théorie Mathématique des Effets du Jeu de Billard (1835)",
    ],
    relatedTopics: [
      { branchSlug: "classical-mechanics", topicSlug: "non-inertial-frames" },
    ],
  },
];

const GLOSSARY: GlossarySeed[] = [
  {
    slug: "angular-velocity",
    term: "Angular velocity",
    category: "concept",
    shortDefinition: "Rate of rotation, measured in radians per second: ω = dθ/dt. A vector aligned with the rotation axis (right-hand rule).",
    description: `Angular velocity ω describes how fast something rotates. For a point moving in a circle of radius r, the linear speed and angular speed are locked by v = ωr — a single revolution covers 2πr in 2π radians. The connection is geometric, not dynamical: it holds whether the rotation is caused by gravity, a motor, a spring, or nothing at all.

Angular velocity carries a direction as well as a magnitude. By convention the vector ω points along the rotation axis, with sign given by the right-hand rule: curl the fingers of your right hand in the direction of rotation, and the thumb points along ω. For planar motion (a spinning record, a wheel on a car) the vector reduces to a single signed scalar along the axis perpendicular to the plane.

Newton's laws in their most familiar form (F = ma) refer to linear motion, but a parallel set of equations governs rotation: τ = Iα relates torque to angular acceleration exactly the way F = ma relates force to linear acceleration. Angular velocity is the rotational cousin of linear velocity, and most of the machinery of circular motion — centripetal acceleration ω²r, rotational kinetic energy ½Iω², angular momentum Iω — lives in its shadow.`,
    relatedTopics: [
      { branchSlug: "classical-mechanics", topicSlug: "circular-motion" },
      { branchSlug: "classical-mechanics", topicSlug: "torque-and-rotational-dynamics" },
    ],
  },
  {
    slug: "centrifugal-force",
    term: "Centrifugal force",
    category: "concept",
    shortDefinition: "The outward fictitious force that appears in a rotating reference frame, with magnitude Ω²r.",
    description: `Centrifugal force is not a real force. It is a bookkeeping term that appears when you write Newton's second law in a rotating frame of reference. The true force on a body moving in a circle points inward (the centripetal force); an observer rotating with the body, however, sees the body apparently pushed outward, and to make Newton's laws work from that observer's point of view you add a fictitious outward force of magnitude mΩ²r. That force is called centrifugal.

You feel something centrifugal-like every time a car takes a sharp turn. In the road's frame, the only real horizontal force on you is the inward push of your seat belt and the seat's friction. In your own frame — which is rotating with the car — you feel as if you are being thrown outward, because your body wants to continue in a straight line and the car is pulling you off that line. Call that sensation centrifugal if you like; it is the fictitious force needed to explain your apparent acceleration from inside the turning car.

The same accounting trick explains the slightly flattened shape of the Earth (spinning Earth + effective centrifugal potential makes the equator bulge), the water rising up the walls of a spinning bucket (Newton's famous thought experiment), and why a space station has to spin to simulate gravity: in the rotating frame of the station, centrifugal force pulls you toward the outer wall, and that becomes your local "down."`,
    history: `Christiaan Huygens introduced the Latin phrase vis centrifuga (fleeing-the-center force) in his 1659 manuscript De Vi Centrifuga, computing its magnitude as mΩ²r nearly thirty years before Newton's Principia. Newton reused the term but reconceived centripetal (seeking-the-center) as the physically real force; "centrifugal" survived only as the fictitious counterpart in rotating frames.`,
    relatedPhysicists: ["christiaan-huygens", "gaspard-gustave-de-coriolis"],
    relatedTopics: [
      { branchSlug: "classical-mechanics", topicSlug: "non-inertial-frames" },
    ],
  },
  {
    slug: "coriolis-force",
    term: "Coriolis force",
    category: "concept",
    shortDefinition: "The fictitious force -2m Ω×v that deflects moving objects in a rotating reference frame.",
    description: `The Coriolis force is the second of the two fictitious forces that appear when Newton's laws are written in a rotating reference frame. Unlike centrifugal force, which depends only on position, the Coriolis force depends on velocity: its direction is perpendicular to both the rotation axis Ω and the velocity v. On a rotating planet, an object moving north in the northern hemisphere gets deflected east; moving south, west. The deflection is the same size regardless of direction.

The magnitude is 2mΩv·sin(latitude) — proportional to the planet's rotation rate, the object's speed, and the sine of latitude. At the equator the Coriolis deflection vanishes. At the poles it is maximal. Trade winds, hurricane spin directions, the rotation of Foucault pendulums, the drift of long-range artillery, and the systematic deflection of freely falling objects all trace back to this one term.

Because the Coriolis force is fictitious — an artifact of describing physics from a rotating observer's perspective — it vanishes in an inertial frame. From space, a hurricane is simply air with conserved angular momentum flowing in toward a low-pressure center; the spin is the consequence. From the ground, it looks like an invisible lateral push. Both descriptions are correct. Which is simpler depends on whether you want to compute the orbit of a satellite or forecast tomorrow's weather.`,
    history: `Gaspard-Gustave de Coriolis derived the force in 1835 while analysing rotating machinery, not weather. Meteorologists rediscovered it for atmospheric circulation later in the century; the name "Coriolis force" for the meteorological effect was not standard until the 1920s.`,
    relatedPhysicists: ["gaspard-gustave-de-coriolis", "leon-foucault"],
    relatedTopics: [
      { branchSlug: "classical-mechanics", topicSlug: "non-inertial-frames" },
    ],
  },
  {
    slug: "forced-oscillation",
    term: "Forced oscillation",
    category: "concept",
    shortDefinition: "An oscillator being driven by a periodic external force, settling into a steady state at the drive frequency.",
    description: `A forced oscillator is any oscillating system being pushed by an external periodic force — a child on a swing getting nudged in time, an electrical circuit fed a sine-wave voltage, a mass on a spring jostled by a motor. The governing equation adds a driving term F₀·cos(ω_d·t) to the homogeneous oscillator equation, so the motion is a sum of two pieces: a transient that decays away at the system's natural frequency, and a steady state that oscillates forever at the drive frequency.

Which piece dominates depends on how long you watch and how much damping the system has. Over many cycles, damping kills the transient and only the steady state survives. The system's own natural frequency is no longer audible in the motion; the driver dictates everything.

The amplitude of the steady state depends on how close the drive frequency ω_d is to the system's natural frequency ω₀. Far from resonance the response is small; near resonance it can become enormous. This is how radios tune to stations, how MRI machines excite specific nuclear spins, and how a shattered wine glass meets its end.`,
    relatedTopics: [
      { branchSlug: "classical-mechanics", topicSlug: "damped-and-driven-oscillations" },
    ],
  },
  {
    slug: "amplitude-response",
    term: "Amplitude response",
    category: "concept",
    shortDefinition: "The steady-state amplitude of a driven oscillator as a function of drive frequency — peaked near resonance.",
    description: `The amplitude response of a driven damped oscillator is the function A(ω_d) giving the steady-state oscillation amplitude for a fixed driving force F₀ as the drive frequency ω_d is swept. For a linear second-order oscillator the formula is

  A(ω_d) = F₀ / √[(ω₀² − ω_d²)² + γ²ω_d²]

where ω₀ is the natural frequency and γ is the damping rate. The function peaks near ω_d ≈ ω₀, with a peak height proportional to the quality factor Q = ω₀/γ and a peak width inversely proportional to Q. High-Q systems (a quartz crystal) have tall, narrow peaks; low-Q systems (a shock absorber) have broad, shallow ones.

Amplitude response is the everyday face of resonance. It explains why a violin string sings sweetly at some pitches and hardly at all at others, why a well-tuned AM radio rejects every station except one, and why the Tacoma Narrows bridge found a wind frequency that matched its natural mode and destroyed itself. Engineering a system to resonate strongly (MRI, radio, laser) means maximising Q at the desired frequency; engineering it to survive (buildings, bridges, electronics) means damping any resonance that could be excited by the environment.`,
    relatedTopics: [
      { branchSlug: "classical-mechanics", topicSlug: "damped-and-driven-oscillations" },
    ],
  },
  {
    slug: "moment-arm",
    term: "Moment arm",
    category: "concept",
    shortDefinition: "The perpendicular distance from a rotation axis to the line of action of a force. Torque = force × moment arm.",
    description: `The moment arm is the perpendicular distance from an axis of rotation to the line along which a force acts. Torque — the rotational analogue of force — is equal to force times moment arm. A wrench works because applying a small force far from the bolt produces a large torque; a door handle is mounted opposite the hinge because moving the handle in close would demand a stronger push to swing the door.

Geometrically, the moment arm is what is left of a force's geometric relationship to the axis after you strip away any part of the force pointing along the line connecting them. Only the perpendicular component rotates; the parallel component just tries to translate the rigid body's center of mass (a push that does no rotational work). This is why a bolt cannot be loosened by pulling directly along the wrench handle toward the bolt — there is no moment arm, and no torque, no matter how hard you pull.

For a rolling body on an incline, the moment arm appears in a subtle way: static friction at the contact point provides the torque that spins the body up to match its accelerating translation. The contact point sits at radius R from the wheel's center, so friction's moment arm about the axle is R. This is the geometric reason rolling KE depends on the shape factor I/(mR²) rather than on R alone — R sets both the moment arm and the lever length on both sides of Newton's second law for rotation, and the ratio is what matters.`,
    relatedTopics: [
      { branchSlug: "classical-mechanics", topicSlug: "rolling-motion" },
      { branchSlug: "classical-mechanics", topicSlug: "torque-and-rotational-dynamics" },
    ],
  },
];
```

Keep the existing `paragraphsToBlocks` helper, `async function main()`, and error-handling from seed-wave-3 verbatim.

- [ ] **Step 2: Run the seed (dry-run by inspection first)**

Run: `cd /Users/romanpochtman/Developer/physics && pnpm exec tsx --conditions=react-server scripts/content/seed-wave-6.ts`
Expected output:
```
Seeding 1 physicists + 6 glossary terms (en)…
  ✓ physicist gaspard-gustave-de-coriolis
  ✓ glossary angular-velocity
  ✓ glossary centrifugal-force
  ✓ glossary coriolis-force
  ✓ glossary forced-oscillation
  ✓ glossary amplitude-response
  ✓ glossary moment-arm
done
```

- [ ] **Step 3: Commit the seed script**

```bash
git add scripts/content/seed-wave-6.ts
git commit -m "feat(content): seed wave 6 — Coriolis + gap-closure glossary terms

Adds gaspard-gustave-de-coriolis physicist and 6 glossary terms
(angular-velocity, centrifugal-force, coriolis-force, forced-oscillation,
amplitude-response, moment-arm) to Supabase content_entries.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

### Task 18: Publish the 4 new topics to Supabase

**Files:** none (runs the existing `pnpm content:publish`).

- [ ] **Step 1: Dry-run publish to inspect diff**

Run: `pnpm content:publish --dry-run`
Expected: report lists 4 new topics (circular-motion, non-inertial-frames, rolling-motion, damped-and-driven-oscillations) + 1 modified topic (oscillators-everywhere), all `en`. No errors.

- [ ] **Step 2: Full publish**

Run: `pnpm content:publish`
Expected: each topic row inserted/updated without error.

- [ ] **Step 3: Verify in Supabase directly**

Run (via the Supabase MCP `physics-supabase__execute_sql` tool):
```sql
SELECT slug, locale, substring(title from 1 for 40) as title
FROM content_entries
WHERE kind = 'topic'
  AND slug LIKE 'classical-mechanics/%'
ORDER BY slug;
```
Expected: 31 + 4 = 35 rows containing the four new slugs.

---

### Task 19: Final verification

**Files:** none.

- [ ] **Step 1: Typecheck**

Run: `pnpm tsc --noEmit`
Expected: no errors.

- [ ] **Step 2: Test suite**

Run: `pnpm vitest run`
Expected: all tests pass. Count should have grown by at least 14 (3 physics-lib test files × ~5 tests each = ~14 new passing tests).

- [ ] **Step 3: Production build**

Run: `pnpm build`
Expected: build succeeds. `generateStaticParams` for the topic route produces 35 CLASSICAL MECHANICS topic pages per locale.

- [ ] **Step 4: Dev-server smoke test**

Run (in a background terminal): `pnpm dev`
Visit each:
- http://localhost:3000/en/classical-mechanics — branch index shows 35 topics, 8 modules, FIG numbers 01–35 sequential
- http://localhost:3000/en/classical-mechanics/circular-motion — renders with all 4 scenes interactive
- http://localhost:3000/en/classical-mechanics/non-inertial-frames — renders, Coriolis aside link clicks through
- http://localhost:3000/en/classical-mechanics/rolling-motion — renders, ramp race animates
- http://localhost:3000/en/classical-mechanics/damped-and-driven-oscillations — renders, Tacoma prose present, Q slider works
- http://localhost:3000/en/classical-mechanics/oscillators-everywhere — Damped and Resonance sections are **gone**; prose flow intact
- http://localhost:3000/en/physicists/gaspard-gustave-de-coriolis — renders
- http://localhost:3000/en/dictionary/centrifugal-force — renders
- Prev/next navigation on any topic correctly walks 01 → 35

- [ ] **Step 5: Update MemPalace**

Run:
```bash
mempalace kg-add --wing physics --room content \
  --title "Classical mechanics branch: 35 topics (complete)" \
  --content "CLASSICAL MECHANICS branch reached 35 topics on 2026-04-22. Gap-closure shipment added circular-motion, non-inertial-frames, rolling-motion, and damped-and-driven-oscillations. Resonance/damped scenes moved out of oscillators-everywhere into the new damped-and-driven topic. One new physicist (gaspard-gustave-de-coriolis). Six new glossary terms. Branch is now physicist-complete for intro/intermediate curriculum."
```

Or via the `mempalace_kg_add` MCP tool if available.

- [ ] **Step 6: Final commit (if any uncommitted state)**

```bash
git status
# If any working-tree changes from the publish or dev testing, commit them.
git log --oneline -25
# Expect ~19 new commits on main since the plan started.
```

---

## Success criteria

- [ ] `pnpm tsc --noEmit` clean
- [ ] `pnpm vitest run` all pass
- [ ] `pnpm build` succeeds
- [ ] `/en/classical-mechanics` shows 8 modules and 35 topics with FIG.01–35 sequential
- [ ] Each of the 4 new topic URLs renders with all interactive scenes
- [ ] `/en/classical-mechanics/oscillators-everywhere` no longer contains the damped/resonance sections (verified in DOM)
- [ ] Supabase `content_entries` has 4 new topic rows, 1 new physicist row, 6 new glossary rows — all `locale='en'`
- [ ] `/en/physicists/gaspard-gustave-de-coriolis` renders with bio
- [ ] MemPalace has a fresh entry noting the milestone
