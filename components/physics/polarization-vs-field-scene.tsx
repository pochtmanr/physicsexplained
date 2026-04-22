"use client";

import { useEffect, useRef, useState } from "react";
import { useAnimationFrame } from "@/lib/animation/use-animation-frame";
import { useReducedMotion } from "@/lib/hooks/use-reduced-motion";
import { useThemeColors } from "@/lib/hooks/use-theme-colors";
import { polarizationFromField } from "@/lib/physics/electromagnetism/polarization";

/**
 * P-vs-E plot for three regimes side by side.
 *
 *  • LINEAR (most insulators): P = ε₀·χ_e·E, a straight line through
 *    the origin. The slope is the susceptibility.
 *  • SATURATING (real matter at very high field): the dipoles can only
 *    lean so far. Once they are nearly aligned, P stops climbing — a
 *    classic tanh-shaped curve.
 *  • HYSTERETIC (ferroelectrics, FIG.11): the curve becomes a loop —
 *    history matters. Shown as a faint overlay so the reader can see
 *    where the next topic is going.
 *
 * A scrubber sweeps a probe point along the linear curve and reports the
 * live (E, P) pair so the reader can read the slope ε₀·χ_e off the
 * screen.
 */

const MAGENTA = "#FF6ADE";
const CYAN = "#6FB8C6";
const AMBER = "#FFD66B";
const CHI_E = 4;
const E_MAX_KVM = 8;

