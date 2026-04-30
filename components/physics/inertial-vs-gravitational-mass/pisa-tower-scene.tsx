"use client";

import { useEffect, useRef, useState } from "react";

/**
 * PisaTowerScene — FIG.25a
 *
 * Galileo's 1589 thought experiment, made visible. Two balls of different
 * material (iron, wood) dropped from the same height in a uniform g = 9.81 m/s².
 *
 * Because m_g / m_i is composition-independent, both balls satisfy
 *   a = (m_g / m_i) · g  =  g
 * exactly, regardless of their mass or material. The trajectories overlap.
 *
 * For pedagogical contrast, a slider exposes a counterfactual η = m_g/m_i − 1
 * for the wood ball: at η = 0, both balls land simultaneously; at η ≠ 0,
 * the wood ball would visibly trail or lead — the universe Aristotle imagined.
 *
 * Real physics says η < 1.4 × 10⁻¹⁵ (MICROSCOPE 2017). We expose ±0.5 here so
 * the divergence is visible at the pedagogical scale of 56 metres.
 *
 * Canvas 2D, dark bg. PascalCase export: PisaTowerScene.
 */

const WIDTH = 720;
const HEIGHT = 420;
const G = 9.81; // m/s²
const TOWER_HEIGHT_M = 56; // Galileo's tower ≈ 56 m
const FALL_TIME_REF = Math.sqrt((2 * TOWER_HEIGHT_M) / G); // ~3.38 s for η=0
const ANIM_DURATION = 2400; // ms — total animation length (one fall)
const ANIM_PAUSE = 800; // ms — pause at landing before reset

const BG = "#0A0C12";
const TOWER_COLOR = "rgba(255,255,255,0.18)";
const TOWER_EDGE = "rgba(255,255,255,0.35)";
const IRON_COLOR = "#67E8F9"; // cyan = inertial reference
const WOOD_COLOR = "#FFB36B"; // amber = the counterfactual ball
const TEXT_DIM = "rgba(255,255,255,0.65)";
const TEXT_BRIGHT = "rgba(255,255,255,0.92)";
const RED_PALE = "#FCA5A5";
const GREEN = "#86EFAC";

export function PisaTowerScene() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number>(0);
  const startRef = useRef<number>(0);
  const [eta, setEta] = useState(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dpr = window.devicePixelRatio || 1;
    canvas.width = WIDTH * dpr;
    canvas.height = HEIGHT * dpr;
    canvas.style.width = `${WIDTH}px`;
    canvas.style.height = `${HEIGHT}px`;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    startRef.current = 0;

    const animate = (t: number) => {
      if (startRef.current === 0) startRef.current = t;
      const elapsed = (t - startRef.current) % (ANIM_DURATION + ANIM_PAUSE);
      const u = Math.min(1, elapsed / ANIM_DURATION); // 0 → 1
      draw(ctx, eta, u);
      rafRef.current = requestAnimationFrame(animate);
    };
    rafRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(rafRef.current);
  }, [eta]);

  return (
    <div className="flex flex-col items-center gap-3 p-4">
      <canvas
        ref={canvasRef}
        className="rounded-md border border-white/10 bg-black/40"
        aria-label="The Leaning Tower of Pisa with two balls falling. An iron ball and a wood ball dropped together. With η = 0 they land simultaneously."
      />
      <label className="flex w-full max-w-[640px] items-center gap-3 font-mono text-xs text-white/70">
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
        />
        <span className="w-32 text-right">
          {eta === 0 ? "WEP holds" : "Aristotle's universe"}
        </span>
      </label>
    </div>
  );
}

