# P4-3 — Curated scenes, part A (mechanics 6)

**Phase**: P4 · **Sequence**: 17 · **Executor**: Opus 4.8 · **Prerequisites**: P4-1 (P4-2 not required).

The curated catalog (`lib/ask/scene-catalog.ts`) has 15 entries. This session ports the 6 classical-mechanics **Canvas** scenes. (3 curated entries are JSXGraph — `PhasePortrait`, `EccentricitySlider`, `EllipseConstruction` — they need the native PlotView and move to P5/Wave 2; `OrbitalMechanicsPlayground` is P7.)

## Read first

- `/Users/roman/Developer/physics/docs/ios/05-scene-porting-playbook.md` §3 (translation table), §4 (worked static example — your template), §5 (animated pattern), §6 (math porting), §9.2 (definition of done)
- `/Users/roman/Developer/physics/lib/ask/scene-catalog.ts` (params schemas — these 6 accept AI params; support the same props)

## Scene manifest (source → target)

| id | source (components/physics/) | target (PXScenes/Sources/PXScenes/Scenes/classical-mechanics/) |
|---|---|---|
| `ActionReactionScene` | `action-reaction-scene.tsx` | `ActionReactionScene.swift` |
| `BeatsScene` | `beats-scene.tsx` | `BeatsScene.swift` |
| `CollisionScene` | `collision-scene.tsx` | `CollisionScene.swift` |
| `CoupledPendulumScene` | `coupled-pendulum-scene.tsx` | `CoupledPendulumScene.swift` |
| `DampedPendulumScene` | `damped-pendulum-scene.tsx` | `DampedPendulumScene.swift` |
| `EnergyBowlScene` | `energy-bowl-scene.tsx` | `EnergyBowlScene.swift` |

## Task

1. For EACH scene, in order: read the TSX fully; port its `lib/physics/*` imports to PXMath first (with golden tests per playbook §6 — compute goldens by hand-executing the TS); port the component per §3–5; wire props/params per the catalog's zod schema (typed init with defaults); register in `SceneRegistry` under the exact id; **build after each scene**.
2. Definition of done per scene = playbook §9.2 checklist (compiles, registered, Gallery renders, side-by-side vs `snapshot_url`, motion matches for animated, theme flip, no chrome).
3. After all 6: screenshot each via Gallery deep link into `/tmp/p4-3/`.

## Do NOT

- No improvisation on visuals — the snapshot is the reference; divergence only where the playbook prescribes (tokens, DPR removal).
- Do not port scenes not on the manifest. Do not touch PXBlocks/PXAPI.

## Acceptance criteria

- 6 scenes registered + rendering natively in Gallery; `FigureView` (via SceneResolver) now prefers them in reader topics that embed them.
- PXMath goldens for every ported module pass; `swift test` green.
- 6 screenshots captured; animated scenes (Beats, CoupledPendulum, DampedPendulum, Collision) visibly animate and pause off-screen.

## Verify

```bash
swift build --package-path ios/PhysicsPackages   # after EVERY scene
swift test --package-path ios/PhysicsPackages --filter PXMathTests
for id in ActionReactionScene BeatsScene CollisionScene CoupledPendulumScene DampedPendulumScene EnergyBowlScene; do
  xcrun simctl openurl booted "physicsexplained://gallery/scene/$id" && sleep 2 && xcrun simctl io booted screenshot /tmp/p4-3/$id.png
done
```
