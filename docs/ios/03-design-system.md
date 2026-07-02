# 03 — Design System (PXDesign)

Visual identity spec for the iOS/iPadOS app (iOS 26+, Liquid Glass). Implemented as the `PXDesign` SPM target. Every value below was transcribed from production source on 2026-07-02:

- `/Users/roman/Developer/physics/app/globals.css` — **canonical token source** (the handoff file `design_handoff_color_tokens/colors_and_type.css` has drifted; where they disagree, `globals.css` wins — see "Known drift" at the end)
- `/Users/roman/Developer/physics/components/layout/scene-card.tsx` + `corner-frame.module.css`
- `/Users/roman/Developer/physics/components/layout/callout.tsx`, `components/math/equation-block.tsx`
- `/Users/roman/Developer/physics/lib/hooks/use-theme-colors.ts` (scene palette contract)
- `/Users/roman/Developer/physics/components/physics/_shared/scene-tokens.ts` (HUD fonts)

Identity in one sentence: **dark-first near-black instrument panel; depth from hairline borders and corner accents (never tonal layers or heavy shadows); mono uppercase labels everywhere; one restrained accent family.**

---

## 1. Color tokens → `PXColors`

Dark is the brand. Light is its own considered palette (accents re-derived for AA on off-white, not desaturated dark). The app follows the system color scheme; every color below is a dynamic color resolving per scheme.

### 1.1 Token table (exact hex from `app/globals.css`)

| Swift name | CSS var | Dark | Light | Role |
|---|---|---|---|---|
| `.bg` | `--color-bg` / `-0/-1/-2` | `#1A1D24` | `#FAFBFD` | THE background. Single surface — bg-0/1/2 are aliases of the same value; depth comes from borders, not layers |
| `.fg0` | `--color-fg-0` | `#EEF2F9` | `#0B1220` | Primary text, headings |
| `.fg1` | `--color-fg-1` | `#B6C4D8` | `#293244` | Body copy |
| `.fg2` | `--color-fg-2` | `#7D8DA6` | `#4A5569` | Secondary body, card subtitles |
| `.fg3` | `--color-fg-3` | `#56687F` | `#6E7A8F` | Meta, captions, muted, HUD labels |
| `.fg4` | `--color-fg-4` | `#2A3448` | `#CAD2DF` | Borders, rules, hairlines |
| `.accentCyan` | `--color-cyan` | `#6FB8C6` | `#5A8693` | Emphasis: links, primary buttons, math callout, EQ rail. NOTE: currently trialed equal to cyanDim (was `#5BE9FF`/`#0B7285`) |
| `.accentCyanDim` | `--color-cyan-dim` | `#6FB8C6` | `#5A8693` | Chrome: eyebrows, hover borders, pill outlines, icons |
| `.accentMagenta` | `--color-magenta` | `#FF6ADE` | `#B6219E` | Caution, coming-soon, trails |
| `.accentAmber` | `--color-amber` | `#F5C451` | `#9A6410` | Intuition callouts, figure numbers, citations |
| `.accentMint` | `--color-mint` | `#5BFFAE` | `#037A4B` | Success, "correct" state in scenes |
| `.sceneRed` | `--color-red` | `#F87171` | `#C4304B` | Scenes: forbidden / redshift / warning |
| `.sceneBlue` | `--color-blue` | `#7DD3FC` | `#1E5C8A` | Scenes: blueshift / cool / secondary |
| `.scenePurple` | `--color-purple` | `#A78BFA` | `#6B3FA0` | Scenes: tertiary accent |
| `.sceneOrange` | `--color-orange` | `#FB923C` | `#B0531A` | Scenes: accelerated / non-inertial |
| `.sceneGreen` | `--color-green` | `#86EFAC` | `#15803D` | Scenes: conserved / correct |
| `.gridWash` | `--color-grid` | `rgba(111,184,198,0.08)` | `rgba(90,134,147,0.10)` | Background grid overlay in scenes/cards |
| `.glow` | `--color-glow` | `rgba(111,184,198,0.35)` | `rgba(11,114,133,0.28)` | Link/button glow tints |

