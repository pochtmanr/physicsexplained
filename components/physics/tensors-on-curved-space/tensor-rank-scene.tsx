"use client";

import { useEffect, useRef } from "react";
import {
  FONT_HUD_SMALL,
  FONT_SECTION,
  SCENE_CANVAS_CLASS,
  applyDpr,
  drawSectionTitle,
  drawDivider,
  drawHudReadout,
  hexToRgba,
  SCENE_WIDTH_DEFAULT,
  SCENE_HEIGHT_DEFAULT,
  useSceneTokens,
  type SceneTokens,
} from "@/components/physics/_shared";

/**
 * FIG.30a — Tensor Rank Schematic.
 *
 * Shows the five canonical tensor ranks of GR as index-slot diagrams:
 *   • (0,0) scalar          — 1 component, no index boxes
 *   • (1,0) vector          — 4 components, 1 upper box
 *   • (0,1) covector        — 4 components, 1 lower box
 *   • (0,2) metric tensor   — 16 components, 2 lower boxes
 *   • (1,3) Riemann tensor  — 256 components, 1 upper + 3 lower boxes
 *
 * Each tensor is drawn as a central blob (the tensor itself) with coloured
 * "index slots" attached: CYAN boxes above for contravariant (upper) indices
 * and MAGENTA boxes below for covariant (lower) indices.
 *
 * The component count n^(p+q) with n = 4 is displayed next to each row in
 * AMBER via drawHudReadout. Animated: rows pulse-highlight at ~1.5s per row.
 */

const W = SCENE_WIDTH_DEFAULT;
const H = SCENE_HEIGHT_DEFAULT;

interface TensorSpec {
  label: string;
  pqLabel: string;
  p: number; // contravariant indices (upper, CYAN)
  q: number; // covariant indices (lower, MAGENTA)
  components: number;
  symbol: string;
}

const TENSORS: TensorSpec[] = [
  { label: "scalar",   pqLabel: "(0,0)", p: 0, q: 0, components: 1,   symbol: "φ"    },
  { label: "vector",   pqLabel: "(1,0)", p: 1, q: 0, components: 4,   symbol: "Vⁿ"   },
  { label: "covector", pqLabel: "(0,1)", p: 0, q: 1, components: 4,   symbol: "ωₙ"   },
  { label: "metric",   pqLabel: "(0,2)", p: 0, q: 2, components: 16,  symbol: "gₘₙ"  },
  { label: "Riemann",  pqLabel: "(1,3)", p: 1, q: 3, components: 256, symbol: "Rⁿₘₙₗ"},
];

// CYCLE_MS / TENSORS.length ≈ 1.5 s per row
const CYCLE_MS = TENSORS.length * 1500;

const BOX_W = 18;
const BOX_H = 14;
const BLOB_R = 20;
const SLOT_GAP = 6;

