"use client";

import { useEffect, useRef, useState } from "react";
import {
  FONT_HUD,
  FONT_HUD_SMALL,
  SCENE_CANVAS_CLASS,
  SCENE_HEIGHT_TALL,
  applyDpr,
  hexToRgba,
  useSceneSize,
  useSceneTokens,
  type SceneTokens,
} from "@/components/physics/_shared/scene-tokens";
import {
  PARADOX_POSITIONS,
  type ParadoxPosition,
} from "@/lib/physics/relativity/the-information-paradox";

/**
 * FIG.60c — Positions on the paradox.
 *
 * The candidate resolutions arranged on a 2×2 commitment grid:
 *   x-axis: does the final state stay UNITARY (information preserved)?
 *   y-axis: does the horizon stay SMOOTH (equivalence principle intact)?
 *
 * Each position is a node colored by whether it keeps unitarity (CYAN) or
 * gives it up (RED). Click a node to read who held it and the price it pays.
 * The top-right quadrant — unitary AND smooth — is where the modern
 * island/replica-wormhole results sit.
 */

// who-held context for each id (kept in the scene; the catalog stays physics-only)
const HELD_BY: Record<string, string> = {
  "information-lost": "Hawking 1976–2004 (original claim)",
  "escapes-in-radiation": "Susskind, 't Hooft, Preskill, Thorne",
  remnant: "Aharonov, Banks, Giddings, Preskill (1980s–90s)",
  "baby-universe": "early Hawking; later disfavored",
  firewall: "AMPS 2012 (Almheiri–Marolf–Polchinski–Sully)",
  islands: "Penington; Almheiri et al. (2019–2022)",
};

// grid position for each id: [unitary 0|1 → right, smooth 0|1 → up]
const GRID: Record<string, { ux: number; uy: number }> = {
  "information-lost": { ux: 0.18, uy: 0.78 },
  "baby-universe": { ux: 0.18, uy: 0.5 },
  firewall: { ux: 0.82, uy: 0.22 },
  remnant: { ux: 0.62, uy: 0.62 },
  "escapes-in-radiation": { ux: 0.84, uy: 0.78 },
  islands: { ux: 0.74, uy: 0.86 },
};

export function PositionsMapScene() {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const tokens = useSceneTokens();
  const [selected, setSelected] = useState<string>("islands");
  const { width, height } = useSceneSize(containerRef, {
    ratio: 0.62,
    maxHeight: SCENE_HEIGHT_TALL,
    minHeight: 340,
  });

  const nodesRef = useRef<{ id: string; x: number; y: number; r: number }[]>([]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = applyDpr(canvas, width, height);
    if (!ctx) return;
    nodesRef.current = draw(ctx, tokens, selected, width, height);
  }, [tokens, selected, width, height]);

  function handleClick(e: React.MouseEvent<HTMLCanvasElement>) {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    let best: string | null = null;
    let bestD = Infinity;
    for (const n of nodesRef.current) {
      const d = Math.hypot(x - n.x, y - n.y);
      if (d < n.r + 10 && d < bestD) {
        bestD = d;
        best = n.id;
      }
    }
    if (best) setSelected(best);
  }

  const sel = PARADOX_POSITIONS.find((p) => p.id === selected) ?? PARADOX_POSITIONS[0];

  return (
    <div ref={containerRef} className="relative w-full pb-4">
      <canvas
        ref={canvasRef}
        onClick={handleClick}
        style={{ width, height, display: "block", cursor: "pointer" }}
        className={SCENE_CANVAS_CLASS}
        aria-label="A 2-by-2 grid of proposed resolutions to the information paradox, plotted by whether they preserve unitarity and whether they keep the horizon smooth. Click a node to read who held the position and what it costs."
      />
      <div className="mt-2 flex flex-wrap gap-2 font-mono text-xs">
        {PARADOX_POSITIONS.map((p) => (
          <button
            key={p.id}
            type="button"
            onClick={() => setSelected(p.id)}
            className="cursor-pointer border px-2 py-1"
            style={
              p.id === selected
                ? {
                    borderColor: "var(--color-cyan)",
                    color: "var(--color-cyan)",
                  }
                : {
                    borderColor: "var(--color-fg-4)",
                    color: "var(--color-fg-3)",
                  }
            }
          >
            {p.label}
          </button>
        ))}
      </div>
      <div className="mt-2 font-mono text-xs text-[var(--color-fg-2)]">
        <div className="text-[var(--color-fg-1)]">{sel.label}</div>
        <div className="mt-1 text-[var(--color-fg-3)]">held by: {HELD_BY[sel.id]}</div>
        <div className="mt-1">
          cost: <span className="text-[var(--color-fg-2)]">{sel.cost}</span>
        </div>
      </div>
    </div>
  );
}

