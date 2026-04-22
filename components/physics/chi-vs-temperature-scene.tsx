"use client";

import { useEffect, useRef, useState } from "react";
import { useAnimationFrame } from "@/lib/animation/use-animation-frame";
import { useThemeColors } from "@/lib/hooks/use-theme-colors";
import {
  curieSusceptibility,
  curieWeissSusceptibility,
} from "@/lib/physics/electromagnetism/magnetization";

/**
 * FIG.17c — χ_m(T) for the three families of magnetic matter.
 *
 *   diamagnet  — flat, tiny, negative. Temperature-independent.
 *   paramagnet — Curie's law, χ = C/T. Falls with heat.
 *   ferromagnet — Curie–Weiss, χ = C/(T − T_c). Diverges at T_c, collapses to
 *                  paramagnet behaviour above it.
 *
 * A slider compresses or expands the x-axis range so the reader can zoom in
 * near T_c to see the divergence, or zoom out to see the paramagnet curve
 * decay and the ferromagnet reduce to the paramagnet at high T.
 *
 * The curves are clipped at a maximum y so the ferromagnet's spike doesn't
 * wash the chart out. A small dashed vertical line marks T_c.
 */

const CYAN = "rgba(120, 220, 255, 0.95)"; // paramagnet
const MAGENTA = "#FF6ADE"; // ferromagnet
const AMBER = "#FFD66B"; // diamagnet baseline
const GREEN = "rgba(120, 255, 170, 0.85)"; // T_c marker (§04/§05 response cue)

const RATIO = 0.55;
const MAX_HEIGHT = 380;

const C_PARA = 1; // Curie constant for paramagnet (arbitrary units)
const C_FERRO = 1; // Curie–Weiss constant for ferromagnet
const TC = 200; // Curie temperature (K, scene units)
const CHI_DIA = -0.0005; // flat diamagnet baseline (scaled for chart visibility)

