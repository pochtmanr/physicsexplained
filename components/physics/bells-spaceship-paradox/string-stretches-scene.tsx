"use client";

import { useEffect, useRef, useState } from "react";
import { gamma } from "@/lib/physics/relativity/types";
import {
  properSeparation,
  stringStrain,
  snapSpeed,
} from "@/lib/physics/relativity/bell-spaceship";

/**
 * §05.2 STRING STRETCHES — the proper-frame zoom.
 *
 * A β slider drives a side-by-side comparison of the string in two frames:
 *
 *   • LAUNCH FRAME (top): two rocket markers at fixed positions, separated
 *     by D₀. The string between them looks unstressed — its lab-frame
 *     length is unchanged. This is the naïve answer.
 *
 *   • PROPER FRAME (bottom): the rockets' shared instantaneous rest frame.
 *     In this frame the string spans γ·D₀ and is visibly stretched. Tick
 *     marks on the string get farther apart as β rises. At γ = 1 + ε_c the
 *     string snaps; we render that with a frayed break.
 *
 * The HUD shows β, γ, the proper-length multiple γ·D₀/D₀, and the strain.
 * A reference line marks the snap point (assumed ε_c = 1, i.e. γ_crit = 2,
 * β_snap = √3/2 ≈ 0.866 — generous for a "delicate" string but matches the
 * canonical Bell scenario).
 */

const WIDTH = 640;
const HEIGHT = 320;
const PAD_X = 48;
const PAD_Y = 36;
const D0_PIXELS = 200; // lab-frame string length in pixels at β = 0.
const EPSILON_C = 1; // snap at γ = 2 ↔ β = √3/2 ≈ 0.866 (canonical demo value)

