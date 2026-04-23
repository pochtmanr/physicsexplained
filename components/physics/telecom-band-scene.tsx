"use client";

import { useEffect, useRef } from "react";

/**
 * FIG.51c — Telecom-band attenuation scene.
 *
 * Attenuation (dB/km) of standard silica single-mode fiber versus wavelength
 * across the 800–1700 nm span. Three operating windows are highlighted:
 *   - 850 nm — short-reach / datacentre multimode
 *   - 1310 nm — zero-dispersion, standard long-haul
 *   - 1550 nm — absolute loss minimum, EDFA band
 *
 * The curve is a didactic sketch, not a datasheet. We combine three ingredients
 * that match real silica fiber qualitatively:
 *
 *   α(λ) ≈ α_Rayleigh(λ) + α_IR(λ) + α_OH(λ)
 *
 * with α_Rayleigh ∝ 1/λ⁴ dominating below 1000 nm, a broad IR vibrational
 * absorption tail above 1600 nm, and a residual OH peak near 1385 nm (the
 * classical "E-band" water absorption that modern fiber processes have
 * mostly eliminated, but that belongs on a pedagogical curve).
 *
 * Readers learn two things by eye: attenuation *drops* from 850 to 1550 nm
 * by an order of magnitude, and 1550 sits at the floor of a bowl — every
 * dB-km saved by an undersea cable is ultimately explained by this graph.
 */

const WIDTH = 720;
const HEIGHT = 340;
const LAMBDA_MIN_NM = 800;
const LAMBDA_MAX_NM = 1700;
const ALPHA_MAX_DBKM = 4.0;

const WINDOWS: { centre: number; floor: number; label: string; color: string }[] = [
  { centre: 850, floor: 2.0, label: "850 nm", color: "rgba(255, 120, 80," },
  { centre: 1310, floor: 0.35, label: "1310 nm", color: "rgba(111, 184, 198," },
  { centre: 1550, floor: 0.17, label: "1550 nm", color: "rgba(228, 194, 122," },
];

/** α_Rayleigh ∝ 1/λ⁴ — calibrated to hit ~2 dB/km at 850 nm. */
function alphaRayleigh(lambdaNm: number): number {
  const lambda_um = lambdaNm / 1000;
  // A · λ⁻⁴ with λ in µm. At λ = 0.85 µm we want ≈ 2 dB/km.
  // 2 = A / 0.85⁴ → A = 2 · 0.85⁴ ≈ 1.044.
  return 1.044 / Math.pow(lambda_um, 4);
}

/** IR absorption tail — steeply rising above ~1600 nm. */
function alphaIR(lambdaNm: number): number {
  // Exponential rise starting around 1400 nm; we want ≈ 0.5 dB/km near 1625
  // and ≈ 2 dB/km near 1700.
  if (lambdaNm < 1200) return 0;
  const z = (lambdaNm - 1200) / 120;
  return 0.008 * Math.exp(z);
}

/** Residual OH peak at 1385 nm, a few tenths wide. */
function alphaOH(lambdaNm: number): number {
  const z = (lambdaNm - 1385) / 40;
  return 1.2 * Math.exp(-z * z);
}

function totalAttenuation(lambdaNm: number): number {
  return alphaRayleigh(lambdaNm) + alphaIR(lambdaNm) + alphaOH(lambdaNm);
}

