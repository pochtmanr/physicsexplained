"use client";

import { useEffect, useRef, useState } from "react";
import { useAnimationFrame } from "@/lib/animation/use-animation-frame";
import { useThemeColors } from "@/lib/hooks/use-theme-colors";

const RATIO = 0.62;
const MAX_HEIGHT = 400;

/**
 * FIG.36c — dipole antenna radiation pattern.
 *
 * Side-view of a short vertical dipole at the origin. The far-field,
 * time-averaged Poynting vector ⟨S⟩ for a Hertzian dipole goes as
 *   ⟨S(r,θ)⟩ ∝ sin²θ / r²
 * where θ is measured from the dipole axis. Plotting that in polar
 * coordinates gives the familiar doughnut lobe pair — maximum broadside,
 * zero along the axis.
 *
 * The scene draws:
 *   · a thin magenta dipole bar along the vertical (antenna)
 *   · yellow current oscillating up and down through the bar
 *   · an outgoing ripple of concentric arcs (fading with r)
 *   · the cardioid-ish cross-section of the sin²θ lobe pattern
 *     (lilac outline + semi-transparent fill) that rotates with the wave
 *
 * Voice-of-topic:
 *   "If you integrate ⟨S⟩ over a big sphere you get the radiated power.
 *    Broadcast engineers call this the 'doughnut' — zero straight up,
 *    brightest at the horizon."
 */
