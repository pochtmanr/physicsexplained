"use client";

import { useEffect, useRef, useState } from "react";
import {
  FONT_HUD,
  FONT_HUD_SMALL,
  SCENE_CANVAS_CLASS,
  applyDpr,
  drawArrow,
  drawSectionTitle,
  hexToRgba,
  SCENE_WIDTH_DEFAULT,
  SCENE_HEIGHT_DEFAULT,
  useSceneTokens,
  type SceneTokens,
} from "@/components/physics/_shared";

/**
 * §07 CHART OVERLAP SCENE
 *
 * Canvas 2D schematic of two overlapping coordinate patches on a manifold.
 * Two rectangles represent the images φ(U) and ψ(V) of two charts in ℝ²;
 * a subtly-pulsing AMBER overlap region represents the transition domain;
 * and an arrow labeled φ ∘ ψ⁻¹ is drawn between them to indicate the
 * transition map.
 *
 * The layout is purely schematic — no actual sphere geometry is drawn.
 * The purpose is to make the atlas / transition-map concept visually concrete.
 */

const W = SCENE_WIDTH_DEFAULT; // 720
const H = SCENE_HEIGHT_DEFAULT; // 380

export function ChartOverlapScene() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const tokens = useSceneTokens();
  const [tick, setTick] = useState(0);

  // Gentle 4-second pulse on the overlap region.
  useEffect(() => {
    let raf = 0;
    const start = performance.now();
    const loop = (t: number) => {
      const elapsed = (t - start) / 1000;
      setTick(elapsed % 4);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = applyDpr(canvas, W, H);
    if (!ctx) return;
    draw(ctx, tick, tokens);
  }, [tick, tokens]);

  return (
    <div className="relative w-full">
      <canvas
        ref={canvasRef}
        className={SCENE_CANVAS_CLASS}
        aria-label="Schematic of two coordinate charts φ(U) and ψ(V) on a manifold M. The overlap region is highlighted in amber. The transition map φ ∘ ψ⁻¹ is shown as an arrow connecting the two chart images."
      />
    </div>
  );
}

