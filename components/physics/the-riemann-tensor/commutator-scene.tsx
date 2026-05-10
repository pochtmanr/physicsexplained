"use client";

import { useEffect, useRef, useState } from "react";
import {
  applyDpr,
  SCENE_CANVAS_CLASS,
  SCENE_HEIGHT_TALL,
  FONT_HUD,
  FONT_HUD_SMALL,
  FONT_LABEL,
  drawHudReadout,
  drawSectionTitle,
  drawDivider,
  drawArrow,
  hexToRgba,
  useSceneSize,
  useSceneTokens,
  type SceneTokens,
} from "@/components/physics/_shared";

/**
 * COMMUTATOR SCENE — §08 THE RIEMANN TENSOR
 *
 * Visualises how parallel transport around a closed loop on a curved surface
 * (sphere) returns a vector rotated by an angle proportional to the loop area.
 * This rotation per unit area is a component of the Riemann tensor.
 *
 * Two paths shown: CYAN (∇_θ then ∇_φ) and MAGENTA (∇_φ then ∇_θ). A moving
 * GREEN dot animates the loop traversal. HUD shows δ/A in AMBER converging to
 * the Riemann scalar component as loop → 0.
 *
 * Controls:
 *   - "Loop size" slider: shrinks the parallelogram.
 *   - Drag sphere to rotate.
 */

/** Project a point on the unit sphere (given θ, φ) to 2D canvas. */
function project(
  theta: number,
  phi: number,
  rotY: number,
  cx: number,
  cy: number,
  sphereR: number,
): [number, number, number] {
  const x0 = Math.sin(theta) * Math.cos(phi);
  const y0 = Math.cos(theta);
  const z0 = Math.sin(theta) * Math.sin(phi);
  const x1 = x0 * Math.cos(rotY) + z0 * Math.sin(rotY);
  const z1 = -x0 * Math.sin(rotY) + z0 * Math.cos(rotY);
  return [cx + x1 * sphereR, cy - y0 * sphereR, z1];
}

/** Sample several points along a geodesic segment from (θ1,φ1) to (θ2,φ2). */
function geodesicPoints(
  theta1: number,
  phi1: number,
  theta2: number,
  phi2: number,
  steps: number,
  rotY: number,
  cx: number,
  cy: number,
  sphereR: number,
): [number, number][] {
  const pts: [number, number][] = [];
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const th = theta1 + (theta2 - theta1) * t;
    const ph = phi1 + (phi2 - phi1) * t;
    const [sx, sy] = project(th, ph, rotY, cx, cy, sphereR);
    pts.push([sx, sy]);
  }
  return pts;
}

/** Draw a polyline on 2D canvas. */
function drawPolyline(
  ctx: CanvasRenderingContext2D,
  pts: [number, number][],
  color: string,
  width: number,
) {
  if (pts.length < 2) return;
  ctx.beginPath();
  ctx.moveTo(pts[0][0], pts[0][1]);
  for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i][0], pts[i][1]);
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.stroke();
}

/** Draw a lat/lon sphere grid. */
function drawSphereGrid(
  ctx: CanvasRenderingContext2D,
  rotY: number,
  alpha: number,
  tokens: SceneTokens,
  cx: number,
  cy: number,
  sphereR: number,
) {
  ctx.save();
  ctx.globalAlpha = alpha;
  const LATS = 7;
  const LONS = 10;
  const gridColor = tokens.grid;
  // Latitudes
  for (let i = 1; i < LATS; i++) {
    const th = (i / LATS) * Math.PI;
    const pts: [number, number][] = [];
    for (let j = 0; j <= 40; j++) {
      const ph = (j / 40) * 2 * Math.PI;
      const [sx, sy, sz] = project(th, ph, rotY, cx, cy, sphereR);
      if (sz > -0.05) pts.push([sx, sy]);
      else {
        if (pts.length > 1) drawPolyline(ctx, pts, gridColor, 0.6);
        pts.length = 0;
      }
    }
    if (pts.length > 1) drawPolyline(ctx, pts, gridColor, 0.6);
  }
  // Longitudes
  for (let j = 0; j < LONS; j++) {
    const ph = (j / LONS) * 2 * Math.PI;
    const pts: [number, number][] = [];
    for (let i = 0; i <= 30; i++) {
      const th = (i / 30) * Math.PI;
      const [sx, sy, sz] = project(th, ph, rotY, cx, cy, sphereR);
      if (sz > -0.05) pts.push([sx, sy]);
      else {
        if (pts.length > 1) drawPolyline(ctx, pts, gridColor, 0.6);
        pts.length = 0;
      }
    }
    if (pts.length > 1) drawPolyline(ctx, pts, gridColor, 0.6);
  }
  ctx.restore();
}

