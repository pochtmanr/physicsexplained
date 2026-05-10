"use client";

import { useEffect, useRef } from "react";
import {
  SCENE_CANVAS_CLASS,
  applyDpr,
  hexToRgba,
  useSceneTokens,
  type SceneTokens,
} from "@/components/physics/_shared/scene-tokens";

/**
 * FIG.12b — THE THREE QUADRANTS.
 *
 * Three side-by-side mini-spacetime diagrams, each showing one event pair
 * representative of a Lorentz-invariant quadrant: timelike (s² > 0), null
 * (s² = 0), spacelike (s² < 0). Each panel hatches the relevant causal
 * region.
 */

type CaseId = "timelike" | "null" | "spacelike";

interface CaseDef {
  id: CaseId;
  title: string;
  s2Sign: string;
  colorKey: "cyan" | "amber" | "magenta";
  Ax: number;
  At: number;
  Bx: number;
  Bt: number;
  s2: number;
  hatchRegion: "future-cone" | "elsewhere" | "null-line";
}

const CASES: readonly CaseDef[] = [
  {
    id: "timelike",
    title: "TIMELIKE",
    s2Sign: "s² > 0",
    colorKey: "cyan",
    Ax: 0,
    At: 0,
    Bx: 1,
    Bt: 2,
    s2: 4 - 1,
    hatchRegion: "future-cone",
  },
  {
    id: "null",
    title: "NULL (LIGHT)",
    s2Sign: "s² = 0",
    colorKey: "amber",
    Ax: 0,
    At: 0,
    Bx: 1.5,
    Bt: 1.5,
    s2: 0,
    hatchRegion: "null-line",
  },
  {
    id: "spacelike",
    title: "SPACELIKE",
    s2Sign: "s² < 0",
    colorKey: "magenta",
    Ax: 0,
    At: 0,
    Bx: 1.5,
    Bt: 0.5,
    s2: 0.25 - 2.25,
    hatchRegion: "elsewhere",
  },
];

const PANEL_W = 240;
const PANEL_H = 240;
const X_RANGE: [number, number] = [-2, 2];
const T_RANGE: [number, number] = [-0.5, 2.5];

export function ThreeCasesScene() {
  return (
    <div className="flex flex-col items-center gap-3 p-4">
      <div className="grid w-full grid-cols-1 gap-3 sm:grid-cols-3">
        {CASES.map((c) => (
          <CasePanel key={c.id} def={c} />
        ))}
      </div>
      <div className="grid w-full max-w-[760px] grid-cols-3 gap-x-3 font-mono text-[11px] text-[var(--color-fg-2)]">
        <div>
          <span style={{ color: "var(--color-cyan)" }}>future light cone</span> — only
          events here can be reached by you.
        </div>
        <div>
          <span style={{ color: "var(--color-amber)" }}>light cone itself</span> — what
          a photon traces.
        </div>
        <div>
          <span style={{ color: "var(--color-magenta)" }}>elsewhere</span> — causally
          disconnected; ordering depends on frame.
        </div>
      </div>
    </div>
  );
}

function CasePanel({ def }: { def: CaseDef }) {
  const ref = useRef<HTMLCanvasElement | null>(null);
  const tokens = useSceneTokens();

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = applyDpr(canvas, PANEL_W, PANEL_H);
    if (!ctx) return;
    drawPanel(ctx, tokens, def);
  }, [def, tokens]);

  return (
    <canvas
      ref={ref}
      style={{ width: PANEL_W, height: PANEL_H, display: "block" }}
      className={SCENE_CANVAS_CLASS}
    />
  );
}

