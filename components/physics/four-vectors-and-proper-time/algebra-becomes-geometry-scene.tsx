"use client";

import { useEffect, useRef, useState } from "react";
import { gamma } from "@/lib/physics/relativity/types";
import { rapidityFromBeta } from "@/lib/physics/relativity/four-vectors";
import { SPEED_OF_LIGHT } from "@/lib/physics/constants";
import {
  applyDpr,
  hexToRgba,
  SCENE_CANVAS_CLASS,
  SCENE_HEIGHT_DEFAULT,
  useSceneSize,
  useSceneTokens,
} from "@/components/physics/_shared/scene-tokens";

/**
 * FIG.14c — The §03 honest-moment: the §02 algebra collapses into a single
 * hyperbolic rotation in 4D pseudo-Euclidean spacetime.
 *
 * LEFT PANEL — a column table of the six §02 results:
 *   1. β (speed fraction)
 *   2. γ (Lorentz factor)
 *   3. Time-dilation:   Δt' = γ Δt
 *   4. Length-contraction: L' = L / γ
 *   5. Velocity-addition: w' = (u − v) / (1 − uv/c²)  [u fixed at 0.5c]
 *   6. Doppler shift:   f'/f = √((1+β)/(1−β))
 *
 * RIGHT PANEL — the upper sheet of the unit hyperbola u^μ u_μ = c² in
 * the (u⁰/c, u¹/c) = (γ, γβ) plane.
 */

const PAD = 20;

const ROW_LABELS = [
  "β (speed / c)",
  "γ (Lorentz factor)",
  "Δt′ = γ · Δt  (time-dilation)",
  "L′ = L / γ  (length-contraction)",
  "w′  (velocity-addition, u=0.5c)",
  "f′/f  (Doppler, approaching)",
];

function unlockThreshold(rowIndex: number, etaMax: number): number {
  return (rowIndex / 6) * etaMax;
}

function rowValue(rowIndex: number, beta: number, c: number): string {
  const g = gamma(beta);
  const DT_REF = 1.0;
  const L_REF = 1.0;
  const U_REF = 0.5 * c;
  switch (rowIndex) {
    case 0: return beta.toFixed(4);
    case 1: return g.toFixed(4);
    case 2: return (g * DT_REF).toFixed(4);
    case 3: return (L_REF / g).toFixed(4);
    case 4: {
      const w = (U_REF - beta * c) / (1 - (U_REF * beta * c) / (c * c));
      return (w / c).toFixed(4) + " c";
    }
    case 5: {
      if (beta <= 0) return "1.0000";
      return Math.sqrt((1 + beta) / (1 - beta)).toFixed(4);
    }
    default: return "–";
  }
}

