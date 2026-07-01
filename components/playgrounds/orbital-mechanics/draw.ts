import { step, type Body } from "@/lib/physics/n-body";
import type { ThemeColors } from "@/lib/hooks/use-theme-colors";
import { worldToScreen, type Camera } from "./camera";
import { colorPalette, colorIndexForId } from "./palette";
import type { TrailBuffers } from "./trails";
import { TRAIL_MAX_AGE_S } from "./trails";
import { visibleRadiusPx } from "./hit-test";

export interface DrawContext {
  ctx: CanvasRenderingContext2D;
  width: number;
  height: number;
  cam: Camera;
  colors: ThemeColors;
  palette: string[];
  /** Per-body-id display overrides (real-life presets): label text + color. */
  bodyMeta?: Record<string, { label?: string; color?: string }>;
}

/** Preset color override → palette-by-id → theme fallback. */
function bodyColor(d: DrawContext, id: string): string {
  return (
    d.bodyMeta?.[id]?.color ??
    d.palette[colorIndexForId(id, d.palette.length)] ??
    d.colors.cyan
  );
}

export interface DragArrow {
  index: number;
  toX: number;
  toY: number;
}

export interface PlaceAim {
  downX: number;
  downY: number;
  curX: number;
  curY: number;
}

export interface HoverGhost {
  x: number;
  y: number;
}

/**
 * Resize the backing buffer to match clientWidth/Height × dpr and seed the
 * 2D transform so all drawing routines can use logical pixels. Returns the
 * 2D context, or null if the canvas is detached.
 */
