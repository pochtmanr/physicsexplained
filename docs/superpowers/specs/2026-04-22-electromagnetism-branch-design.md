# Electromagnetism — Branch Design

**Date:** 2026-04-22
**Status:** in progress — §01 shipped 2026-04-22; §02 + §03 shipped 2026-04-22; §04 + §05 shipped 2026-04-23; §06 + §07 shipped 2026-04-23
**Repo:** `/Users/romanpochtman/Developer/physics`
**Supabase project:** `cpcgkkedcfbnlfpzutrc` (`physics.explained`, eu-west-1)
**Supersedes:** the `coming-soon` stub at `lib/content/branches.ts:351-361`.

## Goal

Build the ELECTROMAGNETISM branch as the second fully-authored branch on `physics.explained`, at Distill.pub quality and wikipedia-scale coverage. Match the depth of CLASSICAL MECHANICS (35 topics, 8 modules) and exceed it where the subject demands: electromagnetism is broader than mechanics, has more applications, and closes with one of the great reveals of physics (magnetism as a relativistic consequence of electrostatics).

**Scope target:** 12 modules, 66 topics. Every standard Griffiths-chapter covered, plus circuits (which Griffiths skips), plus a short foundations coda. No gaps a physicist would flag.

## Scope

**In scope**
- 12 modules, 66 topics authored in the existing topic shell (`page.tsx` + `content.en.mdx`, `TopicPageLayout`, `TopicHeader`, numbered `Section`s, `SceneCard`s, `EquationBlock`s, `Callout`s).
- Per-topic physics lib module under `lib/physics/electromagnetism/*.ts` where math is non-trivial. Pure TS, no React, vitest-tested.
- Bespoke visualization components under `components/physics/` — 3–5 per topic, registered in `simulation-registry.ts`. Estimated total: ~220 new components (66 topics × avg 3.3).
- FIG identifiers `FIG.01 · ELECTROSTATICS` through `FIG.66 · FOUNDATIONS`, sequential across the branch (matches CM convention of restarting FIG numbering per branch).
- ~20 new physicists added to `lib/content/physicists.ts` + authored bios published via CLI: Coulomb, Franklin, Volta, Ørsted, Ampère, Biot, Savart, Gauss, Faraday, Henry, Lenz, Ohm, Kirchhoff, Maxwell, Hertz, Lorentz, Tesla (if not already), Poynting, Larmor, Meissner, Aharonov, Bohm. (Check `PHYSICISTS` array before authoring — skip any already present.)
- ~40 new glossary terms: `electric-charge`, `coulomb-per-second`, `flux`, `divergence`, `curl`, `permittivity`, `permeability`, `dielectric`, `polarization`, `capacitance`, `farad`, `inductance`, `henry`, `impedance`, `reactance`, `resonance-em`, `wavenumber`, `refractive-index`, `skin-depth`, `brewster-angle`, `snell-law`, `larmor-radius`, `poynting-vector`, `gauge-transformation`, `displacement-current`, `ohm`, `volt`, `tesla-unit`, `weber`, `solenoid`, `emf`, `eddy-current`, `lorentz-factor`, `field-tensor`, `four-potential`, `monopole`, `birefringence`, `waveguide-mode`, `cutoff-frequency`, `photon-classical-limit`. (Prune overlaps with existing glossary at author time.)
- English `content.en.mdx` for all 66 topics. Hebrew `content.he.mdx` stubs deferred — translation CLI will handle bulk Hebrew once English is shipped.
- Run `pnpm content:publish` per module to push rows into Supabase.
- Flip branch status from `coming-soon` to `live` in `lib/content/branches.ts`.
- Update `getAdjacentTopics()` so prev/next navigation threads through EM after CM.

**Out of scope**
- Hebrew translations beyond machine-translated first pass (`pnpm content:translate --locale he` after English is stable).
- Physics beyond classical EM: QED beyond the §12 preview, plasma physics beyond the ionosphere mention, magneto-hydrodynamics, condensed-matter-specific topics (spin waves, quantum hall).
- Other branches (Thermodynamics, Relativity, Quantum, Modern) — those are future specs.
- Mobile client considerations beyond Supabase pipeline already doing its job.
- New content-pipeline infrastructure — the existing MDX → parser → Supabase → `<ContentBlocks>` path handles everything.

## Voice, audience, and calculus policy

**Audience:** curious adult, high-school physics behind them, no calculus assumed but shown. Same as CM.

