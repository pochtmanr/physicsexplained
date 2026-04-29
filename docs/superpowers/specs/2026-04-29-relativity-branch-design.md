# Relativity — Branch Design

**Date:** 2026-04-29
**Status:** in progress — 20/61 topics shipped (33%); §01+§02+§03+§04 shipped 2026-04-29
**Repo:** `/Users/romanpochtman/Developer/physics`
**Supabase project:** `cpcgkkedcfbnlfpzutrc` (`physics.explained`, eu-west-1)
**Supersedes:** the `coming-soon` stub at `lib/content/branches.ts:987-998`.

## Goal

Build the RELATIVITY branch as the third fully-authored branch on `physics.explained`, at Distill.pub quality and Wikipedia-scale coverage. Match EM's depth (66 topics, 12 modules); cover SR + GR + cosmology + frontiers without gaps a physicist would flag — Hartle / Schutz / Carroll-grade for GR, Griffiths Ch 12 / Taylor & Wheeler-grade for SR.

EM closed on §11.4 magnetism-as-relativistic-electrostatics with explicit forward-refs to "the future RELATIVITY branch." This branch picks them up. SR is built carefully so that the prerequisite §11 used inline becomes the canonical treatment here. GR is then built on top.

**Scope target:** 13 modules, 61 topics. (Slightly expanded module count vs EM: 13 not 12, because GR pedagogy splits cleanly along EP / tensors / curvature / Schwarzschild / black holes / GW / cosmology / frontiers — collapsing any pair leaves a gap.)

## Scope

**In scope**
- 13 modules, 61 topics in the existing topic shell (`page.tsx` + `content.en.mdx`, `TopicPageLayout`, `TopicHeader`, numbered `Section`s, `SceneCard`s, `EquationBlock`s, `Callout`s).
- Per-topic physics lib under `lib/physics/relativity/*.ts`. Pure TS, no React, vitest-tested.
- Bespoke visualization components under `components/physics/` — 3–4 per topic, registered in `simulation-registry.ts`. Estimated ~200 new components (61 topics × avg 3.3).
- FIG identifiers `FIG.01 · SR FOUNDATIONS` through `FIG.61 · FRONTIERS`, sequential across the branch (matches CM/EM convention of restarting FIG numbering per branch).
- ~17–20 new physicists in `lib/content/physicists.ts` (counts physicists already present from CM/EM as reusable; many of them — Einstein, Lorentz, Poincaré, Minkowski, Hilbert, Weyl, Klein, Fizeau, Foucault, Doppler, Slipher, Dirac, Feynman, Noether — are already there).
- ~50 net new glossary terms (some — `four-vector`, `lorentz-factor` — already exist from EM §11).
- English `content.en.mdx` for all 61 topics. Hebrew stubs deferred to bulk machine-translation after English ships.
- `pnpm content:publish` per module to push rows into Supabase.
- Flip branch status from `coming-soon` to `live` in `lib/content/branches.ts`.
- Update `getAdjacentTopics()` so prev/next threads through Relativity after Electromagnetism.

**Out of scope**
- Hebrew translations beyond machine-translated first pass.
- Numerical relativity (Pretorius 2005 binary-BH merger code) — gestured at, not derived.
- Detailed astrophysics: stellar collapse, neutron-star equations of state, accretion-disk physics — only what BHs and GW170817 require.
- Quantum gravity (string, loop, AdS/CFT) — gestured at in §13, not derived.
- Mathematical relativity (Penrose-Hawking proof internals, ADM formalism, asymptotic flatness theorems) — gestured at, not derived.
- Cosmological perturbation theory and structure formation — one-paragraph nod inside §12.5; full treatment is future work.
- Other branches (Thermodynamics, Quantum, Modern) — future specs.
- Mobile client work beyond Supabase pipeline already doing its job.
- New content-pipeline infrastructure — the existing MDX → parser → Supabase → `<ContentBlocks>` path handles everything.

## Voice, audience, and calculus policy

**Audience:** curious adult, high-school physics behind them, no calculus assumed but shown. Same as CM and EM.

**Voice:** Kurzgesagt meets Stripe docs. Short declarative sentences. Historical hooks where they serve the physics. No filler.

**Calculus policy — Option A (extending the CM/EM convention):**
- SR is largely algebraic (Lorentz transforms, four-vectors). GR is tensor calculus from §07 onward, the densest math the site has shipped.
- Every topic that uses tensor index notation, covariant derivatives, parallel transport, or curved-space integrals must explain the symbol **in its local context**, in plain words, before the equation form.
- Tensor index notation (`F^{\mu\nu}`, `R^\rho{}_{\sigma\mu\nu}`, `\nabla_\mu T^{\mu\nu}`) is unavoidable in §07–§13. Use the EM Session 7 escape rules: double backslashes inside `tex={\`...\`}` template literals.
- Side notes (`Callout math`) carry the denser derivations so the main narrative stays readable.
- Redundancy across topics is a feature: every topic remains standalone. A reader landing on `/relativity/the-schwarzschild-metric` from a search engine never needs to have read `/relativity/the-metric-tensor` first.
- When introducing a new tensor-calc idea for the first time, margin-aside to the relevant `/dictionary/<slug>`.

**Money-shot principle:** every module has at least one signature animation or visual reveal. Listed per module.

## Branch metadata

To be written into `lib/content/branches.ts` when the branch flips to `live`:

