"use client";

import { useEffect, useRef } from "react";
import {
  applyDpr,
  SCENE_CANVAS_CLASS,
  FONT_HUD,
  FONT_HUD_SMALL,
  FONT_SECTION,
  drawSectionTitle,
  drawDivider,
  hexToRgba,
  useSceneTokens,
  useSceneSize,
  type SceneTokens,
  SCENE_HEIGHT_SHORT,
} from "@/components/physics/_shared";

/**
 * FIG.35a — Ricci Tensor Contraction Schematic.
 *
 * The Riemann tensor R^ρ_{σμν} is a rank-(1,3) object — four index slots.
 * The Ricci tensor R_{μν} = R^λ_{μλν} is obtained by setting the first and
 * third slots equal and summing (Einstein convention). This contracts the
 * first and third indices, reducing rank-(1,3) to rank-(0,2).
 *
 * Animation (4-second cycle):
 *   0-50%: The 4 Riemann boxes are shown — 4 CYAN-bordered "index slots".
 *          An AMBER connecting line grows between slot 0 (upper λ) and slot 2
 *          (lower λ). The two λ boxes slide toward each other with a glowing
 *          AMBER glow.
 *   50-100%: The contracted slots have collapsed; the Riemann blob fades out
 *            and the Ricci blob fades in showing 2 MAGENTA-bordered boxes.
 */

const BLOB_R = 24;
const BOX_W = 22;
const BOX_H = 16;
const SLOT_GAP = 8;

function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t;
}

function easeInOut(t: number): number {
  return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
}

function drawBox(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  label: string,
  fillColor: string,
  strokeColor: string,
  alpha = 1,
) {
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.fillStyle = fillColor;
  ctx.fillRect(x, y, BOX_W, BOX_H);
  ctx.strokeStyle = strokeColor;
  ctx.lineWidth = 1.5;
  ctx.strokeRect(x, y, BOX_W, BOX_H);
  ctx.fillStyle = strokeColor;
  ctx.font = `bold ${FONT_HUD_SMALL}`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(label, x + BOX_W / 2, y + BOX_H / 2);
  ctx.restore();
}

function drawConnector(
  ctx: CanvasRenderingContext2D,
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  color: string,
  alpha = 0.3,
) {
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.strokeStyle = color;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.stroke();
  ctx.restore();
}

function drawBlob(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  symbol: string,
  tokens: SceneTokens,
  alpha = 1,
) {
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.beginPath();
  ctx.arc(cx, cy, BLOB_R, 0, Math.PI * 2);
  ctx.fillStyle = hexToRgba(tokens.textBright, 0.08);
  ctx.fill();
  ctx.strokeStyle = hexToRgba(tokens.textBright, 0.35);
  ctx.lineWidth = 1.5;
  ctx.stroke();
  ctx.fillStyle = tokens.textBright;
  ctx.font = `bold 14px ui-monospace, monospace`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(symbol, cx, cy);
  ctx.restore();
}

