"use client";

import { useRef, useState, useCallback, useEffect } from "react";
import { useAnimationFrame } from "@/lib/animation/use-animation-frame";
import { useThemeColors } from "@/lib/hooks/use-theme-colors";

export interface HohmannSceneProps {}

/**
 * Hohmann transfer orbit visualization.
 * Inner circular orbit → burn 1 → coast on transfer ellipse → burn 2 → outer circular orbit.
 * Slider controls the outer orbit radius.
 */
export function HohmannScene({}: HohmannSceneProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const colors = useThemeColors();

  const r1 = 1.0; // inner orbit radius (fixed)
  const [r2, setR2] = useState(2.5);
  const r2Ref = useRef(2.5);
  const [size, setSize] = useState({ width: 600, height: 420 });

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const ro = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const w = entry.contentRect.width;
        if (w > 0) {
          setSize({ width: w, height: Math.min(w * 0.7, 420) });
        }
      }
    });
    ro.observe(container);
    return () => ro.disconnect();
  }, []);

  const handleSlider = useCallback((ev: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(ev.target.value);
    setR2(val);
    r2Ref.current = val;
  }, []);

  // Animation state
  const phaseRef = useRef<"inner" | "transfer" | "outer">("inner");
  const tPhaseRef = useRef(0); // time within current phase

  useAnimationFrame({
    elementRef: containerRef,
    onFrame: (_t, dt) => {
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

      const outerR = r2Ref.current;
      ctx.clearRect(0, 0, width, height);

      const scale = Math.min(width, height) * 0.28 / Math.max(outerR, r1);
      const cx = width / 2;
      const cy = height / 2;

      // GM = 1 in display units
      const GM = 1;

      // Transfer ellipse params
      const aTransfer = (r1 + outerR) / 2;
      const eTransfer = (outerR - r1) / (outerR + r1);
      const bTransfer = aTransfer * Math.sqrt(1 - eTransfer * eTransfer);
      const cTransfer = aTransfer * eTransfer;

      // Orbital speeds (vis-viva: v^2 = GM(2/r - 1/a))
      const vCirc1 = Math.sqrt(GM / r1);
      const vCirc2 = Math.sqrt(GM / outerR);
      const vTransfer1 = Math.sqrt(GM * (2 / r1 - 1 / aTransfer)); // at periapsis
      const vTransfer2 = Math.sqrt(GM * (2 / outerR - 1 / aTransfer)); // at apoapsis
      const dv1 = vTransfer1 - vCirc1;
      const dv2 = vCirc2 - vTransfer2;

      // Transfer time (half period of transfer ellipse)
      const transferPeriod = 2 * Math.PI * Math.sqrt(aTransfer * aTransfer * aTransfer / GM);
      const transferTime = transferPeriod / 2;

      // Phase durations (in display seconds)
      const innerDuration = 3;
      const outerDuration = 3;

      tPhaseRef.current += dt;

      const phase = phaseRef.current;
      let scX = 0;
      let scY = 0;
      let showBurn = false;

      // Angular velocity on circular orbit: omega = v/r
      if (phase === "inner") {
        const omega = vCirc1 / r1;
        const angle = omega * tPhaseRef.current * 2; // speed up for display
        scX = cx + r1 * Math.cos(angle) * scale;
        scY = cy - r1 * Math.sin(angle) * scale;
        if (tPhaseRef.current > innerDuration) {
          phaseRef.current = "transfer";
          tPhaseRef.current = 0;
          showBurn = true;
        }
      } else if (phase === "transfer") {
        // Parametric position on transfer ellipse using Kepler equation
        // Mean anomaly goes from 0 to pi (half orbit)
        const frac = Math.min(tPhaseRef.current / (transferTime * 0.5), 1);
        const M = Math.PI * frac;
        // Solve Kepler with Newton-Raphson inline (simple case)
        let E = M;
        for (let i = 0; i < 15; i++) {
          E = E - (E - eTransfer * Math.sin(E) - M) / (1 - eTransfer * Math.cos(E));
        }
        const theta = 2 * Math.atan2(
          Math.sqrt(1 + eTransfer) * Math.sin(E / 2),
          Math.sqrt(1 - eTransfer) * Math.cos(E / 2),
        );
        const r = aTransfer * (1 - eTransfer * Math.cos(E));
        scX = cx + r * Math.cos(theta) * scale;
        scY = cy - r * Math.sin(theta) * scale;
        if (frac >= 1) {
          phaseRef.current = "outer";
          tPhaseRef.current = 0;
          showBurn = true;
        }
      } else {
        // outer
        const omega = vCirc2 / outerR;
        // Start at theta = pi (apoapsis is on -x side)
        const angle = Math.PI + omega * tPhaseRef.current * 2;
        scX = cx + outerR * Math.cos(angle) * scale;
        scY = cy - outerR * Math.sin(angle) * scale;
        if (tPhaseRef.current > outerDuration) {
          phaseRef.current = "inner";
          tPhaseRef.current = 0;
        }
      }

      // --- Draw inner orbit (blue) ---
      ctx.strokeStyle = "rgba(91, 180, 255, 0.5)";
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(cx, cy, r1 * scale, 0, Math.PI * 2);
      ctx.stroke();

      // --- Draw outer orbit (green) ---
      ctx.strokeStyle = "rgba(91, 255, 160, 0.5)";
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(cx, cy, outerR * scale, 0, Math.PI * 2);
      ctx.stroke();

      // --- Draw transfer ellipse (orange, dashed) ---
      ctx.strokeStyle = "rgba(255, 180, 60, 0.6)";
      ctx.lineWidth = 1.5;
      ctx.setLineDash([6, 4]);
      ctx.beginPath();
      // Transfer ellipse: center at (cx + cTransfer*scale, cy), semi-axes a, b
      // Periapsis at r1 (right side), apoapsis at outerR (left side)
      ctx.ellipse(cx + cTransfer * scale, cy, aTransfer * scale, bTransfer * scale, 0, 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);

      // --- Sun ---
      ctx.shadowColor = "rgba(111, 184, 198, 0.8)";
      ctx.shadowBlur = 18;
      ctx.fillStyle = "#6FB8C6";
      ctx.beginPath();
      ctx.arc(cx, cy, 7, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;

      // --- Spacecraft ---
      if (showBurn || (phase === "transfer" && tPhaseRef.current < 0.3) ||
          (phase === "outer" && tPhaseRef.current < 0.3)) {
        // Burn flash
        ctx.shadowColor = "rgba(255, 180, 60, 0.9)";
        ctx.shadowBlur = 24;
        ctx.fillStyle = "#FFB43C";
        ctx.beginPath();
        ctx.arc(scX, scY, 8, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
      }

      ctx.fillStyle = colors.fg0;
      ctx.beginPath();
      ctx.arc(scX, scY, 4, 0, Math.PI * 2);
      ctx.fill();

      // --- Labels ---
      ctx.fillStyle = "rgba(91, 180, 255, 0.8)";
      ctx.font = "10px sans-serif";
      ctx.textAlign = "center";
      ctx.fillText("inner orbit", cx + r1 * scale + 4, cy - 10);

      ctx.fillStyle = "rgba(91, 255, 160, 0.8)";
      ctx.fillText("target orbit", cx - outerR * scale, cy - 10);

      // --- Delta-v readout ---
      ctx.fillStyle = colors.fg1;
      ctx.font = "11px monospace";
      ctx.textAlign = "left";
      const rdX = 14;
      const rdY = 22;
      ctx.fillText(`r\u2081 = ${r1.toFixed(1)}`, rdX, rdY);
      ctx.fillText(`r\u2082 = ${outerR.toFixed(1)}`, rdX, rdY + 16);
      ctx.fillStyle = "#FFB43C";
      ctx.fillText(`\u0394v\u2081 = ${dv1.toFixed(3)}`, rdX, rdY + 36);
      ctx.fillText(`\u0394v\u2082 = ${dv2.toFixed(3)}`, rdX, rdY + 52);
      ctx.fillStyle = "#FF6B6B";
      ctx.fillText(`\u0394v  = ${(dv1 + dv2).toFixed(3)}`, rdX, rdY + 72);

      // Phase indicator
      ctx.fillStyle = colors.fg2;
      ctx.font = "10px sans-serif";
      ctx.textAlign = "right";
      const phaseLabel =
        phase === "inner" ? "orbiting (inner)" :
        phase === "transfer" ? "transfer coast" :
        "orbiting (outer)";
      ctx.fillText(phaseLabel, width - 14, height - 14);
    },
  });

  return (
    <div ref={containerRef} className="w-full pb-4">
      <canvas ref={canvasRef} style={{ width: size.width, height: size.height }} className="block" />
      <div className="mt-3 flex items-center gap-3 px-4 pb-2">
        <label className="font-mono text-xs text-[var(--color-fg-3)]">
          r<sub>2</sub>
        </label>
        <input
          type="range"
          min={1.5}
          max={5}
          step={0.1}
          value={r2}
          onChange={handleSlider}
          className="flex-1 accent-[#5BFF9F]"
        />
        <span className="w-12 font-mono text-xs text-[var(--color-fg-1)]">
          {r2.toFixed(1)}
        </span>
      </div>
    </div>
  );
}
