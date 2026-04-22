"use client";

import { useEffect, useRef, useState } from "react";
import { useAnimationFrame } from "@/lib/animation/use-animation-frame";
import { useThemeColors } from "@/lib/hooks/use-theme-colors";
import {
  potentialAtPoint,
  type Charge,
} from "@/lib/physics/electric-potential";

const RATIO = 0.62;
const MAX_HEIGHT = 420;

/**
 * Voltage map of a dipole, drawn two ways:
 *   - left: 2D heatmap with hot/cold color shading + contour overlay,
 *   - right: isometric "hills and valleys" projection of the same surface.
 * The two views are linked so the reader sees that the contour pattern is
 * literally the topo map of the 3D surface.
 *
 * Pure educational diagram — no controls, slow camera oscillation.
 */
export function PotentialSurfaceScene() {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const colors = useThemeColors();
  const [size, setSize] = useState({ width: 680, height: 420 });

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const ro = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const w = entry.contentRect.width;
        if (w > 0) {
          setSize({ width: w, height: Math.min(w * RATIO, MAX_HEIGHT) });
        }
      }
    });
    ro.observe(container);
    return () => ro.disconnect();
  }, []);

  useAnimationFrame({
    elementRef: containerRef,
    onFrame: (t) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      const { width, height } = size;
      const dpr = window.devicePixelRatio || 1;
      if (canvas.width !== width * dpr || canvas.height !== height * dpr) {
        canvas.width = width * dpr;
        canvas.height = height * dpr;
        ctx.scale(dpr, dpr);
      }

      ctx.clearRect(0, 0, width, height);

      // Two side-by-side panels. On narrow screens, stack vertically.
      const stacked = width < 520;
      const panelW = stacked ? width : width / 2;
      const panelH = stacked ? height / 2 : height;

      // Domain in metres
      const half = 1.0;
      const sources: Charge[] = [
        { q: +5e-9, x: -0.5, y: 0 },
        { q: -5e-9, x: +0.5, y: 0 },
      ];

      // ---- LEFT / TOP: 2D heatmap ----
      drawHeatmap(ctx, 0, 0, panelW, panelH, half, sources, colors);

      // ---- RIGHT / BOTTOM: isometric surface ----
      const isoX = stacked ? 0 : panelW;
      const isoY = stacked ? panelH : 0;
      // Slow camera oscillation
      const camYaw = (Math.sin(t / 4000) * Math.PI) / 12; // ±15°
      drawIsoSurface(
        ctx,
        isoX,
        isoY,
        panelW,
        panelH,
        half,
        sources,
        colors,
        camYaw,
      );

      // HUD
      ctx.fillStyle = colors.fg2;
      ctx.font = "11px monospace";
      ctx.textAlign = "left";
      ctx.fillText("voltage map", 12, 16);
      ctx.textAlign = "right";
      ctx.fillText(
        stacked ? "hills and valleys" : "hills and valleys (3D)",
        width - 12,
        16,
      );
    },
  });

  return (
    <div ref={containerRef} className="w-full pb-4">
      <canvas
        ref={canvasRef}
        style={{ width: size.width, height: size.height }}
        className="block"
      />
      <div className="mt-2 px-2 font-mono text-xs text-[var(--color-fg-3)]">
        magenta = high V (near +)&nbsp;·&nbsp;cyan = low V (near −)&nbsp;·&nbsp;contour
        rings are equipotentials
      </div>
    </div>
  );
}

