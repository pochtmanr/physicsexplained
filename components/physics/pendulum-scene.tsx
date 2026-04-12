"use client";

import { useEffect, useRef } from "react";
import { smallAngleTheta, smallAnglePeriod } from "@/lib/physics/pendulum";
import { useAnimationFrame } from "@/lib/animation/use-animation-frame";
import { useReducedMotion } from "@/lib/hooks/use-reduced-motion";

export interface PendulumSceneProps {
  /** Initial amplitude in radians (small-angle mode holds for <~0.3) */
  theta0: number;
  /** Pendulum length in meters */
  length: number;
  /** Canvas width in px */
  width?: number;
  /** Canvas height in px */
  height?: number;
  /** Bob radius in px */
  bobRadius?: number;
  /** Called every frame with the current state for a HUD overlay */
  onState?: (state: { theta: number; period: number; t: number }) => void;
  /** Draws a timeline bar below the pendulum, flashing at each zero-crossing */
  showTimer?: boolean;
  /** If true, integrates the full nonlinear ODE instead of small-angle. */
  exact?: boolean;
}

export function PendulumScene({
  theta0,
  length,
  width = 480,
  height = 360,
  bobRadius = 10,
  onState,
  showTimer = false,
  exact = false,
}: PendulumSceneProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const reducedMotion = useReducedMotion();

  // Trail buffer: array of recent bob positions with timestamps for fading
  const trailRef = useRef<Array<{ x: number; y: number; age: number }>>([]);

  const exactSamplesRef = useRef<
    ReturnType<typeof import("@/lib/physics/pendulum").largeAngleSolve> | null
  >(null);

  useEffect(() => {
    if (!exact) {
      exactSamplesRef.current = null;
      return;
    }
    let cancelled = false;
    (async () => {
      const { largeAngleSolve, exactLargeAnglePeriod } = await import(
        "@/lib/physics/pendulum"
      );
      const T = exactLargeAnglePeriod(theta0, length);
      // Integrate across 3 periods at 300 samples/period for smooth playback
      const samples = largeAngleSolve({
        theta0,
        L: length,
        tEnd: 3 * T,
        nSamples: 900,
      });
      if (!cancelled) exactSamplesRef.current = samples;
    })();
    return () => {
      cancelled = true;
    };
  }, [exact, theta0, length]);

  useAnimationFrame({
    elementRef: containerRef,
    alwaysOn: false,
    onFrame: (t, dt) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      // Handle HiDPI
      const dpr = window.devicePixelRatio || 1;
      if (canvas.width !== width * dpr || canvas.height !== height * dpr) {
        canvas.width = width * dpr;
        canvas.height = height * dpr;
        ctx.scale(dpr, dpr);
      }

      // Compute angle
      let theta: number;
      let period: number;
      if (exact && exactSamplesRef.current && exactSamplesRef.current.length > 0) {
        const samples = exactSamplesRef.current;
        const tWrap = t % samples[samples.length - 1]!.t;
        // Find nearest sample (linear scan is fine at 900 samples)
        let i = 0;
        while (i < samples.length - 1 && samples[i + 1]!.t < tWrap) i++;
        theta = samples[i]!.theta;
        // Period = full sample span / 3 (we integrated 3 periods)
        period = samples[samples.length - 1]!.t / 3;
      } else {
        theta = reducedMotion
          ? theta0 // freeze at initial position if reduced motion
          : smallAngleTheta({ t, theta0, L: length });
        period = smallAnglePeriod(length);
      }

      // Convert to screen coordinates
      // Pivot at top-center, pendulum hangs down
      const pivotX = width / 2;
      const pivotY = 50;
      const pxPerMeter = (height - 100) / Math.max(length, 0.1);
      const bobX = pivotX + pxPerMeter * length * Math.sin(theta);
      const bobY = pivotY + pxPerMeter * length * Math.cos(theta);

      // Update trail (cap to 60 points)
      trailRef.current.forEach((p) => (p.age += dt));
      trailRef.current = trailRef.current.filter((p) => p.age < 1.2);
      trailRef.current.push({ x: bobX, y: bobY, age: 0 });
      if (trailRef.current.length > 60) trailRef.current.shift();

      // Clear
      ctx.clearRect(0, 0, width, height);

      // Draw ghost extremes (dim cyan dots at ±theta0)
      ctx.fillStyle = "rgba(91, 233, 255, 0.25)";
      for (const sign of [-1, 1]) {
        const gx = pivotX + pxPerMeter * length * Math.sin(sign * theta0);
        const gy = pivotY + pxPerMeter * length * Math.cos(sign * theta0);
        ctx.beginPath();
        ctx.arc(gx, gy, 3, 0, Math.PI * 2);
        ctx.fill();
      }

      // Draw trail
      for (const p of trailRef.current) {
        const alpha = Math.max(0, 1 - p.age / 1.2) * 0.6;
        ctx.fillStyle = `rgba(91, 233, 255, ${alpha})`;
        ctx.beginPath();
        ctx.arc(p.x, p.y, 2, 0, Math.PI * 2);
        ctx.fill();
      }

      // Draw rod
      ctx.strokeStyle = "#E6EDF7";
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(pivotX, pivotY);
      ctx.lineTo(bobX, bobY);
      ctx.stroke();

      // Draw pivot dot
      ctx.fillStyle = "#5B6B86";
      ctx.beginPath();
      ctx.arc(pivotX, pivotY, 3, 0, Math.PI * 2);
      ctx.fill();

      // Draw bob with glow
      ctx.shadowColor = "rgba(91, 233, 255, 0.6)";
      ctx.shadowBlur = 16;
      ctx.fillStyle = "#5BE9FF";
      ctx.beginPath();
      ctx.arc(bobX, bobY, bobRadius, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;

      if (showTimer) {
        const barY = height - 20;
        const barLeft = 40;
        const barRight = width - 40;
        const barWidth = barRight - barLeft;

        // Draw background bar
        ctx.strokeStyle = "#2A3448";
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(barLeft, barY);
        ctx.lineTo(barRight, barY);
        ctx.stroke();

        // Progress fill
        const cyclesDone = t / period;
        const fractionThisCycle = cyclesDone - Math.floor(cyclesDone);
        ctx.strokeStyle = "#5BE9FF";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(barLeft, barY);
        ctx.lineTo(barLeft + barWidth * fractionThisCycle, barY);
        ctx.stroke();

        // Ticks at integer cycle boundaries (flashing for 0.2s after each)
        const completedCycles = Math.floor(cyclesDone);
        for (let c = 1; c <= completedCycles; c++) {
          const x = barLeft + barWidth * (c / Math.max(1, completedCycles));
          const ageOfTick = t - c * period;
          const alpha = ageOfTick < 0.2 ? 1 : 0.4;
          ctx.strokeStyle = `rgba(91, 233, 255, ${alpha})`;
          ctx.beginPath();
          ctx.moveTo(x, barY - 6);
          ctx.lineTo(x, barY + 6);
          ctx.stroke();
        }
      }

      // Notify parent
      onState?.({ theta, period, t });
    },
  });

  return (
    <div
      ref={containerRef}
      style={{ width, height }}
      className="mx-auto"
    >
      <canvas
        ref={canvasRef}
        style={{ width, height }}
        className="block"
      />
    </div>
  );
}
