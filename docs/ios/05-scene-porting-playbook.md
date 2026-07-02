# 05 — Scene Porting Playbook (Canvas 2D → SwiftUI)

This is the cookbook for porting the ~500 React Canvas-2D scenes in
`/Users/roman/Developer/physics/components/physics/` to SwiftUI. Every API you
need is specified here — **never invent toolkit APIs**; if something seems
missing, re-read §2/§3 first, then flag it in your report instead of improvising.

Ground truth on the web side (read these when in doubt):

- `/Users/roman/Developer/physics/components/physics/_shared/scene-tokens.ts` — the shared toolkit every scene composes.
- `/Users/roman/Developer/physics/lib/hooks/use-theme-colors.ts` — `ThemeColors` (the 15 theme colors scenes use).
- `/Users/roman/Developer/physics/lib/content/simulation-registry.ts` — the id → component registry (503 ids).
- `/Users/roman/Developer/physics/components/physics/_shared/SpacetimeDiagramCanvas.tsx`, `ManifoldCanvas.tsx` — the two shared canvases.

---

## 1. Target architecture recap

All scene code lives in the `PXScenes` target of the local SPM package:

```
PhysicsPackages/Sources/PXScenes/
  SceneTokens.swift              # §2 — token struct + resolve(colorScheme)
  GraphicsContext+Helpers.swift  # §2 — drawArrow/drawDivider/drawHudReadout/drawSectionTitle
  SceneAspect.swift              # §2 — .sceneAspect(ratio:maxHeight:minHeight:) modifier
  SceneControlRow.swift          # §7 — standard control-row container
  SceneProps.swift               # §9 — typed access to JSON default_props / AI params
  SceneRegistry.swift            # §9 — id → view factory
  Shared/
    SpacetimeDiagramView.swift   # §8 — port of SpacetimeDiagramCanvas.tsx (once)
    ManifoldView.swift           # §8 — port of ManifoldCanvas.tsx (once)
  Scenes/
    <branch>/<Name>Scene.swift   # e.g. Scenes/relativity/WhoAgedLessScene.swift
```

Resolution order at render time (implemented in `PXBlocks.FigureView`, spec'd in
`04-block-rendering-spec.md`): given a figure block or `:::scene` fence with id
`X` — **native** if `SceneRegistry.view(for: "X", props:)` returns a view; else
**snapshot** image from `scene_catalog.snapshot_url` inside the same SceneCard
chrome with a `STATIC FIGURE` HUD tag; else a designed placeholder. Porting a
scene automatically upgrades every essay figure and Ask embed that references it.

**SceneCard owns ALL chrome.** The card draws the border frame, four corner
squares, the `FIG.NN —` caption, background, and fullscreen expand. A scene view
renders ONLY its canvas + optional control row. Scenes must never draw their own
border, rounded corners, caption, or opaque background (see §3 on `fillRect` of
`tokens.bg`). This mirrors the web contract documented at
`scene-tokens.ts:149-161` (`SCENE_CANVAS_CLASS`).

---

## 2. Toolkit mapping (scene-tokens.ts → PXScenes)

### 2.1 `useSceneTokens()` / `ThemeColors` → `SceneTokens`

Web: `useSceneTokens()` returns a token bag backed by CSS variables that flip
with `data-theme`. Swift: a value struct resolved from the SwiftUI color scheme.
Colors come from `PXDesign.PXColors` (each `Color` has light+dark variants —
see `03-design-system.md`), so token values flip automatically.

```swift
import SwiftUI
import PXDesign

public struct SceneTokens {
    // ── Surfaces ──────────────────────────────────────────────
    public let bg: Color            // PXColors.bg0
    public let bg1: Color           // PXColors.bg1

    // ── Text ──────────────────────────────────────────────────
    public let textBright: Color    // PXColors.fg0
    public let textDim: Color       // PXColors.fg1
    public let textMute: Color      // PXColors.fg2  (web: colors.fg2, backed by --color-fg-3)
    public let textFaint: Color     // PXColors.fg3  (web: colors.fg3, backed by --color-fg-4)

    // ── Grid + axes ───────────────────────────────────────────
    public let grid: Color          // PXColors.fg3.opacity(0.5)   (web: hexToRgba(fg3, 0.5))
    public let gridHeavy: Color     // PXColors.fg3
    public let axes: Color          // PXColors.fg2
    public let panelBorder: Color   // PXColors.fg3

    // ── Semantic accents ──────────────────────────────────────
    public let cyan, magenta, amber, mint: Color
    public let red, blue, purple, orange, green: Color

    // ── Typography (fixed across themes; mirrors FONT_* consts) ──
    public let fontHud: Font        // .system(size: 12, design: .monospaced)
    public let fontHudSmall: Font   // .system(size: 11, design: .monospaced)
    public let fontHudLarge: Font   // .system(size: 13, design: .monospaced)
    public let fontSection: Font    // .system(size: 11, design: .monospaced)
    public let fontLabel: Font      // .system(size: 12, design: .monospaced)

    public static func resolve(_ scheme: ColorScheme) -> SceneTokens
}
```

Standard usage inside every scene (replaces the `useSceneTokens()` hook):

```swift
@Environment(\.colorScheme) private var scheme
// in body:
let tokens = SceneTokens.resolve(scheme)
```

Mapping table (web token → Swift):

| Web (`SceneTokens`) | Swift | Note |
|---|---|---|
| `tokens.bg` / `bg1` | `tokens.bg` / `tokens.bg1` | See §3: do NOT fill full-canvas opaque bg |
| `textBright/textDim/textMute/textFaint` | same names | fg0/fg1/fg2/fg3 |
| `grid` | `tokens.grid` | fg3 at 0.5 opacity, pre-baked |
| `gridHeavy/axes/panelBorder` | same names | |
| 9 accents | same names | never hardcode hex in a scene |
| `fontHud` etc. (CSS font strings) | `Font` values | `ui-monospace` → `.monospaced` design |
| `tokens.colors` (raw ThemeColors) | not needed | shared views take `SceneTokens` directly |

