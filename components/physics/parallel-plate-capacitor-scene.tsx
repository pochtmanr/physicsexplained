"use client";

import { useEffect, useRef, useState } from "react";
import { useAnimationFrame } from "@/lib/animation/use-animation-frame";
import { useThemeColors } from "@/lib/hooks/use-theme-colors";
import {
  parallelPlateCapacitance,
  energyStored,
} from "@/lib/physics/capacitance";

const RATIO = 0.6;
const MAX_HEIGHT = 360;

/**
 * A horizontal pair of capacitor plates with sliders for area, separation,
 * dielectric constant κ, and voltage. Live readout of capacitance C and
 * stored energy U = ½CV². Charges are drawn at the plate edges (+ on top,
 * − on bottom) and uniform field arrows fill the gap.
 */
export function ParallelPlateCapacitorScene() {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const colors = useThemeColors();
  const [area, setArea] = useState(0.01); // m² — 100 cm² square plates
  const [gap, setGap] = useState(0.001); // m — 1 mm
  const [kappa, setKappa] = useState(1); // dimensionless
  const [voltage, setVoltage] = useState(9); // volts
  const [size, setSize] = useState({ width: 640, height: 360 });

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

      const C = parallelPlateCapacitance(area, gap, kappa);
      const U = energyStored(C, voltage);

      // Layout — leave room for HUD on top
      const padX = 60;
      const topPad = 60;
      const bottomPad = 30;
      const plotW = width - padX * 2;
      const plotH = height - topPad - bottomPad;

      // Plate visual width grows with sqrt(area), separation grows with d.
      // We keep the visual gap visible even at small d by clamping.
      const visualPlateW = Math.min(plotW, 80 + 600 * Math.sqrt(area));
      const visualGap = Math.max(20, Math.min(plotH * 0.7, gap * 30000));

      const cx = width / 2;
      const cyMid = topPad + plotH / 2;
      const yTop = cyMid - visualGap / 2;
      const yBot = cyMid + visualGap / 2;
      const plateLeft = cx - visualPlateW / 2;
      const plateRight = cx + visualPlateW / 2;

      // Dielectric tint between plates (more saturated as κ rises)
      if (kappa > 1) {
        const tintAlpha = Math.min(0.18, 0.05 * (kappa - 1));
        ctx.fillStyle = `rgba(255, 106, 222, ${tintAlpha})`;
        ctx.fillRect(plateLeft, yTop, visualPlateW, visualGap);
      }

      // Field arrows (uniform, downward when V > 0)
      const fieldDir = voltage >= 0 ? 1 : -1;
      const arrowCount = Math.max(3, Math.floor(visualPlateW / 40));
      const arrowGap = visualPlateW / (arrowCount + 1);
      const arrowAlpha = Math.min(0.85, 0.25 + Math.abs(voltage) / 30);
      ctx.strokeStyle = `rgba(111, 184, 198, ${arrowAlpha.toFixed(3)})`;
      ctx.fillStyle = `rgba(111, 184, 198, ${arrowAlpha.toFixed(3)})`;
      ctx.lineWidth = 1.2;
      for (let i = 1; i <= arrowCount; i++) {
        const ax = plateLeft + i * arrowGap;
        const yA = yTop + 6;
        const yB = yBot - 6;
        const yStart = fieldDir > 0 ? yA : yB;
        const yEnd = fieldDir > 0 ? yB : yA;
        ctx.beginPath();
        ctx.moveTo(ax, yStart);
        ctx.lineTo(ax, yEnd);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(ax, yEnd);
        ctx.lineTo(ax - 4, yEnd - fieldDir * 6);
        ctx.lineTo(ax + 4, yEnd - fieldDir * 6);
        ctx.closePath();
        ctx.fill();
      }

      // Top plate (positive when V > 0) — magenta
      drawPlate(ctx, plateLeft, plateRight, yTop, voltage >= 0 ? "+" : "−");
      // Bottom plate — cyan
      drawPlate(ctx, plateLeft, plateRight, yBot, voltage >= 0 ? "−" : "+");

      // Gap caliper on the right
      ctx.strokeStyle = colors.fg3;
      ctx.lineWidth = 1;
      ctx.setLineDash([4, 4]);
      const calX = plateRight + 18;
      ctx.beginPath();
      ctx.moveTo(calX, yTop);
      ctx.lineTo(calX, yBot);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.beginPath();
      ctx.moveTo(calX - 4, yTop);
      ctx.lineTo(calX + 4, yTop);
      ctx.moveTo(calX - 4, yBot);
      ctx.lineTo(calX + 4, yBot);
      ctx.stroke();
      ctx.fillStyle = colors.fg2;
      ctx.font = "11px monospace";
      ctx.textAlign = "left";
      ctx.fillText(`d = ${formatLength(gap)}`, calX + 8, cyMid + 4);

      // HUD — top-left for inputs, top-right for derived
      ctx.fillStyle = colors.fg1;
      ctx.font = "12px monospace";
      ctx.textAlign = "left";
      ctx.fillText(`A = ${formatArea(area)}`, padX - 40, 22);
      ctx.fillText(`κ = ${kappa.toFixed(2)}`, padX - 40, 40);

      ctx.textAlign = "right";
      ctx.fillText(`C = ${formatCapacitance(C)}`, width - padX + 40, 22);
      ctx.fillText(
        `U = ${formatEnergy(U)}  @  V = ${voltage.toFixed(1)} V`,
        width - padX + 40,
        40,
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
      <div className="mt-2 flex flex-col gap-2 px-2 font-mono text-xs">
        <SliderRow
          label="A"
          value={area}
          min={0.001}
          max={0.05}
          step={0.001}
          formatter={formatArea}
          onChange={setArea}
        />
        <SliderRow
          label="d"
          value={gap}
          min={0.0002}
          max={0.005}
          step={0.0001}
          formatter={formatLength}
          onChange={setGap}
        />
        <SliderRow
          label="κ"
          value={kappa}
          min={1}
          max={10}
          step={0.1}
          formatter={(v) => v.toFixed(2)}
          onChange={setKappa}
        />
        <SliderRow
          label="V"
          value={voltage}
          min={-30}
          max={30}
          step={0.5}
          formatter={(v) => `${v.toFixed(1)} V`}
          onChange={setVoltage}
        />
      </div>
    </div>
  );
}

