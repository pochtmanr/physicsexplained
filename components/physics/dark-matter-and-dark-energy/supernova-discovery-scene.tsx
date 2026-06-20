"use client";

import { useEffect, useRef, useState } from "react";
import {
  FONT_HUD_SMALL,
  SCENE_CANVAS_CLASS,
  SCENE_HEIGHT_DEFAULT,
  applyDpr,
  drawSectionTitle,
  hexToRgba,
  useSceneSize,
  useSceneTokens,
  type SceneTokens,
} from "@/components/physics/_shared/scene-tokens";
import {
  distanceModulusResidual,
  COSMOLOGIES,
} from "@/lib/physics/relativity/dark-matter-and-dark-energy";
import { Button } from "@/components/ui/button";

/**
 * FIG.58c — The 1998 discovery plot.
 *
 * Type Ia supernova distance-modulus residual Δμ versus redshift z, measured
 * against an empty/coasting reference universe (the horizontal zero line).
 * Three model curves are drawn:
 *   - decelerating, matter-only Ω_m = 1 (CYAN) — dips below zero,
 *   - accelerating concordance Ω_m = 0.3, Ω_Λ = 0.7 (MAGENTA) — rises above,
 *   - the empty/coasting reference (AMBER zero line).
 * A toggle drops in a scatter of mock high-z supernovae with error bars; they
 * sit on the accelerating curve, faint and far, the way the High-z and Supernova
 * Cosmology Project teams found in 1998. The reader sees which model the data
 * picks out.
 */

const PAD = 42;
const Z_MAX = 1.3;

// Mock 1998-style supernova data: {z, residual-ish offset, sigma}. Scattered
// around the accelerating model so the discriminating power is visible.
const SN_DATA: { z: number; dmu: number; sig: number }[] = [
  { z: 0.10, dmu: 0.02, sig: 0.18 },
  { z: 0.17, dmu: 0.11, sig: 0.18 },
  { z: 0.26, dmu: 0.07, sig: 0.2 },
  { z: 0.36, dmu: 0.21, sig: 0.22 },
  { z: 0.43, dmu: 0.16, sig: 0.22 },
  { z: 0.50, dmu: 0.28, sig: 0.24 },
  { z: 0.58, dmu: 0.22, sig: 0.26 },
  { z: 0.62, dmu: 0.34, sig: 0.26 },
  { z: 0.70, dmu: 0.27, sig: 0.28 },
  { z: 0.79, dmu: 0.41, sig: 0.3 },
  { z: 0.86, dmu: 0.33, sig: 0.32 },
  { z: 0.97, dmu: 0.46, sig: 0.34 },
];

function sampleResidual(
  model: typeof COSMOLOGIES.accelerating,
  n: number,
): { z: number; d: number }[] {
  const out: { z: number; d: number }[] = [];
  for (let i = 1; i <= n; i++) {
    const z = (i / n) * Z_MAX;
    out.push({ z, d: distanceModulusResidual(z, model) });
  }
  return out;
}

export function SupernovaDiscoveryScene() {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const tokens = useSceneTokens();
  const [showData, setShowData] = useState(true);
  const { width, height } = useSceneSize(containerRef, {
    ratio: 0.58,
    maxHeight: SCENE_HEIGHT_DEFAULT,
    minHeight: 320,
  });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = applyDpr(canvas, width, height);
    if (!ctx) return;
    draw(ctx, tokens, showData, width, height);
  }, [tokens, showData, width, height]);

  return (
    <div ref={containerRef} className="relative w-full pb-4">
      <canvas
        ref={canvasRef}
        style={{ width, height, display: "block" }}
        className={SCENE_CANVAS_CLASS}
        aria-label="Type Ia supernova distance-modulus residual versus redshift, with decelerating, coasting, and accelerating model curves and a scatter of 1998-style data points."
      />
      <div className="mt-3 flex flex-wrap items-center gap-x-6 gap-y-1 font-mono text-xs text-[var(--color-fg-3)]">
        <Button size="sm" active={showData} onClick={() => setShowData((s) => !s)}>
          {showData ? "hide 1998 supernovae" : "show 1998 supernovae"}
        </Button>
        <span className="text-[var(--color-fg-3)]">
          higher Δμ = fainter, farther → accelerating expansion
        </span>
      </div>
    </div>
  );
}

