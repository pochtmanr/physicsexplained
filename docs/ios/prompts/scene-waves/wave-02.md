# Wave 02 — Classical mechanics foundations (18 static scenes)

Run with `wave-template.md`. All 18 are STATIC Canvas-2D scenes (no `useSceneTick` — verified 2026-07-02) from the first six live classical-mechanics topics, so readers of the most-visited essays see native figures early. Registration file: `SceneRegistry+Wave02.swift`.

Math deps (port first, once — all small pure-TS modules): `lib/physics/newton.ts`, `lib/physics/energy.ts`, `lib/physics/momentum.ts`, `lib/physics/circular-motion.ts`, `lib/physics/friction.ts`.

## Manifest

```json
[
  {"sceneId":"FreeFallScene","sourcePath":"components/physics/free-fall-scene.tsx","targetPath":"PXScenes/Scenes/classical-mechanics/FreeFallScene.swift","mathDeps":[]},
  {"sceneId":"InclinedPlaneScene","sourcePath":"components/physics/inclined-plane-scene.tsx","targetPath":"PXScenes/Scenes/classical-mechanics/InclinedPlaneScene.swift","mathDeps":[]},
  {"sceneId":"KinematicsGraphScene","sourcePath":"components/physics/kinematics-graph-scene.tsx","targetPath":"PXScenes/Scenes/classical-mechanics/KinematicsGraphScene.swift","mathDeps":[]},
  {"sceneId":"TangentZoomScene","sourcePath":"components/physics/tangent-zoom-scene.tsx","targetPath":"PXScenes/Scenes/classical-mechanics/TangentZoomScene.swift","mathDeps":[]},
  {"sceneId":"FirstLawScene","sourcePath":"components/physics/first-law-scene.tsx","targetPath":"PXScenes/Scenes/classical-mechanics/FirstLawScene.swift","mathDeps":["lib/physics/newton.ts"]},
  {"sceneId":"FMaScene","sourcePath":"components/physics/f-ma-scene.tsx","targetPath":"PXScenes/Scenes/classical-mechanics/FMaScene.swift","mathDeps":["lib/physics/newton.ts"]},
  {"sceneId":"ActionReactionScene","sourcePath":"components/physics/action-reaction-scene.tsx","targetPath":"PXScenes/Scenes/classical-mechanics/ActionReactionScene.swift","mathDeps":["lib/physics/newton.ts"]},
  {"sceneId":"WorkScene","sourcePath":"components/physics/work-scene.tsx","targetPath":"PXScenes/Scenes/classical-mechanics/WorkScene.swift","mathDeps":[]},
  {"sceneId":"EnergyBowlScene","sourcePath":"components/physics/energy-bowl-scene.tsx","targetPath":"PXScenes/Scenes/classical-mechanics/EnergyBowlScene.swift","mathDeps":["lib/physics/energy.ts"]},
  {"sceneId":"PowerScene","sourcePath":"components/physics/power-scene.tsx","targetPath":"PXScenes/Scenes/classical-mechanics/PowerScene.swift","mathDeps":[]},
  {"sceneId":"CollisionScene","sourcePath":"components/physics/collision-scene.tsx","targetPath":"PXScenes/Scenes/classical-mechanics/CollisionScene.swift","mathDeps":["lib/physics/momentum.ts"]},
  {"sceneId":"CenterOfMassScene","sourcePath":"components/physics/center-of-mass-scene.tsx","targetPath":"PXScenes/Scenes/classical-mechanics/CenterOfMassScene.swift","mathDeps":[]},
  {"sceneId":"AngularVelocityScene","sourcePath":"components/physics/angular-velocity-scene.tsx","targetPath":"PXScenes/Scenes/classical-mechanics/AngularVelocityScene.swift","mathDeps":["lib/physics/circular-motion.ts"]},
  {"sceneId":"VelocityTriangleScene","sourcePath":"components/physics/velocity-triangle-scene.tsx","targetPath":"PXScenes/Scenes/classical-mechanics/VelocityTriangleScene.swift","mathDeps":["lib/physics/circular-motion.ts"]},
  {"sceneId":"CentripetalForceScene","sourcePath":"components/physics/centripetal-force-scene.tsx","targetPath":"PXScenes/Scenes/classical-mechanics/CentripetalForceScene.swift","mathDeps":["lib/physics/circular-motion.ts"]},
  {"sceneId":"FrictionRampScene","sourcePath":"components/physics/friction-ramp-scene.tsx","targetPath":"PXScenes/Scenes/classical-mechanics/FrictionRampScene.swift","mathDeps":["lib/physics/friction.ts"]},
  {"sceneId":"TerminalVelocityScene","sourcePath":"components/physics/terminal-velocity-scene.tsx","targetPath":"PXScenes/Scenes/classical-mechanics/TerminalVelocityScene.swift","mathDeps":["lib/physics/friction.ts"]},
  {"sceneId":"DragRegimesScene","sourcePath":"components/physics/drag-regimes-scene.tsx","targetPath":"PXScenes/Scenes/classical-mechanics/DragRegimesScene.swift","mathDeps":["lib/physics/friction.ts"]}
]
```

Covers topics: motion-in-a-straight-line, newtons-three-laws, energy-and-work, momentum-and-collisions, circular-motion (except `NewtonsCannonScene`, deferred — animated), friction-and-drag.

## Checklist
- [ ] FreeFallScene
- [ ] InclinedPlaneScene
- [ ] KinematicsGraphScene
- [ ] TangentZoomScene
- [ ] FirstLawScene
- [ ] FMaScene
- [ ] ActionReactionScene
- [ ] WorkScene
- [ ] EnergyBowlScene
- [ ] PowerScene
- [ ] CollisionScene
- [ ] CenterOfMassScene
- [ ] AngularVelocityScene
- [ ] VelocityTriangleScene
- [ ] CentripetalForceScene
- [ ] FrictionRampScene
- [ ] TerminalVelocityScene
- [ ] DragRegimesScene

## Notes
(append per-scene divergence notes here)
