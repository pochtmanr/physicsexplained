"use client";

import { useEffect, useRef, useState } from "react";
import { useAnimationFrame } from "@/lib/animation/use-animation-frame";
import { useThemeColors } from "@/lib/hooks/use-theme-colors";
import { dielectricRefraction } from "@/lib/physics/electromagnetism/boundary-conditions";

const RATIO = 0.62;
const MAX_HEIGHT = 380;

/**
 * A single field line crosses an interface between two dielectrics. The angle
 * the line makes with the surface normal obeys the static analogue of Snell's
 * law:
 *
 *     tan θ₂ / tan θ₁ = κ₂ / κ₁
 *
 * Going into a denser dielectric (κ₂ > κ₁) bends the line further from the
 * normal. The wave-optics version (Fresnel) is the OPPOSITE — light bends
 * toward the normal in a denser medium — which is why static and dynamic E
 * are different conversations even though they share the same equations on
 * paper.
 *
 * Sliders: incidence angle θ₁, κ₁ (above), κ₂ (below).
 */
export function DielectricRefractionScene() {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const colors = useThemeColors();
  const [theta1deg, setTheta1deg] = useState(35);
  const [kappa1, setKappa1] = useState(1);
  const [kappa2, setKappa2] = useState(4);
  const [size, setSize] = useState({ width: 640, height: 380 });

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
    onFrame: () => {
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

      const interfaceY = height * 0.5;
      const cx = width / 2;

      const theta1 = (theta1deg * Math.PI) / 180;
      const theta2 = dielectricRefraction(theta1, kappa1, kappa2);
      const theta2deg = (theta2 * 180) / Math.PI;

      // ---- backgrounds ----
      ctx.fillStyle = "rgba(255, 106, 222, 0.04)";
      ctx.fillRect(0, 0, width, interfaceY);
      ctx.fillStyle = "rgba(111, 184, 198, 0.05)";
      ctx.fillRect(0, interfaceY, width, height - interfaceY);

      // ---- interface line ----
      ctx.strokeStyle = colors.fg2;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(20, interfaceY);
      ctx.lineTo(width - 20, interfaceY);
      ctx.stroke();

      // Surface normal at the centre — long dashed vertical
      ctx.save();
      ctx.setLineDash([4, 5]);
      ctx.strokeStyle = colors.fg3;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(cx, interfaceY - 130);
      ctx.lineTo(cx, interfaceY + 130);
      ctx.stroke();
      ctx.restore();

      // ---- the field line ----
      // Incoming (above): from upper-left to (cx, interfaceY), making angle θ₁
      // with the downward normal. So direction (sin θ₁, +cos θ₁), and the
      // far end sits at distance L back along (-sin θ₁, -cos θ₁).
      const Lin = 130; // px
      const inX = cx - Lin * Math.sin(theta1);
      const inY = interfaceY - Lin * Math.cos(theta1);

      // Refracted (below): from (cx, interfaceY) into lower region at θ₂.
      const Lout = 130;
      const outX = cx + Lout * Math.sin(theta2);
      const outY = interfaceY + Lout * Math.cos(theta2);

      // Incoming line — magenta, with arrow at the interface
      ctx.strokeStyle = "#FF6ADE";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(inX, inY);
      ctx.lineTo(cx, interfaceY);
      ctx.stroke();
      drawArrowHead(ctx, inX, inY, cx, interfaceY, "#FF6ADE", 7);

      // Outgoing line — amber resultant
      ctx.strokeStyle = "#FFD66B";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(cx, interfaceY);
      ctx.lineTo(outX, outY);
      ctx.stroke();
      drawArrowHead(ctx, cx, interfaceY, outX, outY, "#FFD66B", 7);

      // ---- angle arcs ----
      const arcR = 32;
      // θ₁ arc: between the upward normal (0, -1) and the back-direction of
      // the incoming line which is (-sin θ₁, -cos θ₁).
      ctx.strokeStyle = "#FF6ADE";
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      // canvas angles: -π/2 is straight up. θ₁ arc swings from -π/2 by -theta1
      // (counter-clockwise toward upper-left).
      ctx.arc(cx, interfaceY, arcR, -Math.PI / 2 - theta1, -Math.PI / 2);
      ctx.stroke();

      // θ₂ arc: between downward normal (+π/2 in canvas) and outgoing
      // direction (sin θ₂, cos θ₂), which is at angle (π/2 - θ₂) from +x.
      ctx.strokeStyle = "#FFD66B";
      ctx.beginPath();
      ctx.arc(cx, interfaceY, arcR, Math.PI / 2 - theta2, Math.PI / 2);
      ctx.stroke();

      // angle labels
      ctx.fillStyle = "#FF6ADE";
      ctx.font = "11px monospace";
      ctx.textAlign = "left";
      ctx.fillText(
        `θ₁ = ${theta1deg.toFixed(1)}°`,
        cx - 60,
        interfaceY - 8,
      );
      ctx.fillStyle = "#FFD66B";
      ctx.fillText(
        `θ₂ = ${theta2deg.toFixed(1)}°`,
        cx + 18,
        interfaceY + 16,
      );

      // medium labels
      ctx.fillStyle = colors.fg1;
      ctx.font = "11px monospace";
      ctx.textAlign = "left";
      ctx.fillText(`κ₁ = ${kappa1.toFixed(2)}`, 14, 18);
      ctx.fillText(`κ₂ = ${kappa2.toFixed(2)}`, 14, height - 12);

      // HUD with the Snell-static ratio
      ctx.fillStyle = colors.fg1;
      ctx.font = "12px monospace";
      ctx.textAlign = "right";
      const ratio =
        Math.abs(Math.tan(theta1)) > 1e-9
          ? Math.tan(theta2) / Math.tan(theta1)
          : NaN;
      ctx.fillText(
        `tan θ₂ / tan θ₁ = ${isFinite(ratio) ? ratio.toFixed(3) : "—"}`,
        width - 14,
        18,
      );
      ctx.fillText(
        `κ₂ / κ₁         = ${(kappa2 / kappa1).toFixed(3)}`,
        width - 14,
        34,
      );

      // Pedagogical note
      ctx.fillStyle = colors.fg1;
      ctx.font = "10px monospace";
      ctx.textAlign = "right";
      const trend =
        kappa2 > kappa1
          ? "denser → lines bend AWAY from normal"
          : kappa2 < kappa1
            ? "thinner → lines bend TOWARD normal"
            : "equal κ → no bending";
      ctx.fillText(trend, width - 14, height - 12);
    },
  });

  return (
    <div ref={containerRef} className="w-full pb-4">
      <canvas
        ref={canvasRef}
        style={{ width: size.width, height: size.height }}
        className="block"
      />
      <div className="mt-3 flex flex-col gap-3 px-2 font-mono text-xs">
        <div className="flex items-center gap-3">
          <label className="w-16 text-[var(--color-fg-3)]">θ₁</label>
          <input
            type="range"
            min={0}
            max={80}
            step={1}
            value={theta1deg}
            onChange={(e) => setTheta1deg(parseFloat(e.target.value))}
            className="flex-1 accent-[#FF6ADE]"
          />
          <span className="w-16 text-right text-[var(--color-fg-1)]">
            {theta1deg.toFixed(0)}°
          </span>
        </div>
        <div className="flex items-center gap-3">
          <label className="w-16 text-[var(--color-fg-3)]">κ₁ (top)</label>
          <input
            type="range"
            min={1}
            max={10}
            step={0.1}
            value={kappa1}
            onChange={(e) => setKappa1(parseFloat(e.target.value))}
            className="flex-1 accent-[#FF6ADE]"
          />
          <span className="w-16 text-right text-[var(--color-fg-1)]">
            {kappa1.toFixed(2)}
          </span>
        </div>
        <div className="flex items-center gap-3">
          <label className="w-16 text-[var(--color-fg-3)]">κ₂ (bot)</label>
          <input
            type="range"
            min={1}
            max={10}
            step={0.1}
            value={kappa2}
            onChange={(e) => setKappa2(parseFloat(e.target.value))}
            className="flex-1 accent-[#6FB8C6]"
          />
          <span className="w-16 text-right text-[var(--color-fg-1)]">
            {kappa2.toFixed(2)}
          </span>
        </div>
      </div>
    </div>
  );
}

function drawArrowHead(
  ctx: CanvasRenderingContext2D,
  x0: number,
  y0: number,
  x1: number,
  y1: number,
  color: string,
  size: number,
) {
  const dx = x1 - x0;
  const dy = y1 - y0;
  const len = Math.hypot(dx, dy);
  if (len < 0.5) return;
  const ux = dx / len;
  const uy = dy / len;
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x1 - ux * size - uy * size * 0.55, y1 - uy * size + ux * size * 0.55);
  ctx.lineTo(x1 - ux * size + uy * size * 0.55, y1 - uy * size - ux * size * 0.55);
  ctx.closePath();
  ctx.fill();
}
