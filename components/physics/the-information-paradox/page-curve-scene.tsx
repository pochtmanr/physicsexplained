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
  hawkingRadiationEntropy,
  pageCurveSmooth,
  PAGE_FRACTION,
} from "@/lib/physics/relativity/the-information-paradox";

/**
 * FIG.60a — The Page curve.
 *
 * Entanglement entropy of the Hawking radiation, S_rad, plotted against the
 * fraction of the hole that has evaporated (x-axis = radiated entropy fraction
 * f ∈ [0,1]; the hole is whole at f=0, gone at f=1).
 *
 * - HAWKING's line (AMBER): S_rad = f, rising monotonically to its maximum. A
 *   nonzero endpoint means a pure state has become mixed → information lost.
 * - PAGE's curve (CYAN): S_rad = min(f, 1−f) rounded — rises, turns over at the
 *   Page time (f=1/2), falls back to 0 → final state is pure.
 *
 * A draggable time cursor sweeps f; the HUD reads off both entropies and the
 * gap between them (the "missing information"). The Page time is marked with a
 * vertical guide.
 */

const PAD_L = 52;
const PAD_R = 18;
const PAD_T = 30;
const PAD_B = 40;

export function PageCurveScene() {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const tokens = useSceneTokens();
  const [f, setF] = useState(0.62);
  const { width, height } = useSceneSize(containerRef, {
    ratio: 0.6,
    maxHeight: SCENE_HEIGHT_DEFAULT,
    minHeight: 300,
  });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = applyDpr(canvas, width, height);
    if (!ctx) return;
    draw(ctx, tokens, f, width, height);
  }, [tokens, f, width, height]);

  const sHawking = hawkingRadiationEntropy(f);
  const sPage = pageCurveSmooth(f);
  const gap = Math.max(0, sHawking - sPage);
  const phase = f < PAGE_FRACTION ? "before Page time" : "after Page time";

  return (
    <div ref={containerRef} className="relative w-full pb-4">
      <canvas
        ref={canvasRef}
        style={{ width, height, display: "block" }}
        className={SCENE_CANVAS_CLASS}
        aria-label="Plot of radiation entanglement entropy versus evaporated fraction. Hawking's line rises monotonically to its maximum; the Page curve rises then falls back to zero at full evaporation, crossing over at the Page time."
      />
      <div className="mt-3 flex items-center gap-3 font-mono text-xs text-[var(--color-fg-2)]">
        <span className="w-44 shrink-0">
          evaporated: {(f * 100).toFixed(0)}% — {phase}
        </span>
        <input
          type="range"
          min={0}
          max={1}
          step={0.005}
          value={f}
          onChange={(e) => setF(parseFloat(e.target.value))}
          className="flex-1"
          style={{ accentColor: "var(--color-cyan)" }}
        />
      </div>
      <div className="mt-1 flex flex-wrap gap-x-6 gap-y-1 font-mono text-xs text-[var(--color-fg-3)]">
        <span style={{ color: "var(--color-amber)" }}>
          Hawking S_rad: {sHawking.toFixed(2)}
        </span>
        <span style={{ color: "var(--color-cyan)" }}>
          Page S_rad: {sPage.toFixed(2)}
        </span>
        <span>missing info: {gap.toFixed(2)}</span>
        <button
          type="button"
          className="cursor-pointer hover:text-[var(--color-fg-1)]"
          onClick={() => setF(PAGE_FRACTION)}
        >
          jump to Page time
        </button>
      </div>
    </div>
  );
}

function plotX(f: number, W: number): number {
  return PAD_L + f * (W - PAD_L - PAD_R);
}
/** s ∈ [0,1] mapped so 1.0 sits near the top. */
function plotY(s: number, H: number): number {
  const top = PAD_T;
  const bot = H - PAD_B;
  return bot - s * (bot - top);
}

