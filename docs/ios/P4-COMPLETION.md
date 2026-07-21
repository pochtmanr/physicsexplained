# P4 — Curated scene ports: completion report

**Phase**: P4 · **Prompts**: P4-1 (toolkit), P4-3 (mechanics), P4-4 (electromagnetism)
**Status**: 11 curated scenes native. Code complete; on-device visual pass outstanding (see [Outstanding](#outstanding)).

---

## 1. Coverage

The curated Ask catalog (`lib/ask/scene-catalog.ts`) has 15 entries. Eleven are
Canvas scenes and all eleven are now native:

| # | id | branch | wave |
|---|---|---|---|
| 1 | `ActionReactionScene` | classical-mechanics | 01 |
| 2 | `BeatsScene` | classical-mechanics | 01 |
| 3 | `CollisionScene` | classical-mechanics | 01 |
| 4 | `CoupledPendulumScene` | classical-mechanics | 01 |
| 5 | `DampedPendulumScene` | classical-mechanics | 01 |
| 6 | `EnergyBowlScene` | classical-mechanics | 01 |
| 7 | `FieldLinesPointScene` | electromagnetism | 02 |
| 8 | `FieldLinesDipoleScene` | electromagnetism | 02 |
| 9 | `GaussianSurfacesScene` | electromagnetism | 02 |
| 10 | `EquipotentialLinesScene` | electromagnetism | 02 |
| 11 | `ParallelPlateCapacitorScene` | electromagnetism | 02 |

The remaining four are **not** Canvas and are out of P4's scope by design:
`PhasePortrait`, `EccentricitySlider` and `EllipseConstruction` are JSXGraph and
wait on the native `PlotView` (playbook §10); `OrbitalMechanicsPlayground` is P7.

Registration lives in `SceneRegistry+Wave01.swift` and `SceneRegistry+Wave02.swift`
— one file per wave, so concurrent waves never collide in a merge.

---

## 2. Per-scene checklist (wave 02)

Each scene was taken through the playbook's per-scene loop: math → goldens →
component → register → build. Every one of the five has an empty `paramsSchema`
in the catalog, so none takes props; the registry builders ignore their argument
rather than reading keys that can never be set.

| id | math extracted | goldens | animated | precompute | controls |
|---|---|---|---|---|---|
| `FieldLinesPointScene` | — (radial by construction) | — | ✅ drifting heads | n/a | sign `+`/`−` picker |
| `FieldLinesDipoleScene` | `FieldLines.trace`, `seedRing` | ✅ 6 tests | ✅ drifting heads | 14 × 600-step traces, once/process | none |
| `GaussianSurfacesScene` | `Electrostatics.flux` | ✅ 2 tests | ✅ shape morph | 4 × 192-point unit outlines | none |
| `EquipotentialLinesScene` | `FieldLines.contour`, `potentialGrid`, `trace` | ✅ 9 tests | ❌ static | 110² grid + 11 isolines + 16 traces, once/process | 2 layer toggles |
| `ParallelPlateCapacitorScene` | `Electrostatics.parallelPlateCapacitance`, `energyStored` | ✅ 5 tests | ❌ static | n/a | 4 sliders (A, d, κ, V) |

### New PXMath

- `PXMath/Electromagnetism/Electrostatics.swift` — ε₀, k, `PointCharge`, `Vec2`,
  field (single + superposed), potential, Gauss flux, parallel-plate capacitance,
  stored energy. Ports four web files (`electric-field.ts`, `electric-potential.ts`,
  `gauss.ts`, `capacitance.ts`) that are four files only because they are four chapters.
- `PXMath/Electromagnetism/FieldLines.swift` — `trace`, `seedRing`, marching-squares
  `contour`, `potentialGrid`. These had **no** web equivalent outside the scene
  components; extracting them is the one structural change the wave makes, and it
  is what made them testable.

Tests: `ElectrostaticsTests` (16) and `FieldLinesTests` (15). The Electrostatics
suite is a transcription of the web's tolerances; the FieldLines suite is new
goldens (properties the drawing depends on, not pixels), since the web never
tested that code.

---

## 3. Deviations from the web

Beyond the standard three (no `clearRect`, no background fill, hex → tokens) that
every ported scene carries:

**Performance — the big one.** `EquipotentialLinesScene` on the web re-samples a
110 × 110 potential grid, re-runs marching squares at eleven levels, and
re-integrates sixteen 600-step field lines **on every animation frame** — roughly
12 000 potential evaluations and 10 000 field evaluations per frame, for a picture
that never changes. All of it is precomputed once per process, in world and
index space; a frame does an affine map and a stroke. `FieldLinesDipoleScene`'s
`useMemo` traces likewise become a `static let` (once per process, not once per
mount), and `GaussianSurfacesScene`'s 192-radius outlines are precomputed as unit
shapes and scaled per frame.

**No ticker where nothing moves.** `EquipotentialLinesScene` and
`ParallelPlateCapacitorScene` both ran a rAF loop on the web to redraw an
unchanging picture. Both are plain `Canvas` here, redrawing only on a control or
size change. Zero frames at rest.

**`GaussianSurfacesScene` state round-trip dropped.** The web mirrors the active
shape name into React state each frame to re-render a label it then does not use
(the HUD reads `blend.active` directly). A `@State` write from inside a `Canvas`
body is a SwiftUI update cycle, not merely waste, so it is gone.

**Controls follow iOS idiom.** The `<Button active>` sign pair becomes a segmented
`Picker`; the two `<input type="checkbox">` become `Toggle`s; the four
`<input type="range">` rows become the same label/track/readout layout the other
ported scenes use. All get VoiceOver for free, which the canvas-drawn originals
did not have.

**Reduced motion.** The three animated scenes pause their `SceneTicker` under
`accessibilityReduceMotion`. `GaussianSurfacesScene` additionally freezes at the
sphere, matching the web's `getBlend(0)`.

**Charge glyph ink is a fixed near-black,** not a token. The disc under it is
always a saturated accent in both themes, so a theme-reactive ink would vanish on
light mode — the web hardcodes `#0B1018` / `#1A1D24` for the same reason. It lives
once in `ChargeGlyph.swift` instead of four times.

**Shadow radii are halved throughout.** Canvas `shadowBlur` is 2σ; SwiftUI's
`radius:` is σ. `18 → 9`, `16 → 8`, `22 → 11`, `14 → 7`, `12 → 6`, `8 → 4`.

**`useSceneSize`'s missing floor becomes `minHeight: 0`** in all five, as in wave 01.

---

## 4. Performance notes

The heaviest scene is the field-line family, and the cost is entirely in the
tracing — which no longer happens per frame:

- **`EquipotentialLinesScene`** — the expensive one. One-time cost on first draw:
  12 100 potential evaluations for the grid, 11 marching-squares passes over it,
  and 16 traces of up to 600 steps each. Per frame afterwards: an affine map over
  the precomputed segments and polylines. It is also static, so "per frame" is
  "per toggle or resize".
- **`FieldLinesDipoleScene`** — 14 traces × ≤600 steps, once per process. Per
  frame: one `Path` build over the cached points plus 14 arrowhead triangles.
- **`GaussianSurfacesScene`** — per frame: 192 lerps, one fill, one glow stroke,
  24 spokes. The morph is the only genuinely per-frame arithmetic in the wave and
  it is trivial.
- **`FieldLinesPointScene`** — 16 straight spokes and 16 triangles per frame. A
  lone point charge's field lines are exactly radial, so the tracer is not used
  here at all; integrating would reach the same straight spokes at a cost.

No scene allocates inside its draw path beyond the `Path`s it strokes, and no
scene runs an integration on the main thread per frame (the P4-4 guardrail).

Release-configuration build passes. **Frame-rate figures on device are not yet
measured** — see below.

---

## 5. Verification run

```
swift test --package-path ios/PhysicsPackages     → 283 tests, 39 suites, all pass
xcodebuild -configuration Debug   … build          → BUILD SUCCEEDED
xcodebuild -configuration Release … build          → BUILD SUCCEEDED
swift build --target PXScenes                      → no warnings
```

⚠️ **`project.pbxproj` was stale** and had to be regenerated with `xcodegen generate`
before the app would build: `App/Auth/AuthGate.swift`, `App/Auth/AccountSection.swift`,
`App/Onboarding/` and `App/Browse/BrowseHomeView.swift` were on disk but absent from
the project. If a build fails with "cannot find `AuthGate` in scope", run
`xcodegen generate` in `ios/` first.

---

## 6. Outstanding

These are the P4-4 acceptance items that need a running app and eyes on it, and
they have **not** been done:

- [ ] **Reader integration pass** — open the topics embedding the eleven native
      scenes and confirm each renders natively inside `SceneCard`, that figure-block
      `props` reach the scene, and that fullscreen expand keeps the animation live.
      Topics to check:
      `electromagnetism/the-electric-field` (2 scenes) ·
      `electromagnetism/gauss-law` · `electromagnetism/electric-potential` ·
      `electromagnetism/capacitance-and-field-energy` ·
      `classical-mechanics/{oscillators-everywhere, damped-and-driven-oscillations,
      phase-space, beyond-small-angles, energy-and-work, momentum-and-collisions,
      newtons-three-laws}`.
      The resolution chain itself is id-keyed and already prefers native
      (`PXSceneResolution.resolve`), so no code change was needed for the five new
      ids — this is a visual confirmation, not a wiring task.
- [ ] **Side-by-side comparison against the web** for the five new scenes.
- [ ] **60 fps confirmation** on the animated EM scenes in a Release run on device
      (Instruments if in doubt). The analysis above says where the time goes; it is
      not a measurement.
- [ ] **Screenshots** — the prompt's `/tmp/p4-4/` sweep was not run.

The scene browser (`Gallery → Scenes`, DEBUG builds) is the fastest way through
these: it now counts LIVE / SNAPSHOT / PLACEHOLDER rows separately and sorts
ported scenes to the top of each branch, so the eleven are the first thing on
screen.
