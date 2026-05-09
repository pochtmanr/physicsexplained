"use client";

import { useEffect, useRef, useState } from "react";

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
 */

const W = 560;
const H = 320;

const BG = "#0A0C12";
const GRID_LINE = "rgba(255,255,255,0.10)";
const LABEL_DIM = "rgba(255,255,255,0.28)";
const LABEL_BRIGHT = "rgba(255,255,255,0.85)";

// Cell highlight colours by semantic meaning
const C_ENERGY = "#67E8F9";  // T_{00}
const C_MOMENTUM = "#FF6ADE"; // T_{0i}, T_{i0}
const C_PRESSURE = "#FBBF24"; // T_{ii}
const C_SHEAR = "#A78BFA";    // T_{ij} i≠j

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
  // plus the EM field has non-zero T_{ij} off-diagonal in general,
  // but for isotropic radiation all components are active except T_{0i}
  const g = off.map((r) => [...r]);
  g[0][0] = true;
  g[1][1] = true;
  g[2][2] = true;
  g[3][3] = true;
  return g;
}

// Returns a representative numerical value for display
function cellValue(mu: number, nu: number, fluid: FluidType): string {
  const rho = 1.0; // normalised energy density
  const p = 1 / 3; // radiation pressure = ρc²/3
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
  void rho; void p;
}

function cellColor(mu: number, nu: number): string {
  if (mu === 0 && nu === 0) return C_ENERGY;
  if (mu === 0 || nu === 0) return C_MOMENTUM;
  if (mu === nu) return C_PRESSURE;
  return C_SHEAR;
}

function cellLabel(mu: number, nu: number): string {
  if (mu === 0 && nu === 0) return "energy\ndensity";
  if (mu === 0 && nu >= 1) return "energy\nflux/c";
  if (mu >= 1 && nu === 0) return "momentum\ndensity";
  if (mu === nu) return "pressure";
  return "shear\nstress";
}

const INDEX_LABELS = ["0 (t)", "1 (x)", "2 (y)", "3 (z)"];

