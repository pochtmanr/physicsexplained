# P8-2 — Performance + Liquid Glass refinement: report

Executed 2026-07-19. Simulator: iPhone 17 Pro (iOS 26), Xcode 26.6, host Apple
Silicon. Builds: Debug for anything reading the DEBUG counters, Release for the
launch numbers.

---

## 1. Per-metric table

| # | Metric | Target | Measured | Verdict |
|---|---|---|---|---|
| 2 | Formula cache steady-state hit rate | ≥ 95% | **100%** (165/165 peeks, `relativity/four-momentum`; 71/71 `einsteins-two-postulates`; 48/48 `brownian-motion`) | **Pass** |
| 2 | Re-typesetting on scroll-back | none | **0 re-typesets** in every run, including revisiting an article after four others | **Pass** |
| 3 | Lazy mount of reader blocks | scroll-driven | **Verified lazy**: `the-simple-pendulum` mounts 5 blocks before scrolling → 9 → 12 → 48 across the pass | **Pass** |
| 3 | Offscreen scenes doing zero frame work | zero | **3 frames of 82** while offscreen, all pause-transition frames | **Pass** |
| 3 | Reader hang > 100 ms / hitch ratio < 5 ms/s | Instruments | **Not measurable on simulator** — see §5 | **Deferred to device** |
| 4 | iPad scene dropped frames · 120 Hz ProMotion | spot check | Simulator has no hitch instrumentation; checklist in §5 | **Deferred to device** |
| 5 | Cold start → interactive Browse (Release) | < 1.5 s | **822 / 1008 / 1139 ms** warm content cache; **1615–1902 ms** on the first launches after install | **Pass warm, miss on first run** (network-bound — see §4) |
| 6 | Memory: reader + 20 scenes scrolled | no unbounded growth | 272 MB baseline → 354 MB peak → **255–300 MB** over a second pass of the same five articles | **Pass** |
| 6 | Chat with 50 messages | no unbounded growth | Needs an authenticated account and live streaming; not scriptable here | **Deferred to device** |

---

## 2. Glass audit (design system §4)

Glass is centralised in `PXDesign/Components/Glass.swift` and has five
non-debug call sites app-wide. There are **zero** `toolbarBackground`,
`UITabBarAppearance`, `UINavigationBarAppearance`, `UIBlurEffect` or raw
`.regularMaterial` usages outside that helper — nothing replaces the system
Liquid Glass tab bar or toolbars anywhere.

### Compliant

| Surface | Site | Note |
|---|---|---|
| Tab bar / sidebar | `RootView.swift:43,72,76` | System `TabView` + `.sidebarAdaptable`, brand tint only |
| Ask input bar | `AskComposer.swift:29` | `.pxGlassCapsule()` — enumerated in §4 |
| Playground HUD controls | `PlaygroundView.swift:202` | `.pxGlassPanel()`, capped to a floating cluster |
| Fullscreen figure close | `SceneCardFrame.swift` | `.pxGlassCircle()` — "floating scene controls in fullscreen figure view" |
| Article reading surface | `TopicScreen.swift:47`, `EntryScreen.swift:38` | Flat `PXColors.bg` |
| Chat bubbles | `AskMessageView.swift:52` | Flat `fg4.opacity(0.35)` + cyan rail, no material |
| Scene / plot canvas interiors | all of `PXScenes/Scenes/**`, `PlotView`, `InlineSceneView` | Pure `Canvas`, no material |
| SceneCard / callout / equation frames | `SceneCardFrame`, `CornerFrame`, `CalloutContainer`, `EquationBlockView` | Hairline-bordered flat panels |

### Fixed in this pass

Both are §4 legibility violations — "labels over glass use `.fg0`/system label
colors":

| Site | Before | After |
|---|---|---|
| `PlaygroundView.swift` control row | `tokens.textDim` (fg1) over glass over a moving starfield — the weakest contrast in the app | `tokens.textBright` (fg0) |
| `AskComposer.swift` character counter | `fg3` (the muted meta token) on the composer glass | `fg0`; the at-limit magenta state is unchanged |
| `AskComposer.swift` model-picker icon | `fg2` | `fg0` |

No ad-hoc materials from earlier phases were found to remove.

### Deviations left in place, deliberately

Two surfaces depart from a literal reading of §4. Both were already justified in
code comments, both are defensible, and neither is something this pass should
decide unilaterally — flagging for a ruling:

1. **`SignInSheet.swift:49` — `.presentationBackground(PXColors.bg)`.** §4 lists
   sheets as glass, and this suppresses the system sheet material. The reason is
   that the sheet's background *is* a photograph (`SignInBackdrop`), which the
   sheet material greys out. Recommend §4 gain an explicit carve-out for
   photo-backed sheets rather than changing the screen.

