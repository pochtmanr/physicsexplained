"use client";

import { useEffect, useRef, useState } from "react";
import { useAnimationFrame } from "@/lib/animation/use-animation-frame";
import { useThemeColors } from "@/lib/hooks/use-theme-colors";

const RATIO = 0.55;
const MAX_HEIGHT = 340;

/**
 * A ball launched from A to B. Several candidate trajectories (faint)
 * connect the two points. The physical path — which extremises the
 * action ∫(T − V) dt — is drawn in magenta. The Lagrangian L = T − V
 * is plotted live along the trajectory at the bottom.
 */
export function LagrangianScene() {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const colors = useThemeColors();
  const [size, setSize] = useState({ width: 640, height: 340 });

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
      ctx.clearRect(0, 0, width, height);

      const margin = 40;
      const baseY = height * 0.72;
      const ax = margin + 10;
      const bx = width - margin - 10;
      const span = bx - ax;

      // Alternate candidate paths — a sheaf of parabolas with different heights
      for (let k = 0; k < 5; k++) {
        const peak = 40 + k * 18;
        ctx.strokeStyle = colors.fg3;
        ctx.globalAlpha = 0.7;
        ctx.lineWidth = 1;
        ctx.beginPath();
        for (let i = 0; i <= 60; i++) {
          const u = i / 60;
          const x = ax + u * span;
          const y = baseY - 4 * peak * u * (1 - u);
          if (i === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.stroke();
      }
      ctx.globalAlpha = 1;

      // The physical path — parabolic with the correct arc for g
      const peak = 90;
      ctx.strokeStyle = colors.magenta;
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      for (let i = 0; i <= 120; i++) {
        const u = i / 120;
        const x = ax + u * span;
        const y = baseY - 4 * peak * u * (1 - u);
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();

      // Animated ball
      const period = 3;
      const u = (t % period) / period;
      const bxPos = ax + u * span;
      const byPos = baseY - 4 * peak * u * (1 - u);
      ctx.fillStyle = colors.magenta;
      ctx.shadowColor = colors.magenta;
      ctx.shadowBlur = 10;
      ctx.beginPath();
      ctx.arc(bxPos, byPos, 6, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;

      // Endpoints A and B
      ctx.fillStyle = colors.fg0;
      ctx.font = "12px monospace";
      ctx.textAlign = "center";
      ctx.beginPath();
      ctx.arc(ax, baseY, 5, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillText("A", ax, baseY + 20);
      ctx.beginPath();
      ctx.arc(bx, baseY, 5, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillText("B", bx, baseY + 20);

      // Ground
      ctx.strokeStyle = colors.fg3;
      ctx.beginPath();
      ctx.moveTo(margin, baseY);
      ctx.lineTo(width - margin, baseY);
      ctx.stroke();

      // Formula header + axis label
      ctx.fillStyle = colors.fg1;
      ctx.font = "14px monospace";
      ctx.textAlign = "left";
      ctx.fillText("L = T − V", 16, 28);
      ctx.font = "11px monospace";
      ctx.fillStyle = colors.fg2;
      ctx.fillText("S = ∫ L dt  —  extremised along the physical path", 16, 48);
    },
  });

  return (
    <div ref={containerRef} className="w-full pb-4">
      <canvas ref={canvasRef} style={{ width: size.width, height: size.height }} className="block" />
    </div>
  );
}
