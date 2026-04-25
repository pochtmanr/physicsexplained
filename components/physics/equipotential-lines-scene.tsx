"use client";

import { useEffect, useRef, useState } from "react";
import { useAnimationFrame } from "@/lib/animation/use-animation-frame";
import { useThemeColors } from "@/lib/hooks/use-theme-colors";
import {
  potentialAtPoint,
  type Charge,
} from "@/lib/physics/electric-potential";
import { electricFieldAtPoint } from "@/lib/physics/electric-field";

const RATIO = 0.66;
const MAX_HEIGHT = 440;

/**
 * A dipole drawn with field lines AND equipotentials, with toggles.
 * The visual punchline: every equipotential crosses every field line at a
 * right angle. Toggle either layer off to see them in isolation.
 */
export function EquipotentialLinesScene() {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const colors = useThemeColors();
  const [size, setSize] = useState({ width: 640, height: 420 });
  const [showField, setShowField] = useState(true);
  const [showEquipotentials, setShowEquipotentials] = useState(true);

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
    onFrame: () => {
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

      const half = 1.0;
      const sources: Charge[] = [
        { q: +5e-9, x: -0.45, y: 0 },
        { q: -5e-9, x: +0.45, y: 0 },
      ];

      // Convert metres to pixels
      const cx = width / 2;
      const cy = height / 2;
      const scale = Math.min(width, height) * 0.42;
      const mToPx = (xM: number, yM: number) => ({
        x: cx + xM * scale,
        y: cy - yM * scale,
      });

      // ---- equipotentials (drawn first so field lines sit on top) ----
      if (showEquipotentials) {
        // Sample a finer grid for contouring
        const N = 110;
        const samples = new Array<number>(N * N);
        let vAbs = 0;
        for (let j = 0; j < N; j++) {
          for (let i = 0; i < N; i++) {
            const xM = ((i + 0.5) / N - 0.5) * 2 * half;
            const yM = (0.5 - (j + 0.5) / N) * 2 * half;
            const v = potentialAtPoint(sources, { x: xM, y: yM });
            samples[j * N + i] = Number.isFinite(v) ? v : 0;
            if (Number.isFinite(v) && Math.abs(v) > vAbs) vAbs = Math.abs(v);
          }
        }
        const vClip = vAbs * 0.35;

        const cellPxX = width / N;
        const cellPxY = height / N;
        const cellToPx = (i: number, j: number) => ({
          x: (i + 0.5) * cellPxX,
          y: (j + 0.5) * cellPxY,
        });

        const positiveLevels = [0.08, 0.15, 0.3, 0.55, 0.85].map(
          (f) => f * vClip,
        );
        const negativeLevels = positiveLevels.map((l) => -l);

        for (const lvl of positiveLevels) {
          ctx.strokeStyle = "rgba(255, 106, 222, 0.55)";
          ctx.lineWidth = 1;
          drawContour(ctx, samples, N, N, lvl, cellToPx);
        }
        for (const lvl of negativeLevels) {
          ctx.strokeStyle = "rgba(111, 184, 198, 0.55)";
          ctx.lineWidth = 1;
          drawContour(ctx, samples, N, N, lvl, cellToPx);
        }
        // V = 0 plane (the perpendicular bisector)
        ctx.strokeStyle = "rgba(238, 242, 249, 0.45)";
        ctx.lineWidth = 1;
        ctx.setLineDash([4, 4]);
        drawContour(ctx, samples, N, N, 0, cellToPx);
        ctx.setLineDash([]);
      }

      // ---- field lines, traced from a ring of seed points around + ----
      if (showField) {
        const seeds = 16;
        const seedR = 0.06; // metres around +
        const plus = sources[0]!;
        for (let k = 0; k < seeds; k++) {
          const ang = (k / seeds) * Math.PI * 2;
          const start = {
            x: plus.x + seedR * Math.cos(ang),
            y: plus.y + seedR * Math.sin(ang),
          };
          traceFieldLine(ctx, sources, start, mToPx, half, +1);
        }
      }

      // ---- the two charges, on top ----
      const pPlus = mToPx(sources[0]!.x, sources[0]!.y);
      const pMinus = mToPx(sources[1]!.x, sources[1]!.y);
      drawChargeDot(ctx, pPlus.x, pPlus.y, +1);
      drawChargeDot(ctx, pMinus.x, pMinus.y, -1);

      // HUD
      ctx.fillStyle = colors.fg2;
      ctx.font = "11px monospace";
      ctx.textAlign = "left";
      ctx.fillText(
        showEquipotentials && showField
          ? "field lines (white) · equipotentials (color) · they always cross at 90°"
          : showField
            ? "field lines only — E points + → −"
            : showEquipotentials
              ? "equipotentials only — V is constant on each ring"
              : "toggle a layer on",
        12,
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
      <div className="mt-2 flex flex-wrap items-center gap-4 px-2 font-mono text-xs">
        <label className="flex items-center gap-2 text-[var(--color-fg-1)]">
          <input
            type="checkbox"
            checked={showField}
            onChange={(e) => setShowField(e.target.checked)}
            className="accent-[#EEF2F9]"
          />
          field lines
        </label>
        <label className="flex items-center gap-2 text-[var(--color-fg-1)]">
          <input
            type="checkbox"
            checked={showEquipotentials}
            onChange={(e) => setShowEquipotentials(e.target.checked)}
            className="accent-[#FF6ADE]"
          />
          equipotentials
        </label>
      </div>
    </div>
  );
}

function traceFieldLine(
  ctx: CanvasRenderingContext2D,
  sources: Charge[],
  start: { x: number; y: number },
  mToPx: (x: number, y: number) => { x: number; y: number },
  half: number,
  sign: 1 | -1,
) {
  const stepM = 0.012;
  const maxSteps = 600;
  let { x, y } = start;
  ctx.beginPath();
  const p0 = mToPx(x, y);
  ctx.moveTo(p0.x, p0.y);
  for (let s = 0; s < maxSteps; s++) {
    const E = electricFieldAtPoint(sources, { x, y });
    const mag = Math.hypot(E.x, E.y);
    if (mag === 0) break;
    const ux = (sign * E.x) / mag;
    const uy = (sign * E.y) / mag;
    x += ux * stepM;
    y += uy * stepM;
    if (Math.abs(x) > half || Math.abs(y) > half) break;
    // stop near opposite-sign source
    let stop = false;
    for (const src of sources) {
      const r = Math.hypot(x - src.x, y - src.y);
      if (r < 0.05 && Math.sign(src.q) !== sign) {
        stop = true;
        break;
      }
    }
    const p = mToPx(x, y);
    ctx.lineTo(p.x, p.y);
    if (stop) break;
  }
  ctx.strokeStyle = "rgba(238, 242, 249, 0.55)";
  ctx.lineWidth = 1;
  ctx.stroke();
}

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

function drawChargeDot(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  sign: number,
) {
  const isPos = sign > 0;
  const fill = isPos ? "#FF6ADE" : "#6FB8C6";
  ctx.shadowColor = isPos
    ? "rgba(255, 106, 222, 0.7)"
    : "rgba(111, 184, 198, 0.7)";
  ctx.shadowBlur = 14;
  ctx.fillStyle = fill;
  ctx.beginPath();
  ctx.arc(cx, cy, 12, 0, Math.PI * 2);
  ctx.fill();
  ctx.shadowBlur = 0;
  ctx.fillStyle = "#1A1D24";
  ctx.font = "bold 14px monospace";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(isPos ? "+" : "−", cx, cy + 1);
  ctx.textBaseline = "alphabetic";
}
