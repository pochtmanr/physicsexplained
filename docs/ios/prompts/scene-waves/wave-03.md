# Wave 03 — Electromagnetism (`the-electric-field` → `classical-limit-of-qed`)

Run with `wave-template.md`. **Scope: the electromagnetism module from article 2
(`the-electric-field`) through the last (`classical-limit-of-qed`) — every EM lesson
except article 1 (`coulombs-law`), per direction ("the first is done").**

**195 scenes across 65 articles** (three per article), **all Canvas-2D — zero
JSXGraph**, so nothing is deferred to the native `PlotView` (playbook §10). Five are
already shipping from the P4-4 curated catalog (`FieldLinesPointScene`,
`FieldLinesDipoleScene`, `GaussianSurfacesScene`, `EquipotentialLinesScene`,
`ParallelPlateCapacitorScene`); the remaining **190** are this wave's work.

This is the whole module — far larger than one session — so it executes in **twelve
module-sized chunks** (one per curriculum module, ~12–30 scenes each), exactly as
wave 01 ran in chunks. Each chunk owns its own registration file
`SceneRegistry+SceneWave03<Module>.swift` (e.g. `…Wave03Electrostatics.swift`) with
entry point `registerSceneWave03<Module>()`, so concurrent chunks never edit the same
file — and `SceneRegistry+Wave03.swift` is avoided (a future P4 catalog batch could
claim it, the collision wave 01/02 already hit).

> ⚠️ **Article-1 caveat.** `coulombs-law` (article 1) is excluded per the "first is
> done" direction, but its three scenes — `TwoChargeForceScene`, `DipoleFieldScene`,
> `ChargeSuperpositionScene` — have **no native port** today (they are not among the
> five P4-4 catalog scenes, which are drawn from articles 2–5). If "done" meant the
> electric-field cluster generally rather than article 1 specifically, fold these
> three into chunk 1. Flagged, not assumed.

## Curriculum order & chunking

Order is the `branches.ts` lesson sequence, grouped by `module`. Suggested one chunk
per module:

| # | chunk (module) | articles | scenes | to port |
|---|---|---|---|---|
| 1 | Electrostatics (`electrostatics`) | 6 | 18 | 13 |
| 2 | Fields in matter (`fields-in-matter`) | 4 | 12 | 12 |
| 3 | Magnetostatics (`magnetostatics`) | 5 | 15 | 15 |
| 4 | Magnetism in matter (`magnetism-in-matter`) | 4 | 12 | 12 |
| 5 | Induction (`induction`) | 5 | 15 | 15 |
| 6 | Circuits (`circuits`) | 7 | 21 | 21 |
| 7 | Maxwell's synthesis (`maxwell`) | 5 | 15 | 15 |
| 8 | EM waves in vacuum (`em-waves-vacuum`) | 4 | 12 | 12 |
| 9 | Waves in matter & optics (`waves-in-matter-optics`) | 10 | 30 | 30 |
| 10 | Radiation (`radiation`) | 6 | 18 | 18 |
| 11 | EM & relativity (`em-relativity`) | 5 | 15 | 15 |
| 12 | Foundations (`foundations`) | 4 | 12 | 12 |

## Math deps

Port each chunk's `lib/physics` modules to `PXMath/Electromagnetism/` first (playbook
§6), with `npx tsx` goldens, before its scenes. `lib/physics/constants.ts` (shared by
~15 scenes) and the electrostatics modules should land in chunk 1. Each manifest entry
lists its `mathDeps`; a module already in `PXMath` (check first) is not re-ported.

## Manifest

`ported: true` marks the five already-registered scenes — do not re-port or re-register
them (they resolve via `registerWave02()`, the P4-4 EM catalog file). Every other entry
is to port. `sourcePath` is relative to `/Users/roman/Developer/physics/`; `targetPath`
to `ios/PhysicsPackages/Sources/`.

### Chunk 1 — Electrostatics (`electrostatics`)

```json
[
  {"sceneId": "FieldLinesPointScene", "topic": "the-electric-field", "sourcePath": "components/physics/field-lines-point-scene.tsx", "targetPath": "PXScenes/Scenes/electromagnetism/FieldLinesPointScene.swift", "mathDeps": [], "ported": true},
  {"sceneId": "FieldLinesDipoleScene", "topic": "the-electric-field", "sourcePath": "components/physics/field-lines-dipole-scene.tsx", "targetPath": "PXScenes/Scenes/electromagnetism/FieldLinesDipoleScene.swift", "mathDeps": ["lib/physics/electric-field.ts"], "ported": true},
  {"sceneId": "FieldLinesParallelPlatesScene", "topic": "the-electric-field", "sourcePath": "components/physics/field-lines-parallel-plates-scene.tsx", "targetPath": "PXScenes/Scenes/electromagnetism/FieldLinesParallelPlatesScene.swift", "mathDeps": ["lib/physics/electric-field.ts"]},
  {"sceneId": "GaussianSurfacesScene", "topic": "gauss-law", "sourcePath": "components/physics/gaussian-surfaces-scene.tsx", "targetPath": "PXScenes/Scenes/electromagnetism/GaussianSurfacesScene.swift", "mathDeps": ["lib/physics/gauss.ts"], "ported": true},
  {"sceneId": "GaussSymmetryScene", "topic": "gauss-law", "sourcePath": "components/physics/gauss-symmetry-scene.tsx", "targetPath": "PXScenes/Scenes/electromagnetism/GaussSymmetryScene.swift", "mathDeps": []},
  {"sceneId": "FluxThroughSurfaceScene", "topic": "gauss-law", "sourcePath": "components/physics/flux-through-surface-scene.tsx", "targetPath": "PXScenes/Scenes/electromagnetism/FluxThroughSurfaceScene.swift", "mathDeps": []},
  {"sceneId": "PotentialSurfaceScene", "topic": "electric-potential", "sourcePath": "components/physics/potential-surface-scene.tsx", "targetPath": "PXScenes/Scenes/electromagnetism/PotentialSurfaceScene.swift", "mathDeps": ["lib/physics/electric-potential.ts"]},
  {"sceneId": "EquipotentialLinesScene", "topic": "electric-potential", "sourcePath": "components/physics/equipotential-lines-scene.tsx", "targetPath": "PXScenes/Scenes/electromagnetism/EquipotentialLinesScene.swift", "mathDeps": ["lib/physics/electric-field.ts", "lib/physics/electric-potential.ts"], "ported": true},
  {"sceneId": "VoltageRampScene", "topic": "electric-potential", "sourcePath": "components/physics/voltage-ramp-scene.tsx", "targetPath": "PXScenes/Scenes/electromagnetism/VoltageRampScene.swift", "mathDeps": ["lib/physics/electric-potential.ts"]},
  {"sceneId": "ParallelPlateCapacitorScene", "topic": "capacitance-and-field-energy", "sourcePath": "components/physics/parallel-plate-capacitor-scene.tsx", "targetPath": "PXScenes/Scenes/electromagnetism/ParallelPlateCapacitorScene.swift", "mathDeps": ["lib/physics/capacitance.ts"], "ported": true},
  {"sceneId": "CapacitorChargingScene", "topic": "capacitance-and-field-energy", "sourcePath": "components/physics/capacitor-charging-scene.tsx", "targetPath": "PXScenes/Scenes/electromagnetism/CapacitorChargingScene.swift", "mathDeps": []},
  {"sceneId": "EnergyDensityScene", "topic": "capacitance-and-field-energy", "sourcePath": "components/physics/energy-density-scene.tsx", "targetPath": "PXScenes/Scenes/electromagnetism/EnergyDensityScene.swift", "mathDeps": ["lib/physics/capacitance.ts"]},
  {"sceneId": "FaradayCageScene", "topic": "conductors-and-shielding", "sourcePath": "components/physics/faraday-cage-scene.tsx", "targetPath": "PXScenes/Scenes/electromagnetism/FaradayCageScene.swift", "mathDeps": []},
  {"sceneId": "ConductorChargeDistributionScene", "topic": "conductors-and-shielding", "sourcePath": "components/physics/conductor-charge-distribution-scene.tsx", "targetPath": "PXScenes/Scenes/electromagnetism/ConductorChargeDistributionScene.swift", "mathDeps": []},
  {"sceneId": "LightningShelterScene", "topic": "conductors-and-shielding", "sourcePath": "components/physics/lightning-shelter-scene.tsx", "targetPath": "PXScenes/Scenes/electromagnetism/LightningShelterScene.swift", "mathDeps": []},
  {"sceneId": "ImageChargePlaneScene", "topic": "method-of-images", "sourcePath": "components/physics/image-charge-plane-scene.tsx", "targetPath": "PXScenes/Scenes/electromagnetism/ImageChargePlaneScene.swift", "mathDeps": ["lib/physics/electric-field.ts", "lib/physics/method-of-images.ts"]},
  {"sceneId": "ImageChargeSphereScene", "topic": "method-of-images", "sourcePath": "components/physics/image-charge-sphere-scene.tsx", "targetPath": "PXScenes/Scenes/electromagnetism/ImageChargeSphereScene.swift", "mathDeps": ["lib/physics/method-of-images.ts"]},
  {"sceneId": "InducedChargeScene", "topic": "method-of-images", "sourcePath": "components/physics/induced-charge-scene.tsx", "targetPath": "PXScenes/Scenes/electromagnetism/InducedChargeScene.swift", "mathDeps": []}
]
```

### Chunk 2 — Fields in matter (`fields-in-matter`)

