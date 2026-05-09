"use client";

import { useEffect, useRef, useState } from "react";
import {
  perfectFluidRestFrame,
  energyDensity,
  isotropicPressure,
} from "@/lib/physics/relativity/stress-energy";

/**
 * FIG.36b — PERFECT FLUID STRESS-ENERGY
 *
 * A box of fluid with arrows showing:
 *   — the four-velocity u^μ of fluid elements (at rest: vertical time arrows)
 *   — pressure arrows pushing outward on each face
 *
 * Two sliders control energy density ρ and pressure p.
 * The T_{μν} components are displayed numerically in a mini-table.
 *
 * Formula annotated: T_{μν} = (ρ + p/c²) u_μ u_ν − p g_{μν}
 */

const W = 560;
const H = 340;
const BG = "#0A0C12";
const c = 1; // natural units

// Colours
const C_BOX = "rgba(255,255,255,0.12)";
const C_VELOCITY = "#67E8F9";
const C_PRESSURE = "#FBBF24";
const C_ENERGY = "#FF6ADE";

function drawFluid(
  ctx: CanvasRenderingContext2D,
  rho: number,
  p: number,
) {
  ctx.fillStyle = BG;
  ctx.fillRect(0, 0, W, H);

  const T = perfectFluidRestFrame(rho, p, c);
  const boxX = 60;
  const boxY = 60;
  const boxW = 200;
  const boxH = 160;
  const cx = boxX + boxW / 2;
  const cy = boxY + boxH / 2;

  // ── Box ─────────────────────────────────────────────────────────────────
  ctx.strokeStyle = C_BOX;
  ctx.lineWidth = 1.5;
  ctx.strokeRect(boxX, boxY, boxW, boxH);

  // Fill tinted by energy density
  const rhoNorm = Math.min(rho / 3, 1);
  ctx.fillStyle = `rgba(255,106,222,${rhoNorm * 0.10})`;
  ctx.fillRect(boxX, boxY, boxW, boxH);

  // ── Four-velocity arrows (fluid at rest → upward time direction) ───────
  const arrowLen = Math.min(40 + rhoNorm * 30, 65);
  const arrowPositions: [number, number][] = [
    [cx - 50, cy],
    [cx, cy],
    [cx + 50, cy],
  ];
  ctx.strokeStyle = C_VELOCITY;
  ctx.lineWidth = 2;
  for (const [ax, ay] of arrowPositions) {
    // Shaft
    ctx.beginPath();
    ctx.moveTo(ax, ay + arrowLen / 2);
    ctx.lineTo(ax, ay - arrowLen / 2);
    ctx.stroke();
    // Head
    ctx.beginPath();
    ctx.moveTo(ax, ay - arrowLen / 2);
    ctx.lineTo(ax - 5, ay - arrowLen / 2 + 10);
    ctx.moveTo(ax, ay - arrowLen / 2);
    ctx.lineTo(ax + 5, ay - arrowLen / 2 + 10);
    ctx.stroke();
  }

  // u^μ label
  ctx.fillStyle = C_VELOCITY;
  ctx.font = "10px ui-monospace, monospace";
  ctx.textAlign = "center";
  ctx.textBaseline = "bottom";
  ctx.fillText("u^μ (at rest)", cx, boxY - 8);

  // Time axis label
  ctx.fillStyle = "rgba(255,255,255,0.30)";
  ctx.font = "9px ui-monospace, monospace";
  ctx.fillText("↑ t", cx + 90, cy - 10);

  // ── Pressure arrows (outward on all four spatial faces) ─────────────────
  const pNorm = Math.min(p / 3, 1);
  const pLen = Math.max(pNorm * 50, 4);
  const pAlpha = 0.4 + pNorm * 0.55;

  if (p > 0.01) {
    ctx.strokeStyle = `rgba(251,191,36,${pAlpha})`;
    ctx.lineWidth = 2;

    // Left face
    const drawArrow = (x1: number, y1: number, x2: number, y2: number) => {
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.stroke();
      const angle = Math.atan2(y2 - y1, x2 - x1);
      ctx.beginPath();
      ctx.moveTo(x2, y2);
      ctx.lineTo(x2 - 8 * Math.cos(angle - 0.4), y2 - 8 * Math.sin(angle - 0.4));
      ctx.moveTo(x2, y2);
      ctx.lineTo(x2 - 8 * Math.cos(angle + 0.4), y2 - 8 * Math.sin(angle + 0.4));
      ctx.stroke();
    };

    // Four faces (2D box projection: left, right, top, bottom)
    drawArrow(boxX, cy, boxX - pLen, cy);
    drawArrow(boxX + boxW, cy, boxX + boxW + pLen, cy);
    drawArrow(cx, boxY, cx, boxY - pLen);
    drawArrow(cx, boxY + boxH, cx, boxY + boxH + pLen);

    ctx.fillStyle = C_PRESSURE;
    ctx.font = "10px ui-monospace, monospace";
    ctx.textAlign = "left";
    ctx.textBaseline = "middle";
    ctx.fillText("p", boxX + boxW + pLen + 5, cy);
  }

  // ── Numerical component table ─────────────────────────────────────────────
  const tableX = 295;
  const tableY = 55;
  const colW = 58;
  const rowH = 38;

  ctx.font = "bold 10px ui-monospace, monospace";
  ctx.fillStyle = "rgba(255,255,255,0.55)";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("T_{μν}", tableX + colW * 2, tableY - 14);

  const displayT = [
    [T[0][0], T[0][1]],
    [T[1][0], T[1][1]],
  ];
  const cellLabels = [
    ["T₀₀", "T₀₁"],
    ["T₁₀", "T₁₁"],
  ];
  const cellColors = [
    [C_ENERGY, "rgba(255,255,255,0.20)"],
    ["rgba(255,255,255,0.20)", C_PRESSURE],
  ];
  const cellDescs = [
    ["ρc²", "0"],
    ["0", "p"],
  ];

  for (let mu = 0; mu < 2; mu++) {
    for (let nu = 0; nu < 2; nu++) {
      const cx2 = tableX + nu * colW + colW / 2;
      const cy2 = tableY + mu * rowH + rowH / 2;

      // Cell bg
      const isActive = displayT[mu][nu] !== 0;
      ctx.fillStyle = isActive ? "rgba(255,255,255,0.05)" : "rgba(255,255,255,0.02)";
      ctx.fillRect(tableX + nu * colW, tableY + mu * rowH, colW, rowH);
      ctx.strokeStyle = isActive ? "rgba(255,255,255,0.20)" : "rgba(255,255,255,0.07)";
      ctx.lineWidth = 1;
      ctx.strokeRect(tableX + nu * colW, tableY + mu * rowH, colW, rowH);

      ctx.fillStyle = cellColors[mu][nu];
      ctx.font = "9px ui-monospace, monospace";
      ctx.textAlign = "center";
      ctx.textBaseline = "top";
      ctx.fillText(cellLabels[mu][nu], cx2, tableY + mu * rowH + 3);

      ctx.fillStyle = isActive ? "rgba(255,255,255,0.85)" : "rgba(255,255,255,0.25)";
      ctx.font = "bold 11px ui-monospace, monospace";
      ctx.textBaseline = "middle";
      ctx.fillText(displayT[mu][nu].toFixed(2), cx2, cy2 + 6);

      ctx.fillStyle = "rgba(255,255,255,0.35)";
      ctx.font = "8px ui-monospace, monospace";
      ctx.textBaseline = "bottom";
      ctx.fillText(cellDescs[mu][nu], cx2, tableY + (mu + 1) * rowH - 2);
    }
  }

  // Ellipsis for 3×3 spatial block
  ctx.fillStyle = "rgba(255,255,255,0.25)";
  ctx.font = "10px ui-monospace, monospace";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("⋮ spatial diag = p ⋮", tableX + colW, tableY + 2 * rowH + 18);

  // ── Formula annotation ──────────────────────────────────────────────────
  const formulaY = H - 72;
  ctx.fillStyle = "rgba(255,255,255,0.55)";
  ctx.font = "10px ui-monospace, monospace";
  ctx.textAlign = "left";
  ctx.textBaseline = "top";
  ctx.fillText("T_{μν} = (ρ + p/c²) u_μ u_ν − p g_{μν}", 10, formulaY);

  // ── Legend ─────────────────────────────────────────────────────────────
  const legItems = [
    { color: C_VELOCITY, label: "four-velocity u^μ" },
    { color: C_PRESSURE, label: "pressure p" },
    { color: C_ENERGY, label: "energy density T₀₀" },
  ];
  ctx.font = "9px ui-monospace, monospace";
  ctx.textBaseline = "middle";
  let legX = 10;
  const legY = H - 20;
  for (const item of legItems) {
    ctx.fillStyle = item.color;
    ctx.fillRect(legX, legY - 4, 8, 8);
    ctx.fillStyle = "rgba(255,255,255,0.45)";
    ctx.textAlign = "left";
    ctx.fillText(item.label, legX + 12, legY);
    legX += ctx.measureText(item.label).width + 30;
  }

  // ── Numerical readout ─────────────────────────────────────────────────
  const readX = tableX;
  const readY = tableY + 2 * rowH + 40;
  ctx.fillStyle = "rgba(255,255,255,0.45)";
  ctx.font = "9px ui-monospace, monospace";
  ctx.textAlign = "left";
  ctx.textBaseline = "top";
  ctx.fillText(`ε = T₀₀ = ${energyDensity(T).toFixed(3)}  |  p = ${isotropicPressure(T).toFixed(3)}`, readX, readY);
}

