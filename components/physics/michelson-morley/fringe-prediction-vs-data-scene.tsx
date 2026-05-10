"use client";

import { useEffect, useMemo, useRef } from "react";
import {
  predictedFringeShiftAtAngle,
  expectedNullThreshold,
  EARTH_ORBITAL_SPEED,
  SODIUM_D_WAVELENGTH,
  MICHELSON_1887_ARM_LENGTH,
} from "@/lib/physics/relativity/michelson-morley";
import {
  applyDpr,
  hexToRgba,
  SCENE_CANVAS_CLASS,
  SCENE_HEIGHT_TALL,
  useSceneSize,
  useSceneTokens,
} from "@/components/physics/_shared/scene-tokens";

const N_SAMPLES = 240;

/**
 * FIG.03b — THE MONEY-SHOT GRAPH.
 *
 *   X axis: apparatus rotation angle 0 → 360°
 *   Y axis: fringe shift in fractions of a fringe
 *
 *     • Dashed amber  — classical aether prediction
 *                        Δn(θ) = (2 L / λ) · (v² / c²) · cos(2θ)
 *                        ≈ ±0.37 fringes for the 1887 setup.
 *     • Solid cyan    — observed shift, deterministic ±0.01 noise
 *                        oscillating around zero.
 *     • Dashed grey   — the experimental noise floor at ±0.01.
 *
 * The dashed line never reaches the solid line. Not a soft miss, not
 * a partial agreement — the prediction is 30–40× the noise the
 * experiment can resolve, and the data sit flat at zero. The aether
 * dies on screen.
 */
