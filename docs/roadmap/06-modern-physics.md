# § 06 · Modern Physics — curriculum roadmap

Where quantum mechanics meets relativity, and where physics meets its open frontier. Particle physics, nuclear physics, cosmology, and the questions we still can't answer. This branch assumes § 05 (Quantum Mechanics) and § 04 (Relativity) are already in the reader's bones — we inherit the vocabulary of operators, spin, superposition, four-vectors, spacetime intervals, and c as the speed limit. What follows is the twentieth- and twenty-first-century consolidation of those two revolutions into a working picture of matter, forces, and the universe — and an honest accounting of where that picture still leaks.

## Module map

Nine modules, thirty-two topics. FIG numbers restart at 01 for this branch. Modules move outward in scale: atoms → nuclei → particles → fields → cosmos → frontier.

| Module | Name | Topics | FIG range |
|---|---|---|---|
| 1 | Atomic Physics | 4 | FIG.01 – FIG.04 |
| 2 | Nuclear Physics | 4 | FIG.05 – FIG.08 |
| 3 | Particle Physics I — the Zoo and the Model | 4 | FIG.09 – FIG.12 |
| 4 | Particle Physics II — Interactions | 3 | FIG.13 – FIG.15 |
| 5 | Symmetries & Gauge Theories | 3 | FIG.16 – FIG.18 |
| 6 | Quantum Field Theory (gentle) | 3 | FIG.19 – FIG.21 |
| 7 | Cosmology | 5 | FIG.22 – FIG.26 |
| 8 | Beyond the Standard Model | 3 | FIG.27 – FIG.29 |
| 9 | Open Problems | 3 | FIG.30 – FIG.32 |

The entire branch is designed to be read end-to-end in ~6–7 hours. Earlier modules (Atomic, Nuclear) stay close to experiment; middle modules (QFT, Gauge) are the most abstract; the closing modules (Cosmology, BSM, Open Problems) return to concrete data and open questions. The reader should finish knowing what we know, how we know it, and where the edges are.

---

## Module 1 · Atomic Physics

Where § 05's hydrogen solution met the laboratory. Once Schrödinger's equation gave the gross structure of the hydrogen atom, experimentalists kept refining their spectrometers and kept finding finer lines — fine, hyperfine, and finer still. Each splitting exposed a new physical ingredient: electron spin, relativistic corrections, nuclear moments, and eventually vacuum fluctuations. Atomic physics is the workshop where quantum field theory first had to pay rent.

---

### FIG.01 — Fine and Hyperfine Structure

**Hook.** Albert Michelson, 1887, Cleveland. Fresh off the interferometer that killed the ether, he turned the same instrument on the red line of hydrogen and found it wasn't a line — it was two lines, a whisker apart. The "fine structure" of atoms. Thirty years later Pauli, Goudsmit and Uhlenbeck, Dirac, would each add a piece to explain why.

**Sections (7):**

1. **Gross structure recap** — hydrogen's Bohr levels, E_n = −13.6 eV / n². The coarse picture from § 05. This was correct to one part in ten thousand, and wrong beyond that.
2. **Fine structure** — the splitting scales with α² ≈ 5×10⁻⁵, where α is the fine-structure constant. Two ingredients combine: relativistic kinetic energy correction and spin-orbit coupling. Dirac's equation gives both in one stroke.
3. **Spin-orbit coupling** — the electron sees the proton orbiting it; the moving charge is a magnetic field; the electron's spin magnetic moment feels it. L·S appears in the Hamiltonian. The size matches experiment.
4. **Hyperfine structure** — the *proton* has a spin too. Its tiny magnetic moment splits each fine level again, by a factor of (m_e / m_p) ≈ 1/1836. The famous 21 cm line of neutral hydrogen — the one radio astronomers built their maps on — is a hyperfine transition.
5. **Selection rules** — which transitions are allowed. Δℓ = ±1, Δm = 0,±1. Forbidden transitions aren't forbidden forever, they're just slow; the 21 cm line has a spontaneous-emission lifetime of ~10⁷ years, which is why you need a galaxy's worth of hydrogen to see it.
6. **What the fine-structure constant is** — α = e²/(4πε₀ℏc) ≈ 1/137. A pure number. Feynman called it "one of the greatest damn mysteries of physics." It sets the strength of electromagnetism and nobody knows why it has the value it does.
7. **Forward** — the Lamb shift (FIG.02) is what you find when Dirac's equation is no longer enough.

**Scenes to build (2):**

| File | Purpose |
|---|---|
| `hydrogen-spectrum-scene.tsx` | Hydrogen energy-level diagram, zoomable. Click a level to expand the fine-structure split, click again to expand the hyperfine split. Numerical energies in eV and wavelengths in nm/cm. |
| `spin-orbit-scene.tsx` | Vector diagram of L and S precessing around J. Spin slider shows how the energy shift depends on alignment. Small cartoon of the electron "feeling" the proton's orbital magnetic field. |

