"use client";

import { useEffect, useRef, useState } from "react";
import { useAnimationFrame } from "@/lib/animation/use-animation-frame";
import { useThemeColors } from "@/lib/hooks/use-theme-colors";

const RATIO = 0.52;
const MAX_HEIGHT = 420;

const V_AMP = 1.0; // phasor radius for V (unit-scaled)
const I_AMP = 0.82; // phasor radius for I, slightly smaller so traces don't overlap
const OMEGA = 2 * Math.PI * 0.35; // rad/s in scene-time — slow enough to read

/**
 * FIG.30a — THE MONEY SHOT.
 *
 * Two side-by-side panels, synchronized by a single phase slider φ.
 *
 *  LEFT — the rotating phasor diagram.
 *    Two arrows on a unit-ish circle, rotating at angular velocity ω.
 *    V̂ is drawn in magenta; Î is drawn in amber, lagging V̂ by φ.
 *    The angle between them IS the power-factor angle. Drag the slider
 *    and the amber arrow re-positions its lag.
 *
 *  RIGHT — the oscilloscope trace.
 *    v(t) = V·cos(ωt)          (magenta)
 *    i(t) = I·cos(ωt − φ)      (amber)
 *    Both traces scroll left as time advances, so the reader watches the
 *    peaks drift apart or close up as they change φ.
 *
 * HUD reads the current φ in degrees and the corresponding power factor
 * cos(φ). At φ = 0 (bottom of slider range is capacitive, top is inductive),
 * the peaks align and cos(φ) = 1.00 — the reader sees the resistive case.
 *
 * This is THE moment impedance clicks visually: the "j" in Z = R + jX
 * is nothing but a rotation of the current phasor relative to the
 * voltage phasor.
 */
export function PhasorDiagramScene() {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const colors = useThemeColors();
  const [size, setSize] = useState({ width: 720, height: 400 });
  const [phi, setPhi] = useState(0); // phase lag of I behind V, rad; range (−π/2, π/2)
  const thetaRef = useRef(0);

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
    onFrame: (_t, dt) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      // Accumulate our own rotation so we can pause cleanly when off-screen
      thetaRef.current = (thetaRef.current + OMEGA * dt) % (Math.PI * 2);
      const theta = thetaRef.current;

      const { width, height } = size;
      const dpr = window.devicePixelRatio || 1;
      if (canvas.width !== width * dpr || canvas.height !== height * dpr) {
        canvas.width = width * dpr;
        canvas.height = height * dpr;
        ctx.scale(dpr, dpr);
      }
      ctx.clearRect(0, 0, width, height);

      // Dark panel background
      ctx.fillStyle = "#1A1D24";
      ctx.fillRect(0, 0, width, height);

      // Panels: 44% left (phasors), 56% right (scope)
      const gap = 16;
      const leftW = width * 0.44 - gap / 2;
      const rightX = width * 0.44 + gap / 2;
      const rightW = width - rightX - 4;

      drawPhasorPanel(ctx, colors, 4, 4, leftW - 4, height - 8, theta, phi);
      drawScopePanel(
        ctx,
        colors,
        rightX,
        4,
        rightW,
        height - 8,
        theta,
        phi,
      );

      // Top-left title
      ctx.fillStyle = colors.fg1;
      ctx.font = "12px monospace";
      ctx.textAlign = "left";
      ctx.fillText("FIG.30a — rotating phasors & oscilloscope", 12, 18);

      // Readouts in the top-right: φ and cos(φ)
      const pf = Math.cos(phi);
      const phiDeg = (phi * 180) / Math.PI;
      ctx.fillStyle = colors.fg2;
      ctx.font = "10px monospace";
      ctx.textAlign = "right";
      ctx.fillText(
        `φ = ${phiDeg >= 0 ? "+" : ""}${phiDeg.toFixed(0)}°`,
        width - 12,
        18,
      );
      ctx.fillText(
        `cos(φ) = ${pf.toFixed(3)} = power factor`,
        width - 12,
        32,
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
      <div className="mt-3 grid grid-cols-1 gap-2 px-2">
        <PhaseSlider
          value={phi}
          onChange={setPhi}
        />
      </div>
      <p className="mt-2 px-2 text-xs font-mono text-[var(--color-fg-3)]">
        drag φ: negative = capacitive (I leads V), zero = resistive (in
        phase), positive = inductive (I lags V)
      </p>
    </div>
  );
}

