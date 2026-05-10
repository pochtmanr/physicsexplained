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

import { useEffect, useMemo, useRef, useState, type RefObject } from "react";
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

  return useMemo<SceneTokens>(
    () => ({
      bg: colors.bg0,
      bg1: colors.bg1,

      textBright: colors.fg0,
      textDim: colors.fg1,
      textMute: colors.fg2,
      textFaint: colors.fg3,

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

      fontHud: FONT_HUD,
      fontHudSmall: FONT_HUD_SMALL,
      fontHudLarge: FONT_HUD_LARGE,
      fontSection: FONT_SECTION,
      fontLabel: FONT_LABEL,

      colors,
    }),
    [colors],
  );
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
export interface UseSceneSizeOptions {
  /** height = width × ratio, capped at maxHeight. Default 0.55. */
  ratio?: number;
  /** Hard ceiling on rendered height (px). Default 460. */
  maxHeight?: number;
  /** Hard floor on rendered height (px). Default 220. */
  minHeight?: number;
  /** Initial width before ResizeObserver fires. Default 720. */
  initialWidth?: number;
}

export function useSceneSize<T extends HTMLElement>(
  containerRef: RefObject<T | null>,
  opts: UseSceneSizeOptions = {},
): { width: number; height: number } {
  const ratio = opts.ratio ?? 0.55;
  const maxHeight = opts.maxHeight ?? SCENE_HEIGHT_TALL;
  const minHeight = opts.minHeight ?? 220;
  const initialWidth = opts.initialWidth ?? SCENE_WIDTH_DEFAULT;

  const [size, setSize] = useState({
    width: initialWidth,
    height: Math.min(initialWidth * ratio, maxHeight),
  });

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const w = entry.contentRect.width;
        if (w > 0) {
          const h = Math.max(minHeight, Math.min(w * ratio, maxHeight));
          setSize({ width: w, height: h });
        }
      }
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, [containerRef, ratio, maxHeight, minHeight]);

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