function drawHeatmap(
  ctx: CanvasRenderingContext2D,
  x0: number,
  y0: number,
  w: number,
  h: number,
  half: number,
  sources: Charge[],
  colors: { fg2: string; fg3: string },
) {
  const cellPx = 4;
  const cols = Math.floor(w / cellPx);
  const rows = Math.floor(h / cellPx);

  // First pass: sample V on the grid, find min/max for normalization
  const samples: number[] = new Array(cols * rows);
  let vMin = Infinity;
  let vMax = -Infinity;
  for (let j = 0; j < rows; j++) {
    for (let i = 0; i < cols; i++) {
      const xM = ((i + 0.5) / cols - 0.5) * 2 * half;
      const yM = (0.5 - (j + 0.5) / rows) * 2 * half;
      const v = potentialAtPoint(sources, { x: xM, y: yM });
      samples[j * cols + i] = v;
      if (Number.isFinite(v)) {
        if (v < vMin) vMin = v;
        if (v > vMax) vMax = v;
      }
    }
  }
  // Symmetric clamp so dipole reads as ±
  const vAbs = Math.max(Math.abs(vMin), Math.abs(vMax));
  // Soft cap to avoid blowout near the singularities
  const vClip = vAbs * 0.45;

  // Draw cells
  for (let j = 0; j < rows; j++) {
    for (let i = 0; i < cols; i++) {
      let v = samples[j * cols + i]!;
      if (!Number.isFinite(v)) v = v > 0 ? vClip : -vClip;
      const norm = Math.max(-1, Math.min(1, v / vClip));
      ctx.fillStyle = potentialColor(norm);
      ctx.fillRect(x0 + i * cellPx, y0 + j * cellPx, cellPx + 0.5, cellPx + 0.5);
    }
  }

  // Contour overlay — draw isopotentials at fixed fractions of vClip
  const contourLevels = [-0.6, -0.3, -0.15, 0, 0.15, 0.3, 0.6].map(
    (f) => f * vClip,
  );
  ctx.lineWidth = 1;
  for (const lvl of contourLevels) {
    ctx.strokeStyle =
      lvl === 0 ? "rgba(238, 242, 249, 0.55)" : "rgba(238, 242, 249, 0.2)";
    drawContour(ctx, samples, cols, rows, lvl, (i, j) => ({
      x: x0 + (i + 0.5) * cellPx,
      y: y0 + (j + 0.5) * cellPx,
    }));
  }

  // Charge markers (project source positions into the panel)
  for (const s of sources) {
    const px = x0 + ((s.x / (2 * half)) + 0.5) * w;
    const py = y0 + (0.5 - s.y / (2 * half)) * h;
    drawChargeDot(ctx, px, py, s.q);
  }

  // Frame
  ctx.strokeStyle = colors.fg3;
  ctx.lineWidth = 1;
  ctx.strokeRect(x0 + 0.5, y0 + 0.5, w - 1, h - 1);
}

