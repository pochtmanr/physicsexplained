"use client";

import { useEffect, useRef } from "react";
import {
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
 * §07 METRIC COMPARISON SCENE — FIG.31c
 *
 * Three side-by-side Canvas 2D panels:
 *   Left   — Euclidean / flat:            triangle, angle sum = π.
 *   Centre — Spherical / positive curve:  triangle, angle sum > π.  (CYAN)
 *   Right  — Hyperbolic / negative curve: triangle, angle sum < π.  (MAGENTA)
 *
 * Each panel:
 *  - drawSectionTitle for panel name
 *  - drawHudReadout for angle sum in AMBER
 *  - Subtle pulse highlight on the "active" panel (cycles every 6 s)
 *
 * Title: "CURVATURE ENCODED IN THE METRIC".
 */

const W = 660;
const H = 320;
const PW = Math.floor(W / 3);
const PH = H;

// ─── Colours by role ──────────────────────────────────────────────────────────
// Flat: neutral (textDim) — no strong accent
// Sphere: cyan
// Hyperbolic: magenta
// (Resolved per-frame from `tokens` so they flip with theme.)

// Cycle duration: 6 s per panel × 3 panels = 18 s
const PANEL_CYCLE = 6; // seconds per panel

// ─── Flat panel ───────────────────────────────────────────────────────────────

function drawFlat(
  ctx: CanvasRenderingContext2D,
  ox: number,
  pulseFraction: number, // 0 = not active, >0 = pulse strength
  tokens: SceneTokens,
) {
  ctx.save();
  ctx.translate(ox, 0);

  // Background with optional pulse glow
  ctx.fillStyle = tokens.bg;
  ctx.fillRect(0, 0, PW, PH);
  if (pulseFraction > 0) {
    const alpha = 0.06 * pulseFraction;
    ctx.fillStyle = hexToRgba(tokens.textBright, alpha);
    ctx.fillRect(0, 0, PW, PH);
  }

  // Grid — regular Cartesian
  const step = 28;
  ctx.strokeStyle = tokens.grid;
  ctx.lineWidth = 1;
  for (let x = step; x < PW; x += step) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, PH);
    ctx.stroke();
  }
  for (let y = step; y < PH; y += step) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(PW, y);
    ctx.stroke();
  }
  // Mid-axes
  ctx.strokeStyle = tokens.gridHeavy;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(Math.round(PW / 2), 0);
  ctx.lineTo(Math.round(PW / 2), PH);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(0, Math.round(PH / 2));
  ctx.lineTo(PW, Math.round(PH / 2));
  ctx.stroke();

  // Right-angle triangle
  const cx = PW / 2;
  const cy = PH / 2 + 10;
  const A: [number, number] = [cx - 42, cy + 44];
  const B: [number, number] = [cx + 52, cy + 44];
  const C: [number, number] = [cx - 42, cy - 36];

  ctx.strokeStyle = tokens.textDim;
  ctx.lineWidth = 2;
  ctx.lineJoin = "round";
  ctx.beginPath();
  ctx.moveTo(A[0], A[1]);
  ctx.lineTo(B[0], B[1]);
  ctx.lineTo(C[0], C[1]);
  ctx.closePath();
  ctx.stroke();

  // Panel header
  ctx.textBaseline = "top";
  drawSectionTitle(ctx, 10, 10, "FLAT", tokens.textMute);

  // Metric readout
  ctx.font = FONT_HUD_SMALL;
  ctx.textBaseline = "top";
  ctx.fillStyle = tokens.textMute;
  ctx.fillText("g = diag(1,1)", 10, 26);
  ctx.fillText("ds² = dx² + dy²", 10, 40);

  // Angle sum HUD
  drawDivider(ctx, 8, PW - 8, PH - 46, tokens.grid);
  drawHudReadout(ctx, 10, PH - 36, "α+β+γ = ", "π", tokens.textDim, tokens.amber);

  ctx.restore();
}

// ─── Spherical panel ──────────────────────────────────────────────────────────

