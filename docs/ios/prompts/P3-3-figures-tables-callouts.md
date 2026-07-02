# P3-3 — Figures (snapshots), callouts, SceneCard integration

**Phase**: P3 · **Sequence**: 12 · **Executor**: Opus 4.8 · **Prerequisites**: P3-2.

## Read first

- `/Users/roman/Developer/physics/docs/ios/04-block-rendering-spec.md` §4 (figure resolution chain: native → snapshot → placeholder — native arrives in P4; this session implements snapshot + placeholder)
- `/Users/roman/Developer/physics/docs/ios/03-design-system.md` §3 (SceneCard chrome — built in P1-2)
- `/Users/roman/Developer/physics/docs/ios/02-api-contracts.md` §2.2 (`scene_catalog.snapshot_url`, `fig_label`), §9 (image resolution)

## Task

1. `FigureView(content: FigureContent, caption: String?)` in PXBlocks:
   - `image` kind → Nuke `LazyImage` with `ImageURLResolver`, aspect-fitting, inside `SceneCardFrame` with caption.
   - `simulation` kind → `SceneResolver` protocol (PXBlocks-owned, implementation injected): at this phase resolves via scene catalog `snapshot_url` → snapshot image inside `SceneCardFrame` with the doc-specified "STATIC FIGURE" HUD tag; unknown id / no snapshot → designed placeholder card (mono id + branch tint) per 04 §4. Native branch is a protocol hook P4 fills.
   - Caption composition: `fig_label` eyebrow + caption text per SceneCard spec.
2. Fullscreen expand for figures (tap → sheet with zoomable image; shared component reused by native scenes in P4).
3. `CalloutView`: the 5 variants with their `03-design-system.md` colors/icons, recursive `BlockListView` children.
4. Wire both into `BlockListView`, replacing P3-2 placeholders.
5. Tests: SceneResolver fallback ordering (native stub > snapshot > placeholder) as pure logic tests.

## Do NOT

- Do not import PXScenes into PXBlocks directly for resolution — only via the `SceneResolver` protocol (dependency flow, `01-architecture.md` §2).
- Scenes/snapshots never draw chrome — SceneCardFrame wraps.
- No pinch-zoom gesture libs; simple magnification gesture is enough at MVP.

## Acceptance criteria

- The pendulum fixture topic renders its simulation figures as snapshots in SceneCard chrome with captions and the STATIC FIGURE tag; image figures load; a bogus scene id shows the placeholder.
- All 5 callout variants correct in dark/light (Gallery section).
- `swift test` green.

## Verify

```bash
swift test --package-path ios/PhysicsPackages
xcodebuild -project ios/PhysicsExplained.xcodeproj -scheme PhysicsExplained \
  -destination 'platform=iOS Simulator,name=iPhone 17 Pro' build
xcrun simctl io booted screenshot /tmp/p3-3-figures.png
```
