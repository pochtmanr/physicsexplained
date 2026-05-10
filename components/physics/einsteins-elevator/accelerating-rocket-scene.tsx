"use client";

import { useEffect, useRef } from "react";
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
 * AcceleratingRocketScene — FIG.26b
 *
 * The reverse equivalence. A rocket accelerating at g in deep space
 * (no gravitational field) is locally indistinguishable from a stationary
 * lab on Earth's surface.
 */

export function AcceleratingRocketScene() {
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

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = applyDpr(canvas, width, height);
    if (!ctx) return;

    const tick = (now: number) => {
      if (t0Ref.current === null) t0Ref.current = now;
      const t = (now - t0Ref.current) / 1000;
      draw(ctx, width, height, t, tokens);
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    };
  }, [tokens, width, height]);

  return (
    <div ref={containerRef} className="relative w-full pb-4">
      <canvas
        ref={canvasRef}
        style={{ width, height, display: "block" }}
        className={SCENE_CANVAS_CLASS}
        aria-label="Two side-by-side scenes. Left: a rocket in deep space accelerating upward at g, with three objects pressed to the cabin floor by the apparent gravity of acceleration. Right: a stationary lab on Earth's surface with the same three objects on the floor under real gravity. From inside, the two are indistinguishable."
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
) {
  ctx.fillStyle = tokens.bg;
  ctx.fillRect(0, 0, W, H);

  const midX = W / 2;
  const panelW = (W - 48) / 2;
  const panelH = H - 100;
  const panelY = 40;

  drawPanelBg(ctx, 16, panelY, panelW, panelH, tokens);
  drawRocketScene(ctx, 16, panelY, panelW, panelH, t, tokens);

  drawPanelBg(ctx, midX + 8, panelY, panelW, panelH, tokens);
  drawEarthLabScene(ctx, midX + 8, panelY, panelW, panelH, tokens);

  // Title
  ctx.save();
  ctx.font = `bold 14px ui-monospace, monospace`;
  ctx.fillStyle = tokens.textBright;
  ctx.textAlign = "center";
  ctx.fillText("Accelerating at g ≡ stationary in a g field — locally", midX, 24);
  ctx.restore();

  // Bottom HUD
  const hudY = H - 50;
  ctx.save();
  ctx.fillStyle = tokens.textDim;
  ctx.font = `11px ui-monospace, monospace`;
  ctx.textAlign = "left";
  ctx.fillText("rocket (deep space, a = g):  floor pushes bodies upward at g  →  apparent weight mg", 24, hudY);
  ctx.fillText("Earth lab (stationary, g = g):  floor pushes bodies upward at g  →  weight mg", 24, hudY + 18);
  ctx.fillStyle = tokens.amber;
  ctx.textAlign = "right";
  ctx.fillText("g_apparent = g (both)", W - 24, hudY + 9);
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

function drawRocketScene(
  ctx: CanvasRenderingContext2D,
  px: number,
  py: number,
  pw: number,
  ph: number,
  t: number,
  tokens: SceneTokens,
) {
  // Stars
  drawStars(ctx, px, py, pw, ph, tokens);

  const cx = px + pw / 2;
  const rocketTop = py + 36;
  const rocketBottom = py + ph - 70;
  const rocketH = rocketBottom - rocketTop;
  const rocketW = Math.min(pw * 0.32, 96);

  // Rocket body — neutral hull tones, kept as-is (physical materials, not chrome).
  ctx.save();
  ctx.fillStyle = "rgba(220, 230, 245, 0.85)";
  ctx.beginPath();
  ctx.moveTo(cx, rocketTop);
  ctx.lineTo(cx + rocketW / 2, rocketTop + rocketH * 0.18);
  ctx.lineTo(cx - rocketW / 2, rocketTop + rocketH * 0.18);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = "rgba(200, 215, 235, 0.7)";
  ctx.fillRect(
    cx - rocketW / 2,
    rocketTop + rocketH * 0.18,
    rocketW,
    rocketH * 0.72,
  );

  // Cabin window (the bordered region we will fill with bodies)
  const cabW = rocketW * 0.7;
  const cabH = rocketH * 0.42;
  const cabX = cx - cabW / 2;
  const cabY = rocketTop + rocketH * 0.28;
  ctx.fillStyle = hexToRgba(tokens.bg, 0.85);
  ctx.fillRect(cabX, cabY, cabW, cabH);
  ctx.strokeStyle = hexToRgba(tokens.textBright, 0.35);
  ctx.lineWidth = 1;
  ctx.strokeRect(cabX, cabY, cabW, cabH);

  // Fins
  ctx.fillStyle = "rgba(180, 200, 220, 0.85)";
  ctx.beginPath();
  ctx.moveTo(cx - rocketW / 2, rocketTop + rocketH * 0.78);
  ctx.lineTo(cx - rocketW / 2 - 12, rocketTop + rocketH * 0.92);
  ctx.lineTo(cx - rocketW / 2, rocketTop + rocketH * 0.92);
  ctx.closePath();
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(cx + rocketW / 2, rocketTop + rocketH * 0.78);
  ctx.lineTo(cx + rocketW / 2 + 12, rocketTop + rocketH * 0.92);
  ctx.lineTo(cx + rocketW / 2, rocketTop + rocketH * 0.92);
  ctx.closePath();
  ctx.fill();
  ctx.restore();

  // Exhaust plume — animated flicker (real flame colors)
  const flameH = 60 + 8 * Math.sin(t * 24);
  const flameTop = rocketTop + rocketH * 0.92;
  ctx.save();
  const grad = ctx.createLinearGradient(cx, flameTop, cx, flameTop + flameH);
  grad.addColorStop(0, "rgba(255, 240, 100, 0.95)");
  grad.addColorStop(0.5, "rgba(255, 140, 60, 0.65)");
  grad.addColorStop(1, "rgba(255, 60, 30, 0.0)");
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.moveTo(cx - rocketW * 0.32, flameTop);
  ctx.quadraticCurveTo(cx, flameTop + flameH * 1.2, cx + rocketW * 0.32, flameTop);
  ctx.closePath();
  ctx.fill();
  ctx.restore();

  // Acceleration arrow on the side: "a = g" pointing UP
  ctx.save();
  ctx.strokeStyle = tokens.amber;
  ctx.fillStyle = tokens.amber;
  ctx.lineWidth = 1.8;
  const ax = px + pw - 38;
  const ay0 = py + ph * 0.65;
  const ay1 = py + ph * 0.30;
  ctx.beginPath();
  ctx.moveTo(ax, ay0);
  ctx.lineTo(ax, ay1);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(ax, ay1);
  ctx.lineTo(ax - 5, ay1 + 8);
  ctx.lineTo(ax + 5, ay1 + 8);
  ctx.closePath();
  ctx.fill();
  ctx.font = `11px ui-monospace, monospace`;
  ctx.textAlign = "center";
  ctx.fillText("a = g", ax, ay0 + 18);
  ctx.restore();

  // Bodies on the cabin floor (bottom of the window)
  drawSeatedBodies(ctx, cabX + cabW / 2, cabY + cabH, tokens);

  // Weight arrows on the bodies (apparent g pulls them down)
  drawApparentGravityArrows(ctx, cabX + cabW / 2, cabY + cabH, tokens);

  // Caption
  ctx.save();
  ctx.fillStyle = tokens.textBright;
  ctx.font = `bold 12px ui-monospace, monospace`;
  ctx.textAlign = "center";
  ctx.fillText("rocket accelerating at g (deep space)", px + pw / 2, py + ph - 4);
  ctx.restore();
}

function drawEarthLabScene(
  ctx: CanvasRenderingContext2D,
  px: number,
  py: number,
  pw: number,
  ph: number,
  tokens: SceneTokens,
) {
  // Sky/ground gradient — real environmental colors, not chrome
  ctx.save();
  const g = ctx.createLinearGradient(px, py, px, py + ph);
  g.addColorStop(0, "rgba(40, 60, 90, 0.25)");
  g.addColorStop(0.65, "rgba(30, 45, 65, 0.18)");
  g.addColorStop(1, "rgba(60, 50, 40, 0.25)");
  ctx.fillStyle = g;
  ctx.fillRect(px, py, pw, ph);
  ctx.restore();

  // Ground
  const groundY = py + ph - 50;
  ctx.save();
  ctx.fillStyle = "rgba(120, 90, 60, 0.35)";
  ctx.fillRect(px, groundY, pw, ph - (groundY - py));
  ctx.strokeStyle = hexToRgba(tokens.textBright, 0.15);
  ctx.lineWidth = 1;
  for (let i = 0; i < 14; i++) {
    const x0 = px + (i / 14) * pw;
    ctx.beginPath();
    ctx.moveTo(x0, groundY);
    ctx.lineTo(x0 + 8, groundY + 14);
    ctx.stroke();
  }
  ctx.restore();

  // Lab box
  const labW = pw * 0.6;
  const labH = ph * 0.45;
  const labX = px + (pw - labW) / 2;
  const labY = groundY - labH;
  ctx.save();
  ctx.fillStyle = hexToRgba(tokens.bg, 0.85);
  ctx.fillRect(labX, labY, labW, labH);
  ctx.strokeStyle = hexToRgba(tokens.textBright, 0.35);
  ctx.lineWidth = 1;
  ctx.strokeRect(labX, labY, labW, labH);
  ctx.restore();

  // Bodies on lab floor
  drawSeatedBodies(ctx, labX + labW / 2, labY + labH, tokens);
  drawApparentGravityArrows(ctx, labX + labW / 2, labY + labH, tokens);

  // Earth-gravity arrow (down) on the side
  ctx.save();
  ctx.strokeStyle = hexToRgba(tokens.amber, 0.7);
  ctx.fillStyle = hexToRgba(tokens.amber, 0.7);
  ctx.lineWidth = 1.8;
  const ax = px + 28;
  const ay0 = py + ph * 0.30;
  const ay1 = py + ph * 0.65;
  ctx.beginPath();
  ctx.moveTo(ax, ay0);
  ctx.lineTo(ax, ay1);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(ax, ay1);
  ctx.lineTo(ax - 5, ay1 - 8);
  ctx.lineTo(ax + 5, ay1 - 8);
  ctx.closePath();
  ctx.fill();
  ctx.font = `11px ui-monospace, monospace`;
  ctx.textAlign = "center";
  ctx.fillText("g ↓", ax, ay0 - 4);
  ctx.restore();

  // Caption
  ctx.save();
  ctx.fillStyle = tokens.textBright;
  ctx.font = `bold 12px ui-monospace, monospace`;
  ctx.textAlign = "center";
  ctx.fillText("stationary lab (Earth surface)", px + pw / 2, py + ph - 4);
  ctx.restore();

  // Earth surface label
  ctx.save();
  ctx.fillStyle = tokens.textDim;
  ctx.font = `10px ui-monospace, monospace`;
  ctx.textAlign = "right";
  ctx.fillText("Earth surface", px + pw - 12, groundY - 4);
  ctx.restore();
}

function drawSeatedBodies(
  ctx: CanvasRenderingContext2D,
  cx: number,
  floorY: number,
  tokens: SceneTokens,
) {
  // Three bodies sitting on the floor (centred)
  const bodies = [
    { dx: -28, r: 10, color: tokens.red, shape: "apple" as const },
    { dx: 0, r: 13, color: tokens.amber, shape: "beaker" as const },
    { dx: 28, r: 11, color: tokens.cyan, shape: "ball" as const },
  ];
  for (const b of bodies) {
    const cy = floorY - b.r - 1;
    if (b.shape === "apple") {
      ctx.fillStyle = b.color;
      ctx.beginPath();
      ctx.arc(cx + b.dx, cy, b.r, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = "rgba(0,0,0,0.4)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(cx + b.dx + b.r * 0.1, cy - b.r * 0.9);
      ctx.lineTo(cx + b.dx + b.r * 0.4, cy - b.r * 1.4);
      ctx.stroke();
    } else if (b.shape === "ball") {
      const grad = ctx.createRadialGradient(
        cx + b.dx - b.r * 0.3,
        cy - b.r * 0.3,
        0,
        cx + b.dx,
        cy,
        b.r,
      );
      grad.addColorStop(0, hexToRgba(tokens.textBright, 0.5));
      grad.addColorStop(1, b.color);
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(cx + b.dx, cy, b.r, 0, Math.PI * 2);
      ctx.fill();
    } else {
      // beaker — rectangle resting on floor
      const w = b.r * 1.3;
      const h = b.r * 1.6;
      const bx = cx + b.dx - w / 2;
      const by = floorY - h - 1;
      ctx.strokeStyle = hexToRgba(tokens.textBright, 0.6);
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(bx, by);
      ctx.lineTo(bx, by + h);
      ctx.lineTo(bx + w, by + h);
      ctx.lineTo(bx + w, by);
      ctx.stroke();
      // liquid pooled at bottom (gravity present)
      ctx.fillStyle = b.color;
      ctx.globalAlpha = 0.6;
      ctx.fillRect(bx + 1, by + h * 0.45, w - 2, h * 0.5);
      ctx.globalAlpha = 1;
    }
  }
}

function drawApparentGravityArrows(
  ctx: CanvasRenderingContext2D,
  cx: number,
  floorY: number,
  tokens: SceneTokens,
) {
  ctx.save();
  ctx.strokeStyle = tokens.orange;
  ctx.fillStyle = tokens.orange;
  ctx.lineWidth = 1.2;
  for (const dx of [-28, 0, 28]) {
    const x0 = cx + dx;
    const y0 = floorY - 32;
    const y1 = floorY - 20;
    ctx.beginPath();
    ctx.moveTo(x0, y0);
    ctx.lineTo(x0, y1);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x0, y1);
    ctx.lineTo(x0 - 3, y1 - 5);
    ctx.lineTo(x0 + 3, y1 - 5);
    ctx.closePath();
    ctx.fill();
  }
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
    [0.08, 0.12, 1.0],
    [0.22, 0.05, 0.8],
    [0.40, 0.18, 1.2],
    [0.58, 0.10, 0.9],
    [0.78, 0.20, 1.0],
    [0.92, 0.08, 0.7],
    [0.05, 0.40, 1.1],
    [0.30, 0.50, 0.7],
    [0.85, 0.45, 1.0],
    [0.15, 0.70, 0.9],
    [0.92, 0.72, 1.1],
    [0.50, 0.85, 0.8],
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
