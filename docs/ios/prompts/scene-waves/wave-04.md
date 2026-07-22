# Wave 04 — Thermodynamics (`temperature-and-heat` → `statistical-mechanics`)

Run with `wave-template.md`. **Scope: the entire *live* thermodynamics branch —
Modules 1–6 (FIG.01–21), from `what-is-temperature` through
`fluctuations-and-dissipation`.** Modules 7 (`phase-transitions`) and 8
(`applications-and-the-third-law`) are `status: "coming-soon"` in
`lib/content/branches.ts` — no essays, no scenes — so they are out of scope until
that content ships.

**50 scenes across 21 articles, all Canvas-2D — zero JSXGraph** (verified: no
scene imports `jsxgraph`/`mathjs`), so nothing is deferred to the native
`PlotView` (playbook §10). **None are ported yet** — thermodynamics is a fresh
branch with no entries in the P4 curated catalog and no `PXMath/Thermodynamics/`
module, so all 50 are this wave's work and the registry grows 62 → 112.

This is a whole branch — larger than one session — so it executes in **six
module-sized chunks** (one per curriculum module, 6–11 scenes each), exactly as
waves 01–03 ran in chunks. Each chunk owns its own registration file
`SceneRegistry+SceneWave04<Module>.swift` (e.g. `…Wave04TemperatureAndHeat.swift`)
with entry point `registerSceneWave04<Module>()`, so concurrent chunks never edit
the same file — and `SceneRegistry+Wave04.swift` is avoided (a future P4 catalog
batch could claim it, the collision waves 01/02 already hit).

## Curriculum order & chunking

Order is the `branches.ts` topic sequence (`THERMODYNAMICS_TOPICS`), grouped by
`module`. One chunk per module:

| # | chunk (module) | articles | scenes |
|---|---|---|---|
| 1 | Temperature & Heat (`temperature-and-heat`) | 4 | 10 |
| 2 | The First Law (`first-law`) | 3 | 8 |
| 3 | The Second Law (`second-law`) | 3 | 8 |
| 4 | Entropy & the Arrow of Time (`entropy-and-time`) | 3 | 7 |
| 5 | Kinetic Theory of Gases (`kinetic-theory`) | 5 | 11 |
| 6 | Statistical Mechanics (`statistical-mechanics`) | 3 | 6 |

## Math deps

Port each chunk's `lib/physics/thermodynamics/` modules to
`PXMath/Thermodynamics/` first (playbook §6), with `npx tsx` goldens, before its
scenes. Each manifest entry lists its `mathDeps`; a module already in `PXMath`
(check `ios/PhysicsPackages/Sources/PXMath/Thermodynamics/` first) is not
re-ported. Four modules already ship a web test file — port those assertions to
`Tests/PXMathTests/` verbatim (same cases, 1e-9): `thermometry.test.ts`,
`calorimetry.test.ts`, `mechanical-equivalent.test.ts`, `phase-change.test.ts`.

**Shared modules that land with the first chunk that needs them** (check `PXMath`
first, port once, reuse — mirrors how `constants.ts` was handled in wave 03):

- **`random.ts`** — a *seeded* PRNG, used by 11 scenes across chunks **4, 5, 6**
  (all the particle/coin/demon/Brownian scenes). ⚠️ **This is the wave's one
  structural gotcha.** SwiftUI cannot call `Math.random()` from a `TimelineView`
  body, and the web scenes reseed for reproducibility, so port the seeded
  generator faithfully and drive particle buffers from it via `@State` stepped in
  `.onChange(of: timeline.date)` (playbook §3 "State refs", §5). Lands with
  chunk 4.
- **`distributions.ts`** — shared by chunks **5, 6** (Maxwell–Boltzmann and
  partition-function scenes). Lands with chunk 5.
- **`calorimetry.ts`** — shared by chunks **1, 2** (`PvDiagramScene` in chunk 2
  reuses it). Lands with chunk 1.
- **`pv-plot.ts`** / **`processes.ts`** — both shared within chunk 2.
- **`maxwell-boltzmann.ts`**, **`partition-function.ts`** — shared within their
  chunks (5, 6).

## Manifest

Every entry is to port (`ported: true` appears nowhere — the branch is
untouched). `sourcePath` is relative to `/Users/roman/Developer/physics/`;
`targetPath` to `ios/PhysicsPackages/Sources/`. `sceneId` is the web export name,
which is also the `SIMULATION_REGISTRY` key (verified against
`lib/content/simulation-registry.ts`).

### Chunk 1 — Temperature & Heat (`temperature-and-heat`)

