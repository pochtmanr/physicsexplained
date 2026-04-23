"use client";

import { useEffect, useRef, useState } from "react";
import { useAnimationFrame } from "@/lib/animation/use-animation-frame";
import { useThemeColors } from "@/lib/hooks/use-theme-colors";
import {
  bandwidth,
  driveAmplitude,
  qualityFactor,
  resonantFrequency,
} from "@/lib/physics/electromagnetism/rlc-resonance";

const RATIO = 0.58;
const MAX_HEIGHT = 440;

const AMBER = "#FFD66B";
const CYAN = "#6FB8C6";
const MAGENTA = "#FF6ADE";

// Fixed scene: L = 100 mH, C = 100 nF → ω₀ ≈ 10⁴ rad/s ≈ 1.59 kHz.
const L = 0.1;
const C = 1e-7;
const V0 = 1;

/**
 * FIG.29a — series RLC driven by a sine source. Sweeps the drive angular
 * frequency across the resonance and plots |I(ω)|. Peak at ω₀ = 1/√(LC).
 * The user slides R; at low R the peak is tall and narrow (high Q), at high
 * R it flattens out (low Q). The HUD tracks ω₀, Q, and bandwidth R/L.
 */
export function RlcResonanceScene() {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const colors = useThemeColors();
  const [size, setSize] = useState({ width: 700, height: 420 });
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
      const bw = bandwidth(L, C, R);

      // Sweep drive ω across the resonance curve.
      const omegaMin = w0 * 0.3;
      const omegaMax = w0 * 3;
      const sweepPeriod = 5; // seconds
      const phase = (t % sweepPeriod) / sweepPeriod;
      const omegaNow =
        omegaMin * Math.pow(omegaMax / omegaMin, phase);

      // ── Plot area (right 2/3 of canvas). Left 1/3 = schematic. ──
      const schemaW = Math.min(200, width * 0.3);
      const plotL = schemaW + 20;
      const plotR = width - 14;
      const plotT = 32;
      const plotB = height - 50;

      // Frame
      ctx.strokeStyle = colors.fg3;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(plotL, plotT);
      ctx.lineTo(plotL, plotB);
      ctx.lineTo(plotR, plotB);
      ctx.stroke();

      // Log-scale X axis helper
      const xFromOmega = (om: number) =>
        plotL +
        (Math.log(om / omegaMin) / Math.log(omegaMax / omegaMin)) *
          (plotR - plotL);

      // Peak amplitude for Y normalisation: at ω₀, |I| = V₀/R.
      const iPeak = V0 / R;
      const yFromI = (i: number) =>
        plotB - (i / (iPeak * 1.1)) * (plotB - plotT);

      // ω₀ gridline
      const x0 = xFromOmega(w0);
      ctx.strokeStyle = MAGENTA;
      ctx.lineWidth = 1;
      ctx.setLineDash([3, 4]);
      ctx.beginPath();
      ctx.moveTo(x0, plotT);
      ctx.lineTo(x0, plotB);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle = MAGENTA;
      ctx.font = "10px monospace";
      ctx.textAlign = "center";
      ctx.fillText("ω₀", x0, plotT - 4);

      // Draw |I(ω)| curve
      ctx.strokeStyle = CYAN;
      ctx.lineWidth = 1.75;
      ctx.beginPath();
      const N = 240;
      for (let k = 0; k <= N; k++) {
        const frac = k / N;
        const om = omegaMin * Math.pow(omegaMax / omegaMin, frac);
        const iMag = driveAmplitude(V0, R, L, C, om);
        const px = xFromOmega(om);
        const py = yFromI(iMag);
        if (k === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.stroke();

      // Marker at swept position
      const iNow = driveAmplitude(V0, R, L, C, omegaNow);
      const pxNow = xFromOmega(omegaNow);
      const pyNow = yFromI(iNow);
      ctx.fillStyle = AMBER;
      ctx.beginPath();
      ctx.arc(pxNow, pyNow, 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = AMBER;
      ctx.lineWidth = 0.8;
      ctx.setLineDash([1, 3]);
      ctx.beginPath();
      ctx.moveTo(pxNow, pyNow);
      ctx.lineTo(pxNow, plotB);
      ctx.stroke();
      ctx.setLineDash([]);

      // Axis labels
      ctx.fillStyle = colors.fg2;
      ctx.font = "10px monospace";
      ctx.textAlign = "center";
      ctx.fillText("ω (log scale)", (plotL + plotR) / 2, plotB + 18);
      ctx.save();
      ctx.translate(plotL - 18, (plotT + plotB) / 2);
      ctx.rotate(-Math.PI / 2);
      ctx.textAlign = "center";
      ctx.fillText("|I(ω)|", 0, 0);
      ctx.restore();

      // Y-axis tick at peak
      ctx.fillStyle = colors.fg2;
      ctx.textAlign = "right";
      ctx.fillText("V₀/R", plotL - 4, yFromI(iPeak) + 3);
      ctx.fillText("0", plotL - 4, plotB + 3);

      // ── Schematic (left panel) ──
      drawSchematic(ctx, colors, 14, 32, schemaW - 20, plotB - plotT);

      // Title
      ctx.fillStyle = colors.fg1;
      ctx.font = "12px monospace";
      ctx.textAlign = "left";
      ctx.fillText("FIG.29a — series RLC resonance curve", 14, 18);

      // HUD
      const hudX = width - 14;
      ctx.textAlign = "right";
      ctx.fillStyle = colors.fg2;
      ctx.font = "10px monospace";
      ctx.fillText(`ω₀ = ${w0.toExponential(2)} rad/s`, hudX, plotT + 12);
      ctx.fillText(`f₀ = ${(w0 / (2 * Math.PI)).toFixed(0)} Hz`, hudX, plotT + 26);
      ctx.fillText(`Q = ${Q.toFixed(1)}`, hudX, plotT + 40);
      ctx.fillText(`Δω = R/L = ${bw.toFixed(0)} rad/s`, hudX, plotT + 54);
      ctx.fillStyle = AMBER;
      ctx.fillText(
        `ω_drive = ${omegaNow.toExponential(2)} rad/s`,
        hudX,
        plotT + 72,
      );

      // Footer
      ctx.fillStyle = colors.fg3;
      ctx.font = "10px monospace";
      ctx.textAlign = "left";
      ctx.fillText(
        "peak at ω₀ = 1/√(LC) · width = R/L = ω₀/Q",
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
          max={200}
          step={1}
          unit="Ω"
          accent={CYAN}
          onChange={setR}
        />
      </div>
      <p className="mt-2 px-2 text-xs font-mono text-[var(--color-fg-3)]">
        L = 100 mH, C = 100 nF · slide R to watch the peak sharpen or flatten
      </p>
    </div>
  );
}

function drawSchematic(
  ctx: CanvasRenderingContext2D,
  colors: { fg1: string; fg2: string; fg3: string },
  x: number,
  y: number,
  w: number,
  h: number,
) {
  ctx.strokeStyle = "rgba(255, 255, 255, 0.85)";
  ctx.fillStyle = "rgba(255, 255, 255, 0.85)";
  ctx.lineWidth = 1.3;
  ctx.font = "10px monospace";
  ctx.textAlign = "center";

  // Bounds of the rectangular loop.
  const x0 = x + 10;
  const x1 = x + w - 10;
  const yTop = y + 20;
  const yBot = y + h - 20;

  // Top wire
  ctx.beginPath();
  ctx.moveTo(x0, yTop);
  ctx.lineTo(x1, yTop);
  ctx.stroke();
  // Bottom wire
  ctx.beginPath();
  ctx.moveTo(x0, yBot);
  ctx.lineTo(x1, yBot);
  ctx.stroke();
  // Left wire (source side)
  ctx.beginPath();
  ctx.moveTo(x0, yTop);
  ctx.lineTo(x0, yBot);
  ctx.stroke();
  // Right wire (series leg)
  ctx.beginPath();
  ctx.moveTo(x1, yTop);
  ctx.lineTo(x1, yBot);
  ctx.stroke();

  // AC source on left wire mid.
  const srcY = (yTop + yBot) / 2;
  ctx.beginPath();
  ctx.arc(x0, srcY, 9, 0, Math.PI * 2);
  ctx.stroke();
  // Sine glyph inside
  ctx.beginPath();
  for (let k = 0; k <= 20; k++) {
    const u = k / 20;
    const px = x0 - 6 + u * 12;
    const py = srcY - Math.sin(u * Math.PI * 2) * 3;
    if (k === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.stroke();
  ctx.fillStyle = colors.fg2;
  ctx.fillText("V", x0 - 20, srcY + 3);

  // Resistor on top wire
  const rCenter = (x0 + x1) / 2 - 26;
  drawResistor(ctx, rCenter - 20, yTop, 40);
  ctx.fillStyle = colors.fg2;
  ctx.fillText("R", rCenter, yTop - 10);

  // Inductor on top wire
  const lCenter = (x0 + x1) / 2 + 26;
  drawInductor(ctx, lCenter - 20, yTop, 40);
  ctx.fillStyle = colors.fg2;
  ctx.fillText("L", lCenter, yTop - 10);

  // Capacitor on right wire
  drawCapacitor(ctx, x1, (yTop + yBot) / 2);
  ctx.fillStyle = colors.fg2;
  ctx.fillText("C", x1 + 14, (yTop + yBot) / 2 + 3);

  // Ground triangle on bottom wire midpoint
  drawGround(ctx, (x0 + x1) / 2, yBot);
}

function drawResistor(ctx: CanvasRenderingContext2D, x: number, y: number, w: number) {
  ctx.strokeStyle = "rgba(255, 255, 255, 0.9)";
  ctx.lineWidth = 1.3;
  // zigzag
  ctx.beginPath();
  ctx.moveTo(x, y);
  const bumps = 6;
  for (let i = 0; i <= bumps; i++) {
    const px = x + (i / bumps) * w;
    const py = y + (i % 2 === 0 ? 0 : (i % 4 === 1 ? -5 : 5));
    // simple square wave
    if (i === 0) ctx.lineTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.lineTo(x + w, y);
  ctx.stroke();
  // Replace with proper zigzag
  ctx.beginPath();
  ctx.moveTo(x, y);
  const N = 6;
  const step = w / N;
  for (let i = 0; i < N; i++) {
    const px0 = x + i * step + step / 4;
    const px1 = x + i * step + (3 * step) / 4;
    const py = i % 2 === 0 ? y - 5 : y + 5;
    ctx.lineTo(px0, py);
    ctx.lineTo(px1, py);
  }
  ctx.lineTo(x + w, y);
  ctx.stroke();
}

function drawInductor(ctx: CanvasRenderingContext2D, x: number, y: number, w: number) {
  ctx.strokeStyle = "rgba(255, 255, 255, 0.9)";
  ctx.lineWidth = 1.3;
  const loops = 4;
  const r = w / (loops * 2);
  for (let i = 0; i < loops; i++) {
    ctx.beginPath();
    ctx.arc(x + r + i * r * 2, y, r, Math.PI, 0, false);
    ctx.stroke();
  }
}

function drawCapacitor(ctx: CanvasRenderingContext2D, x: number, y: number) {
  ctx.strokeStyle = "rgba(255, 255, 255, 0.9)";
  ctx.lineWidth = 1.5;
  // Plate above
  ctx.beginPath();
  ctx.moveTo(x - 9, y - 4);
  ctx.lineTo(x + 9, y - 4);
  ctx.stroke();
  // Plate below
  ctx.beginPath();
  ctx.moveTo(x - 9, y + 4);
  ctx.lineTo(x + 9, y + 4);
  ctx.stroke();
  // Tiny wire stubs (already handled by surrounding wire, but bridge the gap):
  ctx.beginPath();
  ctx.moveTo(x, y - 12);
  ctx.lineTo(x, y - 4);
  ctx.moveTo(x, y + 4);
  ctx.lineTo(x, y + 12);
  ctx.stroke();
}

function drawGround(ctx: CanvasRenderingContext2D, x: number, y: number) {
  ctx.strokeStyle = "rgba(255, 255, 255, 0.8)";
  ctx.lineWidth = 1.2;
  for (let i = 0; i < 3; i++) {
    const w = 14 - i * 4;
    ctx.beginPath();
    ctx.moveTo(x - w / 2, y + 4 + i * 3);
    ctx.lineTo(x + w / 2, y + 4 + i * 3);
    ctx.stroke();
  }
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(x, y + 4);
  ctx.stroke();
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