function draw(
  ctx: CanvasRenderingContext2D,
  tokens: SceneTokens,
  f: number,
  W: number,
  H: number,
) {
  ctx.fillStyle = tokens.bg;
  ctx.fillRect(0, 0, W, H);

  drawSectionTitle(ctx, PAD_L, 8, "S_rad  vs  EVAPORATED FRACTION", tokens.textMute);

  const x0 = PAD_L;
  const x1 = W - PAD_R;
  const yTop = plotY(1, H);
  const yBot = plotY(0, H);

  // ── grid ──────────────────────────────────────────────────────────────────
  ctx.strokeStyle = tokens.grid;
  ctx.lineWidth = 1;
  ctx.font = FONT_HUD_SMALL;
  ctx.fillStyle = tokens.textFaint;
  ctx.textAlign = "right";
  ctx.textBaseline = "middle";
  for (const s of [0, 0.25, 0.5, 0.75, 1]) {
    const y = plotY(s, H);
    ctx.beginPath();
    ctx.moveTo(x0, y);
    ctx.lineTo(x1, y);
    ctx.stroke();
    ctx.fillText(s.toFixed(2), x0 - 8, y);
  }
  ctx.textAlign = "center";
  ctx.textBaseline = "top";
  for (const fx of [0, 0.25, 0.5, 0.75, 1]) {
    const x = plotX(fx, W);
    ctx.fillText(fx.toFixed(2), x, yBot + 6);
  }

  // axes
  ctx.strokeStyle = tokens.axes;
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.moveTo(x0, yTop);
  ctx.lineTo(x0, yBot);
  ctx.lineTo(x1, yBot);
  ctx.stroke();

  // axis labels
  ctx.fillStyle = tokens.textMute;
  ctx.font = FONT_HUD_SMALL;
  ctx.textAlign = "center";
  ctx.textBaseline = "top";
  ctx.fillText("evaporated fraction  f", (x0 + x1) / 2, H - 16);
  ctx.save();
  ctx.translate(14, (yTop + yBot) / 2);
  ctx.rotate(-Math.PI / 2);
  ctx.textBaseline = "middle";
  ctx.fillText("entanglement entropy  S_rad", 0, 0);
  ctx.restore();

  // ── Page-time guide ─────────────────────────────────────────────────────────
  const xPage = plotX(PAGE_FRACTION, W);
  ctx.strokeStyle = hexToRgba(tokens.textFaint, 0.9);
  ctx.setLineDash([4, 4]);
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(xPage, yTop);
  ctx.lineTo(xPage, yBot);
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.fillStyle = tokens.textMute;
  ctx.font = FONT_HUD_SMALL;
  ctx.textAlign = "center";
  ctx.textBaseline = "bottom";
  ctx.fillText("Page time", xPage, yTop - 2);

  // ── Hawking line (AMBER) ────────────────────────────────────────────────────
  plotCurve(ctx, W, H, hawkingRadiationEntropy, tokens.amber, 2);
  // ── Page curve (CYAN) ───────────────────────────────────────────────────────
  plotCurve(ctx, W, H, (x) => pageCurveSmooth(x), tokens.cyan, 2.4);

  // shade the gap (missing information) up to current f
  ctx.fillStyle = hexToRgba(tokens.red, 0.14);
  ctx.beginPath();
  const steps = 60;
  for (let i = 0; i <= steps; i++) {
    const ff = (i / steps) * f;
    ctx.lineTo(plotX(ff, W), plotY(hawkingRadiationEntropy(ff), H));
  }
  for (let i = steps; i >= 0; i--) {
    const ff = (i / steps) * f;
    ctx.lineTo(plotX(ff, W), plotY(pageCurveSmooth(ff), H));
  }
  ctx.closePath();
  ctx.fill();

  // ── time cursor ─────────────────────────────────────────────────────────────
  const xc = plotX(f, W);
  ctx.strokeStyle = hexToRgba(tokens.textBright, 0.55);
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(xc, yTop);
  ctx.lineTo(xc, yBot);
  ctx.stroke();

  const yH = plotY(hawkingRadiationEntropy(f), H);
  const yP = plotY(pageCurveSmooth(f), H);
  dot(ctx, xc, yH, tokens.amber);
  dot(ctx, xc, yP, tokens.cyan);

  // ── legend ──────────────────────────────────────────────────────────────────
  ctx.font = FONT_HUD;
  ctx.textBaseline = "middle";
  ctx.textAlign = "left";
  const lx = x0 + 14;
  let ly = yTop + 10;
  legendRow(ctx, lx, ly, tokens.amber, "Hawking — info lost", tokens.textDim);
  ly += 18;
  legendRow(ctx, lx, ly, tokens.cyan, "Page — unitary", tokens.textDim);
}

function plotCurve(
  ctx: CanvasRenderingContext2D,
  W: number,
  H: number,
  fn: (f: number) => number,
  color: string,
  lw: number,
) {
  ctx.strokeStyle = color;
  ctx.lineWidth = lw;
  ctx.beginPath();
  const steps = 200;
  for (let i = 0; i <= steps; i++) {
    const f = i / steps;
    const x = plotX(f, W);
    const y = plotY(fn(f), H);
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.stroke();
}

function dot(ctx: CanvasRenderingContext2D, x: number, y: number, color: string) {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(x, y, 3.5, 0, Math.PI * 2);
  ctx.fill();
}

function legendRow(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  swatch: string,
  label: string,
  textColor: string,
) {
  ctx.strokeStyle = swatch;
  ctx.lineWidth = 2.4;
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(x + 18, y);
  ctx.stroke();
  ctx.fillStyle = textColor;
  ctx.textAlign = "left";
  ctx.textBaseline = "middle";
  ctx.fillText(label, x + 24, y);
}
