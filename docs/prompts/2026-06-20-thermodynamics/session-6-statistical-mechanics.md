# Session 6 — Module 6 · Statistical Mechanics (3 topics)

You are content session **s6-statmech** of a 9-session parallel sprint finishing
the Thermodynamics branch (§04) of physicsexplained.

**First:** read `docs/prompts/2026-06-20-thermodynamics/SHARED.md` in
`/Users/roman/Developer/physics` and follow its workspace setup with
`SESSION-ID = s6-statmech`. All rules there apply. Raw material: the Module 6 FIG
entries (FIG.19–21) in `docs/roadmap/03-thermodynamics.md`.

Module slug: `statistical-mechanics`. Eyebrow on all three topics:
`FIG.NN · STAT MECHANICS`.

---

## Your topics (eyebrows/titles/subtitles verbatim in `lib/content/branches.ts`)

### 1. `the-partition-function` — FIG.19

Gibbs, Yale, 1902, coins "statistical mechanics" and makes the partition function
the central object. The canonical ensemble (thermal contact, fixed T, fluctuating
E); the Boltzmann distribution p_i = exp(−βE_i)/Z; the partition function
Z = Σ exp(−βE_i) as the generating function; free energy F = −kT ln Z and the
observables that fall out by differentiation (S, P, ⟨E⟩, C_v); examples (two-level
system, ideal gas → Sackur–Tetrode, harmonic oscillator → matters for FIG.28); the
three ensembles (microcanonical, canonical, grand canonical). 7 sections.

- **Physics lib:** `lib/physics/thermodynamics/partition-function.ts` — Z for the
  two-level system, harmonic oscillator, and ideal gas; F, S, ⟨E⟩, C_v, P by
  differentiation. Reuses `distributions.ts` (session 5).
- **Scenes (2):**
  - (a) `two-level-system-scene.tsx` — a two-rung ladder (0, ε); temperature
    slider; level populations as bars from Boltzmann factors; C_v(T) below showing
    the Schottky anomaly hump at kT ≈ ε.
  - (b) `partition-to-thermo-scene.tsx` — pick Z (dropdown: 2-level / HO / ideal
    gas); derived F, S, ⟨E⟩, C_v, P each as a live plot vs T; Z as the generator.

### 2. `free-energies-and-maxwells-demon` — FIG.20

Szilard (1929) reframes Maxwell's demon as a measurement problem; Landauer (1961)
shows erasing a bit costs kT ln 2. Four free energies (U, H = U+PV, F = U−TS,
G = U−TS+PV), one shape; Gibbs free energy and chemistry (ΔG < 0 spontaneous at
fixed T, P); Legendre transforms (the operation relating them); the Szilard engine;
Landauer's principle; why the second law survives (the demon's memory must be
erased); the forward thread (thermodynamics of computation). 7 sections.

- **Physics lib:** `lib/physics/thermodynamics/free-energy.ts` — the four
  potentials and their Legendre relations; the Szilard-engine work/erasure
  bookkeeping (kT ln 2 in, kT ln 2 out, net zero).
- **Scenes (2):**
  - (a) `four-free-energies-scene.tsx` — a quadrant of U / F / H / G with their
    natural variables; Legendre-transform arrows connect them; hover for
    definition and use.
  - (b) `szilard-engine-scene.tsx` — a single-molecule gas; "measure position"
    drops a partition; the molecule does kT ln 2 of work; resetting (erasing the
    measurement) costs kT ln 2; net work zero, second law saved.

### 3. `fluctuations-and-dissipation` — FIG.21

Johnson (1927) finds an unsilenceable hiss in every resistor; Nyquist (1928)
derives it from thermodynamics; it is the same randomness that jiggles Brown's
pollen. Fluctuations are real (⟨(ΔE)²⟩ = kT²C_v); they scale as 1/√N (invisible at
N = 10²³, dominant for a nanostructure); the fluctuation-dissipation theorem
(Kubo 1957); Johnson–Nyquist noise (V²_noise = 4kTRΔf); Einstein revisited
(Brownian motion was the first FDT); critical opalescence (foreshadows FIG.23).
7 sections.

- **Physics lib:** `lib/physics/thermodynamics/fluctuations.ts` — canonical
  energy-fluctuation variance, 1/√N scaling, and Johnson–Nyquist noise power.
- **Scenes (2):**
  - (a) `fluctuation-scaling-scene.tsx` — a canonical-ensemble sim with an N
    slider; instantaneous E(t) vs running mean; relative σ = 1/√N; wild for small
    N, flat for large N.
  - (b) `johnson-nyquist-scene.tsx` — a resistor at T; an oscilloscope trace of
    thermal noise fitting 4kTRΔf; amplitude rises with √T and √R.

---

## Reference ownership (you CREATE these; others only reference)

### Physicists (append to `lib/content/physicists.ts` + seed `thermo-module-6.json`)

`josiah-willard-gibbs` (1839–1903, American), `leo-szilard` (1898–1964,
Hungarian-American), `rolf-landauer` (1927–1999, German-American),
`charles-bennett` (1943–**—**, American — **living, `died: "—"`**),
`john-b-johnson` (1887–1970, Swedish-American), `harry-nyquist` (1889–1976,
Swedish-American), `ryogo-kubo` (1920–1995, Japanese), `marian-smoluchowski`
(1872–1917, Polish).

Already exist (reference freely, do NOT recreate): `ludwig-boltzmann` (s3),
`albert-einstein`.

### Dictionary terms (append to `lib/content/glossary.ts` + seed `thermo-module-6.json`)

`partition-function`, `boltzmann-distribution`, `canonical-ensemble`,
`microcanonical-ensemble`, `grand-canonical-ensemble`, `helmholtz-free-energy`,
`gibbs-free-energy`, `enthalpy`, `legendre-transform`, `landauer-principle`,
`szilard-engine`, `fluctuation`, `fluctuation-dissipation-theorem`,
`johnson-noise`, `critical-opalescence`.

Owned by other sessions (reference but do NOT create): `maxwells-demon` (s4 —
stub it owns; you resolve the physics in the FIG.20 essay but link the existing
term), `ensemble` (created by s4 as a stub; reuse), `critical-exponent` (s7).

---

The partition function is the keystone of the whole module — its seed definition
gets linked from many later topics, so write it precisely. Good luck.
