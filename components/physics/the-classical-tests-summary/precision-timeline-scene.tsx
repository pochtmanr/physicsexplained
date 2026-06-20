"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  applyDpr,
  hexToRgba,
  SCENE_CANVAS_CLASS,
  SCENE_HEIGHT_DEFAULT,
  useSceneSize,
  useSceneTokens,
  type SceneTokens,
} from "@/components/physics/_shared/scene-tokens";
import {
  classicalTests,
  precisionHistory,
  type PrecisionPoint,
} from "@/lib/physics/relativity/the-classical-tests-summary";

/**
 * FIG.43b — Precision over a century, log scale.
 *
 * One descending polyline per test on a year (x) vs fractional-agreement
 * (y, log10) plot. Every line marches downward and to the right: each test
 * has only ever gotten tighter. Toggle individual tests on/off with the
 * legend buttons; hover/selected points show a milestone label.
 *
 * Y axis is log10(precision): top of the plot is 10⁻¹ (10% agreement),
 * bottom is 10⁻⁵ (five nines). The 1915 birth of GR sits at the far left.
 */

const PAD = 16;
const Y0_EXP = -1; // top of plot: 10^-1
const Y1_EXP = -5.3; // bottom of plot: ~10^-5
const X0_YEAR = 1915;
const X1_YEAR = 2025;

type ColorKey = "cyan" | "amber" | "mint" | "magenta";
const TEST_COLOR: Record<string, ColorKey> = {
  perihelion: "cyan",
  deflection: "amber",
  redshift: "mint",
  shapiro: "magenta",
};

export function PrecisionTimelineScene() {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const tokens = useSceneTokens();
  const tests = useMemo(() => classicalTests(), []);
  const history = useMemo(() => precisionHistory(), []);
  const [active, setActive] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(tests.map((t) => [t.id, true])),
  );
  const { width, height } = useSceneSize(containerRef, {
    ratio: 0.58,
    maxHeight: SCENE_HEIGHT_DEFAULT,
    minHeight: 300,
  });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = applyDpr(canvas, width, height);
    if (!ctx) return;
    draw(ctx, tokens, tests, history, active, width, height);
  }, [tokens, tests, history, active, width, height]);

  return (
    <div ref={containerRef} className="w-full pb-4">
      <canvas
        ref={canvasRef}
        className={SCENE_CANVAS_CLASS}
        style={{ width, height, display: "block" }}
        aria-label="Log-scale chart of measurement precision for the four classical tests of general relativity from 1915 to today. Every test improves over time."
      />
      <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 font-mono text-xs">
        {tests.map((t) => {
          const on = active[t.id];
          const cssVar = `var(--color-${TEST_COLOR[t.id]})`;
          return (
            <button
              key={t.id}
              type="button"
              onClick={() =>
                setActive((a) => ({ ...a, [t.id]: !a[t.id] }))
              }
              className="flex items-center gap-1.5"
              style={{ color: on ? cssVar : "var(--color-fg-4)" }}
            >
              <span
                className="inline-block h-2 w-2"
                style={{
                  background: on ? cssVar : "transparent",
                  border: `1px solid ${cssVar}`,
                }}
              />
              {t.name}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function xFor(year: number, plotX0: number, plotX1: number): number {
  const tt = (year - X0_YEAR) / (X1_YEAR - X0_YEAR);
  return plotX0 + tt * (plotX1 - plotX0);
}

function yFor(precision: number, plotY0: number, plotY1: number): number {
  const exp = Math.log10(precision);
  const tt = (exp - Y0_EXP) / (Y1_EXP - Y0_EXP);
  return plotY0 + tt * (plotY1 - plotY0);
}

function draw(
  ctx: CanvasRenderingContext2D,
  tokens: SceneTokens,
  tests: ReturnType<typeof classicalTests>,
  history: Record<string, readonly PrecisionPoint[]>,
  active: Record<string, boolean>,
  W: number,
  H: number,
) {
  ctx.fillStyle = tokens.bg;
  ctx.fillRect(0, 0, W, H);

  ctx.fillStyle = tokens.textDim;
  ctx.font = "bold 11px ui-monospace, monospace";
  ctx.textAlign = "left";
  ctx.textBaseline = "top";
  ctx.fillText("FRACTIONAL AGREEMENT WITH GR · 1915 → TODAY", PAD, PAD);

  const plotX0 = PAD + 44;
  const plotX1 = W - PAD - 8;
  const plotY0 = PAD + 26;
  const plotY1 = H - PAD - 28;

  // Y gridlines + labels (each power of ten)
  ctx.textAlign = "right";
  ctx.textBaseline = "middle";
  for (let e = -1; e >= -5; e--) {
    const y = yFor(Math.pow(10, e), plotY0, plotY1);
    ctx.strokeStyle = tokens.grid;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(plotX0, y);
    ctx.lineTo(plotX1, y);
    ctx.stroke();
    ctx.fillStyle = tokens.textFaint;
    ctx.font = "9px ui-monospace, monospace";
    ctx.fillText(`10^${e}`, plotX0 - 6, y);
  }

  // X gridlines + decade labels
  ctx.textAlign = "center";
  ctx.textBaseline = "top";
  for (let yr = 1920; yr <= 2020; yr += 20) {
    const x = xFor(yr, plotX0, plotX1);
    ctx.strokeStyle = hexToRgba(tokens.gridHeavy, 0.4);
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(x, plotY0);
    ctx.lineTo(x, plotY1);
    ctx.stroke();
    ctx.fillStyle = tokens.textFaint;
    ctx.font = "9px ui-monospace, monospace";
    ctx.fillText(String(yr), x, plotY1 + 6);
  }

  // Axes labels
  ctx.fillStyle = tokens.textMute;
  ctx.font = "9px ui-monospace, monospace";
  ctx.textAlign = "left";
  ctx.fillText("tighter ↓", plotX0 + 2, plotY1 - 14);

  // Polylines per active test
  for (const t of tests) {
    if (!active[t.id]) continue;
    const points = history[t.id];
    const color = tokens[TEST_COLOR[t.id]];

    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.beginPath();
    points.forEach((p, i) => {
      const x = xFor(p.year, plotX0, plotX1);
      const y = yFor(p.precision, plotY0, plotY1);
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.stroke();

    // Nodes + last-point milestone label
    points.forEach((p, i) => {
      const x = xFor(p.year, plotX0, plotX1);
      const y = yFor(p.precision, plotY0, plotY1);
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(x, y, 3, 0, Math.PI * 2);
      ctx.fill();
      if (i === points.length - 1) {
        ctx.fillStyle = color;
        ctx.font = "8px ui-monospace, monospace";
        ctx.textAlign = "right";
        ctx.textBaseline = "middle";
        ctx.fillText(p.label, x - 6, y);
      }
    });
  }
}
