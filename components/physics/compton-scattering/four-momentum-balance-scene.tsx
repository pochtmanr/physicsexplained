"use client";

import { useEffect, useRef, useState } from "react";
import { useAnimationFrame } from "@/lib/animation/use-animation-frame";
import { useThemeColors } from "@/lib/hooks/use-theme-colors";
import {
  COMPTON_WAVELENGTH,
  comptonShift,
  scatteredWavelength,
} from "@/lib/physics/relativity/compton";
import { PLANCK_CONSTANT, SPEED_OF_LIGHT, ELECTRON_MASS } from "@/lib/physics/constants";

/**
 * FIG.19b — Four-momentum conservation in Compton scattering.
 *
 *   The canvas is split into two columns — BEFORE and AFTER — connected by a
 *   thin vertical divider. Each column shows the four-momentum vectors for all
 *   participants, drawn as arrows on a (E/c, p) plane:
 *
 *   BEFORE (left):
 *     - Photon in:   p^μ_γ = (h/λ, h/λ, 0)   → amber arrow pointing right
 *     - Electron at rest: p^μ_e = (m_e c, 0, 0) → magenta arrow pointing up
 *
 *   AFTER (right):
 *     - Photon out:  p^μ_γ' = (h/λ', h/λ' cos θ, h/λ' sin θ)  → amber at angle θ
 *     - Electron recoil:  p^μ_e' — determined by conservation  → magenta
 *
 *   Vector-addition arrows confirm: p_γ + p_e = p_γ' + p_e' (four-momentum
 *   conserved). The HUD shows energy and momentum balances numerically.
 *
 *   Palette: amber (#FFD93D) for photons, magenta (#D86CC4) for electrons,
 *   cyan for axis guides and labels.
 */

const RATIO = 0.55;
const MAX_HEIGHT = 380;
const LAMBDA_IN_M = 7.1e-11; // Mo Kα — 0.071 nm = 71 pm

/** Convert a four-momentum component (kg·m/s) to canvas pixels. */
function toCanvas(val: number, scale: number): number {
  return val * scale;
}

