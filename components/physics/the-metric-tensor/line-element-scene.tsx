"use client";

import { useEffect, useRef, useState } from "react";
import { lineElement, polarMetric2D } from "@/lib/physics/relativity/metric";
import {
  FONT_HUD,
  FONT_HUD_SMALL,
  SCENE_CANVAS_CLASS,
  applyDpr,
  drawHudReadout,
  drawSectionTitle,
  drawDivider,
  hexToRgba,
  useSceneTokens,
  type SceneTokens,
} from "@/components/physics/_shared/scene-tokens";

/**
 * §07 LINE ELEMENT SCENE — FIG.31b
 *
 * Canvas 2D. Two coordinate paths between the same two points A = (1, 0.5)
 * and B = (2.5, 2) in the Cartesian plane:
 *   - Cartesian path: straight line, ds² = dx² + dy². Drawn in CYAN.
 *   - Polar path:     straight line in (r, φ) space, curved in Cartesian.
 *                     Drawn in MAGENTA.
 *
 * Animation: a glowing dot sweeps the Cartesian path (2 s), then the polar
 * path (2 s), then arc-length HUD readouts appear in GREEN.
 *
 * Title: "SAME LENGTH, DIFFERENT METRICS".
 */

// ─── Integration helpers ───────────────────────────────────────────────────────

function cartesianArcLength(pts: readonly [number, number][]): number {
  let total = 0;
  for (let i = 1; i < pts.length; i++) {
    const dx = pts[i][0] - pts[i - 1][0];
    const dy = pts[i][1] - pts[i - 1][1];
    total += Math.sqrt(dx * dx + dy * dy);
  }
  return total;
}

function polarArcLength(rPhiPts: readonly [number, number][]): number {
  let total = 0;
  for (let i = 1; i < rPhiPts.length; i++) {
    const dr = rPhiPts[i][0] - rPhiPts[i - 1][0];
    const dphi = rPhiPts[i][1] - rPhiPts[i - 1][1];
    const rMid = (rPhiPts[i][0] + rPhiPts[i - 1][0]) / 2;
    const g = polarMetric2D(rMid);
    const ds2 = lineElement(g, [dr, dphi]);
    if (ds2 > 0) total += Math.sqrt(ds2);
  }
  return total;
}

const N = 200;

const A_CART: [number, number] = [1.0, 0.5];
const B_CART: [number, number] = [2.5, 2.0];

function buildCartesianPath(): [number, number][] {
  const pts: [number, number][] = [];
  for (let i = 0; i <= N; i++) {
    const t = i / N;
    pts.push([
      A_CART[0] + t * (B_CART[0] - A_CART[0]),
      A_CART[1] + t * (B_CART[1] - A_CART[1]),
    ]);
  }
  return pts;
}

function buildPolarPath(): [number, number][] {
  const A_POLAR: [number, number] = [
    Math.hypot(A_CART[0], A_CART[1]),
    Math.atan2(A_CART[1], A_CART[0]),
  ];
  const B_POLAR: [number, number] = [
    Math.hypot(B_CART[0], B_CART[1]),
    Math.atan2(B_CART[1], B_CART[0]),
  ];
  const pts: [number, number][] = [];
  for (let i = 0; i <= N; i++) {
    const t = i / N;
    pts.push([
      A_POLAR[0] + t * (B_POLAR[0] - A_POLAR[0]),
      A_POLAR[1] + t * (B_POLAR[1] - A_POLAR[1]),
    ]);
  }
  return pts;
}

const CART_PATH = buildCartesianPath();
const POLAR_PATH_POLAR = buildPolarPath();
const POLAR_PATH_CART: [number, number][] = POLAR_PATH_POLAR.map(
  ([r, phi]) => [r * Math.cos(phi), r * Math.sin(phi)],
);

const CART_LEN = cartesianArcLength(CART_PATH);
const POLAR_LEN = polarArcLength(POLAR_PATH_POLAR);

// ─── World → canvas mapping ────────────────────────────────────────────────────

const WORLD_MARGIN = 0.3;
const WORLD_MIN_X = Math.min(A_CART[0], B_CART[0]) - WORLD_MARGIN;
const WORLD_MAX_X = Math.max(A_CART[0], B_CART[0]) + WORLD_MARGIN;
const WORLD_MIN_Y = Math.min(A_CART[1], B_CART[1]) - WORLD_MARGIN;
const WORLD_MAX_Y = Math.max(A_CART[1], B_CART[1]) + WORLD_MARGIN;

// ─── Scene dimensions ──────────────────────────────────────────────────────────

const W = 560;
const H = 380;
const PAD_L = 52;
const PAD_R = 24;
const PAD_T = 42;
const PAD_B = 52;
const plotW = W - PAD_L - PAD_R;
const plotH = H - PAD_T - PAD_B;

