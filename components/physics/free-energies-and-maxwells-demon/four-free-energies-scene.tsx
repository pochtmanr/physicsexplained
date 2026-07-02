"use client";

import { useEffect, useRef, useState } from "react";
import {
  FONT_HUD,
  FONT_HUD_SMALL,
  SCENE_CANVAS_CLASS,
  SCENE_HEIGHT_TALL,
  applyDpr,
  hexToRgba,
  drawArrow,
  useSceneSize,
  useSceneTokens,
  type SceneTokens,
} from "@/components/physics/_shared/scene-tokens";
import { POTENTIALS } from "@/lib/physics/thermodynamics/free-energy";

/**
 * FIG.20a — the four potentials, one shape. U sits at the origin; each Legendre
 * transform trades an awkward natural variable for its easy conjugate: add PV to
 * swap V→P (U→H, F→G), subtract TS to swap S→T (U→F, H→G). Click any corner to
 * read its definition, its natural variables, and when it is the right potential
 * to minimize. The square closes on G — the chemist's potential at fixed T, P.
 */

// quadrant placement: [col, row] with U at top-left, G opposite at bottom-right
const LAYOUT: Record<string, [number, number]> = {
  U: [0, 0],
  H: [1, 0],
  F: [0, 1],
  G: [1, 1],
};

