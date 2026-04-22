"use client";

import { useEffect, useRef, useState } from "react";
import { useAnimationFrame } from "@/lib/animation/use-animation-frame";
import { useThemeColors } from "@/lib/hooks/use-theme-colors";
import {
  brakeDragCoefficient,
  brakeTimeConstant,
} from "@/lib/physics/electromagnetism/eddy-currents";

const RATIO = 0.58;
const MAX_HEIGHT = 440;

// Disk / rotor constants (scene units tuned for visible exponential decay).
const SIGMA = 3.5e7;       // S/m, aluminium-ish
const DISK_THICK = 3e-3;   // m
const AREA_EFF = 0.002;    // m²
const DISK_INERTIA = 0.02; // kg·m²
const R_EFF = 0.08;        // m
const OMEGA_0 = 28;        // rad/s (≈ 4.5 rev/s) starting spin
const RESET_PERIOD_S = 10;

/**
 * FIG.25c — eddy-current brake.
 *
 * Aluminium disk spinning between the poles of a permanent magnet. Induced
 * currents circulate in the disk, their field opposes the applied B by
 * Lenz, and the disk experiences a velocity-dependent torque that spins it
 * down exponentially.
 *
 * Slider: B (pole strength). The HUD shows drag coefficient c = σ t B² A_eff
 * and the resulting time constant τ = I / (c r²). Angular velocity curve
 * plotted on the right.
 */
export function MagneticBrakeScene() {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const colors = useThemeColors();
  const [size, setSize] = useState({ width: 700, height: 420 });
  const [B, setB] = useState(0.6); // T

  const stateRef = useRef({
    omega: OMEGA_0,
    theta: 0,
    cycleStart: 0,
    trace: [] as { t: number; omega: number }[],
  });

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
    onFrame: (t, dt) => {
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

      const s = stateRef.current;
      const h = Math.min(dt, 1 / 50);

      // Compute drag coefficient and update spin (exponential decay)
      const c = brakeDragCoefficient(SIGMA, DISK_THICK, B, AREA_EFF);
      const tau = brakeTimeConstant(DISK_INERTIA, c, R_EFF);
      // dω/dt = −ω/τ
      s.omega += (-s.omega / tau) * h;
      s.theta += s.omega * h;

      const tSince = t - s.cycleStart;
      s.trace.push({ t: tSince, omega: s.omega });
      if (s.trace.length > 1500) s.trace.shift();

      // Auto-reset cycle
      if (tSince > RESET_PERIOD_S) {
        s.omega = OMEGA_0;
        s.theta = 0;
        s.trace = [];
        s.cycleStart = t;
      }

      // Layout: left 50% = disk+magnets, right = ω(t) plot
      const leftW = width * 0.5;
      drawApparatus(ctx, colors, leftW, height, s.theta, B);
      drawOmegaPanel(
        ctx,
        colors,
        leftW + 12,
        14,
        width - leftW - 24,
        height - 28,
        s.trace,
        tau,
      );

      // HUD
      ctx.font = "12px monospace";
      ctx.textAlign = "left";
      ctx.fillStyle = colors.fg1;
      ctx.fillText("FIG.25c — eddy-current brake", 12, 18);
      ctx.fillStyle = colors.fg2;
      ctx.font = "10px monospace";
      ctx.fillText(
        `c = σ t B² A  →  τ = I / (c r²) ≈ ${tau.toFixed(2)} s`,
        12,
        32,
      );

      // Right-hand-rule badge
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
          label="|B|"
          value={B}
          min={0.1}
          max={1.5}
          step={0.05}
          unit="T"
          accent="#78DCFF"
          onChange={setB}
        />
      </div>
      <p className="mt-2 px-2 text-xs font-mono text-[var(--color-fg-3)]">
        drag scales as B² — doubling the magnet quarters the stopping time
      </p>
    </div>
  );
}

