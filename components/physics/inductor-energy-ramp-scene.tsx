"use client";

import { useEffect, useRef, useState } from "react";
import { useAnimationFrame } from "@/lib/animation/use-animation-frame";
import { useThemeColors } from "@/lib/hooks/use-theme-colors";
import {
  inductorEnergy,
  inductorPower,
} from "@/lib/physics/electromagnetism/magnetic-energy";

const RATIO = 0.58;
const MAX_HEIGHT = 380;

const L = 1.0; // henries, display value (scene units)
const I_MAX = 2.5; // amperes at plateau
const TAU = 1.4; // L/R time-constant in seconds (visual)
const CYCLE = TAU * 6 + 1.2; // ramp window then auto-reset

/**
 * FIG.24b — U(t) = ½ L I(t)² traced live as the current ramps from 0 to
 * I_max through the canonical series-RL response I(t) = I_max·(1 − e^(−t/τ)).
 *
 * Left: the RL loop — battery, resistor R, inductor L, with "current dots"
 * whose speed tracks I(t). Induced-EMF marker on the inductor (green-cyan
 * arrow that fades as dI/dt decays).
 *
 * Right: two stacked plots —
 *   top: I(t) in amber (monotonic, asymptote at I_max)
 *   bot: U(t) = ½LI² in magenta (quadratic approach, settles at ½ L I_max²)
 *
 * HUD: numeric I, dI/dt, U, P = L·I·(dI/dt). A small identity line reminds
 * the reader that ∫₀^∞ P dt = ½ L I_max² — the work done against the back-EMF
 * ends up in the magnetic field.
 *
 * Reset button or auto-reset at CYCLE.
 */
export function InductorEnergyRampScene() {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const colors = useThemeColors();
  const [size, setSize] = useState({ width: 680, height: 380 });
  const startRef = useRef<number>(0);
  const tNowRef = useRef<number>(0);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const w = entry.contentRect.width;
        if (w > 0) {
          setSize({ width: w, height: Math.min(w * RATIO, MAX_HEIGHT) });
        }
      }
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  useAnimationFrame({
    elementRef: containerRef,
    onFrame: (t) => {
      tNowRef.current = t;
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

      // Auto-reset
      let elapsed = t - startRef.current;
      if (elapsed > CYCLE) {
        startRef.current = t;
        elapsed = 0;
      }

      // Physics: RL series charging
      const I = I_MAX * (1 - Math.exp(-elapsed / TAU));
      const dIdt = (I_MAX / TAU) * Math.exp(-elapsed / TAU);
      const U = inductorEnergy(L, I);
      const P = inductorPower(L, I, dIdt);

      // Layout — left: circuit 38%, right: plots 62%
      const split = width * 0.38;
      const circuitLeft = 10;
      const circuitRight = split - 20;
      const circuitTop = 40;
      const circuitBottom = height - 70;
      drawRLCircuit(ctx, {
        left: circuitLeft,
        right: circuitRight,
        top: circuitTop,
        bottom: circuitBottom,
        iFrac: I / I_MAX,
        dIFrac: (dIdt * TAU) / I_MAX,
        t,
        colors,
      });

      // Right pane — stacked plots
      const plotL = split + 20;
      const plotR = width - 14;
      const plotTop = 40;
      const plotBot = height - 70;
      const gap = 16;
      const halfH = (plotBot - plotTop - gap) / 2;
      const iPlotT = plotTop;
      const iPlotB = plotTop + halfH;
      const uPlotT = iPlotB + gap;
      const uPlotB = plotBot;

      drawIPlot(ctx, plotL, iPlotT, plotR, iPlotB, elapsed, colors);
      drawUPlot(ctx, plotL, uPlotT, plotR, uPlotB, elapsed, colors);

      // HUD top
      ctx.font = "12px monospace";
      ctx.fillStyle = colors.fg1;
      ctx.textAlign = "left";
      ctx.fillText("U(t) = ½ L I(t)²    P = L·I·(dI/dt) = dU/dt", 12, 20);

      // Footer
      ctx.fillStyle = colors.fg2;
      ctx.font = "11px monospace";
      ctx.textAlign = "left";
      ctx.fillText(
        `I = ${I.toFixed(2)} A  ·  dI/dt = ${dIdt.toFixed(2)} A/s`,
        12,
        height - 44,
      );
      ctx.fillText(
        `U = ${U.toFixed(3)} J  ·  P = ${P.toFixed(3)} W`,
        12,
        height - 28,
      );
      ctx.fillStyle = "rgba(120, 255, 170, 0.85)";
      ctx.fillText(
        `∫₀^∞ P dt = ½ L I_max² = ${inductorEnergy(L, I_MAX).toFixed(3)} J  →  into the field`,
        12,
        height - 12,
      );
    },
  });

  const handleReset = () => {
    startRef.current = tNowRef.current;
  };

  return (
    <div ref={containerRef} className="w-full pb-4">
      <canvas
        ref={canvasRef}
        style={{ width: size.width, height: size.height }}
        className="block"
      />
      <div className="mt-2 flex items-center justify-between px-2 font-mono text-xs">
        <span className="text-[var(--color-fg-3)]">
          ramp: I(t) = I_max (1 − e^(−t/τ))  ·  τ = L/R
        </span>
        <button
          type="button"
          onClick={handleReset}
          className="border border-[var(--color-fg-4)] px-3 py-1 text-[var(--color-fg-1)] transition-colors hover:border-[#FF6ADE] hover:text-[#FF6ADE]"
        >
          reset
        </button>
      </div>
    </div>
  );
}

