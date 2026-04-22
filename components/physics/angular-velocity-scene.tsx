"use client";

import { useEffect, useRef, useState } from "react";
import { useAnimationFrame } from "@/lib/animation/use-animation-frame";
import { useThemeColors } from "@/lib/hooks/use-theme-colors";
import {
  angularFromPeriod,
  linearFromAngular,
} from "@/lib/physics/circular-motion";

const CANVAS_W = 360;
const CANVAS_H = 280;
const WHEEL_R = 100; // px on screen
const WHEEL_R_PHYS = 1.0; // m — what v = ωR refers to in the readout

const CYAN = "#6FB8C6";
const MAGENTA = "#FF6ADE";

export function AngularVelocityScene() {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const colors = useThemeColors();
  const [period, setPeriod] = useState(2.0); // seconds
  const phaseRef = useRef(0); // accumulated angle (radians)
  const lastPeriodRef = useRef(period);

  const omega = angularFromPeriod(period);
  const v = linearFromAngular(omega, WHEEL_R_PHYS);

  useEffect(() => {
    lastPeriodRef.current = period;
  }, [period]);

  useAnimationFrame({
    elementRef: containerRef,
    onFrame: (_t, dt) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      const dpr = window.devicePixelRatio || 1;
      if (canvas.width !== CANVAS_W * dpr || canvas.height !== CANVAS_H * dpr) {
        canvas.width = CANVAS_W * dpr;
        canvas.height = CANVAS_H * dpr;
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      }

      // Integrate phase using current ω so changing T smoothly speeds/slows.
      phaseRef.current += angularFromPeriod(lastPeriodRef.current) * dt;

      const cx = CANVAS_W / 2;
      const cy = CANVAS_H / 2;

      ctx.clearRect(0, 0, CANVAS_W, CANVAS_H);

      // Wheel rim
      ctx.strokeStyle = colors.fg2;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(cx, cy, WHEEL_R, 0, Math.PI * 2);
      ctx.stroke();

      // Spokes (4) — show rotation more clearly
      ctx.strokeStyle = colors.fg3;
      ctx.lineWidth = 1;
      for (let k = 0; k < 4; k++) {
        const ang = phaseRef.current + (k * Math.PI) / 2;
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.lineTo(cx + WHEEL_R * Math.cos(ang), cy + WHEEL_R * Math.sin(ang));
        ctx.stroke();
      }

      // Hub
      ctx.fillStyle = colors.fg1;
      ctx.beginPath();
      ctx.arc(cx, cy, 4, 0, Math.PI * 2);
      ctx.fill();

      // Rim dot (red/magenta — the tracked particle)
      const dx = cx + WHEEL_R * Math.cos(phaseRef.current);
      const dy = cy + WHEEL_R * Math.sin(phaseRef.current);
      ctx.shadowColor = "rgba(255, 106, 222, 0.55)";
      ctx.shadowBlur = 10;
      ctx.fillStyle = MAGENTA;
      ctx.beginPath();
      ctx.arc(dx, dy, 7, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;

      // Tangent velocity arrow (cyan) on the rim dot
      const tx = -Math.sin(phaseRef.current);
      const ty = Math.cos(phaseRef.current);
      const aLen = 38;
      ctx.strokeStyle = CYAN;
      ctx.fillStyle = CYAN;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(dx, dy);
      ctx.lineTo(dx + aLen * tx, dy + aLen * ty);
      ctx.stroke();
      const ang = Math.atan2(ty, tx);
      const head = 7;
      ctx.beginPath();
      ctx.moveTo(dx + aLen * tx, dy + aLen * ty);
      ctx.lineTo(
        dx + aLen * tx - head * Math.cos(ang - Math.PI / 6),
        dy + aLen * ty - head * Math.sin(ang - Math.PI / 6),
      );
      ctx.lineTo(
        dx + aLen * tx - head * Math.cos(ang + Math.PI / 6),
        dy + aLen * ty - head * Math.sin(ang + Math.PI / 6),
      );
      ctx.closePath();
      ctx.fill();

      ctx.fillStyle = CYAN;
      ctx.font = "11px monospace";
      ctx.textAlign = "left";
      ctx.fillText("v = ωR", dx + aLen * tx + 6, dy + aLen * ty + 4);
    },
  });

  return (
    <div ref={containerRef} className="relative w-full pb-4">
      <canvas
        ref={canvasRef}
        style={{ width: CANVAS_W, height: CANVAS_H }}
        className="mx-auto block"
      />
      <div className="pointer-events-none absolute right-2 top-2">
        <div className="rounded-sm border border-[var(--color-fg-4)] bg-[var(--color-bg-0)]/70 px-2 py-1 font-mono text-[10px] leading-relaxed text-[var(--color-fg-1)] backdrop-blur-sm">
          <div>T = {period.toFixed(2)} s</div>
          <div>ω = 2π/T = {omega.toFixed(2)} rad/s</div>
          <div>v = ωR = {v.toFixed(2)} m/s</div>
          <div className="text-[var(--color-fg-3)]">R = {WHEEL_R_PHYS.toFixed(1)} m</div>
        </div>
      </div>
      <div className="mt-2 flex items-center gap-3 px-2">
        <label className="w-20 text-sm text-[var(--color-fg-3)]">Period T</label>
        <input
          type="range"
          min={0.5}
          max={5}
          step={0.05}
          value={period}
          onChange={(e) => setPeriod(parseFloat(e.target.value))}
          className="flex-1 accent-[#6FB8C6]"
        />
        <span className="w-16 text-right text-sm font-mono text-[var(--color-fg-1)]">
          {period.toFixed(2)} s
        </span>
      </div>
    </div>
  );
}
