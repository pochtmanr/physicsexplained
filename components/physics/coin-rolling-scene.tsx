"use client";

import { useRef } from "react";
import { useAnimationFrame } from "@/lib/animation/use-animation-frame";
import { useThemeColors } from "@/lib/hooks/use-theme-colors";

const CANVAS_W = 360;
const CANVAS_H = 260;
const TABLE_Y = 200;
const ORBIT_R = 90;
const COIN_R = 22;
const TILT = 0.5; // radians from vertical
const PERIOD = 4; // seconds for one orbit

const CYAN = "#6FB8C6";
const MAGENTA = "#FF6ADE";

export function CoinRollingScene() {
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

      const cx = CANVAS_W / 2;
      const cy = TABLE_Y;
      const phi = ((t % PERIOD) / PERIOD) * 2 * Math.PI;

      // Table — ellipse to suggest perspective
      ctx.strokeStyle = colors.fg3;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.ellipse(cx, cy, 140, 30, 0, 0, Math.PI * 2);
      ctx.stroke();

      // Faint trace of coin's path
      ctx.strokeStyle = colors.fg3;
      ctx.setLineDash([2, 4]);
      ctx.beginPath();
      ctx.ellipse(cx, cy, ORBIT_R, ORBIT_R * 0.35, 0, 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);

      // Coin position (perspective ellipse)
      const ox = cx + ORBIT_R * Math.cos(phi);
      const oy = cy + ORBIT_R * 0.35 * Math.sin(phi);

      // Tilt direction lies along the radial outward direction
      const radialAng = phi;
      const radialX = Math.cos(radialAng);
      const radialY = 0.35 * Math.sin(radialAng);
      const norm = Math.hypot(radialX, radialY);
      const ux = radialX / norm;
      const uy = radialY / norm;

      // Draw coin as a tilted ellipse: major axis perpendicular to radial,
      // minor axis along radial * cos(TILT). This fakes a 3D tilted disc cheaply.
      ctx.save();
      ctx.translate(ox, oy - COIN_R * Math.cos(TILT));
      const tangentAng = Math.atan2(-uy, ux) + Math.PI / 2;
      ctx.rotate(tangentAng);
      ctx.fillStyle = MAGENTA + "AA";
      ctx.strokeStyle = MAGENTA;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.ellipse(0, 0, COIN_R, COIN_R * Math.cos(TILT), 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      // Small mark on the coin so spin is visible
      const spinAng = phi * 6; // coin spins faster than it precesses
      ctx.fillStyle = colors.bg0;
      ctx.beginPath();
      ctx.arc(
        COIN_R * 0.5 * Math.cos(spinAng),
        COIN_R * 0.4 * Math.cos(TILT) * Math.sin(spinAng),
        2.5,
        0,
        Math.PI * 2,
      );
      ctx.fill();
      ctx.restore();

      // Center marker
      ctx.fillStyle = colors.fg2;
      ctx.beginPath();
      ctx.arc(cx, cy, 2, 0, Math.PI * 2);
      ctx.fill();

      // Tip-of-coin contact point (where it touches the table)
      ctx.fillStyle = CYAN;
      ctx.beginPath();
      ctx.arc(ox, oy, 3, 0, Math.PI * 2);
      ctx.fill();
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
          <div>tilted coin precessing</div>
          <div>foreshadows: gyroscopes</div>
        </div>
      </div>
    </div>
  );
}
