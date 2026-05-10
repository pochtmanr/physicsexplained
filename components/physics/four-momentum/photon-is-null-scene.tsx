"use client";

import { useEffect, useRef } from "react";
import {
  applyDpr,
  hexToRgba,
  SCENE_CANVAS_CLASS,
  SCENE_HEIGHT_DEFAULT,
  useSceneSize,
  useSceneTokens,
  type SceneTokens,
} from "@/components/physics/_shared/scene-tokens";

/**
 * FIG.16c — The photon as a null four-momentum.
 *
 *   LEFT panel: massive particle (electron-like, m ≠ 0)
 *     The energy-momentum triangle is a proper right triangle.
 *     Vertical leg  = mc²   (rest energy, cyan)
 *     Horizontal leg = pc    (momentum × c, magenta)
 *     Hypotenuse    = E      (total energy, amber)
 *
 *   RIGHT panel: photon (m = 0)
 *     The vertical leg vanishes — the triangle degenerates.
 *     Hypotenuse = horizontal leg = pc = E.
 *     Four-momentum is null: p^μ p_μ = 0.
 *
 *   Palette: cyan = mc² leg; magenta = pc leg; amber = E (hypotenuse).
 */

// For a representative massive particle at β = 0.6
const BETA = 0.6;
const GAMMA_MASSIVE = 1 / Math.sqrt(1 - BETA * BETA); // ≈ 1.25
const MC2 = 1; // natural units
const PC_MASSIVE = GAMMA_MASSIVE * BETA * MC2; // γβmc²
const E_MASSIVE = GAMMA_MASSIVE * MC2; // γmc²
const E_PHOTON = E_MASSIVE; // same total E so panels are same hypotenuse length

