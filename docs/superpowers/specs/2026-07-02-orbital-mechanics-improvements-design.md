# Orbital Mechanics Playground — Improvements Design Spec

**Date:** 2026-07-02
**Status:** Draft (awaiting user review before plan-writing)
**Scope:** Cross-platform bug fixes and feature improvements for the existing `/play/orbital-mechanics` playground, plus one framework cleanup (registry-driven loading) that unblocks the second playground. The second playground itself is specced separately in `2026-07-02-gas-chamber-playground-design.md`. Builds on `2026-04-30-interactive-playgrounds-design.md`.

---

## 1. Context & bug report

Reported symptom: *"On Mac the playground works perfectly; on Windows the speed is always maximum and it does not work the same."*

The obvious suspect — physics stepped once per `requestAnimationFrame` frame with a fixed dt, so a 120/144 Hz monitor runs the sim 2–2.4× faster — is **not** the cause. The loop in `lib/animation/use-animation-frame.ts:59-64` derives `dt` from real frame timestamps and clamps it to 0.1 s, so wall-clock simulation speed is already refresh-rate independent.

The verified diagnosis is a combination of four real issues:

### 1.1 Non-deterministic integration step (root cause, P0)

`components/playgrounds/orbital-mechanics/n-body-canvas.tsx:336-344`:

```ts
const totalDt = dt * speed;
const subSteps = Math.max(1, Math.ceil(totalDt / SIM_DT));
const subDt = totalDt / subSteps;
```

`subDt` depends on the frame's `dt`, which depends on refresh rate and frame pacing. A 60 Hz Mac integrates with different step sizes than a 144 Hz Windows PC. The N-body problem is **chaotic**: step-size differences that are individually tiny amplify exponentially. Within seconds the two machines are running visibly different scenarios. In particular, close encounters (where Verlet error is largest) that stay gravitationally bound on one machine become **high-speed ejections** on the other — a body flung off-screen at ejection velocity reads exactly as "the speed is always maximum" and "it does not work the same."

### 1.2 Wheel zoom ignores `WheelEvent.deltaMode` (P0)

`n-body-canvas.tsx:186`: `const factor = Math.exp(-e.deltaY * 0.0015)` assumes pixel-mode deltas. Firefox on Windows reports **line-mode** deltas (`deltaMode === 1`, `deltaY ≈ ±3` per notch vs ±100 px in Chrome), so zoom is effectively dead there. Discrete Windows mouse notches also feel much coarser than a Mac trackpad's continuous pixel stream. This is a genuine, reproducible "does not work the same on Windows."

### 1.3 Uncapped devicePixelRatio (P0)

`components/playgrounds/orbital-mechanics/draw.ts:47` uses `window.devicePixelRatio || 1` with no cap. Windows fractional display scaling (125 % / 150 % / 175 % is the default on most 4K laptops) yields large fractional DPRs and an oversized canvas backing buffer, causing dropped frames on integrated GPUs. Dropped frames push `dt` toward the 0.1 s clamp, which both worsens §1.1 (larger `totalDt` → different substep sizes) and makes motion look juddery.

### 1.4 `speed: 4` persists in the shared URL blob (UX footgun)

`speed` is part of the Zod state encoded into the `?s=` blob (`schema.ts`, `urlMode: "blob"`). A link copied while running at 4× opens at 4× on the recipient's machine. If the Windows report came from a shared/bookmarked URL, part of the symptom may literally be "the URL says maximum speed."

---

## 2. Goal

- The same starting state produces the **same trajectory on every machine**, regardless of refresh rate, OS, or momentary frame drops.
- Zoom, pan, and placement gestures feel equivalent on Mac trackpad, Windows mouse, and touch.
- Richer sandbox: finer speed and size control, more bodies, and real-life presets (Sun–Earth–Moon, inner solar system, …).
- Framework honors the original spec's promise (§3.2 of the 2026-04-30 spec): adding a playground touches no framework code.

## 3. Non-goals

- 3D, relativistic corrections, or real-SI unit simulation.
- Changing the physics solver API (`lib/physics/n-body.ts` `step`/`resolveCollisions` signatures stay).
- Server-side anything. The URL remains the save format.

---

## 4. Cross-platform fixes (P0)

### 4.1 Deterministic fixed-timestep accumulator

Replace the per-frame substep division in `n-body-canvas.tsx` with a classic fixed-timestep accumulator ("Fix Your Timestep"):

```ts
// refs: accumulatorRef = useRef(0)
accumulatorRef.current += dt * speed;
const maxSteps = Math.ceil((MAX_DT_SECONDS * MAX_SPEED) / SIM_DT); // spiral-of-death guard
let steps = 0;
while (accumulatorRef.current >= SIM_DT && steps < maxSteps) {
  bs = resolveCollisions(step(bs, SIM_DT));
  accumulatorRef.current -= SIM_DT;
  steps++;
}
```