```ts
{
  slug: "relativity",
  index: 3,
  title: "RELATIVITY",
  eyebrow: "§ 03",
  subtitle: "The geometry of moving and falling.",
  description:
    "Special relativity erased the line between space and time and made E=mc² a fact about geometry. General relativity erased the line between gravity and curvature and made the universe expand. Together they give the rules light obeys, the rules clocks obey, and the rules black holes do not let escape — the longest-running winning streak in 20th-century physics.",
  modules: RELATIVITY_MODULES,
  topics: RELATIVITY_TOPICS,
  status: "live",
}
```

## Module structure

Thirteen modules, sequential. Each module's topics are numbered in reading order; the FIG sequence runs FIG.01 → FIG.61.

---

### §01 SR foundations — FIG.01–05

The collapse of Newton's stage. Galilean relativity, the speed-of-light puzzle hidden inside Maxwell's equations, the Michelson-Morley shutdown of the aether, Einstein's two postulates, the breakdown of "now."

| # | Slug | Title | Subtitle | Min |
|---|------|-------|----------|-----|
| 01 | `galilean-relativity` | GALILEAN RELATIVITY AND THE FRAME PROBLEM | Why Newton's universe needed an observer who never moved. | 9 |
| 02 | `maxwell-and-the-speed-of-light` | MAXWELL AND THE SPEED OF LIGHT | The constant hiding in two SI numbers, and what it didn't depend on. | 10 |
| 03 | `michelson-morley` | THE MICHELSON-MORLEY EXPERIMENT | An interferometer asks the wind which way it blows, and gets no answer. | 11 |
| 04 | `einsteins-two-postulates` | EINSTEIN'S TWO POSTULATES | Drop one assumption, take one fact at face value, get a new universe. | 10 |
| 05 | `relative-simultaneity` | THE RELATIVITY OF SIMULTANEITY | Two lightning bolts strike — and the train passenger disagrees with you about which came first. | 11 |

**Money shot:** `michelson-morley` — interferometer animation showing the expected aether-wind fringe shift NOT appearing as the apparatus rotates 90°. Predicted shift overlaid as dashed trace; observed shift as solid trace; the lines never meet. The aether dies on screen.

---

### §02 SR kinematics — FIG.06–10

Time dilation, length contraction, the Lorentz transformation, velocity addition, and the relativistic Doppler effect — the algebra of moving clocks and rulers, derived from the postulates.

| # | Slug | Title | Subtitle | Min |
|---|------|-------|----------|-----|
| 06 | `time-dilation` | TIME DILATION | Why a moving clock ticks slower — and why this is not an illusion. | 12 |
| 07 | `length-contraction` | LENGTH CONTRACTION | Why a moving rod is shorter — and why no one moving with it can tell. | 11 |
| 08 | `the-lorentz-transformation` | THE LORENTZ TRANSFORMATION | The four lines of algebra that replaced Galileo. | 13 |
| 09 | `velocity-addition` | RELATIVISTIC VELOCITY ADDITION | Why nothing made of matter ever crosses 299,792,458 m/s. | 11 |
| 10 | `relativistic-doppler` | THE RELATIVISTIC DOPPLER EFFECT | What the source's color tells you about its motion through spacetime. | 11 |

**Money shot:** `time-dilation` — atmospheric muon shower: muons created at ~10 km altitude with rest-frame half-life τ = 2.2 μs. At 99.5%c they would classically travel only ~660 m before half decay. Sea-level detectors observe ~7× the classical survival rate; γ ≈ 10 explains it exactly. Two clocks side by side: lab clock 22 μs, muon proper-time 2.2 μs. Both correct.

---

### §03 Spacetime geometry — FIG.11–15

Minkowski's 1908 reformulation. Spacetime as a 4D pseudo-Euclidean manifold. Worldlines, light cones, the invariant interval, four-vectors, proper time. The geometric language SR was always trying to speak.

| # | Slug | Title | Subtitle | Min |
|---|------|-------|----------|-----|
| 11 | `spacetime-diagrams` | SPACETIME DIAGRAMS AND WORLDLINES | Draw a clock's life as a single line on a piece of paper. | 11 |
| 12 | `the-invariant-interval` | THE INVARIANT INTERVAL | The one quantity every observer must agree on. | 12 |
| 13 | `light-cones-and-causality` | LIGHT CONES AND CAUSALITY | The shape spacetime gives "before" and "after" — and "neither." | 11 |
| 14 | `four-vectors-and-proper-time` | FOUR-VECTORS AND PROPER TIME | The invariant heartbeat of every traveler in spacetime. | 12 |
| 15 | `the-twin-paradox` | THE TWIN PARADOX | The longest worldline in spacetime is also the shortest in proper time. | 13 |

**Money shot:** `the-twin-paradox` — Minkowski diagram with the home twin (straight worldline) and the traveling twin (kinked worldline with turnaround). Both worldlines tick proper time on themselves; the kinked one tallies less. The geometric meaning of acceleration: the bend in the line, not a fictitious force that "ages you slower." The proper-time integral overlaid step-by-step.

---

### §04 Relativistic dynamics — FIG.16–20

Four-momentum and E=mc². The 1905 sequel paper. Mass-energy equivalence as the deepest bookkeeping fact in physics. Relativistic collisions, Compton scattering, threshold energies, pair production.

