# § 05 · Quantum Mechanics — curriculum roadmap

At small enough scales, the world stops behaving like a world. Particles are waves, measurements disturb reality, and probabilities replace certainties. The branch walks from Planck's reluctant quantum of 1900 through Schrödinger's equation, the hydrogen atom, spin, entanglement, and the measurement problem. Ten modules, thirty-six topics. FIG numbers restart per branch: FIG.01 is the black-body catastrophe; FIG.36 is decoherence and the measurement problem.

## Module map

| # | Module | Topics | FIG range |
|---|---|---|---|
| 1 | The Birth of Quantum | 4 | FIG.01 → FIG.04 |
| 2 | Wave-Particle Duality | 3 | FIG.05 → FIG.07 |
| 3 | The Schrödinger Equation | 4 | FIG.08 → FIG.11 |
| 4 | Canonical Problems | 5 | FIG.12 → FIG.16 |
| 5 | Operators & Observables | 3 | FIG.17 → FIG.19 |
| 6 | The Hydrogen Atom | 3 | FIG.20 → FIG.22 |
| 7 | Spin & Angular Momentum | 4 | FIG.23 → FIG.26 |
| 8 | Multi-particle Quantum Systems | 3 | FIG.27 → FIG.29 |
| 9 | Entanglement & Bell | 4 | FIG.30 → FIG.33 |
| 10 | Interpretations & Decoherence | 3 | FIG.34 → FIG.36 |

Total: 36 topics. Reading minutes per topic target: 9–13. Total reading load: ~380 minutes.

---

## Module 1 · The Birth of Quantum

The old physics breaks in four places between 1900 and 1923. Each crack is a real experiment that classical theory cannot explain without absurd machinery. Planck patches the first crack with an "act of desperation" — energy in discrete lumps. Einstein weaponises the lump. Compton proves photons carry momentum. Bohr quantises the atom. By 1913 the quantum is not a trick; it is a fact.

---

### FIG.01 — The Black-body Catastrophe

**Hook.** Berlin, autumn 1900. Max Planck, forty-two, a conservative theorist who thought entropy was the deepest thing in physics, is trying to match a curve — the spectrum of a glowing oven. Every classical derivation predicts that the oven should radiate infinite energy in the ultraviolet. Ovens do not. On 14 December 1900 he presents a formula that works, on one condition: energy comes in packets of size hν. He calls it "an act of desperation."

**Sections (7):**

1. **What a black body is** — an idealised cavity that absorbs all radiation and re-emits it in thermal equilibrium. Kirchhoff proved in 1860 that its spectrum depends only on temperature. A piece of iron glowing in a forge is a decent approximation.
2. **The classical prediction** — Rayleigh and Jeans count the standing-wave modes in a cubical cavity, give each one ½kT by equipartition, and integrate. The answer diverges at short wavelengths. The "ultraviolet catastrophe" — Ehrenfest's later name for it — is a logical disaster, not a small error.
3. **The Wien law and the empirical curve** — the measured spectrum peaks and falls. Wien's 1896 formula fits the short-wavelength tail but fails in the infrared. The experimentalists Lummer and Pringsheim in Berlin had clean data by 1899. Planck needed a formula that fit both ends.
4. **Planck's trick** — quantise the oscillator energies: E = nhν, n = 0, 1, 2, … Compute the average using the Boltzmann distribution. The hν/(exp(hν/kT) − 1) factor kills the ultraviolet divergence.
5. **The constant h** — Planck fitted h = 6.55 × 10⁻³⁴ J·s from the data. Today: 6.62607015 × 10⁻³⁴ J·s, exact by SI definition since 2019. The smallest action in the universe.
6. **Planck didn't believe it** — for a decade he called the quantum a "formal trick." He tried to derive the formula from continuous energy and failed. Einstein in 1905 was the first to take the quantum literally.
7. **What's next** — if light comes in packets, what happens when the packets hit metal? The photoelectric effect. FIG.02.

**Scenes to build (3):**

| File | Purpose |
|---|---|
| `blackbody-spectrum-scene.tsx` | Temperature slider (300 K → 10 000 K). Live plot of three curves: Rayleigh-Jeans (diverging at short λ), Wien (failing in IR), Planck (matches). Peak shifts left as T rises (Wien displacement marker). |
| `cavity-modes-scene.tsx` | 2-D cavity with animated standing waves. Mode count slider; as λ shrinks, modes proliferate. Visual reason equipartition fails. |
| `oven-glow-scene.tsx` | Schematic iron block; colour shifts red → orange → yellow → white as temperature slider rises. Side panel reads out peak wavelength in nm. |

