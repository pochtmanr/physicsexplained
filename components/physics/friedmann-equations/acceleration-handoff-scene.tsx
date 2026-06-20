"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  FONT_HUD_SMALL,
  SCENE_CANVAS_CLASS,
  SCENE_HEIGHT_DEFAULT,
  applyDpr,
  drawSectionTitle,
  drawHudReadout,
  hexToRgba,
  useSceneSize,
  useSceneTokens,
  type SceneTokens,
} from "@/components/physics/_shared/scene-tokens";
import {
  reducedAcceleration,
  accelerationOnsetScale,
  scaleToRedshift,
  type CosmoParams,
} from "@/lib/physics/relativity/friedmann-equations";

/**
 * FIG.55c — The deceleration→acceleration handoff.
 *
 * Plots the reduced acceleration ä/(aH₀²) of the concordance model against the
 * scale factor a. Early on, matter (and a sliver of radiation) makes the term
 * negative — the expansion decelerates. As a grows the diluting matter loses to
 * the constant Λ term, the curve crosses zero, and the expansion turns to
 * acceleration. The zero crossing — the "cosmic jerk" — sits near a ≈ 0.6,
 * z ≈ 0.6. A slider sweeps Ω_Λ to show the crossing slide left (more Λ ⇒
 * earlier acceleration) or vanish entirely (Ω_Λ = 0 ⇒ perpetual deceleration).
 */

const PAD = 16;
const OMEGA_M = 0.31;
const OMEGA_R = 0.0001;

export function AccelerationHandoffScene() {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const tokens = useSceneTokens();
  const [omegaLambda, setOmegaLambda] = useState(0.69);

  const { width, height } = useSceneSize(containerRef, {
    ratio: 0.55,
    maxHeight: SCENE_HEIGHT_DEFAULT,
    minHeight: 320,
  });

  const params: CosmoParams = useMemo(
    () => ({ omegaM: OMEGA_M, omegaR: OMEGA_R, omegaLambda }),
    [omegaLambda],
  );
  const aOnset = accelerationOnsetScale(params);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = applyDpr(canvas, width, height);
    if (!ctx) return;
    draw(ctx, tokens, params, aOnset, width, height);
  }, [tokens, params, aOnset, width, height]);

  const onsetZ = Number.isNaN(aOnset) ? null : scaleToRedshift(aOnset);

  return (
    <div ref={containerRef} className="relative w-full pb-4">
      <canvas
        ref={canvasRef}
        style={{ width, height, display: "block" }}
        className={SCENE_CANVAS_CLASS}
        aria-label="Reduced acceleration of the universe versus scale factor. Negative early (decelerating matter era), crossing zero near a = 0.6 to become positive (Lambda-driven acceleration). A slider varies Omega_Lambda."
      />

      <div className="mt-3 flex items-center gap-3 font-mono text-xs text-[var(--color-fg-2)]">
        <span className="w-44 shrink-0">Ω_Λ = {omegaLambda.toFixed(2)}</span>
        <input
          type="range"
          min={0}
          max={1.2}
          step={0.01}
          value={omegaLambda}
          onChange={(e) => setOmegaLambda(parseFloat(e.target.value))}
          className="flex-1"
          style={{ accentColor: "var(--color-amber)" }}
        />
      </div>
      <div className="mt-1 font-mono text-xs text-[var(--color-fg-3)]">
        {onsetZ === null
          ? "no acceleration — expansion decelerates forever (Ω_Λ = 0)"
          : `acceleration begins at a ≈ ${aOnset.toFixed(2)} (z ≈ ${onsetZ.toFixed(2)})`}
      </div>
    </div>
  );
}

