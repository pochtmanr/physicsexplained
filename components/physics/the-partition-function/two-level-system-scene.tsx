"use client";

import { useEffect, useRef, useState } from "react";
import {
  FONT_HUD_SMALL,
  SCENE_CANVAS_CLASS,
  SCENE_HEIGHT_DEFAULT,
  applyDpr,
  hexToRgba,
  drawSectionTitle,
  useSceneSize,
  useSceneTokens,
  type SceneTokens,
} from "@/components/physics/_shared/scene-tokens";
import { K_B } from "@/lib/physics/thermodynamics/distributions";
import {
  levelPopulationsTwoLevel,
  cvTwoLevel,
} from "@/lib/physics/thermodynamics/partition-function";

/**
 * FIG.19a — the two-level system. A single degree of freedom with energies 0
 * and ε. Slide the (reduced) temperature τ = k_BT/ε: the Boltzmann factors set
 * the populations of the two rungs, drawn as bars that start all-ground (cold)
 * and saturate toward 50/50 (hot). Below, the heat capacity C_v(τ) traces the
 * Schottky anomaly — a hump that peaks near k_BT ≈ 0.42 ε, because a system can
 * only absorb energy where it has states to climb into.
 */

const EPS = 1e-21; // a fixed energy gap; only the ratio k_BT/ε matters
const TAU_MIN = 0.05;
const TAU_MAX = 5;

/** Map a reduced temperature τ = k_BT/ε to an absolute T for the lib helpers. */
function tempOf(tau: number): number {
  return (tau * EPS) / K_B;
}

export function TwoLevelSystemScene() {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const tokens = useSceneTokens();
  const [tau, setTau] = useState(0.42);

  const { width, height } = useSceneSize(containerRef, {
    ratio: 0.62,
    maxHeight: SCENE_HEIGHT_DEFAULT,
    minHeight: 300,
  });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = applyDpr(canvas, width, height);
    if (!ctx) return;
    draw(ctx, tokens, tau, width, height);
  }, [tokens, tau, width, height]);

  const [p0, p1] = levelPopulationsTwoLevel(tempOf(tau), EPS);

  return (
    <div ref={containerRef} className="relative w-full pb-4">
      <canvas
        ref={canvasRef}
        style={{ width, height, display: "block" }}
        className={SCENE_CANVAS_CLASS}
        aria-label="A two-level system: a ladder with a ground level and an excited level, population bars set by the Boltzmann factors, and below it the heat capacity versus temperature tracing the Schottky anomaly hump."
      />
      <div className="mt-3 flex items-center gap-3 font-mono text-xs text-[var(--color-fg-2)]">
        <span className="w-44 shrink-0">
          k_BT/ε: {tau.toFixed(2)} · p₁ {(p1 * 100).toFixed(0)}%
        </span>
        <input
          type="range"
          min={TAU_MIN}
          max={TAU_MAX}
          step={0.01}
          value={tau}
          onChange={(e) => setTau(parseFloat(e.target.value))}
          className="flex-1"
          style={{ accentColor: "var(--color-cyan)" }}
        />
      </div>
      <div className="mt-1 flex flex-wrap gap-x-6 gap-y-1 font-mono text-xs text-[var(--color-fg-3)]">
        {[
          { label: "cold (τ=0.1)", value: 0.1 },
          { label: "Schottky peak (τ≈0.42)", value: 0.42 },
          { label: "hot (τ=3)", value: 3 },
        ].map((d) => (
          <button
            key={d.label}
            type="button"
            className="cursor-pointer hover:text-[var(--color-fg-1)]"
            onClick={() => setTau(d.value)}
          >
            {d.label}
          </button>
        ))}
      </div>
    </div>
  );
}

function draw(
  ctx: CanvasRenderingContext2D,
  tokens: SceneTokens,
  tau: number,
  W: number,
  H: number,
) {
  ctx.fillStyle = tokens.bg;
  ctx.fillRect(0, 0, W, H);

  const gap = 18;
  const ladderW = Math.min(W * 0.42, 280);
  drawLadder(ctx, tokens, tau, 0, ladderW, H);
  drawCvCurve(ctx, tokens, tau, ladderW + gap, W - ladderW - gap, H);
}

