# Pendulum Modules Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Restructure the pendulum topic from 1 page into 3 module-grouped pages (FIG.01 The Simple Pendulum, FIG.02 Beyond Small Angles, FIG.03 Oscillators Everywhere), add module grouping to the data model, build 11 new interactive components, and add new glossary terms + physicist entries.

**Architecture:** Add a `Module` interface and `module` field to `Topic` in the type system. The branch page groups topic cards under module headings. Each topic remains a flat route (`/classical-mechanics/<slug>`). New physics simulations use the existing Canvas 2D + `useAnimationFrame` pattern or JSXGraph for interactive plots.

**Tech Stack:** Next.js 15, MDX, TypeScript strict, Canvas 2D, JSXGraph, odex (ODE solver), Tailwind v4, next-intl.

---

## Task 1: Update Type System and Branch Config

**Files:**
- Modify: `lib/content/types.ts`
- Modify: `lib/content/branches.ts`

- [ ] **Step 1: Add Module interface and module field to types.ts**

```typescript
// Add after BranchStatus type (line 10)

export interface Module {
  slug: string;
  title: string;
  index: number;
}
```

Update `Topic` interface to include module:

```typescript
export interface Topic {
  slug: string;
  title: string;
  eyebrow: string;
  subtitle: string;
  readingMinutes: number;
  status: TopicStatus;
  module: string;
}
```

Update `Branch` interface to include modules:

```typescript
export interface Branch {
  slug: BranchSlug;
  index: number;
  title: string;
  eyebrow: string;
  subtitle: string;
  description: string;
  modules: readonly Module[];
  topics: readonly Topic[];
  status: BranchStatus;
}
```

- [ ] **Step 2: Update branches.ts with new topics and modules**

Replace `CLASSICAL_MECHANICS_TOPICS` and update the classical-mechanics branch entry:

```typescript
const CLASSICAL_MECHANICS_MODULES: readonly Module[] = [
  { slug: "oscillations", title: "Oscillations", index: 1 },
  { slug: "orbital-mechanics", title: "Orbital Mechanics", index: 2 },
];

const CLASSICAL_MECHANICS_TOPICS: readonly Topic[] = [
  {
    slug: "the-simple-pendulum",
    title: "THE SIMPLE PENDULUM",
    eyebrow: "FIG.01 · OSCILLATIONS",
    subtitle: "Why every clock that ever ticked ticked the same way.",
    readingMinutes: 10,
    status: "live",
    module: "oscillations",
  },
  {
    slug: "beyond-small-angles",
    title: "BEYOND SMALL ANGLES",
    eyebrow: "FIG.02 · OSCILLATIONS",
    subtitle: "What the pendulum hides when you stop making approximations.",
    readingMinutes: 12,
    status: "draft",
    module: "oscillations",
  },
  {
    slug: "oscillators-everywhere",
    title: "OSCILLATORS EVERYWHERE",
    eyebrow: "FIG.03 · OSCILLATIONS",
    subtitle: "The equation that runs half of physics.",
    readingMinutes: 12,
    status: "draft",
    module: "oscillations",
  },
  {
    slug: "kepler",
    title: "THE LAWS OF PLANETS",
    eyebrow: "FIG.04 · ORBITAL MECHANICS",
    subtitle: "How a German astronomer broke the sky open with three sentences.",
    readingMinutes: 6,
    status: "live",
    module: "orbital-mechanics",
  },
];
```

Update the classical-mechanics branch to include `modules`:

```typescript
{
  slug: "classical-mechanics",
  index: 1,
  title: "CLASSICAL MECHANICS",
  eyebrow: "§ 01",
  subtitle: "The physics of cannonballs, planets, and pendulums.",
  description: "Newton's legacy: forces, motion, and the machinery of the everyday world. Pendulums that keep perfect time, planets that sweep out equal areas, cannonballs that trace parabolas. The math is three hundred years old and still runs the world you live in.",
  modules: CLASSICAL_MECHANICS_MODULES,
  topics: CLASSICAL_MECHANICS_TOPICS,
  status: "live",
},
```

Add empty `modules: []` to all other branches (electromagnetism, thermodynamics, relativity, quantum, modern-physics).

- [ ] **Step 3: Add redirect for old pendulum slug in next.config.mjs**

Add to the `redirects()` array:

```javascript
{
  source: "/:locale/classical-mechanics/pendulum",
  destination: "/:locale/classical-mechanics/the-simple-pendulum",
  permanent: true,
},
{
  source: "/classical-mechanics/pendulum",
  destination: "/classical-mechanics/the-simple-pendulum",
  permanent: true,
},
```

- [ ] **Step 4: Update all topic references across content files**

In `glossary.ts`, update every `topicSlug: "pendulum"` to `topicSlug: "the-simple-pendulum"` for terms that reference the pendulum topic. Affected terms: `pendulum-clock`, `isochronism`, `restoring-force`, `phase-portrait`, `simple-harmonic-oscillator`.

In `physicists.ts`, update every `topicSlug: "pendulum"` to `topicSlug: "the-simple-pendulum"` for physicists that reference the pendulum topic. Affected: `galileo-galilei`, `isaac-newton`, `christiaan-huygens`, `leon-foucault`.

- [ ] **Step 5: Run build to verify type system compiles**

Run: `cd /Users/romanpochtman/Developer/physics && npx tsc --noEmit`
Expected: No type errors (or only pre-existing ones unrelated to this change).

- [ ] **Step 6: Commit**

```bash
git add lib/content/types.ts lib/content/branches.ts lib/content/glossary.ts lib/content/physicists.ts next.config.mjs
git commit -m "feat: add module grouping to data model, restructure pendulum into 3 topics"
```

---

## Task 2: Update Branch Page to Group by Module

**Files:**
- Modify: `app/[locale]/(topics)/classical-mechanics/page.tsx`

- [ ] **Step 1: Update branch page to render module groups**

Replace the branch page content with module-grouped rendering:

```tsx
import { setRequestLocale } from "next-intl/server";
import { locales } from "@/i18n/config";
import { getBranch } from "@/lib/content/branches";
import { BranchHero } from "@/components/layout/branch-hero";
import { TopicCard } from "@/components/layout/topic-card";
import { WIDE_CONTAINER } from "@/lib/layout";

export const metadata = {
  title: "Classical Mechanics — physics",
  description: "The physics of cannonballs, planets, and pendulums.",
};

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export default async function ClassicalMechanicsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const branch = getBranch("classical-mechanics")!;

  return (
    <main className={`${WIDE_CONTAINER} py-20`}>
      <BranchHero branch={branch} />
      {branch.modules.map((mod) => {
        const moduleTops = branch.topics.filter(
          (t) => t.module === mod.slug && t.status !== "coming-soon",
        );
        if (moduleTops.length === 0) return null;
        return (
          <section key={mod.slug} className="mt-16">
            <h2 className="mb-6 font-mono text-xs uppercase tracking-[0.2em] text-[var(--color-fg-2)]">
              MODULE {mod.index} · {mod.title.toUpperCase()}
            </h2>
            <div className="grid grid-cols-1 gap-0 md:grid-cols-2 lg:grid-cols-3 [&>*]:-mt-px [&>*]:-ml-px">
              {moduleTops.map((t) => (
                <TopicCard key={t.slug} branchSlug={branch.slug} topic={t} />
              ))}
            </div>
          </section>
        );
      })}
    </main>
  );
}
```

- [ ] **Step 2: Run dev server and verify visually**

Run: `cd /Users/romanpochtman/Developer/physics && pnpm dev`
Navigate to `/en/classical-mechanics`. Verify:
- Module 1 heading "MODULE 1 · OSCILLATIONS" shows with topic cards beneath
- Module 2 heading "MODULE 2 · ORBITAL MECHANICS" shows with Kepler card
- Draft topics are hidden (they have status "draft")

- [ ] **Step 3: Commit**

```bash
git add app/[locale]/(topics)/classical-mechanics/page.tsx
git commit -m "feat: group topic cards by module on branch page"
```

---

## Task 3: Create FIG.01 — The Simple Pendulum MDX

**Files:**
- Create: `app/[locale]/(topics)/classical-mechanics/the-simple-pendulum/page.mdx`
- Delete: `app/[locale]/(topics)/classical-mechanics/pendulum/page.mdx`

This is a refactored version of the existing pendulum page. It reuses ~80% of the existing content but adds new sections for the small-angle trick (§03), the clock (§05), and measuring gravity (§07).

- [ ] **Step 1: Create the new MDX file**

Create `app/[locale]/(topics)/classical-mechanics/the-simple-pendulum/page.mdx` with the full content. This is an 8-section article following the exact same patterns as the existing pendulum page (same imports, same component usage).

The file should import:
```tsx
import { TopicHeader } from "@/components/layout/topic-header";
import { Section } from "@/components/layout/section";
import { SceneCard } from "@/components/layout/scene-card";
import { EquationBlock } from "@/components/math/equation-block";
import { Callout } from "@/components/layout/callout";
import { PendulumScene } from "@/components/physics/pendulum-scene";
import { PhasePortrait } from "@/components/physics/phase-portrait";
import { TopicPageLayout } from "@/components/layout/topic-page-layout";
```

The aside array should include:
```tsx
aside={[
  { type: "physicist", label: "Galileo Galilei", href: "/physicists/galileo-galilei" },
  { type: "physicist", label: "Isaac Newton", href: "/physicists/isaac-newton" },
  { type: "physicist", label: "Christiaan Huygens", href: "/physicists/christiaan-huygens" },
  { type: "term", label: "Isochronism", href: "/dictionary/isochronism" },
  { type: "term", label: "Pendulum Clock", href: "/dictionary/pendulum-clock" },
  { type: "term", label: "Restoring Force", href: "/dictionary/restoring-force" },
  { type: "term", label: "Phase Portrait", href: "/dictionary/phase-portrait" },
  { type: "term", label: "Simple Harmonic Oscillator", href: "/dictionary/simple-harmonic-oscillator" },
]}
```

