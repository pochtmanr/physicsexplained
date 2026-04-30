"use client";

import { useEffect, useRef } from "react";
import {
  EARTH_MASS_KG,
  EARTH_RADIUS_M,
  GPS_ORBIT_RADIUS_M,
  gpsOrbitalSpeed,
  grCorrectionSecondsPerDay,
  netCorrectionMicrosecondsPerDay,
  srCorrectionSecondsPerDay,
} from "@/lib/physics/relativity/gps-corrections";
import { G_SI, SPEED_OF_LIGHT } from "@/lib/physics/constants";

/**
 * §05.3 TWO CLOCKS COMPARISON
 *
 * Side-by-side ledger of the two corrections. Three columns:
 *   • SR (kinematic) — red, slows the satellite clock
 *   • GR (gravitational) — green, speeds it up
 *   • NET — amber, what the receiver actually uses
 *
 * Each column shows the formula, the symbolic substitution, and the
 * numerical result in μs/day. The annotated bottom row makes the
 * dominance explicit: "GR wins by ~6×."
 */

const BG = "#0A0C12";
const TEXT_DIM = "rgba(255,255,255,0.65)";
const TEXT_BRIGHT = "rgba(255,255,255,0.92)";
const TEXT_FAINT = "rgba(255,255,255,0.45)";
const RED = "#F87171";
const GREEN = "#4ADE80";
const AMBER = "#FFB36B";
const CYAN = "#67E8F9";

const ORBITAL_SPEED_MS = gpsOrbitalSpeed();
const BETA = ORBITAL_SPEED_MS / SPEED_OF_LIGHT;
const SR_US = srCorrectionSecondsPerDay(ORBITAL_SPEED_MS) * 1e6;
const GR_US = grCorrectionSecondsPerDay(GPS_ORBIT_RADIUS_M) * 1e6;
const NET_US = netCorrectionMicrosecondsPerDay();
const RATIO = Math.abs(GR_US) / Math.abs(SR_US);

// Numerical pieces for substitution lines
const BETA_SQ_OVER_2 = (BETA * BETA) / 2;
const PHI_DIFF_OVER_C2 =
  ((G_SI * EARTH_MASS_KG) / (SPEED_OF_LIGHT * SPEED_OF_LIGHT)) *
  (1 / EARTH_RADIUS_M - 1 / GPS_ORBIT_RADIUS_M);

export function TwoClocksComparisonScene() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dpr = window.devicePixelRatio || 1;
    const W = canvas.clientWidth;
    const H = canvas.clientHeight;
    canvas.width = W * dpr;
    canvas.height = H * dpr;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.scale(dpr, dpr);
    draw(ctx, W, H);
  }, []);

  return (
    <div className="relative w-full">
      <canvas
        ref={canvasRef}
        style={{ width: "100%", height: 420, display: "block" }}
        className="rounded-md border border-white/10 bg-[#0A0C12]"
        aria-label="A three-column ledger comparing the SR clock-slowing correction (-7.2 microseconds per day), the GR clock-speeding correction (+45.7 microseconds per day), and the net (+38.5 microseconds per day) for a GPS satellite."
      />
    </div>
  );
}

