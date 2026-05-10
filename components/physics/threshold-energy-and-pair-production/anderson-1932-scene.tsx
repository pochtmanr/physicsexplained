"use client";

/**
 * FIG.20c — Anderson's 1932 cloud-chamber positron discovery.
 *
 * Palette:
 *   cyan = electron reference track (expected curvature for e⁻)
 *   magenta = positron track (Anderson's observation — wrong curvature)
 */

import { useEffect, useRef } from "react";
import {
  applyDpr,
  hexToRgba,
  SCENE_CANVAS_CLASS,
  SCENE_HEIGHT_TALL,
  useSceneSize,
  useSceneTokens,
} from "@/components/physics/_shared/scene-tokens";

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
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const tokens = useSceneTokens();
  const { width, height } = useSceneSize(containerRef, {
    ratio: 0.6,
    maxHeight: SCENE_HEIGHT_TALL,
  });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = applyDpr(canvas, width, height);
    if (!ctx) return;

    const WIDTH = width;
    const HEIGHT = height;
    const PLATE_Y = HEIGHT / 2 - 20;
    const PLATE_THICKNESS = 14;

    ctx.fillStyle = tokens.bg;
    ctx.fillRect(0, 0, WIDTH, HEIGHT);

    // Subtle cloud-chamber texture
    ctx.save();
    for (let i = 0; i < 200; i++) {
      const rx = Math.random() * WIDTH;
      const ry = Math.random() * HEIGHT;
      ctx.fillStyle = hexToRgba(tokens.textBright, Math.random() * 0.025);
      ctx.beginPath();
      ctx.arc(rx, ry, Math.random() * 3 + 0.5, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();

    // Lead plate
    ctx.fillStyle = hexToRgba(tokens.textBright, 0.18);
    ctx.fillRect(0, PLATE_Y, WIDTH, PLATE_THICKNESS);
    ctx.fillStyle = tokens.textMute;
    ctx.font = "11px ui-monospace, monospace";
    ctx.textAlign = "left";
    ctx.fillText("Pb plate (6 mm)", 16, PLATE_Y - 6);

    // Magnetic field dots
    ctx.fillStyle = hexToRgba(tokens.textBright, 0.12);
    ctx.font = "14px ui-monospace, monospace";
    for (let xi = 60; xi < WIDTH; xi += 90) {
      for (let yi = 40; yi < HEIGHT; yi += 80) {
        if (yi > PLATE_Y - 6 && yi < PLATE_Y + PLATE_THICKNESS + 6) continue;
        ctx.beginPath();
        ctx.arc(xi, yi, 3, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // ── Reference electron track ──
    ctx.save();
    ctx.strokeStyle = hexToRgba(tokens.cyan, 0.4);
    ctx.lineWidth = 1.5;
    ctx.setLineDash([6, 4]);
    ctx.beginPath();
    const eCx = 500;
    const eCy = PLATE_Y + 60;
    const eR = 160;
    arcPath(ctx, eCx, eCy, eR, (120 * Math.PI) / 180, (68 * Math.PI) / 180, true);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = hexToRgba(tokens.cyan, 0.45);
    ctx.font = "11px ui-monospace, monospace";
    ctx.textAlign = "left";
    ctx.fillText("e⁻ expected curvature", 540, PLATE_Y + 90);
    ctx.restore();

    // ── Positron track below plate ──
    ctx.save();
    ctx.strokeStyle = tokens.magenta;
    ctx.lineWidth = 3;
    ctx.shadowColor = tokens.magenta;
    ctx.shadowBlur = 8;
    ctx.beginPath();
    const posCxBelow = 240;
    const posCyBelow = PLATE_Y + 80;
    const posRBelow = 150;
    arcPath(ctx, posCxBelow, posCyBelow, posRBelow, (60 * Math.PI) / 180, (112 * Math.PI) / 180, false);
    ctx.stroke();
    ctx.shadowBlur = 0;
    ctx.restore();

    // ── Positron track above plate ──
    ctx.save();
    ctx.strokeStyle = tokens.magenta;
    ctx.lineWidth = 2.5;
    ctx.shadowColor = tokens.magenta;
    ctx.shadowBlur = 6;
    ctx.beginPath();
    const posCxAbove = 310;
    const posCyAbove = PLATE_Y - 90;
    const posRAbove = 90;
    arcPath(ctx, posCxAbove, posCyAbove, posRAbove, (250 * Math.PI) / 180, (310 * Math.PI) / 180, false);
    ctx.stroke();
    ctx.shadowBlur = 0;
    ctx.restore();

    // Annotations
    ctx.fillStyle = tokens.magenta;
    ctx.font = "bold 12px ui-monospace, monospace";
    ctx.textAlign = "right";
    ctx.fillText("← curves the WRONG way for an electron", 360, PLATE_Y + 140);
    ctx.font = "12px ui-monospace, monospace";
    ctx.fillText("∴ positive charge → positron (e⁺)", 360, PLATE_Y + 158);

    // Momentum arrow
    ctx.save();
    ctx.strokeStyle = tokens.magenta;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(308, PLATE_Y + 26);
    ctx.lineTo(308, PLATE_Y + 6);
    ctx.stroke();
    ctx.fillStyle = tokens.magenta;
    ctx.beginPath();
    ctx.moveTo(308, PLATE_Y + 4);
    ctx.lineTo(303, PLATE_Y + 14);
    ctx.lineTo(313, PLATE_Y + 14);
    ctx.closePath();
    ctx.fill();
    ctx.restore();

    // Field label
    ctx.fillStyle = tokens.textFaint;
    ctx.font = "12px ui-monospace, monospace";
    ctx.textAlign = "right";
    ctx.fillText(B_LABEL, WIDTH - 20, 30);

    // Credit panel
    const panelX = WIDTH - 260;
    const panelY = HEIGHT - 120;
    ctx.fillStyle = hexToRgba(tokens.textBright, 0.05);
    ctx.beginPath();
    ctx.roundRect(panelX - 10, panelY - 10, 250, 105, 6);
    ctx.fill();
    ctx.strokeStyle = tokens.panelBorder;
    ctx.lineWidth = 1;
    ctx.stroke();

    ctx.font = "bold 12px ui-monospace, monospace";
    ctx.textAlign = "left";
    ctx.fillStyle = tokens.textBright;
    ctx.fillText("Paul Dirac — 1928", panelX, panelY + 14);
    ctx.fillStyle = tokens.textMute;
    ctx.font = "11px ui-monospace, monospace";
    ctx.fillText("predicted antimatter from", panelX, panelY + 30);
    ctx.fillText("relativistic quantum equation", panelX, panelY + 44);

    ctx.font = "bold 12px ui-monospace, monospace";
    ctx.fillStyle = tokens.magenta;
    ctx.fillText("Carl Anderson — 1932", panelX, panelY + 64);
    ctx.fillStyle = tokens.textMute;
    ctx.font = "11px ui-monospace, monospace";
    ctx.fillText("observed the positron in a", panelX, panelY + 80);
    ctx.fillText("cloud chamber — Nobel 1936", panelX, panelY + 94);

    ctx.fillStyle = tokens.textFaint;
    ctx.font = "12px ui-monospace, monospace";
    ctx.textAlign = "left";
    ctx.fillText(
      "magenta = e⁺ track  |  cyan dashed = expected e⁻ curvature  |  ● dots = B field out of page",
      16,
      HEIGHT - 14,
    );
  }, [tokens, width, height]);

  return (
    <div ref={containerRef} className="w-full pb-4">
      <canvas
        ref={canvasRef}
        style={{ width, height, display: "block" }}
        className={SCENE_CANVAS_CLASS}
      />
      <p className="mt-2 font-mono text-xs text-[var(--color-fg-3)]">
        Anderson 1932: the positron track curves opposite to an electron —
        the first observed antimatter particle, confirming Dirac&apos;s
        1928 prediction.
      </p>
    </div>
  );
}
