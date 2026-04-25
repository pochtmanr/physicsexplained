"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useAnimationFrame } from "@/lib/animation/use-animation-frame";
import { useThemeColors } from "@/lib/hooks/use-theme-colors";
import {
  abPhaseFromFluxRatio,
  interferencePattern,
} from "@/lib/physics/electromagnetism/aharonov-bohm";

/**
 * FIG.64b — The fringe pattern, alone, sliding past its own baseline.
 *
 * Sub-scene of the §12.2 money shot. Strip away the apparatus; just plot
 * the intensity I(x) against position on the screen, with a slider on
 * Φ_B/Φ_0. A faint amber-yellow GHOST overlay shows the OFF (Φ_B = 0)
 * pattern frozen in place, so the eye instantly reads the lateral shift
 * relative to baseline.
 *
 * Auto-play toggle: optionally drives the slider in a slow loop from 0 → 2.
 *
 * Palette:
 *   pale-blue       — active fringe maxima
 *   yellow-amber    — ghost baseline (Φ_B = 0)
 *   lilac           — phase readout
 *   cyan            — Φ_B/Φ_0 slider accent
 */

const RATIO = 0.42;
const MAX_HEIGHT = 360;

const PALE_BLUE = "rgba(140, 200, 255,";
const GHOST = "rgba(255, 210, 150,";
const LILAC = "rgba(200, 160, 255,";
const CYAN = "rgba(120, 220, 255,";

const SLIT_SEP_MM = 0.4;
const WAVELENGTH_NM = 550;
const SCREEN_DIST_MM = 600;
const SCREEN_HALF_WIDTH_MM = 8;

