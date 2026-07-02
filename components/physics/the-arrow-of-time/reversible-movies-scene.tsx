"use client";

import { useRef, useState } from "react";
import { useAnimationFrame } from "@/lib/animation/use-animation-frame";
import {
  SCENE_CANVAS_CLASS,
  SCENE_HEIGHT_DEFAULT,
  applyDpr,
  hexToRgba,
  useSceneSize,
  useSceneTokens,
  type SceneTokens,
} from "@/components/physics/_shared/scene-tokens";
import { createRng } from "@/lib/physics/thermodynamics/random";

/**
 * FIG.13a — Two movies, one question: which way is time running?
 *
 * Left: a handful of billiard balls colliding elastically. Reverse every
 * velocity and the movie is still perfectly lawful — elastic collisions are
 * time-symmetric, so neither direction looks wrong. Right: a wine glass falls
 * and shatters. Forward, it is ordinary; run it backward and shards leap off
 * the floor and reassemble — obviously, absurdly wrong. Same microscopic laws
 * govern both. The difference is entropy: the billiard movie barely changes Ω,
 * the shattering multiplies it astronomically.
 */

interface Ball {
  x: number;
  y: number;
  vx: number;
  vy: number;
}

const N_BALLS = 5;
const BALL_R = 0.045; // box-fraction units
const N_SHARDS = 11;

function initBalls(): Ball[] {
  const rng = createRng(0x71b0_11a5);
  const balls: Ball[] = [];
  for (let i = 0; i < N_BALLS; i++) {
    const angle = rng() * Math.PI * 2;
    const speed = 0.32;
    balls.push({
      x: 0.12 + rng() * 0.76,
      y: 0.12 + rng() * 0.76,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
    });
  }
  return balls;
}

// Fixed scattered resting positions + rotations for the glass shards.
const SHARDS = (() => {
  const rng = createRng(0x5a7e_7e12);
  return Array.from({ length: N_SHARDS }, (_, i) => ({
    restX: 0.12 + (i / (N_SHARDS - 1)) * 0.76 + (rng() - 0.5) * 0.06,
    rot: (rng() - 0.5) * 2.4,
    size: 0.03 + rng() * 0.03,
  }));
})();

export function ReversibleMoviesScene() {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const tokens = useSceneTokens();

  const [playing, setPlaying] = useState(true);
  const [reversed, setReversed] = useState(false);

  const playingRef = useRef(playing);
  playingRef.current = playing;
  const dirRef = useRef(1); // +1 forward, −1 reversed
  const ballsRef = useRef<Ball[]>(initBalls());
  const glassPhaseRef = useRef(0); // 0 → 1 loop

  function toggleReverse() {
    setReversed((r) => !r);
    dirRef.current *= -1;
    // True time reversal of the billiards: negate every velocity.
    for (const b of ballsRef.current) {
      b.vx = -b.vx;
      b.vy = -b.vy;
    }
  }

  const { width, height } = useSceneSize(containerRef, {
    ratio: 0.5,
    maxHeight: SCENE_HEIGHT_DEFAULT,
    minHeight: 260,
  });

  useAnimationFrame({
    elementRef: containerRef,
    onFrame: (_t, dt) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = applyDpr(canvas, width, height);
      if (!ctx) return;

      const step = Math.min(dt, 0.05);
      if (playingRef.current) {
        advanceBalls(ballsRef.current, step);
        // Glass phase advances signed; wrap into [0, 1).
        let p = glassPhaseRef.current + dirRef.current * step * 0.32;
        p = ((p % 1) + 1) % 1;
        glassPhaseRef.current = p;
      }

      drawScene(
        ctx,
        tokens,
        width,
        height,
        ballsRef.current,
        glassPhaseRef.current,
        dirRef.current,
      );
    },
  });

  return (
    <div ref={containerRef} className="w-full pb-4">
      <canvas
        ref={canvasRef}
        style={{ width, height, display: "block" }}
        className={SCENE_CANVAS_CLASS}
        aria-label="Left: elastic billiard collisions, plausible run either way. Right: a glass shattering, plausible only forward."
      />
      <div className="mt-3 flex items-center gap-3 font-mono text-xs">
        <button
          type="button"
          onClick={() => setPlaying((p) => !p)}
          className="rounded-sm border border-[var(--color-fg-4)] px-3 py-1 text-[var(--color-fg-3)] transition-colors hover:border-[var(--color-cyan)] hover:text-[var(--color-cyan)]"
        >
          {playing ? "❚❚ Pause" : "▶ Play"}
        </button>
        <button
          type="button"
          onClick={toggleReverse}
          className={`rounded-sm border px-3 py-1 transition-colors ${
            reversed
              ? "border-[var(--color-amber)] text-[var(--color-amber)]"
              : "border-[var(--color-fg-4)] text-[var(--color-fg-3)] hover:border-[var(--color-cyan)] hover:text-[var(--color-cyan)]"
          }`}
        >
          ⇄ {reversed ? "Running backward" : "Running forward"}
        </button>
      </div>
    </div>
  );
}