export function PhotonIsNullScene() {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const tokens = useSceneTokens();
  const { width, height } = useSceneSize(containerRef, {
    ratio: 0.55,
    maxHeight: SCENE_HEIGHT_DEFAULT,
  });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = applyDpr(canvas, width, height);
    if (!ctx) return;
    ctx.clearRect(0, 0, width, height);

    ctx.fillStyle = tokens.bg;
    ctx.fillRect(0, 0, width, height);

    const ORIGIN_Y = height - 80;
    const VERT_PIXELS = Math.min(200, height - 130);
    const PANEL_W = width / 2 - 20;
    const PANEL_MARGIN = 10;

    // ── PANEL DIVIDER ────────────────────────────────────────────────────
    ctx.strokeStyle = hexToRgba(tokens.textFaint, 0.5);
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.moveTo(width / 2, 20);
    ctx.lineTo(width / 2, height - 20);
    ctx.stroke();
    ctx.setLineDash([]);

    // ── PANEL HEADERS ───────────────────────────────────────────────────
    ctx.font = "bold 12px ui-monospace, monospace";
    ctx.textAlign = "center";
    ctx.fillStyle = tokens.textDim;
    ctx.fillText("MASSIVE PARTICLE  (m ≠ 0)", PANEL_W / 2 + PANEL_MARGIN, 22);
    ctx.fillStyle = tokens.amber;
    ctx.fillText("PHOTON  (m = 0,  null four-momentum)", width / 2 + PANEL_W / 2 + PANEL_MARGIN, 22);

    // ══════════════════════════════════════════════════════════════════════
    //  LEFT PANEL — massive particle
    // ══════════════════════════════════════════════════════════════════════

    const scale = VERT_PIXELS / MC2;
    const vertLen = MC2 * scale;
    const horizLen = PC_MASSIVE * scale;

    const leftOriginX = PANEL_MARGIN + 90;

    const AL = { x: leftOriginX, y: ORIGIN_Y };
    const BL = { x: leftOriginX + horizLen, y: ORIGIN_Y };
    const CL = { x: leftOriginX, y: ORIGIN_Y - vertLen };

    drawGrid(ctx, leftOriginX, ORIGIN_Y, PANEL_W - 20, VERT_PIXELS, tokens);

    drawRightAngle(ctx, AL, tokens);

    drawLeg(ctx, AL, CL, tokens.cyan, 3);
    drawLeg(ctx, AL, BL, tokens.magenta, 3);
    drawLeg(ctx, BL, CL, tokens.amber, 3);

    for (const v of [AL, BL, CL]) dotAt(ctx, v, tokens);

    ctx.font = "12px ui-monospace, monospace";

    ctx.fillStyle = tokens.cyan;
    ctx.textAlign = "right";
    ctx.fillText("mc²", AL.x - 10, (AL.y + CL.y) / 2 + 4);
    ctx.fillText(`= ${MC2.toFixed(2)}`, AL.x - 10, (AL.y + CL.y) / 2 + 18);

    ctx.fillStyle = tokens.magenta;
    ctx.textAlign = "center";
    ctx.fillText(`pc = ${PC_MASSIVE.toFixed(3)}`, (AL.x + BL.x) / 2, AL.y + 22);

    ctx.fillStyle = tokens.amber;
    ctx.textAlign = "left";
    const midHL = { x: (BL.x + CL.x) / 2 + 6, y: (BL.y + CL.y) / 2 - 6 };
    ctx.fillText(`E = ${E_MASSIVE.toFixed(3)}`, midHL.x, midHL.y);

    // Invariant label
    ctx.fillStyle = hexToRgba(tokens.cyan, 0.75);
    ctx.textAlign = "center";
    ctx.font = "11px ui-monospace, monospace";
    ctx.fillText(
      `p^μ p_μ = (E/c)² − (pc)²/c² = m²c² = ${(MC2 * MC2).toFixed(2)}`,
      leftOriginX + PANEL_W / 4,
      height - 18,
    );

    // ══════════════════════════════════════════════════════════════════════
    //  RIGHT PANEL — photon, null four-momentum
    // ══════════════════════════════════════════════════════════════════════

    const photonHorizLen = E_PHOTON * scale;

    const rightOriginX = width / 2 + PANEL_MARGIN + 60;

    const AR = { x: rightOriginX, y: ORIGIN_Y };
    const BR = { x: rightOriginX + photonHorizLen, y: ORIGIN_Y };

    drawGrid(ctx, rightOriginX, ORIGIN_Y, width - rightOriginX - 20, VERT_PIXELS, tokens);

    // Vanishing vertical leg stub
    ctx.strokeStyle = hexToRgba(tokens.cyan, 0.25);
    ctx.lineWidth = 2;
    ctx.setLineDash([3, 3]);
    ctx.beginPath();
    ctx.moveTo(AR.x, AR.y);
    ctx.lineTo(AR.x, AR.y - 10);
    ctx.stroke();
    ctx.setLineDash([]);

    drawLeg(ctx, AR, BR, tokens.magenta, 3);
    drawLeg(ctx, { x: AR.x, y: AR.y - 3 }, { x: BR.x, y: BR.y - 3 }, tokens.amber, 2);

    for (const v of [AR, BR]) dotAt(ctx, v, tokens);
    dotAt(ctx, { x: AR.x, y: AR.y - 10 }, tokens);

    ctx.font = "12px ui-monospace, monospace";

    ctx.fillStyle = hexToRgba(tokens.cyan, 0.45);
    ctx.textAlign = "right";
    ctx.fillText("mc² = 0", AR.x - 10, AR.y - 14);

    ctx.fillStyle = tokens.magenta;
    ctx.textAlign = "center";
    ctx.fillText(`pc = E = ${E_PHOTON.toFixed(3)}`, (AR.x + BR.x) / 2, AR.y + 22);

    ctx.fillStyle = tokens.amber;
    ctx.textAlign = "center";
    ctx.fillText(`E = ${E_PHOTON.toFixed(3)}`, (AR.x + BR.x) / 2, AR.y - 12);

    // NULL callout box
    const boxX = rightOriginX;
    const boxY = ORIGIN_Y - vertLen + 10;
    ctx.fillStyle = hexToRgba(tokens.amber, 0.1);
    ctx.fillRect(boxX, boxY, photonHorizLen, 50);
    ctx.strokeStyle = hexToRgba(tokens.amber, 0.5);
    ctx.lineWidth = 1;
    ctx.strokeRect(boxX, boxY, photonHorizLen, 50);
    ctx.fillStyle = tokens.amber;
    ctx.font = "bold 11px ui-monospace, monospace";
    ctx.textAlign = "center";
    ctx.fillText("NULL FOUR-MOMENTUM", boxX + photonHorizLen / 2, boxY + 18);
    ctx.font = "11px ui-monospace, monospace";
    ctx.fillText("p^μ p_μ = 0  |  E = pc", boxX + photonHorizLen / 2, boxY + 34);

    ctx.fillStyle = hexToRgba(tokens.amber, 0.75);
    ctx.textAlign = "center";
    ctx.font = "11px ui-monospace, monospace";
    ctx.fillText(
      "m = 0  →  p^μ p_μ = (E/c)² − (pc/c)² = 0",
      rightOriginX + (width - rightOriginX - 20) / 2,
      height - 18,
    );
  }, [tokens, width, height]);

  return (
    <div ref={containerRef} className="w-full pb-4">
      <canvas
        ref={canvasRef}
        style={{ width, height, display: "block" }}
        className={SCENE_CANVAS_CLASS}
      />
      <p className="mt-2 font-mono text-xs text-[var(--color-fg-4)]">
        Left: massive particle (β = 0.60) — proper right triangle. Right: photon
        (m = 0) — triangle degenerates, vertical leg vanishes, E = pc.
      </p>
    </div>
  );
}

