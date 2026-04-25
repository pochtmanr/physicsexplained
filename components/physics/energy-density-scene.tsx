"use client";

import { useEffect, useRef, useState } from "react";
import { useAnimationFrame } from "@/lib/animation/use-animation-frame";
import { useThemeColors } from "@/lib/hooks/use-theme-colors";
import { energyDensity } from "@/lib/physics/capacitance";

const RATIO = 0.55;
const MAX_HEIGHT = 340;
const GAP_M = 1e-3; // 1 mm — fixed for this scene

/**
 * Field-as-storage-medium visualisation. Two horizontal capacitor plates with
 * a fixed 1 mm gap. Slider controls voltage. The field region between the
 * plates is shaded with intensity proportional to u = ½ε₀E². Two side bars
 * mirror each other: a voltage ramp on the left, an energy-density ramp on
 * the right — V scales linearly, u scales quadratically.
 */
export function EnergyDensityScene() {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const colors = useThemeColors();
  const [voltage, setVoltage] = useState(8); // volts
  const [size, setSize] = useState({ width: 640, height: 340 });
  const V_MAX = 20;

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

      // Real physics: E = V/d, u = ½ε₀E²
      const E = voltage / GAP_M; // V/m (signed)
      const Eabs = Math.abs(E);
      const u = energyDensity(Eabs); // J/m³ (always ≥ 0)
      const uMax = energyDensity(V_MAX / GAP_M);

      // Layout
      const padTop = 50;
      const padBottom = 50;
      const sideBarW = 60;
      const fieldLeft = sideBarW + 30;
      const fieldRight = width - sideBarW - 30;
      const fieldTop = padTop;
      const fieldBottom = height - padBottom;
      const fieldH = fieldBottom - fieldTop;
      const fieldW = fieldRight - fieldLeft;
      const cyMid = (fieldTop + fieldBottom) / 2;
      const visualGap = fieldH * 0.55;
      const yTop = cyMid - visualGap / 2;
      const yBot = cyMid + visualGap / 2;

      // ─────── Energy-density shading between plates ───────
      const intensity = uMax > 0 ? u / uMax : 0;
      // Cyan→magenta gradient: low energy = dim cyan, high = bright magenta
      // We do this with stripes of two layered fills for that "field is real" feel.
      const cyanA = Math.min(0.55, 0.1 + 0.6 * intensity);
      const magentaA = Math.min(0.5, intensity * 0.65);

      ctx.fillStyle = `rgba(111, 184, 198, ${cyanA.toFixed(3)})`;
      ctx.fillRect(fieldLeft, yTop, fieldW, visualGap);
      ctx.fillStyle = `rgba(255, 106, 222, ${magentaA.toFixed(3)})`;
      ctx.fillRect(fieldLeft, yTop, fieldW, visualGap);

      // Subtle horizontal banding to suggest "filled with stuff"
      ctx.strokeStyle = `rgba(230, 237, 247, ${(0.05 + 0.1 * intensity).toFixed(3)})`;
      ctx.lineWidth = 0.5;
      const bands = 8;
      for (let i = 1; i < bands; i++) {
        const y = yTop + (i / bands) * visualGap;
        ctx.beginPath();
        ctx.moveTo(fieldLeft, y);
        ctx.lineTo(fieldRight, y);
        ctx.stroke();
      }

      // Field arrows
      const fieldDir = voltage >= 0 ? 1 : -1;
      const arrowCount = Math.max(3, Math.floor(fieldW / 50));
      const ag = fieldW / (arrowCount + 1);
      const aAlpha = Math.min(0.85, 0.3 + intensity * 0.6);
      ctx.strokeStyle = `rgba(230, 237, 247, ${aAlpha.toFixed(3)})`;
      ctx.fillStyle = `rgba(230, 237, 247, ${aAlpha.toFixed(3)})`;
      ctx.lineWidth = 1.2;
      for (let i = 1; i <= arrowCount; i++) {
        const ax = fieldLeft + i * ag;
        const yA = yTop + 8;
        const yB = yBot - 8;
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

      // Plates
      drawPlate(ctx, fieldLeft, fieldRight, yTop, voltage >= 0 ? "+" : "−");
      drawPlate(ctx, fieldLeft, fieldRight, yBot, voltage >= 0 ? "−" : "+");

      // ─────── Side bars: voltage (left) vs energy density (right) ───────
      const barX1 = (sideBarW - 24) / 2 + 6;
      const barX2 = width - sideBarW + (sideBarW - 24) / 2 - 6;
      const barTop = padTop;
      const barBot = height - padBottom;
      const barH = barBot - barTop;
      const barW = 24;

      drawSideBar(ctx, {
        x: barX1,
        y: barTop,
        w: barW,
        h: barH,
        frac: Math.abs(voltage) / V_MAX,
        label: "V",
        sublabel: `${voltage.toFixed(1)} V`,
        color: "#FF6ADE",
        colors,
      });
      drawSideBar(ctx, {
        x: barX2,
        y: barTop,
        w: barW,
        h: barH,
        frac: intensity,
        label: "u",
        sublabel: formatDensity(u),
        color: "#6FB8C6",
        colors,
      });

      // HUD
      ctx.fillStyle = colors.fg1;
      ctx.font = "12px monospace";
      ctx.textAlign = "left";
      ctx.fillText(`E = V / d = ${formatField(Eabs)}`, fieldLeft, 22);
      ctx.textAlign = "right";
      ctx.fillText(
        `u = ½ ε₀ E² = ${formatDensity(u)}`,
        fieldRight,
        22,
      );

      // Footer caption: u doubles when V doubles? No — u quadruples.
      ctx.fillStyle = colors.fg2;
      ctx.font = "11px monospace";
      ctx.textAlign = "center";
      ctx.fillText(
        `V is linear · u goes as V²  (the field stores the energy)`,
        width / 2,
        height - 14,
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
      <div className="mt-2 flex items-center gap-3 px-2 font-mono text-xs">
        <label className="w-8 text-[var(--color-fg-3)]">V</label>
        <input
          type="range"
          min={-V_MAX}
          max={V_MAX}
          step={0.1}
          value={voltage}
          onChange={(e) => setVoltage(parseFloat(e.target.value))}
          className="flex-1 accent-[#FF6ADE]"
        />
        <span className="w-20 text-right text-[var(--color-fg-1)]">
          {voltage.toFixed(1)} V
        </span>
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
  ctx.fillStyle = isPos ? "#FF6ADE" : "#6FB8C6";
  ctx.fillRect(xL, y - 3, xR - xL, 6);
  const w = xR - xL;
  const n = Math.max(4, Math.floor(w / 35));
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

function drawSideBar(
  ctx: CanvasRenderingContext2D,
  opts: {
    x: number;
    y: number;
    w: number;
    h: number;
    frac: number;
    label: string;
    sublabel: string;
    color: string;
    colors: { fg2: string; fg3: string };
  },
) {
  const { x, y, w, h, frac, label, sublabel, color, colors } = opts;
  // Outline
  ctx.strokeStyle = colors.fg3;
  ctx.lineWidth = 1;
  ctx.strokeRect(x, y, w, h);
  // Fill from bottom up
  const fillH = Math.max(0, Math.min(1, frac)) * h;
  ctx.fillStyle = color;
  ctx.fillRect(x, y + h - fillH, w, fillH);

  ctx.fillStyle = colors.fg2;
  ctx.font = "11px monospace";
  ctx.textAlign = "center";
  ctx.fillText(label, x + w / 2, y - 6);
  ctx.font = "10px monospace";
  ctx.fillText(sublabel, x + w / 2, y + h + 14);
}

function formatField(E: number): string {
  if (E >= 1e6) return `${(E / 1e6).toFixed(2)} MV/m`;
  if (E >= 1e3) return `${(E / 1e3).toFixed(2)} kV/m`;
  return `${E.toFixed(0)} V/m`;
}

function formatDensity(u: number): string {
  if (u === 0) return "0 J/m³";
  if (u >= 1) return `${u.toFixed(2)} J/m³`;
  if (u >= 1e-3) return `${(u * 1e3).toFixed(2)} mJ/m³`;
  if (u >= 1e-6) return `${(u * 1e6).toFixed(2)} µJ/m³`;
  return `${u.toExponential(2)} J/m³`;
}

