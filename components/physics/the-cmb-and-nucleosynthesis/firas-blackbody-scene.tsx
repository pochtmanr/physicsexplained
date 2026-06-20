"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  FONT_HUD,
  FONT_HUD_SMALL,
  SCENE_CANVAS_CLASS,
  SCENE_HEIGHT_DEFAULT,
  applyDpr,
  drawHudReadout,
  drawSectionTitle,
  hexToRgba,
  useSceneSize,
  useSceneTokens,
  type SceneTokens,
} from "@/components/physics/_shared/scene-tokens";
import {
  peakFrequency,
  planckByFrequency,
} from "@/lib/physics/relativity/the-cmb-and-nucleosynthesis";

/**
 * FIG.57a — The most perfect blackbody ever measured.
 *
 * Plots the Planck spectral radiance B_ν(T) against frequency (in cm⁻¹, the
 * unit FIRAS reported) for a temperature the reader controls. Overlaid are the
 * COBE/FIRAS data points at 2.725 K with error bars deliberately drawn LARGE
 * (×400) — because at true scale they are smaller than the curve's own
 * stroke width. Drag the temperature off 2.725 K and the model curve walks
 * away from the immovable data, dramatising how tightly the spectrum is fixed.
 */

// FIRAS sampled a band from ~2 to ~21 cm⁻¹; we plot a clean span around the peak.
const NU_MIN_CM = 1.0; // cm⁻¹
const NU_MAX_CM = 22.0; // cm⁻¹
const C_CM = 2.99792458e10; // speed of light in cm/s, for cm⁻¹ → Hz

// Synthetic FIRAS-like sample points (cm⁻¹). The real instrument had 43
// channels; a representative subset suffices to show "points on the line."
const FIRAS_NU_CM = [
  2.27, 3.41, 4.54, 5.68, 6.81, 7.95, 9.08, 10.22, 11.36, 12.49, 13.63, 14.76,
  15.9, 17.04, 18.17, 19.31, 20.44,
];

function nuCmToHz(nuCm: number): number {
  return nuCm * C_CM;
}

export function FirasBlackbodyScene() {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const tokens = useSceneTokens();
  const [T, setT] = useState(2.725);
  const [errScale, setErrScale] = useState(400);
  const { width, height } = useSceneSize(containerRef, {
    ratio: 0.55,
    maxHeight: SCENE_HEIGHT_DEFAULT,
    minHeight: 320,
  });

  // Data points are FIXED at the true 2.725 K spectrum.
  const data = useMemo(
    () =>
      FIRAS_NU_CM.map((nuCm) => ({
        nuCm,
        value: planckByFrequency(nuCmToHz(nuCm), 2.725),
      })),
    [],
  );

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = applyDpr(canvas, width, height);
    if (!ctx) return;
    draw(ctx, tokens, T, errScale, data, width, height);
  }, [tokens, T, errScale, data, width, height]);

  const peakGHz = peakFrequency(T) / 1e9;
  const offBy = ((T - 2.725) / 2.725) * 100;

  return (
    <div ref={containerRef} className="relative w-full pb-4">
      <canvas
        ref={canvasRef}
        style={{ width, height, display: "block" }}
        className={SCENE_CANVAS_CLASS}
        aria-label="Planck blackbody spectrum of the cosmic microwave background. A model curve at an adjustable temperature is plotted against fixed COBE/FIRAS data points at 2.725 kelvin, whose error bars are magnified to be visible."
      />
      <div className="mt-3 flex items-center gap-3 font-mono text-xs text-[var(--color-fg-2)]">
        <span className="w-44 shrink-0">
          T = {T.toFixed(3)} K
          {Math.abs(offBy) > 0.05 ? (
            <span className="text-[var(--color-red)]">
              {" "}
              ({offBy > 0 ? "+" : ""}
              {offBy.toFixed(1)}%)
            </span>
          ) : (
            <span className="text-[var(--color-mint)]"> (fit)</span>
          )}
        </span>
        <input
          type="range"
          min={2.4}
          max={3.05}
          step={0.005}
          value={T}
          onChange={(e) => setT(parseFloat(e.target.value))}
          className="flex-1"
          style={{ accentColor: "var(--color-cyan)" }}
        />
        <button
          type="button"
          className="shrink-0 cursor-pointer border border-[var(--color-fg-4)] px-2 py-0.5 text-[var(--color-fg-3)] hover:border-[var(--color-cyan)] hover:text-[var(--color-cyan)]"
          onClick={() => setT(2.725)}
        >
          reset
        </button>
      </div>
      <div className="mt-1 flex flex-wrap items-center gap-x-5 gap-y-1 font-mono text-xs text-[var(--color-fg-3)]">
        <span>peak ≈ {peakGHz.toFixed(0)} GHz</span>
        <span>error bars ×{errScale}</span>
        {[100, 400, 1000].map((s) => (
          <button
            key={s}
            type="button"
            className="cursor-pointer hover:text-[var(--color-fg-1)]"
            onClick={() => setErrScale(s)}
          >
            ×{s}
          </button>
        ))}
      </div>
    </div>
  );
}

