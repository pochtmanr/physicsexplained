# Session 2 — Module 2 · The First Law (3 topics)

You are content session **s2-first-law** of a 9-session parallel sprint finishing
the Thermodynamics branch (§04) of physicsexplained.

**First:** read `docs/prompts/2026-06-20-thermodynamics/SHARED.md` in
`/Users/roman/Developer/physics` and follow its workspace setup with
`SESSION-ID = s2-first-law`. All rules there apply. Raw material: the Module 2 FIG
entries (FIG.05–07) in `docs/roadmap/03-thermodynamics.md`.

Module slug: `first-law`. Eyebrow on all three topics: `FIG.0N · THE FIRST LAW`.

---

## Your topics (eyebrows/titles/subtitles verbatim in `lib/content/branches.ts`)

### 1. `internal-energy-and-the-first-law` — FIG.05

Julius von Mayer, ship's doctor, deduces energy conservation in 1840 from the
brightness of tropical venous blood. Internal energy U as a *state function*; the
first law ΔU = Q − W; sign conventions (physics convention: Q in +, W by system
+); three independent discoveries (Mayer 1842, Joule 1843, Helmholtz 1847);
perpetual motion of the first kind, forbidden; why U is the only legitimate stored
quantity (heat and work are not state functions). 7 sections.

- **Physics lib:** `lib/physics/thermodynamics/first-law.ts` — the ΔU = Q − W
  accounting, with the three modes (engine / heating / friction).
- **Scenes (2):**
  - (a) `first-law-accounting-scene.tsx` — a system box; sliders Q_in, W_out;
    internal-energy bar updates live; ΔU = Q − W shown as a running equation;
    toggle heat-in+work-out (engine) / heat-in only / work-in only (friction).
  - (b) `three-discoveries-timeline-scene.tsx` — 1840–1850 timeline pinned at
    Mayer (1842), Joule (1843), Helmholtz (1847); click each for a one-paragraph
    account; ΔU = Q − W glowing underneath.

### 2. `work-and-pv-diagrams` — FIG.06

Clapeyron (1834) draws Carnot's prose: pressure vs volume, a closed loop on the
plane, and thermodynamics becomes readable. Work W = ∫P dV; the four canonical
processes (isobaric, isochoric, isothermal, adiabatic); reversibility as the
physicist's fiction (quasi-static, frictionless, runnable backwards); path
dependence of W and Q vs endpoint-only ΔU; cycles (ΔU = 0 over a loop ⟹
Q_net = W_net = enclosed area; clockwise engine, counter-clockwise refrigerator).
7 sections.

- **Physics lib:** `lib/physics/thermodynamics/pv-plot.ts` — **the shared
  PV-diagram helper for the whole branch** (axes, isobars/isochores/isotherms/
  adiabats, area-under-curve work, cycle-area net work). Sessions 3 and 7 import
  this — make it clean and general.
- **Scenes (3):**
  - (a) `pv-diagram-scene.tsx` — interactive PV plane; drag the state point to
    sketch a path; shade the area as work; toggle the four canonical processes.
  - (b) `cycle-work-scene.tsx` — a closed loop; "run cycle" animates the point;
    net work = enclosed area as a number; reverse button flips engine ↔ fridge.
  - (c) `reversible-vs-irreversible-scene.tsx` — slow quasi-static expansion vs
    sudden release; same final state, but the slow one does more work and reverses.

### 3. `isothermal-and-adiabatic-processes` — FIG.07

Pump a tyre fast and the barrel scalds; slow and it barely warms. Isothermal
(T fixed, ΔU = 0 for ideal gas, Q = W = nRT ln(V₂/V₁)); adiabatic (Q = 0,
ΔU = −W, PV^γ = const); the adiabatic exponent γ = C_p/C_v (5/3 monatomic, 7/5
diatomic — full reason in FIG.17); diesel ignition and adiabatic cloud formation;
Joule's free expansion (no work, no heat, no ΔT for an ideal gas ⟹ U = U(T)).
7 sections.

- **Physics lib:** `lib/physics/thermodynamics/processes.ts` — isothermal/
  adiabatic work and final-state formulas; reuses `pv-plot.ts` for rendering.
- **Scenes (3):**
  - (a) `isothermal-vs-adiabatic-scene.tsx` — compress by the same ΔV along an
    isotherm and an adiabat from the same start; the adiabat ends hotter and
    higher-P; both final P and T readout.
  - (b) `bicycle-pump-scene.tsx` — hand pump with a speed slider; slow ≈
    isothermal, fast ≈ adiabatic; a thermometer on the barrel.
  - (c) `cloud-formation-scene.tsx` — a moist air parcel rises, expands
    adiabatically, cools; droplets appear at the lifting condensation level.

---

## Reference ownership (you CREATE these; others only reference)

### Physicists (append to `lib/content/physicists.ts` + seed `thermo-module-2.json`)

`julius-von-mayer` (1814–1878, German), `sadi-carnot` (1796–1832, French — first
introduced here in the FIG.06 aside, fully profiled by session 3 in FIG.08; you
own the entry).

Already exist (reference freely, do NOT recreate): `james-prescott-joule`,
`hermann-von-helmholtz`, `simeon-denis-poisson` (FIG.07 — derived PV^γ = const).

### Dictionary terms (append to `lib/content/glossary.ts` + seed `thermo-module-2.json`)

`internal-energy`, `first-law-of-thermodynamics`, `state-function`,
`work-thermodynamic`, `pv-diagram`, `isobaric-process`, `isochoric-process`,
`isothermal-process`, `adiabatic-process`, `reversible-process`,
`quasi-static-process`, `adiabatic-exponent`, `free-expansion`, `heat-reservoir`.

Owned by other sessions (reference but do NOT create): `heat-engine`,
`carnot-cycle` (s3). Already in `glossary.ts` (reuse instead of creating):
`heat`, `work`.

---

Build FIG.06 first — its `pv-plot.ts` helper is imported by sessions 3 and 7, so
landing it early unblocks them. Good luck.
