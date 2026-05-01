# Orbital-Mechanics Playground — next-session brief

This is the carry-forward note for the orbital-mechanics playground at
`/play/orbital-mechanics`. The page is wired in from
`components/playgrounds/orbital-mechanics/`. Four big sweeps already happened in
the previous sessions; what's left is polish and a real refactor.

> **TL;DR — last session shipped session D:** Angry-Birds slingshot launch
> from empty canvas, real elastic 2D billiard collisions (with mass-ratio
> absorption fallback for "small body disappears" intuition), and bumped
> `LAUNCH_BOOST` to 250. Read the **Session D** block below for details
> before changing collision or launch behaviour.

> **Quick orient**
>
> - Page route: `app/[locale]/play/[slug]/page.tsx` → `playground-loader.tsx`
> - Playground entry: `components/playgrounds/orbital-mechanics/index.tsx`
> - Canvas + render loop: `components/playgrounds/orbital-mechanics/n-body-canvas.tsx`
> - Gestures (pointer + multitouch): `components/playgrounds/orbital-mechanics/gestures.ts`
> - Physics + helpers: `lib/physics/n-body.ts` (now exports `bodyRadius`, `mergeBodies`, `resolveCollisions`, `step`, `totalEnergy`, `centerOfMass`, `totalMomentum`)
> - URL-backed state hook: `app/[locale]/play/_components/use-playground-state.ts`
> - Theme tokens: `app/globals.css` (cyan / magenta / amber / mint + fg / bg)

---

## What was done in the previous sessions

### Session A — feature pass

- Added the **Beta** badge on `/play` and a "playgrounds in active development" notice strip.
- Added the **left-side info panel** (`info-panel.tsx`) — explains 1/r² gravity, Velocity-Verlet, why 3+ bodies are chaotic, an interaction cheat-sheet, and a per-scenario blurb (figure-8 / mini solar / Pythagorean / random-cluster). Active scenario is highlighted. Toggleable; `localStorage` persists.
- **"Ask AI"** CTA replaces "Explain with AI" with a richer pre-filled prompt.
- **Mass picker** in the toolbar (S / M / L / XL → 0.5 / 1 / 5 / 20).
- **Place-anywhere**: empty-canvas tap drops a body at the cursor. Dashed ghost previews placement at hover.
- **Remove**: long-press (touch) and right-click (desktop).
- **Trails** rewritten as colored polylines (per-body palette color), and they no longer ghost across preset switches.
- **Wheel/trackpad zoom** that zooms toward the cursor.

### Session B — correctness pass driven by `qa-security-reviewer`

Eight findings; all addressed:

| # | Finding | Status | Fix summary |
|---|---|---|---|
| 1 | Reset desync — `router.replace` is async; `resetKey` effect rewound against stale state | **fixed** | `usePlaygroundState.reset()` now `setStateLocal(decodedDefault)` synchronously alongside the URL clear, so Reset is always one React commit. |
| 2 | Pinch zoom resetting to default scale on every pinch start | **fixed** | `gestures.ts` emits **per-frame ratios**; canvas multiplies `cam.scale` so wheel-zoom and pinch-zoom compose. |
| 3 | Reset mid-touch-drag left a stale `activeBody` index | **fixed** | `onBodyUp` validates `index` against current bodies length and bails cleanly. |
| 4 | Listener thrash — gestures rebound on every parent render, killing long-press timers | **fixed** | `onBodiesChangeRef` ref + mount-once `useEffect` for both gesture and mouse listeners. |
| 5 | Phantom tap from 2-finger pinch end | **fixed** | `twoFingerActive` flag in gestures; pointerup short-circuits while a pinch is/was running. |
| 6 | `[sig]` eslint-disable opaque | **clarified** | Comment explains why `incomingSig` (a string) safely encodes the dep. |
| 7 | Body-cap eviction left orphan trail entries until next sig tick | **fixed** | `onTap` prunes evicted ids in the same handler. |
| 8 | `screenToWorld` non-null assertion could throw under HMR | **fixed** | Guards `canvasRef.current` with a safe `{x:0,y:0}` fallback. |

### Session C — root-cause fixes for the user-reported bugs

- "**When I add a new object, it resets to defaults**" + "**duplicated trails, slightly different**" — both symptoms of the same race: `setBodies(next)` and a separate `onUserEdit()` were both calling `setState({...state, …})` from the same render closure. React batched them; the second won and snapped `state.bodies` back to `bodiesFor(state)` = the preset's *initial* frame.
  → Fix: `setBodies` is now the sole user-edit entry point and atomically promotes preset → "custom" in one update. `onUserEdit` deleted.
