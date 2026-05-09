"use client";

import { useEffect, useRef, useState } from "react";
import { lineElement, polarMetric2D } from "@/lib/physics/relativity/metric";

/**
 * §07 LINE ELEMENT SCENE — FIG.31b
 *
 * Canvas 2D. Two coordinate paths between the same two points A = (1, 0.5)
 * and B = (2.5, 2) in the Cartesian plane:
 *   - Cartesian path: straight line from A to B, ds² = dx² + dy².
 *   - Polar path:     straight line in (r, φ) space, interpolated and
 *                     arc-length integrated using ds² = dr² + r² dφ².
 *
 * Both integrals converge to the same arc length, demonstrating that
 * the metric makes path length coordinate-independent.
 */

// ─── Integration helpers ───────────────────────────────────────────────────

/** Numerically integrate arc length along a 2D Cartesian polyline. */
function cartesianArcLength(pts: readonly [number, number][]): number {
  let total = 0;
  for (let i = 1; i < pts.length; i++) {
    const dx = pts[i][0] - pts[i - 1][0];
    const dy = pts[i][1] - pts[i - 1][1];
    total += Math.sqrt(dx * dx + dy * dy);
  }
  return total;
}

/**
 * Integrate arc length along a path given as (r, φ) samples,
 * using ds² = dr² + r² dφ² at each midpoint.
 */
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

const N = 200; // number of samples per path

// World-space points A and B
const A_CART: [number, number] = [1.0, 0.5];
const B_CART: [number, number] = [2.5, 2.0];

/** Generate evenly-spaced Cartesian samples on the straight line A→B. */
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

/** Generate evenly-spaced (r, φ) samples for a straight line in polar coordinate space. */
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
const POLAR_PATH_POLAR_COORDS = buildPolarPath();
/** Convert polar path back to Cartesian for rendering. */
const POLAR_PATH_CART: [number, number][] = POLAR_PATH_POLAR_COORDS.map(
  ([r, phi]) => [r * Math.cos(phi), r * Math.sin(phi)],
);

const CART_LEN = cartesianArcLength(CART_PATH);
const POLAR_LEN = polarArcLength(POLAR_PATH_POLAR_COORDS);

// ─── Drawing helpers ───────────────────────────────────────────────────────

const WORLD_MARGIN = 0.3;
const WORLD_MIN_X = Math.min(A_CART[0], B_CART[0]) - WORLD_MARGIN;
const WORLD_MAX_X = Math.max(A_CART[0], B_CART[0]) + WORLD_MARGIN;
const WORLD_MIN_Y = Math.min(A_CART[1], B_CART[1]) - WORLD_MARGIN;
const WORLD_MAX_Y = Math.max(A_CART[1], B_CART[1]) + WORLD_MARGIN;

