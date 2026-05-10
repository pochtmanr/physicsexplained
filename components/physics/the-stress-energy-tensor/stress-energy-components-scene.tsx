"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  FONT_HUD,
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

/**
 * FIG.36a — THE STRESS-ENERGY TENSOR COMPONENTS
 *
 * A 4×4 grid showing T_{μν} with each cell labelled by its physical meaning:
 *   T_{00}          — energy density
 *   T_{0i} = T_{i0} — momentum density (energy flux / c)
 *   T_{ii}          — pressure (diagonal spatial)
 *   T_{ij} (i≠j)    — shear stress (off-diagonal spatial)
 *
 * A discrete slider cycles through four fluid types:
 *   0 — vacuum      (all zero)
 *   1 — dust        (T_{00} only)
 *   2 — perfect fluid (T_{00} + diagonal pressure)
 *   3 — EM field    (isotropic radiation pressure)
 *
 * Active cells highlight in the accent colour; inactive cells dim.
 * Cell-state transitions animate over 200 ms (ease interpolation).
 */

type FluidType = "vacuum" | "dust" | "perfect-fluid" | "em-field";
const FLUID_TYPES: FluidType[] = ["vacuum", "dust", "perfect-fluid", "em-field"];
const FLUID_LABELS = ["Vacuum", "Dust", "Perfect fluid", "EM field"];

// Returns which cells are active for each fluid type
function activeCells(fluid: FluidType): boolean[][] {
  const off = Array.from({ length: 4 }, () => [false, false, false, false]);
  if (fluid === "vacuum") return off;
  if (fluid === "dust") {
    const g = off.map((r) => [...r]);
    g[0][0] = true;
    return g;
  }
  if (fluid === "perfect-fluid") {
    const g = off.map((r) => [...r]);
    g[0][0] = true;
    g[1][1] = true;
    g[2][2] = true;
    g[3][3] = true;
    return g;
  }
  // EM field: traceless isotropic radiation — T_{00}, T_{11}, T_{22}, T_{33}
  const g = off.map((r) => [...r]);
  g[0][0] = true;
  g[1][1] = true;
  g[2][2] = true;
  g[3][3] = true;
  return g;
}

// Returns a representative numerical value for display
function cellValue(mu: number, nu: number, fluid: FluidType): string {
  if (fluid === "vacuum") return "0";
  if (fluid === "dust") {
    if (mu === 0 && nu === 0) return "ρc²";
    return "0";
  }
  if (fluid === "perfect-fluid") {
    if (mu === 0 && nu === 0) return "ρc²";
    if (mu === nu && mu >= 1) return "p";
    return "0";
  }
  // EM field
  if (mu === 0 && nu === 0) return "u";
  if (mu === nu && mu >= 1) return "u/3";
  if (mu === 0 || nu === 0) return "S/c²";
  return "σᵢⱼ";
}

interface SemanticPalette {
  energy: string;
  momentum: string;
  pressure: string;
  shear: string;
}

function cellColor(mu: number, nu: number, palette: SemanticPalette): string {
  if (mu === 0 && nu === 0) return palette.energy;
  if (mu === 0 || nu === 0) return palette.momentum;
  if (mu === nu) return palette.pressure;
  return palette.shear;
}

function cellLabel(mu: number, nu: number): string {
  if (mu === 0 && nu === 0) return "energy\ndensity";
  if (mu === 0 && nu >= 1) return "energy\nflux/c";
  if (mu >= 1 && nu === 0) return "momentum\ndensity";
  if (mu === nu) return "pressure";
  return "shear\nstress";
}

const INDEX_LABELS = ["0 (t)", "1 (x)", "2 (y)", "3 (z)"];

