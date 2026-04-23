"use client";

import { useEffect, useRef, useState } from "react";
import { useAnimationFrame } from "@/lib/animation/use-animation-frame";
import { useThemeColors } from "@/lib/hooks/use-theme-colors";
import {
  reflectionCoefficient,
  swr,
  standingWaveEnvelope,
} from "@/lib/physics/electromagnetism/transmission-lines";

const RATIO = 0.42;
const MAX_HEIGHT = 340;

const Z0 = 50; // Ω reference characteristic impedance

/**
 * FIG.32c — standing wave on a mismatched line.
 *
 * A continuous sinusoidal source V₊·cos(ωt) drives the left end; the right
 * end is terminated with a load of impedance Z_L. The forward wave and its
 * reflection interfere along the line to produce a standing-wave pattern.
 *
 *   Envelope: |V(x)| = V₊·√(1 + Γ² + 2Γ·cos(2βx + φ))
 *   SWR     = (1 + |Γ|)/(1 − |Γ|)   — ratio of max to min envelope
 *
 * When Z_L = Z₀ the envelope is flat (SWR = 1). As Z_L moves away from Z₀,
 * the envelope develops nulls (at λ/4 intervals for a pure short) and the
 * SWR rises. At full reflection (Z_L = 0 or ∞), SWR is infinite.
 *
 * Slider controls Z_L/Z₀. The HUD shows the live Γ and SWR. The cyan
 * envelope traces the standing-wave amplitude; the amber wiggle inside is
 * the instantaneous V(x,t) at two successive snapshots to show the nodes
 * stand still.
 */
export function StandingWaveRatioScene() {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const colors = useThemeColors();
  const [size, setSize] = useState({ width: 720, height: 320 });
  const [zRatio, setZRatio] = useState(2); // Z_L / Z₀

  const zLoad = zRatio * Z0;
  const gamma = reflectionCoefficient(zLoad, Z0);
  const swrValue = swr(gamma);

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
        ctx.scale(dpr, dpr);
      }
      ctx.clearRect(0, 0, width, height);

      drawScene(ctx, colors, width, height, t, gamma, swrValue, zLoad);
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
          label="Z_L / Z₀"
          value={zRatio}
          min={0.05}
          max={6}
          step={0.05}
          unit=""
          accent="#78DCFF"
          onChange={setZRatio}
        />
      </div>
      <p className="mt-2 px-2 text-xs font-mono text-[var(--color-fg-3)]">
        cyan = |V(x)| standing envelope · amber = instantaneous V(x,t) ·
        drag Z_L off 50 Ω and the envelope ripples open
      </p>
    </div>
  );
}

