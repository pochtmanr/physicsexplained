"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useThemeColors } from "@/lib/hooks/use-theme-colors";
import {
  huygensSum,
  diffractionGratingPrincipalMaxima,
  gratingPrincipalMaxHalfWidth,
} from "@/lib/physics/electromagnetism/diffraction";

const RATIO = 0.52;
const MAX_HEIGHT = 460;

const AMBER = "rgba(255, 180, 80,";
const CYAN = "rgba(120, 220, 240,";
const LILAC = "rgba(200, 160, 255,";
const MAGENTA = "rgba(255, 100, 200,";

/**
 * FIG.49c — diffraction grating. N equally-spaced slits of separation d.
 *
 * Slide N from 2 → 50 and watch each principal maximum sharpen: its
 * angular half-width scales as 1/N. Two slits give broad double-slit
 * fringes; 50 slits give razor-thin spectral lines. That's the whole
 * point of a grating spectrometer — more lines, better resolving power.
 *
 * Principal maxima sit at sin θ = m λ/d, independent of N. The scene
 * overlays amber marks at the predicted positions so readers can verify
 * that the numerical Huygens-sum peaks land on the formula.
 */
export function DiffractionGratingScene() {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const colors = useThemeColors();

  const [size, setSize] = useState({ width: 720, height: 400 });
  const [N, setN] = useState(5);
  const [slitSepMm, setSlitSepMm] = useState(0.02); // d — 50 lines/mm at 0.02, 500 lines/mm at 0.002
  const [wavelengthNm, setWavelengthNm] = useState(550);
  const [screenDistMm, setScreenDistMm] = useState(500);

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

  const BINS = 1536;
  const SCREEN_HALF_WIDTH_MM = 80;
  const intensity = useMemo(() => {
    const lambdaMm = wavelengthNm * 1e-6;
    // Build N slit positions centred on the optical axis.
    const slitPositions: number[] = [];
    const mid = (N - 1) / 2;
    for (let i = 0; i < N; i += 1) slitPositions.push((i - mid) * slitSepMm);
    return huygensSum({
      slitPositions,
      slitWidth: Math.max(0.002, slitSepMm * 0.1),
      wavelengthMm: lambdaMm,
      distanceToScreen: screenDistMm,
      screenHalfWidth: SCREEN_HALF_WIDTH_MM,
      bins: BINS,
    });
  }, [N, slitSepMm, wavelengthNm, screenDistMm]);

  // Analytical principal-maximum positions (metric units throughout: m, m, m)
  const principalMaxima = useMemo(
    () => diffractionGratingPrincipalMaxima(N, wavelengthNm * 1e-9, slitSepMm * 1e-3),
    [N, wavelengthNm, slitSepMm],
  );
  const halfWidthRad = gratingPrincipalMaxHalfWidth(
    N,
    wavelengthNm * 1e-9,
    slitSepMm * 1e-3,
  );

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

    drawGrating(ctx, colors, 0, 0, apparatusW, height, { N, slitSepMm });
    drawIntensityPlot(ctx, colors, plotX, 0, plotW, height, {
      intensity,
      screenHalfWidthMm: SCREEN_HALF_WIDTH_MM,
      principalMaxima,
      screenDistMm,
    });
  }, [size, intensity, principalMaxima, colors, N, slitSepMm, screenDistMm]);

  return (
    <div ref={containerRef} className="w-full pb-4">
      <canvas
        ref={canvasRef}
        style={{ width: size.width, height: size.height }}
        className="block"
      />
      <div className="mt-3 grid grid-cols-[auto_1fr_auto] items-center gap-x-3 gap-y-2 px-2 text-sm">
        <label className="text-[var(--color-fg-3)]">Slit count N</label>
        <input
          type="range"
          min={2}
          max={50}
          step={1}
          value={N}
          onChange={(e) => setN(parseInt(e.target.value, 10))}
          className="accent-[rgb(255,100,200)]"
        />
        <span className="w-20 text-right font-mono text-[var(--color-fg-1)]">{N}</span>

        <label className="text-[var(--color-fg-3)]">Slit spacing d</label>
        <input
          type="range"
          min={0.005}
          max={0.05}
          step={0.001}
          value={slitSepMm}
          onChange={(e) => setSlitSepMm(parseFloat(e.target.value))}
          className="accent-[rgb(120,220,240)]"
        />
        <span className="w-20 text-right font-mono text-[var(--color-fg-1)]">
          {(slitSepMm * 1000).toFixed(1)} μm
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
        <span className="w-20 text-right font-mono text-[var(--color-fg-1)]">
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
        <span className="w-20 text-right font-mono text-[var(--color-fg-1)]">
          {(screenDistMm / 1000).toFixed(2)} m
        </span>
      </div>
      <div className="mt-3 flex flex-wrap gap-4 px-2 font-mono text-[11px] text-[var(--color-fg-3)]">
        <span>
          orders visible:{" "}
          <span style={{ color: "rgb(255,180,80)" }}>
            {principalMaxima.map((m) => m.order).join(", ")}
          </span>
        </span>
        <span>
          principal-max half-width Δθ ≈ λ/(Nd) ={" "}
          <span style={{ color: "rgb(255,100,200)" }}>
            {(halfWidthRad * 1e3).toFixed(3)} mrad
          </span>
        </span>
      </div>
    </div>
  );
}

