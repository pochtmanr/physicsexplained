"use client";

import { useEffect, useRef, useState } from "react";
import { useAnimationFrame } from "@/lib/animation/use-animation-frame";
import { useThemeColors } from "@/lib/hooks/use-theme-colors";
import { weberKohlrauschRatio } from "@/lib/physics/electromagnetism/charge-invariance";

/**
 * FIG.58b — Weber & Kohlrausch's 1856 measurement.
 *
 * Schematic of the experiment that produced c six years before Maxwell.
 * Two source apparatus drawn side by side:
 *   left  — a parallel-plate capacitor with measured charge Q_es in
 *           electrostatic units, defined by Coulomb's law force.
 *   right — a current loop with measured current i in electromagnetic
 *           units, defined by the Ampère force between two wires.
 *
 * The same physical charge expressed in both unit systems gives a
 * dimensionless ratio. That ratio sweeps to √(1/μ₀ε₀) = 2.998 × 10⁸ m/s.
 * Animation runs over ~3 s per cycle, then loops.
 *
 * No slider — pure animation that reveals c.
 *
 * Palette:
 *   magenta — capacitor / electrostatic side
 *   cyan    — current loop / electromagnetic side
 *   amber   — sweeping needle on the meter
 */

const RATIO = 0.55;
const MAX_HEIGHT = 360;
const C_TARGET = 2.99792458e8;
const SWEEP_PERIOD_S = 4.5; // total cycle including hold

export function WeberKohlrauschCScene() {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const colors = useThemeColors();

  const [size, setSize] = useState({ width: 720, height: 360 });
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

  const target = weberKohlrauschRatio();

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

      // sweep phase
      const phase = (t % SWEEP_PERIOD_S) / SWEEP_PERIOD_S;
      const SWEEP_FRAC = 0.65;
      const u =
        phase < SWEEP_FRAC
          ? easeOutCubic(phase / SWEEP_FRAC)
          : 1; // hold at full
      const initial = 0.7e8; // initial guess
      const value = initial + (target - initial) * u;

      // ── left: capacitor (electrostatic units) ──
      const padX = 28;
      const colW = (width - padX * 3) / 3;
      const xCap = padX + colW * 0.5;
      const cy = height * 0.45;

      drawCapacitorSchematic(ctx, xCap, cy, colW * 0.9, height * 0.5, colors);

      // ── middle: meter ──
      const xMeter = padX * 1.5 + colW + colW * 0.5;
      drawMeter(ctx, xMeter, cy, colW * 0.95, height * 0.5, value, target, colors);

      // ── right: current loop (electromagnetic units) ──
      const xLoop = padX * 2 + colW * 2 + colW * 0.5;
      drawCurrentLoop(ctx, xLoop, cy, colW * 0.85, height * 0.5, t, colors);

      // ── headers ──
      ctx.fillStyle = colors.fg1;
      ctx.font = "11px monospace";
      ctx.textAlign = "center";
      ctx.fillText("Q (ELECTROSTATIC)", xCap, 18);
      ctx.fillText("i (ELECTROMAGNETIC)", xLoop, 18);
      ctx.fillText("RATIO  →  c", xMeter, 18);

      // ── caption strip ──
      ctx.fillStyle = colors.fg2;
      ctx.font = "10px monospace";
      ctx.textAlign = "center";
      ctx.fillText(
        "Weber & Kohlrausch, 1856 — six years before Maxwell.",
        width / 2,
        height - 14,
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
      <div className="mt-1 px-2 text-xs text-[var(--color-fg-3)]">
        The ratio of the electrostatic to electromagnetic unit of charge is
        √(1/μ₀ε₀) — the speed of light. Six years before Maxwell wrote the
        wave equation, c was already inside the unit definitions.
      </div>
    </div>
  );
}

function easeOutCubic(x: number): number {
  return 1 - Math.pow(1 - x, 3);
}

