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
  useSceneTick,
  useSceneTokens,
  type SceneTokens,
} from "@/components/physics/_shared/scene-tokens";
import { mulberry32, type Rng } from "@/lib/physics/thermodynamics/random";
import { gaussianStep2D } from "@/lib/physics/thermodynamics/brownian";

/**
 * FIG.18a — a single grain on its random walk. Each frame the particle takes an
 * independent Gaussian kick on both axes; its path fades behind it. Beside the
 * box, the running mean-square displacement ⟨r²⟩ is plotted against time — and
 * it climbs in a straight line, the signature Einstein predicted: ⟨r²⟩ = 4Dt in
 * two dimensions. Crank the kick magnitude and the line steepens (D grows) while
 * the walk stays a walk — never a straight drift.
 */

const STEPS_PER_FRAME = 1;
const MAX_TRAIL = 1400;
const MSD_WINDOW = 600; // time steps shown on the ⟨r²⟩ plot

export function BrownianWalkScene() {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const tokens = useSceneTokens();
  const [kick, setKick] = useState(1.0);
  const tickRef = useSceneTick(true);

  const { width, height } = useSceneSize(containerRef, {
    ratio: 0.5,
    maxHeight: SCENE_HEIGHT_DEFAULT,
    minHeight: 280,
  });

  // simulation state lives in refs so the animation doesn't re-render React
  const rngRef = useRef<Rng>(mulberry32(20051905));
  const trailRef = useRef<{ x: number; y: number }[]>([{ x: 0, y: 0 }]);
  const posRef = useRef({ x: 0, y: 0 });
  const msdRef = useRef<number[]>([0]);
  const kickRef = useRef(kick);
  kickRef.current = kick;
  const lastStepRef = useRef(0);

  // reset on demand
  const reset = () => {
    rngRef.current = mulberry32(20051905);
    trailRef.current = [{ x: 0, y: 0 }];
    posRef.current = { x: 0, y: 0 };
    msdRef.current = [0];
    lastStepRef.current = 0;
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = applyDpr(canvas, width, height);
    if (!ctx) return;

    let raf = 0;
    const loop = () => {
      // advance the walk a fixed number of kicks per frame
      for (let s = 0; s < STEPS_PER_FRAME; s++) {
        const { dx, dy } = gaussianStep2D(rngRef.current, kickRef.current);
        posRef.current = { x: posRef.current.x + dx, y: posRef.current.y + dy };
        trailRef.current.push({ ...posRef.current });
        if (trailRef.current.length > MAX_TRAIL) trailRef.current.shift();
        const r2 = posRef.current.x ** 2 + posRef.current.y ** 2;
        msdRef.current.push(r2);
        if (msdRef.current.length > MSD_WINDOW) msdRef.current.shift();
      }
      draw(ctx, tokens, trailRef.current, msdRef.current, kickRef.current, width, height);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
    // tickRef intentionally referenced to keep the ticker mounted
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tokens, width, height]);

  return (
    <div ref={containerRef} className="relative w-full pb-4">
      <canvas
        ref={canvasRef}
        style={{ width, height, display: "block" }}
        className={SCENE_CANVAS_CLASS}
        aria-label="A particle taking a two-dimensional random walk, leaving a fading trail. Beside it, the mean-square displacement is plotted against time and rises in a straight line, confirming the diffusion law."
      />
      <div className="mt-3 flex items-center gap-3 font-mono text-xs text-[var(--color-fg-2)]">
        <span className="w-40 shrink-0">kick magnitude: {kick.toFixed(2)}</span>
        <input
          type="range"
          min={0.2}
          max={2.5}
          step={0.05}
          value={kick}
          onChange={(e) => setKick(parseFloat(e.target.value))}
          className="flex-1"
          style={{ accentColor: "var(--color-cyan)" }}
        />
        <button
          type="button"
          onClick={reset}
          className="cursor-pointer rounded-sm border px-2 py-0.5"
          style={{ borderColor: "var(--color-fg-4)", color: "var(--color-fg-3)" }}
        >
          reset
        </button>
      </div>
    </div>
  );
}

function draw(
  ctx: CanvasRenderingContext2D,
  tokens: SceneTokens,
  trail: { x: number; y: number }[],
  msd: number[],
  kick: number,
  W: number,
  H: number,
) {
  ctx.fillStyle = tokens.bg;
  ctx.fillRect(0, 0, W, H);

  const gap = 18;
  const leftW = Math.min(H, W * 0.5);
  const walkX0 = 0;
  drawWalk(ctx, tokens, trail, walkX0, leftW, H);
  const plotX0 = leftW + gap;
  drawMsd(ctx, tokens, msd, kick, plotX0, W - plotX0, H);
}

