# P7-3 — Playground gestures + interaction

Phase P7, prompt 3 of 3. Executor: Opus 4.8. Prerequisites: P7-2.

## Read first
- Web sources (behavior to reproduce with native gestures, not a literal port):
  `/Users/roman/Developer/physics/components/playgrounds/orbital-mechanics/gestures.ts` (218 lines — the interaction spec),
  `hit-test.ts` (38) + `hit-test.test.ts`, `controls.tsx` + `info-panel.tsx` (control semantics only)
- `/Users/roman/Developer/physics/docs/ios/07-implementation-phases.md` §P7 acceptance
- `/Users/roman/Developer/physics/docs/ios/00-prd.md` §3.5

## Task
1. `PlaygroundHitTest.swift`: port `hit-test.ts` (screen-space body picking with touch-friendly minimum radius) + its tests. Increase the pick radius to ≥ 22 pt for touch if the web value is mouse-sized — note the divergence.
2. Gesture layer on `PlaygroundView` (SwiftUI gestures; study `gestures.ts` for the interaction rules — thresholds, drag-to-fling vector math, camera anchoring — and reproduce the same feel):
   - **Pan** (one finger on empty space): moves the camera; momentum/deceleration optional — match the web if it has it.
   - **Pinch**: zoom about the pinch centroid (the world point under the fingers stays under them — use `PlaygroundCamera.zoom(about:)` from P7-2; this is the P7 acceptance test).
   - **Drag on a body**: pauses that body's integration, shows the fling velocity vector (arrow from body to finger, scaled per `gestures.ts`), release = apply velocity (drag-to-fling). Cancel with a second finger.
   - **Tap on a body**: select → HUD shows its mass/speed/radius; tap empty space deselects.
   - **Tap-and-hold on empty space** (if `gestures.ts` supports body spawning — follow the source; if not, add nothing).
   - Simultaneity rules: pinch beats pan beats body-drag; no gesture fights (test on device/simulator with two-finger interactions).
3. Wire remaining controls to parity with the web `controls.tsx` semantics (body add/remove if present, follow-selected-body camera mode if present — follow the source, cut anything tied to URL sharing).
4. Accessibility: transport controls labeled; playground exempt from Dynamic Type reflow but controls are not.
5. Run the full P7 acceptance list from `07-implementation-phases.md` and fix failures.

## Do NOT
- No UIKit gesture recognizers unless SwiftUI's are demonstrably insufficient (justify in report if used).
- No share/encode-state features.
- Do not let gesture state mutate physics state off the main actor.

## Acceptance criteria (P7 gate)
- Fling vector matches the drag direction/magnitude (visual check + a unit test on the vector math).
- Zoom anchors under fingers at all zoom levels; pan+zoom composed feels continuous.
- Selecting/dragging one body while 49 others simulate stays ≥ 60 fps (profile build).
- Preset orbits still match the web after the gesture layer (no accidental state mutation at rest).

## Verify
```bash
swift test --package-path ios/PhysicsPackages
xcodebuild -project ios/PhysicsExplained.xcodeproj -scheme PhysicsExplained \
  -destination 'platform=iOS Simulator,name=iPhone 17 Pro' build
xcrun simctl io booted screenshot /tmp/p7-3-fling.png   # mid-drag with vector visible
```
Report: manual gesture checklist (each gesture, pass/fail, device or simulator) + divergences from `gestures.ts`.
