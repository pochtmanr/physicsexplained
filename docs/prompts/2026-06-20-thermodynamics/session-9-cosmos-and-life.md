# Session 9 — Module 8 · Applications & the Third Law, part 2: cosmos & life (3 topics)

You are content session **s9-cosmos** of a 9-session parallel sprint finishing the
Thermodynamics branch (§04) of physicsexplained.

**First:** read `docs/prompts/2026-06-20-thermodynamics/SHARED.md` in
`/Users/roman/Developer/physics` and follow its workspace setup with
`SESSION-ID = s9-cosmos`. All rules there apply. Raw material: FIG.28–30 in
`docs/roadmap/03-thermodynamics.md` (the second half of Module 8 — the
big-picture finish of the whole branch).

Module slug: `applications-and-the-third-law` (shared with session 8). Eyebrow on
all three topics: `FIG.NN · APPLICATIONS`. You own FIG.28–30 and their references;
session 8 owns FIG.25–27. Append your shared-file blocks under banner
`// ─── Module 8b applications (thermo sprint 2026-06-20)`.

---

## Your topics (eyebrows/titles/subtitles verbatim in `lib/content/branches.ts`)

### 1. `bose-einstein-condensation` — FIG.28

Bose (Dhaka, 1924) derives Planck's formula by a new counting rule; Einstein
extends it to atoms and predicts a macroscopic quantum state; Cornell and Wieman
see it in rubidium at 170 nK in 1995 (Nobel 2001). Bose statistics (bosons share
states; n̄ = 1/(exp(βε) − 1)); the Bose–Einstein vs Fermi–Dirac distributions; the
condensation (a macroscopic fraction in the ground state below T_c); the T_c
formula (k_BT_c = (2πħ²/m)(n/ζ(3/2))^{2/3}); superfluid helium (⁴He below 2.17 K,
London 1938; ³He 1971); Cornell/Wieman/Ketterle 1995. 7 sections.

- **Physics lib:** `lib/physics/thermodynamics/bose-einstein.ts` — extends
  `distributions.ts` (session 5) with Bose–Einstein and Fermi–Dirac occupation,
  the BEC critical temperature, and the condensate fraction below T_c.
- **Scenes (3):**
  - (a) `bose-statistics-scene.tsx` — four bosons over three levels (all
    configurations allowed, including all-four-in-ground) beside Fermi–Dirac
    (at most one per level).
  - (b) `bec-transition-scene.tsx` — cooling a dilute Bose gas; a sharp v = 0
    peak emerges atop the thermal cloud below T_c, matching the 1995 images.
  - (c) `superfluid-scene.tsx` — liquid helium climbing the beaker wall (the
    Rollin film) against gravity; click for a rotation experiment (the superfluid
    stays at rest while the bucket spins).

### 2. `thermodynamics-of-the-universe` — FIG.29

