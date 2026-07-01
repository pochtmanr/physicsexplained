# Orbital Mechanics Playground Improvements — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.
>
> At execution start, copy this plan to `docs/superpowers/plans/2026-07-02-orbital-mechanics-improvements.md` (standard plans location; plan mode restricted writing there during planning).

**Goal:** Implement the full spec in `docs/superpowers/specs/2026-07-02-orbital-mechanics-improvements-design.md` — deterministic cross-platform simulation, normalized input, richer controls, real-life presets, and registry-driven playground loading.

**Architecture:** The N-body playground (`components/playgrounds/orbital-mechanics/`) steps physics inside a rAF loop. We extract a pure fixed-timestep accumulator into `lib/physics/advance.ts` (every integration step exactly `SIM_DT = 0.005` → identical trajectories on every machine), normalize wheel input, cap DPR, then layer on log-scale sliders, a raised body cap, desktop pan, preset metadata (camera scale, labels, colors), and four computed-stable real-life presets.

**Tech Stack:** Next.js App Router, React 18 client components, canvas 2D, Zod URL-state schema, next-intl (en/he), Vitest (jsdom), pnpm.

## Context

Reported bug: "On Mac the playground works perfectly; on Windows the speed is always maximum." Root cause (verified in spec §1): the per-frame substep division at `n-body-canvas.tsx:336-344` makes integration step size depend on refresh rate; the N-body problem is chaotic, so Mac and Windows diverge within seconds — close encounters become high-speed ejections on one machine. Secondary Windows-specific issues: line-mode wheel deltas (Firefox), uncapped fractional DPR, and `speed: 4` persisting in shared URLs. User approved implementing the **full spec** (§4 fixes + §6 loader cleanup + §5 features + §7 i18n).

## Global Constraints

- `SIM_DT = 0.005` — every physics integration step is exactly this value (moves to `lib/physics/advance.ts`).
- Solver API unchanged: `step`/`resolveCollisions` signatures in `lib/physics/n-body.ts` stay as-is (exporting a new constant is allowed).
- URL stays the save format; no server-side changes.
- Old URL blobs must keep parsing: speed literals 0.25/1/4 and placeMass 0.5/1/5/20 are valid values in the new numeric ranges. (Note: blob fallback is **whole-state** — a failed `safeParse` resets everything to defaults, per `encode-state.ts:55-61`.)
- Vitest include glob is `["tests/**", "components/**", "app/**"]` — **`lib/**` co-located tests never run**. Tests for `lib/physics/advance.ts` go in `tests/physics/`. Playground-module tests stay co-located (existing pattern: `camera.test.ts` etc., these DO run).
- Hebrew translations are written by hand in this change — no machine translation, no scripts (standing user rule).
- Test runner: `pnpm test` (vitest run); single file: `pnpm vitest run <path>`.
- Commit after every task; branch is `harden/bot-abuse-defense` — ask user or create a feature branch `feat/orbital-mechanics-improvements` off `main` before Task 1 if they prefer isolation (current branch has many unrelated staged-adjacent changes; commit only files this plan touches).

---

### Task 1: Pure fixed-timestep accumulator (`lib/physics/advance.ts`) + determinism test

**Files:**
- Create: `lib/physics/advance.ts`
- Test: `tests/physics/advance.test.ts`

**Interfaces:**
- Consumes: `step(bodies, dt)`, `resolveCollisions(bodies)`, `type Body` from `lib/physics/n-body.ts`.
- Produces: `SIM_DT = 0.005`, `MAX_STEPS_PER_FRAME = 200`, `advanceSimulation(bodies: Body[], accumulator: number, frameDt: number, speed: number, simDt?: number, maxSteps?: number): { bodies: Body[]; accumulator: number; steps: number }` — Task 2 wires this into the canvas; Task 5 reads `steps` for the HUD.

- [ ] **Step 1: Write the failing test**

```ts
// tests/physics/advance.test.ts
import { describe, expect, it } from "vitest";
import { resolveCollisions, step, type Body } from "@/lib/physics/n-body";
import { advanceSimulation, SIM_DT, MAX_STEPS_PER_FRAME } from "@/lib/physics/advance";

// Chaotic starting state (Burrau's pythagorean problem) — maximally sensitive
// to any step-size difference, which is exactly what we're guarding against.
function startBodies(): Body[] {
  return [
    { id: "m3", mass: 3, x: 1, y: 3, vx: 0, vy: 0 },
    { id: "m4", mass: 4, x: -2, y: -1, vx: 0, vy: 0 },
    { id: "m5", mass: 5, x: 1, y: -1, vx: 0, vy: 0 },
  ];
}

/** Ground truth: n integration steps of exactly SIM_DT each. */
function integrateReference(bodies: Body[], nSteps: number): Body[] {
  let bs = bodies;
  for (let i = 0; i < nSteps; i++) bs = resolveCollisions(step(bs, SIM_DT));
  return bs;
}

describe("advanceSimulation", () => {
  it("trajectory depends only on total step count, never on frame pacing", () => {
    // 60 Hz Mac vs jittery 144 Hz Windows with frame drops.
    const steady = Array.from({ length: 120 }, () => 1 / 60);
    const jittery = Array.from({ length: 240 }, (_, i) =>
      i % 7 === 0 ? 1 / 30 : 1 / 144,
    );
    for (const dts of [steady, jittery]) {
      let bs = startBodies();
      let acc = 0;
      let total = 0;
      for (const dt of dts) {
        const r = advanceSimulation(bs, acc, dt, 1);
        bs = r.bodies;
        acc = r.accumulator;
        total += r.steps;
      }
      // toEqual on numbers is exact — proves every step used exactly SIM_DT.
      expect(bs).toEqual(integrateReference(startBodies(), total));
    }
  });

  it("carries the fractional remainder to the next frame", () => {
    const r1 = advanceSimulation(startBodies(), 0, 0.003, 1);
    expect(r1.steps).toBe(0);
    expect(r1.accumulator).toBeCloseTo(0.003, 12);
    const r2 = advanceSimulation(r1.bodies, r1.accumulator, 0.003, 1);
    expect(r2.steps).toBe(1);
    expect(r2.accumulator).toBeCloseTo(0.001, 12);
  });

  it("scales sim time by speed", () => {
    const r = advanceSimulation(startBodies(), 0, 0.01, 4);
    expect(r.steps).toBe(8); // 0.04 / 0.005
  });

  it("caps steps per frame and drops the excess backlog (spiral-of-death guard)", () => {
    const r = advanceSimulation(startBodies(), 0, 60, 10); // absurd frame
    expect(r.steps).toBe(MAX_STEPS_PER_FRAME);
    expect(r.accumulator).toBeLessThan(SIM_DT);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm vitest run tests/physics/advance.test.ts`
Expected: FAIL — cannot resolve `@/lib/physics/advance`.

- [ ] **Step 3: Write the implementation**

```ts
// lib/physics/advance.ts
import { resolveCollisions, step, type Body } from "./n-body";

/**
 * The one and only integration step size. Every machine integrates with
 * exactly this dt, so the same starting state produces bit-identical
 * trajectories regardless of refresh rate or frame pacing.
 */
export const SIM_DT = 0.005;

/**
 * Spiral-of-death guard: worst legitimate frame is the rAF clamp (0.1 s)
 * at max speed (10×) → 0.1 × 10 / 0.005 = 200 steps. Anything beyond that
 * is a pathological stall; we let the sim fall behind rather than freeze.
 */
export const MAX_STEPS_PER_FRAME = 200;

export interface AdvanceResult {
  bodies: Body[];
  /** Fractional sim-time remainder (< simDt) to feed into the next frame. */
  accumulator: number;
  /** Integration steps actually taken this frame. */
  steps: number;
}

/**
 * Classic fixed-timestep accumulator ("Fix Your Timestep"). Frame time is
 * banked into the accumulator; physics advances in whole SIM_DT steps and
 * the remainder carries over — never a variable-sized step.
 */
export function advanceSimulation(
  bodies: Body[],
  accumulator: number,
  frameDt: number,
  speed: number,
  simDt: number = SIM_DT,
  maxSteps: number = MAX_STEPS_PER_FRAME,
): AdvanceResult {
  let acc = accumulator + frameDt * speed;
  let bs = bodies;
  let steps = 0;
  while (acc >= simDt && steps < maxSteps) {
    bs = resolveCollisions(step(bs, simDt));
    acc -= simDt;
    steps++;
  }
  // Guard tripped: drop the un-integrated backlog so time debt can't
  // snowball across frames — the sim runs slower instead of freezing.
  if (acc >= simDt) acc = acc % simDt;
  return { bodies: bs, accumulator: acc, steps };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm vitest run tests/physics/advance.test.ts`
