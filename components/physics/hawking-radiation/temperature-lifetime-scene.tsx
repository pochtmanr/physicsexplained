"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
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
  M_SUN,
  T_CMB,
  hawkingTemperature,
  evaporationLifetime,
} from "@/lib/physics/relativity/hawking-radiation";

/**
 * FIG.49a — Temperature & lifetime vs mass.
 *
 * A log-log explorer. The horizontal axis is black-hole mass (kg) spanning
 * primordial → supermassive. The CYAN curve is the Hawking temperature
 * T_H ∝ 1/M; the AMBER curve is the evaporation lifetime τ ∝ M³. Three labelled
 * markers (primordial, stellar, supermassive) plus a draggable cursor read out
 * the exact numbers. A dashed RED line marks the 2.725 K CMB floor: holes whose
 * T_H sits below it net-absorb today and cannot evaporate.
 */

const PAD = { l: 52, r: 16, t: 28, b: 40 };

// Mass range, in kg (log10): 1e8 .. 1e42
const LOG_M_MIN = 8;
const LOG_M_MAX = 42;

const SECONDS_PER_YEAR = 365.25 * 86400;

interface Marker {
  label: string;
  logM: number;
}

const MARKERS: Marker[] = [
  { label: "primordial", logM: Math.log10(1e12) },
  { label: "stellar", logM: Math.log10(10 * M_SUN) },
  { label: "supermassive", logM: Math.log10(4e6 * M_SUN) },
];

function fmtSci(x: number, unit: string): string {
  if (x === 0) return `0 ${unit}`;
  const exp = Math.floor(Math.log10(x));
  const mant = x / Math.pow(10, exp);
  return `${mant.toFixed(2)}×10^${exp} ${unit}`;
}

export function TemperatureLifetimeScene() {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const tokens = useSceneTokens();
  const [logM, setLogM] = useState(Math.log10(10 * M_SUN));
  const { width, height } = useSceneSize(containerRef, {
    ratio: 0.6,
    maxHeight: SCENE_HEIGHT_DEFAULT,
    minHeight: 320,
  });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = applyDpr(canvas, width, height);
    if (!ctx) return;
    draw(ctx, tokens, logM, width, height);
  }, [tokens, logM, width, height]);

  const readout = useMemo(() => {
    const M = Math.pow(10, logM);
    const T = hawkingTemperature(M);
    const tau = evaporationLifetime(M);
    return {
      M,
      T,
      tauYears: tau / SECONDS_PER_YEAR,
      hotterThanCMB: T > T_CMB,
    };
  }, [logM]);

  return (
    <div ref={containerRef} className="relative w-full pb-4">
      <canvas
        ref={canvasRef}
        style={{ width, height, display: "block" }}
        className={SCENE_CANVAS_CLASS}
        aria-label="Log-log plot of Hawking temperature and evaporation lifetime versus black-hole mass, with markers for primordial, stellar and supermassive holes and a dashed line at the 2.725 K cosmic-microwave-background temperature."
      />
      <div className="mt-3 flex items-center gap-3 font-mono text-xs text-[var(--color-fg-2)]">
        <span className="w-44 shrink-0">
          M = {fmtSci(readout.M, "kg")}
        </span>
        <input
          type="range"
          min={LOG_M_MIN}
          max={LOG_M_MAX}
          step={0.01}
          value={logM}
          onChange={(e) => setLogM(parseFloat(e.target.value))}
          className="flex-1"
          style={{ accentColor: "var(--color-cyan)" }}
          aria-label="Black-hole mass (log scale)"
        />
      </div>
      <div className="mt-1 flex flex-wrap gap-x-6 gap-y-1 font-mono text-xs text-[var(--color-fg-3)]">
        {MARKERS.map((m) => (
          <button
            key={m.label}
            type="button"
            className="cursor-pointer hover:text-[var(--color-fg-1)]"
            onClick={() => setLogM(m.logM)}
          >
            {m.label}
          </button>
        ))}
        <span
          className={
            readout.hotterThanCMB
              ? "text-[var(--color-amber)]"
              : "text-[var(--color-red)]"
          }
        >
          {readout.hotterThanCMB ? "hotter than CMB" : "colder than CMB → net-absorbs"}
        </span>
      </div>
    </div>
  );
}