function drawIsoSurface(
  ctx: CanvasRenderingContext2D,
  x0: number,
  y0: number,
  w: number,
  h: number,
  half: number,
  sources: Charge[],
  colors: { fg2: string; fg3: string },
  yaw: number,
) {
  const N = 36; // grid resolution
  const dxM = (2 * half) / N;
  const dyM = (2 * half) / N;

  // Sample V grid
  const grid: number[][] = [];
  let vMax = 0;
  for (let j = 0; j <= N; j++) {
    const row: number[] = [];
    for (let i = 0; i <= N; i++) {
      const xM = -half + i * dxM;
      const yM = -half + j * dyM;
      const v = potentialAtPoint(sources, { x: xM, y: yM });
      row.push(Number.isFinite(v) ? v : 0);
      if (Number.isFinite(v) && Math.abs(v) > vMax) vMax = Math.abs(v);
    }
    grid.push(row);
  }
  const vClip = vMax * 0.5;

  // Isometric projection params
  const cx = x0 + w / 2;
  const cy = y0 + h * 0.6;
  const scale = Math.min(w, h) * 0.42;
  const heightScale = h * 0.35;
  const cosY = Math.cos(yaw);
  const sinY = Math.sin(yaw);
  const tilt = 0.55; // foreshortening on y-axis

  function project(xM: number, yM: number, vRaw: number) {
    const vN = Math.max(-1, Math.min(1, vRaw / vClip));
    const xR = xM * cosY - yM * sinY;
    const yR = xM * sinY + yM * cosY;
    const sx = cx + xR * scale;
    const sy = cy - yR * scale * tilt - vN * heightScale;
    return { sx, sy, vN };
  }

  // Draw a 0-plane reference grid (faint)
  ctx.strokeStyle = "rgba(86, 104, 127, 0.18)";
  ctx.lineWidth = 1;
  for (let j = 0; j <= N; j += 6) {
    ctx.beginPath();
    for (let i = 0; i <= N; i++) {
      const p = project(-half + i * dxM, -half + j * dyM, 0);
      if (i === 0) ctx.moveTo(p.sx, p.sy);
      else ctx.lineTo(p.sx, p.sy);
    }
    ctx.stroke();
  }
  for (let i = 0; i <= N; i += 6) {
    ctx.beginPath();
    for (let j = 0; j <= N; j++) {
      const p = project(-half + i * dxM, -half + j * dyM, 0);
      if (j === 0) ctx.moveTo(p.sx, p.sy);
      else ctx.lineTo(p.sx, p.sy);
    }
    ctx.stroke();
  }

  // Draw the surface as wireframe — back to front, so further rows
  // are drawn first. After yaw, "back" is greater rotated-y.
  // We sweep j (y in world coords) such that the back rows render first.
  // Build an order list by computing each row's projected y.
  const rowOrder: Array<{ j: number; depth: number }> = [];
  for (let j = 0; j <= N; j++) {
    const yM = -half + j * dyM;
    rowOrder.push({ j, depth: yM * cosY });
  }
  rowOrder.sort((a, b) => b.depth - a.depth); // back (large depth) first

  // Draw lines along x for each row
  for (const { j } of rowOrder) {
    ctx.beginPath();
    for (let i = 0; i <= N; i++) {
      const xM = -half + i * dxM;
      const yM = -half + j * dyM;
      const p = project(xM, yM, grid[j]![i]!);
      // Color by height
      if (i === 0) ctx.moveTo(p.sx, p.sy);
      else ctx.lineTo(p.sx, p.sy);
    }
    // Average normalised height along the row for color
    let acc = 0;
    for (let i = 0; i <= N; i++) {
      const v = grid[j]![i]!;
      acc += Math.max(-1, Math.min(1, v / vClip));
    }
    const avg = acc / (N + 1);
    ctx.strokeStyle = potentialColor(avg, 0.85);
    ctx.lineWidth = 1.1;
    ctx.stroke();
  }
  // Lines along y for each column
  for (let i = 0; i <= N; i += 1) {
    ctx.beginPath();
    for (let j = 0; j <= N; j++) {
      const xM = -half + i * dxM;
      const yM = -half + j * dyM;
      const p = project(xM, yM, grid[j]![i]!);
      if (j === 0) ctx.moveTo(p.sx, p.sy);
      else ctx.lineTo(p.sx, p.sy);
    }
    let acc = 0;
    for (let j = 0; j <= N; j++) {
      const v = grid[j]![i]!;
      acc += Math.max(-1, Math.min(1, v / vClip));
    }
    const avg = acc / (N + 1);
    ctx.strokeStyle = potentialColor(avg, 0.35);
    ctx.lineWidth = 0.7;
    ctx.stroke();
  }

  // Charge stems (vertical lines from baseplane to surface peak/trough)
  for (const s of sources) {
    const v = potentialAtPoint(sources, { x: s.x, y: s.y });
    const sign = s.q > 0 ? 1 : -1;
    // Use clipped peak
    const tip = project(s.x, s.y, sign * vClip);
    const base = project(s.x, s.y, 0);
    ctx.strokeStyle = sign > 0 ? "#FF6ADE" : "#6FB8C6";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(base.sx, base.sy);
    ctx.lineTo(tip.sx, tip.sy);
    ctx.stroke();
    ctx.fillStyle = sign > 0 ? "#FF6ADE" : "#6FB8C6";
    ctx.beginPath();
    ctx.arc(tip.sx, tip.sy, 5, 0, Math.PI * 2);
    ctx.fill();
    void v;
  }

  // Axis hint
  ctx.fillStyle = colors.fg3;
  ctx.font = "10px monospace";
  ctx.textAlign = "left";
  ctx.fillText("V", x0 + 8, y0 + 14);
}

/**
 * Marching-squares contour at level `lvl` over the sample grid.
 * Each cell with corners (i,j)..(i+1,j+1) is classified by which corners
 * exceed `lvl`, and the appropriate edge segment(s) are drawn.
 */
