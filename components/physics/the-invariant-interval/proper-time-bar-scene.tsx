"use client";

import { useEffect, useRef, useState } from "react";
import { gamma } from "@/lib/physics/relativity/types";

/**
 * FIG.12c — PROPER TIME BAR CHART.
 *
 * Three bars displayed side by side:
 *   1. Δt   — lab frame coordinate time between the two events.
 *   2. γ    — the Lorentz factor, plotted as a dimensionless multiplier.
 *   3. Δτ   — proper time = √(s²) / c, the invariant heartbeat.
 *
 * β slider: drag β from 0 → 0.95.
 *   • Δt stretches by γ (time dilation).
 *   • γ bar grows in lockstep.
 *   • Δτ bar stays exactly the same height — it is Lorentz-invariant.
 *
 * The two events are fixed in the rest frame of the moving clock:
 *   A = (t=0, x=0),  B = (t=Δτ₀, x=β·c·Δτ₀)
 * so the proper time is a constant Δτ₀ = 3 s regardless of β, and the
 * lab-frame time is Δt = γ · Δτ₀.
 *
 * Convention: c = 1 normalised; numbers on the bars are dimensionless
 * (time in "light-seconds" units). Only the RATIO matters for the demo.
 */

const DELTA_TAU_0 = 3; // proper time in normalised units (c = 1)
const MAX_BETA = 0.95;
const CANVAS_W = 520;
const CANVAS_H = 300;
const BAR_MARGIN_X = 60;
const BAR_MARGIN_Y = 30;
const BAR_GAP = 24;

type BarDef = {
  label: string;
  value: number;
  maxValue: number;
  color: string;
  sublabel: string;
};

function drawScene(
  ctx: CanvasRenderingContext2D,
  dpr: number,
  beta: number,
) {
  const g = gamma(beta);
  const dt = g * DELTA_TAU_0;   // lab time
  const dtau = DELTA_TAU_0;     // proper time — invariant
  const gammaVal = g;

  // Max reference heights: dt can reach γ·Δτ₀ at β → MAX_BETA
  const gMax = gamma(MAX_BETA);
  const dtMax = gMax * DELTA_TAU_0;
  const gammaMax = gMax;
  const dtauMax = DELTA_TAU_0 * 1.05; // a little padding so bar doesn't touch ceiling

  const bars: BarDef[] = [
    {
      label: "Δt",
      value: dt,
      maxValue: dtMax,
      color: "#67E8F9",  // cyan — lab/stationary frame convention
      sublabel: `= γ · Δτ  = ${dt.toFixed(2)}`,
    },
    {
      label: "γ",
      value: gammaVal,
      maxValue: gammaMax,
      color: "#FFD66B",  // amber — a distinct modifier
      sublabel: `= ${gammaVal.toFixed(3)}`,
    },
    {
      label: "Δτ",
      value: dtau,
      maxValue: dtauMax,
      color: "#A78BFA",  // violet — invariant, stands out
      sublabel: `= ${dtau.toFixed(2)}  (INVARIANT)`,
    },
  ];

  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, CANVAS_W, CANVAS_H);

  // Background
  ctx.fillStyle = "rgba(0,0,0,0)";
  ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

  const plotW = CANVAS_W - 2 * BAR_MARGIN_X;
  const plotH = CANVAS_H - BAR_MARGIN_Y - 40; // leave bottom room for labels
  const barCount = bars.length;
  const totalGap = BAR_GAP * (barCount + 1);
  const barW = (plotW - totalGap) / barCount;

  const baseY = BAR_MARGIN_Y + plotH;

  // Faint horizontal grid lines
  ctx.strokeStyle = "rgba(255,255,255,0.07)";
  ctx.lineWidth = 1;
  for (let i = 1; i <= 4; i++) {
    const y = baseY - (i / 4) * plotH;
    ctx.beginPath();
    ctx.moveTo(BAR_MARGIN_X, y);
    ctx.lineTo(BAR_MARGIN_X + plotW, y);
    ctx.stroke();
  }

  // Baseline
  ctx.strokeStyle = "rgba(255,255,255,0.3)";
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(BAR_MARGIN_X, baseY);
  ctx.lineTo(BAR_MARGIN_X + plotW, baseY);
  ctx.stroke();

  bars.forEach((bar, i) => {
    const x = BAR_MARGIN_X + BAR_GAP + i * (barW + BAR_GAP);
    const fraction = Math.min(bar.value / bar.maxValue, 1);
    const barH = fraction * plotH;
    const y = baseY - barH;

    // Bar fill (with light gradient)
    const grad = ctx.createLinearGradient(x, y, x, baseY);
    grad.addColorStop(0, bar.color);
    grad.addColorStop(1, bar.color + "55");
    ctx.fillStyle = grad;
    ctx.fillRect(x, y, barW, barH);

    // Bar border
    ctx.strokeStyle = bar.color;
    ctx.lineWidth = 1.5;
    ctx.strokeRect(x, y, barW, barH);

    // Value label on top
    ctx.fillStyle = bar.color;
    ctx.font = `bold 11px ui-monospace, monospace`;
    ctx.textAlign = "center";
    ctx.fillText(bar.value.toFixed(2), x + barW / 2, y - 5);

    // Bar label (large, at bottom)
    ctx.fillStyle = "rgba(255,255,255,0.85)";
    ctx.font = `bold 14px ui-monospace, monospace`;
    ctx.textAlign = "center";
    ctx.fillText(bar.label, x + barW / 2, baseY + 18);

    // Sub-label (small, below bar label)
    ctx.fillStyle = "rgba(255,255,255,0.45)";
    ctx.font = `10px ui-monospace, monospace`;
    ctx.textAlign = "center";
    ctx.fillText(bar.sublabel, x + barW / 2, baseY + 30);
  });

  // Title note on top-right
  ctx.fillStyle = "rgba(255,255,255,0.35)";
  ctx.font = "10px ui-monospace, monospace";
  ctx.textAlign = "right";
  ctx.fillText("Δτ₀ = 3 (rest-frame proper time)", CANVAS_W - BAR_MARGIN_X, BAR_MARGIN_Y - 12);
}

