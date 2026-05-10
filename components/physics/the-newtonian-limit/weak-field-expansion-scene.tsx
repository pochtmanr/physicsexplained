"use client";

import { useEffect, useRef, useState } from "react";
import {
  h00FromPotential,
  weakFieldG00,
} from "@/lib/physics/relativity/newtonian-limit";
import { SPEED_OF_LIGHT } from "@/lib/physics/constants";
import {
  applyDpr,
  SCENE_CANVAS_CLASS,
  FONT_HUD,
  FONT_HUD_SMALL,
  drawHudReadout,
  drawSectionTitle,
  drawDivider,
  hexToRgba,
  SCENE_HEIGHT_DEFAULT,
  useSceneSize,
  useSceneTokens,
  type SceneTokens,
} from "@/components/physics/_shared/scene-tokens";

/**
 * WEAK-FIELD EXPANSION SCENE — §08 THE NEWTONIAN LIMIT
 *
 * Slider: ε = h_{00}/2 (dimensionless strain). At ε = 0 the metric is flat η.
 * At small ε the perturbation h_{00} = −2ε is tiny. At ε → 1 the linear
 * approximation formally breaks and the metric becomes degenerate.
 *
 * The canvas shows:
 *   - g_{00} vs ε plot: exact value (CYAN dot) + linear approximation (CYAN line)
 *   - 4×4 metric matrix with g_{00} highlighted in AMBER
 *   - HUD readout via drawHudReadout: "g_{00} = {value}" (CYAN)
 *   - drawSectionTitle "WEAK-FIELD METRIC"
 */

// Reference potentials Φ/c² for physical anchors
const ANCHORS = [
  { label: "Earth surface", eps: 6.25e7 / (SPEED_OF_LIGHT * SPEED_OF_LIGHT) },
  { label: "Solar surface", eps: 1.905e11 / (SPEED_OF_LIGHT * SPEED_OF_LIGHT) },
  { label: "Neutron star", eps: 0.15 },
  { label: "BH horizon", eps: 0.5 },
];

function drawMatrix(
  ctx: CanvasRenderingContext2D,
  g00: number,
  cx: number,
  cy: number,
  cellSize: number,
  eps: number,
  tokens: SceneTokens,
) {
  const labels = ["0", "1", "2", "3"];
  const off = cellSize * 2.6;
  const intensity = Math.min(1, eps / 0.5);

  // Row and column index labels
  ctx.fillStyle = tokens.textFaint;
  ctx.font = FONT_HUD_SMALL;
  ctx.textBaseline = "middle";
  for (let i = 0; i < 4; i++) {
    ctx.textAlign = "center";
    ctx.fillText(labels[i], cx + i * cellSize - off + cellSize / 2 - 4, cy - off - 10);
    ctx.textAlign = "right";
    ctx.fillText(labels[i], cx - off - 8, cy + i * cellSize - off + cellSize / 2);
  }
  ctx.textBaseline = "alphabetic";

  // Matrix bracket lines
  ctx.strokeStyle = hexToRgba(tokens.amber, 0.25);
  ctx.lineWidth = 1.5;
  const x0 = cx - off;
  const y0 = cy - off;
  const totalSide = cellSize * 4;
  // Left bracket
  ctx.beginPath();
  ctx.moveTo(x0 - 6, y0);
  ctx.lineTo(x0 - 14, y0);
  ctx.lineTo(x0 - 14, y0 + totalSide);
  ctx.lineTo(x0 - 6, y0 + totalSide);
  ctx.stroke();
  // Right bracket
  ctx.beginPath();
  ctx.moveTo(x0 + totalSide + 6, y0);
  ctx.lineTo(x0 + totalSide + 14, y0);
  ctx.lineTo(x0 + totalSide + 14, y0 + totalSide);
  ctx.lineTo(x0 + totalSide + 6, y0 + totalSide);
  ctx.stroke();

  // Draw cells
  for (let mu = 0; mu < 4; mu++) {
    for (let nu = 0; nu < 4; nu++) {
      const px = cx + nu * cellSize - off;
      const py = cy + mu * cellSize - off;

      let value: string;
      let cellColor: string;

      if (mu === 0 && nu === 0) {
        value = g00.toFixed(6);
        cellColor = hexToRgba(tokens.amber, 0.08 + intensity * 0.22);
        ctx.strokeStyle = hexToRgba(tokens.amber, 0.3 + intensity * 0.45);
      } else if (mu === nu) {
        value = "−1";
        cellColor = hexToRgba(tokens.cyan, 0.05);
        ctx.strokeStyle = hexToRgba(tokens.cyan, 0.18);
      } else {
        value = "0";
        cellColor = hexToRgba(tokens.textBright, 0.02);
        ctx.strokeStyle = tokens.grid;
      }

      ctx.fillStyle = cellColor;
      ctx.fillRect(px, py, cellSize - 2, cellSize - 2);
      ctx.lineWidth = 0.8;
      ctx.strokeRect(px, py, cellSize - 2, cellSize - 2);

      ctx.fillStyle =
        mu === 0 && nu === 0
          ? tokens.amber
          : mu === nu
          ? tokens.cyan
          : tokens.textFaint;
      ctx.font = mu === 0 && nu === 0 ? `bold ${FONT_HUD_SMALL}` : FONT_HUD_SMALL;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(value, px + (cellSize - 2) / 2, py + (cellSize - 2) / 2);
      ctx.textBaseline = "alphabetic";
    }
  }
  ctx.textAlign = "left";
}