// alpha[mu][nu] — per-cell animation alpha (0=inactive, 1=active)
function drawScene(
  ctx: CanvasRenderingContext2D,
  W: number,
  H: number,
  fluid: FluidType,
  alphas: number[][],
  tokens: SceneTokens,
  palette: SemanticPalette,
) {
  ctx.fillStyle = tokens.bg;
  ctx.fillRect(0, 0, W, H);

  const marginLeft = 60;
  const marginTop = 64;
  const cellW = (W - marginLeft - 20) / 4;
  const cellH = (H - marginTop - 56) / 4;

  // Section title
  drawSectionTitle(ctx, marginLeft, 10, "STRESS-ENERGY TENSOR  T_{μν}", tokens.textMute);

  // Axis labels
  ctx.save();
  ctx.font = FONT_HUD_SMALL;
  ctx.fillStyle = hexToRgba(tokens.textBright, 0.35);
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("ν →", marginLeft + 2 * cellW, marginTop - 20);
  ctx.save();
  ctx.translate(16, marginTop + 2 * cellH);
  ctx.rotate(-Math.PI / 2);
  ctx.fillText("μ ↓", 0, 0);
  ctx.restore();
  ctx.restore();

  // Column headers (ν)
  ctx.save();
  ctx.font = FONT_HUD_SMALL;
  ctx.fillStyle = tokens.textFaint;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  for (let nu = 0; nu < 4; nu++) {
    const cx = marginLeft + nu * cellW + cellW / 2;
    ctx.fillText(`ν=${INDEX_LABELS[nu]}`, cx, marginTop / 2 + 6);
  }
  ctx.restore();

  // Row headers (μ)
  ctx.save();
  ctx.font = FONT_HUD_SMALL;
  ctx.fillStyle = tokens.textFaint;
  ctx.textAlign = "right";
  ctx.textBaseline = "middle";
  for (let mu = 0; mu < 4; mu++) {
    const cy = marginTop + mu * cellH + cellH / 2;
    ctx.fillText(`μ=${INDEX_LABELS[mu]}`, marginLeft - 10, cy);
  }
  ctx.restore();

  // Cells
  for (let mu = 0; mu < 4; mu++) {
    for (let nu = 0; nu < 4; nu++) {
      const x = marginLeft + nu * cellW;
      const y = marginTop + mu * cellH;
      const alpha = alphas[mu][nu]; // 0..1 animated
      const color = cellColor(mu, nu, palette);

      // Cell background
      if (alpha > 0) {
        ctx.fillStyle = hexToRgba(color, 0.13 * alpha);
      } else {
        ctx.fillStyle = hexToRgba(tokens.textBright, 0.02);
      }
      ctx.fillRect(x + 1, y + 1, cellW - 2, cellH - 2);

      // Cell border
      if (alpha > 0) {
        ctx.strokeStyle = hexToRgba(color, 0.55 * alpha + 0.1 * (1 - alpha));
      } else {
        ctx.strokeStyle = tokens.panelBorder;
      }
      ctx.lineWidth = alpha > 0 ? 1.5 : 1;
      ctx.strokeRect(x + 1, y + 1, cellW - 2, cellH - 2);

      // T_{μν} index label
      const labelAlpha = 0.28 + 0.64 * alpha;
      ctx.fillStyle = alpha > 0
        ? hexToRgba(color, labelAlpha)
        : tokens.textFaint;
      ctx.font = `${alpha > 0.5 ? "bold " : ""}${alpha > 0.5 ? 11 : 10}px ui-monospace, monospace`;
      ctx.textAlign = "center";
      ctx.textBaseline = "top";
      ctx.fillText(`T${mu}${nu}`, x + cellW / 2, y + 5);

      // Value label
      ctx.font = FONT_HUD;
      ctx.fillStyle = alpha > 0
        ? hexToRgba(tokens.textBright, 0.20 + 0.70 * alpha)
        : hexToRgba(tokens.textBright, 0.18);
      ctx.textBaseline = "middle";
      ctx.fillText(cellValue(mu, nu, fluid), x + cellW / 2, y + cellH / 2 + 4);

      // Semantic label (two lines)
      const sem = cellLabel(mu, nu);
      const lines = sem.split("\n");
      ctx.font = "8px ui-monospace, monospace";
      ctx.fillStyle = alpha > 0
        ? hexToRgba(color, 0.75 * alpha + 0.15 * (1 - alpha))
        : hexToRgba(tokens.textBright, 0.13);
      ctx.textBaseline = "bottom";
      ctx.fillText(lines[0], x + cellW / 2, y + cellH - 12);
      if (lines[1]) {
        ctx.fillText(lines[1], x + cellW / 2, y + cellH - 2);
      }
    }
  }

  // Legend
  const legend = [
    { color: palette.energy, label: "T₀₀ — energy density" },
    { color: palette.momentum, label: "T₀ᵢ — momentum density" },
    { color: palette.pressure, label: "Tᵢᵢ — pressure" },
    { color: palette.shear, label: "Tᵢⱼ — shear stress" },
  ];
  const legY = H - 14;
  const legSpacing = (W - 20) / legend.length;
  ctx.font = "8px ui-monospace, monospace";
  ctx.textBaseline = "bottom";
  for (let i = 0; i < legend.length; i++) {
    const lx = 10 + i * legSpacing;
    ctx.fillStyle = hexToRgba(legend[i].color, 0.85);
    ctx.textAlign = "left";
    ctx.fillRect(lx, legY - 9, 8, 8);
    ctx.fillStyle = hexToRgba(tokens.textBright, 0.45);
    ctx.fillText(legend[i].label, lx + 12, legY);
  }
}

