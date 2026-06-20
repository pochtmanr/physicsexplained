"use client";

import { useEffect, useRef, useState } from "react";
import {
  FONT_HUD_SMALL,
  SCENE_CANVAS_CLASS,
  SCENE_HEIGHT_TALL,
  applyDpr,
  hexToRgba,
  drawHudReadout,
  drawSectionTitle,
  useSceneSize,
  useSceneTokens,
  type SceneTokens,
} from "@/components/physics/_shared/scene-tokens";
import { Button } from "@/components/ui/button";

/**
 * FIG.42a — Earth–Venus radar echo as Venus orbits toward superior conjunction.
 *
 * LEFT PANEL: a plan view of the inner Solar System. The Sun sits at center;
 *   Earth's orbit and Venus's orbit are drawn as circles. Earth is fixed; a
 *   slider sweeps Venus around its orbit through superior conjunction (Venus on
 *   the far side of the Sun, in line with Earth). The radar line of sight from
 *   Earth to Venus is drawn; when it grazes the Sun the impact parameter b
 *   collapses toward the solar radius and the path glows.
 *
 * RIGHT PANEL: the round-trip Shapiro delay traced as a function of orbital
 *   phase — the famous logarithmic spike that peaks at conjunction. A moving
 *   marker tracks the current phase.
 *
 * The delay is computed with the weak-field log formula (see
 * lib/physics/relativity/shapiro-delay.ts), inlined here in canvas units.
 */

const PAD = 16;

// Local constants (display units; orbital geometry is schematic but the delay
// uses physical radii so the curve shape is faithful).
const AU = 1.495978707e11;
const R_SUN = 6.957e8;
const GM_SUN = 1.32712440018e20;
const C = 2.99792458e8;
const R_EARTH_ORBIT = AU;
const R_VENUS_ORBIT = 0.723 * AU;

function gravTimeScale(): number {
  return (2 * GM_SUN) / Math.pow(C, 3);
}

/** One-way delay with the standard log form. b clamped to ≥ tiny. */
function oneWay(r1: number, r2: number, b: number): number {
  const bb = Math.max(b, R_SUN * 1e-4);
  const x1 = Math.sqrt(Math.max(0, r1 * r1 - bb * bb));
  const x2 = Math.sqrt(Math.max(0, r2 * r2 - bb * bb));
  const arg = ((r1 + x1) * (r2 + x2)) / (bb * bb);
  return gravTimeScale() * Math.log(arg);
}

/**
 * Geometry: Earth fixed at angle 0 on its orbit. Venus at orbital angle φ
 * (radians) measured the same way. Superior conjunction occurs when Venus is
 * diametrically opposite Earth across the Sun (φ = π). We compute the impact
 * parameter of the Earth→Venus chord with respect to the Sun at the origin.
 */
function geometry(phi: number) {
  const E = { x: R_EARTH_ORBIT, y: 0 };
  const V = { x: R_VENUS_ORBIT * Math.cos(phi), y: R_VENUS_ORBIT * Math.sin(phi) };
  // Perpendicular distance from origin (Sun) to the line segment E–V.
  const dx = V.x - E.x;
  const dy = V.y - E.y;
  const len = Math.hypot(dx, dy) || 1;
  // Distance from origin to the infinite line through E and V.
  const cross = Math.abs(dx * E.y - dy * E.x);
  let b = cross / len;
  // Only count the Sun as "in the path" when its projection lands between E and V.
  const tProj = -((E.x * dx + E.y * dy)) / (len * len);
  const sunBetween = tProj > 0 && tProj < 1;
  // If the Sun is not between the endpoints, the ray does not skirt it: use a
  // large effective b so the extra delay is small.
  if (!sunBetween) b = Math.max(b, R_EARTH_ORBIT);
  return { E, V, b: Math.max(b, R_SUN), sunBetween };
}

/** Sample the delay curve across the visible phase window for the right panel. */
function delaySamples(phiMin: number, phiMax: number, n: number) {
  const out: { phi: number; us: number }[] = [];
  for (let i = 0; i <= n; i++) {
    const phi = phiMin + ((phiMax - phiMin) * i) / n;
    const { b } = geometry(phi);
    const dt = 2 * oneWay(R_EARTH_ORBIT, R_VENUS_ORBIT, b);
    out.push({ phi, us: dt * 1e6 });
  }
  return out;
}

