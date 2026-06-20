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
  useSceneTick,
  useSceneTokens,
  type SceneTokens,
} from "@/components/physics/_shared/scene-tokens";
import {
  ringdownFrequencyDimensionless,
  ringdownDampingTimeDimensionless,
  ringdownWaveform,
} from "@/lib/physics/relativity/no-hair-theorem";

/**
 * FIG.47a — Collapse and ringdown: how a black hole loses its hair.
 *
 * A lumpy collapsing star (left) is dressed with higher multipole "bumps"
 * (a quadrupole + an octupole deformation the user can dial up). On PLAY the
 * star collapses inside its horizon; the bumps cannot be supported, so they
 * radiate away as a damped sinusoid — the dominant ℓ=m=2 quasinormal mode of
 * the final Kerr hole. The waveform strip (right) plots h(t) = A₀ e^{−t/τ}
 * cos(ω_R t); the star morphs from lumpy to a smooth circle as the strain
 * dies. The spin slider sets ω_R and τ via the Berti–Cardoso–Will fit.
 *
 * Tokens only; responsive; ref-based ticker for the animation.
 */

const PAD = 16;
const COLLAPSE_DUR = 1.6; // seconds of wall-clock for the collapse phase
const RING_DUR = 4.0; // seconds for the visible ringdown

