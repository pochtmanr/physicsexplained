"use client";

import { useEffect, useRef, useState } from "react";
import { compensatingDopplerVelocity } from "@/lib/physics/relativity/gravitational-redshift";

/**
 * MossbauerResonanceScene — FIG.27b
 *
 * A schematic Mössbauer absorption spectrum: absorber transmission vs.
 * Doppler velocity of the source. Without recoil broadening (the Mössbauer
 * effect) the resonance line is incredibly narrow — ~10⁻¹² fractional FWHM
 * for the 14.4 keV Fe-57 transition — narrow enough to resolve the 10⁻¹⁵
 * gravitational shift.
 *
 * Two Lorentzian dips overlaid:
 *   • RED  — natural resonance (no gravity), peak at v = 0.
 *   • BLUE — gravitationally shifted resonance, peak shifted by gh/c
 *            ≈ 0.74 μm/s for the 22.5-meter Pound-Rebka tower.
 *
 * The reader sees: to recover resonance, the absorber must be moved at
 * exactly the gravitational compensating velocity. Pound & Rebka modulated
 * a piezoelectric driver at sub-μm/s velocities and read off the shift.
 *
 * Canvas 2D, dark bg. PascalCase export: MossbauerResonanceScene.
 */

const TOWER_HEIGHT_M = 22.5;
const V_COMP = compensatingDopplerVelocity(TOWER_HEIGHT_M); // ≈ 7.36e-7 m/s = 0.736 μm/s
const V_COMP_UMS = V_COMP * 1e6;

// Linewidth (FWHM) for the visualisation: Mössbauer Fe-57 natural linewidth
// is ≈ 0.19 mm/s (a famous textbook number). The gh/c shift sits well inside
// the linewidth at 0.74 μm/s ≪ 190 μm/s — but the *shape* of the dip is
// extremely well-defined, and Pound-Rebka used lock-in modulation to pull
// out the shift from the line centre.
//
// We exaggerate the visual: in the diagram the dip's FWHM is ~3 μm/s so the
// 0.74 μm/s shift is clearly visible. The HUD discloses the real numbers.
const VISUAL_FWHM_UMS = 3.0;
const REAL_FWHM_UMS = 190; // 0.19 mm/s natural linewidth

const BG = "#0A0C12";
const TEXT_BRIGHT = "rgba(255,255,255,0.92)";
const TEXT_DIM = "rgba(255,255,255,0.65)";
const TEXT_MUTE = "rgba(255,255,255,0.45)";
const RED = "#F87171";
const BLUE = "#7DD3FC";
const AMBER = "#FFB36B";
const GREEN = "#86EFAC";

export function MossbauerResonanceScene() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [v, setV] = useState(0);

  // Slider: Doppler velocity of the absorber, in μm/s (range −2 to +2).
  // The reader can find the resonance by sliding to v = +0.74 μm/s.

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dpr = window.devicePixelRatio || 1;
    const W = canvas.clientWidth;
    const H = canvas.clientHeight;
    canvas.width = W * dpr;
    canvas.height = H * dpr;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.scale(dpr, dpr);
    draw(ctx, W, H, v);
  }, [v]);

  // Read absorber transmission at the slider position relative to both lines.
  const transmissionNatural = lorentzian(v, 0, VISUAL_FWHM_UMS);
  const transmissionShifted = lorentzian(v, V_COMP_UMS, VISUAL_FWHM_UMS);

  return (
    <div className="relative w-full">
      <canvas
        ref={canvasRef}
        style={{ width: "100%", height: 380, display: "block" }}
        className="rounded-md border border-white/10 bg-[#0A0C12]"
        aria-label="Mössbauer absorption spectrum: two Lorentzian dips. The red dip at v=0 is the natural resonance; the blue dip at v≈0.74 μm/s is the gravitationally shifted resonance. The compensating Doppler velocity that recovers resonance IS the measurement."
      />
      <div className="px-4 py-3 font-mono text-xs">
        <div className="flex items-center gap-3">
          <span className="text-white/60">v_absorber:</span>
          <input
            type="range"
            min={-2}
            max={2}
            step={0.05}
            value={v}
            onChange={(e) => setV(parseFloat(e.target.value))}
            className="flex-1"
            aria-label="Absorber Doppler velocity in micrometers per second"
          />
          <span className="w-24 text-right tabular-nums text-cyan-200">
            {v >= 0 ? "+" : ""}
            {v.toFixed(2)} μm/s
          </span>
        </div>
        <div className="mt-2 flex justify-between text-[11px] text-white/55">
          <span>
            natural absorption:{" "}
            <span className="text-red-300">
              {(transmissionNatural * 100).toFixed(1)}%
            </span>
          </span>
          <span>
            shifted absorption:{" "}
            <span className="text-sky-300">
              {(transmissionShifted * 100).toFixed(1)}%
            </span>
          </span>
        </div>
      </div>
    </div>
  );
}

