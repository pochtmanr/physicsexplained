"use client";

import { useEffect, useRef, useState } from "react";
import { useAnimationFrame } from "@/lib/animation/use-animation-frame";
import { useThemeColors } from "@/lib/hooks/use-theme-colors";
import { EPSILON_0, MU_0, SPEED_OF_LIGHT } from "@/lib/physics/constants";
import { cFromMuEpsilon } from "@/lib/physics/relativity/maxwell-c";

/**
 * FIG.02a — Sliders for μ₀ and ε₀, live readout of c = 1/√(μ₀ε₀).
 *
 * Two sliders, expressed as multipliers of the modern SI values, let the
 * reader perturb the constants of vacuum electromagnetism and watch the
 * predicted speed of light shift in real time. At the modern SI values
 * (multipliers = 1.0) the readout locks in to 299,792,458 m/s — Maxwell's
 * 1862 prediction at exact precision.
 *
 * An animated EM wavefront propagates rightward across the canvas at the
 * predicted c, with its wavelength scaled to keep the visual frame the
 * same regardless of slider position — only the propagation speed of the
 * leading edge changes.
 *
 * Palette:
 *   amber   — the propagating EM wave (light)
 *   cyan    — the ε₀ track / electric character
 *   magenta — the μ₀ track / magnetic character
 */

const RATIO = 0.45;
const MAX_HEIGHT = 360;

export function CFromMuEpsilonScene() {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const colors = useThemeColors();

  const [muMult, setMuMult] = useState(1);
  const [epsMult, setEpsMult] = useState(1);
  const muRef = useRef(muMult);
  const epsRef = useRef(epsMult);
  useEffect(() => {
    muRef.current = muMult;
  }, [muMult]);
  useEffect(() => {
    epsRef.current = epsMult;
  }, [epsMult]);

  const [size, setSize] = useState({ width: 720, height: 320 });
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
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        ctx.scale(dpr, dpr);
      }
      ctx.clearRect(0, 0, width, height);

      const mu = MU_0 * muRef.current;
      const eps = EPSILON_0 * epsRef.current;
      const c = cFromMuEpsilon(mu, eps);
      const cRel = c / SPEED_OF_LIGHT;

      // axis baseline
      const cy = height * 0.55;
      ctx.strokeStyle = colors.fg3;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(40, cy);
      ctx.lineTo(width - 40, cy);
      ctx.stroke();

      // Travelling EM wavetrain: phase moves at cRel · constant
      const padX = 40;
      const usable = width - 2 * padX;
      const wavelengthPx = 80;
      const k = (2 * Math.PI) / wavelengthPx;
      const phaseSpeed = 60 * cRel; // px / s, scales with cRel
      const phase = (t / 1000) * phaseSpeed;
      const amp = height * 0.24;

      // E-field component (cyan, vertical sine)
      ctx.strokeStyle = colors.cyan;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      for (let px = 0; px <= usable; px += 2) {
        const y = cy - amp * Math.sin(k * px - phase);
        if (px === 0) ctx.moveTo(padX + px, y);
        else ctx.lineTo(padX + px, y);
      }
      ctx.stroke();

      // B-field component (magenta, also vertical, π/2 phase shifted into the page —
      // we draw it as a dashed mirror to suggest the orthogonal component)
      ctx.strokeStyle = colors.magenta;
      ctx.lineWidth = 1.5;
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      for (let px = 0; px <= usable; px += 2) {
        const y = cy + amp * 0.6 * Math.sin(k * px - phase);
        if (px === 0) ctx.moveTo(padX + px, y);
        else ctx.lineTo(padX + px, y);
      }
      ctx.stroke();
      ctx.setLineDash([]);

      // Leading wavefront marker (amber tick)
      const frontX = padX + ((phase / (2 * Math.PI)) * wavelengthPx) % usable;
      ctx.strokeStyle = "#FFC857";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(frontX, cy - amp - 10);
      ctx.lineTo(frontX, cy + amp + 10);
      ctx.stroke();

      // HUD: numerical readout
      ctx.fillStyle = colors.fg2;
      ctx.font = "12px ui-monospace, SFMono-Regular, monospace";
      const x0 = padX;
      let yh = 22;
      ctx.fillText(`μ₀ = ${(mu * 1e6).toFixed(6)} × 10⁻⁶ N/A²`, x0, yh);
      yh += 16;
      ctx.fillText(`ε₀ = ${(eps * 1e12).toFixed(6)} × 10⁻¹² F/m`, x0, yh);
      yh += 16;
      ctx.fillStyle = "#FFC857";
      ctx.fillText(`c = 1 / √(μ₀ε₀) = ${c.toExponential(8)} m/s`, x0, yh);

      // Right-side: deviation from modern SI value
      ctx.fillStyle = colors.fg2;
      const dev = ((c - SPEED_OF_LIGHT) / SPEED_OF_LIGHT) * 100;
      const devText = `Δ from modern c: ${dev >= 0 ? "+" : ""}${dev.toFixed(2)}%`;
      ctx.fillText(devText, width - padX - ctx.measureText(devText).width, 22);
    },
  });

  return (
    <div ref={containerRef} className="w-full">
      <div
        className="relative w-full overflow-hidden rounded-md bg-[#0A0C12]"
        style={{ height: size.height }}
      >
        <canvas ref={canvasRef} className="block h-full w-full" />
      </div>
      <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
        <label className="block font-mono text-xs text-white/70">
          <div className="mb-1 flex items-center justify-between">
            <span>μ₀ multiplier</span>
            <span className="opacity-60">{muMult.toFixed(3)}×</span>
          </div>
          <input
            type="range"
            min={0.25}
            max={4}
            step={0.001}
            value={muMult}
            onChange={(e) => setMuMult(parseFloat(e.target.value))}
            className="w-full accent-fuchsia-400"
          />
        </label>
        <label className="block font-mono text-xs text-white/70">
          <div className="mb-1 flex items-center justify-between">
            <span>ε₀ multiplier</span>
            <span className="opacity-60">{epsMult.toFixed(3)}×</span>
          </div>
          <input
            type="range"
            min={0.25}
            max={4}
            step={0.001}
            value={epsMult}
            onChange={(e) => setEpsMult(parseFloat(e.target.value))}
            className="w-full accent-cyan-400"
          />
        </label>
      </div>
      <p className="mt-2 font-mono text-[11px] text-white/50">
        At μ₀ × 1.000 and ε₀ × 1.000 the readout locks to c = 299,792,458 m/s
        — the value Maxwell predicted in 1862 from two electrostatic and
        magnetostatic constants that had nothing to do with optics.
      </p>
    </div>
  );
}
