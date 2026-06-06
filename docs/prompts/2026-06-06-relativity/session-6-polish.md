# Session 6 — Polish pass on the 38 existing relativity topics

You are content session **s6-polish** of a 6-session parallel sprint finishing
the Relativity branch of physicsexplained. The other 5 sessions write NEW
topics (§09–§13); you bring the EXISTING 38 (§01–§08) to uniform professional
grade. You touch ONLY the topic slugs listed below — never the new modules.

**First:** read `docs/prompts/2026-06-06-relativity/SHARED.md` in
`/Users/roman/Developer/physics` and follow its workspace setup with
`SESSION-ID = s6-polish`. All rules apply, with these scope differences: you
flip no `status:` values, you own no new dictionary terms or physicists (your
aside links may only use existing registry entries — check
`lib/content/glossary.ts` / `lib/content/physicists.ts`), and you create no
seed file unless you find a referenced-but-missing term (then add it to
`content/seeds/s6-polish.json` and note it in your summary).

## Workstream A — 7 topics with ZERO interactive scenes (add 3 each)

These shipped as text-only essays. Each needs 3 scenes added, following
`components/physics/_shared/README.md` exactly. **The physics helpers already
exist** in `lib/physics/relativity/` — reuse them; extend only if needed.
Weave the scenes into the existing essay inside `<SceneCard caption="FIG.NNx —
…">` blocks at didactically right points (after the concept is introduced),
keeping existing prose intact except where a short lead-in sentence helps.

1. **`einsteins-elevator`** (FIG.26, helper: `elevator.ts`)
   (a) sealed-lab comparison — free-falling elevator vs deep-space float,
   identical ball-drop physics side by side; (b) accelerating rocket vs
   standing on Earth — the other half of equivalence; (c) the tidal limit —
   widen the elevator until two dropped balls visibly converge (where
   equivalence ends).
2. **`gps-as-relativity`** (FIG.23, helper: `gps-corrections.ts`)
   (a) the two-correction ledger — SR −7 μs/day vs GR +45 μs/day, net +38,
   animated daily accumulation; (b) position-error growth — uncorrected GPS
   drifts ~10 km/day on a map view; (c) orbit altitude explorer — both
   corrections vs altitude, the crossover where they cancel (~3,200 km).
3. **`gravitational-redshift`** (FIG.27, helper: `gravitational-redshift.ts`)
   (a) climbing photon — wavelength stretching out of a potential well, well
   depth slider; (b) Pound–Rebka — the 22.5 m Harvard tower, 2.5×10⁻¹⁵ shift,
   Mössbauer trick explained visually; (c) clock tower — identical clocks at
   different heights drift apart in real time (GPS tie-in).
4. **`inertial-vs-gravitational-mass`** (FIG.25, helper: `equivalence-mass.ts`)
   (a) the two definitions — same object, F=ma sled vs weighing scale,
   conceptually different numbers agreeing; (b) Eötvös torsion balance — what
   a violation would look like vs the null result; (c) the precision ladder —
   Galileo 10⁻³ → Eötvös 10⁻⁸ → MICROSCOPE 10⁻¹⁵, log timeline.
5. **`light-cones-and-causality`** (FIG.13, helper: `light-cone.ts`; also see
   `components/physics/_shared/SpacetimeDiagramCanvas.tsx` — reuse it)
   (a) interactive light cone — drag an event, past/future/elsewhere regions
   classify other events live; (b) causal-order invariance — boost slider
   shows timelike-separated order is absolute, spacelike order flips;
   (c) cone-chains — a signal hopping cone-to-cone can never exit, FTL would
   break a cone.
6. **`mass-energy-equivalence`** (FIG.17, helper: `mass-energy.ts`)
   (a) the exchange rate — slider from milligrams to kilotons, c² as the
   conversion factor, everyday anchors (hot coffee, fission, the sun's
   4 Mt/s); (b) binding-energy mass defect — assemble helium from nucleons,
   the missing 0.7%; (c) annihilation event — e⁺e⁻ → two 511 keV photons,
   four-momentum conserved on screen.
7. **`precision-tests-of-sr`** (FIG.24, helper: `precision-tests.ts`)
   (a) muon survival — count muons surviving the stratosphere descent with
   and without time dilation, γ slider; (b) the modern Michelson–Morley —
   optical-resonator anisotropy bounds at 10⁻¹⁸, polar plot; (c) the test
   ladder — Lorentz-invariance bounds by experiment type over a century,
   log scale.

Also extend each of these essays where they fall short of the 6-section /
~110–150-line standard (most are 89–110 lines): typically one more section of
applications/implications + a stronger cross-linked closing. Match each
essay's existing voice.

## Workstream B — 6 missing OG images

These topics lack `opengraph-image.tsx`. Copy the 15-line template from
`app/[locale]/(topics)/relativity/einsteins-field-equations/opengraph-image.tsx`,
changing only the slug:
`christoffels-and-parallel-transport`, `manifolds-and-tangent-spaces`,
`tensors-on-curved-space`, `the-metric-tensor`, `the-riemann-tensor`,
`the-stress-energy-tensor`.

## Workstream C — 4 borderline-short essays (101–109 lines)

`bells-spaceship-paradox`, `compton-scattering`, `geodesics`,
`michelson-morley` — each has its 3 scenes already. Extend the prose to the
standard: read the essay, find the weakest seam (usually a missing
"where this shows up" section or an under-explained derivation step), add
1–2 sections, strengthen cross-links to sibling topics including the NEW
§09–§13 slugs (they will exist after integration — link freely:
e.g. geodesics → `/relativity/the-schwarzschild-metric`, michelson-morley →
`/relativity/precision-tests-of-sr`).

## Verify & commit

Per topic: `DOTENV_CONFIG_PATH=.env.local pnpm content:publish --only
relativity/<slug>` (required — the page renders from the DB), `npx tsc
--noEmit`, smoke-test the page in `pnpm dev`, check both themes, then commit
(`feat(relativity/<slug>): polish — scenes/og/prose`). Workstream B can be a
single commit. Full `pnpm test` before your final summary.