```json
[
  {"sceneId": "ThermalEquilibriumScene", "topic": "what-is-temperature", "sourcePath": "components/physics/what-is-temperature/thermal-equilibrium-scene.tsx", "targetPath": "PXScenes/Scenes/thermodynamics/ThermalEquilibriumScene.swift", "mathDeps": ["lib/physics/thermodynamics/thermometry.ts"]},
  {"sceneId": "ThermoscopeScene", "topic": "what-is-temperature", "sourcePath": "components/physics/what-is-temperature/thermoscope-scene.tsx", "targetPath": "PXScenes/Scenes/thermodynamics/ThermoscopeScene.swift", "mathDeps": ["lib/physics/thermodynamics/thermometry.ts"]},
  {"sceneId": "JoulePaddleScene", "topic": "heat-and-the-caloric-theory", "sourcePath": "components/physics/heat-and-the-caloric-theory/joule-paddle-scene.tsx", "targetPath": "PXScenes/Scenes/thermodynamics/JoulePaddleScene.swift", "mathDeps": ["lib/physics/thermodynamics/mechanical-equivalent.ts"]},
  {"sceneId": "RumfordCannonScene", "topic": "heat-and-the-caloric-theory", "sourcePath": "components/physics/heat-and-the-caloric-theory/rumford-cannon-scene.tsx", "targetPath": "PXScenes/Scenes/thermodynamics/RumfordCannonScene.swift", "mathDeps": ["lib/physics/thermodynamics/mechanical-equivalent.ts"]},
  {"sceneId": "CalorimeterMixtureScene", "topic": "heat-capacity-and-calorimetry", "sourcePath": "components/physics/heat-capacity-and-calorimetry/calorimeter-mixture-scene.tsx", "targetPath": "PXScenes/Scenes/thermodynamics/CalorimeterMixtureScene.swift", "mathDeps": ["lib/physics/thermodynamics/calorimetry.ts", "lib/physics/thermodynamics/thermometry.ts"]},
  {"sceneId": "CvCpPistonScene", "topic": "heat-capacity-and-calorimetry", "sourcePath": "components/physics/heat-capacity-and-calorimetry/cv-cp-piston-scene.tsx", "targetPath": "PXScenes/Scenes/thermodynamics/CvCpPistonScene.swift", "mathDeps": ["lib/physics/thermodynamics/calorimetry.ts"]},
  {"sceneId": "SpecificHeatBarScene", "topic": "heat-capacity-and-calorimetry", "sourcePath": "components/physics/heat-capacity-and-calorimetry/specific-heat-bar-scene.tsx", "targetPath": "PXScenes/Scenes/thermodynamics/SpecificHeatBarScene.swift", "mathDeps": ["lib/physics/thermodynamics/calorimetry.ts"]},
  {"sceneId": "HeatingCurveScene", "topic": "phase-changes-and-latent-heat", "sourcePath": "components/physics/phase-changes-and-latent-heat/heating-curve-scene.tsx", "targetPath": "PXScenes/Scenes/thermodynamics/HeatingCurveScene.swift", "mathDeps": ["lib/physics/thermodynamics/phase-change.ts"]},
  {"sceneId": "PhaseDiagramScene", "topic": "phase-changes-and-latent-heat", "sourcePath": "components/physics/phase-changes-and-latent-heat/phase-diagram-scene.tsx", "targetPath": "PXScenes/Scenes/thermodynamics/PhaseDiagramScene.swift", "mathDeps": ["lib/physics/thermodynamics/phase-change.ts"]},
  {"sceneId": "SupercoolingScene", "topic": "phase-changes-and-latent-heat", "sourcePath": "components/physics/phase-changes-and-latent-heat/supercooling-scene.tsx", "targetPath": "PXScenes/Scenes/thermodynamics/SupercoolingScene.swift", "mathDeps": []}
]
```

### Chunk 2 — The First Law (`first-law`)

```json
[
  {"sceneId": "FirstLawAccountingScene", "topic": "internal-energy-and-the-first-law", "sourcePath": "components/physics/internal-energy-and-the-first-law/first-law-accounting-scene.tsx", "targetPath": "PXScenes/Scenes/thermodynamics/FirstLawAccountingScene.swift", "mathDeps": ["lib/physics/thermodynamics/first-law.ts"]},
  {"sceneId": "ThreeDiscoveriesTimelineScene", "topic": "internal-energy-and-the-first-law", "sourcePath": "components/physics/internal-energy-and-the-first-law/three-discoveries-timeline-scene.tsx", "targetPath": "PXScenes/Scenes/thermodynamics/ThreeDiscoveriesTimelineScene.swift", "mathDeps": []},
  {"sceneId": "CycleWorkScene", "topic": "work-and-pv-diagrams", "sourcePath": "components/physics/work-and-pv-diagrams/cycle-work-scene.tsx", "targetPath": "PXScenes/Scenes/thermodynamics/CycleWorkScene.swift", "mathDeps": ["lib/physics/thermodynamics/pv-plot.ts"]},
  {"sceneId": "PvDiagramScene", "topic": "work-and-pv-diagrams", "sourcePath": "components/physics/work-and-pv-diagrams/pv-diagram-scene.tsx", "targetPath": "PXScenes/Scenes/thermodynamics/PvDiagramScene.swift", "mathDeps": ["lib/physics/thermodynamics/pv-plot.ts", "lib/physics/thermodynamics/calorimetry.ts"]},
  {"sceneId": "ReversibleVsIrreversibleScene", "topic": "work-and-pv-diagrams", "sourcePath": "components/physics/work-and-pv-diagrams/reversible-vs-irreversible-scene.tsx", "targetPath": "PXScenes/Scenes/thermodynamics/ReversibleVsIrreversibleScene.swift", "mathDeps": ["lib/physics/thermodynamics/pv-plot.ts"]},
  {"sceneId": "BicyclePumpScene", "topic": "isothermal-and-adiabatic-processes", "sourcePath": "components/physics/isothermal-and-adiabatic-processes/bicycle-pump-scene.tsx", "targetPath": "PXScenes/Scenes/thermodynamics/BicyclePumpScene.swift", "mathDeps": ["lib/physics/thermodynamics/processes.ts"]},
  {"sceneId": "CloudFormationScene", "topic": "isothermal-and-adiabatic-processes", "sourcePath": "components/physics/isothermal-and-adiabatic-processes/cloud-formation-scene.tsx", "targetPath": "PXScenes/Scenes/thermodynamics/CloudFormationScene.swift", "mathDeps": ["lib/physics/thermodynamics/processes.ts"]},
  {"sceneId": "IsothermalVsAdiabaticScene", "topic": "isothermal-and-adiabatic-processes", "sourcePath": "components/physics/isothermal-and-adiabatic-processes/isothermal-vs-adiabatic-scene.tsx", "targetPath": "PXScenes/Scenes/thermodynamics/IsothermalVsAdiabaticScene.swift", "mathDeps": ["lib/physics/thermodynamics/pv-plot.ts", "lib/physics/thermodynamics/processes.ts"]}
]
```