Sections:
1. **The question** — reuse existing §1 verbatim (Galileo's chandelier discovery)
2. **The restoring force** — reuse existing §2, add `RestoringForceScene` from glossary visualization (wrap in SceneCard)
3. **The small-angle trick** — NEW section. Explain sin θ ≈ θ, Taylor expansion, quantify error at 5°/15°/30°. Include `SmallAngleScene` component (Task 5). Use a `<Callout variant="math">` block for the Taylor expansion.
4. **The rhythm** — reuse existing §3 (period formula, PendulumScene with timer)
5. **The surprise** — reuse existing §4 (three pendulums comparison)
6. **The clock** — NEW section. Huygens 1656, pendulum clock significance, cycloidal cheeks, tautochrone. Include `CycloidScene` component (Task 6).
7. **The shape of motion** — reuse existing §5 (phase portrait)
8. **What comes next** — NEW section. Brief teaser about large angles, link to FIG.02.

- [ ] **Step 2: Delete the old pendulum directory**

```bash
rm -rf app/[locale]/(topics)/classical-mechanics/pendulum/
```

- [ ] **Step 3: Verify the page loads**

Run dev server and navigate to `/en/classical-mechanics/the-simple-pendulum`. Verify:
- All 8 sections render
- Existing visualizations work (PendulumScene, PhasePortrait)
- New sections §3 and §6 show placeholder text until new components are built
- Aside panel shows correct links
- Previous/next navigation works

- [ ] **Step 4: Commit**

```bash
git add app/[locale]/(topics)/classical-mechanics/the-simple-pendulum/
git add -u app/[locale]/(topics)/classical-mechanics/pendulum/
git commit -m "feat: create FIG.01 The Simple Pendulum, replace old pendulum page"
```

---

## Task 4: Physics Library Extensions

**Files:**
- Create: `lib/physics/elliptic.ts`
- Create: `lib/physics/damped-oscillator.ts`
- Create: `lib/physics/coupled-oscillator.ts`
- Create: `lib/physics/cycloid.ts`

These are pure math/physics modules with no UI dependencies. They can be built and tested independently.

- [ ] **Step 1: Create elliptic.ts**

Extract and expand the `completeEllipticK` function that already exists in `pendulum.ts` (lines 95-106) into its own module, and add a `periodRatio` helper:

```typescript
// lib/physics/elliptic.ts

/**
 * Complete elliptic integral of the first kind K(k) using the
 * arithmetic-geometric mean. k is the modulus (NOT the parameter m = k^2).
 */
export function completeEllipticK(k: number): number {
  let a = 1;
  let b = Math.sqrt(1 - k * k);
  for (let i = 0; i < 20; i++) {
    const aNext = (a + b) / 2;
    const bNext = Math.sqrt(a * b);
    if (Math.abs(a - b) < 1e-15) break;
    a = aNext;
    b = bNext;
  }
  return Math.PI / (2 * a);
}

/**
 * Ratio T(theta0) / T_small_angle for a simple pendulum.
 * Returns how much longer the exact period is compared to 2*pi*sqrt(L/g).
 */
export function periodRatio(theta0: number): number {
  const k = Math.sin(theta0 / 2);
  return (2 / Math.PI) * completeEllipticK(k);
}
```

- [ ] **Step 2: Create damped-oscillator.ts**

```typescript
// lib/physics/damped-oscillator.ts

/**
 * Damped harmonic oscillator: x'' + gamma*x' + omega0^2*x = F0*cos(omegaD*t)
 */

export interface DampedState {
  t: number;
  x: number;
  v: number;
}

export interface DampedParams {
  omega0: number;
  gamma: number;
}

/**
 * Free (undriven) damped oscillator from rest displacement x0.
 * Returns position at time t.
 */
export function dampedFree(
  t: number,
  x0: number,
  { omega0, gamma }: DampedParams,
): number {
  const disc = gamma * gamma / 4 - omega0 * omega0;
  if (disc < 0) {
    // Underdamped
    const omegaD = Math.sqrt(-disc);
    return x0 * Math.exp(-gamma * t / 2) * (
      Math.cos(omegaD * t) + (gamma / (2 * omegaD)) * Math.sin(omegaD * t)
    );
  } else if (disc === 0) {
    // Critically damped
    return x0 * (1 + gamma * t / 2) * Math.exp(-gamma * t / 2);
  } else {
    // Overdamped
    const r1 = -gamma / 2 + Math.sqrt(disc);
    const r2 = -gamma / 2 - Math.sqrt(disc);
    const c1 = x0 * r2 / (r2 - r1);
    const c2 = -x0 * r1 / (r2 - r1);
    return c1 * Math.exp(r1 * t) + c2 * Math.exp(r2 * t);
  }
}

/**
 * Steady-state amplitude of a driven damped oscillator.
 * A(omegaD) = F0 / sqrt((omega0^2 - omegaD^2)^2 + (gamma*omegaD)^2)
 */
export function drivenAmplitude(
  omegaD: number,
  F0: number,
  { omega0, gamma }: DampedParams,
): number {
  const diff = omega0 * omega0 - omegaD * omegaD;
  return F0 / Math.sqrt(diff * diff + gamma * gamma * omegaD * omegaD);
}

/**
 * Quality factor Q = omega0 / gamma.
 */
export function qualityFactor({ omega0, gamma }: DampedParams): number {
  if (gamma === 0) return Infinity;
  return omega0 / gamma;
}
```

- [ ] **Step 3: Create coupled-oscillator.ts**

```typescript
// lib/physics/coupled-oscillator.ts

/**
 * Two identical pendulums (mass m, length L) coupled by a spring (constant k).
 * Normal mode frequencies:
 *   omega1 = sqrt(g/L)          (in-phase)
 *   omega2 = sqrt(g/L + 2k/m)   (anti-phase)
 *
 * General solution is superposition of the two modes.
 */

export interface CoupledParams {
  /** Natural frequency of single pendulum sqrt(g/L) */
  omega0: number;
  /** Coupling frequency sqrt(2k/m) */
  omegaC: number;
}

export interface CoupledState {
  theta1: number;
  theta2: number;
}

/**
 * Compute positions of both pendulums at time t.
 * Initial conditions: theta1(0) = A, theta2(0) = 0, both at rest.
 * This produces "beats" — energy sloshes between pendulums.
 */
export function coupledBeats(
  t: number,
  A: number,
  { omega0, omegaC }: CoupledParams,
): CoupledState {
  const omega1 = omega0;
  const omega2 = Math.sqrt(omega0 * omega0 + omegaC * omegaC);
  const omegaPlus = (omega1 + omega2) / 2;
  const omegaMinus = (omega2 - omega1) / 2;
  return {
    theta1: A * Math.cos(omegaMinus * t) * Math.cos(omegaPlus * t),
    theta2: A * Math.sin(omegaMinus * t) * Math.sin(omegaPlus * t),
  };
}

/**
 * Normal mode 1: both pendulums in phase.
 */
export function coupledMode1(
  t: number,
  A: number,
  { omega0 }: CoupledParams,
): CoupledState {
  const theta = A * Math.cos(omega0 * t);
  return { theta1: theta, theta2: theta };
}

/**
 * Normal mode 2: pendulums in anti-phase.
 */
export function coupledMode2(
  t: number,
  A: number,
  { omega0, omegaC }: CoupledParams,
): CoupledState {
  const omega2 = Math.sqrt(omega0 * omega0 + omegaC * omegaC);
  const theta = A * Math.cos(omega2 * t);
  return { theta1: theta, theta2: -theta };
}
```

- [ ] **Step 4: Create cycloid.ts**

```typescript
// lib/physics/cycloid.ts

/**
 * Cycloid: the curve traced by a point on the rim of a circle of radius R
 * rolling along a straight line.
 *
 * Parametric equations:
 *   x(t) = R * (t - sin(t))
 *   y(t) = R * (1 - cos(t))
 *
 * where t is the angle the circle has rolled through.
 */

export interface CycloidPoint {
  x: number;
  y: number;
}

/**
 * Generate N points along one arch of a cycloid (t from 0 to 2*pi).
 */
export function cycloidArch(R: number, N: number): CycloidPoint[] {
  const points: CycloidPoint[] = [];
  for (let i = 0; i <= N; i++) {
    const t = (2 * Math.PI * i) / N;
    points.push({
      x: R * (t - Math.sin(t)),
      y: R * (1 - Math.cos(t)),
    });
  }
  return points;
}

/**
 * Position of the center of the rolling circle at parameter t.
 */
export function rollingCircleCenter(R: number, t: number): CycloidPoint {
  return {
    x: R * t,
    y: R,
  };
}

/**
 * Position of the generating point on the rolling circle at parameter t.
 */
export function generatingPoint(R: number, t: number): CycloidPoint {
  return {
    x: R * (t - Math.sin(t)),
    y: R * (1 - Math.cos(t)),
  };
}

/**
 * Time for a frictionless bead to slide from angle phi0 to the bottom
 * of a cycloid of radius R under gravity g.
 * For a cycloid, this is constant: T_descent = pi * sqrt(R/g),
 * independent of phi0 (tautochrone property).
 */
export function tautochroneTime(R: number, g: number = 9.80665): number {
  return Math.PI * Math.sqrt(R / g);
}
```

- [ ] **Step 5: Update pendulum.ts to re-export from elliptic.ts**

In `lib/physics/pendulum.ts`, replace the local `completeEllipticK` function (lines 95-106) with an import from the new module:

```typescript
import { completeEllipticK } from "./elliptic";
```

Remove the local `completeEllipticK` function definition.

- [ ] **Step 6: Verify compilation**

Run: `cd /Users/romanpochtman/Developer/physics && npx tsc --noEmit`
Expected: No type errors.

- [ ] **Step 7: Commit**

```bash
git add lib/physics/elliptic.ts lib/physics/damped-oscillator.ts lib/physics/coupled-oscillator.ts lib/physics/cycloid.ts lib/physics/pendulum.ts
git commit -m "feat: add physics libs for elliptic integrals, damped/coupled oscillators, cycloid"
```

---

## Task 5: SmallAngleScene Component

**Files:**
- Create: `components/physics/small-angle-scene.tsx`

A JSXGraph-based component that overlays sin(θ) and θ on the same axes with a slider to highlight where they diverge.

- [ ] **Step 1: Create the component**

```tsx
// components/physics/small-angle-scene.tsx
"use client";

import { useEffect, useRef } from "react";
import { useThemeColors } from "@/lib/hooks/use-theme-colors";

export interface SmallAngleSceneProps {
  width?: number;
  height?: number;
}

export function SmallAngleScene({
  width = 480,
  height = 360,
}: SmallAngleSceneProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const boardRef = useRef<any>(null);
  const colors = useThemeColors();

  useEffect(() => {
    let cancelled = false;

    (async () => {
      const JXG = (await import("jsxgraph")).default;
      if (cancelled || !containerRef.current) return;

      if (!containerRef.current.id) {
        containerRef.current.id = `small-angle-${Math.random().toString(36).slice(2)}`;
      }

      const maxX = Math.PI;
      const board = JXG.JSXGraph.initBoard(containerRef.current.id, {
        boundingbox: [-0.2, 1.8, maxX + 0.2, -0.4],
        axis: false,
        showNavigation: false,
        showCopyright: false,
        keepAspectRatio: false,
      });

      // Axes
      board.create("axis", [[0, 0], [1, 0]], {
        strokeColor: colors.fg3,
        ticks: { strokeColor: colors.fg3, label: { strokeColor: colors.fg2 } },
      });
      board.create("axis", [[0, 0], [0, 1]], {
        strokeColor: colors.fg3,
        ticks: { strokeColor: colors.fg3, label: { strokeColor: colors.fg2 } },
      });

      // θ line (the linear approximation)
      board.create(
        "functiongraph",
        [(x: number) => x, 0, maxX],
        { strokeColor: "#5BE9FF", strokeWidth: 2, name: "θ", withLabel: true },
      );

      // sin(θ) curve
      board.create(
        "functiongraph",
        [(x: number) => Math.sin(x), 0, maxX],
        { strokeColor: "#FF6B6B", strokeWidth: 2, name: "sin θ", withLabel: true },
      );

      // Draggable point to explore divergence
      const slider = board.create("slider", [
        [0.5, -0.2], [2.5, -0.2], [0, 0.3, Math.PI],
      ], {
        name: "θ₀",
        snapWidth: 0.01,
        strokeColor: "#5BE9FF",
        fillColor: "#5BE9FF",
      });

      // Vertical line at slider value
      board.create("line", [
        () => [slider.Value(), 0],
        () => [slider.Value(), 1],
      ], {
        straightFirst: false, straightLast: false,
        strokeColor: colors.fg3, strokeWidth: 1, dash: 2,
      });

      // Points on both curves at slider value
      board.create("point", [
        () => slider.Value(),
        () => slider.Value(),
      ], {
        name: "θ", size: 3, fillColor: "#5BE9FF", strokeColor: "#5BE9FF",
        showInfobox: false, fixed: true,
      });

      board.create("point", [
        () => slider.Value(),
        () => Math.sin(slider.Value()),
      ], {
        name: "sin θ", size: 3, fillColor: "#FF6B6B", strokeColor: "#FF6B6B",
        showInfobox: false, fixed: true,
      });

      // Error text
      board.create("text", [
        0.5, 1.5,
        () => {
          const v = slider.Value();
          const err = Math.abs(v - Math.sin(v)) / Math.max(Math.sin(v), 0.001) * 100;
          return `error: ${err.toFixed(1)}%`;
        },
      ], { fontSize: 14, strokeColor: colors.fg1 });

      boardRef.current = board;
    })();

    return () => {
      cancelled = true;
      if (boardRef.current) {
        try {
          const JXG = require("jsxgraph");
          JXG.JSXGraph.freeBoard(boardRef.current);
        } catch { /* noop */ }
      }
    };
  }, [colors]);

  return (
    <div
      ref={containerRef}
      className="jxgbox mx-auto"
      style={{ width, height, backgroundColor: "transparent" }}
    />
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add components/physics/small-angle-scene.tsx
git commit -m "feat: add SmallAngleScene — sin(θ) vs θ with interactive slider"
```

---

## Task 6: CycloidScene Component

**Files:**
- Create: `components/physics/cycloid-scene.tsx`

Canvas 2D animation showing a circle rolling along a line, generating a cycloid curve. Optionally shows beads sliding to the bottom from different heights (tautochrone).

- [ ] **Step 1: Create the component**

```tsx
// components/physics/cycloid-scene.tsx
"use client";

import { useRef } from "react";
import { useAnimationFrame } from "@/lib/animation/use-animation-frame";
import { useThemeColors } from "@/lib/hooks/use-theme-colors";
import { cycloidArch, rollingCircleCenter, generatingPoint } from "@/lib/physics/cycloid";

export interface CycloidSceneProps {
  width?: number;
  height?: number;
  /** Radius of rolling circle in px */
  radius?: number;
}

export function CycloidScene({
  width = 480,
  height = 320,
  radius = 50,
}: CycloidSceneProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const colors = useThemeColors();

  // Pre-compute arch points
  const archPoints = cycloidArch(1, 200);

  useAnimationFrame({
    elementRef: containerRef,
    onFrame: (t) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      const dpr = window.devicePixelRatio || 1;
      if (canvas.width !== width * dpr || canvas.height !== height * dpr) {
        canvas.width = width * dpr;
        canvas.height = height * dpr;
        ctx.scale(dpr, dpr);
      }

      ctx.clearRect(0, 0, width, height);

      const R = radius;
      const baseY = height - 40;
      const startX = 40;

      // Animate: circle rolls through one full rotation in ~4 seconds
      const period = 4;
      const param = ((t % period) / period) * 2 * Math.PI;

      // Draw baseline
      ctx.strokeStyle = colors.fg3;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(startX, baseY);
      ctx.lineTo(startX + 2 * Math.PI * R, baseY);
      ctx.stroke();

      // Draw cycloid curve (traced so far)
      ctx.strokeStyle = "#5BE9FF";
      ctx.lineWidth = 2;
      ctx.beginPath();
      let started = false;
      for (const p of archPoints) {
        const px = startX + p.x * R;
        const py = baseY - p.y * R;
        if (p.x * R > param * R) break;
        if (!started) { ctx.moveTo(px, py); started = true; }
        else ctx.lineTo(px, py);
      }
      ctx.stroke();

      // Draw rolling circle
      const cx = startX + rollingCircleCenter(1, param).x * R;
      const cy = baseY - rollingCircleCenter(1, param).y * R;
      ctx.strokeStyle = colors.fg2;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(cx, cy, R, 0, 2 * Math.PI);
      ctx.stroke();

      // Draw generating point
      const gp = generatingPoint(1, param);
      const gpx = startX + gp.x * R;
      const gpy = baseY - gp.y * R;

      // Line from center to generating point
      ctx.strokeStyle = colors.fg3;
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(gpx, gpy);
      ctx.stroke();

      // Generating point dot with glow
      ctx.shadowColor = "rgba(91, 233, 255, 0.6)";
      ctx.shadowBlur = 12;
      ctx.fillStyle = "#5BE9FF";
      ctx.beginPath();
      ctx.arc(gpx, gpy, 5, 0, 2 * Math.PI);
      ctx.fill();
      ctx.shadowBlur = 0;
    },
  });

  return (
    <div ref={containerRef} style={{ width, height }} className="mx-auto">
      <canvas ref={canvasRef} style={{ width, height }} className="block" />
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add components/physics/cycloid-scene.tsx
git commit -m "feat: add CycloidScene — animated rolling circle generating a cycloid"
```

---

## Task 7: TaylorExpansionScene Component

**Files:**
- Create: `components/physics/taylor-expansion-scene.tsx`

JSXGraph component that overlays Taylor polynomial approximations of sin(θ) from order 1 to order 7, with a stepper to add terms one at a time.

- [ ] **Step 1: Create the component**

```tsx
// components/physics/taylor-expansion-scene.tsx
"use client";

import { useEffect, useRef, useState } from "react";
import { useThemeColors } from "@/lib/hooks/use-theme-colors";

export interface TaylorExpansionSceneProps {
  width?: number;
  height?: number;
}

const COLORS = ["#5BE9FF", "#FF6B6B", "#4ADE80", "#FBBF24"];

/** Taylor polynomial of sin(x) up to order n (must be odd). */
function taylorSin(x: number, order: number): number {
  let sum = 0;
  let term = x;
  for (let k = 1; k <= order; k += 2) {
    if (k > 1) term *= -x * x / (k * (k - 1));
    sum += term;
  }
  return sum;
}

export function TaylorExpansionScene({
  width = 480,
  height = 360,
}: TaylorExpansionSceneProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const boardRef = useRef<any>(null);
  const curvesRef = useRef<any[]>([]);
  const [maxOrder, setMaxOrder] = useState(1);
  const colors = useThemeColors();

  useEffect(() => {
    let cancelled = false;

    (async () => {
      const JXG = (await import("jsxgraph")).default;
      if (cancelled || !containerRef.current) return;

      if (!containerRef.current.id) {
        containerRef.current.id = `taylor-${Math.random().toString(36).slice(2)}`;
      }

      const board = JXG.JSXGraph.initBoard(containerRef.current.id, {
        boundingbox: [-0.5, 2.0, 4.0, -2.0],
        axis: true,
        showNavigation: false,
        showCopyright: false,
        keepAspectRatio: false,
        defaultAxes: {
          x: { strokeColor: colors.fg3, ticks: { strokeColor: colors.fg3, label: { strokeColor: colors.fg2 } } },
          y: { strokeColor: colors.fg3, ticks: { strokeColor: colors.fg3, label: { strokeColor: colors.fg2 } } },
        },
      });

      // Exact sin curve
      board.create("functiongraph", [(x: number) => Math.sin(x), -0.5, 4], {
        strokeColor: colors.fg1, strokeWidth: 2, dash: 2, name: "sin θ",
      });

      boardRef.current = board;
    })();

    return () => {
      cancelled = true;
      if (boardRef.current) {
        try {
          const JXG = require("jsxgraph");
          JXG.JSXGraph.freeBoard(boardRef.current);
        } catch { /* noop */ }
      }
    };
  }, [colors]);

  // Update curves when maxOrder changes
  useEffect(() => {
    const board = boardRef.current;
    if (!board) return;

    // Remove old Taylor curves
    for (const c of curvesRef.current) {
      board.removeObject(c);
    }
    curvesRef.current = [];

    // Add Taylor polynomial curves up to maxOrder
    const orders = [1, 3, 5, 7].filter((o) => o <= maxOrder);
    orders.forEach((order, i) => {
      const curve = board.create(
        "functiongraph",
        [(x: number) => taylorSin(x, order), -0.5, 4],
        {
          strokeColor: COLORS[i % COLORS.length],
          strokeWidth: 2,
          name: `order ${order}`,
          withLabel: true,
        },
      );
      curvesRef.current.push(curve);
    });
  }, [maxOrder]);

  return (
    <div>
      <div
        ref={containerRef}
        className="jxgbox mx-auto"
        style={{ width, height, backgroundColor: "transparent" }}
      />
      <div className="mt-4 flex items-center justify-center gap-4">
        <button
          onClick={() => setMaxOrder((o) => Math.max(1, o - 2))}
          disabled={maxOrder <= 1}
          className="rounded border border-[var(--color-fg-3)] px-3 py-1 font-mono text-xs text-[var(--color-fg-1)] disabled:opacity-30"
        >
          − term
        </button>
        <span className="font-mono text-xs text-[var(--color-fg-2)]">
          ORDER {maxOrder}
        </span>
        <button
          onClick={() => setMaxOrder((o) => Math.min(7, o + 2))}
          disabled={maxOrder >= 7}
          className="rounded border border-[var(--color-fg-3)] px-3 py-1 font-mono text-xs text-[var(--color-fg-1)] disabled:opacity-30"
        >
          + term
        </button>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add components/physics/taylor-expansion-scene.tsx
git commit -m "feat: add TaylorExpansionScene — animated Taylor polynomial overlay for sin(θ)"
```

---

## Task 8: EnergyDiagramScene and SeparatrixScene Components

**Files:**
- Create: `components/physics/energy-diagram-scene.tsx`
- Create: `components/physics/separatrix-scene.tsx`

- [ ] **Step 1: Create EnergyDiagramScene**

Canvas 2D component showing the potential well U(θ) = mgL(1 − cos θ) with a horizontal total energy line and an animated ball rolling in the well.

```tsx
// components/physics/energy-diagram-scene.tsx
"use client";

import { useRef } from "react";
import { useAnimationFrame } from "@/lib/animation/use-animation-frame";
import { useThemeColors } from "@/lib/hooks/use-theme-colors";
import { g_SI } from "@/lib/physics/constants";

export interface EnergyDiagramSceneProps {
  length?: number;
  theta0?: number;
  width?: number;
  height?: number;
}

export function EnergyDiagramScene({
  length = 1.2,
  theta0 = 0.8,
  width = 480,
  height = 320,
}: EnergyDiagramSceneProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const colors = useThemeColors();

  // U(theta) = m*g*L*(1-cos(theta)), normalize by m*g*L so U = 1-cos(theta)
  const U = (th: number) => 1 - Math.cos(th);
  const totalE = U(theta0); // starts from rest at theta0

  useAnimationFrame({
    elementRef: containerRef,
    onFrame: (t) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      const dpr = window.devicePixelRatio || 1;
      if (canvas.width !== width * dpr || canvas.height !== height * dpr) {
        canvas.width = width * dpr;
        canvas.height = height * dpr;
        ctx.scale(dpr, dpr);
      }

      ctx.clearRect(0, 0, width, height);

      const padL = 50;
      const padR = 30;
      const padT = 30;
      const padB = 40;
      const plotW = width - padL - padR;
      const plotH = height - padT - padB;

      const thetaMin = -Math.PI;
      const thetaMax = Math.PI;
      const uMax = 2.2;

      const toX = (th: number) => padL + ((th - thetaMin) / (thetaMax - thetaMin)) * plotW;
      const toY = (u: number) => padT + plotH - (u / uMax) * plotH;

      // Draw axes
      ctx.strokeStyle = colors.fg3;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(padL, padT);
      ctx.lineTo(padL, padT + plotH);
      ctx.lineTo(padL + plotW, padT + plotH);
      ctx.stroke();

      // Axis labels
      ctx.fillStyle = colors.fg2;
      ctx.font = "11px monospace";
      ctx.textAlign = "center";
      ctx.fillText("θ", padL + plotW / 2, height - 8);
      ctx.save();
      ctx.translate(14, padT + plotH / 2);
      ctx.rotate(-Math.PI / 2);
      ctx.fillText("U / mgL", 0, 0);
      ctx.restore();

      // Draw potential well curve
      ctx.strokeStyle = "#5BE9FF";
      ctx.lineWidth = 2;
      ctx.beginPath();
      for (let px = 0; px <= plotW; px++) {
        const th = thetaMin + (px / plotW) * (thetaMax - thetaMin);
        const y = toY(U(th));
        if (px === 0) ctx.moveTo(toX(th), y);
        else ctx.lineTo(toX(th), y);
      }
      ctx.stroke();

      // Draw total energy line
      ctx.strokeStyle = "#FF6B6B";
      ctx.lineWidth = 1;
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.moveTo(padL, toY(totalE));
      ctx.lineTo(padL + plotW, toY(totalE));
      ctx.stroke();
      ctx.setLineDash([]);

      // Label
      ctx.fillStyle = "#FF6B6B";
      ctx.textAlign = "left";
      ctx.fillText("E total", padL + plotW - 40, toY(totalE) - 6);

      // Animate ball along the well
      const omega = Math.sqrt(g_SI / length);
      const theta = theta0 * Math.cos(omega * t);
      const ballU = U(theta);
      const bx = toX(theta);
      const by = toY(ballU);

      // Ball
      ctx.shadowColor = "rgba(91, 233, 255, 0.6)";
      ctx.shadowBlur = 12;
      ctx.fillStyle = "#5BE9FF";
      ctx.beginPath();
      ctx.arc(bx, by, 6, 0, 2 * Math.PI);
      ctx.fill();
      ctx.shadowBlur = 0;

      // KE bar (gap between ball and energy line)
      ctx.fillStyle = "rgba(91, 233, 255, 0.2)";
      ctx.fillRect(bx - 8, by, 16, toY(totalE) - by);
    },
  });

  return (
    <div ref={containerRef} style={{ width, height }} className="mx-auto">
      <canvas ref={canvasRef} style={{ width, height }} className="block" />
    </div>
  );
}
```

- [ ] **Step 2: Create SeparatrixScene**

JSXGraph-based full phase portrait with multiple trajectory families + highlighted separatrix.

```tsx
// components/physics/separatrix-scene.tsx
"use client";

import { useEffect, useRef } from "react";
import { useThemeColors } from "@/lib/hooks/use-theme-colors";

export interface SeparatrixSceneProps {
  width?: number;
  height?: number;
}

export function SeparatrixScene({
  width = 480,
  height = 400,
}: SeparatrixSceneProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const boardRef = useRef<any>(null);
  const colors = useThemeColors();

  useEffect(() => {
    let cancelled = false;

    (async () => {
      const JXG = (await import("jsxgraph")).default;
      if (cancelled || !containerRef.current) return;

      if (!containerRef.current.id) {
        containerRef.current.id = `separatrix-${Math.random().toString(36).slice(2)}`;
      }

      // Phase space: theta from -pi to pi, thetaDot from -4 to 4
      const board = JXG.JSXGraph.initBoard(containerRef.current.id, {
        boundingbox: [-3.5, 4.5, 3.5, -4.5],
        axis: true,
        showNavigation: false,
        showCopyright: false,
        keepAspectRatio: false,
        defaultAxes: {
          x: { name: "θ (rad)", strokeColor: colors.fg3, ticks: { strokeColor: colors.fg3, label: { strokeColor: colors.fg2 } } },
          y: { name: "θ̇ (rad/s)", strokeColor: colors.fg3, ticks: { strokeColor: colors.fg3, label: { strokeColor: colors.fg2 } } },
        },
      });

      // Phase portrait contours: E = (1/2)*thetaDot^2 + omega^2*(1-cos(theta))
      // For omega^2 = g/L = 1 (normalized):
      // thetaDot = ± sqrt(2*(E - (1-cos(theta))))

      const omega2 = 1; // normalized

      // Libration orbits (E < 2*omega^2)
      const librationEnergies = [0.2, 0.5, 1.0, 1.5, 1.8];
      for (const E of librationEnergies) {
        // Upper branch
        board.create("functiongraph", [
          (th: number) => {
            const val = 2 * (E - omega2 * (1 - Math.cos(th)));
            return val > 0 ? Math.sqrt(val) : NaN;
          },
          -Math.PI, Math.PI,
        ], { strokeColor: "rgba(91, 233, 255, 0.4)", strokeWidth: 1 });
        // Lower branch
        board.create("functiongraph", [
          (th: number) => {
            const val = 2 * (E - omega2 * (1 - Math.cos(th)));
            return val > 0 ? -Math.sqrt(val) : NaN;
          },
          -Math.PI, Math.PI,
        ], { strokeColor: "rgba(91, 233, 255, 0.4)", strokeWidth: 1 });
      }

      // Separatrix (E = 2*omega^2)
      const Esep = 2 * omega2;
      board.create("functiongraph", [
        (th: number) => {
          const val = 2 * (Esep - omega2 * (1 - Math.cos(th)));
          return val > 0 ? Math.sqrt(val) : NaN;
        },
        -Math.PI + 0.01, Math.PI - 0.01,
      ], { strokeColor: "#FF6B6B", strokeWidth: 2.5 });
      board.create("functiongraph", [
        (th: number) => {
          const val = 2 * (Esep - omega2 * (1 - Math.cos(th)));
          return val > 0 ? -Math.sqrt(val) : NaN;
        },
        -Math.PI + 0.01, Math.PI - 0.01,
      ], { strokeColor: "#FF6B6B", strokeWidth: 2.5 });

      // Rotation orbits (E > 2*omega^2)
      const rotationEnergies = [2.5, 3.5, 5.0];
      for (const E of rotationEnergies) {
        board.create("functiongraph", [
          (th: number) => Math.sqrt(2 * (E - omega2 * (1 - Math.cos(th)))),
          -Math.PI, Math.PI,
        ], { strokeColor: "rgba(75, 222, 128, 0.4)", strokeWidth: 1 });
        board.create("functiongraph", [
          (th: number) => -Math.sqrt(2 * (E - omega2 * (1 - Math.cos(th)))),
          -Math.PI, Math.PI,
        ], { strokeColor: "rgba(75, 222, 128, 0.4)", strokeWidth: 1 });
      }

      // Labels
      board.create("text", [0.3, 0.6, "libration"], { fontSize: 11, strokeColor: "#5BE9FF" });
      board.create("text", [0.3, 3.5, "rotation"], { fontSize: 11, strokeColor: "#4ADE80" });
      board.create("text", [-2.5, 2.2, "separatrix"], { fontSize: 11, strokeColor: "#FF6B6B" });

      boardRef.current = board;
    })();

    return () => {
      cancelled = true;
      if (boardRef.current) {
        try {
          const JXG = require("jsxgraph");
          JXG.JSXGraph.freeBoard(boardRef.current);
        } catch { /* noop */ }
      }
    };
  }, [colors]);

  return (
    <div
      ref={containerRef}
      className="jxgbox mx-auto"
      style={{ width, height, backgroundColor: "transparent" }}
    />
  );
}
```

- [ ] **Step 3: Commit**

```bash
git add components/physics/energy-diagram-scene.tsx components/physics/separatrix-scene.tsx
git commit -m "feat: add EnergyDiagramScene and SeparatrixScene for FIG.02"
```

---

## Task 9: PeriodVsAmplitudeScene Component

**Files:**
- Create: `components/physics/period-vs-amplitude-scene.tsx`

JSXGraph plot showing T(θ₀)/T₀ from 0° to ~179°.

- [ ] **Step 1: Create the component**

```tsx
// components/physics/period-vs-amplitude-scene.tsx
"use client";

import { useEffect, useRef } from "react";
import { useThemeColors } from "@/lib/hooks/use-theme-colors";
import { periodRatio } from "@/lib/physics/elliptic";

export interface PeriodVsAmplitudeSceneProps {
  width?: number;
  height?: number;
}

export function PeriodVsAmplitudeScene({
  width = 480,
  height = 360,
}: PeriodVsAmplitudeSceneProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const boardRef = useRef<any>(null);
  const colors = useThemeColors();

  useEffect(() => {
    let cancelled = false;

    (async () => {
      const JXG = (await import("jsxgraph")).default;
      if (cancelled || !containerRef.current) return;

      if (!containerRef.current.id) {
        containerRef.current.id = `period-amp-${Math.random().toString(36).slice(2)}`;
      }

      const board = JXG.JSXGraph.initBoard(containerRef.current.id, {
        boundingbox: [-10, 5.5, 185, 0.8],
        axis: true,
        showNavigation: false,
        showCopyright: false,
        keepAspectRatio: false,
        defaultAxes: {
          x: {
            name: "θ₀ (degrees)",
            withLabel: true,
            strokeColor: colors.fg3,
            ticks: { strokeColor: colors.fg3, label: { strokeColor: colors.fg2 } },
          },
          y: {
            name: "T / T₀",
            withLabel: true,
            strokeColor: colors.fg3,
            ticks: { strokeColor: colors.fg3, label: { strokeColor: colors.fg2 } },
          },
        },
      });

      // Plot T/T0 vs amplitude in degrees
      board.create("functiongraph", [
        (deg: number) => {
          if (deg <= 0 || deg >= 180) return NaN;
          const rad = (deg * Math.PI) / 180;
          return periodRatio(rad);
        },
        0.1, 179.5,
      ], { strokeColor: "#5BE9FF", strokeWidth: 2 });

      // Reference line at T/T0 = 1
      board.create("line", [[0, 1], [180, 1]], {
        strokeColor: colors.fg3, strokeWidth: 1, dash: 2,
        straightFirst: false, straightLast: false,
      });

      // Annotate key points
      const annotations: [number, string][] = [
        [15, "15°: +0.5%"],
        [45, "45°: +4%"],
        [90, "90°: +18%"],
        [150, "150°: +76%"],
      ];
      for (const [deg, label] of annotations) {
        const rad = (deg * Math.PI) / 180;
        const ratio = periodRatio(rad);
        board.create("point", [deg, ratio], {
          name: label, size: 3,
          fillColor: "#FF6B6B", strokeColor: "#FF6B6B",
          showInfobox: false, fixed: true,
          label: { fontSize: 10, strokeColor: colors.fg1, offset: [5, 10] },
        });
      }

      boardRef.current = board;
    })();

    return () => {
      cancelled = true;
      if (boardRef.current) {
        try {
          const JXG = require("jsxgraph");
          JXG.JSXGraph.freeBoard(boardRef.current);
        } catch { /* noop */ }
      }
    };
  }, [colors]);

  return (
    <div
      ref={containerRef}
      className="jxgbox mx-auto"
      style={{ width, height, backgroundColor: "transparent" }}
    />
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add components/physics/period-vs-amplitude-scene.tsx
git commit -m "feat: add PeriodVsAmplitudeScene — T/T₀ ratio plot for pendulum"
```

---

## Task 10: FIG.02 — Beyond Small Angles MDX

**Files:**
- Create: `app/[locale]/(topics)/classical-mechanics/beyond-small-angles/page.mdx`

- [ ] **Step 1: Create the MDX file**

Create the full 7-section article following the exact same patterns as `the-simple-pendulum/page.mdx`.

Imports:
```tsx
import { TopicHeader } from "@/components/layout/topic-header";
import { Section } from "@/components/layout/section";
import { SceneCard } from "@/components/layout/scene-card";
import { EquationBlock } from "@/components/math/equation-block";
import { Callout } from "@/components/layout/callout";
import { PendulumScene } from "@/components/physics/pendulum-scene";
import { TaylorExpansionScene } from "@/components/physics/taylor-expansion-scene";
import { EnergyDiagramScene } from "@/components/physics/energy-diagram-scene";
import { SeparatrixScene } from "@/components/physics/separatrix-scene";
import { PeriodVsAmplitudeScene } from "@/components/physics/period-vs-amplitude-scene";
import { TopicPageLayout } from "@/components/layout/topic-page-layout";
```

TopicHeader:
```tsx
<TopicHeader
  eyebrow="§ 01 · CLASSICAL MECHANICS"
  title="BEYOND SMALL ANGLES"
  subtitle="What the pendulum hides when you stop making approximations."
/>
```

Aside links: physicists Galileo, Newton + terms from spec (elliptic-integral, separatrix, etc. — add as they're created in Task 12).

7 sections per spec:
1. Where the trick fails — Taylor expansion of sin θ, quantitative error table. `<TaylorExpansionScene />`
2. The real equation — θ″ = -(g/L)sin θ, side-by-side pendulums (reuse `<PendulumScene exact />` pattern from old page §6)
3. Energy tells the story — T + U = E conservation. `<EnergyDiagramScene />`
4. The potential well — U(θ) shape, three regimes. Same EnergyDiagramScene with different props.
5. The full phase portrait — `<SeparatrixScene />`
6. The exact period — Elliptic integral, `<PeriodVsAmplitudeScene />`
7. Why nonlinearity matters — text + link to FIG.03

Write the full physics-rich prose. Use `<EquationBlock>` for key equations. Use `<Callout variant="math">` for derivation steps. Use `<Term>` and `<PhysicistLink>` inline where appropriate.

- [ ] **Step 2: Update branches.ts to mark FIG.02 as live**

Change `status: "draft"` to `status: "live"` for the `beyond-small-angles` topic.

- [ ] **Step 3: Verify the page loads**

Navigate to `/en/classical-mechanics/beyond-small-angles`. Verify all 7 sections render, visualizations animate.

- [ ] **Step 4: Commit**

```bash
git add app/[locale]/(topics)/classical-mechanics/beyond-small-angles/
git add lib/content/branches.ts
git commit -m "feat: create FIG.02 Beyond Small Angles — nonlinear pendulum physics"
```

---

## Task 11: DampedPendulumScene, ResonanceCurveScene, UniversalOscillatorScene Components

**Files:**
- Create: `components/physics/damped-pendulum-scene.tsx`
- Create: `components/physics/resonance-curve-scene.tsx`
- Create: `components/physics/universal-oscillator-scene.tsx`

- [ ] **Step 1: Create DampedPendulumScene**

Canvas 2D pendulum with adjustable damping slider. Shows exponential envelope. Uses `dampedFree` from `lib/physics/damped-oscillator.ts`.

```tsx
// components/physics/damped-pendulum-scene.tsx
"use client";

import { useRef, useState } from "react";
import { useAnimationFrame } from "@/lib/animation/use-animation-frame";
import { useThemeColors } from "@/lib/hooks/use-theme-colors";
import { dampedFree, qualityFactor } from "@/lib/physics/damped-oscillator";

export interface DampedPendulumSceneProps {
  theta0?: number;
  length?: number;
  width?: number;
  height?: number;
}

export function DampedPendulumScene({
  theta0 = 0.4,
  length = 1.2,
  width = 480,
  height = 400,
}: DampedPendulumSceneProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const colors = useThemeColors();
  const [gamma, setGamma] = useState(0.5);

  const omega0 = Math.sqrt(9.80665 / length);
  const params = { omega0, gamma };
  const Q = qualityFactor(params);

  useAnimationFrame({
    elementRef: containerRef,
    onFrame: (t) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      const dpr = window.devicePixelRatio || 1;
      if (canvas.width !== width * dpr || canvas.height !== height * dpr) {
        canvas.width = width * dpr;
        canvas.height = height * dpr;
        ctx.scale(dpr, dpr);
      }

      ctx.clearRect(0, 0, width, height);

      const theta = dampedFree(t, theta0, params);

      // Draw pendulum
      const pivotX = width / 2;
      const pivotY = 50;
      const pxPerMeter = (height - 160) / Math.max(length, 0.1);
      const bobX = pivotX + pxPerMeter * length * Math.sin(theta);
      const bobY = pivotY + pxPerMeter * length * Math.cos(theta);

      // Rod
      ctx.strokeStyle = colors.fg0;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(pivotX, pivotY);
      ctx.lineTo(bobX, bobY);
      ctx.stroke();

      // Pivot
      ctx.fillStyle = colors.fg2;
      ctx.beginPath();
      ctx.arc(pivotX, pivotY, 3, 0, 2 * Math.PI);
      ctx.fill();

      // Bob
      ctx.shadowColor = "rgba(91, 233, 255, 0.6)";
      ctx.shadowBlur = 16;
      ctx.fillStyle = "#5BE9FF";
      ctx.beginPath();
      ctx.arc(bobX, bobY, 10, 0, 2 * Math.PI);
      ctx.fill();
      ctx.shadowBlur = 0;

      // Draw x(t) trace at bottom
      const traceY = height - 60;
      const traceH = 50;
      const traceW = width - 80;
      const traceL = 40;

      ctx.strokeStyle = colors.fg3;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(traceL, traceY);
      ctx.lineTo(traceL + traceW, traceY);
      ctx.stroke();

      // Draw recent ~6 seconds of motion
      const tWindow = 6;
      ctx.strokeStyle = "#5BE9FF";
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      for (let px = 0; px <= traceW; px++) {
        const tSample = Math.max(0, t - tWindow) + (px / traceW) * tWindow;
        if (tSample > t) break;
        const x = dampedFree(tSample, theta0, params);
        const y = traceY - (x / theta0) * (traceH / 2);
        if (px === 0) ctx.moveTo(traceL + px, y);
        else ctx.lineTo(traceL + px, y);
      }
      ctx.stroke();

      // Envelope
      ctx.strokeStyle = "rgba(255, 107, 107, 0.5)";
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      for (let px = 0; px <= traceW; px++) {
        const tSample = Math.max(0, t - tWindow) + (px / traceW) * tWindow;
        if (tSample > t) break;
        const env = theta0 * Math.exp(-gamma * tSample / 2);
        const y = traceY - (env / theta0) * (traceH / 2);
        if (px === 0) ctx.moveTo(traceL + px, y);
        else ctx.lineTo(traceL + px, y);
      }
      ctx.stroke();
      ctx.setLineDash([]);
    },
  });

  return (
    <div>
      <div ref={containerRef} style={{ width, height }} className="mx-auto">
        <canvas ref={canvasRef} style={{ width, height }} className="block" />
      </div>
      <div className="mt-4 flex items-center justify-center gap-6">
        <label className="flex items-center gap-2 font-mono text-xs text-[var(--color-fg-2)]">
          γ
          <input
            type="range"
            min="0"
            max="8"
            step="0.1"
            value={gamma}
            onChange={(e) => setGamma(Number(e.target.value))}
            className="w-32"
          />
          {gamma.toFixed(1)}
        </label>
        <span className="font-mono text-xs text-[var(--color-fg-2)]">
          Q = {Q === Infinity ? "∞" : Q.toFixed(1)}
        </span>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Create ResonanceCurveScene**

JSXGraph plot of amplitude vs driving frequency with adjustable Q.

```tsx
// components/physics/resonance-curve-scene.tsx
"use client";

import { useEffect, useRef, useState } from "react";
import { useThemeColors } from "@/lib/hooks/use-theme-colors";
import { drivenAmplitude } from "@/lib/physics/damped-oscillator";

export interface ResonanceCurveSceneProps {
  width?: number;
  height?: number;
}

export function ResonanceCurveScene({
  width = 480,
  height = 360,
}: ResonanceCurveSceneProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const boardRef = useRef<any>(null);
  const curveRef = useRef<any>(null);
  const [Q, setQ] = useState(10);
  const colors = useThemeColors();

  const omega0 = 1; // normalized
  const F0 = 1;
  const gamma = omega0 / Q;

  useEffect(() => {
    let cancelled = false;

    (async () => {
      const JXG = (await import("jsxgraph")).default;
      if (cancelled || !containerRef.current) return;

      if (!containerRef.current.id) {
        containerRef.current.id = `resonance-${Math.random().toString(36).slice(2)}`;
      }

      const board = JXG.JSXGraph.initBoard(containerRef.current.id, {
        boundingbox: [-0.1, 12, 2.2, -0.5],
        axis: true,
        showNavigation: false,
        showCopyright: false,
        keepAspectRatio: false,
        defaultAxes: {
          x: { name: "ω_d / ω₀", strokeColor: colors.fg3, ticks: { strokeColor: colors.fg3, label: { strokeColor: colors.fg2 } } },
          y: { name: "A / A₀", strokeColor: colors.fg3, ticks: { strokeColor: colors.fg3, label: { strokeColor: colors.fg2 } } },
        },
      });

      boardRef.current = board;
    })();

    return () => {
      cancelled = true;
      if (boardRef.current) {
        try {
          const JXG = require("jsxgraph");
          JXG.JSXGraph.freeBoard(boardRef.current);
        } catch { /* noop */ }
      }
    };
  }, [colors]);

  useEffect(() => {
    const board = boardRef.current;
    if (!board) return;

    if (curveRef.current) {
      board.removeObject(curveRef.current);
    }

    const g = omega0 / Q;
    curveRef.current = board.create("functiongraph", [
      (omegaD: number) => drivenAmplitude(omegaD, F0, { omega0, gamma: g }),
      0.01, 2.2,
    ], { strokeColor: "#5BE9FF", strokeWidth: 2 });
  }, [Q]);

  return (
    <div>
      <div
        ref={containerRef}
        className="jxgbox mx-auto"
        style={{ width, height, backgroundColor: "transparent" }}
      />
      <div className="mt-4 flex items-center justify-center gap-4">
        <label className="flex items-center gap-2 font-mono text-xs text-[var(--color-fg-2)]">
          Q
          <input
            type="range"
            min="1"
            max="50"
            step="1"
            value={Q}
            onChange={(e) => setQ(Number(e.target.value))}
            className="w-32"
          />
          {Q}
        </label>
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Create UniversalOscillatorScene**

Canvas 2D with toggle between pendulum, spring, and LC circuit visualizations, all producing the same sinusoid.

```tsx
// components/physics/universal-oscillator-scene.tsx
"use client";

import { useRef, useState } from "react";
import { useAnimationFrame } from "@/lib/animation/use-animation-frame";
import { useThemeColors } from "@/lib/hooks/use-theme-colors";

type SystemType = "pendulum" | "spring" | "lc";

export interface UniversalOscillatorSceneProps {
  width?: number;
  height?: number;
}

export function UniversalOscillatorScene({
  width = 480,
  height = 400,
}: UniversalOscillatorSceneProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const colors = useThemeColors();
  const [system, setSystem] = useState<SystemType>("pendulum");

  const omega = 2; // normalized
  const A = 1; // amplitude

  useAnimationFrame({
    elementRef: containerRef,
    onFrame: (t) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      const dpr = window.devicePixelRatio || 1;
      if (canvas.width !== width * dpr || canvas.height !== height * dpr) {
        canvas.width = width * dpr;
        canvas.height = height * dpr;
        ctx.scale(dpr, dpr);
      }

      ctx.clearRect(0, 0, width, height);
      const x = A * Math.cos(omega * t);

      // Draw system visualization in top half
      const midY = height * 0.45;

      if (system === "pendulum") {
        const pivotX = width / 2;
        const pivotY = 30;
        const L = midY - 60;
        const angle = x * 0.4;
        const bobX = pivotX + L * Math.sin(angle);
        const bobY = pivotY + L * Math.cos(angle);

        ctx.strokeStyle = colors.fg0;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(pivotX, pivotY);
        ctx.lineTo(bobX, bobY);
        ctx.stroke();

        ctx.fillStyle = colors.fg2;
        ctx.beginPath();
        ctx.arc(pivotX, pivotY, 3, 0, 2 * Math.PI);
        ctx.fill();

        ctx.shadowColor = "rgba(91, 233, 255, 0.6)";
        ctx.shadowBlur = 12;
        ctx.fillStyle = "#5BE9FF";
        ctx.beginPath();
        ctx.arc(bobX, bobY, 10, 0, 2 * Math.PI);
        ctx.fill();
        ctx.shadowBlur = 0;
      } else if (system === "spring") {
        const wallX = 60;
        const massW = 40;
        const restLen = (width - 160) / 2;
        const massX = wallX + restLen + x * 60;
        const cy = midY - 40;

        // Wall
        ctx.strokeStyle = colors.fg2;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(wallX, cy - 30);
        ctx.lineTo(wallX, cy + 30);
        ctx.stroke();

        // Spring (zigzag)
        ctx.strokeStyle = "#5BE9FF";
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(wallX, cy);
        const coils = 10;
        const springLen = massX - wallX;
        for (let i = 0; i <= coils; i++) {
          const sx = wallX + (springLen * i) / coils;
          const sy = cy + (i % 2 === 0 ? -10 : 10) * (i > 0 && i < coils ? 1 : 0);
          ctx.lineTo(sx, sy);
        }
        ctx.stroke();

        // Mass
        ctx.fillStyle = "#5BE9FF";
        ctx.shadowColor = "rgba(91, 233, 255, 0.4)";
        ctx.shadowBlur = 8;
        ctx.fillRect(massX, cy - 15, massW, 30);
        ctx.shadowBlur = 0;
      } else {
        // LC circuit — simple schematic
        const cy = midY - 40;
        const cx = width / 2;
        const charge = x;

        // Capacitor plates
        ctx.strokeStyle = colors.fg2;
        ctx.lineWidth = 2;
        const gap = 20;
        ctx.beginPath();
        ctx.moveTo(cx - gap / 2, cy - 25);
        ctx.lineTo(cx - gap / 2, cy + 25);
        ctx.moveTo(cx + gap / 2, cy - 25);
        ctx.lineTo(cx + gap / 2, cy + 25);
        ctx.stroke();

        // Charge indicator
        const chargeH = Math.abs(charge) * 20;
        ctx.fillStyle = charge > 0 ? "rgba(91, 233, 255, 0.6)" : "rgba(255, 107, 107, 0.6)";
        ctx.fillRect(cx - gap / 2 - 8, cy - chargeH / 2, 8, chargeH);
        ctx.fillStyle = charge < 0 ? "rgba(91, 233, 255, 0.6)" : "rgba(255, 107, 107, 0.6)";
        ctx.fillRect(cx + gap / 2, cy - chargeH / 2, 8, chargeH);

        // Wires
        ctx.strokeStyle = colors.fg2;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(cx - gap / 2, cy);
        ctx.lineTo(cx - 80, cy);
        ctx.lineTo(cx - 80, cy + 50);
        ctx.lineTo(cx + 80, cy + 50);
        ctx.lineTo(cx + 80, cy);
        ctx.lineTo(cx + gap / 2, cy);
        ctx.stroke();

        // Inductor symbol (bumps)
        ctx.strokeStyle = "#5BE9FF";
        ctx.lineWidth = 2;
        ctx.beginPath();
        for (let i = 0; i < 4; i++) {
          const bx = cx - 40 + i * 20;
          ctx.arc(bx + 10, cy + 50, 10, Math.PI, 0, false);
        }
        ctx.stroke();

        ctx.fillStyle = colors.fg2;
        ctx.font = "11px monospace";
        ctx.fillText("C", cx - 4, cy - 30);
        ctx.fillText("L", cx - 4, cy + 75);
      }

      // Draw shared sinusoid trace at bottom
      const traceTop = midY + 20;
      const traceH = height - traceTop - 30;
      const traceMid = traceTop + traceH / 2;
      const traceL = 40;
      const traceW = width - 80;

      // Center line
      ctx.strokeStyle = colors.fg3;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(traceL, traceMid);
      ctx.lineTo(traceL + traceW, traceMid);
      ctx.stroke();

      // Sinusoid
      const tWindow = 6;
      ctx.strokeStyle = "#5BE9FF";
      ctx.lineWidth = 2;
      ctx.beginPath();
      for (let px = 0; px <= traceW; px++) {
        const tSample = Math.max(0, t - tWindow) + (px / traceW) * tWindow;
        if (tSample > t) break;
        const val = A * Math.cos(omega * tSample);
        const y = traceMid - val * (traceH * 0.4);
        if (px === 0) ctx.moveTo(traceL + px, y);
        else ctx.lineTo(traceL + px, y);
      }
      ctx.stroke();

      // Label
      ctx.fillStyle = colors.fg2;
      ctx.font = "11px monospace";
      ctx.fillText("x(t) = A cos(ωt)", traceL, traceTop - 4);
    },
  });

  return (
    <div>
      <div ref={containerRef} style={{ width, height }} className="mx-auto">
        <canvas ref={canvasRef} style={{ width, height }} className="block" />
      </div>
      <div className="mt-4 flex items-center justify-center gap-3">
        {(["pendulum", "spring", "lc"] as const).map((s) => (
          <button
            key={s}
            onClick={() => setSystem(s)}
            className={`rounded border px-3 py-1 font-mono text-xs uppercase ${
              system === s
                ? "border-[var(--color-cyan)] text-[var(--color-cyan)]"
                : "border-[var(--color-fg-3)] text-[var(--color-fg-2)]"
            }`}
          >
            {s === "lc" ? "LC circuit" : s}
          </button>
        ))}
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Commit**

```bash
git add components/physics/damped-pendulum-scene.tsx components/physics/resonance-curve-scene.tsx components/physics/universal-oscillator-scene.tsx
git commit -m "feat: add DampedPendulum, ResonanceCurve, and UniversalOscillator scenes for FIG.03"
```

---

## Task 12: CoupledPendulumScene and WaveChainScene Components

**Files:**
- Create: `components/physics/coupled-pendulum-scene.tsx`
- Create: `components/physics/wave-chain-scene.tsx`

- [ ] **Step 1: Create CoupledPendulumScene**

Canvas 2D: two pendulums connected by a spring. Buttons toggle between "mode 1" (in-phase), "mode 2" (anti-phase), and "beats". Uses `lib/physics/coupled-oscillator.ts`.

```tsx
// components/physics/coupled-pendulum-scene.tsx
"use client";

import { useRef, useState } from "react";
import { useAnimationFrame } from "@/lib/animation/use-animation-frame";
import { useThemeColors } from "@/lib/hooks/use-theme-colors";
import { coupledBeats, coupledMode1, coupledMode2 } from "@/lib/physics/coupled-oscillator";

type Mode = "beats" | "mode1" | "mode2";

export interface CoupledPendulumSceneProps {
  width?: number;
  height?: number;
}

export function CoupledPendulumScene({
  width = 480,
  height = 360,
}: CoupledPendulumSceneProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const colors = useThemeColors();
  const [mode, setMode] = useState<Mode>("beats");

  const omega0 = 2.5;
  const omegaC = 1.2;
  const params = { omega0, omegaC };
  const A = 0.4;

  useAnimationFrame({
    elementRef: containerRef,
    onFrame: (t) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      const dpr = window.devicePixelRatio || 1;
      if (canvas.width !== width * dpr || canvas.height !== height * dpr) {
        canvas.width = width * dpr;
        canvas.height = height * dpr;
        ctx.scale(dpr, dpr);
      }

      ctx.clearRect(0, 0, width, height);

      let state;
      if (mode === "mode1") state = coupledMode1(t, A, params);
      else if (mode === "mode2") state = coupledMode2(t, A, params);
      else state = coupledBeats(t, A, params);

      const L = 160;
      const pivotY = 40;
      const spacing = 160;
      const cx1 = width / 2 - spacing / 2;
      const cx2 = width / 2 + spacing / 2;

      // Draw each pendulum
      for (const [cx, theta] of [[cx1, state.theta1], [cx2, state.theta2]] as [number, number][]) {
        const bobX = cx + L * Math.sin(theta);
        const bobY = pivotY + L * Math.cos(theta);

        ctx.strokeStyle = colors.fg0;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(cx, pivotY);
        ctx.lineTo(bobX, bobY);
        ctx.stroke();

        ctx.fillStyle = colors.fg2;
        ctx.beginPath();
        ctx.arc(cx, pivotY, 3, 0, 2 * Math.PI);
        ctx.fill();

        ctx.shadowColor = "rgba(91, 233, 255, 0.6)";
        ctx.shadowBlur = 12;
        ctx.fillStyle = "#5BE9FF";
        ctx.beginPath();
        ctx.arc(bobX, bobY, 10, 0, 2 * Math.PI);
        ctx.fill();
        ctx.shadowBlur = 0;
      }

      // Spring between bobs at midpoint of rods
      const springY = pivotY + L * 0.5;
      const x1 = cx1 + (L * 0.5) * Math.sin(state.theta1);
      const x2 = cx2 + (L * 0.5) * Math.sin(state.theta2);

      ctx.strokeStyle = "#FF6B6B";
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(x1, springY);
      const coils = 8;
      const springLen = x2 - x1;
      for (let i = 0; i <= coils; i++) {
        const sx = x1 + (springLen * i) / coils;
        const sy = springY + (i % 2 === 0 ? -5 : 5) * (i > 0 && i < coils ? 1 : 0);
        ctx.lineTo(sx, sy);
      }
      ctx.stroke();
    },
  });

  return (
    <div>
      <div ref={containerRef} style={{ width, height }} className="mx-auto">
        <canvas ref={canvasRef} style={{ width, height }} className="block" />
      </div>
      <div className="mt-4 flex items-center justify-center gap-3">
        {([["mode1", "Mode 1"], ["mode2", "Mode 2"], ["beats", "Beats"]] as const).map(([m, label]) => (
          <button
            key={m}
            onClick={() => setMode(m)}
            className={`rounded border px-3 py-1 font-mono text-xs uppercase ${
              mode === m
                ? "border-[var(--color-cyan)] text-[var(--color-cyan)]"
                : "border-[var(--color-fg-3)] text-[var(--color-fg-2)]"
            }`}
          >
            {label}
          </button>
        ))}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Create WaveChainScene**

Canvas 2D: chain of N coupled pendulums. A slider adjusts N (3–30). Initial pluck at one end propagates as a wave.

```tsx
// components/physics/wave-chain-scene.tsx
"use client";

import { useRef, useState, useCallback } from "react";
import { useAnimationFrame } from "@/lib/animation/use-animation-frame";
import { useThemeColors } from "@/lib/hooks/use-theme-colors";

export interface WaveChainSceneProps {
  width?: number;
  height?: number;
}

export function WaveChainScene({
  width = 480,
  height = 300,
}: WaveChainSceneProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const colors = useThemeColors();
  const [N, setN] = useState(15);

  // Simulate a chain of coupled oscillators.
  // Simple approach: compute normal modes and superpose.
  // For a chain of N identical masses with fixed endpoints,
  // normal mode frequencies: omega_k = 2*omega0*sin(k*pi/(2*(N+1)))
  // mode shape: u_k(j) = sin(k*pi*j/(N+1))
  // Initial condition: pluck the first mass.

  const getDisplacements = useCallback((t: number, n: number): number[] => {
    const omega0 = 3;
    const displacements: number[] = new Array(n).fill(0);

    // Initial condition: mass 1 displaced by A, rest at zero.
    // Decompose into modes: c_k = (2/(N+1)) * sum_j u0(j) * sin(k*pi*j/(N+1))
    // With u0(1)=A, u0(j)=0 for j>1: c_k = (2*A/(N+1)) * sin(k*pi/(N+1))
    const A = 0.8;

    for (let k = 1; k <= n; k++) {
      const omegaK = 2 * omega0 * Math.sin((k * Math.PI) / (2 * (n + 1)));
      const ck = (2 * A / (n + 1)) * Math.sin((k * Math.PI) / (n + 1));
      for (let j = 0; j < n; j++) {
        const modeShape = Math.sin((k * Math.PI * (j + 1)) / (n + 1));
        displacements[j] += ck * modeShape * Math.cos(omegaK * t);
      }
    }
    return displacements;
  }, []);

  useAnimationFrame({
    elementRef: containerRef,
    onFrame: (t) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      const dpr = window.devicePixelRatio || 1;
      if (canvas.width !== width * dpr || canvas.height !== height * dpr) {
        canvas.width = width * dpr;
        canvas.height = height * dpr;
        ctx.scale(dpr, dpr);
      }

      ctx.clearRect(0, 0, width, height);

      const displacements = getDisplacements(t, N);

      const padL = 40;
      const padR = 40;
      const plotW = width - padL - padR;
      const midY = height / 2;
      const ampScale = 60;

      // Draw equilibrium line
      ctx.strokeStyle = colors.fg3;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(padL, midY);
      ctx.lineTo(padL + plotW, midY);
      ctx.stroke();

      // Draw connections and masses
      const spacing = plotW / (N + 1);
      let prevX = padL;
      let prevY = midY;

      for (let i = 0; i < N; i++) {
        const x = padL + spacing * (i + 1);
        const y = midY - displacements[i]! * ampScale;

        // Connection line
        ctx.strokeStyle = colors.fg2;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(prevX, prevY);
        ctx.lineTo(x, y);
        ctx.stroke();

        prevX = x;
        prevY = y;
      }

      // Last connection to right wall
      ctx.strokeStyle = colors.fg2;
      ctx.beginPath();
      ctx.moveTo(prevX, prevY);
      ctx.lineTo(padL + plotW, midY);
      ctx.stroke();

      // Draw masses
      for (let i = 0; i < N; i++) {
        const x = padL + spacing * (i + 1);
        const y = midY - displacements[i]! * ampScale;

        ctx.shadowColor = "rgba(91, 233, 255, 0.5)";
        ctx.shadowBlur = 8;
        ctx.fillStyle = "#5BE9FF";
        ctx.beginPath();
        ctx.arc(x, y, Math.max(3, 8 - N * 0.2), 0, 2 * Math.PI);
        ctx.fill();
        ctx.shadowBlur = 0;
      }

      // Draw fixed endpoints
      for (const wx of [padL, padL + plotW]) {
        ctx.fillStyle = colors.fg2;
        ctx.fillRect(wx - 3, midY - 15, 6, 30);
      }
    },
  });

  return (
    <div>
      <div ref={containerRef} style={{ width, height }} className="mx-auto">
        <canvas ref={canvasRef} style={{ width, height }} className="block" />
      </div>
      <div className="mt-4 flex items-center justify-center gap-4">
        <label className="flex items-center gap-2 font-mono text-xs text-[var(--color-fg-2)]">
          N
          <input
            type="range"
            min="3"
            max="30"
            step="1"
            value={N}
            onChange={(e) => setN(Number(e.target.value))}
            className="w-32"
          />
          {N}
        </label>
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Commit**

```bash
git add components/physics/coupled-pendulum-scene.tsx components/physics/wave-chain-scene.tsx
git commit -m "feat: add CoupledPendulumScene and WaveChainScene for FIG.03"
```

---

## Task 13: FIG.03 — Oscillators Everywhere MDX

**Files:**
- Create: `app/[locale]/(topics)/classical-mechanics/oscillators-everywhere/page.mdx`

- [ ] **Step 1: Create the MDX file**

7-section article following exact same patterns.

Imports:
```tsx
import { TopicHeader } from "@/components/layout/topic-header";
import { Section } from "@/components/layout/section";
import { SceneCard } from "@/components/layout/scene-card";
import { EquationBlock } from "@/components/math/equation-block";
import { Callout } from "@/components/layout/callout";
import { UniversalOscillatorScene } from "@/components/physics/universal-oscillator-scene";
import { DampedPendulumScene } from "@/components/physics/damped-pendulum-scene";
import { ResonanceCurveScene } from "@/components/physics/resonance-curve-scene";
import { CoupledPendulumScene } from "@/components/physics/coupled-pendulum-scene";
import { WaveChainScene } from "@/components/physics/wave-chain-scene";
import { TopicPageLayout } from "@/components/layout/topic-page-layout";
```

TopicHeader:
```tsx
<TopicHeader
  eyebrow="§ 01 · CLASSICAL MECHANICS"
  title="OSCILLATORS EVERYWHERE"
  subtitle="The equation that runs half of physics."
/>
```

7 sections per spec:
1. The universal pattern — SHM appears everywhere. `<UniversalOscillatorScene />`
2. Damped oscillations — friction, three regimes. `<DampedPendulumScene />`
3. The Q factor — quality factor, real-world examples.
4. Driven oscillations — periodic force, steady-state response. `<ResonanceCurveScene />`
5. Resonance — when driving freq matches natural freq. Examples.
6. Coupled oscillators — normal modes, beats. `<CoupledPendulumScene />`
7. From oscillators to waves — chain, wave equation. `<WaveChainScene />`

Write full physics-rich prose with equations, callouts, Term and PhysicistLink usage.

- [ ] **Step 2: Update branches.ts to mark FIG.03 as live**

Change `status: "draft"` to `status: "live"` for the `oscillators-everywhere` topic.

- [ ] **Step 3: Verify the page loads**

Navigate to `/en/classical-mechanics/oscillators-everywhere`. Verify all sections render.

- [ ] **Step 4: Commit**

```bash
git add app/[locale]/(topics)/classical-mechanics/oscillators-everywhere/
git add lib/content/branches.ts
git commit -m "feat: create FIG.03 Oscillators Everywhere — damping, resonance, coupled oscillators"
```

---

## Task 14: New Glossary Terms and Physicist Entries

**Files:**
- Modify: `lib/content/glossary.ts`
- Modify: `lib/content/physicists.ts`

- [ ] **Step 1: Add 12 new glossary terms to glossary.ts**

Add to the GLOSSARY array, following the exact same structure as existing entries. Terms to add:

1. `tautochrone` — concept, related to the-simple-pendulum
2. `cycloid` — concept, related to the-simple-pendulum
3. `elliptic-integral` — concept, related to beyond-small-angles
4. `separatrix` — concept, related to beyond-small-angles
5. `libration` — concept, related to beyond-small-angles
6. `nonlinear-dynamics` — concept, related to beyond-small-angles
7. `potential-well` — concept, related to beyond-small-angles
8. `damping` — concept, related to oscillators-everywhere
9. `q-factor` — concept, related to oscillators-everywhere
10. `resonance` — phenomenon, related to oscillators-everywhere
11. `normal-modes` — concept, related to oscillators-everywhere
12. `beats` — phenomenon, related to oscillators-everywhere

Each entry needs: `slug`, `term`, `category`, `shortDefinition`, `description`, optional `history`, optional `visualization`, optional `relatedPhysicists`, `relatedTopics`.

Use the same writing style and depth as existing entries (see `isochronism`, `restoring-force` for reference).

- [ ] **Step 2: Add 4 new physicist entries to physicists.ts**

Add following the exact same structure as existing entries (see `leon-foucault` for reference). Each needs: `slug`, `name`, `shortName`, `born`, `died`, `nationality`, `oneLiner`, `bio` (multi-paragraph), `contributions`, `majorWorks`, `relatedTopics`.

1. `pierre-bouguer` — French, 1698-1758, gravity measurements, related to the-simple-pendulum
2. `adrien-marie-legendre` — French, 1752-1833, elliptic integrals, related to beyond-small-angles
3. `nikola-tesla` — Serbian-American, 1856-1943, resonance/AC, related to oscillators-everywhere
4. `jules-lissajous` — French, 1822-1880, coupled oscillations, related to oscillators-everywhere

Use `storageUrl("physicists/<slug>.avif")` for image paths (images will be uploaded separately).

- [ ] **Step 3: Update refs validation**

Run the refs validation to ensure all cross-references are valid:
```bash
cd /Users/romanpochtman/Developer/physics && npx tsx -e "import { validateContentRefs } from './lib/content/refs'; const r = validateContentRefs(); if (!r.ok) { console.error(r.errors); process.exit(1); } else { console.log('OK'); }"
```
Expected: "OK" with no errors.

- [ ] **Step 4: Commit**

```bash
git add lib/content/glossary.ts lib/content/physicists.ts
git commit -m "feat: add 12 glossary terms and 4 physicist entries for pendulum modules"
```

---

## Task 15: Update Visualization Registry and Final Integration

**Files:**
- Modify: `components/physics/visualization-registry.tsx`
- Modify: `app/sitemap.ts` (if it references topic slugs)

- [ ] **Step 1: Register new visualizations in the registry**

Add dynamic imports and entries for any new components that should appear in glossary term pages:

```tsx
const SmallAngleScene = dynamic(
  () => import("@/components/physics/small-angle-scene").then((m) => ({ default: m.SmallAngleScene })),
  { ssr: false },
);

const CycloidScene = dynamic(
  () => import("@/components/physics/cycloid-scene").then((m) => ({ default: m.CycloidScene })),
  { ssr: false },
);

const SeparatrixScene = dynamic(
  () => import("@/components/physics/separatrix-scene").then((m) => ({ default: m.SeparatrixScene })),
  { ssr: false },
);

const EnergyDiagramScene = dynamic(
  () => import("@/components/physics/energy-diagram-scene").then((m) => ({ default: m.EnergyDiagramScene })),
  { ssr: false },
);

const ResonanceCurveScene = dynamic(
  () => import("@/components/physics/resonance-curve-scene").then((m) => ({ default: m.ResonanceCurveScene })),
  { ssr: false },
);

const CoupledPendulumScene = dynamic(
  () => import("@/components/physics/coupled-pendulum-scene").then((m) => ({ default: m.CoupledPendulumScene })),
  { ssr: false },
);
```

Add to the VISUALIZATIONS record:
```typescript
"small-angle": SmallAngleScene,
"cycloid": CycloidScene,
"separatrix": SeparatrixScene,
"energy-diagram": () => <EnergyDiagramScene />,
"resonance-curve": () => <ResonanceCurveScene />,
"coupled-pendulum": () => <CoupledPendulumScene />,
```

- [ ] **Step 2: Update sitemap if needed**

Check `app/sitemap.ts`. If it calls `getAllRoutes()`, it should automatically pick up new routes since `getAllRoutes` iterates over `BRANCHES` and their topics. Verify no hardcoded slug references need updating.

- [ ] **Step 3: Full build check**

Run: `cd /Users/romanpochtman/Developer/physics && pnpm build`
Expected: Build succeeds with no errors.

- [ ] **Step 4: Visual verification**

Navigate through all three new pages:
1. `/en/classical-mechanics/the-simple-pendulum` — 8 sections, all visualizations animate
2. `/en/classical-mechanics/beyond-small-angles` — 7 sections, all visualizations animate
3. `/en/classical-mechanics/oscillators-everywhere` — 7 sections, all visualizations animate
4. `/en/classical-mechanics` — branch page shows module groupings
5. Previous/next navigation flows correctly through all topics
6. Glossary terms link back to correct topics
7. Physicist pages link to correct topics
8. Old `/classical-mechanics/pendulum` redirects to new URL

- [ ] **Step 5: Commit**

```bash
git add components/physics/visualization-registry.tsx
git commit -m "feat: register new visualizations and finalize pendulum module integration"
```

---

## Execution Dependencies

Tasks can be parallelized as follows:

- **Task 1** must complete first (type system foundation)
- **Task 2** depends on Task 1
- **Task 3** depends on Task 1
- **Task 4** (physics libs) is independent — can run parallel with Tasks 2-3
- **Tasks 5, 6, 7, 8, 9** (individual components) depend on Task 4 but are independent of each other — can run in parallel
- **Task 10** (FIG.02 MDX) depends on Tasks 5, 7, 8, 9
- **Tasks 11, 12** (FIG.03 components) depend on Task 4 but are independent of each other
- **Task 13** (FIG.03 MDX) depends on Tasks 11, 12
- **Task 14** (glossary + physicists) is independent — can run anytime after Task 1
- **Task 15** (integration) depends on everything else

```
Task 1 → Task 2
       → Task 3
       → Task 14
Task 4 → Tasks 5, 6, 7, 8, 9 (parallel) → Task 10
       → Tasks 11, 12 (parallel) → Task 13
All → Task 15
```
