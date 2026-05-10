"use client";

import { useEffect, useRef } from "react";
import {
  applyDpr,
  SCENE_CANVAS_CLASS,
  SCENE_HEIGHT_SHORT,
  hexToRgba,
  useSceneSize,
  useSceneTokens,
  type SceneTokens,
} from "@/components/physics/_shared/scene-tokens";

/**
 * POISSON VS EFE SCENE — §08 THE NEWTONIAN LIMIT
 *
 * Side-by-side static display:
 *   Left  — Newtonian Poisson equation ∇²Φ = 4πGρ for a point mass,
 *            with potential contour lines radiating outward.
 *   Right — 00-component of the linearised EFE showing how it reduces
 *            to Poisson's equation; the 8πG/c⁴ coefficient highlighted
 *            as the bridge between the two theories.
 *
 * The two panels are visually joined by an "=" sign to emphasise
 * that these are the same physical statement at different levels of theory.
 */

/** Draw equipotential contours for −GM/r around a central point mass. */
function drawPotentialContours(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  radius: number,
  color: string,
) {
  const levels = [15, 28, 44, 62, 82];
  levels.forEach((r, i) => {
    const alpha = 0.5 - i * 0.08;
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.strokeStyle = hexToRgba(color, alpha);
    ctx.lineWidth = 1.2;
    ctx.setLineDash([3, 3]);
    ctx.stroke();
    ctx.setLineDash([]);
  });
  void radius;
}

/** Draw radial field lines for gravity (pointing inward). */
function drawFieldLines(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  r_inner: number,
  r_outer: number,
  nLines: number,
  color: string,
) {
  for (let i = 0; i < nLines; i++) {
    const angle = (i / nLines) * Math.PI * 2;
    const dx = Math.cos(angle);
    const dy = Math.sin(angle);
    const x1 = cx + dx * r_outer;
    const y1 = cy + dy * r_outer;
    const x2 = cx + dx * r_inner;
    const y2 = cy + dy * r_inner;

    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.strokeStyle = color;
    ctx.globalAlpha = 0.35;
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.globalAlpha = 1;

    // Arrow tip (pointing inward toward mass)
    const ax = x2;
    const ay = y2;
    const adx = x2 - x1;
    const ady = y2 - y1;
    const alen = Math.sqrt(adx * adx + ady * ady);
    if (alen < 1) continue;
    const ux = adx / alen;
    const uy = ady / alen;
    ctx.beginPath();
    ctx.moveTo(ax, ay);
    ctx.lineTo(ax - 7 * ux + 3.5 * uy, ay - 7 * uy - 3.5 * ux);
    ctx.lineTo(ax - 7 * ux - 3.5 * uy, ay - 7 * uy + 3.5 * ux);
    ctx.closePath();
    ctx.fillStyle = color;
    ctx.globalAlpha = 0.45;
    ctx.fill();
    ctx.globalAlpha = 1;
  }
}

