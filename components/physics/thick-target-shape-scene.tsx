"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useAnimationFrame } from "@/lib/animation/use-animation-frame";
import { useThemeColors } from "@/lib/hooks/use-theme-colors";
import {
  kramersSpectrum,
  thinTargetSpectrum,
} from "@/lib/physics/electromagnetism/bremsstrahlung";

const RATIO = 0.48;
const MAX_HEIGHT = 400;

const XRAY = "rgba(255, 140, 80,";
const CYAN = "rgba(120, 220, 255,";

/**
 * FIG.56c — Thick-target (Kramers) vs thin-target (Bethe-Heitler)
 * spectral shapes, side by side.
 *
 * Both panels use the same Duane-Hunt cutoff E_max (adjustable) but
 * different approximations for the spectrum shape:
 *   Left — Kramers 1923: dN/dE ∝ (E_max − E)/E.
 *     The thick-target form. What an X-ray tube actually produces.
 *     Monotonically falling from the low-E divergence to zero at the
 *     cutoff.
 *   Right — Bethe-Heitler thin-target: dN/dE ∝ ln(E_max / E).
 *     What a thin foil scattering experiment produces. Also singular at
 *     E → 0, but only logarithmically — a much gentler profile.
 *
 * Both are plotted on a linear scale with a soft low-E absorption tail
 * so the near-origin behaviour is visible without blowing up the
 * y-axis.
 */
