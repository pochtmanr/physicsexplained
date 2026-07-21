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

`[x]` = registered and compiling. `(P4)` = already ported by an earlier P4 batch,
not re-done this wave. `(P6-2)` = ported in this session. **Code-complete /
compiles; on-device visual pass outstanding for the eleven P6-2 scenes** (user
runs the simulator, per project constraint — handed off).

- [x] FreeFallScene — (P4) `registerKinematics()`
- [x] InclinedPlaneScene — (P4) `registerKinematics()`
- [x] KinematicsGraphScene — (P4) `registerKinematics()`
- [x] TangentZoomScene — (P4) `registerKinematics()`
- [x] FirstLawScene — (P6-2)
- [x] FMaScene — (P6-2)
- [x] ActionReactionScene — (P4) `registerWave01()`
- [x] WorkScene — (P6-2)
- [x] EnergyBowlScene — (P4) `registerWave01()`
- [x] PowerScene — (P6-2)
- [x] CollisionScene — (P4) `registerWave01()`
- [x] CenterOfMassScene — (P6-2)
- [x] AngularVelocityScene — (P6-2)
- [x] VelocityTriangleScene — (P6-2)
- [x] CentripetalForceScene — (P6-2)
- [x] FrictionRampScene — (P6-2)
- [x] TerminalVelocityScene — (P6-2)
- [x] DragRegimesScene — (P6-2)

## Notes

### Session 2026-07-21 — P6-2 (eleven classical-mechanics ports)

**Scope correction.** The manifest lists eighteen scenes, but **seven were
already shipping** from earlier P4 batches (the four kinematics essay figures via
`registerKinematics()`; `ActionReactionScene` / `CollisionScene` /
`EnergyBowlScene` via the curated-catalog `registerWave01()`). The porting work
this wave adds is the **eleven** remaining, all in
`PXScenes/Scenes/classical-mechanics/`. `swift test` green (**549 tests**, up from
540 — the two new math golden suites); `swift build --package-path
ios/PhysicsPackages` clean. `SceneRegistry` count 38 → 49; the guard in
`SceneWave01RegistrationTests` was bumped to match.

**Registration file: `SceneRegistry+SceneWave02.swift`** (`registerSceneWave02()`,
wired into `registerAll()`). The manifest header names `SceneRegistry+Wave02.swift`,
but P4-4 already owns that filename for the five curated **electromagnetism**
catalog scenes — the same P4-vs-P6 numbering collision wave 01 hit at `Wave01`.
Resolved identically: `SceneWave02`.

**The "18 STATIC scenes" premise is wrong.** The manifest says "no `useSceneTick`
— verified", but ten of the eighteen animate via `useAnimationFrame` (a different
rAF hook the check missed); only `DragRegimesScene` is genuinely static
(`useEffect`). Wave 01's own notes already referenced "wave 02's always-on
animations", so this was known elsewhere. Handled per playbook §2.5 — `SceneTicker`
gives the accumulated-seconds phase and each scene derives its motion from it (the
web `t` is elapsed seconds, matching `SceneTicker`). Following the sibling P4-3
ports (`ActionReactionScene`, `CollisionScene`), the always-on mechanics
animations do **not** pause under Reduce Motion — the web scenes don't check it
either.

**Math ported.** `PXMath/ClassicalMechanics/{CircularMotion,Friction}.swift`
(`newton.ts`/`energy.ts`/`momentum.ts` were already present). Goldens in
`Tests/PXMathTests/{CircularMotion,Friction}Tests.swift`, captured from the TS via
`npx tsx` at 1e-9 (`orbitalVelocity`/the drag closed-forms to 1e-6 for the LEO/exp
magnitudes). `CircularMotion` mirrors the web `tests/physics/circular-motion.test.ts`;
`friction.ts` had no web unit suite, so those goldens are the transcription check.

**Divergences that apply to the whole batch** (beyond the standard three — no
`clearRect`, no opaque bg fill, hex → tokens):
- **Hex → token map** (nearest token, §3): `#6FB8C6` → cyan, `#FF6ADE` /
  `#FF6BCB` → magenta, `#F5C451` / `#E4C27A` → amber (the amber map follows
  `ActionReactionScene`), `#FF6B6B` → red, `#E6EDF7` → textBright, `#A0A8B4` (a
  neutral block grey with no token) → textDim.