function drawApparatus(
  ctx: CanvasRenderingContext2D,
  colors: { fg1: string; fg2: string; fg3: string },
  w: number,
  h: number,
  theta: number,
  B: number,
) {
  const cx = w / 2;
  const cy = h / 2 + 10;
  const R = Math.min(w, h) * 0.28;

  // Magnet pole shoes (one above, one below the disk)
  const poleW = R * 1.3;
  const poleH = 22;
  // N pole (top, magenta)
  ctx.fillStyle = `rgba(255, 106, 222, ${0.55 + 0.4 * (B / 1.5)})`;
  ctx.fillRect(cx - poleW / 2, cy - R - poleH - 6, poleW, poleH);
  ctx.strokeStyle = colors.fg3;
  ctx.lineWidth = 1;
  ctx.strokeRect(cx - poleW / 2, cy - R - poleH - 6, poleW, poleH);
  ctx.fillStyle = "#07090E";
  ctx.font = "bold 11px monospace";
  ctx.textAlign = "center";
  ctx.fillText("N", cx, cy - R - poleH + 8);

  // S pole (bottom, cyan)
  ctx.fillStyle = `rgba(120, 220, 255, ${0.55 + 0.4 * (B / 1.5)})`;
  ctx.fillRect(cx - poleW / 2, cy + R + 6, poleW, poleH);
  ctx.strokeStyle = colors.fg3;
  ctx.strokeRect(cx - poleW / 2, cy + R + 6, poleW, poleH);
  ctx.fillStyle = "#07090E";
  ctx.fillText("S", cx, cy + R + poleH + 2);

  // B-field arrows between the poles (amber-ish; §03 palette has cyan for B,
  // but here amber reads better against the magenta/cyan poles)
  ctx.strokeStyle = `rgba(120, 220, 255, ${0.3 + 0.5 * (B / 1.5)})`;
  ctx.lineWidth = 1.2;
  for (let i = -2; i <= 2; i++) {
    const x = cx + i * (poleW / 5);
    ctx.beginPath();
    ctx.moveTo(x, cy - R - 4);
    ctx.lineTo(x, cy + R + 4);
    ctx.stroke();
    // small arrow head
    ctx.beginPath();
    ctx.moveTo(x, cy + R + 4);
    ctx.lineTo(x - 3, cy + R - 1);
    ctx.lineTo(x + 3, cy + R - 1);
    ctx.closePath();
    ctx.fillStyle = `rgba(120, 220, 255, ${0.4 + 0.5 * (B / 1.5)})`;
    ctx.fill();
  }

  // ── Disk (rotating) ──
  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(theta);

  // Disk fill
  ctx.beginPath();
  ctx.arc(0, 0, R, 0, Math.PI * 2);
  ctx.fillStyle = "rgba(180, 190, 210, 0.18)";
  ctx.fill();
  ctx.strokeStyle = colors.fg3;
  ctx.lineWidth = 1;
  ctx.stroke();

  // Spoke markers so rotation is visible
  ctx.strokeStyle = "rgba(180, 190, 210, 0.55)";
  ctx.lineWidth = 1.2;
  for (let k = 0; k < 6; k++) {
    const a = (k / 6) * Math.PI * 2;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(Math.cos(a) * R, Math.sin(a) * R);
    ctx.stroke();
  }

  // Eddy-current rings on the disk face where it passes through the field.
  // Two little loops in the "gap" between the poles, one CW, one CCW.
  ctx.strokeStyle = `rgba(120, 255, 170, ${0.5 + 0.5 * Math.min(1, B)})`;
  ctx.fillStyle = `rgba(120, 255, 170, ${0.6 + 0.4 * Math.min(1, B)})`;
  ctx.lineWidth = 1.4;

  const loopR = R * 0.22;
  const off = R * 0.5;
  // Loop A
  ctx.beginPath();
  ctx.arc(off, 0, loopR, 0, Math.PI * 2);
  ctx.stroke();
  // arrow on loop A (CCW)
  drawLoopArrow(ctx, off, -loopR + 1, 1);
  // Loop B (opposite direction)
  ctx.beginPath();
  ctx.arc(-off, 0, loopR, 0, Math.PI * 2);
  ctx.stroke();
  drawLoopArrow(ctx, -off, loopR - 1, -1);

  ctx.restore();

  // Axle dot
  ctx.fillStyle = colors.fg1;
  ctx.beginPath();
  ctx.arc(cx, cy, 3, 0, Math.PI * 2);
  ctx.fill();

  // Labels
  ctx.fillStyle = colors.fg2;
  ctx.font = "10px monospace";
  ctx.textAlign = "center";
  ctx.fillText("aluminium disk", cx, cy + R + poleH + 16);
}

function drawLoopArrow(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  dir: number,
) {
  ctx.beginPath();
  ctx.moveTo(x - 4 * dir, y);
  ctx.lineTo(x, y - 3);
  ctx.lineTo(x, y + 3);
  ctx.closePath();
  ctx.fill();
}

