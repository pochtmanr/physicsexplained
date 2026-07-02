# Wave 01 — Shared-canvas scenes (SpacetimeDiagram + Manifold wrappers)

Run with `wave-template.md`. 22 scenes; all depend on the two shared canvases ported in P4-2 (`SpacetimeDiagramView`, `ManifoldView` — playbook §8), so most are thin config wrappers. Registration file: `SceneRegistry+Wave01.swift`.

All ids verified against the web export names and `lib/content/simulation-registry.ts` on 2026-07-02. `sourcePath` is relative to `/Users/roman/Developer/physics/`; `targetPath` to `ios/PhysicsPackages/Sources/`.

Math deps (port first, once): `lib/physics/relativity/types.ts`, `bell-spaceship.ts`, `four-vectors.ts`, `light-cone.ts`, `barn-pole.ts`, `twin-paradox.ts` (partially in PXMath from the P4/playbook worked example — check first), `manifolds.ts`, `christoffel.ts`, `metric.ts`.

## Manifest

```json
[
  {"sceneId":"SpacetimeDiagramScene","sourcePath":"components/physics/relative-simultaneity/spacetime-diagram-scene.tsx","targetPath":"PXScenes/Scenes/relativity/SpacetimeDiagramScene.swift","mathDeps":["lib/physics/relativity/types.ts"]},
  {"sceneId":"MinkowskiAxesScene","sourcePath":"components/physics/spacetime-diagrams/minkowski-axes-scene.tsx","targetPath":"PXScenes/Scenes/relativity/MinkowskiAxesScene.swift","mathDeps":["lib/physics/relativity/types.ts"]},
  {"sceneId":"WorldlineConstructionScene","sourcePath":"components/physics/spacetime-diagrams/worldline-construction-scene.tsx","targetPath":"PXScenes/Scenes/relativity/WorldlineConstructionScene.swift","mathDeps":[]},
  {"sceneId":"BoostedFrameScene","sourcePath":"components/physics/spacetime-diagrams/boosted-frame-scene.tsx","targetPath":"PXScenes/Scenes/relativity/BoostedFrameScene.swift","mathDeps":["lib/physics/relativity/types.ts"]},
  {"sceneId":"SpacetimeClockScene","sourcePath":"components/physics/time-dilation/spacetime-clock-scene.tsx","targetPath":"PXScenes/Scenes/relativity/SpacetimeClockScene.swift","mathDeps":["lib/physics/relativity/types.ts"]},
  {"sceneId":"IntervalScene","sourcePath":"components/physics/the-invariant-interval/interval-scene.tsx","targetPath":"PXScenes/Scenes/relativity/IntervalScene.swift","mathDeps":["lib/physics/relativity/types.ts"]},
  {"sceneId":"InvariantIntervalScene","sourcePath":"components/physics/the-lorentz-transformation/invariant-interval-scene.tsx","targetPath":"PXScenes/Scenes/relativity/InvariantIntervalScene.swift","mathDeps":["lib/physics/relativity/types.ts"]},
  {"sceneId":"LightConeScene","sourcePath":"components/physics/light-cones-and-causality/light-cone-scene.tsx","targetPath":"PXScenes/Scenes/relativity/LightConeScene.swift","mathDeps":["lib/physics/relativity/light-cone.ts","lib/physics/relativity/types.ts"]},
  {"sceneId":"CausalityTiltScene","sourcePath":"components/physics/light-cones-and-causality/causality-tilt-scene.tsx","targetPath":"PXScenes/Scenes/relativity/CausalityTiltScene.swift","mathDeps":["lib/physics/relativity/types.ts"]},
  {"sceneId":"BarnFrameScene","sourcePath":"components/physics/the-barn-pole-paradox/barn-frame-scene.tsx","targetPath":"PXScenes/Scenes/relativity/BarnFrameScene.swift","mathDeps":["lib/physics/relativity/barn-pole.ts","lib/physics/relativity/types.ts"]},
  {"sceneId":"PoleFrameScene","sourcePath":"components/physics/the-barn-pole-paradox/pole-frame-scene.tsx","targetPath":"PXScenes/Scenes/relativity/PoleFrameScene.swift","mathDeps":["lib/physics/relativity/barn-pole.ts","lib/physics/relativity/types.ts"]},
  {"sceneId":"KinkedWorldlineScene","sourcePath":"components/physics/the-twin-paradox/kinked-worldline-scene.tsx","targetPath":"PXScenes/Scenes/relativity/KinkedWorldlineScene.swift","mathDeps":["lib/physics/relativity/twin-paradox.ts","lib/physics/relativity/types.ts"]},
  {"sceneId":"ProperTimeIntegralScene","sourcePath":"components/physics/four-vectors-and-proper-time/proper-time-integral-scene.tsx","targetPath":"PXScenes/Scenes/relativity/ProperTimeIntegralScene.swift","mathDeps":["lib/physics/relativity/four-vectors.ts","lib/physics/relativity/types.ts"]},
  {"sceneId":"BellTwoRocketsScene","sourcePath":"components/physics/bells-spaceship-paradox/two-rockets-scene.tsx","targetPath":"PXScenes/Scenes/relativity/BellTwoRocketsScene.swift","mathDeps":["lib/physics/relativity/bell-spaceship.ts","lib/physics/relativity/types.ts"]},
  {"sceneId":"BornRigidComparisonScene","sourcePath":"components/physics/bells-spaceship-paradox/born-rigid-comparison-scene.tsx","targetPath":"PXScenes/Scenes/relativity/BornRigidComparisonScene.swift","mathDeps":["lib/physics/relativity/bell-spaceship.ts","lib/physics/relativity/types.ts"]},
  {"sceneId":"SphereManifoldScene","sourcePath":"components/physics/manifolds-and-tangent-spaces/sphere-manifold-scene.tsx","targetPath":"PXScenes/Scenes/relativity/SphereManifoldScene.swift","mathDeps":["lib/physics/relativity/manifolds.ts"]},
  {"sceneId":"TangentSpaceScene","sourcePath":"components/physics/manifolds-and-tangent-spaces/tangent-space-scene.tsx","targetPath":"PXScenes/Scenes/relativity/TangentSpaceScene.swift","mathDeps":["lib/physics/relativity/manifolds.ts"]},
  {"sceneId":"GreatCircleGeodesicScene","sourcePath":"components/physics/geodesics/great-circle-geodesic-scene.tsx","targetPath":"PXScenes/Scenes/relativity/GreatCircleGeodesicScene.swift","mathDeps":["lib/physics/relativity/manifolds.ts"]},
  {"sceneId":"SphericalTriangleHolonomyScene","sourcePath":"components/physics/christoffels-and-parallel-transport/spherical-triangle-holonomy-scene.tsx","targetPath":"PXScenes/Scenes/relativity/SphericalTriangleHolonomyScene.swift","mathDeps":["lib/physics/relativity/christoffel.ts","lib/physics/relativity/manifolds.ts"]},
  {"sceneId":"MetricEllipsesScene","sourcePath":"components/physics/the-metric-tensor/metric-ellipses-scene.tsx","targetPath":"PXScenes/Scenes/relativity/MetricEllipsesScene.swift","mathDeps":["lib/physics/relativity/metric.ts","lib/physics/relativity/manifolds.ts"]},
  {"sceneId":"RiemannVsFlatScene","sourcePath":"components/physics/the-riemann-tensor/riemann-vs-flat-scene.tsx","targetPath":"PXScenes/Scenes/relativity/RiemannVsFlatScene.swift","mathDeps":["lib/physics/relativity/christoffel.ts","lib/physics/relativity/manifolds.ts"]},
  {"sceneId":"RicciScalarHeatmapScene","sourcePath":"components/physics/ricci-and-the-einstein-tensor/ricci-scalar-heatmap-scene.tsx","targetPath":"PXScenes/Scenes/relativity/RicciScalarHeatmapScene.swift","mathDeps":[]}
]
```

Suggested split: two sessions — 15 SpacetimeDiagram scenes (entries 1–15), then 7 Manifold scenes (16–22).

## Checklist
- [ ] SpacetimeDiagramScene
- [ ] MinkowskiAxesScene
- [ ] WorldlineConstructionScene
- [ ] BoostedFrameScene
- [ ] SpacetimeClockScene
- [ ] IntervalScene
- [ ] InvariantIntervalScene
- [ ] LightConeScene
- [ ] CausalityTiltScene
- [ ] BarnFrameScene
- [ ] PoleFrameScene
- [ ] KinkedWorldlineScene
- [ ] ProperTimeIntegralScene
- [ ] BellTwoRocketsScene
- [ ] BornRigidComparisonScene
- [ ] SphereManifoldScene
- [ ] TangentSpaceScene
- [ ] GreatCircleGeodesicScene
- [ ] SphericalTriangleHolonomyScene
- [ ] MetricEllipsesScene
- [ ] RiemannVsFlatScene
- [ ] RicciScalarHeatmapScene

## Notes
(append per-scene divergence notes here)
