"use client";

import { useEffect, useRef } from "react";
import {
  applyDpr,
  SCENE_CANVAS_CLASS,
  FONT_HUD_SMALL,
  FONT_SECTION,
  drawHudReadout,
  drawSectionTitle,
  drawDivider,
  drawArrow,
  hexToRgba,
  useSceneSize,
  useSceneTokens,
  type SceneTokens,
  SCENE_HEIGHT_TALL,
} from "@/components/physics/_shared";

/**
 * FIG.35c — Einstein Tensor Divergence-Free Schematic.
 *
 * The contracted second Bianchi identity states ∇^μ G_{μν} = 0.
 *
 * Visual layout (two stacked panels):
 *   TOP: G_{μν} region — small square (GREEN border). CYAN arrows flowing in
 *        and out on all 4 faces with equal magnitude. Moving particle-dots
 *        travel along the arrows to animate the flow. HUD: "∇^μ G_{μν} = 0"
 *        in GREEN.
 *
 *   BOTTOM (after drawDivider): T_{μν} region — identical flow structure.
 *        Both sides conserved by the same geometry.
 *
 * 4-second cycle, smooth RAF loop. No manual slider.
 */

const ARROW_LEN = 48;
const BOX_HW = 44; // half-width of the region box
const BOX_HH = 36; // half-height
const DOT_R = 3;
const NUM_DOTS = 3; // dots per arrow

interface PanelSpec {
  cx: number;
  cy: number;
  label: string;
  sublabel: string;
  phaseOffset: number;
}

