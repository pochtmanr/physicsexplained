# Content Gaps — Physicists & Dictionary

Snapshot: 2026-04-19. Source of truth: `lib/content/physicists.ts`, `lib/content/glossary.ts`, `messages/{en,he,ru}/*.json`.

## Progress log

- **2026-04-19 / physicists:** All 17 stub images uploaded to Supabase (`images/physicists/{slug}.{avif,webp}`). `image:` field added to each entry in `lib/content/physicists.ts`. Hebrew translations for all 17 added to `messages/he/physicists.json` (31 total HE entries, up from 14). EN JSON intentionally skipped — `mergePhysicist` falls back to the English TS source when a locale key is missing, so EN entries are redundant.
- **2026-04-19 / dictionary HE:** 33 missing Hebrew translations added to `messages/he/glossary.json` (89 total HE entries, up from 56).
- **2026-04-19 / dictionary animations:** 7 new scenes registered in `components/physics/visualization-registry.tsx` and 46 glossary terms now wired to interactive scenes via `visualization:` field. Combined with the 4 terms that already have Supabase illustrations, 71/84 dictionary terms now have some visual — only 13 still need static AVIFs.
- **2026-04-19 / topic cards:** Fixed `extractFigNumber` in `components/layout/topic-card.tsx` to pull any leading digit run from eyebrow (was EN-only regex `/FIG\.(\d+)/`). Hebrew eyebrows `איור 05 · …` now render the giant watermark numeral correctly.
- **2026-04-19 / HE topic translations:** 20 missing Hebrew topic labels added to `messages/he/home.json → topics.items` (energy-and-work, momentum-and-collisions, angular-momentum, noethers-theorem, torque-and-rotational-dynamics, moment-of-inertia, gyroscopes-and-precession, the-wobbling-earth, the-wave-equation, standing-waves-and-modes, doppler-and-shock-waves, dispersion-and-group-velocity, pressure-and-buoyancy, bernoullis-principle, viscosity-and-reynolds-number, turbulence, the-principle-of-least-action, the-lagrangian, the-hamiltonian, phase-space). HE topic coverage now 31/31.

---

## PHYSICISTS

Total: 38. Image path convention: Supabase `images` bucket → `physicists/{slug}.{avif,webp}`.

### Done: image + HE translation (17) ✅

All 17 stubs are now complete — image uploaded, `image:` field added, HE translations present. EN uses source-TS fallback.

- [x] `gottfried-wilhelm-leibniz`
- [x] `emilie-du-chatelet`
- [x] `james-prescott-joule`
- [x] `thomas-young`
- [x] `james-watt`
- [x] `rene-descartes`
- [x] `john-wallis`
- [x] `leonhard-euler`
- [x] `emmy-noether`
- [x] `david-hilbert`
- [x] `felix-klein`
- [x] `albert-einstein`
- [x] `archimedes`
- [x] `jacob-steiner`
- [x] `elmer-sperry`
- [x] `hipparchus`
- [x] `seth-carlo-chandler`

### Need RU translation only (5) — image + EN/HE already in place

- [ ] `nicole-oresme`
- [ ] `robert-hooke`
- [ ] `evangelista-torricelli`
- [ ] `guillaume-amontons`
- [ ] `george-gabriel-stokes`

### Fully covered (21) — reference

galileo-galilei, isaac-newton, christiaan-huygens, leon-foucault, johannes-kepler, tycho-brahe, claudius-ptolemy, nicolaus-copernicus, urbain-le-verrier, pierre-bouguer, adrien-marie-legendre, nikola-tesla, jules-lissajous, henry-cavendish, joseph-louis-lagrange, henri-poincare, nicole-oresme, robert-hooke, evangelista-torricelli, guillaume-amontons, george-gabriel-stokes (last 5: EN/HE only).

---

## DICTIONARY

Total: 84 terms. Only 4 terms currently have any illustration: `pendulum-clock`, `telescope`, `quadrant`, `astrolabe`. Image path convention: Supabase `images` bucket → `dictionary/{slug}.avif` (or `.webp`/`.mp4` for animations). Reference field:

```ts
images: [{ src: storageUrl("dictionary/{slug}.avif") }]
```

### HE translations — DONE (33) ✅

HE coverage now 89/89 (was 56/84). All 33 terms translated in `messages/he/glossary.json`.

### EN translations missing (54)

EN coverage is 35/84. Missing:

- [ ] `tautochrone`
- [ ] `cycloid`
- [ ] `elliptic-integral`
- [ ] `separatrix`
- [ ] `libration`
- [ ] `nonlinear-dynamics`
- [ ] `potential-well`
- [ ] `damping`
- [ ] `q-factor`
- [ ] `resonance`
- [ ] `normal-modes`
- [ ] `beats`
- [ ] `shell-theorem`
- [ ] `gravitational-field`
- [ ] `vis-viva`
- [ ] `escape-velocity`
- [ ] `hohmann-transfer`
- [ ] `tidal-force`
- [ ] `roche-limit`
- [ ] `lagrange-points`
- [ ] `gravity-assist`
- [ ] `work`
- [ ] `kinetic-energy`
- [ ] `potential-energy`
- [ ] `conservation-of-energy`
- [ ] `power`
- [ ] `momentum`
- [ ] `impulse`
- [ ] `center-of-mass`
- [ ] `elastic-collision`
- [ ] `inelastic-collision`
- [ ] `coefficient-of-restitution`
- [ ] `angular-momentum`
- [ ] `moment-of-inertia`
- [ ] `torque`
- [ ] `centripetal-force`
- [ ] `precession`
- [ ] `symmetry`
- [ ] `noethers-theorem`
- [ ] `lagrangian`
- [ ] `invariance`
- [ ] `moment-arm`
- [ ] `lever`
- [ ] `static-equilibrium`
- [ ] `angular-acceleration`
- [ ] `parallel-axis-theorem`
- [ ] `radius-of-gyration`
- [ ] `principal-axes`
- [ ] `gyroscope`
- [ ] `nutation`
- [ ] `euler-angles`
- [ ] `axial-precession`
- [ ] `chandler-wobble`
- [ ] `equatorial-bulge`

### RU translations missing (70)

RU coverage is 19/84. Missing:

- [ ] `tautochrone`
- [ ] `cycloid`
- [ ] `elliptic-integral`
- [ ] `separatrix`
- [ ] `libration`
- [ ] `nonlinear-dynamics`
- [ ] `potential-well`
- [ ] `damping`
- [ ] `q-factor`
- [ ] `resonance`
- [ ] `normal-modes`
- [ ] `beats`
- [ ] `shell-theorem`
- [ ] `gravitational-field`
- [ ] `vis-viva`
- [ ] `escape-velocity`
- [ ] `hohmann-transfer`
- [ ] `tidal-force`
- [ ] `roche-limit`
- [ ] `lagrange-points`
- [ ] `gravity-assist`
- [ ] `inertia`
- [ ] `mass`
- [ ] `force`
- [ ] `newtons-laws-of-motion`
- [ ] `inertial-frame`
- [ ] `vector`
- [ ] `projectile-motion`
- [ ] `parabola`
- [ ] `range`
- [ ] `monkey-and-hunter`
- [ ] `friction`
- [ ] `static-friction`
- [ ] `kinetic-friction`
- [ ] `drag`
- [ ] `terminal-velocity`
- [ ] `stokes-law`
- [ ] `work`
- [ ] `kinetic-energy`
- [ ] `potential-energy`
- [ ] `conservation-of-energy`
- [ ] `power`
- [ ] `momentum`
- [ ] `impulse`
- [ ] `center-of-mass`
- [ ] `elastic-collision`
- [ ] `inelastic-collision`
- [ ] `coefficient-of-restitution`
- [ ] `angular-momentum`
- [ ] `moment-of-inertia`
- [ ] `torque`
- [ ] `centripetal-force`
- [ ] `precession`
- [ ] `symmetry`
- [ ] `noethers-theorem`
- [ ] `lagrangian`
- [ ] `invariance`
- [ ] `moment-arm`
- [ ] `lever`
- [ ] `static-equilibrium`
- [ ] `angular-acceleration`
- [ ] `parallel-axis-theorem`
- [ ] `radius-of-gyration`
- [ ] `principal-axes`
- [ ] `gyroscope`
- [ ] `nutation`
- [ ] `euler-angles`
- [ ] `axial-precession`
- [ ] `chandler-wobble`
- [ ] `equatorial-bulge`

### Animations status (2026-04-19)

**Where images live** — two options, choose per term:

1. **Interactive React scenes** (best — real physics, themed, responsive). Register in `components/physics/visualization-registry.tsx`, then set `visualization: "key"` on the glossary entry. Renderer is at `app/[locale]/dictionary/[slug]/page.tsx` and wraps the scene in a `SceneCard` automatically.
2. **Static AVIF / WEBP on Supabase** (`images/dictionary/{slug}.avif`) — use `images: [{ src: storageUrl("dictionary/{slug}.avif") }]` for standalone pictures or photos where an interactive scene doesn't make sense (e.g. historical instruments: astrolabe, quadrant, pendulum-clock, telescope already use this pattern).

**Current wire-ups (46 glossary terms → interactive scenes):**