**Physicists:**
- Albert Michelson *(NEW — interferometric spectroscopy, first resolved hydrogen's fine structure)*
- Paul Dirac *(likely exists from § 05)*
- Samuel Goudsmit & George Uhlenbeck *(NEW — proposed electron spin, 1925, as two graduate students)*

**Glossary terms:**
- `fine-structure` — concept
- `hyperfine-structure` — concept
- `spin-orbit-coupling` — concept
- `fine-structure-constant` — concept
- `21-cm-line` — phenomenon

**Reading minutes:** 11.

---

### FIG.02 — The Lamb Shift

**Hook.** Willis Lamb, Columbia, 1947. Using microwave techniques developed for wartime radar, Lamb measured a tiny splitting between two hydrogen levels Dirac's equation said should be identical. About 1000 MHz. It was the first experimental evidence that the vacuum itself was doing something.

**Sections (7):**

1. **What Dirac predicted** — the 2S₁/₂ and 2P₁/₂ states of hydrogen have exactly the same energy in Dirac's theory. A degeneracy demanded by the symmetry of the Coulomb problem.
2. **What Lamb measured** — the states are not degenerate. 2S₁/₂ sits ~1057 MHz above 2P₁/₂. The "Lamb shift."
3. **The radar war connection** — Lamb could do this only because microwave tech had matured building radar for the Battle of Britain. Wartime engineering, peacetime physics.
4. **The vacuum is not empty** — virtual photons, virtual electron-positron pairs. Every point in space is fizzing with fluctuations. The 2S electron, sitting closer to the proton on average, feels these fluctuations differently than the 2P electron. Hence the shift.
5. **The Shelter Island conference, June 1947** — Lamb presents his data. Bethe, on the train home to Schenectady, does the first non-relativistic calculation on the back of an envelope and gets close to the right answer. The calculation is infinite; he cuts it off by hand at mc². It works.
6. **Renormalization, born** — Bethe's hack is made rigorous over the next two years by Schwinger, Feynman, Tomonaga. QED (FIG.13) becomes the most precisely tested theory in science. Agreement to twelve significant figures.
7. **Forward** — if the vacuum can shift atomic levels, what else can it do? Casimir effect, anomalous magnetic moment (FIG.13).

**Scenes to build (2):**

| File | Purpose |
|---|---|
| `lamb-shift-scene.tsx` | Split-screen: left is Dirac's degenerate levels; right is the observed split. Slider for the shift magnitude showing where the signal lives in frequency. Cartoon of a "fuzzy" electron being jostled by vacuum fluctuations. |
| `bethe-calculation-scene.tsx` | Animated walkthrough of Bethe's cutoff regularization. Shows the integral diverging, then being cut at mc², then yielding a finite number that matches Lamb. Historical, not rigorous. |

**Physicists:**
- Willis Lamb *(NEW — Nobel 1955, the measurement that forced QFT to grow up)*
- Hans Bethe *(NEW — the train-ride calculation)*
- Julian Schwinger *(NEW — renormalized QED, Nobel 1965)*
- Sin-Itiro Tomonaga *(NEW — independently renormalized QED in wartime Japan)*

**Glossary terms:**
- `lamb-shift` — phenomenon
- `virtual-particle` — concept
- `vacuum-fluctuations` — concept
- `renormalization` — concept (gentle; deeper in FIG.20)
- `qed` — concept

**Reading minutes:** 12.

---

### FIG.03 — The Zeeman Effect and Atomic Clocks

**Hook.** Pieter Zeeman, Leiden, 1896. He placed a sodium flame between the poles of an electromagnet and watched the spectral lines split. Lorentz explained it within days using his theory of electrons in orbit. It was the first direct proof that light was produced by charged things inside atoms, years before the electron was even named.

**Sections (7):**

1. **Splitting a line with a magnet** — weak field: normal Zeeman effect (three lines, classical). Stronger field, once spin matters: anomalous Zeeman effect (more lines, requires quantum mechanics).
2. **The Landé g-factor** — how much each sublevel shifts per unit field. A mashup of L, S, and J quantum numbers. The first time nuclear physicists got a knob they could really turn.
3. **The Paschen-Back limit** — crank the field high enough and L and S decouple; the spectrum simplifies again.
4. **Why anyone cares** — the Zeeman effect is how you measure magnetic fields on the surface of the Sun. Hale did it in 1908 and discovered sunspots are magnetic.
5. **Atomic clocks** — the 9,192,631,770 Hz hyperfine transition of cesium-133 defines the second. NIST-F2, the current US standard, keeps time to one part in 10¹⁶ — an error of one second in 300 million years.
6. **Optical clocks** — newer clocks based on transitions in strontium or ytterbium push this to 10⁻¹⁸. Good enough to see gravitational redshift over a 1 cm height difference. Relativity and atomic physics meeting in a tabletop experiment.
7. **Forward** — laser cooling (FIG.04) is what made optical clocks possible.

**Scenes to build (3):**

| File | Purpose |
|---|---|
| `zeeman-scene.tsx` | Magnetic-field slider. A spectral line is shown splitting as the field ramps up. Normal → anomalous → Paschen-Back regimes marked. |
| `atomic-clock-scene.tsx` | Cesium fountain cartoon. Atoms toss up, fall back, get probed by microwaves twice. Phase difference readout drives the frequency lock. |
| `optical-clock-scene.tsx` | Two optical clocks at different heights. Gravitational redshift shifts their tick rates by Δν/ν = gh/c². Slider for height. |

**Physicists:**
- Pieter Zeeman *(NEW — Nobel 1902, shared with Lorentz)*
- Hendrik Lorentz *(may exist from § 04)*
- George Ellery Hale *(NEW — solar magnetism via Zeeman)*

**Glossary terms:**
- `zeeman-effect` — phenomenon
- `lande-g-factor` — concept
- `atomic-clock` — technology
- `cesium-transition` — phenomenon

**Reading minutes:** 10.

---

### FIG.04 — Laser Cooling and Bose-Einstein Condensates

**Hook.** JILA, Boulder, June 5, 1995, 10:54 AM. Eric Cornell and Carl Wieman hold 2,000 rubidium-87 atoms at 170 nanokelvin — a temperature two billion times colder than anywhere else in the universe — and watch them collapse into a single quantum state. Einstein and Bose predicted this in 1924. It took seventy-one years to build the fridge.

**Sections (7):**

1. **Temperature is speed** — in a thermal gas, T sets the width of the velocity distribution. Cold atoms are slow atoms. Below a microkelvin, an atom moves less than a centimeter per second.
2. **Laser cooling, the idea** — shine a laser slightly red-detuned from an atomic transition. Atoms moving *toward* the laser see the light blue-shifted into resonance and absorb; atoms moving away don't. Every photon absorbed gives a tiny kick opposite to the atom's motion. Friction for atoms. Chu, Cohen-Tannoudji, Phillips share the 1997 Nobel.
3. **Optical molasses** — six lasers, three pairs along x, y, z. An atom feels friction in every direction. Microkelvin temperatures.
4. **Magneto-optical traps** — add a magnetic-field gradient and you also get a spatial confining force. Now atoms are not just cold but trapped.
5. **Evaporative cooling** — the last push. Let the hottest atoms escape; the rest re-thermalize colder. Standard technique for getting to nanokelvin.
6. **The BEC** — below a critical temperature, bosons pile into the ground state. A macroscopic quantum wavefunction you can photograph. Superfluidity, matter-wave interference, vortex lattices — all visible on a lab bench.
7. **Forward** — ultracold atoms now simulate condensed matter systems (Hubbard model, Ising model) and test fundamental physics (parity violation, permanent electric dipole moments). A bridge between atomic and nuclear physics (Module 2).

**Scenes to build (2):**

| File | Purpose |
|---|---|
| `laser-cooling-scene.tsx` | One atom, six lasers. Velocity vector decays visibly as photons strike. Red-detuning slider shows how wrong tuning kills the effect. |
| `bec-scene.tsx` | Momentum-space distribution of an atom cloud. Temperature slider. Above T_c: thermal bump. Below T_c: sharp spike in the center — the condensate peak. Classic Cornell-Wieman image. |

**Physicists:**
- Steven Chu *(NEW — laser cooling, later US Secretary of Energy)*
- Claude Cohen-Tannoudji *(NEW — theory of sub-Doppler cooling)*
- William Phillips *(NEW — trapped atoms, Zeeman slowing)*
- Eric Cornell & Carl Wieman *(NEW — first BEC, Nobel 2001)*
- Satyendra Nath Bose *(NEW — the statistics, 1924)*

**Glossary terms:**
- `laser-cooling` — technique
- `optical-molasses` — concept
- `magneto-optical-trap` — technique
- `bose-einstein-condensate` — phenomenon
- `evaporative-cooling` — technique

**Reading minutes:** 12.

---

## Module 2 · Nuclear Physics

The nucleus was the great accident of twentieth-century physics. Rutherford went looking for a confirmation of Thomson's plum-pudding atom and instead found that almost all the atom's mass was packed into a speck one-hundred-thousandth the size of the whole. Within three decades we had split it, fused it, and used it to end a war. The nucleus is where E = mc² stops being a slogan and starts being an accounting identity.

---

### FIG.05 — The Nucleus: Size, Shape, Binding

**Hook.** Manchester, 1909. Hans Geiger and Ernest Marsden, undergraduates, aim a beam of alpha particles at a sheet of gold foil about 400 nanometers thick. Most pass through. A tiny fraction bounce straight back. Rutherford: "It was quite the most incredible event that has ever happened to me in my life. It was as if you fired a 15-inch shell at a piece of tissue paper and it came back and hit you."

**Sections (7):**

1. **The plum-pudding ruined** — Thomson had the electron (1897) embedded in a diffuse positive sphere. Geiger-Marsden killed that model stone dead. The deflections demanded a tiny, dense, positive core.
2. **The Rutherford scattering formula** — dN/dΩ ∝ 1/sin⁴(θ/2). Matches Coulomb scattering off a point charge. Upper limit on nuclear size: 10⁻¹⁴ m. The atom is 99.9999999999% empty space.
3. **Protons and neutrons** — Rutherford names the proton in 1920. James Chadwick discovers the neutron in 1932 by firing alphas at beryllium and watching the neutral projectiles knock protons out of paraffin. The nucleus is nucleons.
4. **Size and shape** — R ≈ r₀ A^(1/3), with r₀ ≈ 1.2 fm. Density is constant across the table — nuclear matter is nearly incompressible. "Liquid drop" intuition (Bohr, Weizsäcker).
5. **Binding energy per nucleon** — the iconic curve. Peaks at iron-56 near 8.8 MeV. This curve explains everything downstream: fission releases energy when heavy nuclei split toward iron, fusion releases energy when light nuclei fuse toward iron. It is the single most important graph in nuclear physics.
6. **The semi-empirical mass formula** — volume, surface, Coulomb, asymmetry, pairing terms. Fits the binding curve with five tunable coefficients. Predicts which isotopes are stable.
7. **Forward** — if binding can release energy, how does it get out? FIG.06: radioactivity.

**Scenes to build (3):**

| File | Purpose |
|---|---|
| `rutherford-scattering-scene.tsx` | Alpha particle fired at a nucleus. Impact-parameter slider. Small b → large angle, occasional backscatter. 1/sin⁴(θ/2) histogram fills up over many shots. |
| `binding-curve-scene.tsx` | The binding-energy-per-nucleon curve, interactive. Hover on any A to see the isotope, its stability, its role (fission above iron, fusion below). Iron-56 marked. |
| `liquid-drop-scene.tsx` | The five SEMF terms as sliders; the total binding energy updates in real time. Shows why even-even nuclei are over-bound, why neutron excess grows with Z. |

**Physicists:**
- Ernest Rutherford *(NEW — the scattering, the proton, the father of nuclear physics)*
- Hans Geiger & Ernest Marsden *(NEW — the gold-foil experiment)*
- James Chadwick *(NEW — the neutron, 1932, Nobel 1935)*
- Carl Friedrich von Weizsäcker *(NEW — SEMF, later philosopher)*

**Glossary terms:**
- `rutherford-scattering` — phenomenon
- `nucleon` — concept
- `binding-energy` — concept
- `semi-empirical-mass-formula` — concept
- `iron-56` — concept

**Reading minutes:** 12.

---

### FIG.06 — Radioactivity: α, β, γ

**Hook.** Paris, March 1896. Henri Becquerel wraps a uranium salt in black paper, puts it in a drawer with a photographic plate, waits a few cloudy days, and develops the plate. The image of the uranium is burned right through the paper. No sunlight needed. An invisible emission, from the element itself, running down with no visible source. The Curies name it *radioactivity*.

**Sections (7):**

1. **Three flavors** — Rutherford sorts them by magnetic deflection (1899–1903). Alpha (positive, heavy, short range), beta (negative, light, longer range), gamma (no charge, penetrating — just photons of very high energy).
2. **Alpha decay** — a helium-4 nucleus tunnels out of the daughter nucleus. Gamow, 1928: the first application of quantum tunneling to an astrophysical/laboratory problem. Predicts Geiger-Nuttall: ln(τ) vs 1/√E is a straight line. It works.
3. **Beta decay** — a neutron becomes a proton, an electron, and an antineutrino. The spectrum of the emitted electron is *continuous*. Bohr almost gave up on energy conservation; Pauli (1930, in a letter, "dear radioactive ladies and gentlemen") postulated a ghost particle to save it. Fermi turned this into a full theory in 1933.
4. **Gamma decay** — the nucleus, after an alpha or beta transition, sits in an excited state. It drops to the ground state by emitting a photon. Same as atomic physics but at MeV energies.
5. **Activity and half-life** — N(t) = N₀ e^(-λt), τ½ = ln(2)/λ. Half-lives span from yoctoseconds to 10²⁰ years. Radiocarbon dating, uranium-lead dating, geochronology all live here.
6. **Decay chains** — U-238 → Th-234 → Pa-234 → ... → Pb-206, fourteen steps, all running in every granite kitchen counter in the world. Radon-222 is an intermediate; this is why basements get ventilated.
7. **Forward** — what holds a nucleus together against the Coulomb repulsion of its protons? The strong force (Module 4). And what *is* that electron-antineutrino pair doing? The weak force.

**Scenes to build (3):**

| File | Purpose |
|---|---|
| `decay-modes-scene.tsx` | One parent nucleus. Buttons for α, β⁻, β⁺, γ. Daughter nucleus updates on the nuclide chart. Cartoon emissions drift off to the right. |
| `tunneling-alpha-scene.tsx` | Potential well + Coulomb barrier. An alpha wavepacket inside. Tunneling probability as an exponential; barrier height and width sliders. Geiger-Nuttall line plots. |
| `half-life-scene.tsx` | Grid of 1024 atoms, decay over time. Live count of remaining atoms and fit to exponential. Half-life adjustable (in logarithmic decades). |

**Physicists:**
- Henri Becquerel *(NEW — 1896 discovery, Nobel 1903 with the Curies)*
- Marie Curie *(NEW — named the phenomenon, discovered polonium and radium)*
- Pierre Curie *(NEW — codiscoverer)*
- George Gamow *(NEW — quantum tunneling for alpha decay, later cosmology)*
- Wolfgang Pauli *(may exist from § 05 — the neutrino postulate)*
- Enrico Fermi *(NEW or in § 05 — theory of beta decay, 1933; the pile, 1942)*

**Glossary terms:**
- `radioactivity` — phenomenon
- `alpha-decay` — phenomenon
- `beta-decay` — phenomenon
- `gamma-decay` — phenomenon
- `half-life` — concept
- `neutrino` — particle (introduced here, deeper in FIG.14 and FIG.27)

**Reading minutes:** 13.

---

### FIG.07 — Fission and Fusion

**Hook.** Berlin-Dahlem, December 1938. Otto Hahn and Fritz Strassmann bombard uranium with neutrons and find, unmistakably, *barium* in the products. Barium is half the mass of uranium. Hahn writes to Lise Meitner — dismissed by the Nazis, hiding in Sweden — and she, walking in the snow with her nephew Otto Frisch, realizes the nucleus has *split*. They calculate the energy release using the binding curve: 200 MeV per event. The letter goes out in January 1939. Six and a half years later, Hiroshima.

**Sections (7):**

1. **Fission** — a heavy nucleus (U-235, Pu-239) absorbs a neutron, deforms, and breaks roughly in half. Two smaller nuclei plus 2–3 new neutrons plus ~200 MeV. The neutrons can trigger more fissions: chain reaction.
2. **Critical mass** — when the number of neutrons producing new fissions equals 1 per generation, the reaction sustains. Below: dies out. Above: exponential runaway. Geometry matters: a subcritical lump can be critical as a sphere.
3. **Fermi's pile, Chicago, December 2, 1942** — Chicago Pile-1, under the squash court at Stagg Field. 40,000 graphite blocks, uranium, cadmium control rods. First self-sustaining chain reaction. Arthur Compton: "the Italian navigator has landed in the New World."
4. **Reactors vs bombs** — reactors run slightly supercritical and are held at steady state by control rods that absorb excess neutrons. Bombs assemble a supercritical mass fast enough that the reaction grows before the assembly flies apart.
5. **Fusion** — two light nuclei fuse into a heavier one. D + T → He-4 + n + 17.6 MeV. Bethe (1938): stellar nucleosynthesis is fusion. The Sun is a gravitationally confined fusion reactor.
6. **The hard part** — Coulomb repulsion. You need tens of keV per particle (≈10⁸ K) to get fusion rates up. Stars confine with gravity; we try magnetic (tokamaks, ITER) or inertial (NIF, which achieved ignition in December 2022). Hard, solvable, still not commercial.
7. **Forward** — the same fusion reactions that power the Sun cooked the first generation of elements in the first few minutes of the universe. Stellar nucleosynthesis: FIG.08.

**Scenes to build (3):**

| File | Purpose |
|---|---|
| `fission-chain-scene.tsx` | Grid of U-235 nuclei. Drop in a neutron; watch the cascade. k-effective slider: subcritical (dies), critical (steady), supercritical (explodes). |
| `fusion-tunneling-scene.tsx` | Two deuterons approaching. Coulomb barrier visible, tunneling probability vs kinetic energy plotted. Temperature slider converts to Maxwell-Boltzmann tail. |
| `binding-energy-tour-scene.tsx` | The binding curve with animated arrows showing fusion (moving up from left) and fission (moving up from right) both climbing toward iron. Energy released = Δ(binding/A) × A. |

**Physicists:**
- Lise Meitner *(NEW — the interpretation, passed over for the 1944 Nobel)*
- Otto Hahn *(NEW — the experiment, sole Nobel 1944 in a controversial decision)*
- Otto Frisch *(NEW — Meitner's nephew, coined "fission")*
- Enrico Fermi *(NEW or reused — Chicago Pile-1)*
- Hans Bethe *(reused — stellar nucleosynthesis, 1938)*

**Glossary terms:**
- `fission` — phenomenon
- `chain-reaction` — concept
- `critical-mass` — concept
- `fusion` — phenomenon
- `tokamak` — technology
- `ignition` — concept

**Reading minutes:** 13.

---

### FIG.08 — Stellar Nucleosynthesis

**Hook.** Cambridge, 1957. Margaret and Geoffrey Burbidge, William Fowler, and Fred Hoyle publish *Synthesis of the Elements in Stars* — eight hundred pages, always cited as "B²FH." It answers a question Aristotle would have recognized: where does everything come from? Answer, in a phrase: "we are, all of us, star stuff" — every atom in your body heavier than helium was forged in the core of a star that died before the Sun was born.

**Sections (7):**

1. **Big Bang nucleosynthesis** — the first three minutes. H, He-4, a trace of Li. Density and temperature drop too fast to make anything heavier. Predicts helium fraction ~24% by mass — confirmed.
2. **The pp chain and the CNO cycle** — how hydrogen burns to helium in main-sequence stars. pp for stars like the Sun, CNO for hotter cores. Both net: 4p → He-4 + 2e⁺ + 2ν_e + 26.7 MeV.
3. **The triple-alpha process** — Hoyle, 1954, reasoning backward: for carbon to exist in the abundance we see, there *must* be a resonance in C-12 at 7.65 MeV. Willy Fowler measured it and found it. The single most impressive predictive inference in nuclear astrophysics.
4. **Up the ladder** — C burns to O, Ne, Mg; O burns to Si; Si captures alphas up to nickel-56. Each stage happens at higher T, in a smaller core, for a shorter time. Onion-shell structure of a supergiant just before collapse.
5. **Iron and the wall** — at iron-56 the binding curve peaks; fusion stops being exothermic. The core can't support itself and collapses in about a second. Type II supernova.
6. **Beyond iron** — the r-process (rapid neutron capture, in neutron-star mergers) and s-process (slow, in AGB stars). LIGO + Virgo saw gold and platinum being made in the neutron-star merger GW170817, August 17, 2017 — a direct observation of cosmic alchemy.
7. **Forward** — everything above was nuclear and gravitational. To understand the Big Bang itself, we need the particle sector: what was around when temperatures exceeded a GeV? Module 3.

**Scenes to build (2):**

| File | Purpose |
|---|---|
| `pp-chain-scene.tsx` | Animated pp-I, pp-II, pp-III chains. Click a step to see the Q-value. Solar neutrinos emerge, with tags (pp, Be-7, B-8). |
| `onion-star-scene.tsx` | Cross-section of a 20-solar-mass star just before supernova. Shells labeled H, He, C, O, Si, Fe. Timescale slider: H burning 10⁷ yr, Si burning 1 day. |

**Physicists:**
- Fred Hoyle *(NEW — B²FH, the carbon resonance prediction, also coined "Big Bang" as a slur)*
- William Fowler *(NEW — Nobel 1983, the nuclear experimentalist of the group)*
- Margaret & Geoffrey Burbidge *(NEW — observational astronomy half of B²FH)*
- George Gamow *(reused — BBN pioneer)*

**Glossary terms:**
- `big-bang-nucleosynthesis` — phenomenon
- `pp-chain` — process
- `cno-cycle` — process
- `triple-alpha` — process
- `r-process` — process
- `supernova` — phenomenon

**Reading minutes:** 12.

---

## Module 3 · Particle Physics I — the Zoo and the Model

The twentieth century discovered more particles than anyone had asked for. The electron (1897) was expected. The positron (1932) was not — it came out of Dirac's equation first, then out of a cloud chamber. The muon (1936) prompted Rabi's famous "who ordered that?" By 1960 there were so many "elementary" particles that Fermi said, "if I could remember the names of these particles I would have been a botanist." The Standard Model, assembled 1967–1975, cut the zoo down to a dozen matter particles, twelve force carriers, and one scalar — and has survived every test for fifty years.

---

### FIG.09 — The Discovery History (1897–2012)

**Hook.** A single-column timeline. 1897: Thomson weighs the electron in a cathode-ray tube at the Cavendish. 2012: ATLAS and CMS announce the Higgs boson at CERN. One hundred fifteen years, twenty-odd Nobel prizes, and the most complete piece of physics ever assembled.

**Sections (7):**

1. **Thomson and the electron, 1897** — cathode rays deflect in electric and magnetic fields. Thomson measures e/m, realizes these "corpuscles" are a constituent of *all* matter. The first subatomic particle.
2. **Rutherford's nucleus, 1911; Chadwick's neutron, 1932** — recap from Module 2. Now we have proton, neutron, electron — a satisfying minimalism that lasts about a year.
3. **The positron, 1932** — Carl Anderson, Caltech, cloud chamber photograph of a positively charged particle with the electron's mass, curling the wrong way in a magnetic field. Dirac's 1928 prediction walks out of the sky. First antiparticle.
4. **The muon, 1936; the pion, 1947** — Anderson and Neddermeyer find a heavier "electron" in cosmic rays. Yukawa had predicted a mediator of the nuclear force with ~100 MeV mass; the muon looked right but turned out to be a lepton. The actual mediator — Yukawa's pion — was found by Powell in 1947. Two particles mistaken for each other for eleven years.
5. **The strange particles, 1950s** — kaons, lambdas, sigmas produced in pairs, decaying slow. Gell-Mann and Nishijima invent "strangeness" as a new conserved quantum number. The zoo opens.
6. **Quarks, 1964** — Gell-Mann and Zweig: all the hadrons can be built from three "quarks" (Gell-Mann's joke name, from Finnegans Wake). Charm (1974), bottom (1977), top (1995) join later.
7. **The Higgs, 2012** — CERN, July 4. ATLAS and CMS independently show a 125 GeV resonance. Englert and Higgs (not Brout, who had died) get the 2013 Nobel. The Standard Model closes.

**Scenes to build (2):**

| File | Purpose |
|---|---|
| `particle-timeline-scene.tsx` | Horizontal timeline 1897–2012. Each discovery a dot; hover for photo, discoverer, lab, method. Filters: matter/antimatter/force carrier. |
| `cloud-chamber-scene.tsx` | A minimal cloud chamber. Particles traverse a magnetic field; curvature + direction determine charge/mass. Toy where you can "discover" the positron. |

**Physicists:**
- J.J. Thomson *(NEW — 1906 Nobel, the electron)*
- Carl Anderson *(NEW — positron 1932, muon 1936)*
- Cecil Powell *(NEW — pion, Nobel 1950)*
- Hideki Yukawa *(NEW — predicted the meson, Nobel 1949, first Japanese laureate)*
- Murray Gell-Mann *(NEW — strangeness, quarks, Nobel 1969)*
- George Zweig *(NEW — independent co-inventor of quarks, called them "aces")*

**Glossary terms:**
- `electron` — particle
- `positron` — particle
- `muon` — particle
- `pion` — particle
- `strangeness` — concept
- `quark` — particle

**Reading minutes:** 13.

---

### FIG.10 — The Standard Model Table

**Hook.** A single page, a single table, the accumulated work of a century. Three generations of quarks, three generations of leptons, four (or twelve, counting colors and polarizations) gauge bosons, one Higgs. Everything ever measured at an accelerator fits. Nothing *not* in the table has ever been confirmed at one.

**Sections (7):**

1. **The twelve matter particles** — three generations × (up-type quark, down-type quark, charged lepton, neutrino). Each heavier than the last. Only the first generation makes up ordinary matter; the other two exist and decay.
2. **Why three generations?** — nobody knows. A deep open question. The LEP experiments at CERN constrained the number of light neutrino species to 2.984 ± 0.008 in 1989 — there are exactly three, no more.
3. **The force carriers** — photon (electromagnetism), W⁺/W⁻/Z (weak), eight gluons (strong). Plus the graviton, if it exists, for gravity (Module 9).
4. **The Higgs** — one scalar field, one discovered particle, the mechanism that gives mass to the W and Z and the charged fermions. Module 5 details the mechanism.
5. **Quantum numbers** — each particle is labeled by charge, spin, baryon number, lepton number, flavor, color (for quarks). These labels are conserved (or approximately conserved, in the case of flavor) by the interactions.
6. **What the Standard Model does NOT include** — gravity, dark matter, dark energy, neutrino masses (kind of; added on), matter-antimatter asymmetry. Module 8 collects these.
7. **Forward** — the table lists the players. How they interact (Module 4) is a second layer.

**Scenes to build (2):**

| File | Purpose |
|---|---|
| `sm-table-scene.tsx` | The canonical colored table. Click a cell: particle properties, discovery year, decay modes, mass, charge, spin. |
| `mass-spectrum-scene.tsx` | Log-scale chart of all SM particle masses. Shows the enormous dynamic range: neutrino < 1 eV to top quark at 173 GeV, a factor of 10¹¹. |

**Physicists:**
- Steven Weinberg *(NEW — electroweak unification, Nobel 1979)*
- Sheldon Glashow *(NEW — early electroweak, shared Nobel)*
- Abdus Salam *(NEW — independently, shared Nobel, first Muslim laureate in science)*
- Makoto Kobayashi & Toshihide Maskawa *(NEW — predicted the third generation to allow CP violation, Nobel 2008)*

**Glossary terms:**
- `standard-model` — theory
- `generation` — concept
- `gauge-boson` — particle class
- `flavor` — concept
- `lepton` — particle class

**Reading minutes:** 11.

---

### FIG.11 — Quarks, Color, and Confinement

**Hook.** 1974, two labs simultaneously, same particle, different names. SLAC's Burton Richter calls it ψ; Brookhaven's Samuel Ting calls it J. The "November Revolution" — a narrow, heavy resonance that only makes sense as a bound state of a new, fourth quark. Charm. The Standard Model had predicted it (GIM mechanism, 1970) and now it was real.

**Sections (7):**

1. **Six quarks** — u, d (in nucleons), s (strangeness), c (charm), b (bottom), t (top). Masses span from 2 MeV (up) to 173 GeV (top) — top is the heaviest particle in the Standard Model.
2. **Color charge** — each quark comes in three colors (red, green, blue). Not a visual property; a label for SU(3) charge. Observable hadrons are color-singlets: either qq̄ (meson) or qqq (baryon) or the recently confirmed tetra- and pentaquarks.
3. **Confinement** — you cannot isolate a free quark. Pull two apart and the gluon "string" between them stores energy linearly with distance; eventually it snaps into a new qq̄ pair. You always get hadrons out, never bare quarks.
4. **Asymptotic freedom** — at high energy (short distance), the strong coupling gets *weaker*. The opposite of QED. Gross, Politzer, Wilczek: Nobel 2004.
5. **Deep inelastic scattering** — SLAC, late 1960s. Fire high-energy electrons at protons, watch them scatter off point-like things inside. Feynman calls them "partons"; they turn out to be quarks (and gluons). The first experimental evidence that the quark model is more than a bookkeeping trick.
6. **The top quark, 1995** — Fermilab's Tevatron, D0 and CDF experiments. 173 GeV, as heavy as a tungsten atom in one quantum. The top is so heavy it decays before it can hadronize — the only quark you ever see "bare."
7. **Forward** — QCD, the theory of colors and gluons: Module 4.

**Scenes to build (2):**

| File | Purpose |
|---|---|
| `quark-model-scene.tsx` | Drag-and-drop quarks into mesons and baryons. Build a pion, a proton, a kaon, a J/ψ. Charge and spin update. |
| `confinement-scene.tsx` | Two quarks. Pull them apart with a slider. Potential energy grows linearly. At some distance, the string snaps and a qq̄ pair appears. |

**Physicists:**
- Burton Richter & Samuel Ting *(NEW — J/ψ, joint Nobel 1976)*
- David Gross, David Politzer, Frank Wilczek *(NEW — asymptotic freedom, Nobel 2004)*
- Jerome Friedman, Henry Kendall, Richard Taylor *(NEW — SLAC DIS, Nobel 1990)*

**Glossary terms:**
- `color-charge` — concept
- `confinement` — concept
- `asymptotic-freedom` — concept
- `hadron` — particle class
- `meson` — particle class
- `baryon` — particle class
- `quark-gluon-plasma` — phenomenon (cameo)

**Reading minutes:** 12.

---

### FIG.12 — Leptons and the Muon Puzzle

**Hook.** 1936, Pasadena. Carl Anderson and Seth Neddermeyer are photographing cosmic rays in a cloud chamber at Pike's Peak and see tracks with the electron's charge but 207× its mass. I.I. Rabi, later, on being told about a related discovery: "Who ordered that?" Eighty-nine years later, Fermilab's Muon g-2 experiment is reporting the magnetic moment of the muon to parts per billion and finding a tension with Standard Model theory — still unresolved.

**Sections (7):**

1. **The lepton family** — electron, muon, tauon; electron neutrino, muon neutrino, tau neutrino. Six leptons, three generations. Charged leptons interact electromagnetically and weakly; neutrinos only weakly.
2. **The muon's weirdness** — 207× heavier than the electron, but otherwise a carbon copy. Lifetime 2.2 μs. Cosmic rays at sea level are mostly muons, kept alive on the way down by relativistic time dilation (§ 04 callback).
3. **The tau** — Martin Perl, SLAC, 1975. 3,477× the electron's mass; decays fast enough that you only infer it from missing energy.
4. **Neutrinos** — tiny mass (< 1 eV scale), no charge, only weak interaction. Cross-section so small that a cubic light-year of lead stops half the solar neutrinos. Wolfgang Pauli invented them to save β-decay energy conservation (FIG.06). First direct detection: Cowan and Reines, 1956, at a nuclear reactor in Savannah River.
5. **Lepton-flavor conservation** — electron number, muon number, tau number: conserved separately in Standard Model interactions. Until we found neutrino oscillations (FIG.27) — then not quite.
6. **The g-2 anomaly** — the muon's magnetic moment should be g = 2 at tree level; loops push it slightly higher. Theory and experiment agree to ten significant figures, and *disagree* at the eleventh. ~4σ tension as of the latest Fermilab run. Either BSM physics, or a subtle hadronic calculation that the lattice QCD people are still sorting out.
7. **Forward** — neutrino masses and oscillations are a crack in the Standard Model. More in Module 8.

**Scenes to build (2):**

| File | Purpose |
|---|---|
| `lepton-family-scene.tsx` | Six cards — three charged leptons, three neutrinos. Mass, lifetime, discovery year, dominant decay mode. |
| `cosmic-muon-scene.tsx` | Upper atmosphere, cosmic proton hits a nucleus, pion decays to muon, muon travels down. Without time dilation, only 1 in 20 survive to sea level; with it, about half. Slider for γ. |

**Physicists:**
- Martin Perl *(NEW — tau lepton, Nobel 1995)*
- Clyde Cowan & Frederick Reines *(NEW — first neutrino detection)*
- I.I. Rabi *(NEW — the "who ordered that" quip, also Nobel 1944 for nuclear magnetic resonance)*

**Glossary terms:**
- `tau` — particle
- `neutrino-cross-section` — concept
- `lepton-flavor` — concept
- `muon-g-2` — phenomenon

**Reading minutes:** 11.

---

## Module 4 · Particle Physics II — Interactions

Having named the players (Module 3), now we watch them interact. Three forces live in the Standard Model: electromagnetic, weak, strong. Each has a carrier, a coupling strength, and a distinctive behavior. The remarkable thing — the thing that still feels slightly miraculous — is that all three are described by the same mathematical structure: a quantum field theory of a gauge group. Module 5 will explain what that sentence means.

---

### FIG.13 — QED, the Gold Standard

**Hook.** 1948, Pocono Manor Inn, Pennsylvania. Feynman gets up and scrawls strange stick-figure diagrams on the board. Nobody in the audience — Bohr, Oppenheimer, Wheeler, Teller — knows what they mean. Schwinger has just presented his beautiful, impenetrable operator formalism. The next day Dyson will realize they're the same theory. QED is born as the first complete quantum field theory; it becomes, by twelve decimal places, the most accurately verified physical theory ever written down.

**Sections (7):**

1. **Electromagnetism, quantized** — a charged particle exchanges photons. Every interaction breaks down into vertex factors, propagators, and external-line factors. Feynman's diagrams are a bookkeeping for perturbation theory.
2. **The vertex** — one charged line emits or absorbs one photon. Coupling constant is √α ≈ 1/√137 at each vertex. Two vertices in an interaction means α in the amplitude, α² in the rate. Perturbation converges because α is small.
3. **Virtual particles** — internal lines in a diagram. They need not obey E² = p²c² + m²c⁴ (off-shell). They live only for the duration of the uncertainty principle allows.
4. **Scattering cross-sections** — Møller (e⁻e⁻), Bhabha (e⁻e⁺), Compton (γe⁻), pair production. Each is a short sum of tree-level diagrams; each matches experiment.
5. **The anomalous magnetic moment** — g_e = 2 + α/π + ... (Schwinger's one-loop correction, 1948). Measured g_e − 2 = 0.00231930436322 ± 10⁻¹² (Harvard Penning trap). The best agreement between theory and experiment in the history of science.
6. **Renormalization** — infinities in loop integrals are absorbed into the definition of the physical mass and charge. The bare charge in the Lagrangian is a fiction; the charge you measure is the renormalized one. This seemed like a trick in 1948; Wilson made it a physical picture in the 1970s (Module 6).
7. **Forward** — QCD and the weak force borrow this machinery, with complications (FIG.14 and FIG.15).

**Scenes to build (2):**

| File | Purpose |
|---|---|
| `feynman-diagram-scene.tsx` | Diagram builder. Palette of vertices. Drag photons and electron lines to build tree-level diagrams. The amplitude is computed symbolically. |
| `compton-scattering-scene.tsx` | A photon hits a resting electron. Energy and angle of the scattered photon plotted against scattering angle. Classical (Thomson) vs relativistic (Compton) formulae overlaid. |

**Physicists:**
- Richard Feynman *(may exist from § 05 — diagrams, path integral, QED, Nobel 1965)*
- Julian Schwinger *(NEW — operator QED, Nobel 1965)*
- Sin-Itiro Tomonaga *(reused — independent QED, Nobel 1965)*
- Freeman Dyson *(NEW — proved Feynman's and Schwinger's theories were the same, should have had a Nobel)*

**Glossary terms:**
- `feynman-diagram` — tool
- `vertex-factor` — concept
- `propagator` — concept
- `cross-section` — concept
- `anomalous-magnetic-moment` — phenomenon

**Reading minutes:** 13.

---

### FIG.14 — The Weak Force

**Hook.** 1956, Columbia. Chien-Shiung Wu cools cobalt-60 to a millikelvin in a strong magnetic field, aligns the nuclei, and counts the beta electrons coming out. They come out preferentially *opposite* to the nuclear spin — a violation of parity. Left and right, which had been assumed indistinguishable in physics since Leibniz, are not. The weak force picks a handedness.

**Sections (7):**

1. **What the weak force does** — it changes flavor. A d-quark becomes a u-quark, emitting a W⁻. A muon becomes a muon-neutrino, emitting a W⁺. It is the *only* force that does this. Without it, the Sun wouldn't shine (protons couldn't fuse to deuterium — needs p → n conversion).
2. **Fermi's four-fermion theory, 1933** — the first weak theory. Works at low energy; diverges at high. An effective field theory of something deeper.
3. **W and Z bosons** — massive mediators (80 GeV and 91 GeV). Discovered at CERN's SPS in 1983 by the UA1 and UA2 experiments; Rubbia and van der Meer, Nobel 1984. The first direct confirmation of the Weinberg-Salam theory.
4. **Parity violation** — the Wu experiment (hook). Left-handed particles and right-handed antiparticles feel the weak force; their mirror images do not. Lee and Yang suggested testing this in 1956; Wu did the experiment; Lee and Yang got the Nobel in 1957; Wu did not.
5. **CP violation** — maybe nature respects parity combined with charge conjugation? Cronin and Fitch, 1964, neutral kaons: no, it doesn't. A tiny effect (10⁻³) but real. Sakharov showed (1967) that CP violation is a precondition for the matter-antimatter asymmetry of the universe.
6. **Weak isospin and electroweak unification** — the photon and the Z are the two mass eigenstates of a mixing between the W³ and B bosons (the "Weinberg angle"). Above about 100 GeV, electromagnetism and the weak force are one symmetric thing.
7. **Forward** — the mass-giving mechanism for W and Z (and for quarks and leptons) is the Higgs. Module 5.

**Scenes to build (2):**

| File | Purpose |
|---|---|
| `beta-decay-diagram-scene.tsx` | Feynman diagram of n → p + e⁻ + ν̄_e at the quark level: d → u + W⁻ → u + e⁻ + ν̄_e. Interactive labels, toggle for quark-level vs nucleon-level. |
| `wu-experiment-scene.tsx` | Polarized Co-60. Magnetic field slider aligns spins. Electron emission distribution visualized — forward/back asymmetry grows as alignment improves. |

**Physicists:**
- Chien-Shiung Wu *(NEW — the parity experiment, passed over for Nobel)*
- Tsung-Dao Lee & Chen-Ning Yang *(NEW — predicted parity violation, Nobel 1957)*
- James Cronin & Val Fitch *(NEW — CP violation, Nobel 1980)*
- Carlo Rubbia & Simon van der Meer *(NEW — W and Z discovery, Nobel 1984)*
- Andrei Sakharov *(NEW — the three conditions for baryogenesis)*

**Glossary terms:**
- `weak-interaction` — concept
- `w-boson` — particle
- `z-boson` — particle
- `parity-violation` — phenomenon
- `cp-violation` — phenomenon

**Reading minutes:** 13.

---

### FIG.15 — QCD and the Strong Force

**Hook.** Summer 1973, in three papers, one from Harvard (Politzer) and two from Princeton (Gross and Wilczek), asymptotic freedom is proved. The strong coupling runs *down* at high energy. Everything about the quark model that had been confusing — why it worked at short distances but no free quarks were seen — falls into place. QCD, the gauge theory of colored quarks and gluons, is the strong force.

**Sections (7):**

1. **SU(3) color** — three colors per quark, eight gluons (because SU(3) has 3²−1 = 8 generators, Module 5). Gluons carry color themselves (unlike photons, which carry no charge), which is the root of the nonlinearity.
2. **Running coupling** — α_s(Q²). Large at low Q (confinement); small at high Q (asymptotic freedom). The opposite behavior to QED.
3. **Hadronization** — when you slam partons together at high energy, you see jets — collimated sprays of hadrons. Each jet is one parton "getting dressed" into bound states as the color field fragments.
4. **The QCD vacuum** — not empty. A condensate of quark-antiquark pairs. Chiral symmetry is spontaneously broken; most of the proton's mass (about 99%) comes from gluon and quark-condensate energy, not from the Higgs mechanism.
5. **Lattice QCD** — solve QCD numerically by discretizing spacetime. The only rigorous way to handle the confined regime. Modern lattice calculations match hadron masses to a few percent.
6. **Quark-gluon plasma** — at temperatures above ~150 MeV (about 10¹² K), quarks and gluons deconfine. The early universe was in this phase for its first ~10 μs. RHIC (Brookhaven) and ALICE (CERN) make quark-gluon plasma in heavy-ion collisions; it behaves as an almost perfect fluid.
7. **Forward** — the structure of QCD is a gauge theory. To understand what that means, and why it is so powerful, Module 5.

**Scenes to build (2):**

| File | Purpose |
|---|---|
| `running-coupling-scene.tsx` | Log plot of α(Q) for electromagnetic and strong couplings. Note α_em grows (mildly) with Q; α_s shrinks. Scale slider. |
| `jet-formation-scene.tsx` | A collider "event display." Two quarks fly out back-to-back after a hard scatter; a spray of hadrons forms around each. Number of hadrons grows with jet energy. |

**Physicists:**
- Frank Wilczek, David Gross, David Politzer *(reused — asymptotic freedom)*
- Kenneth Wilson *(cameo — lattice QCD, RG, Nobel 1982; appears again in Module 6)*

**Glossary terms:**
- `qcd` — theory
- `gluon` — particle
- `running-coupling` — concept
- `jet` — phenomenon
- `lattice-qcd` — technique
- `quark-gluon-plasma` — phenomenon

**Reading minutes:** 12.

---

## Module 5 · Symmetries and Gauge Theories

Why does the Standard Model look the way it does? The answer is symmetry. Emmy Noether proved in 1918 that every continuous symmetry of a physical law gives a conserved quantity. Weyl, in 1929, proposed promoting symmetries from global to local — requiring them to hold independently at every point — and found that this forced the existence of connection fields. Those fields are exactly the gauge bosons. Electromagnetism, the weak force, and the strong force are all gauge theories. The Higgs mechanism is what lets this framework accommodate massive force carriers.

---

### FIG.16 — Noether's Theorem

**Hook.** Göttingen, 1918. Emmy Noether, 36, unable to hold a tenured professorship because of her sex, proves the theorem that Einstein will call "a monumental piece of mathematical thinking" — the deepest connection between the structure of physical laws and the quantities they conserve. § 02 mentioned her in passing. Here we give her theorem its due.

**Sections (7):**

1. **The statement** — for every continuous symmetry of the action, there is a conserved current and a conserved charge. Simple sentence; vast consequences.
2. **Translation invariance → momentum conservation** — if the laws are the same here and over there, momentum is conserved.
3. **Time invariance → energy conservation** — if the laws are the same now and later, energy is conserved.
4. **Rotational invariance → angular momentum conservation** — if the laws don't care which way you face, angular momentum is conserved.
5. **Internal symmetries** — phase rotations of the electron wavefunction. Noether: electric charge is conserved. This is the cleanest way to understand why charge is conserved in the first place.
6. **Why it matters here** — every conservation law in particle physics is a Noether consequence of an underlying symmetry. The Standard Model is organized by its symmetry group.
7. **Forward** — gauge symmetries (FIG.17) are Noether symmetries promoted to locality.

**Scenes to build (2):**

| File | Purpose |
|---|---|
| `noether-orbits-scene.tsx` | Central-force orbit. Rotate the whole apparatus; the orbit is unchanged. Angular momentum is the conserved charge. |
| `symmetry-conservation-scene.tsx` | Side panel table of symmetries and their conserved charges. Click a row to see a cartoon demonstration. |

**Physicists:**
- Emmy Noether *(NEW — her theorem, 1918, cameo in § 02)*
- Hermann Weyl *(NEW — gauge symmetry, 1929)*

**Glossary terms:**
- `noethers-theorem` — theorem
- `conserved-charge` — concept
- `symmetry-group` — concept
- `gauge-symmetry` — concept (stub, expanded next)

**Reading minutes:** 10.

---

### FIG.17 — Gauge Theories: U(1), SU(2), SU(3)

**Hook.** Weyl, 1929, notices that if you allow the phase of an electron's wavefunction to change independently at every spacetime point, the Schrödinger equation develops extra terms — terms that look exactly like electromagnetism. The electromagnetic field is what you need to *enforce* local phase symmetry. Reverse the logic: demand local symmetry, you get the force for free.

**Sections (7):**

1. **Global vs local symmetry** — ψ → e^(iθ)ψ with θ the same everywhere (global, trivial) vs θ(x) varying (local, requires a gauge field).
2. **U(1) → QED** — one phase per point. The gauge field is the photon (one particle, massless, charge zero). One coupling, one conserved charge (electric charge).
3. **SU(2) → the weak force** — a 2×2 unitary transformation per point. The group has three generators; three gauge bosons: W¹, W², W³. Three conserved charges (weak isospin components).
4. **SU(3) → QCD** — a 3×3 unitary transformation per point. Eight generators, eight gluons. Color charge.
5. **The Standard Model group** — SU(3) × SU(2) × U(1). Twelve gauge bosons (8 + 3 + 1). Matter fields arrange themselves into specific representations of this group — which is how we know the electron's charge is −1 and the up-quark's is +2/3.
6. **Why gauge theories are beautiful** — the form of the interactions is fixed by the group structure. You don't choose the Lagrangian; the symmetry does.
7. **Forward** — one puzzle: the W and Z are massive, but a naive gauge boson mass term breaks the symmetry. The Higgs mechanism (FIG.18) is the fix.

**Scenes to build (2):**

| File | Purpose |
|---|---|
| `gauge-phase-scene.tsx` | A 2D wavefunction with a phase indicator. Slider rotates the phase globally (nothing changes) or locally (you see a gradient pattern that represents the emergent gauge field). |
| `sm-gauge-group-scene.tsx` | Diagram of SU(3) × SU(2) × U(1). Click a factor to see which bosons and which matter representations live under it. |

**Physicists:**
- Hermann Weyl *(reused)*
- Chen-Ning Yang & Robert Mills *(NEW — non-abelian gauge theory, 1954, the template for SU(2) and SU(3) gauge theories)*

**Glossary terms:**
- `gauge-theory` — theory class
- `u1-symmetry` — concept
- `su2-symmetry` — concept
- `su3-symmetry` — concept
- `yang-mills` — theory

**Reading minutes:** 12.

---

### FIG.18 — The Higgs Mechanism

**Hook.** Edinburgh, 1964. Peter Higgs, bored on a bank holiday, goes for a walk and realizes that Philip Anderson's idea about superconductors can be lifted to relativistic field theory — the symmetry can hide itself, give mass to gauge bosons, and leave a ghostly scalar particle behind. He writes two short papers. The second one, with an extra paragraph predicting a massive scalar, is initially rejected by *Physics Letters* and accepted by *PRL*. Forty-eight years later, two 10,000-person collaborations with eight-billion-dollar instruments will confirm that paragraph.

**Sections (7):**

1. **The problem** — W and Z are massive (80, 91 GeV), photon is massless. In a gauge theory, a bare mass term for gauge bosons breaks the symmetry. How do you get mass without breaking the symmetry explicitly?
2. **Spontaneous symmetry breaking** — the Lagrangian is symmetric, the vacuum isn't. A ball at the top of a Mexican-hat potential — all directions are equal — but once it rolls down, it's picked one. Analog: a ferromagnet below Curie temperature.
3. **The Higgs field** — a complex doublet of scalar fields filling all of space. Its potential has a Mexican-hat shape; its vacuum value is nonzero (~246 GeV).
4. **Eating a Goldstone** — Goldstone's theorem says spontaneous breaking of a continuous symmetry gives massless "Goldstone bosons." In a gauge theory, these Goldstones are "eaten" by the gauge bosons — the gauge bosons acquire a longitudinal polarization and become massive.
5. **Quark and lepton masses** — Yukawa couplings between the Higgs field and matter fermions give fermions their mass proportional to the Higgs VEV times the coupling. Why the top is 350,000× heavier than the electron is still a free parameter.
6. **The Higgs discovery, July 4, 2012** — ATLAS and CMS at CERN's LHC independently see a 125 GeV resonance. Decay modes into γγ, ZZ, WW match predictions. Englert and Higgs, Nobel 2013 (Brout had died in 2011; the rule against posthumous awards cost him the prize).
7. **Forward** — the Higgs is strange. Its mass is 125 GeV but quantum corrections should push it near the Planck scale (10¹⁹ GeV). Why isn't it? The hierarchy problem, Module 8.

**Scenes to build (3):**

| File | Purpose |
|---|---|
| `mexican-hat-scene.tsx` | 3D Mexican-hat potential. A ball rolls to the minimum; angle around the brim shows the continuous degeneracy. Temperature slider: above T_c, symmetry restored; below, broken. |
| `higgs-mass-generator-scene.tsx` | A gauge boson "flies through" a Higgs field. Drag the Higgs VEV slider; the boson's inertia grows. Top quark: heavy drag. Photon: no drag. |
| `atlas-diphoton-scene.tsx` | Cartoon of the ATLAS γγ invariant mass spectrum. Background + bump. Drag a slider for integrated luminosity; see the bump emerge with more data. |

**Physicists:**
- Peter Higgs *(NEW — Nobel 2013)*
- François Englert *(NEW — Nobel 2013, with Robert Brout)*
- Robert Brout *(NEW — died 2011, missed the Nobel)*
- Philip Anderson *(NEW — condensed-matter origin of the mechanism, Nobel 1977)*
- Jeffrey Goldstone *(NEW — the theorem)*

**Glossary terms:**
- `higgs-field` — concept
- `higgs-boson` — particle
- `spontaneous-symmetry-breaking` — phenomenon
- `goldstone-boson` — concept
- `yukawa-coupling` — concept
- `vev` — concept (vacuum expectation value)

**Reading minutes:** 14.

---

## Module 6 · Quantum Field Theory — gentle

We've been using QFT for the last three modules; now we pause to say what it is and what it isn't. This module is deliberately non-technical. Handwave honestly: no path integrals from first principles, no dimensional regularization. Just the conceptual moves that matter — why fields, not particles; what a virtual particle actually is; what the vacuum is doing; what renormalization means after Wilson.

---

### FIG.19 — Why Fields, Not Particles

**Hook.** 1927, Dirac's paper "The Quantum Theory of the Emission and Absorption of Radiation" treats the electromagnetic field as a collection of quantum oscillators. The photon falls out as an excitation of the field, not as a preexisting particle that gets emitted. The move to fields is forced; once you have relativity, you cannot keep a fixed number of particles.

**Sections (7):**

1. **The relativistic problem** — in § 05, quantum mechanics had a fixed number of particles. But E = mc² means at high enough energy, particles can be created from energy. A fixed-particle theory breaks.
2. **Fields everywhere** — to every particle type, a field filling spacetime. Electron field, photon field, up-quark field. Particles are quantized excitations of those fields.
3. **Quanta as ripples** — a single photon is a single-quantum excitation of the EM field. Two photons, two excitations. The same field describes every photon and every electron in the universe.
4. **Indistinguishability, explained** — why are all electrons identical? Because they're excitations of the same field. That's what the statement means. Bosons vs fermions fall out of whether the field commutes or anticommutes.
5. **The vacuum** — the field in its ground state. Not empty; fizzing. Zero-point energy everywhere. Forces (Casimir) can be computed from it.
6. **Creation and annihilation operators** — the tools of the trade. â creates a quantum of the field; â† destroys one. The field operator is a sum of these over all momenta.
7. **Forward** — once you have fields, interactions between them are described by Feynman diagrams (FIG.13). And the question "what happens in a loop" leads to renormalization (FIG.20).

**Scenes to build (2):**

| File | Purpose |
|---|---|
| `field-excitation-scene.tsx` | A scalar field shown as a 2D height map. Click to deposit a localized "bump" — one quantum. The bump propagates and disperses. Two bumps scatter. |
| `vacuum-fluctuation-scene.tsx` | The vacuum state of a quantum field shown as a small statistical wiggle everywhere. Zoom in: never exactly zero; expected value zero, variance finite. |

**Physicists:**
- Paul Dirac *(reused — the first QFT paper)*
- Pascual Jordan *(NEW — second quantization, 1925, often overlooked)*

**Glossary terms:**
- `quantum-field` — concept
- `second-quantization` — concept
- `zero-point-energy` — concept
- `creation-operator` — concept

**Reading minutes:** 10.

---

### FIG.20 — Renormalization and the Wilson Picture

**Hook.** 1971, Ithaca. Ken Wilson, working alone for years on what was considered a backwater, publishes the paper that transforms renormalization from a computational trick into a physical principle. Theories look different depending on what scale you probe them at. QED's infinities aren't bugs; they're a signal that the theory is *effective* — a good description of low-energy physics with unknown high-energy degrees of freedom integrated out.

**Sections (7):**

1. **The problem** — loop integrals in QED diverge logarithmically; in scalar theories, quadratically. Dressed up as "put a cutoff Λ, extract the finite part, throw away the rest," it smelled like fraud for twenty years.
2. **Bare vs renormalized parameters** — the mass and charge in the Lagrangian are infinite; the measurable mass and charge are finite. The infinity is absorbed in the definition. Works, but why?
3. **The Wilson insight** — think of a theory as a description of physics down to some short-distance scale. Integrate out the modes shorter than that scale. What remains is an effective theory with modified parameters. Renormalization is just the flow of parameters as the cutoff changes.
4. **Running couplings, redux** — we saw in Modules 4 and 5 that α_em and α_s depend on Q². The Wilson picture is *why*: we're looking at the effective coupling at scale Q.
5. **Relevant, marginal, irrelevant** — at long distances, some operators matter (relevant), some don't (irrelevant). Only a handful of theories survive the flow to the infrared. This is why we see only a few types of theories in nature — they're the fixed points.
6. **Effective field theory** — the modern attitude. QED isn't "the" theory of electromagnetism at all energies. It's the effective theory up to a few TeV. Above that, it's embedded in electroweak. Above *that*, who knows. The Standard Model itself is likely an effective theory of something deeper.
7. **Forward** — virtual particles (FIG.21) are the loop contributions that need this regulation.

**Scenes to build (2):**

| File | Purpose |
|---|---|
| `rg-flow-scene.tsx` | 2D space of couplings. Theory trajectories flow toward fixed points. Click a starting point; watch the flow. |
| `cutoff-integration-scene.tsx` | A loop integral being regulated. Slider for cutoff Λ. Integrand visualized; the divergent part shown explicitly, then absorbed into a renormalized parameter. |

**Physicists:**
- Kenneth Wilson *(NEW — Nobel 1982, the Wilsonian revolution)*
- Murray Gell-Mann & Francis Low *(NEW — early running coupling, 1954)*

**Glossary terms:**
- `renormalization-group` — concept
- `cutoff` — concept
- `effective-field-theory` — concept
- `relevant-operator` — concept
- `fixed-point` — concept

**Reading minutes:** 12.

---

### FIG.21 — Virtual Particles and the Vacuum

**Hook.** 1948, Delft. Hendrik Casimir predicts that two uncharged conducting plates in vacuum will attract each other — by about 1.3 × 10⁻⁷ N per m² at a micron separation. The force comes from the structure of the vacuum itself: fewer photon modes fit between the plates than outside. Forty years later, Sparnaay, then Lamoreaux, then van Blokland measure it. Agreement with prediction at the 5% level. The vacuum is not empty.

**Sections (7):**

1. **What a virtual particle is** — an internal line in a Feynman diagram. Not directly observable. Its four-momentum need not satisfy E² = p²c² + m²c⁴; it's "off-shell." The energy-time uncertainty bounds how long it can persist.
2. **Virtual particles are not particles** — they're shorthand for integrals. A better phrase is "fluctuations of the relevant fields." Popular books treat them as tiny fleeting physical things; this is a useful lie but a lie.
3. **Vacuum polarization** — a photon spends part of its life as a virtual e⁺e⁻ pair. This modifies the effective Coulomb law at short distances (we see it in Lamb shift, anomalous magnetic moment, running α).
4. **The Casimir force** — the vacuum energy between plates is a little less than outside, because some wavelengths don't fit. The gradient of this vacuum energy with plate separation is a force.
5. **Zero-point energy and the cosmological constant** — summing vacuum fluctuations naively gives an energy density around 10¹²⁰ times larger than observed. The worst theoretical prediction in the history of physics. Module 7.
6. **Real vs virtual pairs** — a strong enough field can make virtual pairs real (Schwinger effect). Hawking radiation (Module 9) is a gravitational version of this near a horizon.
7. **Forward** — the same vacuum machinery is what gives us the Higgs mechanism (Module 5, recap) and — in cosmology — inflation and dark energy (Module 7).

**Scenes to build (2):**

| File | Purpose |
|---|---|
| `casimir-scene.tsx` | Two parallel plates in vacuum. Standing-wave modes between and outside. Plate separation slider. Force readout in pN. |
| `vacuum-polarization-scene.tsx` | A charge, surrounded by virtual e⁺e⁻ pairs that partially screen it. Distance slider shows the "running charge" the test particle feels. |

**Physicists:**
- Hendrik Casimir *(NEW — the effect, 1948)*
- Steven Lamoreaux *(NEW — first precise Casimir measurement, 1997)*

**Glossary terms:**
- `virtual-particle` — concept (reuse)
- `casimir-effect` — phenomenon
- `vacuum-polarization` — phenomenon
- `schwinger-effect` — phenomenon (cameo)

**Reading minutes:** 11.

---

## Module 7 · Cosmology

Physics at the largest scale. Up to 1915 cosmology was metaphysics plus a telescope. Einstein gave it field equations; Friedmann gave it solutions; Hubble gave it evidence. From Penzias and Wilson's serendipitous cold sky in 1964 to Perlmutter, Schmidt, and Riess measuring the universe's acceleration in 1998, the twentieth century built a cosmological model with six parameters that fits every observation we've been able to make. That model, ΛCDM, tells us the universe is 13.8 billion years old, started in a hot dense state, is 5% ordinary matter, 27% dark matter, 68% dark energy. We do not know what the last two are.

---

### FIG.22 — Hubble, Lemaître, and the Expanding Universe

**Hook.** 1929, Mount Wilson. Edwin Hubble, having spent years measuring Cepheid variables to pin down distances to the "spiral nebulae," plots distance vs redshift. It's a line: the farther away, the faster they're receding. He published a paper that rewrote the universe's age, scale, and future in eight pages. Georges Lemaître had beaten him to the relation by two years, in French, in a Belgian journal nobody read. Neither of them called it the Big Bang; that was Hoyle's sneer, 1949.

**Sections (7):**

1. **Before Hubble** — the Great Debate, 1920. Shapley vs Curtis, at the Smithsonian. Are the "spiral nebulae" inside the Milky Way or outside? Unresolved that day.
2. **Cepheid variables** — Henrietta Leavitt, Harvard, 1912: the period-luminosity relation. A standard candle. This is what Hubble uses to measure distances to Andromeda and further.
3. **Hubble's law** — v = H₀ d. Today H₀ ≈ 70 km/s/Mpc. The first distance-redshift diagram had huge error bars, but the slope was real.
4. **Lemaître's priority** — the "primeval atom" (1927, 1931). He had the expansion from Einstein's field equations before Hubble published the data. The IAU formally renamed Hubble's law the Hubble-Lemaître law in 2018.
5. **Friedmann equations** — Alexander Friedmann, 1922, solves GR for a homogeneous isotropic universe. Three possible fates: open (infinite, forever expanding), flat (critical, asymptotically stops), closed (finite, eventually recollapses). Which one we're in depends on the density.
6. **The expansion is of space itself** — galaxies aren't flying apart through space; the space between them is stretching. Wavelengths redshift along with the metric.
7. **Forward** — if everything was closer together in the past, then it was hotter. Run the clock back: there was a time when the universe was a plasma. That's the CMB, FIG.23.

**Scenes to build (2):**

| File | Purpose |
|---|---|
| `hubble-diagram-scene.tsx` | A reproduction of Hubble's 1929 plot with modern data overlaid. Slider for H₀. |
| `friedmann-fates-scene.tsx` | Scale factor a(t) for open, flat, closed universes. Add a cosmological constant; watch the fates change. |

**Physicists:**
- Edwin Hubble *(NEW — the law, cameo from § 04)*
- Georges Lemaître *(NEW, cameo from § 04 — priest, physicist, Big Bang's true parent)*
- Henrietta Leavitt *(NEW — the Cepheid period-luminosity relation, not given a Nobel because she died before they knew)*
- Alexander Friedmann *(NEW — Russian meteorologist and mathematician, 1922 solutions)*
- Vesto Slipher *(NEW — first measured galaxy redshifts, 1912, before Hubble)*

**Glossary terms:**
- `hubble-law` — law
- `cepheid-variable` — phenomenon
- `cosmological-redshift` — phenomenon
- `friedmann-equations` — equation
- `scale-factor` — concept

**Reading minutes:** 12.

---

### FIG.23 — The Cosmic Microwave Background

**Hook.** Holmdel, New Jersey, 1964. Arno Penzias and Robert Wilson at Bell Labs are trying to use a giant horn antenna to do radio astronomy. There's a background hiss they can't get rid of. They check pigeon droppings on the horn. They scrub. The hiss remains. In a Princeton seminar, Bob Dicke says "boys, we've been scooped" — his own group had been about to search for exactly this signal, predicted twenty years earlier by Gamow, Alpher, and Herman as the relic radiation of the hot Big Bang. Penzias and Wilson, Nobel 1978.

**Sections (7):**

1. **The prediction** — Gamow, Alpher, Herman (1948): if the Big Bang model is right, there must be leftover radiation from the era of recombination (when electrons combined with nuclei into neutral atoms, ~380,000 years after the bang). Redshifted today to microwave wavelengths, about 5 K. Their paper was largely ignored.
2. **The discovery** — Penzias and Wilson, 1964. 3.5 K isotropic background. Not pigeon droppings. The single most compelling piece of evidence for the Big Bang.
3. **Perfect blackbody** — the CMB is the most perfect blackbody spectrum ever measured, with T = 2.7255 K. COBE's FIRAS instrument (1992) confirmed this to parts per 10⁵.
4. **Anisotropies** — COBE, then WMAP, then Planck: tiny temperature fluctuations, ΔT/T ≈ 10⁻⁵. These are the seeds of all large-scale structure in the universe.
5. **The acoustic peaks** — the CMB anisotropy spectrum has a characteristic pattern of peaks. Sound waves in the pre-recombination plasma, frozen in at recombination. Their angular scale gives us the geometry of the universe: flat, to 1% precision.
6. **Baryons, dark matter, dark energy from the CMB** — the full ΛCDM fit. Six parameters, thousands of data points, percent-level agreement.
7. **Forward** — the CMB anisotropies are evidence for a pre-Big-Bang epoch called inflation. FIG.24.

**Scenes to build (2):**

| File | Purpose |
|---|---|
| `cmb-spectrum-scene.tsx` | Blackbody curve. Slider for T. Data points from FIRAS overlaid — error bars smaller than the line width. |
| `cmb-anisotropy-scene.tsx` | The full-sky CMB map (from Planck). Toggle: raw, dipole-subtracted, smoothed. Angular power spectrum below with acoustic peaks marked. |

**Physicists:**
- Arno Penzias & Robert Wilson *(NEW — discovery, Nobel 1978)*
- George Gamow *(reused — predicted the CMB)*
- Ralph Alpher & Robert Herman *(NEW — predicted CMB temperature, 5 K, with Gamow)*
- Robert Dicke *(NEW — the Princeton group, scooped)*
- George Smoot *(NEW — COBE anisotropies, Nobel 2006)*
- John Mather *(NEW — COBE blackbody spectrum, Nobel 2006)*

**Glossary terms:**
- `cmb` — phenomenon
- `recombination` — epoch
- `blackbody-spectrum` — concept
- `acoustic-peak` — phenomenon
- `lcdm` — model

**Reading minutes:** 13.

---

### FIG.24 — Inflation

**Hook.** 1980, Stanford. Alan Guth, a postdoc on his way to losing the appointment, realizes that a brief epoch of exponential expansion in the very early universe would solve three puzzles at once — why the CMB is so uniform, why the universe is flat, why there are no magnetic monopoles. He calls it "inflation." Linde, Albrecht, Steinhardt fix the technical problems over the next two years. It remains the best explanation we have for initial conditions and no direct evidence.

**Sections (7):**

1. **Three puzzles** — horizon (why is the CMB so uniform across regions that could never have been in causal contact?), flatness (why is Ω so close to 1?), monopoles (GUTs predict them; we see none).
2. **The fix** — a very brief period of exponential expansion. The observable universe comes from a tiny pre-inflation patch that was in causal contact. Spatial curvature gets stretched away. Monopoles get diluted.
3. **The inflaton** — a scalar field with a flat potential. While rolling slowly, it acts like a cosmological constant, driving exponential expansion. When it reaches the minimum, it oscillates and decays into ordinary matter (reheating).
4. **Quantum fluctuations → structure** — during inflation, quantum fluctuations of the inflaton get stretched outside the horizon and freeze in as classical density perturbations. These reenter the horizon later and seed all structure. It's the prettiest idea in cosmology.
5. **Observational tests** — inflation predicts nearly scale-invariant perturbations (yes, observed, n_s ≈ 0.965), nearly Gaussian (yes), and a slight tensor component (primordial gravitational waves — not yet detected; BICEP, Simons Observatory, CMB-S4 are hunting).
6. **Eternal inflation** — most inflation models are eternal: somewhere, inflation is always happening. Pocket universes bud off. Maybe. This is where cosmology spills into speculation.
7. **Forward** — the end of inflation is reheating, which produces ordinary matter. But also: slightly more matter than antimatter (Module 8).

**Scenes to build (2):**

| File | Purpose |
|---|---|
| `inflation-scene.tsx` | A(t) on a log plot. Slow start, 60 e-folds during inflation, then normal expansion. Slider for number of e-folds. |
| `slow-roll-scene.tsx` | The inflaton potential. Ball rolling slowly down, then oscillating at the bottom. Different potential shapes give different spectra. |

**Physicists:**
- Alan Guth *(NEW — 1980 paper, Kavli Prize 2014)*
- Andrei Linde *(NEW — slow-roll, eternal inflation, 1982)*
- Andreas Albrecht & Paul Steinhardt *(NEW — the "new inflation" that fixed graceful exit)*

**Glossary terms:**
- `inflation` — epoch
- `inflaton` — particle
- `horizon-problem` — problem
- `flatness-problem` — problem
- `reheating` — process
- `primordial-gravitational-waves` — phenomenon

**Reading minutes:** 12.

---

### FIG.25 — Dark Matter

**Hook.** Kitt Peak, 1970s. Vera Rubin, spectrograph at the Flagstaff 72-inch, measures the rotation speed of stars and gas in spiral galaxies. By Newton, speed should fall with distance as 1/√r in a point-mass potential. It doesn't fall. It stays flat, out past the visible edge. Either Newton is wrong at galactic scales (and § 04 rules this out in most tested regimes), or the galaxy has an invisible halo of mass that dwarfs its visible stars. Fritz Zwicky had called it *Dunkle Materie* in 1933 looking at the Coma cluster. Rubin made it impossible to ignore.

**Sections (7):**

1. **Rotation curves** — the headline. Flat out to 10× the optical radius. ~5× as much mass as stars and gas combined.
2. **Galaxy clusters** — Zwicky, 1933, Coma. Velocity dispersion of galaxies is too high for the visible mass; the cluster should fly apart. Invoke dark matter.
3. **Gravitational lensing** — mass bends light (§ 04). We see strong-lensing arcs and weak-lensing shear that trace mass distributions. They match the rotation-curve inference.
4. **The Bullet Cluster, 2006** — two clusters collided. Hot gas (via X-ray) lags behind, having been slowed by electromagnetic drag. Mass (via lensing) sails through. The mass is not the gas. Hardest possible evidence for collisionless dark matter.
5. **CMB fits** — ΛCDM nails baryon density at 4.9%, dark matter at 26.8%, dark energy at 68.3%. Six parameters fit everything.
6. **Candidates** — WIMPs (weakly interacting massive particles, thermal relics, natural in supersymmetry), axions (motivated by the strong-CP problem), sterile neutrinos, primordial black holes. Direct-detection experiments (XENONnT, LZ) and indirect searches (Fermi, IceCube) keep tightening the net. No detection so far.
7. **Forward** — if dark matter is ~27%, dark energy is 68%. What is that? FIG.26.

**Scenes to build (3):**

| File | Purpose |
|---|---|
| `rotation-curve-scene.tsx` | Galaxy with stars visualized. Slider for dark matter halo mass. Rotation curve plot updates: with halo, flat; without, falling. Real Rubin data overlaid. |
| `lensing-scene.tsx` | Cluster with a source galaxy behind it. Light rays bend around. Mass slider; see arcs and Einstein rings form. |
| `bullet-cluster-scene.tsx` | Two clusters colliding. Gas (red) and dark matter (blue) visualized separately. After collision, dark matter has passed through; gas has piled up. |

**Physicists:**
- Vera Rubin *(NEW — galaxy rotation curves, should have had a Nobel)*
- Fritz Zwicky *(NEW — Coma cluster, dark matter coined 1933, also predicted neutron stars and supernovae-as-standard-candles)*
- Kent Ford *(NEW — built the spectrograph Rubin used)*

**Glossary terms:**
- `dark-matter` — concept
- `rotation-curve` — phenomenon
- `gravitational-lensing` — phenomenon
- `wimp` — candidate
- `axion` — candidate
- `bullet-cluster` — observation

**Reading minutes:** 13.

---

### FIG.26 — Dark Energy and the Accelerating Universe

**Hook.** 1998, two independent teams, one headed by Saul Perlmutter at Berkeley, one by Brian Schmidt and Adam Riess in Australia and Baltimore. Both use Type Ia supernovae as standard candles to measure the expansion history. Both find, against expectation, that the expansion is *speeding up*. The universe is not just growing; it's growing faster. Einstein's cosmological constant, which he had called his greatest blunder, turns out to have been necessary after all. Nobel 2011.

**Sections (7):**

1. **Type Ia supernovae** — white-dwarf detonations; known peak luminosity via the Phillips relation. Visible to billions of light-years. The best standard candle we have.
2. **The 1998 result** — distant SNe Ia are dimmer than they should be in a matter-dominated universe. The expansion is accelerating.
3. **Einstein's constant, re-habilitated** — a positive cosmological constant Λ in GR produces constant vacuum energy that drives accelerated expansion. Originally introduced in 1917 to make a static universe, abandoned after Hubble, resurrected in 1998.
4. **What is dark energy?** — either Λ (a true constant), or a slowly evolving scalar field ("quintessence"), or a modification of gravity. Current data consistent with a constant. Recent DESI results (2024) hint at possible evolution — not conclusive yet, very active area.
5. **The cosmological constant problem** — naively summing vacuum-fluctuation energies gives ~10¹²⁰ times the observed Λ. The largest mismatch between theory and observation in physics. Something big is being cancelled, to 120 decimal places. Why?
6. **The fate of the universe** — if Λ is truly constant, exponential expansion forever. In 10¹⁴ years, all galaxies outside our local group will have redshifted out of view. Heat death. Not a cheerful ending.
7. **Forward** — dark matter and dark energy together: ~95% of the universe, two parameters, two mysteries. Module 8 on what's beyond the Standard Model.

**Scenes to build (2):**

| File | Purpose |
|---|---|
| `supernova-hubble-diagram-scene.tsx` | SN Ia magnitude vs redshift. Two overlaid model curves: Ω_Λ = 0 and Ω_Λ = 0.68. Perlmutter/Riess data points. |
| `expansion-history-scene.tsx` | Scale factor a(t) from t = 0 to far future. Sliders for Ω_m and Ω_Λ; watch the crossover from deceleration to acceleration ~5 Gyr ago. |

**Physicists:**
- Saul Perlmutter *(NEW — Supernova Cosmology Project, Nobel 2011)*
- Brian Schmidt *(NEW — High-Z Supernova Search Team, Nobel 2011)*
- Adam Riess *(NEW — lead author of the discovery paper, Nobel 2011)*
- Mark Phillips *(NEW — the SN Ia luminosity-decline relation)*

**Glossary terms:**
- `dark-energy` — concept
- `cosmological-constant` — concept
- `type-ia-supernova` — standard candle
- `quintessence` — theory
- `heat-death` — fate

**Reading minutes:** 12.

---

## Module 8 · Beyond the Standard Model

The Standard Model is spectacularly successful and obviously incomplete. Neutrinos have mass; it said they don't. The universe is mostly not ordinary matter; it doesn't explain that. There's more matter than antimatter; it doesn't explain that either. And the Higgs mass sits at 125 GeV when all estimates say it should want to be at 10¹⁹. The theoretical community has spent forty years proposing extensions — supersymmetry, technicolor, extra dimensions, string theory. The LHC has found none of them. This module covers the landscape honestly.

---

### FIG.27 — Neutrino Masses and Oscillations

**Hook.** Kamiokande, Japan, 1998. Super-K announces that atmospheric muon neutrinos from the other side of the Earth arrive in different proportions than the ones coming down from above. They're oscillating into tau neutrinos along the way. That requires them to have mass — which the Standard Model had said they didn't. Takaaki Kajita and Arthur McDonald, Nobel 2015. A small crack in the Standard Model, but the first one.

**Sections (7):**

1. **Three flavors, three masses** — electron, muon, tau neutrinos are *flavor eigenstates*. Mass eigenstates (ν₁, ν₂, ν₃) are superpositions of flavor, and vice versa. The mismatch is encoded in the PMNS matrix (analog of CKM for quarks).
2. **Oscillation** — a muon neutrino produced in a cosmic-ray shower is a mixture of mass eigenstates. Each propagates with a different phase. Some distance later, the mixture has rotated and it now looks partly like a tau neutrino.
3. **The solar neutrino problem** — Ray Davis, Homestake mine, 1968–1994: the Sun produces about one-third the expected electron neutrino flux. SNO (Sudbury, Canada) measured both flavor-sensitive and flavor-blind channels and confirmed the missing two-thirds had oscillated into μ and τ. Resolved by 2001.
4. **Mass hierarchy** — we know Δm² ≈ 7.5×10⁻⁵ eV² and |Δm²| ≈ 2.5×10⁻³ eV². We don't yet know the sign of the second (normal vs inverted hierarchy). DUNE and JUNO, this decade.
5. **Absolute mass scale** — oscillations give only *differences*. Cosmology (structure formation) bounds Σmν < 0.12 eV. KATRIN (tritium beta decay) bounds m_β < 0.45 eV. Neutrinos are < 10⁻⁶ of the electron mass.
6. **Dirac or Majorana?** — is the neutrino its own antiparticle (Majorana) or not (Dirac)? Neutrinoless double beta decay would answer yes; none seen yet. KamLAND-Zen, GERDA, LEGEND.
7. **Forward** — neutrino masses are the simplest extension of the Standard Model. Supersymmetry (FIG.28) is a much bigger extension.

**Scenes to build (2):**

| File | Purpose |
|---|---|
| `neutrino-oscillation-scene.tsx` | A muon neutrino propagating. Probability of detecting as νμ, ντ, νe oscillates with distance. Sliders for L, E, Δm². |
| `sno-detector-scene.tsx` | SNO's heavy-water detector. Charged-current vs neutral-current events explained; the ratio fixes the total flux vs electron-neutrino flux. |

**Physicists:**
- Takaaki Kajita *(NEW — Super-K, Nobel 2015)*
- Arthur McDonald *(NEW — SNO, Nobel 2015)*
- Bruno Pontecorvo *(NEW — first proposed neutrino oscillations, 1957)*
- Ray Davis *(NEW — Homestake, Nobel 2002)*
- Ettore Majorana *(NEW — disappeared 1938, the particles bearing his name)*

**Glossary terms:**
- `neutrino-oscillation` — phenomenon
- `pmns-matrix` — concept
- `solar-neutrino-problem` — problem
- `majorana-mass` — concept
- `neutrinoless-double-beta-decay` — phenomenon

**Reading minutes:** 12.

---

### FIG.28 — Supersymmetry, Extra Dimensions, and Strings

**Hook.** 1984, the "first string revolution." Michael Green and John Schwarz realize that a specific kind of string theory has no anomalies — it might be a consistent theory of everything, unifying gravity with the other forces. Edward Witten leads the theoretical expansion through the 90s and 00s. Forty years of effort, extraordinary mathematics, vast scholarship, and zero confirmed experimental predictions. The most ambitious idea in modern theoretical physics is also, currently, its most suspect.

**Sections (7):**

1. **Supersymmetry (SUSY)** — a symmetry between bosons and fermions. Every SM particle gets a superpartner: selectron, squark, gluino, photino. Motivations: stabilizes the Higgs mass, gives a dark matter candidate (neutralino), enables gauge coupling unification at the GUT scale.
2. **The hierarchy problem** — in the Standard Model, quantum corrections drive the Higgs mass toward the cutoff (Planck scale, ~10¹⁹ GeV). It's observed at 125 GeV. Why? SUSY cancels these corrections, if the superpartners are near the electroweak scale.
3. **The LHC has not found SUSY** — runs 1, 2, 3: null results. Squarks, if they exist, are above ~2 TeV; gluinos above ~2.2 TeV. Natural SUSY, as motivated by the hierarchy problem, is in serious trouble.
4. **Extra dimensions** — Kaluza, 1919; Klein, 1926: add a compact fifth dimension and the 5D Einstein equations contain both gravity and electromagnetism. Randall-Sundrum (1999) and large extra dimensions (ADD, 1998) revived the idea as solutions to the hierarchy problem. LHC looked for KK modes; nothing.
5. **String theory** — replace point particles with 1D strings whose vibrational modes are the particles. Requires 10 or 11 spacetime dimensions; the extra 6 or 7 are curled up ("compactified"). Consistent quantum gravity, at least perturbatively. Vast, beautiful mathematics; no experimental signature.
6. **The landscape problem** — string compactifications have enormous numbers of consistent choices (10⁵⁰⁰ or more). Different choices give different low-energy physics. Predictive power, in any naive sense, is gone. Some argue for the multiverse interpretation; others (Smolin, Woit, Hossenfelder) have written book-length critiques.
7. **Where this leaves us** — the community is genuinely divided. String theorists hold a large share of theoretical physics departments. Phenomenologists increasingly look elsewhere: neutrino masses, axions, modified gravity, direct experiment. This is an honest unresolved situation.

**Scenes to build (2):**

| File | Purpose |
|---|---|
| `susy-spectrum-scene.tsx` | Standard Model table next to a superpartner table. LHC exclusion bars overlaid — "everything below this is ruled out at 95% CL." |
| `compactification-scene.tsx` | A line looks 1D from far away; zoom in and it's a surface with a circle in one direction (2D). Cartoon of how extra dimensions hide. |

**Physicists:**
- Michael Green & John Schwarz *(NEW — first string revolution, 1984)*
- Edward Witten *(NEW — string theory architect, Fields Medal 1990)*
- Theodor Kaluza & Oskar Klein *(NEW — extra-dimensional precursors)*
- Lisa Randall *(NEW — warped extra dimensions, 1999)*

**Glossary terms:**
- `supersymmetry` — theory
- `hierarchy-problem` — problem
- `string-theory` — theory
- `compactification` — concept
- `landscape` — concept
- `extra-dimensions` — concept

**Reading minutes:** 13.

---

### FIG.29 — Matter-Antimatter Asymmetry and Axions

**Hook.** Andrei Sakharov, Moscow, 1967. Between lobbying for nuclear disarmament and being surveilled by the KGB, he identifies the three conditions any theory must satisfy to produce more matter than antimatter from an initially symmetric universe. We observe the result: one baryon per billion photons. We don't know which mechanism caused it.

**Sections (7):**

1. **The problem** — Big Bang, symmetric start. Today: matter everywhere, antimatter nowhere. Ratio of baryons to photons ~6×10⁻¹⁰. Where did the antimatter go?
2. **Sakharov's three conditions** — (1) baryon number violation, (2) C and CP violation, (3) departure from thermal equilibrium. All three needed. The Standard Model satisfies all three *weakly* — not enough to produce the observed asymmetry.
3. **Electroweak baryogenesis** — at the electroweak phase transition, could the SM produce the asymmetry? Calculations say no; not enough CP violation and the transition isn't first-order enough. Needs BSM physics.
4. **Leptogenesis** — if neutrinos are Majorana and very heavy (seesaw), their CP-violating decays in the early universe could generate a lepton asymmetry, which sphalerons then convert into a baryon asymmetry. Currently the leading idea. Untestable in the near term.
5. **The strong CP problem** — QCD allows a CP-violating θ term; experiments bound it to |θ| < 10⁻¹⁰. Why is it so small? Peccei and Quinn (1977) proposed a new symmetry; its breaking gives a new particle, the axion (Weinberg, Wilczek, independently).
6. **Axions as dark matter** — if axions exist with mass ~10⁻⁶ to 10⁻³ eV, they can naturally be dark matter. ADMX, HAYSTAC, DMRadio, IAXO. Parameter space being squeezed.
7. **Forward** — these are the cleaner BSM questions. The dirtier ones — quantum gravity, the measurement problem, fine-tuning, the multiverse — are Module 9.

**Scenes to build (2):**

| File | Purpose |
|---|---|
| `sakharov-scene.tsx` | A 2D phase space with regions labeled "baryon-violating," "CP-violating," "out of equilibrium." Intersection (all three) shaded: the only place asymmetry can be produced. |
| `axion-search-scene.tsx` | Axion mass vs coupling parameter space. Experimental exclusion contours (ADMX etc.) overlaid. The "QCD axion band" highlighted. |

**Physicists:**
- Andrei Sakharov *(reused — the three conditions, 1967)*
- Roberto Peccei & Helen Quinn *(NEW — the symmetry, 1977)*
- Frank Wilczek & Steven Weinberg *(reused — independently named the axion)*

**Glossary terms:**
- `baryon-asymmetry` — problem
- `sakharov-conditions` — concept
- `leptogenesis` — mechanism
- `strong-cp-problem` — problem
- `axion` — particle (reuse)

**Reading minutes:** 12.

---

## Module 9 · Open Problems

End where honesty requires. Physics is enormously successful in the domains it has been tested, and genuinely stuck at the edges. The modules below are not physics — they are the current status of four famously unsolved problems. We present what is known, what is speculative, and where the speculation stops being science.

---

### FIG.30 — Quantum Gravity

**Hook.** General relativity (§ 04) is a classical field theory. Quantum mechanics (§ 05) is a quantum framework. At ordinary energies they don't overlap, so the conflict doesn't matter. But at the center of a black hole, or the first 10⁻⁴³ seconds of the universe, both are needed at once. A century on, we still don't know how to combine them.

**Sections (7):**

1. **The problem** — try to quantize gravity perturbatively, like QED. You find that the coupling (Newton's constant) has negative mass dimension, so infinities appear at every loop order and there are infinitely many of them. Non-renormalizable. Effective field theory works below the Planck scale; above it, the theory breaks down.
2. **Hawking radiation** — black holes emit a thermal spectrum. Temperature T = ℏc³/(8πGMk_B). Bekenstein-Hawking entropy S = (k_B c³ A)/(4Gℏ). The area. Not the volume. First hint that gravity is fundamentally about information, not geometry.
3. **The information paradox** — if a black hole evaporates, where do the quantum correlations of the matter that fell in go? Unitarity (quantum mechanics' requirement that information be preserved) vs no-hair (classical GR's claim that black holes are featureless). Forty years of debate; recent "replica wormhole" work suggests unitarity wins, but the details are still contentious.
4. **String theory's proposal** — gravity as the graviton, a closed string mode. One of the main motivations for strings. Works perturbatively; non-perturbative string theory is still partially understood (M-theory, AdS/CFT).
5. **Loop quantum gravity** — quantize spacetime itself as a spin network. Predicts discrete area and volume. Some success in black-hole entropy; less contact with low-energy phenomenology than strings.
6. **Asymptotic safety, causal sets, causal dynamical triangulation** — other approaches, each with a constituency. None yet has a smoking-gun experimental prediction.
7. **Where experiment stands** — Planck energy is 10¹⁹ GeV. LHC is at 10⁴ GeV. Fifteen orders of magnitude gap. Cosmology (primordial gravitational waves, CMB B-modes) offers indirect probes; direct ones are out of reach. Quantum gravity may stay theoretical for a century.

**Scenes to build (2):**

| File | Purpose |
|---|---|
| `hawking-radiation-scene.tsx` | Black hole with pair production at the horizon; one member escapes, one falls in. Mass decreases over time; temperature rises as mass drops. |
| `planck-scale-scene.tsx` | Log-energy axis from neV to Planck. Different physics domains marked. The gap between LHC and Planck highlighted. |

**Physicists:**
- Stephen Hawking *(NEW — Hawking radiation, 1974)*
- Jacob Bekenstein *(NEW — black hole entropy, 1973)*
- Abhay Ashtekar *(NEW — loop quantum gravity variables)*
- Carlo Rovelli *(NEW — LQG, also wrote accessible books)*

**Glossary terms:**
- `quantum-gravity` — problem
- `hawking-radiation` — phenomenon
- `information-paradox` — problem
- `planck-scale` — concept
- `loop-quantum-gravity` — theory

**Reading minutes:** 13.

---

### FIG.31 — The Measurement Problem, Revisited

**Hook.** Copenhagen, 1927. Bohr says: there's a classical world and a quantum world, and the boundary is where we choose to put the apparatus. Einstein objects for thirty years. Bell, 1964, proves experimentally which theories are possible. Aspect, 1982, does the experiment. Zeilinger, Clauser, Aspect, Nobel 2022. But the *interpretation* of quantum mechanics — what the wavefunction *is* — remains contested. § 05 introduced this; here we return with everything we've learned since.

**Sections (7):**

1. **The problem restated** — Schrödinger's equation is deterministic and unitary. Measurement outcomes are probabilistic and non-unitary. How do these reconcile?
2. **Copenhagen** — the operational view. The wavefunction is a tool for predicting measurement probabilities; don't ask what it "is." Works in practice; unsatisfying.
3. **Many-worlds (Everett, 1957)** — every measurement outcome actually happens, in a separate branch of the universal wavefunction. No collapse. Parsimonious ontology (one wavefunction) at the cost of enormous branching.
4. **Pilot wave (Bohm, 1952)** — particles have definite positions always; a "quantum potential" guides them nonlocally. Recovers all QM predictions. Nonlocal, Lorentz-invariance tricky, but logically clean.
5. **Objective collapse (GRW, CSL)** — modify the Schrödinger equation to include stochastic collapse at some rate per particle. Makes experimental predictions (just barely); being tested.
6. **Decoherence** — tracing out environmental degrees of freedom makes superpositions effectively classical very fast. Explains why we don't *see* superpositions; doesn't by itself explain why we see *one* outcome.
7. **The Bell experiments and the 2022 Nobel** — Aspect (1982), Zeilinger (2017, closing all loopholes): local hidden variables are ruled out. Any interpretation must be nonlocal or nonrealistic (in the technical sense). The experimental facts are settled; the interpretation is not.

**Scenes to build (2):**

| File | Purpose |
|---|---|
| `bell-inequality-scene.tsx` | Two entangled spin-½ particles. Detector angle sliders. Correlation graph: classical bound (cos-linear), quantum bound (cos), and data. |
| `many-worlds-scene.tsx` | A tree diagram. Each branch is a measurement outcome. Probability amplitudes flow; no single branch is preferred. |

**Physicists:**
- John Bell *(NEW — the inequality, 1964)*
- Alain Aspect *(NEW — Nobel 2022)*
- John Clauser *(NEW — Nobel 2022)*
- Anton Zeilinger *(NEW — Nobel 2022, loophole-free Bell tests)*
- Hugh Everett III *(NEW — many-worlds, 1957, left physics for defense consulting)*
- David Bohm *(NEW — pilot wave, 1952, also McCarthy-era persecution)*

**Glossary terms:**
- `measurement-problem` — problem
- `many-worlds` — interpretation
- `pilot-wave` — interpretation
- `bell-inequality` — theorem
- `decoherence` — phenomenon

**Reading minutes:** 13.

---

### FIG.32 — Fine-Tuning, the Multiverse, and the Limits of Physics

**Hook.** Close this branch, and the site, with the hardest question. Why is the cosmological constant so small? Why is the Higgs mass not at the Planck scale? Why is the universe hospitable to chemistry and life? Four possible answers: because that's just what the constants are (accept), because some deeper theory fixes them (hope), because the multiverse makes all values somewhere and we're in a nice region (anthropic), or because we're asking the wrong question. Physicists, sober ones, disagree.

**Sections (7):**

1. **The cosmological constant problem** — observed Λ ≈ 10⁻¹²² in natural units. QFT predicts ~1. Mismatch of 120 orders of magnitude. Worst prediction in science. (Callback to Module 7.)
2. **The hierarchy problem** — Higgs mass 125 GeV, Planck 10¹⁹ GeV. Seventeen orders of magnitude. (Callback to Module 8.)
3. **Anthropic reasoning** — if these constants were much different, no galaxies, stars, atoms, chemistry, us. Observed values sit in narrow windows. This is either a coincidence, a selection effect, or evidence for a multiverse where all values are realized.
4. **String landscape and eternal inflation** — together, these provide a mechanism for generating ~10⁵⁰⁰ pocket universes with different laws. Anthropic selection within this ensemble could explain the small observed Λ. Controversial: is this science if we can't falsify it?
5. **The falsifiability debate** — Popper said a theory must be falsifiable. The multiverse, in its strongest form, isn't. Some (Dawid, Carroll) argue for "non-empirical theory confirmation" (coherence, explanatory power). Others (Smolin, Hossenfelder) argue this gives up what made physics physics.
6. **What if physics has a last chapter?** — historical precedent is poor. Every "end of physics" prediction (Michelson 1894, Hawking 1980) has been wrong. But the instruments have also gotten cartoonishly expensive and slow. The next major collider, if built, won't run until 2040. At some point, physics' ability to extend may saturate.
7. **A closing stance** — we don't know. The Standard Model is extraordinary and incomplete. Cosmology is mostly dark. Gravity is not quantum. The wavefunction is not understood. This is not a failure; it's where the frontier currently sits. Read § 01–§ 05 again, and then come back to this one. The open questions are what physics is *for*.

**Scenes to build (1):**

| File | Purpose |
|---|---|
| `fine-tuning-scene.tsx` | Multiple sliders: Λ, m_Higgs, α, m_electron/m_proton. Real-time readouts of what universe you'd get at that setting — "no nuclei," "no stars," "no galaxies," or "something like ours." The "life-permitting" region is a tiny dot. |

**Physicists:**
- Freeman Dyson *(NEW — wrote widely on fine-tuning, "the universe seems to have known we were coming")*
- Steven Weinberg *(reused — anthropic prediction of Λ, 1987, before it was observed)*
- Brandon Carter *(NEW — anthropic principle, 1973)*
- Sabine Hossenfelder *(NEW — contemporary critic of fine-tuning reasoning)*

**Glossary terms:**
- `fine-tuning` — concept
- `anthropic-principle` — concept
- `multiverse` — concept
- `falsifiability` — concept
- `cosmological-constant-problem` — problem

**Reading minutes:** 14.

---

## Execution order

Modules are built in dependency order. Within each module the topics can, in principle, be written in any order, but there's a natural reader flow and we respect it.

**Phase 1 — Atoms and nuclei (closest to lab, least abstract).** This is the shortest path from quantum mechanics (§ 05) into modern physics. Reader gets wins fast.

1. FIG.01 (Fine/hyperfine) — direct quantum mechanics follow-on.
2. FIG.02 (Lamb shift) — motivates QFT without doing QFT.
3. FIG.03 (Zeeman, clocks) — experimental power of atomic physics.
4. FIG.04 (Laser cooling, BEC) — modern atomic; bridge to condensed matter.
5. FIG.05 (Nucleus structure, binding).
6. FIG.06 (Radioactivity).
7. FIG.07 (Fission, fusion).
8. FIG.08 (Nucleosynthesis) — bridge to cosmology.

**Phase 2 — Particles and interactions (the Standard Model).** This is the spine of the branch. Build the table, then the rules.

9. FIG.09 (Discovery history) — historical arc.
10. FIG.10 (SM table) — the object.
11. FIG.11 (Quarks, color, confinement).
12. FIG.12 (Leptons).
13. FIG.13 (QED).
14. FIG.14 (Weak force).
15. FIG.15 (QCD).

**Phase 3 — Structure and theory.** Abstract but necessary; the payoff for Phase 2.

16. FIG.16 (Noether).
17. FIG.17 (Gauge theories).
18. FIG.18 (Higgs mechanism).
19. FIG.19 (Why fields) — gentle QFT.
20. FIG.20 (Renormalization).
21. FIG.21 (Virtual particles, vacuum).

**Phase 4 — Cosmology.** Reader now has all ingredients; cosmology is "the Standard Model at scale."

22. FIG.22 (Hubble-Lemaître).
23. FIG.23 (CMB).
24. FIG.24 (Inflation).
25. FIG.25 (Dark matter).
26. FIG.26 (Dark energy).

**Phase 5 — Frontier.** Finish where we don't know the answer.

27. FIG.27 (Neutrinos).
28. FIG.28 (SUSY/strings — skeptical tone).
29. FIG.29 (Baryon asymmetry, axions).
30. FIG.30 (Quantum gravity).
31. FIG.31 (Measurement problem revisited).
32. FIG.32 (Fine-tuning, multiverse, limits) — the closing topic of the entire site.

A realistic pace is 1–2 topics per week with scenes. At that rate the branch is 4–6 months of work.

## Patterns to reuse

Every topic follows the same punch-list format: hook with specific names/dates/places, seven sections, two or three scenes, physicists (linked to `lib/content/physicists.ts`), glossary terms (linked to `lib/content/glossary.ts`), reading minutes. Same as §§ 01–05.

**Scene skeleton.** Copy from `damped-pendulum-scene.tsx` or an existing § 05 quantum scene. All use `useAnimationFrame`, `useThemeColors`, canvas + ResizeObserver, cyan (`#5BE9FF`) accent. For energy-level diagrams, reuse or adapt `hydrogen-spectrum-scene.tsx` (built for FIG.01).

**Physics functions.** Pure modules in `lib/physics/modern/*.ts`. One module per topic (`lib/physics/modern/fine-structure.ts`, `lib/physics/modern/nuclear.ts`, `lib/physics/modern/cosmology.ts`, etc.). Keep scene components presentational; push physics into the pure module.

**Historical photos.** Each topic wants one period photograph to anchor the hook (Wu's experimental setup, Rubin at Kitt Peak, the ATLAS detector, etc.). Same treatment as Galileo's chandelier in § 01. Store under `pictures/modern/`, lazy-load.

**Physicist adds.** Manually edit `lib/content/physicists.ts` + `messages/en/physicists.json` — same documented gap as before. This branch introduces ~50 new physicists; batch the adds by module to keep the PR review tractable.

**Glossary adds.** Direct edits to `lib/content/glossary.ts` + `messages/<locale>/glossary.json`. Cross-link within the glossary: for instance, `strong-cp-problem` references `axion`, `cp-violation`.

**Topic status flip.** Direct edit to `lib/content/branches.ts` on the `modern-physics` branch's `topics` array — change `status` to `"live"` and set `readingMinutes`.

**Hebrew + Russian content.** Keep English as the source-of-truth and translate at the end of each module. Don't translate one topic at a time; it causes chrome drift across `messages/he/home.json` and `messages/ru/home.json`.

**Honesty markers.** This branch, more than any other, needs explicit "this is speculative" markers. Use the same `<AdmonitionNote>` component already live for Galileo-era caveats. Trigger it on: string theory details, multiverse claims, quantum gravity interpretations, inflation's eternal extension, anthropic reasoning.

**Scene density.** Cap at 3 scenes per topic. Phase 3 (Modules 5–6) risks ballooning — resist. Prefer a clear single-concept scene over three half-finished ones.

## Definition of done per topic

- [ ] `content.en.mdx` replaces skeleton, full 7-section essay with the specified hook and section structure.
- [ ] All new scenes exist, are registered in `components/physics/visualization-registry.tsx`, render without runtime error.
- [ ] New physicists live in `lib/content/physicists.ts` and `messages/en/physicists.json` with cross-links to relevant topic slugs.
- [ ] New glossary terms live in `lib/content/glossary.ts` and `messages/en/glossary.json` with cross-references.
- [ ] `status: "live"`, `readingMinutes: N` in `branches.ts` for this topic.
- [ ] English `home.json` chrome updated if the topic name or reading time surfaces in navigation.
- [ ] Honest voice: no filler, no "great question," no emoji, no meta-intros; speculative material is explicitly marked.
- [ ] Historical photo sourced and placed (public domain, CERN Creative Commons, NASA, or Wikimedia); caption includes date, location, source.
- [ ] `npx tsc --noEmit` passes.
- [ ] Manual smoke test in `bun dev` at `/en/modern-physics/<slug>` — scenes respond, readings hit the target minutes.
- [ ] Optional but preferred: Hebrew + Russian content checked in, `page.tsx` wires `HeContent`/`RuContent`, home.json chrome in each locale updated.

The branch is shipped when all 32 topics are green on this checklist, the branch `branches.ts` entry flips to `status: "live"`, and the top-nav badge drops the `coming-soon` tag on modern-physics.
