"use client";

import { useEffect, useRef, useState } from "react";
import { useThemeColors } from "@/lib/hooks/use-theme-colors";
import { lineLoss } from "@/lib/physics/electromagnetism/transformers";

/**
 * FIG.31c — "why the grid runs at hundreds of kV."
 *
 * 100 km transmission line, 1 MW of delivered power, fixed line resistance
 * (typical aluminium conductor ~0.1 Ω/km → 10 Ω total). The transmission
 * voltage slides from 1 kV to 1 MV on a log axis; the line loss
 * P_loss = (P/V)² · R is plotted on the same log axis.
 *
 * Left: a stylised map — generator → step-up transformer → 100 km line →
 * step-down transformer → city. The arrow on the line shows current I =
 * P_load / V_source, which shrinks as V_source grows.
 *
 * Right: a log-log plot. Annotations at 1 kV, 400 kV (European grid), and
 * 1 MV. Reads: "at 1 kV, almost all the power is lost as heat"; "at
 * 400 kV, loss is a fraction of a percent."
 *
 * No animation frame — purely reactive to the voltage slider.
 */

const RATIO = 0.48;
const MAX_HEIGHT = 380;
const LINE_RESISTANCE = 10; // Ω total (100 km × 0.1 Ω/km)
const LINE_LENGTH_KM = 100;
const LOAD_POWER = 1e6; // 1 MW
const V_MIN = 1e3; // 1 kV
const V_MAX = 1e6; // 1 MV
const EUROPE_V = 400e3; // 400 kV European HV grid

const MAGENTA = "#FF6ADE";
const AMBER = "#FFD66B";
const LILAC = "rgba(200, 160, 255, 0.95)";

export function PowerTransmissionScene() {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const colors = useThemeColors();
  const [size, setSize] = useState({ width: 720, height: 380 });
  // Slider 0..1, log-mapped from V_MIN to V_MAX, default at 400 kV
  const defaultSlider =
    Math.log(EUROPE_V / V_MIN) / Math.log(V_MAX / V_MIN);
  const [sliderValue, setSliderValue] = useState(defaultSlider);
  const V = sliderToVoltage(sliderValue);
  const I = LOAD_POWER / V;
  const loss = lineLoss(LOAD_POWER, V, LINE_RESISTANCE);
  const lossFrac = loss / LOAD_POWER;

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

  useEffect(() => {
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

    const padX = 20;
    const padY = 24;
    const leftW = Math.min(width * 0.5, width - 320);
    const rightL = padX + leftW + 12;

    // ── Left panel: schematic map ──
    drawSchematic(
      ctx,
      padX,
      padY,
      leftW,
      height - padY * 2,
      V,
      I,
      loss,
      colors,
    );

    // ── Right panel: log-log loss plot ──
    drawLossPlot(
      ctx,
      rightL,
      padY,
      width - rightL - padX,
      height - padY * 2,
      V,
      loss,
      colors,
    );

    // Global HUD
    ctx.fillStyle = colors.fg2;
    ctx.font = "10px monospace";
    ctx.textAlign = "left";
    ctx.fillText(
      `${LINE_LENGTH_KM} km line, R = ${LINE_RESISTANCE} Ω, load = 1 MW`,
      padX,
      height - 6,
    );
  }, [size, V, I, loss, colors]);

  return (
    <div ref={containerRef} className="w-full pb-4">
      <canvas
        ref={canvasRef}
        style={{ width: size.width, height: size.height }}
        className="block"
      />
      <div className="mt-2 grid grid-cols-1 gap-2 px-2">
        <div className="flex items-center gap-2">
          <label className="w-32 font-mono text-xs text-[var(--color-fg-3)]">
            transmission V
          </label>
          <input
            type="range"
            min={0}
            max={1}
            step={0.001}
            value={sliderValue}
            onChange={(e) => setSliderValue(parseFloat(e.target.value))}
            className="flex-1 accent-[#FFD66B]"
          />
          <span className="w-24 text-right font-mono text-xs text-[var(--color-fg-1)]">
            {formatVoltage(V)}
          </span>
        </div>
        <div className="flex items-center justify-between px-1 font-mono text-[10px] text-[var(--color-fg-3)]">
          <span>1 kV</span>
          <span>400 kV (Europe)</span>
          <span>1 MV</span>
        </div>
      </div>
    </div>
  );
}

