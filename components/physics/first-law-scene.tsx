"use client";

import { useEffect, useRef, useState } from "react";
import { useAnimationFrame } from "@/lib/animation/use-animation-frame";
import { useThemeColors } from "@/lib/hooks/use-theme-colors";
import { coastWithFriction } from "@/lib/physics/newton";

const RATIO = 0.55;
const MAX_HEIGHT = 340;
const V0 = 3.2; // m/s initial push
const TRACK_METRES = 12; // world length displayed

export function FirstLawScene() {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const colors = useThemeColors();
  const [mu, setMu] = useState(0.15);
  const [size, setSize] = useState({ width: 640, height: 340 });
  const startRef = useRef<number | null>(null);
  const restUntilRef = useRef<number | null>(null);

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

  // Reset on slider change
  useEffect(() => {
    startRef.current = null;
    restUntilRef.current = null;
  }, [mu]);

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

      const padX = 30;
      const floorY = height - 60;
      const plotLeft = padX;
      const plotRight = width - padX;
      const trackW = plotRight - plotLeft;

      const state = coastWithFriction(tLocal, V0, mu);

      // Wrap / restart behaviour
      if (mu <= 0.001) {
        // Frictionless: wrap around the visible track
        const wrapped = state.x % TRACK_METRES;
        state.x = wrapped < 0 ? wrapped + TRACK_METRES : wrapped;
      } else if (state.stopped) {
        // Pause briefly after it stops, then restart
        if (restUntilRef.current === null) {
          restUntilRef.current = tLocal + 1.4;
        }
        if (tLocal >= restUntilRef.current) {
          startRef.current = t;
          restUntilRef.current = null;
        }
      }

      // Clamp to visible track
      const xWorld = Math.max(0, Math.min(state.x, TRACK_METRES));

      // Floor
      ctx.strokeStyle = colors.fg2;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(plotLeft, floorY);
      ctx.lineTo(plotRight, floorY);
      ctx.stroke();

      // Hatch marks under the floor — denser if mu is higher
      const hatchCount = 30;
      const hatchSpacing = trackW / hatchCount;
      ctx.strokeStyle = colors.fg3;
      ctx.lineWidth = 1;
      ctx.beginPath();
      for (let i = 0; i <= hatchCount; i++) {
        const x = plotLeft + i * hatchSpacing;
        const len = 4 + mu * 18;
        ctx.moveTo(x, floorY);
        ctx.lineTo(x - len * 0.5, floorY + len);
      }
      ctx.stroke();

      // Block
      const blockW = 44;
      const blockH = 30;
      const blockX =
        plotLeft + (xWorld / TRACK_METRES) * trackW - blockW / 2;
      const blockY = floorY - blockH;

      // Velocity arrow (cyan) — length scales with current v
      if (state.v > 0.01) {
        const arrowLen = (state.v / V0) * 70 + 10;
        ctx.strokeStyle = "#5BE9FF";
        ctx.lineWidth = 2;
        ctx.beginPath();
        const aY = blockY - 10;
        const aX0 = blockX + blockW / 2;
        const aX1 = aX0 + arrowLen;
        ctx.moveTo(aX0, aY);
        ctx.lineTo(aX1, aY);
        ctx.stroke();
        // arrowhead
        ctx.beginPath();
        ctx.moveTo(aX1, aY);
        ctx.lineTo(aX1 - 6, aY - 4);
        ctx.lineTo(aX1 - 6, aY + 4);
        ctx.closePath();
        ctx.fillStyle = "#5BE9FF";
        ctx.fill();
      }

      // Friction arrow (red) — opposite direction, scales with mu
      if (mu > 0.001 && state.v > 0.01) {
        const fLen = Math.min(60, mu * 120);
        ctx.strokeStyle = "#FF6B6B";
        ctx.lineWidth = 2;
        ctx.beginPath();
        const fY = blockY + blockH / 2;
        const fX0 = blockX;
        const fX1 = fX0 - fLen;
        ctx.moveTo(fX0, fY);
        ctx.lineTo(fX1, fY);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(fX1, fY);
        ctx.lineTo(fX1 + 6, fY - 4);
        ctx.lineTo(fX1 + 6, fY + 4);
        ctx.closePath();
        ctx.fillStyle = "#FF6B6B";
        ctx.fill();
      }

      // Block itself
      ctx.fillStyle = "#A0A8B4";
      ctx.beginPath();
      ctx.roundRect(blockX, blockY, blockW, blockH, 3);
      ctx.fill();

      // Labels
      ctx.fillStyle = colors.fg1;
      ctx.font = "12px monospace";
      ctx.textAlign = "left";
      ctx.fillText(`v = ${state.v.toFixed(2)} m/s`, plotLeft, 24);
      ctx.textAlign = "right";
      ctx.fillText(
        mu <= 0.001
          ? "frictionless — coasts forever"
          : state.stopped
            ? "at rest"
            : "coasting, slowing",
        plotRight,
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
        <label className="text-sm text-[var(--color-fg-3)]">Friction μ</label>
        <input
          type="range"
          min={0}
          max={0.5}
          step={0.005}
          value={mu}
          onChange={(e) => setMu(parseFloat(e.target.value))}
          className="flex-1 accent-[#5BE9FF]"
        />
        <span className="w-12 text-right text-sm font-mono text-[var(--color-fg-1)]">
          {mu.toFixed(3)}
        </span>
      </div>
    </div>
  );
}
