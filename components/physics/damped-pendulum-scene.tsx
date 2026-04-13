"use client";

import { useRef, useState } from "react";
import { dampedFree, qualityFactor } from "@/lib/physics/damped-oscillator";
import { useAnimationFrame } from "@/lib/animation/use-animation-frame";
import { useThemeColors } from "@/lib/hooks/use-theme-colors";

export interface DampedPendulumSceneProps {
  theta0?: number;
  length?: number;
  width?: number;
  height?: number;
}

export function DampedPendulumScene({
  theta0 = 0.4,
  length = 1.2,
  width = 480,
  height = 420,
}: DampedPendulumSceneProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const colors = useThemeColors();
  const [gamma, setGamma] = useState(1.0);

  const traceRef = useRef<Array<{ t: number; x: number }>>([]);

  const omega0 = Math.sqrt(9.80665 / length);

  useAnimationFrame({
    elementRef: containerRef,
    onFrame: (t) => {
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

      const params = { omega0, gamma };
      const x = dampedFree(t, theta0, params);

      // Update trace
      traceRef.current.push({ t, x });
      const traceWindow = 6;
      traceRef.current = traceRef.current.filter(
        (p) => p.t > t - traceWindow,
      );

      ctx.clearRect(0, 0, width, height);

      // --- Pendulum drawing (top half) ---
      const pendulumHeight = height * 0.55;
      const pivotX = width / 2;
      const pivotY = 40;
      const pxPerMeter = (pendulumHeight - 60) / Math.max(length, 0.1);
      const bobX = pivotX + pxPerMeter * length * Math.sin(x);
      const bobY = pivotY + pxPerMeter * length * Math.cos(x);

      // Rod
      ctx.strokeStyle = colors.fg0;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(pivotX, pivotY);
      ctx.lineTo(bobX, bobY);
      ctx.stroke();

      // Pivot
      ctx.fillStyle = colors.fg2;
      ctx.beginPath();
      ctx.arc(pivotX, pivotY, 3, 0, Math.PI * 2);
      ctx.fill();

      // Bob with glow
      ctx.shadowColor = "rgba(91, 233, 255, 0.6)";
      ctx.shadowBlur = 16;
      ctx.fillStyle = "#5BE9FF";
      ctx.beginPath();
      ctx.arc(bobX, bobY, 10, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;

      // --- x(t) trace (bottom portion) ---
      const traceTop = pendulumHeight + 10;
      const traceBottom = height - 10;
      const traceH = traceBottom - traceTop;
      const traceMid = traceTop + traceH / 2;
      const traceLeft = 30;
      const traceRight = width - 10;
      const traceW = traceRight - traceLeft;

      // Axis line
      ctx.strokeStyle = colors.fg3;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(traceLeft, traceMid);
      ctx.lineTo(traceRight, traceMid);
      ctx.stroke();

      // Exponential envelope (red dashed)
      ctx.strokeStyle = "#FF6B6B";
      ctx.lineWidth = 1;
      ctx.setLineDash([4, 4]);
      const envSteps = 100;
      for (const sign of [1, -1]) {
        ctx.beginPath();
        for (let i = 0; i <= envSteps; i++) {
          const tSample = t - traceWindow + (traceWindow * i) / envSteps;
          if (tSample < 0) continue;
          const envVal =
            sign * theta0 * Math.exp((-gamma * tSample) / 2);
          const px =
            traceLeft + (traceW * (tSample - (t - traceWindow))) / traceWindow;
          const py = traceMid - (envVal / theta0) * (traceH / 2) * 0.9;
          if (i === 0 || tSample - traceWindow + traceWindow < 0.01) {
            ctx.moveTo(px, py);
          } else {
            ctx.lineTo(px, py);
          }
        }
        ctx.stroke();
      }
      ctx.setLineDash([]);

      // x(t) trace (cyan)
      ctx.strokeStyle = "#5BE9FF";
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      let started = false;
      for (const p of traceRef.current) {
        const px =
          traceLeft + (traceW * (p.t - (t - traceWindow))) / traceWindow;
        const py = traceMid - (p.x / theta0) * (traceH / 2) * 0.9;
        if (!started) {
          ctx.moveTo(px, py);
          started = true;
        } else {
          ctx.lineTo(px, py);
        }
      }
      ctx.stroke();

      // Q value display
      const Q = qualityFactor(params);
      ctx.fillStyle = colors.fg1;
      ctx.font = "13px monospace";
      ctx.textAlign = "left";
      ctx.fillText(`Q = ${Q.toFixed(1)}`, traceLeft, traceTop - 2);
    },
  });

  return (
    <div ref={containerRef} style={{ width }} className="mx-auto">
      <canvas
        ref={canvasRef}
        style={{ width, height }}
        className="block"
      />
      <div className="mt-2 flex items-center gap-3 px-2">
        <label className="text-sm text-[var(--color-fg-2)]">
          Damping (γ)
        </label>
        <input
          type="range"
          min={0}
          max={8}
          step={0.1}
          value={gamma}
          onChange={(e) => {
            setGamma(parseFloat(e.target.value));
            traceRef.current = [];
          }}
          className="flex-1 accent-[#5BE9FF]"
        />
        <span className="w-10 text-right text-sm font-mono text-[var(--color-fg-1)]">
          {gamma.toFixed(1)}
        </span>
      </div>
    </div>
  );
}
