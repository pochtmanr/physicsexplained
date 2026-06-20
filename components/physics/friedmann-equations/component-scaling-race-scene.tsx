"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  FONT_HUD_SMALL,
  SCENE_CANVAS_CLASS,
  SCENE_HEIGHT_DEFAULT,
  applyDpr,
  drawSectionTitle,
  hexToRgba,
  useSceneSize,
  useSceneTokens,
  type SceneTokens,
} from "@/components/physics/_shared/scene-tokens";
import {
  CONCORDANCE,
  equalityScaleMatterRadiation,
  equalityScaleMatterLambda,
  scaleToRedshift,
} from "@/lib/physics/relativity/friedmann-equations";

/**
 * FIG.55b — The component scaling race.
 *
 * A log–log plot of each energy density versus the scale factor a, normalised
 * to ρ_crit today. Radiation ρ_r ∝ a⁻⁴ (steepest), matter ρ_m ∝ a⁻³, and the
 * cosmological constant ρ_Λ = const (flat). Because they fall at different
 * rates, each dominates a different epoch: radiation first, then matter, then
 * Λ. The two crossover points — matter–radiation equality (z ≈ 3400) and
 * matter–Λ equality (z ≈ 0.3) — are marked with vertical guides. A draggable
 * cursor reports which component rules at the chosen scale factor.
 */

const PAD = 16;

// log10(a) plot range: from a = 1e-6 (deep radiation era) to a = 1e1 (future).
const LOG_A_MIN = -6;
const LOG_A_MAX = 1;

export function ComponentScalingRaceScene() {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const tokens = useSceneTokens();
  // cursor position as log10(a)
  const [logA, setLogA] = useState(0); // a = 1 today

  const { width, height } = useSceneSize(containerRef, {
    ratio: 0.55,
    maxHeight: SCENE_HEIGHT_DEFAULT,
    minHeight: 320,
  });

  const a = useMemo(() => Math.pow(10, logA), [logA]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = applyDpr(canvas, width, height);
    if (!ctx) return;
    draw(ctx, tokens, logA, width, height);
  }, [tokens, logA, width, height]);

  const dRad = CONCORDANCE.omegaR / a ** 4;
  const dMat = CONCORDANCE.omegaM / a ** 3;
  const dLam = CONCORDANCE.omegaLambda;
  const dominant =
    dRad >= dMat && dRad >= dLam
      ? "radiation"
      : dMat >= dLam
        ? "matter"
        : "dark energy (Λ)";
  const z = scaleToRedshift(a);

  return (
    <div ref={containerRef} className="relative w-full pb-4">
      <canvas
        ref={canvasRef}
        style={{ width, height, display: "block" }}
        className={SCENE_CANVAS_CLASS}
        aria-label="Log-log plot of energy densities versus scale factor: radiation falls as a to the minus 4, matter as a to the minus 3, and the cosmological constant stays flat. Crossover points mark matter-radiation and matter-Lambda equality."
      />

      <div className="mt-3 flex items-center gap-3 font-mono text-xs text-[var(--color-fg-2)]">
        <span className="w-56 shrink-0">
          a = {a < 0.001 ? a.toExponential(1) : a.toFixed(3)} (z = {z < 0 ? z.toFixed(2) : z.toExponential(1)})
        </span>
        <input
          type="range"
          min={LOG_A_MIN}
          max={LOG_A_MAX}
          step={0.02}
          value={logA}
          onChange={(e) => setLogA(parseFloat(e.target.value))}
          className="flex-1"
          style={{ accentColor: "var(--color-cyan)" }}
        />
      </div>
      <div className="mt-1 font-mono text-xs text-[var(--color-fg-3)]">
        dominant component here: <span className="text-[var(--color-fg-1)]">{dominant}</span>
      </div>
    </div>
  );
}

