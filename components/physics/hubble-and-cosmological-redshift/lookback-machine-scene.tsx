"use client";

import { useEffect, useRef, useState } from "react";
import {
  FONT_HUD_SMALL,
  SCENE_CANVAS_CLASS,
  SCENE_HEIGHT_DEFAULT,
  applyDpr,
  hexToRgba,
  drawSectionTitle,
  useSceneSize,
  useSceneTokens,
  type SceneTokens,
} from "@/components/physics/_shared/scene-tokens";
import {
  CONCORDANCE,
  ageNowGyr,
  ageAtRedshiftGyr,
  lookbackTimeGyr,
  scaleFactorFromRedshift,
} from "@/lib/physics/relativity/hubble-and-cosmological-redshift";

/**
 * FIG.56c — the lookback machine.
 *
 * A log-redshift slider from z = 0 (here-and-now) to z = 1100 (the CMB). For
 * the chosen z it computes, in the concordance ΛCDM model: the scale factor
 * a = 1/(1+z) (how much smaller the universe was), the age of the universe AT
 * emission, the lookback time (how long the light has travelled), and the
 * wavelength stretch. Preset buttons jump to landmark redshifts. The surprising
 * factor-of-1000 numbers of the CMB fall straight out: at z = 1100 the universe
 * was ~380 000 years old, 1101× smaller, and the light has been in flight for
 * ~13.8 billion years.
 */

const PAD = 16;

const PRESETS: { label: string; z: number }[] = [
  { label: "now (z=0)", z: 0 },
  { label: "z=0.5", z: 0.5 },
  { label: "z=1", z: 1 },
  { label: "z=2 (cosmic noon)", z: 2 },
  { label: "z=6 (first galaxies)", z: 6 },
  { label: "z=1100 (CMB)", z: 1100 },
];

const AGE_NOW = ageNowGyr(CONCORDANCE);

function fmtTime(gyr: number): string {
  if (gyr >= 1) return `${gyr.toFixed(2)} Gyr`;
  if (gyr >= 1e-3) return `${(gyr * 1e3).toFixed(0)} Myr`;
  return `${(gyr * 1e6).toFixed(0)} kyr`;
}

