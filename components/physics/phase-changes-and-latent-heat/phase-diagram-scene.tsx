"use client";

import { useEffect, useRef, useState } from "react";
import {
  FONT_HUD,
  FONT_HUD_SMALL,
  SCENE_CANVAS_CLASS,
  SCENE_HEIGHT_DEFAULT,
  applyDpr,
  hexToRgba,
  drawSectionTitle,
  useSceneSize,
  useSceneTokens,
  type SceneTokens,
} from "@/components/physics/_shared/scene-tokens";
import {
  WATER,
  CO2,
  classifyPhase,
  sublimationPressure,
  vaporizationPressure,
  meltingTemperature,
  type PhaseDiagramModel,
  type Phase,
} from "@/lib/physics/thermodynamics/phase-change";

/**
 * FIG.04b — The P–T phase diagram.
 *
 * Solid, liquid, and vapour each own a region of the pressure–temperature
 * plane; the boundaries are the coexistence curves, meeting at the triple point
 * and ending (for liquid–vapour) at the critical point. Drag the marker to move
 * a sample around and read off its phase. Toggle water versus CO₂: water's
 * solid–liquid line leans *left* (negative slope — pressure melts ice, which is
 * why you can skate), while CO₂'s leans right, the normal case.
 */

interface Ranges {
  tMin: number;
  tMax: number;
  pMin: number;
  pMax: number;
}

const RANGES: Record<string, Ranges> = {
  Water: { tMin: 150, tMax: 680, pMin: 1, pMax: 5e8 },
  "CO₂": { tMin: 180, tMax: 330, pMin: 1e2, pMax: 5e7 },
};

const DEFAULT_MARKER: Record<string, { tempK: number; pressurePa: number }> = {
  Water: { tempK: 300, pressurePa: 101_325 },
  "CO₂": { tempK: 250, pressurePa: 1e6 },
};

export function PhaseDiagramScene() {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const tokens = useSceneTokens();
  const [model, setModel] = useState<PhaseDiagramModel>(WATER);
  const [marker, setMarker] = useState(DEFAULT_MARKER.Water);
  const draggingRef = useRef(false);

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
    draw(ctx, tokens, model, marker, width, height);
  }, [model, marker, tokens, width, height]);

  const plot = plotRect(width, height);
  const r = RANGES[model.name];

  const toData = (px: number, py: number) => {
    const fx = (px - plot.gx0) / (plot.gx1 - plot.gx0);
    const fy = (plot.gy1 - py) / (plot.gy1 - plot.gy0);
    const tempK = r.tMin + Math.max(0, Math.min(1, fx)) * (r.tMax - r.tMin);
    const logP =
      Math.log10(r.pMin) +
      Math.max(0, Math.min(1, fy)) * (Math.log10(r.pMax) - Math.log10(r.pMin));
    return { tempK, pressurePa: Math.pow(10, logP) };
  };

  const onPointer = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setMarker(toData(e.clientX - rect.left, e.clientY - rect.top));
  };

  const switchModel = (m: PhaseDiagramModel) => {
    setModel(m);
    setMarker(DEFAULT_MARKER[m.name]);
  };

  const phase = classifyPhase(model, marker);

  return (
    <div ref={containerRef} className="relative w-full pb-4">
      <canvas
        ref={canvasRef}
        style={{ width, height, display: "block", touchAction: "none" }}
        className={SCENE_CANVAS_CLASS}
        onPointerDown={(e) => {
          draggingRef.current = true;
          e.currentTarget.setPointerCapture(e.pointerId);
          onPointer(e);
        }}
        onPointerMove={(e) => {
          if (draggingRef.current) onPointer(e);
        }}
        onPointerUp={() => {
          draggingRef.current = false;
        }}
        aria-label="Pressure-temperature phase diagram. Drag a marker through the solid, liquid, and vapour regions to read its phase. Toggle between water, whose melting line slopes negatively, and carbon dioxide, whose melting line slopes positively."
      />
      <div className="mt-2 flex flex-wrap gap-2 font-mono text-xs">
        {[WATER, CO2].map((m) => (
          <button
            key={m.name}
            type="button"
            onClick={() => switchModel(m)}
            className="cursor-pointer rounded-sm border px-2 py-0.5"
            style={
              model.name === m.name
                ? { borderColor: "var(--color-cyan)", color: "var(--color-cyan)" }
                : { borderColor: "var(--color-fg-4)", color: "var(--color-fg-3)" }
            }
          >
            {m.name}
          </button>
        ))}
        <span className="font-mono text-xs text-[var(--color-fg-3)]">
          {marker.tempK.toFixed(0)} K · {fmtPressure(marker.pressurePa)} → {phase}
        </span>
      </div>
    </div>
  );
}

