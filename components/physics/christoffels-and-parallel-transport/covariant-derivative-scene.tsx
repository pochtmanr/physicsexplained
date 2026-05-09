"use client";

import { useEffect, useRef, useState } from "react";
import {
  christoffelSymbols,
  sphericalMetric,
} from "@/lib/physics/relativity/christoffel";

/**
 * §07 COVARIANT DERIVATIVE SCENE
 *
 * Canvas 2D split panel.
 *
 * LEFT — flat Cartesian space: a uniform vector field V = (1, 0). The partial
 * derivative ∂_x V^y = 0 everywhere — correct for a constant field. The
 * grid is regular; the arrows all point the same way; ∂_μ V^ν is tensorial here.
 *
 * RIGHT — the same vector field expressed in polar coordinates on a flat plane.
 * The partial derivatives ∂_r V^φ give a non-zero result even though the field
 * is constant — because the basis vectors are position-dependent. The covariant
 * derivative ∇_r V^φ = ∂_r V^φ + Γ^φ_{rμ} V^μ cancels the spurious term and
 * correctly returns zero. The Christoffel correction is drawn as a second arrow.
 */

const W = 660;
const H = 340;
const PANEL_W = 300;
const GAP = 60;

// ── Polar metric helpers ──────────────────────────────────────────────────────
// Polar Euclidean metric: g = diag(1, r²). x = [r, φ].
function polarMetric(x: readonly number[]): readonly (readonly number[])[] {
  const r = x[0];
  return [
    [1, 0],
    [0, r * r],
  ];
}

/** Convert Cartesian (cx, cy) to polar [r, φ]. */
function cartToPolar(cx: number, cy: number): [number, number] {
  return [Math.hypot(cx, cy), Math.atan2(cy, cx)];
}

/** Convert a Cartesian vector (vx, vy) to polar components (V^r, V^φ) at (r, φ). */
function cartVecToPolar(vx: number, vy: number, phi: number): [number, number] {
  const Vr = vx * Math.cos(phi) + vy * Math.sin(phi);
  const Vphi = -vx * Math.sin(phi) + vy * Math.cos(phi);
  return [Vr, Vphi];
}

/** Convert polar vector components back to Cartesian for drawing. */
function polarVecToCart(Vr: number, Vphi: number, phi: number): [number, number] {
  return [Vr * Math.cos(phi) - Vphi * Math.sin(phi), Vr * Math.sin(phi) + Vphi * Math.cos(phi)];
}

type Panel = "cartesian" | "polar";

