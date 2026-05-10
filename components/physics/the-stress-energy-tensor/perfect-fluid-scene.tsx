"use client";

import { useEffect, useRef, useState } from "react";
import {
  perfectFluidRestFrame,
  energyDensity,
  isotropicPressure,
} from "@/lib/physics/relativity/stress-energy";
import {
  FONT_HUD,
  FONT_HUD_SMALL,
  SCENE_CANVAS_CLASS,
  SCENE_HEIGHT_DEFAULT,
  applyDpr,
  hexToRgba,
  drawArrow,
  drawHudReadout,
  drawSectionTitle,
  drawDivider,
  useSceneSize,
  useSceneTokens,
  type SceneTokens,
} from "@/components/physics/_shared/scene-tokens";

/**
 * FIG.36b — PERFECT FLUID STRESS-ENERGY
 *
 * A box of fluid (CYAN border) with four-velocity arrows (MAGENTA) inside.
 * Two sliders control energy density ρ and pressure p.
 * Live HUD readouts via drawHudReadout for all 16 components (4×4 layout).
 * Section title: "PERFECT FLUID" / "T_{μν} = (ρ + p/c²) u_μ u_ν − p g_{μν}"
 */

const c = 1; // natural units

function drawFluid(
  ctx: CanvasRenderingContext2D,
  W: number,
  H: number,
  rho: number,
  p: number,
  tokens: SceneTokens,
) {
  ctx.fillStyle = tokens.bg;
  ctx.fillRect(0, 0, W, H);

  const T = perfectFluidRestFrame(rho, p, c);

  // ── Section title ───────────────────────────────────────────────────────
  drawSectionTitle(ctx, 16, 10, "PERFECT FLUID", tokens.textMute);

  ctx.save();
  ctx.font = FONT_HUD_SMALL;
  ctx.fillStyle = tokens.textMute;
  ctx.textBaseline = "top";
  ctx.textAlign = "left";
  ctx.fillText("T_{μν} = (ρ + p/c²) u_μ u_ν − p g_{μν}", 16, 26);
  ctx.restore();

  // ── Fluid box ───────────────────────────────────────────────────────────
  // Layout splits the canvas: roughly 38% box on the left, 60% HUD on the right.
  const boxX = Math.max(20, W * 0.06);
  const boxY = 64;
  const boxW = Math.max(120, W * 0.30);
  const boxH = Math.max(110, H - 240);
  const bCX = boxX + boxW / 2;
  const bCY = boxY + boxH / 2;

  // Box border — CYAN
  ctx.save();
  ctx.strokeStyle = hexToRgba(tokens.cyan, 0.60);
  ctx.lineWidth = 1.5;
  ctx.strokeRect(boxX, boxY, boxW, boxH);

  // Fill tinted by energy density
  const rhoNorm = Math.min(rho / 3, 1);
  ctx.fillStyle = hexToRgba(tokens.magenta, rhoNorm * 0.10);
  ctx.fillRect(boxX, boxY, boxW, boxH);
  ctx.restore();

  // Box label
  ctx.save();
  ctx.font = "9px ui-monospace, monospace";
  ctx.fillStyle = hexToRgba(tokens.cyan, 0.40);
  ctx.textAlign = "left";
  ctx.textBaseline = "top";
  ctx.fillText("fluid element", boxX + 4, boxY + 4);
  ctx.restore();

  // ── Four-velocity arrows (fluid at rest → upward time direction) ────────
  // Use drawArrow from tokens — arrows point upward (MAGENTA)
  const arrowLen = Math.min(40 + rhoNorm * 30, 65);
  const arrowPositions: [number, number][] = [
    [bCX - 55, bCY],
    [bCX, bCY],
    [bCX + 55, bCY],
  ];
  for (const [ax, ay] of arrowPositions) {
    drawArrow(ctx, ax, ay + arrowLen / 2, ax, ay - arrowLen / 2, tokens.magenta, 2, 8);
  }

  // u^μ label
  ctx.save();
  ctx.font = FONT_HUD_SMALL;
  ctx.fillStyle = tokens.magenta;
  ctx.textAlign = "center";
  ctx.textBaseline = "bottom";
  ctx.fillText("u^μ (at rest)", bCX, boxY - 6);
  ctx.restore();

  // ── Pressure arrows (outward on all four spatial faces) ──────────────────
  const pNorm = Math.min(p / 3, 1);
  const pLen = Math.max(pNorm * 50, 4);

  if (p > 0.01) {
    const pColor = hexToRgba(tokens.amber, 0.40 + pNorm * 0.55);
    // Left face
    drawArrow(ctx, boxX, bCY, boxX - pLen, bCY, pColor, 2, 7);
    // Right face
    drawArrow(ctx, boxX + boxW, bCY, boxX + boxW + pLen, bCY, pColor, 2, 7);
    // Top face
    drawArrow(ctx, bCX, boxY, bCX, boxY - pLen, pColor, 2, 7);
    // Bottom face
    drawArrow(ctx, bCX, boxY + boxH, bCX, boxY + boxH + pLen, pColor, 2, 7);

    ctx.save();
    ctx.font = FONT_HUD_SMALL;
    ctx.fillStyle = tokens.amber;
    ctx.textAlign = "left";
    ctx.textBaseline = "middle";
    ctx.fillText("p", boxX + boxW + pLen + 6, bCY);
    ctx.restore();
  }

  // ── HUD readouts — all 16 components (4×4) ───────────────────────────────
  const hudX = boxX + boxW + Math.max(40, W * 0.06);
  const hudY = 52;
  const hudAvail = Math.max(W - hudX - 16, 280);
  const colW = Math.max(58, Math.min(82, hudAvail / 4));
  const rowH = 36;

  // Column/row header labels
  ctx.save();
  ctx.font = FONT_HUD_SMALL;
  ctx.fillStyle = tokens.textMute;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  const indexLabels = ["t", "x", "y", "z"];
  for (let nu = 0; nu < 4; nu++) {
    ctx.fillText(`ν=${indexLabels[nu]}`, hudX + nu * colW + colW / 2, hudY - 10);
  }
  ctx.textAlign = "right";
  for (let mu = 0; mu < 4; mu++) {
    ctx.fillText(`μ=${indexLabels[mu]}`, hudX - 6, hudY + mu * rowH + rowH / 2);
  }
  ctx.restore();

  // Cell colors by role
  function componentColor(mu: number, nu: number): string {
    if (mu === 0 && nu === 0) return tokens.cyan;
    if (mu === 0 || nu === 0) return tokens.magenta;
    if (mu === nu) return tokens.amber;
    return tokens.green;
  }

  for (let mu = 0; mu < 4; mu++) {
    for (let nu = 0; nu < 4; nu++) {
      const cx = hudX + nu * colW;
      const cy = hudY + mu * rowH;
      const val = T[mu][nu];
      const isActive = Math.abs(val) > 1e-8;
      const color = componentColor(mu, nu);

      // Cell bg
      ctx.fillStyle = isActive ? hexToRgba(color, 0.08) : hexToRgba(tokens.textBright, 0.02);
      ctx.fillRect(cx, cy, colW - 2, rowH - 2);
      ctx.strokeStyle = isActive ? hexToRgba(color, 0.35) : tokens.panelBorder;
      ctx.lineWidth = 1;
      ctx.strokeRect(cx, cy, colW - 2, rowH - 2);

      // Index label (top-left)
      ctx.save();
      ctx.font = "8px ui-monospace, monospace";
      ctx.fillStyle = isActive ? hexToRgba(color, 0.75) : hexToRgba(tokens.textBright, 0.20);
      ctx.textAlign = "left";
      ctx.textBaseline = "top";
      ctx.fillText(`T${mu}${nu}`, cx + 3, cy + 2);
      ctx.restore();

      // Value (centre)
      ctx.save();
      ctx.font = `bold ${FONT_HUD}`;
      ctx.fillStyle = isActive
        ? hexToRgba(tokens.textBright, 0.88)
        : hexToRgba(tokens.textBright, 0.22);
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(val.toFixed(2), cx + colW / 2 - 1, cy + rowH / 2 - 1);
      ctx.restore();
    }
  }

  // ── Divider above HUD readout strip ────────────────────────────────────
  drawDivider(ctx, 16, W - 16, H - 80, tokens.grid);

  // ── Numerical readout strip ────────────────────────────────────────────
  let ry = H - 68;
  // Bottom strip readouts — distribute evenly across the canvas
  const stripY = H - 68;
  const stripStart = 16;
  const stripStep = Math.max(120, (W - 32) / 4);
  ry = drawHudReadout(ctx, stripStart, ry, "ε = T₀₀:", `${energyDensity(T).toFixed(3)}`, tokens.textDim, tokens.cyan);
  drawHudReadout(ctx, stripStart + stripStep, stripY, "p = Tᵢᵢ/3:", `${isotropicPressure(T).toFixed(3)}`, tokens.textDim, tokens.amber);
  drawHudReadout(ctx, stripStart + stripStep * 2, stripY, "ρ:", rho.toFixed(3), tokens.textDim, tokens.magenta);
  drawHudReadout(ctx, stripStart + stripStep * 3, stripY, "p/ρ:", rho > 0.001 ? (p / rho).toFixed(3) : "—", tokens.textDim, tokens.green);

  // Footer note
  ctx.save();
  ctx.font = "8px ui-monospace, monospace";
  ctx.fillStyle = hexToRgba(tokens.textBright, 0.28);
  ctx.textAlign = "left";
  ctx.textBaseline = "top";
  ctx.fillText("Dust: p=0. Radiation: p=ρc²/3 (trace-free). Vacuum: ρ=p=0.", 16, H - 44);
  ctx.restore();
}

