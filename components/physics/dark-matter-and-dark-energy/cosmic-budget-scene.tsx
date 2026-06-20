"use client";

import { useEffect, useRef, useState } from "react";
import {
  FONT_HUD_SMALL,
  SCENE_CANVAS_CLASS,
  SCENE_HEIGHT_DEFAULT,
  applyDpr,
  drawSectionTitle,
  hexToRgba,
  useSceneSize,
  useSceneTokens,
  type SceneTokens,
} from "@/components/physics/_shared/scene-tokens";
import {
  budgetFractions,
  matterRadiationEquality,
  matterLambdaEquality,
} from "@/lib/physics/relativity/dark-matter-and-dark-energy";

/**
 * FIG.58b — The cosmic energy budget through time.
 *
 * A stacked horizontal bar shows the fractional energy budget of the universe —
 * radiation (AMBER), matter (CYAN), dark energy / Λ (MAGENTA) — at a redshift
 * the reader scrolls with a slider, from z = 1100 (recombination, the CMB) to
 * z = 0 (today). The bar morphs continuously: radiation-dominated in the deep
 * past, a long matter-dominated era, and a Λ-dominated present. Two vertical
 * markers note matter–radiation equality and matter–Λ equality (the onset of
 * acceleration). A running pie on the right shows today's snapshot.
 */

const PAD = 22;

// log-z slider: u ∈ [0,1] → z, with z = 0 at u = 0 and z = 1100 at u = 1.
function uToZ(u: number): number {
  if (u <= 0) return 0;
  // smooth log mapping 0 → 1100
  return Math.pow(10, u * Math.log10(1101)) - 1;
}
function zToU(z: number): number {
  return Math.log10(z + 1) / Math.log10(1101);
}

function fmtZ(z: number): string {
  if (z < 1) return z.toFixed(2);
  if (z < 100) return z.toFixed(1);
  return Math.round(z).toString();
}

function dominant(f: { r: number; m: number; lambda: number }): string {
  if (f.r >= f.m && f.r >= f.lambda) return "radiation-dominated";
  if (f.m >= f.lambda) return "matter-dominated";
  return "dark-energy-dominated";
}

export function CosmicBudgetScene() {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const tokens = useSceneTokens();
  const [u, setU] = useState(zToU(0)); // start at today
  const { width, height } = useSceneSize(containerRef, {
    ratio: 0.5,
    maxHeight: SCENE_HEIGHT_DEFAULT,
    minHeight: 300,
  });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = applyDpr(canvas, width, height);
    if (!ctx) return;
    draw(ctx, tokens, u, width, height);
  }, [tokens, u, width, height]);

  const z = uToZ(u);
  const f = budgetFractions(z);

  return (
    <div ref={containerRef} className="relative w-full pb-4">
      <canvas
        ref={canvasRef}
        style={{ width, height, display: "block" }}
        className={SCENE_CANVAS_CLASS}
        aria-label="Stacked bar of the cosmic energy budget — radiation, matter, dark energy — as a function of redshift from z=1100 to today."
      />
      <div className="mt-3 flex items-center gap-3 font-mono text-xs text-[var(--color-fg-2)]">
        <span className="w-44 shrink-0">
          z = {fmtZ(z)} · {dominant(f)}
        </span>
        <input
          type="range"
          min={0}
          max={1}
          step={0.005}
          value={u}
          onChange={(e) => setU(parseFloat(e.target.value))}
          className="flex-1"
          style={{ accentColor: "var(--color-magenta)" }}
        />
      </div>
      <div className="mt-1 flex flex-wrap gap-x-6 gap-y-1 font-mono text-xs text-[var(--color-fg-3)]">
        {[
          { label: "today (z=0)", z: 0 },
          { label: "accel. onset (z≈0.3)", z: matterLambdaEquality() },
          { label: "z = 1 (~8 Gyr ago)", z: 1 },
          { label: "matter–rad. eq.", z: matterRadiationEquality() },
          { label: "CMB (z=1100)", z: 1100 },
        ].map((p) => (
          <button
            key={p.label}
            type="button"
            className="cursor-pointer hover:text-[var(--color-fg-1)]"
            onClick={() => setU(zToU(p.z))}
          >
            {p.label}
          </button>
        ))}
      </div>
    </div>
  );
}

