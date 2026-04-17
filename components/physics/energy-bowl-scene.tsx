"use client";

import { useEffect, useRef, useState } from "react";
import { useAnimationFrame } from "@/lib/animation/use-animation-frame";
import { useThemeColors } from "@/lib/hooks/use-theme-colors";
import { bowlState } from "@/lib/physics/energy";

const RATIO = 0.55;
const MAX_HEIGHT = 360;

export function EnergyBowlScene() {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const colors = useThemeColors();
  const [friction, setFriction] = useState(0);
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

  useEffect(() => {
    startRef.current = null;
  }, [friction]);

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

      const padX = 40;
      const padY = 30;
      const halfWidth = 1.2; // metres
      const rimHeight = 0.6; // metres
      const mass = 1; // kg
      const amplitude = 1.0; // metres

      const bowlW = width - 2 * padX;
      const bowlH = height - 2 * padY - 80; // leave room for the bar chart
      const bowlCx = width / 2;
      const bowlTop = padY;
      const bowlBottom = bowlTop + bowlH;

      const mToPxX = bowlW / (2 * halfWidth);
      const mToPxY = bowlH / rimHeight;

      // Bowl curve
      ctx.strokeStyle = colors.fg2;
      ctx.lineWidth = 2;
      ctx.beginPath();
      for (let i = 0; i <= 60; i++) {
        const frac = i / 60;
        const xM = (frac - 0.5) * 2 * halfWidth;
        const yM = rimHeight * (xM / halfWidth) * (xM / halfWidth);
        const px = bowlCx + xM * mToPxX;
        const py = bowlBottom - yM * mToPxY;
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.stroke();

      // Zero line (rim level)
      ctx.strokeStyle = colors.fg3;
      ctx.setLineDash([2, 4]);
      ctx.beginPath();
      ctx.moveTo(padX, bowlTop);
      ctx.lineTo(width - padX, bowlTop);
      ctx.stroke();
      ctx.setLineDash([]);

      // State at t
      const s = bowlState(
        tLocal,
        amplitude,
        halfWidth,
        rimHeight,
        mass,
        friction,
      );

      // Total initial energy E0 = m·g·H with amplitude at rim-equivalent
      const e0 = mass * 9.80665 * rimHeight * (amplitude / halfWidth) ** 2;

      const ballPx = bowlCx + s.x * mToPxX;
      const ballPy = bowlBottom - s.y * mToPxY - 10;

      // Ball
      ctx.fillStyle = "#5BE9FF";
      ctx.beginPath();
      ctx.arc(ballPx, ballPy, 10, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = colors.fg0;
      ctx.lineWidth = 1;
      ctx.stroke();

      // Energy bars (stacked)
      const barAreaY = bowlBottom + 30;
      const barW = width - 2 * padX;
      const barH = 18;
      ctx.font = "12px monospace";
      ctx.fillStyle = colors.fg1;
      ctx.textAlign = "left";
      ctx.fillText("ENERGY BUDGET", padX, barAreaY - 10);

      const total = Math.max(s.total, 1e-6);
      const keFrac = e0 > 0 ? s.ke / e0 : 0;
      const peFrac = e0 > 0 ? s.pe / e0 : 0;
      const lostFrac = Math.max(0, 1 - (s.total / e0));

      // KE segment
      const keW = barW * keFrac;
      ctx.fillStyle = "#5BE9FF";
      ctx.fillRect(padX, barAreaY, keW, barH);
      // PE segment
      const peW = barW * peFrac;
      ctx.fillStyle = "#E4C27A";
      ctx.fillRect(padX + keW, barAreaY, peW, barH);
      // Lost (heat) segment
      const lostW = barW * lostFrac;
      ctx.fillStyle = "#FF6B6B";
      ctx.fillRect(padX + keW + peW, barAreaY, lostW, barH);

      // Bar outline
      ctx.strokeStyle = colors.fg2;
      ctx.lineWidth = 1;
      ctx.strokeRect(padX, barAreaY, barW, barH);

      // Legend
      ctx.textAlign = "left";
      ctx.fillStyle = "#5BE9FF";
      ctx.fillRect(padX, barAreaY + barH + 10, 10, 10);
      ctx.fillStyle = colors.fg1;
      ctx.fillText(`KE ${(keFrac * 100).toFixed(0)}%`, padX + 16, barAreaY + barH + 19);

      ctx.fillStyle = "#E4C27A";
      ctx.fillRect(padX + 110, barAreaY + barH + 10, 10, 10);
      ctx.fillStyle = colors.fg1;
      ctx.fillText(
        `PE ${(peFrac * 100).toFixed(0)}%`,
        padX + 126,
        barAreaY + barH + 19,
      );

      ctx.fillStyle = "#FF6B6B";
      ctx.fillRect(padX + 220, barAreaY + barH + 10, 10, 10);
      ctx.fillStyle = colors.fg1;
      ctx.fillText(
        `HEAT ${(lostFrac * 100).toFixed(0)}%`,
        padX + 236,
        barAreaY + barH + 19,
      );

      // Header equation
      ctx.fillStyle = colors.fg1;
      ctx.font = "13px monospace";
      ctx.textAlign = "center";
      ctx.fillText(
        friction > 0
          ? "E_total = KE + PE + heat (friction bleeds energy away)"
          : "E_total = KE + PE (conserved)",
        width / 2,
        18,
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
        <label className="text-sm text-[var(--color-fg-2)]">friction</label>
        <input
          type="range"
          min={0}
          max={0.4}
          step={0.005}
          value={friction}
          onChange={(e) => setFriction(parseFloat(e.target.value))}
          className="flex-1 accent-[#5BE9FF]"
        />
        <span className="w-14 text-right text-sm font-mono text-[var(--color-fg-1)]">
          {friction.toFixed(3)}
        </span>
      </div>
    </div>
  );
}