- "**Reset isn't working right — I want full reset to defaults**" — see #1 above; Reset now synchronously flips state to schema defaults (figure-8, `placeMass=1`, `speed=1`, `trails=on`) and bumps `resetKey`.
- "**The sun gets big when I zoom out and hits the planet**" — body radius was specified in pixels (zoom-independent) and collision radius was `px / cam.scale` (zoom-dependent → grew on zoom-out). Fixed in this session — see next block.

### Session C — zoom-invariant physics + merge-on-collision

- Body radius is now **world-unit** via `lib/physics/n-body.ts::bodyRadius(mass)`. Visual radius = `bodyRadius(mass) * cam.scale`, with a 2 px floor so deep zoom-out still shows something to click on.
- Collision radius uses the same `bodyRadius()` — fully camera-invariant.
- Replaced freeze-on-collision with **perfectly-inelastic merge** via `mergeBodies(a, b)` and `resolveCollisions(bodies)`. The bigger body wins (its id, color, and trail are preserved); the smaller is absorbed. Mass sums; momentum is conserved (so the merged body keeps moving in the right direction). Energy dissipates — that's "perfectly inelastic" by definition.
- Sim-driven merges propagate to React state so the body counter and URL share-link stay in sync.
- A new **`incomingSig`-guarded sync effect** prevents the React commit from snapping the live sim back to a one-frame-stale snapshot every time a merge propagates. The effect only resyncs when the *id set* changes (place / remove / merge / preset / URL back-nav), never for same-id-set updates (drag-velocity / speed / trails).

### Session D — Angry-Birds slingshot launch + elastic collisions

- **Drag-from-empty-canvas** is a full single-gesture launch: pointerdown on empty space → drag to aim → release to fire. Anchor point holds steady, dashed line shows what you're "pulling on", solid arrow (1.6× the pull length) shows the launch vector with an arrowhead. Tap-without-drag still places at rest. Two-finger pinch starting mid-aim cleanly cancels the placement via `onPlaceCancel`.
- **`LAUNCH_BOOST = 250`** in `n-body-canvas.tsx`. The gestures module emits drag velocity at the legacy `0.02` px→px/s scale (tuned for nudging existing bodies); we multiply by 250 on the empty-canvas path so a 150 px drag → ~7 world u/s — orbital velocity territory for solar-mini. The first stab at 75 felt sluggish; bumped twice. Slingshot direction is **negated** (`vx = -dragVx * BOOST / scale`) so the user pulls *back* and the body launches *forward* per Angry-Birds intuition.
- **Replaced perfectly-inelastic merge with realistic elastic-bounce physics.** `lib/physics/n-body.ts::bounceBodies(a, b)` implements 2D billiard collision: normal/tangent decomposition along the line of centers, 1D elastic exchange of normal components, tangential components preserved, positional separation by inverse-mass weighting to prevent re-collision. `RESTITUTION = 0.95` so kinetic energy is conserved up to 5% per bounce (1.0 = perfectly elastic, but causes integrator-error oscillations).
- **Hybrid collision response:** `resolveCollisions` now calls `bounceBodies` for similar-mass pairs and falls back to `mergeBodies` only when `mass_ratio >= ABSORB_MASS_RATIO = 25` — so a planet (mass 1) hitting a sun (mass 100) absorbs (100:1 = "small one disappears" intuition), but two planets bounce. Approach test (`v_rel · n > 0`) prevents already-separating bodies from re-bouncing on subsequent sub-steps.
- **`mergeBodies` is still exported** so any future scenario can opt into pure-merge dynamics; `bounceBodies` is also exported for direct reuse.

---

## What still feels "early beta" — next session

User-stated priorities in order: **trails, orbits, colors, refactor**. Here's the full list with priorities and pointers.

### 1. Refactor the canvas into focused modules — HIGH

`n-body-canvas.tsx` is now ~360 lines mixing camera, gestures, drawing, simulation, and React lifecycle. Split:

```
components/playgrounds/orbital-mechanics/
  n-body-canvas.tsx        # orchestration only (refs, effects, prop wiring)
  camera.ts                # Camera type, PX_PER_UNIT_DEFAULT, clamps, screenToWorld / worldToScreen
  hit-test.ts              # hitTest(bodies, cam, x, y, slop)
  draw.ts                  # drawBackground / drawTrails / drawBodies / drawDragArrow / drawGhost / drawHud
  trails.ts                # TrailPoint, TrailBuffers (Map wrapper), append / prune
  palette.ts               # colorPalette(themeColors), colorIndexForId
  gestures.ts              # exists
  presets.ts / schema.ts / controls.tsx / info-panel.tsx / index.tsx  # exist
```