```json
[
  {"sceneId": "DipoleAlignmentScene", "topic": "polarization-and-bound-charges", "sourcePath": "components/physics/dipole-alignment-scene.tsx", "targetPath": "PXScenes/Scenes/electromagnetism/DipoleAlignmentScene.swift", "mathDeps": ["lib/physics/electromagnetism/polarization.ts"]},
  {"sceneId": "BoundChargeDensityScene", "topic": "polarization-and-bound-charges", "sourcePath": "components/physics/bound-charge-density-scene.tsx", "targetPath": "PXScenes/Scenes/electromagnetism/BoundChargeDensityScene.swift", "mathDeps": ["lib/physics/electromagnetism/polarization.ts"]},
  {"sceneId": "PolarizationVsFieldScene", "topic": "polarization-and-bound-charges", "sourcePath": "components/physics/polarization-vs-field-scene.tsx", "targetPath": "PXScenes/Scenes/electromagnetism/PolarizationVsFieldScene.swift", "mathDeps": ["lib/physics/electromagnetism/polarization.ts"]},
  {"sceneId": "DFieldFreeChargeScene", "topic": "dielectrics-and-the-d-field", "sourcePath": "components/physics/d-field-free-charge-scene.tsx", "targetPath": "PXScenes/Scenes/electromagnetism/DFieldFreeChargeScene.swift", "mathDeps": []},
  {"sceneId": "DielectricCapacitorScene", "topic": "dielectrics-and-the-d-field", "sourcePath": "components/physics/dielectric-capacitor-scene.tsx", "targetPath": "PXScenes/Scenes/electromagnetism/DielectricCapacitorScene.swift", "mathDeps": ["lib/physics/capacitance.ts", "lib/physics/electromagnetism/dielectrics.ts"]},
  {"sceneId": "DVsEDifferenceScene", "topic": "dielectrics-and-the-d-field", "sourcePath": "components/physics/d-vs-e-difference-scene.tsx", "targetPath": "PXScenes/Scenes/electromagnetism/DVsEDifferenceScene.swift", "mathDeps": []},
  {"sceneId": "BoundaryEFieldScene", "topic": "boundary-conditions-at-interfaces", "sourcePath": "components/physics/boundary-e-field-scene.tsx", "targetPath": "PXScenes/Scenes/electromagnetism/BoundaryEFieldScene.swift", "mathDeps": ["lib/physics/electromagnetism/boundary-conditions.ts"]},
  {"sceneId": "BoundaryDFieldScene", "topic": "boundary-conditions-at-interfaces", "sourcePath": "components/physics/boundary-d-field-scene.tsx", "targetPath": "PXScenes/Scenes/electromagnetism/BoundaryDFieldScene.swift", "mathDeps": []},
  {"sceneId": "DielectricRefractionScene", "topic": "boundary-conditions-at-interfaces", "sourcePath": "components/physics/dielectric-refraction-scene.tsx", "targetPath": "PXScenes/Scenes/electromagnetism/DielectricRefractionScene.swift", "mathDeps": ["lib/physics/electromagnetism/boundary-conditions.ts"]},
  {"sceneId": "PiezoCrystalScene", "topic": "piezo-and-ferroelectricity", "sourcePath": "components/physics/piezo-crystal-scene.tsx", "targetPath": "PXScenes/Scenes/electromagnetism/PiezoCrystalScene.swift", "mathDeps": ["lib/physics/electromagnetism/piezo.ts"]},
  {"sceneId": "FerroelectricHysteresisScene", "topic": "piezo-and-ferroelectricity", "sourcePath": "components/physics/ferroelectric-hysteresis-scene.tsx", "targetPath": "PXScenes/Scenes/electromagnetism/FerroelectricHysteresisScene.swift", "mathDeps": ["lib/physics/electromagnetism/piezo.ts"]},
  {"sceneId": "DomainSwitchingScene", "topic": "piezo-and-ferroelectricity", "sourcePath": "components/physics/domain-switching-scene.tsx", "targetPath": "PXScenes/Scenes/electromagnetism/DomainSwitchingScene.swift", "mathDeps": []}
]
```

### Chunk 3 — Magnetostatics (`magnetostatics`)

```json
[
  {"sceneId": "LorentzTrajectoryScene", "topic": "the-lorentz-force", "sourcePath": "components/physics/lorentz-trajectory-scene.tsx", "targetPath": "PXScenes/Scenes/electromagnetism/LorentzTrajectoryScene.swift", "mathDeps": ["lib/physics/electromagnetism/lorentz.ts"]},
  {"sceneId": "CyclotronScene", "topic": "the-lorentz-force", "sourcePath": "components/physics/cyclotron-scene.tsx", "targetPath": "PXScenes/Scenes/electromagnetism/CyclotronScene.swift", "mathDeps": ["lib/physics/electromagnetism/lorentz.ts"]},
  {"sceneId": "VelocitySelectorScene", "topic": "the-lorentz-force", "sourcePath": "components/physics/velocity-selector-scene.tsx", "targetPath": "PXScenes/Scenes/electromagnetism/VelocitySelectorScene.swift", "mathDeps": ["lib/physics/electromagnetism/lorentz.ts"]},
  {"sceneId": "WireSegmentFieldScene", "topic": "biot-savart-law", "sourcePath": "components/physics/wire-segment-field-scene.tsx", "targetPath": "PXScenes/Scenes/electromagnetism/WireSegmentFieldScene.swift", "mathDeps": ["lib/physics/electromagnetism/biot-savart.ts"]},
  {"sceneId": "StraightWireFieldScene", "topic": "biot-savart-law", "sourcePath": "components/physics/straight-wire-field-scene.tsx", "targetPath": "PXScenes/Scenes/electromagnetism/StraightWireFieldScene.swift", "mathDeps": ["lib/physics/electromagnetism/biot-savart.ts"]},
  {"sceneId": "LoopFieldScene", "topic": "biot-savart-law", "sourcePath": "components/physics/loop-field-scene.tsx", "targetPath": "PXScenes/Scenes/electromagnetism/LoopFieldScene.swift", "mathDeps": ["lib/physics/electromagnetism/biot-savart.ts"]},
  {"sceneId": "AmpereLoopWireScene", "topic": "amperes-law", "sourcePath": "components/physics/ampere-loop-wire-scene.tsx", "targetPath": "PXScenes/Scenes/electromagnetism/AmpereLoopWireScene.swift", "mathDeps": ["lib/physics/constants.ts"]},
  {"sceneId": "SolenoidFieldScene", "topic": "amperes-law", "sourcePath": "components/physics/solenoid-field-scene.tsx", "targetPath": "PXScenes/Scenes/electromagnetism/SolenoidFieldScene.swift", "mathDeps": ["lib/physics/electromagnetism/ampere.ts"]},
  {"sceneId": "ToroidFieldScene", "topic": "amperes-law", "sourcePath": "components/physics/toroid-field-scene.tsx", "targetPath": "PXScenes/Scenes/electromagnetism/ToroidFieldScene.swift", "mathDeps": ["lib/physics/electromagnetism/ampere.ts"]},
  {"sceneId": "VectorPotentialScene", "topic": "the-vector-potential", "sourcePath": "components/physics/vector-potential-scene.tsx", "targetPath": "PXScenes/Scenes/electromagnetism/VectorPotentialScene.swift", "mathDeps": ["lib/physics/electromagnetism/vector-potential.ts"]},
  {"sceneId": "GaugeFreedomScene", "topic": "the-vector-potential", "sourcePath": "components/physics/gauge-freedom-scene.tsx", "targetPath": "PXScenes/Scenes/electromagnetism/GaugeFreedomScene.swift", "mathDeps": ["lib/physics/electromagnetism/lorentz.ts", "lib/physics/electromagnetism/vector-potential.ts"]},
  {"sceneId": "ASourceCurrentScene", "topic": "the-vector-potential", "sourcePath": "components/physics/a-source-current-scene.tsx", "targetPath": "PXScenes/Scenes/electromagnetism/ASourceCurrentScene.swift", "mathDeps": ["lib/physics/electromagnetism/vector-potential.ts"]},
  {"sceneId": "DipoleTorqueScene", "topic": "magnetic-dipoles", "sourcePath": "components/physics/dipole-torque-scene.tsx", "targetPath": "PXScenes/Scenes/electromagnetism/DipoleTorqueScene.swift", "mathDeps": ["lib/physics/electromagnetism/magnetic-dipole.ts"]},
  {"sceneId": "CompassScene", "topic": "magnetic-dipoles", "sourcePath": "components/physics/compass-scene.tsx", "targetPath": "PXScenes/Scenes/electromagnetism/CompassScene.swift", "mathDeps": []},
  {"sceneId": "MagneticDipoleFieldScene", "topic": "magnetic-dipoles", "sourcePath": "components/physics/magnetic-dipole-field-scene.tsx", "targetPath": "PXScenes/Scenes/electromagnetism/MagneticDipoleFieldScene.swift", "mathDeps": ["lib/physics/electromagnetism/magnetic-dipole.ts"]}
]
```

### Chunk 4 — Magnetism in matter (`magnetism-in-matter`)