function drawTensor(
  ctx: CanvasRenderingContext2D,
  spec: TensorSpec,
  cx: number,
  cy: number,
  highlighted: boolean,
  tokens: SceneTokens,
) {
  const { p, q, label, pqLabel, components, symbol } = spec;

  const glowAlpha = highlighted ? 0.22 : 0.07;
  const strokeAlpha = highlighted ? 0.70 : 0.30;

  // ── Central blob ─────────────────────────────────────────────────────────
  ctx.beginPath();
  ctx.arc(cx, cy, BLOB_R, 0, Math.PI * 2);
  ctx.fillStyle = highlighted
    ? hexToRgba(tokens.amber, 0.14)
    : hexToRgba(tokens.textBright, 0.07);
  ctx.fill();
  ctx.strokeStyle = highlighted
    ? hexToRgba(tokens.amber, 0.70)
    : hexToRgba(tokens.textBright, 0.30);
  ctx.lineWidth = highlighted ? 1.8 : 1.2;
  ctx.stroke();

  // Symbol inside blob
  ctx.font = `bold 13px ui-monospace, monospace`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillStyle = highlighted ? tokens.amber : tokens.textBright;
  ctx.fillText(symbol, cx, cy);

  // ── Upper index boxes (contravariant — CYAN) ──────────────────────────────
  const upperTotalW = p * BOX_W + Math.max(0, p - 1) * SLOT_GAP;
  const upperStartX = cx - upperTotalW / 2;
  const upperY = cy - BLOB_R - 8 - BOX_H;

  for (let i = 0; i < p; i++) {
    const bx = upperStartX + i * (BOX_W + SLOT_GAP);
    ctx.fillStyle = hexToRgba(tokens.cyan, glowAlpha);
    ctx.fillRect(bx, upperY, BOX_W, BOX_H);
    ctx.strokeStyle = hexToRgba(tokens.cyan, strokeAlpha);
    ctx.lineWidth = 1;
    ctx.strokeRect(bx, upperY, BOX_W, BOX_H);

    ctx.fillStyle = tokens.cyan;
    ctx.font = FONT_HUD_SMALL;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("μ", bx + BOX_W / 2, upperY + BOX_H / 2);

    ctx.strokeStyle = hexToRgba(tokens.cyan, 0.30);
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(cx, cy - BLOB_R);
    ctx.lineTo(bx + BOX_W / 2, upperY + BOX_H);
    ctx.stroke();
  }

  // ── Lower index boxes (covariant — MAGENTA) ───────────────────────────────
  const lowerTotalW = q * BOX_W + Math.max(0, q - 1) * SLOT_GAP;
  const lowerStartX = cx - lowerTotalW / 2;
  const lowerY = cy + BLOB_R + 8;

  for (let i = 0; i < q; i++) {
    const bx = lowerStartX + i * (BOX_W + SLOT_GAP);
    ctx.fillStyle = hexToRgba(tokens.magenta, glowAlpha * 0.8);
    ctx.fillRect(bx, lowerY, BOX_W, BOX_H);
    ctx.strokeStyle = hexToRgba(tokens.magenta, strokeAlpha);
    ctx.lineWidth = 1;
    ctx.strokeRect(bx, lowerY, BOX_W, BOX_H);

    ctx.fillStyle = tokens.magenta;
    ctx.font = FONT_HUD_SMALL;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("ν", bx + BOX_W / 2, lowerY + BOX_H / 2);

    ctx.strokeStyle = hexToRgba(tokens.magenta, 0.30);
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(cx, cy + BLOB_R);
    ctx.lineTo(bx + BOX_W / 2, lowerY);
    ctx.stroke();
  }

  // ── Labels below ──────────────────────────────────────────────────────────
  const bottomY = cy + BLOB_R + 8 + BOX_H + 16;
  ctx.fillStyle = highlighted ? tokens.textBright : tokens.textDim;
  ctx.font = `bold 11px ui-monospace, monospace`;
  ctx.textAlign = "center";
  ctx.textBaseline = "alphabetic";
  ctx.fillText(label, cx, bottomY);

  ctx.fillStyle = tokens.textMute;
  ctx.font = FONT_HUD_SMALL;
  ctx.fillText(pqLabel, cx, bottomY + 14);

  // Component count via drawHudReadout style (inline here for positioning)
  ctx.save();
  ctx.font = FONT_HUD_SMALL;
  ctx.textBaseline = "alphabetic";
  ctx.textAlign = "center";
  ctx.fillStyle = highlighted ? tokens.amber : hexToRgba(tokens.amber, 0.65);
  ctx.fillText(`4^${p + q} = ${components}`, cx, bottomY + 28);
  ctx.restore();
}

