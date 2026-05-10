"use client";

import { useEffect, useRef, useState } from "react";
import {
  FONT_HUD_SMALL,
  SCENE_CANVAS_CLASS,
  applyDpr,
  drawArrow,
  drawHudReadout,
  drawSectionTitle,
  drawDivider,
  hexToRgba,
  SCENE_WIDTH_DEFAULT,
  SCENE_HEIGHT_DEFAULT,
  useSceneTokens,
  type SceneTokens,
} from "@/components/physics/_shared";

/**
 * FIG.30b — Index Transformation Scene.
 *
 * A 2D plane with a fixed vector V drawn from the origin.  Two coordinate
 * frames are shown simultaneously:
 *   • Frame S  — Cartesian x/y (CYAN axes, fixed)
 *   • Frame S' — the same frame rotated by angle θ (MAGENTA axes)
 *
 * The vector arrow (GREEN) does NOT move.  The two component readouts update
 * live in the HUD panel on the right.
 *
 * Title: "VECTOR INVARIANT, COMPONENTS CHANGE"
 */

const W = SCENE_WIDTH_DEFAULT;
const H = SCENE_HEIGHT_DEFAULT;

// Canvas geometry
const ORIGIN_X = W * 0.40;
const ORIGIN_Y = H * 0.58;
const GRID_SPACING = 52; // pixels per unit
const N_GRID_LINES = 5;
const AXIS_LEN = 200;

// The fixed vector in world space (units)
const VX = 2.0;
const VY = -1.3;

// HUD panel
const HUD_X = W * 0.68;
const HUD_Y = 28;
const HUD_W = W - HUD_X - 16;

/** Convert a hex color (#rrggbb) to "r,g,b" comma-separated string. */
function hexToRgbTriplet(hex: string): string {
  if (!hex || !hex.startsWith("#")) return "255,255,255";
  const h = hex.replace("#", "");
  const expanded = h.length === 3 ? h.split("").map((c) => c + c).join("") : h;
  if (expanded.length !== 6) return "255,255,255";
  const r = parseInt(expanded.slice(0, 2), 16);
  const g = parseInt(expanded.slice(2, 4), 16);
  const b = parseInt(expanded.slice(4, 6), 16);
  return `${r},${g},${b}`;
}

function drawFrameGrid(
  ctx: CanvasRenderingContext2D,
  angle: number,
  rgbTriplet: string,
  alpha: number,
) {
  ctx.save();
  ctx.translate(ORIGIN_X, ORIGIN_Y);
  ctx.rotate(-angle);
  ctx.strokeStyle = `rgba(${rgbTriplet},${alpha})`;
  ctx.lineWidth = 0.7;
  ctx.setLineDash([3, 5]);
  for (let i = -N_GRID_LINES; i <= N_GRID_LINES; i++) {
    const d = i * GRID_SPACING;
    ctx.beginPath();
    ctx.moveTo(d, -H);
    ctx.lineTo(d, H);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(-W, d);
    ctx.lineTo(W, d);
    ctx.stroke();
  }
  ctx.setLineDash([]);
  ctx.restore();
}

function drawFrameAxes(
  ctx: CanvasRenderingContext2D,
  angle: number,
  color: string,
  labelX: string,
  labelY: string,
) {
  ctx.save();
  ctx.translate(ORIGIN_X, ORIGIN_Y);
  ctx.rotate(-angle);

  // X axis (using manual arrowhead for rotated-frame axes)
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(-AXIS_LEN, 0);
  ctx.lineTo(AXIS_LEN - 10, 0);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(AXIS_LEN, 0);
  ctx.lineTo(AXIS_LEN - 10, -5);
  ctx.lineTo(AXIS_LEN - 10, 5);
  ctx.closePath();
  ctx.fill();
  ctx.font = `bold 11px ui-monospace, monospace`;
  ctx.textAlign = "left";
  ctx.textBaseline = "middle";
  ctx.fillText(labelX, AXIS_LEN + 4, 0);

  // Y axis
  ctx.beginPath();
  ctx.moveTo(0, AXIS_LEN);
  ctx.lineTo(0, -AXIS_LEN + 10);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(0, -AXIS_LEN);
  ctx.lineTo(-5, -AXIS_LEN + 10);
  ctx.lineTo(5, -AXIS_LEN + 10);
  ctx.closePath();
  ctx.fill();
  ctx.textAlign = "center";
  ctx.textBaseline = "bottom";
  ctx.fillText(labelY, 0, -AXIS_LEN - 3);

  ctx.restore();
}