```json
[
  {"sceneId": "MagnetizationVectorsScene", "topic": "magnetization-and-the-h-field", "sourcePath": "components/physics/magnetization-vectors-scene.tsx", "targetPath": "PXScenes/Scenes/electromagnetism/MagnetizationVectorsScene.swift", "mathDeps": []},
  {"sceneId": "HVsBFieldScene", "topic": "magnetization-and-the-h-field", "sourcePath": "components/physics/h-vs-b-field-scene.tsx", "targetPath": "PXScenes/Scenes/electromagnetism/HVsBFieldScene.swift", "mathDeps": ["lib/physics/electromagnetism/magnetization.ts"]},
  {"sceneId": "ChiVsTemperatureScene", "topic": "magnetization-and-the-h-field", "sourcePath": "components/physics/chi-vs-temperature-scene.tsx", "targetPath": "PXScenes/Scenes/electromagnetism/ChiVsTemperatureScene.swift", "mathDeps": ["lib/physics/electromagnetism/magnetization.ts"]},
  {"sceneId": "OrbitalResponseScene", "topic": "dia-and-paramagnetism", "sourcePath": "components/physics/orbital-response-scene.tsx", "targetPath": "PXScenes/Scenes/electromagnetism/OrbitalResponseScene.swift", "mathDeps": []},
  {"sceneId": "ParamagnetAlignmentScene", "topic": "dia-and-paramagnetism", "sourcePath": "components/physics/paramagnet-alignment-scene.tsx", "targetPath": "PXScenes/Scenes/electromagnetism/ParamagnetAlignmentScene.swift", "mathDeps": ["lib/physics/electromagnetism/magnetic-materials.ts"]},
  {"sceneId": "SusceptibilitySpectrumScene", "topic": "dia-and-paramagnetism", "sourcePath": "components/physics/susceptibility-spectrum-scene.tsx", "targetPath": "PXScenes/Scenes/electromagnetism/SusceptibilitySpectrumScene.swift", "mathDeps": []},
  {"sceneId": "HysteresisDomainScene", "topic": "ferromagnetism-and-hysteresis", "sourcePath": "components/physics/hysteresis-domain-scene.tsx", "targetPath": "PXScenes/Scenes/electromagnetism/HysteresisDomainScene.swift", "mathDeps": ["lib/physics/electromagnetism/ferromagnetism.ts"]},
  {"sceneId": "CurieTransitionScene", "topic": "ferromagnetism-and-hysteresis", "sourcePath": "components/physics/curie-transition-scene.tsx", "targetPath": "PXScenes/Scenes/electromagnetism/CurieTransitionScene.swift", "mathDeps": ["lib/physics/electromagnetism/ferromagnetism.ts"]},
  {"sceneId": "DomainWallMotionScene", "topic": "ferromagnetism-and-hysteresis", "sourcePath": "components/physics/domain-wall-motion-scene.tsx", "targetPath": "PXScenes/Scenes/electromagnetism/DomainWallMotionScene.swift", "mathDeps": []},
  {"sceneId": "MeissnerExpulsionScene", "topic": "superconductivity-and-meissner", "sourcePath": "components/physics/meissner-expulsion-scene.tsx", "targetPath": "PXScenes/Scenes/electromagnetism/MeissnerExpulsionScene.swift", "mathDeps": ["lib/physics/electromagnetism/superconductivity.ts"]},
  {"sceneId": "LevitationScene", "topic": "superconductivity-and-meissner", "sourcePath": "components/physics/levitation-scene.tsx", "targetPath": "PXScenes/Scenes/electromagnetism/LevitationScene.swift", "mathDeps": []},
  {"sceneId": "CriticalTemperatureScene", "topic": "superconductivity-and-meissner", "sourcePath": "components/physics/critical-temperature-scene.tsx", "targetPath": "PXScenes/Scenes/electromagnetism/CriticalTemperatureScene.swift", "mathDeps": ["lib/physics/electromagnetism/superconductivity.ts"]}
]
```

### Chunk 5 — Induction (`induction`)

```json
[
  {"sceneId": "MagnetThroughCoilScene", "topic": "faradays-law", "sourcePath": "components/physics/magnet-through-coil-scene.tsx", "targetPath": "PXScenes/Scenes/electromagnetism/MagnetThroughCoilScene.swift", "mathDeps": []},
  {"sceneId": "FluxChangeAreaScene", "topic": "faradays-law", "sourcePath": "components/physics/flux-change-area-scene.tsx", "targetPath": "PXScenes/Scenes/electromagnetism/FluxChangeAreaScene.swift", "mathDeps": []},
  {"sceneId": "FaradayDiskScene", "topic": "faradays-law", "sourcePath": "components/physics/faraday-disk-scene.tsx", "targetPath": "PXScenes/Scenes/electromagnetism/FaradayDiskScene.swift", "mathDeps": ["lib/physics/electromagnetism/faradays-law.ts"]},
  {"sceneId": "LenzOppositionScene", "topic": "lenz-law-and-motional-emf", "sourcePath": "components/physics/lenz-opposition-scene.tsx", "targetPath": "PXScenes/Scenes/electromagnetism/LenzOppositionScene.swift", "mathDeps": []},
  {"sceneId": "SlidingRodEmfScene", "topic": "lenz-law-and-motional-emf", "sourcePath": "components/physics/sliding-rod-emf-scene.tsx", "targetPath": "PXScenes/Scenes/electromagnetism/SlidingRodEmfScene.swift", "mathDeps": ["lib/physics/electromagnetism/lenz-motional-emf.ts"]},
  {"sceneId": "JumpingRingScene", "topic": "lenz-law-and-motional-emf", "sourcePath": "components/physics/jumping-ring-scene.tsx", "targetPath": "PXScenes/Scenes/electromagnetism/JumpingRingScene.swift", "mathDeps": []},
  {"sceneId": "InductorCurrentBuildupScene", "topic": "self-and-mutual-inductance", "sourcePath": "components/physics/inductor-current-buildup-scene.tsx", "targetPath": "PXScenes/Scenes/electromagnetism/InductorCurrentBuildupScene.swift", "mathDeps": ["lib/physics/electromagnetism/inductance.ts"]},
  {"sceneId": "MutualInductionScene", "topic": "self-and-mutual-inductance", "sourcePath": "components/physics/mutual-induction-scene.tsx", "targetPath": "PXScenes/Scenes/electromagnetism/MutualInductionScene.swift", "mathDeps": ["lib/physics/electromagnetism/inductance.ts"]},
  {"sceneId": "RLTimeConstantScene", "topic": "self-and-mutual-inductance", "sourcePath": "components/physics/rl-time-constant-scene.tsx", "targetPath": "PXScenes/Scenes/electromagnetism/RLTimeConstantScene.swift", "mathDeps": ["lib/physics/electromagnetism/inductance.ts"]},
  {"sceneId": "InductorEnergyRampScene", "topic": "energy-in-magnetic-fields", "sourcePath": "components/physics/inductor-energy-ramp-scene.tsx", "targetPath": "PXScenes/Scenes/electromagnetism/InductorEnergyRampScene.swift", "mathDeps": ["lib/physics/electromagnetism/magnetic-energy.ts"]},
  {"sceneId": "MagneticEnergyDensityScene", "topic": "energy-in-magnetic-fields", "sourcePath": "components/physics/magnetic-energy-density-scene.tsx", "targetPath": "PXScenes/Scenes/electromagnetism/MagneticEnergyDensityScene.swift", "mathDeps": ["lib/physics/electromagnetism/magnetic-energy.ts"]},
  {"sceneId": "CapacitorVsInductorScene", "topic": "energy-in-magnetic-fields", "sourcePath": "components/physics/capacitor-vs-inductor-scene.tsx", "targetPath": "PXScenes/Scenes/electromagnetism/CapacitorVsInductorScene.swift", "mathDeps": ["lib/physics/capacitance.ts", "lib/physics/electromagnetism/magnetic-energy.ts"]},
  {"sceneId": "MagnetThroughTubeScene", "topic": "eddy-currents", "sourcePath": "components/physics/magnet-through-tube-scene.tsx", "targetPath": "PXScenes/Scenes/electromagnetism/MagnetThroughTubeScene.swift", "mathDeps": ["lib/physics/electromagnetism/eddy-currents.ts"]},
  {"sceneId": "InductionHeatingScene", "topic": "eddy-currents", "sourcePath": "components/physics/induction-heating-scene.tsx", "targetPath": "PXScenes/Scenes/electromagnetism/InductionHeatingScene.swift", "mathDeps": ["lib/physics/electromagnetism/eddy-currents.ts"]},
  {"sceneId": "MagneticBrakeScene", "topic": "eddy-currents", "sourcePath": "components/physics/magnetic-brake-scene.tsx", "targetPath": "PXScenes/Scenes/electromagnetism/MagneticBrakeScene.swift", "mathDeps": ["lib/physics/electromagnetism/eddy-currents.ts"]}
]
```

### Chunk 6 — Circuits (`circuits`)

