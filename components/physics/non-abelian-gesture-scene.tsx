"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useAnimationFrame } from "@/lib/animation/use-animation-frame";
import { useThemeColors } from "@/lib/hooks/use-theme-colors";
import { nonAbelianCommutator } from "@/lib/physics/electromagnetism/gauge-theory";
import type { FieldTensor } from "@/lib/physics/electromagnetism/relativity";

/**
 * FIG.63c — Non-Abelian gesture: [A_μ, A_ν] for U(1) vs SU(N).
 *
 * Three-tile layout. Each tile is a 4×4 grid of small coloured cells
 * representing a tensor component (A_μ, A_ν, or [A_μ, A_ν]). Cell colour
 * encodes the value: magenta for positive, cyan for negative, neutral
 * for zero. The grids are drawn next to one another with literal
 * "•" / "−" / "=" symbols between them.
 *
 *   TILE 1: A_μ
 *   TILE 2: A_ν
 *   TILE 3: [A_μ, A_ν] = A_μ A_ν − A_ν A_μ
 *
 * Toggle: ABELIAN (U(1)) vs NON-ABELIAN (SU(2)-like). In the abelian
 * case A_μ and A_ν are diagonal proxies; their commutator is exactly
 * zero (TILE 3 is uniformly neutral). In the non-abelian case the two
 * tensors are off-diagonal (Pauli-σ-like blocks); their commutator is
 * non-zero and lights up TILE 3 with magenta/cyan cells.
 *
 * The HUD prints the actual commutator computed by nonAbelianCommutator.
 *
 * Palette:
 *   magenta — positive tensor entry
 *   cyan    — negative tensor entry
 *   lilac   — separators / SU(N) marker
 *   amber   — non-abelian highlight on TILE 3
 */

const RATIO = 0.55;
const MAX_HEIGHT = 380;

// ── Two preset gauge configurations.
//
// ABELIAN: A_μ and A_ν are both diagonal-ish (commute). Their commutator
// is exactly the zero tensor.
//
// NON-ABELIAN: A_μ ≈ σ_x ⊗ I and A_ν ≈ σ_y ⊗ I. These don't commute, so
// [A_μ, A_ν] picks up the σ_z-like piece — visually a non-trivial
// pattern in TILE 3.

const A_MU_ABELIAN: FieldTensor = [
  [0.6, 0, 0, 0],
  [0, 0.4, 0, 0],
  [0, 0, 0.2, 0],
  [0, 0, 0, 0.0],
] as const;

const A_NU_ABELIAN: FieldTensor = [
  [0.3, 0, 0, 0],
  [0, 0.5, 0, 0],
  [0, 0, 0.7, 0],
  [0, 0, 0, 0.4],
] as const;

const A_MU_NONABEL: FieldTensor = [
  [0, 0.7, 0, 0],
  [0.7, 0, 0, 0],
  [0, 0, 0, 0.7],
  [0, 0, 0.7, 0],
] as const;

const A_NU_NONABEL: FieldTensor = [
  [0, 0, 0.6, 0],
  [0, 0, 0, 0.6],
  [0.6, 0, 0, 0],
  [0, 0.6, 0, 0],
] as const;

