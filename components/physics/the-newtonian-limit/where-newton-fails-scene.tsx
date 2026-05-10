"use client";

import { useEffect, useMemo, useRef } from "react";
import {
  mercuryPerihelionAdvancePerOrbit,
  arcsecPerCentury,
} from "@/lib/physics/relativity/newtonian-limit";
import {
  applyDpr,
  SCENE_CANVAS_CLASS,
  SCENE_HEIGHT_DEFAULT,
  hexToRgba,
  useSceneSize,
  useSceneTokens,
  type SceneTokens,
} from "@/components/physics/_shared/scene-tokens";

/**
 * WHERE NEWTON FAILS SCENE — §08 THE NEWTONIAN LIMIT
 *
 * A regime scale chart:
 *   - Horizontal axis: field strength ε = |Φ|/c² (log scale, 10⁻¹⁰ … 1)
 *   - Vertical axis: velocity ratio v/c (log scale, 10⁻⁵ … 1)
 *
 * Coloured regions mark where Newton works (blue-green) vs where GR is
 * needed (amber to red). Key anchors are plotted:
 *   • Earth surface, GPS satellites, Solar system planets (Newton good)
 *   • Mercury perihelion (first post-Newtonian effect) — labelled with 43"/century
 *   • Solar surface (light bending, factor-2 discrepancy from Newtonian prediction)
 *   • Neutron stars, black-hole horizons (full GR required)
 *   • Gravitational waves, cosmological expansion
 */

// Margins for the chart area
const ML = 70; // left margin
const MR = 20; // right
const MT = 36; // top
const MB = 50; // bottom

// Mercury data for the live readout
const M_SUN = 1.989e30;
const A_MERCURY = 5.79e10;
const E_MERCURY = 0.2056;
const T_MERCURY = 88 * 86400;
const MERCURY_ADVANCE_APS = arcsecPerCentury(
  mercuryPerihelionAdvancePerOrbit(M_SUN, A_MERCURY, E_MERCURY),
  T_MERCURY,
);

/** Map log-scale ε ∈ [10⁻¹⁰, 1] to canvas x-coordinate. */
function epsToX(eps: number, CW: number): number {
  const logMin = -10;
  const logMax = 0;
  const frac = (Math.log10(Math.max(eps, 1e-12)) - logMin) / (logMax - logMin);
  return ML + frac * CW;
}

/** Map log-scale v/c ∈ [10⁻⁵, 1] to canvas y-coordinate (y increases downward). */
function vcToY(vc: number, CH: number): number {
  const logMin = -5;
  const logMax = 0;
  const frac = (Math.log10(Math.max(vc, 1e-7)) - logMin) / (logMax - logMin);
  return MT + (1 - frac) * CH; // flip: large v/c = top
}

interface Regime {
  epsMin: number;
  epsMax: number;
  vcMin: number;
  vcMax: number;
  color: string;
  alpha: number;
  label: string;
  labelColor: string;
}

interface Anchor {
  eps: number;
  vc: number;
  label: string;
  sublabel?: string;
  color: string;
  size: number;
}

function buildRegimes(tokens: SceneTokens): Regime[] {
  return [
    {
      epsMin: 1e-10, epsMax: 1e-5,
      vcMin: 1e-5, vcMax: 1e-2,
      color: tokens.blue, alpha: 0.12,
      label: "Newton works", labelColor: tokens.blue,
    },
    {
      epsMin: 1e-10, epsMax: 5e-6,
      vcMin: 1e-2, vcMax: 3e-1,
      color: tokens.blue, alpha: 0.08,
      label: "SR needed,\nNewton ok", labelColor: tokens.blue,
    },
    {
      epsMin: 1e-5, epsMax: 1e-1,
      vcMin: 1e-5, vcMax: 3e-1,
      color: tokens.amber, alpha: 0.10,
      label: "Post-Newtonian\ncorrections", labelColor: tokens.amber,
    },
    {
      epsMin: 1e-1, epsMax: 1,
      vcMin: 1e-5, vcMax: 1,
      color: tokens.red, alpha: 0.14,
      label: "Full GR required", labelColor: tokens.red,
    },
  ];
}

