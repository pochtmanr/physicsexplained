"use client";

import { useEffect, useRef, useState } from "react";
import { useAnimationFrame } from "@/lib/animation/use-animation-frame";
import { useThemeColors } from "@/lib/hooks/use-theme-colors";
import {
  SPECTRUM_BANDS,
  bandOf,
  frequencyFromWavelength,
  photonEnergyInEV,
} from "@/lib/physics/electromagnetism/em-spectrum";

const RATIO = 0.5;
const MAX_HEIGHT = 360;

// Decade span drawn on the horizontal log axis — from 10⁵ m (huge radio
// wavelengths) on the left to 10⁻¹⁵ m (gamma rays) on the right. That's
// twenty orders of magnitude in one horizontal line.
const LOG_LAMBDA_MIN = -15; // log10 of shortest wavelength shown, in metres
const LOG_LAMBDA_MAX = 5;   // log10 of longest wavelength shown, in metres

/**
 * FIG.41a — the spectrum as a log-axis ribbon.
 *
 * Seven coloured panes stacked end to end across log-λ. Real-world sources
 * (FM radio at 3 m, WiFi at 12.5 cm, the CMB peak near 1 mm, visible at
 * 380–780 nm, etc.) are tacked onto the axis with thin tick marks. Hover
 * anywhere on the bar and the HUD renders λ, f, photon energy in eV, and
 * the band name for that exact point.
 */
export function SpectrumBandsScene() {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const colors = useThemeColors();
  const [size, setSize] = useState({ width: 720, height: 360 });
  const [hoverLogLambda, setHoverLogLambda] = useState<number | null>(null);
  const hoverRef = useRef<number | null>(null);

  useEffect(() => {
    hoverRef.current = hoverLogLambda;
  }, [hoverLogLambda]);

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

  // Real-world-source ticks. `lambdaM` is the wavelength in metres; `label`
  // is the short-form annotation rendered above the ribbon.
  const MARKERS: ReadonlyArray<{ lambdaM: number; label: string }> = [
    { lambdaM: 3, label: "FM 100 MHz" },
    { lambdaM: 0.125, label: "WiFi 2.4 GHz" },
    { lambdaM: 1.07e-2, label: "5G 28 GHz" },
    { lambdaM: 1e-3, label: "CMB peak" },
    { lambdaM: 1e-5, label: "body heat (IR)" },
    { lambdaM: 5.5e-7, label: "visible (550 nm)" },
    { lambdaM: 1e-7, label: "UV-C sterilising" },
    { lambdaM: 1e-10, label: "medical X-ray" },
    { lambdaM: 1e-12, label: "nuclear γ" },
  ];

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
        ctx.scale(dpr, dpr);
      }
      ctx.clearRect(0, 0, width, height);

      const marginX = 18;
      const plotW = width - 2 * marginX;
      // Convert a log10(λ) value into a pixel x-coordinate. Longer λ sits
      // on the left, shorter on the right, matching how the spectrum is
      // normally drawn (low frequency → high frequency, left → right).
      const toPx = (logLambda: number) => {
        const frac = (LOG_LAMBDA_MAX - logLambda) /
          (LOG_LAMBDA_MAX - LOG_LAMBDA_MIN);
        return marginX + frac * plotW;
      };

      const ribbonTop = height * 0.38;
      const ribbonH = Math.max(40, height * 0.22);

      // ─────── Band panes ───────
      for (const band of SPECTRUM_BANDS) {
        const x0 = toPx(Math.log10(band.wavelengthMaxM));
        const x1 = toPx(Math.log10(band.wavelengthMinM));
        ctx.fillStyle = band.color + "55"; // alpha-blended band fill
        ctx.fillRect(x0, ribbonTop, x1 - x0, ribbonH);
        ctx.strokeStyle = band.color;
        ctx.lineWidth = 1;
        ctx.strokeRect(x0, ribbonTop, x1 - x0, ribbonH);

        // Band name, centred on each pane, clipped if too narrow.
        const cx = (x0 + x1) / 2;
        ctx.fillStyle = band.color;
        ctx.font = "bold 11px monospace";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        if (x1 - x0 > 48) {
          ctx.fillText(band.name.toUpperCase(), cx, ribbonTop + ribbonH / 2);
        }
      }

      // ─────── Log axis ticks: 10⁻¹⁵ … 10⁵ m ───────
      ctx.strokeStyle = colors.fg3;
      ctx.fillStyle = colors.fg2;
      ctx.lineWidth = 1;
      ctx.font = "9px monospace";
      ctx.textBaseline = "top";
      for (let p = LOG_LAMBDA_MIN; p <= LOG_LAMBDA_MAX; p++) {
        const x = toPx(p);
        ctx.beginPath();
        ctx.moveTo(x, ribbonTop + ribbonH);
        ctx.lineTo(x, ribbonTop + ribbonH + 4);
        ctx.stroke();
        // Label every 5 decades so they don't collide.
        if (p % 5 === 0) {
          ctx.textAlign = "center";
          ctx.fillText(`10^${p} m`, x, ribbonTop + ribbonH + 6);
        }
      }

      // ─────── Real-world-source markers above ribbon ───────
      ctx.textBaseline = "alphabetic";
      ctx.font = "9px monospace";
      for (const m of MARKERS) {
        const x = toPx(Math.log10(m.lambdaM));
        ctx.strokeStyle = colors.fg1;
        ctx.lineWidth = 0.8;
        ctx.beginPath();
        ctx.moveTo(x, ribbonTop);
        ctx.lineTo(x, ribbonTop - 8);
        ctx.stroke();
        ctx.fillStyle = colors.fg2;
        ctx.textAlign = "center";
        ctx.fillText(m.label, x, ribbonTop - 12);
      }

      // ─────── Heading ───────
      ctx.fillStyle = colors.fg1;
      ctx.font = "11px monospace";
      ctx.textAlign = "left";
      ctx.fillText("log λ:", marginX, 14);
      ctx.textAlign = "right";
      ctx.fillText("one wave equation · every band", width - marginX, 14);

      // ─────── Hover readout ───────
      const hoverLog = hoverRef.current;
      if (hoverLog !== null) {
        const lambda = Math.pow(10, hoverLog);
        const f = frequencyFromWavelength(lambda);
        const eV = photonEnergyInEV(lambda);
        const band = bandOf(lambda) ?? "—";
        const x = toPx(hoverLog);
        ctx.strokeStyle = colors.fg0;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(x, ribbonTop - 10);
        ctx.lineTo(x, ribbonTop + ribbonH + 6);
        ctx.stroke();

        // Floating HUD near bottom.
        const hudY = ribbonTop + ribbonH + 34;
        ctx.fillStyle = colors.fg0;
        ctx.font = "10px monospace";
        ctx.textAlign = "left";
        ctx.fillText(
          `band: ${band.toUpperCase()}   λ = ${formatLength(lambda)}   f = ${formatHz(f)}   E_photon = ${formatEV(eV)}`,
          marginX,
          hudY,
        );
      } else {
        ctx.fillStyle = colors.fg2;
        ctx.font = "10px monospace";
        ctx.textAlign = "left";
        ctx.fillText(
          "hover anywhere on the ribbon to read λ, f, photon-energy",
          marginX,
          ribbonTop + ribbonH + 34,
        );
      }
    },
  });

  const handleMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const px = e.clientX - rect.left;
    const marginX = 18;
    const plotW = size.width - 2 * marginX;
    if (px < marginX || px > marginX + plotW) {
      setHoverLogLambda(null);
      return;
    }
    const frac = (px - marginX) / plotW;
    const logLambda = LOG_LAMBDA_MAX - frac * (LOG_LAMBDA_MAX - LOG_LAMBDA_MIN);
    setHoverLogLambda(logLambda);
  };

  return (
    <div ref={containerRef} className="w-full pb-4">
      <canvas
        ref={canvasRef}
        style={{ width: size.width, height: size.height }}
        className="block"
        onMouseMove={handleMove}
        onMouseLeave={() => setHoverLogLambda(null)}
      />
    </div>
  );
}

