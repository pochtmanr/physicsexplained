"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  FONT_HUD_SMALL,
  SCENE_CANVAS_CLASS,
  SCENE_HEIGHT_DEFAULT,
  applyDpr,
  drawHudReadout,
  drawSectionTitle,
  hexToRgba,
  useSceneSize,
  useSceneTokens,
  type SceneTokens,
} from "@/components/physics/_shared/scene-tokens";
import {
  curvatureDensity,
  integrateScaleFactor,
  universeFate,
  type CosmoParams,
  type ScaleFactorSample,
} from "@/lib/physics/relativity/friedmann-equations";

/**
 * FIG.55a — The universe machine.
 *
 * Three sliders set the present-day density parameters Ω_m, Ω_r, Ω_Λ. The
 * curvature density Ω_k = 1 − Ω_m − Ω_r − Ω_Λ is read off automatically (the
 * flatness sum), and the first Friedmann equation ȧ = a·E(a) is integrated
 * live with RK4. The resulting a(t) curve is plotted: it either recollapses
 * (closed, Λ-free), coasts forever (flat/open matter), or accelerates (Λ wins).
 * The fate label and q₀ readout update as you drag.
 *
 * Time is in Hubble-time units (1/H₀); a = 1 marks "today" as a dashed line.
 */

const PAD = 16;

const PRESETS: { label: string; p: CosmoParams }[] = [
  { label: "concordance ΛCDM", p: { omegaM: 0.31, omegaR: 0.0001, omegaLambda: 0.69 } },
  { label: "Einstein–de Sitter", p: { omegaM: 1, omegaR: 0, omegaLambda: 0 } },
  { label: "closed (recollapse)", p: { omegaM: 1.8, omegaR: 0, omegaLambda: 0 } },
  { label: "open (coast)", p: { omegaM: 0.3, omegaR: 0, omegaLambda: 0 } },
  { label: "de Sitter (Λ only)", p: { omegaM: 0.02, omegaR: 0, omegaLambda: 0.98 } },
];

function fateColor(
  fate: "recollapse" | "coast" | "accelerate",
  tokens: SceneTokens,
): string {
  if (fate === "accelerate") return tokens.cyan;
  if (fate === "recollapse") return tokens.red;
  return tokens.amber;
}

export function UniverseMachineScene() {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const tokens = useSceneTokens();
  const [omegaM, setOmegaM] = useState(0.31);
  const [omegaR, setOmegaR] = useState(0.0001);
  const [omegaLambda, setOmegaLambda] = useState(0.69);

  const { width, height } = useSceneSize(containerRef, {
    ratio: 0.55,
    maxHeight: SCENE_HEIGHT_DEFAULT,
    minHeight: 320,
  });

  const params: CosmoParams = useMemo(
    () => ({ omegaM, omegaR, omegaLambda }),
    [omegaM, omegaR, omegaLambda],
  );
  const omegaK = curvatureDensity(params);
  const fate = universeFate(params);

  const samples = useMemo<ScaleFactorSample[]>(
    () =>
      integrateScaleFactor(params, {
        a0: 1e-2,
        dt: 3e-3,
        aMax: 4,
        maxSteps: 40000,
      }),
    [params],
  );

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = applyDpr(canvas, width, height);
    if (!ctx) return;
    draw(ctx, tokens, samples, params, omegaK, fate, width, height);
  }, [tokens, samples, params, omegaK, fate, width, height]);

  const applyPreset = (p: CosmoParams) => {
    setOmegaM(p.omegaM);
    setOmegaR(p.omegaR);
    setOmegaLambda(p.omegaLambda);
  };

  return (
    <div ref={containerRef} className="relative w-full pb-4">
      <canvas
        ref={canvasRef}
        style={{ width, height, display: "block" }}
        className={SCENE_CANVAS_CLASS}
        aria-label="The universe machine: sliders set the density parameters Omega_m, Omega_r, Omega_Lambda; the scale factor a(t) is integrated live from the first Friedmann equation and plotted, showing recollapse, coasting, or accelerating expansion."
      />

      <div className="mt-3 grid grid-cols-1 gap-2 font-mono text-xs text-[var(--color-fg-2)] sm:grid-cols-3">
        <SliderRow
          label="Ω_m (matter)"
          value={omegaM}
          color="var(--color-cyan)"
          onChange={setOmegaM}
          max={2}
        />
        <SliderRow
          label="Ω_r (radiation)"
          value={omegaR}
          color="var(--color-magenta)"
          onChange={setOmegaR}
          max={0.3}
          step={0.0005}
        />
        <SliderRow
          label="Ω_Λ (dark energy)"
          value={omegaLambda}
          color="var(--color-amber)"
          onChange={setOmegaLambda}
          max={1.5}
        />
      </div>

      <div className="mt-2 flex flex-wrap gap-x-5 gap-y-1 font-mono text-xs text-[var(--color-fg-3)]">
        {PRESETS.map((preset) => (
          <button
            key={preset.label}
            type="button"
            className="cursor-pointer hover:text-[var(--color-fg-1)]"
            onClick={() => applyPreset(preset.p)}
          >
            {preset.label}
          </button>
        ))}
      </div>
    </div>
  );
}

