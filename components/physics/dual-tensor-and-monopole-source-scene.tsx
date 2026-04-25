"use client";

import { useEffect, useRef, useState } from "react";
import { useAnimationFrame } from "@/lib/animation/use-animation-frame";
import { useThemeColors } from "@/lib/hooks/use-theme-colors";

/**
 * FIG.65b — F^{μν} morphing into *F^{μν} via the E↔cB swap, with the
 * right-hand-side "source" pane showing what the two equations are
 * sourced by.
 *
 * Left grid:  F^{μν}      (top row + first column = E/c, lower-right 3×3 = B)
 * Right grid: *F^{μν}     (top row + first column = B,   lower-right 3×3 = E/c)
 *
 * Below the grids, the "RHS" of each tensor equation:
 *   F:  ∂_μ F^{μν}   = μ₀ J^ν              (electric four-current, magenta)
 *  *F:  ∂_μ *F^{μν}  = 0   in Maxwell      (empty)
 *                    = μ₀ J^ν_m  if monopoles (cyan)
 *
 * A toggle switches between the two right-hand-side states for the dual
 * equation. The morph between F and *F runs continuously, demonstrating
 * the Hodge swap.
 */

const RATIO = 0.62;
const MAX_HEIGHT = 440;

const E = { x: 0.6, y: -0.4, z: 0.3 };
const B = { x: 0.5, y: -0.7, z: 0.4 };

interface CellSpec {
  label: string;
  kind: "zero" | "E" | "B";
  value: number;
}

function buildF(): CellSpec[][] {
  return [
    [
      { label: "0", kind: "zero", value: 0 },
      { label: "Eₓ/c", kind: "E", value: E.x },
      { label: "Eᵧ/c", kind: "E", value: E.y },
      { label: "E_z/c", kind: "E", value: E.z },
    ],
    [
      { label: "−Eₓ/c", kind: "E", value: -E.x },
      { label: "0", kind: "zero", value: 0 },
      { label: "−B_z", kind: "B", value: -B.z },
      { label: "Bᵧ", kind: "B", value: B.y },
    ],
    [
      { label: "−Eᵧ/c", kind: "E", value: -E.y },
      { label: "B_z", kind: "B", value: B.z },
      { label: "0", kind: "zero", value: 0 },
      { label: "−Bₓ", kind: "B", value: -B.x },
    ],
    [
      { label: "−E_z/c", kind: "E", value: -E.z },
      { label: "−Bᵧ", kind: "B", value: -B.y },
      { label: "Bₓ", kind: "B", value: B.x },
      { label: "0", kind: "zero", value: 0 },
    ],
  ];
}

function buildDual(): CellSpec[][] {
  return [
    [
      { label: "0", kind: "zero", value: 0 },
      { label: "Bₓ", kind: "B", value: B.x },
      { label: "Bᵧ", kind: "B", value: B.y },
      { label: "B_z", kind: "B", value: B.z },
    ],
    [
      { label: "−Bₓ", kind: "B", value: -B.x },
      { label: "0", kind: "zero", value: 0 },
      { label: "E_z/c", kind: "E", value: E.z },
      { label: "−Eᵧ/c", kind: "E", value: -E.y },
    ],
    [
      { label: "−Bᵧ", kind: "B", value: -B.y },
      { label: "−E_z/c", kind: "E", value: -E.z },
      { label: "0", kind: "zero", value: 0 },
      { label: "Eₓ/c", kind: "E", value: E.x },
    ],
    [
      { label: "−B_z", kind: "B", value: -B.z },
      { label: "Eᵧ/c", kind: "E", value: E.y },
      { label: "−Eₓ/c", kind: "E", value: -E.x },
      { label: "0", kind: "zero", value: 0 },
    ],
  ];
}

const F_STATE = buildF();
const D_STATE = buildDual();

