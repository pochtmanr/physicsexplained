"use client";

import { useEffect, useRef, useState } from "react";
import {
  FONT_HUD_SMALL,
  SCENE_CANVAS_CLASS,
  SCENE_HEIGHT_DEFAULT,
  applyDpr,
  drawHudReadout,
  hexToRgba,
  useSceneSize,
  useSceneTokens,
  type SceneTokens,
} from "@/components/physics/_shared/scene-tokens";
import { recessionVelocity } from "@/lib/physics/relativity/the-flrw-metric";
import { Button } from "@/components/ui/button";

/**
 * FIG.54c — "Every observer is at the centre."
 *
 * A fixed comoving cluster of galaxies (raisins in the bread). An a(t) slider
 * uniformly scales all comoving separations. Crucially, you can pick ANY
 * galaxy as your viewpoint: the scene re-centres on it and draws recession
 * arrows. From every choice the picture is identical — everything recedes,
 * the farther the faster (v ∝ d). There is no special centre; the Big Bang
 * did not happen "at a point" in space. This is the honest version of the
 * balloon/raisin-bread analogy.
 *
 * Palette: cyan (chosen observer), magenta→amber (recession arrows scaled by
 * distance), grid faint connectors.
 */

// A fixed comoving cluster (coordinates in arbitrary comoving units, centred
// roughly on the spread). These never change — expansion only scales them.
const GALAXIES: { x: number; y: number }[] = [
  { x: 0, y: 0 },
  { x: 2.4, y: 0.6 },
  { x: -1.8, y: 1.4 },
  { x: 1.2, y: -2.0 },
  { x: -2.2, y: -1.2 },
  { x: 3.0, y: -1.4 },
  { x: -0.6, y: 2.4 },
  { x: 1.9, y: 2.1 },
  { x: -3.0, y: 0.3 },
  { x: 0.8, y: -3.0 },
];

const H_SCENE = 0.9; // scene Hubble parameter for arrow lengths

export function CenterEverywhereScene() {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const tokens = useSceneTokens();
  const [a, setA] = useState(1.4);
  const [observer, setObserver] = useState(0);
  const { width, height } = useSceneSize(containerRef, {
    ratio: 0.6,
    maxHeight: SCENE_HEIGHT_DEFAULT,
    minHeight: 320,
  });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = applyDpr(canvas, width, height);
    if (!ctx) return;
    draw(ctx, tokens, a, observer, width, height);
  }, [a, observer, tokens, width, height]);

  return (
    <div ref={containerRef} className="relative w-full pb-4">
      <canvas
        ref={canvasRef}
        style={{ width, height, display: "block" }}
        className={SCENE_CANVAS_CLASS}
        aria-label="A cluster of comoving galaxies. Picking any galaxy as the observer re-centres the view; from every viewpoint all other galaxies recede, with velocity proportional to distance. No galaxy is the centre."
      />
      <div className="mt-3 flex items-center gap-3 font-mono text-xs text-[var(--color-fg-2)]">
        <span className="w-44 shrink-0">a(t) = {a.toFixed(2)}</span>
        <input
          type="range"
          min={0.6}
          max={2.4}
          step={0.01}
          value={a}
          onChange={(e) => setA(parseFloat(e.target.value))}
          className="flex-1"
          style={{ accentColor: "var(--color-cyan)" }}
        />
      </div>
      <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 font-mono text-xs text-[var(--color-fg-3)]">
        <span className="text-[var(--color-fg-4)]">viewpoint:</span>
        {GALAXIES.map((_, i) => (
          <Button
            key={i}
            size="sm"
            active={i === observer}
            onClick={() => setObserver(i)}
          >
            {String.fromCharCode(65 + i)}
          </Button>
        ))}
      </div>
    </div>
  );
}

