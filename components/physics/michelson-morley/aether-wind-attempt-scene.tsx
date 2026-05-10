"use client";

import { useRef } from "react";
import { useAnimationFrame } from "@/lib/animation/use-animation-frame";
import {
  EARTH_ORBITAL_SPEED,
  predictedFringeShift,
  expectedNullThreshold,
  MICHELSON_1887_ARM_LENGTH,
  SODIUM_D_WAVELENGTH,
} from "@/lib/physics/relativity/michelson-morley";
import {
  applyDpr,
  hexToRgba,
  SCENE_CANVAS_CLASS,
  SCENE_HEIGHT_TALL,
  useSceneSize,
  useSceneTokens,
} from "@/components/physics/_shared/scene-tokens";

/**
 * FIG.03c — The aether wind that should have been there.
 *
 *   If the luminiferous aether is at rest in the Sun's frame and Earth
 *   orbits at v ≈ 30 km/s, then a lab fixed to Earth must ride a 30 km/s
 *   "aether wind" — the same way a cyclist riding through still air
 *   feels a headwind.
 *
 *   The scene shows:
 *     • Earth orbiting the Sun in a near-circular path.
 *     • A wind-vector arrow on Earth, always anti-parallel to Earth's
 *       instantaneous velocity, magnitude 30 km/s.
 *     • A small interferometer apparatus riding with Earth, rotating
 *       through the wind.
 *     • A HUD reading off the aether-wind speed, the predicted Δn for
 *       this v, and the actual fringe shift Michelson and Morley
 *       observed (≈ 0).
 *
 * The conclusion the scene refuses to soften: the wind that should be
 * there is NOT THERE, no matter where on the orbit you measure.
 */
