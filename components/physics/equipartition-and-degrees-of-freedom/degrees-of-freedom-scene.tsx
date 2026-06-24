"use client";

import { useEffect, useRef, useState } from "react";
import {
  FONT_HUD,
  FONT_HUD_SMALL,
  SCENE_CANVAS_CLASS,
  SCENE_HEIGHT_DEFAULT,
  applyDpr,
  drawArrow,
  drawSectionTitle,
  useSceneSize,
  useSceneTick,
  useSceneTokens,
  type SceneTokens,
} from "@/components/physics/_shared/scene-tokens";
import { DOF_CASES, cvMolar } from "@/lib/physics/thermodynamics/equipartition";

/**
 * FIG.17a — degrees of freedom, animated. Each molecule carries ½kT per
 * quadratic degree of freedom. A helium atom has only the three translational
 * directions; a nitrogen dumbbell adds two rotations (and, once hot, a
 * vibration); a crystal atom sits in a cage of springs with six. Toggle the
 * cases and watch which motions are alive — the heat-capacity readout is just
 * (f/2)R, the count of those motions made thermodynamic.
 */

export function DegreesOfFreedomScene() {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const tokens = useSceneTokens();
  const [caseIdx, setCaseIdx] = useState(1);
  const tickRef = useSceneTick(true);
  const idxRef = useRef(1);
  idxRef.current = caseIdx;

  const { width, height } = useSceneSize(containerRef, {
    ratio: 0.5,
    maxHeight: SCENE_HEIGHT_DEFAULT,
    minHeight: 260,
  });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = applyDpr(canvas, width, height);
    if (!ctx) return;
    let raf = 0;
    const loop = () => {
      const t = tickRef.current / 1000;
      draw(ctx, tokens, idxRef.current, t, width, height);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [tokens, tickRef, width, height]);

  const c = DOF_CASES[caseIdx];

  return (
    <div ref={containerRef} className="relative w-full pb-4">
      <canvas
        ref={canvasRef}
        style={{ width, height, display: "block" }}
        className={SCENE_CANVAS_CLASS}
        aria-label="An animated molecule whose live motions illustrate its degrees of freedom: a single atom translating, a diatomic dumbbell translating and rotating and optionally vibrating, or a crystal atom vibrating on springs. A readout gives the molar heat capacity as f over two times R."
      />
      <div className="mt-3 font-mono text-xs text-[var(--color-fg-2)]">
        {c.name} · f = {c.f} ({c.note}) · C_v = (f/2)R ={" "}
        {cvMolar(c.f).toFixed(1)} J/(mol·K)
      </div>
      <div className="mt-2 flex flex-wrap gap-2 font-mono text-xs">
        {DOF_CASES.map((d, i) => {
          const active = i === caseIdx;
          return (
            <button
              key={d.name}
              type="button"
              onClick={() => setCaseIdx(i)}
              className="cursor-pointer rounded-sm border px-2 py-0.5"
              style={{
                borderColor: active ? "var(--color-cyan)" : "var(--color-fg-4)",
                color: active ? "var(--color-cyan)" : "var(--color-fg-3)",
              }}
            >
              {d.name}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function draw(
  ctx: CanvasRenderingContext2D,
  tokens: SceneTokens,
  caseIdx: number,
  t: number,
  W: number,
  H: number,
) {
  ctx.fillStyle = tokens.bg;
  ctx.fillRect(0, 0, W, H);
  drawSectionTitle(ctx, 16, 8, "DEGREES OF FREEDOM", tokens.textMute);

  const cx = W / 2;
  const cy = H / 2 + 6;

  // slow translational drift common to the gas cases
  const drift = caseIdx <= 2;
  const dx = drift ? Math.sin(t * 0.8) * Math.min(80, W * 0.12) : 0;
  const dy = drift ? Math.cos(t * 0.6) * Math.min(40, H * 0.12) : 0;
  const ox = cx + dx;
  const oy = cy + dy;

  if (caseIdx === 0) drawHelium(ctx, tokens, ox, oy, t);
  else if (caseIdx === 1) drawDiatomic(ctx, tokens, ox, oy, t, false);
  else if (caseIdx === 2) drawDiatomic(ctx, tokens, ox, oy, t, true);
  else drawCrystal(ctx, tokens, cx, cy, t);

  // legend of which motions are active
  const motions =
    caseIdx === 0
      ? ["translation ×3"]
      : caseIdx === 1
        ? ["translation ×3", "rotation ×2"]
        : caseIdx === 2
          ? ["translation ×3", "rotation ×2", "vibration ×2"]
          : ["vibration ×6 (3 KE + 3 PE)"];
  ctx.font = FONT_HUD_SMALL;
  ctx.textAlign = "left";
  ctx.textBaseline = "top";
  motions.forEach((m, i) => {
    ctx.fillStyle = i === 0 ? tokens.cyan : i === 1 ? tokens.amber : tokens.magenta;
    ctx.fillText(`● ${m}`, 16, H - 18 - (motions.length - 1 - i) * 14);
  });
}

function atom(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  r: number,
  color: string,
) {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fill();
}

function drawHelium(
  ctx: CanvasRenderingContext2D,
  tokens: SceneTokens,
  x: number,
  y: number,
  t: number,
) {
  atom(ctx, x, y, 16, tokens.cyan);
  // three translational arrows
  const L = 30;
  drawArrow(ctx, x, y, x + L, y, tokens.cyan, 2, 7);
  drawArrow(ctx, x, y, x, y - L, tokens.cyan, 2, 7);
  drawArrow(ctx, x, y, x - L * 0.7, y + L * 0.7, tokens.cyan, 2, 7);
}

function drawDiatomic(
  ctx: CanvasRenderingContext2D,
  tokens: SceneTokens,
  x: number,
  y: number,
  t: number,
  hot: boolean,
) {
  const spin = t * 1.6;
  // vibrating bond length when hot
  const base = 26;
  const len = hot ? base + Math.sin(t * 9) * 7 : base;
  const ax = Math.cos(spin) * len;
  const ay = Math.sin(spin) * len;

  // bond
  ctx.strokeStyle = tokens.textMute;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(x - ax, y - ay);
  ctx.lineTo(x + ax, y + ay);
  ctx.stroke();

  atom(ctx, x - ax, y - ay, 13, tokens.cyan);
  atom(ctx, x + ax, y + ay, 13, tokens.cyan);

  // rotation arc indicator
  ctx.strokeStyle = tokens.amber;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(x, y, len + 14, spin, spin + Math.PI * 0.6);
  ctx.stroke();

  // translational arrows from the centre
  drawArrow(ctx, x, y, x + 30, y, tokens.cyan, 1.5, 6);
  drawArrow(ctx, x, y, x, y - 30, tokens.cyan, 1.5, 6);

  if (hot) {
    // vibration markers along the bond axis
    const ux = Math.cos(spin);
    const uy = Math.sin(spin);
    drawArrow(ctx, x + ax, y + ay, x + ax + ux * 12, y + ay + uy * 12, tokens.magenta, 1.5, 6);
    drawArrow(ctx, x - ax, y - ay, x - ax - ux * 12, y - ay - uy * 12, tokens.magenta, 1.5, 6);
  }
}

function drawCrystal(
  ctx: CanvasRenderingContext2D,
  tokens: SceneTokens,
  cx: number,
  cy: number,
  t: number,
) {
  const jx = Math.sin(t * 7) * 8;
  const jy = Math.cos(t * 8.3) * 8;
  const x = cx + jx;
  const y = cy + jy;
  const cell = 56;
  // four neighbours / spring anchors
  const anchors = [
    [cx - cell, cy - cell],
    [cx + cell, cy - cell],
    [cx - cell, cy + cell],
    [cx + cell, cy + cell],
  ];
  ctx.strokeStyle = tokens.amber;
  ctx.lineWidth = 1.5;
  for (const [ax, ay] of anchors) {
    drawSpring(ctx, ax, ay, x, y, tokens.amber);
    atom(ctx, ax, ay, 7, tokens.textMute);
  }
  atom(ctx, x, y, 15, tokens.cyan);
  // vibration arrows
  drawArrow(ctx, x, y, x + 26, y, tokens.magenta, 1.5, 6);
  drawArrow(ctx, x, y, x, y - 26, tokens.magenta, 1.5, 6);
}

function drawSpring(
  ctx: CanvasRenderingContext2D,
  x0: number,
  y0: number,
  x1: number,
  y1: number,
  color: string,
) {
  const coils = 6;
  const dx = x1 - x0;
  const dy = y1 - y0;
  const len = Math.hypot(dx, dy);
  const ux = dx / len;
  const uy = dy / len;
  const px = -uy;
  const py = ux;
  ctx.strokeStyle = color;
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.moveTo(x0, y0);
  for (let i = 1; i < coils; i++) {
    const f = i / coils;
    const amp = i % 2 === 0 ? 5 : -5;
    ctx.lineTo(x0 + ux * len * f + px * amp, y0 + uy * len * f + py * amp);
  }
  ctx.lineTo(x1, y1);
  ctx.stroke();
}