### 1.2 Swift API

```swift
// PXDesign/Sources/PXColors.swift
public enum PXColors {
    public static let bg          = dynamic(dark: 0x1A1D24, light: 0xFAFBFD)
    public static let fg0         = dynamic(dark: 0xEEF2F9, light: 0x0B1220)
    public static let fg1         = dynamic(dark: 0xB6C4D8, light: 0x293244)
    public static let fg2         = dynamic(dark: 0x7D8DA6, light: 0x4A5569)
    public static let fg3         = dynamic(dark: 0x56687F, light: 0x6E7A8F)
    public static let fg4         = dynamic(dark: 0x2A3448, light: 0xCAD2DF)
    public static let accentCyan    = dynamic(dark: 0x6FB8C6, light: 0x5A8693)
    public static let accentCyanDim = dynamic(dark: 0x6FB8C6, light: 0x5A8693)
    public static let accentMagenta = dynamic(dark: 0xFF6ADE, light: 0xB6219E)
    public static let accentAmber   = dynamic(dark: 0xF5C451, light: 0x9A6410)
    public static let accentMint    = dynamic(dark: 0x5BFFAE, light: 0x037A4B)
    public static let sceneRed    = dynamic(dark: 0xF87171, light: 0xC4304B)
    public static let sceneBlue   = dynamic(dark: 0x7DD3FC, light: 0x1E5C8A)
    public static let scenePurple = dynamic(dark: 0xA78BFA, light: 0x6B3FA0)
    public static let sceneOrange = dynamic(dark: 0xFB923C, light: 0xB0531A)
    public static let sceneGreen  = dynamic(dark: 0x86EFAC, light: 0x15803D)
    // gridWash/glow carry alpha — define with Color(.sRGB, ...) explicitly.
}
```

Implementation notes:
- Back each with `Color(uiColor: UIColor { trait in ... })` so scheme switching is automatic AND resolvable to concrete values inside `Canvas`/`GraphicsContext` draw closures (see §7).
- Keep the CSS custom-property names in doc comments (`/// --color-fg-3`) so future web↔iOS diffs are greppable.
- `accentCyan == accentCyanDim` today ("trial" in globals.css). Keep them as SEPARATE API names — the web may split them again (the pre-trial values were `#5BE9FF` dark / `#0B7285` light).

### 1.3 Scene palette contract

Web scenes receive colors through `useThemeColors()` (`lib/hooks/use-theme-colors.ts`), whose `ThemeColors` struct the Swift scene toolkit must mirror **including its two off-by-one mappings** (web scene code was written against them):

```swift
public struct SceneColors {   // mirrors ThemeColors in use-theme-colors.ts
    public let fg0: Color     // ← PXColors.fg0
    public let fg1: Color     // ← PXColors.fg1
    public let fg2: Color     // ← PXColors.fg3  (sic — web maps fg2 → --color-fg-3: labels, axis text)
    public let fg3: Color     // ← PXColors.fg4  (sic — web maps fg3 → --color-fg-4: gridlines, hairlines)
    public let bg0, bg1: Color            // ← PXColors.bg
    public let cyan, magenta, amber, mint: Color
    public let red, blue, purple, orange, green: Color
}
```

When porting a web scene that references `colors.fg2`, it means muted label color (`--color-fg-3`), NOT `PXColors.fg2`. This mapping lives in ONE place (`SceneColors.current(in:)` in PXScenes) — never hand-map in individual scenes.

---

## 2. Typography → `PXTypography`

### 2.1 Fonts (bundle all three — all OFL/SIL licensed)

