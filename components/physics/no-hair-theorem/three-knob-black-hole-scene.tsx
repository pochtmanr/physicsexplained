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
  outerHorizonRadius,
  kerrMassMultipole,
  kerrCurrentMultipole,
} from "@/lib/physics/relativity/no-hair-theorem";

/**
 * FIG.47b — The three-knob black hole.
 *
 * M, J, Q sliders are LITERALLY the entire parameter space of a stationary
 * black hole (the Kerr–Newman family). The central disk renders the horizon:
 * its radius scales with M, it flattens (oblateness ∝ a²) and gains a frame-
 * dragging swirl as J rises, and it tints toward a charged glow + field lines
 * as Q rises. A side panel reads out the FULL Geroch–Hansen multipole tower
 * M_ℓ, S_ℓ — every one locked to (M, J) — driving home that no further numbers
 * exist. Toggling a knob changes the hole; nothing else can.
 *
 * Tokens only; responsive; gentle ref-based animation for the swirl.
 */

const PAD = 16;

export function ThreeKnobBlackHoleScene() {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const tokens = useSceneTokens();
  const tickRef = useSceneTick(true);
  const [mass, setMass] = useState(0.55); // 0..1 → display 1–60 M⊙
  const [spin, setSpin] = useState(0.6); // a* ∈ [0,1)
  const [charge, setCharge] = useState(0.0); // q* ∈ [0,1)
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
    const loop = () => {
      const t = tickRef.current / 1000;
      draw(ctx, tokens, width, height, mass, spin, charge, t);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [tokens, width, height, mass, spin, charge, tickRef]);

  const massSolar = 1 + mass * 59;

  return (
    <div ref={containerRef} className="relative w-full pb-4">
      <canvas
        ref={canvasRef}
        style={{ width, height, display: "block" }}
        className={SCENE_CANVAS_CLASS}
        aria-label="Three sliders — mass M, spin J, charge Q — control the entire parameter space of a stationary black hole. The horizon grows with mass, flattens and swirls with spin, and glows with charge. A side panel lists the full multipole tower, every moment locked to M and J."
      />

      <div className="mt-3 grid grid-cols-1 gap-2 font-mono text-xs text-[var(--color-fg-2)] sm:grid-cols-3">
        <label className="flex flex-col gap-1">
          <span className="text-[var(--color-cyan)]">
            M = {massSolar.toFixed(0)} M⊙
          </span>
          <input
            type="range"
            min={0}
            max={1}
            step={0.01}
            value={mass}
            onChange={(e) => setMass(parseFloat(e.target.value))}
            style={{ accentColor: "var(--color-cyan)" }}
          />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-[var(--color-magenta)]">
            J → a* = {spin.toFixed(2)}
          </span>
          <input
            type="range"
            min={0}
            max={0.99}
            step={0.01}
            value={spin}
            onChange={(e) => setSpin(parseFloat(e.target.value))}
            style={{ accentColor: "var(--color-magenta)" }}
          />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-[var(--color-amber)]">
            Q → q* = {charge.toFixed(2)}
          </span>
          <input
            type="range"
            min={0}
            max={0.99}
            step={0.01}
            value={charge}
            onChange={(e) => setCharge(parseFloat(e.target.value))}
            style={{ accentColor: "var(--color-amber)" }}
          />
        </label>
      </div>
      <p className="mt-2 font-mono text-xs text-[var(--color-fg-3)]">
        These three numbers are the whole hole. There is no fourth slider.
      </p>
    </div>
  );
}