function draw(ctx: CanvasRenderingContext2D, eta: number, u: number) {
  ctx.fillStyle = BG;
  ctx.fillRect(0, 0, WIDTH, HEIGHT);

  // Layout
  const groundY = HEIGHT - 56;
  const towerTopY = 60;
  const towerX = WIDTH * 0.32;
  const towerW = 56;

  // Tower (slightly tilted — it's the leaning tower)
  drawTower(ctx, towerX, towerTopY, groundY, towerW);

  // Ground
  ctx.save();
  ctx.strokeStyle = "rgba(255,255,255,0.4)";
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(40, groundY);
  ctx.lineTo(WIDTH - 40, groundY);
  ctx.stroke();
  ctx.restore();

  // Falling-ball positions.
  //   Iron ball: a = g exactly  → y(t) = ½ g t²
  //   Wood ball: a = (1 + η) g  → y(t) = ½ (1+η) g t²
  // Animation parameter u maps to dimensionless τ = t / FALL_TIME_REF, where
  // the iron ball reaches the ground at u = 1. The wood ball's drop is
  // multiplied by (1+η): for η > 0 it overshoots (visually clipped at the
  // ground); for η < 0 it trails. Both share the same starting point.
  const towerSpanY = groundY - towerTopY - 8;
  const ironY = towerTopY + 16 + Math.min(towerSpanY, u * u * towerSpanY);
  const woodFactor = 1 + eta;
  const woodY =
    towerTopY + 16 + Math.min(towerSpanY, u * u * woodFactor * towerSpanY);

  // Ball x positions: side-by-side, dropped from the tower's overhanging edge
  const ballR = 12;
  const ironX = towerX + towerW / 2 + 24;
  const woodX = towerX + towerW / 2 + 56;

  // Trail (dotted)
  drawTrail(ctx, ironX, towerTopY + 16, ironY, IRON_COLOR);
  drawTrail(ctx, woodX, towerTopY + 16, woodY, WOOD_COLOR);

  // Iron ball
  drawBall(ctx, ironX, ironY, ballR, IRON_COLOR, "iron");
  // Wood ball
  drawBall(ctx, woodX, woodY, ballR, WOOD_COLOR, "wood");

  // Title
  ctx.save();
  ctx.font = "bold 14px ui-monospace, monospace";
  ctx.fillStyle = TEXT_BRIGHT;
  ctx.textAlign = "center";
  ctx.fillText(
    "Same g, same trajectory — m_g / m_i is universal",
    WIDTH / 2,
    24,
  );
  ctx.restore();

  // HUD (right column)
  drawHud(ctx, eta, u, ironY, woodY, towerSpanY, towerTopY);

  // Caption beneath the tower
  ctx.save();
  ctx.font = "11px ui-monospace, monospace";
  ctx.fillStyle = TEXT_DIM;
  ctx.textAlign = "center";
  ctx.fillText(
    `Tower height ≈ ${TOWER_HEIGHT_M} m  ·  free-fall time ≈ ${FALL_TIME_REF.toFixed(2)} s`,
    towerX + towerW / 2,
    groundY + 22,
  );
  ctx.restore();

  // η = 0 verdict
  ctx.save();
  ctx.font = "11px ui-monospace, monospace";
  ctx.textAlign = "center";
  ctx.fillStyle =
    Math.abs(eta) < 1e-9 ? GREEN : eta > 0 ? RED_PALE : RED_PALE;
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
) {
  const tilt = 0.06; // rad — the famous lean
  const h = groundY - topY;
  ctx.save();
  ctx.translate(x + w / 2, groundY);
  ctx.rotate(-tilt);
  ctx.translate(-(x + w / 2), -groundY);

  // Tower body — stacked floor stripes
  ctx.fillStyle = TOWER_COLOR;
  ctx.fillRect(x, topY, w, h);
  ctx.strokeStyle = TOWER_EDGE;
  ctx.lineWidth = 1.5;
  ctx.strokeRect(x, topY, w, h);

  // Floor lines
  const floors = 7;
  ctx.strokeStyle = "rgba(255,255,255,0.25)";
  ctx.lineWidth = 1;
  for (let i = 1; i < floors; i++) {
    const y = topY + (h * i) / floors;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + w, y);
    ctx.stroke();
  }

  // Cap
  ctx.fillStyle = "rgba(255,255,255,0.28)";
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

  // Label
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
  eta: number,
  _u: number,
  ironY: number,
  woodY: number,
  span: number,
  topY: number,
) {
  const hudX = WIDTH - 220;
  const hudY = 80;

  ctx.save();
  ctx.fillStyle = "rgba(255,255,255,0.04)";
  ctx.fillRect(hudX - 10, hudY - 18, 200, 168);
  ctx.strokeStyle = "rgba(255,255,255,0.08)";
  ctx.strokeRect(hudX - 10, hudY - 18, 200, 168);

  ctx.font = "bold 11px ui-monospace, monospace";
  ctx.fillStyle = TEXT_BRIGHT;
  ctx.textAlign = "left";
  ctx.fillText("LEDGER", hudX, hudY);

  ctx.font = "11px ui-monospace, monospace";
  ctx.fillStyle = TEXT_DIM;
  ctx.fillText("a = (m_g / m_i) · g", hudX, hudY + 22);
  ctx.fillText(`g = ${G.toFixed(2)} m/s²`, hudX, hudY + 38);

  // Iron readout
  ctx.fillStyle = IRON_COLOR;
  ctx.fillText("iron:  η = 0", hudX, hudY + 60);
  ctx.fillStyle = TEXT_DIM;
  const ironFrac = Math.max(0, Math.min(1, (ironY - topY - 16) / span));
  ctx.fillText(`fallen: ${(ironFrac * 100).toFixed(0)}%`, hudX, hudY + 76);

  // Wood readout
  ctx.fillStyle = WOOD_COLOR;
  ctx.fillText(`wood:  η = ${eta.toExponential(1)}`, hudX, hudY + 98);
  ctx.fillStyle = TEXT_DIM;
  const woodFrac = Math.max(0, Math.min(1, (woodY - topY - 16) / span));
  ctx.fillText(`fallen: ${(woodFrac * 100).toFixed(0)}%`, hudX, hudY + 114);

  // Verdict
  ctx.fillStyle = Math.abs(eta) < 1e-9 ? GREEN : RED_PALE;
  ctx.fillText(
    Math.abs(eta) < 1e-9 ? "Δa / g = 0" : `Δa / g = ${eta.toExponential(1)}`,
    hudX,
    hudY + 138,
  );

  // Reference real-world bound
  ctx.fillStyle = "rgba(255,255,255,0.45)";
  ctx.font = "10px ui-monospace, monospace";
  ctx.fillText("nature: |η| < 1.4 × 10⁻¹⁵", hudX, hudY + 156);

  ctx.restore();
}