function drawPanel(
  ctx: CanvasRenderingContext2D,
  tokens: SceneTokens,
  def: CaseDef,
) {
  const accent =
    def.colorKey === "cyan"
      ? tokens.cyan
      : def.colorKey === "amber"
        ? tokens.amber
        : tokens.magenta;

  ctx.clearRect(0, 0, PANEL_W, PANEL_H);
  ctx.fillStyle = tokens.bg;
  ctx.fillRect(0, 0, PANEL_W, PANEL_H);

  const margin = 24;
  const plotW = PANEL_W - 2 * margin;
  const plotH = PANEL_H - 2 * margin;
  const [xMin, xMax] = X_RANGE;
  const [tMin, tMax] = T_RANGE;
  const xToPx = (x: number) => margin + ((x - xMin) / (xMax - xMin)) * plotW;
  const tToPx = (t: number) =>
    PANEL_H - margin - ((t - tMin) / (tMax - tMin)) * plotH;

  // Hatch via diagonal stripes constrained to the relevant region.
  ctx.save();
  ctx.beginPath();
  ctx.rect(margin, margin, plotW, plotH);
  ctx.clip();

  const stripe = 6;
  if (def.hatchRegion === "future-cone") {
    ctx.strokeStyle = hexToRgba(tokens.cyan, 0.18);
    ctx.lineWidth = 1;
    for (let i = -PANEL_H; i < PANEL_W * 2; i += stripe) {
      ctx.beginPath();
      ctx.moveTo(i, 0);
      ctx.lineTo(i + PANEL_H, PANEL_H);
      ctx.stroke();
    }
    // Mask back: paint outside the upper cone with the panel bg
    ctx.fillStyle = tokens.bg;
    ctx.beginPath();
    ctx.moveTo(xToPx(xMin), tToPx(tMin));
    ctx.lineTo(xToPx(xMin), tToPx(0));
    ctx.lineTo(xToPx(0), tToPx(0));
    ctx.lineTo(xToPx(xMin), tToPx(-xMin));
    ctx.closePath();
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(xToPx(xMax), tToPx(tMin));
    ctx.lineTo(xToPx(xMax), tToPx(0));
    ctx.lineTo(xToPx(0), tToPx(0));
    ctx.lineTo(xToPx(xMax), tToPx(xMax));
    ctx.closePath();
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(xToPx(xMin), tToPx(tMin));
    ctx.lineTo(xToPx(xMax), tToPx(tMin));
    ctx.lineTo(xToPx(xMax), tToPx(-xMax));
    ctx.lineTo(xToPx(0), tToPx(0));
    ctx.lineTo(xToPx(xMin), tToPx(-xMin));
    ctx.closePath();
    ctx.fill();
  } else if (def.hatchRegion === "elsewhere") {
    ctx.strokeStyle = hexToRgba(tokens.magenta, 0.18);
    ctx.lineWidth = 1;
    for (let i = -PANEL_H; i < PANEL_W * 2; i += stripe) {
      ctx.beginPath();
      ctx.moveTo(i, 0);
      ctx.lineTo(i + PANEL_H, PANEL_H);
      ctx.stroke();
    }
    ctx.fillStyle = tokens.bg;
    // Upper cone
    ctx.beginPath();
    ctx.moveTo(xToPx(0), tToPx(0));
    ctx.lineTo(xToPx(xMax), tToPx(xMax));
    ctx.lineTo(xToPx(xMin), tToPx(-xMin));
    ctx.closePath();
    ctx.fill();
    // Lower cone
    ctx.beginPath();
    ctx.moveTo(xToPx(0), tToPx(0));
    ctx.lineTo(xToPx(xMax), tToPx(-xMax));
    ctx.lineTo(xToPx(xMin), tToPx(xMin));
    ctx.closePath();
    ctx.fill();
  }
  // null case: no hatch

  ctx.restore();

  // Grid
  ctx.strokeStyle = tokens.grid;
  ctx.lineWidth = 1;
  for (let xg = Math.ceil(xMin); xg <= Math.floor(xMax); xg++) {
    ctx.beginPath();
    ctx.moveTo(xToPx(xg), tToPx(tMin));
    ctx.lineTo(xToPx(xg), tToPx(tMax));
    ctx.stroke();
  }
  for (let tg = Math.ceil(tMin); tg <= Math.floor(tMax); tg++) {
    ctx.beginPath();
    ctx.moveTo(xToPx(xMin), tToPx(tg));
    ctx.lineTo(xToPx(xMax), tToPx(tg));
    ctx.stroke();
  }

  // Axes
  ctx.strokeStyle = tokens.axes;
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  ctx.moveTo(xToPx(0), tToPx(tMin));
  ctx.lineTo(xToPx(0), tToPx(tMax));
  ctx.moveTo(xToPx(xMin), tToPx(0));
  ctx.lineTo(xToPx(xMax), tToPx(0));
  ctx.stroke();

  // Light cone
  ctx.strokeStyle = tokens.amber;
  ctx.setLineDash([4, 4]);
  ctx.lineWidth = 1.25;
  ctx.beginPath();
  ctx.moveTo(xToPx(xMin), tToPx(-xMin));
  ctx.lineTo(xToPx(xMax), tToPx(xMax));
  ctx.moveTo(xToPx(xMin), tToPx(xMin));
  ctx.lineTo(xToPx(xMax), tToPx(-xMax));
  ctx.stroke();
  ctx.setLineDash([]);

  // Event pair
  ctx.strokeStyle = accent;
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.moveTo(xToPx(def.Ax), tToPx(def.At));
  ctx.lineTo(xToPx(def.Bx), tToPx(def.Bt));
  ctx.stroke();

  ctx.fillStyle = accent;
  for (const [px, py] of [
    [xToPx(def.Ax), tToPx(def.At)],
    [xToPx(def.Bx), tToPx(def.Bt)],
  ]) {
    ctx.beginPath();
    ctx.arc(px, py, 4, 0, Math.PI * 2);
    ctx.fill();
  }

  // Title + s²
  ctx.fillStyle = accent;
  ctx.font = "bold 11px ui-monospace, monospace";
  ctx.textAlign = "left";
  ctx.fillText(def.title, margin, margin - 8);
  ctx.fillStyle = tokens.textDim;
  ctx.font = "11px ui-monospace, monospace";
  ctx.textAlign = "right";
  ctx.fillText(`${def.s2Sign}   s²=${def.s2.toFixed(2)}`, PANEL_W - margin, margin - 8);

  // Axis labels
  ctx.fillStyle = tokens.textMute;
  ctx.font = "10px ui-monospace, monospace";
  ctx.textAlign = "left";
  ctx.fillText("x", PANEL_W - margin + 4, tToPx(0) + 4);
  ctx.fillText("ct", xToPx(0) + 4, margin + 4);
}
