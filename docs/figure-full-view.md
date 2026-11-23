# Figure full view — standards

How an interactive figure looks and behaves when it is expanded: separate
cards, text and drawing that grow on large screens, and a hover link between
the drawing and its guide.

Reference page: `/classical-mechanics/motion-in-a-straight-line` (FIG.01a–d).
Reference scene to copy: `components/physics/kinematics-graph-scene.tsx`
(graphs) or `components/physics/free-fall-scene.tsx` (objects).

Everything here applies **in full view only**. The inline figure in the
article must look exactly as it did before a scene is converted.

To bring another figure up to this standard, the prompt is:

> Apply `docs/figure-full-view.md` to `<SceneName>` (and add its guide in
> `lib/content/figure-guides.ts` if it has none). Check it against the
> checklist at the end of that file.

Scene rules that are not specific to the full view (tokens, playback, sliders,
readouts) are in `components/physics/_shared/README.md`.

---

## 1. Layout: what is fixed

The shell is `components/layout/figure-popup.tsx` + `.figure-popup-*` in
`app/globals.css`. Do not change it per scene.

| Part | Rule |
| --- | --- |
| Panel | Whole screen below `lg`; `96vw × 92dvh`, max width 1960px from `lg` up. Square corner-frame, as on the rest of the site. |
| Guide | Beside the figure when the window is wide (`GUIDE_BESIDE_QUERY`); otherwise its cards follow the figure's cards in the same scroll (no split view). Width `clamp(320px, 31vw, 440px × text scale)`. |
| Insets | One value everywhere: `0.75rem` around the figure column, around the guide column, and between any two cards (`--figure-gap`). The guide column drops its inner side inset, so the gap between the two columns is the same `0.75rem`. |
| Height | The figure never scrolls when it can fit: `useSceneSize` gives the canvas what is left after the scene's own cards. |

## 2. Cards

The parts of a figure are separate rounded cards. The outer panel keeps the
square frame; cards are the only rounded surfaces.

| Card | Component | Contents |
| --- | --- | --- |
| Drawing | `<SceneStage>` | the `<canvas>` only |
| Playback and numbers | `<ScenePanel>` | `<SceneControls>` then `<SceneReadout>` (readout alone for a static scene) |
| Parameters | `<SceneControlGroup>` | `<SceneSlider>` rows and preset buttons |
| Guide sections | `.figure-card` in `figure-guide.tsx` | one card per section |

Tokens (all in `app/globals.css`):

| Token | Value | Use |
| --- | --- | --- |
| `--radius-card` | `12px` | every card |
| `--radius-control` | `6px` | buttons, chips, the hover mark |
| border | `1px solid var(--color-fg-4)` | every card |
| fill | `color-mix(in srgb, var(--color-fg-0) 2.5%, transparent)` | panels and guide cards; the drawing card has no fill |
| `--figure-gap` | `0.75rem` | between cards, around columns |
| `--figure-pad` | `1rem` | inside a card, left and right; `0.625 ×` that top and bottom for scene panels |

Rules:

- The drawing card's edge is a `box-shadow` ring, not a border, so the canvas
  keeps exactly the width `useSceneSize` returned. Never pad the stage.
- Scenes add no card styling of their own. They only use the three wrappers;
  inline these render as plain blocks.
- The scene root is `<div ref={containerRef} className="scene-root w-full pb-4">`
  with `<div className="mx-auto" style={{ width }}>` inside. `scene-root`
  drops the bottom padding in full view.
- Prefer `fullView: "fill"` when the drawing adapts to any shape (graphs,
  ramps, columns). Use `"ratio"` only when the drawing has a true aspect
  ratio; it leaves empty margins beside the cards.

## 3. Scale

One number drives all sizes: `figureScale(window width, window height)` in
`components/physics/_shared/scene-tokens.ts`.

```
scale = clamp(1, min(width / 1330, height / 870), 1.5)
```

