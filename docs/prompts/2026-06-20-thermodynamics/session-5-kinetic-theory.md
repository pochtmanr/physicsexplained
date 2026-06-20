# Session 5 — Module 5 · Kinetic Theory of Gases (5 topics)

You are content session **s5-kinetic** of a 9-session parallel sprint finishing
the Thermodynamics branch (§04) of physicsexplained.

**First:** read `docs/prompts/2026-06-20-thermodynamics/SHARED.md` in
`/Users/roman/Developer/physics` and follow its workspace setup with
`SESSION-ID = s5-kinetic`. All rules there apply. Raw material: the Module 5 FIG
entries (FIG.14–18) in `docs/roadmap/03-thermodynamics.md`. This is the largest
module (5 topics) — work through them in order.

Module slug: `kinetic-theory`. Eyebrow on all five topics:
`FIG.NN · KINETIC THEORY`.

---

## Your topics (eyebrows/titles/subtitles verbatim in `lib/content/branches.ts`)

### 1. `the-ideal-gas-law` — FIG.14

Boyle (1662), Charles (1787), Avogadro (1811) collapse into PV = nRT. Boyle's law
(PV = const at fixed T); Charles's law (V ∝ T, extrapolating to −273 °C);
Avogadro's hypothesis (6.022×10²³ per mole); the combined law (R = 8.314 J/mol·K);
the N, k_B form (PV = Nk_BT); when it fails (van der Waals, low T, near critical).
7 sections.

- **Physics lib:** `lib/physics/thermodynamics/ideal-gas.ts` — **shared branch
  helper**: PV = nRT = Nk_BT, and the compressibility factor Z = PV/nRT.
- **Scenes (2):**
  - (a) `gas-laws-triple-scene.tsx` — three panels: P vs 1/V (Boyle), V vs T
    hitting zero at −273 °C (Charles), PV/nR vs T collapsing all gases onto one
    line.
  - (b) `ideal-vs-real-gas-scene.tsx` — Z = PV/nRT vs P at several T; Z dips
    below 1 (attraction) then climbs above 1 (repulsion); shows where "ideal"
    breaks.

### 2. `pressure-from-molecular-collisions` — FIG.15

Daniel Bernoulli (1738) explains pressure as molecular collisions, ignored for
120 years until Clausius (1857). Bernoulli's picture; the 1D→3D derivation
(PV = ⅓ Nm⟨v²⟩); matching PV = NkT ⟹ ½m⟨v²⟩ = 3/2 kT (the *meaning* of
temperature); v_rms = √(3kT/m) (why H₂ escapes Earth and N₂ doesn't); temperature
as translational kinetic energy per molecule; a hand-wave on liquid pressure.
7 sections.

- **Physics lib:** `lib/physics/thermodynamics/kinetic-pressure.ts` — momentum-
  transfer pressure from a 2D bouncing-molecule gas, ⟨v²⟩↔T, v_rms by species.
  Reuses `random.ts`.
- **Scenes (2):**
  - (a) `molecular-pressure-scene.tsx` — a 2D box of bouncing molecules; sliders
    N and T; pressure computed live from wall momentum transfer, matching NkT/V.
  - (b) `rms-speed-scene.tsx` — velocity-magnitude histogram; mean, RMS,
    most-probable marked; vary T and species (H₂, He, N₂, Ar, Xe).

### 3. `the-maxwell-boltzmann-distribution` — FIG.16

Maxwell, Aberdeen, 1859, derives the first probability distribution in physics by
pure symmetry. Setup (independent Gaussian components ⟹ chi-distributed speed);
the formula f(v) = 4π(m/2πkT)^{3/2} v² exp(−mv²/2kT), with v_mp < ⟨v⟩ < v_rms; the
v² factor (phase-space volume); the tail (escape, reaction rates, the Arrhenius
factor); Boltzmann's generalisation (P ∝ exp(−E/kT) — the engine of stat mech,
→ FIG.19); Stern's 1920s rotating-disc verification. 7 sections.

- **Physics lib:** `lib/physics/thermodynamics/maxwell-boltzmann.ts` and
  `lib/physics/thermodynamics/distributions.ts` — **shared distributions helper**
  (Gaussian, Maxwell–Boltzmann now; Bose–Einstein / Fermi–Dirac added by sessions
  8–9). Build `distributions.ts` cleanly so later sessions extend it.
- **Scenes (3):**
  - (a) `maxwell-boltzmann-scene.tsx` — f(v) with T and mass sliders; markers for
    v_mp, ⟨v⟩, v_rms; the "fast fraction" above a threshold.
  - (b) `boltzmann-factor-scene.tsx` — exp(−E/kT) vs E for several T; a threshold
    E_a; the fraction above it on a log scale.
  - (c) `stern-experiment-scene.tsx` — molecules through a slit into a spinning
    chopper disc; the deposition profile builds up f(v); vary disc speed.

