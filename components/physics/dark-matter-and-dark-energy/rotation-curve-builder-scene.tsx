"use client";

import { useEffect, useRef, useState } from "react";
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
  diskRotationSpeed,
  totalRotationSpeed,
} from "@/lib/physics/relativity/dark-matter-and-dark-energy";

/**
 * FIG.58a — Galaxy rotation curve builder.
 *
 * Plots circular speed v(r) against galactocentric radius r. Two curves:
 *   - The visible-mass (exponential disk) prediction in CYAN: it rises, peaks
 *     near the luminous edge, then falls as 1/√r — Keplerian decline.
 *   - The observed curve in AMBER, drawn flat to the edge of the data, the way
 *     Rubin measured it in the 1970s.
 * A halo slider adds an isothermal dark-matter halo (MAGENTA). As the halo mass
 * rises, the total curve (CYAN+halo, drawn solid) lifts onto a flat plateau and
 * locks onto the observed AMBER line. The reader fits the halo by eye.
 */

const PAD = 40;
const R_MAX = 24; // toy radius units (≈ kpc)
const RD = 3.2; // disk scale length
const M_DISK = 1.0;
const RC = 4.0; // halo core radius
const G_UNIT = 9000; // folds in G + normalization → km/s-like speeds

// Observed flat speed (km/s-like) the reader is trying to reproduce.
const V_FLAT_OBS = 150;

function sampleCurve(
  fn: (r: number) => number,
  rMax: number,
  n: number,
): { r: number; v: number }[] {
  const out: { r: number; v: number }[] = [];
  for (let i = 1; i <= n; i++) {
    const r = (i / n) * rMax;
    out.push({ r, v: fn(r) });
  }
  return out;
}

export function RotationCurveBuilderScene() {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const tokens = useSceneTokens();
  const [halo, setHalo] = useState(0); // 0 → 1 halo amplitude
  const { width, height } = useSceneSize(containerRef, {
    ratio: 0.58,
    maxHeight: SCENE_HEIGHT_DEFAULT,
    minHeight: 320,
  });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = applyDpr(canvas, width, height);
    if (!ctx) return;
    draw(ctx, tokens, halo, width, height);
  }, [tokens, halo, width, height]);

  // Quality-of-fit readout at the outer edge.
  const mHaloScale = halo * 60;
  const vOuter = totalRotationSpeed(R_MAX, M_DISK, RD, mHaloScale, RC, G_UNIT);
  const fitErr = Math.abs(vOuter - V_FLAT_OBS);

  return (
    <div ref={containerRef} className="relative w-full pb-4">
      <canvas
        ref={canvasRef}
        style={{ width, height, display: "block" }}
        className={SCENE_CANVAS_CLASS}
        aria-label="Galaxy rotation curve: orbital speed versus radius. The visible-mass disk prediction falls off with radius, while the observed curve stays flat. A halo slider adds dark matter to fit the flat observed curve."
      />
      <div className="mt-3 flex items-center gap-3 font-mono text-xs text-[var(--color-fg-2)]">
        <span className="w-44 shrink-0">
          dark-matter halo: {(halo * 100).toFixed(0)}%
        </span>
        <input
          type="range"
          min={0}
          max={1}
          step={0.01}
          value={halo}
          onChange={(e) => setHalo(parseFloat(e.target.value))}
          className="flex-1"
          style={{ accentColor: "var(--color-magenta)" }}
        />
        <span className="w-40 shrink-0 text-right">
          fit error: {fitErr.toFixed(0)} km/s
        </span>
      </div>
      <div className="mt-1 flex flex-wrap gap-x-6 gap-y-1 font-mono text-xs text-[var(--color-fg-3)]">
        {[
          { label: "no halo", v: 0 },
          { label: "Rubin fit", v: 0.62 },
          { label: "over-massive", v: 1 },
        ].map((p) => (
          <button
            key={p.label}
            type="button"
            className="cursor-pointer hover:text-[var(--color-fg-1)]"
            onClick={() => setHalo(p.v)}
          >
            {p.label}
          </button>
        ))}
      </div>
    </div>
  );
}

