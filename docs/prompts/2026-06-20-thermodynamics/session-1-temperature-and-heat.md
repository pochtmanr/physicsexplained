# Session 1 — Module 1 · Temperature & Heat (4 topics)

You are content session **s1-temperature** of a 9-session parallel sprint
finishing the Thermodynamics branch (§04) of physicsexplained.

**First:** read `docs/prompts/2026-06-20-thermodynamics/SHARED.md` in
`/Users/roman/Developer/physics` and follow its workspace setup with
`SESSION-ID = s1-temperature`. All rules there apply. Your raw material is the
Module 1 FIG entries (FIG.01–04) in `docs/roadmap/03-thermodynamics.md` — read
them in full; the hooks, 7-section outlines, scene purposes, and physicist bios
below are condensed from there.

Module slug: `temperature-and-heat`. Eyebrow on all four topics:
`FIG.0N · TEMPERATURE & HEAT`.

---

## Your topics (eyebrows/titles/subtitles verbatim in `lib/content/branches.ts`)

### 1. `what-is-temperature` — FIG.01

The physics of hot and cold *before* we knew what heat was. Galileo's 1592
thermoscope; the sensation problem (a metal rail feels colder than wood at the
same temperature); Fahrenheit (1714, sealed mercury), Celsius (1742, originally
inverted), Kelvin (1848, true zero); thermal equilibrium as the *definition* of
temperature; the zeroth law (A≡B, B≡C ⟹ A≡C — logically prior, numbered last);
temperature as *intensity* of thermal motion, not *amount* (a spark is hotter
than a bathtub but carries less energy). 7 sections per the roadmap.

- **Physics lib:** `lib/physics/thermodynamics/thermometry.ts` — scale
  conversions (°C/°F/K), and Newton's-law-of-cooling exponential approach to a
  shared equilibrium temperature.
- **Scenes (2):**
  - (a) `thermoscope-scene.tsx` — Galileo's inverted glass bulb over a dish;
    ambient-temperature slider; rising T expands the gas and pushes the water
    column down; three-scale readout (°C/°F/K).
  - (b) `thermal-equilibrium-scene.tsx` — two blocks, user-set initial
    temperatures; bring them into contact and watch both exponentially approach a
    common value; insulation toggle.

### 2. `heat-and-the-caloric-theory` — FIG.02

Heat is energy, the conceptual pivot of the branch. Count Rumford boring Bavarian
cannons (1798) — friction makes heat without limit, so heat is no conserved
fluid; Davy melting ice by friction in a vacuum below freezing; Joule's
paddle-wheel (1843–45) measuring 4.186 J/cal in a Manchester brewery; heat as an
*amount* (joules) vs temperature as an *intensity* (kelvin). 7 sections.

- **Physics lib:** `lib/physics/thermodynamics/mechanical-equivalent.ts` —
  work-in → heat-out, the Joule constant, the falling-weight → ΔT relation
  mgh = mcΔT.
- **Scenes (2):**
  - (a) `rumford-cannon-scene.tsx` — a rotating drill in a brass cylinder in
    water; crank-speed slider; water T rises linearly with *work input*, no
    asymptote.
  - (b) `joule-paddle-scene.tsx` — falling-weight paddle apparatus; drop the
    mass, the paddle stirs, a thermometer ticks up by mgh/(mC); readout compares
    work-in vs heat-out and shows they match.

### 3. `heat-capacity-and-calorimetry` — FIG.03

Black, Glasgow, 1760s: equal heat into equal masses of water and mercury leaves
the mercury ~30× hotter. Specific heat (water 4.186 J/g·K, lead 0.13); molar heat
capacity and Dulong–Petit (~3R per mole, preview of equipartition FIG.17);
C_v vs C_p (differ by R for an ideal gas); the method of mixtures; why liquid
water's huge specific heat comes from hydrogen bonds. 7 sections.

- **Physics lib:** `lib/physics/thermodynamics/calorimetry.ts` — specific/molar
  heat tables, method-of-mixtures equilibrium solver (m_s c_s ΔT_s = m_w c_w ΔT_w),
  C_v vs C_p for an ideal gas.