2. **`EntrySheet.swift:41` — `.background(PXColors.bg)` filling the glossary /
   physicist sheet.** §4 names those sheets as a glass surface, but it also says
   twice, and more emphatically, never to put glass between the reader and
   content — and this sheet's body is an article rendered by the same
   `BlockListView` as the reader. The two clauses conflict; the flat fill honours
   the stronger one. Recommend §4 state that precedence explicitly.

3. **`OnboardingView.swift:176` — `.buttonStyle(.glass)`.** Chrome floating over
   a full-bleed photograph, which matches §4's *principle* but is not on its
   enumerated list. Recommend adding "controls over full-bleed imagery" to the
   list rather than swapping in the keycap style, which would read worse there.

**Screenshots (dark + light) are outstanding** — see §5.

---

## 3. What was measured, and how

Two DEBUG-only instruments were added, plus a scriptable scroll driver. All
three compile to nothing in Release.

- `FormulaCacheMetrics` (`PXBlocks`) — counts the *view-driven* synchronous cache
  peek (`FormulaCache.peek`, called from `FormulaView.body` and
  `PXInlineFormula.text`), and separately counts trips through the typesetter.
  A second typeset of the same key is the eviction signal.
- `BlockMountMeter` (`PXBlocks`) — counts block rows as they first lay out. This
  is what distinguishes "scrolling did no formula work because the cache is
  warm" from "scrolling did no formula work because the article had already
  mounted all of itself".
- `PXSceneFrameMeter` (`PXDesign`) — counts scene animation frames and, of those,
  how many ran while the figure was outside the viewport.
- `ScrollDrill` (`App/Reader`) — a deep-link-triggered auto-scroll that steps a
  real `TopicScreen` end-to-end and back at 80% of a viewport per step. Chosen
  over an XCUITest because a UI test measures the swipe as much as the app.

Reproducing a pass:

```bash
xcrun simctl openurl booted physicsexplained://browse/topic/relativity/four-momentum
sleep 4                                                   # let it load and prefetch
xcrun simctl openurl booted physicsexplained://debug/scroll        # warm pass
xcrun simctl openurl booted physicsexplained://debug/scroll-cold   # purges the cache first
xcrun simctl spawn booted log stream \
  --predicate 'subsystem == "com.physicsexplained.app"'
```

Launch phases are `os_signpost` intervals on the `Launch` category
(`PXLaunchTrace`), measured from the kernel's `p_starttime` rather than from
`App.init` — by the time the first Swift line runs, dyld and SwiftUI have
already spent the largest fixed cost in the number.

---

## 4. Findings, including two that changed the plan

### The formula cache needs no widening

The task anticipated fixing a low hit rate "by widening the cache key/size if
needed". It is not needed. Across all five reference topics, including
revisiting the first article after four others had filled the cache,
`retypeset` stayed at **0** — the 200-entry `NSCache` never evicted anything a
reader came back to. Steady-state hit rate is 100%, not 95%.