```json
[
  {"sceneId": "ResistorLadderScene", "topic": "dc-circuits-and-kirchhoff", "sourcePath": "components/physics/resistor-ladder-scene.tsx", "targetPath": "PXScenes/Scenes/electromagnetism/ResistorLadderScene.swift", "mathDeps": []},
  {"sceneId": "NodeLoopLawScene", "topic": "dc-circuits-and-kirchhoff", "sourcePath": "components/physics/node-loop-law-scene.tsx", "targetPath": "PXScenes/Scenes/electromagnetism/NodeLoopLawScene.swift", "mathDeps": []},
  {"sceneId": "VoltageDividerScene", "topic": "dc-circuits-and-kirchhoff", "sourcePath": "components/physics/voltage-divider-scene.tsx", "targetPath": "PXScenes/Scenes/electromagnetism/VoltageDividerScene.swift", "mathDeps": ["lib/physics/electromagnetism/dc-circuits.ts"]},
  {"sceneId": "RcChargingScene", "topic": "rc-circuits", "sourcePath": "components/physics/rc-charging-scene.tsx", "targetPath": "PXScenes/Scenes/electromagnetism/RcChargingScene.swift", "mathDeps": ["lib/physics/electromagnetism/rc-circuits.ts"]},
  {"sceneId": "RcDischargingScene", "topic": "rc-circuits", "sourcePath": "components/physics/rc-discharging-scene.tsx", "targetPath": "PXScenes/Scenes/electromagnetism/RcDischargingScene.swift", "mathDeps": ["lib/physics/electromagnetism/rc-circuits.ts"]},
  {"sceneId": "RcTimeConstantScene", "topic": "rc-circuits", "sourcePath": "components/physics/rc-time-constant-scene.tsx", "targetPath": "PXScenes/Scenes/electromagnetism/RcTimeConstantScene.swift", "mathDeps": ["lib/physics/electromagnetism/rc-circuits.ts"]},
  {"sceneId": "RlRampScene", "topic": "rl-circuits", "sourcePath": "components/physics/rl-ramp-scene.tsx", "targetPath": "PXScenes/Scenes/electromagnetism/RlRampScene.swift", "mathDeps": ["lib/physics/electromagnetism/rl-circuits.ts"]},
  {"sceneId": "RlDecayScene", "topic": "rl-circuits", "sourcePath": "components/physics/rl-decay-scene.tsx", "targetPath": "PXScenes/Scenes/electromagnetism/RlDecayScene.swift", "mathDeps": ["lib/physics/electromagnetism/rl-circuits.ts"]},
  {"sceneId": "RlFlybackScene", "topic": "rl-circuits", "sourcePath": "components/physics/rl-flyback-scene.tsx", "targetPath": "PXScenes/Scenes/electromagnetism/RlFlybackScene.swift", "mathDeps": []},
  {"sceneId": "RlcResonanceScene", "topic": "rlc-circuits-and-resonance", "sourcePath": "components/physics/rlc-resonance-scene.tsx", "targetPath": "PXScenes/Scenes/electromagnetism/RlcResonanceScene.swift", "mathDeps": ["lib/physics/electromagnetism/rlc-resonance.ts"]},
  {"sceneId": "QFactorScene", "topic": "rlc-circuits-and-resonance", "sourcePath": "components/physics/q-factor-scene.tsx", "targetPath": "PXScenes/Scenes/electromagnetism/QFactorScene.swift", "mathDeps": ["lib/physics/electromagnetism/rlc-resonance.ts"]},
  {"sceneId": "RlcBandpassScene", "topic": "rlc-circuits-and-resonance", "sourcePath": "components/physics/rlc-bandpass-scene.tsx", "targetPath": "PXScenes/Scenes/electromagnetism/RlcBandpassScene.swift", "mathDeps": ["lib/physics/electromagnetism/rlc-resonance.ts"]},
  {"sceneId": "PhasorDiagramScene", "topic": "ac-circuits-and-phasors", "sourcePath": "components/physics/phasor-diagram-scene.tsx", "targetPath": "PXScenes/Scenes/electromagnetism/PhasorDiagramScene.swift", "mathDeps": []},
  {"sceneId": "ImpedanceTriangleScene", "topic": "ac-circuits-and-phasors", "sourcePath": "components/physics/impedance-triangle-scene.tsx", "targetPath": "PXScenes/Scenes/electromagnetism/ImpedanceTriangleScene.swift", "mathDeps": ["lib/physics/electromagnetism/ac-phasors.ts"]},
  {"sceneId": "PowerFactorScene", "topic": "ac-circuits-and-phasors", "sourcePath": "components/physics/power-factor-scene.tsx", "targetPath": "PXScenes/Scenes/electromagnetism/PowerFactorScene.swift", "mathDeps": ["lib/physics/electromagnetism/ac-phasors.ts"]},
  {"sceneId": "TransformerCouplingScene", "topic": "transformers", "sourcePath": "components/physics/transformer-coupling-scene.tsx", "targetPath": "PXScenes/Scenes/electromagnetism/TransformerCouplingScene.swift", "mathDeps": ["lib/physics/electromagnetism/transformers.ts"]},
  {"sceneId": "TurnsRatioScene", "topic": "transformers", "sourcePath": "components/physics/turns-ratio-scene.tsx", "targetPath": "PXScenes/Scenes/electromagnetism/TurnsRatioScene.swift", "mathDeps": ["lib/physics/electromagnetism/transformers.ts"]},
  {"sceneId": "PowerTransmissionScene", "topic": "transformers", "sourcePath": "components/physics/power-transmission-scene.tsx", "targetPath": "PXScenes/Scenes/electromagnetism/PowerTransmissionScene.swift", "mathDeps": ["lib/physics/electromagnetism/transformers.ts"]},
  {"sceneId": "TlDistributedScene", "topic": "transmission-lines", "sourcePath": "components/physics/tl-distributed-scene.tsx", "targetPath": "PXScenes/Scenes/electromagnetism/TlDistributedScene.swift", "mathDeps": ["lib/physics/electromagnetism/transmission-lines.ts"]},
  {"sceneId": "ReflectionCoefficientScene", "topic": "transmission-lines", "sourcePath": "components/physics/reflection-coefficient-scene.tsx", "targetPath": "PXScenes/Scenes/electromagnetism/ReflectionCoefficientScene.swift", "mathDeps": ["lib/physics/electromagnetism/transmission-lines.ts"]},
  {"sceneId": "StandingWaveRatioScene", "topic": "transmission-lines", "sourcePath": "components/physics/standing-wave-ratio-scene.tsx", "targetPath": "PXScenes/Scenes/electromagnetism/StandingWaveRatioScene.swift", "mathDeps": ["lib/physics/electromagnetism/transmission-lines.ts"]}
]
```

### Chunk 7 — Maxwell's synthesis (`maxwell`)

```json
[
  {"sceneId": "AmpereSurfaceMorphScene", "topic": "displacement-current", "sourcePath": "components/physics/ampere-surface-morph-scene.tsx", "targetPath": "PXScenes/Scenes/electromagnetism/AmpereSurfaceMorphScene.swift", "mathDeps": ["lib/physics/constants.ts", "lib/physics/electromagnetism/displacement-current.ts"]},
  {"sceneId": "DisplacementFieldBuildupScene", "topic": "displacement-current", "sourcePath": "components/physics/displacement-field-buildup-scene.tsx", "targetPath": "PXScenes/Scenes/electromagnetism/DisplacementFieldBuildupScene.swift", "mathDeps": ["lib/physics/electromagnetism/displacement-current.ts"]},
  {"sceneId": "CapacitorCurrentContinuityScene", "topic": "displacement-current", "sourcePath": "components/physics/capacitor-current-continuity-scene.tsx", "targetPath": "PXScenes/Scenes/electromagnetism/CapacitorCurrentContinuityScene.swift", "mathDeps": ["lib/physics/electromagnetism/displacement-current.ts"]},
  {"sceneId": "MaxwellTableScene", "topic": "the-four-equations", "sourcePath": "components/physics/maxwell-table-scene.tsx", "targetPath": "PXScenes/Scenes/electromagnetism/MaxwellTableScene.swift", "mathDeps": []},
  {"sceneId": "IntegralVsDifferentialScene", "topic": "the-four-equations", "sourcePath": "components/physics/integral-vs-differential-scene.tsx", "targetPath": "PXScenes/Scenes/electromagnetism/IntegralVsDifferentialScene.swift", "mathDeps": []},
  {"sceneId": "SourceSinkFieldScene", "topic": "the-four-equations", "sourcePath": "components/physics/source-sink-field-scene.tsx", "targetPath": "PXScenes/Scenes/electromagnetism/SourceSinkFieldScene.swift", "mathDeps": []},
  {"sceneId": "GaugeTransformScene", "topic": "gauge-freedom-and-potentials", "sourcePath": "components/physics/gauge-transform-scene.tsx", "targetPath": "PXScenes/Scenes/electromagnetism/GaugeTransformScene.swift", "mathDeps": []},
  {"sceneId": "LorenzVsCoulombGaugeScene", "topic": "gauge-freedom-and-potentials", "sourcePath": "components/physics/lorenz-vs-coulomb-gauge-scene.tsx", "targetPath": "PXScenes/Scenes/electromagnetism/LorenzVsCoulombGaugeScene.swift", "mathDeps": ["lib/physics/constants.ts"]},
  {"sceneId": "PotentialFreedomScene", "topic": "gauge-freedom-and-potentials", "sourcePath": "components/physics/potential-freedom-scene.tsx", "targetPath": "PXScenes/Scenes/electromagnetism/PotentialFreedomScene.swift", "mathDeps": ["lib/physics/electromagnetism/gauge.ts"]},
  {"sceneId": "PoyntingFlowScene", "topic": "the-poynting-vector", "sourcePath": "components/physics/poynting-flow-scene.tsx", "targetPath": "PXScenes/Scenes/electromagnetism/PoyntingFlowScene.swift", "mathDeps": ["lib/physics/electromagnetism/poynting.ts"]},
  {"sceneId": "CoaxEnergyFlowScene", "topic": "the-poynting-vector", "sourcePath": "components/physics/coax-energy-flow-scene.tsx", "targetPath": "PXScenes/Scenes/electromagnetism/CoaxEnergyFlowScene.swift", "mathDeps": ["lib/physics/electromagnetism/poynting.ts"]},
  {"sceneId": "AntennaRadiationPatternScene", "topic": "the-poynting-vector", "sourcePath": "components/physics/antenna-radiation-pattern-scene.tsx", "targetPath": "PXScenes/Scenes/electromagnetism/AntennaRadiationPatternScene.swift", "mathDeps": []},
  {"sceneId": "StressTensorFacesScene", "topic": "maxwell-stress-tensor", "sourcePath": "components/physics/stress-tensor-faces-scene.tsx", "targetPath": "PXScenes/Scenes/electromagnetism/StressTensorFacesScene.swift", "mathDeps": ["lib/physics/electromagnetism/maxwell-stress.ts"]},
  {"sceneId": "FieldPressureScene", "topic": "maxwell-stress-tensor", "sourcePath": "components/physics/field-pressure-scene.tsx", "targetPath": "PXScenes/Scenes/electromagnetism/FieldPressureScene.swift", "mathDeps": ["lib/physics/electromagnetism/maxwell-stress.ts"]},
  {"sceneId": "FieldMomentumScene", "topic": "maxwell-stress-tensor", "sourcePath": "components/physics/field-momentum-scene.tsx", "targetPath": "PXScenes/Scenes/electromagnetism/FieldMomentumScene.swift", "mathDeps": []}
]
```