**Voice:** Kurzgesagt meets Stripe docs. Short declarative sentences. Historical hooks where they serve the physics. No filler.

**Calculus policy — decision LOCKED: Option A ("extend the CM convention").**

- Vector calculus (divergence, curl, line integrals, flux integrals, gradients) is the content of Maxwell's equations and cannot be avoided.
- Every topic that uses div / curl / ∮ / ∬ must explain the symbol **in its local context**, in plain words, before the equation form.
- The equation appears as "and here's how physicists write that, compactly."
- Redundancy across topics is a feature: every topic remains standalone. A reader who lands on `/electromagnetism/faradays-law` from a search engine never needs to have read `/electromagnetism/gauss-law` first.
- Side notes (`Callout math`) carry the denser derivations so the main narrative stays readable.
- When introducing a new vector-calc idea for the first time in the branch, use the margin aside to point at the relevant `/dictionary/<slug>` entry (e.g., `/dictionary/divergence`).

**Money-shot principle:** every module has at least one signature animation or visual reveal. These are the images the reader screenshots. They are listed per-module below.

## Branch metadata

To be written into `lib/content/branches.ts` when the branch flips to `live`:

```ts
{
  slug: "electromagnetism",
  index: 2,
  title: "ELECTROMAGNETISM",
  eyebrow: "§ 02",
  subtitle: "Light, charge, and the field that holds the world together.",
  description:
    "Maxwell's four equations — the most important four lines in physics — unify electricity, magnetism, and light into a single field theory. Every radio, screen, wire, and star depends on them. The branch ends on the quiet reveal that magnetism was never a second force at all: it is electricity, seen from a moving train.",
  modules: ELECTROMAGNETISM_MODULES,
  topics: ELECTROMAGNETISM_TOPICS,
  status: "live",
}
```

## Module structure

Twelve modules, sequential. Each module's topics are numbered in reading order; the FIG sequence across the branch runs FIG.01 → FIG.66.

---

### §01 Electrostatics — FIG.01–07

The static field of motionless charges. Everything that comes later builds on this: the field idea, Gauss's law, potential, capacitance, and the short list of tricks physicists use to solve real geometries. No time dependence yet.

| # | Slug | Title | Subtitle | Min |
|---|------|-------|----------|-----|
| 01 | `coulombs-law` | ELECTRIC CHARGE AND COULOMB'S LAW | The force between two charges — and why it looks so much like gravity. | 10 |
| 02 | `the-electric-field` | THE ELECTRIC FIELD | When a force has a place of its own. | 11 |
| 03 | `gauss-law` | GAUSS'S LAW | The equation that turns symmetry into an answer. | 12 |
| 04 | `electric-potential` | ELECTRIC POTENTIAL AND VOLTAGE | Energy per charge, and the map every battery reads from. | 11 |
| 05 | `capacitance-and-field-energy` | CAPACITANCE AND FIELD ENERGY | Where the charge goes when you let go of the switch. | 12 |
| 06 | `conductors-and-shielding` | CONDUCTORS AND THE FARADAY CAGE | Why a metal box is the safest place in a lightning storm. | 11 |
| 07 | `method-of-images` | THE METHOD OF IMAGES | A trick that turns a hard problem into a symmetry. | 12 |

**Money shot:** `gauss-law` — animated Gaussian surface morphing between sphere, cylinder, and Gaussian pillbox over the same charge configuration, showing flux integral invariant under surface choice. The symmetry-collapses-to-a-line-of-algebra moment.

---

### §02 Electric fields in matter — FIG.08–11

What happens when the charges can't leave but can lean. The D field, bound vs free charges, boundary conditions, and two materials whose behavior is genuinely surprising.

| # | Slug | Title | Subtitle | Min |
|---|------|-------|----------|-----|
| 08 | `polarization-and-bound-charges` | POLARIZATION AND BOUND CHARGES | What happens when the charges can't leave, but can lean. | 12 |
| 09 | `dielectrics-and-the-d-field` | DIELECTRICS AND THE D FIELD | The extra field that only notices what's free. | 12 |
| 10 | `boundary-conditions-at-interfaces` | BOUNDARY CONDITIONS AT INTERFACES | What the field must do when the material changes. | 10 |
| 11 | `piezo-and-ferroelectricity` | PIEZOELECTRICITY AND FERROELECTRICITY | The crystals that remember which way they've been pushed. | 11 |

**Money shot:** `polarization-and-bound-charges` — slab of dielectric between capacitor plates with an animated lattice of dipoles aligning as the field ramps up; the "bound surface charge" emerging as a visible layer without any charge ever moving through the bulk.

