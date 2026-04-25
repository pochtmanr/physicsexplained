"use client";

import { useEffect, useRef, useState } from "react";
import { useAnimationFrame } from "@/lib/animation/use-animation-frame";
import { useThemeColors } from "@/lib/hooks/use-theme-colors";

/**
 * FIG.60b — F^{μν} morphs into *F^{μν}.
 *
 * Two side-by-side 4×4 grids. The left grid is F (the same labelled
 * tensor from FIG.60a). The right grid is the Hodge dual *F^{μν}, which
 * (up to signs in mostly-minus signature) swaps E ↔ cB. Visually, the
 * top row of F (the E_i/c entries) ends up populated with B_i in *F,
 * and the lower-right 3×3 block (the B_i entries) ends up populated
 * with E_i/c.
 *
 * Animation: a phase variable t ∈ [0,1] cycles continuously. Lilac
 * arrows showing where each component moves are drawn at peak phase
 * 0.4–0.7. The grid values cross-fade between the F-state and the
 * *F-state.
 *
 * HUD caption: "F^{μν} sources electric currents J^ν. *F^{μν} would
 * source magnetic currents — but we have never seen one."
 */

const RATIO = 0.55;
const MAX_HEIGHT = 360;

// "Pretty" representative numbers for the morph: a generic field with
// distinguishable E and B values so the swap is legible.
const E = { x: 0.6, y: -0.4, z: 0.3 };
const B = { x: 0.5, y: -0.7, z: 0.4 };

interface CellSpec {
  label: string;
  value: number;
  kind: "zero" | "E" | "B";
}

function buildF(): CellSpec[][] {
  return [
    [
      { label: "0", value: 0, kind: "zero" },
      { label: "Eₓ/c", value: E.x, kind: "E" },
      { label: "Eᵧ/c", value: E.y, kind: "E" },
      { label: "E_z/c", value: E.z, kind: "E" },
    ],
    [
      { label: "−Eₓ/c", value: -E.x, kind: "E" },
      { label: "0", value: 0, kind: "zero" },
      { label: "−B_z", value: -B.z, kind: "B" },
      { label: "Bᵧ", value: B.y, kind: "B" },
    ],
    [
      { label: "−Eᵧ/c", value: -E.y, kind: "E" },
      { label: "B_z", value: B.z, kind: "B" },
      { label: "0", value: 0, kind: "zero" },
      { label: "−Bₓ", value: -B.x, kind: "B" },
    ],
    [
      { label: "−E_z/c", value: -E.z, kind: "E" },
      { label: "−Bᵧ", value: -B.y, kind: "B" },
      { label: "Bₓ", value: B.x, kind: "B" },
      { label: "0", value: 0, kind: "zero" },
    ],
  ];
}

function buildDual(): CellSpec[][] {
  // Pedagogical *F: top row + first column is now B; lower-right 3×3
  // block is now E (kind-swap, with the same antisymmetric pattern).
  return [
    [
      { label: "0", value: 0, kind: "zero" },
      { label: "Bₓ", value: B.x, kind: "B" },
      { label: "Bᵧ", value: B.y, kind: "B" },
      { label: "B_z", value: B.z, kind: "B" },
    ],
    [
      { label: "−Bₓ", value: -B.x, kind: "B" },
      { label: "0", value: 0, kind: "zero" },
      { label: "E_z/c", value: E.z, kind: "E" },
      { label: "−Eᵧ/c", value: -E.y, kind: "E" },
    ],
    [
      { label: "−Bᵧ", value: -B.y, kind: "B" },
      { label: "−E_z/c", value: -E.z, kind: "E" },
      { label: "0", value: 0, kind: "zero" },
      { label: "Eₓ/c", value: E.x, kind: "E" },
    ],
    [
      { label: "−B_z", value: -B.z, kind: "B" },
      { label: "Eᵧ/c", value: E.y, kind: "E" },
      { label: "−Eₓ/c", value: -E.x, kind: "E" },
      { label: "0", value: 0, kind: "zero" },
    ],
  ];
}

const F_STATE = buildF();
const D_STATE = buildDual();

