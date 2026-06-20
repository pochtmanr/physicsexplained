"use client";

import { useEffect, useRef, useState } from "react";
import {
  FONT_HUD_SMALL,
  SCENE_CANVAS_CLASS,
  SCENE_HEIGHT_DEFAULT,
  applyDpr,
  hexToRgba,
  drawHudReadout,
  drawSectionTitle,
  useSceneSize,
  useSceneTokens,
  type SceneTokens,
} from "@/components/physics/_shared/scene-tokens";
import {
  outerHorizonRadius,
  innerHorizonRadius,
  ergosphereRadius,
  ergosphereThickness,
  horizonAngularVelocity,
} from "@/lib/physics/relativity/kerr-and-the-ergosphere";

/**
 * FIG.45a — Horizon + ergosphere cross-section vs spin.
 *
 * Poloidal (r, θ) cross-section through the spin axis. The spin axis is
 * vertical. Two nested surfaces are drawn in units of M and scaled to the
 * canvas:
 *
 *   • the outer EVENT HORIZON r_+(a*) — a near-circle that shrinks from 2M
 *     (a* = 0) to M (a* = 1) — drawn in CYAN.
 *   • the STATIC LIMIT / ERGOSURFACE r_E(θ, a*) — an oblate surface pinned to
 *     the horizon at the poles and bulging to 2M at the equator — drawn in
 *     AMBER; the shell between the two is the ERGOSPHERE (filled magenta-ish).
 *
 * A spin slider 0 → 0.998 morphs both surfaces. The inner (Cauchy) horizon is
 * drawn faintly for context. HUD shows r_+, equatorial ergosphere thickness,
 * and Ω_H.
 */

const PAD = 18;
const SPIN_MAX = 0.998;

export function HorizonErgosphereCrossSectionScene() {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const tokens = useSceneTokens();
  const [aStar, setAStar] = useState(0.7);
  const { width, height } = useSceneSize(containerRef, {
    ratio: 0.62,
    maxHeight: SCENE_HEIGHT_DEFAULT,
    minHeight: 320,
  });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = applyDpr(canvas, width, height);
    if (!ctx) return;
    draw(ctx, tokens, aStar, width, height);
  }, [tokens, aStar, width, height]);

  const rPlus = outerHorizonRadius(aStar);
  const thickness = ergosphereThickness(aStar);
  const omegaH = horizonAngularVelocity(aStar);

  const presets: { label: string; value: number }[] = [
    { label: "0 (Schwarzschild)", value: 0 },
    { label: "0.5", value: 0.5 },
    { label: "0.9", value: 0.9 },
    { label: "0.998 (Thorne limit)", value: SPIN_MAX },
  ];

  return (
    <div ref={containerRef} className="relative w-full pb-4">
      <canvas
        ref={canvasRef}
        style={{ width, height, display: "block" }}
        className={SCENE_CANVAS_CLASS}
        aria-label="Poloidal cross-section of a Kerr black hole. The cyan circle is the event horizon, the amber oblate curve is the static limit, and the shell between them is the ergosphere. A spin slider morphs both surfaces from a non-rotating hole to near-extremal spin."
      />
      <div className="mt-3 flex items-center gap-3 font-mono text-xs text-[var(--color-fg-2)]">
        <span className="w-40 shrink-0">a* = {aStar.toFixed(3)} (J/M)</span>
        <input
          type="range"
          min={0}
          max={SPIN_MAX}
          step={0.002}
          value={aStar}
          onChange={(e) => setAStar(parseFloat(e.target.value))}
          className="flex-1"
          style={{ accentColor: "var(--color-cyan)" }}
        />
      </div>
      <div className="mt-1 flex flex-wrap gap-x-5 gap-y-1 font-mono text-xs text-[var(--color-fg-3)]">
        {presets.map((p) => (
          <button
            key={p.label}
            type="button"
            className="cursor-pointer hover:text-[var(--color-fg-1)]"
            onClick={() => setAStar(p.value)}
          >
            {p.label}
          </button>
        ))}
      </div>
      <p className="mt-2 font-mono text-xs text-[var(--color-fg-3)]">
        r₊ = {rPlus.toFixed(3)} M · ergosphere depth (equator) ={" "}
        {thickness.toFixed(3)} M · Ω_H = {omegaH.toFixed(3)} c³/GM
      </p>
    </div>
  );
}