function draw(
  ctx: CanvasRenderingContext2D,
  eps: number,
  g00: number,
  h00: number,
  tokens: SceneTokens,
  W: number,
  H: number,
) {
  ctx.fillStyle = tokens.bg;
  ctx.fillRect(0, 0, W, H);

  // ── Section title ──────────────────────────────────────────────────────
  drawSectionTitle(ctx, 16, 14, "WEAK-FIELD METRIC", tokens.textMute);

  // ── Main label ─────────────────────────────────────────────────────────
  ctx.font = FONT_HUD;
  ctx.fillStyle = tokens.textDim;
  ctx.textAlign = "left";
  ctx.textBaseline = "top";
  ctx.fillText("g\u{5F}\u{7B}\u{03BC}\u{03BD}\u{7D} = \u{03B7}\u{5F}\u{7B}\u{03BC}\u{03BD}\u{7D} + h\u{5F}\u{7B}\u{03BC}\u{03BD}\u{7D}", 16, 32);
  ctx.textBaseline = "alphabetic";

  // ── 4×4 matrix (left side) ─────────────────────────────────────────────
  const CELL = Math.min(52, Math.max(36, (W * 0.35) / 4 - 8));
  const matrixCX = Math.max(120, W * 0.21);
  const matrixCY = H * 0.51;
  drawMatrix(ctx, g00, matrixCX, matrixCY, CELL, eps, tokens);

  // ── Plot: g_{00} vs ε (right side) ─────────────────────────────────────
  const plotX = Math.max(280, W * 0.44);
  const plotY = 48;
  const plotW = W - plotX - 24;
  const plotH = H - plotY - 80;

  // Plot border
  ctx.strokeStyle = tokens.grid;
  ctx.lineWidth = 1;
  ctx.strokeRect(plotX, plotY, plotW, plotH);

  // Axis labels
  ctx.fillStyle = tokens.textMute;
  ctx.font = FONT_HUD_SMALL;
  ctx.textAlign = "center";
  ctx.fillText("ε = h\u{5F}{00}/2", plotX + plotW / 2, plotY + plotH + 18);
  ctx.save();
  ctx.translate(plotX - 18, plotY + plotH / 2);
  ctx.rotate(-Math.PI / 2);
  ctx.fillText("g\u{5F}{00}", 0, 0);
  ctx.restore();

  // Grid lines
  const epsMax = 0.5;
  const g00Min = 1 - 2 * epsMax - 0.05;
  const g00Max = 1.05;

  function epsToPlotX(e: number): number {
    return plotX + (e / epsMax) * plotW;
  }
  function g00ToPlotY(g: number): number {
    return plotY + plotH - ((g - g00Min) / (g00Max - g00Min)) * plotH;
  }

  // Tick lines (x)
  [0, 0.1, 0.2, 0.3, 0.4, 0.5].forEach((e) => {
    const tx = epsToPlotX(e);
    ctx.strokeStyle = tokens.grid;
    ctx.lineWidth = 0.5;
    ctx.beginPath();
    ctx.moveTo(tx, plotY);
    ctx.lineTo(tx, plotY + plotH);
    ctx.stroke();
    ctx.fillStyle = tokens.textFaint;
    ctx.font = FONT_HUD_SMALL;
    ctx.textAlign = "center";
    ctx.fillText(e.toFixed(1), tx, plotY + plotH + 10);
  });

  // Tick lines (y): g_{00} = 1, 0.5, 0
  [1.0, 0.5, 0.0].forEach((g) => {
    const ty = g00ToPlotY(g);
    if (ty < plotY || ty > plotY + plotH) return;
    ctx.strokeStyle = tokens.grid;
    ctx.lineWidth = 0.5;
    ctx.beginPath();
    ctx.moveTo(plotX, ty);
    ctx.lineTo(plotX + plotW, ty);
    ctx.stroke();
    ctx.fillStyle = tokens.textFaint;
    ctx.font = FONT_HUD_SMALL;
    ctx.textAlign = "right";
    ctx.fillText(g.toFixed(1), plotX - 4, ty + 4);
  });

  // g_{00} = 1 reference line (flat spacetime)
  const refY = g00ToPlotY(1.0);
  ctx.strokeStyle = hexToRgba(tokens.textBright, 0.15);
  ctx.lineWidth = 1;
  ctx.setLineDash([4, 4]);
  ctx.beginPath();
  ctx.moveTo(plotX, refY);
  ctx.lineTo(plotX + plotW, refY);
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.fillStyle = tokens.textFaint;
  ctx.font = FONT_HUD_SMALL;
  ctx.textAlign = "left";
  ctx.fillText("flat η", plotX + 4, refY - 3);

  // Linear approximation line: g_{00} ≈ 1 - 2ε  (CYAN)
  ctx.strokeStyle = hexToRgba(tokens.cyan, 0.45);
  ctx.lineWidth = 1.5;
  ctx.setLineDash([6, 3]);
  ctx.beginPath();
  ctx.moveTo(epsToPlotX(0), g00ToPlotY(1.0));
  ctx.lineTo(epsToPlotX(epsMax), g00ToPlotY(1 - 2 * epsMax));
  ctx.stroke();
  ctx.setLineDash([]);

  // Linear approx label
  ctx.fillStyle = hexToRgba(tokens.cyan, 0.55);
  ctx.font = FONT_HUD_SMALL;
  ctx.textAlign = "left";
  ctx.fillText("1 − 2ε (linear)", epsToPlotX(0.12), g00ToPlotY(1 - 2 * 0.12) - 10);

  // Physical anchors on the plot baseline
  ANCHORS.forEach(({ label, eps: ae }) => {
    const ax = epsToPlotX(Math.min(ae / epsMax, 1) * epsMax);
    if (ax < plotX || ax > plotX + plotW) return;
    ctx.strokeStyle = hexToRgba(tokens.green, 0.5);
    ctx.lineWidth = 0.8;
    ctx.setLineDash([2, 4]);
    ctx.beginPath();
    ctx.moveTo(ax, plotY);
    ctx.lineTo(ax, plotY + plotH);
    ctx.stroke();
    ctx.setLineDash([]);
    // tick at bottom
    ctx.fillStyle = tokens.green;
    ctx.font = "9px ui-monospace, monospace";
    ctx.textAlign = "center";
    const shortLabel = label.replace(" surface", "").replace(" star", "★");
    ctx.fillText(shortLabel, ax, plotY + plotH + 28);
  });

  // Breakdown region (ε > ~0.4) subtle fill
  if (epsMax >= 0.4) {
    const breakX = epsToPlotX(0.4);
    ctx.fillStyle = hexToRgba(tokens.red, 0.07);
    ctx.fillRect(breakX, plotY, plotX + plotW - breakX, plotH);
    ctx.fillStyle = hexToRgba(tokens.red, 0.5);
    ctx.font = FONT_HUD_SMALL;
    ctx.textAlign = "center";
    ctx.fillText("breakdown", breakX + (plotX + plotW - breakX) / 2, plotY + 12);
  }

  // Exact g_{00} value: cyan dot at current ε
  const dotX = epsToPlotX(eps);
  const dotY = g00ToPlotY(g00);
  const dotInPlot = dotX >= plotX && dotX <= plotX + plotW && dotY >= plotY && dotY <= plotY + plotH;

  if (dotInPlot) {
    // Glow
    const glow = ctx.createRadialGradient(dotX, dotY, 0, dotX, dotY, 10);
    glow.addColorStop(0, hexToRgba(tokens.cyan, 0.45));
    glow.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(dotX, dotY, 10, 0, Math.PI * 2);
    ctx.fill();
    // Dot
    ctx.fillStyle = tokens.cyan;
    ctx.beginPath();
    ctx.arc(dotX, dotY, 4, 0, Math.PI * 2);
    ctx.fill();
  }

  // ── Divider between plot and HUD ───────────────────────────────────────
  drawDivider(ctx, 16, plotX - 10, H - 68, tokens.grid);

  // ── HUD readouts ────────────────────────────────────────────────────────
  const hudX = 16;
  let hudY = H - 60;

  const g00Str = Math.abs(g00 - 1) < 1e-3 ? g00.toFixed(9) : g00.toFixed(6);
  const h00Str = Math.abs(h00) < 1e-3 ? h00.toExponential(3) : h00.toFixed(6);
  const epsStr = eps < 1e-3 ? eps.toExponential(2) : eps.toFixed(4);

  const hudStep = Math.max(140, (W - 60) / 3);
  hudY = drawHudReadout(ctx, hudX, hudY, "g\u{5F}{00} = ", g00Str, tokens.textDim, tokens.cyan, 16);
  drawHudReadout(ctx, hudX + hudStep, H - 60, "h\u{5F}{00} = −2ε = ", h00Str, tokens.textDim, tokens.amber, 16);
  drawHudReadout(ctx, hudX + hudStep * 2, H - 60, "ε = ", epsStr, tokens.textDim, tokens.green, 16);

  // Regime note
  ctx.font = FONT_HUD_SMALL;
  let regimeStr: string;
  let regimeColor: string;
  if (eps < 1e-5) {
    regimeStr = "weak field — GPS / satellite corrections";
    regimeColor = tokens.textDim;
  } else if (eps < 0.01) {
    regimeStr = "stellar fields — linear approx. good";
    regimeColor = tokens.textDim;
  } else if (eps < 0.3) {
    regimeStr = "neutron star / strong field — higher-order terms matter";
    regimeColor = tokens.amber;
  } else {
    regimeStr = "near horizon — linearisation BREAKS DOWN";
    regimeColor = tokens.red;
  }
  ctx.fillStyle = regimeColor;
  ctx.textAlign = "left";
  ctx.fillText(regimeStr, 16, H - 14);
}

