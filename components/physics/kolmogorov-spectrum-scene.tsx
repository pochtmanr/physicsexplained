"use client";

import { useEffect, useRef, useState } from "react";
import { sampleSpectrum } from "@/lib/physics/turbulence";
import { useThemeColors } from "@/lib/hooks/use-theme-colors";

/**
 * The Kolmogorov −5/3 spectrum on log-log axes.
 *
 * Three regimes across the decades of wavenumber:
 *
 *   • Energy-containing (low k):   the large-eddy hump where forcing lives.
 *   • Inertial range:               the clean k^(-5/3) line, the K41 law.
 *   • Dissipative (high k):         exponential roll-off at the Kolmogorov
 *                                   scale, where viscosity turns everything
 *                                   to heat.
 *
 * The plot is deliberately static — this is a measurement, not a
 * simulation. A reduced-motion-friendly reveal runs once on mount.
 */

const RATIO = 0.62;
const MAX_HEIGHT = 380;

// Wavenumber range: six decades, from energy-containing eddies to the
// viscous cutoff. Dimensionless; 1 ≈ integral scale.
const K_MIN = 1e-1;
const K_MAX = 1e4;

// Inertial range in k. Outside this band we blend in a forcing hump on the
// low side and an exponential cutoff on the high side.
const K_INJECT = 0.7;
const K_DISSIP = 600;

function shapedSpectrum(k: number): number {
  // Inertial line (ε = 1, C_K = 1.5)
  const inertial = 1.5 * Math.pow(k, -5 / 3);
  // Forcing hump: a smooth rise from 0 toward the inertial line around K_INJECT.
  const forcing = 1 / (1 + Math.pow(K_INJECT / k, 4));
  // Viscous cutoff: Pao-style exponential decay beyond K_DISSIP.
  const cutoff = Math.exp(-1.5 * Math.pow(k / K_DISSIP, 4 / 3));
  return inertial * forcing * cutoff;
}

export interface KolmogorovSpectrumSceneProps {
  width?: number;
  height?: number;
}

