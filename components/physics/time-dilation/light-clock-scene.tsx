"use client";

import { useRef, useState } from "react";
import { useAnimationFrame } from "@/lib/animation/use-animation-frame";
import {
  SCENE_CANVAS_CLASS,
  applyDpr,
  hexToRgba,
  useSceneSize,
  useSceneTokens,
  type SceneTokens,
} from "@/components/physics/_shared/scene-tokens";
import { gamma } from "@/lib/physics/relativity/types";

/**
 * §02.1 LIGHT CLOCK — the cleanest derivation of time dilation.
 *
 * Two parallel mirrors separated by height h. A photon bounces between them.
 * In the clock's rest frame the path length is 2h, the period is T0 = 2h/c.
 *
 * Boost the clock by βc. The mirrors translate horizontally while the photon
 * traverses, so the photon traces a zig-zag whose round-trip path length is
 *   2·√(h² + (β·c·T/2)²)
 * Postulate (2) — the photon travels at exactly c — forces
 *   T = 2·√(h² + (β·c·T/2)²) / c   →   T = T0/√(1 − β²) = γ T0.
 *
 * The scene shows the rest-frame clock (cyan, vertical bounces) and a moving
 * copy (magenta, zig-zag bounces). The cyan clock ticks faster; the HUD
 * shows the proper period and the dilated period side by side.
 *
 * Renamed from `LightClockScene` to `TimeDilationLightClockScene` to avoid
 * collision with §01.4 einsteins-two-postulates' preview light-clock.
 */

const RATIO = 0.6;
const MAX_HEIGHT = 460;
const MARGIN = 28;

export function TimeDilationLightClockScene() {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const tokens = useSceneTokens();
  const { width: sizeWidth, height: sizeHeight } = useSceneSize(containerRef, {
    ratio: RATIO,
    maxHeight: MAX_HEIGHT,
  });
  const [beta, setBeta] = useState(0.7);

  useAnimationFrame({
    elementRef: containerRef,
    onFrame: (t) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const width = sizeWidth;
      const height = sizeHeight;
      const ctx = applyDpr(canvas, width, height);
      if (!ctx) return;
      ctx.clearRect(0, 0, width, height);
      ctx.fillStyle = tokens.bg;
      ctx.fillRect(0, 0, width, height);

      const g = gamma(beta);
      // Use unitless time. Proper period T0 = 1 (one tick = full round trip).
      // Lab period T = γ. Animate at a comfortable pace: 1 proper tick / 1.4 s.
      const PROPER_PERIOD_SEC = 1.4;
      const tProperPhase = (t / PROPER_PERIOD_SEC) % 1; // 0..1
      const tLabPhase = (t / (PROPER_PERIOD_SEC * g)) % 1; // 0..1

      // Two clock columns side-by-side.
      const colW = (width - MARGIN * 3) / 2;
      const colH = height - MARGIN * 2;
      const mirrorH = colH * 0.65;

      // ─── Clock A: rest frame (cyan, vertical) ───────────────────────────
      drawRestClock(ctx, tokens, MARGIN, MARGIN, colW, colH, mirrorH, tProperPhase);
      drawColumnLabels(
        ctx,
        tokens,
        MARGIN + colW / 2,
        MARGIN + colH + 16,
        "REST FRAME",
        "T₀ = 1",
        tokens.cyan,
      );

      // ─── Clock B: lab frame (magenta, zig-zag) ──────────────────────────
      const xB = MARGIN * 2 + colW;
      drawMovingClock(
        ctx,
        tokens,
        xB,
        MARGIN,
        colW,
        colH,
        mirrorH,
        tLabPhase,
        beta,
      );
      drawColumnLabels(
        ctx,
        tokens,
        xB + colW / 2,
        MARGIN + colH + 16,
        "LAB FRAME",
        `T = γT₀ = ${g.toFixed(3)}`,
        tokens.magenta,
      );

      // ─── HUD ─────────────────────────────────────────────────────────────
      ctx.font = "12px ui-monospace, monospace";
      ctx.fillStyle = tokens.textDim;
      ctx.textAlign = "left";
      ctx.fillText(`β = ${beta.toFixed(3)}`, 12, 18);
      ctx.fillText(`γ = ${g.toFixed(3)}`, 12, 36);
      ctx.fillText(`T/T₀ = ${g.toFixed(3)}`, 12, 54);
    },
  });

  return (
    <div ref={containerRef} className="flex flex-col gap-3">
      <canvas
        ref={canvasRef}
        className={SCENE_CANVAS_CLASS}
        style={{ width: sizeWidth, height: sizeHeight, display: "block" }}
      />
      <label className="flex items-center gap-3 font-mono text-xs text-[var(--color-fg-2)]">
        <span className="w-12">β = {beta.toFixed(2)}</span>
        <input
          type="range"
          min={0}
          max={0.98}
          step={0.01}
          value={beta}
          onChange={(e) => setBeta(parseFloat(e.target.value))}
          className="flex-1"
          style={{ accentColor: "var(--color-cyan)" }}
        />
        <span className="w-20">γ = {gamma(beta).toFixed(2)}</span>
      </label>
    </div>
  );
}