export function ProperTimeBarScene() {
  const [beta, setBeta] = useState(0.0);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const g = gamma(beta);
  const dt = g * DELTA_TAU_0;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const dpr = typeof window !== "undefined" ? (window.devicePixelRatio || 1) : 1;
    canvas.width = CANVAS_W * dpr;
    canvas.height = CANVAS_H * dpr;
    canvas.style.width = `${CANVAS_W}px`;
    canvas.style.height = `${CANVAS_H}px`;
    drawScene(ctx, dpr, beta);
  }, [beta]);

  return (
    <div className="flex flex-col items-center gap-3 p-4">
      <canvas
        ref={canvasRef}
        className="rounded-md border border-white/10 bg-black/40"
      />

      {/* β slider */}
      <label className="flex w-full max-w-[520px] items-center gap-3 font-mono text-xs text-white/70">
        <span>β = {beta.toFixed(2)}</span>
        <input
          type="range"
          min={0}
          max={MAX_BETA}
          step={0.01}
          value={beta}
          onChange={(e) => setBeta(parseFloat(e.target.value))}
          className="flex-1"
        />
        <span>γ = {g.toFixed(3)}</span>
      </label>

      {/* HUD row */}
      <div className="grid w-full max-w-[520px] grid-cols-3 gap-x-4 font-mono text-xs text-white/70">
        <div className="text-center">
          <span className="text-cyan-300">Δt = {dt.toFixed(3)}</span>
          <br />
          <span className="text-white/40">lab time</span>
        </div>
        <div className="text-center">
          <span className="text-amber-300">γ = {g.toFixed(4)}</span>
          <br />
          <span className="text-white/40">Lorentz factor</span>
        </div>
        <div className="text-center">
          <span className="text-violet-300">Δτ = {DELTA_TAU_0.toFixed(3)}</span>
          <br />
          <span className="text-white/40">proper time ✓ invariant</span>
        </div>
      </div>

      <p className="font-mono text-[11px] text-white/40">
        Δτ is the Lorentz scalar — the same number in every frame.
        Δt = γ·Δτ grows without bound as β → 1.
      </p>
    </div>
  );
}
