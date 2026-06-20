"use client";

import { useEffect, useRef, useState } from "react";
import {
  FONT_HUD_SMALL,
  SCENE_CANVAS_CLASS,
  SCENE_HEIGHT_DEFAULT,
  applyDpr,
  hexToRgba,
  drawHudReadout,
  drawSectionTitle,
  useSceneSize,
  useSceneTokens,
  type SceneTokens,
} from "@/components/physics/_shared/scene-tokens";
import { Button } from "@/components/ui/button";
import { hubbleVelocity } from "@/lib/physics/relativity/hubble-and-cosmological-redshift";

/**
 * FIG.56a — Hubble's 1929 diagram vs the modern Hubble flow.
 *
 * The famous scatter plot: recession velocity (km/s) on the vertical axis,
 * distance (Mpc) on the horizontal. Hubble's 24 original galaxies are plotted
 * with their real scatter; his fitted line had a slope (his "Hubble constant")
 * of ≈ 500 km/s/Mpc — wildly wrong because his Cepheid distances were too
 * small. A toggle overlays the MODERN Hubble flow: a tighter cloud out to far
 * larger distances with the true slope H₀ ≈ 70 km/s/Mpc. The viewer sees both
 * the discovery and how badly the original calibration erred — and that the
 * LINEAR law itself was right all along.
 */

const PAD = 14;

// Hubble's 1929 nebulae: [distance Mpc, velocity km/s] (representative of the
// published 24-point table; values rounded). Distances are ~7× too small.
const HUBBLE_1929: [number, number][] = [
  [0.032, 170], [0.034, 290], [0.214, -130], [0.263, -70],
  [0.275, -185], [0.275, -220], [0.45, 200], [0.5, 290],
  [0.5, 270], [0.63, 200], [0.8, 300], [0.9, -30],
  [0.9, 650], [0.9, 150], [0.9, 500], [1.0, 920],
  [1.1, 450], [1.1, 500], [1.4, 500], [1.7, 960],
  [2.0, 500], [2.0, 850], [2.0, 800], [2.0, 1090],
];
const HUBBLE_1929_SLOPE = 465; // km/s/Mpc, his erroneous fit

// Modern Hubble flow: a tight Gaussian scatter about v = H0 d out to 0.04c.
const MODERN_H0 = 70; // km/s/Mpc
function buildModern(): [number, number][] {
  const pts: [number, number][] = [];
  let seed = 7;
  const rng = () => {
    seed = (seed * 1103515245 + 12345) & 0x7fffffff;
    return seed / 0x7fffffff;
  };
  for (let i = 0; i < 90; i++) {
    const d = 2 + rng() * 158; // 2 → 160 Mpc
    const noise = (rng() - 0.5) * 900; // peculiar-velocity scatter
    pts.push([d, MODERN_H0 * d + noise]);
  }
  return pts;
}
const MODERN = buildModern();

type Mode = "1929" | "both";

export function Hubble1929DiagramScene() {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const tokens = useSceneTokens();
  const [mode, setMode] = useState<Mode>("1929");
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
    draw(ctx, tokens, mode, width, height);
  }, [tokens, mode, width, height]);

  return (
    <div ref={containerRef} className="w-full pb-4">
      <canvas
        ref={canvasRef}
        style={{ width, height, display: "block" }}
        className={SCENE_CANVAS_CLASS}
        aria-label="Velocity-distance diagram. Hubble's original 1929 data of 24 galaxies with a steep, scattered fit; a toggle overlays the modern Hubble flow with the correct shallower slope at much larger distances."
      />
      <div className="mt-3 flex flex-wrap gap-2 font-mono text-xs">
        {(
          [
            ["1929", "Hubble 1929 (24 galaxies)"],
            ["both", "+ modern Hubble flow"],
          ] as [Mode, string][]
        ).map(([m, label]) => (
          <Button
            key={m}
            size="sm"
            active={mode === m}
            onClick={() => setMode(m)}
          >
            {label}
          </Button>
        ))}
      </div>
    </div>
  );
}

