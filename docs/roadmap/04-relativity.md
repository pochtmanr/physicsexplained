# § 04 · Relativity — curriculum roadmap

Space bends. Time stretches. Mass and energy are the same thing. Einstein's special and general relativity rewrote geometry itself — what Newton called absolute became local, what Galileo called universal became frame-dependent, and what every physicist called gravity turned out to be the shape of the universe. This branch walks from the ether hunt in a Cleveland basement to the chirp of two black holes merging a billion light-years away.

---

## Module map

1. **Galilean Relativity** — inertial frames, the Galilean transformations, classical composition of velocities, the ether problem, and Michelson and Morley's null result.
2. **The Postulates of Special Relativity** — Einstein 1905, the two axioms, the death of simultaneity, Einstein's train.
3. **Time Dilation & Length Contraction** — moving clocks slow, moving rulers shrink, muons from the stratosphere, the twin paradox resolved.
4. **Lorentz Transformations** — the math, the spacetime interval, invariants under boosts, the light cone, causal structure.
5. **Four-Vectors & Relativistic Dynamics** — four-momentum, E = mc², relativistic collisions, photons and massless particles, the particle accelerator as proof.
6. **The Equivalence Principle** — Einstein's happiest thought, elevators in free fall, gravitational redshift, Pound and Rebka in a tower at Harvard.
7. **Curved Spacetime** — geodesics, the metric tensor (gentle), why gravity is geometry, the Einstein field equations named but not solved.
8. **Solutions of GR** — Schwarzschild's metric written from a Russian trench, black holes and event horizons, Kerr rotation, gravitational lensing and Eddington at Príncipe.
9. **Gravitational Waves & Cosmology** — LIGO on 14 September 2015, Friedmann's expanding universes, Hubble's redshifts at Mount Wilson, Lemaître's primeval atom.

---

## Module 1 · Galilean Relativity

### FIG.01 — Inertial Frames and the Principle of Relativity

**Hook.** Galileo, below decks on a ship moving at steady speed (*Dialogue Concerning the Two Chief World Systems*, 1632), drops a ball and watches it fall straight down. No experiment inside a closed cabin can tell you whether the ship is moving. That single observation — written 273 years before Einstein — is the seed of every relativity that ever was.

**Sections (7):**

1. **The ship below decks** — Galileo's passage in full: flies, fish in a bowl, a sailor dropping a weight from the mast. Everything behaves as if the ship were at rest. Motion is only meaningful *relative to something*.
2. **Inertial frames** — a frame in which Newton's first law holds. A train at constant velocity is one. A spinning carousel is not. Every inertial frame is as good as any other for doing physics.
3. **The Galilean principle of relativity** — the laws of mechanics are the same in every inertial frame. A bold claim. It survives for 250 years before Einstein has to edit *mechanics* to *physics*.
4. **What Galileo could not yet say** — he had no notion of *universal time*; he assumed it silently, as did everyone. That assumption is the hinge on which relativity will later turn.
5. **Newton's absolute space** — Newton, uneasy with pure relativity, posited absolute space and absolute time in the *Principia* (1687). A metaphysical commitment, not an experimental claim. Leibniz disagreed. The argument runs for two centuries.
6. **The bucket argument** — Newton's spinning bucket of water: the water climbs the walls even with no reference objects around. Proof, Newton said, of absolute rotation. Mach will later disagree.
7. **What's next** — if all inertial frames are equal, how do velocities add when you jump between them? FIG.02.

**Scenes to build (2):**

| File | Purpose |
|---|---|
| `galilean-ship-scene.tsx` | A cutaway ship at constant velocity, with a sailor dropping a ball inside the cabin. Ship-speed slider. Toggle between "observer on ship" and "observer on shore": in the first view the ball falls straight; in the second it traces a parabola. Both views are equally valid. |
| `inertial-frame-toggle-scene.tsx` | Two side-by-side canvases, both showing a billiard-ball collision. One is the "lab" frame; the other is a frame boosted by a slider. The *outcome* of the collision (momentum conservation) is identical in both. Demonstrates frame equivalence without Lorentz. |

**Physicists (aside):**
- Galileo Galilei *(exists)*
- Isaac Newton *(exists — the absolute-space foil)*

**Glossary terms:**
- `inertial-frame` — concept
- `galilean-relativity` — concept
- `absolute-space` — concept
- `principle-of-relativity` — concept

**Files to touch:**
- `app/[locale]/(topics)/relativity/inertial-frames/content.en.mdx` (replace skeleton)
- Same path, `content.he.mdx` and `content.ru.mdx` (translate at end)
- Same path, `page.tsx` (wire `HeContent`, `RuContent`)
- `components/physics/galilean-ship-scene.tsx` (new)
- `components/physics/inertial-frame-toggle-scene.tsx` (new)
- `components/physics/visualization-registry.tsx` (register 2 scenes)
- `lib/content/glossary.ts` + `messages/<locale>/glossary.json` (add 4 terms)
- `lib/content/branches.ts` (flip `status: "live"`, `readingMinutes: 9`)
- `messages/<locale>/home.json` (update chrome)

**Reading minutes:** 9.

---

### FIG.02 — Galilean Transformations and Velocity Addition

**Hook.** A passenger walks forward at 5 km/h inside a train moving at 100 km/h. To the ground, she is moving at 105 km/h. Obvious. Everyone has always known this. The formula that encodes it — x' = x − vt — looks so innocent that for 300 years nobody suspected it was an approximation.

**Sections (7):**

1. **Setting up two frames** — the lab frame S and a frame S' moving at constant velocity v along x. Origins coincide at t = 0.
2. **The Galilean transformation** — x' = x − vt, y' = y, z' = z, and the silent fourth line: t' = t. That last line is doing all the damage.
3. **Velocity addition, classical version** — u' = u − v. Differentiate the position transformation. Clean. Universal. Wrong.
4. **Acceleration is invariant** — a' = a. So F = ma looks the same in every inertial frame. Newton's second law is *Galilean-covariant*. A triumph.
5. **What transforms and what doesn't** — lengths are invariant, time intervals are invariant, masses are invariant. The list will shorten dramatically in 1905.
6. **The crack in the facade** — Maxwell's equations, written down by James Clerk Maxwell in the 1860s, predict a *single* speed for light: c ≈ 3 × 10⁸ m/s. A speed relative to *what*?
7. **What's next** — the nineteenth century invents a medium for light to propagate through. They call it the luminiferous ether. FIG.03.

**Scenes to build (2):**

| File | Purpose |
|---|---|
| `galilean-transform-scene.tsx` | Two overlaid coordinate grids, S and S'. Boost-velocity slider slides the S' grid horizontally in real time. A point-event (flash) shows its (x,t) and (x',t') coordinates simultaneously. Clean, pedagogical. |
| `velocity-addition-scene.tsx` | Train moving at speed v with a passenger walking at speed u inside. Both sliders. Three readouts: train-frame speed u, ground-frame speed u + v, and (greyed out, as a teaser) the relativistic answer (u + v) / (1 + uv/c²). |

**Physicists (aside):**
- Galileo Galilei *(exists)*
- Isaac Newton *(exists)*
- James Clerk Maxwell *(NEW — 1861–62 field equations; the first hint that light has a fixed speed)*

**Glossary terms:**
- `galilean-transformation` — concept
- `velocity-addition` — concept
- `maxwells-equations` — concept (stub; deeper entry lives in the Electromagnetism branch)
- `covariance` — concept

**Files to touch:**
- `app/[locale]/(topics)/relativity/galilean-transformations/content.en.mdx`
- Same path, `content.he.mdx`, `content.ru.mdx`, and `page.tsx`
- `components/physics/galilean-transform-scene.tsx` (new)
- `components/physics/velocity-addition-scene.tsx` (new)
- `components/physics/visualization-registry.tsx` (register 2 scenes)
- `lib/content/physicists.ts` + `messages/<locale>/physicists.json` (add Maxwell stub)
- `lib/content/glossary.ts` + `messages/<locale>/glossary.json` (add 4 terms)
- `lib/content/branches.ts` (`readingMinutes: 10`)
- `messages/<locale>/home.json` (update chrome)

**What this topic assumes:**
- Reader has seen vectors (FIG.02 of Classical Mechanics).
- Reader knows F = ma but does not need Maxwell's equations in detail — a one-sentence "light has a fixed speed in Maxwell's theory" is enough for the punchline.

**Reading minutes:** 10.

---

### FIG.03 — The Ether and the Michelson–Morley Experiment

**Hook.** Cleveland, 1887. Albert Michelson and Edward Morley float a massive stone slab in a trough of mercury in the basement of the Case School of Applied Science, mount an interferometer on it, and rotate the whole thing by hand, looking for a shift in the interference fringes as the Earth plows through the ether at 30 km/s. They find nothing. Six months later, at the opposite point of the Earth's orbit — still nothing. The most famous null result in physics.

**Sections (7):**

1. **The luminiferous ether** — invented because waves need a medium. Water waves need water, sound waves need air; light waves must need *something*. The ether is that something: stationary, absolute, fills all space.
2. **Earth through the ether** — if the ether is stationary and Earth orbits the Sun at 30 km/s, there should be an "ether wind" blowing past us. Light travelling with the wind should move at c + v; against it, at c − v.
3. **The interferometer** — Michelson's 1881 instrument, refined in 1887 with Morley. A beam-splitter sends light down two perpendicular arms, mirrors reflect it back, recombined light forms interference fringes. Rotating the apparatus should shift the fringes.
4. **The experiment itself** — the mercury float, the 11 m optical path (folded with mirrors), the rotation by hand, the observer stooped at the eyepiece counting fringe shifts. Predicted shift: 0.4 of a fringe. Observed: less than 0.01.
5. **The null result** — no ether wind. Six months later, with the Earth moving the opposite way through its orbit, still no ether wind. Something is deeply wrong.
6. **The rescues that failed** — ether drag (the Earth drags the ether with it): contradicted by stellar aberration. Emission theory (light takes the speed of its source): contradicted by double-star observations. Every patch breaks something else.
7. **The rescue that worked, sort of** — Lorentz and Fitzgerald independently propose that moving objects *contract* along the direction of motion by exactly the factor needed to hide the ether wind. A patch that turns out to be half the answer — Einstein will later rederive the contraction from simpler axioms.

**Scenes to build (2):**

| File | Purpose |
|---|---|
| `michelson-morley-scene.tsx` | Top-down schematic of the interferometer: source, beam-splitter, two arms, mirrors, detector. Earth-velocity slider (0 → 30 km/s). Rotation slider (0° → 360°). Live fringe display at the detector. Classical-ether prediction: fringes shift with rotation. Reality (toggle): they don't. |
| `ether-wind-scene.tsx` | Earth in orbit around the Sun, with arrows showing the predicted ether wind at two seasons 6 months apart. Side panel: the expected fringe-shift magnitude (0.4 fringes) vs the measured upper bound (<0.01). |

