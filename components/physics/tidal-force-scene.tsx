"use client";

import { useRef, useState, useCallback, useEffect } from "react";
import { useAnimationFrame } from "@/lib/animation/use-animation-frame";
import { useThemeColors } from "@/lib/hooks/use-theme-colors";

/**
 * Visualizes tidal force vectors on Earth's surface due to the Moon.
 * Arrows show the differential gravitational acceleration (tidal force)
 * at 16 points around Earth. Near/far sides: radially outward.
 * Top/bottom: radially inward (squeezed). Slider controls Moon distance.
 * Fully responsive — fills container width.
 */
export function TidalForceScene() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const colors = useThemeColors();

  const [moonDist, setMoonDist] = useState(0.55);
  const [size, setSize] = useState({ width: 600, height: 400 });

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const ro = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const w = entry.contentRect.width;
        if (w > 0) {
          setSize({ width: w, height: Math.min(w * 0.6, 420) });
        }
      }
    });
    ro.observe(container);
    return () => ro.disconnect();
  }, []);

  const { width, height } = size;

  const drawArrow = useCallback(
    (
      ctx: CanvasRenderingContext2D,
      x0: number,
      y0: number,
      dx: number,
      dy: number,
      color: string,
    ) => {
      const len = Math.sqrt(dx * dx + dy * dy);
      if (len < 1) return;
      ctx.strokeStyle = color;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(x0, y0);
      ctx.lineTo(x0 + dx, y0 + dy);
      ctx.stroke();

      const angle = Math.atan2(dy, dx);
      const headSize = Math.min(6, len * 0.4);
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.moveTo(x0 + dx, y0 + dy);
      ctx.lineTo(
        x0 + dx - headSize * Math.cos(angle - Math.PI / 6),
        y0 + dy - headSize * Math.sin(angle - Math.PI / 6),
      );
      ctx.lineTo(
        x0 + dx - headSize * Math.cos(angle + Math.PI / 6),
        y0 + dy - headSize * Math.sin(angle + Math.PI / 6),
      );
      ctx.closePath();
      ctx.fill();
    },
    [],
  );

  useAnimationFrame({
    elementRef: containerRef,
    onFrame: () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      const dpr = window.devicePixelRatio || 1;
      if (canvas.width !== width * dpr || canvas.height !== height * dpr) {
        canvas.width = width * dpr;
        canvas.height = height * dpr;
      }
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, width, height);

      const cx = width * 0.35;
      const cy = height / 2;
      const earthR = Math.min(width, height) * 0.18;

      const moonR = earthR * 0.27;
      const moonCenterX = cx + moonDist * (width * 0.55);
      const moonCenterY = cy;
      const distToMoon = moonCenterX - cx;

      // Draw Earth
      ctx.strokeStyle = "rgba(91, 233, 255, 0.4)";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(cx, cy, earthR, 0, Math.PI * 2);
      ctx.stroke();

      ctx.fillStyle = "rgba(91, 233, 255, 0.06)";
      ctx.beginPath();
      ctx.arc(cx, cy, earthR, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = colors.fg2;
      ctx.font = "12px monospace";
      ctx.textAlign = "center";
      ctx.fillText("Earth", cx, cy + earthR + 20);

      // Draw Moon
      ctx.shadowColor = "rgba(159, 176, 200, 0.5)";
      ctx.shadowBlur = 14;
      ctx.fillStyle = colors.fg1;
      ctx.beginPath();
      ctx.arc(moonCenterX, moonCenterY, moonR, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;

      ctx.fillStyle = colors.fg2;
      ctx.font = "12px monospace";
      ctx.textAlign = "center";
      ctx.fillText("Moon", moonCenterX, moonCenterY + moonR + 18);

      // Tidal force vectors
      const numPoints = 16;
      const dNorm = distToMoon / earthR;
      const arrowScale = earthR * 2.0;

      for (let i = 0; i < numPoints; i++) {
        const theta = (i / numPoints) * Math.PI * 2;
        const surfX = cx + earthR * Math.cos(theta);
        const surfY = cy + earthR * Math.sin(theta);

        const tidalFx =
          ((2 * Math.cos(theta)) / Math.pow(dNorm, 3)) * arrowScale;
        const tidalFy =
          ((-Math.sin(theta)) / Math.pow(dNorm, 3)) * arrowScale;

        const arrowLen = Math.sqrt(tidalFx * tidalFx + tidalFy * tidalFy);
        const maxArrow = earthR * 0.7;
        const clampedScale = arrowLen > maxArrow ? maxArrow / arrowLen : 1;

        const arrowColor =
          Math.abs(Math.cos(theta)) > Math.abs(Math.sin(theta))
            ? "#5BE9FF"
            : "#FF6B6B";

        drawArrow(
          ctx,
          surfX,
          surfY,
          tidalFx * clampedScale,
          tidalFy * clampedScale,
          arrowColor,
        );
      }

      // Readout
      const forceMag = 1 / Math.pow(moonDist, 3);
      ctx.fillStyle = colors.fg2;
      ctx.font = "12px monospace";
      ctx.textAlign = "left";
      ctx.fillText(
        `tidal force ~ 1/r\u00B3 \u2248 ${forceMag.toFixed(2)} (relative)`,
        10,
        height - 12,
      );

      // Legend
      ctx.fillStyle = "#5BE9FF";
      ctx.fillRect(width - 160, height - 36, 10, 10);
      ctx.fillStyle = colors.fg2;
      ctx.font = "11px sans-serif";
      ctx.textAlign = "left";
      ctx.fillText("stretching", width - 145, height - 27);

      ctx.fillStyle = "#FF6B6B";
      ctx.fillRect(width - 160, height - 20, 10, 10);
      ctx.fillStyle = colors.fg2;
      ctx.fillText("compression", width - 145, height - 11);
    },
  });

  return (
    <div ref={containerRef} className="w-full pb-4">
      <canvas ref={canvasRef} style={{ width, height }} className="block" />
      <div className="mt-2 flex items-center gap-3 px-2">
        <label className="text-sm text-[var(--color-fg-3)]">
          Moon distance
        </label>
        <input
          type="range"
          min={0.25}
          max={0.85}
          step={0.01}
          value={moonDist}
          onChange={(e) => setMoonDist(parseFloat(e.target.value))}
          className="flex-1 accent-[#5BE9FF]"
        />
        <span className="w-12 text-right font-mono text-sm text-[var(--color-fg-1)]">
          {moonDist.toFixed(2)}
        </span>
      </div>
    </div>
  );
}