function drawGrating(
  ctx: CanvasRenderingContext2D,
  colors: { fg0: string; fg1: string; fg2: string; fg3: string },
  x: number,
  y: number,
  w: number,
  h: number,
  p: { N: number; slitSepMm: number },
) {
  ctx.fillStyle = `${CYAN} 0.04)`;
  ctx.fillRect(x, y, w, h);

  const cy = y + h / 2;
  const sourceX = x + w * 0.12;
  const gratingX = x + w * 0.82;

  // Source
  ctx.fillStyle = `${AMBER} 0.8)`;
  ctx.fillRect(sourceX - 24, cy - 8, 24, 16);
  ctx.font = "9.5px monospace";
  ctx.fillStyle = colors.fg1;
  ctx.textAlign = "center";
  ctx.fillText("source", sourceX - 12, cy - 12);

  // Plane wavefront arrows
  ctx.strokeStyle = `${AMBER} 0.28)`;
  ctx.lineWidth = 1;
  for (let i = 0; i < 5; i += 1) {
    const wx = sourceX + 14 + i * 10;
    ctx.beginPath();
    ctx.moveTo(wx, cy - 32);
    ctx.lineTo(wx, cy + 32);
    ctx.stroke();
  }

  // Grating bar — N slits
  const gratingSpan = Math.min(h - 28, 160);
  const topY = cy - gratingSpan / 2;
  const botY = cy + gratingSpan / 2;
  // Visual slit spacing — clip visible slit count to what fits
  const visibleN = Math.min(p.N, 40);
  const slitSpacingPx = Math.max(4, gratingSpan / (visibleN + 1));

  // Grating backing
  ctx.fillStyle = colors.fg3;
  ctx.fillRect(gratingX - 3, topY, 6, gratingSpan);

  // Each slit: thin cyan gap
  ctx.fillStyle = `${CYAN} 0.95)`;
  for (let i = 0; i < visibleN; i += 1) {
    const sy = topY + (i + 1) * slitSpacingPx - slitSpacingPx / 2;
    if (sy >= topY && sy <= botY) {
      ctx.fillRect(gratingX - 3, sy - 1, 6, 2);
    }
  }

  // Label
  ctx.fillStyle = colors.fg2;
  ctx.textAlign = "center";
  ctx.fillText(
    `N = ${p.N} slits`,
    gratingX,
    topY - 8,
  );
  ctx.fillText(`d = ${(p.slitSepMm * 1000).toFixed(1)} μm`, gratingX, botY + 16);
  if (p.N > 40) {
    ctx.fillStyle = colors.fg2;
    ctx.fillText(`(40 shown)`, gratingX, botY + 28);
  }

  // Emission fan
  ctx.strokeStyle = `${MAGENTA} 0.18)`;
  for (let i = -3; i <= 3; i += 1) {
    ctx.beginPath();
    ctx.moveTo(gratingX + 3, cy);
    ctx.lineTo(x + w + 60, cy + i * 20);
    ctx.stroke();
  }
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
    principalMaxima: { order: number; angleRad: number }[];
    screenDistMm: number;
  },
) {
  const padT = 26;
  const padB = 30;
  const padL = 44;
  const padR = 18;
  const plotX = x + padL;
  const plotY = y + padT;
  const plotW = w - padL - padR;
  const plotH = h - padT - padB;

  ctx.strokeStyle = colors.fg3;
  ctx.lineWidth = 1;
  ctx.strokeRect(plotX, plotY, plotW, plotH);

  ctx.fillStyle = colors.fg2;
  ctx.font = "10px monospace";
  ctx.textAlign = "left";
  ctx.fillText("I(y)", plotX + 6, plotY + 12);
  ctx.textAlign = "center";
  ctx.fillText("y on screen (mm)", plotX + plotW / 2, y + h - 10);

  const toPx = (yMm: number, I: number) => ({
    x: plotX + plotW * ((yMm + p.screenHalfWidthMm) / (2 * p.screenHalfWidthMm)),
    y: plotY + plotH * (1 - I),
  });

  // Grid lines — every 20 mm
  ctx.fillStyle = colors.fg2;
  ctx.textAlign = "center";
  ctx.font = "9px monospace";
  for (let mm = -60; mm <= 60; mm += 20) {
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

  // Analytical principal-maximum markers — amber verticals at sin θ_m ≈ m λ/d
  for (const m of p.principalMaxima) {
    const yMm = Math.tan(m.angleRad) * p.screenDistMm; // small-angle-ish
    if (Math.abs(yMm) > p.screenHalfWidthMm) continue;
    const px = toPx(yMm, 0).x;
    ctx.strokeStyle = `${AMBER} 0.45)`;
    ctx.setLineDash([1, 4]);
    ctx.beginPath();
    ctx.moveTo(px, plotY);
    ctx.lineTo(px, plotY + plotH);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = `${AMBER} 0.9)`;
    ctx.textAlign = "center";
    ctx.font = "9px monospace";
    ctx.fillText(`m=${m.order}`, px, plotY + plotH + 24);
  }

  // The curve — fill + stroke
  ctx.fillStyle = `${LILAC} 0.22)`;
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

  ctx.strokeStyle = `${LILAC} 0.95)`;
  ctx.lineWidth = 1.6;
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