Render-loop target shape:

```ts
useAnimationFrame({
  elementRef: containerRef,
  onFrame: (_, dt) => {
    if (isPlaying && !reducedMotion) stepSimulation(simRef, dt, speed);
    appendTrails(trailsRef.current, simRef.current.bodies, dt, trails);
    const ctx = prepareCanvas(canvasRef.current);
    if (!ctx) return;
    drawScene(ctx, simRef.current, trailsRef.current, camRef.current, palette, /* drag, hover */);
  },
});
```

Pure render functions take theme + state and emit pixels — easy to test, easy to reason about, and ready to be reused by future scenes (the playground catalog is going to grow beyond orbital-mechanics).

### 2. Trails — actually fade by age — MEDIUM

Today the polyline draws with a single `globalAlpha = 0.55` — every point is the same brightness regardless of age. The buffer already tracks per-point age, we just don't use it.

- **Quick fix:** draw the trail as N short segments (each between two consecutive points), setting `globalAlpha` per segment from `1 - age / TRAIL_MAX_AGE_S`. ~50 segments × 8 bodies is nothing on canvas2d.
- **Better:** render the trail to an offscreen `OffscreenCanvas` additively, then composite. Lets the trail fade naturally over many frames without a buffer at all. Trade-off: harder to clear cleanly on Reset.

While we're there: a configurable trail length (3 s / 10 s / 30 s / off) helps users see whole orbits.

### 3. Orbits — predictive trace — MEDIUM

For pedagogical value, when paused (or always, faintly) draw a forward-integrated **prediction** of each body's trajectory for the next ~5 seconds. Run a copy of `step()` in a tight loop without writing to React. ~300 sub-steps × 8 bodies = ~2.4k integrator calls per pause-frame — fine if memoized while paused.

Makes "is this orbit closed?" answerable at a glance, especially for figure-8 where the answer is "yes, exactly the same path forever".

### 4. Colors — expand the palette — LOW

Currently 4 colors (`cyan, amber, magenta, mint`). With 8 bodies and id-hash bucketing, ~25% pair-collision probability per palette slot.

- Bump to 8 brand-aligned colors (add soft-red, lavender, sky, peach), pick by `colorIndexForId` mod 8. **Recommended.**
- Or HSL-from-hash with fixed S/L: `hsl(hash % 360, 70%, 65%)`. Always distinct, less brand-controlled.

### 5. Velocity arrows + HUD — MEDIUM

When **paused** (and maybe always, faintly), draw a small arrow from each body in its velocity direction, length proportional to speed. Same color as the body. Massively improves "what is this thing about to do?".

A tiny **HUD top-right** with body count, total kinetic energy, total momentum |p|, and (optionally) a center-of-mass marker would push the scene from "demo" toward "instrument". `lib/physics/n-body.ts` already exports `totalEnergy` / `totalMomentum` / `centerOfMass`.

### 6. Pre-warm the figure-8 — LOW

The Chenciner-Montgomery figure-8 takes ~1 cycle (~6 s of sim time at speed 1) for the trail to actually trace the full ∞. First impression is "are these things just orbiting in a clump?" because the trail is too short.

- One-line fix: bump `TRAIL_MAX_AGE_S` to ~6 (longer trail tells the story faster).
- Fancier: pre-step the sim by ~3 s with trails active before the user sees frame 1, so the figure-8 is already drawn on entry.

### 7. Pythagorean is anticlimactic — partially mitigated, still LOW

Was: with perfectly-inelastic merge, Burrau's 1913 problem = 2 instant merges → 1 big body sitting still. With session D's elastic-bounce default + ABSORB_MASS_RATIO=25, the three equal masses (3 / 4 / 5) now bounce off each other instead — much closer to the canonical chaotic outcome.

Open polish: when bounces happen at very high relative velocities the bodies can squeeze past the position-correction step and tunnel. Symptom: occasional teleporting bodies on Pythagorean. Mitigation: continuous-time collision detection (CCD) — solve for the exact `t ∈ [0, dt]` at which the spheres first touch, advance to that t, bounce, then continue. Or just shrink `SIM_DT` from 0.005 → 0.002 and accept the perf cost (still trivial at 8 bodies).

### 8. Reset semantics — LOW (design call)