function draw(
  ctx: CanvasRenderingContext2D,
  tokens: SceneTokens,
  mode: Mode,
  W: number,
  H: number,
) {
  ctx.fillStyle = tokens.bg;
  ctx.fillRect(0, 0, W, H);

  const both = mode === "both";

  // Axis ranges adapt: zoom out when the modern flow is shown.
  const dMax = both ? 170 : 2.2;
  const vMax = both ? 12500 : 1300;
  const vMin = -400;

  const plotX0 = PAD + 52;
  const plotY0 = PAD + 18;
  const plotX1 = W - PAD - 8;
  const plotY1 = H - PAD - 28;
  const plotW = plotX1 - plotX0;
  const plotH = plotY1 - plotY0;

  const xOf = (d: number) => plotX0 + (d / dMax) * plotW;
  const yOf = (v: number) => plotY1 - ((v - vMin) / (vMax - vMin)) * plotH;

  drawSectionTitle(
    ctx,
    plotX0,
    PAD - 2,
    both ? "VELOCITY–DISTANCE  (1929 + MODERN)" : "VELOCITY–DISTANCE  (HUBBLE 1929)",
    tokens.textMute,
  );

  // ── grid ──
  ctx.strokeStyle = tokens.grid;
  ctx.lineWidth = 1;
  const xTicks = both ? 5 : 4;
  for (let i = 0; i <= xTicks; i++) {
    const d = (dMax * i) / xTicks;
    const x = xOf(d);
    ctx.beginPath();
    ctx.moveTo(x, plotY0);
    ctx.lineTo(x, plotY1);
    ctx.stroke();
  }
  const yTicks = 5;
  for (let i = 0; i <= yTicks; i++) {
    const v = vMin + ((vMax - vMin) * i) / yTicks;
    const y = yOf(v);
    ctx.beginPath();
    ctx.moveTo(plotX0, y);
    ctx.lineTo(plotX1, y);
    ctx.stroke();
  }

  // zero-velocity line
  ctx.strokeStyle = tokens.gridHeavy;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(plotX0, yOf(0));
  ctx.lineTo(plotX1, yOf(0));
  ctx.stroke();

  // ── axes labels ──
  ctx.fillStyle = tokens.textMute;
  ctx.font = FONT_HUD_SMALL;
  ctx.textAlign = "center";
  ctx.textBaseline = "top";
  ctx.fillText("distance  (Mpc)", (plotX0 + plotX1) / 2, plotY1 + 12);
  for (let i = 0; i <= xTicks; i++) {
    const d = (dMax * i) / xTicks;
    ctx.fillText(d.toFixed(both ? 0 : 1), xOf(d), plotY1 + 2);
  }
  ctx.save();
  ctx.translate(PAD + 8, (plotY0 + plotY1) / 2);
  ctx.rotate(-Math.PI / 2);
  ctx.textAlign = "center";
  ctx.fillText("recession velocity  (km/s)", 0, 0);
  ctx.restore();
  ctx.textAlign = "right";
  ctx.textBaseline = "middle";
  for (let i = 0; i <= yTicks; i++) {
    const v = vMin + ((vMax - vMin) * i) / yTicks;
    ctx.fillText(`${Math.round(v)}`, plotX0 - 6, yOf(v));
  }

  // ── modern Hubble flow (drawn under the 1929 points) ──
  if (both) {
    // true H0 line
    ctx.strokeStyle = hexToRgba(tokens.mint, 0.85);
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(xOf(0), yOf(0));
    ctx.lineTo(xOf(dMax), yOf(hubbleVelocity(MODERN_H0, dMax)));
    ctx.stroke();

    ctx.fillStyle = hexToRgba(tokens.cyan, 0.55);
    for (const [d, v] of MODERN) {
      if (d > dMax) continue;
      ctx.beginPath();
      ctx.arc(xOf(d), yOf(v), 2.2, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // ── Hubble's 1929 fitted line (his slope ≈ 465 km/s/Mpc) ──
  ctx.strokeStyle = hexToRgba(tokens.amber, both ? 0.55 : 0.9);
  ctx.lineWidth = 2;
  ctx.setLineDash([6, 4]);
  ctx.beginPath();
  ctx.moveTo(xOf(0), yOf(0));
  const lineDmax = both ? dMax : 2.2;
  ctx.lineTo(xOf(lineDmax), yOf(HUBBLE_1929_SLOPE * lineDmax));
  ctx.stroke();
  ctx.setLineDash([]);

  // ── Hubble's 1929 points ──
  for (const [d, v] of HUBBLE_1929) {
    if (d > dMax) continue;
    ctx.fillStyle = tokens.amber;
    ctx.beginPath();
    ctx.arc(xOf(d), yOf(v), 3.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = hexToRgba(tokens.bg, 0.9);
    ctx.lineWidth = 1;
    ctx.stroke();
  }

  // ── HUD ──
  ctx.textAlign = "left";
  let hy = plotY0 + 4;
  hy = drawHudReadout(
    ctx,
    plotX0 + 8,
    hy,
    "Hubble 1929  H ≈ ",
    "465 km/s/Mpc",
    tokens.textDim,
    tokens.amber,
  );
  if (both) {
    drawHudReadout(
      ctx,
      plotX0 + 8,
      hy,
      "modern  H₀ ≈ ",
      "70 km/s/Mpc",
      tokens.textDim,
      tokens.mint,
    );
  }
  ctx.textBaseline = "alphabetic";
}