| # | Slug | Title | Subtitle | Min |
|---|------|-------|----------|-----|
| 16 | `four-momentum` | FOUR-MOMENTUM | Energy and momentum, packaged into one object that transforms as a vector. | 12 |
| 17 | `mass-energy-equivalence` | MASS-ENERGY EQUIVALENCE | Why a hot cup of coffee weighs more than a cold one. | 13 |
| 18 | `relativistic-collisions` | RELATIVISTIC COLLISIONS | Conservation of four-momentum, and what changes when speeds get high. | 12 |
| 19 | `compton-scattering` | COMPTON SCATTERING | The 1923 experiment that finally made photons mechanical. | 11 |
| 20 | `threshold-energy-and-pair-production` | THRESHOLD ENERGY AND PAIR PRODUCTION | Why a 1.022 MeV gamma ray can become two electrons but a 511 keV one cannot. | 12 |

**Money shot:** `mass-energy-equivalence` — animated binding-energy-per-nucleon curve from H to U, with iron at the peak. Annotated: the entire energy budget of the sun (fusion, left of iron) and every nuclear reactor (fission, right of iron) is the area under this curve. E=mc² as the conversion factor between binding energy and the actual mass deficit Δm — measurable on a high-precision balance.

---

### §05 SR applications and paradoxes — FIG.21–24

The SR victory lap: the barn-pole "paradox," Bell's spaceship, GPS, and the precision tests of Lorentz invariance that put SR in the most-tested-theory-in-physics tier.

| # | Slug | Title | Subtitle | Min |
|---|------|-------|----------|-----|
| 21 | `the-barn-pole-paradox` | THE BARN-POLE PARADOX | Two observers, two answers, no contradiction. | 11 |
| 22 | `bells-spaceship-paradox` | BELL'S SPACESHIP PARADOX | A string between two synchronized rockets, and the geometry that snaps it. | 11 |
| 23 | `gps-as-relativity` | GPS AS A WORKING RELATIVITY EXPERIMENT | Without two corrections, your position drifts ten kilometers a day. | 12 |
| 24 | `precision-tests-of-sr` | PRECISION TESTS OF LORENTZ INVARIANCE | What happens when a theory survives a hundred years of being checked. | 11 |

**Money shot:** `gps-as-relativity` — orbit of a GPS satellite with two clock-correction overlays: SR (kinematic, slows the orbiting clock by ~7 μs/day) and GR (gravitational, speeds it up by ~45 μs/day). Net correction ~38 μs/day — exactly what's coded into every receiver firmware on Earth. A working relativity experiment in everyone's pocket.

---

### §06 The equivalence principle — FIG.25–28

The bridge from SR to GR. Inertial mass = gravitational mass, the Eötvös experiment, Einstein's elevator, gravitational redshift derived from EP alone (no field equations yet). The "happiest thought" of Einstein's life, and how it sets up gravity-as-geometry.

| # | Slug | Title | Subtitle | Min |
|---|------|-------|----------|-----|
| 25 | `inertial-vs-gravitational-mass` | INERTIAL VS GRAVITATIONAL MASS | Why two completely different definitions give the same number to thirteen decimal places. | 12 |
| 26 | `einsteins-elevator` | EINSTEIN'S ELEVATOR | A free-falling lab is a frame where gravity has been canceled. | 11 |
| 27 | `gravitational-redshift` | GRAVITATIONAL REDSHIFT | Climb out of a gravity well and your photons get tired. | 12 |
| 28 | `gravity-as-geometry` | GRAVITY AS GEOMETRY | The equivalence principle's geometric implication: there is no force, only curvature. | 12 |

**Money shot:** `gravitational-redshift` — Pound-Rebka 1960 setup: 22.5-meter Harvard tower, gamma-ray source at top, Mössbauer absorber at bottom, observed shift Δν/ν = gh/c² ≈ 2.46 × 10⁻¹⁵, predicted exactly. The first laboratory test of GR, derivable from the equivalence principle alone.

---

### §07 Curved spacetime and tensor calculus — FIG.29–33

The math machinery without which §08 is unreadable. Manifolds, tangent spaces, the metric tensor, Christoffel symbols, parallel transport, geodesics. Built carefully — the densest module of the branch.

| # | Slug | Title | Subtitle | Min |
|---|------|-------|----------|-----|
| 29 | `manifolds-and-tangent-spaces` | MANIFOLDS AND TANGENT SPACES | Curved spaces and the flat ones that approximate them point by point. | 13 |
| 30 | `tensors-on-curved-space` | TENSORS ON CURVED SPACE | Indexed objects that don't lie about which way they point. | 13 |
| 31 | `the-metric-tensor` | THE METRIC TENSOR | The object that turns coordinate differences into actual distances. | 13 |
| 32 | `christoffels-and-parallel-transport` | CHRISTOFFELS AND PARALLEL TRANSPORT | The connection that says what "stays parallel" means on a curved surface. | 13 |
| 33 | `geodesics` | GEODESICS | The straightest possible lines, and why falling apples follow them. | 13 |

**Money shot:** `christoffels-and-parallel-transport` — vector parallel-transported along three sides of a spherical triangle (equator → 90°-meridian → equator), arriving rotated by an angle equal to the enclosed area. The holonomy reveal: curvature shows up as a rotation that flat spaces can't produce.

---

### §08 Riemann curvature and Einstein's equations — FIG.34–38