function drawSpherical(
  ctx: CanvasRenderingContext2D,
  ox: number,
  pulseFraction: number,
  tokens: SceneTokens,
) {
  ctx.save();
  ctx.translate(ox, 0);

  ctx.fillStyle = tokens.bg;
  ctx.fillRect(0, 0, PW, PH);
  if (pulseFraction > 0) {
    const alpha = 0.07 * pulseFraction;
    ctx.fillStyle = hexToRgba(tokens.cyan, alpha);
    ctx.fillRect(0, 0, PW, PH);
  }

  // Vertical meridians
  const nMerid = 7;
  ctx.strokeStyle = tokens.grid;
  ctx.lineWidth = 1;
  for (let i = 0; i <= nMerid; i++) {
    const x = (i / nMerid) * PW;
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, PH);
    ctx.stroke();
  }

  // Latitude lines — sin-projection spacing
  const nLat = 8;
  for (let j = 0; j <= nLat; j++) {
    const theta = (j / nLat) * Math.PI;
    const y = (PH / 2) * (1 - Math.cos(theta));
    const isHL = j === 0 || j === nLat / 2 || j === nLat;
    ctx.strokeStyle = isHL ? tokens.gridHeavy : tokens.grid;
    ctx.lineWidth = isHL ? 1.2 : 1;
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(PW, y);
    ctx.stroke();
  }

  // Spherical triangle
  const mapToCanvas = (theta: number, phi: number): [number, number] => [
    (phi / (2 * Math.PI)) * PW,
    (PH / 2) * (1 - Math.cos(theta)),
  ];

  const A = mapToCanvas(0.4, Math.PI * 0.45);
  const B = mapToCanvas(Math.PI / 2, Math.PI * 0.2);
  const C = mapToCanvas(Math.PI / 2, Math.PI * 0.7);

  ctx.strokeStyle = tokens.cyan;
  ctx.lineWidth = 2.5;
  ctx.lineJoin = "round";
  ctx.beginPath();
  ctx.moveTo(A[0], A[1]);
  ctx.lineTo(B[0], B[1]);
  ctx.lineTo(C[0], C[1]);
  ctx.closePath();
  ctx.stroke();

  // Panel header
  ctx.textBaseline = "top";
  drawSectionTitle(ctx, 10, 10, "POSITIVE CURVATURE", tokens.textMute);

  ctx.font = FONT_HUD_SMALL;
  ctx.textBaseline = "top";
  ctx.fillStyle = tokens.textMute;
  ctx.fillText("g = diag(R², R²sin²θ)", 10, 26);
  ctx.fillText("K > 0 (sphere)", 10, 40);

  // Angle sum HUD
  drawDivider(ctx, 8, PW - 8, PH - 46, tokens.grid);
  drawHudReadout(ctx, 10, PH - 36, "α+β+γ = ", "> π", tokens.textDim, tokens.amber);

  ctx.restore();
}

// ─── Hyperbolic panel ─────────────────────────────────────────────────────────

