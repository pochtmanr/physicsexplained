"use client";

import { useEffect, useRef, useState } from "react";
import {
  FONT_HUD_SMALL,
  SCENE_CANVAS_CLASS,
  SCENE_HEIGHT_TALL,
  applyDpr,
  hexToRgba,
  drawSectionTitle,
  useSceneSize,
  useSceneTokens,
  type SceneTokens,
} from "@/components/physics/_shared/scene-tokens";
import {
  outgoingLightConeSlope,
  metricFactor,
} from "@/lib/physics/relativity/the-event-horizon";
import { Button } from "@/components/ui/button";

/**
 * FIG.44b — Light cones tipping over.
 *
 * A (c t, r) Schwarzschild diagram with r on the horizontal axis (in units of
 * r_s) and time upward. At a row of sample radii we draw the future light
 * cone: the outgoing edge has coordinate slope dt/dr = 1/(1 − 1/x) and the
 * ingoing edge slope −1. Far from the hole (x ≫ 1) both edges open at 45° — a
 * symmetric cone. As x → 1 the OUTGOING edge tips toward vertical: at the
 * horizon it is exactly vertical, so "outward" no longer points to larger r.
 * Inside the horizon both edges lean inward — every future-directed path leads
 * to smaller r. A slider drops a highlighted "probe" cone you can slide from
 * x = 3 in to x = 0.4 and watch tip past vertical.
 */

const PAD = 22;

export function LightConeTiltScene() {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const tokens = useSceneTokens();
  const [probe, setProbe] = useState(2.2);
  const { width, height } = useSceneSize(containerRef, {
    ratio: 0.62,
    maxHeight: SCENE_HEIGHT_TALL,
    minHeight: 340,
  });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = applyDpr(canvas, width, height);
    if (!ctx) return;
    draw(ctx, tokens, probe, width, height);
  }, [tokens, probe, width, height]);

  const slope = outgoingLightConeSlope(probe);
  const inside = probe < 1;

  return (
    <div ref={containerRef} className="relative w-full pb-4">
      <canvas
        ref={canvasRef}
        style={{ width, height, display: "block" }}
        className={SCENE_CANVAS_CLASS}
        aria-label="A spacetime diagram showing future light cones at several radii outside and inside a black hole horizon. The outgoing edge of each cone tips toward vertical as the horizon is approached and leans inward beyond it."
      />
      <div className="mt-3 flex items-center gap-3 font-mono text-xs text-[var(--color-fg-2)]">
        <span className="w-44 shrink-0">probe r / r_s = {probe.toFixed(2)}</span>
        <input
          type="range"
          min={0.4}
          max={3}
          step={0.01}
          value={probe}
          onChange={(e) => setProbe(parseFloat(e.target.value))}
          className="flex-1"
          style={{ accentColor: "var(--color-cyan)" }}
        />
      </div>
      <div className="mt-1 flex flex-wrap gap-x-6 gap-y-1 font-mono text-xs text-[var(--color-fg-3)]">
        <span>
          outgoing slope dt/dr = {Number.isFinite(slope) ? slope.toFixed(2) : "∞"}
        </span>
        <span>{inside ? "inside — both edges point inward" : "outside — light can still escape"}</span>
        <Button size="sm" onClick={() => setProbe(1)}>
          at the horizon
        </Button>
      </div>
    </div>
  );
}

/** Draw one future light cone at (cx, cy) with given pixel half-widths.
 *  outDx/outDy is the outgoing edge direction (toward larger r), inDx/inDy the
 *  ingoing edge (toward smaller r). h is the vertical reach in px. */
function drawCone(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  outSlope: number, // dt/dr for outgoing (Infinity allowed)
  pxPerR: number,
  h: number,
  color: string,
  fillAlpha: number,
) {
  // Outgoing edge: moving +dr changes t by outSlope*dr. On screen, +r is +x,
  // +t is −y. Pick the vertical reach h and back out the horizontal run.
  // run_out = h / (pxPerT_per_R * outSlope)... we instead parameterize by the
  // angle from vertical. Slope dt/dr = outSlope means for a horizontal step Δr
  // (pixels Δr*pxPerR) the time rises outSlope*Δr (pixels same scale).
  // Use equal px scale for r and t so slope reads as geometric slope.
  const reach = h;
  // outgoing edge endpoint
  let oxRun: number;
  if (!Number.isFinite(outSlope)) {
    oxRun = 0; // vertical
  } else {
    oxRun = reach / outSlope; // horizontal pixels for `reach` vertical pixels
  }
  // ingoing edge: slope −1 toward smaller r → endpoint to the left
  const inRun = reach; // |slope| = 1

  const top = cy - reach;
  // fill the cone wedge between ingoing (left) and outgoing (right) edges
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(cx, cy);
  ctx.lineTo(cx - inRun, top);
  ctx.lineTo(cx + oxRun, top);
  ctx.closePath();
  ctx.fillStyle = hexToRgba(color, fillAlpha);
  ctx.fill();

  // edges
  ctx.strokeStyle = color;
  ctx.lineWidth = 1.6;
  // ingoing edge
  ctx.beginPath();
  ctx.moveTo(cx, cy);
  ctx.lineTo(cx - inRun, top);
  ctx.stroke();
  // outgoing edge
  ctx.beginPath();
  ctx.moveTo(cx, cy);
  ctx.lineTo(cx + oxRun, top);
  ctx.stroke();
  ctx.restore();
}