| Family | Files to bundle | Used for |
|---|---|---|
| **Inter** (variable) | `Inter-VariableFont_opsz,wght.ttf` | Body, headings, UI |
| **JetBrains Mono** | weights 400/500/600 | Eyebrows, meta, HUD, captions, buttons, code, tables |
| **Archivo Narrow** | 500/600/700 + italics 600/700 | Display italic accent ONLY (single hero phrase) |

Register via `UIAppFonts` in Info.plist. Do NOT substitute SF Pro / SF Mono — the mono-label identity depends on JetBrains Mono.

### 2.2 Type scale

Base body is **18px / 1.65 line-height** (`globals.css` html/body). House rule: **headings are UPPERCASE with tight (negative) tracking; all labels/eyebrows/meta are mono uppercase with wide positive tracking.** Production heading sizes are per-component Tailwind utilities; the canonical scale below is from the design-handoff type spec, with 1rem = 18pt². (² On iOS treat CSS px as pt 1:1.)

| Swift style | Font | Size (pt) | Line height | Tracking | Transform | Color |
|---|---|---|---|---|---|---|
| `.h1` | Inter 600 | 32–60 (fit width; 34 iPhone / 48 iPad typical) | ×1.1 | −0.02em | none (title case) | fg0 |
| `.h2` | Inter 600 | 28–36 | ×1.15 | −0.015em | UPPERCASE | fg0 |
| `.h3` | Inter 600 | 24 | ×1.2 | −0.01em | UPPERCASE | fg0 |
| `.h4` | Inter 600 | 20 | ×1.25 | −0.01em | UPPERCASE | fg0 |
| `.body` | Inter 400 | 18 | ×1.65 | 0 | none | fg1 |
| `.bodyLarge` | Inter 400 | 22 | ×1.55 | 0 | none | fg1 |
| `.bodySmall` | Inter 400 | 16 | ×1.6 | 0 | none | fg1/fg2 |
| `.eyebrow` | JetBrains Mono 500 | 12 | ×1.0 | +0.2em | UPPERCASE | accentCyanDim |
| `.meta` | JetBrains Mono 400 | 11 | ×1.0 | +0.12em | UPPERCASE | fg3 |
| `.figCaption` | JetBrains Mono 400 | 12 | ×1.0 | +0.05em (`tracking-wider`) | UPPERCASE | fg3 |
| `.hudSmall` | JetBrains Mono 400 | 11 | ×1.0 | 0 | none | fg3 (per scene) |
| `.hudLarge` | JetBrains Mono 400 | 13 | ×1.0 | 0 | none | per scene |
| `.code` | JetBrains Mono 400 | 0.9× context | — | 0 | none | fg0 on fg4-40% bg, 1px fg4 border |
| `.button` | JetBrains Mono 400 | 14 | ×1.0 | +0.08em | UPPERCASE | see §5 |
| `.tableCell` | JetBrains Mono 400 | 14.4 (0.8rem) | — | 0 | none | fg1 |
| `.tableHeader` | JetBrains Mono 400 | 11.7 (0.65rem) | — | +0.1em | UPPERCASE | fg3 |
| `.displayItalic` | Archivo Narrow 600 italic | context | — | 0 | none | accentCyan |

API shape: `Text("§ BRANCHES").pxStyle(.eyebrow)` — a `ViewModifier` per style that sets font, tracking, case (apply `.uppercased()` to the string for transform styles), color default (overridable). Dynamic Type: support via `@ScaledMetric` relative to the 18pt base; clamp scene HUD text (it must fit canvas layouts).

RTL note (post-MVP Hebrew): Inter/Archivo lack Hebrew glyphs — web falls back to Heebo/Assistant (`globals.css` line 153). Not an MVP concern; keep font resolution behind one function so the fallback is a one-line change.

---

## 3. SceneCard chrome (the universal figure frame)

Source: `components/layout/scene-card.tsx`, `corner-frame.module.css`. **Every figure — native scene, snapshot image, or plot — renders inside this chrome. Scenes NEVER draw their own outer border.**