function draw(
  ctx: CanvasRenderingContext2D,
  tokens: SceneTokens,
  halo: number,
  W: number,
  H: number,
) {
  ctx.fillStyle = tokens.bg;
  ctx.fillRect(0, 0, W, H);

  const plotX0 = PAD + 12;
  const plotX1 = W - PAD * 0.5;
  const plotY0 = PAD * 0.6;
  const plotY1 = H - PAD;
  const plotW = plotX1 - plotX0;
  const plotH = plotY1 - plotY0;

  const vMax = 210;
  const xOf = (r: number) => plotX0 + (r / R_MAX) * plotW;
  const yOf = (v: number) => plotY1 - (v / vMax) * plotH;

  drawSectionTitle(ctx, plotX0, plotY0 - 16, "ORBITAL SPEED v(r)", tokens.textMute);

  // ── grid ────────────────────────────────────────────────────────────────
  ctx.strokeStyle = tokens.grid;
  ctx.lineWidth = 1;
  for (let v = 0; v <= vMax; v += 50) {
    const y = yOf(v);
    ctx.beginPath();
    ctx.moveTo(plotX0, y);
    ctx.lineTo(plotX1, y);
    ctx.stroke();
    ctx.fillStyle = tokens.textFaint;
    ctx.font = FONT_HUD_SMALL;
    ctx.textAlign = "right";
    ctx.textBaseline = "middle";
    ctx.fillText(`${v}`, plotX0 - 6, y);
  }
  for (let r = 0; r <= R_MAX; r += 4) {
    const x = xOf(r);
    ctx.strokeStyle = tokens.grid;
    ctx.beginPath();
    ctx.moveTo(x, plotY0);
    ctx.lineTo(x, plotY1);
    ctx.stroke();
    ctx.fillStyle = tokens.textFaint;
    ctx.textAlign = "center";
    ctx.textBaseline = "top";
    ctx.fillText(`${r}`, x, plotY1 + 4);
  }

  // axes
  ctx.strokeStyle = tokens.axes;
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.moveTo(plotX0, plotY0);
  ctx.lineTo(plotX0, plotY1);
  ctx.lineTo(plotX1, plotY1);
  ctx.stroke();

  ctx.fillStyle = tokens.textMute;
  ctx.font = FONT_HUD_SMALL;
  ctx.textAlign = "center";
  ctx.textBaseline = "top";
  ctx.fillText("radius  r  (kpc)", (plotX0 + plotX1) / 2, plotY1 + 18);

  // ── luminous-disk edge marker ───────────────────────────────────────────
  const rEdge = 9;
  ctx.strokeStyle = hexToRgba(tokens.textFaint, 0.8);
  ctx.setLineDash([4, 4]);
  ctx.beginPath();
  ctx.moveTo(xOf(rEdge), plotY0);
  ctx.lineTo(xOf(rEdge), plotY1);
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.fillStyle = tokens.textFaint;
  ctx.textAlign = "left";
  ctx.fillText("edge of starlight", xOf(rEdge) + 4, plotY0 + 2);

  // ── observed flat curve (AMBER) ─────────────────────────────────────────
  ctx.strokeStyle = tokens.amber;
  ctx.lineWidth = 2;
  ctx.beginPath();
  // a gently-rising-then-flat observed curve
  const obs = sampleCurve(
    (r) => V_FLAT_OBS * (1 - Math.exp(-r / 2.2)),
    R_MAX,
    120,
  );
  obs.forEach((p, i) => {
    const x = xOf(p.r);
    const y = yOf(p.v);
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  });
  ctx.stroke();
  // observed data dots
  ctx.fillStyle = tokens.amber;
  for (let r = 2; r <= R_MAX; r += 2.5) {
    const v = V_FLAT_OBS * (1 - Math.exp(-r / 2.2));
    ctx.beginPath();
    ctx.arc(xOf(r), yOf(v), 2.6, 0, Math.PI * 2);
    ctx.fill();
  }

  // ── visible-mass disk prediction (CYAN, dashed) ─────────────────────────
  ctx.strokeStyle = tokens.cyan;
  ctx.lineWidth = 1.8;
  ctx.setLineDash([6, 4]);
  ctx.beginPath();
  const disk = sampleCurve((r) => diskRotationSpeed(r, M_DISK, RD, G_UNIT), R_MAX, 160);
  disk.forEach((p, i) => {
    const x = xOf(p.r);
    const y = yOf(p.v);
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  });
  ctx.stroke();
  ctx.setLineDash([]);

  // ── halo contribution (MAGENTA, thin) ───────────────────────────────────
  const mHaloScale = halo * 60;
  if (halo > 0.001) {
    ctx.strokeStyle = hexToRgba(tokens.magenta, 0.55);
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    const haloOnly = sampleCurve(
      (r) => totalRotationSpeed(r, 0, RD, mHaloScale, RC, G_UNIT),
      R_MAX,
      160,
    );
    haloOnly.forEach((p, i) => {
      const x = xOf(p.r);
      const y = yOf(p.v);
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.stroke();
  }

  // ── total disk + halo (CYAN→MAGENTA blend, solid bold) ──────────────────
  ctx.strokeStyle = halo > 0.05 ? tokens.magenta : tokens.cyan;
  ctx.lineWidth = 2.6;
  ctx.beginPath();
  const total = sampleCurve(
    (r) => totalRotationSpeed(r, M_DISK, RD, mHaloScale, RC, G_UNIT),
    R_MAX,
    200,
  );
  total.forEach((p, i) => {
    const x = xOf(p.r);
    const y = yOf(p.v);
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  });
  ctx.stroke();

  // ── legend ──────────────────────────────────────────────────────────────
  const legX = plotX1 - 168;
  let legY = plotY0 + 6;
  const legend: [string, string][] = [
    ["observed (Rubin)", tokens.amber],
    ["visible-mass only", tokens.cyan],
    ["disk + dark halo", tokens.magenta],
  ];
  ctx.font = FONT_HUD_SMALL;
  ctx.textAlign = "left";
  ctx.textBaseline = "middle";
  for (const [label, color] of legend) {
    ctx.strokeStyle = color;
    ctx.lineWidth = 2.4;
    ctx.beginPath();
    ctx.moveTo(legX, legY);
    ctx.lineTo(legX + 18, legY);
    ctx.stroke();
    ctx.fillStyle = tokens.textDim;
    ctx.fillText(label, legX + 24, legY);
    legY += 16;
  }

  // ── HUD ─────────────────────────────────────────────────────────────────
  const vOuter = totalRotationSpeed(R_MAX, M_DISK, RD, mHaloScale, RC, G_UNIT);
  const vDiskOuter = diskRotationSpeed(R_MAX, M_DISK, RD, G_UNIT);
  let hy = plotY0 + 6;
  hy = drawHudReadout(
    ctx,
    plotX0 + 6,
    hy,
    "v(disk only) = ",
    `${vDiskOuter.toFixed(0)} km/s`,
    tokens.textDim,
    tokens.cyan,
    16,
  );
  drawHudReadout(
    ctx,
    plotX0 + 6,
    hy,
    "v(with halo) = ",
    `${vOuter.toFixed(0)} km/s`,
    tokens.textDim,
    tokens.magenta,
    16,
  );
}