function draw(
  ctx: CanvasRenderingContext2D,
  tokens: SceneTokens,
  cursorLogA: number,
  W: number,
  H: number,
) {
  ctx.fillStyle = tokens.bg;
  ctx.fillRect(0, 0, W, H);

  const plotX0 = PAD + 30;
  const plotY0 = PAD + 22;
  const plotX1 = W - PAD - 8;
  const plotY1 = H - PAD - 18;
  const plotW = plotX1 - plotX0;
  const plotH = plotY1 - plotY0;

  drawSectionTitle(ctx, PAD, PAD - 2, "ρ / ρ_crit  vs  SCALE FACTOR", tokens.textMute);

  // log10(ρ) range. At a=1e-6, radiation ~ Ω_r·1e24 ≈ 1e20; at a=10, ρ_Λ≈0.69.
  const LOG_RHO_MIN = -1; // ρ_Λ ≈ 0.69 floor
  const LOG_RHO_MAX = 21;

  const ax = (la: number) =>
    plotX0 + ((la - LOG_A_MIN) / (LOG_A_MAX - LOG_A_MIN)) * plotW;
  const ry = (lr: number) =>
    plotY1 - ((lr - LOG_RHO_MIN) / (LOG_RHO_MAX - LOG_RHO_MIN)) * plotH;

  // Grid (vertical = decades of a, horizontal = decades of ρ)
  ctx.strokeStyle = tokens.grid;
  ctx.lineWidth = 1;
  for (let la = LOG_A_MIN; la <= LOG_A_MAX; la++) {
    const x = ax(la);
    ctx.beginPath();
    ctx.moveTo(x, plotY0);
    ctx.lineTo(x, plotY1);
    ctx.stroke();
  }
  // Axes
  ctx.strokeStyle = tokens.axes;
  ctx.beginPath();
  ctx.moveTo(plotX0, plotY0);
  ctx.lineTo(plotX0, plotY1);
  ctx.lineTo(plotX1, plotY1);
  ctx.stroke();

  // x labels (a = 10^la)
  ctx.fillStyle = tokens.textMute;
  ctx.font = FONT_HUD_SMALL;
  ctx.textAlign = "center";
  ctx.textBaseline = "top";
  for (let la = LOG_A_MIN; la <= LOG_A_MAX; la += 1) {
    ctx.fillText(`10${supExp(la)}`, ax(la), plotY1 + 4);
  }

  // Component curves
  const N = 220;
  const drawCurve = (
    fn: (a: number) => number,
    color: string,
    lw: number,
  ) => {
    ctx.strokeStyle = color;
    ctx.lineWidth = lw;
    ctx.beginPath();
    let started = false;
    for (let i = 0; i <= N; i++) {
      const la = LOG_A_MIN + (i / N) * (LOG_A_MAX - LOG_A_MIN);
      const a = Math.pow(10, la);
      const rho = fn(a);
      if (rho <= 0) continue;
      const lr = Math.log10(rho);
      const x = ax(la);
      const y = ry(Math.max(LOG_RHO_MIN, Math.min(LOG_RHO_MAX, lr)));
      if (!started) {
        ctx.moveTo(x, y);
        started = true;
      } else ctx.lineTo(x, y);
    }
    ctx.stroke();
  };

  drawCurve((a) => CONCORDANCE.omegaR / a ** 4, tokens.magenta, 2);
  drawCurve((a) => CONCORDANCE.omegaM / a ** 3, tokens.cyan, 2);
  drawCurve(() => CONCORDANCE.omegaLambda, tokens.amber, 2);

  // Equality guides
  const aEqRM = equalityScaleMatterRadiation(CONCORDANCE);
  const aEqML = equalityScaleMatterLambda(CONCORDANCE);
  const guide = (a: number, label: string, z: string) => {
    const x = ax(Math.log10(a));
    ctx.strokeStyle = hexToRgba(tokens.textFaint, 0.9);
    ctx.setLineDash([3, 3]);
    ctx.beginPath();
    ctx.moveTo(x, plotY0);
    ctx.lineTo(x, plotY1);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = tokens.textMute;
    ctx.save();
    ctx.translate(x + 3, plotY0 + 4);
    ctx.textAlign = "left";
    ctx.textBaseline = "top";
    ctx.fillText(label, 0, 0);
    ctx.fillText(z, 0, 12);
    ctx.restore();
  };
  guide(aEqRM, "ρ_r = ρ_m", "z≈3400");
  guide(aEqML, "ρ_m = ρ_Λ", "z≈0.3");

  // Legend
  const legendX = plotX0 + 8;
  let legendY = plotY0 + 4;
  const legendItem = (color: string, text: string) => {
    ctx.fillStyle = color;
    ctx.fillRect(legendX, legendY + 3, 12, 3);
    ctx.fillStyle = tokens.textDim;
    ctx.font = FONT_HUD_SMALL;
    ctx.textAlign = "left";
    ctx.textBaseline = "top";
    ctx.fillText(text, legendX + 18, legendY);
    legendY += 14;
  };
  legendItem(tokens.magenta, "radiation  ∝ a⁻⁴");
  legendItem(tokens.cyan, "matter  ∝ a⁻³");
  legendItem(tokens.amber, "Λ  = const");

  // Cursor
  const cx = ax(cursorLogA);
  ctx.strokeStyle = tokens.textBright;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(cx, plotY0);
  ctx.lineTo(cx, plotY1);
  ctx.stroke();
}

function supExp(n: number): string {
  const map: Record<string, string> = {
    "-": "⁻", "0": "⁰", "1": "¹", "2": "²", "3": "³", "4": "⁴",
    "5": "⁵", "6": "⁶", "7": "⁷", "8": "⁸", "9": "⁹",
  };
  return String(n)
    .split("")
    .map((c) => map[c] ?? c)
    .join("");
}
