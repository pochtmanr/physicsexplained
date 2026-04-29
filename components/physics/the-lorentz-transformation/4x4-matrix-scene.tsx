"use client";

import { useMemo, useState } from "react";
import { boostX, gamma } from "@/lib/physics/relativity/types";

/**
 * FIG.08c — The 4×4 Lorentz boost matrix Λ as a live grid.
 *
 *   Λ(β) = ⎛  γ      −γβ    0   0 ⎞
 *          ⎜ −γβ      γ     0   0 ⎟
 *          ⎜  0       0     1   0 ⎟
 *          ⎝  0       0     0   1 ⎠
 *
 * β slider drives γ; γ-bearing cells light up. Click a row to highlight
 * "what happens to (t', x', y', z') under this boost"; the corresponding
 * row equation is displayed below.
 *
 * The y and z rows/columns are static (boost is purely along x). The
 * upper-left 2×2 block is the live part — that is the "interesting"
 * sub-matrix encoding the Lorentz mixing of t and x.
 */

const LABELS = ["t'", "x'", "y'", "z'"] as const;
const SOURCES = ["c·t", "x", "y", "z"] as const;

const ROW_FORMULAS: Record<number, (g: number, b: number) => string> = {
  0: (g, b) => `c·t' = ${g.toFixed(3)}·c·t + ${(-g * b).toFixed(3)}·x`,
  1: (g, b) => `x'   = ${(-g * b).toFixed(3)}·c·t + ${g.toFixed(3)}·x`,
  2: () => `y'   = y`,
  3: () => `z'   = z`,
};

export function LorentzMatrixScene() {
  const [beta, setBeta] = useState(0.5);
  const [activeRow, setActiveRow] = useState<number | null>(null);

  const M = useMemo(() => boostX(beta), [beta]);
  const g = gamma(beta);

  return (
    <div className="flex flex-col items-center gap-4 p-4">
      <div className="flex w-full max-w-[600px] flex-col items-center gap-2">
        <div className="font-mono text-xs uppercase tracking-wider text-white/55">
          Λ(β) — the boost matrix that replaces Galileo
        </div>
        <div className="font-mono text-xs text-white/70">
          β = {beta.toFixed(2)}    γ = {g.toFixed(4)}    γβ = {(g * beta).toFixed(4)}
        </div>
      </div>

      {/* The 4×4 grid */}
      <div className="rounded-lg border border-white/10 bg-black/40 p-4">
        <div
          className="grid gap-1 font-mono text-xs"
          style={{
            gridTemplateColumns: "auto repeat(4, minmax(74px, 1fr))",
          }}
        >
          {/* Header row: column labels */}
          <div />
          {SOURCES.map((s) => (
            <div
              key={s}
              className="text-center font-mono text-[11px] text-white/45"
            >
              {s}
            </div>
          ))}

          {/* 4 body rows */}
          {[0, 1, 2, 3].map((i) => (
            <RowBlock
              key={i}
              i={i}
              row={M[i]}
              isActive={activeRow === i}
              onClick={() =>
                setActiveRow((prev) => (prev === i ? null : i))
              }
            />
          ))}
        </div>
      </div>

      {/* Active-row explanation */}
      <div className="min-h-[36px] w-full max-w-[600px] rounded-md border border-white/10 bg-white/5 px-3 py-2 font-mono text-xs text-white/85">
        {activeRow === null
          ? "click a row to read off the transform of that primed coordinate"
          : ROW_FORMULAS[activeRow](g, beta)}
      </div>

      {/* β slider */}
      <label className="flex w-full max-w-[600px] items-center gap-3 font-mono text-xs text-white/70">
        <span className="w-24">β = {beta.toFixed(2)}</span>
        <input
          type="range"
          min={0}
          max={0.95}
          step={0.01}
          value={beta}
          onChange={(e) => setBeta(parseFloat(e.target.value))}
          className="flex-1"
        />
      </label>

      <p className="max-w-[640px] text-center font-mono text-[11px] leading-relaxed text-white/55">
        The upper-left 2×2 block carries all the relativistic mixing. The y
        and z rows/columns are inert — the boost is purely along x.
      </p>
    </div>
  );
}

function RowBlock({
  i,
  row,
  isActive,
  onClick,
}: {
  i: number;
  row: readonly [number, number, number, number];
  isActive: boolean;
  onClick: () => void;
}) {
  return (
    <>
      <button
        type="button"
        onClick={onClick}
        className={`flex h-12 items-center justify-center rounded font-mono text-[11px] transition ${
          isActive
            ? "bg-fuchsia-500/20 text-white"
            : "text-white/45 hover:bg-white/5 hover:text-white/85"
        }`}
      >
        {LABELS[i]}
      </button>
      {row.map((v, j) => (
        <Cell
          key={j}
          value={v}
          row={i}
          col={j}
          highlightRow={isActive}
        />
      ))}
    </>
  );
}

function Cell({
  value,
  row,
  col,
  highlightRow,
}: {
  value: number;
  row: number;
  col: number;
  highlightRow: boolean;
}) {
  const isLive = (row === 0 || row === 1) && (col === 0 || col === 1);
  const isZero = Math.abs(value) < 1e-9;
  const isOne = Math.abs(value - 1) < 1e-9 && !isLive;
  const intensity = isLive ? Math.min(1, Math.abs(value)) : 0;

  // Color: cyan for the +γ entries (diagonal of the 2×2 block); magenta for
  // −γβ off-diagonal entries; muted for the y, z block; neutral for zeros.
  let bg = "rgba(255,255,255,0.04)";
  let textColor = "text-white/60";
  if (isLive && row === col) {
    bg = `rgba(103, 232, 249, ${0.18 + 0.45 * intensity})`;
    textColor = "text-cyan-200";
  } else if (isLive && row !== col && !isZero) {
    bg = `rgba(255, 106, 222, ${0.18 + 0.45 * intensity})`;
    textColor = "text-fuchsia-200";
  } else if (isOne) {
    bg = "rgba(255,255,255,0.1)";
    textColor = "text-white/85";
  }
  if (highlightRow) {
    bg =
      bg === "rgba(255,255,255,0.04)"
        ? "rgba(255,255,255,0.08)"
        : bg;
  }

  return (
    <div
      className={`flex h-12 items-center justify-center rounded ${textColor} font-mono`}
      style={{ background: bg, transition: "background 120ms" }}
    >
      <span className="text-[12px]">
        {isZero ? "0" : isOne ? "1" : value.toFixed(3)}
      </span>
    </div>
  );
}