The Riemann tensor as the local measure of curvature, the Ricci contraction, the Einstein tensor's geometric necessity (Bianchi identities), the stress-energy tensor as the source, and Einstein's field equations. Plus the Newtonian limit that recovers Poisson's equation for gravity.

| # | Slug | Title | Subtitle | Min |
|---|------|-------|----------|-----|
| 34 | `the-riemann-tensor` | THE RIEMANN CURVATURE TENSOR | Twenty independent numbers per point that say exactly how a space is bent. | 13 |
| 35 | `ricci-and-the-einstein-tensor` | RICCI, SCALAR CURVATURE, AND THE EINSTEIN TENSOR | The contractions that make a divergence-free curvature object. | 12 |
| 36 | `the-stress-energy-tensor` | THE STRESS-ENERGY TENSOR | Energy, momentum, pressure, and stress, all in one object. | 12 |
| 37 | `einsteins-field-equations` | EINSTEIN'S FIELD EQUATIONS | Spacetime tells matter how to move; matter tells spacetime how to curve. | 14 |
| 38 | `the-newtonian-limit` | THE NEWTONIAN LIMIT | Where GR gives back Newton, and where it refuses. | 11 |

**Money shot:** `einsteins-field-equations` — split-screen: matter distribution (a non-rotating mass sphere) on one side, the resulting curvature contraction (Ricci scalar) on the other, with the equation `G_{μν} = (8πG/c⁴) T_{μν}` between them. Pull the slider on T (mass density) and watch the curvature respond. The single most quoted equation in 20th-century physics, finally readable.

---

### §09 Schwarzschild and the classical tests — FIG.39–43

The 1916 Schwarzschild solution to the vacuum field equations outside a spherical mass. Mercury's perihelion, light deflection (Eddington 1919), gravitational redshift in Schwarzschild, Shapiro delay (the radar test). The four classical tests of GR, in historical order.

| # | Slug | Title | Subtitle | Min |
|---|------|-------|----------|-----|
| 39 | `the-schwarzschild-metric` | THE SCHWARZSCHILD METRIC | The first exact solution to Einstein's equations, solved in a trench in 1915. | 13 |
| 40 | `mercurys-perihelion` | MERCURY'S PERIHELION | A 43-arcsecond-per-century mismatch that closed seventy years of guesswork. | 12 |
| 41 | `light-deflection-and-lensing` | LIGHT DEFLECTION AND GRAVITATIONAL LENSING | A May 1919 eclipse photograph, Einstein on the front page of every newspaper. | 12 |
| 42 | `shapiro-delay` | THE SHAPIRO TIME DELAY | Light slowed not by mass but by the geometry the mass produces. | 11 |
| 43 | `the-classical-tests-summary` | THE CLASSICAL TESTS — A WHOLE THEORY ON TRIAL | Four independent predictions, four confirmed observations, one theory standing. | 10 |

**Money shot:** `mercurys-perihelion` — Mercury's orbit animated under Newton (closed ellipse) vs Schwarzschild (rosette precessing 43″/century). Both overlaid; the rosette traces out exactly the historical mismatch Le Verrier had charted in 1859 and that Newton's theory could not explain.

---

### §10 Black holes — FIG.44–49

The horizon. Kruskal extension. Kerr (rotating) and the ergosphere. Penrose diagrams. The no-hair theorem. Black-hole thermodynamics (area theorem, Bekenstein bound). Hawking radiation as a semiclassical preview.

| # | Slug | Title | Subtitle | Min |
|---|------|-------|----------|-----|
| 44 | `the-event-horizon` | THE EVENT HORIZON | The one-way membrane, what it looks like to the infaller, and what it doesn't. | 13 |
| 45 | `kerr-and-the-ergosphere` | KERR BLACK HOLES AND THE ERGOSPHERE | Spinning spacetime drags everything inside it along for the ride. | 12 |
| 46 | `penrose-diagrams` | PENROSE DIAGRAMS AND CAUSAL STRUCTURE | Compactify infinity; learn what a black hole's interior actually looks like. | 13 |
| 47 | `no-hair-theorem` | THE NO-HAIR THEOREM | Three numbers describe every black hole: mass, charge, spin. | 11 |
| 48 | `black-hole-thermodynamics` | BLACK-HOLE THERMODYNAMICS | The area theorem, Bekenstein entropy, and why a black hole is a thermal object. | 12 |
| 49 | `hawking-radiation` | HAWKING RADIATION | A semiclassical preview: even the blackest hole evaporates. | 12 |

**Money shot:** `kerr-and-the-ergosphere` — rotating Kerr black hole rendered with the ergosphere (oblate region outside the horizon where you cannot stay still) and frame-dragging streamlines. A test particle entering the ergosphere is forced to co-rotate; entering the horizon is final. The Penrose process as the energy-extraction story.

---

### §11 Gravitational waves — FIG.50–53

Linearized gravity, TT gauge, polarization modes (+ and ×), the quadrupole formula, binary inspirals, the LIGO 2015 detection (GW150914), multi-messenger astronomy (GW170817 with the kilonova).