/** Normalised Lorentzian (peak = 1 at v0). */
function lorentzian(v: number, v0: number, fwhm: number): number {
  const half = fwhm / 2;
  return (half * half) / ((v - v0) * (v - v0) + half * half);
}

function draw(
  ctx: CanvasRenderingContext2D,
  W: number,
  H: number,
  vSlider: number,
) {
  ctx.fillStyle = BG;
  ctx.fillRect(0, 0, W, H);

  const padL = 56;
  const padR = 24;
  const padT = 36;
  const padB = 60;
  const plotW = W - padL - padR;
  const plotH = H - padT - padB;

  // Plot region — transmission vs Doppler velocity.
  // X axis: −2 to +2 μm/s.
  // Y axis: transmission 1 (top, no absorption) → 0 (bottom, full absorption)
  const vMin = -2;
  const vMax = 2;
  const xToPx = (vv: number) =>
    padL + ((vv - vMin) / (vMax - vMin)) * plotW;
  const yToPx = (tt: number) => padT + (1 - tt) * plotH;

  // ── frame ──
  ctx.save();
  ctx.strokeStyle = "rgba(255,255,255,0.08)";
  ctx.lineWidth = 1;
  ctx.strokeRect(padL, padT, plotW, plotH);
  ctx.restore();

  // ── x ticks ──
  ctx.save();
  ctx.font = "10px ui-monospace, monospace";
  ctx.fillStyle = TEXT_MUTE;
  ctx.textAlign = "center";
  for (const xv of [-2, -1, 0, 1, 2]) {
    const xp = xToPx(xv);
    ctx.beginPath();
    ctx.strokeStyle = "rgba(255,255,255,0.08)";
    ctx.moveTo(xp, padT + plotH);
    ctx.lineTo(xp, padT + plotH + 4);
    ctx.stroke();
    ctx.fillText(`${xv}`, xp, padT + plotH + 18);
  }
  ctx.fillText("absorber Doppler velocity (μm/s)", padL + plotW / 2, padT + plotH + 36);
  ctx.restore();

  // ── y ticks ──
  ctx.save();
  ctx.font = "10px ui-monospace, monospace";
  ctx.fillStyle = TEXT_MUTE;
  ctx.textAlign = "right";
  for (const yv of [0, 0.25, 0.5, 0.75, 1]) {
    const yp = yToPx(yv);
    ctx.fillText(yv.toFixed(2), padL - 6, yp + 3);
    ctx.beginPath();
    ctx.strokeStyle = "rgba(255,255,255,0.06)";
    ctx.moveTo(padL, yp);
    ctx.lineTo(padL + plotW, yp);
    ctx.stroke();
  }
  ctx.save();
  ctx.translate(14, padT + plotH / 2);
  ctx.rotate(-Math.PI / 2);
  ctx.textAlign = "center";
  ctx.fillStyle = TEXT_DIM;
  ctx.fillText("absorption (peak = 1, baseline = 0)", 0, 0);
  ctx.restore();
  ctx.restore();

  // ── natural resonance dip (peaks at v=0) ──
  drawLorentzian(ctx, RED, 0, VISUAL_FWHM_UMS, xToPx, yToPx, vMin, vMax);

  // ── gravitationally shifted dip (peaks at v=V_COMP_UMS) ──
  drawLorentzian(ctx, BLUE, V_COMP_UMS, VISUAL_FWHM_UMS, xToPx, yToPx, vMin, vMax);

  // ── peak markers ──
  ctx.save();
  // natural peak at v=0
  ctx.strokeStyle = RED;
  ctx.lineWidth = 1;
  ctx.setLineDash([4, 3]);
  ctx.beginPath();
  ctx.moveTo(xToPx(0), padT);
  ctx.lineTo(xToPx(0), padT + plotH);
  ctx.stroke();

  // shifted peak at v=V_COMP_UMS
  ctx.strokeStyle = BLUE;
  ctx.beginPath();
  ctx.moveTo(xToPx(V_COMP_UMS), padT);
  ctx.lineTo(xToPx(V_COMP_UMS), padT + plotH);
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.restore();

  // ── peak labels ──
  ctx.save();
  ctx.font = "bold 11px ui-monospace, monospace";
  ctx.textAlign = "center";
  ctx.fillStyle = RED;
  ctx.fillText("natural", xToPx(0) - 10, padT - 8);
  ctx.fillStyle = BLUE;
  ctx.fillText("shifted", xToPx(V_COMP_UMS) + 36, padT - 8);
  ctx.restore();

  // ── slider crosshair ──
  ctx.save();
  ctx.strokeStyle = AMBER;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(xToPx(vSlider), padT);
  ctx.lineTo(xToPx(vSlider), padT + plotH);
  ctx.stroke();
  // marker dots
  const tNat = lorentzian(vSlider, 0, VISUAL_FWHM_UMS);
  const tShift = lorentzian(vSlider, V_COMP_UMS, VISUAL_FWHM_UMS);
  ctx.fillStyle = RED;
  ctx.beginPath();
  ctx.arc(xToPx(vSlider), yToPx(tNat), 4, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = BLUE;
  ctx.beginPath();
  ctx.arc(xToPx(vSlider), yToPx(tShift), 4, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  // ── separation annotation ──
  const xZero = xToPx(0);
  const xShift = xToPx(V_COMP_UMS);
  const sepY = padT + plotH + 4;
  ctx.save();
  ctx.strokeStyle = AMBER;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(xZero, sepY);
  ctx.lineTo(xShift, sepY);
  ctx.stroke();
  ctx.font = "bold 10px ui-monospace, monospace";
  ctx.fillStyle = AMBER;
  ctx.textAlign = "center";
  // place above the bracket
  ctx.fillText(
    `Δv = gh/c ≈ ${V_COMP_UMS.toFixed(2)} μm/s`,
    (xZero + xShift) / 2,
    sepY - 6,
  );
  ctx.restore();

  // ── title + footer ──
  ctx.save();
  ctx.font = "bold 12px ui-monospace, monospace";
  ctx.fillStyle = TEXT_BRIGHT;
  ctx.textAlign = "left";
  ctx.fillText("Fe-57 Mössbauer line · 14.4 keV", padL, 22);
  ctx.font = "10px ui-monospace, monospace";
  ctx.fillStyle = TEXT_MUTE;
  ctx.textAlign = "right";
  ctx.fillText(
    `natural FWHM ≈ ${REAL_FWHM_UMS} μm/s · visual FWHM ≈ ${VISUAL_FWHM_UMS} μm/s (exaggerated)`,
    W - padR,
    22,
  );
  ctx.restore();

  // Footer text
  ctx.save();
  ctx.font = "10px ui-monospace, monospace";
  ctx.fillStyle = GREEN;
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
  // soft fill below the curve
  ctx.lineTo(xToPx(vMax), yToPx(0));
  ctx.lineTo(xToPx(vMin), yToPx(0));
  ctx.closePath();
  ctx.globalAlpha = 0.12;
  ctx.fillStyle = color;
  ctx.fill();
  ctx.restore();
}
