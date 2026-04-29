"use client";

import { useEffect, useRef } from "react";

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
 *   The side-by-side comparison makes the degeneration vivid: removing
 *   rest mass collapses one leg; energy and momentum become identical.
 *
 *   Palette: cyan = mc² leg; magenta = pc leg; amber = E (hypotenuse).
 *   Null label in amber: E = pc, p^μ p_μ = 0.
 */

const WIDTH = 720;
const HEIGHT = 380;

const ORIGIN_Y = HEIGHT - 80;
const VERT_PIXELS = 200; // mc² pixel size for the massive panel

// Panel geometry
const PANEL_W = WIDTH / 2 - 20;
const PANEL_MARGIN = 10;

// For a representative massive particle at β = 0.6
const BETA = 0.6;
const GAMMA_MASSIVE = 1 / Math.sqrt(1 - BETA * BETA); // ≈ 1.25
const MC2 = 1; // natural units
const PC_MASSIVE = GAMMA_MASSIVE * BETA * MC2; // γβmc²
const E_MASSIVE = GAMMA_MASSIVE * MC2; // γmc²

// For the photon panel: same absolute pc/E as massive for visual comparability
const E_PHOTON = E_MASSIVE; // same total E so panels are same hypotenuse length

export function PhotonIsNullScene() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    canvas.width = WIDTH * dpr;
    canvas.height = HEIGHT * dpr;
    canvas.style.width = `${WIDTH}px`;
    canvas.style.height = `${HEIGHT}px`;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, WIDTH, HEIGHT);

    // ── PANEL DIVIDER ────────────────────────────────────────────────────
    ctx.strokeStyle = "rgba(255,255,255,0.08)";
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.moveTo(WIDTH / 2, 20);
    ctx.lineTo(WIDTH / 2, HEIGHT - 20);
    ctx.stroke();
    ctx.setLineDash([]);

    // ── PANEL HEADERS ───────────────────────────────────────────────────
    ctx.font = "bold 12px ui-monospace, monospace";
    ctx.textAlign = "center";
    ctx.fillStyle = "rgba(255,255,255,0.7)";
    ctx.fillText("MASSIVE PARTICLE  (m ≠ 0)", PANEL_W / 2 + PANEL_MARGIN, 22);
    ctx.fillStyle = "#FBBF24";
    ctx.fillText("PHOTON  (m = 0,  null four-momentum)", WIDTH / 2 + PANEL_W / 2 + PANEL_MARGIN, 22);

    // ══════════════════════════════════════════════════════════════════════
    //  LEFT PANEL — massive particle
    // ══════════════════════════════════════════════════════════════════════

    const scale = VERT_PIXELS / MC2;
    const vertLen = MC2 * scale;
    const horizLen = PC_MASSIVE * scale;

    // Origins are the right-angle corners.
    const leftOriginX = PANEL_MARGIN + 90;

    const AL = { x: leftOriginX, y: ORIGIN_Y };
    const BL = { x: leftOriginX + horizLen, y: ORIGIN_Y };
    const CL = { x: leftOriginX, y: ORIGIN_Y - vertLen };

    drawGrid(ctx, leftOriginX, ORIGIN_Y, PANEL_W - 20);

    // Right-angle marker
    drawRightAngle(ctx, AL);

    // Vertical leg (mc², cyan)
    drawLeg(ctx, AL, CL, "#67E8F9", 3);
    // Horizontal leg (pc, magenta)
    drawLeg(ctx, AL, BL, "#FF6ADE", 3);
    // Hypotenuse (E, amber)
    drawLeg(ctx, BL, CL, "#FBBF24", 3);

    // Vertex dots
    for (const v of [AL, BL, CL]) dotAt(ctx, v);

    // Labels
    ctx.font = "12px ui-monospace, monospace";

    ctx.fillStyle = "#67E8F9";
    ctx.textAlign = "right";
    ctx.fillText("mc²", AL.x - 10, (AL.y + CL.y) / 2 + 4);
    ctx.fillText(`= ${MC2.toFixed(2)}`, AL.x - 10, (AL.y + CL.y) / 2 + 18);

    ctx.fillStyle = "#FF6ADE";
    ctx.textAlign = "center";
    ctx.fillText(`pc = ${PC_MASSIVE.toFixed(3)}`, (AL.x + BL.x) / 2, AL.y + 22);

    ctx.fillStyle = "#FBBF24";
    ctx.textAlign = "left";
    const midHL = { x: (BL.x + CL.x) / 2 + 6, y: (BL.y + CL.y) / 2 - 6 };
    ctx.fillText(`E = ${E_MASSIVE.toFixed(3)}`, midHL.x, midHL.y);

    // Invariant label
    ctx.fillStyle = "rgba(103,232,249,0.75)";
    ctx.textAlign = "center";
    ctx.font = "11px ui-monospace, monospace";
    ctx.fillText(
      `p^μ p_μ = (E/c)² − (pc)²/c² = m²c² = ${(MC2 * MC2).toFixed(2)}`,
      leftOriginX + PANEL_W / 4,
      HEIGHT - 18,
    );

    // ══════════════════════════════════════════════════════════════════════
    //  RIGHT PANEL — photon, null four-momentum
    // ══════════════════════════════════════════════════════════════════════

    // Photon: E = pc, vertical leg vanishes.
    // Hypotenuse = horizontal leg = E_PHOTON * scale.
    const photonHorizLen = E_PHOTON * scale;

    const rightOriginX = WIDTH / 2 + PANEL_MARGIN + 60;

    const AR = { x: rightOriginX, y: ORIGIN_Y };
    const BR = { x: rightOriginX + photonHorizLen, y: ORIGIN_Y };
    // CL at same y as AR — degenerate triangle, all three points collinear.
    const CR = { x: rightOriginX, y: ORIGIN_Y }; // same as AR — zero vertical leg

    drawGrid(ctx, rightOriginX, ORIGIN_Y, WIDTH - rightOriginX - 20);

    // Degenerate triangle: vertical leg has zero length — draw as a tiny stub
    // to show it literally vanished.
    ctx.strokeStyle = "rgba(103,232,249,0.25)";
    ctx.lineWidth = 2;
    ctx.setLineDash([3, 3]);
    ctx.beginPath();
    ctx.moveTo(AR.x, AR.y);
    ctx.lineTo(AR.x, AR.y - 10); // stub only — mc² = 0
    ctx.stroke();
    ctx.setLineDash([]);

    // Horizontal leg (magenta) = pc = E for photon
    drawLeg(ctx, AR, BR, "#FF6ADE", 3);

    // Hypotenuse coincides with horizontal leg for photon — draw amber on top
    // slightly offset so both are visible.
    drawLeg(ctx, { x: AR.x, y: AR.y - 3 }, { x: BR.x, y: BR.y - 3 }, "#FBBF24", 2);

    // Vertex dots
    for (const v of [AR, BR]) dotAt(ctx, v);
    // small stub-end dot
    dotAt(ctx, { x: AR.x, y: AR.y - 10 });

    // Labels
    ctx.font = "12px ui-monospace, monospace";

    // Cyan vanishing stub label
    ctx.fillStyle = "rgba(103,232,249,0.45)";
    ctx.textAlign = "right";
    ctx.fillText("mc² = 0", AR.x - 10, AR.y - 14);

    // Magenta / pc label
    ctx.fillStyle = "#FF6ADE";
    ctx.textAlign = "center";
    ctx.fillText(`pc = E = ${E_PHOTON.toFixed(3)}`, (AR.x + BR.x) / 2, AR.y + 22);

    // Amber hypotenuse label (collinear)
    ctx.fillStyle = "#FBBF24";
    ctx.textAlign = "center";
    ctx.fillText(`E = ${E_PHOTON.toFixed(3)}`, (AR.x + BR.x) / 2, AR.y - 12);

    // NULL callout box
    const boxX = rightOriginX;
    const boxY = ORIGIN_Y - vertLen + 10;
    ctx.fillStyle = "rgba(251,191,36,0.1)";
    ctx.fillRect(boxX, boxY, photonHorizLen, 50);
    ctx.strokeStyle = "rgba(251,191,36,0.5)";
    ctx.lineWidth = 1;
    ctx.strokeRect(boxX, boxY, photonHorizLen, 50);
    ctx.fillStyle = "#FBBF24";
    ctx.font = "bold 11px ui-monospace, monospace";
    ctx.textAlign = "center";
    ctx.fillText("NULL FOUR-MOMENTUM", boxX + photonHorizLen / 2, boxY + 18);
    ctx.font = "11px ui-monospace, monospace";
    ctx.fillText("p^μ p_μ = 0  |  E = pc", boxX + photonHorizLen / 2, boxY + 34);

    // Footer invariant for photon panel
    ctx.fillStyle = "rgba(251,191,36,0.75)";
    ctx.textAlign = "center";
    ctx.font = "11px ui-monospace, monospace";
    ctx.fillText(
      "m = 0  →  p^μ p_μ = (E/c)² − (pc/c)² = 0",
      rightOriginX + (WIDTH - rightOriginX - 20) / 2,
      HEIGHT - 18,
    );
  }, []);

  return (
    <div className="flex flex-col items-center gap-2 p-4">
      <canvas
        ref={canvasRef}
        className="rounded-md border border-white/10 bg-black/40"
      />
      <p className="font-mono text-xs text-white/40">
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
  color = "rgba(255,255,255,0.85)",
) {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(v.x, v.y, 3, 0, Math.PI * 2);
  ctx.fill();
}

function drawRightAngle(
  ctx: CanvasRenderingContext2D,
  corner: { x: number; y: number },
) {
  const tick = 10;
  ctx.strokeStyle = "rgba(255,255,255,0.4)";
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
) {
  ctx.strokeStyle = "rgba(255,255,255,0.05)";
  ctx.lineWidth = 1;
  const step = VERT_PIXELS / 2;
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
