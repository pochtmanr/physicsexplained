"use client";

/**
 * Shared design tokens for `physics.explained` Canvas 2D scenes.
 *
 * Tokens are theme-aware: they read from the CSS variables defined in
 * `app/globals.css` ([data-theme="dark"] / [data-theme="light"]) via the
 * `useThemeColors()` hook. Calling `useSceneTokens()` inside a component
 * yields a token bag whose values flip automatically when the user toggles
 * the theme.
 *
 * Reference scenes (canonical examples to mirror):
 *   - components/physics/dielectric-capacitor-scene.tsx (EM, responsive)
 *   - components/physics/maxwell-and-the-speed-of-light/foucault-rotating-mirror-scene.tsx (RT, responsive)
 *   - components/physics/einsteins-field-equations/efe-split-screen-scene.tsx (RT, responsive split panels)
 */

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type RefObject,
} from "react";
import { useThemeColors, type ThemeColors } from "@/lib/hooks/use-theme-colors";

export interface SceneTokens {
  // ── Surfaces ───────────────────────────────────────────────────────────
  /** Page/scene background (theme bg-0). */
  bg: string;
  bg1: string;

  // ── Text ───────────────────────────────────────────────────────────────
  /** Primary text — strong contrast (theme fg-0). */
  textBright: string;
  /** Secondary text (theme fg-1). */
  textDim: string;
  /** Muted text — meta, captions (theme fg-3). */
  textMute: string;
  /** Faint text — tertiary (theme fg-4). */
  textFaint: string;
  /**
   * Small text that must stay readable: axis numbers, units, scale labels.
   * Passes AA on the scene background in both themes, which `textMute` does
   * not at these sizes.
   */
  textLabel: string;

  // ── Grid + axes (derived from fg) ──────────────────────────────────────
  /** Light hairlines: alpha 0.5 of fg-4. */
  grid: string;
  /** Heavier grid lines: fg-4 at full opacity. */
  gridHeavy: string;
  /** Axes color: fg-2 (= --color-fg-3). */
  axes: string;
  /** Subtle panel border: fg-4. */
  panelBorder: string;

  // ── Semantic accents (theme-aware) ─────────────────────────────────────
  /** Lab / stationary / primary-positive. */
  cyan: string;
  /** Boosted / dynamic / contrast. */
  magenta: string;
  /** Light / photon / amber accent / highlight. */
  amber: string;
  /** Conserved / correct / equilibrium. */
  mint: string;
  /** Forbidden / redshift / warning. */
  red: string;
  /** Blueshift / cool / secondary. */
  blue: string;
  /** Tertiary accent (use sparingly). */
  purple: string;
  /** Accelerated / non-inertial. */
  orange: string;
  /** Conserved / correct (alias of mint at lower saturation). */
  green: string;

  // ── Typography ─────────────────────────────────────────────────────────
  fontHud: string;
  fontHudSmall: string;
  fontHudLarge: string;
  fontSection: string;
  fontLabel: string;
  /**
   * Size multiplier for everything drawn in pixels: 1 inline, up to
   * `FIGURE_SCALE_MAX` in full view on a large screen. The fonts above are
   * already multiplied by it; multiply paddings, radii and line widths too.
   */
  scale: number;

  /** Underlying theme colors — exposed so scenes can pass them to canvas
   *  primitives that take a `palette` prop (SpacetimeDiagramCanvas, ManifoldCanvas). */
  colors: ThemeColors;
}

/**
 * Theme-aware design tokens for canvas scenes. Subscribes to `data-theme`
 * changes via `useThemeColors()` so a theme switch re-renders the scene.
 */