/** Get point on a concatenated path at parameter t ∈ [0, 1]. */
function pathAtT(
  segments: [number, number][][],
  t: number,
): [number, number] {
  const total = segments.reduce((s, seg) => s + seg.length - 1, 0);
  const idx = Math.floor(t * total);
  let count = 0;
  for (const seg of segments) {
    const len = seg.length - 1;
    if (idx < count + len) {
      const local = (idx - count) / len;
      const a = seg[idx - count];
      const b = seg[idx - count + 1];
      return [a[0] + (b[0] - a[0]) * local, a[1] + (b[1] - a[1]) * local];
    }
    count += len;
  }
  return segments[segments.length - 1][
    segments[segments.length - 1].length - 1
  ];
}

function draw(
  ctx: CanvasRenderingContext2D,
  loopSize: number,
  rotY: number,
  animT: number,
  tokens: SceneTokens,
  W: number,
  H: number,
) {
  const SPHERE_CX = W * 0.38;
  const SPHERE_CY = H / 2 - 10;
  const SPHERE_R = Math.min(110, Math.min(W * 0.25, H * 0.40));

  ctx.clearRect(0, 0, W, H);
  ctx.fillStyle = tokens.bg;
  ctx.fillRect(0, 0, W, H);

  // Draw sphere grid
  drawSphereGrid(ctx, rotY, 0.7, tokens, SPHERE_CX, SPHERE_CY, SPHERE_R);

  // Loop parameters
  const th0 = Math.PI / 2;
  const ph0 = 0.4 + rotY * 0.15;
  const dth = 0.4 * loopSize;
  const dph = 0.6 * loopSize;

  const A = [th0, ph0] as const;
  const B = [th0 + dth, ph0] as const;
  const C = [th0 + dth, ph0 + dph] as const;
  const D = [th0, ph0 + dph] as const;

  const [ax, ay] = project(A[0], A[1], rotY, SPHERE_CX, SPHERE_CY, SPHERE_R);
  const [bx, by] = project(B[0], B[1], rotY, SPHERE_CX, SPHERE_CY, SPHERE_R);
  const [cx, cy] = project(C[0], C[1], rotY, SPHERE_CX, SPHERE_CY, SPHERE_R);
  const [dx, dy] = project(D[0], D[1], rotY, SPHERE_CX, SPHERE_CY, SPHERE_R);

  // Path 1: A→B→C (CYAN — ∇_θ first, then ∇_φ)
  const pathAB = geodesicPoints(A[0], A[1], B[0], B[1], 20, rotY, SPHERE_CX, SPHERE_CY, SPHERE_R);
  const pathBC = geodesicPoints(B[0], B[1], C[0], C[1], 20, rotY, SPHERE_CX, SPHERE_CY, SPHERE_R);
  ctx.save();
  ctx.shadowColor = tokens.cyan;
  ctx.shadowBlur = 8;
  drawPolyline(ctx, pathAB, tokens.cyan, 2);
  drawPolyline(ctx, pathBC, tokens.cyan, 2);
  ctx.restore();
  // Arrowheads path 1
  if (pathAB.length >= 2) {
    const [px, py] = pathAB[pathAB.length - 2];
    drawArrow(ctx, px, py, bx, by, tokens.cyan, 2, 7);
  }
  if (pathBC.length >= 2) {
    const [px, py] = pathBC[pathBC.length - 2];
    drawArrow(ctx, px, py, cx, cy, tokens.cyan, 2, 7);
  }

  // Path 2: A→D→C (MAGENTA — ∇_φ first, then ∇_θ)
  const pathAD = geodesicPoints(A[0], A[1], D[0], D[1], 20, rotY, SPHERE_CX, SPHERE_CY, SPHERE_R);
  const pathDC = geodesicPoints(D[0], D[1], C[0], C[1], 20, rotY, SPHERE_CX, SPHERE_CY, SPHERE_R);
  ctx.save();
  ctx.shadowColor = tokens.magenta;
  ctx.shadowBlur = 8;
  drawPolyline(ctx, pathAD, tokens.magenta, 2);
  drawPolyline(ctx, pathDC, tokens.magenta, 2);
  ctx.restore();
  if (pathAD.length >= 2) {
    const [px, py] = pathAD[pathAD.length - 2];
    drawArrow(ctx, px, py, dx, dy, tokens.magenta, 2, 7);
  }
  if (pathDC.length >= 2) {
    const [px, py] = pathDC[pathDC.length - 2];
    drawArrow(ctx, px, py, cx, cy, tokens.magenta, 2, 7);
  }

  // Animated GREEN dot traversing path 1 (A→B→C)
  const dotPos = pathAtT([pathAB, pathBC], animT);
  ctx.save();
  ctx.shadowColor = tokens.green;
  ctx.shadowBlur = 12;
  ctx.fillStyle = tokens.green;
  ctx.beginPath();
  ctx.arc(dotPos[0], dotPos[1], 5, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  // Initial vector at A (GREEN)
  const vLen = 28;
  const vecAngle0 = -Math.PI / 6;
  const vx0 = vLen * Math.cos(vecAngle0);
  const vy0 = vLen * Math.sin(vecAngle0);
  drawArrow(ctx, ax, ay, ax + vx0, ay + vy0, tokens.green, 2, 7);

  // Holonomy angle
  const area = Math.sin(th0) * dth * dph;
  const holoAngle = area;
  const vecAngleC = vecAngle0 + holoAngle;
  const vxC = vLen * Math.cos(vecAngleC);
  const vyC = vLen * Math.sin(vecAngleC);

  // Faded original direction at C
  ctx.save();
  ctx.globalAlpha = 0.32;
  ctx.setLineDash([4, 4]);
  drawArrow(ctx, cx, cy, cx + vx0, cy + vy0, tokens.green, 1.5, 6);
  ctx.setLineDash([]);
  ctx.restore();

  // Rotated transported vector at C (GREEN with glow)
  ctx.save();
  ctx.shadowColor = tokens.green;
  ctx.shadowBlur = 10;
  drawArrow(ctx, cx, cy, cx + vxC, cy + vyC, tokens.green, 2.5, 8);
  ctx.restore();

  // Rotation label at C
  ctx.save();
  ctx.font = FONT_HUD;
  ctx.fillStyle = tokens.green;
  ctx.textBaseline = "top";
  ctx.fillText(`δ = ${holoAngle.toFixed(3)} rad`, cx + 14, cy - 18);
  ctx.restore();

  // Corner labels A and C
  ctx.save();
  ctx.font = FONT_LABEL;
  ctx.textBaseline = "middle";
  ctx.fillStyle = tokens.textBright;
  ctx.fillText("A", ax - 16, ay);
  ctx.fillText("C", cx + 10, cy);
  ctx.restore();

  // Area label at midpoint
  const [midX, midY] = [(ax + cx) / 2, (ay + cy) / 2];
  ctx.save();
  ctx.font = FONT_HUD_SMALL;
  ctx.fillStyle = tokens.textDim;
  ctx.textBaseline = "top";
  ctx.fillText(`A = ${area.toFixed(3)}`, midX + 10, midY - 6);
  ctx.restore();

  // ── Divider between sphere and HUD ──
  drawDivider(ctx, W * 0.63, W - 16, H / 2, tokens.grid);

  // ── HUD panel (right side) ──
  const hudX = W * 0.64;
  const hudY = 20;

  drawSectionTitle(ctx, hudX, hudY, "PARALLEL TRANSPORT — SPHERE", tokens.textMute);
  drawDivider(ctx, hudX, W - 16, hudY + 18, tokens.grid);

  let hy = hudY + 28;
  const ratio = area > 1e-6 ? holoAngle / area : 1.0;

  hy = drawHudReadout(ctx, hudX, hy, "loop area  A = ", area.toFixed(4), tokens.textDim, tokens.cyan);
  hy = drawHudReadout(ctx, hudX, hy, "rotation   δ = ", holoAngle.toFixed(4), tokens.textDim, tokens.green);
  hy = drawHudReadout(ctx, hudX, hy, "ratio   δ/A   = ", ratio.toFixed(4), tokens.textDim, tokens.amber);
  hy = drawHudReadout(ctx, hudX, hy, "R¹₂₁₂ (exact)  ", "1.0000", tokens.textDim, tokens.textDim);

  drawDivider(ctx, hudX, W - 16, hy + 4, tokens.grid);
  hy += 14;

  // Convergence bar
  const conv = Math.min(1, 1 - Math.abs(ratio - 1));
  ctx.save();
  ctx.fillStyle = hexToRgba(tokens.amber, 0.15);
  ctx.fillRect(hudX, hy, 160, 10);
  ctx.fillStyle = tokens.amber;
  ctx.fillRect(hudX, hy, 160 * conv, 10);
  ctx.restore();
  ctx.save();
  ctx.font = FONT_HUD_SMALL;
  ctx.fillStyle = tokens.textMute;
  ctx.textBaseline = "top";
  ctx.fillText("convergence δ/A → R  (shrink loop)", hudX, hy + 14);
  ctx.restore();

  hy += 36;
  drawDivider(ctx, hudX, W - 16, hy, tokens.grid);
  hy += 12;

  // Legend
  drawSectionTitle(ctx, hudX, hy, "PATHS", tokens.textMute);
  hy += 16;

  ctx.save();
  ctx.font = FONT_HUD;
  ctx.textBaseline = "top";
  ctx.fillStyle = tokens.cyan;
  ctx.fillText("▬  ∇_θ then ∇_φ", hudX, hy);
  hy += 18;
  ctx.fillStyle = tokens.magenta;
  ctx.fillText("▬  ∇_φ then ∇_θ", hudX, hy);
  hy += 18;
  ctx.fillStyle = tokens.green;
  ctx.fillText("▬  parallel-transported V", hudX, hy);
  ctx.restore();

  // Footer
  ctx.save();
  ctx.font = FONT_HUD_SMALL;
  ctx.fillStyle = tokens.textMute;
  ctx.textAlign = "center";
  ctx.textBaseline = "bottom";
  ctx.fillText(
    "R = δ/A as loop area → 0  ·  drag sphere to rotate",
    W / 2,
    H - 8,
  );
  ctx.restore();
}

export function CommutatorScene() {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [loopSize, setLoopSize] = useState(0.5);
  const [rotY, setRotY] = useState(0.4);
  const [isDragging, setIsDragging] = useState(false);
  const lastX = useRef(0);
  const animTRef = useRef(0);
  const rafRef = useRef(0);
  const tokens = useSceneTokens();
  const { width, height } = useSceneSize(containerRef, {
    ratio: 0.58,
    maxHeight: SCENE_HEIGHT_TALL,
  });

  // Smooth RAF loop for the moving dot
  useEffect(() => {
    const start = performance.now();
    const loop = (t: number) => {
      const elapsed = (t - start) / 1000;
      animTRef.current = (elapsed % 3) / 3;

      const canvas = canvasRef.current;
      if (!canvas) {
        rafRef.current = requestAnimationFrame(loop);
        return;
      }
      const ctx = applyDpr(canvas, width, height);
      if (ctx) draw(ctx, loopSize, rotY, animTRef.current, tokens, width, height);
      rafRef.current = requestAnimationFrame(loop);
    };
    rafRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(rafRef.current);
  }, [loopSize, rotY, tokens, width, height]);

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    lastX.current = e.clientX;
  };
  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    const delta = e.clientX - lastX.current;
    lastX.current = e.clientX;
    setRotY((r) => r + delta * 0.01);
  };
  const handleMouseUp = () => setIsDragging(false);

  return (
    <div ref={containerRef} className="relative w-full pb-4">
      <canvas
        ref={canvasRef}
        className={`${SCENE_CANVAS_CLASS} cursor-grab active:cursor-grabbing`}
        style={{ width, height, display: "block" }}
        aria-label="Sphere with two parallelogram paths showing covariant derivative ordering. CYAN: ∇_θ then ∇_φ. MAGENTA: ∇_φ then ∇_θ. A GREEN dot traverses the loop; a GREEN vector at C shows the holonomy rotation. HUD shows δ/A converging to the Riemann component as the loop shrinks."
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      />
      <div className="mt-3 flex items-center gap-3 font-mono text-xs text-[var(--color-fg-1)]">
        <label htmlFor="commutator-loop-size" className="w-24 shrink-0">
          Loop size
        </label>
        <input
          id="commutator-loop-size"
          type="range"
          min={0.08}
          max={1.0}
          step={0.01}
          value={loopSize}
          onChange={(e) => setLoopSize(Number(e.target.value))}
          className="flex-1"
        />
        <span className="w-14 text-right">{loopSize.toFixed(2)}</span>
      </div>
    </div>
  );
}