function drawScene(
  ctx: CanvasRenderingContext2D,
  colors: { fg1: string; fg2: string; fg3: string },
  width: number,
  height: number,
  t: number,
  gamma: number,
  swrValue: number,
  zLoad: number,
) {
  const marginL = 50;
  const marginR = 60;
  const midY = height * 0.58;
  const axisLen = width - marginL - marginR;
  const forwardAmp = 1; // normalised

  // The line runs from x=0 at the SOURCE to x=L at the LOAD. In our envelope
  // formula, the position variable is measured FROM THE LOAD, so internally
  // we parametrise xFromLoad = L − xOnCanvas.
  // Fit two full wavelengths on the line for a clear picture.
  const lineLengthMetres = 2.0; // metres, purely visual
  const wavelength = 1.0;       // metres
  const beta = (2 * Math.PI) / wavelength;
  const omega = 2 * Math.PI * 1.5; // Hz rad/s visual speed

  // Axis
  ctx.strokeStyle = colors.fg3;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(marginL, midY);
  ctx.lineTo(marginL + axisLen, midY);
  ctx.stroke();

  // Compute envelope + instantaneous waveform
  const N = 240;
  const envelopeMax = (1 + Math.abs(gamma)) * forwardAmp;
  const vScale = Math.min(60, (height * 0.3) / Math.max(envelopeMax, 0.3));

  // Upper and lower envelope (cyan)
  const upperPts: Array<[number, number]> = [];
  const lowerPts: Array<[number, number]> = [];
  for (let i = 0; i <= N; i++) {
    const frac = i / N;
    const xCanvas = marginL + frac * axisLen;
    const xOnLine = frac * lineLengthMetres; // 0 at source, L at load
    const xFromLoad = lineLengthMetres - xOnLine;
    const env = standingWaveEnvelope(forwardAmp, gamma, beta, xFromLoad);
    upperPts.push([xCanvas, midY - env * vScale]);
    lowerPts.push([xCanvas, midY + env * vScale]);
  }

  // Fill between envelopes
  ctx.beginPath();
  ctx.moveTo(upperPts[0][0], upperPts[0][1]);
  for (const p of upperPts) ctx.lineTo(p[0], p[1]);
  for (let i = lowerPts.length - 1; i >= 0; i--) {
    ctx.lineTo(lowerPts[i][0], lowerPts[i][1]);
  }
  ctx.closePath();
  ctx.fillStyle = "rgba(120, 220, 255, 0.08)";
  ctx.fill();

  // Envelope curves
  ctx.strokeStyle = "rgba(120, 220, 255, 0.85)";
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  upperPts.forEach((p, i) => (i === 0 ? ctx.moveTo(p[0], p[1]) : ctx.lineTo(p[0], p[1])));
  ctx.stroke();
  ctx.beginPath();
  lowerPts.forEach((p, i) => (i === 0 ? ctx.moveTo(p[0], p[1]) : ctx.lineTo(p[0], p[1])));
  ctx.stroke();

  // Instantaneous waveform (amber): sum of forward and reflected cosines.
  // V(x,t) = V₊·cos(ωt − βx) + Γ·V₊·cos(ωt + βx + φ)
  // where φ = 0 for Γ ≥ 0, π for Γ < 0 (absorbed into the gamma-sign convention
  // matching the envelope helper).
  const absG = Math.abs(gamma);
  const phi = gamma >= 0 ? 0 : Math.PI;
  ctx.strokeStyle = "rgba(255, 214, 107, 0.9)";
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  for (let i = 0; i <= N; i++) {
    const frac = i / N;
    const xCanvas = marginL + frac * axisLen;
    const xOnLine = frac * lineLengthMetres;
    const xFromLoad = lineLengthMetres - xOnLine;
    const forward = forwardAmp * Math.cos(omega * t - beta * xFromLoad);
    const reflected = absG * forwardAmp * Math.cos(omega * t + beta * xFromLoad + phi);
    const v = forward + reflected;
    const y = midY - v * vScale;
    if (i === 0) ctx.moveTo(xCanvas, y);
    else ctx.lineTo(xCanvas, y);
  }
  ctx.stroke();

  // Source glyph
  drawSource(ctx, colors, marginL, midY);
  // Load glyph
  drawLoad(ctx, colors, marginL + axisLen, midY, zLoad);

  // Node markers (zeros of the envelope only appear for |Γ| > ~0.05)
  if (absG > 0.05) {
    ctx.fillStyle = "rgba(255, 106, 222, 0.85)";
    for (const [x, y] of upperPts) {
      const depth = Math.abs(y - midY);
      if (depth < 4) {
        ctx.beginPath();
        ctx.arc(x, midY, 2.2, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }

  // HUD
  ctx.font = "12px monospace";
  ctx.textAlign = "left";
  ctx.fillStyle = colors.fg1;
  ctx.fillText("FIG.32c — standing wave on mismatched line", 12, 20);

  ctx.font = "10px monospace";
  ctx.textAlign = "right";
  ctx.fillStyle = colors.fg2;
  ctx.fillText(
    `Z₀ = ${Z0} Ω   Z_L = ${zLoad.toFixed(1)} Ω   Γ = ${gamma.toFixed(3)}`,
    width - 12,
    20,
  );
  ctx.fillText(
    `SWR = (1+|Γ|)/(1−|Γ|) = ${Number.isFinite(swrValue) ? swrValue.toFixed(2) : "∞"}`,
    width - 12,
    34,
  );

  const band = classifySwr(swrValue);
  ctx.fillStyle = band.color;
  ctx.fillText(band.label, width - 12, 48);

  // x-axis label
  ctx.fillStyle = colors.fg3;
  ctx.textAlign = "left";
  ctx.fillText("SOURCE", marginL, midY + height * 0.28);
  ctx.textAlign = "right";
  ctx.fillText("LOAD", marginL + axisLen, midY + height * 0.28);
}

function drawSource(
  ctx: CanvasRenderingContext2D,
  colors: { fg1: string; fg2: string },
  x: number,
  y: number,
) {
  ctx.strokeStyle = colors.fg1;
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.arc(x - 16, y, 9, 0, Math.PI * 2);
  ctx.stroke();
  ctx.beginPath();
  for (let i = 0; i < 12; i++) {
    const px = x - 22 + i;
    const py = y + Math.sin((i / 12) * Math.PI * 2) * 3;
    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(x - 7, y);
  ctx.lineTo(x, y);
  ctx.stroke();
}

function drawLoad(
  ctx: CanvasRenderingContext2D,
  colors: { fg1: string; fg2: string },
  x: number,
  y: number,
  zLoad: number,
) {
  ctx.strokeStyle = colors.fg1;
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(x + 12, y);
  ctx.stroke();
  // Resistor zigzag
  const x0 = x + 12;
  const x1 = x + 44;
  const bumps = 4;
  const w = x1 - x0;
  const per = w / bumps;
  const amp = 4;
  ctx.beginPath();
  ctx.moveTo(x0, y);
  for (let i = 0; i < bumps; i++) {
    const xi = x0 + i * per;
    ctx.lineTo(xi + per * 0.25, y - amp);
    ctx.lineTo(xi + per * 0.75, y + amp);
    ctx.lineTo(xi + per, y);
  }
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(x1, y);
  ctx.lineTo(x1, y + 18);
  ctx.stroke();
  const sizes = [8, 5, 3];
  ctx.strokeStyle = colors.fg2;
  for (let i = 0; i < sizes.length; i++) {
    const w2 = sizes[i];
    const yy = y + 22 + i * 3;
    ctx.beginPath();
    ctx.moveTo(x1 - w2, yy);
    ctx.lineTo(x1 + w2, yy);
    ctx.stroke();
  }
  ctx.fillStyle = colors.fg2;
  ctx.font = "9px monospace";
  ctx.textAlign = "center";
  ctx.fillText(`${zLoad.toFixed(0)} Ω`, (x0 + x1) / 2, y - 10);
}

function classifySwr(swrValue: number): { label: string; color: string } {
  if (!Number.isFinite(swrValue)) {
    return { label: "total reflection (open or short)", color: "rgba(255, 106, 222, 0.9)" };
  }
  if (swrValue < 1.2) {
    return { label: "matched — engineering sweet spot", color: "rgba(120, 255, 170, 0.9)" };
  }
  if (swrValue < 2) {
    return { label: "acceptable mismatch (rigs tolerate this)", color: "rgba(120, 220, 255, 0.9)" };
  }
  if (swrValue < 4) {
    return { label: "significant mismatch — power wasted", color: "rgba(255, 214, 107, 0.9)" };
  }
  return { label: "severe mismatch — line nearly a resonator", color: "rgba(255, 106, 222, 0.9)" };
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
      <span className="w-16 text-[var(--color-fg-1)]">{label}</span>
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
      <span className="w-16 text-right text-[var(--color-fg-1)]">
        {value.toFixed(2)} {unit}
      </span>
    </label>
  );
}
