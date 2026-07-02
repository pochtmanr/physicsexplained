# Gas Chamber Playground — Design Spec

**Date:** 2026-07-02
**Status:** Draft (awaiting user review before plan-writing)
**Scope:** Second interactive playground for `/play`: a kinetic-theory gas sandbox. Builds on the framework from `2026-04-30-interactive-playgrounds-design.md` and assumes the registry-driven-loader cleanup from `2026-07-02-orbital-mechanics-improvements-design.md` §6 has landed (adding this playground then touches no framework code).

---

## 1. Choosing the second playground

Candidates considered (first four were reserved by the 2026-04-30 spec §13):

| idea | pull | why not now |
|------|------|-------------|
| **Pendulum Lab** (single/double/driven) | double-pendulum chaos is shareable; simple `params` URL | weaker tie to recently shipped content |
| **Wave Interference** (double slit) | visually striking; optics tie-in | optics content thinner than thermo right now |
| **Charges & Fields** | EM branch tie-in | field-line rendering is the hard part; less "toy-like" |
| **Time Dilation** | conceptually unique | low interactivity ceiling — one slider |
| Collision Lab / billiards | momentum teaching | overlaps orbital playground's collision code |
| Projectile / cannon game | game-like | thin physics; less on-brand |
| **Gas Chamber** ✅ | — | — |

**Why Gas Chamber wins:** the thermodynamics kinetic-theory module just shipped (Maxwell–Boltzmann, pressure from molecular collisions, equipartition, Brownian motion — commits 5948fe8…70acb07). A gas sandbox is the playground those four essays are begging to deep-link to, the shared physics toolkit already exists (`lib/physics/thermodynamics/random.ts` even exports `maxwellVelocity2D`), and emergent behavior (mixing, equilibration, Brownian jitter) gives it the same "poke it and watch" virality as the orbital sandbox.

---

## 2. Concept

A 2D box of hard-disk particles in elastic collision — a live kinetic-theory laboratory. The user changes macroscopic knobs (temperature, volume, particle count, species mix) and watches microscopic behavior produce macroscopic law: the Maxwell–Boltzmann speed distribution emerging in a live histogram, pressure rising as the piston compresses, two gases mixing irreversibly, a giant dust grain doing a Brownian walk.

Route: `/play/gas-chamber`. Slug `gas-chamber`, sceneId `GasChamberPlayground`, `beta: true` at launch.

### 2.1 Simulation contents

- **Particles**: hard disks, mass `m`, radius ∝ √m, specular elastic wall bounces, elastic disk–disk collisions. Up to two species (light/heavy) with distinct colors.
- **Chamber**: rectangle filling the canvas; the right wall is a **piston** the user can drag (or animate) to change volume.
- **Thermostat**: wall-rescaling — when target temperature changes, wall bounces rescale outgoing speed toward the target thermal speed over a few collisions (gradual, watchable equilibration rather than an instant velocity rewrite).
- **Measurements**: live speed histogram with the analytic 2D Maxwell–Boltzmann (Rayleigh) curve overlaid per species; pressure readout from time-averaged wall momentum transfer; temperature readout from mean kinetic energy.

### 2.2 Controls

| control | range | notes |
|---------|-------|-------|
| play/pause, reset | — | same chrome as orbital |
| particle count N | 10 – 300 | slider; resample on change |
| temperature T | 0.1 – 10 (arb. units) | slider; drives thermostat |
| volume / piston | 30 – 100 % of full width | slider **and** direct piston drag |
| species mix | 1 gas / 50-50 light+heavy / Brownian | segmented control |
| histogram | on/off | overlay panel, per-species curves |
| speed | 0.25× – 4× | sim-time multiplier |

Canvas gestures: drag the piston edge; tap to inject a small local "heat pulse" (speed kick to nearby particles — cheap, delightful, teaches local→global equilibration). Pinch-zoom/pan are **not** needed — the chamber always fits the viewport (a real simplification vs orbital).

### 2.3 Presets

| id | setup | teaches / links to |
|----|-------|--------------------|
| `single-gas` | one species at T=1 | Maxwell–Boltzmann emerges from chaos → *the-maxwell-boltzmann-distribution* |
| `two-temperatures` | left half hot, right half cold, divider removed at t=0 | equilibration, irreversibility |
| `light-and-heavy` | 50-50 mix, m and 4m at same T | equipartition: same ⟨E⟩, different ⟨v⟩ → *equipartition-and-degrees-of-freedom* |
| `brownian` | one giant disk (m ≈ 100) among 200 light particles, its trail drawn | random walk → *brownian-motion* |
| `compression` | single gas, piston animating slowly inward | P–V relation → *pressure-from-molecular-collisions* |

---

## 3. State & URL model

`urlMode: "params"` — the fundamental difference from orbital. Particle micro-state (up to 300 × 5 numbers) is neither shareable nor meaningful; what defines a scenario is the **macro-state plus a seed**. Sharing a link reproduces the exact same run because initialization is seeded and the integrator is fixed-step deterministic.

Zod schema (shape, defaults illustrative):

