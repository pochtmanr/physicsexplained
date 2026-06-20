"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  FONT_HUD_SMALL,
  SCENE_CANVAS_CLASS,
  SCENE_HEIGHT_TALL,
  applyDpr,
  hexToRgba,
  drawSectionTitle,
  useSceneSize,
  useSceneTick,
  useSceneTokens,
  type SceneTokens,
} from "@/components/physics/_shared/scene-tokens";
import {
  effectivePotential,
  circularOrbitRadii,
} from "@/lib/physics/relativity/the-schwarzschild-metric";

/**
 * FIG.39b — Effective-potential orbit explorer.
 *
 * LEFT: V_eff(x) = (1 − 1/x)(1 + ℓ²/x²) for the chosen reduced angular
 *   momentum ℓ, with the energy line E² and the Newtonian potential for
 *   contrast. The well's local max (the centrifugal barrier) and local min
 *   (a stable orbit) are marked. When ℓ < √3 the barrier disappears entirely.
 *
 * RIGHT: the orbit live-integrated from the radial energy equation, plotted in
 *   the orbital plane around the central mass — circular, precessing rosette,
 *   or plunge depending on (E², ℓ). The reader pulls the two sliders and reads
 *   the orbit class off the potential curve.
 */

const PAD = 14;
const X_MIN = 1.02;
const X_MAX = 12;

type OrbitClass = "plunge" | "precessing" | "circular" | "scatter";

interface OrbitState {
  cls: OrbitClass;
  path: { x: number; y: number }[]; // in units of r_s, polar→cartesian
}

/** Integrate the orbit in the (u = 1/x, φ) Binet form for Schwarzschild:
 *  d²u/dφ² + u = 1/(2ℓ²) + 3/2 · u²   (in units r_s = 1, c = 1).
 *  Returns a sampled path and a classification. */
function integrateOrbit(E2: number, ell: number): OrbitState {
  // Determine starting radius: an outer turning point of the radial motion.
  // Radial eqn: (dx/dτ)² = E² − V_eff(x). Find largest x where V_eff ≈ E².
  const turningPoints: number[] = [];
  let prev = effectivePotential(X_MIN, ell) - E2;
  for (let x = X_MIN; x <= 200; x += 0.01) {
    const cur = effectivePotential(x, ell) - E2;
    if (prev <= 0 && cur > 0) turningPoints.push(x);
    if (prev >= 0 && cur < 0) turningPoints.push(x);
    prev = cur;
  }

  const orbits = circularOrbitRadii(ell);
  let x0: number;
  if (turningPoints.length === 0) {
    // No turning point reached below 200 → either circular or unbounded.
    x0 = orbits ? orbits.stable : 20;
  } else {
    x0 = turningPoints[turningPoints.length - 1];
  }

  // Binet integration. u = 1/x.
  const path: { x: number; y: number }[] = [];
  let u = 1 / x0;
  let dudphi = 0; // start at a turning point → radial velocity zero
  const dphi = 0.01;
  const maxPhi = 28 * Math.PI;
  let plunged = false;
  let escaped = false;

  for (let phi = 0; phi < maxPhi; phi += dphi) {
    const x = 1 / u;
    if (x <= 1.0) {
      plunged = true;
      break;
    }
    if (x > 60) {
      escaped = true;
      break;
    }
    path.push({ x: x * Math.cos(phi), y: x * Math.sin(phi) });
    // d²u/dφ² = 1/(2ℓ²) + 3/2 u² − u
    const d2u = 1 / (2 * ell * ell) + 1.5 * u * u - u;
    dudphi += d2u * dphi;
    u += dudphi * dphi;
  }

  let cls: OrbitClass;
  if (plunged) cls = "plunge";
  else if (escaped) cls = "scatter";
  else {
    // bounded: circular if radius barely varies, else precessing
    let rmin = Infinity;
    let rmax = 0;
    for (const p of path) {
      const r = Math.hypot(p.x, p.y);
      rmin = Math.min(rmin, r);
      rmax = Math.max(rmax, r);
    }
    cls = rmax - rmin < 0.08 * rmax ? "circular" : "precessing";
  }
  return { cls, path };
}

