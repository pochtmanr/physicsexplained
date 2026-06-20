"use client";

import { useEffect, useRef, useState } from "react";
import {
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
  precessionBudget,
  NEWTONIAN_PERTURBERS,
  mercuryPrecessionArcsecPerCentury,
} from "@/lib/physics/relativity/mercurys-perihelion";

/**
 * FIG.40b — The precession budget.
 *
 * Two side-by-side columns in arcsec/century. The MODEL column stacks the
 * Newtonian planetary tugs (~531″, broken out per perturber) topped by the GR
 * contribution (~43″). The OBSERVED column is a single bar at ~574″. A toggle
 * removes the GR slab so the reader sees the 43″ shortfall that defeated
 * Newtonian astronomy for half a century. Clicking a perturber highlights its
 * slab.
 */

const PAD = 20;

export function PrecessionBudgetScene() {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const tokens = useSceneTokens();
  const [grOn, setGrOn] = useState(true);
  const [selected, setSelected] = useState<string | null>(null);
  const { width, height } = useSceneSize(containerRef, {
    ratio: 0.6,
    maxHeight: SCENE_HEIGHT_DEFAULT,
    minHeight: 320,
  });

  const budget = precessionBudget();
  const grArcsec = mercuryPrecessionArcsecPerCentury();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = applyDpr(canvas, width, height);
    if (!ctx) return;
    draw(ctx, tokens, width, height, grOn, grArcsec, budget.observed_arcsec, selected);
  }, [tokens, width, height, grOn, grArcsec, budget.observed_arcsec, selected]);

  const modelTotal = grOn
    ? budget.newtonianPlanetary_arcsec + grArcsec
    : budget.newtonianPlanetary_arcsec;
  const residual = budget.observed_arcsec - modelTotal;

  return (
    <div ref={containerRef} className="relative w-full pb-4">
      <canvas
        ref={canvasRef}
        style={{ width, height, display: "block" }}
        className={SCENE_CANVAS_CLASS}
        aria-label="A stacked-bar comparison of Mercury's perihelion precession budget in arcseconds per century. The model bar stacks Newtonian planetary perturbations plus the general-relativistic contribution; the observed bar shows the measured value. A toggle removes the GR slab to reveal the 43-arcsecond shortfall."
      />
      <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 font-mono text-xs text-[var(--color-fg-2)]">
        <button
          type="button"
          onClick={() => setGrOn((v) => !v)}
          className="cursor-pointer border px-2 py-1"
          style={{
            borderColor: grOn ? "var(--color-magenta)" : "var(--color-fg-4)",
            color: grOn ? "var(--color-magenta)" : "var(--color-fg-3)",
          }}
        >
          GR (43″): {grOn ? "included" : "removed"}
        </button>
        <span className="text-[var(--color-fg-3)]">
          model {modelTotal.toFixed(1)}″ vs observed{" "}
          {budget.observed_arcsec.toFixed(1)}″ — residual{" "}
          <span
            style={{ color: Math.abs(residual) < 2 ? "var(--color-green)" : "var(--color-red)" }}
          >
            {residual >= 0 ? "+" : ""}
            {residual.toFixed(1)}″
          </span>
        </span>
      </div>
      <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 font-mono text-[11px] text-[var(--color-fg-3)]">
        {NEWTONIAN_PERTURBERS.map((p) => (
          <button
            key={p.body}
            type="button"
            className="cursor-pointer hover:text-[var(--color-fg-1)]"
            style={{
              color: selected === p.body ? "var(--color-cyan)" : undefined,
            }}
            onClick={() =>
              setSelected((s) => (s === p.body ? null : p.body))
            }
          >
            {p.body} {p.arcsec.toFixed(1)}″
          </button>
        ))}
      </div>
    </div>
  );
}

