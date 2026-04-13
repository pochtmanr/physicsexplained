# Pendulum Modules — Design Spec

**Date:** 2026-04-13
**Scope:** Restructure Classical Mechanics pendulum content from 1 topic to 3 modules; add module grouping to data model; build 11 new interactive components; write 2 new MDX articles + refactor 1 existing.

---

## 1. Data Model Changes

### 1.1 New `Module` concept in types.ts

```typescript
interface Module {
  slug: string;        // "oscillations"
  title: string;       // "Oscillations"
  index: number;       // 1
}
```

Add `module` field to existing `Topic` interface:

```typescript
interface Topic {
  slug: string;
  title: string;
  eyebrow: string;
  subtitle: string;
  readingMinutes: number;
  status: TopicStatus;
  module: string;       // NEW — references Module.slug
}
```

### 1.2 Branch definition in branches.ts

Add `modules` array to `Branch` interface. Each branch declares its modules, and each topic references one.

```typescript
interface Branch {
  // ...existing fields
  modules: readonly Module[];
  topics: readonly Topic[];
}
```

Classical Mechanics gets two modules initially:

| Module | Slug | Index |
|--------|------|-------|
| Oscillations | `oscillations` | 1 |
| Orbital Mechanics | `orbital-mechanics` | 2 |

### 1.3 Topic definitions update

| FIG | Slug | Title | Module | Status | Read min |
|-----|------|-------|--------|--------|----------|
| FIG.01 | `the-simple-pendulum` | THE SIMPLE PENDULUM | oscillations | live | 10 |
| FIG.02 | `beyond-small-angles` | BEYOND SMALL ANGLES | oscillations | live | 12 |
| FIG.03 | `oscillators-everywhere` | OSCILLATORS EVERYWHERE | oscillations | live | 12 |
| FIG.04 | `kepler` | THE LAWS OF PLANETS | orbital-mechanics | live | 6 |

Note: existing `pendulum` slug changes to `the-simple-pendulum`. Existing `kepler` slug stays. Kepler content unchanged in this round.

### 1.4 Branch page rendering

The branch page (`/[locale]/classical-mechanics/page.tsx`) groups topic cards by module:

```
Module 1: Oscillations
  [FIG.01 card] [FIG.02 card] [FIG.03 card]

Module 2: Orbital Mechanics
  [FIG.04 card]
```

Module title renders as a section heading. No new routes for modules.

---

## 2. Content — FIG.01: The Simple Pendulum

**File:** `app/[locale]/(topics)/classical-mechanics/the-simple-pendulum/page.mdx`
**Reading time:** ~10 min
**Refactored from:** existing `pendulum/page.mdx` (~80% reused, refined + expanded)

### Sections

| # | Title | Content | Visualization |
|---|-------|---------|---------------|
| 1 | The question | Galileo 1583, Pisa cathedral chandelier. Observes lamp swinging — times it against his pulse. Period stays constant regardless of amplitude. This is isochronism. | Existing `PendulumScene` (theta0=0.3, length=1.2) |
| 2 | The restoring force | Gravity pulls the bob back toward equilibrium. The tangential component is F = -mg sin theta. For small angles, sin theta ~ theta, so F = -mg(theta) = -kx. Linear restoring force. | Existing `RestoringForceScene` (promoted from glossary) |
| 3 | The small-angle trick | Taylor series: sin theta = theta - theta^3/6 + ... When theta is small, dropping higher terms gives sin theta ~ theta. Quantify: at 5 deg error is 0.1%, at 15 deg error is 1%, at 30 deg error is 4.5%. This simplification turns the nonlinear problem into a solvable one. | NEW `SmallAngleScene` — overlays sin(theta) and theta on same axes, slider to highlight divergence |
| 4 | The rhythm | From F = -kx with k = mg/L, solve the ODE to get x(t) = A cos(omega*t). Period T = 2*pi*sqrt(L/g). Depends only on length and gravity. Not mass, not amplitude. | Existing `IsochronismScene` (promoted from glossary) — 3 pendulums, different mass/amplitude, same period |
| 5 | The clock | Huygens 1656: first pendulum clock. Isochronism makes it possible — small disturbances don't change the tick rate. But Huygens realized perfect isochronism needs a cycloid, not a circle. He added cycloidal cheeks to constrain the string. The tautochrone property: time to reach bottom is independent of starting point on a cycloid. | NEW `CycloidScene` — rolling circle generates cycloid, shows ball sliding to bottom in equal time from any start |
| 6 | The shape of motion | Plot position vs velocity at each instant: you get an ellipse in phase space. One complete orbit = one full swing. Clockwise traversal. The ellipse closes because no energy is lost. | Existing `PhasePortrait` (theta0=0.3, length=1.2) |
| 7 | Measuring gravity | The pendulum as a precision instrument. Measure period T with a stopwatch, know length L, compute g = 4*pi^2*L/T^2. Bouguer (1735) carried pendulums to the Andes and found g was smaller near mountains — first evidence that gravity varies with local mass distribution. | Existing `PendulumScene` with showTimer=true |
| 8 | What comes next | The small-angle approximation made everything clean. But what happens when we push harder — when angles grow large and sin theta != theta? The pendulum reveals something deeper. Link to FIG.02. | Text only |