export function StressEnergyComponentsScene() {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [fluidIndex, setFluidIndex] = useState(2); // default: perfect fluid
  const tokens = useSceneTokens();
  const { width, height } = useSceneSize(containerRef, {
    ratio: 0.6,
    maxHeight: SCENE_HEIGHT_DEFAULT,
  });

  // Cell highlight colours by semantic meaning — derived from theme tokens
  const palette = useMemo<SemanticPalette>(
    () => ({
      energy: tokens.cyan,
      momentum: tokens.magenta,
      pressure: tokens.amber,
      shear: tokens.purple,
    }),
    [tokens],
  );

  // Per-cell alpha for animated transitions (200 ms ease)
  const alphasRef = useRef<number[][]>(
    Array.from({ length: 4 }, () => [0, 0, 0, 0]),
  );
  const targetRef = useRef<boolean[][]>(activeCells(FLUID_TYPES[2]));
  const rafRef = useRef<number>(0);
  const lastTimeRef = useRef<number | null>(null);
  const TRANSITION_MS = 200;

  useEffect(() => {
    targetRef.current = activeCells(FLUID_TYPES[fluidIndex]);
  }, [fluidIndex]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const loop = (ts: number) => {
      const dt = lastTimeRef.current == null ? 0 : ts - lastTimeRef.current;
      lastTimeRef.current = ts;

      const step = dt / TRANSITION_MS;
      const target = targetRef.current;
      const alphas = alphasRef.current;

      for (let mu = 0; mu < 4; mu++) {
        for (let nu = 0; nu < 4; nu++) {
          const want = target[mu][nu] ? 1 : 0;
          const cur = alphas[mu][nu];
          if (cur < want) alphas[mu][nu] = Math.min(1, cur + step);
          else if (cur > want) alphas[mu][nu] = Math.max(0, cur - step);
        }
      }

      const ctx = applyDpr(canvas, width, height);
      if (ctx) {
        drawScene(ctx, width, height, FLUID_TYPES[fluidIndex], alphas, tokens, palette);
      }

      rafRef.current = requestAnimationFrame(loop);
    };

    rafRef.current = requestAnimationFrame(loop);
    return () => {
      cancelAnimationFrame(rafRef.current);
      lastTimeRef.current = null;
    };
  }, [fluidIndex, tokens, palette, width, height]);

  return (
    <div ref={containerRef} className="relative w-full pb-4">
      <canvas
        ref={canvasRef}
        className={SCENE_CANVAS_CLASS}
        style={{ width, height, display: "block" }}
        aria-label="4×4 stress-energy tensor component grid showing T_{μν}. Cells are colour-coded: cyan for energy density T_{00}, magenta for momentum density T_{0i}, amber for pressure T_{ii}, and purple for shear stress T_{ij}. A fluid-type selector cycles through vacuum, dust, perfect fluid, and EM field."
      />
      <div className="mt-3 flex items-center gap-3 font-mono text-xs text-[var(--color-fg-1)]">
        <span className="shrink-0 text-[var(--color-fg-3)]">fluid type:</span>
        {FLUID_LABELS.map((label, i) => (
          <button
            key={label}
            onClick={() => setFluidIndex(i)}
            className={`px-3 py-1 rounded border transition-colors ${
              i === fluidIndex
                ? "border-[var(--color-fg-2)] text-[var(--color-fg-0)] bg-[var(--color-fg-4)]/40"
                : "border-[var(--color-fg-4)] text-[var(--color-fg-3)] hover:text-[var(--color-fg-1)] hover:border-[var(--color-fg-3)]"
            }`}
          >
            {label}
          </button>
        ))}
      </div>
      <p className="mt-2 font-mono text-[10px] text-[var(--color-fg-3)]">
        Highlighted cells are non-zero for the selected matter type. T_{"{μν}"} is symmetric: T_{"{μν}"} = T_{"{νμ}"}.
      </p>
    </div>
  );
}