---

### §03 Magnetostatics — FIG.12–16

Steady currents and the field they make. The magnetic force, the three big laws of magnetostatics, and the vector potential — the quiet hero that makes electrodynamics possible later.

| # | Slug | Title | Subtitle | Min |
|---|------|-------|----------|-----|
| 12 | `the-lorentz-force` | CURRENTS AND THE LORENTZ FORCE | Why a moving charge feels what a still one doesn't. | 12 |
| 13 | `biot-savart-law` | THE BIOT–SAVART LAW | The magnetic analogue of Coulomb, one current element at a time. | 12 |
| 14 | `amperes-law` | AMPÈRE'S LAW | The shortcut when the current walks a straight line. | 12 |
| 15 | `the-vector-potential` | THE VECTOR POTENTIAL | The field behind the field. | 13 |
| 16 | `magnetic-dipoles` | MAGNETIC DIPOLES AND TORQUE ON LOOPS | Why a compass turns, in the language of fields. | 11 |

**Money shot:** `the-lorentz-force` — charged particle launched into a uniform B field, three cases on the same canvas (pure circle, helix when v has a parallel component, cycloid when E field is added). Trajectories drawn live.

---

### §04 Magnetic fields in matter — FIG.17–20

Why some materials are attracted, some repelled, and some remember. The atomic origin of magnetism, the three regimes, and the material whose resistance disappears and throws the field out entirely.

| # | Slug | Title | Subtitle | Min |
|---|------|-------|----------|-----|
| 17 | `magnetization-and-the-h-field` | MAGNETIZATION AND THE H FIELD | Matter's answer to an applied magnetic field. | 12 |
| 18 | `dia-and-paramagnetism` | DIAMAGNETISM AND PARAMAGNETISM | The quiet magnets hiding in almost everything. | 11 |
| 19 | `ferromagnetism-and-hysteresis` | FERROMAGNETISM, DOMAINS, AND HYSTERESIS | Why iron remembers, and why the memory can be erased. | 13 |
| 20 | `superconductivity-and-meissner` | SUPERCONDUCTIVITY AND THE MEISSNER EFFECT | When the field is not just weakened — it is thrown out. | 12 |

**Money shot:** `ferromagnetism-and-hysteresis` — hysteresis loop traced out live as the applied field cycles, with the iron-domain mosaic underneath aligning and reversing in sync. Two synchronized panels: B vs H plot on the left, domain mosaic on the right.

---

### §05 Electrodynamics & induction — FIG.21–25

Time dependence enters. Faraday's law, Lenz's law, inductance, and the eddy currents that brake a magnet falling through a copper pipe. This module is the bridge from statics to Maxwell.

| # | Slug | Title | Subtitle | Min |
|---|------|-------|----------|-----|
| 21 | `faradays-law` | FARADAY'S LAW OF INDUCTION | A changing magnetic field brings an electric field with it. | 12 |
| 22 | `lenz-law-and-motional-emf` | LENZ'S LAW AND MOTIONAL EMF | Nature pushes back against the change that caused it. | 11 |
| 23 | `self-and-mutual-inductance` | SELF AND MUTUAL INDUCTANCE | Why a coil resists its own changing current. | 12 |
| 24 | `energy-in-magnetic-fields` | ENERGY IN MAGNETIC FIELDS | Where the energy goes when the current ramps up. | 11 |
| 25 | `eddy-currents` | EDDY CURRENTS AND MAGNETIC BRAKING | The invisible circuits that stop a falling magnet. | 11 |

**Money shot:** `eddy-currents` — magnet falling through a copper tube in slow motion, with induced current loops drawn in real time as color bands on the tube wall. Side readout shows the velocity staying constant after terminal drag kicks in.

---

### §06 Circuits — FIG.26–32

The practical module. DC to AC, Kirchhoff's laws through transformer design. Every topic here is something an engineer will still use tomorrow. Griffiths skips this; physicists quietly learn it anyway.

