# Session 8 — Module 8 · Applications & the Third Law, part 1: the cold frontier (3 topics)

You are content session **s8-cold** of a 9-session parallel sprint finishing the
Thermodynamics branch (§04) of physicsexplained.

**First:** read `docs/prompts/2026-06-20-thermodynamics/SHARED.md` in
`/Users/roman/Developer/physics` and follow its workspace setup with
`SESSION-ID = s8-cold`. All rules there apply. Raw material: FIG.25–27 in
`docs/roadmap/03-thermodynamics.md` (the first half of Module 8).

Module slug: `applications-and-the-third-law` (shared with session 9). Eyebrow on
all three topics: `FIG.NN · APPLICATIONS`. You own FIG.25–27 and their references;
session 9 owns FIG.28–30. Append your shared-file blocks under banner
`// ─── Module 8a applications (thermo sprint 2026-06-20)`.

---

## Your topics (eyebrows/titles/subtitles verbatim in `lib/content/branches.ts`)

### 1. `refrigerators-and-heat-pumps` — FIG.25

Jacob Perkins patents the first vapour-compression refrigerator (1834); every
fridge and heat pump runs a Carnot cycle in reverse. Running Carnot backwards
(work in, heat cold→hot); coefficient of performance (COP_fridge ≤ T_c/(T_h−T_c),
COP_pump ≤ T_h/(T_h−T_c), both can exceed 1); the vapour-compression cycle
(compressor, condenser, throttle, evaporator); CFCs → ozone hole → Montreal
Protocol; absorption refrigeration (the Einstein–Szilard no-moving-parts fridge);
heat pumps as climate technology. 7 sections.

- **Physics lib:** `lib/physics/thermodynamics/refrigeration.ts` — reverse-Carnot
  Q_c/W and COP for fridge and heat pump. Reuses `carnot.ts` (session 3) and
  `pv-plot.ts` (session 2).
- **Scenes (2):**
  - (a) `reverse-carnot-scene.tsx` — the Carnot cycle running counter-clockwise;
    T_c, T_h sliders; live Q_c pumped, W input, COP; theoretical vs real-fridge
    (~0.5× Carnot) bars.
  - (b) `vapour-compression-scene.tsx` — a household-fridge schematic with the
    four components animated; the working fluid changes colour as it
    evaporates/condenses; toggle CFC / HFC / CO₂ refrigerant notes.

### 2. `the-approach-to-absolute-zero` — FIG.26

Kamerlingh Onnes liquefies helium (4.2 K, 1908) and discovers superconductivity
(1911); his motto *Door meten tot weten* — "through measurement to knowledge."
Cascade cooling (O₂ 1877 → N₂ → H₂ 1898 → He 1908); Joule–Thomson expansion (and
inversion temperatures); the Dewar flask (1892, your thermos); adiabatic
demagnetisation (Debye–Giauque 1926, millikelvin by 1933); dilution refrigeration
(millikelvin, standard for quantum computing); laser cooling (Chu/Cohen-Tannoudji/
Phillips, 1997 Nobel — micro- and nanokelvin, prepares the atoms for FIG.28).
7 sections. Give Onnes's Dutch motto once, then translate.

- **Physics lib:** `lib/physics/thermodynamics/cooling.ts` — Joule–Thomson
  coefficient and inversion temperature, and the adiabatic-demagnetisation
  entropy/temperature steps.
- **Scenes (2):**
  - (a) `cooling-timeline-scene.tsx` — a logarithmic "coldest achieved" timeline
    from 1877 (liquid O₂, 90 K) to ~2015 (100 pK in optical lattices); each
    milestone annotated with technique and year.
  - (b) `adiabatic-demagnetisation-scene.tsx` — three steps: magnetise (spins
    align, entropy leaves as heat), thermally decouple, demagnetise (spins
    randomise, T plunges); entropy/temperature plot alongside.

### 3. `the-third-law` — FIG.27

Nernst's heat theorem (1906) and Planck's sharpening: S → 0 as T → 0 for a perfect
crystal, and absolute zero is unattainable in finite steps. Nernst's statement
(ΔS → 0 for isothermal processes as T → 0); Planck's sharpening (Ω → 1 ⟹ S → 0);
the unattainability statement; residual entropy (ice k ln(3/2) per molecule,
Pauling 1935; CO disorder); why the third law is deep (not derivable from the
first two; quantum ground states are the ultimate reason); consequences
(vanishing specific heats — Debye T³, Sommerfeld T; vanishing thermal expansion).
7 sections.

- **Physics lib:** `lib/physics/thermodynamics/third-law.ts` — S(T) curves toward
  T = 0 for an ideal crystal, ice (residual k ln 3/2), and a glass; the
  unattainability staircase (each adiabatic-demagnetisation step halves the
  entropy span but never reaches T = 0).
- **Scenes (2):**
  - (a) `third-law-entropy-scene.tsx` — S(T) from high T to 0 for three cases
    (ideal crystal → 0, ice → k ln(3/2)×N, glass → frozen residual); cursor reads
    S along T.
  - (b) `unattainability-scene.tsx` — successive demagnetisation steps, each
    halving the entropy span; the staircase converges to a vertical asymptote at
    T = 0.

---

## Reference ownership (you CREATE these; others only reference)

### Physicists (append to `lib/content/physicists.ts` + seed `thermo-module-8a.json`)

`jacob-perkins` (1766–1849, Anglo-American), `thomas-midgley` (1889–1944,
American), `mario-molina` (1943–2020, Mexican), `sherwood-rowland` (1927–2012,
American), `james-dewar` (1842–1923, Scottish), `william-giauque` (1895–1982,
Canadian-American), `walther-nernst` (1864–1941, German), `linus-pauling`
(1901–1994, American), `steven-chu` (1948–**—**, American — **living, `died: "—"`**),
`claude-cohen-tannoudji` (1933–**—**, French — **living, `died: "—"`**),
`william-phillips` (1948–**—**, American — **living, `died: "—"`**).

Already exist (reference freely, do NOT recreate): `heike-kamerlingh-onnes`,
`peter-debye` (s5), `max-planck` (s3), `albert-einstein`, `leo-szilard` (s6).

### Dictionary terms (append to `lib/content/glossary.ts` + seed `thermo-module-8a.json`)

`refrigerator`, `heat-pump`, `coefficient-of-performance`,
`vapour-compression-cycle`, `reverse-carnot-cycle`, `cryogenics`,
`joule-thomson-effect`, `dewar-flask`, `adiabatic-demagnetisation`,
`laser-cooling`, `third-law-of-thermodynamics`, `residual-entropy`,
`nernst-theorem`.

**Upgrade-not-create:** `absolute-zero` already exists as a stub owned by session
1 (FIG.01). Reference it and write the fuller FIG.27 prose in the essay; do NOT
create a new entry.

Owned by session 9 (reference but do NOT create): `bose-einstein-condensate`,
`superfluid`, `heat-death` (s3 stub, s9 deep dive).

---

This pair of sessions is the branch's big finish; landing the cold-frontier scenes
cleanly sets up session 9's BEC topic. Good luck.
