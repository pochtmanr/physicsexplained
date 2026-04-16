# § 01 · Classical Mechanics — curriculum roadmap

Newton's legacy. Forces, motion, and the machinery of the everyday world. Pendulums that keep perfect time, planets that sweep out equal areas, cannonballs that trace parabolas. The math is three hundred years old and still runs the world you live in.

Eight modules, 31 topics, FIG.01 → FIG.31. Three modules live, five to write. Every coming-soon topic below is a punch list — enough detail for an agent to produce the page without re-inventing the plan.

Voice: Galileo-chandelier. Kurzgesagt meets Stripe docs. Every hook anchors to a person or a year.

---

## Module map

| # | Module | Figures | Topics | Status |
|---|---|---|---|---|
| 1 | Kinematics & Newton | FIG.01–04 | 4 | live |
| 2 | Conservation Laws | FIG.05–08 | 4 | to write |
| 3 | Rotation & Rigid Bodies | FIG.09–12 | 4 | to write |
| 4 | Oscillations | FIG.13–15 | 3 | live |
| 5 | Waves | FIG.16–19 | 4 | to write |
| 6 | Orbital Mechanics | FIG.20–23 | 4 | live |
| 7 | Fluids | FIG.24–27 | 4 | to write |
| 8 | Lagrangian & Hamiltonian | FIG.28–31 | 4 | to write |

---

## Module 1 · Kinematics & Newton — LIVE

The module that teaches you how motion is described and why things move the way they do. Galileo set up the questions; Newton answered them. This module is fully shipped — all four topics live on main.

### FIG.01 — Motion in a Straight Line

Slug: `motion-in-a-straight-line`. Reading: 10 min.

Sections: (1) Position, velocity, acceleration — three questions. (2) Galileo on the tower at Pisa. (3) The constant-acceleration equations. (4) Free fall as the first physics experiment. (5) The inclined plane — Galileo's trick. (6) Kinematic graphs read forward and backward. (7) What's next: vectors.

Scenes: `kinematics-graph-scene.tsx`, `free-fall-scene.tsx`, `inclined-plane-scene.tsx`.

### FIG.02 — Vectors and Projectile Motion

Slug: `vectors-and-projectile-motion`. Reading: 10 min.

Scenes: `projectile-scene.tsx`, `vector-addition-scene.tsx`, `monkey-hunter-scene.tsx`.
Physicists added: Evangelista Torricelli.

### FIG.03 — Newton's Three Laws

Slug: `newtons-three-laws`. Reading: 11 min.

Scenes: `first-law-scene.tsx`, `f-ma-scene.tsx`, `action-reaction-scene.tsx`.
Physicists added: Robert Hooke.

### FIG.04 — Friction and Drag

Slug: `friction-and-drag`. Reading: 12 min.

Scenes: `friction-ramp-scene.tsx`, `terminal-velocity-scene.tsx`, `drag-regimes-scene.tsx`.
Physicists added: Guillaume Amontons, George Gabriel Stokes.

---

## Module 2 · Conservation Laws

The second way of doing Newtonian mechanics. Don't follow the forces through time — follow the things that don't change. Energy, momentum, angular momentum. Noether's theorem at the end explains *why* they don't change.

### FIG.05 — Energy and Work

Slug: `energy-and-work` (already in `branches.ts`, status `coming-soon`).

**Hook.** When a ball rolls down a ramp, something is being converted from one form to another. The word for it is *energy*, and it took physics 150 years after Newton to name it properly. Émilie du Châtelet translated the Principia into French in 1749 and, along the way, figured out something Newton hadn't — kinetic energy scales as *v²*, not *v*. She had to fight Voltaire to publish.

**Sections (7):**

1. **Work** — force times distance, in the direction of motion. Units of joules. The integral form for varying force.
2. **Kinetic energy** — ½mv². Why v-squared, not v. Du Châtelet's correction of Newton and Leibniz.
3. **The work-energy theorem** — total work done on a body equals its change in kinetic energy. The first conservation statement.
4. **Potential energy** — the stored form. Gravitational, elastic, electrostatic. Only defined up to a constant.
5. **Conservation of mechanical energy** — when only conservative forces act, KE + PE is constant. Derive from F = −dU/dx.
6. **Non-conservative forces** — friction, drag, anything that removes energy from the mechanical accounting. Heat is where it goes (forward reference to § 03).
7. **What's next** — momentum: a conservation law that works even when energy doesn't.

**Scenes to build (3):**

| File | Purpose |
|---|---|
| `energy-conversion-scene.tsx` | Ball rolling down a ramp onto a flat surface. Live readout of KE, PE, total. Optional friction slider — watch the total leak away as heat. |
| `work-integral-scene.tsx` | A block pushed by a varying force F(x). Area under the F(x) curve highlights as the block moves; area equals work done. |
| `pendulum-energy-scene.tsx` | Pendulum swinging, with a KE / PE / total bar chart updating every frame. The total stays flat; KE and PE trade places. |

