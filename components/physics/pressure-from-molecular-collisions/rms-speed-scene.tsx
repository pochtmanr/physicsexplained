"use client";

import { useEffect, useMemo, useRef, useState } from "react";
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
import { mulberry32, gaussian } from "@/lib/physics/thermodynamics/random";
import {
  K_B,
  SPECIES,
  characteristicSpeeds,
} from "@/lib/physics/thermodynamics/kinetic-pressure";

/**
 * FIG.15b — the spread of molecular speeds.
 *
 * Sample 6000 molecules from a gas at temperature T: each Cartesian velocity
 * component is Gaussian with variance k_BT/m, so the speed |v| follows the 3D
 * Maxwell–Boltzmann law. The histogram is marked with the three speeds that
 * always fall in the same order — most-probable < mean < root-mean-square.
 * Switch species (lighter → faster) or raise T (whole curve shifts right and
 * flattens). This is the distribution the next topic derives from scratch.
 */

const N_SAMPLES = 6000;
const N_BINS = 48;

function sampleSpeeds(mass: number, T: number): number[] {
  const rng = mulberry32(424242);
  const sigma = Math.sqrt((K_B * T) / mass); // per-component std dev, m/s
  const out: number[] = [];
  for (let i = 0; i < N_SAMPLES; i++) {
    const vx = gaussian(rng) * sigma;
    const vy = gaussian(rng) * sigma;
    const vz = gaussian(rng) * sigma;
    out.push(Math.sqrt(vx * vx + vy * vy + vz * vz));
  }
  return out;
}

export function RmsSpeedScene() {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const tokens = useSceneTokens();
  const [speciesName, setSpeciesName] = useState("N₂");
  const [tempK, setTempK] = useState(300);

  const { width, height } = useSceneSize(containerRef, {
    ratio: 0.55,
    maxHeight: SCENE_HEIGHT_DEFAULT,
    minHeight: 280,
  });

  const species = SPECIES.find((s) => s.name === speciesName) ?? SPECIES[2];
  const speeds = useMemo(() => sampleSpeeds(species.mass, tempK), [species.mass, tempK]);
  const marks = useMemo(() => characteristicSpeeds(tempK, species.mass), [tempK, species.mass]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = applyDpr(canvas, width, height);
    if (!ctx) return;
    draw(ctx, tokens, speeds, marks, speciesName, tempK, width, height);
  }, [tokens, speeds, marks, speciesName, tempK, width, height]);

  return (
    <div ref={containerRef} className="relative w-full pb-4">
      <canvas
        ref={canvasRef}
        style={{ width, height, display: "block" }}
        className={SCENE_CANVAS_CLASS}
        aria-label="Histogram of molecular speeds for a gas, with vertical markers for the most-probable, mean and root-mean-square speeds. Lighter species and higher temperatures shift the distribution to faster speeds."
      />
      <div className="mt-3 flex items-center gap-3 font-mono text-xs text-[var(--color-fg-2)]">
        <span className="w-44 shrink-0">
          {speciesName} at {tempK} K · v_rms {marks.vRms.toFixed(0)} m/s
        </span>
        <input
          type="range"
          min={80}
          max={1200}
          step={10}
          value={tempK}
          onChange={(e) => setTempK(parseInt(e.target.value))}
          className="flex-1"
          style={{ accentColor: "var(--color-amber)" }}
        />
      </div>
      <div className="mt-2 flex flex-wrap gap-2 font-mono text-xs">
        {SPECIES.map((s) => {
          const active = s.name === speciesName;
          return (
            <button
              key={s.name}
              type="button"
              onClick={() => setSpeciesName(s.name)}
              className="cursor-pointer rounded-sm border px-2 py-0.5"
              style={{
                borderColor: active ? "var(--color-cyan)" : "var(--color-fg-4)",
                color: active ? "var(--color-cyan)" : "var(--color-fg-3)",
              }}
            >
              {s.name}
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
  speeds: number[],
  marks: { vMp: number; vMean: number; vRms: number },
  speciesName: string,
  tempK: number,
  W: number,
  H: number,
) {
  ctx.fillStyle = tokens.bg;
  ctx.fillRect(0, 0, W, H);
  drawSectionTitle(ctx, 30, 8, "SPEED DISTRIBUTION", tokens.textMute);

  const padL = 18;
  const padR = 14;
  const padT = 26;
  const padB = 30;
  const gx0 = padL;
  const gx1 = W - padR;
  const gy0 = padT;
  const gy1 = H - padB;

  // fixed x-scale so changing T/species visibly shifts the curve
  const vMax = 2800; // m/s
  const xOf = (v: number) => gx0 + Math.min(1, v / vMax) * (gx1 - gx0);

  // bin
  const bins = new Array(N_BINS).fill(0);
  const binW = vMax / N_BINS;
  for (const v of speeds) {
    const b = Math.min(N_BINS - 1, Math.floor(v / binW));
    bins[b]++;
  }
  const peak = Math.max(...bins, 1);
  const yOf = (count: number) => gy1 - (count / peak) * (gy1 - gy0);

  // bars
  for (let i = 0; i < N_BINS; i++) {
    const x = xOf(i * binW);
    const x2 = xOf((i + 1) * binW);
    const y = yOf(bins[i]);
    ctx.fillStyle = hexToRgba(tokens.cyan, 0.45);
    ctx.fillRect(x, y, Math.max(1, x2 - x - 1), gy1 - y);
  }

  // axes
  ctx.strokeStyle = tokens.axes;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(gx0, gy0);
  ctx.lineTo(gx0, gy1);
  ctx.lineTo(gx1, gy1);
  ctx.stroke();
  ctx.fillStyle = tokens.textMute;
  ctx.font = FONT_HUD_SMALL;
  ctx.textAlign = "right";
  ctx.textBaseline = "top";
  ctx.fillText("speed (m/s) →", gx1, gy1 + 8);
  // x ticks
  ctx.textAlign = "center";
  for (const v of [500, 1000, 1500, 2000, 2500]) {
    ctx.fillStyle = tokens.textFaint;
    ctx.fillText(`${v}`, xOf(v), gy1 + 8);
  }

  // markers
  const drawMark = (v: number, color: string, label: string, dy: number) => {
    const x = xOf(v);
    ctx.strokeStyle = color;
    ctx.lineWidth = 1.5;
    ctx.setLineDash([4, 3]);
    ctx.beginPath();
    ctx.moveTo(x, gy0);
    ctx.lineTo(x, gy1);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = color;
    ctx.textAlign = "left";
    ctx.textBaseline = "top";
    ctx.fillText(label, x + 3, gy0 + dy);
  };
  drawMark(marks.vMp, tokens.mint, `v_mp ${marks.vMp.toFixed(0)}`, 0);
  drawMark(marks.vMean, tokens.amber, `⟨v⟩ ${marks.vMean.toFixed(0)}`, 13);
  drawMark(marks.vRms, tokens.magenta, `v_rms ${marks.vRms.toFixed(0)}`, 26);

  ctx.fillStyle = tokens.textFaint;
  ctx.textAlign = "right";
  ctx.fillText(`${speciesName} · ${tempK} K`, gx1, gy0 + 0);
}