function drawCapacitorSchematic(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  w: number,
  h: number,
  colors: { fg1: string; fg2: string; fg3: string },
) {
  const plateLen = w * 0.7;
  const gap = h * 0.45;
  const xL = cx - plateLen / 2;
  const xR = cx + plateLen / 2;

  // upper plate (+)
  ctx.fillStyle = "rgba(255, 106, 222, 0.22)";
  ctx.fillRect(xL, cy - gap / 2 - 6, plateLen, 8);
  ctx.strokeStyle = colors.fg3;
  ctx.strokeRect(xL, cy - gap / 2 - 6, plateLen, 8);
  // lower plate (−)
  ctx.fillStyle = "rgba(111, 184, 198, 0.22)";
  ctx.fillRect(xL, cy + gap / 2 - 2, plateLen, 8);
  ctx.strokeRect(xL, cy + gap / 2 - 2, plateLen, 8);

  // 6 dots top + bottom
  for (let i = 0; i < 6; i++) {
    const x = xL + ((i + 0.5) / 6) * plateLen;
    ctx.fillStyle = "#FF6ADE";
    ctx.beginPath();
    ctx.arc(x, cy - gap / 2 - 2, 2.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#6FB8C6";
    ctx.beginPath();
    ctx.arc(x, cy + gap / 2 + 2, 2.5, 0, Math.PI * 2);
    ctx.fill();
  }

  // E-field arrows (3 dashed)
  ctx.strokeStyle = "rgba(180, 180, 220, 0.5)";
  ctx.setLineDash([3, 3]);
  for (let i = 1; i <= 3; i++) {
    const x = xL + (i / 4) * plateLen;
    ctx.beginPath();
    ctx.moveTo(x, cy - gap / 2 + 4);
    ctx.lineTo(x, cy + gap / 2 - 4);
    ctx.stroke();
  }
  ctx.setLineDash([]);

  // labels
  ctx.fillStyle = colors.fg2;
  ctx.font = "10px monospace";
  ctx.textAlign = "center";
  ctx.fillText("F = q²/(4π ε₀ r²)", cx, cy + gap / 2 + 26);
}

function drawCurrentLoop(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  w: number,
  h: number,
  t: number,
  colors: { fg1: string; fg2: string; fg3: string },
) {
  // two parallel wires showing Ampère force; current chevrons animate
  const wireSep = h * 0.42;
  const wireLen = w * 0.78;
  const xL = cx - wireLen / 2;
  const xR = cx + wireLen / 2;
  const y1 = cy - wireSep / 2;
  const y2 = cy + wireSep / 2;

  ctx.strokeStyle = "rgba(111, 184, 198, 0.85)";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(xL, y1);
  ctx.lineTo(xR, y1);
  ctx.moveTo(xL, y2);
  ctx.lineTo(xR, y2);
  ctx.stroke();

  // chevrons sliding to the right
  const chevSpacing = wireLen / 6;
  const phase = (t * 0.5) % 1; // 0..1 every 2s
  ctx.strokeStyle = "rgba(255, 200, 80, 0.85)";
  ctx.lineWidth = 1.5;
  for (let i = -1; i <= 6; i++) {
    const x = xL + ((i + phase) * chevSpacing);
    if (x < xL || x > xR - 4) continue;
    drawChevron(ctx, x, y1);
    drawChevron(ctx, x, y2);
  }

  // attractive force arrows in the middle
  ctx.strokeStyle = "rgba(180, 180, 220, 0.55)";
  drawArrow(ctx, cx - 22, y1 + 4, cx - 22, cy - 4, "rgba(180,180,220,0.55)");
  drawArrow(ctx, cx + 22, y2 - 4, cx + 22, cy + 4, "rgba(180,180,220,0.55)");

  ctx.fillStyle = colors.fg2;
  ctx.font = "10px monospace";
  ctx.textAlign = "center";
  ctx.fillText("F = μ₀ i² / (2π d)", cx, cy + wireSep / 2 + 26);
}

function drawChevron(ctx: CanvasRenderingContext2D, x: number, y: number) {
  ctx.beginPath();
  ctx.moveTo(x - 4, y - 3);
  ctx.lineTo(x, y);
  ctx.lineTo(x - 4, y + 3);
  ctx.stroke();
}

function drawArrow(
  ctx: CanvasRenderingContext2D,
  x0: number,
  y0: number,
  x1: number,
  y1: number,
  color: string,
) {
  const dx = x1 - x0;
  const dy = y1 - y0;
  const len = Math.hypot(dx, dy);
  if (len < 0.5) return;
  const ux = dx / len;
  const uy = dy / len;
  const head = Math.min(6, len * 0.3);
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(x0, y0);
  ctx.lineTo(x1, y1);
  ctx.stroke();
  const nx = -uy;
  const ny = ux;
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(
    x1 - ux * head + nx * head * 0.5,
    y1 - uy * head + ny * head * 0.5,
  );
  ctx.lineTo(
    x1 - ux * head - nx * head * 0.5,
    y1 - uy * head - ny * head * 0.5,
  );
  ctx.closePath();
  ctx.fill();
}

function drawMeter(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  w: number,
  h: number,
  value: number,
  target: number,
  colors: { fg1: string; fg2: string; fg3: string },
) {
  const r = Math.min(w * 0.55, h * 0.55);
  const cyDial = cy - h * 0.05;

  // dial arc (180°)
  ctx.strokeStyle = colors.fg3;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.arc(cx, cyDial, r, Math.PI, 2 * Math.PI);
  ctx.stroke();

  // tick marks
  ctx.font = "9px monospace";
  ctx.fillStyle = colors.fg2;
  const ticks = 5;
  for (let i = 0; i <= ticks; i++) {
    const a = Math.PI + (i / ticks) * Math.PI;
    const x0 = cx + Math.cos(a) * (r - 2);
    const y0 = cyDial + Math.sin(a) * (r - 2);
    const x1 = cx + Math.cos(a) * (r + 6);
    const y1 = cyDial + Math.sin(a) * (r + 6);
    ctx.strokeStyle = colors.fg2;
    ctx.beginPath();
    ctx.moveTo(x0, y0);
    ctx.lineTo(x1, y1);
    ctx.stroke();
  }

  // labels at ends
  ctx.textAlign = "left";
  ctx.fillText("0", cx - r, cyDial + 14);
  ctx.textAlign = "right";
  ctx.fillText("c", cx + r, cyDial + 14);

  // needle
  const u = Math.max(0, Math.min(1, value / target));
  const a = Math.PI + u * Math.PI;
  ctx.strokeStyle = "rgba(255, 200, 80, 0.95)";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(cx, cyDial);
  ctx.lineTo(cx + Math.cos(a) * (r * 0.92), cyDial + Math.sin(a) * (r * 0.92));
  ctx.stroke();

  ctx.fillStyle = "rgba(255, 200, 80, 0.95)";
  ctx.beginPath();
  ctx.arc(cx, cyDial, 3, 0, Math.PI * 2);
  ctx.fill();

  // big readout
  ctx.font = "13px monospace";
  ctx.fillStyle = colors.fg1;
  ctx.textAlign = "center";
  ctx.fillText(formatSpeed(value), cx, cyDial + 30);
  ctx.font = "10px monospace";
  ctx.fillStyle = colors.fg2;
  ctx.fillText("√(1/μ₀ε₀)", cx, cyDial + 46);
}

function formatSpeed(v: number): string {
  return `${(v / 1e8).toFixed(3)} × 10⁸ m/s`;
}
