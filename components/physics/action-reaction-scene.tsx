"use client";

import { useEffect, useRef, useState } from "react";
import { useAnimationFrame } from "@/lib/animation/use-animation-frame";
import { useThemeColors } from "@/lib/hooks/use-theme-colors";
import { skaterVelocities } from "@/lib/physics/newton";

const RATIO = 0.6;
const MAX_HEIGHT = 360;
const IMPULSE = 60; // kg·m/s — equal and opposite push impulse
const PUSH_DURATION = 0.35; // seconds over which the force acts

export function ActionReactionScene() {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const colors = useThemeColors();
  const [ratio, setRatio] = useState(1); // mass_B / mass_A
  const [size, setSize] = useState({ width: 640, height: 360 });
  const startRef = useRef<number | null>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const ro = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const w = entry.contentRect.width;
        if (w > 0) {
          setSize({ width: w, height: Math.min(w * RATIO, MAX_HEIGHT) });
        }
      }
    });
    ro.observe(container);
    return () => ro.disconnect();
  }, []);

  // Reset on ratio change
  useEffect(() => {
    startRef.current = null;
  }, [ratio]);

  useAnimationFrame({
    elementRef: containerRef,
    onFrame: (t) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      const { width, height } = size;
      const dpr = window.devicePixelRatio || 1;
      if (canvas.width !== width * dpr || canvas.height !== height * dpr) {
        canvas.width = width * dpr;
        canvas.height = height * dpr;
        ctx.scale(dpr, dpr);
      }

      if (startRef.current === null) startRef.current = t;
      const tLocal = t - startRef.current;

      ctx.clearRect(0, 0, width, height);

      // Masses
      const massA = 60; // kg — reference
      const massB = massA * ratio;

      // Final velocities after the impulsive push
      const { vA, vB } = skaterVelocities(massA, massB, IMPULSE);

      const centreX = width / 2;
      const iceY = height * 0.55;
      const padX = 40;

      // Ice line
      ctx.strokeStyle = colors.fg2;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(padX, iceY + 28);
      ctx.lineTo(width - padX, iceY + 28);
      ctx.stroke();

      // Subtle ice hatching
      ctx.strokeStyle = colors.fg3;
      ctx.setLineDash([2, 6]);
      ctx.beginPath();
      for (let x = padX; x < width - padX; x += 16) {
        ctx.moveTo(x, iceY + 34);
        ctx.lineTo(x + 8, iceY + 34);
      }
      ctx.stroke();
      ctx.setLineDash([]);

      // Phase: push, then glide, then pause, then restart
      const pushEnd = PUSH_DURATION;
      const glideEnd = pushEnd + 3.2;
      const cycleEnd = glideEnd + 1.0;
      if (tLocal > cycleEnd) startRef.current = t;

      let xA = 0;
      let xB = 0;
      let forceNow = 0;
      if (tLocal < pushEnd) {
        // During the push: positions move slightly with half the final velocity
        const frac = tLocal / pushEnd;
        xA = 0.5 * vA * tLocal * frac;
        xB = 0.5 * vB * tLocal * frac;
        forceNow = 1;
      } else {
        const tGlide = Math.min(tLocal, glideEnd) - pushEnd;
        const xAatPush = 0.5 * vA * pushEnd; // cheap approximation
        const xBatPush = 0.5 * vB * pushEnd;
        xA = xAatPush + vA * tGlide;
        xB = xBatPush + vB * tGlide;
      }

      // Skater sizes — proportional to cube-root-ish of mass for visual
      const rA = 18 + Math.cbrt(massA) * 2;
      const rB = 18 + Math.cbrt(massB) * 2;

      // Clamp within canvas
      const maxX = (width - padX) - centreX - Math.max(rA, rB) - 10;
      const xAvis = Math.max(-maxX, Math.min(maxX, xA * 24));
      const xBvis = Math.max(-maxX, Math.min(maxX, xB * 24));

      const cxA = centreX + xAvis;
      const cxB = centreX + xBvis;
      const cyA = iceY;
      const cyB = iceY;

      // Force arrows during the push
      if (forceNow > 0) {
        const gap = (cxB - rB) - (cxA + rA);
        const mid = (cxA + rA + cxB - rB) / 2;
        const arrowH = gap * 0.35;
        // Force on A (points left)
        ctx.strokeStyle = "#FF6B6B";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(mid, cyA - 4);
        ctx.lineTo(mid - arrowH, cyA - 4);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(mid - arrowH, cyA - 4);
        ctx.lineTo(mid - arrowH + 6, cyA - 8);
        ctx.lineTo(mid - arrowH + 6, cyA);
        ctx.closePath();
        ctx.fillStyle = "#FF6B6B";
        ctx.fill();
        // Force on B (points right)
        ctx.strokeStyle = "#5BE9FF";
        ctx.beginPath();
        ctx.moveTo(mid, cyA + 6);
        ctx.lineTo(mid + arrowH, cyA + 6);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(mid + arrowH, cyA + 6);
        ctx.lineTo(mid + arrowH - 6, cyA + 2);
        ctx.lineTo(mid + arrowH - 6, cyA + 10);
        ctx.closePath();
        ctx.fillStyle = "#5BE9FF";
        ctx.fill();
      }

      // Skater A (left, red tint)
      drawSkater(ctx, cxA, cyA, rA, "#E4C27A", colors.fg0);
      // Skater B (right, cyan tint)
      drawSkater(ctx, cxB, cyB, rB, "#5BE9FF", colors.fg0);

      // Labels under each
      ctx.fillStyle = colors.fg1;
      ctx.font = "12px monospace";
      ctx.textAlign = "center";
      ctx.fillText(
        `m_A = ${massA.toFixed(0)} kg`,
        cxA,
        cyA + rA + 20,
      );
      ctx.fillText(
        `m_B = ${massB.toFixed(0)} kg`,
        cxB,
        cyB + rB + 20,
      );
      ctx.fillText(
        `v_A = ${vA.toFixed(2)} m/s`,
        cxA,
        cyA + rA + 36,
      );
      ctx.fillText(
        `v_B = ${vB.toFixed(2)} m/s`,
        cxB,
        cyB + rB + 36,
      );

      // Top line
      ctx.fillStyle = colors.fg1;
      ctx.font = "13px monospace";
      ctx.textAlign = "center";
      ctx.fillText(
        `|F_AB| = |F_BA|   →   m_A · v_A = − m_B · v_B`,
        width / 2,
        24,
      );
    },
  });

  return (
    <div ref={containerRef} className="w-full pb-4">
      <canvas
        ref={canvasRef}
        style={{ width: size.width, height: size.height }}
        className="block"
      />
      <div className="mt-2 flex items-center gap-3 px-2">
        <label className="text-sm text-[var(--color-fg-3)]">
          mass ratio m_B / m_A
        </label>
        <input
          type="range"
          min={0.25}
          max={4}
          step={0.05}
          value={ratio}
          onChange={(e) => setRatio(parseFloat(e.target.value))}
          className="flex-1 accent-[#5BE9FF]"
        />
        <span className="w-14 text-right text-sm font-mono text-[var(--color-fg-1)]">
          {ratio.toFixed(2)}
        </span>
      </div>
    </div>
  );
}

function drawSkater(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  r: number,
  bodyColor: string,
  strokeColor: string,
) {
  // Body
  ctx.fillStyle = bodyColor;
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.fill();
  // Subtle outline
  ctx.strokeStyle = strokeColor;
  ctx.lineWidth = 1;
  ctx.stroke();
  // Head
  ctx.fillStyle = bodyColor;
  ctx.beginPath();
  ctx.arc(cx, cy - r - 6, r * 0.45, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
}
