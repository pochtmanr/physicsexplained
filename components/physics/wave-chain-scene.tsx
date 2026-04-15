"use client";

import { useEffect, useRef, useState } from "react";
import { useAnimationFrame } from "@/lib/animation/use-animation-frame";
import { useThemeColors } from "@/lib/hooks/use-theme-colors";

const RATIO = 0.6;
const MAX_HEIGHT = 300;

export function WaveChainScene() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const colors = useThemeColors();
  const [N, setN] = useState(10);
  const [size, setSize] = useState({ width: 480, height: 300 });

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

  const omega0 = 3;
  const Amp = 0.8;

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

      const midY = height / 2;
      const margin = 40;
      const chainW = width - 2 * margin;
      const maxDisp = 60; // max pixel displacement

      // Compute mode coefficients (initial: pluck first mass)
      // c_k = (2*A/(N+1)) * sin(k*pi/(N+1))
      // omega_k = 2*omega0*sin(k*pi/(2*(N+1)))

      // Compute displacements for each mass
      const displacements: number[] = [];
      for (let j = 1; j <= N; j++) {
        let y = 0;
        for (let k = 1; k <= N; k++) {
          const ck =
            (2 * Amp / (N + 1)) * Math.sin((k * Math.PI) / (N + 1));
          const omegaK =
            2 * omega0 * Math.sin((k * Math.PI) / (2 * (N + 1)));
          y +=
            ck *
            Math.sin((j * k * Math.PI) / (N + 1)) *
            Math.cos(omegaK * t);
        }
        displacements.push(y);
      }

      // Equilibrium line
      ctx.strokeStyle = colors.fg3;
      ctx.lineWidth = 1;
      ctx.setLineDash([3, 3]);
      ctx.beginPath();
      ctx.moveTo(margin, midY);
      ctx.lineTo(width - margin, midY);
      ctx.stroke();
      ctx.setLineDash([]);

      // Fixed endpoints (small rectangles)
      const endW = 6;
      const endH = 16;
      ctx.fillStyle = colors.fg2;
      ctx.fillRect(margin - endW / 2, midY - endH / 2, endW, endH);
      ctx.fillRect(
        width - margin - endW / 2,
        midY - endH / 2,
        endW,
        endH,
      );

      // Mass positions
      const positions: { x: number; y: number }[] = [];
      for (let j = 0; j < N; j++) {
        const px = margin + (chainW * (j + 1)) / (N + 1);
        const py = midY - displacements[j]! * maxDisp;
        positions.push({ x: px, y: py });
      }

      // Connections: endpoint -> masses -> endpoint
      ctx.strokeStyle = colors.fg1;
      ctx.lineWidth = 1;

      // Left endpoint to first mass
      ctx.beginPath();
      ctx.moveTo(margin, midY);
      ctx.lineTo(positions[0]!.x, positions[0]!.y);
      ctx.stroke();

      // Between masses
      for (let j = 0; j < N - 1; j++) {
        ctx.beginPath();
        ctx.moveTo(positions[j]!.x, positions[j]!.y);
        ctx.lineTo(positions[j + 1]!.x, positions[j + 1]!.y);
        ctx.stroke();
      }

      // Last mass to right endpoint
      ctx.beginPath();
      ctx.moveTo(positions[N - 1]!.x, positions[N - 1]!.y);
      ctx.lineTo(width - margin, midY);
      ctx.stroke();

      // Glowing mass dots
      const dotR = Math.max(3, 8 - N * 0.2);
      ctx.shadowColor = "rgba(91, 233, 255, 0.6)";
      ctx.shadowBlur = 10;
      ctx.fillStyle = "#5BE9FF";
      for (const pos of positions) {
        ctx.beginPath();
        ctx.arc(pos.x, pos.y, dotR, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.shadowBlur = 0;
    },
  });

  return (
    <div ref={containerRef} className="w-full pb-4">
      <canvas
        ref={canvasRef}
        style={{ width, height }}
        className="block"
      />
      <div className="mt-2 flex items-center gap-3 px-2">
        <label className="text-sm text-[var(--color-fg-2)]">
          N masses
        </label>
        <input
          type="range"
          min={3}
          max={30}
          step={1}
          value={N}
          onChange={(e) => setN(parseInt(e.target.value, 10))}
          className="flex-1 accent-[#5BE9FF]"
        />
        <span className="w-8 text-right text-sm font-mono text-[var(--color-fg-1)]">
          {N}
        </span>
      </div>
    </div>
  );
}
