"use client";

import { useEffect, useRef, useState } from "react";
import { useAnimationFrame } from "@/lib/animation/use-animation-frame";
import { useThemeColors } from "@/lib/hooks/use-theme-colors";
import { longitudinalDoppler } from "@/lib/physics/relativity/doppler-relativistic";

/**
 * FIG.10a — Longitudinal relativistic Doppler.
 *
 *   A monochromatic source emits at f_emit (rest frame). The observer sits
 *   on the right side of the canvas. β controls the source's velocity
 *   along the line of sight: positive β means receding (away from observer);
 *   negative β means approaching.
 *
 *   The visible-spectrum bar at the bottom shows where f_obs lands
 *   (mapped to a wavelength); a tick slides red for receding, blue for
 *   approaching, and a HUD prints f_obs / f_emit.
 *
 *   For pedagogical clarity the spectrum bar uses the visible-light range
 *   380–750 nm centered at 550 nm (green); the source's "rest" wavelength
 *   is set at 550 nm and the observer's perceived wavelength shifts as
 *   λ_obs = λ_emit · √((1+β)/(1−β)).
 */

const RATIO = 0.55;
const MAX_HEIGHT = 360;

const LAMBDA_EMIT_NM = 550; // rest-frame green
const VISIBLE_MIN_NM = 380;
const VISIBLE_MAX_NM = 750;

