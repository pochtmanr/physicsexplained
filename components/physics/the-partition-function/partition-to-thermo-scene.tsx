"use client";

import { useEffect, useRef, useState } from "react";
import {
  FONT_HUD_SMALL,
  SCENE_CANVAS_CLASS,
  SCENE_HEIGHT_TALL,
  applyDpr,
  hexToRgba,
  drawSectionTitle,
  useSceneSize,
  useSceneTokens,
  type SceneTokens,
} from "@/components/physics/_shared/scene-tokens";
import { K_B } from "@/lib/physics/thermodynamics/distributions";
import {
  H_BAR,
  zTwoLevel,
  meanEnergyTwoLevel,
  cvTwoLevel,
  zHarmonic,
  meanEnergyHarmonic,
  cvHarmonic,
  sackurTetrode,
  freeEnergyFromZ,
} from "@/lib/physics/thermodynamics/partition-function";

/**
 * FIG.19b — Z as the generator. Pick a model (two-level system, harmonic
 * oscillator, or monatomic ideal gas) and one partition function Z(T) feeds all
 * four panels at once: the free energy F = −k_BT ln Z, the mean energy ⟨E⟩, the
 * entropy S and the heat capacity C_v are each a derivative of the same sum.
 * Slide the temperature; one curve in Z moves four observables together. Each
 * panel is auto-scaled — the lesson is the shape, not the units.
 */

const EPS = 1e-21; // gap / quantum scale for the discrete models
const T0_GAS = 300; // reference temperature for the ideal-gas axis
const TAU_MIN = 0.1;
const TAU_MAX = 5;
const SAMPLES = 200;

interface Observables {
  F: number;
  E: number;
  S: number;
  Cv: number;
}

type ModelId = "two-level" | "oscillator" | "ideal-gas";

const MODELS: { id: ModelId; label: string; xLabel: string }[] = [
  { id: "two-level", label: "2-level", xLabel: "k_BT/ε" },
  { id: "oscillator", label: "harmonic osc.", xLabel: "k_BT/ħω" },
  { id: "ideal-gas", label: "ideal gas", xLabel: "T/T₀" },
];

/** All four observables for a model at reduced temperature τ. */
function observablesAt(model: ModelId, tau: number): Observables {
  if (model === "two-level") {
    const T = (tau * EPS) / K_B;
    const Z = zTwoLevel(T, EPS);
    const E = meanEnergyTwoLevel(T, EPS);
    const F = freeEnergyFromZ(Z, T);
    return { F, E, S: (E - F) / T, Cv: cvTwoLevel(T, EPS) };
  }
  if (model === "oscillator") {
    const omega = EPS / H_BAR; // so ħω = EPS, and τ = k_BT/ħω
    const T = (tau * EPS) / K_B;
    const Z = zHarmonic(T, omega);
    const E = meanEnergyHarmonic(T, omega);
    const F = freeEnergyFromZ(Z, T);
    return { F, E, S: (E - F) / T, Cv: cvHarmonic(T, omega) };
  }
  // monatomic ideal gas, per fixed N in a fixed box
  const m = 28.01 * 1.66053906660e-27;
  const V = 1;
  const N = 2.5e25;
  const T = tau * T0_GAS;
  const E = 1.5 * N * K_B * T;
  const Cv = 1.5 * N * K_B;
  const S = sackurTetrode(T, m, V, N);
  return { F: E - T * S, E, S, Cv };
}

