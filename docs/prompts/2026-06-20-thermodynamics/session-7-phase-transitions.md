# Session 7 — Module 7 · Phase Transitions (3 topics)

You are content session **s7-phase** of a 9-session parallel sprint finishing the
Thermodynamics branch (§04) of physicsexplained.

**First:** read `docs/prompts/2026-06-20-thermodynamics/SHARED.md` in
`/Users/roman/Developer/physics` and follow its workspace setup with
`SESSION-ID = s7-phase`. All rules there apply. Raw material: the Module 7 FIG
entries (FIG.22–24) in `docs/roadmap/03-thermodynamics.md`.

Module slug: `phase-transitions`. Eyebrow on all three topics:
`FIG.NN · PHASE TRANSITIONS`.

---

## Your topics (eyebrows/titles/subtitles verbatim in `lib/content/branches.ts`)

### 1. `the-clausius-clapeyron-relation` — FIG.22

An ice-skater rides on a film of liquid water her own weight creates — water's
melting point drops with pressure. Coexistence curves; Clausius–Clapeyron derived
(equal Gibbs energies along coexistence ⟹ dP/dT = L/(TΔV)); the water anomaly
(ΔV < 0 on melting ⟹ negative solid–liquid slope); predictions that work
(exponential vapour pressure, pressure cookers, boiling on mountains); the triple
point (273.16 K / 611.657 Pa, which *defined* the kelvin pre-2019); beyond the
critical point (→ FIG.23). 7 sections.

- **Physics lib:** `lib/physics/thermodynamics/clausius-clapeyron.ts` — dP/dT =
  L/(TΔV), the saturated-vapour-pressure curve ln P ≈ const − L/RT, and
  boiling-point vs altitude. Extends `phase-change.ts` (session 1) — import and
  build on it rather than duplicating.
- **Scenes (2):**
  - (a) `clausius-clapeyron-scene.tsx` — a P–T phase diagram for H₂O and CO₂
    (toggle); drag a state point to read the phase; the solid–liquid slope is
    visibly negative for water, positive for CO₂.
  - (b) `boiling-altitude-scene.tsx` — points at varying elevations (Everest
    71 °C, Death Valley 101 °C, Dead Sea 101.5 °C); live Clausius–Clapeyron
    boiling-point calculation.

### 2. `critical-phenomena-and-universality` — FIG.23

Andrews (1869) finds the liquid–vapour distinction dissolves above 31 °C in CO₂;
a century later Wilson wins a Nobel for showing magnets, fluids, and polymers
share the same critical behaviour. The critical point (end of coexistence; water
647 K/22 MPa, CO₂ 304 K); critical opalescence (fluctuations at all scales, milky
white); scaling (power laws, exponents β, γ, α); universality (same exponents for
matching dimensionality and symmetry); Landau's mean-field theory (1937, wrong in
3D but universal in framework); Wilson's renormalisation group (1971–74, the
correct exponents from a fixed point, Nobel 1982). 7 sections.

- **Physics lib:** `lib/physics/thermodynamics/critical.ts` — power-law order
  parameter (ρ_liq − ρ_gas) ~ (T_c − T)^β, the van der Waals critical point, and a
  toy RG-flow map.
- **Scenes (3):**
  - (a) `critical-opalescence-scene.tsx` — a CO₂ cell approaching T_c;
    all-scale fluctuations; the transparent fluid turns milky; the meniscus
    vanishes.
  - (b) `critical-exponent-scene.tsx` — log-log (ρ_liq − ρ_gas) vs |T − T_c| for
    several fluids collapsing onto one line of slope β ≈ 0.326.
  - (c) `rg-flow-scene.tsx` — a 2D parameter space where different microscopic
    theories all flow under coarse-graining to one fixed point.

### 3. `the-ising-model` — FIG.24

Lenz hands Ising a spin-chain problem in 1920; Ising solves 1D (no transition) and
dismisses it; Onsager cracks 2D (1944, a transition) and wins a Nobel. The setup
(σ_i = ±1, H = −J Σσ_iσ_j − h Σσ_i); 1D solved by Ising (no order at T > 0); 2D
solved by Onsager (T_c = 2J/k_B ln(1+√2) ≈ 2.27 J/k_B, magnetisation ~ (T_c−T)^{1/8});
3D not analytically solvable but known numerically; universality again (3D Ising =
liquid–vapour = binary mixtures); Ising beyond ferromagnets (neural networks,
epidemics, spin glasses). 7 sections.

- **Physics lib:** `lib/physics/thermodynamics/ising.ts` and
  `lib/physics/thermodynamics/lattice.ts` — a Monte Carlo / Glauber-dynamics Ising
  simulator on a 2D lattice + neighbour-list helper. Reuses `random.ts`
  (session 4). Unit-test the energy/magnetisation bookkeeping.
- **Scenes (3):**
  - (a) `ising-1d-scene.tsx` — a spin chain with Monte Carlo stepping; T slider;
    magnetisation fluctuates around zero at every T (no order).
  - (b) `ising-2d-scene.tsx` — a 2D lattice with Glauber dynamics; T crossing
    T_c ≈ 2.27 J/k; salt-and-pepper above, fractal clusters at T_c, one domain
    below; magnetisation readout.
  - (c) `ising-phase-scene.tsx` — ⟨|m|⟩ vs T from a 2D run; sharp onset at T_c
    matching (T_c−T)^{1/8} below, zero above.

---

## Reference ownership (you CREATE these; others only reference)

### Physicists (append to `lib/content/physicists.ts` + seed `thermo-module-7.json`)

`thomas-andrews` (1813–1885, Irish), `johannes-van-der-waals` (1837–1923, Dutch),
`lev-landau` (1908–1968, Soviet), `kenneth-wilson` (1936–2013, American),
`wilhelm-lenz` (1888–1957, German), `ernst-ising` (1900–1998, German-American),
`lars-onsager` (1903–1976, Norwegian-American).

Already exist (reference freely, do NOT recreate): `rudolf-clausius` (s3),
`benoit-clapeyron` (s1).

### Dictionary terms (append to `lib/content/glossary.ts` + seed `thermo-module-7.json`)

`clausius-clapeyron-relation`, `coexistence-curve`, `phase-diagram`,
`critical-exponent`, `universality`, `renormalisation-group`, `order-parameter`,
`mean-field-theory`, `ising-model`, `ferromagnet`, `spin` (thermo-scope stub —
you own it; full treatment in the Quantum branch), `monte-carlo-method`.

**Upgrade-not-create:** `triple-point` and `critical-point` already exist as stubs
owned by session 1 (FIG.04). Reference them and write the deeper FIG.22/23 prose
in the essay; do NOT create new entries. The already-existing glossary term
`critical-temperature` and `curie-temperature` should be reused where relevant,
not duplicated.

Owned by other sessions (reference but do NOT create): `phase-transition` /
`phase` / `latent-heat` (s1), `fluctuation` / `critical-opalescence` (s6).

---

The Ising 2D scene is the visual centrepiece of the module — invest in making the
critical-temperature crossover legible. Good luck.
