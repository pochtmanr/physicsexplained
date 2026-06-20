"use client";

import { useEffect, useRef, useState } from "react";
import {
  FONT_HUD_SMALL,
  SCENE_CANVAS_CLASS,
  SCENE_HEIGHT_TALL,
  applyDpr,
  hexToRgba,
  drawHudReadout,
  drawSectionTitle,
  useSceneSize,
  useSceneTokens,
  type SceneTokens,
} from "@/components/physics/_shared/scene-tokens";

/**
 * FIG.42b — the coordinate speed of light near a mass.
 *
 * LEFT PANEL: a heatmap of the coordinate light speed v_coord/c = 1 − r_s/r in
 *   the plane around a mass at center. Far from the mass the field is at c
 *   (bright); a dip darkens toward the center where the geometry "slows" the
 *   coordinate advance of a light ray. A horizontal line of sight at impact
 *   parameter b is overlaid.
 *
 * RIGHT PANEL: the 1-D cross-section v_coord/c along that line of sight as a
 *   function of position. The dip is the integrand of the Shapiro delay: the
 *   shaded area between the curve and the c-line is the extra time accumulated.
 *
 * An "exaggeration" control scales r_s up enormously so the sub-part-per-
 * billion real dip becomes visible; the real value is reported separately.
 */

const PAD = 16;
const R_SUN = 6.957e8;
// Real solar Schwarzschild radius ≈ 2.95 km; r_s/R_⊙ ≈ 4.2e-6.
const RS_OVER_RSUN_REAL = 4.246e-6;

export function CoordinateLightSpeedScene() {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const tokens = useSceneTokens();
  // Exaggeration: how much we scale r_s up for visibility (log slider).
  const [exag, setExag] = useState(5); // 10^5 ×
  // Impact parameter of the overlaid line of sight, in solar radii.
  const [bRsun, setBRsun] = useState(1.4);
  const { width, height } = useSceneSize(containerRef, {
    ratio: 0.5,
    maxHeight: SCENE_HEIGHT_TALL,
    minHeight: 320,
  });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = applyDpr(canvas, width, height);
    if (!ctx) return;
    draw(ctx, tokens, exag, bRsun, width, height);
  }, [exag, bRsun, tokens, width, height]);

  // Visualized r_s (in solar radii) after exaggeration.
  const rsVis = RS_OVER_RSUN_REAL * Math.pow(10, exag);
  const realDipAtGraze = RS_OVER_RSUN_REAL; // 1 − v/c at r = R_⊙

  return (
    <div ref={containerRef} className="relative w-full pb-4">
      <canvas
        ref={canvasRef}
        style={{ width, height, display: "block" }}
        className={SCENE_CANVAS_CLASS}
        aria-label="Heatmap of the coordinate speed of light around a mass, with a one-dimensional cross-section showing the dip below c along a line of sight at impact parameter b."
      />
      <div className="mt-3 flex flex-col gap-2 font-mono text-xs text-[var(--color-fg-2)]">
        <div className="flex items-center gap-3">
          <span className="w-56 shrink-0">
            exaggeration: 10^{exag.toFixed(1)} ×
          </span>
          <input
            type="range"
            min={3}
            max={5.5}
            step={0.1}
            value={exag}
            onChange={(e) => setExag(parseFloat(e.target.value))}
            className="flex-1"
            style={{ accentColor: "var(--color-magenta)" }}
            aria-label="Schwarzschild-radius exaggeration factor"
          />
        </div>
        <div className="flex items-center gap-3">
          <span className="w-56 shrink-0">b = {bRsun.toFixed(2)} R_⊙</span>
          <input
            type="range"
            min={1.02}
            max={4}
            step={0.02}
            value={bRsun}
            onChange={(e) => setBRsun(parseFloat(e.target.value))}
            className="flex-1"
            style={{ accentColor: "var(--color-cyan)" }}
            aria-label="Impact parameter of the line of sight, in solar radii"
          />
        </div>
        <div className="text-[var(--color-fg-3)]">
          shown r_s = {rsVis.toFixed(3)} R_⊙ · real dip at the solar limb 1 − v/c ≈{" "}
          {(realDipAtGraze * 1e6).toFixed(1)} ppm
        </div>
      </div>
    </div>
  );
}