| # | Slug | Title | Subtitle | Min |
|---|------|-------|----------|-----|
| 50 | `linearized-gravity` | LINEARIZED GRAVITY | Small ripples in a flat background, governed by a wave equation. | 12 |
| 51 | `polarization-modes` | THE TWO POLARIZATIONS — PLUS AND CROSS | What a gravitational wave does to a ring of free-floating test masses. | 11 |
| 52 | `binary-inspiral-and-the-chirp` | BINARY INSPIRAL AND THE CHIRP | Two black holes spiraling in; the waveform's frequency rises like a chirp. | 12 |
| 53 | `ligo-and-multi-messenger` | LIGO AND MULTI-MESSENGER ASTRONOMY | GW150914, GW170817, and what it means to hear the universe instead of seeing it. | 12 |

**Money shot:** `binary-inspiral-and-the-chirp` — animated binary BH inspiral with the TT-gauge waveform on a strip below; frequency rises as separation shrinks; final ringdown after merger. Overlay the actual GW150914 strain data — the animation matches the detection within the noise envelope.

---

### §12 Cosmology — FIG.54–58

The cosmological principle, the FLRW metric, Friedmann's equations, Hubble's law and cosmological redshift, the CMB and Big Bang nucleosynthesis, dark matter, dark energy, ΛCDM, accelerating expansion.

| # | Slug | Title | Subtitle | Min |
|---|------|-------|----------|-----|
| 54 | `the-flrw-metric` | THE FLRW METRIC | The geometry the universe picked out for itself. | 12 |
| 55 | `friedmann-equations` | FRIEDMANN'S EQUATIONS | Two ODEs that govern the expansion of everything. | 13 |
| 56 | `hubble-and-cosmological-redshift` | HUBBLE AND COSMOLOGICAL REDSHIFT | Why distant galaxies' light is stretched, and what is doing the stretching. | 12 |
| 57 | `the-cmb-and-nucleosynthesis` | THE CMB AND BIG BANG NUCLEOSYNTHESIS | The leftover heat and the first three minutes' worth of helium. | 13 |
| 58 | `dark-matter-and-dark-energy` | DARK MATTER AND DARK ENERGY | What 95% of the universe's mass-energy budget is — and what we still don't know about it. | 13 |

**Money shot:** `dark-matter-and-dark-energy` — Hubble diagram with Type Ia supernovae out to z ≈ 1.5; matter-only ΛCDM (Λ=0) prediction and observed-Λ ΛCDM prediction overlaid. The data points cluster on the latter — the 1998 discovery (Perlmutter / Schmidt / Riess) that the universe's expansion is accelerating. Λ is back, and the universe is mostly something we cannot see.

---

### §13 Frontiers — FIG.59–61

The branch's epilogue. Where GR ends and what's next. Singularity theorems (Penrose 1965, Hawking 1970). The information paradox. A one-paragraph quantum-gravity stub.

| # | Slug | Title | Subtitle | Min |
|---|------|-------|----------|-----|
| 59 | `singularity-theorems` | THE PENROSE-HAWKING SINGULARITY THEOREMS | When does GR predict its own breakdown? | 12 |
| 60 | `the-information-paradox` | THE INFORMATION PARADOX | Hawking radiation says yes, unitarity says no, and the answer is still being argued. | 13 |
| 61 | `what-relativity-doesnt-say` | WHAT RELATIVITY DOESN'T SAY | A century of winning streak, and the wall it has not yet broken through. | 11 |

**Money shot:** `the-information-paradox` — Penrose diagram of a black hole's full life cycle: collapse, Hawking-evaporation, the Cauchy surface threading both. The conflict drawn explicitly: the information that fell in vs the thermal radiation coming out — same number of qubits, but how does one map to the other? The Page curve overlaid as the modern resolution attempt.

---

## Suggested session plan

Six sessions, modules grouped by natural pedagogical affinity. SR fits cleanly in three sessions (foundations+kinematics; geometry+dynamics; applications+EP); GR splits in three (tensor+EFE; Schwarzschild+BH; GW+cosmology+frontiers). Each session targets ~10 topics — the EM-Sessions 4/5 throughput rate, sustainable in ~1 hour with parallel-agent dispatch.

| Session | Modules | Topics | Focus |
|---------|---------|--------|-------|
| 1 | §01 + §02 | 10 | SR foundations — postulates → kinematics |
| 2 | §03 + §04 | 10 | SR geometry → dynamics |
| 3 | §05 + §06 | 8 | SR applications → equivalence principle (bridge to GR) |
| 4 | §07 + §08 | 10 | Tensor calculus → Einstein's equations (densest math of the branch) |
| 5 | §09 + §10 | 11 | Schwarzschild + classical tests → black holes |
| 6 | §11 + §12 + §13 | 12 | Gravitational waves → cosmology → frontiers (closes the branch) |

Total: 6 sessions, 61 topics. Sessions 4 and 6 are the heaviest; if scope balloons, 4 splits into 4a (§07) + 4b (§08), and 6 splits into 6a (§11+§12) + 6b (§13).

Dependency constraints:
- §02 requires §01 (postulates → kinematic consequences).
- §03 requires §02 (Lorentz transforms → spacetime geometry).
- §04 requires §03 (four-vectors → four-momentum).
- §06 requires §05 (or stands alone — EP can also be taught straight after §02; we put it after §05 so SR is fully done first and the EP module flows clean into §07).
- §07 requires §06 (gravity-as-geometry sets up the manifold language).
- §08 requires §07.
- §09 requires §08 (Schwarzschild is a solution of EFE).
- §10 requires §09.
- §11 requires §08 (linearized gravity is a perturbation around flat).
- §12 requires §08.
- §13 requires §10 + §12.

