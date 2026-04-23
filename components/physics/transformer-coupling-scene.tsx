"use client";

import { useEffect, useRef, useState } from "react";
import { useAnimationFrame } from "@/lib/animation/use-animation-frame";
import { useThemeColors } from "@/lib/hooks/use-theme-colors";
import {
  voltageRatio,
  currentRatio,
} from "@/lib/physics/electromagnetism/transformers";

/**
 * FIG.31a — two coils wound on a shared ferromagnetic core. A sinusoidal
 * primary voltage V_p(t) drives flux Φ(t) around the iron rectangle; the
 * secondary picks up V_s = n · V_p where n = N_s / N_p.
 *
 * Controls: a single slider for the turns ratio n ∈ [0.1, 10] (log-mapped
 * so both step-down and step-up are reachable). The primary coil keeps a
 * fixed number of drawn turns; the secondary's drawn turns scale with n
 * (clamped to 3..20 for visual legibility).
 *
 * Palette:
 *   magenta — primary V_p
 *   cyan    — flux arrows in the core
 *   amber   — secondary V_s
 *   lilac   — HUD current readouts (low emphasis)
 */

const RATIO = 0.58;
const MAX_HEIGHT = 400;
const OMEGA = 2 * Math.PI * 0.5; // 0.5 Hz visual drive
const VP_AMP = 120; // peak primary volts
const IP_AMP = 2.0; // peak primary amps (arbitrary load)
const PRIMARY_TURNS_DRAWN = 10;
const MAGENTA = "#FF6ADE";
const AMBER = "#FFD66B";
const LILAC = "rgba(200, 160, 255, 0.9)";

export function TransformerCouplingScene() {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const colors = useThemeColors();
  const [size, setSize] = useState({ width: 640, height: 360 });
  // Slider is 0..1, mapped to n ∈ [0.1, 10] logarithmically (0.5 = n=1)
  const [sliderValue, setSliderValue] = useState(0.65); // default ≈ 2.5
  const turnsRatio = sliderValuetoN(sliderValue);

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

      // ── Physics ──
      const Vp = VP_AMP * Math.sin(OMEGA * t);
      const Ip = IP_AMP * Math.sin(OMEGA * t); // in-phase for visual simplicity
      const Vs = voltageRatio(turnsRatio, Vp);
      const Is = currentRatio(turnsRatio, Ip);
      // Flux in the core is ∫V_p / N_p — phase-lags V_p by 90° for a sine
      // drive. Use a unit amplitude; the arrow size scales with |Φ|.
      const flux = Math.cos(OMEGA * t); // normalised to ±1

      // ── Layout ──
      const padX = 24;
      const padY = 26;
      const coreL = padX + 30;
      const coreR = width - padX - 30;
      const coreT = padY + 40;
      const coreB = height - padY - 40;
      const coreThick = 14;

      // Core — rectangular hollow iron frame
      ctx.strokeStyle = "rgba(180, 165, 120, 0.9)";
      ctx.lineWidth = coreThick;
      ctx.strokeRect(coreL, coreT, coreR - coreL, coreB - coreT);
      // Hatch the core to suggest lamination
      ctx.save();
      ctx.strokeStyle = "rgba(80, 70, 40, 0.4)";
      ctx.lineWidth = 1;
      for (let y = coreT + 3; y < coreB; y += 4) {
        ctx.beginPath();
        ctx.moveTo(coreL - coreThick / 2, y);
        ctx.lineTo(coreL + coreThick / 2, y);
        ctx.moveTo(coreR - coreThick / 2, y);
        ctx.lineTo(coreR + coreThick / 2, y);
        ctx.stroke();
      }
      ctx.restore();

      // Flux arrows around the core (circulate clockwise when flux > 0)
      drawFluxArrows(ctx, coreL, coreT, coreR, coreB, flux);

      // Primary coil — on the left limb. Fixed turns count (drawn).
      const coilLeftX = coreL;
      drawCoil(
        ctx,
        coilLeftX,
        coreT,
        coreB,
        PRIMARY_TURNS_DRAWN,
        "left",
        MAGENTA,
      );
      // Secondary coil — on the right limb. Drawn turn count scales with n.
      const coilRightX = coreR;
      const drawnSecTurns = Math.max(
        3,
        Math.min(20, Math.round(PRIMARY_TURNS_DRAWN * turnsRatio)),
      );
      drawCoil(ctx, coilRightX, coreT, coreB, drawnSecTurns, "right", AMBER);

      // Labels
      ctx.font = "11px monospace";
      ctx.textAlign = "center";
      ctx.fillStyle = MAGENTA;
      ctx.fillText(
        `N_p = ${PRIMARY_TURNS_DRAWN}`,
        coilLeftX - 26,
        coreT - 10,
      );
      ctx.fillStyle = AMBER;
      ctx.fillText(
        `N_s = ${drawnSecTurns}`,
        coilRightX + 26,
        coreT - 10,
      );

      // Side meter blocks for V and I
      drawMeter(
        ctx,
        coilLeftX - 72,
        (coreT + coreB) / 2 - 36,
        "V_p",
        Vp,
        "V",
        MAGENTA,
      );
      drawMeter(
        ctx,
        coilLeftX - 72,
        (coreT + coreB) / 2 + 6,
        "I_p",
        Ip,
        "A",
        LILAC,
      );
      drawMeter(
        ctx,
        coilRightX + 20,
        (coreT + coreB) / 2 - 36,
        "V_s",
        Vs,
        "V",
        AMBER,
      );
      drawMeter(
        ctx,
        coilRightX + 20,
        (coreT + coreB) / 2 + 6,
        "I_s",
        Is,
        "A",
        LILAC,
      );

      // HUD
      ctx.textAlign = "left";
      ctx.fillStyle = colors.fg1;
      ctx.font = "12px monospace";
      ctx.fillText(
        `n = N_s/N_p = ${turnsRatio.toFixed(2)}`,
        12,
        16,
      );
      ctx.fillStyle = colors.fg2;
      ctx.font = "11px monospace";
      ctx.fillText("V_s = n · V_p      I_s = I_p / n", 12, height - 8);
      ctx.fillStyle = "rgba(180, 165, 120, 0.9)";
      ctx.textAlign = "center";
      ctx.fillText("laminated iron core", width / 2, coreT - 18);
    },
  });

  return (
    <div ref={containerRef} className="w-full pb-4">
      <canvas
        ref={canvasRef}
        style={{ width: size.width, height: size.height }}
        className="block"
      />
      <div className="mt-2 grid grid-cols-1 gap-2 px-2">
        <div className="flex items-center gap-2">
          <label className="w-28 font-mono text-xs text-[var(--color-fg-3)]">
            turns ratio n
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
          <span className="w-20 text-right font-mono text-xs text-[var(--color-fg-1)]">
            n = {turnsRatio.toFixed(2)}
          </span>
        </div>
      </div>
    </div>
  );
}