| Scene key | Glossary terms |
|---|---|
| `gyroscope` | gyroscope, precession, nutation |
| `chandler-wobble` | chandler-wobble, axial-precession |
| `skater-spin` | angular-momentum, moment-of-inertia, centripetal-force |
| `torque-lever` | torque, lever, moment-arm, static-equilibrium |
| `collision` | elastic-collision, inelastic-collision, coefficient-of-restitution, momentum, impulse |
| `symmetry-triptych` | symmetry, noethers-theorem, invariance |
| `energy-bowl` | conservation-of-energy, potential-energy, kinetic-energy |
| `projectile` | projectile-motion, parabola, range |
| `monkey-hunter` | monkey-and-hunter |
| `friction-ramp` | friction, static-friction, kinetic-friction |
| `drag-regimes` | drag, stokes-law |
| `terminal-velocity` | terminal-velocity |
| `first-law` | inertia, inertial-frame |
| `f-ma` | force, mass |
| `action-reaction` | newtons-laws-of-motion |
| `vector-addition` | vector |
| `ellipse-construction` | ellipse, focus, semi-major-axis |
| `eccentricity-slider` | eccentricity |
| `isochronism` | isochronism |
| `restoring-force` | restoring-force |
| `phase-portrait` | phase-portrait |
| `shm-oscillator` | simple-harmonic-oscillator |
| `epicycle` | epicycle |
| `inverse-square` | inverse-square-law |
| `cycloid` | tautochrone, cycloid |
| `separatrix` | separatrix, libration |
| `damped-pendulum` | damping, q-factor |
| `resonance-curve` | resonance |
| `coupled-pendulum` | normal-modes |
| `beats` | beats |
| `energy-diagram` | potential-well |
| `shell-theorem` | shell-theorem |
| `gravity-field` | gravitational-field |
| `grav-potential` | escape-velocity |
| `vis-viva` | vis-viva |
| `hohmann` | hohmann-transfer |
| `tidal-force` | tidal-force |
| `roche-limit` | roche-limit |
| `lagrange-points` | lagrange-points |

**Unregistered scene files (could still be wired):**
`universal-oscillator-scene`, `wave-chain-scene`, `period-vs-amplitude-scene`, `ramp-race-scene`, `harmony-table`, `taylor-expansion-scene`, `sweep-areas`, `orbit-scene` (last two take required props and need a default wrapper).

### Dictionary visual coverage — 84/84 complete ✅

All 13 previously missing terms now have hand-drawn React/Canvas scenes matching the codebase style, registered in `components/physics/visualization-registry.tsx` and wired via `visualization:` in `lib/content/glossary.ts`:

| Scene file | Key | Glossary term |
|---|---|---|
| `work-scene.tsx` | `work` | work |
| `power-scene.tsx` | `power` | power |
| `gravity-assist-scene.tsx` | `gravity-assist` | gravity-assist |
| `center-of-mass-scene.tsx` | `center-of-mass` | center-of-mass |
| `angular-acceleration-scene.tsx` | `angular-acceleration` | angular-acceleration |
| `parallel-axis-theorem-scene.tsx` | `parallel-axis-theorem` | parallel-axis-theorem |
| `radius-of-gyration-scene.tsx` | `radius-of-gyration` | radius-of-gyration |
| `principal-axes-scene.tsx` | `principal-axes` | principal-axes |
| `euler-angles-scene.tsx` | `euler-angles` | euler-angles |
| `equatorial-bulge-scene.tsx` | `equatorial-bulge` | equatorial-bulge |
| `lagrangian-scene.tsx` | `lagrangian` | lagrangian |
| `elliptic-integral-scene.tsx` | `elliptic-integral` | elliptic-integral |
| `nonlinear-dynamics-scene.tsx` | `nonlinear-dynamics` | nonlinear-dynamics |

---

## Cleanup: orphan keys in glossary JSON

Present in `messages/{en,he,ru}/glossary.json` but no longer in source — safe to delete:

- [ ] `kinematic-equations`
- [ ] `acceleration`
- [ ] `free-fall`
- [ ] `derivative`
- [ ] `velocity`

---

## Upload workflow

1. Drop AVIFs into a local folder, named `{slug}.avif`.
2. Upload to Supabase `images` bucket under `physicists/` or `dictionary/`.
3. For physicists, add `image: storageUrl("physicists/{slug}.avif")` to the entry in `lib/content/physicists.ts`.
4. For dictionary, replace or add `images: [{ src: storageUrl("dictionary/{slug}.avif") }]` in `lib/content/glossary.ts`.
5. Animations: same path convention, `.webp` or `.mp4` extension — confirm `components/content/` renderer supports the format before committing.