export function KolmogorovSpectrumScene(_props: KolmogorovSpectrumSceneProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const colors = useThemeColors();
  const [size, setSize] = useState({ width: 520, height: 320 });

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

  const { width, height } = size;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, width, height);

    const marginLeft = 48;
    const marginRight = 20;
    const marginTop = 18;
    const marginBottom = 36;
    const plotW = width - marginLeft - marginRight;
    const plotH = height - marginTop - marginBottom;

    const logKMin = Math.log10(K_MIN);
    const logKMax = Math.log10(K_MAX);

    // Build the shaped spectrum across the full range.
    const N = 220;
    const ks: number[] = [];
    const Es: number[] = [];
    for (let i = 0; i < N; i++) {
      const lk = logKMin + (i * (logKMax - logKMin)) / (N - 1);
      const k = Math.pow(10, lk);
      ks.push(k);
      Es.push(shapedSpectrum(k));
    }

    // Choose log-E axis limits generously around the data.
    const logEs = Es.map((e) => Math.log10(e));
    const logEMax = Math.max(...logEs) + 0.4;
    const logEMin = logEMax - 8.5; // ~8 decades down

    const toX = (logK: number) =>
      marginLeft + (plotW * (logK - logKMin)) / (logKMax - logKMin);
    const toY = (logE: number) =>
      marginTop + plotH - (plotH * (logE - logEMin)) / (logEMax - logEMin);

    // ─── Grid ────────────────────────────────────────────────────────────
    ctx.strokeStyle = colors.fg3;
    ctx.lineWidth = 1;
    ctx.setLineDash([2, 3]);
    for (let lk = Math.ceil(logKMin); lk <= Math.floor(logKMax); lk++) {
      const x = toX(lk);
      ctx.beginPath();
      ctx.moveTo(x, marginTop);
      ctx.lineTo(x, marginTop + plotH);
      ctx.stroke();
    }
    for (let le = Math.ceil(logEMin); le <= Math.floor(logEMax); le++) {
      const y = toY(le);
      ctx.beginPath();
      ctx.moveTo(marginLeft, y);
      ctx.lineTo(marginLeft + plotW, y);
      ctx.stroke();
    }
    ctx.setLineDash([]);

    // ─── Axes ────────────────────────────────────────────────────────────
    ctx.strokeStyle = colors.fg2;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(marginLeft, marginTop);
    ctx.lineTo(marginLeft, marginTop + plotH);
    ctx.lineTo(marginLeft + plotW, marginTop + plotH);
    ctx.stroke();

    // Tick labels
    ctx.fillStyle = colors.fg2;
    ctx.font = "10px monospace";
    ctx.textAlign = "center";
    ctx.textBaseline = "top";
    for (let lk = Math.ceil(logKMin); lk <= Math.floor(logKMax); lk++) {
      ctx.fillText(`10^${lk}`, toX(lk), marginTop + plotH + 6);
    }
    ctx.textAlign = "right";
    ctx.textBaseline = "middle";
    for (
      let le = Math.ceil(logEMin);
      le <= Math.floor(logEMax);
      le += 2
    ) {
      ctx.fillText(`10^${le}`, marginLeft - 6, toY(le));
    }

    // Axis titles
    ctx.fillStyle = colors.fg1;
    ctx.font = "11px monospace";
    ctx.textAlign = "center";
    ctx.textBaseline = "alphabetic";
    ctx.fillText(
      "wavenumber  k  (1/length)",
      marginLeft + plotW / 2,
      height - 6,
    );
    ctx.save();
    ctx.translate(12, marginTop + plotH / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.textAlign = "center";
    ctx.fillText("energy  E(k)", 0, 0);
    ctx.restore();

    // ─── Regime bands (subtle fills) ─────────────────────────────────────
    const inertialLeft = toX(Math.log10(K_INJECT));
    const inertialRight = toX(Math.log10(K_DISSIP));
    ctx.fillStyle = "rgba(111, 184, 198, 0.06)";
    ctx.fillRect(
      inertialLeft,
      marginTop,
      inertialRight - inertialLeft,
      plotH,
    );

    // Vertical dividers for the three regimes
    ctx.strokeStyle = colors.fg3;
    ctx.setLineDash([4, 4]);
    ctx.lineWidth = 1;
    for (const k of [K_INJECT, K_DISSIP]) {
      const x = toX(Math.log10(k));
      ctx.beginPath();
      ctx.moveTo(x, marginTop);
      ctx.lineTo(x, marginTop + plotH);
      ctx.stroke();
    }
    ctx.setLineDash([]);

    // Regime labels
    ctx.fillStyle = colors.fg1;
    ctx.font = "10px monospace";
    ctx.textAlign = "center";
    ctx.textBaseline = "top";
    const labelY = marginTop + 6;
    ctx.fillText("forcing", (toX(logKMin) + inertialLeft) / 2, labelY);
    ctx.fillStyle = "#6FB8C6";
    ctx.fillText(
      "inertial range · k^(−5/3)",
      (inertialLeft + inertialRight) / 2,
      labelY,
    );
    ctx.fillStyle = colors.fg1;
    ctx.fillText("dissipation", (inertialRight + toX(logKMax)) / 2, labelY);

    // ─── The −5/3 reference line (dashed, full range) ────────────────────
    const refSpectrum = sampleSpectrum(K_MIN, K_MAX, 40);
    ctx.strokeStyle = "rgba(255, 106, 222, 0.45)";
    ctx.lineWidth = 1;
    ctx.setLineDash([5, 4]);
    ctx.beginPath();
    refSpectrum.forEach((p, i) => {
      const x = toX(p.logK);
      const y = toY(p.logE);
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.stroke();
    ctx.setLineDash([]);

    // Slope annotation next to the reference line
    ctx.fillStyle = "#FF6ADE";
    ctx.font = "11px monospace";
    ctx.textAlign = "left";
    ctx.textBaseline = "bottom";
    const annotK = 5;
    const annotLogE = Math.log10(1.5 * Math.pow(annotK, -5 / 3));
    ctx.fillText(
      "slope = −5/3",
      toX(Math.log10(annotK)) + 6,
      toY(annotLogE) - 4,
    );

    // ─── The full shaped spectrum (solid cyan) ───────────────────────────
    ctx.strokeStyle = "#6FB8C6";
    ctx.lineWidth = 1.8;
    ctx.shadowColor = "rgba(111, 184, 198, 0.5)";
    ctx.shadowBlur = 6;
    ctx.beginPath();
    for (let i = 0; i < N; i++) {
      const x = toX(Math.log10(ks[i]!));
      const y = toY(Math.log10(Es[i]!));
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();
    ctx.shadowBlur = 0;
  }, [width, height, colors]);

  return (
    <div ref={containerRef} className="w-full pb-2">
      <canvas ref={canvasRef} style={{ width, height }} className="block" />
      <div className="mt-2 px-2 text-xs text-[var(--color-fg-3)]">
        Log-log. Energy enters at the low-k hump, cascades down the
        straight −5/3 line, and dies at the viscous cutoff. Measured in
        the atmosphere, in wind tunnels, in the solar wind — the slope is
        always the same.
      </div>
    </div>
  );
}