// ─── helpers ──────────────────────────────────────────────────────────────────

function drawLeg(
  ctx: CanvasRenderingContext2D,
  from: { x: number; y: number },
  to: { x: number; y: number },
  color: string,
  width: number,
) {
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.beginPath();
  ctx.moveTo(from.x, from.y);
  ctx.lineTo(to.x, to.y);
  ctx.stroke();
}

function dotAt(
  ctx: CanvasRenderingContext2D,
  v: { x: number; y: number },
  tokens: SceneTokens,
) {
  ctx.fillStyle = tokens.textBright;
  ctx.beginPath();
  ctx.arc(v.x, v.y, 3, 0, Math.PI * 2);
  ctx.fill();
}

function drawRightAngle(
  ctx: CanvasRenderingContext2D,
  corner: { x: number; y: number },
  tokens: SceneTokens,
) {
  const tick = 10;
  ctx.strokeStyle = tokens.axes;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(corner.x + tick, corner.y);
  ctx.lineTo(corner.x + tick, corner.y - tick);
  ctx.lineTo(corner.x, corner.y - tick);
  ctx.stroke();
}

function drawGrid(
  ctx: CanvasRenderingContext2D,
  originX: number,
  originY: number,
  maxWidth: number,
  vertPixels: number,
  tokens: SceneTokens,
) {
  ctx.strokeStyle = hexToRgba(tokens.textFaint, 0.35);
  ctx.lineWidth = 1;
  const step = vertPixels / 2;
  for (let i = 0; i <= 6; i++) {
    const px = originX + i * step;
    if (px > originX + maxWidth) break;
    ctx.beginPath();
    ctx.moveTo(px, 30);
    ctx.lineTo(px, originY);
    ctx.stroke();
  }
  for (let i = 0; i <= 4; i++) {
    const py = originY - i * step;
    if (py < 30) break;
    ctx.beginPath();
    ctx.moveTo(originX, py);
    ctx.lineTo(originX + maxWidth, py);
    ctx.stroke();
  }
}
