"use client";

import { useEffect, useRef } from "react";
import {
  COMPTON_WAVELENGTH,
  scatteredWavelength,
} from "@/lib/physics/relativity/compton";
import {
  applyDpr,
  hexToRgba,
  SCENE_CANVAS_CLASS,
  SCENE_HEIGHT_DEFAULT,
  useSceneSize,
  useSceneTokens,
} from "@/components/physics/_shared/scene-tokens";

/**
 * FIG.19c — The 1923 Compton data chart.
 *
 *   Cyan dashed: classical wave theory (no shift).
 *   Amber solid: Compton formula λ' = λ₀ + λ_C (1 − cos θ).
 *   White circles: synthetic data at 6 canonical angles.
 */

const LAMBDA_IN_M = 7.1e-11;
const LAMBDA_IN_PM = LAMBDA_IN_M * 1e12;

const DATA_POINTS: { thetaDeg: number; lambdaPm: number }[] = [
  { thetaDeg: 0, lambdaPm: LAMBDA_IN_PM + 0.04 },
  { thetaDeg: 30, lambdaPm: LAMBDA_IN_PM + 0.32 },
  { thetaDeg: 60, lambdaPm: LAMBDA_IN_PM + 1.26 },
  { thetaDeg: 90, lambdaPm: LAMBDA_IN_PM + 2.50 },
  { thetaDeg: 120, lambdaPm: LAMBDA_IN_PM + 3.70 },
  { thetaDeg: 135, lambdaPm: LAMBDA_IN_PM + 4.20 },
];