function draw(
  ctx: CanvasRenderingContext2D,
  tokens: SceneTokens,
  aStar: number,
  W: number,
  H: number,
) {
  ctx.fillStyle = tokens.bg;
  ctx.fillRect(0, 0, W, H);

  drawSectionTitle(ctx, PAD, PAD, "KERR CROSS-SECTION  (r, θ)", tokens.textMute);

  const cx = W / 2;
  const cy = H / 2 + 8;
  // World extent: ±2.4 M fits the equatorial static limit (2M) with margin.
  const extent = 2.4;
  const usableH = H - PAD * 2 - 24;
  const usableW = W - PAD * 2;
  const scale = Math.min(usableW, usableH) / (2 * extent);

  // ── spin axis ───────────────────────────────────────────────────────────
  ctx.strokeStyle = tokens.grid;
  ctx.lineWidth = 1;
  ctx.setLineDash([4, 4]);
  ctx.beginPath();
  ctx.moveTo(cx, cy - extent * scale);
  ctx.lineTo(cx, cy + extent * scale);
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.fillStyle = tokens.textFaint;
  ctx.font = FONT_HUD_SMALL;
  ctx.textAlign = "center";
  ctx.textBaseline = "bottom";
  ctx.fillText("spin axis", cx, cy - extent * scale - 2);
  ctx.textBaseline = "top";
  ctx.textAlign = "left";

  const rPlus = outerHorizonRadius(aStar);
  const rMinus = innerHorizonRadius(aStar);

  // helper: build a closed poloidal curve r(θ) sampled over θ ∈ [0, 2π]
  const buildCurve = (rOf: (theta: number) => number) => {
    const pts: [number, number][] = [];
    const N = 220;
    for (let i = 0; i <= N; i++) {
      // θ measured from the +spin axis (up). Sweep the full poloidal loop.
      const phi = (i / N) * Math.PI * 2;
      // map sweep angle to polar angle θ symmetric about the axis
      const theta = phi <= Math.PI ? phi : Math.PI * 2 - phi;
      const r = rOf(theta);
      // vertical = cos(theta) up; horizontal = sin(theta) with sign from phi
      const sign = phi <= Math.PI ? 1 : -1;
      const x = cx + sign * r * Math.sin(theta) * scale;
      const y = cy - r * Math.cos(theta) * scale;
      pts.push([x, y]);
    }
    return pts;
  };

  const traceFill = (pts: [number, number][], fill: string) => {
    ctx.beginPath();
    pts.forEach(([x, y], i) => (i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y)));
    ctx.closePath();
    ctx.fillStyle = fill;
    ctx.fill();
  };
  const traceStroke = (pts: [number, number][], color: string, w = 2) => {
    ctx.beginPath();
    pts.forEach(([x, y], i) => (i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y)));
    ctx.closePath();
    ctx.strokeStyle = color;
    ctx.lineWidth = w;
    ctx.stroke();
  };

  const ergoPts = buildCurve((th) => ergosphereRadius(aStar, th));
  const horizonPts = buildCurve(() => rPlus);
  const innerPts = buildCurve(() => rMinus);

  // ── ergosphere shell: fill the ergosurface, then knock out the horizon ───
  traceFill(ergoPts, hexToRgba(tokens.magenta, 0.16));
  // knock-out the horizon disk by painting it with the bg
  traceFill(horizonPts, tokens.bg);

  // ── outer ergosurface (static limit) ────────────────────────────────────
  traceStroke(ergoPts, tokens.amber, 2);

  // ── event horizon ───────────────────────────────────────────────────────
  traceFill(horizonPts, hexToRgba(tokens.cyan, 0.10));
  traceStroke(horizonPts, tokens.cyan, 2);

  // ── inner (Cauchy) horizon, faint ───────────────────────────────────────
  if (rMinus > 0.01) {
    traceStroke(innerPts, hexToRgba(tokens.textFaint, 0.8), 1);
  }

  // central singularity ring (a ring of radius a in the equatorial plane,
  // seen edge-on as two dots at ±a on the equator)
  ctx.fillStyle = tokens.red;
  const ringX = aStar * scale;
  ctx.beginPath();
  ctx.arc(cx + ringX, cy, 2.5, 0, Math.PI * 2);
  ctx.arc(cx - ringX, cy, 2.5, 0, Math.PI * 2);
  ctx.fill();

  // ── labels ──────────────────────────────────────────────────────────────
  ctx.font = FONT_HUD_SMALL;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  // ergosphere label on the equatorial bulge (right side)
  ctx.fillStyle = tokens.amber;
  ctx.fillText("static limit", cx + 2.0 * scale + 4, cy - 8 * 1);
  ctx.fillStyle = tokens.cyan;
  ctx.fillText("horizon r₊", cx, cy - rPlus * scale - 10);
  ctx.fillStyle = hexToRgba(tokens.magenta, 0.9);
  ctx.fillText("ergosphere", cx + (rPlus + 0.55) * scale * 0.0 + 1.55 * scale, cy + 0.0);

  // ── HUD ─────────────────────────────────────────────────────────────────
  ctx.textAlign = "left";
  ctx.textBaseline = "top";
  let hy = PAD + 18;
  hy = drawHudReadout(
    ctx,
    PAD,
    hy,
    "r₊ = ",
    `${rPlus.toFixed(3)} M`,
    tokens.textDim,
    tokens.cyan,
  );
  hy = drawHudReadout(
    ctx,
    PAD,
    hy,
    "r_E(π/2) = ",
    `${ergosphereRadius(aStar, Math.PI / 2).toFixed(3)} M`,
    tokens.textDim,
    tokens.amber,
  );
  drawHudReadout(
    ctx,
    PAD,
    hy,
    "Ω_H = ",
    `${horizonAngularVelocity(aStar).toFixed(3)}`,
    tokens.textDim,
    tokens.magenta,
  );
}