function draw(
  ctx: CanvasRenderingContext2D,
  tokens: SceneTokens,
  showData: boolean,
  W: number,
  H: number,
) {
  ctx.fillStyle = tokens.bg;
  ctx.fillRect(0, 0, W, H);

  const plotX0 = PAD + 6;
  const plotX1 = W - PAD * 0.5;
  const plotY0 = PAD * 0.6;
  const plotY1 = H - PAD;
  const plotW = plotX1 - plotX0;
  const plotH = plotY1 - plotY0;

  const dMin = -0.5;
  const dMax = 0.7;
  const xOf = (z: number) => plotX0 + (z / Z_MAX) * plotW;
  const yOf = (d: number) => plotY1 - ((d - dMin) / (dMax - dMin)) * plotH;

  drawSectionTitle(ctx, plotX0, plotY0 - 16, "SN Ia RESIDUAL Δμ", tokens.textMute);

  // grid
  ctx.strokeStyle = tokens.grid;
  ctx.lineWidth = 1;
  for (let d = dMin; d <= dMax + 1e-9; d += 0.2) {
    const y = yOf(d);
    ctx.beginPath();
    ctx.moveTo(plotX0, y);
    ctx.lineTo(plotX1, y);
    ctx.stroke();
    ctx.fillStyle = tokens.textFaint;
    ctx.font = FONT_HUD_SMALL;
    ctx.textAlign = "right";
    ctx.textBaseline = "middle";
    ctx.fillText(d.toFixed(1), plotX0 - 6, y);
  }
  for (let z = 0; z <= Z_MAX + 1e-9; z += 0.2) {
    const x = xOf(z);
    ctx.strokeStyle = tokens.grid;
    ctx.beginPath();
    ctx.moveTo(x, plotY0);
    ctx.lineTo(x, plotY1);
    ctx.stroke();
    ctx.fillStyle = tokens.textFaint;
    ctx.textAlign = "center";
    ctx.textBaseline = "top";
    ctx.fillText(z.toFixed(1), x, plotY1 + 4);
  }

  // axes
  ctx.strokeStyle = tokens.axes;
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.moveTo(plotX0, plotY0);
  ctx.lineTo(plotX0, plotY1);
  ctx.lineTo(plotX1, plotY1);
  ctx.stroke();
  ctx.fillStyle = tokens.textMute;
  ctx.font = FONT_HUD_SMALL;
  ctx.textAlign = "center";
  ctx.textBaseline = "top";
  ctx.fillText("redshift  z", (plotX0 + plotX1) / 2, plotY1 + 18);

  // ── empty / coasting reference (AMBER zero line) ────────────────────────
  ctx.strokeStyle = tokens.amber;
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  ctx.moveTo(plotX0, yOf(0));
  ctx.lineTo(plotX1, yOf(0));
  ctx.stroke();

  // ── decelerating Ω_m = 1 (CYAN) ─────────────────────────────────────────
  const drawCurve = (
    model: typeof COSMOLOGIES.accelerating,
    color: string,
    lw: number,
  ) => {
    ctx.strokeStyle = color;
    ctx.lineWidth = lw;
    ctx.beginPath();
    sampleResidual(model, 160).forEach((p, i) => {
      const x = xOf(p.z);
      const y = yOf(p.d);
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.stroke();
  };
  drawCurve(COSMOLOGIES.decelerating, tokens.cyan, 2);
  drawCurve(COSMOLOGIES.accelerating, tokens.magenta, 2.6);

  // ── supernova data scatter ──────────────────────────────────────────────
  if (showData) {
    for (const sn of SN_DATA) {
      const x = xOf(sn.z);
      const y = yOf(sn.dmu);
      // error bar
      ctx.strokeStyle = hexToRgba(tokens.textDim, 0.55);
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(x, yOf(sn.dmu - sn.sig));
      ctx.lineTo(x, yOf(sn.dmu + sn.sig));
      ctx.stroke();
      // point
      ctx.fillStyle = tokens.textBright;
      ctx.beginPath();
      ctx.arc(x, y, 2.8, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // ── legend ──────────────────────────────────────────────────────────────
  const legX = plotX0 + 8;
  let legY = plotY0 + 6;
  const legend: [string, string][] = [
    ["accelerating  Ω_Λ=0.7", tokens.magenta],
    ["decelerating  Ω_m=1", tokens.cyan],
    ["empty / coasting", tokens.amber],
  ];
  ctx.font = FONT_HUD_SMALL;
  ctx.textAlign = "left";
  ctx.textBaseline = "middle";
  for (const [label, color] of legend) {
    ctx.strokeStyle = color;
    ctx.lineWidth = 2.4;
    ctx.beginPath();
    ctx.moveTo(legX, legY);
    ctx.lineTo(legX + 18, legY);
    ctx.stroke();
    ctx.fillStyle = tokens.textDim;
    ctx.fillText(label, legX + 24, legY);
    legY += 15;
  }
}
