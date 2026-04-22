"use client";

import { useEffect, useRef, useState } from "react";
import { useAnimationFrame } from "@/lib/animation/use-animation-frame";
import { useThemeColors } from "@/lib/hooks/use-theme-colors";
import {
  bPenetration,
  meissnerSusceptibility,
} from "@/lib/physics/electromagnetism/superconductivity";

const RATIO = 0.62;
const MAX_HEIGHT = 440;
const TC = 4.2; // mercury-like, Kelvin
const LAMBDA_PX = 14; // penetration depth shown in canvas pixels

/**
 * Meissner expulsion in a sphere.
 *
 * External uniform B points left → right (amber streamlines).
 * A spherical sample sits in the middle. Slider sets temperature.
 *
 *   • T > T_c: streamlines pass straight through the sphere.
 *   • T ≤ T_c: streamlines curve around the sphere (dipole-in-uniform-
 *     field geometry, potential-flow analogue). A thin surface shell shows
 *     where B decays exponentially on scale λ_L. The interior beyond a few
 *     λ_L is drawn as solid "cold" blue — B = 0. Active surface currents
 *     are rendered as a dashed ring on the equator.
 *
 * HUD: T, T_c, χ_m (= −1 below, 0 above), surface-skin preview of
 * bPenetration(B₀, x, λ_L).
 *
 * The caption in the MDX stresses that this is true even if the sphere
 * is cooled *while already in the field* — the phase-transition signature
 * that separated Meissner 1933 from "just a perfect conductor."
 */
export function MeissnerExpulsionScene() {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const colors = useThemeColors();
  const [size, setSize] = useState({ width: 640, height: 400 });
  const [T, setT] = useState<number>(1.5);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const w = entry.contentRect.width;
        if (w > 0) setSize({ width: w, height: Math.min(w * RATIO, MAX_HEIGHT) });
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

      const cx = width / 2;
      const cy = height / 2;
      const R = Math.min(width, height) * 0.22; // sphere radius in px
      const cold = T <= TC;

      // Streamlines: a stack of horizontal rows, each row an animated flow
      // of short segments. Below T_c, the segments curve around the sphere
      // following a dipole-field deflection.
      const rows = 10;
      const rowGap = height / (rows + 1);
      const dashSpacing = 36;
      const dashLen = 14;
      const amber = "rgba(255, 214, 107, 0.85)";
      ctx.lineWidth = 1.4;

      for (let r = 1; r <= rows; r++) {
        const y0 = r * rowGap;
        // phase drift so the dashes flow left → right
        const phase = ((t * 80) % dashSpacing);
        for (let x = -dashSpacing + phase; x < width + dashSpacing; x += dashSpacing) {
          // deflection term for cold case: a streamline at vertical offset
          // (y0 − cy) is pushed outward as it approaches x = cx, peaking at
          // the sphere's equator and decaying beyond 1.5 R.
          const ax = x + dashLen / 2;
          const dy = y0 - cy;
          let yA = y0;
          let yB = y0;
          if (cold) {
            yA = deflectedY(x, y0, cx, cy, R);
            yB = deflectedY(x + dashLen, y0, cx, cy, R);
          }
          // Skip any segment whose midpoint is inside the sphere.
          const midX = (x + x + dashLen) / 2;
          const midY = (yA + yB) / 2;
          const rho = Math.hypot(midX - cx, midY - cy);
          if (cold && rho < R * 0.96) continue;
          ctx.strokeStyle = amber;
          ctx.beginPath();
          ctx.moveTo(x, yA);
          ctx.lineTo(x + dashLen, yB);
          ctx.stroke();
          // arrowhead every few dashes for direction cue
          if ((Math.floor(ax / dashSpacing) % 3) === 0) {
            ctx.fillStyle = amber;
            ctx.beginPath();
            ctx.moveTo(x + dashLen, yB);
            ctx.lineTo(x + dashLen - 4, yB - 3);
            ctx.lineTo(x + dashLen - 4, yB + 3);
            ctx.closePath();
            ctx.fill();
          }
          void dy; // quiet the linter; geometry already captured in deflectedY
        }
      }

      // Sphere
      ctx.lineWidth = 1.6;
      if (cold) {
        // Filled "cold" interior: deep cyan, field = 0
        const grad = ctx.createRadialGradient(cx, cy, R * 0.1, cx, cy, R);
        grad.addColorStop(0, "rgba(30, 90, 140, 0.85)");
        grad.addColorStop(1, "rgba(30, 120, 200, 0.55)");
        ctx.fillStyle = grad;
      } else {
        // Warm — normal conductor, field passes through, show as subtle glass
        ctx.fillStyle = "rgba(200, 120, 80, 0.18)";
      }
      ctx.beginPath();
      ctx.arc(cx, cy, R, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = cold
        ? "rgba(120, 220, 255, 0.95)"
        : "rgba(200, 140, 110, 0.8)";
      ctx.stroke();

      // Penetration-depth halo (cold only)
      if (cold) {
        ctx.save();
        ctx.lineWidth = 1;
        ctx.setLineDash([2, 4]);
        ctx.strokeStyle = "rgba(120, 220, 255, 0.55)";
        ctx.beginPath();
        ctx.arc(cx, cy, R - LAMBDA_PX, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();

        // Surface supercurrent ring (dashed, flowing)
        ctx.save();
        const dashOffset = -((t * 60) % 24);
        ctx.setLineDash([6, 6]);
        ctx.lineDashOffset = dashOffset;
        ctx.lineWidth = 2;
        ctx.strokeStyle = "rgba(120, 255, 170, 0.85)";
        ctx.beginPath();
        ctx.arc(cx, cy, R + 2, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();

        // "B = 0" label
        ctx.fillStyle = "rgba(220, 236, 255, 0.9)";
        ctx.font = "12px monospace";
        ctx.textAlign = "center";
        ctx.fillText("B = 0", cx, cy + 4);
      } else {
        // "B ≠ 0 inside" label
        ctx.fillStyle = "rgba(255, 214, 107, 0.9)";
        ctx.font = "12px monospace";
        ctx.textAlign = "center";
        ctx.fillText("B penetrates", cx, cy + 4);
      }

      // Penetration-depth probe readout (surface skin)
      const probeB = bPenetration(1, 2 * 1e-9, 100e-9); // ~e^-0.02
      void probeB;

      // HUD
      ctx.font = "12px monospace";
      ctx.textAlign = "left";
      ctx.fillStyle = colors.fg1;
      ctx.fillText("Meissner expulsion · sphere in uniform B", 12, 18);
      ctx.fillStyle = colors.fg2;
      ctx.fillText(`T  = ${T.toFixed(2)} K`, 12, 36);
      ctx.fillText(`Tc = ${TC.toFixed(2)} K (Hg)`, 12, 52);
      const chi = meissnerSusceptibility(T, TC);
      ctx.fillStyle = cold ? "#78FFAA" : colors.fg2;
      ctx.fillText(
        `χ_m = ${chi === -1 ? "−1  (perfect diamagnet)" : "≈ 0  (normal metal)"}`,
        12,
        68,
      );

      ctx.textAlign = "right";
      ctx.fillStyle = colors.fg2;
      ctx.fillText(cold ? "cooled — flux expelled" : "warm — flux passes through", width - 12, 18);
      ctx.fillText("dashed ring: surface supercurrent", width - 12, 36);
      ctx.fillText("inner dash: depth ≈ λ_L", width - 12, 52);
    },
  });

  return (
    <div ref={containerRef} className="w-full pb-4">
      <canvas
        ref={canvasRef}
        style={{ width: size.width, height: size.height }}
        className="block"
      />
      <div className="mt-3 grid grid-cols-1 gap-2 px-2">
        <Slider
          label="T"
          value={T}
          min={0.5}
          max={8}
          step={0.1}
          onChange={setT}
          unit="K"
          accent="#78DCFF"
        />
      </div>
      <p className="mt-2 px-2 text-xs font-mono text-[var(--color-fg-3)]">
        drop T below Tc = 4.2 K and watch the field lines peel off the sphere — and the interior go dark. This happens even if cooled while already in the field.
      </p>
    </div>
  );
}

