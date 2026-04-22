"use client";

import { useEffect, useRef, useState } from "react";
import { useAnimationFrame } from "@/lib/animation/use-animation-frame";
import { useThemeColors } from "@/lib/hooks/use-theme-colors";

const RATIO = 0.62;
const MAX_HEIGHT = 420;

/**
 * A single atom — one nucleus, two counter-circulating electrons on concentric
 * orbits. With B = 0, both electrons orbit at the same angular speed so their
 * induced magnetic moments cancel. Turn B up (slider) and Lenz's law speeds
 * one orbit up and slows the other down — the faster ring wins, and the net
 * orbital moment points *against* B. That asymmetry is diamagnetism.
 *
 *   ccw orbit: ω → ω + ΔωL   (Lenz: its induced current opposes the flux
 *   cw  orbit: ω → ω − ΔωL    increase; its own B points "down" if B is up.)
 *
 * We exaggerate the Larmor shift ΔωL = eB/(2mₑ) so it's visible at slider
 * values ~a few tesla in scene units. HUD shows applied |B|, the two speeds,
 * and the net induced μ.
 */
export function OrbitalResponseScene() {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const colors = useThemeColors();
  const [size, setSize] = useState({ width: 640, height: 400 });
  const [bMag, setBMag] = useState(1.8); // "tesla" in scene units
  const phaseRef = useRef({ ccw: 0, cw: Math.PI }); // electron angular positions

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

      const { width, height } = size;
      const dpr = window.devicePixelRatio || 1;
      if (canvas.width !== width * dpr || canvas.height !== height * dpr) {
        canvas.width = width * dpr;
        canvas.height = height * dpr;
        ctx.scale(dpr, dpr);
      }

      // Advance phases. Base angular speeds; the Larmor shift is ±bMag·K.
      const BASE = 2.2; // rad/s
      const LARMOR_K = 0.75; // scene-units Larmor gain per "tesla"
      const dw = LARMOR_K * bMag;
      phaseRef.current.ccw += (BASE + dw) * dt;
      phaseRef.current.cw -= (BASE - dw) * dt; // cw goes backward

      ctx.clearRect(0, 0, width, height);

      const cx = width / 2;
      const cy = height / 2;
      const rInner = Math.min(width, height) * 0.14;
      const rOuter = Math.min(width, height) * 0.24;

      // B-field hint: amber up-arrow on the left, whose length scales with |B|.
      drawBArrow(ctx, 38, cy, bMag, colors);

      // Two orbits (dashed).
      ctx.setLineDash([4, 4]);
      ctx.strokeStyle = colors.fg3;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(cx, cy, rInner, 0, Math.PI * 2);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(cx, cy, rOuter, 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);

      // Nucleus (magenta +).
      ctx.fillStyle = "#FF6ADE";
      ctx.shadowColor = "rgba(255, 106, 222, 0.8)";
      ctx.shadowBlur = 12;
      ctx.beginPath();
      ctx.arc(cx, cy, 6, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;
      ctx.fillStyle = "#0A0E17";
      ctx.font = "bold 10px monospace";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("+", cx, cy + 0.5);

      // Electron (ccw) on inner orbit.
      const ccwAngle = phaseRef.current.ccw;
      const ex1 = cx + rInner * Math.cos(ccwAngle);
      const ey1 = cy + rInner * Math.sin(ccwAngle);
      drawElectron(ctx, ex1, ey1, "#6FB8C6");
      // Tangent arrow head showing direction (ccw: velocity ⊥ radius, rotated +π/2).
      drawTangentHead(ctx, cx, cy, rInner, ccwAngle, +1, "#6FB8C6");

      // Electron (cw) on outer orbit.
      const cwAngle = phaseRef.current.cw;
      const ex2 = cx + rOuter * Math.cos(cwAngle);
      const ey2 = cy + rOuter * Math.sin(cwAngle);
      drawElectron(ctx, ex2, ey2, "#6FB8C6");
      drawTangentHead(ctx, cx, cy, rOuter, cwAngle, -1, "#6FB8C6");

      // Induced-moment indicator (green-cyan "μ_ind" arrow pointing down if
      // applied B is up — Lenz-style opposition). Magnitude scales with bMag.
      drawInducedMoment(ctx, cx, cy + rOuter + 28, bMag);

      // Speeds HUD.
      ctx.font = "12px monospace";
      ctx.textAlign = "left";
      ctx.textBaseline = "alphabetic";
      ctx.fillStyle = colors.fg1;
      ctx.fillText("single atom · two counter-circulating electrons", 12, 18);
      ctx.fillStyle = "#FFD66B";
      ctx.fillText(`|B| applied = ${bMag.toFixed(2)} T  (↑ up)`, 12, 36);
      ctx.fillStyle = colors.fg1;
      ctx.fillText(
        `ω_ccw = ω₀ + ΔωL = ${(BASE + dw).toFixed(2)} rad/s`,
        12,
        54,
      );
      ctx.fillText(
        `ω_cw  = ω₀ − ΔωL = ${(BASE - dw).toFixed(2)} rad/s`,
        12,
        72,
      );
      ctx.fillStyle = "rgba(120, 255, 170, 0.9)";
      ctx.fillText(
        `μ_ind ∝ −ΔωL  ⟹  opposes B (χ_dia < 0)`,
        12,
        90,
      );

      ctx.textAlign = "right";
      ctx.fillStyle = colors.fg3;
      ctx.fillText("Lenz's law, applied to electron orbits", width - 12, 18);
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
          label="|B|"
          value={bMag}
          min={0}
          max={3}
          step={0.05}
          onChange={setBMag}
          unit="T"
          accent="#FFD66B"
        />
      </div>
      <p className="mt-2 px-2 text-xs font-mono text-[var(--color-fg-3)]">
        diamagnetism is universal — every material has it; in most, paramagnetism or ferromagnetism dominates
      </p>
    </div>
  );
}

