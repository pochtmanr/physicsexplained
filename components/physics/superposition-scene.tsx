"use client";

import { useEffect, useRef, useState } from "react";
import { gaussianPulse } from "@/lib/physics/waves";
import { useAnimationFrame } from "@/lib/animation/use-animation-frame";
import { useThemeColors } from "@/lib/hooks/use-theme-colors";

const RATIO = 0.55;
const MAX_HEIGHT = 340;

/**
 * Two Gaussian pulses travelling in opposite directions on the same string.
 * Before, during, and after the collision the constituent pulses are drawn
 * faintly as dashed ghosts; the observable string profile is their sum.
 * Demonstrates linearity: during overlap the sum can double the local
 * amplitude, yet afterwards each pulse emerges unchanged. d'Alembert's
 * f(x − vt) + g(x + vt) made visible.
 */
export function SuperpositionScene() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const colors = useThemeColors();
  const [speed, setSpeed] = useState(1.6);
  const [size, setSize] = useState({ width: 560, height: 340 });
  const [running, setRunning] = useState(true);
  const cycleRef = useRef(0);

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

  const { width, height } = size;

  // Simulation domain [-5, +5] metres.
  const xMin = -5;
  const xMax = 5;
  const pulseWidth = 0.5;
  const amplitude = 0.9;
  const startA = -3.5;
  const startB = 3.5;
  const cyclePeriod = 6; // seconds per full loop

  useAnimationFrame({
    elementRef: containerRef,
    onFrame: (tLive) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      const dpr = window.devicePixelRatio || 1;
      if (canvas.width !== width * dpr || canvas.height !== height * dpr) {
        canvas.width = width * dpr;
        canvas.height = height * dpr;
        ctx.scale(dpr, dpr);
      }

      if (running) cycleRef.current = tLive % cyclePeriod;
      const tLocal = cycleRef.current;

      ctx.clearRect(0, 0, width, height);

      const marginX = 16;
      const plotW = width - 2 * marginX;
      const midY = height / 2;
      const ampPx = height * 0.32;
      const xToPx = (x: number) =>
        marginX + ((x - xMin) / (xMax - xMin)) * plotW;
      const yToPx = (y: number) => midY - y * ampPx;

      // Equilibrium
      ctx.strokeStyle = colors.fg3;
      ctx.lineWidth = 1;
      ctx.setLineDash([3, 3]);
      ctx.beginPath();
      ctx.moveTo(marginX, midY);
      ctx.lineTo(marginX + plotW, midY);
      ctx.stroke();
      ctx.setLineDash([]);

      // Pulses: right-mover starts at startA, moves +speed
      //         left-mover  starts at startB, moves −speed
      const shapeA = (x: number) =>
        gaussianPulse(x, tLocal, startA, +speed, pulseWidth, amplitude);
      const shapeB = (x: number) =>
        gaussianPulse(x, tLocal, startB, -speed, pulseWidth, amplitude);

      const steps = plotW;
      const samplesA: number[] = [];
      const samplesB: number[] = [];
      const samplesSum: number[] = [];
      for (let i = 0; i <= steps; i++) {
        const x = xMin + (i / steps) * (xMax - xMin);
        const a = shapeA(x);
        const b = shapeB(x);
        samplesA.push(a);
        samplesB.push(b);
        samplesSum.push(a + b);
      }

      // Ghost A (right-mover, cyan dashed)
      ctx.strokeStyle = "rgba(111, 184, 198, 0.5)";
      ctx.lineWidth = 1;
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      for (let i = 0; i <= steps; i++) {
        const px = marginX + i;
        const py = yToPx(samplesA[i]!);
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.stroke();

      // Ghost B (left-mover, amber dashed)
      ctx.strokeStyle = "rgba(255, 178, 94, 0.5)";
      ctx.beginPath();
      for (let i = 0; i <= steps; i++) {
        const px = marginX + i;
        const py = yToPx(samplesB[i]!);
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.stroke();
      ctx.setLineDash([]);

      // Sum (the observable string profile, magenta, thick)
      ctx.strokeStyle = "#FF6ADE";
      ctx.lineWidth = 2;
      ctx.beginPath();
      for (let i = 0; i <= steps; i++) {
        const px = marginX + i;
        const py = yToPx(samplesSum[i]!);
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.stroke();

      // Arrows on each ghost showing travel direction
      const markerA = startA + speed * tLocal;
      const markerB = startB - speed * tLocal;
      const drawArrow = (x: number, dir: 1 | -1, colour: string) => {
        if (x < xMin || x > xMax) return;
        const px = xToPx(x);
        const py = yToPx(amplitude) - 14;
        ctx.strokeStyle = colour;
        ctx.lineWidth = 1.25;
        ctx.beginPath();
        ctx.moveTo(px - 10 * dir, py);
        ctx.lineTo(px + 10 * dir, py);
        ctx.moveTo(px + 10 * dir, py);
        ctx.lineTo(px + 4 * dir, py - 4);
        ctx.moveTo(px + 10 * dir, py);
        ctx.lineTo(px + 4 * dir, py + 4);
        ctx.stroke();
      };
      drawArrow(markerA, 1, "#6FB8C6");
      drawArrow(markerB, -1, "#FFB25E");

      // Peak of the superposition (text label)
      let peak = 0;
      for (const y of samplesSum) {
        if (Math.abs(y) > Math.abs(peak)) peak = y;
      }
      ctx.fillStyle = colors.fg1;
      ctx.font = "12px monospace";
      ctx.textAlign = "left";
      ctx.fillText(
        `max |y| = ${Math.abs(peak).toFixed(2)} m`,
        marginX,
        height - 8,
      );
      ctx.textAlign = "right";
      ctx.fillText(
        `t = ${tLocal.toFixed(2)} s   v = ${speed.toFixed(2)} m/s`,
        marginX + plotW,
        height - 8,
      );
    },
  });

  return (
    <div ref={containerRef} className="w-full pb-4">
      <canvas ref={canvasRef} style={{ width, height }} className="block" />
      <div className="mt-3 grid grid-cols-[auto_1fr_auto] items-center gap-x-3 gap-y-2 px-2 text-sm">
        <label className="text-[var(--color-fg-3)]">Wave speed v</label>
        <input
          type="range"
          min={0.5}
          max={3}
          step={0.05}
          value={speed}
          onChange={(e) => setSpeed(parseFloat(e.target.value))}
          className="accent-[#6FB8C6]"
        />
        <span className="w-16 text-right font-mono text-[var(--color-fg-1)]">
          {speed.toFixed(2)} m/s
        </span>
      </div>
      <div className="mt-2 px-2">
        <button
          type="button"
          onClick={() => setRunning((r) => !r)}
          className="font-mono text-xs uppercase tracking-wider text-[var(--color-fg-3)] hover:text-[var(--color-fg-1)]"
        >
          {running ? "❚❚ pause" : "▶ play"}
        </button>
      </div>
    </div>
  );
}
