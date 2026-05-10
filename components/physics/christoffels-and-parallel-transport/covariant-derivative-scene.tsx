"use client";

import { useEffect, useRef, useState } from "react";
import {
  SCENE_CANVAS_CLASS,
  SCENE_HEIGHT_DEFAULT,
  applyDpr,
  drawSectionTitle,
  drawArrow,
  drawHudReadout,
  drawDivider,
  hexToRgba,
  useSceneSize,
  useSceneTokens,
} from "@/components/physics/_shared";
import {
  christoffelSymbols,
} from "@/lib/physics/relativity/christoffel";

/**
 * §07 COVARIANT DERIVATIVE SCENE
 *
 * Canvas 2D split panel.
 *
 * LEFT (CYAN section) — flat Cartesian space: a uniform vector field V = (1, 0).
 * The partial derivative ∂_x V^y = 0 everywhere — ∂_μ V^ν is tensorial here.
 *
 * RIGHT (MAGENTA section) — same field in polar coordinates on a flat plane.
 * ∂_r V^φ ≠ 0 even though the field is constant — the basis vectors are position-
 * dependent. The covariant derivative ∇_μ V^ν adds Γ-corrections (amber arrows)
 * to cancel the spurious term. Toggle button shows/hides the correction arrows.
 *
 * Design: scene-tokens palette. Uses drawArrow, drawSectionTitle, drawHudReadout.
 */

// ── Polar metric helpers ──────────────────────────────────────────────────────
function polarMetric(x: readonly number[]): readonly (readonly number[])[] {
  const r = x[0];
  return [
    [1, 0],
    [0, r * r],
  ];
}

function cartToPolar(_cx: number, _cy: number): [number, number] {
  return [Math.hypot(_cx, _cy), Math.atan2(_cy, _cx)];
}

function cartVecToPolar(vx: number, vy: number, phi: number): [number, number] {
  const Vr = vx * Math.cos(phi) + vy * Math.sin(phi);
  const Vphi = -vx * Math.sin(phi) + vy * Math.cos(phi);
  return [Vr, Vphi];
}

function polarVecToCart(Vr: number, Vphi: number, phi: number): [number, number] {
  return [Vr * Math.cos(phi) - Vphi * Math.sin(phi), Vr * Math.sin(phi) + Vphi * Math.cos(phi)];
}

