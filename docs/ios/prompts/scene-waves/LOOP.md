# Scene-porting loop prompt

Paste the block below as a fresh prompt each iteration (or drive it with `/loop`
— see the bottom). It is **self-orienting**: every run re-derives what's left
from `COVERAGE.md` + the wave manifests, ports the next small batch, verifies it
on the simulator, updates the trackers, and stops. Running it repeatedly marches
through every remaining scene until coverage hits the ceiling.

It is a thin driver over the two files that already own the method — the
**playbook** (`docs/ios/05-scene-porting-playbook.md`) and the **wave template**
(`docs/ios/prompts/scene-waves/wave-template.md`). Do not restate them; follow
them.

---

```
Continue the web-Canvas → native-SwiftUI scene port. This is one iteration of a
loop — do ONE small batch, verify it for real, update the trackers, then stop
and report. Do not try to finish everything in one run.

REPOS
- Web (source of truth): /Users/roman/Developer/physics  (the scenes, math, and
  scene_catalog live here)
- iOS (where you write Swift): /Users/roman/Developer/physics/ios  — its OWN git
  repo, nested in the web repo. It has an unrelated dirty working tree (P8 app
  work); leave that alone and do NOT commit. Your files are additive.

ORIENT (do this first, every run)
1. Read docs/ios/prompts/scene-waves/COVERAGE.md — the running total and the
   per-wave table.
2. Read docs/ios/05-scene-porting-playbook.md and
   docs/ios/prompts/scene-waves/wave-template.md — the method. Follow them exactly.
3. Pick the next batch of UNPORTED scenes, in this priority order:
   a. wave-01.md entries still unchecked (19–22: SphericalTriangleHolonomyScene,
      MetricEllipsesScene, RiemannVsFlatScene, RicciScalarHeatmapScene). These
      need the christoffel.ts + metric.ts PXMath ports first (parallel transport,
      holonomy, 2×2 metric utils) — port that math WITH goldens before the scenes.
   b. then wave-02.md (18 scenes, not started).
   c. then any later wave-NN.md manifest.
   Cross-check each candidate against SceneRegistry.registeredIds so you never
   re-port something already done.
   BATCH SIZE: 3–4 scenes, OR fewer if they share a math dependency you must port
   first (do the math + its goldens, then as many scenes as fit). Prefer scenes
   that share math so each run banks a reusable PXMath module.

PORT (per playbook §6, §7, §9; wave-template "Task")
- Math first: for each unique mathDeps path, port lib/physics/... → PXMath/... if
  absent (check PXMath/ first). Capture goldens by running the TS original
  (`npx tsx` from the web repo root; import via ABSOLUTE path) and assert the
  Swift to 1e-9 in Tests/PXMathTests/. Copy the web doc comments over.
- Scenes: translate each TSX to Swift per the playbook — SceneTokens (never
  hardcode a color), the GraphicsContext helpers, SceneTicker for animation
  (honor Reduce Motion for ambient/always-on motion; do NOT pause user-initiated
  playback), SceneControls/SceneSlider for controls (never .frame(width:) a
  control label — a test guards this). Shared-canvas scenes are thin
  ManifoldView / SpacetimeDiagramView wrappers.
- Register in the wave's SceneRegistry+<Wave>.swift; id EXACTLY the web export
  name. If a sub-batch file doesn't exist yet (e.g. entries 19–22 continue in
  SceneRegistry+SceneWave01b.swift), append to it; wire its register…() into
  SceneRegistry.registerAll() once.

STAY IN BOUNDS
- Edit ONLY under PXScenes, PXMath, their test targets, and the tracker docs
  (COVERAGE.md, the wave manifest). Nothing else. No new dependencies. No chrome
  inside scenes (SceneCard owns border/caption/background). Copy rates & geometry
  verbatim; note any mandated divergence (§3 background/DPR removal, etc.).

VERIFY (all four; this is the point of the loop)
1. swift test --package-path ios/PhysicsPackages   → green. Includes your goldens.
2. Bump the count guard: SceneWave01RegistrationTests.shippingCoverage asserts
   the exact non-harness registered count. Raise it by the batch size (it is
   registry-wide, so every registration moves it). The test title says the number
   too.
3. xcodebuild -project ios/PhysicsExplained.xcodeproj -scheme PhysicsExplained \
     -destination 'platform=iOS Simulator,name=iPhone 17 Pro' -skipMacroValidation build
   → BUILD SUCCEEDED. (macOS build already comes free from swift test.)
4. Eyes-on each new scene on the booted simulator (don't settle for
   code-complete):
     xcrun simctl install booted "<DerivedData>/…/Physics.explained.app"
     # bundle id: com.physicsexplained.app ; url scheme: physicsexplained
     # IMPORTANT: the in-app router won't re-navigate between scene DETAILS via a
     # deep link while one is open. terminate first, then cold-open each:
     xcrun simctl terminate booted com.physicsexplained.app
     xcrun simctl openurl booted "physicsexplained://gallery/scene/<SceneId>"
     xcrun simctl io booted screenshot /tmp/<SceneId>.png
   Open each screenshot and confirm: geometry/labels/colors match the web intent,
   controls read the right initial values, a numeric readout matches its golden if
   the scene has one, no chrome, nothing clipped that shouldn't be. Note anything
   off. (Full DoD incl. light-theme + web snapshot side-by-side is in playbook
   §9.2; do at least the dark-theme eyes-on here.)

TRACK & STOP
- Check off the ported scenes in the wave manifest; append a per-scene notes row
  (divergences) and a short session block, mirroring the existing entries.
- Update COVERAGE.md: the headline N/503, the wave row's ported count/date, and
  the Verification count line.
- Report: a table of scenes done this run with ✅/⚠️ + one-line notes, the new
  coverage number, and what the NEXT run should pick up. Do NOT commit — leave
  the tree for me to review. Then stop.

KNOWN GOTCHAS (don't rediscover these)
- swift build/test run on macOS; SwiftUI compiles there. Scene files import PXMath
  + SwiftUI; ManifoldChartPoint / Manifold3D / Sphere live in PXMath (Geometry).
- SwiftUI can't write state from a TimelineView body — for "auto-rotate but
  draggable", compose rotation as manualState + tickerPhase on a .fixed rotation
  (see SphereManifoldScene) rather than mutating the slider value.
- ManifoldView draws each tangent-arrow label at the arrow tip; long right-side
  labels can clip on a narrow phone. That's the shared view's behavior (the
  __manifold_demo has it too) — a fix belongs in ManifoldView, not the wrappers.
- Antipodal/degenerate inputs: match the web's fallback branch exactly, and golden
  it.
```

---

## Running it as a loop

- **Manual:** paste the block above at the start of each session. Because it
  re-orients from `COVERAGE.md` every time, three pastes port ~three batches.
- **`/loop`:** `/loop <paste the block>` and let the model self-pace — it will
  do a batch, and you review between iterations. Keep iterations reviewable;
  don't crank the batch size up.
- **Stop condition:** when `COVERAGE.md`'s headline reaches the real ceiling
  (503 minus the playbook §10 JSXGraph scenes that wait on native `PlotView`),
  or when the only unported ids left are those §10 scenes. The loop prompt will
  say so in its report when there's nothing left it's allowed to port.
