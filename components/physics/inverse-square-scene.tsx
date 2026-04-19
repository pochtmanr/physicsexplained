"use client";

import { useEffect, useRef, useState } from "react";
import { orbitPosition } from "@/lib/physics/kepler";
import { useAnimationFrame } from "@/lib/animation/use-animation-frame";
import { useThemeColors } from "@/lib/hooks/use-theme-colors";

export interface InverseSquareSceneProps {
  a?: number;
  e?: number;
  T?: number;
}

export function InverseSquareScene({
  a = 1,
  e = 0.5,
  T = 16,
}: InverseSquareSceneProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [readout, setReadout] = useState({ r: 0, F: 0 });
  const [size, setSize] = useState({ width: 600, height: 400 });
  const colors = useThemeColors();

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const ro = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const w = entry.contentRect.width;
        if (w > 0) {
          setSize({ width: w, height: Math.min(w * 0.65, 400) });
        }
      }
    });
    ro.observe(container);
    return () => ro.disconnect();
  }, []);

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
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      }

      const p = orbitPosition({ t, a, e, T });
      const scale = Math.min(width, height) / (2.6 * a);
      const cx = width / 2;
      const cy = height / 2;
      const px = cx + p.x * scale;
      const py = cy - p.y * scale;

      // Force magnitude ∝ 1/r² (relative — set so perihelion has F ≈ 3 units)
      const rRelative = p.r / a;
      const F = 1 / (rRelative * rRelative);

      ctx.clearRect(0, 0, width, height);

      // Ellipse outline
      const bSim = a * Math.sqrt(1 - e * e);
      const c = a * e;
      ctx.strokeStyle = "rgba(91, 233, 255, 0.35)";
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.ellipse(cx - c * scale, cy, a * scale, bSim * scale, 0, 0, Math.PI * 2);
      ctx.stroke();

      // Sun
      ctx.shadowColor = "rgba(91, 233, 255, 0.8)";
      ctx.shadowBlur = 20;
      ctx.fillStyle = "#5BE9FF";
      ctx.beginPath();
      ctx.arc(cx, cy, 10, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;

      // Planet
      ctx.fillStyle = colors.fg0;
      ctx.beginPath();
      ctx.arc(px, py, 5, 0, Math.PI * 2);
      ctx.fill();

      // Force vector from planet toward sun, length proportional to F (capped)
      const dx = cx - px;
      const dy = cy - py;
      const dist = Math.hypot(dx, dy);
      const ux = dx / dist;
      const uy = dy / dist;
      const vectorLen = Math.min(120, 20 * F);
      const tipX = px + ux * vectorLen;
      const tipY = py + uy * vectorLen;

      // Use magenta near perihelion, cyan elsewhere
      const nearPerihelion = rRelative < 1.0;
      ctx.strokeStyle = nearPerihelion ? "#FF4FD8" : "#5BE9FF";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(px, py);
      ctx.lineTo(tipX, tipY);
      ctx.stroke();

      // Arrow head
      const angle = Math.atan2(uy, ux);
      ctx.beginPath();
      ctx.moveTo(tipX, tipY);
      ctx.lineTo(
        tipX - 8 * Math.cos(angle - Math.PI / 6),
        tipY - 8 * Math.sin(angle - Math.PI / 6),
      );
      ctx.lineTo(
        tipX - 8 * Math.cos(angle + Math.PI / 6),
        tipY - 8 * Math.sin(angle + Math.PI / 6),
      );
      ctx.closePath();
      ctx.fillStyle = nearPerihelion ? "#FF4FD8" : "#5BE9FF";
      ctx.fill();

      setReadout({ r: p.r, F });
    },
  });

  return (
    <div ref={containerRef} className="w-full pb-4 relative">
      <canvas ref={canvasRef} style={{ width: size.width, height: size.height }} className="block" />
      <div className="pointer-events-none absolute bottom-7 right-3 rounded-sm border border-[var(--color-fg-4)] bg-[var(--color-bg-0)]/70 px-2 py-1 font-mono text-xs text-[var(--color-fg-1)] backdrop-blur-sm">
        r = {readout.r.toFixed(2)} AU · F = {readout.F.toFixed(2)}
      </div>
    </div>
  );
}
