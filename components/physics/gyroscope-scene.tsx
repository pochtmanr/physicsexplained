"use client";

import { useEffect, useRef, useState } from "react";
import { useAnimationFrame } from "@/lib/animation/use-animation-frame";
import { useThemeColors } from "@/lib/hooks/use-theme-colors";

const RATIO = 0.62;
const MAX_HEIGHT = 380;

/**
 * Simplified gyroscope: a spinning disk on the end of a horizontal arm
 * pivoting at the base. The disk's spin angular momentum L lies along the
 * arm; gravity produces a torque about the pivot, which (by τ = dL/dt)
 * causes L — and so the entire arm — to precess around the vertical axis
 * rather than fall.
 *
 * Precession angular velocity Ω = m·g·r / (I·ω_spin).
 */
export function GyroscopeScene() {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const colors = useThemeColors();
  const [spin, setSpin] = useState(40); // rad/s spin rate
  const [size, setSize] = useState({ width: 640, height: 380 });
  const phiRef = useRef(0); // precession angle
  const psiRef = useRef(0); // spin angle about disk axis
  const lastRef = useRef<number | null>(null);

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

      if (lastRef.current === null) lastRef.current = t;
      const dt = t - lastRef.current;
      lastRef.current = t;

      // Parameters (SI, rough)
      const mDisk = 0.3; // kg
      const rDisk = 0.05; // m
      const IDisk = 0.5 * mDisk * rDisk * rDisk;
      const armLength = 0.15; // m — distance from pivot to disk centre
      const g = 9.80665;

      // Precession angular velocity
      const Omega =
        Math.abs(spin) > 1 ? (mDisk * g * armLength) / (IDisk * spin) : 0;

      phiRef.current += Omega * dt;
      psiRef.current += spin * dt;

      ctx.clearRect(0, 0, width, height);

      const cx = width / 2;
      const cyGround = height * 0.8;
      const pxPerMetre = Math.min(width, height) * 1.6;

      // Ground ellipse
      ctx.strokeStyle = colors.fg3;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.ellipse(cx, cyGround, 150, 30, 0, 0, Math.PI * 2);
      ctx.stroke();

      // Vertical precession axis
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.moveTo(cx, cyGround);
      ctx.lineTo(cx, cyGround - 200);
      ctx.stroke();
      ctx.setLineDash([]);

      // Base pivot
      ctx.fillStyle = colors.fg2;
      ctx.beginPath();
      ctx.arc(cx, cyGround - 30, 8, 0, Math.PI * 2);
      ctx.fill();

      // Arm direction
      const phi = phiRef.current;
      // Arm points outward in the horizontal plane at angle phi; use simple 2-D projection
      const armEndX = cx + Math.cos(phi) * armLength * pxPerMetre;
      const armEndYprojection = Math.sin(phi) * 0.35; // fake 3D perspective
      const armEndY = cyGround - 30 + armEndYprojection * armLength * pxPerMetre;

      // Arm
      ctx.strokeStyle = colors.fg0;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(cx, cyGround - 30);
      ctx.lineTo(armEndX, armEndY);
      ctx.stroke();

      // Disk: draw as ellipse perpendicular to arm, plus spinning marker
      ctx.save();
      ctx.translate(armEndX, armEndY);
      // Disk face normal is along the arm direction projected; draw ellipse
      // whose semi-major axis is perpendicular to the arm projection.
      const armAngle = Math.atan2(armEndY - (cyGround - 30), armEndX - cx);
      ctx.rotate(armAngle);
      ctx.fillStyle = colors.bg1;
      ctx.strokeStyle = "#5BE9FF";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.ellipse(0, 0, 10, 30, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      // Spinning marker
      const marker = psiRef.current;
      ctx.strokeStyle = "#E4C27A";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(0, Math.sin(marker) * 28);
      ctx.stroke();
      ctx.restore();

      // Labels
      ctx.font = "13px monospace";
      ctx.fillStyle = colors.fg1;
      ctx.textAlign = "left";
      ctx.fillText(
        `ω_spin = ${spin.toFixed(0)} rad/s`,
        20,
        22,
      );
      ctx.fillText(`Ω_prec = ${Omega.toFixed(2)} rad/s`, 20, 40);
      ctx.textAlign = "right";
      ctx.fillStyle = colors.fg2;
      ctx.fillText(
        "gravity torque rotates L horizontally ⇒ precession",
        width - 20,
        22,
      );
      ctx.fillText(
        "faster spin → slower precession (L bigger, harder to turn)",
        width - 20,
        40,
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
        <label className="text-sm text-[var(--color-fg-3)]">spin ω (rad/s)</label>
        <input
          type="range"
          min={10}
          max={120}
          step={1}
          value={spin}
          onChange={(e) => setSpin(parseFloat(e.target.value))}
          className="flex-1 accent-[#5BE9FF]"
        />
        <span className="w-14 text-right text-sm font-mono text-[var(--color-fg-1)]">
          {spin.toFixed(0)}
        </span>
      </div>
    </div>
  );
}