export function LookbackMachineScene() {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const tokens = useSceneTokens();
  // store log10(1+z) for a usable slider across 0 → 1100
  const [logZ, setLogZ] = useState(Math.log10(2)); // z = 1
  const { width, height } = useSceneSize(containerRef, {
    ratio: 0.55,
    maxHeight: SCENE_HEIGHT_DEFAULT,
    minHeight: 320,
  });

  const z = Math.pow(10, logZ) - 1;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = applyDpr(canvas, width, height);
    if (!ctx) return;
    draw(ctx, tokens, z, width, height);
  }, [tokens, z, width, height]);

  return (
    <div ref={containerRef} className="w-full pb-4">
      <canvas
        ref={canvasRef}
        style={{ width, height, display: "block" }}
        className={SCENE_CANVAS_CLASS}
        aria-label="A lookback machine: a logarithmic redshift slider from z=0 to z=1100 showing the scale factor, age of the universe at emission, lookback time and wavelength stretch in the concordance cosmology."
      />
      <div className="mt-3 space-y-2 font-mono text-xs text-[var(--color-fg-2)]">
        <div className="flex items-center gap-3">
          <span className="w-40 shrink-0">z = {z < 10 ? z.toFixed(2) : z.toFixed(0)}</span>
          <input
            type="range"
            min={Math.log10(1)}
            max={Math.log10(1101)}
            step={0.001}
            value={logZ}
            onChange={(e) => setLogZ(parseFloat(e.target.value))}
            className="flex-1"
            style={{ accentColor: "var(--color-cyan)" }}
          />
        </div>
        <div className="flex flex-wrap gap-2 text-[var(--color-fg-3)]">
          {PRESETS.map((p) => (
            <button
              key={p.label}
              type="button"
              className="cursor-pointer hover:text-[var(--color-cyan)]"
              onClick={() => setLogZ(Math.log10(1 + p.z))}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function draw(
  ctx: CanvasRenderingContext2D,
  tokens: SceneTokens,
  z: number,
  W: number,
  H: number,
) {
  ctx.fillStyle = tokens.bg;
  ctx.fillRect(0, 0, W, H);

  drawSectionTitle(ctx, PAD, PAD - 2, "LOOKBACK MACHINE · CONCORDANCE ΛCDM", tokens.textMute);

  const a = scaleFactorFromRedshift(z);
  const ageEmit = ageAtRedshiftGyr(z, CONCORDANCE);
  const lookback = lookbackTimeGyr(z, CONCORDANCE);
  const stretch = 1 + z;

  // ── cosmic timeline bar: Big Bang (left) → now (right), log time ──
  const barX0 = PAD + 4;
  const barX1 = W - PAD - 4;
  const barY = PAD + 40;
  const barW = barX1 - barX0;

  // map cosmic age (Gyr, log scale from 1e-5 to AGE_NOW) to x
  const tMin = 1e-5;
  const xOfAge = (ageGyr: number) => {
    const lo = Math.log10(tMin);
    const hi = Math.log10(AGE_NOW);
    const v = Math.log10(Math.max(ageGyr, tMin));
    return barX0 + ((v - lo) / (hi - lo)) * barW;
  };

  // bar gradient
  const grad = ctx.createLinearGradient(barX0, 0, barX1, 0);
  grad.addColorStop(0, hexToRgba(tokens.amber, 0.55));
  grad.addColorStop(0.5, hexToRgba(tokens.magenta, 0.45));
  grad.addColorStop(1, hexToRgba(tokens.cyan, 0.55));
  ctx.fillStyle = grad;
  ctx.fillRect(barX0, barY, barW, 16);
  ctx.strokeStyle = tokens.panelBorder;
  ctx.lineWidth = 1;
  ctx.strokeRect(barX0, barY, barW, 16);

  // landmark ticks
  ctx.font = FONT_HUD_SMALL;
  ctx.textAlign = "center";
  ctx.fillStyle = tokens.textMute;
  const marks: [number, string][] = [
    [ageAtRedshiftGyr(1100, CONCORDANCE), "CMB"],
    [ageAtRedshiftGyr(6, CONCORDANCE), "z=6"],
    [ageAtRedshiftGyr(1, CONCORDANCE), "z=1"],
    [AGE_NOW, "now"],
  ];
  for (const [age, label] of marks) {
    const x = xOfAge(age);
    ctx.strokeStyle = tokens.gridHeavy;
    ctx.beginPath();
    ctx.moveTo(x, barY - 4);
    ctx.lineTo(x, barY + 20);
    ctx.stroke();
    ctx.fillStyle = tokens.textFaint;
    ctx.fillText(label, x, barY + 22);
  }

  // emission marker
  const emX = xOfAge(ageEmit);
  ctx.fillStyle = tokens.amber;
  ctx.beginPath();
  ctx.moveTo(emX, barY - 8);
  ctx.lineTo(emX - 5, barY - 16);
  ctx.lineTo(emX + 5, barY - 16);
  ctx.closePath();
  ctx.fill();

  // ── readout panel ──
  const panelY = barY + 50;
  const rows: [string, string, string][] = [
    ["redshift  z", z < 10 ? z.toFixed(3) : z.toFixed(0), tokens.amber],
    ["scale factor  a = 1/(1+z)", a < 0.01 ? a.toExponential(2) : a.toFixed(3), tokens.cyan],
    ["universe was smaller by", `${stretch < 100 ? stretch.toFixed(2) : stretch.toFixed(0)}×`, tokens.magenta],
    ["age of universe at emission", fmtTime(ageEmit), tokens.mint],
    ["lookback time (light travel)", fmtTime(lookback), tokens.blue],
    ["wavelength stretch  λ_obs/λ_emit", `${stretch < 100 ? stretch.toFixed(2) : stretch.toFixed(0)}×`, tokens.red],
  ];

  const lineH = Math.min(26, (H - panelY - PAD) / rows.length);
  ctx.textBaseline = "middle";
  rows.forEach((row, i) => {
    const [label, value, color] = row;
    const y = panelY + i * lineH + lineH / 2;
    ctx.textAlign = "left";
    ctx.font = FONT_HUD_SMALL;
    ctx.fillStyle = tokens.textDim;
    ctx.fillText(label, PAD + 4, y);
    ctx.textAlign = "right";
    ctx.font = "12px ui-monospace, monospace";
    ctx.fillStyle = color;
    ctx.fillText(value, W - PAD - 4, y);
    // faint baseline
    ctx.strokeStyle = tokens.grid;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(PAD + 4, y + lineH / 2 - 1);
    ctx.lineTo(W - PAD - 4, y + lineH / 2 - 1);
    ctx.stroke();
  });
  ctx.textBaseline = "alphabetic";
}
