"use client";

import { useEffect, useRef, useState } from "react";
import { compensatingDopplerVelocity } from "@/lib/physics/relativity/gravitational-redshift";
import {
  SCENE_CANVAS_CLASS,
  SCENE_HEIGHT_DEFAULT,
  applyDpr,
  hexToRgba,
  useSceneSize,
  useSceneTokens,
  type SceneTokens,
} from "@/components/physics/_shared/scene-tokens";

/**
 * MossbauerResonanceScene — FIG.27b
 */

const TOWER_HEIGHT_M = 22.5;
const V_COMP = compensatingDopplerVelocity(TOWER_HEIGHT_M);
const V_COMP_UMS = V_COMP * 1e6;

const VISUAL_FWHM_UMS = 3.0;
const REAL_FWHM_UMS = 190;

export function MossbauerResonanceScene() {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const tokens = useSceneTokens();
  const { width, height } = useSceneSize(containerRef, {
    ratio: 0.55,
    maxHeight: SCENE_HEIGHT_DEFAULT,
    minHeight: 280,
  });
  const [v, setV] = useState(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = applyDpr(canvas, width, height);
    if (!ctx) return;
    draw(ctx, width, height, v, tokens);
  }, [v, tokens, width, height]);

  const transmissionNatural = lorentzian(v, 0, VISUAL_FWHM_UMS);
  const transmissionShifted = lorentzian(v, V_COMP_UMS, VISUAL_FWHM_UMS);

  return (
    <div ref={containerRef} className="relative w-full pb-4">
      <canvas
        ref={canvasRef}
        style={{ width, height, display: "block" }}
        className={SCENE_CANVAS_CLASS}
        aria-label="Mössbauer absorption spectrum: two Lorentzian dips. The red dip at v=0 is the natural resonance; the blue dip at v≈0.74 μm/s is the gravitationally shifted resonance. The compensating Doppler velocity that recovers resonance IS the measurement."
      />
      <div className="px-4 py-3 font-mono text-xs">
        <div className="flex items-center gap-3">
          <span className="text-[var(--color-fg-3)]">v_absorber:</span>
          <input
            type="range"
            min={-2}
            max={2}
            step={0.05}
            value={v}
            onChange={(e) => setV(parseFloat(e.target.value))}
            className="flex-1"
            style={{ accentColor: "var(--color-amber)" }}
            aria-label="Absorber Doppler velocity in micrometers per second"
          />
          <span className="w-24 text-right tabular-nums" style={{ color: tokens.cyan }}>
            {v >= 0 ? "+" : ""}
            {v.toFixed(2)} μm/s
          </span>
        </div>
        <div className="mt-2 flex justify-between text-[11px] text-[var(--color-fg-3)]">
          <span>
            natural absorption:{" "}
            <span style={{ color: tokens.red }}>
              {(transmissionNatural * 100).toFixed(1)}%
            </span>
          </span>
          <span>
            shifted absorption:{" "}
            <span style={{ color: tokens.blue }}>
              {(transmissionShifted * 100).toFixed(1)}%
            </span>
          </span>
        </div>
      </div>
    </div>
  );
}

function lorentzian(v: number, v0: number, fwhm: number): number {
  const half = fwhm / 2;
  return (half * half) / ((v - v0) * (v - v0) + half * half);
}