export function PartitionToThermoScene() {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const tokens = useSceneTokens();
  const [model, setModel] = useState<ModelId>("two-level");
  const [tau, setTau] = useState(1.5);

  const { width, height } = useSceneSize(containerRef, {
    ratio: 0.7,
    maxHeight: SCENE_HEIGHT_TALL,
    minHeight: 340,
  });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = applyDpr(canvas, width, height);
    if (!ctx) return;
    draw(ctx, tokens, model, tau, width, height);
  }, [tokens, model, tau, width, height]);

  return (
    <div ref={containerRef} className="relative w-full pb-4">
      <canvas
        ref={canvasRef}
        style={{ width, height, display: "block" }}
        className={SCENE_CANVAS_CLASS}
        aria-label="Four panels — free energy, mean energy, entropy, and heat capacity — all generated from one partition function as the temperature slider moves, for the selected model."
      />
      <div className="mt-3 flex items-center gap-3 font-mono text-xs text-[var(--color-fg-2)]">
        <span className="w-32 shrink-0">τ = {tau.toFixed(2)}</span>
        <input
          type="range"
          min={TAU_MIN}
          max={TAU_MAX}
          step={0.01}
          value={tau}
          onChange={(e) => setTau(parseFloat(e.target.value))}
          className="flex-1"
          style={{ accentColor: "var(--color-cyan)" }}
        />
      </div>
      <div className="mt-2 flex flex-wrap gap-2 font-mono text-xs">
        {MODELS.map((mdl) => {
          const active = mdl.id === model;
          return (
            <button
              key={mdl.id}
              type="button"
              onClick={() => setModel(mdl.id)}
              className="cursor-pointer rounded-sm border px-2 py-0.5"
              style={{
                borderColor: active ? "var(--color-cyan)" : "var(--color-fg-4)",
                color: active ? "var(--color-cyan)" : "var(--color-fg-3)",
              }}
            >
              {mdl.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function draw(
  ctx: CanvasRenderingContext2D,
  tokens: SceneTokens,
  model: ModelId,
  tau: number,
  W: number,
  H: number,
) {
  ctx.fillStyle = tokens.bg;
  ctx.fillRect(0, 0, W, H);

  drawSectionTitle(
    ctx,
    14,
    6,
    "Z(T) = Σ e^(−E/kT)  →  F, ⟨E⟩, S, C_v",
    tokens.textMute,
  );

  const xLabel = MODELS.find((m) => m.id === model)?.xLabel ?? "T";

  // sample every observable across the τ-range once
  const taus: number[] = [];
  const series: Record<keyof Observables, number[]> = { F: [], E: [], S: [], Cv: [] };
  for (let i = 0; i <= SAMPLES; i++) {
    const t = TAU_MIN + (i / SAMPLES) * (TAU_MAX - TAU_MIN);
    taus.push(t);
    const o = observablesAt(model, t);
    series.F.push(o.F);
    series.E.push(o.E);
    series.S.push(o.S);
    series.Cv.push(o.Cv);
  }

  const panels: { key: keyof Observables; label: string; color: string }[] = [
    { key: "E", label: "⟨E⟩", color: tokens.amber },
    { key: "F", label: "F = −kT ln Z", color: tokens.cyan },
    { key: "S", label: "S", color: tokens.mint },
    { key: "Cv", label: "C_v", color: tokens.magenta },
  ];

  const topPad = 22;
  const cellW = W / 2;
  const cellH = (H - topPad) / 2;
  panels.forEach((p, idx) => {
    const col = idx % 2;
    const row = Math.floor(idx / 2);
    drawPanel(
      ctx,
      tokens,
      taus,
      series[p.key],
      tau,
      p.label,
      p.color,
      xLabel,
      col * cellW,
      topPad + row * cellH,
      cellW,
      cellH,
    );
  });
}

function drawPanel(
  ctx: CanvasRenderingContext2D,
  tokens: SceneTokens,
  taus: number[],
  values: number[],
  tauNow: number,
  label: string,
  color: string,
  xLabel: string,
  ox: number,
  oy: number,
  cw: number,
  ch: number,
) {
  const padL = 14;
  const padR = 14;
  const padT = 18;
  const padB = 18;
  const gx0 = ox + padL;
  const gx1 = ox + cw - padR;
  const gy0 = oy + padT;
  const gy1 = oy + ch - padB;

  let vMin = Infinity;
  let vMax = -Infinity;
  for (const v of values) {
    if (v < vMin) vMin = v;
    if (v > vMax) vMax = v;
  }
  if (vMax - vMin < 1e-30) {
    vMax += 1;
    vMin -= 1;
  }
  const pad = (vMax - vMin) * 0.08;
  vMin -= pad;
  vMax += pad;

  const xOf = (t: number) =>
    gx0 + ((t - TAU_MIN) / (TAU_MAX - TAU_MIN)) * (gx1 - gx0);
  const yOf = (v: number) => gy1 - ((v - vMin) / (vMax - vMin)) * (gy1 - gy0);

  // baseline at v = 0 if the range crosses it
  if (vMin < 0 && vMax > 0) {
    ctx.strokeStyle = hexToRgba(tokens.gridHeavy, 0.4);
    ctx.lineWidth = 1;
    ctx.setLineDash([2, 3]);
    ctx.beginPath();
    ctx.moveTo(gx0, yOf(0));
    ctx.lineTo(gx1, yOf(0));
    ctx.stroke();
    ctx.setLineDash([]);
  }

  // frame baseline
  ctx.strokeStyle = tokens.axes;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(gx0, gy1);
  ctx.lineTo(gx1, gy1);
  ctx.stroke();

  // curve
  ctx.strokeStyle = color;
  ctx.lineWidth = 2;
  ctx.beginPath();
  taus.forEach((t, i) => {
    const x = xOf(t);
    const y = yOf(values[i]);
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  });
  ctx.stroke();

  // marker at current τ
  const idxNow = Math.round(((tauNow - TAU_MIN) / (TAU_MAX - TAU_MIN)) * SAMPLES);
  const clamped = Math.max(0, Math.min(SAMPLES, idxNow));
  ctx.strokeStyle = hexToRgba(tokens.textFaint, 0.6);
  ctx.setLineDash([3, 3]);
  ctx.beginPath();
  ctx.moveTo(xOf(tauNow), gy0);
  ctx.lineTo(xOf(tauNow), gy1);
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(xOf(tauNow), yOf(values[clamped]), 3.5, 0, Math.PI * 2);
  ctx.fill();

  // label
  ctx.font = FONT_HUD_SMALL;
  ctx.fillStyle = color;
  ctx.textAlign = "left";
  ctx.textBaseline = "top";
  ctx.fillText(label, gx0 + 2, gy0 - 2);
  ctx.fillStyle = tokens.textFaint;
  ctx.textAlign = "right";
  ctx.textBaseline = "bottom";
  ctx.fillText(`${xLabel} →`, gx1, gy1 + 16);
}