Expected: PASS (4 tests).

- [ ] **Step 5: Commit**

```bash
git add lib/physics/advance.ts tests/physics/advance.test.ts
git commit -m "feat(play/orbital): deterministic fixed-timestep accumulator helper"
```

---

### Task 2: Wire the accumulator into the canvas loop

**Files:**
- Modify: `components/playgrounds/orbital-mechanics/n-body-canvas.tsx`

**Interfaces:**
- Consumes: `advanceSimulation`, `SIM_DT` from `lib/physics/advance.ts` (Task 1).
- Produces: `accumulatorRef` and the per-frame `stepsThisFrame` local — Task 5's HUD reads both. `SIM_DT` no longer defined locally.

- [ ] **Step 1: Replace imports and the local constant**

In `n-body-canvas.tsx`, change the physics import (line 6) and delete the local `SIM_DT` (line 55):

```ts
// was: import { resolveCollisions, step, type Body } from "@/lib/physics/n-body";
import type { Body } from "@/lib/physics/n-body";
import { advanceSimulation } from "@/lib/physics/advance";
```

Delete the line `const SIM_DT = 0.005;` (keep `BODY_CAP`, `LAUNCH_BOOST`, `PREDICTION_SECONDS`).

- [ ] **Step 2: Add the accumulator ref and zero it on reset**

Next to the other refs (after `onBodiesChangeRef`, ~line 96):

```ts
const accumulatorRef = useRef(0);
```

In the hard-reset effect (`[resetKey]`, lines 133-140), add:

```ts
accumulatorRef.current = 0;
```

- [ ] **Step 3: Replace the physics block in `onFrame`**

Replace lines 334-351 (`// Step physics…` through the merge-report `if`) with:

```ts
// Step physics + resolve collisions (hybrid bounce/absorb) in fixed
// SIM_DT steps — identical trajectories on every machine by construction.
let stepsThisFrame = 0;
if (isPlaying && !reducedMotion) {
  const startLen = bodiesRef.current.length;
  const r = advanceSimulation(
    bodiesRef.current,
    accumulatorRef.current,
    dt,
    speed,
  );
  bodiesRef.current = r.bodies;
  accumulatorRef.current = r.accumulator;
  stepsThisFrame = r.steps;
  // If any bodies merged this frame, surface the new list to React so
  // URL state, the body counter, and trail pruning all stay in sync.
  if (r.bodies.length < startLen) {
    onBodiesChangeRef.current(r.bodies);
  }
}
```

(`stepsThisFrame` is unused until Task 5 — prefix with `void stepsThisFrame;` or add the HUD in Task 5 before lint complains; if `pnpm lint` flags it now, name it `_stepsThisFrame` temporarily and rename in Task 5.)

- [ ] **Step 4: Verify**

Run: `pnpm vitest run components/playgrounds/orbital-mechanics && pnpm lint`
Expected: existing co-located tests PASS; no new lint errors.

- [ ] **Step 5: Commit**

```bash
git add components/playgrounds/orbital-mechanics/n-body-canvas.tsx
git commit -m "fix(play/orbital): deterministic fixed-timestep loop (cross-platform divergence)"
```

---

### Task 3: Normalize wheel deltas