### 2.2 `hexToRgba(color, a)` → `.opacity(a)`

Web scenes constantly wrap tokens: `hexToRgba(tokens.cyan, 0.18)`. Swift:
`tokens.cyan.opacity(0.18)`. Mechanical, always.

### 2.3 `useSceneSize` → `.sceneAspect(...)`

Web: container-width-driven sizing, `height = clamp(width × ratio, minHeight, maxHeight)`,
defaults `ratio 0.55, maxHeight 460 (SCENE_HEIGHT_TALL), minHeight 220, initialWidth 720`.

Swift modifier with identical semantics (implement once in `SceneAspect.swift`):

```swift
public extension View {
    /// height = clamp(width × ratio, minHeight, maxHeight); width fills container.
    func sceneAspect(
        ratio: CGFloat = 0.55,
        maxHeight: CGFloat = SceneMetrics.heightTall,   // 460
        minHeight: CGFloat = 220
    ) -> some View
}

public enum SceneMetrics {
    public static let widthDefault: CGFloat = 720   // SCENE_WIDTH_DEFAULT
    public static let heightDefault: CGFloat = 380  // SCENE_HEIGHT_DEFAULT
    public static let heightTall: CGFloat = 460     // SCENE_HEIGHT_TALL
    public static let heightShort: CGFloat = 320    // SCENE_HEIGHT_SHORT
}
```

Implementation: `GeometryReader { geo in content.frame(height: max(minHeight, min(geo.size.width * ratio, maxHeight))) }`
wrapped so the reader itself gets the clamped height (use a `@State` measured
width + `.onGeometryChange` or a custom `Layout`; either is fine — it is
internal to this one file). Translate each scene's `useSceneSize(ref, { ratio, maxHeight, minHeight })`
call directly to `.sceneAspect(ratio:maxHeight:minHeight:)` with the same numbers.
Inside `Canvas { ctx, size in }`, `size.width`/`size.height` replace the web `width`/`height`.

### 2.4 `applyDpr` → **delete it**

`GraphicsContext` is point-based and retina-sharp by construction. When the web
draw code multiplies by `dpr` or calls `applyDpr(canvas, W, H)`, strip it: use
`size.width`/`size.height` as the web `W`/`H` and draw in points. There is no
Swift equivalent to write.

### 2.5 `useSceneTick` / `requestAnimationFrame` → `TimelineView(.animation)`

Web: `useSceneTick()` returns milliseconds since mount, read inside a rAF loop.
Swift pattern (the ONLY animation driver to use — no `CADisplayLink`, no `Timer`):

```swift
TimelineView(.animation(minimumInterval: nil, paused: paused)) { timeline in
    Canvas { ctx, size in
        let t = timeline.date.timeIntervalSince(startDate)  // seconds, not ms!
        draw(ctx, size: size, tokens: tokens, t: t)
    }
}
```

with `@State private var startDate = Date()`. **Web ticks are in milliseconds,
`timeIntervalSince` is in seconds** — when the web code does `(now - last) / 1000`,
the `/1000` disappears in Swift. Pause/resume with phase accumulation (the common
web pattern `if (!paused) phaseRef.current += dt * rate`):

```swift
@State private var paused = false
@State private var phaseAtPause: Double = 0
@State private var resumeDate = Date()
// phase(at date): paused ? phaseAtPause
//                        : phaseAtPause + date.timeIntervalSince(resumeDate) * rate
// on pause:  phaseAtPause += Date().timeIntervalSince(resumeDate) * rate
// on resume: resumeDate = Date()
```

`.animation(paused: paused)` stops frame callbacks while paused — that is the
pause-when-idle behavior. Scenes scrolled offscreen: List/ScrollView cell reuse
already stops offscreen `TimelineView`s; additionally FigureView passes
`paused: !isVisible` using `onScrollVisibilityChange` (wired once in PXBlocks,
not per scene).

### 2.6 Draw helpers → `GraphicsContext` extensions

Implement once in `GraphicsContext+Helpers.swift`, transcribing the exact web
geometry so output matches pixel-for-pixel:

```swift
public extension GraphicsContext {

    /// scene-tokens.ts drawDivider — thin horizontal rule.
    func drawDivider(x0: CGFloat, x1: CGFloat, y: CGFloat, color: Color) {
        var p = Path(); p.move(to: .init(x: x0, y: y)); p.addLine(to: .init(x: x1, y: y))
        stroke(p, with: .color(color), lineWidth: 1)
    }

    /// scene-tokens.ts drawArrow — shaft + filled triangular head, round caps.
    func drawArrow(from p0: CGPoint, to p1: CGPoint, color: Color,
                   lineWidth: CGFloat = 2, headSize: CGFloat = 8) {
        let dx = p1.x - p0.x, dy = p1.y - p0.y
        let len = hypot(dx, dy)
        guard len > 1e-6 else { return }
        let ux = dx / len, uy = dy / len
        let base = CGPoint(x: p1.x - ux * headSize, y: p1.y - uy * headSize)
        let perp = CGPoint(x: -uy * headSize * 0.5, y: ux * headSize * 0.5)

        var shaft = Path(); shaft.move(to: p0); shaft.addLine(to: base)
        stroke(shaft, with: .color(color),
               style: StrokeStyle(lineWidth: lineWidth, lineCap: .round))

        var head = Path()
        head.move(to: p1)
        head.addLine(to: CGPoint(x: base.x + perp.x, y: base.y + perp.y))
        head.addLine(to: CGPoint(x: base.x - perp.x, y: base.y - perp.y))
        head.closeSubpath()
        fill(head, with: .color(color))
    }

    /// scene-tokens.ts drawHudReadout — "label value" in 12pt mono, baseline-top.
    /// Returns the next line's y (y + lineHeight).
    @discardableResult
    func drawHudReadout(x: CGFloat, y: CGFloat, label: String, value: String,
                        labelColor: Color, valueColor: Color,
                        lineHeight: CGFloat = 18) -> CGFloat {
        let hud = Font.system(size: 12, design: .monospaced)
        let labelText = resolve(Text(label).font(hud).foregroundStyle(labelColor))
        let labelW = labelText.measure(in: CGSize(width: .max, height: .max)).width
        draw(labelText, at: CGPoint(x: x, y: y), anchor: .topLeading)
        draw(Text(value).font(hud).foregroundStyle(valueColor),
             at: CGPoint(x: x + labelW + 4, y: y), anchor: .topLeading)
        return y + lineHeight
    }

    /// scene-tokens.ts drawSectionTitle — uppercased 11pt mono, baseline-top.
    func drawSectionTitle(x: CGFloat, y: CGFloat, _ title: String, color: Color) {
        draw(Text(title.uppercased())
                .font(.system(size: 11, design: .monospaced))
                .foregroundStyle(color),
             at: CGPoint(x: x, y: y), anchor: .topLeading)
    }
}
```

