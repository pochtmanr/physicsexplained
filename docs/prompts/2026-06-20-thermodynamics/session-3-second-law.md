# Session 3 — Module 3 · The Second Law (3 topics)

You are content session **s3-second-law** of a 9-session parallel sprint finishing
the Thermodynamics branch (§04) of physicsexplained.

**First:** read `docs/prompts/2026-06-20-thermodynamics/SHARED.md` in
`/Users/roman/Developer/physics` and follow its workspace setup with
`SESSION-ID = s3-second-law`. All rules there apply. Raw material: the Module 3
FIG entries (FIG.08–10) in `docs/roadmap/03-thermodynamics.md`.

Module slug: `second-law`. Eyebrow on all three topics: `FIG.0N · THE SECOND LAW`.
This module is the pinnacle of classical thermodynamics — polish the Carnot and
entropy scenes especially.

---

## Your topics (eyebrows/titles/subtitles verbatim in `lib/content/branches.ts`)

### 1. `heat-engines-and-carnot` — FIG.08

Sadi Carnot, 28, publishes *Réflexions sur la puissance motrice du feu* (1824);
it sells poorly, he dies of cholera at 36, and the Second Law is built on it
twenty years later. What a heat engine is (Q_h in, W out, Q_c dumped); efficiency
η = W/Q_h; the central question (is there a maximum set by physics alone?); the
Carnot cycle (isothermal+adiabatic ×2, all reversible); η_Carnot = 1 − T_c/T_h,
independent of working substance; Carnot's theorem proven by reductio. 7 sections.

- **Physics lib:** `lib/physics/thermodynamics/carnot.ts` — Carnot-cycle state
  points, Q_h/Q_c/W, η = W/Q_h and η = 1 − T_c/T_h, plus a T–S representation.
  Reuses `lib/physics/thermodynamics/pv-plot.ts` (session 2).
- **Scenes (3):**
  - (a) `carnot-cycle-scene.tsx` — PV diagram, four Carnot segments; "run cycle"
    animates the gas; readouts Q_h, Q_c, W = Q_h − Q_c, η = W/Q_h, and the
    theoretical 1 − T_c/T_h — they match.
  - (b) `engine-efficiency-bars-scene.tsx` — real engines vs Carnot limit (coal
    plant, car engine, steam turbine, human muscle); hover for a one-line note.
  - (c) `ts-diagram-scene.tsx` — the T–S diagram where the Carnot cycle is a
    clean rectangle; previews entropy, setting up FIG.10.

### 2. `the-second-law` — FIG.09

Clausius, 1865, coins *Entropie* to rhyme with *Energie* and writes the two
sentences: "The energy of the universe is constant. The entropy of the universe
tends to a maximum." The directionality problem (the first law allows coffee to
spontaneously heat); the Clausius statement (no spontaneous cold→hot heat flow);
the Kelvin–Planck statement (no heat fully to work with no other effect);
equivalence of the two by reductio; perpetual motion of the second kind; the
Clausius inequality ∮dQ/T ≤ 0, the seed of entropy. 7 sections. Give Clausius's
German once, then translate.

- **Physics lib:** `lib/physics/thermodynamics/second-law.ts` — the two
  forbidden-engine constructions and the equivalence proof bookkeeping; the
  Clausius-inequality integral for a cycle.
- **Scenes (2):**
  - (a) `clausius-vs-kelvin-scene.tsx` — two forbidden engines side by side
    (spontaneous cold→hot vs heat-fully-to-work); drag a piece of one into the
    other to build the hybrid that shows the statements are equivalent.
  - (b) `perpetual-motion-scene.tsx` — an "ocean engine" with no cold reservoir
    fails (flagged); switch on a deep-ocean cold reservoir and it works, bounded
    by (T_surface − T_deep)/T_surface.

### 3. `entropy-and-the-clausius-inequality` — FIG.10

Clausius, 1854: ∮dQ/T = 0 for any reversible cycle, so dQ_rev/T is an exact
differential — he names it entropy, S. dS = dQ_rev/T as a state function; entropy
of an ideal gas across processes (a reversible adiabat is isentropic); entropy of
mixing (ΔS > 0 with no heat added — about available configurations, previewing
FIG.13); ΔS_system + ΔS_surroundings ≥ 0; heat death set up (return in FIG.29);
worked examples (heat Q from T_h to T_c, free expansion ΔS = nR ln(V₂/V₁)).
7 sections.

- **Physics lib:** `lib/physics/thermodynamics/entropy.ts` — ΔS for the canonical
  ideal-gas processes, entropy-of-mixing, and ΔS_universe for reversible vs
  irreversible heat transfer.
- **Scenes (3):**
  - (a) `entropy-mixing-scene.tsx` — red and blue gases in separate halves; pull
    the partition; molecules interdiffuse; ΔS(t) saturates at the mixing value.
  - (b) `reversible-vs-irreversible-ds-scene.tsx` — heat T_h→T_c via a Carnot
    engine (ΔS_universe = 0) vs directly (ΔS_universe > 0); bars for both.
  - (c) `ts-diagram-redux-scene.tsx` — T–S diagrams of Carnot (rectangle), Otto,
    and Diesel cycles; enclosed area = net work.

---

## Reference ownership (you CREATE these; others only reference)

### Physicists (append to `lib/content/physicists.ts` + seed `thermo-module-3.json`)

`lazare-carnot` (1753–1823, French — Sadi's father), `rudolf-clausius`
(1822–1888, German), `max-planck` (1858–1947, German — cameo here, full profile
in the Quantum branch), `ludwig-boltzmann` (1844–1906, Austrian — cameo here,
fully profiled by session 4 in FIG.12; you own the entry).

Already exist (reference freely, do NOT recreate): `sadi-carnot` (owned by
session 2), `lord-kelvin` (owned by session 1).

### Dictionary terms (append to `lib/content/glossary.ts` + seed `thermo-module-3.json`)

`heat-engine`, `carnot-cycle`, `carnot-efficiency`, `efficiency`,
`working-substance`, `second-law-of-thermodynamics`, `clausius-statement`,
`kelvin-planck-statement`, `perpetual-motion`, `clausius-inequality`, `entropy`,
`entropy-of-mixing`, `isentropic-process`, `heat-death` (stub here — you own the
entry; session 9 deepens it in FIG.29).

Owned by other sessions (reference but do NOT create): `heat-reservoir` (s2),
`microstate` / `macrostate` / `boltzmann-entropy-formula` (s4).

---

`entropy` and `second-law-of-thermodynamics` thread through nearly every later
topic, so write their seed definitions carefully — many sessions will link to
them. Good luck.