Anatomy (top to bottom):
1. **Caption** (optional, above the frame): `.figCaption` style — mono 12pt uppercase tracking-wider, fg3. Format `FIG.01 — THE PENDULUM`. 12pt gap below (web `mb-3`).
2. **Frame**: 1px hairline border `fg4`, background `bg` (web uses `--color-bg-1` = same value). NO corner radius on the frame (crisp instrument look; the 6pt `radiusControl` is for buttons only).
3. **Four corner squares**: 5×5pt filled `fg3`, positioned at each corner offset **−3pt** outside the border (square sits 3pt outside, 2pt inside — overlapping the 1px hairline). Render with `.overlay` + `offset`, `allowsHitTesting(false)`.
4. **Expand button**: top-right inside frame, 8pt inset; `arrow.up.left.and.arrow.down.right` (≈ Maximize2) 16pt, 1.5 stroke weight, fg3 → fg0 on press. Opens fullscreen cover with the same caption; the inline slot empties while expanded (don't render the scene twice — web comment: scenes can't exist in two places).
5. **Content slot**: horizontally scrollable if content is wider than the frame (`ScrollView(.horizontal)`); content centered.
6. **HUD slot** (optional): overlay bottom-right, 12pt inset, hit-testing disabled.

Vertical rhythm: 64pt above/below the whole figure in article flow (web `my-16`).

The same corner-bracket frame is reused by **callouts** and **equation blocks**:
- **Callout** (`callout.tsx`): frame + corners as above, 2px left rail + mono 12pt uppercase label in variant color, body fg1, padding 24×20pt, 24pt vertical margins. Variants: intuition → amber "INTUITION"; math → cyan "MATH"; warning → magenta "CAUTION"; info → cyanDim "INFO"; note → fg3 "NOTE".
- **EquationBlock** (`equation-block.tsx`): frame + corners, 2px **cyan** left rail, mono 12pt uppercase fg3 ID label ("EQ.01") above, equation fg0, padding 24×20pt (12×16pt compact), 32pt vertical margins, horizontal scroll for wide math.

---

## 4. Liquid Glass usage rules

Glass is the **system chrome layer**; the brand surface stays the flat near-black panel. Never put glass between the reader and content.

**Glass (system materials / `.glassEffect()`):**
- Tab bar / `NavigationSplitView` sidebar chrome, toolbars
- The Ask input bar (floating capsule above keyboard)
- Sheets & popovers (glossary/physicist term sheets, model picker)
- Floating scene controls in fullscreen figure view (play/pause, sliders)
- Playground HUD controls (overlaid on the simulation canvas)

**Never glass (flat `PXColors.bg`):**
- The article reading surface
- Scene/plot canvas interiors (instrument panel, not frosted)
- SceneCard, callout, equation frames — hairline-bordered flat panels

Legibility on glass: labels over glass use `.fg0`/system label colors, mono uppercase per §2; keep glass regions small and never overlay body text on scene content.

**Motion tokens** (`globals.css`): fast 180ms, base 320ms, slow 600ms.

```swift
public enum PXMotion {
    public static let fast  = Animation.easeOut(duration: 0.18)  // hovers, taps, color changes
    public static let base  = Animation.easeInOut(duration: 0.32) // theme/layout transitions
    public static let slow  = Animation.easeInOut(duration: 0.60) // hero/fullscreen transitions
}
```

Respect `accessibilityReduceMotion` (web honors `prefers-reduced-motion`): skip decorative sweeps; keep functional scene animation but expose pause.

---

## 5. Controls, layout & spacing

