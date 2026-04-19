"use client";

import { useEffect, useRef, useState } from "react";
import { useAnimationFrame } from "@/lib/animation/use-animation-frame";
import { useThemeColors } from "@/lib/hooks/use-theme-colors";

const RATIO = 0.6;
const MAX_HEIGHT = 360;

/**
 * A rectangular plate rotated first about its centre of mass, then about
 * a parallel axis offset by d. The outer path is larger by M·d², which
 * is exactly what the parallel-axis theorem adds: I = I_cm + M·d².
 */
export function ParallelAxisTheoremScene() {
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

      const angle = t * 1.0;
      const plateW = 110;
      const plateH = 60;

      const drawPanel = (panelCx: number, panelCy: number, pivotOffset: number, label: string, formula: string) => {
        // Pivot (fixed)
        const pivotX = panelCx - pivotOffset;
        const pivotY = panelCy;

        // Plate position (rotates plate centre of mass around pivot)
        const comX = pivotX + pivotOffset * Math.cos(angle);
        const comY = pivotY + pivotOffset * Math.sin(angle);

        // COM trajectory circle
        if (pivotOffset > 0) {
          ctx.strokeStyle = colors.fg3;
          ctx.setLineDash([3, 4]);
          ctx.beginPath();
          ctx.arc(pivotX, pivotY, pivotOffset, 0, Math.PI * 2);
          ctx.stroke();
          ctx.setLineDash([]);
        }

        // Plate
        ctx.save();
        ctx.translate(comX, comY);
        ctx.rotate(angle);
        ctx.fillStyle = colors.bg1;
        ctx.fillRect(-plateW / 2, -plateH / 2, plateW, plateH);
        ctx.strokeStyle = colors.fg1;
        ctx.lineWidth = 2;
        ctx.strokeRect(-plateW / 2, -plateH / 2, plateW, plateH);
        // COM dot
        ctx.fillStyle = colors.magenta;
        ctx.beginPath();
        ctx.arc(0, 0, 4, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();

        // Pivot
        ctx.fillStyle = colors.fg0;
        ctx.beginPath();
        ctx.arc(pivotX, pivotY, 5, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = colors.fg0;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(pivotX, pivotY, 9, 0, Math.PI * 2);
        ctx.stroke();

        // d line
        if (pivotOffset > 0) {
          ctx.strokeStyle = colors.fg2;
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(pivotX, pivotY);
          ctx.lineTo(comX, comY);
          ctx.stroke();
        }

        ctx.font = "11px monospace";
        ctx.fillStyle = colors.fg2;
        ctx.textAlign = "center";
        ctx.fillText(label, panelCx, panelCy - 110);
        ctx.fillStyle = colors.fg1;
        ctx.fillText(formula, panelCx, panelCy + 120);
      };

      drawPanel(width * 0.25, height * 0.5, 0, "axis through COM", "I = I_cm");
      drawPanel(width * 0.72, height * 0.5, 65, "parallel axis offset by d", "I = I_cm + M·d²");

      // Central caption
      ctx.font = "12px monospace";
      ctx.fillStyle = colors.magenta;
      ctx.textAlign = "center";
      ctx.fillText("Steiner's theorem", width / 2, 22);
    },
  });

  return (
    <div ref={containerRef} className="w-full pb-4">
      <canvas ref={canvasRef} style={{ width: size.width, height: size.height }} className="block" />
    </div>
  );
}