export function PerfectFluidScene() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [rho, setRho] = useState(1.5);
  const [p, setP] = useState(0.5);

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

    drawFluid(ctx, rho, p);
  }, [rho, p]);

  return (
    <div className="flex flex-col items-center gap-3">
      <canvas
        ref={canvasRef}
        className="rounded-md border border-white/10 bg-black/40"
      />
      <div className="flex flex-col gap-2 w-full max-w-[560px]">
        <label className="flex items-center gap-3 font-mono text-xs text-white/60">
          <span className="w-32">Energy density ρ</span>
          <input
            type="range"
            min={0}
            max={3}
            step={0.05}
            value={rho}
            onChange={(e) => setRho(Number(e.target.value))}
            className="flex-1 accent-pink-400"
          />
          <span className="w-12 text-right text-white/80">{rho.toFixed(2)}</span>
        </label>
        <label className="flex items-center gap-3 font-mono text-xs text-white/60">
          <span className="w-32">Pressure p</span>
          <input
            type="range"
            min={0}
            max={3}
            step={0.05}
            value={p}
            onChange={(e) => setP(Number(e.target.value))}
            className="flex-1 accent-yellow-400"
          />
          <span className="w-12 text-right text-white/80">{p.toFixed(2)}</span>
        </label>
        <p className="font-mono text-[9px] text-white/30 text-center mt-1">
          Dust: p = 0. Radiation: p = ρc²/3 (trace-free). Vacuum: ρ = p = 0.
        </p>
      </div>
    </div>
  );
}
