# Session 1 — §09 Schwarzschild and the Classical Tests (5 topics)

You are content session **s1-schwarzschild** of a 6-session parallel sprint
finishing the Relativity branch of physicsexplained.

**First:** read `docs/prompts/2026-06-06-relativity/SHARED.md` in
`/Users/roman/Developer/physics` and follow its workspace setup with
`SESSION-ID = s1-schwarzschild`. All rules there apply.

## Your topics (eyebrows/titles/subtitles verbatim in `lib/content/branches.ts`)

### 1. `the-schwarzschild-metric` — FIG.39
The first exact solution of the EFE, found by Karl Schwarzschild in a WWI
trench in December 1915, weeks after Einstein published. The metric, what each
component means, the Schwarzschild radius r_s = 2GM/c², coordinate vs physical
singularity, Birkhoff's theorem.
Physics lib: `lib/physics/relativity/schwarzschild.ts` (metric components,
effective potential, orbit integrator — reuse `lib/physics/ode.ts` if helpful).
Scene ideas: (a) g_tt and g_rr vs r with an r_s slider — watch the blow-up at
r_s and its harmlessness in infalling coordinates; (b) effective-potential
orbit explorer — energy/angular-momentum sliders, circular/precessing/plunge
orbits live-integrated; (c) Flamm-paraboloid embedding diagram with mass slider.

### 2. `mercurys-perihelion` — FIG.40
The 43″/century anomaly Le Verrier isolated in 1859, the failed Vulcan
hypothesis, Einstein's November 18 1915 calculation ("heart palpitations").
Derive the GR precession term, compare contributions (planetary tugs vs GR).
Physics lib: extend `schwarzschild.ts` (precession-per-orbit function).
Scene ideas: (a) precessing ellipse — exaggeration slider from realistic to
visible, GR term on/off toggle; (b) the precession budget — stacked bar of
Newtonian tugs (531″) + GR (43″) vs observed (574″); (c) precession vs orbital
radius/eccentricity explorer (why Mercury and not Jupiter).

### 3. `light-deflection-and-lensing` — FIG.41
1.75″ at the solar limb — twice the Newtonian half-value; Eddington's May 29
1919 Príncipe expedition; from deflection to lensing: Einstein rings, multiple
quasar images, dark-matter mapping by lensing.
Physics lib: extend `schwarzschild.ts` (photon deflection angle vs impact
parameter).
Scene ideas: (a) photon trajectories past a mass — impact-parameter slider,
Newtonian-vs-GR toggle; (b) the 1919 eclipse measurement — star field with/
without sun, displacement arrows magnified; (c) point-source lensing toy —
move the source behind the lens, watch images merge into an Einstein ring.

### 4. `shapiro-delay` — FIG.42
The "fourth test" (1964): radar to Venus at superior conjunction returns
~200 μs late. Coordinate light speed in the Schwarzschild geometry, what
"slowed light" does and doesn't mean, Cassini 2002 at 10⁻⁵ precision.
Physics lib: extend `schwarzschild.ts` (round-trip delay integral).
Scene ideas: (a) Earth–Venus radar echo as Venus orbits toward conjunction —
delay curve traces the famous logarithmic spike; (b) coordinate speed of light
heatmap/dip near the mass; (c) accumulated-delay-along-path visual: the signal
path with per-segment contribution glowing.

### 5. `the-classical-tests-summary` — FIG.43
A whole theory on trial: perihelion (retrodiction), deflection (1919),
gravitational redshift (Pound–Rebka 1960), Shapiro delay (1964→Cassini). What
each tests (geodesics vs metric vs nonlinearity), PPN language in one
paragraph, why GR has never failed a test.
Physics lib: none new needed.
Scene ideas: (a) four-test interactive dashboard — click each test for
prediction vs measurement vs precision; (b) precision-over-time chart
(1915→2020, log scale) per test; (c) "which part of the theory does each test
probe" diagram (equivalence principle → metric → field equations).

## Reference ownership (you CREATE these; others only reference)

**Physicists** (append to `lib/content/physicists.ts` + seeds):
`karl-schwarzschild` (1873–1916, German), `arthur-eddington` (1882–1944,
British), `irwin-shapiro` (1929–, American).
Already exist (reference freely): `albert-einstein`, `urbain-le-verrier`,
`david-hilbert`.

**Dictionary terms** (append to `lib/content/glossary.ts` + seeds):
`schwarzschild-metric`, `schwarzschild-radius`, `birkhoffs-theorem`,
`perihelion-precession`, `gravitational-lensing`, `einstein-ring`,
`shapiro-delay`, `impact-parameter`.
Owned by other sessions (reference but do NOT create): `event-horizon` (s2),
`singularity` (s5).

Work through the topics in order. Good luck — this module is the public face
of GR; polish the orbit and lensing scenes especially.
