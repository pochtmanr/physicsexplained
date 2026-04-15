"use client";

import { useEffect, useRef, useState } from "react";
import { useThemeColors } from "@/lib/hooks/use-theme-colors";

const RATIO = 0.6;
const MAX_HEIGHT = 340;

// x(t) = 0.5 t^2 + 0.3 t  →  x'(t) = t + 0.3
function x(t: number) {
  return 0.5 * t * t + 0.3 * t;
}

export function TangentZoomScene() {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const colors = useThemeColors();
  const [t0, setT0] = useState(1.4);
  const [dt, setDt] = useState(1.0);
  const [size, setSize] = useState({ width: 640, height: 340 });

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const ro = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const w = entry.contentRect.width;
        if (w > 0) {
          setSize({ width: w, height: Math.min(w * RATIO, MAX_HEIGHT) });
        }
      }
    });
    ro.observe(container);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
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

    const padL = 44;
    const padR = 16;
    const padT = 20;
    const padB = 34;
    const plotW = width - padL - padR;
    const plotH = height - padT - padB;

    const tMin = 0;
    const tMax = 3;
    const xMin = 0;
    const xMax = x(tMax) + 0.3;

    const toPx = (tt: number, xx: number) => ({
      px: padL + ((tt - tMin) / (tMax - tMin)) * plotW,
      py: padT + plotH - ((xx - xMin) / (xMax - xMin)) * plotH,
    });

    // Axes
    ctx.strokeStyle = colors.fg3;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(padL, padT);
    ctx.lineTo(padL, padT + plotH);
    ctx.lineTo(padL + plotW, padT + plotH);
    ctx.stroke();

    // Axis labels
    ctx.fillStyle = colors.fg2;
    ctx.font = "11px monospace";
    ctx.textAlign = "center";
    ctx.fillText("t", padL + plotW, padT + plotH + 22);
    ctx.textAlign = "right";
    ctx.fillText("x", padL - 6, padT + 10);

    // The curve x(t)
    ctx.strokeStyle = colors.fg1;
    ctx.lineWidth = 2;
    ctx.beginPath();
    const steps = 200;
    for (let i = 0; i <= steps; i++) {
      const tt = tMin + (i / steps) * (tMax - tMin);
      const { px, py } = toPx(tt, x(tt));
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.stroke();

    // Two points: (t0, x(t0)) and (t0+dt, x(t0+dt))
    const tA = t0;
    const tB = Math.min(tMax - 0.02, t0 + dt);
    const xA = x(tA);
    const xB = x(tB);
    const slope = (xB - xA) / (tB - tA);

    // Secant extended across the plot
    ctx.strokeStyle = "#5BE9FF";
    ctx.lineWidth = 1.5;
    ctx.setLineDash([5, 4]);
    const secLeft = toPx(tMin, xA + slope * (tMin - tA));
    const secRight = toPx(tMax, xA + slope * (tMax - tA));
    ctx.beginPath();
    ctx.moveTo(secLeft.px, secLeft.py);
    ctx.lineTo(secRight.px, secRight.py);
    ctx.stroke();
    ctx.setLineDash([]);

    // Two endpoint dots
    const pA = toPx(tA, xA);
    const pB = toPx(tB, xB);
    ctx.fillStyle = "#5BE9FF";
    ctx.beginPath();
    ctx.arc(pA.px, pA.py, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(pB.px, pB.py, 5, 0, Math.PI * 2);
    ctx.fill();

    // Rise/run rectangle
    ctx.strokeStyle = colors.fg3;
    ctx.setLineDash([2, 3]);
    ctx.beginPath();
    ctx.moveTo(pA.px, pA.py);
    ctx.lineTo(pB.px, pA.py);
    ctx.lineTo(pB.px, pB.py);
    ctx.stroke();
    ctx.setLineDash([]);

    // Slope readout
    const trueSlope = tA + 0.3;
    ctx.fillStyle = colors.fg1;
    ctx.font = "12px monospace";
    ctx.textAlign = "left";
    ctx.fillText(
      `slope (secant) = Δx/Δt = ${slope.toFixed(3)}`,
      padL + 6,
      padT + 16,
    );
    ctx.fillStyle = colors.fg2;
    ctx.fillText(
      `true tangent slope at t = ${tA.toFixed(2)}:  ${trueSlope.toFixed(3)}`,
      padL + 6,
      padT + 34,
    );
  }, [t0, dt, size, colors]);

  return (
    <div ref={containerRef} className="w-full pb-4">
      <canvas
        ref={canvasRef}
        style={{ width: size.width, height: size.height }}
        className="block"
      />
      <div className="mt-2 flex flex-col gap-2 px-2">
        <div className="flex items-center gap-3">
          <label className="w-16 text-sm text-[var(--color-fg-2)]">t</label>
          <input
            type="range"
            min={0.2}
            max={2.4}
            step={0.01}
            value={t0}
            onChange={(e) => setT0(parseFloat(e.target.value))}
            className="flex-1 accent-[#5BE9FF]"
          />
          <span className="w-12 text-right text-sm font-mono text-[var(--color-fg-1)]">
            {t0.toFixed(2)}
          </span>
        </div>
        <div className="flex items-center gap-3">
          <label className="w-16 text-sm text-[var(--color-fg-2)]">Δt</label>
          <input
            type="range"
            min={0.01}
            max={1.5}
            step={0.01}
            value={dt}
            onChange={(e) => setDt(parseFloat(e.target.value))}
            className="flex-1 accent-[#5BE9FF]"
          />
          <span className="w-12 text-right text-sm font-mono text-[var(--color-fg-1)]">
            {dt.toFixed(2)}
          </span>
        </div>
      </div>
    </div>
  );
}