/**
 * Streamline deflection model: treat the superconducting sphere as a
 * perfect diamagnet in a uniform field; the exterior field is the
 * sum of the uniform field plus a dipole image. The vertical offset
 * of a streamline at longitudinal position x is approximately
 *
 *   y(x) ≈ y₀ + (R³ / ρ³) · (y₀ − cy) · f(x)
 *
 * where ρ is the distance to the sphere centre. This is a visual
 * approximation — not a literal potential-flow solution — but it
 * preserves the "bulge outward near the equator, straight far away"
 * feel.
 */
function deflectedY(x: number, y0: number, cx: number, cy: number, R: number): number {
  const dx = x - cx;
  const dy = y0 - cy;
  const rho = Math.hypot(dx, dy);
  if (rho < R) return y0; // inside — caller should skip drawing
  // Push streamlines outward near the equator: amplitude falls as 1/ρ³
  // and is zero along the x-axis itself (dy = 0 streamline stays straight
  // but only until it is inside the sphere, which the caller filters).
  const amp = (R * R * R) / (rho * rho * rho);
  const bulge = amp * dy * 0.9;
  // Smooth taper so the effect only lives within ~2R of the sphere
  const taper = Math.exp(-(dx * dx) / (1.8 * R * R));
  return y0 + bulge * taper;
}

function Slider({
  label,
  value,
  min,
  max,
  step,
  onChange,
  unit,
  accent,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (v: number) => void;
  unit: string;
  accent: string;
}) {
  return (
    <label className="flex items-center gap-2 text-xs font-mono text-[var(--color-fg-2)]">
      <span className="w-6 text-[var(--color-fg-1)]">{label}</span>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className="flex-1"
        style={{ accentColor: accent }}
      />
      <span className="w-20 text-right text-[var(--color-fg-1)]">
        {value.toFixed(2)} {unit}
      </span>
    </label>
  );
}
