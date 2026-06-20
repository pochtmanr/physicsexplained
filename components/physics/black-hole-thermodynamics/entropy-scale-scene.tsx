"use client";

import { useEffect, useRef, useState } from "react";
import {
  FONT_HUD,
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
import {
  entropyInBits,
  M_SUN_KG,
} from "@/lib/physics/relativity/black-hole-thermodynamics";

/**
 * FIG.48b — The entropy scale.
 *
 * Log-scale horizontal bars comparing the Bekenstein–Hawking entropy (in units
 * of k_B, i.e. log₁₀(S/k_B)) of black holes against the ordinary thermal
 * entropy of familiar systems. A mass slider drives one live "your hole" bar
 * from an asteroid up to a supermassive hole, and a value of log₁₀(S/k_B) is
 * read out. The point: black holes are by orders of magnitude the most
 * entropic objects in the universe — S ∝ M², so doubling the mass quadruples
 * the entropy.
 */

const PAD = 18;

// Fixed reference rows: ordinary entropy in units of k_B (order-of-magnitude
// log₁₀ values from standard estimates) plus a few benchmark black holes.
interface Row {
  label: string;
  logS: number; // log10(S/k_B)
  kind: "ordinary" | "hole";
}

const ROWS: Row[] = [
  { label: "a glass of water", logS: 25, kind: "ordinary" },
  { label: "Earth's biosphere + atmosphere", logS: 44, kind: "ordinary" },
  { label: "the Sun (thermal)", logS: 58, kind: "ordinary" },
  { label: "all starlight + CMB photons", logS: 89, kind: "ordinary" },
  { label: "stellar-mass hole (10 M☉)", logS: logSHole(10 * M_SUN_KG), kind: "hole" },
  { label: "Sgr A* (4×10⁶ M☉)", logS: logSHole(4e6 * M_SUN_KG), kind: "hole" },
  { label: "M87* (6.5×10⁹ M☉)", logS: logSHole(6.5e9 * M_SUN_KG), kind: "hole" },
];

function logSHole(massKg: number): number {
  return Math.log10(entropyInBits(massKg));
}

export function EntropyScaleScene() {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const tokens = useSceneTokens();
  // slider in log10(M / M_sun), from asteroid (1e-12) to supermassive (1e10)
  const [logMass, setLogMass] = useState(1);
  const { width, height } = useSceneSize(containerRef, {
    ratio: 0.62,
    maxHeight: SCENE_HEIGHT_TALL,
    minHeight: 340,
  });

  const userMassKg = Math.pow(10, logMass) * M_SUN_KG;
  const userLogS = logSHole(userMassKg);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = applyDpr(canvas, width, height);
    if (!ctx) return;
    draw(ctx, tokens, userLogS, logMass, width, height);
  }, [tokens, userLogS, logMass, width, height]);

  return (
    <div ref={containerRef} className="relative w-full pb-4">
      <canvas
        ref={canvasRef}
        style={{ width, height, display: "block" }}
        className={SCENE_CANVAS_CLASS}
        aria-label="Logarithmic bar chart of entropy in units of the Boltzmann constant. Ordinary systems such as a glass of water, the Sun, and all the photons in the universe are compared with black holes, whose Bekenstein–Hawking entropy dwarfs them. A mass slider drives a live black-hole bar."
      />
      <div className="mt-3 flex items-center gap-3 font-mono text-xs text-[var(--color-fg-2)]">
        <span className="w-44 shrink-0 text-[var(--color-fg-3)]">
          M = 10^{logMass.toFixed(1)} M☉ · log₁₀(S/k_B) ≈ {userLogS.toFixed(1)}
        </span>
        <input
          type="range"
          min={-12}
          max={10}
          step={0.1}
          value={logMass}
          onChange={(e) => setLogMass(parseFloat(e.target.value))}
          className="flex-1"
          style={{ accentColor: "var(--color-amber)" }}
        />
      </div>
    </div>
  );
}

function draw(
  ctx: CanvasRenderingContext2D,
  tokens: SceneTokens,
  userLogS: number,
  logMass: number,
  W: number,
  H: number,
) {
  ctx.fillStyle = tokens.bg;
  ctx.fillRect(0, 0, W, H);

  drawSectionTitle(ctx, PAD, PAD, "ENTROPY  ·  log₁₀(S / k_B)", tokens.textMute);

  const rows: (Row & { live?: boolean })[] = [
    ...ROWS,
    { label: "your hole (slider)", logS: userLogS, kind: "hole", live: true },
  ];

  // Axis: 0 .. axisMax in log10 units across the bar region.
  const axisMax = 105;
  const labelW = Math.min(220, W * 0.34);
  const barX0 = PAD + labelW;
  const barX1 = W - PAD - 70;
  const barSpan = barX1 - barX0;

  const top = PAD + 28;
  const bottom = H - PAD - 8;
  const rowH = (bottom - top) / rows.length;
  const barH = Math.min(16, rowH * 0.55);

  // gridlines every 20 decades
  ctx.strokeStyle = tokens.grid;
  ctx.lineWidth = 1;
  ctx.font = FONT_HUD_SMALL;
  ctx.textAlign = "center";
  ctx.textBaseline = "top";
  for (let d = 0; d <= axisMax; d += 20) {
    const x = barX0 + (d / axisMax) * barSpan;
    ctx.beginPath();
    ctx.moveTo(x, top - 4);
    ctx.lineTo(x, bottom);
    ctx.stroke();
    ctx.fillStyle = tokens.textFaint;
    ctx.fillText(`10^${d}`, x, bottom + 2);
  }

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const cy = top + (i + 0.5) * rowH;
    const w = Math.max(2, (Math.min(row.logS, axisMax) / axisMax) * barSpan);
    const color =
      row.kind === "hole"
        ? row.live
          ? tokens.amber
          : tokens.magenta
        : tokens.cyan;

    // label
    ctx.fillStyle = row.live ? tokens.amber : tokens.textMute;
    ctx.font = row.live ? FONT_HUD : FONT_HUD_SMALL;
    ctx.textAlign = "right";
    ctx.textBaseline = "middle";
    ctx.fillText(row.label, barX0 - 8, cy);

    // bar with a soft glow for holes
    if (row.kind === "hole") {
      ctx.fillStyle = hexToRgba(color, 0.18);
      ctx.fillRect(barX0, cy - barH / 2 - 2, w, barH + 4);
    }
    ctx.fillStyle = row.live ? color : hexToRgba(color, 0.85);
    ctx.fillRect(barX0, cy - barH / 2, w, barH);

    // value at the bar end
    ctx.fillStyle = color;
    ctx.font = FONT_HUD_SMALL;
    ctx.textAlign = "left";
    ctx.fillText(row.logS.toFixed(0), barX0 + w + 6, cy);
  }

  ctx.textAlign = "left";
  ctx.textBaseline = "alphabetic";
}
