"use client";

import { useRef } from "react";
import { useAnimationFrame } from "@/lib/animation/use-animation-frame";
import { useThemeColors } from "@/lib/hooks/use-theme-colors";
import {
  rollingCircleCenter,
  generatingPoint,
} from "@/lib/physics/cycloid";

export interface CycloidSceneProps {
  width?: number;
  height?: number;
  radius?: number;
}

export function CycloidScene({
  width = 480,
  height = 300,
  radius = 50,
}: CycloidSceneProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const colors = useThemeColors();
  const trailRef = useRef<Array<{ x: number; y: number }>>([]);

  useAnimationFrame({
    elementRef: containerRef,
    onFrame: (t) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      // Handle HiDPI
      const dpr = window.devicePixelRatio || 1;
      if (canvas.width !== width * dpr || canvas.height !== height * dpr) {
        canvas.width = width * dpr;
        canvas.height = height * dpr;
        ctx.scale(dpr, dpr);
      }

      const R = radius;
      const period = 4; // seconds per full arch
      const param = ((t % period) / period) * 2 * Math.PI;

      // Baseline Y — circle rolls along this line
      const baseY = height - 40;
      const offsetX = 20;

      // Compute positions
      const center = rollingCircleCenter(R, param);
      const gen = generatingPoint(R, param);

      // Screen coords: flip y (cycloid y goes up, canvas y goes down)
      const cx = offsetX + center.x;
      const cy = baseY - center.y;
      const gx = offsetX + gen.x;
      const gy = baseY - gen.y;

      // Add to trail
      trailRef.current.push({ x: gx, y: gy });
      // Reset trail on new cycle
      if (trailRef.current.length > 1) {
        const prev = trailRef.current[trailRef.current.length - 2];
        if (prev && gx < prev.x) {
          trailRef.current = [{ x: gx, y: gy }];
        }
      }

      ctx.clearRect(0, 0, width, height);

      // Draw baseline
      ctx.strokeStyle = colors.fg3;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(0, baseY);
      ctx.lineTo(width, baseY);
      ctx.stroke();

      // Draw cycloid trail
      if (trailRef.current.length > 1) {
        ctx.strokeStyle = "#5BE9FF";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(trailRef.current[0]!.x, trailRef.current[0]!.y);
        for (let i = 1; i < trailRef.current.length; i++) {
          ctx.lineTo(trailRef.current[i]!.x, trailRef.current[i]!.y);
        }
        ctx.stroke();
      }

      // Draw rolling circle
      ctx.strokeStyle = colors.fg2;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(cx, cy, R, 0, Math.PI * 2);
      ctx.stroke();

      // Draw line from center to generating point
      ctx.strokeStyle = colors.fg3;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(gx, gy);
      ctx.stroke();

      // Draw generating point with glow
      ctx.shadowColor = "rgba(91, 233, 255, 0.6)";
      ctx.shadowBlur = 12;
      ctx.fillStyle = "#5BE9FF";
      ctx.beginPath();
      ctx.arc(gx, gy, 5, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;
    },
  });

  return (
    <div ref={containerRef} style={{ width, height }} className="mx-auto">
      <canvas ref={canvasRef} style={{ width, height }} className="block" />
    </div>
  );
}