export function OrbitExplorerScene() {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const tokens = useSceneTokens();
  const [ell, setEll] = useState(2.4);
  const [E2, setE2] = useState(0.94);
  const tickRef = useSceneTick(true);
  const { width, height } = useSceneSize(containerRef, {
    ratio: 0.56,
    maxHeight: SCENE_HEIGHT_TALL,
    minHeight: 340,
  });

  const orbit = useMemo(() => integrateOrbit(E2, ell), [E2, ell]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = applyDpr(canvas, width, height);
    if (!ctx) return;
    let raf = 0;
    const loop = () => {
      const t = tickRef.current / 1000;
      draw(ctx, tokens, ell, E2, orbit, t, width, height);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [tokens, ell, E2, orbit, tickRef, width, height]);

  const classLabel = {
    plunge: "PLUNGE — over the barrier, into the horizon",
    precessing: "PRECESSING — bound rosette (Mercury-like)",
    circular: "CIRCULAR — sitting in the potential minimum",
    scatter: "SCATTER — unbound flyby",
  }[orbit.cls];

  return (
    <div ref={containerRef} className="w-full pb-4">
      <canvas
        ref={canvasRef}
        style={{ width, height, display: "block" }}
        className={SCENE_CANVAS_CLASS}
        aria-label="Effective-potential orbit explorer. Left: the Schwarzschild effective potential for a chosen angular momentum with an energy line. Right: the live-integrated orbit around the central mass — circular, precessing, or plunging depending on energy and angular momentum."
      />
      <div className="mt-3 grid grid-cols-1 gap-2 font-mono text-xs text-[var(--color-fg-2)] sm:grid-cols-2">
        <label className="flex items-center gap-2">
          <span className="w-28 shrink-0">ℓ = {ell.toFixed(2)}</span>
          <input
            type="range"
            min={1.5}
            max={5}
            step={0.01}
            value={ell}
            onChange={(e) => setEll(parseFloat(e.target.value))}
            className="flex-1"
            style={{ accentColor: "var(--color-cyan)" }}
          />
        </label>
        <label className="flex items-center gap-2">
          <span className="w-28 shrink-0">E² = {E2.toFixed(3)}</span>
          <input
            type="range"
            min={0.85}
            max={1.02}
            step={0.001}
            value={E2}
            onChange={(e) => setE2(parseFloat(e.target.value))}
            className="flex-1"
            style={{ accentColor: "var(--color-magenta)" }}
          />
        </label>
      </div>
      <p className="mt-2 font-mono text-[11px] text-[var(--color-fg-1)]">
        {classLabel}
        <span className="ml-2 text-[var(--color-fg-3)]">
          (ℓ &lt; √3 ≈ 1.73 removes the barrier — everything plunges)
        </span>
      </p>
    </div>
  );
}

function draw(
  ctx: CanvasRenderingContext2D,
  tokens: SceneTokens,
  ell: number,
  E2: number,
  orbit: OrbitState,
  t: number,
  W: number,
  H: number,
) {
  ctx.fillStyle = tokens.bg;
  ctx.fillRect(0, 0, W, H);

  const gap = 14;
  const leftW = (W - PAD * 2 - gap) * 0.52;
  const rightW = W - PAD * 2 - gap - leftW;
  const leftX0 = PAD;
  const rightX0 = PAD + leftW + gap;

  drawPotential(ctx, tokens, ell, E2, orbit, leftX0, PAD, leftW, H);
  drawOrbit(ctx, tokens, orbit, t, rightX0, PAD, rightW, H);
}

function drawPotential(
  ctx: CanvasRenderingContext2D,
  tokens: SceneTokens,
  ell: number,
  E2: number,
  orbit: OrbitState,
  x0: number,
  y0: number,
  w: number,
  H: number,
) {
  const plotX0 = x0 + 30;
  const plotY0 = y0 + 22;
  const plotW = w - 34;
  const plotH = H - plotY0 - 24;
  const vMin = 0.85;
  const vMax = 1.08;

  drawSectionTitle(ctx, x0, y0, "EFFECTIVE POTENTIAL V_eff(r)", tokens.textMute);

  const toPx = (x: number) =>
    plotX0 + ((x - X_MIN) / (X_MAX - X_MIN)) * plotW;
  const toPy = (v: number) =>
    plotY0 + plotH - ((v - vMin) / (vMax - vMin)) * plotH;

  // axes
  ctx.strokeStyle = tokens.axes;
  ctx.lineWidth = 1.1;
  ctx.beginPath();
  ctx.moveTo(plotX0, plotY0);
  ctx.lineTo(plotX0, plotY0 + plotH);
  ctx.lineTo(plotX0 + plotW, plotY0 + plotH);
  ctx.stroke();

  // Newtonian potential for contrast: V_N = 1 − 1/x + ℓ²/(2x²) (shifted)
  ctx.strokeStyle = hexToRgba(tokens.textFaint, 0.9);
  ctx.lineWidth = 1.2;
  ctx.setLineDash([3, 3]);
  ctx.beginPath();
  for (let i = 0; i <= 300; i++) {
    const x = X_MIN + (i / 300) * (X_MAX - X_MIN);
    const vN = 1 - 1 / x + (ell * ell) / (2 * x * x);
    const py = toPy(vN);
    if (i === 0) ctx.moveTo(toPx(x), py);
    else ctx.lineTo(toPx(x), py);
  }
  ctx.stroke();
  ctx.setLineDash([]);

  // GR effective potential
  ctx.strokeStyle = tokens.cyan;
  ctx.lineWidth = 2;
  ctx.beginPath();
  for (let i = 0; i <= 360; i++) {
    const x = X_MIN + (i / 360) * (X_MAX - X_MIN);
    const py = toPy(effectivePotential(x, ell));
    if (i === 0) ctx.moveTo(toPx(x), py);
    else ctx.lineTo(toPx(x), py);
  }
  ctx.stroke();

  // energy line E²
  ctx.strokeStyle = tokens.magenta;
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  ctx.moveTo(plotX0, toPy(E2));
  ctx.lineTo(plotX0 + plotW, toPy(E2));
  ctx.stroke();
  ctx.fillStyle = tokens.magenta;
  ctx.font = FONT_HUD_SMALL;
  ctx.textAlign = "left";
  ctx.textBaseline = "bottom";
  ctx.fillText(`E² = ${E2.toFixed(3)}`, plotX0 + 4, toPy(E2) - 2);

  // circular-orbit markers
  const orbits = circularOrbitRadii(ell);
  if (orbits) {
    for (const [r, color, tag] of [
      [orbits.stable, tokens.mint, "stable"],
      [orbits.unstable, tokens.red, "barrier"],
    ] as [number, string, string][]) {
      if (r < X_MIN || r > X_MAX) continue;
      const px = toPx(r);
      const py = toPy(effectivePotential(r, ell));
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(px, py, 3.2, 0, Math.PI * 2);
      ctx.fill();
      ctx.font = FONT_HUD_SMALL;
      ctx.textAlign = "center";
      ctx.textBaseline = "bottom";
      ctx.fillText(tag, px, py - 5);
    }
  } else {
    ctx.fillStyle = hexToRgba(tokens.red, 0.9);
    ctx.font = FONT_HUD_SMALL;
    ctx.textAlign = "center";
    ctx.textBaseline = "top";
    ctx.fillText("no barrier (ℓ < √3)", plotX0 + plotW / 2, plotY0 + 4);
  }

  // x ticks
  ctx.fillStyle = tokens.textMute;
  ctx.font = FONT_HUD_SMALL;
  ctx.textAlign = "center";
  ctx.textBaseline = "top";
  for (const gx of [2, 4, 6, 8, 10]) {
    ctx.fillText(`${gx}`, toPx(gx), plotY0 + plotH + 3);
  }
  ctx.fillText("r / r_s", plotX0 + plotW - 4, plotY0 + plotH + 3);
}

function drawOrbit(
  ctx: CanvasRenderingContext2D,
  tokens: SceneTokens,
  orbit: OrbitState,
  t: number,
  x0: number,
  y0: number,
  w: number,
  H: number,
) {
  drawSectionTitle(ctx, x0, y0, "ORBIT IN THE PLANE", tokens.textMute);

  const cx = x0 + w / 2;
  const cy = y0 + 22 + (H - y0 - 22) / 2;
  const plotH = H - y0 - 22;
  // scale to fit path
  let rmax = 6;
  for (const p of orbit.path) rmax = Math.max(rmax, Math.hypot(p.x, p.y));
  rmax = Math.min(rmax, 30);
  const scale = (Math.min(w, plotH) * 0.46) / rmax;

  // horizon disk (r = 1)
  ctx.fillStyle = hexToRgba(tokens.red, 0.9);
  ctx.beginPath();
  ctx.arc(cx, cy, Math.max(3, 1 * scale), 0, Math.PI * 2);
  ctx.fill();
  // photon sphere ring r = 1.5
  ctx.strokeStyle = hexToRgba(tokens.amber, 0.4);
  ctx.lineWidth = 1;
  ctx.setLineDash([2, 3]);
  ctx.beginPath();
  ctx.arc(cx, cy, 1.5 * scale, 0, Math.PI * 2);
  ctx.stroke();
  // ISCO ring r = 3
  ctx.strokeStyle = hexToRgba(tokens.mint, 0.35);
  ctx.beginPath();
  ctx.arc(cx, cy, 3 * scale, 0, Math.PI * 2);
  ctx.stroke();
  ctx.setLineDash([]);

  // orbit path
  const col =
    orbit.cls === "plunge"
      ? tokens.red
      : orbit.cls === "scatter"
        ? tokens.amber
        : orbit.cls === "circular"
          ? tokens.mint
          : tokens.cyan;
  ctx.strokeStyle = col;
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  orbit.path.forEach((p, i) => {
    const px = cx + p.x * scale;
    const py = cy - p.y * scale;
    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  });
  ctx.stroke();

  // moving body marker
  if (orbit.path.length > 1) {
    const idx =
      Math.floor((t * 30) % orbit.path.length) || 0;
    const p = orbit.path[Math.min(idx, orbit.path.length - 1)];
    ctx.fillStyle = tokens.textBright;
    ctx.beginPath();
    ctx.arc(cx + p.x * scale, cy - p.y * scale, 3.5, 0, Math.PI * 2);
    ctx.fill();
  }
}
