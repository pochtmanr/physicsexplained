"use client";

/**
 * FIG.20c — Anderson's 1932 cloud-chamber positron discovery.
 *
 * Facsimile of the famous cloud-chamber photograph: a particle track
 * curves through a magnetic field. A lead plate divides the chamber.
 * The particle enters from below, loses energy through the plate,
 * and curves with the WRONG sign for an electron — the first evidence
 * of antimatter. Carl Anderson identified it as a positive electron
 * (positron), confirming Paul Dirac's 1928 prediction.
 *
 * Palette:
 *   cyan = electron reference track (expected curvature for e⁻)
 *   magenta = positron track (Anderson's observation — wrong curvature)
 *   white/70 = lead plate
 *
 * Credits displayed: Dirac (1928 prediction) and Anderson (1932 observation).
 */

import { useEffect, useRef } from "react";

const WIDTH = 720;
const HEIGHT = 440;

// Lead plate position
const PLATE_Y = HEIGHT / 2 - 20;
const PLATE_THICKNESS = 14;

// Magnetic field out of page: curvature convention
// For B out of page: positive charge curves right, negative curves left
const B_LABEL = "B (out of page)";

function arcPath(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  r: number,
  startAngle: number,
  endAngle: number,
  anticlockwise: boolean,
) {
  ctx.arc(cx, cy, r, startAngle, endAngle, anticlockwise);
}