function drawHyperbolic(
  ctx: CanvasRenderingContext2D,
  ox: number,
  pulseFraction: number,
  tokens: SceneTokens,
) {
  ctx.save();
  ctx.translate(ox, 0);

  ctx.fillStyle = tokens.bg;
  ctx.fillRect(0, 0, PW, PH);
  if (pulseFraction > 0) {
    const alpha = 0.07 * pulseFraction;
    ctx.fillStyle = hexToRgba(tokens.magenta, alpha);
    ctx.fillRect(0, 0, PW, PH);
  }

  const diskCx = PW / 2;
  const diskCy = PH / 2 + 4;
  const diskR = Math.min(PW, PH) / 2 - 16;

  // Disk boundary
  ctx.strokeStyle = tokens.gridHeavy;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.arc(diskCx, diskCy, diskR, 0, 2 * Math.PI);
  ctx.stroke();

  // Poincaré grid — diameter geodesics
  ctx.strokeStyle = tokens.grid;
  ctx.lineWidth = 1;
  for (let a = 0; a < Math.PI; a += Math.PI / 4) {
    ctx.beginPath();
    ctx.moveTo(diskCx + diskR * Math.cos(a), diskCy + diskR * Math.sin(a));
    ctx.lineTo(diskCx - diskR * Math.cos(a), diskCy - diskR * Math.sin(a));
    ctx.stroke();
  }
  // Concentric metric circles
  for (const fr of [0.35, 0.60, 0.80]) {
    ctx.beginPath();
    ctx.arc(diskCx, diskCy, fr * diskR, 0, 2 * Math.PI);
    ctx.stroke();
  }

  // Hyperbolic triangle — circular-arc sides orthogonal to boundary
  const triR = diskR * 0.55;
  const verts: [number, number][] = ([0, (2 * Math.PI) / 3, (4 * Math.PI) / 3] as number[]).map(
    (a) => [
      diskCx + triR * Math.cos(a - Math.PI / 2),
      diskCy + triR * Math.sin(a - Math.PI / 2),
    ],
  ) as [number, number][];

  const drawHypSide = (P: [number, number], Q: [number, number]) => {
    const px = (P[0] - diskCx) / diskR;
    const py = (P[1] - diskCy) / diskR;
    const qx = (Q[0] - diskCx) / diskR;
    const qy = (Q[1] - diskCy) / diskR;

    const p2 = px * px + py * py;
    const px_ = px / p2;
    const py_ = py / p2;

    const ax = px, ay = py;
    const bx = qx, by = qy;
    const cx2 = px_, cy2 = py_;

    const D = 2 * (ax * (by - cy2) + bx * (cy2 - ay) + cx2 * (ay - by));
    if (Math.abs(D) < 1e-9) {
      ctx.beginPath();
      ctx.moveTo(P[0], P[1]);
      ctx.lineTo(Q[0], Q[1]);
      ctx.stroke();
      return;
    }
    const ux =
      ((ax * ax + ay * ay) * (by - cy2) +
        (bx * bx + by * by) * (cy2 - ay) +
        (cx2 * cx2 + cy2 * cy2) * (ay - by)) / D;
    const uy =
      ((ax * ax + ay * ay) * (cx2 - bx) +
        (bx * bx + by * by) * (ax - cx2) +
        (cx2 * cx2 + cy2 * cy2) * (bx - ax)) / D;

    const ccx = diskCx + ux * diskR;
    const ccy = diskCy + uy * diskR;
    const cR = Math.hypot(ax - ux, ay - uy) * diskR;

    const startA = Math.atan2(P[1] - ccy, P[0] - ccx);
    const endA = Math.atan2(Q[1] - ccy, Q[0] - ccx);

    ctx.beginPath();
    ctx.arc(ccx, ccy, cR, startA, endA);
    ctx.stroke();
  };

  ctx.strokeStyle = tokens.magenta;
  ctx.lineWidth = 2.5;
  ctx.lineJoin = "round";
  drawHypSide(verts[0], verts[1]);
  drawHypSide(verts[1], verts[2]);
  drawHypSide(verts[2], verts[0]);

  // Panel header
  ctx.textBaseline = "top";
  drawSectionTitle(ctx, 10, 10, "NEGATIVE CURVATURE", tokens.textMute);

  ctx.font = FONT_HUD_SMALL;
  ctx.textBaseline = "top";
  ctx.fillStyle = tokens.textMute;
  ctx.fillText("Poincaré disk", 10, 26);
  ctx.fillText("K < 0", 10, 40);

  // Angle sum HUD
  drawDivider(ctx, 8, PW - 8, PH - 46, tokens.grid);
  drawHudReadout(ctx, 10, PH - 36, "α+β+γ = ", "< π", tokens.textDim, tokens.amber);

  ctx.restore();
}

// ─── Component ────────────────────────────────────────────────────────────────

export function MetricComparisonScene() {
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

      // Active panel cycles 0 → 1 → 2 → 0 ... every PANEL_CYCLE seconds
      const totalCycle = PANEL_CYCLE * 3;
      const cyclePos = elapsed % totalCycle;
      const activePanel = Math.floor(cyclePos / PANEL_CYCLE); // 0, 1, 2
      // Pulse fraction: ramps 0→1 at start, 1→0 at end of each panel slot
      const panelPos = (cyclePos % PANEL_CYCLE) / PANEL_CYCLE; // 0..1
      // Smooth bell: 0→1→0 over the slot
      const pulse = Math.sin(panelPos * Math.PI);

      ctx.fillStyle = tokens.bg;
      ctx.fillRect(0, 0, W, H);

      drawFlat(ctx, 0, activePanel === 0 ? pulse : 0, tokens);
      drawSpherical(ctx, PW, activePanel === 1 ? pulse : 0, tokens);
      drawHyperbolic(ctx, 2 * PW, activePanel === 2 ? pulse : 0, tokens);

      // Panel dividers
      ctx.strokeStyle = tokens.panelBorder;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(PW, 0);
      ctx.lineTo(PW, H);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(2 * PW, 0);
      ctx.lineTo(2 * PW, H);
      ctx.stroke();

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
        aria-label="Three geometry panels side by side: flat space (triangle angles sum to π), spherical positive-curvature space (angles sum to more than π, highlighted cyan), and hyperbolic negative-curvature space (angles sum to less than π, highlighted magenta). The active panel pulses every six seconds."
      />
      <div className="mt-3 flex items-center gap-3 font-mono text-xs text-[var(--color-fg-1)]">
        <span style={{ color: tokens.textDim }}>flat: α+β+γ = π</span>
        <span style={{ color: tokens.cyan }}>sphere: α+β+γ {">"} π</span>
        <span style={{ color: tokens.magenta }}>hyperbolic: α+β+γ {"<"} π</span>
      </div>
    </div>
  );
}
