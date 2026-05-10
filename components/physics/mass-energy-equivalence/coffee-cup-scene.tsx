"use client";

import { useEffect, useRef } from "react";
import { massDeficitFromEnergy } from "@/lib/physics/relativity/mass-energy";
import {
  applyDpr,
  hexToRgba,
  SCENE_CANVAS_CLASS,
  SCENE_HEIGHT_DEFAULT,
  useSceneSize,
  useSceneTokens,
  type SceneTokens,
} from "@/components/physics/_shared/scene-tokens";

/**
 * CoffeeCupScene — FIG.17b
 *
 * A hot cup of coffee weighs m + ΔE/c² more than a cold one.
 *
 * Numbers (real physics):
 *   • ΔE ≈ 280 kJ for a 1-mug cool-down.
 *   • Δm = ΔE / c² ≈ 3.1 × 10⁻¹² kg ≈ 3.1 pg.
 */

const DELTA_E_J = 280_000;
const DELTA_M_KG = massDeficitFromEnergy(DELTA_E_J);

function formatPicograms(kg: number): string {
  const pg = kg * 1e12;
  return `${pg.toFixed(1)} pg`;
}

export function CoffeeCupScene() {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const tokens = useSceneTokens();
  const { width, height } = useSceneSize(containerRef, {
    ratio: 0.55,
    maxHeight: SCENE_HEIGHT_DEFAULT,
  });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = applyDpr(canvas, width, height);
    if (!ctx) return;
    draw(ctx, tokens, width, height);
  }, [tokens, width, height]);

  return (
    <div ref={containerRef} className="w-full pb-4">
      <canvas
        ref={canvasRef}
        style={{ width, height, display: "block" }}
        className={SCENE_CANVAS_CLASS}
        aria-label="Two coffee cups side by side: hot (100°C) and cold (20°C). The hot cup is annotated as heavier by 3.1 picograms."
      />
    </div>
  );
}

function drawSteam(
  ctx: CanvasRenderingContext2D,
  cx: number,
  baseY: number,
  alpha: number,
  steamColor: string,
) {
  ctx.save();
  ctx.strokeStyle = steamColor;
  ctx.lineWidth = 2;
  ctx.globalAlpha = alpha;
  for (let i = -1; i <= 1; i++) {
    const x0 = cx + i * 12;
    ctx.beginPath();
    ctx.moveTo(x0, baseY);
    ctx.bezierCurveTo(x0 - 6, baseY - 18, x0 + 6, baseY - 36, x0, baseY - 54);
    ctx.stroke();
  }
  ctx.restore();
}

function drawCup(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  liquidColor: string,
  label: string,
  tempLabel: string,
  isHot: boolean,
  tokens: SceneTokens,
) {
  const cupW = 80;
  const cupH = 90;
  const rimY = cy - cupH / 2;
  const baseY = cy + cupH / 2;

  // Cup body (trapezoid)
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(cx - cupW / 2 + 8, rimY);
  ctx.lineTo(cx + cupW / 2 - 8, rimY);
  ctx.lineTo(cx + cupW / 2, baseY);
  ctx.lineTo(cx - cupW / 2, baseY);
  ctx.closePath();

  const grad = ctx.createLinearGradient(cx - cupW / 2, rimY, cx + cupW / 2, baseY);
  grad.addColorStop(0, liquidColor);
  grad.addColorStop(1, hexToRgba(tokens.bg, 0.6));
  ctx.fillStyle = grad;
  ctx.fill();
  ctx.strokeStyle = hexToRgba(tokens.textBright, 0.25);
  ctx.lineWidth = 1.5;
  ctx.stroke();
  ctx.restore();

  // Handle
  ctx.save();
  ctx.beginPath();
  ctx.arc(cx + cupW / 2 + 12, cy + 10, 18, -Math.PI * 0.6, Math.PI * 0.6);
  ctx.strokeStyle = hexToRgba(tokens.textBright, 0.3);
  ctx.lineWidth = 6;
  ctx.stroke();
  ctx.restore();

  // Rim
  ctx.save();
  ctx.fillStyle = hexToRgba(tokens.textBright, 0.12);
  ctx.fillRect(cx - cupW / 2 + 8 - 4, rimY - 5, cupW - 16 + 8, 8);
  ctx.restore();

  // Steam (hot only)
  if (isHot) {
    drawSteam(ctx, cx, rimY, 1, hexToRgba(tokens.textBright, 0.45));
  }

  // Temperature label
  ctx.save();
  ctx.font = `bold 15px ui-monospace, monospace`;
  ctx.fillStyle = isHot ? tokens.orange : tokens.blue;
  ctx.textAlign = "center";
  ctx.fillText(tempLabel, cx, baseY + 22);
  ctx.restore();

  // Cup label
  ctx.save();
  ctx.font = `13px ui-monospace, monospace`;
  ctx.fillStyle = tokens.textDim;
  ctx.textAlign = "center";
  ctx.fillText(label, cx, baseY + 40);
  ctx.restore();
}