function draw(
  ctx: CanvasRenderingContext2D,
  W: number,
  H: number,
  vSlider: number,
  tokens: SceneTokens,
) {
  ctx.fillStyle = tokens.bg;
  ctx.fillRect(0, 0, W, H);

  const padL = 56;
  const padR = 24;
  const padT = 36;
  const padB = 60;
  const plotW = W - padL - padR;
  const plotH = H - padT - padB;

  const vMin = -2;
  const vMax = 2;
  const xToPx = (vv: number) => padL + ((vv - vMin) / (vMax - vMin)) * plotW;
  const yToPx = (tt: number) => padT + (1 - tt) * plotH;

  ctx.save();
  ctx.strokeStyle = hexToRgba(tokens.textBright, 0.08);
  ctx.lineWidth = 1;
  ctx.strokeRect(padL, padT, plotW, plotH);
  ctx.restore();

  ctx.save();
  ctx.font = "10px ui-monospace, monospace";
  ctx.fillStyle = tokens.textFaint;
  ctx.textAlign = "center";
  for (const xv of [-2, -1, 0, 1, 2]) {
    const xp = xToPx(xv);
    ctx.beginPath();
    ctx.strokeStyle = hexToRgba(tokens.textBright, 0.08);
    ctx.moveTo(xp, padT + plotH);
    ctx.lineTo(xp, padT + plotH + 4);
    ctx.stroke();
    ctx.fillText(`${xv}`, xp, padT + plotH + 18);
  }
  ctx.fillText("absorber Doppler velocity (μm/s)", padL + plotW / 2, padT + plotH + 36);
  ctx.restore();

  ctx.save();
  ctx.font = "10px ui-monospace, monospace";
  ctx.fillStyle = tokens.textFaint;
  ctx.textAlign = "right";
  for (const yv of [0, 0.25, 0.5, 0.75, 1]) {
    const yp = yToPx(yv);
    ctx.fillText(yv.toFixed(2), padL - 6, yp + 3);
    ctx.beginPath();
    ctx.strokeStyle = hexToRgba(tokens.textBright, 0.06);
    ctx.moveTo(padL, yp);
    ctx.lineTo(padL + plotW, yp);
    ctx.stroke();
  }
  ctx.save();
  ctx.translate(14, padT + plotH / 2);
  ctx.rotate(-Math.PI / 2);
  ctx.textAlign = "center";
  ctx.fillStyle = tokens.textDim;
  ctx.fillText("absorption (peak = 1, baseline = 0)", 0, 0);
  ctx.restore();
  ctx.restore();

  drawLorentzian(ctx, tokens.red, 0, VISUAL_FWHM_UMS, xToPx, yToPx, vMin, vMax);
  drawLorentzian(ctx, tokens.blue, V_COMP_UMS, VISUAL_FWHM_UMS, xToPx, yToPx, vMin, vMax);

  ctx.save();
  ctx.strokeStyle = tokens.red;
  ctx.lineWidth = 1;
  ctx.setLineDash([4, 3]);
  ctx.beginPath();
  ctx.moveTo(xToPx(0), padT);
  ctx.lineTo(xToPx(0), padT + plotH);
  ctx.stroke();

  ctx.strokeStyle = tokens.blue;
  ctx.beginPath();
  ctx.moveTo(xToPx(V_COMP_UMS), padT);
  ctx.lineTo(xToPx(V_COMP_UMS), padT + plotH);
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.restore();

  ctx.save();
  ctx.font = "bold 11px ui-monospace, monospace";
  ctx.textAlign = "center";
  ctx.fillStyle = tokens.red;
  ctx.fillText("natural", xToPx(0) - 10, padT - 8);
  ctx.fillStyle = tokens.blue;
  ctx.fillText("shifted", xToPx(V_COMP_UMS) + 36, padT - 8);
  ctx.restore();

  ctx.save();
  ctx.strokeStyle = tokens.amber;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(xToPx(vSlider), padT);
  ctx.lineTo(xToPx(vSlider), padT + plotH);
  ctx.stroke();
  const tNat = lorentzian(vSlider, 0, VISUAL_FWHM_UMS);
  const tShift = lorentzian(vSlider, V_COMP_UMS, VISUAL_FWHM_UMS);
  ctx.fillStyle = tokens.red;
  ctx.beginPath();
  ctx.arc(xToPx(vSlider), yToPx(tNat), 4, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = tokens.blue;
  ctx.beginPath();
  ctx.arc(xToPx(vSlider), yToPx(tShift), 4, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  const xZero = xToPx(0);
  const xShift = xToPx(V_COMP_UMS);
  const sepY = padT + plotH + 4;
  ctx.save();
  ctx.strokeStyle = tokens.amber;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(xZero, sepY);
  ctx.lineTo(xShift, sepY);
  ctx.stroke();
  ctx.font = "bold 10px ui-monospace, monospace";
  ctx.fillStyle = tokens.amber;
  ctx.textAlign = "center";
  ctx.fillText(
    `Δv = gh/c ≈ ${V_COMP_UMS.toFixed(2)} μm/s`,
    (xZero + xShift) / 2,
    sepY - 6,
  );
  ctx.restore();

  ctx.save();
  ctx.font = "bold 12px ui-monospace, monospace";
  ctx.fillStyle = tokens.textBright;
  ctx.textAlign = "left";
  ctx.fillText("Fe-57 Mössbauer line · 14.4 keV", padL, 22);
  ctx.font = "10px ui-monospace, monospace";
  ctx.fillStyle = tokens.textFaint;
  ctx.textAlign = "right";
  ctx.fillText(
    `natural FWHM ≈ ${REAL_FWHM_UMS} μm/s · visual FWHM ≈ ${VISUAL_FWHM_UMS} μm/s (exaggerated)`,
    W - padR,
    22,
  );
  ctx.restore();

  ctx.save();
  ctx.font = "10px ui-monospace, monospace";
  ctx.fillStyle = tokens.mint;
  ctx.textAlign = "center";
  ctx.fillText(
    "Move the absorber at the gravitational compensating velocity → resonance returns.",
    padL + plotW / 2,
    H - 14,
  );
  ctx.restore();
}

function drawLorentzian(
  ctx: CanvasRenderingContext2D,
  color: string,
  v0: number,
  fwhm: number,
  xToPx: (v: number) => number,
  yToPx: (t: number) => number,
  vMin: number,
  vMax: number,
) {
  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = 2;
  ctx.beginPath();
  const N = 200;
  for (let i = 0; i <= N; i++) {
    const vv = vMin + (vMax - vMin) * (i / N);
    const tt = lorentzian(vv, v0, fwhm);
    const xp = xToPx(vv);
    const yp = yToPx(tt);
    if (i === 0) ctx.moveTo(xp, yp);
    else ctx.lineTo(xp, yp);
  }
  ctx.stroke();
  ctx.lineTo(xToPx(vMax), yToPx(0));
  ctx.lineTo(xToPx(vMin), yToPx(0));
  ctx.closePath();
  ctx.globalAlpha = 0.12;
  ctx.fillStyle = color;
  ctx.fill();
  ctx.restore();
}