## Progress matrix

Update this table at the end of every session.

### Module status

| Module | Count | Done | Status |
|--------|-------|------|--------|
| §01 SR foundations | 5 | 5 | ☑ complete |
| §02 SR kinematics | 5 | 5 | ☑ complete |
| §03 Spacetime geometry | 5 | 5 | ☑ complete |
| §04 Relativistic dynamics | 5 | 5 | ☑ complete |
| §05 SR applications | 4 | 0 | not started |
| §06 Equivalence principle | 4 | 0 | not started |
| §07 Tensor calculus | 5 | 0 | not started |
| §08 Curvature & EFE | 5 | 0 | not started |
| §09 Schwarzschild + tests | 5 | 0 | not started |
| §10 Black holes | 6 | 0 | not started |
| §11 Gravitational waves | 4 | 0 | not started |
| §12 Cosmology | 5 | 0 | not started |
| §13 Frontiers | 3 | 0 | not started |
| **Total** | **61** | **20** | **33% complete** |

### Per-topic checklist

Check off as each topic ships.
- [x] 01 `galilean-relativity`
- [x] 02 `maxwell-and-the-speed-of-light`
- [x] 03 `michelson-morley`
- [x] 04 `einsteins-two-postulates`
- [x] 05 `relative-simultaneity`
- [x] 06 `time-dilation`
- [x] 07 `length-contraction`
- [x] 08 `the-lorentz-transformation`
- [x] 09 `velocity-addition`
- [x] 10 `relativistic-doppler`
- [x] 11 `spacetime-diagrams`
- [x] 12 `the-invariant-interval`
- [x] 13 `light-cones-and-causality`
- [x] 14 `four-vectors-and-proper-time`
- [x] 15 `the-twin-paradox`
- [x] 16 `four-momentum`
- [x] 17 `mass-energy-equivalence`
- [x] 18 `relativistic-collisions`
- [x] 19 `compton-scattering`
- [x] 20 `threshold-energy-and-pair-production`
- [ ] 21 `the-barn-pole-paradox`
- [ ] 22 `bells-spaceship-paradox`
- [ ] 23 `gps-as-relativity`
- [ ] 24 `precision-tests-of-sr`
- [ ] 25 `inertial-vs-gravitational-mass`
- [ ] 26 `einsteins-elevator`
- [ ] 27 `gravitational-redshift`
- [ ] 28 `gravity-as-geometry`
- [ ] 29 `manifolds-and-tangent-spaces`
- [ ] 30 `tensors-on-curved-space`
- [ ] 31 `the-metric-tensor`
- [ ] 32 `christoffels-and-parallel-transport`
- [ ] 33 `geodesics`
- [ ] 34 `the-riemann-tensor`
- [ ] 35 `ricci-and-the-einstein-tensor`
- [ ] 36 `the-stress-energy-tensor`
- [ ] 37 `einsteins-field-equations`
- [ ] 38 `the-newtonian-limit`
- [ ] 39 `the-schwarzschild-metric`
- [ ] 40 `mercurys-perihelion`
- [ ] 41 `light-deflection-and-lensing`
- [ ] 42 `shapiro-delay`
- [ ] 43 `the-classical-tests-summary`
- [ ] 44 `the-event-horizon`
- [ ] 45 `kerr-and-the-ergosphere`
- [ ] 46 `penrose-diagrams`
- [ ] 47 `no-hair-theorem`
- [ ] 48 `black-hole-thermodynamics`
- [ ] 49 `hawking-radiation`
- [ ] 50 `linearized-gravity`
- [ ] 51 `polarization-modes`
- [ ] 52 `binary-inspiral-and-the-chirp`
- [ ] 53 `ligo-and-multi-messenger`
- [ ] 54 `the-flrw-metric`
- [ ] 55 `friedmann-equations`
- [ ] 56 `hubble-and-cosmological-redshift`
- [ ] 57 `the-cmb-and-nucleosynthesis`
- [ ] 58 `dark-matter-and-dark-energy`
- [ ] 59 `singularity-theorems`
- [ ] 60 `the-information-paradox`
- [ ] 61 `what-relativity-doesnt-say`

## Integration checklist (per topic)

Same shell, pipeline, and commit pattern as EM. Substitute `relativity` for `electromagnetism` in all paths.

1. **Content**
   - Create `app/[locale]/(topics)/relativity/<slug>/page.tsx` (Supabase-reading pattern; copy from any live EM topic).
   - Create `content/relativity/<slug>.en.mdx`.
   - Compose from `TopicPageLayout`, `TopicHeader`, `Section`, `SceneCard`, `EquationBlock`, `Callout`, `PhysicistLink`, `Term`, plus simulation components.

2. **Physics lib** (when math is non-trivial)
   - Create `lib/physics/relativity/<topic>.ts` with pure TS.
   - Add vitest tests under `tests/physics/relativity/<topic>.test.ts`.

3. **Simulations**
   - Create `components/physics/<topic>/<ComponentName>Scene.tsx` per figure.
   - Register each in `lib/content/simulation-registry.ts`.

4. **Data layer**
   - Add topic entry to `RELATIVITY_TOPICS` in `lib/content/branches.ts` (slug/title/eyebrow/subtitle/readingMinutes/status/module).
   - Add any new physicist to `PHYSICISTS` in `lib/content/physicists.ts` (check first; many are already there from CM/EM).
   - Add any new glossary term to `GLOSSARY` in `lib/content/glossary.ts` (check first).