### Chunk 8 — EM waves in vacuum (`em-waves-vacuum`)

```json
[
  {"sceneId": "MaxwellFourLinesScene", "topic": "deriving-the-em-wave-equation", "sourcePath": "components/physics/maxwell-four-lines-scene.tsx", "targetPath": "PXScenes/Scenes/electromagnetism/MaxwellFourLinesScene.swift", "mathDeps": []},
  {"sceneId": "VacuumWaveScene", "topic": "deriving-the-em-wave-equation", "sourcePath": "components/physics/vacuum-wave-scene.tsx", "targetPath": "PXScenes/Scenes/electromagnetism/VacuumWaveScene.swift", "mathDeps": ["lib/physics/electromagnetism/em-wave-equation.ts"]},
  {"sceneId": "SpeedMeasurementScene", "topic": "deriving-the-em-wave-equation", "sourcePath": "components/physics/speed-measurement-scene.tsx", "targetPath": "PXScenes/Scenes/electromagnetism/SpeedMeasurementScene.swift", "mathDeps": []},
  {"sceneId": "PolarizationMorphScene", "topic": "plane-waves-and-polarization", "sourcePath": "components/physics/polarization-morph-scene.tsx", "targetPath": "PXScenes/Scenes/electromagnetism/PolarizationMorphScene.swift", "mathDeps": ["lib/physics/electromagnetism/plane-waves.ts"]},
  {"sceneId": "PolarizationAxisScene", "topic": "plane-waves-and-polarization", "sourcePath": "components/physics/polarization-axis-scene.tsx", "targetPath": "PXScenes/Scenes/electromagnetism/PolarizationAxisScene.swift", "mathDeps": []},
  {"sceneId": "JonesVectorsScene", "topic": "plane-waves-and-polarization", "sourcePath": "components/physics/jones-vectors-scene.tsx", "targetPath": "PXScenes/Scenes/electromagnetism/JonesVectorsScene.swift", "mathDeps": ["lib/physics/electromagnetism/plane-waves.ts"]},
  {"sceneId": "PhotonMomentumScene", "topic": "radiation-pressure", "sourcePath": "components/physics/photon-momentum-scene.tsx", "targetPath": "PXScenes/Scenes/electromagnetism/PhotonMomentumScene.swift", "mathDeps": ["lib/physics/electromagnetism/radiation-pressure.ts"]},
  {"sceneId": "SolarSailScene", "topic": "radiation-pressure", "sourcePath": "components/physics/solar-sail-scene.tsx", "targetPath": "PXScenes/Scenes/electromagnetism/SolarSailScene.swift", "mathDeps": ["lib/physics/electromagnetism/radiation-pressure.ts"]},
  {"sceneId": "NicholsRadiometerScene", "topic": "radiation-pressure", "sourcePath": "components/physics/nichols-radiometer-scene.tsx", "targetPath": "PXScenes/Scenes/electromagnetism/NicholsRadiometerScene.swift", "mathDeps": ["lib/physics/electromagnetism/radiation-pressure.ts"]},
  {"sceneId": "SpectrumBandsScene", "topic": "the-electromagnetic-spectrum", "sourcePath": "components/physics/spectrum-bands-scene.tsx", "targetPath": "PXScenes/Scenes/electromagnetism/SpectrumBandsScene.swift", "mathDeps": ["lib/physics/electromagnetism/em-spectrum.ts"]},
  {"sceneId": "FraunhoferLinesScene", "topic": "the-electromagnetic-spectrum", "sourcePath": "components/physics/fraunhofer-lines-scene.tsx", "targetPath": "PXScenes/Scenes/electromagnetism/FraunhoferLinesScene.swift", "mathDeps": ["lib/physics/electromagnetism/visible-color.ts"]},
  {"sceneId": "VisibleBandZoomScene", "topic": "the-electromagnetic-spectrum", "sourcePath": "components/physics/visible-band-zoom-scene.tsx", "targetPath": "PXScenes/Scenes/electromagnetism/VisibleBandZoomScene.swift", "mathDeps": ["lib/physics/electromagnetism/em-spectrum.ts", "lib/physics/electromagnetism/visible-color.ts"]}
]
```

### Chunk 9 — Waves in matter & optics (`waves-in-matter-optics`)

```json
[
  {"sceneId": "MediumDelayScene", "topic": "index-of-refraction", "sourcePath": "components/physics/medium-delay-scene.tsx", "targetPath": "PXScenes/Scenes/electromagnetism/MediumDelayScene.swift", "mathDeps": ["lib/physics/constants.ts", "lib/physics/electromagnetism/optics-refraction.ts"]},
  {"sceneId": "DispersionTableScene", "topic": "index-of-refraction", "sourcePath": "components/physics/dispersion-table-scene.tsx", "targetPath": "PXScenes/Scenes/electromagnetism/DispersionTableScene.swift", "mathDeps": ["lib/physics/electromagnetism/optics-refraction.ts"]},
  {"sceneId": "GroupVsPhaseScene", "topic": "index-of-refraction", "sourcePath": "components/physics/group-vs-phase-scene.tsx", "targetPath": "PXScenes/Scenes/electromagnetism/GroupVsPhaseScene.swift", "mathDeps": []},
  {"sceneId": "SkinDepthDecayScene", "topic": "skin-depth-in-conductors", "sourcePath": "components/physics/skin-depth-decay-scene.tsx", "targetPath": "PXScenes/Scenes/electromagnetism/SkinDepthDecayScene.swift", "mathDeps": ["lib/physics/constants.ts", "lib/physics/electromagnetism/skin-depth.ts"]},
  {"sceneId": "CrossSectionScene", "topic": "skin-depth-in-conductors", "sourcePath": "components/physics/cross-section-scene.tsx", "targetPath": "PXScenes/Scenes/electromagnetism/CrossSectionScene.swift", "mathDeps": ["lib/physics/electromagnetism/skin-depth.ts"]},
  {"sceneId": "CoaxSkinEffectScene", "topic": "skin-depth-in-conductors", "sourcePath": "components/physics/coax-skin-effect-scene.tsx", "targetPath": "PXScenes/Scenes/electromagnetism/CoaxSkinEffectScene.swift", "mathDeps": ["lib/physics/electromagnetism/skin-depth.ts"]},
  {"sceneId": "FresnelCurvesScene", "topic": "fresnel-equations", "sourcePath": "components/physics/fresnel-curves-scene.tsx", "targetPath": "PXScenes/Scenes/electromagnetism/FresnelCurvesScene.swift", "mathDeps": ["lib/physics/electromagnetism/fresnel.ts"]},
  {"sceneId": "BrewsterAngleScene", "topic": "fresnel-equations", "sourcePath": "components/physics/brewster-angle-scene.tsx", "targetPath": "PXScenes/Scenes/electromagnetism/BrewsterAngleScene.swift", "mathDeps": ["lib/physics/electromagnetism/fresnel.ts"]},
  {"sceneId": "WaterGlassScene", "topic": "fresnel-equations", "sourcePath": "components/physics/water-glass-scene.tsx", "targetPath": "PXScenes/Scenes/electromagnetism/WaterGlassScene.swift", "mathDeps": ["lib/physics/electromagnetism/fresnel.ts"]},
  {"sceneId": "CriticalAngleScene", "topic": "total-internal-reflection", "sourcePath": "components/physics/critical-angle-scene.tsx", "targetPath": "PXScenes/Scenes/electromagnetism/CriticalAngleScene.swift", "mathDeps": ["lib/physics/electromagnetism/tir.ts"]},
  {"sceneId": "FiberOpticTIRScene", "topic": "total-internal-reflection", "sourcePath": "components/physics/fiber-optic-tir-scene.tsx", "targetPath": "PXScenes/Scenes/electromagnetism/FiberOpticTIRScene.swift", "mathDeps": ["lib/physics/electromagnetism/tir.ts"]},
  {"sceneId": "EvanescentWaveScene", "topic": "total-internal-reflection", "sourcePath": "components/physics/evanescent-wave-scene.tsx", "targetPath": "PXScenes/Scenes/electromagnetism/EvanescentWaveScene.swift", "mathDeps": ["lib/physics/electromagnetism/tir.ts"]},
  {"sceneId": "PrismSpectrumScene", "topic": "optical-dispersion", "sourcePath": "components/physics/prism-spectrum-scene.tsx", "targetPath": "PXScenes/Scenes/electromagnetism/PrismSpectrumScene.swift", "mathDeps": ["lib/physics/electromagnetism/optical-dispersion.ts"]},
  {"sceneId": "RainbowFormationScene", "topic": "optical-dispersion", "sourcePath": "components/physics/rainbow-formation-scene.tsx", "targetPath": "PXScenes/Scenes/electromagnetism/RainbowFormationScene.swift", "mathDeps": ["lib/physics/electromagnetism/optical-dispersion.ts"]},
  {"sceneId": "AbbeDiagramScene", "topic": "optical-dispersion", "sourcePath": "components/physics/abbe-diagram-scene.tsx", "targetPath": "PXScenes/Scenes/electromagnetism/AbbeDiagramScene.swift", "mathDeps": ["lib/physics/electromagnetism/optical-dispersion.ts"]},
  {"sceneId": "FermatPathTimeScene", "topic": "geometric-optics", "sourcePath": "components/physics/fermat-path-time-scene.tsx", "targetPath": "PXScenes/Scenes/electromagnetism/FermatPathTimeScene.swift", "mathDeps": []},
  {"sceneId": "ThinLensRayDiagramScene", "topic": "geometric-optics", "sourcePath": "components/physics/thin-lens-ray-diagram-scene.tsx", "targetPath": "PXScenes/Scenes/electromagnetism/ThinLensRayDiagramScene.swift", "mathDeps": ["lib/physics/electromagnetism/geometric-optics.ts"]},
  {"sceneId": "ConcaveMirrorScene", "topic": "geometric-optics", "sourcePath": "components/physics/concave-mirror-scene.tsx", "targetPath": "PXScenes/Scenes/electromagnetism/ConcaveMirrorScene.swift", "mathDeps": ["lib/physics/electromagnetism/geometric-optics.ts"]},
  {"sceneId": "TwoSourceInterferenceScene", "topic": "interference", "sourcePath": "components/physics/two-source-interference-scene.tsx", "targetPath": "PXScenes/Scenes/electromagnetism/TwoSourceInterferenceScene.swift", "mathDeps": []},
  {"sceneId": "NewtonsRingsScene", "topic": "interference", "sourcePath": "components/physics/newtons-rings-scene.tsx", "targetPath": "PXScenes/Scenes/electromagnetism/NewtonsRingsScene.swift", "mathDeps": ["lib/physics/electromagnetism/interference.ts"]},
  {"sceneId": "ThinFilmScene", "topic": "interference", "sourcePath": "components/physics/thin-film-scene.tsx", "targetPath": "PXScenes/Scenes/electromagnetism/ThinFilmScene.swift", "mathDeps": []},
  {"sceneId": "DoubleSlitBuildupScene", "topic": "diffraction-and-the-double-slit", "sourcePath": "components/physics/double-slit-buildup-scene.tsx", "targetPath": "PXScenes/Scenes/electromagnetism/DoubleSlitBuildupScene.swift", "mathDeps": ["lib/physics/electromagnetism/diffraction.ts"]},
  {"sceneId": "SingleSlitScene", "topic": "diffraction-and-the-double-slit", "sourcePath": "components/physics/single-slit-scene.tsx", "targetPath": "PXScenes/Scenes/electromagnetism/SingleSlitScene.swift", "mathDeps": ["lib/physics/electromagnetism/diffraction.ts"]},
  {"sceneId": "DiffractionGratingScene", "topic": "diffraction-and-the-double-slit", "sourcePath": "components/physics/diffraction-grating-scene.tsx", "targetPath": "PXScenes/Scenes/electromagnetism/DiffractionGratingScene.swift", "mathDeps": ["lib/physics/electromagnetism/diffraction.ts"]},
  {"sceneId": "MalusLawScene", "topic": "polarization-phenomena", "sourcePath": "components/physics/malus-law-scene.tsx", "targetPath": "PXScenes/Scenes/electromagnetism/MalusLawScene.swift", "mathDeps": ["lib/physics/electromagnetism/polarization-optics.ts"]},
  {"sceneId": "BrewsterAngleDemoScene", "topic": "polarization-phenomena", "sourcePath": "components/physics/brewster-angle-demo-scene.tsx", "targetPath": "PXScenes/Scenes/electromagnetism/BrewsterAngleDemoScene.swift", "mathDeps": ["lib/physics/electromagnetism/fresnel.ts", "lib/physics/electromagnetism/polarization-optics.ts"]},
  {"sceneId": "CalciteBirefringenceScene", "topic": "polarization-phenomena", "sourcePath": "components/physics/calcite-birefringence-scene.tsx", "targetPath": "PXScenes/Scenes/electromagnetism/CalciteBirefringenceScene.swift", "mathDeps": ["lib/physics/electromagnetism/polarization-optics.ts"]},
  {"sceneId": "StepIndexFiberScene", "topic": "waveguides-and-fibers", "sourcePath": "components/physics/step-index-fiber-scene.tsx", "targetPath": "PXScenes/Scenes/electromagnetism/StepIndexFiberScene.swift", "mathDeps": ["lib/physics/electromagnetism/waveguides.ts"]},
  {"sceneId": "NumericalApertureScene", "topic": "waveguides-and-fibers", "sourcePath": "components/physics/numerical-aperture-scene.tsx", "targetPath": "PXScenes/Scenes/electromagnetism/NumericalApertureScene.swift", "mathDeps": ["lib/physics/electromagnetism/waveguides.ts"]},
  {"sceneId": "TelecomBandScene", "topic": "waveguides-and-fibers", "sourcePath": "components/physics/telecom-band-scene.tsx", "targetPath": "PXScenes/Scenes/electromagnetism/TelecomBandScene.swift", "mathDeps": []}
]
```