export function ThickTargetShapeScene() {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const colors = useThemeColors();
  const [size, setSize] = useState({ width: 720, height: 360 });
  const [E_max, setE_max] = useState(50);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const w = entry.contentRect.width;
        if (w > 0) setSize({ width: w, height: Math.min(w * RATIO, MAX_HEIGHT) });
      }
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const BINS = 400;
  const curves = useMemo(() => {
    const kram = new Float64Array(BINS);
    const bh = new Float64Array(BINS);
    let kPeak = 0;
    let bPeak = 0;
    // Shared soft-absorption profile so the near-E=0 spikes don't
    // dominate either curve; the shape comparison is the point.
    const E_abs = 2.5;
    for (let i = 0; i < BINS; i++) {
      const E = ((i + 0.5) / BINS) * E_max * 1.04;
      const ratio = E_abs / Math.max(E, 0.1);
      const absorb = Math.exp(-(ratio * ratio));
      const k = kramersSpectrum(E, E_max) * absorb;
      const b = thinTargetSpectrum(E, E_max) * absorb;
      kram[i] = k;
      bh[i] = b;
      if (k > kPeak) kPeak = k;
      if (b > bPeak) bPeak = b;
    }
    return { kram, bh, kPeak, bPeak };
  }, [E_max]);

  useAnimationFrame({
    elementRef: containerRef,
    onFrame: (_t) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      const { width, height } = size;
      const dpr = window.devicePixelRatio || 1;
      if (canvas.width !== width * dpr || canvas.height !== height * dpr) {
        canvas.width = width * dpr;
        canvas.height = height * dpr;
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        ctx.scale(dpr, dpr);
      }
      ctx.clearRect(0, 0, width, height);

      const gap = 22;
      const pad = { t: 34, b: 44, outer: 20 };
      const panelW = (width - 2 * pad.outer - gap) / 2;
      const plotH = height - pad.t - pad.b;
      const plotYTop = pad.t;
      const plotYBot = plotYTop + plotH;

      const E_axis_max = E_max * 1.04;

      drawPanel(
        ctx,
        colors,
        pad.outer,
        plotYTop,
        panelW,
        plotH,
        "thick target  (Kramers 1923)",
        "dN/dE ∝ (E_max − E) / E",
        curves.kram,
        curves.kPeak,
        E_axis_max,
        E_max,
        `${XRAY} 1)`,
        `${XRAY} 0.22)`,
      );

      drawPanel(
        ctx,
        colors,
        pad.outer + panelW + gap,
        plotYTop,
        panelW,
        plotH,
        "thin target  (Bethe-Heitler)",
        "dN/dE ∝ ln(E_max / E)",
        curves.bh,
        curves.bPeak,
        E_axis_max,
        E_max,
        `${CYAN} 1)`,
        `${CYAN} 0.22)`,
      );

      // ── Title bar ──
      ctx.fillStyle = colors.fg1;
      ctx.font = "12px monospace";
      ctx.textAlign = "center";
      ctx.fillText(
        "two bremsstrahlung spectra at the same Duane-Hunt cutoff",
        width / 2,
        18,
      );

      // Footer x axis label
      ctx.fillStyle = colors.fg2;
      ctx.font = "10px monospace";
      ctx.textAlign = "center";
      ctx.fillText("E (keV) →", pad.outer + panelW / 2, plotYBot + 32);
      ctx.fillText(
        "E (keV) →",
        pad.outer + panelW + gap + panelW / 2,
        plotYBot + 32,
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
      <div className="mt-3 grid grid-cols-[auto_1fr_auto] items-center gap-x-3 gap-y-2 px-2 text-sm">
        <label className="text-[var(--color-fg-3)]">Duane-Hunt E_max</label>
        <input
          type="range"
          min={20}
          max={120}
          step={1}
          value={E_max}
          onChange={(e) => setE_max(parseFloat(e.target.value))}
          className="accent-[rgb(255,140,80)]"
        />
        <span className="w-24 text-right font-mono text-[var(--color-fg-1)]">
          {E_max.toFixed(0)} keV
        </span>
      </div>
      <div className="mt-2 px-2 font-mono text-[11px] text-[var(--color-fg-3)]">
        both shapes diverge at low E in principle; absorption in the tube window clips them in practice.
      </div>
    </div>
  );
}

function drawPanel(
  ctx: CanvasRenderingContext2D,
  colors: { fg0: string; fg1: string; fg2: string; fg3: string },
  x: number,
  y: number,
  w: number,
  h: number,
  title: string,
  formula: string,
  values: Float64Array,
  peak: number,
  E_axis_max: number,
  E_max: number,
  stroke: string,
  fill: string,
) {
  // frame
  ctx.strokeStyle = colors.fg3;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(x, y + h);
  ctx.lineTo(x + w, y + h);
  ctx.stroke();

  // ticks
  ctx.fillStyle = colors.fg2;
  ctx.font = "10px monospace";
  ctx.textAlign = "center";
  const step = 20;
  for (let E = 0; E <= E_axis_max; E += step) {
    const xPx = x + (E / E_axis_max) * w;
    ctx.strokeStyle = colors.fg3;
    ctx.beginPath();
    ctx.moveTo(xPx, y + h);
    ctx.lineTo(xPx, y + h + 4);
    ctx.stroke();
    ctx.fillText(E.toString(), xPx, y + h + 14);
  }

  // filled curve
  const N = values.length;
  const maxV = Math.max(peak, 1e-9);
  ctx.beginPath();
  ctx.moveTo(x, y + h);
  for (let i = 0; i < N; i++) {
    const E = ((i + 0.5) / N) * E_axis_max;
    const xPx = x + (E / E_axis_max) * w;
    const v = values[i];
    const yPx = y + h - (v / maxV) * h * 0.88;
    ctx.lineTo(xPx, yPx);
  }
  ctx.lineTo(x + w, y + h);
  ctx.closePath();
  ctx.fillStyle = fill;
  ctx.fill();

  // outline
  ctx.strokeStyle = stroke;
  ctx.lineWidth = 1.7;
  ctx.beginPath();
  for (let i = 0; i < N; i++) {
    const E = ((i + 0.5) / N) * E_axis_max;
    const xPx = x + (E / E_axis_max) * w;
    const v = values[i];
    const yPx = y + h - (v / maxV) * h * 0.88;
    if (i === 0) ctx.moveTo(xPx, yPx);
    else ctx.lineTo(xPx, yPx);
  }
  ctx.stroke();

  // cutoff
  const cutoffX = x + (E_max / E_axis_max) * w;
  ctx.strokeStyle = colors.fg2;
  ctx.setLineDash([4, 4]);
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(cutoffX, y);
  ctx.lineTo(cutoffX, y + h);
  ctx.stroke();
  ctx.setLineDash([]);

  // labels
  ctx.fillStyle = colors.fg1;
  ctx.font = "11px monospace";
  ctx.textAlign = "left";
  ctx.fillText(title, x + 8, y + 14);
  ctx.fillStyle = colors.fg2;
  ctx.font = "10px monospace";
  ctx.fillText(formula, x + 8, y + 28);
}
