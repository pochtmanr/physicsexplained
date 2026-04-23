"use client";

import { useEffect, useRef, useState } from "react";
import { useAnimationFrame } from "@/lib/animation/use-animation-frame";
import { useThemeColors } from "@/lib/hooks/use-theme-colors";
import {
  driveAmplitude,
  qualityFactor,
  resonantFrequency,
} from "@/lib/physics/electromagnetism/rlc-resonance";

const RATIO = 0.55;
const MAX_HEIGHT = 420;

const L = 0.1;
const C = 1e-7;
const V0 = 1;

const COLOR_LOW = "#FFD66B"; // amber: low Q, broad
const COLOR_MID = "#6FB8C6"; // cyan: medium
const COLOR_HIGH = "#FF6ADE"; // magenta: high Q, sharp

/**
 * FIG.29b — three series-RLC resonance peaks sharing the same ω₀ but
 * different R. The reader slides R (the middle curve); the two outer curves
 * are fixed at half and double to act as references. Tall-narrow vs
 * wide-short shows how Q = ω₀L/R sets peak sharpness.
 */
export function QFactorScene() {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const colors = useThemeColors();
  const [size, setSize] = useState({ width: 700, height: 400 });
  const [R, setR] = useState(10);

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
    onFrame: () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      const { width, height } = size;
      const dpr = window.devicePixelRatio || 1;
      if (canvas.width !== width * dpr || canvas.height !== height * dpr) {
        canvas.width = width * dpr;
        canvas.height = height * dpr;
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      }
      ctx.clearRect(0, 0, width, height);

      const w0 = resonantFrequency(L, C);
      const omegaMin = w0 * 0.4;
      const omegaMax = w0 * 2.5;

      const plotL = 56;
      const plotR = width - 14;
      const plotT = 32;
      const plotB = height - 48;

      // Three R values: the user's R × {2, 1, 0.5}
      const scenarios = [
        { r: R * 2, color: COLOR_LOW, label: "low Q" },
        { r: R, color: COLOR_MID, label: "user" },
        { r: R * 0.5, color: COLOR_HIGH, label: "high Q" },
      ];

      // Y-normalisation: use the tallest peak among the three = V₀ / min(R).
      const rMin = Math.min(...scenarios.map((s) => s.r));
      const iPeakMax = V0 / rMin;
      const yFromI = (i: number) =>
        plotB - (i / (iPeakMax * 1.1)) * (plotB - plotT);

      // Linear frequency axis (Hz) for readability.
      const xFromOmega = (om: number) =>
        plotL + ((om - omegaMin) / (omegaMax - omegaMin)) * (plotR - plotL);

      // Frame
      ctx.strokeStyle = colors.fg3;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(plotL, plotT);
      ctx.lineTo(plotL, plotB);
      ctx.lineTo(plotR, plotB);
      ctx.stroke();

      // ω₀ guide
      const x0 = xFromOmega(w0);
      ctx.strokeStyle = "rgba(255, 255, 255, 0.3)";
      ctx.setLineDash([2, 4]);
      ctx.beginPath();
      ctx.moveTo(x0, plotT);
      ctx.lineTo(x0, plotB);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle = colors.fg2;
      ctx.font = "10px monospace";
      ctx.textAlign = "center";
      ctx.fillText("ω₀", x0, plotT - 4);

      // Plot the three curves.
      const N = 300;
      for (const s of scenarios) {
        ctx.strokeStyle = s.color;
        ctx.lineWidth = s.r === R ? 2 : 1.3;
        ctx.beginPath();
        for (let k = 0; k <= N; k++) {
          const frac = k / N;
          const om = omegaMin + frac * (omegaMax - omegaMin);
          const iMag = driveAmplitude(V0, s.r, L, C, om);
          const px = xFromOmega(om);
          const py = yFromI(iMag);
          if (k === 0) ctx.moveTo(px, py);
          else ctx.lineTo(px, py);
        }
        ctx.stroke();
      }

      // Half-power (−3 dB) horizontal line at I_peak/√2 for the user curve.
      const iPeakUser = V0 / R;
      const halfPow = iPeakUser / Math.SQRT2;
      ctx.strokeStyle = "rgba(255, 255, 255, 0.2)";
      ctx.setLineDash([1, 4]);
      ctx.beginPath();
      ctx.moveTo(plotL, yFromI(halfPow));
      ctx.lineTo(plotR, yFromI(halfPow));
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.textAlign = "left";
      ctx.fillStyle = colors.fg3;
      ctx.fillText("I_peak / √2", plotL + 6, yFromI(halfPow) - 4);

      // Axis labels
      ctx.fillStyle = colors.fg2;
      ctx.font = "10px monospace";
      ctx.textAlign = "center";
      ctx.fillText("ω (rad/s)", (plotL + plotR) / 2, plotB + 18);
      ctx.textAlign = "right";
      ctx.fillText(omegaMin.toExponential(1), plotL - 2, plotB + 12);
      ctx.fillText(w0.toExponential(1), x0 + 8, plotB + 12);
      ctx.fillText(omegaMax.toExponential(1), plotR + 2, plotB + 12);

      ctx.save();
      ctx.translate(plotL - 28, (plotT + plotB) / 2);
      ctx.rotate(-Math.PI / 2);
      ctx.textAlign = "center";
      ctx.fillText("|I(ω)|", 0, 0);
      ctx.restore();

      // Title + HUD
      ctx.fillStyle = colors.fg1;
      ctx.font = "12px monospace";
      ctx.textAlign = "left";
      ctx.fillText(
        "FIG.29b — same ω₀, three Qs: sharpness is all R",
        14,
        18,
      );

      const hx = width - 14;
      ctx.textAlign = "right";
      ctx.font = "10px monospace";
      for (let i = 0; i < scenarios.length; i++) {
        const s = scenarios[i];
        const q = qualityFactor(L, C, s.r);
        ctx.fillStyle = s.color;
        ctx.fillText(
          `${s.label}: R = ${s.r.toFixed(1)} Ω · Q = ${q.toFixed(1)}`,
          hx,
          plotT + 12 + i * 14,
        );
      }

      ctx.fillStyle = colors.fg3;
      ctx.textAlign = "left";
      ctx.fillText(
        "Q = (1/R)·√(L/C) = ω₀L/R   · at ω₀, |I| = V₀/R",
        14,
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
      <div className="mt-3 grid grid-cols-1 gap-2 px-2">
        <Slider
          label="R"
          value={R}
          min={1}
          max={100}
          step={1}
          unit="Ω"
          accent={COLOR_MID}
          onChange={setR}
        />
      </div>
      <p className="mt-2 px-2 text-xs font-mono text-[var(--color-fg-3)]">
        L = 100 mH, C = 100 nF · three resonance peaks sharing ω₀, differing
        only in Q
      </p>
    </div>
  );
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
        {value.toFixed(0)} {unit}
      </span>
    </label>
  );
}
