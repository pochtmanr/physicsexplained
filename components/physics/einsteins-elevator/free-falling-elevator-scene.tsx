"use client";

import { useEffect, useMemo, useRef } from "react";
import {
  SCENE_CANVAS_CLASS,
  SCENE_HEIGHT_TALL,
  applyDpr,
  hexToRgba,
  useSceneSize,
  useSceneTokens,
  type SceneTokens,
} from "@/components/physics/_shared/scene-tokens";

/**
 * FreeFallingElevatorScene — FIG.26a
 *
 * The "happiest thought" made visible. Two side-by-side panels show the
 * SAME view from inside an elevator: free-fall on Earth vs deep space.
 */

interface Body {
  baseX: number;
  baseY: number;
  driftPhase: number;
  driftAmpX: number;
  driftAmpY: number;
  size: number;
  color: string;
  shape: "apple" | "ball" | "beaker";
  label: string;
}

export function FreeFallingElevatorScene() {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const tokens = useSceneTokens();
  const { width, height } = useSceneSize(containerRef, {
    ratio: 0.55,
    maxHeight: SCENE_HEIGHT_TALL,
    minHeight: 320,
  });
  const rafRef = useRef<number | null>(null);
  const t0Ref = useRef<number | null>(null);

  const bodies = useMemo<Body[]>(
    () => [
      {
        baseX: 0,
        baseY: -8,
        driftPhase: 0,
        driftAmpX: 7,
        driftAmpY: 4,
        size: 12,
        color: tokens.red,
        shape: "apple",
        label: "apple",
      },
      {
        baseX: -28,
        baseY: 14,
        driftPhase: 1.7,
        driftAmpX: 5,
        driftAmpY: 6,
        size: 10,
        color: tokens.cyan,
        shape: "ball",
        label: "ball",
      },
      {
        baseX: 30,
        baseY: 18,
        driftPhase: 3.1,
        driftAmpX: 4,
        driftAmpY: 5,
        size: 13,
        color: tokens.amber,
        shape: "beaker",
        label: "",
      },
    ],
    [tokens.red, tokens.cyan, tokens.amber],
  );

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = applyDpr(canvas, width, height);
    if (!ctx) return;

    const tick = (now: number) => {
      if (t0Ref.current === null) t0Ref.current = now;
      const t = (now - t0Ref.current) / 1000;
      draw(ctx, width, height, t, tokens, bodies);
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    };
  }, [tokens, width, height, bodies]);

  return (
    <div ref={containerRef} className="relative w-full pb-4">
      <canvas
        ref={canvasRef}
        style={{ width, height, display: "block" }}
        className={SCENE_CANVAS_CLASS}
        aria-label="Two side-by-side elevator cabs. Left: free-falling on Earth, with three objects floating inside. Right: stationary in deep space, with the same three objects floating. From inside the cab, the two scenes are indistinguishable."
      />
    </div>
  );
}

function draw(
  ctx: CanvasRenderingContext2D,
  W: number,
  H: number,
  t: number,
  tokens: SceneTokens,
  bodies: Body[],
) {
  ctx.fillStyle = tokens.bg;
  ctx.fillRect(0, 0, W, H);

  const midX = W / 2;
  const panelW = (W - 48) / 2;
  const panelH = H - 100;
  const panelY = 40;

  drawPanelBg(ctx, 16, panelY, panelW, panelH, tokens);
  drawEarthScene(ctx, 16, panelY, panelW, panelH, t, tokens, bodies);

  drawPanelBg(ctx, midX + 8, panelY, panelW, panelH, tokens);
  drawDeepSpaceScene(ctx, midX + 8, panelY, panelW, panelH, t, tokens, bodies);

  // Title
  ctx.save();
  ctx.font = `bold 14px ui-monospace, monospace`;
  ctx.fillStyle = tokens.textBright;
  ctx.textAlign = "center";
  ctx.fillText(
    "From inside the cab, these two scenes are indistinguishable",
    midX,
    24,
  );
  ctx.restore();

  // Bottom HUD
  const hudY = H - 50;
  ctx.save();
  ctx.fillStyle = tokens.textDim;
  ctx.font = `11px ui-monospace, monospace`;
  ctx.textAlign = "left";
  ctx.fillText("free-fall (Earth, g = 9.81 m/s²):  cab + bodies all accelerate at g  →  no contact force on floor", 24, hudY);
  ctx.fillText("deep space (g = 0):  cab + bodies inertial  →  no contact force on floor", 24, hudY + 18);
  ctx.fillStyle = tokens.amber;
  ctx.fillText("g_apparent = g_field − a_lab = 0", W - 24 - 220, hudY + 9);
  ctx.restore();
}

