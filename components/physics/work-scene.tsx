"use client";

import { useEffect, useRef, useState } from "react";
import { useAnimationFrame } from "@/lib/animation/use-animation-frame";
import { useThemeColors } from "@/lib/hooks/use-theme-colors";

const RATIO = 0.5;
const MAX_HEIGHT = 320;

/**
 * A crate pushed along a rough surface at constant velocity. The applied
 * force vector F is drawn on the crate; displacement d accumulates as it
 * moves. W = F · d is shown as a growing bar at the bottom.
 */
export function WorkScene() {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const colors = useThemeColors();
  const [size, setSize] = useState({ width: 640, height: 320 });

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

      // Surface line
      const groundY = height * 0.62;
      const margin = 40;
      ctx.strokeStyle = colors.fg3;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(margin, groundY);
      ctx.lineTo(width - margin, groundY);
      ctx.stroke();
      // Hatched ground
      for (let x = margin; x < width - margin; x += 12) {
        ctx.beginPath();
        ctx.moveTo(x, groundY);
        ctx.lineTo(x - 6, groundY + 8);
        ctx.stroke();
      }

      // Crate position: 5 s loop, moves across working area
      const period = 5;
      const p = (t % period) / period;
      const travel = width - margin * 2 - 80;
      const startX = margin + 8;
      const crateX = startX + p * travel;
      const crateY = groundY - 44;
      const crateW = 60;
      const crateH = 44;

      // Crate
      ctx.fillStyle = colors.bg1;
      ctx.fillRect(crateX, crateY, crateW, crateH);
      ctx.strokeStyle = colors.fg1;
      ctx.lineWidth = 1.5;
      ctx.strokeRect(crateX, crateY, crateW, crateH);
      // Cross-brace
      ctx.beginPath();
      ctx.moveTo(crateX, crateY);
      ctx.lineTo(crateX + crateW, crateY + crateH);
      ctx.moveTo(crateX + crateW, crateY);
      ctx.lineTo(crateX, crateY + crateH);
      ctx.strokeStyle = colors.fg3;
      ctx.stroke();

      // Force vector F applied on back of crate
      const fLen = 60;
      ctx.strokeStyle = colors.magenta;
      ctx.fillStyle = colors.magenta;
      ctx.lineWidth = 2;
      const fy = crateY + crateH / 2;
      ctx.beginPath();
      ctx.moveTo(crateX - fLen, fy);
      ctx.lineTo(crateX - 4, fy);
      ctx.stroke();
      // Arrowhead
      ctx.beginPath();
      ctx.moveTo(crateX - 4, fy);
      ctx.lineTo(crateX - 12, fy - 5);
      ctx.lineTo(crateX - 12, fy + 5);
      ctx.closePath();
      ctx.fill();
      ctx.font = "12px monospace";
      ctx.textAlign = "center";
      ctx.fillText("F", crateX - fLen / 2, fy - 8);

      // Displacement indicator d
      ctx.strokeStyle = colors.fg2;
      ctx.lineWidth = 1;
      ctx.setLineDash([3, 4]);
      ctx.beginPath();
      ctx.moveTo(startX + crateW / 2, groundY + 18);
      ctx.lineTo(crateX + crateW / 2, groundY + 18);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle = colors.fg2;
      ctx.textAlign = "center";
      ctx.fillText("d", (startX + crateX + crateW) / 2, groundY + 32);

      // Work bar at bottom: W = F · d
      const barY = height - 28;
      const barMax = width - margin * 2;
      ctx.strokeStyle = colors.fg3;
      ctx.strokeRect(margin, barY, barMax, 14);
      ctx.fillStyle = colors.magenta;
      ctx.fillRect(margin, barY, barMax * p, 14);
      ctx.textAlign = "left";
      ctx.fillStyle = colors.fg2;
      ctx.fillText("W = F · d", margin, barY - 6);
    },
  });

  return (
    <div ref={containerRef} className="w-full pb-4">
      <canvas ref={canvasRef} style={{ width: size.width, height: size.height }} className="block" />
    </div>
  );
}
