"use client";

import { useEffect, useRef, useState } from "react";
import { useAnimationFrame } from "@/lib/animation/use-animation-frame";
import { useThemeColors } from "@/lib/hooks/use-theme-colors";

const RATIO = 0.55;
const MAX_HEIGHT = 300;

export function ShmOscillatorScene() {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const colors = useThemeColors();
  const [size, setSize] = useState({ width: 480, height: 300 });

  const amp = 80, period = 3, omega = (2 * Math.PI) / period;
  const splitX = 160, pivotY = 40;

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const ro = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const w = entry.contentRect.width;
        if (w > 0) {
          const h = Math.min(w * RATIO, MAX_HEIGHT);
          setSize({ width: w, height: h });
        }
      }
    });
    ro.observe(container);
    return () => ro.disconnect();
  }, []);

  useAnimationFrame({
    elementRef: canvasRef,
    onFrame: (t) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      const { width, height } = size;
      const restY = height / 2;
      const dpr = window.devicePixelRatio || 1;
      if (canvas.width !== width * dpr || canvas.height !== height * dpr) {
        canvas.width = width * dpr; canvas.height = height * dpr; ctx.scale(dpr, dpr);
      }
      const y = amp * Math.cos(omega * t);
      const bobY = restY + y;
      ctx.clearRect(0, 0, width, height);

      // Ceiling
      ctx.strokeStyle = colors.fg2; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(splitX / 2 - 30, pivotY); ctx.lineTo(splitX / 2 + 30, pivotY); ctx.stroke();

      // Spring zig-zag
      const coils = 10, springTop = pivotY, springBot = bobY - 15, springLen = springBot - springTop;
      ctx.strokeStyle = colors.fg1; ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.moveTo(splitX / 2, springTop);
      for (let i = 1; i <= coils * 2; i++) {
        const frac = i / (coils * 2);
        ctx.lineTo(splitX / 2 + (i % 2 === 0 ? -12 : 12), springTop + frac * springLen);
      }
      ctx.lineTo(splitX / 2, springBot); ctx.stroke();

      // Bob
      ctx.shadowColor = "rgba(111, 184, 198, 0.6)"; ctx.shadowBlur = 12;
      ctx.fillStyle = "#6FB8C6"; ctx.beginPath(); ctx.arc(splitX / 2, bobY, 12, 0, Math.PI * 2); ctx.fill();
      ctx.shadowBlur = 0;

      // Equilibrium dashed line
      ctx.setLineDash([4, 4]); ctx.strokeStyle = colors.fg3; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(splitX / 2 - 30, restY); ctx.lineTo(width - 20, restY); ctx.stroke();
      ctx.setLineDash([]);

      // Right side axes
      ctx.strokeStyle = colors.fg2; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(splitX + 20, pivotY); ctx.lineTo(splitX + 20, height - 20); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(splitX + 20, restY); ctx.lineTo(width - 10, restY); ctx.stroke();

      // Sinusoidal trace
      const traceW = width - splitX - 40, timeWindow = 6;
      ctx.strokeStyle = "#6FB8C6"; ctx.lineWidth = 2; ctx.beginPath();
      let started = false;
      for (let px = 0; px <= traceW; px++) {
        const tT = t - (traceW - px) / traceW * timeWindow;
        if (tT < 0) continue;
        const yT = restY + amp * Math.cos(omega * tT);
        if (!started) { ctx.moveTo(splitX + 20 + px, yT); started = true; } else ctx.lineTo(splitX + 20 + px, yT);
      }
      ctx.stroke();

      // Current dot on trace
      ctx.fillStyle = "#6FB8C6"; ctx.beginPath(); ctx.arc(splitX + 20 + traceW, bobY, 4, 0, Math.PI * 2); ctx.fill();

      // Connecting dashed line
      ctx.strokeStyle = colors.fg3; ctx.lineWidth = 1; ctx.setLineDash([2, 3]);
      ctx.beginPath(); ctx.moveTo(splitX / 2 + 12, bobY); ctx.lineTo(splitX + 20 + traceW, bobY); ctx.stroke();
      ctx.setLineDash([]);
    },
  });

  return (
    <div ref={containerRef} className="w-full pb-4">
      <canvas ref={canvasRef} style={{ width: size.width, height: size.height }} className="block" />
    </div>
  );
}