function drawPanelBg(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  tokens: SceneTokens,
) {
  ctx.save();
  ctx.fillStyle = hexToRgba(tokens.textBright, 0.025);
  ctx.fillRect(x, y, w, h);
  ctx.strokeStyle = tokens.panelBorder;
  ctx.lineWidth = 1;
  ctx.strokeRect(x, y, w, h);
  ctx.restore();
}

function drawEarthScene(
  ctx: CanvasRenderingContext2D,
  px: number,
  py: number,
  pw: number,
  ph: number,
  t: number,
  tokens: SceneTokens,
  bodies: Body[],
) {
  const period = 4.5;
  const tMod = t % period;
  const fallFrac = Math.min(tMod / (period * 0.85), 1);
  const labCabTop = py + 16 + fallFrac * (ph * 0.45);

  const groundY = py + ph - 20;
  ctx.save();
  ctx.strokeStyle = hexToRgba(tokens.textBright, 0.18);
  ctx.lineWidth = 1;
  ctx.setLineDash([3, 4]);
  ctx.beginPath();
  ctx.moveTo(px + 8, groundY);
  ctx.lineTo(px + pw - 8, groundY);
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.restore();

  ctx.save();
  ctx.fillStyle = tokens.textDim;
  ctx.font = `10px ui-monospace, monospace`;
  ctx.textAlign = "right";
  ctx.fillText("Earth surface", px + pw - 12, groundY - 4);
  ctx.textAlign = "left";
  ctx.fillText("g ↓", px + 14, py + 26);
  ctx.restore();

  drawGravityArrow(ctx, px + 22, py + 38, py + 90, hexToRgba(tokens.amber, 0.7));

  const cabW = pw * 0.6;
  const cabH = ph * 0.42;
  const cabX = px + (pw - cabW) / 2;
  drawCab(ctx, cabX, labCabTop, cabW, cabH, tokens);

  drawFloatingBodies(ctx, cabX + cabW / 2, labCabTop + cabH / 2, t, tokens, bodies);

  ctx.save();
  ctx.fillStyle = tokens.textBright;
  ctx.font = `bold 12px ui-monospace, monospace`;
  ctx.textAlign = "center";
  ctx.fillText("free-falling elevator (Earth)", px + pw / 2, py + ph - 4);
  ctx.restore();
}

function drawDeepSpaceScene(
  ctx: CanvasRenderingContext2D,
  px: number,
  py: number,
  pw: number,
  ph: number,
  t: number,
  tokens: SceneTokens,
  bodies: Body[],
) {
  drawStars(ctx, px, py, pw, ph, tokens);

  const cabW = pw * 0.6;
  const cabH = ph * 0.42;
  const cabX = px + (pw - cabW) / 2;
  const cabY = py + (ph - cabH) / 2 - 14;
  drawCab(ctx, cabX, cabY, cabW, cabH, tokens);

  drawFloatingBodies(ctx, cabX + cabW / 2, cabY + cabH / 2, t, tokens, bodies);

  ctx.save();
  ctx.fillStyle = tokens.textDim;
  ctx.font = `10px ui-monospace, monospace`;
  ctx.textAlign = "left";
  ctx.fillText("no field — g = 0", px + 14, py + 26);
  ctx.restore();

  ctx.save();
  ctx.fillStyle = tokens.textBright;
  ctx.font = `bold 12px ui-monospace, monospace`;
  ctx.textAlign = "center";
  ctx.fillText("stationary elevator (deep space)", px + pw / 2, py + ph - 4);
  ctx.restore();
}

