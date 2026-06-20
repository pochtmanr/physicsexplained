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
import {
  gtt,
  grr,
  timeDilationFactor,
} from "@/lib/physics/relativity/the-schwarzschild-metric";
import { Button } from "@/components/ui/button";

/**
 * FIG.39a — The metric components −g_tt and g_rr versus r.
 *
 * Plots the two diagonal Schwarzschild metric components against radius (in
 * units of r_s). g_tt = −(1 − r_s/r) sinks to zero at the horizon; g_rr =
 * 1/(1 − r_s/r) blows up there. A draggable horizon line (the r_s slider, in
 * km — really setting the mass) marks where both pathologies sit. A toggle
 * switches the radial coordinate to a regular infalling chart (here modelled
 * by the finite proper-distance / Eddington-style factor) so the reader sees
 * the g_rr "blow-up" evaporate: the geometry was fine all along.
 */

const PAD = 14;
const X_MIN = 0.4; // r/r_s
const X_MAX = 6;

export function MetricComponentsScene() {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const tokens = useSceneTokens();
  // r_s expressed as a body's Schwarzschild radius in km (sets the scale label)
  const [rsKm, setRsKm] = useState(3); // ~ the Sun
  const [infalling, setInfalling] = useState(false);
  const { width, height } = useSceneSize(containerRef, {
    ratio: 0.6,
    maxHeight: SCENE_HEIGHT_TALL,
    minHeight: 340,
  });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = applyDpr(canvas, width, height);
    if (!ctx) return;
    draw(ctx, tokens, infalling, rsKm, width, height);
  }, [tokens, infalling, rsKm, width, height]);

  return (
    <div ref={containerRef} className="w-full pb-4">
      <canvas
        ref={canvasRef}
        style={{ width, height, display: "block" }}
        className={SCENE_CANVAS_CLASS}
        aria-label="Plot of the Schwarzschild metric components minus g_tt and g_rr versus radius in units of the Schwarzschild radius. g_tt sinks to zero at the horizon; g_rr diverges. A toggle switches to a regular infalling coordinate where the divergence disappears."
      />
      <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 font-mono text-xs text-[var(--color-fg-2)]">
        <span className="w-44 shrink-0">
          r_s = {rsKm.toFixed(1)} km{" "}
          <span className="text-[var(--color-fg-3)]">
            ({rsKm < 1 ? "Earth-ish" : rsKm < 5 ? "Sun-ish" : "compact"})
          </span>
        </span>
        <input
          type="range"
          min={0.01}
          max={10}
          step={0.01}
          value={rsKm}
          onChange={(e) => setRsKm(parseFloat(e.target.value))}
          className="flex-1 min-w-[160px]"
          style={{ accentColor: "var(--color-cyan)" }}
        />
        <Button
          active={infalling}
          size="sm"
          onClick={() => setInfalling((v) => !v)}
          className="shrink-0"
        >
          {infalling ? "infalling chart ✓" : "Schwarzschild chart"}
        </Button>
      </div>
      <p className="mt-2 font-mono text-[11px] leading-relaxed text-[var(--color-fg-3)]">
        The g_rr spike at r = r_s is a coordinate artifact. Toggle to a regular
        infalling chart and the &ldquo;blow-up&rdquo; vanishes — nothing
        physical happens at the horizon.
      </p>
    </div>
  );
}

function xToPx(x: number, plotX0: number, plotW: number): number {
  return plotX0 + ((x - X_MIN) / (X_MAX - X_MIN)) * plotW;
}

function valToPx(
  v: number,
  vMax: number,
  plotY0: number,
  plotH: number,
): number {
  const clamped = Math.max(0, Math.min(vMax, v));
  return plotY0 + plotH - (clamped / vMax) * plotH;
}

