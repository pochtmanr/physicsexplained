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
import {
  SCENE_CANVAS_CLASS,
  SCENE_HEIGHT_TALL,
  applyDpr,
  hexToRgba,
  useSceneSize,
  useSceneTokens,
  type SceneTokens,
} from "@/components/physics/_shared/scene-tokens";

/**
 * §05.3 TWO CLOCKS COMPARISON
 *
 * Side-by-side ledger of the two GPS corrections. SR (kinematic) slows the
 * satellite clock; GR (gravitational) speeds it up; net is what the receiver
 * uses.
 */

const ORBITAL_SPEED_MS = gpsOrbitalSpeed();
const BETA = ORBITAL_SPEED_MS / SPEED_OF_LIGHT;
const SR_US = srCorrectionSecondsPerDay(ORBITAL_SPEED_MS) * 1e6;
const GR_US = grCorrectionSecondsPerDay(GPS_ORBIT_RADIUS_M) * 1e6;
const NET_US = netCorrectionMicrosecondsPerDay();
const RATIO = Math.abs(GR_US) / Math.abs(SR_US);

const BETA_SQ_OVER_2 = (BETA * BETA) / 2;
const PHI_DIFF_OVER_C2 =
  ((G_SI * EARTH_MASS_KG) / (SPEED_OF_LIGHT * SPEED_OF_LIGHT)) *
  (1 / EARTH_RADIUS_M - 1 / GPS_ORBIT_RADIUS_M);

export function TwoClocksComparisonScene() {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const tokens = useSceneTokens();

  const { width: W, height: H } = useSceneSize(containerRef, {
    ratio: 0.55,
    maxHeight: SCENE_HEIGHT_TALL,
    minHeight: 360,
  });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = applyDpr(canvas, W, H);
    if (!ctx) return;
    draw(ctx, tokens, W, H);
  }, [tokens, W, H]);

  return (
    <div ref={containerRef} className="w-full pb-4">
      <canvas
        ref={canvasRef}
        style={{ width: W, height: H, display: "block" }}
        className={SCENE_CANVAS_CLASS}
        aria-label="A three-column ledger comparing the SR clock-slowing correction (-7.2 microseconds per day), the GR clock-speeding correction (+45.7 microseconds per day), and the net (+38.5 microseconds per day) for a GPS satellite."
      />
    </div>
  );
}

