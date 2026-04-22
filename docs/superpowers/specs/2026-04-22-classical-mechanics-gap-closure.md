# Classical Mechanics — Gap-Closure Topics Design

**Date:** 2026-04-22
**Status:** proposed
**Repo:** `/Users/romanpochtman/Developer/physics`
**Supabase project:** `cpcgkkedcfbnlfpzutrc` (`physics.explained`, eu-west-1)

## Goal

Close the four pedagogical gaps in the CLASSICAL MECHANICS branch that a physicist would flag as missing from an otherwise textbook-complete curriculum: **circular motion**, **non-inertial reference frames**, **rolling motion**, and **damped & driven oscillations**. Ship all four at the same Distill.pub-style quality as existing topics (bespoke visualizations, period-correct historical hooks, strong prose voice).

## Scope

**In scope**
- 4 new topics, each in the existing topic shell (`page.tsx` + `content.en.mdx`, `TopicPageLayout`, `TopicHeader`, numbered `Section`s, `SceneCard`s, `EquationBlock`s, `Callout`s).
- 4 new `lib/physics/*.ts` modules (one per topic) — pure TS, no React, testable.
- ~14 new `components/physics/*-scene.tsx` visualization components (3–4 per topic, matching existing density). Each registered in `visualization-registry.tsx`.
- Renumber FIG identifiers in `lib/content/branches.ts` so the branch stays pedagogically ordered (31 → 35 topics).
- Add **1 new physicist**: `gaspard-gustave-de-coriolis` (no other missing physicists for these topics — Newton, Huygens, Galileo, Euler, d'Alembert, Mach, Tesla, Rayleigh all exist).
- Add **~6 new glossary terms**: `angular-velocity`, `centrifugal-force`, `coriolis-force`, `forced-oscillation`, `amplitude-response`, `moment-arm` (check existing — if any already present, skip). Existing terms to reuse: `inertial-frame`, `centripetal-force`, `rolling-without-slipping`, `damping`, `q-factor`, `resonance`.
- Remove `DampedPendulumScene` and `ResonanceCurveScene` usage from `oscillators-everywhere/content.en.mdx` (they become exclusive to the new damped-and-driven topic).
- Run `pnpm content:publish` to push English rows into Supabase.
- Hebrew `content.he.mdx` files: **stubbed only** (placeholder with "Translation pending"), or deferred entirely — pipeline fallback handles missing locales.

**Out of scope**
- Hebrew translations of the new 4 topics (deferred — user explicit).
- Retroactive improvements to existing topics.
- New branches (Electromagnetism, Thermodynamics, etc).
- Mobile client considerations beyond Supabase pipeline already doing its job.
- Tests beyond what matches existing conventions (physics-lib unit tests where correctness is non-trivial).

## Topic specs

### 1. Circular Motion (FIG.04 · KINEMATICS & NEWTON)

**Slug:** `circular-motion`
**Subtitle:** "Why the string always pulls inward — and why the Moon never stops falling."
**Reading time:** 11 min
**Target:** ~900–1100 words, 4 equations, 4 figures

**Sections:**
1. **The puzzle** — Ball on a string, satellite around Earth. Newton I says straight-line motion; circular motion therefore requires a force. No math.
2. **Centripetal acceleration** — FIG.01 + EQ.01 (a = v²/r), EQ.02 (a = ω²r). Derive geometrically from the velocity vector triangle.
3. **The force that pulls inward** — FIG.02 force-diagram for three cases (string, gravity, friction on car), EQ.03 (F = mv²/r). Introduce idea that centripetal is a role, not a type of force.
4. **Angular velocity and period** — FIG.03 + EQ.04 (ω = 2π/T, v = ωr). Connect to wheels, gears, orbits.
5. **The Moon is falling** — FIG.04 Newton's cannon thought experiment. Same v²/r that keeps a car on a curve keeps the Moon in orbit.
6. **Where it matters** — centrifuges, banked turns, particle accelerators, GPS orbits.

**Figures (components):**
- `VelocityTriangleScene` — rotating radius + velocity vectors, showing Δv always points toward center (classic intro-physics diagram, animated).
- `CentripetalForceScene` — three stacked rows: ball-on-string, satellite, car-on-curve. Each shows the actual force providing centripetal role in a different color; readout shows F = mv²/r.
- `AngularVelocityScene` — wheel/disc with radius r and point on rim; side panel shows v and ω synchronized, HUD with current values.
- `NewtonsCannonScene` — Canvas 2D. Cannon on mountain-top, slider for muzzle velocity. Below orbital velocity → projectile hits ground. At orbital velocity → closed circle. Above → ellipse.

**Aside links:** Newton, Huygens (who first wrote F = mv²/r, 1673), Galileo. Terms: centripetal-force (existing), angular-velocity (NEW), inertial-frame (existing).

**Physics lib:** `lib/physics/circular-motion.ts` — `centripetalAccel(v, r)`, `angularFromPeriod(T)`, `orbitalVelocity(r, GM)`. Small file (~40 lines), pure functions.

### 2. Friction and Drag (FIG.05) — **existing, unchanged**

### 3. Non-Inertial Reference Frames (FIG.06 · KINEMATICS & NEWTON)

**Slug:** `non-inertial-frames`
**Subtitle:** "Why a carousel feels like a force — and why the wind turns right in the northern hemisphere."
**Reading time:** 13 min
**Target:** ~1100–1300 words, 4 equations, 4 figures

**Sections:**
1. **The trouble with rotating rooms** — Coin sliding on a spinning turntable. From outside: straight line. From inside: curved path "as if" a force pushed it. No math.
2. **Fictitious forces** — EQ.01 (a_inertial = a_rotating + 2Ω×v + Ω×(Ω×r)). Introduce centrifugal and Coriolis as accounting terms, not real forces.
3. **Centrifugal** — FIG.01 carousel. Riders feel thrown outward; derivation of Ω²r magnitude. Ties back to "centripetal is the real force".
4. **Coriolis** — FIG.02 ball rolled across spinning turntable, traced in both frames. EQ.02 (F_C = -2m Ω×v).
5. **The planet as a rotating frame** — FIG.03 Earth with winds curving right (N) / left (S). Trade winds, hurricanes, Foucault pendulum rotation rate (EQ.03 sin(latitude)·Ω_Earth).
6. **Where it breaks** — FIG.04 side-by-side projectile in lab frame vs. rotating frame. Newton's laws in the rotating frame work *if* you include the fictitious forces; without them, the math lies.
7. **Why it matters** — atmospheric science, ballistics, rotating space stations.

**Figures:**
- `CarouselScene` — Top-down turntable with rider. Toggle "rider's view" vs "outside view". In rider's view, ball appears to curve.
- `CoriolisTurntableScene` — Ball launched across rotating table from center outward. Trails in both frames, synchronized.
- `CoriolisGlobeScene` — 2D polar projection of Earth with wind arrows + Foucault rotation period readout by latitude.
- `RotatingProjectileScene` — Projectile launched with same initial conditions; inertial-frame trajectory (parabola) vs. rotating-frame trajectory (spiral).

**Aside links:** Coriolis (NEW physicist), Foucault (existing), d'Alembert (existing, gave fictitious-force framework). Terms: inertial-frame (existing), centrifugal-force (NEW), coriolis-force (NEW).

**Physics lib:** `lib/physics/rotating-frame.ts` — `coriolisAccel(omega, v)`, `centrifugalAccel(omega, r)`, `foucaultRotationPeriod(latitude)`. Small file.

### 4. Rolling Motion (FIG.13 · ROTATION & RIGID BODIES)

**Slug:** `rolling-motion`
**Subtitle:** "What a wheel does that a puck can't — and why a hollow cylinder loses every race."
**Reading time:** 12 min
**Target:** ~1000–1200 words, 4 equations, 4 figures

**Sections:**
1. **The constraint** — Rolling without slipping: v = ωR. Intuition (the bottom point is momentarily stationary). No math beyond the relation.
2. **Rolling as translation + rotation** — FIG.01 wheel decomposition. Top of wheel moves at 2v, bottom at 0. Cycloid path of a point on the rim.
3. **Kinetic energy of a rolling body** — EQ.01 (KE = ½mv² + ½Iω²), with v = ωR substituted to give EQ.02 (KE = ½(1 + I/mR²)mv²). The prefactor depends on shape.
4. **The race down the incline** — FIG.02 hollow cylinder vs. solid cylinder vs. sphere. All same mass, same radius, same height. Solid sphere wins; hollow cylinder loses. EQ.03 (a = g sin θ / (1 + I/mR²)).
5. **When rolling fails** — FIG.03 slipping regime. Static friction provides the torque; if required μ_s exceeds what's available, the body slides. EQ.04 (static friction required ≤ μ_s mg cos θ).
6. **Where it matters** — bowling, cycling up hills, why tank treads exist, why car tires are round and not just wide.

**Figures:**
- `WheelDecompositionScene` — Rolling wheel with cycloidal trace of rim point. Side panel shows velocity vectors at top (2v), center (v), bottom (0).
- `RollingRaceScene` — Inclined plane, three objects start together. Animation; graph below plots position vs time with their theoretical curves.
- `RollingSlippingScene` — Inclined plane at adjustable angle. Red when slipping, cyan when rolling cleanly. Shows μ_s required vs. available.
- `CoinRollingScene` — Small bonus: coin rolling in a circle (precession) — foreshadows gyroscopes topic.

**Aside links:** Newton, Euler (rotational dynamics), Archimedes (center of mass). Terms: rolling-without-slipping (existing), moment-of-inertia is a topic not a term, moment-arm (NEW if missing).

**Physics lib:** `lib/physics/rolling.ts` — `rollingKE(m, I, v, R)`, `inclineAcceleration(shapeFactor, theta)` with shape presets (solid sphere = 2/5, solid cylinder = 1/2, hollow cylinder = 1, hollow sphere = 2/3).

### 5. Damped & Driven Oscillations (FIG.19 · OSCILLATIONS)

**Slug:** `damped-and-driven-oscillations`
**Subtitle:** "Why every real oscillator dies — and why, if you push it just right, it tries to kill you back."
**Reading time:** 13 min
**Target:** ~1100–1300 words, 4 equations, 4 figures

**Sections:**
1. **The ideal ends** — Review: SHM is `x'' + ω²x = 0`, oscillates forever. Real pendulums stop. Why?
2. **Damping** — EQ.01 (x'' + γx' + ω₀²x = 0). Three regimes (underdamped, critically, overdamped). FIG.01 triptych of the three solutions.
3. **Quality factor** — FIG.02 + EQ.02 (Q = ω₀/γ). Amplitude envelope decays as e^(-γt/2); number of oscillations before amplitude drops by 1/e ≈ Q/π. Examples: pendulum clock Q~100, tuning fork Q~1000, quartz crystal Q~10⁴, LIGO mirror Q~10⁸.
4. **Driving force** — EQ.03 (x'' + γx' + ω₀²x = F₀cos(ωt)). Transient + steady state.
5. **Resonance** — FIG.03 resonance curve: amplitude vs drive frequency for several Q values. Peak at ω ≈ ω₀, height ~ F₀·Q/ω₀². EQ.04 (steady-state amplitude formula).
6. **The Tacoma Narrows story** — FIG.04 wind-driven bridge, feedback loop reaching destructive resonance. Aeroelastic flutter is the actual mechanism (more subtle than pure forced resonance — honest note).
7. **Where it matters** — musical instruments, MRI, radio tuning, atomic clocks, gravitational-wave detectors.

**Figures:**
- `DampedRegimesScene` — Three side-by-side panels: underdamped (oscillating envelope), critical (fastest return, no overshoot), overdamped (slow exponential).
- `QualityFactorScene` — Single oscillator with Q slider (1 → 10000 log scale). HUD shows `Q`, number of oscillations to 1/e.
- `ResonanceCurveScene` — **MOVE existing** from oscillators-everywhere. Amplitude vs drive frequency, multiple Q curves.
- `DampedPendulumScene` — **MOVE existing** from oscillators-everywhere. Driven pendulum with adjustable drive frequency and Q.

**Aside links:** Rayleigh (wrote *Theory of Sound*, defined Q), Tacoma engineer Farquharson (skip — not central), Hooke (restoring force). Terms: damping (existing), q-factor (existing), resonance (existing), forced-oscillation (NEW), amplitude-response (NEW).

**Physics lib:** Already exists — `lib/physics/damped-oscillator.ts`. Verify it exports everything needed; extend if any section needs something the existing file doesn't have (likely fine as-is).

## FIG renumbering in branches.ts

Final branch order (35 topics):

| FIG | Module | Topic |
|-----|--------|-------|
| 01 | Kinematics & Newton | Motion in a Straight Line |
| 02 | Kinematics & Newton | Vectors and Projectile Motion |
| 03 | Kinematics & Newton | Newton's Three Laws |
| **04** | Kinematics & Newton | **Circular Motion** NEW |
| 05 | Kinematics & Newton | Friction and Drag |
| **06** | Kinematics & Newton | **Non-Inertial Frames** NEW |
| 07 | Conservation Laws | Energy and Work |
| 08 | Conservation Laws | Momentum and Collisions |
| 09 | Conservation Laws | Angular Momentum |
| 10 | Conservation Laws | Noether's Theorem |
| 11 | Rotation & Rigid Bodies | Torque and Rotational Dynamics |
| 12 | Rotation & Rigid Bodies | Moment of Inertia |
| **13** | Rotation & Rigid Bodies | **Rolling Motion** NEW |
| 14 | Rotation & Rigid Bodies | Gyroscopes and Precession |
| 15 | Rotation & Rigid Bodies | The Wobbling Earth |
| 16 | Oscillations | The Simple Pendulum |
| 17 | Oscillations | Beyond Small Angles |
| 18 | Oscillations | Oscillators Everywhere |
| **19** | Oscillations | **Damped & Driven Oscillations** NEW |
| 20 | Waves | The Wave Equation |
| 21 | Waves | Standing Waves and Modes |
| 22 | Waves | Doppler and Shock Waves |
| 23 | Waves | Dispersion and Group Velocity |
| 24 | Orbital Mechanics | The Laws of Planets |
| 25 | Orbital Mechanics | Universal Gravitation |
| 26 | Orbital Mechanics | Energy in Orbit |
| 27 | Orbital Mechanics | Tides and the Three-Body Problem |
| 28 | Fluids | Pressure and Buoyancy |
| 29 | Fluids | Bernoulli's Principle |
| 30 | Fluids | Viscosity and Reynolds Number |
| 31 | Fluids | Turbulence |
| 32 | Lagrangian & Hamiltonian | The Principle of Least Action |
| 33 | Lagrangian & Hamiltonian | The Lagrangian |
| 34 | Lagrangian & Hamiltonian | The Hamiltonian |
| 35 | Lagrangian & Hamiltonian | Phase Space |

## Build sequence (5 waves)

Engineered so subagents can work in parallel where possible.

**Wave 1 — Data layer** (single agent, serial)
- Edit `lib/content/branches.ts`: insert 4 new `Topic` entries at correct positions, renumber FIG in `eyebrow` fields for shifted topics.
- Edit `lib/content/physicists.ts`: add `gaspard-gustave-de-coriolis` entry.
- Edit `lib/content/glossary.ts`: add 5–6 new terms if not already present (verify first).
- Run `pnpm tsc --noEmit` + existing `tests/content/references.test.ts`. Must be clean.

**Wave 2 — Physics libs** (1 agent per topic, parallel)
- `lib/physics/circular-motion.ts`
- `lib/physics/rotating-frame.ts`
- `lib/physics/rolling.ts`
- `lib/physics/damped-oscillator.ts` — verify-only, extend if needed
- Small unit tests in `tests/physics/` for non-trivial formulas (incline acceleration with shape factors, Coriolis vector calc, resonance peak location).

**Wave 3 — Visualization components** (1 agent per topic, parallel)
Each agent creates the 3–4 scene components for its topic, following existing scene patterns (Canvas 2D, cyan/magenta palette, mono HUD, `SceneCard` wrapper). Each scene imports from its topic's physics lib. Register all new components in `visualization-registry.tsx`.

**Wave 4 — Topic pages & content** (1 agent per topic, parallel)
Each agent creates:
- `app/[locale]/(topics)/classical-mechanics/<slug>/page.tsx` (copy shell from `oscillators-everywhere/page.tsx`, change slug).
- `app/[locale]/(topics)/classical-mechanics/<slug>/content.en.mdx` (full prose per section spec above).
- Optionally empty/placeholder `content.he.mdx` — or omit (fallback handles it).

Also edit `oscillators-everywhere/content.en.mdx`: remove `DampedPendulumScene` + `ResonanceCurveScene` usage and any surrounding prose that was building up to them (last 1–2 sections of that file). Retune the topic's ending.

**Wave 5 — Publish & verify** (single agent)
- `pnpm tsc --noEmit`
- `pnpm vitest run`
- `pnpm content:publish --dry-run` — inspect diff
- `pnpm content:publish` — push new rows to Supabase
- `pnpm build` local smoke test
- Visit `/en/classical-mechanics/circular-motion` and peers in dev server, spot-check figures render.
- Verify removed scenes no longer appear in `/en/classical-mechanics/oscillators-everywhere`.

## Risks & mitigations

- **FIG renumbering collision**: branches.ts is a single ordered array; careful insertion matters. Mitigation: do it in Wave 1 with tsc + tests before any downstream work.
- **Scene component complexity**: animated canvas scenes can bloat. Mitigation: follow existing size patterns (~150–250 lines each, 60fps RAF with cleanup); each subagent reviews a sibling component before writing.
- **Content pipeline dry-run**: `publish.ts` has `--dry-run`; always use it before live publish. Mitigation: Wave 5 runs dry-run first.
- **Prose quality drift across 4 subagents**: each agent gets the same voice brief ("Kurzgesagt meets Stripe docs — no calculus assumed but shown; period-correct hook each section"). Mitigation: pass this spec as context to every Wave 4 agent.
- **Hebrew gap**: `content.he.mdx` absent on these 4 topics; fallback in `fetch.ts` returns English with `localeFallback: true` already. Mitigation: UI already shows "Translation pending" banner. No regression.

## Success criteria

- 4 new topics render at `/en/classical-mechanics/<slug>` with all figures interactive.
- FIG numbers sequential 01–35 across the branch.
- `oscillators-everywhere` no longer shows damped or resonance scenes.
- `pnpm tsc --noEmit` clean; `pnpm vitest run` all pass.
- Supabase `content_entries` table has 4 new `en` rows after publish.
- Home page, branch index `/en/classical-mechanics`, and prev/next navigation all show new topics in correct positions.
- CLASSICAL MECHANICS branch is 100% complete by a physicist's standard for intro-to-intermediate curriculum.
