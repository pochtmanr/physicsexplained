"use client";

import { useEffect, useRef, useState } from "react";
import { useAnimationFrame } from "@/lib/animation/use-animation-frame";
import { useThemeColors } from "@/lib/hooks/use-theme-colors";

const RATIO = 0.6;
const MAX_HEIGHT = 360;

/**
 * The oblate Earth — a perfect sphere (dashed) beside the true Earth
 * ellipsoid (solid), with the equatorial bulge called out. The planet
 * spins slowly. Polar and equatorial radii are drawn in proportion to
 * the real (exaggerated) flattening of about 1/298.
 */
export function EquatorialBulgeScene() {
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

      const cx = width / 2;
      const cy = height * 0.55;
      // Exaggerated flattening for visual: f = 0.1 instead of real 1/298
      const Rpolar = Math.min(width, height) * 0.25;
      const Requator = Rpolar * 1.12;
      const spin = t * 0.6;

      // Reference sphere
      ctx.strokeStyle = colors.fg3;
      ctx.setLineDash([3, 4]);
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(cx, cy, Rpolar, 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);

      // Oblate Earth (ellipse)
      ctx.strokeStyle = colors.fg1;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.ellipse(cx, cy, Requator, Rpolar, 0, 0, Math.PI * 2);
      ctx.stroke();

      // Rotation axis
      ctx.strokeStyle = colors.fg2;
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.moveTo(cx, cy - Rpolar - 30);
      ctx.lineTo(cx, cy + Rpolar + 30);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle = colors.fg2;
      ctx.font = "11px monospace";
      ctx.textAlign = "center";
      ctx.fillText("rotation axis", cx, cy - Rpolar - 40);

      // Equator line with meridians (show spin via rotating dot)
      ctx.strokeStyle = colors.fg3;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.ellipse(cx, cy, Requator, Rpolar * 0.25, 0, 0, Math.PI * 2);
      ctx.stroke();
      // Meridian
      for (let k = 0; k < 6; k++) {
        const phase = spin + (k * Math.PI) / 3;
        const xShift = Math.cos(phase);
        if (xShift <= 0) continue;
        ctx.beginPath();
        ctx.ellipse(cx, cy, Requator * xShift, Rpolar, 0, -Math.PI / 2, Math.PI / 2);
        ctx.stroke();
      }

      // Bulge callout (ε)
      const bulgeY = cy;
      ctx.strokeStyle = colors.magenta;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(cx + Rpolar, bulgeY);
      ctx.lineTo(cx + Requator + 12, bulgeY);
      ctx.stroke();
      ctx.fillStyle = colors.magenta;
      ctx.textAlign = "left";
      ctx.fillText("equatorial bulge ≈ 21 km", cx + Requator + 16, bulgeY + 4);

      // Pole labels
      ctx.fillStyle = colors.fg2;
      ctx.textAlign = "center";
      ctx.fillText("N", cx, cy - Rpolar - 14);
      ctx.fillText("S", cx, cy + Rpolar + 22);

      // Caption
      ctx.textAlign = "center";
      ctx.font = "12px monospace";
      ctx.fillStyle = colors.fg1;
      ctx.fillText("rotation + self-gravity → oblate spheroid (f ≈ 1/298)", width / 2, height - 18);
    },
  });

  return (
    <div ref={containerRef} className="w-full pb-4">
      <canvas ref={canvasRef} style={{ width: size.width, height: size.height }} className="block" />
    </div>
  );
}
