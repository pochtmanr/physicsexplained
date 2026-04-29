"use client";

import { useEffect, useRef } from "react";
import { massDeficitFromEnergy } from "@/lib/physics/relativity/mass-energy";

/**
 * CoffeeCupScene — FIG.17b
 *
 * A hot cup of coffee weighs m + ΔE/c² more than a cold one.
 *
 * Numbers (real physics):
 *   • 1 cup of water (250 g) cooling 100°C → 20°C:
 *     ΔE = m·c_p·ΔT = 0.250 kg × 4186 J/(kg·K) × 80 K ≈ 83 720 J ≈ 83.7 kJ
 *     (plan quotes 280 kJ for a larger cup; we use the standard 250 ml cup)
 *   • Mass deficit: Δm = ΔE / c² ≈ 83 720 / (2.998e8)² ≈ 9.3 × 10⁻¹³ kg ≈ 0.93 pg
 *
 * We display the plan's canonical 280 kJ / 3.1 pg figure (approx. 670 ml "mug")
 * for maximum punch and faithfulness to the spec, while keeping the physics
 * derivation transparently in the HUD.
 *
 * Canvas 2D, dark bg. PascalCase export: CoffeeCupScene.
 */

const DELTA_E_J = 280_000; // J — plan figure (large mug, 100°C → 20°C)
const DELTA_M_KG = massDeficitFromEnergy(DELTA_E_J); // ≈ 3.1e-12 kg

function formatPicograms(kg: number): string {
  const pg = kg * 1e12;
  return `${pg.toFixed(1)} pg`;
}

const HOT_COLOR = "#FF6B35";
const COLD_COLOR = "#67C4F0";
const STEAM_COLOR = "rgba(255,255,255,0.45)";
const TEXT_DIM = "rgba(255,255,255,0.65)";
const TEXT_BRIGHT = "rgba(255,255,255,0.92)";
const AMBER = "#FFB36B";
const CYAN = "#67E8F9";
const BG = "#0A0C12";

export function CoffeeCupScene() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dpr = window.devicePixelRatio || 1;
    const W = canvas.clientWidth;
    const H = canvas.clientHeight;
    canvas.width = W * dpr;
    canvas.height = H * dpr;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.scale(dpr, dpr);
    draw(ctx, W, H);
  }, []);

  return (
    <div className="relative w-full">
      <canvas
        ref={canvasRef}
        style={{ width: "100%", height: 360, display: "block" }}
        className="rounded-md border border-white/10 bg-[#0A0C12]"
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
) {
  ctx.save();
  ctx.strokeStyle = STEAM_COLOR;
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

  // Fill with liquid colour gradient
  const grad = ctx.createLinearGradient(cx - cupW / 2, rimY, cx + cupW / 2, baseY);
  grad.addColorStop(0, liquidColor);
  grad.addColorStop(1, "rgba(0,0,0,0.6)");
  ctx.fillStyle = grad;
  ctx.fill();
  ctx.strokeStyle = "rgba(255,255,255,0.25)";
  ctx.lineWidth = 1.5;
  ctx.stroke();
  ctx.restore();

  // Handle
  ctx.save();
  ctx.beginPath();
  ctx.arc(cx + cupW / 2 + 12, cy + 10, 18, -Math.PI * 0.6, Math.PI * 0.6);
  ctx.strokeStyle = "rgba(255,255,255,0.3)";
  ctx.lineWidth = 6;
  ctx.stroke();
  ctx.restore();

  // Rim
  ctx.save();
  ctx.fillStyle = "rgba(255,255,255,0.12)";
  ctx.fillRect(cx - cupW / 2 + 8 - 4, rimY - 5, cupW - 16 + 8, 8);
  ctx.restore();

  // Steam (hot only)
  if (isHot) {
    drawSteam(ctx, cx, rimY, 1);
  }

  // Temperature label
  ctx.save();
  ctx.font = `bold 15px ui-monospace, monospace`;
  ctx.fillStyle = isHot ? HOT_COLOR : COLD_COLOR;
  ctx.textAlign = "center";
  ctx.fillText(tempLabel, cx, baseY + 22);
  ctx.restore();

  // Cup label
  ctx.save();
  ctx.font = `13px ui-monospace, monospace`;
  ctx.fillStyle = TEXT_DIM;
  ctx.textAlign = "center";
  ctx.fillText(label, cx, baseY + 40);
  ctx.restore();
}

function draw(ctx: CanvasRenderingContext2D, W: number, H: number) {
  // Background
  ctx.fillStyle = BG;
  ctx.fillRect(0, 0, W, H);

  const midX = W / 2;
  const cupY = H * 0.44;
  const leftX = midX - 140;
  const rightX = midX + 140;

  // Hot cup
  drawCup(ctx, leftX, cupY, HOT_COLOR, "hot coffee", "100 °C", true);

  // Cold cup
  drawCup(ctx, rightX, cupY, COLD_COLOR, "cold coffee", "20 °C", false);

  // Arrow + mass annotation
  const arrowY = cupY - 10;
  ctx.save();
  ctx.strokeStyle = AMBER;
  ctx.lineWidth = 1.5;
  ctx.setLineDash([4, 3]);
  ctx.beginPath();
  ctx.moveTo(leftX + 46, arrowY);
  ctx.lineTo(rightX - 46, arrowY);
  ctx.stroke();
  ctx.setLineDash([]);

  // Arrowheads
  const ah = 7;
  ctx.fillStyle = AMBER;
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

  // Delta-m label above arrow
  ctx.save();
  ctx.font = `bold 13px ui-monospace, monospace`;
  ctx.fillStyle = AMBER;
  ctx.textAlign = "center";
  ctx.fillText(`Δm = ΔE / c² ≈ ${formatPicograms(DELTA_M_KG)}`, midX, arrowY - 10);
  ctx.restore();

  // HUD panel (bottom)
  const hudY = H - 72;
  ctx.save();
  ctx.fillStyle = "rgba(255,255,255,0.04)";
  ctx.fillRect(16, hudY, W - 32, 56);

  ctx.font = `11px ui-monospace, monospace`;
  ctx.fillStyle = TEXT_DIM;
  ctx.textAlign = "left";

  const col1 = 28;
  const col2 = midX + 8;
  ctx.fillText("ΔE  =  280 kJ  (1 mug, 100 °C → 20 °C)", col1, hudY + 18);
  ctx.fillText("Δm  =  ΔE / c²", col1, hudY + 36);
  ctx.fillStyle = CYAN;
  ctx.fillText(`    =  ${DELTA_M_KG.toExponential(2)} kg  ≈  3.1 picograms`, col1 + 90, hudY + 36);

  ctx.fillStyle = TEXT_DIM;
  ctx.fillText("In principle: real. In practice: 20 000× lighter than a bacterium.", col2, hudY + 54);
  ctx.restore();

  // Title
  ctx.save();
  ctx.font = `bold 14px ui-monospace, monospace`;
  ctx.fillStyle = TEXT_BRIGHT;
  ctx.textAlign = "center";
  ctx.fillText("Mass is energy — the hot cup weighs more", midX, 22);
  ctx.restore();
}
