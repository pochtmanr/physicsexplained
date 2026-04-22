"use client";

import { useEffect, useRef, useState } from "react";
import { useAnimationFrame } from "@/lib/animation/use-animation-frame";
import { useThemeColors } from "@/lib/hooks/use-theme-colors";
import { eddyPowerDensity } from "@/lib/physics/electromagnetism/eddy-currents";

const RATIO = 0.58;
const MAX_HEIGHT = 440;

const B0 = 0.05;        // T, peak axial field under pan
const D_SHEET = 2e-3;   // m, effective eddy-loop depth
const RHO_FE = 1e-7;    // Ω·m, rough iron resistivity

/**
 * FIG.25b — induction cooktop cross-section.
 *
 * A copper coil beneath a ceramic surface drives an AC field. Flux linkage
 * through the ferromagnetic pan bottom reverses 20 000+ times per second,
 * driving closed eddy currents that dissipate as I²R heat. The pan heats;
 * the coil and ceramic stay cool.
 *
 * Reader slides drive frequency. Heatmap brightness under the pan follows
 * the f² scaling from EQ.01 (up to a skin-depth cutoff).
 */
export function InductionHeatingScene() {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const colors = useThemeColors();
  const [size, setSize] = useState({ width: 700, height: 420 });
  const [freqKHz, setFreqKHz] = useState(25); // kHz, typical cooktop range

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

      const f = freqKHz * 1000; // Hz
      // Skin-depth cutoff: above ~60 kHz, further gains flatten in the pan bulk.
      const skinCutoff = 1 / (1 + Math.pow(f / 60000, 2));
      const power = eddyPowerDensity(B0, D_SHEET, f, RHO_FE) * skinCutoff;
      const powerNorm = Math.min(1, power / 5e6);

      // Instantaneous AC phase (slowed down for visual)
      const visiblePhase = Math.sin(2 * Math.PI * t * 0.8);

      // Layout
      const cx = width / 2;
      const cy = height / 2 + 20;

      // Pan (skillet) — top half.
      drawPan(ctx, colors, cx, cy, width, powerNorm);

      // Coil — bottom half.
      drawCoil(ctx, colors, cx, cy, width, visiblePhase);

      // Flux field lines (amber, alternating strength with phase)
      drawFluxLines(ctx, cx, cy, width, visiblePhase, powerNorm);

      // HUD
      ctx.font = "12px monospace";
      ctx.textAlign = "left";
      ctx.fillStyle = colors.fg1;
      ctx.fillText("FIG.25b — induction cooktop", 12, 18);
      ctx.fillStyle = colors.fg2;
      ctx.font = "10px monospace";
      ctx.fillText(`f = ${freqKHz.toFixed(0)} kHz`, 12, 32);
      ctx.fillText(
        `P/V ∝ B² d² f² / ρ  →  ${power.toExponential(2)} W/m³`,
        12,
        46,
      );

      // Skin-depth warning zone
      ctx.textAlign = "right";
      if (freqKHz < 8) {
        ctx.fillStyle = "rgba(255, 214, 107, 0.85)";
        ctx.fillText(
          "too low → flux penetrates too deep, audible hum",
          width - 12,
          32,
        );
      } else if (freqKHz > 70) {
        ctx.fillStyle = "rgba(255, 106, 222, 0.85)";
        ctx.fillText(
          "too high → skin depth shrinks, coil heats instead",
          width - 12,
          32,
        );
      } else {
        ctx.fillStyle = `rgba(120, 255, 170, 0.85)`;
        ctx.fillText("sweet spot for most cooktops", width - 12, 32);
      }

      // Right-hand-rule axes
      drawRHRBadge(ctx, 18, height - 14, colors);
    },
  });

  return (
    <div ref={containerRef} className="w-full pb-4">
      <canvas
        ref={canvasRef}
        style={{ width: size.width, height: size.height }}
        className="block"
      />
      <div className="mt-3 grid grid-cols-1 gap-2 px-2 sm:grid-cols-1">
        <Slider
          label="f"
          value={freqKHz}
          min={1}
          max={100}
          step={1}
          unit="kHz"
          accent="#78FFAA"
          onChange={setFreqKHz}
        />
      </div>
      <p className="mt-2 px-2 text-xs font-mono text-[var(--color-fg-3)]">
        eddies circulate in the pan bottom (green-cyan heatmap), power
        dissipates as I²R heat
      </p>
    </div>
  );
}

