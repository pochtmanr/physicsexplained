# P4-2 — Shared canvases: SpacetimeDiagramView + ManifoldView

**Phase**: P4 · **Sequence**: 16 · **Executor**: Opus 4.8 · **Prerequisites**: P4-1.

## Read first

- `/Users/roman/Developer/physics/docs/ios/05-scene-porting-playbook.md` §8 (both prop APIs transcribed + intentional divergences: tokens-derived palette for Manifold, no fixed width/height props)
- `/Users/roman/Developer/physics/components/physics/_shared/SpacetimeDiagramCanvas.tsx` (full source — port target)
- `/Users/roman/Developer/physics/components/physics/_shared/ManifoldCanvas.tsx` (full source — port target)

## Task

1. Port `SpacetimeDiagramView` per playbook §8.1: axes, light-cone, worldlines, events, simultaneity slices — the full prop surface transcribed there; PXMath gets any pure helpers the TSX embeds (extract, don't inline).
2. Port `ManifoldView` per §8.2: the projection/grid math to PXMath (`Manifold3D` or as playbook names it), palette derived from `SceneTokens` (NOT the web's hardcoded dark palette — documented divergence).
3. For each: a Gallery demo instance exercising every prop group; register demo ids.
4. Tests: projection math goldens — capture 5–10 input→output values by hand-executing the TS math (read the TSX, compute, assert same in Swift).

## Do NOT

- Do not port any dependent scene yet (P6 wave does the 22 wrappers) — canvases + demos only.
- Do not add props the web version lacks; do not keep the legacy fixed width/height props (divergence per §8).

## Acceptance criteria

- Both Gallery demos visually match their web counterparts (compare against any spacetime/manifold scene snapshot for character: axis style, cone shading, grid warping).
- Projection goldens pass; `swift test` green.
- Theme flip: both render correctly in light mode (Manifold explicitly — the web one is dark-only; ours must not be).

## Verify

```bash
swift test --package-path ios/PhysicsPackages --filter PXMathTests
xcodebuild -project ios/PhysicsExplained.xcodeproj -scheme PhysicsExplained \
  -destination 'platform=iOS Simulator,name=iPhone 17 Pro' build
xcrun simctl openurl booted "physicsexplained://gallery/scene/__spacetime_demo"; xcrun simctl io booted screenshot /tmp/p4-2-st.png
```
