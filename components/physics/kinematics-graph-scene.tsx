"use client";

import { useEffect, useRef, useState } from "react";
import { useAnimationFrame } from "@/lib/animation/use-animation-frame";
import { useThemeColors } from "@/lib/hooks/use-theme-colors";

const RATIO = 1.05;
const MAX_HEIGHT = 620;
const T_MAX = 5;

export function KinematicsGraphScene() {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const colors = useThemeColors();
  const [x0, setX0] = useState(0);
  const [v0, setV0] = useState(2);
  const [a, setA] = useState(1);
  const [size, setSize] = useState({ width: 560, height: 560 });
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

  // Reset animation when sliders change
  useEffect(() => {
    startRef.current = null;
  }, [x0, v0, a]);

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
      let tLocal = t - startRef.current;
      if (tLocal > T_MAX + 0.8) {
        startRef.current = t;
        tLocal = 0;
      }
      const tCursor = Math.min(tLocal, T_MAX);

      ctx.clearRect(0, 0, width, height);

      // Layout: top track strip, then three stacked graphs
      const trackH = 58;
      const gap = 8;
      const graphH = (height - trackH - gap * 4) / 3;
      const graphX = 52;
      const graphW = width - graphX - 18;

      // ---- 1D Track ----
      const trackY = 30;
      const trackPad = graphX;
      const trackW = width - trackPad - 18;
      ctx.strokeStyle = colors.fg3;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(trackPad, trackY);
      ctx.lineTo(trackPad + trackW, trackY);
      ctx.stroke();

      // Compute x range seen over the whole sweep to set the track scale
      const xAt = (tt: number) => x0 + v0 * tt + 0.5 * a * tt * tt;
      const samples = [0, T_MAX * 0.25, T_MAX * 0.5, T_MAX * 0.75, T_MAX].map(
        (tt) => xAt(tt),
      );
      const xMinTrack = Math.min(0, ...samples);
      const xMaxTrack = Math.max(0, ...samples);
      const xRange = Math.max(xMaxTrack - xMinTrack, 1);
      const margin = xRange * 0.1;
      const xLo = xMinTrack - margin;
      const xHi = xMaxTrack + margin;
      const toTrackPx = (xx: number) =>
        trackPad + ((xx - xLo) / (xHi - xLo)) * trackW;

      // x=0 marker on track
      ctx.strokeStyle = colors.fg2;
      ctx.setLineDash([2, 3]);
      ctx.beginPath();
      ctx.moveTo(toTrackPx(0), trackY - 10);
      ctx.lineTo(toTrackPx(0), trackY + 10);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle = colors.fg2;
      ctx.font = "10px monospace";
      ctx.textAlign = "center";
      ctx.fillText("0", toTrackPx(0), trackY + 22);

      // Ball on track
      const xNow = xAt(tCursor);
      const ballPx = toTrackPx(xNow);
      ctx.shadowColor = "rgba(91, 233, 255, 0.55)";
      ctx.shadowBlur = 12;
      ctx.fillStyle = "#5BE9FF";
      ctx.beginPath();
      ctx.arc(ballPx, trackY, 8, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;

      // ---- Three stacked graphs ----
      const drawGraph = (
        yTop: number,
        label: string,
        f: (tt: number) => number,
        accent: string,
      ) => {
        // Determine y-range for this graph
        const ysSample: number[] = [];
        for (let i = 0; i <= 40; i++) {
          ysSample.push(f((i / 40) * T_MAX));
        }
        const yLo0 = Math.min(0, ...ysSample);
        const yHi0 = Math.max(0, ...ysSample);
        const yPad = Math.max((yHi0 - yLo0) * 0.15, 0.3);
        const yLo = yLo0 - yPad;
        const yHi = yHi0 + yPad;

        const toPx = (tt: number, yy: number) => ({
          px: graphX + (tt / T_MAX) * graphW,
          py: yTop + graphH - ((yy - yLo) / (yHi - yLo)) * graphH,
        });

        // Frame
        ctx.strokeStyle = colors.fg3;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(graphX, yTop);
        ctx.lineTo(graphX, yTop + graphH);
        ctx.lineTo(graphX + graphW, yTop + graphH);
        ctx.stroke();

        // Zero line within graph (if zero is inside range)
        if (yLo < 0 && yHi > 0) {
          const zeroY = yTop + graphH - ((0 - yLo) / (yHi - yLo)) * graphH;
          ctx.strokeStyle = colors.fg3;
          ctx.setLineDash([2, 3]);
          ctx.beginPath();
          ctx.moveTo(graphX, zeroY);
          ctx.lineTo(graphX + graphW, zeroY);
          ctx.stroke();
          ctx.setLineDash([]);
        }

        // Label
        ctx.fillStyle = colors.fg1;
        ctx.font = "12px monospace";
        ctx.textAlign = "left";
        ctx.fillText(label, graphX + 6, yTop + 14);

        // y-axis min/max ticks
        ctx.fillStyle = colors.fg2;
        ctx.font = "10px monospace";
        ctx.textAlign = "right";
        ctx.fillText(yHi.toFixed(1), graphX - 4, yTop + 10);
        ctx.fillText(yLo.toFixed(1), graphX - 4, yTop + graphH - 2);

        // The curve
        ctx.strokeStyle = accent;
        ctx.lineWidth = 2;
        ctx.beginPath();
        const steps = 100;
        for (let i = 0; i <= steps; i++) {
          const tt = (i / steps) * T_MAX;
          const { px, py } = toPx(tt, f(tt));
          if (i === 0) ctx.moveTo(px, py);
          else ctx.lineTo(px, py);
        }
        ctx.stroke();

        // Cursor line
        const cursorX = graphX + (tCursor / T_MAX) * graphW;
        ctx.strokeStyle = colors.fg2;
        ctx.setLineDash([2, 3]);
        ctx.beginPath();
        ctx.moveTo(cursorX, yTop);
        ctx.lineTo(cursorX, yTop + graphH);
        ctx.stroke();
        ctx.setLineDash([]);

        // Dot at cursor
        const pt = toPx(tCursor, f(tCursor));
        ctx.fillStyle = accent;
        ctx.beginPath();
        ctx.arc(pt.px, pt.py, 4, 0, Math.PI * 2);
        ctx.fill();

        // Readout
        ctx.fillStyle = colors.fg1;
        ctx.font = "11px monospace";
        ctx.textAlign = "right";
        ctx.fillText(
          `${f(tCursor).toFixed(2)}`,
          graphX + graphW - 4,
          yTop + 14,
        );
      };

      const g1Top = trackY + 30 + gap;
      const g2Top = g1Top + graphH + gap;
      const g3Top = g2Top + graphH + gap;

      drawGraph(g1Top, "x(t)", (tt) => xAt(tt), "#5BE9FF");
      drawGraph(g2Top, "v(t) = v₀ + a·t", (tt) => v0 + a * tt, "#8EE8A3");
      drawGraph(g3Top, "a(t) = const", () => a, "#E29FFF");

      // x-axis ticks at bottom
      ctx.fillStyle = colors.fg2;
      ctx.font = "10px monospace";
      ctx.textAlign = "center";
      for (let i = 0; i <= 5; i++) {
        const tt = i;
        const tx = graphX + (tt / T_MAX) * graphW;
        ctx.fillText(`${tt}`, tx, g3Top + graphH + 14);
      }
      ctx.fillText("t (s)", graphX + graphW, g3Top + graphH + 14);
    },
  });

  const slider = (
    label: string,
    unit: string,
    value: number,
    setValue: (v: number) => void,
    min: number,
    max: number,
    step: number,
  ) => (
    <div className="flex items-center gap-3">
      <label className="w-20 text-sm text-[var(--color-fg-3)]">{label}</label>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => setValue(parseFloat(e.target.value))}
        className="flex-1 accent-[#5BE9FF]"
      />
      <span className="w-20 text-right text-sm font-mono text-[var(--color-fg-1)]">
        {value.toFixed(1)} {unit}
      </span>
    </div>
  );

  return (
    <div ref={containerRef} className="w-full pb-4">
      <canvas
        ref={canvasRef}
        style={{ width: size.width, height: size.height }}
        className="block"
      />
      <div className="mt-2 flex flex-col gap-2 px-2">
        {slider("x₀", "m", x0, setX0, -5, 5, 0.5)}
        {slider("v₀", "m/s", v0, setV0, -4, 4, 0.1)}
        {slider("a", "m/s²", a, setA, -2, 2, 0.1)}
      </div>
    </div>
  );
}