export function NonAbelianGestureScene() {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const colors = useThemeColors();

  const [nonAbelian, setNonAbelian] = useState(true);
  const nonAbelianRef = useRef(nonAbelian);
  useEffect(() => {
    nonAbelianRef.current = nonAbelian;
  }, [nonAbelian]);

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

  // Pre-compute commutators once for each preset.
  const presets = useMemo(() => {
    return {
      abelian: {
        Amu: A_MU_ABELIAN,
        Anu: A_NU_ABELIAN,
        comm: nonAbelianCommutator(A_MU_ABELIAN, A_NU_ABELIAN),
      },
      nonAbelian: {
        Amu: A_MU_NONABEL,
        Anu: A_NU_NONABEL,
        comm: nonAbelianCommutator(A_MU_NONABEL, A_NU_NONABEL),
      },
    };
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

      const preset = nonAbelianRef.current ? presets.nonAbelian : presets.abelian;
      const { Amu, Anu, comm } = preset;

      const padX = 16;
      const tileGap = 28;
      const symbolW = 18;
      const innerW = width - 2 * padX;
      // 3 tiles + 2 separator slots
      const tileW = (innerW - 2 * (tileGap + symbolW)) / 3;
      const tileH = Math.min(tileW, height * 0.55);
      const tileY = height * 0.20;

      const x1 = padX;
      const x2 = x1 + tileW + tileGap;
      const x3 = x2 + symbolW + tileW + tileGap;

      const labelMu = nonAbelianRef.current ? "A_μ  (non-abelian)" : "A_μ  (abelian)";
      const labelNu = nonAbelianRef.current ? "A_ν  (non-abelian)" : "A_ν  (abelian)";

      drawTensorTile(ctx, colors, x1, tileY, tileW, tileH, Amu, labelMu, false);
      // bracket / dot symbol between tile 1 and 2
      drawSymbol(ctx, colors, x1 + tileW + tileGap / 2, tileY + tileH / 2, "·");
      drawTensorTile(ctx, colors, x2, tileY, tileW, tileH, Anu, labelNu, false);
      // = symbol
      drawSymbol(
        ctx,
        colors,
        x2 + tileW + symbolW / 2 + tileGap / 2,
        tileY + tileH / 2,
        "[ , ]",
      );
      drawTensorTile(
        ctx,
        colors,
        x3,
        tileY,
        tileW,
        tileH,
        comm,
        "[A_μ, A_ν]",
        nonAbelianRef.current, // highlight in non-abelian case
      );

      // HUD: max |[A,B]| value
      let maxAbs = 0;
      for (let i = 0; i < 4; i++) {
        for (let j = 0; j < 4; j++) {
          maxAbs = Math.max(maxAbs, Math.abs(comm[i][j]));
        }
      }

      ctx.fillStyle = colors.fg2;
      ctx.font = "11px monospace";
      ctx.textAlign = "left";
      ctx.fillText(
        nonAbelianRef.current
          ? "SU(N): generators do not commute → [A_μ, A_ν] ≠ 0 → gauge bosons self-couple"
          : "U(1): every gauge field commutes with every other → [A_μ, A_ν] = 0 (photon does not radiate photons)",
        padX,
        height - 26,
      );
      ctx.fillStyle = colors.fg2;
      ctx.fillText(
        `max |[A_μ, A_ν]| = ${maxAbs.toFixed(3)}`,
        padX,
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
      <div className="mt-2 flex items-center gap-3 px-2">
        <button
          type="button"
          onClick={() => setNonAbelian((v) => !v)}
          className="rounded border border-[var(--color-fg-4)] px-3 py-1 font-mono text-xs text-[var(--color-fg-1)] hover:bg-[var(--color-bg-2)]"
        >
          {nonAbelian ? "→ switch to U(1) (abelian)" : "→ switch to SU(N) (non-abelian)"}
        </button>
        <span className="ml-2 text-xs font-mono text-[var(--color-fg-3)]">
          {nonAbelian ? "currently SU(N)-like" : "currently U(1)"}
        </span>
      </div>
      <div className="mt-1 px-2 text-xs text-[var(--color-fg-3)]">
        For U(1) the commutator is the zero tensor. For SU(N) it is the
        algebraic shadow of f^abc structure constants — and the reason gluons
        radiate gluons.
      </div>
    </div>
  );
}

function drawTensorTile(
  ctx: CanvasRenderingContext2D,
  colors: { fg1: string; fg2: string; fg3: string },
  x0: number,
  y0: number,
  w: number,
  h: number,
  T: FieldTensor,
  label: string,
  highlight: boolean,
): void {
  // Frame
  ctx.strokeStyle = highlight ? "rgba(255, 180, 80, 0.95)" : colors.fg3;
  ctx.lineWidth = highlight ? 1.6 : 1;
  ctx.strokeRect(x0, y0, w, h);

  // Label
  ctx.fillStyle = highlight ? "rgba(255, 180, 80, 0.95)" : colors.fg1;
  ctx.font = "11px monospace";
  ctx.textAlign = "left";
  ctx.fillText(label, x0, y0 - 8);

  // Determine max magnitude across this tile for normalization.
  let maxAbs = 0;
  for (let i = 0; i < 4; i++) {
    for (let j = 0; j < 4; j++) {
      maxAbs = Math.max(maxAbs, Math.abs(T[i][j]));
    }
  }
  const denom = Math.max(maxAbs, 1e-6);

  const cellW = w / 4;
  const cellH = h / 4;

  for (let i = 0; i < 4; i++) {
    for (let j = 0; j < 4; j++) {
      const v = T[i][j];
      const norm = Math.min(Math.abs(v) / denom, 1);
      const cx = x0 + j * cellW;
      const cy = y0 + i * cellH;
      // Cell fill — magenta for v > 0, cyan for v < 0, faint grey for v ≈ 0
      let fill;
      if (Math.abs(v) < 1e-6) {
        fill = "rgba(180, 170, 200, 0.10)";
      } else if (v > 0) {
        fill = `rgba(255, 106, 222, ${(0.18 + 0.55 * norm).toFixed(3)})`;
      } else {
        fill = `rgba(120, 220, 255, ${(0.18 + 0.55 * norm).toFixed(3)})`;
      }
      ctx.fillStyle = fill;
      ctx.fillRect(cx + 1, cy + 1, cellW - 2, cellH - 2);

      // Cell border
      ctx.strokeStyle = colors.fg3;
      ctx.lineWidth = 0.6;
      ctx.strokeRect(cx, cy, cellW, cellH);
    }
  }

  // Index labels along top and left edges
  ctx.fillStyle = colors.fg2;
  ctx.font = "9px monospace";
  ctx.textAlign = "center";
  for (let j = 0; j < 4; j++) {
    ctx.fillText(`${j}`, x0 + (j + 0.5) * cellW, y0 + h + 12);
  }
  ctx.textAlign = "right";
  for (let i = 0; i < 4; i++) {
    ctx.fillText(`${i}`, x0 - 4, y0 + (i + 0.5) * cellH + 4);
  }
}

function drawSymbol(
  ctx: CanvasRenderingContext2D,
  colors: { fg1: string; fg2: string; fg3: string },
  cx: number,
  cy: number,
  glyph: string,
): void {
  ctx.fillStyle = "rgba(200, 160, 255, 0.85)";
  ctx.font = "bold 14px monospace";
  ctx.textAlign = "center";
  ctx.fillText(glyph, cx, cy + 4);
}
