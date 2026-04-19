"use client";

import { useEffect, useRef, useState } from "react";
import { useAnimationFrame } from "@/lib/animation/use-animation-frame";
import { useThemeColors } from "@/lib/hooks/use-theme-colors";

const RATIO = 0.55;
const MAX_HEIGHT = 340;

/**
 * Period correction for a finite-amplitude pendulum. The small-angle
 * formula T₀ = 2π√(l/g) is a straight line at T/T₀ = 1; the exact period
 * rises as amplitude grows, diverging logarithmically as θ₀ → π. The
 * exact curve is an elliptic integral of the first kind. A moving marker
 * shows the current amplitude; side plot shows T/T₀ crossing 1.5 near
 * 140°.
 */
export function EllipticIntegralScene() {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const colors = useThemeColors();
  const [size, setSize] = useState({ width: 640, height: 340 });

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

  // K(k) — complete elliptic integral of the first kind, AGM method.
  const ellipticK = (k: number): number => {
    if (k >= 1) return Number.POSITIVE_INFINITY;
    let a = 1;
    let b = Math.sqrt(1 - k * k);
    for (let i = 0; i < 20; i++) {
      const an = (a + b) / 2;
      const bn = Math.sqrt(a * b);
      a = an;
      b = bn;
      if (Math.abs(a - b) < 1e-14) break;
    }
    return Math.PI / (2 * a);
  };

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

      // Axes: θ₀ horizontal (0..170°), T/T₀ vertical (1..2)
      const left = 60;
      const right = width - 40;
      const top = 40;
      const bottom = height - 48;
      const xMax = 170; // degrees
      const yMin = 1;
      const yMax = 2.2;

      const toX = (deg: number) => left + (deg / xMax) * (right - left);
      const toY = (r: number) => bottom - ((r - yMin) / (yMax - yMin)) * (bottom - top);

      // Axes
      ctx.strokeStyle = colors.fg3;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(left, top);
      ctx.lineTo(left, bottom);
      ctx.lineTo(right, bottom);
      ctx.stroke();
      ctx.font = "10px monospace";
      ctx.fillStyle = colors.fg2;
      ctx.textAlign = "right";
      ctx.fillText("T/T₀", left - 8, top + 4);
      ctx.textAlign = "center";
      ctx.fillText("θ₀ (°)", (left + right) / 2, bottom + 24);

      // Y ticks
      for (let y = yMin; y <= yMax; y += 0.25) {
        const py = toY(y);
        ctx.beginPath();
        ctx.moveTo(left - 3, py);
        ctx.lineTo(left, py);
        ctx.stroke();
        ctx.textAlign = "right";
        ctx.fillText(y.toFixed(2), left - 5, py + 3);
      }
      // X ticks
      for (let x = 0; x <= xMax; x += 30) {
        const px = toX(x);
        ctx.beginPath();
        ctx.moveTo(px, bottom);
        ctx.lineTo(px, bottom + 3);
        ctx.stroke();
        ctx.textAlign = "center";
        ctx.fillText(String(x), px, bottom + 14);
      }

      // Small-angle approximation line (constant 1)
      ctx.strokeStyle = colors.fg3;
      ctx.setLineDash([3, 5]);
      ctx.beginPath();
      ctx.moveTo(toX(0), toY(1));
      ctx.lineTo(toX(xMax), toY(1));
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle = colors.fg2;
      ctx.textAlign = "left";
      ctx.fillText("small-angle T₀", toX(115), toY(1) - 6);

      // Exact curve: T/T₀ = (2/π) · K(sin(θ₀/2))
      ctx.strokeStyle = colors.magenta;
      ctx.lineWidth = 2;
      ctx.beginPath();
      let first = true;
      for (let deg = 0; deg <= xMax; deg += 1) {
        const rad = (deg * Math.PI) / 180;
        const k = Math.sin(rad / 2);
        const ratio = (2 / Math.PI) * ellipticK(k);
        if (ratio > yMax) continue;
        const px = toX(deg);
        const py = toY(ratio);
        if (first) {
          ctx.moveTo(px, py);
          first = false;
        } else ctx.lineTo(px, py);
      }
      ctx.stroke();

      // Animated marker
      const period = 8;
      const u = (t % period) / period;
      const deg = u * xMax;
      const rad = (deg * Math.PI) / 180;
      const k = Math.sin(rad / 2);
      const ratio = (2 / Math.PI) * ellipticK(k);
      const mx = toX(deg);
      const my = toY(Math.min(ratio, yMax));
      ctx.fillStyle = colors.magenta;
      ctx.shadowColor = colors.magenta;
      ctx.shadowBlur = 10;
      ctx.beginPath();
      ctx.arc(mx, my, 5, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;

      // Legend
      ctx.fillStyle = colors.fg1;
      ctx.font = "11px monospace";
      ctx.textAlign = "left";
      ctx.fillText("T/T₀ = (2/π) · K(sin θ₀/2)", 16, 24);
    },
  });

  return (
    <div ref={containerRef} className="w-full pb-4">
      <canvas ref={canvasRef} style={{ width: size.width, height: size.height }} className="block" />
    </div>
  );
}
