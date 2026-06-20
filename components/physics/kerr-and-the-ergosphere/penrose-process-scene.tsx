"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  FONT_HUD_SMALL,
  SCENE_CANVAS_CLASS,
  SCENE_HEIGHT_DEFAULT,
  applyDpr,
  hexToRgba,
  drawHudReadout,
  drawSectionTitle,
  useSceneSize,
  useSceneTokens,
  type SceneTokens,
} from "@/components/physics/_shared/scene-tokens";
import {
  outerHorizonRadius,
  ergosphereRadius,
  maxExtractableEnergyFraction,
} from "@/lib/physics/relativity/kerr-and-the-ergosphere";

/**
 * FIG.45c — Penrose-process energy budget.
 *
 * An infalling body of energy E_in enters the ergosphere and splits into two
 * fragments. One is given a NEGATIVE energy-at-infinity (only possible inside
 * the ergosphere, where the time-translation Killing vector is spacelike) and
 * is swallowed by the hole; the other escapes to infinity with MORE energy
 * than the original body carried in:
 *
 *   E_out = E_in − E_captured,   with E_captured < 0  ⇒  E_out > E_in.
 *
 * The surplus comes out of the hole's rotational energy: its spin drops and
 * its irreducible mass stays fixed. A "split fraction" slider sets how much of
 * the body's energy is thrown into the hole as negative energy; a spin slider
 * sets how much rotational energy is on tap. The bar chart tracks the budget
 * and the hole's spin-down, capped by the theoretical ceiling
 * (1 − M_irr/M ≈ 29% at extremality).
 */

const PAD = 18;

export function PenroseProcessScene() {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const tokens = useSceneTokens();
  // split: fraction of incoming energy thrown in as NEGATIVE energy (0..1).
  const [split, setSplit] = useState(0.45);
  const [aStar, setAStar] = useState(0.9);
  const { width, height } = useSceneSize(containerRef, {
    ratio: 0.55,
    maxHeight: SCENE_HEIGHT_DEFAULT,
    minHeight: 320,
  });

  const budget = useMemo(() => {
    const ceiling = maxExtractableEnergyFraction(aStar); // fraction of E_in extractable (proxy)
    // negative energy captured = −split × E_in, but capped by what the spin
    // can supply (the ceiling). E_in normalized to 1.
    const requested = split; // wanted negative energy magnitude / E_in
    const captured = Math.min(requested, ceiling);
    const eOut = 1 + captured; // E_out / E_in
    const gainPct = captured * 100;
    const cappedByPhysics = requested > ceiling + 1e-9;
    return { eOut, gainPct, captured, ceiling, cappedByPhysics };
  }, [split, aStar]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = applyDpr(canvas, width, height);
    if (!ctx) return;
    draw(ctx, tokens, aStar, split, budget, width, height);
  }, [tokens, aStar, split, budget, width, height]);

  return (
    <div ref={containerRef} className="relative w-full pb-4">
      <canvas
        ref={canvasRef}
        style={{ width, height, display: "block" }}
        className={SCENE_CANVAS_CLASS}
        aria-label="Penrose-process energy budget. An infalling body splits inside the ergosphere; one fragment carries negative energy into the hole, the other escapes with more energy than entered. Bars track the energy balance and the maximum extractable fraction."
      />
      <div className="mt-3 grid gap-2 font-mono text-xs text-[var(--color-fg-2)]">
        <div className="flex items-center gap-3">
          <span className="w-44 shrink-0">
            negative-energy split = {(split * 100).toFixed(0)}%
          </span>
          <input
            type="range"
            min={0}
            max={1}
            step={0.01}
            value={split}
            onChange={(e) => setSplit(parseFloat(e.target.value))}
            className="flex-1"
            style={{ accentColor: "var(--color-magenta)" }}
          />
        </div>
        <div className="flex items-center gap-3">
          <span className="w-44 shrink-0">a* = {aStar.toFixed(2)}</span>
          <input
            type="range"
            min={0}
            max={1}
            step={0.01}
            value={aStar}
            onChange={(e) => setAStar(parseFloat(e.target.value))}
            className="flex-1"
            style={{ accentColor: "var(--color-cyan)" }}
          />
        </div>
      </div>
      <p className="mt-2 font-mono text-xs text-[var(--color-fg-3)]">
        E_out / E_in = {budget.eOut.toFixed(3)} (gain {budget.gainPct.toFixed(1)}
        %) · ceiling {(budget.ceiling * 100).toFixed(1)}%
        {budget.cappedByPhysics ? " — capped: spin exhausted" : ""}
      </p>
    </div>
  );
}

