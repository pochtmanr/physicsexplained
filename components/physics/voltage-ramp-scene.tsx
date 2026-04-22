"use client";

import { useEffect, useRef, useState } from "react";
import { useAnimationFrame } from "@/lib/animation/use-animation-frame";
import { useThemeColors } from "@/lib/hooks/use-theme-colors";
import {
  potentialAtPoint,
  potentialDifference,
  type Charge,
} from "@/lib/physics/electric-potential";

const RATIO = 0.55;
const MAX_HEIGHT = 380;
const TEST_CHARGE = 1e-9; // 1 nC

/**
 * A test charge slides between two endpoints A and B in the field of a single
 * positive source. Two preset routes — straight line vs. zigzag detour. The
 * energy readout (q · ΔV from start) ramps as the charge moves, but lands on
 * the same final value regardless of the route. That is path independence.
 */
export function VoltageRampScene() {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const colors = useThemeColors();
  const [size, setSize] = useState({ width: 640, height: 360 });
  const [route, setRoute] = useState<"straight" | "zigzag">("straight");
  const startRef = useRef<number | null>(null);

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

  useEffect(() => {
    startRef.current = null;
  }, [route]);

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

      // Top half: the field with the path; bottom: the energy readout strip
      const fieldH = height * 0.7;
      const stripY = fieldH + 18;
      const stripH = height - stripY - 22;

      // Domain in metres
      const half = 1.0;
      const sources: Charge[] = [{ q: +5e-8, x: 0, y: 0 }];

      const cx = width / 2;
      const cy = fieldH / 2;
      const scale = Math.min(width, fieldH) * 0.42;
      const mToPx = (xM: number, yM: number) => ({
        x: cx + xM * scale,
        y: cy - yM * scale,
      });

      // A and B endpoints (metres)
      const A = { x: -0.7, y: 0.5 };
      const B = { x: 0.7, y: -0.4 };

      // Build the path as an array of waypoints in metres
      const path: Array<{ x: number; y: number }> =
        route === "straight"
          ? [A, B]
          : [
              A,
              { x: -0.7, y: -0.6 },
              { x: 0.0, y: 0.7 },
              { x: 0.6, y: -0.7 },
              B,
            ];

      // Cumulative arc length along the path
      const segLen: number[] = [0];
      for (let i = 1; i < path.length; i++) {
        const prev = path[i - 1]!;
        const cur = path[i]!;
        segLen.push(
          segLen[i - 1]! + Math.hypot(cur.x - prev.x, cur.y - prev.y),
        );
      }
      const totalLen = segLen[segLen.length - 1]!;

      if (startRef.current === null) startRef.current = t;
      const period = 4500; // ms one way
      const tau = ((t - startRef.current) % period) / period; // 0..1

      // Position along the path at fraction tau
      const targetS = tau * totalLen;
      let segIdx = 1;
      while (segIdx < segLen.length && segLen[segIdx]! < targetS) segIdx++;
      const sStart = segLen[segIdx - 1]!;
      const sEnd = segLen[segIdx]!;
      const segT = sEnd === sStart ? 0 : (targetS - sStart) / (sEnd - sStart);
      const p0 = path[segIdx - 1]!;
      const p1 = path[segIdx]!;
      const pos = {
        x: p0.x + (p1.x - p0.x) * segT,
        y: p0.y + (p1.y - p0.y) * segT,
      };

      // ---- Draw source ----
      const srcPx = mToPx(0, 0);
      drawChargeDot(ctx, srcPx.x, srcPx.y, +1, 14);

      // ---- Draw both endpoints ----
      const aPx = mToPx(A.x, A.y);
      const bPx = mToPx(B.x, B.y);
      drawEndpoint(ctx, aPx.x, aPx.y, "A", colors.fg1);
      drawEndpoint(ctx, bPx.x, bPx.y, "B", colors.fg1);

      // ---- Draw the route ----
      ctx.strokeStyle = "rgba(228, 194, 122, 0.8)";
      ctx.lineWidth = 2;
      ctx.setLineDash(route === "straight" ? [] : [5, 4]);
      ctx.beginPath();
      const pa = mToPx(path[0]!.x, path[0]!.y);
      ctx.moveTo(pa.x, pa.y);
      for (let i = 1; i < path.length; i++) {
        const p = mToPx(path[i]!.x, path[i]!.y);
        ctx.lineTo(p.x, p.y);
      }
      ctx.stroke();
      ctx.setLineDash([]);

      // ---- Draw moving test charge ----
      const movPx = mToPx(pos.x, pos.y);
      ctx.shadowColor = "rgba(228, 194, 122, 0.7)";
      ctx.shadowBlur = 12;
      ctx.fillStyle = "#E4C27A";
      ctx.beginPath();
      ctx.arc(movPx.x, movPx.y, 7, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;
      ctx.strokeStyle = "#07090E";
      ctx.lineWidth = 1;
      ctx.stroke();

      // ---- Energy readouts ----
      const VA = potentialAtPoint(sources, A);
      const VB = potentialAtPoint(sources, B);
      const Vnow = potentialAtPoint(sources, pos);
      const dV_total = potentialDifference(sources, B, A); // V(B) − V(A)
      // Work done BY the field on the charge moving from A to current pos
      // is W = q · (V(A) − V(pos)). The change in potential energy is
      // ΔU = q · (V(pos) − V(A)) = −W.
      const dU_now = TEST_CHARGE * (Vnow - VA);
      const dU_total = TEST_CHARGE * (VB - VA);

      // ---- Energy strip (the ramp) ----
      const padX = 32;
      const stripW = width - 2 * padX;

      // Frame
      ctx.strokeStyle = colors.fg3;
      ctx.lineWidth = 1;
      ctx.strokeRect(padX, stripY, stripW, stripH);

      // Zero baseline (ΔU = 0 line, somewhere inside)
      // Map ΔU range [min, max] symmetrically around 0
      const dUMag = Math.max(Math.abs(dU_total), Math.abs(dU_now), 1e-30);
      const dUMax = dUMag * 1.15;
      const zeroY = stripY + stripH / 2;
      ctx.strokeStyle = "rgba(86, 104, 127, 0.6)";
      ctx.setLineDash([3, 3]);
      ctx.beginPath();
      ctx.moveTo(padX, zeroY);
      ctx.lineTo(padX + stripW, zeroY);
      ctx.stroke();
      ctx.setLineDash([]);

      // Final ΔU line (target)
      const yTarget = zeroY - (dU_total / dUMax) * (stripH / 2);
      ctx.strokeStyle = "rgba(255, 106, 222, 0.6)";
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.moveTo(padX, yTarget);
      ctx.lineTo(padX + stripW, yTarget);
      ctx.stroke();
      ctx.setLineDash([]);

      // Current ΔU bar — fill from baseline to current value, swept in time
      const xNow = padX + tau * stripW;
      const yNow = zeroY - (dU_now / dUMax) * (stripH / 2);
      ctx.fillStyle =
        dU_now > 0 ? "rgba(255, 106, 222, 0.4)" : "rgba(111, 184, 198, 0.4)";
      ctx.fillRect(
        padX,
        Math.min(zeroY, yNow),
        xNow - padX,
        Math.abs(yNow - zeroY),
      );

      // Trace point on the curve
      ctx.fillStyle = "#E4C27A";
      ctx.beginPath();
      ctx.arc(xNow, yNow, 4, 0, Math.PI * 2);
      ctx.fill();

      // Strip labels
      ctx.fillStyle = colors.fg2;
      ctx.font = "10px monospace";
      ctx.textAlign = "left";
      ctx.fillText("0", padX - 12, zeroY + 4);
      ctx.textAlign = "right";
      ctx.fillText(
        `target ΔU = q·(V_B − V_A) = ${formatJoules(dU_total)}`,
        padX + stripW - 4,
        yTarget - 4,
      );

      // Current readout above the strip
      ctx.fillStyle = colors.fg1;
      ctx.font = "12px monospace";
      ctx.textAlign = "left";
      ctx.fillText(
        `ΔU_now = ${formatJoules(dU_now)}`,
        padX,
        stripY - 6,
      );
      ctx.textAlign = "right";
      ctx.fillText(
        route === "straight" ? "route: straight" : "route: zigzag",
        padX + stripW,
        stripY - 6,
      );

      // HUD on the field panel
      ctx.fillStyle = colors.fg2;
      ctx.font = "11px monospace";
      ctx.textAlign = "left";
      ctx.fillText(
        `V_A = ${formatVolts(VA)}    V_B = ${formatVolts(VB)}`,
        12,
        16,
      );
      ctx.textAlign = "right";
      ctx.fillText("q = 1 nC test charge", width - 12, 16);
    },
  });

  return (
    <div ref={containerRef} className="w-full pb-4">
      <canvas
        ref={canvasRef}
        style={{ width: size.width, height: size.height }}
        className="block"
      />
      <div className="mt-2 flex flex-wrap items-center gap-3 px-2 font-mono text-xs">
        <span className="text-[var(--color-fg-3)]">path:</span>
        <button
          type="button"
          onClick={() => setRoute("straight")}
          className={`rounded border px-2 py-1 ${
            route === "straight"
              ? "border-[#E4C27A] text-[#E4C27A]"
              : "border-[var(--color-fg-4)] text-[var(--color-fg-1)]"
          }`}
        >
          straight
        </button>
        <button
          type="button"
          onClick={() => setRoute("zigzag")}
          className={`rounded border px-2 py-1 ${
            route === "zigzag"
              ? "border-[#E4C27A] text-[#E4C27A]"
              : "border-[var(--color-fg-4)] text-[var(--color-fg-1)]"
          }`}
        >
          zigzag
        </button>
        <span className="ml-2 text-[var(--color-fg-3)]">
          same endpoints, same final ΔU
        </span>
      </div>
    </div>
  );
}

