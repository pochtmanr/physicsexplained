# P4-1 — PXScenes toolkit

**Phase**: P4 · **Sequence**: 15 · **Executor**: Opus 4.8 · **Prerequisites**: P1-2 (PXDesign); parallel-safe with P3.

## Read first

- `/Users/roman/Developer/physics/docs/ios/05-scene-porting-playbook.md` §1–3 (architecture, toolkit mapping, translation table) — this is THE spec; the Swift APIs are fully defined there
- `/Users/roman/Developer/physics/components/physics/_shared/scene-tokens.ts` (the web original — geometry truth for draw helpers)
- `/Users/roman/Developer/physics/docs/ios/03-design-system.md` §1.3 (scene palette contract)

## Task

1. Implement in PXScenes, matching playbook names exactly: `SceneTokens` (§2.1 — environment-resolved from PXColors), `GraphicsContext` extensions `drawArrow/drawDivider/drawHudReadout/drawSectionTitle` (§2.6 — transcribed geometry: arrowhead math, measure+4pt gap, lineHeight−18 return convention), `.sceneAspect(...)` modifier (§2.3 — web clamp semantics, defaults 720/380/460/320), `SceneTicker` pattern (§2.5 — TimelineView(.animation) with pause/resume `phaseAtPause` state as spec'd).
2. `PXScene` protocol + `SceneRegistry` (§9.1): id-keyed (ids EXACTLY match web `SceneId` strings), returns `AnyView` factories with optional params dictionary; registration via per-branch `registerAll()` functions.
3. `SceneControlRow` (§7): the standard slider+readout row (label mono style, value formatting `String(format:)`).
4. `SnapshotFigureView` moves/finalizes here if P3-3 stubbed it elsewhere; `SceneResolver` production implementation: registry → snapshot → placeholder; inject into PXBlocks.
5. Gallery: scene browser section — grouped by branch, LIVE/SNAPSHOT badge, deep link `physicsexplained://gallery/scene/<id>` opens the scene fullscreen (per `01-architecture.md` §7).
6. Tests: registry resolution ordering; drawArrow/HUD geometry pure-function tests (extract geometry to testable functions).

## Do NOT

- No PXAPI import in PXScenes (dependency flow). No scene chrome. No hardcoded colors — tokens only.
- Do not deviate from playbook API names/signatures — every later wave prompt depends on them verbatim.

## Acceptance criteria

- `swift test` green (geometry + registry tests).
- Gallery scene browser lists snapshot entries for the full catalog (from P2-2 data) and renders a trivial built-in demo `PXScene` (e.g. a test pattern using every draw helper) natively — visible arrows/HUD/dividers matching playbook geometry.
- Deep link to the demo scene works: `xcrun simctl openurl booted "physicsexplained://gallery/scene/__demo"`.

## Verify

```bash
swift test --package-path ios/PhysicsPackages
xcodebuild -project ios/PhysicsExplained.xcodeproj -scheme PhysicsExplained \
  -destination 'platform=iOS Simulator,name=iPhone 17 Pro' build
xcrun simctl openurl booted "physicsexplained://gallery/scene/__demo" && xcrun simctl io booted screenshot /tmp/p4-1-demo.png
```
