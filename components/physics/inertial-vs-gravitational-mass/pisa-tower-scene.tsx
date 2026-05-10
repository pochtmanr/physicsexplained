"use client";

import { useEffect, useRef, useState } from "react";
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
 * PisaTowerScene — FIG.25a
 *
 * Galileo's 1589 thought experiment, made visible.
 */

const G = 9.81;
const TOWER_HEIGHT_M = 56;
const FALL_TIME_REF = Math.sqrt((2 * TOWER_HEIGHT_M) / G);
const ANIM_DURATION = 2400;
const ANIM_PAUSE = 800;

export function PisaTowerScene() {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const tokens = useSceneTokens();
  const { width, height } = useSceneSize(containerRef, {
    ratio: 0.58,
    maxHeight: SCENE_HEIGHT_TALL,
    minHeight: 320,
  });
  const rafRef = useRef<number>(0);
  const startRef = useRef<number>(0);
  const [eta, setEta] = useState(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = applyDpr(canvas, width, height);
    if (!ctx) return;

    startRef.current = 0;

    const animate = (t: number) => {
      if (startRef.current === 0) startRef.current = t;
      const elapsed = (t - startRef.current) % (ANIM_DURATION + ANIM_PAUSE);
      const u = Math.min(1, elapsed / ANIM_DURATION);
      draw(ctx, width, height, eta, u, tokens);
      rafRef.current = requestAnimationFrame(animate);
    };
    rafRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(rafRef.current);
  }, [eta, tokens, width, height]);

  return (
    <div ref={containerRef} className="flex w-full flex-col items-center gap-3 pb-4">
      <canvas
        ref={canvasRef}
        style={{ width, height, display: "block" }}
        className={SCENE_CANVAS_CLASS}
        aria-label="The Leaning Tower of Pisa with two balls falling. An iron ball and a wood ball dropped together. With η = 0 they land simultaneously."
      />
      <label className="flex w-full items-center gap-3 font-mono text-xs text-[var(--color-fg-2)]">
        <span className="w-32">
          η<sub>wood</sub> = {eta.toExponential(2)}
        </span>
        <input
          type="range"
          min={-0.5}
          max={0.5}
          step={0.01}
          value={eta}
          onChange={(e) => setEta(parseFloat(e.target.value))}
          className="flex-1"
          style={{ accentColor: "var(--color-amber)" }}
        />
        <span className="w-32 text-right">
          {eta === 0 ? "WEP holds" : "Aristotle's universe"}
        </span>
      </label>
    </div>
  );
}

function draw(
  ctx: CanvasRenderingContext2D,
  W: number,
  H: number,
  eta: number,
  u: number,
  tokens: SceneTokens,
) {
  ctx.fillStyle = tokens.bg;
  ctx.fillRect(0, 0, W, H);

  const groundY = H - 56;
  const towerTopY = 60;
  const towerX = W * 0.32;
  const towerW = 56;

  drawTower(ctx, towerX, towerTopY, groundY, towerW, tokens);

  // Ground
  ctx.save();
  ctx.strokeStyle = hexToRgba(tokens.textBright, 0.4);
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(40, groundY);
  ctx.lineTo(W - 40, groundY);
  ctx.stroke();
  ctx.restore();

  const towerSpanY = groundY - towerTopY - 8;
  const ironY = towerTopY + 16 + Math.min(towerSpanY, u * u * towerSpanY);
  const woodFactor = 1 + eta;
  const woodY =
    towerTopY + 16 + Math.min(towerSpanY, u * u * woodFactor * towerSpanY);

  const ballR = 12;
  const ironX = towerX + towerW / 2 + 24;
  const woodX = towerX + towerW / 2 + 56;

  drawTrail(ctx, ironX, towerTopY + 16, ironY, tokens.cyan);
  drawTrail(ctx, woodX, towerTopY + 16, woodY, tokens.amber);

  drawBall(ctx, ironX, ironY, ballR, tokens.cyan, "iron");
  drawBall(ctx, woodX, woodY, ballR, tokens.amber, "wood");

  ctx.save();
  ctx.font = "bold 14px ui-monospace, monospace";
  ctx.fillStyle = tokens.textBright;
  ctx.textAlign = "center";
  ctx.fillText(
    "Same g, same trajectory — m_g / m_i is universal",
    W / 2,
    24,
  );
  ctx.restore();

  drawHud(ctx, W, eta, ironY, woodY, towerSpanY, towerTopY, tokens);

  ctx.save();
  ctx.font = "11px ui-monospace, monospace";
  ctx.fillStyle = tokens.textDim;
  ctx.textAlign = "center";
  ctx.fillText(
    `Tower height ≈ ${TOWER_HEIGHT_M} m  ·  free-fall time ≈ ${FALL_TIME_REF.toFixed(2)} s`,
    towerX + towerW / 2,
    groundY + 22,
  );
  ctx.restore();

  ctx.save();
  ctx.font = "11px ui-monospace, monospace";
  ctx.textAlign = "center";
  ctx.fillStyle = Math.abs(eta) < 1e-9 ? tokens.mint : tokens.red;
  ctx.fillText(
    Math.abs(eta) < 1e-9
      ? "η = 0  ·  both balls land together  ·  Galileo wins"
      : eta > 0
        ? `η = ${eta.toFixed(3)}  ·  wood ball lands first  ·  Aristotle's heavy-things-fall-faster`
        : `η = ${eta.toFixed(3)}  ·  wood ball trails  ·  Aristotle inverted`,
    towerX + towerW / 2,
    groundY + 38,
  );
  ctx.restore();
}