### Chunk 10 — Radiation (`radiation`)

```json
[
  {"sceneId": "LarmorRadiationLobeScene", "topic": "larmor-formula", "sourcePath": "components/physics/larmor-radiation-lobe-scene.tsx", "targetPath": "PXScenes/Scenes/electromagnetism/LarmorRadiationLobeScene.swift", "mathDeps": []},
  {"sceneId": "LarmorPowerVsAccelerationScene", "topic": "larmor-formula", "sourcePath": "components/physics/larmor-power-vs-acceleration-scene.tsx", "targetPath": "PXScenes/Scenes/electromagnetism/LarmorPowerVsAccelerationScene.swift", "mathDeps": ["lib/physics/constants.ts", "lib/physics/electromagnetism/larmor.ts"]},
  {"sceneId": "LarmorRelativisticComparisonScene", "topic": "larmor-formula", "sourcePath": "components/physics/larmor-relativistic-comparison-scene.tsx", "targetPath": "PXScenes/Scenes/electromagnetism/LarmorRelativisticComparisonScene.swift", "mathDeps": []},
  {"sceneId": "DipoleFieldLinesScene", "topic": "electric-dipole-radiation", "sourcePath": "components/physics/dipole-field-lines-scene.tsx", "targetPath": "PXScenes/Scenes/electromagnetism/DipoleFieldLinesScene.swift", "mathDeps": ["lib/physics/constants.ts"]},
  {"sceneId": "NearFarFieldTransitionScene", "topic": "electric-dipole-radiation", "sourcePath": "components/physics/near-far-field-transition-scene.tsx", "targetPath": "PXScenes/Scenes/electromagnetism/NearFarFieldTransitionScene.swift", "mathDeps": []},
  {"sceneId": "DipolePolarPatternScene", "topic": "electric-dipole-radiation", "sourcePath": "components/physics/dipole-polar-pattern-scene.tsx", "targetPath": "PXScenes/Scenes/electromagnetism/DipolePolarPatternScene.swift", "mathDeps": []},
  {"sceneId": "Hertz1888ApparatusScene", "topic": "antennas-and-radio", "sourcePath": "components/physics/hertz-1888-apparatus-scene.tsx", "targetPath": "PXScenes/Scenes/electromagnetism/Hertz1888ApparatusScene.swift", "mathDeps": []},
  {"sceneId": "HalfWaveDipolePatternScene", "topic": "antennas-and-radio", "sourcePath": "components/physics/half-wave-dipole-pattern-scene.tsx", "targetPath": "PXScenes/Scenes/electromagnetism/HalfWaveDipolePatternScene.swift", "mathDeps": ["lib/physics/electromagnetism/antenna.ts"]},
  {"sceneId": "RadioPathLossScene", "topic": "antennas-and-radio", "sourcePath": "components/physics/radio-path-loss-scene.tsx", "targetPath": "PXScenes/Scenes/electromagnetism/RadioPathLossScene.swift", "mathDeps": ["lib/physics/constants.ts", "lib/physics/electromagnetism/antenna.ts"]},
  {"sceneId": "SynchrotronTangentConeScene", "topic": "synchrotron-radiation", "sourcePath": "components/physics/synchrotron-tangent-cone-scene.tsx", "targetPath": "PXScenes/Scenes/electromagnetism/SynchrotronTangentConeScene.swift", "mathDeps": ["lib/physics/electromagnetism/synchrotron.ts"]},
  {"sceneId": "SynchrotronSpectrumScene", "topic": "synchrotron-radiation", "sourcePath": "components/physics/synchrotron-spectrum-scene.tsx", "targetPath": "PXScenes/Scenes/electromagnetism/SynchrotronSpectrumScene.swift", "mathDeps": ["lib/physics/electromagnetism/synchrotron.ts"]},
  {"sceneId": "RelativisticBeamingScene", "topic": "synchrotron-radiation", "sourcePath": "components/physics/relativistic-beaming-scene.tsx", "targetPath": "PXScenes/Scenes/electromagnetism/RelativisticBeamingScene.swift", "mathDeps": ["lib/physics/electromagnetism/synchrotron.ts"]},
  {"sceneId": "CoulombDeflectionScene", "topic": "bremsstrahlung", "sourcePath": "components/physics/coulomb-deflection-scene.tsx", "targetPath": "PXScenes/Scenes/electromagnetism/CoulombDeflectionScene.swift", "mathDeps": []},
  {"sceneId": "ContinuousXraySpectrumScene", "topic": "bremsstrahlung", "sourcePath": "components/physics/continuous-xray-spectrum-scene.tsx", "targetPath": "PXScenes/Scenes/electromagnetism/ContinuousXraySpectrumScene.swift", "mathDeps": ["lib/physics/electromagnetism/bremsstrahlung.ts"]},
  {"sceneId": "ThickTargetShapeScene", "topic": "bremsstrahlung", "sourcePath": "components/physics/thick-target-shape-scene.tsx", "targetPath": "PXScenes/Scenes/electromagnetism/ThickTargetShapeScene.swift", "mathDeps": ["lib/physics/electromagnetism/bremsstrahlung.ts"]},
  {"sceneId": "AbrahamLorentzPhaseScene", "topic": "radiation-reaction", "sourcePath": "components/physics/abraham-lorentz-phase-scene.tsx", "targetPath": "PXScenes/Scenes/electromagnetism/AbrahamLorentzPhaseScene.swift", "mathDeps": []},
  {"sceneId": "RunawayVsReducedOrderScene", "topic": "radiation-reaction", "sourcePath": "components/physics/runaway-vs-reduced-order-scene.tsx", "targetPath": "PXScenes/Scenes/electromagnetism/RunawayVsReducedOrderScene.swift", "mathDeps": []},
  {"sceneId": "RadiationReactionTimescaleScene", "topic": "radiation-reaction", "sourcePath": "components/physics/radiation-reaction-timescale-scene.tsx", "targetPath": "PXScenes/Scenes/electromagnetism/RadiationReactionTimescaleScene.swift", "mathDeps": []}
]
```