export function TelecomBandScene() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const cv = canvasRef.current;
    if (!cv) return;
    const ctx = cv.getContext("2d");
    if (!ctx) return;
    const dpr = window.devicePixelRatio || 1;
    if (cv.width !== WIDTH * dpr || cv.height !== HEIGHT * dpr) {
      cv.width = WIDTH * dpr;
      cv.height = HEIGHT * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    ctx.clearRect(0, 0, WIDTH, HEIGHT);

    const padL = 60;
    const padR = 20;
    const padT = 30;
    const padB = 50;
    const plotW = WIDTH - padL - padR;
    const plotH = HEIGHT - padT - padB;

    const xAt = (lam: number) =>
      padL + ((lam - LAMBDA_MIN_NM) / (LAMBDA_MAX_NM - LAMBDA_MIN_NM)) * plotW;
    const yAt = (a: number) => padT + (1 - Math.min(1, a / ALPHA_MAX_DBKM)) * plotH;

    // Axes frame
    ctx.strokeStyle = "rgba(180, 196, 216, 0.20)";
    ctx.lineWidth = 1;
    ctx.strokeRect(padL, padT, plotW, plotH);

    // Window bands (shaded vertical stripes)
    for (const w of WINDOWS) {
      const x = xAt(w.centre);
      const halfW = 22;
      const grad = ctx.createLinearGradient(x - halfW, 0, x + halfW, 0);
      grad.addColorStop(0, `${w.color} 0)`);
      grad.addColorStop(0.5, `${w.color} 0.18)`);
      grad.addColorStop(1, `${w.color} 0)`);
      ctx.fillStyle = grad;
      ctx.fillRect(x - halfW, padT, 2 * halfW, plotH);
    }

    // Grid — horizontal lines every 1 dB/km
    ctx.strokeStyle = "rgba(180, 196, 216, 0.08)";
    ctx.setLineDash([2, 4]);
    for (let a = 1; a < ALPHA_MAX_DBKM; a += 1) {
      const y = yAt(a);
      ctx.beginPath();
      ctx.moveTo(padL, y);
      ctx.lineTo(padL + plotW, y);
      ctx.stroke();
    }
    ctx.setLineDash([]);

    // Axes tick labels
    ctx.fillStyle = "rgba(230, 236, 244, 0.60)";
    ctx.font = "10px ui-monospace, monospace";
    ctx.textAlign = "right";
    for (let a = 0; a <= ALPHA_MAX_DBKM; a += 1) {
      const y = yAt(a);
      ctx.fillText(`${a.toFixed(0)}`, padL - 6, y + 3);
    }
    // x ticks
    ctx.textAlign = "center";
    for (const lam of [800, 1000, 1200, 1400, 1600]) {
      const x = xAt(lam);
      ctx.fillText(`${lam}`, x, padT + plotH + 14);
      ctx.strokeStyle = "rgba(180, 196, 216, 0.20)";
      ctx.beginPath();
      ctx.moveTo(x, padT + plotH);
      ctx.lineTo(x, padT + plotH + 4);
      ctx.stroke();
    }

    // Axis titles
    ctx.fillStyle = "rgba(230, 236, 244, 0.75)";
    ctx.font = "11px ui-monospace, monospace";
    ctx.textAlign = "center";
    ctx.fillText("wavelength (nm)", padL + plotW / 2, padT + plotH + 32);
    ctx.save();
    ctx.translate(16, padT + plotH / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.textAlign = "center";
    ctx.fillText("attenuation (dB/km)", 0, 0);
    ctx.restore();

    // Rayleigh tail — faint dashed curve alone
    ctx.strokeStyle = "rgba(255, 120, 80, 0.45)";
    ctx.setLineDash([4, 3]);
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (let lam = LAMBDA_MIN_NM; lam <= LAMBDA_MAX_NM; lam += 5) {
      const a = alphaRayleigh(lam);
      const x = xAt(lam);
      const y = yAt(a);
      if (lam === LAMBDA_MIN_NM) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();
    ctx.setLineDash([]);

    // IR tail — faint dashed
    ctx.strokeStyle = "rgba(255, 180, 80, 0.45)";
    ctx.setLineDash([4, 3]);
    ctx.beginPath();
    for (let lam = 1100; lam <= LAMBDA_MAX_NM; lam += 5) {
      const a = alphaIR(lam);
      const x = xAt(lam);
      const y = yAt(a);
      if (lam === 1100) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();
    ctx.setLineDash([]);

    // Total attenuation — bold cyan curve
    ctx.strokeStyle = "rgba(111, 184, 198, 0.95)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    for (let lam = LAMBDA_MIN_NM; lam <= LAMBDA_MAX_NM; lam += 2) {
      const a = totalAttenuation(lam);
      const x = xAt(lam);
      const y = yAt(a);
      if (lam === LAMBDA_MIN_NM) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();

    // Window markers + dots at their floors
    for (const w of WINDOWS) {
      const x = xAt(w.centre);
      const y = yAt(w.floor);
      // marker dot
      ctx.fillStyle = `${w.color} 1)`;
      ctx.beginPath();
      ctx.arc(x, y, 4, 0, 2 * Math.PI);
      ctx.fill();
      // label above dot
      ctx.fillStyle = `${w.color} 1)`;
      ctx.font = "11px ui-monospace, monospace";
      ctx.textAlign = "center";
      ctx.fillText(w.label, x, padT - 12);
      ctx.fillStyle = "rgba(230, 236, 244, 0.75)";
      ctx.font = "10px ui-monospace, monospace";
      ctx.fillText(`${w.floor.toFixed(2)} dB/km`, x, y - 10);
    }

    // Legend
    ctx.font = "10px ui-monospace, monospace";
    ctx.textAlign = "left";
    ctx.fillStyle = "rgba(255, 120, 80, 0.85)";
    ctx.fillText("• Rayleigh 1/λ⁴ scattering", padL + 8, padT + 14);
    ctx.fillStyle = "rgba(255, 180, 80, 0.85)";
    ctx.fillText("• IR vibrational absorption", padL + 8, padT + 28);
    ctx.fillStyle = "rgba(111, 184, 198, 0.95)";
    ctx.fillText("— total attenuation α(λ)", padL + 8, padT + 42);
  }, []);

  return (
    <div className="w-full pb-4" style={{ maxWidth: WIDTH }}>
      <div className="mx-auto" style={{ width: WIDTH, height: HEIGHT }}>
        <canvas ref={canvasRef} style={{ width: WIDTH, height: HEIGHT }} />
      </div>
      <p className="px-2 pt-2 text-xs text-[var(--color-fg-3)]">
        The three standard telecom windows sit at local minima of the silica
        attenuation curve. 1550 nm is the global minimum at ~0.17 dB/km —
        halve it every 5 km along an undersea cable. Short-λ Rayleigh and
        long-λ IR absorption sculpt the bowl between them; the residual peak
        near 1385 nm is the vestigial OH band that early fiber batches could
        not chase out.
      </p>
    </div>
  );
}