function draw(
  ctx: CanvasRenderingContext2D,
  tokens: SceneTokens,
  u: number,
  W: number,
  H: number,
) {
  ctx.fillStyle = tokens.bg;
  ctx.fillRect(0, 0, W, H);

  const z = uToZ(u);
  const f = budgetFractions(z);

  const cols = [
    { key: "r" as const, label: "radiation", val: f.r, color: tokens.amber },
    { key: "m" as const, label: "matter", val: f.m, color: tokens.cyan },
    { key: "lambda" as const, label: "dark energy (Λ)", val: f.lambda, color: tokens.magenta },
  ];

  // ── stacked bar across the top ──────────────────────────────────────────
  const barX0 = PAD;
  const barX1 = W - PAD;
  const barW = barX1 - barX0;
  const barY = PAD + 20;
  const barH = 46;

  drawSectionTitle(ctx, barX0, barY - 16, "ENERGY BUDGET Ω(z)", tokens.textMute);

  let x = barX0;
  for (const c of cols) {
    const w = c.val * barW;
    ctx.fillStyle = hexToRgba(c.color, 0.82);
    ctx.fillRect(x, barY, w, barH);
    // percent label if wide enough
    if (w > 34) {
      ctx.fillStyle = tokens.bg;
      ctx.font = "bold 12px ui-monospace, monospace";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(`${(c.val * 100).toFixed(0)}%`, x + w / 2, barY + barH / 2);
    }
    x += w;
  }
  ctx.strokeStyle = tokens.panelBorder;
  ctx.lineWidth = 1;
  ctx.strokeRect(barX0, barY, barW, barH);

  // ── timeline strip below the bar ────────────────────────────────────────
  const tlY = barY + barH + 44;
  const tlX0 = barX0;
  const tlX1 = barX1;
  const tlW = tlX1 - tlX0;
  // map z=1100 (left) → z=0 (right) on a log axis
  const zToX = (zz: number) => tlX1 - (Math.log10(zz + 1) / Math.log10(1101)) * tlW;

  ctx.strokeStyle = tokens.axes;
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.moveTo(tlX0, tlY);
  ctx.lineTo(tlX1, tlY);
  ctx.stroke();

  // tick labels
  ctx.font = FONT_HUD_SMALL;
  ctx.fillStyle = tokens.textFaint;
  for (const zz of [0, 1, 10, 100, 1100]) {
    const tx = zToX(zz);
    ctx.strokeStyle = tokens.grid;
    ctx.beginPath();
    ctx.moveTo(tx, tlY - 4);
    ctx.lineTo(tx, tlY + 4);
    ctx.stroke();
    ctx.textAlign = "center";
    ctx.textBaseline = "top";
    ctx.fillText(`z=${zz}`, tx, tlY + 7);
  }

  // equality markers
  const zEq = matterRadiationEquality();
  const zML = matterLambdaEquality();
  const markers: [number, string, string][] = [
    [zEq, "matter = radiation", tokens.amber],
    [zML, "Λ takes over", tokens.magenta],
  ];
  for (const [zz, label, color] of markers) {
    const mx = zToX(zz);
    ctx.strokeStyle = hexToRgba(color, 0.7);
    ctx.setLineDash([3, 3]);
    ctx.beginPath();
    ctx.moveTo(mx, tlY - 22);
    ctx.lineTo(mx, tlY);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = color;
    ctx.textAlign = "center";
    ctx.textBaseline = "bottom";
    ctx.font = "10px ui-monospace, monospace";
    ctx.fillText(label, mx, tlY - 24);
  }

  // current-z pointer
  const cx = zToX(z);
  ctx.strokeStyle = tokens.textBright;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(cx, tlY - 30);
  ctx.lineTo(cx, tlY + 4);
  ctx.stroke();
  ctx.fillStyle = tokens.textBright;
  ctx.beginPath();
  ctx.moveTo(cx, tlY + 4);
  ctx.lineTo(cx - 4, tlY - 2);
  ctx.lineTo(cx + 4, tlY - 2);
  ctx.closePath();
  ctx.fill();

  // ── legend with running values ──────────────────────────────────────────
  const legY = tlY + 40;
  let lx = barX0;
  ctx.font = FONT_HUD_SMALL;
  ctx.textBaseline = "middle";
  for (const c of cols) {
    ctx.fillStyle = hexToRgba(c.color, 0.82);
    ctx.fillRect(lx, legY - 5, 12, 12);
    ctx.fillStyle = tokens.textDim;
    ctx.textAlign = "left";
    const text = `${c.label}: ${(c.val * 100).toFixed(c.val < 0.01 ? 3 : 1)}%`;
    ctx.fillText(text, lx + 18, legY);
    lx += ctx.measureText(text).width + 54;
  }
}
