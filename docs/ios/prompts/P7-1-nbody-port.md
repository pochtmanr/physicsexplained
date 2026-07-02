# P7-1 — N-body physics port (PXMath)

Phase P7, prompt 1 of 3. Executor: Opus 4.8. Prerequisites: P4 (PXMath exists). Independent of P5/P6 — can run in parallel with them.

## Read first
- `/Users/roman/Developer/physics/lib/physics/n-body.ts` — the ENTIRE file (300 lines). Exports: `Body`, `NBodyOptions`, `bodyRadius`, `mergeBodies`, `bounceBodies`, `resolveCollisions`, `step`, `totalEnergy`, `totalMomentum`, `centerOfMass`.
- `/Users/roman/Developer/physics/docs/ios/05-scene-porting-playbook.md` §6 (math porting rules)
- `/Users/roman/Developer/physics/components/playgrounds/orbital-mechanics/schema.ts` and `presets.ts` (the data shapes P7-2/3 will consume — port the types now)
- `/Users/roman/Developer/physics/docs/ios/00-prd.md` §3.5 (playground scope)

## Task
1. Port `n-body.ts` to `ios/PhysicsPackages/Sources/PXMath/NBody.swift`: `NBody.Body` struct (value type), all ten exports as static/free functions with identical semantics — integrator order of operations, softening, collision handling (merge vs bounce per options), radius law, energy/momentum/COM formulas copied verbatim. `Double` throughout; `SIMD2<Double>` for positions/velocities if it keeps call sites clean (playbook §6).
2. Port `schema.ts` (playground state: bodies, camera, speed, collision mode, trails toggle — whatever it defines) and `presets.ts` data into `PXMath` (`NBodyPresets.swift`) as Swift constants — every preset, every value verbatim.
3. Golden tests (`Tests/PXMathTests/NBodyTests.swift`): generate reference fixtures by executing the TS original from the web repo root, e.g.
   ```bash
   npx tsx -e 'import {step,totalEnergy,resolveCollisions} from "./lib/physics/n-body"; /* build a 3-body preset, run 1000 steps, print JSON of positions+energy every 100 steps */'
   ```
   Check the printed JSON into `Tests/PXMathTests/Fixtures/nbody-goldens.json`. Assert the Swift port matches positions to 1e-9 after 1000 steps for: (a) a 2-body circular orbit, (b) a 3-body preset from `presets.ts`, (c) a merge collision case, (d) a bounce collision case. Also golden-test `totalEnergy`/`totalMomentum` conservation drift matches the TS values.
4. Determinism: same inputs → bit-identical trajectories run-to-run (no `Date`, no randomness in `step`).

## Do NOT
- No UI, no rendering, no camera/gesture code (P7-2/3).
- Do not "fix" the integrator or collision physics — parity first; note any suspected TS bug in the report instead.
- No new dependencies.

## Acceptance criteria
- `swift test --filter NBodyTests` green with all four golden scenarios.
- Preset data spot-check: number of presets and per-preset body counts match `presets.ts` exactly.

## Verify
```bash
npx tsx -e '...'   # fixture generation (paste the actual script used into the report)
swift test --package-path ios/PhysicsPackages --filter PXMathTests
```
Report: golden max-deviation numbers per scenario + the fixture-generation script.