### Physicists referenced
- Galileo Galilei (existing)
- Christiaan Huygens (existing)
- Pierre Bouguer (NEW — needs entry in physicists.ts)

### Glossary terms
- Existing: isochronism, restoring-force, phase-portrait, simple-harmonic-oscillator, pendulum-clock
- NEW: tautochrone, cycloid

---

## 3. Content — FIG.02: Beyond Small Angles

**File:** `app/[locale]/(topics)/classical-mechanics/beyond-small-angles/page.mdx`
**Reading time:** ~12 min
**Entirely new content.**

### Sections

| # | Title | Content | Visualization |
|---|-------|---------|---------------|
| 1 | Where the trick fails | Return to sin theta = theta - theta^3/6 + theta^5/120 - ... At 30 deg the cubic term is 4.5% of the linear. At 90 deg, sin(pi/2) = 1 but pi/2 = 1.571 — a 57% error. The small-angle world is a tiny neighborhood around equilibrium. | NEW `TaylorExpansionScene` — animate adding Taylor terms one by one, see approximation improve |
| 2 | The real equation | theta'' = -(g/L) sin theta. Nonlinear ODE. No closed-form solution in elementary functions. Must use either numerical integration (Euler, RK4) or elliptic integrals. Compare trajectories: small-angle solution vs exact, diverge visibly after a few cycles. | Existing two `PendulumScene` instances: exact=false (10 deg) vs exact=true (80 deg), side by side |
| 3 | Energy tells the story | Kinetic energy T = (1/2)mL^2 * theta_dot^2. Potential energy U = mgL(1 - cos theta). Total E = T + U is conserved (no friction). This is more powerful than the force equation — one scalar equation governs all motion. | NEW `EnergyDiagramScene` — potential well U(theta) = mgL(1-cos theta), horizontal line for total energy E, animated ball rolling in the well |
| 4 | The potential well | U(theta) is a cosine bowl. Near the bottom (small theta), it looks parabolic — that's the harmonic approximation. But the walls flatten out and repeat every 2*pi. If E < 2mgL, the ball is trapped (oscillation). If E > 2mgL, the ball rolls over the top (continuous rotation). If E = 2mgL exactly, the ball asymptotically approaches the top — this is the separatrix. | Same `EnergyDiagramScene` with draggable energy level |
| 5 | The full phase portrait | Plot theta vs theta_dot for many initial conditions. Low energy: small ellipses near origin (libration). Higher energy: larger distorted loops. E = 2mgL: the separatrix — a figure-eight through (+-pi, 0). Above separatrix: wavy bands (rotation). | NEW `SeparatrixScene` — full phase portrait with colored trajectory families + highlighted separatrix curve |
| 6 | The exact period | T(theta_0) = 4*sqrt(L/g) * K(sin(theta_0/2)) where K is the complete elliptic integral of the first kind. As theta_0 -> 0, K -> pi/2, recovering T_0 = 2*pi*sqrt(L/g). As theta_0 -> pi, K -> infinity — period diverges. Table: T/T_0 at 15, 30, 45, 60, 90, 120, 150, 170 degrees. | NEW `PeriodVsAmplitudeScene` — plot T(theta_0)/T_0 from 0 to ~179 deg, log scale near 180 |
| 7 | Why nonlinearity matters | Almost everything in nature is nonlinear. Linearity is the approximation, not the reality. Double pendulum: deterministic chaos. Solitons: nonlinear waves that don't disperse. General relativity: gravity is nonlinear. The pendulum is the simplest system that teaches you to respect the full equation. | Text + teaser to FIG.03: but even the linear oscillator has more to teach when you add the real world — friction and driving forces. |

### Physicists referenced
- Adrien-Marie Legendre (NEW — elliptic integrals)
- Carl Gustav Jacob Jacobi (NEW — elliptic functions)

### Glossary terms
- NEW: elliptic-integral, separatrix, libration, nonlinear-dynamics, potential-well

---

## 4. Content — FIG.03: Oscillators Everywhere

**File:** `app/[locale]/(topics)/classical-mechanics/oscillators-everywhere/page.mdx`
**Reading time:** ~12 min
**Entirely new content.**

### Sections

