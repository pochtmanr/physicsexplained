"use client";

import { useEffect, useRef, useState } from "react";
import {
  P_ATM,
  RHO_WATER,
  sampleVenturi,
  type VenturiSample,
} from "@/lib/physics/bernoulli";
import { useAnimationFrame } from "@/lib/animation/use-animation-frame";
import { useThemeColors } from "@/lib/hooks/use-theme-colors";

const RATIO = 0.75;
const MAX_HEIGHT = 420;
const PIPE_LENGTH_M = 1.0; // arbitrary pipe length for physics

/**
 * Venturi-meter scene. A horizontal pipe narrows to a throat and opens
 * back out. The upper half shows the pipe walls with flow-arrow tracers
 * streaming through — they bunch up and speed up at the throat. The lower
 * half plots static pressure p(x) along the pipe, measured in gauge kPa
 * (i.e. p − p_atm). Sliders for inlet velocity and throat radius make the
 * pressure dip deeper or shallower.
 *
 * Physics (pure, from lib/physics/bernoulli):
 *   A(x) v(x) = A₁ v₁                 (continuity)
 *   p(x) + ½ρ v(x)² = const           (Bernoulli, horizontal pipe)
 */
export function VenturiScene() {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const colors = useThemeColors();
  const [inletVelocity, setInletVelocity] = useState(1.2); // m/s
  const [throatRadius, setThroatRadius] = useState(0.045); // m
  const [size, setSize] = useState({ width: 640, height: 420 });

  // Tracer particles that drift through the pipe following v(x) ∝ 1/A(x).
  // They live in pipe-coordinates: x ∈ [0, L], yFrac ∈ [-1, 1] (relative to
  // local radius).
  type Tracer = { x: number; yFrac: number };
  const tracersRef = useRef<Tracer[]>([]);
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

  const mouthRadius = 0.1; // m — fixed for simplicity
  const samples: VenturiSample[] = sampleVenturi({
    length: PIPE_LENGTH_M,
    mouthRadius,
    throatRadius,
    rho: RHO_WATER,
    inletVelocity,
    samples: 161,
  });

  const A1 = Math.PI * mouthRadius * mouthRadius;
  const velocityAt = (x: number): number => {
    // Linear interp over samples.
    const n = samples.length;
    const t = (x / PIPE_LENGTH_M) * (n - 1);
    const i = Math.max(0, Math.min(n - 2, Math.floor(t)));
    const f = t - i;
    return samples[i]!.velocity * (1 - f) + samples[i + 1]!.velocity * f;
  };
  const radiusAt = (x: number): number => {
    const n = samples.length;
    const t = (x / PIPE_LENGTH_M) * (n - 1);
    const i = Math.max(0, Math.min(n - 2, Math.floor(t)));
    const f = t - i;
    return samples[i]!.radius * (1 - f) + samples[i + 1]!.radius * f;
  };

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
      const dt = Math.min(0.05, t - lastRef.current);
      lastRef.current = t;

      ctx.clearRect(0, 0, width, height);

      // --- Layout ---
      const pad = 24;
      const pipeTop = 14;
      const pipeBandHeight = height * 0.46;
      const pipeMidY = pipeTop + pipeBandHeight / 2;
      const pipeLeft = pad;
      const pipeRight = width - pad;
      const pipeWidth = pipeRight - pipeLeft;
      const pxPerMetreX = pipeWidth / PIPE_LENGTH_M;
      const pxPerMetreY = (pipeBandHeight / 2 - 8) / mouthRadius;

      const plotTop = pipeTop + pipeBandHeight + 18;
      const plotBottom = height - 16;
      const plotH = plotBottom - plotTop;
      const plotLeft = pipeLeft;
      const plotRight = pipeRight;
      const plotW = plotRight - plotLeft;

      // --- Pipe walls ---
      ctx.strokeStyle = colors.fg2;
      ctx.lineWidth = 1;
      ctx.beginPath();
      for (let i = 0; i < samples.length; i++) {
        const s = samples[i]!;
        const px = pipeLeft + s.x * pxPerMetreX;
        const py = pipeMidY - s.radius * pxPerMetreY;
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.stroke();
      ctx.beginPath();
      for (let i = 0; i < samples.length; i++) {
        const s = samples[i]!;
        const px = pipeLeft + s.x * pxPerMetreX;
        const py = pipeMidY + s.radius * pxPerMetreY;
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.stroke();

      // Fluid tint
      ctx.fillStyle = "rgba(111, 184, 198, 0.08)";
      ctx.beginPath();
      for (let i = 0; i < samples.length; i++) {
        const s = samples[i]!;
        const px = pipeLeft + s.x * pxPerMetreX;
        const py = pipeMidY - s.radius * pxPerMetreY;
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      for (let i = samples.length - 1; i >= 0; i--) {
        const s = samples[i]!;
        const px = pipeLeft + s.x * pxPerMetreX;
        const py = pipeMidY + s.radius * pxPerMetreY;
        ctx.lineTo(px, py);
      }
      ctx.closePath();
      ctx.fill();

      // --- Tracers ---
      // Maintain roughly 90 tracers uniformly spread in x.
      const targetTracers = 90;
      const tracers = tracersRef.current;
      while (tracers.length < targetTracers) {
        tracers.push({
          x: Math.random() * PIPE_LENGTH_M,
          yFrac: (Math.random() * 2 - 1) * 0.8,
        });
      }

      // Advance each tracer by v(x)·dt, scaled so visuals work (the real
      // speeds in m/s would be too slow to see).
      const visualScale = 0.75;
      for (const p of tracers) {
        const v = velocityAt(p.x);
        p.x += v * dt * visualScale;
        if (p.x > PIPE_LENGTH_M) {
          p.x -= PIPE_LENGTH_M;
          p.yFrac = (Math.random() * 2 - 1) * 0.8;
        }
      }

      ctx.fillStyle = "#6FB8C6";
      for (const p of tracers) {
        const r = radiusAt(p.x);
        const px = pipeLeft + p.x * pxPerMetreX;
        const py = pipeMidY + p.yFrac * r * pxPerMetreY;
        const v = velocityAt(p.x);
        // Trail length proportional to local speed
        const tailLen = Math.min(18, 3 + v * 2);
        ctx.globalAlpha = 0.7;
        ctx.strokeStyle = "#6FB8C6";
        ctx.lineWidth = 1.3;
        ctx.beginPath();
        ctx.moveTo(px - tailLen, py);
        ctx.lineTo(px, py);
        ctx.stroke();
      }
      ctx.globalAlpha = 1;

      // Throat label
      const throatIdx = Math.floor(samples.length / 2);
      const throatSample = samples[throatIdx]!;
      const throatPx = pipeLeft + throatSample.x * pxPerMetreX;
      ctx.strokeStyle = colors.fg3;
      ctx.setLineDash([3, 4]);
      ctx.beginPath();
      ctx.moveTo(throatPx, pipeTop);
      ctx.lineTo(throatPx, plotBottom);
      ctx.stroke();
      ctx.setLineDash([]);

      // --- Pressure plot ---
      // Compute gauge pressure range for a stable vertical axis across
      // the currently-rendered samples.
      let pMin = Infinity;
      let pMax = -Infinity;
      for (const s of samples) {
        const pg = s.pressure - P_ATM;
        if (pg < pMin) pMin = pg;
        if (pg > pMax) pMax = pg;
      }
      // Pad the range so flat curves still look like curves.
      const span = Math.max(200, pMax - pMin);
      const pMid = (pMax + pMin) / 2;
      const pTop = pMid + span * 0.7;
      const pBot = pMid - span * 0.7;

      // Axis and zero line
      ctx.strokeStyle = colors.fg3;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(plotLeft, plotTop);
      ctx.lineTo(plotLeft, plotBottom);
      ctx.moveTo(plotLeft, plotBottom);
      ctx.lineTo(plotRight, plotBottom);
      ctx.stroke();

      // Zero-gauge dashed reference
      if (pBot < 0 && pTop > 0) {
        const zeroY =
          plotTop + ((pTop - 0) / (pTop - pBot)) * plotH;
        ctx.strokeStyle = colors.fg3;
        ctx.setLineDash([2, 5]);
        ctx.beginPath();
        ctx.moveTo(plotLeft, zeroY);
        ctx.lineTo(plotRight, zeroY);
        ctx.stroke();
        ctx.setLineDash([]);
      }

      // Pressure curve
      ctx.strokeStyle = "#E4C27A";
      ctx.lineWidth = 2;
      ctx.beginPath();
      for (let i = 0; i < samples.length; i++) {
        const s = samples[i]!;
        const pg = s.pressure - P_ATM;
        const px = plotLeft + (s.x / PIPE_LENGTH_M) * plotW;
        const py = plotTop + ((pTop - pg) / (pTop - pBot)) * plotH;
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.stroke();

      // Labels
      ctx.font = "12px monospace";
      ctx.fillStyle = colors.fg2;
      ctx.textAlign = "left";
      ctx.fillText("p(x) − p_atm  [kPa]", plotLeft + 4, plotTop - 4);

      // Readouts
      const v1 = samples[0]!.velocity;
      const v2 = throatSample.velocity;
      const dropKPa = (samples[0]!.pressure - throatSample.pressure) / 1000;
      ctx.textAlign = "left";
      ctx.fillStyle = colors.fg1;
      ctx.fillText(
        `v₁ = ${v1.toFixed(2)} m/s   v₂ = ${v2.toFixed(2)} m/s   A₁/A₂ = ${(
          (mouthRadius * mouthRadius) /
          (throatRadius * throatRadius)
        ).toFixed(2)}`,
        plotLeft + 4,
        plotBottom - 6,
      );
      ctx.textAlign = "right";
      ctx.fillStyle = dropKPa > 0 ? "#FF6B6B" : colors.fg1;
      ctx.fillText(
        `Δp  = p₁ − p₂ = ${dropKPa.toFixed(2)} kPa`,
        plotRight - 4,
        plotBottom - 6,
      );

      // Axis tick labels (top and bottom of span in kPa)
      ctx.textAlign = "right";
      ctx.fillStyle = colors.fg2;
      ctx.fillText(`${(pTop / 1000).toFixed(1)}`, plotLeft - 4, plotTop + 10);
      ctx.fillText(`${(pBot / 1000).toFixed(1)}`, plotLeft - 4, plotBottom - 2);
    },
  });

  return (
    <div ref={containerRef} className="w-full pb-4">
      <canvas
        ref={canvasRef}
        style={{ width: size.width, height: size.height }}
        className="block"
      />
      <div className="mt-2 grid grid-cols-1 gap-2 px-2 md:grid-cols-2">
        <SliderRow
          label="inlet v (m/s)"
          value={inletVelocity}
          min={0.2}
          max={3}
          step={0.05}
          onChange={setInletVelocity}
        />
        <SliderRow
          label="throat R (m)"
          value={throatRadius}
          min={0.02}
          max={0.09}
          step={0.002}
          onChange={setThroatRadius}
        />
      </div>
    </div>
  );
}

function SliderRow({
  label,
  value,
  min,
  max,
  step,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (v: number) => void;
}) {
  return (
    <div className="flex items-center gap-3">
      <label className="w-32 text-sm text-[var(--color-fg-3)]">{label}</label>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className="flex-1 accent-[#6FB8C6]"
      />
      <span className="w-14 text-right text-sm font-mono text-[var(--color-fg-1)]">
        {value.toFixed(3)}
      </span>
    </div>
  );
}