Clausius (1865): "*Die Entropie der Welt strebt einem Maximum zu*" — the entropy
of the universe tends to a maximum; Kelvin's 1852 heat death, sharpened by modern
cosmology. The heat death (all gradients vanish, no engine runs); the expanding-
universe objection (the max-entropy state isn't fixed); black-hole entropy
(Bekenstein 1972, Hawking 1974; S = k_B A/4ℓ_P², the largest entropy sinks); Hawking
radiation (T_H = ħc³/8πGMk_B, colder than the CMB for stellar masses); the long-term
timeline (10¹⁴ yr star formation ends, 10¹⁰⁰ yr last black holes evaporate);
Poincaré recurrence reconsidered. 7 sections. Give Clausius's German once, then
translate.

- **Physics lib:** `lib/physics/thermodynamics/cosmological-entropy.ts` — Hawking
  temperature and black-hole lifetime vs mass, and a radiation/matter/black-hole
  entropy budget over cosmic time.
- **Scenes (2):**
  - (a) `cosmological-entropy-scene.tsx` — a Big-Bang-to-heat-death timeline
    (log x-axis) plotting radiation, matter, and black-hole entropy (dominant)
    and the total.
  - (b) `hawking-temperature-scene.tsx` — a black-hole mass slider; live T_H and
    lifetime τ (primordial 10¹² kg evaporating now; stellar-mass T_H ~ 10⁻⁸ K,
    τ ~ 10⁶⁷ yr).

### 3. `thermodynamics-meets-life` — FIG.30

Schrödinger's *What is Life?* (Dublin, 1944) asks how an organism resists the
second law: by feeding on negative entropy. Living systems are open (far from
equilibrium, maintained by flux); Schrödinger's negentropy (import order, export
disorder; the sun supplies low-entropy photons, Earth radiates high-entropy
infrared); metabolic power (human ~100 W to blue whale ~60 kW, all from a 5800 K →
300 K cascade); the efficiency of life (muscle ~25%, photosynthesis ~5%);
Prigogine's dissipative structures (1977 Nobel); information and the Landauer
bound in biology (E. coli runs within ~10× the theoretical minimum); the coda
tying the two laws together. 7 sections. Give Schrödinger's "drinks orderliness"
phrasing once.

- **Physics lib:** `lib/physics/thermodynamics/life-entropy.ts` — the
  sun→Earth→space radiation-entropy balance and a log-scale metabolic-power /
  efficiency ladder.
- **Scenes (2):**
  - (a) `sun-earth-thermodynamics-scene.tsx` — a 3-body radiation diagram (Sun
    5800 K → Earth 288 K → space 2.7 K); photon counts and entropy flows labelled;
    life slips in between absorbed low-entropy light and emitted high-entropy IR.
  - (b) `metabolic-ladder-scene.tsx` — a log-scale power bar chart (fusion 10²⁶ W
    → photosynthesis ~10¹³ W → animal metabolism 10³–10⁵ W → ATP synthase ~10⁻¹⁷ W),
    each marked with its efficiency.

---

## Reference ownership (you CREATE these; others only reference)

### Physicists (append to `lib/content/physicists.ts` + seed `thermo-module-8b.json`)

`satyendra-nath-bose` (1894–1974, Indian), `fritz-london` (1900–1954,
German-American), `wolfgang-ketterle` (1957–**—**, German — **living, `died: "—"`**),
`eric-cornell` (1961–**—**, American — **living, `died: "—"`**), `carl-wieman`
(1951–**—**, American — **living, `died: "—"`**), `erwin-schrodinger` (1887–1961,
Austrian — cameo here, full profile in the Quantum branch), `ilya-prigogine`
(1917–2003, Russian-Belgian), `harold-morowitz` (1927–2016, American).

Already exist (reference freely, do NOT recreate): `albert-einstein`,
`rudolf-clausius` (s3), `lord-kelvin` (s1), `jacob-bekenstein`, `stephen-hawking`.

### Dictionary terms (append to `lib/content/glossary.ts` + seed `thermo-module-8b.json`)

`bose-statistics`, `fermi-dirac-statistics` (stub here — you own it; full in the
Quantum branch), `bose-einstein-condensate`, `superfluid`,
`indistinguishable-particles`, `negentropy`, `dissipative-structure`,
`open-system`, `metabolic-rate`, `landauer-bound` (cross-reference to
`landauer-principle`, which session 6 owns — do not recreate that one).

**Upgrade-not-create:** `heat-death` already exists as a stub owned by session 3
(FIG.10). Reference it and write the fuller FIG.29 prose in the essay; do NOT
create a new entry. The glossary terms `hawking-radiation` and
`bekenstein-hawking-entropy` **already exist** (from the relativity branch) — link
them; do NOT create `black-hole-entropy`.

Owned by session 8 (reference but do NOT create): `cryogenics`, `laser-cooling`,
`third-law-of-thermodynamics`.

---

You close out the entire branch. The final section of FIG.30 should land the two
laws — energy conservation and entropy growth — as the throughline of all eight
modules. Make it count. Good luck.