function drawScene(
  ctx: CanvasRenderingContext2D,
  fluid: FluidType,
) {
  ctx.fillStyle = BG;
  ctx.fillRect(0, 0, W, H);

  const marginLeft = 54;
  const marginTop = 54;
  const cellW = (W - marginLeft - 18) / 4;
  const cellH = (H - marginTop - 18) / 4;

  const active = activeCells(fluid);

  // Header row & column labels
  ctx.font = "10px ui-monospace, monospace";
  ctx.fillStyle = LABEL_DIM;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";

  // Column headers (ν)
  for (let nu = 0; nu < 4; nu++) {
    const cx = marginLeft + nu * cellW + cellW / 2;
    ctx.fillText(`ν=${INDEX_LABELS[nu]}`, cx, marginTop / 2 - 4);
  }

  // Row headers (μ)
  ctx.save();
  ctx.textAlign = "right";
  for (let mu = 0; mu < 4; mu++) {
    const cy = marginTop + mu * cellH + cellH / 2;
    ctx.fillText(`μ=${INDEX_LABELS[mu]}`, marginLeft - 8, cy);
  }
  ctx.restore();

  // Axis labels
  ctx.fillStyle = "rgba(255,255,255,0.40)";
  ctx.font = "9px ui-monospace, monospace";
  ctx.textAlign = "center";
  ctx.fillText("ν →", marginLeft + 2 * cellW, marginTop - 18);
  ctx.save();
  ctx.translate(14, marginTop + 2 * cellH);
  ctx.rotate(-Math.PI / 2);
  ctx.fillText("μ ↓", 0, 0);
  ctx.restore();

  // Cells
  for (let mu = 0; mu < 4; mu++) {
    for (let nu = 0; nu < 4; nu++) {
      const x = marginLeft + nu * cellW;
      const y = marginTop + mu * cellH;
      const isActive = active[mu][nu];
      const color = cellColor(mu, nu);

      // Cell background
      if (isActive) {
        ctx.fillStyle = color.replace("#", "rgba(") + "1a)";
        // Use proper rgba syntax
        const hex = color.slice(1);
        const r = parseInt(hex.slice(0, 2), 16);
        const g2 = parseInt(hex.slice(2, 4), 16);
        const b = parseInt(hex.slice(4, 6), 16);
        ctx.fillStyle = `rgba(${r},${g2},${b},0.13)`;
      } else {
        ctx.fillStyle = "rgba(255,255,255,0.02)";
      }
      ctx.fillRect(x + 1, y + 1, cellW - 2, cellH - 2);

      // Cell border
      ctx.strokeStyle = isActive
        ? (() => {
            const hex = color.slice(1);
            const r = parseInt(hex.slice(0, 2), 16);
            const g2 = parseInt(hex.slice(2, 4), 16);
            const b = parseInt(hex.slice(4, 6), 16);
            return `rgba(${r},${g2},${b},0.55)`;
          })()
        : GRID_LINE;
      ctx.lineWidth = isActive ? 1.5 : 1;
      ctx.strokeRect(x + 1, y + 1, cellW - 2, cellH - 2);

      // T_{μν} index label
      ctx.fillStyle = isActive ? color : LABEL_DIM;
      ctx.font = `bold ${isActive ? 11 : 10}px ui-monospace, monospace`;
      ctx.textAlign = "center";
      ctx.textBaseline = "top";
      ctx.fillText(`T${mu}${nu}`, x + cellW / 2, y + 5);

      // Value label
      ctx.font = "10px ui-monospace, monospace";
      ctx.fillStyle = isActive ? "rgba(255,255,255,0.90)" : "rgba(255,255,255,0.20)";
      ctx.textBaseline = "middle";
      ctx.fillText(cellValue(mu, nu, fluid), x + cellW / 2, y + cellH / 2 + 4);

      // Semantic label (two lines)
      const sem = cellLabel(mu, nu);
      const lines = sem.split("\n");
      ctx.font = "8px ui-monospace, monospace";
      ctx.fillStyle = isActive
        ? (() => {
            const hex = color.slice(1);
            const r = parseInt(hex.slice(0, 2), 16);
            const g2 = parseInt(hex.slice(2, 4), 16);
            const b = parseInt(hex.slice(4, 6), 16);
            return `rgba(${r},${g2},${b},0.75)`;
          })()
        : "rgba(255,255,255,0.15)";
      ctx.textBaseline = "bottom";
      ctx.fillText(lines[0], x + cellW / 2, y + cellH - 12);
      if (lines[1]) {
        ctx.fillText(lines[1], x + cellW / 2, y + cellH - 2);
      }
    }
  }

  // Legend
  const legend = [
    { color: C_ENERGY, label: "T₀₀ — energy density" },
    { color: C_MOMENTUM, label: "T₀ᵢ — momentum density" },
    { color: C_PRESSURE, label: "Tᵢᵢ — pressure" },
    { color: C_SHEAR, label: "Tᵢⱼ — shear stress" },
  ];
  const legY = H - 12;
  const legSpacing = (W - 20) / legend.length;
  ctx.font = "8px ui-monospace, monospace";
  ctx.textBaseline = "bottom";
  for (let i = 0; i < legend.length; i++) {
    const lx = 10 + i * legSpacing;
    const hex = legend[i].color.slice(1);
    const r = parseInt(hex.slice(0, 2), 16);
    const g2 = parseInt(hex.slice(2, 4), 16);
    const b = parseInt(hex.slice(4, 6), 16);
    ctx.fillStyle = `rgba(${r},${g2},${b},0.85)`;
    ctx.textAlign = "left";
    ctx.fillRect(lx, legY - 9, 8, 8);
    ctx.fillStyle = "rgba(255,255,255,0.50)";
    ctx.fillText(legend[i].label, lx + 12, legY);
  }
}

export function StressEnergyComponentsScene() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [fluidIndex, setFluidIndex] = useState(2); // default: perfect fluid

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = typeof window !== "undefined" ? window.devicePixelRatio || 1 : 1;
    canvas.width = W * dpr;
    canvas.height = H * dpr;
    canvas.style.width = `${W}px`;
    canvas.style.height = `${H}px`;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    drawScene(ctx, FLUID_TYPES[fluidIndex]);
  }, [fluidIndex]);

  return (
    <div className="flex flex-col items-center gap-4">
      <canvas
        ref={canvasRef}
        className="rounded-md border border-white/10 bg-black/40"
      />
      <div className="flex flex-col items-center gap-2">
        <div className="flex gap-6">
          {FLUID_LABELS.map((label, i) => (
            <button
              key={label}
              onClick={() => setFluidIndex(i)}
              className={`font-mono text-xs px-3 py-1 rounded border transition-colors ${
                i === fluidIndex
                  ? "border-white/40 text-white bg-white/10"
                  : "border-white/10 text-white/40 hover:text-white/60 hover:border-white/20"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
        <p className="font-mono text-[10px] text-white/40 max-w-[560px] text-center">
          Highlighted cells are non-zero for the selected matter type. T_{"{μν}"} is symmetric: T_{"{μν}"} = T_{"{νμ}"}.
        </p>
      </div>
    </div>
  );
}