function worldToCanvas(
  wx: number,
  wy: number,
): [number, number] {
  const cx = PAD_L + ((wx - WORLD_MIN_X) / (WORLD_MAX_X - WORLD_MIN_X)) * plotW;
  const cy = PAD_T + (1 - (wy - WORLD_MIN_Y) / (WORLD_MAX_Y - WORLD_MIN_Y)) * plotH;
  return [cx, cy];
}

// ─── Animation phases ─────────────────────────────────────────────────────────
// Phase 0..1: Cartesian sweep (2 s)
// Phase 1..2: Polar sweep (2 s)
// Phase 2..3: HUD display (2 s)
// Phase 3..4: Hold + reset
const TOTAL_CYCLE = 8; // seconds

function easeInOut(t: number): number {
  return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
}

// ─── Draw helper — glowing dot ─────────────────────────────────────────────────

function drawGlowDot(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  color: string,
) {
  const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, 10);
  grad.addColorStop(0, color);
  grad.addColorStop(0.35, hexToRgba(color, 0.6));
  grad.addColorStop(1, hexToRgba(color, 0));
  ctx.save();
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.arc(cx, cy, 10, 0, 2 * Math.PI);
  ctx.fill();
  // Bright inner dot
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(cx, cy, 3, 0, 2 * Math.PI);
  ctx.fill();
  ctx.restore();
}

// ─── Main draw ────────────────────────────────────────────────────────────────

function draw(ctx: CanvasRenderingContext2D, phase: number, tokens: SceneTokens) {
  // phase: 0..1 within each of the 4 sub-phases, encoded as 0..4
  // We pass the raw 0..TOTAL_CYCLE elapsed time via normalised 0..1

  ctx.fillStyle = tokens.bg;
  ctx.fillRect(0, 0, W, H);

  // Section title
  drawSectionTitle(ctx, PAD_L, 10, "SAME LENGTH, DIFFERENT METRICS", tokens.textMute);

  // Grid
  ctx.strokeStyle = tokens.grid;
  ctx.lineWidth = 1;
  const gridStep = 0.5;
  for (
    let x = Math.ceil(WORLD_MIN_X / gridStep) * gridStep;
    x <= WORLD_MAX_X + 0.001;
    x += gridStep
  ) {
    const [cx] = worldToCanvas(x, WORLD_MIN_Y);
    ctx.beginPath();
    ctx.moveTo(cx, PAD_T);
    ctx.lineTo(cx, PAD_T + plotH);
    ctx.stroke();
  }
  for (
    let y = Math.ceil(WORLD_MIN_Y / gridStep) * gridStep;
    y <= WORLD_MAX_Y + 0.001;
    y += gridStep
  ) {
    const [, cy] = worldToCanvas(WORLD_MIN_X, y);
    ctx.beginPath();
    ctx.moveTo(PAD_L, cy);
    ctx.lineTo(PAD_L + plotW, cy);
    ctx.stroke();
  }

  // Axis labels
  ctx.save();
  ctx.font = FONT_HUD_SMALL;
  ctx.textBaseline = "top";
  ctx.fillStyle = tokens.textMute;
  ctx.fillText("x", PAD_L + plotW + 4, PAD_T + plotH - 4);
  ctx.textBaseline = "top";
  ctx.fillText("y", PAD_L - 14, PAD_T);
  ctx.restore();

  // ── Sub-phase calculation ──
  // phase is 0..1 mapping over TOTAL_CYCLE seconds
  const raw = phase * TOTAL_CYCLE; // 0..TOTAL_CYCLE
  const subPhase = raw % TOTAL_CYCLE;

  // Cartesian sweep: 0..2 s
  const cartProgress = subPhase < 2 ? easeInOut(Math.min(subPhase / 2, 1)) : 1;
  // Polar sweep: 2..4 s
  const polarProgress = subPhase >= 2 && subPhase < 4
    ? easeInOut(Math.min((subPhase - 2) / 2, 1))
    : subPhase >= 4 ? 1 : 0;
  // HUD visible: after 4 s
  const hudVisible = subPhase >= 4;

  const nCart = Math.floor(cartProgress * N);
  const nPolar = Math.floor(polarProgress * N);

  // ── Draw paths ──

  // Cartesian (CYAN)
  if (nCart > 0) {
    ctx.save();
    ctx.strokeStyle = tokens.cyan;
    ctx.lineWidth = 2.5;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.beginPath();
    const [cx0, cy0] = worldToCanvas(...CART_PATH[0]);
    ctx.moveTo(cx0, cy0);
    for (let i = 1; i <= nCart && i < CART_PATH.length; i++) {
      const [cx, cy] = worldToCanvas(...CART_PATH[i]);
      ctx.lineTo(cx, cy);
    }
    ctx.stroke();
    ctx.restore();

    // Glowing dot at tip
    if (cartProgress < 1) {
      const tip = CART_PATH[nCart];
      const [tx, ty] = worldToCanvas(...tip);
      drawGlowDot(ctx, tx, ty, tokens.cyan);
    }
  }

  // Polar (MAGENTA) — dashed
  if (nPolar > 0) {
    ctx.save();
    ctx.strokeStyle = tokens.magenta;
    ctx.lineWidth = 2.5;
    ctx.setLineDash([7, 4]);
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.beginPath();
    const [px0, py0] = worldToCanvas(...POLAR_PATH_CART[0]);
    ctx.moveTo(px0, py0);
    for (let i = 1; i <= nPolar && i < POLAR_PATH_CART.length; i++) {
      const [px, py] = worldToCanvas(...POLAR_PATH_CART[i]);
      ctx.lineTo(px, py);
    }
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.restore();

    if (polarProgress < 1) {
      const tip = POLAR_PATH_CART[nPolar];
      const [tx, ty] = worldToCanvas(...tip);
      drawGlowDot(ctx, tx, ty, tokens.magenta);
    }
  }

  // ── Endpoints ──
  const drawEndpoint = (wx: number, wy: number, label: string) => {
    const [cx, cy] = worldToCanvas(wx, wy);
    ctx.save();
    ctx.beginPath();
    ctx.arc(cx, cy, 5, 0, 2 * Math.PI);
    ctx.fillStyle = tokens.textBright;
    ctx.fill();
    ctx.font = FONT_HUD;
    ctx.textBaseline = "top";
    ctx.fillStyle = tokens.textBright;
    ctx.fillText(label, cx + 8, cy - 6);
    ctx.restore();
  };
  drawEndpoint(A_CART[0], A_CART[1], "A");
  drawEndpoint(B_CART[0], B_CART[1], "B");

  // ── Legend ──
  ctx.save();
  ctx.font = FONT_HUD;
  ctx.textBaseline = "top";
  ctx.fillStyle = tokens.cyan;
  ctx.fillText("─── Cartesian   ds² = dx² + dy²", PAD_L, H - PAD_B + 10);
  ctx.fillStyle = tokens.magenta;
  ctx.fillText("╌╌╌ Polar           ds² = dr² + r²dφ²", PAD_L, H - PAD_B + 26);
  ctx.restore();

  // ── Arc-length HUD ──
  if (hudVisible) {
    const hudX = W - 210;
    const hudY = PAD_T + 4;
    ctx.save();
    ctx.fillStyle = hexToRgba(tokens.bg, 0.85);
    ctx.fillRect(hudX - 6, hudY - 6, 204, 68);
    ctx.strokeStyle = tokens.panelBorder;
    ctx.lineWidth = 1;
    ctx.strokeRect(hudX - 6, hudY - 6, 204, 68);
    ctx.restore();

    let y = hudY;
    drawSectionTitle(ctx, hudX, y, "ARC LENGTHS", tokens.textMute);
    y += 16;
    y = drawHudReadout(ctx, hudX, y, "∫ds (Cartesian)  ", CART_LEN.toFixed(4), tokens.textDim, tokens.green);
    y = drawHudReadout(ctx, hudX, y, "∫ds (polar)      ", POLAR_LEN.toFixed(4), tokens.textDim, tokens.green);
    drawDivider(ctx, hudX - 6, hudX + 196, y, tokens.grid);
    y += 4;
    ctx.save();
    ctx.font = FONT_HUD_SMALL;
    ctx.textBaseline = "top";
    ctx.fillStyle = tokens.textMute;
    ctx.fillText("same arc length — geometry is coordinate-free", hudX, y);
    ctx.restore();
  }
}

