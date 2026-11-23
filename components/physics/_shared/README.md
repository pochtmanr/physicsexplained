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

5. **Controls use theme tokens.** Sliders: `<SceneSlider>` (or `<SceneRange>` for a bare range input) — never a raw `<input type="range">` with an `accent-*` class. They are neutral gray at rest and take the accent only on hover, focus and drag (`.scene-range` in `app/globals.css`), so a stack of sliders stays quiet. They always run left-to-right, even on right-to-left pages, so a slider moves the same way as the numeric axis it controls. Small readable canvas text (axis numbers, units) uses `tokens.textLabel`, which passes AA; `tokens.textMute` does not at 11px. Labels: `text-[var(--color-fg-3)]`. Active button: `border-[var(--color-cyan)] text-[var(--color-cyan)]`. Inactive: `border-[var(--color-fg-4)] text-[var(--color-fg-3)]`.

6. **No animation if the scene is static.** Animated scenes follow rules 7–13 below (`useScenePlayback`); `useAnimationFrame` and `useSceneTick` are the lower-level loops that older scenes still use directly.

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

### Animated scenes: playback, controls, readouts

The reference for an animated scene is `components/physics/free-fall-scene.tsx` (FIG.01c, hammer and feather). Copy it when converting a scene.

7. **One clock: `useScenePlayback`.** Do not keep your own `startRef` / modulo loop. Give the hook a `duration` (scene seconds) and a `draw(t)` function. The scene plays once when it scrolls into view, holds its last frame, and waits for Replay; the reader can turn Loop on (the scene then holds for `LOOP_HOLD_SECONDS` before restarting). Nothing autoplays under `prefers-reduced-motion`, and no frames are requested while the scene is offscreen, the tab is hidden, or playback is paused or ended. `draw` is also called after every render, so resize, theme and parameter changes repaint a stopped scene.

   **A parameter change never restarts the run.** If the motion is a function of time, `draw(t)` just uses the new value. If the change should bend the motion from where things are (drag, a force, a field), keep the state in a ref and pass `simulation: { step, reset, isDone }` instead of `duration`: the hook steps the state each frame, ends the run when `isDone()` is true and calls `reset()` on Replay. Step with the exact solution over `dt` where one exists (see `stepFall` in `lib/physics/free-fall-drag.ts`) so the result does not depend on frame rate. Such a scene cannot be scrubbed. When a change arrives after the run has ended, replay once from `<SceneSlider onCommit>` (on release), never from `onChange`.

8. **One control bar: `<SceneControls playback={playback} />`.** Play/Pause, Replay, Loop and elapsed time. Pass `scrub` for a time scrubber, `note` for a short remark such as "½× speed". Do not hand-roll pause buttons.

9. **Sliders are `<SceneSlider>`** inside a `<SceneControlGroup>`. The label is tied to the input; pass `ariaLabel` when the visible label is a bare symbol, and `display` for the formatted value with its unit.

10. **Numbers go in `<SceneReadout>`, not on the canvas.** HTML readouts cannot collide with the drawing, wrap on narrow screens, are translated, and are read by assistive technology. Text that must stay in the canvas (axis ticks, object names) is drawn with `drawLabel`, which measures the text and keeps it inside the canvas; give it a `plate` when a curve can pass under it, and draw labels after the curves. Axis scales use `niceTicks` + `formatTick` (round values, same rule everywhere), with the unit in the axis or graph label.

11. **Per-frame drawing uses `syncCanvas`**, not `applyDpr` (which reallocates the canvas on every call).

12. **Full view comes for free.** `<SceneCard>` moves the live scene into the popup, so state survives, and `useSceneSize` reads `SceneViewContext` and grows the canvas to fit the popup. For that to work: put `ref={containerRef}` on the element that wraps the canvas **and** its controls (their height is subtracted from the space available), wrap both in `<div className="mx-auto" style={{ width }}>`, and draw from `width`/`height` only — no pixel constants for overall layout. Choose `fullView`: `"ratio"` to keep the aspect ratio, `"fill"` when the drawing adapts to any shape; the default `"width"` is what unconverted scenes get.

13. **Text is translated.** Visible strings and the canvas `aria-label` come from `useTranslations("scenes.<sceneName>")` (`messages/<locale>/scenes.json`). The canvas gets `role="img"`.

Conversion checklist for an existing scene:

- [ ] `useSceneTokens` + `useSceneSize` + `syncCanvas`/`applyDpr`; no hex literals, no private `ResizeObserver`
- [ ] `useScenePlayback` + `<SceneControls>` if it animates; no self-restarting loop
- [ ] no restart on parameter change (time-function `draw`, or `simulation` for stateful motion)
- [ ] sliders → `<SceneSlider>`; numeric readouts → `<SceneReadout>`; remaining canvas text → `drawLabel`
- [ ] strings in `messages/en/scenes.json` and `messages/he/scenes.json`
- [ ] checked at 360 px and 1280 px, dark and light, inline and in full view, at every slider extreme

### Inventory (measured 2026-11-22)

531 visual elements in 527 figure slots across 183 topics. By behaviour: animation with controls 252, static drawing that redraws on input 149, looping animation without controls 92, fully static 38, playground 1. By rendering: Canvas 2D 488 (+18 through the shared spacetime/manifold/circuit primitives), SVG 11, JSXGraph 11, plain DOM 2. Converted to the pattern above: the four figures of `classical-mechanics/motion-in-a-straight-line`.

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
