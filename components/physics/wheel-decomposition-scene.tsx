"use client";

import { useRef } from "react";
import { useAnimationFrame } from "@/lib/animation/use-animation-frame";
import { useThemeColors } from "@/lib/hooks/use-theme-colors";

const CANVAS_W = 480;
const CANVAS_H = 240;
const R = 60;
const ROAD_Y = 180;
const SPEED = 80; // pixels per second along the road
const TRAIL_SECONDS = 2.4;

const CYAN = "#6FB8C6";
const MAGENTA = "#FF6ADE";
const RED = "#FF6B6B";

function arrow(
  ctx: CanvasRenderingContext2D,
  x0: number,
  y0: number,
  x1: number,
  y1: number,
  color: string,
  width = 2,
  head = 7,
) {
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineWidth = width;
  ctx.beginPath();
  ctx.moveTo(x0, y0);
  ctx.lineTo(x1, y1);
  ctx.stroke();
  const ang = Math.atan2(y1 - y0, x1 - x0);
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(
    x1 - head * Math.cos(ang - Math.PI / 6),
    y1 - head * Math.sin(ang - Math.PI / 6),
  );
  ctx.lineTo(
    x1 - head * Math.cos(ang + Math.PI / 6),
    y1 - head * Math.sin(ang + Math.PI / 6),
  );
  ctx.closePath();
  ctx.fill();
}

export function WheelDecompositionScene() {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const colors = useThemeColors();

  useAnimationFrame({
    elementRef: containerRef,
    onFrame: (t) => {
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

      ctx.clearRect(0, 0, CANVAS_W, CANVAS_H);

      // Loop horizontally so the wheel re-enters from the left.
      const totalDist = CANVAS_W + 2 * R;
      const x = ((t * SPEED) % totalDist) - R;
      // Rolling without slipping: phi = x / R (positive = clockwise on screen)
      const phi = (x + R) / R;
      const wheelCx = x;
      const wheelCy = ROAD_Y - R;

      // Road
      ctx.strokeStyle = colors.fg3;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(0, ROAD_Y);
      ctx.lineTo(CANVAS_W, ROAD_Y);
      ctx.stroke();

      // Cycloid trail of the rim point (highlighted dot at angle phi from straight-down)
      ctx.strokeStyle = MAGENTA;
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      const samples = 80;
      for (let i = 0; i < samples; i++) {
        const dt = (i / samples) * TRAIL_SECONDS; // seconds in the past
        const xPast = x - SPEED * dt;
        const phiPast = phi - SPEED * dt / R;
        // Cycloid: rim point at angle (phi + π/2) on the wheel — start at bottom
        // x_rim = x_center + R sin(phi),  y_rim = y_center + R cos(phi)
        const rx = xPast + R * Math.sin(phiPast);
        const ry = wheelCy + R * Math.cos(phiPast);
        if (rx < -10 || rx > CANVAS_W + 10) continue;
        if (i === 0) ctx.moveTo(rx, ry);
        else ctx.lineTo(rx, ry);
      }
      ctx.stroke();

      // Wheel body
      ctx.strokeStyle = colors.fg2;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(wheelCx, wheelCy, R, 0, Math.PI * 2);
      ctx.stroke();

      // Spoke (so rotation is visible)
      ctx.strokeStyle = colors.fg3;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(wheelCx, wheelCy);
      ctx.lineTo(wheelCx + R * Math.sin(phi), wheelCy + R * Math.cos(phi));
      ctx.stroke();

      // Highlighted rim point (the one tracing the cycloid)
      const rimX = wheelCx + R * Math.sin(phi);
      const rimY = wheelCy + R * Math.cos(phi);
      ctx.fillStyle = MAGENTA;
      ctx.shadowColor = "rgba(255,106,222,0.6)";
      ctx.shadowBlur = 10;
      ctx.beginPath();
      ctx.arc(rimX, rimY, 5, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;

      // Velocity vectors at top, center, bottom
      const v = SPEED;
      const ARROW_SCALE = 0.6;
      // Top (length 2v, cyan)
      arrow(ctx, wheelCx, wheelCy - R, wheelCx + 2 * v * ARROW_SCALE, wheelCy - R, CYAN, 2);
      ctx.fillStyle = CYAN;
      ctx.font = "11px monospace";
      ctx.textAlign = "left";
      ctx.fillText("2v", wheelCx + 2 * v * ARROW_SCALE + 6, wheelCy - R + 4);
      // Center (length v, cyan)
      arrow(ctx, wheelCx, wheelCy, wheelCx + v * ARROW_SCALE, wheelCy, CYAN, 2);
      ctx.fillText("v", wheelCx + v * ARROW_SCALE + 6, wheelCy + 4);
      // Bottom (length 0, red dot)
      ctx.fillStyle = RED;
      ctx.beginPath();
      ctx.arc(wheelCx, ROAD_Y, 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = RED;
      ctx.fillText("0", wheelCx + 8, ROAD_Y + 4);
    },
  });

  return (
    <div ref={containerRef} className="relative w-full pb-4">
      <canvas
        ref={canvasRef}
        style={{ width: CANVAS_W, height: CANVAS_H }}
        className="mx-auto block"
      />
      <div className="pointer-events-none absolute right-2 bottom-6">
        <div className="rounded-sm border border-[var(--color-fg-4)] bg-[var(--color-bg-0)]/70 px-2 py-1 font-mono text-[10px] leading-relaxed text-[var(--color-fg-1)] backdrop-blur-sm">
          <div>v = ω·R (no slip)</div>
          <div>top: 2v · center: v · bottom: 0</div>
          <div>rim traces a cycloid</div>
        </div>
      </div>
    </div>
  );
}
