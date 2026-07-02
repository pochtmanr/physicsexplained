# P7-2 — Playground canvas: rendering, camera, trails, sim loop

Phase P7, prompt 2 of 3. Executor: Opus 4.8. Prerequisites: P7-1 (NBody + presets in PXMath), P4 (SceneTokens).

## Read first
- Web sources (structure to mirror, rendering to translate per the playbook §3 table):
  `/Users/roman/Developer/physics/components/playgrounds/orbital-mechanics/draw.ts` (282 lines),
  `camera.ts` (62) + `camera.test.ts`, `trails.ts` (56) + `trails.test.ts`, `palette.ts` (39) + `palette.test.ts`,
  `n-body-canvas.tsx` (composition + sim loop)
- `/Users/roman/Developer/physics/docs/ios/05-scene-porting-playbook.md` §2.5 (ticker), §3 (translation table)
- `/Users/roman/Developer/physics/docs/ios/00-prd.md` §3.5, `03-design-system.md` (HUD text, accents)

## Task
1. New feature module `ios/PhysicsPackages/Sources/PXScenes/Playground/` (PXScenes may not import PXAPI — the playground is pure local state): port as separate files mirroring the web split:
   - `PlaygroundCamera.swift` (port `camera.ts`: world↔screen transforms, zoom about a point, pan) + tests ported from `camera.test.ts`;
   - `PlaygroundTrails.swift` (ring-buffer trails per body, fading alpha, cap per `trails.ts`) + tests from `trails.test.ts`;
   - `PlaygroundPalette.swift` (body color assignment rules from `palette.ts`, mapped through `SceneTokens` scene accents) + tests from `palette.test.ts`;
   - `PlaygroundRenderer.swift` (port `draw.ts` onto `GraphicsContext`: starfield/background wash, bodies with radius law `bodyRadius`, velocity vectors, trails, selection highlight, predicted-path trace if `draw.ts` has one — follow the source).
2. `PlaygroundModel` (`@MainActor @Observable`): sim state (`[NBody.Body]`, running, speed multiplier, collision mode), `TimelineView(.animation)`-driven fixed-timestep stepping (accumulate wall dt × speed, step in fixed increments per the web loop in `n-body-canvas.tsx`; pause = no stepping, no CPU), reset-to-preset, HUD values (`totalEnergy`, `totalMomentum`, body count, sim time).
3. `PlaygroundView`: full-bleed Canvas + HUD overlay (mono readouts per design system) + transport controls (play/pause, reset, speed 0.25×–4×, collision merge/bounce toggle, trails toggle) + preset picker (from `NBodyPresets`). Static camera this prompt (interactive gestures land in P7-3); wire the Play tab to it.
4. Gallery: add the playground behind a deep link for screenshotting.

## Do NOT
- No gestures yet (P7-3) — camera fixed at the preset's initial framing.
- No URL/state sharing (00-prd.md cutline), no info-panel content port.
- Don't deviate from `draw.ts` visual composition beyond documented SceneTokens substitutions.

## Acceptance criteria
- Ported unit tests (camera/trails/palette) green.
- Each preset runs: orbits qualitatively match the web playground side-by-side (record both, same preset, ~30 s).
- Pause → zero sim work (verify no CPU churn in Instruments); speed changes take effect smoothly; reset restores exact preset state.
- 50 bodies + trails ≥ 60 fps in a Release/profile build on simulator (spot-check; device pass is P8).

## Verify
```bash
swift test --package-path ios/PhysicsPackages
xcodebuild -project ios/PhysicsExplained.xcodeproj -scheme PhysicsExplained \
  -destination 'platform=iOS Simulator,name=iPhone 17 Pro' build
xcrun simctl io booted screenshot /tmp/p7-2-playground.png
```
Report: screenshot per preset + fps observation + any renderer divergences.