function sliderToVoltage(v: number): number {
  return V_MIN * Math.pow(V_MAX / V_MIN, v);
}

function formatVoltage(V: number): string {
  if (V >= 1e6) return `${(V / 1e6).toFixed(2)} MV`;
  if (V >= 1e3) return `${(V / 1e3).toFixed(1)} kV`;
  return `${V.toFixed(0)} V`;
}

function formatPower(P: number): string {
  if (P >= 1e6) return `${(P / 1e6).toFixed(2)} MW`;
  if (P >= 1e3) return `${(P / 1e3).toFixed(1)} kW`;
  if (P >= 1) return `${P.toFixed(1)} W`;
  return `${(P * 1000).toFixed(1)} mW`;
}

function drawSchematic(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  V: number,
  I: number,
  loss: number,
  colors: { fg1: string; fg2: string; fg3: string },
) {
  const midY = y + h / 2;
  const genX = x + 20;
  const stepUpX = x + w * 0.22;
  const stepDownX = x + w * 0.78;
  const cityX = x + w - 20;

  // Line itself
  ctx.strokeStyle = colors.fg3;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(stepUpX + 16, midY);
  ctx.lineTo(stepDownX - 16, midY);
  ctx.stroke();

  // Transmission towers (three pylons)
  for (let i = 1; i <= 3; i++) {
    const tx = stepUpX + 16 + ((stepDownX - 16 - (stepUpX + 16)) * i) / 4;
    ctx.strokeStyle = colors.fg3;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(tx, midY);
    ctx.lineTo(tx, midY + 24);
    ctx.moveTo(tx - 6, midY + 24);
    ctx.lineTo(tx + 6, midY + 24);
    ctx.stroke();
  }

  // Current arrows on line — density scales with I
  const arrowCount = Math.max(1, Math.min(8, Math.round(Math.log10(I + 1) * 3 + 1)));
  const lineStart = stepUpX + 20;
  const lineEnd = stepDownX - 20;
  for (let i = 0; i < arrowCount; i++) {
    const ax = lineStart + ((lineEnd - lineStart) * (i + 0.5)) / arrowCount;
    drawSmallArrow(ctx, ax - 5, midY - 8, ax + 5, midY - 8, AMBER);
  }

  // Generator (left) — big magenta circle with ~
  drawCircleLabel(ctx, genX, midY, 14, MAGENTA, "~");
  ctx.fillStyle = colors.fg2;
  ctx.font = "9px monospace";
  ctx.textAlign = "center";
  ctx.fillText("gen", genX, midY + 26);

  // Wires from gen to step-up transformer
  ctx.strokeStyle = colors.fg3;
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  ctx.moveTo(genX + 14, midY);
  ctx.lineTo(stepUpX - 16, midY);
  ctx.stroke();

  // Step-up transformer schematic — two coils glyph
  drawTransformerGlyph(ctx, stepUpX, midY, "↑");
  ctx.fillStyle = colors.fg2;
  ctx.font = "9px monospace";
  ctx.textAlign = "center";
  ctx.fillText("step-up", stepUpX, midY + 32);

  // Step-down transformer
  drawTransformerGlyph(ctx, stepDownX, midY, "↓");
  ctx.fillStyle = colors.fg2;
  ctx.fillText("step-down", stepDownX, midY + 32);

  // Wires from step-down to city
  ctx.strokeStyle = colors.fg3;
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  ctx.moveTo(stepDownX + 16, midY);
  ctx.lineTo(cityX - 12, midY);
  ctx.stroke();

  // City / load (right) — a building glyph
  ctx.strokeStyle = AMBER;
  ctx.lineWidth = 1.5;
  ctx.strokeRect(cityX - 12, midY - 14, 24, 28);
  ctx.fillStyle = "rgba(255, 214, 107, 0.1)";
  ctx.fillRect(cityX - 12, midY - 14, 24, 28);
  // windows
  ctx.fillStyle = "rgba(255, 214, 107, 0.8)";
  for (let r = 0; r < 3; r++) {
    for (let c = 0; c < 2; c++) {
      ctx.fillRect(cityX - 9 + c * 9, midY - 10 + r * 9, 4, 4);
    }
  }
  ctx.fillStyle = colors.fg2;
  ctx.font = "9px monospace";
  ctx.textAlign = "center";
  ctx.fillText("city", cityX, midY + 26);

  // Line voltage / current readouts
  ctx.fillStyle = AMBER;
  ctx.font = "11px monospace";
  ctx.textAlign = "center";
  const midLineX = (stepUpX + stepDownX) / 2;
  ctx.fillText(
    `V = ${formatVoltage(V)},  I = ${I < 1 ? I.toFixed(2) : I.toFixed(0)} A`,
    midLineX,
    midY - 18,
  );

  // Loss callout
  ctx.fillStyle = LILAC;
  ctx.font = "10px monospace";
  ctx.fillText(
    `P_loss = ${formatPower(loss)}  (${((loss / LOAD_POWER) * 100).toFixed(loss / LOAD_POWER < 0.01 ? 3 : 1)}% of 1 MW)`,
    midLineX,
    y + h - 18,
  );

  // Heading
  ctx.fillStyle = colors.fg1;
  ctx.font = "11px monospace";
  ctx.textAlign = "left";
  ctx.fillText(
    `${LINE_LENGTH_KM} km aluminium line, R_line = ${LINE_RESISTANCE} Ω`,
    x,
    y + 12,
  );
}