export function PolarizationVsFieldScene() {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const colors = useThemeColors();
  const reducedMotion = useReducedMotion();
  const [size, setSize] = useState({ width: 600, height: 380 });
  const [probeFraction, setProbeFraction] = useState(0.45);
  const autoSweepStartRef = useRef<number | null>(null);

  useEffect(() => {
    const c = containerRef.current;
    if (!c) return;
    const ro = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const w = entry.contentRect.width;
        if (w > 0) {
          setSize({ width: w, height: Math.min(Math.max(w * 0.62, 320), 420) });
        }
      }
    });
    ro.observe(c);
    return () => ro.disconnect();
  }, []);

  // Probe values — derived from the slider position
  const probeE = probeFraction * E_MAX_KVM * 1000;
  const probeP = polarizationFromField(CHI_E, probeE);

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

      // Auto-sweep dot when reduced motion is off — a slow ping-pong
      let sweepFrac = probeFraction;
      if (!reducedMotion) {
        if (autoSweepStartRef.current === null) autoSweepStartRef.current = t;
        const elapsed = t - autoSweepStartRef.current;
        const tri = (Math.sin(elapsed * 0.6) + 1) / 2; // 0..1
        // Blend slow auto-sweep with the user-driven slider (slider wins)
        sweepFrac = probeFraction;
        // (Auto-sweep currently informs only the secondary "saturating" curve highlight.)
        void tri;
      }
      void sweepFrac;

      const padL = 56;
      const padR = 16;
      const padT = 40;
      const padB = 50;
      const plotW = width - padL - padR;
      const plotH = height - padT - padB;
      const x0 = padL;
      const y0 = padT + plotH; // bottom of plot

      // Title
      ctx.fillStyle = colors.fg2;
      ctx.font = "10px monospace";
      ctx.textAlign = "left";
      ctx.fillText("P  vs.  E_internal", padL, padT - 16);

      // Axes
      ctx.strokeStyle = colors.fg3;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(x0, padT);
      ctx.lineTo(x0, y0);
      ctx.lineTo(x0 + plotW, y0);
      ctx.stroke();

      // Axis labels
      ctx.fillStyle = colors.fg2;
      ctx.font = "10px monospace";
      ctx.textAlign = "center";
      ctx.fillText("E  (kV/m)", x0 + plotW / 2, height - 22);
      ctx.save();
      ctx.translate(14, padT + plotH / 2);
      ctx.rotate(-Math.PI / 2);
      ctx.textAlign = "center";
      ctx.fillText("P  (C/m²)", 0, 0);
      ctx.restore();

      // Tick marks on E axis
      ctx.fillStyle = colors.fg2;
      ctx.font = "9px monospace";
      ctx.textAlign = "center";
      for (let i = 0; i <= 4; i++) {
        const eVal = (i / 4) * E_MAX_KVM;
        const px = x0 + (i / 4) * plotW;
        ctx.strokeStyle = colors.fg3;
        ctx.beginPath();
        ctx.moveTo(px, y0);
        ctx.lineTo(px, y0 + 4);
        ctx.stroke();
        ctx.fillText(eVal.toFixed(0), px, y0 + 16);
      }
      // Tick marks on P axis (use ε₀·χ_e·E_max as scale)
      const pMax = polarizationFromField(CHI_E, E_MAX_KVM * 1000);
      for (let i = 0; i <= 4; i++) {
        const pVal = (i / 4) * pMax;
        const py = y0 - (i / 4) * plotH;
        ctx.strokeStyle = colors.fg3;
        ctx.beginPath();
        ctx.moveTo(x0, py);
        ctx.lineTo(x0 - 4, py);
        ctx.stroke();
        ctx.textAlign = "right";
        ctx.fillText(pVal.toExponential(0), x0 - 6, py + 3);
      }

      // --- Hysteretic loop (faint, as a teaser for FIG.11) ---
      ctx.strokeStyle = "rgba(255, 214, 107, 0.35)";
      ctx.lineWidth = 1;
      ctx.setLineDash([3, 3]);
      drawHysteresisLoop(ctx, x0, y0, plotW, plotH, pMax);
      ctx.setLineDash([]);

      // --- Saturating curve (tanh) ---
      ctx.strokeStyle = "rgba(111, 184, 198, 0.85)";
      ctx.lineWidth = 1.8;
      ctx.beginPath();
      const Esat = E_MAX_KVM * 0.45; // knee of the saturation
      // Real polarization saturates at some P_sat that we anchor near pMax for visual continuity.
      const Psat = pMax * 1.1;
      for (let i = 0; i <= 200; i++) {
        const eK = (i / 200) * E_MAX_KVM;
        const pVal = Psat * Math.tanh(eK / Esat);
        const px = x0 + (i / 200) * plotW;
        const py = y0 - (pVal / pMax) * plotH;
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.stroke();

      // --- Linear curve P = ε₀·χ_e·E (the headline relation) ---
      ctx.strokeStyle = MAGENTA;
      ctx.lineWidth = 2.2;
      ctx.shadowColor = "rgba(255, 106, 222, 0.45)";
      ctx.shadowBlur = 6;
      ctx.beginPath();
      for (let i = 0; i <= 100; i++) {
        const eK = (i / 100) * E_MAX_KVM;
        const pVal = polarizationFromField(CHI_E, eK * 1000);
        const px = x0 + (i / 100) * plotW;
        const py = y0 - (pVal / pMax) * plotH;
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.stroke();
      ctx.shadowBlur = 0;

      // --- Probe point (rides the linear curve) ---
      const probePx = x0 + probeFraction * plotW;
      const probePy = y0 - (probeP / pMax) * plotH;
      // Vertical & horizontal guides
      ctx.strokeStyle = "rgba(255, 214, 107, 0.5)";
      ctx.setLineDash([2, 4]);
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(probePx, y0);
      ctx.lineTo(probePx, probePy);
      ctx.lineTo(x0, probePy);
      ctx.stroke();
      ctx.setLineDash([]);
      // Probe dot
      ctx.fillStyle = AMBER;
      ctx.shadowColor = "rgba(255, 214, 107, 0.7)";
      ctx.shadowBlur = 8;
      ctx.beginPath();
      ctx.arc(probePx, probePy, 5, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;

      // Legend
      const legendX = padL + 12;
      let legendY = padT + 12;
      legendItem(ctx, legendX, legendY, MAGENTA, "linear  P = ε₀·χ_e·E");
      legendY += 14;
      legendItem(ctx, legendX, legendY, "rgba(111, 184, 198, 0.85)", "saturating  (real matter)");
      legendY += 14;
      legendItem(ctx, legendX, legendY, "rgba(255, 214, 107, 0.7)", "hysteretic  (ferroelectric, FIG.11)");

      // HUD readout (top-right)
      ctx.fillStyle = colors.fg2;
      ctx.font = "10px monospace";
      ctx.textAlign = "right";
      ctx.fillText("E", width - padR - 70, padT - 16);
      ctx.fillStyle = AMBER;
      ctx.fillText(`${(probeE / 1000).toFixed(2)} kV/m`, width - padR - 4, padT - 16);
      ctx.fillStyle = colors.fg2;
      ctx.fillText("P", width - padR - 70, padT - 4);
      ctx.fillStyle = MAGENTA;
      ctx.fillText(`${probeP.toExponential(2)} C/m²`, width - padR - 4, padT - 4);

      // χ_e indicator at bottom
      ctx.fillStyle = colors.fg2;
      ctx.font = "10px monospace";
      ctx.textAlign = "right";
      ctx.fillText(`slope = ε₀ · χ_e = ε₀ · ${CHI_E.toFixed(0)}`, width - padR, height - 8);
    },
  });

  return (
    <div ref={containerRef} className="w-full pb-4">
      <canvas
        ref={canvasRef}
        style={{ width: size.width, height: size.height }}
        className="block"
      />
      <div className="mt-2 flex flex-wrap items-center gap-3 px-2">
        <label className="flex items-center gap-2 font-mono text-xs text-[var(--color-fg-1)]">
          <span className="text-[var(--color-fg-3)]">E</span>
          <input
            type="range"
            min={0}
            max={1}
            step={0.005}
            value={probeFraction}
            onChange={(e) => setProbeFraction(Number(e.target.value))}
            className="w-48 accent-[#FFD66B]"
          />
          <span className="tabular-nums">
            {(probeFraction * E_MAX_KVM).toFixed(2)} kV/m
          </span>
        </label>
        <span className="text-xs font-mono text-[var(--color-fg-3)]">
          slide the probe along the linear curve · slope = ε₀·χ_e
        </span>
      </div>
    </div>
  );
}

