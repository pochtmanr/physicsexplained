"use client";

import { useEffect, useRef, useState } from "react";
import { useAnimationFrame } from "@/lib/animation/use-animation-frame";
import { useThemeColors } from "@/lib/hooks/use-theme-colors";

const RATIO = 0.55;
const MAX_HEIGHT = 340;

/**
 * A flywheel starts at rest and is spun up by a constant torque. The
 * angular velocity ω grows linearly (ω = α·t) — shown live as a rising
 * bar — while the wheel's angular position θ grows quadratically. Stops
 * spinning up at t = 4 s and coasts.
 */
export function AngularAccelerationScene() {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const colors = useThemeColors();
  const [size, setSize] = useState({ width: 640, height: 340 });
  const thetaRef = useRef(0);
  const lastRef = useRef<number | null>(null);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver((entries) => {
      for (const e of entries) {
        const w = e.contentRect.width;
        if (w > 0) setSize({ width: w, height: Math.min(w * RATIO, MAX_HEIGHT) });
      }
    });
    ro.observe(el);
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
      const dpr = window.devicePixelRatio || 1;
      if (canvas.width !== width * dpr || canvas.height !== height * dpr) {
        canvas.width = width * dpr;
        canvas.height = height * dpr;
        ctx.scale(dpr, dpr);
      }

      // Constant torque for 4s, then coast for 2s, then reset
      const cycle = 6;
      const phase = t % cycle;
      const rampEnd = 4;
      const alpha = 1.2;
      const omega = phase < rampEnd ? alpha * phase : alpha * rampEnd;
      const dt = lastRef.current === null ? 0 : t - lastRef.current;
      lastRef.current = t;
      if (phase < 0.02) thetaRef.current = 0;
      thetaRef.current += omega * dt;

      ctx.clearRect(0, 0, width, height);

      // Wheel
      const cx = width * 0.3;
      const cy = height * 0.52;
      const R = Math.min(width, height) * 0.22;
      ctx.strokeStyle = colors.fg3;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(cx, cy, R, 0, Math.PI * 2);
      ctx.stroke();
      // spokes
      ctx.strokeStyle = colors.fg1;
      ctx.lineWidth = 2;
      for (let i = 0; i < 4; i++) {
        const a = thetaRef.current + (i * Math.PI) / 2;
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.lineTo(cx + Math.cos(a) * R, cy + Math.sin(a) * R);
        ctx.stroke();
      }
      // marker dot
      ctx.fillStyle = colors.magenta;
      ctx.shadowColor = colors.magenta;
      ctx.shadowBlur = 10;
      ctx.beginPath();
      ctx.arc(cx + Math.cos(thetaRef.current) * (R - 8), cy + Math.sin(thetaRef.current) * (R - 8), 6, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;

      // Torque arrow (active during ramp)
      if (phase < rampEnd) {
        ctx.strokeStyle = colors.magenta;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(cx, cy, R + 14, -0.9, -0.1);
        ctx.stroke();
        ctx.fillStyle = colors.magenta;
        const ax = cx + Math.cos(-0.1) * (R + 14);
        const ay = cy + Math.sin(-0.1) * (R + 14);
        ctx.beginPath();
        ctx.arc(ax, ay, 3, 0, Math.PI * 2);
        ctx.fill();
        ctx.font = "11px monospace";
        ctx.textAlign = "center";
        ctx.fillText("τ", cx + R + 22, cy - 10);
      }

      // Omega bar
      const barX = width * 0.58;
      const barY = height * 0.25;
      const barW = width * 0.32;
      const barH = 14;
      ctx.strokeStyle = colors.fg3;
      ctx.strokeRect(barX, barY, barW, barH);
      const omegaMax = alpha * rampEnd;
      ctx.fillStyle = colors.magenta;
      ctx.fillRect(barX, barY, barW * (omega / omegaMax), barH);
      ctx.font = "11px monospace";
      ctx.fillStyle = colors.fg2;
      ctx.textAlign = "left";
      ctx.fillText("ω = α·t", barX, barY - 6);

      // Theta accumulation bar (mod 2π visualised as 6 wedges)
      const thetaBarY = height * 0.5;
      ctx.strokeRect(barX, thetaBarY, barW, barH);
      const thetaPlot = Math.min(thetaRef.current / (8 * Math.PI), 1);
      ctx.fillStyle = colors.fg1;
      ctx.fillRect(barX, thetaBarY, barW * thetaPlot, barH);
      ctx.fillStyle = colors.fg2;
      ctx.fillText("θ (angle traced)", barX, thetaBarY - 6);

      // Formula
      ctx.font = "12px monospace";
      ctx.fillStyle = colors.fg1;
      ctx.fillText("τ = I · α → ω grows linearly, θ quadratically", barX, height * 0.82);
    },
  });

  return (
    <div ref={containerRef} className="w-full pb-4">
      <canvas ref={canvasRef} style={{ width: size.width, height: size.height }} className="block" />
    </div>
  );
}
