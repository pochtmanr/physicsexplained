"use client";

import { useEffect, useRef } from "react";

/**
 * §07 METRIC COMPARISON SCENE — FIG.31c
 *
 * Three side-by-side Canvas 2D panels:
 *   Left   — Euclidean / flat geometry: unit grid, triangle with angle sum = π.
 *   Centre — Spherical / positive curvature: latitude-longitude grid that
 *            compresses near poles, triangle with angle sum > π.
 *   Right  — Hyperbolic / negative curvature: Poincaré-disk style, triangle
 *            with angle sum < π.
 *
 * Each panel also draws the metric tensor components as text.
 */

const W = 560;
const H = 290;
const PW = Math.floor(W / 3); // panel width
const PH = H;

// ─── Colours ───────────────────────────────────────────────────────────────

const BG = "#0A0C12";
const GRID = "rgba(255,255,255,0.12)";
const GRID_HL = "rgba(255,255,255,0.30)";
const TRI_FLAT = "#67E8F9";
const TRI_SPH = "#FF6ADE";
const TRI_HYP = "#FBBF24";
const LABEL = "rgba(255,255,255,0.85)";
const SUB = "rgba(255,255,255,0.45)";

// ─── Panel drawing functions ────────────────────────────────────────────────

/** Draw left flat-space panel */
function drawFlat(ctx: CanvasRenderingContext2D, ox: number) {
  ctx.save();
  ctx.translate(ox, 0);

  // Background
  ctx.fillStyle = BG;
  ctx.fillRect(0, 0, PW, PH);

  // Grid — regular Cartesian
  const step = 28;
  ctx.strokeStyle = GRID;
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
  // Mid-lines slightly brighter
  ctx.strokeStyle = GRID_HL;
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
  ctx.strokeStyle = TRI_FLAT;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(A[0], A[1]);
  ctx.lineTo(B[0], B[1]);
  ctx.lineTo(C[0], C[1]);
  ctx.closePath();
  ctx.stroke();

  // Angle sum
  ctx.font = "bold 13px ui-monospace, monospace";
  ctx.fillStyle = TRI_FLAT;
  ctx.fillText("α+β+γ = π", cx - 30, cy - 52);

  // Metric label
  ctx.font = "11px ui-monospace, monospace";
  ctx.fillStyle = LABEL;
  ctx.fillText("FLAT (Euclidean)", 8, 18);
  ctx.fillStyle = SUB;
  ctx.fillText("g = diag(1, 1)", 8, 34);
  ctx.fillText("ds² = dx² + dy²", 8, 50);

  ctx.restore();
}

/** Draw centre spherical panel — latitude lines compress near top/bottom */
function drawSpherical(ctx: CanvasRenderingContext2D, ox: number) {
  ctx.save();
  ctx.translate(ox, 0);

  ctx.fillStyle = BG;
  ctx.fillRect(0, 0, PW, PH);

  // Vertical meridian lines — evenly spaced in φ
  const nMerid = 7;
  ctx.strokeStyle = GRID;
  ctx.lineWidth = 1;
  for (let i = 0; i <= nMerid; i++) {
    const x = (i / nMerid) * PW;
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, PH);
    ctx.stroke();
  }

  // Horizontal latitude lines — spaced by sin projection (compress near poles)
  const nLat = 8;
  for (let j = 0; j <= nLat; j++) {
    const theta = (j / nLat) * Math.PI; // 0 → π
    // Map θ to y: at θ=0 → y=0, at θ=π → y=PH, but spacing = sin θ
    // Use y = PH/2 - (PH/2)*cos θ = PH/2*(1 - cos θ)
    const y = (PH / 2) * (1 - Math.cos(theta));
    const isHL = j === 0 || j === nLat / 2 || j === nLat;
    ctx.strokeStyle = isHL ? GRID_HL : GRID;
    ctx.lineWidth = isHL ? 1.2 : 1;
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(PW, y);
    ctx.stroke();
  }

  // Spherical triangle — vertices at distinct latitudes/longitudes
  const cx = PW / 2;
  const mapToCanvas = (theta: number, phi: number): [number, number] => {
    const x = (phi / (2 * Math.PI)) * PW;
    const y = (PH / 2) * (1 - Math.cos(theta));
    return [x, y];
  };

  const A = mapToCanvas(0.4, Math.PI * 0.45);
  const B = mapToCanvas(Math.PI / 2, Math.PI * 0.2);
  const C = mapToCanvas(Math.PI / 2, Math.PI * 0.7);

  ctx.strokeStyle = TRI_SPH;
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.moveTo(A[0], A[1]);
  ctx.lineTo(B[0], B[1]);
  ctx.lineTo(C[0], C[1]);
  ctx.closePath();
  ctx.stroke();

  ctx.font = "bold 13px ui-monospace, monospace";
  ctx.fillStyle = TRI_SPH;
  ctx.fillText("α+β+γ > π", cx - 26, A[1] - 10);

  ctx.font = "11px ui-monospace, monospace";
  ctx.fillStyle = LABEL;
  ctx.fillText("SPHERICAL (+K)", 8, 18);
  ctx.fillStyle = SUB;
  ctx.fillText("g = diag(R², R²sin²θ)", 8, 34);
  ctx.fillText("ds² = R²dθ²+R²sin²θ dφ²", 8, 50);

  ctx.restore();
}

