"use client";

import { useEffect, useRef, useState } from "react";

/**
 * COMMUTATOR SCENE — §08 THE RIEMANN TENSOR
 *
 * Visualises how parallel transport around a closed loop on a curved surface
 * (sphere) returns a vector rotated by an angle proportional to the loop area.
 * This rotation per unit area is a component of the Riemann tensor.
 *
 * Controls:
 *   - "Loop size" slider: shrinks the parallelogram; the ratio (rotation / area)
 *     converges to the local R-value as the loop → 0.
 */

const W = 540;
const H = 360;
const CX = W / 2;
const CY = H / 2 - 10;
const SPHERE_R = 100; // projected sphere radius in px

/** Project a point on the unit sphere (given θ, φ) to 2D canvas. */
function project(theta: number, phi: number, rotY: number): [number, number, number] {
  // Rotate around Y axis for a pleasing 3D look
  const x0 = Math.sin(theta) * Math.cos(phi);
  const y0 = Math.cos(theta);
  const z0 = Math.sin(theta) * Math.sin(phi);
  const x1 = x0 * Math.cos(rotY) + z0 * Math.sin(rotY);
  const z1 = -x0 * Math.sin(rotY) + z0 * Math.cos(rotY);
  return [CX + x1 * SPHERE_R, CY - y0 * SPHERE_R, z1];
}

/** Sample several points along a geodesic segment from (θ1,φ1) to (θ2,φ2) on unit sphere. */
function geodesicPoints(
  theta1: number, phi1: number,
  theta2: number, phi2: number,
  steps: number,
  rotY: number,
): [number, number][] {
  const pts: [number, number][] = [];
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    // Spherical linear interpolation
    const th = theta1 + (theta2 - theta1) * t;
    const ph = phi1 + (phi2 - phi1) * t;
    const [sx, sy] = project(th, ph, rotY);
    pts.push([sx, sy]);
  }
  return pts;
}

/** Draw a polyline on 2D canvas. */
function drawPolyline(ctx: CanvasRenderingContext2D, pts: [number, number][], color: string, width: number) {
  if (pts.length < 2) return;
  ctx.beginPath();
  ctx.moveTo(pts[0][0], pts[0][1]);
  for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i][0], pts[i][1]);
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.stroke();
}

/** Draw an arrow head at (tx, ty) pointing in direction (dx, dy). */
function arrowHead(ctx: CanvasRenderingContext2D, tx: number, ty: number, dx: number, dy: number, size: number, color: string) {
  const len = Math.sqrt(dx * dx + dy * dy);
  if (len < 1e-6) return;
  const ux = dx / len;
  const uy = dy / len;
  ctx.beginPath();
  ctx.moveTo(tx, ty);
  ctx.lineTo(tx - size * ux + size * 0.4 * uy, ty - size * uy - size * 0.4 * ux);
  ctx.lineTo(tx - size * ux - size * 0.4 * uy, ty - size * uy + size * 0.4 * ux);
  ctx.closePath();
  ctx.fillStyle = color;
  ctx.fill();
}

/** Draw a sphere latitude-longitude grid with depth-based opacity. */
function drawSphere(ctx: CanvasRenderingContext2D, rotY: number, alpha: number) {
  ctx.save();
  ctx.globalAlpha = alpha;
  const LATS = 7;
  const LONS = 10;
  ctx.lineWidth = 0.5;
  ctx.strokeStyle = "#4a5568";
  // Latitudes
  for (let i = 1; i < LATS; i++) {
    const th = (i / LATS) * Math.PI;
    const pts: [number, number][] = [];
    for (let j = 0; j <= 40; j++) {
      const ph = (j / 40) * 2 * Math.PI;
      const [sx, sy, sz] = project(th, ph, rotY);
      if (sz > -0.05) pts.push([sx, sy]);
      else {
        if (pts.length > 1) drawPolyline(ctx, pts, "#4a5568", 0.5);
        pts.length = 0;
      }
    }
    if (pts.length > 1) drawPolyline(ctx, pts, "#4a5568", 0.5);
  }
  // Longitudes
  for (let j = 0; j < LONS; j++) {
    const ph = (j / LONS) * 2 * Math.PI;
    const pts: [number, number][] = [];
    for (let i = 0; i <= 30; i++) {
      const th = (i / 30) * Math.PI;
      const [sx, sy, sz] = project(th, ph, rotY);
      if (sz > -0.05) pts.push([sx, sy]);
      else {
        if (pts.length > 1) drawPolyline(ctx, pts, "#4a5568", 0.5);
        pts.length = 0;
      }
    }
    if (pts.length > 1) drawPolyline(ctx, pts, "#4a5568", 0.5);
  }
  ctx.restore();
}

