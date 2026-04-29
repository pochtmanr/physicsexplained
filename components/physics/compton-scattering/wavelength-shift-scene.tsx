"use client";

import { useEffect, useRef, useState } from "react";
import { useAnimationFrame } from "@/lib/animation/use-animation-frame";
import { useThemeColors } from "@/lib/hooks/use-theme-colors";
import {
  COMPTON_WAVELENGTH,
  comptonShift,
  scatteredWavelength,
} from "@/lib/physics/relativity/compton";

/**
 * FIG.19a — Compton wavelength shift.
 *
 *   An X-ray photon (amber, λ = 0.071 nm — Mo Kα) approaches a stationary
 *   electron from the left. The user picks the scattering angle θ via a
 *   slider; the outgoing photon is drawn at that angle, with a colour
 *   indicating its wavelength relative to the incoming one (cooler shade
 *   means redder/longer). The HUD prints Δλ = λ_C (1 − cos θ) and
 *   λ' = λ_in + Δλ in picometres.
 *
 *   Pedagogical anchors:
 *     • θ = 0 → no shift (Δλ = 0, λ' = λ_in).
 *     • θ = π/2 → Δλ = λ_C ≈ 2.43 pm (the Compton-wavelength step).
 *     • θ = π → Δλ = 2 λ_C ≈ 4.85 pm (back-scatter, maximum shift).
 *
 *   Palette: amber for photons (incoming and outgoing); magenta for the
 *   electron (stationary in the scene; recoil drawn schematically); cyan
 *   accents for axes/HUD.
 */

const RATIO = 0.55;
const MAX_HEIGHT = 380;

const LAMBDA_IN_M = 7.1e-11; // Mo Kα — 0.0710 nm = 71 pm

