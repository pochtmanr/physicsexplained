"use client";

import { useEffect, useRef, useState } from "react";
import { gamma, minkowskiNormSquared } from "@/lib/physics/relativity/types";
import { rapidityFromBeta, betaFromRapidity } from "@/lib/physics/relativity/four-vectors";
import { SPEED_OF_LIGHT } from "@/lib/physics/constants";

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
 * As the β slider moves, each row lights up sequentially by rapidity
 * quartile, so the reader sees the formulas "unlock" one by one from
 * the same underlying parameter η = atanh(β).
 *
 * RIGHT PANEL — the upper sheet of the unit hyperbola u^μ u_μ = c² in
 * the (u⁰/c, u¹/c) = (γ, γβ) plane. A single vector sweeps along this
 * hyperbola as β moves from 0 to 1. The hyperbola is the geometric object
 * that contains all six §02 formulas simultaneously — moving the β slider
 * rotates the vector by rapidity η, and each formula is just one projection
 * of that single rotation.
 */

const W = 700;
const H = 340;
const PAD = 20;
const LEFT_W = 340;
const RIGHT_X0 = LEFT_W + PAD;
const RIGHT_W = W - RIGHT_X0 - PAD;

const ROW_LABELS = [
  "β (speed / c)",
  "γ (Lorentz factor)",
  "Δt′ = γ · Δt  (time-dilation)",
  "L′ = L / γ  (length-contraction)",
  "w′  (velocity-addition, u=0.5c)",
  "f′/f  (Doppler, approaching)",
];

/**
 * Rapidity thresholds at which each §02 row lights up.
 * The six rows map to six equal bands of η ∈ [0, atanh(0.99)].
 */
function unlockThreshold(rowIndex: number, etaMax: number): number {
  return (rowIndex / 6) * etaMax;
}

