"use client";

import { useEffect, useRef, useState } from "react";
import { useAnimationFrame } from "@/lib/animation/use-animation-frame";
import { useThemeColors } from "@/lib/hooks/use-theme-colors";
import { coulombForce } from "@/lib/physics/coulomb";

const RATIO = 0.55;
const MAX_HEIGHT = 360;

/**
 * Two charges on a horizontal axis. Sliders for q1, q2, separation r.
 * Draws each charge as a colored disc with a force arrow on its outside,
 * plus a numeric magnitude readout in newtons. Like-sign charges repel
 * (arrows point outward); opposite signs attract (arrows point inward).
 */
export function TwoChargeForceScene() {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const colors = useThemeColors();
  const [q1, setQ1] = useState(1); // microcoulombs
  const [q2, setQ2] = useState(1); // microcoulombs
  const [r, setR] = useState(0.5); // meters (10 cm to 1 m range)
  const [size, setSize] = useState({ width: 640, height: 340 });

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

      // Convert microcoulombs → coulombs for the physics call
      const q1C = q1 * 1e-6;
      const q2C = q2 * 1e-6;

      // Force on charge 2 due to charge 1
      const f2 = coulombForce(
        { q: q1C, x: 0, y: 0 },
        { q: q2C, x: r, y: 0 },
      );
      const fMag = Math.abs(f2.x); // forces are along x by construction
      const sign = Math.sign(q1 * q2); // +1 repulsive, -1 attractive, 0 none

      // Layout — charges centered on screen on the axis
      const padX = 40;
      const axisY = height / 2 + 10;
      const plotLeft = padX;
      const plotRight = width - padX;
      const plotW = plotRight - plotLeft;

      // Map separation r ∈ [0.1, 1.0] m to a visual fraction of the plot
      const visualSep = (r / 1.0) * plotW * 0.6;
      const cx1 = width / 2 - visualSep / 2;
      const cx2 = width / 2 + visualSep / 2;

      // Axis line
      ctx.strokeStyle = colors.fg3;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(plotLeft, axisY);
      ctx.lineTo(plotRight, axisY);
      ctx.stroke();

      // Separation indicator (dashed segment with caps)
      ctx.strokeStyle = colors.fg3;
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.moveTo(cx1, axisY + 28);
      ctx.lineTo(cx2, axisY + 28);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.beginPath();
      ctx.moveTo(cx1, axisY + 22);
      ctx.lineTo(cx1, axisY + 34);
      ctx.moveTo(cx2, axisY + 22);
      ctx.lineTo(cx2, axisY + 34);
      ctx.stroke();
      ctx.fillStyle = colors.fg2;
      ctx.font = "11px monospace";
      ctx.textAlign = "center";
      ctx.fillText(`r = ${r.toFixed(2)} m`, (cx1 + cx2) / 2, axisY + 50);

      // Draw the two charges
      drawCharge(ctx, cx1, axisY, q1);
      drawCharge(ctx, cx2, axisY, q2);

      // Force arrows. Convention: draw on the outside (repulsive) or inside (attractive)
      // arrowLen scales log-ish with magnitude, capped
      const arrowLen = Math.min(110, Math.max(0, Math.log10(1 + fMag) * 30));

      if (sign !== 0 && arrowLen > 0) {
        // Force on charge 1: opposite to force on charge 2 by Newton's 3rd law
        // For repulsive (sign>0): arrows point outward (away from each other)
        // For attractive (sign<0): arrows point inward (toward each other)
        const dir1 = sign > 0 ? -1 : 1; // direction of arrow on charge 1
        const dir2 = sign > 0 ? 1 : -1;

        drawForceArrow(ctx, cx1, axisY - 36, arrowLen, dir1);
        drawForceArrow(ctx, cx2, axisY - 36, arrowLen, dir2);
      }

      // HUD readouts (top corners)
      ctx.fillStyle = colors.fg1;
      ctx.font = "12px monospace";
      ctx.textAlign = "left";
      ctx.fillText(`q₁ = ${q1.toFixed(2)} µC`, plotLeft, 20);
      ctx.fillText(`q₂ = ${q2.toFixed(2)} µC`, plotLeft, 38);
      ctx.textAlign = "right";
      ctx.fillText(
        `|F| = ${formatForce(fMag)}`,
        plotRight,
        20,
      );
      ctx.fillText(
        sign > 0
          ? "repulsive"
          : sign < 0
            ? "attractive"
            : "no force",
        plotRight,
        38,
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
      <div className="mt-2 flex flex-col gap-2 px-2">
        <SliderRow
          label="q₁"
          value={q1}
          min={-3}
          max={3}
          step={0.1}
          unit="µC"
          onChange={setQ1}
        />
        <SliderRow
          label="q₂"
          value={q2}
          min={-3}
          max={3}
          step={0.1}
          unit="µC"
          onChange={setQ2}
        />
        <SliderRow
          label="r"
          value={r}
          min={0.1}
          max={1}
          step={0.01}
          unit="m"
          onChange={setR}
        />
      </div>
    </div>
  );
}

function drawCharge(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  q: number,
) {
  // radius indicates magnitude (a little)
  const radius = 12 + Math.min(10, Math.abs(q) * 3);
  const isPos = q > 0;
  const isNeg = q < 0;
  const fill = isPos
    ? "#FF6ADE" // magenta for +
    : isNeg
      ? "#6FB8C6" // cyan for -
      : "#56687F"; // muted for 0

  ctx.shadowColor = isPos
    ? "rgba(255, 106, 222, 0.55)"
    : isNeg
      ? "rgba(111, 184, 198, 0.55)"
      : "transparent";
  ctx.shadowBlur = 14;
  ctx.fillStyle = fill;
  ctx.beginPath();
  ctx.arc(cx, cy, radius, 0, Math.PI * 2);
  ctx.fill();
  ctx.shadowBlur = 0;

  // Sign symbol in white
  ctx.fillStyle = "#1A1D24";
  ctx.font = "bold 14px monospace";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(isPos ? "+" : isNeg ? "−" : "0", cx, cy + 1);
  ctx.textBaseline = "alphabetic";
}

function drawForceArrow(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  length: number,
  dir: number,
) {
  const x0 = cx;
  const x1 = cx + dir * length;
  ctx.strokeStyle = "#E6EDF7";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(x0, cy);
  ctx.lineTo(x1, cy);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(x1, cy);
  ctx.lineTo(x1 - dir * 6, cy - 4);
  ctx.lineTo(x1 - dir * 6, cy + 4);
  ctx.closePath();
  ctx.fillStyle = "#E6EDF7";
  ctx.fill();
}

function formatForce(n: number): string {
  if (n === 0) return "0 N";
  const abs = Math.abs(n);
  if (abs >= 1) return `${n.toFixed(2)} N`;
  if (abs >= 1e-3) return `${(n * 1e3).toFixed(2)} mN`;
  if (abs >= 1e-6) return `${(n * 1e6).toFixed(2)} µN`;
  return `${n.toExponential(2)} N`;
}

function SliderRow({
  label,
  value,
  min,
  max,
  step,
  unit,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  unit: string;
  onChange: (v: number) => void;
}) {
  return (
    <div className="flex items-center gap-3">
      <label className="w-10 text-sm text-[var(--color-fg-3)]">{label}</label>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className="flex-1 accent-[#6FB8C6]"
      />
      <span className="w-20 text-right text-sm font-mono text-[var(--color-fg-1)]">
        {value.toFixed(2)} {unit}
      </span>
    </div>
  );
}