function drawCab(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  tokens: SceneTokens,
) {
  ctx.save();
  const g = ctx.createLinearGradient(x, y, x, y + h);
  g.addColorStop(0, hexToRgba(tokens.textBright, 0.04));
  g.addColorStop(1, hexToRgba(tokens.textBright, 0.07));
  ctx.fillStyle = g;
  ctx.fillRect(x, y, w, h);

  ctx.strokeStyle = hexToRgba(tokens.textBright, 0.35);
  ctx.lineWidth = 1.5;
  ctx.strokeRect(x, y, w, h);

  ctx.fillStyle = hexToRgba(tokens.textBright, 0.06);
  ctx.fillRect(x, y, w, 4);
  ctx.fillRect(x, y + h - 4, w, 4);
  ctx.restore();
}

function drawFloatingBodies(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  t: number,
  tokens: SceneTokens,
  bodies: Body[],
) {
  for (const b of bodies) {
    const dx = Math.cos(t * 0.6 + b.driftPhase) * b.driftAmpX;
    const dy = Math.sin(t * 0.5 + b.driftPhase * 1.3) * b.driftAmpY;
    const x = cx + b.baseX + dx;
    const y = cy + b.baseY + dy;

    if (b.shape === "apple") drawApple(ctx, x, y, b.size, b.color);
    else if (b.shape === "ball") drawBall(ctx, x, y, b.size, b.color, tokens);
    else drawBeaker(ctx, x, y, b.size, b.color, tokens);
  }
}

function drawApple(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  r: number,
  color: string,
) {
  ctx.save();
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = "rgba(0,0,0,0.4)";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(x + r * 0.1, y - r * 0.9);
  ctx.lineTo(x + r * 0.4, y - r * 1.4);
  ctx.stroke();
  ctx.restore();
}

function drawBall(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  r: number,
  color: string,
  tokens: SceneTokens,
) {
  ctx.save();
  const grad = ctx.createRadialGradient(x - r * 0.3, y - r * 0.3, 0, x, y, r);
  grad.addColorStop(0, hexToRgba(tokens.textBright, 0.5));
  grad.addColorStop(1, color);
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawBeaker(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  r: number,
  color: string,
  tokens: SceneTokens,
) {
  ctx.save();
  const w = r * 1.3;
  const h = r * 1.6;
  ctx.strokeStyle = hexToRgba(tokens.textBright, 0.6);
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.moveTo(x - w / 2, y - h / 2);
  ctx.lineTo(x - w / 2, y + h / 2);
  ctx.lineTo(x + w / 2, y + h / 2);
  ctx.lineTo(x + w / 2, y - h / 2);
  ctx.stroke();
  ctx.fillStyle = color;
  ctx.globalAlpha = 0.6;
  ctx.beginPath();
  ctx.arc(x, y, r * 0.55, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawGravityArrow(
  ctx: CanvasRenderingContext2D,
  x: number,
  y0: number,
  y1: number,
  color: string,
) {
  ctx.save();
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(x, y0);
  ctx.lineTo(x, y1);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(x, y1);
  ctx.lineTo(x - 4, y1 - 7);
  ctx.lineTo(x + 4, y1 - 7);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

function drawStars(
  ctx: CanvasRenderingContext2D,
  px: number,
  py: number,
  pw: number,
  ph: number,
  tokens: SceneTokens,
) {
  const stars: Array<[number, number, number]> = [
    [0.12, 0.18, 1.1],
    [0.34, 0.07, 0.7],
    [0.55, 0.22, 1.3],
    [0.74, 0.13, 0.9],
    [0.88, 0.30, 1.0],
    [0.10, 0.42, 0.8],
    [0.28, 0.55, 1.0],
    [0.46, 0.70, 0.6],
    [0.66, 0.62, 1.2],
    [0.83, 0.78, 0.8],
    [0.18, 0.88, 0.9],
    [0.40, 0.92, 1.1],
    [0.60, 0.92, 0.7],
    [0.92, 0.92, 1.0],
  ];
  ctx.save();
  for (const [u, v, r] of stars) {
    ctx.fillStyle = hexToRgba(tokens.textBright, 0.45);
    ctx.beginPath();
    ctx.arc(px + u * pw, py + v * ph, r, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}