function drawElectron(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  color: string,
) {
  ctx.fillStyle = color;
  ctx.shadowColor = color;
  ctx.shadowBlur = 10;
  ctx.beginPath();
  ctx.arc(x, y, 5, 0, Math.PI * 2);
  ctx.fill();
  ctx.shadowBlur = 0;
  ctx.fillStyle = "#0A0E17";
  ctx.font = "bold 9px monospace";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("−", x, y + 0.5);
}

function drawTangentHead(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  r: number,
  angle: number,
  direction: 1 | -1,
  color: string,
) {
  const tangentAngle = angle + (direction * Math.PI) / 2;
  const x = cx + r * Math.cos(angle);
  const y = cy + r * Math.sin(angle);
  const hx = x + 9 * Math.cos(tangentAngle);
  const hy = y + 9 * Math.sin(tangentAngle);
  ctx.strokeStyle = color;
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(hx, hy);
  ctx.stroke();
  // Arrow head.
  const a1 = tangentAngle + Math.PI - 0.4;
  const a2 = tangentAngle + Math.PI + 0.4;
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(hx, hy);
  ctx.lineTo(hx + 5 * Math.cos(a1), hy + 5 * Math.sin(a1));
  ctx.lineTo(hx + 5 * Math.cos(a2), hy + 5 * Math.sin(a2));
  ctx.closePath();
  ctx.fill();
}

function drawBArrow(
  ctx: CanvasRenderingContext2D,
  x: number,
  cy: number,
  bMag: number,
  colors: { fg3: string },
) {
  const maxLen = 70;
  const len = Math.max(4, bMag * (maxLen / 3));
  ctx.strokeStyle = "#FFD66B";
  ctx.fillStyle = "#FFD66B";
  ctx.lineWidth = 2;
  ctx.shadowColor = "rgba(255, 214, 107, 0.5)";
  ctx.shadowBlur = 8;
  ctx.beginPath();
  ctx.moveTo(x, cy + len / 2);
  ctx.lineTo(x, cy - len / 2);
  ctx.stroke();
  // Head at top.
  ctx.beginPath();
  ctx.moveTo(x, cy - len / 2);
  ctx.lineTo(x - 5, cy - len / 2 + 8);
  ctx.lineTo(x + 5, cy - len / 2 + 8);
  ctx.closePath();
  ctx.fill();
  ctx.shadowBlur = 0;
  ctx.fillStyle = colors.fg3;
  ctx.font = "10px monospace";
  ctx.textAlign = "center";
  ctx.fillText("B", x, cy - len / 2 - 6);
}

function drawInducedMoment(
  ctx: CanvasRenderingContext2D,
  cx: number,
  yTop: number,
  bMag: number,
) {
  const maxLen = 48;
  const len = Math.max(2, bMag * (maxLen / 3));
  ctx.strokeStyle = "rgba(120, 255, 170, 0.9)";
  ctx.fillStyle = "rgba(120, 255, 170, 0.9)";
  ctx.lineWidth = 2;
  ctx.shadowColor = "rgba(120, 255, 170, 0.5)";
  ctx.shadowBlur = 8;
  ctx.beginPath();
  ctx.moveTo(cx, yTop);
  ctx.lineTo(cx, yTop + len);
  ctx.stroke();
  // Head at the bottom (points down — opposite to B).
  ctx.beginPath();
  ctx.moveTo(cx, yTop + len);
  ctx.lineTo(cx - 5, yTop + len - 8);
  ctx.lineTo(cx + 5, yTop + len - 8);
  ctx.closePath();
  ctx.fill();
  ctx.shadowBlur = 0;
  ctx.font = "10px monospace";
  ctx.textAlign = "center";
  ctx.fillText("μ_ind", cx, yTop + len + 12);
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
