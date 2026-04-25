"use client";

import { useEffect, useRef, useState } from "react";
import { useAnimationFrame } from "@/lib/animation/use-animation-frame";
import { useThemeColors } from "@/lib/hooks/use-theme-colors";

/**
 * FIG.60a — F^{μν} as a labeled 4×4 antisymmetric grid.
 *
 *                ⎡   0      Eₓ/c    Eᵧ/c    E_z/c ⎤
 *      F^{μν} =  ⎢ −Eₓ/c     0      −B_z     Bᵧ   ⎥
 *                ⎢ −Eᵧ/c    B_z      0      −Bₓ   ⎥
 *                ⎣ −E_z/c  −Bᵧ      Bₓ       0    ⎦
 *
 *   • Magenta cells — E components (top row + first column).
 *   • Cyan cells    — B components (lower-right 3×3 block).
 *   • Lilac border  — currently-hovered cell + its antisymmetric partner.
 *   • Diagonal cells stay 0 throughout.
 *
 * Three preset toggles let the viewer switch between "pure E in x",
 * "pure B in z", and a "general field" — the cell numbers update live so
 * you can see exactly which six numbers carry the physics in each case.
 */

const RATIO = 0.7;
const MAX_HEIGHT = 460;

type Preset = "Ex" | "Bz" | "general";

interface Cell {
  i: number;
  j: number;
  label: string;
  kind: "zero" | "E" | "B";
  // Computed numerical value for current preset.
  value: number;
}

function presetFields(p: Preset): { Ex: number; Ey: number; Ez: number; Bx: number; By: number; Bz: number } {
  if (p === "Ex") return { Ex: 1.0, Ey: 0, Ez: 0, Bx: 0, By: 0, Bz: 0 };
  if (p === "Bz") return { Ex: 0, Ey: 0, Ez: 0, Bx: 0, By: 0, Bz: 1.0 };
  return { Ex: 0.6, Ey: -0.4, Ez: 0.3, Bx: 0.5, By: -0.7, Bz: 0.4 };
}

function buildCells(p: Preset): Cell[] {
  const f = presetFields(p);
  // Display Ex/c etc. as "Eₓ", numerical value c-normalised so the cell
  // numbers are O(1) — we are showing structure, not SI units.
  const cells: Cell[] = [];
  // labels — diagonal zero, top row E_i, first col -E_i, off-diag -ε_{ijk}B_k
  const labels: { lbl: string; v: number; kind: "zero" | "E" | "B" }[][] = [
    [
      { lbl: "0", v: 0, kind: "zero" },
      { lbl: "Eₓ/c", v: f.Ex, kind: "E" },
      { lbl: "Eᵧ/c", v: f.Ey, kind: "E" },
      { lbl: "E_z/c", v: f.Ez, kind: "E" },
    ],
    [
      { lbl: "−Eₓ/c", v: -f.Ex, kind: "E" },
      { lbl: "0", v: 0, kind: "zero" },
      { lbl: "−B_z", v: -f.Bz, kind: "B" },
      { lbl: "Bᵧ", v: f.By, kind: "B" },
    ],
    [
      { lbl: "−Eᵧ/c", v: -f.Ey, kind: "E" },
      { lbl: "B_z", v: f.Bz, kind: "B" },
      { lbl: "0", v: 0, kind: "zero" },
      { lbl: "−Bₓ", v: -f.Bx, kind: "B" },
    ],
    [
      { lbl: "−E_z/c", v: -f.Ez, kind: "E" },
      { lbl: "−Bᵧ", v: -f.By, kind: "B" },
      { lbl: "Bₓ", v: f.Bx, kind: "B" },
      { lbl: "0", v: 0, kind: "zero" },
    ],
  ];
  for (let i = 0; i < 4; i++) {
    for (let j = 0; j < 4; j++) {
      cells.push({ i, j, ...labels[i][j], label: labels[i][j].lbl, value: labels[i][j].v });
    }
  }
  return cells;
}