export function CovariantDerivativeScene() {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const tokens = useSceneTokens();
  const { width, height } = useSceneSize(containerRef, {
    ratio: 0.55,
    maxHeight: SCENE_HEIGHT_DEFAULT,
  });
  const [showCorrection, setShowCorrection] = useState(true);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = applyDpr(canvas, width, height);
    if (!ctx) return;
    const W = width;
    const H = height;

    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = tokens.bg;
    ctx.fillRect(0, 0, W, H);

    // ── Central divider ────────────────────────────────────────────────────
    const dividerColor = hexToRgba(tokens.textBright, 0.12);
    drawDivider(ctx, W / 2, W / 2, 16, dividerColor);
    ctx.save();
    ctx.strokeStyle = dividerColor;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(W / 2, 16);
    ctx.lineTo(W / 2, H - 16);
    ctx.stroke();
    ctx.restore();

    // ════════════════════════════════════════════════════════════════════════
    // LEFT PANEL — flat Cartesian (CYAN)
    // ════════════════════════════════════════════════════════════════════════
    const PANEL_W = W / 2;
    const lCx = PANEL_W / 2 + 10;
    const lCy = H / 2 + 8;
    const lScale = 80;

    // Panel tint
    ctx.save();
    ctx.fillStyle = hexToRgba(tokens.cyan, 0.03);
    ctx.fillRect(0, 0, PANEL_W, H);
    ctx.restore();

    // Section title
    drawSectionTitle(ctx, 14, 14, "Cartesian — ∂_μ V^ν is a tensor", tokens.textMute);

    // Grid
    ctx.save();
    ctx.strokeStyle = tokens.grid;
    ctx.lineWidth = 1;
    for (let i = -3; i <= 3; i++) {
      const x = lCx + i * lScale;
      ctx.beginPath();
      ctx.moveTo(x, 30);
      ctx.lineTo(x, H - 30);
      ctx.stroke();
      const y = lCy + i * lScale;
      ctx.beginPath();
      ctx.moveTo(10, y);
      ctx.lineTo(PANEL_W - 10, y);
      ctx.stroke();
    }
    // Axes
    ctx.strokeStyle = hexToRgba(tokens.cyan, 0.35);
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(10, lCy);
    ctx.lineTo(PANEL_W - 10, lCy);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(lCx, 30);
    ctx.lineTo(lCx, H - 30);
    ctx.stroke();
    ctx.restore();

    // Uniform vector field V = (1, 0) — all arrows identical, CYAN
    const arrowLen = 22;
    for (let gx = -2.5; gx <= 2.5; gx += 1) {
      for (let gy = -2.5; gy <= 2.5; gy += 1) {
        const px = lCx + gx * lScale;
        const py = lCy - gy * lScale;
        if (px < 10 || px > PANEL_W - 10) continue;
        if (py < 30 || py > H - 30) continue;
        drawArrow(ctx, px, py, px + arrowLen, py, tokens.cyan, 1.5, 5);
      }
    }

    // HUD readout
    let hy = H - 52;
    hy = drawHudReadout(ctx, 14, hy, "V =", "(1, 0)", tokens.textDim, tokens.cyan);
    drawHudReadout(ctx, 14, hy, "∂V/∂x = ∂V/∂y =", "0  ✓", tokens.textDim, tokens.cyan);

    // ════════════════════════════════════════════════════════════════════════
    // RIGHT PANEL — polar (MAGENTA)
    // ════════════════════════════════════════════════════════════════════════
    const rOffX = PANEL_W;
    const rCx = rOffX + PANEL_W / 2 - 10;
    const rCy = H / 2 + 8;
    const rScale = 80;

    // Panel tint
    ctx.save();
    ctx.fillStyle = hexToRgba(tokens.magenta, 0.03);
    ctx.fillRect(rOffX, 0, PANEL_W, H);
    ctx.restore();

    // Section title
    drawSectionTitle(ctx, rOffX + 14, 14, "Polar — ∂_μ V^ν lies; ∇_μ V^ν is honest", tokens.textMute);

    // Polar grid: circles
    ctx.save();
    ctx.strokeStyle = tokens.grid;
    ctx.lineWidth = 1;
    for (let r = 1; r <= 3; r++) {
      ctx.beginPath();
      ctx.arc(rCx, rCy, r * rScale, 0, 2 * Math.PI);
      ctx.stroke();
    }
    // Radial spokes
    for (let k = 0; k < 8; k++) {
      const phi = (k * Math.PI) / 4;
      ctx.beginPath();
      ctx.moveTo(rCx, rCy);
      ctx.lineTo(rCx + 3 * rScale * Math.cos(phi), rCy - 3 * rScale * Math.sin(phi));
      ctx.stroke();
    }
    // Axes
    ctx.strokeStyle = hexToRgba(tokens.magenta, 0.35);
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(rOffX + 10, rCy);
    ctx.lineTo(rOffX + PANEL_W - 10, rCy);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(rCx, 30);
    ctx.lineTo(rCx, H - 30);
    ctx.stroke();
    ctx.restore();

    // Vector field — same V=(1,0) in polar components (CYAN), Γ-correction (AMBER)
    const rSamples = [0.9, 1.7, 2.5];
    const phiSamples = [0, Math.PI / 4, Math.PI / 2, (3 * Math.PI) / 4, Math.PI, (5 * Math.PI) / 4, (3 * Math.PI) / 2, (7 * Math.PI) / 4];
    const arrowLenPolar = 20;

    for (const r of rSamples) {
      for (const phi of phiSamples) {
        const cx = r * Math.cos(phi);
        const cy = r * Math.sin(phi);
        const px = rCx + cx * rScale;
        const py = rCy - cy * rScale;
        if (px < rOffX + 6 || px > rOffX + PANEL_W - 6) continue;
        if (py < 34 || py > H - 34) continue;

        const [Vr, Vphi] = cartVecToPolar(1, 0, phi);
        const [dx, dy] = polarVecToCart(Vr, Vphi, phi);
        const norm = Math.hypot(dx, dy);
        const dxN = (dx / norm) * arrowLenPolar;
        const dyN = (dy / norm) * arrowLenPolar;

        // Physical vector (same direction as Cartesian (1,0))
        drawArrow(ctx, px, py, px + dxN, py - dyN, tokens.cyan, 1.5, 5);

        // Γ-correction arrow (amber) — appended at the tip of the partial-deriv arrow
        if (showCorrection) {
          const xPolar = [r, phi] as const;
          const Gamma = christoffelSymbols(polarMetric, xPolar);
          const corrR = -(Gamma[0][1][0] * Vr + Gamma[0][1][1] * Vphi);
          const corrPhi = -(Gamma[1][1][0] * Vr + Gamma[1][1][1] * Vphi);
          const [corrDx, corrDy] = polarVecToCart(corrR, corrPhi, phi);
          const corrNorm = Math.hypot(corrDx, corrDy);
          if (corrNorm > 0.01) {
            const scale = 14 / corrNorm;
            const cdx = corrDx * scale;
            const cdy = corrDy * scale;
            ctx.save();
            ctx.globalAlpha = 0.75;
            drawArrow(ctx, px + dxN, py - dyN, px + dxN + cdx, py - dyN - cdy, tokens.amber, 1.2, 4);
            ctx.restore();
          }
        }
      }
    }

    // HUD readouts
    let rhy = H - 52;
    rhy = drawHudReadout(ctx, rOffX + 14, rhy, "V (polar):", "varies by φ", tokens.textDim, tokens.cyan);
    if (showCorrection) {
      drawHudReadout(ctx, rOffX + 14, rhy, "+ Γ correction:", "restores ∇V = 0", tokens.textDim, tokens.amber);
    } else {
      drawHudReadout(ctx, rOffX + 14, rhy, "∂V ≠ 0:", "spurious — coords only", tokens.textDim, tokens.magenta);
    }
  }, [showCorrection, tokens, width, height]);

  return (
    <div ref={containerRef} className="relative w-full pb-4">
      <canvas
        ref={canvasRef}
        style={{ width, height, display: "block" }}
        className={SCENE_CANVAS_CLASS}
        aria-label="Split panel: left shows a uniform vector field in Cartesian coordinates where all partial derivatives vanish; right shows the same field in polar coordinates where ∂-derivatives are spuriously non-zero and amber Christoffel correction arrows demonstrate the covariant derivative ∇V = 0."
      />
      <div className="mt-3 flex items-center gap-3 font-mono text-xs text-[var(--color-fg-1)]">
        <label className="flex items-center gap-2 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={showCorrection}
            onChange={(e) => setShowCorrection(e.target.checked)}
            style={{ accentColor: "var(--color-amber)" }}
          />
          <span>show Γ-correction arrows</span>
        </label>
      </div>
      <div className="flex w-full gap-4 mt-3 font-mono text-xs text-[var(--color-fg-2)]">
        <div className="flex-1 rounded-md border border-[var(--color-fg-4)] bg-[var(--color-bg-1)] p-3">
          <p className="font-semibold mb-1" style={{ color: tokens.cyan }}>Left — Cartesian</p>
          <p>V = (1, 0) constant. ∂_x V^y = 0. ∂-derivative gives a tensor because the basis vectors are constant.</p>
        </div>
        <div className="flex-1 rounded-md border border-[var(--color-fg-4)] bg-[var(--color-bg-1)] p-3">
          <p className="font-semibold mb-1" style={{ color: tokens.magenta }}>Right — Polar</p>
          <p>Same field, different coords. ∂_φ V^r ≠ 0 even though V is constant — basis e_r rotates as φ changes. The amber Γ-correction restores ∇_μ V^ν = 0.</p>
        </div>
      </div>
    </div>
  );
}