/** Draw right hyperbolic panel — Poincaré disk style */
function drawHyperbolic(ctx: CanvasRenderingContext2D, ox: number) {
  ctx.save();
  ctx.translate(ox, 0);

  ctx.fillStyle = BG;
  ctx.fillRect(0, 0, PW, PH);

  const diskCx = PW / 2;
  const diskCy = PH / 2 + 2;
  const diskR = Math.min(PW, PH) / 2 - 12;

  // Disk boundary
  ctx.strokeStyle = "rgba(255,255,255,0.35)";
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.arc(diskCx, diskCy, diskR, 0, 2 * Math.PI);
  ctx.stroke();

  // Poincaré-disk geodesic grid: draw circular arcs orthogonal to the boundary.
  // We approximate with a small number of pre-computed arcs.
  ctx.strokeStyle = GRID;
  ctx.lineWidth = 1;

  // Diameter lines (actual geodesics through center)
  for (let a = 0; a < Math.PI; a += Math.PI / 4) {
    ctx.beginPath();
    ctx.moveTo(
      diskCx + diskR * Math.cos(a),
      diskCy + diskR * Math.sin(a),
    );
    ctx.lineTo(
      diskCx - diskR * Math.cos(a),
      diskCy - diskR * Math.sin(a),
    );
    ctx.stroke();
  }

  // Circles concentric in Poincaré metric (Euclidean circles, but centred in disk)
  for (const fr of [0.35, 0.60, 0.80]) {
    ctx.beginPath();
    ctx.arc(diskCx, diskCy, fr * diskR, 0, 2 * Math.PI);
    ctx.stroke();
  }

  // Hyperbolic triangle — three vertices inside the disk, sides = circular arcs
  // We approximate with straight lines for simplicity (still shows the geometry)
  const triR = diskR * 0.55;
  const verts: [number, number][] = [0, (2 * Math.PI) / 3, (4 * Math.PI) / 3].map(
    (a) => [diskCx + triR * Math.cos(a - Math.PI / 2), diskCy + triR * Math.sin(a - Math.PI / 2)],
  ) as [number, number][];

  // Draw sides as circular arcs orthogonal to the boundary circle.
  // For each side we find the Euclidean circle orthogonal to the unit disk
  // through two boundary-inversions.
  const drawHypSide = (
    P: [number, number],
    Q: [number, number],
  ) => {
    // Convert to unit disk coordinates
    const px = (P[0] - diskCx) / diskR;
    const py = (P[1] - diskCy) / diskR;
    const qx = (Q[0] - diskCx) / diskR;
    const qy = (Q[1] - diskCy) / diskR;

    // Inversion of P through the unit circle: P* = P / |P|²
    const p2 = px * px + py * py;
    const px_ = px / p2;
    const py_ = py / p2;

    // Circumcircle of P, Q, P* (which is orthogonal to unit circle)
    // Using the standard formula for circumcircle of three points.
    const ax = px, ay = py;
    const bx = qx, by = qy;
    const cx2 = px_, cy2 = py_;

    const D = 2 * (ax * (by - cy2) + bx * (cy2 - ay) + cx2 * (ay - by));
    if (Math.abs(D) < 1e-9) {
      // Collinear (geodesic is a diameter)
      ctx.beginPath();
      ctx.moveTo(P[0], P[1]);
      ctx.lineTo(Q[0], Q[1]);
      ctx.stroke();
      return;
    }
    const ux =
      ((ax * ax + ay * ay) * (by - cy2) +
        (bx * bx + by * by) * (cy2 - ay) +
        (cx2 * cx2 + cy2 * cy2) * (ay - by)) /
      D;
    const uy =
      ((ax * ax + ay * ay) * (cx2 - bx) +
        (bx * bx + by * by) * (ax - cx2) +
        (cx2 * cx2 + cy2 * cy2) * (bx - ax)) /
      D;

    // Convert circumcenter and radius back to canvas coords
    const ccx = diskCx + ux * diskR;
    const ccy = diskCy + uy * diskR;
    const cR = Math.hypot(ax - ux, ay - uy) * diskR;

    // Start/end angles
    const startA = Math.atan2(P[1] - ccy, P[0] - ccx);
    const endA = Math.atan2(Q[1] - ccy, Q[0] - ccx);

    // Draw the shorter arc
    ctx.beginPath();
    ctx.arc(ccx, ccy, cR, startA, endA);
    ctx.stroke();
  };

  ctx.strokeStyle = TRI_HYP;
  ctx.lineWidth = 2.5;
  drawHypSide(verts[0], verts[1]);
  drawHypSide(verts[1], verts[2]);
  drawHypSide(verts[2], verts[0]);

  ctx.font = "bold 13px ui-monospace, monospace";
  ctx.fillStyle = TRI_HYP;
  ctx.fillText("α+β+γ < π", diskCx - 28, diskCy + diskR + 16);

  ctx.font = "11px ui-monospace, monospace";
  ctx.fillStyle = LABEL;
  ctx.fillText("HYPERBOLIC (−K)", 8, 18);
  ctx.fillStyle = SUB;
  ctx.fillText("Poincaré disk", 8, 34);
  ctx.fillText("K < 0", 8, 50);

  ctx.restore();
}

