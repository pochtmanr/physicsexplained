# § 03 · Thermodynamics — curriculum roadmap

Energy flows one way. Entropy only grows. Out of these two facts come steam engines, refrigerators, the arrow of time, and the heat death of the universe.

Eight modules, thirty topics. FIG numbering restarts for this branch (FIG.01 through FIG.30). Voice = same Galileo-chandelier tone as Module 1. Every hook names a specific person or a specific moment.

---

## Module map

1. **Temperature & Heat** — thermometers, the zeroth law, thermal equilibrium, heat capacity, phase changes, calorimetry. The physics of hot and cold, before we know what heat is.
2. **The First Law** — internal energy, work, heat, PV diagrams, isothermal and adiabatic processes. Energy is conserved; heat and work are two ways to spend it.
3. **The Second Law** — entropy, heat engines, Carnot's ideal cycle, efficiency limits, the Clausius and Kelvin statements. Why a perpetual motion machine of the second kind is forbidden.
4. **Entropy & the Arrow of Time** — statistical entropy, Boltzmann's tombstone, microstates, irreversibility, Maxwell's demon, Loschmidt's paradox. Why time has a direction.
5. **Kinetic Theory of Gases** — pressure from molecular collisions, equipartition, the Maxwell-Boltzmann distribution, mean free path, Brownian motion. Atoms explain the ideal-gas law.
6. **Statistical Mechanics** — partition function, microcanonical/canonical/grand canonical ensembles, Gibbs paradox, free energies, fluctuations. Thermo rebuilt from counting.
7. **Phase Transitions** — ice/water/steam, latent heat, Clausius-Clapeyron, critical phenomena, universality, the Ising model. Where matter changes its mind.
8. **Applications & the Third Law** — refrigerators and heat pumps, the approach to absolute zero, superconductivity as thermo pushed to the limit, Bose-Einstein condensation, cryogenics, and the heat death of the universe.

---

## Module 1 · Temperature & Heat

### FIG.01 — What is Temperature?

**Hook.** In 1592, Galileo built a glass bulb with a long neck inverted in a dish of water. As the bulb warmed, water fell; as it cooled, water rose. It was the first thermoscope — a device that showed temperature before anyone knew what temperature was.

**Sections (7):**

1. **The sensation problem** — "hot" and "cold" are unreliable. A metal railing in winter feels colder than wood at the same temperature. Before thermometers, science couldn't even state the question properly.
2. **Galileo's thermoscope → Fahrenheit's thermometer** — Galileo (1592) gave us a qualitative instrument. Daniel Fahrenheit (1714) sealed the tube, used mercury, and made it quantitative. Celsius came in 1742. Kelvin in 1848.
3. **Three scales, one quantity** — °F, °C, K. The conversions. Why Kelvin is the only scale a physicist writes without apology: it has a true zero.
4. **Thermal equilibrium** — two bodies in contact eventually share a temperature. The *definition* of temperature is: the thing that equalises on contact.
5. **The zeroth law** — if A is in equilibrium with B, and B with C, then A is in equilibrium with C. Obvious. Also logically necessary before you can even *define* temperature as a number. Hence "zeroth": added to the pile after 1, 2, 3 had already been numbered.
6. **What thermometers actually measure** — not heat. Temperature is the *intensity* of thermal motion, not the *amount*. A spark is hotter than a bathtub but carries less thermal energy.
7. **What's next** — if temperature isn't heat, what is? → FIG.02.

**Scenes to build (2):**

| File | Purpose |
|---|---|
| `thermoscope-scene.tsx` | Galileo's glass bulb over a dish. Ambient-temperature slider. As T rises, the gas inside expands and pushes the water column down. Three-scale readout (°C/°F/K). |
| `thermal-equilibrium-scene.tsx` | Two blocks side by side, initial temperatures user-set. Bring them into contact; watch temperatures exponentially approach a common value. Toggle insulation on/off. |

**Physicists (aside):**
- Galileo Galilei *(exists)*
- Daniel Fahrenheit *(NEW — Dutch-German instrument maker, mercury thermometer 1714, set the scale that bears his name by pegging 0 °F to a brine eutectic and 96 °F to body temperature)*
- Anders Celsius *(NEW — Swedish astronomer, 1742 centigrade scale, originally inverted — 0 was boiling, 100 was freezing; Linnaeus flipped it)*
- Lord Kelvin / William Thomson *(NEW — absolute temperature scale 1848, thermodynamics founder, named a unit of absolute temperature, laid transatlantic cable, peerage for the cable work)*

**Glossary terms:**
- `temperature` — concept
- `thermometer` — concept
- `thermal-equilibrium` — concept
- `zeroth-law-of-thermodynamics` — concept
- `kelvin-scale` — concept
- `absolute-zero` — concept (stub here; deep-dive in FIG.29)

**Reading minutes:** 9.

---

### FIG.02 — Heat, Caloric, and Count Rumford's Cannons

**Hook.** Benjamin Thompson — born in Massachusetts, knighted by George III, ennobled as Count Rumford of the Holy Roman Empire — was boring cannons for the Bavarian army in 1798. The barrels got hotter the longer the boring went on, apparently without limit. If heat were a fluid stored in the metal, it should eventually run out. It didn't. Rumford had refuted the caloric theory by accident, on a military contract.

**Sections (7):**

1. **The caloric theory** — 18th-century orthodoxy. Heat was a weightless fluid ("caloric") that flowed from hot bodies to cold ones. It explained thermal equilibrium, expansion, phase changes — everything, until it didn't.
2. **Rumford's cannon-boring experiment** — dull tools generated more heat than sharp ones. Friction could produce heat indefinitely, as long as you kept turning the crank. No fluid in the universe could be inexhaustible.
3. **Davy's ice experiment** — Humphry Davy rubbed two pieces of ice together in a vacuum, in a room below freezing, and melted them. No caloric could have entered from outside.
4. **Joule's paddle wheel** — James Joule, brewer's son, Manchester, 1843-1845. A falling weight turned a paddle wheel in an insulated barrel of water. The water warmed. The warming was *exactly* proportional to the work done. Heat = a form of energy.
5. **The mechanical equivalent** — Joule measured 4.186 joules per calorie. The same number today. One of the great quantitative achievements of the 19th century, done mostly at night in a brewery.
6. **Heat vs temperature, again** — heat is an *amount*, measured in joules. Temperature is an *intensity*, measured in kelvin. Conflating them is the most common freshman error.
7. **What's next** — if heat is energy, how much energy does it take to warm a thing? → FIG.03.

**Scenes to build (2):**

| File | Purpose |
|---|---|
| `rumford-cannon-scene.tsx` | A rotating drill inside a brass cylinder immersed in water. Crank-speed slider. Temperature of the water rises linearly with *work input*, with no asymptote. |
| `joule-paddle-scene.tsx` | The classic falling-weight apparatus. Drop the mass; the paddle stirs; a thermometer in the water ticks up by exactly mgh / (mC). Readout compares work-in and heat-out, showing they match. |