function drawLossPlot(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  V: number,
  loss: number,
  colors: { fg1: string; fg2: string; fg3: string },
) {
  const plotL = x + 40;
  const plotR = x + w - 10;
  const plotT = y + 14;
  const plotB = y + h - 28;

  // Axes frame
  ctx.strokeStyle = colors.fg3;
  ctx.lineWidth = 1;
  ctx.strokeRect(plotL, plotT, plotR - plotL, plotB - plotT);

  // X axis: log V from V_MIN to V_MAX
  // Y axis: log P_loss/P_load from 1e-6 to 1 (0.0001% to 100%)
  const logVmin = Math.log10(V_MIN);
  const logVmax = Math.log10(V_MAX);
  const lossYmin = -6; // 10^-6 = 1 ppm
  const lossYmax = 0; //  10^0  = 100%

  const xOfV = (v: number) =>
    plotL + ((Math.log10(v) - logVmin) / (logVmax - logVmin)) * (plotR - plotL);
  const yOfLoss = (frac: number) => {
    const lf = Math.max(lossYmin, Math.min(lossYmax, Math.log10(frac)));
    return plotB - ((lf - lossYmin) / (lossYmax - lossYmin)) * (plotB - plotT);
  };

  // X gridlines at decades
  ctx.strokeStyle = colors.fg3;
  ctx.setLineDash([2, 3]);
  ctx.fillStyle = colors.fg2;
  ctx.font = "9px monospace";
  ctx.textAlign = "center";
  for (let d = logVmin; d <= logVmax; d++) {
    const xd = xOfV(Math.pow(10, d));
    ctx.beginPath();
    ctx.moveTo(xd, plotT);
    ctx.lineTo(xd, plotB);
    ctx.stroke();
    const v = Math.pow(10, d);
    const label = v >= 1e6 ? `${v / 1e6}M` : v >= 1e3 ? `${v / 1e3}k` : `${v}`;
    ctx.fillText(`${label}V`, xd, plotB + 12);
  }

  // Y gridlines (20 dB per decade)
  for (let d = lossYmin; d <= lossYmax; d++) {
    const yd = yOfLoss(Math.pow(10, d));
    ctx.beginPath();
    ctx.moveTo(plotL, yd);
    ctx.lineTo(plotR, yd);
    ctx.stroke();
    ctx.textAlign = "right";
    ctx.fillText(
      `${(Math.pow(10, d) * 100).toExponential(0)}%`,
      plotL - 4,
      yd + 3,
    );
  }
  ctx.setLineDash([]);

  // The loss curve: P_loss/P_load = P_load · R / V²
  ctx.strokeStyle = LILAC;
  ctx.lineWidth = 1.8;
  ctx.beginPath();
  const steps = 200;
  for (let i = 0; i <= steps; i++) {
    const v = V_MIN * Math.pow(V_MAX / V_MIN, i / steps);
    const p = lineLoss(LOAD_POWER, v, LINE_RESISTANCE) / LOAD_POWER;
    const pxX = xOfV(v);
    const pxY = yOfLoss(Math.max(1e-8, p));
    if (i === 0) ctx.moveTo(pxX, pxY);
    else ctx.lineTo(pxX, pxY);
  }
  ctx.stroke();

  // Current V marker
  const mX = xOfV(V);
  const mY = yOfLoss(Math.max(1e-8, loss / LOAD_POWER));
  ctx.fillStyle = AMBER;
  ctx.beginPath();
  ctx.arc(mX, mY, 4, 0, Math.PI * 2);
  ctx.fill();

  // Europe annotation
  const eX = xOfV(EUROPE_V);
  ctx.strokeStyle = "rgba(255, 214, 107, 0.5)";
  ctx.setLineDash([3, 3]);
  ctx.beginPath();
  ctx.moveTo(eX, plotT);
  ctx.lineTo(eX, plotB);
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.fillStyle = "rgba(255, 214, 107, 0.8)";
  ctx.font = "9px monospace";
  ctx.textAlign = "left";
  ctx.fillText("Europe 400 kV", eX + 4, plotT + 12);

  // Plot title
  ctx.fillStyle = colors.fg1;
  ctx.font = "10px monospace";
  ctx.textAlign = "center";
  ctx.fillText(
    "P_loss / P_load = (P_load · R) / V²   (log-log)",
    (plotL + plotR) / 2,
    plotT - 4,
  );
}

