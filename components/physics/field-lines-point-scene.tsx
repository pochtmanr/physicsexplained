"use client";

import { useEffect, useRef, useState } from "react";
import { useAnimationFrame } from "@/lib/animation/use-animation-frame";
import { useThemeColors } from "@/lib/hooks/use-theme-colors";

const RATIO = 0.62;
const MAX_HEIGHT = 360;
const N_LINES = 16;
const ARROW_DRIFT_SPEED = 0.18; // fraction of line length per second

export function FieldLinesPointScene() {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const colors = useThemeColors();
  const [sign, setSign] = useState<1 | -1>(1);
  const [size, setSize] = useState({ width: 480, height: 300 });

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

      ctx.clearRect(0, 0, width, height);

      const cx = width / 2;
      const cy = height / 2;
      const inner = 18; // start lines at the edge of the charge glyph
      const outer = Math.min(width, height) / 2 - 12;

      // Draw lines
      ctx.strokeStyle = "rgba(111, 184, 198, 0.65)";
      ctx.lineWidth = 1;
      for (let i = 0; i < N_LINES; i++) {
        const angle = (i / N_LINES) * Math.PI * 2;
        const cos = Math.cos(angle);
        const sin = Math.sin(angle);
        ctx.beginPath();
        ctx.moveTo(cx + cos * inner, cy + sin * inner);
        ctx.lineTo(cx + cos * outer, cy + sin * outer);
        ctx.stroke();

        // Drifting arrow head along each line — shows direction of E
        const phase = (t * ARROW_DRIFT_SPEED + i * 0.04) % 1;
        const r = inner + (outer - inner) * phase;
        const arrowR = sign === 1 ? r : inner + (outer - inner) * (1 - phase);
        const ax = cx + cos * arrowR;
        const ay = cy + sin * arrowR;
        const dir = sign === 1 ? 1 : -1;
        const dx = cos * dir;
        const dy = sin * dir;
        const aSize = 5;
        // Triangle pointing along (dx, dy)
        ctx.fillStyle = "#6FB8C6";
        ctx.beginPath();
        ctx.moveTo(ax + dx * aSize, ay + dy * aSize);
        ctx.lineTo(ax - dx * aSize - dy * aSize * 0.6, ay - dy * aSize + dx * aSize * 0.6);
        ctx.lineTo(ax - dx * aSize + dy * aSize * 0.6, ay - dy * aSize - dx * aSize * 0.6);
        ctx.closePath();
        ctx.fill();
      }

      // Draw the central charge
      ctx.shadowColor =
        sign === 1 ? "rgba(255, 200, 100, 0.55)" : "rgba(120, 180, 255, 0.55)";
      ctx.shadowBlur = 18;
      ctx.fillStyle = sign === 1 ? "#F2C570" : "#7AB6FF";
      ctx.beginPath();
      ctx.arc(cx, cy, 12, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;

      // Plus or minus glyph on top
      ctx.fillStyle = "#0B1018";
      ctx.font = "bold 16px monospace";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(sign === 1 ? "+" : "−", cx, cy + 1);

      // HUD
      ctx.fillStyle = colors.fg1;
      ctx.font = "12px monospace";
      ctx.textAlign = "left";
      ctx.textBaseline = "alphabetic";
      ctx.fillText(`q = ${sign === 1 ? "+" : "−"}1   E ∝ 1/r²`, 14, 20);
      ctx.textAlign = "right";
      ctx.fillText(
        sign === 1 ? "lines radiate outward" : "lines converge inward",
        width - 14,
        20,
      );
    },
  });

  return (
    <div ref={containerRef} className="w-full pb-4">
      <canvas
        ref={canvasRef}
        style={{ width: size.width, height: size.height }}
        className="block"
      />
      <div className="mt-2 flex items-center gap-3 px-2 font-mono text-xs">
        <span className="text-[var(--color-fg-3)]">SIGN</span>
        <button
          type="button"
          onClick={() => setSign(1)}
          className={`rounded border px-3 py-1 transition-colors ${
            sign === 1
              ? "border-[var(--color-cyan)] text-[var(--color-cyan)]"
              : "border-[var(--color-fg-4)] text-[var(--color-fg-3)] hover:text-[var(--color-fg-1)]"
          }`}
        >
          +
        </button>
        <button
          type="button"
          onClick={() => setSign(-1)}
          className={`rounded border px-3 py-1 transition-colors ${
            sign === -1
              ? "border-[var(--color-cyan)] text-[var(--color-cyan)]"
              : "border-[var(--color-fg-4)] text-[var(--color-fg-3)] hover:text-[var(--color-fg-1)]"
          }`}
        >
          −
        </button>
      </div>
    </div>
  );
}
