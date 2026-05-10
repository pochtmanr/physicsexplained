# `_shared` — Cross-topic physics primitives

Shared canvas primitives + design tokens that amortize across CM / EM / RT topics. Each topic-specific Scene wraps a primitive and configures it.

---

## The canonical scene pattern

Every Canvas-2D scene on the site MUST follow this pattern. The two screenshot-validated reference scenes are:

- `components/physics/dielectric-capacitor-scene.tsx` (EM, CM-style controls)
- `components/physics/einsteins-field-equations/efe-split-screen-scene.tsx` (RT, split-panel)
- `components/physics/maxwell-and-the-speed-of-light/foucault-rotating-mirror-scene.tsx` (RT, animated)

Mirror those three when adding a new scene.

### Rules

1. **Theme tokens, not hex literals.** Use `useSceneTokens()` for colors. Never write `#0A0C12`, `#67E8F9`, `text-white/70`, `accent-cyan-400`, etc. directly. Tokens flip on `data-theme="light"|"dark"` automatically.

2. **Don't double the frame.** `<SceneCard>` already provides a 1px theme-aware border + 4 corner squares + scene background. The canvas inside MUST NOT add its own `rounded-*`, `border-*`, or `bg-*`. Render the canvas with `className={SCENE_CANVAS_CLASS}` (= `"block"`).

3. **Responsive width via `useSceneSize`.** Don't hardcode `width={720}` or `width={540}`. Let the canvas track the SceneCard width with a `ResizeObserver`. Cap height at `SCENE_HEIGHT_DEFAULT | SCENE_HEIGHT_TALL | SCENE_HEIGHT_SHORT`.

4. **DPR scaling.** Call `applyDpr(canvas, width, height)` once per redraw. The `width`/`height` you pass come from `useSceneSize`.

5. **Controls use theme tokens.** Sliders: `accent-[var(--color-cyan)]`. Labels: `text-[var(--color-fg-3)]`. Active button: `border-[var(--color-cyan)] text-[var(--color-cyan)]`. Inactive: `border-[var(--color-fg-4)] text-[var(--color-fg-3)]`.

6. **No animation if the scene is static.** For animated scenes, use `useAnimationFrame` (when re-renders are needed) or `useSceneTick` (ref-based, no re-renders).

### Skeleton

```tsx
"use client";

import { useEffect, useRef, useState } from "react";
import {
  applyDpr,
  SCENE_CANVAS_CLASS,
  SCENE_HEIGHT_DEFAULT,
  useSceneSize,
  useSceneTokens,
  type SceneTokens,
} from "@/components/physics/_shared/scene-tokens";

export function MyScene() {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const tokens = useSceneTokens();
  const { width, height } = useSceneSize(containerRef, {
    ratio: 0.55,
    maxHeight: SCENE_HEIGHT_DEFAULT,
  });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = applyDpr(canvas, width, height);
    if (!ctx) return;
    draw(ctx, tokens, width, height);
  }, [tokens, width, height]);

  return (
    <div ref={containerRef} className="w-full pb-4">
      <canvas ref={canvasRef} className={SCENE_CANVAS_CLASS} />
      {/* controls go here, using theme-aware classes */}
    </div>
  );
}

function draw(
  ctx: CanvasRenderingContext2D,
  tokens: SceneTokens,
  W: number,
  H: number,
) {
  ctx.fillStyle = tokens.bg;
  ctx.fillRect(0, 0, W, H);
  // ...your physics here, using tokens.cyan/magenta/amber/...
}
```

### Anti-patterns (forbidden)

```tsx
// WRONG — adds a competing frame inside SceneCard
<canvas className="rounded-md border border-white/10 bg-[#0A0C12]" />

// WRONG — Tailwind neon override, ignores theme
<input className="accent-cyan-400" />

// WRONG — text on dark assumption, breaks light mode
<span className="text-white/70">L = 20 m</span>

// WRONG — fixed pixel width, overflows narrow viewports
<canvas width={720} height={420} />

// WRONG — module-level color constants frozen at parse time
const BG = "#0A0C12";
const CYAN = "#67E8F9";
```

---

## SpacetimeDiagramCanvas

Minkowski-diagram primitive for SR topics. Vertical axis `ct`, horizontal `x`. Worldlines are polylines through `MinkowskiPoint` events. Light cone renders as 45 deg dashed rays from the origin. Boosted-frame axes overlay tilts ct' toward 45 deg and x' symmetrically as |β| grows. Optional simultaneity slice draws constant-t' under boost. Providing `onBoostChange` renders a controlled β slider; otherwise no slider.

Consumed by RT §01.5 relative-simultaneity, §02.1 time-dilation, §02.3 the-lorentz-transformation (Session 1) and §03.1 spacetime-diagrams, §03.5 the-twin-paradox (Session 2).

### API

| Prop | Type | Default |
| --- | --- | --- |
| `worldlines` | `readonly Worldline[]` | required |
| `lightCone` | `boolean` | `true` |
| `simultaneitySlice` | `{ tPrime, beta } \| null` | `null` |
| `boostBeta` | `number` | `undefined` |
| `boostMin` / `boostMax` / `boostStep` | `number` | `-0.95` / `0.95` / `0.01` |
| `onBoostChange` | `(beta: number) => void` | `undefined` |
| `xRange` | `[number, number]` | `[-2, 2]` |
| `tRange` | `[number, number]` | `[0, 4]` |
| `width` / `height` | `number` | `480` / `360` |
| `palette` | `Partial<SpacetimePalette>` | `undefined` |

`Worldline.accelerated` flips the line to the orange palette slot.

### Color convention

All worldline / axis / cone colors come from `useSceneTokens()`. Override via `palette` only when a topic demands it.

- Stationary worldlines / lab axes: `tokens.cyan`
- Boosted-frame axes / simultaneity slices: `tokens.magenta`
- Light cones: `tokens.amber`
- Accelerated worldlines: `tokens.orange`
- Grid: `tokens.grid`

### Notes

- Caller passes `MinkowskiPoint.t` in `ct` units; canvas does not scale by `c`.
- All math is inline (slope 1/β for ct', slope β for x', `t = tPrime/γ + β·x` for simultaneity). No sibling solver.
- `Worldline` / `MinkowskiPoint` come from `lib/physics/relativity/types`.