function formatLength(m: number): string {
  if (m >= 1) return `${m.toPrecision(3)} m`;
  if (m >= 1e-2) return `${(m * 1e2).toPrecision(3)} cm`;
  if (m >= 1e-3) return `${(m * 1e3).toPrecision(3)} mm`;
  if (m >= 1e-6) return `${(m * 1e6).toPrecision(3)} µm`;
  if (m >= 1e-9) return `${(m * 1e9).toPrecision(3)} nm`;
  if (m >= 1e-12) return `${(m * 1e12).toPrecision(3)} pm`;
  return `${m.toExponential(2)} m`;
}

function formatHz(f: number): string {
  if (f >= 1e18) return `${(f / 1e18).toPrecision(3)} EHz`;
  if (f >= 1e15) return `${(f / 1e15).toPrecision(3)} PHz`;
  if (f >= 1e12) return `${(f / 1e12).toPrecision(3)} THz`;
  if (f >= 1e9) return `${(f / 1e9).toPrecision(3)} GHz`;
  if (f >= 1e6) return `${(f / 1e6).toPrecision(3)} MHz`;
  if (f >= 1e3) return `${(f / 1e3).toPrecision(3)} kHz`;
  return `${f.toPrecision(3)} Hz`;
}

function formatEV(eV: number): string {
  if (eV >= 1e9) return `${(eV / 1e9).toPrecision(3)} GeV`;
  if (eV >= 1e6) return `${(eV / 1e6).toPrecision(3)} MeV`;
  if (eV >= 1e3) return `${(eV / 1e3).toPrecision(3)} keV`;
  if (eV >= 1) return `${eV.toPrecision(3)} eV`;
  if (eV >= 1e-3) return `${(eV * 1e3).toPrecision(3)} meV`;
  if (eV >= 1e-6) return `${(eV * 1e6).toPrecision(3)} µeV`;
  return `${eV.toExponential(2)} eV`;
}
