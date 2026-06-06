# Session 3 — §11 Gravitational Waves (4 topics)

You are content session **s3-grav-waves** of a 6-session parallel sprint
finishing the Relativity branch of physicsexplained.

**First:** read `docs/prompts/2026-06-06-relativity/SHARED.md` in
`/Users/roman/Developer/physics` and follow its workspace setup with
`SESSION-ID = s3-grav-waves`. All rules there apply.

## Your topics (eyebrows/titles/subtitles verbatim in `lib/content/branches.ts`)

### 1. `linearized-gravity` — FIG.50
Small ripples on flat spacetime: g = η + h, |h| ≪ 1. Linearize the EFE, choose
the transverse-traceless gauge (analogy to EM gauge choice made explicit),
get a wave equation traveling at c. Why Einstein himself doubted the waves
were real (the 1936 Einstein–Rosen episode) and how the sticky-bead argument
settled it. Physics lib: `lib/physics/relativity/gravitational-wave.ts`
(plane-wave h(t), ring deformation).
Scene ideas: (a) the perturbation picture — flat grid + adjustable ripple
amplitude/wavelength propagating across it; (b) gauge-fixing as "choosing
honest coordinates": same wave, three coordinate systems, only TT shows the
physics; (c) EM-vs-GR analogy table, interactive (potential ↔ metric, gauge ↔
coordinates, dipole ↔ quadrupole).

### 2. `polarization-modes` — FIG.51
What a wave does to a ring of free test masses: + stretches/squeezes along
axes, × at 45°. Two polarizations because gravity is spin-2; contrast with
EM's spin-1. Quadrupole radiation: why there is no dipole gravitational
radiation (momentum conservation kills it).
Physics lib: extend `gravitational-wave.ts` (ring response for +, ×, mixed).
Scene ideas: (a) THE classic — ring of test masses under a passing wave,
+/×/circular toggle, amplitude & frequency sliders; (b) spin-1 vs spin-2
pattern comparison — rotate the polarization, watch 180° vs 90° symmetry;
(c) why-no-dipole — oscillating dipole vs quadrupole mass configurations,
the dipole's center of mass cannot oscillate.

### 3. `binary-inspiral-and-the-chirp` — FIG.52
Two compact objects spiral in: energy loss to radiation shrinks the orbit,
frequency and amplitude rise together — the chirp. Chirp mass as the loudest
observable; Hulse–Taylor PSR B1913+16 as the 1974–2005 indirect proof (orbital
decay matching GR to 0.2%). Physics lib: extend `gravitational-wave.ts`
(quadrupole-formula inspiral ODE, strain waveform h(t), chirp mass).
Scene ideas: (a) inspiral orbit + live strain trace below — watch the chirp
build to merger, masses adjustable; (b) chirp-mass explorer — same waveform,
different (m₁, m₂) pairs with equal chirp mass overlap, unequal ones don't;
(c) Hulse–Taylor cumulative periastron shift — the famous parabola of data
points falling exactly on the GR prediction line.

### 4. `ligo-and-multi-messenger` — FIG.53
September 14 2015, 09:50:45 UTC: GW150914, two ~30 M☉ holes, 1.3 billion
years ago, strain 10⁻²¹ — a proton-width over 4 km. How the interferometer
reaches that precision; GW170817: neutron stars + gamma rays + kilonova,
the birth of multi-messenger astronomy; what "hearing" the universe means.
Physics lib: extend `gravitational-wave.ts` (interferometer arm response).
Scene ideas: (a) Michelson interferometer with a wave passing — arm lengths
breathe in antiphase, output port brightens/darkens, exaggeration slider
labeled honestly; (b) GW150914 replay — reconstructed strain vs best-fit
template overlay with frequency readout climbing 35→250 Hz; (c) sky
triangulation — two vs three detectors, timing rings shrink the localization
patch (why Virgo mattered for GW170817).

## Reference ownership (you CREATE these; others only reference)

**Physicists** (append to `lib/content/physicists.ts` + seeds):
`rainer-weiss` (1932–2025, German-American), `kip-thorne` (1940–, American),
`joseph-taylor` (1941–, American), `russell-hulse` (1950–, American).
Already exist: `albert-einstein`. Owned by others — reference only:
`stephen-hawking` (s2), `karl-schwarzschild` (s1).

**Dictionary terms** (append to `lib/content/glossary.ts` + seeds):
`gravitational-wave`, `strain`, `transverse-traceless-gauge`,
`quadrupole-radiation`, `chirp-mass`, `interferometer`, `neutron-star`,
`multi-messenger-astronomy` (verified: none of these exist yet — you own all).
Owned by others (reference but do NOT create): `event-horizon` (s2).

Work through the topics in order. FIG.52's chirp scene is the showstopper of
the whole branch — make the waveform physically honest (quadrupole formula,
not a cartoon sine sweep).