const PAD = 16;

function plotRect(W: number, H: number) {
  return {
    gx0: PAD + 38,
    gy0: PAD + 16,
    gx1: W - PAD,
    gy1: H - PAD - 20,
  };
}

function draw(
  ctx: CanvasRenderingContext2D,
  tokens: SceneTokens,
  model: PhaseDiagramModel,
  marker: { tempK: number; pressurePa: number },
  W: number,
  H: number,
) {
  ctx.fillStyle = tokens.bg;
  ctx.fillRect(0, 0, W, H);
  drawSectionTitle(ctx, PAD, 4, `PHASE DIAGRAM — ${model.name}`, tokens.textMute);

  const { gx0, gy0, gx1, gy1 } = plotRect(W, H);
  const r = RANGES[model.name];
  const logPmin = Math.log10(r.pMin);
  const logPmax = Math.log10(r.pMax);

  const xOf = (T: number) => gx0 + ((T - r.tMin) / (r.tMax - r.tMin)) * (gx1 - gx0);
  const yOf = (P: number) =>
    gy1 - ((Math.log10(P) - logPmin) / (logPmax - logPmin)) * (gy1 - gy0);

  // ── region shading via coarse grid classification ───────────────────────
  const cell = 7;
  for (let px = gx0; px < gx1; px += cell) {
    for (let py = gy0; py < gy1; py += cell) {
      const fx = (px + cell / 2 - gx0) / (gx1 - gx0);
      const fy = (gy1 - (py + cell / 2)) / (gy1 - gy0);
      const tempK = r.tMin + fx * (r.tMax - r.tMin);
      const pressurePa = Math.pow(10, logPmin + fy * (logPmax - logPmin));
      const phase = classifyPhase(model, { tempK, pressurePa });
      ctx.fillStyle = hexToRgba(phaseColor(tokens, phase), 0.16);
      ctx.fillRect(px, py, cell + 1, cell + 1);
    }
  }

  // ── boundary curves ─────────────────────────────────────────────────────
  // sublimation: tMin → triple T
  ctx.strokeStyle = tokens.textDim;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  let first = true;
  for (let T = r.tMin; T <= model.triplePoint.tempK; T += 2) {
    const P = sublimationPressure(model, T);
    if (P < r.pMin || P > r.pMax) { first = true; continue; }
    const x = xOf(T);
    const y = yOf(P);
    if (first) { ctx.moveTo(x, y); first = false; } else ctx.lineTo(x, y);
  }
  ctx.stroke();

  // vaporization: triple T → critical T
  ctx.beginPath();
  first = true;
  for (let T = model.triplePoint.tempK; T <= model.criticalPoint.tempK; T += 2) {
    const P = vaporizationPressure(model, T);
    if (P < r.pMin || P > r.pMax) { first = true; continue; }
    const x = xOf(T);
    const y = yOf(P);
    if (first) { ctx.moveTo(x, y); first = false; } else ctx.lineTo(x, y);
  }
  ctx.stroke();

  // melting: triple P → pMax (parametrise by pressure)
  ctx.beginPath();
  first = true;
  for (let lp = Math.log10(model.triplePoint.pressurePa); lp <= logPmax; lp += 0.1) {
    const P = Math.pow(10, lp);
    const T = meltingTemperature(model, P);
    if (T < r.tMin || T > r.tMax) { first = true; continue; }
    const x = xOf(T);
    const y = yOf(P);
    if (first) { ctx.moveTo(x, y); first = false; } else ctx.lineTo(x, y);
  }
  ctx.stroke();

  // ── triple + critical points ────────────────────────────────────────────
  const tp = model.triplePoint;
  const cp = model.criticalPoint;
  point(ctx, xOf(tp.tempK), yOf(tp.pressurePa), tokens.mint, "triple", tokens);
  point(ctx, xOf(cp.tempK), yOf(cp.pressurePa), tokens.magenta, "critical", tokens);

  // ── region labels ───────────────────────────────────────────────────────
  ctx.font = FONT_HUD_SMALL;
  ctx.textAlign = "center";
  labelRegion(ctx, tokens, "SOLID", xOf((r.tMin + tp.tempK) / 2), yOf(model.triplePoint.pressurePa * 30), "solid");
  labelRegion(ctx, tokens, "LIQUID", xOf((tp.tempK + cp.tempK) / 2 - 5), yOf(model.criticalPoint.pressurePa), "liquid");
  labelRegion(ctx, tokens, "VAPOR", xOf(cp.tempK), yOf(r.pMin * 8), "vapor");

  // ── axes ────────────────────────────────────────────────────────────────
  ctx.strokeStyle = tokens.axes;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(gx0, gy0);
  ctx.lineTo(gx0, gy1);
  ctx.lineTo(gx1, gy1);
  ctx.stroke();
  // pressure ticks (decades)
  ctx.fillStyle = tokens.textFaint;
  ctx.font = FONT_HUD_SMALL;
  ctx.textAlign = "right";
  for (let lp = Math.ceil(logPmin); lp <= Math.floor(logPmax); lp += 2) {
    const y = yOf(Math.pow(10, lp));
    ctx.fillText(`10^${lp}`, gx0 - 3, y + 3);
  }
  ctx.textAlign = "center";
  ctx.fillText("T (K) →", (gx0 + gx1) / 2, gy1 + 15);

  // ── marker ──────────────────────────────────────────────────────────────
  const mx = xOf(marker.tempK);
  const my = yOf(marker.pressurePa);
  const phase = classifyPhase(model, marker);
  ctx.strokeStyle = tokens.textBright;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(mx - 8, my);
  ctx.lineTo(mx + 8, my);
  ctx.moveTo(mx, my - 8);
  ctx.lineTo(mx, my + 8);
  ctx.stroke();
  ctx.fillStyle = phaseColor(tokens, phase);
  ctx.beginPath();
  ctx.arc(mx, my, 4, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = tokens.textBright;
  ctx.font = FONT_HUD;
  ctx.textAlign = "left";
  ctx.fillText(phase, mx + 10, my - 6);

  ctx.textBaseline = "alphabetic";
}

function point(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  color: string,
  label: string,
  tokens: SceneTokens,
) {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(x, y, 4, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = tokens.textMute;
  ctx.font = FONT_HUD_SMALL;
  ctx.textAlign = "left";
  ctx.fillText(label, x + 6, y + 3);
}

function labelRegion(
  ctx: CanvasRenderingContext2D,
  tokens: SceneTokens,
  text: string,
  x: number,
  y: number,
  phase: Phase,
) {
  ctx.fillStyle = hexToRgba(phaseColor(tokens, phase), 0.95);
  ctx.font = FONT_HUD_SMALL;
  ctx.textAlign = "center";
  ctx.fillText(text, x, y);
}

function phaseColor(tokens: SceneTokens, phase: Phase): string {
  switch (phase) {
    case "solid":
      return tokens.blue;
    case "liquid":
      return tokens.cyan;
    case "vapor":
      return tokens.amber;
    case "supercritical":
      return tokens.magenta;
  }
}

function fmtPressure(P: number): string {
  if (P >= 1e6) return `${(P / 1e6).toFixed(2)} MPa`;
  if (P >= 1e3) return `${(P / 1e3).toFixed(1)} kPa`;
  return `${P.toFixed(0)} Pa`;
}