### Chunk 3 — The Second Law (`second-law`)

```json
[
  {"sceneId": "CarnotCycleScene", "topic": "heat-engines-and-carnot", "sourcePath": "components/physics/heat-engines-and-carnot/carnot-cycle-scene.tsx", "targetPath": "PXScenes/Scenes/thermodynamics/CarnotCycleScene.swift", "mathDeps": ["lib/physics/thermodynamics/carnot.ts"]},
  {"sceneId": "EngineEfficiencyBarsScene", "topic": "heat-engines-and-carnot", "sourcePath": "components/physics/heat-engines-and-carnot/engine-efficiency-bars-scene.tsx", "targetPath": "PXScenes/Scenes/thermodynamics/EngineEfficiencyBarsScene.swift", "mathDeps": ["lib/physics/thermodynamics/carnot.ts"]},
  {"sceneId": "TsDiagramScene", "topic": "heat-engines-and-carnot", "sourcePath": "components/physics/heat-engines-and-carnot/ts-diagram-scene.tsx", "targetPath": "PXScenes/Scenes/thermodynamics/TsDiagramScene.swift", "mathDeps": ["lib/physics/thermodynamics/carnot.ts"]},
  {"sceneId": "ClausiusVsKelvinScene", "topic": "the-second-law", "sourcePath": "components/physics/the-second-law/clausius-vs-kelvin-scene.tsx", "targetPath": "PXScenes/Scenes/thermodynamics/ClausiusVsKelvinScene.swift", "mathDeps": ["lib/physics/thermodynamics/second-law.ts"]},
  {"sceneId": "PerpetualMotionScene", "topic": "the-second-law", "sourcePath": "components/physics/the-second-law/perpetual-motion-scene.tsx", "targetPath": "PXScenes/Scenes/thermodynamics/PerpetualMotionScene.swift", "mathDeps": ["lib/physics/thermodynamics/second-law.ts"]},
  {"sceneId": "EntropyMixingScene", "topic": "entropy-and-the-clausius-inequality", "sourcePath": "components/physics/entropy-and-the-clausius-inequality/entropy-mixing-scene.tsx", "targetPath": "PXScenes/Scenes/thermodynamics/EntropyMixingScene.swift", "mathDeps": ["lib/physics/thermodynamics/entropy.ts"]},
  {"sceneId": "ReversibleVsIrreversibleDsScene", "topic": "entropy-and-the-clausius-inequality", "sourcePath": "components/physics/entropy-and-the-clausius-inequality/reversible-vs-irreversible-ds-scene.tsx", "targetPath": "PXScenes/Scenes/thermodynamics/ReversibleVsIrreversibleDsScene.swift", "mathDeps": ["lib/physics/thermodynamics/entropy.ts"]},
  {"sceneId": "TsDiagramReduxScene", "topic": "entropy-and-the-clausius-inequality", "sourcePath": "components/physics/entropy-and-the-clausius-inequality/ts-diagram-redux-scene.tsx", "targetPath": "PXScenes/Scenes/thermodynamics/TsDiagramReduxScene.swift", "mathDeps": []}
]
```

### Chunk 4 — Entropy & the Arrow of Time (`entropy-and-time`)

> ⚠️ Port `random.ts` (the seeded PRNG) to `PXMath/Thermodynamics/` first — see
> **Math deps**. Every animated scene in this chunk drives particles from it.

