"use client";

import { useEffect, useRef, useState } from "react";
import { useAnimationFrame } from "@/lib/animation/use-animation-frame";
import { longitudinalDoppler } from "@/lib/physics/relativity/doppler-relativistic";
import {
  applyDpr,
  SCENE_CANVAS_CLASS,
  SCENE_HEIGHT_DEFAULT,
  useSceneSize,
  useSceneTokens,
} from "@/components/physics/_shared/scene-tokens";

/**
 * FIG.10a — Longitudinal relativistic Doppler.
 *
 *   λ_obs = λ_emit · √((1+β)/(1−β))
 *
 *   Physically meaningful colors: redshift → red, blueshift → blue,
 *   wavelength bar uses real visible-spectrum mapping.
 */

const LAMBDA_EMIT_NM = 550;
const VISIBLE_MIN_NM = 380;
const VISIBLE_MAX_NM = 750;

export function RedshiftBlueshiftScene() {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const tokens = useSceneTokens();
  const { width, height } = useSceneSize(containerRef, {
    ratio: 0.55,
    maxHeight: SCENE_HEIGHT_DEFAULT,
  });

  const [beta, setBeta] = useState(0.4);
  const betaRef = useRef(beta);
  useEffect(() => {
    betaRef.current = beta;
  }, [beta]);

  useAnimationFrame({
    elementRef: containerRef,
    onFrame: (t) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = applyDpr(canvas, width, height);
      if (!ctx) return;

      ctx.clearRect(0, 0, width, height);
      ctx.fillStyle = tokens.bg;
      ctx.fillRect(0, 0, width, height);

      const b = betaRef.current;
      const fRatio = longitudinalDoppler(1, b);
      const lambdaObs = LAMBDA_EMIT_NM / fRatio;

      const margin = 20;
      const panelTop = margin;
      const panelBottom = height * 0.62;
      const panelMid = (panelTop + panelBottom) / 2;

      ctx.strokeStyle = tokens.panelBorder;
      ctx.lineWidth = 1;
      ctx.setLineDash([3, 4]);
      ctx.beginPath();
      ctx.moveTo(margin, panelMid);
      ctx.lineTo(width - margin, panelMid);
      ctx.stroke();
      ctx.setLineDash([]);

      // Observer
      const obsX = width - margin - 22;
      ctx.fillStyle = tokens.cyan;
      ctx.beginPath();
      ctx.arc(obsX, panelMid, 7, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = tokens.textMute;
      ctx.font = "11px monospace";
      ctx.textAlign = "center";
      ctx.fillText("observer", obsX, panelMid + 22);

      // Source
      const tNorm = (t * 0.25) % 1;
      const baseSrcX = margin + 60 + tNorm * 100 * (b > 0 ? -1 : 1);
      const srcX = Math.max(margin + 30, Math.min(obsX - 60, baseSrcX + width * 0.2));
      const srcColor = wavelengthToCss(lambdaObs);

      const arrowLen = 24 + 60 * Math.min(0.95, Math.abs(b));
      const arrowDir = b >= 0 ? -1 : 1;
      ctx.strokeStyle = tokens.amber;
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.moveTo(srcX, panelMid - 18);
      ctx.lineTo(srcX + arrowDir * arrowLen, panelMid - 18);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(srcX + arrowDir * arrowLen, panelMid - 18);
      ctx.lineTo(srcX + arrowDir * arrowLen - arrowDir * 6, panelMid - 22);
      ctx.lineTo(srcX + arrowDir * arrowLen - arrowDir * 6, panelMid - 14);
      ctx.closePath();
      ctx.fillStyle = tokens.amber;
      ctx.fill();

      ctx.shadowColor = srcColor;
      ctx.shadowBlur = 16;
      ctx.fillStyle = srcColor;
      ctx.beginPath();
      ctx.arc(srcX, panelMid, 9, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;
      ctx.fillStyle = tokens.textMute;
      ctx.fillText("source", srcX, panelMid + 26);

      // Wavefronts
      ctx.lineWidth = 1.0;
      const period = 0.9;
      const nFronts = 5;
      const cScene = 280;
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

      // Spectrum bar
      const barTop = panelBottom + 18;
      const barH = 22;
      const barLeft = margin + 4;
      const barRight = width - margin - 4;
      const barW = barRight - barLeft;

      const grad = ctx.createLinearGradient(barLeft, 0, barRight, 0);
      const stops = 12;
      for (let i = 0; i <= stops; i++) {
        const f = i / stops;
        const lamNm = VISIBLE_MAX_NM - f * (VISIBLE_MAX_NM - VISIBLE_MIN_NM);
        grad.addColorStop(f, wavelengthToCss(lamNm));
      }
      ctx.fillStyle = grad;
      ctx.fillRect(barLeft, barTop, barW, barH);

      const xRest = barLeft + ((VISIBLE_MAX_NM - LAMBDA_EMIT_NM) / (VISIBLE_MAX_NM - VISIBLE_MIN_NM)) * barW;
      ctx.strokeStyle = tokens.textDim;
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      ctx.moveTo(xRest, barTop - 4);
      ctx.lineTo(xRest, barTop + barH + 4);
      ctx.stroke();
      ctx.fillStyle = tokens.textMute;
      ctx.font = "10px monospace";
      ctx.textAlign = "center";
      ctx.fillText("λ_emit", xRest, barTop - 7);

      const lamClamped = Math.max(VISIBLE_MIN_NM, Math.min(VISIBLE_MAX_NM, lambdaObs));
      const xObs =
        barLeft +
        ((VISIBLE_MAX_NM - lamClamped) / (VISIBLE_MAX_NM - VISIBLE_MIN_NM)) * barW;
      ctx.strokeStyle = b > 0 ? tokens.red : b < 0 ? tokens.blue : tokens.textDim;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(xObs, barTop - 6);
      ctx.lineTo(xObs, barTop + barH + 6);
      ctx.stroke();
      ctx.fillStyle = ctx.strokeStyle;
      ctx.fillText(`λ_obs ${lambdaObs.toFixed(0)} nm`, xObs, barTop + barH + 16);

      // HUD
      ctx.fillStyle = tokens.textDim;
      ctx.font = "12px monospace";
      ctx.textAlign = "left";
      ctx.fillText(`β = ${b.toFixed(2)}`, margin + 6, margin + 12);
      ctx.fillStyle = b > 0 ? tokens.red : b < 0 ? tokens.blue : tokens.textMute;
      const label = b > 0 ? "receding (redshift)" : b < 0 ? "approaching (blueshift)" : "at rest";
      ctx.fillText(label, margin + 6, margin + 28);
      ctx.fillStyle = tokens.textMute;
      ctx.fillText(`f_obs / f_emit = ${fRatio.toFixed(3)}`, margin + 6, margin + 44);
    },
  });

  return (
    <div ref={containerRef} className="w-full pb-4">
      <canvas
        ref={canvasRef}
        style={{ width, height, display: "block" }}
        className={SCENE_CANVAS_CLASS}
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
          className="flex-1"
          style={{ accentColor: "var(--color-amber)" }}
        />
        <span className="w-14 text-right text-sm font-mono text-[var(--color-fg-1)]">
          {beta.toFixed(2)}
        </span>
      </div>
    </div>
  );
}

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
  const ri = Math.round(255 * Math.pow(r, 0.8));
  const gi = Math.round(255 * Math.pow(g, 0.8));
  const bi = Math.round(255 * Math.pow(b, 0.8));
  return `rgb(${ri}, ${gi}, ${bi})`;
}

function withAlpha(rgbCss: string, alpha: number): string {
  const m = rgbCss.match(/^rgb\((\d+),\s*(\d+),\s*(\d+)\)$/);
  if (!m) return rgbCss;
  return `rgba(${m[1]}, ${m[2]}, ${m[3]}, ${alpha.toFixed(3)})`;
}