function draw(
  ctx: CanvasRenderingContext2D,
  tokens: SceneTokens,
  probe: number,
  W: number,
  H: number,
) {
  ctx.fillStyle = tokens.bg;
  ctx.fillRect(0, 0, W, H);

  const plotX0 = PAD + 10;
  const plotX1 = W - PAD;
  const plotY0 = PAD + 18;
  const plotY1 = H - PAD - 18;
  const plotW = plotX1 - plotX0;

  const xMax = 3; // r/r_s shown
  const pxPerR = plotW / xMax;
  const rToPx = (rr: number) => plotX0 + rr * pxPerR;

  drawSectionTitle(ctx, plotX0, PAD, "ct  ↑     vs    r / r_s  →", tokens.textMute);

  // grid lines at integer r
  ctx.strokeStyle = tokens.grid;
  ctx.lineWidth = 1;
  for (let i = 0; i <= xMax; i++) {
    const gx = rToPx(i);
    ctx.beginPath();
    ctx.moveTo(gx, plotY0);
    ctx.lineTo(gx, plotY1);
    ctx.stroke();
    ctx.fillStyle = tokens.textFaint;
    ctx.font = FONT_HUD_SMALL;
    ctx.textAlign = "center";
    ctx.textBaseline = "top";
    if (i > 0) ctx.fillText(`${i}`, gx, plotY1 + 4);
  }

  // horizon band x < 1 shaded, vertical horizon line at x = 1
  const hx = rToPx(1);
  ctx.fillStyle = hexToRgba(tokens.textBright, 0.05);
  ctx.fillRect(plotX0, plotY0, hx - plotX0, plotY1 - plotY0);
  ctx.strokeStyle = tokens.amber;
  ctx.setLineDash([5, 4]);
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  ctx.moveTo(hx, plotY0);
  ctx.lineTo(hx, plotY1);
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.fillStyle = tokens.amber;
  ctx.textAlign = "center";
  ctx.textBaseline = "bottom";
  ctx.fillText("HORIZON", hx, plotY0 - 2);

  // singularity edge at r = 0
  ctx.strokeStyle = hexToRgba(tokens.red, 0.8);
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(plotX0, plotY0);
  ctx.lineTo(plotX0, plotY1);
  ctx.stroke();
  ctx.save();
  ctx.translate(plotX0 - 4, (plotY0 + plotY1) / 2);
  ctx.rotate(-Math.PI / 2);
  ctx.fillStyle = tokens.red;
  ctx.textAlign = "center";
  ctx.textBaseline = "bottom";
  ctx.fillText("r = 0  singularity", 0, 0);
  ctx.restore();

  // row of static sample cones
  const coneH = Math.min(58, (plotY1 - plotY0) / 4);
  const rowY = plotY0 + (plotY1 - plotY0) * 0.5;
  const samples = [2.6, 1.8, 1.25, 1.0, 0.7, 0.45];
  for (const s of samples) {
    if (s < 0.2 || s > xMax) continue;
    const cx = rToPx(s);
    const slope = outgoingLightConeSlope(s);
    const f = metricFactor(s);
    // inside the horizon the outgoing edge actually leans the other way:
    // both edges tip toward smaller r. Model that by a negative oxRun.
    const cone = (color: string) =>
      drawConeAware(ctx, cx, rowY, slope, f, coneH, color, 0.1);
    cone(s < 1 ? tokens.red : tokens.cyan);
  }

  // probe cone — highlighted, draggable
  const pcx = rToPx(probe);
  const pSlope = outgoingLightConeSlope(probe);
  const pf = metricFactor(probe);
  drawConeAware(ctx, pcx, rowY, pSlope, pf, coneH * 1.15, tokens.magenta, 0.22);
  ctx.fillStyle = tokens.magenta;
  ctx.font = FONT_HUD_SMALL;
  ctx.textAlign = "center";
  ctx.textBaseline = "top";
  ctx.fillText("probe", pcx, rowY + coneH * 1.15 + 4);
}

/** Cone that understands inside vs outside: outside, outgoing edge slope is
 *  +1/f and points to larger r; inside (f<0) both edges point to smaller r. */
function drawConeAware(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  outSlope: number,
  f: number,
  h: number,
  color: string,
  fillAlpha: number,
) {
  if (f > 0) {
    // outside: ingoing edge to the left (slope -1), outgoing to the right
    drawCone(ctx, cx, cy, outSlope, 1, h, color, fillAlpha);
    return;
  }
  // inside the horizon: both edges tip toward smaller r (left). The cone is a
  // narrow wedge opening up-and-left; "future" = smaller r.
  const reach = h;
  // ingoing edge keeps slope -1 (sharp left). outgoing edge slope = 1/f < 0,
  // so for a vertical rise `reach`, horizontal run = reach/|outSlope| to the
  // LEFT (because slope is negative → +t needs −r).
  const outRun = Number.isFinite(outSlope)
    ? reach / Math.abs(outSlope)
    : 0;
  const top = cy - reach;
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(cx, cy);
  ctx.lineTo(cx - reach, top); // ingoing, far left
  ctx.lineTo(cx - outRun, top); // "outgoing", also left
  ctx.closePath();
  ctx.fillStyle = hexToRgba(color, fillAlpha);
  ctx.fill();
  ctx.strokeStyle = color;
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  ctx.moveTo(cx, cy);
  ctx.lineTo(cx - reach, top);
  ctx.moveTo(cx, cy);
  ctx.lineTo(cx - outRun, top);
  ctx.stroke();
  ctx.restore();
}