- Every integration step is **exactly** `SIM_DT = 0.005` — identical trajectories everywhere, by construction.
- The fractional remainder carries to the next frame instead of shrinking the step size.
- Reset (`resetKey` effect at `n-body-canvas.tsx:133-140`) also zeroes the accumulator.
- Optional polish: interpolate rendering between the previous and current physics state by `accumulator / SIM_DT` to avoid sub-step temporal aliasing at high refresh rates. Stretch — visually negligible at `SIM_DT = 5 ms`; skip unless judder is observed.
- The paused predictive trace (`drawPredictiveTraces`, 5 s forward integration) already uses fixed steps and needs no change.

### 4.2 Normalize wheel deltas

In the `onWheel` handler (`n-body-canvas.tsx:179-188`):

```ts
const LINE_HEIGHT_PX = 16;
const px =
  e.deltaMode === 1 ? e.deltaY * LINE_HEIGHT_PX :
  e.deltaMode === 2 ? e.deltaY * vp.h :
  e.deltaY;
const clamped = Math.max(-120, Math.min(120, px)); // one "notch" max per event
const factor = Math.exp(-clamped * 0.0015);
```

Fixes Firefox/Windows line-mode and prevents a single high-resolution wheel event (or momentum fling) from jumping the zoom.

### 4.3 Cap devicePixelRatio at 2

`draw.ts` `prepareCanvas`: `const dpr = Math.min(window.devicePixelRatio || 1, 2)`. Above 2× the extra resolution is invisible for this content but quadruples fill cost on exactly the scaled-4K Windows machines that are struggling.

### 4.4 Debug HUD behind `?debug=1`