export function ChiVsTemperatureScene() {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const colors = useThemeColors();
  const [size, setSize] = useState({ width: 640, height: 360 });
  // Slider: x-axis max temperature, in K. Lets the reader zoom.
  const [tMax, setTMax] = useState(800);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver((entries) => {
      for (const e of entries) {
        const w = e.contentRect.width;
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

      // Chart area
      const padL = 56;
      const padR = 18;
      const padT = 22;
      const padB = 46;
      const chartX0 = padL;
      const chartY0 = padT;
      const chartW = width - padL - padR;
      const chartH = height - padT - padB;

      // Axes
      ctx.strokeStyle = colors.fg3;
      ctx.lineWidth = 1;
      ctx.strokeRect(chartX0, chartY0, chartW, chartH);

      // Y scale: split into "positive" (top ~70%) and "negative" (bottom ~30%)
      // so we can show both the paramagnet/ferromagnet positive χ and the
      // diamagnet's slightly negative baseline on the same chart.
      const yZeroFrac = 0.78; // zero line at 78% down — gives positive plenty of room
      const yZero = chartY0 + chartH * yZeroFrac;
      const yMax = chartY0 + 4; // top = χ_max
      const yMin = chartY0 + chartH - 4; // bottom = χ_min
      const CHI_PLOT_MAX = 0.02; // clip paramagnet/ferromagnet spikes here
      const CHI_PLOT_MIN = -0.001;

      const yOf = (chi: number) => {
        if (chi >= 0) {
          const frac = Math.min(1, chi / CHI_PLOT_MAX);
          return yZero - (yZero - yMax) * frac;
        }
        const frac = Math.max(-1, chi / Math.abs(CHI_PLOT_MIN));
        return yZero + (yMin - yZero) * -frac;
      };

      // X scale: 0..tMax K
      const xOf = (T: number) => chartX0 + (T / tMax) * chartW;

      // Zero line
      ctx.strokeStyle = colors.fg3;
      ctx.setLineDash([2, 4]);
      ctx.beginPath();
      ctx.moveTo(chartX0, yZero);
      ctx.lineTo(chartX0 + chartW, yZero);
      ctx.stroke();
      ctx.setLineDash([]);

      // Grid ticks on x axis
      ctx.fillStyle = colors.fg2;
      ctx.font = "10px monospace";
      ctx.textAlign = "center";
      const xTicks = 5;
      for (let i = 0; i <= xTicks; i++) {
        const T = (tMax / xTicks) * i;
        const x = xOf(T);
        ctx.strokeStyle = colors.fg3;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(x, chartY0 + chartH);
        ctx.lineTo(x, chartY0 + chartH + 3);
        ctx.stroke();
        ctx.fillText(`${T.toFixed(0)}`, x, chartY0 + chartH + 14);
      }
      ctx.fillText("T (K)", chartX0 + chartW / 2, chartY0 + chartH + 28);

      // Y axis labels
      ctx.textAlign = "right";
      ctx.fillText("χ_m", chartX0 - 8, chartY0 + 6);
      ctx.fillText("0", chartX0 - 8, yZero + 3);
      ctx.fillText(
        `+${CHI_PLOT_MAX.toFixed(3)}`,
        chartX0 - 8,
        yMax + 10,
      );
      ctx.fillText(
        `${CHI_PLOT_MIN.toFixed(4)}`,
        chartX0 - 8,
        yMin - 2,
      );

      // ── Curve A: diamagnet — flat, slightly negative ──
      ctx.strokeStyle = AMBER;
      ctx.lineWidth = 1.8;
      ctx.beginPath();
      ctx.moveTo(xOf(0), yOf(CHI_DIA));
      ctx.lineTo(xOf(tMax), yOf(CHI_DIA));
      ctx.stroke();
      labelCurve(ctx, xOf(tMax) - 6, yOf(CHI_DIA) - 6, "diamagnet", AMBER);

      // ── Curve B: paramagnet — χ = C/T ──
      ctx.strokeStyle = CYAN;
      ctx.lineWidth = 1.8;
      ctx.beginPath();
      let started = false;
      const steps = 360;
      for (let i = 0; i <= steps; i++) {
        const T = (tMax * i) / steps;
        if (T <= 1) continue; // avoid blow-up at T → 0
        const chi = clamp(curieSusceptibility(T, C_PARA) * 1e-3, -1e9, CHI_PLOT_MAX);
        // factor 1e-3 chosen so paramagnet curve sits in the visible window
        const x = xOf(T);
        const y = yOf(chi);
        if (!started) {
          ctx.moveTo(x, y);
          started = true;
        } else {
          ctx.lineTo(x, y);
        }
      }
      ctx.stroke();

      // ── Curve C: ferromagnet — χ = C/(T − T_c) for T > T_c, infinite below ──
      ctx.strokeStyle = MAGENTA;
      ctx.lineWidth = 2;
      ctx.shadowColor = "rgba(255, 106, 222, 0.4)";
      ctx.shadowBlur = 4;
      ctx.beginPath();
      let ferroStarted = false;
      for (let i = 0; i <= steps; i++) {
        const T = (tMax * i) / steps;
        if (T <= TC + 0.5) continue;
        const chi = clamp(
          curieWeissSusceptibility(T, C_FERRO, TC) * 1e-3,
          -1e9,
          CHI_PLOT_MAX,
        );
        const x = xOf(T);
        const y = yOf(chi);
        if (!ferroStarted) {
          ctx.moveTo(x, y);
          ferroStarted = true;
        } else {
          ctx.lineTo(x, y);
        }
      }
      ctx.stroke();
      ctx.shadowBlur = 0;

      // Below T_c: shade region and label "ordered phase"
      if (TC < tMax) {
        ctx.fillStyle = "rgba(255, 106, 222, 0.08)";
        ctx.fillRect(chartX0, chartY0, xOf(TC) - chartX0, chartH);
      }

      // T_c marker (green-cyan response cue)
      if (TC < tMax) {
        const xTc = xOf(TC);
        ctx.strokeStyle = GREEN;
        ctx.lineWidth = 1.2;
        ctx.setLineDash([3, 4]);
        ctx.beginPath();
        ctx.moveTo(xTc, chartY0);
        ctx.lineTo(xTc, chartY0 + chartH);
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.fillStyle = GREEN;
        ctx.textAlign = "left";
        ctx.fillText("T_c", xTc + 4, chartY0 + 14);
      }

      // Legend (top right, inside chart)
      const lx = chartX0 + chartW - 170;
      const ly = chartY0 + 10;
      ctx.textAlign = "left";
      ctx.font = "11px monospace";

      ctx.fillStyle = AMBER;
      ctx.fillText("● diamagnet    χ ≈ const < 0", lx, ly);
      ctx.fillStyle = CYAN;
      ctx.fillText("● paramagnet   χ = C/T", lx, ly + 16);
      ctx.fillStyle = MAGENTA;
      ctx.fillText("● ferromagnet  χ = C/(T−T_c)", lx, ly + 32);
    },
  });

  return (
    <div ref={containerRef} className="w-full pb-4">
      <canvas
        ref={canvasRef}
        style={{ width: size.width, height: size.height }}
        className="block"
      />
      <div className="mt-3 flex flex-wrap items-center gap-3 px-2">
        <label className="flex items-center gap-2 text-xs font-mono text-[var(--color-fg-2)]">
          <span className="w-20 text-[var(--color-fg-1)]">T range</span>
          <input
            type="range"
            min={250}
            max={1500}
            step={10}
            value={tMax}
            onChange={(e) => setTMax(parseFloat(e.target.value))}
            className="w-48 accent-[#78DCFF]"
          />
          <span className="w-20 text-right text-[var(--color-fg-1)] tabular-nums">
            0..{tMax.toFixed(0)} K
          </span>
        </label>
        <span className="text-xs font-mono text-[var(--color-fg-3)]">
          zoom the x-axis · narrow to see the Curie–Weiss divergence at T_c
        </span>
      </div>
    </div>
  );
}

function labelCurve(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  text: string,
  color: string,
) {
  ctx.fillStyle = color;
  ctx.font = "10px monospace";
  ctx.textAlign = "right";
  ctx.fillText(text, x, y);
}

function clamp(v: number, lo: number, hi: number): number {
  if (!Number.isFinite(v)) return hi;
  if (v < lo) return lo;
  if (v > hi) return hi;
  return v;
}
