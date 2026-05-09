/**
 * Shared design tokens for `physics.explained` Canvas 2D scenes.
 *
 * Codifies the palette, typography, and canvas conventions established by
 * the CM and Electromagnetism branches. Every relativity scene that ships
 * after RT Session 4 should import these tokens to keep the visual feel
 * consistent across the site.
 *
 * Reference scenes (canonical examples to mirror):
 *   - components/physics/gravitational-redshift/pound-rebka-tower-scene.tsx
 *   - components/physics/four-momentum/four-momentum-boost-scene.tsx
 *   - components/physics/the-twin-paradox/who-aged-less-scene.tsx
 */

// ── Background + neutrals ──────────────────────────────────────────────
export const BG = "#0A0C12";
export const TEXT_BRIGHT = "rgba(255,255,255,0.92)";
export const TEXT_DIM = "rgba(255,255,255,0.65)";
export const TEXT_MUTE = "rgba(255,255,255,0.45)";
export const TEXT_FAINT = "rgba(255,255,255,0.28)";
export const GRID = "rgba(255,255,255,0.08)";
export const GRID_HEAVY = "rgba(255,255,255,0.18)";
export const AXES = "rgba(255,255,255,0.6)";
export const PANEL_BORDER = "rgba(255,255,255,0.10)";

// ── Semantic accent colors ─────────────────────────────────────────────
/** Lab / stationary / primary-positive. */
export const CYAN = "#67E8F9";
/** Boosted / dynamic / contrast. */
export const MAGENTA = "#FF6ADE";
/** Light / photon / amber accent / highlight. */
export const AMBER = "#FFB36B";
/** Conserved / correct / equilibrium. */
export const GREEN = "#86EFAC";
/** Forbidden / redshift / warning. */
export const RED = "#F87171";
/** Blueshift / cool / secondary. */
export const BLUE = "#7DD3FC";
/** Tertiary accent (sparingly). */
export const PURPLE = "#A78BFA";
/** Accelerated / non-inertial. */
export const ORANGE = "#FB923C";

// ── Typography ─────────────────────────────────────────────────────────
export const FONT_HUD = "12px ui-monospace, monospace";
export const FONT_HUD_SMALL = "11px ui-monospace, monospace";
export const FONT_HUD_LARGE = "13px ui-monospace, monospace";
export const FONT_SECTION = "11px ui-monospace, monospace";
export const FONT_LABEL = "12px ui-monospace, monospace";

// ── Canvas styling helpers ─────────────────────────────────────────────

/** Apply DPR scaling. Call once per useEffect with logical W/H in px. */
export function applyDpr(canvas: HTMLCanvasElement, W: number, H: number): CanvasRenderingContext2D | null {
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

/** Standard scene container className for a <canvas> element.
 *  Use as: <canvas className={SCENE_CANVAS_CLASS} aria-label="..." /> */
export const SCENE_CANVAS_CLASS = "rounded-md border border-white/10 bg-[#0A0C12]";

/** Convert a hex color (#rrggbb) to rgba(r, g, b, alpha). */
export function hexToRgba(hex: string, alpha: number): string {
  const h = hex.replace("#", "");
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}

/** Draw a section divider line — a thin horizontal rule at the given y. */
export function drawDivider(ctx: CanvasRenderingContext2D, x0: number, x1: number, y: number, color = GRID): void {
  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(x0, y);
  ctx.lineTo(x1, y);
  ctx.stroke();
  ctx.restore();
}

/** Draw an arrow from (x0, y0) to (x1, y1) with a filled triangular head.
 *  headSize is the arrowhead length in px (default 8). */
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

  // shaft (stop short of the tip so head fills the end cleanly)
  ctx.beginPath();
  ctx.moveTo(x0, y0);
  ctx.lineTo(baseX, baseY);
  ctx.stroke();

  // arrowhead
  ctx.beginPath();
  ctx.moveTo(tipX, tipY);
  ctx.lineTo(baseX + perpX, baseY + perpY);
  ctx.lineTo(baseX - perpX, baseY - perpY);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

/** Draw a labeled HUD readout: "label: value" in monospace, value optionally
 *  in an accent color. Returns the y-coordinate of the next line. */
export function drawHudReadout(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  label: string,
  value: string,
  valueColor: string = AMBER,
  lineHeight = 18,
): number {
  ctx.save();
  ctx.font = FONT_HUD;
  ctx.textBaseline = "top";
  ctx.fillStyle = TEXT_DIM;
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
): void {
  ctx.save();
  ctx.font = FONT_SECTION;
  ctx.fillStyle = TEXT_MUTE;
  ctx.textBaseline = "top";
  ctx.fillText(title.toUpperCase(), x, y);
  ctx.restore();
}

/** Default scene dimensions used by most CM/EM/RT scenes. */
export const SCENE_WIDTH_DEFAULT = 720;
export const SCENE_HEIGHT_DEFAULT = 380;
export const SCENE_HEIGHT_TALL = 460;
export const SCENE_HEIGHT_SHORT = 320;