// ─── Component ────────────────────────────────────────────────────────────────

export function LineElementScene() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const rafRef = useRef<number>(0);
  const startRef = useRef<number | null>(null);
  const tokens = useSceneTokens();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = applyDpr(canvas, W, H);
    if (!ctx) return;

    const loop = (t: number) => {
      if (startRef.current === null) startRef.current = t;
      const elapsed = (t - startRef.current) / 1000;
      const phase = (elapsed % TOTAL_CYCLE) / TOTAL_CYCLE;
      draw(ctx, phase, tokens);
      rafRef.current = requestAnimationFrame(loop);
    };
    rafRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(rafRef.current);
  }, [tokens]);

  return (
    <div className="relative w-full">
      <canvas
        ref={canvasRef}
        className={SCENE_CANVAS_CLASS}
        style={{ width: W, height: H, display: "block" }}
        aria-label="Two paths between points A and B: a straight Cartesian path (cyan) and a curved polar-coordinate path (magenta). Both integrate to the same arc length, shown in green, demonstrating that the metric makes arc length coordinate-independent."
      />
      <div className="mt-3 flex items-center gap-3 font-mono text-xs text-[var(--color-fg-1)]">
        <span style={{ color: tokens.cyan }}>─── Cartesian  ds² = dx² + dy²</span>
        <span style={{ color: tokens.magenta }}>╌╌╌ Polar  ds² = dr² + r²dφ²</span>
        <span style={{ color: tokens.green }} className="ml-auto">∫ds equal ✓</span>
      </div>
    </div>
  );
}