export function RedshiftBlueshiftScene() {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const colors = useThemeColors();

  const [beta, setBeta] = useState(0.4);
  const betaRef = useRef(beta);
  useEffect(() => {
    betaRef.current = beta;
  }, [beta]);

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

      const b = betaRef.current;
      const fRatio = longitudinalDoppler(1, b); // f_obs / f_emit
      const lambdaObs = LAMBDA_EMIT_NM / fRatio;

      // ── Top panel: source ↔ observer cartoon. ─────────────────────────
      const margin = 20;
      const panelTop = margin;
      const panelBottom = height * 0.62;
      const panelMid = (panelTop + panelBottom) / 2;

      // Centerline
      ctx.strokeStyle = colors.fg3;
      ctx.lineWidth = 1;
      ctx.setLineDash([3, 4]);
      ctx.beginPath();
      ctx.moveTo(margin, panelMid);
      ctx.lineTo(width - margin, panelMid);
      ctx.stroke();
      ctx.setLineDash([]);

      // Observer (always on the right, cyan eye)
      const obsX = width - margin - 22;
      ctx.fillStyle = "#6FB8C6";
      ctx.beginPath();
      ctx.arc(obsX, panelMid, 7, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = colors.fg2;
      ctx.font = "11px monospace";
      ctx.textAlign = "center";
      ctx.fillText("observer", obsX, panelMid + 22);

      // Source (left side, color = observed color shifted from green)
      // Move the source horizontally along the centerline as a function of β,
      // animated so the geometry is visible.
      const tNorm = (t * 0.25) % 1;
      const baseSrcX = margin + 60 + tNorm * 100 * (b > 0 ? -1 : 1);
      const srcX = Math.max(margin + 30, Math.min(obsX - 60, baseSrcX + width * 0.2));
      const srcColor = wavelengthToCss(lambdaObs);

      // Velocity arrow on the source — direction = sign(β); positive = receding (left, away from observer)
      const arrowLen = 24 + 60 * Math.min(0.95, Math.abs(b));
      const arrowDir = b >= 0 ? -1 : 1;
      ctx.strokeStyle = "#FFD93D";
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.moveTo(srcX, panelMid - 18);
      ctx.lineTo(srcX + arrowDir * arrowLen, panelMid - 18);
      ctx.stroke();
      // Arrowhead
      ctx.beginPath();
      ctx.moveTo(srcX + arrowDir * arrowLen, panelMid - 18);
      ctx.lineTo(srcX + arrowDir * arrowLen - arrowDir * 6, panelMid - 22);
      ctx.lineTo(srcX + arrowDir * arrowLen - arrowDir * 6, panelMid - 14);
      ctx.closePath();
      ctx.fillStyle = "#FFD93D";
      ctx.fill();

      // Source disk
      ctx.shadowColor = srcColor;
      ctx.shadowBlur = 16;
      ctx.fillStyle = srcColor;
      ctx.beginPath();
      ctx.arc(srcX, panelMid, 9, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;
      ctx.fillStyle = colors.fg2;
      ctx.fillText("source", srcX, panelMid + 26);

      // Wavefronts emitted by source (animated)
      ctx.lineWidth = 1.0;
      const period = 0.9;
      const nFronts = 5;
      const cScene = 280; // pixel-units / scene-second
      for (let k = 0; k < nFronts; k++) {
        const tEmit = (t - k * period) % (nFronts * period);
        if (tEmit < 0) continue;
        const r = cScene * tEmit * 0.55;
        if (r < 1 || r > width) continue;
        const alpha = Math.max(0.15, 1 - tEmit / (nFronts * period));
        ctx.strokeStyle = withAlpha(srcColor, alpha);
        ctx.beginPath();
        ctx.arc(srcX, panelMid, r, 0, Math.PI * 2);
        ctx.stroke();
      }

      // ── Bottom panel: visible-spectrum bar. ────────────────────────────
      const barTop = panelBottom + 18;
      const barH = 22;
      const barLeft = margin + 4;
      const barRight = width - margin - 4;
      const barW = barRight - barLeft;

      // Gradient: red (left, 750 nm) → violet (right, 380 nm) — i.e. wavelength axis.
      // We invert so longer wavelengths are on the left where "redshift" reads.
      const grad = ctx.createLinearGradient(barLeft, 0, barRight, 0);
      const stops = 12;
      for (let i = 0; i <= stops; i++) {
        const f = i / stops;
        const lamNm = VISIBLE_MAX_NM - f * (VISIBLE_MAX_NM - VISIBLE_MIN_NM);
        grad.addColorStop(f, wavelengthToCss(lamNm));
      }
      ctx.fillStyle = grad;
      ctx.fillRect(barLeft, barTop, barW, barH);

      // Tick: rest-frame λ_emit (550 nm)
      const xRest = barLeft + ((VISIBLE_MAX_NM - LAMBDA_EMIT_NM) / (VISIBLE_MAX_NM - VISIBLE_MIN_NM)) * barW;
      ctx.strokeStyle = colors.fg1;
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      ctx.moveTo(xRest, barTop - 4);
      ctx.lineTo(xRest, barTop + barH + 4);
      ctx.stroke();
      ctx.fillStyle = colors.fg2;
      ctx.font = "10px monospace";
      ctx.textAlign = "center";
      ctx.fillText("λ_emit", xRest, barTop - 7);

      // Tick: λ_obs slides
      const lamClamped = Math.max(VISIBLE_MIN_NM, Math.min(VISIBLE_MAX_NM, lambdaObs));
      const xObs =
        barLeft +
        ((VISIBLE_MAX_NM - lamClamped) / (VISIBLE_MAX_NM - VISIBLE_MIN_NM)) * barW;
      ctx.strokeStyle = b > 0 ? "#FF6B6B" : b < 0 ? "#6FB8C6" : colors.fg1;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(xObs, barTop - 6);
      ctx.lineTo(xObs, barTop + barH + 6);
      ctx.stroke();
      ctx.fillStyle = ctx.strokeStyle;
      ctx.fillText(`λ_obs ${lambdaObs.toFixed(0)} nm`, xObs, barTop + barH + 16);

      // HUD — top-left
      ctx.fillStyle = colors.fg1;
      ctx.font = "12px monospace";
      ctx.textAlign = "left";
      ctx.fillText(`β = ${b.toFixed(2)}`, margin + 6, margin + 12);
      ctx.fillStyle = b > 0 ? "#FF6B6B" : b < 0 ? "#6FB8C6" : colors.fg2;
      const label = b > 0 ? "receding (redshift)" : b < 0 ? "approaching (blueshift)" : "at rest";
      ctx.fillText(label, margin + 6, margin + 28);
      ctx.fillStyle = colors.fg2;
      ctx.fillText(`f_obs / f_emit = ${fRatio.toFixed(3)}`, margin + 6, margin + 44);
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
        <label className="text-sm text-[var(--color-fg-3)]">β = v / c</label>
        <input
          type="range"
          min={-0.95}
          max={0.95}
          step={0.01}
          value={beta}
          onChange={(e) => setBeta(parseFloat(e.target.value))}
          className="flex-1 accent-[#FFD93D]"
        />
        <span className="w-14 text-right text-sm font-mono text-[var(--color-fg-1)]">
          {beta.toFixed(2)}
        </span>
      </div>
    </div>
  );
}

/**
 * Approximate visible-light wavelength → CSS rgb. Adapted from the standard
 * "Wikipedia" piecewise approximation. λ in nanometres. Outside 380–750 nm
 * fades to dark grey.
 */
function wavelengthToCss(lambdaNm: number): string {
  let r = 0;
  let g = 0;
  let b = 0;
  if (lambdaNm >= 380 && lambdaNm < 440) {
    r = -(lambdaNm - 440) / (440 - 380);
    g = 0;
    b = 1;
  } else if (lambdaNm >= 440 && lambdaNm < 490) {
    r = 0;
    g = (lambdaNm - 440) / (490 - 440);
    b = 1;
  } else if (lambdaNm >= 490 && lambdaNm < 510) {
    r = 0;
    g = 1;
    b = -(lambdaNm - 510) / (510 - 490);
  } else if (lambdaNm >= 510 && lambdaNm < 580) {
    r = (lambdaNm - 510) / (580 - 510);
    g = 1;
    b = 0;
  } else if (lambdaNm >= 580 && lambdaNm < 645) {
    r = 1;
    g = -(lambdaNm - 645) / (645 - 580);
    b = 0;
  } else if (lambdaNm >= 645 && lambdaNm <= 750) {
    r = 1;
    g = 0;
    b = 0;
  } else {
    return "rgb(60, 60, 70)";
  }
  // Gentle gamma + scale
  const ri = Math.round(255 * Math.pow(r, 0.8));
  const gi = Math.round(255 * Math.pow(g, 0.8));
  const bi = Math.round(255 * Math.pow(b, 0.8));
  return `rgb(${ri}, ${gi}, ${bi})`;
}

function withAlpha(rgbCss: string, alpha: number): string {
  // Accepts "rgb(r, g, b)" → "rgba(r, g, b, a)". If already rgba/hex, fall through.
  const m = rgbCss.match(/^rgb\((\d+),\s*(\d+),\s*(\d+)\)$/);
  if (!m) return rgbCss;
  return `rgba(${m[1]}, ${m[2]}, ${m[3]}, ${alpha.toFixed(3)})`;
}