function drawWalk(
  ctx: CanvasRenderingContext2D,
  tokens: SceneTokens,
  trail: { x: number; y: number }[],
  x0: number,
  panelW: number,
  H: number,
) {
  drawSectionTitle(ctx, x0 + 12, 8, "RANDOM WALK", tokens.textMute);
  const cx = x0 + panelW / 2;
  const cy = H / 2;

  // auto-scale so the whole trail fits with margin
  let maxAbs = 10;
  for (const p of trail) maxAbs = Math.max(maxAbs, Math.abs(p.x), Math.abs(p.y));
  const scale = (Math.min(panelW, H) / 2 - 24) / maxAbs;

  // faint origin crosshair
  ctx.strokeStyle = hexToRgba(tokens.gridHeavy, 0.25);
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(x0 + 12, cy);
  ctx.lineTo(x0 + panelW - 12, cy);
  ctx.moveTo(cx, 24);
  ctx.lineTo(cx, H - 12);
  ctx.stroke();

  // fading trail
  ctx.lineWidth = 1.5;
  for (let i = 1; i < trail.length; i++) {
    const a = i / trail.length; // older = fainter
    ctx.strokeStyle = hexToRgba(tokens.cyan, 0.08 + 0.5 * a);
    ctx.beginPath();
    ctx.moveTo(cx + trail[i - 1].x * scale, cy - trail[i - 1].y * scale);
    ctx.lineTo(cx + trail[i].x * scale, cy - trail[i].y * scale);
    ctx.stroke();
  }

  // origin marker
  ctx.fillStyle = hexToRgba(tokens.textFaint, 0.7);
  ctx.beginPath();
  ctx.arc(cx, cy, 2.5, 0, Math.PI * 2);
  ctx.fill();

  // current particle
  const last = trail[trail.length - 1];
  ctx.fillStyle = tokens.amber;
  ctx.beginPath();
  ctx.arc(cx + last.x * scale, cy - last.y * scale, 5, 0, Math.PI * 2);
  ctx.fill();
}

function drawMsd(
  ctx: CanvasRenderingContext2D,
  tokens: SceneTokens,
  msd: number[],
  kick: number,
  x0: number,
  panelW: number,
  H: number,
) {
  drawSectionTitle(ctx, x0 + 30, 8, "⟨r²⟩ vs TIME", tokens.textMute);
  const padL = 30;
  const padR = 12;
  const padT = 26;
  const padB = 24;
  const gx0 = x0 + padL;
  const gx1 = x0 + panelW - padR;
  const gy0 = padT;
  const gy1 = H - padB;

  const n = msd.length;
  let maxR2 = 1;
  for (const v of msd) maxR2 = Math.max(maxR2, v);
  // smooth the ceiling so the curve doesn't jump every frame
  maxR2 *= 1.1;

  const xOf = (i: number) => gx0 + (i / Math.max(1, MSD_WINDOW - 1)) * (gx1 - gx0);
  const yOf = (v: number) => gy1 - (v / maxR2) * (gy1 - gy0);

  // axes
  ctx.strokeStyle = tokens.axes;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(gx0, gy0);
  ctx.lineTo(gx0, gy1);
  ctx.lineTo(gx1, gy1);
  ctx.stroke();

  // theoretical line ⟨r²⟩ = 4D t, with D = kick²/2 ⇒ slope = 2·kick² per step
  const slope = 2 * kick * kick;
  ctx.strokeStyle = hexToRgba(tokens.mint, 0.7);
  ctx.setLineDash([5, 4]);
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(xOf(0), yOf(0));
  ctx.lineTo(xOf(MSD_WINDOW - 1), yOf(slope * (MSD_WINDOW - 1)));
  ctx.stroke();
  ctx.setLineDash([]);

  // measured curve
  ctx.strokeStyle = tokens.cyan;
  ctx.lineWidth = 2;
  ctx.beginPath();
  for (let i = 0; i < n; i++) {
    const x = xOf(i);
    const y = yOf(msd[i]);
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.stroke();

  // labels
  ctx.font = FONT_HUD_SMALL;
  ctx.fillStyle = hexToRgba(tokens.mint, 0.9);
  ctx.textAlign = "left";
  ctx.textBaseline = "bottom";
  ctx.fillText("⟨r²⟩ = 4Dt", gx0 + 6, gy0 + 14);
  ctx.fillStyle = tokens.textMute;
  ctx.textAlign = "right";
  ctx.textBaseline = "top";
  ctx.fillText("time →", gx1, gy1 + 6);
}