5. **Publish**
   - `pnpm content:publish --only relativity/<slug>`.
   - `pnpm tsc --noEmit` and `pnpm vitest run` — both must stay green.
   - `pnpm build` for a smoke test before committing.

6. **Commit**
   - `feat(rel/§NN): <slug> — <one-liner>`.

7. **Progress table** — check the box in this spec.

## Once per module

- Update `RELATIVITY_MODULES` in `lib/content/branches.ts` when the first topic of a new module ships.
- Update the module's progress row in this document.

## Once for the branch

- When §01 ships, flip `relativity` `status` from `coming-soon` to `live` in `lib/content/branches.ts` so the branch page stops showing the email-signup form.
- When all 61 topics ship, run `pnpm content:translate --locale he` for the Hebrew machine-translation first pass.
- Update `components/sections/branches-section.tsx` subtitle copy ("three branches live" etc.).

## New physicists

ALREADY PRESENT (reuse, append `relatedTopics`):
- `albert-einstein`, `hendrik-antoon-lorentz`, `henri-poincare`, `hermann-minkowski` (added in EM Session 7), `david-hilbert`, `hermann-weyl`, `felix-klein`, `hippolyte-fizeau`, `leon-foucault`, `christian-doppler`, `vesto-slipher`, `paul-dirac`, `richard-feynman`, `emmy-noether`, `pierre-curie`, `urbain-le-verrier` (Mercury historical), `joseph-larmor` (precession analogy).

NET NEW (~17–20 across the branch; flag on a per-session basis):
- §01 — **Albert Michelson** (1852–1931) + **Edward Morley** (1838–1923).
- §06 — **Roland Eötvös** (1848–1919) optional, EP test; **Robert Pound** (1919–2010) + **Glen Rebka** (1931–2015) optional, the 1960 redshift experiment.
- §07 — **Bernhard Riemann** (1826–1866); **Tullio Levi-Civita** (1873–1941); **Élie Cartan** (1869–1951) optional.
- §09 — **Karl Schwarzschild** (1873–1916).
- §10 — **Roy Kerr** (1934–2024); **John Wheeler** (1911–2008); **Subrahmanyan Chandrasekhar** (1910–1995); **Stephen Hawking** (1942–2018); **Roger Penrose** (1931– ); **Jacob Bekenstein** (1947–2015).
- §11 — **Kip Thorne** (1940– ) + **Rainer Weiss** (1932– ).
- §12 — **Edwin Hubble** (1889–1953); **Georges Lemaître** (1894–1966); **Alexander Friedmann** (1888–1925); **Vera Rubin** (1928–2016); **Saul Perlmutter** (1959– ) / **Brian Schmidt** (1967– ) / **Adam Riess** (1969– ) — accelerating-universe trio (single combined entry or three short entries; decide at session time); **Fritz Zwicky** (1898–1974) optional, dark-matter coining 1933; **Arno Penzias** (1933– ) + **Robert Wilson** (1936– ) optional, CMB discovery.

Realistic count: ~17 entries (some pairs as combined entries, e.g., M-M, Pound-Rebka, Penzias-Wilson). Decide combined-vs-split per pair at session time.

## New glossary terms (~50 net new)

§01–§02: `galilean-invariance`, `aether-luminiferous`, `two-postulates`, `simultaneity-relative`, `time-dilation`, `length-contraction`, `lorentz-transformation`, `velocity-addition-relativistic`, `relativistic-doppler`, `transverse-doppler`, `rapidity` (optional).

§03–§04: `spacetime`, `world-line`, `proper-time`, `invariant-interval`, `spacelike`, `timelike`, `null-interval`, `light-cone`, `four-vector` (existing from EM §11 — reuse), `four-momentum`, `four-velocity`, `four-acceleration`, `four-force`, `rest-energy`, `mass-energy-equivalence`, `e-mc-squared`, `threshold-energy`, `pair-production`, `compton-shift`.

§05–§06: `barn-pole-paradox`, `bell-spaceship-paradox`, `born-rigidity`, `equivalence-principle`, `weak-equivalence-principle`, `einstein-equivalence-principle`, `gravitational-redshift`.

§07–§08: `manifold`, `tangent-space`, `metric-tensor`, `christoffel-symbols`, `parallel-transport`, `holonomy`, `geodesic-equation`, `riemann-tensor`, `ricci-tensor`, `ricci-scalar`, `einstein-tensor`, `stress-energy-tensor`, `einstein-field-equations`, `newtonian-limit`.

§09–§10: `schwarzschild-radius`, `schwarzschild-metric`, `event-horizon`, `kerr-metric`, `ergosphere`, `frame-dragging`, `no-hair-theorem`, `penrose-diagram`, `kruskal-extension`, `area-theorem`, `bekenstein-entropy`, `hawking-temperature`, `hawking-radiation`, `black-hole-thermodynamics`.

§11: `linearized-gravity`, `tt-gauge`, `polarization-modes-gw`, `chirp-mass`, `ringdown`.

§12: `flrw-metric`, `friedmann-equations`, `scale-factor`, `hubble-constant`, `cosmological-redshift`, `cmb`, `recombination`, `big-bang-nucleosynthesis`, `dark-matter`, `dark-energy`, `cosmological-constant`, `lambda-cdm`, `accelerating-universe`.

