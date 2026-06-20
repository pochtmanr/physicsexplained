"use client";

import { useEffect, useRef, useState } from "react";
import {
  FONT_HUD_SMALL,
  SCENE_CANVAS_CLASS,
  SCENE_HEIGHT_DEFAULT,
  applyDpr,
  drawHudReadout,
  hexToRgba,
  useSceneSize,
  useSceneTokens,
  type SceneTokens,
} from "@/components/physics/_shared/scene-tokens";

/**
 * FIG.49b — The evaporation movie.
 *
 * The horizon shrinks as M(t) = M0·(1 − t/τ)^{1/3}. We play this on a warped
 * clock: the visible "phase" φ ∈ [0,1] is the fraction of the lifetime elapsed,
 * but the on-screen mass follows the cube-root law so the dramatic, fast,
 * white-hot final sliver of the life is given room. As the hole shrinks its
 * temperature climbs (T ∝ 1/M), the glow brightens and reddens → whitens, the
 * Hawking flux thickens, and at φ → 1 it ends in a final flash. A progress bar
 * shows where we are on the warped lifetime clock; play / pause / restart.
 */

const PAD = 16;

function massFraction(phase: number): number {
  // M/M0 = (1 − φ)^{1/3}; phase is the elapsed fraction of the lifetime.
  return Math.cbrt(Math.max(0, 1 - phase));
}

// Map mass fraction → display temperature factor (T ∝ 1/M ⇒ ∝ 1/(M/M0)).
function tempFactor(massFrac: number): number {
  return 1 / Math.max(0.02, massFrac);
}

// Glow color ramps amber → orange → white as the hole heats.
function glowColor(heat: number, tokens: SceneTokens): string {
  // heat ∈ [0,1]
  if (heat < 0.5) return tokens.amber;
  if (heat < 0.85) return tokens.orange;
  return tokens.textBright;
}

export function EvaporationMovieScene() {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const tokens = useSceneTokens();
  const [playing, setPlaying] = useState(true);
  const phaseRef = useRef(0);
  const flashRef = useRef(0);
  const lastRef = useRef<number | null>(null);

  const { width, height } = useSceneSize(containerRef, {
    ratio: 0.55,
    maxHeight: SCENE_HEIGHT_DEFAULT,
    minHeight: 320,
  });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = applyDpr(canvas, width, height);
    if (!ctx) return;

    let raf = 0;
    const loop = (now: number) => {
      if (lastRef.current == null) lastRef.current = now;
      const dt = (now - lastRef.current) / 1000;
      lastRef.current = now;

      if (playing) {
        // Warped clock: slow at first, accelerating toward the flash.
        const speed = 0.05 + 0.55 * phaseRef.current * phaseRef.current;
        phaseRef.current += dt * speed;
        if (phaseRef.current >= 1) {
          phaseRef.current = 1;
          flashRef.current = 1; // trigger flash
        }
      }
      if (flashRef.current > 0) {
        flashRef.current = Math.max(0, flashRef.current - dt * 0.8);
        if (flashRef.current === 0 && phaseRef.current >= 1) {
          // restart the cycle after the flash fades
          phaseRef.current = 0;
        }
      }

      draw(ctx, tokens, phaseRef.current, flashRef.current, width, height);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => {
      cancelAnimationFrame(raf);
      lastRef.current = null;
    };
  }, [playing, tokens, width, height]);

  return (
    <div ref={containerRef} className="relative w-full pb-4">
      <canvas
        ref={canvasRef}
        style={{ width, height, display: "block" }}
        className={SCENE_CANVAS_CLASS}
        aria-label="Animation of a black hole evaporating: the horizon shrinks following M(t) = M0(1−t/τ)^(1/3), its glow brightens and whitens as the temperature rises, and it ends in a final flash before the cycle repeats."
      />
      <div className="mt-3 flex items-center gap-3 font-mono text-xs text-[var(--color-fg-2)]">
        <button
          type="button"
          onClick={() => setPlaying((p) => !p)}
          className="border px-3 py-1 border-[var(--color-cyan)] text-[var(--color-cyan)] cursor-pointer"
        >
          {playing ? "pause" : "play"}
        </button>
        <button
          type="button"
          onClick={() => {
            phaseRef.current = 0;
            flashRef.current = 0;
            lastRef.current = null;
          }}
          className="border px-3 py-1 border-[var(--color-fg-4)] text-[var(--color-fg-3)] cursor-pointer hover:text-[var(--color-fg-1)]"
        >
          restart
        </button>
        <span className="text-[var(--color-fg-3)]">
          warped lifetime clock — slow start, runaway finish
        </span>
      </div>
    </div>
  );
}

