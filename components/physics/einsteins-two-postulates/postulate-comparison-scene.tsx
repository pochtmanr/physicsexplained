"use client";

import { useEffect, useRef, useState } from "react";
import {
  compareAtVariousV,
  type PostulateComparisonSample,
} from "@/lib/physics/relativity/postulates";
import {
  applyDpr,
  hexToRgba,
  SCENE_CANVAS_CLASS,
  SCENE_HEIGHT_DEFAULT,
  useSceneSize,
  useSceneTokens,
} from "@/components/physics/_shared/scene-tokens";

/**
 * FIG.04a — the two postulates as two graphs.
 *
 * X-axis: observer speed β = v/c, sampled in (-0.99, 0.99).
 * Y-axis: speed of light measured by that observer (in units of c).
 *
 *   • DASHED amber line  — Galilean prediction. Linear: 1 − β. Crashes through
 *     zero at β = 1, becomes "negative" past it. The world Newton lived in.
 *   • SOLID  cyan  line — Einstein's postulate, encoded literally as a
 *     constant function. Stays flat at 1 for every β. The world Maxwell's
 *     equations demand.
 *
 * The slider lets the user pick a single β and see both predicted speeds
 * side-by-side as numerical readouts. The two predictions agree only at
 * β = 0. Everywhere else they fork. THAT FORK is the rupture: special
 * relativity is the geometry forced by taking the cyan line at face value.
 */

const N_SAMPLES = 161;

function buildSamples(): PostulateComparisonSample[] {
  const betas: number[] = [];
  for (let i = 0; i < N_SAMPLES; i++) {
    betas.push(-0.999 + (1.998 * i) / (N_SAMPLES - 1));
  }
  // c = 1 — we plot in units of c, so all numbers are O(1).
  return compareAtVariousV(1, betas);
}

const SAMPLES = buildSamples();

