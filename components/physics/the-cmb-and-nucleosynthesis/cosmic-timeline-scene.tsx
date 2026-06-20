"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  FONT_HUD,
  FONT_HUD_SMALL,
  SCENE_CANVAS_CLASS,
  SCENE_HEIGHT_DEFAULT,
  applyDpr,
  drawSectionTitle,
  hexToRgba,
  useSceneSize,
  useSceneTokens,
  type SceneTokens,
} from "@/components/physics/_shared/scene-tokens";

/**
 * FIG.57b — The cosmic timeline, from one second to 380,000 years.
 *
 * A logarithmic time slider sweeps the early universe. At each instant the
 * scene reports the cosmic time, the photon temperature, what particles exist,
 * and — crucially — whether the universe is opaque (photons trapped in the
 * ionised plasma) or transparent (after recombination, when the CMB is
 * released). A coloured opacity strip turns from foggy to clear at t ≈ 380 kyr.
 */

interface Era {
  // log10 of cosmic time in seconds
  logT: number;
  label: string;
  /** temperature in K at this time */
  T: number;
  whatExists: string;
  opaque: boolean;
}

// Milestones across the radiation era. Temperatures follow the radiation-era
// relation T ≈ 1.5e10 K · (t/1 s)^(−1/2) for the early points, transitioning
// to the matter era near recombination.
const ERAS: Era[] = [
  { logT: 0, label: "weak freeze-out", T: 1.0e10, whatExists: "p, n, e±, ν, γ — n/p ratio frozen", opaque: true },
  { logT: 1, label: "deuterium bottleneck", T: 3.5e9, whatExists: "protons + neutrons; D blown apart by γ", opaque: true },
  { logT: 2.26, label: "nucleosynthesis (~3 min)", T: 9.0e8, whatExists: "²H, ³He, ⁴He, traces of ⁷Li forged", opaque: true },
  { logT: 4, label: "after BBN", T: 1.5e8, whatExists: "fixed ¼ helium by mass; plasma of nuclei + e⁻", opaque: true },
  { logT: 9, label: "matter–radiation equality", T: 9.0e3, whatExists: "matter density overtakes radiation", opaque: true },
  { logT: 10.18, label: "recombination (~380 kyr)", T: 3.0e3, whatExists: "e⁻ + p → neutral H; photons set free", opaque: false },
];

const LOG_MIN = 0; // 1 s
const LOG_MAX = 10.18; // ~380 kyr

/** Photon temperature (K) interpolated in log-time across the milestones. */
function temperatureAt(logT: number): number {
  const eras = ERAS;
  if (logT <= eras[0].logT) return eras[0].T;
  if (logT >= eras[eras.length - 1].logT) return eras[eras.length - 1].T;
  for (let i = 0; i < eras.length - 1; i++) {
    const a = eras[i];
    const b = eras[i + 1];
    if (logT >= a.logT && logT <= b.logT) {
      const f = (logT - a.logT) / (b.logT - a.logT);
      // interpolate in log T for smoothness
      const logTemp = Math.log10(a.T) + f * (Math.log10(b.T) - Math.log10(a.T));
      return Math.pow(10, logTemp);
    }
  }
  return eras[eras.length - 1].T;
}

function nearestEra(logT: number): Era {
  let best = ERAS[0];
  let bestD = Infinity;
  for (const e of ERAS) {
    const d = Math.abs(e.logT - logT);
    if (d < bestD) {
      bestD = d;
      best = e;
    }
  }
  return best;
}

function formatTime(logT: number): string {
  const s = Math.pow(10, logT);
  if (s < 60) return `${s.toExponential(1)} s`;
  if (s < 3600) return `${(s / 60).toFixed(1)} min`;
  if (s < 86400) return `${(s / 3600).toFixed(1)} h`;
  const yr = s / (365.25 * 86400);
  if (yr < 1000) return `${yr.toFixed(0)} yr`;
  return `${(yr / 1000).toFixed(0)} kyr`;
}

function formatTemp(T: number): string {
  if (T >= 1e6) return `${(T / 1e9).toFixed(2)} × 10⁹ K`;
  if (T >= 1e4) return `${(T / 1e3).toFixed(0)},000 K`;
  return `${T.toFixed(0)} K`;
}

export function CosmicTimelineScene() {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const tokens = useSceneTokens();
  const [logT, setLogT] = useState(2.26);
  const { width, height } = useSceneSize(containerRef, {
    ratio: 0.55,
    maxHeight: SCENE_HEIGHT_DEFAULT,
    minHeight: 320,
  });

  const T = useMemo(() => temperatureAt(logT), [logT]);
  const era = useMemo(() => nearestEra(logT), [logT]);
  const opaque = T > 3000;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = applyDpr(canvas, width, height);
    if (!ctx) return;
    draw(ctx, tokens, logT, T, opaque, width, height);
  }, [tokens, logT, T, opaque, width, height]);

  return (
    <div ref={containerRef} className="relative w-full pb-4">
      <canvas
        ref={canvasRef}
        style={{ width, height, display: "block" }}
        className={SCENE_CANVAS_CLASS}
        aria-label="A logarithmic timeline of the early universe from one second to 380,000 years, showing temperature, what particles exist, and whether the universe is opaque or transparent."
      />
      <div className="mt-3 flex items-center gap-3 font-mono text-xs text-[var(--color-fg-2)]">
        <span className="w-40 shrink-0">
          t = {formatTime(logT)} · {formatTemp(T)}
        </span>
        <input
          type="range"
          min={LOG_MIN}
          max={LOG_MAX}
          step={0.02}
          value={logT}
          onChange={(e) => setLogT(parseFloat(e.target.value))}
          className="flex-1"
          style={{
            accentColor: opaque ? "var(--color-amber)" : "var(--color-cyan)",
          }}
        />
      </div>
      <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 font-mono text-xs text-[var(--color-fg-3)]">
        {ERAS.map((e) => (
          <button
            key={e.label}
            type="button"
            className={`cursor-pointer hover:text-[var(--color-fg-1)] ${
              era.label === e.label ? "text-[var(--color-fg-0)]" : ""
            }`}
            onClick={() => setLogT(e.logT)}
          >
            {e.label}
          </button>
        ))}
      </div>
    </div>
  );
}