---

## 3. Canvas API translation table

| Web (`CanvasRenderingContext2D`) | SwiftUI (`GraphicsContext` / `Path`) |
|---|---|
| `ctx.beginPath()` | `var p = Path()` (each web "path build" becomes one local `Path`) |
| `ctx.moveTo(x,y)` / `lineTo` | `p.move(to:)` / `p.addLine(to:)` |
| `ctx.closePath()` | `p.closeSubpath()` |
| `ctx.arc(x,y,r,a0,a1)` | `p.addArc(center:radius:startAngle:.radians(a0),endAngle:.radians(a1),clockwise:false)` — see angle note below |
| `ctx.ellipse(cx,cy,rx,ry,rot,0,2π)` | `p.addEllipse(in: CGRect(x: cx-rx, y: cy-ry, width: 2*rx, height: 2*ry))`; nonzero `rot` → apply `.applying(CGAffineTransform(rotation around center))` |
| `ctx.rect(x,y,w,h)` / `fillRect` / `strokeRect` | `p.addRect(...)` then `fill`/`stroke`, or `fill(Path(CGRect(...)), with:)` directly |
| `ctx.quadraticCurveTo(cx,cy,x,y)` | `p.addQuadCurve(to:control:)` |
| `ctx.bezierCurveTo(c1x,c1y,c2x,c2y,x,y)` | `p.addCurve(to:control1:control2:)` |
| `ctx.fillStyle = c; ctx.fill()` | `context.fill(p, with: .color(c))` |
| `ctx.strokeStyle = c; ctx.lineWidth = w; ctx.stroke()` | `context.stroke(p, with: .color(c), lineWidth: w)` |
| `ctx.setLineDash([2,3])` … `setLineDash([])` | `style: StrokeStyle(lineWidth: w, dash: [2,3])`; "reset" = just don't pass dash on the next stroke |
| `ctx.lineCap = "round"` | `StrokeStyle(lineWidth: w, lineCap: .round)` |
| `ctx.globalAlpha = a` | `var c2 = context; c2.opacity = a; c2.…` (scoped by the copy) |
| `ctx.save()` / `ctx.restore()` | copy the context: `var c2 = context` — mutations to `c2` (transform, opacity, clip, filters) never touch `context`. For compositing groups use `context.drawLayer { layer in … }` |
| `ctx.translate/rotate/scale` | `c2.translateBy(x:y:)` / `c2.rotate(by: .radians(a))` / `c2.scaleBy(x:y:)` |
| `ctx.clip()` | `c2.clip(to: p)` |
| `ctx.createLinearGradient(x0,y0,x1,y1)` + `addColorStop` | `context.fill(p, with: .linearGradient(Gradient(stops: [.init(color:…, location: 0), …]), startPoint: CGPoint(x0,y0), endPoint: CGPoint(x1,y1)))` |
| `ctx.createRadialGradient(...)` | `.radialGradient(Gradient(…), center:startRadius:endRadius:)` |
| `ctx.shadowColor/shadowBlur` | `var c2 = context; c2.addFilter(.shadow(color:…, radius:…, x:…, y:…))` then draw via `c2` |
| `ctx.fillText(s, x, y)` | `context.draw(Text(s).font(f).foregroundStyle(c), at: CGPoint(x,y), anchor: …)` — see text note |
| `ctx.measureText(s).width` | `context.resolve(Text(s).font(f)).measure(in: big).width` |
| `ctx.clearRect(0,0,W,H)` | delete — a `Canvas` starts blank every frame |

**Gotchas (read before every wave):**

- **Coordinates**: identical. Both are top-left origin, y-down, and both are in
  logical points once you delete `applyDpr` (§2.4). Copy coordinates verbatim.