export function PostulateComparisonScene() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const tokens = useSceneTokens();
  const { width, height } = useSceneSize(containerRef, {
    ratio: 0.55,
    maxHeight: SCENE_HEIGHT_DEFAULT,
  });
  const [beta, setBeta] = useState(0.6);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = applyDpr(canvas, width, height);
    if (!ctx) return;

    const W = width;
    const H = height;
    const PAD_L = 56;
    const PAD_R = 24;
    const PAD_T = 24;
    const PAD_B = 44;
    const plotW = W - PAD_L - PAD_R;
    const plotH = H - PAD_T - PAD_B;

    // β ∈ (-1, 1) → x in [PAD_L, PAD_L + plotW]
    const xOf = (b: number) => PAD_L + ((b + 1) / 2) * plotW;
    // y ∈ (-1.2, 1.6) shows c=1, lines crashing through zero, etc.
    const Y_MIN = -1.2;
    const Y_MAX = 1.6;
    const yOf = (y: number) => PAD_T + plotH - ((y - Y_MIN) / (Y_MAX - Y_MIN)) * plotH;

    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = tokens.bg;
    ctx.fillRect(0, 0, W, H);

    // axes + gridlines
    ctx.strokeStyle = tokens.panelBorder;
    ctx.lineWidth = 1;
    ctx.beginPath();
    // x-axis at y = 0
    ctx.moveTo(PAD_L, yOf(0));
    ctx.lineTo(PAD_L + plotW, yOf(0));
    // y-axis at β = 0
    ctx.moveTo(xOf(0), PAD_T);
    ctx.lineTo(xOf(0), PAD_T + plotH);
    ctx.stroke();

    // horizontal gridlines at y = 1 (the value of c) and y = -1
    ctx.strokeStyle = tokens.grid;
    ctx.beginPath();
    for (const y of [-1, 1]) {
      ctx.moveTo(PAD_L, yOf(y));
      ctx.lineTo(PAD_L + plotW, yOf(y));
    }
    ctx.stroke();

    // axis labels
    ctx.fillStyle = tokens.textMute;
    ctx.font = tokens.fontHudSmall;
    ctx.fillText("β = v/c", PAD_L + plotW - 50, yOf(0) + 18);
    ctx.fillText("measured speed (units of c)", PAD_L - 8, PAD_T - 8);
    ctx.fillText("0", xOf(0) - 8, yOf(0) + 14);
    ctx.fillText("1", xOf(0) - 18, yOf(1) + 4);
    ctx.fillText("-1", xOf(0) - 22, yOf(-1) + 4);
    ctx.fillText("β=−1", xOf(-1) - 14, PAD_T + plotH + 16);
    ctx.fillText("β=1", xOf(1) - 12, PAD_T + plotH + 16);

    // Galilean dashed line
    ctx.strokeStyle = tokens.amber;
    ctx.lineWidth = 1.6;
    ctx.setLineDash([6, 4]);
    ctx.beginPath();
    SAMPLES.forEach((s, i) => {
      const x = xOf(s.beta);
      const y = yOf(s.galilean);
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.stroke();
    ctx.setLineDash([]);

    // Einstein solid line
    ctx.strokeStyle = tokens.cyan;
    ctx.lineWidth = 2.2;
    ctx.beginPath();
    SAMPLES.forEach((s, i) => {
      if (Number.isNaN(s.einstein)) return;
      const x = xOf(s.beta);
      const y = yOf(s.einstein);
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.stroke();

    // Slider read-out: vertical line at β
    const xb = xOf(beta);
    ctx.strokeStyle = hexToRgba(tokens.textBright, 0.28);
    ctx.lineWidth = 1;
    ctx.setLineDash([2, 4]);
    ctx.beginPath();
    ctx.moveTo(xb, PAD_T);
    ctx.lineTo(xb, PAD_T + plotH);
    ctx.stroke();
    ctx.setLineDash([]);

    // Markers at the two predictions
    const galilean = 1 - beta;
    const einstein = 1;
    ctx.fillStyle = tokens.amber;
    ctx.beginPath();
    ctx.arc(xb, yOf(galilean), 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = tokens.cyan;
    ctx.beginPath();
    ctx.arc(xb, yOf(einstein), 4, 0, Math.PI * 2);
    ctx.fill();

    // Legend
    const legX = PAD_L + 12;
    const legY = PAD_T + 16;
    ctx.fillStyle = tokens.amber;
    ctx.fillRect(legX, legY - 6, 18, 2);
    ctx.fillStyle = tokens.textMute;
    ctx.fillText("Galilean: c − v", legX + 24, legY);
    ctx.fillStyle = tokens.cyan;
    ctx.fillRect(legX, legY + 10, 18, 3);
    ctx.fillStyle = tokens.textMute;
    ctx.fillText("Einstein: c (postulate 2)", legX + 24, legY + 16);
  }, [width, height, beta, tokens]);

  return (
    <div ref={containerRef} className="w-full max-w-[900px] mx-auto p-3">
      <canvas
        ref={canvasRef}
        style={{ width, height, display: "block" }}
        className={SCENE_CANVAS_CLASS}
      />
      <div className="mt-3 flex items-center gap-3">
        <label
          htmlFor="postulate-beta"
          className="font-mono text-xs text-[var(--color-fg-2)]"
        >
          β = {beta.toFixed(2)}
        </label>
        <input
          id="postulate-beta"
          type="range"
          min={-0.99}
          max={0.99}
          step={0.01}
          value={beta}
          onChange={(e) => setBeta(Number(e.target.value))}
          className="flex-1"
          style={{ accentColor: "var(--color-cyan)" }}
        />
      </div>
      <div className="mt-2 grid grid-cols-2 gap-3 font-mono text-xs">
        <div style={{ color: "var(--color-amber)" }}>
          Galilean predicts: {(1 - beta).toFixed(3)} c
        </div>
        <div style={{ color: "var(--color-cyan)" }}>
          Einstein predicts: 1.000 c
        </div>
      </div>
    </div>
  );
}