```json
[
  {"sceneId": "CoinMultiplicityScene", "topic": "microstates-and-macrostates", "sourcePath": "components/physics/microstates-and-macrostates/coin-multiplicity-scene.tsx", "targetPath": "PXScenes/Scenes/thermodynamics/CoinMultiplicityScene.swift", "mathDeps": ["lib/physics/thermodynamics/random.ts", "lib/physics/thermodynamics/multiplicity.ts"]},
  {"sceneId": "TwoBoxGasScene", "topic": "microstates-and-macrostates", "sourcePath": "components/physics/microstates-and-macrostates/two-box-gas-scene.tsx", "targetPath": "PXScenes/Scenes/thermodynamics/TwoBoxGasScene.swift", "mathDeps": ["lib/physics/thermodynamics/random.ts"]},
  {"sceneId": "BoltzmannTombstoneScene", "topic": "boltzmanns-entropy-formula", "sourcePath": "components/physics/boltzmanns-entropy-formula/boltzmann-tombstone-scene.tsx", "targetPath": "PXScenes/Scenes/thermodynamics/BoltzmannTombstoneScene.swift", "mathDeps": []},
  {"sceneId": "MultiplicityToEntropyScene", "topic": "boltzmanns-entropy-formula", "sourcePath": "components/physics/boltzmanns-entropy-formula/multiplicity-to-entropy-scene.tsx", "targetPath": "PXScenes/Scenes/thermodynamics/MultiplicityToEntropyScene.swift", "mathDeps": ["lib/physics/thermodynamics/random.ts", "lib/physics/thermodynamics/boltzmann-entropy.ts"]},
  {"sceneId": "LoschmidtReversalScene", "topic": "the-arrow-of-time", "sourcePath": "components/physics/the-arrow-of-time/loschmidt-reversal-scene.tsx", "targetPath": "PXScenes/Scenes/thermodynamics/LoschmidtReversalScene.swift", "mathDeps": ["lib/physics/thermodynamics/random.ts", "lib/physics/thermodynamics/irreversibility.ts"]},
  {"sceneId": "MaxwellsDemonScene", "topic": "the-arrow-of-time", "sourcePath": "components/physics/the-arrow-of-time/maxwells-demon-scene.tsx", "targetPath": "PXScenes/Scenes/thermodynamics/MaxwellsDemonScene.swift", "mathDeps": ["lib/physics/thermodynamics/random.ts", "lib/physics/thermodynamics/irreversibility.ts"]},
  {"sceneId": "ReversibleMoviesScene", "topic": "the-arrow-of-time", "sourcePath": "components/physics/the-arrow-of-time/reversible-movies-scene.tsx", "targetPath": "PXScenes/Scenes/thermodynamics/ReversibleMoviesScene.swift", "mathDeps": ["lib/physics/thermodynamics/random.ts"]}
]
```

### Chunk 5 — Kinetic Theory of Gases (`kinetic-theory`)

