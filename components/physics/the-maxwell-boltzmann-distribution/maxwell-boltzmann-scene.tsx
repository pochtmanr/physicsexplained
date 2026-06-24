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
import { maxwellBoltzmannSpeed } from "@/lib/physics/thermodynamics/distributions";
import {
  SPECIES,
  speciesMass,
  vMostProbable,
  vMean,
  vRms,
  fastFraction,
} from "@/lib/physics/thermodynamics/maxwell-boltzmann";

/**
 * FIG.16a — the Maxwell–Boltzmann speed distribution f(v). Choose a gas and a
 * temperature: the curve shifts right and flattens as you heat it or lighten
 * the molecule. Three speeds are always ordered v_mp < ⟨v⟩ < v_rms (dashed
 * markers). Drag the threshold to shade the high-speed tail — the "fast
 * fraction" that drives escape, evaporation, and reaction rates.
 */

export function MaxwellBoltzmannScene() {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const tokens = useSceneTokens();
  const [tempK, setTempK] = useState(300);
  const [speciesName, setSpeciesName] = useState("N₂");
  const [threshFrac, setThreshFrac] = useState(0.55);

  const { width, height } = useSceneSize(containerRef, {
    ratio: 0.5,
    maxHeight: SCENE_HEIGHT_DEFAULT,
    minHeight: 260,
  });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = applyDpr(canvas, width, height);
    if (!ctx) return;
    draw(ctx, tokens, tempK, speciesName, threshFrac, width, height);
  }, [tokens, tempK, speciesName, threshFrac, width, height]);

  const species = SPECIES.find((s) => s.name === speciesName) ?? SPECIES[2];
  const m = speciesMass(species);
  const vAxisMax = 3.2 * vRms(tempK, m);
  const vThresh = threshFrac * vAxisMax;
  const frac = fastFraction(vThresh, tempK, m);

  return (
    <div ref={containerRef} className="relative w-full pb-4">
      <canvas
        ref={canvasRef}
        style={{ width, height, display: "block" }}
        className={SCENE_CANVAS_CLASS}
        aria-label="The Maxwell-Boltzmann speed distribution: probability density versus molecular speed, with dashed markers for the most-probable, mean, and root-mean-square speeds and a shaded high-speed tail above an adjustable threshold."
      />
      <div className="mt-3 flex items-center gap-3 font-mono text-xs text-[var(--color-fg-2)]">
        <span className="w-40 shrink-0">T: {tempK.toFixed(0)} K</span>
        <input
          type="range"
          min={80}
          max={1500}
          step={10}
          value={tempK}
          onChange={(e) => setTempK(parseFloat(e.target.value))}
          className="flex-1"
          style={{ accentColor: "var(--color-cyan)" }}
        />
      </div>
      <div className="mt-2 flex items-center gap-3 font-mono text-xs text-[var(--color-fg-2)]">
        <span className="w-40 shrink-0">
          v* {vThresh.toFixed(0)} m/s · {(frac * 100).toFixed(1)}% faster
        </span>
        <input
          type="range"
          min={0.05}
          max={0.95}
          step={0.01}
          value={threshFrac}
          onChange={(e) => setThreshFrac(parseFloat(e.target.value))}
          className="flex-1"
          style={{ accentColor: "var(--color-magenta)" }}
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
  tempK: number,
  speciesName: string,
  threshFrac: number,
  W: number,
  H: number,
) {
  ctx.fillStyle = tokens.bg;
  ctx.fillRect(0, 0, W, H);
  drawSectionTitle(ctx, 30, 8, `f(v) · ${speciesName} · ${tempK.toFixed(0)} K`, tokens.textMute);

  const species = SPECIES.find((s) => s.name === speciesName) ?? SPECIES[2];
  const m = speciesMass(species);

  const padL = 30;
  const padR = 14;
  const padT = 26;
  const padB = 26;
  const gx0 = padL;
  const gx1 = W - padR;
  const gy0 = padT;
  const gy1 = H - padB;

  const vAxisMax = 3.2 * vRms(tempK, m);
  const xOf = (v: number) => gx0 + (v / vAxisMax) * (gx1 - gx0);

  // sample the curve, find its max for y-scaling
  const N = 220;
  const pts: { v: number; f: number }[] = [];
  let fMax = 0;
  for (let i = 0; i <= N; i++) {
    const v = (i / N) * vAxisMax;
    const f = maxwellBoltzmannSpeed(v, tempK, m);
    if (f > fMax) fMax = f;
    pts.push({ v, f });
  }
  const yOf = (f: number) => gy1 - (f / (fMax * 1.1)) * (gy1 - gy0);

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
  ctx.fillText("speed v (m/s) →", gx1, gy1 + 8);

  // shaded fast tail above threshold
  const vThresh = threshFrac * vAxisMax;
  ctx.fillStyle = hexToRgba(tokens.magenta, 0.22);
  ctx.beginPath();
  ctx.moveTo(xOf(vThresh), gy1);
  for (const p of pts) {
    if (p.v >= vThresh) ctx.lineTo(xOf(p.v), yOf(p.f));
  }
  ctx.lineTo(xOf(vAxisMax), gy1);
  ctx.closePath();
  ctx.fill();

  // the curve
  ctx.strokeStyle = tokens.cyan;
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  pts.forEach((p, i) => {
    const x = xOf(p.v);
    const y = yOf(p.f);
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  });
  ctx.stroke();

  // characteristic-speed markers
  const marks: [number, string, string][] = [
    [vMostProbable(tempK, m), "v_mp", tokens.mint],
    [vMean(tempK, m), "⟨v⟩", tokens.amber],
    [vRms(tempK, m), "v_rms", tokens.orange],
  ];
  ctx.textAlign = "center";
  for (const [v, label, color] of marks) {
    ctx.strokeStyle = hexToRgba(color, 0.8);
    ctx.lineWidth = 1.5;
    ctx.setLineDash([4, 3]);
    ctx.beginPath();
    ctx.moveTo(xOf(v), gy0);
    ctx.lineTo(xOf(v), gy1);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = color;
    ctx.fillText(label, xOf(v), gy0 - 2);
  }

  // threshold line
  ctx.strokeStyle = tokens.magenta;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(xOf(vThresh), gy0);
  ctx.lineTo(xOf(vThresh), gy1);
  ctx.stroke();
}
