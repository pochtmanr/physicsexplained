"use client";

import { useEffect, useMemo, useRef, useState } from "react";
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
  integrateExpansion,
  focalParameterBound,
  type CongruenceKind,
} from "@/lib/physics/relativity/singularity-theorems";
import { Button } from "@/components/ui/button";

/**
 * FIG.59a — Geodesic focusing (the Raychaudhuri engine).
 *
 * LEFT: a bundle of initially-parallel timelike geodesics threading a region of
 *   positive curvature. As the focusing term R_{ab}k^a k^b bites, the worldlines
 *   bend toward each other and cross at a caustic — the focal point. The crossing
 *   abscissa tracks the closed-form bound λ ≤ n/|θ₀| (drawn as a marker).
 *
 * RIGHT: the expansion scalar θ(λ) plotted against affine parameter. It only
 *   ever decreases (every term in dθ/dλ is ≤ 0 once R_{ab}k^a k^b ≥ 0), and the
 *   θ² term makes it run away to −∞ in finite λ. The asymptote is the singular
 *   focusing the theorems exploit.
 *
 * Controls: initial expansion θ₀ (negative = already converging), the curvature
 *   focusing term R_{ab}k^a k^b, and an energy-condition toggle that flips the
 *   sign of curvature (exotic matter defocuses, and the bundle never crosses).
 */

const PAD = 16;
const N_RAYS = 11;
const LAMBDA_MAX = 12;
const STEPS = 1600;

export function GeodesicFocusingScene() {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const tokens = useSceneTokens();
  const [theta0, setTheta0] = useState(-0.35);
  const [ricci, setRicci] = useState(0.25);
  const [energyOK, setEnergyOK] = useState(true);

  const { width, height } = useSceneSize(containerRef, {
    ratio: 0.5,
    maxHeight: SCENE_HEIGHT_DEFAULT,
    minHeight: 320,
  });

  // Effective focusing term: energy condition violated → curvature defocuses.
  const effRicci = energyOK ? ricci : -ricci;
  const kind: CongruenceKind = "timelike";

  const traj = useMemo(
    () =>
      integrateExpansion({
        theta0,
        kind,
        ricci: effRicci,
        lambdaMax: LAMBDA_MAX,
        steps: STEPS,
        divergeAt: -40,
      }),
    [theta0, effRicci],
  );

  const focalLambda = traj[traj.length - 1]?.focused
    ? traj[traj.length - 1].lambda
    : null;
  const bound = focalParameterBound(theta0, kind);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = applyDpr(canvas, width, height);
    if (!ctx) return;
    draw(ctx, tokens, traj, focalLambda, bound, energyOK, width, height);
  }, [tokens, traj, focalLambda, bound, energyOK, width, height]);

  return (
    <div ref={containerRef} className="w-full pb-4">
      <canvas
        ref={canvasRef}
        style={{ width, height, display: "block" }}
        className={SCENE_CANVAS_CLASS}
        aria-label="A bundle of parallel geodesics focusing to a caustic, beside a plot of the Raychaudhuri expansion scalar theta diverging to minus infinity."
      />
      <div className="mt-3 flex flex-col gap-2 font-mono text-xs text-[var(--color-fg-2)]">
        <div className="flex items-center gap-3">
          <span className="w-44 shrink-0">θ₀ (initial expansion): {theta0.toFixed(2)}</span>
          <input
            type="range"
            min={-0.8}
            max={0.4}
            step={0.01}
            value={theta0}
            onChange={(e) => setTheta0(parseFloat(e.target.value))}
            className="flex-1"
            style={{ accentColor: "var(--color-cyan)" }}
          />
        </div>
        <div className="flex items-center gap-3">
          <span className="w-44 shrink-0">R₍ₐᵦ₎kᵃkᵇ (focusing): {ricci.toFixed(2)}</span>
          <input
            type="range"
            min={0}
            max={0.8}
            step={0.01}
            value={ricci}
            onChange={(e) => setRicci(parseFloat(e.target.value))}
            className="flex-1"
            style={{ accentColor: "var(--color-magenta)" }}
          />
        </div>
        <Button
          size="sm"
          active={energyOK}
          onClick={() => setEnergyOK((v) => !v)}
          className="self-start"
        >
          energy condition: {energyOK ? "HOLDS  →  curvature focuses" : "VIOLATED  →  curvature defocuses"}
        </Button>
      </div>
    </div>
  );
}