**Files:**
- Create: `components/playgrounds/orbital-mechanics/wheel.ts`
- Test: `components/playgrounds/orbital-mechanics/wheel.test.ts` (co-located, matches this module's existing test pattern — these DO run under the vitest glob)
- Modify: `components/playgrounds/orbital-mechanics/n-body-canvas.tsx` (`onWheel`, lines 179-188)

**Interfaces:**
- Produces: `normalizeWheelDelta(deltaY: number, deltaMode: number, viewportH: number): number` — pixel-equivalent delta clamped to ±120.

- [ ] **Step 1: Write the failing test**

```ts
// components/playgrounds/orbital-mechanics/wheel.test.ts
import { describe, expect, it } from "vitest";
import { normalizeWheelDelta } from "./wheel";

describe("normalizeWheelDelta", () => {
  it("passes pixel-mode (deltaMode 0) deltas through", () => {
    expect(normalizeWheelDelta(100, 0, 600)).toBe(100);
    expect(normalizeWheelDelta(-53, 0, 600)).toBe(-53);
  });

  it("converts Firefox line-mode (deltaMode 1) notches to pixels", () => {
    expect(normalizeWheelDelta(3, 1, 600)).toBe(48); // 3 lines × 16px
    expect(normalizeWheelDelta(-3, 1, 600)).toBe(-48);
  });

  it("converts page-mode (deltaMode 2) via viewport height, then clamps", () => {
    expect(normalizeWheelDelta(1, 2, 600)).toBe(120); // 600px clamped
  });

  it("clamps any single event to one notch (±120px)", () => {
    expect(normalizeWheelDelta(2000, 0, 600)).toBe(120); // momentum fling
    expect(normalizeWheelDelta(-2000, 0, 600)).toBe(-120);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm vitest run components/playgrounds/orbital-mechanics/wheel.test.ts`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement**

```ts
// components/playgrounds/orbital-mechanics/wheel.ts

/** Nominal CSS line height for WheelEvent.deltaMode === DOM_DELTA_LINE. */
const LINE_HEIGHT_PX = 16;
/** One physical mouse notch ≈ 120px; cap momentum flings to a single notch. */
const MAX_NOTCH_PX = 120;

/**
 * Convert a WheelEvent's deltaY to clamped pixel units. Firefox on Windows
 * reports line-mode deltas (deltaY ≈ ±3 per notch vs ±100px in Chrome),
 * which made zoom effectively dead there.
 */
export function normalizeWheelDelta(
  deltaY: number,
  deltaMode: number,
  viewportH: number,
): number {
  const px =
    deltaMode === 1 ? deltaY * LINE_HEIGHT_PX :
    deltaMode === 2 ? deltaY * viewportH :
    deltaY;
  return Math.max(-MAX_NOTCH_PX, Math.min(MAX_NOTCH_PX, px));
}
```

- [ ] **Step 4: Wire into `onWheel`**

In `n-body-canvas.tsx`, add `import { normalizeWheelDelta } from "./wheel";` and replace the `onWheel` body:

```ts
function onWheel(e: WheelEvent) {
  e.preventDefault();
  const r = el!.getBoundingClientRect();
  const vp = viewport();
  if (!vp) return;
  const px = normalizeWheelDelta(e.deltaY, e.deltaMode, vp.h);
  const factor = Math.exp(-px * 0.0015);
  zoomTowardScreenPoint(
    camRef.current, vp.w, vp.h,
    e.clientX - r.left, e.clientY - r.top, factor,
  );
}
```

- [ ] **Step 5: Run tests, commit**

Run: `pnpm vitest run components/playgrounds/orbital-mechanics` — PASS.

```bash
git add components/playgrounds/orbital-mechanics/wheel.ts components/playgrounds/orbital-mechanics/wheel.test.ts components/playgrounds/orbital-mechanics/n-body-canvas.tsx
git commit -m "fix(play/orbital): normalize wheel deltaMode (Firefox/Windows zoom)"
```

---

### Task 4: Cap devicePixelRatio at 2

**Files:**
- Modify: `components/playgrounds/orbital-mechanics/draw.ts:47`

- [ ] **Step 1: Apply the cap**

In `prepareCanvas`, replace `const dpr = window.devicePixelRatio || 1;` with:

```ts
// Cap at 2×: above that the extra resolution is invisible for this content
// but quadruples fill cost on exactly the fractional-scaled Windows 4K
// machines that are already struggling.
const dpr = Math.min(window.devicePixelRatio || 1, 2);
```

- [ ] **Step 2: Verify + commit**

Run: `pnpm vitest run components/playgrounds/orbital-mechanics` — PASS (no behavioral tests possible in jsdom; manual check in Task 13).

```bash
git add components/playgrounds/orbital-mechanics/draw.ts
git commit -m "fix(play/orbital): cap devicePixelRatio at 2 for canvas backing buffer"
```

---

### Task 5: Debug HUD behind `?debug=1`

**Files:**
- Modify: `components/playgrounds/orbital-mechanics/draw.ts` (add `drawDebugHud`)
- Modify: `components/playgrounds/orbital-mechanics/n-body-canvas.tsx`

**Interfaces:**
- Produces: `drawDebugHud(d: DrawContext, s: DebugStats)` where `DebugStats = { fps: number; dtMs: number; dpr: number; simRate: number; bodyCount: number; accumulator: number }`.

- [ ] **Step 1: Add `drawDebugHud` to `draw.ts`**

```ts
export interface DebugStats {
  fps: number;
  dtMs: number;
  dpr: number;
  /** Sim-seconds advanced per wall-second — should equal `speed` exactly. */
  simRate: number;
  bodyCount: number;
  accumulator: number;
}

export function drawDebugHud(d: DrawContext, s: DebugStats): void {
  const { ctx, colors } = d;
  const lines = [
    `fps ${s.fps.toFixed(0)}`,
    `dt ${s.dtMs.toFixed(1)}ms`,
    `dpr ${s.dpr.toFixed(2)}`,
    `sim ${s.simRate.toFixed(2)}x`,
    `bodies ${s.bodyCount}`,
    `acc ${(s.accumulator * 1000).toFixed(2)}ms`,
  ];
  ctx.save();
  ctx.font = "10px ui-monospace, SFMono-Regular, monospace";
  ctx.textBaseline = "top";
  ctx.fillStyle = colors.bg0 || "#1A1D24";
  ctx.globalAlpha = 0.7;
  ctx.fillRect(4, 4, 88, lines.length * 12 + 8);
  ctx.globalAlpha = 1;
  ctx.fillStyle = colors.fg2 || "#7D8DA6";
  lines.forEach((l, i) => ctx.fillText(l, 8, 8 + i * 12));
  ctx.restore();
}
```

- [ ] **Step 2: Track stats in `n-body-canvas.tsx`**

Add `drawDebugHud` to the `./draw` import list. Add refs next to `accumulatorRef`:

```ts
// ?debug=1 HUD. Read once on mount: usePlaygroundState's router.replace()
// rewrites the query string with only the ?s= blob, so live URL reads would
// lose the flag after the first state write.
const debugRef = useRef(false);
useEffect(() => {
  debugRef.current =
    new URLSearchParams(window.location.search).get("debug") === "1";
}, []);
const hudRef = useRef({ windowStart: 0, frames: 0, simSeconds: 0, fps: 0, simRate: 0 });
```

At the END of `onFrame` (after the hover-ghost block), add:

```ts
if (debugRef.current) {
  const hud = hudRef.current;
  hud.frames++;
  hud.simSeconds += stepsThisFrame * 0.005; // SIM_DT
  const w = _t - hud.windowStart;
  if (w >= 0.5) {
    hud.fps = hud.frames / w;
    hud.simRate = hud.simSeconds / w;
    hud.frames = 0;
    hud.simSeconds = 0;
    hud.windowStart = _t;
  }
  drawDebugHud(d, {
    fps: hud.fps,
    dtMs: dt * 1000,
    dpr: window.devicePixelRatio || 1, // raw, uncapped — that's the diagnostic
    simRate: hud.simRate,
    bodyCount: bodiesRef.current.length,
    accumulator: accumulatorRef.current,
  });
}
```

Import `SIM_DT` from `@/lib/physics/advance` and use it instead of the `0.005` literal. The frame callback signature is `(_t, dt)` — rename `_t` to `t` since it's now used.

- [ ] **Step 3: Verify + commit**

Run: `pnpm vitest run components/playgrounds/orbital-mechanics && pnpm lint` — PASS.
Manual: `pnpm dev`, open `/en/play/orbital-mechanics?debug=1` — HUD shows fps ≈ display refresh, sim ≈ 1.00x at 1× speed. (Full manual pass in Task 13.)

```bash
git add components/playgrounds/orbital-mechanics/draw.ts components/playgrounds/orbital-mechanics/n-body-canvas.tsx
git commit -m "feat(play/orbital): debug HUD behind ?debug=1"
```

---

### Task 6: Registry-driven playground loader (§6)

**Files:**
- Modify: `app/[locale]/play/[slug]/playground-loader.tsx` (replace whole file)

**Interfaces:**
- Consumes: `getPlayground(slug)` and `PlaygroundMeta.loader` from `app/[locale]/play/_components/playground-meta.ts` (already declared, currently dead code).

- [ ] **Step 1: Replace the hardcoded switch**

```tsx
// app/[locale]/play/[slug]/playground-loader.tsx
"use client";

import { useMemo } from "react";
import dynamic from "next/dynamic";
import { SceneSkeleton } from "@/components/layout/scene-skeleton";
import { getPlayground } from "../_components/playground-meta";

/**
 * Resolves the playground component from the registry (playground-meta.ts),
 * honoring the framework promise that adding a playground touches no
 * framework code. Loader closures use static import() calls, so per-
 * playground chunk splitting survives.
 */
export function PlaygroundLoader({ slug }: { slug: string }) {
  const meta = getPlayground(slug);
  const Component = useMemo(
    () =>
      meta
        ? dynamic(meta.loader, { ssr: false, loading: () => <SceneSkeleton /> })
        : null,
    // meta is a registry constant per slug.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [slug],
  );
  if (!Component) return null;
  return <Component />;
}
```

- [ ] **Step 2: Verify chunk split + page loads**

Run: `pnpm build`
Expected: build succeeds; `/[locale]/play/[slug]` page output unchanged in size class (orbital-mechanics stays in its own async chunk — check `.next/` output or just confirm First Load JS for the play route didn't absorb the playground bundle).

Then `pnpm dev` → `/en/play/orbital-mechanics` renders; `/en/play/nonexistent` handled as before (page-level 404 / null).

- [ ] **Step 3: Commit**

```bash
git add "app/[locale]/play/[slug]/playground-loader.tsx"
git commit -m "refactor(play): resolve playground component from registry loader"
```

---

### Task 7: Continuous log-scale speed slider (§5.1, §4.5)

**Files:**
- Create: `components/playgrounds/orbital-mechanics/log-slider.tsx`
- Test: `components/playgrounds/orbital-mechanics/schema.test.ts` (new)
- Modify: `components/playgrounds/orbital-mechanics/schema.ts` (speed)
- Modify: `components/playgrounds/orbital-mechanics/controls.tsx`
- Modify: `components/playgrounds/orbital-mechanics/n-body-canvas.tsx` (Props type)
- Modify: `messages/en/play.json`, `messages/he/play.json` (one aria key — Hebrew hand-written)

**Interfaces:**
- Produces: `LogSlider` component:
  ```tsx
  interface LogSliderProps {
    label: string;
    ariaLabel: string;
    value: number;
    min: number;   // > 0 (log scale)
    max: number;
    detents?: number[];        // snap targets
    format?: (v: number) => string;
    onChange: (v: number) => void;
    resetTo?: number;          // value chip becomes a tap-to-reset button
    resetAriaLabel?: string;
  }
  ```
  Task 8 reuses it for mass. `Controls` prop `onChangeSpeed` becomes `(s: number) => void`; `NBodyCanvas` prop `speed: number`.

- [ ] **Step 1: Write the failing schema tests**

```ts
// components/playgrounds/orbital-mechanics/schema.test.ts
import { describe, expect, it } from "vitest";
import { orbitalSchema } from "./schema";

describe("orbitalSchema migration", () => {
  it("accepts old discrete speed values (0.25 / 1 / 4)", () => {
    for (const speed of [0.25, 1, 4]) {
      const r = orbitalSchema.safeParse({ speed });
      expect(r.success).toBe(true);
      if (r.success) expect(r.data.speed).toBe(speed);
    }
  });

  it("accepts the new continuous range 0.1–10", () => {
    for (const speed of [0.1, 0.33, 7.5, 10]) {
      expect(orbitalSchema.safeParse({ speed }).success).toBe(true);
    }
  });

  it("rejects out-of-range speed (whole blob falls back to defaults upstream)", () => {
    expect(orbitalSchema.safeParse({ speed: 50 }).success).toBe(false);
    expect(orbitalSchema.safeParse({ speed: 0 }).success).toBe(false);
  });

  it("defaults speed to 1", () => {
    expect(orbitalSchema.parse({}).speed).toBe(1);
  });
});
```

- [ ] **Step 2: Run to verify failure**

Run: `pnpm vitest run components/playgrounds/orbital-mechanics/schema.test.ts`
Expected: FAIL — `{ speed: 0.33 }` rejected by the current literal union.

- [ ] **Step 3: Update the schema**

In `schema.ts:21`, replace the speed line:

```ts
speed: z.number().min(0.1).max(10).default(1),
```

Run the schema test — PASS.

- [ ] **Step 4: Create `LogSlider`**

```tsx
// components/playgrounds/orbital-mechanics/log-slider.tsx
"use client";
import { useId } from "react";

interface LogSliderProps {
  label: string;
  ariaLabel: string;
  value: number;
  min: number;
  max: number;
  detents?: number[];
  format?: (v: number) => string;
  onChange: (v: number) => void;
  /** When set, the value chip is a tap-to-reset button (e.g. back to 1×). */
  resetTo?: number;
  resetAriaLabel?: string;
}

const STEPS = 1000;
/** Snap radius in slider steps (1.2% of track) around each detent. */
const SNAP_STEPS = 12;

/**
 * Log-scale range input with detent snapping. Log scale makes 0.25→0.5 as
 * much travel as 2→4, which is how speed/mass perception actually works.
 */
export function LogSlider({
  label,
  ariaLabel,
  value,
  min,
  max,
  detents = [],
  format = String,
  onChange,
  resetTo,
  resetAriaLabel,
}: LogSliderProps) {
  const id = useId();
  const lmin = Math.log10(min);
  const lmax = Math.log10(max);
  const toSlider = (v: number) =>
    Math.round(((Math.log10(v) - lmin) / (lmax - lmin)) * STEPS);
  const fromSlider = (s: number) => 10 ** (lmin + (s / STEPS) * (lmax - lmin));

  function handleChange(raw: number) {
    for (const d of detents) {
      if (Math.abs(toSlider(d) - raw) <= SNAP_STEPS) {
        onChange(d);
        return;
      }
    }
    // Two decimals is plenty of resolution and keeps the URL blob short.
    onChange(Math.round(fromSlider(raw) * 100) / 100);
  }

  const display = format(value);
  const clamped = Math.min(Math.max(value, min), max);
  return (
    <div className="flex items-center gap-1.5">
      <label htmlFor={id} className="opacity-60">
        {label}
      </label>
      <input
        id={id}
        type="range"
        min={0}
        max={STEPS}
        step={1}
        value={toSlider(clamped)}
        onChange={(e) => handleChange(Number(e.target.value))}
        aria-label={ariaLabel}
        aria-valuetext={display}
        className="w-20 accent-[var(--color-cyan)] md:w-24"
      />
      {resetTo !== undefined ? (
        <button
          type="button"
          onClick={() => onChange(resetTo)}
          aria-label={resetAriaLabel}
          className="min-w-9 text-start tabular-nums text-[var(--color-cyan-dim)] hover:text-[var(--color-cyan)]"
        >
          {display}
        </button>
      ) : (
        <span className="min-w-9 tabular-nums opacity-80">{display}</span>
      )}
    </div>
  );
}
```

- [ ] **Step 5: Replace the speed buttons in `controls.tsx`**

Change the Props type: `onChangeSpeed: (s: number) => void;`. Add `import { LogSlider } from "./log-slider";`. Replace the speed `<div>` (lines 74-85) with:

```tsx
<div className="flex items-center gap-1 border-l border-[var(--color-fg-4)]/40 pl-2">
  <LogSlider
    label={t("speed")}
    ariaLabel={t("speed")}
    value={state.speed}
    min={0.1}
    max={10}
    detents={[0.25, 0.5, 1, 2, 4]}
    format={(v) => `${v}×`}
    onChange={onChangeSpeed}
    resetTo={1}
    resetAriaLabel={t("speedReset")}
  />
</div>
```

- [ ] **Step 6: Widen the canvas prop**

In `n-body-canvas.tsx` Props: `speed: 0.25 | 1 | 4;` → `speed: number;` (`advanceSimulation` already takes a number).

- [ ] **Step 7: Add the aria key to both locales**

`messages/en/play.json` under `controls`:

```json
"speedReset": "Reset speed to 1×"
```

`messages/he/play.json` under `controls`:

```json
"speedReset": "אפס מהירות ל־1×"
```

- [ ] **Step 8: Verify + commit**

Run: `pnpm vitest run components/playgrounds/orbital-mechanics && pnpm lint` — PASS.
Manual: slider drags smoothly 0.1×–10×, snaps at detents, label shows live value, tapping the value resets to 1×; a URL carrying `speed:4` opens with the thumb visibly at 4×.

```bash
git add components/playgrounds/orbital-mechanics/log-slider.tsx components/playgrounds/orbital-mechanics/schema.ts components/playgrounds/orbital-mechanics/schema.test.ts components/playgrounds/orbital-mechanics/controls.tsx components/playgrounds/orbital-mechanics/n-body-canvas.tsx messages/en/play.json messages/he/play.json
git commit -m "feat(play/orbital): continuous log-scale speed slider with 1x reset"
```

---

### Task 8: Place-mass slider (§5.2)

**Files:**
- Modify: `components/playgrounds/orbital-mechanics/schema.ts` (placeMass; remove `placeMassSchema`/`PlaceMass`)
- Modify: `components/playgrounds/orbital-mechanics/schema.test.ts`
- Modify: `components/playgrounds/orbital-mechanics/controls.tsx`
- Modify: `components/playgrounds/orbital-mechanics/index.tsx` (drop `PlaceMass` import)

- [ ] **Step 1: Extend the schema tests**

Append to `schema.test.ts`:

```ts
describe("placeMass migration", () => {
  it("accepts old discrete values (0.5 / 1 / 5 / 20)", () => {
    for (const placeMass of [0.5, 1, 5, 20]) {
      const r = orbitalSchema.safeParse({ placeMass });
      expect(r.success).toBe(true);
      if (r.success) expect(r.data.placeMass).toBe(placeMass);
    }
  });

  it("accepts the new continuous range 0.1–50 and rejects outside it", () => {
    expect(orbitalSchema.safeParse({ placeMass: 37.5 }).success).toBe(true);
    expect(orbitalSchema.safeParse({ placeMass: 100 }).success).toBe(false);
    expect(orbitalSchema.safeParse({ placeMass: 0 }).success).toBe(false);
  });
});
```

Run: FAIL (37.5 rejected by the literal union).

- [ ] **Step 2: Update the schema**

In `schema.ts`, delete `placeMassSchema` and the `PlaceMass` type (lines 13-14) and change the field:

```ts
placeMass: z.number().min(0.1).max(50).default(1),
```

Fix importers: in `controls.tsx` remove `import type { PlaceMass } from "./schema";` and the `MASS_OPTIONS` array; change `onChangePlaceMass: (m: number) => void;`. In `index.tsx` drop `PlaceMass` from the schema import and change the handler to `onChangePlaceMass={(m: number) => setState({ ...state, placeMass: m })}`.

- [ ] **Step 3: Replace the mass buttons with the slider**

In `controls.tsx`, replace the mass `<div>` (lines 61-72) with:

```tsx
<div className="flex items-center gap-1 border-l border-[var(--color-fg-4)]/40 pl-2">
  <LogSlider
    label={t("mass")}
    ariaLabel={t("mass")}
    value={state.placeMass}
    min={0.1}
    max={50}
    detents={[0.5, 1, 5, 20]}
    onChange={onChangePlaceMass}
  />
</div>
```

(Body radius already derives from mass via `bodyRadius()` — `lib/physics/n-body.ts:26-28` — so the hover ghost / slingshot previews pick the size up automatically; no draw changes.)

- [ ] **Step 4: Verify + commit**

Run: `pnpm vitest run components/playgrounds/orbital-mechanics && pnpm lint` — PASS.
Manual: mass slider 0.1–50 snaps at 0.5/1/5/20; hover ghost radius follows the slider.

```bash
git add components/playgrounds/orbital-mechanics/schema.ts components/playgrounds/orbital-mechanics/schema.test.ts components/playgrounds/orbital-mechanics/controls.tsx components/playgrounds/orbital-mechanics/index.tsx
git commit -m "feat(play/orbital): continuous log-scale place-mass slider"
```

---

### Task 9: Raise body cap 8 → 16 (§5.3)

**Files:**
- Modify: `components/playgrounds/orbital-mechanics/n-body-canvas.tsx:56`

- [ ] **Step 1: Change the constant**

```ts
const BODY_CAP = 16;
```

FIFO eviction + trail pruning already key off `BODY_CAP` in both placement paths (`onTap`, `onPlaceUp`) — no other change. O(n²) at n=16 with 200 worst-case substeps is < 1 ms.

- [ ] **Step 2: Verify + commit**

Run: `pnpm vitest run components/playgrounds/orbital-mechanics` — PASS.

```bash
git add components/playgrounds/orbital-mechanics/n-body-canvas.tsx
git commit -m "feat(play/orbital): raise body cap to 16"
```

---

### Task 10: Desktop mouse pan — middle-drag and Space+left-drag (§5.4)

**Files:**
- Modify: `components/playgrounds/orbital-mechanics/n-body-canvas.tsx` (the mount-once desktop-affordances effect, lines 163-210)

**Design:** A **capture-phase** `pointerdown` listener on the container intercepts middle-button (`button === 1`) and Space+left drags before the bubble-phase gesture listeners (`attachGestures` attaches non-capture on the same element; events target the inner `<canvas>`, so capture on the container fires first and `stopPropagation()` starves the gesture system — no slingshot, no tap-place). Pan movement uses the same math as `onPan`: `cam.panX -= dx / cam.scale`.

- [ ] **Step 1: Add pan + Space handling inside the desktop effect**

Inside the existing mount-once effect (before `el.addEventListener(...)` calls), add:

```ts
// ── Desktop pan: middle-button drag, or hold Space + left-drag ──
let spaceHeld = false;
let panning = false;
let lastX = 0;
let lastY = 0;

function onKeyDown(e: KeyboardEvent) {
  if (e.code !== "Space" || e.repeat) return;
  const t = e.target as HTMLElement | null;
  // Don't hijack Space from form controls (play button, preset select…).
  if (t && /^(INPUT|SELECT|TEXTAREA|BUTTON)$/.test(t.tagName)) return;
  spaceHeld = true;
  el!.style.cursor = "grab";
  e.preventDefault(); // stop page scroll
}
function onKeyUp(e: KeyboardEvent) {
  if (e.code !== "Space") return;
  spaceHeld = false;
  if (!panning) el!.style.cursor = "";
}

function onPanMove(e: PointerEvent) {
  const cam = camRef.current;
  cam.panX -= (e.clientX - lastX) / cam.scale;
  cam.panY -= (e.clientY - lastY) / cam.scale;
  lastX = e.clientX;
  lastY = e.clientY;
}
function onPanEnd() {
  panning = false;
  el!.style.cursor = spaceHeld ? "grab" : "";
  window.removeEventListener("pointermove", onPanMove);
  window.removeEventListener("pointerup", onPanEnd);
}
// Capture phase: runs before attachGestures' bubble listeners, so
// stopPropagation() keeps pan drags out of the slingshot/tap machinery.
function onPointerDownCapture(e: PointerEvent) {
  const isPan = e.button === 1 || (e.button === 0 && spaceHeld);
  if (!isPan) return;
  e.preventDefault();
  e.stopPropagation();
  panning = true;
  lastX = e.clientX;
  lastY = e.clientY;
  el!.style.cursor = "grabbing";
  window.addEventListener("pointermove", onPanMove);
  window.addEventListener("pointerup", onPanEnd);
}
// Windows middle-click autoscroll fires on mousedown — suppress it too.
function onMouseDown(e: MouseEvent) {
  if (e.button === 1) e.preventDefault();
}
```

Register/unregister alongside the existing listeners:

```ts
el.addEventListener("pointerdown", onPointerDownCapture, { capture: true });
el.addEventListener("mousedown", onMouseDown);
window.addEventListener("keydown", onKeyDown);
window.addEventListener("keyup", onKeyUp);
```

and in the cleanup:

```ts
el.removeEventListener("pointerdown", onPointerDownCapture, { capture: true });
el.removeEventListener("mousedown", onMouseDown);
window.removeEventListener("keydown", onKeyDown);
window.removeEventListener("keyup", onKeyUp);
window.removeEventListener("pointermove", onPanMove);
window.removeEventListener("pointerup", onPanEnd);
```

- [ ] **Step 2: Verify + commit**

Run: `pnpm vitest run components/playgrounds/orbital-mechanics && pnpm lint` — PASS.
Manual: middle-drag pans; hold Space → `grab` cursor, left-drag pans with `grabbing` cursor; releasing Space restores normal placement; left-drag without Space still slingshots; Space while the preset `<select>` is focused doesn't pan.

```bash
git add components/playgrounds/orbital-mechanics/n-body-canvas.tsx
git commit -m "feat(play/orbital): desktop pan via middle-drag and space+drag"
```

---

### Task 11: Preset metadata infrastructure — `PresetDef`, camera scale, labels & colors (§5.5 plumbing)

**Files:**
- Modify: `components/playgrounds/orbital-mechanics/presets.ts` (shape change, no new presets yet)
- Modify: `components/playgrounds/orbital-mechanics/draw.ts` (color override + `drawLabels`)
- Modify: `components/playgrounds/orbital-mechanics/n-body-canvas.tsx` (`initialScale`, `bodyMeta` props)
- Modify: `components/playgrounds/orbital-mechanics/index.tsx` (derive + pass both)

**Interfaces:**
- Produces (presets.ts):
  ```ts
  export interface BodyMeta { labelKey: string; color?: string }
  export interface PresetDef {
    bodies: Body[];
    camera?: { scale: number };
    bodyMeta?: Record<string, BodyMeta>;
  }
  export const PRESETS: Record<PresetId, PresetDef>;
  export function getPreset(id: PresetId): Body[];        // unchanged signature
  export function getPresetDef(id: PresetId): PresetDef;  // new
  export const BODY_META: Record<string, BodyMeta>;       // id → meta, merged across presets
  ```
- Produces (draw.ts): `DrawContext.bodyMeta?: Record<string, { label?: string; color?: string }>`; `drawLabels(d: DrawContext, bodies: Body[]): void`.
- Produces (n-body-canvas): props `initialScale?: number`, `bodyMeta?: Record<string, { label?: string; color?: string }>`.

- [ ] **Step 1: Reshape `presets.ts`**

Add the interfaces above, wrap existing presets:

```ts
export const PRESETS: Record<PresetId, PresetDef> = {
  "figure-8": { bodies: FIGURE_8 },
  "solar-mini": { bodies: SOLAR_MINI },
  "pythagorean": { bodies: PYTHAGOREAN },
  "random-cluster": { bodies: makeRandomCluster() },
};

export function getPreset(id: PresetId): Body[] {
  return PRESETS[id].bodies.map((b) => ({ ...b }));
}

export function getPresetDef(id: PresetId): PresetDef {
  return PRESETS[id];
}

/**
 * id → display meta across every preset. Body ids are stable and mean the
 * same thing wherever they appear ("sun" is the sun in every preset), so a
 * flat merge is safe — and labels survive promotion to "custom".
 */
export const BODY_META: Record<string, BodyMeta> = Object.assign(
  {},
  ...Object.values(PRESETS).map((p) => p.bodyMeta ?? {}),
);
```

(`presets.test.ts` keeps passing: it only checks `PRESETS[id]` is defined and uses `getPreset`.)

- [ ] **Step 2: Color override + labels in `draw.ts`**

Add to `DrawContext`:

```ts
/** Per-body-id display overrides (real-life presets): label text + color. */
bodyMeta?: Record<string, { label?: string; color?: string }>;
```

Add a resolution helper and use it in `drawTrails` (line 81), `drawBodies` (line 106), and `drawDragArrow` (line 189) in place of the inline `palette[colorIndexForId(...)] ?? colors.cyan` expressions:

```ts
function bodyColor(d: DrawContext, id: string): string {
  return (
    d.bodyMeta?.[id]?.color ??
    d.palette[colorIndexForId(id, d.palette.length)] ??
    d.colors.cyan
  );
}
```

Add the label pass:

```ts
/** Small name tags next to bodies that carry preset metadata (sun, earth…). */
export function drawLabels(d: DrawContext, bodies: Body[]): void {
  const meta = d.bodyMeta;
  if (!meta) return;
  const { ctx, width, height, cam } = d;
  ctx.save();
  ctx.font = "10px ui-monospace, SFMono-Regular, monospace";
  ctx.textBaseline = "bottom";
  ctx.fillStyle = d.colors.fg2 || "#7D8DA6";
  ctx.globalAlpha = 0.85;
  for (const b of bodies) {
    const label = meta[b.id]?.label;
    if (!label) continue;
    const p = worldToScreen(cam, width, height, b.x, b.y);
    const r = visibleRadiusPx(b.mass, cam.scale);
    ctx.fillText(label, p.x + r + 4, p.y - r - 2);
  }
  ctx.restore();
}
```

- [ ] **Step 3: Thread props through `n-body-canvas.tsx`**

Add to `Props`:

```ts
/** Initial px-per-world-unit; applied on mount and every resetKey bump. */
initialScale?: number;
/** Per-body-id label/color overrides, already translated by the parent. */
bodyMeta?: Record<string, { label?: string; color?: string }>;
```

In the hard-reset effect (`[resetKey]`), after `camRef.current = defaultCamera();`:

```ts
if (initialScale) camRef.current.scale = clampScale(initialScale);
```

(The effect closure re-forms every render, so it sees the current prop when `resetKey` changes; the existing eslint-disable already covers the dep.)

In `onFrame`, add `bodyMeta` to the draw context object:

```ts
const d = { ctx, width, height, cam: camRef.current, colors, palette, bodyMeta };
```

and call `drawLabels(d, bodiesRef.current);` immediately after `drawBodies(d, bodiesRef.current);`. Add `drawLabels` to the `./draw` import.

- [ ] **Step 4: Derive + pass from `index.tsx`**

```ts
import { getPreset, getPresetDef, BODY_META, type PresetId } from "./presets";
```

Inside the component:

```ts
const tBodies = useTranslations("play.orbital-mechanics.bodies");
// Translate label keys once; ids are globally unique so this works for
// "custom" states too (a nudged Earth is still Earth).
const bodyMeta = useMemo(() => {
  const out: Record<string, { label: string; color?: string }> = {};
  for (const [id, m] of Object.entries(BODY_META)) {
    out[id] = { label: tBodies(m.labelKey), color: m.color };
  }
  return out;
}, [tBodies]);

const initialScale =
  state.preset !== "custom"
    ? getPresetDef(state.preset as PresetId).camera?.scale
    : undefined;
```

Pass `bodyMeta={bodyMeta}` and `initialScale={initialScale}` to `<NBodyCanvas />`.

**Note:** until Task 12 adds `bodies.*` keys, `BODY_META` is empty (`{}`) so `tBodies` is never called with a missing key — safe to land independently.

- [ ] **Step 5: Verify + commit**

Run: `pnpm vitest run components/playgrounds/orbital-mechanics && pnpm lint` — PASS (behavior identical for the four abstract presets).

```bash
git add components/playgrounds/orbital-mechanics/presets.ts components/playgrounds/orbital-mechanics/draw.ts components/playgrounds/orbital-mechanics/n-body-canvas.tsx components/playgrounds/orbital-mechanics/index.tsx
git commit -m "feat(play/orbital): preset metadata plumbing (camera scale, labels, colors)"
```

---

### Task 12: Four real-life presets + stability tests + i18n (§5.5, §7)

**Files:**
- Modify: `components/playgrounds/orbital-mechanics/presets.ts` (new presets)
- Modify: `components/playgrounds/orbital-mechanics/schema.ts` (preset enum)
- Modify: `components/playgrounds/orbital-mechanics/presets.test.ts` (stability tests)
- Modify: `lib/physics/n-body.ts` (export `DEFAULT_SOFTENING` — one keyword)
- Modify: `messages/en/play.json`, `messages/he/play.json`

- [ ] **Step 1: Write the failing stability tests**

Append to `presets.test.ts`:

```ts
import { resolveCollisions, step } from "@/lib/physics/n-body"; // extend existing import

const REAL_PRESETS = [
  "sun-earth-moon",
  "inner-solar-system",
  "earth-moon",
  "binary-star",
] as const;

describe("real-life presets", () => {
  for (const id of REAL_PRESETS) {
    it(`${id}: no ejection, no merge over 60 sim-seconds`, () => {
      let bs = getPreset(id);
      const n = bs.length;
      for (let s = 0; s < 12000; s++) {
        bs = resolveCollisions(step(bs, 0.005));
        if (s % 200 === 0) {
          for (const b of bs) {
            expect(Math.hypot(b.x, b.y), `${b.id} at step ${s}`).toBeLessThan(15);
          }
        }
      }
      expect(bs).toHaveLength(n); // no absorb/merge happened
    });
  }

  it("sun-earth-moon: the moon stays bound to the earth", () => {
    let bs = getPreset("sun-earth-moon");
    for (let s = 0; s < 12000; s++) {
      bs = resolveCollisions(step(bs, 0.005));
      if (s % 200 === 0) {
        const earth = bs.find((b) => b.id === "earth")!;
        const moon = bs.find((b) => b.id === "moon")!;
        expect(Math.hypot(moon.x - earth.x, moon.y - earth.y)).toBeLessThan(1);
      }
    }
  });

  it("real presets have (near-)zero net momentum", () => {
    for (const id of REAL_PRESETS) {
      const p = totalMomentum(getPreset(id));
      expect(Math.hypot(p.px, p.py)).toBeLessThan(1e-9);
    }
  });
});
```

Run: `pnpm vitest run components/playgrounds/orbital-mechanics/presets.test.ts` — FAIL (unknown preset ids).

- [ ] **Step 2: Export the softening constant**

In `lib/physics/n-body.ts:16`: `const DEFAULT_SOFTENING = 0.05;` → `export const DEFAULT_SOFTENING = 0.05;` (solver API untouched).

- [ ] **Step 3: Add the presets**

In `presets.ts`, extend the id type and list:

```ts
export type PresetId =
  | "figure-8"
  | "solar-mini"
  | "pythagorean"
  | "random-cluster"
  | "sun-earth-moon"
  | "inner-solar-system"
  | "earth-moon"
  | "binary-star";

export const PRESET_IDS: PresetId[] = [
  "figure-8",
  "solar-mini",
  "pythagorean",
  "random-cluster",
  "sun-earth-moon",
  "inner-solar-system",
  "earth-moon",
  "binary-star",
];
```

Add `import { DEFAULT_SOFTENING } from "@/lib/physics/n-body";` (extend the existing type-only import) and the builders:

```ts
// ── Real-life presets ────────────────────────────────────────────────────
// The sim is dimensionless (G = 1). True solar ratios are unusable directly:
// Sun:Earth = 333,000:1 renders planets sub-pixel (radius ∝ √mass) and the
// Moon at 1/389 of Earth's solar distance is invisible. Each preset instead
// compresses masses and radii to order-unity display values, then computes
// EXACT circular-orbit velocities from the chosen masses/radii under the
// sim's softened gravity — every preset is a genuinely stable orbit by
// construction, not a lookup of real numbers.

const EPS2 = DEFAULT_SOFTENING * DEFAULT_SOFTENING;

/** Circular-orbit speed about central mass M at radius r (G = 1, softened). */
function vCirc(M: number, r: number): number {
  return Math.sqrt((M * r * r) / Math.pow(r * r + EPS2, 1.5));
}

/** Remove net momentum so the system doesn't drift off-screen. */
function zeroMomentum(bodies: Body[]): Body[] {
  const M = bodies.reduce((s, b) => s + b.mass, 0);
  let px = 0;
  let py = 0;
  for (const b of bodies) {
    px += b.mass * b.vx;
    py += b.mass * b.vy;
  }
  return bodies.map((b) => ({ ...b, vx: b.vx - px / M, vy: b.vy - py / M }));
}

/** Two bodies in mutual circular orbit about their barycenter, separation d. */
function twoBodyCircular(
  idA: string,
  mA: number,
  idB: string,
  mB: number,
  d: number,
): Body[] {
  const omega = Math.sqrt((mA + mB) / Math.pow(d * d + EPS2, 1.5));
  const rA = (d * mB) / (mA + mB);
  const rB = (d * mA) / (mA + mB);
  return [
    { id: idA, mass: mA, x: -rA, y: 0, vx: 0, vy: -omega * rA },
    { id: idB, mass: mB, x: rB, y: 0, vx: 0, vy: omega * rB },
  ];
}

// Compression: Sun 100 / Earth 1 / Moon 0.05 (real 333k / 1 / 0.0123).
// Earth at r=4 (Earth "year" ≈ 5 s at 1×); Moon 0.3 from Earth — inside the
// Hill radius 4·(1/300)^⅓ ≈ 0.6, and Earth:Moon = 20 < ABSORB_MASS_RATIO so
// a grazing contact bounces instead of deleting the Moon.
const SUN_EARTH_MOON: Body[] = zeroMomentum(
  (() => {
    const rE = 4;
    const rM = 0.3;
    const vE = vCirc(100, rE);
    return [
      { id: "sun", mass: 100, x: 0, y: 0, vx: 0, vy: 0 },
      { id: "earth", mass: 1, x: rE, y: 0, vx: 0, vy: vE },
      { id: "moon", mass: 0.05, x: rE + rM, y: 0, vx: 0, vy: vE + vCirc(1, rM) },
    ];
  })(),
);

// Compression: radii 1.6 / 2.6 / 3.6 / 4.8 (real 0.39 / 0.72 / 1 / 1.52 AU —
// ordering and rough spacing kept); Mercury/Venus/Mars masses bumped to stay
// visible. Kepler III at a glance: periods ≈ 1.3 / 2.6 / 4.3 / 6.6 s.
const INNER_SOLAR_SYSTEM: Body[] = zeroMomentum(
  (() => {
    const planets: Array<[string, number, number, number]> = [
      // [id, mass, orbit radius, start angle]
      ["mercury", 0.2, 1.6, 0],
      ["venus", 0.8, 2.6, Math.PI / 2],
      ["earth", 1, 3.6, Math.PI],
      ["mars", 0.4, 4.8, -Math.PI / 2],
    ];
    return [
      { id: "sun", mass: 100, x: 0, y: 0, vx: 0, vy: 0 } as Body,
      ...planets.map(([id, mass, r, th]): Body => {
        const v = vCirc(100, r);
        return {
          id,
          mass,
          x: r * Math.cos(th),
          y: r * Math.sin(th),
          vx: -v * Math.sin(th),
          vy: v * Math.cos(th),
        };
      }),
    ];
  })(),
);

// Compression: 50:1 mass ratio (real 81:1), separation 4, period ≈ 7 s.
// Both orbit the barycenter — watch the heavy body's wobble.
const EARTH_MOON: Body[] = twoBodyCircular("earth", 50, "moon", 1, 4);

// Two equal stars (separation 2.5) + circumbinary planet at r=6 — beyond the
// ≈2.3× separation stability bound for equal-mass binaries ("Tatooine").
// Binary period ≈ 2.8 s, planet ≈ 10 s.
const BINARY_STAR: Body[] = zeroMomentum(
  (() => {
    const stars = twoBodyCircular("star-a", 40, "star-b", 40, 2.5);
    const rP = 6;
    const vP = vCirc(80, rP); // from out here the binary acts as one mass-80 point
    return [...stars, { id: "planet", mass: 0.5, x: 0, y: rP, vx: -vP, vy: 0 }];
  })(),
);
```

Extend `PRESETS`:

```ts
"sun-earth-moon": {
  bodies: SUN_EARTH_MOON,
  camera: { scale: 60 },
  bodyMeta: {
    sun: { labelKey: "sun", color: "#FFC857" },
    earth: { labelKey: "earth", color: "#5B8DEF" },
    moon: { labelKey: "moon", color: "#B8C0CC" },
  },
},
"inner-solar-system": {
  bodies: INNER_SOLAR_SYSTEM,
  camera: { scale: 50 },
  bodyMeta: {
    sun: { labelKey: "sun", color: "#FFC857" },
    mercury: { labelKey: "mercury", color: "#B0A08F" },
    venus: { labelKey: "venus", color: "#E4C590" },
    earth: { labelKey: "earth", color: "#5B8DEF" },
    mars: { labelKey: "mars", color: "#E2603F" },
  },
},
"earth-moon": {
  bodies: EARTH_MOON,
  camera: { scale: 70 },
  bodyMeta: {
    earth: { labelKey: "earth", color: "#5B8DEF" },
    moon: { labelKey: "moon", color: "#B8C0CC" },
  },
},
"binary-star": {
  bodies: BINARY_STAR,
  camera: { scale: 45 },
  bodyMeta: {
    "star-a": { labelKey: "star-a", color: "#FFC857" },
    "star-b": { labelKey: "star-b", color: "#FF9F5A" },
    planet: { labelKey: "planet" },
  },
},
```

- [ ] **Step 4: Extend the schema enum**

In `schema.ts:17`:

```ts
preset: z.enum([
  "figure-8", "solar-mini", "pythagorean", "random-cluster",
  "sun-earth-moon", "inner-solar-system", "earth-moon", "binary-star",
  "custom",
]).default("figure-8"),
```

- [ ] **Step 5: Run the stability tests**

Run: `pnpm vitest run components/playgrounds/orbital-mechanics/presets.test.ts`
Expected: PASS. **If a preset ejects or merges, tune that preset's radii/masses (not the test)** — e.g. widen the moon's orbit or the binary–planet gap — and note the tuning in the preset's comment.

- [ ] **Step 6: i18n — English keys**

In `messages/en/play.json` under `orbital-mechanics`: append the four new ids to `presets`, append four entries to `presetsInfo` (keep the existing four entries in both untouched), and add a new `bodies` object.

New `presets` entries:

```json
"sun-earth-moon": "Sun · Earth · Moon",
"inner-solar-system": "Inner solar system",
"earth-moon": "Earth & Moon",
"binary-star": "Binary star"
```

New `presetsInfo` entries:

```json
"sun-earth-moon": "A hierarchy of orbits: the Moon circles the Earth while both circle the Sun. Watch the Moon's path — it orbits the Sun too, with a gentle wobble. Masses are compressed for visibility; velocities are computed for genuinely circular orbits.",
"inner-solar-system": "The Sun with Mercury, Venus, Earth and Mars. Kepler's third law at a glance: the farther the planet, the slower its orbit — Mars takes about five times longer than Mercury.",
"earth-moon": "Two bodies orbiting their common center of mass — the barycenter. The heavy body wobbles too; that same wobble is how we detect exoplanets around distant stars.",
"binary-star": "Two equal stars orbit each other while a planet circles them both — a circumbinary 'Tatooine' orbit, stable only because the planet keeps its distance."
```

New `bodies` object (sibling of `presets`):

```json
"bodies": {
  "sun": "Sun",
  "mercury": "Mercury",
  "venus": "Venus",
  "earth": "Earth",
  "moon": "Moon",
  "mars": "Mars",
  "star-a": "Star A",
  "star-b": "Star B",
  "planet": "Planet"
}
```

- [ ] **Step 7: i18n — Hebrew keys (hand-written, no machine translation)**

Same structure in `messages/he/play.json` under `orbital-mechanics` (existing entries untouched).

New `presets` entries:

```json
"sun-earth-moon": "שמש · ארץ · ירח",
"inner-solar-system": "מערכת השמש הפנימית",
"earth-moon": "כדור הארץ והירח",
"binary-star": "כוכב כפול"
```

New `presetsInfo` entries:

```json
"sun-earth-moon": "היררכיה של מסלולים: הירח מקיף את כדור הארץ בעוד שניהם מקיפים את השמש. עקבו אחרי מסלול הירח — גם הוא מקיף את השמש, עם נדנוד עדין. המסות דחוסות לצורך תצוגה; המהירויות חושבו כך שהמסלולים מעגליים באמת.",
"inner-solar-system": "השמש עם כוכב חמה, נוגה, כדור הארץ ומאדים. החוק השלישי של קפלר במבט אחד: ככל שכוכב הלכת רחוק יותר, הקפתו איטית יותר — למאדים לוקח בערך פי חמישה יותר זמן מאשר לכוכב חמה.",
"earth-moon": "שני גופים המקיפים את מרכז המסה המשותף שלהם — הבָּריצנטר. גם הגוף הכבד מתנדנד; בדיוק בעזרת הנדנוד הזה מגלים כוכבי לכת סביב כוכבים רחוקים.",
"binary-star": "שני כוכבים שווים מקיפים זה את זה, וכוכב לכת מקיף את שניהם — מסלול 'טאטואין' סביב־כפול, שיציב רק מפני שכוכב הלכת שומר מרחק."
```

New `bodies` object:

```json
"bodies": {
  "sun": "שמש",
  "mercury": "כוכב חמה",
  "venus": "נוגה",
  "earth": "ארץ",
  "moon": "ירח",
  "mars": "מאדים",
  "star-a": "כוכב א׳",
  "star-b": "כוכב ב׳",
  "planet": "כוכב לכת"
}
```

(The `<select>` in `controls.tsx` and the InfoPanel scenario list both iterate `PRESET_IDS`, so they pick the new presets up with zero code changes.)

- [ ] **Step 8: Full verify + commit**

Run: `pnpm test && pnpm lint` — PASS.
Manual: each new preset loads framed correctly (camera scale), labeled and colored; editing a body promotes to `custom` and keeps labels; periods feel like seconds-to-tens-of-seconds at 1×.

```bash
git add components/playgrounds/orbital-mechanics/presets.ts components/playgrounds/orbital-mechanics/presets.test.ts components/playgrounds/orbital-mechanics/schema.ts lib/physics/n-body.ts messages/en/play.json messages/he/play.json
git commit -m "feat(play/orbital): four real-life presets with labels, colors, camera framing"
```

---

### Task 13: Final verification

- [ ] **Step 1: Full automated pass**

Run: `pnpm test` → all suites PASS (including the new `tests/physics/advance.test.ts`, `wheel.test.ts`, `schema.test.ts`, extended `presets.test.ts`).
Run: `pnpm lint` → clean.
Run: `pnpm build` → succeeds; orbital-mechanics remains its own async chunk.

- [ ] **Step 2: End-to-end manual pass (Mac, this machine)**

`pnpm dev` → `/en/play/orbital-mechanics?debug=1`:
- HUD: `sim` equals the speed slider value exactly (drag 0.1×–10×); fps ≈ refresh rate; acc oscillates below 5 ms.
- Determinism smoke: load `figure-8`, let it run 30 s — the ∞ track stays closed (the old variable-substep code slowly deformed it).
- Wheel zoom, pinch (trackpad), middle-drag pan, Space+drag pan, slingshot placement, right-click remove, 17th body evicts the oldest.
- Each real preset: stable orbits, labels, colors, framing; `/he/play/orbital-mechanics` shows Hebrew preset names/labels (RTL).
- Share a URL at 4× speed → opens with slider thumb at 4× and a visible tap-to-reset value chip (§4.5 mitigation).

- [ ] **Step 3: Report the Windows verification plan to the user**

The actual Windows confirmation needs the reporter's machine: send them a `?debug=1` link and ask for the `sim` readout (should equal the speed setting) — per spec §8's manual matrix. Note this in the handoff message.

---

## Verification summary

- **Determinism regression guard:** `tests/physics/advance.test.ts` — trajectories are a pure function of step count, never frame pacing.
- **Wheel:** `wheel.test.ts` — three deltaMode cases + clamp.
- **Schema migration:** `schema.test.ts` — old discrete blobs parse; out-of-range rejected (whole-blob default fallback upstream).
- **Preset stability:** `presets.test.ts` — 60 sim-seconds, no ejection/merge, moon stays bound, zero net momentum.
- **Framework:** `pnpm build` chunk check + manual page load for the registry loader.
- **Live behavior:** `?debug=1` HUD proves effective sim-rate == speed on any machine.

## Self-review notes (already applied)

- Spec §8's warning about the vitest glob is stale — `components/**` IS included; co-located playground tests run. Only `lib/**` is excluded, hence `tests/physics/advance.test.ts`.
- Spec §5.1 claims per-field Zod fallback; reality is whole-blob fallback (`encode-state.ts`). Outcome (defaults) is the same; tests assert the real behavior.
- `stepsThisFrame` introduced in Task 2 is consumed in Task 5 — if executing Task 2 standalone trips `no-unused-vars`, keep the temporary `void stepsThisFrame;` noted there.
- Circular velocities use the sim's **softened** gravity (`DEFAULT_SOFTENING` export) — plain `√(GM/r)` would leave the tight moon orbit ~2% eccentric.
