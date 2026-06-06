# Session 4 — §12 Cosmology (5 topics)

You are content session **s4-cosmology** of a 6-session parallel sprint
finishing the Relativity branch of physicsexplained.

**First:** read `docs/prompts/2026-06-06-relativity/SHARED.md` in
`/Users/roman/Developer/physics` and follow its workspace setup with
`SESSION-ID = s4-cosmology`. All rules there apply.

## Your topics (eyebrows/titles/subtitles verbatim in `lib/content/branches.ts`)

### 1. `the-flrw-metric` — FIG.54
The geometry the universe picked for itself: homogeneity + isotropy force the
Friedmann–Lemaître–Robertson–Walker form. The scale factor a(t), comoving
coordinates, the three spatial curvatures k = −1, 0, +1, and what "space
expands" does and doesn't mean (galaxies aren't moving through space).
Physics lib: `lib/physics/relativity/flrw.ts` (metric, comoving/proper
distance). Scene ideas: (a) the expanding grid — comoving galaxies ride
gridlines apart, a(t) slider, proper vs comoving distance readouts;
(b) curvature gallery — triangles on k = −1/0/+1 surfaces, angle sums;
(c) the raisin-bread / balloon analogy done honestly — every observer sees
themselves at the center, toggle viewpoint between galaxies.

### 2. `friedmann-equations` — FIG.55
Two ODEs that run the universe: H² = (8πG/3)ρ − k/a² + Λ/3 and the
acceleration equation. Derive nothing tensorial — present them as energy
bookkeeping; how each component (matter, radiation, Λ) scales with a;
fates of the universe by composition. Physics lib: `lib/physics/relativity/
friedmann.ts` (a(t) integrator over Ω components — reuse `lib/physics/ode.ts`).
Scene ideas: (a) the universe machine — Ω_m / Ω_r / Ω_Λ sliders, a(t)
integrated live: recollapse, coast, accelerate; (b) component scaling race —
ρ_r ∝ a⁻⁴, ρ_m ∝ a⁻³, ρ_Λ = const crossing over on a log plot with the real
epochs marked; (c) deceleration→acceleration handoff — ä(t) sign flip at
z ≈ 0.7 in the concordance model.

### 3. `hubble-and-cosmological-redshift` — FIG.56
Slipher's shifts, Leavitt's Cepheid ladder, Hubble 1929: v = H₀d. Cosmological
redshift is not Doppler — wavelengths stretch with a(t): 1 + z = a(now)/a(then).
The Hubble "constant" that isn't; the modern H₀ tension in one honest
paragraph. Physics lib: extend `flrw.ts` (z ↔ a, lookback time).
Scene ideas: (a) Hubble's actual 1929 diagram (24 points, scatter and all) vs
the modern Hubble flow — overlay toggle; (b) the stretching photon — a wave
drawn on the expanding grid from FIG.54, emitted at a(then), received now,
z readout; (c) lookback machine — pick z, get age of universe at emission,
distance then and now (the surprising factor-of-1000 CMB numbers fall out).

### 4. `the-cmb-and-nucleosynthesis` — FIG.57
The first three minutes' helium and the 380,000-year photograph. BBN: why ~25%
helium by mass is locked in by the baryon density; recombination, last
scattering, a 2.725 K perfect blackbody with 10⁻⁵ ripples; Penzias & Wilson's
pigeon-cleaned horn antenna, 1965. Physics lib: `lib/physics/relativity/
cmb.ts` (Planck spectrum, helium fraction estimate).
Scene ideas: (a) the most perfect blackbody ever measured — COBE/FIRAS points
on the 2.725 K Planck curve, with error bars smaller than the line;
(b) cosmic timeline — log-time slider from t = 1 s to 380 kyr: temperature,
what exists, what's opaque; (c) helium-vs-baryon-density — the BBN curve with
the observed band, why it nailed the baryon count decades before Planck.

### 5. `dark-matter-and-dark-energy` — FIG.58
95% of the budget is invisible. Zwicky's Coma cluster (1933), Rubin's flat
rotation curves (1970s), lensing maps, the Bullet Cluster; 1998 supernovae:
the expansion accelerates; Λ at 10⁻⁵² m⁻² and the worst prediction in physics
(the vacuum-energy discrepancy), stated honestly as open.
Physics lib: extend `friedmann.ts` (rotation-curve toy, SN distance modulus).
Scene ideas: (a) galaxy rotation curve builder — visible-mass prediction
falls, observed stays flat, add a halo slider to fit; (b) the cosmic budget —
Ω pie/bars morphing from z = 1000 to today (radiation→matter→Λ dominance);
(c) the 1998 discovery plot — SN Ia distance modulus residuals vs z,
accelerating/coasting/decelerating model curves to discriminate.

## Reference ownership (you CREATE these; others only reference)

**Physicists** (append to `lib/content/physicists.ts` + seeds):
`alexander-friedmann` (1888–1925, Russian), `georges-lemaitre` (1894–1966,
Belgian), `edwin-hubble` (1889–1953, American), `vera-rubin` (1928–2016,
American), `fritz-zwicky` (1898–1974, Swiss), `arno-penzias` (1933–2024,
German-American), `henrietta-leavitt` (1868–1921, American).
Already exist: `albert-einstein`. Owned by others — reference only:
`stephen-hawking` (s2), `roger-penrose` (s5).

**Dictionary terms** (append to `lib/content/glossary.ts` + seeds):
`scale-factor`, `comoving-coordinates`, `flrw-metric`, `friedmann-equations`,
`hubble-constant`, `cosmological-redshift`, `cosmic-microwave-background`,
`big-bang-nucleosynthesis`, `recombination`, `dark-matter`, `dark-energy`,
`cosmological-constant`, `critical-density`.
Owned by others (reference but do NOT create): `gravitational-lensing` (s1),
`gravitational-wave` (s3).

Work through the topics in order. Keep FIG.58 honest about what is unknown —
the branch's credibility rests on never overclaiming.