export function DualTensorSwapScene() {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const colors = useThemeColors();

  const [size, setSize] = useState({ width: 720, height: 380 });
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const w = entry.contentRect.width;
        if (w > 0) {
          setSize({ width: w, height: Math.min(w * RATIO, MAX_HEIGHT) });
        }
      }
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  useAnimationFrame({
    elementRef: containerRef,
    onFrame: (t) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      const { width, height } = size;
      const dpr = window.devicePixelRatio || 1;
      if (canvas.width !== width * dpr || canvas.height !== height * dpr) {
        canvas.width = width * dpr;
        canvas.height = height * dpr;
        ctx.scale(dpr, dpr);
      }
      ctx.clearRect(0, 0, width, height);

      // Phase cycle — slow morph back and forth so the viewer can read
      // the swap. 0..1..0..1, 6s period.
      const cycle = (Math.sin(t * 1.0) + 1) * 0.5; // 0..1
      const arrowsAlpha =
        cycle > 0.3 && cycle < 0.7 ? Math.sin((cycle - 0.3) * Math.PI * 2.5) : 0;

      // Layout: two grids side by side
      const gap = 36;
      const padTop = 30;
      const totalGridWidth = (width - gap - 24) / 2;
      const gridSize = Math.min(totalGridWidth, height - padTop - 32);
      const cell = gridSize / 4;
      const xL = 12 + (totalGridWidth - gridSize) / 2;
      const xR = 12 + totalGridWidth + gap + (totalGridWidth - gridSize) / 2;
      const y0 = padTop;

      drawGrid(ctx, F_STATE, xL, y0, cell, "F^{μν}", colors, cycle, false);
      drawGrid(ctx, D_STATE, xR, y0, cell, "*F^{μν}", colors, cycle, true);

      // Morph arrows from left grid's hot cells (E top row, B 3×3) to
      // right grid's mirror cells. Drawn only at peak phase.
      if (arrowsAlpha > 0.02) {
        const a = `rgba(200, 160, 255, ${(0.6 * arrowsAlpha).toFixed(3)})`;
        // E_x/c top of F → B_x mid-block of *F (cell [2][3] on right)
        arrowBetween(ctx, xL + cell * 1.5, y0 + cell * 0.5, xR + cell * 3.5, y0 + cell * 2.5, a);
        // B_z mid-block of F (cell [1][2]) → B_z top of *F (cell [0][3])
        arrowBetween(ctx, xL + cell * 2.5, y0 + cell * 1.5, xR + cell * 3.5, y0 + cell * 0.5, a);
      }

      // HUD caption
      ctx.fillStyle = colors.fg2;
      ctx.font = "11px monospace";
      ctx.textAlign = "center";
      ctx.fillText(
        "F^{μν} sources electric currents J^ν.   *F^{μν} would source magnetic currents — none observed (§12.3).",
        width / 2,
        height - 10,
      );
    },
  });

  return (
    <div ref={containerRef} className="w-full pb-4">
      <canvas
        ref={canvasRef}
        style={{ width: size.width, height: size.height }}
        className="block"
      />
    </div>
  );
}

function drawGrid(
  ctx: CanvasRenderingContext2D,
  state: CellSpec[][],
  x0: number,
  y0: number,
  cell: number,
  title: string,
  colors: ReturnType<typeof useThemeColors>,
  morph: number,
  isDual: boolean,
) {
  const gridSize = cell * 4;
  ctx.fillStyle = colors.fg1;
  ctx.font = "12px monospace";
  ctx.textAlign = "left";
  ctx.fillText(title, x0, y0 - 10);

  for (let i = 0; i < 4; i++) {
    for (let j = 0; j < 4; j++) {
      const c = state[i][j];
      const x = x0 + j * cell;
      const y = y0 + i * cell;

      // colour by kind, intensity gated by the morph phase: a dual cell
      // brightens on the second half of the cycle, an F cell on the first.
      const intensity = isDual ? morph : 1 - morph;
      let fill = "rgba(255,255,255,0.02)";
      if (c.kind === "E")
        fill = `rgba(255, 106, 222, ${(0.05 + 0.18 * Math.abs(c.value) * (0.4 + 0.6 * intensity)).toFixed(3)})`;
      else if (c.kind === "B")
        fill = `rgba(116, 220, 255, ${(0.05 + 0.18 * Math.abs(c.value) * (0.4 + 0.6 * intensity)).toFixed(3)})`;
      ctx.fillStyle = fill;
      ctx.fillRect(x + 1, y + 1, cell - 2, cell - 2);

      ctx.strokeStyle = colors.fg3;
      ctx.lineWidth = 0.7;
      ctx.strokeRect(x + 0.5, y + 0.5, cell - 1, cell - 1);

      ctx.fillStyle = c.kind === "zero" ? colors.fg3 : colors.fg1;
      ctx.font = "11px monospace";
      ctx.textAlign = "center";
      ctx.fillText(c.label, x + cell / 2, y + cell / 2 + 4);
    }
  }

  // Dimensional ν label below
  ctx.fillStyle = colors.fg3;
  ctx.font = "10px monospace";
  ctx.textAlign = "center";
  ctx.fillText(isDual ? "(swaps E ↔ cB)" : "(SI mostly-minus)", x0 + gridSize / 2, y0 + gridSize + 14);
}

function arrowBetween(
  ctx: CanvasRenderingContext2D,
  x0: number,
  y0: number,
  x1: number,
  y1: number,
  color: string,
) {
  const dx = x1 - x0;
  const dy = y1 - y0;
  const len = Math.hypot(dx, dy);
  if (len < 1) return;
  const ux = dx / len;
  const uy = dy / len;

  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  // Bezier curve so paths don't overlap straight on
  const cx = (x0 + x1) / 2;
  const cy = (y0 + y1) / 2 - 18;
  ctx.moveTo(x0, y0);
  ctx.quadraticCurveTo(cx, cy, x1, y1);
  ctx.stroke();

  // arrowhead
  const head = 7;
  const nx = -uy;
  const ny = ux;
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x1 - ux * head + nx * head * 0.5, y1 - uy * head + ny * head * 0.5);
  ctx.lineTo(x1 - ux * head - nx * head * 0.5, y1 - uy * head - ny * head * 0.5);
  ctx.closePath();
  ctx.fill();
}