- **Scenes (3):**
  - (a) `specific-heat-bar-scene.tsx` — bar chart of specific heats for ~8
    substances; hover for the value and a real-world consequence.
  - (b) `calorimeter-mixture-scene.tsx` — drag a hot metal block into an
    insulated cup of water; sliders for block mass, initial T, metal (selects c);
    the temperature curves meet at the equilibrium T.
  - (c) `cv-cp-piston-scene.tsx` — two cylinders of the same gas: sealed
    (fixed V) vs free piston (constant P); add equal Q to both; the sealed one
    warms more, the open one warms less but its piston rises.

### 4. `phase-changes-and-latent-heat` — FIG.04

Black again: ice melts for half an hour while the thermometer holds at 0 °C — the
heat is *latent*. Three phases; latent heat of fusion (water 334 kJ/kg) and
vaporisation (2260 kJ/kg — why sweat cools and steam burns); P–T phase diagrams,
triple point and critical point (stubs here; deep dives in FIG.22–23);
Clausius–Clapeyron first look (ice's negative slope is why you can skate);
supercooling/superheating and nucleation. 7 sections.

- **Physics lib:** `lib/physics/thermodynamics/phase-change.ts` — the
  T-vs-Q heating curve for H₂O (five regions, two plateaus), latent-heat
  bookkeeping, and a minimal P–T phase-boundary model. (Session 7 will extend
  this for Clausius–Clapeyron — keep it clean and reusable.)
- **Scenes (3):**
  - (a) `heating-curve-scene.tsx` — T vs Q for 1 kg of H₂O from ice at −20 °C;
    five regions, two visibly flat plateaus; an animated dot advances as Q grows.
  - (b) `phase-diagram-scene.tsx` — P–T plot with solid/liquid/vapour regions;
    drag a marker to morph phase; toggle water vs CO₂ to show the negative vs
    positive solid–liquid slope.
  - (c) `supercooling-scene.tsx` — water cooled below 0 °C; click to drop a
    nucleation seed; the whole volume crystallises in a moment and T jumps back
    to 0 °C as latent heat is released.

---

## Reference ownership (you CREATE these; others only reference)

### Physicists (append to `lib/content/physicists.ts` + seed `thermo-module-1.json`)

`daniel-fahrenheit` (1686–1736, Dutch-German), `anders-celsius` (1701–1744,
Swedish), `lord-kelvin` (1824–1907, British — William Thomson), `count-rumford`
(1753–1814, American-British — Benjamin Thompson), `humphry-davy` (1778–1829,
British), `joseph-black` (1728–1799, Scottish), `pierre-louis-dulong` (1785–1838,
French), `alexis-petit` (1791–1820, French), `benoit-clapeyron` (1799–1864,
French).

Already exist (reference freely, do NOT recreate): `galileo-galilei`,
`james-prescott-joule`.

### Dictionary terms (append to `lib/content/glossary.ts` + seed `thermo-module-1.json`)

`temperature`, `thermometer`, `thermal-equilibrium`,
`zeroth-law-of-thermodynamics`, `kelvin-scale`, `absolute-zero` (stub here —
you own the entry; FIG.27/29 in session 8/9 deepen the prose), `heat`,
`caloric-theory`, `mechanical-equivalent-of-heat`, `joule` (unit), `calorie`
(unit), `specific-heat-capacity`, `molar-heat-capacity`, `calorimetry`,
`dulong-petit-law`, `cv-cp`, `phase`, `phase-transition`, `latent-heat`,
`latent-heat-of-fusion`, `latent-heat-of-vaporisation`, `triple-point` (you own
it; session 7 upgrades), `critical-point` (you own it; session 7 upgrades).

Owned by other sessions (reference but do NOT create): `entropy` (s3),
`heat-engine` (s3). Already in `glossary.ts` (reuse): `pressure`.

---

Work through the topics in order — they are the front door to the whole branch,
so the thermoscope and heating-curve scenes set the visual tone for everything
that follows. Good luck.