| Window | Scale | Canvas label (11px base) | Readout (text-xs) | Guide prose (text-sm) |
| --- | --- | --- | --- | --- |
| phone, laptop up to 1330 × 870 | 1 | 11px | 13.5px | 15.75px |
| 1920 × 1080 | 1.24 | 13.6px | 15.1px | 17.6px |
| 2560 × 1440 and larger | 1.5 | 16.5px | 16.9px | 19.7px |

- **Canvas** uses the full scale: `tokens.scale` (also `useSceneScale()`).
- **HTML text** uses half of the increase: `figureTextScale(scale) = 1 + (scale − 1) / 2`,
  published on the panel as `--figure-text-scale`. Running text needs less
  enlargement than labels on a large drawing.
- Inline the scale is always 1.

### Canvas rules

- Fonts come from the tokens (`tokens.fontHudSmall` 11, `fontHud` / `fontLabel` 12,
  `fontHudLarge` 13); they are already multiplied by the scale. Every
  `drawLabel` call passes one. Never write a pixel font string in a scene.
- Every other pixel constant goes through `const u = (n: number) => n * tokens.scale`:
  gutters and rows, tick lengths, line widths above 1, dash patterns, dot and
  ball radii, arcs, glow blur, label offsets. Hairlines (grid, axes) stay 1px.
- `drawLabel` with a `plate` also takes `scale: tokens.scale`.
- Size roles: axis numbers and units `fontHudSmall`; graph titles and captions
  `fontLabel`; names of objects (column titles such as "hammer") `fontHudLarge`.
- Small text uses `tokens.textLabel` or brighter, never `textMute`.
- Drawn objects that would look lost on a tall canvas also grow with it:
  `objectScale = min(2.6, max(scale, height / <inline max height>))`. At
  inline sizes this is 1.
- Compute the layout (paddings, plot rectangle, object positions) in the
  component body, not inside `draw`, so the hit test can share it.
- Two scales, kept apart: text, offsets and hairline-class lines use
  `tokens.scale` (`u`); drawn objects use the object scale (`o`). A gap that
  must clear an object is the sum of both, `u(a) + o(b)`, never one `u(n)`.
- Detail follows pixel density. Finer ticks and gridlines appear only above a
  pixels-per-unit threshold higher than the largest inline value (FIG.01c:
  0.1 m ticks from `u(200)` px per metre), so the inline drawing cannot change.
- A line that objects rest on (a floor) thickens on the side away from them,
  so the resting position does not move.
- A gridline starts after its label: use the box `drawLabel` returns.
- Over a tinted region `tokens.grid` disappears; use `hexToRgba(tokens.axes, 0.35)`.
- Keep simulation state in physical units (metres, seconds), never pixels, so
  a resize or opening the full view mid-animation cannot move anything.

### HTML rules

- Inside the panel, Tailwind's `text-xs`, `text-sm` and `text-base` already
  follow the scale (the panel redefines `--text-xs` / `--text-sm` / `--text-base`).
  Use those classes and nothing needs to be done.
- For a fixed pixel size use the panel's variables with the plain size as the
  fallback: `text-[length:var(--figure-fs-11,11px)]` (10, 11 and 13 exist).
- Do not use a bare `text-[11px]` inside the full view: it will not grow.
- Slider thumbs and tracks follow the same variable (`.scene-range`).

## 4. Hover link between figure and guide

Pointing at something on one side marks its counterpart on the other, in both
directions. The shared name is the `key` of the guide entry in
`lib/content/figure-guides.ts` (`readouts` and `controls`).

The link is on only in full view and only for a figure that has a guide
(`FigureLinkProvider` in `SceneCard`). Elsewhere every hook below is inert.

| Side | What to do |
| --- | --- |
| Readout | `guideKey` on the `SceneReadout` item |
| Slider | `guideKey` on `<SceneSlider>` |
| Scrubber, playback note | `scrubKey`, `noteKey` on `<SceneControls>` |
| Guide entry | nothing; `figure-guide.tsx` wraps each entry in `<FigureGuideItem>` |
| Canvas | `useSceneHover(canvasRef, hitTest)` |

Canvas contract:

```tsx
const hover = useSceneHover(canvasRef, (x, y) => /* guide key under (x, y) or null */);
const { activeKey, pointer } = hover;
```

- `hitTest` returns the most specific thing first (a point before the line
  through it). A whole plot may stand for the quantity it plots. Reach is
  about `u(9)` around lines and points.
- `activeKey` is the key pointed at anywhere — canvas, readout, slider or
  guide. In `draw`, emphasise its element and nothing else:
  - a curve: line width `u(3)` (from `u(2)`), the other curves at 35% opacity;
  - an object or point: `drawFocusRing(ctx, x, y, r, color, scale)`;
  - a construction line (triangle legs, angle arc, tick marks): accent colour
    and `u(1.5)`–`u(2)`, with its name on a plate (`Δt`, `θ = 18°`);
  - something normally hidden may appear while its key is active (the tangent
    line in FIG.01b).
- A control's key may emphasise what it changes (the `velocity` slider marks
  the v(t) graph).
- A static scene redraws from an effect: add `activeKey` and `pointer` to its
  dependencies. Animated scenes repaint after every render already.
- Hit tests that need the live clock read it from a ref (`playback.getTime()`),
  as in `inclined-plane-scene.tsx`.

Measurement guidelines (graphs): while `pointer` is inside a plot, draw dashed
lines from the curve point at that time to both axes, a hollow dot on the
curve, and the two values on plates (`drawLabel` with `plate: tokens.bg1`) at
the axes, in `fontHudSmall`. Colour: the curve's accent.

The mark on HTML elements is the `.figure-link` class with
`data-link-active="true"`: 12% cyan tint and a 60% cyan outline, drawn with
outline and shadow only, so nothing moves. The link only highlights;
nothing scrolls, on any screen.

Every key in a guide's `readouts` and `controls` should have a counterpart in
the scene. If a readout has no drawn counterpart, the HTML readout alone is
enough.

## 5. Files

| File | Role |
| --- | --- |
| `components/layout/figure-popup.tsx` | the shell; sets `--figure-scale`, `--figure-text-scale` |
| `components/layout/scene-card.tsx` | moves the scene into the shell; provides scale and the link |
| `app/globals.css` | `--radius-card`; "Full view" sections: type scale, cards, hover link |
| `components/physics/_shared/scene-tokens.ts` | `figureScale`, `figureTextScale`, `sceneFont`, `useSceneScale`, `drawFocusRing`, `drawLabel` |
| `components/physics/_shared/scene-stage.tsx` | `SceneStage`, `ScenePanel` |
| `components/physics/_shared/figure-link.tsx` | `FigureLinkProvider`, `useFigureLinkTarget` |
| `components/physics/_shared/use-scene-hover.ts` | `useSceneHover` |
| `components/content/figure-guide.tsx`, `figure-guide-item.tsx` | guide cards and linked entries |
| `lib/content/figure-guides.ts` | guide structure and the keys |

Tests: `tests/components/physics/scene-kit.test.tsx` (scale, link),
`tests/components/layout/scene-card.test.tsx` (scale reaches the scene),
`tests/content/figure-guide.test.tsx` (guide).

## 6. Checklist for a scene

1. Wrappers: `scene-root`, `SceneStage`, `ScenePanel`, `SceneControlGroup`.
2. No pixel font strings; every `drawLabel` has a token font.
3. Every pixel constant goes through `u()`; objects use `objectScale` if the
   canvas can get tall.
4. Layout computed in the component body; `useSceneHover` with a `hitTest`.
5. `guideKey` / `scrubKey` / `noteKey` set for every key in the scene's guide.
6. Emphasis drawn for every key that has something on the canvas; graphs have
   measurement guidelines.
7. Look at it: full view at 390 × 844, 844 × 390, 1280 × 800, 1920 × 1080 and
   2560 × 1440, dark and light, English and Hebrew. No clipped or colliding
   labels, no scrollbar beside the figure, cards aligned with the guide's.
8. Inline at 390 and 1280 wide: unchanged from before.
9. `npx tsc --noEmit -p .` and `pnpm test` pass.