function drawLadder(
  ctx: CanvasRenderingContext2D,
  tokens: SceneTokens,
  tau: number,
  x0: number,
  panelW: number,
  H: number,
) {
  drawSectionTitle(ctx, x0 + 12, 8, "LEVELS · p ∝ e^(−E/kT)", tokens.textMute);

  const [p0, p1] = levelPopulationsTwoLevel(tempOf(tau), EPS);
  const padT = 40;
  const padB = 24;
  const yTop = padT; // excited level ε
  const yBot = H - padB; // ground level 0
  const railX = x0 + 30;
  const barMaxW = panelW - 64;

  // the two rungs
  const rungs: [number, number, string, string][] = [
    [yTop, p1, "ε", tokens.amber],
    [yBot, p0, "0", tokens.cyan],
  ];
  for (const [y, p, label, color] of rungs) {
    // rung line
    ctx.strokeStyle = hexToRgba(tokens.gridHeavy, 0.6);
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(railX, y);
    ctx.lineTo(railX + barMaxW, y);
    ctx.stroke();
    // population bar (height encodes p)
    const bh = 14;
    ctx.fillStyle = hexToRgba(color, 0.85);
    ctx.fillRect(railX, y - bh, p * barMaxW, bh);
    // outline of full width
    ctx.strokeStyle = hexToRgba(color, 0.35);
    ctx.strokeRect(railX, y - bh, barMaxW, bh);
    // labels
    ctx.fillStyle = color;
    ctx.font = FONT_HUD_SMALL;
    ctx.textAlign = "right";
    ctx.textBaseline = "middle";
    ctx.fillText(label, railX - 6, y);
    ctx.textAlign = "left";
    ctx.fillStyle = tokens.textMute;
    ctx.fillText(`${(p * 100).toFixed(0)}%`, railX + barMaxW + 6, y - bh / 2);
  }

  // energy axis arrow
  ctx.strokeStyle = tokens.axes;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(railX - 18, yBot + 4);
  ctx.lineTo(railX - 18, yTop - 8);
  ctx.stroke();
  ctx.fillStyle = tokens.textMute;
  ctx.font = FONT_HUD_SMALL;
  ctx.textAlign = "left";
  ctx.textBaseline = "bottom";
  ctx.fillText("E", railX - 26, yTop - 8);
}

function drawCvCurve(
  ctx: CanvasRenderingContext2D,
  tokens: SceneTokens,
  tau: number,
  x0: number,
  panelW: number,
  H: number,
) {
  drawSectionTitle(ctx, x0 + 30, 8, "C_v / k_B  vs  k_BT/ε", tokens.textMute);

  const padL = 34;
  const padR = 14;
  const padT = 28;
  const padB = 26;
  const gx0 = x0 + padL;
  const gx1 = x0 + panelW - padR;
  const gy0 = padT;
  const gy1 = H - padB;

  const N = 240;
  const cvMaxDisplay = 0.5; // Schottky peak is ≈ 0.439 k_B
  const xOf = (t: number) => gx0 + ((t - TAU_MIN) / (TAU_MAX - TAU_MIN)) * (gx1 - gx0);
  const yOf = (cv: number) => gy1 - (cv / cvMaxDisplay) * (gy1 - gy0);

  // axes
  ctx.strokeStyle = tokens.axes;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(gx0, gy0);
  ctx.lineTo(gx0, gy1);
  ctx.lineTo(gx1, gy1);
  ctx.stroke();

  // curve C_v(τ)/k_B
  ctx.strokeStyle = tokens.magenta;
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  for (let i = 0; i <= N; i++) {
    const t = TAU_MIN + (i / N) * (TAU_MAX - TAU_MIN);
    const cv = cvTwoLevel(tempOf(t), EPS) / K_B;
    const x = xOf(t);
    const y = yOf(cv);
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.stroke();

  // current-τ marker
  const cvNow = cvTwoLevel(tempOf(tau), EPS) / K_B;
  ctx.strokeStyle = hexToRgba(tokens.cyan, 0.8);
  ctx.setLineDash([4, 3]);
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(xOf(tau), gy0);
  ctx.lineTo(xOf(tau), gy1);
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.fillStyle = tokens.cyan;
  ctx.beginPath();
  ctx.arc(xOf(tau), yOf(cvNow), 4, 0, Math.PI * 2);
  ctx.fill();

  // labels
  ctx.font = FONT_HUD_SMALL;
  ctx.fillStyle = tokens.textMute;
  ctx.textAlign = "right";
  ctx.textBaseline = "top";
  ctx.fillText("k_BT/ε →", gx1, gy1 + 6);
  ctx.fillStyle = hexToRgba(tokens.magenta, 0.9);
  ctx.textAlign = "left";
  ctx.textBaseline = "bottom";
  ctx.fillText("Schottky anomaly", gx0 + 8, gy0 + 14);
}
