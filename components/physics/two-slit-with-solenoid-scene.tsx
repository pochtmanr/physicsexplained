"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useAnimationFrame } from "@/lib/animation/use-animation-frame";
import { useThemeColors } from "@/lib/hooks/use-theme-colors";
import {
  abPhaseFromFluxRatio,
  interferencePattern,
} from "@/lib/physics/electromagnetism/aharonov-bohm";

/**
 * FIG.64 — THE MONEY SHOT of §12.2 `aharonov-bohm-effect`.
 *
 * Aharonov-Bohm 1959 in one image. Top-down geometry:
 *
 *   electron source ──► [two slits] ──► (solenoid centred between paths) ──► [screen]
 *
 * The solenoid is drawn as a small circle (cross-section, B perpendicular to
 * the page). When ON, B is non-zero ONLY inside the circle — drawn as cyan
 * × marks (into-page convention). The two electron paths are amber traces
 * from source through each slit, threading EITHER SIDE of the solenoid and
 * meeting on the screen. The visual point: those paths run through regions
 * where B = 0 everywhere they are. Yet the fringe pattern shifts by
 *
 *   φ_AB = (q/ℏ) ∮ A·dℓ = (q/ℏ) Φ_B   (Stokes)
 *
 * which is 2π·(Φ_B/Φ_0). At Φ_B = Φ_0/2 the central peak (constructive at
 * x=0 when OFF) becomes a central trough (destructive). At Φ_B = Φ_0 the
 * pattern returns to the unshifted baseline.
 *
 * Controls:
 *   - toggle: solenoid ON / OFF
 *   - slider: Φ_B / Φ_0 in [0, 2]  (one full periodic return)
 *   - HUD readout: Φ_B/Φ_0 and the AB phase φ_AB in radians
 *
 * Palette:
 *   amber       — electron paths, faint dashed
 *   pale-blue   — interference fringe maxima
 *   cyan        — solenoid B-field, ONLY inside the circle
 *   pale-grey   — solenoid outline / shielding boundary
 *   lilac       — phase readout HUD highlight
 */

const RATIO = 0.55;
const MAX_HEIGHT = 460;

const AMBER = "rgba(255, 180, 80,";
const PALE_BLUE = "rgba(140, 200, 255,";
const CYAN = "rgba(120, 220, 255,";
const GREY = "rgba(180, 170, 200,";
const LILAC = "rgba(200, 160, 255,";

// Two-slit geometry in scene units (mm-equivalents only; visual not physical).
const SLIT_SEP_MM = 0.4;          // d
const WAVELENGTH_NM = 550;        // de Broglie λ in arbitrary units
const SCREEN_DIST_MM = 600;       // L
const SCREEN_HALF_WIDTH_MM = 8;   // visible screen extent