export function WeakFieldExpansionScene() {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [eps, setEps] = useState(1e-9);
  const tokens = useSceneTokens();
  const { width, height } = useSceneSize(containerRef, {
    ratio: 0.55,
    maxHeight: SCENE_HEIGHT_DEFAULT,
  });

  const Phi = -eps * SPEED_OF_LIGHT * SPEED_OF_LIGHT;
  const h00 = h00FromPotential(Phi);
  const g00 = weakFieldG00(Phi);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = applyDpr(canvas, width, height);
    if (!ctx) return;
    draw(ctx, eps, g00, h00, tokens, width, height);
  }, [eps, g00, h00, tokens, width, height]);

  const epsStr = eps < 1e-3 ? eps.toExponential(2) : eps.toFixed(3);

  return (
    <div ref={containerRef} className="relative w-full pb-4">
      <canvas
        ref={canvasRef}
        style={{ width, height, display: "block" }}
        className={SCENE_CANVAS_CLASS}
        aria-label="Weak-field metric expansion: g_{00} vs ε = h_{00}/2. Shows the 4×4 metric tensor with g_{00} perturbed in AMBER, the linear approximation 1−2ε in CYAN, and the exact value as a CYAN dot. Physical anchors mark Earth surface, solar surface, neutron star, and black-hole horizon."
      />
      <div className="mt-3 flex items-center gap-3 font-mono text-xs text-[var(--color-fg-1)]">
        <label htmlFor="eps-slider" className="w-28 shrink-0 text-right">
          ε = |Φ|/c²
        </label>
        <input
          id="eps-slider"
          type="range"
          min={0}
          max={0.5}
          step={0.001}
          value={eps}
          onChange={(e) => setEps(parseFloat(e.target.value))}
          className="flex-1"
          style={{ accentColor: "var(--color-amber)" }}
        />
        <span className="w-20 text-right">{epsStr}</span>
      </div>
    </div>
  );
}