/** v_coord/c = 1 − rs/r, clamped ≥ 0. rs and r in the same units. */
function vcoord(r: number, rs: number): number {
  if (r <= 0) return 0;
  return Math.max(0, 1 - rs / r);
}

function draw(
  ctx: CanvasRenderingContext2D,
  tokens: SceneTokens,
  exag: number,
  bRsun: number,
  W: number,
  H: number,
) {
  ctx.fillStyle = tokens.bg;
  ctx.fillRect(0, 0, W, H);

  const gap = 18;
  const panelW = (W - PAD * 2 - gap) / 2;
  const leftX0 = PAD;
  const rightX0 = PAD + panelW + gap;
  const panelY0 = PAD + 20;
  const panelH = H - PAD * 2 - 20;

  // Visualized r_s in solar radii.
  const rsVis = RS_OVER_RSUN_REAL * Math.pow(10, exag);
  // Domain: ±DOMAIN solar radii across each panel.
  const DOMAIN = 4; // R_⊙ half-width

  // ── LEFT: heatmap ─────────────────────────────────────────────────────────
  ctx.strokeStyle = tokens.panelBorder;
  ctx.lineWidth = 1;
  ctx.strokeRect(leftX0, panelY0, panelW, panelH);
  drawSectionTitle(ctx, leftX0 + 6, panelY0 - 16, "COORD. SPEED  v/c", tokens.textMute);

  const cols = 60;
  const rows = 42;
  const cellW = panelW / cols;
  const cellH = (panelH - 4) / rows;
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      // Map cell center to physical (x, y) in R_⊙.
      const fx = (col + 0.5) / cols; // 0..1
      const fy = (row + 0.5) / rows;
      const x = (fx * 2 - 1) * DOMAIN;
      const y = (fy * 2 - 1) * DOMAIN;
      const r = Math.hypot(x, y);
      const v = r < rsVis ? 0 : vcoord(r, rsVis);
      // Brightness ∝ v. Dark = slow. Blend tokens.cyan (far) → tokens.red (near).
      const dip = 1 - v; // 0 at c, →1 near center
      const t = Math.min(1, dip * 1.4);
      // Two composited fills: cyan recedes as red rises, both from token values.
      const alphaCyan = (1 - t) * (0.15 + 0.5 * (1 - dip));
      const alphaRed = t * (0.25 + 0.6 * t);
      ctx.fillStyle = hexToRgba(tokens.cyan, Math.max(0, alphaCyan));
      ctx.fillRect(
        leftX0 + col * cellW,
        panelY0 + 2 + row * cellH,
        Math.ceil(cellW) + 1,
        Math.ceil(cellH) + 1,
      );
      ctx.fillStyle = hexToRgba(tokens.red, Math.max(0, alphaRed));
      ctx.fillRect(
        leftX0 + col * cellW,
        panelY0 + 2 + row * cellH,
        Math.ceil(cellW) + 1,
        Math.ceil(cellH) + 1,
      );
    }
  }

  // Mass disk at center
  const cxL = leftX0 + panelW / 2;
  const cyL = panelY0 + panelH / 2;
  const rsunPx = (panelW / 2) / DOMAIN; // px per R_⊙
  ctx.fillStyle = tokens.amber;
  ctx.beginPath();
  ctx.arc(cxL, cyL, Math.max(4, rsunPx), 0, Math.PI * 2);
  ctx.fill();

  // Line of sight at impact parameter b (horizontal line offset by b above center)
  const losY = cyL - bRsun * rsunPx;
  ctx.strokeStyle = tokens.amber;
  ctx.lineWidth = 1.6;
  ctx.setLineDash([5, 4]);
  ctx.beginPath();
  ctx.moveTo(leftX0 + 2, losY);
  ctx.lineTo(leftX0 + panelW - 2, losY);
  ctx.stroke();
  ctx.setLineDash([]);

  // b annotation
  ctx.strokeStyle = hexToRgba(tokens.amber, 0.7);
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(cxL, cyL);
  ctx.lineTo(cxL, losY);
  ctx.stroke();
  ctx.fillStyle = tokens.amber;
  ctx.font = FONT_HUD_SMALL;
  ctx.textAlign = "left";
  ctx.textBaseline = "bottom";
  ctx.fillText("b", cxL + 4, (cyL + losY) / 2);

  // ── RIGHT: cross-section profile ──────────────────────────────────────────
  ctx.strokeStyle = tokens.panelBorder;
  ctx.lineWidth = 1;
  ctx.strokeRect(rightX0, panelY0, panelW, panelH);
  drawSectionTitle(ctx, rightX0 + 6, panelY0 - 16, "PROFILE ALONG LINE OF SIGHT", tokens.textMute);

  const plotX0 = rightX0 + 36;
  const plotX1 = rightX0 + panelW - 12;
  const plotY0 = panelY0 + 14;
  const plotY1 = panelY0 + panelH - 22;

  // y maps v from (1 − rsVis/b scaled) up to 1. Choose a window around the dip.
  const vMinAtGraze = vcoord(bRsun, rsVis);
  const yLo = Math.max(0, Math.min(vMinAtGraze, 1) - 0.06 * (1 - vMinAtGraze) - 0.02);
  const yHi = 1.0;
  const sx = (xR: number) => plotX0 + ((xR + DOMAIN) / (2 * DOMAIN)) * (plotX1 - plotX0);
  const sy = (v: number) => plotY1 - ((v - yLo) / (yHi - yLo)) * (plotY1 - plotY0);

  // c reference line (v = 1)
  ctx.strokeStyle = hexToRgba(tokens.cyan, 0.5);
  ctx.setLineDash([4, 3]);
  ctx.beginPath();
  ctx.moveTo(plotX0, sy(1));
  ctx.lineTo(plotX1, sy(1));
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.fillStyle = hexToRgba(tokens.cyan, 0.8);
  ctx.font = FONT_HUD_SMALL;
  ctx.textAlign = "left";
  ctx.textBaseline = "bottom";
  ctx.fillText("v = c", plotX0 + 4, sy(1) - 2);

  // Profile along the line of sight: position s from −DOMAIN..DOMAIN, r=√(b²+s²).
  const N = 200;
  const pts: { x: number; v: number }[] = [];
  for (let i = 0; i <= N; i++) {
    const s = (i / N) * 2 * DOMAIN - DOMAIN;
    const r = Math.hypot(bRsun, s);
    pts.push({ x: s, v: vcoord(r, rsVis) });
  }

  // Shaded area between curve and v=1 (the delay integrand)
  ctx.fillStyle = hexToRgba(tokens.red, 0.18);
  ctx.beginPath();
  ctx.moveTo(sx(-DOMAIN), sy(1));
  for (const p of pts) ctx.lineTo(sx(p.x), sy(p.v));
  ctx.lineTo(sx(DOMAIN), sy(1));
  ctx.closePath();
  ctx.fill();

  // Curve
  ctx.strokeStyle = tokens.amber;
  ctx.lineWidth = 2;
  ctx.beginPath();
  pts.forEach((p, i) => {
    const X = sx(p.x);
    const Y = sy(p.v);
    if (i === 0) ctx.moveTo(X, Y);
    else ctx.lineTo(X, Y);
  });
  ctx.stroke();

  // Axes box
  ctx.strokeStyle = tokens.axes;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(plotX0, plotY0);
  ctx.lineTo(plotX0, plotY1);
  ctx.lineTo(plotX1, plotY1);
  ctx.stroke();

  // y labels
  ctx.fillStyle = tokens.textMute;
  ctx.textAlign = "right";
  ctx.textBaseline = "middle";
  ctx.fillText("1.0", plotX0 - 4, sy(1));
  ctx.fillText(yLo.toFixed(2), plotX0 - 4, sy(yLo));

  // HUD: dip depth at closest approach
  ctx.textAlign = "left";
  drawHudReadout(
    ctx,
    plotX0 + 4,
    plotY0 + 2,
    "min v/c = ",
    vMinAtGraze.toFixed(3),
    tokens.textDim,
    tokens.amber,
  );
}
