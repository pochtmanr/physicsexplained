"use client";

import { useEffect, useRef, useState } from "react";
import { useAnimationFrame } from "@/lib/animation/use-animation-frame";
import { useThemeColors } from "@/lib/hooks/use-theme-colors";
import {
  rigidAngularMomentum,
  rotationalKE,
  skaterOmega,
} from "@/lib/physics/angular";

const RATIO = 0.6;
const MAX_HEIGHT = 360;

/**
 * A stylised figure skater viewed from above. Arms extend or retract
 * on command, which changes the moment of inertia; ω adjusts to keep
 * L = I·ω constant.
 */
export function SkaterSpinScene() {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const colors = useThemeColors();
  const [pullIn, setPullIn] = useState(0); // 0 = arms out, 1 = arms in
  const [size, setSize] = useState({ width: 640, height: 360 });
  const thetaRef = useRef(0);
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

      // Simplified I model: body + two outstretched arm masses on extending limbs.
      // When arms go from fully out (length L) to fully in (length L/3), I drops.
      const bodyI = 0.1;
      const armLength = 0.6 + (1 - pullIn) * 0.7; // metres (effective)
      const armMass = 2 * 3.5; // kg, two arms worth
      const armI = armMass * armLength * armLength;
      const I = bodyI + armI;

      // Constant angular momentum L (initial state: arms fully out, ω = 2 rad/s)
      const I0 = bodyI + 2 * 3.5 * (0.6 + 0.7) ** 2;
      const L0 = I0 * 2.0;
      const omega = skaterOmega(I, L0);

      thetaRef.current += omega * dt;

      ctx.clearRect(0, 0, width, height);

      const cx = width / 2;
      const cy = height * 0.48;
      const scale = Math.min(width, height) * 0.3;

      // Ice hatching background
      ctx.strokeStyle = colors.fg3;
      ctx.lineWidth = 1;
      for (let i = -4; i <= 4; i++) {
        ctx.beginPath();
        ctx.moveTo(cx - scale * 1.2, cy + (i * scale * 0.15));
        ctx.lineTo(cx + scale * 1.2, cy + (i * scale * 0.15));
        ctx.setLineDash([2, 8]);
        ctx.stroke();
      }
      ctx.setLineDash([]);

      // Axis tick
      ctx.fillStyle = colors.fg2;
      ctx.beginPath();
      ctx.arc(cx, cy, 3, 0, Math.PI * 2);
      ctx.fill();

      // Body circle
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(thetaRef.current);

      // Torso
      ctx.fillStyle = "#6FB8C6";
      ctx.beginPath();
      ctx.arc(0, 0, scale * 0.14, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = colors.fg0;
      ctx.lineWidth = 1;
      ctx.stroke();

      // Arms — two line segments from torso
      const armPx = armLength * scale * 0.6;
      ctx.strokeStyle = colors.fg0;
      ctx.lineWidth = 4;
      ctx.lineCap = "round";
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(-armPx, 0);
      ctx.moveTo(0, 0);
      ctx.lineTo(armPx, 0);
      ctx.stroke();

      // Hand masses (weights)
      ctx.fillStyle = "#E4C27A";
      ctx.beginPath();
      ctx.arc(-armPx, 0, scale * 0.04, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(armPx, 0, scale * 0.04, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();

      // Readout
      const L = rigidAngularMomentum(I, omega);
      const ke = rotationalKE(I, omega);

      ctx.font = "13px monospace";
      ctx.textAlign = "left";
      ctx.fillStyle = colors.fg1;
      ctx.fillText(`I  = ${I.toFixed(2)}  kg·m²`, 20, 22);
      ctx.fillText(`ω  = ${omega.toFixed(2)}  rad/s`, 20, 40);
      ctx.fillText(`L  = I·ω = ${L.toFixed(2)}  (conserved)`, 20, 58);
      ctx.textAlign = "right";
      ctx.fillStyle = colors.fg2;
      ctx.fillText(
        `KE_rot = ½·I·ω² = ${ke.toFixed(2)} J  (rises as arms pull in)`,
        width - 20,
        22,
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
        <label className="text-sm text-[var(--color-fg-3)]">arms in</label>
        <input
          type="range"
          min={0}
          max={1}
          step={0.01}
          value={pullIn}
          onChange={(e) => setPullIn(parseFloat(e.target.value))}
          className="flex-1 accent-[#6FB8C6]"
        />
        <span className="w-14 text-right text-sm font-mono text-[var(--color-fg-1)]">
          {pullIn.toFixed(2)}
        </span>
      </div>
    </div>
  );
}