export function RadarEchoDelayScene() {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const tokens = useSceneTokens();
  // Phase swept from just before to just after conjunction (π).
  const PHI_MIN = Math.PI - 0.55;
  const PHI_MAX = Math.PI + 0.55;
  const [phi, setPhi] = useState(Math.PI - 0.32);
  const { width, height } = useSceneSize(containerRef, {
    ratio: 0.5,
    maxHeight: SCENE_HEIGHT_TALL,
    minHeight: 320,
  });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = applyDpr(canvas, width, height);
    if (!ctx) return;
    draw(ctx, tokens, phi, PHI_MIN, PHI_MAX, width, height);
  }, [phi, tokens, PHI_MIN, PHI_MAX, width, height]);

  const { b, sunBetween } = geometry(phi);
  const dtUs = 2 * oneWay(R_EARTH_ORBIT, R_VENUS_ORBIT, b) * 1e6;

  return (
    <div ref={containerRef} className="relative w-full pb-4">
      <canvas
        ref={canvasRef}
        style={{ width, height, display: "block" }}
        className={SCENE_CANVAS_CLASS}
        aria-label="Plan view of Earth and Venus orbits with a radar line of sight past the Sun, and the round-trip Shapiro delay curve peaking at superior conjunction."
      />
      <div className="mt-3 flex items-center gap-3 font-mono text-xs text-[var(--color-fg-2)]">
        <span className="w-56 shrink-0">
          delay: {dtUs.toFixed(1)} μs {sunBetween ? "(skirting Sun)" : ""}
        </span>
        <input
          type="range"
          min={PHI_MIN}
          max={PHI_MAX}
          step={0.002}
          value={phi}
          onChange={(e) => setPhi(parseFloat(e.target.value))}
          className="flex-1"
          style={{ accentColor: "var(--color-amber)" }}
          aria-label="Venus orbital phase toward superior conjunction"
        />
      </div>
      <div className="mt-1 flex flex-wrap gap-1 font-mono text-xs">
        <Button onClick={() => setPhi(PHI_MIN)}>before conjunction</Button>
        <Button onClick={() => setPhi(Math.PI)}>superior conjunction</Button>
        <Button onClick={() => setPhi(PHI_MAX)}>after conjunction</Button>
      </div>
    </div>
  );
}

