# FIG.01 — Motion in a Straight Line · Design

**Branch:** `classical-mechanics`
**Module:** `kinematics-newton` (Module 1)
**Slug:** `motion-in-a-straight-line`
**Status transition:** `coming-soon` → `live`
**Target reading time:** 10 minutes
**Date:** 2026-04-14

## Purpose

First topic of the first module of Classical Mechanics. Establishes the language of kinematics — position, velocity, acceleration — before any force shows up. Sets the voice and ambition for Module 1 to match the already-live Oscillations topics (FIG.13–FIG.15).

The essay must do three things at once:
- Tell the historical story (Galileo's ramp, 1604) of how kinematics became a science.
- Teach the derivative chain `x → v → a` without formal calculus notation, using slope intuition and area intuition.
- Earn the `x(t) = x₀ + v₀t + ½at²` result geometrically, not algebraically.

## Voice reference

Three live topics are the editorial reference: `the-simple-pendulum`, `beyond-small-angles`, `oscillators-everywhere`. Characteristics to reproduce:

- Cold open with a historical scene or concrete moment.
- One idea per section. 2000–2200 words total.
- Equations set off in `EquationBlock`; inline math is kept simple.
- Interactive `SceneCard` roughly every two sections.
- `<Term slug="…">…</Term>` for glossary terms on first use.
- `<PhysicistLink slug="…">…</PhysicistLink>` for named figures.
- Forward-pointing last section that names the next topic.

## Narrative arc

Seven sections, roughly balanced in length.

### § 1 — The ramp

**Hook:** Galileo in 1604, frustrated that water clocks cannot time a falling body, tilts the problem — rolls bronze balls down a grooved inclined plane to dilute gravity, and discovers the odd-number rule: distances in successive equal times go as 1, 3, 5, 7, 9… Total distance ∝ t².

**Physics point:** The first quantitative law of motion. Aristotle had claimed heavier bodies fall faster; Galileo shows the law is about time, not weight.

**Scene:** `FIG.01a — inclined-plane-scene`. Ball rolls down a ramp with an angle slider. Time markers drop stroboscopically at equal intervals. Odd-number spacing becomes visible.

### § 2 — Position, velocity, acceleration

**Physics point:** Define the derivative chain in plain language. Velocity is how fast position changes; acceleration is how fast velocity changes. Introduce notation without ceremony.

**Equations:**
- `EQ.01 — v = dx/dt`
- `EQ.02 — a = dv/dt`

**No new scene.** Relies on prose plus a brief callback to the ramp.

### § 3 — What a slope really means

**Physics point:** The geometric meaning of a derivative. A secant through two points on x(t) becomes the tangent as the two points merge. The slope at an instant is velocity.

**Scene:** `FIG.01b — tangent-zoom-scene`. A curve x(t) with a secant defined by two draggable endpoints. A Δt slider shrinks the interval from 1 to ~0. The secant rotates visibly into the tangent.

### § 4 — Uniform acceleration

**Physics point:** Constant-a kinematic equations. The ½ in ½at² comes from the area of a triangle under a linear v(t), which the scene draws explicitly.

**Equations (Callout, referenced as a group):**
- `v = v₀ + at`
- `x = x₀ + v₀t + ½at²`
- `v² = v₀² + 2a(x − x₀)` (third equation mentioned, not centered)

**No new scene.** Reuses §3's geometry reasoning; an inline SVG of the triangle under v(t) if needed, no full component.

### § 5 — Everything falls the same

**Physics point:** `g ≈ 9.81 m/s²` on Earth. In vacuum, all bodies fall with the same acceleration regardless of mass. Leaning Tower story (probably apocryphal) → Apollo 15 hammer-and-feather (real, 1971, David Scott).

**Scene:** `FIG.01c — free-fall-scene`. Two objects (feather + hammer) fall side-by-side. A toggle enables/disables air resistance. With air: feather drifts. Without: they land together.

### § 6 — The graph is the physics

**Physics point:** A single `x(t)` graph contains every fact about 1D motion. Height = position. Slope = velocity. Curvature = acceleration. Reading a motion graph is equivalent to knowing the motion.

**Scene:** `FIG.01d — kinematics-graph-scene`. The centerpiece. Three stacked graphs of x(t), v(t), a(t) and a 1D ball moving along a track synced to x(t). Sliders for x₀, v₀, a. Live cross-hair showing the current (t, x), (t, v), (t, a) values. This scene alone also serves §2 and §4 as secondary references.

### § 7 — The straight line was a lie

**Physics point:** 1D motion is the skeleton. Real motion happens in space and has direction — the next topic adds vectors. Short closing section, forward-pointer to FIG.02 — Vectors and Projectile Motion.

## Interactive components to build

Four new React components in `components/physics/`. Each follows the same patterns as the live oscillations scenes: `"use client"`, self-contained, no global state, controlled by sliders or toggles, responsive. Use the same look-and-feel as `shm-oscillator-scene`, `damped-pendulum-scene`, `energy-diagram-scene`.

### 1. `inclined-plane-scene.tsx`

**Purpose:** Galileo's ramp. Prove the odd-number rule visually.

**Controls:**
- Angle slider, 5° to 45°.
- Play / pause / reset.

**Visuals:**
- Ramp drawn at the slider angle.
- Ball rolls with acceleration a = g·sin(θ).
- Marks drop on the ramp at equal time intervals t = 1, 2, 3, 4, 5 (scaled units).
- The spacing between successive marks visibly grows 1 : 3 : 5 : 7 : 9.
- Small label next to each interval showing its length ratio.

### 2. `tangent-zoom-scene.tsx`

**Purpose:** Secant-to-tangent intuition for the derivative.

**Controls:**
- A single slider for Δt, from 1.0 down to 0.01 (log scale preferred).
- A `t` slider selecting where on the curve the tangent is computed.

**Visuals:**
- A curve x(t) = (t² / 2) + 0.3t, plotted.
- Two points on the curve at (t, x(t)) and (t+Δt, x(t+Δt)).
- A secant line through them, drawn visibly.
- As Δt → 0, the secant rotates into the tangent. The slope value is shown numerically and visibly converges.

### 3. `free-fall-scene.tsx`

**Purpose:** All bodies fall the same in vacuum.

**Controls:**
- Toggle: `air` on / off.
- Play / pause / reset.

**Visuals:**
- Two columns side-by-side. One drops a hammer, the other a feather.
- With air on: hammer falls quickly, feather drifts slowly (use a simple linear drag model, just for visual effect).
- With air off: both fall together, landing at the same time.
- Clock ticks as they fall.

### 4. `kinematics-graph-scene.tsx`

**Purpose:** Centerpiece. One x(t) contains everything.

**Controls:**
- Sliders: x₀ (initial position), v₀ (initial velocity), a (acceleration).
- Play / pause / reset for a running time cursor.

**Visuals:**
- Three stacked graphs: x(t), v(t), a(t), with shared t-axis. Time window 0 to 5 seconds.
- A ball on a horizontal 1D track above the graphs, position synced to x(t) at the current cursor.
- A vertical cursor line moving across all three graphs as time advances.
- Live readouts of current x, v, a.

## Aside terms and physicists

**Physicists in aside** (`TopicPageLayout aside` prop):
- `galileo-galilei` (already exists)
- `isaac-newton` (already exists)
- `nicole-oresme` — needs to be added. Medieval French scholar (c. 1320–1382). First person to graph a quantity against time — his *latitude of forms* diagrams are the geometric ancestor of v(t) plots. Short bio (one paragraph), tied to §6's "the graph is the physics" moment.

**Glossary terms to add** (via `mcp__physics-mcp__add_dictionary_term`):
- `velocity` — rate of change of position with respect to time; a vector in higher dimensions, a signed scalar in 1D.
- `acceleration` — rate of change of velocity; in free fall on Earth, roughly 9.81 m/s².
- `free-fall` — motion under gravity alone, with no air resistance or other forces.
- `kinematic-equations` — the three algebraic relations for motion under constant acceleration.
- `derivative` — the instantaneous rate of change of one quantity with respect to another; the slope of the tangent line.

## Execution sequence

This is the order of operations when implementation starts. It is also the hand-off to the `writing-plans` skill.

1. Add the Oresme physicist bio. Manual edit to `lib/content/physicists.ts` and locale message files — the MCP does not cover physicists yet (see `docs/mcp-gaps.md`).
2. Add the five glossary terms via `mcp__physics-mcp__add_dictionary_term`.
3. Build `inclined-plane-scene.tsx`.
4. Build `kinematics-graph-scene.tsx` (centerpiece; build early since §2 and §4 also reference it mentally).
5. Build `tangent-zoom-scene.tsx`.
6. Build `free-fall-scene.tsx`.
7. Register all four scenes in `components/physics/visualization-registry.tsx`.
8. Write the full `content.en.mdx` — seven sections, importing the four scenes and the existing layout components.
9. Call `mcp__physics-mcp__update_topic` to set `status: "live"`, `readingMinutes: 10`, and tweak subtitle if desired.
10. Manual smoke test in the dev server: `bun dev`, visit `/en/classical-mechanics/motion-in-a-straight-line`, verify all four scenes render and respond.
11. Run `bun run typecheck` and any lint/check commands the repo uses.
12. Optional Hebrew pass: `mcp__physics-mcp__get_terminology` for key terms → `mcp__physics-mcp__translate_topic` locale `he`.

## Out of scope

- Module-level changes. Module `kinematics-newton` already exists in `branches.ts`.
- Other FIG.02–FIG.04 topics. They remain `coming-soon`. No arc-wide cross-linking beyond §7's forward pointer.
- Hebrew translation is optional and deferred — not required for this spec to be called done.
- Any refactoring of existing oscillation topics or shared layout components.
- MCP improvements listed in `docs/mcp-gaps.md` — this spec works around the current MCP surface, not against it.

## Definition of done

- `app/[locale]/(topics)/classical-mechanics/motion-in-a-straight-line/content.en.mdx` replaces the skeleton with the full seven-section essay.
- Four new scene components exist, are registered in the visualization registry, and render without runtime errors in dev.
- Oresme bio and five glossary terms are in place and linked from the aside.
- Topic status is `live`, readingMinutes is 10.
- Typecheck passes; dev server renders the page end-to-end with no console errors.
