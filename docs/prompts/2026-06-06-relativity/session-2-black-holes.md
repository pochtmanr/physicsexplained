# Session 2 — §10 Black Holes (6 topics)

You are content session **s2-black-holes** of a 6-session parallel sprint
finishing the Relativity branch of physicsexplained.

**First:** read `docs/prompts/2026-06-06-relativity/SHARED.md` in
`/Users/roman/Developer/physics` and follow its workspace setup with
`SESSION-ID = s2-black-holes`. All rules there apply.

## Your topics (eyebrows/titles/subtitles verbatim in `lib/content/branches.ts`)

### 1. `the-event-horizon` — FIG.44
The one-way membrane: what the infaller experiences (nothing special locally)
vs what the distant observer sees (freeze + redshift to black). Coordinate
artifact vs causal boundary; no drama at the horizon for a big hole; spaghetti
later. Physics lib: `lib/physics/relativity/event-horizon.ts`.
Scene ideas: (a) two-clock comparison — infaller proper time vs distant
observer coordinate time as r → r_s; (b) light cones tilting as r decreases
(outgoing ray slope hits vertical at the horizon); (c) "river model" — space
flowing inward faster than c inside, fish-swimming-upstream visual.

### 2. `kerr-and-the-ergosphere` — FIG.45
Roy Kerr, 1963: the metric for every astrophysical black hole. Frame dragging,
the ergosphere (forced co-rotation outside the horizon), the Penrose process,
spin limit a ≤ M. Physics lib: `lib/physics/relativity/kerr.ts` (horizon +
ergosphere radii vs spin, ZAMO angular velocity).
Scene ideas: (a) cross-section of horizon + ergosphere morphing with a spin
slider 0 → 0.998M; (b) frame-dragging — test particles released at rest are
swept around, angular velocity vs r; (c) Penrose-process energy budget toy —
split a particle in the ergosphere, extract rotational energy.

### 3. `penrose-diagrams` — FIG.46
Compactify infinity to draw the whole causal structure on one page. Conformal
rescaling in one gentle equation, Minkowski's diamond, the Schwarzschild
diagram's four regions, why the singularity is a moment in time, not a place.
Physics lib: `lib/physics/relativity/penrose.ts` (compactification maps).
Scene ideas: (a) the compactification map animated — watch radial lines and
light rays of Minkowski space fold into the diamond; (b) interactive Minkowski
Penrose diagram — drag a worldline, light rays stay 45°; (c) Schwarzschild
Penrose diagram region explorer — click regions I–IV, see who can reach whom.

### 4. `no-hair-theorem` — FIG.47
Mass, spin, charge — nothing else survives collapse. Israel, Carter, Wheeler's
phrase. How "hair" radiates away as ringdown; tests via LIGO ringdown
frequencies and the EHT shadow. Physics lib: none new needed (reference
`kerr.ts`).
Scene ideas: (a) collapse-and-ringdown — a lumpy mass collapses, multipole
bumps radiate away as damped waves, leaving a smooth Kerr hole; (b) the
three-knob black hole — M, J, Q sliders are literally the entire parameter
space; (c) "two very different stars, same black hole" comparison animation.

### 5. `black-hole-thermodynamics` — FIG.48
Hawking's area theorem (1971), Bekenstein's wager: entropy = area/4 in Planck
units. The four laws mapped onto thermodynamics; surface gravity as
temperature; why this analogy turned out to be physics, not poetry.
Physics lib: `lib/physics/relativity/bh-thermodynamics.ts` (S(M), T(M),
area of merged holes). Scene ideas: (a) merger area-theorem checker — two
masses in, A_final ≥ A_1 + A_2 verified live with spin sliders; (b) the
entropy scale — a solar-mass hole vs the visible universe's ordinary entropy,
log-scale bars; (c) the four-laws correspondence table, interactive
(hover/click each law pair).

### 6. `hawking-radiation` — FIG.49
1974: quantum fields near a horizon make black holes glow. Pair-creation
heuristic honestly labeled as a heuristic; T ∝ 1/M (small holes are hot);
evaporation time ∝ M³; the late-stage flash; why stellar holes are colder
than the CMB and won't evaporate for 10⁶⁷ years.
Physics lib: extend `bh-thermodynamics.ts` (T, luminosity, lifetime).
Scene ideas: (a) temperature & lifetime vs mass — log-log explorer with
markers for primordial / stellar / supermassive holes; (b) evaporation
movie — M(t) shrinking with accelerating glow and final flash, time-warped
log scale; (c) blackbody spectra at three masses overlaid with the CMB at
2.725 K (why stellar holes net-absorb today).

## Reference ownership (you CREATE these; others only reference)

**Physicists** (append to `lib/content/physicists.ts` + seeds):
`roy-kerr` (1934–, New Zealander), `stephen-hawking` (1942–2018, British),
`jacob-bekenstein` (1947–2015, Mexican-Israeli-American),
`john-archibald-wheeler` (1911–2008, American).
Already exist: `albert-einstein`, `karl-schwarzschild` is owned by s1 —
reference it, do not create it. `roger-penrose` is owned by s5 — reference
only.

**Dictionary terms** (append to `lib/content/glossary.ts` + seeds):
`event-horizon`, `frame-dragging`, `ergosphere`, `penrose-process`,
`penrose-diagram`, `no-hair-theorem`, `bekenstein-hawking-entropy`,
`surface-gravity`, `hawking-radiation`.
Owned by others (reference but do NOT create): `schwarzschild-radius` (s1),
`singularity` (s5), `gravitational-wave` (s3).

Work through the topics in order — this is the branch's marquee module; most
readers will open a session on `the-event-horizon` or `hawking-radiation`.
