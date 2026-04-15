"use client";

import { useEffect, useRef, useState } from "react";
import { smallAngleTheta, smallAnglePeriod } from "@/lib/physics/pendulum";
import { useAnimationFrame } from "@/lib/animation/use-animation-frame";
import { useThemeColors } from "@/lib/hooks/use-theme-colors";

const RATIO = 0.6;
const MAX_HEIGHT = 340;

export function IsochronismScene() {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const colors = useThemeColors();
  const [size, setSize] = useState({ width: 480, height: 340 });
  const L = 1.5, theta0A = 0.17, theta0B = 0.61;
  const period = smallAnglePeriod(L);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const ro = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const w = entry.contentRect.width;
        if (w > 0) {
          const h = Math.min(w * RATIO, MAX_HEIGHT);
          setSize({ width: w, height: h });
        }
      }
    });
    ro.observe(container);
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
        canvas.width = width * dpr; canvas.height = height * dpr; ctx.scale(dpr, dpr);
      }
      ctx.clearRect(0, 0, width, height);
      const halfW = width / 2, pivotY = 40, pxM = (height - 100) / L;
      const pends = [
        { cx: halfW / 2, theta0: theta0A, label: `${Math.round(theta0A * 180 / Math.PI)}°` },
        { cx: halfW + halfW / 2, theta0: theta0B, label: `${Math.round(theta0B * 180 / Math.PI)}°` },
      ];
      for (const p of pends) {
        const theta = smallAngleTheta({ t, theta0: p.theta0, L });
        const bx = p.cx + pxM * L * Math.sin(theta), by = pivotY + pxM * L * Math.cos(theta);
        ctx.fillStyle = colors.fg2; ctx.beginPath(); ctx.arc(p.cx, pivotY, 3, 0, Math.PI * 2); ctx.fill();
        ctx.strokeStyle = colors.fg0; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(p.cx, pivotY); ctx.lineTo(bx, by); ctx.stroke();
        ctx.shadowColor = "rgba(91, 233, 255, 0.6)"; ctx.shadowBlur = 12;
        ctx.fillStyle = "#5BE9FF"; ctx.beginPath(); ctx.arc(bx, by, 8, 0, Math.PI * 2); ctx.fill(); ctx.shadowBlur = 0;
        ctx.font = "11px monospace"; ctx.fillStyle = colors.fg2; ctx.textAlign = "center"; ctx.fillText(p.label, p.cx, pivotY - 12);
        const barY = height - 30, barL = p.cx - 60, barR = p.cx + 60, barW = barR - barL;
        ctx.strokeStyle = colors.fg3; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(barL, barY); ctx.lineTo(barR, barY); ctx.stroke();
        const frac = (t % period) / period;
        ctx.strokeStyle = "#5BE9FF"; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(barL, barY); ctx.lineTo(barL + barW * frac, barY); ctx.stroke();
      }
      ctx.strokeStyle = colors.fg3; ctx.lineWidth = 1; ctx.setLineDash([4, 4]);
      ctx.beginPath(); ctx.moveTo(halfW, pivotY - 20); ctx.lineTo(halfW, height - 10); ctx.stroke(); ctx.setLineDash([]);
      ctx.font = "11px monospace"; ctx.fillStyle = colors.fg1; ctx.textAlign = "center";
      ctx.fillText(`T = ${period.toFixed(2)}s`, halfW, height - 10);
    },
  });

  return (
    <div ref={containerRef} className="w-full pb-4">
      <canvas ref={canvasRef} style={{ width: size.width, height: size.height }} className="block" />
    </div>
  );
}