function draw(
  ctx: CanvasRenderingContext2D,
  tokens: SceneTokens,
  params: CosmoParams,
  aOnset: number,
  W: number,
  H: number,
) {
  ctx.fillStyle = tokens.bg;
  ctx.fillRect(0, 0, W, H);

  const plotX0 = PAD + 34;
  const plotY0 = PAD + 22;
  const plotX1 = W - PAD;
  const plotY1 = H - PAD - 18;
  const plotW = plotX1 - plotX0;
  const plotH = plotY1 - plotY0;

  drawSectionTitle(ctx, PAD, PAD - 2, "ä / (a H₀²)  vs  SCALE FACTOR", tokens.textMute);

  const A_MIN = 0.05;
  const A_MAX = 1.6;

  // y range — symmetric-ish around 0, sized to data
  const N = 200;
  const vals: number[] = [];
  for (let i = 0; i <= N; i++) {
    const a = A_MIN + (i / N) * (A_MAX - A_MIN);
    vals.push(reducedAcceleration(a, params));
  }
  const yMax = Math.max(1, ...vals.map((v) => Math.abs(v)));
  const yLo = -yMax * 1.05;
  const yHi = yMax * 1.05;

  const ax = (a: number) => plotX0 + ((a - A_MIN) / (A_MAX - A_MIN)) * plotW;
  const ay = (y: number) => plotY1 - ((y - yLo) / (yHi - yLo)) * plotH;

  // Grid
  ctx.strokeStyle = tokens.grid;
  ctx.lineWidth = 1;
  for (let i = 0; i <= 4; i++) {
    const x = plotX0 + (i / 4) * plotW;
    ctx.beginPath();
    ctx.moveTo(x, plotY0);
    ctx.lineTo(x, plotY1);
    ctx.stroke();
  }

  // Shade decelerating (below zero) vs accelerating (above zero) bands
  const yZero = ay(0);
  ctx.fillStyle = hexToRgba(tokens.red, 0.08);
  ctx.fillRect(plotX0, yZero, plotW, plotY1 - yZero);
  ctx.fillStyle = hexToRgba(tokens.cyan, 0.08);
  ctx.fillRect(plotX0, plotY0, plotW, yZero - plotY0);

  // Zero line (ä = 0)
  ctx.strokeStyle = tokens.axes;
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.moveTo(plotX0, yZero);
  ctx.lineTo(plotX1, yZero);
  ctx.stroke();

  // Axes box
  ctx.strokeStyle = tokens.axes;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(plotX0, plotY0);
  ctx.lineTo(plotX0, plotY1);
  ctx.lineTo(plotX1, plotY1);
  ctx.stroke();

  // Band labels
  ctx.font = FONT_HUD_SMALL;
  ctx.textAlign = "left";
  ctx.fillStyle = tokens.cyan;
  ctx.textBaseline = "top";
  ctx.fillText("ä > 0  accelerating", plotX0 + 6, plotY0 + 4);
  ctx.fillStyle = tokens.red;
  ctx.textBaseline = "bottom";
  ctx.fillText("ä < 0  decelerating", plotX0 + 6, plotY1 - 4);

  // x labels
  ctx.fillStyle = tokens.textMute;
  ctx.textAlign = "center";
  ctx.textBaseline = "top";
  for (let i = 0; i <= 4; i++) {
    const a = A_MIN + (i / 4) * (A_MAX - A_MIN);
    ctx.fillText(a.toFixed(2), plotX0 + (i / 4) * plotW, plotY1 + 4);
  }
  ctx.fillText("scale factor a  →", (plotX0 + plotX1) / 2, plotY1 + 16);

  // "today" line at a = 1
  ctx.strokeStyle = hexToRgba(tokens.textFaint, 0.9);
  ctx.setLineDash([4, 4]);
  ctx.beginPath();
  ctx.moveTo(ax(1), plotY0);
  ctx.lineTo(ax(1), plotY1);
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.fillStyle = tokens.textMute;
  ctx.textAlign = "center";
  ctx.textBaseline = "top";
  ctx.fillText("today", ax(1), plotY0 + 2);

  // The ä curve
  ctx.lineWidth = 2;
  ctx.beginPath();
  for (let i = 0; i <= N; i++) {
    const a = A_MIN + (i / N) * (A_MAX - A_MIN);
    const x = ax(a);
    const y = ay(vals[i]!);
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.strokeStyle = tokens.amber;
  ctx.stroke();

  // Onset marker
  if (!Number.isNaN(aOnset) && aOnset > A_MIN && aOnset < A_MAX) {
    const x = ax(aOnset);
    ctx.fillStyle = tokens.textBright;
    ctx.beginPath();
    ctx.arc(x, yZero, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = hexToRgba(tokens.textBright, 0.6);
    ctx.setLineDash([2, 3]);
    ctx.beginPath();
    ctx.moveTo(x, yZero);
    ctx.lineTo(x, plotY0);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = tokens.textBright;
    ctx.font = FONT_HUD_SMALL;
    ctx.textAlign = "center";
    ctx.textBaseline = "bottom";
    ctx.fillText("ä = 0", x, yZero - 8);
  }

  // HUD: q₀
  const q0 = params.omegaR + 0.5 * params.omegaM - params.omegaLambda;
  drawHudReadout(
    ctx,
    plotX1 - 116,
    plotY1 - 18,
    "q₀ = ",
    q0.toFixed(2),
    tokens.textDim,
    q0 < 0 ? tokens.cyan : tokens.red,
  );
}
