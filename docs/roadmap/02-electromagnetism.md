# § 02 · Electromagnetism — curriculum roadmap

Maxwell's four equations — the most important four lines in physics — unify electricity, magnetism, and light into a single field theory. Every radio, screen, wire, and star depends on them. This branch moves from Franklin's kite to Hertz's spark gap: static charges, steady currents, the discovery that a moving magnet makes a current, and finally the realisation that light itself is a disturbance in the same electromagnetic field that runs your doorbell.

---

## Module map

1. **Electrostatics** — charge at rest. Coulomb, Gauss, potential, capacitors, dielectrics.
2. **Current & DC Circuits** — charge in steady motion. Ohm, Kirchhoff, RC transients, power.
3. **Magnetostatics** — steady currents make steady fields. Lorentz, Biot-Savart, Ampère, materials.
4. **Electromagnetic Induction** — changing fields make currents. Faraday, Lenz, inductors, transformers.
5. **AC Circuits & Resonance** — sinusoids, phasors, impedance, the RLC resonator, power factor.
6. **Maxwell's Equations** — the synthesis. Displacement current, the four equations in full form, gauge freedom.
7. **Electromagnetic Waves** — the wave equation falls out of Maxwell. Polarization, Poynting vector, radiation.
8. **Optics** — geometric (reflection, refraction, lenses) and wave (interference, diffraction, polarization).

---

## Module 1 · Electrostatics

### FIG.01 — Charge and Coulomb's Law

**Hook.** Philadelphia, June 1752. Benjamin Franklin flies a kite in a thunderstorm and draws sparks from a brass key — one of the most reckless experiments that ever paid off. Twenty-three years later, Charles-Augustin de Coulomb hangs two pith balls from a torsion fibre in Paris and measures the force between them. Electricity becomes a number.

**Sections (7):**

1. **Two kinds of charge** — rub amber with wool and it attracts paper; rub glass with silk and it attracts the same paper but repels the amber. Franklin names them "positive" and "negative" and guesses (correctly) that charge is conserved — a conservation law written a century before Noether could explain why.
2. **The torsion balance** — Coulomb's 1785 instrument. A charged ball on a fine wire, a second charge brought near, the twist of the wire measures the force. Same geometry Cavendish would use for gravity a decade later.
3. **The inverse-square law** — F = k·q₁·q₂/r². The force falls like gravity but is 10³⁹ times stronger between two electrons. Why doesn't the universe tear itself apart? Because charge comes in both signs and cancels; mass only adds.
4. **Superposition** — the field from many charges is the sum of the fields from each. Linearity is the quiet assumption that makes all of electrostatics tractable.
5. **Quantisation and the electron** — Millikan's oil-drop experiment, 1909. Charge comes in units of e = 1.6×10⁻¹⁹ C. You cannot have half an electron's worth.
6. **The Coulomb constant and units** — SI vs Gaussian. Where the 1/(4πε₀) comes from. Why SI hides the geometry and Gaussian exposes it.
7. **Forward** — the force is awkward to track for distributed charge. Next section replaces "force between pairs" with "field everywhere" → FIG.02.

**Scenes to build (3):**

| File | Purpose |
|---|---|
| `coulomb-balance-scene.tsx` | Two charges on a canvas, drag to move. Force vectors drawn on each, magnitude readout. Sign toggles per charge (attract / repel). |
| `pith-ball-scene.tsx` | Two suspended balls on strings. Charge slider on each. Balls swing apart until electrostatic force balances gravity along the string. Angle readout. |
| `superposition-scene.tsx` | Place up to five point charges on a grid. Field at the cursor shown as an arrow; total from superposition of each contribution, with per-source arrows faded behind. |

**Physicists (aside):**
- Benjamin Franklin *(NEW — kite, lightning rod, named positive/negative, one-fluid theory of electricity)*
- Charles-Augustin de Coulomb *(NEW — torsion balance, inverse-square law for charge, 1785)*
- Robert Millikan *(NEW — oil-drop experiment 1909, measured the elementary charge)*
- Henry Cavendish *(NEW — independently discovered Coulomb's law c. 1773 but didn't publish; Maxwell rescued the notebooks a century later)*

**Glossary terms:**
- `electric-charge` — concept
- `coulombs-law` — concept
- `elementary-charge` — concept (quantity)
- `pith-ball` — instrument
- `torsion-balance` — instrument
- `superposition-principle` — concept

**Reading minutes:** 11.

---

### FIG.02 — The Electric Field

**Hook.** Michael Faraday, bookbinder's apprentice turned Royal Institution director, couldn't do the mathematics of action-at-a-distance. Instead he drew — literally drew — lines of force through space, filling the room between the charges. Maxwell would later admit this picture was the seed of field theory.

**Sections (7):**

1. **From force to field** — divide force by the test charge and you get a quantity defined at every point in space. E = F/q. The field exists whether or not a test charge is there to feel it.
2. **Field lines** — Faraday's drawing. Density = strength, direction = force on positive charge. They start on positive, end on negative, never cross. A visual grammar.
3. **Fields of simple sources** — point charge (radial), dipole (the lobed pattern), infinite line (cylindrical), infinite plane (uniform). Four shapes that cover most real problems.
4. **Dipoles** — two opposite charges a short distance apart. The dipole moment p = q·d. Why water's bent molecule makes it such a good solvent.
5. **The field as something real** — Faraday suspected it. Maxwell proved it must carry energy and momentum. The field is not a bookkeeping trick; it's a physical thing with its own existence.
6. **Motion in a field** — a charge released in a uniform E accelerates uniformly: the cathode-ray tube, the mass spectrometer, the particle accelerator. All are applied E-fields.
7. **Forward** — how to compute the field without summing infinitely many point contributions → Gauss's law, FIG.03.

**Scenes to build (3):**

| File | Purpose |
|---|---|
| `field-lines-scene.tsx` | Place + and − charges; field lines drawn by streamline integration. Dipole, quadrupole patterns pre-loaded as presets. |
| `dipole-scene.tsx` | A single dipole in a uniform external field. Torque aligns it. Rotation slider shows restoring moment, analogous to a compass needle. |
| `cathode-ray-scene.tsx` | Parallel deflection plates, electron beam entering horizontally. Plate-voltage slider deflects the beam parabolically — exactly the projectile problem with E replacing g. |

