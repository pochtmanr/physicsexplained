"use client";

import { useEffect, useRef, useState } from "react";
import { useAnimationFrame } from "@/lib/animation/use-animation-frame";
import { useThemeColors } from "@/lib/hooks/use-theme-colors";

const RATIO = 0.6;
const MAX_HEIGHT = 360;

/**
 * Body frame (x', y', z') pivots out of the world frame (x, y, z) in
 * three successive rotations: precession φ (about world z), nutation θ
 * (tilt), spin ψ (about body z'). The three angles morph in a loop to
 * show each one in isolation and their composition.
 */
export function EulerAnglesScene() {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const colors = useThemeColors();
  const [size, setSize] = useState({ width: 640, height: 360 });

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
      const cy = height * 0.58;
      const R = Math.min(width, height) * 0.32;

      // Cycle through ψ, θ, φ
      const phi = t * 0.6;              // precession
      const theta = 0.4 + 0.25 * Math.sin(t * 0.5); // nutation
      const psi = t * 1.4;              // spin

      const cos = Math.cos, sin = Math.sin;

      // Project 3D point in body frame to 2D after applying φ, θ, ψ and a fixed isometric view.
      const project = (x: number, y: number, z: number, applyBody = true) => {
        if (applyBody) {
          // ψ about body z' (pre-rotation in body frame)
          const x1 = x * cos(psi) - y * sin(psi);
          const y1 = x * sin(psi) + y * cos(psi);
          const z1 = z;
          // θ about line of nodes (world x axis after φ)
          // we apply θ about x first, then φ about z
          const y2 = y1 * cos(theta) - z1 * sin(theta);
          const z2 = y1 * sin(theta) + z1 * cos(theta);
          const x2 = x1;
          // φ about world z
          const x3 = x2 * cos(phi) - y2 * sin(phi);
          const y3 = x2 * sin(phi) + y2 * cos(phi);
          const z3 = z2;
          // isometric view tilt (rotate about x for perspective)
          const tiltPitch = 0.45;
          const y4 = y3 * cos(tiltPitch) - z3 * sin(tiltPitch);
          const z4 = y3 * sin(tiltPitch) + z3 * cos(tiltPitch);
          return { sx: cx + x3, sy: cy - y4, z: z4 };
        }
        const tiltPitch = 0.45;
        const yw = y * cos(tiltPitch) - z * sin(tiltPitch);
        return { sx: cx + x, sy: cy - yw, z };
      };

      const drawAxis = (p: { sx: number; sy: number }, pEnd: { sx: number; sy: number }, col: string, label: string) => {
        ctx.strokeStyle = col;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(p.sx, p.sy);
        ctx.lineTo(pEnd.sx, pEnd.sy);
        ctx.stroke();
        ctx.fillStyle = col;
        ctx.beginPath();
        ctx.arc(pEnd.sx, pEnd.sy, 3, 0, Math.PI * 2);
        ctx.fill();
        ctx.font = "11px monospace";
        ctx.fillText(label, pEnd.sx + 6, pEnd.sy - 4);
      };

      // World axes (space frame)
      const o = project(0, 0, 0, false);
      drawAxis(o, project(R, 0, 0, false), colors.fg3, "x");
      drawAxis(o, project(0, R, 0, false), colors.fg3, "y");
      drawAxis(o, project(0, 0, R, false), colors.fg3, "z");

      // Body axes (rotated)
      drawAxis(o, project(R, 0, 0, true), colors.magenta, "x'");
      drawAxis(o, project(0, R, 0, true), colors.fg0, "y'");
      drawAxis(o, project(0, 0, R, true), colors.fg1, "z'");

      // Equatorial disk (shows nutation tilt)
      ctx.strokeStyle = colors.fg3;
      ctx.setLineDash([3, 4]);
      ctx.beginPath();
      for (let i = 0; i <= 60; i++) {
        const a = (i / 60) * Math.PI * 2;
        const p = project(R * 0.7 * cos(a), R * 0.7 * sin(a), 0, true);
        if (i === 0) ctx.moveTo(p.sx, p.sy);
        else ctx.lineTo(p.sx, p.sy);
      }
      ctx.stroke();
      ctx.setLineDash([]);

      // Labels — φ θ ψ in corners with current values
      ctx.font = "12px monospace";
      ctx.fillStyle = colors.fg2;
      ctx.textAlign = "left";
      ctx.fillText(`φ (precession) = ${phi.toFixed(2)}`, 16, 24);
      ctx.fillText(`θ (nutation)   = ${theta.toFixed(2)}`, 16, 42);
      ctx.fillText(`ψ (spin)       = ${psi.toFixed(2)}`, 16, 60);
    },
  });

  return (
    <div ref={containerRef} className="w-full pb-4">
      <canvas ref={canvasRef} style={{ width: size.width, height: size.height }} className="block" />
    </div>
  );
}
