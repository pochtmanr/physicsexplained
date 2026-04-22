"use client";

import { useRef, useState } from "react";
import { useAnimationFrame } from "@/lib/animation/use-animation-frame";
import { useThemeColors } from "@/lib/hooks/use-theme-colors";
import { centripetalAccel } from "@/lib/physics/circular-motion";

const CANVAS_W = 480;
const CANVAS_H = 360;
const ROW_H = CANVAS_H / 3;
const PIVOT_R = 80; // shared circular-path radius (px) for all rows

const CYAN = "#6FB8C6";
const MAGENTA = "#FF6ADE";

// Shared physical parameters — the three sources differ only in name.
const M = 1.0; // kg
const V = 2.5; // m/s
const R = 1.0; // m
const PERIOD = 3.0; // animation seconds per lap

function arrow(
  ctx: CanvasRenderingContext2D,
  x0: number,
  y0: number,
  x1: number,
  y1: number,
  color: string,
  width = 1.5,
  head = 6,
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

function drawRow(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  theta: number,
  fg2: string,
  fg3: string,
  centerLabel: string,
  forceLabel: string,
  bodyKind: "ball" | "earth" | "car",
) {
  // Path circle
  ctx.strokeStyle = fg3;
  ctx.lineWidth = 1;
  ctx.setLineDash([2, 3]);
  ctx.beginPath();
  ctx.arc(cx, cy, PIVOT_R, 0, Math.PI * 2);
  ctx.stroke();
  ctx.setLineDash([]);

  // Centre point and label
  ctx.fillStyle = fg2;
  ctx.beginPath();
  ctx.arc(cx, cy, 3, 0, Math.PI * 2);
  ctx.fill();
  ctx.font = "10px monospace";
  ctx.textAlign = "left";
  ctx.fillText(centerLabel, cx + 6, cy + 3);

  // Body position
  const bx = cx + PIVOT_R * Math.cos(theta);
  const by = cy + PIVOT_R * Math.sin(theta);

  // Force arrow (always points from body toward centre)
  arrow(ctx, bx, by, cx + (bx - cx) * 0.15, cy + (by - cy) * 0.15, MAGENTA, 1.8);
  ctx.fillStyle = MAGENTA;
  ctx.font = "11px monospace";
  ctx.textAlign = "left";
  // Place force-label near the midpoint of the arrow
  ctx.fillText(forceLabel, (bx + cx) / 2 + 6, (by + cy) / 2 - 4);

  // Body
  if (bodyKind === "ball") {
    // Solid cyan disc on a string (the string is the force-arrow line)
    ctx.fillStyle = CYAN;
    ctx.shadowColor = "rgba(111,184,198,0.5)";
    ctx.shadowBlur = 8;
    ctx.beginPath();
    ctx.arc(bx, by, 8, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;
  } else if (bodyKind === "earth") {
    // Sun in centre is already the dot above; draw Earth as a small cyan disc
    ctx.fillStyle = "#E4C27A"; // give the centre a sun-like fill on top of fg2 dot
    ctx.beginPath();
    ctx.arc(cx, cy, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = CYAN;
    ctx.shadowColor = "rgba(111,184,198,0.5)";
    ctx.shadowBlur = 8;
    ctx.beginPath();
    ctx.arc(bx, by, 6, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;
  } else {
    // Car: small rotated rectangle whose long axis is tangent to the path
    const tanAng = Math.atan2(by - cy, bx - cx) + Math.PI / 2;
    ctx.save();
    ctx.translate(bx, by);
    ctx.rotate(tanAng);
    ctx.fillStyle = CYAN;
    ctx.shadowColor = "rgba(111,184,198,0.5)";
    ctx.shadowBlur = 8;
    ctx.fillRect(-12, -5, 24, 10);
    ctx.shadowBlur = 0;
    ctx.restore();
  }
}

export function CentripetalForceScene() {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const colors = useThemeColors();
  const [F] = useState(centripetalAccel(V, R) * M);

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

      const theta = ((t % PERIOD) / PERIOD) * 2 * Math.PI;

      // Row 1: ball on string (pivot at centre)
      const cx = CANVAS_W / 2;
      drawRow(
        ctx,
        cx,
        ROW_H * 0.5,
        theta,
        colors.fg2,
        colors.fg3,
        "pivot",
        "T",
        "ball",
      );

      // Row 2: Earth orbiting Sun
      drawRow(
        ctx,
        cx,
        ROW_H * 1.5,
        theta,
        colors.fg2,
        colors.fg3,
        "Sun",
        "F_g",
        "earth",
      );

      // Row 3: Car on banked curve
      drawRow(
        ctx,
        cx,
        ROW_H * 2.5,
        theta,
        colors.fg2,
        colors.fg3,
        "axis",
        "f_s",
        "car",
      );

      // Row separators
      ctx.strokeStyle = colors.fg3;
      ctx.lineWidth = 1;
      for (let i = 1; i < 3; i++) {
        ctx.beginPath();
        ctx.moveTo(8, ROW_H * i);
        ctx.lineTo(CANVAS_W - 8, ROW_H * i);
        ctx.stroke();
      }

      // Row labels (left side)
      ctx.fillStyle = colors.fg1;
      ctx.font = "11px monospace";
      ctx.textAlign = "left";
      ctx.fillText("ball + string", 12, 16);
      ctx.fillText("Earth + Sun", 12, ROW_H + 16);
      ctx.fillText("car + road", 12, 2 * ROW_H + 16);
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
          <div>m = {M.toFixed(1)} kg · v = {V.toFixed(1)} m/s · r = {R.toFixed(1)} m</div>
          <div>
            F = m·v²/r = <span style={{ color: MAGENTA }}>{F.toFixed(2)}</span> N
          </div>
          <div className="text-[var(--color-fg-3)]">
            T = F_g = f_s — same force, different name
          </div>
        </div>
      </div>
    </div>
  );
}
