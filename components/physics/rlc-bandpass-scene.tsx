"use client";

import { useEffect, useRef, useState } from "react";
import { useAnimationFrame } from "@/lib/animation/use-animation-frame";
import { useThemeColors } from "@/lib/hooks/use-theme-colors";
import {
  capacitorTransferMag,
  qualityFactor,
  resonantFrequency,
} from "@/lib/physics/electromagnetism/rlc-resonance";

const RATIO = 0.56;
const MAX_HEIGHT = 420;

const CYAN = "#6FB8C6";
const MAGENTA = "#FF6ADE";
const AMBER = "#FFD66B";

const L = 0.1;
const C = 1e-7;

/**
 * FIG.29c — capacitor-voltage transfer function of a series RLC.
 *
 * Plots |V_C / V_in| versus log ω. Low-ω limit: V_C ≈ V_in (the capacitor
 * impedance dominates, the full source drops across it → gain 1).
 * High-ω limit: the capacitor shorts, gain → 0 (roll-off 1/ω²). Near ω₀ the
 * reactive cancellation boosts the capacitor voltage by Q — a high-Q tank
 * amplifies the drive at resonance. That is what radio front-ends exploit.
 *
 * Slider: R. Higher R → lower Q → peak flattens into a shallow bump.
 */
export function RlcBandpassScene() {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const colors = useThemeColors();
  const [size, setSize] = useState({ width: 700, height: 400 });
  const [R, setR] = useState(5);

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
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      }
      ctx.clearRect(0, 0, width, height);

      const w0 = resonantFrequency(L, C);
      const Q = qualityFactor(L, C, R);

      const omegaMin = w0 * 0.1;
      const omegaMax = w0 * 10;

      const plotL = 60;
      const plotR = width - 14;
      const plotT = 40;
      const plotB = height - 48;

      // Frame
      ctx.strokeStyle = colors.fg3;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(plotL, plotT);
      ctx.lineTo(plotL, plotB);
      ctx.lineTo(plotR, plotB);
      ctx.stroke();

      // Y-normalisation: use max(Q, 1.5) so both high-Q and low-Q fit
      const yMax = Math.max(Q, 1.3) * 1.1;
      const xFromOmega = (om: number) =>
        plotL +
        (Math.log(om / omegaMin) / Math.log(omegaMax / omegaMin)) *
          (plotR - plotL);
      const yFromGain = (g: number) =>
        plotB - (g / yMax) * (plotB - plotT);

      // Gridlines: gain = 1 (unity)
      ctx.strokeStyle = "rgba(255, 255, 255, 0.15)";
      ctx.setLineDash([2, 4]);
      ctx.beginPath();
      ctx.moveTo(plotL, yFromGain(1));
      ctx.lineTo(plotR, yFromGain(1));
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle = colors.fg3;
      ctx.font = "10px monospace";
      ctx.textAlign = "left";
      ctx.fillText("|gain| = 1", plotL + 4, yFromGain(1) - 4);

      // ω₀ guide
      const x0 = xFromOmega(w0);
      ctx.strokeStyle = MAGENTA;
      ctx.setLineDash([3, 4]);
      ctx.beginPath();
      ctx.moveTo(x0, plotT);
      ctx.lineTo(x0, plotB);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle = MAGENTA;
      ctx.textAlign = "center";
      ctx.fillText("ω₀", x0, plotT - 4);

      // Transfer-function curve
      ctx.strokeStyle = CYAN;
      ctx.lineWidth = 1.75;
      ctx.beginPath();
      const N = 300;
      for (let k = 0; k <= N; k++) {
        const frac = k / N;
        const om = omegaMin * Math.pow(omegaMax / omegaMin, frac);
        const gain = capacitorTransferMag(R, L, C, om);
        const px = xFromOmega(om);
        const py = yFromGain(gain);
        if (k === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.stroke();

      // Peak marker at ω₀
      ctx.fillStyle = MAGENTA;
      ctx.beginPath();
      ctx.arc(x0, yFromGain(Q), 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = MAGENTA;
      ctx.textAlign = "left";
      ctx.font = "10px monospace";
      ctx.fillText(
        `Q = ${Q.toFixed(1)}  →  |V_C/V_in| at ω₀`,
        x0 + 8,
        yFromGain(Q) - 4,
      );

      // Swept marker to animate reading the gain
      const sweepPeriod = 6;
      const phase = (t % sweepPeriod) / sweepPeriod;
      const omegaNow = omegaMin * Math.pow(omegaMax / omegaMin, phase);
      const gainNow = capacitorTransferMag(R, L, C, omegaNow);
      const pxNow = xFromOmega(omegaNow);
      const pyNow = yFromGain(gainNow);
      ctx.fillStyle = AMBER;
      ctx.beginPath();
      ctx.arc(pxNow, pyNow, 3, 0, Math.PI * 2);
      ctx.fill();

      // Axis labels
      ctx.fillStyle = colors.fg2;
      ctx.textAlign = "center";
      ctx.font = "10px monospace";
      ctx.fillText("ω (log scale, rad/s)", (plotL + plotR) / 2, plotB + 18);

      ctx.save();
      ctx.translate(plotL - 32, (plotT + plotB) / 2);
      ctx.rotate(-Math.PI / 2);
      ctx.textAlign = "center";
      ctx.fillText("|V_C / V_in|", 0, 0);
      ctx.restore();

      // X-axis tick readouts for decades
      ctx.textAlign = "center";
      ctx.fillStyle = colors.fg3;
      const tickOmegas = [omegaMin, w0, omegaMax];
      const tickLabels = ["0.1·ω₀", "ω₀", "10·ω₀"];
      for (let i = 0; i < tickOmegas.length; i++) {
        ctx.fillText(tickLabels[i], xFromOmega(tickOmegas[i]), plotB + 32);
      }

      // Title
      ctx.fillStyle = colors.fg1;
      ctx.font = "12px monospace";
      ctx.textAlign = "left";
      ctx.fillText(
        "FIG.29c — capacitor-voltage transfer: the bandpass interpretation",
        14,
        18,
      );

      // HUD
      const hx = width - 14;
      ctx.textAlign = "right";
      ctx.font = "10px monospace";
      ctx.fillStyle = AMBER;
      ctx.fillText(
        `ω = ${omegaNow.toExponential(2)} rad/s → gain ${gainNow.toFixed(2)}`,
        hx,
        plotT + 12,
      );

      // Footer
      ctx.fillStyle = colors.fg3;
      ctx.textAlign = "left";
      ctx.fillText(
        "lo-ω: C dominates → gain ≈ 1   ·   hi-ω: C shorts → gain → 0   ·   peak at ω₀, height Q",
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
          max={80}
          step={1}
          unit="Ω"
          accent={CYAN}
          onChange={setR}
        />
      </div>
      <p className="mt-2 px-2 text-xs font-mono text-[var(--color-fg-3)]">
        L = 100 mH, C = 100 nF · the classic bandpass-filter shape of a
        series-RLC read across the capacitor
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
