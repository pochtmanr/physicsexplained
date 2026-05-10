"use client";

import { useEffect, useRef, useState } from "react";
import { SPEED_OF_LIGHT } from "@/lib/physics/constants";
import { gamma } from "@/lib/physics/relativity/types";
import { lorentzTransform } from "@/lib/physics/relativity/lorentz";
import { galileanBoost } from "@/lib/physics/relativity/galilean";
import {
  SCENE_CANVAS_CLASS,
  SCENE_HEIGHT_DEFAULT,
  applyDpr,
  useSceneSize,
  useSceneTokens,
  type SceneTokens,
} from "@/components/physics/_shared/scene-tokens";

/**
 * FIG.08a — Galilean vs Lorentz coordinate transforms, side-by-side.
 */

const PAD = 36;

const T_RANGE: [number, number] = [-2, 2];
const X_RANGE: [number, number] = [-2, 2];

const RECT: Array<{ t: number; x: number }> = [
  { t: 0.5, x: -1.0 },
  { t: 0.5, x: -0.4 },
  { t: 0.5, x: 0.4 },
  { t: 0.5, x: 1.0 },
  { t: 1.5, x: 1.0 },
  { t: 1.5, x: 0.4 },
  { t: 1.5, x: -0.4 },
  { t: 1.5, x: -1.0 },
];

export function GalileanVsLorentzScene() {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const tokens = useSceneTokens();
  const [beta, setBeta] = useState(0.5);

  const { width: W, height: H } = useSceneSize(containerRef, {
    ratio: 0.5,
    maxHeight: SCENE_HEIGHT_DEFAULT,
    minHeight: 280,
  });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = applyDpr(canvas, W, H);
    if (!ctx) return;
    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = tokens.bg;
    ctx.fillRect(0, 0, W, H);

    const panelW = (W - 3 * PAD) / 2;
    const panelH = H - 2 * PAD;

    drawPanel(
      ctx,
      tokens,
      PAD,
      PAD,
      panelW,
      panelH,
      "GALILEAN  t'=t,  x'=x−v t",
      tokens.amber,
      (t, x) => galileanBoost(t, x, beta),
    );

    drawPanel(
      ctx,
      tokens,
      PAD * 2 + panelW,
      PAD,
      panelW,
      panelH,
      "LORENTZ   t'=γ(t−βx/c),  x'=γ(x−βct)",
      tokens.magenta,
      (t, x) => {
        const c = SPEED_OF_LIGHT;
        const xMetres = x * c;
        const { t: tP, x: xPm } = lorentzTransform(t, xMetres, beta);
        return { t: tP, x: xPm / c };
      },
    );

    const g = gamma(beta);
    ctx.fillStyle = tokens.textDim;
    ctx.font = "12px ui-monospace, monospace";
    ctx.fillText(`β = ${beta.toFixed(2)}    γ = ${g.toFixed(3)}`, PAD, H - 8);
  }, [beta, tokens, W, H]);

  return (
    <div ref={containerRef} className="flex w-full flex-col items-center gap-3 pb-4">
      <canvas
        ref={canvasRef}
        style={{ width: W, height: H, display: "block" }}
        className={SCENE_CANVAS_CLASS}
      />
      <label className="flex w-full max-w-[640px] items-center gap-3 font-mono text-xs text-[var(--color-fg-2)]">
        <span className="w-24">β = {beta.toFixed(2)}</span>
        <input
          type="range"
          min={0}
          max={0.95}
          step={0.01}
          value={beta}
          onChange={(e) => setBeta(parseFloat(e.target.value))}
          className="flex-1"
          style={{ accentColor: "var(--color-magenta)" }}
        />
      </label>
    </div>
  );
}

function drawPanel(
  ctx: CanvasRenderingContext2D,
  tokens: SceneTokens,
  x0: number,
  y0: number,
  w: number,
  h: number,
  title: string,
  primedColor: string,
  transform: (t: number, x: number) => { t: number; x: number },
) {
  ctx.save();
  ctx.strokeStyle = tokens.panelBorder;
  ctx.lineWidth = 1;
  ctx.strokeRect(x0, y0, w, h);

  ctx.fillStyle = tokens.textMute;
  ctx.font = "11px ui-monospace, monospace";
  ctx.fillText(title, x0 + 8, y0 + 14);

  const padX = 22;
  const padY = 24;
  const plotX = x0 + padX;
  const plotY = y0 + padY + 8;
  const plotW = w - 2 * padX;
  const plotH = h - 2 * padY - 8;

  const [tMin, tMax] = T_RANGE;
  const [xMin, xMax] = X_RANGE;
  const xToPx = (xv: number) => plotX + ((xv - xMin) / (xMax - xMin)) * plotW;
  const tToPy = (tv: number) => plotY + plotH - ((tv - tMin) / (tMax - tMin)) * plotH;

  ctx.strokeStyle = tokens.grid;
  for (let xv = Math.ceil(xMin); xv <= Math.floor(xMax); xv++) {
    ctx.beginPath();
    ctx.moveTo(xToPx(xv), plotY);
    ctx.lineTo(xToPx(xv), plotY + plotH);
    ctx.stroke();
  }
  for (let tv = Math.ceil(tMin); tv <= Math.floor(tMax); tv++) {
    ctx.beginPath();
    ctx.moveTo(plotX, tToPy(tv));
    ctx.lineTo(plotX + plotW, tToPy(tv));
    ctx.stroke();
  }

  ctx.strokeStyle = tokens.axes;
  ctx.lineWidth = 1.25;
  ctx.beginPath();
  ctx.moveTo(xToPx(0), plotY);
  ctx.lineTo(xToPx(0), plotY + plotH);
  ctx.moveTo(plotX, tToPy(0));
  ctx.lineTo(plotX + plotW, tToPy(0));
  ctx.stroke();
  ctx.fillStyle = tokens.textDim;
  ctx.font = "10px ui-monospace, monospace";
  ctx.fillText("t", xToPx(0) + 4, plotY + 10);
  ctx.fillText("x", plotX + plotW - 8, tToPy(0) - 4);

  // Lab rectangle (cyan)
  ctx.strokeStyle = tokens.cyan;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  RECT.forEach((p, i) => {
    const px = xToPx(p.x);
    const py = tToPy(p.t);
    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  });
  ctx.closePath();
  ctx.stroke();
  ctx.fillStyle = tokens.cyan;
  for (const p of RECT) {
    ctx.beginPath();
    ctx.arc(xToPx(p.x), tToPy(p.t), 2.5, 0, Math.PI * 2);
    ctx.fill();
  }

  // Transformed rectangle
  ctx.strokeStyle = primedColor;
  ctx.lineWidth = 1.75;
  ctx.beginPath();
  RECT.forEach((p, i) => {
    const out = transform(p.t, p.x);
    const px = xToPx(out.x);
    const py = tToPy(out.t);
    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  });
  ctx.closePath();
  ctx.stroke();
  ctx.fillStyle = primedColor;
  for (const p of RECT) {
    const out = transform(p.t, p.x);
    ctx.beginPath();
    ctx.arc(xToPx(out.x), tToPy(out.t), 2.5, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.restore();
}