export function Anderson1932Scene() {
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

    // Background: dark chamber
    ctx.fillStyle = "#0A0C12";
    ctx.fillRect(0, 0, WIDTH, HEIGHT);

    // Subtle cloud-chamber texture
    ctx.save();
    for (let i = 0; i < 200; i++) {
      const rx = Math.random() * WIDTH;
      const ry = Math.random() * HEIGHT;
      ctx.fillStyle = `rgba(255,255,255,${Math.random() * 0.025})`;
      ctx.beginPath();
      ctx.arc(rx, ry, Math.random() * 3 + 0.5, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();

    // Lead plate
    ctx.fillStyle = "rgba(255,255,255,0.18)";
    ctx.fillRect(0, PLATE_Y, WIDTH, PLATE_THICKNESS);
    ctx.fillStyle = "rgba(255,255,255,0.45)";
    ctx.font = "11px ui-monospace, monospace";
    ctx.textAlign = "left";
    ctx.fillText("Pb plate (6 mm)", 16, PLATE_Y - 6);

    // Magnetic field arrows (dots for B out of page)
    ctx.fillStyle = "rgba(255,255,255,0.12)";
    ctx.font = "14px ui-monospace, monospace";
    for (let xi = 60; xi < WIDTH; xi += 90) {
      for (let yi = 40; yi < HEIGHT; yi += 80) {
        if (
          yi > PLATE_Y - 6 &&
          yi < PLATE_Y + PLATE_THICKNESS + 6
        )
          continue;
        ctx.beginPath();
        ctx.arc(xi, yi, 3, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // ── Reference electron track (below plate, entering from bottom-left) ──
    // e⁻ enters from below going up, curves LEFT (standard for B out of page)
    ctx.save();
    ctx.strokeStyle = "rgba(103,232,249,0.4)";
    ctx.lineWidth = 1.5;
    ctx.setLineDash([6, 4]);
    ctx.beginPath();
    // Arc: center to the right of the track so it curves left
    const eCx = 500;
    const eCy = PLATE_Y + 60;
    const eR = 160;
    // Going from bottom (angle ~120°) up to plate (angle ~70°)
    arcPath(ctx, eCx, eCy, eR, (120 * Math.PI) / 180, (68 * Math.PI) / 180, true);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = "rgba(103,232,249,0.45)";
    ctx.font = "11px ui-monospace, monospace";
    ctx.textAlign = "left";
    ctx.fillText("e⁻ expected curvature", 540, PLATE_Y + 90);
    ctx.restore();

    // ── Positron track below plate: enters from bottom, curves RIGHT ──
    // The "wrong way" — positive charge in same B curls right
    ctx.save();
    ctx.strokeStyle = "#FF6ADE";
    ctx.lineWidth = 3;
    ctx.shadowColor = "#FF6ADE";
    ctx.shadowBlur = 8;
    ctx.beginPath();
    const posCxBelow = 240;
    const posCyBelow = PLATE_Y + 80;
    const posRBelow = 150;
    // Curves RIGHT: center to the left
    arcPath(
      ctx,
      posCxBelow,
      posCyBelow,
      posRBelow,
      (60 * Math.PI) / 180,
      (112 * Math.PI) / 180,
      false,
    );
    ctx.stroke();
    ctx.shadowBlur = 0;
    ctx.restore();

    // ── Positron track above plate: same particle, lower energy, tighter radius ──
    ctx.save();
    ctx.strokeStyle = "#FF6ADE";
    ctx.lineWidth = 2.5;
    ctx.shadowColor = "#FF6ADE";
    ctx.shadowBlur = 6;
    ctx.beginPath();
    const posCxAbove = 310;
    const posCyAbove = PLATE_Y - 90;
    const posRAbove = 90; // tighter — lost energy in plate
    arcPath(
      ctx,
      posCxAbove,
      posCyAbove,
      posRAbove,
      (250 * Math.PI) / 180,
      (310 * Math.PI) / 180,
      false,
    );
    ctx.stroke();
    ctx.shadowBlur = 0;
    ctx.restore();

    // Curvature annotation arrow — pointing to the "wrong way"
    ctx.fillStyle = "#FF6ADE";
    ctx.font = "bold 12px ui-monospace, monospace";
    ctx.textAlign = "right";
    ctx.fillText("← curves the WRONG way for an electron", 360, PLATE_Y + 140);
    ctx.font = "12px ui-monospace, monospace";
    ctx.fillText("∴ positive charge → positron (e⁺)", 360, PLATE_Y + 158);

    // ── Momentum direction arrow on positron track ──
    ctx.save();
    ctx.strokeStyle = "#FF6ADE";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    // Arrow pointing upward into the plate
    ctx.moveTo(308, PLATE_Y + 26);
    ctx.lineTo(308, PLATE_Y + 6);
    ctx.stroke();
    ctx.fillStyle = "#FF6ADE";
    ctx.beginPath();
    ctx.moveTo(308, PLATE_Y + 4);
    ctx.lineTo(303, PLATE_Y + 14);
    ctx.lineTo(313, PLATE_Y + 14);
    ctx.closePath();
    ctx.fill();
    ctx.restore();

    // ── Magnetic field label ──
    ctx.fillStyle = "rgba(255,255,255,0.35)";
    ctx.font = "12px ui-monospace, monospace";
    ctx.textAlign = "right";
    ctx.fillText(B_LABEL, WIDTH - 20, 30);

    // ── Credit panel ──
    const panelX = WIDTH - 260;
    const panelY = HEIGHT - 120;
    ctx.fillStyle = "rgba(255,255,255,0.05)";
    ctx.beginPath();
    ctx.roundRect(panelX - 10, panelY - 10, 250, 105, 6);
    ctx.fill();
    ctx.strokeStyle = "rgba(255,255,255,0.12)";
    ctx.lineWidth = 1;
    ctx.stroke();

    ctx.font = "bold 12px ui-monospace, monospace";
    ctx.textAlign = "left";
    ctx.fillStyle = "rgba(255,255,255,0.85)";
    ctx.fillText("Paul Dirac — 1928", panelX, panelY + 14);
    ctx.fillStyle = "rgba(255,255,255,0.55)";
    ctx.font = "11px ui-monospace, monospace";
    ctx.fillText("predicted antimatter from", panelX, panelY + 30);
    ctx.fillText("relativistic quantum equation", panelX, panelY + 44);

    ctx.font = "bold 12px ui-monospace, monospace";
    ctx.fillStyle = "#FF6ADE";
    ctx.fillText("Carl Anderson — 1932", panelX, panelY + 64);
    ctx.fillStyle = "rgba(255,255,255,0.55)";
    ctx.font = "11px ui-monospace, monospace";
    ctx.fillText("observed the positron in a", panelX, panelY + 80);
    ctx.fillText("cloud chamber — Nobel 1936", panelX, panelY + 94);

    // ── Bottom HUD ──
    ctx.fillStyle = "rgba(255,255,255,0.4)";
    ctx.font = "12px ui-monospace, monospace";
    ctx.textAlign = "left";
    ctx.fillText(
      "magenta = e⁺ track  |  cyan dashed = expected e⁻ curvature  |  ● dots = B field out of page",
      16,
      HEIGHT - 14,
    );
  }, []);

  return (
    <div className="flex flex-col items-center gap-3 p-4">
      <canvas
        ref={canvasRef}
        className="rounded-md border border-white/10 bg-[#0A0C12]"
      />
      <p className="font-mono text-xs text-white/50">
        Anderson 1932: the positron track curves opposite to an electron —
        the first observed antimatter particle, confirming Dirac&apos;s
        1928 prediction.
      </p>
    </div>
  );
}