```ts
const gasChamberSchema = z.object({
  preset: z.enum([...PRESET_IDS, "custom"]).default("single-gas"),
  n: z.number().int().min(10).max(300).default(120),
  t: z.number().min(0.1).max(10).default(1),
  volume: z.number().min(0.3).max(1).default(1),
  mix: z.enum(["single", "duo", "brownian"]).default("single"),
  histogram: z.boolean().default(true),
  speed: z.number().min(0.25).max(4).default(1),
  seed: z.number().int().default(42),
});
```

URL example: `/play/gas-chamber?preset=brownian&n=200&t=1.5&seed=7`. Any manual knob change promotes `preset` to `custom` (same atomic-promotion pattern as orbital's `index.tsx:44-50`).

---

## 4. Physics & performance

- **Module**: new pure solver `lib/physics/gas.ts` (no DOM deps, mirroring `lib/physics/n-body.ts`): `createGas(params, rng)`, `stepGas(state, dt)`, returning wall-impulse totals for the pressure readout.
- **Fixed timestep from day one**: the accumulator pattern from the orbital improvements spec §4.1 — never a frame-dt-dependent step. Deterministic given `seed`.
- **Initialization**: positions via rejection-sampled non-overlapping placement, velocities via `maxwellVelocity2D(rng, sigma)` from `lib/physics/thermodynamics/random.ts` (`mulberry32(seed)` stream). Both helpers exist and are already unit-tested (`tests/physics/thermodynamics/random.test.ts`).
- **Collision detection**: uniform-grid broad phase (cell ≈ max particle diameter) — O(N) per step; at N = 300 this is a few thousand pair checks per substep, comfortably under budget. Naive O(N²) is acceptable behind the grid as a first cut only if profiling says so; the grid is simple enough to build immediately.
- **Pressure measurement**: accumulate |Δp| of wall bounces over a rolling ~1 s window; P = impulse / (time × wall length). Noisy at small N — display smoothed.
- **Histogram**: 24 speed bins recomputed every ~5 frames into a plain array ref; drawn in the same canvas pass (no React state churn).
- **Rendering**: single 2D canvas via the existing `useAnimationFrame` + `prepareCanvas` (with the DPR cap from the improvements spec). 300 filled circles/frame is well within 2D-canvas budget; batch by species color to two paths.
- **Reduced motion**: respect `useReducedMotion()` — freeze sim, render one static frame (same convention as orbital `n-body-canvas.tsx:335`).

---

## 5. Registration & integration (per framework convention)

All additive; zero framework edits once the registry-driven loader has landed:

1. `components/playgrounds/gas-chamber/` — `index.tsx`, `schema.ts`, `presets.ts`, `gas-canvas.tsx`, `controls.tsx`, `histogram.ts`, `draw.ts`, `info-panel.tsx` (mirror the orbital file layout).
2. `lib/physics/gas.ts` — pure solver.
3. Register in `app/[locale]/play/_components/playground-meta.ts`: `{ slug: "gas-chamber", sceneId: "GasChamberPlayground", urlMode: "params", schema: gasChamberSchema, beta: true, loader: () => import("@/components/playgrounds/gas-chamber") }`.
4. `lib/ask/scene-catalog.ts` entry — same `gasChamberSchema` import (catalog and playground can't drift), tags `["thermodynamics", "playground"]`, `topicSlugs` → the four kinetic-theory essay slugs.
5. `lib/content/simulation-registry.ts` — `GasChamberPlayground: lazyScene(...)` so `/ask` can render it inline.
6. i18n: `gas-chamber.*` blocks in `messages/en/play.json` + `messages/he/play.json` (`title`, `indexCardDescription`, `aiPrompt`, `info.*`, `presets.*`, `presetsInfo.*`, control labels). Hebrew written by hand (standing rule: no machine translation).
7. OG image: `[slug]/opengraph-image.tsx` already renders per-slug; add gas-chamber art params.
8. **Content cross-links**: "Open in playground" links from the four kinetic-theory essays to matching presets (e.g. Brownian essay → `/play/gas-chamber?preset=brownian`) — the payoff that makes this playground the right choice.

---

## 6. Out of scope / stretch

- Entropy counter (coarse-grained cell-occupancy estimate) for the mixing preset.
- Adiabatic vs isothermal piston modes; PV-diagram trace during compression.
- Maxwell's demon mini-game (divider with a user-controlled gate).
- 3D, inter-particle attraction (van der Waals), phase transitions.

---

## 7. Testing & verification

Under `tests/` (Vitest include glob only picks up `tests/**` — see improvements spec §8):

- `tests/physics/gas.test.ts`: energy conservation with thermostat off (drift < ε over 10⁴ steps); momentum conservation in disk–disk collisions; determinism (same seed + params ⇒ identical state after N steps); no wall escapes at max speed × max dt; grid broad phase finds the same collision pairs as the naive O(N²) check on random configurations.
- Statistical: after equilibration at fixed T, binned speed distribution fits the 2D Maxwell–Boltzmann (Rayleigh) curve within tolerance (seeded, so the assertion is stable); measured pressure tracks `NT/V` scaling across a few (N, T, V) points.
- Schema/URL round-trip tests (params mode) + scene-catalog contract test extension (id ↔ registry consistency, existing pattern in `tests/ask/scene-catalog-contract.test.ts`).
- Manual: mobile touch pass (piston drag, heat-pulse tap), reduced-motion pass, `?debug=1` HUD check on a Windows machine (regression guard for the cross-platform lessons of the orbital playground).