```json
[
  {"sceneId": "GasLawsTripleScene", "topic": "the-ideal-gas-law", "sourcePath": "components/physics/the-ideal-gas-law/gas-laws-triple-scene.tsx", "targetPath": "PXScenes/Scenes/thermodynamics/GasLawsTripleScene.swift", "mathDeps": ["lib/physics/thermodynamics/ideal-gas.ts"]},
  {"sceneId": "IdealVsRealGasScene", "topic": "the-ideal-gas-law", "sourcePath": "components/physics/the-ideal-gas-law/ideal-vs-real-gas-scene.tsx", "targetPath": "PXScenes/Scenes/thermodynamics/IdealVsRealGasScene.swift", "mathDeps": ["lib/physics/thermodynamics/ideal-gas.ts"]},
  {"sceneId": "MolecularPressureScene", "topic": "pressure-from-molecular-collisions", "sourcePath": "components/physics/pressure-from-molecular-collisions/molecular-pressure-scene.tsx", "targetPath": "PXScenes/Scenes/thermodynamics/MolecularPressureScene.swift", "mathDeps": ["lib/physics/thermodynamics/random.ts"]},
  {"sceneId": "RmsSpeedScene", "topic": "pressure-from-molecular-collisions", "sourcePath": "components/physics/pressure-from-molecular-collisions/rms-speed-scene.tsx", "targetPath": "PXScenes/Scenes/thermodynamics/RmsSpeedScene.swift", "mathDeps": ["lib/physics/thermodynamics/random.ts", "lib/physics/thermodynamics/kinetic-pressure.ts"]},
  {"sceneId": "BoltzmannFactorScene", "topic": "the-maxwell-boltzmann-distribution", "sourcePath": "components/physics/the-maxwell-boltzmann-distribution/boltzmann-factor-scene.tsx", "targetPath": "PXScenes/Scenes/thermodynamics/BoltzmannFactorScene.swift", "mathDeps": ["lib/physics/thermodynamics/distributions.ts"]},
  {"sceneId": "MaxwellBoltzmannScene", "topic": "the-maxwell-boltzmann-distribution", "sourcePath": "components/physics/the-maxwell-boltzmann-distribution/maxwell-boltzmann-scene.tsx", "targetPath": "PXScenes/Scenes/thermodynamics/MaxwellBoltzmannScene.swift", "mathDeps": ["lib/physics/thermodynamics/distributions.ts", "lib/physics/thermodynamics/maxwell-boltzmann.ts"]},
  {"sceneId": "SternExperimentScene", "topic": "the-maxwell-boltzmann-distribution", "sourcePath": "components/physics/the-maxwell-boltzmann-distribution/stern-experiment-scene.tsx", "targetPath": "PXScenes/Scenes/thermodynamics/SternExperimentScene.swift", "mathDeps": ["lib/physics/thermodynamics/distributions.ts", "lib/physics/thermodynamics/maxwell-boltzmann.ts", "lib/physics/thermodynamics/random.ts"]},
  {"sceneId": "DegreesOfFreedomScene", "topic": "equipartition-and-degrees-of-freedom", "sourcePath": "components/physics/equipartition-and-degrees-of-freedom/degrees-of-freedom-scene.tsx", "targetPath": "PXScenes/Scenes/thermodynamics/DegreesOfFreedomScene.swift", "mathDeps": ["lib/physics/thermodynamics/equipartition.ts"]},
  {"sceneId": "EquipartitionFailureScene", "topic": "equipartition-and-degrees-of-freedom", "sourcePath": "components/physics/equipartition-and-degrees-of-freedom/equipartition-failure-scene.tsx", "targetPath": "PXScenes/Scenes/thermodynamics/EquipartitionFailureScene.swift", "mathDeps": ["lib/physics/thermodynamics/equipartition.ts"]},
  {"sceneId": "BrownianWalkScene", "topic": "brownian-motion", "sourcePath": "components/physics/brownian-motion/brownian-walk-scene.tsx", "targetPath": "PXScenes/Scenes/thermodynamics/BrownianWalkScene.swift", "mathDeps": ["lib/physics/thermodynamics/random.ts", "lib/physics/thermodynamics/brownian.ts"]},
  {"sceneId": "PerrinCountingScene", "topic": "brownian-motion", "sourcePath": "components/physics/brownian-motion/perrin-counting-scene.tsx", "targetPath": "PXScenes/Scenes/thermodynamics/PerrinCountingScene.swift", "mathDeps": ["lib/physics/thermodynamics/random.ts", "lib/physics/thermodynamics/brownian.ts"]}
]
```

### Chunk 6 — Statistical Mechanics (`statistical-mechanics`)

```json
[
  {"sceneId": "PartitionToThermoScene", "topic": "the-partition-function", "sourcePath": "components/physics/the-partition-function/partition-to-thermo-scene.tsx", "targetPath": "PXScenes/Scenes/thermodynamics/PartitionToThermoScene.swift", "mathDeps": ["lib/physics/thermodynamics/distributions.ts", "lib/physics/thermodynamics/partition-function.ts"]},
  {"sceneId": "TwoLevelSystemScene", "topic": "the-partition-function", "sourcePath": "components/physics/the-partition-function/two-level-system-scene.tsx", "targetPath": "PXScenes/Scenes/thermodynamics/TwoLevelSystemScene.swift", "mathDeps": ["lib/physics/thermodynamics/distributions.ts", "lib/physics/thermodynamics/partition-function.ts"]},
  {"sceneId": "FourFreeEnergiesScene", "topic": "free-energies-and-maxwells-demon", "sourcePath": "components/physics/free-energies-and-maxwells-demon/four-free-energies-scene.tsx", "targetPath": "PXScenes/Scenes/thermodynamics/FourFreeEnergiesScene.swift", "mathDeps": ["lib/physics/thermodynamics/free-energy.ts"]},
  {"sceneId": "SzilardEngineScene", "topic": "free-energies-and-maxwells-demon", "sourcePath": "components/physics/free-energies-and-maxwells-demon/szilard-engine-scene.tsx", "targetPath": "PXScenes/Scenes/thermodynamics/SzilardEngineScene.swift", "mathDeps": ["lib/physics/thermodynamics/free-energy.ts"]},
  {"sceneId": "FluctuationScalingScene", "topic": "fluctuations-and-dissipation", "sourcePath": "components/physics/fluctuations-and-dissipation/fluctuation-scaling-scene.tsx", "targetPath": "PXScenes/Scenes/thermodynamics/FluctuationScalingScene.swift", "mathDeps": ["lib/physics/thermodynamics/fluctuations.ts"]},
  {"sceneId": "JohnsonNyquistScene", "topic": "fluctuations-and-dissipation", "sourcePath": "components/physics/fluctuations-and-dissipation/johnson-nyquist-scene.tsx", "targetPath": "PXScenes/Scenes/thermodynamics/JohnsonNyquistScene.swift", "mathDeps": ["lib/physics/thermodynamics/fluctuations.ts"]}
]
```

## Checklist

Per chunk; check off as ported + registered.