function draw(
  ctx: CanvasRenderingContext2D,
  tokens: SceneTokens,
  logMsel: number,
  W: number,
  H: number,
) {
  ctx.fillStyle = tokens.bg;
  ctx.fillRect(0, 0, W, H);

  const x0 = PAD.l;
  const x1 = W - PAD.r;
  const y0 = PAD.t;
  const y1 = H - PAD.b;
  const plotW = x1 - x0;
  const plotH = y1 - y0;

  // Compute T and τ across the mass range to fix the dual log-y ranges.
  const N = 240;
  const tVals: number[] = [];
  const tauVals: number[] = [];
  for (let i = 0; i <= N; i++) {
    const logM = LOG_M_MIN + (i / N) * (LOG_M_MAX - LOG_M_MIN);
    const M = Math.pow(10, logM);
    tVals.push(Math.log10(hawkingTemperature(M)));
    tauVals.push(Math.log10(evaporationLifetime(M) / SECONDS_PER_YEAR));
  }
  const tLogMin = Math.min(...tVals);
  const tLogMax = Math.max(...tVals);
  const tauLogMin = Math.min(...tauVals);
  const tauLogMax = Math.max(...tauVals);

  const xOf = (logM: number) =>
    x0 + ((logM - LOG_M_MIN) / (LOG_M_MAX - LOG_M_MIN)) * plotW;
  // Shared vertical mapping: each curve uses its own [min,max] band but both
  // fill the full plot height so the crossing shape reads clearly.
  const yOfT = (logT: number) =>
    y1 - ((logT - tLogMin) / (tLogMax - tLogMin)) * plotH;
  const yOfTau = (logTau: number) =>
    y1 - ((logTau - tauLogMin) / (tauLogMax - tauLogMin)) * plotH;

  // ── grid (decade lines on x) ────────────────────────────────────────────
  ctx.strokeStyle = tokens.grid;
  ctx.lineWidth = 1;
  ctx.font = FONT_HUD_SMALL;
  ctx.textAlign = "center";
  ctx.textBaseline = "top";
  ctx.fillStyle = tokens.textFaint;
  for (let lm = LOG_M_MIN; lm <= LOG_M_MAX; lm += 4) {
    const px = xOf(lm);
    ctx.beginPath();
    ctx.moveTo(px, y0);
    ctx.lineTo(px, y1);
    ctx.stroke();
    ctx.fillText(`10^${lm}`, px, y1 + 6);
  }

  // axis frame
  ctx.strokeStyle = tokens.axes;
  ctx.strokeRect(x0, y0, plotW, plotH);

  // x label
  ctx.fillStyle = tokens.textMute;
  ctx.fillText("mass M  (kg, log scale)", (x0 + x1) / 2, H - 14);

  // ── CMB floor (in T mapping) ────────────────────────────────────────────
  const yCmb = yOfT(Math.log10(T_CMB));
  if (yCmb >= y0 && yCmb <= y1) {
    ctx.strokeStyle = hexToRgba(tokens.red, 0.8);
    ctx.setLineDash([5, 4]);
    ctx.beginPath();
    ctx.moveTo(x0, yCmb);
    ctx.lineTo(x1, yCmb);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = tokens.red;
    ctx.textAlign = "left";
    ctx.fillText("CMB 2.725 K", x0 + 6, yCmb - 14);
  }

  // ── temperature curve (CYAN) ────────────────────────────────────────────
  ctx.strokeStyle = tokens.cyan;
  ctx.lineWidth = 2;
  ctx.beginPath();
  for (let i = 0; i <= N; i++) {
    const logM = LOG_M_MIN + (i / N) * (LOG_M_MAX - LOG_M_MIN);
    const px = xOf(logM);
    const py = yOfT(tVals[i]);
    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.stroke();

  // ── lifetime curve (AMBER) ──────────────────────────────────────────────
  ctx.strokeStyle = tokens.amber;
  ctx.lineWidth = 2;
  ctx.beginPath();
  for (let i = 0; i <= N; i++) {
    const logM = LOG_M_MIN + (i / N) * (LOG_M_MAX - LOG_M_MIN);
    const px = xOf(logM);
    const py = yOfTau(tauVals[i]);
    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.stroke();

  // ── markers ─────────────────────────────────────────────────────────────
  for (const m of MARKERS) {
    const px = xOf(m.logM);
    ctx.strokeStyle = hexToRgba(tokens.textFaint, 0.6);
    ctx.setLineDash([2, 3]);
    ctx.beginPath();
    ctx.moveTo(px, y0);
    ctx.lineTo(px, y1);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = tokens.textMute;
    ctx.save();
    ctx.translate(px + 4, y0 + 4);
    ctx.textAlign = "left";
    ctx.textBaseline = "top";
    ctx.fillText(m.label, 0, 0);
    ctx.restore();
  }

  // ── selected-mass cursor ────────────────────────────────────────────────
  const pxSel = xOf(logMsel);
  const M = Math.pow(10, logMsel);
  const logT = Math.log10(hawkingTemperature(M));
  const logTau = Math.log10(evaporationLifetime(M) / SECONDS_PER_YEAR);
  ctx.strokeStyle = hexToRgba(tokens.textBright, 0.55);
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(pxSel, y0);
  ctx.lineTo(pxSel, y1);
  ctx.stroke();

  // dots on each curve
  const drawDot = (py: number, color: string) => {
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(pxSel, py, 4, 0, Math.PI * 2);
    ctx.fill();
  };
  drawDot(yOfT(logT), tokens.cyan);
  drawDot(yOfTau(logTau), tokens.amber);

  // ── legend / titles ─────────────────────────────────────────────────────
  drawSectionTitle(ctx, x0, 6, "T_H ∝ 1/M", tokens.cyan);
  ctx.textAlign = "right";
  ctx.font = "11px ui-monospace, monospace";
  ctx.fillStyle = tokens.amber;
  ctx.fillText("τ ∝ M³  (years)", x1 - 2, 8);

  // ── HUD readouts (top-right, inside) ────────────────────────────────────
  const hudX = x1 - 168;
  let hy = y0 + 8;
  ctx.textAlign = "left";
  hy = drawHudReadout(
    ctx,
    hudX,
    hy,
    "T_H = ",
    fmtSci(hawkingTemperature(M), "K"),
    tokens.textDim,
    tokens.cyan,
  );
  drawHudReadout(
    ctx,
    hudX,
    hy,
    "τ = ",
    fmtSci(evaporationLifetime(M) / SECONDS_PER_YEAR, "yr"),
    tokens.textDim,
    tokens.amber,
  );

  ctx.textAlign = "left";
  ctx.textBaseline = "alphabetic";
}
