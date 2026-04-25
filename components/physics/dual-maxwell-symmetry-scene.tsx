"use client";

import { useEffect, useRef, useState } from "react";
import { useAnimationFrame } from "@/lib/animation/use-animation-frame";
import { useThemeColors } from "@/lib/hooks/use-theme-colors";
import { dualMaxwellEquationLabels } from "@/lib/physics/electromagnetism/monopole";

/**
 * FIG.65a — Maxwell's four equations as a 2×2 grid:
 *
 *   rows: divergence, curl
 *   cols: electric source, magnetic source
 *
 * Standard mode shows the conventional set; the magnetic-source column has
 * one EMPTY cell (∇·B = 0) and one cell where the magnetic source is missing
 * but the time-changing electric field still acts (∇×B has only J_e and ∂E).
 * The empty cell is the asymmetry.
 *
 * Monopole mode swaps in the symmetric four-equation system: the magnetic
 * column is filled by ρ_m, J_m, exactly mirroring the electric column.
 *
 * Palette:
 *   magenta — electric source column
 *   cyan    — magnetic source column (empty in standard mode, lit in monopole mode)
 *   amber   — toggle indicator / accent
 *   pale-grey — borders, axis labels
 */

const RATIO = 0.55;
const MAX_HEIGHT = 380;

const LABELS = dualMaxwellEquationLabels();

interface Cell {
  text: string;
  electric: boolean;
  empty?: boolean;
}

function standardCells(): Cell[][] {
  // [row][col]; row 0 = divergence, row 1 = curl; col 0 = electric, col 1 = magnetic
  return [
    [
      { text: "∇·E = ρ/ε₀", electric: true },
      { text: "∇·B = 0", electric: false, empty: true },
    ],
    [
      {
        text: "∇×B = μ₀J + μ₀ε₀ ∂E/∂t",
        electric: true,
      },
      { text: "∇×E = −∂B/∂t", electric: false },
    ],
  ];
}

function monopoleCells(): Cell[][] {
  return [
    [
      { text: "∇·E = ρₑ/ε₀", electric: true },
      { text: "∇·B = μ₀ρₘ", electric: false },
    ],
    [
      {
        text: "∇×B = μ₀Jₑ + μ₀ε₀ ∂E/∂t",
        electric: true,
      },
      {
        text: "∇×E = −μ₀Jₘ − ∂B/∂t",
        electric: false,
      },
    ],
  ];
}

const STD = standardCells();
const MON = monopoleCells();

export function DualMaxwellSymmetryScene() {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const colors = useThemeColors();

  const [withMonopoles, setWithMonopoles] = useState(false);
  const modeRef = useRef(withMonopoles);
  useEffect(() => {
    modeRef.current = withMonopoles;
  }, [withMonopoles]);

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
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        ctx.scale(dpr, dpr);
      }
      ctx.clearRect(0, 0, width, height);

      const mode = modeRef.current;
      const cells = mode ? MON : STD;

      // Layout
      const padTop = 56;
      const padBottom = 28;
      const padLeft = 110;
      const padRight = 24;
      const gridW = width - padLeft - padRight;
      const gridH = height - padTop - padBottom;
      const cellW = gridW / 2;
      const cellH = gridH / 2;

      // Title
      ctx.fillStyle = colors.fg1;
      ctx.font = "12px monospace";
      ctx.textAlign = "left";
      ctx.fillText(
        mode
          ? "MAXWELL WITH MAGNETIC MONOPOLES (symmetric)"
          : "MAXWELL AS WE KNOW IT (asymmetric)",
        padLeft,
        24,
      );

      // Column headers
      ctx.font = "11px monospace";
      ctx.textAlign = "center";
      ctx.fillStyle = "rgba(255, 106, 222, 0.95)";
      ctx.fillText("ELECTRIC SOURCE", padLeft + cellW * 0.5, padTop - 8);
      ctx.fillStyle = "rgba(120, 220, 255, 0.95)";
      ctx.fillText("MAGNETIC SOURCE", padLeft + cellW * 1.5, padTop - 8);

      // Row labels
      ctx.fillStyle = colors.fg2;
      ctx.textAlign = "right";
      ctx.font = "11px monospace";
      ctx.fillText("DIVERGENCE", padLeft - 12, padTop + cellH * 0.5 + 4);
      ctx.fillText("CURL", padLeft - 12, padTop + cellH * 1.5 + 4);

      // Pulsing alpha for the empty cell — draws the eye
      const pulse = (Math.sin(t * 1.4) + 1) * 0.5; // 0..1

      for (let r = 0; r < 2; r++) {
        for (let c = 0; c < 2; c++) {
          const cell = cells[r][c];
          const x = padLeft + c * cellW;
          const y = padTop + r * cellH;

          const isElectric = cell.electric;
          const baseColor = isElectric
            ? "rgba(255, 106, 222, "
            : "rgba(120, 220, 255, ";

          // Cell background — empty cell pulses amber on standard mode
          if (cell.empty && !mode) {
            const a = (0.10 + 0.18 * pulse).toFixed(3);
            ctx.fillStyle = `rgba(255, 180, 80, ${a})`;
            ctx.fillRect(x + 4, y + 4, cellW - 8, cellH - 8);
          } else {
            ctx.fillStyle = `${baseColor}0.10)`;
            ctx.fillRect(x + 4, y + 4, cellW - 8, cellH - 8);
          }

          // Border
          ctx.strokeStyle = colors.fg3;
          ctx.lineWidth = 1;
          ctx.strokeRect(x + 4.5, y + 4.5, cellW - 9, cellH - 9);

          // Equation text
          ctx.fillStyle = colors.fg1;
          ctx.textAlign = "center";
          ctx.font = "13px monospace";
          ctx.fillText(cell.text, x + cellW * 0.5, y + cellH * 0.5 + 4);

          // Empty-cell badge
          if (cell.empty && !mode) {
            ctx.fillStyle = "rgba(255, 180, 80, 0.95)";
            ctx.font = "10px monospace";
            ctx.fillText(
              "no magnetic source",
              x + cellW * 0.5,
              y + cellH * 0.5 + 22,
            );
          }
        }
      }

      // Footer caption
      ctx.fillStyle = colors.fg2;
      ctx.font = "10px monospace";
      ctx.textAlign = "center";
      ctx.fillText(
        mode
          ? "If monopoles existed: ρₘ sources ∇·B, Jₘ curls E. Symmetric."
          : "Standard Maxwell: the magnetic source column has one empty cell (∇·B = 0).",
        width / 2,
        height - 8,
      );

      // unused but keep label structure handy
      void LABELS;
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
          onClick={() => setWithMonopoles((v) => !v)}
          className="rounded-sm border border-[var(--color-fg-4)] px-3 py-1 text-xs font-mono text-[var(--color-fg-1)] hover:border-[var(--color-fg-3)]"
        >
          {withMonopoles ? "show standard Maxwell" : "show monopole-symmetric Maxwell"}
        </button>
        <span className="text-xs font-mono text-[var(--color-fg-3)]">
          mode: {withMonopoles ? "with magnetic sources" : "no magnetic sources"}
        </span>
      </div>
    </div>
  );
}
