"use client";

import { useEffect, useRef, useState } from "react";
import { useThemeColors } from "@/lib/hooks/use-theme-colors";

const RATIO = 0.44;
const MAX_HEIGHT = 360;

/**
 * FIG.57b — Runaway vs reduced-order, under a square-pulse external force.
 *
 * Left panel — the Abraham-Lorentz equation in its raw form:
 *     m · ẍ  =  F_ext(t)  +  (μ₀ q² / 6π c) · x⃛
 *     τ₀ · ȧ  =  a  −  F_ext / m          (solving for ȧ)
 *
 * Integrating this forward in time with a square-pulse F_ext and *any*
 * non-zero initial jerk drives an exponential runaway. Even integrating
 * with ȧ(0) = 0 and only numerical noise, round-off excites the unstable
 * mode within τ₀ e-foldings. The left trace shows |a(t)| ∝ e^{t/τ₀} once
 * the pulse ends — the pathology laid bare.
 *
 * Right panel — Landau-Lifshitz reduced-order substitution:
 *     a(t)  =  F_ext(t) / m  +  (τ₀ / m) · Ḟ_ext(t)
 *
 * This is a *second-order* problem. a(t) faithfully tracks the pulse
 * shape, with spikes of (τ₀/m) · Ḟ_ext at the rising and falling edges.
 * Bounded. Runaway-free. Predictive. But (as the topic prose says
 * plainly) this is a practical regularisation, not a fundamental
 * resolution of the underlying third-order pathology.
 */
export function RunawayVsReducedOrderScene() {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const colors = useThemeColors();
  const [size, setSize] = useState({ width: 720, height: 320 });

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

  useEffect(() => {
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
    ctx.fillStyle = "#07090E";
    ctx.fillRect(0, 0, width, height);

    // ─── Model parameters (dimensionless, scene units) ─────────────
    // τ₀ = 1; pulse of amplitude 1 from t=4 to t=9.
    const tau0 = 1;
    const tMax = 14;
    const dt = 0.002;
    const pulseStart = 4;
    const pulseEnd = 9;
    const pulseAmp = 1.0;
    // Smooth the pulse edges slightly so Ḟ_ext is finite for LL.
    const edge = 0.25;
    const fExt = (t: number) => {
      const rise = smoothstep((t - pulseStart) / edge);
      const fall = smoothstep((t - pulseEnd) / edge);
      return pulseAmp * (rise - fall);
    };
    const fExtDot = (t: number) => {
      const h = 1e-3;
      return (fExt(t + h) - fExt(t - h)) / (2 * h);
    };

    // ─── Abraham-Lorentz full integration (third-order) ────────────
    // State: [a, ȧ]. ȧ' = (a − F_ext/m) / τ₀, with m = 1.
    // Start at rest: a=0, ȧ=0. But add a TINY numerical perturbation
    // (1e-6 to ȧ₀) to represent round-off — this is what excites the
    // runaway in any real simulation. Honesty: without this seed the
    // pathology never visibly fires in a finite-precision integrator.
    const alHistory: { t: number; a: number }[] = [];
    let a = 0;
    let adot = 1e-6; // seed perturbation
    for (let t = 0; t <= tMax; t += dt) {
      alHistory.push({ t, a });
      // RK2
      const k1a = adot;
      const k1adot = (a - fExt(t)) / tau0;
      const a2 = a + 0.5 * dt * k1a;
      const adot2 = adot + 0.5 * dt * k1adot;
      const k2a = adot2;
      const k2adot = (a2 - fExt(t + 0.5 * dt)) / tau0;
      a += dt * k2a;
      adot += dt * k2adot;
      // Safety clamp so the plot range stays readable.
      if (Math.abs(a) > 1e4) {
        a = a > 0 ? 1e4 : -1e4;
        adot = 0;
      }
    }

    // ─── Landau-Lifshitz reduced-order ─────────────────────────────
    // a(t) = F_ext(t)/m + (τ₀/m)·Ḟ_ext(t), m = 1.
    const llHistory: { t: number; a: number }[] = [];
    for (let t = 0; t <= tMax; t += dt) {
      const aLL = fExt(t) + tau0 * fExtDot(t);
      llHistory.push({ t, a: aLL });
    }

    // ─── Layout: two panels side by side ────────────────────────────
    const gap = 18;
    const leftW = (width - gap) / 2;
    const rightW = leftW;
    drawPanel(
      ctx,
      colors,
      0,
      0,
      leftW,
      height,
      alHistory,
      "Abraham-Lorentz  ·  τ₀·ȧ = a − F_ext/m",
      "|a(t)|  (log scale)",
      true,
      fExt,
      tMax,
    );
    drawPanel(
      ctx,
      colors,
      leftW + gap,
      0,
      rightW,
      height,
      llHistory,
      "Landau-Lifshitz  ·  a = F_ext/m + (τ₀/m)·Ḟ_ext",
      "a(t)  (linear)",
      false,
      fExt,
      tMax,
    );
  }, [size, colors]);

  return (
    <div ref={containerRef} className="w-full pb-4">
      <canvas
        ref={canvasRef}
        style={{ width: size.width, height: size.height }}
        className="block rounded-md"
      />
      <p className="mt-3 px-2 text-xs font-mono text-[var(--color-fg-3)]">
        left: round-off seeds the runaway — |a(t)| climbs exponentially
        once the pulse ends. right: LL tracks the pulse shape with finite
        edge spikes, bounded for all time.
      </p>
    </div>
  );
}

function smoothstep(x: number): number {
  if (x <= 0) return 0;
  if (x >= 1) return 1;
  return x * x * (3 - 2 * x);
}