export function PerfectFluidScene() {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [rho, setRho] = useState(1.5);
  const [p, setP] = useState(0.5);
  const tokens = useSceneTokens();
  const { width, height } = useSceneSize(containerRef, {
    ratio: 0.62,
    maxHeight: SCENE_HEIGHT_DEFAULT,
  });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = applyDpr(canvas, width, height);
    if (!ctx) return;
    drawFluid(ctx, width, height, rho, p, tokens);
  }, [rho, p, tokens, width, height]);

  return (
    <div ref={containerRef} className="relative w-full pb-4">
      <canvas
        ref={canvasRef}
        className={SCENE_CANVAS_CLASS}
        style={{ width, height, display: "block" }}
        aria-label="Perfect fluid stress-energy tensor. A cyan-bordered fluid element box contains magenta four-velocity arrows. Pressure arrows (amber) push outward on all faces. A 4×4 HUD table shows all T_{μν} component values, updating live with the density and pressure sliders."
      />
      <div className="mt-3 flex items-center gap-3 font-mono text-xs text-[var(--color-fg-1)]">
        <span className="w-32 shrink-0">energy density ρ</span>
        <input
          type="range"
          min={0}
          max={3}
          step={0.05}
          value={rho}
          onChange={(e) => setRho(Number(e.target.value))}
          className="flex-1"
          style={{ accentColor: "var(--color-magenta)" }}
        />
        <span className="w-12 text-right text-[var(--color-fg-0)]">{rho.toFixed(2)}</span>
      </div>
      <div className="mt-3 flex items-center gap-3 font-mono text-xs text-[var(--color-fg-1)]">
        <span className="w-32 shrink-0">pressure p</span>
        <input
          type="range"
          min={0}
          max={3}
          step={0.05}
          value={p}
          onChange={(e) => setP(Number(e.target.value))}
          className="flex-1"
          style={{ accentColor: "var(--color-amber)" }}
        />
        <span className="w-12 text-right text-[var(--color-fg-0)]">{p.toFixed(2)}</span>
      </div>
    </div>
  );
}
