"use client";

import { useEffect, useRef, useState } from "react";
import { gamma } from "@/lib/physics/relativity/types";
import {
  SCENE_CANVAS_CLASS,
  applyDpr,
  hexToRgba,
  useSceneSize,
  useSceneTokens,
  type SceneTokens,
} from "@/components/physics/_shared/scene-tokens";

/**
 * FIG.12c — PROPER TIME BAR CHART.
 *
 * Three bars: Δt (lab time), γ (Lorentz factor), Δτ (proper time, invariant).
 * Drag β: Δt and γ stretch in lockstep; Δτ stays the same. Δτ is the only
 * Lorentz scalar of the three.
 */

const DELTA_TAU_0 = 3;
const MAX_BETA = 0.95;
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
  tokens: SceneTokens,
  W: number,
  H: number,
  beta: number,
) {
  const g = gamma(beta);
  const dt = g * DELTA_TAU_0;
  const dtau = DELTA_TAU_0;
  const gammaVal = g;

  const gMax = gamma(MAX_BETA);
  const dtMax = gMax * DELTA_TAU_0;
  const gammaMax = gMax;
  const dtauMax = DELTA_TAU_0 * 1.05;

  const bars: BarDef[] = [
    {
      label: "Δt",
      value: dt,
      maxValue: dtMax,
      color: tokens.cyan,
      sublabel: `= γ · Δτ  = ${dt.toFixed(2)}`,
    },
    {
      label: "γ",
      value: gammaVal,
      maxValue: gammaMax,
      color: tokens.amber,
      sublabel: `= ${gammaVal.toFixed(3)}`,
    },
    {
      label: "Δτ",
      value: dtau,
      maxValue: dtauMax,
      color: tokens.purple,
      sublabel: `= ${dtau.toFixed(2)}  (INVARIANT)`,
    },
  ];

  ctx.clearRect(0, 0, W, H);
  ctx.fillStyle = tokens.bg;
  ctx.fillRect(0, 0, W, H);

  const plotW = W - 2 * BAR_MARGIN_X;
  const plotH = H - BAR_MARGIN_Y - 40;
  const barCount = bars.length;
  const totalGap = BAR_GAP * (barCount + 1);
  const barW = (plotW - totalGap) / barCount;

  const baseY = BAR_MARGIN_Y + plotH;

  // Faint grid lines
  ctx.strokeStyle = tokens.grid;
  ctx.lineWidth = 1;
  for (let i = 1; i <= 4; i++) {
    const y = baseY - (i / 4) * plotH;
    ctx.beginPath();
    ctx.moveTo(BAR_MARGIN_X, y);
    ctx.lineTo(BAR_MARGIN_X + plotW, y);
    ctx.stroke();
  }

  // Baseline
  ctx.strokeStyle = tokens.axes;
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

    // Gradient fill
    const grad = ctx.createLinearGradient(x, y, x, baseY);
    grad.addColorStop(0, bar.color);
    grad.addColorStop(1, hexToRgba(bar.color, 0.33));
    ctx.fillStyle = grad;
    ctx.fillRect(x, y, barW, barH);

    ctx.strokeStyle = bar.color;
    ctx.lineWidth = 1.5;
    ctx.strokeRect(x, y, barW, barH);

    ctx.fillStyle = bar.color;
    ctx.font = `bold 11px ui-monospace, monospace`;
    ctx.textAlign = "center";
    ctx.fillText(bar.value.toFixed(2), x + barW / 2, y - 5);

    ctx.fillStyle = tokens.textBright;
    ctx.font = `bold 14px ui-monospace, monospace`;
    ctx.textAlign = "center";
    ctx.fillText(bar.label, x + barW / 2, baseY + 18);

    ctx.fillStyle = tokens.textMute;
    ctx.font = `10px ui-monospace, monospace`;
    ctx.textAlign = "center";
    ctx.fillText(bar.sublabel, x + barW / 2, baseY + 30);
  });

  ctx.fillStyle = tokens.textFaint;
  ctx.font = "10px ui-monospace, monospace";
  ctx.textAlign = "right";
  ctx.fillText("Δτ₀ = 3 (rest-frame proper time)", W - BAR_MARGIN_X, BAR_MARGIN_Y - 12);
}

export function ProperTimeBarScene() {
  const [beta, setBeta] = useState(0.0);
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const tokens = useSceneTokens();

  const { width: W, height: H } = useSceneSize(containerRef, {
    ratio: 0.55,
    maxHeight: 320,
    minHeight: 260,
  });

  const g = gamma(beta);
  const dt = g * DELTA_TAU_0;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = applyDpr(canvas, W, H);
    if (!ctx) return;
    drawScene(ctx, tokens, W, H, beta);
  }, [beta, tokens, W, H]);

  return (
    <div ref={containerRef} className="flex w-full flex-col items-center gap-3 pb-4">
      <canvas
        ref={canvasRef}
        style={{ width: W, height: H, display: "block" }}
        className={SCENE_CANVAS_CLASS}
      />

      <label className="flex w-full max-w-[520px] items-center gap-3 font-mono text-xs text-[var(--color-fg-2)]">
        <span>β = {beta.toFixed(2)}</span>
        <input
          type="range"
          min={0}
          max={MAX_BETA}
          step={0.01}
          value={beta}
          onChange={(e) => setBeta(parseFloat(e.target.value))}
          className="flex-1"
          style={{ accentColor: "var(--color-cyan)" }}
        />
        <span>γ = {g.toFixed(3)}</span>
      </label>

      <div className="grid w-full max-w-[520px] grid-cols-3 gap-x-4 font-mono text-xs text-[var(--color-fg-2)]">
        <div className="text-center">
          <span style={{ color: "var(--color-cyan)" }}>Δt = {dt.toFixed(3)}</span>
          <br />
          <span className="text-[var(--color-fg-3)]">lab time</span>
        </div>
        <div className="text-center">
          <span style={{ color: "var(--color-amber)" }}>γ = {g.toFixed(4)}</span>
          <br />
          <span className="text-[var(--color-fg-3)]">Lorentz factor</span>
        </div>
        <div className="text-center">
          <span style={{ color: "var(--color-purple)" }}>Δτ = {DELTA_TAU_0.toFixed(3)}</span>
          <br />
          <span className="text-[var(--color-fg-3)]">proper time ✓ invariant</span>
        </div>
      </div>

      <p className="font-mono text-[11px] text-[var(--color-fg-3)]">
        Δτ is the Lorentz scalar — the same number in every frame.
        Δt = γ·Δτ grows without bound as β → 1.
      </p>
    </div>
  );
}
