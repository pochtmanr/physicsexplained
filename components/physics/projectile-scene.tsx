"use client";

import { useEffect, useRef, useState } from "react";
import { useAnimationFrame } from "@/lib/animation/use-animation-frame";
import { useThemeColors } from "@/lib/hooks/use-theme-colors";
import {
  G_EARTH,
  peakHeight,
  position,
  range,
  timeOfFlight,
  trajectory,
  velocity,
} from "@/lib/physics/projectile";

const RATIO = 0.62;
const MAX_HEIGHT = 460;
const ACCENT = "#5BE9FF";

export function ProjectileScene() {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const colors = useThemeColors();
  const [angleDeg, setAngleDeg] = useState(45);
  const [speed, setSpeed] = useState(18);
  const [size, setSize] = useState({ width: 640, height: 400 });
  const startRef = useRef<number | null>(null);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const w = entry.contentRect.width;
        if (w > 0) {
          setSize({ width: w, height: Math.min(w * RATIO, MAX_HEIGHT) });
        }
      }
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // Reset animation when controls change
  useEffect(() => {
    startRef.current = null;
  }, [angleDeg, speed]);

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

      const angle = (angleDeg * Math.PI) / 180;
      const tFlight = timeOfFlight(speed, angle);
      const R = range(speed, angle);
      const H = peakHeight(speed, angle);

      // Loop the animation with a short pause between shots
      const loopLen = Math.max(tFlight + 0.7, 1.2);
      if (startRef.current === null) startRef.current = t;
      let tLocal = t - startRef.current;
      if (tLocal > loopLen) {
        startRef.current = t;
        tLocal = 0;
      }
      const tSim = Math.min(tLocal, tFlight);

      ctx.clearRect(0, 0, width, height);

      // Layout: plot area on the left, readout column on the right
      const panelW = Math.min(Math.max(width * 0.3, 150), 220);
      const padL = 40;
      const padR = panelW + 18;
      const padT = 18;
      const padB = 36;
      const plotW = width - padL - padR;
      const plotH = height - padT - padB;

      // World bounds: pad around R and H so the arc is visible
      const worldXMax = Math.max(R * 1.05, 4);
      const worldYMax = Math.max(H * 1.25, 2);
      // Keep the ground at the bottom of the plot
      const toPx = (x: number, y: number) => ({
        px: padL + (x / worldXMax) * plotW,
        py: padT + plotH - (y / worldYMax) * plotH,
      });

      // Background grid (faint)
      ctx.strokeStyle = colors.fg3;
      ctx.lineWidth = 1;
      ctx.setLineDash([2, 4]);
      const nX = 5;
      for (let i = 1; i < nX; i++) {
        const gx = padL + (i / nX) * plotW;
        ctx.beginPath();
        ctx.moveTo(gx, padT);
        ctx.lineTo(gx, padT + plotH);
        ctx.stroke();
      }
      const nY = 4;
      for (let i = 1; i < nY; i++) {
        const gy = padT + (i / nY) * plotH;
        ctx.beginPath();
        ctx.moveTo(padL, gy);
        ctx.lineTo(padL + plotW, gy);
        ctx.stroke();
      }
      ctx.setLineDash([]);

      // Axes
      ctx.strokeStyle = colors.fg2;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(padL, padT);
      ctx.lineTo(padL, padT + plotH);
      ctx.lineTo(padL + plotW, padT + plotH);
      ctx.stroke();

      // Trajectory path
      const path = trajectory(speed, angle, 80);
      ctx.strokeStyle = colors.fg1;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      for (let i = 0; i < path.length; i++) {
        const { px, py } = toPx(path[i].x, path[i].y);
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.stroke();

      // Launch vector (angle+speed) arrow at origin
      const originPx = toPx(0, 0);
      const launchLen = Math.min(0.18 * plotH, 70);
      const arrowX = originPx.px + launchLen * Math.cos(angle);
      const arrowY = originPx.py - launchLen * Math.sin(angle);
      drawArrow(ctx, originPx.px, originPx.py, arrowX, arrowY, ACCENT, 2);

      // Ball + velocity decomposition
      const pos = position(tSim, speed, angle);
      const vel = velocity(tSim, speed, angle);
      const ballPx = toPx(pos.x, pos.y);

      // Velocity-component arrows (normalized in pixel space)
      const vMax = Math.max(speed, 0.1);
      const vLen = Math.min(0.14 * plotH, 60);
      const vxArrowEnd = {
        px: ballPx.px + (vel.x / vMax) * vLen,
        py: ballPx.py,
      };
      // vy positive = up on screen = −py
      const vyArrowEnd = {
        px: ballPx.px,
        py: ballPx.py - (vel.y / vMax) * vLen,
      };
      drawArrow(
        ctx,
        ballPx.px,
        ballPx.py,
        vxArrowEnd.px,
        vxArrowEnd.py,
        "#8EE8A3",
        1.5,
      );
      drawArrow(
        ctx,
        ballPx.px,
        ballPx.py,
        vyArrowEnd.px,
        vyArrowEnd.py,
        "#E29FFF",
        1.5,
      );

      // Ball
      ctx.shadowColor = "rgba(91, 233, 255, 0.5)";
      ctx.shadowBlur = 10;
      ctx.fillStyle = ACCENT;
      ctx.beginPath();
      ctx.arc(ballPx.px, ballPx.py, 6, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;

      // Axis labels
      ctx.fillStyle = colors.fg2;
      ctx.font = "11px monospace";
      ctx.textAlign = "left";
      ctx.fillText("y (m)", padL - 34, padT + 10);
      ctx.textAlign = "right";
      ctx.fillText("x (m)", padL + plotW, padT + plotH + 18);

      // X ticks — 0, R/2, R
      ctx.textAlign = "center";
      const ticks = [0, R / 2, R];
      for (const tx of ticks) {
        const { px } = toPx(tx, 0);
        ctx.fillText(tx.toFixed(1), px, padT + plotH + 18);
      }
      // Y tick — H
      if (H > 0) {
        const { py } = toPx(0, H);
        ctx.textAlign = "right";
        ctx.fillText(H.toFixed(1), padL - 4, py + 4);
      }

      // ==== Right-side readout panel ====
      const panelX = padL + plotW + 14;
      let row = padT + 6;
      const rowH = 18;
      ctx.textAlign = "left";
      ctx.font = "11px monospace";

      ctx.fillStyle = colors.fg2;
      ctx.fillText("HORIZONTAL", panelX, row);
      row += rowH;
      ctx.fillStyle = colors.fg1;
      ctx.fillText(`vₓ = v·cosθ`, panelX, row);
      row += rowH;
      ctx.fillStyle = "#8EE8A3";
      ctx.fillText(`    = ${vel.x.toFixed(2)} m/s`, panelX, row);
      row += rowH;
      ctx.fillStyle = colors.fg2;
      ctx.fillText("(constant)", panelX, row);
      row += rowH + 6;

      ctx.fillStyle = colors.fg2;
      ctx.fillText("VERTICAL", panelX, row);
      row += rowH;
      ctx.fillStyle = colors.fg1;
      ctx.fillText(`v_y = v·sinθ − g·t`, panelX, row);
      row += rowH;
      ctx.fillStyle = "#E29FFF";
      ctx.fillText(`    = ${vel.y.toFixed(2)} m/s`, panelX, row);
      row += rowH + 6;

      ctx.fillStyle = colors.fg2;
      ctx.fillText("READOUTS", panelX, row);
      row += rowH;
      ctx.fillStyle = colors.fg1;
      ctx.fillText(`range   ${R.toFixed(2)} m`, panelX, row);
      row += rowH;
      ctx.fillText(`peak    ${H.toFixed(2)} m`, panelX, row);
      row += rowH;
      ctx.fillText(`T_flight ${tFlight.toFixed(2)} s`, panelX, row);
      row += rowH;
      ctx.fillText(`t        ${tSim.toFixed(2)} s`, panelX, row);
      row += rowH + 6;

      ctx.fillStyle = colors.fg2;
      ctx.fillText(`g = ${G_EARTH.toFixed(2)} m/s²`, panelX, row);
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
            angle θ
          </label>
          <input
            type="range"
            min={0}
            max={90}
            step={1}
            value={angleDeg}
            onChange={(e) => setAngleDeg(parseFloat(e.target.value))}
            className="flex-1 accent-[#5BE9FF]"
          />
          <span className="w-20 text-right text-sm font-mono text-[var(--color-fg-1)]">
            {angleDeg.toFixed(0)}°
          </span>
        </div>
        <div className="flex items-center gap-3">
          <label className="w-20 text-sm text-[var(--color-fg-3)]">
            speed v
          </label>
          <input
            type="range"
            min={5}
            max={30}
            step={0.1}
            value={speed}
            onChange={(e) => setSpeed(parseFloat(e.target.value))}
            className="flex-1 accent-[#5BE9FF]"
          />
          <span className="w-20 text-right text-sm font-mono text-[var(--color-fg-1)]">
            {speed.toFixed(1)} m/s
          </span>
        </div>
      </div>
    </div>
  );
}

function drawArrow(
  ctx: CanvasRenderingContext2D,
  x0: number,
  y0: number,
  x1: number,
  y1: number,
  color: string,
  width: number,
) {
  const dx = x1 - x0;
  const dy = y1 - y0;
  const len = Math.hypot(dx, dy);
  if (len < 0.5) return;
  const ux = dx / len;
  const uy = dy / len;
  const head = Math.min(9, Math.max(4, len * 0.25));

  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineWidth = width;
  ctx.beginPath();
  ctx.moveTo(x0, y0);
  ctx.lineTo(x1 - ux * head, y1 - uy * head);
  ctx.stroke();

  // arrow head
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x1 - ux * head - uy * head * 0.55, y1 - uy * head + ux * head * 0.55);
  ctx.lineTo(x1 - ux * head + uy * head * 0.55, y1 - uy * head - ux * head * 0.55);
  ctx.closePath();
  ctx.fill();
}