function drawPan(
  ctx: CanvasRenderingContext2D,
  colors: { fg1: string; fg2: string; fg3: string },
  cx: number,
  cy: number,
  width: number,
  powerNorm: number,
) {
  const panW = Math.min(width * 0.55, 340);
  const panH = 52;
  const panX = cx - panW / 2;
  const panY = cy - 110;

  // Pan body (cross-section, dark)
  ctx.fillStyle = "rgba(40, 48, 64, 0.9)";
  ctx.fillRect(panX, panY, panW, panH - 20);
  ctx.strokeStyle = colors.fg3;
  ctx.lineWidth = 1;
  ctx.strokeRect(panX, panY, panW, panH - 20);

  // Handle
  ctx.fillStyle = "rgba(50, 60, 80, 0.85)";
  ctx.fillRect(panX + panW, panY + 4, 40, 10);

  // ── Eddy heatmap on the pan bottom ──
  // Short arrows going around in closed loops + warm-colour fill.
  const bottomY = panY + panH - 20;
  const bandH = 12;
  ctx.save();
  ctx.globalCompositeOperation = "lighter";
  for (let i = 0; i < 6; i++) {
    const segY = bottomY + 2 + i * 1.2;
    const glow = powerNorm * (1 - i / 8);
    ctx.fillStyle = `rgba(255, 150 + i * 10, 80, ${glow * 0.25})`;
    ctx.fillRect(panX + 6, segY, panW - 12, bandH / 2);
  }
  ctx.restore();

  // Green-cyan eddy-loop arrows under the pan
  const nArrows = 9;
  ctx.strokeStyle = `rgba(120, 255, 170, ${0.35 + 0.55 * powerNorm})`;
  ctx.fillStyle = `rgba(120, 255, 170, ${0.55 + 0.4 * powerNorm})`;
  ctx.lineWidth = 1.4;
  for (let i = 0; i < nArrows; i++) {
    const t = (i + 0.5) / nArrows;
    const ax = panX + 10 + t * (panW - 20);
    const ay = bottomY + 6;
    // Draw a tiny circular loop (ellipse) per ring
    ctx.beginPath();
    ctx.ellipse(ax, ay, 8, 3, 0, 0, Math.PI * 2);
    ctx.stroke();
    // Arrowhead hinting direction (alternating)
    const dir = i % 2 === 0 ? 1 : -1;
    const tipX = ax + dir * 8;
    ctx.beginPath();
    ctx.moveTo(tipX, ay);
    ctx.lineTo(tipX - dir * 4, ay - 2);
    ctx.lineTo(tipX - dir * 4, ay + 2);
    ctx.closePath();
    ctx.fill();
  }

  // "PAN" label
  ctx.fillStyle = colors.fg2;
  ctx.font = "10px monospace";
  ctx.textAlign = "center";
  ctx.fillText("ferromagnetic pan base", cx, panY - 6);
}

