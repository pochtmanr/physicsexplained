# Native scene coverage

Running total of web Canvas scenes with a native SwiftUI port. Updated at the end of every P6 session.

**Native: 49 / 503 registered web scenes.**

The denominator is `lib/content/simulation-registry.ts`. It includes the playbook §10 JSXGraph scenes, which are not ctx translations and wait on the native `PlotView` — they will never be ported by this process, so the ceiling is below 503.

| wave | scenes | ported | date | notes |
|---|---|---|---|---|
| P4 wave 01 | 6 | 6 | 2026-07-18 | Curated Ask catalog, classical mechanics. `SceneRegistry+Wave01.swift`. |
| P4 wave 02 | 5 | 5 | 2026-07-18 | Curated Ask catalog, electromagnetism. `SceneRegistry+Wave02.swift`. |
| scene wave 01 | 22 | 15 | 2026-07-19 | Entries 1–15, the SpacetimeDiagram wrappers. `SceneRegistry+SceneWave01.swift`. |
| scene wave 01b | 7 | 7 | 2026-07-21 | **Wave 01 complete.** Entries 16–18 (Sphere/Tangent/Geodesic) + 19–22 (the curvature scenes: `SphericalTriangleHolonomyScene`, `MetricEllipsesScene`, `RiemannVsFlatScene`, `RicciScalarHeatmapScene`). `SceneRegistry+SceneWave01b.swift`; new math `PXMath/Geometry/{Sphere,Christoffel,Metric}.swift`. All screenshotted on-device. |
| scene wave 02 | 18 | 18 | 2026-07-21 | **Complete.** P6-2 ported the 11 classical-mechanics scenes not already shipping; the other 7 were already done (4 kinematics + 3 curated-catalog). `SceneRegistry+SceneWave02.swift`; new math `PXMath/ClassicalMechanics/{CircularMotion,Friction}.swift`. Registry 38→49. On-device visual pass handed off. |
| (not a wave) P7-2 | 1 | 1 | 2026-07-19 | `OrbitalMechanicsPlayground` — the Play tab, registered so the catalog id resolves. `SceneRegistry+Playground.swift`. |
| (not a wave) kinematics | 4 | 4 | 2026-07-21 | Module-1 essay figures FIG.01a–d (`InclinedPlane`, `TangentZoom`, `FreeFall`, `KinematicsGraph`) — authored in `motion-in-a-straight-line` MDX, not the curated catalog. `SceneRegistry+Kinematics.swift`. |

## Two numbering schemes, both called "wave"

P4's waves are **catalog batches** — the curated `lib/ask/scene-catalog.ts` entries, grouped by branch. P6's are **porting waves** — the `wave-NN.md` manifests in this directory. They are independent and they collide at 01 and 02, so the P6 registration files are named `SceneRegistry+SceneWaveNN.swift` and the manifests were amended to match. Nothing else distinguishes them; both register into the same `SceneRegistry`.

## Verification

`SceneRegistry.registeredIds.count` is 52 in a Debug build and 49 in Release. The three extra are harnesses, not figures, and all carry a `__` id prefix: `__demo`, plus the two shared-canvas demos `__spacetime_demo` and `__manifold_demo`. `SceneWave01RegistrationTests.shippingCoverage` asserts the 49 by filtering that prefix, so this file and the registry cannot drift apart silently.

Note that the assertion is registry-wide but lives in a wave suite, so a registration from outside the wave process moves it — P7-2's playground took 26 to 27, `registerKinematics()` (the four module-1 essay figures) took 27 to 31, `registerSceneWave01b()` took 31 to 34 (the first three Manifold wrappers) and then 34 to 38 (its four curvature scenes, completing wave 01b). The guard is overdue to move to its own file, out of the wave suite.

P6-1 found that `registerSharedCanvasDemos()` was written in P4-2 but never called, leaving both shared canvases unreachable from the Gallery despite the deep links in their doc comments. It is now called from `registerAll()`.

```bash
swift test --package-path ios/PhysicsPackages   # per-wave registration suites assert the ids
```
