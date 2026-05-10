"use client";

import { useEffect, useRef } from "react";
import {
  SCENE_CANVAS_CLASS,
  SCENE_HEIGHT_DEFAULT,
  applyDpr,
  hexToRgba,
  useSceneSize,
  useSceneTokens,
  type SceneTokens,
} from "@/components/physics/_shared/scene-tokens";

/**
 * FIG.28c — The §06.4 closer. A static text-and-equation panel.
 */

export function HonestMomentScene() {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const tokens = useSceneTokens();
  const { width, height } = useSceneSize(containerRef, {
    ratio: 0.5,
    maxHeight: SCENE_HEIGHT_DEFAULT,
    minHeight: 280,
  });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = applyDpr(canvas, width, height);
    if (!ctx) return;
    ctx.clearRect(0, 0, width, height);
    draw(ctx, width, height, tokens);
  }, [tokens, width, height]);

  return (
    <div ref={containerRef} className="flex w-full flex-col gap-3 pb-4">
      <canvas
        ref={canvasRef}
        style={{ width, height, display: "block" }}
        className={SCENE_CANVAS_CLASS}
      />
    </div>
  );
}

function draw(
  ctx: CanvasRenderingContext2D,
  W: number,
  H: number,
  tokens: SceneTokens,
) {
  // Background tint — slight violet wash, derived from theme purple.
  const bgGrad = ctx.createLinearGradient(0, 0, 0, H);
  bgGrad.addColorStop(0, hexToRgba(tokens.purple, 0.06));
  bgGrad.addColorStop(1, hexToRgba(tokens.bg, 0.30));
  ctx.fillStyle = tokens.bg;
  ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, W, H);

  ctx.fillStyle = tokens.textBright;
  ctx.font = "bold 22px ui-sans-serif, system-ui, sans-serif";
  ctx.textAlign = "center";
  ctx.fillText("There is no force called gravity.", W / 2, 84);

  ctx.fillStyle = tokens.purple;
  ctx.font = "bold 22px ui-sans-serif, system-ui, sans-serif";
  ctx.fillText("There is curvature.", W / 2, 116);

  ctx.strokeStyle = hexToRgba(tokens.textBright, 0.14);
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(W / 2 - 100, 142);
  ctx.lineTo(W / 2 + 100, 142);
  ctx.stroke();

  ctx.fillStyle = tokens.textDim;
  ctx.font = "11px ui-monospace, monospace";
  ctx.textAlign = "center";
  ctx.fillText(
    "Session 4 derives the geometry. The equation is —",
    W / 2,
    168,
  );

  ctx.fillStyle = tokens.amber;
  ctx.font = "bold 20px ui-monospace, monospace";
  ctx.textAlign = "center";
  ctx.fillText(
    "R_μν − ½ g_μν R = (8π G / c⁴) T_μν",
    W / 2,
    210,
  );

  ctx.fillStyle = tokens.textFaint;
  ctx.font = "10px ui-monospace, monospace";
  ctx.fillText(
    "left side: how spacetime curves   ·   right side: where the matter and energy are",
    W / 2,
    236,
  );

  ctx.fillStyle = tokens.textDim;
  ctx.font = "12px ui-sans-serif, system-ui, sans-serif";
  ctx.textAlign = "center";
  ctx.fillText(
    "Free-falling along curvature looks like falling.",
    W / 2,
    284,
  );

  ctx.fillStyle = tokens.textDim;
  ctx.fillText(
    "The next module formalizes the geometry.",
    W / 2,
    306,
  );

  ctx.fillStyle = tokens.purple;
  ctx.font = "11px ui-monospace, monospace";
  ctx.fillText(
    "→  §07: manifolds, tangent spaces, metrics, Christoffels, geodesics.",
    W / 2,
    334,
  );
}
