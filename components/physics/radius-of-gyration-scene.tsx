"use client";

import { useEffect, useRef, useState } from "react";
import { useAnimationFrame } from "@/lib/animation/use-animation-frame";
import { useThemeColors } from "@/lib/hooks/use-theme-colors";

const RATIO = 0.55;
const MAX_HEIGHT = 340;

/**
 * A distributed object (a rectangular bar) and its equivalent: all mass
 * concentrated at a single radius k from the axis. Both have the same
 * moment of inertia and spin identically around the central axis.
 *
 * I = M · k²  →  k = √(I / M)
 */
export function RadiusOfGyrationScene() {
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

      const angle = t * 1.2;

      // Left: distributed bar — uniform rod of half-length L, k = L / √3
      const drawBar = (cx: number, cy: number, L: number, rot: number) => {
        ctx.save();
        ctx.translate(cx, cy);
        ctx.rotate(rot);
        ctx.strokeStyle = colors.fg1;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(-L, 0);
        ctx.lineTo(L, 0);
        ctx.stroke();
        // mass markers along the bar
        ctx.fillStyle = colors.fg2;
        for (let i = -4; i <= 4; i++) {
          ctx.beginPath();
          ctx.arc((i / 4) * L, 0, 3, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.restore();
      };

      const drawAxis = (cx: number, cy: number) => {
        ctx.strokeStyle = colors.fg3;
        ctx.setLineDash([3, 4]);
        ctx.beginPath();
        ctx.moveTo(cx, cy - 100);
        ctx.lineTo(cx, cy + 100);
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.fillStyle = colors.fg0;
        ctx.beginPath();
        ctx.arc(cx, cy, 5, 0, Math.PI * 2);
        ctx.fill();
      };

      // Left panel
      const lx = width * 0.28;
      const ly = height * 0.52;
      const L = 80;
      drawAxis(lx, ly);
      drawBar(lx, ly, L, angle);
      ctx.font = "11px monospace";
      ctx.textAlign = "center";
      ctx.fillStyle = colors.fg2;
      ctx.fillText("distributed bar", lx, ly - 125);
      ctx.fillStyle = colors.fg1;
      ctx.fillText("I = ⅓ · M · L²", lx, ly + 125);

      // Right: equivalent ring at radius k
      const rx = width * 0.72;
      const ry = height * 0.52;
      const k = L / Math.sqrt(3);
      drawAxis(rx, ry);
      // ring
      ctx.strokeStyle = colors.fg3;
      ctx.setLineDash([2, 4]);
      ctx.beginPath();
      ctx.arc(rx, ry, k, 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);
      // two point masses on the ring (representing condensed mass)
      const m1a = angle;
      const m2a = angle + Math.PI;
      ctx.fillStyle = colors.magenta;
      ctx.shadowColor = colors.magenta;
      ctx.shadowBlur = 8;
      ctx.beginPath();
      ctx.arc(rx + Math.cos(m1a) * k, ry + Math.sin(m1a) * k, 8, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(rx + Math.cos(m2a) * k, ry + Math.sin(m2a) * k, 8, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;
      // k label
      ctx.strokeStyle = colors.magenta;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(rx, ry);
      ctx.lineTo(rx + k, ry);
      ctx.stroke();
      ctx.fillStyle = colors.magenta;
      ctx.textAlign = "center";
      ctx.fillText("k", rx + k / 2, ry - 6);

      ctx.fillStyle = colors.fg2;
      ctx.fillText("equivalent radius of gyration", rx, ry - 125);
      ctx.fillStyle = colors.fg1;
      ctx.fillText("I = M · k²", rx, ry + 125);

      // Banner
      ctx.font = "12px monospace";
      ctx.fillStyle = colors.fg1;
      ctx.textAlign = "center";
      ctx.fillText("k = √(I / M) — the equivalent point-mass radius", width / 2, 22);
    },
  });

  return (
    <div ref={containerRef} className="w-full pb-4">
      <canvas ref={canvasRef} style={{ width: size.width, height: size.height }} className="block" />
    </div>
  );
}
