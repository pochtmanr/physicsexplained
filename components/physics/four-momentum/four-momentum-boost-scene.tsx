"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  fourMomentum,
  boostFourMomentum,
  minkowskiNormSquared,
} from "@/lib/physics/relativity/four-momentum";
import { gamma } from "@/lib/physics/relativity/types";

/**
 * FIG.16b — A four-momentum's components mix under a Lorentz boost,
 *           but its Minkowski norm m²c² stays put.
 *
 *   Lab particle: rest mass m = 1, moving at v_lab = (0.4 c, 0, 0). Its
 *   lab-frame four-momentum p^μ_lab = (γ_lab m c, γ_lab m v, 0, 0).
 *
 *   The β slider boosts to a new frame moving at +β along x. The boosted
 *   four-momentum p'^μ = Λ(β) p^μ_lab is computed and rendered as a
 *   4-component column. The components mix; the invariant
 *   p^μ p_μ = (E/c)² − |p|² stays at m²c² for every β.
 *
 *   The HUD prints the invariant in both frames so the reader can watch the
 *   columns swap values while the bottom line stays constant.
 *
 *   Palette: cyan = lab frame; magenta = boosted frame; amber = the
 *   invariant displayed below.
 */

const WIDTH = 720;
const HEIGHT = 380;

// Natural units inside this scene. m = 1, c = 1.
const M = 1;
const C = 1;
const V_LAB = 0.4; // lab-frame particle velocity along +x

// Component labels
const LABELS = ["E/c", "p_x", "p_y", "p_z"] as const;

export function FourMomentumBoostScene() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [beta, setBeta] = useState(0.5);

  const pLab = useMemo(
    () => fourMomentum(M, { x: V_LAB, y: 0, z: 0 }, C),
    [],
  );

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const dpr = window.devicePixelRatio || 1;
    canvas.width = WIDTH * dpr;
    canvas.height = HEIGHT * dpr;
    canvas.style.width = `${WIDTH}px`;
    canvas.style.height = `${HEIGHT}px`;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, WIDTH, HEIGHT);

    const pBoost = boostFourMomentum(pLab, beta);
    const normLab = minkowskiNormSquared(pLab);
    const normBoost = minkowskiNormSquared(pBoost);
    const g = gamma(beta);
    const gLab = 1 / Math.sqrt(1 - V_LAB * V_LAB);

    // Two columns of 4-component vectors, side by side.
    const colWidth = 160;
    const rowHeight = 50;
    const tableTop = 70;

    const labLeftX = 130;
    const boostLeftX = WIDTH - colWidth - 130;

    // Column headers
    ctx.font = "12px ui-monospace, monospace";
    ctx.fillStyle = "#67E8F9";
    ctx.textAlign = "center";
    ctx.fillText("LAB FRAME", labLeftX + colWidth / 2, tableTop - 28);
    ctx.fillStyle = "rgba(255,255,255,0.55)";
    ctx.fillText(
      `(particle at v = ${V_LAB.toFixed(2)} c)`,
      labLeftX + colWidth / 2,
      tableTop - 12,
    );

    ctx.fillStyle = "#FF6ADE";
    ctx.fillText("BOOSTED FRAME", boostLeftX + colWidth / 2, tableTop - 28);
    ctx.fillStyle = "rgba(255,255,255,0.55)";
    ctx.fillText(
      `(boosted at β = ${beta.toFixed(2)})`,
      boostLeftX + colWidth / 2,
      tableTop - 12,
    );

    // Render each row
    for (let i = 0; i < 4; i++) {
      const y = tableTop + i * rowHeight;

      // Component label between columns
      ctx.fillStyle = "rgba(255,255,255,0.55)";
      ctx.font = "13px ui-monospace, monospace";
      ctx.textAlign = "center";
      ctx.fillText(LABELS[i], WIDTH / 2, y + 20);

      // Lab cell
      drawCell(ctx, labLeftX, y, colWidth, rowHeight - 8, pLab[i], "#67E8F9");
      // Boosted cell
      drawCell(
        ctx,
        boostLeftX,
        y,
        colWidth,
        rowHeight - 8,
        pBoost[i],
        "#FF6ADE",
      );
    }

    // The Λ arrow between them
    ctx.fillStyle = "rgba(255,255,255,0.65)";
    ctx.font = "13px ui-monospace, monospace";
    ctx.textAlign = "center";
    ctx.fillText("→ Λ(β) →", WIDTH / 2, tableTop + 4 * rowHeight + 4);

    // Invariant footer
    const footerY = HEIGHT - 70;
    ctx.fillStyle = "rgba(251,191,36,0.18)";
    ctx.fillRect(40, footerY, WIDTH - 80, 50);
    ctx.strokeStyle = "rgba(251,191,36,0.5)";
    ctx.strokeRect(40, footerY, WIDTH - 80, 50);

    ctx.fillStyle = "#FBBF24";
    ctx.font = "12px ui-monospace, monospace";
    ctx.textAlign = "center";
    ctx.fillText(
      "INVARIANT:  p^μ p_μ = (E/c)² − |p|² = m²c²",
      WIDTH / 2,
      footerY + 18,
    );
    ctx.fillStyle = "rgba(255,255,255,0.85)";
    ctx.fillText(
      `lab: ${normLab.toFixed(6)}    boosted: ${normBoost.toFixed(6)}    m²c² = ${(M * M * C * C).toFixed(6)}`,
      WIDTH / 2,
      footerY + 36,
    );

    // HUD
    ctx.fillStyle = "rgba(255,255,255,0.55)";
    ctx.font = "11px ui-monospace, monospace";
    ctx.textAlign = "left";
    ctx.fillText(
      `m = 1, c = 1, γ_lab = ${gLab.toFixed(3)}, γ_boost = ${g.toFixed(3)}`,
      40,
      HEIGHT - 8,
    );
  }, [beta, pLab]);

  return (
    <div className="flex flex-col items-center gap-3 p-4">
      <canvas
        ref={canvasRef}
        className="rounded-md border border-white/10 bg-black/40"
      />
      <label className="flex w-full max-w-[640px] items-center gap-3 font-mono text-xs text-white/70">
        <span className="w-24">β = {beta.toFixed(2)}</span>
        <input
          type="range"
          min={-0.95}
          max={0.95}
          step={0.01}
          value={beta}
          onChange={(e) => setBeta(parseFloat(e.target.value))}
          className="flex-1"
        />
      </label>
    </div>
  );
}

function drawCell(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  value: number,
  color: string,
) {
  ctx.fillStyle = "rgba(255,255,255,0.04)";
  ctx.fillRect(x, y, w, h);
  ctx.strokeStyle = "rgba(255,255,255,0.1)";
  ctx.strokeRect(x, y, w, h);

  ctx.fillStyle = color;
  ctx.font = "14px ui-monospace, monospace";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(value.toFixed(4), x + w / 2, y + h / 2);
  ctx.textBaseline = "alphabetic";
}