function render(
  ctx: CanvasRenderingContext2D,
  tokens: SceneTokens,
  W: number,
  H: number,
  t: number,
) {
  ctx.clearRect(0, 0, W, H);
  ctx.fillStyle = tokens.bg;
  ctx.fillRect(0, 0, W, H);

  // Section title
  drawSectionTitle(ctx, 12, 10, "CONTRACTION", tokens.textMute);

  // Equation line at bottom
  ctx.save();
  ctx.font = `13px ui-monospace, monospace`;
  ctx.fillStyle = tokens.textDim;
  ctx.textAlign = "center";
  ctx.textBaseline = "alphabetic";
  ctx.fillText("R_{μν} = R^λ_{μλν}", W / 2, H - 10);
  ctx.restore();

  // Progress: first half = contract, second half = show result
  const contracted = easeInOut(Math.min(1, t * 2));
  const showing = easeInOut(Math.max(0, (t - 0.5) * 2));

  // ── Left side: Riemann tensor ──────────────────────────────────────────
  const riemannCX = W * 0.26;
  const riemannCY = H / 2 + 10;

  const lowerY = riemannCY + BLOB_R + 12;
  const upperY = riemannCY - BLOB_R - 12 - BOX_H;

  // 4 boxes in a row: upper λ (slot 0), lower μ λ ν (slots 1-3).
  // The contraction is λ(upper) with λ(lower, index 1).
  const numLower = 3;
  const totalLowerW = numLower * BOX_W + (numLower - 1) * SLOT_GAP;
  const lowerStartX = riemannCX - totalLowerW / 2;

  const upperX = riemannCX - BOX_W / 2;
  const lowerLamX = lowerStartX + 1 * (BOX_W + SLOT_GAP);

  const riemannAlpha = lerp(1, 0, showing);

  drawBlob(ctx, riemannCX, riemannCY, "R", tokens, riemannAlpha);

  // AMBER connecting line between the two λ slots (grows during contraction)
  if (contracted > 0.02) {
    const lineAlpha = Math.min(contracted, 1 - contracted) * 2 * riemannAlpha;
    ctx.save();
    ctx.globalAlpha = lineAlpha;
    // glow
    ctx.shadowColor = tokens.amber;
    ctx.shadowBlur = 8;
    ctx.strokeStyle = tokens.amber;
    ctx.lineWidth = 2;
    const p1x = upperX + BOX_W / 2;
    const p1y = upperY + BOX_H / 2;
    const p2x = lowerLamX + BOX_W / 2;
    const p2y = lowerY + BOX_H / 2;
    ctx.beginPath();
    ctx.moveTo(p1x, p1y);
    ctx.lineTo(p2x, p2y);
    ctx.stroke();
    ctx.shadowBlur = 0;
    ctx.restore();
  }

  // Upper box λ — slides toward lower λ during contraction
  const contractedUpperX = lerp(upperX, lowerLamX, contracted);
  const contractedUpperY = lerp(upperY, lowerY, contracted);
  const contractedAlpha = lerp(1, 0, contracted) * riemannAlpha;

  drawConnector(ctx, upperX + BOX_W / 2, upperY + BOX_H, riemannCX, riemannCY - BLOB_R, tokens.cyan, 0.3 * riemannAlpha);
  drawBox(ctx, contractedUpperX, contractedUpperY, "λ", hexToRgba(tokens.cyan, 0.25), tokens.cyan, contractedAlpha);

  // Lower boxes: μ, λ, ν — all CYAN borders
  const lowerLabels = ["μ", "λ", "ν"];
  for (let i = 0; i < 3; i++) {
    const bx = lowerStartX + i * (BOX_W + SLOT_GAP);
    const isLambda = i === 1;
    const alpha = isLambda ? lerp(1, 0, contracted) * riemannAlpha : riemannAlpha;
    drawConnector(ctx, bx + BOX_W / 2, lowerY, riemannCX, riemannCY + BLOB_R, tokens.cyan, 0.3 * alpha);
    drawBox(ctx, bx, lowerY, lowerLabels[i], hexToRgba(tokens.cyan, 0.18), tokens.cyan, alpha);
  }

  // "contract" label annotation
  if (contracted > 0.05 && contracted < 0.95) {
    const arcAlpha = Math.min(contracted, 1 - contracted) * 2 * riemannAlpha;
    ctx.save();
    ctx.globalAlpha = arcAlpha;
    ctx.strokeStyle = tokens.amber;
    ctx.lineWidth = 1.5;
    ctx.setLineDash([3, 3]);
    ctx.beginPath();
    ctx.arc(riemannCX, lowerY - 18, 38, 0.3, Math.PI - 0.3);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = tokens.amber;
    ctx.font = FONT_HUD_SMALL;
    ctx.textAlign = "center";
    ctx.fillText("contract", riemannCX, lowerY - 62);
    ctx.restore();
  }

  // "Riemann (1,3)" label
  ctx.save();
  ctx.globalAlpha = riemannAlpha;
  ctx.font = FONT_HUD;
  ctx.fillStyle = tokens.textDim;
  ctx.textAlign = "center";
  ctx.fillText("Riemann (1,3)", riemannCX, H - 48);
  ctx.font = FONT_HUD_SMALL;
  ctx.fillStyle = tokens.textMute;
  ctx.fillText("4⁴ = 256 components", riemannCX, H - 34);
  ctx.restore();

  // ── Arrow ─────────────────────────────────────────────────────────────
  const arrowAlpha = Math.min(t / 0.4, 1) * 0.6;
  ctx.save();
  ctx.globalAlpha = arrowAlpha;
  const ax1 = riemannCX + 72;
  const ax2 = W * 0.62 - 72;
  const ay = riemannCY;
  ctx.strokeStyle = tokens.textDim;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(ax1, ay);
  ctx.lineTo(ax2, ay);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(ax2, ay);
  ctx.lineTo(ax2 - 8, ay - 5);
  ctx.moveTo(ax2, ay);
  ctx.lineTo(ax2 - 8, ay + 5);
  ctx.stroke();
  ctx.fillStyle = tokens.textDim;
  ctx.font = FONT_HUD_SMALL;
  ctx.textAlign = "center";
  ctx.fillText("R^λ_{μλν}", (ax1 + ax2) / 2, ay - 10);
  ctx.restore();

  // ── Right side: Ricci tensor ───────────────────────────────────────────
  const ricciCX = W * 0.76;
  const ricciCY = H / 2 + 10;
  const ricciAlpha = showing;

  drawBlob(ctx, ricciCX, ricciCY, "Ric", tokens, ricciAlpha);

  const ricciLowerW = 2 * BOX_W + SLOT_GAP;
  const ricciLowerStartX = ricciCX - ricciLowerW / 2;
  const ricciLowerY = ricciCY + BLOB_R + 12;

  // Ricci has 2 MAGENTA-bordered boxes
  ["μ", "ν"].forEach((label, i) => {
    const bx = ricciLowerStartX + i * (BOX_W + SLOT_GAP);
    drawConnector(ctx, bx + BOX_W / 2, ricciLowerY, ricciCX, ricciCY + BLOB_R, tokens.magenta, 0.3 * ricciAlpha);
    drawBox(ctx, bx, ricciLowerY, label, hexToRgba(tokens.magenta, 0.18), tokens.magenta, ricciAlpha);
  });

  ctx.save();
  ctx.globalAlpha = ricciAlpha;
  ctx.font = FONT_HUD;
  ctx.fillStyle = tokens.textDim;
  ctx.textAlign = "center";
  ctx.fillText("Ricci (0,2)", ricciCX, H - 48);
  ctx.font = FONT_HUD_SMALL;
  ctx.fillStyle = tokens.textMute;
  ctx.fillText("10 independent", ricciCX, H - 34);
  ctx.restore();

  drawDivider(ctx, 0, W, H - 22, tokens.grid);

  // ── Legend ────────────────────────────────────────────────────────────
  ctx.save();
  ctx.font = FONT_SECTION;
  ctx.textAlign = "right";
  ctx.textBaseline = "alphabetic";
  ctx.fillStyle = tokens.cyan;
  ctx.fillText("cyan = free index", W - 130, 20);
  ctx.fillStyle = tokens.magenta;
  ctx.fillText("magenta = result", W - 12, 20);
  ctx.restore();
}

export function RicciTraceScene() {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const rafRef = useRef<number>(0);
  const tokens = useSceneTokens();
  const { width, height } = useSceneSize(containerRef, {
    ratio: 0.45,
    maxHeight: SCENE_HEIGHT_SHORT,
  });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = applyDpr(canvas, width, height);
    if (!ctx) return;

    const PERIOD = 4000; // 4-second cycle
    const start = performance.now();

    const loop = (now: number) => {
      const t = ((now - start) % PERIOD) / PERIOD;
      render(ctx, tokens, width, height, t);
      rafRef.current = requestAnimationFrame(loop);
    };

    rafRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(rafRef.current);
  }, [tokens, width, height]);

  return (
    <div ref={containerRef} className="relative w-full pb-4">
      <canvas
        ref={canvasRef}
        style={{ width, height, display: "block" }}
        className={SCENE_CANVAS_CLASS}
        aria-label="Animation of Riemann tensor contraction R^λ_{μλν} to produce the Ricci tensor R_{μν}. Four CYAN index-slot boxes collapse as the first and third slots are identified and traced over, leaving two MAGENTA boxes representing the rank-(0,2) Ricci tensor."
      />
    </div>
  );
}