function drawScene(
  ctx: CanvasRenderingContext2D,
  tokens: SceneTokens,
  W: number,
  H: number,
) {
  // Panel accent colours — derived from semantic tokens
  const colNewton = tokens.cyan;     // cyan for Newtonian panel
  const colEinstein = tokens.orange; // orange for GR panel
  const colBridge = tokens.green;    // green for the coefficient 8πG/c⁴

  ctx.clearRect(0, 0, W, H);
  ctx.fillStyle = tokens.bg;
  ctx.fillRect(0, 0, W, H);

  // ─── LAYOUT ───────────────────────────────────────────────────────────────
  const midX = W / 2;
  const leftCX = midX * 0.38; // centre of left panel
  const rightCX = midX + midX * 0.62; // centre of right panel

  // Divider
  ctx.strokeStyle = hexToRgba(tokens.textBright, 0.08);
  ctx.lineWidth = 1;
  ctx.setLineDash([5, 5]);
  ctx.beginPath();
  ctx.moveTo(midX, 8);
  ctx.lineTo(midX, H - 8);
  ctx.stroke();
  ctx.setLineDash([]);

  // ═══ "=" bridge sign ════════════════════════════════════════════════════
  ctx.fillStyle = hexToRgba(tokens.textBright, 0.6);
  ctx.font = "bold 22px monospace";
  ctx.textAlign = "center";
  ctx.fillText("=", midX, H / 2 + 8);
  ctx.textAlign = "left";

  // ─── LEFT PANEL — Newtonian ────────────────────────────────────────────
  const leftCY = H * 0.41;

  // Panel label
  ctx.fillStyle = colNewton;
  ctx.font = "bold 11px monospace";
  ctx.textAlign = "center";
  ctx.fillText("NEWTONIAN GRAVITY", leftCX, 20);

  // Point mass glyph
  ctx.beginPath();
  ctx.arc(leftCX, leftCY, 8, 0, Math.PI * 2);
  const grad = ctx.createRadialGradient(leftCX, leftCY, 0, leftCX, leftCY, 8);
  grad.addColorStop(0, hexToRgba(colNewton, 0.9));
  grad.addColorStop(1, hexToRgba(colNewton, 0.1));
  ctx.fillStyle = grad;
  ctx.fill();

  drawFieldLines(ctx, leftCX, leftCY, 14, 80, 8, colNewton);
  drawPotentialContours(ctx, leftCX, leftCY, 90, colNewton);

  // Label: M
  ctx.fillStyle = colNewton;
  ctx.font = "bold 12px monospace";
  ctx.textAlign = "center";
  ctx.fillText("M", leftCX, leftCY + 22);

  // Poisson equation
  ctx.font = "13px monospace";
  ctx.fillStyle = colNewton;
  ctx.textAlign = "center";
  ctx.fillText("∇²Φ = 4πGρ", leftCX, H - 60);

  ctx.font = "10px monospace";
  ctx.fillStyle = hexToRgba(tokens.textMute, 0.85);
  ctx.fillText("Poisson's equation", leftCX, H - 44);
  ctx.fillText("(Newton, 1687 / Poisson, 1813)", leftCX, H - 30);

  // ─── RIGHT PANEL — linearised EFE ─────────────────────────────────────
  const rightCY = H * 0.41;

  ctx.fillStyle = colEinstein;
  ctx.font = "bold 11px monospace";
  ctx.textAlign = "center";
  ctx.fillText("GENERAL RELATIVITY  (linearised)", rightCX, 20);

  // Curved-space glyph: a wavy grid suggesting curvature
  ctx.save();
  ctx.translate(rightCX, rightCY);
  const GRID_N = 5;
  const STEP = 16;
  ctx.strokeStyle = hexToRgba(colEinstein, 0.35);
  ctx.lineWidth = 1;
  for (let i = -GRID_N; i <= GRID_N; i++) {
    ctx.beginPath();
    for (let j = -GRID_N; j <= GRID_N; j++) {
      const px = j * STEP;
      const dist = Math.sqrt(px * px + (i * STEP) * (i * STEP));
      const warp = 18 / (1 + dist * 0.05);
      const py = i * STEP - warp * Math.exp(-dist * dist / 1800);
      if (j === -GRID_N) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.stroke();
  }
  for (let j = -GRID_N; j <= GRID_N; j++) {
    ctx.beginPath();
    for (let i = -GRID_N; i <= GRID_N; i++) {
      const px = j * STEP;
      const dist = Math.sqrt(px * px + (i * STEP) * (i * STEP));
      const warp = 18 / (1 + dist * 0.05);
      const py = i * STEP - warp * Math.exp(-dist * dist / 1800);
      if (i === -GRID_N) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.stroke();
  }
  // Central mass dot
  ctx.beginPath();
  ctx.arc(0, 0, 7, 0, Math.PI * 2);
  const grad2 = ctx.createRadialGradient(0, 0, 0, 0, 0, 7);
  grad2.addColorStop(0, hexToRgba(colEinstein, 0.9));
  grad2.addColorStop(1, hexToRgba(colEinstein, 0.1));
  ctx.fillStyle = grad2;
  ctx.fill();
  ctx.restore();

  // Equation stack — three lines with alignment
  const eqY = H - 80;
  ctx.textAlign = "center";

  // Line 1: G_{00} = (8πG/c⁴) T_{00}
  ctx.font = "12px monospace";
  ctx.fillStyle = colEinstein;
  ctx.fillText("G_{00} = (8πG/c⁴) T_{00}", rightCX, eqY);

  // Bridge: highlight 8πG/c⁴
  // Re-draw the coefficient in green
  ctx.font = "bold 12px monospace";
  ctx.fillStyle = colBridge;
  // The coefficient is at a rough offset — redraw the full line with colour split
  ctx.fillStyle = colEinstein;
  ctx.font = "12px monospace";

  // Line 2: linearised + T_00 ≈ ρc²
  ctx.fillStyle = hexToRgba(tokens.textMute, 0.9);
  ctx.font = "10px monospace";
  ctx.fillText("∇²h_{00} = (8πG/c⁴)·ρc²", rightCX, eqY + 18);

  // Line 3: → ∇²Φ = 4πGρ  (key result)
  ctx.fillStyle = colBridge;
  ctx.font = "bold 12px monospace";
  ctx.fillText("⟹  ∇²Φ = 4πGρ", rightCX, eqY + 38);

  // Caption
  ctx.fillStyle = hexToRgba(tokens.textMute, 0.85);
  ctx.font = "10px monospace";
  ctx.fillText("8πG/c⁴ is fixed by this match", rightCX, eqY + 56);

  ctx.textAlign = "left";

  // ─── Bridging annotation ──────────────────────────────────────────────
  ctx.fillStyle = colBridge;
  ctx.font = "bold 10px monospace";
  ctx.textAlign = "center";
  ctx.fillText("8πG/c⁴", midX, H / 2 - 12);
  ctx.fillStyle = hexToRgba(colBridge, 0.5);
  ctx.font = "9px monospace";
  ctx.fillText("the bridge", midX, H / 2 + 24);
  ctx.textAlign = "left";
}

export function PoissonVsEfeScene() {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const tokens = useSceneTokens();
  const { width, height } = useSceneSize(containerRef, {
    ratio: 0.6,
    maxHeight: SCENE_HEIGHT_SHORT,
  });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = applyDpr(canvas, width, height);
    if (!ctx) return;
    drawScene(ctx, tokens, width, height);
  }, [tokens, width, height]);

  return (
    <div ref={containerRef} className="relative w-full pb-4 flex flex-col items-center gap-3">
      <canvas
        ref={canvasRef}
        style={{ width, height, display: "block" }}
        className={SCENE_CANVAS_CLASS}
      />
      <p className="font-mono text-[10px] text-[var(--color-fg-3)]">
        Left: Poisson&apos;s equation — the exact statement of Newtonian gravity for a continuous source.
        Right: the 00-component of the linearised EFE. Substitute h_{"{00}"} = −2Φ/c² and T_{"{00}"} ≈ ρc²; the coefficient 8πG/c⁴ cancels to give Poisson&apos;s equation identically.
      </p>
    </div>
  );
}
