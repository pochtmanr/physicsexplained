"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useThemeColors } from "@/lib/hooks/use-theme-colors";
import {
  huygensSum,
  singleSlitFirstMinAngle,
  singleSlitCentralHalfWidth,
} from "@/lib/physics/electromagnetism/diffraction";

const RATIO = 0.52;
const MAX_HEIGHT = 480;

const AMBER = "rgba(255, 180, 80,";
const CYAN = "rgba(120, 220, 240,";
const LILAC = "rgba(200, 160, 255,";

/**
 * FIG.49b — single-slit diffraction.
 *
 * Widen the slit `a` and watch the central lobe shrink; narrow it and the
 * lobe fans out until, in the limit a → λ, the whole half-plane is
 * illuminated. Sinc² envelope drawn from the Huygens-sum of wavelets
 * emitted across the aperture width.
 *
 * The predicted half-width λL/a of the central maximum is shown as a
 * translucent cyan band — when the slit gets narrow enough, the curve
 * spills past it (because arcsin ≠ identity at larger angles).
 */
export function SingleSlitScene() {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const colors = useThemeColors();

  const [size, setSize] = useState({ width: 720, height: 400 });
  const [slitWidthMm, setSlitWidthMm] = useState(0.05); // a
  const [wavelengthNm, setWavelengthNm] = useState(550);
  const [screenDistMm, setScreenDistMm] = useState(500); // L

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const w = entry.contentRect.width;
        if (w > 0) setSize({ width: w, height: Math.min(w * RATIO, MAX_HEIGHT) });
      }
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const BINS = 1024;
  const SCREEN_HALF_WIDTH_MM = 25;
  const intensity = useMemo(() => {
    const lambdaMm = wavelengthNm * 1e-6;
    return huygensSum({
      slitPositions: [0], // single slit at the optical axis
      slitWidth: slitWidthMm,
      wavelengthMm: lambdaMm,
      distanceToScreen: screenDistMm,
      screenHalfWidth: SCREEN_HALF_WIDTH_MM,
      bins: BINS,
    });
  }, [slitWidthMm, wavelengthNm, screenDistMm]);

  useEffect(() => {
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

    const apparatusW = width * 0.3;
    const gapW = width * 0.02;
    const plotX = apparatusW + gapW;
    const plotW = width - plotX;

    drawApparatus(ctx, colors, 0, 0, apparatusW, height, {
      slitWidthMm,
    });
    drawIntensityPlot(ctx, colors, plotX, 0, plotW, height, {
      intensity,
      screenHalfWidthMm: SCREEN_HALF_WIDTH_MM,
      slitWidthMm,
      wavelengthNm,
      screenDistMm,
    });
  }, [size, intensity, colors, slitWidthMm, wavelengthNm, screenDistMm]);

  const centralHalfWidth = singleSlitCentralHalfWidth(
    wavelengthNm * 1e-6,
    slitWidthMm,
    screenDistMm,
  );
  const firstMinAngleRad = singleSlitFirstMinAngle(wavelengthNm * 1e-6, slitWidthMm);
  const firstMinDeg = Number.isFinite(firstMinAngleRad)
    ? (firstMinAngleRad * 180) / Math.PI
    : Number.NaN;

  return (
    <div ref={containerRef} className="w-full pb-4">
      <canvas
        ref={canvasRef}
        style={{ width: size.width, height: size.height }}
        className="block"
      />
      <div className="mt-3 grid grid-cols-[auto_1fr_auto] items-center gap-x-3 gap-y-2 px-2 text-sm">
        <label className="text-[var(--color-fg-3)]">Slit width a</label>
        <input
          type="range"
          min={0.005}
          max={0.3}
          step={0.001}
          value={slitWidthMm}
          onChange={(e) => setSlitWidthMm(parseFloat(e.target.value))}
          className="accent-[rgb(120,220,240)]"
        />
        <span className="w-24 text-right font-mono text-[var(--color-fg-1)]">
          {(slitWidthMm * 1000).toFixed(1)} μm
        </span>

        <label className="text-[var(--color-fg-3)]">Wavelength λ</label>
        <input
          type="range"
          min={400}
          max={700}
          step={1}
          value={wavelengthNm}
          onChange={(e) => setWavelengthNm(parseFloat(e.target.value))}
          className="accent-[rgb(255,180,80)]"
        />
        <span className="w-24 text-right font-mono text-[var(--color-fg-1)]">
          {wavelengthNm.toFixed(0)} nm
        </span>

        <label className="text-[var(--color-fg-3)]">Screen distance L</label>
        <input
          type="range"
          min={100}
          max={1200}
          step={10}
          value={screenDistMm}
          onChange={(e) => setScreenDistMm(parseFloat(e.target.value))}
          className="accent-[rgb(200,160,255)]"
        />
        <span className="w-24 text-right font-mono text-[var(--color-fg-1)]">
          {(screenDistMm / 1000).toFixed(2)} m
        </span>
      </div>
      <div className="mt-3 flex flex-wrap gap-4 px-2 font-mono text-[11px] text-[var(--color-fg-3)]">
        <span>
          central half-width λL/a ={" "}
          <span style={{ color: "rgb(120,220,240)" }}>
            {centralHalfWidth.toFixed(2)} mm
          </span>
        </span>
        <span>
          θ₁ = arcsin(λ/a) ={" "}
          <span style={{ color: "rgb(200,160,255)" }}>
            {Number.isFinite(firstMinDeg) ? `${firstMinDeg.toFixed(2)}°` : "no real minimum"}
          </span>
        </span>
      </div>
    </div>
  );
}