- **Angles**: both use radians measured from +x axis. In the shared y-down
  space, the web default sweep (`counterclockwise = false`, i.e. increasing
  angle = clockwise on screen) corresponds to `clockwise: false` in
  `Path.addArc` (Apple's flag is named for a y-up space). Full circles
  `(0, 2π)` render identically with either flag. For partial arcs, port with
  `clockwise: false` and verify visually against the web scene.
- **Background fill**: web scenes open with `ctx.fillStyle = tokens.bg; ctx.fillRect(0,0,W,H)`.
  **Delete that line.** SceneCard supplies the surface (and on iOS it may be a
  glass material — an opaque fill would kill it). KEEP decorative translucent
  washes/gradients layered above the bg fill.
- **Colors**: `hexToRgba(x, a)` → `x.opacity(a)`. `"rgba(r,g,b,a)"` literals →
  the corresponding token `.opacity(a)` — if a scene hardcodes a hex/rgba not
  derived from tokens, map it to the nearest token and note it in your report.
  Theme colors ALWAYS come from `SceneTokens`, never literals.
- **Fonts**: web font strings like `"11px ui-monospace, monospace"` →
  `Font.system(size: 11, design: .monospaced)`; `"bold 20px ui-monospace"` →
  `.system(size: 20, design: .monospaced).bold()`; `"12px ui-sans-serif, system-ui"` →
  `.system(size: 12)`. Prefer the `tokens.font*` constants when the size matches.
- **Text anchors**: canvas text is positioned by `textAlign` × `textBaseline`.
  Mapping: (`left`, `top`) → `.topLeading`; (`center`, `top`) → `.top`;
  (`right`, `top`) → `.topTrailing`; when `textBaseline` is unset (alphabetic),
  the web `y` is the BASELINE — use anchor `.bottomLeading`/`.bottom`/`.bottomTrailing`
  and accept ±2 pt, or add `+ fontSize * 0.2`. Most HUD code sets `textBaseline = "top"`;
  check each `fillText` cluster for the active `textAlign` (it's stateful in
  canvas — track it as you read the web code top-to-bottom).
- **Number formatting**: `x.toFixed(2)` → `String(format: "%.2f", x)`;
  template literals → string interpolation.
- **`Math.hypot/sin/cos/…`** → `hypot/sin/cos/…` from Foundation; `Math.PI` → `.pi`.
- **State refs** (`useRef` for phase/trails) → `@State` vars; mutate only
  outside the `Canvas` closure (in button actions / `onChange`) or derive from
  `t` (§2.5). Persistent particle buffers → `@State private var particles: [Particle]`
  stepped in `.onChange(of: timeline.date)` or derived deterministically from `t`.

---

## 4. Worked example — static scene with a slider

Source: `/Users/roman/Developer/physics/components/physics/the-twin-paradox/who-aged-less-scene.tsx`
(151 lines; uses `useSceneSize`, tokens, `hexToRgba`, tick grid, bars, HUD, a
range slider, and two `lib/physics` functions). This is the canonical pattern —
most of the ~395 static scenes look like this.

### 4.1 The TSX (verbatim, abridged imports)

```tsx
const T_HOME_YEARS = 10;
const PAD_X = 28;
const PAD_Y = 36;

export function WhoAgedLessScene() {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const tokens = useSceneTokens();
  const [beta, setBeta] = useState(0.6);
  const { width: WIDTH, height: HEIGHT } = useSceneSize(containerRef, {
    ratio: 0.45,
    maxHeight: SCENE_HEIGHT_SHORT,
  });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = applyDpr(canvas, WIDTH, HEIGHT);
    if (!ctx) return;
    ctx.clearRect(0, 0, WIDTH, HEIGHT);
    ctx.fillStyle = tokens.bg;
    ctx.fillRect(0, 0, WIDTH, HEIGHT);

    const g = gamma(beta);
    const tauTraveler = travelerProperTime(T_HOME_YEARS, beta);
    const delta = ageDifference(T_HOME_YEARS, beta);

    const plotX = PAD_X + 60;
    const plotW = WIDTH - plotX - PAD_X;
    const yearsToPx = (yrs: number) => plotX + (yrs / T_HOME_YEARS) * plotW;

    // Tick marks (every 2 years)
    ctx.strokeStyle = tokens.grid;
    ctx.lineWidth = 1;
    ctx.font = "10px ui-monospace, monospace";
    ctx.fillStyle = tokens.textFaint;
    ctx.textAlign = "center";
    for (let yr = 0; yr <= T_HOME_YEARS; yr += 2) {
      const px = yearsToPx(yr);
      ctx.beginPath();
      ctx.moveTo(px, PAD_Y);
      ctx.lineTo(px, HEIGHT - PAD_Y);
      ctx.stroke();
      ctx.fillText(`${yr}`, px, HEIGHT - PAD_Y + 14);
    }
    ctx.textAlign = "left";

    // Home bar (cyan), top
    const barH = 52;
    const homeY = PAD_Y + 12;
    ctx.fillStyle = hexToRgba(tokens.cyan, 0.18);
    ctx.fillRect(plotX, homeY, plotW, barH);
    ctx.fillStyle = tokens.cyan;
    ctx.fillRect(plotX, homeY, yearsToPx(T_HOME_YEARS) - plotX, barH);
    ctx.fillStyle = tokens.textBright;
    ctx.font = "11px ui-monospace, monospace";
    ctx.textAlign = "right";
    ctx.fillText("HOME", plotX - 8, homeY + barH / 2 + 4);
    ctx.textAlign = "left";
    ctx.fillStyle = tokens.bg;
    ctx.font = "12px ui-monospace, monospace";
    ctx.fillText(`${T_HOME_YEARS.toFixed(1)} yr`, plotX + 8, homeY + barH / 2 + 4);

    // Traveler bar (orange), bottom
    const travY = homeY + barH + 18;
    ctx.fillStyle = hexToRgba(tokens.orange, 0.18);
    ctx.fillRect(plotX, travY, plotW, barH);
    ctx.fillStyle = tokens.orange;
    ctx.fillRect(plotX, travY, yearsToPx(tauTraveler) - plotX, barH);
    ctx.fillStyle = tokens.textBright;
    ctx.font = "11px ui-monospace, monospace";
    ctx.textAlign = "right";
    ctx.fillText("TRAVELER", plotX - 8, travY + barH / 2 + 4);
    ctx.textAlign = "left";
    ctx.fillStyle = tokens.bg;
    ctx.font = "12px ui-monospace, monospace";
    ctx.fillText(`${tauTraveler.toFixed(2)} yr`, plotX + 8, travY + barH / 2 + 4);

    // HUD
    ctx.fillStyle = tokens.textDim;
    ctx.font = "11px ui-monospace, monospace";
    ctx.textAlign = "left";
    ctx.fillText(`β = ${beta.toFixed(3)}`, PAD_X, 18);
    ctx.fillText(`γ = ${g.toFixed(3)}`, PAD_X + 110, 18);
    ctx.fillText(`Δ = ${delta.toFixed(2)} yr younger`, PAD_X + 220, 18);
    ctx.fillStyle = tokens.textFaint;
    ctx.fillText("years (lab-frame T_home = 10)", PAD_X, HEIGHT - 8);
  }, [beta, tokens, WIDTH, HEIGHT]);

  return (
    <div ref={containerRef} className="flex w-full flex-col items-center gap-3">
      <canvas ref={canvasRef} style={{ width: WIDTH, height: HEIGHT, display: "block" }}
              className={SCENE_CANVAS_CLASS} />
      <label className="flex w-full items-center gap-3 font-mono text-xs ...">
        <span className="w-20">β = {beta.toFixed(2)}</span>
        <input type="range" min={0} max={0.99} step={0.01} value={beta}
               onChange={(e) => setBeta(parseFloat(e.target.value))}
               className="flex-1" style={{ accentColor: "var(--color-cyan)" }} />
        <span className="w-28">γ = {gamma(beta).toFixed(3)}</span>
      </label>
    </div>
  );
}
```

Math dependencies (`lib/physics/relativity/types.ts`, `twin-paradox.ts` — ported
to `PXMath` per §6):

```ts
export function gamma(beta: number): number {
  if (Math.abs(beta) >= 1) throw new RangeError(...);
  return 1 / Math.sqrt(1 - beta * beta);
}
export function travelerProperTime(THome: number, beta: number): number {
  return THome / gamma(beta);
}
export function ageDifference(THome: number, beta: number): number {
  return THome - travelerProperTime(THome, beta);
}
```

### 4.2 The Swift port (complete)

`PhysicsPackages/Sources/PXScenes/Scenes/relativity/WhoAgedLessScene.swift`:

```swift
import SwiftUI
import PXMath
import PXDesign

/// §03.5 WHO AGED LESS — bar-chart payoff at reunion.
/// Port of components/physics/the-twin-paradox/who-aged-less-scene.tsx
struct WhoAgedLessScene: View {
    @Environment(\.colorScheme) private var scheme
    @State private var beta: Double = 0.6

    private static let tHomeYears = 10.0
    private static let padX: CGFloat = 28
    private static let padY: CGFloat = 36

    var body: some View {
        let tokens = SceneTokens.resolve(scheme)
        VStack(alignment: .center, spacing: 12) {
            Canvas { ctx, size in
                draw(ctx, size: size, tokens: tokens)
            }
            .sceneAspect(ratio: 0.45, maxHeight: SceneMetrics.heightShort)

            SceneControlRow {
                Text("β = \(beta, specifier: "%.2f")")
                    .frame(width: 80, alignment: .leading)
                Slider(value: $beta, in: 0...0.99, step: 0.01)
                    .tint(tokens.cyan)
                Text("γ = \(Relativity.gamma(beta), specifier: "%.3f")")
                    .frame(width: 112, alignment: .leading)
            }
        }
    }

    private func draw(_ ctx: GraphicsContext, size: CGSize, tokens: SceneTokens) {
        let W = size.width, H = size.height
        // Web fills tokens.bg here — intentionally omitted (SceneCard owns the surface).

        let g = Relativity.gamma(beta)
        let tauTraveler = TwinParadox.travelerProperTime(tHome: Self.tHomeYears, beta: beta)
        let delta = TwinParadox.ageDifference(tHome: Self.tHomeYears, beta: beta)

        let plotX = Self.padX + 60
        let plotW = W - plotX - Self.padX
        func yearsToPx(_ yrs: Double) -> CGFloat {
            plotX + CGFloat(yrs / Self.tHomeYears) * plotW
        }

        // Tick marks (every 2 years) — grid line + centered top-anchored label.
        let tickFont = Font.system(size: 10, design: .monospaced)
        for yr in stride(from: 0, through: Int(Self.tHomeYears), by: 2) {
            let px = yearsToPx(Double(yr))
            var line = Path()
            line.move(to: CGPoint(x: px, y: Self.padY))
            line.addLine(to: CGPoint(x: px, y: H - Self.padY))
            ctx.stroke(line, with: .color(tokens.grid), lineWidth: 1)
            ctx.draw(Text("\(yr)").font(tickFont).foregroundStyle(tokens.textFaint),
                     at: CGPoint(x: px, y: H - Self.padY + 14), anchor: .top)
        }

        let mono11 = Font.system(size: 11, design: .monospaced)
        let mono12 = Font.system(size: 12, design: .monospaced)
        let barH: CGFloat = 52

        // Home bar (cyan), top.
        let homeY = Self.padY + 12
        ctx.fill(Path(CGRect(x: plotX, y: homeY, width: plotW, height: barH)),
                 with: .color(tokens.cyan.opacity(0.18)))
        ctx.fill(Path(CGRect(x: plotX, y: homeY,
                             width: yearsToPx(Self.tHomeYears) - plotX, height: barH)),
                 with: .color(tokens.cyan))
        // textAlign right, baseline alphabetic → trailing anchor at the baseline-ish point.
        ctx.draw(Text("HOME").font(mono11).foregroundStyle(tokens.textBright),
                 at: CGPoint(x: plotX - 8, y: homeY + barH / 2 + 4), anchor: .trailing)
        ctx.draw(Text(String(format: "%.1f yr", Self.tHomeYears))
                    .font(mono12).foregroundStyle(tokens.bg),
                 at: CGPoint(x: plotX + 8, y: homeY + barH / 2 + 4), anchor: .leading)

        // Traveler bar (orange), bottom.
        let travY = homeY + barH + 18
        ctx.fill(Path(CGRect(x: plotX, y: travY, width: plotW, height: barH)),
                 with: .color(tokens.orange.opacity(0.18)))
        ctx.fill(Path(CGRect(x: plotX, y: travY,
                             width: yearsToPx(tauTraveler) - plotX, height: barH)),
                 with: .color(tokens.orange))
        ctx.draw(Text("TRAVELER").font(mono11).foregroundStyle(tokens.textBright),
                 at: CGPoint(x: plotX - 8, y: travY + barH / 2 + 4), anchor: .trailing)
        ctx.draw(Text(String(format: "%.2f yr", tauTraveler))
                    .font(mono12).foregroundStyle(tokens.bg),
                 at: CGPoint(x: plotX + 8, y: travY + barH / 2 + 4), anchor: .leading)

        // HUD (textAlign left).
        ctx.draw(Text(String(format: "β = %.3f", beta))
                    .font(mono11).foregroundStyle(tokens.textDim),
                 at: CGPoint(x: Self.padX, y: 18), anchor: .leading)
        ctx.draw(Text(String(format: "γ = %.3f", g))
                    .font(mono11).foregroundStyle(tokens.textDim),
                 at: CGPoint(x: Self.padX + 110, y: 18), anchor: .leading)
        ctx.draw(Text(String(format: "Δ = %.2f yr younger", delta))
                    .font(mono11).foregroundStyle(tokens.textDim),
                 at: CGPoint(x: Self.padX + 220, y: 18), anchor: .leading)
        ctx.draw(Text("years (lab-frame T_home = 10)")
                    .font(mono11).foregroundStyle(tokens.textFaint),
                 at: CGPoint(x: Self.padX, y: H - 8), anchor: .leading)
    }
}
```

Translation decisions, in order:

1. `useSceneTokens()` → `SceneTokens.resolve(scheme)` computed in `body` (§2.1).
2. `useSceneSize(ratio: 0.45, maxHeight: SCENE_HEIGHT_SHORT)` → `.sceneAspect(ratio: 0.45, maxHeight: SceneMetrics.heightShort)` — same numbers (§2.3).
3. `applyDpr` + `clearRect` + the opaque `fillRect(bg)` → all deleted (§2.4, §3).
4. Module constants → `private static let` (values verbatim).
5. `gamma`/`travelerProperTime`/`ageDifference` → `PXMath` (`Relativity.gamma`, `TwinParadox.*`), argument labels added per §6 naming.
6. Stateful `ctx.textAlign` → per-call anchors: labels drawn with `textAlign="right"` get `.trailing`, `"left"` `.leading`, `"center"` (tick labels, which also set no baseline before but `fillText(px, …+14)` after `textAlign="center"`) — here the web sets baseline implicitly alphabetic; we accept the ±2 pt baseline tolerance of §3 and use the alignment-only anchor.
7. The `<input type="range">` row → `SceneControlRow` + `Slider` (§7); `accentColor: var(--color-cyan)` → `.tint(tokens.cyan)`; the `w-20`/`w-28` fixed-width spans → `.frame(width: 80/112, alignment: .leading)` (Tailwind w-20 = 5rem = 80 pt, w-28 = 7rem = 112 pt).
8. `beta` state: `useState(0.6)` → `@State = 0.6`; the draw depends on it, so SwiftUI re-renders the `Canvas` on slider change automatically (the web `useEffect` dep array has no equivalent — invalidation is free).

## 5. Worked example — animated scene (excerpts)

Source: `/Users/roman/Developer/physics/components/physics/polarization-modes/no-dipole-scene.tsx`
(212 lines; `useSceneTick` + pause button + accumulated phase + `drawSectionTitle`/`drawHudReadout`
+ dashed lines + ellipse + a `lib/physics` call `massDipole`).

Web animation core:

```tsx
const tickRef = useSceneTick(true);
const [paused, setPaused] = useState(false);
const phaseRef = useRef(0);
// in rAF loop:
const now = tickRef.current;
if (!paused) phaseRef.current += ((now - last) / 1000) * 1.4;  // rate 1.4 rad/s
last = now;
draw(ctx, tokens, phaseRef.current, width, height);
```

Swift port core (pattern from §2.5, rate 1.4 preserved):

```swift
struct NoDipoleScene: View {
    @Environment(\.colorScheme) private var scheme
    @State private var paused = false
    @State private var phaseAtPause: Double = 0
    @State private var resumeDate = Date()

    private func phase(at date: Date) -> Double {
        paused ? phaseAtPause
               : phaseAtPause + date.timeIntervalSince(resumeDate) * 1.4
    }

    var body: some View {
        let tokens = SceneTokens.resolve(scheme)
        VStack(spacing: 12) {
            TimelineView(.animation(paused: paused)) { timeline in
                Canvas { ctx, size in
                    draw(ctx, size: size, tokens: tokens, phase: phase(at: timeline.date))
                }
            }
            .sceneAspect(ratio: 0.52, maxHeight: SceneMetrics.heightDefault, minHeight: 300)

            SceneControlRow {
                Button(paused ? "play" : "pause") {
                    if paused { resumeDate = Date() }
                    else { phaseAtPause = phase(at: Date()) }
                    paused.toggle()
                }
                .buttonStyle(PXButtonStyle())   // PXDesign's mono button
            }
        }
    }
}
```

Inside `draw`, everything is §3 mechanics — representative lines:

```swift
// ctx.strokeRect(PAD, PAD + 18, panelW, H - PAD*2 - 30)
ctx.stroke(Path(CGRect(x: pad, y: pad + 18, width: panelW, height: H - pad*2 - 30)),
           with: .color(tokens.panelBorder), lineWidth: 1)

// drawSectionTitle(ctx, PAD + 4, PAD - 2, "DIPOLE — FORBIDDEN", tokens.textMute)
ctx.drawSectionTitle(x: pad + 4, y: pad - 2, "DIPOLE — FORBIDDEN", color: tokens.textMute)

// dashed CoM guide: ctx.setLineDash([2,3]) … ctx.setLineDash([])
ctx.stroke(comLine, with: .color(tokens.axes.opacity(0.4)),
           style: StrokeStyle(lineWidth: 1, dash: [2, 3]))

// breathing ellipse: ctx.ellipse(rightCx, cy, qsep + 8, sep*0.5, 0, 0, 2π)
ctx.stroke(Path(ellipseIn: CGRect(x: rightCx - (qsep + 8), y: cy - sep * 0.5,
                                  width: 2 * (qsep + 8), height: sep)),
           with: .color(tokens.magenta.opacity(0.3)), lineWidth: 1)

// const dip = massDipole([1,1], [symA, symB])  →  PXMath
let dip = PolarizationModes.massDipole(masses: [1, 1], positions: [symA, symB])
```

Physics state driven by an integrator (e.g. pendulum scenes stepping an ODE): keep
a `@State private var sim: SimState`, advance it in `.onChange(of: timeline.date)`
with `dt = min(date.timeIntervalSince(lastDate), 1/30)` and read it in the Canvas.
Derivable motion (like this scene's `sin(phase)`) needs no stored state — prefer
deriving from `t` whenever the web code does.

## 6. Porting `lib/physics` math to PXMath

- One web module → one Swift file: `lib/physics/relativity/twin-paradox.ts` →
  `PXMath/Sources/…/Relativity/TwinParadox.swift` (kebab-case → PascalCase; keep
  the directory taxonomy). Functions live in a caseless `enum` namespace matching
  the file (`enum TwinParadox { static func travelerProperTime(tHome:beta:) … }`).
  Free-standing shared helpers (`gamma`, `boostX`) go in the module matching their
  web home (`types.ts` → `Relativity.swift` namespace `Relativity`).
- Everything is `Double`. Web `{x, y}` vectors → `SIMD2<Double>` (typealias
  `Vec2 = SIMD2<Double>` in PXMath). Matrices → fixed-size structs, not arrays.
- Web `throw new RangeError(...)` → `precondition(...)` (these are programmer
  errors, matching web semantics of crashing loudly in dev).
- Copy the web doc comment (the physics explanation) onto the Swift function —
  they encode conventions (units, signs, idealizations) the drawing code relies on.
- Tests: the web repo keeps physics tests under `/Users/roman/Developer/physics/tests/`;
  when a module you're porting has one, port the assertions to swift-testing in
  `PhysicsPackages/Tests/PXMathTests/` (same file naming). These run with
  `swift test` — no simulator.

## 7. Interactive controls

Web scenes put `<input type="range">`, buttons, and readouts in a flex row below
the canvas. iOS standard (implement `SceneControlRow` once in PXScenes):

```swift
/// Standard control row: mono 12pt, textMute, horizontal, 12pt gaps, full width.
public struct SceneControlRow<Content: View>: View { … }
```

- `<input type="range" min max step value>` → `Slider(value:in:step:)`, `.tint(<the web accentColor token>)`.
- Readout spans (`β = {beta.toFixed(2)}`) → `Text` with `String(format:)`, fixed
  `.frame(width:)` when the web sets one (Tailwind `w-N` = N×4 pt).
- Play/pause `<Button>` → `Button` + `PXButtonStyle()` from PXDesign.
- `<select>` → segmented `Picker`. Checkboxes → `Toggle` (`.toggleStyle(.button)` when web renders a chip).
- Controls always OUTSIDE the `Canvas`, never drawn (web HUD text drawn on canvas stays on canvas).

## 8. Shared canvases — port once, 22 scenes become wrappers

### 8.1 `SpacetimeDiagramView` (from `_shared/SpacetimeDiagramCanvas.tsx`)

Port the component ONCE with its full prop surface (verified against source):

```swift
public struct SpacetimeDiagramView: View {
    public init(
        worldlines: [Worldline],                       // PXMath.Relativity type
        lightCone: Bool = true,
        simultaneitySlice: (tPrime: Double, beta: Double)? = nil,
        boostBeta: Binding<Double>? = nil,             // nil → internal state slider
        boostRange: ClosedRange<Double> = -0.95...0.95,
        boostStep: Double = 0.01,
        xRange: ClosedRange<Double> = -2...2,
        tRange: ClosedRange<Double> = 0...4,
        palette: SpacetimePalette? = nil               // defaults from SceneTokens
    )
}
```

Internals: margin 36; `xToPx`/`tToPx` linear maps (y inverted: `H - margin - …`);
integer grid lines; lab axes at x=0/t=0; light cone at ±45°; worldlines stroked
in palette colors (stationary=cyan, boosted=magenta, lightCone=amber,
accelerated=orange); optional boost slider below. Read the full 200-line web
file when porting — it is the one place you port geometry you didn't write.

### 8.2 `ManifoldView` (from `_shared/ManifoldCanvas.tsx`)

```swift
public struct ManifoldView: View {
    public init(
        embedding: @escaping (Double, Double) -> SIMD3<Double>,  // (u,v) → ℝ³
        uRange: ClosedRange<Double> = 0...(.pi),
        vRange: ClosedRange<Double> = 0...(2 * .pi),
        uSteps: Int = 16, vSteps: Int = 24,
        tangentArrows: [TangentArrow] = [],
        parallelTransport: ParallelTransportPath? = nil,
        geodesic: [ManifoldChartPoint]? = nil,
        rotationY: Binding<Double>? = nil,             // nil → internal slider, default 0.7
        palette: ManifoldPalette? = nil
    )
}
```

Projection: rotate around world-Y, drop z (isometric-ish) — transcribe `rotateY`
and the grid/arrow/transport drawing from source. NOTE: the web file hardcodes a
dark `DEFAULT_PALETTE` (`#0A0C12` background etc.) — on iOS derive the default
palette from `SceneTokens` instead and drop the background fill (§3), flagging
this intentional divergence in your report.

Dependent scenes (become thin config wrappers; the full list comes from grepping
`SpacetimeDiagramCanvas|ManifoldCanvas` under `components/physics/`, e.g.
`spacetime-diagrams/minkowski-axes-scene.tsx`, `spacetime-diagrams/worldline-construction-scene.tsx`,
`spacetime-diagrams/boosted-frame-scene.tsx`, `relative-simultaneity/spacetime-diagram-scene.tsx`,
`the-barn-pole-paradox/pole-frame-scene.tsx`, `four-vectors-and-proper-time/proper-time-integral-scene.tsx`;
`the-riemann-tensor/riemann-vs-flat-scene.tsx`, `the-metric-tensor/metric-ellipses-scene.tsx`,
`christoffels-and-parallel-transport/spherical-triangle-holonomy-scene.tsx`,
`manifolds-and-tangent-spaces/tangent-space-scene.tsx`). A wrapper is usually
<40 lines: compute worldlines/embedding via PXMath, pass props.

## 9. Registry & the wave process

### 9.1 SceneRegistry

```swift
public enum SceneRegistry {
    /// nil if the id has no native port yet (caller falls back to snapshot).
    public static func view(for id: String, props: SceneProps) -> AnyView?
    public static var registeredIds: Set<String> { get }
    static func register(_ id: String, _ make: @escaping (SceneProps) -> AnyView)
}
```

- **The id string must EXACTLY match the web `SceneId`** — the PascalCase export
  name used in `lib/content/simulation-registry.ts` (`"WhoAgedLessScene"`,
  `"NoDipoleScene"`, …). These ids appear verbatim in `content_entries` figure
  blocks, `scene_catalog.id`, and `:::scene{id="…"}` fences. A typo = silent
  snapshot fallback; the Gallery diff check (below) catches it.
- Registration is grouped per wave in `SceneRegistry+WaveNN.swift` files so waves
  never edit each other's files.
- `SceneProps` wraps the decoded JSON params (`default_props` from the catalog, or
  AI-supplied params for the curated catalog scenes): `props.double("beta", default: 0.6)`,
  `props.int/bool/string(_:default:)`. Scenes with no props ignore it.

### 9.2 Per-scene definition of done

1. Swift file compiles; no new dependencies; no edits outside `PXScenes` (+ its test target).
2. Registered in the wave's `SceneRegistry+WaveNN.swift`; id matches web export name exactly.
3. Renders in the debug Gallery (which lists `registeredIds` and deep-links per scene).
4. Visual check vs the web scene: screenshot via `xcrun simctl io booted screenshot`,
   compare against the `scene_catalog.snapshot_url` image (layout/colors/labels match;
   ±2 pt text-baseline tolerance).
5. Animated scenes: motion matches (rate constants copied verbatim); pause works;
   no frame work while paused.
6. Light AND dark theme both correct (no hardcoded colors — flip in Gallery).
7. No chrome: no border, no caption, no opaque background fill.
8. Any intentional divergence noted in the session report.

### 9.3 Wave manifests

Each wave prompt carries a manifest — one JSON array checked into
`docs/ios/prompts/scene-waves/`:

```json
[
  {
    "sceneId": "WhoAgedLessScene",
    "sourcePath": "components/physics/the-twin-paradox/who-aged-less-scene.tsx",
    "targetPath": "PhysicsPackages/Sources/PXScenes/Scenes/relativity/WhoAgedLessScene.swift",
    "mathDeps": [
      "lib/physics/relativity/types.ts",
      "lib/physics/relativity/twin-paradox.ts"
    ]
  }
]
```

Manifest authoring notes: `components/physics/` has per-topic SUBDIRECTORIES —
glob recursively (`components/physics/**/*.tsx`, excluding `_shared/` and the
registries). Group a wave's scenes by shared `mathDeps` so each PXMath module is
ported exactly once, in that wave, before its scenes.

### 9.4 Wave workflow (per session)

1. Port/verify the wave's PXMath modules first; `swift test`.
2. Port scenes in manifest order; **build after every 2–3 files**
   (`xcodebuild -scheme PhysicsExplained build` or `swift build`), never batch 15 then build.
3. Register as you go; run the Gallery diff (Gallery shows manifest ids not yet registered).
4. Screenshot-compare each scene (DoD #4); fix; check off in the manifest copy in your report.

## 10. JSXGraph scenes — NOT ctx translations

Eleven essay scenes render with JSXGraph (SVG) + mathjs instead of Canvas 2D
(all at `components/physics/` top level): `phase-portrait.tsx`,
`ellipse-construction.tsx`, `harmony-table.tsx`, `inverse-square-viz.tsx`,
`period-vs-amplitude-scene.tsx`, `small-angle-scene.tsx`,
`resonance-curve-scene.tsx`, `restoring-force-scene.tsx`,
`taylor-expansion-scene.tsx`, `separatrix-scene.tsx`, `eccentricity-slider.tsx` —
plus the Ask plotter `components/ask/math-plot.tsx`.

Do NOT port these with this playbook. They are reimplemented against the native
`PlotView` (axes/ticks/function-sampling plot renderer built in Phase 5 for the
`:::plot` fence — spec in `02-api-contracts.md` §plot). Until then they fall back
to snapshots like any unported scene. Scheduled Wave 2+.