### 4. `equipartition-and-degrees-of-freedom` — FIG.17

Maxwell (1860): every quadratic degree of freedom carries ½kT — and it fails in
three ways that each crack physics open into quantum mechanics. Degrees of freedom
(monatomic 3, diatomic 5→7, solid 6); the theorem (⟨E⟩ = (f/2)NkT); heat
capacities (C_v = (f/2)Nk, recovering Dulong–Petit); γ = (f+2)/f (the value
promised in FIG.07); failure 1 (diatomic rotation freezes out at low T); failure 2
(Dulong–Petit breaks below the Debye temperature — Einstein 1907, Debye 1912,
phonons); failure 3 (the ultraviolet catastrophe → Planck 1900). 7 sections.

- **Physics lib:** `lib/physics/thermodynamics/equipartition.ts` — C_v(f), γ(f),
  and the stepped C_v(T) curve for H₂ across temperature decades.
- **Scenes (2):**
  - (a) `degrees-of-freedom-scene.tsx` — He (3), N₂ (5→7), crystal atom (6);
    toggle each; animated translational/rotational/vibrational motion; C_v readout.
  - (b) `equipartition-failure-scene.tsx` — C_v vs T for H₂; the (3/2)R → (5/2)R
    → (7/2)R staircase, each plateau labelled.

### 5. `brownian-motion` — FIG.18

Robert Brown (1827) sees pollen jitter; Einstein (1905) explains it; Perrin (1908)
measures it and the atom stops being a hypothesis. Brown's observation; Einstein's
1905 paper (⟨x²⟩ = 2Dt, D = kT/6πηr); random walks (displacement ∝ √N, the
diffusion law); Perrin's experiments (D → k_B → Avogadro's number, Nobel 1926);
the fluctuation-dissipation insight (same collisions jiggle and damp — foreshadows
FIG.21); where Brownian motion shows up today (finance, biology). 7 sections.

- **Physics lib:** `lib/physics/thermodynamics/brownian.ts` — 2D random walk,
  ⟨x²⟩ = 2Dt accumulation, Einstein–Stokes D, k_B from measured D. Reuses
  `random.ts`.
- **Scenes (2):**
  - (a) `brownian-walk-scene.tsx` — a tracked particle driven by random kicks;
    visible trail; ⟨x²⟩(t) accumulates linearly beside the scene; kick-magnitude
    slider.
  - (b) `perrin-counting-scene.tsx` — a microscope view of suspended spheres;
    drop a probe, watch displacement; the histogram fits a Gaussian of width ∝ √t;
    k_B derived from measured D.

---

## Reference ownership (you CREATE these; others only reference)

### Physicists (append to `lib/content/physicists.ts` + seed `thermo-module-5.json`)

`robert-boyle` (1627–1691, Anglo-Irish), `jacques-charles` (1746–1823, French),
`amedeo-avogadro` (1776–1856, Italian), `joseph-louis-gay-lussac` (1778–1850,
French), `august-kronig` (1822–1879, German), `otto-stern` (1888–1969,
German-American), `peter-debye` (1884–1966, Dutch — cameo here, also owned-by-you;
session 8 references him), `robert-brown` (1773–1858, Scottish),
`jean-baptiste-perrin` (1870–1942, French).

Already exist (reference freely, do NOT recreate): `daniel-bernoulli`,
`rudolf-clausius` (s3), `james-clerk-maxwell`, `ludwig-boltzmann` (s3),
`albert-einstein`.

### Dictionary terms (append to `lib/content/glossary.ts` + seed `thermo-module-5.json`)

`ideal-gas-law`, `boyles-law`, `charles-law`, `avogadro-number` (constant),
`gas-constant` (constant), `compressibility-factor`, `kinetic-theory`,
`rms-speed`, `mean-free-path`, `maxwell-boltzmann-distribution`,
`boltzmann-factor`, `most-probable-speed`, `arrhenius-equation`,
`equipartition-theorem`, `degrees-of-freedom`, `debye-temperature`, `phonon`
(thermo-scope stub — you own it), `brownian-motion`, `diffusion`,
`einstein-relation`, `random-walk`.

Owned by other sessions (reference but do NOT create): `boltzmann-distribution` /
`partition-function` (s6), `fluctuation-dissipation-theorem` (s6).

---

`distributions.ts` and `ideal-gas.ts` are shared helpers later sessions import —
keep them general and well-typed. Good luck.
