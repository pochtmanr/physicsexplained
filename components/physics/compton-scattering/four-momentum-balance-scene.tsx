"use client";

import { useEffect, useRef, useState } from "react";
import { useAnimationFrame } from "@/lib/animation/use-animation-frame";
import {
  comptonShift,
  scatteredWavelength,
} from "@/lib/physics/relativity/compton";
import { PLANCK_CONSTANT, SPEED_OF_LIGHT, ELECTRON_MASS } from "@/lib/physics/constants";
import {
  applyDpr,
  hexToRgba,
  SCENE_CANVAS_CLASS,
  SCENE_HEIGHT_DEFAULT,
  useSceneSize,
  useSceneTokens,
} from "@/components/physics/_shared/scene-tokens";

/**
 * FIG.19b — Four-momentum conservation in Compton scattering.
 *
 *   Palette: amber for photons, magenta for electrons, cyan for resultants.
 */

const LAMBDA_IN_M = 7.1e-11;

function drawArrow(
  ctx: CanvasRenderingContext2D,
  x0: number,
  y0: number,
  x1: number,
  y1: number,
  color: string,
  lineWidth = 2,
  headSize = 8,
) {
  const dx = x1 - x0;
  const dy = y1 - y0;
  const len = Math.hypot(dx, dy);
  if (len < 2) return;
  const ux = dx / len;
  const uy = dy / len;
  ctx.save();
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineWidth = lineWidth;
  ctx.beginPath();
  ctx.moveTo(x0, y0);
  ctx.lineTo(x1, y1);
  ctx.stroke();
  const ax = x1 - ux * headSize;
  const ay = y1 - uy * headSize;
  const px = -uy;
  const py = ux;
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(ax + px * headSize * 0.5, ay + py * headSize * 0.5);
  ctx.lineTo(ax - px * headSize * 0.5, ay - py * headSize * 0.5);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

function drawAxisLabel(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  text: string,
  color: string,
) {
  ctx.save();
  ctx.fillStyle = color;
  ctx.font = "10px monospace";
  ctx.textAlign = "center";
  ctx.fillText(text, x, y);
  ctx.restore();
}

export function FourMomentumBalanceScene() {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const tokens = useSceneTokens();
  const { width, height } = useSceneSize(containerRef, {
    ratio: 0.55,
    maxHeight: SCENE_HEIGHT_DEFAULT,
  });

  const [thetaDeg, setThetaDeg] = useState(60);
  const thetaRef = useRef(thetaDeg);
  useEffect(() => {
    thetaRef.current = thetaDeg;
  }, [thetaDeg]);

  useAnimationFrame({
    elementRef: containerRef,
    onFrame: () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = applyDpr(canvas, width, height);
      if (!ctx) return;

      ctx.clearRect(0, 0, width, height);
      ctx.fillStyle = tokens.bg;
      ctx.fillRect(0, 0, width, height);

      const theta = (thetaRef.current * Math.PI) / 180;
      const dLambda = comptonShift(theta);
      const lambdaOut = scatteredWavelength(LAMBDA_IN_M, theta);

      const pGammaIn = PLANCK_CONSTANT / LAMBDA_IN_M;
      const EGammaIn = pGammaIn * SPEED_OF_LIGHT;

      const EElecIn = ELECTRON_MASS * SPEED_OF_LIGHT * SPEED_OF_LIGHT;
      const pElecIn = 0;

      const pGammaOut = PLANCK_CONSTANT / lambdaOut;
      const EGammaOut = pGammaOut * SPEED_OF_LIGHT;
      const pGammaOutX = pGammaOut * Math.cos(theta);
      const pGammaOutY = pGammaOut * Math.sin(theta);

      const pElecOutX = pGammaIn - pGammaOutX;
      const pElecOutY = -pGammaOutY;
      const EElecOut = EElecIn + EGammaIn - EGammaOut;

      const colW = width / 2;
      const margin = 24;
      const plotW = colW - margin * 2;
      const plotH = height - margin * 2 - 28;

      const maxE = EElecIn;
      const scale = (plotH * 0.38) / maxE;

      const beforeOriginX = colW * 0.5;
      const afterOriginX = colW + colW * 0.5;
      const originY = margin + plotH * 0.72;

      // Background panels
      ctx.fillStyle = hexToRgba(tokens.textBright, 0.025);
      ctx.fillRect(0, 0, colW, height);
      ctx.fillStyle = hexToRgba(tokens.textBright, 0.012);
      ctx.fillRect(colW, 0, colW, height);

      // Divider
      ctx.strokeStyle = tokens.panelBorder;
      ctx.lineWidth = 1;
      ctx.setLineDash([3, 5]);
      ctx.beginPath();
      ctx.moveTo(colW, margin * 0.5);
      ctx.lineTo(colW, height - margin * 0.5);
      ctx.stroke();
      ctx.setLineDash([]);

      ctx.fillStyle = tokens.textMute;
      ctx.font = "11px monospace";
      ctx.textAlign = "center";
      ctx.fillText("BEFORE SCATTERING", colW * 0.5, margin);
      ctx.fillText("AFTER SCATTERING", colW + colW * 0.5, margin);

      const axisColor = tokens.axes;
      ctx.strokeStyle = axisColor;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(beforeOriginX, originY + 20);
      ctx.lineTo(beforeOriginX, originY - plotH * 0.6);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(beforeOriginX - plotW * 0.25, originY);
      ctx.lineTo(beforeOriginX + plotW * 0.5, originY);
      ctx.stroke();
      drawAxisLabel(ctx, beforeOriginX, originY - plotH * 0.62, "E/c", tokens.textMute);
      drawAxisLabel(ctx, beforeOriginX + plotW * 0.52, originY, "p_x", tokens.textMute);

      ctx.strokeStyle = axisColor;
      ctx.beginPath();
      ctx.moveTo(afterOriginX, originY + 20);
      ctx.lineTo(afterOriginX, originY - plotH * 0.6);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(afterOriginX - plotW * 0.35, originY);
      ctx.lineTo(afterOriginX + plotW * 0.5, originY);
      ctx.stroke();
      drawAxisLabel(ctx, afterOriginX, originY - plotH * 0.62, "E/c", tokens.textMute);
      drawAxisLabel(ctx, afterOriginX + plotW * 0.52, originY, "p_x", tokens.textMute);

      // BEFORE
      const GI_px = pGammaIn * scale;
      const GI_Ec = EGammaIn * scale;
      drawArrow(
        ctx,
        beforeOriginX,
        originY,
        beforeOriginX + GI_px,
        originY - GI_Ec,
        tokens.amber,
        2.2,
        8,
      );
      ctx.fillStyle = tokens.amber;
      ctx.font = "10px monospace";
      ctx.textAlign = "left";
      ctx.fillText("p^μ_γ (in)", beforeOriginX + GI_px + 5, originY - GI_Ec + 4);

      const EI_Ec = EElecIn * scale;
      drawArrow(ctx, beforeOriginX, originY, beforeOriginX + pElecIn, originY - EI_Ec, tokens.magenta, 2.2, 8);
      ctx.fillStyle = tokens.magenta;
      ctx.font = "10px monospace";
      ctx.textAlign = "right";
      ctx.fillText("p^μ_e (rest)", beforeOriginX + pElecIn - 5, originY - EI_Ec * 0.5);

      const totalBeforePx = GI_px + pElecIn;
      const totalBeforePy = GI_Ec + EI_Ec;

      ctx.strokeStyle = hexToRgba(tokens.cyan, 0.5);
      ctx.lineWidth = 1.2;
      ctx.setLineDash([3, 4]);
      ctx.beginPath();
      ctx.moveTo(beforeOriginX, originY);
      ctx.lineTo(beforeOriginX + totalBeforePx, originY - totalBeforePy);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle = tokens.cyan;
      ctx.font = "10px monospace";
      ctx.textAlign = "center";
      ctx.fillText(
        "Σp^μ",
        beforeOriginX + totalBeforePx * 0.7,
        originY - totalBeforePy - 6,
      );

      // AFTER
      const GO_px = pGammaOutX * scale;
      const GO_py_vis = pGammaOutY * scale;
      const GO_Ec = EGammaOut * scale;

      drawArrow(
        ctx,
        afterOriginX,
        originY,
        afterOriginX + GO_px,
        originY - GO_Ec,
        tokens.amber,
        2.2,
        8,
      );
      ctx.fillStyle = tokens.amber;
      ctx.font = "10px monospace";
      ctx.textAlign = GO_px > 0 ? "left" : "right";
      ctx.fillText(
        "p^μ_γ' (out)",
        afterOriginX + GO_px + (GO_px > 0 ? 5 : -5),
        originY - GO_Ec + 4,
      );

      if (Math.abs(GO_py_vis) > 2) {
        ctx.strokeStyle = hexToRgba(tokens.amber, 0.45);
        ctx.lineWidth = 1.2;
        ctx.setLineDash([2, 3]);
        ctx.beginPath();
        ctx.moveTo(afterOriginX + GO_px, originY - GO_Ec);
        ctx.lineTo(afterOriginX + GO_px, originY - GO_Ec + GO_py_vis);
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.fillStyle = hexToRgba(tokens.amber, 0.6);
        ctx.font = "9px monospace";
        ctx.textAlign = "left";
        ctx.fillText("p_y", afterOriginX + GO_px + 4, originY - GO_Ec + GO_py_vis * 0.5);
      }

      const ER_px = pElecOutX * scale;
      const ER_Ec = (EElecOut / SPEED_OF_LIGHT) * scale;
      drawArrow(
        ctx,
        afterOriginX,
        originY,
        afterOriginX + ER_px,
        originY - ER_Ec,
        tokens.magenta,
        2.2,
        8,
      );
      ctx.fillStyle = tokens.magenta;
      ctx.font = "10px monospace";
      ctx.textAlign = ER_px > 0 ? "left" : "right";
      ctx.fillText(
        "p^μ_e' (recoil)",
        afterOriginX + ER_px + (ER_px > 0 ? 5 : -5),
        originY - ER_Ec + 4,
      );

      const totalAfterPx = GO_px + ER_px;
      const totalAfterPy = GO_Ec + ER_Ec;
      ctx.strokeStyle = hexToRgba(tokens.cyan, 0.5);
      ctx.lineWidth = 1.2;
      ctx.setLineDash([3, 4]);
      ctx.beginPath();
      ctx.moveTo(afterOriginX, originY);
      ctx.lineTo(afterOriginX + totalAfterPx, originY - totalAfterPy);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle = tokens.cyan;
      ctx.font = "10px monospace";
      ctx.textAlign = "center";
      ctx.fillText(
        "Σp^μ",
        afterOriginX + totalAfterPx * 0.7,
        originY - totalAfterPy - 6,
      );

      ctx.fillStyle = tokens.textMute;
      ctx.font = "10px monospace";
      ctx.textAlign = "left";
      ctx.fillText(`|p^μ_γ|² = 0  (photon on null cone)`, margin, height - 36);
      ctx.fillText(
        `|p^μ_e|² = (m_e c)²  (electron on mass shell)`,
        margin,
        height - 24,
      );

      const hudX = width - 12;
      ctx.textAlign = "right";
      ctx.fillStyle = tokens.textDim;
      ctx.font = "11px monospace";
      ctx.fillText(`θ = ${thetaRef.current.toFixed(0)}°`, hudX, 16);
      ctx.fillStyle = tokens.textMute;
      ctx.fillText(`Δλ = ${(dLambda * 1e12).toFixed(3)} pm`, hudX, 30);
      ctx.fillText(`λ' = ${(lambdaOut * 1e12).toFixed(3)} pm`, hudX, 44);
      ctx.fillStyle = hexToRgba(tokens.cyan, 0.8);
      ctx.fillText(`ΔE_γ = ${((EGammaIn - EGammaOut) * 1e17).toFixed(3)} × 10⁻¹⁷ J`, hudX, 60);
      ctx.fillText(`E_e'  = ${(EElecOut * 1e14).toFixed(3)} × 10⁻¹⁴ J`, hudX, 74);

      // pElecOutY is implied by 2D conservation (used in derivation only)
      void pElecOutY;
    },
  });

  return (
    <div ref={containerRef} className="w-full pb-4">
      <canvas
        ref={canvasRef}
        style={{ width, height, display: "block" }}
        className={SCENE_CANVAS_CLASS}
      />
      <div className="mt-2 flex items-center gap-3 px-2">
        <label className="text-sm text-[var(--color-fg-3)]">θ (degrees)</label>
        <input
          type="range"
          min={0}
          max={170}
          step={5}
          value={thetaDeg}
          onChange={(e) => setThetaDeg(parseFloat(e.target.value))}
          className="flex-1"
          style={{ accentColor: "var(--color-amber)" }}
        />
        <span className="w-14 text-right text-sm font-mono text-[var(--color-fg-1)]">
          {thetaDeg.toFixed(0)}°
        </span>
      </div>
    </div>
  );
}