export function FieldTensorGridScene() {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const colors = useThemeColors();

  const [preset, setPreset] = useState<Preset>("general");
  const presetRef = useRef(preset);
  useEffect(() => {
    presetRef.current = preset;
  }, [preset]);

  const [hover, setHover] = useState<{ i: number; j: number } | null>(null);
  const hoverRef = useRef(hover);
  useEffect(() => {
    hoverRef.current = hover;
  }, [hover]);

  const [size, setSize] = useState({ width: 640, height: 440 });
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
    onFrame: () => {
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

      const cells = buildCells(presetRef.current);

      // Layout: square grid, centred horizontally, with 16px margin top
      // for the row-index labels and 32px on the left for the column-index
      // labels.
      const padTop = 38;
      const padLeft = 50;
      const gridSize = Math.min(width - padLeft - 20, height - padTop - 16);
      const cell = gridSize / 4;
      const x0 = (width - gridSize) / 2 + (padLeft - 20) / 2;
      const y0 = padTop;

      // Greek index labels along top + left
      ctx.fillStyle = colors.fg2;
      ctx.font = "11px monospace";
      ctx.textAlign = "center";
      const greek = ["0", "1", "2", "3"];
      for (let j = 0; j < 4; j++) {
        ctx.fillText(`ν=${greek[j]}`, x0 + cell * (j + 0.5), y0 - 8);
      }
      ctx.textAlign = "right";
      for (let i = 0; i < 4; i++) {
        ctx.fillText(`μ=${greek[i]}`, x0 - 6, y0 + cell * (i + 0.5) + 4);
      }

      // Cells
      const h = hoverRef.current;
      for (const c of cells) {
        const x = x0 + c.j * cell;
        const y = y0 + c.i * cell;

        // background fill — palette by kind
        let fill = "rgba(255,255,255,0.02)";
        if (c.kind === "E") fill = `rgba(255, 106, 222, ${0.05 + Math.abs(c.value) * 0.18})`;
        else if (c.kind === "B") fill = `rgba(116, 220, 255, ${0.05 + Math.abs(c.value) * 0.18})`;
        ctx.fillStyle = fill;
        ctx.fillRect(x + 1, y + 1, cell - 2, cell - 2);

        // hover-pair lilac border
        const isHover = h && h.i === c.i && h.j === c.j;
        const isPair = h && h.i === c.j && h.j === c.i && (h.i !== c.i || h.j !== c.j);
        if (isHover || isPair) {
          ctx.strokeStyle = "rgba(200, 160, 255, 0.95)";
          ctx.lineWidth = 2;
          ctx.strokeRect(x + 1.5, y + 1.5, cell - 3, cell - 3);
        } else {
          ctx.strokeStyle = colors.fg3;
          ctx.lineWidth = 0.7;
          ctx.strokeRect(x + 0.5, y + 0.5, cell - 1, cell - 1);
        }

        // label (top, smaller) and numerical value (bottom)
        ctx.fillStyle = c.kind === "zero" ? colors.fg3 : colors.fg1;
        ctx.font = "12px monospace";
        ctx.textAlign = "center";
        ctx.fillText(c.label, x + cell / 2, y + cell / 2 - 4);

        if (c.kind !== "zero") {
          ctx.fillStyle = colors.fg2;
          ctx.font = "10px monospace";
          ctx.fillText(c.value.toFixed(2), x + cell / 2, y + cell / 2 + 14);
        }
      }

      // legend (bottom)
      ctx.font = "10px monospace";
      ctx.textAlign = "left";
      const lx = x0;
      const ly = y0 + gridSize + 16;
      ctx.fillStyle = "rgba(255,106,222,0.9)";
      ctx.fillRect(lx, ly - 8, 10, 10);
      ctx.fillStyle = colors.fg2;
      ctx.fillText("E components (top row + first column)", lx + 14, ly);

      ctx.fillStyle = "rgba(116,220,255,0.9)";
      ctx.fillRect(lx + 250, ly - 8, 10, 10);
      ctx.fillStyle = colors.fg2;
      ctx.fillText("B components (3×3 block)", lx + 264, ly);

      // Hover hint top-right
      if (h) {
        ctx.fillStyle = colors.fg2;
        ctx.font = "10px monospace";
        ctx.textAlign = "right";
        const cellHover = cells[h.i * 4 + h.j];
        const partner = cells[h.j * 4 + h.i];
        ctx.fillText(
          `F^{${h.i}${h.j}} = ${cellHover.label}   ↔   F^{${h.j}${h.i}} = ${partner.label}`,
          width - 8,
          18,
        );
      }

      // Title
      ctx.fillStyle = colors.fg1;
      ctx.font = "12px monospace";
      ctx.textAlign = "left";
      ctx.fillText("F^{μν}", 8, 18);
    },
  });

  function handleMouse(e: React.MouseEvent<HTMLCanvasElement>) {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const px = e.clientX - rect.left;
    const py = e.clientY - rect.top;
    const padTop = 38;
    const padLeft = 50;
    const { width, height } = size;
    const gridSize = Math.min(width - padLeft - 20, height - padTop - 16);
    const cell = gridSize / 4;
    const x0 = (width - gridSize) / 2 + (padLeft - 20) / 2;
    const y0 = padTop;
    const j = Math.floor((px - x0) / cell);
    const i = Math.floor((py - y0) / cell);
    if (i >= 0 && i < 4 && j >= 0 && j < 4) {
      setHover({ i, j });
    } else {
      setHover(null);
    }
  }

  return (
    <div ref={containerRef} className="w-full pb-4">
      <canvas
        ref={canvasRef}
        style={{ width: size.width, height: size.height }}
        className="block cursor-crosshair"
        onMouseMove={handleMouse}
        onMouseLeave={() => setHover(null)}
      />
      <div className="mt-2 flex items-center gap-2 px-2 text-xs">
        <span className="text-[var(--color-fg-3)]">preset:</span>
        {([
          ["Ex", "pure E in x"],
          ["Bz", "pure B in z"],
          ["general", "general field"],
        ] as const).map(([key, label]) => (
          <button
            key={key}
            onClick={() => setPreset(key)}
            className={`rounded border px-2 py-1 font-mono ${
              preset === key
                ? "border-[#FF6ADE] text-[var(--color-fg-1)]"
                : "border-[var(--color-fg-3)] text-[var(--color-fg-2)] hover:text-[var(--color-fg-1)]"
            }`}
          >
            {label}
          </button>
        ))}
      </div>
      <div className="mt-1 px-2 text-xs text-[var(--color-fg-3)]">
        Hover any cell to highlight its antisymmetric partner. Diagonal stays 0.
      </div>
    </div>
  );
}
