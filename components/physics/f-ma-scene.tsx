"use client";

import { useEffect, useRef, useState } from "react";
import { useAnimationFrame } from "@/lib/animation/use-animation-frame";
import { useThemeColors } from "@/lib/hooks/use-theme-colors";
import { acceleration } from "@/lib/physics/newton";

const RATIO = 0.55;
const MAX_HEIGHT = 340;
const TRACK_METRES = 10;

export function FMaScene() {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const colors = useThemeColors();
  const [force, setForce] = useState(4); // Newtons
  const [mass, setMass] = useState(2); // kg
  const [size, setSize] = useState({ width: 640, height: 340 });
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

  // Reset whenever the knobs change
  useEffect(() => {
    startRef.current = null;
  }, [force, mass]);

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

      const a = acceleration(force, mass);

      // Loop: find time to traverse TRACK_METRES, then restart
      // x(t) = 0.5 * a * t^2  ⇒  t_end = sqrt(2L/a)
      const tEnd = a > 0 ? Math.sqrt((2 * TRACK_METRES) / a) : Infinity;
      if (tLocal > tEnd + 0.5) {
        startRef.current = t;
      }
      const tUsed = Math.min(tLocal, tEnd);
      const x = 0.5 * a * tUsed * tUsed;
      const v = a * tUsed;

      const padX = 30;
      const floorY = height - 60;
      const plotLeft = padX;
      const plotRight = width - padX;
      const trackW = plotRight - plotLeft;

      // Floor
      ctx.strokeStyle = colors.fg2;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(plotLeft, floorY);
      ctx.lineTo(plotRight, floorY);
      ctx.stroke();

      // Metre ticks
      ctx.strokeStyle = colors.fg3;
      ctx.fillStyle = colors.fg3;
      ctx.font = "10px monospace";
      ctx.textAlign = "center";
      for (let m = 0; m <= TRACK_METRES; m += 2) {
        const px = plotLeft + (m / TRACK_METRES) * trackW;
        ctx.beginPath();
        ctx.moveTo(px, floorY);
        ctx.lineTo(px, floorY + 6);
        ctx.stroke();
        ctx.fillText(`${m}`, px, floorY + 18);
      }

      // Ball — radius grows with sqrt(mass) for visual feedback
      const ballR = 8 + Math.sqrt(mass) * 4;
      const ballX =
        plotLeft + Math.min(x, TRACK_METRES) / TRACK_METRES * trackW;
      const ballY = floorY - ballR - 2;

      // Force arrow — length scales with F
      const arrowLen = Math.min(90, force * 10);
      ctx.strokeStyle = "#5BE9FF";
      ctx.lineWidth = 2;
      ctx.beginPath();
      const aY = ballY;
      const aX0 = ballX + ballR + 2;
      const aX1 = aX0 + arrowLen;
      ctx.moveTo(aX0, aY);
      ctx.lineTo(aX1, aY);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(aX1, aY);
      ctx.lineTo(aX1 - 6, aY - 4);
      ctx.lineTo(aX1 - 6, aY + 4);
      ctx.closePath();
      ctx.fillStyle = "#5BE9FF";
      ctx.fill();

      // Ball with glow
      ctx.shadowColor = "rgba(91, 233, 255, 0.5)";
      ctx.shadowBlur = 14;
      ctx.fillStyle = "#E6EDF7";
      ctx.beginPath();
      ctx.arc(ballX, ballY, ballR, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;

      // Readouts
      ctx.fillStyle = colors.fg1;
      ctx.font = "13px monospace";
      ctx.textAlign = "left";
      ctx.fillText(`F = ${force.toFixed(1)} N`, plotLeft, 22);
      ctx.fillText(`m = ${mass.toFixed(1)} kg`, plotLeft, 40);
      ctx.fillText(`a = F/m = ${a.toFixed(2)} m/s²`, plotLeft, 58);
      ctx.textAlign = "right";
      ctx.fillText(`v = ${v.toFixed(2)} m/s`, plotRight, 22);
      ctx.fillText(`x = ${Math.min(x, TRACK_METRES).toFixed(2)} m`, plotRight, 40);
    },
  });

  return (
    <div ref={containerRef} className="w-full pb-4">
      <canvas
        ref={canvasRef}
        style={{ width: size.width, height: size.height }}
        className="block"
      />
      <div className="mt-2 flex flex-col gap-2 px-2">
        <div className="flex items-center gap-3">
          <label className="w-20 text-sm text-[var(--color-fg-3)]">
            Force F
          </label>
          <input
            type="range"
            min={0.5}
            max={10}
            step={0.1}
            value={force}
            onChange={(e) => setForce(parseFloat(e.target.value))}
            className="flex-1 accent-[#5BE9FF]"
          />
          <span className="w-16 text-right text-sm font-mono text-[var(--color-fg-1)]">
            {force.toFixed(1)} N
          </span>
        </div>
        <div className="flex items-center gap-3">
          <label className="w-20 text-sm text-[var(--color-fg-3)]">
            Mass m
          </label>
          <input
            type="range"
            min={0.5}
            max={8}
            step={0.1}
            value={mass}
            onChange={(e) => setMass(parseFloat(e.target.value))}
            className="flex-1 accent-[#5BE9FF]"
          />
          <span className="w-16 text-right text-sm font-mono text-[var(--color-fg-1)]">
            {mass.toFixed(1)} kg
          </span>
        </div>
      </div>
    </div>
  );
}