export function AntennaRadiationPatternScene() {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const colors = useThemeColors();
  const [size, setSize] = useState({ width: 640, height: 400 });

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
      const maxR = Math.min(width, height) * 0.42;

      // ── Polar grid (faint concentric circles) ──
      ctx.strokeStyle = colors.fg3;
      ctx.lineWidth = 1;
      ctx.setLineDash([2, 4]);
      for (let k = 1; k <= 3; k++) {
        ctx.beginPath();
        ctx.arc(cx, cy, (k / 3) * maxR, 0, Math.PI * 2);
        ctx.stroke();
      }
      ctx.setLineDash([]);

      // ── Axis line (dipole axis, vertical) ──
      ctx.strokeStyle = colors.fg3;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(cx, cy - maxR * 1.1);
      ctx.lineTo(cx, cy + maxR * 1.1);
      ctx.stroke();

      // ── Horizon line (equatorial plane, max radiation direction) ──
      ctx.strokeStyle = colors.fg3;
      ctx.beginPath();
      ctx.moveTo(cx - maxR * 1.1, cy);
      ctx.lineTo(cx + maxR * 1.1, cy);
      ctx.stroke();

      // ── Outgoing wavefronts (ripples) ──
      const nRipples = 4;
      const lambda = maxR / 2.4;
      const phaseShift = (t * 70) % lambda;
      for (let i = 0; i < nRipples; i++) {
        const rr = (i * lambda + phaseShift);
        if (rr > maxR * 1.05) continue;
        const alpha = Math.max(0, 0.35 - (rr / maxR) * 0.25);
        ctx.strokeStyle = `rgba(120, 220, 255, ${alpha.toFixed(3)})`;
        ctx.lineWidth = 1.1;
        // Only draw in the lobe (mask lightly — we draw full circle, the
        // lobe fill will give it the "doughnut" visual dominance)
        ctx.beginPath();
        ctx.arc(cx, cy, rr, 0, Math.PI * 2);
        ctx.stroke();
      }

      // ── Radiation lobe: sin²θ pattern, polar plot ──
      // In 2D cross-section the lobe is the union of two symmetric blobs
      // left/right of the dipole. Parametrise by θ from the axis.
      ctx.beginPath();
      const samples = 180;
      for (let i = 0; i <= samples; i++) {
        const theta = (i / samples) * Math.PI * 2;
        // r(θ) = sin²θ, normalised to maxR*0.9
        const s = Math.sin(theta);
        const r = s * s * maxR * 0.9;
        const px = cx + r * Math.sin(theta);
        const py = cy - r * Math.cos(theta);
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.closePath();
      ctx.fillStyle = "rgba(200, 160, 255, 0.14)";
      ctx.fill();
      ctx.strokeStyle = "rgba(200, 160, 255, 0.85)";
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // ── Dipole bar (vertical magenta line with oscillating current bead) ──
      const dipoleLen = maxR * 0.32;
      ctx.strokeStyle = "#FF6ADE";
      ctx.lineWidth = 3;
      ctx.lineCap = "round";
      ctx.beginPath();
      ctx.moveTo(cx, cy - dipoleLen / 2);
      ctx.lineTo(cx, cy + dipoleLen / 2);
      ctx.stroke();
      ctx.lineCap = "butt";

      // Current bead animating up/down
      const beadY = cy + (dipoleLen / 2 - 4) * Math.sin(t * 3);
      ctx.fillStyle = "#FFD66B";
      ctx.beginPath();
      ctx.arc(cx, beadY, 3.5, 0, Math.PI * 2);
      ctx.fill();

      // Feed gap dot at centre
      ctx.strokeStyle = "#FFD66B";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(cx, cy, 5, 0, Math.PI * 2);
      ctx.stroke();

      // ── Lobe-direction arrows (four S vectors pointing outward at the
      //    peaks of the pattern, i.e. along ±x̂) ──
      const peak = maxR * 0.9;
      const peakAnim = (Math.sin(t * 3) + 1) / 2; // 0..1
      const peakAlpha = 0.5 + 0.45 * peakAnim;
      drawArrow(
        ctx,
        cx + peak * 0.35,
        cy,
        cx + peak * 0.9,
        cy,
        `rgba(200, 160, 255, ${peakAlpha.toFixed(3)})`,
        1,
        2,
      );
      drawArrow(
        ctx,
        cx - peak * 0.35,
        cy,
        cx - peak * 0.9,
        cy,
        `rgba(200, 160, 255, ${peakAlpha.toFixed(3)})`,
        1,
        2,
      );

      // ── Labels ──
      ctx.fillStyle = colors.fg2;
      ctx.font = "11px monospace";
      ctx.textAlign = "center";
      ctx.fillText("dipole axis", cx, cy - maxR * 1.1 - 6);
      ctx.fillText("⟨S⟩ = 0 along axis", cx, cy + maxR * 1.1 + 16);
      ctx.textAlign = "left";
      ctx.fillStyle = "rgba(200, 160, 255, 0.9)";
      ctx.fillText("⟨S⟩ max →", cx + maxR * 0.95, cy - 4);
      ctx.textAlign = "right";
      ctx.fillText("← ⟨S⟩ max", cx - maxR * 0.95, cy - 4);

      // ── HUD ──
      ctx.fillStyle = colors.fg1;
      ctx.font = "12px monospace";
      ctx.textAlign = "left";
      ctx.fillText(`⟨S(r,θ)⟩ ∝ sin²θ / r²`, 14, 22);
      ctx.textAlign = "right";
      ctx.fillStyle = colors.fg2;
      ctx.fillText(`Hertzian dipole far-field`, width - 14, 22);

      // Footer
      ctx.fillStyle = colors.fg2;
      ctx.font = "10px monospace";
      ctx.textAlign = "center";
      ctx.fillText(
        `the "doughnut": peak broadside, null along the axis`,
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
  alpha: number,
  width: number,
) {
  const dx = x1 - x0;
  const dy = y1 - y0;
  const len = Math.hypot(dx, dy);
  if (len < 0.5) return;
  const ux = dx / len;
  const uy = dy / len;
  const head = Math.min(7, len * 0.28);
  const a = Math.max(0, Math.min(1, alpha));
  void a;
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineWidth = width;
  ctx.beginPath();
  ctx.moveTo(x0, y0);
  ctx.lineTo(x1, y1);
  ctx.stroke();
  const nx = -uy;
  const ny = ux;
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x1 - ux * head + nx * head * 0.5, y1 - uy * head + ny * head * 0.5);
  ctx.lineTo(x1 - ux * head - nx * head * 0.5, y1 - uy * head - ny * head * 0.5);
  ctx.closePath();
  ctx.fill();
}