function buildAnchors(tokens: SceneTokens): Anchor[] {
  return [
    { eps: 7e-10, vc: 3e-5, label: "Earth surface", color: tokens.blue, size: 5 },
    { eps: 3e-10, vc: 1.3e-5, label: "GPS orbit", sublabel: "+Φ correction used", color: tokens.blue, size: 4 },
    { eps: 2e-9, vc: 4.7e-5, label: "Mercury", sublabel: `43.0"/century`, color: tokens.green, size: 6 },
    { eps: 2e-6, vc: 1e-4, label: "Solar surface", sublabel: "2× Newton light bend", color: tokens.amber, size: 5 },
    { eps: 2e-6, vc: 3e-3, label: "Solar wind / PSP", color: tokens.amber, size: 4 },
    { eps: 0.2, vc: 0.3, label: "Neutron star", color: tokens.orange, size: 6 },
    { eps: 0.5, vc: 0.5, label: "BH horizon", sublabel: "GR only", color: tokens.red, size: 7 },
    { eps: 1e-16, vc: 1e-5, label: "Gravitational waves", color: tokens.purple, size: 4 },
  ];
}

function drawScene(
  ctx: CanvasRenderingContext2D,
  tokens: SceneTokens,
  regimes: Regime[],
  anchors: Anchor[],
  W: number,
  H: number,
) {
  const CW = W - ML - MR;
  const CH = H - MT - MB;
  const ex = (eps: number) => epsToX(eps, CW);
  const vy = (vc: number) => vcToY(vc, CH);

  ctx.clearRect(0, 0, W, H);
  ctx.fillStyle = tokens.bg;
  ctx.fillRect(0, 0, W, H);

  // ─── Background regime bands ───────────────────────────────────────────
  regimes.forEach(({ epsMin, epsMax, vcMin, vcMax, color, alpha }) => {
    const x1 = ex(epsMin);
    const x2 = ex(epsMax);
    const y1 = vy(vcMax);
    const y2 = vy(vcMin);
    ctx.fillStyle = color;
    ctx.globalAlpha = alpha;
    ctx.fillRect(x1, y1, x2 - x1, y2 - y1);
    ctx.globalAlpha = 1;
  });

  // Regime border lines
  regimes.forEach(({ epsMin, epsMax, vcMin, vcMax, color, alpha }) => {
    const x1 = ex(epsMin);
    const x2 = ex(epsMax);
    const y1 = vy(vcMax);
    const y2 = vy(vcMin);
    ctx.strokeStyle = color;
    ctx.globalAlpha = alpha * 2;
    ctx.lineWidth = 0.8;
    ctx.strokeRect(x1, y1, x2 - x1, y2 - y1);
    ctx.globalAlpha = 1;
  });

  // ─── Axes ─────────────────────────────────────────────────────────────
  ctx.strokeStyle = tokens.axes;
  ctx.lineWidth = 1.2;
  // x-axis
  ctx.beginPath();
  ctx.moveTo(ML, MT + CH);
  ctx.lineTo(ML + CW, MT + CH);
  ctx.stroke();
  // y-axis
  ctx.beginPath();
  ctx.moveTo(ML, MT);
  ctx.lineTo(ML, MT + CH);
  ctx.stroke();

  // Axis labels
  ctx.fillStyle = tokens.textDim;
  ctx.font = "11px monospace";
  ctx.textAlign = "center";
  ctx.fillText("ε = |Φ|/c²  (field strength)", ML + CW / 2, H - 6);

  ctx.save();
  ctx.translate(12, MT + CH / 2);
  ctx.rotate(-Math.PI / 2);
  ctx.fillText("v/c  (speed)", 0, 0);
  ctx.restore();

  // x-axis tick marks
  const epsTicks = [-10, -8, -6, -4, -2, 0];
  epsTicks.forEach((exp) => {
    const x = ex(Math.pow(10, exp));
    ctx.fillStyle = tokens.textFaint;
    ctx.font = "9px monospace";
    ctx.textAlign = "center";
    ctx.fillText(`10^${exp}`, x, MT + CH + 14);
    ctx.strokeStyle = tokens.grid;
    ctx.lineWidth = 0.5;
    ctx.setLineDash([3, 3]);
    ctx.beginPath();
    ctx.moveTo(x, MT);
    ctx.lineTo(x, MT + CH);
    ctx.stroke();
    ctx.setLineDash([]);
  });

  // y-axis tick marks
  const vcTicks = [-5, -4, -3, -2, -1, 0];
  vcTicks.forEach((exp) => {
    const y = vy(Math.pow(10, exp));
    ctx.fillStyle = tokens.textFaint;
    ctx.font = "9px monospace";
    ctx.textAlign = "right";
    ctx.fillText(`10^${exp}`, ML - 5, y + 3);
    ctx.strokeStyle = tokens.grid;
    ctx.lineWidth = 0.5;
    ctx.setLineDash([3, 3]);
    ctx.beginPath();
    ctx.moveTo(ML, y);
    ctx.lineTo(ML + CW, y);
    ctx.stroke();
    ctx.setLineDash([]);
  });
  ctx.textAlign = "left";

  // ─── Regime labels ─────────────────────────────────────────────────────
  regimes.forEach(({ epsMin, epsMax, vcMin, vcMax, labelColor, label }) => {
    const xc = (ex(epsMin) + ex(epsMax)) / 2;
    const yc = (vy(vcMin) + vy(vcMax)) / 2;
    ctx.fillStyle = labelColor;
    ctx.globalAlpha = 0.75;
    ctx.font = "bold 9px monospace";
    ctx.textAlign = "center";
    const lines = label.split("\n");
    lines.forEach((line, i) => ctx.fillText(line, xc, yc - (lines.length - 1) * 6 + i * 13));
    ctx.globalAlpha = 1;
  });
  ctx.textAlign = "left";

  // ─── Anchor points ─────────────────────────────────────────────────────
  anchors.forEach(({ eps, vc, label, sublabel, color, size }) => {
    const x = ex(eps);
    const y = vy(vc);
    if (x < ML || x > ML + CW || y < MT || y > MT + CH) return;

    // Glow — uses hexToRgba helper for theme-aware colors
    const glow = ctx.createRadialGradient(x, y, 0, x, y, size * 3);
    glow.addColorStop(0, hexToRgba(color, 0.4));
    glow.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(x, y, size * 3, 0, Math.PI * 2);
    ctx.fill();

    // Dot
    ctx.beginPath();
    ctx.arc(x, y, size, 0, Math.PI * 2);
    ctx.fillStyle = color;
    ctx.fill();

    // Label
    ctx.fillStyle = color;
    ctx.font = "bold 10px monospace";
    const labelX = x + size + 4;
    const labelY = y - size;
    ctx.fillText(label, labelX, labelY);
    if (sublabel) {
      ctx.fillStyle = color;
      ctx.globalAlpha = 0.65;
      ctx.font = "9px monospace";
      ctx.fillText(sublabel, labelX, labelY + 12);
      ctx.globalAlpha = 1;
    }
  });

  // ─── Mercury callout ───────────────────────────────────────────────────
  const mx = ex(2e-9);
  const my = vy(4.7e-5);
  ctx.strokeStyle = tokens.green;
  ctx.lineWidth = 1;
  ctx.setLineDash([4, 4]);
  ctx.beginPath();
  ctx.moveTo(mx, my);
  ctx.lineTo(mx + 28, my - 28);
  ctx.stroke();
  ctx.setLineDash([]);

  // ─── Title ─────────────────────────────────────────────────────────────
  ctx.fillStyle = tokens.textDim;
  ctx.font = "bold 12px monospace";
  ctx.textAlign = "center";
  ctx.fillText("WHERE NEWTON WORKS — AND WHERE GR IS NEEDED", W / 2, 22);
  ctx.textAlign = "left";

  // ─── Mercury arcsec/century readout ───────────────────────────────────
  ctx.fillStyle = tokens.green;
  ctx.font = "bold 10px monospace";
  const apsStr = MERCURY_ADVANCE_APS.toFixed(1);
  ctx.fillText(`Mercury perihelion: ${apsStr}"/century  ← first quantitative GR test`, ML, H - 10);
}

export function WhereNewtonFailsScene() {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const tokens = useSceneTokens();
  const { width, height } = useSceneSize(containerRef, {
    ratio: 0.66,
    maxHeight: SCENE_HEIGHT_DEFAULT,
  });
  const regimes = useMemo(() => buildRegimes(tokens), [tokens]);
  const anchors = useMemo(() => buildAnchors(tokens), [tokens]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = applyDpr(canvas, width, height);
    if (!ctx) return;
    drawScene(ctx, tokens, regimes, anchors, width, height);
  }, [tokens, regimes, anchors, width, height]);

  return (
    <div ref={containerRef} className="relative w-full pb-4 flex flex-col items-center gap-3">
      <canvas
        ref={canvasRef}
        style={{ width, height, display: "block" }}
        className={SCENE_CANVAS_CLASS}
      />
      <p className="font-mono text-[10px] text-[var(--color-fg-3)]">
        Newton was right where it counted. The chart shows the (ε, v/c) parameter space: the blue-green region is the Newtonian domain.
        Mercury sits just outside it — the first observable post-Newtonian effect.
        GR becomes unavoidable (red region) for neutron stars, black holes, and the early universe.
      </p>
    </div>
  );
}