- **Buttons** ("keycap" style): mono uppercase 14pt +0.08em; padding 12×24pt; corner radius `radiusControl = 6pt`; 1px border. Primary: cyan border + cyan text, subtle cyan glow shadow on press (web `--shadow-control-primary`). Ghost: fg4 border + fg1 text → cyanDim on press. Danger: magenta. Background transparent → 10% accent fill on press. Depth: faint inner top highlight + small drop shadow (web `--shadow-control`); keep subtle.
- **Links**: accentCyan, no underline; pressed state adds glow (`.glow` shadow, web `text-shadow: 0 0 12px`). Term links (glossary): dotted underline fg4, offset 3pt → cyan on press.
- **Spacing scale**: 4pt base grid; common steps 4/8/12/16/24/32/48/64. Section spacing 64pt (`my-16`), callouts 24pt, equations 32pt.
- **Reading width**: max ~680pt (38em at 18pt) for article text, centered. iPad: content column + aside column (see `04-block-rendering-spec.md` §aside).
- **Tables**: mono 14.4pt; header 11.7pt uppercase +0.1em fg3; cells fg1; row separators 1px fg4 bottom only (none under last row); cell padding 7×13.5pt; no vertical rules; horizontal scroll when wide.
- **Grid wash**: large panels (hero cards, playground background) may draw a square grid in `.gridWash` — the signature backdrop texture. Spacing ~24pt, 1px lines.
- **Depth rule**: no tonal surface stacking (bg-0/1/2 are identical on web). Elevation = hairline border + corner accents (+ glass for system chrome only).

---

## 6. iPhone vs iPad

- One codebase; differentiate by size class, never device idiom checks.
- **iPhone (compact)**: `TabView` — Learn / Ask / Play / Settings(Account). Article is a single column; asides collapse (04 §aside).
- **iPad (regular)**: `NavigationSplitView` — sidebar (branches → modules → topics), content column, article detail. Ask gets a conversations sidebar. Reading column keeps max width with generous margins; asides render as a right rail.
- Fullscreen figure view targets 120Hz ProMotion (animated scenes drive via `TimelineView(.animation)`).

---

## 7. Dark/light switching

- Follow the system scheme (plus an optional in-app override in Settings, persisted; maps to `.preferredColorScheme`).
- All chrome colors are dynamic via PXColors — no per-view scheme branching.
- **Scenes**: resolve `SceneColors` at draw time from the SwiftUI environment (`@Environment(\.colorScheme)` → `SceneColors.current`) and pass into `GraphicsContext` draw code — the Swift analogue of web's CSS-var read + MutationObserver re-render. Redraws are automatic when scheme changes since views depend on the environment.
- Formula images (SwiftMath) are cache-keyed on color scheme (see `04-block-rendering-spec.md` §TeX policy).

---

## 8. Debug Gallery screen (built in P1)

A debug-only screen enumerating: full color swatch grid (both schemes side by side), every text style with sample strings, buttons in all variants/states, SceneCard + callout(×5) + EquationBlock chrome samples, grid-wash panel, and (from P4) every registered scene by id. This is the executor's visual test harness — every subsequent phase adds its components here, and `xcrun simctl io booted screenshot` captures it for review.

---

## Known drift: handoff CSS vs production

`design_handoff_color_tokens/colors_and_type.css` (dated mirror) disagrees with `app/globals.css` (production):

| Token | Handoff | Production (use this) |
|---|---|---|
| Dark bg | `#07090E` | `#1A1D24` |
| Dark cyan | `#5BE9FF` (emphasis) vs `#6FB8C6` (dim) | both `#6FB8C6` ("trial") |
| Light cyan | `#0B7285` / `#5A8693` | both `#5A8693` |
| Dark glow | `rgba(91,233,255,0.35)` | `rgba(111,184,198,0.35)` |
| Scene extras red/blue/purple/orange/green | absent | present (§1.1) |
| Keycap shadows, `--radius-control: 6px` | absent | present |

The handoff file remains the best reference for the **type scale** (globals.css styles headings per-component via Tailwind). If the web "trial" cyan reverts, only the two hex pairs in `PXColors.accentCyan`/`accentCyanDim` change.