function drawArrow(
  ctx: CanvasRenderingContext2D,
  x0: number,
  y0: number,
  x1: number,
  y1: number,
  color: string,
  lineWidth = 2,
  headSize = 8,
) {
  const dx = x1 - x0;
  const dy = y1 - y0;
  const len = Math.hypot(dx, dy);
  if (len < 2) return;
  const ux = dx / len;
  const uy = dy / len;
  ctx.save();
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineWidth = lineWidth;
  ctx.beginPath();
  ctx.moveTo(x0, y0);
  ctx.lineTo(x1, y1);
  ctx.stroke();
  // arrowhead
  const ax = x1 - ux * headSize;
  const ay = y1 - uy * headSize;
  const px = -uy;
  const py = ux;
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(ax + px * headSize * 0.5, ay + py * headSize * 0.5);
  ctx.lineTo(ax - px * headSize * 0.5, ay - py * headSize * 0.5);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

function drawAxisLabel(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  text: string,
  color: string,
) {
  ctx.save();
  ctx.fillStyle = color;
  ctx.font = "10px monospace";
  ctx.textAlign = "center";
  ctx.fillText(text, x, y);
  ctx.restore();
}

export function FourMomentumBalanceScene() {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const colors = useThemeColors();

  const [thetaDeg, setThetaDeg] = useState(60);
  const thetaRef = useRef(thetaDeg);
  useEffect(() => {
    thetaRef.current = thetaDeg;
  }, [thetaDeg]);

  const [size, setSize] = useState({ width: 720, height: 396 });
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const w = entry.contentRect.width;
        if (w > 0) {
          setSize({ width: w, height: Math.min(w * RATIO, MAX_HEIGHT) });
        }
      }
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  useAnimationFrame({
    elementRef: containerRef,
    onFrame: () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      const { width, height } = size;
      const dpr = window.devicePixelRatio || 1;
      if (canvas.width !== width * dpr || canvas.height !== height * dpr) {
        canvas.width = width * dpr;
        canvas.height = height * dpr;
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        ctx.scale(dpr, dpr);
      }

      ctx.clearRect(0, 0, width, height);

      const theta = (thetaRef.current * Math.PI) / 180;
      const dLambda = comptonShift(theta);
      const lambdaOut = scatteredWavelength(LAMBDA_IN_M, theta);

      // --- Four-momentum components (in kg·m/s units) ---
      // Photon in: moves along +x axis.
      const pGammaIn = PLANCK_CONSTANT / LAMBDA_IN_M; // |p_γ| = h/λ
      const EGammaIn = pGammaIn * SPEED_OF_LIGHT; // E_γ = pc

      // Electron at rest: p = 0, E = m_e c²
      const EElecIn = ELECTRON_MASS * SPEED_OF_LIGHT * SPEED_OF_LIGHT;
      const pElecIn = 0;

      // Photon out: at angle θ from +x
      const pGammaOut = PLANCK_CONSTANT / lambdaOut;
      const EGammaOut = pGammaOut * SPEED_OF_LIGHT;
      const pGammaOutX = pGammaOut * Math.cos(theta);
      const pGammaOutY = pGammaOut * Math.sin(theta);

      // Electron recoil: by conservation
      const pElecOutX = pGammaIn - pGammaOutX; // p_ex' = p_γ_in_x - p_γ'_x
      const pElecOutY = -pGammaOutY; // p_ey' = -p_γ'_y (y-momentum conservation)
      const EElecOut = EElecIn + EGammaIn - EGammaOut; // energy conservation

      // Scale: map max momentum to ~30% of half-canvas
      const colW = width / 2;
      const margin = 24;
      const plotW = colW - margin * 2;
      const plotH = height - margin * 2 - 28; // leave room for HUD at bottom

      // Use the electron rest energy as the scale reference
      // (it dominates the energy axis in non-relativistic regime for X-rays)
      const maxE = EElecIn; // ~8.19e-14 J
      const scale = (plotH * 0.38) / maxE; // pixels per J/c → scaled so energy fits

      // Column origins (bottom-center of the diagram area, offset left/right)
      const beforeOriginX = colW * 0.5;
      const afterOriginX = colW + colW * 0.5;
      const originY = margin + plotH * 0.72;

      // Draw background panels
      ctx.fillStyle = "rgba(255,255,255,0.025)";
      ctx.fillRect(0, 0, colW, height);
      ctx.fillStyle = "rgba(255,255,255,0.012)";
      ctx.fillRect(colW, 0, colW, height);

      // Divider
      ctx.strokeStyle = colors.fg3;
      ctx.lineWidth = 1;
      ctx.setLineDash([3, 5]);
      ctx.beginPath();
      ctx.moveTo(colW, margin * 0.5);
      ctx.lineTo(colW, height - margin * 0.5);
      ctx.stroke();
      ctx.setLineDash([]);

      // Column labels
      ctx.fillStyle = colors.fg2;
      ctx.font = "11px monospace";
      ctx.textAlign = "center";
      ctx.fillText("BEFORE SCATTERING", colW * 0.5, margin);
      ctx.fillText("AFTER SCATTERING", colW + colW * 0.5, margin);

      // Axis guides (subtle)
      const axisColor = colors.fg3;
      ctx.strokeStyle = axisColor;
      ctx.lineWidth = 1;
      // E/c axis (vertical) — before
      ctx.beginPath();
      ctx.moveTo(beforeOriginX, originY + 20);
      ctx.lineTo(beforeOriginX, originY - plotH * 0.6);
      ctx.stroke();
      // p axis (horizontal) — before
      ctx.beginPath();
      ctx.moveTo(beforeOriginX - plotW * 0.25, originY);
      ctx.lineTo(beforeOriginX + plotW * 0.5, originY);
      ctx.stroke();
      // Labels
      drawAxisLabel(ctx, beforeOriginX, originY - plotH * 0.62, "E/c", colors.fg2);
      drawAxisLabel(ctx, beforeOriginX + plotW * 0.52, originY, "p_x", colors.fg2);

      // E/c axis (vertical) — after
      ctx.strokeStyle = axisColor;
      ctx.beginPath();
      ctx.moveTo(afterOriginX, originY + 20);
      ctx.lineTo(afterOriginX, originY - plotH * 0.6);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(afterOriginX - plotW * 0.35, originY);
      ctx.lineTo(afterOriginX + plotW * 0.5, originY);
      ctx.stroke();
      drawAxisLabel(ctx, afterOriginX, originY - plotH * 0.62, "E/c", colors.fg2);
      drawAxisLabel(ctx, afterOriginX + plotW * 0.52, originY, "p_x", colors.fg2);

      // --- BEFORE: draw vectors ---
      // Both start from origin. The "sum" is the total four-momentum.

      // Photon in — amber arrow: points in (+px, E_γ/c) plane
      // Visualise as (p_x component, E/c component) → rightward (px) + upward (E/c)
      const GI_px = pGammaIn * scale;
      const GI_Ec = EGammaIn * scale;
      drawArrow(
        ctx,
        beforeOriginX,
        originY,
        beforeOriginX + GI_px,
        originY - GI_Ec,
        "#FFD93D",
        2.2,
        8,
      );
      ctx.fillStyle = "#FFD93D";
      ctx.font = "10px monospace";
      ctx.textAlign = "left";
      ctx.fillText("p^μ_γ (in)", beforeOriginX + GI_px + 5, originY - GI_Ec + 4);

      // Electron at rest — magenta arrow: points purely up (E = m_e c², p = 0)
      const EI_Ec = EElecIn * scale;
      drawArrow(ctx, beforeOriginX, originY, beforeOriginX + pElecIn, originY - EI_Ec, "#D86CC4", 2.2, 8);
      ctx.fillStyle = "#D86CC4";
      ctx.font = "10px monospace";
      ctx.textAlign = "right";
      ctx.fillText("p^μ_e (rest)", beforeOriginX + pElecIn - 5, originY - EI_Ec * 0.5);

      // Total four-momentum before (tip-to-tail arrow from tip of p_γ to sum)
      const totalBeforeEx = beforeOriginX + GI_px;
      const totalBeforeEy = originY - GI_Ec;
      const totalBeforePx = GI_px + pElecIn;
      const totalBeforePy = GI_Ec + EI_Ec;

      // Draw the resultant (tip-to-tail, dotted cyan line for visual sum)
      ctx.strokeStyle = "rgba(111,184,198,0.5)";
      ctx.lineWidth = 1.2;
      ctx.setLineDash([3, 4]);
      ctx.beginPath();
      ctx.moveTo(beforeOriginX, originY);
      ctx.lineTo(beforeOriginX + totalBeforePx, originY - totalBeforePy);
      ctx.stroke();
      ctx.setLineDash([]);
      // Tip label
      ctx.fillStyle = colors.cyan;
      ctx.font = "10px monospace";
      ctx.textAlign = "center";
      ctx.fillText(
        "Σp^μ",
        beforeOriginX + totalBeforePx * 0.7,
        originY - totalBeforePy - 6,
      );

      // --- AFTER: draw vectors ---
      // Photon out at angle θ
      const GO_px = pGammaOutX * scale;
      const GO_py_vis = pGammaOutY * scale; // positive → upward on canvas (flip)
      const GO_Ec = EGammaOut * scale;

      // We plot (p_x, E/c) for photon out — photon out arrow at angle θ in (p_x, E/c) plane
      drawArrow(
        ctx,
        afterOriginX,
        originY,
        afterOriginX + GO_px,
        originY - GO_Ec,
        "#FFD93D",
        2.2,
        8,
      );
      ctx.fillStyle = "#FFD93D";
      ctx.font = "10px monospace";
      ctx.textAlign = GO_px > 0 ? "left" : "right";
      ctx.fillText(
        "p^μ_γ' (out)",
        afterOriginX + GO_px + (GO_px > 0 ? 5 : -5),
        originY - GO_Ec + 4,
      );

      // Also draw p_y component as a small indicator below
      if (Math.abs(GO_py_vis) > 2) {
        ctx.strokeStyle = "rgba(255,217,61,0.45)";
        ctx.lineWidth = 1.2;
        ctx.setLineDash([2, 3]);
        ctx.beginPath();
        ctx.moveTo(afterOriginX + GO_px, originY - GO_Ec);
        ctx.lineTo(afterOriginX + GO_px, originY - GO_Ec + GO_py_vis);
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.fillStyle = "rgba(255,217,61,0.6)";
        ctx.font = "9px monospace";
        ctx.textAlign = "left";
        ctx.fillText("p_y", afterOriginX + GO_px + 4, originY - GO_Ec + GO_py_vis * 0.5);
      }

      // Electron recoil — magenta arrow
      const ER_px = pElecOutX * scale;
      const ER_Ec = (EElecOut / SPEED_OF_LIGHT) * scale; // E/c for display
      drawArrow(
        ctx,
        afterOriginX,
        originY,
        afterOriginX + ER_px,
        originY - ER_Ec,
        "#D86CC4",
        2.2,
        8,
      );
      ctx.fillStyle = "#D86CC4";
      ctx.font = "10px monospace";
      ctx.textAlign = ER_px > 0 ? "left" : "right";
      ctx.fillText(
        "p^μ_e' (recoil)",
        afterOriginX + ER_px + (ER_px > 0 ? 5 : -5),
        originY - ER_Ec + 4,
      );

      // Total after (should match before — cyan dashed resultant)
      const totalAfterPx = GO_px + ER_px;
      const totalAfterPy = GO_Ec + ER_Ec;
      ctx.strokeStyle = "rgba(111,184,198,0.5)";
      ctx.lineWidth = 1.2;
      ctx.setLineDash([3, 4]);
      ctx.beginPath();
      ctx.moveTo(afterOriginX, originY);
      ctx.lineTo(afterOriginX + totalAfterPx, originY - totalAfterPy);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle = colors.cyan;
      ctx.font = "10px monospace";
      ctx.textAlign = "center";
      ctx.fillText(
        "Σp^μ",
        afterOriginX + totalAfterPx * 0.7,
        originY - totalAfterPy - 6,
      );

      // Mass-shell invariant label (bottom)
      ctx.fillStyle = colors.fg2;
      ctx.font = "10px monospace";
      ctx.textAlign = "left";
      ctx.fillText(`|p^μ_γ|² = 0  (photon on null cone)`, margin, height - 36);
      ctx.fillText(
        `|p^μ_e|² = (m_e c)²  (electron on mass shell)`,
        margin,
        height - 24,
      );

      // HUD — top-right: conservation check numbers
      const hudX = width - 12;
      ctx.textAlign = "right";
      ctx.fillStyle = colors.fg1;
      ctx.font = "11px monospace";
      ctx.fillText(`θ = ${thetaRef.current.toFixed(0)}°`, hudX, 16);
      ctx.fillStyle = colors.fg2;
      ctx.fillText(`Δλ = ${(dLambda * 1e12).toFixed(3)} pm`, hudX, 30);
      ctx.fillText(`λ' = ${(lambdaOut * 1e12).toFixed(3)} pm`, hudX, 44);
      ctx.fillStyle = "rgba(111,184,198,0.8)";
      ctx.fillText(`ΔE_γ = ${((EGammaIn - EGammaOut) * 1e17).toFixed(3)} × 10⁻¹⁷ J`, hudX, 60);
      ctx.fillText(`E_e'  = ${(EElecOut * 1e14).toFixed(3)} × 10⁻¹⁴ J`, hudX, 74);
    },
  });

  return (
    <div ref={containerRef} className="w-full pb-4">
      <canvas
        ref={canvasRef}
        style={{ width: size.width, height: size.height }}
        className="block bg-[#0A0C12]"
      />
      <div className="mt-2 flex items-center gap-3 px-2">
        <label className="text-sm text-[var(--color-fg-3)]">θ (degrees)</label>
        <input
          type="range"
          min={0}
          max={170}
          step={5}
          value={thetaDeg}
          onChange={(e) => setThetaDeg(parseFloat(e.target.value))}
          className="flex-1 accent-[#FFD93D]"
        />
        <span className="w-14 text-right text-sm font-mono text-[var(--color-fg-1)]">
          {thetaDeg.toFixed(0)}°
        </span>
      </div>
    </div>
  );
}