| # | Slug | Title | Subtitle | Min |
|---|------|-------|----------|-----|
| 26 | `dc-circuits-and-kirchhoff` | DC CIRCUITS AND KIRCHHOFF'S LAWS | The two sentences that solve almost every schematic. | 12 |
| 27 | `rc-circuits` | RC CIRCUITS AND THE CHARGING CURVE | Why the capacitor never quite gets there, and always almost does. | 11 |
| 28 | `rl-circuits` | RL CIRCUITS | The coil's version of hesitation. | 10 |
| 29 | `rlc-circuits-and-resonance` | RLC CIRCUITS AND RESONANCE | Two stores of energy, one frequency that loves them both. | 12 |
| 30 | `ac-circuits-and-phasors` | AC CIRCUITS, PHASORS, AND IMPEDANCE | Rotation as the secret of every wall socket. | 13 |
| 31 | `transformers` | TRANSFORMERS AND POWER TRANSMISSION | How one coil teaches another what voltage to be. | 11 |
| 32 | `transmission-lines` | TRANSMISSION LINES AND IMPEDANCE MATCHING | When the wire becomes long enough to matter. | 13 |

**Money shot:** `ac-circuits-and-phasors` — rotating phasor diagram on the left, voltage/current oscilloscope trace on the right, live synchronized. Slider for phase angle. The moment a reader *sees* impedance is the moment it clicks.

---

### §07 Maxwell's equations — FIG.33–37

The unification. Displacement current as the missing piece, the four equations together, potentials and gauge freedom, and the two conservation laws (energy flow via Poynting, momentum via the stress tensor) that drop out of them.

| # | Slug | Title | Subtitle | Min |
|---|------|-------|----------|-----|
| 33 | `displacement-current` | DISPLACEMENT CURRENT | The missing term Maxwell put in, and the universe it unlocked. | 12 |
| 34 | `the-four-equations` | THE FOUR EQUATIONS, TOGETHER | The most important four lines in physics. | 13 |
| 35 | `gauge-freedom-and-potentials` | GAUGE FREEDOM AND THE POTENTIALS | The parts of the potential the field can't see. | 13 |
| 36 | `the-poynting-vector` | THE POYNTING VECTOR | Where the energy in a field is flowing, right now. | 11 |
| 37 | `maxwell-stress-tensor` | MOMENTUM AND THE MAXWELL STRESS TENSOR | Fields carry momentum — and push on what they touch. | 13 |

**Money shot:** `displacement-current` — side-by-side comparison of a charging capacitor, with Ampère's law integration surface morphing between "through the wire" and "between the plates." Without displacement current, the two disagree. With it, they match exactly. The moment the paradox collapses.

---

### §08 EM waves in vacuum — FIG.38–41

Light falls out of Maxwell's equations. One derivation, one speed, one spectrum from radio to gamma ray. This is the shortest module and the most important one.

| # | Slug | Title | Subtitle | Min |
|---|------|-------|----------|-----|
| 38 | `deriving-the-em-wave-equation` | DERIVING THE EM WAVE EQUATION | Four equations, two fields, and light falling out the other side. | 11 |
| 39 | `plane-waves-and-polarization` | PLANE WAVES AND POLARIZATION | The shape of a ray of light, written in two transverse fields. | 12 |
| 40 | `radiation-pressure` | ENERGY, MOMENTUM, AND RADIATION PRESSURE | Light pushes. Measurably. | 11 |
| 41 | `the-electromagnetic-spectrum` | THE ELECTROMAGNETIC SPECTRUM | One equation, every wavelength from radio to gamma. | 10 |

**Money shot:** `plane-waves-and-polarization` — 3D plane wave with E and B drawn as perpendicular sinusoids, propagating. Polarization slider morphs between linear → circular → elliptical. The "they're always perpendicular, always transverse, always in phase in vacuum" reveal.

---

### §09 Waves in matter and optics — FIG.42–51

The longest module: what light does when it meets matter. Refraction, dispersion, reflection, interference, diffraction, polarization phenomena, and fibers. This is where the branch earns its "wikipedia of physics" label.

| # | Slug | Title | Subtitle | Min |
|---|------|-------|----------|-----|
| 42 | `index-of-refraction` | INDEX OF REFRACTION | What slows light down when it has somewhere to be. | 11 |
| 43 | `skin-depth-in-conductors` | SKIN DEPTH IN CONDUCTORS | How deep a radio wave can actually get into a metal. | 11 |
| 44 | `fresnel-equations` | THE FRESNEL EQUATIONS | What reflects, what goes through, and at what angle. | 13 |
| 45 | `total-internal-reflection` | TOTAL INTERNAL REFLECTION | The mirror made of an angle. | 11 |
| 46 | `optical-dispersion` | OPTICAL DISPERSION | Why a prism splits white light — and why a rainbow has an order. | 11 |
| 47 | `geometric-optics` | GEOMETRIC OPTICS | When the wavelength is small enough to forget. | 12 |
| 48 | `interference` | INTERFERENCE | Two waves that know how to add — and how to cancel. | 12 |
| 49 | `diffraction-and-the-double-slit` | DIFFRACTION AND THE DOUBLE SLIT | What a wave does when a wall gets in the way. | 13 |
| 50 | `polarization-phenomena` | POLARIZATION, BREWSTER, AND BIREFRINGENCE | When the direction the field points starts to matter. | 12 |
| 51 | `waveguides-and-fibers` | WAVEGUIDES AND OPTICAL FIBERS | How to keep light inside a pipe for a thousand kilometers. | 12 |