export function FluxPhaseShiftFringesScene() {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const colors = useThemeColors();

  const [size, setSize] = useState({ width: 880, height: 360 });
  const [fluxRatio, setFluxRatio] = useState(0.0);
  const [autoplay, setAutoplay] = useState(true);

  const fluxRatioRef = useRef(fluxRatio);
  const autoplayRef = useRef(autoplay);
  useEffect(() => {
    fluxRatioRef.current = fluxRatio;
  }, [fluxRatio]);
  useEffect(() => {
    autoplayRef.current = autoplay;
  }, [autoplay]);

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

  const baseline = useMemo(
    () =>
      interferencePattern(
        SLIT_SEP_MM,
        SCREEN_DIST_MM,
        WAVELENGTH_NM * 1e-6,
        0,
      ),
    [],
  );

  useAnimationFrame({
    elementRef: containerRef,
    onFrame: (t, dt) => {
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

      // Drive the slider when autoplay is on. One full loop takes 8 s.
      if (autoplayRef.current) {
        const next = (fluxRatioRef.current + dt * (2 / 8)) % 2.0;
        fluxRatioRef.current = next;
        // Kick a state update on a rough cadence so the slider knob moves
        // without flooding React. (rAF-state pattern: setState ≈ 10 Hz.)
        if (Math.floor(t * 10) % 2 === 0) {
          setFluxRatio(next);
        }
      }

      const ratio = fluxRatioRef.current;
      const phaseShift = abPhaseFromFluxRatio(ratio, 1);

      const live = interferencePattern(
        SLIT_SEP_MM,
        SCREEN_DIST_MM,
        WAVELENGTH_NM * 1e-6,
        phaseShift,
      );

      drawPanel(ctx, colors, 0, 0, width, height, baseline, live, ratio, phaseShift);
    },
  });

  const phaseShift = abPhaseFromFluxRatio(fluxRatio, 1);

  return (
    <div ref={containerRef} className="w-full pb-4">
      <canvas
        ref={canvasRef}
        style={{ width: size.width, height: size.height }}
        className="block"
      />

      <div className="mt-2 grid grid-cols-[auto_1fr_auto] items-center gap-x-3 gap-y-1 px-2 text-sm">
        <label className="text-[var(--color-fg-3)]">Φ_B / Φ_0</label>
        <input
          type="range"
          min={0}
          max={2}
          step={0.01}
          value={fluxRatio}
          onChange={(e) => {
            setAutoplay(false);
            setFluxRatio(parseFloat(e.target.value));
          }}
          className="accent-[rgb(120,220,255)]"
        />
        <span className="w-16 text-right font-mono text-[var(--color-fg-1)]">
          {fluxRatio.toFixed(2)}
        </span>
      </div>

      <div className="mt-2 flex flex-wrap items-center gap-3 px-2 font-mono text-[11px] text-[var(--color-fg-3)]">
        <button
          type="button"
          className="border border-[var(--color-fg-4)] px-2 py-0.5 hover:border-[rgb(120,220,255)] hover:text-[var(--color-fg-1)]"
          onClick={() => setAutoplay((a) => !a)}
        >
          {autoplay ? "pause sweep" : "auto-sweep"}
        </button>
        <span>
          φ_AB ={" "}
          <span style={{ color: "rgb(200,160,255)" }}>
            {(phaseShift / Math.PI).toFixed(2)}π rad
          </span>
        </span>
        <span>
          ghost ={" "}
          <span style={{ color: "rgb(255,210,150)" }}>baseline (Φ_B = 0)</span>
        </span>
      </div>

      <div className="mt-2 px-2 text-xs text-[var(--color-fg-3)]">
        At Φ_B = Φ_0/2 the central peak coincides with a baseline trough —
        constructive interference at x = 0 has flipped to destructive. At
        Φ_B = Φ_0 the active and ghost curves coincide again. The shift is
        periodic in the flux quantum.
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
function drawPanel(
  ctx: CanvasRenderingContext2D,
  colors: { fg0: string; fg1: string; fg2: string; fg3: string },
  x: number,
  y: number,
  w: number,
  h: number,
  baseline: (yMm: number) => number,
  live: (yMm: number) => number,
  ratio: number,
  phaseShift: number,
) {
  const padL = 56;
  const padR = 16;
  const padT = 28;
  const padB = 38;
  const left = x + padL;
  const right = x + w - padR;
  const top = y + padT;
  const bot = y + h - padB;
  const plotW = right - left;
  const plotH = bot - top;

  // Frame
  ctx.strokeStyle = colors.fg3;
  ctx.lineWidth = 1;
  ctx.strokeRect(left, top, plotW, plotH);

  // Y-axis: I(x), 0..4 (since I = 4cos²)
  // X-axis: position on screen, [-SCREEN_HALF_WIDTH_MM, +SCREEN_HALF_WIDTH_MM]
  const xMmToPx = (xMm: number) =>
    left + ((xMm + SCREEN_HALF_WIDTH_MM) / (2 * SCREEN_HALF_WIDTH_MM)) * plotW;
  const intensityToPx = (I: number) => bot - (I / 4) * plotH;

  // X-axis label and centre line
  ctx.strokeStyle = `${LILAC} 0.45)`;
  ctx.lineWidth = 1;
  ctx.setLineDash([2, 3]);
  ctx.beginPath();
  ctx.moveTo(xMmToPx(0), top);
  ctx.lineTo(xMmToPx(0), bot);
  ctx.stroke();
  ctx.setLineDash([]);

  ctx.fillStyle = colors.fg2;
  ctx.font = "9.5px monospace";
  ctx.textAlign = "center";
  ctx.fillText("x (screen position)", x + w / 2, y + h - 14);
  ctx.fillText("x = 0", xMmToPx(0), bot + 12);

  // Y-axis ticks
  ctx.textAlign = "right";
  ctx.fillStyle = colors.fg2;
  ctx.font = "9px monospace";
  for (let v = 0; v <= 4; v += 1) {
    const py = intensityToPx(v);
    ctx.strokeStyle = colors.fg3;
    ctx.beginPath();
    ctx.moveTo(left - 3, py);
    ctx.lineTo(left, py);
    ctx.stroke();
    ctx.fillText(v.toFixed(0), left - 6, py + 3);
  }
  ctx.save();
  ctx.translate(x + 14, y + h / 2);
  ctx.rotate(-Math.PI / 2);
  ctx.fillStyle = colors.fg2;
  ctx.textAlign = "center";
  ctx.fillText("I(x)  /  I_0", 0, 0);
  ctx.restore();

  // Sample resolution
  const samples = 320;
  // ── Ghost baseline: filled + dashed line
  ctx.fillStyle = `${GHOST} 0.10)`;
  ctx.beginPath();
  ctx.moveTo(left, bot);
  for (let i = 0; i <= samples; i += 1) {
    const xMm = -SCREEN_HALF_WIDTH_MM + (i / samples) * 2 * SCREEN_HALF_WIDTH_MM;
    const px = xMmToPx(xMm);
    const py = intensityToPx(baseline(xMm));
    ctx.lineTo(px, py);
  }
  ctx.lineTo(right, bot);
  ctx.closePath();
  ctx.fill();

  ctx.strokeStyle = `${GHOST} 0.65)`;
  ctx.lineWidth = 1;
  ctx.setLineDash([3, 3]);
  ctx.beginPath();
  for (let i = 0; i <= samples; i += 1) {
    const xMm = -SCREEN_HALF_WIDTH_MM + (i / samples) * 2 * SCREEN_HALF_WIDTH_MM;
    const px = xMmToPx(xMm);
    const py = intensityToPx(baseline(xMm));
    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.stroke();
  ctx.setLineDash([]);

  // ── Live curve: filled + bold line
  ctx.fillStyle = `${PALE_BLUE} 0.20)`;
  ctx.beginPath();
  ctx.moveTo(left, bot);
  for (let i = 0; i <= samples; i += 1) {
    const xMm = -SCREEN_HALF_WIDTH_MM + (i / samples) * 2 * SCREEN_HALF_WIDTH_MM;
    const px = xMmToPx(xMm);
    const py = intensityToPx(live(xMm));
    ctx.lineTo(px, py);
  }
  ctx.lineTo(right, bot);
  ctx.closePath();
  ctx.fill();

  ctx.strokeStyle = `${PALE_BLUE} 0.95)`;
  ctx.lineWidth = 1.8;
  ctx.beginPath();
  for (let i = 0; i <= samples; i += 1) {
    const xMm = -SCREEN_HALF_WIDTH_MM + (i / samples) * 2 * SCREEN_HALF_WIDTH_MM;
    const px = xMmToPx(xMm);
    const py = intensityToPx(live(xMm));
    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.stroke();

  // ── Title strip
  ctx.fillStyle = colors.fg1;
  ctx.font = "bold 10px monospace";
  ctx.textAlign = "left";
  ctx.fillText("FRINGE PATTERN  vs  Φ_B / Φ_0", x + 12, y + 18);

  ctx.fillStyle = `${CYAN} 0.95)`;
  ctx.font = "10px monospace";
  ctx.textAlign = "right";
  ctx.fillText(
    `Φ_B = ${ratio.toFixed(2)} Φ_0    φ_AB = ${(phaseShift / Math.PI).toFixed(2)}π`,
    x + w - 14,
    y + 18,
  );

  // ── Annotation for the "click" moment (Φ_B = Φ_0/2 → flip)
  if (Math.abs(ratio - 0.5) < 0.04) {
    ctx.fillStyle = `${LILAC} 0.95)`;
    ctx.font = "bold 10px monospace";
    ctx.textAlign = "center";
    ctx.fillText("→  central peak ↔ central trough", x + w / 2, y + 32);
  } else if (Math.abs(ratio - 1.0) < 0.04 || ratio > 1.96) {
    ctx.fillStyle = `${LILAC} 0.95)`;
    ctx.font = "bold 10px monospace";
    ctx.textAlign = "center";
    ctx.fillText("→  pattern returns to baseline", x + w / 2, y + 32);
  }
}