export function useSceneTokens(): SceneTokens {
  const colors = useThemeColors();
  const scale = useSceneScale();

  return useMemo<SceneTokens>(
    () => ({
      bg: colors.bg0,
      bg1: colors.bg1,

      textBright: colors.fg0,
      textDim: colors.fg1,
      textMute: colors.fg2,
      textFaint: colors.fg3,
      textLabel: colors.fgLabel,

      grid: hexToRgba(colors.fg3, 0.5),
      gridHeavy: colors.fg3,
      axes: colors.fg2,
      panelBorder: colors.fg3,

      cyan: colors.cyan,
      magenta: colors.magenta,
      amber: colors.amber,
      mint: colors.mint,
      red: colors.red,
      blue: colors.blue,
      purple: colors.purple,
      orange: colors.orange,
      green: colors.green,

      fontHud: sceneFont(12, scale),
      fontHudSmall: sceneFont(11, scale),
      fontHudLarge: sceneFont(13, scale),
      fontSection: sceneFont(11, scale),
      fontLabel: sceneFont(12, scale),
      scale,

      colors,
    }),
    [colors, scale],
  );
}

/** Canvas font string for the scene typeface at `px` × `scale`. */
export function sceneFont(px: number, scale = 1): string {
  return `${Math.round(px * scale * 10) / 10}px ui-monospace, monospace`;
}

// ── Typography (fixed across themes) ───────────────────────────────────
export const FONT_HUD = "12px ui-monospace, monospace";
export const FONT_HUD_SMALL = "11px ui-monospace, monospace";
export const FONT_HUD_LARGE = "13px ui-monospace, monospace";
export const FONT_SECTION = "11px ui-monospace, monospace";
export const FONT_LABEL = "12px ui-monospace, monospace";

// ── Canvas styling helpers ─────────────────────────────────────────────

/** Apply DPR scaling. Call once per useEffect with logical W/H in px. */
export function applyDpr(
  canvas: HTMLCanvasElement,
  W: number,
  H: number,
): CanvasRenderingContext2D | null {
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;
  const dpr = typeof window !== "undefined" ? window.devicePixelRatio || 1 : 1;
  canvas.width = W * dpr;
  canvas.height = H * dpr;
  canvas.style.width = `${W}px`;
  canvas.style.height = `${H}px`;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  return ctx;
}

/**
 * Per-frame variant of `applyDpr` for animated scenes: resizes the backing
 * store only when the size actually changed, otherwise just clears it.
 * (`applyDpr` reallocates the canvas on every call, which is fine for a
 * static scene but wasteful sixty times a second.)
 */
export function syncCanvas(
  canvas: HTMLCanvasElement,
  W: number,
  H: number,
): CanvasRenderingContext2D | null {
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;
  const dpr = typeof window !== "undefined" ? window.devicePixelRatio || 1 : 1;
  const bw = Math.max(1, Math.round(W * dpr));
  const bh = Math.max(1, Math.round(H * dpr));
  if (canvas.width !== bw || canvas.height !== bh) {
    canvas.width = bw;
    canvas.height = bh;
  } else {
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, bw, bh);
  }
  canvas.style.width = `${W}px`;
  canvas.style.height = `${H}px`;
  ctx.setTransform(bw / W, 0, 0, bh / H, 0, 0);
  return ctx;
}

/**
 * Standard scene container className.
 *
 * The canonical placement for a scene is INSIDE a `<SceneCard>`, which
 * already provides the bordered frame + 4 corner squares + scene
 * background. Canvases therefore should NOT add their own border,
 * rounded corners, or background — they would compete with the card
 * frame and stop adapting to the active theme.
 *
 * Render the canvas as `block` and let `<SceneCard>` own the chrome:
 *   <canvas className={SCENE_CANVAS_CLASS} />
 */
export const SCENE_CANVAS_CLASS = "block";

/**
 * Hook: responsive canvas size driven by a container's width.
 *
 * Pattern (mirrors dielectric-capacitor-scene.tsx):
 *
 *   const containerRef = useRef<HTMLDivElement>(null);
 *   const { width, height } = useSceneSize(containerRef, {
 *     ratio: 0.55,
 *     maxHeight: SCENE_HEIGHT_DEFAULT,
 *   });
 *   ...
 *   <div ref={containerRef} className="w-full">
 *     <canvas style={{ width, height }} className={SCENE_CANVAS_CLASS} />
 *   </div>
 *
 * Combine with `applyDpr(canvas, width, height)` inside the draw effect
 * so the canvas stays sharp across DPR + theme transitions.
 */