function drawProjections(
  ctx: CanvasRenderingContext2D,
  theta: number,
  Vpx: number,
  Vpy: number,
  tokens: SceneTokens,
) {
  ctx.save();
  ctx.translate(ORIGIN_X, ORIGIN_Y);
  ctx.rotate(-theta);
  ctx.setLineDash([3, 4]);
  ctx.strokeStyle = hexToRgba(tokens.magenta, 0.45);
  ctx.lineWidth = 1;

  const tipX = Vpx * GRID_SPACING;
  const tipY = -Vpy * GRID_SPACING;

  ctx.beginPath();
  ctx.moveTo(tipX, tipY);
  ctx.lineTo(tipX, 0);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(tipX, tipY);
  ctx.lineTo(0, tipY);
  ctx.stroke();

  ctx.setLineDash([]);
  // Component ticks on rotated axes
  ctx.strokeStyle = hexToRgba(tokens.magenta, 0.85);
  ctx.lineWidth = 1.8;
  ctx.beginPath();
  ctx.moveTo(tipX, -5);
  ctx.lineTo(tipX, 5);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(-5, tipY);
  ctx.lineTo(5, tipY);
  ctx.stroke();
  ctx.restore();
}

function draw(ctx: CanvasRenderingContext2D, theta: number, tokens: SceneTokens) {
  ctx.fillStyle = tokens.bg;
  ctx.fillRect(0, 0, W, H);

  const cyanRgb = hexToRgbTriplet(tokens.cyan);
  const magentaRgb = hexToRgbTriplet(tokens.magenta);

  // ── Background grid — fixed Cartesian ─────────────────────────────────────
  drawFrameGrid(ctx, 0, cyanRgb, 0.06);
  // ── Rotated S' grid ──────────────────────────────────────────────────────
  drawFrameGrid(ctx, theta, magentaRgb, 0.10);

  // ── Axes ─────────────────────────────────────────────────────────────────
  drawFrameAxes(ctx, 0,     hexToRgba(tokens.cyan,    0.75), "x",  "y");
  drawFrameAxes(ctx, theta, hexToRgba(tokens.magenta, 0.90), "x′", "y′");

  // ── Component projections ─────────────────────────────────────────────────
  const Vpx =  Math.cos(theta) * VX + Math.sin(theta) * VY;
  const Vpy = -Math.sin(theta) * VX + Math.cos(theta) * VY;
  drawProjections(ctx, theta, Vpx, Vpy, tokens);

  // ── Vector V (GREEN, fixed) ───────────────────────────────────────────────
  const vPx = VX * GRID_SPACING;
  const vPy = VY * GRID_SPACING;
  drawArrow(
    ctx,
    ORIGIN_X, ORIGIN_Y,
    ORIGIN_X + vPx, ORIGIN_Y - vPy,
    tokens.green,
    2.5,
    10,
  );
  // Label
  ctx.save();
  ctx.font = `bold 14px ui-monospace, monospace`;
  ctx.fillStyle = tokens.green;
  ctx.textAlign = "left";
  ctx.textBaseline = "bottom";
  ctx.fillText("V", ORIGIN_X + vPx + 8, ORIGIN_Y - vPy - 4);
  ctx.restore();

  // ── Origin dot ───────────────────────────────────────────────────────────
  ctx.save();
  ctx.beginPath();
  ctx.arc(ORIGIN_X, ORIGIN_Y, 3.5, 0, Math.PI * 2);
  ctx.fillStyle = tokens.gridHeavy;
  ctx.fill();
  ctx.restore();

  // ── HUD panel ─────────────────────────────────────────────────────────────
  ctx.save();
  ctx.fillStyle = hexToRgba(tokens.bg, 0.75);
  ctx.fillRect(HUD_X, HUD_Y, HUD_W, 220);
  ctx.strokeStyle = hexToRgba(tokens.cyan, 0.12);
  ctx.lineWidth = 1;
  ctx.strokeRect(HUD_X, HUD_Y, HUD_W, 220);
  ctx.restore();

  const fmt = (n: number) => (n >= 0 ? " " : "") + n.toFixed(3);

  let hy = HUD_Y + 14;
  drawSectionTitle(ctx, HUD_X + 12, hy, "FRAME S  (fixed)", tokens.textMute);
  hy += 18;
  ctx.save();
  ctx.font = FONT_HUD_SMALL;
  ctx.fillStyle = hexToRgba(tokens.cyan, 0.55);
  ctx.textBaseline = "top";
  ctx.textAlign = "left";
  ctx.fillText("Cartesian, θ = 0", HUD_X + 12, hy);
  ctx.restore();
  hy += 18;
  hy = drawHudReadout(ctx, HUD_X + 12, hy, "V^x  = ", fmt(VX),  tokens.textDim, tokens.cyan);
  hy = drawHudReadout(ctx, HUD_X + 12, hy, "V^y  = ", fmt(VY),  tokens.textDim, tokens.cyan);

  hy += 8;
  drawDivider(ctx, HUD_X + 8, HUD_X + HUD_W - 8, hy, tokens.grid);
  hy += 10;

  drawSectionTitle(ctx, HUD_X + 12, hy, `FRAME S′  (θ = ${((theta * 180) / Math.PI).toFixed(1)}°)`, tokens.textMute);
  hy += 18;
  ctx.save();
  ctx.font = FONT_HUD_SMALL;
  ctx.fillStyle = hexToRgba(tokens.magenta, 0.55);
  ctx.textBaseline = "top";
  ctx.textAlign = "left";
  ctx.fillText("rotated frame", HUD_X + 12, hy);
  ctx.restore();
  hy += 18;
  hy = drawHudReadout(ctx, HUD_X + 12, hy, "V′^x = ", fmt(Vpx), tokens.textDim, tokens.magenta);
  hy = drawHudReadout(ctx, HUD_X + 12, hy, "V′^y = ", fmt(Vpy), tokens.textDim, tokens.magenta);

  hy += 8;
  drawDivider(ctx, HUD_X + 8, HUD_X + HUD_W - 8, hy, tokens.grid);
  hy += 10;

  drawSectionTitle(ctx, HUD_X + 12, hy, "MAGNITUDE  |V|", tokens.textMute);
  hy += 18;
  const mag = Math.hypot(VX, VY);
  drawHudReadout(ctx, HUD_X + 12, hy, "|V| = ", mag.toFixed(4), tokens.textDim, tokens.amber);

  // ── Scene title ───────────────────────────────────────────────────────────
  drawSectionTitle(ctx, 12, 12, "VECTOR INVARIANT, COMPONENTS CHANGE", tokens.textMute);

  // ── Bottom annotation ─────────────────────────────────────────────────────
  ctx.save();
  ctx.font = FONT_HUD_SMALL;
  ctx.fillStyle = tokens.textMute;
  ctx.textAlign = "center";
  ctx.textBaseline = "top";
  ctx.fillText(
    "V is fixed in the plane — only its coordinate description changes",
    ORIGIN_X,
    H - 20,
  );
  ctx.restore();
}

export function IndexTransformationScene() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const tokens = useSceneTokens();
  const [theta, setTheta] = useState(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = applyDpr(canvas, W, H);
    if (!ctx) return;
    draw(ctx, theta, tokens);
  }, [theta, tokens]);

  return (
    <div className="relative w-full">
      <canvas
        ref={canvasRef}
        className={SCENE_CANVAS_CLASS}
        aria-label="Index transformation scene: a fixed green vector V in 2D space with a cyan Cartesian frame (S) and a magenta rotated frame (S′). The HUD shows how components V^x, V^y in S and V′^x, V′^y in S′ change as the slider rotates S′, while the vector and its magnitude stay constant."
      />
      <div className="mt-3 flex items-center gap-3 font-mono text-xs text-[var(--color-fg-1)]">
        <span className="w-44 shrink-0">
          rotation θ = {((theta * 180) / Math.PI).toFixed(1)}°
        </span>
        <input
          type="range"
          min={0}
          max={2 * Math.PI}
          step={0.01}
          value={theta}
          onChange={(e) => setTheta(parseFloat(e.target.value))}
          className="flex-1"
        />
      </div>
    </div>
  );
}
