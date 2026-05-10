"use client";

import { useEffect, useRef, useState } from "react";
import { useAnimationFrame } from "@/lib/animation/use-animation-frame";
import {
  COMPTON_WAVELENGTH,
  comptonShift,
  scatteredWavelength,
} from "@/lib/physics/relativity/compton";
import {
  applyDpr,
  SCENE_CANVAS_CLASS,
  SCENE_HEIGHT_DEFAULT,
  useSceneSize,
  useSceneTokens,
} from "@/components/physics/_shared/scene-tokens";

/**
 * FIG.19a — Compton wavelength shift.
 *
 *   Palette: amber for photons, magenta for electrons, cyan for axes/HUD.
 */

const LAMBDA_IN_M = 7.1e-11;

export function WavelengthShiftScene() {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const tokens = useSceneTokens();
  const { width, height } = useSceneSize(containerRef, {
    ratio: 0.55,
    maxHeight: SCENE_HEIGHT_DEFAULT,
  });

  const [thetaDeg, setThetaDeg] = useState(90);
  const thetaRef = useRef(thetaDeg);
  useEffect(() => {
    thetaRef.current = thetaDeg;
  }, [thetaDeg]);

  useAnimationFrame({
    elementRef: containerRef,
    onFrame: (t) => {
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

      const cx = width * 0.45;
      const cy = height * 0.5;

      // Origin crosshair
      ctx.strokeStyle = tokens.panelBorder;
      ctx.lineWidth = 1;
      ctx.setLineDash([2, 4]);
      ctx.beginPath();
      ctx.moveTo(cx - 30, cy);
      ctx.lineTo(cx + 30, cy);
      ctx.moveTo(cx, cy - 30);
      ctx.lineTo(cx, cy + 30);
      ctx.stroke();
      ctx.setLineDash([]);

      // Stationary electron
      ctx.fillStyle = tokens.magenta;
      ctx.shadowColor = tokens.magenta;
      ctx.shadowBlur = 12;
      ctx.beginPath();
      ctx.arc(cx, cy, 6, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;
      ctx.fillStyle = tokens.textMute;
      ctx.font = "11px monospace";
      ctx.textAlign = "left";
      ctx.fillText("e⁻ (rest)", cx + 10, cy + 16);

      // Incoming photon
      const inLen = Math.min(cx - 40, 220);
      const inStart = cx - inLen;
      drawPhoton(ctx, inStart, cy, cx, cy, t, tokens.amber, 5, 1.0);
      ctx.fillStyle = tokens.amber;
      ctx.font = "11px monospace";
      ctx.textAlign = "left";
      ctx.fillText(`γ in   λ = ${(LAMBDA_IN_M * 1e12).toFixed(2)} pm`, inStart + 6, cy - 12);

      // Outgoing photon
      const outLen = Math.min(width - cx - 40, height * 0.45, 240);
      const ox = cx + Math.cos(theta) * outLen;
      const oy = cy - Math.sin(theta) * outLen;
      const stretch = lambdaOut / LAMBDA_IN_M;
      const outAlpha = Math.max(0.6, 1 / stretch);
      drawPhoton(ctx, cx, cy, ox, oy, t, tokens.amber, Math.min(8, 5 * stretch), outAlpha);
      ctx.fillStyle = tokens.amber;
      ctx.fillText(
        `γ out  λ' = ${(lambdaOut * 1e12).toFixed(2)} pm`,
        ox + (Math.cos(theta) >= 0 ? 6 : -130),
        oy + (Math.sin(theta) >= 0 ? -10 : 16),
      );

      // Recoil electron
      const recoilLen = 60 * Math.min(1, dLambda / (2 * COMPTON_WAVELENGTH));
      const phi = -theta * 0.45;
      const rx = cx + Math.cos(phi) * recoilLen;
      const ry = cy - Math.sin(phi) * recoilLen;
      ctx.strokeStyle = tokens.magenta;
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(rx, ry);
      ctx.stroke();
      drawArrowhead(ctx, cx, cy, rx, ry, tokens.magenta, 6);
      ctx.fillStyle = tokens.magenta;
      ctx.fillText("e⁻ recoil", rx + 6, ry + 4);

      // Angle arc
      ctx.strokeStyle = tokens.textMute;
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.arc(cx, cy, 30, -theta, 0, theta < 0);
      ctx.stroke();
      ctx.fillStyle = tokens.textDim;
      ctx.font = "11px monospace";
      const arcMidAngle = -theta / 2;
      ctx.fillText("θ", cx + 38 * Math.cos(arcMidAngle), cy + 38 * Math.sin(arcMidAngle));

      // HUD
      ctx.fillStyle = tokens.textDim;
      ctx.font = "12px monospace";
      ctx.textAlign = "left";
      const px = 14;
      let py = 16;
      ctx.fillText(`θ = ${thetaRef.current.toFixed(0)}°`, px, py);
      py += 16;
      ctx.fillStyle = tokens.textMute;
      ctx.fillText(`λ_C = h / m_e c = ${(COMPTON_WAVELENGTH * 1e12).toFixed(3)} pm`, px, py);
      py += 16;
      ctx.fillStyle = tokens.amber;
      ctx.fillText(`Δλ = λ_C (1 − cos θ) = ${(dLambda * 1e12).toFixed(3)} pm`, px, py);
      py += 16;
      ctx.fillStyle = tokens.textMute;
      ctx.fillText(`λ' / λ_in = ${stretch.toFixed(3)}`, px, py);
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
          max={180}
          step={1}
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

function drawPhoton(
  ctx: CanvasRenderingContext2D,
  x0: number,
  y0: number,
  x1: number,
  y1: number,
  t: number,
  color: string,
  amplitude: number,
  alpha: number,
) {
  const dx = x1 - x0;
  const dy = y1 - y0;
  const len = Math.hypot(dx, dy);
  if (len < 1) return;
  const ux = dx / len;
  const uy = dy / len;
  const px = -uy;
  const py = ux;

  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.strokeStyle = color;
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  const steps = Math.max(40, Math.floor(len / 4));
  const k = (Math.PI * 2 * 6) / len;
  const phase = t * 6.5;
  for (let i = 0; i <= steps; i++) {
    const s = (i / steps) * len;
    const wave = Math.sin(k * s - phase) * amplitude;
    const x = x0 + ux * s + px * wave;
    const y = y0 + uy * s + py * wave;
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.stroke();
  drawArrowhead(ctx, x0, y0, x1, y1, color, 6);
  ctx.restore();
}

function drawArrowhead(
  ctx: CanvasRenderingContext2D,
  x0: number,
  y0: number,
  x1: number,
  y1: number,
  color: string,
  size: number,
) {
  const dx = x1 - x0;
  const dy = y1 - y0;
  const len = Math.hypot(dx, dy);
  if (len < 1) return;
  const ux = dx / len;
  const uy = dy / len;
  const ax = x1 - ux * size;
  const ay = y1 - uy * size;
  const px = -uy;
  const py = ux;
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(ax + px * size * 0.55, ay + py * size * 0.55);
  ctx.lineTo(ax - px * size * 0.55, ay - py * size * 0.55);
  ctx.closePath();
  ctx.fill();
}