// ─── Component ───────────────────────────────────────────────────────────────

export function MetricComparisonScene() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = window.devicePixelRatio ?? 1;
    canvas.width = W * dpr;
    canvas.height = H * dpr;
    canvas.style.width = `${W}px`;
    canvas.style.height = `${H}px`;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    ctx.clearRect(0, 0, W, H);

    drawFlat(ctx, 0);
    drawSpherical(ctx, PW);
    drawHyperbolic(ctx, 2 * PW);

    // Dividers
    ctx.strokeStyle = "rgba(255,255,255,0.15)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(PW, 0);
    ctx.lineTo(PW, H);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(2 * PW, 0);
    ctx.lineTo(2 * PW, H);
    ctx.stroke();
  }, []);

  return (
    <div className="flex flex-col items-center gap-3">
      <canvas
        ref={canvasRef}
        className="rounded-md border border-white/10 bg-black/40"
      />
      <p className="max-w-[560px] font-mono text-xs text-white/50">
        Three geometries, three metrics. Each triangle has interior angles summing
        to{" "}
        <span className="text-[#67E8F9]">exactly π (flat)</span>,{" "}
        <span className="text-[#FF6ADE]">more than π (positive curvature)</span>, or{" "}
        <span className="text-[#FBBF24]">less than π (negative curvature)</span>.
        The metric g_&#123;μν&#125; is what encodes the curvature.
      </p>
    </div>
  );
}