export function AetherWindAttemptScene() {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const tokens = useSceneTokens();
  const { width, height } = useSceneSize(containerRef, {
    ratio: 0.66,
    maxHeight: SCENE_HEIGHT_TALL,
  });

  useAnimationFrame({
    elementRef: containerRef,
    onFrame: (t) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = applyDpr(canvas, width, height);
      if (!ctx) return;
      ctx.clearRect(0, 0, width, height);
      ctx.fillStyle = tokens.bg;
      ctx.fillRect(0, 0, width, height);

      // ── Layout: orbit on left 65%, HUD/inset on right 35% ──
      const orbitW = width * 0.65;
      const cx = orbitW * 0.5;
      const cy = height * 0.5;
      const orbitR = Math.min(orbitW, height) * 0.32;

      // Orbital phase: 18-second loop here (year scale would be silly).
      const omega = (Math.PI * 2) / 18;
      const phi = (t * omega) % (Math.PI * 2);

      // Earth position
      const ex = cx + orbitR * Math.cos(phi);
      const ey = cy + orbitR * Math.sin(phi);
      // Earth velocity direction: tangent to orbit (counter-clockwise)
      const vx = -Math.sin(phi);
      const vy = Math.cos(phi);

      // ── Orbit path ──
      ctx.strokeStyle = tokens.panelBorder;
      ctx.lineWidth = 1;
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.arc(cx, cy, orbitR, 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);

      // ── Sun ──
      ctx.save();
      ctx.shadowColor = hexToRgba(tokens.amber, 0.85);
      ctx.shadowBlur = 24;
      ctx.fillStyle = tokens.amber;
      ctx.beginPath();
      ctx.arc(cx, cy, 12, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
      ctx.fillStyle = tokens.textMute;
      ctx.font = tokens.fontHudSmall;
      ctx.textAlign = "center";
      ctx.fillText("Sun", cx, cy + 28);
      ctx.fillText("(aether at rest here)", cx, cy + 42);

      // ── Aether-wind streaks (radial-ish background hatching) ──
      // Static streaks anchored to the lab/aether frame, drifting backward
      // past Earth as Earth moves through them.
      ctx.save();
      ctx.strokeStyle = hexToRgba(tokens.cyan, 0.10);
      ctx.lineWidth = 1;
      const nStreaks = 32;
      for (let i = 0; i < nStreaks; i++) {
        const a = (i / nStreaks) * Math.PI * 2;
        const r0 = orbitR * 0.55;
        const r1 = orbitR * 1.55;
        ctx.beginPath();
        ctx.moveTo(cx + r0 * Math.cos(a), cy + r0 * Math.sin(a));
        ctx.lineTo(cx + r1 * Math.cos(a), cy + r1 * Math.sin(a));
        ctx.stroke();
      }
      ctx.restore();

      // ── Earth ──
      ctx.save();
      ctx.shadowColor = hexToRgba(tokens.cyan, 0.85);
      ctx.shadowBlur = 14;
      ctx.fillStyle = tokens.cyan;
      ctx.beginPath();
      ctx.arc(ex, ey, 8, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
      ctx.fillStyle = tokens.textMute;
      ctx.font = tokens.fontHudSmall;
      ctx.textAlign = "center";
      ctx.fillText("Earth (v = 30 km/s)", ex, ey - 14);

      // ── Earth's velocity arrow (small, blue, tangent) ──
      const vArrLen = 26;
      drawArrow(ctx, ex, ey, ex + vArrLen * vx, ey + vArrLen * vy, tokens.cyan, 1.6);

      // ── Aether wind arrow (anti-parallel to v) ──
      const wArrLen = 38;
      drawArrow(
        ctx,
        ex - wArrLen * vx * 0.2,
        ey - wArrLen * vy * 0.2,
        ex - wArrLen * vx,
        ey - wArrLen * vy,
        tokens.amber,
        2.2,
      );
      ctx.fillStyle = tokens.amber;
      ctx.font = tokens.fontHudSmall;
      ctx.textAlign = "center";
      ctx.fillText("aether wind?", ex - wArrLen * vx, ey - wArrLen * vy - 6);

      // ── Inset apparatus on the Earth body ──
      // Small spinning interferometer marking the rotation phase
      const localTheta = t * 0.9;
      ctx.save();
      ctx.translate(ex, ey);
      ctx.rotate(localTheta);
      ctx.strokeStyle = hexToRgba(tokens.textBright, 0.85);
      ctx.lineWidth = 1.2;
      const a2 = 11;
      ctx.beginPath();
      ctx.moveTo(-a2, 0);
      ctx.lineTo(a2, 0);
      ctx.moveTo(0, -a2);
      ctx.lineTo(0, a2);
      ctx.stroke();
      ctx.restore();

      // ── HUD panel on the right ──
      const hudX = orbitW + 12;
      const hudY = 24;
      const hudW = width - hudX - 12;

      const v_kms = EARTH_ORBITAL_SPEED / 1000;
      const predicted = predictedFringeShift(
        MICHELSON_1887_ARM_LENGTH,
        SODIUM_D_WAVELENGTH,
        EARTH_ORBITAL_SPEED,
      );
      const noise = expectedNullThreshold();
      const observed = noise * 0.6 * Math.sin(t * 0.5);

      ctx.fillStyle = tokens.textDim;
      ctx.font = tokens.fontHudSmall;
      ctx.textAlign = "left";
      ctx.fillText("AETHER-WIND PREDICTION", hudX, hudY);

      ctx.fillStyle = tokens.textMute;
      ctx.font = "10px monospace";
      let yy = hudY + 18;
      const lines = [
        `v_Earth     ${v_kms.toFixed(1)} km/s`,
        `L           ${MICHELSON_1887_ARM_LENGTH} m`,
        `λ           589 nm`,
        ``,
        `predicted   Δn ≈ ${predicted.toFixed(3)}`,
        `noise floor ≈ ${noise.toFixed(2)}`,
        ``,
        `observed    Δn ≈ ${observed.toFixed(4)}`,
        ``,
        `ratio: prediction is`,
        `${(predicted / noise).toFixed(0)}× the noise floor.`,
        ``,
        `verdict: there is no wind.`,
      ];
      for (const l of lines) {
        if (l.startsWith("verdict")) {
          ctx.fillStyle = tokens.red;
          ctx.font = tokens.fontHudSmall;
        } else if (l.startsWith("predicted")) {
          ctx.fillStyle = tokens.amber;
        } else if (l.startsWith("observed")) {
          ctx.fillStyle = tokens.cyan;
        } else {
          ctx.fillStyle = tokens.textMute;
          ctx.font = "10px monospace";
        }
        ctx.fillText(l, hudX, yy);
        yy += 14;
      }

      // Faint wrap-around frame
      ctx.strokeStyle = tokens.panelBorder;
      ctx.lineWidth = 1;
      ctx.strokeRect(hudX - 6, hudY - 14, hudW, yy - hudY + 6);
    },
  });

  return (
    <div ref={containerRef} className="w-full pb-3">
      <canvas
        ref={canvasRef}
        style={{ width, height, display: "block" }}
        className={SCENE_CANVAS_CLASS}
      />
    </div>
  );
}

function drawArrow(
  ctx: CanvasRenderingContext2D,
  x0: number,
  y0: number,
  x1: number,
  y1: number,
  color: string,
  lineWidth = 1.5,
) {
  const dx = x1 - x0;
  const dy = y1 - y0;
  const len = Math.hypot(dx, dy);
  if (len < 0.5) return;
  const ux = dx / len;
  const uy = dy / len;
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineWidth = lineWidth;
  ctx.beginPath();
  ctx.moveTo(x0, y0);
  ctx.lineTo(x1, y1);
  ctx.stroke();
  // Arrowhead
  const ahLen = 7;
  const ahW = 4;
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x1 - ahLen * ux + ahW * uy, y1 - ahLen * uy - ahW * ux);
  ctx.lineTo(x1 - ahLen * ux - ahW * uy, y1 - ahLen * uy + ahW * ux);
  ctx.closePath();
  ctx.fill();
}