function drawCircleLabel(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  r: number,
  color: string,
  label: string,
) {
  ctx.strokeStyle = color;
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.stroke();
  ctx.fillStyle = color;
  ctx.font = "12px monospace";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(label, cx, cy);
  ctx.textBaseline = "alphabetic";
}

function drawTransformerGlyph(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  arrow: string,
) {
  ctx.strokeStyle = "rgba(180, 165, 120, 0.9)";
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  ctx.arc(cx - 6, cy, 8, 0, Math.PI * 2);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(cx + 6, cy, 8, 0, Math.PI * 2);
  ctx.stroke();
  // Core bars
  ctx.strokeStyle = "rgba(180, 165, 120, 0.5)";
  ctx.beginPath();
  ctx.moveTo(cx, cy - 10);
  ctx.lineTo(cx, cy + 10);
  ctx.stroke();
  // Arrow label
  ctx.fillStyle = "#FFD66B";
  ctx.font = "11px monospace";
  ctx.textAlign = "center";
  ctx.fillText(arrow, cx, cy - 14);
}

function drawSmallArrow(
  ctx: CanvasRenderingContext2D,
  x0: number,
  y0: number,
  x1: number,
  y1: number,
  color: string,
) {
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.moveTo(x0, y0);
  ctx.lineTo(x1, y1);
  ctx.stroke();
  const dx = x1 - x0;
  const dy = y1 - y0;
  const len = Math.hypot(dx, dy) || 1;
  const ux = dx / len;
  const uy = dy / len;
  const ah = 3;
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x1 - ah * ux - ah * 0.6 * -uy, y1 - ah * uy - ah * 0.6 * ux);
  ctx.lineTo(x1 - ah * ux + ah * 0.6 * -uy, y1 - ah * uy + ah * 0.6 * ux);
  ctx.closePath();
  ctx.fill();
}
