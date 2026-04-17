"use client";

import { useEffect, useRef, useState } from "react";
import { useAnimationFrame } from "@/lib/animation/use-animation-frame";
import { useThemeColors } from "@/lib/hooks/use-theme-colors";

const RATIO = 0.6;
const MAX_HEIGHT = 360;

type Mode = "chandler" | "precession";

/**
 * A schematic of the Earth's pole motion.
 *
 * Mode "chandler": the instantaneous rotation pole traces a small circle
 * of radius ~6 metres at the surface, with a 433-day period. This is the
 * Euler-equation wobble due to Earth's rotation axis not exactly aligning
 * with a principal axis of inertia.
 *
 * Mode "precession": the rotation axis sweeps out a cone in space with a
 * 26,000-year period, driven by lunar and solar tidal torques on the
 * equatorial bulge. (Shown stylised — not to temporal scale.)
 */
export function ChandlerWobbleScene() {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const colors = useThemeColors();
  const [mode, setMode] = useState<Mode>("chandler");
  const [size, setSize] = useState({ width: 640, height: 360 });

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

      if (mode === "chandler") {
        // Top-down view of the pole, small circle.
        const r = Math.min(width, height) * 0.25;
        const omega = (2 * Math.PI) / 6; // period 6 s in visualization
        const phi = omega * t;
        const poleX = cx + r * Math.cos(phi);
        const poleY = cy + r * Math.sin(phi);

        // Earth outline (pole view)
        ctx.strokeStyle = colors.fg2;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(cx, cy, r * 2.8, 0, Math.PI * 2);
        ctx.stroke();

        // Reference crosshairs (mean rotation pole)
        ctx.strokeStyle = colors.fg3;
        ctx.setLineDash([4, 4]);
        ctx.beginPath();
        ctx.moveTo(cx - r * 1.5, cy);
        ctx.lineTo(cx + r * 1.5, cy);
        ctx.moveTo(cx, cy - r * 1.5);
        ctx.lineTo(cx, cy + r * 1.5);
        ctx.stroke();
        ctx.setLineDash([]);

        // Wobble trace (historical)
        ctx.strokeStyle = colors.fg3;
        ctx.lineWidth = 1;
        ctx.beginPath();
        for (let i = 0; i < 120; i++) {
          const p = phi - i * 0.05;
          const wobble = 1 + 0.1 * Math.sin(p * 0.2);
          const px = cx + r * wobble * Math.cos(p);
          const py = cy + r * wobble * Math.sin(p);
          if (i === 0) ctx.moveTo(px, py);
          else ctx.lineTo(px, py);
        }
        ctx.stroke();

        // Current pole
        ctx.fillStyle = "#5BE9FF";
        ctx.beginPath();
        ctx.arc(poleX, poleY, 8, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = colors.fg0;
        ctx.lineWidth = 1;
        ctx.stroke();

        // Mean pole
        ctx.fillStyle = colors.fg2;
        ctx.beginPath();
        ctx.arc(cx, cy, 4, 0, Math.PI * 2);
        ctx.fill();

        ctx.font = "13px monospace";
        ctx.fillStyle = colors.fg1;
        ctx.textAlign = "center";
        ctx.fillText(
          "CHANDLER WOBBLE — rotation pole traces a ~6 m circle at surface",
          width / 2,
          24,
        );
        ctx.fillStyle = colors.fg2;
        ctx.fillText("period ≈ 433 days", width / 2, 42);
      } else {
        // Precession cone — side view
        const tiltRad = (23.4 * Math.PI) / 180;
        const omega = (2 * Math.PI) / 12; // period 12 s
        const phi = omega * t;

        // Globe outline
        ctx.strokeStyle = colors.fg2;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(cx, cy, 90, 0, Math.PI * 2);
        ctx.stroke();

        // Equatorial ellipse (tilted)
        ctx.strokeStyle = colors.fg3;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.ellipse(cx, cy, 90, 90 * Math.cos(tiltRad), phi, 0, Math.PI * 2);
        ctx.stroke();

        // Ecliptic plane (horizontal reference)
        ctx.setLineDash([4, 4]);
        ctx.beginPath();
        ctx.moveTo(cx - 150, cy);
        ctx.lineTo(cx + 150, cy);
        ctx.stroke();
        ctx.setLineDash([]);

        // Vertical axis (reference)
        ctx.strokeStyle = colors.fg3;
        ctx.setLineDash([2, 4]);
        ctx.beginPath();
        ctx.moveTo(cx, cy - 150);
        ctx.lineTo(cx, cy + 150);
        ctx.stroke();
        ctx.setLineDash([]);

        // Rotation axis — tilted, and precessing
        const axisLen = 130;
        const axisHX = Math.sin(tiltRad) * Math.cos(phi);
        const axisHY = Math.sin(tiltRad) * Math.sin(phi) * 0.35; // pseudo-depth
        const axisVX = axisHX * axisLen;
        const axisVY = -Math.cos(tiltRad) * axisLen + axisHY * axisLen;

        ctx.strokeStyle = "#5BE9FF";
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(cx - axisVX * 0.7, cy - axisVY * 0.7);
        ctx.lineTo(cx + axisVX, cy + axisVY);
        ctx.stroke();

        // Cone trace at top
        ctx.strokeStyle = "#E4C27A";
        ctx.lineWidth = 1;
        ctx.beginPath();
        for (let i = 0; i <= 60; i++) {
          const p = (i / 60) * Math.PI * 2;
          const hx = Math.sin(tiltRad) * Math.cos(p) * axisLen;
          const hy = Math.sin(tiltRad) * Math.sin(p) * 0.35 * axisLen;
          const tx = cx + hx;
          const ty = cy - Math.cos(tiltRad) * axisLen + hy;
          if (i === 0) ctx.moveTo(tx, ty);
          else ctx.lineTo(tx, ty);
        }
        ctx.stroke();

        ctx.font = "13px monospace";
        ctx.fillStyle = colors.fg1;
        ctx.textAlign = "center";
        ctx.fillText(
          "AXIAL PRECESSION — rotation axis sweeps a 23.4° cone in space",
          width / 2,
          24,
        );
        ctx.fillStyle = colors.fg2;
        ctx.fillText("period ≈ 25,800 years (animation sped up)", width / 2, 42);
      }
    },
  });

  const tab = (active: boolean) =>
    `px-3 py-1 text-xs font-mono uppercase tracking-wider transition-colors ${
      active
        ? "bg-[var(--color-cyan)] text-[var(--color-bg-0)]"
        : "bg-transparent text-[var(--color-fg-2)] hover:text-[var(--color-fg-1)]"
    }`;

  return (
    <div ref={containerRef} className="w-full pb-4">
      <canvas
        ref={canvasRef}
        style={{ width: size.width, height: size.height }}
        className="block"
      />
      <div className="mt-2 flex gap-2 px-2">
        <button
          type="button"
          onClick={() => setMode("chandler")}
          className={tab(mode === "chandler")}
        >
          Chandler wobble
        </button>
        <button
          type="button"
          onClick={() => setMode("precession")}
          className={tab(mode === "precession")}
        >
          axial precession
        </button>
      </div>
    </div>
  );
}