function drawFlowPanel(
  ctx: CanvasRenderingContext2D,
  tokens: SceneTokens,
  spec: PanelSpec,
  t: number,
) {
  const { cx, cy, label, sublabel, phaseOffset } = spec;

  // Region box — GREEN border
  ctx.save();
  ctx.fillStyle = hexToRgba(tokens.green, 0.06);
  ctx.fillRect(cx - BOX_HW, cy - BOX_HH, BOX_HW * 2, BOX_HH * 2);
  ctx.strokeStyle = tokens.green;
  ctx.lineWidth = 1.5;
  ctx.strokeRect(cx - BOX_HW, cy - BOX_HH, BOX_HW * 2, BOX_HH * 2);

  // Label inside box
  ctx.font = `bold 13px ui-monospace, monospace`;
  ctx.fillStyle = tokens.textBright;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(label, cx, cy - 5);
  ctx.font = FONT_HUD_SMALL;
  ctx.fillStyle = tokens.textMute;
  ctx.fillText(sublabel, cx, cy + 10);
  ctx.restore();

  // Arrow definitions: [fromX, fromY, toX, toY]
  // Inward on left/top face, outward on right/bottom face — net = 0
  const arrowDefs: Array<[number, number, number, number]> = [
    // left face: arrow pointing inward (→)
    [cx - BOX_HW - ARROW_LEN, cy, cx - BOX_HW, cy],
    // right face: arrow pointing outward (→)
    [cx + BOX_HW, cy, cx + BOX_HW + ARROW_LEN, cy],
    // top face: arrow pointing inward (↓)
    [cx, cy - BOX_HH - ARROW_LEN, cx, cy - BOX_HH],
    // bottom face: arrow pointing outward (↓)
    [cx, cy + BOX_HH, cx, cy + BOX_HH + ARROW_LEN],
  ];

  for (const [x0, y0, x1, y1] of arrowDefs) {
    // Draw arrow shaft + head
    drawArrow(ctx, x0, y0, x1, y1, tokens.cyan, 1.5, 7);

    // Moving particle-dots along the arrow
    const dx = x1 - x0;
    const dy = y1 - y0;
    const len = Math.hypot(dx, dy);
    const ux = dx / len;
    const uy = dy / len;

    for (let k = 0; k < NUM_DOTS; k++) {
      // Each dot is offset in phase; advance along the arrow direction
      const dotPhase = ((t + k / NUM_DOTS + phaseOffset) % 1);
      const px = x0 + ux * len * dotPhase;
      const py = y0 + uy * len * dotPhase;

      // Fade near the ends to avoid dots appearing inside the box
      const edge = 0.12;
      const fadeAlpha = dotPhase < edge ? dotPhase / edge : dotPhase > 1 - edge ? (1 - dotPhase) / edge : 1;

      ctx.save();
      ctx.globalAlpha = fadeAlpha * 0.9;
      ctx.fillStyle = tokens.cyan;
      ctx.shadowColor = tokens.cyan;
      ctx.shadowBlur = 6;
      ctx.beginPath();
      ctx.arc(px, py, DOT_R, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }
}

function render(
  ctx: CanvasRenderingContext2D,
  tokens: SceneTokens,
  t: number,
  W: number,
  H: number,
) {
  ctx.clearRect(0, 0, W, H);
  ctx.fillStyle = tokens.bg;
  ctx.fillRect(0, 0, W, H);

  // ── TOP PANEL: G_{μν} ─────────────────────────────────────────────────
  drawSectionTitle(ctx, 12, 10, "EINSTEIN TENSOR — DIVERGENCE-FREE FLOW", tokens.textMute);

  const topCY = H * 0.26;
  drawFlowPanel(
    ctx,
    tokens,
    {
      cx: W / 2,
      cy: topCY,
      label: "G_{μν}",
      sublabel: "Einstein tensor",
      phaseOffset: 0,
    },
    t,
  );

  // HUD readout to the right
  const hudX = W * 0.68;
  drawHudReadout(ctx, hudX, topCY - 16, "∇^μ G_{μν} = ", "0", tokens.textDim, tokens.green, 18);

  // "net flux = 0" annotation below box
  ctx.save();
  ctx.font = FONT_SECTION;
  ctx.fillStyle = tokens.green;
  ctx.textAlign = "center";
  ctx.textBaseline = "alphabetic";
  ctx.fillText("net flux = 0 (conserved)", W / 2, topCY + BOX_HH + 22);
  ctx.restore();

  // ── DIVIDER ───────────────────────────────────────────────────────────
  const divY = H / 2 + 8;
  drawDivider(ctx, 20, W - 20, divY, tokens.grid);

  // ── BOTTOM PANEL: T_{μν} ──────────────────────────────────────────────
  drawSectionTitle(ctx, 12, divY + 10, "STRESS-ENERGY TENSOR — MUST MATCH", tokens.textMute);

  const botCY = divY + (H - divY) * 0.45;
  drawFlowPanel(
    ctx,
    tokens,
    {
      cx: W / 2,
      cy: botCY,
      label: "T_{μν}",
      sublabel: "stress-energy tensor",
      phaseOffset: 0.15,
    },
    t,
  );

  // HUD readout
  drawHudReadout(ctx, hudX, botCY - 16, "∇^μ T_{μν} = ", "0", tokens.textDim, tokens.green, 18);

  ctx.save();
  ctx.font = FONT_SECTION;
  ctx.fillStyle = tokens.textMute;
  ctx.textAlign = "center";
  ctx.fillText("energy-momentum conservation", W / 2, botCY + BOX_HH + 22);
  ctx.restore();

  // ── Footer ────────────────────────────────────────────────────────────
  ctx.save();
  ctx.font = FONT_HUD_SMALL;
  ctx.fillStyle = tokens.textMute;
  ctx.textAlign = "center";
  ctx.textBaseline = "alphabetic";
  ctx.fillText(
    "Bianchi identity ⟹  ∇^μ G_{μν} = 0  forces  ∇^μ T_{μν} = 0",
    W / 2,
    H - 10,
  );
  ctx.restore();
}

export function EinsteinTensorDivergenceScene() {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const rafRef = useRef<number>(0);
  const tokens = useSceneTokens();
  const { width, height } = useSceneSize(containerRef, {
    ratio: 0.64,
    maxHeight: SCENE_HEIGHT_TALL,
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
      render(ctx, tokens, t, width, height);
      rafRef.current = requestAnimationFrame(loop);
    };

    rafRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(rafRef.current);
  }, [tokens, width, height]);

  return (
    <div ref={containerRef} className="relative w-full pb-4">
      <canvas
        ref={canvasRef}
        className={SCENE_CANVAS_CLASS}
        style={{ width, height, display: "block" }}
        aria-label="Flow diagram showing the Einstein tensor G_{μν} and stress-energy tensor T_{μν} as divergence-free fields. GREEN-bordered regions with equal CYAN arrows flowing in and out on all faces, animated with moving dots on a 4-second cycle, illustrating ∇^μ G_{μν} = 0."
      />
    </div>
  );
}
