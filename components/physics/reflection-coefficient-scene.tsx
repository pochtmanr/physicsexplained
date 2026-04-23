"use client";

import { useEffect, useRef, useState } from "react";
import { useAnimationFrame } from "@/lib/animation/use-animation-frame";
import { useThemeColors } from "@/lib/hooks/use-theme-colors";
import { reflectionCoefficient } from "@/lib/physics/electromagnetism/transmission-lines";

const RATIO = 0.4;
const MAX_HEIGHT = 320;

const Z0 = 50; // Ω reference characteristic impedance

/**
 * FIG.32b — reflection at a termination.
 *
 * An incident Gaussian pulse (amber) travels left-to-right down a line of
 * characteristic impedance Z₀ = 50 Ω. At the right end, a load of
 * impedance Z_L is attached; the slider sets Z_L as a multiple of Z₀.
 *
 * When the pulse reaches the load it reflects with coefficient
 * Γ = (Z_L − Z₀) / (Z_L + Z₀). The reflected pulse returns to the left,
 * with amplitude Γ·V₊ (positive = same sign, negative = inverted).
 *
 *   Z_L = Z₀      → Γ = 0   (matched — pulse absorbed)
 *   Z_L = ∞       → Γ = +1  (open — full, same-sign reflection)
 *   Z_L = 0       → Γ = −1  (short — full, inverted reflection)
 *   Z_L = 2·Z₀    → Γ = +1/3
 */
export function ReflectionCoefficientScene() {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const colors = useThemeColors();
  const [size, setSize] = useState({ width: 720, height: 280 });

  // Load impedance expressed as "ratio to Z₀" on the slider, then we convert.
  // Range chosen to hit all four canonical cases: 0 (short), 1 (matched),
  // 2 (mild), 5 (heavy mismatch), and a separate "open" toggle implied at the
  // right extreme by a large ratio.
  const [zLoadRatio, setZLoadRatio] = useState(1); // multiples of Z₀
  const [openCircuit, setOpenCircuit] = useState(false);

  const zLoad = openCircuit ? Infinity : zLoadRatio * Z0;
  const gamma = reflectionCoefficient(zLoad, Z0);

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

      drawScene(ctx, colors, width, height, t, gamma, zLoad, openCircuit);
    },
  });

  return (
    <div ref={containerRef} className="w-full pb-4">
      <canvas
        ref={canvasRef}
        style={{ width: size.width, height: size.height }}
        className="block"
      />
      <div className="mt-3 grid grid-cols-1 gap-2 px-2 sm:grid-cols-2">
        <Slider
          label="Z_L / Z₀"
          value={zLoadRatio}
          min={0}
          max={5}
          step={0.05}
          unit=""
          accent="#78DCFF"
          onChange={(v) => {
            setZLoadRatio(v);
            if (openCircuit) setOpenCircuit(false);
          }}
          disabled={openCircuit}
        />
        <label className="flex items-center gap-2 text-xs font-mono text-[var(--color-fg-2)]">
          <input
            type="checkbox"
            checked={openCircuit}
            onChange={(e) => setOpenCircuit(e.target.checked)}
          />
          <span>open circuit (Z_L → ∞, Γ = +1)</span>
        </label>
      </div>
      <p className="mt-2 px-2 text-xs font-mono text-[var(--color-fg-3)]">
        amber = incident pulse · lilac = reflected pulse with amplitude Γ·V₊ ·
        matched load (Z_L = Z₀) makes the reflected pulse disappear
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
  zLoad: number,
  openCircuit: boolean,
) {
  const marginL = 60;
  const marginR = 80;
  const midY = height * 0.55;
  const lineStart = marginL;
  const lineEnd = width - marginR;
  const lineLen = lineEnd - lineStart;

  // ── The transmission line ──
  ctx.strokeStyle = colors.fg2;
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  ctx.moveTo(lineStart, midY);
  ctx.lineTo(lineEnd, midY);
  ctx.stroke();

  // Tick marks every ~10% along the line
  ctx.strokeStyle = colors.fg3;
  ctx.lineWidth = 1;
  for (let i = 0; i <= 10; i++) {
    const x = lineStart + (i / 10) * lineLen;
    ctx.beginPath();
    ctx.moveTo(x, midY - 3);
    ctx.lineTo(x, midY + 3);
    ctx.stroke();
  }

  // ── The load at the right end ──
  drawLoad(ctx, colors, lineEnd, midY, zLoad, openCircuit);

  // Source at the left end (AC generator glyph)
  drawSource(ctx, colors, lineStart, midY);

  // ── Animated pulse ──
  // Cycle: pulse leaves the source at t=0, reaches load at t=T/2, reflected
  // pulse reaches source at t=T. Repeat.
  const T = 4.0;
  const tPhase = t % T;

  const amp = 22; // pixels of vertical deflection
  const sigmaPx = 14; // pulse width

  if (tPhase < T / 2) {
    // incident pulse travelling right
    const frac = tPhase / (T / 2);
    const px = lineStart + frac * lineLen;
    drawPulse(ctx, px, midY, amp, sigmaPx, "rgba(255, 214, 107,");
  } else {
    // reflected pulse travelling left, amplitude Γ·V₊
    const frac = (tPhase - T / 2) / (T / 2);
    const px = lineEnd - frac * lineLen;
    // sign of gamma controls polarity
    const reflectedAmp = gamma * amp;
    drawPulse(
      ctx,
      px,
      midY,
      reflectedAmp,
      sigmaPx,
      "rgba(200, 160, 255,",
    );
    // If matched, still render a hint label that absorption happened
    if (Math.abs(gamma) < 0.02) {
      ctx.fillStyle = colors.fg3;
      ctx.font = "10px monospace";
      ctx.textAlign = "center";
      ctx.fillText("absorbed (matched)", (lineStart + lineEnd) / 2, midY + 46);
    }
  }

  // ── HUD ──
  ctx.font = "12px monospace";
  ctx.textAlign = "left";
  ctx.fillStyle = colors.fg1;
  ctx.fillText("FIG.32b — reflection at a termination", 12, 20);

  ctx.font = "10px monospace";
  ctx.fillStyle = colors.fg2;
  ctx.textAlign = "right";
  const zLabel = openCircuit
    ? "Z_L = ∞"
    : `Z_L = ${zLoad.toFixed(1)} Ω`;
  ctx.fillText(`Z₀ = ${Z0} Ω   ${zLabel}`, width - 12, 20);
  ctx.fillText(`Γ = (Z_L − Z₀)/(Z_L + Z₀) = ${formatGamma(gamma)}`, width - 12, 34);

  // status colouring by magnitude of reflection
  const status = classifyGamma(gamma);
  ctx.fillStyle = status.color;
  ctx.fillText(status.label, width - 12, 48);
}