export type SceneFullViewMode = "width" | "ratio" | "fill";

export interface UseSceneSizeOptions {
  /** height = width × ratio, capped at maxHeight. Default 0.55. */
  ratio?: number;
  /** Hard ceiling on rendered height (px). Default 460. */
  maxHeight?: number;
  /** Hard floor on rendered height (px). Default 220. */
  minHeight?: number;
  /** Initial width before ResizeObserver fires. Default 720. */
  initialWidth?: number;
  /**
   * How the canvas uses the full-view popup:
   * - "width" (default): keep the container's width; height follows `ratio`,
   *   up to the height available. Safe for any scene.
   * - "ratio": the largest canvas at exactly `ratio` that fits. The canvas can
   *   be narrower than the container, so the scene must centre it and its
   *   controls (`<div className="mx-auto" style={{ width }}>`).
   * - "fill": the whole width and the whole available height. For drawings
   *   that adapt to any shape (stacked graphs, the ramp).
   */
  fullView?: SceneFullViewMode;
}

/**
 * Where a scene is currently shown. `<SceneCard>` provides it; scenes read it
 * through `useSceneSize`, so a scene never needs to know about the popup.
 */
export interface SceneView {
  /** True while the figure is shown in the full-view popup. */
  expanded: boolean;
  /** Height in px the whole scene (canvas + controls) may use when expanded. */
  availableHeight: number | null;
  /**
   * Size multiplier for text and drawn objects: 1 inline, larger in full view
   * on a large screen (see `figureScale`). Optional so a provider that does
   * not care can leave it out.
   */
  scale?: number;
}

export const SceneViewContext = createContext<SceneView>({
  expanded: false,
  availableHeight: null,
  scale: 1,
});

export function useSceneView(): SceneView {
  return useContext(SceneViewContext);
}

/** The current size multiplier (see `SceneView.scale`). */
export function useSceneScale(): number {
  return useContext(SceneViewContext).scale ?? 1;
}

/** Largest size multiplier the full view uses. */
export const FIGURE_SCALE_MAX = 1.5;

/**
 * Size multiplier for a figure in full view, from the window size. 1 up to a
 * 1330 × 870 window (phones, laptops), about 1.24 at 1920 × 1080, and the
 * maximum from 2560 × 1440. The smaller of the two directions decides, so a
 * wide but short window does not get text its height cannot hold.
 * See docs/figure-full-view.md.
 */
export function figureScale(viewportWidth: number, viewportHeight: number): number {
  const fit = Math.min(viewportWidth / 1330, viewportHeight / 870);
  if (!Number.isFinite(fit)) return 1;
  return Math.min(FIGURE_SCALE_MAX, Math.max(1, Math.round(fit * 100) / 100));
}

/**
 * The same multiplier, damped by half, for HTML text (readouts, sliders, the
 * guide): running text needs less enlargement than labels on a big canvas.
 */
export function figureTextScale(scale: number): number {
  return 1 + (scale - 1) / 2;
}

/**
 * Pure sizing rule behind `useSceneSize`.
 *
 * Inline: width follows the container, height = width × ratio clamped to
 * [minHeight, maxHeight].
 *
 * Full view (`availableHeight` set): `maxHeight` no longer applies; the limit
 * is the height left after the scene's own controls (`chromeHeight`). See
 * `UseSceneSizeOptions.fullView` for the three modes. In every mode the
 * result is at least as tall as `minHeight`, so a full view is never shorter
 * than the inline figure at the same width.
 */