function draw(
  ctx: CanvasRenderingContext2D,
  tokens: SceneTokens,
  selected: string,
  W: number,
  H: number,
): { id: string; x: number; y: number; r: number }[] {
  ctx.fillStyle = tokens.bg;
  ctx.fillRect(0, 0, W, H);

  const pad = 34;
  const x0 = pad + 30;
  const x1 = W - pad;
  const y0 = pad;
  const y1 = H - pad - 8;

  // quadrant cross
  const xm = (x0 + x1) / 2;
  const ym = (y0 + y1) / 2;
  ctx.strokeStyle = tokens.grid;
  ctx.lineWidth = 1;
  ctx.strokeRect(x0, y0, x1 - x0, y1 - y0);
  ctx.beginPath();
  ctx.moveTo(xm, y0);
  ctx.lineTo(xm, y1);
  ctx.moveTo(x0, ym);
  ctx.lineTo(x1, ym);
  ctx.stroke();

  // highlight the "good" quadrant: unitary (right) AND smooth (top)
  ctx.fillStyle = hexToRgba(tokens.cyan, 0.06);
  ctx.fillRect(xm, y0, x1 - xm, ym - y0);

  // axis labels
  ctx.fillStyle = tokens.textMute;
  ctx.font = FONT_HUD_SMALL;
  ctx.textAlign = "center";
  ctx.textBaseline = "bottom";
  ctx.fillText("← information LOST        unitarity        information KEPT →", xm, H - 12);
  ctx.save();
  ctx.translate(16, ym);
  ctx.rotate(-Math.PI / 2);
  ctx.textBaseline = "top";
  ctx.fillText("← firewall      horizon      smooth →", 0, 0);
  ctx.restore();

  // map ux,uy ∈ [0,1] into the inner box
  const px = (ux: number) => x0 + ux * (x1 - x0);
  const py = (uy: number) => y1 - uy * (y1 - y0); // uy up

  const nodes: { id: string; x: number; y: number; r: number }[] = [];
  for (const p of PARADOX_POSITIONS) {
    const g = GRID[p.id];
    if (!g) continue;
    const x = px(g.ux);
    const y = py(g.uy);
    const r = 7;
    nodes.push({ id: p.id, x, y, r });
    drawNode(ctx, tokens, p, x, y, r, p.id === selected, g.ux > 0.5);
  }

  return nodes;
}

function drawNode(
  ctx: CanvasRenderingContext2D,
  tokens: SceneTokens,
  p: ParadoxPosition,
  x: number,
  y: number,
  r: number,
  isSelected: boolean,
  labelLeft: boolean,
) {
  const color = p.unitary ? tokens.cyan : tokens.red;

  if (isSelected) {
    ctx.fillStyle = hexToRgba(color, 0.22);
    ctx.beginPath();
    ctx.arc(x, y, r + 7, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fill();

  // ring marks firewall (smooth-horizon violation)
  if (!p.smoothHorizon) {
    ctx.strokeStyle = tokens.orange;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(x, y, r + 3.5, 0, Math.PI * 2);
    ctx.stroke();
  }

  // short label beside node — push it inward (right-side nodes label left)
  ctx.fillStyle = isSelected ? tokens.textBright : tokens.textMute;
  ctx.font = FONT_HUD;
  ctx.textBaseline = "middle";
  if (labelLeft) {
    ctx.textAlign = "right";
    ctx.fillText(shortLabel(p.id), x - r - 6, y);
  } else {
    ctx.textAlign = "left";
    ctx.fillText(shortLabel(p.id), x + r + 6, y);
  }
}

function shortLabel(id: string): string {
  switch (id) {
    case "information-lost":
      return "info destroyed";
    case "escapes-in-radiation":
      return "escapes in radiation";
    case "remnant":
      return "remnant";
    case "baby-universe":
      return "baby universe";
    case "firewall":
      return "firewall";
    case "islands":
      return "islands";
    default:
      return id;
  }
}