export function prepareCanvas(
  cv: HTMLCanvasElement | null,
): CanvasRenderingContext2D | null {
  if (!cv) return null;
  const ctx = cv.getContext("2d");
  if (!ctx) return null;
  // Cap at 2×: above that the extra resolution is invisible for this content
  // but quadruples fill cost on exactly the fractional-scaled Windows 4K
  // machines that are already struggling.
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const w = cv.clientWidth;
  const h = cv.clientHeight;
  if (cv.width !== w * dpr || cv.height !== h * dpr) {
    cv.width = w * dpr;
    cv.height = h * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  return ctx;
}

export function drawBackground(d: DrawContext): void {
  const { ctx, width, height, colors } = d;
  ctx.fillStyle = colors.bg0 || "#1A1D24";
  ctx.fillRect(0, 0, width, height);
}

/**
 * Render trails as polylines that fade by point age. Each segment between
 * two consecutive points is drawn with `globalAlpha = 1 - midAge/maxAge`,
 * so the head of the trail (newest point) is fully opaque and the tail
 * fades to zero — much more legible than the old uniform-alpha polyline.
 */
export function drawTrails(
  d: DrawContext,
  trails: TrailBuffers,
  maxAge: number = TRAIL_MAX_AGE_S,
): void {
  const { ctx, width, height, cam } = d;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.lineWidth = 1.5;
  for (const [id, buf] of trails.entries()) {
    if (buf.length < 2) continue;
    ctx.strokeStyle = bodyColor(d, id);
    for (let i = 1; i < buf.length; i++) {
      const a = buf[i - 1]!;
      const b = buf[i]!;
      const midAge = (a.age + b.age) * 0.5;
      const alpha = Math.max(0, 1 - midAge / maxAge);
      if (alpha <= 0.02) continue;
      const pa = worldToScreen(cam, width, height, a.x, a.y);
      const pb = worldToScreen(cam, width, height, b.x, b.y);
      ctx.globalAlpha = alpha * 0.85;
      ctx.beginPath();
      ctx.moveTo(pa.x, pa.y);
      ctx.lineTo(pb.x, pb.y);
      ctx.stroke();
    }
  }
  ctx.globalAlpha = 1;
}

export function drawBodies(d: DrawContext, bodies: Body[]): void {
  const { ctx, width, height, cam } = d;
  for (const b of bodies) {
    const p = worldToScreen(cam, width, height, b.x, b.y);
    const r = visibleRadiusPx(b.mass, cam.scale);
    const color = bodyColor(d, b.id);
    // shadowBlur is the most expensive op on this canvas; skip it for tiny
    // bodies (deep zoom-out) where the glow is invisible anyway.
    if (r >= 6) {
      ctx.shadowColor = color;
      ctx.shadowBlur = 12;
    }
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(p.x, p.y, r, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;
  }
}

/** Small name tags next to bodies that carry preset metadata (sun, earth…). */
export function drawLabels(d: DrawContext, bodies: Body[]): void {
  const meta = d.bodyMeta;
  if (!meta) return;
  const { ctx, width, height, cam } = d;
  ctx.save();
  ctx.font = "10px ui-monospace, SFMono-Regular, monospace";
  ctx.textBaseline = "bottom";
  ctx.fillStyle = d.colors.fg2 || "#7D8DA6";
  ctx.globalAlpha = 0.85;
  for (const b of bodies) {
    const label = meta[b.id]?.label;
    if (!label) continue;
    const p = worldToScreen(cam, width, height, b.x, b.y);
    const r = visibleRadiusPx(b.mass, cam.scale);
    ctx.fillText(label, p.x + r + 4, p.y - r - 2);
  }
  ctx.restore();
}

/**
 * Forward-integrated trajectory preview, drawn faintly over each body for
 * `seconds` of future sim time. Only worth running when the simulation is
 * paused — otherwise the live trail shows the same information in real time.
 *
 * Skips the slow elastic-bounce/absorb pass: collisions during the predicted
 * window would invalidate the rest of the trace anyway, and pure
 * Velocity-Verlet is plenty for "what does this orbit look like?".
 */
export function drawPredictiveTraces(
  d: DrawContext,
  bodies: Body[],
  seconds: number,
  subDt = 0.01,
): void {
  if (bodies.length === 0 || seconds <= 0) return;
  const { ctx, width, height, cam } = d;
  const steps = Math.ceil(seconds / subDt);
  const samples: Array<Array<{ x: number; y: number }>> = bodies.map((b) => [
    { x: b.x, y: b.y },
  ]);

  let bs = bodies;
  // Sample roughly every 6 sub-steps (~60 fps frames) to keep the polyline
  // light without losing curvature.
  const sampleEvery = 6;
  for (let s = 1; s <= steps; s++) {
    bs = step(bs, subDt);
    if (s % sampleEvery === 0) {
      for (let i = 0; i < bs.length && i < samples.length; i++) {
        const b = bs[i]!;
        samples[i]!.push({ x: b.x, y: b.y });
      }
    }
  }

  ctx.save();
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.lineWidth = 1;
  ctx.setLineDash([2, 4]);
  for (let i = 0; i < samples.length; i++) {
    const series = samples[i]!;
    if (series.length < 2) continue;
    ctx.strokeStyle = bodyColor(d, bodies[i]!.id);
    ctx.globalAlpha = 0.4;
    ctx.beginPath();
    for (let k = 0; k < series.length; k++) {
      const p = worldToScreen(cam, width, height, series[k]!.x, series[k]!.y);
      if (k === 0) ctx.moveTo(p.x, p.y);
      else ctx.lineTo(p.x, p.y);
    }
    ctx.stroke();
  }
  ctx.restore();
}

export function drawDragArrow(
  d: DrawContext,
  bodies: Body[],
  drag: DragArrow,
): void {
  const { ctx, width, height, cam } = d;
  const b = bodies[drag.index];
  if (!b) return;
  const p = worldToScreen(cam, width, height, b.x, b.y);
  ctx.strokeStyle = bodyColor(d, b.id);
  ctx.globalAlpha = 0.9;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(p.x, p.y);
  ctx.lineTo(drag.toX, drag.toY);
  ctx.stroke();
  ctx.globalAlpha = 1;
}

/**
 * Angry-Birds slingshot aim preview: ghost body at the anchor, dashed line
 * to the cursor (the rubber-band you're pulling on), solid arrow toward
 * the launch direction with an arrowhead.
 */
export function drawSlingshot(
  d: DrawContext,
  aim: PlaceAim,
  placeMass: number,
): void {
  const { ctx, cam, colors } = d;
  const r = visibleRadiusPx(placeMass, cam.scale);
  const aimColor = colors.cyan || "#6FB8C6";

  ctx.fillStyle = aimColor;
  ctx.shadowColor = aimColor;
  ctx.shadowBlur = 12;
  ctx.globalAlpha = 0.45;
  ctx.beginPath();
  ctx.arc(aim.downX, aim.downY, r, 0, Math.PI * 2);
  ctx.fill();
  ctx.shadowBlur = 0;

  const dx = aim.curX - aim.downX;
  const dy = aim.curY - aim.downY;
  // 1.6× pull length keeps the arrow on-screen at moderate drags while still
  // reading as "more powerful than the pull". The actual physics multiplier
  // is much larger (LAUNCH_BOOST in n-body-canvas).
  const VIZ_LAUNCH_VISUAL_SCALE = 1.6;
  const launchX = aim.downX - dx * VIZ_LAUNCH_VISUAL_SCALE;
  const launchY = aim.downY - dy * VIZ_LAUNCH_VISUAL_SCALE;

  ctx.strokeStyle = aimColor;
  ctx.globalAlpha = 0.95;
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.moveTo(aim.downX, aim.downY);
  ctx.lineTo(launchX, launchY);
  ctx.stroke();

  const ang = Math.atan2(launchY - aim.downY, launchX - aim.downX);
  const head = 10;
  ctx.beginPath();
  ctx.moveTo(launchX, launchY);
  ctx.lineTo(
    launchX - head * Math.cos(ang - Math.PI / 6),
    launchY - head * Math.sin(ang - Math.PI / 6),
  );
  ctx.moveTo(launchX, launchY);
  ctx.lineTo(
    launchX - head * Math.cos(ang + Math.PI / 6),
    launchY - head * Math.sin(ang + Math.PI / 6),
  );
  ctx.stroke();

  ctx.globalAlpha = 0.35;
  ctx.lineWidth = 1;
  ctx.setLineDash([3, 4]);
  ctx.beginPath();
  ctx.moveTo(aim.downX, aim.downY);
  ctx.lineTo(aim.curX, aim.curY);
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.globalAlpha = 1;
}

export function drawHoverGhost(
  d: DrawContext,
  hover: HoverGhost,
  placeMass: number,
): void {
  const { ctx, cam, colors } = d;
  const r = visibleRadiusPx(placeMass, cam.scale);
  ctx.strokeStyle = colors.fg2 || "#7D8DA6";
  ctx.globalAlpha = 0.4;
  ctx.lineWidth = 1;
  ctx.setLineDash([3, 4]);
  ctx.beginPath();
  ctx.arc(hover.x, hover.y, r, 0, Math.PI * 2);
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.globalAlpha = 1;
}

export interface DebugStats {
  fps: number;
  dtMs: number;
  dpr: number;
  /** Sim-seconds advanced per wall-second — should equal `speed` exactly. */
  simRate: number;
  bodyCount: number;
  accumulator: number;
}

/** Tiny corner overlay rendered only when the URL carries ?debug=1. */
export function drawDebugHud(d: DrawContext, s: DebugStats): void {
  const { ctx, colors } = d;
  const lines = [
    `fps ${s.fps.toFixed(0)}`,
    `dt ${s.dtMs.toFixed(1)}ms`,
    `dpr ${s.dpr.toFixed(2)}`,
    `sim ${s.simRate.toFixed(2)}x`,
    `bodies ${s.bodyCount}`,
    `acc ${(s.accumulator * 1000).toFixed(2)}ms`,
  ];
  ctx.save();
  ctx.font = "10px ui-monospace, SFMono-Regular, monospace";
  ctx.textBaseline = "top";
  ctx.fillStyle = colors.bg0 || "#1A1D24";
  ctx.globalAlpha = 0.7;
  ctx.fillRect(4, 4, 88, lines.length * 12 + 8);
  ctx.globalAlpha = 1;
  ctx.fillStyle = colors.fg2 || "#7D8DA6";
  lines.forEach((l, i) => ctx.fillText(l, 8, 8 + i * 12));
  ctx.restore();
}