function draw(
  ctx: CanvasRenderingContext2D,
  tokens: SceneTokens,
  T: number,
  errScale: number,
  data: { nuCm: number; value: number }[],
  W: number,
  H: number,
) {
  ctx.fillStyle = tokens.bg;
  ctx.fillRect(0, 0, W, H);

  const padL = 56;
  const padR = 18;
  const padT = 30;
  const padB = 40;
  const plotW = W - padL - padR;
  const plotH = H - padT - padB;

  drawSectionTitle(ctx, padL, padT - 20, "CMB SPECTRUM  B_ν(T)", tokens.textMute);

  // Y-scale fixed to the 2.725 K peak so the data sit comfortably.
  const yMax = planckByFrequency(peakFrequency(2.725), 2.725) * 1.12;

  const xOf = (nuCm: number) =>
    padL + ((nuCm - NU_MIN_CM) / (NU_MAX_CM - NU_MIN_CM)) * plotW;
  const yOf = (b: number) => padT + plotH - (b / yMax) * plotH;

  // ── Axes + grid ────────────────────────────────────────────────────────────
  ctx.strokeStyle = tokens.grid;
  ctx.lineWidth = 1;
  for (let g = 0; g <= 5; g++) {
    const y = padT + (g / 5) * plotH;
    ctx.beginPath();
    ctx.moveTo(padL, y);
    ctx.lineTo(padL + plotW, y);
    ctx.stroke();
  }
  for (let nu = 5; nu <= 20; nu += 5) {
    const x = xOf(nu);
    ctx.beginPath();
    ctx.moveTo(x, padT);
    ctx.lineTo(x, padT + plotH);
    ctx.stroke();
  }

  ctx.strokeStyle = tokens.axes;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(padL, padT);
  ctx.lineTo(padL, padT + plotH);
  ctx.lineTo(padL + plotW, padT + plotH);
  ctx.stroke();

  // Axis labels
  ctx.fillStyle = tokens.textMute;
  ctx.font = FONT_HUD_SMALL;
  ctx.textAlign = "center";
  ctx.textBaseline = "top";
  ctx.fillText("frequency  (cm⁻¹)", padL + plotW / 2, padT + plotH + 22);
  for (let nu = 5; nu <= 20; nu += 5) {
    ctx.fillText(String(nu), xOf(nu), padT + plotH + 6);
  }
  ctx.save();
  ctx.translate(padL - 42, padT + plotH / 2);
  ctx.rotate(-Math.PI / 2);
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("intensity  B_ν", 0, 0);
  ctx.restore();

  // ── Model Planck curve at T ────────────────────────────────────────────────
  const fit = Math.abs(T - 2.725) < 0.01;
  const curveColor = fit ? tokens.cyan : tokens.red;
  ctx.strokeStyle = curveColor;
  ctx.lineWidth = 2;
  ctx.beginPath();
  const steps = 200;
  for (let i = 0; i <= steps; i++) {
    const nuCm = NU_MIN_CM + (i / steps) * (NU_MAX_CM - NU_MIN_CM);
    const b = planckByFrequency(nuCmToHz(nuCm), T);
    const x = xOf(nuCm);
    const y = yOf(b);
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.stroke();

  // Soft fill under the model curve.
  ctx.lineTo(padL + plotW, padT + plotH);
  ctx.lineTo(padL, padT + plotH);
  ctx.closePath();
  ctx.fillStyle = hexToRgba(curveColor, 0.08);
  ctx.fill();

  // ── FIRAS data points (FIXED at 2.725 K) with magnified error bars ────────
  // A flat per-channel sigma in radiance units, magnified for visibility.
  const sigma = yMax * 0.0008 * errScale;
  for (const d of data) {
    const x = xOf(d.nuCm);
    const y = yOf(d.value);
    // error bar
    ctx.strokeStyle = tokens.amber;
    ctx.lineWidth = 1.25;
    ctx.beginPath();
    ctx.moveTo(x, y - sigma);
    ctx.lineTo(x, y + sigma);
    ctx.moveTo(x - 3, y - sigma);
    ctx.lineTo(x + 3, y - sigma);
    ctx.moveTo(x - 3, y + sigma);
    ctx.lineTo(x + 3, y + sigma);
    ctx.stroke();
    // marker
    ctx.fillStyle = tokens.amber;
    ctx.beginPath();
    ctx.arc(x, y, 2.6, 0, Math.PI * 2);
    ctx.fill();
  }

  // ── HUD ────────────────────────────────────────────────────────────────────
  let hy = padT + 6;
  hy = drawHudReadout(
    ctx,
    padL + 8,
    hy,
    "data  ",
    "COBE/FIRAS · 2.725 K",
    tokens.textDim,
    tokens.amber,
  );
  hy = drawHudReadout(
    ctx,
    padL + 8,
    hy,
    "model ",
    `${T.toFixed(3)} K`,
    tokens.textDim,
    curveColor,
  );

  // Legend note (right side)
  ctx.font = FONT_HUD;
  ctx.fillStyle = fit ? tokens.mint : tokens.red;
  ctx.textAlign = "right";
  ctx.textBaseline = "top";
  ctx.fillText(
    fit ? "curve through every point" : "model has left the data",
    padL + plotW - 4,
    padT + 6,
  );
  ctx.textAlign = "left";
}