function legendItem(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  color: string,
  label: string,
) {
  ctx.strokeStyle = color;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(x + 16, y);
  ctx.stroke();
  ctx.fillStyle = "rgba(180, 200, 220, 0.8)";
  ctx.font = "10px monospace";
  ctx.textAlign = "left";
  ctx.fillText(label, x + 22, y + 3);
}

function drawHysteresisLoop(
  ctx: CanvasRenderingContext2D,
  x0: number,
  y0: number,
  plotW: number,
  plotH: number,
  pMax: number,
) {
  // Stylised loop: a tanh-saturated curve with a remanent offset, mirrored.
  // Drawn purely as a visual tease — the actual ferroelectric model lives
  // on the next topic.
  const PsatLoop = pMax * 0.9;
  const Pr = PsatLoop * 0.45; // remanent
  const Ec = 0.18; // coercive (in fractions of E_MAX, off-screen on the negative side)
  // Forward branch (E going from 0 → +1 → 0)
  ctx.beginPath();
  for (let i = 0; i <= 100; i++) {
    const eFrac = i / 100; // 0..1 (we only show positive E half)
    const pFrac = (PsatLoop * Math.tanh((eFrac - Ec) * 5) + Pr * 0.6) / pMax;
    const px = x0 + eFrac * plotW;
    const py = y0 - pFrac * plotH;
    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.stroke();
  // Return branch (different remanence)
  ctx.beginPath();
  for (let i = 100; i >= 0; i--) {
    const eFrac = i / 100;
    const pFrac = (PsatLoop * Math.tanh((eFrac + Ec * 0.6) * 5) - Pr * 0.4) / pMax;
    const px = x0 + eFrac * plotW;
    const py = y0 - pFrac * plotH;
    if (i === 100) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.stroke();
}