export function FourFreeEnergiesScene() {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const tokens = useSceneTokens();
  const [selected, setSelected] = useState("G");
  const boxRectsRef = useRef<{ symbol: string; x: number; y: number; w: number; h: number }[]>([]);

  const { width, height } = useSceneSize(containerRef, {
    ratio: 0.7,
    maxHeight: SCENE_HEIGHT_TALL,
    minHeight: 340,
  });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = applyDpr(canvas, width, height);
    if (!ctx) return;
    boxRectsRef.current = draw(ctx, tokens, selected, width, height);
  }, [tokens, selected, width, height]);

  const handleClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const px = e.clientX - rect.left;
    const py = e.clientY - rect.top;
    for (const b of boxRectsRef.current) {
      if (px >= b.x && px <= b.x + b.w && py >= b.y && py <= b.y + b.h) {
        setSelected(b.symbol);
        return;
      }
    }
  };

  return (
    <div ref={containerRef} className="relative w-full pb-4">
      <canvas
        ref={canvasRef}
        onClick={handleClick}
        style={{ width, height, display: "block", cursor: "pointer" }}
        className={SCENE_CANVAS_CLASS}
        aria-label="A two-by-two square of the four thermodynamic potentials — internal energy, enthalpy, Helmholtz free energy, and Gibbs free energy — joined by Legendre-transform arrows labelled plus PV and minus TS. Clicking a corner reveals its definition, natural variables, and use."
      />
      <div className="mt-2 flex flex-wrap gap-2 font-mono text-xs">
        {POTENTIALS.map((p) => {
          const active = p.symbol === selected;
          return (
            <button
              key={p.symbol}
              type="button"
              onClick={() => setSelected(p.symbol)}
              className="cursor-pointer rounded-sm border px-2 py-0.5"
              style={{
                borderColor: active ? "var(--color-cyan)" : "var(--color-fg-4)",
                color: active ? "var(--color-cyan)" : "var(--color-fg-3)",
              }}
            >
              {p.symbol} · {p.name}
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
  selected: string,
  W: number,
  H: number,
): { symbol: string; x: number; y: number; w: number; h: number }[] {
  ctx.fillStyle = tokens.bg;
  ctx.fillRect(0, 0, W, H);

  const detailH = 84;
  const padX = 24;
  const padTop = 16;
  const gridH = H - detailH - padTop;
  const boxW = Math.min(150, (W - 2 * padX) * 0.34);
  const boxH = 64;

  const colX = [padX + boxW / 2, W - padX - boxW / 2];
  const rowY = [padTop + gridH * 0.28, padTop + gridH * 0.72];

  const center = (symbol: string) => {
    const [c, r] = LAYOUT[symbol];
    return { cx: colX[c], cy: rowY[r] };
  };

  // ── Legendre arrows (drawn under the boxes) ──
  const arrows: { from: string; to: string; label: string; color: string }[] = [
    { from: "U", to: "H", label: "+PV", color: tokens.amber },
    { from: "F", to: "G", label: "+PV", color: tokens.amber },
    { from: "U", to: "F", label: "−TS", color: tokens.magenta },
    { from: "H", to: "G", label: "−TS", color: tokens.magenta },
  ];
  ctx.font = FONT_HUD_SMALL;
  for (const a of arrows) {
    const from = center(a.from);
    const to = center(a.to);
    // shorten so arrows touch box edges, not centers
    const dx = to.cx - from.cx;
    const dy = to.cy - from.cy;
    const len = Math.hypot(dx, dy);
    const ux = dx / len;
    const uy = dy / len;
    const inset = boxW / 2 + 8;
    const insetV = boxH / 2 + 8;
    const startInset = Math.abs(ux) > Math.abs(uy) ? inset : insetV;
    const endInset = startInset;
    const x0 = from.cx + ux * startInset;
    const y0 = from.cy + uy * startInset;
    const x1 = to.cx - ux * endInset;
    const y1 = to.cy - uy * endInset;
    drawArrow(ctx, x0, y0, x1, y1, hexToRgba(a.color, 0.85), 2, 8);
    ctx.fillStyle = a.color;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    const mx = (x0 + x1) / 2;
    const my = (y0 + y1) / 2;
    // nudge label off the line
    ctx.fillText(a.label, mx + (Math.abs(ux) > Math.abs(uy) ? 0 : 16), my + (Math.abs(ux) > Math.abs(uy) ? -10 : 0));
  }

  // ── boxes ──
  const rects: { symbol: string; x: number; y: number; w: number; h: number }[] = [];
  for (const p of POTENTIALS) {
    const { cx, cy } = center(p.symbol);
    const x = cx - boxW / 2;
    const y = cy - boxH / 2;
    rects.push({ symbol: p.symbol, x, y, w: boxW, h: boxH });
    const active = p.symbol === selected;
    ctx.fillStyle = active ? hexToRgba(tokens.cyan, 0.14) : tokens.bg1;
    ctx.strokeStyle = active ? tokens.cyan : tokens.panelBorder;
    ctx.lineWidth = active ? 2 : 1;
    roundRect(ctx, x, y, boxW, boxH, 6);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = active ? tokens.cyan : tokens.textBright;
    ctx.font = FONT_HUD;
    ctx.textAlign = "center";
    ctx.textBaseline = "alphabetic";
    ctx.fillText(`${p.symbol} = ${p.definition}`, cx, cy - 4);
    ctx.fillStyle = tokens.textMute;
    ctx.font = FONT_HUD_SMALL;
    ctx.fillText(`natural: ${p.natural[0]}, ${p.natural[1]}`, cx, cy + 14);
  }

  // ── detail panel ──
  const sel = POTENTIALS.find((p) => p.symbol === selected) ?? POTENTIALS[3];
  const dy0 = H - detailH + 6;
  ctx.strokeStyle = tokens.panelBorder;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(padX, dy0);
  ctx.lineTo(W - padX, dy0);
  ctx.stroke();

  ctx.textAlign = "left";
  ctx.textBaseline = "top";
  ctx.fillStyle = tokens.cyan;
  ctx.font = FONT_HUD;
  ctx.fillText(`${sel.symbol}  ${sel.name}`, padX, dy0 + 10);
  ctx.fillStyle = tokens.textDim;
  ctx.font = FONT_HUD_SMALL;
  ctx.fillText(sel.differential, padX, dy0 + 30);
  ctx.fillStyle = tokens.textMute;
  wrapText(ctx, sel.use, padX, dy0 + 48, W - 2 * padX, 14);

  return rects;
}

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function wrapText(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  maxW: number,
  lineH: number,
) {
  const words = text.split(" ");
  let line = "";
  let yy = y;
  for (const w of words) {
    const test = line ? `${line} ${w}` : w;
    if (ctx.measureText(test).width > maxW && line) {
      ctx.fillText(line, x, yy);
      line = w;
      yy += lineH;
    } else {
      line = test;
    }
  }
  if (line) ctx.fillText(line, x, yy);
}