function drawPlate(
  ctx: CanvasRenderingContext2D,
  xL: number,
  xR: number,
  y: number,
  sign: "+" | "−",
) {
  const isPos = sign === "+";
  const fill = isPos ? "#FF6ADE" : "#6FB8C6";
  ctx.shadowColor = isPos
    ? "rgba(255, 106, 222, 0.5)"
    : "rgba(111, 184, 198, 0.5)";
  ctx.shadowBlur = 12;
  ctx.fillStyle = fill;
  ctx.fillRect(xL, y - 3, xR - xL, 6);
  ctx.shadowBlur = 0;

  // Charge symbols evenly spaced along the plate
  const w = xR - xL;
  const n = Math.max(4, Math.floor(w / 30));
  const step = w / (n + 1);
  ctx.fillStyle = "#1A1D24";
  ctx.font = "bold 11px monospace";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  for (let i = 1; i <= n; i++) {
    ctx.fillText(sign, xL + i * step, y);
  }
  ctx.textBaseline = "alphabetic";
}

function formatArea(a: number): string {
  if (a >= 1) return `${a.toFixed(2)} m²`;
  if (a >= 1e-2) return `${(a * 1e4).toFixed(1)} cm²`;
  return `${(a * 1e6).toFixed(0)} mm²`;
}

function formatLength(d: number): string {
  if (d >= 1e-3) return `${(d * 1e3).toFixed(2)} mm`;
  return `${(d * 1e6).toFixed(0)} µm`;
}

function formatCapacitance(C: number): string {
  if (C >= 1) return `${C.toFixed(3)} F`;
  if (C >= 1e-3) return `${(C * 1e3).toFixed(3)} mF`;
  if (C >= 1e-6) return `${(C * 1e6).toFixed(3)} µF`;
  if (C >= 1e-9) return `${(C * 1e9).toFixed(3)} nF`;
  return `${(C * 1e12).toFixed(3)} pF`;
}

function formatEnergy(U: number): string {
  if (U === 0) return "0 J";
  if (U >= 1) return `${U.toFixed(3)} J`;
  if (U >= 1e-3) return `${(U * 1e3).toFixed(3)} mJ`;
  if (U >= 1e-6) return `${(U * 1e6).toFixed(3)} µJ`;
  if (U >= 1e-9) return `${(U * 1e9).toFixed(3)} nJ`;
  return `${U.toExponential(2)} J`;
}

function SliderRow({
  label,
  value,
  min,
  max,
  step,
  formatter,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  formatter: (v: number) => string;
  onChange: (v: number) => void;
}) {
  return (
    <div className="flex items-center gap-3">
      <label className="w-8 text-[var(--color-fg-3)]">{label}</label>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className="flex-1 accent-[#6FB8C6]"
      />
      <span className="w-24 text-right text-[var(--color-fg-1)]">
        {formatter(value)}
      </span>
    </div>
  );
}