function drawContour(
  ctx: CanvasRenderingContext2D,
  samples: number[],
  cols: number,
  rows: number,
  lvl: number,
  cellToPx: (i: number, j: number) => { x: number; y: number },
) {
  ctx.beginPath();
  for (let j = 0; j < rows - 1; j++) {
    for (let i = 0; i < cols - 1; i++) {
      const a = samples[j * cols + i]!;
      const b = samples[j * cols + (i + 1)]!;
      const c = samples[(j + 1) * cols + (i + 1)]!;
      const d = samples[(j + 1) * cols + i]!;
      if (
        !Number.isFinite(a) ||
        !Number.isFinite(b) ||
        !Number.isFinite(c) ||
        !Number.isFinite(d)
      ) {
        continue;
      }
      let mask = 0;
      if (a > lvl) mask |= 1;
      if (b > lvl) mask |= 2;
      if (c > lvl) mask |= 4;
      if (d > lvl) mask |= 8;
      if (mask === 0 || mask === 15) continue;

      const pA = cellToPx(i, j);
      const pB = cellToPx(i + 1, j);
      const pC = cellToPx(i + 1, j + 1);
      const pD = cellToPx(i, j + 1);
      const lerp = (
        p1: { x: number; y: number },
        v1: number,
        p2: { x: number; y: number },
        v2: number,
      ) => {
        const t = (lvl - v1) / (v2 - v1 || 1);
        return { x: p1.x + (p2.x - p1.x) * t, y: p1.y + (p2.y - p1.y) * t };
      };
      const top = () => lerp(pA, a, pB, b);
      const right = () => lerp(pB, b, pC, c);
      const bottom = () => lerp(pD, d, pC, c);
      const left = () => lerp(pA, a, pD, d);

      switch (mask) {
        case 1:
        case 14: {
          const p = left();
          const q = top();
          ctx.moveTo(p.x, p.y);
          ctx.lineTo(q.x, q.y);
          break;
        }
        case 2:
        case 13: {
          const p = top();
          const q = right();
          ctx.moveTo(p.x, p.y);
          ctx.lineTo(q.x, q.y);
          break;
        }
        case 4:
        case 11: {
          const p = right();
          const q = bottom();
          ctx.moveTo(p.x, p.y);
          ctx.lineTo(q.x, q.y);
          break;
        }
        case 8:
        case 7: {
          const p = left();
          const q = bottom();
          ctx.moveTo(p.x, p.y);
          ctx.lineTo(q.x, q.y);
          break;
        }
        case 3:
        case 12: {
          const p = left();
          const q = right();
          ctx.moveTo(p.x, p.y);
          ctx.lineTo(q.x, q.y);
          break;
        }
        case 6:
        case 9: {
          const p = top();
          const q = bottom();
          ctx.moveTo(p.x, p.y);
          ctx.lineTo(q.x, q.y);
          break;
        }
        case 5: {
          // saddle — choose one diagonal pair
          const p1 = left();
          const q1 = top();
          ctx.moveTo(p1.x, p1.y);
          ctx.lineTo(q1.x, q1.y);
          const p2 = right();
          const q2 = bottom();
          ctx.moveTo(p2.x, p2.y);
          ctx.lineTo(q2.x, q2.y);
          break;
        }
        case 10: {
          const p1 = top();
          const q1 = right();
          ctx.moveTo(p1.x, p1.y);
          ctx.lineTo(q1.x, q1.y);
          const p2 = left();
          const q2 = bottom();
          ctx.moveTo(p2.x, p2.y);
          ctx.lineTo(q2.x, q2.y);
          break;
        }
      }
    }
  }
  ctx.stroke();
}

/**
 * Map normalised potential ∈ [-1, 1] to a color string.
 *  +1 → magenta (high V, near +)
 *   0 → near-black mid
 *  −1 → cyan (low V, near −)
 */
function potentialColor(norm: number, alpha = 1): string {
  const n = Math.max(-1, Math.min(1, norm));
  if (n >= 0) {
    // mix bg → magenta
    const r = Math.round(20 + n * (255 - 20));
    const g = Math.round(28 + n * (106 - 28));
    const b = Math.round(48 + n * (222 - 48));
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  } else {
    // mix bg → cyan
    const t = -n;
    const r = Math.round(20 + t * (111 - 20));
    const g = Math.round(28 + t * (184 - 28));
    const b = Math.round(48 + t * (198 - 48));
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  }
}

function drawChargeDot(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  q: number,
) {
  const isPos = q > 0;
  const fill = isPos ? "#FF6ADE" : "#6FB8C6";
  ctx.shadowColor = isPos
    ? "rgba(255, 106, 222, 0.7)"
    : "rgba(111, 184, 198, 0.7)";
  ctx.shadowBlur = 12;
  ctx.fillStyle = fill;
  ctx.beginPath();
  ctx.arc(cx, cy, 8, 0, Math.PI * 2);
  ctx.fill();
  ctx.shadowBlur = 0;
  ctx.fillStyle = "#07090E";
  ctx.font = "bold 11px monospace";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(isPos ? "+" : "−", cx, cy + 1);
  ctx.textBaseline = "alphabetic";
}