function advanceBalls(balls: Ball[], dt: number) {
  for (const b of balls) {
    b.x += b.vx * dt;
    b.y += b.vy * dt;
    if (b.x < BALL_R) { b.x = BALL_R; b.vx = Math.abs(b.vx); }
    else if (b.x > 1 - BALL_R) { b.x = 1 - BALL_R; b.vx = -Math.abs(b.vx); }
    if (b.y < BALL_R) { b.y = BALL_R; b.vy = Math.abs(b.vy); }
    else if (b.y > 1 - BALL_R) { b.y = 1 - BALL_R; b.vy = -Math.abs(b.vy); }
  }
  // Equal-mass elastic collisions (exchange velocity along the contact normal).
  for (let i = 0; i < balls.length; i++) {
    for (let j = i + 1; j < balls.length; j++) {
      const a = balls[i];
      const c = balls[j];
      const dx = c.x - a.x;
      const dy = c.y - a.y;
      const d2 = dx * dx + dy * dy;
      const min = 2 * BALL_R;
      if (d2 > 0 && d2 < min * min) {
        const d = Math.sqrt(d2);
        const nx = dx / d;
        const ny = dy / d;
        const dvx = c.vx - a.vx;
        const dvy = c.vy - a.vy;
        const rel = dvx * nx + dvy * ny;
        if (rel < 0) {
          a.vx += rel * nx;
          a.vy += rel * ny;
          c.vx -= rel * nx;
          c.vy -= rel * ny;
        }
        // Separate to remove overlap.
        const overlap = (min - d) / 2;
        a.x -= nx * overlap;
        a.y -= ny * overlap;
        c.x += nx * overlap;
        c.y += ny * overlap;
      }
    }
  }
}

function drawScene(
  ctx: CanvasRenderingContext2D,
  tokens: SceneTokens,
  W: number,
  H: number,
  balls: Ball[],
  glassPhase: number,
  dir: number,
) {
  ctx.fillStyle = tokens.bg;
  ctx.fillRect(0, 0, W, H);

  const gap = 16;
  const panelW = (W - gap) / 2;
  const panelH = H - 26;

  drawPanel(ctx, tokens, 0, 0, panelW, panelH, "BILLIARDS", () => {
    // Balls.
    const R = BALL_R * panelW;
    for (const b of balls) {
      ctx.fillStyle = tokens.cyan;
      ctx.beginPath();
      ctx.arc(b.x * panelW, b.y * panelH, R, 0, Math.PI * 2);
      ctx.fill();
    }
  });

  drawPanel(ctx, tokens, panelW + gap, 0, panelW, panelH, "WINE GLASS", () => {
    drawGlass(ctx, tokens, panelW, panelH, glassPhase);
  });

  // Verdicts.
  ctx.font = tokens.fontHud;
  ctx.textBaseline = "alphabetic";
  ctx.textAlign = "center";
  ctx.fillStyle = tokens.mint;
  ctx.fillText("✓ lawful either way", panelW / 2, H - 8);
  const glassOk = dir > 0;
  ctx.fillStyle = glassOk ? tokens.mint : tokens.red;
  ctx.fillText(
    glassOk ? "✓ a glass shatters" : "✗ shards never leap back",
    panelW + gap + panelW / 2,
    H - 8,
  );
  ctx.textAlign = "left";
}

