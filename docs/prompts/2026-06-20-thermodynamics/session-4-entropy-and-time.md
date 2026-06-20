# Session 4 — Module 4 · Entropy & the Arrow of Time (3 topics)

You are content session **s4-entropy-time** of a 9-session parallel sprint
finishing the Thermodynamics branch (§04) of physicsexplained.

**First:** read `docs/prompts/2026-06-20-thermodynamics/SHARED.md` in
`/Users/roman/Developer/physics` and follow its workspace setup with
`SESSION-ID = s4-entropy-time`. All rules there apply. Raw material: the Module 4
FIG entries (FIG.11–13) in `docs/roadmap/03-thermodynamics.md`.

Module slug: `entropy-and-time`. Eyebrow on all three topics:
`FIG.NN · ENTROPY & TIME`.

---

## Your topics (eyebrows/titles/subtitles verbatim in `lib/content/branches.ts`)

### 1. `microstates-and-macrostates` — FIG.11

Toss ten coins: "five heads" has 252 microstates, "ten heads" has exactly one.
Microstate (every molecule's position and velocity); macrostate (what you
measure: P, V, T, N); multiplicity Ω; the fundamental postulate (all microstates
of an isolated system in equilibrium are equally probable); why we see large Ω
(counting, not prohibition); the two-box gas (C(N,k), binomially peaked at N/2
with width √(N/4), so deviations vanish for N = 10²³). 7 sections.

- **Physics lib:** `lib/physics/thermodynamics/multiplicity.ts` — binomial
  multiplicity C(N,k), the Gaussian limit, and two-box occupancy statistics.
  Reuses `lib/physics/thermodynamics/random.ts` (seeded RNG — create it here if
  not present; sessions 5 and 7 reuse it).
- **Scenes (2):**
  - (a) `coin-multiplicity-scene.tsx` — toss N coins (slider 10→1000); histogram
    of heads-count fits a Gaussian centred at N/2, width √N/2; the peak sharpens.
  - (b) `two-box-gas-scene.tsx` — N molecules in a two-chamber box; live
    histogram of left-chamber occupancy; wild for small N, pinned near 0.5 for
    large N.

### 2. `boltzmanns-entropy-formula` — FIG.12

Boltzmann, Vienna, 1877: S = k log W, later carved on his Zentralfriedhof
tombstone. The formula S = k_B ln Ω; why a logarithm (S extensive, Ω
multiplicative); why k_B (the kelvin↔joule bridge, k_B T the thermal energy
scale); recovering thermodynamics (Sackur–Tetrode, PV = NkT); the microscopic
second law as a counting truth; Boltzmann's tragedy (Mach and Ostwald's
opposition, his suicide at Duino 1906, vindicated by Einstein's 1905 Brownian
work he never fully knew). 7 sections.

- **Physics lib:** `lib/physics/thermodynamics/boltzmann-entropy.ts` — S = k ln Ω,
  and the multiplicity→entropy bridge matching the FIG.10 mixing entropy.
- **Scenes (2):**
  - (a) `boltzmann-tombstone-scene.tsx` — stylised tombstone with the formula;
    hover each symbol (S, k, log, W) for meaning; "derive" animates multiplicity
    counting → formula.
  - (b) `multiplicity-to-entropy-scene.tsx` — two gas chambers; compute Ω₁, Ω₂
    before/after mixing; k ln Ω for each; the difference matches the FIG.10
    mixing entropy, confirming the bridge.

### 3. `the-arrow-of-time` — FIG.13

A smashing wine glass run backwards violates no Newtonian law, yet we know which
way time flows. Time-reversal symmetry of microphysics; the statistical
macroscopic arrow; Loschmidt's paradox (1876 — and Boltzmann's answer: low-entropy
initial conditions); Zermelo's recurrence paradox (1896 — Poincaré recurrence,
but the time is unthinkably long); the past hypothesis (the Big Bang began in an
extraordinarily low-entropy state); Maxwell's demon introduced (resolution
deferred to FIG.20 — Szilard, Landauer, Bennett). 7 sections.

- **Physics lib:** `lib/physics/thermodynamics/irreversibility.ts` — a
  diffusing-gas model with velocity-reversal, and a k ln 2 per-bit erasure cost
  bookkeeping for the demon. Reuses `random.ts`.
- **Scenes (3):**
  - (a) `reversible-movies-scene.tsx` — billiard-ball collisions (plausible both
    ways) vs a shattering glass (obviously wrong backwards); caption: the
    difference is entropy.
  - (b) `loschmidt-reversal-scene.tsx` — a gas diffuses to equilibrium; "reverse
    all velocities" un-mixes it for a few steps until round-off destroys the
    reversal and it re-mixes.
  - (c) `maxwells-demon-scene.tsx` — a demon at a trap-door sorts fast/slow
    molecules into hot/cold chambers; toggle "demon memory" — forced erasure
    raises entropy by exactly k ln 2 per bit.

---

## Reference ownership (you CREATE these; others only reference)

### Physicists (append to `lib/content/physicists.ts` + seed `thermo-module-4.json`)

`wilhelm-ostwald` (1853–1932, Baltic-German), `josef-loschmidt` (1821–1895,
Austrian), `ernst-zermelo` (1871–1953, German).

Already exist (reference freely, do NOT recreate): `ludwig-boltzmann` (owned by
session 3), `james-clerk-maxwell`, `ernst-mach`, `arthur-eddington`.

### Dictionary terms (append to `lib/content/glossary.ts` + seed `thermo-module-4.json`)

`microstate`, `macrostate`, `multiplicity`,
`fundamental-postulate-of-statistical-mechanics`, `boltzmann-constant` (unit:
`constant`), `boltzmann-entropy-formula`, `extensive-quantity`,
`intensive-quantity`, `arrow-of-time`, `loschmidt-paradox`, `poincare-recurrence`,
`past-hypothesis`, `maxwells-demon` (stub here — you own the entry; session 6
resolves it in FIG.20), `ensemble` (stub here — you own the entry; session 6
adds the specific micro/canonical/grand-canonical ensembles).

Owned by other sessions (reference but do NOT create): `entropy` (s3),
`ensemble` / `partition-function` (s6). Note `boltzmann-factor` is owned by
session 5 (FIG.16) — reference it, don't create it.

---

This is the conceptual heart of the branch — the arrow-of-time topic earns its
14-minute read. Make the Loschmidt and demon scenes genuinely interactive. Good
luck.