function drawOmegaPanel(
  ctx: CanvasRenderingContext2D,
  colors: { fg1: string; fg2: string; fg3: string },
  x: number,
  y: number,
  w: number,
  h: number,
  trace: { t: number; omega: number }[],
  tau: number,
) {
  // Frame
  ctx.strokeStyle = colors.fg3;
  ctx.lineWidth = 1;
  ctx.strokeRect(x, y, w, h);

  ctx.fillStyle = colors.fg2;
  ctx.font = "10px monospace";
  ctx.textAlign = "left";
  ctx.fillText("ω(t)  angular velocity", x + 6, y + 12);

  const padL = 40;
  const padR = 10;
  const padT = 18;
  const padB = 18;
  const plotW = w - padL - padR;
  const plotH = h - padT - padB;
  const tMax = RESET_PERIOD_S;
  const wMax = OMEGA_0 * 1.05;

  // Axes
  ctx.strokeStyle = "rgba(86, 104, 127, 0.55)";
  ctx.lineWidth = 0.8;
  ctx.beginPath();
  ctx.moveTo(x + padL, y + padT);
  ctx.lineTo(x + padL, y + padT + plotH);
  ctx.lineTo(x + padL + plotW, y + padT + plotH);
  ctx.stroke();

  // Axis labels
  ctx.fillStyle = colors.fg2;
  ctx.font = "9px monospace";
  ctx.textAlign = "right";
  ctx.fillText(`${OMEGA_0.toFixed(0)} rad/s`, x + padL - 4, y + padT + 4);
  ctx.fillText("0", x + padL - 4, y + padT + plotH + 2);
  ctx.textAlign = "center";
  ctx.fillText(`${RESET_PERIOD_S} s`, x + padL + plotW, y + padT + plotH + 12);
  ctx.fillText("t", x + padL + plotW / 2, y + padT + plotH + 12);

  if (trace.length < 2) return;

  // Exponential reference curve (ideal ω₀·e^(−t/τ)) — dashed
  ctx.strokeStyle = "rgba(255, 214, 107, 0.5)";
  ctx.setLineDash([3, 3]);
  ctx.beginPath();
  for (let i = 0; i <= 80; i++) {
    const t = (i / 80) * tMax;
    const omega = OMEGA_0 * Math.exp(-t / tau);
    const px = x + padL + (t / tMax) * plotW;
    const py = y + padT + (1 - omega / wMax) * plotH;
    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.stroke();
  ctx.setLineDash([]);

  // Live trace
  ctx.beginPath();
  ctx.strokeStyle = `rgba(120, 255, 170, 0.95)`;
  ctx.lineWidth = 1.6;
  ctx.shadowColor = "rgba(120, 255, 170, 0.7)";
  ctx.shadowBlur = 4;
  for (let i = 0; i < trace.length; i++) {
    const p = trace[i]!;
    const px = x + padL + (p.t / tMax) * plotW;
    const py = y + padT + (1 - Math.min(1, p.omega / wMax)) * plotH;
    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.stroke();
  ctx.shadowBlur = 0;

  // τ marker
  ctx.strokeStyle = "rgba(255, 106, 222, 0.5)";
  ctx.setLineDash([4, 4]);
  const tauX = x + padL + (tau / tMax) * plotW;
  if (tau < tMax) {
    ctx.beginPath();
    ctx.moveTo(tauX, y + padT);
    ctx.lineTo(tauX, y + padT + plotH);
    ctx.stroke();
    ctx.fillStyle = "rgba(255, 106, 222, 0.85)";
    ctx.setLineDash([]);
    ctx.font = "9px monospace";
    ctx.textAlign = "center";
    ctx.fillText("τ", tauX, y + padT - 4);
  }
  ctx.setLineDash([]);
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
        {value.toFixed(2)} {unit}
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
  // Curl arrow hinting induced current direction
  ctx.strokeStyle = "rgba(120, 255, 170, 0.9)";
  ctx.beginPath();
  ctx.arc(ox + 12, oy - 12, 5, -0.4, Math.PI * 1.3);
  ctx.stroke();
  ctx.fillStyle = "rgba(120, 255, 170, 0.9)";
  ctx.beginPath();
  ctx.moveTo(ox + 7, oy - 14);
  ctx.lineTo(ox + 10, oy - 16);
  ctx.lineTo(ox + 10, oy - 12);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = colors.fg3;
  ctx.font = "9px monospace";
  ctx.textAlign = "left";
  ctx.fillText("Lenz", ox + 19, oy - 9);
}