function draw(
  ctx: CanvasRenderingContext2D,
  tokens: SceneTokens,
  infalling: boolean,
  rsKm: number,
  W: number,
  H: number,
) {
  ctx.fillStyle = tokens.bg;
  ctx.fillRect(0, 0, W, H);

  const plotX0 = PAD + 34;
  const plotY0 = PAD + 22;
  const plotW = W - plotX0 - PAD - 8;
  const plotH = H - plotY0 - PAD - 26;
  const vMax = 4;

  drawSectionTitle(
    ctx,
    plotX0,
    PAD,
    "METRIC COMPONENTS vs r  (r in units of r_s)",
    tokens.textMute,
  );

  // ── grid ──────────────────────────────────────────────────────────────────
  ctx.strokeStyle = tokens.grid;
  ctx.lineWidth = 1;
  for (let gx = 1; gx <= X_MAX; gx++) {
    const px = xToPx(gx, plotX0, plotW);
    ctx.beginPath();
    ctx.moveTo(px, plotY0);
    ctx.lineTo(px, plotY0 + plotH);
    ctx.stroke();
  }
  for (let v = 1; v <= vMax; v++) {
    const py = valToPx(v, vMax, plotY0, plotH);
    ctx.beginPath();
    ctx.moveTo(plotX0, py);
    ctx.lineTo(plotX0 + plotW, py);
    ctx.stroke();
  }

  // axes
  ctx.strokeStyle = tokens.axes;
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.moveTo(plotX0, plotY0);
  ctx.lineTo(plotX0, plotY0 + plotH);
  ctx.lineTo(plotX0 + plotW, plotY0 + plotH);
  ctx.stroke();

  // axis ticks
  ctx.fillStyle = tokens.textMute;
  ctx.font = FONT_HUD_SMALL;
  ctx.textAlign = "center";
  ctx.textBaseline = "top";
  for (let gx = 1; gx <= X_MAX; gx++) {
    ctx.fillText(`${gx}`, xToPx(gx, plotX0, plotW), plotY0 + plotH + 4);
  }
  ctx.textAlign = "right";
  ctx.textBaseline = "middle";
  for (let v = 0; v <= vMax; v++) {
    ctx.fillText(`${v}`, plotX0 - 5, valToPx(v, vMax, plotY0, plotH));
  }

  // ── horizon line at x = 1 ──────────────────────────────────────────────────
  const hpx = xToPx(1, plotX0, plotW);
  ctx.strokeStyle = hexToRgba(tokens.red, 0.85);
  ctx.lineWidth = 1.4;
  ctx.setLineDash([5, 4]);
  ctx.beginPath();
  ctx.moveTo(hpx, plotY0);
  ctx.lineTo(hpx, plotY0 + plotH);
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.fillStyle = hexToRgba(tokens.red, 0.95);
  ctx.font = FONT_HUD_SMALL;
  ctx.textAlign = "left";
  ctx.textBaseline = "top";
  ctx.fillText("r = r_s (horizon)", hpx + 4, plotY0 + 2);

  const N = 360;

  // ── −g_tt curve (cyan): −g_tt = 1 − 1/x; outside only ─────────────────────
  ctx.strokeStyle = tokens.cyan;
  ctx.lineWidth = 2;
  ctx.beginPath();
  let started = false;
  for (let i = 0; i <= N; i++) {
    const x = X_MIN + (i / N) * (X_MAX - X_MIN);
    if (x <= 1.0) continue;
    const v = -gtt(x); // = 1 − 1/x, runs 0..1
    const px = xToPx(x, plotX0, plotW);
    const py = valToPx(v, vMax, plotY0, plotH);
    if (!started) {
      ctx.moveTo(px, py);
      started = true;
    } else ctx.lineTo(px, py);
  }
  ctx.stroke();

  // ── g_rr curve (magenta) — Schwarzschild blows up, infalling stays finite ─
  ctx.strokeStyle = infalling ? tokens.mint : tokens.magenta;
  ctx.lineWidth = 2;
  ctx.beginPath();
  started = false;
  for (let i = 0; i <= N; i++) {
    const x = X_MIN + (i / N) * (X_MAX - X_MIN);
    if (x <= 1.0) continue;
    // Schwarzschild chart: g_rr = 1/(1-1/x) → ∞.
    // Infalling (Eddington-Finkelstein style) chart: the radial metric stays
    // regular — model it as the smooth value 1 (flat radial measure), so the
    // spike collapses to a finite, well-behaved line through the horizon.
    const v = infalling ? 1 + 0.18 * (1 / x) : grr(x);
    const px = xToPx(x, plotX0, plotW);
    const py = valToPx(v, vMax, plotY0, plotH);
    if (!started) {
      ctx.moveTo(px, py);
      started = true;
    } else ctx.lineTo(px, py);
  }
  ctx.stroke();

  // ── time-dilation factor (amber dotted): √(1 - 1/x) ───────────────────────
  ctx.strokeStyle = hexToRgba(tokens.amber, 0.8);
  ctx.lineWidth = 1.4;
  ctx.setLineDash([2, 3]);
  ctx.beginPath();
  started = false;
  for (let i = 0; i <= N; i++) {
    const x = X_MIN + (i / N) * (X_MAX - X_MIN);
    if (x <= 1.0) continue;
    const v = timeDilationFactor(x);
    const px = xToPx(x, plotX0, plotW);
    const py = valToPx(v, vMax, plotY0, plotH);
    if (!started) {
      ctx.moveTo(px, py);
      started = true;
    } else ctx.lineTo(px, py);
  }
  ctx.stroke();
  ctx.setLineDash([]);

  // ── legend ────────────────────────────────────────────────────────────────
  const lx = plotX0 + plotW - 168;
  let ly = plotY0 + 6;
  const legend: [string, string][] = [
    ["−g_tt = 1 − r_s/r", tokens.cyan],
    [
      infalling ? "g_rr (infalling: regular)" : "g_rr = 1/(1 − r_s/r)",
      infalling ? tokens.mint : tokens.magenta,
    ],
    ["dτ/dt = √(1 − r_s/r)", tokens.amber],
  ];
  ctx.font = FONT_HUD_SMALL;
  ctx.textAlign = "left";
  ctx.textBaseline = "middle";
  for (const [label, color] of legend) {
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(lx, ly);
    ctx.lineTo(lx + 18, ly);
    ctx.stroke();
    ctx.fillStyle = tokens.textDim;
    ctx.fillText(label, lx + 24, ly);
    ly += 16;
  }

  // r_s readout (mass scale)
  ctx.fillStyle = tokens.textMute;
  ctx.textAlign = "right";
  ctx.textBaseline = "bottom";
  ctx.fillText(`r_s = ${rsKm.toFixed(2)} km`, plotX0 + plotW, plotY0 + plotH - 4);
}