function draw(
  ctx: CanvasRenderingContext2D,
  tokens: SceneTokens,
  a: number,
  observer: number,
  W: number,
  H: number,
) {
  ctx.fillStyle = tokens.bg;
  ctx.fillRect(0, 0, W, H);

  const cx = W / 2;
  const cy = H / 2;
  // pixels per comoving unit at a = 1
  const scale = Math.min(W, H) / 9;

  const obs = GALAXIES[observer];

  // screen position of a galaxy relative to the chosen observer (re-centred)
  const sx = (g: { x: number; y: number }) => cx + (g.x - obs.x) * a * scale;
  const sy = (g: { x: number; y: number }) => cy - (g.y - obs.y) * a * scale;

  // ── recession arrows from the observer ─────────────────────────────────
  GALAXIES.forEach((g, i) => {
    if (i === observer) return;
    const px = sx(g);
    const py = sy(g);
    // comoving distance from observer
    const dChi = Math.hypot(g.x - obs.x, g.y - obs.y);
    const dProper = a * dChi;
    const v = recessionVelocity(H_SCENE, dProper);

    // arrow points radially outward from observer (cx, cy), length ∝ v
    const dx = px - cx;
    const dy = py - cy;
    const len = Math.hypot(dx, dy) || 1;
    const ux = dx / len;
    const uy = dy / len;
    const arrowLen = Math.min(38, v * scale * 0.5);

    // connector from observer to galaxy (faint)
    ctx.strokeStyle = hexToRgba(tokens.grid, 0.9);
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(px, py);
    ctx.stroke();

    // recession arrow at the galaxy — colour ramps amber→magenta with distance
    const tcol = Math.min(1, dProper / (5 * a));
    const arrowColor = tcol < 0.5
      ? hexToRgba(tokens.amber, 1)
      : hexToRgba(tokens.magenta, 1);
    drawSmallArrow(ctx, px, py, px + ux * arrowLen, py + uy * arrowLen, arrowColor);
  });

  // ── galaxies ───────────────────────────────────────────────────────────
  GALAXIES.forEach((g, i) => {
    const px = sx(g);
    const py = sy(g);
    const isObs = i === observer;
    ctx.fillStyle = isObs ? tokens.cyan : hexToRgba(tokens.textMute, 0.95);
    ctx.beginPath();
    ctx.arc(px, py, isObs ? 6 : 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = isObs ? tokens.cyan : tokens.textFaint;
    ctx.font = FONT_HUD_SMALL;
    ctx.textAlign = "center";
    ctx.textBaseline = "bottom";
    ctx.fillText(String.fromCharCode(65 + i), px, py - 7);
  });

  // observer ring
  ctx.strokeStyle = hexToRgba(tokens.cyan, 0.5);
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.arc(cx, cy, 11, 0, Math.PI * 2);
  ctx.stroke();

  // ── readouts ───────────────────────────────────────────────────────────
  let hy = 14;
  hy = drawHudReadout(
    ctx,
    14,
    hy,
    "viewpoint = ",
    `galaxy ${String.fromCharCode(65 + observer)}`,
    tokens.textDim,
    tokens.cyan,
  );
  hy = drawHudReadout(
    ctx,
    14,
    hy,
    "law = ",
    "v ∝ d  (every observer)",
    tokens.textDim,
    tokens.amber,
  );

  ctx.fillStyle = tokens.textFaint;
  ctx.font = FONT_HUD_SMALL;
  ctx.textAlign = "center";
  ctx.textBaseline = "bottom";
  ctx.fillText(
    "switch viewpoint — the recession pattern is identical from every galaxy",
    W / 2,
    H - 8,
  );
}

function drawSmallArrow(
  ctx: CanvasRenderingContext2D,
  x0: number,
  y0: number,
  x1: number,
  y1: number,
  color: string,
) {
  const dx = x1 - x0;
  const dy = y1 - y0;
  const len = Math.hypot(dx, dy);
  if (len < 2) return;
  const ux = dx / len;
  const uy = dy / len;
  const head = 6;
  ctx.save();
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(x0, y0);
  ctx.lineTo(x1, y1);
  ctx.stroke();
  const perpX = -uy * head * 0.5;
  const perpY = ux * head * 0.5;
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x1 - ux * head + perpX, y1 - uy * head + perpY);
  ctx.lineTo(x1 - ux * head - perpX, y1 - uy * head - perpY);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}