A deliberately hostile variant (`scroll-cold`, which empties the cache *after*
the article's prefetch has already run — a state the app never actually reaches)
gives 59–60% on the downward pass. Every miss there is a first render, not a
re-render; `retypeset` is still 0. Recorded for completeness, not as a
regression.

### The offscreen scene gate was written, measured, and removed

`SceneTicker`'s doc comment claimed `TimelineView(.animation)` stops when the
view scrolls offscreen. §3 asked to verify that, and the obvious failure mode is
real: `LazyVStack` keeps rows mounted well outside the visible rect, so a
scrolled-past figure could plausibly keep driving a `Canvas` nobody can see.

So an explicit gate was built — an environment flag set by `SceneCardFrame` via
`onScrollVisibilityChange`, freezing the ticker when the figure leaves the
viewport — and then A/B'd on `energy-and-work` scrolled end-to-end and back:

| | Total scene frames | Frames while offscreen |
|---|---|---|
| Gate on | 83 | 3 |
| Gate off | 82 | 3 |

Identical. SwiftUI already stops issuing timeline updates for offscreen rows;
the three frames are the pause transition. **The gate bought nothing, so it was
removed** rather than shipped as an unmeasured optimisation that could strand a
scene frozen wherever `onScrollVisibilityChange` reports oddly.

What stayed is the instrument: `SceneCardFrame` still publishes visibility and
`SceneTicker` still counts against it, so a future layout that breaks this
assumption shows up as a climbing offscreen count instead of a battery
complaint. `SceneTicker.body` carries the measurement in its doc comment.

### Lazy mounting works, including through nested sections

Worth stating because it was the suspicion that motivated the mount meter: an
article's blocks are nested inside `SectionBlockView`, which puts a `LazyVStack`
inside another `LazyVStack`, and nested lazy containers are a classic place for
laziness to silently degrade. Measured, it does not:
`classical-mechanics/the-simple-pendulum` holds 5 blocks before the scroll
starts and climbs 9 → 12 → 48 across the pass. No renderer change was made.

### Deferring Nuke config off the launch path is not worth doing

§5 suggested deferring "non-critical init (Nuke config, catalog refresh)". With
the phases instrumented:

| Phase | Release, warm |
|---|---|
| `services` (config + Supabase + GRDB open/migrate + scene registry) | 17–53 ms |
| `fonts` | 6–35 ms |
| `image-pipeline` (Nuke) | **4–7 ms** |

App-owned init is ~30–95 ms of an ~850–1150 ms launch. Deferring Nuke would save
single-digit milliseconds and buy a correctness risk (an image load racing the
pipeline install). The scene catalog refresh is **already** off the launch path —
it runs from `TopicScreen`/`askTranscript`'s `.task`, not from `AppServices`. No
deferral was made.

The launch budget is therefore ~260 ms of pre-main plus ~530 ms of SwiftUI scene
setup and the first taxonomy read. The runs that exceeded 1.5 s were the first
launches after a fresh install, where the GRDB content cache is empty and the
taxonomy has to come over the network before Browse has anything to be
interactive *with*. Making Browse interactive ahead of its content would be a UX
change, not a perf fix, so it is out of scope here and flagged instead.

### Release configuration had never compiled

Not part of the brief, but it blocked the brief's own verify command.
`App/Gallery/GalleryView.swift` and `App/Gallery/ChatStatesSection.swift` lacked
the `#if DEBUG` guard that every section file they reference carries, so
`-configuration Release` failed with eight "cannot find … in scope" errors.
Fixed by guarding the view bodies while leaving `GalleryDestination` /
`GallerySection` unguarded, since `RootView` and `SettingsView` reference the
destination type outside the gate. Release builds clean now.

---

## 5. Outstanding — manual, on-device

These need hardware. `xctrace record --template 'Animation Hitches'` against a
simulator fails outright with *"Hitches is not supported on this platform"*, and
the `Allocations` template made the simulator unresponsive enough that deep
links timed out, so §3, §4 and the chat half of §6 could not be closed here.

**Device checklist** (iPhone with ProMotion, and an iPad, both on a Release
build):

1. **Reader hitches.** Product ▸ Profile ▸ Animation Hitches. Open
   `relativity/four-momentum` (87 formulas, the longest live essay), scroll
   end-to-end and back twice at reading speed. Gate: no hang > 100 ms, hitch
   ratio < 5 ms/s.
2. **Reader hangs.** Same trace, Hangs instrument. Watch the article *open* as
   much as the scroll — first layout of a long essay is the likeliest hang.
3. **120 Hz ProMotion.** Open a figure fullscreen (the expand affordance) for
   five animated scenes and confirm the display runs at 120 Hz and frames are
   delivered at that rate, not 60. Suggested five: `DampedPendulumScene`,
   `CoupledPendulumScene`, `BeatsScene`, `FieldLinesPointScene`,
   `CollisionScene` — reachable individually via
   `physicsexplained://gallery/scene/<id>` on a Debug build.
4. **iPad dropped frames.** Repeat 1 and 3 on an iPad in landscape, where the
   split view has both a sidebar and a wider canvas in flight.
5. **Chat memory.** Sign in, run one conversation past 50 messages, and watch
   Allocations for a rising floor across turns. Snapshot caches should cap.
6. **Glass screenshots.** Capture dark *and* light for: Browse hub, reader with
   a figure, Ask transcript with the composer focused, playground with the HUD
   over a dense simulation, a glossary sheet, and the fullscreen figure view.
   These are the §4 acceptance artefacts and are not yet attached.

Re-run the scripted half after any renderer change:

```bash
# 5 reference topics, warm and cold, with the counters streaming
for T in classical-mechanics/the-simple-pendulum classical-mechanics/energy-and-work \
         electromagnetism/coulombs-law relativity/einsteins-two-postulates \
         thermodynamics/brownian-motion; do
  xcrun simctl openurl booted "physicsexplained://browse/topic/$T"; sleep 10
  xcrun simctl openurl booted "physicsexplained://debug/scroll";    sleep 55
done
```
