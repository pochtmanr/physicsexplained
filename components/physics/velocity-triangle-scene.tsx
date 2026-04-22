"use client";

import { useRef, useState } from "react";
import { useAnimationFrame } from "@/lib/animation/use-animation-frame";
import { useThemeColors } from "@/lib/hooks/use-theme-colors";
import { centripetalAccel } from "@/lib/physics/circular-motion";

const CANVAS_W = 320;
const CANVAS_H = 320;
const RADIUS = 110;
const PARTICLE_R = 7;
const V_LEN = 80; // pixel length used for the |v| arrow on screen
const V_PHYS = 1.5; // physical "speed" used in the readout (m/s, illustrative)
const R_PHYS = 1.0; // physical "radius" (m)
const PERIOD = 4; // seconds for one full lap
const DTHETA = 0.45; // angular separation between v and v + dv (radians, large for clarity)

const CYAN = "#6FB8C6";
const MAGENTA = "#FF6ADE";

function arrow(
  ctx: CanvasRenderingContext2D,
  x0: number,
  y0: number,
  x1: number,
  y1: number,
  color: string,
  width = 2,
  head = 8,
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

export function VelocityTriangleScene() {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const colors = useThemeColors();
  const [readout, setReadout] = useState({
    v: V_PHYS,
    dv: 0,
    ac: centripetalAccel(V_PHYS, R_PHYS),
  });

  useAnimationFrame({
    elementRef: containerRef,
    onFrame: (t) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      const dpr = window.devicePixelRatio || 1;
      if (
        canvas.width !== CANVAS_W * dpr ||
        canvas.height !== CANVAS_H * dpr
      ) {
        canvas.width = CANVAS_W * dpr;
        canvas.height = CANVAS_H * dpr;
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      }

      const cx = CANVAS_W / 2;
      const cy = CANVAS_H / 2;

      // Angle of the particle on the circle, advancing once per PERIOD seconds
      const theta = ((t % PERIOD) / PERIOD) * 2 * Math.PI;
      // Particle position
      const px = cx + RADIUS * Math.cos(theta);
      const py = cy + RADIUS * Math.sin(theta);

      // Tangent direction at theta (perpendicular to radius, going CCW)
      // r̂ = (cos θ, sin θ)  ⇒  t̂ = (-sin θ, cos θ)
      const tx = -Math.sin(theta);
      const ty = Math.cos(theta);
      // Tangent at theta + dθ
      const tx2 = -Math.sin(theta + DTHETA);
      const ty2 = Math.cos(theta + DTHETA);

      ctx.clearRect(0, 0, CANVAS_W, CANVAS_H);

      // Circle (path)
      ctx.strokeStyle = colors.fg3;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(cx, cy, RADIUS, 0, Math.PI * 2);
      ctx.stroke();

      // Center dot
      ctx.fillStyle = colors.fg2;
      ctx.beginPath();
      ctx.arc(cx, cy, 2, 0, Math.PI * 2);
      ctx.fill();

      // Radius line from centre to particle
      ctx.strokeStyle = colors.fg3;
      ctx.setLineDash([3, 3]);
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(px, py);
      ctx.stroke();
      ctx.setLineDash([]);

      // v vector (cyan) — tangent at the particle
      arrow(ctx, px, py, px + V_LEN * tx, py + V_LEN * ty, CYAN, 2);
      ctx.fillStyle = CYAN;
      ctx.font = "11px monospace";
      ctx.textAlign = "left";
      ctx.fillText("v", px + V_LEN * tx + 6, py + V_LEN * ty + 4);

      // v + dv vector (cyan, dashed) — drawn from same tail to show rotation
      ctx.setLineDash([4, 3]);
      arrow(
        ctx,
        px,
        py,
        px + V_LEN * tx2,
        py + V_LEN * ty2,
        CYAN,
        1.5,
      );
      ctx.setLineDash([]);
      ctx.fillStyle = CYAN;
      ctx.fillText(
        "v+dv",
        px + V_LEN * tx2 + 6,
        py + V_LEN * ty2 + 4,
      );

      // dv vector (magenta) — closes the triangle from tip of v to tip of v+dv
      const tipVx = px + V_LEN * tx;
      const tipVy = py + V_LEN * ty;
      const tipV2x = px + V_LEN * tx2;
      const tipV2y = py + V_LEN * ty2;
      arrow(ctx, tipVx, tipVy, tipV2x, tipV2y, MAGENTA, 2, 7);
      ctx.fillStyle = MAGENTA;
      ctx.fillText(
        "dv",
        (tipVx + tipV2x) / 2 + 6,
        (tipVy + tipV2y) / 2 - 4,
      );

      // Particle dot (drawn last, sits on top of arrow tails)
      ctx.shadowColor = "rgba(111, 184, 198, 0.55)";
      ctx.shadowBlur = 10;
      ctx.fillStyle = CYAN;
      ctx.beginPath();
      ctx.arc(px, py, PARTICLE_R, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;

      // Update readout (cheap; React batches)
      const dvMag = V_PHYS * DTHETA;
      setReadout((prev) =>
        Math.abs(prev.dv - dvMag) < 1e-9
          ? prev
          : { v: V_PHYS, dv: dvMag, ac: centripetalAccel(V_PHYS, R_PHYS) },
      );
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
          <div>|v| = {readout.v.toFixed(2)} m/s (constant)</div>
          <div>
            |dv| = v·dθ = <span style={{ color: MAGENTA }}>{readout.dv.toFixed(2)}</span> m/s
          </div>
          <div>a_c = v²/r = {readout.ac.toFixed(2)} m/s²</div>
        </div>
      </div>
    </div>
  );
}
