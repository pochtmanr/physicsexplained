"use client";

import { useRef, useState, useEffect } from "react";
import { useAnimationFrame } from "@/lib/animation/use-animation-frame";
import { useThemeColors } from "@/lib/hooks/use-theme-colors";

interface MassBody {
  x: number;
  y: number;
  M: number;
  color: string;
  label: string;
}

export function GravityFieldScene() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const colors = useThemeColors();
  const [secondMass, setSecondMass] = useState(0);
  const [size, setSize] = useState({ width: 600, height: 400 });

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

  const { width, height } = size;

  useAnimationFrame({
    elementRef: containerRef,
    onFrame: (_t) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      const dpr = window.devicePixelRatio || 1;
      if (canvas.width !== width * dpr || canvas.height !== height * dpr) {
        canvas.width = width * dpr;
        canvas.height = height * dpr;
        ctx.scale(dpr, dpr);
      }
      ctx.clearRect(0, 0, width, height);

      const bodies: MassBody[] = [
        {
          x: width * 0.35,
          y: height / 2,
          M: 1,
          color: "#5BE9FF",
          label: "M₁",
        },
      ];

      if (secondMass > 0.05) {
        bodies.push({
          x: width * 0.7,
          y: height / 2,
          M: secondMass,
          color: "#FF4FD8",
          label: "M₂",
        });
      }

      // Compute gravitational field on a grid
      const gridStep = 20;
      const maxArrowLen = gridStep * 0.7;

      for (let gx = gridStep; gx < width; gx += gridStep) {
        for (let gy = gridStep; gy < height; gy += gridStep) {
          let fx = 0;
          let fy = 0;

          for (const body of bodies) {
            const dx = body.x - gx;
            const dy = body.y - gy;
            const r2 = dx * dx + dy * dy;
            const r = Math.sqrt(r2);
            if (r < 15) continue; // skip near mass center
            const fMag = body.M / r2;
            fx += fMag * (dx / r);
            fy += fMag * (dy / r);
          }

          const fTotal = Math.sqrt(fx * fx + fy * fy);
          if (fTotal < 1e-6) continue;

          // Scale arrow: log scale to keep visible range
          const arrowLen = Math.min(
            maxArrowLen,
            Math.log(1 + fTotal * 8000) * 3,
          );
          const ux = fx / fTotal;
          const uy = fy / fTotal;

          const tipX = gx + ux * arrowLen;
          const tipY = gy + uy * arrowLen;

          // Color by intensity
          const intensity = Math.min(1, fTotal * 2000);
          const r = Math.round(91 + (255 - 91) * intensity);
          const g = Math.round(233 - 154 * intensity);
          const b = Math.round(255 - 39 * intensity);
          const alpha = 0.2 + 0.6 * intensity;

          ctx.strokeStyle = `rgba(${r}, ${g}, ${b}, ${alpha})`;
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(gx, gy);
          ctx.lineTo(tipX, tipY);
          ctx.stroke();

          // Small arrowhead
          if (arrowLen > 4) {
            const headSize = 3;
            const angle = Math.atan2(uy, ux);
            ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${alpha})`;
            ctx.beginPath();
            ctx.moveTo(tipX, tipY);
            ctx.lineTo(
              tipX - headSize * Math.cos(angle - Math.PI / 5),
              tipY - headSize * Math.sin(angle - Math.PI / 5),
            );
            ctx.lineTo(
              tipX - headSize * Math.cos(angle + Math.PI / 5),
              tipY - headSize * Math.sin(angle + Math.PI / 5),
            );
            ctx.closePath();
            ctx.fill();
          }
        }
      }

      // Draw mass bodies
      for (const body of bodies) {
        const radius = 8 + body.M * 4;
        ctx.shadowColor =
          body.color === "#5BE9FF"
            ? "rgba(91, 233, 255, 0.8)"
            : "rgba(255, 79, 216, 0.8)";
        ctx.shadowBlur = 18;
        ctx.fillStyle = body.color;
        ctx.beginPath();
        ctx.arc(body.x, body.y, radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;

        // Label
        ctx.fillStyle = colors.fg1;
        ctx.font = "13px monospace";
        ctx.textAlign = "center";
        ctx.fillText(body.label, body.x, body.y - radius - 8);
      }
    },
  });

  return (
    <div ref={containerRef} className="w-full pb-4">
      <canvas
        ref={canvasRef}
        style={{ width: size.width, height: size.height }}
        className="block"
      />
      <div className="mt-2 flex items-center gap-3 px-2">
        <label className="text-sm text-[var(--color-fg-2)]">
          Second mass (M₂)
        </label>
        <input
          type="range"
          min={0}
          max={2}
          step={0.05}
          value={secondMass}
          onChange={(e) => setSecondMass(parseFloat(e.target.value))}
          className="flex-1 accent-[#FF4FD8]"
        />
        <span className="w-12 text-right font-mono text-sm text-[var(--color-fg-1)]">
          {secondMass.toFixed(1)}
        </span>
      </div>
    </div>
  );
}