export function Compton1923DataScene() {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const tokens = useSceneTokens();
  const { width, height } = useSceneSize(containerRef, {
    ratio: 0.58,
    maxHeight: SCENE_HEIGHT_DEFAULT,
  });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = applyDpr(canvas, width, height);
    if (!ctx) return;

    ctx.clearRect(0, 0, width, height);
    ctx.fillStyle = tokens.bg;
    ctx.fillRect(0, 0, width, height);

    const ml = 58;
    const mr = 16;
    const mt = 28;
    const mb = 44;
    const chartW = width - ml - mr;
    const chartH = height - mt - mb;

    const thetaMin = 0;
    const thetaMax = 140;
    const lambdaMin = LAMBDA_IN_PM - 0.5;
    const lambdaMax = LAMBDA_IN_PM + 5.2;

    const mapX = (thetaDeg: number) =>
      ml + ((thetaDeg - thetaMin) / (thetaMax - thetaMin)) * chartW;
    const mapY = (lambdaPm: number) =>
      mt + chartH - ((lambdaPm - lambdaMin) / (lambdaMax - lambdaMin)) * chartH;

    // Background grid
    ctx.strokeStyle = tokens.grid;
    ctx.lineWidth = 0.6;
    ctx.setLineDash([2, 5]);
    for (let theta = 0; theta <= 135; theta += 30) {
      const x = mapX(theta);
      ctx.beginPath();
      ctx.moveTo(x, mt);
      ctx.lineTo(x, mt + chartH);
      ctx.stroke();
    }
    for (let lam = Math.ceil(lambdaMin); lam <= lambdaMax; lam += 1) {
      const y = mapY(lam);
      ctx.beginPath();
      ctx.moveTo(ml, y);
      ctx.lineTo(ml + chartW, y);
      ctx.stroke();
    }
    ctx.setLineDash([]);

    // Axes
    ctx.strokeStyle = tokens.axes;
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(ml, mt);
    ctx.lineTo(ml, mt + chartH);
    ctx.lineTo(ml + chartW, mt + chartH);
    ctx.stroke();

    // Tick labels
    ctx.fillStyle = tokens.axes;
    ctx.font = "10px monospace";
    ctx.textAlign = "center";
    for (let theta = 0; theta <= 135; theta += 30) {
      const x = mapX(theta);
      ctx.fillText(`${theta}°`, x, mt + chartH + 14);
    }
    ctx.fillText("Scattering angle θ", ml + chartW * 0.5, mt + chartH + 30);

    ctx.textAlign = "right";
    for (let lam = Math.ceil(lambdaMin); lam <= lambdaMax; lam += 1) {
      const y = mapY(lam);
      ctx.fillText(`${lam}`, ml - 6, y + 3.5);
    }

    ctx.save();
    ctx.translate(12, mt + chartH * 0.5);
    ctx.rotate(-Math.PI / 2);
    ctx.textAlign = "center";
    ctx.fillText("λ' (pm)", 0, 0);
    ctx.restore();

    // Classical
    ctx.strokeStyle = tokens.cyan;
    ctx.lineWidth = 1.5;
    ctx.setLineDash([6, 4]);
    ctx.beginPath();
    ctx.moveTo(mapX(thetaMin), mapY(LAMBDA_IN_PM));
    ctx.lineTo(mapX(thetaMax), mapY(LAMBDA_IN_PM));
    ctx.stroke();
    ctx.setLineDash([]);

    ctx.fillStyle = tokens.cyan;
    ctx.font = "9px monospace";
    ctx.textAlign = "left";
    ctx.fillText("Wave theory: λ' = λ₀ (no shift)", mapX(2), mapY(LAMBDA_IN_PM) - 5);

    // Compton
    ctx.strokeStyle = tokens.amber;
    ctx.lineWidth = 2;
    ctx.beginPath();
    const steps = 200;
    for (let i = 0; i <= steps; i++) {
      const deg = thetaMin + ((thetaMax - thetaMin) * i) / steps;
      const rad = (deg * Math.PI) / 180;
      const lamOut = scatteredWavelength(LAMBDA_IN_M, rad) * 1e12;
      const x = mapX(deg);
      const y = mapY(lamOut);
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();

    ctx.fillStyle = tokens.amber;
    ctx.font = "9px monospace";
    ctx.textAlign = "left";
    const labelLamOut =
      scatteredWavelength(LAMBDA_IN_M, (45 * Math.PI) / 180) * 1e12;
    ctx.fillText("Compton formula", mapX(50), mapY(labelLamOut + 0.4));

    // Δλ annotation at 90°
    const x90 = mapX(90);
    const yClassical = mapY(LAMBDA_IN_PM);
    const yCompton = mapY(LAMBDA_IN_PM + COMPTON_WAVELENGTH * 1e12);
    ctx.strokeStyle = hexToRgba(tokens.textBright, 0.3);
    ctx.lineWidth = 1;
    ctx.setLineDash([2, 3]);
    ctx.beginPath();
    ctx.moveTo(x90, yClassical);
    ctx.lineTo(x90, yCompton);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = tokens.textMute;
    ctx.font = "9px monospace";
    ctx.textAlign = "left";
    ctx.fillText(
      `Δλ = λ_C = ${(COMPTON_WAVELENGTH * 1e12).toFixed(2)} pm`,
      x90 + 5,
      (yClassical + yCompton) * 0.5 + 3.5,
    );

    // Data points
    for (const dp of DATA_POINTS) {
      const x = mapX(dp.thetaDeg);
      const y = mapY(dp.lambdaPm);

      ctx.fillStyle = tokens.textBright;
      ctx.shadowColor = tokens.amber;
      ctx.shadowBlur = 6;
      ctx.beginPath();
      ctx.arc(x, y, 4.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;

      const errPm = 0.15;
      const yTop = mapY(dp.lambdaPm + errPm);
      const yBot = mapY(dp.lambdaPm - errPm);
      ctx.strokeStyle = hexToRgba(tokens.textBright, 0.55);
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(x, yTop);
      ctx.lineTo(x, yBot);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(x - 3, yTop);
      ctx.lineTo(x + 3, yTop);
      ctx.moveTo(x - 3, yBot);
      ctx.lineTo(x + 3, yBot);
      ctx.stroke();
    }

    // Title
    ctx.fillStyle = tokens.textDim;
    ctx.font = "bold 10px monospace";
    ctx.textAlign = "center";
    ctx.fillText("Compton (1923) — Mo Kα on graphite", ml + chartW * 0.5, mt - 8);

    // Legend
    const lx = ml + chartW - 2;
    const ly = mt + chartH - 12;
    ctx.textAlign = "right";
    ctx.font = "9px monospace";
    ctx.fillStyle = tokens.cyan;
    ctx.fillText("— — wave theory", lx, ly - 11);
    ctx.fillStyle = tokens.amber;
    ctx.fillText("——— Compton formula", lx, ly);
    ctx.fillStyle = tokens.textBright;
    ctx.fillText("○   measured λ'", lx, ly + 11);
  }, [tokens, width, height]);

  return (
    <div ref={containerRef} className="w-full pb-4">
      <canvas
        ref={canvasRef}
        style={{ width, height, display: "block" }}
        className={SCENE_CANVAS_CLASS}
      />
      <p className="mt-1 text-center font-mono text-xs text-[var(--color-fg-3)]">
        Mo K&alpha; &lambda;&nbsp;=&nbsp;71&nbsp;pm scattered off graphite &mdash;
        data tracks the Compton formula, not the classical prediction
      </p>
    </div>
  );
}