function draw(ctx: CanvasRenderingContext2D, tick: number, tokens: SceneTokens) {
  // Background
  ctx.fillStyle = tokens.bg;
  ctx.fillRect(0, 0, W, H);

  // ── Layout constants ───────────────────────────────────────────────────────
  const padY = 52;
  const boxH = H - 2 * padY - 24; // leave room for bottom caption
  const boxW = 160;
  const overlapW = 50;
  const leftBoxX = 36;
  const rightBoxX = W - 36 - boxW;
  const gridStep = 24;

  // Pulse: oscillates between 0 and 1 on a 4 s cycle (smooth sine).
  const pulse = 0.5 + 0.5 * Math.sin((tick / 4) * 2 * Math.PI);

  // ── Left chart rectangle φ(U) ──────────────────────────────────────────────
  ctx.strokeStyle = tokens.cyan;
  ctx.lineWidth = 1.5;
  ctx.fillStyle = hexToRgba(tokens.cyan, 0.06);
  ctx.beginPath();
  ctx.rect(leftBoxX, padY, boxW, boxH);
  ctx.fill();
  ctx.stroke();

  // Grid lines inside left chart
  ctx.strokeStyle = hexToRgba(tokens.cyan, 0.16);
  ctx.lineWidth = 0.75;
  for (let gx = leftBoxX + gridStep; gx < leftBoxX + boxW; gx += gridStep) {
    ctx.beginPath();
    ctx.moveTo(gx, padY);
    ctx.lineTo(gx, padY + boxH);
    ctx.stroke();
  }
  for (let gy = padY + gridStep; gy < padY + boxH; gy += gridStep) {
    ctx.beginPath();
    ctx.moveTo(leftBoxX, gy);
    ctx.lineTo(leftBoxX + boxW, gy);
    ctx.stroke();
  }

  // Left chart labels
  ctx.save();
  ctx.font = FONT_HUD;
  ctx.fillStyle = tokens.cyan;
  ctx.textAlign = "center";
  ctx.textBaseline = "top";
  ctx.fillText("φ(U)", leftBoxX + boxW / 2, padY - 20);
  ctx.restore();
  drawSectionTitle(ctx, leftBoxX + boxW / 2 - 22, padY + boxH + 8, "chart φ  ℝ²", tokens.textMute);

  // ── Right chart rectangle ψ(V) ─────────────────────────────────────────────
  ctx.strokeStyle = tokens.magenta;
  ctx.lineWidth = 1.5;
  ctx.fillStyle = hexToRgba(tokens.magenta, 0.06);
  ctx.beginPath();
  ctx.rect(rightBoxX, padY, boxW, boxH);
  ctx.fill();
  ctx.stroke();

  // Grid lines inside right chart
  ctx.strokeStyle = hexToRgba(tokens.magenta, 0.16);
  ctx.lineWidth = 0.75;
  for (let gx = rightBoxX + gridStep; gx < rightBoxX + boxW; gx += gridStep) {
    ctx.beginPath();
    ctx.moveTo(gx, padY);
    ctx.lineTo(gx, padY + boxH);
    ctx.stroke();
  }
  for (let gy = padY + gridStep; gy < padY + boxH; gy += gridStep) {
    ctx.beginPath();
    ctx.moveTo(rightBoxX, gy);
    ctx.lineTo(rightBoxX + boxW, gy);
    ctx.stroke();
  }

  // Right chart labels
  ctx.save();
  ctx.font = FONT_HUD;
  ctx.fillStyle = tokens.magenta;
  ctx.textAlign = "center";
  ctx.textBaseline = "top";
  ctx.fillText("ψ(V)", rightBoxX + boxW / 2, padY - 20);
  ctx.restore();
  drawSectionTitle(ctx, rightBoxX + boxW / 2 - 22, padY + boxH + 8, "chart ψ  ℝ²", tokens.textMute);

  // ── Overlap region tint in both rectangles (pulsing AMBER) ────────────────
  const overlapAlpha = 0.10 + 0.12 * pulse;
  const overlapBorderAlpha = 0.40 + 0.25 * pulse;

  // Left rectangle — right strip = overlap
  ctx.fillStyle = hexToRgba(tokens.amber, overlapAlpha);
  ctx.fillRect(leftBoxX + boxW - overlapW, padY, overlapW, boxH);
  ctx.strokeStyle = hexToRgba(tokens.amber, overlapBorderAlpha);
  ctx.lineWidth = 1;
  ctx.strokeRect(leftBoxX + boxW - overlapW, padY, overlapW, boxH);

  // Right rectangle — left strip = overlap
  ctx.fillStyle = hexToRgba(tokens.amber, overlapAlpha);
  ctx.fillRect(rightBoxX, padY, overlapW, boxH);
  ctx.strokeStyle = hexToRgba(tokens.amber, overlapBorderAlpha);
  ctx.strokeRect(rightBoxX, padY, overlapW, boxH);

  // Overlap label centered in left overlap strip
  ctx.save();
  ctx.font = FONT_HUD_SMALL;
  ctx.fillStyle = hexToRgba(tokens.amber, 0.7 + 0.3 * pulse);
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  const overlapMidY = padY + boxH / 2;
  ctx.save();
  ctx.translate(leftBoxX + boxW - overlapW / 2, overlapMidY);
  ctx.rotate(-Math.PI / 2);
  ctx.fillText("U ∩ V", 0, 0);
  ctx.restore();
  ctx.restore();

  // ── Manifold shape (center oval) ──────────────────────────────────────────
  const cx = W / 2;
  const cy = H / 2;
  const rx = 62;
  const ry = 52;

  ctx.fillStyle = hexToRgba(tokens.textBright, 0.04);
  ctx.strokeStyle = hexToRgba(tokens.textBright, 0.30);
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.ellipse(cx, cy, rx, ry, 0, 0, 2 * Math.PI);
  ctx.fill();
  ctx.stroke();

  // U patch (left part of oval)
  ctx.fillStyle = hexToRgba(tokens.cyan, 0.16);
  ctx.beginPath();
  ctx.ellipse(cx - 16, cy, rx * 0.72, ry * 0.78, 0, 0, 2 * Math.PI);
  ctx.fill();

  // V patch (right part of oval)
  ctx.fillStyle = hexToRgba(tokens.magenta, 0.16);
  ctx.beginPath();
  ctx.ellipse(cx + 16, cy, rx * 0.72, ry * 0.78, 0, 0, 2 * Math.PI);
  ctx.fill();

  // Overlap tint on oval (pulsing too)
  ctx.fillStyle = hexToRgba(tokens.amber, 0.18 + 0.10 * pulse);
  ctx.beginPath();
  ctx.ellipse(cx, cy, rx * 0.32, ry * 0.65, 0, 0, 2 * Math.PI);
  ctx.fill();

  // Manifold label "M"
  ctx.save();
  ctx.font = FONT_HUD;
  ctx.fillStyle = tokens.textDim;
  ctx.textAlign = "center";
  ctx.textBaseline = "top";
  ctx.fillText("M", cx, cy + ry + 10);
  ctx.restore();

  // Patch labels on manifold
  ctx.save();
  ctx.font = FONT_HUD_SMALL;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillStyle = tokens.cyan;
  ctx.fillText("U", cx - 34, cy - 4);
  ctx.fillStyle = tokens.magenta;
  ctx.fillText("V", cx + 34, cy - 4);
  ctx.restore();

  // ── Chart arrows from manifold to rectangles ──────────────────────────────
  // φ: oval → left rectangle (arrow points from oval edge to left box right edge)
  drawArrow(
    ctx,
    cx - rx - 4,
    cy,
    leftBoxX + boxW + 12,
    cy,
    tokens.cyan,
    1.5,
    7,
  );

  ctx.save();
  ctx.font = FONT_HUD_SMALL;
  ctx.fillStyle = tokens.cyan;
  ctx.textAlign = "center";
  ctx.textBaseline = "bottom";
  ctx.fillText("φ", (cx - rx + leftBoxX + boxW) / 2, cy - 6);
  ctx.restore();

  // ψ: oval → right rectangle
  drawArrow(
    ctx,
    cx + rx + 4,
    cy,
    rightBoxX - 12,
    cy,
    tokens.magenta,
    1.5,
    7,
  );

  ctx.save();
  ctx.font = FONT_HUD_SMALL;
  ctx.fillStyle = tokens.magenta;
  ctx.textAlign = "center";
  ctx.textBaseline = "bottom";
  ctx.fillText("ψ", (cx + rx + rightBoxX) / 2, cy - 6);
  ctx.restore();

  // ── Transition-map arrow between the two chart rectangles (above oval) ────
  // Uses a quadratic curve above the boxes; we approximate with drawArrow for the
  // straight-line segments and draw the curve manually since drawArrow is for
  // straight arrows. Use a bezier + AMBER color then add arrowhead via drawArrow
  // for the final segment.
  const arrowY = padY - 24;
  const arrowStartX = leftBoxX + boxW - 14;
  const arrowEndX = rightBoxX + 14;

  ctx.save();
  ctx.strokeStyle = tokens.amber;
  ctx.lineWidth = 1.75;
  ctx.setLineDash([6, 4]);
  ctx.beginPath();
  ctx.moveTo(arrowStartX, arrowY);
  ctx.bezierCurveTo(
    arrowStartX + (arrowEndX - arrowStartX) * 0.3,
    arrowY - 20,
    arrowStartX + (arrowEndX - arrowStartX) * 0.7,
    arrowY - 20,
    arrowEndX - 10,
    arrowY,
  );
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.restore();

  // Arrowhead at the end of the bezier
  drawArrow(ctx, arrowEndX - 14, arrowY, arrowEndX, arrowY, tokens.amber, 1.75, 8);

  // Transition-map label
  ctx.save();
  ctx.font = FONT_HUD;
  ctx.fillStyle = tokens.amber;
  ctx.textAlign = "center";
  ctx.textBaseline = "bottom";
  ctx.fillText("φ ∘ ψ⁻¹", (arrowStartX + arrowEndX) / 2, arrowY - 24);
  ctx.restore();

  // "OVERLAP REGION" section title between the charts
  drawSectionTitle(ctx, W / 2 - 42, padY + boxH / 2 - 6, "overlap region", tokens.textMute);

  // ── Bottom caption ─────────────────────────────────────────────────────────
  ctx.save();
  ctx.font = FONT_HUD_SMALL;
  ctx.fillStyle = tokens.textMute;
  ctx.textAlign = "center";
  ctx.textBaseline = "top";
  ctx.fillText(
    "Two charts covering the manifold. The transition map φ ∘ ψ⁻¹ must be smooth.",
    W / 2,
    H - 18,
  );
  ctx.restore();
}