function drawChargeDot(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  sign: number,
  radius: number,
) {
  const isPos = sign > 0;
  const fill = isPos ? "#FF6ADE" : "#6FB8C6";
  ctx.shadowColor = isPos
    ? "rgba(255, 106, 222, 0.7)"
    : "rgba(111, 184, 198, 0.7)";
  ctx.shadowBlur = 14;
  ctx.fillStyle = fill;
  ctx.beginPath();
  ctx.arc(cx, cy, radius, 0, Math.PI * 2);
  ctx.fill();
  ctx.shadowBlur = 0;
  ctx.fillStyle = "#07090E";
  ctx.font = `bold ${Math.max(11, radius)}px monospace`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(isPos ? "+" : "−", cx, cy + 1);
  ctx.textBaseline = "alphabetic";
}

function drawEndpoint(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  label: string,
  fg1: string,
) {
  ctx.strokeStyle = "#E4C27A";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(cx, cy, 7, 0, Math.PI * 2);
  ctx.stroke();
  ctx.fillStyle = fg1;
  ctx.font = "bold 12px monospace";
  ctx.textAlign = "center";
  ctx.fillText(label, cx, cy - 12);
}

function formatVolts(v: number): string {
  const a = Math.abs(v);
  if (a === 0) return "0 V";
  if (a >= 1) return `${v.toFixed(2)} V`;
  if (a >= 1e-3) return `${(v * 1e3).toFixed(2)} mV`;
  return `${v.toExponential(2)} V`;
}

function formatJoules(j: number): string {
  const a = Math.abs(j);
  if (a === 0) return "0 J";
  if (a >= 1e-3) return `${(j * 1e3).toFixed(3)} mJ`;
  if (a >= 1e-6) return `${(j * 1e6).toFixed(3)} µJ`;
  if (a >= 1e-9) return `${(j * 1e9).toFixed(3)} nJ`;
  return `${j.toExponential(2)} J`;
}