export function FringePredictionVsDataScene() {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const tokens = useSceneTokens();
  const { width, height } = useSceneSize(containerRef, {
    ratio: 0.62,
    maxHeight: SCENE_HEIGHT_TALL,
  });

  // Pre-compute prediction + data sample arrays. Pure functions of θ;
  // no animation needed — the message is "look how far apart these are."
  const samples = useMemo(() => {
    const L = MICHELSON_1887_ARM_LENGTH;
    const lambda = SODIUM_D_WAVELENGTH;
    const v = EARTH_ORBITAL_SPEED;
    const noise = expectedNullThreshold(); // 0.01 fringes
    const predicted = new Array<number>(N_SAMPLES);
    const observed = new Array<number>(N_SAMPLES);
    const angles = new Array<number>(N_SAMPLES);
    for (let i = 0; i < N_SAMPLES; i++) {
      const theta = (i / (N_SAMPLES - 1)) * (2 * Math.PI);
      angles[i] = theta;
      predicted[i] = predictedFringeShiftAtAngle(L, lambda, v, theta);
      // Deterministic "noise" using a sum of incommensurate sinusoids —
      // no Math.random so the figure is reproducible across renders.
      observed[i] =
        noise *
        (0.55 * Math.sin(7.3 * theta + 0.4) +
          0.35 * Math.sin(13.1 * theta + 1.7) +
          0.20 * Math.cos(19.7 * theta + 2.9));
    }
    const peak = predicted.reduce((m, x) => Math.max(m, Math.abs(x)), 0);
    return { angles, predicted, observed, peak, noise };
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = applyDpr(canvas, width, height);
    if (!ctx) return;

    ctx.clearRect(0, 0, width, height);
    ctx.fillStyle = tokens.bg;
    ctx.fillRect(0, 0, width, height);

    // ── Plot area ──
    const padL = 64;
    const padR = 16;
    const padT = 36;
    const padB = 56;
    const plotW = width - padL - padR;
    const plotH = height - padT - padB;

    // Symmetric Y range — pad slightly above the prediction peak so the
    // dashed amber curve is fully visible and the solid cyan looks
    // dramatically squashed against the zero axis.
    const yMax = Math.max(0.5, samples.peak * 1.12);
    const yMin = -yMax;

    const xToPx = (theta: number) => padL + (theta / (2 * Math.PI)) * plotW;
    const yToPx = (y: number) =>
      padT + plotH - ((y - yMin) / (yMax - yMin)) * plotH;

    // ── Background grid ──
    ctx.strokeStyle = tokens.panelBorder;
    ctx.lineWidth = 1;
    // Horizontal gridlines every 0.1 fringe
    const yStep = 0.1;
    for (let y = Math.ceil(yMin / yStep) * yStep; y <= yMax + 1e-9; y += yStep) {
      const yp = yToPx(y);
      ctx.globalAlpha = Math.abs(y) < 1e-9 ? 0.6 : 0.18;
      ctx.beginPath();
      ctx.moveTo(padL, yp);
      ctx.lineTo(padL + plotW, yp);
      ctx.stroke();
    }
    ctx.globalAlpha = 1;

    // Vertical gridlines every 45°
    for (let deg = 0; deg <= 360; deg += 45) {
      const xp = xToPx((deg * Math.PI) / 180);
      ctx.globalAlpha = 0.18;
      ctx.beginPath();
      ctx.moveTo(xp, padT);
      ctx.lineTo(xp, padT + plotH);
      ctx.stroke();
    }
    ctx.globalAlpha = 1;

    // ── Noise-floor band at ±0.01 fringes (very thin grey strip) ──
    const noise = samples.noise;
    ctx.fillStyle = hexToRgba(tokens.textMute, 0.10);
    ctx.fillRect(padL, yToPx(noise), plotW, yToPx(-noise) - yToPx(noise));
    ctx.strokeStyle = hexToRgba(tokens.textMute, 0.45);
    ctx.setLineDash([3, 3]);
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(padL, yToPx(noise));
    ctx.lineTo(padL + plotW, yToPx(noise));
    ctx.moveTo(padL, yToPx(-noise));
    ctx.lineTo(padL + plotW, yToPx(-noise));
    ctx.stroke();
    ctx.setLineDash([]);

    // ── Dashed amber: classical aether prediction ──
    ctx.strokeStyle = tokens.amber;
    ctx.lineWidth = 2.4;
    ctx.setLineDash([10, 6]);
    ctx.beginPath();
    for (let i = 0; i < N_SAMPLES; i++) {
      const px = xToPx(samples.angles[i]);
      const py = yToPx(samples.predicted[i]);
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.stroke();
    ctx.setLineDash([]);

    // ── Solid cyan: observed shift (1887 result) ──
    ctx.strokeStyle = tokens.cyan;
    ctx.lineWidth = 2.0;
    ctx.beginPath();
    for (let i = 0; i < N_SAMPLES; i++) {
      const px = xToPx(samples.angles[i]);
      const py = yToPx(samples.observed[i]);
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.stroke();

    // ── Axes ──
    ctx.strokeStyle = tokens.axes;
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(padL, padT);
    ctx.lineTo(padL, padT + plotH);
    ctx.lineTo(padL + plotW, padT + plotH);
    ctx.stroke();

    // Y tick labels
    ctx.fillStyle = tokens.textMute;
    ctx.font = tokens.fontHudSmall;
    ctx.textAlign = "right";
    ctx.textBaseline = "middle";
    for (let y = -0.4; y <= 0.4 + 1e-9; y += 0.2) {
      if (y < yMin - 1e-9 || y > yMax + 1e-9) continue;
      const yp = yToPx(y);
      const sign = y > 0 ? "+" : y < 0 ? "" : " ";
      ctx.fillText(`${sign}${y.toFixed(1)}`, padL - 8, yp);
    }
    // Y axis title (rotated)
    ctx.save();
    ctx.translate(16, padT + plotH / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.fillStyle = tokens.textDim;
    ctx.font = tokens.fontHudSmall;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("fringe shift Δn", 0, 0);
    ctx.restore();

    // X tick labels
    ctx.fillStyle = tokens.textMute;
    ctx.font = tokens.fontHudSmall;
    ctx.textAlign = "center";
    ctx.textBaseline = "top";
    for (let deg = 0; deg <= 360; deg += 45) {
      const xp = xToPx((deg * Math.PI) / 180);
      ctx.fillText(`${deg}°`, xp, padT + plotH + 6);
    }
    ctx.fillStyle = tokens.textDim;
    ctx.font = tokens.fontHudSmall;
    ctx.fillText("apparatus rotation θ", padL + plotW / 2, padT + plotH + 26);

    // ── Legend ──
    const legY = padT + 6;
    const legX = padL + 14;
    // Dashed amber sample
    ctx.strokeStyle = tokens.amber;
    ctx.lineWidth = 2.4;
    ctx.setLineDash([10, 6]);
    ctx.beginPath();
    ctx.moveTo(legX, legY);
    ctx.lineTo(legX + 28, legY);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = tokens.textDim;
    ctx.font = tokens.fontHudSmall;
    ctx.textAlign = "left";
    ctx.textBaseline = "middle";
    ctx.fillText("aether prediction (2L/λ)(v²/c²)·cos(2θ)", legX + 36, legY);

    const legY2 = legY + 18;
    ctx.strokeStyle = tokens.cyan;
    ctx.lineWidth = 2.0;
    ctx.beginPath();
    ctx.moveTo(legX, legY2);
    ctx.lineTo(legX + 28, legY2);
    ctx.stroke();
    ctx.fillText("observed (Cleveland 1887)", legX + 36, legY2);

    // ── Title above plot ──
    ctx.fillStyle = tokens.textBright;
    ctx.font = tokens.fontHud;
    ctx.textAlign = "right";
    ctx.fillText(
      `peak prediction: ${samples.peak.toFixed(2)} fringes  ·  noise floor: ±${noise.toFixed(2)}`,
      padL + plotW,
      legY + 2,
    );
  }, [width, height, tokens, samples]);

  return (
    <div ref={containerRef} className="w-full pb-3">
      <canvas
        ref={canvasRef}
        style={{ width, height, display: "block" }}
        className={SCENE_CANVAS_CLASS}
      />
    </div>
  );
}