export function computeSceneSize(args: {
  containerWidth: number;
  ratio: number;
  maxHeight: number;
  minHeight: number;
  availableHeight?: number | null;
  chromeHeight?: number;
  fullView?: SceneFullViewMode;
}): { width: number; height: number } {
  const { containerWidth, ratio, maxHeight, minHeight } = args;
  if (args.availableHeight != null && args.availableHeight > 0) {
    const room = Math.max(minHeight, args.availableHeight - (args.chromeHeight ?? 0));
    const mode = args.fullView ?? "width";
    if (mode === "fill") return { width: containerWidth, height: room };
    const width =
      mode === "ratio" ? Math.max(1, Math.min(containerWidth, room / ratio)) : containerWidth;
    return { width, height: Math.min(room, Math.max(minHeight, width * ratio)) };
  }
  return {
    width: containerWidth,
    height: Math.max(minHeight, Math.min(containerWidth * ratio, maxHeight)),
  };
}

export function useSceneSize<T extends HTMLElement>(
  containerRef: RefObject<T | null>,
  opts: UseSceneSizeOptions = {},
): { width: number; height: number } {
  const ratio = opts.ratio ?? 0.55;
  const maxHeight = opts.maxHeight ?? SCENE_HEIGHT_TALL;
  const minHeight = opts.minHeight ?? 220;
  const initialWidth = opts.initialWidth ?? SCENE_WIDTH_DEFAULT;
  const fullView = opts.fullView ?? "width";
  const view = useSceneView();
  const availableHeight = view.expanded ? view.availableHeight : null;

  const [size, setSize] = useState({
    width: initialWidth,
    height: Math.min(initialWidth * ratio, maxHeight),
  });
  // Canvas height as last rendered — lets us work out how much of the
  // container is controls/readouts rather than canvas.
  const renderedHeightRef = useRef(size.height);
  renderedHeightRef.current = size.height;

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const measure = (containerWidth: number, containerHeight: number) => {
      if (containerWidth <= 0) return;
      const chromeHeight = Math.max(0, containerHeight - renderedHeightRef.current);
      const next = computeSceneSize({
        containerWidth,
        ratio,
        maxHeight,
        minHeight,
        availableHeight,
        chromeHeight,
        fullView,
      });
      setSize((prev) =>
        Math.abs(prev.width - next.width) < 0.5 &&
        Math.abs(prev.height - next.height) < 0.5
          ? prev
          : next,
      );
    };
    const ro = new ResizeObserver((entries) => {
      for (const entry of entries) {
        // The layout height, not `getBoundingClientRect()`: that one is
        // scaled by transforms, and the full view opens with a zoom, so it
        // would read short while the animation runs and leave the figure a
        // pixel or two too tall for good.
        const box = entry.borderBoxSize?.[0];
        measure(entry.contentRect.width, box ? box.blockSize : el.offsetHeight);
      }
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, [containerRef, ratio, maxHeight, minHeight, availableHeight, fullView]);

  return size;
}

/**
 * Lightweight ref-based ticker — drives an animated scene without React
 * re-renders. Returns a ref whose `.current` is monotonically increasing
 * milliseconds since mount. Read it inside your draw loop.
 */
export function useSceneTick(active = true): RefObject<number> {
  const tick = useRef(0);
  useEffect(() => {
    if (!active) return;
    let raf = 0;
    const start = performance.now();
    const loop = (t: number) => {
      tick.current = t - start;
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [active]);
  return tick;
}

/** Convert a hex color (#rrggbb) to rgba(r, g, b, alpha).
 *  Pass-through for already-rgba/named colors (returns input unchanged). */
export function hexToRgba(hex: string, alpha: number): string {
  if (!hex || !hex.startsWith("#")) return hex;
  const h = hex.replace("#", "");
  if (h.length !== 6 && h.length !== 3) return hex;
  const expanded = h.length === 3 ? h.split("").map((c) => c + c).join("") : h;
  const r = parseInt(expanded.slice(0, 2), 16);
  const g = parseInt(expanded.slice(2, 4), 16);
  const b = parseInt(expanded.slice(4, 6), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}

/** Draw a section divider line — a thin horizontal rule at the given y. */
export function drawDivider(
  ctx: CanvasRenderingContext2D,
  x0: number,
  x1: number,
  y: number,
  color: string,
): void {
  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(x0, y);
  ctx.lineTo(x1, y);
  ctx.stroke();
  ctx.restore();
}

/** Draw an arrow from (x0, y0) to (x1, y1) with a filled triangular head. */
export function drawArrow(
  ctx: CanvasRenderingContext2D,
  x0: number,
  y0: number,
  x1: number,
  y1: number,
  color: string,
  lineWidth = 2,
  headSize = 8,
): void {
  const dx = x1 - x0;
  const dy = y1 - y0;
  const len = Math.hypot(dx, dy);
  if (len < 1e-6) return;
  const ux = dx / len;
  const uy = dy / len;
  const tipX = x1;
  const tipY = y1;
  const baseX = x1 - ux * headSize;
  const baseY = y1 - uy * headSize;
  const perpX = -uy * headSize * 0.5;
  const perpY = ux * headSize * 0.5;

  ctx.save();
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineWidth = lineWidth;
  ctx.lineCap = "round";

  ctx.beginPath();
  ctx.moveTo(x0, y0);
  ctx.lineTo(baseX, baseY);
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(tipX, tipY);
  ctx.lineTo(baseX + perpX, baseY + perpY);
  ctx.lineTo(baseX - perpX, baseY - perpY);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

/**
 * Round tick values for an axis running from `lo` to `hi`: multiples of 1, 2
 * or 5 times a power of ten, about `target` of them. Returns the ticks and
 * the step between them (use the step with `formatTick`).
 */
export function niceTicks(
  lo: number,
  hi: number,
  target = 4,
): { ticks: number[]; step: number } {
  const span = hi - lo;
  if (!(span > 0) || !Number.isFinite(span)) return { ticks: [lo], step: 1 };
  const count = Number.isFinite(target) ? Math.min(20, Math.max(1, Math.round(target))) : 4;
  const rough = span / count;
  const power = Math.pow(10, Math.floor(Math.log10(rough)));
  const lead = rough / power;
  const step = (lead < 1.5 ? 1 : lead < 3.5 ? 2 : lead < 7.5 ? 5 : 10) * power;
  const ticks: number[] = [];
  // Index-based so repeated addition cannot drift (0.1 + 0.2 + …).
  const first = Math.ceil(lo / step - 1e-9);
  const last = Math.floor(hi / step + 1e-9);
  // Ranges too extreme for doubles to count through (step underflowed to 0,
  // or the indices are beyond exact integers): one tick instead of a hang.
  if (
    !(step > 0) ||
    !Number.isFinite(step) ||
    !Number.isSafeInteger(first) ||
    !Number.isSafeInteger(last) ||
    last - first > 100
  ) {
    return { ticks: [lo], step: 1 };
  }
  for (let i = first; i <= last; i++) ticks.push(i * step === 0 ? 0 : i * step);
  return { ticks, step };
}

/** A tick value written with just enough decimals for its step ("0.5", "10"). */
export function formatTick(value: number, step: number): string {
  const decimals = Math.max(0, Math.min(6, -Math.floor(Math.log10(step) + 1e-9)));
  return value.toFixed(decimals);
}

/** Draw a labeled HUD readout: "label: value" in monospace. */
export function drawHudReadout(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  label: string,
  value: string,
  labelColor: string,
  valueColor: string,
  lineHeight = 18,
): number {
  ctx.save();
  ctx.font = FONT_HUD;
  ctx.textBaseline = "top";
  ctx.fillStyle = labelColor;
  ctx.fillText(label, x, y);
  const labelW = ctx.measureText(label).width;
  ctx.fillStyle = valueColor;
  ctx.fillText(value, x + labelW + 4, y);
  ctx.restore();
  return y + lineHeight;
}

export interface DrawLabelOptions {
  /** Canvas logical size — the label is kept fully inside it. */
  bounds: { width: number; height: number };
  color: string;
  font?: string;
  /** Which point of the text box (x, y) refers to. Default "left" / "middle". */
  align?: "left" | "center" | "right";
  baseline?: "top" | "middle" | "bottom";
  /** Fill drawn behind the text so lines passing under it stay readable. */
  plate?: string;
  /** Gap kept between the label and the canvas edge. Default 4. */
  margin?: number;
  /** Text direction. Default "ltr" (maths and symbols); pass "rtl" for RTL prose. */
  direction?: CanvasDirection;
  /** Size multiplier for the plate padding and edge margin (`tokens.scale`). Default 1. */
  scale?: number;
}

/**
 * Draw a text label that can never be clipped by the canvas edge: the text is
 * measured and its box is shifted back inside `bounds` if needed. Returns the
 * box actually used, so callers can avoid stacking labels on top of it.
 */
export function drawLabel(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  opts: DrawLabelOptions,
): { x: number; y: number; width: number; height: number } {
  const scale = opts.scale ?? 1;
  const margin = (opts.margin ?? 4) * scale;
  const padX = opts.plate ? 4 * scale : 0;
  const padY = opts.plate ? 2 * scale : 0;
  ctx.save();
  ctx.font = opts.font ?? FONT_LABEL;
  const metrics = ctx.measureText(text);
  const textW = metrics.width;
  const textH =
    (metrics.actualBoundingBoxAscent || 9) + (metrics.actualBoundingBoxDescent || 3);
  const boxW = textW + padX * 2;
  const boxH = textH + padY * 2;

  const align = opts.align ?? "left";
  const baseline = opts.baseline ?? "middle";
  let left = align === "left" ? x : align === "center" ? x - boxW / 2 : x - boxW;
  let top = baseline === "top" ? y : baseline === "middle" ? y - boxH / 2 : y - boxH;
  left = Math.min(Math.max(left, margin), Math.max(margin, opts.bounds.width - margin - boxW));
  top = Math.min(Math.max(top, margin), Math.max(margin, opts.bounds.height - margin - boxH));

  if (opts.plate) {
    ctx.fillStyle = opts.plate;
    ctx.fillRect(left, top, boxW, boxH);
  }
  ctx.fillStyle = opts.color;
  ctx.textAlign = "left";
  ctx.textBaseline = "middle";
  // Explicit direction: on RTL pages a canvas inherits `rtl`, which would
  // misplace the brackets in a label such as "x(t)".
  ctx.direction = opts.direction ?? "ltr";
  ctx.fillText(text, left + padX, top + boxH / 2);
  ctx.restore();
  return { x: left, y: top, width: boxW, height: boxH };
}

/**
 * Ring around a drawn object, to show it is the one a guide entry or readout
 * is about (see `useSceneHover`).
 */
export function drawFocusRing(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  radius: number,
  color: string,
  scale = 1,
): void {
  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = 1.5 * scale;
  ctx.setLineDash([3 * scale, 3 * scale]);
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();
}

/** Draw a section title in monospace caps. */
export function drawSectionTitle(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  title: string,
  color: string,
): void {
  ctx.save();
  ctx.font = FONT_SECTION;
  ctx.fillStyle = color;
  ctx.textBaseline = "top";
  ctx.fillText(title.toUpperCase(), x, y);
  ctx.restore();
}

/** Default scene dimensions used by most CM/EM/RT scenes. */
export const SCENE_WIDTH_DEFAULT = 720;
export const SCENE_HEIGHT_DEFAULT = 380;
export const SCENE_HEIGHT_TALL = 460;
export const SCENE_HEIGHT_SHORT = 320;

// ── Deprecated module-level constants ──────────────────────────────────
//
// These previously hardcoded dark-theme hex values and broke light mode.
// They are intentionally NOT re-exported. Use `useSceneTokens()` instead.
//
// REMOVED: BG, TEXT_BRIGHT, TEXT_DIM, TEXT_MUTE, TEXT_FAINT, GRID, GRID_HEAVY,
//          AXES, PANEL_BORDER, CYAN, MAGENTA, AMBER, GREEN, RED, BLUE,
//          PURPLE, ORANGE.
