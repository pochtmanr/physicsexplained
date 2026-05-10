"use client";

import { useEffect, useRef, useState } from "react";
import { schwarzschildRadius } from "@/lib/physics/relativity/gravity-as-geometry";
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
 * FIG.28b — The rubber-sheet embedding diagram.
 */

const M_MIN = 0.0;
const M_MAX = 10.0;
const GRID_LINES = 12;
const GRID_HALF = 220;

function depthAt(r: number, mSolar: number): number {
  const a = 80 + 25 * mSolar;
  return -mSolar * 32 / (1 + (r * r) / (a * a));
}

function project(xPlane: number, yPlane: number, z: number, cx: number, cy: number) {
  return {
    x: cx + xPlane,
    y: cy + yPlane * 0.45 + z,
  };
}

export function EmbeddedCurvatureScene() {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const tokens = useSceneTokens();
  const { width, height } = useSceneSize(containerRef, {
    ratio: 0.5,
    maxHeight: SCENE_HEIGHT_DEFAULT,
    minHeight: 280,
  });
  const [mSolar, setMSolar] = useState(3.0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = applyDpr(canvas, width, height);
    if (!ctx) return;
    ctx.clearRect(0, 0, width, height);
    draw(ctx, width, height, mSolar, tokens);
  }, [mSolar, tokens, width, height]);

  return (
    <div ref={containerRef} className="flex w-full flex-col gap-3 pb-4">
      <canvas
        ref={canvasRef}
        style={{ width, height, display: "block" }}
        className={SCENE_CANVAS_CLASS}
      />
      <div className="flex flex-col gap-2 px-1">
        <label className="flex items-center gap-3 font-mono text-xs text-[var(--color-fg-2)]">
          <span className="w-28">M = {mSolar.toFixed(2)} M_sun</span>
          <input
            type="range"
            min={M_MIN}
            max={M_MAX}
            step={0.05}
            value={mSolar}
            onChange={(e) => setMSolar(parseFloat(e.target.value))}
            className="flex-1"
            style={{ accentColor: "var(--color-amber)" }}
          />
        </label>
        <p className="font-mono text-xs text-[var(--color-fg-4)]">
          Drag M. The sheet is the picture; the math underneath is a metric on a manifold —
          §07 makes that rigorous, without ever invoking a fourth dimension to embed into.
        </p>
      </div>
    </div>
  );
}

function draw(
  ctx: CanvasRenderingContext2D,
  W: number,
  H: number,
  mSolar: number,
  tokens: SceneTokens,
) {
  ctx.fillStyle = tokens.bg;
  ctx.fillRect(0, 0, W, H);

  const cx = W / 2;
  const cy = H / 2 + 30;

  ctx.fillStyle = tokens.textBright;
  ctx.font = "bold 11px ui-monospace, monospace";
  ctx.textAlign = "left";
  ctx.fillText("embedding diagram (pedagogical, not literal)", 16, 20);

  ctx.strokeStyle = hexToRgba(tokens.purple, 0.30);
  ctx.lineWidth = 1;

  for (let i = 0; i < GRID_LINES; i++) {
    const yPlane = -GRID_HALF + (i / (GRID_LINES - 1)) * (GRID_HALF * 2);
    ctx.beginPath();
    const samples = 80;
    for (let s = 0; s <= samples; s++) {
      const xPlane = -GRID_HALF + (s / samples) * (GRID_HALF * 2);
      const r = Math.sqrt(xPlane * xPlane + yPlane * yPlane);
      const z = depthAt(r, mSolar);
      const p = project(xPlane, yPlane, z, cx, cy);
      if (s === 0) ctx.moveTo(p.x, p.y);
      else ctx.lineTo(p.x, p.y);
    }
    ctx.stroke();
  }

  for (let i = 0; i < GRID_LINES; i++) {
    const xPlane = -GRID_HALF + (i / (GRID_LINES - 1)) * (GRID_HALF * 2);
    ctx.beginPath();
    const samples = 80;
    for (let s = 0; s <= samples; s++) {
      const yPlane = -GRID_HALF + (s / samples) * (GRID_HALF * 2);
      const r = Math.sqrt(xPlane * xPlane + yPlane * yPlane);
      const z = depthAt(r, mSolar);
      const p = project(xPlane, yPlane, z, cx, cy);
      if (s === 0) ctx.moveTo(p.x, p.y);
      else ctx.lineTo(p.x, p.y);
    }
    ctx.stroke();
  }

  // Central mass
  const centerZ = depthAt(0, mSolar);
  const centerProj = project(0, 0, centerZ, cx, cy);
  const massR = 8 + Math.min(20, mSolar * 1.5);
  const grad = ctx.createRadialGradient(
    centerProj.x,
    centerProj.y,
    0,
    centerProj.x,
    centerProj.y,
    massR,
  );
  grad.addColorStop(0, tokens.amber);
  grad.addColorStop(1, tokens.orange);
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.arc(centerProj.x, centerProj.y, massR, 0, Math.PI * 2);
  ctx.fill();

  // Test-particle geodesics
  const colors = [tokens.cyan, tokens.mint, tokens.magenta];
  const startYs = [-95, 0, 95];

  for (let g = 0; g < 3; g++) {
    const startY = startYs[g];
    ctx.strokeStyle = colors[g];
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    let xPlane = -GRID_HALF * 0.95;
    let yPlane = startY;
    let vy = 0;
    const dt = 0.04;
    const samples = 200;
    for (let s = 0; s <= samples; s++) {
      const r = Math.max(8, Math.sqrt(xPlane * xPlane + yPlane * yPlane));
      const z = depthAt(r, mSolar);
      const p = project(xPlane, yPlane, z, cx, cy);
      if (s === 0) ctx.moveTo(p.x, p.y);
      else ctx.lineTo(p.x, p.y);

      const ay = -mSolar * 12 * (yPlane / (r * r * r * 0.001 + 1));
      vy += ay * dt;
      yPlane += vy * dt;
      xPlane += (GRID_HALF * 1.9 / samples);
    }
    ctx.stroke();

    const r = Math.max(8, Math.sqrt(xPlane * xPlane + yPlane * yPlane));
    const z = depthAt(r, mSolar);
    const p = project(xPlane, yPlane, z, cx, cy);
    ctx.fillStyle = colors[g];
    ctx.beginPath();
    ctx.arc(p.x, p.y, 3.5, 0, Math.PI * 2);
    ctx.fill();
  }

  const M_kg = mSolar * 1.989e30;
  const rsKm = mSolar > 0 ? schwarzschildRadius(M_kg) / 1000 : 0;

  ctx.fillStyle = tokens.textDim;
  ctx.font = "10px ui-monospace, monospace";
  ctx.textAlign = "left";
  ctx.fillText(
    `M = ${mSolar.toFixed(2)} M_sun    r_s = ${rsKm.toFixed(2)} km`,
    16,
    H - 36,
  );

  ctx.fillStyle = tokens.red;
  ctx.font = "9px ui-monospace, monospace";
  ctx.fillText(
    "embedding diagrams are pedagogical, not literal — real spacetime",
    16,
    H - 22,
  );
  ctx.fillText(
    "curvature is intrinsic, not an embedding into a higher-dimensional space.",
    16,
    H - 10,
  );
}