**Physicists (aside):**
- Albert Michelson *(NEW — first American Nobel in science, 1907; the interferometer bears his name)*
- Edward Morley *(NEW — chemist at Western Reserve, Michelson's patient and skeptical collaborator)*
- Hendrik Lorentz *(NEW — the Dutch physicist who proposed the length contraction as a rescue)*
- George Francis FitzGerald *(NEW — Irish physicist; proposed the same contraction independently, three years earlier)*

**Glossary terms:**
- `luminiferous-ether` — concept
- `michelson-morley-experiment` — experiment
- `interferometer` — instrument
- `null-result` — concept
- `fitzgerald-lorentz-contraction` — concept (classical version; relativistic version cross-linked from FIG.06)

**Files to touch:**
- `app/[locale]/(topics)/relativity/michelson-morley/content.en.mdx`
- Same path, `content.he.mdx`, `content.ru.mdx`, and `page.tsx`
- `components/physics/michelson-morley-scene.tsx` (new)
- `components/physics/ether-wind-scene.tsx` (new)
- `components/physics/visualization-registry.tsx` (register 2 scenes)
- `lib/content/physicists.ts` + `messages/<locale>/physicists.json` (add Michelson, Morley, Lorentz, FitzGerald)
- `lib/content/glossary.ts` + `messages/<locale>/glossary.json` (add 5 terms)
- `lib/content/branches.ts` (`readingMinutes: 12`)
- `messages/<locale>/home.json`

**What this topic assumes:**
- The Galilean velocity addition from FIG.02 — so the predicted fringe shift is plausible.
- A rough picture of wave interference (can be a one-sentence reminder; not a full optics detour).

**Historical assets to source:**
- Period photographs of the Michelson–Morley apparatus are public domain.
- The original 1887 *American Journal of Science* paper is freely available (open access).

**Reading minutes:** 12.

---

## Module 2 · The Postulates of Special Relativity

### FIG.04 — Einstein 1905 and the Two Postulates

**Hook.** A 26-year-old patent clerk in Bern, passed over for academic jobs, spends his days examining applications for electric clocks and his evenings arguing physics with a small group of friends he calls the Olympia Academy. In 1905 he publishes four papers. One of them — *On the Electrodynamics of Moving Bodies* — begins with a puzzle about a magnet and a conductor and ends by rewriting space and time. He does not cite Michelson and Morley.

**Sections (7):**

1. **The patent clerk** — who Einstein actually was in 1905. Third-class examiner in Bern. Rejected from academia. Two years out of his PhD. A wife, a young son, and evenings free.
2. **The magnet and the conductor** — the opening image of the 1905 paper. Move the magnet, get a current. Move the wire, get the same current. Maxwell's theory treats these cases with two different mechanisms, but the *physics* is identical. Asymmetry where there shouldn't be one.
3. **The first postulate** — the laws of physics are the same in every inertial frame. Galileo's principle, extended from mechanics to *all* of physics — electromagnetism included.
4. **The second postulate** — the speed of light in vacuum is the same in every inertial frame, independent of the motion of the source. Radical. Incompatible with Galilean velocity addition. Einstein takes it as an axiom and works out the consequences.
5. **Why these two together are explosive** — if light has the same speed for everyone, two observers racing at different velocities both measure the same c for the same light beam. Galilean addition u' = u − v is dead. Something else must transform between frames.
6. **The collapse of simultaneity** — the first casualty. Two events that are simultaneous in one frame are not simultaneous in another. Einstein's thought experiment with the train and the lightning strikes (FIG.05 handles the visualisation).
7. **What gets saved, what gets scrapped** — saved: the principle of relativity, the constancy of c, causality. Scrapped: universal time, universal space, the ether, Galilean velocity addition. A demolition and a rebuilding in one paper.

**Scenes to build (2):**

| File | Purpose |
|---|---|
| `two-postulates-scene.tsx` | Two observers moving at different velocities. A flash of light at the origin. Both observers measure the light's speed. Velocity slider; light-speed readout for each observer stays pinned at c. A quiet, pedagogical contradiction-of-intuition toy. |
| `magnet-conductor-scene.tsx` | Two panels side by side. Left: magnet moving, wire stationary — current flows. Right: wire moving, magnet stationary — same current. Toggles between "Galilean view" (two different mechanisms) and "Einstein view" (one physical situation). |

**Physicists (aside):**
- Albert Einstein *(NEW — the central figure of this branch; introduce him here in full: 1879 Ulm → 1905 Bern → 1915 Berlin → 1955 Princeton)*
- Henri Poincaré *(NEW — French mathematician who came within a hair's breadth of special relativity in 1904–05; first to state the relativity principle in its modern form)*
- Hendrik Lorentz *(exists from FIG.03 — honoured here for the transformation equations that Einstein rederives)*

**Glossary terms:**
- `special-relativity` — concept
- `einsteins-postulates` — concept
- `constancy-of-c` — concept
- `electrodynamics-of-moving-bodies` — paper (a named-entry for the 1905 paper)

**Files to touch:**
- `app/[locale]/(topics)/relativity/einstein-postulates/content.en.mdx`
- Same path, `content.he.mdx`, `content.ru.mdx`, and `page.tsx`
- `components/physics/two-postulates-scene.tsx` (new)
- `components/physics/magnet-conductor-scene.tsx` (new)
- `components/physics/visualization-registry.tsx` (register 2 scenes)
- `lib/content/physicists.ts` + `messages/<locale>/physicists.json` (add Einstein, Poincaré as full entries)
- `lib/content/glossary.ts` + `messages/<locale>/glossary.json` (add 4 terms)
- `lib/content/branches.ts` (`readingMinutes: 12`)
- `messages/<locale>/home.json`

**What this topic assumes:**
- FIG.03 — the reader knows the ether failed but doesn't know why.
- Light has a speed. That's it. Maxwell's equations stay in the Electromagnetism branch.

**Pedagogical warning:**
- Resist the urge to derive the Lorentz transformations here. That's FIG.09. Here, the postulates stand as axioms — their weight comes from the shock of accepting them.

**Reading minutes:** 12.

---

### FIG.05 — The Relativity of Simultaneity

**Hook.** Einstein's train, 1917 — from his popular book *Relativity: The Special and the General Theory*. Two lightning bolts strike the ends of a moving train. An observer on the platform, standing at the midpoint, sees both flashes at the same moment. An observer on the train, also at its midpoint, does not. Who is right? Both. Simultaneity is not something the universe hands you — it is something each frame computes for itself.

**Sections (7):**

1. **The setup** — platform observer at the midpoint. Train observer at the middle of the train. Train moving at v. Two lightning strikes: one at the front of the train, one at the rear, the instants the train's ends pass platform markers.
2. **What the platform observer sees** — the light from both strikes reaches her eyes at the same moment, having travelled equal distances at the same speed. She calls the strikes simultaneous. Clean.
3. **What the train observer sees** — the train has moved forward during the light's transit. She meets the front-strike light earlier and the rear-strike light later. She calls the strikes non-simultaneous.
4. **Both observers are right** — because the second postulate fixes light's speed *in each frame*, and the geometry of the two setups is different, simultaneity is a property of a frame, not of the world. Absolute simultaneity is incoherent.
5. **What collapses with it** — "now" does not extend across space in any absolute way. There is no global present moment. Every frame slices spacetime differently. This is the single most disorienting result in physics.
6. **Causality survives** — two events with a timelike separation — close enough in space, far enough in time for a light signal to connect them — have the same temporal order in every frame. Cause before effect is safe. Light cones (FIG.10) will make this precise.
7. **What's next** — if simultaneity dilates between frames, so do time intervals (FIG.06) and lengths (FIG.07). All three are a single story.

**Scenes to build (2):**

| File | Purpose |
|---|---|
| `simultaneity-train-scene.tsx` | Side-on view of a train passing a platform. Two lightning bolts strike the ends. Toggle between platform-frame and train-frame perspectives. In each, the light pulses propagate and reach observers; the order of arrival is visibly different. |
| `simultaneity-spacetime-scene.tsx` | A spacetime (x,t) diagram, with the platform frame's t = const slice horizontal and the train frame's t' = const slice tilted. Two events on the same tilted slice are simultaneous in the train frame; on the horizontal slice, in the platform frame. Drag a velocity slider; watch the slice rotate. |

**Physicists (aside):**
- Albert Einstein *(exists)*
- Henri Poincaré *(exists from FIG.04 — anticipated the relativity of simultaneity in an 1898 essay on the measurement of time)*

**Glossary terms:**
- `relativity-of-simultaneity` — concept
- `event` — concept (a point in spacetime)
- `simultaneity-slice` — concept
- `einsteins-train` — concept (the dedicated thought-experiment entry)

**Files to touch:**
- `app/[locale]/(topics)/relativity/simultaneity/content.en.mdx`
- Same path, `content.he.mdx`, `content.ru.mdx`, and `page.tsx`
- `components/physics/simultaneity-train-scene.tsx` (new)
- `components/physics/simultaneity-spacetime-scene.tsx` (new)
- `components/physics/visualization-registry.tsx` (register 2 scenes)
- `lib/content/glossary.ts` + `messages/<locale>/glossary.json` (add 4 terms)
- `lib/content/branches.ts` (`readingMinutes: 10`)
- `messages/<locale>/home.json`

**What this topic assumes:**
- The two postulates from FIG.04, applied without flinching.
- No math beyond "time = distance / speed". The scenes do the heavy lifting.

**Pedagogical warning:**
- This is the topic most readers bounce off. Two scenes, a clean train-and-platform story, and a spacetime-diagram follow-up. Do not cite Minkowski's rotated slices yet — FIG.10 is for that.

**Reading minutes:** 10.

---

## Module 3 · Time Dilation & Length Contraction

### FIG.06 — Time Dilation

**Hook.** A clock in motion runs slow. Not because the springs are stiff or the atoms tired — because *time itself* between two events, measured from a frame where the events happen at different places, is longer than the time measured in a frame where they happen at the same place. In 1971, Joseph Hafele and Richard Keating put four caesium clocks on commercial airliners, flew them around the world eastbound and westbound, and returned with clocks that disagreed with ground clocks by exactly the predicted nanoseconds.

**Sections (7):**

1. **The light clock** — a photon bouncing between two mirrors a distance L apart. In the clock's rest frame, one tick = 2L/c. In a frame where the clock moves sideways at v, the photon traces a longer, diagonal path, so one tick takes longer. The geometry forces Δt = γ·Δt₀.
2. **The gamma factor** — γ = 1 / √(1 − v²/c²). At v = 0, γ = 1. At v = 0.87c, γ = 2. As v → c, γ → ∞. Tabulate a few values. Note: for everyday speeds γ − 1 ≈ 10⁻¹² — imperceptible, which is why nobody noticed this for centuries.
3. **Proper time** — the time measured by a clock that is present at both events. The shortest time any observer will measure between those two events. All other frames measure more. A deep asymmetry between *the* clock and all others.
4. **The muon experiment** — cosmic-ray muons created in the upper atmosphere at ~15 km altitude, with a rest-frame half-life of 2.2 μs. Classically, only ~0.3% should survive to sea level. Measured: roughly half do. Dilation factor γ ≈ 20 at their observed 0.998c. Rossi and Hall, 1941.
5. **Hafele and Keating, 1971** — four caesium beam clocks aboard commercial Pan Am flights. Eastbound loss: 59 ± 10 ns. Westbound gain: 273 ± 7 ns. Both agreed with the combined SR + GR prediction to within error.
6. **GPS as the constant test** — every satellite clock runs a few microseconds fast per day relative to ground clocks after both special and general relativity corrections. Without them, GPS position errors would grow by ~10 km per day.
7. **What's next** — if time dilates, does space also stretch or shrink? FIG.07.

**Scenes to build (3):**

| File | Purpose |
|---|---|
| `light-clock-scene.tsx` | A light clock, drawn twice on the same canvas: once at rest (vertical photon path), once moving at slider-selected v (diagonal path). Tick readouts on both. γ displayed live. |
| `gamma-factor-scene.tsx` | A plot of γ vs v/c. Drag a point along the curve; readouts show v, γ, and the percentage time-dilation. Log-scale toggle so the near-c blow-up is visible. |
| `muon-decay-scene.tsx` | Vertical atmosphere column with muons raining down at 0.998c. Slider: toggle "classical" prediction (nearly all decay before reaching ground) vs "relativistic" (half survive). Muon-counter at sea level. |

**Physicists (aside):**
- Albert Einstein *(exists)*
- Hendrik Lorentz *(exists)*
- Hermann Minkowski *(NEW — Einstein's former mathematics professor; in 1908 recasts SR in four-dimensional spacetime; deserves his own aside when he first appears, fuller treatment at FIG.10)*

**Glossary terms:**
- `time-dilation` — concept
- `gamma-factor` — concept (a.k.a. Lorentz factor)
- `proper-time` — concept
- `light-clock` — concept
- `muon-experiment` — experiment
- `hafele-keating-experiment` — experiment

**Files to touch:**
- `app/[locale]/(topics)/relativity/time-dilation/content.en.mdx`
- Same path, `content.he.mdx`, `content.ru.mdx`, and `page.tsx`
- `components/physics/light-clock-scene.tsx` (new)
- `components/physics/gamma-factor-scene.tsx` (new)
- `components/physics/muon-decay-scene.tsx` (new)
- `components/physics/visualization-registry.tsx` (register 3 scenes)
- `lib/physics/lorentz.ts` (new — γ factor, first appearance; will be reused in FIG.07, FIG.08, FIG.09, FIG.11)
- `lib/content/physicists.ts` + `messages/<locale>/physicists.json` (add Minkowski short aside)
- `lib/content/glossary.ts` + `messages/<locale>/glossary.json` (add 6 terms)
- `lib/content/branches.ts` (`readingMinutes: 13`)
- `messages/<locale>/home.json`

**What this topic assumes:**
- FIG.04 (postulates) and FIG.05 (simultaneity) fully absorbed.
- Pythagoras. That is all the math the light-clock derivation needs.

**Reading minutes:** 13.

---

### FIG.07 — Length Contraction

**Hook.** A ruler 1 metre long at rest in its own frame, passing you at 0.87c, measures 50 cm. Not an illusion, not a distortion of light — the ruler *is* shorter in your frame. Lorentz and FitzGerald proposed the formula as a patch on the ether model. Einstein showed it follows from the two postulates with no ether needed.

**Sections (7):**

1. **The symmetry with time dilation** — if the two postulates force Δt = γ·Δt₀, the same argument applied to lengths gives L = L₀/γ. The two effects are geometrically the same rotation of spacetime, seen from two sides.
2. **Proper length** — the length of an object measured in its own rest frame. The longest any observer will measure. All moving observers measure less.
3. **How you measure a moving length** — you mark the positions of its two ends *simultaneously in your frame* and subtract. Because simultaneity is frame-dependent (FIG.05), different frames get different answers. The effect is not paradoxical once simultaneity is understood; it's required by it.
4. **The barn and pole paradox** — a 20 m pole racing at 0.87c through a 10 m barn. In the barn frame, the contracted pole (10 m) fits entirely inside with both doors briefly closed. In the pole frame, the contracted barn (5 m) can never contain the full 20 m pole. Both are correct; the "doors closed simultaneously" event-pair is not simultaneous in the pole's frame.
5. **The pole-in-the-barn resolution** — spacetime diagrams make it obvious. The two door-closings are a pair of events; their time order depends on the frame. No frame sees the pole both contained and not contained.
6. **What does not contract** — transverse dimensions (perpendicular to motion) are unchanged. A sphere flying past does not become an ellipsoid; because of light-travel-time effects on the observer's eye, it looks *rotated* (Terrell–Penrose rotation, 1959) — a subtlety Einstein himself missed.
7. **What's next** — unify time dilation, length contraction, and the relativity of simultaneity in one transformation. FIG.08.

**Scenes to build (2):**

| File | Purpose |
|---|---|
| `length-contraction-scene.tsx` | A ruler of rest length 1 m flies past at slider-selected v. The measured length in the observer's frame is drawn live alongside γ. Transverse ruler (unchanged) shown for contrast. |
| `barn-pole-scene.tsx` | Animated barn and pole. Toggle between barn frame (pole fits) and pole frame (pole does not fit). Spacetime diagram panel below showing the two door-closing events on the two frames' simultaneity slices. |

**Physicists (aside):**
- Albert Einstein *(exists)*
- Hendrik Lorentz *(exists)*
- George Francis FitzGerald *(exists from FIG.03)*

**Glossary terms:**
- `length-contraction` — concept
- `proper-length` — concept
- `barn-pole-paradox` — concept
- `terrell-penrose-rotation` — phenomenon

**Files to touch:**
- `app/[locale]/(topics)/relativity/length-contraction/content.en.mdx`
- Same path, `content.he.mdx`, `content.ru.mdx`, and `page.tsx`
- `components/physics/length-contraction-scene.tsx` (new)
- `components/physics/barn-pole-scene.tsx` (new)
- `components/physics/visualization-registry.tsx` (register 2 scenes)
- `lib/physics/lorentz.ts` (extend with `contract(L₀, v)`)
- `lib/content/glossary.ts` + `messages/<locale>/glossary.json` (add 4 terms)
- `lib/content/branches.ts` (`readingMinutes: 11`)
- `messages/<locale>/home.json`

**What this topic assumes:**
- FIG.05 simultaneity. Without it, the barn-pole resolution makes no sense.
- FIG.06 time dilation. The duality between the two effects is the pedagogical core.

**Reading minutes:** 11.

---

### FIG.08 — The Twin Paradox

**Hook.** One twin stays on Earth. The other boards a rocket, accelerates to 0.95c, flies to a star 20 light-years away, turns around, and comes home. For the Earth twin, 42 years pass. For the rocket twin, 13 years pass. She is biologically younger than her brother. He is not. This is not an illusion. It is the most-asked and most-misunderstood question in special relativity.

**Sections (7):**

1. **Why it looks paradoxical** — each twin sees the other moving away. Each should see the other's clock running slow. By symmetry, neither should be younger. And yet one of them *is*.
2. **The broken symmetry** — the rocket twin *turns around*. She changes inertial frame. The Earth twin does not. The situation is not symmetric between them; one has a history written in a single frame, the other has a history written in two (or three, if you count acceleration phases).
3. **Computing the ages** — Earth twin experiences 2·D/v in Earth's frame. Rocket twin experiences (2·D/v)/γ in her own combined proper time. Plug v = 0.95c, D = 20 ly: 42 years vs 13 years.
4. **The spacetime-diagram proof** — plot both worldlines. The straight-line worldline (Earth twin) has the *longest* proper time between the two meeting events. Every zigzag path (rocket twin) has a shorter proper time. Spacetime's geometry is inverted compared to Euclidean: straight lines are *longest*, not shortest.
5. **The Doppler-shift accounting** — a more visceral derivation. Over the outbound leg, each twin sees the other's clock red-shifted (slow). Over the inbound leg, each sees the other blue-shifted (fast). But the twins experience the regime change at different times: the rocket twin switches immediately on turnaround; the Earth twin does not see the switch until the return signal reaches her, years later. Asymmetric bookkeeping → asymmetric ages.
6. **Experimental evidence** — Hafele and Keating 1971 was already a twin paradox in miniature. Every muon that reaches sea level is a twin-paradox demo. Particles stored in circular accelerators age more slowly than lab clocks by exactly γ.
7. **What's next** — write the transformation that encodes all of this. FIG.09.

**Scenes to build (2):**

| File | Purpose |
|---|---|
| `twin-paradox-scene.tsx` | Two clocks ticking side by side. On "launch", one flies to a star at v (slider) and returns. Earth clock readout and rocket clock readout diverge. At reunion, the rocket clock reads less. Timeline bar on the bottom. |
| `twin-spacetime-scene.tsx` | Spacetime diagram: Earth twin's straight worldline, rocket twin's zigzag. Proper times computed and displayed along each segment. Tick marks at equal proper-time intervals demonstrate that the zigzag has fewer. |

**Physicists (aside):**
- Albert Einstein *(exists — 1911 popular lecture introduced the twin setup)*
- Paul Langevin *(NEW — French physicist who formalised the paradox in 1911 with a traveller-and-stay-at-home version; the twins were his image)*

**Glossary terms:**
- `twin-paradox` — concept
- `proper-time-maximisation` — concept
- `worldline` — concept (a stub here; fuller entry in FIG.10)

**Files to touch:**
- `app/[locale]/(topics)/relativity/twin-paradox/content.en.mdx`
- Same path, `content.he.mdx`, `content.ru.mdx`, and `page.tsx`
- `components/physics/twin-paradox-scene.tsx` (new)
- `components/physics/twin-spacetime-scene.tsx` (new)
- `components/physics/visualization-registry.tsx` (register 2 scenes)
- `lib/content/physicists.ts` + `messages/<locale>/physicists.json` (add Langevin)
- `lib/content/glossary.ts` + `messages/<locale>/glossary.json` (add 3 terms)
- `lib/content/branches.ts` (`readingMinutes: 12`)
- `messages/<locale>/home.json`

**What this topic assumes:**
- FIG.06 time dilation. Everything else is about the asymmetry between the twins' histories.
- A gentle introduction to worldlines. The spacetime-diagram proof is the cleanest one; do not skip it.

**Reading minutes:** 12.

---

## Module 4 · Lorentz Transformations

### FIG.09 — The Lorentz Transformations

**Hook.** Lorentz wrote them down in 1904 to save the ether. Poincaré cleaned up the algebra in 1905 and named them "the Lorentz transformations". Einstein, the same year, derived them from two postulates with no ether in sight. Three physicists, three routes, one set of four equations that say what it means to change inertial frames in a universe with a finite signal speed.

**Sections (7):**

1. **The derivation sketch** — require linearity (so inertial motion stays inertial), isotropy (so the transformation doesn't pick out a direction), the relativity principle (so S and S' are on equal footing), and the constancy of c (so a light pulse in S is a light pulse in S'). Out pops the Lorentz transformation uniquely.
2. **The four equations** — t' = γ(t − vx/c²), x' = γ(x − vt), y' = y, z' = z. The second equation is Galileo's x' = x − vt with a γ in front. The first equation is new — it is where relativity of simultaneity lives.
3. **The γ factor, again** — same γ = 1/√(1 − v²/c²). The universal stretch factor of relativity. Small v → γ ≈ 1 → the whole transformation collapses to Galileo. Relativity contains Newtonian mechanics as its low-speed limit.
4. **Velocity addition, relativistic** — differentiate the transformation. u' = (u − v) / (1 − uv/c²). Two speeds less than c compose to a speed less than c. Two c's compose to c. The speed of light is a fixed point of the composition law.
5. **What the transformation does to events** — rotates simultaneity slices (FIG.05), stretches time intervals (FIG.06), contracts lengths (FIG.07). Every effect so far is a different projection of the same four equations.
6. **Minkowski's reformulation** — Hermann Minkowski, 1908, realises the Lorentz transformation is a rotation in a four-dimensional space with metric diag(−1, +1, +1, +1). Time and space are components of one object. "Henceforth space by itself, and time by itself, are doomed to fade away into mere shadows."
7. **What's next** — the invariant interval, the quantity that *is* preserved by every Lorentz transformation. FIG.10.

**Scenes to build (2):**

| File | Purpose |
|---|---|
| `lorentz-transform-scene.tsx` | Two spacetime grids, S and S'. Boost slider (v/c from 0 to 0.99). Watch the S' grid skew into a diamond as v increases. A point event is shown with (t,x) and (t',x') coordinates updating live. |
| `relativistic-velocity-addition-scene.tsx` | Three sliders: v (frame boost), u (velocity in inner frame). Readout: classical u + v and relativistic (u+v)/(1+uv/c²). Both plotted vs u for a fixed v. Asymptote at c visible. |

**Physicists (aside):**
- Hendrik Lorentz *(exists)*
- Henri Poincaré *(exists)*
- Albert Einstein *(exists)*
- Hermann Minkowski *(exists from FIG.06 aside — full treatment of his role here)*

**Glossary terms:**
- `lorentz-transformation` — concept
- `relativistic-velocity-addition` — concept
- `boost` — concept
- `lorentz-covariance` — concept

**Files to touch:**
- `app/[locale]/(topics)/relativity/lorentz-transformations/content.en.mdx`
- Same path, `content.he.mdx`, `content.ru.mdx`, and `page.tsx`
- `components/physics/lorentz-transform-scene.tsx` (new)
- `components/physics/relativistic-velocity-addition-scene.tsx` (new)
- `components/physics/visualization-registry.tsx` (register 2 scenes)
- `lib/physics/lorentz.ts` (extend with full 4-component transformation and velocity-addition utility)
- `lib/content/glossary.ts` + `messages/<locale>/glossary.json` (add 4 terms)
- `lib/content/branches.ts` (`readingMinutes: 13`)
- `messages/<locale>/home.json`

**What this topic assumes:**
- FIG.06–FIG.08 in hand. The Lorentz transformations unify everything that came before.
- Comfort reading a displayed formula. Derivation is sketched, not rigorously carried out.

**Reading minutes:** 13.

---

### FIG.10 — Spacetime, the Interval, and the Light Cone

**Hook.** Minkowski, Cologne, 21 September 1908, addressing the 80th Assembly of German Natural Scientists and Physicians: *"The views of space and of time which I wish to lay before you have sprung from the soil of experimental physics, and therein lies their strength. They are radical. Henceforth space by itself, and time by itself, are doomed to fade away into mere shadows…"* Einstein at first called it "superfluous learnedness". Within a decade he was building general relativity on top of it.

**Sections (7):**

1. **The four-dimensional manifold** — events are points in (t, x, y, z). A history is a worldline, a curve through spacetime. Every physical question is a question about the geometry of curves and regions in this four-dimensional space.
2. **The invariant interval** — Δs² = −c²Δt² + Δx² + Δy² + Δz². Every inertial observer computes the same Δs² for the same pair of events. The invariant of Lorentz transformations, just as distance is the invariant of rotations in Euclidean space.
3. **The three regimes** — Δs² < 0 timelike: some observer sees the events at the same place; cause-and-effect possible. Δs² > 0 spacelike: some observer sees them simultaneous; no cause-and-effect possible. Δs² = 0 lightlike: only a light signal connects them.
4. **The light cone** — at every event, the set of all lightlike directions forms a double cone. Inside the future cone lies every event that *can* be influenced by the present. Inside the past cone lies every event that *could have* influenced it. Outside, nothing — those events are causally separated.
5. **Causality preserved** — timelike-separated events keep their time order under every Lorentz boost. Spacelike-separated events can have either order, but no signal can pass between them anyway, so no paradox.
6. **Proper time along a worldline** — for an object moving on a timelike worldline, proper time is the "arclength" under the Minkowski metric: τ = ∫ √(−Δs²)/c. The twin paradox (FIG.08) is the statement that the straight worldline has the longest proper time.
7. **What's next** — attach a physics to these geometric objects. Four-vectors. FIG.11.

**Scenes to build (3):**

| File | Purpose |
|---|---|
| `light-cone-scene.tsx` | A 2+1 perspective view of a light cone at an event. Clickable regions: "future", "past", "elsewhere". Toggleable worldlines show timelike (inside cone), spacelike (outside), and lightlike (on surface) trajectories. |
| `spacetime-interval-scene.tsx` | Two events draggable on a (t, x) canvas. Δs² computed live. Colour codes: red for spacelike, blue for timelike, yellow for lightlike. Invariance demonstrated by a boost slider: coordinates change, Δs² stays fixed. |
| `worldline-proper-time-scene.tsx` | Draw your own worldline (piecewise linear). Proper time accumulator runs along it. A straight line between the same endpoints accumulates more. Pedagogical proof of the twin-paradox geometry. |

**Physicists (aside):**
- Hermann Minkowski *(exists — full-length entry here, with the 1908 Cologne lecture quoted)*
- Albert Einstein *(exists — initial scepticism, later conversion)*

**Glossary terms:**
- `spacetime` — concept
- `minkowski-space` — concept
- `invariant-interval` — concept
- `light-cone` — concept
- `timelike` — concept
- `spacelike` — concept
- `lightlike` — concept
- `worldline` — concept (full entry; stub in FIG.08 upgrades)

**Files to touch:**
- `app/[locale]/(topics)/relativity/spacetime-and-light-cone/content.en.mdx`
- Same path, `content.he.mdx`, `content.ru.mdx`, and `page.tsx`
- `components/physics/light-cone-scene.tsx` (new — 3D or 2+1 perspective; budget extra build time)
- `components/physics/spacetime-interval-scene.tsx` (new)
- `components/physics/worldline-proper-time-scene.tsx` (new)
- `components/physics/visualization-registry.tsx` (register 3 scenes)
- `lib/physics/spacetime.ts` (new — interval, causal-type classifier, proper-time integrator)
- `lib/content/physicists.ts` + `messages/<locale>/physicists.json` (upgrade Minkowski entry to full length)
- `lib/content/glossary.ts` + `messages/<locale>/glossary.json` (add 8 terms)
- `lib/content/branches.ts` (`readingMinutes: 14`)
- `messages/<locale>/home.json`

**What this topic assumes:**
- Lorentz transformations from FIG.09.
- Willingness to think in 4D. The 2+1 diagrams do most of the lifting; no reader needs to manipulate tensors at this point.

**Build notes:**
- `light-cone-scene.tsx` is the single most involved scene in the branch. Plan on a week of focused work. Consider `three.js` or `react-three-fiber` for this one; 2D canvas is not enough.

**Reading minutes:** 14.

---

## Module 5 · Four-Vectors & Relativistic Dynamics

### FIG.11 — Four-Vectors and Four-Momentum

**Hook.** Once you have Minkowski's spacetime, every physical quantity needs to be recast as an object that transforms cleanly under Lorentz boosts. Position becomes the four-position. Velocity becomes the four-velocity. Momentum and energy stop being two separate things and become the four components of a single four-vector. The book-keeping forces the physics.

**Sections (7):**

1. **What a four-vector is** — a four-component object whose components transform like (ct, x, y, z) under Lorentz boosts. Just as a 3-vector has a well-defined length, a four-vector has a well-defined Minkowski norm that every observer agrees on.
2. **Four-position and four-velocity** — x^μ = (ct, x⃗) is the four-position. Differentiating by proper time gives the four-velocity u^μ = γ(c, v⃗). Its norm is always u·u = −c² — a constant, the same for every observer.
3. **Four-momentum** — mass times four-velocity. p^μ = (E/c, p⃗) with E = γmc² and p⃗ = γmv⃗. The time-component is energy (over c); the space-components are the relativistic momentum. One four-vector unifies them.
4. **The invariant norm: E² = (pc)² + (mc²)²** — the Minkowski square of p^μ is −m²c². Rearranged, this is the full relativistic energy-momentum relation. Reduces at low speeds to E ≈ mc² + p²/2m: rest energy plus Newtonian kinetic energy.
5. **Massless particles** — set m = 0. The relation becomes E = pc. Photons. Gluons. The particles that must travel at c and can never be brought to rest. They carry momentum without mass, solving a puzzle Maxwell already knew about radiation pressure.
6. **Why Newton's p = mv is wrong at high v** — a straight Newtonian momentum is not conserved in a collision when analysed across frames. The γmv definition is. Conservation of four-momentum is the law that replaces separate conservation of energy and Newtonian momentum.
7. **What's next** — what E = mc² really says, and what particle accelerators prove. FIG.12.

**Scenes to build (2):**

| File | Purpose |
|---|---|
| `four-momentum-scene.tsx` | A particle with slider-controlled v. Readouts: γ, m, p (relativistic), E (total), KE (total minus rest), and the invariant √(E² − p²c²) = mc². Watch the last readout stay fixed as v varies. |
| `massless-particle-scene.tsx` | Toggle between "massive particle" and "photon". For the massive one, vary v; for the photon, v is locked to c. Energy-momentum relation E² = (pc)² + (mc²)² plotted as a hyperbola (massive) or a line through the origin (massless). |

**Physicists (aside):**
- Albert Einstein *(exists)*
- Hermann Minkowski *(exists — four-vector formalism is his invention)*
- Max Planck *(NEW — short aside; 1906 extended Einstein's 1905 dynamics, first wrote relativistic momentum in its modern form; fuller Planck treatment lives in the Quantum branch)*

**Glossary terms:**
- `four-vector` — concept
- `four-momentum` — concept
- `four-velocity` — concept
- `relativistic-energy` — concept
- `massless-particle` — concept

**Files to touch:**
- `app/[locale]/(topics)/relativity/four-vectors/content.en.mdx`
- Same path, `content.he.mdx`, `content.ru.mdx`, and `page.tsx`
- `components/physics/four-momentum-scene.tsx` (new)
- `components/physics/massless-particle-scene.tsx` (new)
- `components/physics/visualization-registry.tsx` (register 2 scenes)
- `lib/physics/four-momentum.ts` (new — four-momentum utilities, invariant mass calculator, velocity-to-γ helper)
- `lib/content/physicists.ts` + `messages/<locale>/physicists.json` (add Planck short aside)
- `lib/content/glossary.ts` + `messages/<locale>/glossary.json` (add 5 terms)
- `lib/content/branches.ts` (`readingMinutes: 12`)
- `messages/<locale>/home.json`

**What this topic assumes:**
- Lorentz transformations and the spacetime interval.
- Willingness to see the Greek-index notation (μ ∈ {0,1,2,3}) at least once. Explain it in one paragraph; do not drill.

**Reading minutes:** 12.

---

### FIG.12 — E = mc² and Relativistic Collisions

**Hook.** September 1905, Einstein's fourth paper of the year — three pages long, titled *Does the Inertia of a Body Depend Upon Its Energy Content?* The answer, in the last sentence: yes, and the relation is E = mc². Four decades later, in New Mexico, that three-page paper becomes 20 kilotons of TNT. Every star in the sky is running the same equation in reverse.

**Sections (7):**

1. **The second 1905 paper on relativity** — a footnote, almost. Einstein asks what happens when a body emits two light pulses in opposite directions. Conservation of momentum forces a reduction in the body's mass. Compute: Δm = ΔE/c². Rest energy exists.
2. **Rest energy** — a body at rest has energy mc². An electron, 0.511 MeV. A proton, 938 MeV. A 1 kg mass, 9 × 10¹⁶ J — roughly 20 megatons of TNT.
3. **Mass–energy equivalence, not conversion** — "mass turns into energy" is a slogan. The truth: mass and energy are two names for the same four-vector component. When mass "disappears" in a reaction, the energy is just redistributed into forms we call kinetic or radiative.
4. **Binding energy** — why a helium-4 nucleus weighs less than the sum of its constituent protons and neutrons. The missing mass is the binding energy, released when the nucleus formed. This is what powers stars (hydrogen → helium fusion) and what powers nuclear weapons (heavy-nucleus fission).
5. **Relativistic collisions** — use conservation of four-momentum. Before = after, component by component. Solves elastic and inelastic collisions at any speed, recovers Newtonian conservation laws at low speed as a special case.
6. **Pair production and annihilation** — a gamma ray with E > 2m_ec² can, in the field of a nucleus, produce an electron–positron pair. The reverse: an electron and a positron meeting annihilate into two gamma rays. Matter converting to radiation, observed in every particle-physics lab since 1933.
7. **Accelerator evidence** — every particle collider is a direct test of relativistic dynamics. The LHC accelerates protons to γ ≈ 7000. Their measured masses, lifetimes, and decay products are what relativistic four-momentum conservation predicts, to extraordinary precision.
8. **What's next** — special relativity is finished; gravity next. FIG.13.

**Scenes to build (2):**

| File | Purpose |
|---|---|
| `mass-energy-scene.tsx` | A mass slider (1 g to 1 kg). Computed energy equivalent in joules, megatons of TNT, and seconds of world electricity consumption. A visceral scale panel. |
| `relativistic-collision-scene.tsx` | Two particles collide head-on at slider-chosen velocities. Panel shows conservation of four-momentum, before and after. Toggle between elastic and inelastic (mass-creation) modes. Pair production mode available as an extra. |

**Physicists (aside):**
- Albert Einstein *(exists)*
- Marie Curie *(NEW — radioactivity provided the first hints that vast energies could come from nuclear processes; her 1903 and 1911 Nobels sit behind the mass-energy story; fuller treatment in the Nuclear branch)*

**Glossary terms:**
- `mass-energy-equivalence` — concept
- `rest-energy` — concept
- `binding-energy` — concept
- `pair-production` — phenomenon
- `annihilation` — phenomenon

**Files to touch:**
- `app/[locale]/(topics)/relativity/mass-energy-equivalence/content.en.mdx`
- Same path, `content.he.mdx`, `content.ru.mdx`, and `page.tsx`
- `components/physics/mass-energy-scene.tsx` (new)
- `components/physics/relativistic-collision-scene.tsx` (new)
- `components/physics/visualization-registry.tsx` (register 2 scenes)
- `lib/physics/four-momentum.ts` (extend with collision solver)
- `lib/content/physicists.ts` + `messages/<locale>/physicists.json` (add Marie Curie short aside)
- `lib/content/glossary.ts` + `messages/<locale>/glossary.json` (add 5 terms)
- `lib/content/branches.ts` (`readingMinutes: 13`)
- `messages/<locale>/home.json`

**What this topic assumes:**
- Four-momentum conservation (FIG.11).
- A pinch of nuclear physics intuition (binding energy). Full nuclear detail stays in its own branch.

**Cross-branch links:**
- `related:` → Nuclear branch (binding energy, fission, fusion) for the stellar and reactor applications.
- `related:` → Quantum branch (pair production) for the QED treatment.

**Reading minutes:** 13.

---

## Module 6 · The Equivalence Principle

### FIG.13 — The Happiest Thought

**Hook.** Bern, 1907. Einstein, still at the patent office, still two years from leaving it for a professorship, is preparing a review article on special relativity for a yearbook. He realises that gravity does not fit the theory. Then, in his own words: *"I was sitting in a chair at the patent office in Bern when, all of a sudden, a thought occurred to me: 'If a person falls freely, he will not feel his own weight.' I was startled. This simple thought made a deep impression on me. It impelled me toward a theory of gravitation."* Eight years to work it out. That single thought is the seed.

**Sections (7):**

1. **Gravity breaks special relativity** — SR's inertial frames are global, Newton's gravitational field is instantaneous. A moving mass would signal its position faster than c. Einstein has to generalise.
2. **The thought experiment** — a person in a freely falling elevator. Release a ball from her hand; it floats. Her feet leave the floor. Locally, there is no gravity. Something about gravity and acceleration are the same thing.
3. **The weak equivalence principle** — inertial mass (the m in F = ma) and gravitational mass (the m in F = GMm/r²) are equal. Galileo observed this with balls off the Tower of Pisa (possibly apocryphal); Newton quantified it; Loránd Eötvös tested it to 1 part in 10⁹ around 1900; modern tests to 1 part in 10¹⁵.
4. **The strong (Einsteinian) equivalence principle** — not just mass, but *all laws of physics* are the same in a locally-inertial frame (a freely-falling elevator) as in empty space with no gravity. Bolder. Harder to verify. True.
5. **The elevator at rest on Earth vs the accelerating rocket** — both produce the same local physics. Drop a ball: it falls at g. Shine a sideways light beam: it bends. Einstein immediately realises: *light bends in a gravitational field*. Seven years before general relativity is done.
6. **Local vs global** — the principle is strictly local. Over a large enough region, a real gravitational field varies in direction (tidal effects) and an accelerating rocket doesn't. Tidal forces are the part of gravity that cannot be transformed away — they are the "real" gravity.
7. **What's next** — if freely falling frames are locally inertial, what does a global description look like? Spacetime must curve. FIG.14.

**Scenes to build (2):**

| File | Purpose |
|---|---|
| `elevator-equivalence-scene.tsx` | Two elevators side by side. Left: stationary on Earth. Right: accelerating at g in deep space. Inside each, a passenger drops a ball, throws a ball sideways. Ball trajectories are identical. Toggle to "freely falling on Earth" — both passengers float. |
| `weak-equivalence-scene.tsx` | Feather and hammer drop on the Moon (homage to the Apollo 15 demonstration, David Scott, 1971). Inertial and gravitational mass inputs; the only way they separate is if the equivalence principle fails. |

**Physicists (aside):**
- Albert Einstein *(exists)*
- Loránd Eötvös *(NEW — Hungarian physicist; the torsion-balance experiments that tested the equivalence principle to unprecedented precision, 1885–1922)*
- Galileo Galilei *(exists — the Tower of Pisa, real or mythic)*

**Glossary terms:**
- `equivalence-principle` — concept (with weak / strong subsections)
- `inertial-mass` — concept
- `gravitational-mass` — concept
- `freely-falling-frame` — concept

**Files to touch:**
- `app/[locale]/(topics)/relativity/equivalence-principle/content.en.mdx`
- Same path, `content.he.mdx`, `content.ru.mdx`, and `page.tsx`
- `components/physics/elevator-equivalence-scene.tsx` (new)
- `components/physics/weak-equivalence-scene.tsx` (new)
- `components/physics/visualization-registry.tsx` (register 2 scenes)
- `lib/content/physicists.ts` + `messages/<locale>/physicists.json` (add Eötvös)
- `lib/content/glossary.ts` + `messages/<locale>/glossary.json` (add 4 terms)
- `lib/content/branches.ts` (`readingMinutes: 11`)
- `messages/<locale>/home.json`

**What this topic assumes:**
- Special relativity complete through FIG.12.
- Newtonian gravity at the F = GMm/r² level. No tensor calculus; that starts in FIG.15.

**Reading minutes:** 11.

---

### FIG.14 — Gravitational Redshift and Time Dilation

**Hook.** Harvard, 1959. Robert Pound and Glen Rebka send gamma rays from the bottom of a 22.5-metre elevator shaft to the top of Jefferson Laboratory, using the Mössbauer effect as a clock. They measure a frequency shift of 2.5 parts in 10¹⁵, exactly the value Einstein predicted in 1911. Gravity slows time. Fifty years after the prediction, in a university lift shaft, on Earth.

**Sections (7):**

1. **The argument from energy conservation** — consider a photon climbing out of a gravity well. It must lose energy, because if it didn't, dropping matter, converting to photons, sending them up, and re-converting would be a perpetual-motion machine. Photon energy = hf, so the photon must shift to lower frequency — a redshift.
2. **The argument from the equivalence principle** — a photon emitted at the floor of an accelerating rocket and absorbed at the ceiling arrives Doppler-redshifted. By equivalence, the same must happen in a static gravitational field. Quantitatively: Δf/f = −gh/c².
3. **What it means for clocks** — a clock lower in a gravity well ticks slower than a clock higher up. Not by much on Earth — about 10⁻¹⁶ per metre — but measurable.
4. **Pound–Rebka, 1959** — 22.5 m tower, gamma rays, Mössbauer-effect iron-57 absorbers. Measured frequency shift: 2.5 × 10⁻¹⁵. Predicted: 2.46 × 10⁻¹⁵. Better than 10% agreement, in a building still standing.
5. **GPS, in detail** — satellite clocks tick faster than ground clocks by 45 μs/day (GR) and slower by 7 μs/day (SR). Net: 38 μs/day faster. Ignored, GPS would be useless in hours.
6. **Clocks up mountains, down mines** — commercial clocks made from 2010 onward (NIST optical-lattice clocks) resolve the gravitational redshift across height differences of centimetres. A clock on your desk runs faster than one on the floor, and we can measure it.
7. **What's next** — if time runs differently at different heights, spacetime itself must be curved. FIG.15.

**Scenes to build (2):**

| File | Purpose |
|---|---|
| `gravitational-redshift-scene.tsx` | A tower with a photon climbing up and falling down. Photon energy (frequency) displayed as a colour; shifts redder on the way up, bluer on the way down. Height slider; planet-mass slider (toggleable presets: Earth, Jupiter, white dwarf, neutron star). |
| `pound-rebka-scene.tsx` | The Harvard tower, schematic. Gamma-ray source at the bottom, Mössbauer absorber at the top. Slider to tune emitter velocity (used in the actual experiment to compensate the shift). Measured shift vs predicted shift overlaid. |

**Physicists (aside):**
- Albert Einstein *(exists — 1907/1911 prediction)*
- Robert Pound *(NEW — Harvard experimenter; precision gamma-ray spectroscopy)*
- Glen Rebka *(NEW — Pound's graduate student, first author on the 1959 paper)*
- Rudolf Mössbauer *(NEW — 1958 discovery of recoil-free gamma emission; made the experiment possible; 1961 Nobel)*

**Glossary terms:**
- `gravitational-redshift` — phenomenon
- `gravitational-time-dilation` — phenomenon
- `pound-rebka-experiment` — experiment
- `mossbauer-effect` — phenomenon

**Files to touch:**
- `app/[locale]/(topics)/relativity/gravitational-redshift/content.en.mdx`
- Same path, `content.he.mdx`, `content.ru.mdx`, and `page.tsx`
- `components/physics/gravitational-redshift-scene.tsx` (new)
- `components/physics/pound-rebka-scene.tsx` (new)
- `components/physics/visualization-registry.tsx` (register 2 scenes)
- `lib/content/physicists.ts` + `messages/<locale>/physicists.json` (add Pound, Rebka, Mössbauer)
- `lib/content/glossary.ts` + `messages/<locale>/glossary.json` (add 4 terms)
- `lib/content/branches.ts` (`readingMinutes: 11`)
- `messages/<locale>/home.json`

**What this topic assumes:**
- FIG.13 equivalence principle. The two derivations (energy conservation; equivalence + Doppler) are both worth presenting.
- Photon energy = hf. A one-paragraph reminder is enough.

**Reading minutes:** 11.

---

## Module 7 · Curved Spacetime

### FIG.15 — Why Gravity Is Geometry

**Hook.** Einstein to Grossmann, 1912: *"Grossmann, you must help me or I shall go crazy."* Einstein has realised that curved spacetime is the only way to make gravity local and Lorentz-covariant. He does not know the mathematics. Marcel Grossmann, his friend from ETH Zürich, a professional mathematician, hands him Riemann, Ricci, Levi-Civita. Three years of calculation follow. November 1915: the Einstein field equations.

**Sections (7):**

1. **The analogy that almost fits** — a trampoline with a bowling ball on it. Nearby marbles roll toward the ball, not because of a force, but because the surface curves. The picture is wrong in several ways (it only shows a 2D slice; the cause-effect arrow is reversed) but it builds the right intuition.
2. **Geodesics** — the "straightest possible" paths in a curved space. On a sphere, great circles. In spacetime, the paths freely falling objects follow. Newton's "a body moves in a straight line unless acted on" becomes "a body moves on a geodesic unless acted on by a non-gravitational force". Gravity is no longer a force.
3. **The metric tensor (gentle)** — g_μν. The object that tells you, at each event, how to measure distance-and-time. In flat Minkowski space, g = diag(−1, 1, 1, 1). In a gravitational field, the components vary from point to point. The metric *is* the gravitational field.
4. **Curvature** — the Riemann curvature tensor, R^ρ_σμν. Measures how much parallel transport around a loop fails to return a vector to its original direction. Non-zero curvature means geometry is not flat. Zero curvature means Minkowski spacetime, no gravity.
5. **The Einstein field equations** — G_μν + Λg_μν = (8πG/c⁴) T_μν. Left side: geometry (Einstein tensor, built from the metric and its derivatives). Right side: matter and energy (stress–energy tensor). "Matter tells spacetime how to curve; spacetime tells matter how to move" (Wheeler). Show the equation; do not derive it.
6. **Tests at the 1915 level** — Mercury's perihelion precession (43 seconds of arc per century unexplained by Newton; GR predicts exactly this). Einstein computes it in November 1915 and calls it one of the strongest emotional experiences of his life. He reports heart palpitations.
7. **What's next** — an exact solution to the field equations. FIG.16.

**Scenes to build (3):**

| File | Purpose |
|---|---|
| `geodesic-sphere-scene.tsx` | A sphere with two points on it; draw the geodesic (great-circle arc) between them. Drag either point, watch the geodesic update. Contrast with a "straight line in embedding space" that doesn't live on the surface. Pedagogical — makes "geodesic" concrete before spacetime. |
| `trampoline-scene.tsx` | A 2D grid with adjustable mass in the middle. Grid deforms into a well. Marbles rolled nearby curve inward along geodesics. Disclaimer toggle explaining what this picture gets right and wrong. |
| `mercury-precession-scene.tsx` | Mercury's orbit around the Sun, shown precessing 43″/century. Slider between "Newtonian" (closed ellipse), "GR" (precessing), and "observed" (precessing, matches GR). |

**Physicists (aside):**
- Albert Einstein *(exists)*
- Marcel Grossmann *(NEW — Einstein's ETH classmate and mathematical collaborator, without whom GR would not exist in the form it does)*
- Bernhard Riemann *(NEW — 1854 habilitation lecture on curved geometry; died at 39, 59 years before Einstein needed his work)*
- Gregorio Ricci-Curbastro *(NEW — developed tensor calculus in the 1880s-90s; Einstein used it directly)*
- Tullio Levi-Civita *(NEW — Ricci's student; parallel transport, covariant derivative; Einstein called him "the master")*

**Glossary terms:**
- `general-relativity` — concept
- `geodesic` — concept
- `metric-tensor` — concept
- `curvature` — concept
- `einstein-field-equations` — concept
- `stress-energy-tensor` — concept

**Files to touch:**
- `app/[locale]/(topics)/relativity/curved-spacetime/content.en.mdx`
- Same path, `content.he.mdx`, `content.ru.mdx`, and `page.tsx`
- `components/physics/geodesic-sphere-scene.tsx` (new)
- `components/physics/trampoline-scene.tsx` (new)
- `components/physics/mercury-precession-scene.tsx` (new)
- `components/physics/visualization-registry.tsx` (register 3 scenes)
- `lib/content/physicists.ts` + `messages/<locale>/physicists.json` (add Grossmann, Riemann, Ricci-Curbastro, Levi-Civita)
- `lib/content/glossary.ts` + `messages/<locale>/glossary.json` (add 6 terms)
- `lib/content/branches.ts` (`readingMinutes: 15`)
- `messages/<locale>/home.json`

**What this topic assumes:**
- The equivalence principle (FIG.13) and gravitational redshift (FIG.14) are fully in the reader's mind.
- Willingness to see the Einstein field equations written out once, without derivation.

**Pedagogical warning:**
- This is the mathematically heaviest topic in the branch. Resist every urge to derive. Show the equation, explain each side in English, and point readers who want more to a proper GR textbook (e.g. Carroll's *Spacetime and Geometry*) in a footnote.

**Reading minutes:** 15.

---

### FIG.16 — Tests of General Relativity

**Hook.** Príncipe, an island in the Gulf of Guinea, 29 May 1919. Arthur Eddington stands beside a telescope pointed at the total solar eclipse, photographing stars near the Sun's limb. Two months later he develops the plates in Cambridge. The stars have shifted by 1.6 seconds of arc — exactly what Einstein predicted. The Times of London, 7 November 1919: "REVOLUTION IN SCIENCE / NEW THEORY OF THE UNIVERSE / NEWTONIAN IDEAS OVERTHROWN". Einstein becomes, overnight, the most famous scientist since Newton.

**Sections (7):**

1. **Three classical tests** — Mercury's perihelion (already covered in FIG.15), light bending by the Sun, gravitational redshift (FIG.14). The three tests Einstein himself proposed.
2. **Light bending, prediction** — a photon passing the Sun's limb should be deflected by 1.75″ (twice the Newtonian "falling corpuscle" value, which was 0.87″). The factor of two comes from the spatial curvature of the metric, absent from Newton.
3. **Eddington at Príncipe, 1919** — the expedition, the weather, the exposures. A second team on Sobral, Brazil, collected better plates. Both confirmed the GR value over the Newtonian. Eddington announced to the Royal Society on 6 November 1919.
4. **Shapiro time delay, 1964** — Irwin Shapiro proposed that radar signals passing near the Sun should be delayed by the curvature. Verified with Mercury radar, later with spacecraft signals; now routine in Solar System dynamics.
5. **Frame dragging** — a rotating mass drags the inertial frames around it (Lense–Thirring, 1918). Measured by Gravity Probe B, launched 2004, reported 2011: predicted 0.039 ″/yr measured at 0.037 ± 0.007 ″/yr.
6. **Pulsar timing** — Hulse and Taylor, 1974, discovered a binary pulsar whose orbital period is shrinking by 76 μs/yr, exactly matching GR's prediction for energy loss via gravitational radiation. Pulsar timing is currently the most stringent GR test in the strong-field regime. 1993 Nobel.
7. **What's next** — exact solutions. The first, and simplest: Schwarzschild. FIG.17.

**Scenes to build (2):**

| File | Purpose |
|---|---|
| `light-bending-scene.tsx` | The Sun; a distant star. A light ray from the star bends as it passes. Slider: mass of the deflector (toggleable: Sun, Jupiter, neutron star, black hole). Angular deflection readout vs the "no gravity" baseline. Eddington-expedition historical overlay mode. |
| `shapiro-delay-scene.tsx` | Radar pulse from Earth reflecting off a planet on the far side of the Sun. Time-of-flight readout: with Sun present (delayed) and without (geometric minimum). Delay in microseconds. Historical callout: 1967 Venus-radar measurement. |

**Physicists (aside):**
- Arthur Eddington *(NEW — British astrophysicist, 1919 expedition; later wrote the first English-language textbook on GR; stellar structure pioneer)*
- Albert Einstein *(exists)*
- Irwin Shapiro *(NEW — Harvard; proposed and measured the time delay that bears his name)*
- Russell Hulse and Joseph Taylor *(NEW — binary-pulsar discovery 1974; 1993 Nobel; first indirect detection of gravitational waves)*

**Glossary terms:**
- `gravitational-lensing` — phenomenon (stub here; deeper in FIG.18)
- `shapiro-delay` — phenomenon
- `frame-dragging` — phenomenon
- `binary-pulsar` — object (the Hulse–Taylor system as a named entry)

**Files to touch:**
- `app/[locale]/(topics)/relativity/tests-of-gr/content.en.mdx`
- Same path, `content.he.mdx`, `content.ru.mdx`, and `page.tsx`
- `components/physics/light-bending-scene.tsx` (new)
- `components/physics/shapiro-delay-scene.tsx` (new)
- `components/physics/visualization-registry.tsx` (register 2 scenes)
- `lib/content/physicists.ts` + `messages/<locale>/physicists.json` (add Eddington, Shapiro, Hulse, Taylor)
- `lib/content/glossary.ts` + `messages/<locale>/glossary.json` (add 4 terms; `gravitational-lensing` as a stub upgraded in FIG.18)
- `lib/content/branches.ts` (`readingMinutes: 12`)
- `messages/<locale>/home.json`

**What this topic assumes:**
- FIG.15 has given the reader a rough picture of "matter curves spacetime, spacetime curves light's path".
- No actual tensor computation. This is the storytelling topic of Module 7.

**Reading minutes:** 12.

---

## Module 8 · Solutions of General Relativity

### FIG.17 — The Schwarzschild Solution and Black Holes

**Hook.** December 1915. Karl Schwarzschild, 42, Jewish, a professional astronomer, serving as an artillery lieutenant on the Russian front, contracts pemphigus in the trenches. Between calculating shell trajectories, he reads Einstein's November papers on general relativity and, within weeks, produces the first exact solution to the field equations. He posts it to Einstein from the front. Einstein reads it in January, writes back: *"I had not expected that the exact solution to the problem could be formulated so simply."* Schwarzschild dies in May 1916, four months later.

**Sections (7):**

1. **Schwarzschild's setup** — the metric outside a spherically-symmetric, non-rotating mass. Exact. Static. The gravitational analogue of Coulomb's law, for a point mass.
2. **The metric, written out** — ds² = −(1 − rs/r)c²dt² + (1 − rs/r)⁻¹dr² + r²dΩ². One new scalar: the Schwarzschild radius r_s = 2GM/c². For the Sun, 3 km. For Earth, 9 mm.
3. **What happens at r = r_s** — the metric becomes singular in Schwarzschild coordinates. Schwarzschild himself could not have known what this meant; for decades it was thought to be a physical singularity. It is not — it is a coordinate artefact. But it is the event horizon.
4. **The event horizon** — the surface at r = r_s. Once inside, no worldline, not even a photon's, can get out. Not because of a force, but because spacetime itself is tilted so that all future-directed worldlines point inward.
5. **The true singularity** — r = 0. Curvature diverges. GR itself breaks down. Something more fundamental is needed; currently no consensus on what (this is the border with the Quantum branch and its future sibling on quantum gravity).
6. **Oppenheimer and Snyder, 1939** — the first serious treatment of actual collapse to a black hole. Ignored for decades. Wheeler, 1967, coins "black hole". Penrose, 1965, proves singularities are generic under collapse (2020 Nobel).
7. **Observational evidence** — Cygnus X-1, 1971, first stellar-mass black-hole candidate. Sagittarius A*, centre of the Milky Way, 4.3 million solar masses, orbits of individual stars resolved (Ghez and Genzel, 2020 Nobel). Event Horizon Telescope image of M87* (2019) and Sgr A* (2022).

**Scenes to build (3):**

| File | Purpose |
|---|---|
| `schwarzschild-metric-scene.tsx` | An observer far from a point mass. Sliders: mass M, approach radius r. Readouts: proper-time dilation (1 − r_s/r)^½, circumferential slow-down, tidal stretch. Visual: nested light cones tilting as r approaches r_s. |
| `event-horizon-scene.tsx` | A spaceship approaching a non-rotating black hole. Two observers: falling-in and distant. Falling-in clock reads finite time to crossing; distant clock sees her fade to infinity. Light cones drawn along the worldline. |
| `tidal-spaghettification-scene.tsx` | An extended body (schematic astronaut) falling radially. Tidal tensor computed. Stretching along radial direction, compression transverse. At what radius does tidal force exceed human tensile strength? (Depends strongly on M.) |

**Physicists (aside):**
- Karl Schwarzschild *(NEW — the trench, the metric, the early death; the foundational exact solution)*
- J. Robert Oppenheimer *(NEW — 1939 Oppenheimer–Snyder collapse paper; his physics work, not Los Alamos, is what lives in this topic)*
- John Wheeler *(NEW — coiner of "black hole" in 1967, teacher of Feynman, Thorne, Everett; later champion of "it from bit")*
- Roger Penrose *(NEW — 1965 singularity theorem; 2020 Nobel)*

**Glossary terms:**
- `schwarzschild-metric` — concept
- `schwarzschild-radius` — concept
- `event-horizon` — concept
- `black-hole` — object
- `singularity` — concept
- `spaghettification` — phenomenon

**Files to touch:**
- `app/[locale]/(topics)/relativity/schwarzschild-black-hole/content.en.mdx`
- Same path, `content.he.mdx`, `content.ru.mdx`, and `page.tsx`
- `components/physics/schwarzschild-metric-scene.tsx` (new)
- `components/physics/event-horizon-scene.tsx` (new)
- `components/physics/tidal-spaghettification-scene.tsx` (new)
- `components/physics/visualization-registry.tsx` (register 3 scenes)
- `lib/physics/schwarzschild.ts` (new — Schwarzschild radius helper, proper-time dilation factor, tidal-tensor components)
- `lib/content/physicists.ts` + `messages/<locale>/physicists.json` (add Schwarzschild, Oppenheimer, Wheeler, Penrose)
- `lib/content/glossary.ts` + `messages/<locale>/glossary.json` (add 6 terms)
- `lib/content/branches.ts` (`readingMinutes: 15`)
- `messages/<locale>/home.json`

**What this topic assumes:**
- FIG.15. The reader knows that spacetime has a metric; they do not need to be able to manipulate one.
- No Kruskal–Szekeres coordinates. The coordinate-singularity discussion is a paragraph, not a derivation.

**Build notes:**
- `event-horizon-scene.tsx` needs two clocks with clear visual distinction — one reads finite time, one reads asymptote-to-infinity. Consider a split-screen design.
- EHT images of M87* and Sgr A* are NSF/ESO releases and can be used with attribution.

**Reading minutes:** 15.

---

### FIG.18 — Rotating Black Holes and Gravitational Lensing

**Hook.** 1963, Roy Kerr, a New Zealand mathematician at the University of Texas, finds the exact solution for a *rotating* black hole. Forty-seven years after Schwarzschild's static solution. The Kerr metric is mathematically intricate in a way the Schwarzschild metric is not — and every astrophysical black hole is a Kerr black hole, because every star rotates.

**Sections (7):**

1. **Why rotation matters** — the Schwarzschild solution assumes no spin. Real stars spin. When a star collapses, angular momentum is conserved; the resulting black hole spins, often close to the maximum allowed value.
2. **The Kerr metric** — two parameters: mass M and angular momentum per unit mass a = J/Mc. New features: the ergosphere, the inner horizon, frame-dragging as a central feature rather than a perturbation.
3. **The ergosphere** — a region outside the event horizon where spacetime is dragged so fast that you cannot hold still relative to distant stars. You can still escape — unlike inside the horizon. Penrose, 1969: you can extract rotational energy from a rotating black hole by lowering matter into the ergosphere and letting it come out faster.
4. **Gravitational lensing, light deflection at scale** — a foreground mass bends light from a background source. Multiple images. Einstein rings (if the geometry is perfect). First strong-lens system discovered: Twin Quasar 0957+561, 1979. Hubble Space Telescope has catalogued thousands.
5. **Weak lensing and dark matter** — statistical shearing of background galaxy shapes by foreground mass distributions. Used to map dark matter in clusters. The Bullet Cluster (2006) is the canonical example: visible mass and total mass decoupled.
6. **Event Horizon Telescope** — a planet-scale VLBI array. 2019 image of M87* (6.5 billion solar masses, 55 million light-years away). 2022 image of Sgr A* (4.3 million solar masses, 27,000 light-years away). Direct pictures of the photon ring surrounding an event horizon.
7. **What's next** — if two black holes merge, they radiate gravitational waves. FIG.19.

**Scenes to build (2):**

| File | Purpose |
|---|---|
| `kerr-metric-scene.tsx` | Top-down view of a rotating black hole. Spin parameter a slider (0 = Schwarzschild, 0.998 = near-maximal). Shows outer horizon, inner horizon, ergosphere boundary. Arrow field shows frame-dragging velocity at each radius. |
| `gravitational-lensing-scene.tsx` | A foreground mass between the viewer and a distant galaxy. Mass slider, alignment slider. Displays: single image → double image → Einstein ring → arcs. Real HST images available as toggleable references. |

**Physicists (aside):**
- Roy Kerr *(NEW — New Zealand mathematician; the 1963 solution stands as one of the most important computations of 20th-century physics)*
- Roger Penrose *(exists — ergosphere energy extraction, 1969)*
- Subrahmanyan Chandrasekhar *(NEW — stellar structure, the Chandrasekhar limit 1931; wrote the canonical treatise on rotating black holes, 1983)*
- Andrea Ghez and Reinhard Genzel *(NEW — cameo; stellar orbits around Sgr A*; 2020 Nobel)*

**Glossary terms:**
- `kerr-metric` — concept
- `rotating-black-hole` — object
- `ergosphere` — concept
- `frame-dragging` — phenomenon (stub in FIG.16 upgraded)
- `gravitational-lensing` — phenomenon (full entry; stub in FIG.16 upgraded)
- `einstein-ring` — phenomenon

**Files to touch:**
- `app/[locale]/(topics)/relativity/kerr-and-lensing/content.en.mdx`
- Same path, `content.he.mdx`, `content.ru.mdx`, and `page.tsx`
- `components/physics/kerr-metric-scene.tsx` (new)
- `components/physics/gravitational-lensing-scene.tsx` (new)
- `components/physics/visualization-registry.tsx` (register 2 scenes)
- `lib/physics/kerr.ts` (new — horizon radii as a function of (M, a), ergosphere boundary, frame-drag angular velocity)
- `lib/content/physicists.ts` + `messages/<locale>/physicists.json` (add Kerr, Chandrasekhar, Ghez, Genzel)
- `lib/content/glossary.ts` + `messages/<locale>/glossary.json` (add 6 terms)
- `lib/content/branches.ts` (`readingMinutes: 14`)
- `messages/<locale>/home.json`

**What this topic assumes:**
- FIG.17 Schwarzschild. Kerr extends it by adding spin.
- Willingness to look at the Kerr metric once without deriving it. The formalism is significantly harder; the geometry is what matters here.

**Reading minutes:** 14.

---

## Module 9 · Gravitational Waves & Cosmology

### FIG.19 — Gravitational Waves and LIGO

**Hook.** 09:50:45 UTC, 14 September 2015. A signal lasting 0.2 seconds arrives at the LIGO Hanford detector in Washington, and seven milliseconds later at the LIGO Livingston detector in Louisiana. The signal is a chirp — frequency rising from 35 Hz to 250 Hz. It matches, to extraordinary precision, the predicted waveform from two black holes of 36 and 29 solar masses spiralling together and merging a billion light-years away. Einstein predicted gravitational waves in 1916 and was later unsure they were real. One hundred years and fifty-nine days after he submitted the final field equations, a machine built in his honour records one.

**Sections (7):**

1. **Einstein's 1916 prediction** — linearising the field equations in vacuum reveals wave solutions propagating at c. Einstein doubted them in 1936, nearly withdrew a paper claiming they did not exist. Now his most-tested prediction.
2. **What a gravitational wave is** — a propagating ripple of spacetime curvature. Stretches space in one direction, squeezes in the perpendicular direction, oscillates. Quadrupole in character (dipole forbidden by momentum conservation).
3. **The amplitude problem** — gravitational waves from the merger of two 30-solar-mass black holes at 1.3 Gly produce a fractional length change at Earth of 10⁻²¹. Over LIGO's 4 km arms: 10⁻¹⁸ m. One-thousandth the diameter of a proton.
4. **LIGO as an interferometer** — a Michelson interferometer on a Michelson scale. 4 km arms, Fabry–Pérot cavities bouncing laser light ~280 times, sensitivity below 10⁻²¹ strain. Two observatories (Hanford, Livingston) 3000 km apart; signals must agree within light-travel-time. Virgo in Italy joined the network in 2017.
5. **GW150914** — the first detection. Two black holes, 36 M☉ and 29 M☉, merging to 62 M☉ — with 3 M☉ radiated as gravitational-wave energy in 0.2 seconds, peak power exceeding the combined luminous output of every star in the observable universe.
6. **The catalogue since** — GW170817: binary neutron star, detected in gravitational waves and light (multi-messenger astronomy). O4 run 2023–2024: approximately one detection per week. Space-based LISA planned for the 2030s will open the millihertz band.
7. **What's next** — from local gravity to the cosmos. FIG.20.

**Scenes to build (2):**

| File | Purpose |
|---|---|
| `gravitational-wave-scene.tsx` | A plus-polarisation gravitational wave passing through a ring of test particles. Ring stretches and compresses in the expected quadrupole pattern. Frequency and amplitude sliders. Cross polarisation toggle. |
| `ligo-chirp-scene.tsx` | The GW150914 waveform, plotted as strain vs time. Frequency sweeps from 35 Hz to 250 Hz in 0.2 seconds. Audio toggle (the chirp is audible; NASA-released audio). Inspiral → merger → ringdown phases labelled. |

**Physicists (aside):**
- Albert Einstein *(exists — the 1916 and 1918 papers)*
- Kip Thorne *(NEW — Caltech theorist; co-founder of LIGO; 2017 Nobel)*
- Rainer Weiss *(NEW — MIT experimentalist; 1972 MIT technical report that became the LIGO blueprint; 2017 Nobel)*
- Barry Barish *(NEW — took over LIGO leadership in 1994 and turned it from a struggling project into a functioning observatory; 2017 Nobel)*

**Glossary terms:**
- `gravitational-wave` — phenomenon
- `strain` — concept (in the GW-amplitude sense)
- `ligo` — instrument
- `gw150914` — event (the first detection as a named entry)
- `inspiral` — concept
- `ringdown` — concept
- `multi-messenger-astronomy` — concept

**Files to touch:**
- `app/[locale]/(topics)/relativity/gravitational-waves/content.en.mdx`
- Same path, `content.he.mdx`, `content.ru.mdx`, and `page.tsx`
- `components/physics/gravitational-wave-scene.tsx` (new)
- `components/physics/ligo-chirp-scene.tsx` (new)
- `components/physics/visualization-registry.tsx` (register 2 scenes)
- `lib/physics/gravitational-wave.ts` (new — linearised plane-wave solution, plus/cross polarisation basis, chirp-frequency formula for an inspiralling binary)
- `lib/content/physicists.ts` + `messages/<locale>/physicists.json` (add Thorne, Weiss, Barish)
- `lib/content/glossary.ts` + `messages/<locale>/glossary.json` (add 7 terms)
- `lib/content/branches.ts` (`readingMinutes: 14`)
- `messages/<locale>/home.json`

**What this topic assumes:**
- General relativity from FIG.15 and FIG.17.
- Nothing about the linearised-theory derivation; just that the field equations admit wave solutions at the speed of light.

**Build notes:**
- The LIGO chirp audio (NASA-released) is a must-have for `ligo-chirp-scene.tsx`. This is the most viscerally effective single scene in the branch.
- Consider adding a comparison mode: GW150914 vs GW170817 (binary neutron star) vs GW190521 (the most massive merger to date). All three datasets are public.

**Reading minutes:** 14.

---

### FIG.20 — Cosmology: Friedmann, Hubble, and the Expanding Universe

**Hook.** 1922, Petrograd. Alexander Friedmann, 34, mathematician turned meteorologist turned cosmologist, solves Einstein's field equations for a homogeneous and isotropic universe. He finds solutions in which the universe expands or contracts, but never sits still. Einstein writes a rebuttal. A year later, he realises Friedmann is right and publishes a retraction. Friedmann dies of typhoid in 1925, age 37. In 1929, Edwin Hubble at Mount Wilson publishes observed galaxy redshifts proportional to distance. The universe is expanding. The Friedmann equations describe it. Note: cosmology is large enough to deserve its own branch — this topic stays at the geometric level and hands off to the Modern Physics branch for the rest.

**Sections (7):**

1. **The cosmological principle** — on the largest scales, the universe is homogeneous (same everywhere) and isotropic (same in every direction). Supported by the cosmic microwave background and galaxy redshift surveys. A simplifying assumption that makes the equations solvable.
2. **The Friedmann–Lemaître–Robertson–Walker metric** — the metric of a homogeneous, isotropic universe. One function of time: the scale factor a(t). Spatial curvature parameter k ∈ {−1, 0, +1}. The whole cosmology reduces to computing a(t).
3. **The Friedmann equations** — plug FLRW into the Einstein field equations. Get two ODEs for a(t) in terms of energy density and pressure. Solutions: matter-dominated (a ∝ t^{2/3}), radiation-dominated (a ∝ t^{1/2}), dark-energy-dominated (a ∝ exp(H t)).
4. **Hubble's law** — 1929. Distant galaxies recede, with velocity proportional to distance: v = H₀·d. Not a velocity through space, but space itself expanding. H₀ ≈ 70 km/s/Mpc today. Hubble did the observing at the 100-inch Mount Wilson telescope; Lemaître had derived the same relation theoretically two years earlier (1927) but published in an obscure Belgian journal.
5. **Lemaître's primeval atom** — Georges Lemaître, Belgian priest and physicist, 1931: extrapolate the expansion backwards; the universe must have begun in a hot dense state. The "Big Bang". The name was coined derisively by Fred Hoyle in 1949 and stuck.
6. **Dark energy** — 1998, Perlmutter, Riess, Schmidt: distant supernovae imply an accelerating expansion. The cosmological constant Λ — which Einstein introduced in 1917 and later called his "greatest blunder" — reinstalled as dark energy. 2011 Nobel.
7. **Where this branch hands off** — the cosmic microwave background, inflation, primordial nucleosynthesis, structure formation — all live in the Modern Physics branch. Relativity ends at the geometry; cosmology proper begins where the geometry meets the matter.

**Scenes to build (3):**

| File | Purpose |
|---|---|
| `friedmann-scale-factor-scene.tsx` | Plot a(t) vs t for three regimes: matter-dominated, radiation-dominated, dark-energy-dominated. Toggle which component dominates. Asymptote forms: power law, exponential. |
| `hubble-law-scene.tsx` | A scatter plot of 24 galaxies (Hubble's original 1929 data), distance vs recession velocity. Line of best fit, slope H₀. Add modern data (supernova calibration) as an overlay; the line extends much further. |
| `expanding-grid-scene.tsx` | A 2D grid of dots with distances growing uniformly. Every dot sees every other dot receding; the "no centre" property is visible. Slider: expansion rate. |

**Physicists (aside):**
- Alexander Friedmann *(NEW — Russian mathematician and meteorologist; 1922 expanding-universe solutions; died at 37)*
- Georges Lemaître *(NEW — Belgian priest and cosmologist; primeval atom; derived the Hubble law before Hubble)*
- Edwin Hubble *(NEW — Mount Wilson astronomer; galaxies-are-outside-the-Milky-Way 1924, recession-distance law 1929)*
- George Gamow *(NEW — cameo; Friedmann's student at Leningrad; later predicted the CMB in 1948 with Alpher; fuller treatment in Modern Physics branch)*
- Albert Einstein *(exists — the cosmological constant, introduced 1917, retracted 1931, vindicated posthumously 1998)*

**Glossary terms:**
- `cosmological-principle` — concept
- `flrw-metric` — concept
- `friedmann-equations` — concept
- `scale-factor` — concept
- `hubble-law` — concept
- `hubble-constant` — concept
- `cosmological-constant` — concept
- `dark-energy` — concept (stub here; deeper in Modern Physics)
- `big-bang` — concept (stub)

**Files to touch:**
- `app/[locale]/(topics)/relativity/cosmology/content.en.mdx`
- Same path, `content.he.mdx`, `content.ru.mdx`, and `page.tsx`
- `components/physics/friedmann-scale-factor-scene.tsx` (new)
- `components/physics/hubble-law-scene.tsx` (new)
- `components/physics/expanding-grid-scene.tsx` (new)
- `components/physics/visualization-registry.tsx` (register 3 scenes)
- `lib/physics/friedmann.ts` (new — Friedmann equation solver for matter, radiation, and Λ components; Hubble parameter; age of the universe)
- `lib/content/physicists.ts` + `messages/<locale>/physicists.json` (add Friedmann, Lemaître, Hubble, Gamow cameo)
- `lib/content/glossary.ts` + `messages/<locale>/glossary.json` (add 9 terms; several as stubs pointing into Modern Physics)
- `lib/content/branches.ts` (`readingMinutes: 15`)
- `messages/<locale>/home.json`

**What this topic assumes:**
- Einstein field equations (FIG.15) as a statement, not as a derivation.
- No familiarity with CMB, inflation, or nucleosynthesis. Those live in the Modern Physics branch and are teased here, not explained.

**Pedagogical warning:**
- This is the handoff topic. Keep it disciplined: FLRW geometry, Friedmann equations, Hubble's observation, Lemaître's insight, cosmological constant's rehabilitation. Everything else gets a one-line "see Modern Physics" pointer.

**Cross-branch links:**
- `related:` → Modern Physics branch (CMB, inflation, primordial nucleosynthesis, structure formation, dark-matter detail).
- `related:` → Quantum branch (quantum fluctuations as seed of structure — but treated in Modern Physics).

**Reading minutes:** 15.

---

## Execution order

Recommended sequence. The branch is largely linear — each module builds on the previous one — so the reading order and the build order coincide.

1. **FIG.01 first** (inertial frames). The easiest topic; sets the conceptual stage; two simple scenes. Good on-ramp.
2. **FIG.02, FIG.03** (Galilean transformations, Michelson–Morley). Historical setup. FIG.03 needs a careful interferometer scene and is the most atmospheric topic in Module 1.
3. **FIG.04, FIG.05** (Einstein's postulates, relativity of simultaneity). The pivot of the branch. FIG.05 is the single most disorienting topic; its train-and-lightning scene is load-bearing for everything after.
4. **FIG.06, FIG.07, FIG.08** (time dilation, length contraction, twin paradox). Once the postulates are in place, these three are a straight consequence. Build FIG.06 first; its light-clock scene is reused conceptually in FIG.07 and FIG.08.
5. **FIG.09, FIG.10** (Lorentz transformations, spacetime interval and light cones). The mathematics of Module 4 is denser. FIG.10's light-cone scene is among the branch's most pedagogically important 3D visualisations.
6. **FIG.11, FIG.12** (four-vectors, E=mc²). Special relativity wraps here. FIG.12 is the payoff — the equation everyone has heard — and should feel like a landing, not a detour.
7. **FIG.13, FIG.14** (equivalence principle, gravitational redshift). The gateway to general relativity. FIG.13's elevator scene is the pedagogical fulcrum of the second half.
8. **FIG.15, FIG.16** (curved spacetime, tests of GR). The heaviest mathematical topic is FIG.15; spend time on its metric-tensor gentle introduction. FIG.16 is mostly storytelling (Eddington, Shapiro, Hulse-Taylor).
9. **FIG.17, FIG.18** (Schwarzschild and Kerr). Black holes are the public face of GR; these two topics are the ones most readers will start a session on. Polish the event-horizon and Kerr-metric scenes especially.
10. **FIG.19, FIG.20** (gravitational waves, cosmology). The contemporary payoff. FIG.19's chirp scene with audio is a showstopper. FIG.20 is the handoff to the Modern Physics branch — keep it tight, do not overload it with cosmology that belongs elsewhere.

If you want to ship something out-of-order to a reader, the three most self-contained topics are FIG.08 (twin paradox), FIG.12 (E=mc²), and FIG.19 (gravitational waves). Each can be read without the surrounding context, though with less impact.

---

## Patterns to reuse

- **Scene skeleton:** copy from the Module-1 scenes — `damped-pendulum-scene.tsx`, `kinematics-graph-scene.tsx`, `projectile-scene.tsx`. All use `useAnimationFrame`, `useThemeColors`, canvas + ResizeObserver, cyan (`#5BE9FF`) as the accent.
- **Physics functions:** pure modules in `lib/physics/*.ts`. One module per topic, with matching filename. Suggested: `lib/physics/lorentz.ts` (FIG.09 core, reused by 06–10), `lib/physics/spacetime.ts` (FIG.10 light-cone utilities), `lib/physics/four-momentum.ts` (FIG.11 and FIG.12), `lib/physics/schwarzschild.ts` (FIG.17), `lib/physics/kerr.ts` (FIG.18), `lib/physics/gravitational-wave.ts` (FIG.19), `lib/physics/friedmann.ts` (FIG.20).
- **Mathematical notation:** relativity needs more symbols than kinematics. Use MDX with inline KaTeX/MathJax. Keep every displayed formula followed by a plain-English gloss — assume the reader cannot read tensor notation cold.
- **Physicist adds:** manually edit `lib/content/physicists.ts` + `messages/en/physicists.json` (no MCP tool for this — documented gap in `docs/mcp-gaps.md`). This branch introduces ~18 new physicists, far more than Module 1; batch the edits carefully.
- **Glossary adds:** direct edits to `lib/content/glossary.ts` + `messages/en/glossary.json` + `messages/he/glossary.json` + `messages/ru/glossary.json`. This branch adds ~60 new terms; plan them in passes to avoid cross-reference breakage.
- **Topic status flip:** direct edit to `lib/content/branches.ts` — change `status` and `readingMinutes` on the relevant entry as each FIG lands.
- **Hebrew and Russian content:** copy the English MDX, translate prose section-by-section, update `messages/<locale>/home.json` chrome, wire `HeContent` / `RuContent` into `page.tsx`. Expect relativity translations to take longer per topic than kinematics — the vocabulary is denser and culturally less saturated in Hebrew and Russian than in English.
- **Historical imagery:** this branch trades heavily on historical moments (Michelson's basement, Eddington's eclipse plate, Einstein at the patent office, the LIGO chirp). Where usable public-domain or CC imagery exists, prefer it; otherwise build clean schematic scenes rather than decorative stock art.
- **Cross-branch links:** flag topics that need pointers out of this branch: Maxwell's equations (Electromagnetism), nuclear binding energy (Nuclear), CMB and inflation (Modern Physics), quantum gravity (Quantum / future Quantum Gravity branch). Add `related:` entries in the topic metadata.

---

## Definition of done per topic

- [ ] `content.en.mdx` replaces skeleton, full 7-section essay.
- [ ] All new scenes exist, are registered in `components/physics/visualization-registry.tsx`, render without runtime error.
- [ ] New physicists added to `lib/content/physicists.ts` and `messages/en/physicists.json`, cross-linked from the topic body.
- [ ] New glossary terms added to `lib/content/glossary.ts` and `messages/en/glossary.json`, with cross-references between siblings (e.g. `proper-time` ↔ `time-dilation` ↔ `gamma-factor`).
- [ ] `status: "live"`, `readingMinutes: N` in `lib/content/branches.ts`.
- [ ] English `home.json` chrome updated (branch label, topic titles, preview copy).
- [ ] `npx tsc --noEmit` passes.
- [ ] Manual smoke test in `bun dev` at `/en/relativity/<slug>`.
- [ ] MathJax/KaTeX formulas render cleanly on mobile (the tensor-heavy topics — FIG.10, FIG.15 — must be checked at 320 px width).
- [ ] (optional) Hebrew content + `page.tsx` wire + `home.json` chrome.
- [ ] (optional) Russian content + `page.tsx` wire + `home.json` chrome.
- [ ] (where relevant) Cross-branch `related:` links added — notably from FIG.02 to Electromagnetism, FIG.12 to Nuclear, FIG.20 to Modern Physics.