function sliderValuetoN(v: number): number {
  // Log map: v=0 → 0.1, v=0.5 → 1, v=1 → 10
  const logMin = Math.log(0.1);
  const logMax = Math.log(10);
  return Math.exp(logMin + (logMax - logMin) * v);
}

function drawCoil(
  ctx: CanvasRenderingContext2D,
  centerX: number,
  topY: number,
  botY: number,
  turns: number,
  side: "left" | "right",
  color: string,
) {
  const r = 9;
  const span = botY - topY;
  const step = span / (turns + 1);
  const offset = side === "left" ? -1 : 1;
  ctx.strokeStyle = color;
  ctx.lineWidth = 1.8;
  for (let i = 0; i < turns; i++) {
    const y = topY + (i + 1) * step;
    // Half-loop sticking out of the core
    ctx.beginPath();
    ctx.arc(centerX, y, r, -Math.PI / 2, Math.PI / 2, offset > 0);
    ctx.stroke();
  }
}

function drawFluxArrows(
  ctx: CanvasRenderingContext2D,
  L: number,
  T: number,
  R: number,
  B: number,
  flux: number,
) {
  // flux ∈ [-1, 1]. Sign flips arrow direction; magnitude fades opacity.
  const sign = Math.sign(flux) || 1;
  const alpha = 0.25 + 0.7 * Math.abs(flux);
  ctx.strokeStyle = `rgba(120, 220, 255, ${alpha.toFixed(3)})`;
  ctx.fillStyle = ctx.strokeStyle;
  ctx.lineWidth = 1.4;
  const midY = (T + B) / 2;
  const midX = (L + R) / 2;
  // Two arrows: top-middle pointing along core, bottom-middle pointing back
  // Clockwise when sign > 0
  drawArrow(ctx, midX - 15 * sign, T - 2, midX + 15 * sign, T - 2);
  drawArrow(ctx, midX + 15 * sign, B + 2, midX - 15 * sign, B + 2);
  // Side vertical arrows
  drawArrow(ctx, R + 2, midY - 15 * sign, R + 2, midY + 15 * sign);
  drawArrow(ctx, L - 2, midY + 15 * sign, L - 2, midY - 15 * sign);
  // Label
  ctx.fillStyle = `rgba(120, 220, 255, ${(0.5 + 0.5 * Math.abs(flux)).toFixed(3)})`;
  ctx.font = "10px monospace";
  ctx.textAlign = "center";
  ctx.fillText("Φ(t)", midX, T + 14);
}

function drawArrow(
  ctx: CanvasRenderingContext2D,
  x0: number,
  y0: number,
  x1: number,
  y1: number,
) {
  ctx.beginPath();
  ctx.moveTo(x0, y0);
  ctx.lineTo(x1, y1);
  ctx.stroke();
  const dx = x1 - x0;
  const dy = y1 - y0;
  const len = Math.hypot(dx, dy) || 1;
  const ux = dx / len;
  const uy = dy / len;
  const ah = 4;
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x1 - ah * ux - ah * 0.6 * -uy, y1 - ah * uy - ah * 0.6 * ux);
  ctx.lineTo(x1 - ah * ux + ah * 0.6 * -uy, y1 - ah * uy + ah * 0.6 * ux);
  ctx.closePath();
  ctx.fill();
}

function drawMeter(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  label: string,
  value: number,
  unit: string,
  color: string,
) {
  ctx.save();
  ctx.strokeStyle = "rgba(255,255,255,0.15)";
  ctx.lineWidth = 1;
  ctx.strokeRect(x, y, 60, 28);
  ctx.font = "9px monospace";
  ctx.fillStyle = "rgba(180,180,190,0.85)";
  ctx.textAlign = "left";
  ctx.fillText(label, x + 4, y + 10);
  ctx.fillStyle = color;
  ctx.font = "11px monospace";
  const absVal = Math.abs(value);
  const formatted =
    absVal >= 1000
      ? `${(value / 1000).toFixed(1)}k${unit}`
      : `${value.toFixed(1)}${unit}`;
  ctx.fillText(formatted, x + 4, y + 22);
  ctx.restore();
}
