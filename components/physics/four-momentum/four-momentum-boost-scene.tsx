"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  fourMomentum,
  boostFourMomentum,
  minkowskiNormSquared,
} from "@/lib/physics/relativity/four-momentum";
import { gamma } from "@/lib/physics/relativity/types";
import {
  applyDpr,
  hexToRgba,
  SCENE_CANVAS_CLASS,
  SCENE_HEIGHT_DEFAULT,
  useSceneSize,
  useSceneTokens,
  type SceneTokens,
} from "@/components/physics/_shared/scene-tokens";

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

// Natural units inside this scene. m = 1, c = 1.
const M = 1;
const C = 1;
const V_LAB = 0.4; // lab-frame particle velocity along +x

// Component labels
const LABELS = ["E/c", "p_x", "p_y", "p_z"] as const;

export function FourMomentumBoostScene() {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const tokens = useSceneTokens();
  const { width, height } = useSceneSize(containerRef, {
    ratio: 0.55,
    maxHeight: SCENE_HEIGHT_DEFAULT,
  });
  const [beta, setBeta] = useState(0.5);

  const pLab = useMemo(
    () => fourMomentum(M, { x: V_LAB, y: 0, z: 0 }, C),
    [],
  );

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = applyDpr(canvas, width, height);
    if (!ctx) return;
    ctx.clearRect(0, 0, width, height);

    ctx.fillStyle = tokens.bg;
    ctx.fillRect(0, 0, width, height);

    const pBoost = boostFourMomentum(pLab, beta);
    const normLab = minkowskiNormSquared(pLab);
    const normBoost = minkowskiNormSquared(pBoost);
    const g = gamma(beta);
    const gLab = 1 / Math.sqrt(1 - V_LAB * V_LAB);

    // Two columns of 4-component vectors, side by side.
    const colWidth = Math.min(160, width * 0.22);
    const rowHeight = 50;
    const tableTop = 70;

    const sidePad = Math.max(40, width * 0.12);
    const labLeftX = sidePad;
    const boostLeftX = width - colWidth - sidePad;

    // Column headers
    ctx.font = tokens.fontHud;
    ctx.fillStyle = tokens.cyan;
    ctx.textAlign = "center";
    ctx.fillText("LAB FRAME", labLeftX + colWidth / 2, tableTop - 28);
    ctx.fillStyle = tokens.textMute;
    ctx.fillText(
      `(particle at v = ${V_LAB.toFixed(2)} c)`,
      labLeftX + colWidth / 2,
      tableTop - 12,
    );

    ctx.fillStyle = tokens.magenta;
    ctx.fillText("BOOSTED FRAME", boostLeftX + colWidth / 2, tableTop - 28);
    ctx.fillStyle = tokens.textMute;
    ctx.fillText(
      `(boosted at β = ${beta.toFixed(2)})`,
      boostLeftX + colWidth / 2,
      tableTop - 12,
    );

    // Render each row
    for (let i = 0; i < 4; i++) {
      const y = tableTop + i * rowHeight;

      // Component label between columns
      ctx.fillStyle = tokens.textMute;
      ctx.font = "13px ui-monospace, monospace";
      ctx.textAlign = "center";
      ctx.fillText(LABELS[i], width / 2, y + 20);

      // Lab cell
      drawCell(ctx, labLeftX, y, colWidth, rowHeight - 8, pLab[i], tokens.cyan, tokens);
      // Boosted cell
      drawCell(
        ctx,
        boostLeftX,
        y,
        colWidth,
        rowHeight - 8,
        pBoost[i],
        tokens.magenta,
        tokens,
      );
    }

    // The Λ arrow between them
    ctx.fillStyle = tokens.textDim;
    ctx.font = "13px ui-monospace, monospace";
    ctx.textAlign = "center";
    ctx.fillText("→ Λ(β) →", width / 2, tableTop + 4 * rowHeight + 4);

    // Invariant footer
    const footerY = height - 70;
    ctx.fillStyle = hexToRgba(tokens.amber, 0.18);
    ctx.fillRect(40, footerY, width - 80, 50);
    ctx.strokeStyle = hexToRgba(tokens.amber, 0.5);
    ctx.strokeRect(40, footerY, width - 80, 50);

    ctx.fillStyle = tokens.amber;
    ctx.font = tokens.fontHud;
    ctx.textAlign = "center";
    ctx.fillText(
      "INVARIANT:  p^μ p_μ = (E/c)² − |p|² = m²c²",
      width / 2,
      footerY + 18,
    );
    ctx.fillStyle = tokens.textBright;
    ctx.fillText(
      `lab: ${normLab.toFixed(6)}    boosted: ${normBoost.toFixed(6)}    m²c² = ${(M * M * C * C).toFixed(6)}`,
      width / 2,
      footerY + 36,
    );

    // HUD
    ctx.fillStyle = tokens.textMute;
    ctx.font = tokens.fontHudSmall;
    ctx.textAlign = "left";
    ctx.fillText(
      `m = 1, c = 1, γ_lab = ${gLab.toFixed(3)}, γ_boost = ${g.toFixed(3)}`,
      40,
      height - 8,
    );
  }, [beta, pLab, tokens, width, height]);

  return (
    <div ref={containerRef} className="w-full pb-4">
      <canvas
        ref={canvasRef}
        style={{ width, height, display: "block" }}
        className={SCENE_CANVAS_CLASS}
      />
      <label className="mt-3 flex w-full items-center gap-3 font-mono text-xs text-[var(--color-fg-3)]">
        <span className="w-24">β = {beta.toFixed(2)}</span>
        <input
          type="range"
          min={-0.95}
          max={0.95}
          step={0.01}
          value={beta}
          onChange={(e) => setBeta(parseFloat(e.target.value))}
          className="flex-1"
          style={{ accentColor: "var(--color-magenta)" }}
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
  tokens: SceneTokens,
) {
  ctx.fillStyle = hexToRgba(tokens.textBright, 0.04);
  ctx.fillRect(x, y, w, h);
  ctx.strokeStyle = tokens.panelBorder;
  ctx.strokeRect(x, y, w, h);

  ctx.fillStyle = color;
  ctx.font = "14px ui-monospace, monospace";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(value.toFixed(4), x + w / 2, y + h / 2);
  ctx.textBaseline = "alphabetic";
}