function draw(
  ctx: CanvasRenderingContext2D,
  tokens: SceneTokens,
  phase: number,
  flash: number,
  W: number,
  H: number,
) {
  ctx.fillStyle = tokens.bg;
  ctx.fillRect(0, 0, W, H);

  const cx = W / 2;
  const cy = (H - 36) / 2 + 8;

  const massFrac = massFraction(phase);
  const heat = Math.min(1, (tempFactor(massFrac) - 1) / 8); // 0..1 visual heat
  const maxR = Math.min(W, H) * 0.26;
  const r = Math.max(2, maxR * massFrac);
  const gColor = glowColor(heat, tokens);

  // ── radiated Hawking flux: dots streaming outward, denser as heat rises ──
  const flux = 0.15 + heat * 0.85;
  const nDots = Math.round(40 + flux * 140);
  ctx.save();
  for (let i = 0; i < nDots; i++) {
    // deterministic pseudo-random angle/phase from index
    const ang = (i * 2.39996) % (Math.PI * 2);
    const seed = (i * 9301 + 49297) % 233280;
    const frac = seed / 233280;
    const travel = ((frac + phase * 1.3) % 1);
    const rr = r + 6 + travel * (maxR * 1.7);
    const px = cx + Math.cos(ang) * rr;
    const py = cy + Math.sin(ang) * rr;
    const a = (1 - travel) * (0.25 + flux * 0.5);
    ctx.fillStyle = hexToRgba(gColor, a);
    const dotR = 1 + flux * 1.2;
    ctx.beginPath();
    ctx.arc(px, py, dotR, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();

  // ── glow halo ───────────────────────────────────────────────────────────
  const glowR = r + maxR * (0.4 + heat * 1.1);
  const grad = ctx.createRadialGradient(cx, cy, r * 0.6, cx, cy, glowR);
  grad.addColorStop(0, hexToRgba(gColor, 0.35 + heat * 0.5));
  grad.addColorStop(1, hexToRgba(gColor, 0));
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.arc(cx, cy, glowR, 0, Math.PI * 2);
  ctx.fill();

  // ── the hole itself: dark disk with a thin bright photon ring ───────────
  ctx.fillStyle = hexToRgba(tokens.bg, 1);
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = hexToRgba(gColor, 0.7 + heat * 0.3);
  ctx.lineWidth = 1.5 + heat * 2.5;
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.stroke();

  // ── final flash overlay ─────────────────────────────────────────────────
  if (flash > 0) {
    const fr = ctx.createRadialGradient(cx, cy, 0, cx, cy, Math.max(W, H) * 0.7);
    fr.addColorStop(0, hexToRgba(tokens.textBright, flash));
    fr.addColorStop(0.4, hexToRgba(tokens.amber, flash * 0.5));
    fr.addColorStop(1, hexToRgba(tokens.amber, 0));
    ctx.fillStyle = fr;
    ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = hexToRgba(tokens.textBright, flash);
    ctx.font = "bold 14px ui-monospace, monospace";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("FINAL FLASH", cx, cy);
  }

  // ── progress bar (warped lifetime clock) ────────────────────────────────
  const barX = PAD;
  const barY = H - 22;
  const barW = W - PAD * 2;
  ctx.strokeStyle = tokens.panelBorder;
  ctx.lineWidth = 1;
  ctx.strokeRect(barX, barY, barW, 8);
  ctx.fillStyle = hexToRgba(tokens.cyan, 0.8);
  ctx.fillRect(barX, barY, barW * Math.min(1, phase), 8);

  // ── HUD ─────────────────────────────────────────────────────────────────
  ctx.textAlign = "left";
  ctx.textBaseline = "top";
  let hy = PAD;
  hy = drawHudReadout(
    ctx,
    PAD,
    hy,
    "M/M₀ = ",
    massFrac.toFixed(3),
    tokens.textDim,
    tokens.cyan,
  );
  drawHudReadout(
    ctx,
    PAD,
    hy,
    "T/T₀ = ",
    `×${tempFactor(massFrac).toFixed(1)}`,
    tokens.textDim,
    glowColor(heat, tokens),
  );

  ctx.font = FONT_HUD_SMALL;
  ctx.fillStyle = tokens.textMute;
  ctx.textAlign = "right";
  ctx.fillText(
    `lifetime elapsed: ${(Math.min(1, phase) * 100).toFixed(1)}%`,
    W - PAD,
    PAD,
  );

  ctx.textAlign = "left";
  ctx.textBaseline = "alphabetic";
}
