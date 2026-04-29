"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useThemeColors } from "@/lib/hooks/use-theme-colors";
import {
  predictedFringeShiftAtAngle,
  expectedNullThreshold,
  EARTH_ORBITAL_SPEED,
  SODIUM_D_WAVELENGTH,
  MICHELSON_1887_ARM_LENGTH,
} from "@/lib/physics/relativity/michelson-morley";

const RATIO = 0.62;
const MAX_HEIGHT = 460;
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
  const colors = useThemeColors();
  const [size, setSize] = useState({ width: 720, height: 440 });

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
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const w = entry.contentRect.width;
        if (w > 0) {
          setSize({ width: w, height: Math.min(w * RATIO, MAX_HEIGHT) });
        }
      }
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const { width, height } = size;
    const dpr = window.devicePixelRatio || 1;
    if (canvas.width !== width * dpr || canvas.height !== height * dpr) {
      canvas.width = width * dpr;
      canvas.height = height * dpr;
    }
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, width, height);

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
    ctx.strokeStyle = colors.fg3;
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
    ctx.fillStyle = "rgba(150, 170, 200, 0.10)";
    ctx.fillRect(padL, yToPx(noise), plotW, yToPx(-noise) - yToPx(noise));
    ctx.strokeStyle = "rgba(150, 170, 200, 0.45)";
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
    ctx.strokeStyle = "#FFC852";
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
    ctx.strokeStyle = "#6FB8C6";
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
    ctx.strokeStyle = colors.fg2;
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(padL, padT);
    ctx.lineTo(padL, padT + plotH);
    ctx.lineTo(padL + plotW, padT + plotH);
    ctx.stroke();

    // Y tick labels
    ctx.fillStyle = colors.fg2;
    ctx.font = "11px monospace";
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
    ctx.fillStyle = colors.fg1;
    ctx.font = "11px monospace";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("fringe shift Δn", 0, 0);
    ctx.restore();

    // X tick labels
    ctx.fillStyle = colors.fg2;
    ctx.font = "11px monospace";
    ctx.textAlign = "center";
    ctx.textBaseline = "top";
    for (let deg = 0; deg <= 360; deg += 45) {
      const xp = xToPx((deg * Math.PI) / 180);
      ctx.fillText(`${deg}°`, xp, padT + plotH + 6);
    }
    ctx.fillStyle = colors.fg1;
    ctx.font = "11px monospace";
    ctx.fillText("apparatus rotation θ", padL + plotW / 2, padT + plotH + 26);

    // ── Legend ──
    const legY = padT + 6;
    const legX = padL + 14;
    // Dashed amber sample
    ctx.strokeStyle = "#FFC852";
    ctx.lineWidth = 2.4;
    ctx.setLineDash([10, 6]);
    ctx.beginPath();
    ctx.moveTo(legX, legY);
    ctx.lineTo(legX + 28, legY);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = colors.fg1;
    ctx.font = "11px monospace";
    ctx.textAlign = "left";
    ctx.textBaseline = "middle";
    ctx.fillText("aether prediction (2L/λ)(v²/c²)·cos(2θ)", legX + 36, legY);

    const legY2 = legY + 18;
    ctx.strokeStyle = "#6FB8C6";
    ctx.lineWidth = 2.0;
    ctx.beginPath();
    ctx.moveTo(legX, legY2);
    ctx.lineTo(legX + 28, legY2);
    ctx.stroke();
    ctx.fillText("observed (Cleveland 1887)", legX + 36, legY2);

    // ── Title above plot ──
    ctx.fillStyle = colors.fg0;
    ctx.font = "12px monospace";
    ctx.textAlign = "right";
    ctx.fillText(
      `peak prediction: ${samples.peak.toFixed(2)} fringes  ·  noise floor: ±${noise.toFixed(2)}`,
      padL + plotW,
      legY + 2,
    );
  }, [size, colors, samples]);

  return (
    <div ref={containerRef} className="w-full pb-3">
      <canvas
        ref={canvasRef}
        style={{ width: size.width, height: size.height }}
        className="block bg-[#0A0C12]"
      />
    </div>
  );
}
