"use client";

import { useEffect, useRef, useState } from "react";
import { useAnimationFrame } from "@/lib/animation/use-animation-frame";
import { useThemeColors } from "@/lib/hooks/use-theme-colors";
import {
  zResistor,
  zInductor,
  zCapacitor,
  zSeries,
  cabs,
  cphase,
} from "@/lib/physics/electromagnetism/ac-phasors";

const RATIO = 0.55;
const MAX_HEIGHT = 400;
const OMEGA = 2 * Math.PI * 50; // 50 Hz

/**
 * FIG.30b — impedance triangle in the complex plane.
 *
 * Three sliders (R, L, C) at a fixed ω = 2π·50 rad/s. The real axis is R,
 * the imaginary axis is reactance X = X_L − X_C (positive above, negative
 * below). The hypotenuse is |Z| at angle φ = arctan(X/R).
 *
 * As the reader drags the sliders:
 *   - R extends the horizontal leg (real)
 *   - L pushes the vertical leg up (inductive)
 *   - C pushes it down (capacitive, −1/ωC)
 *   - |Z| and φ update in the HUD
 *
 * This is the visual companion to the §3 equations. Reactance stops being
 * an abstract symbol and becomes a leg of a right triangle.
 */
export function ImpedanceTriangleScene() {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const colors = useThemeColors();
  const [size, setSize] = useState({ width: 680, height: 400 });
  const [R, setR] = useState(40); // ohms
  const [L, setL] = useState(80e-3); // henries — 80 mH
  const [C, setC] = useState(120e-6); // farads — 120 µF

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
        ctx.scale(dpr, dpr);
      }
      ctx.clearRect(0, 0, width, height);

      // Compute impedance
      const Z = zSeries([
        zResistor(R),
        zInductor(OMEGA, L),
        zCapacitor(OMEGA, C),
      ]);
      const mag = cabs(Z);
      const phi = cphase(Z); // in (−π, π]
      const XL = OMEGA * L;
      const XC = 1 / (OMEGA * C);
      const X = XL - XC;

      drawTriangle(ctx, colors, 0, 0, width, height, Z, R, X);

      // Top label
      ctx.fillStyle = colors.fg1;
      ctx.font = "12px monospace";
      ctx.textAlign = "left";
      ctx.fillText(
        "FIG.30b — impedance triangle   Z = R + jX  (ω = 2π·50 rad/s)",
        12,
        18,
      );

      // HUD on top-right
      ctx.fillStyle = colors.fg2;
      ctx.font = "10px monospace";
      ctx.textAlign = "right";
      ctx.fillText(`|Z| = ${mag.toFixed(2)} Ω`, width - 12, 18);
      ctx.fillText(
        `φ = ${((phi * 180) / Math.PI).toFixed(1)}°`,
        width - 12,
        32,
      );
      ctx.fillText(
        `X_L = ${XL.toFixed(2)} Ω · X_C = ${XC.toFixed(2)} Ω · X = ${X.toFixed(2)} Ω`,
        width - 12,
        46,
      );
    },
  });

  return (
    <div ref={containerRef} className="w-full pb-4">
      <canvas
        ref={canvasRef}
        style={{ width: size.width, height: size.height }}
        className="block rounded-md"
      />
      <div className="mt-3 grid grid-cols-1 gap-2 px-2 sm:grid-cols-3">
        <Slider
          label="R"
          value={R}
          min={1}
          max={120}
          step={1}
          unit="Ω"
          accent="#78DCFF"
          onChange={setR}
        />
        <Slider
          label="L"
          value={L * 1000}
          min={0}
          max={400}
          step={5}
          unit="mH"
          accent="#FF6ADE"
          onChange={(v) => setL(v / 1000)}
        />
        <Slider
          label="C"
          value={C * 1e6}
          min={10}
          max={400}
          step={5}
          unit="µF"
          accent="#FFD66B"
          onChange={(v) => setC(v / 1e6)}
        />
      </div>
      <p className="mt-2 px-2 text-xs font-mono text-[var(--color-fg-3)]">
        inductive reactance pushes X positive (triangle tips up), capacitive
        pushes it negative (tips down); X = 0 is series resonance
      </p>
    </div>
  );
}