function draw(
  ctx: CanvasRenderingContext2D,
  tokens: SceneTokens,
  aStar: number,
  split: number,
  budget: {
    eOut: number;
    gainPct: number;
    captured: number;
    ceiling: number;
    cappedByPhysics: boolean;
  },
  W: number,
  H: number,
) {
  ctx.fillStyle = tokens.bg;
  ctx.fillRect(0, 0, W, H);

  drawSectionTitle(ctx, PAD, PAD, "PENROSE PROCESS  (energy budget)", tokens.textMute);

  // ── left half: cartoon of the split inside the ergosphere ────────────────
  const leftW = W * 0.46;
  const cx = PAD + leftW * 0.5;
  const cy = H / 2 + 8;
  const rMax = 3.0;
  const scale = Math.min(leftW - PAD, H - PAD * 2 - 24) / (2 * rMax);

  const rHorizon = outerHorizonRadius(aStar);
  const rStatic = ergosphereRadius(aStar, Math.PI / 2);

  // ergosphere annulus
  ctx.beginPath();
  ctx.arc(cx, cy, rStatic * scale, 0, Math.PI * 2);
  ctx.arc(cx, cy, rHorizon * scale, 0, Math.PI * 2, true);
  ctx.fillStyle = hexToRgba(tokens.magenta, 0.15);
  ctx.fill("evenodd");
  ctx.strokeStyle = tokens.amber;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(cx, cy, rStatic * scale, 0, Math.PI * 2);
  ctx.stroke();

  // horizon
  ctx.fillStyle = hexToRgba(tokens.cyan, 0.14);
  ctx.beginPath();
  ctx.arc(cx, cy, rHorizon * scale, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = tokens.cyan;
  ctx.beginPath();
  ctx.arc(cx, cy, rHorizon * scale, 0, Math.PI * 2);
  ctx.stroke();

  // incoming worldline (from upper-left into the ergosphere)
  const splitX = cx - 0.2 * scale;
  const splitY = cy - (rStatic - 0.3) * scale;
  ctx.strokeStyle = tokens.textDim;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(cx - (rMax) * scale, cy - (rMax) * scale);
  ctx.lineTo(splitX, splitY);
  ctx.stroke();
  ctx.fillStyle = tokens.textDim;
  ctx.beginPath();
  ctx.arc(splitX, splitY, 3, 0, Math.PI * 2);
  ctx.fill();
  ctx.font = FONT_HUD_SMALL;
  ctx.fillStyle = tokens.textMute;
  ctx.textAlign = "left";
  ctx.textBaseline = "bottom";
  ctx.fillText("E_in", cx - rMax * scale, cy - rMax * scale - 2);

  // fragment 1: escapes (up-right), thicker = more energy
  ctx.strokeStyle = tokens.mint;
  ctx.lineWidth = 2 + budget.captured * 5;
  ctx.beginPath();
  ctx.moveTo(splitX, splitY);
  ctx.lineTo(splitX + rMax * scale, splitY - rMax * 0.7 * scale);
  ctx.stroke();
  ctx.fillStyle = tokens.mint;
  ctx.textBaseline = "bottom";
  ctx.fillText("E_out", splitX + rMax * scale - 30, splitY - rMax * 0.7 * scale - 2);

  // fragment 2: negative energy, falls into the hole
  ctx.strokeStyle = tokens.red;
  ctx.lineWidth = 1 + split * 4;
  ctx.beginPath();
  ctx.moveTo(splitX, splitY);
  ctx.lineTo(cx, cy);
  ctx.stroke();
  ctx.fillStyle = tokens.red;
  ctx.textBaseline = "top";
  ctx.fillText("−E", splitX + 4, splitY + 4);

  // ── right half: budget bars ───────────────────────────────────────────────
  const bx0 = W * 0.52;
  const bw = W - bx0 - PAD;
  const barTop = PAD + 30;
  const barH = 22;
  const gap = 16;
  const maxScale = bw; // E_in normalized to bw

  const drawBar = (
    y: number,
    label: string,
    frac: number,
    color: string,
  ) => {
    ctx.fillStyle = tokens.panelBorder;
    ctx.fillRect(bx0, y, bw, barH);
    ctx.fillStyle = color;
    ctx.fillRect(bx0, y, Math.max(0, Math.min(1, frac)) * maxScale, barH);
    ctx.font = FONT_HUD_SMALL;
    ctx.fillStyle = tokens.textBright;
    ctx.textAlign = "left";
    ctx.textBaseline = "middle";
    ctx.fillText(label, bx0 + 6, y + barH / 2);
  };

  drawBar(barTop, "E_in = 1.00", 1, hexToRgba(tokens.textDim, 0.6));
  drawBar(
    barTop + (barH + gap),
    `E_out = ${budget.eOut.toFixed(2)}`,
    budget.eOut / 1.35,
    tokens.mint,
  );
  // ceiling marker on the E_out bar
  const ceilX = bx0 + ((1 + budget.ceiling) / 1.35) * maxScale;
  ctx.strokeStyle = hexToRgba(tokens.red, 0.9);
  ctx.setLineDash([4, 3]);
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(ceilX, barTop + (barH + gap) - 4);
  ctx.lineTo(ceilX, barTop + (barH + gap) + barH + 4);
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.fillStyle = tokens.red;
  ctx.textAlign = "center";
  ctx.textBaseline = "bottom";
  ctx.font = FONT_HUD_SMALL;
  ctx.fillText("max", ceilX, barTop + (barH + gap) - 5);

  drawBar(
    barTop + 2 * (barH + gap),
    `gain = ${budget.gainPct.toFixed(1)}%`,
    budget.gainPct / 35,
    tokens.amber,
  );

  // HUD: spin-down note
  ctx.textAlign = "left";
  ctx.textBaseline = "top";
  drawHudReadout(
    ctx,
    bx0,
    barTop + 3 * (barH + gap) + 6,
    "ceiling (1−M_irr/M) = ",
    `${(budget.ceiling * 100).toFixed(1)}%`,
    tokens.textDim,
    tokens.red,
  );
  ctx.fillStyle = tokens.textMute;
  ctx.font = FONT_HUD_SMALL;
  ctx.fillText(
    "surplus is drawn from the hole's spin →",
    bx0,
    barTop + 3 * (barH + gap) + 28,
  );
  ctx.fillText(
    "the irreducible mass never falls.",
    bx0,
    barTop + 3 * (barH + gap) + 44,
  );
}
