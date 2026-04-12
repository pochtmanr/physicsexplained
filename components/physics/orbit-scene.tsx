"use client";

import { useRef } from "react";
import { orbitPosition } from "@/lib/physics/kepler";
import { useAnimationFrame } from "@/lib/animation/use-animation-frame";

export interface OrbitSceneProps {
  /** Semi-major axis in display units */
  a: number;
  /** Eccentricity [0, 1) */
  e: number;
  /** Orbital period in seconds of wall time (display period, not physical) */
  T: number;
  width?: number;
  height?: number;
  onState?: (state: { t: number; r: number; theta: number }) => void;
}

export function OrbitScene({
  a,
  e,
  T,
  width = 600,
  height = 400,
  onState,
}: OrbitSceneProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const trailRef = useRef<Array<{ x: number; y: number; age: number }>>([]);

  useAnimationFrame({
    elementRef: containerRef,
    onFrame: (t, dt) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      const dpr = window.devicePixelRatio || 1;
      if (canvas.width !== width * dpr || canvas.height !== height * dpr) {
        canvas.width = width * dpr;
        canvas.height = height * dpr;
        ctx.scale(dpr, dpr);
      }

      const p = orbitPosition({ t, a, e, T });

      // Map simulation coordinates to canvas coordinates.
      // Center of ellipse sits at (-a*e, 0) in sim coords; focus (sun) is at origin.
      // We want the sun at canvas center.
      const scale = Math.min(width, height) / (2.5 * a);
      const cx = width / 2;
      const cy = height / 2;
      const px = cx + p.x * scale;
      const py = cy - p.y * scale; // flip y

      // Update trail
      trailRef.current.forEach((q) => (q.age += dt));
      trailRef.current = trailRef.current.filter((q) => q.age < 3);
      trailRef.current.push({ x: px, y: py, age: 0 });
      if (trailRef.current.length > 200) trailRef.current.shift();

      ctx.clearRect(0, 0, width, height);

      // Draw ellipse outline (center at canvas-offset-by-c, where c = a*e)
      const bSim = a * Math.sqrt(1 - e * e);
      const ellipseCenterX = cx + -a * e * scale;
      const ellipseCenterY = cy;
      ctx.strokeStyle = "rgba(91, 233, 255, 0.35)";
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.ellipse(
        ellipseCenterX,
        ellipseCenterY,
        a * scale,
        bSim * scale,
        0,
        0,
        Math.PI * 2,
      );
      ctx.stroke();

      // Draw sun at focus
      ctx.shadowColor = "rgba(91, 233, 255, 0.8)";
      ctx.shadowBlur = 20;
      ctx.fillStyle = "#5BE9FF";
      ctx.beginPath();
      ctx.arc(cx, cy, 8, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;

      // Draw trail
      for (const q of trailRef.current) {
        const alpha = Math.max(0, 1 - q.age / 3) * 0.5;
        ctx.fillStyle = `rgba(91, 233, 255, ${alpha})`;
        ctx.beginPath();
        ctx.arc(q.x, q.y, 2, 0, Math.PI * 2);
        ctx.fill();
      }

      // Draw planet
      ctx.fillStyle = "#E6EDF7";
      ctx.beginPath();
      ctx.arc(px, py, 5, 0, Math.PI * 2);
      ctx.fill();

      onState?.({ t, r: p.r, theta: p.theta });
    },
  });

  return (
    <div ref={containerRef} style={{ width, height }} className="mx-auto">
      <canvas ref={canvasRef} style={{ width, height }} className="block" />
    </div>
  );
}