function draw(
  ctx: CanvasRenderingContext2D,
  tokens: SceneTokens,
  phi: number,
  phiMin: number,
  phiMax: number,
  W: number,
  H: number,
) {
  ctx.fillStyle = tokens.bg;
  ctx.fillRect(0, 0, W, H);

  const gap = 18;
  const panelW = (W - PAD * 2 - gap) / 2;
  const leftX0 = PAD;
  const rightX0 = PAD + panelW + gap;
  const panelY0 = PAD + 20;
  const panelH = H - PAD * 2 - 20;

  // ── LEFT: orbital plan view ───────────────────────────────────────────────
  ctx.strokeStyle = tokens.panelBorder;
  ctx.lineWidth = 1;
  ctx.strokeRect(leftX0, panelY0, panelW, panelH);
  drawSectionTitle(ctx, leftX0 + 6, panelY0 - 16, "INNER SOLAR SYSTEM", tokens.textMute);

  const cx = leftX0 + panelW / 2;
  const cy = panelY0 + panelH / 2;
  // Scale 1 AU to fit; Earth orbit at radius scaleR.
  const scaleR = Math.min(panelW, panelH) * 0.36;
  const auToPx = scaleR / R_EARTH_ORBIT;

  // Orbits
  ctx.strokeStyle = tokens.grid;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.arc(cx, cy, R_EARTH_ORBIT * auToPx, 0, Math.PI * 2);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(cx, cy, R_VENUS_ORBIT * auToPx, 0, Math.PI * 2);
  ctx.stroke();

  const { E, V, b, sunBetween } = geometry(phi);
  // Map physical (x,y) to canvas (y flipped).
  const px = (p: { x: number; y: number }) => ({
    x: cx + p.x * auToPx,
    y: cy - p.y * auToPx,
  });
  const Epx = px(E);
  const Vpx = px(V);

  // Radar line of sight
  const losColor = sunBetween ? tokens.amber : tokens.cyan;
  ctx.save();
  if (sunBetween) {
    ctx.shadowColor = tokens.amber;
    ctx.shadowBlur = 10;
  }
  ctx.strokeStyle = hexToRgba(losColor, 0.9);
  ctx.lineWidth = sunBetween ? 2 : 1.4;
  ctx.beginPath();
  ctx.moveTo(Epx.x, Epx.y);
  ctx.lineTo(Vpx.x, Vpx.y);
  ctx.stroke();
  ctx.restore();

  // Sun
  const sunR = 7;
  const sunGrad = ctx.createRadialGradient(cx, cy, 1, cx, cy, sunR * 2.4);
  sunGrad.addColorStop(0, hexToRgba(tokens.amber, 1));
  sunGrad.addColorStop(1, hexToRgba(tokens.amber, 0));
  ctx.fillStyle = sunGrad;
  ctx.beginPath();
  ctx.arc(cx, cy, sunR * 2.4, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = tokens.amber;
  ctx.beginPath();
  ctx.arc(cx, cy, sunR, 0, Math.PI * 2);
  ctx.fill();

  // Earth + Venus dots
  ctx.fillStyle = tokens.cyan;
  ctx.beginPath();
  ctx.arc(Epx.x, Epx.y, 4.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = tokens.magenta;
  ctx.beginPath();
  ctx.arc(Vpx.x, Vpx.y, 4, 0, Math.PI * 2);
  ctx.fill();

  // Labels
  ctx.font = FONT_HUD_SMALL;
  ctx.fillStyle = tokens.cyan;
  ctx.textAlign = "left";
  ctx.textBaseline = "middle";
  ctx.fillText("Earth", Epx.x + 7, Epx.y);
  ctx.fillStyle = tokens.magenta;
  ctx.fillText("Venus", Vpx.x + 7, Vpx.y);
  ctx.fillStyle = tokens.amber;
  ctx.textAlign = "center";
  ctx.fillText("Sun", cx, cy + sunR + 12);

  // HUD: impact parameter in solar radii
  ctx.textAlign = "left";
  drawHudReadout(
    ctx,
    leftX0 + 8,
    panelY0 + 6,
    "b ≈ ",
    `${(b / R_SUN).toFixed(b < 3 * R_SUN ? 2 : 0)} R_⊙`,
    tokens.textDim,
    sunBetween ? tokens.amber : tokens.textMute,
  );

  // ── RIGHT: delay curve ────────────────────────────────────────────────────
  ctx.strokeStyle = tokens.panelBorder;
  ctx.lineWidth = 1;
  ctx.strokeRect(rightX0, panelY0, panelW, panelH);
  drawSectionTitle(ctx, rightX0 + 6, panelY0 - 16, "ROUND-TRIP DELAY  (μs)", tokens.textMute);

  const plotX0 = rightX0 + 38;
  const plotX1 = rightX0 + panelW - 12;
  const plotY0 = panelY0 + 14;
  const plotY1 = panelY0 + panelH - 26;

  const samples = delaySamples(phiMin, phiMax, 240);
  let maxUs = 0;
  for (const s of samples) maxUs = Math.max(maxUs, s.us);
  const yTop = maxUs * 1.12;

  const sx = (p: number) => plotX0 + ((p - phiMin) / (phiMax - phiMin)) * (plotX1 - plotX0);
  const sy = (u: number) => plotY1 - (u / yTop) * (plotY1 - plotY0);

  // Axes
  ctx.strokeStyle = tokens.axes;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(plotX0, plotY0);
  ctx.lineTo(plotX0, plotY1);
  ctx.lineTo(plotX1, plotY1);
  ctx.stroke();

  // y gridlines
  ctx.font = FONT_HUD_SMALL;
  ctx.fillStyle = tokens.textMute;
  ctx.textAlign = "right";
  ctx.textBaseline = "middle";
  for (let k = 0; k <= 4; k++) {
    const u = (yTop * k) / 4;
    const y = sy(u);
    ctx.strokeStyle = tokens.grid;
    ctx.beginPath();
    ctx.moveTo(plotX0, y);
    ctx.lineTo(plotX1, y);
    ctx.stroke();
    ctx.fillStyle = tokens.textMute;
    ctx.fillText(u.toFixed(0), plotX0 - 5, y);
  }

  // Conjunction marker (φ = π)
  const xConj = sx(Math.PI);
  ctx.strokeStyle = hexToRgba(tokens.amber, 0.5);
  ctx.setLineDash([4, 3]);
  ctx.beginPath();
  ctx.moveTo(xConj, plotY0);
  ctx.lineTo(xConj, plotY1);
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.fillStyle = hexToRgba(tokens.amber, 0.8);
  ctx.textAlign = "center";
  ctx.textBaseline = "top";
  ctx.fillText("conjunction", xConj, plotY0 - 1);

  // Curve
  ctx.strokeStyle = tokens.amber;
  ctx.lineWidth = 2;
  ctx.beginPath();
  samples.forEach((s, i) => {
    const x = sx(s.phi);
    const y = sy(s.us);
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  });
  ctx.stroke();

  // Current-phase marker
  const { b: bNow } = geometry(phi);
  const usNow = 2 * oneWay(R_EARTH_ORBIT, R_VENUS_ORBIT, bNow) * 1e6;
  const mx = sx(phi);
  const my = sy(usNow);
  ctx.strokeStyle = hexToRgba(tokens.magenta, 0.6);
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(mx, plotY1);
  ctx.lineTo(mx, my);
  ctx.stroke();
  ctx.fillStyle = tokens.magenta;
  ctx.beginPath();
  ctx.arc(mx, my, 4, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = tokens.textBright;
  ctx.font = FONT_HUD_SMALL;
  ctx.textAlign = "center";
  ctx.textBaseline = "bottom";
  ctx.fillText(`${usNow.toFixed(0)} μs`, mx, my - 6);
}
