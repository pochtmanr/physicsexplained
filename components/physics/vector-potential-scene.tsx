"use client";

import { useEffect, useRef, useState } from "react";
import { useAnimationFrame } from "@/lib/animation/use-animation-frame";
import { useThemeColors } from "@/lib/hooks/use-theme-colors";
import { aFromSolenoid } from "@/lib/physics/electromagnetism/vector-potential";

const RATIO = 0.66;
const MAX_HEIGHT = 440;

/**
 * The vector potential A around an infinite ideal solenoid.
 *
 * The solenoid (radius R) is shown as a circle in the page; B (out of page,
 * uniform inside) is drawn as a dot pattern only inside R. Outside, B = 0
 * — but A still circulates azimuthally, falling off only as 1/r.
 *
 * Visual punchline: the cyan B-dots stop sharply at r = R, while the amber
 * A-arrows keep spinning all the way to the edge of the canvas. Aharonov
 * and Bohm asked, in 1959, what an electron should care about — the answer
 * is the looped integral of A, which is nonzero out here. Topic §12.
 */
export function VectorPotentialScene() {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const colors = useThemeColors();
  const [size, setSize] = useState({ width: 640, height: 420 });

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

      // World: 1 unit = the solenoid radius R. Place R = 0.25 m for scale.
      const R = 0.25;
      const B_in = 1.0; // tesla — only the shape matters here.
      const halfWorld = 1.1; // canvas spans ±halfWorld m
      const cx = width / 2;
      const cy = height / 2;
      const scale = Math.min(width, height) * 0.45;
      const mToPx = (xM: number, yM: number) => ({
        x: cx + xM * scale,
        y: cy - yM * scale,
      });

      // ---- background: B-field hint inside the solenoid (out-of-page dots) ----
      const Rpx = R * scale;
      ctx.fillStyle = "rgba(120, 220, 255, 0.13)";
      ctx.beginPath();
      ctx.arc(cx, cy, Rpx, 0, Math.PI * 2);
      ctx.fill();

      // Out-of-page dot grid inside the disk
      ctx.fillStyle = "rgba(120, 220, 255, 0.85)";
      const dotSpacing = Math.max(14, Rpx / 4);
      for (let y = cy - Rpx; y <= cy + Rpx; y += dotSpacing) {
        for (let x = cx - Rpx; x <= cx + Rpx; x += dotSpacing) {
          const dr = Math.hypot(x - cx, y - cy);
          if (dr > Rpx - 6) continue;
          ctx.beginPath();
          ctx.arc(x, y, 2.4, 0, Math.PI * 2);
          ctx.fill();
          // outer ring for the "dot inside circle" look
          ctx.strokeStyle = "rgba(120, 220, 255, 0.45)";
          ctx.lineWidth = 0.8;
          ctx.beginPath();
          ctx.arc(x, y, 4.5, 0, Math.PI * 2);
          ctx.stroke();
        }
      }

      // Solenoid boundary (the wire cross-section)
      ctx.strokeStyle = "rgba(120, 220, 255, 0.95)";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(cx, cy, Rpx, 0, Math.PI * 2);
      ctx.stroke();

      // ---- A-field: arrows tangent to circles, magnitude from aFromSolenoid ----
      // Sample on a polar grid for a clean swirl.
      const ringRadii: number[] = [];
      // inside rings
      for (const f of [0.35, 0.7]) ringRadii.push(f * R);
      // outside rings: spaced so the 1/r falloff is visible
      for (const f of [1.25, 1.65, 2.2, 2.9, 3.7]) ringRadii.push(f * R);

      // Find max |A| for arrow normalization
      let aMax = 0;
      for (const r of ringRadii) {
        const a = Math.abs(aFromSolenoid(B_in, R, r));
        if (a > aMax) aMax = a;
      }

      // Slow rotation of the seed angle so the arrows "breathe" (purely cosmetic)
      const rot = t / 8000;

      const arrowMaxPx = 26;
      for (const r of ringRadii) {
        const a = aFromSolenoid(B_in, R, r);
        const isInside = r < R;
        const seeds = Math.max(8, Math.round(2 * Math.PI * r * scale * 0.04));
        for (let k = 0; k < seeds; k++) {
          const phi = (k / seeds) * Math.PI * 2 + rot;
          const xM = r * Math.cos(phi);
          const yM = r * Math.sin(phi);
          if (Math.abs(xM) > halfWorld || Math.abs(yM) > halfWorld) continue;
          const p = mToPx(xM, yM);

          // Tangent direction (counterclockwise for +A_φ)
          const tx = -Math.sin(phi);
          const ty = Math.cos(phi);
          // Screen y is flipped
          const sx = tx;
          const sy = -ty;

          const norm = Math.abs(a) / (aMax || 1);
          const len = Math.max(8, norm * arrowMaxPx);
          const x1 = p.x + sx * len;
          const y1 = p.y + sy * len;

          const color = isInside
            ? "rgba(255, 214, 107, 0.55)"
            : "rgba(255, 214, 107, 0.95)";
          ctx.strokeStyle = color;
          ctx.fillStyle = color;
          ctx.lineWidth = 1.4;
          ctx.beginPath();
          ctx.moveTo(p.x, p.y);
          ctx.lineTo(x1, y1);
          ctx.stroke();

          // arrowhead
          const ah = 5;
          ctx.beginPath();
          ctx.moveTo(x1, y1);
          ctx.lineTo(x1 - sx * ah - sy * ah * 0.5, y1 - sy * ah + sx * ah * 0.5);
          ctx.lineTo(x1 - sx * ah + sy * ah * 0.5, y1 - sy * ah - sx * ah * 0.5);
          ctx.closePath();
          ctx.fill();
        }
      }

      // Faint A-field-line hints (concentric circles, dashed)
      ctx.strokeStyle = "rgba(255, 214, 107, 0.18)";
      ctx.setLineDash([3, 5]);
      ctx.lineWidth = 1;
      for (const r of ringRadii) {
        ctx.beginPath();
        ctx.arc(cx, cy, r * scale, 0, Math.PI * 2);
        ctx.stroke();
      }
      ctx.setLineDash([]);

      // HUD
      ctx.fillStyle = colors.fg2;
      ctx.font = "11px monospace";
      ctx.textAlign = "left";
      ctx.fillText("inside: B ⊙ uniform · outside: B = 0", 12, 16);
      ctx.textAlign = "right";
      ctx.fillText("A keeps circulating where B has nothing to say", width - 12, 16);

      // Label R on the solenoid
      ctx.fillStyle = "rgba(120, 220, 255, 0.95)";
      ctx.font = "bold 11px monospace";
      ctx.textAlign = "left";
      ctx.fillText("R", cx + Rpx + 6, cy - 4);
    },
  });

  return (
    <div ref={containerRef} className="w-full pb-4">
      <canvas
        ref={canvasRef}
        style={{ width: size.width, height: size.height }}
        className="block"
      />
      <div className="mt-2 px-2 font-mono text-xs text-[var(--color-fg-3)]">
        cyan dots = B out of page (inside only) · amber arrows = vector
        potential A (continues outside, 1/r falloff)
      </div>
    </div>
  );
}