**Money shot:** `diffraction-and-the-double-slit` — the fringe pattern building up photon by photon, with the slit separation and wavelength as sliders. The canonical wave-optics reveal, animated until it stops being abstract.

Cross-reference note: CM's `dispersion-and-group-velocity` covers the general mechanism; EM's `optical-dispersion` specializes to refractive index chromatic dispersion. Link both ways.

---

### §10 Radiation — FIG.52–57

Where does light come from? Accelerating charges. Every antenna, synchrotron, X-ray tube, and bremsstrahlung spectrum is a variation on one formula. This module also introduces the unresolved problem of radiation reaction — physics still isn't sure how a charge pushes on itself.

| # | Slug | Title | Subtitle | Min |
|---|------|-------|----------|-----|
| 52 | `larmor-formula` | THE LARMOR FORMULA | Why every accelerating charge leaves light behind. | 11 |
| 53 | `electric-dipole-radiation` | ELECTRIC DIPOLE RADIATION | The simplest antenna in the universe. | 12 |
| 54 | `antennas-and-radio` | ANTENNAS AND RADIO | The difference between a wire and a broadcast. | 12 |
| 55 | `synchrotron-radiation` | SYNCHROTRON RADIATION | Light made on purpose by bending electrons in a circle. | 11 |
| 56 | `bremsstrahlung` | BREMSSTRAHLUNG | The light that comes out when a charge gets in the way of itself. | 10 |
| 57 | `radiation-reaction` | RADIATION REACTION | The force that a charge exerts back on itself. | 13 |

**Money shot:** `electric-dipole-radiation` — oscillating dipole at the origin with field lines drawn in real time: near-field wrapping tightly, far-field breaking off as outgoing spherical wavefronts. The moment fields leave their source.

---

### §11 Electromagnetism and relativity — FIG.58–62

The reveal the branch was always building toward. Charge is invariant, but E and B are not — they rotate into each other under Lorentz boosts. Magnetism turns out to be electricity seen from a moving train. This is the point where a century of electromagnetism and a decade of special relativity snap together.

| # | Slug | Title | Subtitle | Min |
|---|------|-------|----------|-----|
| 58 | `charge-invariance` | CHARGE IS INVARIANT | The one quantity every observer must agree on. | 10 |
| 59 | `e-and-b-under-lorentz` | E AND B UNDER A LORENTZ BOOST | What looks like a magnet to you looks like an electric field to someone moving past. | 13 |
| 60 | `the-electromagnetic-field-tensor` | THE ELECTROMAGNETIC FIELD TENSOR | Six numbers, one object, the full relativistic story. | 13 |
| 61 | `magnetism-as-relativistic-electrostatics` | MAGNETISM AS RELATIVISTIC ELECTROSTATICS | The reveal: there is no second force. | 14 |
| 62 | `four-potential-and-em-lagrangian` | THE FOUR-POTENTIAL AND EM LAGRANGIAN | Electromagnetism rewritten as a principle of least action. | 13 |

**Money shot:** `magnetism-as-relativistic-electrostatics` — two parallel current-carrying wires in the lab frame (magnetic attraction) boosted into the rest frame of the electrons (length contraction of the lattice produces a net charge density → Coulomb attraction). Same force, different name. The single most surprising result in classical physics, rendered as a two-panel animation.

Prerequisite note: this module assumes *minimal* special relativity — length contraction, time dilation, Lorentz transform of coordinates. Topic 61 introduces just enough inline; full treatment belongs in the future RELATIVITY branch.

---

### §12 Foundations — FIG.63–66

The epilogue. Four topics that sit at the edge of classical EM: gauge theory as a template for every fundamental force, the Aharonov-Bohm effect (where the potential matters even where the field is zero), magnetic monopoles (which Dirac showed are *allowed*), and the classical limit of quantum electrodynamics.