// ────────────────────────────────────────────────────────────────────────────

function drawRestClock(
  ctx: CanvasRenderingContext2D,
  tokens: SceneTokens,
  x: number,
  y: number,
  w: number,
  h: number,
  mirrorH: number,
  phase: number,
) {
  const cx = x + w / 2;
  const topY = y + (h - mirrorH) / 2;
  const botY = topY + mirrorH;

  // Mirrors
  ctx.strokeStyle = hexToRgba(tokens.textBright, 0.85);
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(cx - 50, topY);
  ctx.lineTo(cx + 50, topY);
  ctx.moveTo(cx - 50, botY);
  ctx.lineTo(cx + 50, botY);
  ctx.stroke();

  const zig = phase < 0.5 ? phase * 2 : 2 - phase * 2;
  const py = topY + zig * mirrorH;

  // Trail
  ctx.strokeStyle = hexToRgba(tokens.cyan, 0.4);
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(cx, topY);
  ctx.lineTo(cx, py);
  ctx.stroke();

  // Photon dot (amber)
  ctx.fillStyle = tokens.amber;
  ctx.beginPath();
  ctx.arc(cx, py, 5, 0, Math.PI * 2);
  ctx.fill();

  // Cyan baseline (clock body)
  ctx.strokeStyle = hexToRgba(tokens.cyan, 0.6);
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(cx - 60, botY + 8);
  ctx.lineTo(cx + 60, botY + 8);
  ctx.stroke();
}

function drawMovingClock(
  ctx: CanvasRenderingContext2D,
  tokens: SceneTokens,
  x: number,
  y: number,
  w: number,
  h: number,
  mirrorH: number,
  phase: number,
  beta: number,
) {
  const topY = y + (h - mirrorH) / 2;
  const botY = topY + mirrorH;

  const xStart = x + 30;
  const xEnd = x + w - 30;
  const xClock = xStart + (xEnd - xStart) * phase;

  // Mirror positions follow the clock
  ctx.strokeStyle = hexToRgba(tokens.textBright, 0.55);
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(xClock - 28, topY);
  ctx.lineTo(xClock + 28, topY);
  ctx.moveTo(xClock - 28, botY);
  ctx.lineTo(xClock + 28, botY);
  ctx.stroke();

  // Magenta baseline (clock chassis)
  ctx.strokeStyle = hexToRgba(tokens.magenta, 0.55);
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(xClock - 36, botY + 8);
  ctx.lineTo(xClock + 36, botY + 8);
  ctx.stroke();

  const zig = phase < 0.5 ? phase * 2 : 2 - phase * 2;
  const py = topY + zig * mirrorH;

  // Trail showing the zig-zag (path covered so far)
  ctx.strokeStyle = hexToRgba(tokens.amber, 0.55);
  ctx.lineWidth = 1.5;
  ctx.setLineDash([3, 4]);
  ctx.beginPath();
  ctx.moveTo(xStart, topY);
  if (phase < 0.5) {
    ctx.lineTo(xClock, py);
  } else {
    const xMid = xStart + (xEnd - xStart) * 0.5;
    ctx.lineTo(xMid, botY);
    ctx.lineTo(xClock, py);
  }
  ctx.stroke();
  ctx.setLineDash([]);

  // Photon dot
  ctx.fillStyle = tokens.amber;
  ctx.beginPath();
  ctx.arc(xClock, py, 5, 0, Math.PI * 2);
  ctx.fill();

  // Velocity arrow (magenta)
  if (Math.abs(beta) > 0.05) {
    const arrowY = botY + 26;
    const arrowLen = 50 * Math.min(1, Math.abs(beta) / 0.95);
    ctx.strokeStyle = tokens.magenta;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(xClock - arrowLen / 2, arrowY);
    ctx.lineTo(xClock + arrowLen / 2, arrowY);
    ctx.lineTo(xClock + arrowLen / 2 - 6, arrowY - 4);
    ctx.moveTo(xClock + arrowLen / 2, arrowY);
    ctx.lineTo(xClock + arrowLen / 2 - 6, arrowY + 4);
    ctx.stroke();
  }
}

function drawColumnLabels(
  ctx: CanvasRenderingContext2D,
  tokens: SceneTokens,
  cx: number,
  y: number,
  upper: string,
  lower: string,
  color: string,
) {
  ctx.font = "11px ui-monospace, monospace";
  ctx.fillStyle = color;
  ctx.textAlign = "center";
  ctx.fillText(upper, cx, y);
  ctx.fillStyle = tokens.textMute;
  ctx.fillText(lower, cx, y + 14);
  ctx.textAlign = "left";
}
