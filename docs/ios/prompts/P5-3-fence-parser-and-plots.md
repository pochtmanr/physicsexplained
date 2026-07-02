# P5-3 — Fence parser port + native PlotView

Phase P5, prompt 3 of 6. Executor: Opus 4.8. Prerequisites: P5-2 (AskEvent exists); P4 (PXScenes toolkit, for PlotView drawing).

## Read first
- `/Users/roman/Developer/physics/docs/ios/02-api-contracts.md` §8 (fence grammar — the regexes and rules are copied EXACTLY from here)
- Source of truth for parity: `/Users/roman/Developer/physics/lib/ask/render.ts` (72 lines — read it all)
- Plot spec + evaluation rules: 02 §8 `plot` bullet; web reference `/Users/roman/Developer/physics/components/ask/math-plot.tsx`
- `/Users/roman/Developer/physics/docs/ios/01-architecture.md` §2 (PXModel owns `FencePart`/`PlotSpec`; PXMath owns evaluation; PXAsk owns PlotView), §3 (swift-math-parser is the pinned evaluator)
- `/Users/roman/Developer/physics/docs/ios/03-design-system.md` (plot colors: accent cyan primary curve, magenta overlays; mono axis labels)

## Task
1. PXModel: `FencePart` enum (text / scene(id, params) / plot(plotId, args) / cite(kind, slug)) and `PlotSpec` (function + parametric variants) per 02 §8. `func parseFences(_ text: String) -> [FencePart]` — port `parseFences`/`parseOne` from `render.ts` with the three regexes verbatim (translate JS regex to NSRegularExpression/Swift `Regex` carefully: `(?:\s|\\n)*` matches literal backslash-n too). Attribute values are JSON-parsed individually; ANY failure → whole fence becomes literal text. `[[scene:Id]]`/`[[plot:id]]` bracket fallback on non-fence text runs.
2. Tests (`Tests/PXModelTests` or `PXAskTests`): port every behavior case observable in `render.ts` + the 02 §5.4 transcript text:
   - `:::scene{id="PendulumScene" length=1.2 theta0=0.3}\n:::` → scene part with 2 params;
   - closing-variant tolerance: `:::scene{id="X"}:::`, `...}\n:::`, `...}\\n:::` (literal backslash-n);
   - plot function fence with `domain=[0.1,3]` array attr and quoted `xlabel`;
   - malformed attr JSON → literal text, no crash;
   - `[[scene: WhoAgedLessScene ]]` → scene with empty params; `[[plot: p1]]` → plot with empty args (renders "plot unavailable");
   - cite fences collected; text around fences preserved byte-for-byte; `$T = 2\pi\sqrt{L/g}$` left intact inside text parts.
3. PXMath: `ExpressionEvaluating` protocol (`compile(_ expr: String) throws -> (_ vars: [String: Double]) -> Double`) + `MathParserEvaluator` (swift-math-parser). Must handle the mathjs subset: `sin cos tan sqrt exp log abs pi e ^` and named params. Golden tests: `2*pi*sqrt(L/9.81)` at L∈{0.1,1,3} vs precomputed doubles; `sin(theta)/theta` near 0 → clip non-finite; an unparseable expr throws (→ "plot unavailable" card, never crash).
4. PXAsk: `PlotView` — SwiftUI `Canvas` plot renderer for `PlotSpec`: sample ~200 points across `domain`, drop non-finite, auto-derive y-range from finite samples (pad 8%), draw axes + 4–6 ticks with mono labels, primary curve (cyan), `overlays` (magenta, then amber), `xlabel`/`ylabel`, parametric mode (sample x(t),y(t)). Wrapped by SceneCard chrome at the call site (P5-4) — PlotView itself draws no frame.
5. Add PlotView samples to the Gallery (one function, one with overlay + params, one parametric, one "unavailable").

## Do NOT
- Do not render markdown in chat text (02 §8: prose is pre-wrapped plain text + math only).
- Do not evaluate expressions with `NSExpression` or JavaScriptCore.
- PXModel/PXMath stay UI-free; PlotView lives in PXAsk.

## Acceptance criteria
- `swift test` green: fence parity suite + evaluator goldens.
- Gallery deep link `physicsexplained://gallery/` shows the 4 plot samples correct in dark + light.

## Verify
```bash
swift test --package-path ios/PhysicsPackages
xcodebuild -project ios/PhysicsExplained.xcodeproj -scheme PhysicsExplained \
  -destination 'platform=iOS Simulator,name=iPhone 17 Pro' build
xcrun simctl io booted screenshot /tmp/p5-3-plots.png
```