§13: `singularity-theorem`, `cosmic-censorship`, `naked-singularity`, `information-paradox`, `page-curve`, `holographic-principle`.

Trim duplicates with existing GLOSSARY at session time. ~50 net new is the realistic target.

## Slug-collision watch

- **`lorenz-gauge` (Ludvig Lorenz, EM §11.5) vs `lorentz-transformation` (Hendrik Lorentz, RT §02).** Two different people; same EM-branch hazard recurs here. Triple-check spellings in MDX, glossary, and physicist references.
- **`general-relativity`.** Branch slug is `relativity` (covers SR + GR). Don't accidentally name a topic `general-relativity` or it becomes ambiguous against the branch hub.
- **`minkowski-spacetime` vs `minkowski-diagram`.** Pick one; use the second only as a glossary term cross-referencing the first.
- **`kerr` vs `kerr-metric` vs `kerr-black-hole`.** Settle on the `kerr-metric` glossary slug + the `kerr-and-the-ergosphere` topic slug; do not mint a third variant.

## Open minor questions (decide at author time, not now)

- Pound-Rebka: standalone topic in §06 or a side panel inside `gravitational-redshift`? Default: side panel.
- Hawking radiation in §10.6: derive at the level of EP-redshift hand-wave (Hawking's 1974 paragraph), or skip and refer to §13? Default: include the §10.6 hand-wave; full QFT-on-curved-spacetime derivation is out of scope.
- Inflation: own topic in §12 or part of CMB? Default: side panel inside §12.4 `the-cmb-and-nucleosynthesis`.
- AdS/CFT and quantum gravity in §13: paragraph in §13.3 `what-relativity-doesnt-say`, or full topic? Default: paragraph.
- Cosmological perturbations and structure formation: skip entirely (out of scope), or one-paragraph nod inside §12.5 `dark-matter-and-dark-energy`? Default: nod.
- Combined-vs-split entries for paired physicists (M-M, Pound-Rebka, Penzias-Wilson, Perlmutter-Schmidt-Riess): decide per pair at session time. Default: M-M combined; Pound-Rebka combined; Penzias-Wilson combined; Perlmutter-Schmidt-Riess split.

## Out of scope / explicitly deferred

See "Out of scope" under §Scope. Brief recap: numerical relativity internals, detailed astrophysics, quantum gravity derivations, mathematical-relativity proofs, cosmological perturbation theory, all other branches, mobile client work, content-pipeline infrastructure changes.

## Risk notes

- **§07 is the densest math the site has shipped.** Tensor calculus from manifolds → Christoffels → covariant derivative across five topics is aggressive. Plan for the same LaTeX-escape gotchas EM Session 7 hit with field tensors (`\\Gamma^\\rho{}_{\\mu\\nu}`, `\\nabla_\\mu T^{\\mu\\nu}`, `R^\\rho{}_{\\sigma\\mu\\nu}`). Test one representative covariant-derivative equation through the publish CLI before authoring all 5 of §07. Also: many tensor-calc formulas span multiple lines; if `align`/`aligned` environments don't round-trip cleanly, fall back to single-line `$$...$$` per equation.
- **Manifold-geometry visualization is harder than EM's field visualizations.** Curved 2D surfaces (sphere, hyperboloid, embedding diagrams) need a `ManifoldCanvas` primitive considered at Session 4's plan time. If any topic in §07–§10 wants the same 3D-manifold-with-tangent-vector demo, build the primitive once.
- **§08.4 `einsteins-field-equations` is the emotional apex of the GR half.** Same role §11.4 played in EM. Don't undersell. Plan the visualization carefully; rehearse the prose voice before writing.
- **§10.6 `hawking-radiation`** is the second-most-debated derivation in the branch. Hand-wave only; flag the rigor gap honestly. Don't pretend the QFT-on-curved-spacetime calculation is happening on the page.
- **§13.2 `the-information-paradox`** is unfinished science. Write it as the active research it is, not as a settled topic. Page curve as the ongoing resolution attempt, with proper humility about what's still unknown. Don't pick a side.
- **Slug collisions on Lorenz/Lorentz** persist from EM. Triple-check spellings. Add a one-line CI sentinel that greps for typo patterns if it bites mid-branch.
- **Sessions 4 and 6 are the largest and densest.** Budget ~10 topics each; don't try to absorb additional modules.
- **Cross-refs to EM §11.** Sessions 1–2 should write each appearance of `four-vector`, `four-momentum`, `lorentz-factor`, `gauge-transformation` as a `<Term>` link to the existing dictionary entry — don't duplicate, link.

## Definition of done (branch-level)

- All 61 topic pages resolve under `/relativity/<slug>` for `en` locale.
- Branch card on home page shows as `live`.
- Module index pages render correctly at `/relativity` (branch hub).
- `pnpm build` clean, all tests pass.
- All topics have the money shot identified and implemented.
- Hebrew machine-translation first pass published for at least 50 of 61 topics.
- Commit history shows clean per-module progression.
- Cross-refs from EM §11 (charge-invariance, four-potential, magnetism-as-relativistic-electrostatics) wired correctly — RT §02 `the-lorentz-transformation` should reference EM §11.2 as "the field-tensor companion treatment lives at `/electromagnetism/the-electromagnetic-field-tensor`," and RT §03 `four-vectors-and-proper-time` should reference EM §11.5 four-potential as the EM application of the same machinery.
