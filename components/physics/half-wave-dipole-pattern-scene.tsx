"use client";

import { useEffect, useRef, useState } from "react";
import { useAnimationFrame } from "@/lib/animation/use-animation-frame";
import { useThemeColors } from "@/lib/hooks/use-theme-colors";
import {
  halfWaveDipoleGain,
  radiationPatternHalfWaveDipole,
} from "@/lib/physics/electromagnetism/antenna";

const RATIO = 0.68;
const MAX_HEIGHT = 420;

/**
 * FIG.54b — polar pattern of a centre-fed half-wave dipole,
 * overlaid with the short (Hertzian) dipole sin²θ pattern for comparison.
 *
 *     F_λ/2(θ) = | cos((π/2) cos θ) / sin θ |²
 *     F_short(θ) = sin²θ
 *
 * Both patterns are vertical doughnuts sliced in the azimuthal plane:
 * two symmetric lobes, maximum at θ = π/2 (broadside), nulls at the
 * axis. The half-wave lobes are slightly pinched relative to the short
 * dipole — the extra ≈ 0.4 dB of gain that carries the canonical 1.64
 * (2.15 dBi) number.
 *
 * A small HUD reads the broadside peak gain.
 */
export function HalfWaveDipolePatternScene() {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const colors = useThemeColors();
  const [size, setSize] = useState({ width: 640, height: 420 });

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
      const cy = height * 0.56;
      const maxR = Math.min(width, height) * 0.36;

      // ── Polar grid (concentric circles at 0.25, 0.5, 0.75, 1.0) ──
      ctx.strokeStyle = colors.fg3;
      ctx.lineWidth = 1;
      ctx.setLineDash([2, 4]);
      for (let k = 1; k <= 4; k++) {
        ctx.beginPath();
        ctx.arc(cx, cy, (k / 4) * maxR, 0, Math.PI * 2);
        ctx.stroke();
      }
      ctx.setLineDash([]);

      // Dipole-axis line (vertical)
      ctx.strokeStyle = colors.fg3;
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.moveTo(cx, cy - maxR * 1.18);
      ctx.lineTo(cx, cy + maxR * 1.18);
      ctx.stroke();
      // Equator
      ctx.beginPath();
      ctx.moveTo(cx - maxR * 1.18, cy);
      ctx.lineTo(cx + maxR * 1.18, cy);
      ctx.stroke();
      ctx.setLineDash([]);

      // ── Short-dipole pattern (sin²θ) — comparison, filled lilac ──
      ctx.beginPath();
      const samples = 240;
      for (let i = 0; i <= samples; i++) {
        const theta = (i / samples) * Math.PI * 2;
        const s = Math.sin(theta);
        const r = s * s * maxR; // normalized; sin²θ peaks at 1 = maxR
        const px = cx + r * Math.sin(theta);
        const py = cy - r * Math.cos(theta);
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.closePath();
      ctx.fillStyle = "rgba(200, 160, 255, 0.10)";
      ctx.fill();
      ctx.strokeStyle = "rgba(200, 160, 255, 0.7)";
      ctx.lineWidth = 1.3;
      ctx.stroke();

      // ── Half-wave dipole pattern — primary, amber ──
      ctx.beginPath();
      for (let i = 0; i <= samples; i++) {
        const theta = (i / samples) * Math.PI * 2;
        const r = radiationPatternHalfWaveDipole(theta) * maxR;
        const px = cx + r * Math.sin(theta);
        const py = cy - r * Math.cos(theta);
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.closePath();
      ctx.fillStyle = "rgba(255, 180, 80, 0.14)";
      ctx.fill();
      ctx.strokeStyle = "rgba(255, 180, 80, 0.95)";
      ctx.lineWidth = 1.8;
      ctx.stroke();

      // ── Dipole bar (magenta) with current bead oscillation ──
      const dipoleLen = maxR * 0.34;
      ctx.strokeStyle = "#FF6ADE";
      ctx.lineWidth = 3;
      ctx.lineCap = "round";
      ctx.beginPath();
      ctx.moveTo(cx, cy - dipoleLen / 2);
      ctx.lineTo(cx, cy + dipoleLen / 2);
      ctx.stroke();
      ctx.lineCap = "butt";

      // Current bead
      const beadY = cy + (dipoleLen / 2 - 4) * Math.sin(t * 2.4);
      ctx.fillStyle = "#FFD66B";
      ctx.beginPath();
      ctx.arc(cx, beadY, 3.5, 0, Math.PI * 2);
      ctx.fill();

      // Feed dot
      ctx.strokeStyle = "#FFD66B";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(cx, cy, 5, 0, Math.PI * 2);
      ctx.stroke();

      // ── Axis labels ──
      ctx.fillStyle = colors.fg2;
      ctx.font = "10px monospace";
      ctx.textAlign = "center";
      ctx.fillText("θ = 0 (axis)", cx, cy - maxR * 1.18 - 6);
      ctx.fillText("θ = π", cx, cy + maxR * 1.18 + 14);
      ctx.textAlign = "left";
      ctx.fillText("θ = π/2", cx + maxR * 1.04, cy - 4);
      ctx.textAlign = "right";
      ctx.fillText("θ = π/2", cx - maxR * 1.04, cy - 4);

      // ── Legend ──
      ctx.textAlign = "left";
      ctx.font = "10px monospace";
      ctx.fillStyle = "rgba(255, 180, 80, 0.95)";
      ctx.fillText("● half-wave λ/2", 14, 44);
      ctx.fillStyle = "rgba(200, 160, 255, 0.9)";
      ctx.fillText("● short (sin²θ)", 14, 58);

      // ── HUD / gain readout ──
      ctx.fillStyle = colors.fg1;
      ctx.font = "12px monospace";
      ctx.textAlign = "left";
      ctx.fillText(`F(θ) = |cos((π/2)·cosθ) / sinθ|²`, 14, 20);

      const gain = halfWaveDipoleGain();
      const gainDbi = 10 * Math.log10(gain);
      ctx.textAlign = "right";
      ctx.fillStyle = colors.fg2;
      ctx.fillText(
        `peak gain ${gain.toFixed(2)} (${gainDbi.toFixed(2)} dBi)`,
        width - 14,
        20,
      );
      ctx.fillText(
        `short-dipole gain 1.50 (1.76 dBi)`,
        width - 14,
        36,
      );

      // Footer
      ctx.fillStyle = colors.fg3;
      ctx.font = "10px monospace";
      ctx.textAlign = "center";
      ctx.fillText(
        `pinched lobes → slightly more directive than the short-dipole doughnut`,
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
