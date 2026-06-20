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
import {
  ENGINE_COMPARISONS,
  carnotLimitOf,
} from "@/lib/physics/thermodynamics/carnot";

/**
 * FIG.08b — Real engines against the Carnot ceiling.
 *
 * Each entry shows a faint bar up to its Carnot limit, 1 − T_c/T_h, and a solid
 * bar to its actual efficiency. Every genuine heat engine sits below its
 * ceiling — the coal plant reaches about two-thirds of its limit, the car
 * engine far less. Muscle is the deliberate exception: it overshoots the tiny
 * limit that body-versus-air temperatures would set, because it is not a heat
 * engine at all but a direct chemical converter. Hover any pair for the story.
 */

export function EngineEfficiencyBarsScene() {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const tokens = useSceneTokens();
  const [hovered, setHovered] = useState<number | null>(null);

  const { width, height } = useSceneSize(containerRef, {
    ratio: 0.55,
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
    setHovered(barIndexAt(x, width));
  };

  const active = hovered != null ? ENGINE_COMPARISONS[hovered] : null;

  return (
    <div ref={containerRef} className="relative w-full pb-4">
      <canvas
        ref={canvasRef}
        style={{ width, height, display: "block" }}
        className={SCENE_CANVAS_CLASS}
        onMouseMove={onMove}
        onMouseLeave={() => setHovered(null)}
        aria-label="Bar chart comparing the actual efficiency of four engines with their Carnot limits. Coal plant, car engine, and steam turbine sit below their ceilings; human muscle exceeds its tiny limit because it is not a heat engine."
      />
      <p className="mt-2 font-mono text-xs text-[var(--color-fg-3)]">
        {active
          ? `${active.name}: ${(active.actualEfficiency * 100).toFixed(0)}% actual vs ${(
              carnotLimitOf(active) * 100
            ).toFixed(0)}% Carnot — ${active.note}`
          : "hover a pair for its actual efficiency, its Carnot limit, and the reason for the gap"}
      </p>
    </div>
  );
}

const PAD = 16;

function plotRect(W: number, H: number) {
  return { x0: PAD + 34, x1: W - PAD, y0: PAD + 22, y1: H - PAD - 26 };
}

function barIndexAt(x: number, W: number): number | null {
  const { x0, x1 } = plotRect(W, 0);
  const n = ENGINE_COMPARISONS.length;
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
  drawSectionTitle(ctx, PAD, 4, "EFFICIENCY  vs CARNOT LIMIT", tokens.textMute);

  const { x0, x1, y0, y1 } = plotRect(W, H);
  const n = ENGINE_COMPARISONS.length;
  const slot = (x1 - x0) / n;

  // axis + percent gridlines
  ctx.strokeStyle = tokens.axes;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(x0, y0);
  ctx.lineTo(x0, y1);
  ctx.lineTo(x1, y1);
  ctx.stroke();

  ctx.font = FONT_HUD_SMALL;
  ctx.textAlign = "right";
  ctx.textBaseline = "middle";
  for (let g = 0; g <= 4; g++) {
    const frac = g / 4;
    const y = y1 - frac * (y1 - y0);
    ctx.strokeStyle = hexToRgba(tokens.gridHeavy, 0.22);
    ctx.beginPath();
    ctx.moveTo(x0, y);
    ctx.lineTo(x1, y);
    ctx.stroke();
    ctx.fillStyle = tokens.textFaint;
    ctx.fillText(`${frac * 100}%`, x0 - 4, y);
  }

  for (let i = 0; i < n; i++) {
    const c = ENGINE_COMPARISONS[i];
    const limit = carnotLimitOf(c);
    const cx = x0 + i * slot + slot / 2;
    const bw = slot * 0.46;
    const isHot = hovered === i;

    // Carnot-limit bar (faint, behind)
    const limH = limit * (y1 - y0);
    ctx.fillStyle = hexToRgba(tokens.amber, isHot ? 0.4 : 0.22);
    ctx.fillRect(cx - bw / 2, y1 - limH, bw, limH);
    // dashed cap at the limit
    ctx.strokeStyle = hexToRgba(tokens.amber, 0.9);
    ctx.setLineDash([4, 3]);
    ctx.beginPath();
    ctx.moveTo(cx - bw / 2 - 3, y1 - limH);
    ctx.lineTo(cx + bw / 2 + 3, y1 - limH);
    ctx.stroke();
    ctx.setLineDash([]);

    // actual-efficiency bar (solid, front, narrower)
    const actH = c.actualEfficiency * (y1 - y0);
    const color = c.isHeatEngine ? tokens.cyan : tokens.magenta;
    ctx.fillStyle = hexToRgba(color, isHot ? 0.95 : 0.6);
    ctx.fillRect(cx - bw / 4, y1 - actH, bw / 2, actH);

    if (isHot) {
      ctx.fillStyle = tokens.textBright;
      ctx.font = FONT_HUD;
      ctx.textAlign = "center";
      ctx.textBaseline = "bottom";
      ctx.fillText(`${(c.actualEfficiency * 100).toFixed(0)}%`, cx, y1 - actH - 3);
    }

    // labels
    ctx.fillStyle = isHot ? tokens.textBright : tokens.textMute;
    ctx.font = FONT_HUD_SMALL;
    ctx.textAlign = "center";
    ctx.textBaseline = "top";
    const words = c.name.split(" ");
    words.forEach((wd, k) => ctx.fillText(wd, cx, y1 + 4 + k * 11));
  }

  // legend
  ctx.textAlign = "left";
  ctx.textBaseline = "middle";
  ctx.font = FONT_HUD_SMALL;
  ctx.fillStyle = tokens.textFaint;
  ctx.fillText("dashed = Carnot limit · solid = actual", x0 + 2, y0 - 8);
}