To verify the fix on the actual Windows machine (and diagnose any future report), render a tiny corner overlay when the URL carries `debug=1`: fps (rolling), raw `dt` (ms), `devicePixelRatio`, effective sim-rate (sim-seconds advanced per wall-second — should equal `speed` exactly), body count, accumulator value. Read from a ref inside the existing draw pass; no React state, no cost when off, excluded from the shared URL (it's a plain query param, not part of the `?s=` blob schema).

### 4.5 Speed-in-URL mitigation (UX)

Keep speed shareable (it is part of the scenario), but make the state obvious: the speed control must clearly show the active value on load. With the slider redesign in §5.1 this comes for free (thumb position + numeric label). Add a one-tap "1×" reset affordance on the slider label.

---

## 5. Feature improvements (P1)

### 5.1 Continuous speed slider

Replace the discrete `0.25× / 1× / 4×` buttons (`controls.tsx:76`, type `0.25 | 1 | 4`) with a log-scale slider **0.1× – 10×**, default 1×, with a tap-to-reset "1×" label and detents at 0.25/0.5/1/2/4.

Schema migration (`schema.ts:21`): `speed: z.number().min(0.1).max(10).default(1)` — old blobs carrying `0.25 | 1 | 4` parse unchanged because they're valid numbers in range; no coercion shim needed. Out-of-range values fall back to the Zod default per the existing `safeParse` path.

Spiral-of-death note: 10× × 0.1 s clamp / 0.005 s = 200 substeps of an O(n²) 16-body step per worst-case frame — still trivial (< 1 ms), but the `maxSteps` guard in §4.1 covers pathological cases by letting the sim run slightly slower than requested instead of freezing the tab.

### 5.2 Place-mass slider

Replace the S/M/L/XL buttons (`0.5 / 1 / 5 / 20`, `controls.tsx:21-26`) with a log-scale slider **0.1 – 50** plus the same four values as detents. Body radius already derives from mass (`lib/physics/n-body.ts:26-28`, `0.04 + √mass·0.025`), so visual size follows automatically — this is also the requested "size" control. Schema: `placeMass: z.number().min(0.1).max(50).default(1)`; old discrete values remain valid.

The hover ghost and slingshot previews (`draw.ts` `drawHoverGhost`/`drawSlingshot`) already take `placeMass` and need no change.

### 5.3 Raise body cap 8 → 16

`BODY_CAP` (`n-body-canvas.tsx:56`). The solver is O(n²) per substep; n=16 is 4× the pairs of n=8 — negligible. Trails and the predictive-trace overlay scale linearly. Keep the existing FIFO eviction + trail-pruning behavior.

### 5.4 Desktop mouse pan

Currently pan is two-finger touch only (`gestures.ts:178`); on desktop an empty-canvas drag is reserved for slingshot placement. Add **middle-button drag** and **Space + left-drag** to pan, handled in the desktop-affordance effect in `n-body-canvas.tsx` alongside wheel/contextmenu. Reuses the existing `onPan` math (`cam.panX -= dx / cam.scale`). Cursor feedback: `grab`/`grabbing` while Space is held.

### 5.5 Real-life presets

Add four presets to `presets.ts` alongside the existing abstract ones:

| id | bodies | teaches |
|----|--------|---------|
| `sun-earth-moon` | 3 | hierarchy of orbits; the Moon orbits the Sun too |
| `inner-solar-system` | Sun + Mercury/Venus/Earth/Mars | Kepler's third law at a glance |
| `earth-moon` | 2 | two-body orbit around a barycenter |
| `binary-star` | 2 stars + 1 planet | circumbinary orbit / tatooine |

**Unit strategy (the key design decision).** The sim is dimensionless (`G = 1`, order-unity positions). True mass ratios are unusable as-is: Sun:Earth = 333 000:1 means the planet renders sub-pixel (radius ∝ √mass) and any planet–moon contact triggers absorb (`ABSORB_MASS_RATIO = 25`, `lib/physics/n-body.ts:58`). Instead each preset uses **compressed mass ratios with exact orbital elements**: pick display masses on a compressed scale (e.g. Sun 100, Earth 1, Moon 0.3 — same scale as the existing `solar-mini`), keep *relative orbital radii* real (Moon at 1/389 of Earth's distance is also unusable, so radii are compressed per-preset too), then compute circular-orbit velocities from the actual chosen masses/radii (`v = √(G·M/r)`) so every preset is a genuinely stable orbit, not a lookup of real numbers. Each preset documents its compression in a code comment. Periods land in the 5–30 s range at 1× speed.

**Preset metadata extension.** Real presets need framing and identity that abstract ones didn't:

```ts
interface PresetDef {
  bodies: Body[];
  camera?: { scale: number };            // initial px-per-world-unit override
  bodyMeta?: Record<string, { labelKey: string; color?: string }>; // by body id
}
```

- `camera.scale` applies on preset switch via the existing `resetKey` recenter path (`n-body-canvas.tsx:133-140`).
- Labels render next to bodies (new small `drawLabels` pass in `draw.ts`), translated via `play.json` keys; color overrides the palette-by-id default (sun = warm yellow, earth = blue, mars = red).
- `PRESET_IDS`, the `<select>` in `controls.tsx:97-111`, and `presetsInfo.*` copy in `messages/{en,he}/play.json` extend mechanically. Any user edit still promotes to `custom` via the existing atomic promotion (`index.tsx:44-50`).

---

## 6. Framework cleanup: registry-driven loading

`app/[locale]/play/[slug]/playground-loader.tsx` hardcodes `switch (slug)` with its own `next/dynamic` import, while `PlaygroundMeta.loader` (`playground-meta.ts`) is dead code. This violates the original spec's §3.2 ("register it in `playground-meta.ts` … No framework code changes").

Fix: make `playground-loader.tsx` resolve the component from the registry:

```tsx
const Component = useMemo(
  () => dynamic(meta.loader, { ssr: false, loading: SceneSkeleton }),
  [slug],
);
```

with `meta.loader` already declared as `() => import("@/components/playgrounds/orbital-mechanics")`. After this, the Gas Chamber playground (companion spec) registers itself with zero framework edits. Verify the per-playground chunk split survives (loader closures keep imports statically analyzable).

---

## 7. i18n

New keys in `messages/en/play.json` and `messages/he/play.json` under `orbital-mechanics.*`: slider labels (`controls.speed`, `controls.mass`, reset-to-1× aria), preset names + `presetsInfo` blurbs for the four real presets, body labels (`bodies.sun`, `bodies.earth`, `bodies.moon`, `bodies.mercury`, …). Hebrew translations are written by hand in the same change (standing rule: no machine translation).

---

## 8. Testing & verification

- **Determinism test** (the core regression guard): drive the accumulator logic with two different frame-dt sequences (e.g. constant 1/60 vs jittery 1/144) over the same start state and assert bit-identical body positions after N sim-seconds. Requires extracting the accumulator advance into a pure helper (e.g. `lib/physics/advance.ts`) so it's testable without a canvas.
- **Wheel normalization test**: pure helper `normalizeWheelDelta(e)` unit-tested for the three deltaMode cases + clamping.
- **Preset stability tests**: for each real preset, run the solver 60 sim-seconds and assert no ejection (all bodies within a bounding radius) and no unintended merge.
- **Schema migration tests**: old discrete `speed`/`placeMass` blob values still parse; out-of-range falls back to defaults.
- ⚠️ **Test location**: Vitest's include glob only picks up `tests/**` — the co-located `*.test.ts` files inside `components/playgrounds/orbital-mechanics/` likely never run in CI. Verify this during implementation; new tests go under `tests/`, and existing co-located ones should be moved or the glob widened (decide then, favor moving).
- **Manual matrix**: Mac Safari/Chrome (trackpad), Windows Chrome/Firefox/Edge (mouse, 100 % and 150 % scaling, 60 Hz and 144 Hz if available), one Android + one iOS touch pass. Use the `?debug=1` HUD to confirm effective sim-rate equals the speed setting on every machine.

---

## 9. Rollout order

1. §4 fixes + §8 determinism test (small, self-contained, addresses the live bug).
2. §6 loader cleanup (unblocks the Gas Chamber spec).
3. §5.1–5.4 control upgrades (schema-compatible, incremental).
4. §5.5 real presets + labels + i18n (largest chunk, pure addition).
