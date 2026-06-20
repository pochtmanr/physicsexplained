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
import {
  properDistance,
  recessionVelocity,
} from "@/lib/physics/relativity/the-flrw-metric";

/**
 * FIG.54a — The expanding grid.
 *
 * A square comoving grid carries fixed "galaxies" at integer lattice points.
 * Dragging the a(t) slider scales the whole grid uniformly about the origin
 * (lower-left): comoving coordinates never change, but proper separations
 * grow with a. Two tagged galaxies (cyan = origin observer, magenta = a
 * neighbour) get a proper-distance readout and a Hubble recession velocity
 * v = H·d. The point: galaxies ride the grid, they do not swim through it.
 *
 * Palette (theme-aware via useSceneTokens()):
 *   cyan    — the reference observer (origin) + its readouts
 *   magenta — the tagged comoving galaxy
 *   amber   — the proper-distance connector
 *   grid    — comoving gridlines
 */

const PAD = 20;
const GRID_N = 6; // comoving cells across
// Comoving coordinate of the tagged galaxy (fixed — it never moves on the grid)
const TAG = { gx: 4, gy: 3 };
// A fixed Hubble parameter in scene units (per unit "time"); only the product
// H·d is physical-looking here. Tuned so the readout sits near ~70 (km/s)/Mpc.
const H_SCENE = 70;

export function ExpandingGridScene() {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const tokens = useSceneTokens();
  const [a, setA] = useState(1.0);
  const { width, height } = useSceneSize(containerRef, {
    ratio: 0.62,
    maxHeight: SCENE_HEIGHT_DEFAULT,
    minHeight: 320,
  });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = applyDpr(canvas, width, height);
    if (!ctx) return;
    draw(ctx, tokens, a, width, height);
  }, [a, tokens, width, height]);

  // Comoving distance to the tagged galaxy (Pythagoras in comoving units)
  const chi = Math.hypot(TAG.gx, TAG.gy);
  const dProper = properDistance(a, chi);
  const v = recessionVelocity(H_SCENE, dProper);

  return (
    <div ref={containerRef} className="relative w-full pb-4">
      <canvas
        ref={canvasRef}
        style={{ width, height, display: "block" }}
        className={SCENE_CANVAS_CLASS}
        aria-label="An expanding comoving grid with galaxies fixed at lattice points. A scale-factor slider stretches the grid; the comoving coordinates stay fixed while the proper distance between two tagged galaxies grows."
      />
      <div className="mt-3 flex items-center gap-3 font-mono text-xs text-[var(--color-fg-2)]">
        <span className="w-44 shrink-0">a(t) = {a.toFixed(2)}</span>
        <input
          type="range"
          min={0.4}
          max={2.2}
          step={0.01}
          value={a}
          onChange={(e) => setA(parseFloat(e.target.value))}
          className="flex-1"
          style={{ accentColor: "var(--color-cyan)" }}
        />
      </div>
      <div className="mt-2 flex flex-wrap gap-x-6 gap-y-1 font-mono text-xs text-[var(--color-fg-3)]">
        {[
          { label: "early (a=0.5)", v: 0.5 },
          { label: "today (a=1)", v: 1.0 },
          { label: "future (a=1.6)", v: 1.6 },
          { label: "far future (a=2.2)", v: 2.2 },
        ].map((s) => (
          <button
            key={s.label}
            type="button"
            className="cursor-pointer hover:text-[var(--color-fg-1)]"
            onClick={() => setA(s.v)}
          >
            {s.label}
          </button>
        ))}
      </div>
    </div>
  );
}

