"use client";

import { useEffect, useRef, useState } from "react";
import {
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
import { riverSpeedOverC } from "@/lib/physics/relativity/the-event-horizon";

/**
 * FIG.44c — The river model.
 *
 * Gullstrand–Painlevé picture: space itself flows radially inward toward the
 * hole at speed v_river(r)/c = √(r_s/r), and light always swims at speed c
 * relative to the local water. We draw the hole at the right edge, the horizon
 * as a vertical line where v_river = c, and a field of flowing "water" arrows
 * whose length tracks the local inflow speed. A "fish" (photon) released by the
 * slider tries to swim OUTWARD at c: its net ground speed is c − v_river.
 *   • Outside the horizon the river is sub-luminal, so the fish makes outward
 *     headway (net speed > 0) and escapes.
 *   • At the horizon the river runs at exactly c: the fish swims as hard as it
 *     can and stays exactly still — outgoing light is frozen there.
 *   • Inside, the river is super-luminal: the fish is swept inward despite
 *     swimming outward at full c. No local rule is broken; the water just wins.
 */

const PAD = 20;
const TAU = Math.PI * 2;

export function RiverModelScene() {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const tokens = useSceneTokens();
  // fish launch radius in units of r_s
  const [launch, setLaunch] = useState(1.8);
  const { width, height } = useSceneSize(containerRef, {
    ratio: 0.52,
    maxHeight: SCENE_HEIGHT_DEFAULT,
    minHeight: 300,
  });

  // animated fish position (in r/r_s), reset when launch changes
  const fishRef = useRef({ r: 1.8, t0: 0, started: false });
  useEffect(() => {
    fishRef.current = { r: launch, t0: 0, started: false };
  }, [launch]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = applyDpr(canvas, width, height);
    if (!ctx) return;

    let raf = 0;
    let last = 0;
    const loop = (t: number) => {
      const dt = last === 0 ? 0 : (t - last) / 1000;
      last = t;
      const fish = fishRef.current;
      // net outward speed in (r_s) per (r_s/c) ~ use c = 1 unit/s scaled
      const v = riverSpeedOverC(fish.r); // river inward speed / c
      const net = 1 - v; // fish swims +1 (outward), river drags −v
      // advance; clamp. speed scaled so motion is watchable.
      fish.r += net * dt * 0.6;
      if (fish.r > 3) fish.r = 3;
      if (fish.r < 0.02) fish.r = launch; // swallowed → relaunch
      draw(ctx, tokens, launch, fish.r, t / 1000, width, height);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [tokens, launch, width, height]);

  const vLaunch = riverSpeedOverC(launch);
  const net = 1 - vLaunch;

  return (
    <div ref={containerRef} className="relative w-full pb-4">
      <canvas
        ref={canvasRef}
        style={{ width, height, display: "block" }}
        className={SCENE_CANVAS_CLASS}
        aria-label="The river model of a black hole: space flows inward at a speed that exceeds light inside the horizon. A photon swimming outward at the speed of light makes headway outside, stalls at the horizon, and is swept inward beyond it."
      />
      <div className="mt-3 flex items-center gap-3 font-mono text-xs text-[var(--color-fg-2)]">
        <span className="w-44 shrink-0">launch r / r_s = {launch.toFixed(2)}</span>
        <input
          type="range"
          min={0.3}
          max={3}
          step={0.01}
          value={launch}
          onChange={(e) => setLaunch(parseFloat(e.target.value))}
          className="flex-1"
          style={{ accentColor: "var(--color-cyan)" }}
        />
      </div>
      <div className="mt-1 flex flex-wrap gap-x-6 gap-y-1 font-mono text-xs text-[var(--color-fg-3)]">
        <span>river v/c = {vLaunch.toFixed(2)}</span>
        <span>
          fish net (c − v)/c = {net.toFixed(2)}{" "}
          {net > 0.001 ? "→ escapes" : net < -0.001 ? "→ swept in" : "→ frozen"}
        </span>
      </div>
    </div>
  );
}

function draw(
  ctx: CanvasRenderingContext2D,
  tokens: SceneTokens,
  launch: number,
  fishR: number,
  time: number,
  W: number,
  H: number,
) {
  ctx.fillStyle = tokens.bg;
  ctx.fillRect(0, 0, W, H);

  // r increases to the LEFT, hole at the right. Map r∈[0,3] → x pixel.
  const plotX0 = PAD;
  const plotX1 = W - PAD;
  const plotW = plotX1 - plotX0;
  const midY = H * 0.52;
  const xMax = 3;
  // r=0 (hole centre) at right edge, r=3 at left edge
  const rToPx = (rr: number) => plotX1 - (rr / xMax) * plotW;

  drawSectionTitle(ctx, plotX0, PAD - 4, "SPACE FLOWS INWARD  →  (hole at right)", tokens.textMute);

  // hole disc at right (r from 0 to ~0.12)
  const holeX = rToPx(0);
  ctx.fillStyle = hexToRgba(tokens.textBright, 0.08);
  ctx.beginPath();
  ctx.arc(holeX, midY, 26, 0, TAU);
  ctx.fill();
  ctx.fillStyle = tokens.textFaint;
  ctx.font = FONT_HUD_SMALL;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("M", holeX, midY);

  // horizon at r = 1
  const hx = rToPx(1);
  ctx.strokeStyle = tokens.amber;
  ctx.setLineDash([5, 4]);
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  ctx.moveTo(hx, PAD + 12);
  ctx.lineTo(hx, H - PAD - 12);
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.fillStyle = tokens.amber;
  ctx.textAlign = "center";
  ctx.textBaseline = "bottom";
  ctx.fillText("horizon (v = c)", hx, PAD + 10);

  // ── flowing water arrows in two rows ──────────────────────────────────────
  const rows = [midY - 46, midY + 46];
  const N = 16;
  for (const ry of rows) {
    for (let i = 0; i < N; i++) {
      // sample radius along the row
      const rr = (xMax * (i + 0.5)) / N;
      if (rr <= 0.12) continue;
      const v = riverSpeedOverC(rr); // inward speed / c
      const baseX = rToPx(rr);
      // animate a flowing dash: phase moves toward the hole (rightward)
      const phase = (time * (0.4 + v * 0.6)) % 1;
      const len = 10 + Math.min(28, v * 18);
      // arrow points toward hole (to the right = decreasing r)
      const x0 = baseX + (phase - 0.5) * (plotW / N);
      const inside = rr < 1;
      const col = inside ? tokens.red : tokens.blue;
      ctx.strokeStyle = hexToRgba(col, 0.5 + Math.min(0.4, v * 0.3));
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(x0, ry);
      ctx.lineTo(x0 - len, ry); // toward hole (right is smaller r → −x... wait)
      ctx.stroke();
      // arrowhead pointing toward hole (toward smaller r = toward the right)
      const tipX = x0 - len;
      ctx.fillStyle = hexToRgba(col, 0.6);
      ctx.beginPath();
      ctx.moveTo(tipX, ry);
      ctx.lineTo(tipX + 5, ry - 3);
      ctx.lineTo(tipX + 5, ry + 3);
      ctx.closePath();
      ctx.fill();
    }
  }

  // ── the fish (photon swimming outward at c) ───────────────────────────────
  const fx = rToPx(fishR);
  const vAtFish = riverSpeedOverC(fishR);
  const fishColor = fishR < 1 ? tokens.red : tokens.cyan;
  // body
  ctx.fillStyle = fishColor;
  ctx.beginPath();
  ctx.arc(fx, midY, 6, 0, TAU);
  ctx.fill();
  // glow
  const g = ctx.createRadialGradient(fx, midY, 2, fx, midY, 20);
  g.addColorStop(0, hexToRgba(fishColor, 0.4));
  g.addColorStop(1, hexToRgba(fishColor, 0));
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.arc(fx, midY, 20, 0, TAU);
  ctx.fill();
  // intent arrow: fish swims OUTWARD (toward larger r = to the LEFT) at c
  ctx.strokeStyle = hexToRgba(tokens.cyan, 0.9);
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(fx, midY - 14);
  ctx.lineTo(fx - 20, midY - 14);
  ctx.stroke();
  ctx.fillStyle = hexToRgba(tokens.cyan, 0.9);
  ctx.beginPath();
  ctx.moveTo(fx - 20, midY - 14);
  ctx.lineTo(fx - 14, midY - 17);
  ctx.lineTo(fx - 14, midY - 11);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = tokens.textMute;
  ctx.font = FONT_HUD_SMALL;
  ctx.textAlign = "center";
  ctx.textBaseline = "top";
  const net = 1 - vAtFish;
  const verdict =
    net > 0.02 ? "swimming free" : net < -0.02 ? "swept inward" : "frozen";
  ctx.fillText(`photon: ${verdict}`, fx, midY + 16);

  // launch marker
  const lx = rToPx(launch);
  ctx.strokeStyle = hexToRgba(tokens.textFaint, 0.6);
  ctx.setLineDash([2, 3]);
  ctx.beginPath();
  ctx.moveTo(lx, midY - 70);
  ctx.lineTo(lx, midY + 70);
  ctx.stroke();
  ctx.setLineDash([]);
}