function draw(ctx: CanvasRenderingContext2D, W: number, H: number) {
  ctx.fillStyle = BG;
  ctx.fillRect(0, 0, W, H);

  // Title
  ctx.save();
  ctx.font = "bold 14px ui-monospace, monospace";
  ctx.fillStyle = TEXT_BRIGHT;
  ctx.textAlign = "center";
  ctx.fillText("Two clocks, three numbers — the GPS receiver's daily ledger", W / 2, 24);
  ctx.font = "10.5px ui-monospace, monospace";
  ctx.fillStyle = TEXT_FAINT;
  ctx.fillText(
    "compared over one solar day  ·  satellite at v ≈ 3.87 km/s, r ≈ 26 571 km",
    W / 2,
    42,
  );
  ctx.restore();

  // Three columns
  const colTop = 64;
  const colBottom = H - 80;
  const colHeight = colBottom - colTop;
  const padX = 18;
  const colW = (W - padX * 4) / 3;
  const colXs = [
    padX,
    padX * 2 + colW,
    padX * 3 + colW * 2,
  ];

  drawColumn(ctx, colXs[0], colTop, colW, colHeight, {
    title: "SR · kinematic",
    accent: RED,
    formulaLine1: "Δτ_SR / Δt  =  √(1 − β²) − 1",
    formulaLine2: "          ≈  −β² / 2",
    substitution: [
      `β  =  v/c  ≈  ${BETA.toExponential(3)}`,
      `β²/2  ≈  ${BETA_SQ_OVER_2.toExponential(3)}`,
      `× 86 400 s  →  μs/day`,
    ],
    resultLabel: "Δτ_SR  ≈",
    resultValue: `${SR_US.toFixed(2)} μs/day`,
    sign: "negative",
    caption: "moving clock runs slow",
  });

  drawColumn(ctx, colXs[1], colTop, colW, colHeight, {
    title: "GR · gravitational",
    accent: GREEN,
    formulaLine1: "Δτ_GR / Δt  ≈  Φ_orbit − Φ_surface",
    formulaLine2: "          /c²  =  (GM/c²)(1/R⊕ − 1/r)",
    substitution: [
      `GM/c²  ≈  4.43 × 10⁻³ m`,
      `1/R⊕ − 1/r  ≈  1.19 × 10⁻⁷ m⁻¹`,
      `Δτ/Δt  ≈  ${PHI_DIFF_OVER_C2.toExponential(3)}`,
    ],
    resultLabel: "Δτ_GR  ≈",
    resultValue: `+${GR_US.toFixed(2)} μs/day`,
    sign: "positive",
    caption: "higher Φ → clock runs fast",
  });

  drawColumn(ctx, colXs[2], colTop, colW, colHeight, {
    title: "NET · receiver correction",
    accent: AMBER,
    formulaLine1: "Δτ  =  Δτ_SR + Δτ_GR",
    formulaLine2: "    =  GR − SR (since signs oppose)",
    substitution: [
      `${SR_US.toFixed(2)}  +  ${GR_US.toFixed(2)}  μs/day`,
      `GR / |SR|  ≈  ${RATIO.toFixed(2)}×`,
      `→ programmed into every receiver`,
    ],
    resultLabel: "Δτ_NET  ≈",
    resultValue: `+${NET_US.toFixed(2)} μs/day`,
    sign: "positive",
    caption: "GR dominates by ~6×",
  });

  // Bottom band: dominance summary
  const bandTop = colBottom + 12;
  const bandH = H - bandTop - 8;
  ctx.save();
  ctx.fillStyle = "rgba(255,179,107,0.06)";
  ctx.fillRect(padX, bandTop, W - padX * 2, bandH);
  ctx.strokeStyle = "rgba(255,179,107,0.25)";
  ctx.lineWidth = 1;
  ctx.strokeRect(padX, bandTop, W - padX * 2, bandH);
  ctx.font = "11px ui-monospace, monospace";
  ctx.fillStyle = AMBER;
  ctx.textAlign = "center";
  ctx.fillText(
    `SR slows  ·  GR speeds  ·  GR dominates by ${RATIO.toFixed(1)}×  ·  Net = +${NET_US.toFixed(1)} μs/day`,
    W / 2,
    bandTop + bandH / 2 + 4,
  );
  ctx.restore();
}

interface ColumnSpec {
  title: string;
  accent: string;
  formulaLine1: string;
  formulaLine2: string;
  substitution: string[];
  resultLabel: string;
  resultValue: string;
  sign: "positive" | "negative";
  caption: string;
}

function drawColumn(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  spec: ColumnSpec,
) {
  // Frame
  ctx.save();
  ctx.fillStyle = "rgba(255,255,255,0.03)";
  ctx.fillRect(x, y, w, h);
  ctx.strokeStyle = `${spec.accent}55`;
  ctx.lineWidth = 1;
  ctx.strokeRect(x, y, w, h);

  // Header bar
  ctx.fillStyle = `${spec.accent}1a`;
  ctx.fillRect(x, y, w, 28);
  ctx.font = "bold 12px ui-monospace, monospace";
  ctx.fillStyle = spec.accent;
  ctx.textAlign = "center";
  ctx.fillText(spec.title, x + w / 2, y + 19);

  // Formula
  ctx.font = "11.5px ui-monospace, monospace";
  ctx.fillStyle = TEXT_BRIGHT;
  ctx.textAlign = "center";
  let cursorY = y + 56;
  ctx.fillText(spec.formulaLine1, x + w / 2, cursorY);
  cursorY += 18;
  ctx.fillStyle = TEXT_DIM;
  ctx.fillText(spec.formulaLine2, x + w / 2, cursorY);
  cursorY += 28;

  // Substitution lines
  ctx.font = "10.5px ui-monospace, monospace";
  ctx.fillStyle = TEXT_DIM;
  ctx.textAlign = "left";
  for (const line of spec.substitution) {
    ctx.fillText(line, x + 12, cursorY);
    cursorY += 16;
  }
  cursorY += 12;

  // Result block (big number)
  ctx.font = "11px ui-monospace, monospace";
  ctx.fillStyle = CYAN;
  ctx.textAlign = "left";
  ctx.fillText(spec.resultLabel, x + 12, cursorY);
  cursorY += 22;
  ctx.font = "bold 17px ui-monospace, monospace";
  ctx.fillStyle = spec.accent;
  ctx.fillText(spec.resultValue, x + 12, cursorY);

  // Caption (bottom)
  ctx.save();
  ctx.font = "10px ui-monospace, monospace";
  ctx.fillStyle = TEXT_FAINT;
  ctx.textAlign = "center";
  ctx.fillText(spec.caption, x + w / 2, y + h - 10);
  ctx.restore();

  ctx.restore();
}