function drawPanel(
  ctx: CanvasRenderingContext2D,
  colors: { fg1: string; fg2: string; fg3: string },
  x: number,
  y: number,
  w: number,
  h: number,
  history: { t: number; a: number }[],
  title: string,
  yLabel: string,
  logY: boolean,
  fExt: (t: number) => number,
  tMax: number,
) {
  // Frame
  ctx.strokeStyle = colors.fg3;
  ctx.lineWidth = 1;
  ctx.strokeRect(x + 0.5, y + 0.5, w - 1, h - 1);

  ctx.fillStyle = colors.fg1;
  ctx.font = "11px monospace";
  ctx.textAlign = "left";
  ctx.fillText(title, x + 10, y + 16);

  const padL = 44;
  const padR = 14;
  const padT = 28;
  const padB = 30;
  const plotX = x + padL;
  const plotY = y + padT;
  const plotW = w - padL - padR;
  const plotH = h - padT - padB;

  // Y range
  let yMin: number;
  let yMax: number;
  if (logY) {
    yMin = -4;
    yMax = 4;
  } else {
    yMin = -0.8;
    yMax = 2.2;
  }

  // Axes
  ctx.strokeStyle = "rgba(160, 176, 200, 0.55)";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(plotX, plotY);
  ctx.lineTo(plotX, plotY + plotH);
  ctx.lineTo(plotX + plotW, plotY + plotH);
  ctx.stroke();

  // Grid + labels
  ctx.strokeStyle = colors.fg3;
  ctx.globalAlpha = 0.35;
  ctx.font = "9px monospace";
  ctx.fillStyle = colors.fg2;
  ctx.textAlign = "right";
  const yTicks = logY ? [-4, -2, 0, 2, 4] : [0, 1, 2];
  for (const v of yTicks) {
    const py = plotY + plotH - ((v - yMin) / (yMax - yMin)) * plotH;
    ctx.beginPath();
    ctx.moveTo(plotX, py);
    ctx.lineTo(plotX + plotW, py);
    ctx.stroke();
    ctx.globalAlpha = 1;
    ctx.fillText(logY ? `10^${v}` : `${v.toFixed(0)}`, plotX - 4, py + 3);
    ctx.globalAlpha = 0.35;
  }
  ctx.globalAlpha = 1;

  // Y-axis label
  ctx.save();
  ctx.fillStyle = colors.fg2;
  ctx.translate(x + 14, plotY + plotH / 2);
  ctx.rotate(-Math.PI / 2);
  ctx.textAlign = "center";
  ctx.fillText(yLabel, 0, 0);
  ctx.restore();

  // X-axis ticks
  ctx.fillStyle = colors.fg2;
  ctx.font = "9px monospace";
  ctx.textAlign = "center";
  for (let tTick = 0; tTick <= tMax; tTick += 2) {
    const px = plotX + (tTick / tMax) * plotW;
    ctx.fillText(`${tTick}τ₀`, px, plotY + plotH + 12);
  }
  ctx.fillStyle = colors.fg1;
  ctx.font = "10px monospace";
  ctx.fillText("t  (units of τ₀)", plotX + plotW / 2, plotY + plotH + 24);

  // Draw F_ext(t) as a background trace (pale blue)
  ctx.strokeStyle = "rgba(140, 200, 255, 0.6)";
  ctx.lineWidth = 1.5;
  ctx.setLineDash([4, 3]);
  ctx.beginPath();
  const nSamples = 300;
  for (let i = 0; i <= nSamples; i++) {
    const t = (i / nSamples) * tMax;
    const f = fExt(t);
    const px = plotX + (t / tMax) * plotW;
    // F_ext scaled to the plot: map 0..1 → bottom-ish to mid for context
    const py = logY
      ? plotY + plotH - 0.15 * plotH * f - 0.1 * plotH
      : plotY + plotH - ((f - yMin) / (yMax - yMin)) * plotH;
    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.stroke();
  ctx.setLineDash([]);

  // Legend entry for F_ext
  ctx.font = "9px monospace";
  ctx.fillStyle = "rgba(140, 200, 255, 0.85)";
  ctx.textAlign = "left";
  ctx.fillText("- - F_ext(t)", plotX + plotW - 76, plotY + 10);

  // Draw a(t) — main signal
  const color = logY ? "rgba(255, 106, 222, 0.95)" : "rgba(140, 240, 200, 0.95)";
  ctx.strokeStyle = color;
  ctx.lineWidth = 2;
  ctx.shadowColor = color;
  ctx.shadowBlur = 4;
  ctx.beginPath();
  let started = false;
  for (let i = 0; i < history.length; i += 2) {
    const pt = history[i];
    const t = pt.t;
    const a = pt.a;
    const px = plotX + (t / tMax) * plotW;
    let py: number;
    if (logY) {
      const la = Math.log10(Math.max(Math.abs(a), 1e-12));
      py = plotY + plotH - ((la - yMin) / (yMax - yMin)) * plotH;
    } else {
      py = plotY + plotH - ((a - yMin) / (yMax - yMin)) * plotH;
    }
    // Clip
    py = Math.max(plotY - 20, Math.min(plotY + plotH + 20, py));
    if (!started) {
      ctx.moveTo(px, py);
      started = true;
    } else {
      ctx.lineTo(px, py);
    }
  }
  ctx.stroke();
  ctx.shadowBlur = 0;

  // Legend entry
  ctx.fillStyle = color;
  ctx.fillText("— a(t)", plotX + plotW - 130, plotY + 10);
}
