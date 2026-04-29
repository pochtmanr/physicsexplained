"use client";

import { useEffect, useRef, useState } from "react";
import { SPEED_OF_LIGHT } from "@/lib/physics/constants";
import { gamma } from "@/lib/physics/relativity/types";
import { lorentzTransform } from "@/lib/physics/relativity/lorentz";
import { galileanBoost } from "@/lib/physics/relativity/galilean";

/**
 * FIG.08a — Galilean vs Lorentz coordinate transforms, side-by-side.
 *
 * A rectangle of lab-frame events is drawn on each panel, then transformed
 * under (left) the Galilean rule t' = t, x' = x − v t and (right) the
 * Lorentz rule t' = γ(t − β x / c), x' = γ(x − β c t).
 *
 * The Galilean panel slides events horizontally without distortion (time is
 * absolute, x merely shears). The Lorentz panel applies γ-stretching plus
 * the time-mixing cross-term — the rectangle skews in BOTH t and x. As β
 * approaches 1, the Lorentz rectangle stretches and rotates; the Galilean
 * rectangle just slides. Visual proof that the two transforms diverge
 * dramatically at relativistic speeds.
 *
 * Palette: cyan = lab events; magenta = Lorentz; amber = Galilean.
 */

const WIDTH = 720;
const HEIGHT = 360;
const PAD = 36;

// Lab-frame "event rectangle". We work in seconds and metres scaled so that
// 1 unit on the canvas grid ≈ 1 second on the t-axis and 1 light-second on
// the x-axis. That keeps the Galilean and Lorentz scales comparable and
// keeps β dimensionless on screen.
const T_RANGE: [number, number] = [-2, 2];
const X_RANGE: [number, number] = [-2, 2];

// Eight events forming a rectangle in lab (t, x), in (t [s], x [light-s]).
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
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [beta, setBeta] = useState(0.5);

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

    const panelW = (WIDTH - 3 * PAD) / 2;
    const panelH = HEIGHT - 2 * PAD;

    // Two panels: left (Galilean), right (Lorentz).
    drawPanel(ctx, PAD, PAD, panelW, panelH, "GALILEAN  t'=t,  x'=x−v t", "#FFB36B", (t, x) => {
      // Galilean uses v in m/s; here our x is in light-seconds, so v in
      // light-seconds-per-second equals β.
      const out = galileanBoost(t, x, beta);
      return out;
    });

    drawPanel(
      ctx,
      PAD * 2 + panelW,
      PAD,
      panelW,
      panelH,
      "LORENTZ   t'=γ(t−βx/c),  x'=γ(x−βct)",
      "#FF6ADE",
      (t, x) => {
        // Same convention: x in light-s means c·t and x are commensurate, so
        // β x / c reduces to β·x in our normalised units, and βc·t reduces
        // to β·t. Use the actual lorentzTransform with a synthetic c=1
        // shortcut by scaling: pass true SI units to lorentzTransform.
        // x_metres = x_light_s · c. After transform divide back.
        const c = SPEED_OF_LIGHT;
        const xMetres = x * c;
        const { t: tP, x: xPm } = lorentzTransform(t, xMetres, beta);
        return { t: tP, x: xPm / c };
      },
    );

    // HUD
    const g = gamma(beta);
    ctx.fillStyle = "rgba(255,255,255,0.7)";
    ctx.font = "12px ui-monospace, monospace";
    ctx.fillText(`β = ${beta.toFixed(2)}    γ = ${g.toFixed(3)}`, PAD, HEIGHT - 8);
  }, [beta]);

  return (
    <div className="flex flex-col items-center gap-3 p-4">
      <canvas ref={canvasRef} className="rounded-md border border-white/10 bg-black/40" />
      <label className="flex w-full max-w-[640px] items-center gap-3 font-mono text-xs text-white/70">
        <span className="w-24">β = {beta.toFixed(2)}</span>
        <input
          type="range"
          min={0}
          max={0.95}
          step={0.01}
          value={beta}
          onChange={(e) => setBeta(parseFloat(e.target.value))}
          className="flex-1"
        />
      </label>
    </div>
  );
}

function drawPanel(
  ctx: CanvasRenderingContext2D,
  x0: number,
  y0: number,
  w: number,
  h: number,
  title: string,
  primedColor: string,
  transform: (t: number, x: number) => { t: number; x: number },
) {
  // Clip + frame
  ctx.save();
  ctx.strokeStyle = "rgba(255,255,255,0.15)";
  ctx.lineWidth = 1;
  ctx.strokeRect(x0, y0, w, h);

  // Title
  ctx.fillStyle = "rgba(255,255,255,0.55)";
  ctx.font = "11px ui-monospace, monospace";
  ctx.fillText(title, x0 + 8, y0 + 14);

  // Plot region (inside the panel, leaving room for title + axis labels).
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

  // Grid
  ctx.strokeStyle = "rgba(255,255,255,0.06)";
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

  // Axes
  ctx.strokeStyle = "rgba(255,255,255,0.5)";
  ctx.lineWidth = 1.25;
  ctx.beginPath();
  ctx.moveTo(xToPx(0), plotY);
  ctx.lineTo(xToPx(0), plotY + plotH);
  ctx.moveTo(plotX, tToPy(0));
  ctx.lineTo(plotX + plotW, tToPy(0));
  ctx.stroke();
  ctx.fillStyle = "rgba(255,255,255,0.6)";
  ctx.font = "10px ui-monospace, monospace";
  ctx.fillText("t", xToPx(0) + 4, plotY + 10);
  ctx.fillText("x", plotX + plotW - 8, tToPy(0) - 4);

  // Lab rectangle (cyan)
  ctx.strokeStyle = "#67E8F9";
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
  // Lab dots
  ctx.fillStyle = "#67E8F9";
  for (const p of RECT) {
    ctx.beginPath();
    ctx.arc(xToPx(p.x), tToPy(p.t), 2.5, 0, Math.PI * 2);
    ctx.fill();
  }

  // Transformed rectangle (primed colour)
  ctx.strokeStyle = primedColor;
  ctx.lineWidth = 1.75;
  ctx.beginPath();
  RECT.forEach((p, i) => {
    const out = transform(p.t, p.x);
    // Clamp into plot area visually if it leaves: just let it draw and rely
    // on the panel clip not being strict; transform spillage is the point.
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