function drawApparatus(
  ctx: CanvasRenderingContext2D,
  colors: { fg0: string; fg1: string; fg2: string; fg3: string },
  x: number,
  y: number,
  w: number,
  h: number,
  p: { slitWidthMm: number },
) {
  ctx.fillStyle = `${CYAN} 0.04)`;
  ctx.fillRect(x, y, w, h);

  const cy = y + h / 2;
  const sourceX = x + w * 0.15;
  const slitX = x + w * 0.75;

  // Slit visual width scales 0.005..0.3 mm → pixel 2..30
  const slitPx = 2 + 28 * (p.slitWidthMm - 0.005) / (0.3 - 0.005);

  // Source
  ctx.fillStyle = `${AMBER} 0.8)`;
  ctx.fillRect(sourceX - 24, cy - 8, 24, 16);
  ctx.font = "9.5px monospace";
  ctx.fillStyle = colors.fg1;
  ctx.textAlign = "center";
  ctx.fillText("source", sourceX - 12, cy - 12);

  // Illumination fan
  ctx.strokeStyle = `${AMBER} 0.18)`;
  ctx.lineWidth = 1;
  for (let i = -4; i <= 4; i += 1) {
    ctx.beginPath();
    ctx.moveTo(sourceX + 2, cy);
    ctx.lineTo(slitX, cy + i * 6);
    ctx.stroke();
  }

  // The wall with single slit
  ctx.fillStyle = colors.fg3;
  ctx.fillRect(slitX - 3, y + 10, 6, cy - slitPx / 2 - y - 10);
  ctx.fillRect(slitX - 3, cy + slitPx / 2, 6, y + h - 10 - (cy + slitPx / 2));

  // Dimension arrow for a
  ctx.strokeStyle = `${CYAN} 0.75)`;
  ctx.beginPath();
  ctx.moveTo(slitX + 12, cy - slitPx / 2);
  ctx.lineTo(slitX + 12, cy + slitPx / 2);
  ctx.stroke();
  ctx.fillStyle = `${CYAN} 0.95)`;
  ctx.textAlign = "left";
  ctx.fillText(
    `a = ${p.slitWidthMm < 0.1 ? `${(p.slitWidthMm * 1000).toFixed(1)} μm` : `${p.slitWidthMm.toFixed(2)} mm`}`,
    slitX + 16,
    cy + 3,
  );

  // Fan of Huygens wavelets past the slit
  ctx.strokeStyle = `${LILAC} 0.22)`;
  for (let i = -8; i <= 8; i += 1) {
    const ang = (i / 8) * 0.85;
    ctx.beginPath();
    ctx.moveTo(slitX + 3, cy);
    ctx.lineTo(x + w + 200, cy + 200 * Math.tan(ang));
    ctx.stroke();
  }

  ctx.fillStyle = colors.fg2;
  ctx.textAlign = "center";
  ctx.fillText("Huygens wavelets from aperture", x + w / 2, y + h - 6);
}