### Chunk 1 — Temperature & Heat
- [x] ThermalEquilibriumScene
- [x] ThermoscopeScene
- [x] JoulePaddleScene
- [x] RumfordCannonScene
- [x] CalorimeterMixtureScene
- [x] CvCpPistonScene
- [x] SpecificHeatBarScene
- [x] HeatingCurveScene
- [x] PhaseDiagramScene
- [x] SupercoolingScene

### Chunk 2 — The First Law
- [x] FirstLawAccountingScene
- [x] ThreeDiscoveriesTimelineScene
- [x] CycleWorkScene
- [x] PvDiagramScene
- [x] ReversibleVsIrreversibleScene
- [x] BicyclePumpScene
- [x] CloudFormationScene
- [x] IsothermalVsAdiabaticScene

### Chunk 3 — The Second Law
- [x] CarnotCycleScene
- [x] EngineEfficiencyBarsScene
- [x] TsDiagramScene
- [x] ClausiusVsKelvinScene
- [x] PerpetualMotionScene
- [x] EntropyMixingScene
- [x] ReversibleVsIrreversibleDsScene
- [x] TsDiagramReduxScene

### Chunk 4 — Entropy & the Arrow of Time
- [x] CoinMultiplicityScene
- [x] TwoBoxGasScene
- [x] BoltzmannTombstoneScene
- [x] MultiplicityToEntropyScene
- [x] LoschmidtReversalScene
- [x] MaxwellsDemonScene
- [x] ReversibleMoviesScene

### Chunk 5 — Kinetic Theory of Gases
- [x] GasLawsTripleScene
- [x] IdealVsRealGasScene
- [x] MolecularPressureScene
- [x] RmsSpeedScene
- [x] BoltzmannFactorScene
- [x] MaxwellBoltzmannScene
- [x] SternExperimentScene
- [x] DegreesOfFreedomScene
- [x] EquipartitionFailureScene
- [x] BrownianWalkScene
- [x] PerrinCountingScene

### Chunk 6 — Statistical Mechanics
- [x] PartitionToThermoScene
- [x] TwoLevelSystemScene
- [x] FourFreeEnergiesScene
- [x] SzilardEngineScene
- [x] FluctuationScalingScene
- [x] JohnsonNyquistScene

## Notes
(append per-chunk divergence notes here)

### Chunk 1 — Temperature & Heat (done)
Math: `Thermometry`, `MechanicalEquivalent`, `Calorimetry` (shared → ch2), `PhaseChange`
ported to `PXMath/Thermodynamics/`; web `g_SI` → `Constants.gEarth`. 42 goldens
in `PXMathTests` port the four web `*.test.ts` assertions verbatim using the web's
own `toBeCloseTo(x,n)` tolerances (some cases are deliberately coarse, e.g. 24.94 @
n=2, 22 MPa @ n=−3; exact cases hold to ≤1e-9). `.toThrow()`/reject cases omitted —
a `precondition` trap isn't catchable in swift-testing (same precedent as
`ElectrostaticsTests`). Registry: `registerSceneWave04TemperatureAndHeat()`; coverage
guard 62→72. `swift build` + `swift test` (607) green.
Divergences beyond standard DPR/clearRect/bg-fill removal:
- Color blends (Thermoscope, ThermalEquilibrium, JoulePaddle, RumfordCannon,
  CvCpPiston, CalorimeterMixture): web hex `mix`/`blend`/`tempColor` reproduced by
  resolving token accents to `Color.Resolved` and lerping in sRGB (theme-adaptive,
  not baked hex); small private `lerpResolved` per file.
- Accent-bordered `<button>`s → house `.pxPrimary`/`.pxGhost` (§7); per-button border
  tints dropped; selected states use `.pxPrimary`.
- Anim state: web `useRef` accumulators → `@State` stepped in `.onChange(of:)` (or
  `SceneTicker` + `.id(run)` reset for drop-style scenes).
- Pointer/hover → gestures: SpecificHeatBar hover → press-drag `DragGesture` (lift
  clears); PhaseDiagram pointer-capture → `DragGesture` on measured canvas size.
- JoulePaddle bar track: web `hexToRgba` falls through on already-`rgba()` input, so
  the track draws at 0.85 alpha like its fill — replicated deliberately.