function draw(
  ctx: CanvasRenderingContext2D,
  tokens: SceneTokens,
  W: number,
  H: number,
) {
  ctx.fillStyle = tokens.bg;
  ctx.fillRect(0, 0, W, H);

  ctx.save();
  ctx.font = "bold 14px ui-monospace, monospace";
  ctx.fillStyle = tokens.textBright;
  ctx.textAlign = "center";
  ctx.fillText("Two clocks, three numbers — the GPS receiver's daily ledger", W / 2, 24);
  ctx.font = "10.5px ui-monospace, monospace";
  ctx.fillStyle = tokens.textMute;
  ctx.fillText(
    "compared over one solar day  ·  satellite at v ≈ 3.87 km/s, r ≈ 26 571 km",
    W / 2,
    42,
  );
  ctx.restore();

  const colTop = 64;
  const colBottom = H - 80;
  const colHeight = colBottom - colTop;
  const padX = 18;
  const colW = (W - padX * 4) / 3;
  const colXs = [padX, padX * 2 + colW, padX * 3 + colW * 2];

  drawColumn(ctx, tokens, colXs[0], colTop, colW, colHeight, {
    title: "SR · kinematic",
    accent: tokens.red,
    formulaLine1: "Δτ_SR / Δt  =  √(1 − β²) − 1",
    formulaLine2: "          ≈  −β² / 2",
    substitution: [
      `β  =  v/c  ≈  ${BETA.toExponential(3)}`,
      `β²/2  ≈  ${BETA_SQ_OVER_2.toExponential(3)}`,
      `× 86 400 s  →  μs/day`,
    ],
    resultLabel: "Δτ_SR  ≈",
    resultValue: `${SR_US.toFixed(2)} μs/day`,
    caption: "moving clock runs slow",
  });

  drawColumn(ctx, tokens, colXs[1], colTop, colW, colHeight, {
    title: "GR · gravitational",
    accent: tokens.green,
    formulaLine1: "Δτ_GR / Δt  ≈  Φ_orbit − Φ_surface",
    formulaLine2: "          /c²  =  (GM/c²)(1/R⊕ − 1/r)",
    substitution: [
      `GM/c²  ≈  4.43 × 10⁻³ m`,
      `1/R⊕ − 1/r  ≈  1.19 × 10⁻⁷ m⁻¹`,
      `Δτ/Δt  ≈  ${PHI_DIFF_OVER_C2.toExponential(3)}`,
    ],
    resultLabel: "Δτ_GR  ≈",
    resultValue: `+${GR_US.toFixed(2)} μs/day`,
    caption: "higher Φ → clock runs fast",
  });

  drawColumn(ctx, tokens, colXs[2], colTop, colW, colHeight, {
    title: "NET · receiver correction",
    accent: tokens.amber,
    formulaLine1: "Δτ  =  Δτ_SR + Δτ_GR",
    formulaLine2: "    =  GR − SR (since signs oppose)",
    substitution: [
      `${SR_US.toFixed(2)}  +  ${GR_US.toFixed(2)}  μs/day`,
      `GR / |SR|  ≈  ${RATIO.toFixed(2)}×`,
      `→ programmed into every receiver`,
    ],
    resultLabel: "Δτ_NET  ≈",
    resultValue: `+${NET_US.toFixed(2)} μs/day`,
    caption: "GR dominates by ~6×",
  });

  // Bottom dominance band
  const bandTop = colBottom + 12;
  const bandH = H - bandTop - 8;
  ctx.save();
  ctx.fillStyle = hexToRgba(tokens.amber, 0.06);
  ctx.fillRect(padX, bandTop, W - padX * 2, bandH);
  ctx.strokeStyle = hexToRgba(tokens.amber, 0.25);
  ctx.lineWidth = 1;
  ctx.strokeRect(padX, bandTop, W - padX * 2, bandH);
  ctx.font = "11px ui-monospace, monospace";
  ctx.fillStyle = tokens.amber;
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
  caption: string;
}

function drawColumn(
  ctx: CanvasRenderingContext2D,
  tokens: SceneTokens,
  x: number,
  y: number,
  w: number,
  h: number,
  spec: ColumnSpec,
) {
  ctx.save();
  ctx.fillStyle = hexToRgba(tokens.textBright, 0.03);
  ctx.fillRect(x, y, w, h);
  ctx.strokeStyle = hexToRgba(spec.accent, 0.33);
  ctx.lineWidth = 1;
  ctx.strokeRect(x, y, w, h);

  ctx.fillStyle = hexToRgba(spec.accent, 0.1);
  ctx.fillRect(x, y, w, 28);
  ctx.font = "bold 12px ui-monospace, monospace";
  ctx.fillStyle = spec.accent;
  ctx.textAlign = "center";
  ctx.fillText(spec.title, x + w / 2, y + 19);

  ctx.font = "11.5px ui-monospace, monospace";
  ctx.fillStyle = tokens.textBright;
  ctx.textAlign = "center";
  let cursorY = y + 56;
  ctx.fillText(spec.formulaLine1, x + w / 2, cursorY);
  cursorY += 18;
  ctx.fillStyle = tokens.textDim;
  ctx.fillText(spec.formulaLine2, x + w / 2, cursorY);
  cursorY += 28;

  ctx.font = "10.5px ui-monospace, monospace";
  ctx.fillStyle = tokens.textDim;
  ctx.textAlign = "left";
  for (const line of spec.substitution) {
    ctx.fillText(line, x + 12, cursorY);
    cursorY += 16;
  }
  cursorY += 12;

  ctx.font = "11px ui-monospace, monospace";
  ctx.fillStyle = tokens.cyan;
  ctx.textAlign = "left";
  ctx.fillText(spec.resultLabel, x + 12, cursorY);
  cursorY += 22;
  ctx.font = "bold 17px ui-monospace, monospace";
  ctx.fillStyle = spec.accent;
  ctx.fillText(spec.resultValue, x + 12, cursorY);

  ctx.save();
  ctx.font = "10px ui-monospace, monospace";
  ctx.fillStyle = tokens.textMute;
  ctx.textAlign = "center";
  ctx.fillText(spec.caption, x + w / 2, y + h - 10);
  ctx.restore();

  ctx.restore();
}
