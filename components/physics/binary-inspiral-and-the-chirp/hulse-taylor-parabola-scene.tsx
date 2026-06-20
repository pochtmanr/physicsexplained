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
import {
  cumulativePeriastronShift,
  HULSE_TAYLOR,
} from "@/lib/physics/relativity/binary-inspiral-and-the-chirp";
import { Button } from "@/components/ui/button";

/**
 * FIG.52c — Hulse–Taylor cumulative periastron shift.
 *
 * The iconic figure of indirect gravitational-wave detection: the cumulative
 * shift in the time of periastron of PSR B1913+16 accumulates as a downward
 * parabola, ΔT = ½ (Ṗ/P₀) t². The solid GR curve is computed from the measured
 * orbital period and the GR-predicted Ṗ. Scattered "measured" points (with
 * error bars) fall on the curve. A slider tilts the predicted Ṗ away from the
 * GR value: a flat line (Ṗ=0) is "no gravitational waves" and visibly misses
 * the data — the way the real measurement ruled it out by 1983.
 */

const YEAR_S = 365.25 * 86400;
const T_SPAN_YEARS = 35; // 1974 → 2009
const START_YEAR = 1975;

// Synthetic-but-realistic data points: years since 1975 with the true GR
// cumulative shift plus a fixed pseudo-random jitter so they look measured.
const DATA_YEARS = [0, 3, 6, 9, 12, 15, 18, 21, 24, 27, 30, 33];
const JITTER = [0.4, -0.6, 0.3, -0.2, 0.7, -0.5, 0.2, -0.4, 0.5, -0.3, 0.6, -0.5];

export function HulseTaylorParabolaScene() {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const tokens = useSceneTokens();
  // factor multiplying the GR-predicted Ṗ; 1.0 = pure GR, 0 = no radiation.
  const [pdotFactor, setPdotFactor] = useState(1.0);

  const data = useMemo(() => {
    const { period_s, PdotGR } = HULSE_TAYLOR;
    return DATA_YEARS.map((yr, i) => {
      const t = yr * YEAR_S;
      const shift = cumulativePeriastronShift(t, period_s, PdotGR);
      // jitter is in seconds; scale to the magnitude of the late points
      return { yr, shift: shift + JITTER[i], err: 0.8 };
    });
  }, []);

  const { width, height } = useSceneSize(containerRef, {
    ratio: 0.6,
    maxHeight: SCENE_HEIGHT_DEFAULT,
    minHeight: 320,
  });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = applyDpr(canvas, width, height);
    if (!ctx) return;
    draw(ctx, tokens, width, height, data, pdotFactor);
  }, [tokens, width, height, data, pdotFactor]);

  return (
    <div ref={containerRef} className="relative w-full pb-4">
      <canvas
        ref={canvasRef}
        style={{ width, height, display: "block" }}
        className={SCENE_CANVAS_CLASS}
        aria-label="Cumulative shift of periastron time for the Hulse–Taylor binary pulsar versus year. The general-relativity parabola passes through the measured points. A slider tilts the predicted period decay away from the GR value to show the no-radiation hypothesis fails."
      />
      <div className="mt-3 flex flex-col gap-2 font-mono text-xs text-[var(--color-fg-2)]">
        <div className="flex items-center gap-3">
          <span className="w-52 shrink-0">
            Ṗ / Ṗ_GR: {pdotFactor.toFixed(2)}
            {pdotFactor === 0 ? "  (no waves)" : pdotFactor === 1 ? "  (GR)" : ""}
          </span>
          <input
            type="range"
            min={0}
            max={1.6}
            step={0.01}
            value={pdotFactor}
            onChange={(e) => setPdotFactor(parseFloat(e.target.value))}
            className="flex-1"
            style={{ accentColor: "var(--color-cyan)" }}
          />
        </div>
        <div className="flex flex-wrap gap-1">
          {[0, 1, 1.3].map((v) => (
            <Button
              key={v}
              size="sm"
              active={pdotFactor === v}
              onClick={() => setPdotFactor(v)}
            >
              {v === 0 ? "no radiation" : v === 1 ? "general relativity" : "13% too fast"}
            </Button>
          ))}
        </div>
      </div>
    </div>
  );
}