export function AlgebraBecomesGeometryScene() {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const tokens = useSceneTokens();
  const { width, height } = useSceneSize(containerRef, {
    ratio: 0.5,
    maxHeight: SCENE_HEIGHT_DEFAULT,
  });
  const [beta, setBeta] = useState(0.0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = applyDpr(canvas, width, height);
    if (!ctx) return;
    ctx.clearRect(0, 0, width, height);

    ctx.fillStyle = tokens.bg;
    ctx.fillRect(0, 0, width, height);

    const W = width;
    const H = height;
    const LEFT_W = Math.max(280, W * 0.5);
    const RIGHT_X0 = LEFT_W + PAD;
    const RIGHT_W = W - RIGHT_X0 - PAD;

    const c = SPEED_OF_LIGHT;
    const eta = beta > 0 ? rapidityFromBeta(Math.min(beta, 0.9999)) : 0;
    const etaMax = rapidityFromBeta(0.99);
    const g = gamma(beta);

    // ── LEFT PANEL: §02 algebra rows ─────────────────────────────────────
    const rowH = (H - PAD * 2 - 32) / 6;

    ctx.fillStyle = tokens.textBright;
    ctx.font = "bold 11px ui-monospace, monospace";
    ctx.textAlign = "left";
    ctx.fillText("§02 algebra — all shadows of one rotation", PAD, PAD + 14);

    const COLORS_ACTIVE = [
      tokens.cyan,
      tokens.purple,
      tokens.magenta,
      tokens.orange,
      tokens.mint,
      tokens.amber,
    ];

    for (let i = 0; i < 6; i++) {
      const rowY = PAD + 28 + i * rowH;
      const threshold = unlockThreshold(i, etaMax);
      const unlocked = eta >= threshold;
      const lit = beta > 0 && unlocked;

      ctx.fillStyle = lit
        ? hexToRgba(tokens.textBright, 0.06)
        : hexToRgba(tokens.textBright, 0.02);
      ctx.fillRect(PAD, rowY, LEFT_W - PAD * 2, rowH - 3);

      const barFill = Math.min(
        1,
        etaMax > 0 ? (eta - threshold) / (etaMax / 6) : 0,
      );
      ctx.fillStyle = lit
        ? hexToRgba(COLORS_ACTIVE[i], 0.33)
        : hexToRgba(tokens.textBright, 0.04);
      ctx.fillRect(PAD, rowY, (LEFT_W - PAD * 2) * barFill, rowH - 3);

      ctx.fillStyle = lit ? COLORS_ACTIVE[i] : tokens.textFaint;
      ctx.font = `${lit ? "bold " : ""}10px ui-monospace, monospace`;
      ctx.textAlign = "left";
      ctx.fillText(ROW_LABELS[i], PAD + 6, rowY + rowH * 0.45);

      if (lit) {
        ctx.fillStyle = tokens.textBright;
        ctx.font = "10px ui-monospace, monospace";
        ctx.textAlign = "right";
        ctx.fillText(
          rowValue(i, beta, c),
          LEFT_W - PAD - 6,
          rowY + rowH * 0.45,
        );
      } else if (beta === 0 && i === 0) {
        ctx.fillStyle = tokens.textMute;
        ctx.font = "10px ui-monospace, monospace";
        ctx.textAlign = "right";
        ctx.fillText("← drag β to begin", LEFT_W - PAD - 6, rowY + rowH * 0.45);
      }
    }

    ctx.fillStyle = tokens.textMute;
    ctx.font = "10px ui-monospace, monospace";
    ctx.textAlign = "left";
    ctx.fillText(
      `η = atanh(β) = ${eta.toFixed(4)}`,
      PAD,
      H - PAD - 4,
    );

    // ── DIVIDER ───────────────────────────────────────────────────────────
    ctx.strokeStyle = tokens.panelBorder;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(LEFT_W, PAD);
    ctx.lineTo(LEFT_W, H - PAD);
    ctx.stroke();

    // ── RIGHT PANEL: the unit hyperbola u^μ u_μ = c² ─────────────────────
    const cx = RIGHT_X0 + RIGHT_W / 2 - 24;
    const cy = H - PAD - 20;
    const scale = (H - PAD * 2 - 40) / 3.2;

    const toCanvasX = (u1: number) => cx + u1 * scale;
    const toCanvasY = (u0: number) => cy - u0 * scale;

    ctx.strokeStyle = tokens.axes;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(cx - 10, cy);
    ctx.lineTo(cx + RIGHT_W - 30, cy);
    ctx.moveTo(cx, cy + 10);
    ctx.lineTo(cx, PAD + 16);
    ctx.stroke();

    ctx.fillStyle = tokens.textMute;
    ctx.font = "10px ui-monospace, monospace";
    ctx.textAlign = "left";
    ctx.fillText("u¹/c = γβ →", toCanvasX(0) + 4, cy + 14);
    ctx.textAlign = "center";
    ctx.fillText("u⁰/c = γ", cx, PAD + 14);

    for (let tick = 0; tick <= 3; tick++) {
      ctx.strokeStyle = tokens.grid;
      ctx.lineWidth = 0.5;
      ctx.setLineDash([3, 4]);
      const ty = toCanvasY(tick);
      ctx.beginPath();
      ctx.moveTo(cx - 8, ty);
      ctx.lineTo(cx + RIGHT_W - 30, ty);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle = tokens.textFaint;
      ctx.font = "9px ui-monospace, monospace";
      ctx.textAlign = "right";
      if (tick > 0) ctx.fillText(String(tick), cx - 10, ty + 4);
    }

    ctx.strokeStyle = tokens.purple;
    ctx.lineWidth = 1.5;
    ctx.setLineDash([]);
    ctx.beginPath();
    const betaMax = 0.985;
    const steps = 120;
    for (let s = 0; s <= steps; s++) {
      const b = (s / steps) * betaMax;
      const gb = gamma(b);
      const u1 = gb * b;
      const u0 = gb;
      const px = toCanvasX(u1);
      const py = toCanvasY(u0);
      if (s === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.stroke();

    ctx.fillStyle = tokens.purple;
    ctx.font = "10px ui-monospace, monospace";
    ctx.textAlign = "left";
    ctx.fillText("u^μ u_μ = c²", toCanvasX(0.4), toCanvasY(1.05));

    ctx.strokeStyle = hexToRgba(tokens.amber, 0.33);
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 5]);
    ctx.beginPath();
    const asymLen = Math.min(RIGHT_W - 40, H - PAD * 2 - 50) / scale;
    ctx.moveTo(toCanvasX(0), toCanvasY(0));
    ctx.lineTo(toCanvasX(asymLen), toCanvasY(asymLen));
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = hexToRgba(tokens.amber, 0.6);
    ctx.font = "9px ui-monospace, monospace";
    ctx.textAlign = "left";
    ctx.fillText("light asymptote (β→1)", toCanvasX(asymLen * 0.4), toCanvasY(asymLen * 0.4) - 6);

    const u1 = g * beta;
    const u0 = g;
    const tipX = toCanvasX(u1);
    const tipY = toCanvasY(u0);
    const origX = toCanvasX(0);
    const origY = toCanvasY(0);

    ctx.strokeStyle = tokens.cyan;
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(origX, origY);
    ctx.lineTo(tipX, tipY);
    ctx.stroke();

    const ang = Math.atan2(tipY - origY, tipX - origX);
    const hl = 8;
    ctx.fillStyle = tokens.cyan;
    ctx.beginPath();
    ctx.moveTo(tipX, tipY);
    ctx.lineTo(tipX - hl * Math.cos(ang - Math.PI / 6), tipY - hl * Math.sin(ang - Math.PI / 6));
    ctx.lineTo(tipX - hl * Math.cos(ang + Math.PI / 6), tipY - hl * Math.sin(ang + Math.PI / 6));
    ctx.closePath();
    ctx.fill();

    ctx.beginPath();
    ctx.arc(tipX, tipY, 3.5, 0, Math.PI * 2);
    ctx.fillStyle = tokens.cyan;
    ctx.fill();

    ctx.strokeStyle = hexToRgba(tokens.cyan, 0.33);
    ctx.lineWidth = 1;
    ctx.setLineDash([3, 4]);
    ctx.beginPath();
    ctx.moveTo(tipX, tipY);
    ctx.lineTo(origX, tipY);
    ctx.moveTo(tipX, tipY);
    ctx.lineTo(tipX, origY);
    ctx.stroke();
    ctx.setLineDash([]);

    ctx.fillStyle = tokens.cyan;
    ctx.font = "9px ui-monospace, monospace";
    ctx.textAlign = "right";
    ctx.fillText(`γ=${g.toFixed(2)}`, origX - 10, tipY + 3);
    ctx.textAlign = "center";
    ctx.fillText(`γβ=${u1.toFixed(2)}`, tipX, origY + 12);

    ctx.fillStyle = tokens.textMute;
    ctx.font = "10px ui-monospace, monospace";
    ctx.textAlign = "left";
    ctx.fillText(
      `β=${beta.toFixed(3)}  η=${eta.toFixed(3)}  γ=${g.toFixed(4)}`,
      RIGHT_X0 + 4,
      H - PAD - 4,
    );

    ctx.fillStyle = tokens.textBright;
    ctx.font = "bold 11px ui-monospace, monospace";
    ctx.textAlign = "center";
    ctx.fillText("one geometry — one rotation", cx, PAD + 14);
  }, [beta, tokens, width, height]);

  return (
    <div ref={containerRef} className="w-full pb-4">
      <canvas
        ref={canvasRef}
        style={{ width, height, display: "block" }}
        className={SCENE_CANVAS_CLASS}
      />
      <div className="mt-3 flex flex-col gap-2 px-1">
        <label className="flex items-center gap-3 font-mono text-xs text-[var(--color-fg-3)]">
          <span className="w-28">β = {beta.toFixed(3)}</span>
          <input
            type="range"
            min={0}
            max={0.99}
            step={0.005}
            value={beta}
            onChange={(e) => setBeta(parseFloat(e.target.value))}
            className="flex-1"
            style={{ accentColor: "var(--color-cyan)" }}
          />
        </label>
        <p className="font-mono text-xs text-[var(--color-fg-4)]">
          Drag β rightward. Each §02 formula lights up as the same rapidity η = atanh(β) unlocks it.
          The vector on the right sweeps the hyperbola u^μ u_μ = c² — one object, all formulas.
        </p>
      </div>
    </div>
  );
}