- Thermoscope: `paused: reduceMotion` on ripple ticker (accessibility parity; web
  doesn't gate it, harmless).

### Chunk 2 — The First Law (done)
Math: `FirstLaw`, `PvPlot` (shared in-chunk), `Processes` (shared in-chunk) ported to
`PXMath/Thermodynamics/`; `Calorimetry` reused as-is. All three had web `*.test.ts` —
ported verbatim to `FirstLawTests`/`PvPlotTests`/`ProcessesTests` at the web's
`toBeCloseTo` tolerances (no npx-tsx goldens needed); `.toThrow()` cases omitted.
`PvPlot.PvMapping.toPx/toData` return plain-Double `PvPixel`/`PvPoint` (keeps PXMath
free of CoreGraphics); scenes wrap in `CGPoint`. `Processes` re-exports
`Calorimetry.monatomic`/`.diatomic`. Registry: `registerSceneWave04FirstLaw()`;
coverage guard 72→80. `swift build` + `swift test` (639) green.
Divergences beyond standard removals:
- All: `hexToRgba`→`.opacity`; accent-bordered buttons → `.pxPrimary`/`.pxGhost`
  (border tints dropped); below-canvas readouts moved into `SceneControls` footer.
- ThreeDiscoveriesTimeline: `onPointerDown` nearest-pin → zero-distance `DragGesture`
  on measured canvas; `shadowBlur=12` → `.shadow` filter r=12 on copied context.
- CycleWork: rAF `progress += dt·0.25 %1` → `SceneTicker(rate:0.25)` mod 1.
- PvDiagram: pointer-capture drag → `DragGesture` on measured canvas → `mapping.toData`.
- ReversibleVsIrreversible: rAF fast 2.5/s, slow 0.32/s (clamped) derived from
  `timeline.date − releaseDate`, ticker paused until release (cf. ch1 Supercooling).
- BicyclePump: integrated barrel temp → `@State` stepped in `.onChange(of:)`,
  `dt=min(0.05,…)`; rates verbatim; no pause control (web animates continuously).
- IsothermalVsAdiabatic: web hardcoded `8.314462618` in P₁ → `PvPlot.rGas` (identical).
- PV-tick pressure labels `.bottomTrailing`, centered axis/HUD labels `.bottom`
  (alphabetic-baseline, §3 ±2 pt) — consistent with ch1 PhaseDiagram.

### Chunk 3 — The Second Law (done)
Math: `Carnot`, `SecondLaw`, `Entropy` ported to `PXMath/Thermodynamics/`. No web
`*.test.ts` exist for these three — goldens captured via `npx tsx` and asserted to
1e-9 where exact (`CarnotTests` 7, `SecondLawTests` 5, `EntropyTests` 8 = 20 new).
`.throw` cases omitted. `Carnot.rGas`/`Entropy.rGas` each declare the gas constant
locally, mirroring the deliberately self-contained web modules (not consolidated to
`Constants`). Registry: `registerSceneWave04SecondLaw()`; coverage guard 80→88.
`swift build` + `swift test` (659) green.
Divergences beyond standard removals:
- Interdependent slider clamps (`max(tCold+30,…)`/`min(tHot−30,…)`) preserved via
  clamping `Binding`s (Carnot, TsDiagram, ClausiusVsKelvin, PerpetualMotion,
  ReversibleVsIrreversibleDs).
- CarnotCycle: rAF `(phase+dt·0.18)%1` → `SceneTicker(rate:0.18)` mod 1; play/pause.
- EngineEfficiencyBars: hover → press-drag `DragGesture` (cf. ch1 SpecificHeatBar).
- PerpetualMotion: deep slider `.disabled(!coldOn)`; web stale-`textAlign` quirk
  (W/Q_out inherit box-title centering) reproduced with `.bottom` anchors.
- EntropyMixing: `useRef` particles → `@State` stepped in `.onChange(of:)`,
  `dt=min(0.05,…)`; initial spawn uses `Double.random` once (chunk has NO `random.ts`
  dep / no reproducibility requirement), step deterministic.
- TsDiagramRedux: no math dep — self-contained cycle-path helpers as private statics.

### Chunk 4 — Entropy & the Arrow of Time (done)
Math: `Random` (SHARED seeded PRNG → ch5/6), `Multiplicity`, `BoltzmannEntropy`,
`Irreversibility` ported to `PXMath/Thermodynamics/`. `Random` is mulberry32 as a
value-type `Random.Rng` (`init(seed:)`, `mutating next()`) with free helpers taking
`inout Rng` — bit-identical to the web `createRng`; `Random.createRng(seed:)`/
`.mulberry32(seed:)` construct it, `.randomRange`/`.uniform`/`.gaussian`/`.shuffled`/
`.maxwellVelocity2D` mirror the web. **`RandomTests` ports `tests/physics/thermo-random.test.ts`
verbatim — PRNG parity proven.** 38 new goldens; `.throw` cases omitted.
Registry: `registerSceneWave04EntropyAndTime()`; coverage guard 88→95.
`swift build` + `swift test` (697) green.
Scenes reseed identically to the web (reset button / N change → fresh `Rng`); particle
buffers are `@State` stepped in `.onChange(of: timeline.date)`, never sampled inside
the `TimelineView` closure.
⚠️ **Recovery note**: the chunk-4 agent died mid-stream (API stall) after the 4 math
modules, their tests, and 6 of 7 scenes. Coordinator completed it: wrote
`ReversibleMoviesScene` (seeds `0x71b0_11a5` billiards / `0x5a7e_7e12` shards in the web's
exact rng draw order), created the registry file, and fixed a real bug in the agent's
`MaxwellsDemonScene` — a `for`-loop over `gas` sat directly in the `body` ViewBuilder
(illegal); extracted to a `chamberTemperatures()` helper.
Divergences beyond standard removals:
- All particle scenes: web `useRef` buffers + rAF → `@State` + `.onChange(of:)`,
  `dt=min(0.05,…)`; reseed on control change matches web bit-for-bit.
- ReversibleMovies: `TimelineView(.animation(paused: !playing))` gates frame work while
  paused; play/reverse buttons → `.pxGhost`/`.pxPrimary`; verdict labels `.bottom`
  (alphabetic baseline, §3 ±2 pt).
- MaxwellsDemon: `account for memory` / `Reset` buttons → `.pxPrimary`/`.pxGhost`.

### Chunk 5 — Kinetic Theory of Gases (done)
Math: `IdealGas`, `KineticPressure`, `Distributions` (SHARED → ch6), `MaxwellBoltzmann`,
`Equipartition`, `Brownian` ported to `PXMath/Thermodynamics/`; `Random` reused. All six
had web `*.test.ts` — ported verbatim at web `toBeCloseTo` tolerances (no npx-tsx needed);
`.throw` cases omitted. Brownian goldens rely on `Random` mulberry32 parity (same draw
order velocity/vx/vy/vz). Registry: `registerSceneWave04KineticTheory()`; coverage guard
95→106. `swift build` + `swift test` (744) green.
`Distributions` shape (ch6 reuses): `enum Distributions { static let kB=1.380649e-23;
gaussian(x:mu:sigma:) [PDF]; maxwellBoltzmannSpeed(v:t:m:); boltzmannFactor(e:t:) }` — note
`Distributions.gaussian` is the PDF, distinct from `Random.gaussian` the sampler.
Divergences beyond standard removals:
- Gas/species/case chips (IdealVsRealGas, RmsSpeed, MaxwellBoltzmann, DegreesOfFreedom):
  accent-bordered `<button>` chips → `.pxPrimary` (selected)/`.pxGhost`.
- MolecularPressure: web pixel-box geometry via `GeometryReader`; sim reseeds on
  size/N/T change from a persistent `Random.Rng`.
- RmsSpeed: web `useMemo` 6000-draw sample → `@State` recomputed in `.onChange`, same
  seed 424242 + draw order.
- Animated (MolecularPressure/Stern/BrownianWalk/Perrin): `useRef`+rAF → `@State` stepped
  in `.onChange(of: timeline.date)`; BrownianWalk advances one kick/frame (rAF-equiv).
- BoltzmannFactor: `toExponential(1)` → Swift `%.1e` (platform exponent width, same value).

### Chunk 6 — Statistical Mechanics (done)
Math: `PartitionFunction`, `FreeEnergy`, `Fluctuations` ported to `PXMath/Thermodynamics/`;
`Distributions.kB` reused. All three had web `*.test.ts` — ported verbatim at web
`toBeCloseTo` tolerances (`PartitionFunctionTests` 14, `FreeEnergyTests` 12,
`FluctuationsTests` 11 = 37 new); no `precondition` needed (web modules throw nothing).
Module consts kept local (`PartitionFunction.hBar`/`.hPlanck`, `FreeEnergy.ln2`);
`POTENTIALS`→`FreeEnergy.potentials` ([Potential], `natural` a `(String,String)` tuple);
`gibbsSpontaneity` returns `Int` (−1/0/1). Registry:
`registerSceneWave04StatisticalMechanics()`; coverage guard 106→112. `swift build` +
`swift test` (781) green.
Divergences beyond standard removals:
- All: `hexToRgba`→`.opacity`; chips/buttons → `.pxPrimary`/`.pxGhost`; readouts → footer.
- PartitionToThermo/TwoLevelSystem: model chips/preset links → house buttons; axis/rung
  labels use `.bottomTrailing`/alphabetic anchors (§3 ±2 pt).
- FourFreeEnergies: canvas `onClick` → zero-distance `DragGesture` on measured canvas
  (cf. ch2 ThreeDiscoveries).
- SzilardEngine: `useRef` SimState + rAF → `@State` stepped in `.onChange(of:)`,
  `dt=min(0.05,…)`; `TimelineView(paused: !running)`; settle re-bounce uses `Double.random`
  (no seeded-PRNG dep — matches web `Math.random`, no reproducibility requirement).
- FluctuationScaling/JohnsonNyquist: `useRef` ring buffer + rAF → `@State` buffer/acc
  stepped in `.onChange(of:)`; crude Gaussian (Σ6 uniforms − 3) via `Double.random`;
  buffers NOT reset on control change (matches web — new σ/V_rms applies going forward);
  JohnsonNyquist T slider cyan / R slider magenta (web accentColors).

---

## Wave 04 — COMPLETE ✅
All 6 chunks landed. 50 scenes ported (registry 62→112), 23 new `PXMath/Thermodynamics/`
modules, 216 new tests (565→781). `swift build` + `swift test` (781 in 103 suites) green;
coverage guard = 112. Compile-only per environment (no iOS Simulator) — **visual verification
(Gallery deep link `physicsexplained://gallery/scene/<id>`, light+dark, vs
`scene_catalog.snapshot_url`) handed off to the user per playbook §9.2 DoD #3–6.**