function draw(
  ctx: CanvasRenderingContext2D,
  tokens: SceneTokens,
  a: number,
  W: number,
  H: number,
) {
  ctx.fillStyle = tokens.bg;
  ctx.fillRect(0, 0, W, H);

  // Plot area
  const x0 = PAD + 56; // room for the y-axis label gutter
  const y0 = H - PAD - 20;
  const plotW = W - x0 - PAD;
  const plotH = y0 - PAD - 18;

  // The grid is drawn at a reference cell size and then scaled by a/aRef so
  // that the WHOLE lattice stretches about the origin (x0, y0). aRef chosen so
  // that a = 1 fills the box comfortably.
  const aRef = 1.0;
  const baseCell = Math.min(plotW, plotH) / (GRID_N * 1.55);
  const cell = baseCell * (a / aRef);

  // map comoving (gx, gy) → screen, origin at lower-left
  const sx = (gx: number) => x0 + gx * cell;
  const sy = (gy: number) => y0 - gy * cell;

  // ── comoving gridlines ─────────────────────────────────────────────────
  ctx.lineWidth = 1;
  for (let i = 0; i <= GRID_N; i++) {
    const px = sx(i);
    const py = sy(i);
    // vertical
    if (px <= x0 + plotW + 1) {
      ctx.strokeStyle = i === 0 ? tokens.axes : tokens.grid;
      ctx.beginPath();
      ctx.moveTo(px, y0);
      ctx.lineTo(px, y0 - Math.min(GRID_N * cell, plotH));
      ctx.stroke();
    }
    // horizontal
    if (py >= y0 - plotH - 1) {
      ctx.strokeStyle = i === 0 ? tokens.axes : tokens.grid;
      ctx.beginPath();
      ctx.moveTo(x0, py);
      ctx.lineTo(x0 + Math.min(GRID_N * cell, plotW), py);
      ctx.stroke();
    }
  }

  // ── galaxies at every lattice point ────────────────────────────────────
  for (let gx = 0; gx <= GRID_N; gx++) {
    for (let gy = 0; gy <= GRID_N; gy++) {
      const px = sx(gx);
      const py = sy(gy);
      if (px > x0 + plotW + 2 || py < y0 - plotH - 2) continue;
      const isOrigin = gx === 0 && gy === 0;
      const isTag = gx === TAG.gx && gy === TAG.gy;
      if (isOrigin || isTag) continue;
      ctx.fillStyle = hexToRgba(tokens.textMute, 0.8);
      ctx.beginPath();
      ctx.arc(px, py, 2.2, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // ── proper-distance connector (amber) ──────────────────────────────────
  const ox = sx(0);
  const oy = sy(0);
  const tx = sx(TAG.gx);
  const ty = sy(TAG.gy);
  const tagOnScreen = tx <= x0 + plotW + 2 && ty >= y0 - plotH - 2;
  if (tagOnScreen) {
    ctx.strokeStyle = hexToRgba(tokens.amber, 0.9);
    ctx.lineWidth = 2;
    ctx.setLineDash([6, 4]);
    ctx.beginPath();
    ctx.moveTo(ox, oy);
    ctx.lineTo(tx, ty);
    ctx.stroke();
    ctx.setLineDash([]);
  }

  // origin observer (cyan)
  ctx.fillStyle = tokens.cyan;
  ctx.beginPath();
  ctx.arc(ox, oy, 5.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = tokens.textMute;
  ctx.font = FONT_HUD_SMALL;
  ctx.textAlign = "left";
  ctx.textBaseline = "bottom";
  ctx.fillText("us", ox + 8, oy - 4);

  // tagged galaxy (magenta)
  if (tagOnScreen) {
    ctx.fillStyle = tokens.magenta;
    ctx.beginPath();
    ctx.arc(tx, ty, 5.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = tokens.textMute;
    ctx.textAlign = "left";
    ctx.textBaseline = "bottom";
    ctx.fillText("galaxy A", tx + 8, ty - 4);
  }

  // ── readouts ───────────────────────────────────────────────────────────
  const chi = Math.hypot(TAG.gx, TAG.gy);
  const dProper = properDistance(a, chi);
  const v = recessionVelocity(H_SCENE, dProper);

  let hy = PAD;
  hy = drawHudReadout(
    ctx,
    PAD,
    hy,
    "comoving χ = ",
    `${chi.toFixed(2)} (fixed)`,
    tokens.textDim,
    tokens.magenta,
  );
  hy = drawHudReadout(
    ctx,
    PAD,
    hy,
    "proper d = ",
    `${dProper.toFixed(2)} = a·χ`,
    tokens.textDim,
    tokens.amber,
  );
  hy = drawHudReadout(
    ctx,
    PAD,
    hy,
    "v = H·d = ",
    `${v.toFixed(0)} (Hubble flow)`,
    tokens.textDim,
    tokens.cyan,
  );

  // axis caption
  ctx.fillStyle = tokens.textFaint;
  ctx.font = FONT_HUD_SMALL;
  ctx.textAlign = "left";
  ctx.textBaseline = "top";
  ctx.fillText("comoving coordinates — galaxies stay put on the grid", x0, y0 + 4);
}