export function CovariantDerivativeScene() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [hoveredPanel, setHoveredPanel] = useState<Panel>("cartesian");
  const [showCorrection, setShowCorrection] = useState(true);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = typeof window !== "undefined" ? (window.devicePixelRatio ?? 1) : 1;
    canvas.width = W * dpr;
    canvas.height = H * dpr;
    canvas.style.width = `${W}px`;
    canvas.style.height = `${H}px`;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = "#0A0C12";
    ctx.fillRect(0, 0, W, H);

    // ── Divider ────────────────────────────────────────────────────────────
    ctx.strokeStyle = "rgba(255,255,255,0.12)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(W / 2, 20);
    ctx.lineTo(W / 2, H - 20);
    ctx.stroke();

    // ── LEFT PANEL: flat Cartesian ─────────────────────────────────────────
    const lCx = PANEL_W / 2 + 15;
    const lCy = H / 2;
    const lScale = 90; // px per unit

    // Grid
    ctx.strokeStyle = "rgba(255,255,255,0.10)";
    ctx.lineWidth = 1;
    for (let i = -3; i <= 3; i++) {
      const x = lCx + i * lScale;
      ctx.beginPath();
      ctx.moveTo(x, 20);
      ctx.lineTo(x, H - 20);
      ctx.stroke();
      const y = lCy + i * lScale;
      ctx.beginPath();
      ctx.moveTo(15, y);
      ctx.lineTo(PANEL_W + 15, y);
      ctx.stroke();
    }

    // Axes
    ctx.strokeStyle = "rgba(255,255,255,0.25)";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(15, lCy);
    ctx.lineTo(PANEL_W + 15, lCy);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(lCx, 20);
    ctx.lineTo(lCx, H - 20);
    ctx.stroke();

    // Uniform vector field V = (1, 0) — all arrows identical, tightly spaced
    const arrowLen = 22;
    ctx.strokeStyle = "#67E8F9";
    ctx.fillStyle = "#67E8F9";
    const headLen = 5;
    const headAng = 0.5;
    for (let gx = -2.5; gx <= 2.5; gx += 1) {
      for (let gy = -2.5; gy <= 2.5; gy += 1) {
        const px = lCx + gx * lScale;
        const py = lCy - gy * lScale;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(px, py);
        ctx.lineTo(px + arrowLen, py);
        ctx.stroke();
        const ang = 0;
        ctx.beginPath();
        ctx.moveTo(px + arrowLen, py);
        ctx.lineTo(px + arrowLen - headLen * Math.cos(ang - headAng), py - headLen * Math.sin(ang - headAng));
        ctx.lineTo(px + arrowLen - headLen * Math.cos(ang + headAng), py - headLen * Math.sin(ang + headAng));
        ctx.closePath();
        ctx.fill();
      }
    }

    // Label
    ctx.fillStyle = "rgba(255,255,255,0.85)";
    ctx.font = "bold 11px ui-monospace, monospace";
    ctx.textAlign = "center";
    ctx.fillText("CARTESIAN — ∂_μ V^ν is a tensor", lCx, H - 14);

    ctx.fillStyle = "#67E8F9";
    ctx.font = "11px ui-monospace, monospace";
    ctx.fillText("V = (1, 0)    ∂V/∂x = ∂V/∂y = 0 ✓", lCx, H - 28);

    // ── RIGHT PANEL: polar ─────────────────────────────────────────────────
    const rOffX = W / 2 + GAP / 2;
    const rCx = rOffX + PANEL_W / 2;
    const rCy = H / 2;
    const rScale = 90;

    // Polar grid: circles
    ctx.strokeStyle = "rgba(255,255,255,0.10)";
    ctx.lineWidth = 1;
    for (let r = 1; r <= 3; r++) {
      ctx.beginPath();
      ctx.arc(rCx, rCy, r * rScale, 0, 2 * Math.PI);
      ctx.stroke();
    }
    // Polar grid: radial spokes
    for (let k = 0; k < 8; k++) {
      const phi = (k * Math.PI) / 4;
      ctx.beginPath();
      ctx.moveTo(rCx, rCy);
      ctx.lineTo(rCx + 3 * rScale * Math.cos(phi), rCy - 3 * rScale * Math.sin(phi));
      ctx.stroke();
    }

    // Axes
    ctx.strokeStyle = "rgba(255,255,255,0.25)";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(rOffX, rCy);
    ctx.lineTo(rOffX + PANEL_W, rCy);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(rCx, 20);
    ctx.lineTo(rCx, H - 20);
    ctx.stroke();

    // Sample points on the polar grid; transform the constant vector field V=(1,0) into polar
    const rSamples = [0.9, 1.7, 2.5];
    const phiSamples = [0, Math.PI / 4, Math.PI / 2, (3 * Math.PI) / 4, Math.PI, (5 * Math.PI) / 4, (3 * Math.PI) / 2, (7 * Math.PI) / 4];

    for (const r of rSamples) {
      for (const phi of phiSamples) {
        const cx = r * Math.cos(phi);
        const cy = r * Math.sin(phi);
        const px = rCx + cx * rScale;
        const py = rCy - cy * rScale;
        if (px < rOffX + 5 || px > rOffX + PANEL_W - 5) continue;
        if (py < 25 || py > H - 30) continue;

        // V = (1, 0) in Cartesian → polar components
        const [Vr, Vphi] = cartVecToPolar(1, 0, phi);

        // Draw partial-derivative "wrong" arrow — the raw polar component arrow
        const [dx, dy] = polarVecToCart(Vr, Vphi, phi);
        const partialArrowLen = 20;
        const norm = Math.hypot(dx, dy);
        const dxN = (dx / norm) * partialArrowLen;
        const dyN = (dy / norm) * partialArrowLen;

        // This is the same as V=(1,0) in Cartesian — correct physical direction
        ctx.strokeStyle = "#67E8F9";
        ctx.fillStyle = "#67E8F9";
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(px, py);
        ctx.lineTo(px + dxN, py - dyN);
        ctx.stroke();
        const ang = Math.atan2(-dyN, dxN);
        ctx.beginPath();
        ctx.moveTo(px + dxN, py - dyN);
        ctx.lineTo(px + dxN - headLen * Math.cos(ang - headAng), py - dyN - headLen * Math.sin(ang - headAng));
        ctx.lineTo(px + dxN - headLen * Math.cos(ang + headAng), py - dyN - headLen * Math.sin(ang + headAng));
        ctx.closePath();
        ctx.fill();

        // Draw the Christoffel correction term when enabled
        if (showCorrection) {
          // The correction Γ^μ_{νρ} V^ρ is the difference between ∂-derivative result and ∇-derivative result.
          // In polar coords: ∂_φ V^r = -V^φ/r ≠ 0 even for constant V.
          // The covariant derivative adds Γ terms to cancel this.
          // Visualise the correction as a small amber arrow perpendicular to V at each point.
          const xPolar = [r, phi] as const;
          const Gamma = christoffelSymbols(polarMetric, xPolar);
          // Compute dV_partial/dφ in polar (the "spurious" change):
          // ∂_φ V^r = 0 + Γ^r_{φμ} V^μ applied in reverse
          // Correction arrow magnitude (Γ^r_{φφ} V^φ) in Cartesian screen direction
          const corrR = -(Gamma[0][1][0] * Vr + Gamma[0][1][1] * Vphi);
          const corrPhi = -(Gamma[1][1][0] * Vr + Gamma[1][1][1] * Vphi);
          const [corrDx, corrDy] = polarVecToCart(corrR, corrPhi, phi);
          const corrNorm = Math.hypot(corrDx, corrDy);
          if (corrNorm > 0.01) {
            const scale = 14 / corrNorm;
            const cdx = corrDx * scale;
            const cdy = corrDy * scale;
            ctx.strokeStyle = "#FBBF24";
            ctx.fillStyle = "#FBBF24";
            ctx.lineWidth = 1.2;
            ctx.globalAlpha = 0.7;
            ctx.beginPath();
            ctx.moveTo(px + dxN, py - dyN);
            ctx.lineTo(px + dxN + cdx, py - dyN - cdy);
            ctx.stroke();
            const cAng = Math.atan2(-cdy, cdx);
            ctx.beginPath();
            ctx.moveTo(px + dxN + cdx, py - dyN - cdy);
            ctx.lineTo(px + dxN + cdx - 4 * Math.cos(cAng - headAng), py - dyN - cdy - 4 * Math.sin(cAng - headAng));
            ctx.lineTo(px + dxN + cdx - 4 * Math.cos(cAng + headAng), py - dyN - cdy - 4 * Math.sin(cAng + headAng));
            ctx.closePath();
            ctx.fill();
            ctx.globalAlpha = 1;
          }
        }
      }
    }

    ctx.fillStyle = "rgba(255,255,255,0.85)";
    ctx.font = "bold 11px ui-monospace, monospace";
    ctx.textAlign = "center";
    ctx.fillText("POLAR — ∂_μ V^ν lies; ∇_μ V^ν is honest", rCx, H - 14);

    ctx.font = "11px ui-monospace, monospace";
    ctx.fillStyle = "#67E8F9";
    ctx.fillText("V (polar components)", rCx - 40, H - 28);
    if (showCorrection) {
      ctx.fillStyle = "#FBBF24";
      ctx.fillText("+ Γ correction", rCx + 50, H - 28);
    }
  }, [hoveredPanel, showCorrection]);

  return (
    <div className="flex flex-col items-center gap-3">
      <canvas
        ref={canvasRef}
        className="rounded-md border border-white/10 bg-black/40"
        onMouseMove={(e) => {
          const rect = e.currentTarget.getBoundingClientRect();
          const x = e.clientX - rect.left;
          setHoveredPanel(x < W / 2 ? "cartesian" : "polar");
        }}
      />
      <label className="flex items-center gap-2 font-mono text-xs text-white/70 cursor-pointer select-none">
        <input
          type="checkbox"
          checked={showCorrection}
          onChange={(e) => setShowCorrection(e.target.checked)}
          className="accent-amber-400"
        />
        <span>show Christoffel correction (amber arrows)</span>
      </label>
      <div className="flex w-full max-w-[660px] gap-4 font-mono text-xs text-white/60">
        <div className="flex-1 rounded-md border border-white/10 bg-white/5 p-3">
          <p className="font-semibold text-[#67E8F9] mb-1">Left — Cartesian</p>
          <p>V = (1, 0) constant. ∂_x V^y = 0. ∂-derivative gives a tensor because the basis vectors are constant.</p>
        </div>
        <div className="flex-1 rounded-md border border-white/10 bg-white/5 p-3">
          <p className="font-semibold text-[#67E8F9] mb-1">Right — Polar</p>
          <p>Same field, different coords. ∂_φ V^r ≠ 0 even though V is constant — basis e_r rotates as φ changes. The amber Γ-correction restores ∇_μ V^ν = 0.</p>
        </div>
      </div>
    </div>
  );
}
