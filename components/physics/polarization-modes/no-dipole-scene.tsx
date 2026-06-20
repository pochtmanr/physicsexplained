"use client";

import { useEffect, useRef, useState } from "react";
import {
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
import { massDipole, type Vec2 } from "@/lib/physics/relativity/polarization-modes";

/**
 * FIG.51c — Why there is no dipole gravitational radiation.
 *
 * Two animated mass configurations, side by side.
 *
 * LEFT (dipole attempt): two equal masses oscillating. To radiate a dipole
 *   you would need a time-varying mass dipole Σ mᵢ rᵢ. But Σ mᵢ rᵢ = M·r_cm,
 *   and the centre of mass cannot accelerate without an external force —
 *   momentum is conserved. So the masses can only move symmetrically about a
 *   fixed centre of mass. The mass-dipole vector (drawn as an arrow from the
 *   centre of mass) stays pinned at zero. No dipole radiation.
 *
 * RIGHT (quadrupole): the same two masses, but now the *shape* oscillates —
 *   they breathe in and out along a line, stretching then compressing. The
 *   second moment Σ mᵢ rᵢ rⱼ changes in time even though the dipole does not.
 *   A changing mass quadrupole DOES radiate. This is the lowest multipole
 *   gravity can use, which is why gravitational waves are intrinsically weak.
 */

const PAD = 18;

export function NoDipoleScene() {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const tokens = useSceneTokens();
  const tickRef = useSceneTick(true);
  const [paused, setPaused] = useState(false);
  const phaseRef = useRef(0);
  const { width, height } = useSceneSize(containerRef, {
    ratio: 0.52,
    maxHeight: SCENE_HEIGHT_DEFAULT,
    minHeight: 300,
  });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = applyDpr(canvas, width, height);
    if (!ctx) return;

    let raf = 0;
    let last = tickRef.current;
    const loop = () => {
      const now = tickRef.current;
      if (!paused) phaseRef.current += ((now - last) / 1000) * 1.4;
      last = now;
      draw(ctx, tokens, phaseRef.current, width, height);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [paused, tokens, tickRef, width, height]);

  return (
    <div ref={containerRef} className="relative w-full pb-4">
      <canvas
        ref={canvasRef}
        style={{ width, height, display: "block" }}
        className={SCENE_CANVAS_CLASS}
        aria-label="Two animated mass configurations comparing a forbidden oscillating mass dipole, whose centre of mass stays fixed, with an allowed oscillating mass quadrupole that does radiate."
      />
      <div className="mt-3 flex flex-wrap gap-2 font-mono text-xs">
        <button
          type="button"
          onClick={() => setPaused((p) => !p)}
          className="border border-[var(--color-fg-4)] px-3 py-1 text-[var(--color-fg-3)] hover:text-[var(--color-fg-1)]"
        >
          {paused ? "play" : "pause"}
        </button>
      </div>
    </div>
  );
}

function draw(
  ctx: CanvasRenderingContext2D,
  tokens: SceneTokens,
  phase: number,
  W: number,
  H: number,
) {
  ctx.fillStyle = tokens.bg;
  ctx.fillRect(0, 0, W, H);

  const panelW = (W - PAD * 3) / 2;
  const leftCx = PAD + panelW / 2;
  const rightCx = PAD * 2 + panelW + panelW / 2;
  const cy = H / 2 + 6;
  const sep = Math.min(panelW, H) * 0.26;

  ctx.strokeStyle = tokens.panelBorder;
  ctx.lineWidth = 1;
  ctx.strokeRect(PAD, PAD + 18, panelW, H - PAD * 2 - 30);
  ctx.strokeRect(PAD * 2 + panelW, PAD + 18, panelW, H - PAD * 2 - 30);

  drawSectionTitle(ctx, PAD + 4, PAD - 2, "DIPOLE — FORBIDDEN", tokens.textMute);
  drawSectionTitle(ctx, PAD * 2 + panelW + 4, PAD - 2, "QUADRUPOLE — RADIATES", tokens.textMute);

  const osc = Math.sin(phase);

  // ── LEFT: dipole attempt (symmetric about fixed CoM) ────────────────────
  // Both masses swing the SAME way would move the CoM — forbidden. Momentum
  // conservation forces antisymmetric motion: they swing oppositely, CoM
  // fixed. We show them sliding left/right symmetrically.
  const dx = osc * sep * 0.55;
  const mL1: Vec2 = { x: -sep + dx, y: 0 };
  const mL2: Vec2 = { x: sep + dx, y: 0 };
  // ^ if they moved together (dx same sign) the CoM WOULD move — illustrate
  //   the *naive* attempt, then show the CoM arrow stays pinned because the
  //   physical motion must be the symmetric one. We compute the dipole of
  //   the physically-allowed symmetric configuration instead:
  const symA: Vec2 = { x: -sep - dx, y: 0 };
  const symB: Vec2 = { x: sep + dx, y: 0 };
  const dip = massDipole([1, 1], [symA, symB]);

  drawMass(ctx, leftCx + symA.x, cy + symA.y, tokens.cyan);
  drawMass(ctx, leftCx + symB.x, cy + symB.y, tokens.cyan);

  // CoM marker (pinned) + dipole arrow (≈0)
  ctx.fillStyle = hexToRgba(tokens.textBright, 0.85);
  ctx.beginPath();
  ctx.arc(leftCx, cy, 3, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = hexToRgba(tokens.axes, 0.4);
  ctx.setLineDash([2, 3]);
  ctx.beginPath();
  ctx.moveTo(leftCx, PAD + 30);
  ctx.lineTo(leftCx, H - PAD - 14);
  ctx.stroke();
  ctx.setLineDash([]);

  ctx.fillStyle = tokens.textMute;
  ctx.font = "11px ui-monospace, monospace";
  ctx.textAlign = "center";
  ctx.fillText("centre of mass — pinned", leftCx, H - PAD - 2);
  ctx.textAlign = "left";

  // ── RIGHT: quadrupole (shape oscillates) ────────────────────────────────
  // Same two masses breathe in/out along the line: separation modulates.
  const qsep = sep * (1 + 0.5 * osc);
  const qA: Vec2 = { x: -qsep, y: 0 };
  const qB: Vec2 = { x: qsep, y: 0 };
  // quadrupole scalar Q ~ Σ m x² (traceless part); show its time variation
  const Q = qA.x * qA.x + qB.x * qB.x;

  drawMass(ctx, rightCx + qA.x, cy + qA.y, tokens.magenta);
  drawMass(ctx, rightCx + qB.x, cy + qB.y, tokens.magenta);

  // CoM also pinned, but the second moment changes — draw a breathing ring
  ctx.strokeStyle = hexToRgba(tokens.magenta, 0.3);
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.ellipse(rightCx, cy, qsep + 8, sep * 0.5, 0, 0, Math.PI * 2);
  ctx.stroke();

  ctx.fillStyle = tokens.textMute;
  ctx.font = "11px ui-monospace, monospace";
  ctx.textAlign = "center";
  ctx.fillText("shape oscillates — Q̈ ≠ 0", rightCx, H - PAD - 2);
  ctx.textAlign = "left";

  // ── HUD ─────────────────────────────────────────────────────────────────
  const dipMag = Math.hypot(dip.x, dip.y);
  drawHudReadout(
    ctx,
    PAD + 6,
    PAD + 16,
    "|d/dt mass dipole| = ",
    dipMag.toFixed(2),
    tokens.textDim,
    tokens.cyan,
  );
  drawHudReadout(
    ctx,
    PAD * 2 + panelW + 6,
    PAD + 16,
    "Σ m x² = ",
    Q.toFixed(0),
    tokens.textDim,
    tokens.magenta,
  );
}

function drawMass(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  color: string,
) {
  ctx.fillStyle = hexToRgba(color, 0.18);
  ctx.beginPath();
  ctx.arc(x, y, 13, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(x, y, 7, 0, Math.PI * 2);
  ctx.fill();
}