function drawIntensityPlot(
  ctx: CanvasRenderingContext2D,
  colors: { fg0: string; fg1: string; fg2: string; fg3: string },
  x: number,
  y: number,
  w: number,
  h: number,
  p: {
    intensity: number[];
    screenHalfWidthMm: number;
    slitWidthMm: number;
    wavelengthNm: number;
    screenDistMm: number;
  },
) {
  const padT = 28;
  const padB = 30;
  const padL = 44;
  const padR = 18;
  const plotX = x + padL;
  const plotY = y + padT;
  const plotW = w - padL - padR;
  const plotH = h - padT - padB;

  // Frame + gridlines
  ctx.strokeStyle = colors.fg3;
  ctx.lineWidth = 1;
  ctx.strokeRect(plotX, plotY, plotW, plotH);

  ctx.fillStyle = colors.fg2;
  ctx.font = "10px monospace";
  ctx.textAlign = "left";
  ctx.fillText("I(y) — normalised", plotX + 6, plotY + 12);
  ctx.textAlign = "center";
  ctx.fillText("y on screen (mm)", plotX + plotW / 2, y + h - 10);

  // Predicted central-max half-width band
  const halfW = (p.wavelengthNm * 1e-6 * p.screenDistMm) / p.slitWidthMm;
  const toPx = (yMm: number, I: number) => ({
    x: plotX + plotW * ((yMm + p.screenHalfWidthMm) / (2 * p.screenHalfWidthMm)),
    y: plotY + plotH * (1 - I),
  });
  if (halfW < p.screenHalfWidthMm) {
    const pL = toPx(-halfW, 0).x;
    const pR = toPx(halfW, 0).x;
    ctx.fillStyle = `${CYAN} 0.08)`;
    ctx.fillRect(pL, plotY, pR - pL, plotH);
    ctx.strokeStyle = `${CYAN} 0.5)`;
    ctx.setLineDash([2, 4]);
    ctx.beginPath();
    ctx.moveTo(pL, plotY);
    ctx.lineTo(pL, plotY + plotH);
    ctx.moveTo(pR, plotY);
    ctx.lineTo(pR, plotY + plotH);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = `${CYAN} 0.95)`;
    ctx.textAlign = "center";
    ctx.fillText("predicted central lobe (λL/a)", (pL + pR) / 2, plotY + plotH + 18);
  }

  // Ticks
  ctx.fillStyle = colors.fg2;
  ctx.textAlign = "center";
  ctx.font = "9px monospace";
  for (let mm = -20; mm <= 20; mm += 10) {
    const px = toPx(mm, 0).x;
    ctx.strokeStyle = colors.fg3;
    ctx.setLineDash([1, 3]);
    ctx.beginPath();
    ctx.moveTo(px, plotY);
    ctx.lineTo(px, plotY + plotH);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillText(`${mm}`, px, plotY + plotH + 12);
  }
  ctx.textAlign = "right";
  for (let Iv = 0; Iv <= 1.001; Iv += 0.25) {
    const py = plotY + plotH * (1 - Iv);
    ctx.fillText(Iv.toFixed(2), plotX - 4, py + 3);
  }

  // Fill under the curve
  ctx.fillStyle = `${LILAC} 0.28)`;
  ctx.beginPath();
  ctx.moveTo(plotX, plotY + plotH);
  for (let i = 0; i < p.intensity.length; i += 1) {
    const yMm =
      -p.screenHalfWidthMm + (i / (p.intensity.length - 1)) * 2 * p.screenHalfWidthMm;
    const pt = toPx(yMm, p.intensity[i]);
    ctx.lineTo(pt.x, pt.y);
  }
  ctx.lineTo(plotX + plotW, plotY + plotH);
  ctx.closePath();
  ctx.fill();

  // The curve
  ctx.strokeStyle = `${LILAC} 0.95)`;
  ctx.lineWidth = 1.8;
  ctx.beginPath();
  for (let i = 0; i < p.intensity.length; i += 1) {
    const yMm =
      -p.screenHalfWidthMm + (i / (p.intensity.length - 1)) * 2 * p.screenHalfWidthMm;
    const pt = toPx(yMm, p.intensity[i]);
    if (i === 0) ctx.moveTo(pt.x, pt.y);
    else ctx.lineTo(pt.x, pt.y);
  }
  ctx.stroke();
}