### Chunk 11 — EM & relativity (`em-relativity`)

```json
[
  {"sceneId": "BoostedChargeCountingScene", "topic": "charge-invariance", "sourcePath": "components/physics/boosted-charge-counting-scene.tsx", "targetPath": "PXScenes/Scenes/electromagnetism/BoostedChargeCountingScene.swift", "mathDeps": []},
  {"sceneId": "WeberKohlrauschCScene", "topic": "charge-invariance", "sourcePath": "components/physics/weber-kohlrausch-c-scene.tsx", "targetPath": "PXScenes/Scenes/electromagnetism/WeberKohlrauschCScene.swift", "mathDeps": ["lib/physics/electromagnetism/charge-invariance.ts"]},
  {"sceneId": "FourCurrentFluxScene", "topic": "charge-invariance", "sourcePath": "components/physics/four-current-flux-scene.tsx", "targetPath": "PXScenes/Scenes/electromagnetism/FourCurrentFluxScene.swift", "mathDeps": []},
  {"sceneId": "BoostMixingEBScene", "topic": "e-and-b-under-lorentz", "sourcePath": "components/physics/boost-mixing-e-b-scene.tsx", "targetPath": "PXScenes/Scenes/electromagnetism/BoostMixingEBScene.swift", "mathDeps": ["lib/physics/constants.ts", "lib/physics/electromagnetism/relativity.ts"]},
  {"sceneId": "LorentzInvariantsScene", "topic": "e-and-b-under-lorentz", "sourcePath": "components/physics/lorentz-invariants-scene.tsx", "targetPath": "PXScenes/Scenes/electromagnetism/LorentzInvariantsScene.swift", "mathDeps": ["lib/physics/constants.ts", "lib/physics/electromagnetism/em-lorentz-transform.ts", "lib/physics/electromagnetism/relativity.ts"]},
  {"sceneId": "PureEBecomesEBScene", "topic": "e-and-b-under-lorentz", "sourcePath": "components/physics/pure-e-becomes-eb-scene.tsx", "targetPath": "PXScenes/Scenes/electromagnetism/PureEBecomesEBScene.swift", "mathDeps": ["lib/physics/electromagnetism/relativity.ts"]},
  {"sceneId": "FieldTensorGridScene", "topic": "the-electromagnetic-field-tensor", "sourcePath": "components/physics/field-tensor-grid-scene.tsx", "targetPath": "PXScenes/Scenes/electromagnetism/FieldTensorGridScene.swift", "mathDeps": []},
  {"sceneId": "DualTensorSwapScene", "topic": "the-electromagnetic-field-tensor", "sourcePath": "components/physics/dual-tensor-swap-scene.tsx", "targetPath": "PXScenes/Scenes/electromagnetism/DualTensorSwapScene.swift", "mathDeps": []},
  {"sceneId": "TensorRecoversMaxwellScene", "topic": "the-electromagnetic-field-tensor", "sourcePath": "components/physics/tensor-recovers-maxwell-scene.tsx", "targetPath": "PXScenes/Scenes/electromagnetism/TensorRecoversMaxwellScene.swift", "mathDeps": []},
  {"sceneId": "TwoWireLabFrameScene", "topic": "magnetism-as-relativistic-electrostatics", "sourcePath": "components/physics/two-wire-lab-frame-scene.tsx", "targetPath": "PXScenes/Scenes/electromagnetism/TwoWireLabFrameScene.swift", "mathDeps": ["lib/physics/constants.ts", "lib/physics/electromagnetism/relativistic-magnetism.ts"]},
  {"sceneId": "TwoWireElectronFrameScene", "topic": "magnetism-as-relativistic-electrostatics", "sourcePath": "components/physics/two-wire-electron-frame-scene.tsx", "targetPath": "PXScenes/Scenes/electromagnetism/TwoWireElectronFrameScene.swift", "mathDeps": ["lib/physics/constants.ts", "lib/physics/electromagnetism/relativistic-magnetism.ts", "lib/physics/electromagnetism/relativity.ts"]},
  {"sceneId": "ForceEquivalenceReadoutScene", "topic": "magnetism-as-relativistic-electrostatics", "sourcePath": "components/physics/force-equivalence-readout-scene.tsx", "targetPath": "PXScenes/Scenes/electromagnetism/ForceEquivalenceReadoutScene.swift", "mathDeps": ["lib/physics/constants.ts", "lib/physics/electromagnetism/relativistic-magnetism.ts"]},
  {"sceneId": "FourPotentialComponentsScene", "topic": "four-potential-and-em-lagrangian", "sourcePath": "components/physics/four-potential-components-scene.tsx", "targetPath": "PXScenes/Scenes/electromagnetism/FourPotentialComponentsScene.swift", "mathDeps": ["lib/physics/electromagnetism/relativity.ts"]},
  {"sceneId": "LagrangianActionScene", "topic": "four-potential-and-em-lagrangian", "sourcePath": "components/physics/lagrangian-action-scene.tsx", "targetPath": "PXScenes/Scenes/electromagnetism/LagrangianActionScene.swift", "mathDeps": []},
  {"sceneId": "NoetherChargeConservationScene", "topic": "four-potential-and-em-lagrangian", "sourcePath": "components/physics/noether-charge-conservation-scene.tsx", "targetPath": "PXScenes/Scenes/electromagnetism/NoetherChargeConservationScene.swift", "mathDeps": []}
]
```

### Chunk 12 — Foundations (`foundations`)

```json
[
  {"sceneId": "U1PhaseRotationScene", "topic": "gauge-theory-origins", "sourcePath": "components/physics/u1-phase-rotation-scene.tsx", "targetPath": "PXScenes/Scenes/electromagnetism/U1PhaseRotationScene.swift", "mathDeps": ["lib/physics/electromagnetism/gauge-theory.ts"]},
  {"sceneId": "GaugeSymmetryToConservationScene", "topic": "gauge-theory-origins", "sourcePath": "components/physics/gauge-symmetry-to-conservation-scene.tsx", "targetPath": "PXScenes/Scenes/electromagnetism/GaugeSymmetryToConservationScene.swift", "mathDeps": []},
  {"sceneId": "NonAbelianGestureScene", "topic": "gauge-theory-origins", "sourcePath": "components/physics/non-abelian-gesture-scene.tsx", "targetPath": "PXScenes/Scenes/electromagnetism/NonAbelianGestureScene.swift", "mathDeps": ["lib/physics/electromagnetism/gauge-theory.ts", "lib/physics/electromagnetism/relativity.ts"]},
  {"sceneId": "TwoSlitWithSolenoidScene", "topic": "aharonov-bohm-effect", "sourcePath": "components/physics/two-slit-with-solenoid-scene.tsx", "targetPath": "PXScenes/Scenes/electromagnetism/TwoSlitWithSolenoidScene.swift", "mathDeps": ["lib/physics/electromagnetism/aharonov-bohm.ts"]},
  {"sceneId": "FluxPhaseShiftFringesScene", "topic": "aharonov-bohm-effect", "sourcePath": "components/physics/flux-phase-shift-fringes-scene.tsx", "targetPath": "PXScenes/Scenes/electromagnetism/FluxPhaseShiftFringesScene.swift", "mathDeps": ["lib/physics/electromagnetism/aharonov-bohm.ts"]},
  {"sceneId": "FieldFreeElectronPathsScene", "topic": "aharonov-bohm-effect", "sourcePath": "components/physics/field-free-electron-paths-scene.tsx", "targetPath": "PXScenes/Scenes/electromagnetism/FieldFreeElectronPathsScene.swift", "mathDeps": []},
  {"sceneId": "DualMaxwellSymmetryScene", "topic": "magnetic-monopoles-and-duality", "sourcePath": "components/physics/dual-maxwell-symmetry-scene.tsx", "targetPath": "PXScenes/Scenes/electromagnetism/DualMaxwellSymmetryScene.swift", "mathDeps": ["lib/physics/electromagnetism/monopole.ts"]},
  {"sceneId": "DualTensorAndMonopoleSourceScene", "topic": "magnetic-monopoles-and-duality", "sourcePath": "components/physics/dual-tensor-and-monopole-source-scene.tsx", "targetPath": "PXScenes/Scenes/electromagnetism/DualTensorAndMonopoleSourceScene.swift", "mathDeps": []},
  {"sceneId": "DiracQuantizationConditionScene", "topic": "magnetic-monopoles-and-duality", "sourcePath": "components/physics/dirac-quantization-condition-scene.tsx", "targetPath": "PXScenes/Scenes/electromagnetism/DiracQuantizationConditionScene.swift", "mathDeps": ["lib/physics/constants.ts", "lib/physics/electromagnetism/monopole.ts"]},
  {"sceneId": "CoherentStatePoissonScene", "topic": "classical-limit-of-qed", "sourcePath": "components/physics/coherent-state-poisson-scene.tsx", "targetPath": "PXScenes/Scenes/electromagnetism/CoherentStatePoissonScene.swift", "mathDeps": ["lib/physics/electromagnetism/qed-classical-limit.ts"]},
  {"sceneId": "PhotonNumberToClassicalFieldScene", "topic": "classical-limit-of-qed", "sourcePath": "components/physics/photon-number-to-classical-field-scene.tsx", "targetPath": "PXScenes/Scenes/electromagnetism/PhotonNumberToClassicalFieldScene.swift", "mathDeps": ["lib/physics/electromagnetism/qed-classical-limit.ts"]},
  {"sceneId": "RunningCouplingAndCorrectionsScene", "topic": "classical-limit-of-qed", "sourcePath": "components/physics/running-coupling-and-corrections-scene.tsx", "targetPath": "PXScenes/Scenes/electromagnetism/RunningCouplingAndCorrectionsScene.swift", "mathDeps": ["lib/physics/constants.ts", "lib/physics/electromagnetism/qed-classical-limit.ts"]}
]
```