**Physicists (aside):**
- Michael Faraday *(NEW — lines of force, electromagnetic induction, self-taught experimentalist, director of the Royal Institution, Christmas Lectures)*
- James Clerk Maxwell *(NEW — formalised Faraday's intuition into field equations; more in FIG.19)*

**Glossary terms:**
- `electric-field` — concept
- `field-line` — concept
- `electric-dipole` — concept
- `dipole-moment` — concept (quantity)
- `test-charge` — concept

**Reading minutes:** 10.

---

### FIG.03 — Gauss's Law

**Hook.** Carl Friedrich Gauss, Göttingen, 1813. The prince of mathematicians writes down a theorem so elegant that the awkward sums of Coulomb's law dissolve into a single integral over a closed surface. The trick: charge inside determines the flux out, and nothing else does.

**Sections (7):**

1. **Flux, defined** — how much field pierces a surface. Scalar quantity. The water-through-a-net analogy; then the precise integral ∮ E · dA.
2. **The statement** — ∮ E · dA = Q_enclosed / ε₀. The flux through any closed surface equals the enclosed charge, divided by the permittivity of free space. Geometry independent.
3. **Why it's true** — solid-angle argument. A point charge subtends 4π steradians from anywhere inside; its flux through any enclosing surface is the same. Linearity finishes the proof.
4. **When it's useful** — symmetric problems only. Spherical symmetry (point charge, uniform ball), cylindrical (infinite wire), planar (infinite sheet). Three shapes. Pick your Gaussian surface to exploit the symmetry.
5. **Worked examples** — field inside and outside a uniformly charged sphere (inside: ∝ r; outside: 1/r²). Field between parallel plates (uniform, σ/ε₀). Field from an infinite wire (1/r).
6. **Conductors in equilibrium** — no field inside a conductor (else charges would move). Charge sits on the surface. The Faraday cage. Why your phone loses signal in an elevator.
7. **Forward** — flux is one of Maxwell's four equations in disguise. We'll meet it again in FIG.19.

**Scenes to build (2):**

| File | Purpose |
|---|---|
| `gauss-sphere-scene.tsx` | A point charge at the centre of a resizable sphere. Flux readout is invariant as the sphere grows. Drag the charge off-centre — flux still the same as long as charge is inside. Drag it out — flux drops to zero. |
| `faraday-cage-scene.tsx` | A hollow conductor with a charge placed outside. Field lines shown; interior of cage shows zero field. Toggle "charge inside" — now exterior field is zero, interior radial. |

**Physicists (aside):**
- Carl Friedrich Gauss *(NEW — Gauss's law, the Gaussian distribution, non-Euclidean geometry, the heliotrope, the "prince of mathematicians")*
- Michael Faraday *(exists — the cage is his)*

**Glossary terms:**
- `electric-flux` — concept
- `gausss-law` — concept
- `permittivity-of-free-space` — concept (constant)
- `gaussian-surface` — concept
- `faraday-cage` — instrument
- `conductor` — concept

**Reading minutes:** 12.

---

### FIG.04 — Electric Potential and Voltage

**Hook.** Volta, Pavia, 1800. He stacks disks of zinc and copper separated by brine-soaked cloth and builds the first battery — the voltaic pile. For the first time in human history, a steady flow of charge is available on demand. The word "voltage" exists because of him.

**Sections (7):**

1. **Work to move a charge** — push a test charge against the field, you do work on it. That work is stored as potential energy. U = q·V.
2. **Potential, defined** — V = U/q, joules per coulomb = volts. Like temperature for heat, potential is the field's intensive cousin of energy.
3. **Potential from a point charge** — V = kq/r. From superposition, the potential of any configuration is a scalar sum. Much easier than summing vector fields.
4. **Equipotential surfaces** — surfaces of constant V. Perpendicular to field lines always. A conductor's surface is an equipotential.
5. **E from V** — E = −∇V. The field is the negative gradient of the potential. The steeper the potential hill, the stronger the field rolling charges down it.
6. **Voltage in practice** — 1.5 V in an AA cell, 230 V at a German wall socket, 400 kV on a high-voltage line, 10⁹ V in a lightning strike. Why only the potential *difference* matters.
7. **Forward** — store energy in a field by pulling charges apart and holding them → the capacitor, FIG.05.

**Scenes to build (2):**

| File | Purpose |
|---|---|
| `equipotential-scene.tsx` | Point charges placed on a canvas. Field lines in one colour, equipotentials (contour lines of V) in another. They are always orthogonal. |
| `potential-landscape-scene.tsx` | 3D surface plot of V(x,y) for a configuration of charges. A "ball" released rolls along −∇V, tracing a field line on the floor. |

**Physicists (aside):**
- Alessandro Volta *(NEW — voltaic pile 1800, the first battery, after whom the volt is named)*
- Luigi Galvani *(NEW — frog-leg experiments, thought the twitch was "animal electricity"; Volta disagreed and built the pile to prove it was metals, not biology)*

**Glossary terms:**
- `electric-potential` — concept
- `voltage` — concept
- `volt` — unit
- `equipotential` — concept
- `voltaic-pile` — instrument

**Reading minutes:** 10.

---

### FIG.05 — Capacitance and Dielectrics

**Hook.** Leiden, 1745. Pieter van Musschenbroek fills a glass jar with water, runs a brass rod into it, and connects the rod to an electrostatic generator. He touches the jar and nearly kills himself. The Leyden jar is the first capacitor — the first device that can *store* electrical energy.

**Sections (7):**

1. **Two plates, one field** — parallel plates, equal and opposite charge. Field is uniform between them, zero outside. A capacitor in its simplest form.
2. **Capacitance, defined** — C = Q/V. How much charge a device holds per volt applied. Units: farad. One farad is enormous; practical values are pF to mF.
3. **Geometric formulas** — parallel plate C = ε₀A/d. Spherical and cylindrical variants. C depends only on geometry and the material between the plates.
4. **Energy stored** — U = ½CV² = ½QV = Q²/(2C). The energy lives *in the field* between the plates, not on the plates. Density u = ½ε₀E².
5. **Dielectrics** — stuff a slab of glass or oil between the plates. The molecules polarise, reducing the effective field, increasing the capacitance by a factor κ (the relative permittivity). Why every real capacitor has a dielectric.
6. **Breakdown** — too strong a field rips electrons out of atoms. Air breaks down at ~3 MV/m. Lightning is the atmosphere's capacitor discharging.
7. **Forward** — connect the capacitor to a resistor and it empties at a characteristic rate → RC circuit, Module 2.

**Scenes to build (2):**

| File | Purpose |
|---|---|
| `parallel-plate-scene.tsx` | Two plates with adjustable separation and area. Voltage slider. Field lines drawn between, readouts for C, Q, U. Dielectric slab can be slid in and out — capacitance jumps by κ. |
| `leyden-jar-scene.tsx` | Historical re-creation: a glass jar, foil lining, charge slider. Show the field between the foils, show the discharge arc when a conductor bridges the terminals. |

**Physicists (aside):**
- Pieter van Musschenbroek *(NEW — Leyden jar 1745, first capacitor)*
- Ewald Jürgen von Kleist *(NEW — independently built a Leyden jar a year earlier; history gave the credit to Leiden)*
- Michael Faraday *(exists — studied dielectrics systematically; the farad is named for him)*

**Glossary terms:**
- `capacitance` — concept
- `capacitor` — instrument
- `farad` — unit
- `dielectric` — concept
- `permittivity` — concept
- `dielectric-breakdown` — phenomenon
- `leyden-jar` — instrument

**Reading minutes:** 11.

---

## Module 2 · Current & DC Circuits

### FIG.06 — Electric Current

**Hook.** Once Volta's pile exists, charge can flow for minutes instead of microseconds. Within a decade, chemists are electrolysing water and depositing metals. Electricity becomes an industrial quantity — and needs a unit. The ampere, named for André-Marie Ampère, is defined by what current *does*, not what it is.

**Sections (7):**

1. **Charge in motion** — current is the rate of charge flow, I = dQ/dt. Units: amperes = coulombs per second. One amp is 6.24×10¹⁸ electrons per second past a cross-section.
2. **Conventional vs actual direction** — Franklin guessed wrong; positive current flows the way positive charges would, but in metals it's electrons going the other way. Everyone still uses Franklin's convention. Harmless legacy.
3. **Current density** — J = I/A, amperes per square metre. The microscopic picture: J = nqv_d, where v_d is the drift velocity.
4. **Drift velocity is tiny** — in a copper wire carrying household current, electrons drift at millimetres per second. The signal travels near c because the field propagates, not the electrons.
5. **Conservation of charge in circuits** — what goes in must come out. Kirchhoff's junction rule (FIG.09) in embryo.
6. **Sources of EMF** — batteries, generators, solar cells, thermocouples. EMF (electromotive force) is a misnomer — it's work per unit charge, measured in volts. Anything that separates charge can drive a circuit.
7. **Forward** — relate current to the voltage driving it → Ohm's law, FIG.07.

**Scenes to build (2):**

| File | Purpose |
|---|---|
| `drift-velocity-scene.tsx` | A wire cross-section with thousands of electrons doing thermal random-walk + a slow drift velocity. Toggle field on/off — random motion persists, drift appears. Readouts: v_rms vs v_d. |
| `current-junction-scene.tsx` | A node with three wires. Currents in / out; user sets two, the third is forced by conservation. Visual violation glows red. |

**Physicists (aside):**
- André-Marie Ampère *(NEW — "the Newton of electricity", unit named for him; full biography in FIG.14)*
- Alessandro Volta *(exists)*
- Benjamin Franklin *(exists — the sign-convention mistake is his)*

**Glossary terms:**
- `electric-current` — concept
- `ampere` — unit
- `current-density` — concept
- `drift-velocity` — concept
- `emf` — concept
- `conventional-current` — concept

**Reading minutes:** 9.

---

### FIG.07 — Ohm's Law and Resistance

**Hook.** Georg Ohm, teaching high-school physics in Cologne in 1827, measures voltage and current in wires of different lengths and diameters. He finds a proportionality so clean that he publishes it as a book. The German education ministry dismisses him as a crank. Twenty years later he is the most cited physicist in electrical engineering.

**Sections (7):**

1. **Ohm's observation** — V = IR. For many materials at fixed temperature, current is proportional to applied voltage. The constant of proportionality is the resistance.
2. **Resistance is a material property mediated by geometry** — R = ρL/A, where ρ is resistivity (Ω·m). Long thin wires resist more than short fat ones.
3. **Conductivity and its microscopic origin** — Drude's model (1900). Electrons scatter off lattice vibrations and impurities; mean free time τ gives σ = ne²τ/m. Crude but gets the order of magnitude.
4. **Ohmic vs non-ohmic** — metals are beautifully linear. Diodes, transistors, ionised gases, filament bulbs at high current — all non-ohmic. "V = IR" is a special case, not a law of nature.
5. **Temperature dependence** — metals get more resistive when hot (phonons scatter electrons); semiconductors get less (more carriers thermally promoted). Superconductors: ρ = 0 below T_c (Kamerlingh Onnes, 1911).
6. **Joule heating** — P = IV = I²R = V²/R. The power dissipated as heat. Toasters, incandescent bulbs, and the entire thermal headache of CPU design.
7. **Forward** — combine resistors and sources into circuits → Kirchhoff, FIG.09.

**Scenes to build (2):**

| File | Purpose |
|---|---|
| `ohms-law-scene.tsx` | Voltage slider, resistance slider. Current follows instantly. I-V plot accumulates points as you sweep V. Toggle "ohmic" off to see a diode-like nonlinear curve. |
| `resistivity-scene.tsx` | A wire with length and diameter sliders. R updates live. Material dropdown (Cu, Al, W, Fe, graphite, Si, glass) spans 20 orders of magnitude. |

**Physicists (aside):**
- Georg Ohm *(NEW — V = IR, 1827, dismissed by the German academy before Europe noticed)*
- Paul Drude *(NEW — free-electron model of metals, 1900; wrong in detail but right in shape)*
- Heike Kamerlingh Onnes *(NEW — liquefied helium 1908, discovered superconductivity in mercury 1911)*

**Glossary terms:**
- `resistance` — concept
- `ohm` — unit
- `resistivity` — concept
- `conductivity` — concept
- `ohms-law` — concept
- `joule-heating` — phenomenon
- `superconductor` — concept

**Reading minutes:** 11.

---

### FIG.08 — Resistors in Series and Parallel

**Hook.** Before integrated circuits, engineers designed with discrete resistors — colour-banded cylinders soldered onto breadboards. Knowing how to combine them in your head was as fundamental as arithmetic. Two rules cover every case.

**Sections (7):**

1. **Series: same current, voltages add** — resistors in a chain carry the same I. Their voltages add, so R_eq = R₁ + R₂ + … Each resistor "costs" V_i.
2. **Parallel: same voltage, currents add** — resistors across the same two nodes share V. Currents add, so 1/R_eq = 1/R₁ + 1/R₂ + … The total resistance is *less* than any single one.
3. **Mental shortcut: two identical parallel resistors** — R_eq = R/2. Ten identical in parallel? R/10. The pattern is worth memorising.
4. **The voltage divider** — two series resistors split V in proportion to their resistances. V_out = V·R₂/(R₁+R₂). Used in every potentiometer, every volume knob.
5. **The current divider** — two parallel resistors split I inversely to their resistances. Big resistor gets little current.
6. **Equivalent resistance of networks** — reduce piece by piece, series-then-parallel-then-series. Pathological "Wheatstone bridge" topologies don't reduce this way — Kirchhoff's laws handle them (FIG.09).
7. **Forward** — resistors plus capacitors = time dependence → RC circuit, FIG.10.

**Scenes to build (2):**

| File | Purpose |
|---|---|
| `resistor-network-scene.tsx` | Drag-and-drop resistors into series or parallel configurations. Live R_eq readout, voltage and current on each component from the source. |
| `voltage-divider-scene.tsx` | Two resistors between V and ground. Slider on R₂/R₁. V_out traces a curve as the ratio changes. Highlights why audio potentiometers are usually logarithmic. |

**Physicists (aside):**
- Georg Ohm *(exists)*
- Charles Wheatstone *(NEW — Wheatstone bridge, measures unknown resistance to 4-digit precision with nothing but four resistors and a galvanometer; also the English telegraph)*

**Glossary terms:**
- `series-circuit` — concept
- `parallel-circuit` — concept
- `voltage-divider` — concept
- `current-divider` — concept
- `wheatstone-bridge` — instrument

**Reading minutes:** 8.

---

### FIG.09 — Kirchhoff's Laws

**Hook.** Gustav Kirchhoff, 22 years old, a student in Königsberg in 1845. He writes down two rules that turn any electrical network, however tangled, into a linear algebra problem. Every SPICE simulator in every modern chip design tool still solves Kirchhoff's equations.

**Sections (7):**

1. **The junction rule (KCL)** — charge in = charge out at every node. A restatement of charge conservation. Σ I_in = Σ I_out.
2. **The loop rule (KVL)** — around any closed loop, ΣV = 0. A restatement of energy conservation. The potential at a point is single-valued; go around and return, you must end at the same value.
3. **Signs and conventions** — pick a loop direction, pick current directions (guess — sign will correct itself). EMF rises when you cross a battery low-to-high, drops otherwise; R drops in the direction of current.
4. **Worked example: two loops, two EMFs, three resistors** — the classic exam problem. Two equations, two unknowns. A linear system.
5. **Matrix form** — modern way. Write KCL and KVL as a single matrix equation. Solve by Gaussian elimination. SPICE does this for a million nodes.
6. **Galvanometers and ammeters** — how to measure current without disturbing it. A proper ammeter has near-zero resistance; a voltmeter has near-infinite. Why you can fry a meter by misusing the probes.
7. **Forward** — add a capacitor and KVL becomes a differential equation → FIG.10.

**Scenes to build (2):**

| File | Purpose |
|---|---|
| `kirchhoff-loop-scene.tsx` | Two-loop circuit with two batteries and three resistors. Sliders for each. Live solution of the 2×2 system; current arrows flip sign when sliders cross zero. |
| `multimeter-scene.tsx` | Circuit with a virtual multimeter; probe placement demonstrates voltmeter (in parallel) vs ammeter (in series). Misuse shows a puff of smoke. |

**Physicists (aside):**
- Gustav Kirchhoff *(NEW — circuit laws 1845, black-body radiation law 1860, spectroscopy with Bunsen, theory of heat radiation)*
- Hermann von Helmholtz *(NEW — generalised KVL into the conservation of energy, 1847; returns in thermodynamics branch)*

**Glossary terms:**
- `kirchhoffs-current-law` — concept
- `kirchhoffs-voltage-law` — concept
- `node` — concept
- `loop` — concept
- `galvanometer` — instrument
- `ammeter` — instrument
- `voltmeter` — instrument

**Reading minutes:** 11.

---

### FIG.10 — RC Circuits and Transients

**Hook.** Close the switch on a capacitor through a resistor. Current doesn't jump to its final value — it decays exponentially, with a time constant τ = RC. This simple arrangement is the differentiator, the integrator, the low-pass filter, the debouncer, and every camera-flash charge circuit ever built.

**Sections (7):**

1. **The charging circuit** — battery, resistor, capacitor, switch. Close the switch; V_C rises toward ε, asymptotic approach.
2. **The differential equation** — ε = IR + Q/C, with I = dQ/dt. A first-order linear ODE. Solution: Q(t) = Cε(1 − e^(−t/τ)).
3. **The time constant τ = RC** — the characteristic decay time. After τ the capacitor is 63% charged; after 5τ it's essentially done.
4. **Discharging** — remove the battery, close a loop through R. Q(t) = Q₀·e^(−t/τ). Same τ, opposite direction.
5. **Energy accounting** — during charging, half the battery's energy dissipates in R regardless of how small R is. The classic paradox: you cannot charge a capacitor losslessly from a voltage source. Why switching power supplies exist.
6. **Applications** — camera flash capacitor, pacemaker timing, windshield-wiper intervals, analogue filters, the RC debounce on every mechanical switch.
7. **Forward** — replace the capacitor with an inductor and you get the LR circuit (FIG.16); put both in and you get an oscillator → LC, FIG.17.

**Scenes to build (2):**

| File | Purpose |
|---|---|
| `rc-charge-scene.tsx` | Battery-switch-R-C loop. Press switch. V_C(t) trace appears in real time, converging to ε. R and C sliders change τ. |
| `rc-discharge-scene.tsx` | Pre-charged capacitor discharging through R. Live V(t) on a log-y axis shows the exponential as a straight line. |

**Physicists (aside):**
- Hermann von Helmholtz *(exists — the energy accounting for the RC paradox is his)*
- Oliver Heaviside *(NEW — transformed circuit analysis into operational calculus, 1880s; also gave Maxwell's equations their modern 4-line form; full credit in FIG.19)*

**Glossary terms:**
- `rc-circuit` — concept
- `time-constant` — concept
- `transient` — phenomenon
- `exponential-decay` — concept

**Reading minutes:** 10.

---

## Module 3 · Magnetostatics

### FIG.11 — The Magnetic Field

**Hook.** Copenhagen, April 1820. Hans Christian Ørsted is demonstrating a current-carrying wire to a lecture hall. He notices — by accident, mid-demonstration — that a nearby compass needle deflects. Electricity and magnetism, which everyone had taken for separate phenomena, are secretly the same thing. The whole of § 02 follows from that twitch of a needle.

**Sections (7):**

1. **Magnets before Ørsted** — lodestones, compass needles, William Gilbert's 1600 book *De Magnete* establishing that the Earth is itself a magnet. North and south poles. Dipoles only — no magnetic monopoles, ever.
2. **Ørsted's 1820 experiment** — current makes a field. A horizontal wire with current flowing east-west deflects a compass needle into a circle around the wire. The right-hand rule is born.
3. **The field B, defined** — a vector field just like E, but sourced by currents. Units: tesla (huge) or gauss (1 T = 10⁴ G). Earth's field is ~50 μT; an MRI is 1–3 T; a neutron star is 10⁸ T.
4. **Field lines of a magnet** — bar magnet's loops from N to S outside, S to N inside. Iron filings make them visible. *Always* closed loops — ∇·B = 0 everywhere.
5. **Symmetries** — cylindrical (long wire), dipole (small loop, bar magnet), solenoidal (long coil). Same three shapes we used for E, re-expressed for B.
6. **Why no magnetic monopoles** — we've looked hard. Dirac showed a monopole would quantise charge. None has ever been found. ∇·B = 0 is one of Maxwell's four.
7. **Forward** — how does B push on a moving charge? → Lorentz force, FIG.12.

**Scenes to build (2):**

| File | Purpose |
|---|---|
| `oersted-scene.tsx` | Horizontal wire above a compass needle. Current slider (± A). Needle rotates into the field direction; right-hand rule overlay shows palm + thumb. |
| `b-field-lines-scene.tsx` | Bar magnet with iron-filing pattern. Drag to rotate. Toggle between bar, two-magnet, solenoid presets. Field lines close on themselves always. |

**Physicists (aside):**
- Hans Christian Ørsted *(NEW — April 1820 discovery that currents produce magnetic fields; linked electricity and magnetism for the first time)*
- William Gilbert *(NEW — De Magnete, 1600; established that Earth is a magnet, coined "electricity")*
- Pierre-Simon Laplace *(NEW — analysed Ørsted's experiment mathematically within weeks, co-founded what became Biot-Savart)*

**Glossary terms:**
- `magnetic-field` — concept
- `tesla` — unit
- `gauss` — unit
- `magnetic-dipole` — concept
- `monopole` — concept
- `right-hand-rule` — concept

**Reading minutes:** 11.

---

### FIG.12 — The Lorentz Force

**Hook.** Hendrik Lorentz, Leiden, 1892. He writes down a single equation — F = qE + qv × B — that tells you the force on any charged particle in any electromagnetic field. It is the bridge between the field equations and Newtonian mechanics. Every cyclotron, mass spectrometer, and cathode-ray tube obeys it.

**Sections (7):**

1. **The equation** — F = q(E + v × B). Electric part accelerates along E. Magnetic part pushes sideways to both v and B.
2. **The magnetic part does no work** — F ⊥ v always, so F·v = 0. Magnetic forces change direction only, never kinetic energy. Eerie but fundamental.
3. **Circular motion in a uniform B** — a charged particle perpendicular to B spirals at radius r = mv/(qB), frequency ω = qB/m. The *cyclotron frequency*. Independent of speed — why the cyclotron works.
4. **Helical motion** — add a velocity component parallel to B and you get a helix. Cosmic rays spiralling along Earth's field lines into the poles. The aurora.
5. **The velocity selector** — perpendicular E and B. Only particles with v = E/B go straight. Everything else curves. Used to clean up beams.
6. **Mass spectrometer** — select velocity, then bend in pure B. Heavier particles curve less. Separate isotopes, identify molecules. Aston, 1919; basis of modern proteomics.
7. **Forward** — what field does a current make? → Biot-Savart, FIG.13.

**Scenes to build (3):**

| File | Purpose |
|---|---|
| `cyclotron-scene.tsx` | Uniform B pointing out of screen. Shoot a charged particle with adjustable v and q. Circle radius and period readouts. Sign-flip reverses direction. |
| `helical-motion-scene.tsx` | 3D view. Tilt initial velocity relative to B. Particle traces a helix. Pitch and radius readouts. |
| `mass-spectrometer-scene.tsx` | Velocity selector + semicircular deflector. Particles of different m/q land at different positions on a detector strip. Histogram builds up over time. |

**Physicists (aside):**
- Hendrik Lorentz *(NEW — the force law, electron theory, shared Nobel 1902, transformation that bears his name later used in special relativity)*
- Ernest Lawrence *(NEW — cyclotron 1932, Nobel 1939; turned the cyclotron frequency into the basis of modern accelerator physics)*
- Francis Aston *(NEW — mass spectrograph 1919, discovered 212 of the 287 naturally occurring isotopes)*

**Glossary terms:**
- `lorentz-force` — concept
- `cyclotron` — instrument
- `cyclotron-frequency` — concept
- `mass-spectrometer` — instrument
- `velocity-selector` — instrument
- `aurora` — phenomenon

**Reading minutes:** 12.

---

### FIG.13 — Biot-Savart and the Field of a Current

**Hook.** Jean-Baptiste Biot and Félix Savart, Paris, October 1820 — six months after Ørsted's news reached France. They measure the torque on a compass needle suspended near a straight wire and extract a precise distance law. Laplace puts it in infinitesimal form. The Coulomb law of magnetostatics.

**Sections (7):**

1. **The law** — dB = (μ₀/4π) · I·(dL × r̂) / r². Each chunk of current contributes a piece of field; integrate over the whole circuit.
2. **Permeability of free space** — μ₀ = 4π × 10⁻⁷ T·m/A (exactly, before the 2019 SI redefinition). The magnetic analogue of ε₀.
3. **Worked: long straight wire** — B = μ₀I/(2πr). Field circles around the wire, magnitude drops like 1/r. The simplest and most common geometry in electrical engineering.
4. **Worked: circular loop (on axis)** — B = μ₀IR²/[2(R² + z²)^(3/2)]. At the centre: B = μ₀I/(2R). A current loop is a magnetic dipole.
5. **The right-hand rule, twice** — curl fingers in direction of current, thumb gives B for a loop; wrap fingers around a wire in current direction, they point in the direction of B circles.
6. **Beyond point currents** — Biot-Savart generalises to volume currents J via dV and the same cross-product structure. All of magnetostatics, in principle, is one integral.
7. **Forward** — when there's enough symmetry, Ampère's law makes these integrals trivial → FIG.14.

**Scenes to build (2):**

| File | Purpose |
|---|---|
| `wire-field-scene.tsx` | Infinite straight wire perpendicular to screen. Current slider. Circular field lines with variable spacing; probe magnitude at any point. |
| `loop-field-scene.tsx` | Current loop seen edge-on. Field lines drawn by numerical Biot-Savart integration. On-axis and off-axis magnitudes readable at the cursor. |

**Physicists (aside):**
- Jean-Baptiste Biot *(NEW — experimental measurements of the wire's field, astronomy, first hot-air balloonist to reach 5000 m for science)*
- Félix Savart *(NEW — Biot's collaborator, also a musician and instrument acoustician)*
- Pierre-Simon Laplace *(exists — infinitesimal form of the law)*

**Glossary terms:**
- `biot-savart-law` — concept
- `permeability-of-free-space` — concept (constant)
- `magnetic-dipole-moment` — concept
- `current-loop` — concept

**Reading minutes:** 10.

---

### FIG.14 — Ampère's Law

**Hook.** André-Marie Ampère, Paris, December 1820. Within weeks of hearing of Ørsted's discovery, he has reproduced and extended it, proposed that all magnetism is caused by tiny current loops inside matter (prescient — it is), and written down a circuital law that is the magnetic counterpart of Gauss's law. Maxwell would later name him "the Newton of electricity".

**Sections (7):**

1. **The statement** — ∮ B · dL = μ₀ · I_enclosed. The line integral of B around a closed loop equals μ₀ times the current threading the loop. Geometry-independent.
2. **When to use it** — symmetric currents. Infinite straight wire (cylindrical symmetry), infinite solenoid (axial symmetry), toroid (ring symmetry). Three geometries that cover most real devices.
3. **Worked: straight wire** — pick an Amperian circle of radius r; by symmetry B is constant on it, tangent to it. B·2πr = μ₀I → same answer as Biot-Savart, one line of algebra.
4. **Worked: solenoid** — B = μ₀nI inside, ≈ 0 outside. The basis of every electromagnet, relay, and MRI coil. n is turns per metre.
5. **Worked: toroid** — B = μ₀NI/(2πr) inside, zero outside. Fusion confinement (tokamak), transformer cores, all ring-shaped.
6. **Ampère's molecular currents** — his guess that iron's magnetism is countless tiny atomic current loops. Wrong in the classical sense (electron spin is not literal orbit) but morally right. All magnetism is charges in motion.
7. **Forward** — Ampère's law as written is missing something. Maxwell's displacement current fixes it in FIG.19.

**Scenes to build (2):**

| File | Purpose |
|---|---|
| `solenoid-scene.tsx` | Long coil in cross-section. Turns-per-metre slider, current slider. Uniform interior B field, near-zero exterior. Field arrows on a grid update live. |
| `toroid-scene.tsx` | Ring-coil top view. Current slider. B lines form concentric circles inside the toroid, zero outside. Probe-point readout. |

**Physicists (aside):**
- André-Marie Ampère *(NEW — circuital law, molecular-current theory of magnetism, 1820; Maxwell called him "the Newton of electricity")*
- Michael Faraday *(exists)*

**Glossary terms:**
- `amperes-law` — concept
- `solenoid` — instrument
- `toroid` — instrument
- `electromagnet` — instrument
- `amperian-loop` — concept

**Reading minutes:** 11.

---

### FIG.15 — Magnetic Materials

**Hook.** Pierre Weiss, 1907, proposes that iron contains "domains" — regions where atomic moments align spontaneously — with boundaries that move under an applied field. A hammered sword retains magnetisation along its length. The physics of permanent magnets, audio tape, and hard drives all lives here.

**Sections (7):**

1. **Three responses to a field** — diamagnetic (weak, opposing, all materials), paramagnetic (weak, aligning, unpaired spins), ferromagnetic (strong, aligning, spontaneous order below T_c). Water, aluminium, iron.
2. **Magnetic susceptibility χ** — M = χH. Small and negative for diamagnets, small and positive for paramagnets, huge and nonlinear for ferromagnets.
3. **The hysteresis loop** — B vs H for a ferromagnet. Not a curve, a loop. The area inside = energy lost to heat per cycle. Why transformer cores warm up.
4. **Curie temperature** — heat a ferromagnet above T_c (770 °C for iron) and it becomes paramagnetic. Cool it down and domains reform. Magnetism is thermally fragile.
5. **Domain walls** — regions between domains. Move under a field, pinning sites determine coercivity. Hard magnets have many pinning sites; soft magnets few. Engineering trade-off.
6. **Applications** — electric motors and generators (soft iron cores), permanent magnets (neodymium, samarium-cobalt), hard drives (thin-film media), transformers (silicon steel).
7. **Forward** — a changing magnetic flux drives a current → induction, FIG.16.

**Scenes to build (2):**

| File | Purpose |
|---|---|
| `hysteresis-scene.tsx` | H slider (drive field). B traces a hysteresis loop. Coercivity and remanence readouts. Soft vs hard material preset toggles the loop width. |
| `domain-scene.tsx` | A 2D lattice of domain arrows under an applied H. Domains grow and shrink as field sweeps; above T_c toggle, arrows randomise into paramagnetism. |

**Physicists (aside):**
- Pierre Curie *(NEW — Curie temperature, Curie's law of paramagnetism, piezoelectricity with his brother, Nobel with Marie)*
- Pierre Weiss *(NEW — molecular-field theory of ferromagnetism 1907, predicted domains before they were seen)*
- Louis Néel *(NEW — antiferromagnetism and ferrimagnetism, Nobel 1970)*

**Glossary terms:**
- `ferromagnetism` — phenomenon
- `paramagnetism` — phenomenon
- `diamagnetism` — phenomenon
- `hysteresis` — phenomenon
- `curie-temperature` — concept
- `magnetic-domain` — concept
- `magnetisation` — concept

**Reading minutes:** 10.

---

## Module 4 · Electromagnetic Induction

### FIG.16 — Faraday's Law and Lenz's Law

**Hook.** London, 29 August 1831. Michael Faraday winds two coils on an iron ring, pushes a current through one, and watches a galvanometer attached to the other twitch — but only at the moment the current changes. He has discovered electromagnetic induction. The dynamo, the transformer, and the entire electrical grid follow from that one flick of a needle.

**Sections (7):**

1. **The experiment** — two coils, one iron ring. Switch on circuit A; galvanometer on circuit B deflects, then returns to zero. Switch off; it deflects the other way, then returns. Only *change* matters.
2. **Flux** — Φ_B = ∫ B · dA. The total magnetic field threading a loop. Units: webers. A measure of how much magnetism is caught in the loop.
3. **Faraday's law** — ε = −dΦ_B/dt. The induced EMF equals the rate of change of flux. Sign given by the minus sign — which is Lenz's law.
4. **Lenz's law** — the induced current flows in the direction that *opposes* the change in flux. Consequence of energy conservation; a current that reinforced the change would be a perpetual-motion machine.
5. **Motional EMF** — move a bar through a field and charges in it feel a Lorentz force. ε = BLv. The bar is a battery as long as it's moving. Same law as Faraday's, re-derived from Lorentz.
6. **The dynamo** — rotate a coil in a field; flux varies sinusoidally; EMF is the time-derivative, also sinusoidal, 90° out of phase. Faraday's disc (1831) was the first generator.
7. **Forward** — a changing flux is one of Maxwell's four equations → FIG.19. An induced EMF in a nearby coil — transformer action → FIG.18.

**Scenes to build (3):**

| File | Purpose |
|---|---|
| `faraday-ring-scene.tsx` | Primary coil + secondary coil on a ring. Current slider on primary. Flux readout, induced EMF trace on the secondary as the slider moves. Static = zero. |
| `magnet-through-loop-scene.tsx` | Bar magnet being pushed through a wire loop. Induced current direction visualised; Lenz's law arrow on the loop face always opposes the incoming flux change. |
| `faradays-disc-scene.tsx` | A conducting disc spinning in a perpendicular B. Sliding-contact at rim and axis. DC EMF between them; readout is constant for constant ω. |

**Physicists (aside):**
- Michael Faraday *(exists — 29 August 1831 is the date to remember)*
- Joseph Henry *(NEW — independently discovered induction in the US, same year; gave his name to the SI unit of inductance; also the self-inductance concept)*
- Heinrich Lenz *(NEW — Russian-Baltic physicist, stated the sign rule 1834; Lenz's law)*

**Glossary terms:**
- `magnetic-flux` — concept
- `weber` — unit
- `faradays-law` — concept
- `lenzs-law` — concept
- `electromagnetic-induction` — phenomenon
- `motional-emf` — concept
- `dynamo` — instrument

**Reading minutes:** 12.

---

### FIG.17 — Inductance and LR Circuits

**Hook.** Joseph Henry, Albany Academy, 1832. A self-taught American schoolmaster wraps insulated wire into tight coils and notices that when he breaks the circuit, a spark jumps across the gap — far larger than the battery voltage. The coil resists its own flux change. The SI unit of inductance is named for him.

**Sections (7):**

1. **Self-inductance** — a coil carrying its own current produces its own flux. Change the current and the coil induces an EMF back on itself. L = Φ/I, with L in henrys.
2. **EMF across an inductor** — V_L = L · dI/dt. An inductor is a voltage source proportional to how fast current is changing. DC → zero; AC → plenty.
3. **Geometry of the solenoid** — L = μ₀n²Al. Long thin solenoid with many turns gets the highest L for its volume. Ferrite cores multiply L by hundreds.
4. **Energy stored in an inductor** — U = ½LI². Stored in the magnetic field, density u = B²/(2μ₀). Dual to the capacitor.
5. **The LR circuit** — battery, switch, L and R in series. Close the switch; current rises as I(t) = (ε/R)(1 − e^(−Rt/L)). Time constant τ = L/R.
6. **Back-EMF and the arc** — open the switch suddenly; L tries to maintain current, voltage across the gap shoots up until an arc forms. Why ignition coils and flyback diodes exist.
7. **Forward** — LC pair → oscillator, essentially a mass-on-spring in electrical form → FIG.18's resonance preview.

**Scenes to build (2):**

| File | Purpose |
|---|---|
| `inductor-scene.tsx` | Solenoid with turns, radius, length sliders. L readout. Current slider; energy stored bar graph. |
| `lr-transient-scene.tsx` | Battery-switch-R-L loop. Press switch. I(t) trace shows exponential rise to ε/R. Open switch; current crashes, dV/dt across L spikes. Voltage-spike flash animation. |

**Physicists (aside):**
- Joseph Henry *(exists from FIG.16 — here he gets his full profile)*
- Nikola Tesla *(NEW — Tesla coil 1891, AC induction motor, polyphase power distribution; larger-than-life; returns in FIG.18 and FIG.25)*

**Glossary terms:**
- `inductance` — concept
- `self-inductance` — concept
- `henry` — unit
- `inductor` — instrument
- `back-emf` — phenomenon
- `lr-circuit` — concept

**Reading minutes:** 10.

---

### FIG.18 — Transformers and Mutual Inductance

**Hook.** 1880s, the "war of currents". Thomas Edison pushes DC; George Westinghouse and Nikola Tesla push AC. AC wins because of one device: the transformer. It steps voltage up or down with ~99% efficiency and only works if the current is changing. Faraday's 1831 iron ring, industrialised.

**Sections (7):**

1. **Mutual inductance** — two coils, flux from one threads the other. M = Φ₂₁/I₁. A coupling coefficient.
2. **The ideal transformer** — V_s/V_p = N_s/N_p. I_s/I_p = N_p/N_s. Power is conserved: V_p·I_p = V_s·I_s.
3. **Why AC conquered the grid** — cheap long-distance transmission demands high voltage (low I²R loss). Transformers step up at the power plant (400 kV) and step back down at substations (11 kV → 230 V). DC couldn't.
4. **Real transformers** — losses: copper (I²R), core (hysteresis + eddy), leakage flux. Efficient 60 Hz cores use laminated silicon steel; high-frequency cores use ferrite.
5. **Autotransformers and isolation** — one coil tapped partway, or two fully separated coils. Trade-offs in safety and cost.
6. **Eddy currents** — induced currents in conducting cores, circulating in closed loops. Heat. Lamination breaks them up. Also the principle behind induction cooktops and metal detectors.
7. **Forward** — AC driving L and C produces resonance, the tuning-fork behaviour of every radio → AC circuits, Module 5.

**Scenes to build (2):**

| File | Purpose |
|---|---|
| `transformer-scene.tsx` | Primary coil with N_p turns, secondary with N_s turns, iron core. AC source on primary; slider for turns ratio. Voltage and current on each side update live; conservation of power visualised as a flow. |
| `eddy-current-scene.tsx` | A solid conducting disc rotating in a non-uniform B field. Eddy currents visualised as swirling loops; heating glow as energy dissipates. Lamination toggle slices the disc into strips — swirls vanish, heating drops. |

**Physicists (aside):**
- Nikola Tesla *(exists from FIG.17)*
- George Westinghouse *(NEW — industrialised AC power, bought Tesla's patents, built the first Niagara hydroelectric station 1895)*
- William Stanley *(NEW — designed the first practical commercial transformer 1885, Great Barrington MA)*

**Glossary terms:**
- `mutual-inductance` — concept
- `transformer` — instrument
- `turns-ratio` — concept
- `eddy-current` — phenomenon
- `autotransformer` — instrument

**Reading minutes:** 10.

---

## Module 5 · AC Circuits & Resonance

### FIG.19 — Alternating Current and Phasors

**Hook.** Niagara Falls, 1895. The first large-scale AC power plant opens, delivering 25 Hz three-phase current to Buffalo 30 km away. To describe it, engineers need a new mathematics. Charles Steinmetz at General Electric adopts complex-number "phasors" — every sinusoidal voltage becomes a rotating arrow in the plane. Calculus becomes algebra overnight.

**Sections (7):**

1. **Sinusoidal steady state** — v(t) = V₀·cos(ωt + φ). Every quantity in a linear AC circuit is sinusoidal at the same frequency — only amplitude and phase change.
2. **RMS values** — V_rms = V₀/√2 (for sinusoids). A resistor dissipates V_rms²/R on average. "230 V" at a wall socket is RMS; the peak is 325 V.
3. **Phasors** — represent v(t) = V₀·cos(ωt + φ) as a complex number V₀·e^(iφ). All time dependence hidden in the implicit e^(iωt). Addition of sinusoids becomes vector addition.
4. **Impedance Z** — the complex generalisation of resistance. V = IZ, with V and I as phasors. Resistor: Z = R (real). Inductor: Z = iωL (positive imaginary). Capacitor: Z = 1/(iωC) (negative imaginary).
5. **Phase relationships** — in R, V and I in phase. In L, V leads I by 90°. In C, V lags I by 90°. "ELI the ICEman" mnemonic.
6. **Series combinations** — Z_total = Z_R + Z_L + Z_C. One complex addition replaces three differential equations.
7. **Forward** — the complex Z is a function of ω. Somewhere special it peaks → resonance, FIG.20.

**Scenes to build (2):**

| File | Purpose |
|---|---|
| `phasor-scene.tsx` | Rotating arrow in the complex plane. Projection onto real axis traces the sinusoid in time. Multiple phasors can be summed; resultant rotates with them. |
| `impedance-scene.tsx` | Frequency slider ω. Impedances of R, L, C plotted as vectors in complex plane; magnitudes and phases update continuously. |

**Physicists (aside):**
- Charles Steinmetz *(NEW — introduced phasor method for AC analysis at GE, 1893; "the wizard of Schenectady"; 4-foot-tall hunchbacked genius)*
- Oliver Heaviside *(exists from FIG.10 — independently developed much of the same formalism in England)*

**Glossary terms:**
- `alternating-current` — concept
- `rms` — concept
- `phasor` — concept
- `impedance` — concept
- `reactance` — concept

**Reading minutes:** 10.

---

### FIG.20 — RLC Resonance

**Hook.** 1887, Heinrich Hertz in Karlsruhe needs to make waves of a precise frequency to test Maxwell's prediction. He builds an LC tank — inductor plus capacitor — and discharges a spark gap through it. The tank rings at 1/√(LC), like a tuning fork. Every radio tuner, every bandpass filter, every atomic clock's crystal oscillator descends from it.

**Sections (7):**

1. **The LC oscillator** — L and C in a loop. Energy sloshes between the capacitor (electric field) and the inductor (magnetic field), exactly like a mass and spring. Natural frequency ω₀ = 1/√(LC).
2. **Mechanical analogue** — one-to-one with the harmonic oscillator: L ↔ m, 1/C ↔ k, R ↔ b (damping), V ↔ F. Everything you learned in § 01 FIG.05 transfers.
3. **The driven series RLC** — sine-wave source ε₀cos(ωt) driving R, L, C in series. Solve with phasors: I = ε/Z(ω).
4. **Resonance curve** — |I(ω)| peaks at ω = ω₀ = 1/√(LC). The peak height is ε₀/R; the peak width is ~R/L (full width at half maximum).
5. **The quality factor Q** — Q = ω₀L/R = 1/(ω₀RC). High Q = narrow, tall peak = sharp tuning. AM radio Q ≈ 100; quartz crystal Q ≈ 10⁵; atomic clocks Q ≈ 10¹⁰.
6. **Parallel vs series resonance** — parallel LC blocks at resonance (impedance is maximum, not minimum). Used as "tank circuits" in transmitters.
7. **Forward** — at resonance the circuit radiates strongly → antenna and wave, FIG.21–22.

**Scenes to build (2):**

| File | Purpose |
|---|---|
| `rlc-resonance-scene.tsx` | Frequency slider ω from 0 to 3ω₀. |I(ω)| curve accumulates; peak at ω₀ sharp or broad depending on R. Q readout. |
| `lc-tank-scene.tsx` | Animated L and C with energy bar on each; total constant (R=0) or decaying (R>0). Phase relationship visible in the oscillation. |

**Physicists (aside):**
- Heinrich Hertz *(NEW — LC oscillator 1887, radio-wave detection 1888, full profile in FIG.22)*
- William Thomson (Lord Kelvin) *(NEW — derived the LC oscillation formula 1853, decades before anyone could build one)*

**Glossary terms:**
- `resonance` — phenomenon
- `natural-frequency` — concept
- `quality-factor` — concept
- `bandwidth` — concept
- `tank-circuit` — instrument

**Reading minutes:** 11.

---

### FIG.21 — Power in AC Circuits

**Hook.** Your electric bill is measured in kilowatt-hours. Your motor's nameplate lists kW *and* kVA. The ratio between them is the power factor — a number between 0 and 1 that separates real, useful power from reactive, sloshing-back-and-forth power. Capacitor banks across Europe's factories exist for a single reason: to push this number back toward 1.

**Sections (7):**

1. **Instantaneous power** — p(t) = v(t)·i(t). For sinusoids of phase φ apart, p averages to ½V₀I₀cos(φ) = V_rms·I_rms·cos(φ).
2. **Real, reactive, apparent** — real P = V_rms·I_rms·cos(φ) [watts]. Reactive Q = V_rms·I_rms·sin(φ) [VAR]. Apparent S = V_rms·I_rms [VA]. S² = P² + Q².
3. **Power factor** — PF = cos(φ). PF = 1 ideal (pure resistor); PF = 0 worst (pure reactive — no net energy delivered).
4. **Why utilities care** — reactive current still flows through wires and transformers. I²R losses scale with |I|², not just real I. Low PF wastes capacity. Industrial customers pay penalties below PF 0.9.
5. **Power factor correction** — inductive loads (motors) have lagging PF. Add parallel capacitors to supply the reactive current locally. PF restored; grid happier.
6. **Three-phase power** — 120° phased sources. Smoother delivery, no zero-crossings in total power. Why industrial machines have three wires, not two.
7. **Forward** — at high enough ω, wires become antennas → EM waves, FIG.22.

**Scenes to build (2):**

| File | Purpose |
|---|---|
| `power-factor-scene.tsx` | Phase slider φ between v and i. p(t) = v·i traced in red; average shown as horizontal line. P, Q, S triangle in complex plane. |
| `pf-correction-scene.tsx` | An inductive load. Before: lagging current, low PF. Add parallel C of variable value. PF climbs to 1 at the optimal C. Grid-side current magnitude drops visibly. |

**Physicists (aside):**
- Charles Steinmetz *(exists)*
- Nikola Tesla *(exists — polyphase AC systems, Tesla's three-phase patents 1888)*
- Mihály Déri / Károly Zipernowsky / Ottó Bláthy *(NEW — Hungarian trio behind the first commercial transformer-based AC system, Ganz Works Budapest 1884)*

**Glossary terms:**
- `real-power` — concept
- `reactive-power` — concept
- `apparent-power` — concept
- `power-factor` — concept
- `three-phase-power` — concept

**Reading minutes:** 9.

---

## Module 6 · Maxwell's Equations

### FIG.22 — The Displacement Current

**Hook.** Cambridge, 1861. James Clerk Maxwell is staring at Ampère's law — ∮B·dL = μ₀I_enclosed — and realising it's broken. Consider a charging capacitor. Push an Amperian loop around the wire: current flows through. Now slide the loop sideways to pass between the capacitor plates: no current through it. Same loop, same B (by continuity), but the right-hand side disappears. The equation is inconsistent. Maxwell invents a new term out of pure consistency — the "displacement current" — and in doing so makes radio possible.

**Sections (7):**

1. **The problem** — Ampère's law applied across a capacitor: the enclosed current depends on which surface you attach to the loop. A physical quantity cannot depend on bookkeeping.
2. **Maxwell's insight** — between the plates there is no current, but there is a *changing* electric field. The flux of E through the gap is increasing at exactly the rate needed to restore consistency.
3. **The displacement current** — I_d = ε₀ · dΦ_E/dt. Adds to the right-hand side of Ampère: ∮B·dL = μ₀(I_enc + ε₀ · dΦ_E/dt).
4. **Is it a real current?** — no charges move between the plates. But it produces a magnetic field indistinguishable from that of a real current. Real enough to make radio.
5. **Symmetry restored** — Faraday: changing B makes E. Maxwell: changing E makes B. The two are symmetric now. The field feeds back on itself.
6. **Maxwell's prediction** — a self-sustaining disturbance of E and B can propagate through space. He computes its speed: 1/√(μ₀ε₀) ≈ 3×10⁸ m/s. Light's speed, measured from a magnet and a battery. Goosebumps.
7. **Forward** — the four equations in full form → FIG.23.

**Scenes to build (2):**

| File | Purpose |
|---|---|
| `capacitor-ampere-scene.tsx` | Charging capacitor with an Amperian loop. Toggle between "surface threads wire" and "surface passes between plates". Without d-current term, B values disagree; add it, they match. |
| `displacement-current-scene.tsx` | Animation of capacitor charging. E field grows between plates. The dE/dt "displacement current" shown as virtual arrows; B-field curls around the gap just as if real current flowed. |

**Physicists (aside):**
- James Clerk Maxwell *(exists from FIG.02 — here his full biography: Edinburgh-born, Cambridge fellow, first Cavendish Professor, died at 48 of stomach cancer the same year Einstein was born)*

**Glossary terms:**
- `displacement-current` — concept
- `maxwell-correction` — concept

**Reading minutes:** 11.

---

### FIG.23 — Maxwell's Four Equations

**Hook.** The four most beautiful lines ever written in human language, carved onto Maxwell's statue at the George Street junction in Edinburgh. They fit on a T-shirt. They built the 20th century.

**Sections (7):**

1. **Gauss's law for E** — ∮E·dA = Q_enc/ε₀. Charges source electric fields. Flux in, flux out; fields begin and end on charge.
2. **Gauss's law for B** — ∮B·dA = 0. No magnetic monopoles. Every B field line that leaves comes back. Ever.
3. **Faraday's law** — ∮E·dL = −dΦ_B/dt. A changing magnetic flux sources a curling electric field. The induction law, from FIG.16.
4. **Ampère-Maxwell law** — ∮B·dL = μ₀(I_enc + ε₀·dΦ_E/dt). Currents and changing electric fluxes both source curling magnetic fields.
5. **Differential form** — same equations, written with divergences and curls: ∇·E = ρ/ε₀; ∇·B = 0; ∇×E = −∂B/∂t; ∇×B = μ₀J + μ₀ε₀·∂E/∂t. Identical content, pointwise.
6. **Heaviside's rewrite** — Maxwell's *Treatise* (1873) had 20 equations in 20 unknowns using quaternions. Oliver Heaviside, self-taught telegraph engineer, recast them as four vector equations in the 1880s. The form everyone learns today.
7. **Forward** — in empty space, these four decouple into a wave equation → FIG.24.

**Scenes to build (2):**

| File | Purpose |
|---|---|
| `maxwell-equations-scene.tsx` | Four panels, one per equation. Each panel has an interactive illustration: Gauss/E with a point charge, Gauss/B with a bar magnet (closed loops), Faraday with a rotating loop in a field, Ampère-Maxwell with a capacitor. All four run simultaneously. |
| `integral-vs-differential-scene.tsx` | Toggle between integral and differential form for a given scenario. Same physics, two notations; side-by-side display of each equation. |

**Physicists (aside):**
- James Clerk Maxwell *(exists)*
- Oliver Heaviside *(exists from FIG.10 — here his full profile: telegraph operator turned self-taught theorist, coined "inductance", "impedance", "permeability"; invented operational calculus; died paranoid and alone in Torquay)*

**Glossary terms:**
- `maxwells-equations` — concept
- `divergence` — concept
- `curl` — concept
- `gausss-law-magnetism` — concept
- `ampere-maxwell-law` — concept

**Reading minutes:** 12.

---

### FIG.24 — Gauge Freedom and the Vector Potential

**Hook.** Ludwig Lorenz (Denmark, not the Dutchman H.A. Lorentz) in the 1860s, and later Hermann Weyl, notice that Maxwell's equations have redundancy — infinitely many configurations of underlying potentials produce the same E and B. This freedom isn't a bug; it's the deepest feature. Every modern theory of matter, from quantum electrodynamics to the Standard Model, is a "gauge theory".

**Sections (7):**

1. **Potentials, not just fields** — introduce scalar φ and vector A. Then E = −∇φ − ∂A/∂t and B = ∇×A. Two fields replaced by four; but ∇·B = 0 and Faraday are satisfied automatically.
2. **The freedom** — φ → φ − ∂χ/∂t and A → A + ∇χ for any scalar χ(x,t) leaves E and B unchanged. Gauge transformation.
3. **Fixing the gauge** — Coulomb gauge (∇·A = 0), Lorenz gauge (∇·A + (1/c²)∂φ/∂t = 0). Different choices, same physics. Lorenz is Lorentz-invariant and plays nicely with relativity.
4. **In Lorenz gauge** — Maxwell reduces to two decoupled wave equations: □φ = ρ/ε₀ and □A = μ₀J. As clean as it gets.
5. **Aharonov-Bohm** — classically, only E and B matter. Quantum mechanically, A itself has physical effects (1959 thought experiment, 1960 observation). The potentials are more than bookkeeping.
6. **Gauge theory as a principle** — demanding local gauge invariance in quantum field theory *predicts* the existence of the photon. Yang-Mills generalises the idea to predict gluons and the W/Z bosons. One principle, the whole Standard Model.
7. **Forward** — with the gauge set, Maxwell's equations in vacuum are a wave equation. We solve it → FIG.25.

**Scenes to build (1):**

| File | Purpose |
|---|---|
| `gauge-scene.tsx` | A static charge configuration. Display φ on a colour scale and A as arrows. Gauge-transformation slider (pick a χ) — φ and A change visibly, but E and B recomputed from them stay identical. |

**Physicists (aside):**
- Ludvig Lorenz *(NEW — Danish, Lorenz gauge 1867; often confused with Hendrik Lorentz)*
- Yakir Aharonov / David Bohm *(NEW — Aharonov-Bohm effect 1959, showed the vector potential is physical in quantum mechanics)*
- Hermann Weyl *(NEW — coined "gauge" in the modern sense, 1918; unified gravity with EM via gauge freedom, which failed, but seeded all later gauge theory)*

**Glossary terms:**
- `scalar-potential` — concept
- `vector-potential` — concept
- `gauge-transformation` — concept
- `coulomb-gauge` — concept
- `lorenz-gauge` — concept

**Reading minutes:** 11.

---

## Module 7 · Electromagnetic Waves

### FIG.25 — The Electromagnetic Wave Equation

**Hook.** Maxwell in 1865 takes his four equations and, in empty space, combines them. Two partial derivatives later, out falls ∂²E/∂t² = c²·∇²E — the wave equation. The speed: c = 1/√(μ₀ε₀), a number he had measured with a balance and a wire. It matches Fizeau's 1849 optical measurement of the speed of light to three significant figures. *Light is an electromagnetic wave.*

**Sections (7):**

1. **From Maxwell to the wave equation** — take the curl of Faraday's law; substitute Ampère-Maxwell; in vacuum (J = 0, ρ = 0), you get ∂²E/∂t² = c²∇²E. Same for B.
2. **Plane-wave solutions** — E(x,t) = E₀·cos(kx − ωt), B correspondingly. Travels at speed c = ω/k. E ⊥ B ⊥ direction of propagation. A transverse wave.
3. **The speed of light from a lab measurement** — 1/√(μ₀ε₀) = 2.998×10⁸ m/s. Computed from a galvanometer deflection and a capacitor measurement. Maxwell: "The agreement of the results seems to show that light and magnetism are affections of the same substance."
4. **The electromagnetic spectrum** — same wave equation, any ω. Radio (10³ Hz) → microwaves → IR → visible (10¹⁵ Hz, 400–700 nm) → UV → X-ray → gamma (10²⁰ Hz and up). 18 orders of magnitude, one equation.
5. **Refractive index** — in matter, light slows to c/n. n depends on ω (dispersion — why prisms make rainbows). n² = εᵣμᵣ in most media.
6. **Energy and momentum** — EM waves carry both. Radiation pressure is real (Lebedev, 1900). Solar sails, laser cooling, the Crookes radiometer's *incorrect* explanation but genuine phenomenon.
7. **Forward** — wave direction, polarization, energy flow → FIG.26. Then: how do you *make* one? → FIG.27.

**Scenes to build (2):**

| File | Purpose |
|---|---|
| `em-wave-scene.tsx` | 3D wave packet propagating in +x. E in y, B in z, both sinusoidal, 90° spatially phased on the right-hand rule. Wavelength slider changes λ; frequency updates via c = fλ. |
| `em-spectrum-scene.tsx` | Log-scale slider from radio to gamma. Shows ω, λ, photon energy (hν), typical source, typical use. Visible-light window highlighted. |

**Physicists (aside):**
- James Clerk Maxwell *(exists)*
- Hippolyte Fizeau *(NEW — measured speed of light terrestrially 1849 using a toothed wheel and an 8 km baseline to Montmartre; 313,300 km/s, within 5% of modern value)*
- Léon Foucault *(NEW — rotating-mirror measurement 1862, improved on Fizeau, also Foucault's pendulum)*

**Glossary terms:**
- `electromagnetic-wave` — concept
- `speed-of-light` — constant
- `wave-equation` — concept
- `electromagnetic-spectrum` — concept
- `refractive-index` — concept
- `dispersion` — phenomenon

**Reading minutes:** 12.

---

### FIG.26 — Polarization and the Poynting Vector

**Hook.** Étienne-Louis Malus, Paris 1808, looks through a calcite crystal at sunlight reflecting off the windows of the Luxembourg Palace and discovers that the reflected light is different — polarised. Light has a secret orientation. Polaroid sunglasses, LCD screens, and 3D movie glasses all exploit it.

**Sections (7):**

1. **The E-vector orientation** — in a plane wave, E can oscillate in any direction perpendicular to propagation. That direction is the polarization.
2. **Linear, circular, elliptical** — linear (E along a fixed line), circular (E rotates at ω, constant magnitude), elliptical (general case). Two linear at 90° with 90° phase difference = circular.
3. **Malus's law** — unpolarized light through a polariser comes out half-intensity, linearly polarised. Through a second polariser at angle θ: I = I₀cos²θ.
4. **Natural polarisation mechanisms** — reflection (Brewster's angle — no reflected p-polarisation), scattering (blue sky is polarised perpendicular to the sun line — bees see this), birefringence (calcite splits an unpolarised ray into two).
5. **The Poynting vector** — S = E × B / μ₀. Units: W/m². Direction: wave propagation. Magnitude: energy flux density. Named for John Henry Poynting, 1884.
6. **Radiation pressure** — momentum flux = S/c. Sunlight exerts ~5 μPa on a mirror. Enough for solar sails (IKAROS, LightSail). Laser tweezers trap atoms. The comet's tail always points away from the sun.
7. **Forward** — how does an antenna *make* these waves? → FIG.27.

**Scenes to build (2):**

| File | Purpose |
|---|---|
| `polarisation-scene.tsx` | Unpolarised light → polariser 1 (fixed axis) → polariser 2 (rotatable). Intensity meter shows cos²θ curve. Toggle circular-polarisation mode. |
| `poynting-scene.tsx` | Plane wave with E and B arrows animated. S = E×B arrow consistently in propagation direction. Energy-density colour bar follows the wavefront. |

**Physicists (aside):**
- Étienne-Louis Malus *(NEW — polarisation by reflection 1808, Malus's law, also Napoleonic army engineer)*
- David Brewster *(NEW — Brewster's angle, kaleidoscope, optical instrument designer)*
- John Henry Poynting *(NEW — Poynting vector 1884, also measured G in Cavendish's tradition)*

**Glossary terms:**
- `polarization` — concept
- `malus-law` — concept
- `brewster-angle` — concept
- `poynting-vector` — concept
- `radiation-pressure` — phenomenon
- `birefringence` — phenomenon

**Reading minutes:** 11.

---

### FIG.27 — Antennas and Radiation

**Hook.** Karlsruhe, November 1886. Heinrich Hertz sparks a gap at one end of his lab and watches another spark jump across a wire loop at the other end — separated by nothing but air. He has detected electromagnetic waves. Eight years later Marconi sends a signal across the Atlantic. The radio age begins.

**Sections (7):**

1. **An accelerating charge radiates** — the Larmor formula: P = q²a²/(6πε₀c³). Energy carried away as EM waves. Acceleration is the key; a charge moving uniformly doesn't radiate.
2. **The dipole antenna** — an oscillating current in a short rod. E and B near the antenna look complicated; far away they become a spherical wave with characteristic angular pattern.
3. **Radiation pattern** — a dipole radiates most strongly perpendicular to its axis, not along it (no energy out the ends). The doughnut-shaped pattern.
4. **Half-wavelength dipole** — the canonical practical antenna. Length = λ/2. Standing wave of current. All terrestrial broadcast antennas are variations of this.
5. **Near field vs far field** — within ~λ, fields are complicated and don't propagate. Beyond ~10λ, pure radiation. The transition zone matters for phone-antenna design and specific-absorption-rate (SAR) measurements.
6. **Hertz's experiment in detail** — transmitter: induction coil + spark gap between two brass balls + wire "arms" (a dipole). Receiver: a loop of wire with a tiny spark gap. Hertz measured wavelength, frequency, polarization, reflection, refraction — all of it — in one summer. Maxwell was right.
7. **Forward** — we've built EM. Now use it — optics begins with the simplest cases: rays → Module 8.

**Scenes to build (2):**

| File | Purpose |
|---|---|
| `dipole-antenna-scene.tsx` | Vertical dipole with oscillating current. Near-field E lines and far-field wavefront both visible; doughnut radiation pattern overlaid. |
| `hertz-experiment-scene.tsx` | Historical reconstruction: transmitter with spark gap, receiver loop with its own gap. Press "spark" — wave propagates, receiver sparks after a delay of r/c. |

**Physicists (aside):**
- Heinrich Hertz *(exists from FIG.20 — here his full profile: first to generate and detect radio waves 1886–88, proved Maxwell right, died at 36 of granulomatosis. Unit of frequency is his)*
- Guglielmo Marconi *(NEW — first trans-Atlantic radio transmission December 1901, Nobel 1909 with Braun, commercialised what Hertz demonstrated)*
- Joseph Larmor *(NEW — Larmor formula 1897, radiation from an accelerated charge)*

**Glossary terms:**
- `antenna` — instrument
- `dipole-antenna` — instrument
- `larmor-formula` — concept
- `near-field` — concept
- `far-field` — concept
- `radiation-pattern` — concept
- `hertz` — unit

**Reading minutes:** 12.

---

## Module 8 · Optics

### FIG.28 — Reflection and Refraction

**Hook.** Willebrord Snel van Royen (Snellius), Leiden, c. 1621. He passes light through water and measures the bending angle with a protractor. n₁·sin θ₁ = n₂·sin θ₂. The law that every camera lens, every eyeglass, every rainbow obeys. Descartes independently reaches it a decade later and publishes it first — Snell's notebooks sat forgotten until after his death.

**Sections (7):**

1. **The rays** — in the limit λ ≪ apparatus, light behaves like straight arrows. Geometric optics. Approximation, but a spectacular one.
2. **Reflection** — angle of incidence = angle of reflection, measured from the normal. Mirrors, the Law.
3. **Refraction: Snell's law** — n₁·sin θ₁ = n₂·sin θ₂. Light bends toward the normal when entering a denser medium, away when leaving. Derived from Fermat's principle of least time (1662).
4. **Total internal reflection** — from dense to rare, beyond the critical angle sin θ_c = n₂/n₁, all light reflects. Optical fibres, prisms, diamond sparkle.
5. **Fermat's principle** — light takes the path of stationary optical length. A variational principle that gives both laws in one stroke. Deep — this is the grandfather of all action principles, including quantum electrodynamics.
6. **Dispersion revisited** — n depends on ω. Prisms split white light because violet bends more than red. Newton's 1666 experiment; same effect in Cauchy's 1836 formula and in fibre-optic chromatic dispersion engineering today.
7. **Forward** — bend light many times with curved interfaces → lenses and mirrors, FIG.29.

**Scenes to build (2):**

| File | Purpose |
|---|---|
| `snell-scene.tsx` | Two media with draggable index-of-refraction slider each. A ray entering at a slider-controlled angle bends at the interface. Readouts for both angles; TIR flags when sinθ > n₂/n₁. |
| `fermat-scene.tsx` | Point A on land, point B in water. A ray from A to B can be drawn along any path; user drags the crossing point along the interface. Total "optical length" (actual length × n) is plotted; minimum sits exactly at Snell's angle. |

**Physicists (aside):**
- Willebrord Snellius *(NEW — Snell's law c. 1621, unpublished in his lifetime)*
- René Descartes *(NEW — La Dioptrique 1637, rederived and published Snell's law; also method of normals, rainbow analysis)*
- Pierre de Fermat *(NEW — principle of least time 1662; also last theorem and number theory, full profile in later branches)*
- Christiaan Huygens *(exists — Huygens's principle, wave derivation of Snell's law)*

**Glossary terms:**
- `reflection` — phenomenon
- `refraction` — phenomenon
- `snells-law` — concept
- `refractive-index` — concept
- `total-internal-reflection` — phenomenon
- `fermats-principle` — concept
- `critical-angle` — concept

**Reading minutes:** 11.

---

### FIG.29 — Lenses, Mirrors, and the Eye

**Hook.** 1609, Padua. Galileo grinds his own lenses, builds a 20× telescope, and looks at Jupiter. Four moons. The Ptolemaic cosmos collapses in one night. The physics of the telescope — and the eye that looks through it — is a dozen applications of Snell's law.

**Sections (7):**

1. **Curved interfaces** — a spherical refracting surface focuses parallel rays to a point. Within the paraxial approximation, 1/f = (n₂ − n₁)/R.
2. **Thin lens formula** — 1/f = (n − 1)(1/R₁ − 1/R₂). Lens-makers equation. And the imaging relation: 1/s_o + 1/s_i = 1/f. Three variables; fix any two, get the third.
3. **Ray diagrams** — three principal rays (parallel → through focal point; through centre → straight; through focal point → parallel). Where they meet is the image.
4. **Convex vs concave, real vs virtual** — sign conventions. Magnifiers (convex, virtual), cameras (convex, real inverted), microscope eyepieces, telescopes.
5. **Mirrors** — same imaging formula with R as radius of curvature and f = R/2. Parabolic mirrors avoid spherical aberration — why reflecting telescopes won.
6. **The eye** — a variable-focus lens (cornea + crystalline lens), retina as image plane, accommodation by ciliary muscle. Myopia, hyperopia, presbyopia — three defects corrected by three lens prescriptions.
7. **Forward** — the ray model breaks down when the aperture approaches λ. Waves return → diffraction, FIG.30.

**Scenes to build (2):**

| File | Purpose |
|---|---|
| `thin-lens-scene.tsx` | Object at draggable position s_o from a converging lens. Three principal rays drawn. Image forms; s_i, magnification, and real/virtual flag update live. f slider changes the lens. |
| `eye-scene.tsx` | Cross-section of an eye with adjustable cornea-lens shape. Distant object and near object scenarios. Toggle myopia/hyperopia; add a corrective lens that fixes the focus. |

**Physicists (aside):**
- Galileo Galilei *(exists)*
- Johannes Kepler *(NEW — improved telescope design with two convex lenses 1611; also wrote the first modern optics treatise, Dioptrice; full profile in astronomy/mechanics)*
- Ibn al-Haytham (Alhazen) *(NEW — Kitāb al-Manāẓir, c. 1021; first correct theory of vision as light entering the eye; centuries ahead of Europe)*

**Glossary terms:**
- `lens` — instrument
- `focal-length` — concept
- `thin-lens-equation` — concept
- `magnification` — concept
- `aberration` — phenomenon
- `telescope` — instrument
- `microscope` — instrument

**Reading minutes:** 11.

---

### FIG.30 — Interference and Young's Double Slit

**Hook.** Thomas Young, Royal Institution, 1801. He shines sunlight through a pinhole, then through two closely spaced slits, and projects the result on a screen. He sees fringes — alternating bright and dark bands. Light adds and cancels. For a century, Newton's corpuscle theory had said impossible. Young has proven light is a wave.

**Sections (7):**

1. **Superposition of waves** — when two coherent waves meet, their E-fields add at each point. Constructive (in phase) → bright. Destructive (180° out) → dark.
2. **Young's geometry** — two slits separated by d, screen at distance L. Fringe spacing Δy = λL/d. Millimetre fringes from micron slits, because L ≫ d.
3. **Path-length difference** — Δ = d·sin θ. Bright when Δ = mλ (integer m). Dark when Δ = (m + ½)λ. The fringes are the geometry of that difference.
4. **Coherence** — fringes require the two slits be illuminated by light of a single λ and a stable phase relationship. Incoherent sources (two separate bulbs) give no pattern.
5. **Michelson interferometer** — a beam split in two, one arm moved by a fraction of λ. Recombine: fringe pattern shifts. Measures displacement to a wavelength. The 1887 Michelson-Morley experiment used one to disprove the luminiferous ether.
6. **Thin-film interference** — soap bubbles, oil slicks, anti-reflection coatings, butterfly wings. Two partial reflections from front and back of a thin layer interfere. Iridescence.
7. **Forward** — what happens when a wave encounters *one* slit, or a hole? → diffraction, FIG.31.

**Scenes to build (3):**

| File | Purpose |
|---|---|
| `double-slit-scene.tsx` | Two slits, screen. λ and d sliders. Fringe pattern on the screen updates in real time. Intensity-on-screen plot beneath. |
| `michelson-scene.tsx` | Beamsplitter, two mirrors, one mirror on a slide. Drag the slide; fringes shift count visible in a detector window. |
| `thin-film-scene.tsx` | Soap film on a frame with variable thickness. Incident white light; reflected colour depends on thickness and viewing angle. Rainbow bands animated. |

**Physicists (aside):**
- Thomas Young *(NEW — double-slit experiment 1801, also decoded Egyptian hieroglyphs via the Rosetta Stone, polymath extraordinaire)*
- Albert Michelson *(NEW — Michelson interferometer, speed of light to unprecedented precision, first American Nobel in physics 1907)*
- Isaac Newton *(exists — defended the corpuscle theory for a century, was wrong, his authority delayed the wave picture)*

**Glossary terms:**
- `interference` — phenomenon
- `constructive-interference` — concept
- `destructive-interference` — concept
- `coherence` — concept
- `fringes` — phenomenon
- `interferometer` — instrument
- `thin-film-interference` — phenomenon

**Reading minutes:** 12.

---

### FIG.31 — Diffraction

**Hook.** Augustin-Jean Fresnel, 1818 — a young French civil engineer submits a paper on the wave theory of light to a Paris Academy prize committee. Siméon Poisson, a corpuscularist, mocks it: "If Fresnel is right, there should be a *bright spot* at the centre of a circular obstacle's shadow. Absurd!" Dominique Arago runs the experiment. The spot is there. The wave theory wins.

**Sections (7):**

1. **Huygens's principle** — every point on a wavefront acts as a source of secondary wavelets. The next wavefront is their envelope. Huygens 1690; the root of all diffraction theory.
2. **Single-slit diffraction** — slit width a. Central bright peak of angular half-width λ/a, flanked by weaker fringes. Narrower slit → wider pattern. Counter-intuitive.
3. **The diffraction limit** — why your telescope can't see two stars closer than 1.22λ/D in angle (Rayleigh's criterion). Sets the resolution of every optical instrument.
4. **Diffraction gratings** — thousands of parallel slits. Constructive interference only at specific angles: d·sinθ = mλ. Spectrometers. CD-ROM surface iridescence. Every spectrograph ever.
5. **Fresnel's integrals** — rigorous solution for arbitrary apertures. The Cornu spiral. Knife-edge diffraction. Why your shadow has fuzzy edges.
6. **Poisson spot** — a circular obstacle. By symmetry, every point on the rim is equidistant from the axis. Constructive interference on-axis. Bright spot behind an opaque disc. Still demonstrated in labs.
7. **Forward** — diffraction and interference together explain all wave-optical phenomena. Classical EM closes here. Quantum mechanics picks up at why light *also* behaves as particles.

**Scenes to build (2):**

| File | Purpose |
|---|---|
| `single-slit-scene.tsx` | A slit of adjustable width a, wavelength slider. Intensity pattern on screen: central maximum plus sidelobes. As a → 0, pattern broadens; as a ≫ λ, geometric shadow. |
| `diffraction-grating-scene.tsx` | Hundreds of slits, λ slider with white-light option. Sharp maxima at diffraction orders m = 0, ±1, ±2… White light produces spectral fans. Zeroth order undispersed. |

**Physicists (aside):**
- Augustin-Jean Fresnel *(NEW — wave theory of light, Fresnel integrals, Fresnel equations for reflection/transmission, lighthouse lenses)*
- François Arago *(NEW — ran the Poisson-spot experiment, politician, director of Paris Observatory)*
- Lord Rayleigh (John William Strutt) *(NEW — Rayleigh criterion, Rayleigh scattering (blue sky), discovered argon, Nobel 1904)*
- Joseph von Fraunhofer *(NEW — diffraction gratings, Fraunhofer lines in the solar spectrum, the boundary between optics and astronomy)*
- Christiaan Huygens *(exists)*

**Glossary terms:**
- `diffraction` — phenomenon
- `huygens-principle` — concept
- `rayleigh-criterion` — concept
- `diffraction-grating` — instrument
- `single-slit-diffraction` — phenomenon
- `poisson-spot` — phenomenon
- `fraunhofer-diffraction` — concept

**Reading minutes:** 12.

---

## Execution order

Recommended sequence. Electromagnetism is historically linear — each discovery enables the next — and this order matches both the history and the pedagogical dependency graph.

1. **Module 1 (Electrostatics)** end-to-end, FIG.01 through FIG.05. Nothing depends on later modules; gets the reader comfortable with fields, flux, and potential before currents arrive.
2. **Module 2 (Current & DC)** FIG.06 through FIG.10. Requires voltage from FIG.04; otherwise self-contained. FIG.09 (Kirchhoff) is the mechanical hinge — every later module uses it implicitly.
3. **Module 3 (Magnetostatics)** FIG.11 through FIG.15. Requires current (Module 2). FIG.12 (Lorentz) and FIG.14 (Ampère) are the high-value topics; FIG.15 (materials) can slip if schedule is tight.
4. **Module 4 (Induction)** FIG.16 through FIG.18. Requires flux (FIG.11) and current (Module 2). FIG.16 (Faraday) is the branch's emotional climax; give it the most scene polish.
5. **Module 5 (AC)** FIG.19 through FIG.21. Requires RC (FIG.10), LR (FIG.17), and induction (FIG.16). Depends heavily on § 01 FIG.05 (harmonic oscillator) — cross-link aggressively.
6. **Module 6 (Maxwell)** FIG.22 through FIG.24. Synthesis of everything above. FIG.22 and FIG.23 are the rhetorical peak of the branch — write these last of Module 6 so the voice is fully warmed up. FIG.24 (gauge) is optional-advanced; consider shipping at lower priority.
7. **Module 7 (Waves)** FIG.25 through FIG.27. Requires Module 6. FIG.25 derives the wave equation — has to be airtight. FIG.27 is where the history culminates (Hertz, Marconi).
8. **Module 8 (Optics)** FIG.28 through FIG.31. Requires only that EM waves exist (Module 7). Can also be written independently as a "ray optics first" alternative if the full EM spine is delayed.

Parallelism: Module 1 and Module 2 can run in parallel if two authors are available. Everything else has a hard prerequisite chain.

---

## Patterns to reuse

- **Scene skeleton:** copy from `damped-pendulum-scene.tsx` or `kinematics-graph-scene.tsx` (both in § 01). All use `useAnimationFrame`, `useThemeColors`, canvas + ResizeObserver, cyan (`#5BE9FF`) as the accent. For 3D EM scenes (helical motion, em-wave, poynting) use `@react-three/fiber` with the same colour tokens.
- **Physics functions:** pure modules in `lib/physics/*.ts`. One module per topic where practical — `lib/physics/coulomb.ts`, `lib/physics/gauss.ts`, `lib/physics/maxwell.ts`, etc. Shared vector utilities live in `lib/physics/vec.ts` (already exists from § 01 FIG.02).
- **Physicist adds:** manually edit `lib/content/physicists.ts` + `messages/en/physicists.json` (no MCP tool for this — documented gap in `docs/mcp-gaps.md`). This branch adds ~40 new physicists; batch them by module to avoid merge-conflict pain.
- **Glossary adds:** direct edits to `lib/content/glossary.ts` + `messages/en/glossary.json` + `messages/he/glossary.json` + `messages/ru/glossary.json` (four files now that ru is in). No MCP dependency required.
- **Topic status flip:** direct edit to `lib/content/branches.ts` — change `status` and `readingMinutes` on the relevant entry. Electromagnetism entries likely need to be *created* in `branches.ts` first if the skeleton isn't there.
- **Hebrew / Russian content:** copy the English MDX, translate prose section-by-section (use `mcp__physics-mcp__translate_topic` where available), update `messages/<locale>/home.json` chrome, wire `HeContent` / `RuContent` into `page.tsx`.
- **Route convention:** all topics live at `app/[locale]/(topics)/electromagnetism/<slug>/`. Slug examples: `charge-and-coulombs-law`, `electric-field`, `gauss-law`, `maxwell-equations`, `double-slit-interference`. Check `lib/content/branches.ts` for the canonical slug list.
- **Cross-links:** explicitly link § 01 oscillator topics from Module 5 (resonance), § 01 vectors from Module 1 (field as vector). The future § 03 (Quantum) will back-link to FIG.31 (diffraction) for de Broglie.
- **Units and constants:** all new constants (ε₀, μ₀, c, e, permittivities) live in `lib/physics/constants.ts`. Do not hardcode in scene files.

---

## Definition of done per topic

- [ ] `content.en.mdx` replaces skeleton, full 7-section essay.
- [ ] All new scenes exist, are registered in `components/physics/visualization-registry.tsx`, render without runtime error.
- [ ] New physicists + glossary terms live in `lib/content/*` and cross-linked from the MDX.
- [ ] `status: "live"`, `readingMinutes: N` in `branches.ts`.
- [ ] English home.json chrome updated.
- [ ] `npx tsc --noEmit` passes.
- [ ] Manual smoke test in `bun dev` at `/en/electromagnetism/<slug>`.
- [ ] All formulas rendered with KaTeX; no raw Unicode in math blocks.
- [ ] Scene colour tokens sourced from `useThemeColors`, not hardcoded hex.
- [ ] (optional) Hebrew + Russian content + page.tsx wire + home.json chrome.