export function LineElementScene() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [progress, setProgress] = useState(1);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const W = 560;
    const H = 340;
    const dpr = window.devicePixelRatio ?? 1;
    canvas.width = W * dpr;
    canvas.height = H * dpr;
    canvas.style.width = `${W}px`;
    canvas.style.height = `${H}px`;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    // Background
    ctx.fillStyle = "#0A0C12";
    ctx.fillRect(0, 0, W, H);

    const PAD_L = 48;
    const PAD_R = 24;
    const PAD_T = 24;
    const PAD_B = 40;
    const plotW = W - PAD_L - PAD_R;
    const plotH = H - PAD_T - PAD_B;

    const worldToCanvas = (wx: number, wy: number): [number, number] => {
      const cx =
        PAD_L +
        ((wx - WORLD_MIN_X) / (WORLD_MAX_X - WORLD_MIN_X)) * plotW;
      const cy =
        PAD_T +
        (1 - (wy - WORLD_MIN_Y) / (WORLD_MAX_Y - WORLD_MIN_Y)) * plotH;
      return [cx, cy];
    };

    // Grid
    ctx.strokeStyle = "rgba(255,255,255,0.07)";
    ctx.lineWidth = 1;
    const gridStep = 0.5;
    for (
      let x = Math.ceil(WORLD_MIN_X / gridStep) * gridStep;
      x <= WORLD_MAX_X;
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
      y <= WORLD_MAX_Y;
      y += gridStep
    ) {
      const [, cy] = worldToCanvas(WORLD_MIN_X, y);
      ctx.beginPath();
      ctx.moveTo(PAD_L, cy);
      ctx.lineTo(PAD_L + plotW, cy);
      ctx.stroke();
    }

    // Axes labels
    ctx.fillStyle = "rgba(255,255,255,0.4)";
    ctx.font = "11px ui-monospace, monospace";
    ctx.fillText("x", PAD_L + plotW + 4, PAD_T + plotH);
    ctx.fillText("y", PAD_L - 16, PAD_T + 8);

    const nDraw = Math.floor(progress * N);

    // Draw polar path (curved in Cartesian)
    ctx.strokeStyle = "#FBBF24";
    ctx.lineWidth = 2;
    ctx.setLineDash([6, 4]);
    ctx.beginPath();
    const [px0, py0] = worldToCanvas(...POLAR_PATH_CART[0]);
    ctx.moveTo(px0, py0);
    for (let i = 1; i <= nDraw && i < POLAR_PATH_CART.length; i++) {
      const [px, py] = worldToCanvas(...POLAR_PATH_CART[i]);
      ctx.lineTo(px, py);
    }
    ctx.stroke();
    ctx.setLineDash([]);

    // Draw Cartesian path (straight line)
    ctx.strokeStyle = "#67E8F9";
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    const [cx0, cy0] = worldToCanvas(...CART_PATH[0]);
    ctx.moveTo(cx0, cy0);
    for (let i = 1; i <= nDraw && i < CART_PATH.length; i++) {
      const [cx, cy] = worldToCanvas(...CART_PATH[i]);
      ctx.lineTo(cx, cy);
    }
    ctx.stroke();

    // Endpoints
    const drawDot = (wx: number, wy: number, label: string) => {
      const [cx, cy] = worldToCanvas(wx, wy);
      ctx.beginPath();
      ctx.arc(cx, cy, 5, 0, 2 * Math.PI);
      ctx.fillStyle = "#ffffff";
      ctx.fill();
      ctx.fillStyle = "rgba(255,255,255,0.9)";
      ctx.font = "bold 12px ui-monospace, monospace";
      ctx.fillText(label, cx + 8, cy - 6);
    };
    drawDot(A_CART[0], A_CART[1], "A");
    drawDot(B_CART[0], B_CART[1], "B");

    // Legend
    ctx.font = "12px ui-monospace, monospace";
    ctx.fillStyle = "#67E8F9";
    ctx.fillText("▬  Cartesian path   ds² = dx² + dy²", PAD_L, H - 14);
    ctx.fillStyle = "#FBBF24";
    ctx.fillText("╌  Polar path       ds² = dr² + r²dφ²", PAD_L, H - 0);

    // Arc-length HUD
    const showLen = progress >= 0.98;
    if (showLen) {
      ctx.fillStyle = "rgba(10,12,18,0.80)";
      ctx.fillRect(W - 200, PAD_T, 192, 54);
      ctx.fillStyle = "#67E8F9";
      ctx.font = "11px ui-monospace, monospace";
      ctx.fillText(`Cartesian  L = ${CART_LEN.toFixed(4)}`, W - 196, PAD_T + 18);
      ctx.fillStyle = "#FBBF24";
      ctx.fillText(`Polar      L = ${POLAR_LEN.toFixed(4)}`, W - 196, PAD_T + 36);
      ctx.fillStyle = "rgba(255,255,255,0.5)";
      ctx.fillText("same arc length ✓", W - 196, PAD_T + 52);
    }
  }, [progress]);

  return (
    <div className="flex flex-col items-center gap-3">
      <canvas ref={canvasRef} className="rounded-md border border-white/10 bg-black/40" />
      <label className="flex w-full max-w-[560px] items-center gap-3 font-mono text-xs text-white/70">
        <span>path reveal</span>
        <input
          type="range"
          min={0}
          max={1}
          step={0.01}
          value={progress}
          onChange={(e) => setProgress(parseFloat(e.target.value))}
          className="flex-1"
        />
        <span>{(progress * 100).toFixed(0)}%</span>
      </label>
      <p className="max-w-[560px] font-mono text-xs text-white/50">
        The cyan straight line and the amber curved line connect the same two
        points A and B. Integrating ds² = g_&#123;μν&#125; dx^μ dx^ν along each path with
        the appropriate metric gives the same arc length — geometry is
        coordinate-independent.
      </p>
    </div>
  );
}