function draw(
  ctx: CanvasRenderingContext2D,
  tokens: SceneTokens,
  W: number,
  H: number,
  mass: number,
  spin: number,
  charge: number,
  t: number,
) {
  ctx.fillStyle = tokens.bg;
  ctx.fillRect(0, 0, W, H);

  // Left = the hole; right = multipole tower.
  const leftX0 = PAD;
  const panelY0 = PAD + 22;
  const panelH = H - PAD * 2 - 22;
  const towerW = Math.min(W * 0.34, 220);
  const leftW = W - PAD * 2 - towerW - 20;
  const rightX0 = leftX0 + leftW + 20;

  drawSectionTitle(ctx, leftX0, panelY0 - 18, "THE HORIZON", tokens.textMute);

  const cx = leftX0 + leftW / 2;
  const cy = panelY0 + panelH / 2;
  // M sets size; r_+ (units of M) sets the relative shrink with spin.
  const rPlus = outerHorizonRadius(spin); // 2 → ~1
  const baseR = Math.min(leftW, panelH) * 0.34;
  const sizeFromMass = 0.55 + mass * 0.45;
  const R = baseR * sizeFromMass * (rPlus / 2);
  // Oblateness from spin: a² flattening of the apparent disk.
  const flatten = 1 - 0.28 * spin * spin;

  ctx.save();
  ctx.translate(cx, cy);

  // Charge glow halo (amber) when Q > 0.
  if (charge > 0.01) {
    const halo = ctx.createRadialGradient(0, 0, R * 0.7, 0, 0, R * 2.1);
    halo.addColorStop(0, hexToRgba(tokens.amber, 0.0));
    halo.addColorStop(0.5, hexToRgba(tokens.amber, 0.18 * charge));
    halo.addColorStop(1, hexToRgba(tokens.amber, 0));
    ctx.fillStyle = halo;
    ctx.beginPath();
    ctx.ellipse(0, 0, R * 2.1, R * 2.1 * flatten, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  // Photon-ring / ergosphere hint (outer dashed ellipse) when spinning.
  if (spin > 0.02) {
    ctx.beginPath();
    ctx.ellipse(0, 0, R * 1.45, R * 1.45 * flatten, 0, 0, Math.PI * 2);
    ctx.setLineDash([4, 5]);
    ctx.strokeStyle = hexToRgba(tokens.magenta, 0.35 + 0.4 * spin);
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.setLineDash([]);
  }

  // Frame-dragging swirl: rotating arcs whose speed ∝ spin.
  if (spin > 0.02) {
    const arms = 5;
    const swirl = t * (0.3 + spin * 1.6);
    for (let i = 0; i < arms; i++) {
      const a0 = swirl + (i / arms) * Math.PI * 2;
      ctx.beginPath();
      for (let s = 0; s <= 24; s++) {
        const f = s / 24;
        const rr = R * (1.05 + f * 0.5);
        const ang = a0 + f * 2.2;
        const px = rr * Math.cos(ang);
        const py = rr * Math.sin(ang) * flatten;
        if (s === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.strokeStyle = hexToRgba(tokens.magenta, 0.18 + 0.22 * spin);
      ctx.lineWidth = 1;
      ctx.stroke();
    }
  }

  // The horizon disk: dark interior with a thin bright rim.
  const diskGrad = ctx.createRadialGradient(0, 0, R * 0.1, 0, 0, R);
  diskGrad.addColorStop(0, hexToRgba(tokens.bg, 1));
  diskGrad.addColorStop(0.82, hexToRgba(tokens.bg, 1));
  diskGrad.addColorStop(1, hexToRgba(tokens.bg1, 1));
  ctx.beginPath();
  ctx.ellipse(0, 0, R, R * flatten, 0, 0, Math.PI * 2);
  ctx.fillStyle = diskGrad;
  ctx.fill();
  // Rim: cyan at zero charge, warming to amber as charge rises.
  // We draw two overlapping strokes — cyan fades out while amber fades in.
  ctx.lineWidth = 2;
  if (charge < 0.98) {
    ctx.strokeStyle = hexToRgba(tokens.cyan, 0.9 * (1 - charge));
    ctx.stroke();
    ctx.beginPath();
    ctx.ellipse(0, 0, R, R * flatten, 0, 0, Math.PI * 2);
  }
  ctx.strokeStyle = hexToRgba(tokens.amber, 0.9 * charge);
  ctx.stroke();

  // Radial electric field lines when charged.
  if (charge > 0.02) {
    const lines = 16;
    for (let i = 0; i < lines; i++) {
      const ang = (i / lines) * Math.PI * 2;
      const r0 = R * 1.02;
      const r1 = R * (1.2 + 0.5 * charge);
      ctx.beginPath();
      ctx.moveTo(r0 * Math.cos(ang), r0 * Math.sin(ang) * flatten);
      ctx.lineTo(r1 * Math.cos(ang), r1 * Math.sin(ang) * flatten);
      ctx.strokeStyle = hexToRgba(tokens.amber, 0.25 + 0.45 * charge);
      ctx.lineWidth = 1;
      ctx.stroke();
    }
  }

  // Spin axis arrow when spinning.
  if (spin > 0.02) {
    ctx.strokeStyle = hexToRgba(tokens.magenta, 0.7);
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.moveTo(0, -R * flatten - 4);
    ctx.lineTo(0, -R * flatten - 22 - 18 * spin);
    ctx.stroke();
  }
  ctx.restore();

  // ── RIGHT: the multipole tower ────────────────────────────────────────────
  drawSectionTitle(ctx, rightX0, panelY0 - 18, "MULTIPOLES", tokens.textMute);
  ctx.strokeStyle = tokens.panelBorder;
  ctx.lineWidth = 1;
  ctx.strokeRect(rightX0, panelY0, towerW, panelH);

  let y = panelY0 + 10;
  const x = rightX0 + 10;
  ctx.font = FONT_HUD_SMALL;
  ctx.textBaseline = "top";

  // Header lines for M, J, Q themselves.
  y = drawHudReadout(ctx, x, y, "M  = ", `${(1 + mass * 59).toFixed(0)} M⊙`, tokens.textDim, tokens.cyan, 16);
  y = drawHudReadout(ctx, x, y, "a* = ", spin.toFixed(2), tokens.textDim, tokens.magenta, 16);
  y = drawHudReadout(ctx, x, y, "q* = ", charge.toFixed(2), tokens.textDim, tokens.amber, 16);

  y += 4;
  ctx.fillStyle = tokens.textFaint;
  ctx.fillText("locked to (M, J):", x, y);
  y += 16;

  // Geroch–Hansen tower (units of M). Mass moments even ℓ, current moments odd.
  const rows: { label: string; val: number; color: string }[] = [
    { label: "M₀ = M", val: kerrMassMultipole(spin, 0), color: tokens.cyan },
    { label: "S₁ = J", val: kerrCurrentMultipole(spin, 1), color: tokens.magenta },
    { label: "M₂", val: kerrMassMultipole(spin, 2), color: tokens.cyan },
    { label: "S₃", val: kerrCurrentMultipole(spin, 3), color: tokens.magenta },
    { label: "M₄", val: kerrMassMultipole(spin, 4), color: tokens.cyan },
  ];
  for (const row of rows) {
    drawHudReadout(
      ctx,
      x,
      y,
      `${row.label} = `,
      row.val.toFixed(3),
      tokens.textDim,
      row.color,
      16,
    );
    y += 16;
  }

  y += 4;
  ctx.fillStyle = tokens.textFaint;
  ctx.fillText("M₂ = −a² (no free q)", x, y);
}

function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t;
}