function drawTriangle(
  ctx: CanvasRenderingContext2D,
  colors: { fg1: string; fg2: string; fg3: string },
  x: number,
  y: number,
  w: number,
  h: number,
  Z: { re: number; im: number },
  R: number,
  X: number,
) {
  const padT = 38;
  const padB = 40;
  const padL = 70;
  const padR = 40;
  const ox = x + padL;
  const oy = y + h - padB - (h - padT - padB) / 2; // origin mid-vertical
  const plotW = w - padL - padR;
  const plotH = h - padT - padB;

  // Axis limits — pick a scale that fits the largest component comfortably
  const maxMag = Math.max(Math.abs(R), Math.abs(X), 20) * 1.15;
  const kx = plotW / maxMag;
  const ky = plotH / 2 / maxMag;

  // Grid
  ctx.strokeStyle = "rgba(86, 104, 127, 0.25)";
  ctx.lineWidth = 0.8;
  const step = tickStep(maxMag);
  for (let v = -Math.ceil(maxMag / step) * step; v <= maxMag; v += step) {
    const gx = ox + v * kx;
    if (gx < ox - 1 || gx > ox + plotW) continue;
    ctx.beginPath();
    ctx.moveTo(gx, oy - plotH / 2);
    ctx.lineTo(gx, oy + plotH / 2);
    ctx.stroke();
  }
  for (let v = -Math.ceil(maxMag / step) * step; v <= maxMag; v += step) {
    const gy = oy - v * ky;
    if (gy < oy - plotH / 2 - 1 || gy > oy + plotH / 2 + 1) continue;
    ctx.beginPath();
    ctx.moveTo(ox, gy);
    ctx.lineTo(ox + plotW, gy);
    ctx.stroke();
  }

  // Axes
  ctx.strokeStyle = "rgba(160, 176, 200, 0.7)";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(ox, oy - plotH / 2);
  ctx.lineTo(ox, oy + plotH / 2);
  ctx.moveTo(ox, oy);
  ctx.lineTo(ox + plotW, oy);
  ctx.stroke();

  // Axis labels
  ctx.fillStyle = colors.fg3;
  ctx.font = "10px monospace";
  ctx.textAlign = "left";
  ctx.fillText("Re  (R, Ω)", ox + plotW - 70, oy - 6);
  ctx.textAlign = "left";
  ctx.fillText("j·Im  (X, Ω)", ox + 6, oy - plotH / 2 + 12);
  ctx.textAlign = "right";
  ctx.fillText("+X (inductive)", ox - 6, oy - plotH / 2 + 12);
  ctx.fillText("−X (capacitive)", ox - 6, oy + plotH / 2 - 4);

  // Tick labels (just a couple)
  ctx.fillStyle = colors.fg3;
  ctx.font = "9px monospace";
  ctx.textAlign = "center";
  ctx.fillText(`${step}`, ox + step * kx, oy + 12);
  ctx.textAlign = "right";
  ctx.fillText(`+${step}`, ox - 4, oy - step * ky + 3);
  ctx.fillText(`−${step}`, ox - 4, oy + step * ky + 3);

  // Triangle legs
  const zx = ox + R * kx;
  const zy = oy - X * ky;

  // Horizontal leg: R (on the real axis) — cyan
  ctx.strokeStyle = "rgba(120, 220, 255, 0.9)";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(ox, oy);
  ctx.lineTo(zx, oy);
  ctx.stroke();

  // Vertical leg: X (parallel to imag axis) — lilac
  ctx.strokeStyle = "rgba(200, 160, 255, 0.9)";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(zx, oy);
  ctx.lineTo(zx, zy);
  ctx.stroke();

  // Hypotenuse: |Z| — magenta with glow
  ctx.shadowColor = "rgba(255, 106, 222, 0.6)";
  ctx.shadowBlur = 8;
  ctx.strokeStyle = "rgba(255, 106, 222, 0.95)";
  ctx.lineWidth = 2.4;
  ctx.beginPath();
  ctx.moveTo(ox, oy);
  ctx.lineTo(zx, zy);
  ctx.stroke();
  ctx.shadowBlur = 0;

  // Tip dot
  ctx.fillStyle = "rgba(255, 106, 222, 1)";
  ctx.beginPath();
  ctx.arc(zx, zy, 3.5, 0, Math.PI * 2);
  ctx.fill();

  // Leg labels
  ctx.textAlign = "center";
  ctx.font = "11px monospace";
  ctx.fillStyle = "rgba(120, 220, 255, 0.95)";
  ctx.fillText(`R = ${R.toFixed(1)}Ω`, (ox + zx) / 2, oy + 16);
  ctx.fillStyle = "rgba(200, 160, 255, 0.95)";
  ctx.fillText(
    `X = ${X.toFixed(1)}Ω`,
    zx + (X >= 0 ? 28 : 28),
    (oy + zy) / 2,
  );
  ctx.fillStyle = "rgba(255, 106, 222, 0.95)";
  ctx.font = "bold 11px monospace";
  ctx.fillText(
    `|Z| = ${cabs(Z).toFixed(1)}Ω`,
    (ox + zx) / 2 - 6,
    (oy + zy) / 2 - 6,
  );

  // Phase arc at origin
  const phi = Math.atan2(-X, R);
  const rArc = Math.min(40, Math.hypot(zx - ox, zy - oy) * 0.35);
  ctx.strokeStyle = "rgba(255, 214, 107, 0.9)";
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  if (phi >= 0) {
    ctx.arc(ox, oy, rArc, 0, phi, false);
  } else {
    ctx.arc(ox, oy, rArc, phi, 0, false);
  }
  ctx.stroke();
  ctx.fillStyle = "rgba(255, 214, 107, 0.95)";
  ctx.font = "bold 10px monospace";
  ctx.textAlign = "left";
  const phiDeg = (-phi * 180) / Math.PI; // in triangle terms (flipped y)
  ctx.fillText(
    `φ = ${phiDeg.toFixed(0)}°`,
    ox + rArc + 4,
    oy - Math.sign(phi) * 4,
  );
}

function tickStep(maxMag: number) {
  // Pick a round-number tick spacing near maxMag/4.
  const target = maxMag / 4;
  const pow = Math.pow(10, Math.floor(Math.log10(target)));
  const norm = target / pow;
  if (norm < 1.5) return 1 * pow;
  if (norm < 3) return 2 * pow;
  if (norm < 7.5) return 5 * pow;
  return 10 * pow;
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
        {value.toFixed(value < 10 ? 1 : 0)} {unit}
      </span>
    </label>
  );
}