export function CollapseRingdownScene() {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const tokens = useSceneTokens();
  const tickRef = useSceneTick(true);
  const startRef = useRef<number>(0);
  const [playing, setPlaying] = useState(true);
  const [aStar, setAStar] = useState(0.6);
  const [lumpiness, setLumpiness] = useState(0.7);
  const { width, height } = useSceneSize(containerRef, {
    ratio: 0.5,
    maxHeight: SCENE_HEIGHT_DEFAULT,
    minHeight: 300,
  });

  // Reset the animation clock whenever we (re)start or retune.
  useEffect(() => {
    startRef.current = tickRef.current;
  }, [playing, aStar, lumpiness, tickRef]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = applyDpr(canvas, width, height);
    if (!ctx) return;

    let raf = 0;
    const loop = () => {
      const elapsed = playing
        ? (tickRef.current - startRef.current) / 1000
        : 0;
      draw(ctx, tokens, width, height, aStar, lumpiness, elapsed);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [tokens, width, height, aStar, lumpiness, playing, tickRef]);

  const omegaR = ringdownFrequencyDimensionless(aStar);
  const tau = ringdownDampingTimeDimensionless(aStar);

  return (
    <div ref={containerRef} className="relative w-full pb-4">
      <canvas
        ref={canvasRef}
        style={{ width, height, display: "block" }}
        className={SCENE_CANVAS_CLASS}
        aria-label="A lumpy collapsing star sheds its higher multipole moments as a damped gravitational wave (ringdown) and settles into a smooth Kerr black hole. Sliders control the spin and the initial lumpiness; a waveform strip shows the decaying quasinormal-mode signal."
      />

      <div className="mt-3 flex flex-wrap items-center gap-3 font-mono text-xs text-[var(--color-fg-2)]">
        <button
          type="button"
          onClick={() => setPlaying((p) => !p)}
          className="rounded-sm border border-[var(--color-fg-4)] px-3 py-1 text-[var(--color-fg-2)] hover:border-[var(--color-cyan)] hover:text-[var(--color-cyan)]"
        >
          {playing ? "❚❚ pause" : "▶ replay"}
        </button>
        <span className="font-mono text-[var(--color-fg-3)]">
          M ω_R = {omegaR.toFixed(3)} · τ = {tau.toFixed(1)} M
        </span>
      </div>

      <div className="mt-2 flex items-center gap-3 font-mono text-xs text-[var(--color-fg-2)]">
        <span className="w-40 shrink-0">spin a* = {aStar.toFixed(2)}</span>
        <input
          type="range"
          min={0}
          max={0.99}
          step={0.01}
          value={aStar}
          onChange={(e) => setAStar(parseFloat(e.target.value))}
          className="flex-1"
          style={{ accentColor: "var(--color-cyan)" }}
        />
      </div>
      <div className="mt-1 flex items-center gap-3 font-mono text-xs text-[var(--color-fg-2)]">
        <span className="w-40 shrink-0">
          lumpiness = {(lumpiness * 100).toFixed(0)}%
        </span>
        <input
          type="range"
          min={0}
          max={1}
          step={0.01}
          value={lumpiness}
          onChange={(e) => setLumpiness(parseFloat(e.target.value))}
          className="flex-1"
          style={{ accentColor: "var(--color-magenta)" }}
        />
      </div>
    </div>
  );
}

function draw(
  ctx: CanvasRenderingContext2D,
  tokens: SceneTokens,
  W: number,
  H: number,
  aStar: number,
  lumpiness: number,
  elapsed: number,
) {
  ctx.fillStyle = tokens.bg;
  ctx.fillRect(0, 0, W, H);

  // Phase 0..1 of collapse, then 0..1 of ringdown.
  const total = COLLAPSE_DUR + RING_DUR;
  const t = elapsed % (total + 0.6); // small pause at the loop seam
  const collapsing = t < COLLAPSE_DUR;
  const collapseP = Math.min(1, t / COLLAPSE_DUR);
  const ringT = Math.max(0, t - COLLAPSE_DUR); // seconds into ringdown
  const ringP = Math.min(1, ringT / RING_DUR);

  // Layout: left = star, right = waveform strip.
  const leftX0 = PAD;
  const panelY0 = PAD + 22;
  const panelH = H - PAD * 2 - 22;
  const leftW = Math.min(W * 0.46, 300);
  const rightX0 = leftX0 + leftW + 24;
  const rightW = W - PAD - rightX0;

  // ── LEFT: the star ────────────────────────────────────────────────────────
  drawSectionTitle(ctx, leftX0, panelY0 - 18, "COLLAPSE", tokens.textMute);

  const cx = leftX0 + leftW / 2;
  const cy = panelY0 + panelH / 2;
  const baseR = Math.min(leftW, panelH) * 0.32;

  // Ringdown waveform in geometrized units → map seconds to "M" time.
  const omegaR = ringdownFrequencyDimensionless(aStar);
  const tau = ringdownDampingTimeDimensionless(aStar);
  // Scale physical seconds of ringdown to a few damping times of M-time.
  const M_TIME_SPAN = 6 * tau; // show ~6 e-foldings
  const ringMTime = ringP * M_TIME_SPAN;
  const strain = collapsing
    ? 0
    : ringdownWaveform(ringMTime, omegaR, tau, 1, 0);
  const envelope = collapsing ? 1 : Math.exp(-ringMTime / tau);

  // How much "hair" is still present: full during collapse, then decays.
  const hairAmp = collapsing
    ? lumpiness * (0.4 + 0.6 * collapseP) // bumps grow as it compresses
    : lumpiness * envelope * Math.abs(Math.cos(omegaR * ringMTime)) * 0.9;

  // Horizon (final smooth circle).
  const horizonR = baseR * (collapsing ? 1.15 - 0.25 * collapseP : 0.9);
  ctx.beginPath();
  ctx.arc(cx, cy, horizonR + 6, 0, Math.PI * 2);
  ctx.strokeStyle = hexToRgba(tokens.amber, 0.5);
  ctx.setLineDash([4, 4]);
  ctx.lineWidth = 1;
  ctx.stroke();
  ctx.setLineDash([]);

  // The star body: a closed wobbly blob = circle + ℓ=2 + ℓ=3 multipole bumps.
  const N = 120;
  ctx.beginPath();
  for (let i = 0; i <= N; i++) {
    const ang = (i / N) * Math.PI * 2;
    const quad = Math.cos(2 * (ang + 0.3)); // ℓ=2 deformation
    const oct = 0.5 * Math.cos(3 * (ang - 0.6)); // ℓ=3 deformation
    const bump = hairAmp * baseR * 0.45 * (quad + oct);
    const wobble =
      collapsing || ringP > 0.99
        ? 0
        : 0.04 * baseR * Math.sin(omegaR * ringMTime + ang * 2) * envelope;
    const r = horizonR + bump + wobble;
    const px = cx + r * Math.cos(ang);
    const py = cy + r * Math.sin(ang);
    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.closePath();

  // Fill: dark interior → glowing edge that cools as it becomes a bald hole.
  const bodyGrad = ctx.createRadialGradient(cx, cy, horizonR * 0.2, cx, cy, horizonR);
  const heat = collapsing ? 0.4 + 0.6 * collapseP : envelope;
  bodyGrad.addColorStop(0, hexToRgba(tokens.bg, 0.96));
  bodyGrad.addColorStop(0.7, hexToRgba(tokens.bg1, 0.9));
  bodyGrad.addColorStop(1, hexToRgba(tokens.magenta, 0.25 + 0.55 * heat));
  ctx.fillStyle = bodyGrad;
  ctx.fill();
  ctx.lineWidth = 1.5;
  ctx.strokeStyle = hexToRgba(
    hairAmp > 0.02 ? tokens.magenta : tokens.cyan,
    0.85,
  );
  ctx.stroke();

  // Radiating ripples during ringdown (the hair leaving as waves).
  if (!collapsing && ringP < 1) {
    for (let k = 0; k < 4; k++) {
      const rr = horizonR + 14 + k * 26 + ringP * 70;
      const a = Math.max(0, 0.4 * envelope * (1 - k / 4) * (1 - ringP));
      ctx.beginPath();
      ctx.arc(cx, cy, rr, 0, Math.PI * 2);
      ctx.strokeStyle = hexToRgba(tokens.cyan, a);
      ctx.lineWidth = 1;
      ctx.stroke();
    }
  }

  // State label.
  ctx.font = FONT_HUD_SMALL;
  ctx.textAlign = "center";
  ctx.textBaseline = "top";
  ctx.fillStyle = tokens.textMute;
  const label = collapsing
    ? "collapsing — hair still present"
    : ringP < 0.98
      ? "ringdown — radiating the hair away"
      : "Kerr black hole — bald (M, J only)";
  ctx.fillText(label, cx, panelY0 + panelH - 16);
  ctx.textAlign = "left";

  // ── RIGHT: waveform strip ─────────────────────────────────────────────────
  drawSectionTitle(ctx, rightX0, panelY0 - 18, "STRAIN  h(t)", tokens.textMute);

  const wx0 = rightX0;
  const wy0 = panelY0 + 10;
  const wW = rightW;
  const wH = panelH - 40;
  const midY = wy0 + wH / 2;

  // Frame + zero axis.
  ctx.strokeStyle = tokens.panelBorder;
  ctx.lineWidth = 1;
  ctx.strokeRect(wx0, wy0, wW, wH);
  ctx.strokeStyle = hexToRgba(tokens.gridHeavy, 0.6);
  ctx.beginPath();
  ctx.moveTo(wx0, midY);
  ctx.lineTo(wx0 + wW, midY);
  ctx.stroke();

  // Full envelope (dashed) + waveform up to the current time.
  const samples = 200;
  ctx.beginPath();
  ctx.setLineDash([3, 3]);
  ctx.strokeStyle = hexToRgba(tokens.amber, 0.5);
  for (let i = 0; i <= samples; i++) {
    const mt = (i / samples) * M_TIME_SPAN;
    const env = Math.exp(-mt / tau);
    const px = wx0 + (i / samples) * wW;
    const py = midY - env * (wH * 0.42);
    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.stroke();
  ctx.setLineDash([]);

  const progressFrac = collapsing ? 0 : ringP;
  ctx.beginPath();
  ctx.strokeStyle = tokens.cyan;
  ctx.lineWidth = 1.6;
  for (let i = 0; i <= samples; i++) {
    const frac = i / samples;
    if (frac > progressFrac) break;
    const mt = frac * M_TIME_SPAN;
    const h = ringdownWaveform(mt, omegaR, tau, 1, 0);
    const px = wx0 + frac * wW;
    const py = midY - h * (wH * 0.42);
    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.stroke();

  // Moving cursor dot.
  if (!collapsing) {
    const px = wx0 + progressFrac * wW;
    const py = midY - strain * (wH * 0.42);
    ctx.beginPath();
    ctx.arc(px, py, 3, 0, Math.PI * 2);
    ctx.fillStyle = tokens.cyan;
    ctx.fill();
  }

  // HUD.
  drawHudReadout(
    ctx,
    wx0 + 6,
    wy0 + 6,
    "h ≈ ",
    strain.toFixed(3),
    tokens.textDim,
    tokens.cyan,
  );
}