function draw(
  ctx: CanvasRenderingContext2D,
  tokens: SceneTokens,
  traj: { lambda: number; theta: number; focused: boolean }[],
  focalLambda: number | null,
  bound: number,
  energyOK: boolean,
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

  // ── LEFT: geodesic bundle ─────────────────────────────────────────────────
  ctx.strokeStyle = tokens.panelBorder;
  ctx.lineWidth = 1;
  ctx.strokeRect(leftX0, panelY0, panelW, panelH);
  drawSectionTitle(ctx, leftX0 + 4, panelY0 - 16, "GEODESIC BUNDLE", tokens.textMute);

  // map affine parameter λ → x; transverse separation → y
  const innerX0 = leftX0 + 10;
  const innerX1 = leftX0 + panelW - 10;
  const cy = panelY0 + panelH / 2;
  const spread = panelH * 0.34;
  const lamToX = (lam: number) =>
    innerX0 + (lam / LAMBDA_MAX) * (innerX1 - innerX0);

  // Cross-sectional "radius" r(λ): r grows like exp(∫θ/n dλ). We reconstruct it
  // from the sampled θ so the rays visibly pinch where θ → −∞.
  const n = 3;
  const radii: { lambda: number; r: number }[] = [];
  let logR = 0;
  for (let i = 0; i < traj.length; i++) {
    if (i > 0) {
      const dl = traj[i].lambda - traj[i - 1].lambda;
      const th = Math.max(traj[i].theta, -40);
      logR += (th / n) * dl;
    }
    radii.push({ lambda: traj[i].lambda, r: Math.exp(logR) });
  }
  const r0 = radii[0].r || 1;

  // Curvature shading (where focusing acts)
  if (energyOK) {
    const grad = ctx.createLinearGradient(innerX0, 0, innerX1, 0);
    grad.addColorStop(0, hexToRgba(tokens.magenta, 0));
    grad.addColorStop(0.5, hexToRgba(tokens.magenta, 0.1));
    grad.addColorStop(1, hexToRgba(tokens.magenta, 0));
    ctx.fillStyle = grad;
    ctx.fillRect(innerX0, panelY0 + 6, innerX1 - innerX0, panelH - 12);
  }

  // Draw each geodesic
  for (let k = 0; k < N_RAYS; k++) {
    const frac = (k / (N_RAYS - 1)) * 2 - 1; // −1..1
    ctx.beginPath();
    for (let i = 0; i < radii.length; i++) {
      const x = lamToX(radii[i].lambda);
      const rr = radii[i].r / r0;
      const y = cy + frac * spread * rr;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.strokeStyle = hexToRgba(tokens.cyan, 0.7);
    ctx.lineWidth = 1.2;
    ctx.stroke();
  }

  // Focal point marker
  if (focalLambda != null) {
    const fx = lamToX(focalLambda);
    ctx.strokeStyle = hexToRgba(tokens.red, 0.9);
    ctx.lineWidth = 1;
    ctx.setLineDash([3, 3]);
    ctx.beginPath();
    ctx.moveTo(fx, panelY0 + 6);
    ctx.lineTo(fx, panelY0 + panelH - 6);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = tokens.red;
    ctx.beginPath();
    ctx.arc(fx, cy, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.font = FONT_HUD_SMALL;
    ctx.fillStyle = tokens.red;
    ctx.textAlign = "center";
    ctx.fillText("caustic", fx, panelY0 + panelH - 16);
    ctx.textAlign = "left";
  } else {
    ctx.font = FONT_HUD_SMALL;
    ctx.fillStyle = energyOK ? tokens.textMute : tokens.mint;
    ctx.fillText(
      energyOK ? "no crossing in range" : "defocusing — never crosses",
      innerX0 + 4,
      panelY0 + panelH - 16,
    );
  }

  // ── RIGHT: θ(λ) plot ──────────────────────────────────────────────────────
  ctx.strokeStyle = tokens.panelBorder;
  ctx.lineWidth = 1;
  ctx.strokeRect(rightX0, panelY0, panelW, panelH);
  drawSectionTitle(ctx, rightX0 + 4, panelY0 - 16, "EXPANSION  θ(λ)", tokens.textMute);

  const pInnerX0 = rightX0 + 36;
  const pInnerX1 = rightX0 + panelW - 8;
  const pTop = panelY0 + 12;
  const pBot = panelY0 + panelH - 24;
  const thetaMax = 0.6;
  const thetaMin = -3;
  const pLamToX = (lam: number) =>
    pInnerX0 + (lam / LAMBDA_MAX) * (pInnerX1 - pInnerX0);
  const thToY = (th: number) => {
    const cl = Math.max(thetaMin, Math.min(thetaMax, th));
    return pTop + ((thetaMax - cl) / (thetaMax - thetaMin)) * (pBot - pTop);
  };

  // axes
  ctx.strokeStyle = tokens.grid;
  ctx.lineWidth = 1;
  // θ = 0 line
  ctx.beginPath();
  ctx.moveTo(pInnerX0, thToY(0));
  ctx.lineTo(pInnerX1, thToY(0));
  ctx.stroke();
  ctx.fillStyle = tokens.textFaint;
  ctx.font = FONT_HUD_SMALL;
  ctx.textAlign = "right";
  ctx.fillText("0", pInnerX0 - 4, thToY(0) + 3);
  ctx.fillText("−3", pInnerX0 - 4, pBot + 3);
  ctx.textAlign = "left";

  // θ curve
  ctx.beginPath();
  let started = false;
  for (const s of traj) {
    if (s.focused) break;
    const x = pLamToX(s.lambda);
    const y = thToY(s.theta);
    if (!started) {
      ctx.moveTo(x, y);
      started = true;
    } else ctx.lineTo(x, y);
  }
  ctx.strokeStyle = energyOK ? tokens.amber : tokens.mint;
  ctx.lineWidth = 1.8;
  ctx.stroke();

  // asymptote at focal λ
  if (focalLambda != null) {
    const fx = pLamToX(focalLambda);
    ctx.strokeStyle = hexToRgba(tokens.red, 0.85);
    ctx.setLineDash([3, 3]);
    ctx.beginPath();
    ctx.moveTo(fx, pTop);
    ctx.lineTo(fx, pBot);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = tokens.red;
    ctx.font = FONT_HUD_SMALL;
    ctx.textAlign = "center";
    ctx.fillText("θ → −∞", fx, pTop + 10);
    ctx.textAlign = "left";
  }

  // λ axis label
  ctx.fillStyle = tokens.textFaint;
  ctx.font = FONT_HUD_SMALL;
  ctx.fillText("affine parameter λ →", pInnerX0, pBot + 14);

  // ── HUD readouts ──────────────────────────────────────────────────────────
  let hy = panelY0 + 6;
  hy = drawHudReadout(
    ctx,
    leftX0 + 6,
    hy,
    "bound n/|θ₀| = ",
    Number.isFinite(bound) ? bound.toFixed(2) : "∞",
    tokens.textDim,
    tokens.cyan,
  );
  drawHudReadout(
    ctx,
    leftX0 + 6,
    hy,
    "λ_caustic = ",
    focalLambda != null ? focalLambda.toFixed(2) : "—",
    tokens.textDim,
    tokens.red,
  );
}
