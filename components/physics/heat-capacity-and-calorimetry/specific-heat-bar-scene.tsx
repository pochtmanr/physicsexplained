"use client";

import { useEffect, useRef, useState } from "react";
import {
  FONT_HUD,
  FONT_HUD_SMALL,
  SCENE_CANVAS_CLASS,
  SCENE_HEIGHT_DEFAULT,
  applyDpr,
  hexToRgba,
  drawSectionTitle,
  useSceneSize,
  useSceneTokens,
  type SceneTokens,
} from "@/components/physics/_shared/scene-tokens";
import { SPECIFIC_HEATS } from "@/lib/physics/thermodynamics/calorimetry";

/**
 * FIG.03a — Specific heats, side by side.
 *
 * A bar chart of the specific heat capacity of eight everyday substances,
 * J/(g·K). Water towers over the metals: it takes ~4.2 J to warm a gram of
 * water by a kelvin, against ~0.13 J for lead. Hover a bar to read the exact
 * value and one real-world consequence of it — why oceans buffer climate, why
 * an iron skillet scorches, why mercury makes a quick thermometer.
 */

export function SpecificHeatBarScene() {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const tokens = useSceneTokens();
  const [hovered, setHovered] = useState<number | null>(null);

  const { width, height } = useSceneSize(containerRef, {
    ratio: 0.52,
    maxHeight: SCENE_HEIGHT_DEFAULT,
    minHeight: 300,
  });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = applyDpr(canvas, width, height);
    if (!ctx) return;
    draw(ctx, tokens, hovered, width, height);
  }, [hovered, tokens, width, height]);

  const onMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const idx = barIndexAt(x, width);
    setHovered(idx);
  };

  const active = hovered != null ? SPECIFIC_HEATS[hovered] : null;

  return (
    <div ref={containerRef} className="relative w-full pb-4">
      <canvas
        ref={canvasRef}
        style={{ width, height, display: "block" }}
        className={SCENE_CANVAS_CLASS}
        onMouseMove={onMove}
        onMouseLeave={() => setHovered(null)}
        aria-label="Bar chart of the specific heat capacity of eight substances in joules per gram per kelvin. Water is far higher than the metals. Hover a bar for its value and a real-world consequence."
      />
      <p className="mt-2 font-mono text-xs text-[var(--color-fg-3)]">
        {active
          ? `${active.name}: ${active.specificHeat.toFixed(3)} J/(g·K) — ${active.consequence}`
          : "hover a bar for its value and a real-world consequence"}
      </p>
    </div>
  );
}

const PAD = 16;

function plotRect(W: number, H: number) {
  return {
    x0: PAD + 36,
    x1: W - PAD,
    y0: PAD + 18,
    y1: H - PAD - 24,
  };
}

function barIndexAt(x: number, W: number): number | null {
  const { x0, x1 } = plotRect(W, 0);
  const n = SPECIFIC_HEATS.length;
  const slot = (x1 - x0) / n;
  if (x < x0 || x > x1) return null;
  const idx = Math.floor((x - x0) / slot);
  return idx >= 0 && idx < n ? idx : null;
}

function draw(
  ctx: CanvasRenderingContext2D,
  tokens: SceneTokens,
  hovered: number | null,
  W: number,
  H: number,
) {
  ctx.fillStyle = tokens.bg;
  ctx.fillRect(0, 0, W, H);
  drawSectionTitle(ctx, PAD, 4, "SPECIFIC HEAT  J/(g·K)", tokens.textMute);

  const { x0, x1, y0, y1 } = plotRect(W, H);
  const n = SPECIFIC_HEATS.length;
  const slot = (x1 - x0) / n;
  const maxC = Math.max(...SPECIFIC_HEATS.map((s) => s.specificHeat));

  // y gridlines / axis
  ctx.strokeStyle = tokens.axes;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(x0, y0);
  ctx.lineTo(x0, y1);
  ctx.lineTo(x1, y1);
  ctx.stroke();

  ctx.fillStyle = tokens.textFaint;
  ctx.font = FONT_HUD_SMALL;
  ctx.textAlign = "right";
  ctx.textBaseline = "middle";
  for (let g = 0; g <= 4; g++) {
    const val = (maxC * g) / 4;
    const y = y1 - (val / maxC) * (y1 - y0);
    ctx.strokeStyle = hexToRgba(tokens.gridHeavy, 0.25);
    ctx.beginPath();
    ctx.moveTo(x0, y);
    ctx.lineTo(x1, y);
    ctx.stroke();
    ctx.fillStyle = tokens.textFaint;
    ctx.fillText(val.toFixed(0), x0 - 4, y);
  }

  // bars
  for (let i = 0; i < n; i++) {
    const s = SPECIFIC_HEATS[i];
    const bx = x0 + i * slot + slot * 0.16;
    const bw = slot * 0.68;
    const bh = (s.specificHeat / maxC) * (y1 - y0);
    const by = y1 - bh;
    const isHot = hovered === i;
    const isWater = s.name === "Water";
    const color = isWater ? tokens.cyan : tokens.amber;
    ctx.fillStyle = hexToRgba(color, isHot ? 0.95 : 0.55);
    ctx.fillRect(bx, by, bw, bh);
    if (isHot) {
      ctx.strokeStyle = color;
      ctx.lineWidth = 1.5;
      ctx.strokeRect(bx, by, bw, bh);
      // value label above bar
      ctx.fillStyle = tokens.textBright;
      ctx.font = FONT_HUD;
      ctx.textAlign = "center";
      ctx.textBaseline = "bottom";
      ctx.fillText(s.specificHeat.toFixed(2), bx + bw / 2, by - 3);
    }
    // x label
    ctx.fillStyle = isHot ? tokens.textBright : tokens.textMute;
    ctx.font = FONT_HUD_SMALL;
    ctx.textAlign = "center";
    ctx.textBaseline = "top";
    ctx.save();
    ctx.translate(bx + bw / 2, y1 + 4);
    ctx.fillText(s.name, 0, 0);
    ctx.restore();
  }

  ctx.textAlign = "left";
  ctx.textBaseline = "alphabetic";
}