| # | Slug | Title | Subtitle | Min |
|---|------|-------|----------|-----|
| 63 | `gauge-theory-origins` | GAUGE INVARIANCE AND THE BIRTH OF GAUGE THEORIES | The symmetry that became the template for every force. | 13 |
| 64 | `aharonov-bohm-effect` | THE AHARONOV–BOHM EFFECT | When the potential matters even where the field is zero. | 12 |
| 65 | `magnetic-monopoles-and-duality` | MAGNETIC MONOPOLES AND DUALITY | The symmetric version of Maxwell, and the particle we haven't found. | 11 |
| 66 | `classical-limit-of-qed` | THE CLASSICAL LIMIT OF QED | Where classical electromagnetism ends, and what replaces it. | 12 |

**Money shot:** `aharonov-bohm-effect` — two-slit electron interference with a shielded solenoid between the slits, fringe shift with B field toggled. The field is zero where the electrons go, yet the pattern shifts. The most direct experimental evidence that the potential is the real object.

---

## Suggested session plan

Nine sessions, modules grouped by natural pedagogical affinity and total topic count (~7 per session average). Not rigid — any module can be a session on its own.

| Session | Modules | Topics | Focus |
|---------|---------|--------|-------|
| 1 | §01 | 7 | Electrostatics — build the foundation |
| 2 | §02 + §03 | 9 | Fields-in-matter + magnetostatics — finish statics |
| 3 | §04 + §05 | 9 | Magnetism-in-matter + induction — close the statics era, open dynamics |
| 4 | §06 | 7 | Circuits — the practical module |
| 5 | §07 | 5 | Maxwell — the unification |
| 6 | §08 + §10 | 10 | EM waves in vacuum + radiation — "where light comes from and what it does" |
| 7 | §09 | 10 | Waves in matter & optics — the biggest module, all optics |
| 8 | §11 | 5 | EM and relativity — the reveal |
| 9 | §12 | 4 | Foundations — closing |

Dependency constraints:
- §05 requires §03 (induction needs the B field).
- §07 requires §05 (displacement current is the complement to induction).
- §08 requires §07 (waves derived from Maxwell).
- §09 requires §08 (waves in matter generalizes vacuum waves).
- §10 requires §08 (radiation = waves produced by accelerating charges).
- §11 requires §07 + minimal SR (introduced inline).
- §06 Circuits is an independent module — can be authored any time after §05.
- §12 requires §07 and benefits from §11.

## Progress matrix

Update this table at the end of every session. A topic is "done" when: `content.en.mdx` authored + physics lib module tested (if non-trivial) + simulation components registered + row published to Supabase + page.tsx reads from Supabase + `pnpm build` clean.

### Module status

| Module | Count | Done | Status |
|--------|-------|------|--------|
| §01 Electrostatics | 7 | 7 | ☑ complete |
| §02 Electric fields in matter | 4 | 4 | ☑ complete |
| §03 Magnetostatics | 5 | 5 | ☑ complete |
| §04 Magnetic fields in matter | 4 | 4 | ☑ complete |
| §05 Electrodynamics & induction | 5 | 5 | ☑ complete |
| §06 Circuits | 7 | 7 | ☑ complete |
| §07 Maxwell's equations | 5 | 5 | ☑ complete |
| §08 EM waves in vacuum | 4 | 0 | ☐ not started |
| §09 Waves in matter & optics | 10 | 0 | ☐ not started |
| §10 Radiation | 6 | 0 | ☐ not started |
| §11 EM & relativity | 5 | 0 | ☐ not started |
| §12 Foundations | 4 | 0 | ☐ not started |
| **Total** | **66** | **37** | **56% complete** |

### Per-topic checklist

Check off as each topic ships.

**§01 Electrostatics**
- [x] 01 `coulombs-law`
- [x] 02 `the-electric-field`
- [x] 03 `gauss-law`
- [x] 04 `electric-potential`
- [x] 05 `capacitance-and-field-energy`
- [x] 06 `conductors-and-shielding`
- [x] 07 `method-of-images`

**§02 Electric fields in matter**
- [x] 08 `polarization-and-bound-charges`
- [x] 09 `dielectrics-and-the-d-field`
- [x] 10 `boundary-conditions-at-interfaces`
- [x] 11 `piezo-and-ferroelectricity`

**§03 Magnetostatics**
- [x] 12 `the-lorentz-force`
- [x] 13 `biot-savart-law`
- [x] 14 `amperes-law`
- [x] 15 `the-vector-potential`
- [x] 16 `magnetic-dipoles`