function drawRLCircuit(
  ctx: CanvasRenderingContext2D,
  opts: {
    left: number;
    right: number;
    top: number;
    bottom: number;
    iFrac: number;
    dIFrac: number;
    t: number;
    colors: { fg1: string; fg2: string; fg3: string };
  },
) {
  const { left, right, top, bottom, iFrac, dIFrac, t, colors } = opts;
  const w = right - left;
  const h = bottom - top;

  // Rectangle wires
  ctx.strokeStyle = colors.fg2;
  ctx.lineWidth = 1.5;
  ctx.strokeRect(left, top, w, h);

  // Battery (left middle)
  const bCy = top + h / 2;
  drawBattery(ctx, left, bCy);

  // Resistor (top wire)
  const rCx = left + w / 2;
  drawResistor(ctx, rCx, top);

  // Inductor (right middle)
  drawInductor(ctx, right, bCy, dIFrac);

  // Animated current dots — speed proportional to I
  if (iFrac > 0.02) {
    const perim = 2 * w + 2 * h;
    const speed = 40 + 200 * iFrac;
    const offset = (t * speed) % perim;
    const nDots = 10;
    const alpha = (0.3 + 0.6 * iFrac).toFixed(3);
    ctx.fillStyle = `rgba(255, 214, 107, ${alpha})`; // amber — current carriers
    for (let i = 0; i < nDots; i++) {
      const s = (offset + (i * perim) / nDots) % perim;
      const p = pointOnRectClockwise(s, { left, right, top, bottom });
      ctx.beginPath();
      ctx.arc(p.x, p.y, 2.2, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // Caption
  ctx.fillStyle = colors.fg3;
  ctx.font = "10px monospace";
  ctx.textAlign = "left";
  ctx.fillText("battery · R · L", left, bottom + 16);
}

function drawBattery(ctx: CanvasRenderingContext2D, cx: number, cy: number) {
  ctx.strokeStyle = "#FF6ADE";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(cx - 10, cy - 10);
  ctx.lineTo(cx + 10, cy - 10);
  ctx.stroke();
  ctx.strokeStyle = "#6FB8C6";
  ctx.beginPath();
  ctx.moveTo(cx - 6, cy + 10);
  ctx.lineTo(cx + 6, cy + 10);
  ctx.stroke();

  ctx.fillStyle = "rgba(182, 196, 216, 0.75)";
  ctx.font = "10px monospace";
  ctx.textAlign = "left";
  ctx.fillText("V", cx + 14, cy + 4);
}

function drawResistor(ctx: CanvasRenderingContext2D, cx: number, cy: number) {
  const w = 56;
  const h = 7;
  const segments = 6;
  const segW = w / segments;
  ctx.fillStyle = "#07090E";
  ctx.fillRect(cx - w / 2 - 2, cy - h - 3, w + 4, h * 2 + 6);
  ctx.strokeStyle = "rgba(182, 196, 216, 0.9)";
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(cx - w / 2, cy);
  for (let i = 0; i < segments; i++) {
    const x = cx - w / 2 + (i + 0.5) * segW;
    const y = cy + (i % 2 === 0 ? -h : h);
    ctx.lineTo(x, y);
  }
  ctx.lineTo(cx + w / 2, cy);
  ctx.stroke();
  ctx.fillStyle = "rgba(182, 196, 216, 0.8)";
  ctx.font = "10px monospace";
  ctx.textAlign = "center";
  ctx.fillText("R", cx, cy - h - 6);
}

function drawInductor(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  dIFrac: number,
) {
  // Classic coil: three humps on the right wire
  ctx.fillStyle = "#07090E";
  ctx.fillRect(cx - 18, cy - 30, 36, 60);
  ctx.strokeStyle = "rgba(182, 196, 216, 0.9)";
  ctx.lineWidth = 1.6;
  const humps = 4;
  const humpH = 10;
  const startY = cy - 28;
  const endY = cy + 28;
  const totalH = endY - startY;
  const step = totalH / humps;
  ctx.beginPath();
  ctx.moveTo(cx, startY);
  for (let i = 0; i < humps; i++) {
    const yA = startY + i * step;
    const yB = startY + (i + 1) * step;
    ctx.bezierCurveTo(
      cx + humpH,
      yA,
      cx + humpH,
      yB,
      cx,
      yB,
    );
  }
  ctx.stroke();

  // Induced-EMF arrow — green-cyan, fades with dI/dt
  const emfAlpha = Math.min(0.95, 0.25 + 0.75 * Math.max(0, dIFrac));
  ctx.strokeStyle = `rgba(120, 255, 170, ${emfAlpha.toFixed(3)})`;
  ctx.fillStyle = `rgba(120, 255, 170, ${emfAlpha.toFixed(3)})`;
  ctx.lineWidth = 1.5;
  const ax = cx + 28;
  const ay1 = cy - 14;
  const ay2 = cy + 14;
  ctx.beginPath();
  ctx.moveTo(ax, ay1);
  ctx.lineTo(ax, ay2);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(ax, ay1);
  ctx.lineTo(ax - 3, ay1 + 5);
  ctx.lineTo(ax + 3, ay1 + 5);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = `rgba(120, 255, 170, ${(emfAlpha * 0.95).toFixed(3)})`;
  ctx.font = "10px monospace";
  ctx.textAlign = "left";
  ctx.fillText("back-EMF", ax + 5, cy - 4);
  ctx.fillStyle = "rgba(182, 196, 216, 0.8)";
  ctx.fillText("L", cx - 26, cy + 4);
}

function pointOnRectClockwise(
  s: number,
  r: { left: number; right: number; top: number; bottom: number },
): { x: number; y: number } {
  const w = r.right - r.left;
  const h = r.bottom - r.top;
  if (s < w) return { x: r.left + s, y: r.top };
  if (s < w + h) return { x: r.right, y: r.top + (s - w) };
  if (s < 2 * w + h) return { x: r.right - (s - w - h), y: r.bottom };
  return { x: r.left, y: r.bottom - (s - 2 * w - h) };
}

function drawIPlot(
  ctx: CanvasRenderingContext2D,
  xL: number,
  yT: number,
  xR: number,
  yB: number,
  elapsed: number,
  colors: { fg1: string; fg2: string; fg3: string },
) {
  // Axes
  ctx.strokeStyle = colors.fg3;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(xL, yT);
  ctx.lineTo(xL, yB);
  ctx.lineTo(xR, yB);
  ctx.stroke();

  // Asymptote
  ctx.setLineDash([3, 3]);
  ctx.strokeStyle = colors.fg3;
  ctx.beginPath();
  ctx.moveTo(xL, yT + 6);
  ctx.lineTo(xR, yT + 6);
  ctx.stroke();
  ctx.setLineDash([]);

  const tMax = CYCLE;
  const w = xR - xL;
  const h = yB - yT - 6;
  ctx.strokeStyle = "#FFD66B";
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  for (let i = 0; i <= 120; i++) {
    const tt = (i / 120) * tMax;
    const f = 1 - Math.exp(-tt / TAU);
    const x = xL + (tt / tMax) * w;
    const y = yB - f * h;
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.stroke();

  // Marker
  const tt = Math.min(elapsed, tMax);
  const f = 1 - Math.exp(-tt / TAU);
  const x = xL + (tt / tMax) * w;
  const y = yB - f * h;
  ctx.fillStyle = "#FFD66B";
  ctx.beginPath();
  ctx.arc(x, y, 3, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = colors.fg2;
  ctx.font = "10px monospace";
  ctx.textAlign = "left";
  ctx.fillText("I_max", xL + 4, yT + 4);
  ctx.fillText("I(t)", xL + 4, yT - 4);
  ctx.textAlign = "right";
  ctx.fillText("t", xR, yB + 12);
}

function drawUPlot(
  ctx: CanvasRenderingContext2D,
  xL: number,
  yT: number,
  xR: number,
  yB: number,
  elapsed: number,
  colors: { fg1: string; fg2: string; fg3: string },
) {
  ctx.strokeStyle = colors.fg3;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(xL, yT);
  ctx.lineTo(xL, yB);
  ctx.lineTo(xR, yB);
  ctx.stroke();

  // Asymptote at U_max = ½ L I_max²
  ctx.setLineDash([3, 3]);
  ctx.beginPath();
  ctx.moveTo(xL, yT + 6);
  ctx.lineTo(xR, yT + 6);
  ctx.stroke();
  ctx.setLineDash([]);

  const tMax = CYCLE;
  const w = xR - xL;
  const h = yB - yT - 6;
  const uMax = inductorEnergy(L, I_MAX);
  ctx.strokeStyle = "#FF6ADE";
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  for (let i = 0; i <= 120; i++) {
    const tt = (i / 120) * tMax;
    const I = I_MAX * (1 - Math.exp(-tt / TAU));
    const u = inductorEnergy(L, I) / uMax;
    const x = xL + (tt / tMax) * w;
    const y = yB - u * h;
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.stroke();

  // Marker
  const tt = Math.min(elapsed, tMax);
  const I = I_MAX * (1 - Math.exp(-tt / TAU));
  const u = inductorEnergy(L, I) / uMax;
  const x = xL + (tt / tMax) * w;
  const y = yB - u * h;
  ctx.fillStyle = "#FF6ADE";
  ctx.beginPath();
  ctx.arc(x, y, 3, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = colors.fg2;
  ctx.font = "10px monospace";
  ctx.textAlign = "left";
  ctx.fillText("½LI²_max", xL + 4, yT + 4);
  ctx.fillText("U(t)", xL + 4, yT - 4);
  ctx.textAlign = "right";
  ctx.fillText("t", xR, yB + 12);
}