**Physicists:**
- Émilie du Châtelet *(NEW — translated the Principia, proved KE ∝ v²)*
- Gottfried Wilhelm Leibniz *(NEW — Newton's rival; "vis viva" was his name for kinetic energy)*
- James Prescott Joule *(NEW — measured the mechanical equivalent of heat, the crossover between mechanics and thermodynamics)*
- Hermann von Helmholtz *(NEW — stated conservation of energy in its modern form, 1847)*

**Glossary terms:**
- `work` — concept
- `kinetic-energy` — concept
- `potential-energy` — concept
- `conservative-force` — concept
- `joule-unit` — unit
- `mechanical-energy` — concept

**Files to touch:**
- `app/[locale]/(topics)/classical-mechanics/energy-and-work/content.en.mdx`
- `app/[locale]/(topics)/classical-mechanics/energy-and-work/content.he.mdx`
- `app/[locale]/(topics)/classical-mechanics/energy-and-work/page.tsx`
- `components/physics/energy-conversion-scene.tsx`
- `components/physics/work-integral-scene.tsx`
- `components/physics/pendulum-energy-scene.tsx`
- `components/physics/visualization-registry.tsx`
- `lib/physics/energy.ts`
- `lib/content/physicists.ts` + `messages/<locale>/physicists.json`
- `lib/content/glossary.ts` + `messages/<locale>/glossary.json`
- `lib/content/branches.ts` (flip `status: "live"`, set `readingMinutes: 11`)
- `messages/en/home.json` + `messages/he/home.json`

**Reading minutes:** 11.

---

### FIG.06 — Momentum and Collisions

Slug: `momentum-and-collisions`.

**Hook.** A cue ball strikes a resting ball. Before: one ball moves. After: both move, or one stops and the other shoots forward. Newton wrote his second law not as *F = ma* but as *F = dp/dt*, with *p = mv* — momentum. The form matters: it generalises cleanly to relativity and to rockets losing mass mid-flight.

**Sections (7):**

1. **What momentum is** — mass times velocity, a vector quantity. Newton's original formulation.
2. **Impulse** — the integral of force over time. Change in momentum. Why crumple zones exist: extend the time, shrink the force.
3. **Conservation of momentum** — from Newton's third law. Total momentum of an isolated system is fixed.
4. **Elastic collisions** — kinetic energy is conserved too. Billiard balls, nearly. Two equations, two unknowns, solve for the outgoing velocities.
5. **Inelastic collisions** — kinetic energy is not conserved. Cars, clay balls, anything that sticks or deforms. Momentum still is.
6. **Centre of mass** — the invariant "balance point" of a system. Moves at constant velocity when external forces cancel. Decouples internal motion from overall translation.
7. **What's next** — spin the collision picture around: angular momentum.

**Scenes to build (3):**

| File | Purpose |
|---|---|
| `collision-lab-scene.tsx` | Two balls on a line, mass and velocity sliders for each, elasticity slider (0 = stick, 1 = perfect bounce). Fire them; watch momentum and KE readouts before/after. |
| `rocket-equation-scene.tsx` | A rocket expelling mass. Tsiolkovsky equation in action: trace velocity vs fuel mass consumed, log scale on the x-axis. |
| `centre-of-mass-scene.tsx` | Two orbiting masses with a big mass ratio. Trajectory of each body and the (invisible) CoM point. CoM moves in a straight line while both bodies swerve. |

**Physicists:**
- Isaac Newton *(exists)*
- Christiaan Huygens *(exists — first to state momentum conservation for elastic collisions, 1668)*
- John Wallis *(NEW — English mathematician, worked out inelastic collisions the same year as Huygens)*
- Konstantin Tsiolkovsky *(NEW — the rocket equation, 1903)*

**Glossary terms:**
- `momentum` — concept
- `impulse` — concept
- `elastic-collision` — concept
- `inelastic-collision` — concept
- `centre-of-mass` — concept
- `rocket-equation` — concept

**Files to touch:** standard pattern (see FIG.05), with topic slug `momentum-and-collisions`, physics module `lib/physics/momentum.ts`.

**Reading minutes:** 11.

---

### FIG.07 — Angular Momentum

Slug: `angular-momentum`.

**Hook.** A figure skater pulls her arms in and spins faster. A falling cat twists to land on its feet. A bicycle stays up as long as it's moving. One quantity explains all three: angular momentum, *L = r × p*. Conserved when no external torques act — which turns out to be a *lot* of the time.

**Sections (7):**

1. **Rotating what you already know** — every translational quantity has a rotational twin. Mass → moment of inertia. Force → torque. Momentum → angular momentum.
2. **The cross product** — one paragraph of geometry, no ceremony. Right-hand rule. Why *L* points out of the plane of motion.
3. **Conservation of L** — from τ = dL/dt. When net torque is zero, L is fixed in magnitude and direction.
4. **The figure skater** — pulling the arms in shrinks the moment of inertia, so the angular velocity grows. L stays put; ω is forced up.
5. **The falling cat** — how an un-torqued cat rotates. Internal shape-change rearranges ω without changing L. Surprisingly subtle.
6. **Kepler's second law redux** — equal areas in equal times is conservation of angular momentum for a central force. (Callback to FIG.20.)
7. **What's next** — what happens when torques aren't zero. Rotation and rigid bodies (Module 3).

**Scenes to build (3):**

| File | Purpose |
|---|---|
| `skater-spin-scene.tsx` | Stick-figure skater with a slider for "arm extension." Moment of inertia and angular velocity update live; the product L stays flat. |
| `angular-momentum-vector-scene.tsx` | A particle moving on a 2D plane; the r, p, and L = r × p vectors drawn live. Show how L stays constant for a central force. |
| `falling-cat-scene.tsx` | Idealised two-ring cat model. Slider to actuate the body twist. Front half rotates one way, back half the other, net L stays zero, but the cat flips. |

**Physicists:**
- Isaac Newton *(exists)*
- Leonhard Euler *(NEW — laid down the rotational form of Newton's laws, 1750s)*
- Siméon Denis Poisson *(NEW — precise formulation of angular momentum, early 1800s)*

**Glossary terms:**
- `angular-momentum` — concept
- `torque` — concept (note: full entry lives in Module 3, FIG.09; Module 2 uses it in passing)
- `cross-product` — concept
- `central-force` — concept

**Files to touch:** standard pattern. Physics module `lib/physics/angular.ts`.

**Reading minutes:** 11.

---

### FIG.08 — Noether's Theorem

Slug: `noethers-theorem`.

**Hook.** In 1918, Emmy Noether — whom Einstein called the most important woman in the history of mathematics — proved the deepest theorem in physics. Every continuous symmetry of nature implies a conservation law. Time-translation symmetry → energy conservation. Spatial-translation → momentum. Rotational → angular momentum. The three conservation laws you just learned are three faces of one idea.

**Sections (7):**

1. **The pattern no one had noticed** — three conservation laws, three obvious symmetries of space and time. Coincidence? Noether said: no.
2. **What a symmetry is** — a continuous change of variables that leaves the physics the same. Translate your experiment north by one metre; the result is unchanged.
3. **The theorem, stated plainly** — for every continuous symmetry of the Lagrangian, there is a conserved quantity. No calculation yet, just the statement.
4. **Time-translation → energy** — if today's physics is the same as yesterday's, energy is conserved. Walk through the logic at a high school level.
5. **Spatial-translation → momentum** — if "here" is no different from "there," momentum is conserved.
6. **Rotational symmetry → angular momentum** — if no direction is special, L is conserved.
7. **What's next** — Noether's theorem will come back in gauge theories (§ 06). And the Lagrangian it depends on is the subject of Module 8.

**Scenes to build (2):**

| File | Purpose |
|---|---|
| `symmetry-conservation-scene.tsx` | Three-pane grid. Left pane: a physics experiment being translated in time. Middle: translated in space. Right: rotated. Each pane shows the corresponding conserved quantity ticking along unchanged while the experiment shifts. |
| `broken-symmetry-scene.tsx` | Same experiment, but now with a time-dependent gravitational field (gravity getting stronger over time). Show energy *not* being conserved — the bouncing ball climbs higher each bounce. Symmetry gone → conservation gone. |

**Physicists:**
- Emmy Noether *(NEW — the most important name in the module; biography section of the page should linger on her)*
- David Hilbert *(NEW — invited Noether to Göttingen, fought to keep her there despite the faculty's sexism)*
- Albert Einstein *(cameo — his quote about Noether belongs in the hook or the aside)*

**Glossary terms:**
- `noethers-theorem` — concept
- `symmetry` — concept
- `continuous-symmetry` — concept
- `lagrangian` — concept (full entry in Module 8; Module 2 uses the term lightly)

**Files to touch:** standard pattern. Physics module `lib/physics/symmetry.ts` — probably just holds a few small demonstrations rather than heavy math.

**Reading minutes:** 12. Noether's page deserves slightly more space.

---

## Module 3 · Rotation & Rigid Bodies

Module 1 treated everything as a point. Module 3 admits that things have shape. Once you let an object rotate as well as translate, a surprising amount of strange behaviour falls out — gyroscopes that won't fall over, Earth that wobbles on a 26,000-year cycle.

### FIG.09 — Torque and Rotational Dynamics

Slug: `torque-and-rotational-dynamics`.

**Hook.** Archimedes, sitting in Syracuse in 250 BCE, said: give me a lever long enough and a place to stand, and I'll move the Earth. He was exactly right. The quantity he was describing — what we call *torque* — is force multiplied by the lever arm, and it's the rotational analogue of force itself.

**Sections (7):**

1. **Why a door handle is where it is** — leverage. Same force, different distance from the hinge, radically different effect.
2. **Torque, stated precisely** — τ = r × F. Vector quantity, right-hand rule.
3. **Newton's second law for rotation** — τ = Iα, parallel to F = ma. Moment of inertia plays the role of mass.
4. **Static equilibrium** — forces balance, torques balance. The two conditions together explain everything from balanced scales to why ladders fall.
5. **Rolling without slipping** — the constraint that couples linear and rotational motion. v = ωr. Tires, coins, hula hoops.
6. **Work and power in rotation** — τ·θ is rotational work; τ·ω is rotational power. Engines rated in horsepower are doing this calculation.
7. **What's next** — moment of inertia, the "mass" of rotation, and what it depends on.

**Scenes to build (3):**

| File | Purpose |
|---|---|
| `torque-lever-scene.tsx` | A seesaw with two masses. Drag either mass along the beam. Torque around the pivot computed and compared; when they balance, the beam sits level. |
| `rolling-race-scene.tsx` | Two cylinders on a ramp — one solid, one hollow. Start them together. Solid wins every time. Live readouts of moment of inertia and linear velocity. |
| `static-equilibrium-scene.tsx` | A ladder leaning against a frictionless wall with a friction slider for the floor. Critical angle shows up as a red line — beyond it, the ladder slides. |

**Physicists:**
- Archimedes of Syracuse *(NEW — the lever, centre of gravity, gave the quote in the hook)*
- Leonhard Euler *(exists — from FIG.07; his rotational laws cover this module)*

**Glossary terms:**
- `torque` — concept
- `moment-of-inertia` — concept (full detail in FIG.10)
- `static-equilibrium` — concept
- `rolling-without-slipping` — concept

**Reading minutes:** 10.

---

### FIG.10 — Moment of Inertia

Slug: `moment-of-inertia`.

**Hook.** Two cylinders of equal mass, one hollow and one solid, start together at the top of a ramp. The solid one always wins. The hollow one's mass is all at the outside, far from its axis — and that's what moment of inertia measures. Not how much stuff there is, but how far from the axis of rotation it sits.

**Sections (7):**

1. **Mass re-examined** — why the rotational analogue can't just be "mass." A point at the centre of rotation contributes nothing. A point at the rim contributes maximally.
2. **The definition** — I = Σ mᵢrᵢ². Discrete, then integral form for a continuous body.
3. **The standard library** — a table: thin ring, solid disc, thin rod (centre and end), solid sphere, hollow sphere. The factors of ½, ⅓, ⅔, ⅖.
4. **Parallel axis theorem** — I about any axis = I through the centre of mass + Md². One of the most-used tricks in mechanics.
5. **Perpendicular axis theorem** — for planar bodies: I_z = I_x + I_y. The other one-line shortcut worth memorising.
6. **Why the hollow sphere loses** — derive it: same mass, but the I is 2/3 Mr² versus 2/5 Mr². Translate into acceleration down the ramp.
7. **What's next** — once you have I, you can ask about spin. Gyroscopes.

**Scenes to build (2):**

| File | Purpose |
|---|---|
| `inertia-library-scene.tsx` | A rotating 3D-looking (2D projection) bar with draggable masses along it. As you drag, I updates live, alongside rotational KE for a given ω. Teaches the r² dependence by feel. |
| `ramp-race-scene.tsx` | Four objects racing down a ramp: ring, disc, solid sphere, hollow sphere. Same mass, same radius. Finish order is always the same — and the site *explains why* using the I ratios. |

**Physicists:**
- Christiaan Huygens *(exists — gave the first rigorous treatment of compound pendulums, which is really moment-of-inertia territory)*
- Leonhard Euler *(exists — the parallel and perpendicular axis theorems trace back to him)*
- Jakob Steiner *(NEW — the parallel axis theorem is sometimes called Steiner's theorem in Europe)*

**Glossary terms:**
- `moment-of-inertia` — concept (full entry here)
- `parallel-axis-theorem` — concept
- `radius-of-gyration` — concept

**Reading minutes:** 10.

---

### FIG.11 — Gyroscopes and Precession

Slug: `gyroscopes-and-precession`.

**Hook.** A spinning top leans over and, instead of falling, traces a slow cone around the vertical. A bicycle stays up as long as its wheels are turning. A gyroscope on a gimbal points stubbornly in the same direction no matter what you do to its frame — which is how missiles, submarines, and spacecraft know which way is up. One idea explains all of them: angular momentum is a vector, and it points where it wants to point.

**Sections (7):**

1. **The non-intuitive fact** — push a spinning top sideways and it moves 90° to where you pushed. This breaks every intuition you have about pushing things.
2. **The cause** — τ = dL/dt. A torque doesn't change the magnitude of L; it changes its *direction*. That's what precession is.
3. **Derive precession frequency** — for a top tilted at angle θ, Ω_p = mgr / (Iω). Units work out. Slower spin → faster precession — which matches a top that's about to fall over.
4. **Nutation** — the small bobbing on top of the steady precession. Real tops do both; the web animation shows why.
5. **Why bicycles stay up** — partly gyroscopic, partly caster geometry. Bust the myth that it's purely gyroscopic (it's not — locked-gyro bikes still balance). But the gyroscopic contribution is real and measurable.
6. **Inertial guidance** — a mechanical gyroscope is a direction memory that survives any acceleration. The V-2 used one. So does the Apollo IMU. So does your phone's MEMS gyro.
7. **What's next** — the biggest gyroscope in our lives: the Earth.

**Scenes to build (3):**

| File | Purpose |
|---|---|
| `gyroscope-scene.tsx` | A tilted spinning top animated in 3D-looking 2D projection. Angular momentum vector drawn and updated every frame. Slider for spin rate; watch precession speed scale inversely. |
| `bike-stability-scene.tsx` | Side view of a bike at different speeds. Below some threshold it falls; above, it self-rights. Explain with a "gyroscopic torque" arrow overlay. |
| `nutation-scene.tsx` | A top that wobbles in both precession and nutation. Toggle to strip one out and show the other in isolation. |

**Physicists:**
- Léon Foucault *(exists — invented the first modern gyroscope, 1852, the same year as his pendulum demo)*
- Johann Bohnenberger *(NEW — built the first gimbal-mounted gyroscope for teaching, 1817)*
- Pierre-Simon Laplace *(NEW — early theoretical work on precession of the Earth's axis)*

**Glossary terms:**
- `precession` — concept
- `nutation` — concept
- `gyroscope` — instrument
- `inertial-navigation` — concept

**Reading minutes:** 11.

---

### FIG.12 — The Wobbling Earth

Slug: `the-wobbling-earth`.

**Hook.** The Earth is a gyroscope. The Sun and Moon pull on its equatorial bulge and, because it spins, it doesn't tilt in response — it precesses. Hipparchus noticed in 127 BCE that the stars had shifted from where Timocharis had mapped them 150 years earlier. That shift, the *precession of the equinoxes*, takes ~26,000 years for a full cycle. It is the slowest measurable phenomenon in the pre-modern sky, and Newton's theory of gravitation was the first thing that could explain it.

**Sections (7):**

1. **Hipparchus's discovery** — the careful star maps, the drift, the constant he named. The first hint that the Earth itself wasn't the frame of reference anyone thought it was.
2. **The geometry** — Earth's axis tilted at 23.5°, traces out a cone once per 26,000 years. The north star wasn't always Polaris; in 3000 BCE it was Thuban. In 14,000 CE it will be Vega.
3. **The forces** — the Sun and Moon pull more on the equatorial bulge than on the poles. Net torque, tilted spin axis. Classical gyroscopic precession.
4. **Nutation on top of it** — the Moon's orbit isn't fixed either; its 18.6-year nodal cycle rocks the Earth's axis in and out of the main precession cone.
5. **Chandler wobble** — a 14-month free oscillation of the Earth's instantaneous rotation axis relative to its figure axis. Small (a few metres of pole motion), but real and measurable.
6. **Milankovitch** — precession, obliquity, and eccentricity together drive the ice-age cycles. The slow music of the planet.
7. **What's next** — we've now built up rotational dynamics to the scale of a planet. Module 4 resets the scale: individual oscillators (pendulums already live; spring-mass next).

**Scenes to build (2):**

| File | Purpose |
|---|---|
| `axial-precession-scene.tsx` | Earth with its axis tracing a cone against the star field. Toggle "time lapse" at 26,000 years per second. Mark the north star at 3000 BCE (Thuban), 2000 CE (Polaris), 14,000 CE (Vega). |
| `milankovitch-scene.tsx` | Three stacked plots: eccentricity, obliquity, precession over 500,000 years. Overlay ice-age proxy data. Let the viewer see the coincidences. |

**Physicists:**
- Hipparchus of Nicaea *(NEW — discovered precession of the equinoxes c. 127 BCE)*
- Isaac Newton *(exists — first theoretical explanation of axial precession, Principia Book III)*
- Jean d'Alembert *(NEW — worked out the precession equations in full, 1749)*
- Seth Carlo Chandler *(NEW — discovered the 14-month wobble, 1891)*
- Milutin Milanković *(NEW — connected the three cycles to ice ages, 1920s-30s)*

**Glossary terms:**
- `precession-of-equinoxes` — phenomenon
- `obliquity` — concept
- `chandler-wobble` — phenomenon
- `milankovitch-cycles` — phenomenon

**Reading minutes:** 12.

---

## Module 4 · Oscillations — LIVE

The module that introduced the site. Shipped during v0. Three topics, all live.

### FIG.13 — The Simple Pendulum

Slug: `the-simple-pendulum`. Reading: 10 min.

Galileo in the Duomo, timing a chandelier against his pulse. Isochronism at small angles. The period formula T = 2π√(L/g). Huygens turning it into a clock. Foucault demonstrating the Earth's rotation with a 67-metre wire in the Panthéon.

### FIG.14 — Beyond Small Angles

Slug: `beyond-small-angles`. Reading: 12 min.

Where the small-angle approximation breaks. The elliptic integral for the exact period. Phase-portrait geometry. ODE integration (odex-powered).

### FIG.15 — Oscillators Everywhere

Slug: `oscillators-everywhere`. Reading: 12 min.

Spring-mass. LC circuits. Atoms in a lattice. Every stable equilibrium is a harmonic oscillator to leading order. The equation of motion that runs half of physics.

---

## Module 5 · Waves

What happens when oscillators are coupled in space. The wave equation is the natural next step after the harmonic oscillator — string → membrane → sound → light — and it's the same equation everywhere.

### FIG.16 — The Wave Equation

Slug: `the-wave-equation`.

**Hook.** Jean le Rond d'Alembert, age 29, wrote down ∂²y/∂t² = v²·∂²y/∂x² in 1746. He proved that the general solution is any function that moves left plus any function that moves right, *f(x − vt) + g(x + vt)*. That single equation turns out to describe every wave there is — sound, light, ripples on a pond, signals in your nerves, gravitational waves across a billion light-years. Physics has very few universal equations; this is one.

**Sections (7):**

1. **A string under tension** — model it as a chain of masses connected by springs. In the continuum limit, Newton's second law on each element gives you the wave equation.
2. **d'Alembert's solution** — the general solution is a left-mover plus a right-mover. Prove by substitution. Shapes propagate without distortion.
3. **Travelling waves** — amplitude, wavelength, frequency, phase velocity. v = fλ.
4. **Sinusoidal waves** — the basis set. y = A sin(kx − ωt). k and ω, the two things to memorise.
5. **Energy in a wave** — proportional to frequency squared times amplitude squared. Explains why even a small sunbeam carries photons, but a big ocean swell carries a ship.
6. **Superposition** — waves don't collide. They pass through each other. Linear PDE → linear solutions.
7. **What's next** — confine the string. Standing waves. The first quantum hint before quantum existed.

**Scenes to build (3):**

| File | Purpose |
|---|---|
| `string-simulation-scene.tsx` | A plucked string numerically integrated. Pluck-shape preserved as two half-amplitude pulses running apart, reflecting from the ends. Classic d'Alembert demo. |
| `travelling-wave-scene.tsx` | Sine wave with sliders for frequency, wavelength, amplitude. Phase velocity readout. Freeze-frame button to examine snapshots. |
| `superposition-scene.tsx` | Two Gaussian pulses passing through each other on a string. During overlap, the sum exceeds either — but after they emerge unchanged. |

**Physicists:**
- Jean d'Alembert *(exists from FIG.12 — 1746 wave equation is his)*
- Brook Taylor *(NEW — first analysis of a vibrating string, 1713)*
- Daniel Bernoulli *(NEW — pushed the sinusoidal-mode decomposition around 1750)*
- Leonhard Euler *(exists — the rival to Bernoulli on wave theory, and won a lot of the arguments)*

**Glossary terms:**
- `wave-equation` — concept
- `wavelength` — concept
- `frequency` — concept
- `phase-velocity` — concept
- `superposition-principle` — concept

**Files to touch:** standard pattern. Physics module `lib/physics/waves.ts` — analytic solutions plus a finite-difference string solver.

**Reading minutes:** 12.

---

### FIG.17 — Standing Waves and Modes

Slug: `standing-waves-and-modes`.

**Hook.** Pluck a guitar string and it picks out a very specific set of frequencies. Not a continuum, not a random fuzz — a ladder of discrete notes. This is how the guitar sings, how a pipe organ fills a cathedral, and how an atom — a century later — was found to hold its electrons in discrete orbitals. The physics is old, but the idea of *mode* is one of the most important in all of physics.

**Sections (7):**

1. **Confined waves** — fix the string at two ends. Now only waves that fit — integer half-wavelengths — can live there.
2. **The fundamental and the harmonics** — the lowest mode, then 2× its frequency, 3×, and so on. The timbre of an instrument is which overtones it prefers.
3. **Nodes and antinodes** — spatial patterns of zero and maximal motion. Fix them in place on the animation; they never move.
4. **Fourier's bomb** — any shape can be decomposed into a sum of modes. Fourier dropped this in 1807 and broke maths for a generation. It's now the most-used technique in all of physics.
5. **Pipes, open and closed** — boundary conditions matter. An open organ pipe has pressure nodes at the ends; a closed pipe has one pressure node, one antinode. Different harmonic series.
6. **Chladni patterns** — drive a flat plate with a bow. Sand settles at the nodal lines. Visual, haunting, instantly convincing.
7. **What's next** — Doppler, shock waves, sources that move.

**Scenes to build (3):**

| File | Purpose |
|---|---|
| `string-modes-scene.tsx` | String with mode selector (n = 1–8). Toggle to superpose the first N modes with user-picked amplitudes. Watch an arbitrary plucked shape build up from sines. |
| `chladni-scene.tsx` | Square and circular plates, frequency slider, 2D visualization of nodal lines. Low CPU cost — eigenmode lookup, not a full PDE solve. |
| `organ-pipe-scene.tsx` | Two pipes side by side — open and closed at one end. Flow-and-pressure cross-section shown. Harmonic series graph updates as you change the pipe length. |

**Physicists:**
- Jean-Baptiste Joseph Fourier *(NEW — 1807, decomposition into sines)*
- Ernst Chladni *(NEW — sand on plates, 1787)*
- Pythagoras *(NEW — maybe apocryphally, noticed that two strings sound consonant when their lengths are in simple integer ratios)*
- Hermann von Helmholtz *(exists — *On the Sensations of Tone*, 1863, is the foundational text on modes + hearing)*

**Glossary terms:**
- `standing-wave` — concept
- `mode` — concept
- `node` — concept
- `antinode` — concept
- `harmonic-series` — concept
- `fourier-series` — concept

**Reading minutes:** 12.

---

### FIG.18 — Doppler and Shock Waves

Slug: `doppler-and-shock-waves`.

**Hook.** A police siren shifts pitch as the car goes by. A supersonic jet cracks the sky behind it. The same geometry explains both, and it's the same geometry astronomers use to measure the expansion of the universe. Doppler proposed the effect in 1842 on the basis of a single paragraph of reasoning; the experimental confirmation — waving a trumpet player past listeners at a train — came three years later.

**Sections (7):**

1. **The moving-source picture** — a source emits a spherical wave every T seconds and moves between them. The wavefronts compress ahead, stretch behind.
2. **The formula, stationary observer** — f_obs = f_source · c / (c − v_source). Derive from the wavefront spacing.
3. **The moving-observer case** — f_obs = f_source · (c + v_obs) / c. Not quite symmetric with the source version — a real physical asymmetry because the medium is the frame.
4. **Sound vs light** — sound depends on the medium; the relativistic Doppler effect for light does not. Derive its simpler, symmetric form. Hint at § 04.
5. **The sonic boom** — when v_source > c_sound, the wavefronts pile up on a conical Mach surface. The boom is the arrival of that cone.
6. **Applications** — speed guns, weather radar, redshift of galaxies, echocardiography, bat echolocation. One geometry, many uses.
7. **What's next** — what happens when different frequencies propagate at different speeds. Dispersion.

**Scenes to build (3):**

| File | Purpose |
|---|---|
| `doppler-scene.tsx` | Source moving left-to-right emitting wavefronts. Toggle source speed from 0 to above c_sound. Above it, the wavefronts form the characteristic Mach cone. |
| `redshift-scene.tsx` | Spectrum display. A single emission line. Slider for source velocity toward/away from observer. Line shifts left (blueshift) or right (redshift) in the spectrum. |
| `sonic-boom-scene.tsx` | Top-down view of an aircraft at varying Mach numbers. Mach cone angle updates live (sin θ = 1/M). The boom arrives at ground locations on a sweep across the screen. |

**Physicists:**
- Christian Doppler *(NEW — 1842 paper, modest size, enormous reach)*
- Christophe Buys Ballot *(NEW — the Dutch meteorologist who set up the trumpet-on-a-train test in 1845)*
- Ernst Mach *(NEW — the cone, the number, supersonic flight mechanics)*
- Vesto Slipher *(NEW — first to measure galactic redshift, 1912, decade before Hubble)*

**Glossary terms:**
- `doppler-effect` — phenomenon
- `redshift` — phenomenon
- `blueshift` — phenomenon
- `sonic-boom` — phenomenon
- `mach-number` — concept

**Reading minutes:** 11.

---

### FIG.19 — Dispersion and Group Velocity

Slug: `dispersion-and-group-velocity`.

**Hook.** Newton split a beam of sunlight with a prism and got a rainbow. Every modern optical fibre engineer has to think about that same effect, because if red and blue travel at different speeds, a sharp pulse smears. Dispersion is the reason a pulse has two velocities — one for the carrier (phase), one for the envelope (group) — and they're not the same.

**Sections (7):**

1. **Newton's prism** — different colours bend by different amounts. They're travelling at different speeds inside the glass.
2. **Dispersive media** — when v = ω/k depends on k. Glass, water, plasma, deep-water waves all qualify. Pure vacuum does not — light in vacuum is dispersionless.
3. **Phase velocity** — how fast a single-frequency crest moves. Can exceed c in some media; no information travels at it.
4. **Group velocity** — how fast a wave packet (information, energy) moves. v_g = dω/dk. Always ≤ c.
5. **A pulse spreads** — start with a Gaussian packet. A dispersive medium smears it out in both space and time. Central result of the module.
6. **Rainbow geometry** — Descartes, 1637, worked out the 42° cone. Modern optics fills in why. The double rainbow. Supernumerary bows.
7. **What's next** — so ends Module 5. Module 6 (Orbital Mechanics) is live; Module 7 (Fluids) revisits waves in a very different medium.

**Scenes to build (3):**

| File | Purpose |
|---|---|
| `phase-vs-group-scene.tsx` | Wave packet animation. Slow envelope (group velocity) and fast internal ripples (phase velocity) moving at different rates. Freeze either and watch the other. |
| `pulse-dispersion-scene.tsx` | Gaussian pulse entering a dispersive medium. Watch the width grow linearly with distance. Toggle dispersion on/off. |
| `rainbow-scene.tsx` | Single-drop ray-trace showing why 42° — light entering the top, refracting twice, reflecting once. Angle-of-minimum-deviation argument visualised. |

**Physicists:**
- Isaac Newton *(exists — the prism, *Opticks*, 1704)*
- René Descartes *(NEW — the rainbow geometry, *Discourse on Method*, 1637)*
- William Rowan Hamilton *(NEW — introduced group velocity in 1839)*
- John William Strutt (Lord Rayleigh) *(NEW — the modern treatment, late 1870s; Rayleigh scattering is named for him)*

**Glossary terms:**
- `dispersion` — phenomenon
- `phase-velocity` — concept (full entry here, cross-referenced in FIG.16)
- `group-velocity` — concept
- `wave-packet` — concept
- `refractive-index` — concept

**Reading minutes:** 12.

---

## Module 6 · Orbital Mechanics — LIVE

Shipped in v0. Four topics, all live.

### FIG.20 — The Laws of Planets (Kepler)

Slug: `kepler`. Reading: 6 min. Ptolemy, Copernicus, Tycho, Kepler. Three laws.

### FIG.21 — Universal Gravitation

Slug: `universal-gravitation`. Reading: 12 min. Newton and the Moon, the inverse-square law, the Cavendish experiment, Le Verrier and Neptune.

### FIG.22 — Energy in Orbit

Slug: `energy-in-orbit`. Reading: 12 min. Vis-viva. Bound and unbound orbits. Hohmann transfers.

### FIG.23 — Tides and the Three-Body Problem

Slug: `tides-and-three-body`. Reading: 12 min. Tidal forces. Lagrange points. Poincaré and the birth of chaos.

---

## Module 7 · Fluids

Classical mechanics applied to continuous matter. The last classical subject to yield to mathematics, and one problem of it — turbulence — is still open. Feynman called it the most important unsolved problem of classical physics.

### FIG.24 — Pressure and Buoyancy

Slug: `pressure-and-buoyancy`.

**Hook.** Archimedes, told to check whether the king's crown was pure gold, stepped into a bath, noticed the water rise, and ran naked through Syracuse shouting *eureka*. The story is probably embellished. The principle behind it is not. Any object in a fluid experiences an upward force equal to the weight of the fluid it displaces — and the same principle explains why ships float, why balloons rise, and why your ears hurt when you swim too deep.

**Sections (7):**

1. **What pressure is** — force per area. Scalar. Acts in all directions in a fluid at rest. Units of pascals.
2. **The hydrostatic equation** — dp/dz = −ρg. Pressure grows linearly with depth; ten metres of water adds another atmosphere.
3. **Torricelli's barometer** — 1644, in Florence. Mercury column 760 mm tall. The atmosphere weighs on us. The first measurement of air pressure.
4. **Pascal's principle** — apply pressure anywhere in a confined fluid, it propagates equally. Hydraulic presses, car brakes, dentist chairs.
5. **Archimedes' principle, stated precisely** — buoyant force = weight of displaced fluid. Derive from hydrostatic pressure on top and bottom of a submerged box.
6. **Stability of floating bodies** — why a kayak can capsize but a supertanker can't. Metacentric height.
7. **What's next** — fluids on the move. Bernoulli.

**Scenes to build (3):**

| File | Purpose |
|---|---|
| `barometer-scene.tsx` | Torricelli setup: inverted mercury-filled tube over a reservoir. Atmospheric pressure slider. Column height responds. Educational historical reconstruction. |
| `buoyancy-scene.tsx` | A block settling in a fluid. Density sliders for the block and the fluid. Block sinks, floats, or hovers depending on ratios. Displaced-volume highlighted. |
| `hydraulic-press-scene.tsx` | Two pistons connected by fluid. Push one down with a small force; watch the big force come out the other side. Area-ratio slider. Pascal at work. |

**Physicists:**
- Archimedes of Syracuse *(exists from FIG.09)*
- Evangelista Torricelli *(exists from FIG.02)*
- Blaise Pascal *(NEW — pressure propagation, 1647, plus probability theory and a lot of other things)*
- Simon Stevin *(NEW — 1586, first to show that pressure in a fluid depends only on depth, not shape)*

**Glossary terms:**
- `pressure` — concept
- `pascal-unit` — unit
- `buoyancy` — concept
- `hydrostatic` — concept
- `atmospheric-pressure` — concept

**Reading minutes:** 10.

---

### FIG.25 — Bernoulli's Principle

Slug: `bernoullis-principle`.

**Hook.** Hold a sheet of paper horizontally below your mouth and blow across the top. The paper lifts — against gravity, into the airstream. Daniel Bernoulli figured out why in 1738: fast fluids push less than slow ones. The same principle keeps a plane in the air and pushes a thrown curveball off its straight path.

**Sections (7):**

1. **The statement** — p + ½ρv² + ρgh = constant, along a streamline, for incompressible inviscid flow. Three caveats; respect them.
2. **Derive it from energy** — a fluid parcel in a streamtube, applying work-energy. Fifteen lines of algebra, no ceremony.
3. **The flying sheet of paper** — blow across the top, reduce pressure above, atmospheric pressure below pushes up. Standard classroom demo.
4. **Lift on a wing** — partial truth: Bernoulli is part of it, Newton's third law (downwash) is another. Resist the temptation to explain lift with Bernoulli alone.
5. **The Venturi meter** — narrow section of a pipe → faster flow → lower pressure. Used to measure flow rate since 1797.
6. **Where Bernoulli fails** — turbulent flow, compressible flow at high speed, viscous flow near walls. Know the limits.
7. **What's next** — viscosity. The thing Bernoulli explicitly ignored.

**Scenes to build (2):**

| File | Purpose |
|---|---|
| `venturi-scene.tsx` | A pipe narrowing, widening back. Flow velocity arrows, pressure plotted along the length. Live update as you change inlet velocity. |
| `airfoil-streamlines-scene.tsx` | An airfoil with streamlines curving over it. Pressure colour map above and below. Honest labelling — show that the explanation involves both Bernoulli *and* downwash. |

**Physicists:**
- Daniel Bernoulli *(exists from FIG.16 — 1738 *Hydrodynamica*)*
- Leonhard Euler *(exists — took Bernoulli's ideas further, wrote the Euler equations for inviscid flow)*
- Giovanni Battista Venturi *(NEW — 1797, the metre, the effect, the intuition)*

**Glossary terms:**
- `bernoullis-principle` — concept
- `streamline` — concept
- `incompressible-flow` — concept
- `venturi-effect` — phenomenon

**Reading minutes:** 10.

---

### FIG.26 — Viscosity and Reynolds Number

Slug: `viscosity-and-reynolds-number`.

**Hook.** Pour honey on a plate and water on a plate. They do different things. Not because honey has more mass, but because honey is viscous. The quantitative measure is η — dynamic viscosity — and combined with speed and size it gives you the Reynolds number, the single most useful dimensionless quantity in fluid mechanics. Re < 1 is life for bacteria. Re > 10⁵ is life for airliners. The same fluid can do both.

**Sections (7):**

1. **Viscosity, defined** — Newton, 1687: shear stress proportional to velocity gradient, τ = η·du/dy. Newtonian fluids do this; non-Newtonian fluids (ketchup, blood) don't.
2. **Poiseuille flow** — parabolic velocity profile in a pipe. Flow rate scales as r⁴ — tiny blood vessels dominate resistance. (Callback to hydraulic ideas.)
3. **The Reynolds number** — Re = ρvL/η. Ratio of inertial to viscous forces. Derive by dimensional analysis; interpret physically.
4. **Two regimes** — low Re (laminar, viscous-dominated, reversible-looking) vs high Re (turbulent, inertial-dominated, irreversible).
5. **Life at low Reynolds number** — Purcell's 1977 lecture. Bacteria swim with corkscrews, not paddles, because water feels to them like molasses feels to us.
6. **Stokes' law again** — drag on a sphere at low Re is 6πηrv. Callback to FIG.04. Now you know *why* the drag formula changes between regimes.
7. **What's next** — turbulence. The monster at the end of this module.

**Scenes to build (3):**

| File | Purpose |
|---|---|
| `viscous-flow-scene.tsx` | Fluid in a pipe; velocity profile builds up to the parabolic Poiseuille shape. Viscosity slider changes the time-to-steady-state. |
| `reynolds-scene.tsx` | Flow past a cylinder at varying Re. Log-scale Re slider from 0.1 to 10⁶. Watch the wake transition: smooth → vortex street → turbulent. |
| `low-re-swimmer-scene.tsx` | Schematic of a bacterial flagellum and a reciprocal paddle. At high Re the paddle works. At low Re only the corkscrew does, because reciprocal motion cancels itself. |

**Physicists:**
- Jean Léonard Marie Poiseuille *(NEW — 1840s, flow in blood vessels and tubes)*
- George Gabriel Stokes *(exists from FIG.04)*
- Osborne Reynolds *(NEW — 1883, the dye-in-a-pipe experiment that defined turbulence onset)*
- Edward Mills Purcell *(NEW — the 1977 "Life at Low Reynolds Number" lecture; reused from future § 05)*

**Glossary terms:**
- `viscosity` — concept
- `reynolds-number` — concept
- `laminar-flow` — concept
- `poiseuille-flow` — phenomenon
- `newtonian-fluid` — concept

**Reading minutes:** 12.

---

### FIG.27 — Turbulence

Slug: `turbulence`.

**Hook.** Heisenberg was once asked what he would ask God, given the chance. Two things, he said: Why relativity, and why turbulence. I really think He may have an answer to the first question. The remark was probably apocryphal but it captured a real fact. Two hundred years after the Navier-Stokes equations were written down, turbulence is still the great unsolved problem of classical physics — and you see it every time you watch smoke curl.

**Sections (7):**

1. **What turbulence looks like** — eddies on eddies on eddies. Richardson's 1922 poem: *Big whorls have little whorls that feed on their velocity, and little whorls have lesser whorls and so on to viscosity.*
2. **Navier-Stokes** — the equation of everything for fluids. Written down in the 1820s. Still not proven to have smooth solutions in 3D — it's a Millennium Prize problem.
3. **The energy cascade** — Kolmogorov 1941. Energy enters at large scales, cascades down to smaller scales, dissipates as heat at the viscous scale. v⁵/³ spectrum. One of the cleanest predictions in the field.
4. **Why no closed-form theory** — the non-linear (v·∇)v term in Navier-Stokes couples all scales. No separation of modes. No simple basis set.
5. **Instability and transition** — how laminar flow becomes turbulent. Reynolds' dye experiment. Linear stability; Orr-Sommerfeld. The critical Re for a pipe is ~2300, but the transition is messy.
6. **Why it matters** — weather, climate, the atmosphere of every planet, aircraft drag, pipe design, plasma fusion, the solar wind. Half of engineering is working around turbulence.
7. **What's next** — the last module of Classical Mechanics. Lagrangian and Hamiltonian — physics rewritten as an optimisation problem.

**Scenes to build (2):**

| File | Purpose |
|---|---|
| `kolmogorov-spectrum-scene.tsx` | Energy spectrum on log-log axes, with the characteristic −5/3 slope highlighted. Overlay real-world data (wind tunnel, atmospheric boundary layer). |
| `karman-vortex-scene.tsx` | Flow past a cylinder at Re ~100, showing the vortex street. Pre-computed video or fast pseudo-simulation. Educational value: the pattern itself. |

**Physicists:**
- Claude-Louis Navier *(NEW — 1822, wrote down the equations with molecular-origin arguments)*
- George Gabriel Stokes *(exists — 1845, re-derived them with continuum arguments)*
- Osborne Reynolds *(exists from FIG.26)*
- Lewis Fry Richardson *(NEW — energy cascade idea, 1922)*
- Andrey Kolmogorov *(NEW — 1941, the −5/3 law and dimensional analysis of the inertial range)*
- Werner Heisenberg *(cameo — the apocryphal quote; main biography in § 05 Quantum)*

**Glossary terms:**
- `turbulence` — phenomenon
- `navier-stokes-equations` — concept
- `vortex` — concept
- `energy-cascade` — phenomenon
- `kolmogorov-spectrum` — phenomenon

**Reading minutes:** 13. This one runs a little long on purpose.

---

## Module 8 · Lagrangian & Hamiltonian

Classical mechanics rewritten. Newton asks: what are the forces? The Lagrangian approach asks: what path minimises the action? Both give the same predictions, but the second generalises to fields, to quantum mechanics, and to every theory that came after Newton.

### FIG.28 — The Principle of Least Action

Slug: `the-principle-of-least-action`.

**Hook.** Of all the possible paths a ball could take between two points, it takes exactly one. Maupertuis, in 1744, guessed why: the real path is the one that minimises a quantity called *action*. Feynman, two centuries later, showed this was literally how quantum mechanics works — a particle tries every path, and all but the stationary ones cancel by interference. For classical mechanics you only need the idea at the level of optimisation: nature is lazy.

**Sections (7):**

1. **The set-up** — a particle has to go from A to B in a given time. Infinitely many possible paths between. Which one does it take?
2. **Fermat's hint** — 1662, light takes the path of least time through media of different speeds. Derives Snell's law without needing the wave picture. Precursor of action principles.
3. **Action, defined** — S = ∫ L dt, with L = T − V (kinetic minus potential). Units of energy × time. Unfamiliar but well-defined.
4. **The statement** — the actual path is the one for which S is stationary (minimum, maximum, or saddle — "stationary" is the rigorous word) under small variations.
5. **A worked example** — particle in free fall. Parabola drops out. Compare to Newton's calculation — same answer, different route.
6. **Why it matters** — scalable to arbitrary coordinates, to constrained systems, to fields. The path to every modern theory runs through here.
7. **What's next** — the Euler-Lagrange equations, which turn the "find a stationary S" problem into a differential equation you can actually solve.

**Scenes to build (2):**

| File | Purpose |
|---|---|
| `action-paths-scene.tsx` | Two fixed endpoints A and B. User scribbles arbitrary paths between them. For each, compute and display S. The true path sits at a minimum of the continuous curve S[path]. |
| `snell-as-fermat-scene.tsx` | Light ray going from a point in air to a point underwater. User drags the refraction point along the surface. Total-time readout. Minimum occurs exactly at Snell's-law angle. |

**Physicists:**
- Pierre Louis Maupertuis *(NEW — 1744, first explicit principle of least action)*
- Leonhard Euler *(exists — gave it rigour the same year)*
- Pierre de Fermat *(NEW — 1662, the least-time principle for light)*
- Joseph-Louis Lagrange *(NEW — reformulated the whole of mechanics around it, 1788)*

**Glossary terms:**
- `action` — concept
- `principle-of-least-action` — concept
- `stationary-action` — concept
- `fermats-principle` — concept

**Reading minutes:** 11.

---

### FIG.29 — The Lagrangian

Slug: `the-lagrangian`.

**Hook.** Lagrange, in 1788, published *Mécanique analytique* — a book he boasted contained not a single diagram. He had rewritten all of Newton's mechanics as an optimisation of a single function, L = T − V. Every system in classical mechanics has its own L, and once you know it you grind out the Euler-Lagrange equations and the equations of motion fall out mechanically. It was the first time physics felt like an algorithm.

**Sections (7):**

1. **Kinetic minus potential** — why that combination, not the sum. No intuitive story in classical mechanics; in quantum and in general relativity, it emerges naturally.
2. **The Euler-Lagrange equation** — d/dt(∂L/∂q̇) = ∂L/∂q. Derive from stationary action in one slide.
3. **Generalised coordinates** — q can be anything — Cartesian, polar, angles, ratios. The equations don't care. This is where the Lagrangian method eats Newton's lunch.
4. **Simple example 1 — the pendulum** — pick θ as your coordinate. L = ½mL²θ̇² − mgL(1 − cos θ). Crank. Get θ̈ = −(g/L) sin θ. Faster than Newton, no force diagrams.
5. **Simple example 2 — the double pendulum** — where Newton becomes a nightmare, Lagrange is two lines of setup. The EoM is still messy, but you never have to draw a free-body diagram.
6. **Constraints** — a bead on a wire. Pick the coordinate along the wire. The constraint force disappears from the equations automatically. Huge.
7. **What's next** — another reformulation. Hamilton's version, which looks almost the same but sets up phase space.

**Scenes to build (2):**

| File | Purpose |
|---|---|
| `double-pendulum-scene.tsx` | A double pendulum integrated via Euler-Lagrange. Sensitive to initial conditions — good chaos demo preview. Trace the tip's motion. |
| `bead-on-wire-scene.tsx` | A wire of user-chosen shape (circle, parabola, cycloid). Ball released from a chosen point. Lagrangian gives the motion directly. For the cycloid: tautochrone demo. |

**Physicists:**
- Joseph-Louis Lagrange *(exists from FIG.28)*
- Leonhard Euler *(exists)*
- Christiaan Huygens *(exists — he solved the tautochrone in 1659 by geometry, the hard way)*

**Glossary terms:**
- `lagrangian` — concept (full entry)
- `euler-lagrange-equations` — concept
- `generalised-coordinates` — concept
- `constraint` — concept
- `tautochrone` — phenomenon

**Reading minutes:** 12.

---

### FIG.30 — The Hamiltonian

Slug: `the-hamiltonian`.

**Hook.** Hamilton, in 1833 in Dublin, was thinking about light and mechanics as two sides of a single geometric idea. He ended up with a reformulation of mechanics in which position and momentum are independent variables, related by two symmetric first-order equations instead of one second-order one. Physicists love it. Quantum mechanics uses it literally. Modern numerical integrators of planetary orbits are Hamiltonian by construction.

**Sections (7):**

1. **A Legendre transform** — swap a variable for its conjugate. L(q, q̇) → H(q, p), with p = ∂L/∂q̇. Three lines of algebra.
2. **Hamilton's equations** — q̇ = ∂H/∂p, ṗ = −∂H/∂q. Symmetric; first-order; cleaner than Euler-Lagrange in a lot of situations.
3. **H is often the energy** — for time-independent potentials, H = T + V. Not a coincidence — a consequence of time-translation symmetry (callback to Noether).
4. **Poisson brackets** — {f, g} = Σ (∂f/∂q ∂g/∂p − ∂f/∂p ∂g/∂q). Algebraic objects that make evolution laws look like commutators. Direct precursor of quantum commutators.
5. **Symplectic structure** — Hamilton's equations preserve a volume in phase space (Liouville's theorem). Conservative systems never lose volume; dissipative ones always do.
6. **Symplectic integrators** — numerically, preserving this volume matters. A symplectic integrator keeps a planetary orbit stable for a billion years; a naive one doesn't.
7. **What's next** — phase space itself, one more level of abstraction, and the natural stage for chaos.

**Scenes to build (2):**

| File | Purpose |
|---|---|
| `phase-portrait-pendulum-scene.tsx` | Pendulum's motion drawn in (θ, p_θ) space. Closed loops for small oscillations; wavy open trajectories for rotation; separatrix between. |
| `symplectic-vs-euler-scene.tsx` | Kepler orbit integrated two ways side by side: forward-Euler (drifts outward over time) and symplectic leap-frog (closed ellipse forever). Pedagogical killer. |

**Physicists:**
- William Rowan Hamilton *(exists from FIG.19 — 1833 Dublin is the moment)*
- Siméon Denis Poisson *(exists from FIG.07)*
- Joseph Liouville *(NEW — the phase-space volume theorem, 1838)*

**Glossary terms:**
- `hamiltonian` — concept
- `conjugate-momentum` — concept
- `hamiltons-equations` — concept
- `poisson-bracket` — concept
- `liouvilles-theorem` — concept
- `symplectic` — concept

**Reading minutes:** 12.

---

### FIG.31 — Phase Space

Slug: `phase-space`.

**Hook.** The pendulum page already introduced phase portraits — trajectories in the (θ, θ̇) plane. Pull back the camera and you realise: phase space is where every possible motion of every possible classical system lives. One point in phase space = one complete specification of the system. One trajectory = one possible history. Liouville proved that volume in phase space is conserved under Hamiltonian flow — a statement with consequences from statistical mechanics to chaos theory to quantum uncertainty.

**Sections (7):**

1. **Two coordinates per degree of freedom** — a particle in 1D lives in a 2D phase space; in 3D, a 6D phase space. N particles: 6N. It gets big fast.
2. **A point, a trajectory, a flow** — a single state is a point; evolution is a trajectory; an ensemble of states is a region whose shape evolves in time.
3. **Liouville's theorem, restated** — the region's volume never changes. It may stretch and fold, but volume is conserved. Proof in one page from Hamilton's equations.
4. **The Poincaré recurrence theorem** — a bounded Hamiltonian system will, given enough time, return arbitrarily close to any earlier state. Poincaré 1890. Famously unsettles Boltzmann and hints at the statistical-mechanics paradoxes in § 03.
5. **Chaos** — the double pendulum's phase space is full of trajectories that start close and end arbitrarily far apart. Sensitive dependence on initial conditions. Lyapunov exponents.
6. **KAM theorem** — Kolmogorov-Arnold-Moser, 1954-63. Most invariant tori survive small perturbations. Why the solar system has lasted — just barely — as long as it has.
7. **What's next** — the end of § 01 Classical Mechanics. The reader is now ready for § 02 (Electromagnetism) or § 04 (Relativity) or § 05 (Quantum), where phase space keeps reappearing in new clothes.

**Scenes to build (3):**

| File | Purpose |
|---|---|
| `liouville-flow-scene.tsx` | A coloured blob of initial conditions in phase space, evolving under simple Hamiltonian flow (SHO, then pendulum). Watch it stretch and twist while its area stays constant. |
| `double-pendulum-chaos-scene.tsx` | Two double pendulums started 0.001 radians apart. Within seconds they diverge completely. Histogram of the divergence vs time hints at the Lyapunov exponent. |
| `poincare-section-scene.tsx` | Standard map or Hénon-Heiles, showing the transition from tori to chaos as an energy/amplitude slider is raised. Regular islands and chaotic seas. |

**Physicists:**
- Joseph Liouville *(exists from FIG.30)*
- Henri Poincaré *(exists — his chaos work is central to FIG.23 tides, now re-foregrounded)*
- Andrey Kolmogorov *(exists from FIG.27)*
- Vladimir Arnold *(NEW — Moscow school, completed KAM in 1963, wrote the definitive mechanics textbook)*
- Jürgen Moser *(NEW — third leg of the KAM theorem)*
- Aleksandr Lyapunov *(NEW — exponents named for him, 1892)*

**Glossary terms:**
- `phase-space` — concept
- `phase-portrait` — concept (full entry here; was introduced light in FIG.14)
- `lyapunov-exponent` — concept
- `kam-theorem` — concept
- `poincare-recurrence` — phenomenon
- `chaos` — concept

**Reading minutes:** 13. Module's last page — given the size of the ideas, it runs a hair long.

---

## Execution order

Three live modules (1, 4, 6), five to write (2, 3, 5, 7, 8). Recommended order for the remaining five:

1. **Module 2 (Conservation Laws) first.** Short, foundational, and every subsequent module assumes it. Noether closes it in a way that sets up both Module 8 *and* § 06's gauge-theory content.
2. **Module 3 (Rotation & Rigid Bodies) next.** It's the first real shape-aware physics and pays off immediately with the gyroscope and the wobbling Earth.
3. **Module 5 (Waves) after 3.** Once rotation is in, the pedagogical hinge is ready for the wave equation. FIG.16–19 then set up all of § 02 Electromagnetism.
4. **Module 7 (Fluids).** Harder than it looks — especially Turbulence — but nothing after it depends on it.
5. **Module 8 (Lagrangian & Hamiltonian) last.** Needs Module 2's conservation language and Module 5's wave language. Sets up § 05 Quantum Mechanics cleanly.

Each module ships one topic at a time. No branching drama.

---

## Patterns to reuse

- **Scene skeleton:** copy from `damped-pendulum-scene.tsx` or `kinematics-graph-scene.tsx`. All use `useAnimationFrame`, `useThemeColors`, canvas + ResizeObserver, cyan (`#5BE9FF`) as the accent, JetBrains Mono for HUD.
- **Physics functions:** pure modules in `lib/physics/*.ts`. One module per topic (`lib/physics/energy.ts`, `lib/physics/momentum.ts`, `lib/physics/angular.ts`, `lib/physics/symmetry.ts`, `lib/physics/rotation.ts`, `lib/physics/waves.ts`, `lib/physics/fluids.ts`, `lib/physics/lagrangian.ts`, etc.).
- **Physicist adds:** manually edit `lib/content/physicists.ts` + `messages/<locale>/physicists.json`. No MCP tool for this (see `docs/mcp-gaps.md`).
- **Glossary adds:** direct edits to `lib/content/glossary.ts` + `messages/en/glossary.json` + `messages/he/glossary.json`.
- **Topic status flip:** direct edit to `lib/content/branches.ts` — change `status: "live"` and set a real `readingMinutes`.
- **Hebrew content:** copy the English MDX, translate prose section-by-section, update `messages/he/home.json` chrome, wire `HeContent` into `page.tsx`.
- **MDX cross-refs:** wrap physicists with `<PhysicistLink slug="...">` and glossary terms with `<Term slug="...">`. Both throw at build time on unknown slug — use this, don't fight it.

---

## Definition of done per topic

- [ ] `content.en.mdx` replaces skeleton, full 7-section essay.
- [ ] All new scenes exist, are registered in `visualization-registry.tsx`, render without runtime error.
- [ ] New physicists + glossary terms live with cross-links.
- [ ] `status: "live"`, `readingMinutes: N` in `branches.ts`.
- [ ] English `home.json` chrome updated.
- [ ] `npx tsc --noEmit` passes.
- [ ] Manual smoke test in `bun dev` at `/en/classical-mechanics/<slug>`.
- [ ] (optional) Hebrew content + `page.tsx` wire + `home.json` chrome.
