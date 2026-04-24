"use client";

import { useEffect, useRef, useState } from "react";
import { useAnimationFrame } from "@/lib/animation/use-animation-frame";
import { useThemeColors } from "@/lib/hooks/use-theme-colors";

/**
 * FIG.52a — Larmor's sin²θ radiation lobe.
 *
 * Polar-plot of dP/dΩ ∝ sin²θ, where θ is measured from the instantaneous
 * acceleration vector. The resulting 2D cross-section is the "doughnut":
 * two symmetric blobs broadside to the acceleration, with a null along
 * the acceleration axis itself. The charge sits at the centre; a magenta
 * arrow indicates the instantaneous acceleration direction (vertical in
 * the canvas, for readability). The user slider controls acceleration
 * magnitude — this is a visual flourish only: the angular pattern is
 * purely sin²θ, independent of |a|, but the lobe-amplitude rendering
 * (and the small HUD readout "P = q²a²/(6π ε₀ c³)") scales with a² to
 * make the quadratic scaling legible.
 *
 * Palette:
 *   magenta  — positive charge + acceleration arrow
 *   lilac    — radiation lobe outline + fill
 *   amber    — emitted-light arrows at the lobe peaks
 */

const RATIO = 0.62;
const MAX_HEIGHT = 380;

export function LarmorRadiationLobeScene() {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const colors = useThemeColors();

  // Acceleration magnitude in "scene units" — 0.2 to 1.0 maps linearly
  // to lobe fill density so the viewer sees the P ∝ a² effect even
  // though the sin²θ shape is invariant.
  const [aScene, setAScene] = useState(0.6);
  const aRef = useRef(aScene);
  useEffect(() => {
    aRef.current = aScene;
  }, [aScene]);

  const [size, setSize] = useState({ width: 640, height: 380 });
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const w = entry.contentRect.width;
        if (w > 0) {
          setSize({ width: w, height: Math.min(w * RATIO, MAX_HEIGHT) });
        }
      }
    });
    ro.observe(el);
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

      const cx = width * 0.5;
      const cy = height * 0.55;
      const maxR = Math.min(width, height) * 0.38;

      const a = aRef.current; // 0..1
      const a2 = a * a;

      // ── polar grid ──
      ctx.strokeStyle = colors.fg3;
      ctx.lineWidth = 1;
      ctx.setLineDash([2, 4]);
      for (let k = 1; k <= 3; k++) {
        ctx.beginPath();
        ctx.arc(cx, cy, (k / 3) * maxR, 0, Math.PI * 2);
        ctx.stroke();
      }
      ctx.setLineDash([]);

      // ── acceleration axis (vertical dashed line) ──
      ctx.strokeStyle = "rgba(255, 106, 222, 0.35)";
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.moveTo(cx, cy - maxR * 1.1);
      ctx.lineTo(cx, cy + maxR * 1.1);
      ctx.stroke();
      ctx.setLineDash([]);

      // ── equatorial (broadside) line ──
      ctx.strokeStyle = colors.fg3;
      ctx.beginPath();
      ctx.moveTo(cx - maxR * 1.15, cy);
      ctx.lineTo(cx + maxR * 1.15, cy);
      ctx.stroke();

      // ── sin²θ lobe (polar plot) ──
      // r(θ) = sin²θ · maxR · a, where θ is measured from the vertical
      // acceleration axis. Parametrise angle φ as the scene angle from
      // +y so that sin²θ peaks on the horizontal axis.
      ctx.beginPath();
      const samples = 240;
      for (let i = 0; i <= samples; i++) {
        const phi = (i / samples) * Math.PI * 2;
        // θ from the vertical accel axis is just phi itself (with y-up).
        const s = Math.sin(phi);
        const r = s * s * maxR * 0.92 * Math.sqrt(a2 + 0.05); // keep lobe visible even at low a
        const px = cx + r * Math.sin(phi);
        const py = cy - r * Math.cos(phi);
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.closePath();
      // fill alpha ramps with a² — this is the visual proxy for P ∝ a²
      const fillAlpha = 0.08 + 0.22 * a2;
      ctx.fillStyle = `rgba(200, 160, 255, ${fillAlpha.toFixed(3)})`;
      ctx.fill();
      ctx.strokeStyle = "rgba(200, 160, 255, 0.85)";
      ctx.lineWidth = 1.6;
      ctx.stroke();

      // ── outgoing amber arrows at the two lobe peaks (broadside) ──
      const peakAnim = (Math.sin(t * 2.2) + 1) * 0.5; // 0..1
      const peakAlpha = 0.55 + 0.4 * peakAnim;
      const peak = maxR * 0.9 * Math.sqrt(a2 + 0.05);
      drawArrow(
        ctx,
        cx + peak * 0.35,
        cy,
        cx + peak * 1.0,
        cy,
        `rgba(255, 180, 80, ${peakAlpha.toFixed(3)})`,
        2,
      );
      drawArrow(
        ctx,
        cx - peak * 0.35,
        cy,
        cx - peak * 1.0,
        cy,
        `rgba(255, 180, 80, ${peakAlpha.toFixed(3)})`,
        2,
      );

      // ── charge dot at origin + acceleration arrow (upward) ──
      ctx.fillStyle = "#FF6ADE";
      ctx.beginPath();
      ctx.arc(cx, cy, 4.5, 0, Math.PI * 2);
      ctx.fill();
      const aArrowLen = maxR * 0.28 * (0.4 + 0.6 * a);
      drawArrow(
        ctx,
        cx,
        cy,
        cx,
        cy - aArrowLen,
        "rgba(255, 106, 222, 0.95)",
        2.4,
      );

      // ── labels ──
      ctx.fillStyle = colors.fg2;
      ctx.font = "11px monospace";
      ctx.textAlign = "center";
      ctx.fillText("a", cx + 10, cy - aArrowLen - 4);
      ctx.fillText("null", cx, cy - maxR * 1.13);
      ctx.fillText("null", cx, cy + maxR * 1.13 + 10);
      ctx.textAlign = "left";
      ctx.fillStyle = "rgba(255, 180, 80, 0.9)";
      ctx.fillText("max", cx + peak * 1.02, cy - 4);
      ctx.textAlign = "right";
      ctx.fillText("max", cx - peak * 1.02, cy - 4);

      // ── HUD ──
      ctx.fillStyle = colors.fg1;
      ctx.font = "12px monospace";
      ctx.textAlign = "left";
      ctx.fillText("dP/dΩ ∝ sin²θ", 14, 22);
      ctx.textAlign = "right";
      ctx.fillStyle = colors.fg2;
      ctx.fillText("Larmor — doughnut about a", width - 14, 22);

      // Footer
      ctx.fillStyle = colors.fg2;
      ctx.font = "10px monospace";
      ctx.textAlign = "center";
      ctx.fillText(
        "charge accelerates up; light streams out broadside",
        width / 2,
        height - 10,
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
      <div className="mt-2 flex items-center gap-3 px-2">
        <label className="text-sm text-[var(--color-fg-3)]">|a|</label>
        <input
          type="range"
          min={0.15}
          max={1}
          step={0.01}
          value={aScene}
          onChange={(e) => setAScene(parseFloat(e.target.value))}
          className="flex-1 accent-[#FF6ADE]"
        />
        <span className="w-16 text-right text-sm font-mono text-[var(--color-fg-1)]">
          P ∝ {(aScene * aScene).toFixed(2)}
        </span>
      </div>
      <div className="mt-1 px-2 text-xs text-[var(--color-fg-3)]">
        Shape is sin²θ regardless of |a|. Double |a| → 4× total power. The lobe
        fill darkens quadratically to make the a² scaling visible.
      </div>
    </div>
  );
}

function drawArrow(
  ctx: CanvasRenderingContext2D,
  x0: number,
  y0: number,
  x1: number,
  y1: number,
  color: string,
  lineWidth: number,
) {
  const dx = x1 - x0;
  const dy = y1 - y0;
  const len = Math.hypot(dx, dy);
  if (len < 0.5) return;
  const ux = dx / len;
  const uy = dy / len;
  const head = Math.min(8, len * 0.3);
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineWidth = lineWidth;
  ctx.beginPath();
  ctx.moveTo(x0, y0);
  ctx.lineTo(x1, y1);
  ctx.stroke();
  const nx = -uy;
  const ny = ux;
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(
    x1 - ux * head + nx * head * 0.5,
    y1 - uy * head + ny * head * 0.5,
  );
  ctx.lineTo(
    x1 - ux * head - nx * head * 0.5,
    y1 - uy * head - ny * head * 0.5,
  );
  ctx.closePath();
  ctx.fill();
}