function SliderRow({
  label,
  value,
  color,
  onChange,
  max,
  step = 0.01,
}: {
  label: string;
  value: number;
  color: string;
  onChange: (v: number) => void;
  max: number;
  step?: number;
}) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-[var(--color-fg-3)]">
        {label}: {value.toFixed(step < 0.01 ? 4 : 2)}
      </span>
      <input
        type="range"
        min={0}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        style={{ accentColor: color }}
      />
    </label>
  );
}

function draw(
  ctx: CanvasRenderingContext2D,
  tokens: SceneTokens,
  samples: ScaleFactorSample[],
  params: CosmoParams,
  omegaK: number,
  fate: "recollapse" | "coast" | "accelerate",
  W: number,
  H: number,
) {
  ctx.fillStyle = tokens.bg;
  ctx.fillRect(0, 0, W, H);

  const plotX0 = PAD + 34;
  const plotY0 = PAD + 22;
  const plotX1 = W - PAD;
  const plotY1 = H - PAD - 18;
  const plotW = plotX1 - plotX0;
  const plotH = plotY1 - plotY0;

  drawSectionTitle(ctx, PAD, PAD - 2, "SCALE FACTOR a(t)", tokens.textMute);

  // Axis ranges
  const tMax = Math.max(...samples.map((s) => s.t), 1) * 1.02;
  const aMaxData = Math.max(...samples.map((s) => s.a), 1.2);
  const aMax = Math.min(4, aMaxData * 1.05);

  const tx = (t: number) => plotX0 + (t / tMax) * plotW;
  const ay = (a: number) => plotY1 - (a / aMax) * plotH;

  // Grid + axes
  ctx.strokeStyle = tokens.grid;
  ctx.lineWidth = 1;
  for (let i = 0; i <= 4; i++) {
    const yy = plotY0 + (i / 4) * plotH;
    ctx.beginPath();
    ctx.moveTo(plotX0, yy);
    ctx.lineTo(plotX1, yy);
    ctx.stroke();
  }
  ctx.strokeStyle = tokens.axes;
  ctx.beginPath();
  ctx.moveTo(plotX0, plotY0);
  ctx.lineTo(plotX0, plotY1);
  ctx.lineTo(plotX1, plotY1);
  ctx.stroke();

  // Axis labels
  ctx.fillStyle = tokens.textMute;
  ctx.font = FONT_HUD_SMALL;
  ctx.textAlign = "right";
  ctx.textBaseline = "middle";
  for (let i = 0; i <= 4; i++) {
    const aVal = (aMax * (4 - i)) / 4;
    ctx.fillText(aVal.toFixed(1), plotX0 - 6, plotY0 + (i / 4) * plotH);
  }
  ctx.textAlign = "center";
  ctx.textBaseline = "top";
  ctx.fillText("cosmic time  t · H₀  →", (plotX0 + plotX1) / 2, plotY1 + 4);

  // "today" line at a = 1
  if (aMax >= 1) {
    ctx.strokeStyle = hexToRgba(tokens.textFaint, 0.9);
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.moveTo(plotX0, ay(1));
    ctx.lineTo(plotX1, ay(1));
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = tokens.textMute;
    ctx.textAlign = "left";
    ctx.textBaseline = "bottom";
    ctx.fillText("a = 1 (today)", plotX0 + 4, ay(1) - 2);
  }

  // The a(t) curve
  const curveColor = fateColor(fate, tokens);
  ctx.strokeStyle = curveColor;
  ctx.lineWidth = 2;
  ctx.beginPath();
  samples.forEach((s, i) => {
    const x = tx(s.t);
    const y = ay(Math.min(s.a, aMax));
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  });
  ctx.stroke();

  // Glow under the curve
  ctx.save();
  ctx.globalAlpha = 0.12;
  ctx.fillStyle = curveColor;
  ctx.beginPath();
  ctx.moveTo(tx(samples[0]!.t), plotY1);
  samples.forEach((s) => ctx.lineTo(tx(s.t), ay(Math.min(s.a, aMax))));
  ctx.lineTo(tx(samples[samples.length - 1]!.t), plotY1);
  ctx.closePath();
  ctx.fill();
  ctx.restore();

  // ── HUD ──────────────────────────────────────────────────────────────────
  const hudX = plotX1 - 168;
  let hudY = plotY0 + 6;
  const kLabel = omegaK > 1e-3 ? "open (k=−1)" : omegaK < -1e-3 ? "closed (k=+1)" : "flat (k=0)";
  hudY = drawHudReadout(ctx, hudX, hudY, "Ω_k = ", omegaK.toFixed(3), tokens.textDim, tokens.textBright);
  hudY = drawHudReadout(ctx, hudX, hudY, "geom: ", kLabel, tokens.textDim, tokens.textMute);
  const q0 = params.omegaR + 0.5 * params.omegaM - params.omegaLambda;
  hudY = drawHudReadout(ctx, hudX, hudY, "q₀ = ", q0.toFixed(2), tokens.textDim, q0 < 0 ? tokens.cyan : tokens.amber);
  drawHudReadout(ctx, hudX, hudY, "fate: ", fate.toUpperCase(), tokens.textDim, curveColor);
}