export function DualTensorAndMonopoleSourceScene() {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const colors = useThemeColors();

  const [withMonopoleSource, setWithMonopoleSource] = useState(false);
  const monoRef = useRef(withMonopoleSource);
  useEffect(() => {
    monoRef.current = withMonopoleSource;
  }, [withMonopoleSource]);

  const [size, setSize] = useState({ width: 720, height: 440 });
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
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        ctx.scale(dpr, dpr);
      }
      ctx.clearRect(0, 0, width, height);

      const mono = monoRef.current;

      // Layout: two grids on top half, two equation rows on bottom half
      const gridAreaH = height * 0.62;
      const eqAreaH = height - gridAreaH;
      const padTop = 26;
      const gap = 36;
      const totalGridW = (width - gap - 24) / 2;
      const gridSize = Math.min(totalGridW, gridAreaH - padTop - 30);
      const cell = gridSize / 4;
      const xL = 12 + (totalGridW - gridSize) / 2;
      const xR = 12 + totalGridW + gap + (totalGridW - gridSize) / 2;
      const y0 = padTop;

      // Slow morph cycle (0..1..0), 8s period
      const morph = (Math.sin(t * 0.78) + 1) * 0.5;

      drawGrid(ctx, F_STATE, xL, y0, cell, "F^{μν}", colors, 1 - morph, false);
      drawGrid(ctx, D_STATE, xR, y0, cell, "*F^{μν}", colors, morph, true);

      // Equation row
      const eqY0 = gridAreaH + 6;
      const eqLineH = eqAreaH / 2.4;

      // Equation 1: ∂_μ F^{μν} = μ₀ J^ν   (electric source)
      ctx.font = "13px monospace";
      ctx.textAlign = "left";
      ctx.fillStyle = colors.fg1;
      ctx.fillText("∂_μ F^{μν}  =  μ₀ J^ν", 24, eqY0 + 18);
      // electric tag
      ctx.fillStyle = "rgba(255, 106, 222, 0.95)";
      ctx.font = "10px monospace";
      ctx.fillText("electric four-current", 24, eqY0 + 32);

      // Equation 2: ∂_μ *F^{μν} = 0  (or = μ₀ J^ν_m)
      ctx.fillStyle = colors.fg1;
      ctx.font = "13px monospace";
      ctx.fillText("∂_μ *F^{μν}  =", 24, eqY0 + 18 + eqLineH);

      const rhsX = 24 + ctx.measureText("∂_μ *F^{μν}  =").width + 8;

      if (!mono) {
        // pulsing zero — the empty RHS
        const pulse = (Math.sin(t * 1.7) + 1) * 0.5;
        ctx.fillStyle = `rgba(180, 170, 200, ${(0.55 + 0.35 * pulse).toFixed(3)})`;
        ctx.fillText("0", rhsX, eqY0 + 18 + eqLineH);
        ctx.fillStyle = colors.fg2;
        ctx.font = "10px monospace";
        ctx.fillText(
          "  (no magnetic source — observed)",
          rhsX + 14,
          eqY0 + 18 + eqLineH,
        );
      } else {
        ctx.fillStyle = "rgba(120, 220, 255, 0.95)";
        ctx.fillText("μ₀ J^ν_m", rhsX, eqY0 + 18 + eqLineH);
        ctx.fillStyle = colors.fg2;
        ctx.font = "10px monospace";
        ctx.fillText(
          "  (magnetic four-current — what monopoles would source)",
          rhsX + ctx.measureText("μ₀ J^ν_m").width + 8,
          eqY0 + 18 + eqLineH,
        );
      }

      // bottom HUD
      ctx.fillStyle = colors.fg2;
      ctx.font = "10px monospace";
      ctx.textAlign = "center";
      ctx.fillText(
        "*F^{μν} = ½ ε^{μνρσ} F_{ρσ}   —   the Hodge dual swaps E ↔ cB",
        width / 2,
        height - 8,
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
      <div className="mt-2 flex items-center gap-3 px-2">
        <button
          type="button"
          onClick={() => setWithMonopoleSource((v) => !v)}
          className="rounded-sm border border-[var(--color-fg-4)] px-3 py-1 text-xs font-mono text-[var(--color-fg-1)] hover:border-[var(--color-fg-3)]"
        >
          {withMonopoleSource ? "set RHS = 0 (Maxwell)" : "set RHS = μ₀ J^ν_m (monopole)"}
        </button>
        <span className="text-xs font-mono text-[var(--color-fg-3)]">
          dual equation:{" "}
          {withMonopoleSource
            ? "∂_μ *F^{μν} = μ₀ J^ν_m"
            : "∂_μ *F^{μν} = 0"}
        </span>
      </div>
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
  intensity: number,
  isDual: boolean,
) {
  const gridSize = cell * 4;
  ctx.fillStyle = colors.fg1;
  ctx.font = "12px monospace";
  ctx.textAlign = "left";
  ctx.fillText(title, x0, y0 - 8);

  for (let i = 0; i < 4; i++) {
    for (let j = 0; j < 4; j++) {
      const c = state[i][j];
      const x = x0 + j * cell;
      const y = y0 + i * cell;

      let fill = "rgba(255,255,255,0.02)";
      if (c.kind === "E") {
        const a = 0.05 + 0.22 * Math.abs(c.value) * (0.4 + 0.6 * intensity);
        fill = `rgba(255, 106, 222, ${a.toFixed(3)})`;
      } else if (c.kind === "B") {
        const a = 0.05 + 0.22 * Math.abs(c.value) * (0.4 + 0.6 * intensity);
        fill = `rgba(120, 220, 255, ${a.toFixed(3)})`;
      }
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

  ctx.fillStyle = colors.fg2;
  ctx.font = "10px monospace";
  ctx.textAlign = "center";
  ctx.fillText(
    isDual ? "(B in top row, E in 3×3 block)" : "(E in top row, B in 3×3 block)",
    x0 + gridSize / 2,
    y0 + gridSize + 14,
  );
}