/* ────────────────────────────── LEFT: PHASORS ─────────────────────────── */

function drawPhasorPanel(
  ctx: CanvasRenderingContext2D,
  colors: { fg1: string; fg2: string; fg3: string },
  x: number,
  y: number,
  w: number,
  h: number,
  theta: number,
  phi: number,
) {
  // Panel frame
  ctx.strokeStyle = colors.fg3;
  ctx.lineWidth = 1;
  ctx.strokeRect(x + 0.5, y + 0.5, w - 1, h - 1);

  // Label
  ctx.fillStyle = colors.fg2;
  ctx.font = "10px monospace";
  ctx.textAlign = "left";
  ctx.fillText("phasor plane   V̂, Î rotate at ω", x + 8, y + 14);

  // Center + radius
  const cx = x + w / 2;
  const cy = y + h / 2 + 6;
  const R = Math.min(w, h) * 0.38;

  // Reference circle
  ctx.strokeStyle = "rgba(86, 104, 127, 0.45)";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.arc(cx, cy, R, 0, Math.PI * 2);
  ctx.stroke();

  // Axes
  ctx.strokeStyle = "rgba(86, 104, 127, 0.45)";
  ctx.beginPath();
  ctx.moveTo(cx - R - 10, cy);
  ctx.lineTo(cx + R + 10, cy);
  ctx.moveTo(cx, cy - R - 10);
  ctx.lineTo(cx, cy + R + 10);
  ctx.stroke();

  // Real-axis label (Re) and imaginary-axis label (jIm)
  ctx.fillStyle = colors.fg3;
  ctx.font = "9px monospace";
  ctx.textAlign = "left";
  ctx.fillText("Re", cx + R + 4, cy - 3);
  ctx.textAlign = "center";
  ctx.fillText("j·Im", cx, cy - R - 14);

  // Phasor angles. Canvas y grows downward, so we flip sin.
  const vAngle = theta;
  const iAngle = theta - phi;

  // Draw a faint wedge showing the angle φ between V̂ and Î
  drawPhiWedge(ctx, cx, cy, R * 0.28, vAngle, iAngle);

  // Voltage phasor V̂ (magenta)
  drawPhasorArrow(
    ctx,
    cx,
    cy,
    R * V_AMP,
    vAngle,
    "rgba(255, 106, 222, 0.95)",
    "V̂",
  );

  // Current phasor Î (amber), lagging by φ
  drawPhasorArrow(
    ctx,
    cx,
    cy,
    R * I_AMP,
    iAngle,
    "rgba(255, 214, 107, 0.95)",
    "Î",
  );

  // Projection markers (feet on Re axis) — the live v(t) and i(t) values
  const vx = cx + Math.cos(vAngle) * R * V_AMP;
  const ix = cx + Math.cos(iAngle) * R * I_AMP;
  ctx.strokeStyle = "rgba(255, 106, 222, 0.35)";
  ctx.setLineDash([3, 3]);
  ctx.beginPath();
  ctx.moveTo(vx, cy);
  ctx.lineTo(vx, cy - Math.sin(vAngle) * R * V_AMP);
  ctx.stroke();
  ctx.strokeStyle = "rgba(255, 214, 107, 0.35)";
  ctx.beginPath();
  ctx.moveTo(ix, cy);
  ctx.lineTo(ix, cy - Math.sin(iAngle) * R * I_AMP);
  ctx.stroke();
  ctx.setLineDash([]);

  // Tick dots at the projections — these are what the oscilloscope plots
  ctx.fillStyle = "rgba(255, 106, 222, 0.9)";
  ctx.beginPath();
  ctx.arc(vx, cy, 2.6, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "rgba(255, 214, 107, 0.9)";
  ctx.beginPath();
  ctx.arc(ix, cy, 2.6, 0, Math.PI * 2);
  ctx.fill();

  // Bottom caption
  ctx.fillStyle = colors.fg3;
  ctx.font = "9px monospace";
  ctx.textAlign = "center";
  ctx.fillText(
    "the angle between V̂ and Î is the phase φ",
    cx,
    y + h - 8,
  );
}

function drawPhasorArrow(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  r: number,
  angle: number,
  color: string,
  label: string,
) {
  const tx = cx + Math.cos(angle) * r;
  const ty = cy - Math.sin(angle) * r; // flip y

  // Glow behind the shaft for emphasis
  ctx.shadowColor = color;
  ctx.shadowBlur = 6;
  ctx.strokeStyle = color;
  ctx.lineWidth = 2.2;
  ctx.beginPath();
  ctx.moveTo(cx, cy);
  ctx.lineTo(tx, ty);
  ctx.stroke();
  ctx.shadowBlur = 0;

  // Arrow head
  const head = 9;
  const ax = Math.cos(angle);
  const ay = -Math.sin(angle);
  const px = -ay;
  const py = ax;
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(tx, ty);
  ctx.lineTo(tx - head * ax + (head * 0.5) * px, ty - head * ay + (head * 0.5) * py);
  ctx.lineTo(tx - head * ax - (head * 0.5) * px, ty - head * ay - (head * 0.5) * py);
  ctx.closePath();
  ctx.fill();

  // Label at the tip, nudged outward
  ctx.font = "bold 11px monospace";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillStyle = color;
  ctx.fillText(label, tx + ax * 12, ty + ay * 12);
  ctx.textBaseline = "alphabetic";
}

function drawPhiWedge(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  r: number,
  vAngle: number,
  iAngle: number,
) {
  // We want a wedge from V̂ back to Î (so lag φ is visually shaded)
  // In canvas, y is flipped, so arcs use negative angles.
  const a1 = -vAngle;
  const a2 = -iAngle;
  // If φ > 0, I lags V → sweep clockwise from V to I (ccw in canvas-y-flip)
  ctx.fillStyle = "rgba(200, 160, 255, 0.18)";
  ctx.beginPath();
  ctx.moveTo(cx, cy);
  ctx.arc(cx, cy, r, a1, a2, iAngle < vAngle);
  ctx.closePath();
  ctx.fill();
}

/* ────────────────────────────── RIGHT: SCOPE ──────────────────────────── */

function drawScopePanel(
  ctx: CanvasRenderingContext2D,
  colors: { fg1: string; fg2: string; fg3: string },
  x: number,
  y: number,
  w: number,
  h: number,
  theta: number,
  phi: number,
) {
  // Panel frame
  ctx.strokeStyle = colors.fg3;
  ctx.lineWidth = 1;
  ctx.strokeRect(x + 0.5, y + 0.5, w - 1, h - 1);

  ctx.fillStyle = colors.fg2;
  ctx.font = "10px monospace";
  ctx.textAlign = "left";
  ctx.fillText(
    "oscilloscope   v(t) = V·cos(ωt),  i(t) = I·cos(ωt − φ)",
    x + 8,
    y + 14,
  );

  const padL = 28;
  const padR = 12;
  const padT = 26;
  const padB = 22;
  const plotX = x + padL;
  const plotY = y + padT;
  const plotW = w - padL - padR;
  const plotH = h - padT - padB;
  const midY = plotY + plotH / 2;

  // Background grid
  ctx.strokeStyle = "rgba(86, 104, 127, 0.25)";
  ctx.lineWidth = 0.8;
  for (let i = 1; i < 5; i++) {
    const gy = plotY + (i / 5) * plotH;
    ctx.beginPath();
    ctx.moveTo(plotX, gy);
    ctx.lineTo(plotX + plotW, gy);
    ctx.stroke();
  }
  for (let i = 1; i < 8; i++) {
    const gx = plotX + (i / 8) * plotW;
    ctx.beginPath();
    ctx.moveTo(gx, plotY);
    ctx.lineTo(gx, plotY + plotH);
    ctx.stroke();
  }

  // Axes
  ctx.strokeStyle = "rgba(86, 104, 127, 0.7)";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(plotX, plotY);
  ctx.lineTo(plotX, plotY + plotH);
  ctx.lineTo(plotX + plotW, plotY + plotH);
  ctx.stroke();
  // Zero line
  ctx.strokeStyle = "rgba(160, 176, 200, 0.55)";
  ctx.beginPath();
  ctx.moveTo(plotX, midY);
  ctx.lineTo(plotX + plotW, midY);
  ctx.stroke();

  // Axis ticks
  ctx.fillStyle = colors.fg3;
  ctx.font = "9px monospace";
  ctx.textAlign = "right";
  ctx.fillText("+1", plotX - 3, plotY + 4);
  ctx.fillText("0", plotX - 3, midY + 3);
  ctx.fillText("−1", plotX - 3, plotY + plotH + 2);
  ctx.textAlign = "center";
  ctx.fillText("ωt", plotX + plotW / 2, plotY + plotH + 14);

  // We visualise one full cycle of v(t) and i(t), with the "current time"
  // (ωt = θ) marked by a moving cursor. The x-axis runs 0 … 2π.
  const samples = 240;
  const period = Math.PI * 2;

  // Magenta — v(t)
  ctx.strokeStyle = "rgba(255, 106, 222, 0.9)";
  ctx.lineWidth = 1.8;
  ctx.shadowColor = "rgba(255, 106, 222, 0.55)";
  ctx.shadowBlur = 4;
  ctx.beginPath();
  for (let i = 0; i <= samples; i++) {
    const tau = (i / samples) * period;
    const v = Math.cos(tau);
    const px = plotX + (tau / period) * plotW;
    const py = midY - (v * plotH) / 2.2;
    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.stroke();

  // Amber — i(t), shifted by −φ
  ctx.strokeStyle = "rgba(255, 214, 107, 0.9)";
  ctx.shadowColor = "rgba(255, 214, 107, 0.55)";
  ctx.beginPath();
  for (let i = 0; i <= samples; i++) {
    const tau = (i / samples) * period;
    const iVal = I_AMP * Math.cos(tau - phi);
    const px = plotX + (tau / period) * plotW;
    const py = midY - (iVal * plotH) / 2.2;
    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.stroke();
  ctx.shadowBlur = 0;

  // Cursor at the current ωt — matches the phasor angle on the left
  const cursorX = plotX + ((theta % period) / period) * plotW;
  ctx.strokeStyle = "rgba(200, 160, 255, 0.75)";
  ctx.setLineDash([4, 3]);
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(cursorX, plotY);
  ctx.lineTo(cursorX, plotY + plotH);
  ctx.stroke();
  ctx.setLineDash([]);

  // Live dots on the traces at the cursor
  const vNow = Math.cos(theta);
  const iNow = I_AMP * Math.cos(theta - phi);
  ctx.fillStyle = "rgba(255, 106, 222, 1)";
  ctx.beginPath();
  ctx.arc(cursorX, midY - (vNow * plotH) / 2.2, 3, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "rgba(255, 214, 107, 1)";
  ctx.beginPath();
  ctx.arc(cursorX, midY - (iNow * plotH) / 2.2, 3, 0, Math.PI * 2);
  ctx.fill();

  // Legend
  ctx.textAlign = "left";
  ctx.font = "9px monospace";
  ctx.fillStyle = "rgba(255, 106, 222, 0.95)";
  ctx.fillText("─ v(t)", plotX + plotW - 72, plotY + 10);
  ctx.fillStyle = "rgba(255, 214, 107, 0.95)";
  ctx.fillText("─ i(t)", plotX + plotW - 32, plotY + 10);
}

/* ────────────────────────────── SLIDER ────────────────────────────────── */

function PhaseSlider({
  value,
  onChange,
}: {
  value: number;
  onChange: (v: number) => void;
}) {
  const min = -Math.PI / 2;
  const max = Math.PI / 2;
  const deg = (value * 180) / Math.PI;
  const pf = Math.cos(value);

  return (
    <label className="flex items-center gap-2 text-xs font-mono text-[var(--color-fg-2)]">
      <span className="w-10 text-[var(--color-fg-1)]">φ</span>
      <input
        type="range"
        min={min}
        max={max}
        step={0.02}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className="flex-1"
        style={{ accentColor: "#C8A0FF" }}
      />
      <span className="w-32 text-right text-[var(--color-fg-1)]">
        {deg >= 0 ? "+" : ""}
        {deg.toFixed(0)}°  ·  cos φ = {pf.toFixed(2)}
      </span>
    </label>
  );
}