function draw(
  ctx: CanvasRenderingContext2D,
  tokens: SceneTokens,
  logT: number,
  T: number,
  opaque: boolean,
  W: number,
  H: number,
) {
  ctx.fillStyle = tokens.bg;
  ctx.fillRect(0, 0, W, H);

  const padL = 24;
  const padR = 24;
  const trackY = H - 64;
  const trackX0 = padL;
  const trackX1 = W - padR;
  const trackW = trackX1 - trackX0;

  drawSectionTitle(ctx, padL, 14, "THE FIRST 380,000 YEARS", tokens.textMute);

  const xOf = (lt: number) =>
    trackX0 + ((lt - LOG_MIN) / (LOG_MAX - LOG_MIN)) * trackW;

  // ── Opacity strip: foggy (amber) before recombination, clear after ─────────
  const stripY = 44;
  const stripH = 26;
  const recombX = xOf(10.18);
  // opaque region
  const fogGrad = ctx.createLinearGradient(trackX0, 0, recombX, 0);
  fogGrad.addColorStop(0, hexToRgba(tokens.amber, 0.42));
  fogGrad.addColorStop(1, hexToRgba(tokens.amber, 0.16));
  ctx.fillStyle = fogGrad;
  ctx.fillRect(trackX0, stripY, recombX - trackX0, stripH);
  // transparent region
  const clearGrad = ctx.createLinearGradient(recombX, 0, trackX1, 0);
  clearGrad.addColorStop(0, hexToRgba(tokens.cyan, 0.05));
  clearGrad.addColorStop(1, hexToRgba(tokens.cyan, 0.18));
  ctx.fillStyle = clearGrad;
  ctx.fillRect(recombX, stripY, trackX1 - recombX, stripH);
  // strip border + recombination divider
  ctx.strokeStyle = tokens.panelBorder;
  ctx.lineWidth = 1;
  ctx.strokeRect(trackX0, stripY, trackW, stripH);
  ctx.strokeStyle = tokens.cyan;
  ctx.beginPath();
  ctx.moveTo(recombX, stripY - 4);
  ctx.lineTo(recombX, stripY + stripH + 4);
  ctx.stroke();

  ctx.font = FONT_HUD_SMALL;
  ctx.fillStyle = tokens.amber;
  ctx.textAlign = "left";
  ctx.textBaseline = "middle";
  ctx.fillText("OPAQUE — photons trapped in plasma", trackX0 + 8, stripY + stripH / 2);
  ctx.fillStyle = tokens.cyan;
  ctx.textAlign = "right";
  ctx.fillText("TRANSPARENT — CMB released", trackX1 - 8, stripY + stripH / 2);

  // ── Temperature curve across the strip→track gap ───────────────────────────
  const curveTop = stripY + stripH + 14;
  const curveBot = trackY - 18;
  const tempOf = (lt: number) => {
    const tt = temperatureAt(lt);
    const f =
      (Math.log10(tt) - Math.log10(3.0e3)) /
      (Math.log10(1.0e10) - Math.log10(3.0e3));
    return curveBot - f * (curveBot - curveTop);
  };
  ctx.strokeStyle = tokens.magenta;
  ctx.lineWidth = 2;
  ctx.beginPath();
  for (let i = 0; i <= 160; i++) {
    const lt = LOG_MIN + (i / 160) * (LOG_MAX - LOG_MIN);
    const x = xOf(lt);
    const y = tempOf(lt);
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.stroke();
  ctx.fillStyle = tokens.magenta;
  ctx.font = FONT_HUD_SMALL;
  ctx.textAlign = "left";
  ctx.textBaseline = "alphabetic";
  ctx.fillText("temperature ↓", trackX0 + 4, curveTop - 2);

  // ── Time track + milestone ticks ───────────────────────────────────────────
  ctx.strokeStyle = tokens.axes;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(trackX0, trackY);
  ctx.lineTo(trackX1, trackY);
  ctx.stroke();

  for (const e of ERAS) {
    const x = xOf(e.logT);
    ctx.strokeStyle = tokens.gridHeavy;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(x, trackY - 5);
    ctx.lineTo(x, trackY + 5);
    ctx.stroke();
  }

  // ── Playhead ───────────────────────────────────────────────────────────────
  const headX = xOf(logT);
  const headColor = opaque ? tokens.amber : tokens.cyan;
  ctx.strokeStyle = headColor;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(headX, stripY - 6);
  ctx.lineTo(headX, trackY + 8);
  ctx.stroke();
  ctx.fillStyle = headColor;
  ctx.beginPath();
  ctx.arc(headX, trackY, 4.5, 0, Math.PI * 2);
  ctx.fill();

  // ── Readout panel for the nearest era ──────────────────────────────────────
  const era = nearestEra(logT);
  const panelY = trackY + 18;
  ctx.font = FONT_HUD;
  ctx.fillStyle = tokens.textBright;
  ctx.textAlign = "left";
  ctx.textBaseline = "top";
  ctx.fillText(era.label.toUpperCase(), padL, panelY);
  ctx.font = FONT_HUD_SMALL;
  ctx.fillStyle = tokens.textMute;
  ctx.fillText(era.whatExists, padL, panelY + 16);
}