function drawTower(
  ctx: CanvasRenderingContext2D,
  x: number,
  topY: number,
  groundY: number,
  w: number,
  tokens: SceneTokens,
) {
  const tilt = 0.06;
  const h = groundY - topY;
  ctx.save();
  ctx.translate(x + w / 2, groundY);
  ctx.rotate(-tilt);
  ctx.translate(-(x + w / 2), -groundY);

  ctx.fillStyle = hexToRgba(tokens.textBright, 0.18);
  ctx.fillRect(x, topY, w, h);
  ctx.strokeStyle = hexToRgba(tokens.textBright, 0.35);
  ctx.lineWidth = 1.5;
  ctx.strokeRect(x, topY, w, h);

  const floors = 7;
  ctx.strokeStyle = hexToRgba(tokens.textBright, 0.25);
  ctx.lineWidth = 1;
  for (let i = 1; i < floors; i++) {
    const y = topY + (h * i) / floors;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + w, y);
    ctx.stroke();
  }

  ctx.fillStyle = hexToRgba(tokens.textBright, 0.28);
  ctx.fillRect(x - 6, topY - 8, w + 12, 8);

  ctx.restore();
}

function drawBall(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  r: number,
  color: string,
  label: string,
) {
  ctx.save();
  const grad = ctx.createRadialGradient(x - r * 0.3, y - r * 0.3, r * 0.1, x, y, r);
  grad.addColorStop(0, color);
  grad.addColorStop(1, "rgba(0,0,0,0.7)");
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fillStyle = grad;
  ctx.fill();
  ctx.strokeStyle = color;
  ctx.lineWidth = 1.5;
  ctx.stroke();

  ctx.font = "11px ui-monospace, monospace";
  ctx.fillStyle = color;
  ctx.textAlign = "center";
  ctx.fillText(label, x, y + r + 14);
  ctx.restore();
}

function drawTrail(
  ctx: CanvasRenderingContext2D,
  x: number,
  yStart: number,
  yEnd: number,
  color: string,
) {
  ctx.save();
  ctx.strokeStyle = color;
  ctx.globalAlpha = 0.35;
  ctx.lineWidth = 1.5;
  ctx.setLineDash([3, 4]);
  ctx.beginPath();
  ctx.moveTo(x, yStart);
  ctx.lineTo(x, yEnd);
  ctx.stroke();
  ctx.restore();
}

function drawHud(
  ctx: CanvasRenderingContext2D,
  W: number,
  eta: number,
  ironY: number,
  woodY: number,
  span: number,
  topY: number,
  tokens: SceneTokens,
) {
  const hudX = W - 220;
  const hudY = 80;

  ctx.save();
  ctx.fillStyle = hexToRgba(tokens.textBright, 0.04);
  ctx.fillRect(hudX - 10, hudY - 18, 200, 168);
  ctx.strokeStyle = hexToRgba(tokens.textBright, 0.08);
  ctx.strokeRect(hudX - 10, hudY - 18, 200, 168);

  ctx.font = "bold 11px ui-monospace, monospace";
  ctx.fillStyle = tokens.textBright;
  ctx.textAlign = "left";
  ctx.fillText("LEDGER", hudX, hudY);

  ctx.font = "11px ui-monospace, monospace";
  ctx.fillStyle = tokens.textDim;
  ctx.fillText("a = (m_g / m_i) · g", hudX, hudY + 22);
  ctx.fillText(`g = ${G.toFixed(2)} m/s²`, hudX, hudY + 38);

  ctx.fillStyle = tokens.cyan;
  ctx.fillText("iron:  η = 0", hudX, hudY + 60);
  ctx.fillStyle = tokens.textDim;
  const ironFrac = Math.max(0, Math.min(1, (ironY - topY - 16) / span));
  ctx.fillText(`fallen: ${(ironFrac * 100).toFixed(0)}%`, hudX, hudY + 76);

  ctx.fillStyle = tokens.amber;
  ctx.fillText(`wood:  η = ${eta.toExponential(1)}`, hudX, hudY + 98);
  ctx.fillStyle = tokens.textDim;
  const woodFrac = Math.max(0, Math.min(1, (woodY - topY - 16) / span));
  ctx.fillText(`fallen: ${(woodFrac * 100).toFixed(0)}%`, hudX, hudY + 114);

  ctx.fillStyle = Math.abs(eta) < 1e-9 ? tokens.mint : tokens.red;
  ctx.fillText(
    Math.abs(eta) < 1e-9 ? "Δa / g = 0" : `Δa / g = ${eta.toExponential(1)}`,
    hudX,
    hudY + 138,
  );

  ctx.fillStyle = tokens.textFaint;
  ctx.font = "10px ui-monospace, monospace";
  ctx.fillText("nature: |η| < 1.4 × 10⁻¹⁵", hudX, hudY + 156);

  ctx.restore();
}