function drawCoil(
  ctx: CanvasRenderingContext2D,
  colors: { fg1: string; fg2: string; fg3: string },
  cx: number,
  cy: number,
  width: number,
  phase: number,
) {
  const coilW = Math.min(width * 0.5, 320);
  const coilY = cy + 30;

  // Ceramic surface (thin translucent strip)
  ctx.fillStyle = "rgba(80, 100, 130, 0.25)";
  ctx.fillRect(cx - coilW / 2 - 20, coilY - 8, coilW + 40, 4);
  ctx.strokeStyle = colors.fg3;
  ctx.lineWidth = 0.8;
  ctx.strokeRect(cx - coilW / 2 - 20, coilY - 8, coilW + 40, 4);
  ctx.fillStyle = colors.fg2;
  ctx.font = "9px monospace";
  ctx.textAlign = "right";
  ctx.fillText("glass-ceramic", cx + coilW / 2 + 18, coilY - 12);

  // Coil turns (a row of circles alternating current direction by phase)
  const nTurns = 9;
  const spacing = coilW / (nTurns - 1);
  const leftMost = cx - coilW / 2;
  const dirSign = phase > 0 ? 1 : -1;

  for (let i = 0; i < nTurns; i++) {
    const x = leftMost + i * spacing;
    // Alternate current direction turn-to-turn around the coil
    const into = (i % 2 === 0) === (dirSign > 0);
    // Color: cyan in, magenta out, gradient by |phase|
    const mag = Math.abs(phase);
    const rgb = into ? "120, 220, 255" : "255, 106, 222";
    ctx.fillStyle = `rgba(${rgb}, ${0.5 + 0.4 * mag})`;
    ctx.strokeStyle = `rgba(${rgb}, 0.9)`;
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.arc(x, coilY + 8, 7, 0, Math.PI * 2);
    ctx.stroke();
    ctx.beginPath();
    if (into) {
      // cross symbol
      ctx.moveTo(x - 3, coilY + 5);
      ctx.lineTo(x + 3, coilY + 11);
      ctx.moveTo(x - 3, coilY + 11);
      ctx.lineTo(x + 3, coilY + 5);
      ctx.stroke();
    } else {
      // dot symbol
      ctx.fillStyle = `rgba(${rgb}, 1)`;
      ctx.arc(x, coilY + 8, 1.6, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // Label
  ctx.fillStyle = colors.fg2;
  ctx.font = "10px monospace";
  ctx.textAlign = "center";
  ctx.fillText("copper drive coil (AC)", cx, coilY + 30);
}

function drawFluxLines(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  _width: number,
  phase: number,
  powerNorm: number,
) {
  // Curve loops from coil into pan and back (alternating amber)
  const intensity = 0.3 + 0.5 * Math.abs(phase);
  ctx.strokeStyle = `rgba(255, 214, 107, ${intensity * (0.4 + 0.6 * powerNorm)})`;
  ctx.lineWidth = 1.3;
  const offsets = [-110, -70, -30, 30, 70, 110];
  for (const ox of offsets) {
    ctx.beginPath();
    ctx.moveTo(cx + ox, cy - 80);
    ctx.bezierCurveTo(
      cx + ox - 20,
      cy - 40,
      cx + ox + 20,
      cy + 20,
      cx + ox,
      cy + 38,
    );
    ctx.stroke();
  }
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

function drawRHRBadge(
  ctx: CanvasRenderingContext2D,
  ox: number,
  oy: number,
  colors: { fg2: string; fg3: string },
) {
  const len = 14;
  ctx.strokeStyle = colors.fg2;
  ctx.fillStyle = colors.fg2;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(ox, oy);
  ctx.lineTo(ox + len, oy);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(ox, oy);
  ctx.lineTo(ox, oy - len);
  ctx.stroke();
  ctx.strokeStyle = "rgba(120, 255, 170, 0.8)";
  ctx.beginPath();
  ctx.arc(ox + 10, oy - 10, 4, 0, Math.PI * 2);
  ctx.stroke();
  ctx.fillStyle = "rgba(120, 255, 170, 0.9)";
  ctx.beginPath();
  ctx.arc(ox + 10, oy - 10, 1.4, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = colors.fg3;
  ctx.font = "9px monospace";
  ctx.textAlign = "left";
  ctx.fillText("I_eddy", ox + 16, oy - 6);
}