## Checklist

Per chunk; check off as ported + registered. `(P4-4)` = already shipping.

### Chunk 1 — Electrostatics
- [x] FieldLinesPointScene — (P4-4)
- [x] FieldLinesDipoleScene — (P4-4)
- [ ] FieldLinesParallelPlatesScene
- [x] GaussianSurfacesScene — (P4-4)
- [ ] GaussSymmetryScene
- [ ] FluxThroughSurfaceScene
- [ ] PotentialSurfaceScene
- [x] EquipotentialLinesScene — (P4-4)
- [ ] VoltageRampScene
- [x] ParallelPlateCapacitorScene — (P4-4)
- [ ] CapacitorChargingScene
- [ ] EnergyDensityScene
- [ ] FaradayCageScene
- [ ] ConductorChargeDistributionScene
- [ ] LightningShelterScene
- [ ] ImageChargePlaneScene
- [ ] ImageChargeSphereScene
- [ ] InducedChargeScene

### Chunk 2 — Fields in matter
- [ ] DipoleAlignmentScene
- [ ] BoundChargeDensityScene
- [ ] PolarizationVsFieldScene
- [ ] DFieldFreeChargeScene
- [ ] DielectricCapacitorScene
- [ ] DVsEDifferenceScene
- [ ] BoundaryEFieldScene
- [ ] BoundaryDFieldScene
- [ ] DielectricRefractionScene
- [ ] PiezoCrystalScene
- [ ] FerroelectricHysteresisScene
- [ ] DomainSwitchingScene

### Chunk 3 — Magnetostatics
- [ ] LorentzTrajectoryScene
- [ ] CyclotronScene
- [ ] VelocitySelectorScene
- [ ] WireSegmentFieldScene
- [ ] StraightWireFieldScene
- [ ] LoopFieldScene
- [ ] AmpereLoopWireScene
- [ ] SolenoidFieldScene
- [ ] ToroidFieldScene
- [ ] VectorPotentialScene
- [ ] GaugeFreedomScene
- [ ] ASourceCurrentScene
- [ ] DipoleTorqueScene
- [ ] CompassScene
- [ ] MagneticDipoleFieldScene

### Chunk 4 — Magnetism in matter
- [ ] MagnetizationVectorsScene
- [ ] HVsBFieldScene
- [ ] ChiVsTemperatureScene
- [ ] OrbitalResponseScene
- [ ] ParamagnetAlignmentScene
- [ ] SusceptibilitySpectrumScene
- [ ] HysteresisDomainScene
- [ ] CurieTransitionScene
- [ ] DomainWallMotionScene
- [ ] MeissnerExpulsionScene
- [ ] LevitationScene
- [ ] CriticalTemperatureScene

### Chunk 5 — Induction
- [ ] MagnetThroughCoilScene
- [ ] FluxChangeAreaScene
- [ ] FaradayDiskScene
- [ ] LenzOppositionScene
- [ ] SlidingRodEmfScene
- [ ] JumpingRingScene
- [ ] InductorCurrentBuildupScene
- [ ] MutualInductionScene
- [ ] RLTimeConstantScene
- [ ] InductorEnergyRampScene
- [ ] MagneticEnergyDensityScene
- [ ] CapacitorVsInductorScene
- [ ] MagnetThroughTubeScene
- [ ] InductionHeatingScene
- [ ] MagneticBrakeScene

### Chunk 6 — Circuits
- [ ] ResistorLadderScene
- [ ] NodeLoopLawScene
- [ ] VoltageDividerScene
- [ ] RcChargingScene
- [ ] RcDischargingScene
- [ ] RcTimeConstantScene
- [ ] RlRampScene
- [ ] RlDecayScene
- [ ] RlFlybackScene
- [ ] RlcResonanceScene
- [ ] QFactorScene
- [ ] RlcBandpassScene
- [ ] PhasorDiagramScene
- [ ] ImpedanceTriangleScene
- [ ] PowerFactorScene
- [ ] TransformerCouplingScene
- [ ] TurnsRatioScene
- [ ] PowerTransmissionScene
- [ ] TlDistributedScene
- [ ] ReflectionCoefficientScene
- [ ] StandingWaveRatioScene

### Chunk 7 — Maxwell's synthesis
- [ ] AmpereSurfaceMorphScene
- [ ] DisplacementFieldBuildupScene
- [ ] CapacitorCurrentContinuityScene
- [ ] MaxwellTableScene
- [ ] IntegralVsDifferentialScene
- [ ] SourceSinkFieldScene
- [ ] GaugeTransformScene
- [ ] LorenzVsCoulombGaugeScene
- [ ] PotentialFreedomScene
- [ ] PoyntingFlowScene
- [ ] CoaxEnergyFlowScene
- [ ] AntennaRadiationPatternScene
- [ ] StressTensorFacesScene
- [ ] FieldPressureScene
- [ ] FieldMomentumScene

### Chunk 8 — EM waves in vacuum
- [ ] MaxwellFourLinesScene
- [ ] VacuumWaveScene
- [ ] SpeedMeasurementScene
- [ ] PolarizationMorphScene
- [ ] PolarizationAxisScene
- [ ] JonesVectorsScene
- [ ] PhotonMomentumScene
- [ ] SolarSailScene
- [ ] NicholsRadiometerScene
- [ ] SpectrumBandsScene
- [ ] FraunhoferLinesScene
- [ ] VisibleBandZoomScene

### Chunk 9 — Waves in matter & optics
- [ ] MediumDelayScene
- [ ] DispersionTableScene
- [ ] GroupVsPhaseScene
- [ ] SkinDepthDecayScene
- [ ] CrossSectionScene
- [ ] CoaxSkinEffectScene
- [ ] FresnelCurvesScene
- [ ] BrewsterAngleScene
- [ ] WaterGlassScene
- [ ] CriticalAngleScene
- [ ] FiberOpticTIRScene
- [ ] EvanescentWaveScene
- [ ] PrismSpectrumScene
- [ ] RainbowFormationScene
- [ ] AbbeDiagramScene
- [ ] FermatPathTimeScene
- [ ] ThinLensRayDiagramScene
- [ ] ConcaveMirrorScene
- [ ] TwoSourceInterferenceScene
- [ ] NewtonsRingsScene
- [ ] ThinFilmScene
- [ ] DoubleSlitBuildupScene
- [ ] SingleSlitScene
- [ ] DiffractionGratingScene
- [ ] MalusLawScene
- [ ] BrewsterAngleDemoScene
- [ ] CalciteBirefringenceScene
- [ ] StepIndexFiberScene
- [ ] NumericalApertureScene
- [ ] TelecomBandScene

### Chunk 10 — Radiation
- [ ] LarmorRadiationLobeScene
- [ ] LarmorPowerVsAccelerationScene
- [ ] LarmorRelativisticComparisonScene
- [ ] DipoleFieldLinesScene
- [ ] NearFarFieldTransitionScene
- [ ] DipolePolarPatternScene
- [ ] Hertz1888ApparatusScene
- [ ] HalfWaveDipolePatternScene
- [ ] RadioPathLossScene
- [ ] SynchrotronTangentConeScene
- [ ] SynchrotronSpectrumScene
- [ ] RelativisticBeamingScene
- [ ] CoulombDeflectionScene
- [ ] ContinuousXraySpectrumScene
- [ ] ThickTargetShapeScene
- [ ] AbrahamLorentzPhaseScene
- [ ] RunawayVsReducedOrderScene
- [ ] RadiationReactionTimescaleScene

### Chunk 11 — EM & relativity
- [ ] BoostedChargeCountingScene
- [ ] WeberKohlrauschCScene
- [ ] FourCurrentFluxScene
- [ ] BoostMixingEBScene
- [ ] LorentzInvariantsScene
- [ ] PureEBecomesEBScene
- [ ] FieldTensorGridScene
- [ ] DualTensorSwapScene
- [ ] TensorRecoversMaxwellScene
- [ ] TwoWireLabFrameScene
- [ ] TwoWireElectronFrameScene
- [ ] ForceEquivalenceReadoutScene
- [ ] FourPotentialComponentsScene
- [ ] LagrangianActionScene
- [ ] NoetherChargeConservationScene

### Chunk 12 — Foundations
- [ ] U1PhaseRotationScene
- [ ] GaugeSymmetryToConservationScene
- [ ] NonAbelianGestureScene
- [ ] TwoSlitWithSolenoidScene
- [ ] FluxPhaseShiftFringesScene
- [ ] FieldFreeElectronPathsScene
- [ ] DualMaxwellSymmetryScene
- [ ] DualTensorAndMonopoleSourceScene
- [ ] DiracQuantizationConditionScene
- [ ] CoherentStatePoissonScene
- [ ] PhotonNumberToClassicalFieldScene
- [ ] RunningCouplingAndCorrectionsScene

## Notes
(append per-chunk divergence notes here)