export function TwoSlitWithSolenoidScene() {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const colors = useThemeColors();

  const [size, setSize] = useState({ width: 880, height: 480 });
  const [solenoidOn, setSolenoidOn] = useState(true);
  const [fluxRatio, setFluxRatio] = useState(0.5); // Φ_B / Φ_0

  // Live refs so the rAF loop can read latest state without re-binding
  const solenoidOnRef = useRef(solenoidOn);
  const fluxRatioRef = useRef(fluxRatio);
  useEffect(() => {
    solenoidOnRef.current = solenoidOn;
  }, [solenoidOn]);
  useEffect(() => {
    fluxRatioRef.current = fluxRatio;
  }, [fluxRatio]);

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

  // Pre-compute the OFF (baseline) intensity sampler — never changes.
  const baselinePattern = useMemo(
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

      const on = solenoidOnRef.current;
      const ratio = on ? fluxRatioRef.current : 0;
      const phaseShift = abPhaseFromFluxRatio(ratio, 1); // q cancels out

      // Layout: left 70% is the apparatus (top-down geometry), right 30%
      // is the screen showing the fringe pattern.
      const apparatusW = width * 0.70;
      const screenW = width - apparatusW;

      drawApparatus(
        ctx,
        colors,
        0,
        0,
        apparatusW,
        height,
        on,
        ratio,
        phaseShift,
        t,
      );

      drawFringeColumn(
        ctx,
        colors,
        apparatusW,
        0,
        screenW,
        height,
        baselinePattern,
        phaseShift,
        on,
      );
    },
  });

  const phaseShift = solenoidOn ? abPhaseFromFluxRatio(fluxRatio, 1) : 0;

  return (
    <div ref={containerRef} className="w-full pb-4">
      <canvas
        ref={canvasRef}
        style={{ width: size.width, height: size.height }}
        className="block"
      />

      <div className="mt-3 flex flex-wrap items-center gap-3 px-2 font-mono text-[11px] text-[var(--color-fg-3)]">
        <div className="flex overflow-hidden border border-[var(--color-fg-4)]">
          <button
            type="button"
            className={`px-2 py-0.5 ${solenoidOn ? "bg-[var(--color-fg-4)] text-[var(--color-fg-1)]" : "hover:text-[var(--color-fg-1)]"}`}
            onClick={() => setSolenoidOn(true)}
          >
            solenoid ON
          </button>
          <button
            type="button"
            className={`px-2 py-0.5 ${!solenoidOn ? "bg-[var(--color-fg-4)] text-[var(--color-fg-1)]" : "hover:text-[var(--color-fg-1)]"}`}
            onClick={() => setSolenoidOn(false)}
          >
            solenoid OFF
          </button>
        </div>
        <span>
          Φ_B / Φ_0 ={" "}
          <span style={{ color: "rgb(120,220,255)" }}>
            {(solenoidOn ? fluxRatio : 0).toFixed(2)}
          </span>
        </span>
        <span>
          φ_AB ={" "}
          <span style={{ color: "rgb(200,160,255)" }}>
            {(phaseShift / Math.PI).toFixed(2)}π rad
          </span>
        </span>
      </div>

      <div className="mt-2 grid grid-cols-[auto_1fr_auto] items-center gap-x-3 gap-y-1 px-2 text-sm">
        <label className="text-[var(--color-fg-3)]">Φ_B / Φ_0</label>
        <input
          type="range"
          min={0}
          max={2}
          step={0.01}
          value={fluxRatio}
          onChange={(e) => setFluxRatio(parseFloat(e.target.value))}
          disabled={!solenoidOn}
          className="accent-[rgb(120,220,255)] disabled:opacity-40"
        />
        <span className="w-16 text-right font-mono text-[var(--color-fg-1)]">
          {fluxRatio.toFixed(2)}
        </span>
      </div>

      <div className="mt-2 px-2 text-xs text-[var(--color-fg-3)]">
        The electron paths are in <em>field-free</em> regions on either side
        of the solenoid. Yet the fringe pattern shifts. At Φ_B = Φ_0/2 the
        central peak flips to a central trough. At Φ_B = Φ_0 the pattern
        returns. The shift is periodic in the flux quantum Φ_0 = h/q.
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Apparatus painter — top-down view: source → slits → solenoid → screen line.
// ─────────────────────────────────────────────────────────────────────────────
function drawApparatus(
  ctx: CanvasRenderingContext2D,
  colors: { fg0: string; fg1: string; fg2: string; fg3: string },
  x: number,
  y: number,
  w: number,
  h: number,
  on: boolean,
  ratio: number,
  phaseShift: number,
  elapsedSeconds: number,
) {
  // Soft background tint
  ctx.fillStyle = `${PALE_BLUE} 0.03)`;
  ctx.fillRect(x, y, w, h);

  const cx = x + w / 2;
  const cy = y + h / 2;

  const sourceX = x + w * 0.06;
  const slitsX = x + w * 0.30;
  const solenoidX = x + w * 0.55;
  const screenX = x + w * 0.94;

  // Slit y-coordinates — separated symmetrically about the central axis
  const slitDy = h * 0.20;
  const slit1Y = cy - slitDy;
  const slit2Y = cy + slitDy;

  // ── Source: small amber rectangle with "e⁻" label
  ctx.fillStyle = `${AMBER} 0.85)`;
  ctx.fillRect(sourceX - 18, cy - 8, 18, 16);
  ctx.fillStyle = colors.fg1;
  ctx.font = "10px monospace";
  ctx.textAlign = "center";
  ctx.fillText("e⁻ source", sourceX - 9, cy - 12);

  // ── Slit wall: vertical bar with two gaps
  ctx.fillStyle = colors.fg3;
  const wallTop = y + 18;
  const wallBot = y + h - 18;
  const slitGap = 6;
  ctx.fillRect(slitsX - 2.5, wallTop, 5, slit1Y - slitGap - wallTop);
  ctx.fillRect(slitsX - 2.5, slit1Y + slitGap, 5, slit2Y - slit1Y - 2 * slitGap);
  ctx.fillRect(slitsX - 2.5, slit2Y + slitGap, 5, wallBot - (slit2Y + slitGap));

  ctx.fillStyle = colors.fg2;
  ctx.font = "9.5px monospace";
  ctx.textAlign = "left";
  ctx.fillText("slit 1", slitsX + 8, slit1Y + 3);
  ctx.fillText("slit 2", slitsX + 8, slit2Y + 3);

  // ── Source-to-slits: faint plane wavefronts (amber)
  ctx.strokeStyle = `${AMBER} 0.20)`;
  ctx.lineWidth = 1;
  for (let i = 0; i < 5; i += 1) {
    const wx = sourceX + 4 + i * ((slitsX - sourceX - 8) / 5);
    ctx.beginPath();
    ctx.moveTo(wx, cy - h * 0.12);
    ctx.lineTo(wx, cy + h * 0.12);
    ctx.stroke();
  }

  // ── Solenoid: a small grey circle at (solenoidX, cy)
  const solR = Math.min(w * 0.030, h * 0.07);
  // Outline + inside fill (only if ON)
  ctx.strokeStyle = `${GREY} 0.85)`;
  ctx.lineWidth = 1.3;
  ctx.beginPath();
  ctx.arc(solenoidX, cy, solR, 0, Math.PI * 2);
  if (on) {
    ctx.fillStyle = `${CYAN} ${(0.10 + 0.18 * Math.min(ratio, 2)).toFixed(3)})`;
    ctx.fill();
  }
  ctx.stroke();

  // Inside-the-solenoid B-field marks (× = into the page).
  // Only drawn when ON; density scales with |ratio|.
  if (on && ratio > 0.001) {
    ctx.strokeStyle = `${CYAN} 0.95)`;
    ctx.lineWidth = 1.2;
    const dotsAcross = 3;
    const step = (solR * 1.4) / dotsAcross;
    for (let i = -1; i <= 1; i += 1) {
      for (let j = -1; j <= 1; j += 1) {
        const px = solenoidX + i * step;
        const py = cy + j * step;
        const r2 = (px - solenoidX) ** 2 + (py - cy) ** 2;
        if (r2 > (solR * 0.78) ** 2) continue;
        const sz = 2.6;
        ctx.beginPath();
        ctx.moveTo(px - sz, py - sz);
        ctx.lineTo(px + sz, py + sz);
        ctx.moveTo(px + sz, py - sz);
        ctx.lineTo(px - sz, py + sz);
        ctx.stroke();
      }
    }
    // tiny "B" label to the right of the solenoid
    ctx.fillStyle = `${CYAN} 0.95)`;
    ctx.font = "9.5px monospace";
    ctx.textAlign = "left";
    ctx.fillText("B (into page)", solenoidX + solR + 6, cy - solR - 2);
  } else {
    ctx.fillStyle = `${GREY} 0.6)`;
    ctx.font = "9.5px monospace";
    ctx.textAlign = "left";
    ctx.fillText("solenoid (B = 0)", solenoidX + solR + 6, cy - solR - 2);
  }

  // ── Two electron paths: amber, faint, dashed. They pass on either side
  //    of the solenoid, threading the field-free region.
  const pathClearance = solR * 1.6; // distance the path bows around the coil
  ctx.setLineDash([4, 3]);
  ctx.lineWidth = 1.2;

  // Path 1: source → slit1 → upper side of solenoid → screen
  drawCurvedPath(
    ctx,
    [
      { x: sourceX, y: cy },
      { x: slitsX, y: slit1Y },
      { x: solenoidX, y: cy - pathClearance },
      { x: screenX - 2, y: cy - h * 0.10 + (phaseShift / (2 * Math.PI)) * h * 0.28 },
    ],
    `${AMBER} 0.55)`,
  );

  // Path 2: source → slit2 → lower side of solenoid → screen
  drawCurvedPath(
    ctx,
    [
      { x: sourceX, y: cy },
      { x: slitsX, y: slit2Y },
      { x: solenoidX, y: cy + pathClearance },
      { x: screenX - 2, y: cy - h * 0.10 + (phaseShift / (2 * Math.PI)) * h * 0.28 },
    ],
    `${AMBER} 0.55)`,
  );

  ctx.setLineDash([]);

  // ── Animated electron pulses travelling along each path (gives life)
  const pulseT = (elapsedSeconds * 0.45) % 1;
  drawElectronPulse(
    ctx,
    [
      { x: sourceX, y: cy },
      { x: slitsX, y: slit1Y },
      { x: solenoidX, y: cy - pathClearance },
      { x: screenX - 2, y: cy - h * 0.10 + (phaseShift / (2 * Math.PI)) * h * 0.28 },
    ],
    pulseT,
  );
  drawElectronPulse(
    ctx,
    [
      { x: sourceX, y: cy },
      { x: slitsX, y: slit2Y },
      { x: solenoidX, y: cy + pathClearance },
      { x: screenX - 2, y: cy - h * 0.10 + (phaseShift / (2 * Math.PI)) * h * 0.28 },
    ],
    pulseT,
  );

  // ── Field-free callouts
  ctx.fillStyle = `${AMBER} 0.85)`;
  ctx.font = "9.5px monospace";
  ctx.textAlign = "center";
  ctx.fillText("path 1 — B = 0 here", (slitsX + solenoidX) / 2, cy - pathClearance - solR - 14);
  ctx.fillText("path 2 — B = 0 here", (slitsX + solenoidX) / 2, cy + pathClearance + solR + 22);

  // ── Title strip + readouts
  ctx.fillStyle = colors.fg1;
  ctx.font = "bold 10px monospace";
  ctx.textAlign = "left";
  ctx.fillText("AHARONOV-BOHM 1959", x + 12, y + 20);

  ctx.fillStyle = colors.fg2;
  ctx.font = "9.5px monospace";
  ctx.fillText(
    on
      ? `Φ_B = ${ratio.toFixed(2)} Φ_0    →    φ_AB = (q/ℏ)Φ_B = ${(phaseShift / Math.PI).toFixed(2)}π`
      : "solenoid OFF — fringes centred at x = 0",
    x + 12,
    y + h - 10,
  );
}

function drawCurvedPath(
  ctx: CanvasRenderingContext2D,
  points: { x: number; y: number }[],
  stroke: string,
) {
  if (points.length < 2) return;
  ctx.strokeStyle = stroke;
  ctx.beginPath();
  ctx.moveTo(points[0].x, points[0].y);
  // Catmull-Rom-ish: just draw smooth quadratics through midpoints
  for (let i = 1; i < points.length; i += 1) {
    const p = points[i];
    const prev = points[i - 1];
    const mx = (prev.x + p.x) / 2;
    const my = (prev.y + p.y) / 2;
    if (i === 1) {
      ctx.lineTo(mx, my);
    } else {
      ctx.quadraticCurveTo(prev.x, prev.y, mx, my);
    }
  }
  const last = points[points.length - 1];
  ctx.lineTo(last.x, last.y);
  ctx.stroke();
}

function drawElectronPulse(
  ctx: CanvasRenderingContext2D,
  pts: { x: number; y: number }[],
  t: number,
) {
  // Linearly interpolate along the polyline by arclength fraction t ∈ [0,1)
  let total = 0;
  const segs: number[] = [];
  for (let i = 1; i < pts.length; i += 1) {
    const dx = pts[i].x - pts[i - 1].x;
    const dy = pts[i].y - pts[i - 1].y;
    const d = Math.hypot(dx, dy);
    segs.push(d);
    total += d;
  }
  let target = t * total;
  let px = pts[0].x;
  let py = pts[0].y;
  for (let i = 0; i < segs.length; i += 1) {
    if (target <= segs[i]) {
      const f = target / segs[i];
      px = pts[i].x + (pts[i + 1].x - pts[i].x) * f;
      py = pts[i].y + (pts[i + 1].y - pts[i].y) * f;
      break;
    }
    target -= segs[i];
  }
  ctx.fillStyle = `${AMBER} 0.95)`;
  ctx.beginPath();
  ctx.arc(px, py, 2.6, 0, Math.PI * 2);
  ctx.fill();
}

// ─────────────────────────────────────────────────────────────────────────────
// Fringe-pattern column on the right — vertical screen with intensity I(y).
// Plots I_on(y) and a faint baseline I_off(y) ghost so the eye sees the shift.
// ─────────────────────────────────────────────────────────────────────────────
function drawFringeColumn(
  ctx: CanvasRenderingContext2D,
  colors: { fg0: string; fg1: string; fg2: string; fg3: string },
  x: number,
  y: number,
  w: number,
  h: number,
  baseline: (yMm: number) => number,
  phaseShift: number,
  on: boolean,
) {
  const padT = 26;
  const padB = 28;
  const top = y + padT;
  const bot = y + h - padB;
  const screenH = bot - top;

  // Background column tint
  ctx.fillStyle = `${PALE_BLUE} 0.04)`;
  ctx.fillRect(x + 4, top, w - 8, screenH);

  // Vertical screen line at the left edge of this column
  ctx.strokeStyle = colors.fg3;
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.moveTo(x + 8, top - 4);
  ctx.lineTo(x + 8, bot + 4);
  ctx.stroke();

  // Title
  ctx.fillStyle = colors.fg1;
  ctx.font = "bold 10px monospace";
  ctx.textAlign = "left";
  ctx.fillText("SCREEN", x + 14, y + 18);

  // Sample intensities
  const samples = 240;
  const yMmToPx = (yMm: number) =>
    top + ((yMm + SCREEN_HALF_WIDTH_MM) / (2 * SCREEN_HALF_WIDTH_MM)) * screenH;

  const live = interferencePattern(
    SLIT_SEP_MM,
    SCREEN_DIST_MM,
    WAVELENGTH_NM * 1e-6,
    phaseShift,
  );

  const plotX0 = x + 14;
  const plotW = w - 22;

  // ── Ghost baseline (yellow-amber) — only visible when ON, so the shift reads
  if (on) {
    ctx.fillStyle = `rgba(255, 210, 150, 0.12)`;
    ctx.beginPath();
    ctx.moveTo(plotX0, top);
    for (let i = 0; i <= samples; i += 1) {
      const yMm = -SCREEN_HALF_WIDTH_MM + (i / samples) * 2 * SCREEN_HALF_WIDTH_MM;
      const py = yMmToPx(yMm);
      const I = baseline(yMm);
      const px = plotX0 + plotW * (I / 4);
      ctx.lineTo(px, py);
    }
    ctx.lineTo(plotX0, bot);
    ctx.closePath();
    ctx.fill();

    ctx.strokeStyle = `rgba(255, 210, 150, 0.55)`;
    ctx.lineWidth = 1;
    ctx.setLineDash([3, 3]);
    ctx.beginPath();
    for (let i = 0; i <= samples; i += 1) {
      const yMm = -SCREEN_HALF_WIDTH_MM + (i / samples) * 2 * SCREEN_HALF_WIDTH_MM;
      const py = yMmToPx(yMm);
      const I = baseline(yMm);
      const px = plotX0 + plotW * (I / 4);
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.stroke();
    ctx.setLineDash([]);
  }

  // ── Active intensity curve (pale-blue, bold)
  ctx.fillStyle = `${PALE_BLUE} 0.22)`;
  ctx.beginPath();
  ctx.moveTo(plotX0, top);
  for (let i = 0; i <= samples; i += 1) {
    const yMm = -SCREEN_HALF_WIDTH_MM + (i / samples) * 2 * SCREEN_HALF_WIDTH_MM;
    const py = yMmToPx(yMm);
    const I = live(yMm);
    const px = plotX0 + plotW * (I / 4);
    ctx.lineTo(px, py);
  }
  ctx.lineTo(plotX0, bot);
  ctx.closePath();
  ctx.fill();

  ctx.strokeStyle = `${PALE_BLUE} 0.95)`;
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  for (let i = 0; i <= samples; i += 1) {
    const yMm = -SCREEN_HALF_WIDTH_MM + (i / samples) * 2 * SCREEN_HALF_WIDTH_MM;
    const py = yMmToPx(yMm);
    const I = live(yMm);
    const px = plotX0 + plotW * (I / 4);
    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.stroke();

  // Centre tick (x = 0)
  ctx.strokeStyle = `${LILAC} 0.55)`;
  ctx.lineWidth = 1;
  ctx.setLineDash([2, 3]);
  const yCenter = yMmToPx(0);
  ctx.beginPath();
  ctx.moveTo(x + 8, yCenter);
  ctx.lineTo(x + w - 6, yCenter);
  ctx.stroke();
  ctx.setLineDash([]);

  // Axis label
  ctx.fillStyle = colors.fg2;
  ctx.font = "9px monospace";
  ctx.textAlign = "right";
  ctx.fillText("x = 0", x + w - 6, yCenter - 3);

  // Bottom caption
  ctx.fillStyle = colors.fg2;
  ctx.font = "9.5px monospace";
  ctx.textAlign = "center";
  ctx.fillText(
    on ? "I(x) shifts with Φ_B" : "I(x) — baseline (Φ_B = 0)",
    x + w / 2,
    y + h - 10,
  );
}