function drawPulse(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  amp: number,
  sigma: number,
  rgbaPrefix: string,
) {
  ctx.save();
  for (let dx = -40; dx <= 40; dx += 1) {
    const g = Math.exp(-(dx * dx) / (2 * sigma * sigma));
    const y = cy - amp * g;
    const alpha = 0.25 + 0.7 * Math.abs(g);
    ctx.strokeStyle = `${rgbaPrefix} ${alpha})`;
    ctx.lineWidth = 1.3;
    ctx.beginPath();
    ctx.moveTo(cx + dx, cy);
    ctx.lineTo(cx + dx, y);
    ctx.stroke();
  }
  ctx.restore();
}

function drawSource(
  ctx: CanvasRenderingContext2D,
  colors: { fg1: string; fg2: string },
  x: number,
  y: number,
) {
  ctx.strokeStyle = colors.fg1;
  ctx.lineWidth = 1.3;
  // short lead into the line
  ctx.beginPath();
  ctx.moveTo(x - 20, y);
  ctx.lineTo(x, y);
  ctx.stroke();
  // circle with sine wiggle
  ctx.beginPath();
  ctx.arc(x - 30, y, 10, 0, Math.PI * 2);
  ctx.stroke();
  ctx.beginPath();
  for (let i = 0; i < 12; i++) {
    const px = x - 36 + i;
    const py = y + Math.sin((i / 12) * Math.PI * 2) * 3;
    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.stroke();
  ctx.fillStyle = colors.fg2;
  ctx.font = "10px monospace";
  ctx.textAlign = "center";
  ctx.fillText("V₊", x - 30, y + 26);
}

function drawLoad(
  ctx: CanvasRenderingContext2D,
  colors: { fg1: string; fg2: string },
  x: number,
  y: number,
  zLoad: number,
  openCircuit: boolean,
) {
  // lead from line end to load glyph
  ctx.strokeStyle = colors.fg1;
  ctx.lineWidth = 1.3;
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(x + 20, y);
  ctx.stroke();

  if (openCircuit) {
    // open-circuit glyph: wire ends in empty space with a small gap mark
    ctx.beginPath();
    ctx.moveTo(x + 20, y - 8);
    ctx.lineTo(x + 20, y + 8);
    ctx.stroke();
    ctx.fillStyle = colors.fg2;
    ctx.font = "10px monospace";
    ctx.textAlign = "left";
    ctx.fillText("OPEN", x + 24, y + 4);
    return;
  }

  if (zLoad <= 1e-6) {
    // short circuit: a wire from line-end down to ground
    ctx.beginPath();
    ctx.moveTo(x + 20, y);
    ctx.lineTo(x + 20, y + 24);
    ctx.stroke();
    // ground
    const sizes = [10, 7, 4];
    ctx.strokeStyle = colors.fg2;
    for (let i = 0; i < sizes.length; i++) {
      const w = sizes[i];
      const yy = y + 28 + i * 3;
      ctx.beginPath();
      ctx.moveTo(x + 20 - w, yy);
      ctx.lineTo(x + 20 + w, yy);
      ctx.stroke();
    }
    ctx.fillStyle = colors.fg2;
    ctx.font = "10px monospace";
    ctx.textAlign = "left";
    ctx.fillText("SHORT", x + 36, y + 4);
    return;
  }

  // Generic resistor: zigzag
  drawResistor(ctx, colors, x + 20, x + 60, y);
  // Lead down to ground
  ctx.beginPath();
  ctx.moveTo(x + 60, y);
  ctx.lineTo(x + 60, y + 24);
  ctx.stroke();
  const sizes = [10, 7, 4];
  ctx.strokeStyle = colors.fg2;
  for (let i = 0; i < sizes.length; i++) {
    const w = sizes[i];
    const yy = y + 28 + i * 3;
    ctx.beginPath();
    ctx.moveTo(x + 60 - w, yy);
    ctx.lineTo(x + 60 + w, yy);
    ctx.stroke();
  }
  ctx.fillStyle = colors.fg2;
  ctx.font = "10px monospace";
  ctx.textAlign = "center";
  ctx.fillText(`Z_L`, x + 40, y - 10);
}

function drawResistor(
  ctx: CanvasRenderingContext2D,
  colors: { fg1: string },
  x0: number,
  x1: number,
  y: number,
) {
  ctx.strokeStyle = colors.fg1;
  ctx.lineWidth = 1.2;
  const bumps = 4;
  const w = x1 - x0;
  const per = w / bumps;
  const amp = 5;
  ctx.beginPath();
  ctx.moveTo(x0, y);
  for (let i = 0; i < bumps; i++) {
    const x = x0 + i * per;
    ctx.lineTo(x + per * 0.25, y - amp);
    ctx.lineTo(x + per * 0.75, y + amp);
    ctx.lineTo(x + per, y);
  }
  ctx.stroke();
}

function formatGamma(g: number): string {
  if (g === 1) return "+1";
  if (g === -1) return "−1";
  if (Math.abs(g) < 1e-4) return "0";
  return g.toFixed(3);
}

function classifyGamma(g: number): { label: string; color: string } {
  const mag = Math.abs(g);
  if (mag < 0.02) {
    return { label: "matched — no reflection", color: "rgba(120, 255, 170, 0.9)" };
  }
  if (g > 0.95) {
    return { label: "open — full same-sign reflection", color: "rgba(255, 214, 107, 0.9)" };
  }
  if (g < -0.95) {
    return { label: "short — full inverted reflection", color: "rgba(200, 160, 255, 0.9)" };
  }
  if (g > 0) {
    return { label: "partial reflection (same sign)", color: "rgba(255, 214, 107, 0.8)" };
  }
  return { label: "partial reflection (inverted)", color: "rgba(200, 160, 255, 0.8)" };
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
  disabled,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (v: number) => void;
  unit: string;
  accent: string;
  disabled?: boolean;
}) {
  return (
    <label
      className={`flex items-center gap-2 text-xs font-mono ${disabled ? "opacity-40" : ""} text-[var(--color-fg-2)]`}
    >
      <span className="w-16 text-[var(--color-fg-1)]">{label}</span>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className="flex-1"
        disabled={disabled}
        style={{ accentColor: accent }}
      />
      <span className="w-16 text-right text-[var(--color-fg-1)]">
        {value.toFixed(2)} {unit}
      </span>
    </label>
  );
}