- **The floating HTML readout panels** in the three circular scenes
  (`AngularVelocity`, `VelocityTriangle`, `Centripetal`) become **SwiftUI
  overlays** (`.overlay(alignment:)`), not on-canvas text — faithful to the web,
  which stacks an absolutely-positioned HTML panel over the canvas, and it keeps
  the text crisp/unscaled. Their CSS vars read raw (`--color-fg-1` → textDim,
  `--color-fg-3` → textMute, `--color-fg-4` → textFaint border), which is *not*
  the canvas `ThemeColors` remapping — the panels are HTML, the canvas is not.
- **Fixed-size canvases** (`AngularVelocity` 360×280, `VelocityTriangle` 320×320,
  `Centripetal` 480×360) are drawn in their design coordinates and painted with a
  single uniform, centred `scaleBy` so every pixel constant is copied verbatim,
  then scaled to fill the reader's column (§2.3 — the fixed width/height props are
  dropped, the wave-01 philosophy). The responsive scenes use `.sceneAspect(ratio:
  maxHeight: minHeight: 0)` with the web `RATIO`/`MAX_HEIGHT` and draw directly in
  `size` coordinates.
- Canvas `shadowBlur: N` glow → `.addFilter(.shadow(radius: N/2))` (blur is 2σ),
  the established `DampedPendulumScene`/`CoupledPendulumScene` convention.
- `<input type="range">` rows → `SceneControls` + `SceneSlider`; reset-on-slider
  (`useEffect(reset, [deps])`) → `.id(resetToken)` bumped in `.onChange`.

**Per-scene:**

| scene | notes |
|---|---|
| FirstLawScene | Coast + rest-then-restart, and the frictionless wrap, are a modulo cycle on `t` (`Newton.coastWithFriction` is closed-form in the local time). |
| FMaScene | Loop is `t % (tEnd + 0.5)`; motion is exact constant-acceleration. Ball glow `shadowBlur 14` → `radius 7`. |
| WorkScene / PowerScene | No controls, no `lib/physics` — bars are loop fractions derived from `t`. |
| CenterOfMassScene | Glide + spin both from `t`; the mass labels' `textBaseline:"middle"` + `center` → `.center` anchor. |
| AngularVelocityScene | **The one dt-integrator (playbook §5).** The web integrates `phase += ω·dt` so dragging T changes speed without a jump; `SceneTicker`'s rate is fixed per run, so this uses a raw `TimelineView` advancing `@State` phase in `.onChange(of: timeline.date)`. No sibling precedent existed; §5 documents the pattern. |
| VelocityTriangleScene / CentripetalForceScene | `theta = (t % PERIOD)/PERIOD · 2π`; the web's per-scene `arrow()` (atan2 ±π/6 head, distinct from the toolkit `drawArrow`) is transcribed privately. Their readouts were constant, so they are static overlays. Centripetal's `enum Body` was renamed `BodyKind` — `Body` collides with SwiftUI's `View.Body`. |
| FrictionRampScene | The web Euler integrator → exact closed form (`a` is constant while sliding, so `s = ½·a·t²`) with the same 0.8 s restart beat as a modulo. |
| TerminalVelocityScene | `velocityLinearDrag` closed-form; auto-replay via `t % cycle`. Open (stroked, unfilled) drag/gravity arrowheads kept verbatim; rotated `v(t)` axis label via a translated+rotated context copy. Web `<p>` caption kept as a footnote `Text`. |
| DragRegimesScene | The genuinely static scene (`useEffect`) — a plain `Canvas`, no ticker, redrawing on b/k. Log-log `toPx`, per-decade grid/labels, three curves + crossover + legend transcribed; `<p>` caption kept. |

**Outstanding:** on-device Gallery deep-link screenshots (light + dark) and
side-by-side vs each `scene_catalog.snapshot_url`, for the eleven P6-2 scenes —
the user drives the simulator (project constraint), so this is handed off, not
done here.