function drawPanel(
  ctx: CanvasRenderingContext2D,
  tokens: SceneTokens,
  x: number,
  y: number,
  w: number,
  h: number,
  title: string,
  body: () => void,
) {
  ctx.save();
  ctx.strokeStyle = tokens.gridHeavy;
  ctx.lineWidth = 1;
  ctx.strokeRect(x + 0.5, y + 0.5, w, h);
  ctx.beginPath();
  ctx.rect(x, y, w, h);
  ctx.clip();
  ctx.translate(x, y);
  body();
  ctx.restore();

  ctx.fillStyle = tokens.textFaint;
  ctx.font = tokens.fontSection;
  ctx.textBaseline = "top";
  ctx.fillText(title, x + 6, y + 6);
}

function drawGlass(
  ctx: CanvasRenderingContext2D,
  tokens: SceneTokens,
  w: number,
  h: number,
  p: number,
) {
  const floorY = h * 0.86;
  const cx = w / 2;

  // Floor line.
  ctx.strokeStyle = hexToRgba(tokens.textFaint, 0.5);
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(8, floorY);
  ctx.lineTo(w - 8, floorY);
  ctx.stroke();

  const fall = Math.min(p / 0.45, 1); // 0→1 over first 45% of phase
  const shatter = Math.max(0, (p - 0.5) / 0.5); // 0→1 over last 50%

  if (shatter <= 0) {
    // Intact glass, falling from top to floor.
    const topY = h * 0.12;
    const gy = topY + (floorY - topY) * fall;
    drawIntactGlass(ctx, tokens, cx, gy, w * 0.13);
  } else {
    // Shards interpolate from the impact point to scattered rest positions.
    for (const s of SHARDS) {
      const rx = s.restX * w;
      const x = cx + (rx - cx) * shatter;
      const y = floorY - (1 - shatter) * h * 0.18 * (1 - shatter);
      const sz = s.size * w;
      ctx.save();
      ctx.translate(x, y - 4);
      ctx.rotate(s.rot * shatter);
      ctx.strokeStyle = tokens.amber;
      ctx.fillStyle = hexToRgba(tokens.amber, 0.18);
      ctx.beginPath();
      ctx.moveTo(0, -sz);
      ctx.lineTo(sz * 0.7, sz * 0.5);
      ctx.lineTo(-sz * 0.6, sz * 0.5);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.restore();
    }
  }
}

function drawIntactGlass(
  ctx: CanvasRenderingContext2D,
  tokens: SceneTokens,
  cx: number,
  cy: number,
  r: number,
) {
  ctx.strokeStyle = tokens.amber;
  ctx.fillStyle = hexToRgba(tokens.amber, 0.12);
  ctx.lineWidth = 1.5;
  // Bowl (trapezoid).
  ctx.beginPath();
  ctx.moveTo(cx - r, cy - r);
  ctx.lineTo(cx + r, cy - r);
  ctx.lineTo(cx + r * 0.35, cy + r * 0.4);
  ctx.lineTo(cx - r * 0.35, cy + r * 0.4);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  // Stem + foot.
  ctx.beginPath();
  ctx.moveTo(cx, cy + r * 0.4);
  ctx.lineTo(cx, cy + r * 1.1);
  ctx.moveTo(cx - r * 0.5, cy + r * 1.1);
  ctx.lineTo(cx + r * 0.5, cy + r * 1.1);
  ctx.stroke();
}