function draw(
  ctx: CanvasRenderingContext2D,
  tokens: SceneTokens,
  W: number,
  H: number,
  grOn: boolean,
  grArcsec: number,
  observed: number,
  selected: string | null,
) {
  ctx.fillStyle = tokens.bg;
  ctx.fillRect(0, 0, W, H);

  drawSectionTitle(ctx, PAD, 12, "PRECESSION BUDGET  (″ / CENTURY)", tokens.textMute);

  const plotY0 = 34;
  const plotY1 = H - 28;
  const plotH = plotY1 - plotY0;
  const maxVal = 620; // headroom above ~574
  const valToY = (v: number) => plotY1 - (v / maxVal) * plotH;
  const valToH = (v: number) => (v / maxVal) * plotH;

  // ── gridlines every 100″ ────────────────────────────────────────────────
  ctx.font = "10px ui-monospace, monospace";
  ctx.textAlign = "right";
  ctx.textBaseline = "middle";
  for (let v = 0; v <= 600; v += 100) {
    const y = valToY(v);
    ctx.strokeStyle = hexToRgba(tokens.gridHeavy, 0.25);
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(PAD + 38, y);
    ctx.lineTo(W - PAD, y);
    ctx.stroke();
    ctx.fillStyle = tokens.textFaint;
    ctx.fillText(`${v}`, PAD + 34, y);
  }

  const barW = Math.min(120, (W - PAD * 2 - 38) * 0.28);
  const x0 = PAD + 38 + (W - PAD * 2 - 38) * 0.18;
  const x1 = PAD + 38 + (W - PAD * 2 - 38) * 0.6;

  // ── MODEL column (stacked) ──────────────────────────────────────────────
  let stackBase = plotY1;
  // Newtonian perturbers stacked from the bottom.
  const colors = [
    tokens.cyan,
    tokens.blue,
    tokens.mint,
    tokens.green,
    tokens.purple,
    tokens.textFaint,
  ];
  NEWTONIAN_PERTURBERS.forEach((p, i) => {
    const h = valToH(p.arcsec);
    const top = stackBase - h;
    const isSel = selected === p.body;
    const base = colors[i % colors.length];
    ctx.fillStyle = isSel ? base : hexToRgba(base, 0.55);
    ctx.fillRect(x0, top, barW, h);
    if (isSel) {
      ctx.strokeStyle = tokens.textBright;
      ctx.lineWidth = 1.5;
      ctx.strokeRect(x0, top, barW, h);
    }
    if (h > 12) {
      ctx.fillStyle = tokens.bg;
      ctx.font = "10px ui-monospace, monospace";
      ctx.textAlign = "left";
      ctx.textBaseline = "middle";
      ctx.fillText(p.body, x0 + 5, top + h / 2);
    }
    stackBase = top;
  });

  // GR slab on top
  if (grOn) {
    const h = valToH(grArcsec);
    const top = stackBase - h;
    ctx.fillStyle = tokens.magenta;
    ctx.fillRect(x0, top, barW, h);
    // glow to draw the eye
    ctx.save();
    ctx.shadowColor = tokens.magenta;
    ctx.shadowBlur = 12;
    ctx.strokeStyle = tokens.magenta;
    ctx.lineWidth = 1;
    ctx.strokeRect(x0, top, barW, h);
    ctx.restore();
    ctx.fillStyle = tokens.textBright;
    ctx.font = "11px ui-monospace, monospace";
    ctx.textAlign = "left";
    ctx.textBaseline = "middle";
    ctx.fillText("GR +43″", x0 + barW + 8, top + h / 2);
    stackBase = top;
  } else {
    // Show the shortfall as a hollow dashed slab up to the observed line.
    const obsY = valToY(observed);
    ctx.strokeStyle = hexToRgba(tokens.red, 0.9);
    ctx.lineWidth = 1.5;
    ctx.setLineDash([5, 4]);
    ctx.strokeRect(x0, obsY, barW, stackBase - obsY);
    ctx.setLineDash([]);
    ctx.fillStyle = tokens.red;
    ctx.font = "11px ui-monospace, monospace";
    ctx.textAlign = "left";
    ctx.textBaseline = "middle";
    ctx.fillText("43″ gap", x0 + barW + 8, (obsY + stackBase) / 2);
  }

  // model total label
  ctx.fillStyle = tokens.textMute;
  ctx.font = "11px ui-monospace, monospace";
  ctx.textAlign = "center";
  ctx.textBaseline = "top";
  ctx.fillText("MODEL", x0 + barW / 2, plotY1 + 6);

  // ── OBSERVED column ─────────────────────────────────────────────────────
  const obsY = valToY(observed);
  ctx.fillStyle = hexToRgba(tokens.amber, 0.7);
  ctx.fillRect(x1, obsY, barW, plotY1 - obsY);
  ctx.strokeStyle = tokens.amber;
  ctx.lineWidth = 1;
  ctx.strokeRect(x1, obsY, barW, plotY1 - obsY);
  ctx.fillStyle = tokens.textBright;
  ctx.font = "11px ui-monospace, monospace";
  ctx.textAlign = "center";
  ctx.textBaseline = "bottom";
  ctx.fillText(`${observed.toFixed(0)}″`, x1 + barW / 2, obsY - 4);
  ctx.fillStyle = tokens.textMute;
  ctx.textBaseline = "top";
  ctx.fillText("OBSERVED", x1 + barW / 2, plotY1 + 6);

  // ── observed reference line across the plot ─────────────────────────────
  ctx.strokeStyle = hexToRgba(tokens.amber, 0.5);
  ctx.lineWidth = 1;
  ctx.setLineDash([2, 3]);
  ctx.beginPath();
  ctx.moveTo(PAD + 38, obsY);
  ctx.lineTo(W - PAD, obsY);
  ctx.stroke();
  ctx.setLineDash([]);
}