| # | Title | Content | Visualization |
|---|-------|---------|---------------|
| 1 | The universal pattern | x'' = -omega^2 * x has the same solution whether x is the angle of a pendulum, the displacement of a spring, the charge on a capacitor, or the position of an atom in a crystal lattice. SHM is the most universal equation in physics. Show three systems side by side, all producing the same sinusoid. | NEW `UniversalOscillatorScene` — toggle pendulum / spring / LC circuit, all producing same x(t) plot |
| 2 | Damped oscillations | Real systems lose energy. Add friction proportional to velocity: x'' + gamma*x' + omega_0^2*x = 0. Solution: x(t) = A*e^(-gamma*t/2)*cos(omega_d*t + phi) where omega_d = sqrt(omega_0^2 - gamma^2/4). Three regimes: underdamped (gamma < 2*omega_0), critically damped (gamma = 2*omega_0), overdamped (gamma > 2*omega_0). | NEW `DampedPendulumScene` — pendulum with adjustable damping slider, exponential envelope shown |
| 3 | The Q factor | Q = omega_0 / gamma. Measures how many oscillations before energy drops to 1/e. Tuning fork: Q ~ 1000. Quartz crystal: Q ~ 10^5. Superconducting cavity: Q ~ 10^10. Pendulum in air: Q ~ 100-1000. Low Q: door closer, shock absorber. High Q means sharp frequency selection. | Same `DampedPendulumScene` displaying Q value, adjustable |
| 4 | Driven oscillations | Apply a periodic force: x'' + gamma*x' + omega_0^2*x = F_0*cos(omega_d*t). After transients die, the system oscillates at the driving frequency. Amplitude depends on how close omega_d is to omega_0. | NEW `ResonanceCurveScene` — amplitude A(omega_drive) vs omega_drive, adjustable Q shows peak sharpening |
| 5 | Resonance | When omega_drive ~ omega_0, amplitude peaks. With low damping, the peak is enormous. Tacoma Narrows Bridge (1940): wind drove the bridge at its resonant frequency. MRI: hydrogen nuclei resonate at the Larmor frequency in a magnetic field. Radio: LC circuit tuned to station frequency. Wine glass: acoustic resonance shatters it. | Same `ResonanceCurveScene` with annotations |
| 6 | Coupled oscillators | Two pendulums connected by a spring. Energy transfers back and forth (beats). But there exist special motions — normal modes — where both pendulums oscillate at the same frequency: in-phase mode (lower freq) and anti-phase mode (higher freq). Any motion is a superposition of normal modes. | NEW `CoupledPendulumScene` — two spring-linked pendulums, buttons: "mode 1", "mode 2", "beats" |
| 7 | From oscillators to waves | Line up N coupled oscillators. As N -> infinity, the discrete system becomes a continuous wave equation. d^2u/dt^2 = c^2 * d^2u/dx^2. Sound is a pressure wave in coupled air molecules. Light is coupled electric and magnetic fields. Quantum fields are coupled oscillators at every point in space. The oscillator is the atom of wave physics. | NEW `WaveChainScene` — chain of N coupled pendulums (slider: N = 3..30), initial pluck propagates as wave |

