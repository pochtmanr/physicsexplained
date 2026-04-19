"use client";

import { useRef, useState } from "react";
import { useAnimationFrame } from "@/lib/animation/use-animation-frame";
import { useThemeColors } from "@/lib/hooks/use-theme-colors";

export interface BeatsSceneProps {
  width?: number;
  height?: number;
}

export function BeatsScene({ width = 480, height = 380 }: BeatsSceneProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const colors = useThemeColors();
  const [deltaF, setDeltaF] = useState(0.3);

  const f1 = 3.0;
  const f2 = f1 + deltaF;

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

      ctx.clearRect(0, 0, width, height);

      const marginL = 10;
      const marginR = 10;
      const plotW = width - marginL - marginR;

      const rowH = height / 3;
      const amp = rowH * 0.35;
      const window_ = 4; // seconds of waveform visible

      // Helper: draw a waveform
      const drawWave = (
        yCenter: number,
        freqFn: (tSample: number) => number,
        color: string,
        lineWidth: number,
        scale = amp,
      ) => {
        ctx.strokeStyle = color;
        ctx.lineWidth = lineWidth;
        ctx.beginPath();
        const steps = plotW;
        for (let i = 0; i <= steps; i++) {
          const tSample = t - window_ + (window_ * i) / steps;
          const val = freqFn(tSample);
          const px = marginL + (plotW * i) / steps;
          const py = yCenter - val * scale;
          if (i === 0) ctx.moveTo(px, py);
          else ctx.lineTo(px, py);
        }
        ctx.stroke();
      };

      // Row 1: f₁ wave
      const y1 = rowH * 0.5;
      ctx.strokeStyle = colors.fg3;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(marginL, y1);
      ctx.lineTo(marginL + plotW, y1);
      ctx.stroke();

      drawWave(y1, (s) => Math.sin(2 * Math.PI * f1 * s), "#5BE9FF", 1.5);

      ctx.fillStyle = colors.fg2;
      ctx.font = "12px monospace";
      ctx.textAlign = "left";
      ctx.fillText(`f\u2081 = ${f1.toFixed(1)} Hz`, marginL + 4, y1 - amp - 4);

      // Row 2: f₂ wave
      const y2 = rowH * 1.5;
      ctx.strokeStyle = colors.fg3;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(marginL, y2);
      ctx.lineTo(marginL + plotW, y2);
      ctx.stroke();

      drawWave(y2, (s) => Math.sin(2 * Math.PI * f2 * s), "#FF6B6B", 1.5);

      ctx.fillStyle = colors.fg2;
      ctx.fillText(`f\u2082 = ${f2.toFixed(1)} Hz`, marginL + 4, y2 - amp - 4);

      // Row 3: superposition + envelope
      const y3 = rowH * 2.5;
      ctx.strokeStyle = colors.fg3;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(marginL, y3);
      ctx.lineTo(marginL + plotW, y3);
      ctx.stroke();

      // Beat envelope (dashed) — envelope of sum is 2·cos(π·Δf·t), scale by 0.5 to fit
      const fBeat = Math.abs(f2 - f1);
      const amp3 = amp * 0.5;
      ctx.strokeStyle = "#FFD93D";
      ctx.lineWidth = 1;
      ctx.setLineDash([4, 4]);
      for (const sign of [1, -1]) {
        ctx.beginPath();
        const steps = plotW;
        for (let i = 0; i <= steps; i++) {
          const tSample = t - window_ + (window_ * i) / steps;
          const env = sign * 2 * Math.cos(Math.PI * fBeat * tSample);
          const px = marginL + (plotW * i) / steps;
          const py = y3 - env * amp3;
          if (i === 0) ctx.moveTo(px, py);
          else ctx.lineTo(px, py);
        }
        ctx.stroke();
      }
      ctx.setLineDash([]);

      // Superposition wave (max amplitude = 2, scaled by amp3)
      drawWave(
        y3,
        (s) => Math.sin(2 * Math.PI * f1 * s) + Math.sin(2 * Math.PI * f2 * s),
        "#B794F4",
        1.5,
        amp3,
      );

      ctx.fillStyle = colors.fg2;
      ctx.fillText(
        `f_beat = |f\u2082 \u2212 f\u2081| = ${fBeat.toFixed(1)} Hz`,
        marginL + 4,
        y3 - amp3 * 2 - 4,
      );

      // Section labels
      ctx.fillStyle = colors.fg1;
      ctx.font = "11px monospace";
      ctx.textAlign = "right";
      ctx.fillText("signal 1", marginL + plotW - 4, y1 - amp - 4);
      ctx.fillText("signal 2", marginL + plotW - 4, y2 - amp - 4);
      ctx.fillText("superposition", marginL + plotW - 4, y3 - amp3 * 2 - 4);
    },
  });

  return (
    <div ref={containerRef} style={{ width }} className="mx-auto pb-4">
      <canvas
        ref={canvasRef}
        style={{ width, height }}
        className="block"
      />
      <div className="mt-2 flex items-center gap-3 px-2">
        <label className="text-sm text-[var(--color-fg-3)]">
          Frequency gap (\u0394f)
        </label>
        <input
          type="range"
          min={0.1}
          max={2.0}
          step={0.05}
          value={deltaF}
          onChange={(e) => setDeltaF(parseFloat(e.target.value))}
          className="flex-1 accent-[#5BE9FF]"
        />
        <span className="w-14 text-right text-sm font-mono text-[var(--color-fg-1)]">
          {deltaF.toFixed(2)} Hz
        </span>
      </div>
    </div>
  );
}
