# P4-4 — Curated scenes, part B (electromagnetism 5) + reader integration

**Phase**: P4 · **Sequence**: 18 · **Executor**: Opus 4.8 · **Prerequisites**: P4-3.

## Read first

- `/Users/roman/Developer/physics/docs/ios/05-scene-porting-playbook.md` §3–6, §9.2 (same discipline as P4-3)
- `/Users/roman/Developer/physics/lib/ask/scene-catalog.ts` (params for these 5)
- `/Users/roman/Developer/physics/docs/ios/04-block-rendering-spec.md` §4 (figure resolution — native now first)

## Scene manifest (source → target `Scenes/electromagnetism/`)

| id | source (components/physics/) |
|---|---|
| `FieldLinesPointScene` | `field-lines-point-scene.tsx` |
| `FieldLinesDipoleScene` | `field-lines-dipole-scene.tsx` |
| `GaussianSurfacesScene` | `gaussian-surfaces-scene.tsx` |
| `EquipotentialLinesScene` | `equipotential-lines-scene.tsx` |
| `ParallelPlateCapacitorScene` | `parallel-plate-capacitor-scene.tsx` |

## Task

1. Port the 5 EM scenes with the same per-scene discipline as P4-3 (math → goldens → component → register → build → snapshot-compare). Field-line tracing math goes to PXMath (`FieldLines.swift` or as the sources structure it).
2. Reader integration pass: open the reader topics embedding any of the 11 native scenes (find via `scene_catalog.topic_slugs` for the ported ids) and verify native rendering inside SceneCard, params from the figure block's `props` applied, fullscreen expand works with live animation.
3. Gallery polish: LIVE badge counts (11 native + snapshots), sort natives first.
4. Write `docs/ios/P4-COMPLETION.md`: per-scene checklist results, deviations, fps notes on the heaviest scene (field lines).

## Do NOT

- Same guardrails as P4-3. Field-line integration must not run on the main thread per frame if it's expensive — precompute paths on param change (playbook §5 pattern).

## Acceptance criteria

- 11 total native curated scenes; every P4 phase acceptance item in `07-implementation-phases.md` passes (Gallery count, side-by-sides, sliders, fullscreen, FigureView preference).
- 60fps on the animated EM scenes in a Release-config run (`xcodebuild -configuration Release` + manual check or Instruments if in doubt).
- `swift test` green; screenshots in `/tmp/p4-4/`.

## Verify

```bash
swift test --package-path ios/PhysicsPackages
xcodebuild -project ios/PhysicsExplained.xcodeproj -scheme PhysicsExplained \
  -configuration Release -destination 'platform=iOS Simulator,name=iPhone 17 Pro' build
for id in FieldLinesPointScene FieldLinesDipoleScene GaussianSurfacesScene EquipotentialLinesScene ParallelPlateCapacitorScene; do
  xcrun simctl openurl booted "physicsexplained://gallery/scene/$id" && sleep 2 && xcrun simctl io booted screenshot /tmp/p4-4/$id.png
done
```