function draw(
  ctx: CanvasRenderingContext2D,
  tokens: SceneTokens,
  W: number,
  H: number,
  data: { yr: number; shift: number; err: number }[],
  pdotFactor: number,
) {
  ctx.fillStyle = tokens.bg;
  ctx.fillRect(0, 0, W, H);

  const PAD = 16;
  const plotX0 = PAD + 48;
  const plotX1 = W - PAD - 12;
  const plotY0 = PAD + 24;
  const plotY1 = H - PAD - 30;

  ctx.strokeStyle = tokens.panelBorder;
  ctx.lineWidth = 1;
  ctx.strokeRect(PAD, PAD, W - PAD * 2, H - PAD * 2);
  drawSectionTitle(
    ctx,
    PAD + 6,
    PAD + 6,
    "PSR B1913+16 — CUMULATIVE PERIASTRON SHIFT",
    tokens.textMute,
  );

  const { period_s, PdotGR } = HULSE_TAYLOR;
  // y-range: the GR shift at the end of the span (most negative)
  const tEnd = T_SPAN_YEARS * YEAR_S;
  const yMin = cumulativePeriastronShift(tEnd, period_s, PdotGR) * 1.05; // negative
  const yMax = 2;

  const xOf = (yr: number) => plotX0 + (yr / T_SPAN_YEARS) * (plotX1 - plotX0);
  const yOf = (s: number) =>
    plotY0 + ((yMax - s) / (yMax - yMin)) * (plotY1 - plotY0);

  // axes
  ctx.strokeStyle = tokens.axes;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(plotX0, plotY0);
  ctx.lineTo(plotX0, plotY1);
  ctx.lineTo(plotX1, plotY1);
  ctx.stroke();

  // zero line
  ctx.strokeStyle = hexToRgba(tokens.gridHeavy, 0.5);
  ctx.beginPath();
  ctx.moveTo(plotX0, yOf(0));
  ctx.lineTo(plotX1, yOf(0));
  ctx.stroke();

  // y-axis label
  ctx.save();
  ctx.font = FONT_HUD_SMALL;
  ctx.fillStyle = tokens.textMute;
  ctx.textAlign = "center";
  ctx.translate(PAD + 12, (plotY0 + plotY1) / 2);
  ctx.rotate(-Math.PI / 2);
  ctx.fillText("shift (s)", 0, 0);
  ctx.restore();

  // x ticks (years)
  ctx.font = FONT_HUD_SMALL;
  ctx.fillStyle = tokens.textMute;
  ctx.textAlign = "center";
  ctx.textBaseline = "top";
  for (let yr = 0; yr <= T_SPAN_YEARS; yr += 5) {
    const x = xOf(yr);
    ctx.strokeStyle = tokens.axes;
    ctx.beginPath();
    ctx.moveTo(x, plotY1);
    ctx.lineTo(x, plotY1 + 3);
    ctx.stroke();
    ctx.fillText(`${START_YEAR + yr}`, x, plotY1 + 6);
  }

  // GR parabola (faint reference, always shown)
  const drawCurve = (factor: number, color: string, lw: number, dash: number[]) => {
    ctx.strokeStyle = color;
    ctx.lineWidth = lw;
    ctx.setLineDash(dash);
    ctx.beginPath();
    for (let yr = 0; yr <= T_SPAN_YEARS; yr += 0.4) {
      const t = yr * YEAR_S;
      const s = cumulativePeriastronShift(t, period_s, PdotGR * factor);
      const px = xOf(yr);
      const py = yOf(s);
      if (yr === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.stroke();
    ctx.setLineDash([]);
  };

  // GR reference (mint) thin
  drawCurve(1, hexToRgba(tokens.mint, 0.55), 1, [4, 3]);
  // user-selected prediction (cyan) bold
  drawCurve(pdotFactor, tokens.cyan, 2, []);

  // data points with error bars (amber)
  ctx.strokeStyle = tokens.amber;
  ctx.fillStyle = tokens.amber;
  for (const d of data) {
    const px = xOf(d.yr);
    const py = yOf(d.shift);
    const eTop = yOf(d.shift + d.err);
    const eBot = yOf(d.shift - d.err);
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(px, eTop);
    ctx.lineTo(px, eBot);
    ctx.moveTo(px - 3, eTop);
    ctx.lineTo(px + 3, eTop);
    ctx.moveTo(px - 3, eBot);
    ctx.lineTo(px + 3, eBot);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(px, py, 2.5, 0, Math.PI * 2);
    ctx.fill();
  }

  // legend
  ctx.textAlign = "left";
  ctx.textBaseline = "top";
  const lx = plotX0 + 8;
  let ly = plotY0 + 4;
  const legend = (color: string, label: string) => {
    ctx.fillStyle = color;
    ctx.fillRect(lx, ly + 3, 10, 3);
    ctx.fillStyle = tokens.textDim;
    ctx.fillText(label, lx + 16, ly);
    ly += 14;
  };
  legend(hexToRgba(tokens.mint, 0.8), "GR prediction");
  legend(tokens.cyan, "selected Ṗ");
  legend(tokens.amber, "measured");
}