**Physicists (aside):**
- Count Rumford / Benjamin Thompson *(NEW — American Tory, fled the Revolution, reformed the Bavarian army, invented the modern coffee-percolator and the double boiler, knocked the legs from under caloric theory c. 1798)*
- James Prescott Joule *(NEW — son of a Salford brewer, amateur scientist in the best sense, never held an academic post, measured the mechanical equivalent of heat in the family brewery)*
- Humphry Davy *(NEW — Cornish-born, discovered sodium, potassium, calcium, magnesium, boron; Rumford's successor at the Royal Institution; mentor to Faraday)*

**Glossary terms:**
- `heat` — concept
- `caloric-theory` — concept (historical)
- `mechanical-equivalent-of-heat` — concept
- `joule` — unit
- `calorie` — unit

**Reading minutes:** 11.

---

### FIG.03 — Heat Capacity and Calorimetry

**Hook.** Black, Glasgow, 1760s. A pound of water and a pound of mercury get the same amount of heat; the mercury ends up thirty times hotter. Joseph Black realised that different substances had different "capacities" for heat, and invented calorimetry to measure them.

**Sections (7):**

1. **Specific heat** — the energy to raise one gramme of a substance by one kelvin. Water: 4.186 J/(g·K), absurdly high. Lead: 0.13. Why oceans moderate climate and iron skillets heat fast.
2. **Molar heat capacity** — for gases and solids, per-mole is more fundamental. The Dulong-Petit law: most simple solids sit near 3R per mole. Why — preview of equipartition (FIG.17).
3. **C_v vs C_p** — constant volume vs constant pressure. For gases they differ by R (ideal gas). A gas does work when it expands at constant P, so more heat is needed for the same ΔT.
4. **The method of mixtures** — drop a hot solid into cool water in an insulated calorimeter, measure final T. Solve m_s C_s ΔT_s = m_w C_w ΔT_w. The experimental workhorse of 19th-century thermo.
5. **Joseph Black and latent heat** — Black also discovered that ice absorbs heat while melting *without changing temperature*. The heat is "latent" — hidden in the phase change. → FIG.04.
6. **Why water is weird** — hydrogen bonds. The enormous specific heat of liquid water is not a universal feature of liquids; it's a consequence of the molecular network. Climate, biology, and cooking all depend on this anomaly.
7. **What's next** — what happens at the phase transition itself? → FIG.04.

**Scenes to build (3):**

| File | Purpose |
|---|---|
| `specific-heat-bar-scene.tsx` | Bar chart of specific heats for ~8 common substances (water, ice, aluminium, copper, iron, lead, mercury, air). Hover to see the numerical value and one real-world consequence. |
| `calorimeter-mixture-scene.tsx` | Drag a hot metal block into an insulated cup of water. Sliders for block mass, block initial T, metal type (selects C). Watch the temperature curves of each component meet at the equilibrium T. |
| `cv-cp-piston-scene.tsx` | Two cylinders of the same gas. Left: sealed, fixed volume. Right: piston free, constant pressure. Add the same Q to both. Left warms more; right warms less but the piston rises. |

**Physicists (aside):**
- Joseph Black *(NEW — Scottish chemist, 1728-1799, discovered latent heat and specific heat capacity, isolated CO₂, mentor to James Watt, whose steam engine would later embody Black's ideas)*
- Pierre Louis Dulong *(NEW — French chemist and physicist, co-author of the Dulong-Petit law 1819, lost an eye in an explosion while isolating nitrogen trichloride)*
- Alexis Thérèse Petit *(NEW — died at 29 of tuberculosis, four months after publishing the heat-capacity law that made his name)*

**Glossary terms:**
- `specific-heat-capacity` — concept
- `molar-heat-capacity` — concept
- `calorimetry` — concept
- `dulong-petit-law` — concept
- `cv-cp` — concept (one entry, cross-referenced)

**Reading minutes:** 10.

---

### FIG.04 — Phase Changes and Latent Heat

**Hook.** Black again, same Glasgow laboratory. He set a beaker of ice-water on a warm hearth and watched the ice slowly melt — for half an hour — while his thermometer refused to budge from 0 °C. The heat was going in, but the temperature was standing still. Something was eating the energy.

**Sections (7):**

1. **Four phases** — solid, liquid, gas, plasma. (For our purposes, three: plasma lives in the astrophysics module.) Each is a different arrangement of molecular bonds.
2. **Latent heat of fusion** — the energy to melt a kilogram at its melting point, without changing temperature. Water: 334 kJ/kg. That's the same energy as heating the water from 0 °C to 80 °C. Ice is a thermal buffer.
3. **Latent heat of vaporisation** — boiling is even more expensive. Water: 2260 kJ/kg. Why sweat cools you (the evaporation steals the heat) and why steam burns are vicious.
4. **Phase diagrams** — P–T plot. Solid, liquid, vapour regions separated by coexistence curves. The triple point (where all three meet) and the critical point (where liquid and gas stop being distinguishable). → FIG.23, FIG.24.
5. **Clausius-Clapeyron, first look** — the slope of the coexistence curve. dP/dT = L / (T ΔV). Ice's curve slopes the wrong way (negative); that's why you can skate. Full derivation in FIG.24.
6. **Supercooling and superheating** — water can be held as liquid below 0 °C, or as vapour below the boiling point, if no nucleation sites are available. A pebble dropped into supercooled water flash-freezes the whole vessel.
7. **What's next** — energy in, energy out. Is it all conserved? → Module 2.

**Scenes to build (3):**

| File | Purpose |
|---|---|
| `heating-curve-scene.tsx` | T vs Q graph for 1 kg of H₂O starting as ice at -20 °C. Five regions: ice warming, ice→water plateau, water warming, water→steam plateau, steam warming. Animated dot moves along the curve as Q increases. Plateaus visibly flat. |
| `phase-diagram-scene.tsx` | P–T plot with solid/liquid/vapour regions. Drag a marker around; the simulated substance morphs between phases. Toggle "water" vs "CO₂" to see the negative vs positive slope of the solid-liquid line. |
| `supercooling-scene.tsx` | A beaker of water slowly cooled below 0 °C, temperature readout live. Click to introduce a nucleation seed; the entire volume crystallises in a moment, with the temperature jumping back up to 0 °C as latent heat is released. |

**Physicists (aside):**
- Joseph Black *(exists — introduced in FIG.03)*
- Benoît Paul Émile Clapeyron *(NEW — French engineer, 1799-1864, formalised Carnot's cycle in 1834 with PV diagrams, gave thermodynamics its first piece of graphic notation, name survives in the Clausius-Clapeyron relation)*

**Glossary terms:**
- `phase` — concept
- `phase-transition` — concept
- `latent-heat` — concept
- `latent-heat-of-fusion` — concept
- `latent-heat-of-vaporisation` — concept
- `triple-point` — concept
- `critical-point` — concept (stub; deep dive in FIG.23)

**Reading minutes:** 11.

---

## Module 2 · The First Law

### FIG.05 — Internal Energy and the First Law

**Hook.** Julius von Mayer, a ship's doctor, opened a Javanese sailor's vein in 1840 and noticed the venous blood was brighter red than at home in Heilbronn. In the tropics the body burned less fuel to stay warm, so less oxygen came out. From this clinical observation he deduced — alone, without a laboratory — the conservation of energy. He published in 1842, a year before Joule's paddle-wheel paper.

**Sections (7):**

1. **Internal energy, U** — the sum of all microscopic kinetic and potential energies of the molecules in a system. A *state function*: it depends only on the current state, not on how the system got there.
2. **The first law stated** — ΔU = Q − W. Heat added, minus work done by the system, equals the change in internal energy. Energy is conserved; heat and work are two ways to transfer it.
3. **Sign conventions** — Q positive if heat flows *in*, W positive if the system does work *on* the surroundings. Chemists sometimes flip W. Pick one and stick with it. We use the physics convention.
4. **Mayer, Joule, Helmholtz — three discoveries of the same law** — Mayer (1842, philosophical), Joule (1843, experimental), Helmholtz (1847, mathematical). Three men, no contact. Energy conservation was in the air.
5. **Perpetual motion of the first kind** — a machine that creates energy from nothing. The first law forbids it. Patent offices stopped examining perpetuum mobile proposals by 1775 (Académie Française). Still get sent them today.
6. **Why U, not Q** — heat and work are not state functions. You cannot say "how much heat is *in* a body." You can only say how much heat *crossed the boundary*. Internal energy is the only legitimate stored quantity.
7. **What's next** — how does work get done? What does the W term look like for a gas? → FIG.06.

**Scenes to build (2):**

| File | Purpose |
|---|---|
| `first-law-accounting-scene.tsx` | A box representing a system. Sliders: Q_in, W_out. Internal energy bar updates live. ΔU = Q − W shown as a running equation. Toggle between three modes: heat in + work out (engine), heat in only (heating), work in only (friction). |
| `three-discoveries-timeline-scene.tsx` | 1840-1850 timeline with three pins: Mayer (1842), Joule (1843), Helmholtz (1847). Click each for a one-paragraph account. Underneath: ΔU = Q − W glowing. |

**Physicists (aside):**
- Julius Robert von Mayer *(NEW — German physician, 1814-1878, ship's doctor on a Dutch voyage to Java, derived conservation of energy from physiology, spent years unrecognised, attempted suicide in 1850, eventually vindicated and ennobled)*
- James Joule *(exists — introduced in FIG.02)*
- Hermann von Helmholtz *(NEW — German polymath, 1821-1894, physician turned physicist, gave the first mathematical proof of energy conservation in his 1847 paper "Über die Erhaltung der Kraft"; also invented the ophthalmoscope, founded neurophysiology, shaped acoustics)*

**Glossary terms:**
- `internal-energy` — concept
- `first-law-of-thermodynamics` — concept
- `state-function` — concept
- `heat` — concept (cross-ref to FIG.02)
- `work-thermodynamic` — concept (distinguished from mechanical work)

**Reading minutes:** 10.

---

### FIG.06 — Work, PV Diagrams, and Reversibility

**Hook.** Clapeyron, 1834. He took Carnot's prose from 1824 and drew it. Pressure on the vertical axis, volume on the horizontal, a closed loop on the plane. Everything a heat engine does became a picture. Engineers could now *read* thermodynamics.

**Sections (7):**

1. **Work by a gas** — a gas pushing a piston does W = ∫ P dV. The integral of pressure over volume change. For constant pressure it reduces to W = P ΔV.
2. **The PV diagram** — plot pressure vs volume. Every quasi-static process is a curve; every cyclic process is a closed loop. The *area under the curve* is the work done.
3. **Four canonical processes** — isobaric (constant P, horizontal line), isochoric (constant V, vertical line), isothermal (constant T, PV = const hyperbola), adiabatic (no heat exchange, PV^γ = const steeper hyperbola).
4. **Reversibility — the physicist's fiction** — a reversible process is quasi-static, frictionless, and can be run backwards. No real process is reversible. But reversible processes are the limiting ideal, and the Second Law is stated about them.
5. **Path dependence of work and heat** — between the same two states, different paths do different amounts of work and transfer different amounts of heat. Only ΔU cares about the endpoints.
6. **Cycles and net work** — a closed loop returns U to its starting value. ΔU = 0 over a cycle, so Q_net = W_net = area of the loop. Clockwise = engine (work out); counter-clockwise = refrigerator (work in).
7. **What's next** — specific processes at constant T or with zero heat exchange behave very differently. → FIG.07.

**Scenes to build (3):**

| File | Purpose |
|---|---|
| `pv-diagram-scene.tsx` | Interactive PV plane. Drag the state point to sketch a path. Area under the path shaded as "work." Toggle between the four canonical processes; each draws itself automatically from start state. |
| `cycle-work-scene.tsx` | A closed loop on the PV diagram. "Run cycle" animates the point around it. Net work = enclosed area, displayed as a number. Reverse-direction button flips engine ↔ refrigerator. |
| `reversible-vs-irreversible-scene.tsx` | Two piston animations side-by-side. Left: slow, quasi-static expansion. Right: sudden release. Both reach the same final state; the left does more work and can be reversed. |

**Physicists (aside):**
- Benoît Clapeyron *(exists — introduced in FIG.04)*
- Sadi Carnot *(NEW — French military engineer, 1796-1832, son of Napoleon's "Organiser of Victory," wrote the founding work of thermodynamics at age 28 — *Réflexions sur la puissance motrice du feu* (1824) — then died in the Paris cholera epidemic at 36. His notebooks, published posthumously, show he had already anticipated the first law.)*

**Glossary terms:**
- `work-thermodynamic` — concept (reuse from FIG.05)
- `pv-diagram` — concept
- `isobaric-process` — concept
- `isochoric-process` — concept
- `isothermal-process` — concept (stub; detailed in FIG.07)
- `adiabatic-process` — concept (stub; detailed in FIG.07)
- `reversible-process` — concept
- `quasi-static-process` — concept

**Reading minutes:** 11.

---

### FIG.07 — Isothermal and Adiabatic Processes

**Hook.** Pump a bicycle tyre fast and the pump barrel gets hot; pump it slow and it barely warms. Same air, same pressure change, totally different temperature outcome. The difference between adiabatic and isothermal is built into every tyre valve on Earth.

**Sections (7):**

1. **Isothermal processes** — T held constant (by a slow pump against a heat reservoir). For an ideal gas, U depends only on T, so ΔU = 0. Therefore Q = W = nRT ln(V₂/V₁).
2. **Adiabatic processes** — Q = 0 (fast, or perfectly insulated). No heat crosses the boundary. ΔU = −W. The gas cools when it expands, heats when it's compressed.
3. **The adiabatic exponent γ** — ratio of heat capacities C_p/C_v. Monatomic gas: 5/3. Diatomic at room T: 7/5. Why = equipartition (FIG.17). For now: empirical.
4. **PV^γ = constant** — the adiabatic curve is steeper than the isotherm on a PV plot. Derivation in two lines from the first law and dU = nC_v dT.
5. **Diesel engines and cloud formation** — real-world adiabats. A diesel compression ratio of ~20 heats air enough to ignite fuel, no spark plug. Moist air rising in the atmosphere cools adiabatically and condenses into cloud at the dew point.
6. **Irreversible expansion — the Joule experiment** — Joule let a gas expand into an evacuated chamber (free expansion). No work done, no heat transferred; for an ideal gas, no temperature change. Proves that for an ideal gas U = U(T) only.
7. **What's next** — we have engines on PV diagrams. What's the best one? → Module 3.

**Scenes to build (3):**

| File | Purpose |
|---|---|
| `isothermal-vs-adiabatic-scene.tsx` | PV plot. Start at the same state; compress the gas by the same ΔV along an isotherm (red) and along an adiabat (cyan). Final pressures and temperatures both readout; the adiabat ends hotter and higher-P. |
| `bicycle-pump-scene.tsx` | A hand pump with a speed slider. Slow stroke ≈ isothermal (temperature barely rises). Fast stroke ≈ adiabatic (temperature jumps). Visual thermometer on the barrel. |
| `cloud-formation-scene.tsx` | A moist air parcel rising through an atmospheric column. Pressure decreases with altitude; parcel expands adiabatically and cools. At the lifting condensation level, droplets appear — cloud base. |

**Physicists (aside):**
- Siméon Denis Poisson *(NEW — French mathematician, 1781-1840, derived PV^γ = const in 1823, among the first to do serious calculus on Carnot's ideas. Also Poisson's equation, Poisson distribution, Poisson bracket — one of the densest namesake records in physics.)*
- James Joule *(exists)*

**Glossary terms:**
- `isothermal-process` — concept (upgrade from stub)
- `adiabatic-process` — concept (upgrade from stub)
- `adiabatic-exponent` — concept
- `free-expansion` — concept
- `heat-reservoir` — concept

**Reading minutes:** 12.

---

## Module 3 · The Second Law

### FIG.08 — Heat Engines and Sadi Carnot

**Hook.** In 1824, a 28-year-old French military engineer named Sadi Carnot — son of Lazare Carnot, Napoleon's "Organiser of Victory" — published a single slim book: *Réflexions sur la puissance motrice du feu*. It sold poorly. No one noticed. Eight years later he died of cholera, aged 36. Clapeyron rescued the ideas a decade after; Clausius and Kelvin built the Second Law on them twenty years after that. The most important thermodynamics book ever written was written by a man who died thinking he had failed.

**Sections (7):**

1. **What a heat engine is** — a device that takes heat from a hot reservoir, converts some to work, dumps the rest into a cold reservoir. Repeats. Steam engines, internal combustion engines, power plants, your body.
2. **Efficiency** — η = W/Q_h. How much of the input heat becomes useful work. Real engines: 20-60%. The rest goes out the exhaust or the radiator.
3. **The central question** — can we do better? Is there a maximum efficiency set by physics, independent of the engine's design? Carnot's answer: *yes*.
4. **The Carnot cycle** — isothermal expansion at T_h (absorbing Q_h) → adiabatic expansion (cools to T_c) → isothermal compression at T_c (dumping Q_c) → adiabatic compression (back to T_h). Four processes, all reversible.
5. **Carnot's efficiency** — η_Carnot = 1 − T_c/T_h. Depends only on the reservoir temperatures. Not on the working substance (air, water, anything). A shocking universal result, derived without any microscopic picture at all.
6. **Why Carnot's cycle is the best** — Carnot's theorem: no engine operating between two reservoirs can exceed Carnot efficiency. Any reversible engine hits it exactly. Proven by a *reductio*: a super-Carnot engine could drive a Carnot refrigerator to produce net work from one reservoir — forbidden by the Second Law (FIG.09).
7. **What's next** — Carnot's result is prophetic but we haven't said *why* it's impossible to beat. That's the Second Law. → FIG.09.

**Scenes to build (3):**

| File | Purpose |
|---|---|
| `carnot-cycle-scene.tsx` | PV diagram with the four Carnot segments. "Run cycle" animates the working gas around the loop. Readouts: Q_h absorbed, Q_c released, W = Q_h − Q_c, η = W/Q_h, and the theoretical η = 1 − T_c/T_h. They match. |
| `engine-efficiency-bars-scene.tsx` | Bar chart: real engines vs Carnot limit. Coal power plant (~40%, Carnot limit ~60%), car engine (~25%, Carnot ~55%), steam turbine (~45%), human muscle (~25%). Hover for one-line explanation. |
| `ts-diagram-scene.tsx` | The less-famous T-S (temperature vs entropy) diagram. Carnot cycle on T-S is a *rectangle* — the cleanest possible representation. Previews entropy, setting up FIG.10. |

**Physicists (aside):**
- Sadi Carnot *(exists — introduced in FIG.06 aside; fully profiled here)*
- Lazare Carnot *(NEW — Sadi's father, mathematician, politician, "Organiser of Victory" under the French Revolution and Napoleon, exiled after 1815, wrote on mechanics and geometry. His scientific interests shaped Sadi.)*

**Glossary terms:**
- `heat-engine` — concept
- `carnot-cycle` — concept
- `carnot-efficiency` — concept
- `efficiency` — concept
- `heat-reservoir` — concept (reuse from FIG.07)
- `working-substance` — concept

**Reading minutes:** 13.

---

### FIG.09 — The Second Law (Clausius and Kelvin)

**Hook.** Rudolf Clausius, Zürich, 1865. He has the equations. He needs a name. From the Greek *trope* (transformation) he forges *Entropie* — deliberately modelled on *Energie*, so that the two central words of physics would rhyme. He writes two sentences that still chill: "The energy of the universe is constant. The entropy of the universe tends to a maximum."

**Sections (7):**

1. **The problem** — the first law tells us energy is conserved but says nothing about direction. A hot coffee spontaneously cooling is consistent with the first law. So is a cold coffee spontaneously heating. Only one ever happens.
2. **Clausius statement** — heat does not flow spontaneously from a cold body to a hot body. A refrigerator moves heat the wrong way, but only by consuming work.
3. **Kelvin-Planck statement** — no process can convert heat entirely into work with no other effect. A 100%-efficient engine is forbidden. You always have to dump waste heat somewhere.
4. **Equivalence of the two statements** — prove that violating one lets you violate the other. A classic *reductio* proof, done in a page. Both statements are the Second Law in different dress.
5. **Perpetual motion of the second kind** — an engine that extracts work from a single reservoir (say, the ocean). Doesn't violate the first law. Does violate the second. The US Patent Office still requires a working model for any "perpetual motion" claim; this is why.
6. **Clausius's inequality** — for any cycle, ∮ dQ/T ≤ 0, with equality for reversible cycles. The seed from which entropy is about to grow. → FIG.10.
7. **What's next** — if ∮ dQ/T = 0 for reversible cycles, then dQ_rev/T is the differential of some state function. Clausius christens it S, for entropy. → FIG.10.

**Scenes to build (2):**

| File | Purpose |
|---|---|
| `clausius-vs-kelvin-scene.tsx` | Two forbidden engines side by side. Left: heat spontaneously flowing cold→hot (Clausius violation). Right: engine converting heat to work with no exhaust (Kelvin violation). Drag a piece of one into the other; a hybrid construction shows the two statements are equivalent. |
| `perpetual-motion-scene.tsx` | A proposed "ocean engine" pulling heat from seawater and producing shaft work, no cold reservoir. Press "run"; it fails — second law violation flagged. Switch on a cold reservoir (deep ocean); now it works, with efficiency bounded by (T_surface − T_deep)/T_surface. |

**Physicists (aside):**
- Rudolf Clausius *(NEW — German theoretical physicist, 1822-1888, gave thermodynamics its formal structure: the second law as inequality, the word "entropy," the Clausius-Clapeyron relation, the mechanical theory of heat. Wounded in the Franco-Prussian War.)*
- Lord Kelvin / William Thomson *(exists)*
- Max Planck *(NEW — German physicist, 1858-1947, tightened Kelvin's statement into its modern form as a young thermodynamicist in the 1880s. His later work on the blackbody spectrum will crack thermo open into quantum mechanics — cameo appearance; full profile in the Quantum branch.)*

**Glossary terms:**
- `second-law-of-thermodynamics` — concept
- `clausius-statement` — concept
- `kelvin-planck-statement` — concept
- `perpetual-motion` — concept
- `clausius-inequality` — concept

**Reading minutes:** 12.

---

### FIG.10 — Entropy as Heat-Over-Temperature

**Hook.** Clausius, again, 1854. He notices that for any reversible cycle, the quantity ∮ dQ/T vanishes. That means dQ_rev/T is an exact differential — the differential of something. Something is conserved on reversible trips, and grows on irreversible ones. He names it entropy, S, and drops it into physics with the certainty of a man who knows he's found the pivot of the universe.

**Sections (7):**

1. **The definition** — dS = dQ_rev/T. Entropy change between two states is ∫ dQ/T along *any reversible path* connecting them. A state function, like U.
2. **Entropy of an ideal gas** — compute ΔS for isothermal, isochoric, isobaric, and adiabatic processes. A reversible adiabat is *isentropic* — ΔS = 0. That's why adiabats are also called isentropes.
3. **The entropy of mixing** — two gases initially separated; remove the partition; they interdiffuse. ΔS > 0 even though no heat was added. Entropy is about *available configurations*, previewing the statistical picture (FIG.13).
4. **Entropy in the universe** — for any process, ΔS_system + ΔS_surroundings ≥ 0. Equality only for reversible. This is the Second Law in its sharpest form.
5. **Heat death — Clausius sets the stage** — if S always grows, eventually it maxes out. The universe runs down to uniform temperature, no gradients, no engines, no life. Clausius spelled this out in 1865. We'll return to it in FIG.30.
6. **Worked examples** — (a) heat Q flowing from hot T_h to cold T_c. ΔS = Q(1/T_c − 1/T_h) > 0. (b) Free expansion of an ideal gas: ΔS = nR ln(V₂/V₁). Both irreversible, both positive.
7. **What's next** — what *is* entropy, really? → FIG.13 (Boltzmann).

**Scenes to build (3):**

| File | Purpose |
|---|---|
| `entropy-mixing-scene.tsx` | Two gases, red and blue, in separate halves of a box. Pull the partition. Molecules interdiffuse; ΔS plotted as a function of time, saturating at nR(x_r ln(1/x_r) + x_b ln(1/x_b)). |
| `reversible-vs-irreversible-ds-scene.tsx` | Two heat transfers between T_h and T_c. Reversible: heat flows via a Carnot engine, ΔS_universe = 0. Irreversible: heat flows directly, ΔS_universe = Q(1/T_c − 1/T_h) > 0. Bars show both. |
| `ts-diagram-redux-scene.tsx` | T-S diagram of several cycles: Carnot (rectangle), Otto (two isochores + two adiabats), Diesel (isobar + isochore + two adiabats). Enclosed area = net work. |

**Physicists (aside):**
- Rudolf Clausius *(exists)*
- Ludwig Boltzmann *(NEW — cameo here; full profile in FIG.13. Austrian physicist, 1844-1906, tied entropy to molecular disorder. Took his own life in Duino; his tombstone in Vienna carries S = k log W.)*

**Glossary terms:**
- `entropy` — concept
- `entropy-of-mixing` — concept
- `isentropic-process` — concept
- `second-law-of-thermodynamics` — concept (cross-ref)
- `heat-death` — concept (stub; full treatment in FIG.30)

**Reading minutes:** 12.

---

## Module 4 · Entropy & the Arrow of Time

### FIG.11 — Microstates and Macrostates

**Hook.** Toss ten coins. The macrostate "five heads" can come from 252 different microstates; the macrostate "ten heads" from exactly one. You never see ten heads not because it's forbidden, but because there's only one way to do it and a hundred twenty other things to be instead. Thermodynamics is that idea, applied to 10²³ coins.

**Sections (7):**

1. **Microstate** — a complete specification of every molecule's position and velocity. Astronomically many degrees of freedom (~10²⁴ for a mole of gas).
2. **Macrostate** — what you can actually measure: P, V, T, N. A single macrostate corresponds to an unimaginable number of microstates.
3. **The multiplicity Ω** — the number of microstates consistent with a given macrostate. For gas mixing: Ω grows when the partition is removed, because more microstates now count.
4. **The fundamental postulate of stat mech** — all microstates of an isolated system in equilibrium are equally probable. A seemingly innocent assumption; everything follows from it.
5. **Why we see large Ω** — simple counting. If one macrostate has Ω = 10²⁰ microstates and another has Ω = 10, the system spends essentially all its time in the first. Not because the second is forbidden; because it's *overwhelmed*.
6. **The two-box gas** — N molecules in a box; consider the macrostate where k are on the left. The multiplicity is C(N,k), binomially peaked at k = N/2 with standard deviation √(N/4). For N = 10²³, deviations of one part in 10¹¹ are already unheard of.
7. **What's next** — a formula connecting Ω to entropy. → FIG.12.

**Scenes to build (2):**

| File | Purpose |
|---|---|
| `coin-multiplicity-scene.tsx` | Toss N coins (slider: 10 → 1000). Bar histogram of outcomes by number-of-heads. Curve fits a Gaussian centred at N/2 with width √(N)/2. As N grows, the peak sharpens dramatically. |
| `two-box-gas-scene.tsx` | N molecules bouncing in a two-chamber box. N slider (10 → 500). Live histogram of left-chamber occupancy. For small N you see wild fluctuations; for large N the ratio sits near 0.5 forever. |

**Physicists (aside):**
- Ludwig Boltzmann *(exists — introduced in FIG.10 aside)*
- James Clerk Maxwell *(NEW here but crossovers into EM branch — Scottish physicist, 1831-1879, introduced statistical methods into gas theory with the Maxwell distribution 1860, formulated electromagnetism, died at 48 of the same cancer that took his mother at the same age.)*

**Glossary terms:**
- `microstate` — concept
- `macrostate` — concept
- `multiplicity` — concept
- `fundamental-postulate-of-statistical-mechanics` — concept
- `ensemble` — concept (stub; full in FIG.19)

**Reading minutes:** 10.

---

### FIG.12 — Boltzmann's Formula: S = k log W

**Hook.** Ludwig Boltzmann, Vienna, 1877. He writes S = k log W, connecting the macroscopic entropy to the microscopic count of arrangements. The formula is so central that after he dies in 1906, his colleagues carve it on his tombstone in the Vienna Zentralfriedhof. It's still there.

**Sections (7):**

1. **The formula** — S = k_B ln Ω. k_B is Boltzmann's constant, 1.38 × 10⁻²³ J/K. Entropy is the logarithm of the number of microstates.
2. **Why logarithm** — entropy is extensive (doubling the system doubles S) but Ω is multiplicative (doubling the system squares Ω). ln turns multiplication into addition. Only a logarithm can do the job.
3. **Why Boltzmann's constant** — it sets the unit bridge between microscopic counting (dimensionless Ω) and macroscopic joules-per-kelvin. Really it's a conversion factor between kelvin and joules: k_B T is the natural energy scale of thermal motion.
4. **Recovering thermodynamics** — from S = k ln Ω and the counting of microstates for an ideal gas, you recover the Sackur-Tetrode equation and PV = NkT. Thermodynamics *derived* from molecules.
5. **The microscopic second law** — isolated systems evolve toward macrostates of higher Ω simply because there are more of them. Not a mystical law; a counting truth.
6. **Boltzmann's tragedy** — his statistical vision was fiercely opposed by Mach and Ostwald, who denied atoms existed. Boltzmann battled depression and isolation; he hanged himself during a family holiday in Duino, 1906. Einstein's 1905 work on Brownian motion (FIG.18) had already made atoms undeniable, but Boltzmann never fully knew his vindication had arrived.
7. **What's next** — if entropy always grows, time has a direction. → FIG.13.

**Scenes to build (2):**

| File | Purpose |
|---|---|
| `boltzmann-tombstone-scene.tsx` | A stylised rendering of the Vienna Zentralfriedhof bust with the formula carved. Hover on each symbol (S, k, log, W) for the meaning. Click "derive" to animate the steps from multiplicity counting to the formula. |
| `multiplicity-to-entropy-scene.tsx` | Two gas chambers. Compute Ω₁, Ω₂ for each macrostate (before and after mixing). Display k ln(Ω) for each. The difference matches the mixing entropy from FIG.10, confirming the bridge. |

**Physicists (aside):**
- Ludwig Boltzmann *(exists — full profile here)*
- Ernst Mach *(NEW — Austrian physicist-philosopher, 1838-1916, anti-atomist, argued atoms were metaphysical nonsense. Gave us the Mach number of supersonic flight and influenced young Einstein, who later disagreed with him about everything.)*
- Wilhelm Ostwald *(NEW — Baltic-German chemist, 1853-1932, Nobel 1909, fought Boltzmann's atoms for two decades and finally conceded after Einstein's Brownian motion paper)*

**Glossary terms:**
- `boltzmann-constant` — constant
- `boltzmann-entropy-formula` — concept
- `extensive-quantity` — concept
- `intensive-quantity` — concept

**Reading minutes:** 12.

---

### FIG.13 — The Arrow of Time

**Hook.** A video of a wine glass smashing can be run backwards; no law of Newtonian mechanics is violated. Yet we all know which direction time flows. Arthur Eddington called this "the arrow of time" in 1927, and pointed directly at entropy.

**Sections (7):**

1. **Time-reversal symmetry of microphysics** — Newton's equations, Maxwell's equations, Schrödinger's equation are all invariant under t → −t. Run any movie of atomic collisions backwards; nothing looks wrong.
2. **The macroscopic arrow** — and yet. Scrambled eggs don't unscramble; tea and milk don't unmix; young people age, old people don't un-age. The arrow is *statistical*, not dynamical.
3. **Loschmidt's paradox** — Josef Loschmidt, Boltzmann's friend and rival, 1876: if microscopic laws are time-symmetric, how can you derive a one-way macroscopic law? Boltzmann's answer: initial conditions. The universe started in a low-entropy state.
4. **Zermelo's recurrence paradox** — Ernst Zermelo, 1896: Poincaré proved that any bounded system returns arbitrarily close to its starting state. Doesn't that forbid a monotonic entropy growth? Boltzmann's answer: yes, but the recurrence time is unthinkably long (for a mole of gas, many times the age of the universe to a huge power).
5. **The past hypothesis** — modern answer to Loschmidt. The observed arrow of time reflects the fact that the Big Bang began in an extraordinarily low-entropy state. Everything since has been relaxation toward equilibrium.
6. **Maxwell's demon** — in 1867 Maxwell imagined a tiny creature who could sort fast molecules from slow ones, decreasing entropy with no work. Took a century to dissolve the paradox: Szilard, Landauer, Bennett — the demon's *memory* has to be erased, and erasure costs entropy. → FIG.20.
7. **What's next** — entropy from microstates, counted → Maxwell-Boltzmann (FIG.17) and Brownian motion (FIG.18).

**Scenes to build (3):**

| File | Purpose |
|---|---|
| `reversible-movies-scene.tsx` | Two side-by-side videos. Left: billiard balls colliding — equally plausible forwards and backwards. Right: a glass shattering — obviously wrong backwards. Caption: the difference is entropy. |
| `loschmidt-reversal-scene.tsx` | Simulate a gas diffusing to equilibrium. At any moment, click "reverse all velocities." For a few steps the gas un-mixes (Loschmidt's point). Then numerical round-off destroys the reversal, and it re-mixes. Demonstrates the sensitivity of the arrow. |
| `maxwells-demon-scene.tsx` | Two-chamber gas, all molecules initially mixed by temperature. A demon at the trap-door lets only fast molecules go right, slow molecules go left. Chambers separate into hot and cold. Toggle "demon memory" — when forced to erase, entropy rises by exactly k ln 2 per bit. |

**Physicists (aside):**
- Josef Loschmidt *(NEW — Austrian physicist-chemist, 1821-1895, estimated the size of air molecules in 1865 (Loschmidt's number ≈ Avogadro), and posed the reversibility objection to Boltzmann)*
- Ernst Zermelo *(NEW — German mathematician, 1871-1953, better remembered for set theory (Zermelo-Fraenkel axioms), also posed the recurrence paradox to thermo in 1896)*
- James Clerk Maxwell *(exists — introduced in FIG.11 aside)*
- Arthur Eddington *(NEW — English astrophysicist, 1882-1944, "arrow of time" coiner (1927), measured light-bending during the 1919 eclipse to confirm general relativity)*

**Glossary terms:**
- `arrow-of-time` — concept
- `loschmidt-paradox` — concept
- `poincare-recurrence` — concept
- `past-hypothesis` — concept
- `maxwells-demon` — concept

**Reading minutes:** 14.

---

## Module 5 · Kinetic Theory of Gases

### FIG.14 — The Ideal Gas Law

**Hook.** Boyle's law, 1662 — pressure and volume trade off. Charles's law, 1787 — volume grows with temperature. Avogadro, 1811 — equal volumes of gas at the same P, T hold equal numbers of molecules. Three centuries of laboratory arithmetic collapse into one line: PV = nRT.

**Sections (7):**

1. **Boyle's law** — at fixed T, PV = constant. Robert Boyle and his assistant Robert Hooke with a J-shaped mercury tube, Oxford, 1660s. The first quantitative gas law.
2. **Charles's law** — at fixed P, V ∝ T. Jacques Charles, 1787, unpublished. Gay-Lussac independently published 1802. The straight-line extrapolation back to V = 0 hints at absolute zero at −273 °C.
3. **Avogadro's hypothesis** — equal volumes of gas at the same T, P contain equal numbers of molecules. Pure theory in 1811; unaccepted for fifty years. The number is 6.022 × 10²³ per mole.
4. **The combined law** — PV = nRT. R = 8.314 J/(mol·K). Same R for every gas at low enough density. A universal number.
5. **Rewriting in terms of N, k_B** — PV = Nk_B T. Molecules, not moles. The form statistical mechanics will use.
6. **When it fails** — at high density (van der Waals), low temperature (quantum effects: FIG.28), or near the critical point (FIG.23). The "ideal" in ideal gas is the assumption that molecules are points with no interactions. Real gases correct by order (b − a/kT).
7. **What's next** — why does PV = NkT work? Because of molecular collisions with the walls. → FIG.15.

**Scenes to build (2):**

| File | Purpose |
|---|---|
| `gas-laws-triple-scene.tsx` | Three-panel scene. Panel 1: P vs 1/V (Boyle, straight line). Panel 2: V vs T at constant P (Charles, straight line hitting zero at −273 °C). Panel 3: PV/nR vs T (collapses all gases onto one line at low density). |
| `ideal-vs-real-gas-scene.tsx` | Compressibility factor Z = PV/nRT plotted vs P at several T. Z = 1 for ideal. Real gases dip below 1 at moderate P (attraction wins), climb above 1 at high P (repulsion wins). Shows where "ideal" starts to fail. |

**Physicists (aside):**
- Robert Boyle *(NEW — Anglo-Irish natural philosopher, 1627-1691, "father of chemistry" in the sense that he separated it from alchemy, co-founder of the Royal Society, Boyle's law 1662)*
- Jacques Charles *(NEW — French physicist and balloonist, 1746-1823, first hydrogen-balloon flight 1783, linear expansion law c. 1787)*
- Amedeo Avogadro *(NEW — Italian physicist, 1776-1856, stated the equal-volumes-equal-molecules hypothesis 1811; unrecognised in his lifetime, vindicated by Cannizzaro at the 1860 Karlsruhe Congress)*
- Joseph Louis Gay-Lussac *(NEW — French physicist-chemist, 1778-1850, discovered the law of combining gas volumes and independently published Charles's law)*

**Glossary terms:**
- `ideal-gas-law` — concept
- `boyles-law` — concept
- `charles-law` — concept
- `avogadro-number` — constant
- `gas-constant` — constant
- `compressibility-factor` — concept

**Reading minutes:** 11.

---

### FIG.15 — Pressure from Molecular Collisions

**Hook.** Daniel Bernoulli, St Petersburg, 1738. Deep in his *Hydrodynamica*, he explains gas pressure as the patter of molecular collisions on container walls. No one notices. For a hundred and twenty years, chemists treat gases as continuous fluids. Clausius re-derives the same picture in 1857; then Maxwell generalises; then kinetic theory is born.

**Sections (7):**

1. **Bernoulli's picture** — a gas is a crowd of little particles flying in straight lines between collisions. Pressure is the average rate of momentum transfer to the walls per unit area.
2. **The derivation** — one-dimensional first. A molecule of mass m, speed v_x, bouncing elastically off the wall, delivers Δp = 2mv_x per hit, with frequency v_x/(2L). Sum over all N molecules. Generalise to 3D. Result: PV = (1/3) N m ⟨v²⟩.
3. **Matching PV = NkT** — if kinetic theory is right, (1/3) m ⟨v²⟩ = kT. Rearrange: (1/2) m ⟨v²⟩ = (3/2) kT. Average translational kinetic energy per molecule is (3/2) kT. The *meaning* of temperature.
4. **Root-mean-square speed** — v_rms = √(3kT/m). For N₂ at room T, about 510 m/s. For H₂, about 1900 m/s. Why hydrogen escapes Earth's atmosphere and nitrogen doesn't.
5. **Temperature is kinetic energy per molecule** — at least, for the translational part. The quantitative meaning of "hotter": molecules moving faster on average. A concept Galileo didn't have; Bernoulli glimpsed it; Clausius made it exact.
6. **What about pressure in a liquid?** — the same mechanism, obscured by strong intermolecular forces. Liquid pressure is the difference between inward cohesion and outward kinetic "bombardment." Hand-wave only; fluids branch handles it.
7. **What's next** — molecules don't all move at the same speed. What's the distribution? → FIG.16.

**Scenes to build (2):**

| File | Purpose |
|---|---|
| `molecular-pressure-scene.tsx` | A 2D box of bouncing molecules. Slider: N (number of molecules) and T (average speed). Pressure computed live as (momentum transfer to walls)/(area × time). Matches NkT/V on the readout. |
| `rms-speed-scene.tsx` | Velocity-magnitude histogram for a simulated gas. Mean, RMS, and most-probable speed marked. Vary T and m (gas species: H₂, He, N₂, Ar, Xe) to see how the distribution shifts. |

**Physicists (aside):**
- Daniel Bernoulli *(NEW — Swiss mathematician, 1700-1782, Bernoulli equation in fluid dynamics, kinetic theory of gases in *Hydrodynamica* (1738) a century ahead of its time. One of eight Bernoullis who mattered in science; the most productive of them.)*
- Rudolf Clausius *(exists)*
- James Clerk Maxwell *(exists)*
- August Krönig *(NEW — German physicist, 1822-1879, independently re-derived kinetic theory of pressure 1856, just before Clausius; his short paper pushed Clausius to publish his fuller treatment)*

**Glossary terms:**
- `kinetic-theory` — concept
- `rms-speed` — concept
- `equipartition` — concept (stub; full treatment in FIG.17)
- `mean-free-path` — concept (stub; deep dive at end of FIG.15)

**Reading minutes:** 11.

---

### FIG.16 — The Maxwell-Boltzmann Distribution

**Hook.** Maxwell, Aberdeen, 1859. He's 28, a recently appointed professor, the year before *On the Stability of Saturn's Rings* and a decade before the electromagnetic equations. He derives — by pure symmetry arguments — the distribution of molecular speeds in a gas. Boltzmann will generalise it in 1871. It is the first probability distribution in physics.

**Sections (7):**

1. **Setting up the problem** — molecules don't all move at the same speed. The components v_x, v_y, v_z should be independent (Maxwell's argument) and should each be Gaussian (symmetry forces it). The magnitude v = √(v_x² + v_y² + v_z²) is therefore a chi-distribution.
2. **The formula** — f(v) = 4π (m/2πkT)^(3/2) v² exp(−mv²/2kT). Peak at v_mp = √(2kT/m). Mean ⟨v⟩ = √(8kT/πm). RMS v_rms = √(3kT/m). v_mp < ⟨v⟩ < v_rms, always.
3. **Why the v² factor** — the phase-space volume element: more "room" for faster-speed states than slower ones. The Gaussian suppression takes over at high v.
4. **The tail matters** — escape velocities, chemical reaction rates, and evaporation all depend on the *tail* of the Maxwell-Boltzmann distribution. The Arrhenius factor exp(−E_a/kT) falls straight out.
5. **Boltzmann's generalisation** — for a system in thermal contact with a reservoir at T, the probability of a microstate with energy E is proportional to exp(−E/kT). The Boltzmann factor. The engine of all of statistical mechanics. → FIG.19.
6. **Experimental verification — Stern and Zartman** — Otto Stern, 1920s, measured molecular speeds by spinning a disc with a slot. The distribution matched Maxwell's prediction. Confirmed again and again since.
7. **What's next** — one molecule, thermal motion, visible under a microscope. → FIG.18.

**Scenes to build (3):**

| File | Purpose |
|---|---|
| `maxwell-boltzmann-scene.tsx` | f(v) plotted for an ideal gas. Sliders: T and molecular mass. Shaded markers for v_mp, ⟨v⟩, v_rms. Area under the tail above a user-set threshold displayed (the "fast fraction"). |
| `boltzmann-factor-scene.tsx` | Exponential plot of exp(−E/kT) vs E, for several T. A threshold slider picks E_a; the fraction above E_a displays on a log scale. At low T, tail fraction plummets; at high T, rises. |
| `stern-experiment-scene.tsx` | Molecules evaporating from a hot source, passing through a slit, entering a chopper disc with a spinning slot. Deposition profile on the detector builds up the speed distribution. Vary disc rotation speed; see the correspondence to f(v). |

**Physicists (aside):**
- James Clerk Maxwell *(exists — full profile here)*
- Ludwig Boltzmann *(exists)*
- Otto Stern *(NEW — German-American physicist, 1888-1969, molecular beam techniques, Stern-Gerlach experiment (quantum branch), Nobel 1943)*

**Glossary terms:**
- `maxwell-boltzmann-distribution` — concept
- `boltzmann-factor` — concept
- `most-probable-speed` — concept
- `arrhenius-equation` — concept

**Reading minutes:** 12.

---

### FIG.17 — Equipartition and Degrees of Freedom

**Hook.** Maxwell, again, 1860. He proves that in equilibrium every quadratic degree of freedom in the Hamiltonian carries an average energy of (1/2) kT. This is the equipartition theorem. It explains heat capacities of gases and solids at a single stroke. It also fails in three specific ways — and each failure breaks thermodynamics open into quantum mechanics.

**Sections (7):**

1. **Degrees of freedom** — a monatomic gas has 3 (translational). A diatomic gas has 5 (3 translational + 2 rotational) — or 7 at high T (+ 2 vibrational). A solid has 6 per atom (3 × kinetic + 3 × potential springs).
2. **The theorem** — each quadratic term in the energy contributes (1/2)kT to the average energy. Hence ⟨E⟩ = (f/2) NkT where f is the number of quadratic degrees of freedom.
3. **Heat capacities** — C_v = (f/2) Nk. Monatomic: (3/2) R per mole ≈ 12.5 J/(mol·K). Diatomic at room T: (5/2) R ≈ 20.8. Solids: 3R ≈ 25 (the Dulong-Petit value from FIG.03).
4. **The adiabatic exponent** — γ = (f+2)/f. Monatomic γ = 5/3. Diatomic γ = 7/5. Explains the value promised in FIG.07.
5. **Equipartition fails (1): diatomic gases at low T** — H₂ below 100 K behaves as monatomic. The rotational degrees freeze out. Classical physics forbids this; quantum mechanics explains it (kT falls below ħω_rot).
6. **Equipartition fails (2): solids at low T** — Dulong-Petit breaks below the Debye temperature. Einstein 1907 and Debye 1912 quantised the vibrations — phonons. A second warning bell for classical physics.
7. **Equipartition fails (3): blackbody radiation** — the ultraviolet catastrophe. Equipartition of the infinite modes of the electromagnetic field predicts infinite energy. Planck in 1900 quantises it; quantum mechanics is born. Full story in the QM branch.

**Scenes to build (2):**

| File | Purpose |
|---|---|
| `degrees-of-freedom-scene.tsx` | Three molecules: He (3 DOF), N₂ (5 DOF low-T, 7 DOF high-T), crystal atom (6 DOF). Toggle each; animated arrows show translational, rotational, vibrational motions. Heat-capacity readout per molecule. |
| `equipartition-failure-scene.tsx` | C_v vs T for H₂ over many decades of temperature. Step structure: (3/2)R below 100 K (translational only), (5/2)R around room temperature (rotational unfreezes), (7/2)R above 1000 K (vibrational unfreezes). Each plateau labelled. |

**Physicists (aside):**
- James Clerk Maxwell *(exists)*
- Ludwig Boltzmann *(exists)*
- Peter Debye *(NEW — Dutch physicist-chemist, 1884-1966, Debye model of solids 1912, Nobel in chemistry 1936, fled Nazi Germany 1940)*
- Albert Einstein *(NEW here as thermo cameo — 1879-1955, his 1907 paper *"Die Plancksche Theorie der Strahlung und die Theorie der spezifischen Wärme"* used Planck's quantum to explain the low-T heat capacity of solids. Full profile in the relativity branch.)*

**Glossary terms:**
- `equipartition-theorem` — concept
- `degrees-of-freedom` — concept
- `debye-temperature` — concept
- `phonon` — concept (stub; full in condensed-matter branch)

**Reading minutes:** 12.

---

### FIG.18 — Brownian Motion

**Hook.** Robert Brown, Scottish botanist, 1827, squints through a microscope at pollen grains suspended in water. They jitter incessantly. Living? Pollen from long-dead plants jitters too. For seventy-eight years nobody explains it. Then Einstein, 1905, in one of his *annus mirabilis* papers: pollen is being kicked around by the molecules we can't see. Perrin measures it three years later and the atom is no longer a hypothesis.

**Sections (7):**

1. **Brown's observation** — pollen, dust, any small particle suspended in a fluid, jiggles randomly. Independent of pollen type, light, electricity. Persistent.
2. **Einstein's 1905 paper** — *Über die von der molekularkinetischen Theorie der Wärme geforderte Bewegung...*. Predicted ⟨x²⟩ = 2Dt for a suspended particle, with D = kT/(6πηr) (the Einstein-Stokes relation).
3. **Random walks** — the mathematical object underneath Brownian motion. After N steps of rms size ℓ, displacement grows as ℓ√N, not as Nℓ. The square-root law of diffusion.
4. **Perrin's experiments** — Jean Perrin, Paris, 1908-1909. Measured ⟨x²⟩ for tiny resin spheres. Got D, solved for k_B, got Avogadro's number independently of every other method. Nobel 1926 for "confirming the discontinuous structure of matter."
5. **The fluctuation-dissipation theorem** — Einstein's deeper insight. The *same* collisions that jiggle the particle also provide the viscous drag that slows it. Random force and friction are two faces of one mechanism. Full form: Kubo, 1957; foreshadowed in FIG.21.
6. **Where Brownian motion shows up today** — stock prices, bacterial flagellar motion, diffusion in biology, quantitative finance (Black-Scholes uses geometric Brownian motion). A thermodynamic idea that outgrew physics.
7. **What's next** — Einstein and Perrin together closed the atomism debate. Boltzmann's vision was right all along. On to statistical mechanics proper. → Module 6.

**Scenes to build (2):**

| File | Purpose |
|---|---|
| `brownian-walk-scene.tsx` | A tracked particle in 2D, driven by random kicks. Trail visible. Run-time counter. Plot of ⟨x²⟩(t) accumulates beside the scene — linear, confirming the diffusion law. Drag slider adjusts kick magnitude. |
| `perrin-counting-scene.tsx` | Stylised microscope view with many suspended spheres. User drops a probe at a point and watches its displacement over time. Histogram of displacements fits a Gaussian whose width ∝ √t. Readout: k_B derived from measured D (assumed η, r known). |

**Physicists (aside):**
- Robert Brown *(NEW — Scottish botanist, 1773-1858, observed the motion in pollen 1827, also discovered the cell nucleus, named "Brownian")*
- Albert Einstein *(exists)*
- Jean Baptiste Perrin *(NEW — French physicist, 1870-1942, experimental demolition of anti-atomism, wrote *Les Atomes* (1913), Nobel 1926)*

**Glossary terms:**
- `brownian-motion` — concept
- `diffusion` — concept
- `einstein-relation` — concept
- `random-walk` — concept

**Reading minutes:** 11.

---

## Module 6 · Statistical Mechanics

### FIG.19 — The Boltzmann Distribution and Partition Function

**Hook.** Gibbs, Yale, 1902. He publishes *Elementary Principles in Statistical Mechanics* — coined the term. Working alone in New Haven, he puts thermodynamics on a new foundation that Boltzmann had only glimpsed. The partition function is the central object. From it, everything thermo flows.

**Sections (7):**

1. **The canonical ensemble** — a system in thermal contact with a reservoir at temperature T. Not isolated. Its energy fluctuates; its temperature is fixed.
2. **Boltzmann distribution** — the probability of microstate i with energy E_i is p_i = exp(−βE_i)/Z where β = 1/kT. The universal form.
3. **The partition function Z = Σ exp(−βE_i)** — sum over all microstates of the Boltzmann factor. A *normaliser*, but also the generating function of everything thermodynamic.
4. **Free energy** — F = −kT ln Z. The Helmholtz free energy. From F all the thermodynamic observables fall out by differentiation: S = −∂F/∂T, P = −∂F/∂V, ⟨E⟩ = −∂(ln Z)/∂β, C_v = ∂⟨E⟩/∂T.
5. **Examples** — two-level system: Z = 1 + exp(−βε). Ideal gas: Z = V^N/(λ³N!N), yielding PV = NkT and the Sackur-Tetrode entropy. Harmonic oscillator: Z = 1/(1 − exp(−βħω)), which will matter for FIG.28.
6. **Three ensembles** — microcanonical (fixed E, N, V), canonical (fixed T, N, V), grand canonical (fixed T, μ, V). Same physics, different bookkeeping. The grand canonical is essential for quantum gases.
7. **What's next** — phase transitions, where Z develops a non-analyticity. → Module 7.

**Scenes to build (2):**

| File | Purpose |
|---|---|
| `two-level-system-scene.tsx` | A ladder with two rungs at 0 and ε. Temperature slider. Population of each level shown as bar heights, given by Boltzmann factors. As T → 0, all in ground; as T → ∞, 50/50. Heat capacity plotted live beneath, showing the Schottky anomaly — a hump at kT ≈ ε. |
| `partition-to-thermo-scene.tsx` | Input: Z(T, V, N) for a simple system (dropdown: 2-level, HO, ideal gas). Derived outputs: F, S, ⟨E⟩, C_v, P — each as a live plot vs T. Shows the partition function as the generator. |

**Physicists (aside):**
- Josiah Willard Gibbs *(NEW — American mathematical physicist, 1839-1903, Yale his entire life, worked alone and in silence, founded statistical mechanics in *Elementary Principles* (1902), chemical-thermodynamics with the Gibbs phase rule and the Gibbs free energy. Vectors owe him their modern form.)*
- Ludwig Boltzmann *(exists)*

**Glossary terms:**
- `partition-function` — concept
- `boltzmann-distribution` — concept
- `canonical-ensemble` — concept
- `microcanonical-ensemble` — concept
- `grand-canonical-ensemble` — concept
- `helmholtz-free-energy` — concept

**Reading minutes:** 13.

---

### FIG.20 — Free Energies, Maxwell's Demon Resolved

**Hook.** Leo Szilard, Berlin, 1929 — a young Hungarian working with Einstein. He realises Maxwell's demon is a *measurement* problem. The demon has to know which molecule is fast before it opens the door. Szilard shows knowing costs entropy. Landauer, 1961, sharpens it: *erasing* costs k ln 2 per bit. The demon was never free; Maxwell's century-old paradox dissolves into information theory.

**Sections (7):**

1. **Four free energies, one shape** — U (internal), H = U + PV (enthalpy), F = U − TS (Helmholtz), G = U − TS + PV (Gibbs). Each is the right "natural" potential for different constraints.
2. **Gibbs free energy and chemistry** — at fixed T and P (the usual lab conditions), a spontaneous process is one with ΔG < 0. Chemical thermodynamics in three characters.
3. **Legendre transforms** — the mathematical operation relating the free energies. U → F by trading entropy for temperature as the natural variable. Borrowed from classical mechanics (Lagrangian → Hamiltonian).
4. **Maxwell's demon redux** — Szilard's engine: a one-molecule gas, a partition inserted by the demon, apparent work extracted. Where's the catch? The demon's memory.
5. **Landauer's principle** — erasing one bit of information costs at least kT ln 2 of heat. Rolf Landauer, IBM, 1961. A bound from thermodynamics alone, independent of implementation.
6. **The second law survives** — the total entropy of gas + demon + memory never decreases. Maxwell's paradox was thermodynamics refusing to include the demon in the bookkeeping.
7. **Forward** — entropy, information, thermodynamics of computation. A theme that keeps growing: quantum error correction, black-hole information, the physics of learning.

**Scenes to build (2):**

| File | Purpose |
|---|---|
| `four-free-energies-scene.tsx` | A quadrant diagram: U (top-left, natural variables S, V), F (top-right, T, V), H (bottom-left, S, P), G (bottom-right, T, P). Legendre-transform arrows connect them. Hover on each for the definition and common use. |
| `szilard-engine-scene.tsx` | A single-molecule gas in a box. Press "measure position." A partition drops. The molecule pushes the piston, doing work kT ln 2. Then the cycle has to reset — erasing the measurement costs kT ln 2. Net work: zero. Second law saved. |

**Physicists (aside):**
- Josiah Willard Gibbs *(exists)*
- Leo Szilard *(NEW — Hungarian-American physicist, 1898-1964, drafted the famous Einstein letter to FDR initiating the Manhattan Project, also invented the electron microscope (unfunded), Szilard's engine (1929), cofounded molecular biology later in life)*
- Rolf Landauer *(NEW — German-American physicist, 1927-1999, IBM, Landauer's principle 1961 — erasing a bit costs kT ln 2 of heat — the thermodynamic foundation of computing)*
- Charles H. Bennett *(NEW — American physicist, b. 1943, IBM, reversible computation, quantum teleportation, completed the resolution of Maxwell's demon)*

**Glossary terms:**
- `gibbs-free-energy` — concept
- `helmholtz-free-energy` — concept (reuse)
- `enthalpy` — concept
- `legendre-transform` — concept
- `landauer-principle` — concept
- `szilard-engine` — concept

**Reading minutes:** 12.

---

### FIG.21 — Fluctuations and the Fluctuation-Dissipation Theorem

**Hook.** Johnson, Bell Labs, 1927. He's trying to build a quieter amplifier. He discovers that any resistor at finite temperature produces electrical noise — a hiss that can't be silenced. Nyquist, the next year, derives the noise power from thermodynamics alone. It's the same randomness that jiggles Brown's pollen. Every amplifier, every transistor, every receiver is limited by the second law.

**Sections (7):**

1. **Fluctuations are real** — stat mech doesn't just predict averages. It predicts standard deviations. ⟨(ΔE)²⟩ = kT² C_v for energy in the canonical ensemble.
2. **Fluctuations scale as 1/√N** — relative fluctuations in extensive quantities drop as the system grows. For N = 10²³, they're invisible. For N = 100 (a nanostructure), they dominate.
3. **The fluctuation-dissipation theorem** — the equilibrium fluctuations of a quantity and the response of the same quantity to a small driving force are the same thing. Kubo's 1957 formal version.
4. **Johnson-Nyquist noise** — thermal voltage noise in a resistor: V²_noise = 4kTRΔf. Derived by Nyquist 1928 from the first law and the second; confirmed by Johnson 1927 in experiment.
5. **Einstein revisited** — Brownian motion (FIG.18) was the first fluctuation-dissipation theorem. The same collisions driving the particle also damp it. Einstein knew this; modern notation just made it formal.
6. **Critical opalescence** — near a phase transition, density fluctuations grow to macroscopic size. Light scatters off them. Einstein 1910, Smoluchowski 1908. A foreshadow of criticality (FIG.23).
7. **What's next** — when fluctuations *don't* die out but diverge. → FIG.23.

**Scenes to build (2):**

| File | Purpose |
|---|---|
| `fluctuation-scaling-scene.tsx` | Canonical ensemble simulation. Slider for N. Plot shows instantaneous E(t) and the running mean ⟨E⟩. For small N, wild fluctuations; for large N, flat line. Relative standard deviation computed as 1/√N. |
| `johnson-nyquist-scene.tsx` | A resistor at temperature T. Oscilloscope trace shows thermal noise voltage; its RMS fits 4kTRΔf. Vary T; amplitude rises with √T. Vary R; amplitude rises with √R. |

**Physicists (aside):**
- John B. Johnson *(NEW — Swedish-American physicist, 1887-1970, Bell Labs, discovered thermal noise 1927)*
- Harry Nyquist *(NEW — Swedish-American engineer, 1889-1976, Bell Labs, Nyquist frequency (sampling theorem), derived Johnson noise theoretically 1928)*
- Ryogo Kubo *(NEW — Japanese theoretical physicist, 1920-1995, linear response theory and the general fluctuation-dissipation theorem, 1957)*
- Albert Einstein *(exists — introduced in FIG.17 aside)*
- Marian Smoluchowski *(NEW — Polish physicist, 1872-1917, independent derivation of the Brownian-motion diffusion law at the same time as Einstein, also co-founder of statistical fluid mechanics, died young in the 1917 dysentery epidemic)*

**Glossary terms:**
- `fluctuation` — concept
- `fluctuation-dissipation-theorem` — concept
- `johnson-noise` — concept
- `critical-opalescence` — concept

**Reading minutes:** 11.

---

## Module 7 · Phase Transitions

### FIG.22 — The Clausius-Clapeyron Relation

**Hook.** An ice-skater glides. The skate's thin blade concentrates the skater's weight, raising pressure by many atmospheres under the steel. Water's melting point *drops* with pressure — unique among common substances. A thin film of liquid water lubricates the skate. The skater is literally riding on the Clausius-Clapeyron relation.

**Sections (7):**

1. **Coexistence curves in the phase diagram** — separate solid from liquid, liquid from vapour, solid from vapour. Points on them are states where two phases coexist in equilibrium.
2. **Clausius-Clapeyron derived** — along coexistence, the Gibbs energies of the two phases are equal; so dG₁ = dG₂. With dG = −SdT + VdP, this gives dP/dT = (S₂ − S₁)/(V₂ − V₁) = L/(TΔV).
3. **The water anomaly** — ice is less dense than liquid water. ΔV < 0 on melting, so dP/dT < 0. The solid-liquid line has a negative slope. Unique among common substances.
4. **Predictions that work** — the saturated vapour pressure of a liquid grows exponentially with T: ln P ≈ const − L/(RT). Why pressure cookers work (elevated boiling point at higher P), why water boils at lower T in the mountains.
5. **The triple point** — the unique (T, P) where all three phases coexist. Water's triple point, 273.16 K / 611.657 Pa, *defined* the kelvin until the 2019 SI redefinition.
6. **Beyond the critical point** — the liquid-vapour coexistence line ends at the critical point. Beyond it, no distinction between liquid and gas. → FIG.23.
7. **What's next** — what happens *at* the critical point? → FIG.23.

**Scenes to build (2):**

| File | Purpose |
|---|---|
| `clausius-clapeyron-scene.tsx` | A PT phase diagram for H₂O and CO₂, toggleable. Drag a state point; see which phase it lands in. The solid-liquid slope is visibly negative for water and positive for CO₂ — labelled. |
| `boiling-altitude-scene.tsx` | A world map with points at varying elevations. For each, plot the boiling point of water using Clausius-Clapeyron. Everest 71 °C, Death Valley 101 °C, Dead Sea 101.5 °C. Live calculation. |

**Physicists (aside):**
- Rudolf Clausius *(exists)*
- Benoît Clapeyron *(exists)*

**Glossary terms:**
- `clausius-clapeyron-relation` — concept
- `coexistence-curve` — concept
- `triple-point` — concept (upgrade from FIG.04)
- `phase-diagram` — concept

**Reading minutes:** 10.

---

### FIG.23 — Critical Phenomena and Universality

**Hook.** Thomas Andrews, Belfast, 1869. He's studying CO₂ at high pressure and finds the liquid-vapour distinction dissolves above 31 °C. The meniscus vanishes. Density fluctuations scatter light so strongly that the fluid turns milky white — *critical opalescence*. A century later, Kenneth Wilson wins the 1982 Nobel for showing that wildly different systems — magnets, fluids, polymers — have exactly the same critical behaviour, governed by a handful of universal exponents.

**Sections (7):**

1. **The critical point** — end of the liquid-vapour coexistence curve. Above T_c, no distinction between liquid and gas. For water: T_c = 647 K, P_c = 22 MPa. For CO₂: T_c = 304 K, only 31 °C — easy to reach.
2. **Critical opalescence** — density fluctuations at all length scales simultaneously. Light of every wavelength scatters. The fluid glows white. Andrews observed it, Einstein-Smoluchowski explained it, still photographed today in undergrad labs.
3. **Scaling** — near T_c, thermodynamic quantities follow power laws. ρ_liq − ρ_gas ~ (T_c − T)^β. Compressibility ~ (T − T_c)^(−γ). Specific heat ~ (T − T_c)^(−α). The exponents β, γ, α.
4. **Universality** — different fluids give the *same* critical exponents as long as the dimensionality and symmetry class match. Water and argon and xenon share one set. 3D Ising magnets share a different set. Strange symmetry classes beyond physics unite through the same numbers.
5. **Landau's mean-field theory** — Lev Landau, 1937, wrote down an expansion of free energy in powers of an order parameter. Gave a first set of critical exponents. Mostly wrong in 3D, but the framework is universal.
6. **Wilson and the renormalisation group** — Kenneth Wilson, 1971-1974. A calculation procedure that *integrates out* short-wavelength fluctuations, flowing the system to a universal fixed point. The correct exponents fall out. Nobel 1982. One of the deepest ideas of 20th-century physics.
7. **What's next** — the simplest model where all of this is visible. → FIG.24.

**Scenes to build (3):**

| File | Purpose |
|---|---|
| `critical-opalescence-scene.tsx` | A CO₂ cell animation. Approach T_c; fluctuations on all scales appear; transparent fluid turns milky white; the meniscus vanishes. |
| `critical-exponent-scene.tsx` | Log-log plot of an order parameter (ρ_liq − ρ_gas) vs |T − T_c|. Data from several different fluids collapse onto one straight line. Slope = β ≈ 0.326. Universality made visible. |
| `rg-flow-scene.tsx` | A cartoon 2D parameter space. Initial points representing different microscopic theories all flow under successive coarse-grainings to the same fixed point. Illustrates Wilson's big idea. |

**Physicists (aside):**
- Thomas Andrews *(NEW — Irish chemist-physicist, 1813-1885, discovered the critical point of CO₂ 1869, defined "critical temperature")*
- Johannes Diderik van der Waals *(NEW — Dutch physicist, 1837-1923, van der Waals equation (1873) gave the first theoretical critical point, Nobel 1910)*
- Lev Landau *(NEW — Soviet theoretical physicist, 1908-1968, superfluidity, quantum field theory, phase transitions, Landau-Ginzburg theory, survived Stalin's prisons (with Kapitza's intervention), Nobel 1962, fatal car crash that ended his career 1962)*
- Kenneth Wilson *(NEW — American physicist, 1936-2013, renormalisation group, Nobel 1982)*

**Glossary terms:**
- `critical-point` — concept (upgrade from FIG.04)
- `critical-exponent` — concept
- `universality` — concept
- `renormalisation-group` — concept
- `order-parameter` — concept
- `mean-field-theory` — concept

**Reading minutes:** 14.

---

### FIG.24 — The Ising Model

**Hook.** Wilhelm Lenz handed his student, Ernst Ising, a problem in 1920: one-dimensional chains of spins with nearest-neighbour interaction. Ising solved it in his 1924 thesis and proved — correctly — that in 1D there is no phase transition. He then wrote off the model as uninteresting. A decade later, Lars Onsager cracked the 2D case (1944) and found a transition, winning a Nobel for it. The model now named for Ising is the single most-studied model in all of statistical physics.

**Sections (7):**

1. **Setup** — a lattice of spins, each σ_i = ±1. Nearest-neighbour interaction: H = −J Σ σ_i σ_j − h Σ σ_i. Two states per spin, but the collective behaviour is rich.
2. **1D solved by Ising** — no ordered phase at any T > 0. Any ferromagnetic order gets destroyed by the thermal flipping of any single spin along the chain. Ising's correct (and disappointing) result.
3. **2D solved by Onsager** — Lars Onsager, 1944, solved the 2D Ising model exactly with a tour-de-force of matrix algebra. A phase transition at T_c = 2J/(k_B ln(1+√2)) ≈ 2.27 J/k_B. The spontaneous magnetisation vanishes as (T_c − T)^(1/8) below T_c.
4. **3D not solved analytically** — 3D Ising is not exactly solvable (and probably never will be), but is known numerically to extraordinary precision. Monte Carlo and conformal-bootstrap results match.
5. **Universality again** — 3D Ising exponents also describe the liquid-vapour transition in water, the mixing transition in binary liquid mixtures, and even some biological systems. Different microscopics, identical critical behaviour. FIG.23's claim made concrete.
6. **Beyond ferromagnets** — Ising spins as a universal currency. Neural networks (Hopfield), epidemics on networks, protein folding, spin glasses. Wherever binary states interact, Ising shows up.
7. **What's next** — applications, refrigerators, the third law. → Module 8.

**Scenes to build (3):**

| File | Purpose |
|---|---|
| `ising-1d-scene.tsx` | A chain of spins. Monte Carlo stepping. Temperature slider. Plot of magnetisation vs time. At any T, fluctuates around zero — no order. Matches Ising 1924. |
| `ising-2d-scene.tsx` | A 2D lattice of spins. Glauber dynamics. Temperature slider crossing T_c ≈ 2.27 J/k. Above T_c: random salt-and-pepper. At T_c: fractal clusters of all sizes (critical opalescence, discrete). Below T_c: one domain dominates. Magnetisation readout. |
| `ising-phase-scene.tsx` | Plot of ⟨|m|⟩ vs T from a 2D simulation. Shows the sharp onset at T_c matching (T_c−T)^(1/8) below T_c, zero above. |

**Physicists (aside):**
- Wilhelm Lenz *(NEW — German physicist, 1888-1957, Hamburg, posed the model to his student Ising in 1920)*
- Ernst Ising *(NEW — German-American physicist, 1900-1998, solved the 1D model in his 1924 thesis, left physics during the Nazi period, rediscovered his model was famous only after WWII)*
- Lars Onsager *(NEW — Norwegian-American physical chemist, 1903-1976, exact 2D Ising solution 1944, Onsager reciprocal relations, Nobel 1968 in chemistry)*

**Glossary terms:**
- `ising-model` — concept
- `ferromagnet` — concept
- `spin` — concept (thermo-scope stub; full treatment in QM branch)
- `monte-carlo-method` — concept

**Reading minutes:** 13.

---

## Module 8 · Applications & the Third Law

### FIG.25 — Refrigerators and Heat Pumps

**Hook.** Jacob Perkins, a London engineer, 1834. He patents the first practical vapour-compression refrigerator. It takes ninety years to reach every kitchen. Every refrigerator, air conditioner, and heat pump on Earth runs a Carnot cycle in reverse — paying work to pump heat the wrong way. The second law doesn't forbid it; it just charges.

**Sections (7):**

1. **Running Carnot backwards** — a refrigerator is a heat engine run in reverse. Work goes in; heat is moved from cold to hot. Same four processes, counter-clockwise on the PV plane.
2. **Coefficient of performance** — COP = Q_c/W (for a refrigerator) or Q_h/W (for a heat pump). Carnot limits: COP_fridge ≤ T_c/(T_h − T_c); COP_pump ≤ T_h/(T_h − T_c). Both can exceed 1 — a heat pump can deliver 3-4 joules of heat per joule of work.
3. **Vapour compression cycle** — real refrigerators use a working fluid that alternates between liquid and vapour. Compressor, condenser, throttle, evaporator. The phase transitions do the heavy thermal lifting.
4. **CFCs, HFCs, and the ozone hole** — Freon (CFCs), Midgley 1928, seemed a miracle. Turned out to shred ozone — Molina and Rowland 1974, vindicated by the Antarctic ozone hole 1985. Montreal Protocol 1987 replaced CFCs with HFCs, then with HFOs and CO₂. An environmental chapter on thermodynamics.
5. **Absorption refrigeration** — Einstein and Szilard, 1926-1933, patented a fridge with no moving parts, using heat (not work) as the input. Commercially impractical at the time; the idea returned for off-grid applications and waste-heat cooling.
6. **Heat pumps as climate technology** — a heat pump delivering 3 J of heat per J of electricity is 3× better than resistive heating, and if the electricity comes from renewables, is effectively carbon-free. The thermo-to-policy pipeline.
7. **What's next** — can we reach T = 0? → FIG.26.

**Scenes to build (2):**

| File | Purpose |
|---|---|
| `reverse-carnot-scene.tsx` | PV diagram with the Carnot cycle running counter-clockwise. Sliders for T_c, T_h. Live readout of Q_c pumped out of the cold reservoir, W input, COP. Comparison bar: theoretical Carnot COP vs real fridge (~0.5 × Carnot). |
| `vapour-compression-scene.tsx` | A schematic of a household fridge with the four components animated. The working fluid changes colour as it evaporates/condenses. Temperature readouts at each point. Toggle "CFC" vs "HFC" vs "CO₂" for refrigerant class notes. |

**Physicists (aside):**
- Jacob Perkins *(NEW — Anglo-American engineer, 1766-1849, first vapour-compression refrigerator 1834)*
- Thomas Midgley Jr. *(NEW — American engineer, 1889-1944, invented both leaded petrol and CFCs — said to have had more impact on the atmosphere than any other single organism in Earth's history)*
- Mario Molina *(NEW — Mexican chemist, 1943-2020, with Rowland showed CFCs destroy ozone 1974, Nobel 1995)*
- F. Sherwood Rowland *(NEW — American chemist, 1927-2012, Nobel 1995 for CFC-ozone work)*
- Albert Einstein / Leo Szilard *(exists / exists — Einstein-Szilard fridge 1926-1933 patent)*

**Glossary terms:**
- `refrigerator` — concept
- `heat-pump` — concept
- `coefficient-of-performance` — concept
- `vapour-compression-cycle` — concept
- `reverse-carnot-cycle` — concept

**Reading minutes:** 11.

---

### FIG.26 — Approach to Absolute Zero

**Hook.** Heike Kamerlingh Onnes, Leiden, 10 July 1908. He liquefies helium for the first time — 4.2 kelvin above absolute zero. Three years later, in the same cold liquid, he drops the resistance of a mercury wire to *exactly* zero and discovers superconductivity. His Leiden laboratory motto: *Door meten tot weten*. "Through measurement to knowledge." The coldest place in the universe was, for decades, on a Dutch workbench.

**Sections (7):**

1. **Cascade cooling** — successive liquefaction. Oxygen (1877, Cailletet and Pictet), nitrogen (1883), hydrogen (1898, Dewar), helium (1908, Onnes). Each cryogen chills the next below its own boiling point.
2. **Joule-Thomson expansion** — throttle a high-pressure gas through a porous plug. For most gases at room T, it cools (Joule-Thomson coefficient > 0). For H₂ and He at room T, it heats — needed precooling below their inversion temperatures. Built the liquefiers.
3. **Dewar flask** — James Dewar, 1892. Double-walled vacuum flask with silvered walls. Makes cryogenics practical. Your thermos is the same invention.
4. **Adiabatic demagnetisation** — Debye and Giauque, 1926. Magnetise a paramagnetic salt (aligns spins, releases heat). Thermally isolate. Demagnetise adiabatically. Spins disorder at the cost of thermal energy; temperature plummets. Reached millikelvin by 1933.
5. **Dilution refrigeration** — the ³He/⁴He dilution fridge, London and Heer 1960s. Continuous operation at millikelvin. Standard equipment for quantum computing today.
6. **Laser cooling** — Chu, Cohen-Tannoudji, Phillips 1997 Nobel. Photon recoil removes kinetic energy from atoms. Reaches microkelvin and then nanokelvin — the coldest man-made temperatures, below interstellar space. Prepares the atoms for FIG.28.
7. **What's next** — at some point you can't get any colder. What does that mean? → FIG.27.

**Scenes to build (2):**

| File | Purpose |
|---|---|
| `cooling-timeline-scene.tsx` | A logarithmic timeline of "coldest achieved temperature" from 1877 (liquid O₂, 90 K) to 2015 (100 picokelvin in optical lattices). Each milestone annotated with technique and year. |
| `adiabatic-demagnetisation-scene.tsx` | Three-step animation. (1) Magnetise a paramagnetic salt — spins align, entropy leaves as heat. (2) Thermal decouple. (3) Demagnetise — spins randomise, pulling energy out of lattice vibrations — T plunges. Entropy/temperature plot alongside. |

**Physicists (aside):**
- Heike Kamerlingh Onnes *(NEW — Dutch physicist, 1853-1926, Leiden, liquefied helium 1908, discovered superconductivity 1911, Nobel 1913, motto *Door meten tot weten*)*
- James Dewar *(NEW — Scottish chemist-physicist, 1842-1923, Dewar flask 1892, first liquefier of hydrogen 1898)*
- William Giauque *(NEW — Canadian-American chemist, 1895-1982, adiabatic demagnetisation 1926, Nobel in chemistry 1949)*
- Peter Debye *(exists)*
- Steven Chu, Claude Cohen-Tannoudji, William Phillips *(NEW as group — laser cooling 1997 Nobel)*

**Glossary terms:**
- `cryogenics` — concept
- `joule-thomson-effect` — concept
- `dewar-flask` — concept
- `adiabatic-demagnetisation` — concept
- `laser-cooling` — concept

**Reading minutes:** 12.

---

### FIG.27 — The Third Law

**Hook.** Walther Nernst, Berlin, 1906. He formulates what he calls his "heat theorem" — the entropy of a perfect crystal approaches a constant as T → 0. Planck sharpens it: the constant is zero. You cannot reach absolute zero. Ever. Not in any finite number of steps. The universe has a floor, and you will never quite touch it.

**Sections (7):**

1. **Nernst's statement** — as T → 0, ΔS for any isothermal process → 0. The specific heat itself tends to zero, so cooling gets exponentially harder.
2. **Planck's sharpening** — in fact S → 0 as T → 0 for a perfect crystal. The ground state is unique (or its degeneracy is sub-extensive), so Ω → 1 and S = k ln Ω → 0.
3. **Unattainability statement** — no finite sequence of operations can reduce a system to T = 0. Equivalent to the vanishing-entropy version; proven by Fowler and Guggenheim.
4. **Residual entropy** — not every substance has unique ground state. Ice has a residual entropy at T → 0 of about k ln(3/2) per molecule (Linus Pauling 1935) due to proton disorder. CO has another small residual entropy from two possible orientations.
5. **Why the third law is deep** — it's not derivable from the first two. It constrains the *low-T limit*, something thermo alone can't pin down. Quantum mechanics is ultimately why: discrete ground states. The classical world has no floor.
6. **Consequences** — specific heats vanish at T = 0 (Debye's T³ law for solids, Sommerfeld's T for metals). Thermal expansion vanishes. Chemical potentials become unbounded. All measurable consequences.
7. **What's next** — near the floor, matter does new things. → FIG.28.

**Scenes to build (2):**

| File | Purpose |
|---|---|
| `third-law-entropy-scene.tsx` | S(T) curve from high T down to 0. Three cases: ideal crystal (→ 0), ice (→ k ln(3/2) × N), glass (frozen out, non-equilibrium residual). Cursor moves along T, reading S. |
| `unattainability-scene.tsx` | A cooling diagram — successive steps of adiabatic demagnetisation. Each step halves the entropy span, but T never reaches zero — an infinite number of steps would be needed. The staircase converges to a vertical asymptote at T = 0. |

**Physicists (aside):**
- Walther Nernst *(NEW — German physical chemist, 1864-1941, Nernst heat theorem 1906, Nobel in chemistry 1920, founder of modern physical chemistry)*
- Max Planck *(exists)*
- Linus Pauling *(NEW cameo — American chemist, 1901-1994, two Nobels (chemistry 1954, peace 1962), calculated ice's residual entropy 1935 as a student exercise that turned out to be exactly right)*

**Glossary terms:**
- `third-law-of-thermodynamics` — concept
- `residual-entropy` — concept
- `absolute-zero` — concept (full entry, upgrade from stub)
- `nernst-theorem` — concept

**Reading minutes:** 10.

---

### FIG.28 — Bose-Einstein Condensation

**Hook.** Satyendra Nath Bose, Dhaka, 1924. A young lecturer, stuck teaching statistical mechanics, derives Planck's formula by a new counting rule for indistinguishable photons. He sends the paper to Einstein. Einstein recognises a new statistics, extends it to atoms, and predicts — at low enough T — a strange macroscopic quantum state where every particle piles into the ground state. Seventy-one years later, Cornell and Wieman cool rubidium to 170 nanokelvin in Boulder and see the condensate for the first time. Nobel 2001.

**Sections (7):**

1. **Bose statistics** — identical bosons can share states. Two photons in one mode: allowed and favoured. Changes the counting, changes the distribution: n̄ = 1/(exp(βε) − 1).
2. **The Bose-Einstein distribution** — applies to photons, phonons, atoms with integer total spin. Contrasts with Fermi-Dirac (n̄ = 1/(exp(βε) + 1)) for half-integer spin.
3. **The condensation** — below a critical temperature T_c, a macroscopic fraction of bosons occupies the single-particle ground state. Einstein 1925 predicted it from counting alone; it took decades to manifest in cold-atom experiments.
4. **T_c formula** — for a uniform 3D gas: k_B T_c = (2πħ²/m) (n/ζ(3/2))^(2/3). Cold + dense enough that the thermal de Broglie wavelength ≈ interparticle spacing.
5. **Superfluid helium** — ⁴He below 2.17 K flows without viscosity. London 1938 identified it as a real-world BEC (though strongly interacting). ³He superfluidity (fermion pairs) is a cousin, discovered 1971.
6. **Cornell, Wieman, Ketterle — 1995** — in Boulder and Cambridge MA, dilute gases of ⁸⁷Rb and ²³Na were cooled below microkelvin. The first pure BECs. Shadow images showed the condensate peak. Nobel 2001.
7. **What's next** — the final vista of thermodynamics: the whole universe, cooling forever. → FIG.29.

**Scenes to build (3):**

| File | Purpose |
|---|---|
| `bose-statistics-scene.tsx` | Four bosons distributed over three energy levels. Stack them; all configurations are equally allowed, including all four in the ground state. Side-by-side Fermi-Dirac: at most one per level. |
| `bec-transition-scene.tsx` | Cooling simulation of a dilute Bose gas. At T > T_c, smooth distribution. At T < T_c, a sharp peak at v = 0 emerges atop a thermal cloud. Matches the iconic 1995 images from Boulder. |
| `superfluid-scene.tsx` | Liquid helium in a thin-film beaker climbs up and over the wall (the Rollin film), flowing against gravity. Click to show a rotation experiment — a superfluid stays at rest while the bucket spins. |

**Physicists (aside):**
- Satyendra Nath Bose *(NEW — Indian physicist, 1894-1974, derived Bose statistics 1924 while teaching in Dhaka, mailed it to Einstein. Bose never got the Nobel. The boson is named for him.)*
- Albert Einstein *(exists — predicted the condensate 1925)*
- Fritz London *(NEW — German-American theorist, 1900-1954, first identified superfluid helium as a BEC 1938, London moment in superconductors)*
- Eric Cornell, Carl Wieman *(NEW as pair — American physicists, 1995 BEC in Boulder, Nobel 2001)*
- Wolfgang Ketterle *(NEW — German physicist, 1995 sodium BEC at MIT, Nobel 2001)*

**Glossary terms:**
- `bose-statistics` — concept
- `fermi-dirac-statistics` — concept (stub; full in QM branch)
- `bose-einstein-condensate` — concept
- `superfluid` — concept
- `indistinguishable-particles` — concept

**Reading minutes:** 13.

---

### FIG.29 — Thermodynamics of the Universe

**Hook.** Clausius, 1865, last paragraph of his memoir: "*Die Entropie der Welt strebt einem Maximum zu.*" The entropy of the universe tends to a maximum. If he's right, then the universe is running down. Stars burn out. Black holes evaporate. Eventually nothing interesting happens, forever. Lord Kelvin predicted the heat death in 1852. Modern cosmology has not so much refuted him as sharpened the picture.

**Sections (7):**

1. **The heat death** — if the universe behaves as an isolated thermodynamic system, entropy maximises. All gradients — temperature, density, chemical potential — ultimately vanish. No engine can run; no structure can form. Time keeps going, but nothing happens.
2. **Objection: the universe is expanding** — cosmological expansion changes the volume. The "maximum entropy state" is not fixed. The expanding universe can stay out of equilibrium longer than a static one would suggest.
3. **Black-hole entropy** — Bekenstein 1972, Hawking 1974. A black hole has entropy S = k_B A / (4 ℓ_P²), with A the horizon area and ℓ_P the Planck length. Black holes are by far the largest entropy sinks in the present universe.
4. **Hawking radiation** — black holes are slightly warm, T_H = ħc³/(8πGMk_B). For a stellar-mass black hole, T_H ~ 10⁻⁸ K — colder than the cosmic microwave background. They grow, don't shrink, for now. When CMB drops below T_H, they begin to evaporate.
5. **Long-term cosmological timeline** — in 10¹⁴ years, star formation ends. In 10³⁴ years, protons may decay. In 10¹⁰⁰ years, the last supermassive black holes evaporate. All that remains is radiation at nearly uniform temperature.
6. **Poincaré recurrence reconsidered** — if the universe is truly closed and finite-dimensional, fluctuations to low-entropy states recur over vast times (~ 10^(10^120) years for the visible universe). The "heat death" might be only a phase.
7. **Forward** — from thermodynamics we hand off to quantum field theory (for Hawking radiation in detail), cosmology (for the expansion), and general relativity (for black hole geometry). The second law threads through all of them.

**Scenes to build (2):**

| File | Purpose |
|---|---|
| `cosmological-entropy-scene.tsx` | Timeline from Big Bang to heat death, logarithmic x-axis. Plotted: radiation entropy, matter entropy, black-hole entropy (dominant), total. Shows black-hole entropy dwarfing everything once structure forms. |
| `hawking-temperature-scene.tsx` | Black-hole mass slider. Temperature T_H and lifetime τ computed live. Primordial BH of 10¹² kg: T_H ~ 10¹¹ K, evaporating now. Stellar mass BH: T_H ~ 10⁻⁸ K, lifetime 10⁶⁷ years. |

**Physicists (aside):**
- Rudolf Clausius *(exists)*
- Lord Kelvin *(exists)*
- Jacob Bekenstein *(NEW — Israeli-American theorist, 1947-2015, proposed black-hole entropy 1972)*
- Stephen Hawking *(NEW — English theorist, 1942-2018, Hawking radiation 1974, black-hole thermodynamics, ALS survivor by 55 years. Full profile in the relativity/cosmology branches.)*

**Glossary terms:**
- `heat-death` — concept (upgrade from stub)
- `black-hole-entropy` — concept
- `hawking-radiation` — concept
- `bekenstein-bound` — concept

**Reading minutes:** 13.

---

### FIG.30 — Thermodynamics Meets Life

**Hook.** Erwin Schrödinger, Dublin, 1944. In exile from Austria, he gives three public lectures at Trinity College and publishes *What is Life?* The second chapter asks: how can an organism maintain order against the second law? Answer: by feeding on *negative entropy* — eating low-entropy food (structured molecules) and excreting high-entropy waste (disorder). A decade later, Watson and Crick cite these lectures as the spark that sent them after DNA.

**Sections (7):**

1. **Living systems are open** — unlike the idealised isolated systems of thermodynamics, organisms exchange matter and energy with their surroundings. They sit far from equilibrium, maintained by continuous flux.
2. **Schrödinger's negentropy** — an organism maintains its low-entropy state by importing order and exporting disorder. It "drinks orderliness." A metaphor, but a precise one: the sun supplies low-entropy photons, Earth radiates high-entropy infrared back to space.
3. **Metabolic power** — human: ~100 W. An Olympic cyclist under load: ~400 W. A blue whale: ~60 kW. All fed, ultimately, by sunlight hitting chlorophyll — a thermodynamic cascade from a 5800 K source to a 300 K sink.
4. **Efficiency of life** — muscle: ~25% (same as a car engine). Photosynthesis: ~5% (limited by the quantum yield). Chemiosmotic ATP synthesis: ~40%. Evolution has found ways to tile the landscape of heat-engine efficiencies.
5. **Entropy production in dissipative structures** — Prigogine's 1977 Nobel: far-from-equilibrium open systems spontaneously form ordered patterns (Bénard cells, reaction-diffusion fronts, possibly life itself) *while* producing entropy at a locally minimal rate.
6. **Information and thermodynamics of biology** — DNA replication, transcription, translation each erase bits. Landauer bound sets a minimum heat production. Measured values in E. coli are within a factor of 10 of the theoretical minimum. Life runs near the thermodynamic edge.
7. **Coda** — thermodynamics gave us engines, then chemistry, then stat mech, then the arrow of time, then biology, then black holes and the heat death. The two laws that open this branch — energy conservation, entropy growth — remain the two deepest facts in physics. Everything else lives in their shadow.

**Scenes to build (2):**

| File | Purpose |
|---|---|
| `sun-earth-thermodynamics-scene.tsx` | A simplified 3-body radiation diagram: Sun (5800 K) → Earth (288 K) → deep space (2.7 K). Photon counts and entropy flows labelled: Earth *absorbs* ~10¹⁷ W of low-entropy light, *emits* ~10¹⁷ W of high-entropy infrared. Life slips in between. |
| `metabolic-ladder-scene.tsx` | Log-scale power bar chart: hydrogen fusion (Sun: 10²⁶ W), photosynthesis on Earth (~10¹³ W), large animal metabolism (10³-10⁵ W), unicellular respiration (10⁻¹² W), single ATP synthase (~10⁻¹⁷ W). Each marked with its efficiency. |

**Physicists (aside):**
- Erwin Schrödinger *(NEW cameo — Austrian theorist, 1887-1961, *What is Life?* 1944, Schrödinger equation in the QM branch)*
- Ilya Prigogine *(NEW — Russian-Belgian chemist, 1917-2003, Nobel in chemistry 1977, dissipative structures and the thermodynamics of life)*
- Harold Morowitz *(NEW — American biophysicist, 1927-2016, *Energy Flow in Biology* 1968, connected thermodynamics to biology rigorously)*

**Glossary terms:**
- `negentropy` — concept
- `dissipative-structure` — concept
- `open-system` — concept
- `metabolic-rate` — concept
- `landauer-bound` — concept (cross-ref to FIG.20)

**Reading minutes:** 11.

---

## Execution order

The branch is long; build in passes rather than strictly in order.

**Pass 1 — the backbone (6 topics).** These form a minimum coherent narrative.

1. FIG.01 (temperature) — the entry point.
2. FIG.02 (Rumford / Joule) — heat is energy, the conceptual pivot.
3. FIG.05 (first law) — the accounting principle.
4. FIG.08 (Carnot) — the pinnacle of classical thermo.
5. FIG.09 (second law) — the twin with the first.
6. FIG.10 (entropy) — operationalised.

**Pass 2 — kinetic theory & the statistical bridge (5 topics).**

7. FIG.14 (ideal gas law)
8. FIG.15 (pressure from collisions)
9. FIG.16 (Maxwell-Boltzmann)
10. FIG.11 (micro/macro states)
11. FIG.12 (S = k log W)

**Pass 3 — consolidation & arrows (6 topics).**

12. FIG.03 (heat capacity)
13. FIG.04 (phase changes)
14. FIG.06 (PV diagrams)
15. FIG.07 (isothermal / adiabatic)
16. FIG.13 (arrow of time)
17. FIG.17 (equipartition)

**Pass 4 — statistical mechanics proper (4 topics).**

18. FIG.18 (Brownian motion)
19. FIG.19 (partition function)
20. FIG.20 (Maxwell's demon)
21. FIG.21 (fluctuation-dissipation)

**Pass 5 — phase transitions (3 topics).**

22. FIG.22 (Clausius-Clapeyron)
23. FIG.23 (critical phenomena)
24. FIG.24 (Ising)

**Pass 6 — the cold frontier (3 topics).**

25. FIG.25 (refrigerators)
26. FIG.26 (approach to absolute zero)
27. FIG.27 (third law)

**Pass 7 — the big-picture finish (3 topics).**

28. FIG.28 (Bose-Einstein)
29. FIG.29 (cosmology & heat death)
30. FIG.30 (life & closing)

Priority for a working MVP: passes 1 + 2 ship 11 topics that already tell a complete thermodynamics story end-to-end. Passes 3-7 deepen and widen.

## Patterns to reuse

- **Scene skeleton:** copy from `damped-pendulum-scene.tsx` or `kinematics-graph-scene.tsx`. All use `useAnimationFrame`, `useThemeColors`, canvas + ResizeObserver, cyan (`#5BE9FF`) as the accent.
- **Physics functions:** pure modules in `lib/physics/*.ts`. One module per topic — `lib/physics/thermometry.ts`, `lib/physics/ideal-gas.ts`, `lib/physics/carnot.ts`, `lib/physics/maxwell-boltzmann.ts`, `lib/physics/ising.ts`, etc. Keep them dependency-free so they can be reused across scenes within a topic.
- **Shared utilities** common across this branch:
  - `lib/physics/random.ts` — seeded RNG for reproducible Monte Carlo and Brownian traces.
  - `lib/physics/distributions.ts` — PDFs for Gaussian, Maxwell-Boltzmann, Bose-Einstein, Fermi-Dirac. One file covers 6+ scenes.
  - `lib/physics/pv-plot.ts` — PV-diagram canvas helpers (axes, isotherms, adiabats, cycle areas). Reused by FIG.06, FIG.07, FIG.08, FIG.22.
  - `lib/physics/lattice.ts` — 2D lattice + neighbour-list helper for Ising and BEC scenes.
- **Physicist adds:** manually edit `lib/content/physicists.ts` + `messages/en/physicists.json` (no MCP tool for this yet — documented gap in `docs/mcp-gaps.md`). Thermo adds ~30 new physicists across the branch; batch them in 3-5 commits rather than one per topic.
- **Glossary adds:** direct edits to `lib/content/glossary.ts` + `messages/en/glossary.json` + `messages/he/glossary.json` + `messages/ru/glossary.json` (four files; no MCP dependency required). Cross-reference aggressively — entropy, temperature, and heat thread through nearly every topic.
- **Topic status flip:** direct edit to `lib/content/branches.ts` — change `status` and `readingMinutes` on the relevant entry. Thermo entries live in the `thermodynamics` branch block; keep them in FIG order.
- **Hebrew and Russian content:** copy the English MDX, translate prose section-by-section, update `messages/{he,ru}/home.json` chrome, wire `HeContent` / `RuContent` into `page.tsx`. Each locale is its own pass per topic.
- **Historical quotation style:** for hook paragraphs that lean on a quote (Clausius's "Die Entropie der Welt…", Onnes's *Door meten tot weten*, Schrödinger's "drinks orderliness"), give the original language once, then an English translation. The branch voice rewards this — thermo is the most historically legible of all branches.
- **Colour coding in scenes:** pick once and reuse across the whole branch — hot reservoir red `#FF5B5B`, cold reservoir cyan `#5BE9FF` (already the accent), work arrows green `#7BFF8D`, heat arrows amber `#FFB55B`. Documented in a single constants file, e.g. `components/physics/thermo-colors.ts`.

## Definition of done per topic

- [ ] `content.en.mdx` replaces skeleton, full 7-section essay.
- [ ] All new scenes exist, are registered in `visualization-registry.tsx`, render without runtime error at the intended slug.
- [ ] All shared physics modules (new `lib/physics/*.ts` files) are pure, typed, and unit-tested by at least one scene using them.
- [ ] New physicists (up to ~5 per topic) live in `lib/content/physicists.ts` + `messages/en/physicists.json` with cross-links from relevant topics.
- [ ] New glossary terms (5-7 per topic) live in `lib/content/glossary.ts` + all three locale glossary JSONs, cross-referenced to the topic and to related glossary entries.
- [ ] `status: "live"`, `readingMinutes: N` in `branches.ts` for the topic.
- [ ] English home.json chrome updated (hero cards, branch summaries if the topic is the featured one).
- [ ] `npx tsc --noEmit` passes.
- [ ] Manual smoke test in `bun dev` at `/en/thermodynamics/<slug>` — scenes render, sliders work, readouts update, no console errors.
- [ ] (optional) Hebrew content + page.tsx wire + home.json chrome.
- [ ] (optional) Russian content + page.tsx wire + home.json chrome.