export function StringStretchesScene() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [beta, setBeta] = useState(0.6);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const dpr = window.devicePixelRatio || 1;
    canvas.width = WIDTH * dpr;
    canvas.height = HEIGHT * dpr;
    canvas.style.width = `${WIDTH}px`;
    canvas.style.height = `${HEIGHT}px`;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, WIDTH, HEIGHT);

    const g = gamma(beta);
    const eps = stringStrain(beta);
    const snapped = eps >= EPSILON_C;
    const properMult = g; // γ · D₀ / D₀ = γ.

    // Two rows: top = launch frame (fixed D₀), bottom = proper frame (γ · D₀).
    const rowY1 = PAD_Y + 60;
    const rowY2 = HEIGHT - PAD_Y - 50;

    // Origin x for both rows
    const x0 = PAD_X + 80;

    // === LAUNCH FRAME (top) ===
    drawFrameLabel(ctx, "LAUNCH FRAME", "rgba(103, 232, 249, 0.85)", PAD_X, rowY1 - 26);
    // Rocket markers (cyan)
    drawRocket(ctx, x0, rowY1, "#67E8F9", "rear");
    drawRocket(ctx, x0 + D0_PIXELS, rowY1, "#67E8F9", "front");
    // String
    ctx.strokeStyle = "#67E8F9";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(x0 + 14, rowY1);
    ctx.lineTo(x0 + D0_PIXELS - 14, rowY1);
    ctx.stroke();
    // Length label
    ctx.fillStyle = "rgba(255,255,255,0.6)";
    ctx.font = "11px ui-monospace, monospace";
    ctx.textAlign = "center";
    ctx.fillText(
      `D_lab = D₀  (constant)`,
      x0 + D0_PIXELS / 2,
      rowY1 + 22,
    );

    // === PROPER FRAME (bottom) ===
    drawFrameLabel(ctx, "PROPER FRAME", "rgba(255, 106, 222, 0.85)", PAD_X, rowY2 - 26);
    const properW = D0_PIXELS * properMult;
    // Cap visual stretch so it doesn't overflow the canvas
    const visualMax = WIDTH - x0 - PAD_X;
    const properWClamped = Math.min(properW, visualMax);
    drawRocket(ctx, x0, rowY2, "#FF6ADE", "rear");
    drawRocket(ctx, x0 + properWClamped, rowY2, "#FF6ADE", "front");

    // Stretched string with tick marks
    if (!snapped) {
      ctx.strokeStyle = "#FF6ADE";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(x0 + 14, rowY2);
      ctx.lineTo(x0 + properWClamped - 14, rowY2);
      ctx.stroke();
      // Strain ticks: more spread = visibly stretched
      const nTicks = 9;
      for (let i = 1; i < nTicks; i++) {
        const tx = x0 + 14 + ((properWClamped - 28) * i) / nTicks;
        ctx.beginPath();
        ctx.moveTo(tx, rowY2 - 6);
        ctx.lineTo(tx, rowY2 + 6);
        ctx.stroke();
      }
    } else {
      // Snapped string: two frayed halves with a gap.
      const breakX = x0 + properWClamped / 2;
      ctx.strokeStyle = "#FF6ADE";
      ctx.lineWidth = 2;
      ctx.setLineDash([3, 3]);
      ctx.beginPath();
      ctx.moveTo(x0 + 14, rowY2);
      ctx.lineTo(breakX - 14, rowY2);
      ctx.moveTo(breakX + 14, rowY2);
      ctx.lineTo(x0 + properWClamped - 14, rowY2);
      ctx.stroke();
      ctx.setLineDash([]);
      // SNAP marker
      ctx.fillStyle = "#FF6ADE";
      ctx.font = "11px ui-monospace, monospace";
      ctx.textAlign = "center";
      ctx.fillText("SNAP", breakX, rowY2 - 12);
    }
    ctx.fillStyle = "rgba(255,255,255,0.6)";
    ctx.font = "11px ui-monospace, monospace";
    ctx.textAlign = "center";
    ctx.fillText(
      properW <= visualMax
        ? `D_proper = γ·D₀ = ${properMult.toFixed(3)}·D₀`
        : `D_proper = γ·D₀ = ${properMult.toFixed(3)}·D₀  (clamped to canvas)`,
      x0 + properWClamped / 2,
      rowY2 + 22,
    );

    // HUD top-left
    ctx.fillStyle = "rgba(255,255,255,0.7)";
    ctx.font = "11px ui-monospace, monospace";
    ctx.textAlign = "left";
    ctx.fillText(`β = ${beta.toFixed(3)}`, PAD_X, 18);
    ctx.fillText(`γ = ${g.toFixed(3)}`, PAD_X + 110, 18);
    ctx.fillText(`ε = γ − 1 = ${eps.toFixed(3)}`, PAD_X + 220, 18);
    ctx.fillText(
      snapped ? `STATUS: snapped (ε ≥ ${EPSILON_C})` : `STATUS: holding`,
      PAD_X + 380,
      18,
    );

    // Bottom legend
    ctx.fillStyle = "rgba(255,255,255,0.45)";
    ctx.font = "10px ui-monospace, monospace";
    ctx.textAlign = "left";
    ctx.fillText(
      `assume ε_c = ${EPSILON_C}: snap at β = ${snapSpeed(EPSILON_C).toFixed(3)}`,
      PAD_X,
      HEIGHT - 8,
    );
  }, [beta]);

  return (
    <div className="flex flex-col items-center gap-3">
      <canvas ref={canvasRef} className="rounded-md border border-white/10 bg-black/40" />
      <label className="flex w-full max-w-[640px] items-center gap-3 font-mono text-xs text-white/70">
        <span className="w-20">β = {beta.toFixed(2)}</span>
        <input
          type="range"
          min={0}
          max={0.99}
          step={0.01}
          value={beta}
          onChange={(e) => setBeta(parseFloat(e.target.value))}
          className="flex-1"
        />
        <span className="w-28">γ = {gamma(beta).toFixed(3)}</span>
        <span className="w-32">
          D_proper/D₀ = {properSeparation(1, beta).toFixed(3)}
        </span>
      </label>
    </div>
  );
}

function drawFrameLabel(
  ctx: CanvasRenderingContext2D,
  text: string,
  color: string,
  x: number,
  y: number,
) {
  ctx.fillStyle = color;
  ctx.font = "11px ui-monospace, monospace";
  ctx.textAlign = "left";
  ctx.fillText(text, x, y);
}

function drawRocket(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  color: string,
  label: string,
) {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(x, y, 6, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "rgba(255,255,255,0.55)";
  ctx.font = "10px ui-monospace, monospace";
  ctx.textAlign = "center";
  ctx.fillText(label, x, y - 14);
}
