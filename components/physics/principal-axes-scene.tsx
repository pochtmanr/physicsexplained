"use client";

import { useEffect, useRef, useState } from "react";
import { useAnimationFrame } from "@/lib/animation/use-animation-frame";
import { useThemeColors } from "@/lib/hooks/use-theme-colors";

const RATIO = 0.55;
const MAX_HEIGHT = 340;

/**
 * An inertia ellipsoid with its three principal axes, labeled I₁, I₂, I₃.
 * Spins slowly so all three axes are visible in turn. The ellipsoid's
 * semi-axes are inversely scaled by √I — the longest direction on screen
 * is the axis of smallest moment of inertia.
 */
export function PrincipalAxesScene() {
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

      const cx = width / 2;
      const cy = height / 2;
      const a = 110, b = 70, c = 50; // semi-axes of the inertia ellipsoid

      // Very simple 3D rotation projected onto the XY plane
      const yaw = t * 0.35;
      const pitch = Math.sin(t * 0.5) * 0.5 + 0.3;
      const cos = Math.cos, sin = Math.sin;

      const project = (x: number, y: number, z: number) => {
        // yaw about Y
        const x1 = x * cos(yaw) + z * sin(yaw);
        const z1 = -x * sin(yaw) + z * cos(yaw);
        const y1 = y;
        // pitch about X
        const y2 = y1 * cos(pitch) - z1 * sin(pitch);
        const z2 = y1 * sin(pitch) + z1 * cos(pitch);
        const x2 = x1;
        // orthographic projection
        return { sx: cx + x2, sy: cy - y2, z: z2 };
      };

      // Draw the ellipsoid as several silhouette ellipses stacked in z
      ctx.strokeStyle = colors.fg3;
      ctx.lineWidth = 1;
      for (let i = -6; i <= 6; i++) {
        const u = i / 6;
        const rScale = Math.sqrt(1 - u * u);
        // Parametrise a ring at height y = u·b
        ctx.beginPath();
        for (let j = 0; j <= 60; j++) {
          const th = (j / 60) * Math.PI * 2;
          const p = project(a * rScale * cos(th), b * u, c * rScale * sin(th));
          if (j === 0) ctx.moveTo(p.sx, p.sy);
          else ctx.lineTo(p.sx, p.sy);
        }
        ctx.stroke();
      }

      // Draw principal axes
      const axes: Array<[number, number, number, string, string]> = [
        [a, 0, 0, "I₁", colors.magenta],
        [0, b, 0, "I₂", colors.fg0],
        [0, 0, c, "I₃", colors.fg1],
      ];
      ctx.lineWidth = 2;
      for (const [x, y, z, label, col] of axes) {
        const p1 = project(-x, -y, -z);
        const p2 = project(x, y, z);
        ctx.strokeStyle = col;
        ctx.beginPath();
        ctx.moveTo(p1.sx, p1.sy);
        ctx.lineTo(p2.sx, p2.sy);
        ctx.stroke();
        ctx.fillStyle = col;
        ctx.beginPath();
        ctx.arc(p2.sx, p2.sy, 4, 0, Math.PI * 2);
        ctx.fill();
        ctx.font = "11px monospace";
        ctx.textAlign = "center";
        ctx.fillText(label, p2.sx + 10, p2.sy - 8);
      }

      // Caption
      ctx.font = "12px monospace";
      ctx.fillStyle = colors.fg1;
      ctx.textAlign = "center";
      ctx.fillText("three orthogonal axes diagonalise the inertia tensor", width / 2, height - 18);
    },
  });

  return (
    <div ref={containerRef} className="w-full pb-4">
      <canvas ref={canvasRef} style={{ width: size.width, height: size.height }} className="block" />
    </div>
  );
}