**§04 Magnetic fields in matter**
- [x] 17 `magnetization-and-the-h-field`
- [x] 18 `dia-and-paramagnetism`
- [x] 19 `ferromagnetism-and-hysteresis`
- [x] 20 `superconductivity-and-meissner`

**§05 Electrodynamics & induction**
- [x] 21 `faradays-law`
- [x] 22 `lenz-law-and-motional-emf`
- [x] 23 `self-and-mutual-inductance`
- [x] 24 `energy-in-magnetic-fields`
- [x] 25 `eddy-currents`

**§06 Circuits**
- [x] 26 `dc-circuits-and-kirchhoff`
- [x] 27 `rc-circuits`
- [x] 28 `rl-circuits`
- [x] 29 `rlc-circuits-and-resonance`
- [x] 30 `ac-circuits-and-phasors`
- [x] 31 `transformers`
- [x] 32 `transmission-lines`

**§07 Maxwell's equations**
- [x] 33 `displacement-current`
- [x] 34 `the-four-equations`
- [x] 35 `gauge-freedom-and-potentials`
- [x] 36 `the-poynting-vector`
- [x] 37 `maxwell-stress-tensor`

**§08 EM waves in vacuum**
- [ ] 38 `deriving-the-em-wave-equation`
- [ ] 39 `plane-waves-and-polarization`
- [ ] 40 `radiation-pressure`
- [ ] 41 `the-electromagnetic-spectrum`

**§09 Waves in matter & optics**
- [ ] 42 `index-of-refraction`
- [ ] 43 `skin-depth-in-conductors`
- [ ] 44 `fresnel-equations`
- [ ] 45 `total-internal-reflection`
- [ ] 46 `optical-dispersion`
- [ ] 47 `geometric-optics`
- [ ] 48 `interference`
- [ ] 49 `diffraction-and-the-double-slit`
- [ ] 50 `polarization-phenomena`
- [ ] 51 `waveguides-and-fibers`

**§10 Radiation**
- [ ] 52 `larmor-formula`
- [ ] 53 `electric-dipole-radiation`
- [ ] 54 `antennas-and-radio`
- [ ] 55 `synchrotron-radiation`
- [ ] 56 `bremsstrahlung`
- [ ] 57 `radiation-reaction`

**§11 EM & relativity**
- [ ] 58 `charge-invariance`
- [ ] 59 `e-and-b-under-lorentz`
- [ ] 60 `the-electromagnetic-field-tensor`
- [ ] 61 `magnetism-as-relativistic-electrostatics`
- [ ] 62 `four-potential-and-em-lagrangian`

**§12 Foundations**
- [ ] 63 `gauge-theory-origins`
- [ ] 64 `aharonov-bohm-effect`
- [ ] 65 `magnetic-monopoles-and-duality`
- [ ] 66 `classical-limit-of-qed`

## Integration checklist (per topic)

For each topic being authored:

1. **Content**
   - Create `app/[locale]/(topics)/electromagnetism/<slug>/page.tsx` (Supabase-reading pattern, copy from `classical-mechanics/the-simple-pendulum/page.tsx`).
   - Create `content/electromagnetism/<slug>.en.mdx` (or the repo's current authoring path — check one existing CM topic at author time).
   - Compose from `TopicPageLayout`, `TopicHeader`, `Section`, `SceneCard`, `EquationBlock`, `Callout`, `PhysicistLink`, `Term`, plus the simulation components defined below.

2. **Physics lib** (when math is non-trivial)
   - Create `lib/physics/electromagnetism/<topic>.ts` with pure TS functions (no React).
   - Add vitest unit tests under `tests/physics/electromagnetism/<topic>.test.ts`.

3. **Simulations**
   - Create `components/physics/<topic>/<ComponentName>Scene.tsx` per figure.
   - Register each in `lib/content/simulation-registry.ts`.

4. **Data layer**
   - Add topic entry to `ELECTROMAGNETISM_TOPICS` in `lib/content/branches.ts` with slug/title/eyebrow/subtitle/readingMinutes/status/module.
   - Add any new physicist to `PHYSICISTS` in `lib/content/physicists.ts` (check first).
   - Add any new glossary term to `GLOSSARY` in `lib/content/glossary.ts` (check first).

5. **Publish**
   - Run `pnpm content:publish --only electromagnetism/<slug>` to push the row.
   - Run `pnpm tsc --noEmit` and `pnpm vitest run` — both must stay green.
   - Run `pnpm build` for a smoke test before committing.

6. **Commit**
   - `feat(topic): <slug> — <one-liner>`
   - Reference the module (`feat(em/§01):` or similar) so the history shows progression.

7. **Progress table** — check the box in this spec document.

## Once per module

- Update `ELECTROMAGNETISM_MODULES` in `lib/content/branches.ts` when the first topic of a new module ships.
- Update the module's progress row in this document.

## Once for the branch

- When §01 ships, flip `electromagnetism` `status` from `coming-soon` to `live` in `lib/content/branches.ts` so the branch page stops showing the email-signup form.
- When all 66 topics ship, run `pnpm content:translate --locale he` to produce the Hebrew machine-translation first pass, then commission any human polish needed.
- Update `components/sections/branches-section.tsx` subtitle copy if needed ("two branches live" etc.).

## Open minor questions (decide at author time, not now)

1. **Slug style for possessives ending in `-s`/`-z`**: `gauss-law` vs `gausss-law`, `lenz-law` vs `lenzs-law`. CM convention (`noethers-theorem`, `bernoullis-principle`) says add an `s`, but triple-`s` and `nzs` read badly. Doc uses `gauss-law` and `lenz-law-and-motional-emf` for readability; flag at author time if user wants strict convention.
2. **FIG numbering**: doc assumes EM restarts at FIG.01 (matches CM's per-branch restart). Confirm before first topic ships.
3. **Vector-calculus primer module**: rejected as a top-level module (see "Calculus policy" above) but could become a set of glossary entries (`divergence`, `curl`, `flux`, `gradient`, `line-integral`) that inline aside-links point to. Author the first topic that needs each, then lift the explanation into a glossary entry for future topics to reference.
4. **Circuit-scene library**: §06 Circuits needs a generic `CircuitCanvas` primitive (nodes, wires, components with live numeric readouts). Worth building once and reusing across all seven circuits topics — propose spinning this off as its own mini-plan before session 4.
5. **Optics geometric-ray primitive**: §09 Optics needs a reusable `RayTraceCanvas` (ray sources, lenses, mirrors, indices of refraction at interfaces). Same pattern — build once, use across `geometric-optics`, `fresnel-equations`, `total-internal-reflection`, `waveguides-and-fibers`.

## Out of scope / explicitly deferred

- Hebrew authoring (translation CLI handles it after English stabilizes).
- Other locales (ru, ar, es) — locale-agnostic pipeline, zero-cost when desired.
- New branches (Thermodynamics, Relativity, Quantum, Modern Physics) — future specs.
- Interactivity beyond what CM already does (no user-draggable field lines, no playgrounds — same policy as CM v0).
- Mobile-first polish — same as CM.
- Light mode — site is dark-theme-only.
- Performance optimizations beyond Next.js defaults + Vercel CDN.

## Risk notes

- **Scope is large.** 66 topics × ~3.3 sims × authoring + testing = substantial. The session plan (9 sessions) is achievable because (a) many topics share physics-lib modules, (b) circuit and optics primitives amortize across their modules, (c) existing content pipeline is already proven. Worst case: ship in 12-15 sessions.
- **Vector calculus in prose is the hardest voice problem the branch faces.** Recommendation: after §01 is drafted, re-read it as if you've never read the site before and check whether div/curl/flux/gradient explanations land. Adjust template before §02.
- **The §11 relativity bridge needs SR the branch doesn't assume.** Plan: inline just enough in topic 61 itself, reference future RELATIVITY branch in the margin.
- **Radiation reaction (topic 57) is an unsolved problem in classical physics.** Write it honestly — "this is the seam in the fabric" — don't hand-wave. Good material for a Kurzgesagt-style payoff paragraph.
- **Optics is dense and visual-heavy.** Session 7 is 10 topics; budget accordingly. May split into two sessions (42–46 and 47–51) at author time if scope balloons.

## Definition of done (branch-level)

- All 66 topic pages resolve under `/electromagnetism/<slug>` for `en` locale.
- Branch card on home page shows as `live`.
- Module index pages render correctly at `/electromagnetism` (branch hub).
- `pnpm build` clean, all tests pass.
- All topics have the money shot identified and implemented.
- Hebrew machine-translation first pass published for at least 50 of 66 topics.
- Commit history shows clean per-module progression.

---

**Next step after spec approval:** `/superpowers:writing-plans` for session 1 (§01 Electrostatics — 7 topics). Each subsequent session gets its own implementation plan, dispatched via the token-saving subagent-driven-development variant (parallel waves, no per-task review — per `feedback_execution_style.md`).