export function CommutatorScene() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [loopSize, setLoopSize] = useState(0.5); // 0.1 .. 1.0
  const [rotY, setRotY] = useState(0.4);
  const [isDragging, setIsDragging] = useState(false);
  const lastX = useRef(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.clearRect(0, 0, W, H);

    // Background
    ctx.fillStyle = "#0f172a";
    ctx.fillRect(0, 0, W, H);

    // Draw sphere grid
    drawSphere(ctx, rotY, 0.6);

    // Loop parameters — a small parallelogram in θ-φ space on the sphere
    const th0 = Math.PI / 2; // base θ: equator
    const ph0 = 0.4 + rotY * 0.2; // base φ: slightly dynamic for visual clarity
    const dth = 0.4 * loopSize;
    const dph = 0.6 * loopSize;

    // Four corners of the loop
    const A = [th0, ph0] as const;
    const B = [th0 + dth, ph0] as const;
    const C = [th0 + dth, ph0 + dph] as const;
    const D = [th0, ph0 + dph] as const;

    // Project corners
    const [ax, ay, az] = project(A[0], A[1], rotY);
    const [bx, by, bz] = project(B[0], B[1], rotY);
    const [cx, cy, cz] = project(C[0], C[1], rotY);
    const [dx, dy, dz] = project(D[0], D[1], rotY);
    void az; void bz; void cz; void dz;

    // Draw two paths around the loop
    // Path 1: A→B→C (cyan, "go θ first, then φ")
    const pathAB = geodesicPoints(A[0], A[1], B[0], B[1], 20, rotY);
    const pathBC = geodesicPoints(B[0], B[1], C[0], C[1], 20, rotY);
    ctx.save();
    ctx.shadowColor = "#22d3ee";
    ctx.shadowBlur = 8;
    drawPolyline(ctx, pathAB, "#22d3ee", 2);
    drawPolyline(ctx, pathBC, "#22d3ee", 2);
    ctx.restore();
    // Arrows on path 1
    if (pathAB.length >= 2) {
      const [x1, y1] = pathAB[pathAB.length - 2];
      arrowHead(ctx, bx, by, bx - x1, by - y1, 8, "#22d3ee");
    }
    if (pathBC.length >= 2) {
      const [x1, y1] = pathBC[pathBC.length - 2];
      arrowHead(ctx, cx, cy, cx - x1, cy - y1, 8, "#22d3ee");
    }

    // Path 2: A→D→C (amber, "go φ first, then θ")
    const pathAD = geodesicPoints(A[0], A[1], D[0], D[1], 20, rotY);
    const pathDC = geodesicPoints(D[0], D[1], C[0], C[1], 20, rotY);
    ctx.save();
    ctx.shadowColor = "#fb923c";
    ctx.shadowBlur = 8;
    drawPolyline(ctx, pathAD, "#fb923c", 2);
    drawPolyline(ctx, pathDC, "#fb923c", 2);
    ctx.restore();
    if (pathAD.length >= 2) {
      const [x1, y1] = pathAD[pathAD.length - 2];
      arrowHead(ctx, dx, dy, dx - x1, dy - y1, 8, "#fb923c");
    }
    if (pathDC.length >= 2) {
      const [x1, y1] = pathDC[pathDC.length - 2];
      arrowHead(ctx, cx, cy, cx - x1, cy - y1, 8, "#fb923c");
    }

    // Draw initial vector at A
    const vLen = 30;
    const vecAngle0 = -Math.PI / 6;
    const vx0 = vLen * Math.cos(vecAngle0);
    const vy0 = vLen * Math.sin(vecAngle0);
    ctx.strokeStyle = "#a3e635";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(ax, ay);
    ctx.lineTo(ax + vx0, ay + vy0);
    ctx.stroke();
    arrowHead(ctx, ax + vx0, ay + vy0, vx0, vy0, 8, "#a3e635");

    // Holonomy angle at C: rotation = area / R²
    // Area of the loop ≈ sin(theta0) * dth * dph for unit sphere
    const area = Math.sin(th0) * dth * dph;
    const holoAngle = area; // R=1: rotation = area/R² = area
    const vecAngleC = vecAngle0 + holoAngle;
    const vxC = vLen * Math.cos(vecAngleC);
    const vyC = vLen * Math.sin(vecAngleC);

    // Draw transported vector at C (original, faded)
    ctx.strokeStyle = "rgba(163,230,53,0.3)";
    ctx.lineWidth = 1.5;
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(cx + vx0, cy + vy0);
    ctx.stroke();
    ctx.setLineDash([]);

    // Draw rotated vector at C (bright)
    ctx.strokeStyle = "#a3e635";
    ctx.lineWidth = 2.5;
    ctx.save();
    ctx.shadowColor = "#a3e635";
    ctx.shadowBlur = 10;
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(cx + vxC, cy + vyC);
    ctx.stroke();
    ctx.restore();
    arrowHead(ctx, cx + vxC, cy + vyC, vxC, vyC, 8, "#a3e635");

    // Label the rotation
    ctx.fillStyle = "#a3e635";
    ctx.font = "bold 12px monospace";
    ctx.fillText(`δ = ${holoAngle.toFixed(3)} rad`, cx + 16, cy - 14);

    // Loop area label
    const areaLabel = `A = ${area.toFixed(3)}`;
    const [midX, midY] = [(ax + cx) / 2, (ay + cy) / 2];
    ctx.fillStyle = "#94a3b8";
    ctx.font = "11px monospace";
    ctx.fillText(areaLabel, midX + 12, midY);

    // Legend
    ctx.font = "11px monospace";
    ctx.fillStyle = "#22d3ee";
    ctx.fillText("∇_θ then ∇_φ", 16, H - 44);
    ctx.fillStyle = "#fb923c";
    ctx.fillText("∇_φ then ∇_θ", 16, H - 28);
    ctx.fillStyle = "#a3e635";
    ctx.fillText("parallel-transported V", 16, H - 12);

    // HUD: ratio δ/A → R
    const ratio = area > 1e-6 ? holoAngle / area : 1.0;
    ctx.fillStyle = "rgba(148,163,184,0.9)";
    ctx.font = "11px monospace";
    ctx.fillText(`δ/A = ${ratio.toFixed(3)}  (→ R = 1 as A→0)`, W - 200, 20);

    // Corner labels
    ctx.font = "bold 12px monospace";
    ctx.fillStyle = "#e2e8f0";
    ctx.fillText("A", ax - 14, ay + 4);
    ctx.fillText("C", cx + 8, cy + 4);

  }, [loopSize, rotY]);

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    lastX.current = e.clientX;
  };
  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    const dx = e.clientX - lastX.current;
    lastX.current = e.clientX;
    setRotY((r) => r + dx * 0.01);
  };
  const handleMouseUp = () => setIsDragging(false);

  return (
    <div className="flex flex-col items-center gap-3">
      <canvas
        ref={canvasRef}
        width={W}
        height={H}
        className="max-w-full cursor-grab rounded-lg border border-white/10 active:cursor-grabbing"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        style={{ background: "#0f172a" }}
      />
      <div className="flex w-full max-w-[540px] flex-col gap-2 font-mono text-xs text-white/70">
        <div className="flex items-center gap-3">
          <label htmlFor="loop-size" className="w-24 shrink-0">Loop size</label>
          <input
            id="loop-size"
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
        <p className="text-white/40">
          Drag the sphere to rotate. Shrink the loop: the rotation-per-unit-area δ/A converges to the local Riemann component.
        </p>
      </div>
    </div>
  );
}