Right now Reset = "wipe all state, back to figure-8 defaults". Some users will expect Reset = "restart this scenario" (e.g., I'm on solar-mini and want to rewind it). Consider splitting:

- **Reset** (current): restart current scenario from t=0, keep preset / placeMass / etc.
- **Defaults** / **Clear**: nuke everything back to figure-8.

The user explicitly asked for the current behavior in session B, so this is a discussion to have, not a bug.

### 9. Place + drag in one gesture — DONE in session D

Implemented as the slingshot. Open follow-ups:
- The 1.6× visual-vs-physics arrow scaling is a fudge — 250× would push the arrow off-screen for any real drag, but 1.6× understates the actual launch power. A non-linear "energy meter" UI (radial fill on the ghost body, 0–100% mapped to drag length) would communicate launch strength better than arrow length alone.
- Pinch-start cancels the slingshot but the gesture's `emptyDown` state is reset only inside `onPointerUp` / `onTouchStart(2)`. If a single-touch drag-from-empty is still in flight when the canvas unmounts (rare), there's no ref-side cleanup. Low priority.

### 10. Mass picker — bigger range — NICE-TO-HAVE

S/M/L/XL = 0.5 / 1 / 5 / 20. The solar-mini sun is 100. To create a believable solar system from scratch the user needs `XXL = 100` or a continuous slider. A discrete `S / M / L / XL / Star` (0.5 / 1 / 5 / 20 / 100) covers it without adding control complexity.

### 11. Performance polish — LOW

- `shadowBlur = 12` per body is the most expensive thing on the canvas. With 8 bodies on a high-DPR display, can be 4–6 ms/frame. Skip shadow on bodies smaller than ~6 px (zoom-out case), or pre-render the body sprite to an offscreen canvas once per (color, radius) and `drawImage` it.
- Trail polyline `beginPath`/`stroke` per body is ~8 path ops per frame. Fine. Don't optimize until evidence.

### 12. RU locale missing `play.json` — LOW (separate)

`messages/ru/` has no `play.json`. When user views `/ru/play` next-intl falls back. Add a translation file when there's bandwidth.

---

## Tests / wiring to verify after the refactor

- `npx tsc --noEmit` — clean
- `npx vitest run components/playgrounds/orbital-mechanics app/[locale]/play lib/physics` — currently 9 passing
- `curl -sL http://localhost:3001/en/play/orbital-mechanics` — 200, contains "What you're seeing"
- Manual sanity: open the page, switch through every preset, drag a body, place a body, long-press to remove, right-click to remove (desktop), zoom with wheel and with pinch (touch), Reset from each preset, Reset mid-merge, Reset mid-drag.

---

## Files touched in the prior sessions (use as a reading list)

- `lib/physics/n-body.ts` — adds `bodyRadius`, `mergeBodies`, `bounceBodies`, `resolveCollisions` (hybrid bounce/absorb), `RESTITUTION`, `ABSORB_MASS_RATIO`
- `lib/hooks/use-theme-colors.ts` — added `amber`, `mint` keys
- `app/[locale]/play/page.tsx` — Beta badge + dev notice
- `app/[locale]/play/_components/use-playground-state.ts` — `reset()` is synchronous
- `app/[locale]/play/_components/playground-shell.tsx` — Beta badge in header
- `components/playgrounds/orbital-mechanics/schema.ts` — added `placeMass`
- `components/playgrounds/orbital-mechanics/index.tsx` — single `setBodies` source of truth, `resetKey` orchestration
- `components/playgrounds/orbital-mechanics/n-body-canvas.tsx` — full rewrite (zoom-invariant, elastic+absorb collision physics, slingshot launch with `LAUNCH_BOOST=250`, ghost+arrow aim preview, mount-once gesture/mouse effects, sig-guarded sync)
- `components/playgrounds/orbital-mechanics/controls.tsx` — mass picker, removed dead "Add" button
- `components/playgrounds/orbital-mechanics/gestures.ts` — per-frame pinch ratio, two-finger flag, pinch cancels long-press, **`onPlaceDrag` / `onPlaceUp` / `onPlaceCancel` callbacks for slingshot**
- `components/playgrounds/orbital-mechanics/info-panel.tsx` — new
- `messages/en/play.json` and `messages/he/play.json` — copy

---

## Ground rules for the next session

1. **Refactor first.** Anything new written into the existing 360-line canvas is wasted work — split into the modules listed above, then add features in the new files.
2. Keep `lib/physics/n-body.ts` pure. No DOM, no React, no theme colors. It must remain unit-testable in node.
3. Don't introduce a state-management library. The current React-state + URL-blob pattern works and is shareable.
4. Tests stay green at every commit boundary. `npx vitest run` is fast.
5. Match the project's idioms: terse comments, named exports, kebab-case files, PascalCase components, no `default` exports unless framework-required.
