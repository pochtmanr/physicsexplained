"use client";

import { useEffect, useRef, useState } from "react";
import { useAnimationFrame } from "@/lib/animation/use-animation-frame";
import { useThemeColors } from "@/lib/hooks/use-theme-colors";

const RATIO = 0.6;
const MAX_HEIGHT = 360;

/**
 * Two unequal masses connected by a rigid rod, rotating together about
 * their common centre of mass. The COM moves in a straight line; the two
 * masses trace circles of different radii around it.
 *
 * Balance: m₁·r₁ = m₂·r₂ (the COM divides the rod inversely to the masses).
 */
export function CenterOfMassScene() {
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

      // Masses
      const m1 = 3, m2 = 1;
      const L = Math.min(width * 0.35, 220);
      const r1 = (m2 / (m1 + m2)) * L; // small mass swings further
      const r2 = (m1 / (m1 + m2)) * L;

      // COM moves linearly across the scene
      const travelPeriod = 10;
      const p = (t % travelPeriod) / travelPeriod;
      const comX = width * 0.15 + p * width * 0.7;
      const comY = height / 2;

      // Rotation
      const angle = t * 1.6;
      const m1x = comX - Math.cos(angle) * r1;
      const m1y = comY - Math.sin(angle) * r1;
      const m2x = comX + Math.cos(angle) * r2;
      const m2y = comY + Math.sin(angle) * r2;

      // Straight COM line
      ctx.strokeStyle = colors.fg3;
      ctx.setLineDash([3, 5]);
      ctx.beginPath();
      ctx.moveTo(width * 0.15, comY);
      ctx.lineTo(width * 0.85, comY);
      ctx.stroke();
      ctx.setLineDash([]);

      // Rod
      ctx.strokeStyle = colors.fg1;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(m1x, m1y);
      ctx.lineTo(m2x, m2y);
      ctx.stroke();

      // Mass 1 (heavy)
      ctx.fillStyle = colors.fg1;
      ctx.beginPath();
      ctx.arc(m1x, m1y, 14, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = colors.bg0;
      ctx.font = "11px monospace";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("3m", m1x, m1y);

      // Mass 2 (light)
      ctx.fillStyle = colors.fg1;
      ctx.beginPath();
      ctx.arc(m2x, m2y, 8, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = colors.bg0;
      ctx.fillText("m", m2x, m2y);

      // COM marker
      ctx.fillStyle = colors.magenta;
      ctx.shadowColor = colors.magenta;
      ctx.shadowBlur = 10;
      ctx.beginPath();
      ctx.arc(comX, comY, 5, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;

      ctx.font = "11px monospace";
      ctx.fillStyle = colors.magenta;
      ctx.textBaseline = "alphabetic";
      ctx.textAlign = "center";
      ctx.fillText("COM", comX, comY - 14);

      // Caption
      ctx.textAlign = "left";
      ctx.fillStyle = colors.fg2;
      ctx.fillText("m₁·r₁ = m₂·r₂", 16, 22);
    },
  });

  return (
    <div ref={containerRef} className="w-full pb-4">
      <canvas ref={canvasRef} style={{ width: size.width, height: size.height }} className="block" />
    </div>
  );
}