function rowValue(rowIndex: number, beta: number, c: number): string {
  const g = gamma(beta);
  const DT_REF = 1.0; // lab time = 1 for time-dilation example
  const L_REF = 1.0;  // proper length = 1 for length-contraction example
  const U_REF = 0.5 * c; // probe velocity for velocity-addition example
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
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [beta, setBeta] = useState(0.0);

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
    ctx.clearRect(0, 0, W, H);

    const c = SPEED_OF_LIGHT;
    const eta = beta > 0 ? rapidityFromBeta(Math.min(beta, 0.9999)) : 0;
    const etaMax = rapidityFromBeta(0.99);
    const g = gamma(beta);

    // ── LEFT PANEL: §02 algebra rows ─────────────────────────────────────
    const rowH = (H - PAD * 2 - 32) / 6;
    const colW = 20;

    // Header
    ctx.fillStyle = "rgba(255,255,255,0.85)";
    ctx.font = "bold 11px ui-monospace, monospace";
    ctx.textAlign = "left";
    ctx.fillText("§02 algebra — all shadows of one rotation", PAD, PAD + 14);

    const COLORS_ACTIVE = [
      "#67E8F9", // cyan — β
      "#A78BFA", // violet — γ
      "#F472B6", // pink — time-dilation
      "#FB923C", // orange — length-contraction
      "#34D399", // green — velocity-addition
      "#FFD66B", // amber — Doppler
    ];

    for (let i = 0; i < 6; i++) {
      const rowY = PAD + 28 + i * rowH;
      const threshold = unlockThreshold(i, etaMax);
      const unlocked = eta >= threshold;
      const lit = beta > 0 && unlocked;

      // Row background
      ctx.fillStyle = lit
        ? `rgba(255,255,255,0.06)`
        : "rgba(255,255,255,0.02)";
      ctx.fillRect(PAD, rowY, LEFT_W - PAD * 2, rowH - 3);

      // Rapidity indicator bar
      const barFill = Math.min(
        1,
        etaMax > 0 ? (eta - threshold) / (etaMax / 6) : 0,
      );
      ctx.fillStyle = lit ? COLORS_ACTIVE[i] + "55" : "rgba(255,255,255,0.04)";
      ctx.fillRect(PAD, rowY, (LEFT_W - PAD * 2) * barFill, rowH - 3);

      // Label
      ctx.fillStyle = lit ? COLORS_ACTIVE[i] : "rgba(255,255,255,0.28)";
      ctx.font = `${lit ? "bold " : ""}10px ui-monospace, monospace`;
      ctx.textAlign = "left";
      ctx.fillText(ROW_LABELS[i], PAD + 6, rowY + rowH * 0.45);

      // Value
      if (lit) {
        ctx.fillStyle = "rgba(255,255,255,0.90)";
        ctx.font = "10px ui-monospace, monospace";
        ctx.textAlign = "right";
        ctx.fillText(
          rowValue(i, beta, c),
          LEFT_W - PAD - 6,
          rowY + rowH * 0.45,
        );
      } else if (beta === 0 && i === 0) {
        ctx.fillStyle = "rgba(255,255,255,0.40)";
        ctx.font = "10px ui-monospace, monospace";
        ctx.textAlign = "right";
        ctx.fillText("← drag β to begin", LEFT_W - PAD - 6, rowY + rowH * 0.45);
      }
    }

    // Rapidity HUD
    ctx.fillStyle = "rgba(255,255,255,0.5)";
    ctx.font = "10px ui-monospace, monospace";
    ctx.textAlign = "left";
    ctx.fillText(
      `η = atanh(β) = ${eta.toFixed(4)}`,
      PAD,
      H - PAD - 4,
    );

    // ── DIVIDER ───────────────────────────────────────────────────────────
    ctx.strokeStyle = "rgba(255,255,255,0.12)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(LEFT_W, PAD);
    ctx.lineTo(LEFT_W, H - PAD);
    ctx.stroke();

    // ── RIGHT PANEL: the unit hyperbola u^μ u_μ = c² ─────────────────────
    // Draw in (γ, γβ) space — i.e. (u⁰/c, u¹/c).
    // The canvas x-axis is γβ (spatial component), y-axis is γ (time component).
    // We flip y so γ grows upward.

    const cx = RIGHT_X0 + RIGHT_W / 2 - 24;
    const cy = H - PAD - 20;
    const scale = (H - PAD * 2 - 40) / 3.2; // 1 unit = scale px; fits γ up to ~3

    const toCanvasX = (u1: number) => cx + u1 * scale;
    const toCanvasY = (u0: number) => cy - u0 * scale;

    // Axes
    ctx.strokeStyle = "rgba(255,255,255,0.20)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(cx - 10, cy);
    ctx.lineTo(cx + RIGHT_W - 30, cy);
    ctx.moveTo(cx, cy + 10);
    ctx.lineTo(cx, PAD + 16);
    ctx.stroke();

    // Axis labels
    ctx.fillStyle = "rgba(255,255,255,0.45)";
    ctx.font = "10px ui-monospace, monospace";
    ctx.textAlign = "left";
    ctx.fillText("u¹/c = γβ →", toCanvasX(0) + 4, cy + 14);
    ctx.textAlign = "center";
    ctx.fillText("u⁰/c = γ", cx, PAD + 14);

    // Tick marks
    for (let tick = 0; tick <= 3; tick++) {
      ctx.strokeStyle = "rgba(255,255,255,0.12)";
      ctx.lineWidth = 0.5;
      ctx.setLineDash([3, 4]);
      const ty = toCanvasY(tick);
      ctx.beginPath();
      ctx.moveTo(cx - 8, ty);
      ctx.lineTo(cx + RIGHT_W - 30, ty);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle = "rgba(255,255,255,0.30)";
      ctx.font = "9px ui-monospace, monospace";
      ctx.textAlign = "right";
      if (tick > 0) ctx.fillText(String(tick), cx - 10, ty + 4);
    }

    // The unit hyperbola u^μ u_μ = c² → u⁰ = √(1 + (u¹)²) in units of c.
    // We trace it from β = 0 (point (1, 0)) to β → 1 (up and right).
    ctx.strokeStyle = "#A78BFA";
    ctx.lineWidth = 1.5;
    ctx.setLineDash([]);
    ctx.beginPath();
    const betaMax = 0.985;
    const steps = 120;
    for (let s = 0; s <= steps; s++) {
      const b = (s / steps) * betaMax;
      const gb = gamma(b);
      const u1 = gb * b; // γβ
      const u0 = gb;     // γ
      const px = toCanvasX(u1);
      const py = toCanvasY(u0);
      if (s === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.stroke();

    // Hyperbola label
    ctx.fillStyle = "#A78BFA";
    ctx.font = "10px ui-monospace, monospace";
    ctx.textAlign = "left";
    ctx.fillText("u^μ u_μ = c²", toCanvasX(0.4), toCanvasY(1.05));

    // Light asymptote u⁰ = u¹ (45° line in this coord system)
    ctx.strokeStyle = "#FFD66B55";
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 5]);
    ctx.beginPath();
    const asymLen = Math.min(RIGHT_W - 40, H - PAD * 2 - 50) / scale;
    ctx.moveTo(toCanvasX(0), toCanvasY(0));
    ctx.lineTo(toCanvasX(asymLen), toCanvasY(asymLen));
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = "#FFD66B99";
    ctx.font = "9px ui-monospace, monospace";
    ctx.textAlign = "left";
    ctx.fillText("light asymptote (β→1)", toCanvasX(asymLen * 0.4), toCanvasY(asymLen * 0.4) - 6);

    // Four-velocity vector from origin to (γ, γβ)
    const u1 = g * beta;
    const u0 = g;
    const tipX = toCanvasX(u1);
    const tipY = toCanvasY(u0);
    const origX = toCanvasX(0);
    const origY = toCanvasY(0);

    // Shaft
    ctx.strokeStyle = "#67E8F9";
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(origX, origY);
    ctx.lineTo(tipX, tipY);
    ctx.stroke();

    // Arrowhead
    const ang = Math.atan2(tipY - origY, tipX - origX);
    const hl = 8;
    ctx.fillStyle = "#67E8F9";
    ctx.beginPath();
    ctx.moveTo(tipX, tipY);
    ctx.lineTo(tipX - hl * Math.cos(ang - Math.PI / 6), tipY - hl * Math.sin(ang - Math.PI / 6));
    ctx.lineTo(tipX - hl * Math.cos(ang + Math.PI / 6), tipY - hl * Math.sin(ang + Math.PI / 6));
    ctx.closePath();
    ctx.fill();

    // Dot at tip
    ctx.beginPath();
    ctx.arc(tipX, tipY, 3.5, 0, Math.PI * 2);
    ctx.fillStyle = "#67E8F9";
    ctx.fill();

    // Dashed projections to axes
    ctx.strokeStyle = "#67E8F955";
    ctx.lineWidth = 1;
    ctx.setLineDash([3, 4]);
    ctx.beginPath();
    ctx.moveTo(tipX, tipY);
    ctx.lineTo(origX, tipY); // projection to y-axis → γ component
    ctx.moveTo(tipX, tipY);
    ctx.lineTo(tipX, origY); // projection to x-axis → γβ component
    ctx.stroke();
    ctx.setLineDash([]);

    // Labels at projections
    ctx.fillStyle = "#67E8F9";
    ctx.font = "9px ui-monospace, monospace";
    ctx.textAlign = "right";
    ctx.fillText(`γ=${g.toFixed(2)}`, origX - 10, tipY + 3);
    ctx.textAlign = "center";
    ctx.fillText(`γβ=${u1.toFixed(2)}`, tipX, origY + 12);

    // HUD
    ctx.fillStyle = "rgba(255,255,255,0.5)";
    ctx.font = "10px ui-monospace, monospace";
    ctx.textAlign = "left";
    ctx.fillText(
      `β=${beta.toFixed(3)}  η=${eta.toFixed(3)}  γ=${g.toFixed(4)}`,
      RIGHT_X0 + 4,
      H - PAD - 4,
    );

    // Panel header
    ctx.fillStyle = "rgba(255,255,255,0.85)";
    ctx.font = "bold 11px ui-monospace, monospace";
    ctx.textAlign = "center";
    ctx.fillText("one geometry — one rotation", cx, PAD + 14);
  }, [beta]);

  return (
    <div className="flex flex-col gap-3 p-2">
      <canvas
        ref={canvasRef}
        className="rounded-md border border-white/10 bg-black/40"
      />
      <div className="flex flex-col gap-2 px-1">
        <label className="flex items-center gap-3 font-mono text-xs text-white/70">
          <span className="w-28">β = {beta.toFixed(3)}</span>
          <input
            type="range"
            min={0}
            max={0.99}
            step={0.005}
            value={beta}
            onChange={(e) => setBeta(parseFloat(e.target.value))}
            className="flex-1"
          />
        </label>
        <p className="font-mono text-xs text-white/40">
          Drag β rightward. Each §02 formula lights up as the same rapidity η = atanh(β) unlocks it.
          The vector on the right sweeps the hyperbola u^μ u_μ = c² — one object, all formulas.
        </p>
      </div>
    </div>
  );
}