### Physicists referenced
- Nikola Tesla (NEW — resonance, AC systems)
- Jules Antoine Lissajous (NEW — coupled oscillations, Lissajous figures)
- Leon Foucault (existing — moved here, Earth's rotation proof)

### Glossary terms
- NEW: damping, q-factor, resonance, normal-modes, beats

---

## 5. New Interactive Components

All components follow existing patterns: `"use client"`, Canvas 2D or JSXGraph, `useThemeColors()` for dark/light, responsive sizing.

| Component | File | Engine | Complexity | Props |
|-----------|------|--------|------------|-------|
| `SmallAngleScene` | `components/physics/small-angle-scene.tsx` | JSXGraph | Low | `maxTheta?: number` |
| `CycloidScene` | `components/physics/cycloid-scene.tsx` | Canvas 2D | Medium | `radius?: number, animate?: boolean` |
| `TaylorExpansionScene` | `components/physics/taylor-expansion-scene.tsx` | JSXGraph | Low | `maxOrder?: number` |
| `EnergyDiagramScene` | `components/physics/energy-diagram-scene.tsx` | Canvas 2D | Medium | `length: number, theta0: number, draggable?: boolean` |
| `SeparatrixScene` | `components/physics/separatrix-scene.tsx` | JSXGraph | Medium | `length: number, numTrajectories?: number` |
| `PeriodVsAmplitudeScene` | `components/physics/period-vs-amplitude-scene.tsx` | JSXGraph | Low | (none) |
| `UniversalOscillatorScene` | `components/physics/universal-oscillator-scene.tsx` | Canvas 2D | Medium | `system?: "pendulum" \| "spring" \| "lc"` |
| `DampedPendulumScene` | `components/physics/damped-pendulum-scene.tsx` | Canvas 2D | Medium | `theta0: number, length: number, gamma?: number` |
| `ResonanceCurveScene` | `components/physics/resonance-curve-scene.tsx` | JSXGraph | Low | `omega0?: number, Q?: number` |
| `CoupledPendulumScene` | `components/physics/coupled-pendulum-scene.tsx` | Canvas 2D | High | `length: number, k?: number, mode?: "1" \| "2" \| "beats"` |
| `WaveChainScene` | `components/physics/wave-chain-scene.tsx` | Canvas 2D | High | `N?: number, length?: number` |

### Physics library additions

- `lib/physics/damped-oscillator.ts` — damped + driven ODE solver
- `lib/physics/coupled-oscillator.ts` — two-body + spring normal mode solver
- `lib/physics/elliptic.ts` — complete elliptic integral K(k) via arithmetic-geometric mean
- `lib/physics/cycloid.ts` — parametric cycloid curve generation

---

## 6. New Glossary Terms (10 total)

| Slug | Term | Category | Short Definition |
|------|------|----------|-----------------|
| tautochrone | Tautochrone | concept | Curve where descent time is independent of starting point; the cycloid |
| cycloid | Cycloid | concept | Curve traced by a point on a rolling circle; solves both tautochrone and brachistochrone |
| elliptic-integral | Elliptic Integral | concept | Integral involving sqrt of cubic/quartic polynomial; exact period of large-angle pendulum |
| separatrix | Separatrix | concept | Phase-space boundary between qualitatively different motions (oscillation vs rotation) |
| libration | Libration | concept | Bounded oscillation within a potential well, as opposed to full rotation |
| nonlinear-dynamics | Nonlinear Dynamics | concept | Study of systems where output is not proportional to input; chaos, solitons, turbulence |
| potential-well | Potential Well | concept | Region of potential energy that traps a system; shape determines oscillation character |
| damping | Damping | concept | Energy dissipation that causes oscillation amplitude to decay; characterized by gamma or Q |
| q-factor | Quality Factor | concept | Ratio omega_0/gamma; number of oscillations before energy drops to 1/e of initial |
| resonance | Resonance | phenomenon | Amplitude peak when driving frequency matches natural frequency |
| normal-modes | Normal Modes | concept | Independent oscillation patterns of a coupled system; any motion is their superposition |
| beats | Beats | phenomenon | Amplitude modulation from superposition of two close frequencies; f_beat = |f_1 - f_2| |

---

## 7. New Physicist Entries (4 total)

| Name | Born-Died | Nationality | Relevance |
|------|-----------|-------------|-----------|
| Pierre Bouguer | 1698-1758 | French | Pendulum gravity measurements in Andes, photometry pioneer |
| Adrien-Marie Legendre | 1752-1833 | French | Elliptic integrals, number theory, least squares method |
| Nikola Tesla | 1856-1943 | Serbian-American | AC power, resonance applications, electromagnetic oscillations |
| Jules Antoine Lissajous | 1822-1880 | French | Lissajous figures, coupled oscillation visualization |

Note: Jacobi mentioned in text but doesn't need a full entry — Legendre covers the elliptic integral story.

---

## 8. File Changes Summary

### Modified files
- `lib/content/types.ts` — add `Module` interface, add `module` field to `Topic`
- `lib/content/branches.ts` — add modules array, restructure topics, rename pendulum slug
- `lib/content/glossary.ts` — add 12 new terms
- `lib/content/physicists.ts` — add 4 new entries
- `lib/content/refs.ts` — update cross-reference validation
- `app/[locale]/(topics)/classical-mechanics/page.tsx` — group topics by module
- `components/physics/visualization-registry.tsx` — register new visualizations

### New files
- `app/[locale]/(topics)/classical-mechanics/the-simple-pendulum/page.mdx`
- `app/[locale]/(topics)/classical-mechanics/beyond-small-angles/page.mdx`
- `app/[locale]/(topics)/classical-mechanics/oscillators-everywhere/page.mdx`
- 11 new component files in `components/physics/`
- 4 new physics library files in `lib/physics/`

### Deleted files
- `app/[locale]/(topics)/classical-mechanics/pendulum/page.mdx` (replaced by the-simple-pendulum)

### Redirects
- `/classical-mechanics/pendulum` -> `/classical-mechanics/the-simple-pendulum` (in next.config.mjs)

---

## 9. Out of Scope

- Kepler content restructuring (future round)
- Localization of new content to Russian (separate task)
- New branches (Electromagnetism, etc.)
- Mobile-specific layout changes