**Physicists (aside):**
- Max Planck *(NEW — the reluctant founder; thermodynamicist; Nobel 1918; later lost his son Erwin to the Nazis in 1945)*
- Gustav Kirchhoff *(NEW — proved in 1860 that the black-body spectrum is universal; also Kirchhoff's circuit laws)*
- Wilhelm Wien *(NEW — displacement law 1893, empirical high-frequency formula 1896; Nobel 1911)*

**Glossary terms:**
- `black-body` — concept
- `planck-constant` — concept
- `quantum-of-action` — concept
- `ultraviolet-catastrophe` — concept
- `wien-displacement-law` — concept
- `equipartition` — concept

**Reading minutes:** 11.

---

### FIG.02 — The Photoelectric Effect

**Hook.** Bern patent office, 1905. Einstein writes four papers in one year; the Nobel Prize comes for the one on light. Not relativity — the photoelectric effect. Light of frequency below a threshold will not eject electrons from a metal, no matter how bright. Classical wave theory cannot explain this. Einstein's answer: light is made of energy packets, E = hν, and one packet ejects one electron.

**Sections (7):**

1. **Hertz's accident** — in 1887 Heinrich Hertz notices ultraviolet light makes sparks jump more easily. He is studying Maxwell's waves and misses the deeper fact. The effect bears no one's name for twenty years.
2. **Lenard's measurements** — Philipp Lenard, 1902, systematic: the kinetic energy of ejected electrons depends on frequency, not intensity. Intensity only changes the number. Classical theory predicts the opposite.
3. **The threshold** — below a frequency ν₀ (specific to each metal), no electrons come out even from blinding light. The metal's "work function" φ.
4. **Einstein's equation** — (½)mv² = hν − φ. One photon, one electron. The slope of kinetic energy vs frequency is h, universal across metals.
5. **Millikan, 1916** — Robert Millikan spent ten years trying to disprove Einstein. His own careful experiment confirmed the equation and measured h to 0.5%. He never fully believed the photon picture.
6. **What a photon is** — a quantum of the electromagnetic field. Zero rest mass; energy E = hν; momentum p = E/c. The word "photon" is coined by Gilbert Lewis in 1926; Einstein used "Lichtquant."
7. **What's next** — if photons carry momentum, they should scatter off electrons like billiard balls. Compton, 1923. FIG.03.

**Scenes to build (3):**

| File | Purpose |
|---|---|
| `photoelectric-scene.tsx` | Metal surface with light source. Frequency slider, intensity slider. Below threshold — no ejection regardless of intensity. Above threshold — electron speed depends on ν, count depends on intensity. |
| `ke-vs-frequency-scene.tsx` | Live plot of stopping voltage vs frequency for three metals (Na, Zn, Cu). Three parallel lines; slope = h/e; x-intercept = work function. |
| `photon-stream-scene.tsx` | Monochromatic beam visualised as discrete photons. Number/second ∝ intensity; energy/photon ∝ frequency. Red vs violet comparison. |

**Physicists (aside):**
- Albert Einstein *(exists — upgrade: the photon paper, not relativity, won the Nobel in 1921)*
- Heinrich Hertz *(NEW — confirmed Maxwell's waves in 1887; died young at 36)*
- Philipp Lenard *(NEW — systematic photoelectric measurements; Nobel 1905; later an ardent Nazi)*
- Robert Millikan *(NEW — oil-drop experiment for electron charge; measured h; Nobel 1923)*

**Glossary terms:**
- `photoelectric-effect` — concept
- `photon` — concept
- `work-function` — concept
- `stopping-voltage` — concept
- `threshold-frequency` — concept

**Reading minutes:** 10.

---

### FIG.03 — Compton Scattering

**Hook.** St. Louis, 1923. Arthur Compton fires X-rays at graphite and measures the scattered wavelength. It has shifted, by an amount that depends on the scattering angle. No wave theory of light predicts a wavelength shift. Compton computes the shift assuming photon-electron collisions conserve energy and momentum. It matches to the digit. Photons are real.

**Sections (7):**

1. **Why X-rays?** — visible light has too little momentum to budge an electron noticeably. X-rays at λ ~ 0.1 Å carry enough per photon to make the kinematic shift measurable.
2. **The kinematics** — treat the photon as a particle with E = hν and p = h/λ. Relativistic collision with an electron at rest. Conservation of 4-momentum gives Δλ = (h/m_e c)(1 − cos θ).
3. **The Compton wavelength** — λ_C = h/(m_e c) = 2.43 × 10⁻¹² m. A natural length scale for the electron. Reappears everywhere in relativistic QM.
4. **The measurement** — Compton's rotating ionisation chamber. The scattered peak at each angle sits where the photon formula predicts, with a smaller unshifted peak from tightly-bound (effectively-infinite-mass) electrons.
5. **Debye, independently** — Peter Debye derives the same formula almost simultaneously. Compton gets the Nobel in 1927; Debye had his for other work.
6. **Why this settles it** — the photoelectric effect could be rescued by semi-classical tricks; Compton scattering cannot. Momentum conservation in a two-body collision is unambiguous.
7. **What's next** — if light waves carry particle-like momentum, maybe particles carry wave-like frequencies. De Broglie, 1924. FIG.05.

**Scenes to build (2):**

| File | Purpose |
|---|---|
| `compton-scattering-scene.tsx` | Incoming photon (variable λ) hits stationary electron. Scattering angle slider. Vector-momentum diagram updates live; scattered wavelength readout matches formula. |
| `compton-angle-plot-scene.tsx` | Δλ vs (1 − cos θ). Straight line through origin, slope = λ_C. Data points from Compton's 1923 measurements overlaid. |

**Physicists (aside):**
- Arthur Compton *(NEW — confirmed photon momentum; Manhattan Project administrator; Nobel 1927)*
- Peter Debye *(NEW — derived the scattering formula in parallel; Nobel in chemistry 1936 for dipole moments)*

**Glossary terms:**
- `compton-scattering` — concept
- `compton-wavelength` — concept
- `photon-momentum` — concept

**Reading minutes:** 9.

---

### FIG.04 — The Bohr Atom

**Hook.** Copenhagen, 1913. Niels Bohr, twenty-seven, has just spent a year with Rutherford in Manchester. Rutherford's nuclear atom — electrons orbiting a tiny dense nucleus — is classically impossible: accelerating electrons radiate, and any orbit should collapse in 10⁻¹¹ seconds. Bohr writes a trilogy of papers that ignore the impossibility and postulate stable "stationary states." The hydrogen spectrum falls out to six decimal places.

**Sections (7):**

1. **Rutherford's bombshell, 1911** — gold-foil alpha scattering. Most alphas pass through; a few bounce straight back. "As if you fired a 15-inch shell at tissue paper and it came back." The atom is almost all empty space around a tiny nucleus.
2. **Why the nuclear atom can't work classically** — Maxwell's equations force an orbiting electron to radiate, lose energy, and spiral in. The atom should last picoseconds. It doesn't.
3. **Bohr's postulates** — (a) electrons occupy discrete stationary orbits where they don't radiate; (b) transitions between orbits emit or absorb a photon of energy hν = E_i − E_f; (c) angular momentum is quantised, L = nℏ.
4. **Deriving the Rydberg formula** — balance Coulomb force and centripetal force; impose L = nℏ; compute energies E_n = −13.6 eV / n². Transitions give 1/λ = R(1/n_f² − 1/n_i²). Rydberg and Balmer had extracted the formula empirically decades earlier.
5. **Spectral series** — Lyman (UV, n_f = 1), Balmer (visible, n_f = 2, the four lines Ångström measured in 1853), Paschen (IR, n_f = 3). Every hydrogen lamp on earth shows them.
6. **The correspondence principle** — Bohr's heuristic: for large n, quantum predictions must merge into classical ones. A philosophical tool that guided him for thirty years.
7. **What breaks** — Bohr's model works for hydrogen and fails for helium. The angular-momentum quantisation is ad hoc. The real foundation — the wavefunction — is still twelve years away. FIG.05 starts the rebuild.

**Scenes to build (3):**

| File | Purpose |
|---|---|
| `bohr-orbits-scene.tsx` | Hydrogen atom with quantised orbits (n = 1 … 6). Click an orbit to "excite" the electron; on decay, a photon is emitted with the correct colour for the transition. |
| `hydrogen-spectrum-scene.tsx` | The Balmer series rendered as a spectral strip: Hα 656 nm (red), Hβ 486 nm (cyan), Hγ 434 nm (violet), Hδ 410 nm (deep violet). |
| `rutherford-scattering-scene.tsx` | Alpha particles fired at a thin foil; most pass through; rare large-angle deflections. Impact-parameter slider. |

**Physicists (aside):**
- Niels Bohr *(NEW — founder of the Copenhagen school; Nobel 1922; smuggled out of Denmark in a fishing boat in 1943)*
- Ernest Rutherford *(NEW — nuclear atom; Nobel 1908 in chemistry, to his irritation)*
- Johannes Rydberg *(NEW — empirical formula for hydrogen lines, 1888)*
- Johann Balmer *(NEW — Swiss schoolteacher; fit the visible hydrogen lines in 1885 at age sixty)*

**Glossary terms:**
- `bohr-model` — concept
- `stationary-state` — concept
- `rydberg-formula` — concept
- `balmer-series` — concept
- `correspondence-principle` — concept
- `quantum-number` — concept

**Reading minutes:** 12.

---

## Module 2 · Wave-Particle Duality

If photons are particles, maybe electrons are waves. De Broglie's 1924 thesis is one paragraph long and wins the Nobel four years later. Davisson and Germer confirm it by accident. The double slit, performed with electrons in 1961 and with single electrons in 1989, is the archetypal quantum experiment. Feynman called it "the only mystery."

---

### FIG.05 — De Broglie Matter Waves

**Hook.** Paris, 1924. Louis de Broglie, prince of an aristocratic French family, submits a doctoral thesis proposing that every particle has a wavelength λ = h/p. His examiners suspect it is nonsense. Einstein reads it and writes to Langevin: "He has lifted a corner of the great veil." The thesis passes. In 1929 de Broglie has the Nobel.

**Sections (7):**

1. **The analogy** — photons have E = hν and p = h/λ. Why not particles? Energy ↔ frequency, momentum ↔ wavelength. Symmetry as guide.
2. **Electron wavelengths** — a 100 eV electron has λ ≈ 1.2 Å, on the order of an atom. A 1 g bullet has λ ≈ 10⁻³¹ m, smaller than anything measurable. This is why tables are solid.
3. **The phase velocity mystery** — de Broglie's waves seem to travel faster than light; the group velocity, not the phase velocity, matches particle motion. Resolved only with the full Schrödinger machinery.
4. **Standing-wave interpretation of Bohr orbits** — quantisation L = nℏ becomes: an integer number of de Broglie wavelengths must fit around the orbit. The first visual of "why" quantisation.
5. **The prediction** — if electrons are waves, they should diffract. De Broglie's thesis explicitly predicts it. No experimental group was looking.
6. **Why Einstein championed it** — the paper de Broglie wrote tied to Einstein's gas theory via the Bose-Einstein statistics Einstein was developing with Bose in 1924. For Einstein, duality was the deep truth.
7. **What's next** — the experimental confirmation comes from a broken vacuum tube in New Jersey. FIG.06.

**Scenes to build (2):**

| File | Purpose |
|---|---|
| `de-broglie-wavelength-scene.tsx` | Particle-type selector (electron, proton, fullerene, baseball). Momentum slider. λ readout in metres; side panel shows "compared to": atom, virus, bacterium, city. |
| `standing-wave-orbit-scene.tsx` | Circular electron orbit with a sinusoid wrapped around it. Integer-n slider gives closed standing waves; non-integer values show destructive interference and fade. |

**Physicists (aside):**
- Louis de Broglie *(NEW — French prince, doctoral thesis of 1924, Nobel 1929; later championed the pilot-wave interpretation)*
- Paul Langevin *(NEW — de Broglie's adviser; diamagnetism; affair with Marie Curie made Paris newspapers in 1911)*

**Glossary terms:**
- `de-broglie-wavelength` — concept
- `matter-wave` — concept
- `phase-velocity` — concept
- `group-velocity` — concept

**Reading minutes:** 9.

---

### FIG.06 — Davisson-Germer and Electron Diffraction

**Hook.** Bell Labs, New Jersey, April 1925. A liquid-air bottle explodes next to Clinton Davisson's vacuum tube. His nickel target oxidises. He bakes it to recover, and on reassembly the target has crystallised into a few large domains. When he resumes measurements the scattered-electron pattern shows sharp peaks where before it was smooth. The peaks sit exactly where de Broglie's formula predicts for Bragg diffraction off a crystal lattice. Davisson had no idea de Broglie existed until he visited Oxford.

**Sections (7):**

1. **What Davisson was doing** — studying secondary-electron scattering from metals for Bell's telephone amplifiers. Pure industrial research.
2. **The accident** — the oxidation-and-anneal recrystallised the nickel. The target became a diffraction grating.
3. **Oxford, 1926** — Davisson reads de Broglie's work, recognises his own data as a diffraction pattern, returns to New Jersey with Lester Germer, and deliberately tests it. The 54 eV peak at 50° sits at the predicted Bragg angle.
4. **The formula** — 2d sin θ = nλ for constructive diffraction off crystal planes of spacing d. With d = 0.91 Å (nickel) and λ = h/p for the accelerated electrons, everything agrees.
5. **Thomson's independent proof** — G.P. Thomson, son of J.J. Thomson (who discovered the electron as a particle), passes electrons through thin foils and sees ring patterns like X-ray powder diffraction. Father proved the electron is a particle; son proved it is a wave. Both got Nobels.
6. **Electron microscopy** — if electrons have wavelengths orders of magnitude shorter than visible light, they can resolve orders-of-magnitude-smaller objects. Ruska builds the first electron microscope by 1933.
7. **What's next** — two slits, one electron at a time. FIG.07.

**Scenes to build (2):**

| File | Purpose |
|---|---|
| `davisson-germer-scene.tsx` | Electron gun aimed at a nickel crystal. Accelerating-voltage slider; detector arc plots intensity vs angle. Peaks slide as voltage changes, tracking λ = h/p. |
| `bragg-diffraction-scene.tsx` | Crystal planes with incoming wave. Plane-spacing slider; angle slider. Highlights constructive and destructive interference; shows the nλ = 2d sin θ condition visually. |

**Physicists (aside):**
- Clinton Davisson *(NEW — Bell Labs, Nobel 1937 shared with G.P. Thomson)*
- Lester Germer *(NEW — Davisson's colleague; later retired to become a competitive rock climber into his seventies)*
- George Paget Thomson *(NEW — son of J.J.; electron diffraction through foils; Nobel 1937)*
- William Henry Bragg & William Lawrence Bragg *(NEW — father and son; crystal diffraction; joint Nobel 1915; Lawrence was 25, the youngest science laureate ever)*

**Glossary terms:**
- `electron-diffraction` — concept
- `bragg-condition` — concept
- `crystal-lattice` — concept

**Reading minutes:** 10.

---

### FIG.07 — The Double Slit

**Hook.** "In reality, it contains the only mystery. We cannot make the mystery go away by 'explaining' how it works. We will just tell you how it works." — Feynman, Caltech lectures, 1963. Send electrons one at a time through two slits and they build up an interference pattern on the screen. Cover one slit — no pattern. Watch which slit each electron took — no pattern. The electron interferes with itself, unless you look.

**Sections (7):**

1. **The classical wave version** — Young, 1801. Double-slit with candlelight, then with sunlight. Fringes. The result that killed Newton's corpuscular theory for a century.
2. **With electrons** — Jönsson, Tübingen, 1961. Biprism equivalent of a double slit. Clear interference. First unambiguous demonstration.
3. **One electron at a time** — Tonomura et al., Hitachi, 1989. Individual electrons land as point dots on the screen. After thousands, an interference pattern builds up. Each electron interferes with itself.
4. **Which-way destroys it** — place a detector at one slit. Pattern vanishes, replaced by two plain bumps. Measurement extracts which-way information and the interference goes with it.
5. **Heavier particles** — Zeilinger's group, Vienna, 1999: diffracts C₆₀ fullerenes. 2019: molecules of 2000 amu. The boundary between quantum and classical is not a particle-mass line; it is a decoherence line. Preview of Module 10.
6. **Feynman's path-integral reading** — every path contributes an amplitude. The two-slit amplitudes add; their squared sum is the probability. The two slits are just the two most obvious paths; in principle every possible trajectory contributes.
7. **What's next** — to predict the fringe positions quantitatively we need the wavefunction. Module 3.

**Scenes to build (3):**

| File | Purpose |
|---|---|
| `double-slit-build-up-scene.tsx` | Click "fire" to send one electron at a time; dots accumulate. After ~50 → noise; after ~500 → fringes appear; after ~5000 → textbook pattern. |
| `double-slit-which-way-scene.tsx` | Toggle "detector at slit A." On: pattern collapses to two bumps. Off: interference returns. Immediate and visceral. |
| `two-slit-amplitude-scene.tsx` | Shows the two complex amplitudes as rotating phasors. Their sum's length squared at each screen point = intensity. |

**Physicists (aside):**
- Richard Feynman *(NEW — path integrals, QED, bongo drums, Challenger inquiry; Nobel 1965)*
- Thomas Young *(NEW — original double-slit experiment 1801; also decoded hieroglyphics)*
- Claus Jönsson *(NEW — first electron double-slit, 1961)*
- Akira Tonomura *(NEW — Hitachi; single-electron build-up films are still the standard visualisation)*

**Glossary terms:**
- `double-slit-experiment` — concept
- `interference-pattern` — concept
- `which-way-information` — concept
- `wave-particle-duality` — concept

**Reading minutes:** 11.

---

## Module 3 · The Schrödinger Equation

Heisenberg writes matrix mechanics in 1925 on the island of Helgoland, recovering from hay fever. Schrödinger writes wave mechanics six months later in a ski lodge at Arosa with a mistress he never named. The two formulations are equivalent — Dirac proves it — but Schrödinger's wavefunction is the form every physics student learns. Born interprets |ψ|² as a probability density, and Einstein hates it forever.

---

### FIG.08 — The Wavefunction

**Hook.** Arosa, Christmas 1925. Erwin Schrödinger, thirty-eight, is on a two-week alpine holiday with a lover. He brings a pearl for each ear (to block noise) and de Broglie's thesis. He comes back with an equation. The object at its centre — ψ(x, t), a complex-valued function of space and time — becomes the fundamental quantity of quantum physics.

**Sections (7):**

1. **What ψ is** — a complex-valued function. Not a field on space in the classical sense; the bookkeeping device that encodes everything knowable about a system.
2. **Born's rule** — |ψ(x, t)|² gives the probability density for finding the particle at x at time t. Max Born adds this interpretation in a 1926 footnote. Einstein never accepts it.
3. **Normalisation** — ∫|ψ|² dx = 1. Total probability is one. The wavefunction must be square-integrable.
4. **Superposition** — if ψ₁ and ψ₂ are valid states, so is αψ₁ + βψ₂. Linearity is the most important structural fact of quantum mechanics.
5. **Phase and interference** — global phase e^(iθ)ψ is physically identical to ψ. Relative phase between parts of a superposition matters: it is what makes interference fringes.
6. **The probability current** — j(x, t) keeps probability conservation local: ∂|ψ|²/∂t + ∂j/∂x = 0. The continuity equation of quantum mechanics.
7. **What's next** — the equation that governs ψ's evolution. FIG.09.

**Scenes to build (2):**

| File | Purpose |
|---|---|
| `wavefunction-visualiser-scene.tsx` | A complex wavefunction shown as two curves (Re, Im) or as a colour-coded phase-magnitude plot. Three preset states: Gaussian, plane wave, superposition of two Gaussians. |
| `born-rule-scene.tsx` | Same wavefunction displayed as |ψ|². "Fire detector" button samples a position from the distribution. After many fires, histogram converges to |ψ|². |

**Physicists (aside):**
- Erwin Schrödinger *(NEW — wave mechanics; Nobel 1933; the cat thought experiment; a deeply unconventional personal life documented in Walter Moore's biography)*
- Max Born *(NEW — probability interpretation; Nobel 1954, delayed twenty-eight years because the committee could not decide whom to credit)*

**Glossary terms:**
- `wavefunction` — concept
- `probability-amplitude` — concept
- `born-rule` — concept
- `normalisation` — concept
- `probability-current` — concept

**Reading minutes:** 10.

---

### FIG.09 — The Schrödinger Equation

**Hook.** Schrödinger presents his equation to Zurich's weekly colloquium in January 1926. Debye, chairing, says: "You have to have a wave equation." Schrödinger writes the non-relativistic one. Four papers in six months rewrite atomic physics. The hydrogen spectrum falls out without postulates — just the equation and the Coulomb potential.

**Sections (7):**

1. **Time-dependent form** — iℏ ∂ψ/∂t = Ĥψ. A first-order equation in time; Ĥ is the Hamiltonian operator. Linear, deterministic evolution of ψ. Randomness enters only at measurement.
2. **The Hamiltonian operator** — for a non-relativistic particle, Ĥ = −(ℏ²/2m)∇² + V(x). Kinetic plus potential, with momentum replaced by −iℏ∇.
3. **Separating variables** — write ψ(x, t) = φ(x)T(t). Substitute. Get T(t) = e^(−iEt/ℏ) and the time-independent Schrödinger equation Ĥφ = Eφ.
4. **Stationary states** — solutions of Ĥφ = Eφ are energy eigenstates. Their |ψ|² is time-independent; only the phase rotates. These are what Bohr called "stationary orbits," now with a foundation.
5. **General solutions are superpositions** — ψ(x, t) = Σ c_n φ_n(x) e^(−iE_n t/ℏ). Any initial condition expanded in the energy basis; each component rotates at its own frequency.
6. **Boundary conditions** — ψ continuous; ψ' continuous where V is finite; ψ → 0 at infinity for bound states. These conditions do all the quantising.
7. **What's next** — apply the equation to boxes, wells, and oscillators. Module 4.

**Scenes to build (2):**

| File | Purpose |
|---|---|
| `schrodinger-evolution-scene.tsx` | Initial Gaussian wave packet; live integration of the TDSE in free space. Packet spreads. Group velocity = ⟨p⟩/m tracked. |
| `eigenstate-superposition-scene.tsx` | Two-state superposition c₁|1⟩ + c₂|2⟩ in an infinite well. |ψ|² oscillates at the Bohr frequency (E₂ − E₁)/ℏ. Sliders for c₁, c₂. |

**Physicists (aside):**
- Erwin Schrödinger *(exists)*
- Werner Heisenberg *(NEW — matrix mechanics on Helgoland 1925; Uncertainty Principle 1927; Nobel 1932; wartime German nuclear programme)*
- Paul Dirac *(NEW — unified wave and matrix mechanics in 1926; the Dirac equation 1928; silent, austere, the quintessential theorist)*

**Glossary terms:**
- `schrodinger-equation` — concept
- `hamiltonian` — concept
- `eigenstate` — concept
- `stationary-state` — concept
- `separation-of-variables` — concept

**Reading minutes:** 12.

---

### FIG.10 — Bra-Ket and Hilbert Space

**Hook.** Dirac's *The Principles of Quantum Mechanics* appears in 1930. Its notation — |ψ⟩ and ⟨φ| — becomes the universal language of the field. Dirac was ten years old when Einstein explained the photoelectric effect; by thirty he had a textbook that physicists still read. He rarely spoke; when he did, he said exactly what he meant.

**Sections (7):**

1. **States as vectors** — |ψ⟩ is a vector in a Hilbert space. The wavefunction ψ(x) is its components in the position basis: ψ(x) = ⟨x|ψ⟩.
2. **Inner product** — ⟨φ|ψ⟩ = ∫ φ*(x)ψ(x) dx. A complex number. Orthogonality: ⟨φ_n|φ_m⟩ = δ_nm.
3. **Bras and kets** — |ψ⟩ is a column vector; ⟨ψ| is the conjugate-transpose row vector. ⟨ψ|ψ⟩ = 1 for a normalised state.
4. **Bases** — {|n⟩} orthonormal and complete means any state |ψ⟩ = Σ c_n |n⟩ with c_n = ⟨n|ψ⟩. The energy basis and position basis are the two most common.
5. **Change of basis** — the same |ψ⟩ has different components in different bases. Position-space ψ(x) and momentum-space ψ̃(p) are Fourier transforms of each other.
6. **Operators as matrices** — in a given basis, Ô acts on |ψ⟩ by matrix-vector multiplication. Diagonal in the eigenbasis of Ô.
7. **What's next** — operators, observables, eigenvalues. Module 5.

**Scenes to build (2):**

| File | Purpose |
|---|---|
| `basis-change-scene.tsx` | Same state rendered in position space (Gaussian in x) and momentum space (Gaussian in p). Width slider demonstrates reciprocal spreading — preview of uncertainty. |
| `inner-product-scene.tsx` | Two wavefunctions on the canvas; ⟨φ|ψ⟩ computed live as they are dragged. Orthogonal → zero; identical → one. |

**Physicists (aside):**
- Paul Dirac *(exists)*
- David Hilbert *(NEW — infinite-dimensional vector spaces; Göttingen; the 23 problems; "Physics is too difficult for physicists")*
- John von Neumann *(NEW — rigorised quantum mechanics in 1932; also game theory, computing, and the hydrogen bomb)*

**Glossary terms:**
- `hilbert-space` — concept
- `bra-ket-notation` — concept
- `inner-product` — concept
- `orthonormal-basis` — concept
- `completeness-relation` — concept

**Reading minutes:** 11.

---

### FIG.11 — Measurement and Collapse

**Hook.** Copenhagen, 1927. Bohr and Heisenberg are arguing on long walks around the Tivoli gardens. They arrive at a rule: until you measure, the system is a superposition; at measurement, it "collapses" onto an eigenstate of the measured observable, with probability |c_n|². The rule works. It is also philosophically radioactive. Einstein, Schrödinger, de Broglie, and Bohm never accept it.

**Sections (7):**

1. **The two dynamics** — (a) between measurements, ψ evolves unitarily under the Schrödinger equation; (b) at measurement, ψ jumps to an eigenstate of the measured operator. Two different rules for one theory. This is the seam.
2. **The Born probabilities** — prob(outcome n) = |⟨n|ψ⟩|². The only probabilistic rule in fundamental physics. Postulated, not derived (Module 10 revisits).
3. **Expectation values** — ⟨Ô⟩ = ⟨ψ|Ô|ψ⟩. The average over many identically-prepared measurements. Not in general an eigenvalue.
4. **Repeated measurements** — immediately measuring again gives the same result. The state is now in an eigenstate; subsequent Schrödinger evolution moves it off until the next measurement.
5. **What is a measurement?** — the founders never defined it crisply. Any interaction that correlates a microscopic degree of freedom with a macroscopic pointer. Decoherence (Module 10) gives a modern account.
6. **The Copenhagen stance** — "do not ask what the electron is between measurements." Bohr: there is no deeper reality to describe. Einstein: "I cannot believe God plays dice."
7. **What's next** — the canonical problems, where collapse and unitary evolution are both worked out. Module 4.

**Scenes to build (2):**

| File | Purpose |
|---|---|
| `collapse-scene.tsx` | Wavefunction spread across an infinite well. "Measure position" button; wavefunction collapses to a narrow peak at a random x, sampled from |ψ|². Collapsed state then spreads by TDSE. |
| `expectation-value-scene.tsx` | Preset |ψ⟩ = cos θ |0⟩ + sin θ |1⟩ in a two-state system. "Measure" 1000 times; histogram converges to |cos θ|², |sin θ|². ⟨Ô⟩ readout matches theory. |

**Physicists (aside):**
- Niels Bohr *(exists)*
- Werner Heisenberg *(exists)*
- Albert Einstein *(exists — here as sceptic: the 1927 and 1930 Solvay debates with Bohr)*
- Max Born *(exists)*

**Glossary terms:**
- `measurement-postulate` — concept
- `wavefunction-collapse` — concept
- `expectation-value` — concept
- `copenhagen-interpretation` — concept

**Reading minutes:** 11.

---

## Module 4 · Canonical Problems

Every quantum textbook works the same four problems in order: infinite well, finite well, harmonic oscillator, barrier tunnelling. They are universally applicable because any bound state near its minimum looks like an oscillator, any metastable state can tunnel, and any confined particle is some variant of a well. These are the hydrogen-atom warm-ups.

---

### FIG.12 — The Infinite Square Well

**Hook.** The simplest bound system in physics. A particle trapped between two infinite walls; nothing but boundary conditions to do the work. Solve it in an afternoon. Get quantised energies, standing-wave eigenstates, and a clean demonstration that confinement forces energy to come in discrete amounts.

**Sections (7):**

1. **Setup** — V(x) = 0 for 0 ≤ x ≤ L; V(x) = ∞ elsewhere. Particle cannot exist where V = ∞, so ψ(0) = ψ(L) = 0.
2. **Solutions** — inside the well, Ĥψ = Eψ reduces to ψ'' = −k²ψ with k² = 2mE/ℏ². Solutions sin(kx). Boundary condition forces k_n = nπ/L.
3. **Quantised energies** — E_n = n²π²ℏ²/(2mL²). Lowest level is not zero — the zero-point energy E₁ = π²ℏ²/(2mL²). The particle can never be at rest.
4. **Eigenstates** — ψ_n(x) = √(2/L) sin(nπx/L). Normalised. n − 1 nodes inside the well.
5. **Orthogonality and completeness** — ∫ψ_n ψ_m dx = δ_nm. Any square-integrable function on [0, L] expands as a Fourier sine series in the {ψ_n}. The Fourier series is literally an eigenbasis expansion.
6. **Time evolution** — ψ(x, 0) = Σ c_n ψ_n(x). At time t, ψ(x, t) = Σ c_n ψ_n(x) e^(−iE_n t/ℏ). Relative phases produce oscillating |ψ|² ("breathing" superpositions).
7. **What's next** — let the walls be finite. FIG.13.

**Scenes to build (2):**

| File | Purpose |
|---|---|
| `infinite-well-eigenstates-scene.tsx` | Slider picks n = 1 … 6. Wavefunction and |ψ|² drawn on a well. Energy-level diagram side panel highlights the current level. |
| `well-breathing-scene.tsx` | Superposition c₁|1⟩ + c₂|2⟩ evolving in time. |ψ|² oscillates side-to-side at (E₂ − E₁)/ℏ. Sliders for c₁, c₂. |

**Physicists (aside):**
- Erwin Schrödinger *(exists)*
- Arnold Sommerfeld *(NEW — Munich; Schrödinger's doctoral grandfather; quantised elliptical orbits; mentor to Heisenberg, Pauli, Bethe, Debye)*

**Glossary terms:**
- `infinite-square-well` — concept
- `zero-point-energy` — concept
- `energy-quantisation` — concept
- `node` — concept

**Reading minutes:** 9.

---

### FIG.13 — The Finite Square Well and Tunnelling

**Hook.** Let the walls be finite. Two new phenomena appear that have no classical analogue: the wavefunction penetrates into the classically forbidden region, and a particle incident on a finite barrier has a nonzero probability of coming out the other side. This is how alpha decay works. Gamow, 1928.

**Sections (7):**

1. **Finite well setup** — V = 0 inside, V = V₀ outside. Bound states exist for E < V₀.
2. **Inside and outside** — inside: sinusoids (E > V). Outside: decaying exponentials e^(−κx), κ = √(2m(V₀ − E))/ℏ.
3. **Matching conditions** — ψ and ψ' continuous at the boundaries. Produces a transcendental equation; solutions quantise E. A finite well has only a finite number of bound states.
4. **Penetration depth** — the evanescent tail decays over ~1/κ. The particle has nonzero probability in the classically forbidden region. Forbidden means "classically impossible," not "quantum-impossible."
5. **Transmission through a barrier** — shoot a wave at a rectangular barrier (V₀ > E). Solve on three regions. Transmission coefficient T ≈ e^(−2κL) for thick barriers. Exponential sensitivity to width and height.
6. **Tunnelling is everywhere** — α-decay (Gamow 1928, explained uranium half-lives spanning 10²⁰ orders of magnitude with one equation); scanning tunnelling microscope (Binnig and Rohrer 1981, Nobel 1986); stellar nucleosynthesis; nuclear fusion in the Sun's core.
7. **What's next** — the most important one-dimensional potential in physics: the harmonic oscillator. FIG.14.

**Scenes to build (3):**

| File | Purpose |
|---|---|
| `finite-well-scene.tsx` | V₀ slider (depth), L slider (width). Ground state and first excited state drawn; evanescent tails visible. Count of bound states readout. |
| `barrier-tunnelling-scene.tsx` | Gaussian wave packet incident on a barrier. Live TDSE integration. Reflected and transmitted packets. Height and width sliders; T readout. |
| `alpha-decay-scene.tsx` | Nucleus modelled as a spherical well with a Coulomb barrier outside. α-particle wavefunction leaks out slowly. Parameters tuned to uranium-238 → 4.5 Gyr half-life. |

**Physicists (aside):**
- George Gamow *(NEW — Ukrainian; α-decay tunnelling 1928; the hot big-bang; later popular-science books still in print)*
- Gerd Binnig & Heinrich Rohrer *(NEW — STM; Zurich IBM; Nobel 1986)*

**Glossary terms:**
- `finite-square-well` — concept
- `quantum-tunnelling` — concept
- `transmission-coefficient` — concept
- `evanescent-wave` — concept
- `alpha-decay` — concept

**Reading minutes:** 12.

---

### FIG.14 — The Harmonic Oscillator

**Hook.** Any system near a stable equilibrium looks harmonic: Taylor-expand V around the minimum, the quadratic term dominates. So every bound system — a vibrating molecule, a photon in a laser cavity, a phonon in a crystal, a quark-antiquark pair — is, at lowest order, a harmonic oscillator. The quantum version is the single most useful problem in all of physics.

**Sections (7):**

1. **The potential** — V(x) = ½mω²x². Classical period T = 2π/ω independent of amplitude — Galileo's chandelier at Pisa would be an exact oscillator if the arc were small.
2. **Energy levels** — E_n = ℏω(n + ½), n = 0, 1, 2, … Evenly spaced. Ground state E₀ = ½ℏω — half a quantum of zero-point energy, real and measurable.
3. **Eigenstates** — Gaussian times a Hermite polynomial: ψ_n(x) = (1/√(2ⁿn!)) · (mω/πℏ)^(¼) · Hₙ(√(mω/ℏ) x) · e^(−mωx²/(2ℏ)). Each one has n nodes.
4. **The ground state** — a pure Gaussian. Minimum-uncertainty state: Δx Δp = ℏ/2. This is the tightest a state can ever be.
5. **Why equal spacing matters** — any absorbed or emitted photon has energy ℏω, a single spectral line. Molecules' infrared vibrational spectra are near-harmonic.
6. **Classical limit** — high-n eigenstates concentrate probability near the classical turning points where the particle moves slowly — Bohr's correspondence principle made visible.
7. **What's next** — the elegant algebraic way to solve this problem. FIG.15.

**Scenes to build (3):**

| File | Purpose |
|---|---|
| `harmonic-oscillator-eigenstates-scene.tsx` | n slider 0 … 10. Wavefunction on a parabolic potential; energy level highlighted; nodes counted. |
| `coherent-state-scene.tsx` | A Gaussian wave packet launched in the oscillator; oscillates classically without spreading. A "coherent state" — preview of laser light. |
| `ho-correspondence-scene.tsx` | For large n, |ψ_n|² envelope matches the classical-probability 1/√(A² − x²). Side-by-side comparison. |

**Physicists (aside):**
- Charles Hermite *(NEW — French mathematician; Hermite polynomials and proof that e is transcendental)*
- Paul Ehrenfest *(NEW — Austro-Dutch; named the UV catastrophe; Ehrenfest's theorem that ⟨x⟩, ⟨p⟩ obey classical equations)*

**Glossary terms:**
- `harmonic-oscillator` — concept
- `hermite-polynomial` — concept
- `coherent-state` — concept
- `ehrenfest-theorem` — concept

**Reading minutes:** 11.

---

### FIG.15 — Ladder Operators

**Hook.** There are two ways to solve the quantum oscillator. One involves Hermite polynomials, differential equations, and considerable algebra. The other is Dirac's: define two operators, â and â†, note that [â, â†] = 1, and everything follows in three lines. The method generalises to angular momentum, to the quantised EM field, and to every field theory.

**Sections (7):**

1. **Definitions** — â = (1/√2)(x̂/x₀ + ip̂x₀/ℏ), â† = (1/√2)(x̂/x₀ − ip̂x₀/ℏ), with x₀ = √(ℏ/mω). Non-Hermitian; â† is the Hermitian conjugate of â.
2. **The commutator** — [â, â†] = 1. The fundamental bracket. All the physics comes from this line plus Ĥ = ℏω(â†â + ½).
3. **Raising and lowering** — â†|n⟩ = √(n+1)|n+1⟩, â|n⟩ = √n|n−1⟩. â† builds up the ladder; â walks it down.
4. **The number operator** — N̂ = â†â has eigenvalues n = 0, 1, 2, … Its ground state |0⟩ is killed by â: â|0⟩ = 0.
5. **Building all states from the vacuum** — |n⟩ = (â†)ⁿ/√(n!) |0⟩. The whole Hilbert space is the orbit of |0⟩ under â†.
6. **Why physicists love this** — no special functions; generalises verbatim to the quantised electromagnetic field (creation and annihilation of photons), to phonons in a crystal, to fields in the Standard Model. A universal pattern.
7. **What's next** — at the barrier, the last canonical problem of Module 4. FIG.16.

**Scenes to build (2):**

| File | Purpose |
|---|---|
| `ladder-operators-scene.tsx` | Visual stack of |n⟩ levels. Click â† — step up with a photon emission animation. Click â — step down. Commutator demonstration. |
| `photon-number-state-scene.tsx` | Quantised EM cavity mode; click the mode to add or remove photons. Energy readout E = ℏω(n + ½). Same algebra as oscillator. |

**Physicists (aside):**
- Paul Dirac *(exists)*
- Pascual Jordan *(NEW — co-author of the matrix-mechanics papers with Born and Heisenberg; second-quantised the electromagnetic field; later Nazi affiliations damaged his reputation)*

**Glossary terms:**
- `ladder-operator` — concept
- `creation-annihilation` — concept
- `number-operator` — concept
- `fock-state` — concept
- `commutator` — concept

**Reading minutes:** 10.

---

### FIG.16 — Scattering and the WKB Approximation

**Hook.** Most real problems have potentials you can't solve exactly. The WKB approximation — Wentzel, Kramers, Brillouin, 1926, independently — gives you a tunnelling probability as a single integral. It is how Gamow got α-decay half-lives in 1928 and how you estimate tunnelling rates for anything from STMs to stellar fusion.

**Sections (7):**

1. **The scattering problem** — particle incident on a potential; what comes out? Transmission, reflection, phase shift. A well-posed asymptotic question.
2. **The semiclassical regime** — when ψ oscillates many times across features of V, write ψ ∝ e^(iS(x)/ℏ) with S ≈ ∫p(x)dx. Valid when (dλ/dx) ≪ 1.
3. **The forbidden region** — in V > E, p(x) becomes imaginary; ψ ∝ e^(−∫|p|dx/ℏ). Exponentially suppressed but not zero.
4. **Tunnelling formula** — T ≈ exp(−2∫|p(x)|dx/ℏ), integrated between classical turning points. One integral for any barrier shape.
5. **Gamow's α-decay calculation** — Coulomb barrier outside the nucleus. One integral gives half-lives from 10⁻⁷ s to 10¹⁷ years. Matches every α-emitter ever measured. Nobel-worthy economy.
6. **Resonances** — a metastable state in a barrier leaks out with a lifetime τ = ℏ/Γ, where Γ is the resonance width. Tunnelling rate and decay rate are the same thing.
7. **What's next** — step back from specific problems to the general structure. Observables and operators. Module 5.

**Scenes to build (2):**

| File | Purpose |
|---|---|
| `wkb-tunnelling-scene.tsx` | Arbitrary barrier shape (drag-to-edit). Classical turning points highlighted; ∫|p|dx integrated visually; T read out. |
| `alpha-decay-half-life-scene.tsx` | Periodic table of α-emitters; select isotope. Plot half-life vs Q-value (Geiger-Nuttall rule). Exponential line predicted by WKB — data fall on it across 25 decades. |

**Physicists (aside):**
- Gregor Wentzel *(NEW — Zurich; the W in WKB)*
- Hendrik Kramers *(NEW — Bohr's student; the K in WKB; also Kramers-Kronig dispersion relations)*
- Léon Brillouin *(NEW — French; the B in WKB; also Brillouin zones in solid-state physics)*
- Hans Geiger & John Mitchell Nuttall *(NEW — empirical α-decay half-life rule 1911; Geiger also invented the counter)*

**Glossary terms:**
- `wkb-approximation` — concept
- `classical-turning-point` — concept
- `resonance` — concept
- `scattering` — concept

**Reading minutes:** 10.

---

## Module 5 · Operators & Observables

Every physical measurement is represented by a Hermitian operator. Eigenvalues are possible outcomes; eigenvectors are the states with definite values. Two operators commute if and only if they share a complete eigenbasis — that is, if and only if the corresponding observables can both have definite values at the same time. The uncertainty principle is a one-line consequence.

---

### FIG.17 — Hermitian Operators and Observables

**Hook.** "The physical quantities correspond to linear Hermitian operators on Hilbert space." Dirac, 1930. A strange rule at first: why Hermitian? Because Hermitian operators have real eigenvalues, and measurement outcomes had better be real. The rule also guarantees eigenstates are orthogonal and form a complete basis. Everything else is bookkeeping.

**Sections (7):**

1. **What Hermitian means** — Ô† = Ô. In a basis, H_ij = H_ji*. Real diagonal elements, complex-conjugate off-diagonal pairs.
2. **Real eigenvalues** — Ô|n⟩ = λ_n|n⟩ with λ_n ∈ ℝ. Easy proof: take matrix elements with ⟨n|.
3. **Orthogonal eigenstates** — distinct eigenvalues ⇒ orthogonal eigenvectors. ⟨n|m⟩ = δ_nm (with degenerate eigenstates orthogonalisable).
4. **Completeness** — Σ|n⟩⟨n| = 𝟙. Any state expands as |ψ⟩ = Σ c_n |n⟩ with c_n = ⟨n|ψ⟩.
5. **Standard observables** — position x̂ (multiplication operator in position basis), momentum p̂ = −iℏ∂/∂x (derivative), energy Ĥ, angular momentum L̂, spin Ŝ. Each Hermitian; each with its own eigenbasis.
6. **Measurement revisited** — probability of outcome λ_n from state |ψ⟩ is |⟨n|ψ⟩|². Post-measurement state is |n⟩. The measurement "picks" an eigenbasis.
7. **What's next** — when can two observables be measured together? The commutator. FIG.18.

**Scenes to build (2):**

| File | Purpose |
|---|---|
| `operator-eigenstates-scene.tsx` | 2 × 2 Hermitian matrix editor. Live eigenvalue/eigenvector computation. Visual unit-circle plot with eigenvectors highlighted. |
| `observable-measurement-scene.tsx` | Pick observable (position, momentum, energy) for a particle in a superposition. Histogram of outcomes over 1000 shots matches |⟨n|ψ⟩|². |

**Physicists (aside):**
- Charles Hermite *(exists)*
- Paul Dirac *(exists)*
- John von Neumann *(exists)*

**Glossary terms:**
- `hermitian-operator` — concept
- `eigenvalue` — concept
- `eigenvector` — concept
- `observable` — concept
- `spectral-theorem` — concept

**Reading minutes:** 10.

---

### FIG.18 — Commutators and Simultaneous Eigenstates

**Hook.** Two Hermitian operators can be "diagonalised together" — have a common eigenbasis — if and only if they commute. Position and energy in a general potential don't. Position and momentum never do. This algebraic fact is the root of every uncertainty relation in physics.

**Sections (7):**

1. **The commutator** — [Â, B̂] ≡ ÂB̂ − B̂Â. A measure of the order-dependence of two operations.
2. **The canonical commutator** — [x̂, p̂] = iℏ. The defining relation of quantum mechanics. Dirac recognised its isomorphism to the Poisson brackets of classical mechanics on a 1925 Sunday walk.
3. **Simultaneous eigenstates** — if [Â, B̂] = 0, a complete basis of common eigenstates exists; both observables have definite values simultaneously. If not, they don't.
4. **Compatible observables** — {Ĥ, L̂², L̂_z} in the hydrogen atom all commute pairwise; a single basis |n, ℓ, m⟩ diagonalises all three. Quantum numbers.
5. **Operator algebra structure** — Jacobi identity, Leibniz rule for [Â, B̂Ĉ]. Enough to compute most brackets without expanding.
6. **Time evolution** — ⟨Ô⟩ changes in time iff [Ĥ, Ô] ≠ 0. Ehrenfest's theorem: d⟨Ô⟩/dt = (i/ℏ)⟨[Ĥ, Ô]⟩ + ⟨∂Ô/∂t⟩.
7. **What's next** — turn the commutator into an uncertainty bound. FIG.19.

**Scenes to build (2):**

| File | Purpose |
|---|---|
| `commutator-demo-scene.tsx` | Pick two observables; matrix view shows [Â, B̂]. Flag: "commute? Y/N." Toy Pauli-matrix example highlights [σ_x, σ_y] = 2iσ_z. |
| `compatible-basis-scene.tsx` | Hydrogen energy-level diagram with three commuting labels (n, ℓ, m). Click a level → see the eigenstate's values of all three. |

**Physicists (aside):**
- Paul Dirac *(exists)*
- Werner Heisenberg *(exists)*
- Paul Ehrenfest *(exists)*

**Glossary terms:**
- `commutator` — concept
- `canonical-commutation-relation` — concept
- `compatible-observables` — concept
- `complete-set-of-commuting-observables` — concept

**Reading minutes:** 9.

---

### FIG.19 — The Uncertainty Principle

**Hook.** Copenhagen, February 1927. Heisenberg is alone — Bohr is skiing. He writes a long letter to Pauli on 23 February sketching the γ-ray microscope. Photons used to image an electron carry momentum; the measurement itself kicks the electron. The result: ΔxΔp ≥ ℏ/2. Not a technological limit. A statement about what states exist.

**Sections (7):**

1. **The statement** — σ_A σ_B ≥ ½|⟨[Â, B̂]⟩|. A general inequality for any two observables.
2. **The derivation** — Cauchy-Schwarz inequality applied to (Â − ⟨Â⟩)|ψ⟩ and (B̂ − ⟨B̂⟩)|ψ⟩. Three lines on a whiteboard.
3. **Position-momentum** — [x̂, p̂] = iℏ ⇒ Δx Δp ≥ ℏ/2. A Gaussian saturates the bound.
4. **Energy-time** — ΔE Δt ≥ ℏ/2. Not an operator relation (there is no time operator); rather a statement about a signal's spectral width and duration. Relevant for resonance lifetimes and unstable particles.
5. **Heisenberg's microscope** — the pedagogical story: to locate an electron with light of wavelength λ you resolve Δx ~ λ but transfer momentum Δp ~ h/λ. Handwavy but captures the idea.
6. **What uncertainty is not** — it is not a limitation of our tools. A spread-free state in both x and p does not exist in Hilbert space; no technology can prepare one. The principle is ontological, not epistemological.
7. **What's next** — apply the machinery to a real atom. Module 6.

**Scenes to build (3):**

| File | Purpose |
|---|---|
| `gaussian-uncertainty-scene.tsx` | Gaussian wavefunction; width slider. |ψ(x)|² and |ψ̃(p)|² shown side by side. Product Δx·Δp readout stays at ℏ/2 (minimum); deforming the Gaussian raises it. |
| `heisenberg-microscope-scene.tsx` | An electron beneath a microscope; click "illuminate." Photon wavelength slider. Trade-off: short λ → good Δx but large recoil Δp. |
| `energy-time-pulse-scene.tsx` | A Gaussian pulse of duration Δt shown in time and in frequency. Product Δt·Δω ≥ ½. Same inequality, Fourier form. |

**Physicists (aside):**
- Werner Heisenberg *(exists)*
- Niels Bohr *(exists)*
- Hermann Weyl *(NEW — proved the general uncertainty inequality; gauge theory; group theory in quantum mechanics)*

**Glossary terms:**
- `uncertainty-principle` — concept
- `heisenberg-inequality` — concept
- `minimum-uncertainty-state` — concept
- `energy-time-uncertainty` — concept

**Reading minutes:** 11.

---

## Module 6 · The Hydrogen Atom

One proton, one electron, three dimensions, one Coulomb potential. Solve the Schrödinger equation. Out drops the entire structure of the periodic table in embryo: three quantum numbers, s-p-d-f orbitals, the Rydberg formula with no free parameters. This is the theory's defining triumph. Everything in chemistry downstream is hydrogen with complications.

---

### FIG.20 — Separation in Spherical Coordinates

**Hook.** The Coulomb potential V(r) = −e²/(4πε₀r) depends only on r. So the Schrödinger equation separates in spherical coordinates: ψ(r, θ, φ) = R(r)Y(θ, φ). The angular part is universal — spherical harmonics — and the radial part carries all the hydrogen-specific physics.

**Sections (7):**

1. **Why spherical** — any central potential V(r) has rotational symmetry; angular momentum commutes with Ĥ. Polar coordinates match the symmetry.
2. **The Laplacian in spherical coordinates** — splits into a radial piece and an angular piece. The angular piece is exactly L̂²/(ℏ²r²).
3. **Separating the equation** — substitute ψ = R(r)Y(θ, φ); get two ODEs connected by a separation constant ℓ(ℓ+1).
4. **The angular equation** — Y(θ, φ) eigenfunction of L̂² with eigenvalue ℏ²ℓ(ℓ+1), and of L̂_z with eigenvalue ℏm. Simultaneous diagonalisation.
5. **Spherical harmonics** — Y_ℓᵐ(θ, φ). Real parts give the familiar lobed orbital pictures. Three quantum numbers (n, ℓ, m) tag every state.
6. **Parity** — Y_ℓᵐ(−r̂) = (−1)^ℓ Y_ℓᵐ(r̂). Even parity for ℓ = 0, 2, 4 (s, d); odd for ℓ = 1, 3 (p, f). Selection rules for electric-dipole transitions come from this.
7. **What's next** — plug into the radial equation. FIG.21.

**Scenes to build (2):**

| File | Purpose |
|---|---|
| `spherical-harmonics-scene.tsx` | (ℓ, m) selector; render the corresponding Y_ℓᵐ as a 3-D lobed surface. s → sphere; p → dumbbell; d → four-lobed clover; etc. |
| `angular-momentum-vector-scene.tsx` | L vector on the ℓ = 2 cone: length √(ℓ(ℓ+1))ℏ, z-projection mℏ. Precession around z. Quantised cones for each m. |

**Physicists (aside):**
- Pierre-Simon Laplace *(NEW — Laplace operator, celestial mechanics, eponymous transform)*
- Adrien-Marie Legendre *(NEW — Legendre polynomials, the angular building blocks of Y_ℓᵐ)*

**Glossary terms:**
- `spherical-harmonic` — concept
- `angular-momentum-quantum-number` — concept
- `magnetic-quantum-number` — concept
- `parity` — concept

**Reading minutes:** 10.

---

### FIG.21 — The Radial Equation and Energy Levels

**Hook.** The radial equation for the Coulomb potential has closed-form solutions: Laguerre polynomials multiplied by exponentials, scaled by the Bohr radius a₀ = 0.529 Å. The energy spectrum is E_n = −13.6 eV / n². Bohr's 1913 formula, now derived from a wave equation with no extra assumptions.

**Sections (7):**

1. **The radial equation** — after substitution u(r) = rR(r), an effective 1-D Schrödinger equation with centrifugal barrier ℏ²ℓ(ℓ+1)/(2mr²).
2. **Bound-state solutions** — for E < 0, solutions R_nℓ(r) = Laguerre polynomial × e^(−r/(na₀)). Bohr radius a₀ = 4πε₀ℏ²/(m_e e²) emerges naturally.
3. **Energy eigenvalues** — E_n = −13.6 eV / n², independent of ℓ or m (Coulomb degeneracy). n = 1, 2, 3, …; for each n, ℓ = 0, 1, …, n−1; for each ℓ, m = −ℓ, …, +ℓ.
4. **Degeneracy** — n² states share energy E_n. The extra ℓ-degeneracy is a special feature of the 1/r potential (hidden SO(4) symmetry — Pauli, 1926, solved hydrogen this way before Schrödinger's paper).
5. **Orbital shapes** — 1s (spherical), 2s (spherical with a node), 2p (dumbbell, three orientations), 3d (clover). Chemistry-textbook orbitals are R²_nℓ |Y_ℓᵐ|².
6. **Transitions** — emission at ℏω_nm = E_n − E_m. Selection rules from parity: Δℓ = ±1 for electric-dipole. Gives the observed H I spectrum perfectly, up to fine structure.
7. **What's next** — the corrections Bohr missed. Fine structure preview. FIG.22.

**Scenes to build (3):**

| File | Purpose |
|---|---|
| `hydrogen-orbitals-scene.tsx` | (n, ℓ, m) selector. 3-D orbital cloud rendered as point-density from |ψ|². Colour by phase. |
| `radial-distribution-scene.tsx` | P(r) = 4πr²R²_nℓ(r) for chosen (n, ℓ). Shows most-probable radius; Bohr radius marker. |
| `hydrogen-spectrum-series-scene.tsx` | Lyman, Balmer, Paschen series as stacked spectral strips. Hover a line → see (n_i, n_f) and wavelength. |

**Physicists (aside):**
- Edmond Laguerre *(NEW — Laguerre polynomials; the radial building block of hydrogen)*
- Wolfgang Pauli *(NEW — solved hydrogen algebraically in January 1926 using the Runge-Lenz vector, before Schrödinger; exclusion principle; Nobel 1945)*

**Glossary terms:**
- `bohr-radius` — concept
- `principal-quantum-number` — concept
- `laguerre-polynomial` — concept
- `atomic-orbital` — concept
- `radial-distribution` — concept

**Reading minutes:** 12.

---

### FIG.22 — Fine Structure and Beyond

**Hook.** The Schrödinger hydrogen spectrum is almost right. Feed it through a high-resolution spectrometer and each line splits — fine structure. The splitting has three sources: relativistic kinetic energy, spin-orbit coupling, and the Darwin term. All three fall out of Dirac's relativistic equation of 1928 without being postulated. Preview of QED.

**Sections (7):**

1. **The observed splittings** — Michelson had noted a 0.01 Å doublet of Hα in 1887. Sommerfeld in 1916 explained it with relativistic Bohr orbits and got the right formula for the wrong reason.
2. **Relativistic kinetic energy** — p²/(2m) is not enough. Expanding √(p²c² + m²c⁴) adds a p⁴ correction ~ (v/c)² E.
3. **Spin-orbit coupling** — electron's spin magnetic moment interacts with the magnetic field it sees as it orbits the nucleus. Needs spin (Module 7) first; shifts energies by (v/c)²E × a Clebsch-Gordan factor.
4. **The Darwin term** — a δ-function contact term at the origin, zero for ℓ > 0, nonzero for s-states. Surprising; emerges naturally from the Dirac equation.
5. **Fine-structure constant** — α = e²/(4πε₀ℏc) ≈ 1/137. All three corrections scale as α². Feynman: "one of the greatest damn mysteries of physics."
6. **Lamb shift** — 1947, Willis Lamb and Robert Retherford measure a splitting between 2s₁/₂ and 2p₁/₂ states that Dirac's theory predicts to be degenerate. 1058 MHz. Bethe computes it in days using renormalised QED on a train from Shelter Island. Start of modern QED.
7. **What's next** — we need spin to complete fine structure. Module 7.

**Scenes to build (2):**

| File | Purpose |
|---|---|
| `fine-structure-scene.tsx` | 2p level of hydrogen: unperturbed → split into 2p₁/₂ and 2p₃/₂ by spin-orbit. Shift magnitudes calibrated to experiment. |
| `lamb-shift-scene.tsx` | 2s₁/₂ and 2p₁/₂ at the Dirac level — degenerate. QED corrections lift 2s₁/₂ above 2p₁/₂ by 1058 MHz. Arrows and numbers. |

**Physicists (aside):**
- Arnold Sommerfeld *(exists)*
- Paul Dirac *(exists)*
- Willis Lamb *(NEW — measured the Lamb shift 1947; Nobel 1955)*
- Hans Bethe *(NEW — first Lamb-shift calculation 1947; also stellar nucleosynthesis 1938; Nobel 1967)*

**Glossary terms:**
- `fine-structure` — concept
- `fine-structure-constant` — concept
- `spin-orbit-coupling` — concept
- `lamb-shift` — concept
- `qed` — concept

**Reading minutes:** 11.

---

## Module 7 · Spin & Angular Momentum

A magnet passes a beam of silver atoms through a non-uniform field. The beam splits in two — not three, not a continuum. This is the 1922 Stern-Gerlach experiment, which reveals a quantum property with no classical analogue: spin. Half-integer angular momentum. The Pauli matrices. Spinors that return to themselves only after 720°. Bosons versus fermions. The entire structure of matter rests on this module.

---

### FIG.23 — Stern-Gerlach and the Discovery of Spin

**Hook.** Frankfurt, November 1921. Otto Stern and Walther Gerlach send a beam of silver atoms through an inhomogeneous magnetic field. They expect, on Bohr-Sommerfeld quantisation, to see discrete spots. A persistent legend says the experiment worked only because Stern smoked cheap cigars — the sulphur deposited by the smoke darkened the otherwise-invisible silver spot on the glass plate. They see two spots. The beam splits in two. No classical angular momentum does that.

**Sections (7):**

1. **The setup** — oven producing a beam of silver atoms; non-uniform B-field (∂B_z/∂z ≠ 0); detection plate. Magnetic moment feels force ∝ ∂B/∂z.
2. **The classical prediction** — random orientations give a smeared-out band on the plate. Bohr-Sommerfeld predicts three spots (m = −1, 0, +1 for ℓ = 1). Observed: two.
3. **What Stern and Gerlach actually saw** — two clear spots. They thought it confirmed "space quantisation" of orbital angular momentum. They misidentified it for three years.
4. **Uhlenbeck and Goudsmit, 1925** — Leiden graduate students propose that the electron has an intrinsic angular momentum of ℏ/2. Half-integer, two projections. Ehrenfest submits their paper before they can withdraw it.
5. **The factor of 2** — the classical "spinning-electron" picture gives a gyromagnetic ratio g = 1. Experiments demand g = 2. Dirac's equation predicts exactly g = 2 from first principles. QED adds g = 2.00232…
6. **Why silver?** — single unpaired 5s electron, all inner shells closed. The beam measures just one electron's spin. Modern versions use neutral atoms, neutrons, even single electrons.
7. **What's next** — the algebra that describes two-state quantum systems. FIG.24.

**Scenes to build (3):**

| File | Purpose |
|---|---|
| `stern-gerlach-scene.tsx` | Oven → magnet → screen. Toggle classical prediction vs quantum observation. Classical: band. Quantum: two spots. |
| `sequential-sg-scene.tsx` | Two Stern-Gerlach magnets in sequence along different axes (z then x). Selecting |+z⟩ then measuring x gives 50/50. Toggleable third magnet demonstrates non-commuting spin. |
| `precessing-spin-scene.tsx` | Spin-½ expectation value vector precessing in a uniform B-field (Larmor precession). |

**Physicists (aside):**
- Otto Stern *(NEW — molecular beam pioneer; Nobel 1943; refused to return to Germany after 1933)*
- Walther Gerlach *(NEW — co-experimenter; remained in Germany through WWII; led the Nazi nuclear programme)*
- George Uhlenbeck & Samuel Goudsmit *(NEW — proposed electron spin as Leiden students, 1925)*

**Glossary terms:**
- `stern-gerlach-experiment` — concept
- `spin` — concept
- `intrinsic-angular-momentum` — concept
- `gyromagnetic-ratio` — concept
- `space-quantisation` — concept

**Reading minutes:** 11.

---

### FIG.24 — Pauli Matrices and Spinors

**Hook.** Hamburg, 1927. Wolfgang Pauli, twenty-seven, notorious for shredding colloquia with one-line demolitions ("not even wrong"), writes down three 2×2 matrices that describe the electron's spin. σ_x, σ_y, σ_z. They anticommute; they square to the identity; they generate the entire two-dimensional rotation story. The Pauli algebra is the smallest interesting non-trivial algebra in physics.

**Sections (7):**

1. **The two-state system** — spin-½ lives in a 2-D Hilbert space. States |↑⟩ and |↓⟩. Any state α|↑⟩ + β|↓⟩ with |α|² + |β|² = 1.
2. **The Pauli matrices** — σ_x = [[0,1],[1,0]], σ_y = [[0,−i],[i,0]], σ_z = [[1,0],[0,−1]]. Spin operators Ŝ_i = (ℏ/2)σ_i.
3. **Algebraic identities** — σ_i² = 𝟙; {σ_i, σ_j} = 2δ_ij 𝟙; [σ_i, σ_j] = 2iε_ijk σ_k. Lie algebra of SU(2).
4. **The Bloch sphere** — every pure spin state is a point on a unit sphere. |↑⟩ = north pole, |↓⟩ = south, |→⟩ and |←⟩ on the equator. Rotations of the state are rotations of the sphere.
5. **Rotations by 4π** — a spinor rotated by 2π picks up a minus sign. Only after 4π does it return to itself. Observable in neutron interferometry (Werner et al., 1975).
6. **Qubits** — the two-level system is the unit of quantum computation. Same mathematics, different physical substrate.
7. **What's next** — combine orbital and spin angular momentum. FIG.25.

**Scenes to build (2):**

| File | Purpose |
|---|---|
| `bloch-sphere-scene.tsx` | Draggable spin state on a 3-D sphere. Apply rotation about x, y, z axes via sliders. Watch the state precess. |
| `pauli-matrix-action-scene.tsx` | Pick σ_i; apply to chosen spinor. Before/after state on Bloch sphere. Commutator [σ_x, σ_y] = 2iσ_z demonstration. |

**Physicists (aside):**
- Wolfgang Pauli *(exists)*
- Paul Dirac *(exists)*
- Felix Bloch *(NEW — Bloch sphere; solid-state NMR; Nobel 1952)*

**Glossary terms:**
- `pauli-matrix` — concept
- `spinor` — concept
- `bloch-sphere` — concept
- `qubit` — concept
- `two-level-system` — concept

**Reading minutes:** 10.

---

### FIG.25 — Addition of Angular Momentum

**Hook.** The electron in hydrogen has orbital angular momentum L and spin angular momentum S. Add them: J = L + S. In quantum mechanics, adding angular momenta isn't vector arithmetic — it's tensor-product decomposition with Clebsch-Gordan coefficients. Nineteenth-century mathematicians worked them out; twentieth-century physicists moved in.

**Sections (7):**

1. **Why addition is subtle** — the total J² is sharp; J_z is sharp; but L_z and S_z individually need not be. Must re-diagonalise.
2. **The rules** — combining j₁ and j₂: total j ranges from |j₁ − j₂| to j₁ + j₂ in integer steps. Dimension: (2j₁+1)(2j₂+1) adds up to Σ(2j+1).
3. **Clebsch-Gordan coefficients** — the basis-change between |j₁, m₁⟩|j₂, m₂⟩ and |j, m⟩. Tabulated in every QM textbook.
4. **Spin-½ + spin-½** — singlet (j=0, antisymmetric) + triplet (j=1, symmetric). The singlet/triplet split shows up in helium, Cooper pairs, deuteron, entanglement.
5. **Orbital + spin** — L and S of the hydrogen electron combine to J. Labels |n, ℓ, j, m_j⟩. Spin-orbit coupling makes J — not L and S separately — the good quantum number.
6. **Zeeman effect** — in an external field, the degeneracy in m_j lifts. Normal Zeeman (spinless, three lines) is wrong for hydrogen; anomalous Zeeman (with spin) works and was the main historical clue to the existence of spin.
7. **What's next** — many electrons. Identical particles. FIG.26.

**Scenes to build (2):**

| File | Purpose |
|---|---|
| `angular-momentum-addition-scene.tsx` | Two spin-½ arrows; toggle between tensor-product basis and coupled basis. Singlet vs triplet states visualised. |
| `zeeman-scene.tsx` | Hydrogen energy level in an increasing B-field; degeneracy lifts. Anomalous pattern for real hydrogen shown. |

**Physicists (aside):**
- Alfred Clebsch & Paul Gordan *(NEW — nineteenth-century German mathematicians; invariant theory; coefficients named in their honour c. 1930)*
- Pieter Zeeman *(NEW — discovered the Zeeman effect 1896; Nobel 1902 with Lorentz)*

**Glossary terms:**
- `angular-momentum-addition` — concept
- `clebsch-gordan` — concept
- `singlet-triplet` — concept
- `zeeman-effect` — concept
- `total-angular-momentum` — concept

**Reading minutes:** 10.

---

### FIG.26 — Identical Particles and the Pauli Exclusion Principle

**Hook.** Hamburg, 1925. Pauli is searching for a rule that explains the periodic table's shell structure. He writes: no two electrons can share all four quantum numbers. In 1940 he proves — from relativity and quantum field theory together — the spin-statistics theorem. Half-integer spin ⇒ antisymmetric wavefunctions ⇒ exclusion. Integer spin ⇒ symmetric ⇒ condensation. Matter is rigid because electrons are fermions.

**Sections (7):**

1. **What "identical" means in QM** — two electrons are not "two labelled things"; they are indistinguishable in principle. Swapping them gives a state that must differ from the original only by a phase.
2. **Symmetric and antisymmetric states** — swap → ±1. Boson (+) and fermion (−). No third option in 3+1 dimensions (anyons exist only in 2D).
3. **Pauli's rule** — no two identical fermions can occupy the same one-particle state. Follows from antisymmetry: ψ(x, x) = −ψ(x, x) = 0.
4. **Periodic table** — electrons fill shells 2(2ℓ+1) at a time (two spins per orbital). Chemistry is a consequence.
5. **Degeneracy pressure** — confined fermions fight back as you compress them. Metals, white dwarfs, neutron stars. Chandrasekhar limit (1.4 M_⊙).
6. **Bosons in contrast** — identical bosons prefer to occupy the same state. Bose-Einstein condensation; photon bunching; superfluidity.
7. **Spin-statistics** — empirically known since Pauli; theorem by Fierz 1939 and Pauli 1940 uses Lorentz invariance + positive-energy + local commutation to fix spin-½ → antisymmetric uniquely.

**Scenes to build (2):**

| File | Purpose |
|---|---|
| `fermion-boson-scene.tsx` | Two particles in two energy levels. Toggle between distinguishable, boson, fermion. Allowed configurations and their weights. |
| `periodic-table-filling-scene.tsx` | Fill Z = 1 … 18 one electron at a time, respecting exclusion and Hund's rule. Shell structure (1s, 2s, 2p, 3s, 3p) emerges. |

**Physicists (aside):**
- Wolfgang Pauli *(exists)*
- Markus Fierz *(NEW — proved a weak version of spin-statistics 1939; Pauli's long-time collaborator)*
- Friedrich Hund *(NEW — Hund's rules for atomic ground states; Jahn-Teller theorem; lived to 101)*

**Glossary terms:**
- `pauli-exclusion-principle` — concept
- `identical-particles` — concept
- `fermion` — concept
- `boson` — concept
- `spin-statistics-theorem` — concept
- `degeneracy-pressure` — concept

**Reading minutes:** 12.

---

## Module 8 · Multi-particle Quantum Systems

Two or more particles change what Hilbert space looks like: it becomes a tensor product. With symmetry constraints (Module 7), we can write the wavefunction of helium. Beyond two, exact solutions vanish and approximation methods take over: Hartree, Hartree-Fock, density-functional theory. The statistics — Fermi-Dirac and Bose-Einstein — determine whether matter conducts, superconducts, or condenses.

---

### FIG.27 — The Helium Atom and Two-Electron Systems

**Hook.** Helium broke Bohr. His 1913 model, brilliant for hydrogen, gave the wrong ground-state energy for helium by 5%. For twelve years people tried to patch it. Schrödinger's equation in 1926 gave a path forward but no closed-form answer: the two electrons interact with each other as well as with the nucleus, and the three-body problem is unsolvable analytically in both classical and quantum mechanics.

**Sections (7):**

1. **Setup** — two electrons around a Z = 2 nucleus. Ĥ = Ĥ₁ + Ĥ₂ + e²/(4πε₀)|r₁ − r₂|. The last term is what makes it hard.
2. **Zero-order: ignore repulsion** — each electron in hydrogen-like 1s state with Z = 2. Ground-state energy 2 × (−Z² × 13.6) = −108.8 eV. Experiment: −79.0 eV.
3. **First-order perturbation** — compute ⟨1s 1s | e²/r₁₂ | 1s 1s⟩. Evaluates to +34.0 eV. Sum: −74.8 eV. Error down to 5%.
4. **Variational method** — treat Z as an adjustable parameter Z_eff (screening). Minimise ⟨Ĥ⟩; get Z_eff = 27/16 = 1.6875 and E = −77.5 eV. Error under 2%.
5. **Symmetrisation** — ground state: spatial part symmetric (both in 1s), spin part antisymmetric (singlet). Excited 1s2s states split into para-helium (singlet) and ortho-helium (triplet). Different energies from exchange integral.
6. **Exchange** — the energy difference between para and ortho helium has no classical analogue; it comes purely from the antisymmetrisation and the electrons' partial overlap. "Exchange integral" J.
7. **What's next** — scale up to lithium, beryllium, … Hartree-Fock. FIG.28.

**Scenes to build (2):**

| File | Purpose |
|---|---|
| `helium-energy-scene.tsx` | Stacked bar: zero-order, first-order perturbation, variational, experiment. Convergence visually. |
| `para-ortho-helium-scene.tsx` | Singlet and triplet 1s2s states; energy splitting labelled J. Spin-configuration diagram. |

**Physicists (aside):**
- Egil Hylleraas *(NEW — Norwegian; computed helium ground-state energy to six-decimal precision in 1929 using a variational ansatz with r₁₂ coordinates)*
- Douglas Hartree *(NEW — self-consistent-field method 1928)*

**Glossary terms:**
- `two-electron-atom` — concept
- `variational-method` — concept
- `perturbation-theory` — concept
- `exchange-integral` — concept
- `para-ortho-helium` — concept

**Reading minutes:** 11.

---

### FIG.28 — Slater Determinants and Hartree-Fock

**Hook.** Two electrons antisymmetrise easily. N electrons need a determinant — the Slater determinant — with N! terms. Compute the mean-field potential each electron feels from the others, solve, update, repeat until self-consistent. The Hartree-Fock method is the workhorse of quantum chemistry for a century.

**Sections (7):**

1. **The many-electron wavefunction** — ψ(x₁, x₂, …, x_N). Antisymmetric under any pair swap. Requires N!-term expression.
2. **Slater determinant** — take N one-particle orbitals; place them in a determinant. Swap two columns → determinant flips sign. Automatic antisymmetry.
3. **Hartree-Fock equation** — each orbital φ_i satisfies a Schrödinger-like equation with the mean field of the other N − 1 electrons plus an exchange term from antisymmetry.
4. **Self-consistent loop** — guess {φ_i}; compute mean field; solve; get new {φ_i}; iterate. Until the input and output orbitals match.
5. **Correlation energy** — HF treats mean-field interactions exactly but misses instantaneous correlations between electrons. The correlation energy is the remaining few per cent; post-HF methods (CI, coupled cluster, DFT) chase it.
6. **Density-functional theory** — Hohenberg-Kohn 1964, Kohn-Sham 1965: the ground-state energy is a functional of the electron density alone, in principle. Approximate functionals (LDA, GGA, hybrids) have made DFT the dominant computational tool in chemistry and materials. Kohn Nobel 1998.
7. **What's next** — statistics of many indistinguishable particles. FIG.29.

**Scenes to build (2):**

| File | Purpose |
|---|---|
| `slater-determinant-scene.tsx` | Three orbitals in a 3×3 matrix; each column a particle's spatial position. Swap columns: determinant flips sign visibly. |
| `hartree-fock-loop-scene.tsx` | Self-consistent loop animated: guess → mean field → solve → update. Orbital shape converges over ~10 iterations. |

**Physicists (aside):**
- John Slater *(NEW — Slater determinant 1929; MIT; atomic and solid-state theorist)*
- Vladimir Fock *(NEW — Leningrad; Hartree-Fock 1930; general relativity; quantum field theory)*
- Walter Kohn *(NEW — density-functional theory; Nobel 1998)*

**Glossary terms:**
- `slater-determinant` — concept
- `hartree-fock` — concept
- `self-consistent-field` — concept
- `correlation-energy` — concept
- `density-functional-theory` — concept

**Reading minutes:** 10.

---

### FIG.29 — Quantum Statistics: Fermi-Dirac and Bose-Einstein

**Hook.** Dhaka, 1924. Satyendra Nath Bose, unknown lecturer, sends Einstein a paper on photon statistics in German. Einstein translates it, extends it to massive bosons, and publishes it under their joint names. Fermi in Rome 1926 and Dirac in Cambridge 1926 derive independently the analogous distribution for antisymmetric particles. Classical Maxwell-Boltzmann breaks into two quantum branches.

**Sections (7):**

1. **Distinguishable, boson, fermion — count the states** — for three boxes and three particles: 27 distinguishable arrangements, 10 boson arrangements, 1 fermion arrangement. Statistics differ in the bookkeeping.
2. **Bose-Einstein distribution** — ⟨n_i⟩ = 1/(exp((ε_i − μ)/kT) − 1). Any number of bosons per state; chemical potential μ ≤ ground-state energy.
3. **Fermi-Dirac distribution** — ⟨n_i⟩ = 1/(exp((ε_i − μ)/kT) + 1). At most one fermion per state; μ becomes the Fermi energy E_F at T = 0.
4. **High-T limit** — both distributions reduce to Maxwell-Boltzmann. Statistics matter when the thermal de Broglie wavelength approaches the inter-particle spacing. Regime: ultracold, or ultra-dense, or near absolute zero.
5. **Bose-Einstein condensation** — below a critical T, a macroscopic fraction of bosons occupies the single-particle ground state. Predicted 1924, achieved with rubidium in 1995 (JILA, Cornell and Wieman) and sodium (MIT, Ketterle). 2001 Nobel.
6. **Fermi sea** — identical fermions fill states up to E_F at T = 0. Metals (electrons), neutron stars (neutrons), white dwarfs (electrons) are degenerate Fermi gases.
7. **What's next** — the spookiest consequence of the quantum formalism. Module 9.

**Scenes to build (3):**

| File | Purpose |
|---|---|
| `three-particle-counting-scene.tsx` | Three boxes, three particles. Toggle between MB, BE, FD. Count arrangements; tabulate. |
| `distribution-scene.tsx` | ⟨n⟩ vs ε at chosen T, μ. Three curves: MB, BE, FD. Low T → sharp step (FD) or divergence (BE). |
| `bec-condensation-scene.tsx` | Momentum-distribution of an ultracold Bose gas as T decreases through T_c. Central peak grows rapidly. Real JILA absorption-image style. |

**Physicists (aside):**
- Satyendra Nath Bose *(NEW — Dhaka; sent the 1924 photon-gas paper to Einstein; died 1974)*
- Enrico Fermi *(NEW — Rome; statistics; first nuclear reactor Chicago 1942; Manhattan Project; Nobel 1938)*
- Eric Cornell, Carl Wieman, Wolfgang Ketterle *(NEW — BEC experimentalists; 2001 Nobel)*

**Glossary terms:**
- `bose-einstein-distribution` — concept
- `fermi-dirac-distribution` — concept
- `chemical-potential` — concept
- `fermi-energy` — concept
- `bose-einstein-condensate` — concept
- `degenerate-gas` — concept

**Reading minutes:** 11.

---

## Module 9 · Entanglement & Bell

Einstein called it "spooky action at a distance" and meant it as a reason to reject quantum mechanics. The EPR paper of 1935 argues that two particles correlated in a Bell state violate local realism. In 1964 John Bell translates the philosophical dispute into a testable inequality. In 1972 Freedman and Clauser, then in 1982 Aspect in Paris, then in 2015 three groups with loophole-free experiments, show that Bell's inequality is violated. Quantum mechanics is correct. The world is not locally real.

---

### FIG.30 — EPR and the Paradox

**Hook.** Princeton, 1935. Einstein, Podolsky, and Rosen publish "Can Quantum-Mechanical Description of Physical Reality Be Considered Complete?" Their argument: take two particles in an entangled state, separate them, measure one — the other's state is instantly known. Either (a) the information travels faster than light, or (b) the information was there all along, meaning the theory is incomplete. They bet on (b). They were wrong in a way no one foresaw.

**Sections (7):**

1. **The EPR state** — two spin-½ particles in the singlet |↑↓⟩ − |↓↑⟩)/√2. Total spin zero. Measuring one gives the opposite of the other along any axis.
2. **The argument** — if Alice measures along z and gets ↑, she immediately knows Bob's is ↓. By local realism, Bob's particle must have "had" spin ↓ along z before Alice measured. The same logic for x, y. So Bob's particle has definite values along every axis — but quantum mechanics says it can't.
3. **Elements of reality** — EPR define: "if we can predict with certainty the value of a physical quantity without disturbing the system, there is an element of reality corresponding to it." This is the premise quantum mechanics will be shown to violate.
4. **Schrödinger's response, 1935** — Schrödinger coins "Verschränkung" (entanglement). He writes: "I would not call that one but the characteristic trait of quantum mechanics."
5. **Bohr's reply** — disputes EPR's notion of "reality"; insists on the inseparability of the combined system. Unsatisfying to readers then and now.
6. **Hidden variables** — EPR suggests quantum mechanics is incomplete; there might be λ-variables determining outcomes, with quantum predictions emerging on average. Von Neumann's 1932 "proof" against hidden variables turned out to be flawed.
7. **What's next** — Bell finds a way to test the hidden-variable hypothesis against quantum mechanics with real experiments. FIG.31.

**Scenes to build (2):**

| File | Purpose |
|---|---|
| `epr-pair-scene.tsx` | Two detectors (Alice, Bob). Pair of entangled spins sent out. Measure along same axis → always anticorrelated. Measure along perpendicular axes → random. |
| `einstein-bohr-debate-scene.tsx` | Split-screen quotation viewer: Einstein 1935 "spooky action," Bohr 1935 reply, Schrödinger 1935 "entanglement." |

**Physicists (aside):**
- Albert Einstein *(exists)*
- Boris Podolsky *(NEW — Russian-American; co-author of EPR; later suspected of Soviet ties)*
- Nathan Rosen *(NEW — co-author of EPR; Einstein-Rosen bridge of 1935; Technion founder)*
- Erwin Schrödinger *(exists — here for the 1935 entanglement paper and the cat)*

**Glossary terms:**
- `entanglement` — concept
- `epr-paradox` — concept
- `local-realism` — concept
- `hidden-variables` — concept
- `element-of-reality` — concept

**Reading minutes:** 11.

---

### FIG.31 — Bell's Inequality

**Hook.** CERN canteen, 1964. John Stewart Bell, Belfast-born particle theorist, works on accelerator physics by day and on quantum foundations — controversial and career-unfriendly — by night. He notices that any local-hidden-variable theory must obey a numerical inequality; quantum mechanics predicts its violation. A purely mathematical wedge between two philosophies. Experiments can now decide.

**Sections (7):**

1. **The setup** — entangled pair; Alice picks a measurement axis a, Bob picks b. Record correlation E(a, b) = ⟨AB⟩.
2. **Local realism's prediction** — with hidden variables λ and locality: E(a, b) = ∫ dλ ρ(λ) A(a, λ) B(b, λ), with |A|, |B| ≤ 1.
3. **The CHSH inequality** — Clauser, Horne, Shimony, Holt, 1969: |E(a, b) + E(a, b') + E(a', b) − E(a', b')| ≤ 2. Any local-realistic theory obeys it.
4. **Quantum prediction** — for the singlet state, E(a, b) = −cos(θ_ab). Pick angles optimally: CHSH value = 2√2 ≈ 2.828. Violates the bound.
5. **What the violation means** — no local-realistic theory, hidden variables or otherwise, can reproduce quantum correlations. Nature is non-local or non-real or both. The loophole of "superdeterminism" remains, but it is radical.
6. **The Tsirelson bound** — 2√2 is the maximum any quantum theory can achieve. Quantum correlations are non-local but bounded; they don't permit faster-than-light signalling.
7. **What's next** — the experiments. FIG.32.

**Scenes to build (2):**

| File | Purpose |
|---|---|
| `bell-inequality-scene.tsx` | Angle sliders for (a, a', b, b'). CHSH value computed live, plus classical bound line at 2 and quantum ceiling at 2√2. Optimal angles marked. |
| `chsh-correlation-scene.tsx` | E(a, b) = −cos(θ_ab) curve; hidden-variable best-effort correlation (piecewise linear) shown below. Where they disagree. |

**Physicists (aside):**
- John Stewart Bell *(NEW — Belfast-born CERN theorist; 1964 paper; died 1990, shortly before he would likely have won the Nobel)*
- John Clauser, Michael Horne, Abner Shimony, Richard Holt *(NEW — CHSH inequality 1969; Clauser shared the 2022 Nobel)*

**Glossary terms:**
- `bell-inequality` — concept
- `chsh-inequality` — concept
- `tsirelson-bound` — concept
- `non-locality` — concept

**Reading minutes:** 11.

---

### FIG.32 — The Experiments: Aspect 1982, Loophole-free 2015

**Hook.** Orsay, 1982. Alain Aspect — later awarded the 2022 Nobel with Clauser and Zeilinger — fires entangled photon pairs at two distant detectors whose polariser orientations change faster than light can travel between them. CHSH comes out 2.697 ± 0.015, violating the classical bound by many σ. Thirty-three years later, three groups close the last loopholes simultaneously: Delft, NIST, Vienna, August-November 2015.

**Sections (7):**

1. **Freedman-Clauser, 1972** — first CHSH test, with calcium photon cascades. Saw violation but with slow, coarse switching of polarisers. Locality loophole open.
2. **Aspect, 1982** — time-varying analyzers switch in ~10 ns while photons in flight; the detectors cannot "know" each other's setting. Violation confirmed.
3. **Loopholes** — (a) locality: detectors must be spacelike-separated at measurement; (b) detection: enough particles must be detected to avoid "post-selection" artefacts; (c) freedom-of-choice: settings must be chosen independently of hidden variables.
4. **Loophole-free 2015** — Hensen et al. (Delft, entangled NV centres in diamond), Shalm et al. (NIST, photons with high-efficiency detectors), Giustina et al. (Vienna). All three close detection, locality, and freedom-of-choice loopholes together.
5. **Big Bell Test 2018** — 100 000 human volunteers generate random bits that set polarisers in 13 labs worldwide. Still violates. Bell's theorem is now settled.
6. **Practical fallout** — quantum key distribution (BB84, Ekert protocols); device-independent cryptography; quantum random numbers that are certifiably random.
7. **What's next** — using entanglement as a resource: teleportation. FIG.33.

**Scenes to build (2):**

| File | Purpose |
|---|---|
| `aspect-experiment-scene.tsx` | Timeline: photon source, fast-switching polarisers, detectors. CHSH value accumulates live as "events" come in. |
| `loophole-timeline-scene.tsx` | 1972 → 1982 → 1998 (Zeilinger, locality closed) → 2013 (detection closed) → 2015 (loophole-free). Each bar shows which loophole was open/closed. |

**Physicists (aside):**
- Alain Aspect *(NEW — Orsay; 2022 Nobel)*
- Anton Zeilinger *(NEW — Vienna; entanglement swapping; long-distance QKD; 2022 Nobel)*
- Ronald Hensen, Bas Hensen, Krister Shalm, Marissa Giustina *(NEW — 2015 loophole-free experiments — group them in one aside)*

**Glossary terms:**
- `aspect-experiment` — concept
- `loophole-free-bell-test` — concept
- `detection-loophole` — concept
- `locality-loophole` — concept
- `freedom-of-choice-loophole` — concept

**Reading minutes:** 11.

---

### FIG.33 — Quantum Teleportation

**Hook.** Bennett, Brassard, Crépeau, Jozsa, Peres, Wootters, 1993. Take an unknown qubit |ψ⟩ = α|0⟩ + β|1⟩. Using a pre-shared entangled pair and two bits of classical communication, transfer the state — not the atom, not the energy, but the quantum information — to a distant lab. The original is destroyed (no-cloning theorem). The word "teleportation" is cute but accurate.

**Sections (7):**

1. **The resources** — Alice has the unknown state |ψ⟩ and one half of an entangled Bell pair. Bob has the other half. Alice and Bob share a classical channel.
2. **The protocol** — Alice performs a Bell-basis measurement on her two qubits (|ψ⟩ and her half of the pair). Four possible outcomes, each with probability ¼.
3. **The classical step** — Alice sends Bob two classical bits saying which outcome she got. Bob applies one of four Pauli rotations to his qubit. It is now in state |ψ⟩.
4. **Why it doesn't violate relativity** — Bob's qubit has no usable state until he receives Alice's bits. The classical channel is sub-luminal. No faster-than-light information.
5. **The no-cloning theorem** — Wootters and Zurek 1982: you cannot copy an unknown quantum state. Teleportation moves the state without copying; the original is destroyed in the Bell measurement.
6. **Experiments** — Bouwmeester et al. (Vienna, 1997) first photon teleportation; Furusawa (continuous-variable optical, 1998); ground-to-satellite (Micius, China, 2017, 1400 km).
7. **What's next** — interpretation. What does any of this mean? Module 10.

**Scenes to build (2):**

| File | Purpose |
|---|---|
| `teleportation-scene.tsx` | Alice's two qubits + Bob's qubit on a circuit diagram. Bell measurement → 2 classical bits → unitary correction → Bob's qubit = original |ψ⟩. |
| `no-cloning-scene.tsx` | Attempt a perfect-copy gate on an unknown state; shows where the linearity of QM makes it impossible. |

**Physicists (aside):**
- Charles Bennett *(NEW — IBM; teleportation, BB84, reversible computing)*
- William Wootters *(NEW — no-cloning theorem 1982; also on the teleportation paper)*
- Gilles Brassard *(NEW — Montréal; quantum cryptography with Bennett)*

**Glossary terms:**
- `quantum-teleportation` — concept
- `bell-measurement` — concept
- `no-cloning-theorem` — concept
- `bell-state` — concept
- `classical-channel` — concept

**Reading minutes:** 10.

---

## Module 10 · Interpretations & Decoherence

Quantum mechanics works. The formalism produces predictions that have been confirmed to twelve decimal places in the case of the electron g-factor. What the formalism means is still open. Copenhagen, many-worlds, pilot waves, QBism, decoherence-plus-something — each resolves different parts of the measurement problem and leaves others. The module closes the branch by facing the seam directly.

---

### FIG.34 — Schrödinger's Cat and the Measurement Problem

**Hook.** Graz, 1935. Schrödinger writes to Einstein after reading EPR, concerned about the Copenhagen position. He constructs a thought experiment: a cat in a box with a radioactive atom, a Geiger counter, a vial of cyanide. If the atom decays, the cat dies. Until the box is opened, the cat is in a superposition of alive and dead. Schrödinger intended it as a reductio ad absurdum of the Copenhagen interpretation. It became an icon of it.

**Sections (7):**

1. **The cat** — micro-superposition (undecayed/decayed atom) amplified by a chain of mechanisms to a macroscopic superposition (living/dead cat). If unitary evolution always applies, so does this.
2. **The measurement problem, crisply** — two dynamics: smooth unitary (Schrödinger equation) between measurements and discontinuous collapse at measurement. When exactly does the second kick in? What is a measurement? No principled answer from the formalism.
3. **Wigner's friend** — Eugene Wigner, 1961. A friend inside a sealed lab observes a superposed system. To Wigner outside, both friend and system are in a superposition. Who collapses whose wavefunction?
4. **Delayed-choice experiments** — Wheeler 1978, Kim et al. 1999, Ma et al. 2012. Decide whether to measure a photon's "which-way" information after it has already passed the slits — and the earlier behaviour shifts accordingly. Retrocausality, or an artefact of the wave description?
5. **Bohr's deflection** — Copenhagen side-steps: "do not ask what the wavefunction is doing between measurements." Pragmatic, powerful, leaves the seam hidden.
6. **Everett's alternative, 1957** — take unitary evolution seriously for everything, including observers. No collapse; instead, branching. The cat is alive on some branches, dead on others; the observer splits. FIG.36.
7. **What's next** — survey the interpretations. FIG.35 for Copenhagen and its relatives; FIG.36 for many-worlds and decoherence.

**Scenes to build (2):**

| File | Purpose |
|---|---|
| `schrodinger-cat-scene.tsx` | The box. Press "wait" → superposition develops. "Open" → collapses (Copenhagen) or branches (many-worlds), based on toggle. |
| `wigner-friend-scene.tsx` | Two levels of observers; who collapses whose state. Side-by-side different interpretations' verdicts. |

**Physicists (aside):**
- Erwin Schrödinger *(exists)*
- Eugene Wigner *(NEW — Wigner's friend 1961; mathematical physics; Nobel 1963)*
- John Archibald Wheeler *(NEW — delayed-choice; coined "black hole," "wormhole," "it from bit"; Feynman's PhD adviser)*

**Glossary terms:**
- `schrodinger-cat` — concept
- `measurement-problem` — concept
- `wigners-friend` — concept
- `delayed-choice` — concept

**Reading minutes:** 11.

---

### FIG.35 — Copenhagen, QBism, and Pilot Waves

**Hook.** Three interpretations that keep the single world. Copenhagen says the wavefunction is not real — it is knowledge. QBism tightens this to personal Bayesian credence. Pilot-wave theory — de Broglie 1927, Bohm 1952 — restores realism and determinism at the price of explicit non-locality. Each one solves a different part of the puzzle.

**Sections (7):**

1. **Copenhagen** — Bohr and Heisenberg; classical measurement apparatus; wavefunction as predictive tool; no description of reality between measurements. Practical. Unsatisfying.
2. **QBism (Quantum Bayesianism)** — Fuchs, Mermin, Schack, 2000s. The wavefunction is a subjective Bayesian credence of the experimenter. Measurement is belief update. Personalist, operational.
3. **Pilot-wave / de Broglie-Bohm** — particles have definite positions and follow trajectories guided by the wavefunction. Reproduces all quantum predictions; requires explicit non-local interactions. Deterministic.
4. **Why pilot waves were sidelined** — 1927 Solvay, de Broglie presented; Pauli objected on a point de Broglie could not answer on the spot; de Broglie withdrew. Bohm revived it in 1952. Einstein wrote to Born: "not at all new, but too cheap."
5. **What they agree on** — predictions. Every standard quantum prediction matches. The interpretations differ in ontology, not observation.
6. **What they disagree on** — whether the wavefunction is real, whether randomness is fundamental, whether there is one world.
7. **What's next** — the interpretation that says there are many worlds, and the process that explains why we see only one. FIG.36.

**Scenes to build (2):**

| File | Purpose |
|---|---|
| `pilot-wave-double-slit-scene.tsx` | Particle has definite position; pilot wave goes through both slits and guides particle. Trajectories computed live; build interference pattern deterministically. |
| `interpretation-map-scene.tsx` | Axes: realism (x) vs determinism (y). Plot Copenhagen, QBism, pilot-wave, many-worlds, CSL/GRW at their coordinates. |

**Physicists (aside):**
- David Bohm *(NEW — pilot-wave revival 1952; McCarthy-era exile to Brazil then Britain; hidden-variables theorist)*
- Louis de Broglie *(exists)*
- Christopher Fuchs & N. David Mermin *(NEW — QBism; one entry together)*

**Glossary terms:**
- `copenhagen-interpretation` — concept
- `qbism` — concept
- `pilot-wave` — concept
- `bohmian-mechanics` — concept

**Reading minutes:** 10.

---

### FIG.36 — Many-Worlds and Decoherence

**Hook.** Princeton, 1957. Hugh Everett III submits a thesis arguing that the wavefunction never collapses — it branches. Every measurement outcome happens; the observer splits. His adviser Wheeler softens the language for the published version. The community ignores it for a decade. DeWitt revives it in 1970 as "many-worlds," and it is now, among working physicists who think about foundations at all, the plurality view. Decoherence, developed by Zurek and Joos from the 1970s onward, explains why we see only one branch.

**Sections (7):**

1. **The Everett move** — no collapse postulate. The Schrödinger equation is all there is. A measurement correlates the apparatus with the system; the composite is a superposition of (result_n, apparatus shows n, observer remembers n). Each term is a branch.
2. **Why it sounds crazy** — if every quantum event branches the world, there are unimaginably many copies of everything. Everett: "it is just what the theory says."
3. **Decoherence** — Zurek, Joos, Zeh, 1970s-80s. A quantum system interacting with its environment rapidly loses phase coherence in most bases. The "pointer basis" — the basis robust under environment coupling — is selected by the interaction.
4. **Decoherence ≠ collapse** — decoherence explains why we see classical behaviour and why branches become non-interfering; it does not explain why this branch was ours. Still requires an interpretive postulate (Born rule).
5. **Deriving Born's rule** — Gleason's theorem 1957; Deutsch-Wallace decision-theoretic derivation 2003; Zurek's envariance. Each derivation rests on assumptions that are themselves debatable.
6. **GRW and objective collapse** — Ghirardi, Rimini, Weber, 1986: modify the Schrödinger equation with spontaneous-localisation events. Testable; experiments so far compatible with standard QM, constraining the modification parameters tightly.
7. **What's still open** — the measurement problem in a form that satisfies everyone. The frontier of the field. Next branch: FIG.01 of § 06, which will leave QM alone and begin general relativity.

**Scenes to build (3):**

| File | Purpose |
|---|---|
| `many-worlds-branching-scene.tsx` | Tree diagram. Each measurement splits a branch. After 5 spin measurements: 32 branches. Weight of each branch ∝ Born probability. |
| `decoherence-scene.tsx` | Cat state (|↑⟩ + |↓⟩)/√2 coupled to N environment qubits. Off-diagonal elements of ρ decay as e^(−N×small). Pure → mixed in the pointer basis. |
| `grw-collapse-scene.tsx` | Wavefunction of a macroscopic object with spontaneous localisation events once every τ_GRW. Cat-state superpositions decohere in microseconds; single atoms unaffected. |

**Physicists (aside):**
- Hugh Everett III *(NEW — many-worlds 1957; left academia for defence work; died at 51)*
- Bryce DeWitt *(NEW — revived Everett as many-worlds 1970; quantum gravity; Wheeler-DeWitt equation)*
- Wojciech Zurek *(NEW — decoherence, einselection; Los Alamos)*
- H. Dieter Zeh *(NEW — founder of decoherence theory 1970; Heidelberg)*

**Glossary terms:**
- `many-worlds-interpretation` — concept
- `decoherence` — concept
- `einselection` — concept
- `pointer-basis` — concept
- `grw-theory` — concept

**Reading minutes:** 13.

---

## Execution order

The modules are mostly linear; within a module, topics are nearly linear. The recommended global sequence:

1. **Module 1 first.** FIG.01–FIG.04 in order. Planck, photoelectric, Compton, Bohr — this is the historical spine and the easiest on-ramp.
2. **Module 2 in order.** De Broglie, Davisson-Germer, double slit. FIG.07 (double slit) is the most visually arresting — ship it near the end of the duality module to hook readers into the formalism that follows.
3. **Module 3 before Module 4.** The wavefunction, Schrödinger equation, bra-ket, and measurement postulate are prerequisites for every canonical problem.
4. **Module 4 in any order after Module 3.** FIG.12 (infinite well) first because it's the simplest; FIG.14 (oscillator) next because ladder operators pay off everywhere; FIG.13 (finite well, tunnelling) can come before or after the oscillator.
5. **Module 5 reads short.** Three tight topics. Do after Module 4 because the canonical problems have motivated the general machinery.
6. **Module 6 is the branch's triumph.** Hydrogen. Do only after Modules 3, 4, 5 are live.
7. **Module 7 before Module 8.** Spin must precede identical-particle arguments.
8. **Modules 8, 9, 10 in order.** Statistics, then entanglement, then interpretations. Interpretations is the intellectual capstone; it explicitly references every previous module.

Hot-path priority for the first release: Module 1 complete, FIG.07 (double slit), FIG.09 (Schrödinger equation), FIG.12 (infinite well), FIG.19 (uncertainty), FIG.20–FIG.21 (hydrogen). These eight topics carry the pedagogical weight of the branch; the rest deepen and broaden.

## Patterns to reuse

- **Scene skeleton:** copy from `damped-pendulum-scene.tsx` or `kinematics-graph-scene.tsx` in `components/physics/`. Canvas + `useAnimationFrame` + `useThemeColors`; ResizeObserver; cyan accent `#5BE9FF`; complex-phase colouring for wavefunctions uses HSL where H = arg(ψ), S = 1, L = 0.5 × |ψ|/|ψ|_max.
- **Physics modules:** one pure-TS module per topic in `lib/physics/`. Examples: `lib/physics/blackbody.ts` (Planck formula + Rayleigh-Jeans + Wien), `lib/physics/schrodinger.ts` (Crank-Nicolson 1-D integrator), `lib/physics/hydrogen.ts` (radial/angular wavefunctions), `lib/physics/bell.ts` (CHSH evaluator). No React imports in these files; pure functions only.
- **Wavefunction evolution:** use Crank-Nicolson scheme for time-dependent 1-D Schrödinger — unitarity preserved to machine precision. Pre-tested in `lib/physics/schrodinger.ts` and reusable across FIG.09, FIG.13, FIG.14.
- **3-D orbital rendering:** marching-cubes isosurface of |ψ|² at a chosen probability density; or Monte Carlo point cloud. Reuse `components/physics/orbital-renderer.tsx` once built.
- **Physicist adds:** manually edit `lib/content/physicists.ts` + `messages/en/physicists.json` (no MCP tool for this — documented gap in `docs/mcp-gaps.md`). All locales (en, he, ru) must stay in sync.
- **Glossary adds:** direct edits to `lib/content/glossary.ts` + `messages/en/glossary.json` + `messages/he/glossary.json` + `messages/ru/glossary.json`. Four files; no MCP dependency.
- **Topic status flip:** direct edit to `lib/content/branches.ts` — change `status: "live"` and `readingMinutes: N` on the relevant entry.
- **Locale content:** copy English MDX, translate prose section-by-section, update `messages/<locale>/home.json` chrome, wire `<Locale>Content` into `page.tsx`. Target locale set: en, he, ru.
- **Hook conventions:** every hook anchored to a specific place, date, and person. No "imagine if" openings; always a real moment from the historical record.
- **Section count:** seven sections per topic, plus one "what's next" closer that points to the following FIG. This is invariant across all branches.

## Definition of done per topic

- [ ] `content.en.mdx` replaces skeleton with a full seven-section essay plus hook and "what's next."
- [ ] All scenes in the topic's table exist, are registered in `components/physics/visualization-registry.tsx`, and render without runtime error in dev.
- [ ] Pure-TS physics module exists at `lib/physics/<topic>.ts` with unit tests at `lib/physics/__tests__/<topic>.test.ts` (if the topic has any nontrivial computation).
- [ ] New physicists entered in `lib/content/physicists.ts` and every locale's `messages/<locale>/physicists.json`. Cross-links from the MDX.
- [ ] New glossary terms entered in `lib/content/glossary.ts` and every locale's `messages/<locale>/glossary.json`. Cross-links from the MDX.
- [ ] `status: "live"` and correct `readingMinutes` set in `lib/content/branches.ts`.
- [ ] Home-page chrome updated in every locale's `messages/<locale>/home.json`.
- [ ] `npx tsc --noEmit` passes with no new errors.
- [ ] Manual smoke test in `bun dev` at `/en/quantum/<slug>`, `/he/quantum/<slug>`, `/ru/quantum/<slug>`.
- [ ] All three locales' MDX files exist and are complete.
- [ ] Formulas rendered through KaTeX with consistent notation (ℏ, not h/2π; bra-ket consistently; SI units preferred; natural units called out when used).
- [ ] Every scene is touch-friendly on iOS Safari and works without keyboard on mobile.
- [ ] Accessibility: all scenes have a text-only alternative summary in the MDX; colour is never the sole information channel.

---

FIG numbering summary for the branch:

| FIG | Topic | Module | Reading min |
|---|---|---|---|
| FIG.01 | Black-body Catastrophe | 1 | 11 |
| FIG.02 | Photoelectric Effect | 1 | 10 |
| FIG.03 | Compton Scattering | 1 | 9 |
| FIG.04 | Bohr Atom | 1 | 12 |
| FIG.05 | De Broglie Matter Waves | 2 | 9 |
| FIG.06 | Davisson-Germer | 2 | 10 |
| FIG.07 | Double Slit | 2 | 11 |
| FIG.08 | Wavefunction | 3 | 10 |
| FIG.09 | Schrödinger Equation | 3 | 12 |
| FIG.10 | Bra-Ket and Hilbert Space | 3 | 11 |
| FIG.11 | Measurement and Collapse | 3 | 11 |
| FIG.12 | Infinite Square Well | 4 | 9 |
| FIG.13 | Finite Well and Tunnelling | 4 | 12 |
| FIG.14 | Harmonic Oscillator | 4 | 11 |
| FIG.15 | Ladder Operators | 4 | 10 |
| FIG.16 | Scattering and WKB | 4 | 10 |
| FIG.17 | Hermitian Operators | 5 | 10 |
| FIG.18 | Commutators | 5 | 9 |
| FIG.19 | Uncertainty Principle | 5 | 11 |
| FIG.20 | Separation in Spherical Coordinates | 6 | 10 |
| FIG.21 | Radial Equation and Energy Levels | 6 | 12 |
| FIG.22 | Fine Structure | 6 | 11 |
| FIG.23 | Stern-Gerlach | 7 | 11 |
| FIG.24 | Pauli Matrices and Spinors | 7 | 10 |
| FIG.25 | Addition of Angular Momentum | 7 | 10 |
| FIG.26 | Pauli Exclusion | 7 | 12 |
| FIG.27 | Helium Atom | 8 | 11 |
| FIG.28 | Slater Determinants and Hartree-Fock | 8 | 10 |
| FIG.29 | Quantum Statistics | 8 | 11 |
| FIG.30 | EPR | 9 | 11 |
| FIG.31 | Bell's Inequality | 9 | 11 |
| FIG.32 | Bell Experiments | 9 | 11 |
| FIG.33 | Quantum Teleportation | 9 | 10 |
| FIG.34 | Schrödinger's Cat | 10 | 11 |
| FIG.35 | Copenhagen, QBism, Pilot Waves | 10 | 10 |
| FIG.36 | Many-Worlds and Decoherence | 10 | 13 |

Total: 36 topics, 383 reading minutes, 10 modules. New physicists introduced in this branch: Planck, Kirchhoff, Wien, Hertz, Lenard, Millikan, Compton, Debye, Bohr, Rutherford, Rydberg, Balmer, de Broglie, Langevin, Davisson, Germer, G.P. Thomson, W.H. Bragg, W.L. Bragg, Feynman, Young, Jönsson, Tonomura, Schrödinger, Born, Heisenberg, Dirac, Hilbert, von Neumann, Sommerfeld, Gamow, Binnig, Rohrer, Hermite, Ehrenfest, Jordan, Wentzel, Kramers, Brillouin, Geiger, Nuttall, Weyl, Laplace, Legendre, Pauli, Laguerre, Lamb, Bethe, Stern, Gerlach, Uhlenbeck, Goudsmit, Bloch, Clebsch, Gordan, Zeeman, Fierz, Hund, Hylleraas, Hartree, Slater, Fock, Kohn, Bose, Fermi, Cornell, Wieman, Ketterle, Podolsky, Rosen, Bell, Clauser, Horne, Shimony, Holt, Aspect, Zeilinger, Hensen, Shalm, Giustina, Bennett, Wootters, Brassard, Wigner, Wheeler, Bohm, Fuchs, Mermin, Everett, DeWitt, Zurek, Zeh. Einstein is referenced throughout but not new.

FIG.01 ships first. The branch is large; ship by module, not by topic-count milestones.