export function TensorRankScene() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const tokens = useSceneTokens();
  // We drive animation via RAF, storing tick in a ref to avoid re-renders
  const tickRef = useRef(0);

  useEffect(() => {
    let raf = 0;

    const loop = (t: number) => {
      tickRef.current = t;
      const canvas = canvasRef.current;
      if (!canvas) { raf = requestAnimationFrame(loop); return; }
      const ctx = applyDpr(canvas, W, H);
      if (!ctx) { raf = requestAnimationFrame(loop); return; }

      draw(ctx, t, tokens);
      raf = requestAnimationFrame(loop);
    };

    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [tokens]);

  return (
    <div className="relative w-full">
      <canvas
        ref={canvasRef}
        className={SCENE_CANVAS_CLASS}
        aria-label="Tensor rank schematic showing scalar (0,0), vector (1,0), covector (0,1), metric (0,2), and Riemann (1,3) tensors as index-slot diagrams. Cyan boxes are contravariant upper indices; magenta boxes are covariant lower indices."
      />
    </div>
  );
}

function draw(ctx: CanvasRenderingContext2D, t: number, tokens: SceneTokens) {
  ctx.fillStyle = tokens.bg;
  ctx.fillRect(0, 0, W, H);

  // Which row is highlighted
  const cyclePos = (t % CYCLE_MS) / CYCLE_MS; // 0..1
  const highlightIdx = Math.floor(cyclePos * TENSORS.length);

  // ── Section header ────────────────────────────────────────────────────────
  drawSectionTitle(ctx, 12, 12, "TENSOR RANK", tokens.textMute);

  // ── Legend (AMBER top-right) ──────────────────────────────────────────────
  const legendY = 12;
  ctx.save();
  ctx.font = FONT_SECTION;
  ctx.textBaseline = "top";
  ctx.textAlign = "right";
  // contravariant
  ctx.fillStyle = tokens.cyan;
  ctx.fillText("↑ contravariant (upper)", W - 130, legendY);
  // covariant
  ctx.fillStyle = tokens.magenta;
  ctx.fillText("↓ covariant (lower)", W - 12, legendY);
  ctx.restore();

  // Sub-caption
  ctx.save();
  ctx.font = FONT_HUD_SMALL;
  ctx.fillStyle = tokens.textMute;
  ctx.textBaseline = "top";
  ctx.textAlign = "left";
  ctx.fillText("n = 4 dimensions", 12, 26);
  ctx.restore();

  // ── Column dividers ───────────────────────────────────────────────────────
  const colW = W / TENSORS.length;
  // Vertical dividers (drawDivider is horizontal-only, draw manually)
  ctx.save();
  ctx.strokeStyle = tokens.grid;
  ctx.lineWidth = 1;
  for (let i = 1; i < TENSORS.length; i++) {
    ctx.beginPath();
    ctx.moveTo(i * colW, 30);
    ctx.lineTo(i * colW, H - 20);
    ctx.stroke();
  }
  ctx.restore();

  // ── Highlight band behind active row ─────────────────────────────────────
  const hlCol = highlightIdx * colW;
  ctx.save();
  ctx.fillStyle = hexToRgba(tokens.amber, 0.05);
  ctx.fillRect(hlCol + 1, 30, colW - 2, H - 50);
  ctx.restore();

  // ── Tensor diagrams ───────────────────────────────────────────────────────
  const cy = H / 2 - 10;
  TENSORS.forEach((spec, i) => {
    const cx = colW * i + colW / 2;
    drawTensor(ctx, spec, cx, cy, i === highlightIdx, tokens);
  });

  // ── HUD readout strip at bottom ───────────────────────────────────────────
  // Show the highlighted tensor's component count prominently
  const active = TENSORS[highlightIdx];
  let hudY = H - 34;
  drawDivider(ctx, 12, W - 12, hudY - 6, tokens.grid);
  hudY = drawHudReadout(ctx, 12, hudY, "rank: ", active.pqLabel, tokens.textDim, tokens.amber);
  drawHudReadout(ctx, 180, H - 34, "symbol: ", active.symbol, tokens.textDim, tokens.textBright);
  drawHudReadout(ctx, 360, H - 34, "components: ", `${active.components}  (4^${active.p + active.q})`, tokens.textDim, tokens.amber);
}