function draw(
  ctx: CanvasRenderingContext2D,
  tokens: SceneTokens,
  W: number,
  H: number,
) {
  ctx.fillStyle = tokens.bg;
  ctx.fillRect(0, 0, W, H);

  const midX = W / 2;
  const cupY = H * 0.44;
  const leftX = midX - 140;
  const rightX = midX + 140;

  drawCup(ctx, leftX, cupY, tokens.orange, "hot coffee", "100 °C", true, tokens);
  drawCup(ctx, rightX, cupY, tokens.blue, "cold coffee", "20 °C", false, tokens);

  // Arrow + mass annotation
  const arrowY = cupY - 10;
  ctx.save();
  ctx.strokeStyle = tokens.amber;
  ctx.lineWidth = 1.5;
  ctx.setLineDash([4, 3]);
  ctx.beginPath();
  ctx.moveTo(leftX + 46, arrowY);
  ctx.lineTo(rightX - 46, arrowY);
  ctx.stroke();
  ctx.setLineDash([]);

  const ah = 7;
  ctx.fillStyle = tokens.amber;
  ctx.beginPath();
  ctx.moveTo(leftX + 46, arrowY - ah / 2);
  ctx.lineTo(leftX + 46 - ah, arrowY);
  ctx.lineTo(leftX + 46, arrowY + ah / 2);
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(rightX - 46, arrowY - ah / 2);
  ctx.lineTo(rightX - 46 + ah, arrowY);
  ctx.lineTo(rightX - 46, arrowY + ah / 2);
  ctx.fill();
  ctx.restore();

  ctx.save();
  ctx.font = `bold 13px ui-monospace, monospace`;
  ctx.fillStyle = tokens.amber;
  ctx.textAlign = "center";
  ctx.fillText(`Δm = ΔE / c² ≈ ${formatPicograms(DELTA_M_KG)}`, midX, arrowY - 10);
  ctx.restore();

  // HUD
  const hudY = H - 72;
  ctx.save();
  ctx.fillStyle = hexToRgba(tokens.textBright, 0.04);
  ctx.fillRect(16, hudY, W - 32, 56);

  ctx.font = `11px ui-monospace, monospace`;
  ctx.fillStyle = tokens.textDim;
  ctx.textAlign = "left";

  const col1 = 28;
  const col2 = midX + 8;
  ctx.fillText("ΔE  =  280 kJ  (1 mug, 100 °C → 20 °C)", col1, hudY + 18);
  ctx.fillText("Δm  =  ΔE / c²", col1, hudY + 36);
  ctx.fillStyle = tokens.cyan;
  ctx.fillText(`    =  ${DELTA_M_KG.toExponential(2)} kg  ≈  3.1 picograms`, col1 + 90, hudY + 36);

  ctx.fillStyle = tokens.textDim;
  ctx.fillText("In principle: real. In practice: 20 000× lighter than a bacterium.", col2, hudY + 54);
  ctx.restore();

  // Title
  ctx.save();
  ctx.font = `bold 14px ui-monospace, monospace`;
  ctx.fillStyle = tokens.textBright;
  ctx.textAlign = "center";
  ctx.fillText("Mass is energy — the hot cup weighs more", midX, 22);
  ctx.restore();
}