export function WavelengthShiftScene() {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const colors = useThemeColors();

  const [thetaDeg, setThetaDeg] = useState(90);
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
    onFrame: (t) => {
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

      // Layout — collision sits roughly in the middle of the canvas.
      const cx = width * 0.45;
      const cy = height * 0.5;

      // Subtle origin crosshair
      ctx.strokeStyle = colors.fg3;
      ctx.lineWidth = 1;
      ctx.setLineDash([2, 4]);
      ctx.beginPath();
      ctx.moveTo(cx - 30, cy);
      ctx.lineTo(cx + 30, cy);
      ctx.moveTo(cx, cy - 30);
      ctx.lineTo(cx, cy + 30);
      ctx.stroke();
      ctx.setLineDash([]);

      // Stationary electron (magenta dot)
      ctx.fillStyle = "#D86CC4";
      ctx.shadowColor = "#D86CC4";
      ctx.shadowBlur = 12;
      ctx.beginPath();
      ctx.arc(cx, cy, 6, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;
      ctx.fillStyle = colors.fg2;
      ctx.font = "11px monospace";
      ctx.textAlign = "left";
      ctx.fillText("e⁻ (rest)", cx + 10, cy + 16);

      // Incoming photon: amber wavy line travelling rightward into cx,cy.
      const inLen = Math.min(cx - 40, 220);
      const inStart = cx - inLen;
      drawPhoton(ctx, inStart, cy, cx, cy, t, "#FFD93D", 5, 1.0);
      ctx.fillStyle = "#FFD93D";
      ctx.font = "11px monospace";
      ctx.textAlign = "left";
      ctx.fillText(`γ in   λ = ${(LAMBDA_IN_M * 1e12).toFixed(2)} pm`, inStart + 6, cy - 12);

      // Outgoing photon: at angle θ measured CCW from the +x axis (forward).
      // Canvas y axis is flipped → use −sin(θ).
      const outLen = Math.min(width - cx - 40, height * 0.45, 240);
      const ox = cx + Math.cos(theta) * outLen;
      const oy = cy - Math.sin(theta) * outLen;
      // Stretched wavelength → slightly cooler amber for visual cue (lerp toward red).
      const stretch = lambdaOut / LAMBDA_IN_M; // ≥ 1
      const outColor = stretchedAmber(stretch);
      drawPhoton(ctx, cx, cy, ox, oy, t, outColor, Math.min(8, 5 * stretch), 0.95);
      ctx.fillStyle = outColor;
      ctx.fillText(
        `γ out  λ' = ${(lambdaOut * 1e12).toFixed(2)} pm`,
        ox + (Math.cos(theta) >= 0 ? 6 : -130),
        oy + (Math.sin(theta) >= 0 ? -10 : 16),
      );

      // Recoil electron arrow (schematic — direction roughly opposite the
      // outgoing photon's transverse momentum, so it lies on the far side
      // of the incoming axis).
      const recoilLen = 60 * Math.min(1, dLambda / (2 * COMPTON_WAVELENGTH));
      const phi = -theta * 0.45; // schematic — angle decreases with θ
      const rx = cx + Math.cos(phi) * recoilLen;
      const ry = cy - Math.sin(phi) * recoilLen;
      ctx.strokeStyle = "#D86CC4";
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(rx, ry);
      ctx.stroke();
      drawArrowhead(ctx, cx, cy, rx, ry, "#D86CC4", 6);
      ctx.fillStyle = "#D86CC4";
      ctx.fillText("e⁻ recoil", rx + 6, ry + 4);

      // Angle arc
      ctx.strokeStyle = colors.fg2;
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.arc(cx, cy, 30, -theta, 0, theta < 0);
      ctx.stroke();
      ctx.fillStyle = colors.fg1;
      ctx.font = "11px monospace";
      const arcMidAngle = -theta / 2;
      ctx.fillText("θ", cx + 38 * Math.cos(arcMidAngle), cy + 38 * Math.sin(arcMidAngle));

      // HUD — top-left
      ctx.fillStyle = colors.fg1;
      ctx.font = "12px monospace";
      ctx.textAlign = "left";
      const px = 14;
      let py = 16;
      ctx.fillText(`θ = ${thetaRef.current.toFixed(0)}°`, px, py);
      py += 16;
      ctx.fillStyle = colors.fg2;
      ctx.fillText(`λ_C = h / m_e c = ${(COMPTON_WAVELENGTH * 1e12).toFixed(3)} pm`, px, py);
      py += 16;
      ctx.fillStyle = "#FFD93D";
      ctx.fillText(`Δλ = λ_C (1 − cos θ) = ${(dLambda * 1e12).toFixed(3)} pm`, px, py);
      py += 16;
      ctx.fillStyle = colors.fg2;
      ctx.fillText(`λ' / λ_in = ${stretch.toFixed(3)}`, px, py);
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
          max={180}
          step={1}
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

/**
 * Animate a sinusoidal "photon" between (x0,y0) and (x1,y1). The wave runs
 * along the segment with a little phase drift so the eye reads it as motion.
 */
function drawPhoton(
  ctx: CanvasRenderingContext2D,
  x0: number,
  y0: number,
  x1: number,
  y1: number,
  t: number,
  color: string,
  amplitude: number,
  alpha: number,
) {
  const dx = x1 - x0;
  const dy = y1 - y0;
  const len = Math.hypot(dx, dy);
  if (len < 1) return;
  const ux = dx / len;
  const uy = dy / len;
  // perpendicular unit vector (rotate 90° CCW in canvas coords)
  const px = -uy;
  const py = ux;

  ctx.save();
  ctx.strokeStyle = withAlpha(color, alpha);
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  const steps = Math.max(40, Math.floor(len / 4));
  const k = (Math.PI * 2 * 6) / len; // 6 oscillations along the segment
  const phase = t * 6.5;
  for (let i = 0; i <= steps; i++) {
    const s = (i / steps) * len;
    const wave = Math.sin(k * s - phase) * amplitude;
    const x = x0 + ux * s + px * wave;
    const y = y0 + uy * s + py * wave;
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.stroke();
  drawArrowhead(ctx, x0, y0, x1, y1, color, 6);
  ctx.restore();
}

function drawArrowhead(
  ctx: CanvasRenderingContext2D,
  x0: number,
  y0: number,
  x1: number,
  y1: number,
  color: string,
  size: number,
) {
  const dx = x1 - x0;
  const dy = y1 - y0;
  const len = Math.hypot(dx, dy);
  if (len < 1) return;
  const ux = dx / len;
  const uy = dy / len;
  const ax = x1 - ux * size;
  const ay = y1 - uy * size;
  const px = -uy;
  const py = ux;
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(ax + px * size * 0.55, ay + py * size * 0.55);
  ctx.lineTo(ax - px * size * 0.55, ay - py * size * 0.55);
  ctx.closePath();
  ctx.fill();
}

/**
 * As the photon's wavelength stretches, blend the amber from yellow toward
 * a softer orange-red. Stretch is λ'/λ_in ≥ 1; clamp visual change to ≤ 1.07
 * (worst case 2λ_C / 71 pm ≈ 1.068).
 */
function stretchedAmber(stretch: number): string {
  const s = Math.max(0, Math.min(1, (stretch - 1) / 0.07));
  const r = 255;
  const g = Math.round(217 - 60 * s);
  const b = Math.round(61 - 30 * s);
  return `rgb(${r}, ${g}, ${b})`;
}

function withAlpha(rgbCss: string, alpha: number): string {
  const m = rgbCss.match(/^rgb\((\d+),\s*(\d+),\s*(\d+)\)$/);
  if (!m) return rgbCss;
  return `rgba(${m[1]}, ${m[2]}, ${m[3]}, ${alpha.toFixed(3)})`;
}
