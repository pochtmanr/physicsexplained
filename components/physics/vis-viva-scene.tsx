"use client";

import { useRef, useState, useEffect } from "react";
import { orbitPosition } from "@/lib/physics/kepler";
import { useAnimationFrame } from "@/lib/animation/use-animation-frame";
import { useThemeColors } from "@/lib/hooks/use-theme-colors";

export interface VisVivaSceneProps {
  a?: number;
  e?: number;
  T?: number;
}

export function VisVivaScene({
  a = 1,
  e = 0.5,
  T = 16,
}: VisVivaSceneProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const colors = useThemeColors();
  const [readout, setReadout] = useState({ v: 0, KE: 0, PE: 0, E: 0 });
  const [size, setSize] = useState({ width: 600, height: 400 });

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const ro = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const w = entry.contentRect.width;
        if (w > 0) {
          setSize({ width: w, height: Math.min(w * 0.65, 420) });
        }
      }
    });
    ro.observe(container);
    return () => ro.disconnect();
  }, []);

  // In natural units where GM = 4pi^2 a^3 / T^2 (display units),
  // vis-viva: v^2 = GM(2/r - 1/a). We normalize so GM = 1, a is given.
  // For display we use GM = 1 and compute in those units.
  const GM = 1;

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
        ctx.scale(dpr, dpr);
      }

      const p = orbitPosition({ t, a, e, T });
      const scale = Math.min(width, height) / (3.2 * a);
      const cx = width * 0.4;
      const cy = height / 2;
      const px = cx + p.x * scale;
      const py = cy - p.y * scale;

      // vis-viva energy: v^2 = GM(2/r - 1/a), KE = v^2/2, PE = -GM/r, E = -GM/(2a)
      const v2 = GM * (2 / p.r - 1 / a);
      const v = Math.sqrt(Math.max(0, v2));
      const KE = 0.5 * v2;
      const PE = -GM / p.r;
      const totalE = -GM / (2 * a);

      ctx.clearRect(0, 0, width, height);

      // --- Orbit ellipse ---
      const bSim = a * Math.sqrt(1 - e * e);
      const cFocus = a * e;
      ctx.strokeStyle = "rgba(91, 233, 255, 0.3)";
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.ellipse(cx - cFocus * scale, cy, a * scale, bSim * scale, 0, 0, Math.PI * 2);
      ctx.stroke();

      // Perihelion / aphelion labels
      ctx.fillStyle = colors.fg3;
      ctx.font = "10px sans-serif";
      ctx.textAlign = "center";
      const periX = cx + a * (1 - e) * scale;
      const apoX = cx - a * (1 + e) * scale;
      ctx.fillText("perihelion", periX, cy + 18);
      ctx.fillText("aphelion", apoX, cy + 18);

      // Sun at focus
      ctx.shadowColor = "rgba(91, 233, 255, 0.8)";
      ctx.shadowBlur = 18;
      ctx.fillStyle = "#5BE9FF";
      ctx.beginPath();
      ctx.arc(cx, cy, 8, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;

      // Planet
      ctx.fillStyle = colors.fg0;
      ctx.beginPath();
      ctx.arc(px, py, 5, 0, Math.PI * 2);
      ctx.fill();

      // Radius line
      ctx.strokeStyle = "rgba(91, 233, 255, 0.2)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(px, py);
      ctx.stroke();

      // --- Energy bar chart on the right side ---
      const barX = width - 140;
      const barW = 28;
      const barBaseY = height / 2 + 60;
      const barScale = 100; // pixels per unit energy

      // KE bar (positive, going up from baseline) — cyan
      const keH = KE * barScale;
      ctx.fillStyle = "rgba(91, 233, 255, 0.7)";
      ctx.fillRect(barX, barBaseY - keH, barW, keH);

      // PE bar (negative, going down from baseline) — magenta
      const peH = Math.abs(PE) * barScale;
      ctx.fillStyle = "rgba(255, 79, 216, 0.7)";
      ctx.fillRect(barX + barW + 8, barBaseY, barW, peH);

      // Total E line (constant, dashed)
      const totalEY = barBaseY - totalE * barScale; // totalE is negative, so this goes below baseline
      ctx.strokeStyle = "#FF6B6B";
      ctx.lineWidth = 1.5;
      ctx.setLineDash([5, 3]);
      ctx.beginPath();
      ctx.moveTo(barX - 10, totalEY);
      ctx.lineTo(barX + 2 * barW + 18, totalEY);
      ctx.stroke();
      ctx.setLineDash([]);

      // Baseline
      ctx.strokeStyle = colors.fg3;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(barX - 10, barBaseY);
      ctx.lineTo(barX + 2 * barW + 18, barBaseY);
      ctx.stroke();

      // Bar labels
      ctx.font = "11px sans-serif";
      ctx.textAlign = "center";
      ctx.fillStyle = "#5BE9FF";
      ctx.fillText("KE", barX + barW / 2, barBaseY + peH + 28);
      ctx.fillStyle = "#FF4FD8";
      ctx.fillText("|PE|", barX + barW + 8 + barW / 2, barBaseY + peH + 28);

      // Total E label
      ctx.fillStyle = "#FF6B6B";
      ctx.textAlign = "left";
      ctx.font = "10px sans-serif";
      ctx.fillText("E (total)", barX + 2 * barW + 22, totalEY + 3);

      // Zero label
      ctx.fillStyle = colors.fg3;
      ctx.textAlign = "right";
      ctx.fillText("0", barX - 14, barBaseY + 4);

      // Numeric readout top-right
      ctx.fillStyle = colors.fg1;
      ctx.font = "11px monospace";
      ctx.textAlign = "left";
      const readoutX = barX - 12;
      const readoutY = 24;
      ctx.fillText(`v  = ${v.toFixed(3)}`, readoutX, readoutY);
      ctx.fillText(`KE = ${KE.toFixed(3)}`, readoutX, readoutY + 16);
      ctx.fillText(`PE = ${PE.toFixed(3)}`, readoutX, readoutY + 32);
      ctx.fillText(`E  = ${totalE.toFixed(3)}`, readoutX, readoutY + 48);

      setReadout({ v, KE, PE, E: totalE });
    },
  });

  return (
    <div ref={containerRef} className="w-full pb-4">
      <canvas ref={canvasRef} style={{ width: size.width, height: size.height }} className="block" />
    </div>
  );
}
