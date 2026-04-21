"use client";

import { useEffect, useRef, useState } from "react";
import { generateWavefronts } from "@/lib/physics/doppler";
import { useAnimationFrame } from "@/lib/animation/use-animation-frame";
import { useThemeColors } from "@/lib/hooks/use-theme-colors";

const RATIO = 0.62;
const MAX_HEIGHT = 420;

/**
 * A source travels left to right across a "pond." It emits a spherical
 * wavefront every T seconds. The slider sets the Mach number (v / c).
 *
 *   M < 1  — wavefronts compress ahead, stretch behind. Classical Doppler.
 *   M = 1  — wavefronts all touch at the source. Sonic wall.
 *   M > 1  — wavefronts pile up on a cone. The Mach cone.
 *
 * Time and space are in unit-less scene coordinates (c = 1 in the scene).
 */
export function DopplerScene() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const colors = useThemeColors();
  const [mach, setMach] = useState(0.6);
  const [size, setSize] = useState({ width: 560, height: 360 });
  const tStartRef = useRef<number | null>(null);

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

  const { width, height } = size;

  // Scene constants — unitless. c = 1, so mach is literally the source speed.
  const c = 1;
  const period = 0.6;
  const nWavefronts = 18;

  // World coordinates: source travels from x = 0 to x = X_SPAN, resets.
  const X_SPAN = 18;
  const yMid = 0; // source stays on x-axis in world units

  // View transform: fit [xMin, xMax] × [−H/2, H/2] into canvas.
  const margin = 16;
  const viewW = width - 2 * margin;
  const viewH = height - 2 * margin - 8;
  const scale = Math.min(viewW / X_SPAN, viewH / 6.5);
  const ox = margin + viewW / 2 - (scale * X_SPAN) / 2;
  const oyMid = margin + viewH / 2;

  const worldToPx = (wx: number, wy: number) => ({
    x: ox + wx * scale,
    y: oyMid - wy * scale,
  });

  useAnimationFrame({
    elementRef: containerRef,
    onFrame: (t) => {
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

      if (tStartRef.current === null) tStartRef.current = t;
      let tLocal = t - tStartRef.current;

      // Loop: source crosses the scene, then restart. This stays visually
      // clear without piling up stale wavefronts.
      const traverseTime =
        mach > 0.01 ? X_SPAN / (mach * c) : 1e9; // effectively paused at M=0
      const tEffective = tLocal % traverseTime;

      const fronts = generateWavefronts({
        vSource: mach * c,
        c,
        period,
        tNow: tEffective,
        nWavefronts,
      });

      // Clear
      ctx.clearRect(0, 0, width, height);

      // Baseline
      ctx.strokeStyle = colors.fg3;
      ctx.lineWidth = 1;
      ctx.beginPath();
      const baseL = worldToPx(0, 0);
      const baseR = worldToPx(X_SPAN, 0);
      ctx.moveTo(baseL.x, baseL.y);
      ctx.lineTo(baseR.x, baseR.y);
      ctx.stroke();

      // Wavefronts (only the portions inside the canvas get drawn)
      for (const f of fronts) {
        const center = worldToPx(f.xEmit, f.yEmit);
        const rPx = f.radius * scale;
        if (rPx < 0.5) continue;

        // Older fronts fade slightly
        const age = tEffective - f.tEmit;
        const ageMax = nWavefronts * period;
        const alpha = Math.max(0.25, 1 - age / ageMax);
        ctx.strokeStyle = withAlpha("#6FB8C6", alpha);
        ctx.lineWidth = 1.25;
        ctx.beginPath();
        ctx.arc(center.x, center.y, rPx, 0, Math.PI * 2);
        ctx.stroke();
      }

      // Mach cone overlay if M > 1
      if (mach > 1) {
        const sinTheta = 1 / mach;
        const cosTheta = Math.sqrt(1 - sinTheta * sinTheta);
        // Source position right now in world coordinates
        const sxWorld = mach * c * tEffective;
        const src = worldToPx(sxWorld, 0);

        // Cone extends backward from source; project along ±y
        const coneLenWorld = X_SPAN; // long enough to exit the view
        const tipL = worldToPx(
          sxWorld - coneLenWorld * sinTheta,
          coneLenWorld * cosTheta,
        );
        const tipR = worldToPx(
          sxWorld - coneLenWorld * sinTheta,
          -coneLenWorld * cosTheta,
        );

        ctx.strokeStyle = "#FFD93D";
        ctx.lineWidth = 1.5;
        ctx.setLineDash([6, 5]);
        ctx.beginPath();
        ctx.moveTo(tipL.x, tipL.y);
        ctx.lineTo(src.x, src.y);
        ctx.lineTo(tipR.x, tipR.y);
        ctx.stroke();
        ctx.setLineDash([]);
      }

      // Source
      const sxWorld = mach * c * tEffective;
      const src = worldToPx(sxWorld, 0);
      ctx.shadowColor = "rgba(255, 107, 107, 0.7)";
      ctx.shadowBlur = 14;
      ctx.fillStyle = "#FF6B6B";
      ctx.beginPath();
      ctx.arc(src.x, src.y, 5, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;

      // HUD text
      ctx.fillStyle = colors.fg1;
      ctx.font = "12px monospace";
      ctx.textAlign = "left";
      ctx.fillText(`v / c = ${mach.toFixed(2)}`, margin + 6, margin + 14);
      const regime =
        mach < 0.99
          ? "subsonic"
          : mach < 1.01
            ? "sonic wall"
            : "supersonic";
      ctx.fillStyle =
        regime === "supersonic"
          ? "#FFD93D"
          : regime === "sonic wall"
            ? "#FF6B6B"
            : colors.fg2;
      ctx.fillText(regime, margin + 6, margin + 30);

      if (mach > 1) {
        const angleDeg = (Math.asin(1 / mach) * 180) / Math.PI;
        ctx.fillStyle = colors.fg2;
        ctx.textAlign = "right";
        ctx.fillText(
          `Mach cone half-angle = ${angleDeg.toFixed(1)}\u00B0`,
          width - margin - 4,
          margin + 14,
        );
      }
    },
  });

  return (
    <div ref={containerRef} className="w-full pb-4">
      <canvas ref={canvasRef} style={{ width, height }} className="block" />
      <div className="mt-2 flex items-center gap-3 px-2">
        <label className="text-sm text-[var(--color-fg-3)]">Source speed (v / c)</label>
        <input
          type="range"
          min={0}
          max={2.2}
          step={0.02}
          value={mach}
          onChange={(e) => {
            setMach(parseFloat(e.target.value));
            tStartRef.current = null;
          }}
          className="flex-1 accent-[#6FB8C6]"
        />
        <span className="w-12 text-right text-sm font-mono text-[var(--color-fg-1)]">
          {mach.toFixed(2)}
        </span>
      </div>
    </div>
  );
}

function withAlpha(hex: string, alpha: number): string {
  // Convert "#RRGGBB" to "rgba(r,g,b,a)"
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha.toFixed(3)})`;
}
