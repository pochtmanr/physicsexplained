"use client";

import { useEffect, useRef, useState } from "react";
import { useAnimationFrame } from "@/lib/animation/use-animation-frame";
import { useThemeColors } from "@/lib/hooks/use-theme-colors";

const RATIO = 0.55;
const MAX_HEIGHT = 360;
const G = 9.80665;
const ANGLE_REF_DEG = 18;
const TMAX_REF = 2.75;

export function InclinedPlaneScene() {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const colors = useThemeColors();
  const [angleDeg, setAngleDeg] = useState(18);
  const [size, setSize] = useState({ width: 640, height: 360 });
  const phaseRef = useRef<number>(0);
  const prevTMaxRef = useRef<number | null>(null);

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

  useAnimationFrame({
    elementRef: containerRef,
    onFrame: (_t, dt) => {
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

      const angle = (angleDeg * Math.PI) / 180;
      const a = G * Math.sin(angle);

      const pad = 28;
      const rampLen = Math.min(width - pad * 2 - 20, 640);
      const originX = pad + 10;
      const originY = height - pad;
      const endX = originX + rampLen * Math.cos(angle);
      const endY = originY - rampLen * Math.sin(angle);

      // Traversal time scales with 1/sqrt(sinθ) so bigger angles = faster roll,
      // matching a = g·sinθ. At the reference angle we match TMAX_REF.
      const angleRefRad = (ANGLE_REF_DEG * Math.PI) / 180;
      const tMax =
        TMAX_REF * Math.sqrt(Math.sin(angleRefRad) / Math.sin(angle));
      const totalCycle = tMax + 1.0;

      // On angle change, rescale phase so the ball's fractional position on
      // the ramp stays continuous — no teleporting when dragging the slider.
      const prevTMax = prevTMaxRef.current;
      if (prevTMax !== null && prevTMax !== tMax) {
        if (phaseRef.current <= prevTMax) {
          phaseRef.current = (phaseRef.current / prevTMax) * tMax;
        }
      }
      prevTMaxRef.current = tMax;

      phaseRef.current = (phaseRef.current + dt) % totalCycle;
      const tLocal = phaseRef.current;

      const running = tLocal <= tMax;
      const tRoll = Math.min(tLocal, tMax);
      // Fraction along ramp f(tRoll) = (tRoll/tMax)^2
      const f = (tRoll / tMax) * (tRoll / tMax);
      const s = f * rampLen;

      const ballX = endX - s * Math.cos(angle);
      const ballY = endY + s * Math.sin(angle);

      ctx.clearRect(0, 0, width, height);

      // Ground (floor line under the ramp base)
      ctx.strokeStyle = colors.fg3;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(pad, originY);
      ctx.lineTo(width - pad, originY);
      ctx.stroke();

      // Ramp (a thin line from bottom-left to top-right)
      ctx.strokeStyle = colors.fg1;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(originX, originY);
      ctx.lineTo(endX, endY);
      ctx.stroke();

      // Right-angle bottom (subtle)
      ctx.strokeStyle = colors.fg3;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(originX, originY);
      ctx.lineTo(endX, originY);
      ctx.stroke();

      // Stroboscopic marks (perpendicular to ramp, short ticks)
      const nx = -Math.sin(angle); // normal to ramp (outward up-left)
      const ny = -Math.cos(angle);
      ctx.strokeStyle = colors.fg2;
      ctx.lineWidth = 1;
      ctx.font = "11px monospace";
      ctx.fillStyle = colors.fg2;
      ctx.textAlign = "center";

      // Marks at fractional positions (n/5)^2 of rampLen, revealed as the
      // roll progresses. Fully shown during the end-of-cycle pause.
      const marksCount = Math.min(5, Math.floor(5 * (tRoll / tMax)));
      const markFractions = [1 / 25, 4 / 25, 9 / 25, 16 / 25, 1];
      for (let i = 0; i < marksCount; i++) {
        const ms = markFractions[i] * rampLen;
        const mx = endX - ms * Math.cos(angle);
        const my = endY + ms * Math.sin(angle);
        ctx.beginPath();
        ctx.moveTo(mx, my);
        ctx.lineTo(mx + nx * 10, my + ny * 10);
        ctx.stroke();
      }

      // Interval labels (1, 3, 5, 7, 9) between consecutive marks
      const ratios = [1, 3, 5, 7, 9];
      const prevPoint = { x: endX, y: endY };
      for (let i = 0; i < marksCount; i++) {
        const ms = markFractions[i] * rampLen;
        const mx = endX - ms * Math.cos(angle);
        const my = endY + ms * Math.sin(angle);
        const midX = (prevPoint.x + mx) / 2;
        const midY = (prevPoint.y + my) / 2;
        ctx.fillStyle = "#5BE9FF";
        ctx.fillText(String(ratios[i]), midX + nx * 22, midY + ny * 22 + 4);
        prevPoint.x = mx;
        prevPoint.y = my;
      }

      // Ball
      if (running) {
        ctx.shadowColor = "rgba(91, 233, 255, 0.6)";
        ctx.shadowBlur = 14;
      }
      ctx.fillStyle = "#5BE9FF";
      ctx.beginPath();
      ctx.arc(ballX, ballY, 9, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;

      // Angle label near the origin
      ctx.fillStyle = colors.fg1;
      ctx.font = "12px monospace";
      ctx.textAlign = "left";
      ctx.fillText(`θ = ${angleDeg}°`, originX + 16, originY - 6);
      ctx.fillText(
        `a = g·sinθ = ${a.toFixed(2)} m/s²`,
        originX + 16,
        originY - 22,
      );

      // "Intervals: 1 : 3 : 5 : 7 : 9" caption top-right
      ctx.fillStyle = colors.fg2;
      ctx.textAlign = "right";
      ctx.fillText("intervals 1 : 3 : 5 : 7 : 9", width - pad, pad);
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
        <label className="text-sm text-[var(--color-fg-2)]">
          Angle (θ)
        </label>
        <input
          type="range"
          min={5}
          max={45}
          step={1}
          value={angleDeg}
          onChange={(e) => setAngleDeg(parseFloat(e.target.value))}
          className="flex-1 accent-[#5BE9FF]"
        />
        <span className="w-10 text-right text-sm font-mono text-[var(--color-fg-1)]">
          {angleDeg}°
        </span>
      </div>
    </div>
  );
}
