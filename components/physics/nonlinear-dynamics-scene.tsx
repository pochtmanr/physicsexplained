"use client";

import { useEffect, useRef, useState } from "react";
import { useAnimationFrame } from "@/lib/animation/use-animation-frame";
import { useThemeColors } from "@/lib/hooks/use-theme-colors";

const RATIO = 0.55;
const MAX_HEIGHT = 340;

/**
 * Two double pendulums launched from almost the same initial angles
 * diverge rapidly over time — the classic signature of nonlinear,
 * chaotic dynamics. Both pendulums swing in the same canvas so the
 * sensitive dependence on initial conditions is visible.
 *
 * Integrated via a small explicit Euler step on the standard double-
 * pendulum Hamilton-ish system.
 */
export function NonlinearDynamicsScene() {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const colors = useThemeColors();
  const [size, setSize] = useState({ width: 640, height: 340 });

  // Two systems, each [θ1, θ2, ω1, ω2]
  const stateA = useRef<[number, number, number, number]>([
    2.0, 2.0, 0, 0,
  ]);
  const stateB = useRef<[number, number, number, number]>([
    2.001, 2.001, 0, 0,
  ]);
  const lastRef = useRef<number | null>(null);
  const trailA = useRef<Array<{ x: number; y: number }>>([]);
  const trailB = useRef<Array<{ x: number; y: number }>>([]);
  const resetAt = useRef(0);

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

  const step = (s: [number, number, number, number], dt: number) => {
    const [t1, t2, w1, w2] = s;
    const m1 = 1, m2 = 1, L1 = 1, L2 = 1, g = 9.8;
    const d = t1 - t2;
    const den = 2 * m1 + m2 - m2 * Math.cos(2 * d);
    const a1 =
      (-g * (2 * m1 + m2) * Math.sin(t1) -
        m2 * g * Math.sin(t1 - 2 * t2) -
        2 * Math.sin(d) * m2 * (w2 * w2 * L2 + w1 * w1 * L1 * Math.cos(d))) /
      (L1 * den);
    const a2 =
      (2 *
        Math.sin(d) *
        (w1 * w1 * L1 * (m1 + m2) +
          g * (m1 + m2) * Math.cos(t1) +
          w2 * w2 * L2 * m2 * Math.cos(d))) /
      (L2 * den);
    s[0] = t1 + w1 * dt;
    s[1] = t2 + w2 * dt;
    s[2] = w1 + a1 * dt;
    s[3] = w2 + a2 * dt;
  };

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

      const dt = lastRef.current === null ? 0 : Math.min(t - lastRef.current, 0.032);
      lastRef.current = t;

      // Reset every ~18 s so viewer always sees the divergence build
      if (t - resetAt.current > 18) {
        stateA.current = [2.0, 2.0, 0, 0];
        stateB.current = [2.001, 2.001, 0, 0];
        trailA.current = [];
        trailB.current = [];
        resetAt.current = t;
      }

      // Multiple substeps for stability
      const sub = 6;
      for (let i = 0; i < sub; i++) {
        step(stateA.current, dt / sub);
        step(stateB.current, dt / sub);
      }

      const ox = width / 2;
      const oy = height * 0.38;
      const scale = Math.min(width, height) * 0.18;

      const render = (
        s: [number, number, number, number],
        trail: Array<{ x: number; y: number }>,
        col: string,
        alpha = 1,
      ) => {
        const [t1, t2] = s;
        const x1 = ox + scale * Math.sin(t1);
        const y1 = oy + scale * Math.cos(t1);
        const x2 = x1 + scale * Math.sin(t2);
        const y2 = y1 + scale * Math.cos(t2);
        trail.push({ x: x2, y: y2 });
        if (trail.length > 400) trail.shift();

        // Trail
        if (trail.length > 1) {
          ctx.strokeStyle = col;
          ctx.lineWidth = 1;
          ctx.globalAlpha = 0.45 * alpha;
          ctx.beginPath();
          ctx.moveTo(trail[0].x, trail[0].y);
          for (let i = 1; i < trail.length; i++) ctx.lineTo(trail[i].x, trail[i].y);
          ctx.stroke();
          ctx.globalAlpha = 1;
        }

        // Rods
        ctx.strokeStyle = col;
        ctx.globalAlpha = alpha;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(ox, oy);
        ctx.lineTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.stroke();
        ctx.fillStyle = col;
        ctx.beginPath();
        ctx.arc(x1, y1, 4, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(x2, y2, 6, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;
      };

      render(stateA.current, trailA.current, colors.magenta);
      render(stateB.current, trailB.current, colors.fg0, 0.8);

      // Pivot
      ctx.fillStyle = colors.fg3;
      ctx.beginPath();
      ctx.arc(ox, oy, 4, 0, Math.PI * 2);
      ctx.fill();

      // Caption
      ctx.font = "11px monospace";
      ctx.fillStyle = colors.fg2;
      ctx.textAlign = "left";
      ctx.fillText("two double pendulums — initial angles differ by 0.001 rad", 16, 22);
      ctx.fillText("chaotic: tiny differences blow up exponentially", 16, 40);
    },
  });

  return (
    <div ref={containerRef} className="w-full pb-4">
      <canvas ref={canvasRef} style={{ width: size.width, height: size.height }} className="block" />
    </div>
  );
}
