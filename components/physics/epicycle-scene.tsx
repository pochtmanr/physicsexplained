"use client";

import { useEffect, useRef, useState } from "react";
import { useAnimationFrame } from "@/lib/animation/use-animation-frame";
import { useThemeColors } from "@/lib/hooks/use-theme-colors";

const RATIO = 0.7;
const MAX_HEIGHT = 400;

export function EpicycleScene() {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const trailRef = useRef<Array<{ x: number; y: number }>>([]);
  const colors = useThemeColors();
  const [size, setSize] = useState({ width: 480, height: 400 });
  const R = 120, r = 45, Td = 20, Te = 6;

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
      const cx = width / 2, cy = height / 2;
      const dA = (2 * Math.PI * t) / Td;
      const ecX = cx + R * Math.cos(dA), ecY = cy - R * Math.sin(dA);
      const eA = -(2 * Math.PI * t) / Te;
      const px = ecX + r * Math.cos(eA), py = ecY - r * Math.sin(eA);
      trailRef.current.push({ x: px, y: py });
      if (trailRef.current.length > 600) trailRef.current.shift();

      ctx.clearRect(0, 0, width, height);

      // Earth
      ctx.fillStyle = colors.fg2; ctx.beginPath(); ctx.arc(cx, cy, 5, 0, Math.PI * 2); ctx.fill();
      ctx.font = "10px monospace"; ctx.fillStyle = colors.fg2; ctx.textAlign = "center"; ctx.fillText("Earth", cx, cy + 16);

      // Deferent
      ctx.strokeStyle = colors.fg3; ctx.lineWidth = 1; ctx.beginPath(); ctx.arc(cx, cy, R, 0, Math.PI * 2); ctx.stroke();

      // Epicycle
      ctx.strokeStyle = colors.fg2; ctx.lineWidth = 1; ctx.beginPath(); ctx.arc(ecX, ecY, r, 0, Math.PI * 2); ctx.stroke();
      ctx.fillStyle = colors.fg1; ctx.beginPath(); ctx.arc(ecX, ecY, 3, 0, Math.PI * 2); ctx.fill();

      // Dashed line Earth → epicycle center
      ctx.strokeStyle = colors.fg3; ctx.lineWidth = 1; ctx.setLineDash([4, 4]);
      ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(ecX, ecY); ctx.stroke(); ctx.setLineDash([]);

      // Trail
      const trail = trailRef.current;
      if (trail.length > 1) {
        ctx.strokeStyle = "#FF4FD8"; ctx.lineWidth = 1.5; ctx.beginPath();
        ctx.moveTo(trail[0].x, trail[0].y);
        for (let i = 1; i < trail.length; i++) ctx.lineTo(trail[i].x, trail[i].y);
        ctx.stroke();
      }

      // Planet
      ctx.shadowColor = "rgba(255, 79, 216, 0.6)"; ctx.shadowBlur = 12;
      ctx.fillStyle = "#FF4FD8"; ctx.beginPath(); ctx.arc(px, py, 5, 0, Math.PI * 2); ctx.fill(); ctx.shadowBlur = 0;
    },
  });

  return (
    <div ref={containerRef} className="w-full pb-4">
      <canvas ref={canvasRef} style={{ width: size.width, height: size.height }} className="block" />
    </div>
  );
}
